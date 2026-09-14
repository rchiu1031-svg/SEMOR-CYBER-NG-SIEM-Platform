use anyhow::Result;
use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::net::{TcpListener, UnixListener};
use tracing::{error, info};

use crate::block::BlockBuilder;
use crate::storage::VictoriaStorageEngine;
use crate::stream::StreamManager;

#[derive(Debug, serde::Deserialize)]
struct InboundBatch {
    stream_id: Option<u64>,
    stream_labels: Option<BTreeMap<String, String>>,
    entries: Vec<InboundEntry>,
}

#[derive(Debug, serde::Deserialize)]
struct InboundEntry {
    timestamp: i64,
    raw_msg: String,
}

pub struct IpcServer {
    storage: Arc<VictoriaStorageEngine>,
    stream_mgr: Arc<StreamManager>,
    uds_path: String,
    tcp_addr: String,
}

impl IpcServer {
    pub fn new(
        storage: Arc<VictoriaStorageEngine>,
        stream_mgr: Arc<StreamManager>,
        uds_path: &str,
        tcp_addr: &str,
    ) -> Self {
        IpcServer {
            storage,
            stream_mgr,
            uds_path: uds_path.to_string(),
            tcp_addr: tcp_addr.to_string(),
        }
    }

    /// 啟動 UDS (Unix Domain Socket) 監聽
    pub async fn run_uds(&self) -> Result<()> {
        let path = Path::new(&self.uds_path);
        if path.exists() {
            let _ = std::fs::remove_file(path);
        }

        let listener = UnixListener::bind(path)?;
        info!("[Rust 儲存核心] UDS IPC 監聽就緒: {}", self.uds_path);

        loop {
            match listener.accept().await {
                Ok((stream, _)) => {
                    let storage = self.storage.clone();
                    let stream_mgr = self.stream_mgr.clone();
                    tokio::spawn(async move {
                        let (reader, _) = stream.into_split();
                        let mut lines = BufReader::new(reader).lines();
                        while let Ok(Some(line)) = lines.next_line().await {
                            if let Err(e) = Self::process_batch_line(&line, &storage, &stream_mgr) {
                                error!("處理 UDS 批次日誌失敗: {:?}", e);
                            }
                        }
                    });
                }
                Err(e) => error!("UDS 連線異常: {:?}", e),
            }
        }
    }

    /// 啟動 TCP 監聽 (供遠端或跨容器節點傳輸)
    pub async fn run_tcp(&self) -> Result<()> {
        let listener = TcpListener::bind(&self.tcp_addr).await?;
        info!("[Rust 儲存核心] TCP IPC 監聽就緒: {}", self.tcp_addr);

        loop {
            match listener.accept().await {
                Ok((stream, addr)) => {
                    info!("接受來自 Go 收集器 TCP 連線: {}", addr);
                    let storage = self.storage.clone();
                    let stream_mgr = self.stream_mgr.clone();
                    tokio::spawn(async move {
                        let (reader, _) = stream.into_split();
                        let mut lines = BufReader::new(reader).lines();
                        while let Ok(Some(line)) = lines.next_line().await {
                            if let Err(e) = Self::process_batch_line(&line, &storage, &stream_mgr) {
                                error!("處理 TCP 批次日誌失敗: {:?}", e);
                            }
                        }
                    });
                }
                Err(e) => error!("TCP 連線異常: {:?}", e),
            }
        }
    }

    fn process_batch_line(
        line: &str,
        storage: &Arc<VictoriaStorageEngine>,
        stream_mgr: &Arc<StreamManager>,
    ) -> Result<()> {
        if line.trim().is_empty() {
            return Ok(());
        }

        let batch: InboundBatch = serde_json::from_str(line)?;
        let stream_id = if let Some(labels) = &batch.stream_labels {
            stream_mgr.get_or_create_stream_id(labels)
        } else {
            batch.stream_id.unwrap_or(1001)
        };

        // 構建並壓縮成 VictoriaBlock (以 4096 筆或 2MB 為 Block 封裝邊界)
        let mut block_seq = 1u32;
        let active_part_tag = format!("part_active_{}", stream_id);
        let mut builder = BlockBuilder::new(stream_id, &active_part_tag, block_seq, 4096, 2 * 1024 * 1024);

        for entry in batch.entries {
            builder.add_row(entry.timestamp, &entry.raw_msg);
            if builder.is_full() {
                // 當前 Block 滿載，立即寫入磁碟並開啟新 Block
                let block = builder.build()?;
                storage.append_block(&block)?;
                block_seq += 1;
                builder = BlockBuilder::new(stream_id, &active_part_tag, block_seq, 4096, 2 * 1024 * 1024);
            }
        }

        if !builder.is_empty() {
            let block = builder.build()?;
            storage.append_block(&block)?;
        }

        Ok(())
    }
}

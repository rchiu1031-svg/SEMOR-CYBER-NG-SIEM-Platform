use anyhow::Result;
use std::sync::Arc;
use std::time::Duration;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

mod block;
mod bloom;
mod ipc_server;
mod storage;
mod stream;

use ipc_server::IpcServer;
use storage::VictoriaStorageEngine;
use stream::StreamManager;

const APP_NAME: &str = "SEMOR VictoriaLogs Storage Core (Rust Engine)";
const APP_VERSION: &str = "v1.0.0-Block-Engine";

#[tokio::main]
async fn main() -> Result<()> {
    // 1. 初始化結構化日誌記錄器
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    println!("========================================================");
    println!("   {}", APP_NAME);
    println!("   壓縮引擎: VictoriaLogs Block + Delta-of-Delta + ZSTD");
    println!("   儲存分區結構: /data/{{stream_id}}/{{part_id}}.block");
    println!("   版本: {}", APP_VERSION);
    println!("========================================================");

    let data_dir = std::env::var("VLOG_DATA_DIR").unwrap_or_else(|_| "/data".to_string());
    let uds_path = std::env::var("RUST_UDS_PATH").unwrap_or_else(|_| "/tmp/semor_rust.sock".to_string());
    let tcp_addr = std::env::var("RUST_TCP_ADDR").unwrap_or_else(|_| "127.0.0.1:9527".to_string());

    // 2. 初始化 Stream 管理器與儲存引擎
    let stream_mgr = Arc::new(StreamManager::new());
    let storage = Arc::new(VictoriaStorageEngine::open(&data_dir, stream_mgr.clone())?);

    info!("儲存引擎分區結構就緒: {}/{{stream_id}}/{{part_id}}.block", data_dir);

    // 3. 建立 IPC 服務實例
    let ipc = Arc::new(IpcServer::new(
        storage.clone(),
        stream_mgr.clone(),
        &uds_path,
        &tcp_addr,
    ));

    // 4. 背景啟動 UDS IPC 監聽
    let ipc_uds = ipc.clone();
    tokio::spawn(async move {
        if let Err(e) = ipc_uds.run_uds().await {
            tracing::error!("UDS 服務異常中斷: {:?}", e);
        }
    });

    // 5. 背景啟動 TCP IPC 備援監聽
    let ipc_tcp = ipc.clone();
    tokio::spawn(async move {
        if let Err(e) = ipc_tcp.run_tcp().await {
            tracing::error!("TCP 服務異常中斷: {:?}", e);
        }
    });

    // 6. 啟動定期遙測報告器 (向終端輸出壓縮效能與塊計量)
    let storage_telemetry = storage.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            let stats = storage_telemetry.stats();
            let uncomp_mb = stats.uncompressed_bytes as f64 / (1024.0 * 1024.0);
            let comp_mb = stats.compressed_bytes as f64 / (1024.0 * 1024.0);

            info!(
                "[儲存核心遙測] 串流數: {} | Part分區數: {} | 總Block塊數: {} | 總筆數: {} | 原始: {:.2} MB | 壓縮後: {:.2} MB | 壓縮比率: {:.2}x",
                stats.total_streams, stats.total_parts, stats.total_blocks, stats.total_rows, uncomp_mb, comp_mb, stats.compression_ratio
            );
        }
    });

    // 7. 優雅關閉監聽
    tokio::signal::ctrl_c().await?;
    info!("接收到關閉信號，正在將記憶體緩衝區落盤並安全退出...");
    Ok(())
}

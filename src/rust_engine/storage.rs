//! ============================================================================
//! SEMOR Storage Core - VictoriaLogs Storage Engine & WriteManager with WAL (Stage 2)
//! File: /src/rust_engine/storage.rs
//!
//! 本模組實作 VictoriaLogs 高吞吐寫入協調器 (WriteManager)、
//! Write-Ahead Log (WAL) 預寫日誌持久化與崩潰復原機制、以及核心儲存引擎 (StorageEngine)：
//!
//! 1. Write-Ahead Log (WAL):
//!    - 在日誌進入記憶體緩衝區 (BlockBuilder) 前，先循序寫入預寫日誌檔 (/data/{stream_id}/wal_{seq}.wal)。
//!    - 每筆記錄格式: [CRC32: 4B] [Timestamp: 8B] [Message Length: 4B] [Message Payload]
//!    - 提供即時 fsync 與批次 flush 選項，防止突然斷電或崩潰導致記憶體中尚未打包成 Block 的日誌遺失。
//!    - 當 Block 成功 Commit 落盤至 .block 檔案後，自動回收或截斷已確認的 WAL 區段。
//!    - 開機時自動執行 WAL 崩潰復原 (WAL Crash Recovery)，將未封裝的殘存日誌重新重播至記憶體緩衝區。
//!
//! 2. WriteManager (寫入管理器):
//!    - 協調日誌資料流自 WAL -> 記憶體緩衝區 (BlockBuilder) -> ActivePartWriter。
//!    - 記憶體容量警戒與背壓控制 (Backpressure & Memory Budgeting)。
//!    - 定時與閾值自動 Flush 機制，確保高吞吐下的寫入原子性與資料完整性。
//!
//! 3. StorageEngine:
//!    - 嚴格對齊磁碟目錄佈局: /data/{stream_id}/{part_id}.block
//!    - 實作單一 Part 達 16,384 筆或 16MB 時之無鎖/安全序號輪轉 (Rotation)。
//!    - 開機冷啟動零解壓復原 (Zero-Decompression Cold Recovery) 與三層剪枝查詢。
//! ============================================================================

use anyhow::{bail, Context, Result};
use byteorder::{BigEndian, ReadBytesExt, WriteBytesExt};
use crc32fast::Hasher as Crc32Hasher;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{create_dir_all, read_dir, remove_file, File, OpenOptions};
use std::io::{BufReader, BufWriter, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tracing::{debug, error, info, warn};

use crate::rust_engine::block::{
    BlockBuilder, VictoriaBlock, VictoriaBlockHeader,
    DEFAULT_MAX_BLOCK_BYTES, DEFAULT_MAX_BLOCK_ROWS,
};
use crate::rust_engine::index::{
    BlockHeaderIndex, IndexedBlockMeta, SearchQuery, SearchResponse,
};
use crate::rust_engine::part::{
    scan_part_file_headers, ActivePartWriter, BlockIndexEntry, PartMetadata, PartState,
    DEFAULT_MAX_PART_BYTES, DEFAULT_MAX_PART_ROWS,
};

/// WAL 魔術字: "VWAL"
pub const WAL_MAGIC: [u8; 4] = *b"VWAL";
/// WAL 格式版本
pub const WAL_VERSION: u16 = 1;

// ============================================================================
// 1. Write-Ahead Log (WAL) 實作
// ============================================================================

/// 單筆 WAL 記錄
#[derive(Debug, Clone)]
pub struct WalRecord {
    pub timestamp: i64,
    pub message: String,
}

/// 串流專屬 Write-Ahead Log 寫入器與管理者
pub struct StreamWal {
    pub stream_id: u64,
    pub wal_path: PathBuf,
    pub sequence: u64,
    writer: BufWriter<File>,
    pub written_records: u64,
    pub written_bytes: u64,
}

impl StreamWal {
    /// 建立或開啟該 Stream 的 WAL 檔案 (位於 /data/{stream_id}/wal_{seq}.wal)
    pub fn open_or_create(stream_dir: &Path, stream_id: u64, sequence: u64) -> Result<Self> {
        create_dir_all(stream_dir)
            .with_context(|| format!("建立串流目錄失敗: {:?}", stream_dir))?;

        let wal_filename = format!("wal_{:016x}.wal", sequence);
        let wal_path = stream_dir.join(&wal_filename);

        let is_new = !wal_path.exists();
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&wal_path)
            .with_context(|| format!("開啟 WAL 檔案失敗: {:?}", wal_path))?;

        let mut writer = BufWriter::with_capacity(64 * 1024, file);

        // 若是全新建立的 WAL 檔案，先寫入檔頭魔術字與版本號
        if is_new {
            writer.write_all(&WAL_MAGIC)?;
            writer.write_u16::<BigEndian>(WAL_VERSION)?;
            writer.write_u64::<BigEndian>(stream_id)?;
            writer.flush()?;
        }

        Ok(StreamWal {
            stream_id,
            wal_path,
            sequence,
            writer,
            written_records: 0,
            written_bytes: 0,
        })
    }

    /// 追加單筆日誌至 WAL：計算 CRC32 校驗碼並寫入磁碟緩衝區
    /// 格式: [CRC32: 4B] [Timestamp: 8B] [MsgLen: 4B] [Msg Payload]
    pub fn append(&mut self, timestamp: i64, message: &str) -> Result<usize> {
        let msg_bytes = message.as_bytes();
        let msg_len = msg_bytes.len() as u32;

        // 計算 CRC32 (包含時間戳與訊息本文)
        let mut hasher = Crc32Hasher::new();
        hasher.update(&timestamp.to_be_bytes());
        hasher.update(&msg_len.to_be_bytes());
        hasher.update(msg_bytes);
        let checksum = hasher.finalize();

        self.writer.write_u32::<BigEndian>(checksum)?;
        self.writer.write_i64::<BigEndian>(timestamp)?;
        self.writer.write_u32::<BigEndian>(msg_len)?;
        self.writer.write_all(msg_bytes)?;

        let total_entry_bytes = 4 + 8 + 4 + msg_bytes.len();
        self.written_records += 1;
        self.written_bytes += total_entry_bytes as u64;

        Ok(total_entry_bytes)
    }

    /// 將 WAL 緩衝區強制 Flush 至磁碟
    pub fn flush(&mut self) -> Result<()> {
        self.writer.flush().context("Flush WAL 緩衝區失敗")?;
        Ok(())
    }

    /// 將 WAL 強制 sync_all 落盤至實體硬碟 (防止突然掉電)
    pub fn sync(&mut self) -> Result<()> {
        self.writer.flush()?;
        self.writer.get_ref().sync_all().context("Sync WAL 檔案至實體硬碟失敗")?;
        Ok(())
    }

    /// 截斷與重設 WAL：當 BlockBuilder 的日誌已成功被 Commit 落盤至 .block 檔案後呼叫
    pub fn truncate_and_reset(&mut self) -> Result<()> {
        self.writer.flush()?;
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&self.wal_path)
            .with_context(|| format!("重設 WAL 檔案失敗: {:?}", self.wal_path))?;

        let mut writer = BufWriter::with_capacity(64 * 1024, file);
        writer.write_all(&WAL_MAGIC)?;
        writer.write_u16::<BigEndian>(WAL_VERSION)?;
        writer.write_u64::<BigEndian>(self.stream_id)?;
        writer.flush()?;

        self.writer = writer;
        self.written_records = 0;
        self.written_bytes = 0;
        debug!("[WAL 重設] Stream #{} 之 WAL 檔案已截斷重設", self.stream_id);
        Ok(())
    }

    /// 從指定的 .wal 檔案中讀取並復原未提交之有效記錄 (Crash Recovery)
    pub fn recover_from_file(wal_path: &Path) -> Result<Vec<WalRecord>> {
        if !wal_path.exists() {
            return Ok(Vec::new());
        }

        let file = match File::open(wal_path) {
            Ok(f) => f,
            Err(e) => {
                warn!("無法開啟 WAL 檔案 {:?}: {}", wal_path, e);
                return Ok(Vec::new());
            }
        };

        let mut reader = BufReader::new(file);
        let mut magic = [0u8; 4];
        if reader.read_exact(&mut magic).is_err() || magic != WAL_MAGIC {
            warn!("WAL 檔案 {:?} 魔術字不符，略過復原", wal_path);
            return Ok(Vec::new());
        }

        let version = reader.read_u16::<BigEndian>().unwrap_or(0);
        if version != WAL_VERSION {
            warn!("WAL 檔案 {:?} 版本不符 (版本: {})", wal_path, version);
            return Ok(Vec::new());
        }

        let _stream_id = reader.read_u64::<BigEndian>().unwrap_or(0);
        let mut recovered_records = Vec::new();
        let mut corrupt_entries = 0;

        loop {
            // 讀取 CRC32
            let expected_checksum = match reader.read_u32::<BigEndian>() {
                Ok(crc) => crc,
                Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => break,
                Err(_) => break,
            };

            // 讀取 Timestamp
            let timestamp = match reader.read_i64::<BigEndian>() {
                Ok(ts) => ts,
                Err(_) => break,
            };

            // 讀取 MsgLen
            let msg_len = match reader.read_u32::<BigEndian>() {
                Ok(len) => len as usize,
                Err(_) => break,
            };

            // 讀取 Msg Payload
            let mut msg_buf = vec![0u8; msg_len];
            if reader.read_exact(&mut msg_buf).is_err() {
                corrupt_entries += 1;
                break;
            }

            // 驗證 CRC32 完整性
            let mut hasher = Crc32Hasher::new();
            hasher.update(&timestamp.to_be_bytes());
            hasher.update(&(msg_len as u32).to_be_bytes());
            hasher.update(&msg_buf);
            let computed_checksum = hasher.finalize();

            if expected_checksum != computed_checksum {
                warn!(
                    "WAL 條目 CRC32 校驗失敗 (記錄值: 0x{:08X}, 計算值: 0x{:08X})，停止後續復原以保安全",
                    expected_checksum, computed_checksum
                );
                corrupt_entries += 1;
                break;
            }

            if let Ok(msg_str) = String::from_utf8(msg_buf) {
                recovered_records.push(WalRecord {
                    timestamp,
                    message: msg_str,
                });
            }
        }

        if corrupt_entries > 0 {
            warn!(
                "WAL 復原完成，略過 {} 筆不完整或毀損條目",
                corrupt_entries
            );
        }

        Ok(recovered_records)
    }
}

// ============================================================================
// 2. 寫入管理器配置 (WriteManagerConfig)
// ============================================================================

/// 寫入管理器配置
#[derive(Debug, Clone)]
pub struct WriteManagerConfig {
    /// 單一 Block 最大行數 (預設 4,096)
    pub max_block_rows: usize,
    /// 單一 Block 最大位元組數 (預設 2 MB)
    pub max_block_bytes: usize,
    /// 單一 Part 最大行數 (預設 16,384)
    pub max_part_rows: u64,
    /// 單一 Part 最大位元組數 (預設 16 MB)
    pub max_part_bytes: u64,
    /// 記憶體緩衝區最大容許位元組數 (超過則啟動背壓控制，預設 64 MB)
    pub max_memory_buffer_bytes: usize,
    /// 記憶體緩衝區自動 Flush 最長等待時間 (預設 5 秒)
    pub flush_interval: Duration,
    /// 是否每次寫入 WAL 都立即執行 fsync (預設 false: 由作業系統快取 + 週期性 flush，提供最高吞吐)
    pub wal_sync_on_write: bool,
}

impl Default for WriteManagerConfig {
    fn default() -> Self {
        WriteManagerConfig {
            max_block_rows: DEFAULT_MAX_BLOCK_ROWS,
            max_block_bytes: DEFAULT_MAX_BLOCK_BYTES,
            max_part_rows: DEFAULT_MAX_PART_ROWS,
            max_part_bytes: DEFAULT_MAX_PART_BYTES,
            max_memory_buffer_bytes: 64 * 1024 * 1024, // 64 MB
            flush_interval: Duration::from_secs(5),
            wal_sync_on_write: false,
        }
    }
}

/// 串流專屬儲存與緩衝結構 (StreamStorage)
pub struct StreamStorage {
    pub stream_id: u64,
    /// 串流專屬 Write-Ahead Log 寫入器
    pub wal: Option<StreamWal>,
    /// 記憶體中進行中的日誌區塊構建器 (Memory Buffer)
    pub current_builder: Option<BlockBuilder>,
    /// 該串流目前累積的 Block 序號
    pub current_block_id: u32,
    /// 上次寫入或 Flush 時間戳
    pub last_flush_instant: Instant,
    /// 目前活躍寫入的分區檔案控制代碼 (ActivePartWriter)
    pub active_writer: Option<ActivePartWriter>,
    /// 目前串流的 Part 序號產生器 (原子遞增)
    pub current_part_seq: AtomicU64,
    /// 已封存的 Part 中繼資料 (依序號排列)
    pub sealed_parts: Vec<PartMetadata>,
    /// 所有 Block 的二進位索引緩衝 (記憶體常駐，免解壓縮)
    pub block_index: Vec<BlockIndexEntry>,
    /// 串流總日誌行數累計
    pub total_rows: AtomicU64,
    /// 串流磁碟落盤大小累計 (Bytes)
    pub total_disk_bytes: AtomicU64,
}

impl StreamStorage {
    pub fn new(stream_id: u64, initial_seq: u64) -> Self {
        StreamStorage {
            stream_id,
            wal: None,
            current_builder: None,
            current_block_id: 1,
            last_flush_instant: Instant::now(),
            active_writer: None,
            current_part_seq: AtomicU64::new(initial_seq),
            sealed_parts: Vec::new(),
            block_index: Vec::new(),
            total_rows: AtomicU64::new(0),
            total_disk_bytes: AtomicU64::new(0),
        }
    }
}

// ============================================================================
// 3. WriteManager (寫入協調管理器)
// ============================================================================

/// WriteManager 協調高吞吐日誌資料流：
/// WAL 持久化 -> 記憶體緩衝區 (BlockBuilder) -> ActivePartWriter 落盤
pub struct WriteManager {
    /// 關聯的底層儲存引擎核心
    engine: Arc<StorageEngine>,
    /// 運作配置
    config: WriteManagerConfig,
    /// 當前記憶體緩衝佔用大小估算 (Bytes)
    memory_buffer_bytes: AtomicUsize,
    /// 是否啟動背壓限制旗標
    is_throttled: AtomicBool,
    /// 寫入計數器
    ingested_rows: AtomicU64,
    ingested_bytes: AtomicU64,
    wal_bytes_written: AtomicU64,
}

impl WriteManager {
    /// 初始化寫入管理器實例，並對既有串流執行 WAL 崩潰復原
    pub fn new(engine: Arc<StorageEngine>, config: WriteManagerConfig) -> Result<Arc<Self>> {
        let mgr = Arc::new(WriteManager {
            engine,
            config,
            memory_buffer_bytes: AtomicUsize::new(0),
            is_throttled: AtomicBool::new(false),
            ingested_rows: AtomicU64::new(0),
            ingested_bytes: AtomicU64::new(0),
            wal_bytes_written: AtomicU64::new(0),
        });

        // 啟動時自動掃描 WAL 檔案執行崩潰復原 (WAL Crash Recovery)
        mgr.recover_wal_uncommitted_records()?;

        Ok(mgr)
    }

    /// 掃描資料目錄下的 WAL 檔案，將尚未 Commit 至 .block 的日誌重新注入記憶體緩衝區
    fn recover_wal_uncommitted_records(&self) -> Result<()> {
        let data_dir = &self.engine.data_dir;
        if !data_dir.exists() {
            return Ok(());
        }

        let stream_entries = match read_dir(data_dir) {
            Ok(e) => e,
            Err(_) => return Ok(()),
        };

        for entry in stream_entries.flatten() {
            let stream_path = entry.path();
            if !stream_path.is_dir() {
                continue;
            }

            let folder_name = match stream_path.file_name().and_then(|n| n.to_str()) {
                Some(n) => n,
                None => continue,
            };

            let stream_id = match folder_name.parse::<u64>() {
                Ok(id) => id,
                Err(_) => continue,
            };

            // 尋找該 Stream 資料夾下的 .wal 檔案
            if let Ok(files) = read_dir(&stream_path) {
                for file_entry in files.flatten() {
                    let path = file_entry.path();
                    if path.extension().and_then(|e| e.to_str()) == Some("wal") {
                        let records = StreamWal::recover_from_file(&path)?;
                        if !records.is_empty() {
                            info!(
                                "[WAL 崩潰復原] 發現 Stream #{} 未提交 WAL 檔案 {:?}，復原 {} 筆日誌...",
                                stream_id, path, records.len()
                            );

                            for r in records {
                                // 重新將日誌放回記憶體緩衝區
                                self.ingest_row_internal(stream_id, r.timestamp, &r.message, false)?;
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// 內部核心日誌寫入方法 (支援選擇是否寫入 WAL)
    fn ingest_row_internal(
        &self,
        stream_id: u64,
        timestamp: i64,
        message: &str,
        write_wal: bool,
    ) -> Result<()> {
        let msg_len = message.len() + 8;

        // 1. 背壓控制 (Backpressure check): 當記憶體超過警戒值時強制執行 Flush
        let current_mem = self.memory_buffer_bytes.load(Ordering::Relaxed);
        if current_mem >= self.config.max_memory_buffer_bytes {
            self.is_throttled.store(true, Ordering::Relaxed);
            warn!(
                "[WriteManager 背壓警戒] 記憶體緩衝已達 {} MB，立即觸發全局 Flush！",
                current_mem / (1024 * 1024)
            );
            self.flush_all()?;
            self.is_throttled.store(false, Ordering::Relaxed);
        }

        let mut streams = self.engine.streams.write();
        let stream_storage = streams.entry(stream_id).or_insert_with(|| {
            StreamStorage::new(stream_id, 1)
        });

        // 2. 寫入 WAL (Write-Ahead Log) 保障耐久性 (Durability)
        if write_wal {
            let stream_dir = self.engine.data_dir.join(stream_id.to_string());
            if stream_storage.wal.is_none() {
                let wal = StreamWal::open_or_create(&stream_dir, stream_id, 1)?;
                stream_storage.wal = Some(wal);
            }

            if let Some(ref mut wal) = stream_storage.wal {
                let wal_bytes = wal.append(timestamp, message)?;
                self.wal_bytes_written.fetch_add(wal_bytes as u64, Ordering::Relaxed);

                if self.config.wal_sync_on_write {
                    wal.sync()?;
                }
            }
        }

        // 3. 確保目前有作用中的 ActivePartWriter
        if stream_storage.active_writer.is_none() {
            self.engine.rotate_active_part(stream_storage)?;
        }

        let current_part_id = stream_storage
            .active_writer
            .as_ref()
            .map(|w| w.part_id.clone())
            .unwrap_or_else(|| "part_0000000000000001".to_string());

        // 4. 初始化或取得記憶體中的 BlockBuilder
        if stream_storage.current_builder.is_none() {
            let block_id = stream_storage.current_block_id;
            stream_storage.current_builder = Some(BlockBuilder::new(
                stream_id,
                &current_part_id,
                block_id,
                self.config.max_block_rows,
                self.config.max_block_bytes,
            ));
        }

        let builder = stream_storage.current_builder.as_mut().unwrap();
        builder.add_row(timestamp, message);

        self.memory_buffer_bytes.fetch_add(msg_len, Ordering::Relaxed);
        self.ingested_rows.fetch_add(1, Ordering::Relaxed);
        self.ingested_bytes.fetch_add(msg_len as u64, Ordering::Relaxed);

        // 5. 檢查緩衝區是否已達單一 Block 上限 (4,096 筆或 2 MB)
        if builder.is_full() {
            let full_builder = stream_storage.current_builder.take().unwrap();
            let builder_mem = full_builder.uncompressed_bytes();

            // 執行 ZSTD 壓縮、Delta-of-Delta 時間戳編碼與 CRC32 校驗
            let block = full_builder.build().context("建構 VictoriaBlock 失敗")?;

            // 呼叫底層 ActivePartWriter 將 Block 二進位 Frame 寫入永久磁碟檔案 (.block)
            self.engine.write_block_internal(stream_storage, &block)?;

            // 6. 成功 Commit 至永久儲存，安全重設 WAL 避免空間膨脹
            if let Some(ref mut wal) = stream_storage.wal {
                let _ = wal.truncate_and_reset();
            }

            // 更新序號與緩衝指標
            stream_storage.current_block_id += 1;
            stream_storage.last_flush_instant = Instant::now();
            self.memory_buffer_bytes.fetch_sub(builder_mem.min(self.memory_buffer_bytes.load(Ordering::Relaxed)), Ordering::Relaxed);
        }

        Ok(())
    }

    /// 高吞吐進線寫入單筆日誌 (具備 WAL 預寫保證)
    pub fn ingest_row(&self, stream_id: u64, timestamp: i64, message: &str) -> Result<()> {
        self.ingest_row_internal(stream_id, timestamp, message, true)
    }

    /// 批次進線寫入日誌 (Batch Ingestion)
    pub fn ingest_batch(&self, stream_id: u64, logs: &[(i64, String)]) -> Result<usize> {
        for (ts, msg) in logs {
            self.ingest_row(stream_id, *ts, msg)?;
        }
        Ok(logs.len())
    }

    /// 將特定串流目前的記憶體緩衝區打包為 Block，落盤至 ActivePartWriter，並重設 WAL
    pub fn flush_stream(&self, stream_id: u64) -> Result<bool> {
        let mut streams = self.engine.streams.write();
        let stream_storage = match streams.get_mut(&stream_id) {
            Some(s) => s,
            None => return Ok(false),
        };

        if let Some(builder) = stream_storage.current_builder.take() {
            if !builder.is_empty() {
                let builder_mem = builder.uncompressed_bytes();
                let block = builder.build().context("Flush 建構 VictoriaBlock 失敗")?;

                self.engine.write_block_internal(stream_storage, &block)?;

                // 成功落盤至 .block，重設對應的 WAL
                if let Some(ref mut wal) = stream_storage.wal {
                    let _ = wal.truncate_and_reset();
                }

                stream_storage.current_block_id += 1;
                stream_storage.last_flush_instant = Instant::now();
                self.memory_buffer_bytes.fetch_sub(builder_mem.min(self.memory_buffer_bytes.load(Ordering::Relaxed)), Ordering::Relaxed);

                if let Some(ref mut writer) = stream_storage.active_writer {
                    let _ = writer.write_block_flush();
                }

                return Ok(true);
            }
        }
        Ok(false)
    }

    /// 強制將所有串流目前的記憶體緩衝區全部打包落盤，並截斷重設 WAL (確保零丟失)
    pub fn flush_all(&self) -> Result<usize> {
        let mut flushed_count = 0;
        let mut streams = self.engine.streams.write();

        for stream_storage in streams.values_mut() {
            if let Some(builder) = stream_storage.current_builder.take() {
                if !builder.is_empty() {
                    let builder_mem = builder.uncompressed_bytes();
                    if let Ok(block) = builder.build() {
                        if self.engine.write_block_internal(stream_storage, &block).is_ok() {
                            if let Some(ref mut wal) = stream_storage.wal {
                                let _ = wal.truncate_and_reset();
                            }
                            stream_storage.current_block_id += 1;
                            stream_storage.last_flush_instant = Instant::now();
                            flushed_count += 1;
                        }
                    }
                    self.memory_buffer_bytes.fetch_sub(builder_mem.min(self.memory_buffer_bytes.load(Ordering::Relaxed)), Ordering::Relaxed);
                }
            }

            if let Some(ref mut writer) = stream_storage.active_writer {
                let _ = writer.write_block_flush();
            }
        }

        debug!("[WriteManager] flush_all 已落盤 {} 個活躍串流緩衝區", flushed_count);
        Ok(flushed_count)
    }

    /// 取得 WriteManager 即時遙測狀態
    pub fn metrics(&self) -> WriteManagerMetrics {
        WriteManagerMetrics {
            memory_buffer_bytes: self.memory_buffer_bytes.load(Ordering::Relaxed),
            is_throttled: self.is_throttled.load(Ordering::Relaxed),
            ingested_rows: self.ingested_rows.load(Ordering::Relaxed),
            ingested_bytes: self.ingested_bytes.load(Ordering::Relaxed),
            wal_bytes_written: self.wal_bytes_written.load(Ordering::Relaxed),
        }
    }
}

/// WriteManager 遙測指標輸出
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteManagerMetrics {
    pub memory_buffer_bytes: usize,
    pub is_throttled: bool,
    pub ingested_rows: u64,
    pub ingested_bytes: u64,
    pub wal_bytes_written: u64,
}

// ============================================================================
// 4. StorageEngine (儲存引擎核心)
// ============================================================================

/// 全局 VictoriaLogs 儲存引擎實體
pub struct StorageEngine {
    /// 根資料目錄 (預設 /data)
    pub data_dir: PathBuf,
    /// 串流分割槽雜湊表 (StreamID -> StreamStorage)
    pub streams: RwLock<HashMap<u64, StreamStorage>>,
    /// 高速不可變 Block 標頭索引器
    pub block_header_index: Arc<BlockHeaderIndex>,
    /// 單一 Part 筆數上限 (預設 16,384)
    pub max_part_rows: u64,
    /// 單一 Part 體積上限 (預設 16 MB)
    pub max_part_bytes: u64,
    /// 全局總筆數累計
    total_engine_rows: AtomicU64,
    /// 全局總磁碟體積累計 (Bytes)
    total_engine_bytes: AtomicU64,
}

/// 儲存引擎全局統計狀態輸出
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineStorageStats {
    pub data_dir: String,
    pub total_streams: usize,
    pub total_rows: u64,
    pub total_disk_bytes: u64,
    pub total_blocks: usize,
    pub sealed_parts_count: usize,
    pub active_parts_count: usize,
}

impl StorageEngine {
    /// 初始化儲存引擎實例，並自動執行開機冷啟動零解壓復原
    pub fn open<P: AsRef<Path>>(data_dir: P) -> Result<Arc<Self>> {
        let path = data_dir.as_ref().to_path_buf();
        create_dir_all(&path)
            .with_context(|| format!("無法建立儲存引擎根目錄: {:?}", path))?;

        let block_header_index = Arc::new(BlockHeaderIndex::new(&path));

        let engine = Arc::new(StorageEngine {
            data_dir: path.clone(),
            streams: RwLock::new(HashMap::new()),
            block_header_index: block_header_index.clone(),
            max_part_rows: DEFAULT_MAX_PART_ROWS,
            max_part_bytes: DEFAULT_MAX_PART_BYTES,
            total_engine_rows: AtomicU64::new(0),
            total_engine_bytes: AtomicU64::new(0),
        });

        // 執行開機冷啟動零解壓復原 (Zero-Decompression Cold Recovery)
        engine.recover_existing_parts()?;

        // 初始化/同步 BlockHeaderIndex 記憶體索引
        let _ = block_header_index.scan_and_rebuild_all();

        info!(
            "VictoriaLogs StorageEngine 已於 {:?} 就緒 (已復原 {} 個串流, 總計 {} 筆日誌)",
            path,
            engine.streams.read().len(),
            engine.total_engine_rows.load(Ordering::Relaxed)
        );

        Ok(engine)
    }

    /// 開機冷啟動掃描：遍歷 /data/{stream_id}/*.block
    fn recover_existing_parts(&self) -> Result<()> {
        if !self.data_dir.exists() {
            return Ok(());
        }

        let stream_entries = match read_dir(&self.data_dir) {
            Ok(entries) => entries,
            Err(e) => {
                warn!("讀取資料目錄失敗: {}", e);
                return Ok(());
            }
        };

        let mut streams_map = self.streams.write();

        for entry in stream_entries.flatten() {
            let stream_path = entry.path();
            if !stream_path.is_dir() {
                continue;
            }

            let folder_name = match stream_path.file_name().and_then(|n| n.to_str()) {
                Some(name) => name,
                None => continue,
            };

            let stream_id = match folder_name.parse::<u64>() {
                Ok(id) => id,
                Err(_) => continue,
            };

            let mut stream_storage = StreamStorage::new(stream_id, 1);
            let mut max_seq_found = 0u64;

            if let Ok(part_entries) = read_dir(&stream_path) {
                let mut part_files: Vec<PathBuf> = part_entries
                    .flatten()
                    .map(|e| e.path())
                    .filter(|p| p.extension().and_then(|e| e.to_str()) == Some("block"))
                    .collect();

                part_files.sort();

                for part_path in part_files {
                    let file_name = part_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                    let (entries, metadata) = match scan_part_file_headers(&part_path, stream_id, file_name) {
                        Ok(res) => res,
                        Err(e) => {
                            error!("掃描分區檔案 {:?} 失敗: {}", part_path, e);
                            continue;
                        }
                    };

                    if metadata.sequence > max_seq_found {
                        max_seq_found = metadata.sequence;
                    }

                    stream_storage.total_rows.fetch_add(metadata.rows_count, Ordering::Relaxed);
                    stream_storage.total_disk_bytes.fetch_add(metadata.compressed_bytes, Ordering::Relaxed);
                    self.total_engine_rows.fetch_add(metadata.rows_count, Ordering::Relaxed);
                    self.total_engine_bytes.fetch_add(metadata.compressed_bytes, Ordering::Relaxed);

                    stream_storage.block_index.extend(entries);
                    stream_storage.sealed_parts.push(metadata);
                }
            }

            stream_storage.current_part_seq.store(max_seq_found + 1, Ordering::SeqCst);
            streams_map.insert(stream_id, stream_storage);
        }

        Ok(())
    }

    /// 內部 Block 寫入邏輯：由 StreamStorage 與 VictoriaBlock 執行寫入
    pub(crate) fn write_block_internal(&self, stream_storage: &mut StreamStorage, block: &VictoriaBlock) -> Result<()> {
        let stream_id = block.header.stream_id;

        let mut need_rotate = false;
        if let Some(ref writer) = stream_storage.active_writer {
            if writer.is_sealed() {
                need_rotate = true;
            }
        } else {
            need_rotate = true;
        }

        if need_rotate {
            self.rotate_active_part(stream_storage)?;
        }

        let writer = stream_storage.active_writer.as_mut().unwrap();
        let part_id = writer.part_id.clone();
        let file_path = writer.file_path.clone();

        let block_offset = writer.write_block(block)?;

        // 同步註冊至高速 BlockHeaderIndex
        self.block_header_index.register_block(IndexedBlockMeta {
            stream_id,
            part_id: part_id.clone(),
            block_id: block.header.block_id,
            file_path: file_path.clone(),
            block_offset,
            disk_size: block.header.compressed_size as u64,
            min_timestamp: block.header.timestamp_fields.min_timestamp,
            max_timestamp: block.header.timestamp_fields.max_timestamp,
            rows_count: block.header.rows_count,
            uncompressed_size: block.header.uncompressed_size,
            compressed_size: block.header.compressed_size,
            bloom_filter: block.header.bloom_filter.clone(),
            checksum: block.header.checksum,
        });

        stream_storage.block_index.push(BlockIndexEntry {
            stream_id,
            part_id: part_id.clone(),
            file_path,
            block_offset,
            header: block.header.clone(),
        });

        stream_storage.total_rows.fetch_add(block.header.rows_count as u64, Ordering::Relaxed);
        stream_storage.total_disk_bytes.fetch_add(block.header.compressed_size as u64, Ordering::Relaxed);
        self.total_engine_rows.fetch_add(block.header.rows_count as u64, Ordering::Relaxed);
        self.total_engine_bytes.fetch_add(block.header.compressed_size as u64, Ordering::Relaxed);

        if writer.is_sealed() {
            let metadata = writer.metadata();
            stream_storage.sealed_parts.push(metadata);
            stream_storage.active_writer = None;
        }

        Ok(())
    }

    /// 直接將完整 VictoriaBlock 追加至指定 stream_id 的分區
    pub fn write_block(&self, block: &VictoriaBlock) -> Result<()> {
        let stream_id = block.header.stream_id;
        let mut streams = self.streams.write();

        let stream_storage = streams.entry(stream_id).or_insert_with(|| {
            StreamStorage::new(stream_id, 1)
        });

        self.write_block_internal(stream_storage, block)
    }

    /// 執行分區原子序號輪轉 (Rotate to next sequence)
    pub fn rotate_active_part(&self, stream_storage: &mut StreamStorage) -> Result<()> {
        if let Some(mut old_writer) = stream_storage.active_writer.take() {
            old_writer.seal()?;
            stream_storage.sealed_parts.push(old_writer.metadata());
        }

        let next_seq = stream_storage.current_part_seq.fetch_add(1, Ordering::SeqCst);
        let new_writer = ActivePartWriter::create(
            &self.data_dir,
            stream_storage.stream_id,
            next_seq,
            self.max_part_rows,
            self.max_part_bytes,
        )?;

        info!(
            "[Part 輪轉] Stream #{} 輪轉至新分區: {}",
            stream_storage.stream_id, new_writer.part_id
        );

        stream_storage.active_writer = Some(new_writer);
        Ok(())
    }

    /// 三層剪枝查詢 (Pruning Pipeline): Stream -> Time Range -> Bloom Filter
    pub fn prune_blocks(
        &self,
        stream_id: u64,
        start_ts: i64,
        end_ts: i64,
        token_filter: Option<&str>,
    ) -> Vec<BlockIndexEntry> {
        let streams = self.streams.read();
        let stream_storage = match streams.get(&stream_id) {
            Some(s) => s,
            None => return Vec::new(),
        };

        let mut matched_blocks = Vec::new();

        for entry in &stream_storage.block_index {
            let h = &entry.header;

            if h.timestamp_fields.max_timestamp < start_ts || h.timestamp_fields.min_timestamp > end_ts {
                continue;
            }

            if let Some(token) = token_filter {
                if !h.bloom_filter.may_contain(token) {
                    continue;
                }
            }

            matched_blocks.push(entry.clone());
        }

        matched_blocks
    }

    /// 取得儲存引擎全局運作統計
    pub fn stats(&self) -> EngineStorageStats {
        let streams = self.streams.read();
        let total_streams = streams.len();
        let mut total_blocks = 0;
        let mut sealed_parts_count = 0;
        let mut active_parts_count = 0;

        for s in streams.values() {
            total_blocks += s.block_index.len();
            sealed_parts_count += s.sealed_parts.len();
            if s.active_writer.is_some() {
                active_parts_count += 1;
            }
        }

        EngineStorageStats {
            data_dir: self.data_dir.to_string_lossy().to_string(),
            total_streams,
            total_rows: self.total_engine_rows.load(Ordering::Relaxed),
            total_disk_bytes: self.total_engine_bytes.load(Ordering::Relaxed),
            total_blocks,
            sealed_parts_count,
            active_parts_count,
        }
    }

    /// 高速搜尋介面：代理至 BlockHeaderIndex 執行 Stream -> Time -> Bloom 剪枝並檢索
    pub fn search(&self, query: &SearchQuery) -> Result<SearchResponse> {
        self.block_header_index.search(query)
    }

    /// 重新掃描並同步全域 BlockHeader 索引
    pub fn sync_index(&self) -> Result<usize> {
        self.block_header_index.scan_and_rebuild_all()
    }
}

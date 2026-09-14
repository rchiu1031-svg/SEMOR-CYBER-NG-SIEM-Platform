use anyhow::{Context, Result};
use std::collections::HashMap;
use std::fs::{create_dir_all, read_dir, File, OpenOptions};
use std::io::{BufReader, BufWriter, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};
use tracing::{error, info, warn};

use crate::block::{compute_crc32_combined, VictoriaBlock, VictoriaBlockHeader, BLOCK_MAGIC};
use crate::stream::{StreamId, StreamManager};

/// 單個 Part 內包含的最大日誌行數上限 (達到後自動 Seal 並開啟新 Part)
pub const MAX_PART_ROWS: u64 = 16384;
/// 單個 Part 內壓縮後最大位元組數上限 (16 MB)
pub const MAX_PART_BYTES: u64 = 16 * 1024 * 1024;

/// PartMetadata 紀錄單一分區檔案 (/data/{stream_id}/{part_id}.block) 之生命週期與統計資訊
#[derive(Debug, Clone, serde::Serialize)]
pub struct PartMetadata {
    pub stream_id: u64,
    pub part_id: String,
    pub file_path: PathBuf,
    pub min_timestamp: i64,
    pub max_timestamp: i64,
    pub rows_count: u64,
    pub uncompressed_bytes: u64,
    pub compressed_bytes: u64,
    pub blocks_count: u32,
    pub is_sealed: bool,
    pub created_at_nano: i64,
}

/// IndexEntry 紀錄特定 Block 在磁碟檔案 (/data/{stream_id}/{part_id}.block) 中的精確二進位偏移
#[derive(Debug, Clone)]
pub struct IndexEntry {
    pub stream_id: u64,
    pub part_id: String,
    pub file_path: PathBuf,
    pub block_offset: u64,
    pub header: VictoriaBlockHeader,
}

/// ActivePartWriter 管理單一 Stream 正在寫入中的活動分區
pub struct ActivePartWriter {
    pub stream_id: u64,
    pub part_id: String,
    pub file_path: PathBuf,
    pub writer: BufWriter<File>,
    pub blocks_count: u32,
    pub rows_count: u64,
    pub uncompressed_bytes: u64,
    pub compressed_bytes: u64,
    pub min_timestamp: i64,
    pub max_timestamp: i64,
    pub is_sealed: bool,
}

impl ActivePartWriter {
    /// 建立新的 Part 寫入器，檔案路徑嚴格遵循：/data/{stream_id}/{part_id}.block
    pub fn new(base_dir: &Path, stream_id: u64, part_seq: u64) -> Result<Self> {
        let stream_dir = base_dir.join(stream_id.to_string());
        create_dir_all(&stream_dir).context("建立 Stream 分區資料夾失敗")?;

        let part_id = format!("part_{:016x}", part_seq);
        let file_path = stream_dir.join(format!("{}.block", part_id));

        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&file_path)
            .context("建立 Part block 檔案失敗")?;

        Ok(ActivePartWriter {
            stream_id,
            part_id,
            file_path,
            writer: BufWriter::with_capacity(256 * 1024, file),
            blocks_count: 0,
            rows_count: 0,
            uncompressed_bytes: 0,
            compressed_bytes: 0,
            min_timestamp: i64::MAX,
            max_timestamp: i64::MIN,
            is_sealed: false,
        })
    }

    /// 寫入一個已壓縮完成之 VictoriaBlock
    pub fn write_block(&mut self, block: &VictoriaBlock) -> Result<u64> {
        let offset = self.writer.stream_position()?;
        block.write_to(&mut self.writer)?;

        self.blocks_count += 1;
        self.rows_count += block.header.rows_count as u64;
        self.uncompressed_bytes += block.header.uncompressed_size as u64;
        self.compressed_bytes += block.header.compressed_size as u64;

        if block.header.min_timestamp < self.min_timestamp {
            self.min_timestamp = block.header.min_timestamp;
        }
        if block.header.max_timestamp > self.max_timestamp {
            self.max_timestamp = block.header.max_timestamp;
        }

        // 若分區累積達到閾值，標記已可封存
        if self.rows_count >= MAX_PART_ROWS || self.compressed_bytes >= MAX_PART_BYTES {
            self.is_sealed = true;
        }

        Ok(offset)
    }

    pub fn metadata(&self) -> PartMetadata {
        PartMetadata {
            stream_id: self.stream_id,
            part_id: self.part_id.clone(),
            file_path: self.file_path.clone(),
            min_timestamp: if self.min_timestamp == i64::MAX { 0 } else { self.min_timestamp },
            max_timestamp: if self.max_timestamp == i64::MIN { 0 } else { self.max_timestamp },
            rows_count: self.rows_count,
            uncompressed_bytes: self.uncompressed_bytes,
            compressed_bytes: self.compressed_bytes,
            blocks_count: self.blocks_count,
            is_sealed: self.is_sealed,
            created_at_nano: chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0),
        }
    }
}

/// VictoriaStorageEngine 核心日誌儲存與壓縮引擎
/// 遵循 VictoriaLogs 分區目錄結構：/data/{stream_id}/{part_id}.block
pub struct VictoriaStorageEngine {
    data_dir: PathBuf,
    stream_mgr: Arc<StreamManager>,
    index: RwLock<Vec<IndexEntry>>,
    parts_meta: RwLock<HashMap<String, PartMetadata>>,
    active_writers: RwLock<HashMap<u64, ActivePartWriter>>,
    stream_part_counters: RwLock<HashMap<u64, u64>>,
    total_uncompressed_bytes: RwLock<u64>,
    total_compressed_bytes: RwLock<u64>,
    total_rows: RwLock<u64>,
}

impl VictoriaStorageEngine {
    /// 開啟或初始化儲存引擎，自動建立或掛載 /data 目錄
    pub fn open<P: AsRef<Path>>(data_dir: P, stream_mgr: Arc<StreamManager>) -> Result<Self> {
        let requested_path = data_dir.as_ref().to_path_buf();

        // 若指定的 /data 因權限無法建立，優雅降級至 ./data 確保環境穩定運行
        let dir_path = match create_dir_all(&requested_path) {
            Ok(_) => requested_path,
            Err(e) => {
                warn!("無法建立指定的資料目錄 {:?}: {:?}，退回至 ./data", requested_path, e);
                let fallback = PathBuf::from("./data");
                create_dir_all(&fallback).context("建立備援資料目錄失敗")?;
                fallback
            }
        };

        info!("[VictoriaLogs 核心] 儲存引擎根目錄掛載成功: {:?}", dir_path);

        let engine = VictoriaStorageEngine {
            data_dir: dir_path,
            stream_mgr,
            index: RwLock::new(Vec::new()),
            parts_meta: RwLock::new(HashMap::new()),
            active_writers: RwLock::new(HashMap::new()),
            stream_part_counters: RwLock::new(HashMap::new()),
            total_uncompressed_bytes: RwLock::new(0),
            total_compressed_bytes: RwLock::new(0),
            total_rows: RwLock::new(0),
        };

        // 啟動時掃描現有磁碟目錄 /data/{stream_id}/{part_id}.block 重建索引
        if let Err(e) = engine.scan_and_recover_existing_parts() {
            warn!("掃描現有資料分區時發生非致命告警: {:?}", e);
        }

        Ok(engine)
    }

    /// 掃描目錄結構 /data/{stream_id}/{part_id}.block，重建記憶體中繼索引 (毋須解壓縮原始日誌)
    fn scan_and_recover_existing_parts(&self) -> Result<()> {
        if !self.data_dir.exists() {
            return Ok(());
        }

        let mut recovered_blocks = 0;
        let mut recovered_parts = 0;

        for entry in read_dir(&self.data_dir)? {
            let entry = entry?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            // 檢查目錄名稱是否為合法 stream_id (純數字)
            let dir_name = entry.file_name().to_string_lossy().to_string();
            let stream_id: u64 = match dir_name.parse() {
                Ok(id) => id,
                Err(_) => continue,
            };

            let mut max_part_seq = 0u64;

            for part_entry in read_dir(&path)? {
                let part_entry = part_entry?;
                let part_path = part_entry.path();
                if part_path.extension().and_then(|s| s.to_str()) != Some("block") {
                    continue;
                }

                let file_name = part_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                let part_id = file_name.to_string();

                // 解析 part 序號
                if let Some(hex_str) = file_name.strip_prefix("part_") {
                    if let Ok(seq) = u64::from_str_radix(hex_str, 16) {
                        if seq > max_part_seq {
                            max_part_seq = seq;
                        }
                    }
                }

                // 讀取該 Part 內所有 Block 的 Header
                if let Ok(file) = File::open(&part_path) {
                    let mut reader = BufReader::new(file);
                    let mut file_offset = 0u64;

                    let mut part_min_ts = i64::MAX;
                    let mut part_max_ts = i64::MIN;
                    let mut part_rows = 0u64;
                    let mut part_uncompressed = 0u64;
                    let mut part_compressed = 0u64;
                    let mut blocks_in_part = 0u32;

                    while let Ok(block) = VictoriaBlock::read_from(&mut reader) {
                        let header = block.header.clone();
                        blocks_in_part += 1;
                        part_rows += header.rows_count as u64;
                        part_uncompressed += header.uncompressed_size as u64;
                        part_compressed += header.compressed_size as u64;

                        if header.min_timestamp < part_min_ts {
                            part_min_ts = header.min_timestamp;
                        }
                        if header.max_timestamp > part_max_ts {
                            part_max_ts = header.max_timestamp;
                        }

                        let index_entry = IndexEntry {
                            stream_id,
                            part_id: part_id.clone(),
                            file_path: part_path.clone(),
                            block_offset: file_offset,
                            header,
                        };

                        file_offset = reader.stream_position().unwrap_or(file_offset);
                        self.index.write().unwrap().push(index_entry);
                        recovered_blocks += 1;
                    }

                    if blocks_in_part > 0 {
                        let meta = PartMetadata {
                            stream_id,
                            part_id: part_id.clone(),
                            file_path: part_path.clone(),
                            min_timestamp: part_min_ts,
                            max_timestamp: part_max_ts,
                            rows_count: part_rows,
                            uncompressed_bytes: part_uncompressed,
                            compressed_bytes: part_compressed,
                            blocks_count: blocks_in_part,
                            is_sealed: true,
                            created_at_nano: chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0),
                        };

                        self.parts_meta.write().unwrap().insert(part_id, meta);
                        *self.total_rows.write().unwrap() += part_rows;
                        *self.total_uncompressed_bytes.write().unwrap() += part_uncompressed;
                        *self.total_compressed_bytes.write().unwrap() += part_compressed;
                        recovered_parts += 1;
                    }
                }
            }

            self.stream_part_counters.write().unwrap().insert(stream_id, max_part_seq);
        }

        info!(
            "[VictoriaLogs 重建索引] 掃描完成: 共復原 {} 個分區 Part 與 {} 個壓縮 Block",
            recovered_parts, recovered_blocks
        );
        Ok(())
    }

    /// 寫入一個已完成壓縮封裝的 VictoriaBlock 至對應的 /data/{stream_id}/{part_id}.block
    pub fn append_block(&self, block: &VictoriaBlock) -> Result<()> {
        let stream_id = block.header.stream_id;

        // 1. 取得或旋轉該 Stream 的 ActivePartWriter
        let (file_path, part_id, offset) = {
            let mut writers = self.active_writers.write().unwrap();
            let mut counters = self.stream_part_counters.write().unwrap();

            let should_rotate = match writers.get(&stream_id) {
                Some(w) => w.is_sealed,
                None => true,
            };

            if should_rotate {
                let next_seq = counters.get(&stream_id).copied().unwrap_or(0) + 1;
                counters.insert(stream_id, next_seq);

                let writer = ActivePartWriter::new(&self.data_dir, stream_id, next_seq)?;
                writers.insert(stream_id, writer);
            }

            let writer = writers.get_mut(&stream_id).unwrap();
            let offset = writer.write_block(block)?;
            let meta = writer.metadata();

            self.parts_meta.write().unwrap().insert(writer.part_id.clone(), meta);

            (writer.file_path.clone(), writer.part_id.clone(), offset)
        };

        // 2. 登錄二進位 Block 索引條目 (包含 Bloom Filter 與時間範圍)
        let entry = IndexEntry {
            stream_id,
            part_id,
            file_path,
            block_offset: offset,
            header: block.header.clone(),
        };

        self.index.write().unwrap().push(entry);

        // 3. 更新全局遙測計量
        *self.total_uncompressed_bytes.write().unwrap() += block.header.uncompressed_size as u64;
        *self.total_compressed_bytes.write().unwrap() += block.header.compressed_size as u64;
        *self.total_rows.write().unwrap() += block.header.rows_count as u64;

        Ok(())
    }

    /// 三層極速剪枝查詢演算法 (VictoriaLogs 核心架構)：
    /// 1. Stream 標籤級剪枝：若給定 stream_id，直接僅讀取 /data/{stream_id}/*.block，完全跳過其他 Stream！
    /// 2. 時間戳區間剪枝：比對 Min/Max Timestamp，過濾時間範圍不相交之 Block
    /// 3. Bloom Filter 核心快篩：在磁碟與記憶體索引層比對關鍵字，100% 確定不含目標則跳過，免除 ZSTD 解壓縮！
    pub fn search(
        &self,
        stream_id: Option<StreamId>,
        start_ts: i64,
        end_ts: i64,
        token_filter: Option<&str>,
        limit: usize,
    ) -> Result<Vec<(i64, String)>> {
        let index_entries = self.index.read().unwrap().clone();
        let mut results = Vec::new();

        for entry in index_entries {
            // 剪枝層級 1: Stream-Level Pruning (磁碟路徑與標籤分流)
            if let Some(target_stream) = stream_id {
                if entry.header.stream_id != target_stream {
                    continue;
                }
            }

            // 剪枝層級 2: Time-Range Pruning (時間戳區間比對)
            if entry.header.max_timestamp < start_ts || entry.header.min_timestamp > end_ts {
                continue;
            }

            // 剪枝層級 3: Bloom Filter Token-Level Pruning (解壓縮前零代價剔除)
            if let Some(token) = token_filter {
                if !entry.header.bloom_filter.may_contain(token) {
                    continue; // 數學保證此 Block 絕對不含目標詞，直接跳過解壓縮！
                }
            }

            // 通過全部三層剪枝，精準定位該 /data/{stream_id}/{part_id}.block 並解壓該 Block
            if !entry.file_path.exists() {
                continue;
            }

            let mut file = File::open(&entry.file_path)?;
            file.seek(SeekFrom::Start(entry.block_offset))?;
            let mut reader = BufReader::new(&file);

            let block = VictoriaBlock::read_from(&mut reader)?;
            let rows = block.decompress_rows()?;

            for (ts, row) in rows {
                if ts >= start_ts && ts <= end_ts {
                    if let Some(token) = token_filter {
                        if !row.contains(token) {
                            continue;
                        }
                    }
                    results.push((ts, row));
                    if results.len() >= limit {
                        return Ok(results);
                    }
                }
            }
        }

        Ok(results)
    }

    /// 取得目前所有 Part 分區之中繼狀態清單
    pub fn list_parts(&self) -> Vec<PartMetadata> {
        self.parts_meta.read().unwrap().values().cloned().collect()
    }

    /// 取得即時儲存引擎統計數據
    pub fn stats(&self) -> StorageStats {
        let uncompressed = *self.total_uncompressed_bytes.read().unwrap();
        let compressed = *self.total_compressed_bytes.read().unwrap();
        let rows = *self.total_rows.read().unwrap();
        let blocks = self.index.read().unwrap().len() as u64;
        let parts = self.parts_meta.read().unwrap().len() as u64;
        let streams = self.stream_part_counters.read().unwrap().len() as u64;

        let ratio = if compressed > 0 {
            uncompressed as f64 / compressed as f64
        } else {
            1.0
        };

        StorageStats {
            data_dir: self.data_dir.to_string_lossy().to_string(),
            total_streams: streams.max(1),
            total_parts: parts,
            total_blocks: blocks,
            total_rows: rows,
            uncompressed_bytes: uncompressed,
            compressed_bytes: compressed,
            compression_ratio: ratio,
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct StorageStats {
    pub data_dir: String,
    pub total_streams: u64,
    pub total_parts: u64,
    pub total_blocks: u64,
    pub total_rows: u64,
    pub uncompressed_bytes: u64,
    pub compressed_bytes: u64,
    pub compression_ratio: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::block::BlockBuilder;

    #[test]
    fn test_storage_engine_directory_structure_and_pruning() {
        let temp_dir = std::env::temp_dir().join(format!("vlog_test_{}", std::process::id()));
        let stream_mgr = Arc::new(StreamManager::new());
        let storage = VictoriaStorageEngine::open(&temp_dir, stream_mgr).unwrap();

        let stream_id = 1001;
        let mut builder = BlockBuilder::new(stream_id, "part_0000000000000001", 1, 100, 1024 * 1024);
        let base_ts = 1710000000000i64;

        for i in 0..10 {
            let log = format!(
                "2026-09-14 07:20:00 [FIREWALL] src=192.168.1.{} dst=10.0.0.1 action=DROP attack=CVE-2024-3400",
                i
            );
            builder.add_row(base_ts + i * 100, &log);
        }

        let block = builder.build().unwrap();
        storage.append_block(&block).unwrap();

        // 驗證檔案目錄格式：/data/{stream_id}/{part_id}.block
        let expected_part_file = temp_dir.join("1001").join("part_0000000000000001.block");
        assert!(expected_part_file.exists(), "分區檔案必須存放在 /data/1001/part_...block");

        // 測試精準搜尋命中
        let results = storage
            .search(Some(stream_id), base_ts - 1000, base_ts + 5000, Some("CVE-2024-3400"), 10)
            .unwrap();
        assert_eq!(results.len(), 10);

        // 測試 Bloom Filter 剪枝 (搜尋不存在之詞彙，應返回 0 筆且快速完成)
        let no_results = storage
            .search(Some(stream_id), base_ts - 1000, base_ts + 5000, Some("RANSOMWARE_WANNACRY"), 10)
            .unwrap();
        assert_eq!(no_results.len(), 0);

        // 清理臨時目錄
        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}

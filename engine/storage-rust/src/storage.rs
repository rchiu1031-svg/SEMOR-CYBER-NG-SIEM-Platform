use anyhow::{Context, Result};
use std::fs::{create_dir_all, File, OpenOptions};
use std::io::{BufReader, BufWriter, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

use crate::block::{VictoriaBlock, VictoriaBlockHeader};
use crate::stream::{StreamId, StreamManager};

/// IndexEntry 紀錄單一 Block 在資料檔案中的偏移與範圍
#[derive(Debug, Clone)]
pub struct IndexEntry {
    pub file_offset: u64,
    pub header: VictoriaBlockHeader,
}

/// VictoriaStorageEngine 負責管理日誌分區與磁碟持久化
pub struct VictoriaStorageEngine {
    data_dir: PathBuf,
    stream_mgr: Arc<StreamManager>,
    index: RwLock<Vec<IndexEntry>>,
    current_data_file: RwLock<BufWriter<File>>,
    total_uncompressed_bytes: RwLock<u64>,
    total_compressed_bytes: RwLock<u64>,
    total_rows: RwLock<u64>,
}

impl VictoriaStorageEngine {
    pub fn open<P: AsRef<Path>>(data_dir: P, stream_mgr: Arc<StreamManager>) -> Result<Self> {
        let dir_path = data_dir.as_ref().to_path_buf();
        create_dir_all(&dir_path).context("建立資料目錄失敗")?;

        let data_file_path = dir_path.join("active.vlog_data");
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&data_file_path)?;

        Ok(VictoriaStorageEngine {
            data_dir: dir_path,
            stream_mgr,
            index: RwLock::new(Vec::new()),
            current_data_file: RwLock::new(BufWriter::new(file)),
            total_uncompressed_bytes: RwLock::new(0),
            total_compressed_bytes: RwLock::new(0),
            total_rows: RwLock::new(0),
        })
    }

    /// 寫入一個已完成壓縮的 VictoriaBlock
    pub fn append_block(&self, block: &VictoriaBlock) -> Result<()> {
        let mut writer = self.current_data_file.write().unwrap();
        let offset = writer.stream_position().unwrap_or(0);

        block.write_to(&mut *writer)?;

        let entry = IndexEntry {
            file_offset: offset,
            header: block.header.clone(),
        };

        // 更新全局計量與索引
        self.index.write().unwrap().push(entry);
        *self.total_uncompressed_bytes.write().unwrap() += block.header.uncompressed_size as u64;
        *self.total_compressed_bytes.write().unwrap() += block.header.compressed_size as u64;
        *self.total_rows.write().unwrap() += block.header.rows_count as u64;

        Ok(())
    }

    /// 執行快速查詢 (利用時間戳範圍與 Bloom Filter 兩層快篩剪枝)
    pub fn search(
        &self,
        stream_id: Option<StreamId>,
        start_ts: i64,
        end_ts: i64,
        token_filter: Option<&str>,
        limit: usize,
    ) -> Result<Vec<(i64, String)>> {
        let index_entries = self.index.read().unwrap().clone();
        let data_file_path = self.data_dir.join("active.vlog_data");
        if !data_file_path.exists() {
            return Ok(Vec::new());
        }

        let mut file = File::open(data_file_path)?;
        let mut results = Vec::new();

        for entry in index_entries {
            // 篩選 1: StreamID 匹配
            if let Some(target_stream) = stream_id {
                if entry.header.stream_id != target_stream {
                    continue;
                }
            }

            // 篩選 2: 時間戳範圍重疊剪枝
            if entry.header.max_timestamp < start_ts || entry.header.min_timestamp > end_ts {
                continue;
            }

            // 篩選 3: 核心效能利器 - Bloom Filter 剪枝 (毋須解壓縮 Block 即可判定是否命中)
            if let Some(token) = token_filter {
                if !entry.header.bloom_filter.may_contain(token) {
                    continue; // 100% 不含該關鍵字，直接跳過解壓縮！
                }
            }

            // 通過前三道剪枝，定位並解壓縮該 Block
            file.seek(SeekFrom::Start(entry.file_offset))?;
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

    /// 取得即時儲存引擎遙測指標
    pub fn stats(&self) -> StorageStats {
        let uncompressed = *self.total_uncompressed_bytes.read().unwrap();
        let compressed = *self.total_compressed_bytes.read().unwrap();
        let rows = *self.total_rows.read().unwrap();
        let blocks = self.index.read().unwrap().len() as u64;

        let ratio = if compressed > 0 {
            uncompressed as f64 / compressed as f64
        } else {
            1.0
        };

        StorageStats {
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
    pub total_blocks: u64,
    pub total_rows: u64,
    pub uncompressed_bytes: u64,
    pub compressed_bytes: u64,
    pub compression_ratio: f64,
}

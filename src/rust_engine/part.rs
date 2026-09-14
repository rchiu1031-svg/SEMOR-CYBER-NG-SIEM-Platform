//! ============================================================================
//! SEMOR Storage Core - VictoriaLogs Part Management (Stage 2)
//! File: /src/rust_engine/part.rs
//!
//! 本模組實作 VictoriaLogs 分區檔案結構、ActivePartWriter 與 PartMetadata：
//! 1. 檔案路徑嚴格遵循：/data/{stream_id}/{part_id}.block
//! 2. ActivePartWriter: 管理特定 Stream 寫入緩衝 (BufWriter)，監控容量自動 Sealed
//! 3. PartMetadata: 記錄分區整體 min/max 時間戳、筆數、體積、校驗碼與封存狀態
//! 4. 序號無鎖/Atomic 輪轉: part_{seq:016x}.block
//! ============================================================================

use anyhow::{bail, Context, Result};
use byteorder::{BigEndian, ReadBytesExt};
use serde::{Deserialize, Serialize};
use std::fs::{create_dir_all, File, OpenOptions};
use std::io::{BufReader, BufWriter, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tracing::{debug, info, warn};

use crate::rust_engine::block::{
    compute_crc32, VictoriaBlock, VictoriaBlockHeader, BLOCK_MAGIC, BLOCK_VERSION,
};

/// 單一 Part 預設最大容納日誌行數 (16,384 筆，達到後標記 Sealed 並 Rotate)
pub const DEFAULT_MAX_PART_ROWS: u64 = 16384;
/// 單一 Part 預設最大壓縮後磁碟位元組數 (16 MB)
pub const DEFAULT_MAX_PART_BYTES: u64 = 16 * 1024 * 1024;
/// 單一 Part 預設最大容納 Block 數 (如 4-8 個 Block)
pub const DEFAULT_MAX_PART_BLOCKS: u32 = 8;

/// Part 封存生命週期狀態
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PartState {
    /// 寫入中 (活動分區，仍可追加寫入 Block)
    Active,
    /// 已封存 (不可變唯讀分區，準備參與後續 Compaction 合併)
    Sealed,
    /// 合併中 / 標記清除
    Compacting,
}

// ============================================================================
// 1. PartMetadata (分區中繼摘要)
// ============================================================================

/// PartMetadata 記錄單一分區檔案 (/data/{stream_id}/{part_id}.block) 之生命週期與統計摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PartMetadata {
    /// 所屬串流 ID
    pub stream_id: u64,
    /// 分區識別碼 (如 "part_0000000000000001")
    pub part_id: String,
    /// 分區檔案完整實體路徑
    pub file_path: PathBuf,
    /// 分區序號
    pub sequence: u64,
    /// 最小時間戳 (Unix 奈秒/毫秒)
    pub min_timestamp: i64,
    /// 最大時間戳 (Unix 奈秒/毫秒)
    pub max_timestamp: i64,
    /// 分區內累積總日誌行數
    pub rows_count: u64,
    /// 原始未壓縮位元組總數
    pub uncompressed_bytes: u64,
    /// 壓縮後落盤位元組總數 (所有 Block 實體大小合計)
    pub compressed_bytes: u64,
    /// 內部包含的 VictoriaBlock 數量
    pub blocks_count: u32,
    /// 生命週期狀態
    pub state: PartState,
    /// 結合校驗碼 (最新 Block 之校驗碼累積)
    pub composite_checksum: u32,
    /// 分區建立時間戳 (Unix 奈秒/毫秒)
    pub created_at_nano: i64,
    /// 封存時間戳 (若為 Active 則為 None)
    pub sealed_at_nano: Option<i64>,
}

impl PartMetadata {
    /// 計算該 Part 整體壓縮比率
    pub fn compression_ratio(&self) -> f64 {
        if self.compressed_bytes > 0 {
            self.uncompressed_bytes as f64 / self.compressed_bytes as f64
        } else {
            1.0
        }
    }
}

// ============================================================================
// 2. ActivePartWriter (活動分區寫入器)
// ============================================================================

/// ActivePartWriter 管理特定 stream_id 正在寫入中的 .block 檔案控制代碼
pub struct ActivePartWriter {
    pub stream_id: u64,
    pub part_id: String,
    pub sequence: u64,
    pub file_path: PathBuf,
    /// 具備 256KB 內部緩衝區的高速寫入器
    writer: BufWriter<File>,
    /// 目前內部累積之 Block 數
    pub blocks_count: u32,
    /// 目前累積之總日誌行數
    pub rows_count: u64,
    /// 原始未壓縮大小累計
    pub uncompressed_bytes: u64,
    /// 壓縮後寫入位元組累計
    pub compressed_bytes: u64,
    /// 最小時間戳
    pub min_timestamp: i64,
    /// 最大時間戳
    pub max_timestamp: i64,
    /// 狀態
    pub state: PartState,
    /// 最新 Block 之 CRC32
    pub latest_checksum: u32,
    /// 上限條件
    pub max_rows: u64,
    pub max_bytes: u64,
    pub max_blocks: u32,
    /// 建立時間
    pub created_at_nano: i64,
    /// 封存時間
    pub sealed_at_nano: Option<i64>,
}

impl ActivePartWriter {
    /// 建立新的 Part 寫入器，嚴格依循 /data/{stream_id}/{part_id}.block 命名與建立目錄
    pub fn create(
        base_data_dir: &Path,
        stream_id: u64,
        sequence: u64,
        max_rows: u64,
        max_bytes: u64,
    ) -> Result<Self> {
        let stream_dir = base_data_dir.join(stream_id.to_string());
        create_dir_all(&stream_dir)
            .with_context(|| format!("建立串流目錄失敗: {:?}", stream_dir))?;

        let part_id = format!("part_{:016x}", sequence);
        let file_path = stream_dir.join(format!("{}.block", part_id));

        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&file_path)
            .with_context(|| format!("建立/開啟分區檔案失敗: {:?}", file_path))?;

        // 設定 256KB 大容量寫入緩衝區，減少系統呼叫頻率
        let writer = BufWriter::with_capacity(256 * 1024, file);

        let created_at_nano = chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0);

        Ok(ActivePartWriter {
            stream_id,
            part_id,
            sequence,
            file_path,
            writer,
            blocks_count: 0,
            rows_count: 0,
            uncompressed_bytes: 0,
            compressed_bytes: 0,
            min_timestamp: i64::MAX,
            max_timestamp: i64::MIN,
            state: PartState::Active,
            latest_checksum: 0,
            max_rows: if max_rows == 0 { DEFAULT_MAX_PART_ROWS } else { max_rows },
            max_bytes: if max_bytes == 0 { DEFAULT_MAX_PART_BYTES } else { max_bytes },
            max_blocks: DEFAULT_MAX_PART_BLOCKS,
            created_at_nano,
            sealed_at_nano: None,
        })
    }

    /// 將一個完整建構壓縮之 VictoriaBlock 追加寫入當前分區檔案
    /// 回傳該 Block 在該 .block 檔案內的起始位元組偏移量 (Offset)
    pub fn write_block(&mut self, block: &VictoriaBlock) -> Result<u64> {
        if self.state == PartState::Sealed {
            bail!(
                "分區 {} 已標記為 Sealed，不可再寫入新 Block",
                self.part_id
            );
        }

        let start_offset = self.writer.stream_position()?;

        // 呼叫 VictoriaBlock 專屬的二進位序列化方法
        let written_bytes = block.write_to(&mut self.writer)?;

        // 更新分區統計中繼資訊
        self.blocks_count += 1;
        self.rows_count += block.header.rows_count as u64;
        self.uncompressed_bytes += block.header.uncompressed_size as u64;
        self.compressed_bytes += written_bytes as u64;
        self.latest_checksum = block.header.checksum;

        if block.header.timestamp_fields.min_timestamp < self.min_timestamp {
            self.min_timestamp = block.header.timestamp_fields.min_timestamp;
        }
        if block.header.timestamp_fields.max_timestamp > self.max_timestamp {
            self.max_timestamp = block.header.timestamp_fields.max_timestamp;
        }

        // 檢查是否達到封存標準 (筆數 >= 16,384 或 體積 >= 16MB 或 Block 數 >= 8)
        if self.rows_count >= self.max_rows
            || self.compressed_bytes >= self.max_bytes
            || self.blocks_count >= self.max_blocks
        {
            self.seal()?;
        }

        Ok(start_offset)
    }

    /// 將目前分區寫入緩衝區 Flush 至作業系統層級 (不封存)
    pub fn write_block_flush(&mut self) -> Result<()> {
        if self.state != PartState::Sealed {
            self.writer.flush().context("Flush ActivePartWriter 緩衝區失敗")?;
        }
        Ok(())
    }

    /// 將分區強制 Flush 落盤並標記為 Sealed 不可變狀態
    pub fn seal(&mut self) -> Result<()> {
        if self.state != PartState::Sealed {
            self.writer.flush().context("Flush 緩衝區至磁碟失敗")?;
            self.state = PartState::Sealed;
            self.sealed_at_nano = Some(chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
            debug!(
                "[Part 封存] Stream #{} 分區 {} 已封存 (行數: {}, 大小: {} KB, Blocks: {})",
                self.stream_id,
                self.part_id,
                self.rows_count,
                self.compressed_bytes / 1024,
                self.blocks_count
            );
        }
        Ok(())
    }

    /// 判斷分區是否已經封存
    #[inline]
    pub fn is_sealed(&self) -> bool {
        self.state == PartState::Sealed
    }

    /// 產生快照中繼摘要 (PartMetadata)
    pub fn metadata(&self) -> PartMetadata {
        PartMetadata {
            stream_id: self.stream_id,
            part_id: self.part_id.clone(),
            file_path: self.file_path.clone(),
            sequence: self.sequence,
            min_timestamp: if self.min_timestamp == i64::MAX { 0 } else { self.min_timestamp },
            max_timestamp: if self.max_timestamp == i64::MIN { 0 } else { self.max_timestamp },
            rows_count: self.rows_count,
            uncompressed_bytes: self.uncompressed_bytes,
            compressed_bytes: self.compressed_bytes,
            blocks_count: self.blocks_count,
            state: self.state,
            composite_checksum: self.latest_checksum,
            created_at_nano: self.created_at_nano,
            sealed_at_nano: self.sealed_at_nano,
        }
    }
}

// ============================================================================
// 3. BlockIndexEntry (二進位 Block 精準索引條目)
// ============================================================================

/// BlockIndexEntry 記錄單一 Block 在具體 /data/{stream_id}/{part_id}.block 檔案中的實體定位
#[derive(Debug, Clone)]
pub struct BlockIndexEntry {
    pub stream_id: u64,
    pub part_id: String,
    pub file_path: PathBuf,
    /// 該 Block 在 .block 檔案中的絕對起始位元組偏移 (byte offset)
    pub block_offset: u64,
    /// Block 完整中繼標頭 (含 Bloom Filter 與時間戳範圍，供剪枝使用)
    pub header: VictoriaBlockHeader,
}

// ============================================================================
// 4. Zero-Decompression Recovery (開機冷啟動零解壓中繼復原)
// ============================================================================

/// 從單一 .block 檔案中循序掃描各 BlockHeader，完全不碰觸 Payload 與解壓縮程序！
pub fn scan_part_file_headers(
    file_path: &Path,
    stream_id: u64,
    part_id: &str,
) -> Result<(Vec<BlockIndexEntry>, PartMetadata)> {
    let file = File::open(file_path)
        .with_context(|| format!("無法開啟分區檔案進行索引重建: {:?}", file_path))?;
    let mut reader = BufReader::new(file);

    let mut entries = Vec::new();
    let mut part_min_ts = i64::MAX;
    let mut part_max_ts = i64::MIN;
    let mut part_rows = 0u64;
    let mut part_uncompressed = 0u64;
    let mut part_compressed = 0u64;
    let mut blocks_count = 0u32;
    let mut latest_crc = 0u32;

    let mut current_offset = 0u64;

    loop {
        // 1. 嘗試讀取魔術字 (4 Bytes)
        let mut magic = [0u8; 4];
        match reader.read_exact(&mut magic) {
            Ok(_) => {}
            Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => {
                break; // 正常到達檔案結尾
            }
            Err(e) => return Err(e.into()),
        }

        if magic != BLOCK_MAGIC {
            warn!(
                "檔案 {:?} 在位移 {} 處發現非預期的魔術字: {:?}",
                file_path, current_offset, magic
            );
            break;
        }

        // 2. 讀取 Version (2 Bytes)
        let version = reader.read_u16::<BigEndian>()?;
        if version != BLOCK_VERSION && version != 1 {
            warn!("未知的 Block 版本: {}", version);
            break;
        }

        // 3. 讀取 Header JSON 長度並反序列化 Header (包含 Bloom Filter 與時間戳欄位)
        let header_len = reader.read_u32::<BigEndian>()? as usize;
        let mut header_buf = vec![0u8; header_len];
        reader.read_exact(&mut header_buf)?;
        let header: VictoriaBlockHeader = serde_json::from_slice(&header_buf)
            .context("反序列化 Header JSON 失敗")?;

        // 4. 跳過 Timestamps Bytes (4 Bytes len + payload)
        let ts_len = reader.read_u32::<BigEndian>()? as i64;
        reader.seek(SeekFrom::Current(ts_len))?;

        // 5. 跳過 Payload Bytes (4 Bytes len + payload)
        let payload_len = reader.read_u32::<BigEndian>()? as i64;
        reader.seek(SeekFrom::Current(payload_len))?;

        // 6. 讀取 CRC32 Checksum (4 Bytes)
        let checksum = reader.read_u32::<BigEndian>()?;
        latest_crc = checksum;

        let next_offset = reader.stream_position()?;
        let block_disk_size = next_offset - current_offset;

        // 累積中繼資料
        blocks_count += 1;
        part_rows += header.rows_count as u64;
        part_uncompressed += header.uncompressed_size as u64;
        part_compressed += block_disk_size;

        if header.timestamp_fields.min_timestamp < part_min_ts {
            part_min_ts = header.timestamp_fields.min_timestamp;
        }
        if header.timestamp_fields.max_timestamp > part_max_ts {
            part_max_ts = header.timestamp_fields.max_timestamp;
        }

        // 記錄索引條目
        entries.push(BlockIndexEntry {
            stream_id,
            part_id: part_id.to_string(),
            file_path: file_path.to_path_buf(),
            block_offset: current_offset,
            header,
        });

        current_offset = next_offset;
    }

    let sequence = if let Some(hex_str) = part_id.strip_prefix("part_") {
        u64::from_str_radix(hex_str, 16).unwrap_or(1)
    } else {
        1
    };

    let metadata = PartMetadata {
        stream_id,
        part_id: part_id.to_string(),
        file_path: file_path.to_path_buf(),
        sequence,
        min_timestamp: if part_min_ts == i64::MAX { 0 } else { part_min_ts },
        max_timestamp: if part_max_ts == i64::MIN { 0 } else { part_max_ts },
        rows_count: part_rows,
        uncompressed_bytes: part_uncompressed,
        compressed_bytes: part_compressed,
        blocks_count,
        state: PartState::Sealed, // 磁碟既有掃描之分區預設為 Sealed
        composite_checksum: latest_crc,
        created_at_nano: chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0),
        sealed_at_nano: Some(chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)),
    };

    Ok((entries, metadata))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rust_engine::block::BlockBuilder;

    #[test]
    fn test_active_part_writer_and_zero_decompression_recovery() {
        let temp_dir = std::env::temp_dir().join(format!("vlog_part_test_{}", std::process::id()));
        let stream_id = 1001u64;
        let sequence = 1u64;

        // 1. 建立 ActivePartWriter
        let mut writer = ActivePartWriter::create(&temp_dir, stream_id, sequence, 100, 1024 * 1024).unwrap();
        assert_eq!(writer.part_id, "part_0000000000000001");
        assert!(!writer.is_sealed());

        // 2. 構建並寫入 2 個 Block
        for b_idx in 1..=2 {
            let mut builder = BlockBuilder::new(stream_id, &writer.part_id, b_idx, 50, 1024 * 1024);
            for i in 0..20 {
                let ts = 1710000000000i64 + (b_idx as i64 * 1000) + (i as i64 * 10);
                builder.add_row(ts, &format!("log line {} in block {}", i, b_idx));
            }
            let block = builder.build().unwrap();
            writer.write_block(&block).unwrap();
        }

        assert_eq!(writer.blocks_count, 2);
        assert_eq!(writer.rows_count, 40);

        // 強制封存
        writer.seal().unwrap();
        assert!(writer.is_sealed());

        let file_path = writer.file_path.clone();
        assert!(file_path.exists());

        // 3. 測試零解壓復原 (Zero-Decompression Scan)
        let (recovered_entries, meta) = scan_part_file_headers(&file_path, stream_id, "part_0000000000000001").unwrap();
        assert_eq!(recovered_entries.len(), 2);
        assert_eq!(meta.blocks_count, 2);
        assert_eq!(meta.rows_count, 40);
        assert_eq!(meta.state, PartState::Sealed);
        assert_eq!(recovered_entries[0].header.rows_count, 20);
        assert_eq!(recovered_entries[1].header.rows_count, 20);

        // 清理測試資料夾
        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}

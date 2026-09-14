//! ============================================================================
//! SEMOR Storage Core - VictoriaLogs Block Engine (Stage 2)
//! File: /src/rust_engine/block.rs
//!
//! 本模組實作 VictoriaLogs-Style 二進位資料塊建構器 (BlockBuilder)，
//! 包含：
//! 1. ZSTD 批次高倍率日誌壓縮標頭 (ZstdCompressionHeader / VictoriaBlockHeader)
//! 2. Delta-of-Delta 二階差分時間戳編碼器 (DeltaTimestampEncoder)
//! 3. 雙重散列 (Double-Hashing) 高速 Bloom Filter 位元陣列 (BloomFilterBitArray)
//! 4. 具備 4,096 筆/2MB 邊界控制之日誌區塊建構器 (BlockBuilder)
//! 5. IEEE 802.3 CRC32 資料完整性校驗與二進位 Frame 序列化
//! ============================================================================

use anyhow::{bail, Context, Result};
use byteorder::{BigEndian, ReadBytesExt, WriteBytesExt};
use crc32fast::Hasher as Crc32Hasher;
use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::io::{Cursor, Read, Write};

/// 二進位 Block 識別魔術字 ("VBLK" = VictoriaLogs Block)
pub const BLOCK_MAGIC: [u8; 4] = *b"VBLK";
/// Block 二進位編碼格式版本 (Stage 2: v2)
pub const BLOCK_VERSION: u16 = 2;
/// 預設單一 Block 最大容納日誌行數
pub const DEFAULT_MAX_BLOCK_ROWS: usize = 4096;
/// 預設單一 Block 最大未壓縮位元組數 (2 MB)
pub const DEFAULT_MAX_BLOCK_BYTES: usize = 2 * 1024 * 1024;

// ============================================================================
// 1. Bloom Filter 位元陣列數據結構 (BloomFilterBitArray)
// ============================================================================

/// BloomFilterBitArray 基於 Kirsch-Mitzenmacher 雙重散列技術
/// 提供極致緊湊的位元陣列與 O(1) 詞彙存在性判斷，供查詢引擎在解壓縮前快速剪枝。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BloomFilterBitArray {
    /// 位元組型態之位元陣列 (Bit Array)
    pub bit_array: Vec<u8>,
    /// 總位元數容量 (Bit Count)
    pub bit_count: usize,
    /// 散列函數迭代次數 (Optimal Hash Count k)
    pub num_hashes: u8,
    /// 已加入之關鍵詞 Token 估算數量
    pub inserted_elements: u32,
}

impl BloomFilterBitArray {
    /// 初始化指定容量與假陽性率 (False Positive Rate) 的布隆過濾器
    pub fn new(expected_elements: usize, false_positive_rate: f64) -> Self {
        let n = expected_elements.max(64) as f64;
        let p = false_positive_rate.clamp(0.0001, 0.5);

        // 最佳位元數計算: m = - (n * ln(p)) / (ln(2)^2)
        let m = (-(n * p.ln()) / (2.0f64.ln().powi(2))).ceil() as usize;
        let bit_count = m.max(512);

        // 最佳散列次數計算: k = (m / n) * ln(2)
        let k = ((bit_count as f64 / n) * 2.0f64.ln()).round() as u8;
        let num_hashes = k.clamp(2, 16);

        let byte_size = (bit_count + 7) / 8;
        BloomFilterBitArray {
            bit_array: vec![0u8; byte_size],
            bit_count,
            num_hashes,
            inserted_elements: 0,
        }
    }

    /// Kirsch-Mitzenmacher 雙重散列計算: g_i(x) = h1(x) + i * h2(x) (mod m)
    #[inline]
    fn get_hash_indices(&self, token: &str) -> (u64, u64) {
        let mut hasher1 = DefaultHasher::new();
        token.hash(&mut hasher1);
        let h1 = hasher1.finish();

        let mut hasher2 = DefaultHasher::new();
        h1.hash(&mut hasher2);
        token.len().hash(&mut hasher2);
        let mut h2 = hasher2.finish();
        if h2 == 0 {
            h2 = 0x517cc1b727220a95; // 避免互質常數為 0
        }

        (h1, h2)
    }

    /// 插入特定關鍵字 Token 至位元陣列
    pub fn insert(&mut self, token: &str) {
        if token.is_empty() {
            return;
        }

        let (h1, h2) = self.get_hash_indices(token);
        for i in 0..self.num_hashes as u64 {
            let bit_idx = (h1.wrapping_add(i.wrapping_mul(h2)) as usize) % self.bit_count;
            let byte_idx = bit_idx / 8;
            let bit_offset = bit_idx % 8;
            self.bit_array[byte_idx] |= 1 << bit_offset;
        }
        self.inserted_elements += 1;
    }

    /// 判定特定關鍵字 Token 是否可能存在
    /// 若回傳 false，則 100% 數學保證此 Block 絕對不含該關鍵字，可零代價跳過解壓縮！
    pub fn may_contain(&self, token: &str) -> bool {
        if token.is_empty() || self.inserted_elements == 0 {
            return false;
        }

        let (h1, h2) = self.get_hash_indices(token);
        for i in 0..self.num_hashes as u64 {
            let bit_idx = (h1.wrapping_add(i.wrapping_mul(h2)) as usize) % self.bit_count;
            let byte_idx = bit_idx / 8;
            let bit_offset = bit_idx % 8;
            if (self.bit_array[byte_idx] & (1 << bit_offset)) == 0 {
                return false;
            }
        }
        true
    }

    /// 自動剖析日誌文字內容，提取 IP、域名、狀態碼、使用者帳號等關鍵詞並建立索引
    pub fn insert_log_text(&mut self, text: &str) {
        for token in text.split(|c: char| !c.is_alphanumeric() && c != '.' && c != '_' && c != '-') {
            if token.len() >= 3 && token.len() <= 64 {
                self.insert(token);
            }
        }
    }
}

// ============================================================================
// 2. Delta Timestamp 編碼欄位數據結構 (DeltaTimestampFields)
// ============================================================================

/// DeltaTimestampFields 封裝相鄰時間戳二階差分 (Delta-of-Delta) 編碼之中繼資訊與壓縮資料
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeltaTimestampFields {
    /// 基準起始時間戳 (通常為 min_timestamp)
    pub base_timestamp: i64,
    /// 最小時間戳 (Unix 奈秒/毫秒)
    pub min_timestamp: i64,
    /// 最大時間戳 (Unix 奈秒/毫秒)
    pub max_timestamp: i64,
    /// 時間戳總筆數 (Rows Count)
    pub count: u32,
    /// 原始 64-bit 時間戳大小 (count * 8 Bytes)
    pub raw_bytes_size: u32,
    /// ZigZag Varint Delta-of-Delta 壓縮後大小 (Bytes)
    pub encoded_bytes_size: u32,
    /// 時間戳專屬壓縮比率 (raw_bytes_size / encoded_bytes_size)
    pub compression_ratio: f64,
}

/// 將 i64 時間戳陣列進行 Delta-of-Delta 二階差分與 ZigZag Varint 編碼
pub fn encode_delta_timestamps(timestamps: &[i64], base_ts: i64) -> Result<Vec<u8>> {
    if timestamps.is_empty() {
        return Ok(Vec::new());
    }

    let mut buf = Vec::with_capacity(timestamps.len() * 2);
    let mut prev_ts = base_ts;
    let mut prev_delta: i64 = 0;

    for &ts in timestamps {
        let delta = ts - prev_ts;
        let delta_of_delta = delta - prev_delta;

        encode_zigzag_varint(delta_of_delta, &mut buf);

        prev_delta = delta;
        prev_ts = ts;
    }

    Ok(buf)
}

/// 解碼 Delta-of-Delta 時間戳二進位串流
pub fn decode_delta_timestamps(encoded: &[u8], count: usize, base_ts: i64) -> Result<Vec<i64>> {
    if count == 0 {
        return Ok(Vec::new());
    }

    let mut cursor = Cursor::new(encoded);
    let mut timestamps = Vec::with_capacity(count);
    let mut prev_ts = base_ts;
    let mut prev_delta: i64 = 0;

    for _ in 0..count {
        let delta_of_delta = decode_zigzag_varint(&mut cursor)?;
        let delta = prev_delta + delta_of_delta;
        let ts = prev_ts + delta;

        timestamps.push(ts);
        prev_delta = delta;
        prev_ts = ts;
    }

    Ok(timestamps)
}

/// 將有符號整數映射為非負整數 (ZigZag) 並以 7-bit Varint 寫入緩衝區
#[inline]
fn encode_zigzag_varint(n: i64, buf: &mut Vec<u8>) {
    let mut zigzag = ((n << 1) ^ (n >> 63)) as u64;
    while zigzag >= 0x80 {
        buf.push((zigzag as u8 & 0x7F) | 0x80);
        zigzag >>= 7;
    }
    buf.push(zigzag as u8);
}

/// 從二進位游標讀取 ZigZag Varint 並還原為 i64
#[inline]
fn decode_zigzag_varint<R: Read>(reader: &mut R) -> Result<i64> {
    let mut zigzag: u64 = 0;
    let mut shift = 0;
    loop {
        let mut byte = [0u8; 1];
        reader.read_exact(&mut byte)?;
        let b = byte[0];
        zigzag |= ((b & 0x7F) as u64) << shift;
        if (b & 0x80) == 0 {
            break;
        }
        shift += 7;
        if shift >= 64 {
            bail!("Varint 溢位超過 64 位元長度");
        }
    }
    let n = ((zigzag >> 1) as i64) ^ (-((zigzag & 1) as i64));
    Ok(n)
}

// ============================================================================
// 3. ZSTD 壓縮標頭數據結構 (ZstdCompressionHeader)
// ============================================================================

/// ZstdCompressionHeader 儲存日誌內容壓縮核心中繼資訊
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZstdCompressionHeader {
    /// 壓縮演算法名稱 ("ZSTD")
    pub algorithm: String,
    /// 壓縮等級 (預設為 Level 3，兼具效能與高壓縮比)
    pub compression_level: i32,
    /// 原始日誌文字總長度 (Bytes)
    pub uncompressed_payload_size: u32,
    /// ZSTD 壓縮後負載大小 (Bytes)
    pub compressed_payload_size: u32,
    /// 內容文字專屬壓縮比
    pub payload_compression_ratio: f64,
}

// ============================================================================
// 4. VictoriaBlockHeader 綜合中繼標頭 (VictoriaBlockHeader)
// ============================================================================

/// VictoriaBlockHeader 整合 Block 識別、ZSTD 標頭、Delta 時間戳欄位與 Bloom Filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VictoriaBlockHeader {
    /// 檔案魔術字 ("VBLK")
    pub magic: [u8; 4],
    /// 格式版本 (v2)
    pub version: u16,
    /// 串流 ID (對應特定標籤組合)
    pub stream_id: u64,
    /// 分區 ID (對應磁碟 /data/{stream_id}/{part_id}.block)
    pub part_id: String,
    /// 此 Block 在 Part 檔案中的連續序號 (1, 2, 3...)
    pub block_id: u32,
    /// 總日誌行數 (Rows Count)
    pub rows_count: u32,
    /// 總原始大小 (日誌文字 + 64-bit 時間戳陣列)
    pub uncompressed_size: u32,
    /// 最終二進位落盤大小
    pub compressed_size: u32,
    /// 總體壓縮倍率
    pub total_compression_ratio: f64,
    /// ZSTD 壓縮核心標頭
    pub zstd_header: ZstdCompressionHeader,
    /// Delta Timestamp 編碼欄位資訊
    pub timestamp_fields: DeltaTimestampFields,
    /// 雙重散列 Bloom Filter 位元陣列 (用於極速剪枝)
    pub bloom_filter: BloomFilterBitArray,
    /// IEEE 802.3 CRC32 完整性校驗碼
    pub checksum: u32,
}

// ============================================================================
// 5. VictoriaBlock 實體結構 (VictoriaBlock)
// ============================================================================

/// VictoriaBlock 記憶體中已完全打包壓縮的不可變資料塊
#[derive(Debug, Clone)]
pub struct VictoriaBlock {
    pub header: VictoriaBlockHeader,
    /// 經 Delta-of-Delta 壓縮之時間戳位元組流
    pub compressed_timestamps: Vec<u8>,
    /// 經 ZSTD 壓縮之日誌文字串流
    pub compressed_payload: Vec<u8>,
    /// 各筆日誌在解壓緩衝區中之位移索引
    pub offsets: Vec<u32>,
}

impl VictoriaBlock {
    /// 序列化為不可變二進位 Frame 寫入磁碟 (遵循 /data/{stream_id}/{part_id}.block 規格)
    pub fn write_to<W: Write>(&self, writer: &mut W) -> Result<usize> {
        let mut total_bytes = 0;

        // 1. 寫入魔術字與版本號
        writer.write_all(&self.header.magic)?;
        writer.write_u16::<BigEndian>(self.header.version)?;
        total_bytes += 6;

        // 2. 寫入 Header JSON
        let header_json = serde_json::to_vec(&self.header)?;
        writer.write_u32::<BigEndian>(header_json.len() as u32)?;
        writer.write_all(&header_json)?;
        total_bytes += 4 + header_json.len();

        // 3. 寫入 Delta-of-Delta 時間戳流
        writer.write_u32::<BigEndian>(self.compressed_timestamps.len() as u32)?;
        writer.write_all(&self.compressed_timestamps)?;
        total_bytes += 4 + self.compressed_timestamps.len();

        // 4. 寫入 ZSTD 壓縮之日誌內容流
        writer.write_u32::<BigEndian>(self.compressed_payload.len() as u32)?;
        writer.write_all(&self.compressed_payload)?;
        total_bytes += 4 + self.compressed_payload.len();

        // 5. 寫入 CRC32 Checksum
        writer.write_u32::<BigEndian>(self.header.checksum)?;
        total_bytes += 4;

        writer.flush()?;
        Ok(total_bytes)
    }

    /// 從磁碟二進位串流反序列化還原 VictoriaBlock，並驗證 CRC32 完整性
    pub fn read_from<R: Read>(reader: &mut R) -> Result<Self> {
        let mut magic = [0u8; 4];
        reader.read_exact(&mut magic)?;
        if magic != BLOCK_MAGIC {
            bail!("無效的 VictoriaBlock 魔術字: {:?}", magic);
        }

        let version = reader.read_u16::<BigEndian>()?;
        if version != BLOCK_VERSION && version != 1 {
            bail!("不支援的 VictoriaBlock 版本: {}", version);
        }

        let header_len = reader.read_u32::<BigEndian>()? as usize;
        let mut header_buf = vec![0u8; header_len];
        reader.read_exact(&mut header_buf)?;
        let header: VictoriaBlockHeader = serde_json::from_slice(&header_buf)
            .context("反序列化 VictoriaBlockHeader 失敗")?;

        let ts_len = reader.read_u32::<BigEndian>()? as usize;
        let mut compressed_timestamps = vec![0u8; ts_len];
        reader.read_exact(&mut compressed_timestamps)?;

        let payload_len = reader.read_u32::<BigEndian>()? as usize;
        let mut compressed_payload = vec![0u8; payload_len];
        reader.read_exact(&mut compressed_payload)?;

        let stored_checksum = reader.read_u32::<BigEndian>()?;
        let computed_checksum = compute_crc32(&compressed_timestamps, &compressed_payload);
        if stored_checksum != computed_checksum {
            bail!(
                "VictoriaBlock CRC32 校驗失敗 (儲存值: 0x{:08X}, 計算值: 0x{:08X})",
                stored_checksum,
                computed_checksum
            );
        }

        Ok(VictoriaBlock {
            header,
            compressed_timestamps,
            compressed_payload,
            offsets: Vec::new(),
        })
    }

    /// 解壓縮還原該 Block 內的所有時間戳與原始日誌行
    pub fn decompress_rows(&self) -> Result<Vec<(i64, String)>> {
        // 1. 解碼 Delta-of-Delta 時間戳
        let timestamps = decode_delta_timestamps(
            &self.compressed_timestamps,
            self.header.rows_count as usize,
            self.header.timestamp_fields.min_timestamp,
        )?;

        // 2. 解壓縮 Zstandard 日誌內容
        let mut decoder = zstd::stream::read::Decoder::new(Cursor::new(&self.compressed_payload))?;
        let mut raw_bytes = Vec::with_capacity(self.header.zstd_header.uncompressed_payload_size as usize);
        decoder.read_to_end(&mut raw_bytes)?;

        // 3. 切分日誌行
        let content_str = String::from_utf8(raw_bytes).context("UTF-8 解碼失敗")?;
        let lines: Vec<&str> = content_str.split('\n').filter(|l| !l.is_empty()).collect();

        let mut rows = Vec::with_capacity(self.header.rows_count as usize);
        for (i, line) in lines.into_iter().enumerate() {
            let ts = if i < timestamps.len() {
                timestamps[i]
            } else {
                self.header.timestamp_fields.min_timestamp
            };
            rows.push((ts, line.to_string()));
        }

        Ok(rows)
    }
}

// ============================================================================
// 6. BlockBuilder 結構實作 (BlockBuilder)
// ============================================================================

/// BlockBuilder 負責即時收集進線日誌、維護 Bloom Filter 索引，並在達到閾值時壓縮產出 VictoriaBlock
pub struct BlockBuilder {
    pub stream_id: u64,
    pub part_id: String,
    pub block_id: u32,
    pub timestamps: Vec<i64>,
    pub payload_buffer: Vec<u8>,
    pub offsets: Vec<u32>,
    pub bloom_filter: BloomFilterBitArray,
    pub max_block_rows: usize,
    pub max_block_bytes: usize,
    pub zstd_level: i32,
}

impl BlockBuilder {
    /// 建立新的 Block 構建器實例
    pub fn new(
        stream_id: u64,
        part_id: &str,
        block_id: u32,
        max_rows: usize,
        max_bytes: usize,
    ) -> Self {
        let max_rows = if max_rows == 0 { DEFAULT_MAX_BLOCK_ROWS } else { max_rows };
        let max_bytes = if max_bytes == 0 { DEFAULT_MAX_BLOCK_BYTES } else { max_bytes };

        BlockBuilder {
            stream_id,
            part_id: part_id.to_string(),
            block_id,
            timestamps: Vec::with_capacity(max_rows),
            payload_buffer: Vec::with_capacity(max_bytes),
            offsets: Vec::with_capacity(max_rows),
            bloom_filter: BloomFilterBitArray::new(max_rows * 6, 0.01),
            max_block_rows: max_rows,
            max_block_bytes: max_bytes,
            zstd_level: 3,
        }
    }

    /// 加入單筆日誌至待壓縮緩衝區，並自動提取關鍵字建立 Bloom Filter 索引
    pub fn add_row(&mut self, timestamp: i64, message: &str) {
        self.offsets.push(self.payload_buffer.len() as u32);
        self.timestamps.push(timestamp);
        self.payload_buffer.extend_from_slice(message.as_bytes());
        self.payload_buffer.push(b'\n');

        // 自動詞彙標記化 (IP, 域名, 使用者, 事件 ID 等)
        self.bloom_filter.insert_log_text(message);
    }

    /// 判斷緩衝區是否已達到 Block 封裝上限 (預設 4,096 筆或 2MB)
    pub fn is_full(&self) -> bool {
        self.timestamps.len() >= self.max_block_rows
            || self.payload_buffer.len() >= self.max_block_bytes
    }

    /// 判斷緩衝區是否為空
    pub fn is_empty(&self) -> bool {
        self.timestamps.is_empty()
    }

    /// 取得目前累積日誌行數
    pub fn rows_count(&self) -> usize {
        self.timestamps.len()
    }

    /// 取得目前累積未壓縮位元組數 (含時間戳)
    pub fn uncompressed_bytes(&self) -> usize {
        self.payload_buffer.len() + self.timestamps.len() * 8
    }

    /// 執行封裝壓縮程序，產出不可變的 VictoriaBlock
    pub fn build(self) -> Result<VictoriaBlock> {
        let rows_count = self.timestamps.len() as u32;
        if rows_count == 0 {
            bail!("無法為空緩衝區建構 VictoriaBlock");
        }

        let min_timestamp = *self.timestamps.iter().min().unwrap();
        let max_timestamp = *self.timestamps.iter().max().unwrap();
        let raw_payload_size = self.payload_buffer.len() as u32;
        let raw_timestamps_size = rows_count * 8;
        let uncompressed_size = raw_payload_size + raw_timestamps_size;

        // 1. Delta-of-Delta 時間戳極致壓縮 (ZigZag Varint)
        let compressed_timestamps = encode_delta_timestamps(&self.timestamps, min_timestamp)?;
        let compressed_timestamps_size = compressed_timestamps.len() as u32;
        let ts_ratio = if compressed_timestamps_size > 0 {
            raw_timestamps_size as f64 / compressed_timestamps_size as f64
        } else {
            1.0
        };

        let timestamp_fields = DeltaTimestampFields {
            base_timestamp: min_timestamp,
            min_timestamp,
            max_timestamp,
            count: rows_count,
            raw_bytes_size: raw_timestamps_size,
            encoded_bytes_size: compressed_timestamps_size,
            compression_ratio: ts_ratio,
        };

        // 2. ZSTD 日誌本文壓縮 (Level 3)
        let compressed_payload = zstd::encode_all(Cursor::new(&self.payload_buffer), self.zstd_level)?;
        let compressed_payload_size = compressed_payload.len() as u32;
        let payload_ratio = if compressed_payload_size > 0 {
            raw_payload_size as f64 / compressed_payload_size as f64
        } else {
            1.0
        };

        let zstd_header = ZstdCompressionHeader {
            algorithm: "ZSTD".to_string(),
            compression_level: self.zstd_level,
            uncompressed_payload_size: raw_payload_size,
            compressed_payload_size,
            payload_compression_ratio: payload_ratio,
        };

        let total_compressed_size = compressed_timestamps_size + compressed_payload_size;
        let total_ratio = if total_compressed_size > 0 {
            uncompressed_size as f64 / total_compressed_size as f64
        } else {
            1.0
        };

        // 3. 計算 IEEE 802.3 CRC32 Checksum
        let checksum = compute_crc32(&compressed_timestamps, &compressed_payload);

        let header = VictoriaBlockHeader {
            magic: BLOCK_MAGIC,
            version: BLOCK_VERSION,
            stream_id: self.stream_id,
            part_id: self.part_id,
            block_id: self.block_id,
            rows_count,
            uncompressed_size,
            compressed_size: total_compressed_size,
            total_compression_ratio: total_ratio,
            zstd_header,
            timestamp_fields,
            bloom_filter: self.bloom_filter,
            checksum,
        };

        Ok(VictoriaBlock {
            header,
            compressed_timestamps,
            compressed_payload,
            offsets: self.offsets,
        })
    }
}

/// 計算時間戳流與日誌內容流之結合 CRC32 校驗碼
pub fn compute_crc32(ts: &[u8], payload: &[u8]) -> u32 {
    let mut hasher = Crc32Hasher::new();
    hasher.update(ts);
    hasher.update(payload);
    hasher.finalize()
}

// ============================================================================
// 單元測試與驗證 (Unit Tests)
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bloom_filter_bit_array() {
        let mut filter = BloomFilterBitArray::new(100, 0.01);
        filter.insert("192.168.1.100");
        filter.insert("CVE-2024-3400");
        filter.insert("admin");

        assert!(filter.may_contain("192.168.1.100"));
        assert!(filter.may_contain("CVE-2024-3400"));
        assert!(filter.may_contain("admin"));
        assert!(!filter.may_contain("NON_EXISTENT_TOKEN_9999"));
    }

    #[test]
    fn test_delta_timestamp_encoding_decoding() {
        let base_ts = 1710000000000i64;
        let mut timestamps = Vec::new();
        for i in 0..100 {
            timestamps.push(base_ts + i * 50); // 每 50ms 一筆
        }

        let encoded = encode_delta_timestamps(&timestamps, base_ts).unwrap();
        // 驗證二階差分在高頻規律日誌下壓縮成極小位元組數 (每筆約 1 byte)
        assert!(encoded.len() <= timestamps.len() * 2);

        let decoded = decode_delta_timestamps(&encoded, timestamps.len(), base_ts).unwrap();
        assert_eq!(timestamps, decoded);
    }

    #[test]
    fn test_block_builder_and_zstd_compression() {
        let mut builder = BlockBuilder::new(1001, "part_0000000000000001", 1, 50, 1024 * 1024);
        let base_ts = 1710000000000i64;

        for i in 0..30 {
            let msg = format!("2026-09-14 07:30:00 [AUDIT] user=admin src=10.0.0.{} action=LOGIN_SUCCESS", i);
            builder.add_row(base_ts + i * 100, &msg);
        }

        assert_eq!(builder.rows_count(), 30);
        assert!(!builder.is_empty());

        let block = builder.build().unwrap();
        assert_eq!(block.header.rows_count, 30);
        assert_eq!(block.header.magic, BLOCK_MAGIC);
        assert!(block.header.total_compression_ratio > 1.5);

        // 測試二進位寫入與還原
        let mut buffer = Vec::new();
        block.write_to(&mut buffer).unwrap();

        let mut reader = Cursor::new(&buffer);
        let recovered_block = VictoriaBlock::read_from(&mut reader).unwrap();
        assert_eq!(recovered_block.header.rows_count, 30);
        assert_eq!(recovered_block.header.checksum, block.header.checksum);

        let decompressed = recovered_block.decompress_rows().unwrap();
        assert_eq!(decompressed.len(), 30);
        assert!(decompressed[0].1.contains("user=admin"));
    }
}

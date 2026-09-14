use anyhow::{bail, Context, Result};
use byteorder::{BigEndian, ReadBytesExt, WriteBytesExt};
use serde::{Deserialize, Serialize};
use std::io::{Cursor, Read, Write};

use crate::bloom::FastBloomFilter;

/// 二進位 Block 檔案識別魔術字 (VictoriaLog Block)
pub const BLOCK_MAGIC: [u8; 4] = *b"VBLK";
/// Block 二進位編碼版本
pub const BLOCK_VERSION: u16 = 2;

/// VictoriaBlockHeader 儲存資料塊中繼資訊 (Metadata Header)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VictoriaBlockHeader {
    /// 檔案魔術字
    pub magic: [u8; 4],
    /// 格式版本
    pub version: u16,
    /// 串流 ID (對應特定日誌標籤組合)
    pub stream_id: u64,
    /// 分區 ID (對應磁碟 /data/{stream_id}/{part_id}.block)
    pub part_id: String,
    /// 此 Block 在 Part 中的序號
    pub block_id: u32,
    /// 最小時間戳 (奈秒/毫秒)
    pub min_timestamp: i64,
    /// 最大時間戳 (奈秒/毫秒)
    pub max_timestamp: i64,
    /// 此 Block 包含的日誌總行數 (通常為 4096 筆)
    pub rows_count: u32,
    /// 原始未壓縮大小 (日誌本文 + 原始 64-bit 時間戳陣列)
    pub uncompressed_size: u32,
    /// 最終落盤壓縮後大小 (含 Header、壓縮時間戳與 ZSTD 負載)
    pub compressed_size: u32,
    /// 原始時間戳大小 (8 * rows_count)
    pub raw_timestamps_size: u32,
    /// Delta-of-Delta 編碼後之時間戳大小 (位元組)
    pub compressed_timestamps_size: u32,
    /// 原始日誌文字大小 (位元組)
    pub raw_payload_size: u32,
    /// ZSTD (Level 3) 壓縮後日誌文字大小 (位元組)
    pub compressed_payload_size: u32,
    /// 專屬二進位布隆過濾器 (用於解壓縮前極速剪枝)
    pub bloom_filter: FastBloomFilter,
    /// CRC32-IEEE 校驗碼 (保護時間戳與日誌資料完整性)
    pub checksum: u32,
}

/// VictoriaBlock 代表記憶體與磁碟中的高壓縮日誌資料塊
#[derive(Debug, Clone)]
pub struct VictoriaBlock {
    pub header: VictoriaBlockHeader,
    /// 經 Delta-of-Delta + ZigZag Varint 壓縮之時間戳位元組流
    pub compressed_timestamps: Vec<u8>,
    /// 經 ZSTD (Level 3) 批次壓縮之日誌內容流
    pub compressed_payload: Vec<u8>,
    /// 各筆日誌在解壓縮緩衝區中的起始偏移量陣列 (用於隨機抽樣或按行讀取)
    pub offsets: Vec<u32>,
}

impl VictoriaBlock {
    /// 序列化寫入磁碟之二進位 Frame
    ///
    /// 二進位磁碟佈局格式：
    /// [Magic: 4B "VBLK"]
    /// [Version: 2B u16]
    /// [Header JSON Length: 4B u32]
    /// [Header JSON Bytes]
    /// [Timestamps Stream Length: 4B u32]
    /// [Timestamps Stream Bytes (Delta-of-Delta)]
    /// [Payload Stream Length: 4B u32]
    /// [Payload Stream Bytes (ZSTD)]
    /// [CRC32 Checksum: 4B u32]
    pub fn write_to<W: Write>(&self, writer: &mut W) -> Result<usize> {
        let mut total_bytes = 0;

        // 1. 寫入魔術字與版本
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

        // 4. 寫入 ZSTD 壓縮之日誌文字流
        writer.write_u32::<BigEndian>(self.compressed_payload.len() as u32)?;
        writer.write_all(&self.compressed_payload)?;
        total_bytes += 4 + self.compressed_payload.len();

        // 5. 寫入 CRC32 完整性校驗碼
        writer.write_u32::<BigEndian>(self.header.checksum)?;
        total_bytes += 4;

        writer.flush()?;
        Ok(total_bytes)
    }

    /// 從磁碟二進位串流還原 VictoriaBlock
    pub fn read_from<R: Read>(reader: &mut R) -> Result<Self> {
        // 1. 驗證魔術字
        let mut magic = [0u8; 4];
        reader.read_exact(&mut magic)?;
        if magic != BLOCK_MAGIC {
            bail!("無效的 VictoriaBlock 魔術字: {:?}", magic);
        }

        // 2. 驗證格式版本
        let version = reader.read_u16::<BigEndian>()?;
        if version != BLOCK_VERSION && version != 1 {
            bail!("不支援的 VictoriaBlock 版本: {}", version);
        }

        // 3. 讀取 Header JSON
        let header_len = reader.read_u32::<BigEndian>()? as usize;
        let mut header_buf = vec![0u8; header_len];
        reader.read_exact(&mut header_buf)?;
        let header: VictoriaBlockHeader = serde_json::from_slice(&header_buf)
            .context("反序列化 VictoriaBlockHeader 失敗")?;

        // 4. 讀取 Delta-of-Delta 時間戳流
        let ts_len = reader.read_u32::<BigEndian>()? as usize;
        let mut compressed_timestamps = vec![0u8; ts_len];
        reader.read_exact(&mut compressed_timestamps)?;

        // 5. 讀取 ZSTD 壓縮之日誌內容流
        let payload_len = reader.read_u32::<BigEndian>()? as usize;
        let mut compressed_payload = vec![0u8; payload_len];
        reader.read_exact(&mut compressed_payload)?;

        // 6. 驗證 CRC32
        let stored_checksum = reader.read_u32::<BigEndian>()?;
        let computed_checksum = compute_crc32_combined(&compressed_timestamps, &compressed_payload);
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

    /// 解壓縮並還原該 Block 內的所有原始日誌行與時間戳
    pub fn decompress_rows(&self) -> Result<Vec<(i64, String)>> {
        // 1. 解壓縮時間戳 (Delta-of-Delta decode)
        let timestamps = decode_delta_timestamps(
            &self.compressed_timestamps,
            self.header.rows_count as usize,
            self.header.min_timestamp,
        )?;

        // 2. 解壓縮日誌文字 (Zstandard decode)
        let mut decoder = zstd::stream::read::Decoder::new(Cursor::new(&self.compressed_payload))?;
        let mut raw_bytes = Vec::with_capacity(self.header.raw_payload_size as usize);
        decoder.read_to_end(&mut raw_bytes)?;

        // 3. 依換行符切割每一行
        let mut rows = Vec::with_capacity(self.header.rows_count as usize);
        let content_str = String::from_utf8(raw_bytes).context("日誌本文 UTF-8 解碼失敗")?;

        let lines: Vec<&str> = content_str.split('\n').filter(|l| !l.is_empty()).collect();
        for (i, line) in lines.into_iter().enumerate() {
            let ts = if i < timestamps.len() {
                timestamps[i]
            } else {
                self.header.min_timestamp
            };
            rows.push((ts, line.to_string()));
        }

        Ok(rows)
    }

    /// 取得總體壓縮比 (原始總位元組 / 壓縮後總位元組)
    pub fn compression_ratio(&self) -> f64 {
        let total_compressed =
            (self.compressed_timestamps.len() + self.compressed_payload.len()) as f64;
        if total_compressed == 0.0 {
            return 1.0;
        }
        self.header.uncompressed_size as f64 / total_compressed
    }

    /// 取得時間戳專屬壓縮比
    pub fn timestamp_compression_ratio(&self) -> f64 {
        if self.compressed_timestamps.is_empty() {
            return 1.0;
        }
        self.header.raw_timestamps_size as f64 / self.compressed_timestamps.len() as f64
    }

    /// 取得日誌文字 ZSTD 專屬壓縮比
    pub fn payload_compression_ratio(&self) -> f64 {
        if self.compressed_payload.is_empty() {
            return 1.0;
        }
        self.header.raw_payload_size as f64 / self.compressed_payload.len() as f64
    }
}

/// BlockBuilder 用於將進線日誌累積、Tokenize 並構建出不可變的 VictoriaBlock
pub struct BlockBuilder {
    stream_id: u64,
    part_id: String,
    block_id: u32,
    timestamps: Vec<i64>,
    payload_buffer: Vec<u8>,
    offsets: Vec<u32>,
    bloom_filter: FastBloomFilter,
    max_block_rows: usize,
    max_block_bytes: usize,
}

impl BlockBuilder {
    pub fn new(
        stream_id: u64,
        part_id: &str,
        block_id: u32,
        max_rows: usize,
        max_bytes: usize,
    ) -> Self {
        BlockBuilder {
            stream_id,
            part_id: part_id.to_string(),
            block_id,
            timestamps: Vec::with_capacity(max_rows),
            payload_buffer: Vec::with_capacity(max_bytes),
            offsets: Vec::with_capacity(max_rows),
            bloom_filter: FastBloomFilter::new(max_rows * 6, 0.01),
            max_block_rows: max_rows,
            max_block_bytes: max_bytes,
        }
    }

    /// 加入一筆日誌至待壓縮緩衝區
    pub fn add_row(&mut self, timestamp: i64, message: &str) {
        self.offsets.push(self.payload_buffer.len() as u32);
        self.timestamps.push(timestamp);
        self.payload_buffer.extend_from_slice(message.as_bytes());
        self.payload_buffer.push(b'\n');

        // 將日誌中的關鍵字 Token 建立到 Bloom Filter 索引
        self.bloom_filter.insert_log_text(message);
    }

    /// 判斷目前緩衝區是否已達單個 Block 上限 (預設 4,096 筆或 2MB)
    pub fn is_full(&self) -> bool {
        self.timestamps.len() >= self.max_block_rows
            || self.payload_buffer.len() >= self.max_block_bytes
    }

    /// 判斷緩衝區是否為空
    pub fn is_empty(&self) -> bool {
        self.timestamps.is_empty()
    }

    /// 取得目前緩衝區累積日誌筆數
    pub fn rows_count(&self) -> usize {
        self.timestamps.len()
    }

    /// 取得目前緩衝區累積位元組數
    pub fn uncompressed_bytes(&self) -> usize {
        self.payload_buffer.len() + self.timestamps.len() * 8
    }

    /// 執行壓縮封裝，產生最終不可變的 VictoriaBlock
    pub fn build(mut self) -> Result<VictoriaBlock> {
        let rows_count = self.timestamps.len() as u32;
        if rows_count == 0 {
            bail!("無法為空緩衝區建構 VictoriaBlock");
        }

        let min_timestamp = *self.timestamps.iter().min().unwrap();
        let max_timestamp = *self.timestamps.iter().max().unwrap();
        let raw_payload_size = self.payload_buffer.len() as u32;
        let raw_timestamps_size = rows_count * 8;
        let uncompressed_size = raw_payload_size + raw_timestamps_size;

        // 1. Delta-of-Delta 時間戳編碼 (VictoriaMetrics / VictoriaLogs 核心演算法)
        let compressed_timestamps = encode_delta_timestamps(&self.timestamps, min_timestamp)?;
        let compressed_timestamps_size = compressed_timestamps.len() as u32;

        // 2. Zstandard 日誌內容壓縮 (等級 3，兼具每秒數百 MB 之寫入速度與 10x+ 壓縮比)
        let compressed_payload = zstd::encode_all(Cursor::new(&self.payload_buffer), 3)?;
        let compressed_payload_size = compressed_payload.len() as u32;
        let compressed_size = compressed_timestamps_size + compressed_payload_size;

        // 3. 計算完整性校驗碼
        let checksum = compute_crc32_combined(&compressed_timestamps, &compressed_payload);

        let header = VictoriaBlockHeader {
            magic: BLOCK_MAGIC,
            version: BLOCK_VERSION,
            stream_id: self.stream_id,
            part_id: self.part_id,
            block_id: self.block_id,
            min_timestamp,
            max_timestamp,
            rows_count,
            uncompressed_size,
            compressed_size,
            raw_timestamps_size,
            compressed_timestamps_size,
            raw_payload_size,
            compressed_payload_size,
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

// ============================================================================
// Delta-of-Delta 數值壓縮演算法 (VictoriaMetrics / VictoriaLogs 核心實作)
// ============================================================================

/// 將時間戳序列進行差值之差值 (Delta-of-Delta) 編碼，並透過 ZigZag Varint 打包
pub fn encode_delta_timestamps(timestamps: &[i64], base_ts: i64) -> Result<Vec<u8>> {
    let mut buf = Vec::with_capacity(timestamps.len() * 2);
    let mut prev_ts = base_ts;
    let mut prev_delta: i64 = 0;

    for &ts in timestamps {
        let delta = ts - prev_ts;
        let delta_of_delta = delta - prev_delta;

        // 使用 Varint / ZigZag 壓縮差值的差值
        encode_zigzag_varint(delta_of_delta, &mut buf);

        prev_ts = ts;
        prev_delta = delta;
    }
    Ok(buf)
}

/// 解碼 Delta-of-Delta 位元組流，完全無失真還原原始時間戳序列
pub fn decode_delta_timestamps(bytes: &[u8], count: usize, base_ts: i64) -> Result<Vec<i64>> {
    let mut cursor = Cursor::new(bytes);
    let mut timestamps = Vec::with_capacity(count);
    let mut prev_ts = base_ts;
    let mut prev_delta: i64 = 0;

    for _ in 0..count {
        let delta_of_delta = decode_zigzag_varint(&mut cursor)?;
        let delta = prev_delta + delta_of_delta;
        let ts = prev_ts + delta;

        timestamps.push(ts);
        prev_ts = ts;
        prev_delta = delta;
    }
    Ok(timestamps)
}

/// ZigZag Varint 編碼：將有符號整數映射為無符號，並以 7-bit 變長字節打包
#[inline]
fn encode_zigzag_varint(n: i64, buf: &mut Vec<u8>) {
    let mut zz = ((n << 1) ^ (n >> 63)) as u64;
    while zz >= 0x80 {
        buf.push(((zz & 0x7F) as u8) | 0x80);
        zz >>= 7;
    }
    buf.push(zz as u8);
}

/// ZigZag Varint 解碼
#[inline]
fn decode_zigzag_varint<R: Read>(reader: &mut R) -> Result<i64> {
    let mut val: u64 = 0;
    let mut shift = 0;
    let mut byte = [0u8; 1];

    loop {
        reader.read_exact(&mut byte)?;
        let b = byte[0];
        val |= ((b & 0x7F) as u64) << shift;
        if (b & 0x80) == 0 {
            break;
        }
        shift += 7;
        if shift >= 64 {
            bail!("Varint 解碼溢位");
        }
    }

    let n = ((val >> 1) as i64) ^ (-((val & 1) as i64));
    Ok(n)
}

// ============================================================================
// 高效能 CRC32-IEEE 校驗碼實作 (保護落盤 Block 資料無位元翻轉與損壞)
// ============================================================================

const CRC32_TABLE: [u32; 256] = generate_crc32_table();

const fn generate_crc32_table() -> [u32; 256] {
    let mut table = [0u32; 256];
    let mut i = 0;
    while i < 256 {
        let mut crc = i as u32;
        let mut j = 0;
        while j < 8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB88320;
            } else {
                crc >>= 1;
            }
            j += 1;
        }
        table[i] = crc;
        i += 1;
    }
    table
}

pub fn compute_crc32(data: &[u8]) -> u32 {
    let mut crc = !0u32;
    for &byte in data {
        let table_idx = ((crc ^ (byte as u32)) & 0xFF) as usize;
        crc = (crc >> 8) ^ CRC32_TABLE[table_idx];
    }
    !crc
}

pub fn compute_crc32_combined(data1: &[u8], data2: &[u8]) -> u32 {
    let mut crc = !0u32;
    for &byte in data1 {
        let table_idx = ((crc ^ (byte as u32)) & 0xFF) as usize;
        crc = (crc >> 8) ^ CRC32_TABLE[table_idx];
    }
    for &byte in data2 {
        let table_idx = ((crc ^ (byte as u32)) & 0xFF) as usize;
        crc = (crc >> 8) ^ CRC32_TABLE[table_idx];
    }
    !crc
}

// ============================================================================
// 單元測試：保證 Delta-of-Delta、ZSTD 壓縮與 CRC32 完美無失真
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_delta_of_delta_lossless_roundtrip() {
        let base = 1_700_000_000_000_000_000i64;
        let mut timestamps = Vec::new();
        // 模擬規律日誌 (每 10ms 一筆) 混合隨機抖動
        for i in 0..1000 {
            timestamps.push(base + (i * 10_000_000) + (i % 5) * 100);
        }

        let encoded = encode_delta_timestamps(&timestamps, base).unwrap();
        // 1000 筆 64-bit 時間戳 (原始 8,000 位元組)，經 Delta-of-Delta 應壓縮至極小體積
        assert!(
            encoded.len() < 1500,
            "Delta-of-Delta 應將時間戳壓縮至每筆 1~1.5 位元組以下 (實際大小: {} B)",
            encoded.len()
        );

        let decoded = decode_delta_timestamps(&encoded, timestamps.len(), base).unwrap();
        assert_eq!(timestamps, decoded, "解碼後時間戳必須與原始數值 100% 完全一致");
    }

    #[test]
    fn test_block_builder_and_io_roundtrip() {
        let mut builder = BlockBuilder::new(1001, "part_0000000000000001", 1, 100, 1024 * 1024);
        let base_ts = 1710000000000;

        for i in 0..50 {
            let msg = format!(
                "Sep 14 07:20:{:02} server01 kernel: [AUTH_OK] user=admin_{} ip=10.0.0.{}",
                i % 60,
                i,
                i % 254
            );
            builder.add_row(base_ts + i * 200, &msg);
        }

        let block = builder.build().unwrap();
        assert_eq!(block.header.rows_count, 50);
        assert!(block.compression_ratio() > 1.0);

        // 測試二進位磁碟寫入與還原
        let mut disk_buf = Vec::new();
        let written = block.write_to(&mut disk_buf).unwrap();
        assert!(written > 0);

        let mut read_cursor = Cursor::new(&disk_buf);
        let restored_block = VictoriaBlock::read_from(&mut read_cursor).unwrap();
        assert_eq!(restored_block.header.stream_id, 1001);
        assert_eq!(restored_block.header.part_id, "part_0000000000000001");
        assert_eq!(restored_block.header.rows_count, 50);

        // 驗證解壓縮後文字與時間戳
        let rows = restored_block.decompress_rows().unwrap();
        assert_eq!(rows.len(), 50);
        assert!(rows[0].1.contains("user=admin_0"));
        assert!(rows[49].1.contains("user=admin_49"));
    }
}

use anyhow::{Context, Result};
use byteorder::{BigEndian, ReadBytesExt, WriteBytesExt};
use serde::{Deserialize, Serialize};
use std::io::{Cursor, Read, Write};

use crate::bloom::FastBloomFilter;

/// VictoriaBlockHeader 儲存資料塊中繼資訊
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VictoriaBlockHeader {
    pub stream_id: u64,
    pub min_timestamp: i64,
    pub max_timestamp: i64,
    pub rows_count: u32,
    pub uncompressed_size: u32,
    pub compressed_size: u32,
    pub bloom_filter: FastBloomFilter,
}

/// VictoriaBlock 代表記憶體與磁碟中的高壓縮日誌資料塊
#[derive(Debug, Clone)]
pub struct VictoriaBlock {
    pub header: VictoriaBlockHeader,
    /// 經 Delta-of-Delta 壓縮之時間戳位元組流
    pub compressed_timestamps: Vec<u8>,
    /// 經 ZSTD 壓縮之日誌內容流
    pub compressed_payload: Vec<u8>,
    /// 各筆日誌在解壓縮緩衝中的偏移量陣列 (用於隨機抽樣或按行讀取)
    pub offsets: Vec<u32>,
}

impl VictoriaBlock {
    /// 序列化寫入磁碟之二進位 Frame
    pub fn write_to<W: Write>(&self, writer: &mut W) -> Result<()> {
        let header_json = serde_json::to_vec(&self.header)?;
        writer.write_u32::<BigEndian>(header_json.len() as u32)?;
        writer.write_all(&header_json)?;

        writer.write_u32::<BigEndian>(self.compressed_timestamps.len() as u32)?;
        writer.write_all(&self.compressed_timestamps)?;

        writer.write_u32::<BigEndian>(self.compressed_payload.len() as u32)?;
        writer.write_all(&self.compressed_payload)?;

        writer.flush()?;
        Ok(())
    }

    /// 從磁碟讀取二進位 Frame
    pub fn read_from<R: Read>(reader: &mut R) -> Result<Self> {
        let header_len = reader.read_u32::<BigEndian>()? as usize;
        let mut header_buf = vec![0u8; header_len];
        reader.read_exact(&mut header_buf)?;
        let header: VictoriaBlockHeader = serde_json::from_slice(&header_buf)?;

        let ts_len = reader.read_u32::<BigEndian>()? as usize;
        let mut compressed_timestamps = vec![0u8; ts_len];
        reader.read_exact(&mut compressed_timestamps)?;

        let payload_len = reader.read_u32::<BigEndian>()? as usize;
        let mut compressed_payload = vec![0u8; payload_len];
        reader.read_exact(&mut compressed_payload)?;

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
        let timestamps = decode_delta_timestamps(&self.compressed_timestamps, self.header.rows_count as usize, self.header.min_timestamp)?;

        // 2. 解壓縮日誌內容 (ZSTD decode)
        let mut decoder = zstd::stream::read::Decoder::new(Cursor::new(&self.compressed_payload))?;
        let mut raw_bytes = Vec::with_capacity(self.header.uncompressed_size as usize);
        decoder.read_to_end(&mut raw_bytes)?;

        // 3. 依換行符切割行
        let mut rows = Vec::with_capacity(self.header.rows_count as usize);
        let content_str = String::from_utf8(raw_bytes).context("UTF-8 解碼失敗")?;
        
        let lines: Vec<&str> = content_str.split('\n').filter(|l| !l.is_empty()).collect();
        for (i, line) in lines.into_iter().enumerate() {
            let ts = if i < timestamps.len() { timestamps[i] } else { self.header.min_timestamp };
            rows.push((ts, line.to_string()));
        }

        Ok(rows)
    }

    /// 取得整體壓縮比 (例如: 8.5x 代表體積縮小至原本的 1/8.5)
    pub fn compression_ratio(&self) -> f64 {
        let total_compressed = (self.compressed_timestamps.len() + self.compressed_payload.len()) as f64;
        if total_compressed == 0.0 {
            return 1.0;
        }
        self.header.uncompressed_size as f64 / total_compressed
    }
}

/// BlockBuilder 用於將進線日誌累積並構建出 VictoriaBlock
pub struct BlockBuilder {
    stream_id: u64,
    timestamps: Vec<i64>,
    payload_buffer: Vec<u8>,
    offsets: Vec<u32>,
    bloom_filter: FastBloomFilter,
    max_block_rows: usize,
    max_block_bytes: usize,
}

impl BlockBuilder {
    pub fn new(stream_id: u64, max_rows: usize, max_bytes: usize) -> Self {
        BlockBuilder {
            stream_id,
            timestamps: Vec::with_capacity(max_rows),
            payload_buffer: Vec::with_capacity(max_bytes),
            offsets: Vec::with_capacity(max_rows),
            bloom_filter: FastBloomFilter::new(max_rows * 8, 0.01),
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

        // 將日誌中的關鍵字 Token 加入 Bloom Filter (以空白與常見符號切詞)
        for token in message.split(|c: char| !c.is_alphanumeric() && c != '.' && c != '-' && c != '_') {
            if token.len() >= 3 {
                self.bloom_filter.insert(token);
            }
        }
    }

    pub fn is_full(&self) -> bool {
        self.timestamps.len() >= self.max_block_rows || self.payload_buffer.len() >= self.max_block_bytes
    }

    pub fn is_empty(&self) -> bool {
        self.timestamps.is_empty()
    }

    /// 執行壓縮封裝，產生最終不可變的 VictoriaBlock
    pub fn build(mut self) -> Result<VictoriaBlock> {
        let rows_count = self.timestamps.len() as u32;
        if rows_count == 0 {
            anyhow::bail!("無法為空緩衝區建構 Block");
        }

        let min_timestamp = *self.timestamps.iter().min().unwrap();
        let max_timestamp = *self.timestamps.iter().max().unwrap();
        let uncompressed_size = self.payload_buffer.len() as u32;

        // 1. Delta-of-Delta 時間戳壓縮
        let compressed_timestamps = encode_delta_timestamps(&self.timestamps, min_timestamp)?;

        // 2. Zstandard 日誌內容壓縮 (等級 3，兼具高速寫入與高壓縮比)
        let compressed_payload = zstd::encode_all(Cursor::new(&self.payload_buffer), 3)?;
        let compressed_size = (compressed_timestamps.len() + compressed_payload.len()) as u32;

        let header = VictoriaBlockHeader {
            stream_id: self.stream_id,
            min_timestamp,
            max_timestamp,
            rows_count,
            uncompressed_size,
            compressed_size,
            bloom_filter: self.bloom_filter,
        };

        Ok(VictoriaBlock {
            header,
            compressed_timestamps,
            compressed_payload,
            offsets: self.offsets,
        })
    }
}

// -------------------------------------------------------------
// Delta-of-Delta 數值壓縮實作 (VictoriaMetrics/VictoriaLogs 算法)
// -------------------------------------------------------------

fn encode_delta_timestamps(timestamps: &[i64], base_ts: i64) -> Result<Vec<u8>> {
    let mut buf = Vec::new();
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

fn decode_delta_timestamps(bytes: &[u8], count: usize, base_ts: i64) -> Result<Vec<i64>> {
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

fn encode_zigzag_varint(n: i64, buf: &mut Vec<u8>) {
    let mut zz = ((n << 1) ^ (n >> 63)) as u64;
    while zz >= 0x80 {
        buf.push(((zz & 0x7F) as u8) | 0x80);
        zz >>= 7;
    }
    buf.push(zz as u8);
}

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
            anyhow::bail!("Varint 解碼溢位");
        }
    }

    let n = ((val >> 1) as i64) ^ (-((val & 1) as i64));
    Ok(n)
}

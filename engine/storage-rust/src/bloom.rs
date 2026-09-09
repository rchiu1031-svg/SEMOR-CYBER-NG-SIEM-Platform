use serde::{Deserialize, Serialize};

/// FastBloomFilter 專為 VictoriaLogs 資料塊設計之輕量級布隆過濾器
/// 用於在解壓縮資料塊前，快速剔除不含目標關鍵字 (IP, User, Error Code) 的 Block
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FastBloomFilter {
    bitset: Vec<u64>,
    num_bits: usize,
    num_hashes: usize,
}

impl FastBloomFilter {
    /// 建立指定預估項目數與誤報率之布隆過濾器
    pub fn new(expected_items: usize, false_positive_rate: f64) -> Self {
        let ln2 = std::f64::consts::LN_2;
        let num_bits = (-1.0 * (expected_items as f64) * false_positive_rate.ln() / (ln2 * ln2)).ceil() as usize;
        let num_bits = (num_bits.max(64) + 63) / 64 * 64; // 對齊 64-bit word
        let num_hashes = ((num_bits as f64 / expected_items as f64) * ln2).round() as usize;

        FastBloomFilter {
            bitset: vec![0u64; num_bits / 64],
            num_bits,
            num_hashes: num_hashes.clamp(1, 16),
        }
    }

    /// 加入單詞或標記 Token
    pub fn insert(&mut self, token: &str) {
        let (h1, h2) = self.hash_pair(token.as_bytes());
        for i in 0..self.num_hashes {
            let combined = h1.wrapping_add((i as u64).wrapping_mul(h2));
            let bit_idx = (combined % (self.num_bits as u64)) as usize;
            self.bitset[bit_idx / 64] |= 1u64 << (bit_idx % 64);
        }
    }

    /// 檢驗目標 Token 是否可能存在於資料塊中 (回傳 false 代表 100% 不存在，可直接跳過 Block)
    pub fn may_contain(&self, token: &str) -> bool {
        let (h1, h2) = self.hash_pair(token.as_bytes());
        for i in 0..self.num_hashes {
            let combined = h1.wrapping_add((i as u64).wrapping_mul(h2));
            let bit_idx = (combined % (self.num_bits as u64)) as usize;
            if (self.bitset[bit_idx / 64] & (1u64 << (bit_idx % 64))) == 0 {
                return false;
            }
        }
        true
    }

    // 雙重散列 (Double Hashing using FNV-1a derivatives)
    fn hash_pair(&self, bytes: &[u8]) -> (u64, u64) {
        let mut h1: u64 = 0xcbf29ce484222325;
        let mut h2: u64 = 0x517cc1b727220a95;

        for &b in bytes {
            h1 ^= b as u64;
            h1 = h1.wrapping_mul(0x100000001b3);

            h2 ^= (b as u64).rotate_left(5);
            h2 = h2.wrapping_mul(0x5bd1e9955bd1e995);
        }

        (h1, h2.max(1))
    }

    pub fn byte_size(&self) -> usize {
        self.bitset.len() * 8
    }
}

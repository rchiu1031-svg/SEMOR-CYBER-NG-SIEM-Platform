use serde::{Deserialize, Serialize};

/// FastBloomFilter 專為 VictoriaLogs 資料塊設計之輕量級高效能布隆過濾器
/// 用於在從磁碟解壓縮資料塊前，以極低開銷快速剔除不含目標關鍵字 (IP, User, Host, Error Code 等) 的 Block
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FastBloomFilter {
    bitset: Vec<u64>,
    num_bits: usize,
    num_hashes: usize,
    inserted_count: usize,
}

impl FastBloomFilter {
    /// 建立指定預估項目數與誤報率之布隆過濾器
    ///
    /// 根據經典資訊理論公式計算最佳位元數與雜湊函數數量：
    /// m = ceil(-n * ln(p) / (ln(2)^2))
    /// k = round((m / n) * ln(2))
    pub fn new(expected_items: usize, false_positive_rate: f64) -> Self {
        let items = expected_items.max(16);
        let p = false_positive_rate.clamp(0.0001, 0.5);
        let ln2 = std::f64::consts::LN_2;

        // 計算最佳位元數 m，並向上對齊至 64-bit 機器字 (u64)
        let num_bits_raw = (-1.0 * (items as f64) * p.ln() / (ln2 * ln2)).ceil() as usize;
        let num_bits = ((num_bits_raw.max(64) + 63) / 64) * 64;

        // 計算最佳雜湊數 k，限制於 2..12 之間以兼顧過濾精度與 CPU 指令速度
        let num_hashes_calc = ((num_bits as f64 / items as f64) * ln2).round() as usize;
        let num_hashes = num_hashes_calc.clamp(2, 12);

        FastBloomFilter {
            bitset: vec![0u64; num_bits / 64],
            num_bits,
            num_hashes,
            inserted_count: 0,
        }
    }

    /// 加入單一單詞或標記 Token
    pub fn insert(&mut self, token: &str) {
        if token.is_empty() {
            return;
        }
        let (h1, h2) = self.hash_pair(token.as_bytes());
        for i in 0..self.num_hashes {
            let combined = h1.wrapping_add((i as u64).wrapping_mul(h2));
            let bit_idx = (combined % (self.num_bits as u64)) as usize;
            self.bitset[bit_idx / 64] |= 1u64 << (bit_idx % 64);
        }
        self.inserted_count += 1;
    }

    /// 自動將原始日誌字串進行高精度 Token 化，並自動將有效詞彙插入布隆過濾器
    pub fn insert_log_text(&mut self, text: &str) {
        // 針對日誌常見的格式切詞 (空白、引號、括號、等號、冒號等符號)
        for token in text.split(|c: char| {
            c.is_whitespace()
                || c == ','
                || c == ';'
                || c == '"'
                || c == '\''
                || c == '['
                || c == ']'
                || c == '('
                || c == ')'
                || c == '{'
                || c == '}'
                || c == '<'
                || c == '>'
                || c == '='
                || c == '|'
        }) {
            let t = token.trim();
            // 過濾過短或無檢索意義之符號
            if t.len() >= 2 && !t.chars().all(|c| !c.is_alphanumeric()) {
                self.insert(t);

                // 若為 key=value 結構 (例如 ip=192.168.1.1)，同時將值單獨建索引
                if let Some((_, val)) = t.split_once('=') {
                    if val.len() >= 2 {
                        self.insert(val);
                    }
                }
            }
        }
    }

    /// 檢驗目標 Token 是否可能存在於資料塊中
    /// 回傳 false 代表 100% 絕對不存在，儲存引擎可直接跳過此 Block，免去磁碟 I/O 與 ZSTD 解壓縮！
    pub fn may_contain(&self, token: &str) -> bool {
        if token.is_empty() {
            return true;
        }
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

    /// 雙重散列演算法 (Kirsch-Mitzenmacher 最佳化，利用兩個 64-bit 獨立散列合成任意多個雜湊函數)
    #[inline(always)]
    fn hash_pair(&self, bytes: &[u8]) -> (u64, u64) {
        let mut h1: u64 = 0xcbf29ce484222325; // 64-bit FNV-1a offset basis
        let mut h2: u64 = 0x517cc1b727220a95; // Murmur-style secondary seed

        for &b in bytes {
            h1 ^= b as u64;
            h1 = h1.wrapping_mul(0x100000001b3);

            h2 ^= (b as u64).rotate_left(5);
            h2 = h2.wrapping_mul(0x5bd1e9955bd1e995);
        }

        (h1, h2.max(1))
    }

    /// 取得布隆過濾器總位元組大小
    pub fn byte_size(&self) -> usize {
        self.bitset.len() * 8
    }

    /// 取得總位元數
    pub fn num_bits(&self) -> usize {
        self.num_bits
    }

    /// 取得雜湊函數數量
    pub fn num_hashes(&self) -> usize {
        self.num_hashes
    }

    /// 取得累計插入項目數
    pub fn inserted_count(&self) -> usize {
        self.inserted_count
    }

    /// 清空過濾器
    pub fn clear(&mut self) {
        for word in &mut self.bitset {
            *word = 0;
        }
        self.inserted_count = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bloom_filter_accuracy() {
        let mut bf = FastBloomFilter::new(500, 0.01);
        let test_words = vec![
            "192.168.1.100",
            "admin",
            "authentication_failed",
            "sudo",
            "CRITICAL",
            "CVE-2024-3400",
        ];

        for word in &test_words {
            bf.insert(word);
        }

        // 1. 已插入項目必為 true (No False Negatives)
        for word in &test_words {
            assert!(bf.may_contain(word), "已插入項目必須返回 true: {}", word);
        }

        // 2. 未插入的隨機詞彙應以極高機率返回 false
        let missing_words = vec![
            "10.200.5.99",
            "database_dropped",
            "guest_user",
            "port_8080",
            "CVE-2021-44228",
        ];

        let mut negatives_count = 0;
        for word in &missing_words {
            if !bf.may_contain(word) {
                negatives_count += 1;
            }
        }
        assert!(negatives_count >= 4, "未插入項目應大部分回傳 false");
    }

    #[test]
    fn test_bloom_filter_log_tokenization() {
        let mut bf = FastBloomFilter::new(1000, 0.01);
        let log = r#"Sep 14 07:15:20 firewall kernel: [SECURITY_DROP] src=172.16.0.4 dst=10.0.0.1 proto=TCP spt=48291 dpt=22 user=intruder"#;
        bf.insert_log_text(log);

        assert!(bf.may_contain("172.16.0.4"));
        assert!(bf.may_contain("10.0.0.1"));
        assert!(bf.may_contain("SECURITY_DROP"));
        assert!(bf.may_contain("intruder"));
        assert!(bf.may_contain("firewall"));

        // 未出現的詞彙
        assert!(!bf.may_contain("192.168.1.1"));
        assert!(!bf.may_contain("malware_trojan"));
    }
}

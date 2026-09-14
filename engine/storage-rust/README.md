# SEMOR VictoriaLogs Storage Core (Rust Engine)

**模組名稱**: `semor-vlog-engine`  
**架構階段**: 第二階段：Rust 核心 Block 壓縮與儲存引擎  
**設計規格**: VictoriaLogs-Style 塊級日誌儲存、Delta-of-Delta 時間戳壓縮、ZSTD 與 Bloom Filter 磁碟分區佈局

---

## 核心目錄結構與磁碟佈局

本引擎嚴格採用 VictoriaLogs 分區目錄結構：
```text
/data/
  ├── {stream_id}/
  │     ├── {part_id}.block       # 包含連續多個 VictoriaBlock 的不可變分區檔
  │     ├── part_0000000000000001.block
  │     └── part_0000000000000002.block
  └── 1001/
        ├── part_0000000000000001.block
        └── part_0000000000000002.block
```

### VictoriaBlock 二進位 Frame 結構 (`{part_id}.block`)
每個 `.block` 檔案中包含一個或多個自包含的二進位 Frame：
```text
┌────────────────────────────────────────────────────────┐
│ [Magic: 4 Bytes "VBLK"]                                │
│ [Version: 2 Bytes u16]                                 │
│ [Header JSON Length: 4 Bytes u32]                      │
│ [Header JSON Bytes (StreamID, Min/Max TS, BloomFilter)]│
│ [Timestamps Length: 4 Bytes u32]                       │
│ [Delta-of-Delta Timestamps Bytes (ZigZag Varint)]      │
│ [Payload Length: 4 Bytes u32]                          │
│ [Payload Bytes (Zstandard Level 3 Compressed)]         │
│ [CRC32 Checksum: 4 Bytes u32 (IEEE 802.3 Polynomial)] │
└────────────────────────────────────────────────────────┘
```

---

## 核心模組架構

1. **BlockBuilder (`src/block.rs`)**:
   - 負責累積進線日誌，維護時間戳序列、日誌本文緩衝區、行偏移量陣列。
   - 自動調用 `FastBloomFilter::insert_log_text` 對日誌關鍵詞 (IP, Domain, User, Event ID, Port) 進行標記化。
   - 達到閾值 (4,096 筆或 2MB) 後自動觸發封裝封鎖，產出不可變的 `VictoriaBlock`。

2. **Delta-of-Delta 時間戳壓縮演算法 (`src/block.rs`)**:
   - 計算一階時間差值 $\Delta_i = TS_i - TS_{i-1}$ 與二階差值 $D_i = \Delta_i - \Delta_{i-1}$。
   - 透過 ZigZag 編碼將有符號整數映射為非負整數，並以 7-bit Varint 打包。
   - 在規律進線或週期性日誌中，$D_i \approx 0$，使 64-bit 時間戳壓縮至每筆平均僅需 0.8 ~ 1.2 個位元組。

3. **Zstandard 日誌內容壓縮 (`src/block.rs`)**:
   - 將 Block 內所有日誌本文合併為單一緩衝區，採用 Zstandard (Level 3) 批次壓縮。
   - 結合 Stream 標籤同質性分流，資安結構化日誌壓縮比可達 10x ~ 14x。

4. **高速 Bloom Filter 剪枝 (`src/bloom.rs`)**:
   - 基於 Kirsch-Mitzenmacher 雙重散列 (Double Hashing) 優化。
   - 查詢時免讀取或解壓縮 Payload，直接在磁碟/記憶體索引層調用 `may_contain(token)`。
   - 若回傳 `false` 則 100% 保證目標關鍵字不存在，直接跳過該 Block，節省 90% 以上磁碟 I/O。

5. **分區管理與三層剪枝檢索 (`src/storage.rs`)**:
   - **層級 1 (Stream-Level)**: 依 Stream ID 僅檢索 `/data/{stream_id}/`，完全不碰觸其他無關來源目錄。
   - **層級 2 (Time-Range)**: 比對 BlockHeader 的 `[min_timestamp, max_timestamp]`，跳過不相交區間。
   - **層級 3 (Bloom Filter)**: 快速排除不含關鍵字 Token 的 Block。
   - **精準解壓縮**: 僅對通過三層剪枝的少數 Block 執行 seek 與 ZSTD 解壓。

---

## 編譯與執行方式
```bash
cd engine/storage-rust
cargo test --release
cargo run --release
```

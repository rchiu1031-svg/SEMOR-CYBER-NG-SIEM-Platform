# SEMOR VictoriaLogs Storage Core (Rust Engine)

**模組名稱**: `semor-vlog-engine`  
**架構類型**: VictoriaLogs-Style 塊級日誌儲存與壓縮結構引擎 (Block Compression Engine)

## 核心技術特色
1. **VictoriaBlock 結構**
   - **中繼資訊頭部 (VictoriaBlockHeader)**: 包含 StreamID、MinTimestamp、MaxTimestamp、筆數、原始大小、壓縮後大小與專屬 Bloom Filter。
   - **Delta-of-Delta 時間戳極致壓縮**: 仿造 VictoriaMetrics 核心演算法，計算相鄰日誌時間戳差值之差值 (Delta-of-Delta)，以 ZigZag + Varint 位元打包，將 64-bit 時間戳壓縮至每筆平均不到 1 個位元組。
   - **ZSTD 批次高倍率日誌內容壓縮**: 將 Block 內所有日誌集中以 Zstandard (Level 3) 壓縮，一般資安日誌可獲得 8x ~ 14x 壓縮比。
2. **高速 Bloom Filter 剪枝**
   - 針對 IP 位址、主機名、使用者帳號等 Token 建立二進位過濾器，查詢時直接在磁碟索引層剔除不符條件的 Block，免除無謂的解壓縮 I/O 開銷。
3. **Stream 標籤分組**
   - 將相同來源特徵 (如 `{env="prod", host="fw01", app="suricata"}`) 的日誌歸納至同一 StreamID，大幅提升資料相似度與壓縮比。
4. **IPC 接收器 (UDS / TCP)**
   - 支援與 Go Ingestion Collector 透過 `/tmp/semor_rust.sock` 或 `127.0.0.1:9527` 進行零拷貝/低延遲批次傳輸。

## 編譯與執行方式
```bash
cd engine/storage-rust
cargo build --release
./target/release/semor-vlog-engine
```

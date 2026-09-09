# SEMOR Log Ingestion Engine (Go Collector)

**模組名稱**: `semor-collector`  
**架構類型**: 高併發日誌接收與前置處理器 (對齊 VictoriaLogs 架構)

## 模組核心功能
1. **高效能 Syslog 接收器 (UDP / TCP)**
   - 預設監聽 UDP/TCP 埠 `5140` (可由 `SYSLOG_UDP_PORT` 與 `SYSLOG_TCP_PORT` 環境變數配置)。
   - UDP 透過 `SetReadBuffer` 將核心層 Socket 接收緩衝擴展至 `32MB`，杜絕高突發 EPS 造成的封包遺失。
   - 採用多工作協程 (Worker Pool) 進行無鎖併發解包。
2. **VictoriaLogs 相容 HTTP 批次接收端點**
   - `/insert/jsonline`: 接受標準 NDJSON 串流寫入。
   - `/api/v1/ingest`: 接受結構化 JSON 批次寫入。
   - `/api/v1/decoders/deploy`: 支援從 SEMOR 平台 UI（Decoder Studio）熱下發 Regex 規則，無需重啟即時套用。
3. **記憶體環形緩衝 (Ring Buffer) 與批次聚合**
   - 支援 50,000 筆容量佇列，每 `2,000` 筆或每 `250ms` 打包一個日誌批次。
4. **Rust 儲存引擎 IPC 高速通道**
   - 透過 Unix Domain Socket (`/tmp/semor_rust.sock`) 或 TCP (`127.0.0.1:9527`) 與底層 Rust VictoriaLogs 壓縮儲存核心對接。

## 快速編譯與執行
```bash
cd engine/collector-go
go mod tidy
go build -o semor-collector main.go
./semor-collector
```

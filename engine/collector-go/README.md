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
3. **分區鎖分段多通道環形緩衝 (Lock-Striped Sharded Circular Buffer) 與自適應動態協程池 (Traffic-Adaptive Worker Pool)**
   - 採用分區鎖分段架構 (`ShardedCircularBuffer`)，預設由 16 個獨立環形緩衝分片 (`RingShard`) 組成，總容量達 160,000 筆，消除單一全域互斥鎖競爭，吞吐量線性擴展。
   - **動態伸縮協程池 (`ChannelWorkerPool`)**：根據佇列壓力 (`packetCh`) 與突發流量自動伸縮（`MinWorkers` 8 至 `MaxWorkers` 64+），封包暴增時亞毫秒啟動突發處理協程；流量平息後自動在閒置逾時 (`idleTimeout`) 後優雅縮容，極大化 CPU 使用效率。
   - 結合 `sync.Pool` 64KB 位元組切片回收池，零 GC 停頓。
   - 支援可配置之溢流處置策略 (`drop_oldest` 保留最新突發事件 / `drop_newest`)，並具備向量化跨分片批次提取 (`PopBatch`)，杜絕逐筆通道開銷。
   - 具備異步 Rust 分發隊列 (`rustDispatchCh`) 與專用發送協程池，即使 Rust VictoriaLogs 核心進行磁碟刷盤或區塊壓縮，接收端亦絕不卡滯或丟包。
4. **零日誌遺失優雅關機 (Zero-Loss Graceful Shutdown)**
   - 捕捉 `SIGINT`/`SIGTERM` 信號並啟動五階段有序排空管線：
     1. 立即關閉 UDP/TCP 監聽器與 HTTP 服務，杜絕新封包進入。
     2. 排空通道協程池 (`packetCh`)，確保待處理封包全數解析至環形緩衝。
     3. 停止常規聚合器並完整排空 16 個分片所有暫存日誌，封裝為批次。
     4. 關閉 Rust 分發隊列並等待所有發送協程將批次完整交付 Rust IPC。
     5. 正常關閉 Rust IPC 連線，確保關機過程日誌 0 遺失。
5. **Rust 儲存引擎 IPC 高速通道**
   - 透過 Unix Domain Socket (`/tmp/semor_rust.sock`) 或 TCP (`127.0.0.1:9527`) 與底層 Rust VictoriaLogs 壓縮儲存核心對接。

## 快速編譯與執行
```bash
# 編譯自研高效能接收器 (cmd/receiver/main.go)
go build -o bin/semor-receiver ./cmd/receiver
./bin/semor-receiver

# 或執行完整收集與前置處理服務
go build -o bin/semor-collector main.go
./bin/semor-collector
```

## 遙測與健康檢查端點 (Health & Throughput Endpoints)
- **健康檢查 (`/health` & `/healthz`)**:
  `GET http://localhost:8080/health`
  返回系統運行狀態、分片緩衝深度、突發峰值、與 Rust 核心連接狀態、奈秒精度啟用指標。
- **即時輸送量 (`/api/v1/throughput`)**:
  `GET http://localhost:8080/api/v1/throughput`
  提供即時封包處理率 (PPS)、資料吞吐量 (Mbps)、總封包累計、緩衝區利用率與 Rust 批次分發狀況。
- **分片診斷資訊 (`/api/v1/buffer/shards`)**:
  `GET http://localhost:8080/api/v1/buffer/shards`
  檢視各分片通道之容量、當前深度、峰值深度、利用率與溢流統計，協助調優與壓測。
- **Prometheus 指標 (`/metrics`)**:
  `GET http://localhost:8080/metrics`
  標準 Prometheus 格式監控指標，包含 UDP/TCP 計數、各分片佇列深度、掉包統計。


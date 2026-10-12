# SEMOR CYBER NG-SIEM Platform
> **次世代安全性資訊與事件管理平台 (Next-Generation Security Information & Event Management Platform)**  
> 整合 NG-SIEM、SOAR 自動化響應、數位鑑識與案件管理 (Case Management)、檔案完整性監控 (FIM)、全封包側錄與網路威脅偵測 (NDR/FPC)、開放式端點偵測與回應 (Open XDR/EDR)、威脅情資 (CTI)、T-Pot 主動誘捕蜜罐、使用者實體行為分析 (UEBA)、Apache SkyWalking 企業級 APM 全端觀測性、軍方網絡兵棋推演、工控安全 (OT/SCADA) 與 AI 智慧資安分析師。

---

## 目錄 (Table of Contents)
1. [平台簡介與設計願景](#-平台簡介與設計願景)
2. [系統總體架構與三大運算核心](#-系統總體架構與三大運算核心)
3. [核心模組功能介紹](#-核心模組功能介紹)
   - [1. 次世代日誌發現與探勘 (Discovery & Event Explorer)](#1-次世代日誌發現與探勘-discovery--event-explorer)
   - [2. 自動化響應與安全編排 (SOAR & Playbook Orchestrator)](#2-自動化響應與安全編排-soar--playbook-orchestrator)
   - [3. 數位鑑識與案件管理 (Case Management & War Room)](#3-數位鑑識與案件管理-case-management--war-room)
   - [4. 檔案完整性監控與自動遏阻 (FIM & Automated Containment)](#4-檔案完整性監控與自動遏阻-fim--automated-containment)
   - [5. 全封包擷取與網路流量偵測 (NDR & Arkime-Style FPC)](#5-全封包擷取與網路流量偵測-ndr--arkime-style-fpc)
   - [6. 開放式端點偵測與威脅分析 (Open XDR & Malware Analysis)](#6-開放式端點偵測與威脅分析-open-xdr--malware-analysis)
   - [7. 威脅情報平台 (Cyber Threat Intelligence - CTI)](#7-威脅情報平台-cyber-threat-intelligence---cti)
   - [8. 主動誘捕蜜罐與全球攻擊地圖 (T-Pot Honeypot & Attack Map)](#8-主動誘捕蜜罐與全球攻擊地圖-t-pot-honeypot--attack-map)
   - [9. 使用者與實體行為分析 (UEBA & Dynamic Risk Scoring)](#9-使用者與實體行為分析-ueba--dynamic-risk-scoring)
   - [10. 企業級應用效能管理與觀測性 (Apache SkyWalking APM)](#10-企業級應用效能管理與觀測性-apache-skywalking-apm)
   - [11. 工業控制與智慧基礎設施安全 (OT/SCADA & Traffic Control)](#11-工業控制與智慧基礎設施安全-otscada--traffic-control)
   - [12. 軍方網絡兵棋推演 (Cyber Wargaming & CALDERA Simulation)](#12-軍方網絡兵棋推演-cyber-wargaming--caldera-simulation)
   - [13. AI 智慧資安分析師 (AI SecOps Analyst)](#13-ai-智慧資安分析師-ai-secops-analyst)
4. [後端 RESTful API 規格概覽](#-後端-restful-api-規格概覽)
5. [專案目錄結構](#-專案目錄結構)
6. [環境需求與快速開始 (Quick Start)](#-環境需求與快速開始-quick-start)
   - [本機全端開發模式](#方法一本地開發環境-nodejs)
   - [Docker Compose 一鍵微服務部署](#方法二docker-compose-一鍵微服務部署)
   - [Go 收集器與 Rust 儲存核心獨立編譯](#方法三獨立核心編譯-go--rust)
7. [Git 版本控制與上傳指南](#-git-版本控制與上傳指南)
8. [安全性、權限架構與授權](#-安全性權限架構與授權)

---

## 🌟 平台簡介與設計願景

傳統 SIEM 系統常面臨「只看日誌無載荷 (Log-only without Payload)」、「告警疲勞 (Alert Fatigue)」、「調查與聯防處置割裂」以及「高 EPS 儲存成本昂貴」三大困境。

**SEMOR CYBER NG-SIEM** 專為現代混合雲、關鍵基礎設施與企業 SOC 設計：
- **自研多語言核心驅動**：結合 **Go 高併發多通道接收器**、**Rust VictoriaLogs 列式壓縮儲存核心** 與 **TypeScript / Node.js 全端事件處置中樞**，支援百萬級 EPS 穩定吞吐。
- **全維度關聯分析 (Multi-Engine Correlation)**：將網路流量 (Flow)、端點偵測 (EDR/XDR)、蜜罐誘捕 (Deception)、工控協定 (Modbus/S7) 與身分行為 (UEBA) 即時融合成攻擊鏈 (Kill Chain)。
- **一體化自動化響應 (Integrated SOAR & SIRP)**：內建自動化封鎖、主機遏阻、eBPF 檔案完整性防篡改校驗與法規相容的數位證據鏈管理。

---

## 🏛 系統總體架構與三大運算核心

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       SEMOR CYBER SOC 統一戰情操作台                         │
 │           React 19 + TypeScript + Tailwind CSS + Lucide Icons + D3          │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (HTTP REST / WebSocket / SSE)
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │             SEMOR Web Platform / Node.js Express 平台服務層 (Port 3000)      │
 │  ┌────────────────┬────────────────┬────────────────┬───────────────────┐   │
 │  │ Cases & SIRP   │ SOAR Playbooks │ FIM Engine     │ NDR / Flow        │   │
 │  ├────────────────┼────────────────┼────────────────┼───────────────────┤   │
 │  │ CTI Intel Hub  │ UEBA Profiler  │ SkyWalking APM │ Wargaming Engine  │   │
 │  └────────────────┴────────────────┴────────────────┴───────────────────┘   │
 └──────────────────────┬───────────────────────────────┬──────────────────────┘
                        │ (HTTP / JSON)                 │ (Unix Socket / TCP)
                        ▼                               ▼
 ┌────────────────────────────────────────┐ ┌──────────────────────────────────┐
 │   SEMOR Ingestion Engine (Go Collector)│ │ SEMOR Storage Core (Rust Engine) │
 │ ┌────────────────────────────────────┐ │ │ ┌──────────────────────────────┐ │
 │ │ Syslog UDP/TCP (Port 5140, 32MB Buf)│ │ │ │ VictoriaBlock (4KB/2MB Frame)│ │
 │ ├────────────────────────────────────┤ │ │ ├──────────────────────────────┤ │
 │ │ HTTP Ingest (/insert/jsonline, 8080)│ │ │ │ Delta-of-Delta TS 壓縮 (~1B) │ │
 │ ├────────────────────────────────────┤ │ │ ├──────────────────────────────┤ │
 │ │ 16 分區環形緩衝 + 動態協程池       │ │ │ │ ZSTD Level 3 批次壓縮 (14x)  │ │
 │ └────────────────────────────────────┘ │ │ ├──────────────────────────────┤ │
 │     (零日誌遺失 5 階段優雅關機管線)   │ │ │ │ Bloom Filter 雙重散列三層剪枝│ │
 └────────────────────────────────────────┘ └──────────────────────────────────┘
```

### 1. Go 高效能接收器 (`engine/collector-go`)
- **巨量併發日誌接入**：監聽 UDP/TCP `5140` 埠，透過 `SetReadBuffer` 將核心層 Socket 緩衝擴展至 `32MB`，杜絕突發流量丟包。
- **分區鎖分段多通道環形緩衝 (Lock-Striped Sharded Circular Buffer)**：由 16 個獨立環形緩衝分片 (`RingShard`) 組成，總深度達 160,000 筆，消除全域互斥鎖競爭。
- **動態伸縮協程池 (Traffic-Adaptive Worker Pool)**：亞毫秒級在 8 ~ 64+ 工作協程間自動彈性伸縮，結合 `sync.Pool` 記憶體重用，GC 停頓近乎為零。
- **VictoriaLogs 相容寫入**：相容 `/insert/jsonline`、`/api/v1/ingest` 及熱更 Regex 解碼器 `/api/v1/decoders/deploy`。

### 2. Rust VictoriaLogs-Style 儲存核心 (`engine/storage-rust`)
- **列式不可變分區架構**：採用 `/data/{stream_id}/{part_id}.block` 組織，每個 Block 包含獨立 Magic Code、二進位標頭、Bloom Filter 與 CRC32 校驗。
- **Delta-of-Delta 時間戳壓縮**：計算二階差值並以 ZigZag Varint 打包，將 64-bit 時間戳壓縮至每筆平均 0.8 ~ 1.2 Bytes。
- **Zstandard 批次壓縮**：同質性日誌分流，日誌本文壓縮比達 10x ~ 14x。
- **三層剪枝檢索技術 (Triple Pruning)**：
  1. Stream-Level：按 Stream 隔離目錄；
  2. Time-Range：快速過濾時間戳範圍；
  3. Bloom Filter：雙重散列 (Double Hashing) 免解壓剪枝，節省 90% 以上磁碟 I/O。

### 3. Node.js / Express 企業級服務層 (`server.ts` & `server/*.ts`)
- 模組化微服務架構，提供完整業務引擎 (`soarEngine`、`casesEngine`、`fimEngine`、`malwareEngine` 等) 與對應的 RESTful 路由。
- 支援檔案持久化、系統資源健康診斷、即時統計指標計算與 WebSocket 事件通知。

---

## 🛡 核心模組功能介紹

### 1. 次世代日誌發現與探勘 (Discovery & Event Explorer)
- **毫秒級日誌搜尋**：對接 VictoriaLogs 語法，支援多條件管線過濾 (`host:*`, `level:ERROR`, `latency > 500ms`)。
- **視覺化日誌時間軸**：直方圖即時渲染，快速定位日誌異常暴增峰值點。
- **動態解碼診斷**：內建 Log Parser Diagnostic Panel，提供日誌格式即時除錯與正規表達式熱測試。

### 2. 自動化響應與安全編排 (SOAR & Playbook Orchestrator)
- **劇本自動化編排**：支援可自定義的自動化防禦劇本，包含可隔離主機、封鎖外部惡意 IP、撤銷使用者憑證、快照硬碟與通報 Slack/Teams。
- **模擬沙盒演練**：具備劇本模擬測試功能，提供逐步執行日誌與執行耗時追蹤，驗證遏阻流程正確性。
- **即時遙測看板**：監控自動化劇本執行成功率、總觸發次數、平均響應時間 (MTTR) 與活躍主機數。

### 3. 數位鑑識與案件管理 (Case Management & War Room)
- **案件全生命週期管理**：支援從「未指派 ➔ 調查中 ➔ 圍堵中 ➔ 已結案」的標準化資安處置流程 (SOP)。
- **案件戰情報告 (War Room)**：
  - **時序時間軸 (Timeline)**：聚合關聯事件、攻擊者活動紀錄與調查備忘。
  - **證據鏈管理 (Chain of Custody)**：保存 PCAP 封包、記憶體 Dump、磁碟鏡像之 SHA-256 數位簽章與保全人員紀錄。
  - **IoC 威脅指標盤點**：自動抽取案件中的惡意 IP、Domain、雜湊並關聯威脅等級。
  - **MITRE ATT&CK 戰術矩陣映射**：視覺化標註攻擊者使用之 TTPs (例如 T1059 命令執行、T1003 憑證竊取)。
  - **一鍵自動生成處置結案報告**：匯出 PDF/Markdown 格式的鑑識調查總結。

### 4. 檔案完整性監控與自動遏阻 (FIM & Automated Containment)
- **eBPF 核心級探針監控**：持續監控 Linux/Windows 關鍵目錄 (`/etc/`, `/bin/`, `/usr/bin/`, `/lib/systemd/`)。
- **SHA-256 數位簽章樹校驗**：偵測到非授權篡改（如 WebShell 植入、Rootkit 注入）時即刻拉響警報。
- **叢集黃金基線快照 (Golden Baseline Snapshot)**：支援單鍵建立系統快照、比對偏離度與自動重建雜湊樹。
- **一鍵加密復原 (Cryptographic Rollback)**：從隔離備份區以原子操作復原受篡改檔案，並校驗還原後雜湊。
- **即時主機微隔離 (Host Containment)**：透過核心防火牆規則封鎖受感染主機入出境流量，僅保留安全管理通道。

### 5. 全封包擷取與網路流量偵測 (NDR & Arkime-Style FPC)
- **全封包深度側錄 (Full Packet Capture)**：支援 PCAP 即時索引檢索、封包還原與十六進位/ASCII 檢視。
- **24 小時網路流量熱圖**：多協定 (TCP, UDP, ICMP, DNS, TLS) 流量吞吐監控與突發流量警報。
- **NetFlow / IPFIX 聚合分析**：追蹤頂級連線階段 (Top Talkers)、頻寬耗用與異常長連線 (Beaconing)。

### 6. 開放式端點偵測與威脅分析 (Open XDR & Malware Analysis)
- **整合主流開源 EDR 探針**：相容 Wazuh-Agent、Velociraptor 與 Interflow 協定。
- **惡意程式靜態與動態分析**：整合 YARA 規則掃描、VirusTotal 雲端情資比對與沙盒動態行為啟發式分析。
- **網路存取控制 (NAC)**：支援 802.1X / RADIUS 驗證、動態切換 Switch VLAN、Captive Portal 設計器與違規設備隔離。

### 7. 威脅情報平台 (Cyber Threat Intelligence - CTI)
- **多來源情資整合**：支援 STIX2/TAXII、MISP、AlienVault OTX 等公開與私有威脅情資來源。
- **自動化 IoC 比對**：進線日誌與封包即時比對全球惡意 IP、釣魚網域與惡意雜湊。
- **情資來源健康度監控**：即時回報情資來源連線狀態、更新頻率與有效 IoC 數量。

### 8. 主動誘捕蜜罐與全球攻擊地圖 (T-Pot Honeypot & Attack Map)
- **整合 T-Pot 誘捕架構**：管理 Cowrie (SSH/Telnet)、Dionaea (惡意程式捕捉)、HoneyTrap 等多種蜜罐節點。
- **即時全球 3D 攻擊地圖**：結合 GeoIP 資料庫，動態呈現全球攻擊來源國、攻擊目標節點與攻擊手法熱力分佈。

### 9. 使用者與實體行為分析 (UEBA & Dynamic Risk Scoring)
- **行為基線建模**：針對特權帳號、內部使用者與伺服器實體建立正常行為輪廓。
- **動態風險評分**：偵測「異常時段登入」、「不可能的移動速度 (Impossible Travel)」、「突發大量資料匯出」與「橫向移動」等異常行為並進行多維度評分。

### 10. 企業級應用效能管理與觀測性 (Apache SkyWalking APM)
- **全端鏈路追蹤 (Distributed Tracing)**：以微秒級精度追蹤跨微服務與資料庫之調用鏈。
- **服務拓撲圖 (Topology Map)**：即時繪製微服務依賴關係、調用吞吐量 (QPS) 與錯誤率。
- **JVM 與容器效能洞察**：監控記憶體堆疊、GC 頻率、執行緒集區與 Service Mesh 狀態。

### 11. 工業控制與智慧基礎設施安全 (OT/SCADA & Traffic Control)
- **OT/ICS 專用通訊協定解析**：深度側錄 Modbus TCP、Siemens S7、DNP3、EtherNet/IP 工控封包。
- **交通號誌基礎設施控制**：結合 SCADA/HMI 模擬智慧城市交通號誌、資訊可變標誌 (CMS) 與 CCTV 連線安全。

### 12. 軍方網絡兵棋推演 (Cyber Wargaming & CALDERA Simulation)
- **紅藍軍攻防對抗模擬**：整合 MITRE ATT&CK 戰術想定，模擬 APT 組織滲透路徑。
- **導演部裁決引擎 (Referee Engine)**：即時評估推演進度、損失評估與防禦措施有效性。
- **AAR 戰後復盤 (After Action Review)**：支援時序回放，比對紅軍攻擊軌跡與藍軍防禦響應耗時。

### 13. AI 智慧資安分析師 (AI SecOps Analyst)
- **智慧輔助調查**：由 Google Gemini API 與本地端大型模型 (Ollama/Llama-3) 提供支援。
- **攻擊樹動態生成**：從多源日誌中自動梳理攻擊路徑並繪製攻擊樹。
- **防禦處置建議**：針對即時告警提供具體防堵策略、阻擋規則 (Snort/YARA/Firewall) 與應急修復指令。

---

## 📡 後端 RESTful API 規格概覽

系統主要 RESTful API 路由掛載於 Express 伺服器 (`server.ts`)：

| 模組領域 | 端點路徑 | 支援方法 | 功能描述 |
| :--- | :--- | :--- | :--- |
| **案件管理 (Cases)** | `/api/v1/cases` | `GET`, `POST` | 查詢案件清單 (支援狀態/嚴重度過濾) / 建立新案件 |
| | `/api/v1/cases/:id` | `GET`, `PATCH`, `DELETE` | 查詢單一案件詳情 / 更新階段與進度 / 刪除案件 |
| | `/api/v1/cases/:id/timeline` | `POST` | 新增案件調查時序事件 (活動歷程) |
| | `/api/v1/cases/:id/evidence` | `POST` | 上傳保全數位證據項與 SHA-256 雜湊校驗 |
| | `/api/v1/cases/:id/iocs` | `POST` | 加入關聯 IoC 威脅指標 |
| | `/api/v1/cases/:id/report` | `GET`, `POST` | 取得或自動產生案件結案 War Room 鑑識報告 |
| | `/api/v1/cases/metrics` | `GET` | 取得案件總體統計指標 (MTTR, 階段分佈, 嚴重度統計) |
| **檔案完整性 (FIM)** | `/api/v1/fim/telemetry` | `GET` | 取得 FIM 即時遙測數據 (受監控檔案數, 漂移率, 隔離主機) |
| | `/api/v1/fim/events` | `GET`, `POST` | 查詢未授權檔案異動事件 / 模擬注入新異動事件 |
| | `/api/v1/fim/events/:id/rollback` | `POST` | 執行檔案一鍵加密復原並比對還原雜湊 |
| | `/api/v1/fim/events/:id/isolate` | `POST` | 觸發主機網路微隔離防火牆規則 |
| | `/api/v1/fim/playbooks` | `GET` | 取得 FIM 聯防劇本清單與啟用狀態 |
| | `/api/v1/fim/playbooks/:id/simulate` | `POST` | 觸發指定防篡改自動處置劇本測試演練 |
| | `/api/v1/fim/baselines` | `GET`, `POST` | 查詢叢集基線快照庫 / 建立新系統黃金基線快照 |
| | `/api/v1/fim/baselines/:id/recalculate`| `POST` | 重新計算並校準叢集 SHA-256 雜湊樹 |
| | `/api/v1/fim/scan` | `POST` | 發動即時路徑雜湊深度掃描 |
| **自動化響應 (SOAR)** | `/api/v1/soar/playbooks` | `GET`, `POST` | 查詢及註冊 SOAR 防禦劇本 |
| | `/api/v1/soar/playbooks/:id/run` | `POST` | 觸發劇本執行流程 |
| | `/api/v1/soar/telemetry` | `GET` | 取得 SOAR 平台運作指標與平均響應時間 |
| **網路流量 (NDR)** | `/api/v1/ndr/traffic` | `GET` | 取得即時網路流量統計與 24 小時時序數據 |
| | `/api/v1/ndr/rules` | `GET`, `POST` | 取得與設定 NDR 流量告警門檻規則 |
| **威脅情資 (CTI)** | `/api/v1/intel/feeds` | `GET`, `POST` | 查詢威脅情報來源與更新狀態 |
| | `/api/v1/intel/lookup` | `POST` | 查詢指定 IP / Domain / Hash 的威脅信譽評分 |
| **收集器 (Collector)**| `/api/v1/collector/metrics` | `GET` | 取得 Go 收集器連線池、記憶體與即時吞吐量 |
| | `/api/v1/collector/config` | `GET`, `PUT` | 動態調整接收器批次大小與超時門檻 |
| **日誌儲存 (Storage)** | `/api/v1/storage/health` | `GET` | 檢查 Rust 儲存引擎連線狀態、UDS 通道與磁碟容量 |
| **AI 分析 (AI Analyst)**| `/api/v1/ai-analyst/chat` | `POST` | 向 AI SecOps 助手提問日誌分析與處置指引 |

---

## 📂 專案目錄結構

```text
├── server.ts                       # Node.js + Express 主伺服器入口 (掛載所有 API 路由)
├── server/                         # 平台後端核心業務引擎與 REST 路由器
│   ├── casesEngine.ts              # 案件管理狀態機 (SIRP, Evidence, Timeline, Report)
│   ├── casesRouter.ts              # 案件管理 RESTful API
│   ├── fimEngine.ts                # 檔案完整性監控狀態機 (Rollback, Containment, Scan)
│   ├── fimRouter.ts                # 檔案完整性 RESTful API
│   ├── soarEngine.ts               # SOAR 安全編排與自動化劇本引擎
│   ├── soarRouter.ts               # SOAR RESTful API
│   ├── collectorRouter.ts          # Go 接收器連接池與記憶體管理路由
│   ├── ndrRouter.ts                # 網路流量檢測與 Arkime PCAP 路由
│   ├── ctiRouter.ts                # 威脅情資來源與 IoC 查詢路由
│   ├── malwareEngine.ts            # 惡意程式分析引擎與沙盒
│   ├── uebaEngine.ts               # 使用者與實體行為分析引擎
│   ├── apmRouter.ts                # Apache SkyWalking APM 觀測性路由
│   ├── honeypotRouter.ts           # T-Pot 蜜罐誘捕節點狀態路由
│   └── aiAnalystRouter.ts          # AI 智慧分析師對話端點
├── engine/                         # 底層高效能日誌引擎
│   ├── collector-go/               # Go 高併發 Syslog & HTTP 接收器 (VictoriaLogs 相容)
│   │   ├── main.go                 # Go 收集器服務入口
│   │   ├── receiver/               # UDP/TCP 監聽與 32MB Socket 緩衝擴展
│   │   ├── pipeline/               # 16 分區環形緩衝與自適應協程池
│   │   └── Dockerfile              # Go 收集器容器構建設定
│   └── storage-rust/               # Rust VictoriaLogs-Style 列式不可變存儲核心
│       ├── Cargo.toml              # Rust 依賴套件定義
│       ├── src/block.rs            # VictoriaBlock、Delta-of-Delta、ZSTD 壓縮
│       ├── src/bloom.rs            # 雙重散列 Bloom Filter 快速過濾
│       ├── src/storage.rs          # 三層剪枝磁碟分區管理器
│       └── Dockerfile              # Rust 儲存引擎容器構建設定
├── src/                            # 前端 React 19 + TypeScript SPA 原始碼
│   ├── App.tsx                     # 平台頂層佈局、多分頁導航與 SOC 側邊欄
│   ├── main.tsx                    # React 應用程式掛載點
│   ├── types.ts                    # 全域資料型別定義與 12 大模組清單
│   ├── components/                 # UI 元件庫
│   │   ├── case-management/        # 案件管理與 Incident Response 戰情室
│   │   ├── soar/                   # SOAR 劇本編排與 FIM 完整性監控視圖
│   │   │   └── fim/                # FIM Dashboard、劇本、策略與基線快照元件
│   │   ├── apm/                    # SkyWalking APM 鏈路追蹤與拓撲圖視圖
│   │   ├── cti/                    # 威脅情資視覺化看板
│   │   ├── honeypot/               # T-Pot 攻擊地圖與蜜罐管理
│   │   ├── malware/                # 惡意程式沙盒分析看板
│   │   └── ...                     # NDR、UEBA、Wargaming 等其他專業視圖
│   └── locales/                    # 多國語系語系檔 (繁體中文 / 英文)
├── docker-compose.engine.yml       # 微服務容器編排定義 (Web + Collector + Rust Storage)
├── package.json                    # 全端相依性套件與 NPM 腳本
├── tsconfig.json                   # TypeScript 編譯器組態
└── vite.config.ts                  # Vite 建置工具設定
```

---

## 🚀 環境需求與快速開始 (Quick Start)

### 系統環境要求
- **作業系統**：Linux (Ubuntu 22.04+ / Debian 12 / RHEL 9) 或 macOS
- **Node.js**：v20.x 或更高版本 (建議 v22 LTS)
- **套件管理器**：npm 或 bun
- **Docker & Docker Compose**：v24+ (若使用容器化部署)
- **Go** (選用)：v1.22+ (若需自行修改/編譯 Go 接收器)
- **Rust** (選用)：v1.78+ (若需自行編譯 Rust 儲存核心)

---

### 方法一：本地開發環境 (Node.js)

1. **安裝相依套件**：
   ```bash
   npm install
   ```

2. **啟動全端開發伺服器** (包含 Express API 與 Vite 前端)：
   ```bash
   npm run dev
   ```
   伺服器預設啟動於 `http://localhost:3000`。

3. **靜態型別與語法檢查**：
   ```bash
   npm run lint
   ```

4. **生產環境打包**：
   ```bash
   npm run build
   ```

---

### 方法二：Docker Compose 一鍵微服務部署

專案提供完整的 `docker-compose.engine.yml`，可一鍵啟動 **Rust 儲存核心**、**Go 高效日誌接收器** 與 **Web 控制台平台**：

```bash
# 啟動所有微服務容器 (背景執行)
docker-compose -f docker-compose.engine.yml up -d --build

# 檢視運行狀態
docker-compose -f docker-compose.engine.yml ps

# 檢視服務日誌
docker-compose -f docker-compose.engine.yml logs -f
```

容器埠號對應：
- **Web 平台控制台**：`http://localhost:3000`
- **Go 收集器 HTTP**：`http://localhost:8080` (相容 VictoriaLogs `/insert/jsonline`)
- **Go Syslog 接收埠**：`5140/udp` 與 `5140/tcp`
- **Rust 儲存核心 TCP**：`9527` (內部通訊)

---

### 方法三：獨立核心編譯 (Go & Rust)

#### 1. 編譯與執行 Go Collector
```bash
cd engine/collector-go

# 編譯接收器與管線
go build -o bin/semor-collector main.go

# 執行收集器 (預設監聽 5140 埠與 8080 埠)
./bin/semor-collector
```

#### 2. 編譯與執行 Rust Storage Core
```bash
cd engine/storage-rust

# 執行單元測試
cargo test --release

# 發行模式編譯與運行
cargo run --release
```

---

## 🐙 Git 版本控制與上傳指南

本專案已完成完整模組開發與檔案架構整合。您可以透過以下步驟初始化 Git 儲存庫並推送到 GitHub、GitLab 或自建 Git 伺服器：

### 1. 本地儲存庫初始化與狀態確認
```bash
# 初始化 Git 儲存庫 (若尚未初始化)
git init

# 確認受追蹤檔案 (已由 .gitignore 自動排除 node_modules/ 與建置暫存檔)
git status
```

### 2. 暫存並建立提交
```bash
# 將所有原始碼、設定檔與本說明文件加入暫存區
git add .

# 建立提交紀錄
git commit -m "feat: complete SEMOR CYBER NG-SIEM platform with full-stack engines, SOAR, Cases, FIM, and comprehensive documentation"
```

### 3. 設定主分支與遠端倉庫
```bash
# 將預設分支命名為 main
git branch -M main

# 新增您的遠端倉庫網址 (請將 <YOUR_REPO_URL> 替換為實際 URL，例如：https://github.com/your-org/semor-ng-siem.git)
git remote add origin <YOUR_REPO_URL>
```

### 4. 推送至遠端儲存庫
```bash
# 首次推送並關聯追蹤分支
git push -u origin main
```

---

## 🔒 安全性、權限架構與授權

- **角色型存取控制 (RBAC)**：支援多層級權限劃分（Administrator、SecOps Lead、Incident Responder、Auditor、Viewer），嚴格隔離敏感調查案件與系統配置。
- **證據鏈合法性 (Chain of Custody)**：所有取證資料、PCAP 側錄檔與檔案雜湊均採用 SHA-256 數位指紋與時戳防護，符合法庭數位證據保全規範。
- **通訊防護**：各核心間支援 TLS 加密與 Unix Domain Socket 隔離通訊，防止傳輸層監聽。

---

*SEMOR CYBER NG-SIEM Platform — 守護關鍵基礎設施與現代企業的次世代安全防線。*

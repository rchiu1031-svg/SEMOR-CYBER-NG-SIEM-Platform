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
4. [完整安裝與部署指南 (Comprehensive Installation Guide)](#-完整安裝與部署指南-comprehensive-installation-guide)
   - [系統前置需求與硬體規格建議 (依據台灣法規 6 個月以上法定留存)](#系統前置需求與硬體規格建議)
   - [環境相依工具安裝 (Ubuntu / Debian / RHEL / macOS)](#步驟零系統依賴環境安裝)
   - [步驟一：原始碼取得與環境變數設定](#步驟一原始碼取得與環境變數設定)
   - [步驟二：方法 A - Node.js 全端伺服器本地快速安裝 (建議開發與評估)](#方法-a-nodejs-全端伺服器本地快速安裝-建議開發與評估)
   - [步驟三：方法 B - Docker Compose 容器化全核心一鍵部署 (建議生產運維)](#方法-b-docker-compose-容器化全核心一鍵部署-建議生產運維)
   - [步驟四：方法 C - 原生 Go & Rust 雙底層核心獨立編譯](#方法-c-原生-go--rust-雙底層核心獨立編譯)
   - [步驟五：Linux Systemd 守護行程 (Daemon) 服務化配置](#步驟五linux-systemd-守護行程-daemon-服務化配置)
   - [步驟六：Nginx 反向代理、HTTPS SSL 與防火牆設定](#步驟六nginx-反向代理https-ssl-與防火牆設定)
   - [步驟七：平台初始化、預設管理者帳號與登入驗證](#步驟七平台初始化預設管理者帳號與登入驗證)
   - [步驟八：日誌收集驗證 (Syslog / WinRM / Flow 測試命令)](#步驟八日誌收集驗證-syslog--winrm--flow-測試命令)
5. [後端 RESTful API 規格概覽](#-後端-restful-api-規格概覽)
6. [專案目錄結構](#-專案目錄結構)
7. [Git 版本控制與上傳指南](#-git-版本控制與上傳指南)
8. [系統安全性、權限架構與故障排除 (Troubleshooting)](#-安全性權限架構與故障排除-troubleshooting)

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

## 🛠 完整安裝與部署指南 (Comprehensive Installation Guide)

本章節提供 **SEMOR CYBER NG-SIEM** 平台的完整安裝手冊，包含系統底層依賴、原始碼設定、三種部署路徑（Node.js 本地運行、Docker Compose 容器微服務、Go/Rust 原生編譯）、Linux Systemd 守護行程、Nginx 反向代理與日誌收集驗證測試。

---

### 系統前置需求與硬體規格建議

> ⚖️ **台灣法規遵循重要聲明 (Taiwan Log Retention Compliance Requirement)**：  
> 依據台灣**《資通安全管理法》**（資通安全責任額度及分級應行維護事項表、公務機關及特定非公務機關防護基準）、**《個人資料保護法施行細則》第 12 條**以及金管會**《金融機構辦理電腦系統資訊安全評估辦法 / 資安監控作業指引》**之強制規範：  
> **資通系統日誌 (System Logs)、稽核軌跡 (Audit Trail)、防火牆與網路連線紀錄 (Flow/Traffic Logs) 及各類資安防禦事件，線上與離線查詢週期「依法至少必須完整保存 6 個月 (180 天) 以上」**（特定關鍵基礎設施 CI、A/B 級機關或金融機構更要求冷備份留存 1 至 3 年）。  
> 
> 為符合法定 6 個月以上之留存標準，硬體磁碟容量**切勿以短期測試或未壓縮之隨機容量評估**，必須依據企業每日實際進線 EPS (Events Per Second)、單筆日誌均量、VictoriaLogs 區塊壓縮比與 30% 系統安全緩衝水位進行科學精算。

#### 1. 建議硬體規格配置表 (符合 6 個月以上法定留存標準)

| 部署規模 | 適用場景 / 預期 EPS | 建議 CPU | 建議記憶體 (RAM) | 磁碟空間建議 (滿足 6 個月以上法規留存) | 儲存架構與等級推薦 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PoC / 輕量評估** | < 1,000 EPS<br>(實驗室 / 邊緣節點) | 4 ~ 8 核心 | 16 GB | **1 TB ~ 2 TB**<br>*(原 50GB 僅能存數天，無法合規)* | NVMe SSD (單碟或 RAID 1)，含 OS、Docker 鏡像與 180 天完整日誌留存 |
| **標準中小型企業** | 1,000 ~ 10,000 EPS<br>(一般企業 SOC) | 8 ~ 16 核心 | 32 ~ 64 GB | **8 TB ~ 20 TB**<br>*(滿足 180 天法規門檻)* | **分層儲存 (推薦)**：<br>• 熱資料層：2 ~ 4 TB NVMe SSD (即時關聯與近 30 天查詢)<br>• 溫資料層：16 TB Enterprise SAS RAID 10 (31~180 天法規合規庫) |
| **大型企業 / 關鍵基礎設施** | 10,000 ~ 50,000 EPS<br>(CI 領域 / 跨國企業) | 16 ~ 32 核心 | 64 ~ 128 GB | **30 TB ~ 80 TB**<br>*(滿足 180 天 ~ 1 年留存)* | **高效能混合陣列**：<br>• 熱資料層：8 ~ 16 TB Enterprise NVMe (RAID 10)<br>• 溫/冷資料層：64 TB+ Enterprise SAS HDD (RAID 6/60) 或 S3 物件儲存 |
| **超大規模 / 金控電信叢集** | 50,000 ~ 100,000+ EPS<br>(金控跨域 / 電信 / 集中式 MSSP) | 32 ~ 64+ 核心<br>(分散式多節點) | 128 ~ 256+ GB<br>(叢集節點) | **100 TB ~ 250 TB+**<br>*(滿足 6 個月至 3 年留存)* | **分散式橫向擴展 (Scale-out)**：<br>分散式儲存叢集 (Ceph / SAN / 分散式 NVMe-oF)，支援熱/溫/冷自動轉存與 PB 級物件歸檔 |

---

#### 2. 磁碟容量科學精算公式 (Capacity Sizing Formula)

為協助企業架構師精確規劃儲存採購預算，可套用以下容量精算公式：

$$\text{每日原始資料量 (Raw GB/day)} = \frac{\text{EPS} \times 86,400\,\text{秒} \times \text{平均單筆日誌大小 (Bytes)}}{1024^3}$$

$$\text{6 個月法定合規儲存量 (GB)} = \left( \frac{\text{每日原始資料量}}{\text{壓縮比 (ZSTD + Delta-of-Delta)}} \times 180\,\text{天} \times \text{索引與 Bloom Filter 開銷 (1.15)} \right) \times \text{安全水位與 OS 保留 (1.30)}$$

> **實務情境估算範例 (以 5,000 EPS 為例)**：
> - **單筆日誌平均大小**：約 600 Bytes (含 Syslog 標頭、JSON 欄位、WinRM 內容)。
> - **每日原始日誌量**：$5,000 \times 86,400 \times 600 \div 1024^3 \approx 241.4\,\text{GB/天}$。
> - **VictoriaLogs 儲存核心壓縮比**：約 7x ~ 10x（壓縮後每日約 $24.1 \sim 34.5\,\text{GB}$）。
> - **180 天 (6 個月) 淨儲存需求**：約 $4.3 \sim 6.2\,\text{TB}$。
> - **加上 Bloom Filter 三層剪枝索引 (15%) + 磁碟健康水位與 OS 保留 (30%)**：需配置 **8 TB ~ 10 TB** 有效可用空間。
> - 若規劃 RAID 10 鏡像冗餘，實際採購實體磁碟應為 **16 TB ~ 20 TB**。

---

#### 3. 日誌生命週期與分層保存策略 (Hot / Warm / Cold Tiering Policy)

SEMOR CYBER NG-SIEM 遵循台灣資安規範建議採用三層式生命週期管理：

1. **🔥 熱資料層 (Hot Tier, 0 ~ 30 天)**：
   - **儲存媒介**：高效能 NVMe PCIe 4.0/5.0 SSD。
   - **用途**：提供 Discovery 毫秒級日誌搜尋、MITRE ATT&CK 實時關聯分析、SOAR 自動化劇本即時判定與 APM 鏈路追蹤。
2. **❄️ 溫資料層 (Warm Tier, 31 ~ 180 天，落實 6 個月法定門檻)**：
   - **儲存媒介**：高密度 Enterprise SAS SSD 或 Enterprise SATA RAID 10/60 陣列。
   - **用途**：以 Rust VictoriaLogs 列式不可變 Block 壓縮存放，保留 Bloom Filter 雙重散列索引，無需全量解壓即可迅速調閱案件證據鏈與法規稽核抽查。
3. **🧊 冷備份層 (Cold Archive, 180 天以上至 1 ~ 3 年)**：
   - **儲存媒介**：外部 NAS、磁帶櫃或相容 S3 / MinIO 之雲端冷儲存。
   - **用途**：自動輸出加密壓縮封裝包，包含 SHA-256 數位簽章與不可篡改性證明，滿足司法調查、數位鑑識與金管會長週期備份規範。

---

#### 4. 作業系統與底層儲存環境調優

- **建議作業系統**：Ubuntu 22.04 LTS / 24.04 LTS、Debian 12、RHEL 8/9、Rocky Linux 9 或 macOS (Apple Silicon / Intel)。
- **推薦檔案系統**：`XFS` 或 `ext4`。建議在 `/etc/fstab` 掛載參數加入 `noatime,nodiratime` 以大幅降低磁碟 Metadata 寫入開銷。
- **儲存陣列推薦**：正式生產環境強烈建議配置硬體 **RAID 10**，兼顧寫入效能 (IOPS) 與容錯能力；嚴禁於生產環境使用未做 RAID 的單顆硬碟或慢速網路磁碟 (NFS)。
- **通訊埠需求清單**：
  - `3000/TCP`：Web 前端與 SOC 操作台 (可透過 Nginx 80/443 反代)
  - `8080/TCP`：Go 接收器 HTTP Ingest API (`/insert/jsonline`)
  - `5140/UDP` & `5140/TCP`：Syslog 高速接收通道 (建議搭配 32MB Socket 核心緩衝)
  - `9527/TCP`：Rust VictoriaLogs 核心內部 RPC 通訊
  - `5986/TCP`：Windows WinRM 遠端事件收集 (選用)

---

### 步驟零：系統依賴環境安裝

請根據您伺服器的 Linux 發行版執行以下指令安裝基礎開發工具、Node.js 22 LTS 與 Docker：

#### 1. Ubuntu / Debian 系統環境準備
```bash
# 更新軟體源並安裝基本編譯工具
sudo apt update && sudo apt install -y curl wget git build-essential ufw net-tools pkg-config libssl-dev

# 安裝 Node.js 22.x LTS (NodeSource 官方來源)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 確認 Node.js 與 npm 版本
node -v   # 需顯示 v20.x 或 v22.x
npm -v    # 需顯示 v10.x 或更高版本

# 安裝 Docker 與 Docker Compose 插件 (選用，若使用容器化部署)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo apt install -y docker-compose-plugin
```

#### 2. RHEL 9 / Rocky Linux 9 / AlmaLinux 系統環境準備
```bash
# 安裝開發工具包
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y git curl wget firewalld openssl-devel

# 安裝 Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs

# 安裝 Docker CE
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
```

---

### 步驟一：原始碼取得與環境變數設定

```bash
# 1. 複製專案至伺服器目錄
git clone <YOUR_REPOSITORY_URL> /opt/semor-ng-siem
cd /opt/semor-ng-siem

# 2. 複製環境變數範本檔
cp .env.example .env

# 3. 依據需求調整 .env 設定檔
nano .env
```

`.env` 典型配置說明：
```bash
# VictoriaLogs / Rust Core 儲存節點端點位址
VICTORIALOGS_URL=http://localhost:9428
VICTORIALOGS_ACCOUNT_ID=0
VICTORIALOGS_PROJECT_ID=0

# 平台辨識名稱與監聽連接埠
PORT=3000
SIEM_PLATFORM_NAME=SEMOR CYBER NG-SIEM Platform

# Google Gemini API 金鑰 (選用，啟動 AI SecOps 智慧分析師)
# GEMINI_API_KEY=AIzaSy...
```

---

### 步驟二：安裝方式 A — Node.js 全端本地快速安裝 (建議開發與評估)

此方式適用於單機獨立運維、功能驗證與 SOC 本地測試：

```bash
# 1. 安裝專案 NPM 核心與前端相依套件 (由 package.json 自動處理)
npm install

# 2. 執行語法與 TypeScript 靜態型別編譯檢驗
npm run lint

# 3. 啟動開發伺服器 (包含 Express 全端 API 與 Vite 即時熱載入)
npm run dev
```

如需以**生產環境效能模式**運行：
```bash
# 1. 編譯前端靜態資產 (輸出至 dist 目錄)
npm run build

# 2. 啟動正式環境伺服器
npm start
```
開啟瀏覽器訪問 `http://<伺服器IP>:3000` 即可進入 SEMOR CYBER 操作首頁。

---

### 步驟三：安裝方式 B — Docker Compose 容器化全核心一鍵部署 (建議生產運維)

此方式會同時構建並啟動 **Rust 區塊儲存核心**、**Go 高效能日誌接收器** 與 **Node.js Web 控制台** 三大獨立微服務容器：

```bash
# 1. 建置並背景啟動所有微服務容器
docker compose -f docker-compose.engine.yml up -d --build

# 2. 檢查各容器運行健康狀態
docker compose -f docker-compose.engine.yml ps

# 輸出範例：
# NAME                  IMAGE                 STATUS          PORTS
# semor-storage-rust    semor-storage-rust    Up (healthy)    0.0.0.0:9527->9527/tcp
# semor-collector-go    semor-collector-go    Up (healthy)    0.0.0.0:5140->5140/udp, 0.0.0.0:5140->5140/tcp, 0.0.0.0:8080->8080/tcp
# semor-web-platform    semor-web-platform    Up (healthy)    0.0.0.0:3000->3000/tcp

# 3. 即時檢視各引擎輸出日誌
docker compose -f docker-compose.engine.yml logs -f --tail=100

# 4. 如需停止服務
docker compose -f docker-compose.engine.yml down
```

---

### 步驟四：安裝方式 C — 原生 Go & Rust 雙底層核心獨立編譯

若欲追求極限百萬級 EPS 裸機吞吐效能，可直接在 Host 作業系統編譯原生執行檔：

#### 1. 編譯 Go Collector 接收器 (Golang 1.22+)
```bash
# 安裝 Go 1.22+ (若尚未安裝)
sudo apt install -y golang-go || sudo snap install go --classic

# 進入 Go 核心模組目錄
cd /opt/semor-ng-siem/engine/collector-go

# 下載 Go 模組依賴
go mod download

# 編譯優化二進位執行檔 (Strip debug symbols 降低體積)
CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/semor-collector main.go

# 執行收集器 (監聽 UDP/TCP 5140 與 HTTP 8080)
./bin/semor-collector
```

#### 2. 編譯 Rust Storage Core 儲存核心 (Rust 1.78+)
```bash
# 安裝 Rust 工具鏈 (Cargo)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# 進入 Rust 核心模組目錄
cd /opt/semor-ng-siem/engine/storage-rust

# 執行單元測試 (驗證 Block 壓縮、ZSTD 與 Bloom Filter 正確性)
cargo test --release

# 以發行最高效能等級 (Level 3) 編譯
cargo build --release

# 啟動儲存核心 (資料儲存路徑 /var/lib/semor/vlog)
sudo mkdir -p /var/lib/semor/vlog /var/run/semor
sudo chown -R $USER:$USER /var/lib/semor /var/run/semor
./target/release/semor-storage-rust
```

---

### 步驟五：Linux Systemd 守護行程 (Daemon) 服務化配置

為確保伺服器重開機時自動復原運行，建議配置 Systemd 服務：

建立 `/etc/systemd/system/semor-siem.service`：
```bash
sudo tee /etc/systemd/system/semor-siem.service > /dev/null << 'EOF'
[Unit]
Description=SEMOR CYBER NG-SIEM Unified Platform Service
After=network.target docker.service
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/semor-ng-siem
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5s
StandardOutput=journal
StandardError=journal
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

啟用並啟動服務：
```bash
# 重新載入 Systemd 設定檔
sudo systemctl daemon-reload

# 設定開機自動啟動並立即啟動
sudo systemctl enable --now semor-siem

# 查看服務即時狀態
sudo systemctl status semor-siem
```

---

### 步驟六：Nginx 反向代理、HTTPS SSL 與防火牆設定

#### 1. Nginx 反向代理配置範例
建立 `/etc/nginx/sites-available/semor-siem.conf`：
```nginx
server {
    listen 80;
    server_name siem.yourcompany.com;

    # 建議強制轉向 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name siem.yourcompany.com;

    ssl_certificate     /etc/ssl/certs/semor-siem.crt;
    ssl_certificate_key /etc/ssl/private/semor-siem.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # 客戶端最大上傳封包大小 (支援 Raw PCAP 數位鑑識上傳)
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

啟用站點設定：
```bash
sudo ln -s /etc/nginx/sites-available/semor-siem.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### 2. Linux 防火牆 (UFW / firewalld) 規則開放
```bash
# Ubuntu UFW 防火牆
sudo ufw allow 22/tcp comment "SSH Remote Access"
sudo ufw allow 80/tcp comment "HTTP Web"
sudo ufw allow 443/tcp comment "HTTPS Web (NG-SIEM)"
sudo ufw allow 3000/tcp comment "SEMOR Direct Port"
sudo ufw allow 5140/udp comment "Syslog UDP Receiver"
sudo ufw allow 5140/tcp comment "Syslog TCP Receiver"
sudo ufw allow 8080/tcp comment "Go HTTP Ingestion"
sudo ufw enable
```

---

### 步驟七：平台初始化、預設管理者帳號與登入驗證

系統首次啟動時會自動於根目錄產生 `users_config.json` 與 `system_settings_config.json`，預設內建三組測試與營運帳號：

| 帳號 (Username) | 預設密碼 (Password) | 角色層級 (Role) | 具備權限清單 |
| :--- | :--- | :--- | :--- |
| **`supervisor`** | `password123` | **系統主管 (Supervisor)** | 最高權限：可存取所有 14 大模組、底層引擎監控、使用者權限陣列與全域配置 |
| **`admin`** | `password123` | **資安管理員 (Admin)** | 可管理案件、SOAR、FIM、網路控制、日誌規則與使用者矩陣 |
| **`auditor`** | `password123` | **合規稽核員 (Auditor)** | 唯讀 (Read-Only) 存取：可檢視所有事件、日誌歷史、鑑識報告與證物鏈雜湊 |

> ⚠️ **生產環境安全警告**：完成首次登入後，請立即至側邊欄 **「設定 > 使用者管理 (User Access Matrix)」** 修改預設密碼或整合企業 Active Directory / LDAP / SSO 單一登入。

---

### 步驟八：日誌收集驗證 (Syslog / WinRM / Flow 測試命令)

部署完成後，可透過下列命令測試日誌是否正常流經接收器並寫入系統：

#### 1. 發送測試 Syslog 訊息 (UDP / TCP 5140)
```bash
# 透過 logger 指令發送測試 Syslog UDP 封包
logger -n 127.0.0.1 -P 5140 -d -T "SEMOR_TEST: SSH Brute force detected from 203.0.113.88 on host db-node-01"

# 透過 netcat 發送 TCP Syslog 訊息
echo "<14>1 $(date -u +%Y-%m-%dT%H:%M:%SZ) edge-firewall-01 cisco-asa - - - [SECURITY] Denied TCP from 198.51.100.22 to 10.0.0.1" | nc -w 1 127.0.0.1 5140
```

#### 2. 測試 Go 接收器 HTTP Ingestion API (`/insert/jsonline`)
```bash
curl -X POST http://localhost:8080/insert/jsonline \
  -H "Content-Type: application/stream+json" \
  -d '{"_msg":"Unauthorized administrator privilege elevation detected","host":"dc01.corp.internal","severity":"Critical","mitre":"T1078"}'
```

#### 3. 測試後端核心 API 健康檢查
```bash
# 檢查平台健康狀態
curl -s http://localhost:3000/api/health | jq .

# 檢查 FIM 遙測端點
curl -s http://localhost:3000/api/v1/fim/telemetry | jq .

# 檢查案件管理統計端點
curl -s http://localhost:3000/api/v1/cases/metrics | jq .

# 檢查網路探測 Ping 診斷
curl -s -X POST http://localhost:3000/api/v1/settings/network/test \
  -H "Content-Type: application/json" \
  -d '{"target":"8.8.8.8"}' | jq .
```

---

## 📡 後端 RESTful API 規格概覽

系統主要 RESTful API 路由掛載於 Express 伺服器 (`server.ts` & `server/settingsRouter.ts`)：

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
| **全域設定 (Settings)** | `/api/v1/settings/all` | `GET`, `POST` | 取得或全域更新所有系統設定配置 |
| | `/api/v1/settings/network` | `GET`, `PUT` | 查詢與更新網路介面、DNS、Gateway 與靜態路由 |
| | `/api/v1/settings/network/test` | `POST` | 執行 ICMP 閘道與主機連線延遲探測 |
| | `/api/v1/settings/general` | `GET`, `PUT` | 平台主機 ID、組織、安全策略與 AI 參數設定 |
| | `/api/v1/settings/auth` | `GET`, `PUT` | AD / LDAP / RADIUS / SAML SSO 認證設定 |
| | `/api/v1/settings/auth/test-connection`| `POST`| 測試目錄服務連線與 TLS 憑證驗證 |
| | `/api/v1/settings/collection` | `GET`, `PUT` | 資料採集模式配置 (Syslog / WinRM / Flow) |
| | `/api/v1/settings/collection/add-source`| `POST` | 動態註冊新增 Syslog 監聽端點 |
| | `/api/v1/settings/remotelog` | `GET` | 取得 Splunk/Syslog/Kafka 遠端轉發器清單 |
| | `/api/v1/settings/threat-intel/feeds` | `GET`, `POST`| 取得或註冊 STIX/TAXII 2.1 外部威脅饋送來源 |
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
├── Dockerfile                      # Web 平台生產環境多階段構建設定檔 (Node 22 Alpine)
├── docker-compose.engine.yml       # 微服務容器編排定義 (Web + Collector + Rust Storage)
├── package.json                    # 全端相依性套件與 NPM 腳本 (dev, start, build, lint)
├── tsconfig.json                   # TypeScript 編譯器組態
├── vite.config.ts                  # Vite 建置工具設定
├── server.ts                       # Node.js + Express 主伺服器入口 (掛載所有 API 路由)
├── server/                         # 平台後端核心業務引擎與 REST 路由器
│   ├── casesEngine.ts              # 案件管理狀態機 (SIRP, Evidence, Timeline, Report)
│   ├── casesRouter.ts              # 案件管理 RESTful API
│   ├── fimEngine.ts                # 檔案完整性監控狀態機 (Rollback, Containment, Scan)
│   ├── fimRouter.ts                # 檔案完整性 RESTful API
│   ├── settingsRouter.ts           # 全域設定管理 API (Network, Auth, Collection, RemoteLog, CTI)
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
└── src/                            # 前端 React 19 + TypeScript SPA 原始碼
    ├── App.tsx                     # 平台頂層佈局、多分頁導航與 SOC 側邊欄
    ├── main.tsx                    # React 應用程式掛載點
    ├── types.ts                    # 全域資料型別定義與 12 大模組清單
    ├── services/                   # 前端後端通訊 Service 層 (siemService.ts)
    ├── components/                 # UI 元件庫
    │   ├── case-management/        # 案件管理與 Incident Response 戰情室
    │   ├── soar/                   # SOAR 劇本編排與 FIM 完整性監控視圖
    │   ├── apm/                    # SkyWalking APM 鏈路追蹤與拓撲圖視圖
    │   ├── cti/                    # 威脅情資視覺化看板
    │   ├── honeypot/               # T-Pot 攻擊地圖與蜜罐管理
    │   ├── GeneralSettingsView.tsx # 一般設定與 AI 引擎配置視圖
    │   ├── AuthenticationSettingsView.tsx # 身分認證與 SSO 管理視圖
    │   ├── UserSettingsView.tsx    # 使用者帳號與 RBAC 矩陣視圖
    │   ├── RemoteLogServerSettingView.tsx # 遠端日誌轉發器配置視圖
    │   └── ThreatIntelSourcesSettingView.tsx # 外部情資來源訂閱視圖
    └── locales/                    # 多國語系語系檔 (繁體中文 / 英文)
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
git commit -m "feat: complete SEMOR CYBER NG-SIEM platform with installation guides and full-stack modules"
```

### 3. 設定主分支與遠端倉庫
```bash
# 將預設分支命名為 main
git branch -M main

# 新增您的遠端倉庫網址 (請將 <YOUR_REPO_URL> 替換為實際 URL)
# 例如：git remote add origin https://github.com/your-org/semor-ng-siem.git
git remote add origin <YOUR_REPO_URL>
```

### 4. 推送至遠端儲存庫
```bash
# 首次推送並關聯追蹤分支
git push -u origin main
```

---

## 🔒 安全性、權限架構與故障排除 (Troubleshooting)

### 常見問題排查指南

1. **連接埠 3000 或 5140 衝突 (Address already in use)**：
   - 檢查佔用行程：`sudo lsof -i :3000` 或 `sudo lsof -i :5140`
   - 結束佔用行程或於 `.env` 中調整 `PORT`。

2. **Syslog UDP 封包收不到或丟包**：
   - 確認核心 UDP Socket 接收緩衝上限：
     ```bash
     sudo sysctl -w net.core.rmem_max=33554432
     sudo sysctl -w net.core.rmem_default=33554432
     ```
   - 永久生效請寫入 `/etc/sysctl.conf` 並執行 `sudo sysctl -p`。

3. **Docker 權限不足問題**：
   - 執行 `sudo usermod -aG docker $USER` 並重新登入終端機。

4. **安全與法規合規性 (Taiwan Compliance & Governance)**：
   - **法定 6 個月以上日誌留存 (6+ Months Retention)**：依據台灣《資通安全管理法》及《個人資料保護法施行細則》第 12 條，全系統事件、系統登入、防火牆連線與稽核軌跡預設保留至少 180 天 (6 個月)，並具備分層溫/冷自動歸檔。
   - **角色型存取控制 (RBAC)**：嚴格劃分 Supervisor、Admin、Auditor 與 Viewer。
   - **數位證據保全鏈 (Chain of Custody)**：所有取證資料、PCAP 側錄與 FIM 還原均具備 SHA-256 數位簽章與不可篡改驗證。

---

*SEMOR CYBER NG-SIEM Platform — 守護關鍵基礎設施與現代企業的次世代安全防線。*


// High-Fidelity Critical Incidents Dataset (20 Real-World Security Incidents for Demo)
// Conforms to SEMOR CYBER SOC correlation schema, MITRE ATT&CK for Enterprise & ICS, and STIX 2.1

export interface PlaybookItem {
  id: string;
  title: string;
  description: string;
  type: 'isolate' | 'block' | 'revoke' | 'dump' | 'notify';
}

export interface IncidentNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface IncidentHistoryItem {
  timestamp: string;
  action: string;
  operator: string;
  details?: string;
}

export interface CriticalIncidentItem {
  id: string;
  time: string;
  srcip: string;
  srcHost?: string;
  srcUser?: string;
  dstip: string;
  dstHost?: string;
  action: string;
  country: string;
  threat: string;
  risk: 'Critical' | 'High' | 'Medium';
  riskScore: number;
  status: 'active' | 'investigating' | 'contained' | 'resolved';
  category: 'ueba' | 'ics' | 'apt' | 'bruteforce' | 'c2' | 'exfil';
  cve?: string;
  mitreTTP: string;
  mitreStage: 'Recon' | 'Initial Access' | 'Privilege Escalation' | 'Lateral Movement' | 'Exfiltration';
  affectedAssets: number;
  confidence: number;
  payloadHex: string;
  rawLog: string;
  aiSummary: string;
  recommendedPlaybooks: PlaybookItem[];
  notes?: IncidentNote[];
  history?: IncidentHistoryItem[];
}

export const DEMO_CRITICAL_INCIDENTS: CriticalIncidentItem[] = [
  {
    id: 'INC-2026-0001',
    time: '2026-08-20 12:24:08 UTC',
    srcip: '10.88.88.106',
    srcHost: 'WS-FINANCE-TAIPEI-02',
    srcUser: 'CORP\\eva_lin',
    dstip: '185.220.101.45',
    dstHost: 'tor-exit-node04.onion.to',
    action: 'Contained',
    country: 'RU',
    threat: 'LockBit 3.0 勒索軟體磁碟陰影清除與多線程大量加密破壞',
    risk: 'Critical',
    riskScore: 99,
    status: 'contained',
    category: 'apt',
    cve: 'CVE-2023-27532',
    mitreTTP: 'T1486 Data Encrypted for Impact',
    mitreStage: 'Exfiltration',
    affectedAssets: 4,
    confidence: 99,
    payloadHex: '76 73 73 61 64 6d 69 6e 20 64 65 6c 65 74 65 20 73 68 61 64 6f 77 73 20 2f 61 6c 6c 20 2f 71 75 69 65 74 20 26 26 20 77 6d 69 63 20 73 68 61 64 6f 77 63 6f 70 79 20 64 65 6c 65 74 65',
    rawLog: 'Aug 20 12:24:08 WS-FINANCE-TAIPEI-02 EDR-ALARM: process="vssadmin.exe" args="delete shadows /all /quiet" parent="LockBit3_Loader.exe" pid=7812 mitre="T1490,T1486" verdict=TERMINATED_AND_ISOLATED',
    aiSummary: '財務部工作站遭 LockBit 3.0 勒索惡意程式入侵，嘗試調用 vssadmin 銷毀 Windows 系統磁碟陰影備份並進行 IOCP 多執行緒加密。EDR 與 SEMOR SOC 聯防模組已於 4 秒內實施端點微隔離並阻斷其 Tor C2 通訊。',
    recommendedPlaybooks: [
      { id: 'pb-101', title: '主機微隔離與 EDR 網路遏止', description: '透過 EDR 下發實體網路遏止命令，僅允許 SIEM 管理連線', type: 'isolate' },
      { id: 'pb-102', title: '全網防火牆黑名單封鎖 C2 節點', description: '向邊界 Palo Alto 防火牆推播 185.220.101.45 永久阻斷策略', type: 'block' },
      { id: 'pb-103', title: '通報財務長與啟動異地備份復原', description: '發送加密威脅通報至 SOC 應變小組與備份儲存庫防護節點', type: 'notify' }
    ],
    notes: [
      { id: 'note-1', author: 'SOC Lead Alex', timestamp: '12:25:30', content: '已確認主機網路已隔離，檔案加密行為已終止，未擴散至 File Server。' }
    ],
    history: [
      { timestamp: '12:24:08', action: 'INCIDENT_CREATED', operator: 'SEMOR Engine', details: '觸發高嚴重性勒索軟體規則' },
      { timestamp: '12:24:12', action: 'AUTO_ISOLATED', operator: 'SOAR Playbook', details: '主機 WS-FINANCE-TAIPEI-02 網路隔離完畢' }
    ]
  },
  {
    id: 'INC-2026-0002',
    time: '2026-08-20 12:23:45 UTC',
    srcip: '10.88.88.202',
    srcHost: 'DC-ActiveDirectory-01',
    srcUser: 'NT AUTHORITY\\SYSTEM',
    dstip: '10.88.88.202',
    dstHost: 'DC-ActiveDirectory-01',
    action: 'Blocked',
    country: 'TW',
    threat: '網域控制站 LSASS 記憶體傾印與 Mimikatz 雜湊憑證竊取',
    risk: 'Critical',
    riskScore: 98,
    status: 'investigating',
    category: 'ueba',
    cve: 'CVE-2022-26925',
    mitreTTP: 'T1003.001 LSASS Memory',
    mitreStage: 'Privilege Escalation',
    affectedAssets: 1,
    confidence: 98,
    payloadHex: '65 65 6c 73 61 73 73 2e 65 78 65 00 4d 69 6e 69 44 75 6d 70 57 72 69 74 65 44 75 6d 70 00 73 65 6b 75 72 6c 73 61 3a 3a 6c 6f 67 6f 6e 70 61 73 73 77 6f 72 64 73',
    rawLog: '{"timestamp":"2026-08-20T12:23:45Z","agent":"DC-ActiveDirectory-01","event_id":10,"source":"Microsoft-Windows-Sysmon","target_image":"C:\\\\Windows\\\\System32\\\\lsass.exe","granted_access":"0x1010","call_trace":"C:\\\\Windows\\\\System32\\\\ntdll.dll+9cb44|C:\\\\Windows\\\\Temp\\\\procdump64.exe+2014"}',
    aiSummary: '網域控制站 (DC-ActiveDirectory-01) 遭未授權程序 procdump64.exe 請求開啟 lsass.exe 具備 0x1010 (PROCESS_VM_READ) 特權句柄，試圖提取 Active Directory 網域管理員之 NTLM 與 Kerberos 憑證，行為已被核心防護驅動強制攔截。',
    recommendedPlaybooks: [
      { id: 'pb-201', title: '緊急撤銷受影響網域特權帳號', description: '輪替 krbtgt 帳號金鑰並強迫所有 Domain Admins 重新登入', type: 'revoke' },
      { id: 'pb-202', title: '記憶體鑑識 Dump 與分析', description: '保留當前主機記憶體揮發性證據映像檔供數位鑑識使用', type: 'dump' }
    ]
  },
  {
    id: 'INC-2026-0003',
    time: '2026-08-20 12:22:30 UTC',
    srcip: '10.88.88.102',
    srcHost: 'SOC-Analyst-WS02',
    srcUser: 'CORP\\analyst_chen',
    dstip: '45.142.214.88',
    dstHost: 'c2-beacon-master.xyz',
    action: 'Active',
    country: 'DE',
    threat: 'Cobalt Strike 4.9 Malleable HTTPS 反向 Beacon 隱蔽通道建立',
    risk: 'Critical',
    riskScore: 97,
    status: 'active',
    category: 'c2',
    mitreTTP: 'T1071.001 Web Protocols',
    mitreStage: 'Lateral Movement',
    affectedAssets: 2,
    confidence: 96,
    payloadHex: '47 45 54 20 2f 61 70 69 2f 76 31 2f 73 79 6e 63 20 48 54 54 50 2f 31 2e 31 0d 0a 48 6f 73 74 3a 20 63 32 2d 62 65 61 63 6f 6e 2e 78 79 7a 0d 0a 43 6f 6f 6b 69 65 3a 20 73 65 73 73 69 6f 6e 3d 39 38 61 61 37',
    rawLog: 'SURICATA: alert tls any any -> 45.142.214.88 443 (msg:"ET TROJAN Cobalt Strike Malleable C2 Jitter Pattern Observed"; ja3="e7d705a3286e19ea42f587b344ee6865"; sid:2048102; rev:4)',
    aiSummary: '檢測到內網主機正與德國 Bulletproof 主機 45.142.214.88 進行週期性高熵值 TLS 443 封包交換，符合 Cobalt Strike Malleable HTTPS Beacon 特徵，JA3 指紋與已知 Red Team 威脅資料庫完全相符。',
    recommendedPlaybooks: [
      { id: 'pb-301', title: '邊界防火牆下發 IP/JA3 黑名單', description: '立即封鎖 45.142.214.88 與 TLS JA3 指紋連線', type: 'block' },
      { id: 'pb-302', title: '受感染端點隔離與進程終止', description: '對端點 SOC-Analyst-WS02 下發程序強制中斷', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0004',
    time: '2026-08-20 12:20:15 UTC',
    srcip: '10.88.88.254',
    srcHost: 'Core-Catalyst-9500',
    dstip: '194.26.29.114',
    dstHost: 'tunnel-proxy-ru.net',
    action: 'Investigating',
    country: 'NL',
    threat: 'Volt Typhoon 境外國家級 APT Living-off-the-Land 反向代理穿透',
    risk: 'Critical',
    riskScore: 96,
    status: 'investigating',
    category: 'apt',
    cve: 'CVE-2023-46805',
    mitreTTP: 'T1090.002 External Proxy',
    mitreStage: 'Lateral Movement',
    affectedAssets: 3,
    confidence: 95,
    payloadHex: '77 73 73 3a 2f 2f 73 6f 68 6f 2d 72 6f 75 74 65 72 2d 72 65 6c 61 79 2e 6f 72 67 3a 34 34 33 2f 77 73 00 70 72 63 74 6c 28 50 52 5f 53 45 54 5f 4e 41 4d 45 29',
    rawLog: 'NETFLOW-NDR: anomaly_type="LOTL_Tunnel" src=10.88.88.254 dst=194.26.29.114 bytes_out=14820000 proto=TCP/443 category="APT_VOLT_TYPHOON" tags=["SOHO_Router_Relay","FRP"]',
    aiSummary: '核心交換器旁路感測器抓取到持續向荷蘭中繼主機傳送反向 WebSocket 封裝流量，其行為特徵高度符合 Volt Typhoon 針對關鍵基礎設施之 Living-off-the-Land (LotL) 隱蔽通道建立手法。',
    recommendedPlaybooks: [
      { id: 'pb-401', title: '切斷邊界網路中繼通道', description: '將 194.26.29.114 與關聯網域加入全域防火牆阻斷清單', type: 'block' },
      { id: 'pb-402', title: '更新邊界網路設備韌體與憑證', description: '清查 VPN 閘道器與網路交換設備組態完整性', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0005',
    time: '2026-08-20 12:18:40 UTC',
    srcip: '10.88.88.105',
    srcHost: 'WS-ENG-DEV-05',
    srcUser: 'CORP\\kevin_tsai',
    dstip: '104.21.32.18',
    dstHost: 'lumma-c2-stealer-991.cc',
    action: 'Contained',
    country: 'US',
    threat: 'LummaC2 InfoStealer 竊取瀏覽器憑證與加密貨幣錢包密鑰',
    risk: 'Critical',
    riskScore: 95,
    status: 'contained',
    category: 'exfil',
    cve: 'CVE-2024-21412',
    mitreTTP: 'T1555.003 Credentials from Web Browsers',
    mitreStage: 'Exfiltration',
    affectedAssets: 1,
    confidence: 97,
    payloadHex: '50 4b 03 04 14 00 00 00 08 00 00 00 21 00 4c 6f 67 69 6e 20 44 61 74 61 2e 73 71 6c 69 74 65 00 43 72 79 70 74 55 6e 70 72 6f 74 65 63 74 44 61 74 61',
    rawLog: 'Wazuh-Agent[WS-ENG-DEV-05]: Rule 100412 fired: Suspicious DPAPI CryptUnprotectData called from rundll32.exe. TargetFile="C:\\Users\\kevin_tsai\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Login Data". Payload compressed into temp zip archive.',
    aiSummary: '研發部主機遭遇 LummaC2 二進位動態函式庫竊密木馬，透過 Windows DPAPI 解密本機 Chrome/Edge 密碼庫與 MetaMask 錢包擴充外掛，並打包 ZIP 試圖外傳至 104.21.32.18。流量已被即時攔截。',
    recommendedPlaybooks: [
      { id: 'pb-501', title: '強制登出並撤銷開發者企業 SSO 憑證', description: '在 Okta/Azure AD 立即強制撤銷 Session 及刷新密碼', type: 'revoke' },
      { id: 'pb-502', title: '主機實體隔離與防毒全盤查殺', description: '透過 EDR 下發主機隔離與完整特徵碼深度掃描', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0006',
    time: '2026-08-20 12:16:10 UTC',
    srcip: '10.99.10.45',
    srcHost: 'OT-HMI-OPERATOR-01',
    srcUser: 'operator_shift_a',
    dstip: '10.99.10.200',
    dstHost: 'SCADA-PLC-WATER-04',
    action: 'Blocked',
    country: 'TW',
    threat: '工控 SCADA Modbus TCP 異常 Function 0x05 強制寫入水處理線圈',
    risk: 'Critical',
    riskScore: 94,
    status: 'investigating',
    category: 'ics',
    mitreTTP: 'T0855 Unauthorized Command Message',
    mitreStage: 'Initial Access',
    affectedAssets: 2,
    confidence: 96,
    payloadHex: '00 01 00 00 00 06 01 05 00 04 ff 00',
    rawLog: 'OT-SURICATA: alert modbus any any -> 10.99.10.200 502 (msg:"ICS ATTACK: Unauthorized Modbus Write Single Coil to Safety Valve 0x0004"; function:5; address:4; value:65280; classtype:industrial-control; priority:1)',
    aiSummary: 'OT 水廠控制網段偵測到非例行維護時段之 Modbus TCP Function 0x05 寫入指令，試圖強制將關鍵冷卻水安全洩壓閥線圈設定為 0xFF00 (開啟)，已由 OT 專用 Deep Packet Inspection (DPI) 模組阻斷。',
    recommendedPlaybooks: [
      { id: 'pb-601', title: '切換 PLC 至本地硬體鎖定 (Run Only)', description: '通知現場 OT 工控工程師將 PLC 轉為本機物理保護模式', type: 'notify' },
      { id: 'pb-602', title: '隔離 HMI 操作員工作站', description: '關閉操作員站台至 PLC 網段之網路路由通訊埠', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0007',
    time: '2026-08-20 12:14:22 UTC',
    srcip: '45.33.22.11',
    dstip: '10.88.88.250',
    dstHost: 'DMZ-Honeypot-Bastion',
    action: 'Contained',
    country: 'CN',
    threat: '殭屍網路分散式 SSH 字典暴力破解與蜜罐誘捕防護',
    risk: 'High',
    riskScore: 89,
    status: 'contained',
    category: 'bruteforce',
    mitreTTP: 'T1110.001 Password Guessing',
    mitreStage: 'Initial Access',
    affectedAssets: 1,
    confidence: 94,
    payloadHex: '53 53 48 2d 32 2e 30 2d 6c 69 62 73 73 68 32 5f 31 2e 31 30 2e 30 0d 0a 75 73 65 72 3d 72 6f 6f 74 20 70 61 73 73 3d 50 61 73 73 77 6f 72 64 31 32 33',
    rawLog: 'HONEYPOT-COLLECTOR: 45.33.22.11 attempted 1,240 automated SSH credential guesses against honeypot bastion in 60s. Captured password dictionary and client RSA fingerprint.',
    aiSummary: '外部公網 IP 45.33.22.11 發動高頻率 SSH 自動化憑證爆破，已被 SEMOR 欺敵蜜罐成功誘捕並錄製所有攻擊載荷，系統已自動將其 IP 與關聯 C 段網段同步推播至邊界阻斷策略。',
    recommendedPlaybooks: [
      { id: 'pb-701', title: '動態黑名單邊界下發', description: '向所有對外防火牆同步更新 45.33.22.0/24 封鎖名單', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0008',
    time: '2026-08-20 12:12:05 UTC',
    srcip: '185.191.171.3',
    dstip: '10.88.88.201',
    dstHost: 'App-Kubernetes-Master',
    action: 'Blocked',
    country: 'NL',
    threat: 'SQL 注入 UNION SELECT 意圖外洩核心客戶資料庫機敏 PII',
    risk: 'High',
    riskScore: 91,
    status: 'active',
    category: 'exfil',
    cve: 'CVE-2023-34362',
    mitreTTP: 'T1190 Exploit Public-Facing Application',
    mitreStage: 'Initial Access',
    affectedAssets: 2,
    confidence: 96,
    payloadHex: '53 45 4c 45 43 54 20 2a 20 46 52 4f 4d 20 75 73 65 72 73 20 57 48 45 52 45 20 69 64 20 3d 20 31 20 55 4e 49 4f 4e 20 53 45 4c 45 43 54 20 70 61 73 73 77 6f 72 64 5f 68 61 73 68 20 46 52 4f 4d 20 61 64 6d 69 6e 5f 63 72 65 64 65 6e 74 69 61 6c 73',
    rawLog: 'NGINX-MODSEC: [id "942100"] [msg "SQL Injection Attack: Detected an SQL Injection Attempt via UNION"] [data "UNION SELECT password_hash FROM admin_credentials"] [severity "CRITICAL"]',
    aiSummary: 'Web 應用程式防火牆 (WAF) 攔截到來自荷蘭 IP 的 SQL 注入攻擊載荷，攻擊者試圖透過 UNION SELECT 語法批次提取 admin_credentials 帳號密碼雜湊，WAF 已強制回傳 HTTP 403 並凍結其連線。',
    recommendedPlaybooks: [
      { id: 'pb-801', title: 'WAF 封鎖攻擊者 IP 與特徵規則更新', description: '將來源 IP 加入 Cloudflare / Nginx 永久封鎖清單', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0009',
    time: '2026-08-20 12:10:18 UTC',
    srcip: '10.88.88.102',
    srcHost: 'SOC-Analyst-WS02',
    srcUser: 'CORP\\analyst_chen',
    dstip: '10.88.88.202',
    dstHost: 'DC-ActiveDirectory-01',
    action: 'Investigating',
    country: 'TW',
    threat: 'Kerberoasting 離線雜湊破解：惡意索取 SPN RC4 服務票證',
    risk: 'High',
    riskScore: 88,
    status: 'investigating',
    category: 'ueba',
    mitreTTP: 'T1558.003 Kerberoasting',
    mitreStage: 'Privilege Escalation',
    affectedAssets: 2,
    confidence: 93,
    payloadHex: '30 82 02 1b a0 03 02 01 05 a1 03 02 01 0c a2 07 03 05 00 20 00 00 00 a3 81 fc 30 81 f9 30',
    rawLog: 'Windows Security EventID=4769: TargetUserName="MSSQLSvc/db-cluster.corp.local" TicketEncryptionType=0x17 (RC4-HMAC) ClientAddress="10.88.88.102" Result=0x0 (Success)',
    aiSummary: '帳號 analyst_chen 突然向 Kerberos 金鑰分發中心 (KDC) 大量索取 RC4 弱加密的 SPN 服務票證（MSSQLSvc/db-cluster），此為典型的 Kerberoasting 攻擊前兆，旨在獲取票證並在離線環境透過 Hashcat 破解服務密碼。',
    recommendedPlaybooks: [
      { id: 'pb-901', title: '升級 SPN 服務帳號為 AES-256 加密', description: '強制停用 RC4-HMAC 並更換高強度長度大於 25 碼之服務密碼', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0010',
    time: '2026-08-20 12:08:02 UTC',
    srcip: '10.88.88.201',
    srcHost: 'App-Kubernetes-Master',
    srcUser: 'developer-ci',
    dstip: '10.88.88.201',
    dstHost: 'App-Kubernetes-Master',
    action: 'Blocked',
    country: 'TW',
    threat: 'Kubernetes 叢集未授權特權容器建立與 HostPID 容器逃逸逃逸',
    risk: 'Critical',
    riskScore: 93,
    status: 'active',
    category: 'apt',
    cve: 'CVE-2024-38063',
    mitreTTP: 'T1611 Escape to Host',
    mitreStage: 'Privilege Escalation',
    affectedAssets: 3,
    confidence: 95,
    payloadHex: '73 70 65 63 3a 20 68 6f 73 74 50 49 44 3a 20 74 72 75 65 2c 20 73 65 63 75 72 69 74 79 43 6f 6e 74 65 78 74 3a 20 70 72 69 76 69 6c 65 67 65 64 3a 20 74 72 75 65',
    rawLog: 'K8S-AUDIT: verb=create resource=pods namespace=default pod=debug-root-escape user=developer-ci admission_webhook=Kyverno result=DENIED reason="Privileged containers and hostPID strictly forbidden by policy"',
    aiSummary: 'Kubernetes API 伺服器截獲來自 CI/CD 服務帳號的特權 Pod 建立請求，其設定包含 `hostPID: true` 與掛載本機 `/` 根目錄，為標準容器逃逸至 Node 節點的攻擊手法。已由 Kyverno 安全策略即時駁回。',
    recommendedPlaybooks: [
      { id: 'pb-1001', title: '審計 CI/CD Token 權限並撤銷金鑰', description: '重新產生 GitLab/GitHub CI 憑證並限制 RBAC 角色', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0011',
    time: '2026-08-20 12:05:45 UTC',
    srcip: '10.99.10.15',
    srcHost: 'ENGINEERING-LAPTOP-02',
    srcUser: 'field_tech_guest',
    dstip: '10.99.10.120',
    dstHost: 'SIEMENS-S7-1500-PLC',
    action: 'Investigating',
    country: 'TW',
    threat: 'Siemens S7comm Plus 協定未經授權惡意韌體與 Logic 程式碼覆寫',
    risk: 'Critical',
    riskScore: 96,
    status: 'investigating',
    category: 'ics',
    mitreTTP: 'T0843 Program Download',
    mitreStage: 'Lateral Movement',
    affectedAssets: 2,
    confidence: 97,
    payloadHex: '72 02 00 24 32 01 00 00 00 01 00 0e 00 00 04 01 12 0a 10 02 00 01 00 00 84 00 00 00',
    rawLog: 'OT-SENTINEL: S7comm-Plus Request: Download block DB1 to PLC 10.99.10.120 attempted by unauthenticated engineering station. Safety integrity check failed.',
    aiSummary: '工業製造廠區 Siemens S7-1500 PLC 遭受未註冊之筆記型電腦嘗試上傳修改後的控制邏輯區塊 (DB1)，可能導致產線馬達超載運轉，OT 防火牆與 IDS 已將連線標註為最高風險事件並暫停通訊。',
    recommendedPlaybooks: [
      { id: 'pb-1101', title: '啟動 OT 實體安全旁路斷路機制', description: '通知現場資深工程師驗證 PLC 邏輯代碼雜湊', type: 'notify' },
      { id: 'pb-1102', title: '切斷非受控工程筆電連線', description: '將未授權 MAC 位址自交換器 802.1X 認證剔除', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0012',
    time: '2026-08-20 12:03:10 UTC',
    srcip: '185.220.101.99',
    srcUser: 'admin_david@semor.corp',
    dstip: '10.88.88.203',
    dstHost: 'SEMOR-SIEM-Ingestion',
    action: 'Blocked',
    country: 'DE',
    threat: '雲端管理員跨洲極限不可能旅遊 (Impossible Travel) 與 MFA 疲勞轟炸',
    risk: 'High',
    riskScore: 87,
    status: 'active',
    category: 'ueba',
    mitreTTP: 'T1078 Valid Accounts',
    mitreStage: 'Initial Access',
    affectedAssets: 1,
    confidence: 92,
    payloadHex: '4f 6b 74 61 20 41 75 74 68 3a 20 4d 46 41 20 50 75 73 68 20 46 61 74 69 67 75 65 20 53 70 61 6d 20 78 31 38 20 63 6f 75 6e 74',
    rawLog: 'UEBA-ANOMALY: user="admin_david@semor.corp" logged in from Taipei (118.163.1.2) at 12:00:00, then attempted login from Frankfurt (185.220.101.99) at 12:03:10. Speed: 15,200 km/h (Impossible Travel). Triggered 18 MFA push requests.',
    aiSummary: '管理員帳號 admin_david 在 3 分鐘內分別由台北與法蘭克福發起登入，移動速度達時速 15,200 公里判定為不可能旅遊。攻擊者連續發送 18 次 MFA 推播嘗試進行疲勞轟炸，系統已自動凍結該帳號並取消當前 Session。',
    recommendedPlaybooks: [
      { id: 'pb-1201', title: '強制重置帳號密碼並清除所有 Session', description: '在身分提供商立即鎖定帳號並電話照會本人', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0013',
    time: '2026-08-20 12:00:50 UTC',
    srcip: '10.88.88.107',
    srcHost: 'WS-RND-LAB-01',
    srcUser: 'CORP\\researcher_wang',
    dstip: '8.8.8.8',
    dstHost: 'dns.google',
    action: 'Blocked',
    country: 'US',
    threat: '高頻高熵 DNS Tunneling 隱蔽通道試圖外洩企業機密原始碼',
    risk: 'Critical',
    riskScore: 94,
    status: 'contained',
    category: 'exfil',
    mitreTTP: 'T1071.004 DNS',
    mitreStage: 'Exfiltration',
    affectedAssets: 2,
    confidence: 96,
    payloadHex: '61 38 66 31 39 63 61 38 31 62 39 30 32 34 38 66 2e 73 72 63 2d 65 78 66 69 6c 2e 62 61 64 64 6e 73 2e 6e 65 74',
    rawLog: 'DNS-ANALYTICS: Anomaly detected for domain "src-exfil.baddns.net". Query rate=450 qps, Average TXT entropy=4.92, Encoded base64 payload size=4.8MB. Action: SINKHOLE.',
    aiSummary: '研發實驗室主機遭植入 DNS 隧道外洩木馬，將壓縮加密之專利程式碼切片編碼為 Base64 子網域名稱，透過遞迴 DNS 查詢繞過一般 HTTP 防火牆限制。SEMOR DNS 防護已主動下發 Sinkhole 假回應阻斷傳輸。',
    recommendedPlaybooks: [
      { id: 'pb-1301', title: '主機端點網路隔離與程序查驗', description: '隔離 WS-RND-LAB-01 並傾印發送 DNS 請求之可疑進程', type: 'isolate' },
      { id: 'pb-1302', title: '全網遞迴 DNS 啟用 Response Policy Zone (RPZ)', description: '將 baddns.net 頂級網域加入全網黑名單', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0014',
    time: '2026-08-20 11:58:12 UTC',
    srcip: '10.88.88.103',
    srcHost: 'WS-CORP-ADMIN-03',
    srcUser: 'CORP\\DomainAdmin',
    dstip: '10.88.88.202',
    dstHost: 'DC-ActiveDirectory-01',
    action: 'Investigating',
    country: 'TW',
    threat: 'Golden Ticket (黃金票證) 偽造與 Pass-the-Hash 橫向移動侵入',
    risk: 'Critical',
    riskScore: 99,
    status: 'investigating',
    category: 'ueba',
    mitreTTP: 'T1558.001 Golden Ticket',
    mitreStage: 'Lateral Movement',
    affectedAssets: 5,
    confidence: 98,
    payloadHex: '4b 65 72 62 65 72 6f 73 20 54 47 54 20 46 6f 72 67 65 72 79 3a 20 6b 72 62 74 67 74 20 68 61 73 68 20 73 69 67 6e 61 74 75 72 65 20 6d 69 73 6d 61 74 63 68',
    rawLog: 'ActiveDirectory-EventID=4624: Logon Type=3 (Network) AuthPackage="Kerberos" Account="DomainAdmin" Elevated=True TGT_Lifetime=10_Years (Anomaly: Standard is 10 hours).',
    aiSummary: '偵測到具備 10 年超長有效期的異常 Kerberos TGT 票證，證實攻擊者已掌握 krbtgt 帳號雜湊並偽造黃金票證，可在網域內任意橫向移動且具備最高 Enterprise Admin 特權。此為最危急之全網淪陷指標。',
    recommendedPlaybooks: [
      { id: 'pb-1401', title: '雙重輪替 krbtgt 密碼金鑰 (Double Reset)', description: '執行微軟官方 KRBTGT 密碼重置腳本以使所有偽造票證即刻失效', type: 'revoke' },
      { id: 'pb-1402', title: '全網網域控制站安全稽核與阻斷', description: '切斷非管理員網段對 DC 之 RPC/SMB 存取埠', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0015',
    time: '2026-08-20 11:55:00 UTC',
    srcip: '10.88.88.109',
    srcHost: 'WS-AI-RESEARCH-01',
    srcUser: 'CORP\\sam_chen',
    dstip: '104.18.2.14',
    dstHost: 'api.openai.com',
    action: 'Blocked',
    country: 'US',
    threat: 'AI Gateway 動態機敏資料防護 (DLP)：阻斷核心原始碼與 API Key 外洩',
    risk: 'High',
    riskScore: 90,
    status: 'contained',
    category: 'exfil',
    mitreTTP: 'T1567 Exfiltration Over Web Service',
    mitreStage: 'Exfiltration',
    affectedAssets: 1,
    confidence: 95,
    payloadHex: '53 4b 2d 50 52 4f 4a 2d 39 38 61 61 63 38 66 62 65 30 31 39 32 38 34 31 39 38 31 32 63 61 00 66 75 6e 63 74 69 6f 6e 20 64 65 63 72 79 70 74 4b 65 79',
    rawLog: 'AI-GATEWAY-AUDIT: User "sam_chen" submitted prompt containing OpenAI API Key and 180 lines of proprietary C++ cryptEngine code. Policy "DLP_SECRET_BLOCK" triggered. Action=BLOCKED.',
    aiSummary: '企業內部員工嘗試將核心專案之私有加解密演算法原始碼與正式環境 OpenAI API Key 貼入外部 ChatGPT 進行除錯，已被 SEMOR AI Gateway 即時攔截並記錄違規日誌，未有任何資料送出至外部模型。',
    recommendedPlaybooks: [
      { id: 'pb-1501', title: '通知員工資安合規主管與告誡照會', description: '自動發送合規通知與教育訓練複習提示', type: 'notify' },
      { id: 'pb-1502', title: '即時吊銷外洩之 OpenAI API 金鑰', description: '於金鑰管理系統輪替該金鑰以防潛在風險', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0016',
    time: '2026-08-20 11:52:18 UTC',
    srcip: '198.51.100.89',
    dstip: '10.88.88.200',
    dstHost: 'Postgres-DB-Master',
    action: 'Blocked',
    country: 'NL',
    threat: 'Mirai 殭屍網路發動 TCP SYN 與 UDP 反射放大 DDoS 洪水攻擊',
    risk: 'High',
    riskScore: 85,
    status: 'contained',
    category: 'bruteforce',
    mitreTTP: 'T1498 Network Denial of Service',
    mitreStage: 'Recon',
    affectedAssets: 1,
    confidence: 93,
    payloadHex: '45 00 00 3c 1a 42 40 00 40 06 24 1b c6 33 64 59 0a 58 58 c8 d3 56 15 38 00 00 00 00 a0 02 72 10 39 21 00 00 02 04 05 b4 04 02 08 0a 01 23 45 67 00 00 00 00 01 03 03 07',
    rawLog: 'FIREWALL-FLOOD: Inbound SYN Flood detected on WAN-01 interface. PPS=180,000, Bandwidth=1.2Gbps from 4,200 unique source IPs. Geo distribution: NL, RU, VN. Syn-Cookie activated.',
    aiSummary: '邊界防火牆遭超過 4,200 個分散式受感染 IoT 節點發起高速 TCP SYN Flood 攻擊，試圖癱瘓資料庫 DMZ 入口。硬體 Syn-Proxy 與 BGP Anycast 流量清洗中心已自動生效，業務連線維持正常。',
    recommendedPlaybooks: [
      { id: 'pb-1601', title: '啟用電信級 BGP Anycast 雲端流量清洗', description: '將流量路由指向資安防禦清洗節點', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0017',
    time: '2026-08-20 11:49:33 UTC',
    srcip: '10.88.88.104',
    srcHost: 'WS-QA-TEST-04',
    srcUser: 'CORP\\qa_tester01',
    dstip: '10.88.88.202',
    dstHost: 'DC-ActiveDirectory-01',
    action: 'Active',
    country: 'TW',
    threat: 'BloodHound / SharpHound LDAP 高頻枚舉網域權限提升路徑',
    risk: 'Medium',
    riskScore: 78,
    status: 'active',
    category: 'ueba',
    mitreTTP: 'T1087.002 Domain Account',
    mitreStage: 'Recon',
    affectedAssets: 1,
    confidence: 91,
    payloadHex: '28 6f 62 6a 65 63 74 43 6c 61 73 73 3d 75 73 65 72 29 28 73 41 4d 41 63 63 6f 75 6e 74 54 79 70 65 3d 38 30 35 33 30 36 33 36 38 29 28 61 64 6d 69 6e 43 6f 75 6e 74 3d 31 29',
    rawLog: 'AD-HONEY-TOKEN: LDAP Search query filter="(&(objectClass=user)(adminCount=1))" executed with High Volume (3,400 queries/min). Matched SharpHound reconnaissance pattern.',
    aiSummary: '測試網段主機遭執行 SharpHound 工具，透過 LDAP 高頻查詢 Active Directory 內所有具備 adminCount=1 特權帳號、本機管理員群組關係與 GPO 存取控制清單，為攻擊者繪製網域提權攻擊路徑。',
    recommendedPlaybooks: [
      { id: 'pb-1701', title: '限制一般工作站 LDAP 批量查詢權限', description: '阻斷一般帳號對 Active Directory 進行無限制遍歷', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0018',
    time: '2026-08-20 11:46:15 UTC',
    srcip: '10.99.10.88',
    srcHost: 'UNKNOWN-ROGUE-DEVICE',
    dstip: '10.99.10.150',
    dstHost: 'POWER-GRID-SUBSTATION-02',
    action: 'Blocked',
    country: 'TW',
    threat: 'DNP3 智慧電網通訊廣播注入：試圖覆寫高壓變電所遙控開關',
    risk: 'Critical',
    riskScore: 95,
    status: 'active',
    category: 'ics',
    mitreTTP: 'T0836 Modify Parameter',
    mitreStage: 'Lateral Movement',
    affectedAssets: 2,
    confidence: 98,
    payloadHex: '05 64 0a 04 00 00 00 01 00 04 0c 01 28 01 00 01 00 01 01 00',
    rawLog: 'OT-FIREWALL: DNP3 Function Code 0x0C (Direct Operate) targeted at Substation Circuit Breaker #4. Source MAC not found in industrial asset whitelist. Packet DROPPED.',
    aiSummary: '電力變電站網段截獲未經白名單許可之流氓硬體設備，向關鍵高壓斷路器發送 DNP3 Direct Operate (0x0C) 遙控跳脫指令。OT 工控防火牆已即時丟棄該封包，避免可能造成之局部跳電事故。',
    recommendedPlaybooks: [
      { id: 'pb-1801', title: '阻斷該物理端口與通知廠區警衛', description: '在工業交換器關閉對應端口並派員現場排查', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0019',
    time: '2026-08-20 11:43:02 UTC',
    srcip: '10.88.88.110',
    srcHost: 'WS-EXEC-BOARD-01',
    srcUser: 'CORP\\ceo_assistant',
    dstip: '194.26.29.114',
    dstHost: 'evil-dll-update.ru',
    action: 'Contained',
    country: 'RU',
    threat: 'DLL Side-Loading (側載) 劫持合法微軟簽名程序執行惡意 Payload',
    risk: 'High',
    riskScore: 88,
    status: 'contained',
    category: 'apt',
    cve: 'CVE-2023-38831',
    mitreTTP: 'T1574.002 DLL Side-Loading',
    mitreStage: 'Initial Access',
    affectedAssets: 1,
    confidence: 94,
    payloadHex: '4d 5a 90 00 03 00 00 00 04 00 00 00 ff ff 00 00 b8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00',
    rawLog: 'EDR-ALERT: Legitimate binary "calc.exe" loaded unauthorized untrusted DLL "winmm.dll" located in "C:\\Users\\ceo_assistant\\Downloads\\Document.zip\\winmm.dll". Threat intercepted.',
    aiSummary: '高階主管助理工作站開啟釣魚郵件夾帶之 ZIP 壓縮檔，觸發 DLL 側載漏洞，使具備微軟官方數位簽章之合法程式在啟動時自動載入惡意木馬 DLL。EDR 行為攔截模組已及時終止程序並銷毀惡意二進位檔。',
    recommendedPlaybooks: [
      { id: 'pb-1901', title: '隔離工作站與重置助理帳號憑證', description: '實施主機隔離並清查同封釣魚郵件之其他收件者', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0020',
    time: '2026-08-20 11:40:20 UTC',
    srcip: '203.0.113.45',
    srcUser: 'arn:aws:iam::363820011725:role/DevSecOps-Deployer',
    dstip: '169.254.169.254',
    dstHost: 'AWS-Metadata-Service',
    action: 'Blocked',
    country: 'US',
    threat: 'AWS IMDSv1 執行個體中繼資料服務遭 SSRF 滲透並竊取 IAM Role 臨時金鑰',
    risk: 'High',
    riskScore: 92,
    status: 'active',
    category: 'ueba',
    mitreTTP: 'T1552.005 Cloud Instance Metadata API',
    mitreStage: 'Privilege Escalation',
    affectedAssets: 2,
    confidence: 96,
    payloadHex: '47 45 54 20 2f 6c 61 74 65 73 74 2f 6d 65 74 61 2d 64 61 74 61 2f 69 61 6d 2f 73 65 63 75 72 69 74 79 2d 63 72 65 64 65 6e 74 69 61 6c 73 2f 20 48 54 54 50 2f 31 2e 31',
    rawLog: 'CLOUDTRAIL: eventSource="sts.amazonaws.com" eventName="AssumeRole" sourceIP="203.0.113.45" anomaly="EC2 instance role used from external non-AWS IP address". GuardDuty Alert: IAMUser/InstanceCredentialExfiltration.OutsideAWS.',
    aiSummary: 'AWS 雲端環境偵測到 EC2 執行個體之 IAM 臨時憑證在境外未授權公網 IP 203.0.113.45 被調用，證實 Web 伺服器遭受 SSRF 漏洞讀取 `http://169.254.169.254` (IMDSv1) 取得金鑰。AWS GuardDuty 與 SEMOR SOAR 已自動附加拒絕策略廢除該金鑰。',
    recommendedPlaybooks: [
      { id: 'pb-2001', title: '強制啟用 IMDSv2 (Token Required)', description: '在所有 EC2 實例強制設定 HttpTokens=required', type: 'revoke' },
      { id: 'pb-2002', title: '吊銷當前 IAM Role 臨時 Session', description: '於 AWS IAM 控制台附加 Explicit Deny 策略終止連線', type: 'revoke' }
    ]
  }
];

export interface OverviewIncidentRecord {
  id: string;
  time: string;
  threatZh: string;
  threatEn: string;
  categoryZh: string;
  categoryEn: string;
  srcIp: string;
  destIp: string;
  host: string;
  countryZh: string;
  countryEn: string;
  actionZh: string;
  actionEn: string;
  risk: 'Critical' | 'High' | 'Medium';
  mitreTactic: string;
  soarStatus: 'Auto-Contained' | 'In-Progress' | 'Pending-Approval' | 'Resolved';
  iocHash?: string;
  affectedAssets: string[];
  riskScore?: number;
  payloadHex?: string;
  rawLog?: string;
  aiSummary?: string;
  confidence?: number;
  cve?: string;
}

const THREAT_EN_MAP: Record<string, string> = {
  'INC-2026-0001': 'LockBit 3.0 Ransomware Volume Shadow Wipe & Mass Encryption',
  'INC-2026-0002': 'Domain Controller LSASS Memory Dump & Mimikatz Hash Extraction',
  'INC-2026-0003': 'Cobalt Strike 4.9 Malleable HTTPS Reverse Beacon Channel Established',
  'INC-2026-0004': 'Volt Typhoon Nation-State LotL Reverse Proxy Perimeter Infiltration',
  'INC-2026-0005': 'LummaC2 InfoStealer Exfiltrating Browser Credentials & Crypto Wallets',
  'INC-2026-0006': 'ICS SCADA Modbus TCP Unauthorized Function 0x05 Coil Override',
  'INC-2026-0007': 'Botnet Distributed SSH Dictionary Brute-Force & Honeypot Interception',
  'INC-2026-0008': 'SQL Injection UNION SELECT Targeting Core Customer PII Database',
  'INC-2026-0009': 'Kerberoasting Offline Hash Attack: Malicious SPN RC4 Ticket Requests',
  'INC-2026-0010': 'Kubernetes Unauthorized Privileged Container & HostPID Breakout',
  'INC-2026-0011': 'Siemens S7comm Plus Unauthorized Firmware & Ladder Logic Overwrite',
  'INC-2026-0012': 'Cloud Admin Impossible Travel Anomaly & MFA Fatigue Spamming',
  'INC-2026-0013': 'High-Entropy DNS Tunneling Covert Channel Exfiltrating Proprietary Source Code',
  'INC-2026-0014': 'Forged Kerberos Golden Ticket & Pass-the-Hash Lateral Movement',
  'INC-2026-0015': 'AI Gateway Dynamic DLP: Intercepted Core Source Code & API Keys',
  'INC-2026-0016': 'Mirai Botnet High-Volume TCP SYN & UDP Reflection DDoS Flood',
  'INC-2026-0017': 'BloodHound / SharpHound High-Frequency LDAP Domain Reconnaissance',
  'INC-2026-0018': 'DNP3 Smart Grid Broadcast Injection: Substation Remote Breaker Override',
  'INC-2026-0019': 'DLL Side-Loading Hijacking Signed Microsoft Process for Malicious Execution',
  'INC-2026-0020': 'AWS IMDSv1 SSRF Exploitation & Exfiltration of Temporary IAM Role Credentials'
};

const CATEGORY_MAP: Record<string, { zh: string; en: string }> = {
  apt: { zh: '進階持續性威脅 (APT)', en: 'Advanced Persistent Threat' },
  ics: { zh: '工控物聯網安全 (ICS/SCADA)', en: 'ICS/OT & SCADA Threat' },
  c2: { zh: '命令與控制通訊 (C2)', en: 'Command & Control' },
  ueba: { zh: '使用者異常行為分析 (UEBA)', en: 'UEBA & Insider Threat' },
  bruteforce: { zh: '憑證與暴力破解 (Brute-force)', en: 'Credential Brute-Force' },
  exfil: { zh: '機密數據外洩竊取 (Exfil)', en: 'Data Exfiltration' }
};

const COUNTRY_MAP: Record<string, { zh: string; en: string }> = {
  RU: { zh: '俄羅斯 (RU)', en: 'Russia (RU)' },
  CN: { zh: '中國 (CN)', en: 'China (CN)' },
  US: { zh: '美國 (US)', en: 'United States (US)' },
  TW: { zh: '台灣 (TW)', en: 'Taiwan (TW)' },
  UA: { zh: '烏克蘭 (UA)', en: 'Ukraine (UA)' },
  NL: { zh: '荷蘭 (NL)', en: 'Netherlands (NL)' },
  DE: { zh: '德國 (DE)', en: 'Germany (DE)' },
  IR: { zh: '伊朗 (IR)', en: 'Iran (IR)' },
  BR: { zh: '巴西 (BR)', en: 'Brazil (BR)' },
  NG: { zh: '奈及利亞 (NG)', en: 'Nigeria (NG)' }
};

const SOAR_STATUS_MAP: Record<string, 'Auto-Contained' | 'In-Progress' | 'Pending-Approval' | 'Resolved'> = {
  contained: 'Auto-Contained',
  investigating: 'In-Progress',
  active: 'Pending-Approval',
  resolved: 'Resolved'
};

const ACTION_MAP: Record<string, { zh: string; en: string }> = {
  Contained: { zh: '已執行微隔離與封鎖', en: 'Auto-Contained' },
  Investigating: { zh: '資安團隊深入調查中', en: 'Under Investigation' },
  Blocked: { zh: '邊界防火牆攔截阻絕', en: 'Firewall Blocked' },
  Active: { zh: '待處置通報告警', en: 'Pending Containment' },
  Isolated: { zh: '主機微隔離中', en: 'Micro-Isolated' }
};

export function mapIncidentItemToOverviewRecord(item: CriticalIncidentItem): OverviewIncidentRecord {
  const cat = CATEGORY_MAP[item.category] || { zh: item.category.toUpperCase(), en: item.category.toUpperCase() };
  const country = COUNTRY_MAP[item.country] || { zh: item.country, en: item.country };
  const action = ACTION_MAP[item.action] || { zh: item.action, en: item.action };
  const soarStatus = SOAR_STATUS_MAP[item.status] || 'In-Progress';

  const hostName = item.srcHost || item.dstHost || (item.srcip.startsWith('10.') ? `Host-${item.srcip.replace(/\./g, '-')}` : `Target-Asset-${item.dstip.replace(/\./g, '-')}`);

  const assets: string[] = [];
  if (item.srcHost) assets.push(item.srcHost);
  if (item.dstHost && item.dstHost !== item.srcHost) assets.push(item.dstHost);
  if (assets.length === 0) {
    assets.push(item.srcip, item.dstip);
  }

  return {
    id: item.id,
    time: item.time,
    threatZh: item.threat,
    threatEn: THREAT_EN_MAP[item.id] || item.threat,
    categoryZh: cat.zh,
    categoryEn: cat.en,
    srcIp: item.srcip,
    destIp: item.dstip,
    host: hostName,
    countryZh: country.zh,
    countryEn: country.en,
    actionZh: action.zh,
    actionEn: action.en,
    risk: item.risk,
    mitreTactic: item.mitreTTP,
    soarStatus,
    iocHash: item.payloadHex ? item.payloadHex.substring(0, 32).replace(/\s/g, '') : undefined,
    affectedAssets: assets,
    riskScore: item.riskScore,
    payloadHex: item.payloadHex,
    rawLog: item.rawLog,
    aiSummary: item.aiSummary,
    confidence: item.confidence,
    cve: item.cve
  };
}

export const OVERVIEW_DEMO_CRITICAL_INCIDENTS: OverviewIncidentRecord[] = DEMO_CRITICAL_INCIDENTS.map(mapIncidentItemToOverviewRecord);


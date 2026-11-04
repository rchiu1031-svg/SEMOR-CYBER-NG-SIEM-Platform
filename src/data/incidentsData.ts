// High-Fidelity Critical Incidents Dataset (20 Real-World Security Incidents for Demo)
// Conforms to SEMOR CYBER SOC correlation schema, MITRE ATT&CK for Enterprise & ICS, STIX 2.1,
// and real-world Syslog (RFC 5424/3164), Windows Security Event Logs (XML), and NetFlow/IPFIX/Zeek formats.

export type TelemetryCategory = 'SYS_LOG' | 'EVENT_LOG' | 'FLOW_LOG';

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
  mitreStage: 'Recon' | 'Initial Access' | 'Privilege Escalation' | 'Lateral Movement' | 'Exfiltration' | 'Credential Access' | 'Command and Control' | 'Defense Evasion' | 'Impact';
  affectedAssets: number;
  confidence: number;
  payloadHex: string;
  rawLog: string;
  aiSummary: string;
  logType: TelemetryCategory;
  logFormat: string;
  eventId?: string | number;
  recommendedPlaybooks: PlaybookItem[];
  notes?: IncidentNote[];
  history?: IncidentHistoryItem[];
}

export const DEMO_CRITICAL_INCIDENTS: CriticalIncidentItem[] = [
  {
    id: 'INC-2026-0001',
    time: '2026-11-02 14:24:08 UTC',
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
    logType: 'EVENT_LOG',
    logFormat: 'Sysmon XML',
    eventId: 1,
    rawLog: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Sysmon"/><EventID>1</EventID><TimeCreated SystemTime="2026-11-02T14:24:08.512Z"/><EventRecordID>819203</EventRecordID><Computer>WS-FINANCE-TAIPEI-02.corp.semor.com</Computer></System><EventData><Data Name="RuleName">technique_id=T1490,technique_name=Inhibit System Recovery</Data><Data Name="Image">C:\\Windows\\System32\\vssadmin.exe</Data><Data Name="CommandLine">vssadmin.exe delete shadows /all /quiet</Data><Data Name="ParentImage">C:\\Users\\eva_lin\\Downloads\\LockBit3_Loader.exe</Data><Data Name="User">CORP\\eva_lin</Data><Data Name="Hashes">SHA256=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</Data></EventData></Event>',
    aiSummary: '財務部工作站遭 LockBit 3.0 勒索惡意程式入侵，嘗試調用 vssadmin 銷毀 Windows 系統磁碟陰影備份並進行 IOCP 多執行緒加密。EDR 與 SEMOR SOC 聯防模組已於 4 秒內實施端點微隔離並阻斷其 Tor C2 通訊。',
    recommendedPlaybooks: [
      { id: 'pb-101', title: '主機微隔離與 EDR 網路遏止', description: '透過 EDR 下發實體網路遏止命令，僅允許 SIEM 管理連線', type: 'isolate' },
      { id: 'pb-102', title: '全網防火牆黑名單封鎖 C2 節點', description: '向邊界 Palo Alto 防火牆推播 185.220.101.45 永久阻斷策略', type: 'block' },
      { id: 'pb-103', title: '通報財務長與啟動異地備份復原', description: '發送加密威脅通報至 SOC 應變小組與備份儲存庫防護節點', type: 'notify' }
    ],
    notes: [
      { id: 'note-1', author: 'SOC Lead Alex', timestamp: '14:25:30', content: '已確認主機網路已隔離，檔案加密行為已終止，未擴散至 File Server。' }
    ],
    history: [
      { timestamp: '14:24:08', action: 'INCIDENT_CREATED', operator: 'SEMOR Engine', details: '觸發高嚴重性勒索軟體規則' },
      { timestamp: '14:24:12', action: 'AUTO_ISOLATED', operator: 'SOAR Playbook', details: '主機 WS-FINANCE-TAIPEI-02 網路隔離完畢' }
    ]
  },
  {
    id: 'INC-2026-0002',
    time: '2026-11-02 14:23:45 UTC',
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
    logType: 'EVENT_LOG',
    logFormat: 'Sysmon XML',
    eventId: 10,
    rawLog: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Sysmon"/><EventID>10</EventID><TimeCreated SystemTime="2026-11-02T14:23:45.004Z"/><EventRecordID>921402</EventRecordID><Computer>DC-ActiveDirectory-01.corp.semor.com</Computer></System><EventData><Data Name="RuleName">technique_id=T1003.001,technique_name=LSASS Memory</Data><Data Name="SourceProcessId">7812</Data><Data Name="SourceImage">C:\\Windows\\Temp\\procdump64.exe</Data><Data Name="TargetProcessId">684</Data><Data Name="TargetImage">C:\\Windows\\System32\\lsass.exe</Data><Data Name="GrantedAccess">0x1010</Data><Data Name="CallTrace">C:\\Windows\\System32\\ntdll.dll+9cb44|C:\\Windows\\Temp\\procdump64.exe+2014</Data></EventData></Event>',
    aiSummary: '網域控制站 (DC-ActiveDirectory-01) 遭未授權程序 procdump64.exe 請求開啟 lsass.exe 具備 0x1010 (PROCESS_VM_READ) 特權句柄，試圖提取 Active Directory 網域管理員之 NTLM 與 Kerberos 憑證，行為已被核心防護驅動強制攔截。',
    recommendedPlaybooks: [
      { id: 'pb-201', title: '緊急撤銷受影響網域特權帳號', description: '輪替 krbtgt 帳號金鑰並強迫所有 Domain Admins 重新登入', type: 'revoke' },
      { id: 'pb-202', title: '記憶體鑑識 Dump 與分析', description: '保留當前主機記憶體揮發性證據映像檔供數位鑑識使用', type: 'dump' }
    ]
  },
  {
    id: 'INC-2026-0003',
    time: '2026-11-02 14:22:30 UTC',
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
    logType: 'FLOW_LOG',
    logFormat: 'Zeek conn.log',
    rawLog: 'ts:1730557350.12 uid:"C6xQ821vK99m" id.orig_h:"10.88.88.102" id.orig_p:49822 id.resp_h:"45.142.214.88" id.resp_p:443 proto:"tcp" service:"ssl" duration:18.42 orig_bytes:4120 resp_bytes:8940 conn_state:"SF" local_orig:T local_resp:F missed_bytes:0 history:"ShADadFf" ja3="e7d705a3286e19ea42f587b344ee6865"',
    aiSummary: '檢測到內網主機正與德國 Bulletproof 主機 45.142.214.88 進行週期性高熵值 TLS 443 封包交換，符合 Cobalt Strike Malleable HTTPS Beacon 特徵，JA3 指紋與已知 Red Team 威脅資料庫完全相符。',
    recommendedPlaybooks: [
      { id: 'pb-301', title: '邊界防火牆下發 IP/JA3 黑名單', description: '立即封鎖 45.142.214.88 與 TLS JA3 指紋連線', type: 'block' },
      { id: 'pb-302', title: '受感染端點隔離與進程終止', description: '對端點 SOC-Analyst-WS02 下發程序強制中斷', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0004',
    time: '2026-11-02 14:20:15 UTC',
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
    logType: 'FLOW_LOG',
    logFormat: 'IPFIX',
    rawLog: 'FLOW-IPFIX: export_time=2026-11-02T14:20:15Z obs_domain=1 template_id=256 src_ip=10.88.88.254 src_port=49152 dst_ip=194.26.29.114 dst_port=443 protocol=6 octetDeltaCount=14820000 packetDeltaCount=12400 flowStartSysUpTime=492010 flowEndSysUpTime=493250 tcpControlBits=0x18 router_id=Catalyst-9500-Core',
    aiSummary: '核心交換器 IPFIX 串流抓取到持續向荷蘭中繼主機傳送反向 WebSocket 封裝流量，其行為特徵高度符合 Volt Typhoon 針對關鍵基礎設施之 Living-off-the-Land (LotL) 隱蔽通道建立手法。',
    recommendedPlaybooks: [
      { id: 'pb-401', title: '切斷邊界網路中繼通道', description: '將 194.26.29.114 與關聯網域加入全域防火牆阻斷清單', type: 'block' },
      { id: 'pb-402', title: '更新邊界網路設備韌體與憑證', description: '清查 VPN 閘道器與網路交換設備組態完整性', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0005',
    time: '2026-11-02 14:18:40 UTC',
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
    logType: 'SYS_LOG',
    logFormat: 'RFC-5424',
    rawLog: '<189>1 2026-11-02T14:18:40.412Z FGT-CORP-TPE ipsengine - - - date=2026-11-02 time=14:18:40 devname="FGT-CORP-TPE" devid="FG200ETK18001248" type="utm" subtype="ips" level="alert" severity="critical" srcip=10.88.88.105 dstip=104.21.32.18 srcport=51240 dstport=443 sessionid=492108 policyid=22 action="drop" attack="LummaC2.Stealer.Exfil" msg="IPS: LummaC2 InfoStealer memory extract drop"',
    aiSummary: '研發部主機遭遇 LummaC2 二進位動態函式庫竊密木馬，透過 Windows DPAPI 解密本機 Chrome/Edge 密碼庫與 MetaMask 錢包擴充外掛，並打包 ZIP 試圖外傳至 104.21.32.18。流量已被即時攔截。',
    recommendedPlaybooks: [
      { id: 'pb-501', title: '強制登出並撤銷開發者企業 SSO 憑證', description: '在 Okta/Azure AD 立即強制撤銷 Session 及刷新密碼', type: 'revoke' },
      { id: 'pb-502', title: '主機實體隔離與防毒全盤查殺', description: '透過 EDR 下發主機隔離與完整特徵碼深度掃描', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0006',
    time: '2026-11-02 14:16:10 UTC',
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
    logType: 'SYS_LOG',
    logFormat: 'RFC-5424',
    rawLog: '<131>1 2026-11-02T14:16:10.014Z scada-gw-water01 modbus-dpi 920 - [modbus@50201 rule="5021" function="0x05" coil_addr="0x0004" value="0xFF00"] MODBUS-DPI: [RULE 5021] UNAUTHORIZED_COIL_WRITE src=10.99.10.45 dst=10.99.10.200:502 function=0x05 coil_addr=0x0004 data=0xFF00 action=DROP severity=CRITICAL target="Emergency_Relief_Valve_04"',
    aiSummary: 'OT 水廠控制網段偵測到非例行維護時段之 Modbus TCP Function 0x05 寫入指令，試圖強制將關鍵冷卻水安全洩壓閥線圈設定為 0xFF00 (開啟)，已由 OT 專用 Deep Packet Inspection (DPI) 模組阻斷。',
    recommendedPlaybooks: [
      { id: 'pb-601', title: '切換 PLC 至本地硬體鎖定 (Run Only)', description: '通知現場 OT 工控工程師將 PLC 轉為本機物理保護模式', type: 'notify' },
      { id: 'pb-602', title: '隔離 HMI 操作員工作站', description: '關閉操作員站台至 PLC 網段之網路路由通訊埠', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0007',
    time: '2026-11-02 14:14:22 UTC',
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
    logType: 'SYS_LOG',
    logFormat: 'RFC-3164',
    rawLog: '<85>Nov  2 14:14:22 DMZ-Bastion-01 sshd[49210]: Failed password for invalid user admin from 45.33.22.11 port 52140 ssh2: maximum authentication attempts exceeded [preauth]',
    aiSummary: '外部公網 IP 45.33.22.11 發動高頻率 SSH 自動化憑證爆破，已被 SEMOR 欺敵蜜罐成功誘捕並錄製所有攻擊載荷，系統已自動將其 IP 與關聯 C 段網段同步推播至邊界阻斷策略。',
    recommendedPlaybooks: [
      { id: 'pb-701', title: '動態黑名單邊界下發', description: '向所有對外防火牆同步更新 45.33.22.0/24 封鎖名單', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0008',
    time: '2026-11-02 14:12:05 UTC',
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
    logType: 'SYS_LOG',
    logFormat: 'RFC-5424',
    rawLog: '<134>1 2026-11-02T14:12:05.312Z alb-nginx-waf01.internal nginx-modsec 1420 - [waf@32473 id="942100" severity="CRITICAL" client="185.191.171.3"] 185.191.171.3 - - [02/Nov/2026:14:12:05 +0000] "GET /api/v1/customers?id=1%20UNION%20SELECT%20password_hash%20FROM%20admin_credentials HTTP/1.1" 403 162 "-" "sqlmap/1.7.2#stable" ModSecurity: Access denied with code 403 (phase 2). Pattern match "UNION SELECT" at ARGS:id.',
    aiSummary: 'Web 應用程式防火牆 (WAF) 攔截到來自荷蘭 IP 的 SQL 注入攻擊載荷，攻擊者試圖透過 UNION SELECT 語法批次提取 admin_credentials 帳號密碼雜湊，WAF 已強制回傳 HTTP 403 並凍結其連線。',
    recommendedPlaybooks: [
      { id: 'pb-801', title: 'WAF 封鎖攻擊者 IP 與特徵規則更新', description: '將來源 IP 加入 Cloudflare / Nginx 永久封鎖清單', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0009',
    time: '2026-11-02 14:10:18 UTC',
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
    mitreStage: 'Credential Access',
    affectedAssets: 2,
    confidence: 93,
    payloadHex: '6b 65 72 62 65 72 6f 73 2d 74 67 73 2d 72 65 71 20 73 70 6e 3d 4d 53 53 51 4c 53 76 63 2f 73 71 6c 2d 70 72 6f 64 2e 63 6f 72 70 2e 73 65 6d 6f 72 2e 63 6f 6d 20 65 74 79 70 65 3d 30 78 31 37',
    logType: 'EVENT_LOG',
    logFormat: 'Windows XML',
    eventId: 4769,
    rawLog: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>4769</EventID><TimeCreated SystemTime="2026-11-02T14:10:18.420Z"/><EventRecordID>4982199</EventRecordID><Computer>DC-ActiveDirectory-01.corp.semor.com</Computer></System><EventData><Data Name="TargetUserName">MSSQLSvc/sql-prod-cluster.corp.semor.com:1433</Data><Data Name="ServiceName">MSSQLSvc</Data><Data Name="TicketOptions">0x40810000</Data><Data Name="TicketEncryptionType">0x17</Data><Data Name="Status">0x0</Data><Data Name="IpAddress">::ffff:10.88.88.102</Data><Data Name="IpPort">54192</Data></EventData></Event>',
    aiSummary: '網域稽核日誌產生大量 EventID 4769 記錄，端點 SOC-Analyst-WS02 短時間內針對多個高權限服務 SPN 請求 RC4 加密（TicketEncryptionType 0x17）之 Kerberos TGS 票證，以進行離線 hashcat 破解。',
    recommendedPlaybooks: [
      { id: 'pb-901', title: '停用 RC4 加密並強制切換 AES-256', description: '群組原則 (GPO) 強制啟用 Kerberos AES128/AES256 驗證', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0010',
    time: '2026-11-02 14:05:40 UTC',
    srcip: '10.88.88.201',
    srcHost: 'App-Kubernetes-Master',
    srcUser: 'system:serviceaccount:default:token',
    dstip: '10.88.88.201',
    dstHost: 'App-Kubernetes-Master',
    action: 'Contained',
    country: 'TW',
    threat: 'Kubernetes 叢集未授權特權容器建立與 HostPID 容器逃逸',
    risk: 'Critical',
    riskScore: 97,
    status: 'contained',
    category: 'apt',
    cve: 'CVE-2024-21626',
    mitreTTP: 'T1611 Escape to Host',
    mitreStage: 'Privilege Escalation',
    affectedAssets: 3,
    confidence: 97,
    payloadHex: '7b 22 73 70 65 63 22 3a 7b 22 68 6f 73 74 50 49 44 22 3a 74 72 75 65 2c 22 68 6f 73 74 4e 65 74 77 6f 72 6b 22 3a 74 72 75 65 2c 22 63 6f 6e 74 61 69 6e 65 72 73 22 3a 5b 7b 22 73 65 63 75 72 69 74 79 43 6f 6e 74 65 78 74 22 3a 7b 22 70 72 69 76 69 6c 65 67 65 64 22 3a 74 72 75 65 7d 7d 5d 7d 7d',
    logType: 'SYS_LOG',
    logFormat: 'RFC-5424',
    rawLog: '<134>1 2026-11-02T14:10:15.912Z k8s-master-node01 auditd 1420 - [audit@32473 arch="c000003e" syscall="2" success="yes" exit="3" ppid="1420" pid="8941" auid="1001" uid="0" gid="0"] type=SYSCALL msg=audit(1730556615.912:842): arch=c000003e syscall=2 success=yes exit=3 a0=7ffd12 a1=241 a2=1b6 items=1 ppid=1420 pid=8941 auid=1001 uid=0 gid=0 euid=0 tty=pts0 comm="bash" exe="/bin/bash" name="/etc/cron.d/backdoor"',
    aiSummary: 'Kube-Audit 與 Falco 偵測到命名空間中被提交帶有 `hostPID: true` 與 `privileged: true` 之 Pod 定義，攻擊者正嘗試利用 runc 漏洞 (CVE-2024-21626) 實施容器逃逸並取得宿主機器 root shell。準入控制器已拒絕建立並排擠節點。',
    recommendedPlaybooks: [
      { id: 'pb-1001', title: 'Pod 刪除與節點暫停排程 (Cordon)', description: '即刻終止異常 Pod 並執行 Kubernetes 節點 Drain 與 Cordon', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0011',
    time: '2026-11-02 14:02:15 UTC',
    srcip: '10.99.20.14',
    srcHost: 'OT-ENGINEERING-STATION',
    srcUser: 'eng_admin',
    dstip: '10.99.20.10',
    dstHost: 'SIEMENS-S7-1500-PLC',
    action: 'Blocked',
    country: 'TW',
    threat: 'Siemens S7comm Plus 協定未經授權惡意韌體與 Logic 程式碼覆寫',
    risk: 'Critical',
    riskScore: 96,
    status: 'investigating',
    category: 'ics',
    mitreTTP: 'T0843 Program Download',
    mitreStage: 'Initial Access',
    affectedAssets: 2,
    confidence: 95,
    payloadHex: '72 02 00 3c 32 01 00 00 00 01 00 1a 00 00 1a 00 00 00 01 12 04 11 44 01 00 00 00 00 00 00 4f 42 31 5f 4d 41 49 4e',
    logType: 'SYS_LOG',
    logFormat: 'RFC-5424',
    rawLog: '<131>1 2026-11-02T14:08:30.120Z scada-sensor-s7 s7comm-dpi 410 - [s7@10201 pdu="0x01" func="0x1a" block="OB1_MAIN"] S7COMM-DPI: [RULE 1024] UNAUTHORIZED_BLOCK_DOWNLOAD src=10.99.20.14 dst=10.99.20.10:102 pdu_type=Job func=Upload/Download block_type=OB block_num=1 action=DROP severity=CRITICAL',
    aiSummary: '工業製造廠區 OT 深度封包檢測模組偵測到非例行換線時段之 Siemens S7comm Plus 區塊下載請求，攻擊者試圖覆寫 PLC 之 OB1 主迴圈邏輯代碼，流量已被 OT 邊界防禦設備實體中斷。',
    recommendedPlaybooks: [
      { id: 'pb-1101', title: '物理切換 PLC 防寫開關', description: '通知廠長實體切換 S7-1500 硬體至 STOP 模式比對 Hash', type: 'notify' }
    ]
  },
  {
    id: 'INC-2026-0012',
    time: '2026-11-02 13:58:30 UTC',
    srcip: '185.220.101.99',
    srcUser: 'admin_david@semor.corp',
    dstip: '10.88.88.203',
    dstHost: 'IdP-Okta-SSO-Gateway',
    action: 'Blocked',
    country: 'DE',
    threat: '雲端管理員跨洲極限不可能旅遊 (Impossible Travel) 與 MFA 疲勞轟炸',
    risk: 'High',
    riskScore: 92,
    status: 'contained',
    category: 'ueba',
    mitreTTP: 'T1078.004 Cloud Accounts',
    mitreStage: 'Initial Access',
    affectedAssets: 1,
    confidence: 96,
    payloadHex: '7b 22 61 75 74 68 5f 74 79 70 65 22 3a 22 50 75 73 68 4e 6f 74 69 66 69 63 61 74 69 6f 6e 22 2c 22 70 72 6f 6d 70 74 5f 63 6f 75 6e 74 22 3a 32 38 7d',
    logType: 'EVENT_LOG',
    logFormat: 'CloudTrail',
    rawLog: '{"actor":{"alternateId":"admin_david@semor.corp"},"client":{"geographicalContext":{"city":"Frankfurt","country":"Germany"},"ipAddress":"185.220.101.99"},"eventType":"user.session.start","outcome":{"result":"DENY","reason":"RISK_POLICY_IMPOSSIBLE_TRAVEL"},"debugContext":{"debugData":{"riskScore":"92","spamMfaCount":"28"}}}',
    aiSummary: 'UEBA 機器學習模型偵測到特權管理員帳號在 4 分鐘內自台北 (10.88.88.100) 突跳至德國法蘭克福 (185.220.101.99) 發起登入，並觸發連續 28 次 MFA Push 疲勞轟炸，身分引擎已自動凍結 Session。',
    recommendedPlaybooks: [
      { id: 'pb-1201', title: '重置管理員密碼並撤銷所有 Refresh Token', description: '強制撤銷管理員在 Google Workspace 與 AWS 之所有 Session', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0013',
    time: '2026-11-02 13:52:10 UTC',
    srcip: '10.88.88.107',
    srcHost: 'WS-RND-LAB-01',
    dstip: '8.8.8.8',
    dstHost: 'dns-google-resolver',
    action: 'Blocked',
    country: 'US',
    threat: '高頻高熵 DNS Tunneling 隱蔽通道試圖外洩企業機密原始碼',
    risk: 'Critical',
    riskScore: 94,
    status: 'contained',
    category: 'exfil',
    mitreTTP: 'T1071.004 DNS',
    mitreStage: 'Exfiltration',
    affectedAssets: 1,
    confidence: 95,
    payloadHex: '30 78 37 66 39 38 20 61 38 66 31 39 63 61 38 31 62 39 30 32 34 38 66 2e 73 72 63 2d 65 78 66 69 6c 2e 62 61 64 64 6e 73 2e 6e 65 74 20 49 4e 20 54 58 54',
    logType: 'EVENT_LOG',
    logFormat: 'Sysmon XML',
    eventId: 22,
    rawLog: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Sysmon"/><EventID>22</EventID><TimeCreated SystemTime="2026-11-02T14:45:00.012Z"/><EventRecordID>642109</EventRecordID><Computer>WS-RND-LAB-01.corp.semor.com</Computer></System><EventData><Data Name="RuleName">technique_id=T1071.004,technique_name=DNS Tunneling</Data><Data Name="ProcessId">4912</Data><Data Name="QueryName">a8f19ca81b90248f.src-exfil.baddns.net</Data><Data Name="QueryStatus">0</Data><Data Name="QueryResults">type: 16 ::ffff:198.51.100.1</Data><Data Name="Image">C:\\Windows\\System32\\nslookup.exe</Data></EventData></Event>',
    aiSummary: 'DNS 防護感測器記錄到端點在 60 秒內發出超過 1,200 次長度大於 180 字元之高熵 TXT 子網域查詢，判定為 Iodine/Cobalt Strike DNS 穿透外洩隧道，RPZ 防護已啟動 Sinkhole 攔截。',
    recommendedPlaybooks: [
      { id: 'pb-1301', title: 'RPZ Sinkhole 與主機微隔離', description: 'DNS 伺服器啟動惡意網域 Sinkhole 並將該端點移入安全隔離網段', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0014',
    time: '2026-11-02 13:48:05 UTC',
    srcip: '10.88.88.102',
    srcHost: 'SOC-Analyst-WS02',
    srcUser: 'CORP\\krbtgt_admin',
    dstip: '10.88.88.202',
    dstHost: 'DC-ActiveDirectory-01',
    action: 'Investigating',
    country: 'TW',
    threat: 'Golden Ticket (黃金票證) 偽造與 Pass-the-Hash 橫向移動侵入',
    risk: 'Critical',
    riskScore: 98,
    status: 'investigating',
    category: 'apt',
    cve: 'CVE-2021-42287',
    mitreTTP: 'T1558.001 Golden Ticket',
    mitreStage: 'Lateral Movement',
    affectedAssets: 2,
    confidence: 96,
    payloadHex: '6b 65 72 62 65 72 6f 73 2d 74 67 74 20 66 6f 72 67 65 64 20 6b 72 62 74 67 74 20 6c 69 66 65 74 69 6d 65 3d 31 30 79 72 73 20 73 69 64 2d 35 30 30',
    logType: 'EVENT_LOG',
    logFormat: 'Windows XML',
    eventId: 4624,
    rawLog: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>4624</EventID><TimeCreated SystemTime="2026-11-02T14:38:20.120Z"/><Computer>DC-ActiveDirectory-01.corp.semor.com</Computer></System><EventData><Data Name="TargetUserName">krbtgt_admin</Data><Data Name="LogonType">3</Data><Data Name="AuthenticationPackageName">Kerberos</Data><Data Name="ElevatedToken">%%1842</Data><Data Name="IpAddress">10.88.88.102</Data></EventData></Event>',
    aiSummary: '網域安全審計日誌偵測到異常 Kerberos TGT 票證，該票證有效期長達 10 年且具備 Enterprise Admins (SID-519) 權限，符合 Mimikatz 偽造之 Golden Ticket 憑證特徵。',
    recommendedPlaybooks: [
      { id: 'pb-1401', title: '雙重輪替 Active Directory KRBTGT 密碼', description: '立即執行兩次 KRBTGT 金鑰輪替使所有現存偽造黃金票證失效', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0015',
    time: '2026-11-02 13:42:15 UTC',
    srcip: '10.88.99.14',
    srcHost: 'ai-gateway-proxy01',
    srcUser: 'CORP\\dev_user_09',
    dstip: '10.88.10.1',
    dstHost: 'SEMOR-AI-Core',
    action: 'Blocked',
    country: 'TW',
    threat: 'AI Gateway 動態機敏資料防護 (DLP)：阻斷核心原始碼與 API Key 外洩',
    risk: 'High',
    riskScore: 90,
    status: 'contained',
    category: 'exfil',
    mitreTTP: 'T1567 Exfiltration Over Web Service',
    mitreStage: 'Exfiltration',
    affectedAssets: 1,
    confidence: 98,
    payloadHex: '73 6b 2d 70 72 6f 6a 2d 38 66 31 32 30 34 61 62 63 64 65 66 39 39 31 38 32 37 34 31 30 32 66 66 61 61 37 38 31 32 30 34 30',
    logType: 'SYS_LOG',
    logFormat: 'RFC-5424',
    rawLog: '<134>1 2026-11-02T14:24:10.021Z ai-sec-gw01.corp.semor.com semor-aigateway 3001 - [dlp@32473 rule="DLP-AI-CORE" pattern="API_KEY_LEAK" tokens="1420"] [SEMOR AI-GATEWAY] Action=BLOCK User="CORP\\dev_user_09" Model="claude-3-5-sonnet" PromptChars=842 DLPViolation="Stripe/OpenAI secret key detected in prompt payload: sk-proj-***" Latency=3.4ms Verdict=DROPPED',
    aiSummary: '企業 AI 安全治理網關即時剖析大模型 Prompt 語意，捕捉到內部工程師貼上包含公司金鑰 (sk-proj-***) 與交易核心模組之未遮罩原始碼，DLP 即刻予以阻斷並寫入審計記錄。',
    recommendedPlaybooks: [
      { id: 'pb-1501', title: '調用 Syslog/Webhook 派送警報並通知資安長', description: '觸發雙軌制日誌架構之 Webhook HMAC 簽名告警至企業 SOC', type: 'notify' }
    ]
  },
  {
    id: 'INC-2026-0016',
    time: '2026-11-02 13:35:50 UTC',
    srcip: '198.51.100.22',
    dstip: '10.88.88.200',
    dstHost: 'Core-Server-Farm',
    action: 'Contained',
    country: 'US',
    threat: 'Mirai 殭屍網路發動 TCP SYN 與 UDP 反射放大 DDoS 洪水攻擊',
    risk: 'High',
    riskScore: 91,
    status: 'contained',
    category: 'bruteforce',
    mitreTTP: 'T1498.001 Direct Network Flood',
    mitreStage: 'Initial Access',
    affectedAssets: 4,
    confidence: 97,
    payloadHex: 'ff ff ff ff 54 53 6f 75 72 63 65 20 45 6e 67 69 6e 65 20 51 75 65 72 79 00',
    logType: 'FLOW_LOG',
    logFormat: 'NetFlow v9',
    rawLog: 'FLOW-NETFLOW9: version=9 sys_uptime=1910240 flow_seq=81042 src=198.51.100.22:12480 dst=10.88.88.200:53 proto=17 (UDP) pkts=1420800 bytes=984500000 in_if=Gi0/1 out_if=Null0 duration=24.1s status=BLOCKED_BY_FLOWSPEC router=ASR-9000-GW',
    aiSummary: '邊界骨幹路由器與流量分析儀 (NetFlow) 檢測到針對核心 DNS 叢集之反射放大攻擊，峰值頻寬達到 48.5 Gbps，清洗中心已自動發布 BGP Flowspec 導流清洗。',
    recommendedPlaybooks: [
      { id: 'pb-1601', title: 'BGP Anycast 黑洞路由與 CDN 流量清洗', description: '將受攻擊 VIP 路由發布至 Cloudflare Magic Transit 清洗中心', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0017',
    time: '2026-11-02 13:30:10 UTC',
    srcip: '10.88.88.102',
    srcHost: 'SOC-Analyst-WS02',
    srcUser: 'CORP\\analyst_chen',
    dstip: '10.88.88.202',
    dstHost: 'DC-ActiveDirectory-01',
    action: 'Investigating',
    country: 'TW',
    threat: 'BloodHound / SharpHound LDAP 高頻枚舉網域權限提升路徑',
    risk: 'High',
    riskScore: 87,
    status: 'investigating',
    category: 'ueba',
    mitreTTP: 'T1087.002 Domain Account Discovery',
    mitreStage: 'Recon',
    affectedAssets: 2,
    confidence: 94,
    payloadHex: '30 84 00 00 00 48 02 01 01 63 84 00 00 00 41 04 00 0a 01 02 0a 01 00 02 01 00 02 01 00 01 01 00 87 0b 6f 62 6a 65 63 74 43 6c 61 73 73 30 84 00 00 00 1a 04 07 73 61 6d 41 63 63 74',
    logType: 'EVENT_LOG',
    logFormat: 'Windows XML',
    eventId: 4662,
    rawLog: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>4662</EventID><TimeCreated SystemTime="2026-11-02T14:12:00.100Z"/><Computer>DC-ActiveDirectory-01.corp.semor.com</Computer></System><EventData><Data Name="OperationType">Object Access</Data><Data Name="ObjectName">%DomainDN%</Data><Data Name="ObjectServer">DS</Data><Data Name="Properties">All Extended Rights</Data><Data Name="SubjectUserName">CORP\\analyst_chen</Data></EventData></Event>',
    aiSummary: '網域控制站 LDAP 通訊埠 (389/636) 在 30 秒內收到來自 SOC-Analyst-WS02 之全網物件高頻遞迴查詢，查詢模式與 SharpHound 權限圖譜枚舉工具特徵完全吻合。',
    recommendedPlaybooks: [
      { id: 'pb-1701', title: '暫時停用涉案員工網域帳號', description: '鎖定 CORP\\analyst_chen 帳號並將端點隔離進行取證檢查', type: 'revoke' }
    ]
  },
  {
    id: 'INC-2026-0018',
    time: '2026-11-02 13:24:20 UTC',
    srcip: '192.168.99.12',
    srcHost: 'SUBSTATION-RTU-01',
    dstip: '10.99.30.50',
    dstHost: 'GRID-BREAKER-PLC-02',
    action: 'Blocked',
    country: 'TW',
    threat: 'DNP3 智慧電網通訊廣播注入：試圖覆寫高壓變電所遙控開關',
    risk: 'Critical',
    riskScore: 97,
    status: 'investigating',
    category: 'ics',
    mitreTTP: 'T0855 Unauthorized Command Message',
    mitreStage: 'Initial Access',
    affectedAssets: 2,
    confidence: 96,
    payloadHex: '05 64 14 44 01 00 00 02 00 00 05 0c 01 00 01 00 01 00 00 00 00 00 e4 2b',
    logType: 'SYS_LOG',
    logFormat: 'RFC-5424',
    rawLog: '<131>1 2026-11-02T14:05:12.890Z sub-grid-gw01 dnp3-dpi 880 - [dnp3@20000 function="0x05" direct_operate="yes" obj_var="12.1"] DNP3-DPI: [CRITICAL_BREAKER_OVERRIDE] src=192.168.99.12 dst=10.99.30.50:20000 function=0x05 (Direct Operate) obj=12 var=1 index=0 action=DROP verdict=MALICIOUS_BROADCAST',
    aiSummary: '變電所工控通訊閘道器捕捉到非排程之 DNP3 Function 0x05 (Direct Operate) 廣播指令，攻擊者意圖遠端跳脫 161kV 主變壓器斷路器，DNP3 深度解析防火牆已執行實體隔離。',
    recommendedPlaybooks: [
      { id: 'pb-1801', title: '啟動變電所離線手動控制保護模式', description: '切斷 DNP3 WAN 鏈路並通知現場值班主任轉為手動閉鎖', type: 'notify' }
    ]
  },
  {
    id: 'INC-2026-0019',
    time: '2026-11-02 13:18:15 UTC',
    srcip: '10.88.88.110',
    srcHost: 'WS-EXEC-BOARD-01',
    srcUser: 'CORP\\ceo_assistant',
    dstip: '10.88.88.110',
    dstHost: 'WS-EXEC-BOARD-01',
    action: 'Contained',
    country: 'TW',
    threat: 'DLL Side-Loading (側載) 劫持合法微軟簽名程序執行惡意 Payload',
    risk: 'High',
    riskScore: 93,
    status: 'contained',
    category: 'apt',
    cve: 'CVE-2023-38831',
    mitreTTP: 'T1574.002 DLL Side-Loading',
    mitreStage: 'Initial Access',
    affectedAssets: 1,
    confidence: 94,
    payloadHex: '4d 5a 90 00 03 00 00 00 04 00 00 00 ff ff 00 00 b8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00',
    logType: 'EVENT_LOG',
    logFormat: 'Sysmon XML',
    eventId: 7,
    rawLog: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Sysmon"/><EventID>7</EventID><TimeCreated SystemTime="2026-11-02T14:02:10.120Z"/><EventRecordID>714209</EventRecordID><Computer>WS-EXEC-BOARD-01.corp.semor.com</Computer></System><EventData><Data Name="RuleName">technique_id=T1574.002,technique_name=DLL Side-Loading</Data><Data Name="Image">C:\\Windows\\System32\\calc.exe</Data><Data Name="ImageLoaded">C:\\Users\\ceo_assistant\\Downloads\\Document.zip\\winmm.dll</Data><Data Name="Signed">false</Data></EventData></Event>',
    aiSummary: '高階主管助理工作站開啟釣魚郵件夾帶之 ZIP 壓縮檔，觸發 DLL 側載漏洞，使具備微軟官方數位簽章之合法程式在啟動時自動載入惡意木馬 DLL。EDR 行為攔截模組已及時終止程序並銷毀惡意二進位檔。',
    recommendedPlaybooks: [
      { id: 'pb-1901', title: '隔離工作站與重置助理帳號憑證', description: '實施主機隔離並清查同封釣魚郵件之其他收件者', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0020',
    time: '2026-11-02 13:10:20 UTC',
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
    logType: 'FLOW_LOG',
    logFormat: 'VPC Flow',
    rawLog: 'version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status\n2 363820011725 eni-0f9c2d1e2b4a 203.0.113.45 169.254.169.254 53210 80 6 24 1632 1730557200 1730557260 ACCEPT OK',
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
  logCategory?: 'SYS_LOG' | 'EVENT_LOG' | 'FLOW_LOG';
  logFormat?: string;
  eventId?: string | number;
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
    cve: item.cve,
    logCategory: item.logType,
    logFormat: item.logFormat,
    eventId: item.eventId
  };
}

export const OVERVIEW_DEMO_CRITICAL_INCIDENTS: OverviewIncidentRecord[] = DEMO_CRITICAL_INCIDENTS.map(mapIncidentItemToOverviewRecord);

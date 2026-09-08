import {
  MetricCardData,
  CcsClusterNode,
  MitreTacticItem,
  UebaHighRiskEntity,
  AbnormalLoginRecord,
  CriticalIncidentRecord,
  TrafficDataPoint,
  AttackTopologyNode,
  AttackTopologyLink,
  AttackTimelineEvent
} from './types';

export const OVERVIEW_METRICS: MetricCardData[] = [
  {
    id: 'total_events',
    titleZh: '24H 總事件數',
    titleEn: '24H Ingested Events',
    value: '128.4M',
    subValue: '1,486 EPS',
    changeZh: '+14.2% 今日累積',
    changeEn: '+14.2% vs yesterday',
    trend: 'up',
    color: 'blue',
    sparkline: [45, 52, 58, 65, 72, 85, 95, 110, 118, 128]
  },
  {
    id: 'ccs_workers',
    titleZh: 'CCS 跨集群搜尋節點',
    titleEn: 'CCS Worker Nodes',
    value: '5 / 5',
    subValue: '平均延遲 18ms',
    changeZh: '全域節點健全',
    changeEn: 'All nodes healthy',
    trend: 'neutral',
    color: 'green',
    sparkline: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
  },
  {
    id: 'endpoints',
    titleZh: '防護端點總數',
    titleEn: 'Protected Endpoints',
    value: '1,042',
    subValue: '在線率 99.1%',
    changeZh: '+14 新增註冊',
    changeEn: '+14 newly enrolled',
    trend: 'up',
    color: 'cyan',
    sparkline: [1020, 1024, 1028, 1030, 1035, 1038, 1042]
  },
  {
    id: 'active_threats',
    titleZh: '當前活動重大威脅',
    titleEn: 'Active Critical Threats',
    value: '12',
    subValue: '8 自動隔離中',
    changeZh: '4 起待分析處置',
    changeEn: '4 pending review',
    trend: 'down',
    color: 'red',
    sparkline: [18, 16, 17, 15, 14, 13, 12]
  },
  {
    id: 'storage_efficiency',
    titleZh: '冷熱存儲壓縮效率',
    titleEn: 'Storage Efficiency',
    value: '91.4%',
    subValue: '節省 18.2 TB',
    changeZh: 'Zstandard 演算法',
    changeEn: 'Zstandard tiering',
    trend: 'up',
    color: 'purple',
    sparkline: [88, 89, 89, 90, 90, 91, 91.4]
  },
  {
    id: 'network_bandwidth',
    titleZh: 'CCS 跨區傳輸頻寬',
    titleEn: 'CCS Mesh Bandwidth',
    value: '4.2 Gbps',
    subValue: '尖峰 6.8 Gbps',
    changeZh: '頻寬佔比 4.8%',
    changeEn: '4.8% of 10G link',
    trend: 'neutral',
    color: 'orange',
    sparkline: [3.8, 4.0, 4.1, 4.5, 4.8, 4.2, 4.2]
  }
];

export const SOC_SLA_METRICS = {
  mttdZh: '48 秒',
  mttdEn: '48 sec',
  mttdChange: '-18%',
  mttrZh: '4.2 分鐘',
  mttrEn: '4.2 min',
  mttrChange: '-35%',
  autoContainmentRate: '84.6%',
  falsePositiveRate: '1.2%'
};

export const CCS_CLUSTER_NODES: CcsClusterNode[] = [
  {
    id: 'ccs-node-01',
    name: 'Taipei-HQ-Primary',
    locationZh: '台灣台北 (主要資料中心)',
    locationEn: 'Taipei, Taiwan (Primary DC)',
    role: 'Master',
    ip: '10.88.10.1',
    latencyMs: 2,
    status: 'healthy',
    eps: 620,
    cpuLoad: 38,
    diskUsagePercent: 64,
    activeQueries: 42,
    coordinates: [121.5654, 25.0330]
  },
  {
    id: 'ccs-node-02',
    name: 'Tokyo-Worker-01',
    locationZh: '日本東京 (亞太邊緣節點)',
    locationEn: 'Tokyo, Japan (APAC Edge)',
    role: 'Worker',
    ip: '10.89.20.1',
    latencyMs: 22,
    status: 'healthy',
    eps: 310,
    cpuLoad: 42,
    diskUsagePercent: 58,
    activeQueries: 18,
    coordinates: [139.6917, 35.6895]
  },
  {
    id: 'ccs-node-03',
    name: 'Frankfurt-Worker-02',
    locationZh: '德國法蘭克福 (歐洲節點)',
    locationEn: 'Frankfurt, Germany (EU Node)',
    role: 'Worker',
    ip: '10.90.30.1',
    latencyMs: 145,
    status: 'healthy',
    eps: 240,
    cpuLoad: 34,
    diskUsagePercent: 52,
    activeQueries: 14,
    coordinates: [8.6821, 50.1109]
  },
  {
    id: 'ccs-node-04',
    name: 'SiliconValley-Worker-03',
    locationZh: '美國加州 (北美研發中心)',
    locationEn: 'Silicon Valley, USA (US West)',
    role: 'Worker',
    ip: '10.91.40.1',
    latencyMs: 110,
    status: 'healthy',
    eps: 190,
    cpuLoad: 28,
    diskUsagePercent: 47,
    activeQueries: 9,
    coordinates: [-122.0839, 37.3861]
  },
  {
    id: 'ccs-node-05',
    name: 'Singapore-Worker-04',
    locationZh: '新加坡 (東南亞樞紐)',
    locationEn: 'Singapore (ASEAN Hub)',
    role: 'Worker',
    ip: '10.92.50.1',
    latencyMs: 46,
    status: 'healthy',
    eps: 126,
    cpuLoad: 22,
    diskUsagePercent: 39,
    activeQueries: 6,
    coordinates: [103.8198, 1.3521]
  }
];

export const MITRE_TACTIC_DISTRIBUTION: MitreTacticItem[] = [
  {
    id: 'initial_access',
    tacticZh: '初始存取',
    tacticEn: 'Initial Access',
    code: 'TA0001',
    detectedCount: 48,
    severity: 'High',
    techniques: [
      { code: 'T1190', nameZh: '利用公眾網路應用漏洞', nameEn: 'Exploit Public App', count: 28, active: true },
      { code: 'T1566', nameZh: '釣魚郵件附檔攻擊', nameEn: 'Phishing: Spearphishing', count: 14, active: true },
      { code: 'T1078', nameZh: '有效帳號遭竊用', nameEn: 'Valid Accounts', count: 6, active: false }
    ]
  },
  {
    id: 'execution',
    tacticZh: '惡意執行',
    tacticEn: 'Execution',
    code: 'TA0002',
    detectedCount: 64,
    severity: 'Critical',
    techniques: [
      { code: 'T1059.001', nameZh: 'PowerShell 命令列注入', nameEn: 'PowerShell Scripts', count: 36, active: true },
      { code: 'T1204', nameZh: '誘導使用者執行載荷', nameEn: 'User Execution: Malicious File', count: 18, active: false },
      { code: 'T1047', nameZh: 'WMI 遠端腳本呼叫', nameEn: 'WMI Query & Exec', count: 10, active: true }
    ]
  },
  {
    id: 'persistence',
    tacticZh: '持續性駐留',
    tacticEn: 'Persistence',
    code: 'TA0003',
    detectedCount: 22,
    severity: 'Medium',
    techniques: [
      { code: 'T1547', nameZh: '登錄檔開機自動執行', nameEn: 'Boot/Logon Autostart', count: 12, active: false },
      { code: 'T1053', nameZh: '排程工作排定執行', nameEn: 'Scheduled Tasks/Cron', count: 10, active: true }
    ]
  },
  {
    id: 'lateral_movement',
    tacticZh: '內部橫向移動',
    tacticEn: 'Lateral Movement',
    code: 'TA0008',
    detectedCount: 35,
    severity: 'Critical',
    techniques: [
      { code: 'T1021.002', nameZh: 'SMB / 網路共用連線', nameEn: 'SMB/Windows Shares', count: 21, active: true },
      { code: 'T1021.001', nameZh: '遠端桌面 RDP 爆破登入', nameEn: 'Remote Desktop Protocol', count: 9, active: true },
      { code: 'T1550', nameZh: 'Pass-the-Hash 憑證傳遞', nameEn: 'Use Alternate Auth: PtH', count: 5, active: false }
    ]
  },
  {
    id: 'exfiltration',
    tacticZh: '機密外洩盜取',
    tacticEn: 'Exfiltration',
    code: 'TA0010',
    detectedCount: 19,
    severity: 'Critical',
    techniques: [
      { code: 'T1048', nameZh: '非標準通訊協定外傳', nameEn: 'Exfil Over Alt Protocol', count: 11, active: true },
      { code: 'T1567', nameZh: '雲端同步端點傳輸 (15GB)', nameEn: 'Exfil Over Web Service', count: 8, active: true }
    ]
  }
];

export const UEBA_HIGH_RISK_ENTITIES: UebaHighRiskEntity[] = [
  {
    id: 'entity-01',
    name: 'Kevin Chen (陳立言)',
    roleZh: '核心演算法研發主任',
    roleEn: 'Lead R&D Algorithm Engineer',
    departmentZh: '研發核心部',
    departmentEn: 'Core Research & Dev',
    score: 94,
    previousScore: 42,
    status: 'Critical',
    avatarInitials: 'KC',
    triggersZh: ['深夜 02:40 異常 VPN 連線', '高頻下載 /src/core 原始碼 (15GB)', '使用 7z 加密打包未授權工具'],
    triggersEn: ['VPN off-hours login at 02:40 AM', 'Massive download of /src/core (15GB)', 'Unauthorized 7z encryption tool executed'],
    lastAnomalyTime: '10 分鐘前',
    networkActivity: {
      bytesOutMb: 15360,
      filesAccessed: 1240,
      offHourLogins: 4
    }
  },
  {
    id: 'entity-02',
    name: 'svc-database-sync (服務帳號)',
    roleZh: '自動化叢集資料同步精靈',
    roleEn: 'Cross-DC DB Sync Daemon',
    departmentZh: 'IT 基礎設施維運部',
    departmentEn: 'IT Infrastructure',
    score: 88,
    previousScore: 25,
    status: 'Critical',
    avatarInitials: 'DB',
    triggersZh: ['突發向未列管 IP: 45.33.32.15 發起連線', '異常執行 cmd.exe 行程', 'Kerberos 票證異常請求 (Golden Ticket 疑似)'],
    triggersEn: ['Connection to rogue IP: 45.33.32.15', 'Abnormal cmd.exe spawned by service', 'Suspicious Kerberos Golden Ticket request'],
    lastAnomalyTime: '24 分鐘前',
    networkActivity: {
      bytesOutMb: 4200,
      filesAccessed: 890,
      offHourLogins: 1
    }
  },
  {
    id: 'entity-03',
    name: 'Sarah Lin (林子萱)',
    roleZh: '資深財務出納副理',
    roleEn: 'Senior Treasury Manager',
    departmentZh: '集團財務中心',
    departmentEn: 'Corporate Finance',
    score: 76,
    previousScore: 30,
    status: 'High',
    avatarInitials: 'SL',
    triggersZh: ['連線至疑似變臉詐騙 (BEC) 偽冒網域', '自非白名單外部 IP 登入 ERP 系統'],
    triggersEn: ['Communicated with BEC spoofing domain', 'ERP login from unapproved foreign IP'],
    lastAnomalyTime: '1 小時前',
    networkActivity: {
      bytesOutMb: 450,
      filesAccessed: 180,
      offHourLogins: 2
    }
  },
  {
    id: 'entity-04',
    name: 'Alex Hwang (黃威廉)',
    roleZh: '雲端架構師',
    roleEn: 'Cloud DevOps Specialist',
    departmentZh: 'DevOps 架構部',
    departmentEn: 'DevOps & SRE',
    score: 65,
    previousScore: 45,
    status: 'Medium',
    avatarInitials: 'AH',
    triggersZh: ['多次 IAM 權限提升失敗', '短時間查詢過多 AWS 密鑰'],
    triggersEn: ['Multiple IAM privilege escalation failures', 'Spike in Secret Manager reads'],
    lastAnomalyTime: '3 小時前',
    networkActivity: {
      bytesOutMb: 120,
      filesAccessed: 85,
      offHourLogins: 1
    }
  }
];

export const ABNORMAL_LOGINS: AbnormalLoginRecord[] = [
  {
    id: 'log-01',
    time: '10:45:12',
    ip: '103.152.220.45',
    locationZh: '俄羅斯 (莫斯科)',
    locationEn: 'Moscow, Russia',
    host: 'PROD-DB-PRIMARY-01',
    service: 'SSH',
    attempts: 142,
    status: 'BLOCKED',
    risk: 'Critical'
  },
  {
    id: 'log-02',
    time: '10:43:05',
    ip: '194.26.29.112',
    locationZh: '荷蘭 (阿姆斯特丹)',
    locationEn: 'Amsterdam, Netherlands',
    host: 'WEB-GATEWAY-02',
    service: 'RDP',
    attempts: 88,
    status: 'BLOCKED',
    risk: 'Critical'
  },
  {
    id: 'log-03',
    time: '10:41:20',
    ip: '185.190.140.33',
    locationZh: '拉脫維亞 (里加)',
    locationEn: 'Riga, Latvia',
    host: 'MAIL-EXCHANGE-GW',
    service: 'HTTPS',
    attempts: 46,
    status: 'RATE_LIMITED',
    risk: 'High'
  },
  {
    id: 'log-04',
    time: '10:38:50',
    ip: '10.88.88.132',
    locationZh: '內網橫向節點 (WS-132)',
    locationEn: 'Internal Lateral Host (WS-132)',
    host: 'CORE-AD-DC01',
    service: 'Kerberos',
    attempts: 24,
    status: 'MONITORING',
    risk: 'High'
  },
  {
    id: 'log-05',
    time: '10:35:10',
    ip: '45.145.66.78',
    locationZh: '羅馬尼亞 (布加勒斯特)',
    locationEn: 'Bucharest, Romania',
    host: 'VPN-CONCENTRATOR-01',
    service: 'VPN',
    attempts: 65,
    status: 'BLOCKED',
    risk: 'Critical'
  }
];

export const CRITICAL_INCIDENTS: CriticalIncidentRecord[] = [
  {
    id: 'INC-2026-0901',
    time: '10:48:12',
    threatZh: 'WannaCry 變種惡意勒索軟體橫向傳播',
    threatEn: 'WannaCry v2 Ransomware Lateral Propagation',
    categoryZh: '勒索軟體 / 蠕蟲擴散',
    categoryEn: 'Ransomware / Worm Propagation',
    srcIp: '10.88.88.22',
    destIp: '10.88.88.131',
    host: 'WS-RND-KEVIN (端點 22)',
    countryZh: '企業內網 (研發網段)',
    countryEn: 'Internal (R&D Subnet)',
    actionZh: 'SOAR：端點已自動隔離 + 防火牆阻斷 SMB',
    actionEn: 'SOAR: Endpoint Isolated + SMB Port 445 Blocked',
    risk: 'Critical',
    mitreTactic: 'TA0008 (橫向移動)',
    soarStatus: 'Auto-Contained',
    iocHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    affectedAssets: ['WS-RND-KEVIN', 'CORE-SW-01', 'WS-131', 'WS-132']
  },
  {
    id: 'INC-2026-0902',
    time: '10:45:00',
    threatZh: 'UEBA: 研發部大量機密原始碼異常外傳 (15GB)',
    threatEn: 'UEBA: High Vol Source Code Data Exfiltration (15GB)',
    categoryZh: '內部人員威脅 / 資料外洩',
    categoryEn: 'Insider Threat / Data Exfiltration',
    srcIp: '10.88.88.22',
    destIp: '185.220.101.5',
    host: 'WS-RND-KEVIN',
    countryZh: '外部惡意節點 (Tor 出口)',
    countryEn: 'External Malicious Node (Tor Exit)',
    actionZh: 'SOAR：帳號強制登出 + 邊界阻斷外傳連線',
    actionEn: 'SOAR: Force Session Revocation + Perimeter Egress Drop',
    risk: 'Critical',
    mitreTactic: 'TA0010 (資料外洩)',
    soarStatus: 'Auto-Contained',
    iocHash: 'a8f5f167f44f4964e6c998dee827110c',
    affectedAssets: ['WS-RND-KEVIN', 'GIT-ENTERPRISE-REPO']
  },
  {
    id: 'INC-2026-0903',
    time: '10:32:15',
    threatZh: 'Modbus 工業控制系統指令篡改 (0x05 寫入嘗試)',
    threatEn: 'OT Modbus SCADA Command Tampering (Write 0x05)',
    categoryZh: 'OT / 工控安全威脅',
    categoryEn: 'OT / ICS Security Threat',
    srcIp: '10.88.50.99',
    destIp: '10.88.50.1',
    host: 'PLC-PUMP-STATION-04',
    countryZh: 'OT 水處理廠區 (隔離網段)',
    countryEn: 'OT Water Station Subnet',
    actionZh: 'SOAR：進入單向安全防禦模式 + 觸發工控告警',
    actionEn: 'SOAR: Diode Fail-Safe Mode + Plant Engineer Alert',
    risk: 'Critical',
    mitreTactic: 'TA0040 (工控衝擊)',
    soarStatus: 'In-Progress',
    affectedAssets: ['PLC-PUMP-STATION-04', 'OT-GATEWAY-NORTH']
  },
  {
    id: 'INC-2026-0904',
    time: '10:20:44',
    threatZh: '分佈式 SSH 暴力破解與憑證撞庫攻擊',
    threatEn: 'Distributed SSH Brute Force & Credential Stuffing',
    categoryZh: '憑證存取威脅',
    categoryEn: 'Credential Access Threat',
    srcIp: '103.152.220.45',
    destIp: '10.88.10.1',
    host: 'PROD-DB-PRIMARY-01',
    countryZh: '俄羅斯 (莫斯科)',
    countryEn: 'Moscow, Russia',
    actionZh: 'SOAR：來源 IP 加入黑名單 24 小時',
    actionEn: 'SOAR: Null-Route IP for 24 hours',
    risk: 'High',
    mitreTactic: 'TA0006 (憑證存取)',
    soarStatus: 'Auto-Contained',
    affectedAssets: ['PROD-DB-PRIMARY-01']
  },
  {
    id: 'INC-2026-0905',
    time: '10:05:18',
    threatZh: 'Ivanti Connect Secure 遠端程式碼執行 (CVE-2024-21887)',
    threatEn: 'Ivanti Connect Secure RCE Exploit (CVE-2024-21887)',
    categoryZh: '邊界漏洞利用攻擊',
    categoryEn: 'Perimeter Exploit Attempt',
    srcIp: '45.145.66.78',
    destIp: '10.88.0.5',
    host: 'VPN-GATEWAY-EXTERNAL',
    countryZh: '荷蘭 (阿姆斯特丹)',
    countryEn: 'Amsterdam, Netherlands',
    actionZh: 'IPS：特徵碼攔截 + WAF 虛擬補丁即時啟用',
    actionEn: 'IPS: Virtual Patch Applied + Payload Blocked',
    risk: 'High',
    mitreTactic: 'TA0001 (初始存取)',
    soarStatus: 'Resolved',
    affectedAssets: ['VPN-GATEWAY-EXTERNAL']
  }
];

export const HOURLY_TRAFFIC_DATA: TrafficDataPoint[] = [
  { time: '05:00', worker1Eps: 420, worker2Eps: 210, worker3Eps: 180, totalTrafficGbps: 2.4, alerts: 4 },
  { time: '06:00', worker1Eps: 460, worker2Eps: 230, worker3Eps: 190, totalTrafficGbps: 2.8, alerts: 6 },
  { time: '07:00', worker1Eps: 580, worker2Eps: 270, worker3Eps: 210, totalTrafficGbps: 3.4, alerts: 9 },
  { time: '08:00', worker1Eps: 820, worker2Eps: 340, worker3Eps: 240, totalTrafficGbps: 4.6, alerts: 18 },
  { time: '09:00', worker1Eps: 960, worker2Eps: 390, worker3Eps: 260, totalTrafficGbps: 5.8, alerts: 26 },
  { time: '10:00', worker1Eps: 1150, worker2Eps: 450, worker3Eps: 310, totalTrafficGbps: 6.8, alerts: 38 },
  { time: '11:00', worker1Eps: 980, worker2Eps: 410, worker3Eps: 280, totalTrafficGbps: 5.4, alerts: 29 },
  { time: '12:00', worker1Eps: 760, worker2Eps: 320, worker3Eps: 220, totalTrafficGbps: 4.1, alerts: 14 },
  { time: '13:00', worker1Eps: 890, worker2Eps: 370, worker3Eps: 250, totalTrafficGbps: 4.9, alerts: 22 },
  { time: '14:00', worker1Eps: 1040, worker2Eps: 430, worker3Eps: 290, totalTrafficGbps: 6.2, alerts: 34 },
  { time: '15:00', worker1Eps: 1220, worker2Eps: 480, worker3Eps: 330, totalTrafficGbps: 7.2, alerts: 45 },
  { time: '16:00', worker1Eps: 1080, worker2Eps: 440, worker3Eps: 300, totalTrafficGbps: 6.5, alerts: 31 }
];

export const ATTACK_TOPOLOGY_DATA: {
  nodes: AttackTopologyNode[];
  links: AttackTopologyLink[];
  timeline: AttackTimelineEvent[];
} = {
  nodes: [
    { id: 'C2', type: 'attacker', labelZh: '外部 C2 中繼控制站', labelEn: 'External C2 Server', ip: '185.220.101.5 (Tor Exit)', x: 80, y: 220 },
    { id: 'FW', type: 'gateway', labelZh: '邊界次世代防火牆 (NGFW)', labelEn: 'Border NGFW', ip: '10.88.88.254', x: 230, y: 220 },
    { id: 'SW', type: 'network', labelZh: '核心核心交換器 (Core Switch)', labelEn: 'Core Switch 01', ip: '10.88.88.1', x: 390, y: 220 },
    { id: 'WS22', type: 'infected', labelZh: '零號受害端點 (WS-22)', labelEn: 'Patient Zero (WS-22)', ip: '10.88.88.22', x: 550, y: 220, patientZero: true },
    { id: 'WS131', type: 'infected', labelZh: '橫向感染端點 1 (WS-131)', labelEn: 'Infected Node 1 (WS-131)', ip: '10.88.88.131', x: 710, y: 130 },
    { id: 'WS132', type: 'infected', labelZh: '橫向感染端點 2 (WS-132)', labelEn: 'Infected Node 2 (WS-132)', ip: '10.88.88.132', x: 710, y: 310 },
    { id: 'PROD_DB', type: 'target', labelZh: '核心生產資料庫 (PROD-DB)', labelEn: 'Core Database (Target)', ip: '10.88.10.1', x: 860, y: 220 }
  ],
  links: [
    { source: 'C2', target: 'FW', labelZh: '惡意載荷傳輸', labelEn: 'Inbound Delivery', type: 'entry' },
    { source: 'FW', target: 'SW', labelZh: '內網交換流向', labelEn: 'Transit Traffic', type: 'transit' },
    { source: 'SW', target: 'WS22', labelZh: '初始植入執行', labelEn: 'Execution', type: 'infection' },
    { source: 'WS22', target: 'WS131', labelZh: 'SMB 漏洞橫向擴散', labelEn: 'SMB Exploit Spread', type: 'lateral' },
    { source: 'WS22', target: 'WS132', labelZh: 'SMB 漏洞橫向擴散', labelEn: 'SMB Exploit Spread', type: 'lateral' },
    { source: 'WS131', target: 'PROD_DB', labelZh: '資料庫探測連線', labelEn: 'DB Reconnaissance', type: 'lateral' },
    { source: 'WS22', target: 'C2', labelZh: '15GB 機密外傳通道', labelEn: '15GB Exfiltration Channel', type: 'exfil' }
  ],
  timeline: [
    { time: '10:15:22', eventZh: '經由 DNS 隧道偵測到初始感染嘗試 (Trojan.Dropper)', eventEn: 'Initial dropper detected via DNS Tunneling', status: 'detected' },
    { time: '10:18:45', eventZh: 'C2 外部中繼控制站建立與端點 WS-22 之雙向加密連線', eventEn: 'C2 Server established encrypted channel with WS-22', status: 'processing' },
    { time: '10:22:10', eventZh: '端點執行 PowerShell 指令，釋放 7z 加密打包 /src/core', eventEn: 'PowerShell script dumped and packed /src/core', status: 'alert' },
    { time: '10:45:05', eventZh: 'WannaCry 變種勒索載荷執行，嘗試加密主機本機磁碟', eventEn: 'WannaCry payload initiated local disk encryption', status: 'critical' },
    { time: '10:48:12', eventZh: '透過 MS17-010 SMB 探針向 WS-131 與 WS-132 發起橫向感染', eventEn: 'SMB probes targeted WS-131 and WS-132', status: 'critical' }
  ]
};

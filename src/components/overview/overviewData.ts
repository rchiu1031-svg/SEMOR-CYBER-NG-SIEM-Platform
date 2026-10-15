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
    value: '0',
    subValue: '0 EPS',
    changeZh: '等待日誌串流接入',
    changeEn: 'Awaiting telemetry stream',
    trend: 'neutral',
    color: 'blue',
    sparkline: [0, 0, 0, 0, 0]
  },
  {
    id: 'ccs_workers',
    titleZh: 'CCS 跨集群搜尋節點',
    titleEn: 'CCS Worker Nodes',
    value: '1 / 1',
    subValue: '本機主節點就緒',
    changeZh: '全域節點健全',
    changeEn: 'Local Master Online',
    trend: 'neutral',
    color: 'green',
    sparkline: [1, 1, 1, 1, 1]
  },
  {
    id: 'endpoints',
    titleZh: '防護端點總數',
    titleEn: 'Protected Endpoints',
    value: '0',
    subValue: '等待代理安裝',
    changeZh: '尚未註冊端點',
    changeEn: 'Awaiting Agent Deployment',
    trend: 'neutral',
    color: 'cyan',
    sparkline: [0, 0, 0, 0, 0]
  },
  {
    id: 'active_threats',
    titleZh: '當前活動重大威脅',
    titleEn: 'Active Critical Threats',
    value: '0',
    subValue: '系統狀態安全良好',
    changeZh: '無未處置威脅',
    changeEn: 'No active threats',
    trend: 'neutral',
    color: 'red',
    sparkline: [0, 0, 0, 0, 0]
  },
  {
    id: 'storage_efficiency',
    titleZh: '冷熱存儲壓縮效率',
    titleEn: 'Storage Efficiency',
    value: '100%',
    subValue: '存儲引擎待命中',
    changeZh: 'Zstandard 壓縮就緒',
    changeEn: 'Ready for ingestion',
    trend: 'neutral',
    color: 'purple',
    sparkline: [100, 100, 100]
  },
  {
    id: 'network_bandwidth',
    titleZh: 'CCS 跨區傳輸頻寬',
    titleEn: 'CCS Mesh Bandwidth',
    value: '0 bps',
    subValue: '無跨區通訊',
    changeZh: '等待網路流量數據',
    changeEn: 'Awaiting network flow',
    trend: 'neutral',
    color: 'orange',
    sparkline: [0, 0, 0, 0, 0]
  }
];

export const SOC_SLA_METRICS = {
  mttdZh: '0 秒',
  mttdEn: '0 sec',
  mttdChange: '0%',
  mttrZh: '0 分鐘',
  mttrEn: '0 min',
  mttrChange: '0%',
  autoContainmentRate: '100%',
  falsePositiveRate: '0%'
};

export const CCS_CLUSTER_NODES: CcsClusterNode[] = [
  {
    id: 'ccs-node-01',
    name: 'Local-Master-01',
    locationZh: '台灣台北 (主要資料中心)',
    locationEn: 'Taipei, Taiwan (Primary DC)',
    role: 'Master',
    ip: '127.0.0.1',
    latencyMs: 1,
    status: 'healthy',
    eps: 0,
    cpuLoad: 5,
    diskUsagePercent: 12,
    activeQueries: 0,
    coordinates: [121.5654, 25.0330]
  }
];

export const MITRE_TACTIC_DISTRIBUTION: MitreTacticItem[] = [
  {
    id: 'initial_access',
    tacticZh: '初始存取',
    tacticEn: 'Initial Access',
    code: 'TA0001',
    detectedCount: 0,
    severity: 'Medium',
    techniques: [
      { code: 'T1190', nameZh: '利用公眾網路應用漏洞', nameEn: 'Exploit Public App', count: 0, active: false },
      { code: 'T1566', nameZh: '釣魚郵件附檔攻擊', nameEn: 'Phishing: Spearphishing', count: 0, active: false },
      { code: 'T1078', nameZh: '有效帳號遭竊用', nameEn: 'Valid Accounts', count: 0, active: false }
    ]
  },
  {
    id: 'execution',
    tacticZh: '惡意執行',
    tacticEn: 'Execution',
    code: 'TA0002',
    detectedCount: 0,
    severity: 'Low',
    techniques: [
      { code: 'T1059.001', nameZh: 'PowerShell 命令列注入', nameEn: 'PowerShell Scripts', count: 0, active: false },
      { code: 'T1204', nameZh: '誘導使用者執行載荷', nameEn: 'User Execution: Malicious File', count: 0, active: false },
      { code: 'T1047', nameZh: 'WMI 遠端腳本呼叫', nameEn: 'WMI Query & Exec', count: 0, active: false }
    ]
  },
  {
    id: 'persistence',
    tacticZh: '持續性駐留',
    tacticEn: 'Persistence',
    code: 'TA0003',
    detectedCount: 0,
    severity: 'Low',
    techniques: [
      { code: 'T1547', nameZh: '登錄檔開機自動執行', nameEn: 'Boot/Logon Autostart', count: 0, active: false },
      { code: 'T1053', nameZh: '排程工作排定執行', nameEn: 'Scheduled Tasks/Cron', count: 0, active: false }
    ]
  },
  {
    id: 'lateral_movement',
    tacticZh: '內部橫向移動',
    tacticEn: 'Lateral Movement',
    code: 'TA0008',
    detectedCount: 0,
    severity: 'Low',
    techniques: [
      { code: 'T1021.002', nameZh: 'SMB / 網路共用連線', nameEn: 'SMB/Windows Shares', count: 0, active: false },
      { code: 'T1021.001', nameZh: '遠端桌面 RDP 爆破登入', nameEn: 'Remote Desktop Protocol', count: 0, active: false },
      { code: 'T1550', nameZh: 'Pass-the-Hash 憑證傳遞', nameEn: 'Use Alternate Auth: PtH', count: 0, active: false }
    ]
  },
  {
    id: 'exfiltration',
    tacticZh: '機密外洩盜取',
    tacticEn: 'Exfiltration',
    code: 'TA0010',
    detectedCount: 0,
    severity: 'Low',
    techniques: [
      { code: 'T1048', nameZh: '非標準通訊協定外傳', nameEn: 'Exfil Over Alt Protocol', count: 0, active: false },
      { code: 'T1567', nameZh: '雲端同步端點傳輸', nameEn: 'Exfil Over Web Service', count: 0, active: false }
    ]
  }
];

export const UEBA_HIGH_RISK_ENTITIES: UebaHighRiskEntity[] = [];

export const ABNORMAL_LOGINS: AbnormalLoginRecord[] = [];

export const CRITICAL_INCIDENTS: CriticalIncidentRecord[] = [];

export const HOURLY_TRAFFIC_DATA: TrafficDataPoint[] = [];

export const ATTACK_TOPOLOGY_DATA: {
  nodes: AttackTopologyNode[];
  links: AttackTopologyLink[];
  timeline: AttackTimelineEvent[];
} = {
  nodes: [],
  links: [],
  timeline: []
};

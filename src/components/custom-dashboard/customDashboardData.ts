import { DashboardTemplate } from './types';

export const INITIAL_DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'dash-soc-triage',
    name: 'SOC Real-time Triage & Threat Intelligence',
    description: '全域企業級即時警報分流、CCS 分散式日誌串流、重大威脅關聯與 UEBA 風險哨兵戰情',
    category: 'SOC Triage',
    isDefault: true,
    author: 'Chief SOC Architect',
    lastModified: '2026-09-08 11:30',
    tags: ['SOC-L1', 'Real-time', 'CCS-Mesh', 'MITRE-ATT&CK'],
    widgets: [
      {
        id: 'w-active-incidents',
        title: '活躍重大事件 (Critical Incidents)',
        description: '等待 SOC 分析師處置之 P1/P2 高危資安事件',
        type: 'stat',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'VictoriaLogs Engine',
        color: '#ef4444',
        thresholds: { warning: 5, critical: 10, condition: 'gt' },
        customConfig: {
          statValue: '12',
          statChange: '+3 from 1h ago',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          unit: '件',
          chartData: [
            { time: '10:00', value: 6 },
            { time: '10:15', value: 7 },
            { time: '10:30', value: 9 },
            { time: '10:45', value: 8 },
            { time: '11:00', value: 11 },
            { time: '11:15', value: 12 },
          ]
        }
      },
      {
        id: 'w-mttr-timer',
        title: '平均應變處置時效 (MTTR)',
        description: '事件從警報觸發至完成遏止之平均歷時 (目標 < 15m)',
        type: 'stat',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'SOAR Orchestrator',
        color: '#10b981',
        thresholds: { warning: 20, critical: 30, condition: 'gt' },
        customConfig: {
          statValue: '8m 42s',
          statChange: '-3m 15s improvement',
          statTrend: 'down',
          alertThresholdExceeded: false,
          showSparkline: true,
          unit: '',
          chartData: [
            { time: '10:00', value: 14 },
            { time: '10:15', value: 12 },
            { time: '10:30', value: 11 },
            { time: '10:45', value: 9.5 },
            { time: '11:00', value: 8.8 },
            { time: '11:15', value: 8.7 },
          ]
        }
      },
      {
        id: 'w-eps-ingestion',
        title: '全網總吞吐量 (Ingestion EPS)',
        description: '跨全球 3 組 CCS 運算節點之總即時日誌事件解析率',
        type: 'stat',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'Loki Ingestion Stream',
        color: '#3b82f6',
        customConfig: {
          statValue: '148,500',
          statChange: '+12.4% peak',
          statTrend: 'up',
          alertThresholdExceeded: false,
          showSparkline: true,
          unit: 'EPS',
          chartData: [
            { time: '10:00', value: 120 },
            { time: '10:15', value: 135 },
            { time: '10:30', value: 142 },
            { time: '10:45', value: 138 },
            { time: '11:00', value: 145 },
            { time: '11:15', value: 148.5 },
          ]
        }
      },
      {
        id: 'w-c2-beacons',
        title: 'C2 外部通聯識別 (Beaconing)',
        description: '透過 TLS 證書指紋與固定頻率探針偵測之異常連線',
        type: 'stat',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'Suricata / Zeek NDR',
        color: '#f97316',
        thresholds: { warning: 2, critical: 5, condition: 'gt' },
        customConfig: {
          statValue: '3',
          statChange: '2 hosts quarantined',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          unit: '主機',
          chartData: [
            { time: '10:00', value: 0 },
            { time: '10:15', value: 1 },
            { time: '10:30', value: 2 },
            { time: '10:45', value: 2 },
            { time: '11:00', value: 3 },
            { time: '11:15', value: 3 },
          ]
        }
      },
      {
        id: 'w-network-flow-trends',
        title: '網路流量與關聯串流分析 (Multi-Protocol Flow)',
        description: '即時 TCP、UDP、HTTPS 及 DNS 流量頻寬與異常尖峰關聯',
        type: 'timeseries_area',
        width: 'col-span-8',
        height: 'h-80',
        dataSource: 'OpenSearch NetFlow Analytics',
        customConfig: {
          showLegend: true,
          stacked: true,
          seriesKeys: [
            { key: 'tcp', name: 'TCP (Enterprise TLS)', color: '#3b82f6' },
            { key: 'udp', name: 'UDP / QUIC', color: '#10b981' },
            { key: 'http', name: 'HTTP / API Gateway', color: '#f97316' },
            { key: 'anomaly', name: 'Flagged Exfiltration', color: '#ef4444' }
          ],
          chartData: [
            { time: '10:00', tcp: 420, udp: 120, http: 210, anomaly: 2 },
            { time: '10:10', tcp: 450, udp: 135, http: 230, anomaly: 5 },
            { time: '10:20', tcp: 490, udp: 140, http: 250, anomaly: 4 },
            { time: '10:30', tcp: 530, udp: 155, http: 280, anomaly: 8 },
            { time: '10:40', tcp: 680, udp: 190, http: 340, anomaly: 28 }, // Spike
            { time: '10:50', tcp: 620, udp: 175, http: 310, anomaly: 18 },
            { time: '11:00', tcp: 560, udp: 160, http: 290, anomaly: 12 },
            { time: '11:10', tcp: 520, udp: 150, http: 270, anomaly: 6 },
            { time: '11:20', tcp: 510, udp: 145, http: 260, anomaly: 4 },
          ]
        }
      },
      {
        id: 'w-threat-origins-donut',
        title: '外部威脅來源地理與 ASN 分佈',
        description: '邊界防火牆攔截與 WAF 規則阻斷之來源國家分佈',
        type: 'donut',
        width: 'col-span-4',
        height: 'h-80',
        dataSource: 'Perimeter WAF / CTI Feed',
        customConfig: {
          showLegend: true,
          chartData: [
            { name: '東歐境外代理 (AS4837)', value: 42, color: '#ef4444' },
            { name: '北美殭屍網路 (AS16276)', value: 28, color: '#f97316' },
            { name: '東南亞中繼站 (AS9318)', value: 16, color: '#eab308' },
            { name: '西歐匿名 Tor 節點', value: 9, color: '#a855f7' },
            { name: '其他未分類來源', value: 5, color: '#6b7280' },
          ]
        }
      },
      {
        id: 'w-syslog-severity-bars',
        title: 'Syslog 資安事件嚴重性趨勢 (Severity Spectrum)',
        description: '包含 Emergency (P1)、Critical (P2)、Warning (P3)、Informational 分佈',
        type: 'timeseries_bar',
        width: 'col-span-6',
        height: 'h-80',
        dataSource: 'VictoriaLogs Syslog-NG',
        customConfig: {
          showLegend: true,
          stacked: true,
          seriesKeys: [
            { key: 'emergency', name: '極嚴重 (Emergency)', color: '#a855f7' },
            { key: 'critical', name: '嚴重 (Critical)', color: '#ef4444' },
            { key: 'warning', name: '警告 (Warning)', color: '#eab308' },
            { key: 'info', name: '一般 (Info)', color: '#3b82f6' }
          ],
          chartData: [
            { time: '07:00', emergency: 1, critical: 4, warning: 18, info: 120 },
            { time: '08:00', emergency: 0, critical: 6, warning: 22, info: 145 },
            { time: '09:00', emergency: 2, critical: 9, warning: 31, info: 180 },
            { time: '10:00', emergency: 4, critical: 14, warning: 45, info: 210 },
            { time: '11:00', emergency: 5, critical: 12, warning: 38, info: 195 },
          ]
        }
      },
      {
        id: 'w-ueba-watchlist-table',
        title: 'AI 實體行為分析 (UEBA) 高風險監視清單',
        description: '偏離基準線 (Baseline) 異常操作與提權監視',
        type: 'table',
        width: 'col-span-6',
        height: 'h-80',
        dataSource: 'Semor AI UEBA Engine',
        customConfig: {
          tableColumns: [
            { key: 'user', label: '帳號 / 實體名稱', isMono: true },
            { key: 'dept', label: '部門' },
            { key: 'anomaly', label: '主要異常行為' },
            { key: 'riskScore', label: '風險指數' },
            { key: 'action', label: '建議動作' }
          ],
          tableData: [
            { user: 'david.chen', dept: 'FinOps', anomaly: '非工作時間批次匯出薪資資料庫 (8.4 GB)', riskScore: 94, status: 'critical', action: '強制阻斷 Session' },
            { user: 'srv-backup-02', dept: 'Infrastructure', anomaly: '向未授權外部 IP 建立 SSH 反向通道', riskScore: 89, status: 'critical', action: '網段實體隔離' },
            { user: 'contractor-ext01', dept: 'External Vendor', anomaly: '登入密碼嘗試錯誤 18 次後突發提權', riskScore: 78, status: 'warning', action: '強制重設憑證' },
            { user: 'alice.wang', dept: 'DevOps', anomaly: '於全新未知地理位置簽發高權限 API Token', riskScore: 71, status: 'warning', action: '下發 MFA 驗證' },
          ]
        }
      },
      {
        id: 'w-top-talkers-flow',
        title: '高流量通訊端點 (NetFlow Top Talkers)',
        description: '深度封包分析流速異常與大檔案傳輸即時清單',
        type: 'network_flow',
        width: 'col-span-12',
        height: 'h-64',
        dataSource: 'Arkime / Moloch NDR Engine',
        customConfig: {
          tableData: [
            { source: '10.200.4.15 (DB-CLUSTER-01)', destination: '185.220.101.42 (Russia Tor Exit)', protocol: 'HTTPS / TLS 1.3', bytes: '4.8 GB', rate: '124 MB/s', status: 'CRITICAL ALERT' },
            { source: '172.16.8.99 (ENG-WS-24)', destination: '10.200.4.15 (DB-CLUSTER-01)', protocol: 'PostgreSQL 5432', bytes: '2.1 GB', rate: '45 MB/s', status: 'MONITORING' },
            { source: '192.168.10.45 (HR-LAPTOP-08)', destination: '142.250.190.46 (Google Drive)', protocol: 'HTTPS 443', bytes: '1.4 GB', rate: '18 MB/s', status: 'AUTHORIZED' },
            { source: '10.100.2.80 (CORE-GW-01)', destination: '8.8.8.8 (Google DNS)', protocol: 'DNS 53 (UDP)', bytes: '680 MB', rate: '4.2 MB/s', status: 'NORMAL' },
          ]
        }
      }
    ]
  },
  {
    id: 'dash-ransomware-warroom',
    name: 'Ransomware & Lateral Movement War Room',
    description: '專為防堵勒索軟體擴散、大量檔案加密偵測、金鑰伺服器阻斷及蜂巢蜜罐誘捕設立之戰情室',
    category: 'Incident Response',
    author: 'Incident Commander',
    lastModified: '2026-09-07 16:45',
    tags: ['Ransomware', 'Lateral-Movement', 'EDR-Isolation', 'Decoy'],
    widgets: [
      {
        id: 'w-file-entropy-spike',
        title: '檔案高熵值 (Entropy) 快速加密警報',
        description: '端點快速批量寫入加密副檔名 (.lockbit, .blackcat)',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'EDR Behavioral Agent',
        color: '#ef4444',
        customConfig: {
          statValue: '2 處節點',
          statChange: 'Rapid containment activated',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          unit: '',
          chartData: [
            { time: '09:00', value: 0 },
            { time: '09:30', value: 0 },
            { time: '10:00', value: 1 },
            { time: '10:30', value: 2 },
            { time: '11:00', value: 2 },
          ]
        }
      },
      {
        id: 'w-honeytoken-triggers',
        title: '蜜罐金鑰與誘餌 (Honeytoken) 觸發',
        description: '虛假特權憑證與 Canary 偽裝檔案之存取告警',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'Deception Grid',
        color: '#f97316',
        customConfig: {
          statValue: '4 次觸發',
          statChange: 'Attacker IP traced: 10.12.4.88',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          unit: '次',
          chartData: [
            { time: '09:00', value: 0 },
            { time: '09:30', value: 1 },
            { time: '10:00', value: 2 },
            { time: '10:30', value: 4 },
            { time: '11:00', value: 4 },
          ]
        }
      },
      {
        id: 'w-edr-isolation-status',
        title: '受害端點網路隔離合規率',
        description: '自動下發 SOAR 劇本執行主機網卡虛擬隔離之成功比率',
        type: 'gauge',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'SOAR Active Response',
        color: '#10b981',
        customConfig: {
          gaugeValue: 100,
          gaugeMax: 100,
          gaugeLabel: '已全數完成隔離遏止 (2/2 Hosts)'
        }
      },
      {
        id: 'w-lateral-attack-types',
        title: '橫向移動技法分佈 (ATT&CK T1021 / T1075)',
        description: '內網橫向滲透主要手法統計 (SMB Exec, WinRM, WMI, PsExec)',
        type: 'timeseries_bar',
        width: 'col-span-8',
        height: 'h-80',
        dataSource: 'Sysmon & AD Audit',
        customConfig: {
          showLegend: true,
          seriesKeys: [
            { key: 'smb', name: 'SMB / Named Pipes (T1021.002)', color: '#ef4444' },
            { key: 'wmi', name: 'WMI 遠端呼叫 (T1047)', color: '#f97316' },
            { key: 'winrm', name: 'PowerShell WinRM (T1021.006)', color: '#eab308' },
            { key: 'psexec', name: 'PsExec 遠端服務派送', color: '#3b82f6' }
          ],
          chartData: [
            { time: '08:00', smb: 2, wmi: 1, winrm: 0, psexec: 0 },
            { time: '09:00', smb: 5, wmi: 3, winrm: 1, psexec: 0 },
            { time: '10:00', smb: 14, wmi: 8, winrm: 4, psexec: 2 },
            { time: '11:00', smb: 9, wmi: 5, winrm: 2, psexec: 1 },
          ]
        }
      },
      {
        id: 'w-killchain-quarantine-table',
        title: '被入侵主機隔離清單與數位鑑識快照',
        description: '受感染端點之 RAM Memory Dump 及網路拓撲斷網標記',
        type: 'table',
        width: 'col-span-4',
        height: 'h-80',
        dataSource: 'EDR Agent Fleet',
        customConfig: {
          tableColumns: [
            { key: 'host', label: '主機名 / IP', isMono: true },
            { key: 'os', label: 'OS / 平台' },
            { key: 'state', label: '隔離狀態' },
            { key: 'snapshot', label: 'RAM 快照' }
          ],
          tableData: [
            { host: 'WS-FINANCE-04\n192.168.4.12', os: 'Win11 23H2', state: '已隔離 (Isolated)', snapshot: '已封存 (16 GB)' },
            { host: 'SRV-FILE-MAIN\n10.200.1.20', os: 'Win Server 2022', state: '已隔離 (Isolated)', snapshot: '已封存 (64 GB)' },
            { host: 'WS-HR-MGR\n192.168.4.88', os: 'macOS Sonoma', state: '監視中 (Clean)', snapshot: '未觸發' },
          ]
        }
      }
    ]
  },
  {
    id: 'dash-k8s-cloud-security',
    name: 'Cloud & Multi-Cluster Kubernetes Telemetry',
    description: '多雲架構（AWS / GCP / Azure）與 K8s 容器安全、Pod 提權逃逸與 Ingress 監控',
    category: 'Cloud & K8s',
    author: 'Cloud SecOps Lead',
    lastModified: '2026-09-06 14:10',
    tags: ['Kubernetes', 'AWS', 'GCP', 'Pod-Security', 'Ingress'],
    widgets: [
      {
        id: 'w-k8s-privileged-pods',
        title: '特權容器 (Privileged Pod) 突發',
        description: '未符合 CIS Benchmark 之 root 容器執行執行個體',
        type: 'stat',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'Falco Cloud Engine',
        color: '#f97316',
        customConfig: {
          statValue: '2 Pods',
          statChange: 'DaemonSet: kube-proxy-audit',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          chartData: [
            { time: '1', value: 1 },
            { time: '2', value: 1 },
            { time: '3', value: 2 },
            { time: '4', value: 2 },
          ]
        }
      },
      {
        id: 'w-k8s-api-denials',
        title: 'Kube-API Server 授權被拒 (403 RBAC)',
        description: 'ServiceAccount 試圖讀取跨命名空間 Secret 憑證之違規次數',
        type: 'stat',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'Kube-Audit Logs',
        color: '#ef4444',
        customConfig: {
          statValue: '124 次',
          statChange: '+34 from prod-cluster-tokyo',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          chartData: [
            { time: '1', value: 20 },
            { time: '2', value: 45 },
            { time: '3', value: 80 },
            { time: '4', value: 124 },
          ]
        }
      },
      {
        id: 'w-k8s-cis-compliance',
        title: 'Kubernetes CIS 合規率 (Security Posture)',
        description: '跨 5 大叢集之 K8s 硬化基準檢查通過百分比',
        type: 'gauge',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'Kube-Bench Scanner',
        color: '#3b82f6',
        customConfig: {
          gaugeValue: 88,
          gaugeMax: 100,
          gaugeLabel: '88% 合規 (41/46 Rules Passed)'
        }
      },
      {
        id: 'w-k8s-egress-exfil',
        title: '容器外部異常連線 (Cluster Egress)',
        description: 'Pod 直接與未知外部 IP 建立未加密 TCP 通道',
        type: 'stat',
        width: 'col-span-3',
        height: 'h-52',
        dataSource: 'Cilium eBPF Stream',
        color: '#eab308',
        customConfig: {
          statValue: '1 連線',
          statChange: 'Target: 91.240.118.52',
          statTrend: 'neutral',
          alertThresholdExceeded: false,
          showSparkline: true,
          chartData: [
            { time: '1', value: 0 },
            { time: '2', value: 0 },
            { time: '3', value: 1 },
            { time: '4', value: 1 },
          ]
        }
      },
      {
        id: 'w-k8s-ingress-latency-line',
        title: 'Ingress Controller 延遲與 HTTP 5xx 錯誤分佈 (APM 串流)',
        description: 'Apache SkyWalking APM 即時監測 API 閘道延遲與失敗請求',
        type: 'timeseries_line',
        width: 'col-span-12',
        height: 'h-80',
        dataSource: 'SkyWalking APM Agent',
        customConfig: {
          showLegend: true,
          seriesKeys: [
            { key: 'p99', name: 'P99 延遲 (ms)', color: '#ef4444' },
            { key: 'p90', name: 'P90 延遲 (ms)', color: '#f97316' },
            { key: 'avg', name: '平均延遲 (ms)', color: '#10b981' }
          ],
          chartData: [
            { time: '10:00', p99: 120, p90: 45, avg: 18 },
            { time: '10:15', p99: 145, p90: 52, avg: 22 },
            { time: '10:30', p99: 380, p90: 110, avg: 42 }, // spike
            { time: '10:45', p99: 210, p90: 68, avg: 28 },
            { time: '11:00', p99: 130, p90: 48, avg: 19 },
          ]
        }
      }
    ]
  },
  {
    id: 'dash-zero-trust-identity',
    name: 'Zero Trust & Identity Sentinel',
    description: '身分安全監控、MFA 疲勞攻擊、不可行旅程 (Impossible Travel) 及特權提升審計',
    category: 'Zero Trust',
    author: 'Identity Architect',
    lastModified: '2026-09-05 09:15',
    tags: ['Zero-Trust', 'IAM', 'MFA', 'Okta', 'Active-Directory'],
    widgets: [
      {
        id: 'w-mfa-fatigue-hud',
        title: 'MFA 疲勞攻擊警報 (Push Bombing)',
        description: '單一帳號在 5 分鐘內遭受超過 10 次連續推播核准請求',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'Okta / Azure AD Logs',
        color: '#ef4444',
        customConfig: {
          statValue: '1 帳號',
          statChange: 'Account temporarily locked',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          chartData: [
            { time: '1', value: 0 },
            { time: '2', value: 2 },
            { time: '3', value: 11 },
            { time: '4', value: 1 },
          ]
        }
      },
      {
        id: 'w-impossible-travel',
        title: '跨國不可行旅程 (Impossible Travel)',
        description: '登入地理坐標變更速度超過每小時 800 公里之異常鑑識',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'Global Identity Gateway',
        color: '#f97316',
        customConfig: {
          statValue: '2 案例',
          statChange: 'TW -> Netherlands in 12m',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          chartData: [
            { time: '1', value: 0 },
            { time: '2', value: 1 },
            { time: '3', value: 2 },
            { time: '4', value: 2 },
          ]
        }
      },
      {
        id: 'w-service-account-anomalies',
        title: '服務帳號互動式登入違規',
        description: '禁止人類互動式登入之系統服務帳號 (Service Accounts)',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'AD Event 4624 / Type 2',
        color: '#eab308',
        customConfig: {
          statValue: '0 違規',
          statChange: '100% Policy Enforced',
          statTrend: 'neutral',
          alertThresholdExceeded: false,
          showSparkline: true,
          chartData: [
            { time: '1', value: 0 },
            { time: '2', value: 0 },
            { time: '3', value: 0 },
            { time: '4', value: 0 },
          ]
        }
      },
      {
        id: 'w-auth-source-pie',
        title: '全網多因子驗證 (MFA) 驗證協議分佈',
        description: 'FIDO2 WebAuthn、TOTP Authenticator、Push 及 SMS 分佈',
        type: 'donut',
        width: 'col-span-6',
        height: 'h-80',
        dataSource: 'Identity Provider Matrix',
        customConfig: {
          showLegend: true,
          chartData: [
            { name: 'FIDO2 / YubiKey 硬體金鑰', value: 58, color: '#10b981' },
            { name: 'App TOTP 動態密碼', value: 26, color: '#3b82f6' },
            { name: '行動裝置 Push 授權', value: 12, color: '#f97316' },
            { name: '遺留 SMS (即將退役)', value: 4, color: '#ef4444' },
          ]
        }
      },
      {
        id: 'w-suspicious-sessions-table',
        title: '即時高風險 Session 終止與防護佇列',
        description: '支援管理員立即一鍵 Revoke Token 與強制作廢 Cookie',
        type: 'table',
        width: 'col-span-6',
        height: 'h-80',
        dataSource: 'Zero Trust Broker',
        customConfig: {
          tableColumns: [
            { key: 'user', label: '使用者名稱', isMono: true },
            { key: 'ip', label: '連線來源 IP' },
            { key: 'country', label: '地理定位' },
            { key: 'reason', label: '觸發原因' },
            { key: 'action', label: '處置' }
          ],
          tableData: [
            { user: 'michael.lee@corp.local', ip: '185.220.100.241', country: 'NL (Tor Exit)', reason: 'Anonymous Proxy Flagged', action: '已撤回 Session' },
            { user: 'sarah.wu@corp.local', ip: '194.26.29.112', country: 'DE (Frankfurt)', reason: 'Token Replay Detected', action: '已撤回 Session' },
            { user: 'admin-temp@corp.local', ip: '203.74.112.5', country: 'TW (Taipei)', reason: 'Non-compliant Device', action: '隔離查驗中' },
          ]
        }
      }
    ]
  },
  {
    id: 'dash-network-deep-packet',
    name: 'Network Deep Packet Flow & Perimeter Defense',
    description: '深度封包分析 (DPI)、DNS 穿透與 DGA 網域名稱、TLS 異常加密指紋監控',
    category: 'Network & Flow',
    author: 'Network Security Lead',
    lastModified: '2026-09-04 18:20',
    tags: ['NetFlow', 'Arkime', 'Suricata', 'DPI', 'Perimeter'],
    widgets: [
      {
        id: 'w-dns-tunneling',
        title: 'DNS 穿透通道與 DGA 網域偵測',
        description: 'TXT 記錄高容量封裝與偽隨機生成網域名稱請求',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'Zeek DNS Analyzer',
        color: '#ef4444',
        customConfig: {
          statValue: '2 域名',
          statChange: 'Sinkholed by DNS Firewall',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          chartData: [
            { time: '1', value: 0 },
            { time: '2', value: 0 },
            { time: '3', value: 1 },
            { time: '4', value: 2 },
          ]
        }
      },
      {
        id: 'w-ja3-fingerprint-mismatch',
        title: 'TLS JA3/JA4 指紋異常雜湊',
        description: '偽裝成一般瀏覽器但 JA3 雜湊比對為惡意 Cobalt Strike 載荷',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'Suricata TLS Engine',
        color: '#f97316',
        customConfig: {
          statValue: '5 筆命中',
          statChange: 'Matches C2 Threat Intel DB',
          statTrend: 'up',
          alertThresholdExceeded: true,
          showSparkline: true,
          chartData: [
            { time: '1', value: 1 },
            { time: '2', value: 2 },
            { time: '3', value: 3 },
            { time: '4', value: 5 },
          ]
        }
      },
      {
        id: 'w-ddos-rate-pps',
        title: '邊界防護清洗流量 (Scrubbed Bandwidth)',
        description: 'BGP Anycast 防禦中心即時攔截丟棄之洪水流量',
        type: 'stat',
        width: 'col-span-4',
        height: 'h-52',
        dataSource: 'Border Edge BGP Center',
        color: '#10b981',
        customConfig: {
          statValue: '1.2 Gbps',
          statChange: '99.8% Cleaned at Edge',
          statTrend: 'neutral',
          alertThresholdExceeded: false,
          showSparkline: true,
          chartData: [
            { time: '1', value: 0.8 },
            { time: '2', value: 1.1 },
            { time: '3', value: 1.4 },
            { time: '4', value: 1.2 },
          ]
        }
      },
      {
        id: 'w-l7-protocols-donut',
        title: '第七層 (Layer-7) 應用層協定頻寬佔比',
        description: '深度通訊協定識別 (DPI) 解析分佈',
        type: 'donut',
        width: 'col-span-6',
        height: 'h-80',
        dataSource: 'Palo Alto App-ID / Arkime',
        customConfig: {
          showLegend: true,
          chartData: [
            { name: 'SSL / TLS (HTTPS)', value: 62, color: '#3b82f6' },
            { name: 'SSH / SFTP', value: 14, color: '#10b981' },
            { name: 'Database RPC (Postgres/TDS)', value: 12, color: '#8b5cf6' },
            { name: 'DNS / NTP Infrastructure', value: 8, color: '#f59e0b' },
            { name: 'Unknown / Suspicious P2P', value: 4, color: '#ef4444' },
          ]
        }
      },
      {
        id: 'w-perimeter-blocked-ips',
        title: '邊界防火牆即時阻斷 IP 統計 (Null-Routed)',
        description: '與邊界 Fortinet / Cisco 防火牆聯防即時封鎖黑名單',
        type: 'table',
        width: 'col-span-6',
        height: 'h-80',
        dataSource: 'Edge Firewall Syslog',
        customConfig: {
          tableColumns: [
            { key: 'ip', label: '惡意來源 IP', isMono: true },
            { key: 'geo', label: '地理 / 國家' },
            { key: 'hits', label: '攔截次數' },
            { key: 'rule', label: '命中防禦規則' }
          ],
          tableData: [
            { ip: '185.196.220.14', geo: 'BG (Bulgaria)', hits: '4,892 次', rule: 'RULE-BRUTE-FORCE-SSH' },
            { ip: '45.154.255.89', geo: 'RU (Russia)', hits: '2,310 次', rule: 'RULE-CVE-2024-LOG4J' },
            { ip: '103.145.13.2', geo: 'VN (Vietnam)', hits: '1,450 次', rule: 'RULE-SCAN-PORT-445' },
            { ip: '91.240.118.52', geo: 'UA (Ukraine)', hits: '890 次', rule: 'RULE-TOR-EXIT-NODE' },
          ]
        }
      }
    ]
  }
];

export const AVAILABLE_DATA_SOURCES = [
  { id: 'VictoriaLogs', name: 'VictoriaLogs Engine', type: 'High-speed Log Index' },
  { id: 'Loki', name: 'Grafana Loki Stream', type: 'Distributed Log Aggregator' },
  { id: 'OpenSearch', name: 'OpenSearch / Elastic SIEM', type: 'Search & Analytics' },
  { id: 'SkyWalking', name: 'Apache SkyWalking APM', type: 'APM Observability & Tracing' },
  { id: 'Arkime', name: 'Arkime Full Packet Capture', type: 'DPI & NetFlow Engine' },
  { id: 'Suricata', name: 'Suricata / Zeek NDR', type: 'Network Detection & Response' },
  { id: 'Falco', name: 'Falco Cloud Workload Protection', type: 'eBPF Runtime Security' },
  { id: 'Okta', name: 'Okta / Azure AD Identity Gateway', type: 'Identity & Access Logs' },
];

export const TIME_RANGE_OPTIONS = [
  { id: '5m', label: '過去 5 分鐘 (Last 5m)' },
  { id: '15m', label: '過去 15 分鐘 (Last 15m)' },
  { id: '1h', label: '過去 1 小時 (Last 1h)' },
  { id: '6h', label: '過去 6 小時 (Last 6h)' },
  { id: '24h', label: '過去 24 小時 (Last 24h)' },
  { id: '7d', label: '過去 7 天 (Last 7d)' },
  { id: '30d', label: '過去 30 天 (Last 30d)' },
];

export const CLUSTER_OPTIONS = [
  { id: 'all', label: '所有叢集節點 (All Federated CCS Clusters)' },
  { id: 'tp-primary', label: '台北核心叢集 (Taipei Primary - IDC)' },
  { id: 'ty-worker-01', label: '東京邊緣運算 (Tokyo Worker-01 - AWS)' },
  { id: 'fr-worker-02', label: '法蘭克福運算 (Frankfurt Worker-02 - Azure)' },
  { id: 'sv-worker-03', label: '矽谷雲端運算 (Silicon Valley - GCP)' },
];

export const REFRESH_OPTIONS = [
  { value: 0, label: '關閉 (Off)' },
  { value: 5, label: '5 秒 (5s)' },
  { value: 10, label: '10 秒 (10s)' },
  { value: 30, label: '30 秒 (30s)' },
  { value: 60, label: '1 分鐘 (60s)' },
  { value: 300, label: '5 分鐘 (5m)' },
];

import { PanelTemplateMeta, DataSourceItem, PresetVisualization, PanelConfig } from './types';

export const PANEL_TEMPLATES_CATALOG: PanelTemplateMeta[] = [
  // Trends
  {
    id: 'Time Series',
    name: 'Time Series 時間序列',
    category: 'trends',
    categoryLabel: '趨勢與時間序列',
    iconName: 'Activity',
    description: '高維度時間序列趨勢折線/面積圖，支援多指標對比與動態警戒線',
    badge: '最常用',
    recommendedDataSource: 'Prometheus'
  },
  {
    id: 'Status History',
    name: 'Status History 狀態歷史矩陣',
    category: 'trends',
    categoryLabel: '趨勢與時間序列',
    iconName: 'History',
    description: '服務節點與核心探針 24 小時健康狀態時間格狀圖 (Uptime SLA)',
    recommendedDataSource: 'VictoriaLogs'
  },
  {
    id: 'Candlestick',
    name: 'Candlestick 波動K線圖',
    category: 'trends',
    categoryLabel: '趨勢與時間序列',
    iconName: 'BarChart3',
    description: '網路延遲與流量封包波段震盪分析 (Open-High-Low-Close)',
    recommendedDataSource: 'ClickHouse'
  },

  // Metrics
  {
    id: 'Stat',
    name: 'Stat 核心指標卡',
    category: 'metrics',
    categoryLabel: '指標統計與總覽',
    iconName: 'TrendingUp',
    description: '大字號即時數值摘要、歷史火花線 (Sparkline) 與增減百分比',
    badge: 'HUD必備',
    recommendedDataSource: 'Prometheus'
  },
  {
    id: 'Gauge',
    name: 'Gauge 儀錶指針量錶',
    category: 'metrics',
    categoryLabel: '指標統計與總覽',
    iconName: 'Zap',
    description: '多階漸層儀表盤，直觀呈現 CPU、記憶體或頻寬利用率臨界值',
    recommendedDataSource: 'Prometheus'
  },

  // Distribution
  {
    id: 'Bar Chart',
    name: 'Bar Chart 長條圖',
    category: 'distribution',
    categoryLabel: '比例與分類分佈',
    iconName: 'BarChart3',
    description: '分類屬性與協定佔比對比 (可水平/垂直堆疊)',
    recommendedDataSource: 'Elasticsearch'
  },
  {
    id: 'Pie Chart',
    name: 'Pie / Donut 圓餅環狀圖',
    category: 'distribution',
    categoryLabel: '比例與分類分佈',
    iconName: 'PieChart',
    description: '資安威脅等級分佈與流量協定比例圓餅圖',
    recommendedDataSource: 'Arkime'
  },
  {
    id: 'Heatmap',
    name: 'Heatmap 密度熱力圖',
    category: 'distribution',
    categoryLabel: '比例與分類分佈',
    iconName: 'LayoutGrid',
    description: '7 天 x 24 小時時段攻擊密集度分佈熱點圖',
    recommendedDataSource: 'VictoriaLogs'
  },
  {
    id: 'Radar',
    name: 'Radar 多維雷達圖',
    category: 'distribution',
    categoryLabel: '比例與分類分佈',
    iconName: 'Target',
    description: '多維資安態勢成熟度 (端點、網路、身分、雲端、工控)',
    recommendedDataSource: 'Elasticsearch'
  },

  // Logs & Alerts
  {
    id: 'Table',
    name: 'Table 結構化資料表',
    category: 'logs_alerts',
    categoryLabel: '安全日誌與事件',
    iconName: 'List',
    description: '高密度檢索清單，支援排序、篩選、IP標註與嚴重度徽章',
    recommendedDataSource: 'VictoriaLogs'
  },
  {
    id: 'Logs',
    name: 'Logs 串流日誌終端',
    category: 'logs_alerts',
    categoryLabel: '安全日誌與事件',
    iconName: 'Terminal',
    description: '即時滾動 SOC 串流日誌視窗，色彩語法醒目提示與即時搜尋',
    badge: '即時串流',
    recommendedDataSource: 'VictoriaLogs'
  },
  {
    id: 'Alert List',
    name: 'Alert List 即時警報列表',
    category: 'logs_alerts',
    categoryLabel: '安全日誌與事件',
    iconName: 'Bell',
    description: '觸發中之動態資安警報、分級處置狀態與 SOAR 一鍵聯動',
    recommendedDataSource: 'Elasticsearch'
  },
  {
    id: 'Geomap',
    name: 'Geomap 全球地理分佈',
    category: 'logs_alerts',
    categoryLabel: '安全日誌與事件',
    iconName: 'Globe',
    description: '全球惡意 C2 連線來源與 Ingress 攻擊航線動態分佈',
    recommendedDataSource: 'Arkime'
  },

  // Topology & Traces
  {
    id: 'Node Graph',
    name: 'Node Graph 攻擊關聯拓撲',
    category: 'topology_traces',
    categoryLabel: '關聯拓撲與分散式追蹤',
    iconName: 'Network',
    description: '攻擊者 IP、外部負載平衡器、微服務與資料庫節點流向拓撲',
    recommendedDataSource: 'EDR Stream'
  },
  {
    id: 'Traces',
    name: 'Traces 分散式呼叫鏈',
    category: 'topology_traces',
    categoryLabel: '關聯拓撲與分散式追蹤',
    iconName: 'Workflow',
    description: '微服務呼叫鏈跨度 (Spans) 時間軸與 API 耗時分析瀑布圖',
    recommendedDataSource: 'Datadog'
  },
  {
    id: 'Flame Graph',
    name: 'Flame Graph 火焰圖',
    category: 'topology_traces',
    categoryLabel: '關聯拓撲與分散式追蹤',
    iconName: 'Activity',
    description: '安全引擎執行緒堆疊取樣與正規表示式解碼消耗剖析',
    recommendedDataSource: 'Prometheus'
  },

  // Specialized
  {
    id: 'Text',
    name: 'Text / Markdown 資訊看板',
    category: 'specialized',
    categoryLabel: '自由畫布與擴充',
    iconName: 'FileText',
    description: 'SOC 應變標準作業程序 (SOP)、交接便簽與動態變數 Markdown',
    recommendedDataSource: 'None'
  },
  {
    id: 'Canvas',
    name: 'Canvas 自由拓撲畫布',
    category: 'specialized',
    categoryLabel: '自由畫布與擴充',
    iconName: 'Layout',
    description: '自由拖拉節點、自訂架構圖與自律防禦標籤繪製板',
    recommendedDataSource: 'None'
  },
  {
    id: 'News',
    name: 'News CTI 情資摘要流',
    category: 'specialized',
    categoryLabel: '自由畫布與擴充',
    iconName: 'Globe',
    description: '即時外部威脅情資 RSS/JSON 摘要 (CVE / MITRE / ExploitDB)',
    recommendedDataSource: 'None'
  },
  {
    id: 'Dashboard List',
    name: 'Dashboard List 儀錶板捷徑',
    category: 'specialized',
    categoryLabel: '自由畫布與擴充',
    iconName: 'Layers',
    description: '跨部門儀錶板目錄索引與星號收藏夾快速切換面板',
    recommendedDataSource: 'None'
  },
  {
    id: 'Plugin',
    name: 'Plugin 自訂擴充元件',
    category: 'specialized',
    categoryLabel: '自由畫布與擴充',
    iconName: 'Package',
    description: '載入 WebAssembly 或 React 封裝的私有資安演算法視覺化外掛',
    recommendedDataSource: 'Custom'
  }
];

export const INITIAL_DATA_SOURCES: DataSourceItem[] = [
  {
    id: 'ds-victorialogs',
    name: 'VictoriaLogs Enterprise',
    type: 'victorialogs',
    icon: 'Database',
    endpoint: 'https://vlogs.corp.internal:9428/select/logsql/query',
    status: 'connected',
    latencyMs: 12,
    indexPattern: 'soc-logs-*',
    description: '每秒百萬級安全日誌全文儲存與 LogQL 串流引擎',
    authType: 'BEARER_TOKEN',
    tlsVerify: true,
    cacheTtlSec: 15,
    activeQueriesCount: 6
  },
  {
    id: 'ds-prometheus',
    name: 'Prometheus HA Core',
    type: 'prometheus',
    icon: 'Activity',
    endpoint: 'https://prom-prod.internal:9090/api/v1',
    status: 'connected',
    latencyMs: 8,
    description: '主機探針、eBPF 核心感測器與網路頻寬時間序列度量',
    authType: 'BEARER_TOKEN',
    tlsVerify: true,
    cacheTtlSec: 10,
    activeQueriesCount: 14
  },
  {
    id: 'ds-arkime',
    name: 'Arkime Full Packet Capture',
    type: 'arkime',
    icon: 'Shield',
    endpoint: 'https://arkime-pcap.soc.internal:8005/api',
    status: 'connected',
    latencyMs: 34,
    indexPattern: 'sessions3-*',
    description: '全流量深度封包檢視 (DPI) 與網路會話 SPI 索引庫',
    authType: 'API_KEY',
    tlsVerify: true,
    cacheTtlSec: 30,
    activeQueriesCount: 3
  },
  {
    id: 'ds-elasticsearch',
    name: 'OpenSearch SIEM DataLake',
    type: 'elasticsearch',
    icon: 'Layers',
    endpoint: 'https://es-cluster.corp.internal:9200',
    status: 'connected',
    latencyMs: 19,
    indexPattern: 'wazuh-alerts-*,suricata-*',
    description: 'SIEM 事件關聯分析庫與 MITRE ATT&CK 告警索引',
    authType: 'BASIC_AUTH',
    tlsVerify: true,
    cacheTtlSec: 20,
    activeQueriesCount: 9
  },
  {
    id: 'ds-edr-stream',
    name: 'EDR Agent Realtime Stream',
    type: 'edr_stream',
    icon: 'Radio',
    endpoint: 'wss://edr-gateway.corp.internal:8443/stream',
    status: 'connected',
    latencyMs: 14,
    description: '端點 Agent 行為遙測、進程注入與記憶體掃描即時事件通道',
    authType: 'API_KEY',
    tlsVerify: true,
    cacheTtlSec: 5,
    activeQueriesCount: 4
  },
  {
    id: 'ds-cloudwatch',
    name: 'AWS CloudWatch & GuardDuty',
    type: 'cloudwatch',
    icon: 'Cloud',
    endpoint: 'https://monitoring.ap-northeast-1.amazonaws.com',
    status: 'connected',
    latencyMs: 65,
    description: '雲端 VPC Flow Logs、IAM 異動與 S3 異常存取日誌',
    authType: 'IAM_ROLE',
    tlsVerify: true,
    cacheTtlSec: 60,
    activeQueriesCount: 2
  },
  {
    id: 'ds-clickhouse',
    name: 'ClickHouse OLAP Analytics',
    type: 'clickhouse',
    icon: 'Cpu',
    endpoint: 'https://clickhouse.corp.internal:8123',
    status: 'connected',
    latencyMs: 16,
    description: '十億級網路連線 Session 聚合與快速多維度 SQL 交叉分析',
    authType: 'BASIC_AUTH',
    tlsVerify: true,
    cacheTtlSec: 30,
    activeQueriesCount: 5
  },
  {
    id: 'ds-datadog',
    name: 'Datadog APM & Traces',
    type: 'datadog',
    icon: 'Workflow',
    endpoint: 'https://api.datadoghq.com/api/v2',
    status: 'degraded',
    latencyMs: 145,
    description: '微服務分散式 Trace 跨度與呼叫延遲監控',
    authType: 'API_KEY',
    tlsVerify: true,
    cacheTtlSec: 45,
    activeQueriesCount: 1
  }
];

export const PRESET_VISUALIZATIONS: PresetVisualization[] = [
  {
    id: 'preset-ddos-bandwidth',
    name: 'DDoS 頻寬負載與阻斷流量趨勢',
    category: '網路與流量防護',
    description: '監控邊界 Ingress 總頻寬、清洗後流量與惡意封包丟棄速率 (Mbps)',
    template: 'Time Series',
    dataSource: 'VictoriaLogs Enterprise',
    tags: ['DDoS', 'Traffic', 'Ingress', 'Mitigation'],
    previewMetric: '1,420 Mbps Ingress / 89 Mbps Dropped',
    config: {
      title: 'DDoS 邊界頻寬負載與自動清洗即時趨勢',
      subtitle: 'Edge Gateway Ingress vs Clean Traffic vs Dropped',
      display: {
        graphType: 'area',
        lineInterpolation: 'smooth',
        strokeWidth: 2,
        fillOpacity: 28,
        showPoints: false,
        pointRadius: 3,
        stacked: false,
        colorPalette: 'cyber-blue',
        showGrid: true,
        gradientFill: true,
        transparentBackground: false,
        cardBorderGlow: true
      },
      thresholds: {
        enabled: true,
        mode: 'absolute',
        displayStyle: 'dashed',
        levels: [
          { id: 'th-1', label: '正常防護線', value: 800, color: '#10b981' },
          { id: 'th-2', label: '清洗觸發線', value: 1200, color: '#f59e0b' },
          { id: 'th-3', label: '頻寬飽和危急線', value: 1800, color: '#ef4444' }
        ]
      },
      axis: {
        yFormat: 'bits_sec',
        yMin: 0,
        yMax: 2000,
        decimals: 1,
        showLegend: true,
        legendPosition: 'bottom',
        legendStats: ['current', 'max', 'avg'],
        tooltipMode: 'all'
      }
    }
  },
  {
    id: 'preset-geomap-threats',
    name: '全球惡意 IP 攻擊來源地理航線圖',
    category: '威脅情報與地理分析',
    description: '視覺化描繪針對企業核心資料中心之跨國 C2 回連與掃描來源',
    template: 'Geomap',
    dataSource: 'Arkime Full Packet Capture',
    tags: ['Geomap', 'C2', 'Global', 'Threat-Intel'],
    previewMetric: '84 個攻擊源國家 / 4,320 次連線嘗試',
    config: {
      title: '全球惡意 C2 來源與 Ingress 攻擊航線分佈',
      subtitle: 'Real-time Global Threat Vectors Map',
      display: {
        graphType: 'line',
        lineInterpolation: 'smooth',
        strokeWidth: 2,
        fillOpacity: 40,
        showPoints: true,
        pointRadius: 4,
        stacked: false,
        colorPalette: 'crimson-alert',
        showGrid: false,
        gradientFill: true,
        transparentBackground: false,
        cardBorderGlow: true
      }
    }
  },
  {
    id: 'preset-gauge-cluster',
    name: 'SOC 核心分析叢集 CPU / 記憶體飽和度',
    category: '系統與基礎設施效能',
    description: '高精度量錶展示安全分析節點負載，提早預警處理器效能瓶頸',
    template: 'Gauge',
    dataSource: 'Prometheus HA Core',
    tags: ['Cluster', 'CPU', 'Capacity', 'SLA'],
    previewMetric: '84.2% CPU 負載 / 臨界警戒',
    config: {
      title: '安全分析引擎核心叢集負載量錶',
      subtitle: 'Cluster Resource Saturation & CPU Allocation',
      display: {
        graphType: 'bar',
        lineInterpolation: 'smooth',
        strokeWidth: 2,
        fillOpacity: 50,
        showPoints: false,
        pointRadius: 3,
        stacked: false,
        colorPalette: 'amber-warning',
        showGrid: true,
        gradientFill: true,
        transparentBackground: false,
        cardBorderGlow: true
      },
      thresholds: {
        enabled: true,
        mode: 'percentage',
        displayStyle: 'fill',
        levels: [
          { id: 'th-1', label: '正常負載', value: 65, color: '#10b981' },
          { id: 'th-2', label: '高負載預警', value: 80, color: '#f59e0b' },
          { id: 'th-3', label: '超限危險', value: 90, color: '#ef4444' }
        ]
      }
    }
  },
  {
    id: 'preset-live-logs',
    name: 'EDR 端點可疑進程建立日誌串流',
    category: '安全日誌與事件',
    description: '實時監控 Windows / Linux 端點未授權 PowerShell、Bash 與提權日誌',
    template: 'Logs',
    dataSource: 'VictoriaLogs Enterprise',
    tags: ['EDR', 'Logs', 'Process', 'Audit'],
    previewMetric: '280 筆/秒 即時滾動串流',
    config: {
      title: '端點即時進程建立與命令列稽核日誌',
      subtitle: 'Live EDR Endpoint Process Execution Stream',
      display: {
        graphType: 'line',
        lineInterpolation: 'smooth',
        strokeWidth: 1,
        fillOpacity: 20,
        showPoints: false,
        pointRadius: 2,
        stacked: false,
        colorPalette: 'emerald-defense',
        showGrid: false,
        gradientFill: false,
        transparentBackground: false,
        cardBorderGlow: false
      }
    }
  },
  {
    id: 'preset-mitre-breakdown',
    name: 'MITRE ATT&CK 戰術告警分佈長條圖',
    category: 'MITRE 框架與合規',
    description: '橫向展示過去 24 小時偵測到之各 ATT&CK 戰術分類告警量',
    template: 'Bar Chart',
    dataSource: 'OpenSearch SIEM DataLake',
    tags: ['MITRE', 'ATT&CK', 'TTPs', 'Compliance'],
    previewMetric: 'Defense Evasion (342) / Initial Access (285)',
    config: {
      title: 'MITRE ATT&CK 戰術類別告警頻率長條圖',
      subtitle: 'ATT&CK Tactics Distribution in Last 24 Hours',
      display: {
        graphType: 'bar',
        lineInterpolation: 'linear',
        strokeWidth: 1,
        fillOpacity: 85,
        showPoints: false,
        pointRadius: 2,
        stacked: false,
        colorPalette: 'high-contrast-neon',
        showGrid: true,
        gradientFill: true,
        transparentBackground: false,
        cardBorderGlow: true
      }
    }
  },
  {
    id: 'preset-heatmap-hours',
    name: '全週攻擊密度時間熱力圖 (7x24h)',
    category: '威脅情報與地理分析',
    description: '以小時與星期為軸，快速辨識駭客集團規律性攻擊與非上班時間突刺',
    template: 'Heatmap',
    dataSource: 'VictoriaLogs Enterprise',
    tags: ['Heatmap', 'Time-Density', 'Pattern-Analysis'],
    previewMetric: '週二 03:00-05:00 突發異常集中峰值',
    config: {
      title: '每週資安事件發生時段與頻率熱力分佈',
      subtitle: 'Weekly Attack Ingress Density by Hour of Day',
      display: {
        graphType: 'area',
        lineInterpolation: 'step',
        strokeWidth: 1,
        fillOpacity: 60,
        showPoints: false,
        pointRadius: 2,
        stacked: false,
        colorPalette: 'amber-warning',
        showGrid: true,
        gradientFill: true,
        transparentBackground: false,
        cardBorderGlow: true
      }
    }
  }
];

export const DEFAULT_PANEL_CONFIG: PanelConfig = {
  id: 'panel-custom-viz-01',
  title: '網路邊界即時威脅流量與封包分析',
  subtitle: 'Network Perimeter Ingress / Egress Telemetry',
  description: '即時監控邊界防火牆與核心交換機通過之流量、可疑連線與被丟棄封包數量。',
  template: 'Time Series',
  dataSource: 'Prometheus HA Core',
  timeRange: '過去 1 小時 (Last 1 hour)',
  refreshInterval: '10s',
  display: {
    graphType: 'area',
    lineInterpolation: 'smooth',
    strokeWidth: 2,
    fillOpacity: 35,
    showPoints: false,
    pointRadius: 3,
    stacked: false,
    colorPalette: 'cyber-blue',
    showGrid: true,
    gradientFill: true,
    transparentBackground: false,
    cardBorderGlow: true
  },
  thresholds: {
    enabled: true,
    mode: 'absolute',
    displayStyle: 'dashed',
    levels: [
      { id: 'th-norm', label: '正常標準線', value: 450, color: '#10b981' },
      { id: 'th-warn', label: '警示警戒線', value: 800, color: '#f59e0b' },
      { id: 'th-crit', label: '臨界告警線', value: 1200, color: '#ef4444' }
    ]
  },
  axis: {
    yFormat: 'bits_sec',
    yMin: 0,
    yMax: 1500,
    decimals: 1,
    showLegend: true,
    legendPosition: 'bottom',
    legendStats: ['current', 'max', 'avg'],
    tooltipMode: 'all'
  },
  query: {
    mode: 'visual',
    queryLanguage: 'PromQL',
    metric: 'rate(network_traffic_bytes_total[5m]) * 8 / 1000000',
    aggregation: 'SUM',
    groupBy: 'direction, interface',
    timeBucket: '1m',
    filters: [
      { id: 'f-1', field: 'environment', operator: '=', value: 'production' },
      { id: 'f-2', field: 'device_role', operator: '=', value: 'perimeter-firewall' }
    ],
    rawCode: `sum by (direction) (\n  rate(network_traffic_bytes_total{env="production", role="firewall"}[5m]) * 8 / 1000000\n)`
  },
  transformations: [
    {
      id: 'trans-1',
      type: 'calculate_field',
      description: '位元組轉百萬位元 (Bytes -> Mbps)',
      active: true,
      params: { factor: 8, divideBy: 1000000 }
    },
    {
      id: 'trans-2',
      type: 'filter_value',
      description: '過濾心跳雜訊 (< 0.5 Mbps)',
      active: false,
      params: { min: 0.5 }
    }
  ],
  alert: {
    enabled: true,
    condition: 'IS_ABOVE',
    thresholdValue: 1200,
    duration: '3m',
    severity: 'critical',
    channels: ['slack', 'teams', 'pagerduty'],
    triggerSOARPlaybook: 'SOAR-PB-802: 邊界防火牆主動限流與黑名單阻斷'
  },
  updatedAt: '2026-09-08 09:30:00'
};

// Realistic mock telemetry series
export const MOCK_TIME_SERIES = [
  { time: '09:00', ingress: 420, egress: 210, dropped: 18, suspicious: 4 },
  { time: '09:05', ingress: 445, egress: 220, dropped: 22, suspicious: 6 },
  { time: '09:10', ingress: 480, egress: 235, dropped: 25, suspicious: 5 },
  { time: '09:15', ingress: 530, egress: 260, dropped: 38, suspicious: 12 },
  { time: '09:20', ingress: 710, egress: 310, dropped: 95, suspicious: 38 },
  { time: '09:25', ingress: 1180, egress: 420, dropped: 260, suspicious: 145 },
  { time: '09:30', ingress: 1350, egress: 450, dropped: 380, suspicious: 210 },
  { time: '09:35', ingress: 1220, egress: 410, dropped: 340, suspicious: 180 },
  { time: '09:40', ingress: 940, egress: 360, dropped: 190, suspicious: 92 },
  { time: '09:45', ingress: 680, egress: 290, dropped: 85, suspicious: 35 },
  { time: '09:50', ingress: 510, egress: 240, dropped: 30, suspicious: 14 },
  { time: '09:55', ingress: 460, egress: 225, dropped: 24, suspicious: 8 },
  { time: '10:00', ingress: 450, egress: 218, dropped: 20, suspicious: 6 }
];

export const MOCK_STAT_DATA = {
  currentValue: 1350,
  unit: 'Mbps',
  change: '+184.2%',
  trend: 'up',
  status: 'critical',
  subMetrics: [
    { label: '峰值流量 (Peak)', value: '1,420 Mbps', color: 'text-red-400' },
    { label: '平均流量 (Avg)', value: '685 Mbps', color: 'text-blue-400' },
    { label: '丟棄比率 (Drop %)', value: '28.1%', color: 'text-amber-400' },
    { label: 'SOAR 連動', value: '已啟動', color: 'text-emerald-400' }
  ],
  sparkline: [38, 42, 45, 55, 78, 120, 142, 130, 95, 68, 52, 46]
};

export const MOCK_TABLE_ROWS = [
  { id: '1', ip: '194.26.29.112', country: 'RU', protocol: 'TCP / HTTPS', port: '443', action: 'BLOCKED', severity: 'CRITICAL', events: 1420, rule: 'DDoS SYN-Flood 阻斷規則' },
  { id: '2', ip: '185.156.73.45', country: 'NL', protocol: 'TCP / SSH', port: '22', action: 'ISOLATED', severity: 'CRITICAL', events: 890, rule: 'SSH 暴力密碼字典探測' },
  { id: '3', ip: '103.145.13.2', country: 'VN', protocol: 'HTTP', port: '8080', action: 'ALERTED', severity: 'HIGH', events: 430, rule: 'Log4j / Spring4Shell 遠端漏洞利用' },
  { id: '4', ip: '45.154.255.89', country: 'SC', protocol: 'TCP / Modbus', port: '502', action: 'BLOCKED', severity: 'CRITICAL', events: 310, rule: '工控 PLC 未授權功能碼寫入' },
  { id: '5', ip: '198.51.100.44', country: 'US', protocol: 'DNS', port: '53', action: 'INSPECTED', severity: 'MEDIUM', events: 180, rule: '可疑 DNS Tunneling 資料外洩' },
  { id: '6', ip: '82.102.23.9', country: 'DE', protocol: 'TCP / SMB', port: '445', action: 'BLOCKED', severity: 'HIGH', events: 145, rule: 'EternalBlue SMBv1 探針掃描' }
];

export const MOCK_BAR_CATEGORIES = [
  { name: 'Initial Access', count: 285, prev: 210, fill: '#3b82f6' },
  { name: 'Execution', count: 194, prev: 150, fill: '#60a5fa' },
  { name: 'Persistence', count: 142, prev: 120, fill: '#10b981' },
  { name: 'Privilege Escalation', count: 238, prev: 160, fill: '#f59e0b' },
  { name: 'Defense Evasion', count: 342, prev: 280, fill: '#ef4444' },
  { name: 'Credential Access', count: 215, prev: 190, fill: '#ec4899' },
  { name: 'Command & Control', count: 180, prev: 130, fill: '#8b5cf6' }
];

export const MOCK_PIE_DISTRIBUTION = [
  { name: 'HTTPS (443)', value: 48, fill: '#3b82f6' },
  { name: 'DNS (53)', value: 22, fill: '#10b981' },
  { name: 'SSH (22)', value: 12, fill: '#f59e0b' },
  { name: 'Modbus/OT (502)', value: 8, fill: '#ef4444' },
  { name: 'SMB (445)', value: 6, fill: '#8b5cf6' },
  { name: 'Others', value: 4, fill: '#64748b' }
];

export const MOCK_HEATMAP_GRID = [
  { day: '週一', hours: [12, 8, 4, 3, 2, 5, 14, 35, 68, 85, 92, 78, 64, 70, 88, 95, 80, 60, 45, 30, 25, 20, 15, 10] },
  { day: '週二', hours: [15, 10, 8, 6, 8, 18, 42, 75, 95, 110, 140, 125, 90, 85, 98, 120, 95, 70, 50, 40, 32, 22, 18, 14] },
  { day: '週三', hours: [10, 6, 5, 4, 3, 12, 38, 70, 88, 90, 105, 95, 80, 75, 85, 92, 80, 65, 48, 35, 28, 19, 14, 11] },
  { day: '週四', hours: [14, 9, 7, 5, 6, 15, 45, 80, 102, 115, 128, 118, 92, 88, 105, 115, 90, 72, 55, 42, 30, 24, 16, 12] },
  { day: '週五', hours: [18, 12, 9, 8, 7, 20, 50, 92, 120, 135, 160, 145, 110, 105, 130, 150, 115, 85, 68, 52, 45, 35, 28, 20] },
  { day: '週六', hours: [25, 20, 18, 22, 30, 45, 60, 70, 75, 80, 85, 90, 95, 110, 125, 130, 105, 90, 75, 65, 55, 48, 38, 30] },
  { day: '週日', hours: [30, 28, 35, 40, 52, 65, 80, 85, 90, 95, 100, 105, 115, 130, 145, 160, 140, 115, 95, 80, 70, 58, 45, 35] }
];

export const MOCK_STREAM_LOGS = [
  { id: '1', time: '09:32:15.842', level: 'CRITICAL', source: 'Suricata-NDR', msg: 'ET EXPLOIT Apache Log4j JNDI RCE (CVE-2021-44228) from 103.145.13.2', host: 'fw-edge-01' },
  { id: '2', time: '09:32:14.210', level: 'WARN', source: 'Wazuh-Agent', msg: 'File integrity changed on /etc/shadow by UID 0 (hash mismatch)', host: 'dc-primary.internal' },
  { id: '3', time: '09:32:12.605', level: 'CRITICAL', source: 'SOAR-Engine', msg: 'Auto-playbook Triggered: IP 194.26.29.112 added to BGP blackhole route', host: 'soar-worker-03' },
  { id: '4', time: '09:32:10.144', level: 'INFO', source: 'eBPF-Sensor', msg: 'Inbound packet rate exceeded 120,000 pps, activating XDP filter drop', host: 'gw-ingress-02' },
  { id: '5', time: '09:32:08.921', level: 'ERROR', source: 'OT-Gateway', msg: 'Modbus TCP function 0x05 write coil to PLC-SUB-04 rejected: unauthorized client', host: 'ot-scada-gw' },
  { id: '6', time: '09:32:05.412', level: 'INFO', source: 'Auth-Audit', msg: 'Successful MFA sign-in for sec-admin-01 via FIDO2 token from internal network', host: 'auth-sso-node' }
];

export const MOCK_ALERT_LIST = [
  { id: 'ALT-9821', title: '大量未授權 SMBv1 探針掃描 (橫向移動嫌疑)', severity: 'critical', time: '2 分鐘前', source: 'Zeek NDR', status: '自動阻斷中' },
  { id: 'ALT-9820', title: 'PowerShell 執行混淆 Base64 下載腳本 (Living off the Land)', severity: 'critical', time: '6 分鐘前', source: 'EDR Agent', status: '待分析審核' },
  { id: 'ALT-9819', title: '跨地理區域異常連續登入失敗 (密碼噴灑攻擊)', severity: 'warning', time: '14 分鐘前', source: 'Azure AD', status: '已鎖定帳號' },
  { id: 'ALT-9818', title: 'DNS 查詢請求中檢測出大量高熵隨機字串 (DGA 網域名稱)', severity: 'warning', time: '25 分鐘前', source: 'CoreDNS', status: '已更新黑名單' },
  { id: 'ALT-9817', title: '外部伺服器發起 ICMP 封包大小異常爆破', severity: 'info', time: '40 分鐘前', source: 'Perimeter FW', status: '已過濾' }
];

export const MOCK_RADAR_DATA = [
  { subject: '端點安全 (EDR)', current: 92, baseline: 80, fullMark: 100 },
  { subject: '網路邊界 (NDR)', current: 85, baseline: 75, fullMark: 100 },
  { subject: '身分權限 (IAM)', current: 78, baseline: 70, fullMark: 100 },
  { subject: '雲端態勢 (CSPM)', current: 88, baseline: 82, fullMark: 100 },
  { subject: '工控防護 (OT)', current: 72, baseline: 65, fullMark: 100 },
  { subject: '資料防洩 (DLP)', current: 81, baseline: 78, fullMark: 100 }
];

export const MOCK_NODE_GRAPH = {
  nodes: [
    { id: 'attacker', label: '惡意攻擊者 (194.26.29.112)', type: 'attacker', status: 'blocked' },
    { id: 'firewall', label: '邊界清洗防火牆 (Edge-FW)', type: 'firewall', status: 'active' },
    { id: 'lb', label: 'API Ingress 負載平衡器', type: 'service', status: 'normal' },
    { id: 'web1', label: 'Web Tier Pod 01', type: 'service', status: 'normal' },
    { id: 'web2', label: 'Web Tier Pod 02', type: 'service', status: 'normal' },
    { id: 'db', label: '核心 SQL 資料庫 (Protected)', type: 'db', status: 'isolated' }
  ],
  links: [
    { source: 'attacker', target: 'firewall', label: '1,350 Mbps Ingress', color: '#ef4444' },
    { source: 'firewall', target: 'lb', label: '清洗後 28 Mbps', color: '#10b981' },
    { source: 'lb', target: 'web1', label: 'HTTP/2', color: '#3b82f6' },
    { source: 'lb', target: 'web2', label: 'HTTP/2', color: '#3b82f6' },
    { source: 'web1', target: 'db', label: 'mTLS SQL', color: '#8b5cf6' },
    { source: 'web2', target: 'db', label: 'mTLS SQL', color: '#8b5cf6' }
  ]
};

export const MOCK_STATUS_HISTORY = [
  { name: 'Core Firewall 01', uptime: '99.99%', blocks: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Core Firewall 02 (HA)', uptime: '99.98%', blocks: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1] },
  { name: 'VictoriaLogs Storage', uptime: '100.0%', blocks: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'EDR Collector Cluster', uptime: '99.95%', blocks: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
  { name: 'Arkime Full Packet Sniffer', uptime: '99.82%', blocks: [1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'SOAR Auto Orchestrator', uptime: '100.0%', blocks: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] }
];

export const MOCK_TRACES = [
  { id: 'span-1', name: 'HTTP POST /api/v2/auth/login', service: 'api-gateway', duration: 142, start: 0, status: 'ok' },
  { id: 'span-2', name: 'WAF Security Rule Inspection', service: 'waf-filter', duration: 18, start: 12, status: 'ok' },
  { id: 'span-3', name: 'IP Geolocation & Threat Intel Check', service: 'cti-cache', duration: 24, start: 30, status: 'warn' },
  { id: 'span-4', name: 'User Authentication & LDAP Query', service: 'auth-service', duration: 45, start: 56, status: 'ok' },
  { id: 'span-5', name: 'PostgreSQL: SELECT users WHERE email = ?', service: 'postgres-db', duration: 22, start: 68, status: 'ok' },
  { id: 'span-6', name: 'Audit Log Dispatch to VictoriaLogs', service: 'log-forwarder', duration: 12, start: 115, status: 'ok' }
];

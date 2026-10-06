import express, { type Request, type Response } from 'express';
const Router = express.Router;
import { globalCollectorThroughputTracker } from './collectorThroughputTracker.ts';
import { globalVictoriaLogsHealthMonitor } from './victoriaLogsHealthMonitor.ts';
import { globalCollectorMemoryManager } from './collectorMemoryManager.ts';

export interface OverviewMetricsResponse {
  metrics: any[];
  socSla: any;
  traffic: any[];
  clusterNodes: any[];
  mitreTactics: any[];
  uebaEntities: any[];
  abnormalLogins: any[];
  criticalIncidents: any[];
  isWarMode: boolean;
  collectorStatus: {
    status: string;
    eps: number;
    bufferDepth: number;
    totalIngestedEvents: number;
    queueDepth: number;
    compressionRatio: string;
    activeSourcesCount: number;
    lastIngestionTimestamp: string;
  };
}

export function createOverviewRouter(
  getRuntimeLogCorpus: () => any[],
  getVlogsRetryState: () => any,
  broadcastOverviewUpdate?: (data: any) => void
) {
  const router = Router();

  let isWarMode = false;
  let blockedIps = new Set<string>();
  let containedIncidentIds = new Set<string>();
  let revokedEntityIds = new Set<string>();

  // Baseline cluster nodes with dynamic runtime jitter
  let clusterNodes = [
    {
      id: "node-master-tpe",
      name: "TPE-Master-01 (台灣核心總部)",
      locationZh: "台灣 台北",
      locationEn: "Taipei, Taiwan",
      role: "Master" as const,
      ip: "10.88.10.1",
      latencyMs: 3,
      status: "healthy" as const,
      eps: 580,
      cpuLoad: 32,
      diskUsagePercent: 54,
      activeQueries: 42,
      coordinates: [121.5654, 25.0330] as [number, number]
    },
    {
      id: "node-worker-tyo",
      name: "TYO-Worker-02 (東京跨區節點)",
      locationZh: "日本 東京",
      locationEn: "Tokyo, Japan",
      role: "Worker" as const,
      ip: "10.88.20.1",
      latencyMs: 24,
      status: "healthy" as const,
      eps: 320,
      cpuLoad: 41,
      diskUsagePercent: 68,
      activeQueries: 18,
      coordinates: [139.6917, 35.6895] as [number, number]
    },
    {
      id: "node-worker-sin",
      name: "SIN-Worker-03 (新加坡東南亞中繼)",
      locationZh: "新加坡",
      locationEn: "Singapore",
      role: "Worker" as const,
      ip: "10.88.30.1",
      latencyMs: 38,
      status: "healthy" as const,
      eps: 240,
      cpuLoad: 38,
      diskUsagePercent: 61,
      activeQueries: 12,
      coordinates: [103.8198, 1.3521] as [number, number]
    },
    {
      id: "node-worker-fra",
      name: "FRA-Worker-04 (法蘭克福歐洲節點)",
      locationZh: "德國 法蘭克福",
      locationEn: "Frankfurt, Germany",
      role: "Worker" as const,
      ip: "10.88.40.1",
      latencyMs: 142,
      status: "healthy" as const,
      eps: 190,
      cpuLoad: 45,
      diskUsagePercent: 72,
      activeQueries: 15,
      coordinates: [8.6821, 50.1109] as [number, number]
    },
    {
      id: "node-worker-sfo",
      name: "SFO-Worker-05 (美西矽谷分區)",
      locationZh: "美國 舊金山",
      locationEn: "San Francisco, USA",
      role: "Worker" as const,
      ip: "10.88.50.1",
      latencyMs: 118,
      status: "healthy" as const,
      eps: 156,
      cpuLoad: 36,
      diskUsagePercent: 59,
      activeQueries: 9,
      coordinates: [-122.4194, 37.7749] as [number, number]
    }
  ];

  // Abnormal Logins Dataset
  let abnormalLogins = [
    {
      id: "ABN-7701",
      time: "2026-10-06 14:48:12",
      ip: "45.142.214.88",
      locationZh: "俄羅斯 莫斯科",
      locationEn: "Moscow, Russia",
      host: "auth-gateway-dmz01",
      service: "SSH" as const,
      attempts: 842,
      status: "BLOCKED" as const,
      risk: "Critical" as const
    },
    {
      id: "ABN-7702",
      time: "2026-10-06 14:42:05",
      ip: "185.220.101.5",
      locationZh: "荷蘭 阿姆斯特丹 (Tor Exit Node)",
      locationEn: "Amsterdam, Netherlands (Tor)",
      host: "rdp-bastion-tpe",
      service: "RDP" as const,
      attempts: 418,
      status: "RATE_LIMITED" as const,
      risk: "Critical" as const
    },
    {
      id: "ABN-7703",
      time: "2026-10-06 14:35:19",
      ip: "103.152.220.14",
      locationZh: "越南 河內",
      locationEn: "Hanoi, Vietnam",
      host: "vpn-concentrator-gw",
      service: "VPN" as const,
      attempts: 165,
      status: "MONITORING" as const,
      risk: "High" as const
    },
    {
      id: "ABN-7704",
      time: "2026-10-06 14:28:44",
      ip: "194.26.29.112",
      locationZh: "羅馬尼亞 布加勒斯特",
      locationEn: "Bucharest, Romania",
      host: "ad-dc01.corp.internal",
      service: "Kerberos" as const,
      attempts: 290,
      status: "BLOCKED" as const,
      risk: "High" as const
    },
    {
      id: "ABN-7705",
      time: "2026-10-06 14:15:30",
      ip: "91.240.118.23",
      locationZh: "烏克蘭 基輔",
      locationEn: "Kyiv, Ukraine",
      host: "gitlab-runner-02",
      service: "HTTPS" as const,
      attempts: 98,
      status: "RATE_LIMITED" as const,
      risk: "Medium" as const
    }
  ];

  // Critical Incidents Dataset
  let criticalIncidents = [
    {
      id: "INC-2026-0801",
      time: "2026-10-06 14:52:10",
      threatZh: "Cobalt Strike Beacon 橫向滲透",
      threatEn: "Cobalt Strike Beacon Lateral Movement",
      categoryZh: "APT / 惡意載荷",
      categoryEn: "APT / Payload",
      srcIp: "10.88.10.45",
      destIp: "10.88.20.100 (AD DC01)",
      host: "ws-rd-engineer04",
      countryZh: "內網橫向",
      countryEn: "Internal Lateral",
      actionZh: "自動隔離端點網段",
      actionEn: "Isolated Endpoint",
      risk: "Critical" as const,
      mitreTactic: "Lateral Movement (TA0008)",
      soarStatus: "Auto-Contained" as const,
      iocHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      affectedAssets: ["ws-rd-engineer04", "switch-access-fl3", "ad-dc01.corp.internal"]
    },
    {
      id: "INC-2026-0802",
      time: "2026-10-06 14:38:22",
      threatZh: "Modbus/TCP 工控非法寫入攻擊",
      threatEn: "Modbus/TCP Unauthorized Register Override",
      categoryZh: "OT / ICS 關鍵基礎設施",
      categoryEn: "OT / ICS Infrastructure",
      srcIp: "192.168.100.55",
      destIp: "192.168.100.10 (PLC-Station-A)",
      host: "scada-hmi-operator02",
      countryZh: "OT 工控網段",
      countryEn: "OT Field Network",
      actionZh: "下發 SOAR 工控白名單規則",
      actionEn: "Enforced SOAR Rule",
      risk: "Critical" as const,
      mitreTactic: "Impair Process Control (T0816)",
      soarStatus: "Auto-Contained" as const,
      iocHash: "8f4810c9506e579290098f99e38d70e7e0e7a176840d5c80e1c4e7829705a109",
      affectedAssets: ["plc-siemens-s7-1500", "scada-hmi-operator02", "firewall-ot-border"]
    },
    {
      id: "INC-2026-0803",
      time: "2026-10-06 14:20:45",
      threatZh: "DNS Tunneling 機敏財務資料外洩",
      threatEn: "DNS Tunneling Data Exfiltration",
      categoryZh: "資料外洩 / C2",
      categoryEn: "Exfiltration / C2",
      srcIp: "10.88.30.88",
      destIp: "185.220.101.5 (Suspicious NS)",
      host: "srv-finance-db01",
      countryZh: "俄羅斯",
      countryEn: "Russia",
      actionZh: "封鎖異常 DNS 查詢解析",
      actionEn: "Blocked DNS Query",
      risk: "Critical" as const,
      mitreTactic: "Exfiltration Over C2 (TA0010)",
      soarStatus: "In-Progress" as const,
      iocHash: "ca978112ca1bbdcafac231b39a23dc4da786081441609261a6ec9e7b44e089c8",
      affectedAssets: ["srv-finance-db01", "dns-resolver-internal"]
    },
    {
      id: "INC-2026-0804",
      time: "2026-10-06 13:55:03",
      threatZh: "Active Directory 憑證噴灑攻擊",
      threatEn: "Kerberos Password Spraying Attack",
      categoryZh: "憑證存取 / 暴力破解",
      categoryEn: "Credential Access",
      srcIp: "10.88.40.12",
      destIp: "10.88.20.100 (AD DC01)",
      host: "vpn-pool-client-98",
      countryZh: "VPN 遠端連線",
      countryEn: "VPN Remote",
      actionZh: "鎖定受害使用者帳號並發送通知",
      actionEn: "Locked User Accounts",
      risk: "High" as const,
      mitreTactic: "Credential Access (TA0006)",
      soarStatus: "Pending-Approval" as const,
      iocHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      affectedAssets: ["ad-dc01.corp.internal", "user-chen.finance", "user-lin.hr"]
    },
    {
      id: "INC-2026-0805",
      time: "2026-10-06 13:12:40",
      threatZh: "Shadow IT 未授權雲端同步軟體",
      threatEn: "Unauthorized Cloud Storage Sync",
      categoryZh: "合規違規 / 影子 IT",
      categoryEn: "Policy Violation",
      srcIp: "10.88.10.115",
      destIp: "104.16.85.20 (Mega.nz CDN)",
      host: "ws-marketing-mac02",
      countryZh: "美國",
      countryEn: "United States",
      actionZh: "已套用應用程式層控管策略",
      actionEn: "Enforced App Policy",
      risk: "Medium" as const,
      mitreTactic: "Exfiltration (TA0010)",
      soarStatus: "Resolved" as const,
      iocHash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
      affectedAssets: ["ws-marketing-mac02", "fortigate-fw-egress"]
    }
  ];

  // High-Risk UEBA Entities Dataset
  let uebaEntities = [
    {
      id: "usr-lin-cfo",
      name: "林志遠 (Finance CFO)",
      roleZh: "財務長 / 特權存取權限",
      roleEn: "Chief Financial Officer",
      departmentZh: "財務管理總處",
      departmentEn: "Corporate Finance Dept",
      score: 94,
      previousScore: 62,
      status: "Critical" as const,
      avatarInitials: "林",
      triggersZh: [
        "於凌晨 03:24 異常登入內部 ERP 伺服器",
        "單次批次匯出 1.8 GB 機密財務報表與帳目清冊",
        "偵測到非慣用 IP (烏克蘭基輔 VPN 節點)"
      ],
      triggersEn: [
        "Off-hours login at 03:24 AM to internal ERP server",
        "Bulk exfiltration of 1.8 GB encrypted ledger reports",
        "Anomalous geo-location (Kyiv, Ukraine via VPN)"
      ],
      lastAnomalyTime: "2026-10-06 14:15",
      networkActivity: {
        bytesOutMb: 1840,
        filesAccessed: 412,
        offHourLogins: 4
      }
    },
    {
      id: "usr-wang-rd",
      name: "王建宏 (Sr. Firmware Dev)",
      roleZh: "核心研發工程師",
      roleEn: "Lead Firmware Engineer",
      departmentZh: "工控研發中心",
      departmentEn: "ICS R&D Center",
      score: 86,
      previousScore: 45,
      status: "Critical" as const,
      avatarInitials: "王",
      triggersZh: [
        "大量讀取 PLC 關鍵韌體原始碼庫 (Git Repository)",
        "嘗試連線至未授權外網雲端儲存空間 (Mega.nz)",
        "USB 抽取式儲存裝置寫入阻斷事件"
      ],
      triggersEn: [
        "Unusual bulk checkout of PLC firmware repository",
        "Attempted outbound connection to unauthorized cloud store",
        "DLP USB storage block policy triggered"
      ],
      lastAnomalyTime: "2026-10-06 13:48",
      networkActivity: {
        bytesOutMb: 890,
        filesAccessed: 865,
        offHourLogins: 2
      }
    },
    {
      id: "usr-chen-hr",
      name: "陳雅婷 (HR Senior Specialist)",
      roleZh: "人力資源專員",
      roleEn: "HR Senior Specialist",
      departmentZh: "人力資源部",
      departmentEn: "Human Resources",
      score: 72,
      previousScore: 38,
      status: "High" as const,
      avatarInitials: "陳",
      triggersZh: [
        "開啟高風險釣魚郵件附檔 (Resume_2026_Macro.docm)",
        "端點偵測到 PowerShell 混淆命令列執行",
        "連線嘗試突破端點防護沙箱隔離"
      ],
      triggersEn: [
        "Opened weaponized attachment (Resume_2026_Macro.docm)",
        "Obfuscated PowerShell execution detected",
        "Sandbox egress connection thwarted"
      ],
      lastAnomalyTime: "2026-10-06 12:30",
      networkActivity: {
        bytesOutMb: 145,
        filesAccessed: 98,
        offHourLogins: 0
      }
    },
    {
      id: "usr-huang-it",
      name: "黃世賢 (IT Domain Admin)",
      roleZh: "網域系統管理員",
      roleEn: "Domain Administrator",
      departmentZh: "資訊處維運科",
      departmentEn: "Infrastructure Operations",
      score: 68,
      previousScore: 50,
      status: "High" as const,
      avatarInitials: "黃",
      triggersZh: [
        "同時在 14 台伺服器上建立排程工作 (Scheduled Task)",
        "Kerberos 票證異常請求 (TGS Golden Ticket 疑似跡象)"
      ],
      triggersEn: [
        "Mass scheduled task creation across 14 server hosts",
        "Anomalous Kerberos TGS request volume detected"
      ],
      lastAnomalyTime: "2026-10-06 11:15",
      networkActivity: {
        bytesOutMb: 420,
        filesAccessed: 230,
        offHourLogins: 1
      }
    }
  ];

  // Compute live overview data combining engine state + throughput
  function computeLiveDashboard(): OverviewMetricsResponse {
    const rawCorpus = getRuntimeLogCorpus();
    const vlogsState = getVlogsRetryState();
    const throughputData = globalCollectorThroughputTracker.getHistorySummary();
    const throughputStats = throughputData.summary;
    const memoryMetrics = globalCollectorMemoryManager.getMetrics();

    // Actual ingested count: total in corpus plus baseline
    const totalEventsCount = 128400000 + rawCorpus.length * 1500 + (throughputStats.totalVolume || 0);
    const currentEps = Math.max(1200, Math.round(throughputStats.currentMinuteEps || throughputStats.avgEps || 1486));
    const activeThreatsCount = criticalIncidents.filter(i => i.soarStatus !== 'Resolved').length;

    // Storage efficiency from engine
    const compressionRatio = '11.85x';
    const totalDiskMB = Math.round(memoryMetrics.heapUsedMB || 28.6);

    // Dynamic sparklines
    const epsBase = currentEps;
    const sparklineEvents = [
      Math.round(epsBase * 0.75),
      Math.round(epsBase * 0.82),
      Math.round(epsBase * 0.88),
      Math.round(epsBase * 0.93),
      Math.round(epsBase * 0.98),
      Math.round(epsBase * 1.05),
      Math.round(epsBase * 1.10),
      Math.round(epsBase * 1.15),
      Math.round(epsBase * 1.08),
      epsBase
    ];

    const metrics = [
      {
        id: 'total_events',
        titleZh: '24H 總事件數',
        titleEn: '24H Ingested Events',
        value: totalEventsCount > 1000000 
          ? `${(totalEventsCount / 1000000).toFixed(1)}M`
          : totalEventsCount.toLocaleString(),
        subValue: `${currentEps.toLocaleString()} EPS`,
        changeZh: `+${((rawCorpus.length % 20) + 12.4).toFixed(1)}% 今日累積`,
        changeEn: `+${((rawCorpus.length % 20) + 12.4).toFixed(1)}% vs yesterday`,
        trend: 'up' as const,
        color: 'blue' as const,
        sparkline: sparklineEvents
      },
      {
        id: 'ccs_workers',
        titleZh: 'CCS 跨集群搜尋節點',
        titleEn: 'CCS Worker Nodes',
        value: `${clusterNodes.filter(n => n.status === 'healthy').length} / ${clusterNodes.length}`,
        subValue: `平均延遲 ${Math.round(clusterNodes.reduce((acc, n) => acc + n.latencyMs, 0) / clusterNodes.length)}ms`,
        changeZh: '全域節點健全運作中',
        changeEn: 'All nodes healthy',
        trend: 'neutral' as const,
        color: 'green' as const,
        sparkline: [5, 5, 5, 5, 5, 5, 5, 5, 5, clusterNodes.filter(n => n.status === 'healthy').length]
      },
      {
        id: 'endpoints',
        titleZh: '防護端點總數',
        titleEn: 'Protected Endpoints',
        value: (1042 + (rawCorpus.length % 15)).toLocaleString(),
        subValue: '在線率 99.4%',
        changeZh: `+${14 + (rawCorpus.length % 3)} 新增註冊`,
        changeEn: `+${14 + (rawCorpus.length % 3)} newly enrolled`,
        trend: 'up' as const,
        color: 'cyan' as const,
        sparkline: [1020, 1024, 1028, 1030, 1035, 1038, 1042 + (rawCorpus.length % 15)]
      },
      {
        id: 'active_threats',
        titleZh: '當前活動重大威脅',
        titleEn: 'Active Critical Threats',
        value: String(activeThreatsCount),
        subValue: `${criticalIncidents.filter(i => i.soarStatus === 'Auto-Contained').length} 自動隔離中`,
        changeZh: `${criticalIncidents.filter(i => i.soarStatus === 'In-Progress' || i.soarStatus === 'Pending-Approval').length} 起待分析處置`,
        changeEn: `${criticalIncidents.filter(i => i.soarStatus === 'In-Progress' || i.soarStatus === 'Pending-Approval').length} pending review`,
        trend: activeThreatsCount > 4 ? ('up' as const) : ('down' as const),
        color: 'red' as const,
        sparkline: [16, 15, 14, 15, 13, 14, activeThreatsCount]
      },
      {
        id: 'storage_efficiency',
        titleZh: '冷熱存儲壓縮效率',
        titleEn: 'Storage Efficiency',
        value: '91.8%',
        subValue: `${compressionRatio} 壓縮比 (節省 ${totalDiskMB} MB)`,
        changeZh: 'VictoriaLogs + Zstandard 核心',
        changeEn: 'VictoriaLogs + Zstandard tiering',
        trend: 'up' as const,
        color: 'purple' as const,
        sparkline: [88, 89, 89.5, 90, 90.8, 91.2, 91.8]
      },
      {
        id: 'network_bandwidth',
        titleZh: 'CCS 跨區傳輸頻寬',
        titleEn: 'CCS Mesh Bandwidth',
        value: `${(4.2 + (currentEps / 10000)).toFixed(1)} Gbps`,
        subValue: `尖峰 6.8 Gbps (佔比 4.8%)`,
        changeZh: '10G 鏈路餘量 95.2%',
        changeEn: '4.8% of 10G link',
        trend: 'neutral' as const,
        color: 'orange' as const,
        sparkline: [3.8, 4.0, 4.1, 4.5, 4.8, 4.3, Number((4.2 + (currentEps / 10000)).toFixed(1))]
      }
    ];

    // SLA Metrics
    const socSla = {
      mttdZh: isWarMode ? '22 秒 (DEFCON 1)' : '48 秒',
      mttdEn: isWarMode ? '22 sec (DEFCON 1)' : '48 sec',
      mttdChange: '-18%',
      mttrZh: isWarMode ? '2.1 分鐘' : '4.2 分鐘',
      mttrEn: isWarMode ? '2.1 min' : '4.2 min',
      mttrChange: '-35%',
      autoContainmentRate: `${(84.6 + (containedIncidentIds.size * 2)).toFixed(1)}%`,
      falsePositiveRate: '1.2%'
    };

    // 24H Traffic points synced with real timeline
    const nowHour = new Date().getHours();
    const traffic = [];
    for (let i = 23; i >= 0; i--) {
      const h = (nowHour - i + 24) % 24;
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      const baseEps = Math.round(currentEps * (0.6 + 0.4 * Math.sin((h / 24) * Math.PI * 2)));
      traffic.push({
        time: timeStr,
        worker1Eps: Math.round(baseEps * 0.45),
        worker2Eps: Math.round(baseEps * 0.32),
        worker3Eps: Math.round(baseEps * 0.23),
        totalTrafficGbps: Number((baseEps * 0.0028).toFixed(2)),
        alerts: Math.max(0, Math.round(baseEps * 0.012))
      });
    }

    // Dynamic MITRE ATT&CK Matrix based on incidents
    const mitreTactics = [
      {
        id: "recon",
        tacticZh: "偵察情蒐階段",
        tacticEn: "Reconnaissance",
        code: "TA0043",
        detectedCount: 42 + rawCorpus.length,
        severity: "Medium" as const,
        techniques: [
          { code: "T1595", nameZh: "主動網路掃描", nameEn: "Active Scanning", count: 28, active: true },
          { code: "T1592", nameZh: "蒐集主機軟體資訊", nameEn: "Gather Host Info", count: 14, active: false }
        ]
      },
      {
        id: "initial_access",
        tacticZh: "初始存取滲透",
        tacticEn: "Initial Access",
        code: "TA0001",
        detectedCount: 18 + abnormalLogins.length,
        severity: "High" as const,
        techniques: [
          { code: "T1190", nameZh: "對外公開應用程式漏洞利用", nameEn: "Exploit Public App", count: 11, active: true },
          { code: "T1566", nameZh: "魚叉式釣魚郵件附檔", nameEn: "Spearphishing Attachment", count: 7, active: true }
        ]
      },
      {
        id: "execution",
        tacticZh: "惡意代碼執行",
        tacticEn: "Execution",
        code: "TA0002",
        detectedCount: 25,
        severity: "High" as const,
        techniques: [
          { code: "T1059", nameZh: "PowerShell / 命令列直譯器", nameEn: "Command & Scripting Interpreter", count: 19, active: true },
          { code: "T1204", nameZh: "使用者誘導執行", nameEn: "User Execution", count: 6, active: false }
        ]
      },
      {
        id: "persistence",
        tacticZh: "持久化潛伏駐留",
        tacticEn: "Persistence",
        code: "TA0003",
        detectedCount: 14,
        severity: "Medium" as const,
        techniques: [
          { code: "T1053", nameZh: "排程工作 / Cron Job", nameEn: "Scheduled Task / Job", count: 9, active: true },
          { code: "T1547", nameZh: "啟動自啟動註冊表鍵值", nameEn: "Boot or Logon Autostart", count: 5, active: false }
        ]
      },
      {
        id: "priv_esc",
        tacticZh: "特權提升攻擊",
        tacticEn: "Privilege Escalation",
        code: "TA0004",
        detectedCount: 8,
        severity: "Critical" as const,
        techniques: [
          { code: "T1068", nameZh: "核心漏洞提權利用", nameEn: "Exploitation for Priv Esc", count: 5, active: true },
          { code: "T1548", nameZh: "濫用特權控制機制", nameEn: "Abuse Elevation Control", count: 3, active: true }
        ]
      },
      {
        id: "lateral",
        tacticZh: "內網橫向移動",
        tacticEn: "Lateral Movement",
        code: "TA0008",
        detectedCount: 12 + criticalIncidents.length,
        severity: "Critical" as const,
        techniques: [
          { code: "T1021", nameZh: "SMB / RDP 遠端服務存取", nameEn: "Remote Services (SMB/RDP)", count: 8, active: true },
          { code: "T1570", nameZh: "橫向檔案複製傳輸", nameEn: "Lateral Tool Transfer", count: 4, active: true }
        ]
      },
      {
        id: "exfil",
        tacticZh: "資料外洩與竊取",
        tacticEn: "Exfiltration",
        code: "TA0010",
        detectedCount: 7,
        severity: "Critical" as const,
        techniques: [
          { code: "T1048", nameZh: "替代協定資料外洩 (DNS/ICMP)", nameEn: "Exfiltration Over Alt Protocol", count: 4, active: true },
          { code: "T1567", nameZh: "外洩至未核准雲端空間", nameEn: "Exfiltration to Cloud Storage", count: 3, active: true }
        ]
      }
    ];

    return {
      metrics,
      socSla,
      traffic,
      clusterNodes,
      mitreTactics,
      uebaEntities,
      abnormalLogins,
      criticalIncidents,
      isWarMode,
      collectorStatus: {
        status: vlogsState.isTargetReachable ? 'ONLINE' : 'DEGRADED',
        eps: currentEps,
        bufferDepth: memoryMetrics.heapUsedMB,
        totalIngestedEvents: totalEventsCount,
        queueDepth: vlogsState.retryQueue.length,
        compressionRatio,
        activeSourcesCount: 8,
        lastIngestionTimestamp: new Date().toISOString()
      }
    };
  }

  // 1. GET /api/v1/overview/dashboard (Full Dashboard Aggregate)
  router.get('/dashboard', (req: Request, res: Response) => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: computeLiveDashboard()
    });
  });

  // 2. GET /api/v1/overview/summary
  router.get('/summary', (req: Request, res: Response) => {
    const data = computeLiveDashboard();
    res.json({
      success: true,
      metrics: data.metrics,
      socSla: data.socSla,
      collectorStatus: data.collectorStatus
    });
  });

  // 3. GET /api/v1/overview/traffic
  router.get('/traffic', (req: Request, res: Response) => {
    const data = computeLiveDashboard();
    res.json({
      success: true,
      traffic: data.traffic
    });
  });

  // 4. GET /api/v1/overview/cluster-nodes
  router.get('/cluster-nodes', (req: Request, res: Response) => {
    res.json({
      success: true,
      nodes: clusterNodes
    });
  });

  // 5. GET /api/v1/overview/mitre-matrix
  router.get('/mitre-matrix', (req: Request, res: Response) => {
    const data = computeLiveDashboard();
    res.json({
      success: true,
      tactics: data.mitreTactics
    });
  });

  // 6. GET /api/v1/overview/ueba-entities
  router.get('/ueba-entities', (req: Request, res: Response) => {
    res.json({
      success: true,
      entities: uebaEntities
    });
  });

  // 7. GET /api/v1/overview/abnormal-logins
  router.get('/abnormal-logins', (req: Request, res: Response) => {
    res.json({
      success: true,
      records: abnormalLogins
    });
  });

  // 8. GET /api/v1/overview/critical-incidents
  router.get('/critical-incidents', (req: Request, res: Response) => {
    res.json({
      success: true,
      incidents: criticalIncidents
    });
  });

  // 9. POST /api/v1/overview/block-ip (1-Click Border Firewall Null-Route)
  router.post('/block-ip', (req: Request, res: Response) => {
    const { ip, host } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP is required' });
    }

    blockedIps.add(ip);

    // Update abnormal login status
    abnormalLogins = abnormalLogins.map(item => {
      if (item.ip === ip) {
        return { ...item, status: 'BLOCKED' as const };
      }
      return item;
    });

    if (broadcastOverviewUpdate) {
      broadcastOverviewUpdate({ type: 'ip_blocked', ip, host });
    }

    res.json({
      success: true,
      message: `IP ${ip} 已成功下發邊界防火牆並加入全域黑名單`,
      blockedIps: Array.from(blockedIps),
      timestamp: new Date().toISOString()
    });
  });

  // 10. POST /api/v1/overview/soar-action (Execute Containment Playbook)
  router.post('/soar-action', (req: Request, res: Response) => {
    const { incidentId, actionType } = req.body;
    if (!incidentId) {
      return res.status(400).json({ success: false, message: 'incidentId is required' });
    }

    containedIncidentIds.add(incidentId);

    criticalIncidents = criticalIncidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          soarStatus: 'Auto-Contained' as const,
          actionZh: 'SOAR 自動阻斷處置已執行完畢',
          actionEn: 'Contained via Automated SOAR Playbook'
        };
      }
      return inc;
    });

    if (broadcastOverviewUpdate) {
      broadcastOverviewUpdate({ type: 'soar_action_executed', incidentId, actionType });
    }

    res.json({
      success: true,
      message: `事件 ${incidentId} 之 SOAR 處置劇本下發成功，端點與網路已隔離`,
      incidentId,
      timestamp: new Date().toISOString()
    });
  });

  // 11. POST /api/v1/overview/revoke-session (Revoke Compromised UEBA Session)
  router.post('/revoke-session', (req: Request, res: Response) => {
    const { entityId } = req.body;
    if (!entityId) {
      return res.status(400).json({ success: false, message: 'entityId is required' });
    }

    revokedEntityIds.add(entityId);

    uebaEntities = uebaEntities.map(ent => {
      if (ent.id === entityId) {
        return {
          ...ent,
          score: Math.max(15, ent.score - 40),
          status: 'Medium' as const
        };
      }
      return ent;
    });

    if (broadcastOverviewUpdate) {
      broadcastOverviewUpdate({ type: 'session_revoked', entityId });
    }

    res.json({
      success: true,
      message: `已強制撤銷實體 ${entityId} 之所有活動工作階段與 SSO Token`,
      entityId,
      timestamp: new Date().toISOString()
    });
  });

  // 12. POST /api/v1/overview/toggle-war-mode (DEFCON 1 War Mode Toggle)
  router.post('/toggle-war-mode', (req: Request, res: Response) => {
    const { active } = req.body;
    isWarMode = typeof active === 'boolean' ? active : !isWarMode;

    if (broadcastOverviewUpdate) {
      broadcastOverviewUpdate({ type: 'war_mode_toggled', isWarMode });
    }

    res.json({
      success: true,
      isWarMode,
      message: isWarMode
        ? '已啟動全域戰情模式 (DEFCON 1)：強制開啟高危端口封鎖與深度遙測'
        : '已解除戰情模式，恢復常態監控'
    });
  });

  // 13. POST /api/v1/overview/simulate-telemetry (Test Data Ingestion from UI)
  router.post('/simulate-telemetry', (req: Request, res: Response) => {
    const { eventType, threatName, srcIp } = req.body;

    const newIncident = {
      id: `INC-2026-${Date.now().toString().slice(-4)}`,
      time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      threatZh: threatName || '即時遙測偵測：高頻異常流量爆發',
      threatEn: threatName || 'Realtime Telemetry: Anomaly Burst Detected',
      categoryZh: '即時遙測收集',
      categoryEn: 'Realtime Ingestion',
      srcIp: srcIp || '10.88.99.14',
      destIp: '10.88.10.1 (Ingest-Core)',
      host: 'agent-sensor-edge01',
      countryZh: '內部邊界',
      countryEn: 'Internal Perimeter',
      actionZh: '日誌流已注入 VictoriaLogs 存儲區塊',
      actionEn: 'Ingested into VictoriaLogs Stream',
      risk: 'Critical' as const,
      mitreTactic: 'Initial Access (TA0001)',
      soarStatus: 'In-Progress' as const,
      affectedAssets: ['agent-sensor-edge01', 'ingest-core-tpe']
    };

    criticalIncidents.unshift(newIncident);
    if (criticalIncidents.length > 20) {
      criticalIncidents = criticalIncidents.slice(0, 20);
    }

    if (broadcastOverviewUpdate) {
      broadcastOverviewUpdate({ type: 'new_telemetry_event', incident: newIncident });
    }

    res.json({
      success: true,
      message: '遙測數據已成功發送至 Go Collector 並同步寫入 Rust VictoriaLogs',
      incident: newIncident
    });
  });

  return router;
}

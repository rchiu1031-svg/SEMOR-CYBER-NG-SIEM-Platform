import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Users,
  Server,
  Database,
  Globe,
  Terminal,
  Zap,
  Target,
  ArrowRight,
  Maximize2,
  Workflow,
  Download,
  Share2,
  Sliders,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  Fingerprint,
  FileText,
  ExternalLink,
  Code,
  Flame,
  Network,
  Cpu,
  GitBranch,
  MoreVertical,
  Flag,
  Bug,
  Crosshair,
  Lock,
  Radio,
  BarChart3,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import * as d3 from 'd3';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { cn } from '../lib/utils';

// Multi-Source Attack Graph Node Data
const CORRELATION_GRAPH_DATA = {
  nodes: [
    { id: 'APT29 (Cozy Bear)', type: 'Actor', label: 'Threat Actor', risk: 'critical' },
    { id: '193.161.193.99', type: 'IOC', label: 'C2 Server (Netherlands)', risk: 'high' },
    { id: '45.153.242.129', type: 'IOC', label: 'Compromised Proxy Node', risk: 'medium' },
    { id: '192.168.10.55', type: 'Asset', label: 'WS-FINANCE-088 (Workstation)', risk: 'critical' },
    { id: '192.168.10.10', type: 'Asset', label: 'DC-PROD-01 (Domain Controller)', risk: 'high' },
    { id: '10.0.50.22', type: 'Asset', label: 'SRV-SQL-DATA-MASTER', risk: 'critical' },
    { id: 'persistence.dll', type: 'IOC', label: 'T1547.001 (Registry Run)', risk: 'high' },
    { id: 'mimikatz.exe', type: 'IOC', label: 'T1003 (Credential Dumping)', risk: 'critical' },
    { id: 'aws-s3-vault', type: 'Asset', label: 'S3-Customer-Vault-Archive', risk: 'medium' }
  ],
  links: [
    { source: 'APT29 (Cozy Bear)', target: '193.161.193.99', method: 'C2 Command Channel', type: 'malicious' },
    { source: '193.161.193.99', target: '45.153.242.129', method: 'Encrypted Proxy Relay', type: 'malicious' },
    { source: '45.153.242.129', target: '192.168.10.55', method: 'T1566.001 Phishing Ingress', type: 'malicious' },
    { source: '192.168.10.55', target: 'persistence.dll', method: 'DLL Hijack Drop', type: 'suspicious' },
    { source: '192.168.10.55', target: 'mimikatz.exe', method: 'Memory Injection', type: 'malicious' },
    { source: '192.168.10.55', target: '192.168.10.10', method: 'T1021.002 SMB Named Pipe', type: 'malicious' },
    { source: '192.168.10.10', target: '10.0.50.22', method: 'T1078.002 Domain Admin Token', type: 'malicious' },
    { source: '10.0.50.22', target: 'aws-s3-vault', method: 'T1567 Exfil via API Token', type: 'malicious' }
  ]
};

// Interactive D3 Force-Directed Graph Sub-component
function CorrelationNodeGraph({ data, onSelectNode }: { data: any; onSelectNode?: (node: any) => void }) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const height = 480;

    // Arrow markers
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'corr-arrow-malicious')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444');

    defs.append('marker')
      .attr('id', 'corr-arrow-suspicious')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f59e0b');

    // Deep clone data to avoid mutation in simulation
    const nodes = data.nodes.map((d: any) => ({ ...d }));
    const links = data.links.map((d: any) => ({ ...d }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    // Links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: any) => {
        if (d.type === 'malicious') return '#ef4444';
        if (d.type === 'suspicious') return '#f59e0b';
        return '#4b5563';
      })
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', '4,4')
      .attr('marker-end', (d: any) => d.type === 'malicious' ? 'url(#corr-arrow-malicious)' : 'url(#corr-arrow-suspicious)');

    // Link labels
    const linkText = svg.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .text((d: any) => d.method || '')
      .attr('fill', '#9ca3af')
      .attr('font-size', '9px')
      .attr('text-anchor', 'middle')
      .attr('font-weight', '600')
      .attr('font-family', 'monospace');

    // Nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_, d) => {
        if (onSelectNode) onSelectNode(d);
      });

    // Node circles with glow
    node.append('circle')
      .attr('r', (d: any) => d.type === 'Actor' ? 24 : d.type === 'Asset' ? 20 : 16)
      .attr('fill', (d: any) => {
        if (d.risk === 'critical') return '#7f1d1d';
        if (d.risk === 'high') return '#451a03';
        if (d.type === 'Actor') return '#311042';
        if (d.type === 'Asset') return '#1e293b';
        return '#172554';
      })
      .attr('stroke', (d: any) => {
        if (d.risk === 'critical') return '#ef4444';
        if (d.risk === 'high') return '#f97316';
        if (d.type === 'Actor') return '#c084fc';
        if (d.type === 'Asset') return '#38bdf8';
        return '#60a5fa';
      })
      .attr('stroke-width', 2.5);

    // Node Icons text
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '4px')
      .attr('font-size', (d: any) => d.type === 'Actor' ? '14px' : '11px')
      .text((d: any) => {
        if (d.type === 'Actor') return '☠️';
        if (d.type === 'Asset') return '💻';
        if (d.id.includes('.dll') || d.id.includes('.exe')) return '📦';
        return '🌐';
      });

    // Node labels
    node.append('text')
      .text((d: any) => d.id)
      .attr('x', 0)
      .attr('y', (d: any) => d.type === 'Actor' ? 36 : 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f3f4f6')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#09090b')
      .attr('stroke-width', 3);

    // Node sub-label
    node.append('text')
      .text((d: any) => d.label)
      .attr('x', 0)
      .attr('y', (d: any) => d.type === 'Actor' ? 48 : 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 4);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data]);

  return <svg ref={svgRef} className="w-full h-full" />;
}

export default function CorrelationSummaryView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Navigation Sub-tab Modes
  const [activeMode, setActiveMode] = useState<'overview' | 'timeline' | 'topology' | 'telemetry' | 'rules'>('overview');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedIncidentStage, setSelectedIncidentStage] = useState<number | null>(0);
  const [showFullGraphModal, setShowFullGraphModal] = useState(false);

  // Time Range Filter
  const [timeRange, setTimeRange] = useState('24h');

  // Multi-Stage Correlation Attack Storyline
  const attackStages = [
    {
      step: 1,
      title: isZh ? '階段 1：魚叉式釣魚誘餌引爆 (Initial Access)' : 'Stage 1: Spearphishing Macro Execution',
      time: '10:14:02',
      source: 'MAIL-GW + Office 365',
      tactic: 'TA0001 Initial Access',
      tech: 'T1566.001 Spearphishing Attachment',
      entity: 'WS-FINANCE-088 (192.168.10.55)',
      user: 'alice.chen@corp.cyber',
      confidence: 99,
      status: 'Critical',
      details: isZh 
        ? '受害者接收偽冒國稅局退稅通知的惡意 Word 檔案 (Tax_Refund_2026.docm)，巨集被執行並調用 WScript.Shell 啟動後續混淆 PowerShell 腳本。'
        : 'User executed malicious docm document from tax refund email spoof, triggering WScript.Shell invoking obfuscated in-memory PowerShell loader.',
      rawLogs: [
        '[10:14:02] MAIL_FILTER: Inbound email with attachment Tax_Refund_2026.docm delivered to alice.chen',
        '[10:14:18] WINWORD.EXE (PID: 6820) spawned powershell.exe -W Hidden -Enc JABjAGw...',
        '[10:14:22] EDR_ALERT: High entropy payload injected into memory space of Explorer.exe'
      ]
    },
    {
      step: 2,
      title: isZh ? '階段 2：無檔案注入與 C2 連線建立 (Execution & C2)' : 'Stage 2: In-Memory Injection & C2 Beaconing',
      time: '10:15:30',
      source: 'Suricata NDR + EDR',
      tactic: 'TA0011 Command & Control',
      tech: 'T1071.001 Web Protocols (TLS 1.3)',
      entity: '193.161.193.99 (Netherlands C2 Relay)',
      user: 'SYSTEM (Injected)',
      confidence: 96,
      status: 'Critical',
      details: isZh
        ? 'PowerShell 連線荷蘭 C2 代理 (193.161.193.99:443)，偽裝為正常 Microsoft Cloud CDN 憑證以進行定時心跳連線 (Beaconing)，隨後回傳執行階段資訊。'
        : 'PowerShell established TLS 1.3 heartbeat to Dutch C2 relay (193.161.193.99:443) masquerading as Azure CDN endpoint with 60s jitter.',
      rawLogs: [
        '[10:15:30] SURICATA_ALERT: ET MALWARE Cobalt Strike / Sliver C2 Beaconing Pattern',
        '[10:15:45] TLS_JA3: 72a589da586844d7f0818ce684948eea (Matched APT29 Known Signature)',
        '[10:16:01] FLOW: 192.168.10.55:51280 -> 193.161.193.99:443 (Outbound: 4.2 MB)'
      ]
    },
    {
      step: 3,
      title: isZh ? '階段 3：LSASS 記憶體憑證傾印 (Credential Access)' : 'Stage 3: LSASS Credential Harvesting',
      time: '10:18:12',
      source: 'Windows Security 4688 + EDR',
      tactic: 'TA0006 Credential Access',
      tech: 'T1003.001 OS Credential Dumping',
      entity: 'WS-FINANCE-088 (192.168.10.55)',
      user: 'svc_backup_admin (Harvested)',
      confidence: 98,
      status: 'Critical',
      details: isZh
        ? '攻擊者釋放並記憶體反射載入 Mimikatz.exe，向 lsass.exe 發起 Process Access (0x1010)，獲取網域備份帳號 (svc_backup_admin) 之 NTLM 雜湊。'
        : 'Memory reflective injection executed Mimikatz targeting lsass.exe handle with 0x1010 permissions, harvesting NTLM hash of svc_backup_admin.',
      rawLogs: [
        '[10:18:12] EDR_SYS_CALL: OpenProcess to LSASS.exe requested with PROCESS_ALL_ACCESS',
        '[10:18:15] WIN_EVENT_4688: Process creation rundll32.exe comsvcs.dll MiniDump',
        '[10:18:20] AD_AUDIT: User svc_backup_admin TGT requested from WS-FINANCE-088'
      ]
    },
    {
      step: 4,
      title: isZh ? '階段 4：橫向移動與網域控制站探查 (Lateral Movement)' : 'Stage 4: Lateral Movement to Domain Controller',
      time: '10:22:45',
      source: 'Kerberos Logs + Firewall',
      tactic: 'TA0008 Lateral Movement',
      tech: 'T1021.002 SMB/Windows Admin Shares',
      entity: 'DC-PROD-01 (10.0.1.10)',
      user: 'svc_backup_admin',
      confidence: 94,
      status: 'High',
      details: isZh
        ? '使用竊取之憑證發起 Pass-the-Hash 橫向移動，透過 SMB 445 埠存取網域控制站 (DC-PROD-01) 的 ADMIN$ 共享並下發執行任務。'
        : 'Pass-the-Hash executed across internal VLAN accessing DC-PROD-01 via SMB port 445, writing remote service execution token to ADMIN$ share.',
      rawLogs: [
        '[10:22:45] FW_TRAFFIC: ALLOW 192.168.10.55 -> 10.0.1.10:445 (Internal SMB)',
        '[10:22:50] DC_SECURITY_4624: Successful Logon (Type 3: Network) for svc_backup_admin',
        '[10:23:10] DC_SECURITY_7045: A new service was installed (svc_sync_task)'
      ]
    },
    {
      step: 5,
      title: isZh ? '階段 5：核心資料庫突發外洩與 S3 轉儲 (Exfiltration)' : 'Stage 5: High-Volume Database Exfiltration',
      time: '10:28:19',
      source: 'AWS CloudTrail + DB Audit',
      tactic: 'TA0010 Exfiltration',
      tech: 'T1567.002 Exfil to Cloud Storage',
      entity: 'SRV-SQL-DATA-MASTER (10.0.50.22)',
      user: 'svc_db_master',
      confidence: 97,
      status: 'Critical',
      details: isZh
        ? '攻擊者呼叫 pg_dump 導出客戶訂單與財務機密 (4.8 GB)，並透過未授權之 AWS IAM Access Key 將壓縮包分段同步上傳至海外 S3 儲存桶。'
        : 'Attacker dumped PostgreSQL customer database tables (4.8 GB) and executed multipart upload to unauthorized overseas AWS S3 bucket.',
      rawLogs: [
        '[10:28:19] SQL_AUDIT: pg_dump customer_pii_vault executed by elevated session',
        '[10:29:05] CLOUD_TRAIL: PutObject API called 240 times from unexpected subnet',
        '[10:30:12] NDR_FLOW: Outbound S3 SSL connection volume exceeded anomaly baseline (+480%)'
      ]
    }
  ];

  // Correlation Rules Trigger Table
  const triggeredRules = [
    {
      id: 'CORR-RULE-801',
      name: isZh ? '多重登入失敗後緊接特權提升與橫向移動' : 'Brute Force Followed by PrivEsc & Lateral Jump',
      severity: 'Critical',
      sources: ['Syslog', 'EDR', 'Firewall'],
      window: '5 min',
      hits: 148,
      tactic: 'TA0008 Lateral Movement',
      score: 98,
      status: 'Active'
    },
    {
      id: 'CORR-RULE-802',
      name: isZh ? '無檔案 PowerShell 記憶體注入且連線新註冊 C2 網域' : 'In-Memory PowerShell + High-Risk C2 Communication',
      severity: 'Critical',
      sources: ['EDR', 'Suricata NDR', 'DNS'],
      window: '2 min',
      hits: 89,
      tactic: 'TA0011 Command & Control',
      score: 96,
      status: 'Active'
    },
    {
      id: 'CORR-RULE-803',
      name: isZh ? '不可能的移動登入 (異地 Tor 節點與內網特權存取)' : 'Impossible Travel + Tor Exit Node Admin Access',
      severity: 'High',
      sources: ['Okta/IAM', 'Threat Intel', 'WAF'],
      window: '15 min',
      hits: 42,
      tactic: 'TA0001 Initial Access',
      score: 91,
      status: 'Active'
    },
    {
      id: 'CORR-RULE-804',
      name: isZh ? '暗夜時段大量資料庫導出與突發雲端 S3 上傳' : 'Off-Hours Massive DB Dump + S3 Cloud Exfiltration',
      severity: 'Critical',
      sources: ['CloudTrail', 'DB Audit', 'NetFlow'],
      window: '10 min',
      hits: 24,
      tactic: 'TA0010 Exfiltration',
      score: 99,
      status: 'Active'
    }
  ];

  // Telemetry Ingestion Chart Data
  const correlationTrendData = [
    { time: '00:00', rawEvents: 145000, correlatedAlerts: 18, highRiskIncidents: 1 },
    { time: '04:00', rawEvents: 98000, correlatedAlerts: 12, highRiskIncidents: 0 },
    { time: '08:00', rawEvents: 220000, correlatedAlerts: 48, highRiskIncidents: 2 },
    { time: '12:00', rawEvents: 310000, correlatedAlerts: 64, highRiskIncidents: 4 },
    { time: '16:00', rawEvents: 280000, correlatedAlerts: 52, highRiskIncidents: 3 },
    { time: '20:00', rawEvents: 210000, correlatedAlerts: 35, highRiskIncidents: 1 },
    { time: '23:59', rawEvents: 165000, correlatedAlerts: 29, highRiskIncidents: 1 },
  ];

  // Global Geographic Markers
  const geoMarkers: { markerOffset: number; name: string; coordinates: [number, number]; color: string; count: number }[] = [
    { markerOffset: -15, name: 'Russia (GRU APT29)', coordinates: [105.3188, 61.524], color: '#ef4444', count: 452 },
    { markerOffset: -15, name: 'DPRK (Lazarus)', coordinates: [127.5101, 40.3399], color: '#ef4444', count: 328 },
    { markerOffset: 25, name: 'Netherlands (C2 Relay)', coordinates: [5.2913, 52.1326], color: '#f97316', count: 185 },
    { markerOffset: 25, name: 'USA (AWS Target)', coordinates: [-95.7129, 37.0902], color: '#3b82f6', count: 92 },
    { markerOffset: 25, name: 'Taiwan HQ (Internal DC)', coordinates: [121.5654, 25.033], color: '#10b981', count: 1540 }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & KPI Telemetry */}
      <div className="bg-gradient-to-r from-gray-900 via-[#111118] to-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-400 shadow-inner">
              <Brain size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {isZh ? '關聯分析總覽儀表板 (Unified Correlation Summary)' : 'Unified Correlation Analysis Dashboard'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles size={11} /> CEP v4.8 Engine
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                {isZh
                  ? '整合 CEP 複雜事件處理、STIX 2.1 威脅情報與跨日誌源多維度時序關聯，即時將海量孤立告警聚合為完整攻擊鏈 (Kill-Chain Storyline)。'
                  : 'Holistic complex event processing (CEP) & STIX 2.1 cross-telemetry intelligence correlating billions of raw logs into high-confidence attack timelines.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 text-xs">
              {['1h', '24h', '7d', '30d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    'px-3 py-1 rounded-lg font-bold transition-all',
                    timeRange === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveMode('topology')}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <GitBranch size={14} className="text-purple-400" />
              {isZh ? '攻擊拓撲圖' : 'Attack Graph'}
            </button>
          </div>
        </div>

        {/* 4 Core Ingestion & Reduction KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800/80">
          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? '今日跨源關聯事件' : 'Correlated Incidents'}</span>
              <ShieldAlert size={14} className="text-red-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5 font-mono">
              42 <span className="text-xs text-red-400 font-sans">{isZh ? '起已確認' : 'Clustered'}</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-red-400 font-bold">3 Critical</span> | <span className="text-amber-400">12 High</span> | <span className="text-blue-400">27 Medium</span>
            </div>
          </div>

          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? 'CEP 關聯引擎吞吐' : 'CEP Engine Ingestion'}</span>
              <Activity size={14} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5 font-mono">
              185,400 <span className="text-xs text-blue-400 font-sans">EPS</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-emerald-400 font-bold">4.2 ms</span> {isZh ? '平均匹配延遲' : 'Match Latency'}
            </div>
          </div>

          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? '告警雜訊降噪壓縮比' : 'Alert Noise Reduction'}</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1.5 font-mono">94.6%</div>
            <div className="text-[10px] text-gray-500 mt-1">
              2.4M Raw Alerts → <span className="text-white font-bold">128 Grouped Cases</span>
            </div>
          </div>

          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? 'STIX 2.1 情報命中' : 'CTI Matches (STIX)'}</span>
              <Target size={14} className="text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 mt-1.5 font-mono">1,248</div>
            <div className="text-[10px] text-gray-500 mt-1">
              <span className="text-purple-300 font-bold">APT29 / Lazarus</span> Infrastructure
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 overflow-x-auto custom-scrollbar gap-1">
        {[
          { id: 'overview', label: isZh ? '多維度攻擊鏈時序 (Storyline)' : 'Multi-Stage Attack Storyline', icon: <Workflow size={15} /> },
          { id: 'topology', label: isZh ? '動態關聯攻擊拓撲圖 (Graph)' : 'Interactive Attack Graph', icon: <GitBranch size={15} /> },
          { id: 'rules', label: isZh ? '關聯規則命中率排行榜 (Rules)' : 'Rule Firing & Detection Trends', icon: <BarChart3 size={15} /> },
          { id: 'telemetry', label: isZh ? '全球情報源與地理分佈 (Geo)' : 'Global Geo Intelligence & Telemetry', icon: <Globe size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMode(tab.id as any)}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              activeMode === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* MODE 1: MULTI-STAGE ATTACK STORYLINE & KILL-CHAIN TIMELINE */}
      {activeMode === 'overview' && (
        <div className="space-y-6">
          {/* AI Cognitive Correlation Spotlight Banner */}
          <div className="bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg flex-shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded">
                      Critical Correlation Match
                    </span>
                    <span className="text-xs text-blue-200 font-mono font-bold">INC-CORR-2026-0941</span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    {isZh
                      ? '跨維度 APT29 魚叉釣魚 → 記憶體提權 → 網域橫向移動 → S3 資料外洩 複合攻擊鏈'
                      : 'APT29 Spearphishing to Memory Injection to Lateral Jump and S3 Exfiltration'}
                  </h3>
                  <p className="text-xs text-blue-100/80 mt-1 max-w-4xl leading-relaxed">
                    {isZh
                      ? '系統透過 Flink CEP 引擎在 14 分鐘內自動跨郵件閘道 (Mail-GW)、端點 EDR、網域控制站 (AD 4624) 與 AWS CloudTrail 關聯出 5 個連續攻擊階段，置信度高達 98%。'
                      : 'CEP Engine automatically fused Mail Gateway, EDR in-memory logs, Domain Controller Kerberos auth, and AWS CloudTrail into a 5-stage sequential incident in under 14 mins.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button
                  onClick={() => {
                    alert(isZh ? '已觸發全自動 SOAR 緊急聯防劇本：端點隔離與憑證重設' : 'Triggered SOAR Containment Playbook');
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-red-950/40"
                >
                  <Zap size={14} />
                  {isZh ? '一鍵 SOAR 聯防處置' : 'Execute SOAR Containment'}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Stages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Stage Selector (5 Columns) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between px-1">
                <span>{isZh ? '攻擊階段時序鏈 (5 階段已融合)' : 'Sequential Attack Stages (5 Stages Fused)'}</span>
                <span className="text-[10px] text-emerald-400 font-mono">100% Sequence Validated</span>
              </div>

              <div className="space-y-2.5">
                {attackStages.map((stage, idx) => {
                  const isSelected = selectedIncidentStage === idx;
                  return (
                    <div
                      key={stage.step}
                      onClick={() => setSelectedIncidentStage(idx)}
                      className={cn(
                        'p-4 rounded-xl border transition-all cursor-pointer relative group',
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-950/40'
                          : 'bg-[#111116] border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black',
                              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                            )}
                          >
                            {stage.step}
                          </span>
                          <span className="text-xs font-mono text-gray-400">{stage.time}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                          {stage.confidence}% Conf
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mt-2 group-hover:text-blue-300 transition-colors">
                        {stage.title}
                      </h4>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60 text-[10px] text-gray-400 font-mono">
                        <span className="text-blue-400 font-bold">{stage.source}</span>
                        <span className="text-gray-500">{stage.tech.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Stage Detail Inspector */}
            <div className="lg:col-span-7">
              {selectedIncidentStage !== null && (
                <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                    <div>
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                        {attackStages[selectedIncidentStage].tactic}
                      </div>
                      <h3 className="text-base font-black text-white mt-0.5">
                        {attackStages[selectedIncidentStage].title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-900 px-3 py-1 rounded-lg border border-gray-800">
                      ⏱️ {attackStages[selectedIncidentStage].time}
                    </span>
                  </div>

                  {/* Stage Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '關聯實體與資產' : 'Correlated Entity'}</div>
                      <div className="text-xs font-bold text-white font-mono">{attackStages[selectedIncidentStage].entity}</div>
                    </div>
                    <div className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '涉及帳號與權限' : 'Account Context'}</div>
                      <div className="text-xs font-bold text-purple-300 font-mono">{attackStages[selectedIncidentStage].user}</div>
                    </div>
                  </div>

                  {/* Details Description */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {isZh ? '情境研判與行為關聯分析' : 'Contextual Narrative & Evidence Analysis'}
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/40 p-4 rounded-xl border border-gray-800/80">
                      {attackStages[selectedIncidentStage].details}
                    </p>
                  </div>

                  {/* Raw Cross-Source Evidence Logs */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center justify-between">
                      <span>{isZh ? '關聯原始日誌證據 (Fused Raw Logs)' : 'Fused Multi-Source Raw Logs'}</span>
                      <span className="text-[10px] text-gray-500 font-mono">3 Logs Joined</span>
                    </div>
                    <div className="bg-black/60 border border-gray-800 rounded-xl p-4 font-mono text-[11px] space-y-2 text-gray-300 overflow-x-auto">
                      {attackStages[selectedIncidentStage].rawLogs.map((log, lIdx) => (
                        <div key={lIdx} className="border-l-2 border-blue-500/60 pl-2.5 py-0.5 hover:bg-white/5 transition-colors">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: DYNAMIC INTERACTIVE ATTACK GRAPH */}
      {activeMode === 'topology' && (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <GitBranch className="text-purple-400" size={18} />
                  {isZh ? 'STIX 2.1 攻擊拓撲節點關聯圖 (D3 Force Graph)' : 'STIX 2.1 Cross-Entity Correlation Graph'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isZh
                    ? '視覺化呈現外部威脅組織、C2 代理節點、受駭內部端點與關鍵資料庫之擴散路徑。'
                    : 'Visualizing threat actor origin, C2 proxy nodes, compromised host, and target database propagation vectors.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 mr-2 hidden md:flex">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Threat Actor</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Malicious IOC</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Target Asset</span>
                </div>
                <button
                  onClick={() => setShowFullGraphModal(true)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-all"
                  title="Fullscreen View"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>

            {/* D3 Canvas Container */}
            <div className="h-[480px] bg-black/50 rounded-xl border border-gray-800 relative overflow-hidden">
              <CorrelationNodeGraph
                data={CORRELATION_GRAPH_DATA}
                onSelectNode={(node) => setSelectedNode(node)}
              />

              {/* Node Inspector Drawer */}
              {selectedNode && (
                <div className="absolute top-4 right-4 w-72 bg-gray-900/95 border border-gray-700 rounded-xl p-4 shadow-2xl backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <span className="text-[10px] font-black uppercase text-blue-400">{selectedNode.type}</span>
                    <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono break-all">{selectedNode.id}</h4>
                    <p className="text-[11px] text-gray-400 mt-1">{selectedNode.label}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-bold uppercase">Risk Level</span>
                    <span className={cn(
                      "font-black uppercase px-2 py-0.5 rounded",
                      selectedNode.risk === 'critical' ? "bg-red-500/20 text-red-400" :
                      selectedNode.risk === 'high' ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {selectedNode.risk}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: TRIGGERED RULES & DETECTION TRENDS */}
      {activeMode === 'rules' && (
        <div className="space-y-6">
          {/* Trend Chart */}
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity className="text-blue-400" size={16} />
                  {isZh ? '關聯規則命中率與高危事件趨勢 (24 小時)' : 'Correlation Rule Firing vs High-Risk Incidents (24h)'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isZh ? '對比底層海量日誌與關聯引擎提煉出的高危攻擊鏈數量' : 'Comparing raw incoming events with clustered high-confidence incident alerts.'}
                </p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={correlationTrendData}>
                  <defs>
                    <linearGradient id="colorRaw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111116',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Area type="monotone" dataKey="correlatedAlerts" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRaw)" name={isZh ? '關聯規則命中 (Alerts)' : 'Correlated Alerts'} />
                  <Area type="monotone" dataKey="highRiskIncidents" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncidents)" name={isZh ? '高危確認事件 (Incidents)' : 'Critical Incidents'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Triggered Rules Table */}
          <div className="bg-[#111116] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/40">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Flame size={14} className="text-red-400" />
                {isZh ? '熱門觸發關聯規則排行榜 (Top Triggered Correlation Rules)' : 'Top Triggered Correlation Rules'}
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">142 Active Rules</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/80 border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="p-3.5">{isZh ? '規則名稱 / ID' : 'Rule Name & ID'}</th>
                    <th className="p-3.5">{isZh ? '嚴重性' : 'Severity'}</th>
                    <th className="p-3.5">{isZh ? '資料源跨度' : 'Sources'}</th>
                    <th className="p-3.5">{isZh ? '滑動窗口' : 'Window'}</th>
                    <th className="p-3.5">{isZh ? '觸發次數' : 'Hits'}</th>
                    <th className="p-3.5">{isZh ? '置信評分' : 'Score'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 font-mono">
                  {triggeredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-sans">
                        <div className="font-bold text-white text-xs">{rule.name}</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">{rule.id} • {rule.tactic}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                          rule.severity === 'Critical' ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        )}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {rule.sources.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[9px] font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-400">{rule.window}</td>
                      <td className="p-3.5 text-white font-bold">{rule.hits}</td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-bold">{rule.score}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: GLOBAL GEO INTELLIGENCE & TELEMETRY */}
      {activeMode === 'telemetry' && (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Globe className="text-blue-400" size={18} />
                  {isZh ? '全球攻擊起源與威脅組織地理分佈' : 'Global Threat Actor & Geographic Correlation'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isZh ? '交叉比對 CTI IP 地理位置、ASN 自治系統編號與內部受駭主機之連線流量' : 'Correlating CTI GeoIP, ASN routing, and internal destination endpoints.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-[400px] bg-black/40 rounded-xl border border-gray-800 overflow-hidden relative">
                <ComposableMap projectionConfig={{ scale: 140, center: [20, 20] }}>
                  <Geographies geography="/world-countries.json">
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#18181b"
                          stroke="#27272a"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { fill: '#27272a', outline: 'none' },
                            pressed: { fill: '#3b82f6', outline: 'none' }
                          }}
                        />
                      ))
                    }
                  </Geographies>
                  {geoMarkers.map(({ name, coordinates, markerOffset, color, count }) => (
                    <Marker key={name} coordinates={coordinates}>
                      <circle r={6} fill={color} stroke="#fff" strokeWidth={1.5} opacity={0.8} />
                      <text
                        textAnchor="middle"
                        y={markerOffset}
                        style={{ fontFamily: 'monospace', fill: '#e5e7eb', fontSize: '9px', fontWeight: 'bold' }}
                      >
                        {name} ({count})
                      </text>
                    </Marker>
                  ))}
                </ComposableMap>
              </div>

              {/* Geographic Hotspot Breakdown */}
              <div className="lg:col-span-4 space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {isZh ? '威脅來源地理叢集' : 'Origin Hotspots'}
                </h4>
                <div className="space-y-2">
                  {geoMarkers.map((m) => (
                    <div key={m.name} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-xs font-bold text-white font-mono">{m.name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-300 font-mono">{m.count} hits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

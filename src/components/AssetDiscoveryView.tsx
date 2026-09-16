import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Database, Filter, ChevronRight, Monitor, Skull, ShieldAlert, Terminal, 
  SearchCode, Fingerprint, Signal, Globe, RefreshCw, Play, Clock, Download, 
  Search, CheckCircle2, ShieldX, Radio, X, Sparkles, Check, AlertCircle, 
  Network, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';

export interface DiscoveredHost {
  ip: string;
  hostname: string;
  os: string;
  status: string;
  services: string;
  vulnerabilities: number;
  hasReport?: boolean;
  mac?: string;
  lastSeen?: string;
  uptime?: string;
  portCount?: number;
  actor?: string;
  timestamp: number;
}

const DEFAULT_DISCOVERED_HOSTS: DiscoveredHost[] = [
  { 
    ip: '10.120.100.100', 
    hostname: 'WIN-23LQ', 
    os: 'Windows Server 2022', 
    status: 'Up', 
    services: '3306, 445, 3389, 5985, 8088, 7001 + 8 more', 
    vulnerabilities: 14, 
    hasReport: true,
    mac: '00:15:5D:8A:2B:CC',
    lastSeen: '剛剛 (Just now)',
    uptime: '24d 12h 45m',
    actor: 'Lazarus Group',
    portCount: 14,
    timestamp: Date.now() - 60000
  },
  { 
    ip: '10.0.0.1', 
    hostname: 'gateway.internal', 
    os: 'MikroTik RouterOS', 
    status: 'Up', 
    services: '80, 443, 22', 
    vulnerabilities: 0,
    mac: 'E4:8D:8C:F2:1A:01',
    lastSeen: '2 分鐘前',
    uptime: '365d 04h 12m',
    actor: 'None',
    portCount: 3,
    timestamp: Date.now() - 120000
  },
  { 
    ip: '10.0.0.12', 
    hostname: 'db-prod-cluster', 
    os: 'Ubuntu 20.04 LTS', 
    status: 'Up', 
    services: '5432, 22', 
    vulnerabilities: 5,
    mac: '00:50:56:B3:94:DD',
    lastSeen: '5 分鐘前',
    uptime: '12d 18h 30m',
    actor: 'Sandworm',
    portCount: 2,
    timestamp: Date.now() - 300000
  },
  { 
    ip: '10.0.0.45', 
    hostname: 'nas-storage-01', 
    os: 'Synology DSM 7.x', 
    status: 'Up', 
    services: '445, 139, 2049', 
    vulnerabilities: 8,
    mac: '00:11:32:8E:45:90',
    lastSeen: '12 分鐘前',
    uptime: '89d 02h 15m',
    actor: 'APT28',
    portCount: 3,
    timestamp: Date.now() - 720000
  },
  { 
    ip: '10.0.0.100', 
    hostname: 'workstation-dev-01', 
    os: 'Windows 11 Pro', 
    status: 'Down', 
    services: '', 
    vulnerabilities: 0,
    mac: 'D8:BB:C1:2F:90:BB',
    lastSeen: '離線 (Offline)',
    uptime: '0m',
    actor: 'None',
    portCount: 0,
    timestamp: Date.now() - 1800000 
  }
];

export function TopologyMap({ hosts, onNodeSelect, selectedId }: { hosts: DiscoveredHost[], onNodeSelect: (id: string) => void, selectedId: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || hosts.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    d3.select(containerRef.current).selectAll("svg").remove();

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    const nodes = [
      { id: 'Scanner', type: 'scanner', label: 'SEMOR Probe' },
      { id: 'Switch', type: 'switch', label: 'Core Switch' },
      ...hosts.map(h => ({ id: h.ip, type: h.hasReport ? 'target' : 'host', label: h.hostname || h.ip }))
    ];

    const links = [
      { source: 'Scanner', target: 'Switch' },
      ...hosts.map(h => ({ source: 'Switch', target: h.ip }))
    ];

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(220))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any)
      .on("click", (event: any, d: any) => {
        if (d.type === 'target' || d.type === 'host') {
          onNodeSelect(d.id);
        }
      });

    node.append("circle")
      .attr("r", (d: any) => d.type === 'scanner' ? 18 : d.type === 'switch' ? 14 : 10)
      .attr("fill", (d: any) => {
        if (d.id === selectedId) return "#3b82f6";
        return d.type === 'scanner' ? "#3b82f6" : d.type === 'switch' ? "#6366f1" : d.type === 'target' ? "#ef4444" : "#10b981";
      })
      .attr("stroke", (d: any) => d.id === selectedId ? "#3b82f6" : "#000")
      .attr("stroke-width", (d: any) => d.id === selectedId ? 4 : 2)
      .style("filter", (d: any) => d.type === 'scanner' || d.id === selectedId ? "drop-shadow(0 0 12px rgba(59,130,246,0.6))" : "none");

    node.append("text")
      .attr("dx", 28)
      .attr("dy", 4)
      .text((d: any) => d.label)
      .attr("font-size", "13px")
      .attr("fill", (d: any) => d.id === selectedId ? "#fff" : d.type === 'scanner' ? "#3b82f6" : "#94a3b8")
      .attr("font-weight", (d: any) => d.id === selectedId ? "black" : "bold")
      .style("user-select", "none")
      .attr("font-family", "JetBrains Mono, monospace");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as any).x)
        .attr("y1", (d: any) => (d.source as any).y)
        .attr("x2", (d: any) => (d.target as any).x)
        .attr("y2", (d: any) => (d.target as any).y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [hosts, selectedId]);

  return (
    <div className="relative w-full h-full bg-[#050505] rounded-2xl border border-gray-800 overflow-hidden shadow-inner flex flex-col min-h-[450px]">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-black/40 p-4 rounded-xl border border-gray-800/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">掃描器實例 (Scanner)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">網路節點 (GCB 基準)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">活躍主機 (Active Host)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">致命威脅 (Critical Threat)</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 cursor-grab active:cursor-grabbing h-full" />
    </div>
  );
}

export function DiscoveryFindingsSummary({ hosts }: { hosts: DiscoveredHost[] }) {
  const criticalHost = hosts.find(h => h.hasReport);
  if (!criticalHost) return null;

  const maxVulns = Math.max(...hosts.map(h => h.vulnerabilities));
  const rating = maxVulns >= 10 ? '致命高風險 (Critical)' : maxVulns >= 5 ? '中度風險 (Medium)' : '低風險 (Low)';
  const ratingColor = maxVulns >= 10 ? 'text-red-500' : maxVulns >= 5 ? 'text-orange-500' : 'text-green-500';
  const ratingBg = maxVulns >= 10 ? 'bg-red-600' : maxVulns >= 5 ? 'bg-orange-600' : 'bg-green-600';
  const ratingLightBg = maxVulns >= 10 ? 'bg-red-500/10' : maxVulns >= 5 ? 'bg-orange-500/10' : 'bg-green-500/10';
  const ratingBorder = maxVulns >= 10 ? 'border-red-500/20' : maxVulns >= 5 ? 'border-orange-500/20' : 'border-green-500/20';

  return (
    <div className="space-y-12 py-10 border-t border-gray-800 mt-10">
      <div className="flex items-center gap-4 border-l-4 border-blue-600 pl-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">SEMOR 自動化掃描發現分析報告 (Scan Findings Breakdown)</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">針對目標網段 {criticalHost.ip.split('.').slice(0, 3).join('.')}.0/24 之綜合弱點評估結果</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Section I: Risk Assessment */}
        <div className="bg-[#111114] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-6 mb-8">
            <div className="text-3xl font-black text-white px-6 py-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">一</div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">資安風險綜合評估 (Risk Assessment)</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className={cn(
              "lg:col-span-1 border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-inner",
              ratingLightBg, ratingBorder
            )}>
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-6",
                  ratingBg
                )}
              >
                <Skull className="text-white w-12 h-12" />
              </motion.div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">整體風險評等</span>
              <div className={cn("text-3xl font-black italic uppercase", ratingColor)}>
                {maxVulns >= 10 ? '🔴 ' : maxVulns >= 5 ? '🟠 ' : '🟢 '}
                {rating}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 leading-tight font-bold uppercase tracking-widest italic">
                {maxVulns >= 10 ? '偵測到致命資安防護警訊' : maxVulns >= 5 ? '偵測到升高的威脅態勢' : '建議維持日常資安維護'}
              </p>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="bg-zinc-900 border border-gray-800 p-8 rounded-3xl relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <CheckCircle2 size={120} />
                </div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <span className="p-1.5 bg-blue-600/20 rounded-lg"><CheckCircle2 size={16} className="text-blue-400" /></span>
                  核心結論與診斷摘要 (Executive Summary)
                </h4>
                <div className="text-base text-gray-300 font-medium leading-relaxed space-y-4">
                  <p>
                    於網段 <span className="text-blue-400 font-mono">10.120.100.0/24</span> 執行的探測作業中，發現主機 <span className="text-white font-bold">{criticalHost.hostname} ({criticalHost.ip})</span> 存在關鍵弱點叢集。
                    開放多達 <span className="text-red-500 font-black">14 個服務埠</span> 形成了巨大的攻擊面，嚴重偏離政府資安基準 (GCB) 與企業資安規範。
                  </p>
                  <div className={cn(
                    "p-5 rounded-2xl flex items-center gap-4 shadow-xl",
                    ratingBg
                  )}>
                    <ShieldX size={28} className="text-white animate-bounce" />
                    <p className="text-sm font-black text-white uppercase tracking-wider">
                      {maxVulns >= 10 ? '緊急告警：目標主機必須立即自生產網段實施實體隔離。' :
                       maxVulns >= 5 ? '警告：請於 48 小時內完成弱點修補以防遭受利用。' :
                       '提示：建議執行例行性軟體修補與系統組態加固。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section II: Detection Explanation */}
        <div className="bg-[#111114] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-6 mb-8">
            <div className="text-3xl font-black text-white px-6 py-3 bg-blue-600 rounded-2xl">二</div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">偵測發現說明 (Detection Explanation)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-blue-400" />
                <span className="text-[11px] font-black text-gray-200 uppercase tracking-widest">A. 核心資料庫直連曝光 (3306)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">"MySQL 資料庫直接對網路開放且無白名單管控。探測期間已成功擷取出 Salt 驗證特徵。"</p>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-gray-300 font-bold uppercase"><span className="text-red-500">修復方案:</span> 限制只能綁定 localhost 或 VPC 內部特定 IP 網段。於 DB 層級啟用多因素驗證。</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-blue-400" />
                <span className="text-[11px] font-black text-gray-200 uppercase tracking-widest">B. Web 服務組態安全性缺失 (8088)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">"於 Nginx/Kestrel 端點探測到不安全的 TRACE 方法以及 Allow-Origin: * 全開放跨域策略。"</p>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-gray-300 font-bold uppercase"><span className="text-red-500">修復方案:</span> 於 nginx.conf 停用 TRACE 方法。將 CORS Allow-Origin 嚴格限制為指定內部網域。</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Network size={20} className="text-blue-400" />
                <span className="text-[11px] font-black text-gray-200 uppercase tracking-widest">C. 協定簽章缺失防護瑕疵 (445)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">"SMB 簽章已設定為啟用但非強制。違反 GCB 政府資安基準，易遭受身分驗證中繼轉發攻擊。"</p>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-gray-300 font-bold uppercase"><span className="text-red-500">修復方案:</span> 透過 Active Directory GPO 於全數內網網段強制執行「需要訊息簽署」。</p>
              </div>
            </div>

            <div className="md:col-span-3 bg-zinc-900 border border-gray-800 p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-green-400" />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">整體處置與應變策略 (Remediation Strategy)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    即時緊急處置 (T+0h)
                  </h5>
                  <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                    <li>將 {criticalHost.ip} 從核心交換器網段斷開實施隔離。</li>
                    <li>撤銷掃描期間暴露的 MySQL 暫時性存取憑證。</li>
                    <li>發動事件應變程序 (Incident Response) 第一階段應對。</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    中長期系統加固 (未來 48 小時內)
                  </h5>
                  <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                    <li>重新配置 Nginx 拒絕不合規之 HTTP 請求方法。</li>
                    <li>於該網段全面更新並推送 GCB 資安基準套件。</li>
                    <li>針對 {criticalHost.hostname} 排定人工深度滲透測試。</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetDiscoveryView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const [target, setTarget] = useState('10.120.100.0/24');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'System ready. Prior discovery database loaded.',
    'Discovered 5 reactive hosts in subnet 10.120.100.0/24.',
    'Analysis complete. Critical CVEs and vulnerability details identified.'
  ]);
  const [progress, setProgress] = useState(100);
  const [results, setResults] = useState<DiscoveredHost[]>(DEFAULT_DISCOVERED_HOSTS);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [expandedHost, setExpandedHost] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'inventory' | 'topology'>('inventory');
  const [filters, setFilters] = useState({
    os: 'All',
    status: 'All',
    minPorts: 0,
    severity: 'All',
    actor: 'All'
  });
  const [topoSelectedHost, setTopoSelectedHost] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1 day');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const startScan = async () => {
    setIsScanning(true);
    setLogs([]);
    setProgress(0);
    setResults([]);

    const now = Date.now();
    const timestampLog = () => new Date().toLocaleTimeString();
    const addLog = (msg: string) => setLogs(prev => [...prev, `${timestampLog()} - ${msg}`]);

    addLog('Starting NMAP path discovery...');
    addLog('Flags: -sS -sV -O --script vulners -T4');
    addLog(`Target: ${target}`);
    
    // Step 1: Host Discovery
    await new Promise(r => setTimeout(r, 600));
    setProgress(15);
    addLog('Host discovery initiated. Sending ARP probes...');
    await new Promise(r => setTimeout(r, 400));
    addLog('ARP response received from 12 gateway nodes.');
    addLog('Discovered 4 reactive hosts in targeted subnet.');

    // Step 2: Port Scanning
    setProgress(30);
    addLog('Beginning SYN Stealth Scan against 1000 common ports...');
    await new Promise(r => setTimeout(r, 800));
    setProgress(45);
    addLog('Port 80/tcp open on 10.0.0.1');
    addLog('Port 443/tcp open on 10.0.0.1');
    addLog('Port 5432/tcp open on 10.0.0.12');
    addLog('Port 22/tcp open on 10.0.0.12');
    addLog('Port 445/tcp open on 10.0.0.45');
    addLog('Port 139/tcp open on 10.0.0.45');
    addLog('Port 3389/tcp open on 10.0.0.100');
    addLog('Port 3306/tcp open on 10.120.100.100');
    addLog('Port 445/tcp open on 10.120.100.100');
    addLog('Port 8088/tcp open on 10.120.100.100');
    addLog('Port 7001/tcp open on 10.120.100.100');

    // Step 3: OS and Service Fingerprinting
    setProgress(70);
    addLog('Fingerprinting OS signatures and services banner grab...');
    await new Promise(r => setTimeout(r, 600));
    addLog('10.120.100.100 identified as Windows Server 2022 (Datacenter)');
    addLog('10.0.0.1 identified as MikroTik RouterOS (Gateway)');
    addLog('10.0.0.12 identified as PostgreSQL 13.4 on Ubuntu Focal');
    addLog('10.0.0.45 identified as Synology DiskStation Manager (DSM)');
    addLog('10.0.0.100 identified as Windows 11 Pro Enterprise');

    // Step 4: Vulnerability Scanning
    setProgress(90);
    addLog('Executing NSE Script: vulners.nse...');
    await new Promise(r => setTimeout(r, 1000));
    addLog('Analysis complete. Critical CVEs detected on 10.120.100.100');
    
    setProgress(100);
    setResults([
      { 
        ip: '10.120.100.100', 
        hostname: 'WIN-23LQ', 
        os: 'Windows Server 2022', 
        status: 'Up', 
        services: '3306, 445, 3389, 5985, 8088, 7001 + 8 more', 
        vulnerabilities: 14, 
        hasReport: true,
        mac: '00:15:5D:8A:2B:CC',
        lastSeen: '剛剛 (Just now)',
        uptime: '24d 12h 45m',
        actor: 'Lazarus Group',
        portCount: 14,
        timestamp: now
      },
      { 
        ip: '10.0.0.1', 
        hostname: 'gateway.internal', 
        os: 'MikroTik RouterOS', 
        status: 'Up', 
        services: '80, 443, 22', 
        vulnerabilities: 0,
        mac: 'E4:8D:8C:F2:1A:01',
        lastSeen: '2 分鐘前',
        uptime: '365d 04h 12m',
        actor: 'None',
        portCount: 3,
        timestamp: now - 120000
      },
      { 
        ip: '10.0.0.12', 
        hostname: 'db-prod-cluster', 
        os: 'Ubuntu 20.04 LTS', 
        status: 'Up', 
        services: '5432, 22', 
        vulnerabilities: 5,
        mac: '00:50:56:B3:94:DD',
        lastSeen: '5 分鐘前',
        uptime: '12d 18h 30m',
        actor: 'Sandworm',
        portCount: 2,
        timestamp: now - 300000
      },
      { 
        ip: '10.0.0.45', 
        hostname: 'nas-storage-01', 
        os: 'Synology DSM 7.x', 
        status: 'Up', 
        services: '445, 139, 2049', 
        vulnerabilities: 8,
        mac: '00:11:32:8E:45:90',
        lastSeen: '12 分鐘前',
        uptime: '89d 02h 15m',
        actor: 'APT28',
        portCount: 3,
        timestamp: now - 720000
      },
      { 
        ip: '10.0.0.100', 
        hostname: 'workstation-dev-01', 
        os: 'Windows 11 Pro', 
        status: 'Down', 
        services: '', 
        vulnerabilities: 0,
        mac: 'D8:BB:C1:2F:90:BB',
        lastSeen: '離線 (Offline)',
        uptime: '0m',
        actor: 'None',
        portCount: 0,
        timestamp: now - 1800000 
      }
    ]);
    setIsScanning(false);
    addLog('Scan finished. 5 hosts up (1024 IP addresses scanned).');
  };

  // CSV Export Implementation
  const handleExportCsv = () => {
    const dataToExport = filteredResults.length > 0 ? filteredResults : results;
    if (!dataToExport || dataToExport.length === 0) {
      showToast(isZh ? '目前沒有可供匯出的發現資料' : 'No discovery records to export.');
      return;
    }

    const headers = [
      "Hostname",
      "IP Address",
      "Status",
      "Operating System",
      "Risk Severity",
      "Vulnerabilities Count",
      "Associated Threat Actor",
      "Probed Ports & Services",
      "Identified CVEs",
      "Scan Findings Breakdown",
      "Remediation Strategy & Action Plan",
      "MAC Address",
      "Uptime",
      "Last Scanned"
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = dataToExport.map(host => {
      const riskLevel = host.vulnerabilities >= 10 ? 'Critical' :
                        host.vulnerabilities >= 5 ? 'High' :
                        host.vulnerabilities > 0 ? 'Medium' : 'Low';

      let cves = "None Detected";
      let findings = "Baseline security parameters verified; No critical CVEs detected";
      let remediation = "Maintain regular scheduled patching and operational baseline checks";

      if (host.ip === '10.120.100.100') {
        cves = "CVE-2024-21413, CVE-2023-5678, CVE-2022-9999, CVE-2024-30078";
        findings = "1. Direct MySQL 3306 exposure without network ACL; 2. Web service HTTP TRACE method enabled & CORS wildcard (*); 3. SMB unforced packet signing; 4. RTSP/SIP backup path leak (Trinity.txt.bak)";
        remediation = "Isolate host from production segment immediately; Bind MySQL to internal VPC subnet; Disable TRACE & restrict CORS origins in Nginx; Enforce SMB packet signing via AD GPO";
      } else if (host.ip === '10.0.0.12') {
        cves = "CVE-2024-1234, CVE-2023-38545";
        findings = "1. PostgreSQL 5432 exposed to broad subnet; 2. Outdated OpenSSL libcrypto.so library; 3. Deprecated SSH MAC algorithms (3DES-CBC, RC4)";
        remediation = "Upgrade PostgreSQL to v13.5+; Recompile OpenSSL to 1.1.1t+; Restrict allowed ciphers in /etc/ssh/sshd_config";
      } else if (host.ip === '10.0.0.45') {
        cves = "CVE-2023-3450, CVE-2023-2729";
        findings = "1. Legacy SMBv1/v2 enabled on NAS storage; 2. Overly permissive NFS export parameters on port 2049; 3. DSM administrative portal exposed on untrusted segment";
        remediation = "Disable SMBv1 daemon; Restrict NFS mount permissions by CIDR block; Enforce MFA on administrative portal";
      } else if (host.ip === '10.0.0.1') {
        cves = "Baseline Verified (0 CVE)";
        findings = "Perimeter router gateway ports 80, 443, 22 operational; Access list applied";
        remediation = "Apply quarterly RouterOS firmware upgrades and audit management access control lists";
      } else if (host.ip === '10.0.0.100') {
        cves = "N/A (Host Offline)";
        findings = "Node offline or unreachable during scheduled probe window; No responsive ports";
        remediation = "Verify physical cabling, network power, and endpoint agent heartbeat status";
      }

      return [
        escapeCsv(host.hostname),
        escapeCsv(host.ip),
        escapeCsv(host.status),
        escapeCsv(host.os),
        escapeCsv(riskLevel),
        escapeCsv(host.vulnerabilities),
        escapeCsv(host.actor || 'None'),
        escapeCsv(host.services),
        escapeCsv(cves),
        escapeCsv(findings),
        escapeCsv(remediation),
        escapeCsv(host.mac || 'N/A'),
        escapeCsv(host.uptime || 'N/A'),
        escapeCsv(host.lastSeen || new Date(host.timestamp).toLocaleString())
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `discovery_findings_vulnerabilities_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(isZh 
      ? `已成功匯出 ${dataToExport.length} 筆主機之弱點發現細節 (CSV 格式)` 
      : `Successfully exported ${dataToExport.length} host vulnerability findings to CSV.`
    );
  };

  const renderDetailedReport = () => {
    if (!selectedHost) return null;
    
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedHost(null)}
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-[#0d0d0f] border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="bg-red-500/20 p-3 rounded-2xl border border-red-500/30">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">弱點防禦評估報告 (Assessment Report)</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">受評估目標主機: {selectedHost} (WIN-23LQ)</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedHost(null)}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
            {/* Section I: Risk Assessment */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-white px-4 py-2 bg-blue-600 rounded-xl">一</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">風險評估與核心結論 (Executive Summary)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] mb-4">
                    <Skull className="text-white w-8 h-8" />
                  </div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">整體綜合評等</h4>
                  <div className="text-2xl font-black text-red-500 italic uppercase tracking-tighter">🔴 致命高風險 (Critical)</div>
                </div>
                
                <div className="md:col-span-3 bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    核心結論與診斷摘要
                  </h4>
                  <div className="text-sm text-gray-300 leading-relaxed font-medium space-y-4">
                    <p>
                      此主機 (10.120.100.100) 曝露極大的攻擊面，對外開啟多達 <span className="text-white font-bold">14 個 TCP 服務連接埠</span>。此狀態嚴重違反政府與企業資安基準 (GCB)，極易遭受資料庫入侵、API 漏洞利用或橫向移動攻擊。
                    </p>
                    <div className="text-red-400 font-bold bg-red-400/5 p-4 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
                      <ShieldX className="shrink-0" size={20} />
                      在完成全數漏洞修補與網段隔離前，嚴禁上線正式營運。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section II: Detection Explanation */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-white px-4 py-2 bg-blue-600 rounded-xl">二</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">偵測發現與威脅說明</h3>
              </div>
              
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 mb-4">
                <p className="text-sm text-gray-200 font-medium">該主機資安評等判定為 <span className="text-red-500 font-black">🔴 致命高風險</span>，主要基於以下三大核心檢驗發現：</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    title: "攻擊面過度龐大且缺乏核心存取控制",
                    desc: "偵測到 14 個開放服務埠。MySQL (3306) 資料庫在無白名單管控下直接對外曝露，攻擊者可輕易發起暴力破解或利用資料庫固有漏洞。"
                  },
                  {
                    title: "Web 服務存在多項不當配置漏洞",
                    desc: "Web 服務 (Nginx/Kestrel) 包含嚴重設定錯誤：啟用不安全的 TRACE 方法以及全開放的 CORS 跨域存取 (Allow-Origin: *)，使系統面臨 XST 攻擊與敏感資料竊取風險。"
                  },
                  {
                    title: "基礎設施安全性設定未達標",
                    desc: "同時啟用多種遠端管理協定 (RDP, WinRM, SMB, RTSP, SIP)，且 SMB 數位簽章未強制執行，違反政府資安基準 (GCB) 與區域防衛原則。"
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-gray-900/50 border border-gray-800 rounded-2xl transition-all hover:bg-gray-800/50">
                    <div className="text-xl font-black text-red-500/20">{i+1}</div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-200 mb-1">{item.title}</h5>
                      <p className="text-xs text-gray-400 leading-relaxed italic">"{item.desc}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section III: Detailed Explanation */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-white px-4 py-2 bg-blue-600 rounded-xl">三</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">技術細節與補強建議</h3>
              </div>

              <div className="space-y-6">
                {/* A. MySQL */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-orange-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-orange-500/5">
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">A. 核心資料庫直連曝光 (MySQL 3306)</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold">致命風險 (Critical)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      詳細技術說明：Nmap 探測確認 <span className="text-white font-mono">MySQL 8.0.45</span> 正於背景運行，並成功擷取出資料庫 salt 與能力標記。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/80 rounded-xl border border-gray-800">
                        <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">影響評估</span>
                        <p className="text-xs text-gray-300">缺乏網段隔離允許外部直接連線，極易遭致爆破與 SQL 隱碼注入。</p>
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <span className="text-[9px] font-black text-green-500 uppercase block mb-1">改善建議與處置</span>
                        <p className="text-xs text-gray-300">於硬體防火牆設定 ACL 規則，僅允許應用伺服器 (App Server) IP 連線，停用跨網段直連。</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. Web Services */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-blue-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-blue-500/5">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">B. 不安全 Web 服務配置 (443, 8088, 8089)</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold">高風險 (High)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      技術發現：Nginx 與 Kestrel 服務啟用了 HTTP TRACE 方法，並將 CORS 策略設定為全開放 (*)。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/80 rounded-xl">
                        <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">風險評估</span>
                        <ul className="text-[11px] text-gray-400 list-disc list-inside space-y-1">
                          <li>TRACE：可被用於 XST 攻擊，攔截竊取認證標頭。</li>
                          <li>CORS：允許惡意跨網域腳本讀取敏感 API 資料。</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <span className="text-[9px] font-black text-green-500 uppercase block mb-1">修復建議</span>
                        <p className="text-xs text-gray-300">於伺服器設定中停用 TRACE；限制 <span className="font-mono">Access-Control-Allow-Origin</span> 僅允許受信任的內部網域。</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Complex Protocols */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-pink-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-pink-500/5">
                    <div className="flex items-center gap-3">
                      <Radio className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">C. 複雜通訊與路徑洩漏 (7001)</span>
                    </div>
                    <span className="text-[10px] font-mono text-orange-400 uppercase font-bold">風險：高 (High)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      技術發現：埠口回應 RTSP、SIP 及 HTTP。301 轉址回應中洩漏備份檔特徵 (<span className="text-white font-mono">Trinity.txt.bak</span>)。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/80 rounded-xl">
                        <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">風險評估</span>
                        <p className="text-xs text-gray-300">缺乏 RTSP/SIP 管控可能使內網易受勒索軟體橫向擴散影響。</p>
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <span className="text-[9px] font-black text-green-500 uppercase block mb-1">處置建議</span>
                        <p className="text-xs text-gray-300">立即封鎖此通訊埠外部存取；刪除 Web 靜態目錄中暴露的備份檔案。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-800 bg-zinc-900/80 flex gap-4">
            <button 
              onClick={handleExportCsv}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <FileSpreadsheet size={18} />
              匯出弱點檢測細節 (Export to CSV)
            </button>
            <button 
              onClick={() => setSelectedHost(null)}
              className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-sm font-black transition-all border border-gray-700 flex items-center justify-center gap-3 shadow-lg"
            >
              關閉評估報告
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const filteredResults = results.filter(h => {
    const osMatch = filters.os === 'All' || h.os.includes(filters.os);
    const statusMatch = filters.status === 'All' || h.status === filters.status;
    const portMatch = (h.portCount || 0) >= filters.minPorts;
    const actorMatch = filters.actor === 'All' || h.actor === filters.actor;
    
    let severityMatch = true;
    if (filters.severity !== 'All') {
      const level = h.vulnerabilities >= 10 ? 'Critical' :
                    h.vulnerabilities >= 5 ? 'High' :
                    h.vulnerabilities > 0 ? 'Medium' : 'Low';
      severityMatch = level === filters.severity;
    }

    let timeMatch = true;
    const now = Date.now();
    const age = now - h.timestamp;
    
    if (timeRange !== 'custom') {
      const msMap: Record<string, number> = {
        'last 15 minutes': 15 * 60 * 1000,
        'last 30 minutes': 30 * 60 * 1000,
        '1 hour': 60 * 60 * 1000,
        '1 day': 24 * 60 * 60 * 1000,
        '7 days': 7 * 24 * 60 * 60 * 1000,
        'this week': 7 * 24 * 60 * 60 * 1000,
        '60 days': 60 * 24 * 60 * 60 * 1000,
        '90 days': 90 * 24 * 60 * 60 * 1000,
        '1 year': 365 * 24 * 60 * 60 * 1000
      };
      if (msMap[timeRange]) {
        timeMatch = age <= msMap[timeRange];
      }
    } else {
      if (customRange.start) {
        const startTs = new Date(customRange.start).getTime();
        timeMatch = timeMatch && h.timestamp >= startTs;
      }
      if (customRange.end) {
        const endTs = new Date(customRange.end).getTime();
        timeMatch = timeMatch && h.timestamp <= endTs;
      }
    }

    return osMatch && statusMatch && portMatch && actorMatch && severityMatch && timeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-3 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHost && renderDetailedReport()}
      </AnimatePresence>
      
      {/* Control Panel */}
      <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 flex flex-col gap-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Time Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} className="text-blue-500" />
              時間關聯分析視窗 (Temporal Window)
            </label>
            <div className="flex gap-2">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-gray-300 font-bold min-w-[200px]"
              >
                <option value="last 15 minutes">最近 15 分鐘</option>
                <option value="last 30 minutes">最近 30 分鐘</option>
                <option value="1 hour">最近 1 小時</option>
                <option value="1 day">最近 24 小時</option>
                <option value="7 days">最近 7 天</option>
                <option value="this week">本週</option>
                <option value="60 days">最近 60 天</option>
                <option value="90 days">最近 90 天</option>
                <option value="1 year">最近 1 年</option>
                <option value="custom">自訂時間範圍</option>
              </select>
              
              {timeRange === 'custom' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                  <input 
                    type="datetime-local" 
                    value={customRange.start}
                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 text-xs focus:border-blue-500 outline-none text-gray-400 font-mono"
                  />
                  <span className="text-gray-600 text-xs uppercase font-black">至</span>
                  <input 
                    type="datetime-local" 
                    value={customRange.end}
                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 text-xs focus:border-blue-500 outline-none text-gray-400 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subnet Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe size={12} className="text-blue-500" />
              目標掃描位址空間 (Target Address Space)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="例如: 10.120.100.0/24"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-gray-700 font-mono"
                />
              </div>
              <button 
                onClick={startScan}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-lg shadow-blue-600/20 active:scale-95 text-white"
              >
                {isScanning ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                {isScanning ? '主機探測中...' : '發動資產掃描'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">時間關聯分析視窗: <span className="text-blue-400">{timeRange === 'custom' ? `${customRange.start || '開始'} ➜ ${customRange.end || '結束'}` : timeRange}</span></p>
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-600 uppercase font-black">已偵測資產數</span>
              <span className="text-sm font-bold text-white">{results.length}</span>
            </div>
            <div className="w-[1px] h-8 bg-gray-800" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-600 uppercase font-black">偵測弱點總數</span>
              <span className="text-sm font-bold text-red-500">{results.reduce((acc, curr) => acc + curr.vulnerabilities, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner UI */}
      <div className="grid grid-cols-1 gap-6">
        {/* Terminal Console */}
        <div className="bg-black rounded-xl border border-gray-800 flex flex-col min-h-[220px] max-h-[300px] shadow-2xl relative overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-blue-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SEMOR NMAP 探測控制台</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-[11px] text-blue-400/80 overflow-y-auto space-y-2 custom-scrollbar">
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-20 grayscale">
                <Radio className="w-12 h-12 animate-pulse" />
                <p className="text-xs uppercase font-black tracking-widest italic">等待發動主探測程序</p>
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 group">
                <span className="text-gray-700 select-none">{i+1}</span>
                <span className={cn(
                  "transition-colors",
                  log.includes('complete') || log.includes('finished') ? "text-green-400 font-bold" : "group-hover:text-white"
                )}>{log}</span>
              </div>
            ))}
            {isScanning && (
              <div className="flex gap-3 animate-pulse">
                <span className="text-gray-700">{logs.length + 1}</span>
                <span className="text-white font-bold opacity-60">腳本引擎執行中...</span>
              </div>
            )}
          </div>
          {isScanning && (
            <div className="p-4 border-t border-gray-800 bg-zinc-900/50">
              <div className="flex justify-between mb-2 px-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">資產發現進度</span>
                <span className="text-[9px] font-black text-blue-400 tracking-tighter">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Discovery Results Table */}
        <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden flex flex-col min-h-[600px] shadow-xl">
          <div className="p-6 border-b border-gray-800 bg-gray-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Database size={16} className="text-purple-400" />
              已發現資產清冊與弱點發現 (Discovery Findings)
            </h3>
            <div className="flex items-center gap-3">
              {results.length > 0 && (
                <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800">
                  <button 
                    onClick={() => setViewMode('inventory')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      viewMode === 'inventory' ? "bg-gray-800 text-blue-400" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    資產清單
                  </button>
                  <button 
                    onClick={() => setViewMode('topology')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      viewMode === 'topology' ? "bg-gray-800 text-purple-400" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    網路拓撲
                  </button>
                </div>
              )}
              {results.length > 0 && (
                <button 
                  id="export-discovery-findings-csv-btn"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-[10px] font-black text-blue-400 uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-sm"
                  title="Export identified vulnerability details to CSV"
                >
                  <Download size={13} className="text-blue-400" />
                  <span>{isZh ? '匯出 CSV' : 'Export to CSV'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          {results.length > 0 && viewMode === 'inventory' && (
            <div className="px-6 py-3 bg-zinc-900 border-b border-gray-800 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 mr-2">
                <Filter size={12} className="text-gray-500" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">清冊篩選條件:</span>
              </div>
              
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">作業系統</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.os}
                  onChange={e => setFilters({...filters, os: e.target.value})}
                >
                  <option value="All">所有系統</option>
                  <option value="Windows">Windows</option>
                  <option value="Ubuntu">Ubuntu</option>
                  <option value="MikroTik">MikroTik</option>
                  <option value="Synology">Synology</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">主機狀態</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.status}
                  onChange={e => setFilters({...filters, status: e.target.value})}
                >
                  <option value="All">所有狀態</option>
                  <option value="Up">上線 (Up)</option>
                  <option value="Down">離線 (Down)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">嚴重等級</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.severity}
                  onChange={e => setFilters({...filters, severity: e.target.value})}
                >
                  <option value="All">所有風險</option>
                  <option value="Critical">致命 (Critical)</option>
                  <option value="High">高風險 (High)</option>
                  <option value="Medium">中風險 (Medium)</option>
                  <option value="Low">低風險 (Low)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">威脅組織</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.actor}
                  onChange={e => setFilters({...filters, actor: e.target.value})}
                >
                  <option value="All">所有組織</option>
                  <option value="Lazarus Group">Lazarus Group</option>
                  <option value="Sandworm">Sandworm</option>
                  <option value="APT28">APT28</option>
                  <option value="None">無關聯</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">最少開放埠數</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="0" max="20" 
                    value={filters.minPorts}
                    onChange={e => setFilters({...filters, minPorts: parseInt(e.target.value)})}
                    className="w-24 accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-blue-400 min-w-[20px]">{filters.minPorts}</span>
                </div>
              </div>

              <button 
                onClick={() => setFilters({os: 'All', status: 'All', minPorts: 0, severity: 'All', actor: 'All'})}
                className="ml-auto text-[9px] font-black text-gray-600 uppercase hover:text-red-500 transition-colors"
              >
                重設篩選
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto custom-scrollbar relative">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center relative">
                  <Search size={32} className="text-gray-600" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-blue-500 rounded-full scale-110"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-400">已就緒，準備執行自動化探測。</p>
                  <p className="text-xs text-gray-600">請輸入目標位址網段，並發動 SEMOR 探測器進行內網主探測。</p>
                </div>
              </div>
            ) : viewMode === 'topology' ? (
              <div className="h-full p-4 relative flex">
                <div className="flex-1 min-w-0">
                  <TopologyMap 
                    hosts={results} 
                    onNodeSelect={(id) => setTopoSelectedHost(id === topoSelectedHost ? null : id)}
                    selectedId={topoSelectedHost}
                  />
                </div>
                
                <AnimatePresence>
                  {topoSelectedHost && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="w-80 bg-zinc-900 border border-gray-800 p-6 rounded-2xl shadow-2xl ml-4 flex flex-col justify-between"
                    >
                      {(() => {
                        const host = results.find(h => h.ip === topoSelectedHost);
                        if (!host) return null;
                        return (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                              <div>
                                <h4 className="text-sm font-black text-white">{host.hostname}</h4>
                                <p className="text-xs font-mono text-gray-500">{host.ip}</p>
                              </div>
                              <button 
                                onClick={() => setTopoSelectedHost(null)}
                                className="p-1 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            <div className="space-y-4 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">作業系統</span>
                                <span className="font-bold text-gray-300">{host.os}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">弱點嚴重程度</span>
                                <span className={cn(
                                  "font-bold uppercase",
                                  host.vulnerabilities >= 10 ? "text-red-500" :
                                  host.vulnerabilities >= 5 ? "text-orange-500" :
                                  host.vulnerabilities > 0 ? "text-yellow-500" : "text-green-500"
                                )}>
                                  {host.vulnerabilities >= 10 ? '致命 (Critical)' :
                                   host.vulnerabilities >= 5 ? '高 (High)' :
                                   host.vulnerabilities > 0 ? '中 (Medium)' : '安全 (Low)'}
                                  ({host.vulnerabilities} 個已知 CVE)
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">開放連接埠</span>
                                <p className="font-mono text-gray-400 text-[11px] mt-1">{host.services}</p>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                setSelectedHost(topoSelectedHost);
                                setTopoSelectedHost(null);
                              }}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-blue-600/20"
                            >
                              產生完整技術評估報告
                            </button>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <table className="w-full text-left" id="discovery-findings-table">
                <thead className="sticky top-0 bg-[#111114] z-10">
                  <tr className="border-b border-gray-800 bg-black/20">
                    <th className="w-12 px-6 py-4"></th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">主機名稱 (Hostname)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">IP 位址</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">關聯威脅組織</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">風險等級</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">系統指紋</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">探測到的通訊埠</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>弱點數</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportCsv();
                          }}
                          className="px-2 py-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                          title="匯出弱點清冊為 CSV (Export to CSV)"
                        >
                          <Download size={11} />
                          <span>Export to CSV</span>
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredResults.map((host, idx) => (
                    <React.Fragment key={idx}>
                      <tr 
                        className={cn(
                          "hover:bg-blue-600/5 transition-colors group cursor-pointer",
                          expandedHost === host.ip && "bg-blue-600/10"
                        )}
                        onClick={() => setExpandedHost(expandedHost === host.ip ? null : host.ip)}
                      >
                        <td className="px-6 py-4">
                          <motion.div
                            animate={{ rotate: expandedHost === host.ip ? 90 : 0 }}
                            className="text-gray-500 group-hover:text-blue-400 transition-colors"
                          >
                            <ChevronRight size={14} />
                          </motion.div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 bg-gray-900 rounded-lg group-hover:bg-blue-600/20 transition-colors",
                              host.hasReport && "group-hover:bg-red-500/20"
                            )}>
                              <Monitor size={14} className={cn("text-blue-500", host.hasReport && "text-red-500 animate-pulse")} />
                            </div>
                            <span className="text-xs font-bold text-gray-200">{host.hostname}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded group-hover:text-blue-400 transition-colors">{host.ip}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {host.actor && host.actor !== 'None' ? (
                            <div className="flex items-center justify-center gap-1.5 py-1 px-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-black text-red-400 uppercase tracking-tight">
                              <Skull size={10} />
                              {host.actor}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">---</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              host.vulnerabilities >= 10 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                              host.vulnerabilities >= 5 ? "bg-orange-500" :
                              host.vulnerabilities > 0 ? "bg-yellow-500" : "bg-green-500"
                            )} />
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tighter",
                              host.vulnerabilities >= 10 ? "text-red-500" :
                              host.vulnerabilities >= 5 ? "text-orange-500" :
                              host.vulnerabilities > 0 ? "text-yellow-500" : "text-green-500"
                            )}>
                              {host.vulnerabilities >= 10 ? '致命 (Critical)' :
                               host.vulnerabilities >= 5 ? '高風險 (High)' :
                               host.vulnerabilities > 0 ? '中風險 (Medium)' : '低風險 (Low)'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold text-gray-300 py-1 px-3 bg-gray-800/50 rounded-full border border-gray-700">
                            {host.os}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {host.services.split(',').slice(0, 3).map((port, pidx) => (
                              <span key={pidx} className="text-[9px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500 font-mono">
                                {port.trim()}
                              </span>
                            ))}
                            {host.services.split(',').length > 3 && (
                              <span className="text-[9px] text-gray-600">+{host.services.split(',').length - 3} 個</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-black shadow-sm",
                              host.vulnerabilities >= 10 ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                              host.vulnerabilities >= 5 ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : 
                              "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                            )}>
                              {host.vulnerabilities}
                            </span>
                            {host.hasReport && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHost(host.ip);
                                }}
                                className="text-[10px] font-black text-red-500 uppercase hover:underline flex items-center gap-1 active:scale-95"
                              >
                                <ShieldAlert size={10} />
                                檢視檢驗報告
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Dropdown Details */}
                      <AnimatePresence>
                        {expandedHost === host.ip && (
                          <tr className="bg-blue-600/5">
                            <td colSpan={8} className="px-6 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-gray-800/30">
                                  <div className="col-span-1 space-y-6">
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">主機識別資訊</span>
                                      <div className="space-y-4">
                                        <div>
                                          <label className="text-[8px] text-gray-600 uppercase font-bold block">MAC 位址</label>
                                          <p className="text-xs font-mono text-blue-400/80">{host.mac || '00:00:00:00:00:00'}</p>
                                        </div>
                                        <div>
                                          <label className="text-[8px] text-gray-600 uppercase font-bold block">持續運作時間 (Uptime)</label>
                                          <p className="text-xs text-gray-300 font-medium">{host.uptime || 'N/A'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">探測時間軸</span>
                                      <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <p className="text-xs text-gray-400">最近掃描: <span className="text-white">{host.lastSeen}</span></p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-span-1 flex flex-col gap-3 justify-center">
                                    <button 
                                      onClick={handleExportCsv}
                                      className="w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                      <Download size={14} />
                                      匯出此主機弱點為 CSV
                                    </button>
                                    <button className="w-full py-4 bg-gray-800 hover:bg-blue-600/20 border border-gray-700/50 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">
                                      <SearchCode size={14} />
                                      協定封包分析
                                    </button>
                                    <button className="w-full py-4 bg-gray-800 hover:bg-purple-600/20 border border-gray-700/50 hover:border-purple-500/30 text-gray-300 hover:text-purple-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">
                                      <Fingerprint size={14} />
                                      OS 系統指紋
                                    </button>
                                    <button className="w-full py-4 bg-gray-800 hover:bg-orange-600/20 border border-gray-700/50 hover:border-orange-500/30 text-gray-300 hover:text-orange-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">
                                      <Signal size={14} />
                                      即時 Traceroute 追蹤
                                    </button>
                                  </div>

                                  <div className="col-span-2 space-y-4">
                                    <div className="bg-black/60 rounded-2xl border border-gray-800 p-6 shadow-inner">
                                      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                                        <div className="flex items-center gap-2">
                                          <Terminal size={14} className="text-blue-500" />
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">服務 Banner 日誌與已知漏洞識別</span>
                                        </div>
                                        <div className="flex gap-1">
                                          <div className="w-2 h-2 rounded-full bg-red-500/40" />
                                          <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                                          <div className="w-2 h-2 rounded-full bg-green-500/40" />
                                        </div>
                                      </div>
                                      <div className="space-y-3 custom-scrollbar max-h-[180px] overflow-y-auto pr-2">
                                        {host.services.split(',').map((port, pidx) => (
                                          <div key={pidx} className="flex items-start justify-between group/banner p-2 rounded-lg hover:bg-gray-800/40 transition-all border border-transparent hover:border-gray-700/50">
                                            <div className="flex items-center gap-4">
                                              <div className="px-2 py-1 bg-gray-900 border border-gray-800 rounded font-mono text-[9px] text-blue-400 group-hover/banner:text-white transition-colors">
                                                {port.trim()}
                                              </div>
                                              <div>
                                                <p className="text-[10px] font-bold text-gray-300">
                                                  {port.includes('80') || port.includes('443') ? 'HTTP/HTTPS Web Service (XST / CORS Risk)' : 
                                                   port.includes('22') ? 'OpenSSH 8.4p1 Debian (Weak MAC)' : 
                                                   port.includes('3389') ? 'Microsoft Remote Desktop' : 
                                                   port.includes('3306') ? 'MySQL Community Server 8.0 (Unrestricted Exposure)' : 
                                                   port.includes('445') ? 'Microsoft Windows SMB (Unforced Signing)' : 'Custom Process Service'}
                                                </p>
                                                <p className="text-[9px] text-gray-500 font-mono italic">
                                                  指紋識別: {port.includes('3306') ? 'CVE-2024-21413 / CWE-89' : port.includes('445') ? 'CVE-2024-30078 / CWE-287' : 'FP-' + Math.random().toString(36).substring(7).toUpperCase()}
                                                </p>
                                              </div>
                                            </div>
                                            <button 
                                              onClick={handleExportCsv}
                                              className="text-[9px] font-black text-gray-600 hover:text-blue-400 uppercase transition-colors"
                                            >
                                              匯出 CSV
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detailed Findings Summary Card */}
        {results.length > 0 && !isScanning && (
          <DiscoveryFindingsSummary hosts={results} />
        )}
      </div>
    </div>
  );
}

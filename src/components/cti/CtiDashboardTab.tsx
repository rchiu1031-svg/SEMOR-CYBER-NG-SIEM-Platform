import React, { useState } from 'react';
import { 
  Users, Bug, Server, Target, Activity, FileSearch, Calendar, 
  Building2, Globe, ShieldAlert, Zap, Radio, ExternalLink, Filter, CheckCircle2,
  Clock, Flame, Shield, ArrowUpRight, RefreshCw, Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  INGESTION_TRENDS, INDUSTRY_SECTOR_DATA, MALWARE_CATEGORY_DATA, 
  APT_RADAR_DATA, VULNERABILITY_TREND_DATA, LIVE_SIGHTING_STREAM 
} from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';
import { CtiIndicator, CtiConnector, CtiReport } from '../../data/ctiIntelData';

interface CtiDashboardTabProps {
  isZh: boolean;
  onEnrichQuery: (val: string) => void;
  stats?: any;
  indicators?: CtiIndicator[];
  connectors?: CtiConnector[];
  reports?: CtiReport[];
  onSyncConnector?: (id: string) => void;
  onAddIndicatorClick?: () => void;
  onSeedBaseline?: () => void;
  onPurgeAll?: () => void;
}

export function CtiDashboardTab({ isZh, onEnrichQuery, stats, indicators, connectors, reports, onSyncConnector, onAddIndicatorClick, onSeedBaseline, onPurgeAll }: CtiDashboardTabProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['Financial & Banking', 'Critical Infrastructure & Energy', 'Government & Defense', 'Healthcare & Pharma', 'Semiconductor & Tech']);
  const [selectedMalware, setSelectedMalware] = useState<string[]>(['Ransomware & Cryptors', 'Stealers & Credential Harvesters', 'Remote Access Trojans (RAT)', 'Botnets & DDoS Droppers', 'Destructive Wipers']);
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'CRITICAL' | 'C2'>('ALL');

  const activeIocCount = indicators ? indicators.length : (stats?.totalIndicators ?? 0);
  const activeReportCount = reports ? reports.length : (stats?.totalReports ?? 0);
  const activeConnCount = connectors ? connectors.length : (stats?.totalConnectors ?? 0);
  const isCleanState = activeIocCount === 0;

  const stixEntities = [
    { name: isZh ? '威脅組織 (Threat Actors)' : 'Threat Actors', value: isCleanState ? 0 : (stats?.totalThreatActors ?? 4), icon: <Users className="text-red-400" />, change: isCleanState ? 'Clean' : 'MITRE v14', bg: 'bg-red-500/10' },
    { name: isZh ? '惡意軟體家族 (Malware)' : 'Malware Families', value: isCleanState ? 0 : 856, icon: <Bug className="text-orange-400" />, change: isCleanState ? 'Clean' : 'Samples', bg: 'bg-orange-500/10' },
    { name: isZh ? 'C2 中繼節點 (Infra)' : 'C2 Infrastructure', value: isCleanState ? 0 : 2431, icon: <Server className="text-blue-400" />, change: isCleanState ? 'Clean' : 'Online', bg: 'bg-blue-500/10' },
    { name: isZh ? '情資連接器 (Feeds)' : 'Feed Connectors', value: activeConnCount, icon: <Server className="text-purple-400" />, change: `${connectors?.filter(c => c.status === 'Active').length ?? 0} Active`, bg: 'bg-purple-500/10' },
    { name: isZh ? '情資指標 (Active IOCs)' : 'Active IOCs', value: activeIocCount, icon: <Activity className="text-green-400" />, change: isCleanState ? '乾淨狀態' : `${activeIocCount} Items`, bg: 'bg-green-500/10' },
    { name: isZh ? '研判報告 (STIX Reports)' : 'Threat Reports', value: activeReportCount, icon: <FileSearch className="text-cyan-400" />, change: isCleanState ? '0 Reports' : `${activeReportCount} Reports`, bg: 'bg-cyan-500/10' },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#06b6d4'];

  const filteredStream = LIVE_SIGHTING_STREAM.filter(item => {
    if (streamFilter === 'CRITICAL') return item.confidence >= 95;
    if (streamFilter === 'C2') return item.event.toLowerCase().includes('c2') || item.type === 'IPv4-Addr';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Time Range Selector & Global Feed State */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111114] p-4 rounded-2xl border border-gray-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {isZh ? '全球情資同步態勢分析週期' : 'Global Threat Intelligence Horizon'}
            </span>
            <p className="text-[10px] text-gray-500">
              {isZh ? '實時匯流 8 大 TAXII 2.1 與 MISP 威脅情報來源' : 'Continuous streaming from 8 TAXII 2.1 & MISP CTI feeds'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-black/60 p-1 rounded-xl border border-gray-800">
            {(['daily', 'weekly', 'monthly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                  timeRange === range ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {range === 'daily' ? (isZh ? '每日 (24H)' : 'Daily') : range === 'weekly' ? (isZh ? '每週 (7D)' : 'Weekly') : (isZh ? '每月 (30D)' : 'Monthly')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STIX 2.1 Entities Metric Badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {stixEntities.map((entity) => (
          <div 
            key={entity.name} 
            className="bg-[#111114] border border-gray-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", entity.bg)}>
                {entity.icon}
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                {entity.change}
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {entity.value.toLocaleString()}
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mt-1">
              {entity.name}
            </p>
          </div>
        ))}
      </div>

      {/* Clean Initial State Banner */}
      {isCleanState && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#111114] to-blue-950/30 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {isZh ? '系統狀態：乾淨初始狀態 (Clean Slate Initialized)' : 'System Status: Clean Initial State'}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PRODUCTION READY
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
                  {isZh 
                    ? '已成功執行系統清理，所有模擬測試數據、虛擬設備與測試報告均已清空。系統處於乾淨的初始狀態，隨時可進行實體環境安裝 (Live Deployment)、接取實體 SPAN/TAP 鏡像網路流量與同步真實 TAXII 2.1 節點。'
                    : 'System purge completed. All simulated test metrics, virtual devices, and mock reports have been removed. Platform is in pristine condition ready for live production sensor ingestion.'
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {onSyncConnector && connectors && connectors.length > 0 && (
                <button
                  onClick={() => onSyncConnector(connectors[0].id)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <RefreshCw size={14} />
                  {isZh ? '同步 TAXII 2.1 饋送' : 'Sync TAXII Feed'}
                </button>
              )}
              {onAddIndicatorClick && (
                <button
                  onClick={onAddIndicatorClick}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus size={14} />
                  {isZh ? '手動新增指標' : 'Add IOC'}
                </button>
              )}
              {onSeedBaseline && (
                <button
                  onClick={onSeedBaseline}
                  className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  {isZh ? '載入基準情資 (Demo/Testing)' : 'Seed Demo Data'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary Chart: Ingestion Volume & False Positive Suppression */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              {isZh ? 'STIX 2.1 物件攝取流速與高置信度篩選趨勢' : 'STIX 2.1 Ingestion Velocity & High-Confidence Trend'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isZh ? '即時比對誤報過濾模型與防火牆自動阻斷下發數' : 'Real-time telemetry showing ingested observables vs noise suppression'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="text-gray-400 text-[11px]">{isZh ? '攝取總量' : 'Ingested Objects'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-gray-400 text-[11px]">{isZh ? '高置信度 IOC' : 'High-Confidence IOCs'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <span className="text-gray-400 text-[11px]">{isZh ? '雜訊抑制' : 'Suppressed Noise'}</span>
            </div>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={INGESTION_TRENDS[timeRange]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHighConf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '12px', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="ingested" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorIngested)" />
              <Area type="monotone" dataKey="highConfidence" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHighConf)" />
              <Area type="monotone" dataKey="suppressed" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Dimensional Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Chart 1: Targeted Sectors */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 size={15} className="text-blue-400" />
              {isZh ? '受害產業目標分佈' : 'Targeted Industry Sectors'}
            </h4>
            <span className="text-[10px] font-mono text-blue-400">Top 6 Sectors</span>
          </div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={INDUSTRY_SECTOR_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {INDUSTRY_SECTOR_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '8px', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-800/80">
            {INDUSTRY_SECTOR_DATA.slice(0, 4).map(item => (
              <div key={item.name} className="flex items-center justify-between text-[9px]">
                <span className="text-gray-400 truncate max-w-[90px]">{item.name}</span>
                <span className="font-mono font-bold text-white">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Malware Categories */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Bug size={15} className="text-red-400" />
              {isZh ? '惡意程式家族類別' : 'Malware Threat Classes'}
            </h4>
            <span className="text-[10px] font-mono text-red-400">Active Weaponization</span>
          </div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MALWARE_CATEGORY_DATA} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={9} width={90} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '8px', fontSize: '10px' }}
                />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14}>
                  {MALWARE_CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[9px] text-gray-500 uppercase font-mono text-center pt-2 border-t border-gray-800">
            {isZh ? '勒索軟體與憑證竊取佔 66% 危害' : 'Ransomware & Stealers constitute 66%'}
          </div>
        </div>

        {/* Chart 3: Adversary Threat Radar */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Target size={15} className="text-purple-400" />
              {isZh ? '核心 APT 威脅雷達評估' : 'Key APT Threat Radar'}
            </h4>
            <span className="text-[10px] font-mono text-purple-400">Score Matrix</span>
          </div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={APT_RADAR_DATA}>
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis dataKey="name" stroke="#6b7280" fontSize={8} />
                <Radar name="Threat Score" dataKey="threatScore" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                <Radar name="Activity" dataKey="activity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '8px', fontSize: '10px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[9px] text-gray-500 uppercase font-mono text-center pt-2 border-t border-gray-800">
            Lazarus & APT28 Peak Threat Index
          </div>
        </div>

        {/* Chart 4: Exploited Vulns & CISA KEV */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={15} className="text-amber-400" />
              {isZh ? '重大漏洞與 KEV 實時利用' : 'CVE & CISA KEV Exploitation'}
            </h4>
            <span className="text-[10px] font-mono text-amber-400">2026 Trend</span>
          </div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VULNERABILITY_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={9} />
                <YAxis stroke="#4b5563" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '8px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="Critical" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Area type="monotone" dataKey="KEV" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[9px] text-amber-400 uppercase font-mono text-center pt-2 border-t border-gray-800 flex items-center justify-center gap-1">
            <Flame size={11} />
            {isZh ? '24 項已證實野外利用中 (In-the-Wild)' : '24 Exploited In-The-Wild KEV'}
          </div>
        </div>
      </div>

      {/* Live Threat Sighting Stream / Ticker */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Radio size={18} className="text-green-400 animate-pulse" />
              <div className="absolute inset-0 bg-green-500/30 blur-sm rounded-full animate-ping pointer-events-none"></div>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {isZh ? '即時 TAXII 2.1 情資命中與目擊通報廣播 (Live Threat Sighting Stream)' : 'Live TAXII 2.1 Threat Sighting Broadcast Stream'}
              </h3>
              <p className="text-[10px] text-gray-500">
                {isZh ? '即時捕捉來自全球商業與開源情資饋送的最新指標' : 'Streaming observables captured directly from frontline honeypots and TAXII pipelines'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'CRITICAL', 'C2'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setStreamFilter(mode)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  streamFilter === mode ? "bg-gray-800 text-white border border-gray-700" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
          {isCleanState ? (
            <div className="py-10 text-center space-y-2 bg-black/40 rounded-xl border border-dashed border-gray-800/80">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-xs font-mono text-gray-400">
                {isZh ? '目前系統處於乾淨初始狀態，尚未產生即時威脅目擊事件' : 'System in clean state. Awaiting live telemetry sightings.'}
              </p>
              <p className="text-[10px] text-gray-500">
                {isZh ? '連線實體網路 SPAN 流量或點擊上方「同步 TAXII 2.1 饋送」開始監聽' : 'Connect real-world SPAN network traffic or sync TAXII feed to begin streaming'}
              </p>
            </div>
          ) : filteredStream.map(s => (
            <div 
              key={s.id} 
              className="p-3.5 bg-black/50 border border-gray-800/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">{s.time}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                  {s.feed}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                  {s.type}
                </span>
                <button 
                  onClick={() => onEnrichQuery(s.value)}
                  className="text-xs font-mono font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  title="Click to enrich and investigate"
                >
                  {s.value}
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                </button>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <p className="text-[11px] text-gray-400 truncate max-w-xs">{s.event}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                    {s.actor}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    {s.confidence}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

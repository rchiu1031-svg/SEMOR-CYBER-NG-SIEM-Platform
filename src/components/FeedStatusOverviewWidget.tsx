import React, { useState } from 'react';
import { 
  Activity, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Wifi, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  ArrowRight, 
  Server, 
  Sliders, 
  Eye,
  Bell,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ThreatFeed } from './ThreatIntelSourcesSettingView';
import { TriggeredFeedAlert } from './ThreatIntelAlertThresholdModal';
import { computeFeedHealth } from './FeedRealtimeHealthBadge';

interface FeedStatusOverviewWidgetProps {
  feeds: ThreatFeed[];
  activeAlerts: TriggeredFeedAlert[];
  isZh: boolean;
  activeFilter: string;
  onSelectFilter: (filter: 'All' | 'active' | 'error' | 'alerting' | 'optimal' | 'moderate' | 'degraded') => void;
  onProbeAllFeeds: () => void;
  isProbing?: boolean;
}

export default function FeedStatusOverviewWidget({
  feeds,
  activeAlerts,
  isZh,
  activeFilter,
  onSelectFilter,
  onProbeAllFeeds,
  isProbing = false
}: FeedStatusOverviewWidgetProps) {
  const [copiedSummary, setCopiedSummary] = useState(false);

  // 1. Total counts & active stats
  const totalFeeds = feeds.length;
  const activeFeeds = feeds.filter(f => f.status === 'active' || f.status === 'syncing').length;
  const syncingFeeds = feeds.filter(f => f.status === 'syncing').length;
  const pausedFeeds = feeds.filter(f => f.status === 'paused').length;
  const activePercentage = totalFeeds > 0 ? Math.round((activeFeeds / totalFeeds) * 100) : 0;

  // 2. Failing & critical stats
  const failingFeedsList = feeds.filter(f => 
    f.status === 'error' || 
    (f.consecutiveFailures && f.consecutiveFailures > 0) || 
    (f.httpStatusCode && f.httpStatusCode >= 500)
  );
  const failingCount = failingFeedsList.length;

  const degradedFeedsList = feeds.filter(f => 
    f.status === 'warning' || 
    (f.latencyMs > 500 && f.status !== 'error') || 
    f.httpStatusCode === 206
  );
  const degradedCount = degradedFeedsList.length;

  const alertBreachesCount = activeAlerts.length;

  // 3. Latency calculations
  const validLatencies = feeds.map(f => f.latencyMs).filter(l => typeof l === 'number' && l > 0);
  const avgLatency = validLatencies.length > 0 
    ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) 
    : 0;
  const minLatency = validLatencies.length > 0 ? Math.min(...validLatencies) : 0;
  const maxLatency = validLatencies.length > 0 ? Math.max(...validLatencies) : 0;

  const fastestFeed = feeds.find(f => f.latencyMs === minLatency);
  const slowestFeed = feeds.find(f => f.latencyMs === maxLatency);

  const tierFastCount = feeds.filter(f => f.latencyMs < 200 && f.status !== 'paused' && f.status !== 'error').length;
  const tierModerateCount = feeds.filter(f => f.latencyMs >= 200 && f.latencyMs <= 500 && f.status !== 'paused').length;
  const tierSlowCount = feeds.filter(f => (f.latencyMs > 500 || f.status === 'error') && f.status !== 'paused').length;

  // 4. Ingestion & Global Health
  const optimalFeeds = feeds.filter(f => computeFeedHealth(f, isZh).level === 'optimal').length;
  const totalIoCs = feeds.reduce((sum, f) => sum + f.indicatorCount, 0);
  const avgSuccessRate = totalFeeds > 0 
    ? (feeds.reduce((sum, f) => sum + (f.ingestionSuccessRate ?? (f.status === 'error' ? 0 : 100)), 0) / totalFeeds).toFixed(1)
    : '100.0';

  // Overall Health Score (0 - 100)
  const healthScore = totalFeeds > 0
    ? Math.max(0, Math.min(100, Math.round(
        (optimalFeeds * 1.0 + 
         (activeFeeds - optimalFeeds - failingCount) * 0.75 + 
         degradedCount * 0.45) / totalFeeds * 100
      )))
    : 100;

  const getHealthLevelBadge = () => {
    if (healthScore >= 90) {
      return {
        labelZh: '系統運作極佳 (Optimal)',
        labelEn: 'System Status: Optimal',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        dot: 'bg-emerald-400'
      };
    }
    if (healthScore >= 75) {
      return {
        labelZh: '部分端點延遲稍高 (Good)',
        labelEn: 'System Status: Operational',
        color: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
        dot: 'bg-lime-400'
      };
    }
    if (healthScore >= 60) {
      return {
        labelZh: '注意：部分來源降級 (Degraded)',
        labelEn: 'System Status: Degraded',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        dot: 'bg-amber-400'
      };
    }
    return {
      labelZh: '警告：檢測到連線中斷 (Critical)',
      labelEn: 'System Status: Critical Attention',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      dot: 'bg-rose-400 animate-ping'
    };
  };

  const healthBadge = getHealthLevelBadge();

  // Copy health audit summary to clipboard
  const handleCopyHealthReport = () => {
    const report = [
      `=== SEMOR THREAT INTEL AGGREGATE HEALTH AUDIT ===`,
      `Timestamp: ${new Date().toISOString()}`,
      `Overall Health Score: ${healthScore}%`,
      `Total Feeds: ${totalFeeds}`,
      `Active Feeds: ${activeFeeds} (${activePercentage}%)`,
      `Failing Feeds: ${failingCount}`,
      `Degraded Feeds: ${degradedCount}`,
      `Active Alert Breaches: ${alertBreachesCount}`,
      `Average Latency (RTT): ${avgLatency}ms (Min: ${minLatency}ms, Max: ${maxLatency}ms)`,
      `Total Observables Ingested: ${totalIoCs.toLocaleString()}`,
      `Average Ingestion Success Rate: ${avgSuccessRate}%`,
      `=================================================`
    ].join('\n');

    navigator.clipboard.writeText(report).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  return (
    <section 
      id="threat-intel-feed-status-overview" 
      className="bg-[#111114] border border-gray-800/90 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-5"
    >
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-blue-500/5 blur-3xl pointer-events-none rounded-full -mr-20 -mt-10" />
      <div className="absolute bottom-0 left-0 w-80 h-36 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full -ml-20 -mb-10" />

      {/* Header of Feed Status Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-sm">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm md:text-base font-black text-white tracking-wide flex items-center gap-2">
                <span>{isZh ? '情資來源狀態總覽' : 'Feed Status Overview'}</span>
                <span className="text-gray-500 font-normal text-xs">/ Real-time Aggregate Health Report</span>
              </h3>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-sm",
                healthBadge.color
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", healthBadge.dot)} />
                <span>{isZh ? healthBadge.labelZh : healthBadge.labelEn}</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isZh 
                ? '即時聚合 STIX/TAXII 來源之連線健康狀態、端點延遲分佈、封包收錄率與故障診斷監控。' 
                : 'Real-time telemetry across active TAXII endpoints, latency distribution, ingestion rate, and failing sources.'}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="probe-all-threat-feeds-btn"
            type="button"
            onClick={onProbeAllFeeds}
            disabled={isProbing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm",
              isProbing
                ? "bg-blue-600/20 border-blue-500/50 text-blue-300 cursor-wait"
                : "bg-gray-900/90 hover:bg-gray-800 border-gray-800 text-gray-200 hover:text-white hover:border-blue-500/40"
            )}
            title={isZh ? '向所有情資端點發送 HTTP 診斷探針測試延遲與可用性' : 'Probe all TAXII discovery URLs for real-time latency and HTTP status'}
          >
            <RefreshCw size={13} className={cn(isProbing ? "animate-spin text-blue-400" : "text-gray-400")} />
            <span>{isProbing ? (isZh ? '探測中...' : 'Probing...') : (isZh ? '即時探測全部' : 'Probe All Feeds')}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyHealthReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900/90 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            title={isZh ? '複製當前健康度審計報告文字' : 'Copy health status summary to clipboard'}
          >
            {copiedSummary ? <Check size={13} className="text-green-400" /> : <BarChart3 size={13} className="text-gray-400" />}
            <span>{copiedSummary ? (isZh ? '已複製報告' : 'Copied') : (isZh ? '匯出報告' : 'Copy Audit')}</span>
          </button>
        </div>
      </div>

      {/* 4 Card-Based Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* CARD 1: Total Active Feeds */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onSelectFilter(activeFilter === 'active' ? 'All' : 'active')}
          className={cn(
            "rounded-xl p-4 border transition-all cursor-pointer relative overflow-hidden group shadow-lg flex flex-col justify-between",
            activeFilter === 'active'
              ? "bg-gradient-to-br from-blue-950/40 via-gray-900 to-gray-950 border-blue-500 shadow-blue-950/30 ring-1 ring-blue-500/30"
              : "bg-gray-900/50 hover:bg-gray-900/80 border-gray-800/80 hover:border-blue-500/40"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Radio size={13} className="text-blue-400" />
                <span>{isZh ? '運作中情資來源' : 'Total Active Feeds'}</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                <span>{activePercentage}% Live</span>
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white tracking-tight">
                {activeFeeds}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                / {totalFeeds} {isZh ? '已設定' : 'configured'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/60 space-y-2">
            {/* Progress ratio bar */}
            <div className="w-full bg-gray-950 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${activePercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span>{isZh ? `${optimalFeeds} 最佳狀態` : `${optimalFeeds} Optimal`}</span>
              </span>
              {syncingFeeds > 0 && (
                <span className="text-cyan-400 font-medium">
                  {isZh ? `${syncingFeeds} 同步中` : `${syncingFeeds} Syncing`}
                </span>
              )}
              {pausedFeeds > 0 && (
                <span className="text-gray-500">
                  {isZh ? `${pausedFeeds} 暫停` : `${pausedFeeds} Paused`}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Failing & Critical Feeds */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onSelectFilter(activeFilter === 'error' ? 'All' : 'error')}
          className={cn(
            "rounded-xl p-4 border transition-all cursor-pointer relative overflow-hidden group shadow-lg flex flex-col justify-between",
            failingCount > 0
              ? activeFilter === 'error'
                ? "bg-gradient-to-br from-red-950/50 via-gray-900 to-gray-950 border-red-500 shadow-red-950/30 ring-1 ring-red-500/30"
                : "bg-red-950/20 hover:bg-red-950/30 border-red-900/40 hover:border-red-500/50"
              : activeFilter === 'error'
              ? "bg-gray-900/80 border-blue-500"
              : "bg-gray-900/50 hover:bg-gray-900/80 border-gray-800/80 hover:border-emerald-500/40"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <ShieldAlert size={13} className={failingCount > 0 ? "text-red-400" : "text-emerald-400"} />
                <span>{isZh ? '異常與失敗來源' : 'Failing & Critical Feeds'}</span>
              </span>
              {failingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>Action Needed</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  0 Errors
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className={cn("text-3xl font-black tracking-tight", failingCount > 0 ? "text-red-400" : "text-emerald-400")}>
                {failingCount}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {failingCount > 0 
                  ? (isZh ? `個端點中斷` : `failing endpoint${failingCount > 1 ? 's' : ''}`)
                  : (isZh ? `全部正常通訊` : `all healthy`)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1">
                <AlertTriangle size={11} className={degradedCount > 0 ? "text-amber-400" : "text-gray-600"} />
                <span>{isZh ? '降級/延遲偏高' : 'Degraded Feeds'}:</span>
              </span>
              <span className={cn("font-mono font-bold", degradedCount > 0 ? "text-amber-400" : "text-gray-500")}>
                {degradedCount}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1">
                <Bell size={11} className={alertBreachesCount > 0 ? "text-red-400 animate-bounce" : "text-gray-600"} />
                <span>{isZh ? '觸發閾值告警' : 'Active Alert Breaches'}:</span>
              </span>
              <span className={cn("font-mono font-bold", alertBreachesCount > 0 ? "text-red-400" : "text-gray-500")}>
                {alertBreachesCount}
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD 3: Latency & RTT Health */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onSelectFilter(activeFilter === 'degraded' ? 'All' : 'degraded')}
          className={cn(
            "rounded-xl p-4 border transition-all cursor-pointer relative overflow-hidden group shadow-lg flex flex-col justify-between",
            activeFilter === 'degraded'
              ? "bg-gradient-to-br from-amber-950/40 via-gray-900 to-gray-950 border-amber-500 shadow-amber-950/30 ring-1 ring-amber-500/30"
              : "bg-gray-900/50 hover:bg-gray-900/80 border-gray-800/80 hover:border-cyan-500/40"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Zap size={13} className="text-cyan-400" />
                <span>{isZh ? '端點響應延遲 (RTT)' : 'Latency & RTT Stats'}</span>
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border",
                avgLatency < 200 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : avgLatency < 500
                  ? "bg-lime-500/10 text-lime-400 border-lime-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {avgLatency < 200 ? 'Low RTT' : avgLatency < 500 ? 'Moderate' : 'High RTT'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className={cn(
                "text-3xl font-black tracking-tight",
                avgLatency < 200 ? "text-emerald-400" : avgLatency < 500 ? "text-lime-400" : "text-amber-400"
              )}>
                {avgLatency}
              </span>
              <span className="text-xs text-gray-500 font-bold">
                ms {isZh ? '平均' : 'avg'}
              </span>
              <span className="text-[10px] text-gray-500 ml-auto font-mono">
                {minLatency}ms ~ {maxLatency}ms
              </span>
            </div>
          </div>

          {/* Latency Tiers Distribution */}
          <div className="mt-4 pt-3 border-t border-gray-800/60 space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-gray-950/70 border border-gray-800/60 rounded-lg p-1.5">
                <span className="text-[9px] text-gray-500 block">&lt; 200ms</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{tierFastCount}</span>
              </div>
              <div className="bg-gray-950/70 border border-gray-800/60 rounded-lg p-1.5">
                <span className="text-[9px] text-gray-500 block">200-500ms</span>
                <span className="text-xs font-mono font-bold text-lime-400">{tierModerateCount}</span>
              </div>
              <div className="bg-gray-950/70 border border-gray-800/60 rounded-lg p-1.5">
                <span className="text-[9px] text-gray-500 block">&gt; 500ms</span>
                <span className="text-xs font-mono font-bold text-amber-400">{tierSlowCount}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 4: Ingestion Rate & Observables Volume */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onSelectFilter('All')}
          className={cn(
            "rounded-xl p-4 border transition-all cursor-pointer relative overflow-hidden group shadow-lg flex flex-col justify-between",
            "bg-gray-900/50 hover:bg-gray-900/80 border-gray-800/80 hover:border-purple-500/40"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Server size={13} className="text-purple-400" />
                <span>{isZh ? '資料收錄成功率與規模' : 'Ingestion & Volume'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                Score: {healthScore}/100
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-400 tracking-tight">
                {avgSuccessRate}%
              </span>
              <span className="text-xs text-gray-500 font-bold">
                {isZh ? '成功率' : 'Success'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">{isZh ? '已收錄 IoC 總量' : 'Total IoCs'}:</span>
              <span className="font-mono font-bold text-white">
                {totalIoCs.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">{isZh ? '最快回應來源' : 'Fastest Feed'}:</span>
              <span className="font-mono text-emerald-400 truncate max-w-[140px]" title={fastestFeed?.name}>
                {fastestFeed ? `${fastestFeed.name} (${minLatency}ms)` : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Interactive Filter Status Feedback Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <Sliders size={13} className="text-blue-400" />
          <span>{isZh ? '快捷狀態檢視：' : 'Active Status Filter:'}</span>
          <span className="font-bold text-white bg-gray-900 px-2 py-0.5 rounded-md border border-gray-800 font-mono">
            {activeFilter === 'All' ? (isZh ? '全部來源 (All Feeds)' : 'All Feeds') :
             activeFilter === 'active' ? (isZh ? '僅活躍來源 (Active Feeds Only)' : 'Active Feeds Only') :
             activeFilter === 'error' ? (isZh ? '僅異常與失敗來源 (Failing Only)' : 'Failing Feeds Only') :
             activeFilter === 'alerting' ? (isZh ? '僅觸發告警來源 (Alerting Only)' : 'Alerting Feeds Only') :
             activeFilter}
          </span>
          {activeFilter !== 'All' && (
            <button
              type="button"
              onClick={() => onSelectFilter('All')}
              className="text-[11px] text-blue-400 hover:text-blue-300 underline ml-1"
            >
              {isZh ? '清除檢視條件' : 'Reset View'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{isZh ? '最佳 (<200ms)' : 'Optimal (<200ms)'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            <span>{isZh ? '良好 (200-500ms)' : 'Moderate (200-500ms)'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{isZh ? '降級 (>500ms)' : 'Degraded (>500ms)'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>{isZh ? '失敗 (5xx/逾時)' : 'Failing (5xx/Timeout)'}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

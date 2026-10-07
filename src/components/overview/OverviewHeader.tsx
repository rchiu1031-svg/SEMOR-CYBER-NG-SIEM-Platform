import React from 'react';
import {
  Shield,
  Clock,
  Sparkles,
  RefreshCw,
  Download,
  AlertOctagon,
  BarChart3,
  Server,
  Zap
} from 'lucide-react';
import { TimeRange, RefreshInterval } from './types';
import { cn } from '../../lib/utils';

interface OverviewHeaderProps {
  isZh: boolean;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refreshInterval: RefreshInterval;
  setRefreshInterval: (interval: RefreshInterval) => void;
  isWarMode: boolean;
  setIsWarMode: (val: boolean) => void;
  onExportReport: () => void;
  onNavigateExecutive: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  liveEps?: number;
  liveNodesCount?: { healthy: number; total: number };
  isLiveConnected?: boolean;
  onSimulateIngest?: () => void;
}

export const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  isZh,
  timeRange,
  setTimeRange,
  refreshInterval,
  setRefreshInterval,
  isWarMode,
  setIsWarMode,
  onExportReport,
  onNavigateExecutive,
  onManualRefresh,
  isRefreshing,
  liveEps = 1486,
  liveNodesCount = { healthy: 5, total: 5 },
  isLiveConnected = true,
  onSimulateIngest
}) => {
  const timeRanges: { id: TimeRange; labelZh: string; labelEn: string }[] = [
    { id: '15m', labelZh: '15分鐘', labelEn: '15m' },
    { id: '1h', labelZh: '1小時', labelEn: '1h' },
    { id: '24h', labelZh: '24小時', labelEn: '24h' },
    { id: '7d', labelZh: '7天', labelEn: '7d' },
    { id: '30d', labelZh: '30天', labelEn: '30d' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner with Platform Status & Operations Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl border flex items-center justify-center transition-colors",
              isWarMode 
                ? "bg-red-950/60 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse" 
                : "bg-blue-950/40 border-blue-500/30 text-blue-400"
            )}>
              {isWarMode ? <AlertOctagon size={24} /> : <Shield size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {isZh ? '營運安全 XDR 總覽儀表板' : 'Operational XDR Overview Dashboard'}
                </h1>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                  isWarMode
                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {isWarMode ? (isZh ? '戰情應變防禦中' : 'DEFCON 1 ACTIVE') : (isZh ? '全時防護在線' : 'LIVE MONITORING')}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium tracking-wide mt-0.5">
                {isZh
                  ? '次世代 SIEM + 跨集群搜尋 (CCS) + UEBA 異常行為偵測 + SOAR 自動化協同防禦'
                  : 'Next-Gen SIEM + Cross-Cluster Search (CCS) + UEBA Anomaly Telemetry + SOAR Triage'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Simulate Ingest button */}
          {onSimulateIngest && (
            <button
              id="overview-simulate-ingest-btn"
              onClick={onSimulateIngest}
              title={isZh ? '向後端 Go Collector + VictoriaLogs 即時注入測試遙測事件' : 'Simulate incoming telemetry to Go Collector'}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all hover:border-purple-500/50"
            >
              <Zap size={14} className="text-purple-400" />
              <span>{isZh ? '測試遙測注入' : 'Simulate Telemetry'}</span>
            </button>
          )}

          {/* War Mode Toggle */}
          <button
            id="overview-war-mode-toggle"
            onClick={() => setIsWarMode(!isWarMode)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
              isWarMode
                ? "bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : "bg-white/5 hover:bg-red-600/10 text-gray-400 hover:text-red-400 border-white/10 hover:border-red-500/30"
            )}
          >
            <AlertOctagon size={14} className={isWarMode ? "animate-spin" : ""} />
            <span>{isZh ? (isWarMode ? '解除戰情模式' : '戰情警戒 (DEFCON)') : (isWarMode ? 'Exit War Mode' : 'War Mode')}</span>
          </button>

          {/* Export Report */}
          <button
            id="overview-export-report-btn"
            onClick={onExportReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all hover:border-white/20"
          >
            <Download size={14} />
            <span>{isZh ? '匯出 SOC 日報' : 'Shift Report'}</span>
          </button>

          {/* Link to Executive View */}
          <button
            id="overview-executive-link-btn"
            onClick={onNavigateExecutive}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all group"
          >
            <BarChart3 size={14} className="group-hover:scale-110 transition-transform" />
            <span>{isZh ? '主管洞察視圖' : 'Executive Insights'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Timeframe, Refresh Interval & Status telemetry */}
      <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Timeframe pills */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-gray-800">
          <Clock size={14} className="text-gray-400 ml-1.5 mr-0.5" />
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold transition-all text-xs",
                timeRange === range.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              {isZh ? range.labelZh : range.labelEn}
            </button>
          ))}
        </div>

        {/* Center: Realtime Telemetry Chips */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isLiveConnected ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
            )}></span>
            <span>{isZh ? 'CCS 叢集同步：' : 'CCS Mesh:'} <strong className="text-gray-200 font-mono">{liveNodesCount.healthy}/{liveNodesCount.total} Nodes (0.4ms)</strong></span>
          </div>
          <div className="w-px h-3.5 bg-gray-800"></div>
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-blue-400" />
            <span>{isZh ? 'Llama-3 SOC 模型：' : 'SOC Copilot:'} <strong className="text-blue-300 font-mono">Ready</strong></span>
          </div>
          <div className="w-px h-3.5 bg-gray-800"></div>
          <div className="flex items-center gap-2">
            <Server size={13} className="text-purple-400" />
            <span>{isZh ? 'EPS 吞吐：' : 'Throughput:'} <strong className="text-purple-300 font-mono">{liveEps.toLocaleString()}/s</strong></span>
          </div>
        </div>

        {/* Right: Refresh Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-gray-800 text-[11px]">
            <span className="text-gray-500 px-1">{isZh ? '自動更新:' : 'Auto:'}</span>
            {([10, 30, 60, 0] as RefreshInterval[]).map((interval) => (
              <button
                key={interval}
                onClick={() => setRefreshInterval(interval)}
                className={cn(
                  "px-2 py-0.5 rounded font-mono font-medium transition-all",
                  refreshInterval === interval
                    ? "bg-gray-800 text-white border border-gray-700 font-bold"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {interval === 0 ? (isZh ? '暫停' : 'Off') : `${interval}s`}
              </button>
            ))}
          </div>

          <button
            id="overview-manual-refresh-btn"
            onClick={onManualRefresh}
            title={isZh ? '立即重新整理' : 'Refresh now'}
            className={cn(
              "p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-800 transition-all",
              isRefreshing ? "animate-spin text-blue-400" : ""
            )}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

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
import { useTheme } from '../../context/ThemeContext';

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
  const { isLight } = useTheme();
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
                : isLight ? "bg-blue-50 border-blue-200 text-blue-600 shadow-xs" : "bg-blue-950/40 border-blue-500/30 text-blue-400"
            )}>
              {isWarMode ? <AlertOctagon size={24} /> : <Shield size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={cn("text-2xl lg:text-3xl font-black tracking-tight", isLight ? "text-slate-900" : "text-white")}>
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
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border",
              isLight
                ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs"
                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:border-white/20"
            )}
          >
            <Download size={14} />
            <span>{isZh ? '匯出 SOC 日報' : 'Shift Report'}</span>
          </button>

          {/* Link to Executive View */}
          <button
            id="overview-executive-link-btn"
            onClick={onNavigateExecutive}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border group",
              isLight
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-xs"
                : "bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border-blue-500/30"
            )}
          >
            <BarChart3 size={14} className="group-hover:scale-110 transition-transform" />
            <span>{isZh ? '主管洞察視圖' : 'Executive Insights'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Timeframe, Refresh Interval & Status telemetry */}
      <div className={cn(
        "rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs border transition-colors",
        isLight
          ? "bg-white border-slate-200 shadow-xs text-slate-800"
          : "bg-[#111114] border-gray-800/80 text-gray-300"
      )}>
        {/* Left: Timeframe pills */}
        <div className={cn(
          "flex items-center gap-1.5 p-1 rounded-lg border",
          isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-gray-800"
        )}>
          <Clock size={14} className={isLight ? "text-slate-500 ml-1.5 mr-0.5" : "text-gray-400 ml-1.5 mr-0.5"} />
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold transition-all text-xs",
                timeRange === range.id
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30 font-bold"
                  : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    : "text-gray-400 hover:text-gray-200"
              )}
            >
              {isZh ? range.labelZh : range.labelEn}
            </button>
          ))}
        </div>

        {/* Center: Realtime Telemetry Chips */}
        <div className={cn(
          "hidden lg:flex items-center gap-4 text-[11px]",
          isLight ? "text-slate-600" : "text-gray-400"
        )}>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
            )}></span>
            <span>{isZh ? 'CCS 叢集同步：' : 'CCS Mesh:'} <strong className={cn("font-mono", isLight ? "text-slate-800" : "text-gray-200")}>{liveNodesCount.healthy}/{liveNodesCount.total} Nodes (0.4ms)</strong></span>
          </div>
          <div className={cn("w-px h-3.5", isLight ? "bg-slate-200" : "bg-gray-800")}></div>
          <div className="flex items-center gap-2">
            <Sparkles size={13} className={isLight ? "text-blue-600" : "text-blue-400"} />
            <span>{isZh ? 'Llama-3 SOC 模型：' : 'SOC Copilot:'} <strong className={cn("font-mono", isLight ? "text-blue-700" : "text-blue-300")}>Ready</strong></span>
          </div>
          <div className={cn("w-px h-3.5", isLight ? "bg-slate-200" : "bg-gray-800")}></div>
          <div className="flex items-center gap-2">
            <Server size={13} className={isLight ? "text-purple-600" : "text-purple-400"} />
            <span>{isZh ? 'EPS 吞吐：' : 'Throughput:'} <strong className={cn("font-mono", isLight ? "text-purple-700" : "text-purple-300")}>{liveEps.toLocaleString()}/s</strong></span>
          </div>
        </div>

        {/* Right: Refresh Controls */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 p-1 rounded-lg border text-[11px]",
            isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-gray-800"
          )}>
            <span className={isLight ? "text-slate-500 px-1 font-medium" : "text-gray-500 px-1 font-medium"}>{isZh ? '自動更新:' : 'Auto:'}</span>
            {([10, 30, 60, 0] as RefreshInterval[]).map((interval) => (
              <button
                key={interval}
                onClick={() => setRefreshInterval(interval)}
                className={cn(
                  "px-2 py-0.5 rounded font-mono font-medium transition-all",
                  refreshInterval === interval
                    ? isLight
                      ? "bg-white text-blue-700 border border-slate-300 shadow-xs font-bold"
                      : "bg-gray-800 text-white border border-gray-700 font-bold"
                    : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
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
              "p-1.5 rounded-lg border transition-all",
              isLight
                ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs"
                : "bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-800",
              isRefreshing ? "animate-spin text-blue-500" : ""
            )}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

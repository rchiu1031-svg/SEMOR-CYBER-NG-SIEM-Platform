import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  BarChart2,
  TrendingUp,
  Flame,
  Radio,
  Download,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Sliders,
  Send,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export type LatencyBinKey =
  | '0_5ms'
  | '5_15ms'
  | '15_30ms'
  | '30_60ms'
  | '60_120ms'
  | '120_250ms'
  | '250_500ms'
  | 'gt500ms';

export interface LatencyBinDef {
  id: LatencyBinKey;
  label: string;
  minMs: number;
  maxMs: number;
  severity: 'optimal' | 'normal' | 'moderate' | 'elevated' | 'warning' | 'spike' | 'critical';
  colorHex: string;
}

export interface HeatmapCellData {
  count: number;
  pct: number;
}

export interface HeatmapColumn {
  minute: string;
  timestamp: string;
  bins: Record<LatencyBinKey, HeatmapCellData>;
  rawLatencies?: number[];
  totalRequests: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  min: number;
  avg: number;
  hasSpike: boolean;
  spikeReason?: string;
}

export interface TransientSpikeRecord {
  id: string;
  timestamp: string;
  minute: string;
  peakLatencyMs: number;
  baselineP50Ms: number;
  p99Ms: number;
  deviationMultiplier: number;
  affectedRequests: number;
  probableCause: string;
  diagnostics: string;
  mitigation: string;
  severity: 'warning' | 'critical';
}

export interface LatencyHeatmapSnapshot {
  timeRange: '15m' | '30m' | '60m';
  generatedAt: string;
  binDefs: LatencyBinDef[];
  columns: HeatmapColumn[];
  summary: {
    currentP50: number;
    currentP90: number;
    currentP95: number;
    currentP99: number;
    currentAvg: number;
    peakLatencyLastHour: number;
    minLatencyLastHour: number;
    totalRequestsMeasured: number;
    totalSpikesDetected: number;
    spikeFreeRatePct: number;
    connectionHealthStatus: 'OPTIMAL' | 'STABLE' | 'DEGRADED_JITTER' | 'SPIKE_WARNING';
  };
  transientSpikes: TransientSpikeRecord[];
}

interface HoveredCellInfo {
  column: HeatmapColumn;
  bin: LatencyBinDef;
  cell: HeatmapCellData;
  columnIndex: number;
}

export function VictoriaLogsLatencyHeatmap({
  compact = false,
  className = ''
}: {
  compact?: boolean;
  className?: string;
}) {
  const [data, setData] = useState<LatencyHeatmapSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'15m' | '30m' | '60m'>('60m');
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<HeatmapColumn | null>(null);
  const [showTrendChart, setShowTrendChart] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectModalOpen, setInjectModalOpen] = useState(false);
  const [injectLatencyValue, setInjectLatencyValue] = useState(480);
  const [injectReason, setInjectReason] = useState('TCP SYN 逾時重傳與佇列擁塞 (TCP Retransmit & Queue Congestion)');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchHeatmap = async (range = timeRange) => {
    try {
      const res = await fetch(`/api/v1/collector/victorialogs-latency-heatmap?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch VictoriaLogs latency heatmap:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap(timeRange);
  }, [timeRange]);

  // Live polling interval
  useEffect(() => {
    if (!isLivePolling) return;
    const interval = setInterval(() => {
      fetchHeatmap(timeRange);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLivePolling, timeRange]);

  const handleInjectSpike = async () => {
    setIsInjecting(true);
    try {
      const res = await fetch('/api/v1/collector/simulate-latency-spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latencyMs: injectLatencyValue,
          burstCount: 5,
          reason: injectReason
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.snapshot) {
          setData(result.snapshot);
        }
        setInjectModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to inject latency spike:', err);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push('Minute,Timestamp,TotalRequests,P50_ms,P90_ms,P95_ms,P99_ms,Max_ms,Min_ms,Avg_ms,HasSpike,SpikeReason');
    for (const c of data.columns) {
      rows.push(
        `"${c.minute}","${c.timestamp}",${c.totalRequests},${c.p50},${c.p90},${c.p95},${c.p99},${c.max},${c.min},${c.avg},${c.hasSpike ? 'TRUE' : 'FALSE'},"${c.spikeReason || ''}"`
      );
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `victorialogs-latency-heatmap-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('熱力圖數據已成功匯出為 CSV');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Cell color mapping based on bin severity and request count percentage
  const getCellColor = (bin: LatencyBinDef, cell: HeatmapCellData) => {
    if (!cell || cell.count === 0) {
      return 'bg-slate-950/60 border-slate-900/60 hover:border-slate-700';
    }

    const pct = cell.pct;
    // For normal/low latency bins (< 30ms), use cool blue to emerald scale
    if (bin.id === '0_5ms' || bin.id === '5_15ms') {
      if (pct > 60) return 'bg-cyan-500/80 border-cyan-400 text-cyan-950 font-bold';
      if (pct > 30) return 'bg-cyan-600/60 border-cyan-500 text-white';
      if (pct > 10) return 'bg-cyan-800/40 border-cyan-700 text-cyan-200';
      return 'bg-cyan-950/40 border-cyan-900 text-cyan-300';
    }

    if (bin.id === '15_30ms') {
      if (pct > 50) return 'bg-emerald-500/80 border-emerald-400 text-emerald-950 font-bold';
      if (pct > 20) return 'bg-emerald-600/60 border-emerald-500 text-white';
      return 'bg-emerald-900/40 border-emerald-800 text-emerald-200';
    }

    if (bin.id === '30_60ms') {
      if (pct > 30) return 'bg-lime-500/80 border-lime-400 text-lime-950 font-bold';
      if (pct > 10) return 'bg-lime-600/50 border-lime-500 text-white';
      return 'bg-lime-950/50 border-lime-900 text-lime-300';
    }

    if (bin.id === '60_120ms') {
      if (pct > 20) return 'bg-amber-500/80 border-amber-400 text-amber-950 font-bold';
      if (pct > 5) return 'bg-amber-600/50 border-amber-500 text-amber-100';
      return 'bg-amber-950/50 border-amber-900 text-amber-300';
    }

    if (bin.id === '120_250ms') {
      if (pct > 10) return 'bg-orange-500/90 border-orange-400 text-orange-950 font-bold animate-pulse';
      return 'bg-orange-800/60 border-orange-600 text-orange-200';
    }

    // High spike bins (> 250ms or > 500ms)
    if (bin.id === '250_500ms') {
      return 'bg-rose-600/90 border-rose-400 text-white font-bold ring-1 ring-rose-400/80 animate-pulse';
    }

    // gt500ms (Critical Spike)
    return 'bg-red-600 border-red-300 text-white font-black ring-2 ring-red-400 animate-bounce shadow-lg shadow-red-600/50';
  };

  const binDefs = data?.binDefs || [];
  const columns = data?.columns || [];
  const summary = data?.summary;
  const transientSpikes = data?.transientSpikes || [];

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5 ${className}`}>
      {/* Top Header & Interactive Control Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              VictoriaLogs 連線延遲分佈熱力圖 (Latency Distribution Heatmap)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              暫態突波偵測 (Spike Detection)
            </span>
            {summary && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                  summary.connectionHealthStatus === 'OPTIMAL'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : summary.connectionHealthStatus === 'STABLE'
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : summary.connectionHealthStatus === 'DEGRADED_JITTER'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
                }`}
              >
                {summary.connectionHealthStatus === 'OPTIMAL' && '優良 (Optimal <15ms)'}
                {summary.connectionHealthStatus === 'STABLE' && '穩定 (Stable)'}
                {summary.connectionHealthStatus === 'DEGRADED_JITTER' && '輕度網路抖動 (Jitter)'}
                {summary.connectionHealthStatus === 'SPIKE_WARNING' && '突波警報 (Spike Warning)'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            將收集器往 VictoriaLogs 寫入之 HTTP 請求依延遲區間進行高密度時序分桶，直觀辨識被傳統平均值 (Avg) 遮蔽的長尾延遲與短暫網路突波 (Transient Spikes)。
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Switcher */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center text-xs font-mono">
            {(['15m', '30m', '60m'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded transition ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === '15m' ? '15 分鐘' : range === '30m' ? '30 分鐘' : '1 小時 (60m)'}
              </button>
            ))}
          </div>

          {/* Toggle Trend Chart */}
          <button
            onClick={() => setShowTrendChart(!showTrendChart)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 ${
              showTrendChart
                ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="切換顯示 P50/P95/P99 百分位趨勢折線圖"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>百分位趨勢</span>
          </button>

          {/* Spike Simulation Test Injection */}
          <button
            onClick={() => setInjectModalOpen(true)}
            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            title="注入測試網路延遲突波，驗證熱力圖捕獲能力"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>注入延遲突波</span>
          </button>

          {/* Live Polling Switch */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
              isLivePolling
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Radio className={`w-3 h-3 ${isLivePolling ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isLivePolling ? 'Live 串流' : '已暫停'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchHeatmap()}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700 disabled:opacity-50"
            title="手動重新整理"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
            title="匯出熱力圖時序 CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* KPI Metric Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">P50 (中位數延遲)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-cyan-300">{summary.currentP50}</span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">50% 請求延遲基準</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">P90 (90% 區間)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-indigo-300">{summary.currentP90}</span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">標準高水位</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">P95 (95% 區間)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-violet-300">{summary.currentP95}</span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">SLA 關鍵門檻</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">P99 (長尾長延遲)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold font-mono ${
                summary.currentP99 > 100 ? 'text-amber-300 font-black' : 'text-amber-300'
              }`}>
                {summary.currentP99}
              </span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-amber-400/80 mt-0.5 block">
              {summary.currentP99 > 80 ? '檢測到長尾抖動' : '長尾表現平穩'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">區間峰值 (Peak Spike)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold font-mono ${
                summary.peakLatencyLastHour >= 250 ? 'text-rose-400 font-black' : 'text-slate-200'
              }`}>
                {summary.peakLatencyLastHour}
              </span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-rose-400/80 mt-0.5 block">最大突波點</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">捕獲暫態突波</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold font-mono ${
                summary.totalSpikesDetected > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'
              }`}>
                {summary.totalSpikesDetected}
              </span>
              <span className="text-xs text-slate-400">次事件</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">門檻 &gt; 120ms</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">無突波穩定率</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-emerald-400">{summary.spikeFreeRatePct}%</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">時窗健康度</span>
          </div>
        </div>
      )}

      {/* Main Heatmap Visual Matrix */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 relative">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              延遲區間熱力分佈矩陣 (Y: 延遲分桶 | X: 滾動分鐘)
            </span>
            <span className="text-slate-500 font-mono">
              [樣本總計: {summary?.totalRequestsMeasured || 0} 筆 HTTP 請求]
            </span>
          </div>

          {/* Color Legend */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>密度圖例:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-800" title="0 筆" />
              <span>0</span>
              <span className="w-3 h-3 rounded-sm bg-cyan-900/50" title="1-10%" />
              <span className="w-3 h-3 rounded-sm bg-cyan-600/70" title="10-30%" />
              <span className="w-3 h-3 rounded-sm bg-cyan-400" title="&gt;60%" />
              <span className="ml-2 w-3 h-3 rounded-sm bg-amber-500" title="抖動" />
              <span className="w-3 h-3 rounded-sm bg-rose-500 animate-pulse" title="暫態突波 (&gt;250ms)" />
              <span className="w-3 h-3 rounded-sm bg-red-600 ring-1 ring-red-400" title="嚴重突波 (&gt;500ms)" />
              <span className="text-rose-400 font-bold ml-1">突波 (Spikes)</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid Container */}
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="min-w-[720px]">
            {/* Rows: Each Latency Bin */}
            <div className="space-y-1">
              {binDefs.map((bin) => (
                <div key={bin.id} className="flex items-center gap-1.5">
                  {/* Bin Label Column */}
                  <div className="w-24 shrink-0 text-right pr-2 font-mono text-[11px] flex items-center justify-end gap-1.5">
                    {bin.severity === 'critical' || bin.severity === 'spike' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    ) : bin.severity === 'warning' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    ) : null}
                    <span
                      className={`${
                        bin.severity === 'critical'
                          ? 'text-rose-400 font-bold'
                          : bin.severity === 'spike'
                          ? 'text-orange-400 font-semibold'
                          : bin.severity === 'warning'
                          ? 'text-amber-300'
                          : bin.severity === 'elevated'
                          ? 'text-yellow-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {bin.label}
                    </span>
                  </div>

                  {/* Columns for this bin */}
                  <div className="flex-1 grid grid-flow-col auto-cols-fr gap-1">
                    {columns.map((col, colIdx) => {
                      const cell = col.bins[bin.id] || { count: 0, pct: 0 };
                      const isHovered = hoveredCell?.columnIndex === colIdx && hoveredCell.bin.id === bin.id;
                      const isColSelected = selectedColumn?.minute === col.minute;
                      const hasColSpike = col.hasSpike && (bin.id === '250_500ms' || bin.id === 'gt500ms' || bin.id === '120_250ms') && cell.count > 0;

                      return (
                        <div
                          key={`${bin.id}-${col.minute}-${colIdx}`}
                          onMouseEnter={() => setHoveredCell({ column: col, bin, cell, columnIndex: colIdx })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => setSelectedColumn(col)}
                          className={`h-7 rounded transition-all cursor-pointer relative flex items-center justify-center text-[10px] font-mono border ${
                            getCellColor(bin, cell)
                          } ${isHovered ? 'ring-2 ring-white scale-105 z-10' : ''} ${
                            isColSelected ? 'ring-1 ring-cyan-400' : ''
                          }`}
                          title={`${col.minute} | ${bin.label}: ${cell.count} 筆 (${cell.pct}%)`}
                        >
                          {/* Display count if > 0 and column width allows */}
                          {cell.count > 0 && (
                            <span className="opacity-90 select-none scale-90 truncate px-0.5">
                              {cell.count}
                            </span>
                          )}

                          {/* Outlier indicator beacon */}
                          {hasColSpike && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-rose-950 animate-ping pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Axis (X-Axis) Labels */}
            <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-800/80">
              <div className="w-24 shrink-0 text-right pr-2 text-[10px] text-slate-500 font-mono">
                時間 (時:分)
              </div>
              <div className="flex-1 grid grid-flow-col auto-cols-fr gap-1 font-mono text-[9px] text-slate-400">
                {columns.map((col, idx) => {
                  // Only display every 5th or 6th minute label to avoid crowding
                  const showLabel = idx % (timeRange === '15m' ? 2 : timeRange === '30m' ? 4 : 6) === 0 || idx === columns.length - 1;
                  return (
                    <div
                      key={col.minute + idx}
                      className={`text-center truncate ${col.hasSpike ? 'text-amber-400 font-bold' : ''}`}
                    >
                      {showLabel ? col.minute : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Hovered Cell Tooltip Card */}
        {hoveredCell && (
          <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                時段: {hoveredCell.column.minute} ({new Date(hoveredCell.column.timestamp).toLocaleTimeString()})
              </span>
              <span className="text-white">
                延遲區間: <strong className="text-amber-300">{hoveredCell.bin.label}</strong>
              </span>
              <span className="text-slate-300">
                請求落點數: <strong className="text-emerald-300">{hoveredCell.cell.count} 筆</strong>
                <span className="text-slate-400 ml-1">({hoveredCell.cell.pct}% of 時段總量)</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>P50: <strong className="text-white">{hoveredCell.column.p50}ms</strong></span>
              <span>P90: <strong className="text-white">{hoveredCell.column.p90}ms</strong></span>
              <span>P95: <strong className="text-white">{hoveredCell.column.p95}ms</strong></span>
              <span>P99: <strong className="text-amber-300">{hoveredCell.column.p99}ms</strong></span>
              <span>峰值: <strong className="text-rose-400">{hoveredCell.column.max}ms</strong></span>
              {hoveredCell.column.hasSpike && (
                <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold">
                  檢測到暫態尖峰 (Spike)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Percentile Trajectory Sparkline Overlay (P50 vs P95 vs P99) */}
      {showTrendChart && (
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">連線延遲百分位數動態趨勢 (P50 / P90 / P95 / P99 Trajectory)</span>
              <span className="text-slate-500 font-mono text-[11px]">
                直觀反映突波高聳超出基準之長尾偏移量
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 rounded" />
                P50 (中位數)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-0.5 bg-indigo-400 rounded" />
                P90
              </span>
              <span className="flex items-center gap-1.5 text-violet-400">
                <span className="w-2.5 h-0.5 bg-violet-400 rounded" />
                P95
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-400 rounded" />
                P99 (長尾)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-0.5 bg-rose-400 rounded" />
                Max (峰值)
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={columns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="p99Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="p50Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="minute" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="ms" />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as HeatmapColumn;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                          <div className="text-cyan-300 font-bold mb-1">
                            {d.minute} (時段樣本: {d.totalRequests} 筆)
                          </div>
                          <div className="space-y-0.5 text-slate-300">
                            <div>P50 (中位): <span className="text-cyan-400 font-bold">{d.p50} ms</span></div>
                            <div>P90: <span className="text-indigo-400 font-bold">{d.p90} ms</span></div>
                            <div>P95: <span className="text-violet-400 font-bold">{d.p95} ms</span></div>
                            <div>P99: <span className="text-amber-400 font-bold">{d.p99} ms</span></div>
                            <div>峰值 (Max): <span className="text-rose-400 font-bold">{d.max} ms</span></div>
                            {d.hasSpike && (
                              <div className="text-rose-400 font-bold mt-1 text-[11px]">
                                ⚠ 尖峰原因: {d.spikeReason || '暫態網路延遲異常'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={120} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '突波警戒線 (120ms)', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={250} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '臨界突波線 (250ms)', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="p99" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#p99Gradient)" />
                <Area type="monotone" dataKey="p50" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#p50Gradient)" />
                <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Selected Time Window Deep Inspection Panel */}
      {selectedColumn && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                時窗詳細分析: <span className="font-mono text-cyan-300">{selectedColumn.minute}</span> ({selectedColumn.timestamp})
              </h4>
            </div>
            <button
              onClick={() => setSelectedColumn(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">請求總數</span>
              <span className="text-white font-bold text-sm">{selectedColumn.totalRequests} 筆</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">P50 / P95</span>
              <span className="text-cyan-300 font-bold text-sm">{selectedColumn.p50}ms / {selectedColumn.p95}ms</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">P99 (長尾)</span>
              <span className="text-amber-300 font-bold text-sm">{selectedColumn.p99}ms</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">峰值延遲</span>
              <span className="text-rose-400 font-bold text-sm">{selectedColumn.max}ms</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">平均延遲</span>
              <span className="text-slate-200 font-bold text-sm">{selectedColumn.avg}ms</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">突波狀態</span>
              <span className={`font-bold text-xs ${selectedColumn.hasSpike ? 'text-rose-400' : 'text-emerald-400'}`}>
                {selectedColumn.hasSpike ? '檢測到尖峰異常' : '常態低延遲'}
              </span>
            </div>
          </div>

          {selectedColumn.hasSpike && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300">尖峰診斷分析:</strong> {selectedColumn.spikeReason || '暫態網路延遲超過 120ms 臨界門檻。'}
                <p className="text-slate-400 text-[11px] mt-0.5">
                  建議核對 TCP 重傳次數、GC 暫停時間或下游 VictoriaLogs 磁碟寫入負載狀態。
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transient Network Spikes Forensic Log Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">
              暫態網路延遲突波鑑識報告 (Transient Network Spikes Forensic Audit)
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              累計捕獲 {transientSpikes.length} 次
            </span>
          </div>
          <span className="text-xs text-slate-400">
            自動捕獲長尾離群值 (&gt;120ms) 與可能成因
          </span>
        </div>

        {transientSpikes.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            過去一小時內無檢測到暫態延遲突波，VictoriaLogs 連線狀況極佳。
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">時間 (Timestamp)</th>
                  <th className="py-2.5 px-3">峰值延遲</th>
                  <th className="py-2.5 px-3">P50 基準 / 放大倍率</th>
                  <th className="py-2.5 px-3">受影響批次</th>
                  <th className="py-2.5 px-3">潛在根本成因 (Probable Cause)</th>
                  <th className="py-2.5 px-3">處置與自動平抑 (Mitigation)</th>
                  <th className="py-2.5 px-3 text-center">嚴重度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {transientSpikes.map((spike) => (
                  <tr key={spike.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      {new Date(spike.timestamp).toLocaleTimeString()}
                      <span className="text-[10px] text-slate-500 block">{spike.minute}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-rose-400">
                      {spike.peakLatencyMs} ms
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {spike.baselineP50Ms} ms
                      <span className="text-amber-400 font-bold ml-1.5 text-[11px]">
                        +{spike.deviationMultiplier}x
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {spike.affectedRequests} 筆請求
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      <div className="font-semibold text-white">{spike.probableCause}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{spike.diagnostics}</div>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300 text-[11px]">
                      {spike.mitigation}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          spike.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {spike.severity === 'critical' ? 'Critical' : 'Warning'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Latency Spike Injection Modal */}
      {injectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">注入暫態網路延遲突波 (Inject Latency Spike)</h3>
                  <p className="text-xs text-slate-400">模擬下游 VictoriaLogs 磁碟寫入延遲或暫態網路擁塞</p>
                </div>
              </div>
              <button
                onClick={() => setInjectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  突波峰值延遲 (Peak Latency Target): <span className="text-amber-400 font-mono text-sm">{injectLatencyValue} ms</span>
                </label>
                <input
                  type="range"
                  min={120}
                  max={800}
                  step={20}
                  value={injectLatencyValue}
                  onChange={(e) => setInjectLatencyValue(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>120ms (輕度警戒)</span>
                  <span>350ms (高延遲突波)</span>
                  <span>500ms+ (臨界阻塞)</span>
                  <span>800ms</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">模擬突波診斷根本成因 (Probable Diagnostic Cause):</label>
                <select
                  value={injectReason}
                  onChange={(e) => setInjectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-amber-500"
                >
                  <option value="TCP SYN 逾時重傳與佇列擁塞 (TCP Retransmit & Queue Congestion)">
                    TCP SYN 逾時重傳與佇列擁塞 (TCP Retransmit)
                  </option>
                  <option value="VictoriaLogs 儲存 LSM Compaction 落盤暫態 I/O 阻塞">
                    VictoriaLogs 儲存 LSM Compaction 落盤暫態 I/O 阻塞
                  </option>
                  <option value="NIC 網卡佇列緩衝積壓抖動 (NIC Buffer Bloat)">
                    NIC 網卡佇列緩衝積壓抖動 (NIC Buffer Bloat)
                  </option>
                  <option value="GC Pause 垃圾回收阻塞與 Lock 爭搶 (GC Pause & Lock Contention)">
                    GC Pause 垃圾回收阻塞與 Lock 爭搶
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                <strong>注入預期效果:</strong> 執行後將對最新時間欄位注入帶有該延遲特徵的 5 筆樣本，熱力圖矩陣的高延遲桶區間 (120~250ms 或 250~500ms+) 將立即以亮橘/紅色醒目亮起，並新增一筆鑑識異常紀錄。
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInjectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleInjectSpike}
                disabled={isInjecting}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isInjecting ? 'animate-spin' : ''}`} />
                <span>{isInjecting ? '注入中...' : '確認注入突波'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

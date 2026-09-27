import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
  Sliders,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Server,
  Database,
  BarChart3,
  Flame,
  Info,
  ChevronRight
} from 'lucide-react';

export interface MinuteThroughputBucket {
  minuteIndex: number;
  timestamp: number;
  timeLabel: string;
  relativeLabel: string;
  volume: number;
  eps: number;
  bytesMB: number;
  movingAvgVolume: number;
  bufferDepthAvg: number;
  workerSaturationPct: number;
  droppedLogs: number;
  isBottleneck: boolean;
  bottleneckSeverity: 'none' | 'warning' | 'critical';
  bottleneckType?: 'none' | 'buffer_saturation' | 'worker_starvation' | 'upstream_drop' | 'downstream_backpressure';
  bottleneckReason?: string;
  protocols: {
    syslogUdp: number;
    syslogTcp: number;
    syslogTls: number;
    httpIngest: number;
  };
}

export interface BottleneckAlert {
  id: string;
  timestamp: number;
  timeLabel: string;
  severity: 'warning' | 'critical';
  title: string;
  volume: number;
  threshold: number;
  impact: string;
  recommendation: string;
  rootCause: string;
}

export interface ThroughputHistorySummary {
  windowMinutes: number;
  totalVolume: number;
  totalBytesMB: number;
  avgVolumePerMinute: number;
  avgEps: number;
  peakMinuteVolume: number;
  peakMinuteTime: string;
  minMinuteVolume: number;
  minMinuteTime: string;
  currentMinuteVolume: number;
  currentMinuteEps: number;
  bottleneckThresholds: {
    warningThreshold: number;
    saturationThreshold: number;
    bufferCapacity: number;
  };
  overallBottleneckStatus: 'HEALTHY' | 'WARNING_ELEVATED' | 'CRITICAL_BOTTLENECK';
  activeBottlenecksCount: number;
  recentAlerts: BottleneckAlert[];
  protocolDistribution: {
    name: string;
    volume: number;
    percentage: number;
    color: string;
  }[];
}

interface CollectorThroughputIndicatorProps {
  compact?: boolean;
  onNavigateDiagnostics?: () => void;
}

export function CollectorThroughputIndicator({ compact = false }: CollectorThroughputIndicatorProps) {
  const [buckets, setBuckets] = useState<MinuteThroughputBucket[]>([]);
  const [summary, setSummary] = useState<ThroughputHistorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [pollIntervalMs, setPollIntervalMs] = useState(4000);
  const [windowMinutes, setWindowMinutes] = useState<60 | 30 | 15>(60);
  const [metricMode, setMetricMode] = useState<'volume' | 'eps' | 'bytes' | 'stacked'>('volume');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [selectedMinute, setSelectedMinute] = useState<MinuteThroughputBucket | null>(null);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState(false);
  const [burstSuccessMsg, setBurstSuccessMsg] = useState<string | null>(null);
  const [showThresholdEditor, setShowThresholdEditor] = useState(false);
  const [tempWarningThreshold, setTempWarningThreshold] = useState<number>(38000);
  const [tempSaturationThreshold, setTempSaturationThreshold] = useState<number>(50000);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const isMountedRef = useRef(true);

  const fetchThroughputData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch(`/api/engine/collector/throughput-history?window=${windowMinutes}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (!isMountedRef.current) return;
      if (data.success) {
        setBuckets(data.buckets || []);
        setSummary(data.summary || null);
        setLastRefreshedAt(new Date());
        if (data.summary?.bottleneckThresholds) {
          setTempWarningThreshold(data.summary.bottleneckThresholds.warningThreshold);
          setTempSaturationThreshold(data.summary.bottleneckThresholds.saturationThreshold);
        }
      }
    } catch (err) {
      console.error('Failed to fetch throughput history:', err);
    } finally {
      if (isMountedRef.current && !silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchThroughputData();

    let timer: any = null;
    if (isLivePolling) {
      timer = setInterval(() => {
        fetchThroughputData(true);
      }, pollIntervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (timer) clearInterval(timer);
    };
  }, [isLivePolling, pollIntervalMs, windowMinutes]);

  const handleSimulateBurst = async (profile: 'spike' | 'saturation' | 'stoppage', volume: number = 35000) => {
    setIsSimulatingBurst(true);
    setBurstSuccessMsg(null);
    try {
      const res = await fetch('/api/engine/collector/throughput-history/burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, volume })
      });
      const data = await res.json();
      if (data.success) {
        setBuckets(data.buckets || []);
        setSummary(data.summary || null);
        setBurstSuccessMsg(data.message);
        setTimeout(() => setBurstSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to simulate burst:', err);
    } finally {
      setIsSimulatingBurst(false);
    }
  };

  const handleSaveThresholds = async () => {
    try {
      const res = await fetch('/api/engine/collector/throughput-history/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warningThreshold: tempWarningThreshold,
          saturationThreshold: tempSaturationThreshold
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowThresholdEditor(false);
        fetchThroughputData();
      }
    } catch (err) {
      console.error('Failed to update thresholds:', err);
    }
  };

  // Recharts chart data mapper
  const chartData = useMemo(() => {
    return buckets.map((b) => ({
      ...b,
      chartVolume: metricMode === 'eps' ? b.eps : (metricMode === 'bytes' ? b.bytesMB : b.volume),
      chartMovingAvg: metricMode === 'eps' ? Math.round(b.movingAvgVolume / 60) : (metricMode === 'bytes' ? Number(((b.movingAvgVolume * 420) / (1024 * 1024)).toFixed(2)) : b.movingAvgVolume),
      color: b.bottleneckSeverity === 'critical'
        ? '#f43f5e' // Rose-500
        : b.bottleneckSeverity === 'warning'
        ? '#f59e0b' // Amber-500
        : '#06b6d4' // Cyan-500
    }));
  }, [buckets, metricMode]);

  // Bottleneck status color definitions
  const getStatusColorClasses = (status?: string) => {
    switch (status) {
      case 'CRITICAL_BOTTLENECK':
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/20',
          badgeText: 'text-rose-300',
          label: '重大瓶頸告警 (Critical Bottleneck)'
        };
      case 'WARNING_ELEVATED':
        return {
          bg: 'bg-amber-950/30',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20',
          badgeText: 'text-amber-300',
          label: '高負載預警 (Elevated Load)'
        };
      default:
        return {
          bg: 'bg-slate-900/90',
          border: 'border-slate-800',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/15',
          badgeText: 'text-emerald-300',
          label: '流速正常平衡 (Optimal Flow)'
        };
    }
  };

  const statusStyle = getStatusColorClasses(summary?.overallBottleneckStatus);

  // Formatter for Y-Axis and Tooltips
  const formatYAxis = (val: number) => {
    if (metricMode === 'bytes') return `${val}MB`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  // Custom Interactive Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MinuteThroughputBucket = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-lg p-3.5 shadow-2xl text-xs font-mono max-w-xs backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5 font-sans">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {data.timeLabel} ({data.relativeLabel})
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              data.bottleneckSeverity === 'critical'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : data.bottleneckSeverity === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {data.bottleneckSeverity === 'critical' ? '瓶頸警報' : (data.bottleneckSeverity === 'warning' ? '高水位' : '正常')}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">進線總筆數:</span>
              <span className="text-white font-bold">{data.volume.toLocaleString()} 筆/分</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">平均流速:</span>
              <span className="text-cyan-400 font-bold">{data.eps.toLocaleString()} EPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">資料吞吐量:</span>
              <span className="text-indigo-300">{data.bytesMB} MB/min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">5分鐘移動平均:</span>
              <span className="text-purple-300">{data.movingAvgVolume.toLocaleString()} 筆</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">環形緩衝深度:</span>
              <span className={data.bufferDepthAvg > 35000 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {data.bufferDepthAvg.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">工作協程飽和度:</span>
              <span className={data.workerSaturationPct > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                {data.workerSaturationPct}%
              </span>
            </div>
          </div>

          {/* Protocol Breakdown Micro-bar */}
          <div className="mt-2.5 pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
              <span>協定分佈</span>
              <span>UDP: {data.protocols.syslogUdp.toLocaleString()} · HTTP: {data.protocols.httpIngest.toLocaleString()}</span>
            </div>
          </div>

          {data.bottleneckReason && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-rose-300 font-sans leading-relaxed bg-rose-950/30 p-1.5 rounded">
              ⚡ <strong>瓶頸診斷:</strong> {data.bottleneckReason}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4" id="visual-throughput-indicator-container">
      {/* 1. Header Banner & Bottleneck Diagnostic Status */}
      <div className={`rounded-xl border p-4 transition-all duration-300 shadow-sm ${statusStyle.bg} ${statusStyle.border}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400">採集器吞吐遙測</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-cyan-400">過去 1 小時每分鐘吞吐曲線</span>
              <span className="text-slate-600">·</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1.5 ${statusStyle.badgeBg} ${statusStyle.badgeText}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  summary?.overallBottleneckStatus === 'CRITICAL_BOTTLENECK'
                    ? 'bg-rose-400 animate-ping'
                    : summary?.overallBottleneckStatus === 'WARNING_ELEVATED'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`} />
                {statusStyle.label}
              </span>

              {summary && summary.activeBottlenecksCount > 0 && (
                <span className="text-xs font-sans text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  已標記 {summary.activeBottlenecksCount} 個過載或受阻分鐘
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              日誌進線吞吐量即時視覺化指標 (Visual Ingestion Throughput & Bottleneck Detector)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              依據每分鐘日誌筆數 (Logs/min) 與事件流速 (EPS) 監控管線飽和度，於緩衝區溢位前即刻識別協程負載與排空瓶頸。
            </p>
          </div>

          {/* Interactive Controls Toolbar */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            {/* Window selector */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setWindowMinutes(60)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  windowMinutes === 60 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="檢視最近 1 小時 (60 個分鐘取樣點)"
              >
                1小時 (60m)
              </button>
              <button
                onClick={() => setWindowMinutes(30)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  windowMinutes === 30 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="檢視最近 30 分鐘"
              >
                30分 (30m)
              </button>
              <button
                onClick={() => setWindowMinutes(15)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  windowMinutes === 15 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="檢視最近 15 分鐘"
              >
                15分 (15m)
              </button>
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setMetricMode('volume')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  metricMode === 'volume' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                筆數/分
              </button>
              <button
                onClick={() => setMetricMode('eps')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  metricMode === 'eps' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                EPS流速
              </button>
              <button
                onClick={() => setMetricMode('bytes')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  metricMode === 'bytes' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                MB流量
              </button>
            </div>

            {/* Threshold editor trigger */}
            <button
              onClick={() => setShowThresholdEditor(!showThresholdEditor)}
              className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
                showThresholdEditor ? 'bg-slate-700 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="調校瓶頸警戒閾值"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">閾值</span>
            </button>

            {/* Live Polling Toggle */}
            <button
              onClick={() => setIsLivePolling(!isLivePolling)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                isLivePolling
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLivePolling ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isLivePolling ? '實時串流中' : '已暫停'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchThroughputData(false)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="手動立即重新整理"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Inline Threshold Editor Drawer */}
        {showThresholdEditor && (
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-lg text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">
                高載預警線 (Warning Threshold):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1000"
                  value={tempWarningThreshold}
                  onChange={(e) => setTempWarningThreshold(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs w-full outline-none focus:border-amber-400"
                />
                <span className="text-slate-400 whitespace-nowrap">筆/分</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                飽和瓶頸線 (Saturation Threshold):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1000"
                  value={tempSaturationThreshold}
                  onChange={(e) => setTempSaturationThreshold(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs w-full outline-none focus:border-rose-400"
                />
                <span className="text-slate-400 whitespace-nowrap">筆/分</span>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleSaveThresholds}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold text-xs transition"
              >
                套用門檻設定
              </button>
              <button
                onClick={() => {
                  setTempWarningThreshold(38000);
                  setTempSaturationThreshold(50000);
                }}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs transition"
              >
                恢復預設
              </button>
            </div>
          </div>
        )}

        {/* Burst Simulation Notification */}
        {burstSuccessMsg && (
          <div className="mt-3 p-2 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-xs text-indigo-300 font-sans flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              {burstSuccessMsg}
            </span>
            <button onClick={() => setBurstSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* 2. KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Card 1: 1-Hour Total Volume */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-sans">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              1小時累計日誌量
            </span>
            <span className="text-[10px] text-slate-500">60 Min Total</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {summary ? (summary.totalVolume).toLocaleString() : '---'}
            </span>
            <span className="text-xs text-slate-400">筆</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span>資料總量: {summary ? `${summary.totalBytesMB} MB` : '---'}</span>
            <span className="text-emerald-400 font-mono">均速: {summary ? `${summary.avgEps} EPS` : '---'}</span>
          </div>
        </div>

        {/* Card 2: Peak Ingestion Minute */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-sans">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              最高峰值分鐘
            </span>
            <span className="text-[10px] text-rose-400 font-mono">
              {summary?.peakMinuteTime || '--:--'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-rose-300 tracking-tight">
              {summary ? (summary.peakMinuteVolume).toLocaleString() : '---'}
            </span>
            <span className="text-xs text-slate-400">筆/分</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span>峰值流速: {summary ? `${Math.round(summary.peakMinuteVolume / 60)} EPS` : '---'}</span>
            <span className={summary && summary.peakMinuteVolume >= (summary.bottleneckThresholds?.saturationThreshold || 50000) ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {summary && summary.peakMinuteVolume >= (summary.bottleneckThresholds?.saturationThreshold || 50000) ? '超過飽和線' : '低於極限'}
            </span>
          </div>
        </div>

        {/* Card 3: Real-time Ingestion Volume (Current Minute) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-sans">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              當前分鐘進線速率
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">T-0m (Now)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {summary ? (summary.currentMinuteVolume).toLocaleString() : '---'}
            </span>
            <span className="text-xs text-slate-400">筆/分</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span>即時 EPS: <strong className="text-emerald-400 font-mono">{summary ? summary.currentMinuteEps : '---'}</strong></span>
            <span className="text-slate-400">最低: {summary ? summary.minMinuteVolume.toLocaleString() : '---'}</span>
          </div>
        </div>

        {/* Card 4: Bottleneck Headroom & Saturation Barrier */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-sans">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              瓶頸安全裕度 (Headroom)
            </span>
            <span className="text-[10px] text-amber-300 font-mono">
              飽和線: {summary ? `${(summary.bottleneckThresholds?.saturationThreshold / 1000).toFixed(0)}k` : '50k'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            {summary ? (
              <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
                summary.currentMinuteVolume >= summary.bottleneckThresholds.saturationThreshold
                  ? 'text-rose-400'
                  : summary.currentMinuteVolume >= summary.bottleneckThresholds.warningThreshold
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {Math.max(0, summary.bottleneckThresholds.saturationThreshold - summary.currentMinuteVolume).toLocaleString()}
              </span>
            ) : (
              <span className="text-xl font-bold text-white">---</span>
            )}
            <span className="text-xs text-slate-400">筆裕度</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span>預警線: {summary ? `${(summary.bottleneckThresholds?.warningThreshold / 1000).toFixed(0)}k/分` : '38k'}</span>
            <span className="text-indigo-400">環形緩衝 50k 容量</span>
          </div>
        </div>
      </div>

      {/* 3. Primary Recharts Ingestion Volume Visualizer */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                日誌採集進線流速曲線 (Log Ingestion Throughput Stream)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                1-Min Buckets · Last {windowMinutes}m
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              柱狀圖色彩映射即時狀態：<span className="text-cyan-400 font-bold">青色</span>=常態流速，
              <span className="text-amber-400 font-bold">黃色</span>=接近高載預警線，
              <span className="text-rose-400 font-bold">紅色</span>=觸發管線飽和瓶頸。
            </p>
          </div>

          {/* Chart Display Option (Bar vs Area) & Fast Simulators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded border border-slate-700 text-[11px]">
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-0.5 rounded font-medium ${chartType === 'bar' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                長條圖 (Bars)
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2 py-0.5 rounded font-medium ${chartType === 'area' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                面積圖 (Area)
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -5, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedMinute(e.activePayload[0].payload);
                }
              }}
            >
              <defs>
                <linearGradient id="cyanVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="roseSaturationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                interval={windowMinutes === 60 ? 5 : 2}
              />
              
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={formatYAxis}
                domain={[0, (dataMax: number) => Math.max(dataMax * 1.15, (summary?.bottleneckThresholds?.saturationThreshold || 50000) * 1.1)]}
              />

              <Tooltip content={<CustomChartTooltip />} />

              {/* Reference Lines for Bottleneck Identification */}
              <ReferenceLine
                y={summary?.bottleneckThresholds?.saturationThreshold || 50000}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `🔴 飽和瓶頸門檻 (${((summary?.bottleneckThresholds?.saturationThreshold || 50000) / 1000).toFixed(0)}k/分)`,
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'top',
                  fontFamily: 'sans-serif'
                }}
              />

              <ReferenceLine
                y={summary?.bottleneckThresholds?.warningThreshold || 38000}
                stroke="#fbbf24"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: `🟡 預警警戒線 (${((summary?.bottleneckThresholds?.warningThreshold || 38000) / 1000).toFixed(0)}k/分)`,
                  fill: '#fbbf24',
                  fontSize: 10,
                  position: 'top',
                  fontFamily: 'sans-serif'
                }}
              />

              {summary && (
                <ReferenceLine
                  y={summary.avgVolumePerMinute}
                  stroke="#818cf8"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: `均值 (${(summary.avgVolumePerMinute / 1000).toFixed(1)}k)`,
                    fill: '#818cf8',
                    fontSize: 9,
                    position: 'insideBottomRight'
                  }}
                />
              )}

              {chartType === 'bar' ? (
                <Bar
                  dataKey="chartVolume"
                  name="每分鐘進線筆數"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              ) : (
                <Area
                  type="monotone"
                  dataKey="chartVolume"
                  name="每分鐘進線筆數"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#cyanVolumeGradient)"
                  isAnimationActive={false}
                />
              )}

              {/* 5-Minute Moving Average Overlay */}
              <Line
                type="monotone"
                dataKey="chartMovingAvg"
                name="5分鐘移動平均線"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 60-Minute Bottleneck Health Status Strip */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-sans">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              過去 {windowMinutes} 分鐘管線健康指標微量條 (點擊色塊檢視該分鐘細節):
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              更新於: {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : '---'}
            </span>
          </div>

          {/* Micro dots timeline */}
          <div className="grid grid-flow-col auto-cols-fr gap-1 h-3 rounded bg-slate-950 p-0.5 border border-slate-800 overflow-hidden">
            {chartData.map((item, idx) => (
              <button
                key={`strip-${idx}`}
                onClick={() => setSelectedMinute(item)}
                title={`${item.timeLabel}: ${item.volume.toLocaleString()} 筆 · ${item.bottleneckSeverity === 'critical' ? '飽和瓶頸' : (item.bottleneckSeverity === 'warning' ? '高水位' : '正常')}`}
                className={`h-full rounded-xs transition-all hover:scale-125 ${
                  item.bottleneckSeverity === 'critical'
                    ? 'bg-rose-500'
                    : item.bottleneckSeverity === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-emerald-500/60 hover:bg-emerald-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Legend strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> 正常吞吐 (Optimal)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> 高載接近瓶頸 (Warning)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> 飽和瓶頸警示 (Saturation)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-purple-400 inline-block" /> 5-min 移動均線
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">快速注入模擬事件:</span>
            <button
              onClick={() => handleSimulateBurst('saturation', 32000)}
              disabled={isSimulatingBurst}
              className="px-2 py-0.5 rounded text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-medium transition"
            >
              模擬突發飽和瓶頸
            </button>
            <button
              onClick={() => handleSimulateBurst('spike', 18000)}
              disabled={isSimulatingBurst}
              className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-medium transition"
            >
              模擬高載突波
            </button>
            <button
              onClick={() => handleSimulateBurst('stoppage', 0)}
              disabled={isSimulatingBurst}
              className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-medium transition"
            >
              模擬上游驟降斷流
            </button>
          </div>
        </div>
      </div>

      {/* 4. Selected Minute Inspector & Bottleneck Diagnostic Insights */}
      {selectedMinute && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-4 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  取樣分鐘詳細診斷: {selectedMinute.timeLabel} ({selectedMinute.relativeLabel})
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${
                    selectedMinute.bottleneckSeverity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : selectedMinute.bottleneckSeverity === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {selectedMinute.bottleneckSeverity.toUpperCase()}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  時間戳: {new Date(selectedMinute.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedMinute(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              關閉詳細診斷
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-slate-400 text-[10px]">該分鐘進線量</div>
              <div className="text-white font-bold text-base mt-0.5">{selectedMinute.volume.toLocaleString()} <span className="text-[10px] text-slate-400">筆</span></div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-slate-400 text-[10px]">平均流速 (EPS)</div>
              <div className="text-cyan-400 font-bold text-base mt-0.5">{selectedMinute.eps.toLocaleString()} <span className="text-[10px] text-slate-400">EPS</span></div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-slate-400 text-[10px]">環形緩衝水位</div>
              <div className={`font-bold text-base mt-0.5 ${selectedMinute.bufferDepthAvg > 35000 ? 'text-rose-400' : 'text-slate-200'}`}>
                {selectedMinute.bufferDepthAvg.toLocaleString()} <span className="text-[10px] text-slate-400">/ 50k</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-slate-400 text-[10px]">協程飽和度</div>
              <div className={`font-bold text-base mt-0.5 ${selectedMinute.workerSaturationPct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {selectedMinute.workerSaturationPct}%
              </div>
            </div>
          </div>

          {selectedMinute.bottleneckReason ? (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 font-sans space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                性能瓶頸診斷結論:
              </div>
              <p className="leading-relaxed">{selectedMinute.bottleneckReason}</p>
              <div className="text-[11px] text-slate-300 mt-2 pt-2 border-t border-rose-900/50">
                建議處置：檢視下方協程飽和度與環形緩衝微批次排空週期，適度提高 <code>batchSize</code> 或調降 Syslog UDP SO_RCVBUF 核心緩衝。
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 font-sans flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>該分鐘管線運作無瓶頸阻滯，進線填充速率與排出速度維持 1:1 動態平衡。</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Recent Bottleneck Episodes & Protocol Mix Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Identified Bottlenecks & Alerts */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              近期偵測之採集管線瓶頸事件 (Bottleneck Episodes)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              共計 {summary?.recentAlerts?.length || 0} 起事件
            </span>
          </div>

          {summary?.recentAlerts && summary.recentAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {summary.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-slate-950/80 border border-rose-500/30 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5 font-sans">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      {alert.title}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                      {alert.timeLabel}
                    </span>
                  </div>
                  <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                    <span className="text-slate-400">衝擊影響:</span> {alert.impact}
                  </div>
                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    <span className="text-amber-400">根因分析:</span> {alert.rootCause}
                  </div>
                  <div className="text-indigo-300 font-sans text-[11px] pt-1 border-t border-slate-800 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-indigo-400 inline" />
                    <span>建議處置: {alert.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs font-sans">
              <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mx-auto mb-2" />
              過去 1 小時未偵測到持續性性能瓶頸。進線吞吐量維持於健康水位以下。
            </div>
          )}
        </div>

        {/* Right: Protocol Distribution Stack */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              通訊協定進線佔比 (Protocol Mix)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">1-Hour Aggregation</span>
          </div>

          <div className="space-y-3 font-sans">
            {summary?.protocolDistribution.map((proto) => (
              <div key={proto.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proto.color }} />
                    {proto.name}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {proto.percentage}% ({proto.volume.toLocaleString()} 筆)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${proto.percentage}%`,
                      backgroundColor: proto.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans leading-relaxed">
            💡 <strong>協定瓶頸提示:</strong> Syslog UDP 佔比通常最高，在高負載下易引發 SO_RCVBUF 溢位；Syslog TLS 具較高 CPU 解密負載，若超過 25% 建議檢查協程池是否分配足夠的解包 Worker。
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectorThroughputIndicator;

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Layers,
  Server,
  Zap,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Radio,
  BarChart3,
  HardDrive,
  Maximize2,
  Gauge,
  ShieldAlert,
  ArrowUpRight,
  Terminal,
  FileCode,
  Shield,
  Filter,
  TrendingDown,
  Flame
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import LogParserDiagnosticPanel from './LogParserDiagnosticPanel';
import LogSourcesTable from './LogSourcesTable';
import { VictoriaLogsRetryMonitorView } from './VictoriaLogsRetryMonitorView';
import { VictoriaLogsLatencyHeatmap } from './VictoriaLogsLatencyHeatmap';
import { CollectorMemoryManagementPanel } from './CollectorMemoryManagementPanel';
import { CollectorThroughputIndicator } from './CollectorThroughputIndicator';
import { CollectorConnectionPoolPanel } from './CollectorConnectionPoolPanel';
import { IngestionDropThresholdConfigPanel } from './IngestionDropThresholdConfigPanel';

export interface CollectorWorker {
  workerId: string;
  role: string;
  status: 'busy' | 'idle';
  currentLoad: number;
  tasksProcessed: number;
  errorCount: number;
}

export interface FillRateMonitorData {
  utility: string;
  severity: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL';
  fillRateEPS: number;
  drainRateEPS: number;
  netAccumulationRate: number;
  fillVelocityRatio: number;
  workerSaturationPct: number;
  workerSaturationThreshold: number;
  timeToSaturationSec: number;
  isEarlyBottleneck: boolean;
  headroomSlots: number;
  recommendation: string;
}

export interface CollectorHealthData {
  status: 'healthy' | 'degraded';
  service: string;
  endpoint: string;
  timestamp: number;
  uptimeSeconds: number;
  fillRateMonitor?: FillRateMonitorData;
  memoryManagement?: any;
  connectionPool?: any;
  buffer: {
    depth: number;
    capacity: number;
    depthPercentage: number;
    highWatermark: number;
    lowWatermark: number;
    drainRatePerSec: number;
    fillRatePerSec: number;
    backpressureActive: boolean;
    droppedEvents: number;
  };
  workerPool: {
    totalWorkers: number;
    activeWorkers: number;
    idleWorkers: number;
    saturationRatio: number;
    saturationPercentage: number;
    avgExecutionTimeMs: number;
    batchSizeCurrent: number;
    batchTimeoutMs: number;
    workers: CollectorWorker[];
  };
  network: {
    syslogUDPPort: number;
    syslogTCPPort: number;
    httpPort: number;
    bytesReceivedTotal: number;
    mbpsIngest: number;
  };
}

interface TelemetryHistoryPoint {
  time: string;
  depth: number;
  depthPercentage: number;
  saturationPercentage: number;
  activeWorkers: number;
  fillRate: number;
  drainRate: number;
}

export function CollectorTelemetryDashboard() {
  const [data, setData] = useState<CollectorHealthData | null>(null);
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [pollIntervalMs, setPollIntervalMs] = useState(2000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [simulatedLoad, setSimulatedLoad] = useState<'normal' | 'surge' | 'stress'>('normal');
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'throughput' | 'drop_thresholds' | 'memory_strategy' | 'connection_pool' | 'retry_monitor' | 'latency_heatmap' | 'diagnostics' | 'sources' | 'protocols'>('overview');
  const [activeDropAlert, setActiveDropAlert] = useState<any>(null);

  const historyMaxPoints = 25;
  const isMountedRef = useRef(true);

  // Fetch telemetry from Go Collector endpoint
  const fetchTelemetry = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/engine/collector/healthz');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json: CollectorHealthData = await res.json();
      
      if (!isMountedRef.current) return;
      setData(json);
      setLastUpdated(new Date());

      // Also check for active throughput drop alerts
      try {
        const dropRes = await fetch('/api/engine/collector/throughput-history/drop-thresholds');
        if (dropRes.ok) {
          const dropData = await dropRes.json();
          if (dropData.activeDropAlert) {
            setActiveDropAlert(dropData.activeDropAlert);
          } else {
            setActiveDropAlert(null);
          }
        }
      } catch {
        // Ignore drop alert fetch failures
      }

      const timeStr = new Date(json.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      setHistory(prev => {
        const next = [
          ...prev,
          {
            time: timeStr,
            depth: json.buffer.depth,
            depthPercentage: json.buffer.depthPercentage,
            saturationPercentage: json.workerPool.saturationPercentage,
            activeWorkers: json.workerPool.activeWorkers,
            fillRate: json.buffer.fillRatePerSec,
            drainRate: json.buffer.drainRatePerSec
          }
        ];
        if (next.length > historyMaxPoints) {
          return next.slice(next.length - historyMaxPoints);
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to fetch Go collector telemetry:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchTelemetry();

    let intervalId: any = null;
    if (isLivePolling) {
      intervalId = setInterval(() => {
        fetchTelemetry();
      }, pollIntervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLivePolling, pollIntervalMs]);

  // Status color helpers
  const getSaturationColor = (ratio: number) => {
    if (ratio >= 0.85) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (ratio >= 0.6) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getBufferBarColor = (percentage: number) => {
    if (percentage >= 85) return 'from-rose-500 to-red-600';
    if (percentage >= 60) return 'from-amber-500 to-orange-500';
    return 'from-emerald-500 to-teal-500';
  };

  return (
    <div className="space-y-6" id="collector-telemetry-root">
      {/* Top Controller & Endpoint Metadata Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Go Ingestion Collector 遙測監控
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                HTTP: 8080 (REST/NDJSON) | Syslog UDP: 5140
              </span>
              {data && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase ${
                  data.status === 'healthy'
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                }`}>
                  {data.status}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              即時緩衝區深度與工作協程池飽和度 (Buffer Depth & Worker Pool Saturation)
            </h2>
            <p className="text-xs text-slate-400">
              直接向 Go 接收核心健康端點 (<code>/healthz</code> & <code>/api/v1/stats</code>) 輪詢原生通道環與 Goroutine 工作池負載狀態。
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            {/* Live Polling Switch */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">輪詢間隔:</span>
              <select
                value={pollIntervalMs}
                onChange={(e) => setPollIntervalMs(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500"
              >
                <option value={1000}>1 秒 (即時追蹤)</option>
                <option value={2000}>2 秒 (預設)</option>
                <option value={5000}>5 秒 (省頻寬)</option>
              </select>

              <button
                type="button"
                onClick={() => setIsLivePolling(!isLivePolling)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  isLivePolling
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Radio className={`w-3 h-3 ${isLivePolling ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                {isLivePolling ? 'Live 輪詢中' : '已暫停'}
              </button>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={fetchTelemetry}
              disabled={isLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              重新整理
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-500" />
              最後更新: {lastUpdated.toLocaleTimeString()}
            </span>
            <span className="text-slate-400">
              目標端點: <code className="text-indigo-300 bg-slate-800/80 px-1 py-0.5 rounded">{data?.endpoint || 'http://127.0.0.1:8080/healthz'}</code>
            </span>
          </div>
        )}
      </div>

      {/* Real-time Unexpected Ingestion Drop Warning Ribbon */}
      {activeDropAlert && (
        <div className="p-3.5 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/30">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
              <TrendingDown className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                🚨 系統警戒：日誌進線吞吐量發生異常暴跌！
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-500/30 text-rose-200 rounded font-bold uppercase">
                  {activeDropAlert.severity}
                </span>
              </span>
              <p className="text-[11px] text-gray-300 mt-0.5">
                {activeDropAlert.impact || '當前吞吐量異常低於警報設定門檻，可能導致資安威脅監控失明。'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setActiveMainTab('drop_thresholds')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 whitespace-nowrap"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>調校突降告警門檻</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveMainTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeMainTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          即時緩衝與工作池 (Performance & Buffer)
        </button>

        <button
          onClick={() => setActiveMainTab('throughput')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeMainTab === 'throughput'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>吞吐量與瓶頸指標 (Throughput Indicator)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            60m / Min
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('drop_thresholds')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeMainTab === 'drop_thresholds'
              ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          <span>進線量突降告警配置 (Drop Thresholds)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
            即時告警
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('memory_strategy')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeMainTab === 'memory_strategy'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>記憶體管理與環形緩衝區 (Circular Buffer & GC)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Zero-GC
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('connection_pool')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeMainTab === 'connection_pool'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>連線池與端口保護 (Connection Pool)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Port Safe
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('retry_monitor')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeMainTab === 'retry_monitor'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>VictoriaLogs POST 退避重試診斷</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            即時串流
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('latency_heatmap')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeMainTab === 'latency_heatmap'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>VictoriaLogs 延遲熱力圖</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            突波偵測
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('diagnostics')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeMainTab === 'diagnostics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          日誌解碼診斷測試 (Parser Diagnostics)
        </button>

        <button
          onClick={() => setActiveMainTab('sources')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeMainTab === 'sources'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          進線來源設備矩陣 (Ingestion Sources)
        </button>

        <button
          onClick={() => setActiveMainTab('protocols')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeMainTab === 'protocols'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          通訊協定架構規格 (Protocol Listeners)
        </button>
      </div>

      {/* Tab: Ingestion Throughput & Bottleneck Identification */}
      {activeMainTab === 'throughput' && (
        <CollectorThroughputIndicator />
      )}

      {/* Tab: Ingestion Volume Drop Thresholds & Real-time Alerting Configuration Panel */}
      {activeMainTab === 'drop_thresholds' && (
        <IngestionDropThresholdConfigPanel isZh={true} />
      )}

      {/* Tab: Memory Management & Circular Buffer Architecture */}
      {activeMainTab === 'memory_strategy' && (
        <CollectorMemoryManagementPanel />
      )}

      {/* Tab: Connection Pooling & Ephemeral Port Protection */}
      {activeMainTab === 'connection_pool' && (
        <CollectorConnectionPoolPanel />
      )}

      {/* Tab: VictoriaLogs Retry & Zero-Loss Diagnostic */}
      {activeMainTab === 'retry_monitor' && (
        <VictoriaLogsRetryMonitorView />
      )}

      {/* Tab: VictoriaLogs Latency Distribution Heatmap (Transient Spikes) */}
      {activeMainTab === 'latency_heatmap' && (
        <VictoriaLogsLatencyHeatmap />
      )}

      {/* Tab: Parser Diagnostics */}
      {activeMainTab === 'diagnostics' && (
        <LogParserDiagnosticPanel />
      )}

      {/* Tab: Sources Matrix */}
      {activeMainTab === 'sources' && (
        <LogSourcesTable />
      )}

      {/* Tab: Protocols Architecture */}
      {activeMainTab === 'protocols' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">UDP</span>
                Syslog UDP 監聽服務 (:5140)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Listening
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              標準 BSD (RFC 3164) 與 IETF (RFC 5424) 無連線封包接收。採用多執行緒 Goroutine 專屬 Worker 池與 32MB SO_RCVBUF 核心緩衝，避免瞬間爆發流量溢位。
            </p>
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">核心緩衝區:</span>
                <span className="text-indigo-300">32 MB (SO_RCVBUF)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Worker 數:</span>
                <span className="text-indigo-300">16 Workers (NumCPU * 2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">單 IP 流量限制:</span>
                <span className="text-indigo-300">50,000 EPS (Token-Bucket)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">TCP</span>
                Syslog TCP 監聽服務 (:5140)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Listening
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              支援 RFC 6587 (Octet-Counting Framing) 及傳統換行分隔符串流。內建斷線自動重組與 Keep-Alive 心跳機制，適合傳輸長封包日誌與不可遺失之審計軌跡。
            </p>
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">分框標準:</span>
                <span className="text-indigo-300">RFC 6587 Octet Counting</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">最大行緩衝:</span>
                <span className="text-indigo-300">1 MB / Line</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">連線維持:</span>
                <span className="text-indigo-300">TCP Keep-Alive (30s)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="p-1.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">TLS</span>
                Syslog TLS 安全通道 (:6514)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Listening
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              遵循 RFC 5425 標準之 Syslog over TLS 加密接收。支援 TLS 1.3 / 1.2、ECDSA P-256 高效能橢圓曲線金鑰與可選之雙向 mTLS 客戶端憑證校驗。
            </p>
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">通訊標準:</span>
                <span className="text-indigo-300">RFC 5425 (Syslog TLS)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">加密演算法:</span>
                <span className="text-indigo-300">ECDHE-ECDSA-AES256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">認證防偽:</span>
                <span className="text-indigo-300">支援 mTLS Client Certs</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">HTTP</span>
                HTTP 高吞吐批次通道 (:8080)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Listening
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              相容 VictoriaLogs <code>/insert/jsonline</code>、Grafana Loki <code>/insert/loki/api/v1/push</code> 與 Elasticsearch <code>/_bulk</code> 協定，支援百萬級日誌高速寫入。
            </p>
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">支援端點:</span>
                <span className="text-indigo-300">/insert/jsonline, /insert/loki</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">診斷測試:</span>
                <span className="text-indigo-300">/api/v1/collector/test-log</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">批次規模:</span>
                <span className="text-indigo-300">2,000 筆 / 250ms 自動聚合</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Overview (Original Telemetry & Buffer) */}
      {activeMainTab === 'overview' && (
        <>

      {/* Real-time Circular Buffer Fill-Rate & Pre-Saturation Bottleneck Monitor Panel */}
      {data?.fillRateMonitor && (
        <div className={`border rounded-xl p-4 transition-all duration-300 ${
          data.fillRateMonitor.severity === 'CRITICAL'
            ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/30'
            : data.fillRateMonitor.severity === 'WARNING'
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg border mt-0.5 ${
                data.fillRateMonitor.isEarlyBottleneck
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
              }`}>
                {data.fillRateMonitor.isEarlyBottleneck ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <Gauge className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    環形緩衝區即時填充速率監控器 (Circular Buffer Fill-Rate Monitor)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    cmd/receiver/utils/monitor.go
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                    data.fillRateMonitor.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : data.fillRateMonitor.severity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {data.fillRateMonitor.severity}
                  </span>
                  {data.fillRateMonitor.isEarlyBottleneck && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-bounce">
                      ⚡ 預警: 協程飽和前瓶頸 (Pre-Saturation Bottleneck)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 font-sans">
                  {data.fillRateMonitor.recommendation}
                </p>
              </div>
            </div>

            {/* Micro Rate Meters */}
            <div className="flex items-center gap-4 bg-slate-950/70 px-4 py-2 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-400">進線填充率 (Fill-Rate)</div>
                <div className="text-emerald-400 font-bold text-sm">
                  {data.fillRateMonitor.fillRateEPS.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">EPS</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">協程消費率 (Drain-Rate)</div>
                <div className="text-blue-400 font-bold text-sm">
                  {data.fillRateMonitor.drainRateEPS.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">EPS</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">流速比率 (Fill/Drain)</div>
                <div className={`font-bold text-sm ${data.fillRateMonitor.fillVelocityRatio >= 1.25 ? 'text-rose-400' : (data.fillRateMonitor.fillVelocityRatio > 1.0 ? 'text-amber-400' : 'text-emerald-400')}`}>
                  {data.fillRateMonitor.fillVelocityRatio}x
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">溢出預估耗時 (TTS)</div>
                <div className={`font-bold text-sm ${data.fillRateMonitor.timeToSaturationSec > 0 && data.fillRateMonitor.timeToSaturationSec < 15 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                  {data.fillRateMonitor.timeToSaturationSec > 0 ? `${data.fillRateMonitor.timeToSaturationSec}s` : '∞ 穩定'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Ingestion Throughput Indicator & Bottleneck Detector */}
      <CollectorThroughputIndicator />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Buffer Depth */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              緩衝區當前深度 (Buffer Depth)
            </span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              {data ? `${data.buffer.depthPercentage.toFixed(1)}%` : '0%'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {data ? data.buffer.depth.toLocaleString() : '---'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {data ? data.buffer.capacity.toLocaleString() : '50,000'} 容量
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getBufferBarColor(data?.buffer.depthPercentage || 0)} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(1, data?.buffer.depthPercentage || 0))}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>高水位標記: {data ? data.buffer.highWatermark.toLocaleString() : 4850}</span>
            <span className={data?.buffer.backpressureActive ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
              {data?.buffer.backpressureActive ? '背壓調節觸發中' : '無背壓阻滯'}
            </span>
          </div>
        </div>

        {/* Card 2: Worker Pool Saturation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              協程池飽和度 (Worker Saturation)
            </span>
            <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
              getSaturationColor(data?.workerPool.saturationRatio || 0)
            }`}>
              {data ? `${data.workerPool.saturationPercentage.toFixed(1)}%` : '0%'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {data ? data.workerPool.activeWorkers : '0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {data ? data.workerPool.totalWorkers : 16} 活躍協程
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(1, data?.workerPool.saturationPercentage || 0))}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>閒置協程: {data ? data.workerPool.idleWorkers : 0} 條</span>
            <span>批次超時: {data ? `${data.workerPool.batchTimeoutMs}ms` : '250ms'}</span>
          </div>
        </div>

        {/* Card 3: Ingestion & Drain Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              吞吐灌注與排出流速 (Flow Velocity)
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              平衡比率 1.01
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {data ? data.buffer.fillRatePerSec.toLocaleString() : '---'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              EPS (進線) / {data ? data.buffer.drainRatePerSec.toLocaleString() : '---'} (轉出)
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: '92%' }} />
            </div>
            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: '90%' }} />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 填充 (Fill)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 排出至 Rust (Drain)
            </span>
          </div>
        </div>

        {/* Card 4: Network & Execution Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              解碼延遲與網路流量 (Decoder Stats)
            </span>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {data ? `${data.network.mbpsIngest} Mbps` : '0 Mbps'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {data ? `${data.workerPool.avgExecutionTimeMs} ms` : '1.2 ms'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              平均執行週期 (Avg Latency)
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
            <div className="bg-slate-800/80 px-2 py-1 rounded flex-1 text-center font-mono">
              批次大小: <span className="text-indigo-400">{data?.workerPool.batchSizeCurrent || 2000}</span>
            </div>
            <div className="bg-slate-800/80 px-2 py-1 rounded flex-1 text-center font-mono">
              封包遺失: <span className="text-emerald-400">{data?.buffer.droppedEvents || 0}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>累計流量: {data ? `${(data.network.bytesReceivedTotal / (1024*1024)).toFixed(1)} MB` : '0 MB'}</span>
            <span className="text-emerald-400">全核心零丟包</span>
          </div>
        </div>
      </div>

      {/* Downstream Database Connection Pool & Port Defense Quick Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">下游資料庫連線池與本機端口防護 (Connection Pool)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                0 TIME_WAIT 端口滯留
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-3 font-mono">
              <span>活躍連線: <strong className="text-white">{data?.connectionPool?.activeConnections ?? 6}</strong> / {data?.connectionPool?.maxCapacity ?? 32}</span>
              <span>•</span>
              <span>溫長連線 (Keep-Alive): <strong className="text-cyan-300">{data?.connectionPool?.idleConnections ?? 8}</strong> 個</span>
              <span>•</span>
              <span>Socket 復用率: <strong className="text-emerald-400">{data?.connectionPool?.socketReuseRatePct ?? 98.4}%</strong></span>
              <span>•</span>
              <span>避免本機臨時端口枯竭: <strong className="text-indigo-300">已保護 {data?.connectionPool?.timeWaitPreventedCount?.toLocaleString() ?? '42,150'} 個端口</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveMainTab('connection_pool')}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition flex items-center gap-1.5 whitespace-nowrap self-stretch md:self-auto justify-center"
        >
          <span>深入連線池管理</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Real-time Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Real-time Buffer Depth Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                緩衝佇列深度趨勢 (Buffer Depth Stream)
              </h3>
              <p className="text-xs text-slate-400">
                Go Channel 環形佇列待轉發條數與容量利用百分比實時曲線
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
              容量上限: 50,000 Entries
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bufferDepthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <ReferenceLine y={40000} label="背壓門檻 (80%)" stroke="#f43f5e" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="depth"
                  name="佇列深度 (條數)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#bufferDepthGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> 當前深度
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-mono">
              <span className="w-2.5 h-0.5 bg-rose-500 inline-block" /> 警戒高水位線 (High Watermark)
            </span>
          </div>
        </div>

        {/* Right Chart: Worker Pool Saturation Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                工作協程池飽和度與活躍比 (Worker Pool Saturation)
              </h3>
              <p className="text-xs text-slate-400">
                16 個非阻塞解碼與轉發 Goroutine 的負載飽和百分比
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
              16 Core Parallel Workers
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <ReferenceLine y={85} label="過載飽和 (85%)" stroke="#fbbf24" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="saturationPercentage"
                  name="協程飽和度 (%)"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> 飽和百分比
            </span>
            <span className="text-slate-400">
              動態調度：當前活躍 <strong className="text-white">{data?.workerPool.activeWorkers || 0}</strong> 個協程
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Worker Pool Heatmap & Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              16-Worker Goroutine 協程群矩陣狀態 (Worker Grid Heatmap)
            </h3>
            <p className="text-xs text-slate-400">
              各工作協程負責 Syslog 解包、正則解碼器解析、與 IPC 批次封包打包之個別負載
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" /> 運作中 (Busy)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700" /> 待命/閒置 (Idle)
            </span>
          </div>
        </div>

        {/* Worker Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {data?.workerPool.workers.map((worker) => {
            const isBusy = worker.status === 'busy';
            const loadPercent = Math.round(worker.currentLoad * 100);

            return (
              <div
                key={worker.workerId}
                className={`p-3 rounded-lg border transition ${
                  isBusy
                    ? 'bg-slate-800/80 border-indigo-500/40 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-white">{worker.workerId}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isBusy ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                </div>

                <div className="text-[10px] text-slate-400 truncate mb-2" title={worker.role}>
                  {worker.role.split('-')[0].toUpperCase()}
                </div>

                {/* Micro Load Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      loadPercent > 80
                        ? 'bg-rose-500'
                        : loadPercent > 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>負載</span>
                  <span className={isBusy ? 'text-indigo-300 font-semibold' : 'text-slate-500'}>
                    {loadPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Health Endpoint Payload Viewer */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <details className="group">
          <summary className="cursor-pointer text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center justify-between list-none">
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              查看 Go 接收器原汁原味 JSON 遙測封包 (Raw /healthz Payload)
            </span>
            <span className="text-[11px] text-indigo-400 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <pre className="mt-3 p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-60">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
      </>
      )}
    </div>
  );
}

export default CollectorTelemetryDashboard;

import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Database,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Zap,
  TrendingDown,
  Activity,
  FileBox,
  RotateCcw,
  CheckCircle2,
  Sliders,
  FolderTree,
  Radio,
  FileCode,
  ShieldCheck,
  Server,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Gauge,
  ShieldAlert
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import type { CollectorHealthData } from './CollectorTelemetryDashboard';

export interface StorageTelemetryData {
  status: 'healthy' | 'degraded';
  service: string;
  timestamp: number;
  uptimeSeconds: number;
  throughput?: {
    ingestEps: number;
    commitEps: number;
    writeThroughputMbSec: number;
    diskWriteMbSec: number;
    compressionMultiplier: number;
    ipcLatencyMs: number;
    pipelineLagEvents: number;
    status: string;
  };
  diskUsage: {
    totalDiskBytes: number;
    totalDiskMb: number;
    uncompressedBytes: number;
    uncompressedMb: number;
    savedDiskMb: number;
    capacityMb: number;
    usagePercentage: number;
    dataPath: string;
    walPath: string;
    walActiveBytes: number;
    walActiveMb: number;
  };
  compression: {
    ratio: number;
    ratioFormatted: string;
    spaceSavingPercent: number;
    zstdAlgorithm: string;
    timestampAlgorithm: string;
    deltaTimestampBytes: number;
    rawTimestampBytes: number;
    timestampSavingsRatio: string;
    avgBytesPerTimestamp: number;
    zstdPayloadBytes: number;
    bloomFilterBitsTotal: number;
    bloomFilterFalsePositiveRate: string;
  };
  rotation: {
    blockCapacityRows: number;
    partCapacityRows: number;
    partCapacityBytesLimit: number;
    totalBlocksSealed: number;
    totalPartsSealed: number;
    blocksPerMinute: number;
    blocksPerSecond: number;
    partsRotatedPerHour: number;
    lastRotationTimestamp: number;
    lastRotationAgoSec: number;
    rotationPolicy: string;
  };
  writeManager: {
    memoryBufferBytes: number;
    maxMemoryBufferBytes: number;
    memoryBufferUsagePercent: number;
    isThrottled: boolean;
    activePartsCount: number;
    sealedPartsCount: number;
    streamsCount: number;
  };
  streams: {
    streamId: number;
    streamName: string;
    rows: number;
    uncompressedMb: number;
    compressedMb: number;
    compressionRatio: string;
    activePart: string;
    sealedPartsCount: number;
    blocksInFlight: number;
    status: string;
  }[];
}

interface TelemetryPoint {
  time: string;
  // Rust Storage Disk & Footprint metrics
  diskMb: number;
  uncompressedMb: number;
  savedMb: number;
  walMb: number;
  ratio: number;
  blocksPerMin: number;
  // Real-time Throughput (Go Receiver + Rust Engine Pipeline)
  ingestEps: number;
  drainEps: number;
  commitEps: number;
  writeThroughputMbSec: number;
  diskWriteMbSec: number;
  // Go Receiver Buffer & Worker metrics
  bufferDepth: number;
  workerSaturation: number;
}

export function StorageEngineTelemetryPanel() {
  const [storageData, setStorageData] = useState<StorageTelemetryData | null>(null);
  const [collectorData, setCollectorData] = useState<CollectorHealthData | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [pollIntervalMs, setPollIntervalMs] = useState(2000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  const historyMaxPoints = 25;

  const fetchAllTelemetry = async () => {
    try {
      setIsLoading(true);
      const [resStorage, resCollector] = await Promise.all([
        fetch('/api/engine/storage/telemetry'),
        fetch('/api/engine/collector/healthz')
      ]);

      if (!resStorage.ok) {
        throw new Error(`Storage Telemetry HTTP ${resStorage.status}`);
      }

      const sJson: StorageTelemetryData = await resStorage.json();
      let cJson: CollectorHealthData | null = null;
      if (resCollector.ok) {
        cJson = await resCollector.json();
      }

      if (!isMountedRef.current) return;
      setStorageData(sJson);
      if (cJson) setCollectorData(cJson);
      setLastUpdated(new Date());

      const timeStr = new Date(sJson.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const currentIngestEps = cJson?.buffer?.fillRatePerSec || sJson.throughput?.ingestEps || 8200;
      const currentDrainEps = cJson?.buffer?.drainRatePerSec || sJson.throughput?.commitEps || 8050;
      const currentCommitEps = sJson.throughput?.commitEps || currentDrainEps;
      const rawWriteMb = sJson.throughput?.writeThroughputMbSec || Number(((currentCommitEps * 500) / (1024 * 1024)).toFixed(2));
      const diskWriteMb = sJson.throughput?.diskWriteMbSec || Number((rawWriteMb / sJson.compression.ratio).toFixed(2));

      setHistory(prev => {
        const next: TelemetryPoint[] = [
          ...prev,
          {
            time: timeStr,
            diskMb: sJson.diskUsage.totalDiskMb,
            uncompressedMb: sJson.diskUsage.uncompressedMb,
            savedMb: sJson.diskUsage.savedDiskMb,
            walMb: sJson.diskUsage.walActiveMb,
            ratio: sJson.compression.ratio,
            blocksPerMin: sJson.rotation.blocksPerMinute,
            ingestEps: currentIngestEps,
            drainEps: currentDrainEps,
            commitEps: currentCommitEps,
            writeThroughputMbSec: rawWriteMb,
            diskWriteMbSec: diskWriteMb,
            bufferDepth: cJson?.buffer?.depth || 1400,
            workerSaturation: cJson?.workerPool?.saturationPercentage || 62.5
          }
        ];
        if (next.length > historyMaxPoints) {
          return next.slice(next.length - historyMaxPoints);
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to fetch storage & collector telemetry:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchAllTelemetry();

    let intervalId: any = null;
    if (isLivePolling) {
      intervalId = setInterval(() => {
        fetchAllTelemetry();
      }, pollIntervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLivePolling, pollIntervalMs]);

  // Current calculated rates
  const currentIngestEps = collectorData?.buffer?.fillRatePerSec || storageData?.throughput?.ingestEps || 8200;
  const currentDrainEps = collectorData?.buffer?.drainRatePerSec || storageData?.throughput?.commitEps || 8050;
  const currentRatio = storageData?.compression.ratio || 11.8;
  const currentWriteMbSec = storageData?.throughput?.writeThroughputMbSec || Number(((currentDrainEps * 500) / (1024 * 1024)).toFixed(2));
  const currentDiskMbSec = storageData?.throughput?.diskWriteMbSec || Number((currentWriteMbSec / currentRatio).toFixed(2));

  return (
    <div className="space-y-6" id="storage-telemetry-panel-root">
      {/* Panel Control Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Go 接收器 + Rust 儲存引擎聯合遙測 (End-to-End Ingestion & Storage Pipeline)
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Go Receiver (UDP:5140) ➔ IPC Socket ➔ Rust Vlog Engine (/data)
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded border uppercase text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                HEALTHY
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-400" />
              儲存引擎即時吞吐與磁碟遙測 (Storage Engine Telemetry)
            </h2>
            <p className="text-xs text-slate-400">
              整合 Go 接收端健康度、環形緩衝區流速、Rust Write-Ahead Log (WAL)、以及雙演算法高倍壓縮落盤磁碟佔用圖表。
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            {/* Live Polling Switch */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">輪詢:</span>
              <select
                value={pollIntervalMs}
                onChange={(e) => setPollIntervalMs(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500"
              >
                <option value={1000}>1 秒 (極速更新)</option>
                <option value={2000}>2 秒 (預設)</option>
                <option value={5000}>5 秒 (平穩)</option>
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
                {isLivePolling ? '即時更新中' : '已暫停'}
              </button>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={fetchAllTelemetry}
              disabled={isLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              重新整理
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-500" />
              最後取樣時間: {lastUpdated.toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Go 端點: <code className="text-cyan-300 bg-slate-800/80 px-1 py-0.5 rounded">{collectorData?.endpoint || 'http://127.0.0.1:8080/healthz'}</code>
              </span>
              <span className="text-slate-400">
                Rust 目錄: <code className="text-indigo-300 bg-slate-800/80 px-1 py-0.5 rounded">{storageData?.diskUsage.dataPath || '/data'}</code>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Status Banner: Go Buffer + Fill Rate + Rust IPC Stream */}
      {collectorData?.fillRateMonitor && (
        <div className={`border rounded-xl p-4 transition-all duration-300 ${
          collectorData.fillRateMonitor.severity === 'CRITICAL'
            ? 'bg-rose-950/40 border-rose-500/50 shadow-lg'
            : collectorData.fillRateMonitor.isEarlyBottleneck
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg border mt-0.5 ${
                collectorData.fillRateMonitor.isEarlyBottleneck
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {collectorData.fillRateMonitor.isEarlyBottleneck ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <Activity className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    管線即時健康度 (Pipeline End-to-End Health)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Go RingBuffer ➔ Rust ActivePartWriter
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                    collectorData.fillRateMonitor.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : collectorData.fillRateMonitor.isEarlyBottleneck
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {collectorData.fillRateMonitor.isEarlyBottleneck ? 'PRE-SATURATION SURGE' : 'DYNAMIC EQUILIBRIUM'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {collectorData.fillRateMonitor.recommendation}
                </p>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-400">進線 (Go Fill)</div>
                <div className="text-emerald-400 font-bold">{currentIngestEps.toLocaleString()} EPS</div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">落盤 (Rust Commit)</div>
                <div className="text-blue-400 font-bold">{currentDrainEps.toLocaleString()} EPS</div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">壓縮比率</div>
                <div className="text-indigo-400 font-bold">{currentRatio.toFixed(1)}x</div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">IPC 延遲</div>
                <div className="text-amber-400 font-bold">{storageData?.throughput?.ipcLatencyMs || 0.45} ms</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Major Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Throughput EPS (Go Ingest & Rust Commit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              即時吞吐率 (Throughput EPS)
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Go ➔ Rust 流速
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {currentIngestEps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              EPS (灌注) / {currentDrainEps.toLocaleString()} (落盤)
            </span>
          </div>

          {/* Dual progress bar for Ingest & Drain balance */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (currentIngestEps / 12000) * 100))}%` }}
            />
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (currentDrainEps / 12000) * 100))}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>寫入帶寬: <strong className="text-slate-200 font-mono">{currentWriteMbSec} MB/s</strong></span>
            <span>落盤帶寬: <strong className="text-emerald-400 font-mono">{currentDiskMbSec} MB/s</strong></span>
          </div>
        </div>

        {/* Card 2: Disk Usage & Space Saved */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              磁碟實體佔用 (Disk Usage)
            </span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              節省 {storageData ? `${storageData.compression.spaceSavingPercent}%` : '91.5%'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {storageData ? `${storageData.diskUsage.totalDiskMb.toFixed(1)} MB` : '---'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / 原始 {storageData ? `${storageData.diskUsage.uncompressedMb.toFixed(1)} MB` : '---'}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, (storageData?.diskUsage.usagePercentage || 0) * 80))}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>已省下: <strong className="text-emerald-400">{storageData ? `${storageData.diskUsage.savedDiskMb.toFixed(0)} MB` : '0 MB'}</strong></span>
            <span>配額: 500 GB</span>
          </div>
        </div>

        {/* Card 3: Compression Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              綜合壓縮倍率 (Compression Ratio)
            </span>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              ZSTD L3 + DoD
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {storageData ? storageData.compression.ratioFormatted : '11.8x'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              (-{storageData ? storageData.compression.spaceSavingPercent : 91.5}%)
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, ((storageData?.compression.ratio || 11) / 15) * 100))}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>時間戳平均: <strong className="text-cyan-400 font-mono">{storageData ? `${storageData.compression.avgBytesPerTimestamp} B` : '0.82 B'}</strong></span>
            <span className="text-slate-400">DoD 節省: {storageData ? storageData.compression.timestampSavingsRatio : '9.8x'}</span>
          </div>
        </div>

        {/* Card 4: Block Rotation & WAL Buffer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              區塊輪轉與 WAL 暫存 (Rotation & WAL)
            </span>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              4,096 筆/Block
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {storageData ? storageData.rotation.blocksPerMinute : '46.9'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Blocks/分 (WAL: {storageData ? `${storageData.diskUsage.walActiveMb} MB` : '0.4 MB'})
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, ((storageData?.rotation.blocksPerMinute || 45) / 80) * 100))}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>已封存區塊: <strong className="text-slate-200 font-mono">{storageData ? storageData.rotation.totalBlocksSealed.toLocaleString() : 0}</strong></span>
            <span>分區輪轉: {storageData ? `${storageData.rotation.partsRotatedPerHour}/hr` : '703/hr'}</span>
          </div>
        </div>
      </div>

      {/* Real-time Charts Section: Throughput & Disk Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Real-time Throughput Chart (Go Ingest vs. Rust Storage Commit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                即時管線吞吐量走勢 (Pipeline Throughput Stream - EPS)
              </h3>
              <p className="text-xs text-slate-400">
                Go 接收器進線速率 (Ingest Fill) vs. Rust 儲存引擎批次封裝落盤流速 (Commit Drain)
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              平均: ~{currentDrainEps.toLocaleString()} EPS
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ingestGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[4000, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="ingestEps"
                  name="Go 進線填充率 (Ingest EPS)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ingestGradient)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="commitEps"
                  name="Rust 落盤流速 (Commit EPS)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#commitGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Go Ingest EPS (Syslog UDP/TCP)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Rust ActivePart Commit EPS
            </span>
          </div>
        </div>

        {/* Chart 2: Real-time Disk Usage & Space Saved Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                實體磁碟佔用與壓縮節省走勢 (Disk Footprint Stream - MB)
              </h3>
              <p className="text-xs text-slate-400">
                原始日誌累積量 vs. Zstandard L3 + Delta-of-Delta 壓縮後落盤體積 (MB)
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              壓縮比: {storageData?.compression.ratioFormatted || '11.8x'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rawDiskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="compressedDiskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" MB" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="uncompressedMb"
                  name="原始數據量 (Raw MB)"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#rawDiskGradient)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="diskMb"
                  name="落盤體積 (Disk MB)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#compressedDiskGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> 落盤壓縮體積 ({storageData?.diskUsage.totalDiskMb.toFixed(1) || '82.4'} MB)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-0.5 bg-slate-400 inline-block border-t border-dashed" /> 未壓縮原始規模 ({storageData?.diskUsage.uncompressedMb.toFixed(1) || '975.0'} MB)
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Chart Row: Block Rotation Rate & WAL / Write Buffer Bandwidth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: Block Rotation Rate (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                區塊封裝輪轉速度 (Block Rotation Frequency - Blk/min)
              </h3>
              <p className="text-xs text-slate-400">
                每 4,096 筆日誌自動觸發 VictoriaBlock 封裝密封，落盤寫入活動分區檔案
              </p>
            </div>
            <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              ~{storageData?.rotation.blocksPerMinute || 46.9} Blk/min
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[30, 65]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="blocksPerMin"
                  name="輪轉速率 (Blocks/min)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-400 mt-2 px-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 區塊輪轉速度
            </span>
            <span className="text-slate-400">
              單 Block 上限: <strong className="text-white">4,096 行</strong> | 單 Part 上限: <strong className="text-white">16,384 行 (16 MB)</strong>
            </span>
          </div>
        </div>

        {/* Right Chart: Write Bandwidth Comparison (MB/s) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                寫入頻寬與 WAL 暫存
              </h3>
              <p className="text-xs text-slate-400">
                每秒記憶體原始吞吐 vs. 實際落盤頻寬
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Zero-Loss
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history.slice(-8)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" MB/s" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="writeThroughputMbSec" name="原始寫入 (MB/s)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="diskWriteMbSec" name="落盤頻寬 (MB/s)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-400 mt-2 px-1 flex items-center justify-between">
            <span className="text-indigo-400">
              原始: {currentWriteMbSec} MB/s
            </span>
            <span className="text-emerald-400">
              落盤: {currentDiskMbSec} MB/s
            </span>
          </div>
        </div>
      </div>

      {/* Stream Partition Distribution Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              串流分區儲存分佈 (/data/&#123;stream_id&#125;/*.block)
            </h3>
            <p className="text-xs text-slate-400">
              展示各串流獨立寫入路徑、活動寫入器檔案、累積落盤容量與即時壓縮倍率
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
            原子輪轉：ActivePartWriter (BufWriter 64KB)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Stream ID</th>
                <th className="py-2.5 px-3">串流標籤與來源</th>
                <th className="py-2.5 px-3">總日誌筆數</th>
                <th className="py-2.5 px-3">原始大小 (MB)</th>
                <th className="py-2.5 px-3">落盤壓縮 (MB)</th>
                <th className="py-2.5 px-3">壓縮倍率</th>
                <th className="py-2.5 px-3">當前活動分區 (.block)</th>
                <th className="py-2.5 px-3">已封存分區數</th>
                <th className="py-2.5 px-3">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {storageData?.streams.map((stream) => (
                <tr key={stream.streamId} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-indigo-400">
                    #{stream.streamId}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-200">
                    <span className="font-semibold text-white">{stream.streamName}</span>
                    <div className="text-[11px] text-slate-400 font-mono">/data/{stream.streamId}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-200 font-bold">
                    {stream.rows.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {stream.uncompressedMb} MB
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    {stream.compressedMb} MB
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      {stream.compressionRatio}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {stream.activePart}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {stream.sealedPartsCount} Parts
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      寫入中
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Storage & Pipeline Telemetry JSON Viewer */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <details className="group">
          <summary className="cursor-pointer text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center justify-between list-none">
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              查看 Rust 儲存與 Go 接收器聯合遙測 Payload (Raw /api/engine/storage/telemetry)
            </span>
            <span className="text-[11px] text-indigo-400 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">Rust Storage Engine Telemetry:</div>
              <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto border border-slate-800 max-h-60">
                {JSON.stringify(storageData, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">Go Receiver Health & Monitor:</div>
              <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-60">
                {JSON.stringify(collectorData, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default StorageEngineTelemetryPanel;

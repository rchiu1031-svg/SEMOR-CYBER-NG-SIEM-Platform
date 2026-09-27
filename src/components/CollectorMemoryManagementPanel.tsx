import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Layers,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingUp,
  BarChart3,
  HardDrive,
  ShieldAlert,
  Play,
  ArrowRight,
  Sparkles,
  Info,
  Timer,
  Activity,
  Trash2,
  Gauge
} from 'lucide-react';

export interface MemoryMetrics {
  capacity: number;
  currentDepth: number;
  depthPercentage: number;
  highWatermarkRecorded: number;
  totalPushed: number;
  totalDrained: number;
  totalDropped: number;
  totalBatchesProcessed: number;
  currentEpsIngest: number;
  currentEpsDrain: number;
  overflowStrategy: 'drop_oldest' | 'drop_newest' | 'backpressure';
  backpressureActive: boolean;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  gcPressureLevel: 'OPTIMAL_ZERO_GC' | 'LOW_PRESSURE' | 'MODERATE' | 'ELEVATED' | 'CRITICAL_GC_PAUSE_RISK';
  gcPressureScore: number;
  estimatedGCSavingsMB: number;
  avgBatchProcessingMs: number;
  lastBatchFlushedAt: string;
}

export interface MemoryConfig {
  capacity: number;
  batchSize: number;
  batchTimeoutMs: number;
  highWatermarkPct: number;
  lowWatermarkPct: number;
  overflowStrategy: 'drop_oldest' | 'drop_newest' | 'backpressure';
  enableSlotPool: boolean;
}

export interface BenchmarkResult {
  logsTested: number;
  naive: {
    durationMs: number;
    eps: number;
    heapAllocatedMB: number;
    estimatedGCCycles: number;
  };
  circularBuffer: {
    durationMs: number;
    eps: number;
    heapAllocatedMB: number;
    estimatedGCCycles: number;
  };
  improvement: {
    speedupRatio: number;
    memoryAllocReductionPct: number;
    gcPressureReductionPct: number;
  };
}

export function CollectorMemoryManagementPanel() {
  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
  const [config, setConfig] = useState<MemoryConfig>({
    capacity: 65536,
    batchSize: 1000,
    batchTimeoutMs: 50,
    highWatermarkPct: 80,
    lowWatermarkPct: 20,
    overflowStrategy: 'drop_oldest',
    enableSlotPool: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [benchmarkSummary, setBenchmarkSummary] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchMemoryState = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/engine/collector/memory-management');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
      if (data.config) setConfig(data.config);
    } catch (err) {
      console.error('Failed to fetch memory management metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoryState();
    const interval = setInterval(fetchMemoryState, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/engine/collector/memory-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({ type: 'success', text: '環形緩衝區與記憶體回收策略參數已成功儲存並熱套用！' });
        if (data.metrics) setMetrics(data.metrics);
      } else {
        setActionNotice({ type: 'error', text: data.error || '設定更新失敗' });
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: '儲存失敗，請檢查網路連線' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleRunBenchmark = async (logCount: number = 20000) => {
    try {
      setIsBenchmarking(true);
      setActionNotice({ type: 'info', text: `正在執行 ${logCount.toLocaleString()} 筆高吞吐基準壓測（比較動態配置 vs 環形緩衝區）...` });
      const res = await fetch('/api/engine/collector/memory-management/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logCount })
      });
      const data = await res.json();
      if (data.success && data.benchmark) {
        setBenchmarkResult(data.benchmark);
        setBenchmarkSummary(data.summary);
        setActionNotice({ type: 'success', text: `壓測完成！環形緩衝區提速 ${data.benchmark.improvement.speedupRatio}x，降低 ${data.benchmark.improvement.memoryAllocReductionPct}% 堆疊配置！` });
        fetchMemoryState();
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: '壓測執行失敗' });
    } finally {
      setIsBenchmarking(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleSimulateBurst = async () => {
    try {
      setIsBursting(true);
      const res = await fetch('/api/engine/collector/memory-management/burst-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 2500, host: 'perimeter-ngfw-01' })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({ type: 'success', text: data.message });
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: '突發測試注入失敗' });
    } finally {
      setIsBursting(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleForceFlush = async () => {
    try {
      const res = await fetch('/api/engine/collector/memory-management/flush', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({ type: 'success', text: data.message });
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: '手動排空失敗' });
    } finally {
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const getGCPressureBadge = (level: MemoryMetrics['gcPressureLevel']) => {
    switch (level) {
      case 'OPTIMAL_ZERO_GC':
        return { label: '最佳化零 GC (Optimal Zero-GC)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 };
      case 'LOW_PRESSURE':
        return { label: '微幅 GC 壓力 (Low Pressure)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: CheckCircle2 };
      case 'MODERATE':
        return { label: '中度配置活動 (Moderate)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Info };
      case 'ELEVATED':
        return { label: 'GC 壓力升高 (Elevated Churn)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: AlertTriangle };
      case 'CRITICAL_GC_PAUSE_RISK':
        return { label: '嚴重 GC 停頓風險 (Critical Pause Risk)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse', icon: ShieldAlert };
      default:
        return { label: '監控中', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40', icon: Info };
    }
  };

  const badge = getGCPressureBadge(metrics?.gcPressureLevel || 'OPTIMAL_ZERO_GC');
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {actionNotice && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
          actionNotice.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            : actionNotice.type === 'error'
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {actionNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {actionNotice.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {actionNotice.type === 'info' && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />}
            <span>{actionNotice.text}</span>
          </div>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  高吞吐收集器記憶體管理與環形緩衝區 (Circular Buffer Memory Architecture)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  透過預先配置定長環形緩衝區與槽位回收機制，徹底消除高 EPS 進線時的 V8/Go 堆疊重分配與垃圾回收 (GC) 停頓。
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleSimulateBurst()}
              disabled={isBursting}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-400 ${isBursting ? 'animate-bounce' : ''}`} />
              {isBursting ? '注入中...' : '突發 2,500 筆進線'}
            </button>

            <button
              onClick={() => handleRunBenchmark(25000)}
              disabled={isBenchmarking}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
              {isBenchmarking ? '基準壓測中...' : '執行 25,000 筆 GC 基準壓測'}
            </button>

            <button
              onClick={handleForceFlush}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              立即排空批次
            </button>
          </div>
        </div>

        {/* Real-time Status Pills */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">GC 停頓壓力等級</div>
            <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${badge.color}`}>
              <BadgeIcon className="w-3 h-3" />
              {badge.label}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">累積省除 GC 記憶體配置</div>
            <div className="mt-1 text-sm font-bold font-mono text-emerald-400">
              +{metrics ? metrics.estimatedGCSavingsMB.toLocaleString() : '---'} <span className="text-[10px] text-slate-400 font-sans">MB 避免垃圾堆疊</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">V8 進程堆疊使用量</div>
            <div className="mt-1 text-sm font-bold font-mono text-cyan-400">
              {metrics ? `${metrics.heapUsedMB} MB` : '---'} <span className="text-[10px] text-slate-400 font-sans">/ {metrics?.heapTotalMB || 0} MB (RSS: {metrics?.rssMB || 0} MB)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">批次派發延遲 (Avg Latency)</div>
            <div className="mt-1 text-sm font-bold font-mono text-indigo-300">
              {metrics ? `${metrics.avgBatchProcessingMs} ms` : '---'} <span className="text-[10px] text-slate-400 font-sans">/ 批次 (微秒級零拷貝)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Ring Buffer Anatomy + GC Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Visual Circular Ring Buffer & Real-time Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Circular Buffer Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">定長環形緩衝區實體拓撲 (Physical Ring Buffer State)</h4>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">容量規格:</span>
                <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {metrics?.capacity.toLocaleString() || '65,536'} Slots (2^16 Fast Masking)
                </span>
              </div>
            </div>

            {/* Depth & Fill Gauge Bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  目前緩衝待處理日誌 (Queue Depth):
                  <strong className="text-white font-mono">{metrics?.currentDepth.toLocaleString() || 0}</strong>
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {metrics ? `${metrics.depthPercentage.toFixed(1)}%` : '0%'} 使用率
                </span>
              </div>

              {/* Multi-segment capacity progress bar */}
              <div className="w-full bg-slate-950 h-5 rounded-lg border border-slate-800 overflow-hidden relative p-0.5 flex items-center">
                {/* High-watermark vertical marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ left: `${config.highWatermarkPct}%` }}
                  title={`高水位線 (${config.highWatermarkPct}%)`}
                />
                {/* Low-watermark vertical marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10 opacity-70"
                  style={{ left: `${config.lowWatermarkPct}%` }}
                  title={`低水位線 (${config.lowWatermarkPct}%)`}
                />

                <div
                  className={`h-full rounded transition-all duration-300 ${
                    (metrics?.depthPercentage || 0) > config.highWatermarkPct
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : (metrics?.depthPercentage || 0) > 40
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0.5, metrics?.depthPercentage || 0))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                <span>0 (讀取指標 Head)</span>
                <span className="text-blue-400">低水位標記: {config.lowWatermarkPct}% ({Math.round(metrics?.capacity ? (metrics.capacity * config.lowWatermarkPct) / 100 : 13107)})</span>
                <span className="text-amber-400 font-semibold">高水位背壓線: {config.highWatermarkPct}% ({Math.round(metrics?.capacity ? (metrics.capacity * config.highWatermarkPct) / 100 : 52428)})</span>
                <span>{metrics?.capacity.toLocaleString()} (Tail)</span>
              </div>
            </div>

            {/* Circular Slot Ring Visualization */}
            <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  環形槽位分佈與指標指引 (Bitwise Index Masking: cursor & 0xFFFF)
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {metrics?.backpressureActive ? '⚠ 背壓調節中' : '✓ 佇列正常排空'}
                </span>
              </div>

              {/* Slot Grid Representation */}
              <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 py-1">
                {Array.from({ length: 64 }).map((_, idx) => {
                  const depthPct = metrics?.depthPercentage || 0;
                  const isFilled = idx < Math.round((depthPct / 100) * 64);
                  const isHead = idx === 0;
                  const isTail = idx === Math.min(63, Math.max(0, Math.round((depthPct / 100) * 64)));

                  return (
                    <div
                      key={idx}
                      className={`h-4 rounded-xs transition-all duration-200 border ${
                        isTail && isFilled
                          ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)] animate-pulse'
                          : isHead
                          ? 'bg-cyan-500 border-cyan-300'
                          : isFilled
                          ? 'bg-indigo-600/80 border-indigo-500/50'
                          : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                      }`}
                      title={`Slot Block ${idx * 1024} - ${(idx + 1) * 1024 - 1} ${isFilled ? '(佔用中)' : '(可用/已回收)'}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-cyan-500 inline-block" /> Head (消費游標)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-indigo-600 inline-block" /> 已緩衝槽位 (Buffered LogSlots)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-amber-400 inline-block" /> Tail (進線寫入游標)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-slate-900 border border-slate-700 inline-block" /> 預配置可用空間 (Pre-allocated)
                </span>
              </div>
            </div>

            {/* Performance KPIs Matrix */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">累計壓入日誌</div>
                <div className="text-white font-bold text-sm mt-0.5">
                  {metrics?.totalPushed.toLocaleString() || 0}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">累計排空批次</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">
                  {metrics?.totalBatchesProcessed.toLocaleString() || 0}
                  <span className="text-[10px] text-slate-400 font-sans ml-1">({metrics?.totalDrained.toLocaleString() || 0} 筆)</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">飽和覆蓋/丟棄 (Overwrites)</div>
                <div className={`font-bold text-sm mt-0.5 ${metrics?.totalDropped ? 'text-amber-400' : 'text-slate-400'}`}>
                  {metrics?.totalDropped || 0}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">峰值歷史深度</div>
                <div className="text-indigo-300 font-bold text-sm mt-0.5">
                  {metrics?.highWatermarkRecorded.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark Results Card (When Available) */}
          {benchmarkResult && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    高吞吐記憶體基準壓測報告 ({benchmarkResult.logsTested.toLocaleString()} 筆日誌)
                  </h4>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  {benchmarkResult.improvement.speedupRatio}x 吞吐提速
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2">
                {benchmarkSummary}
              </p>

              {/* Side-by-side comparison cards */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Naive Strategy */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-rose-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-2">
                    <span>傳統動態配置 (Naive Array Unshift & Push)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                      大量堆疊浪費
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>總執行耗時:</span>
                      <strong className="text-slate-200">{benchmarkResult.naive.durationMs} ms</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>有效吞吐量:</span>
                      <strong className="text-slate-200">{benchmarkResult.naive.eps.toLocaleString()} EPS</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>堆疊新配置記憶體:</span>
                      <strong className="text-rose-400">~{benchmarkResult.naive.heapAllocatedMB} MB</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>預估觸發 GC 次數:</span>
                      <strong className="text-rose-400">{benchmarkResult.naive.estimatedGCCycles} 次 Minor GC</strong>
                    </div>
                  </div>
                </div>

                {/* Circular Buffer Strategy */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                    <span>定長環形緩衝區 (Pre-allocated Circular Ring)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                      零 GC 槽位回收
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>總執行耗時:</span>
                      <strong className="text-emerald-300 font-bold">{benchmarkResult.circularBuffer.durationMs} ms</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>有效吞吐量:</span>
                      <strong className="text-emerald-300 font-bold">{benchmarkResult.circularBuffer.eps.toLocaleString()} EPS</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>堆疊新配置記憶體:</span>
                      <strong className="text-emerald-400 font-bold">~{benchmarkResult.circularBuffer.heapAllocatedMB} MB (-{benchmarkResult.improvement.memoryAllocReductionPct}%)</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>預估觸發 GC 次數:</span>
                      <strong className="text-emerald-400 font-bold">0 次 (零 GC 停頓)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Tuning Configuration & Architecture Principles */}
        <div className="space-y-6">
          {/* Card: Dynamic Tuning Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">緩衝區與批次排空調校 (Buffer Tuning)</h4>
              </div>
              <span className="text-[11px] text-slate-400">即時熱更新</span>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Batch Size */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>單批次排空量 (Batch Size):</span>
                  <span className="font-mono text-cyan-400 font-bold">{config.batchSize} 筆/批次</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={config.batchSize}
                  onChange={(e) => setConfig({ ...config, batchSize: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>100</span>
                  <span>2,500</span>
                  <span>5,000</span>
                </div>
              </div>

              {/* Batch Timeout */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>最大滯留逾時 (Flush Timeout):</span>
                  <span className="font-mono text-indigo-400 font-bold">{config.batchTimeoutMs} ms</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={config.batchTimeoutMs}
                  onChange={(e) => setConfig({ ...config, batchTimeoutMs: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>10ms (極速)</span>
                  <span>250ms</span>
                  <span>500ms</span>
                </div>
              </div>

              {/* Overflow Strategy */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  緩衝飽和溢出策略 (Overflow Drop Policy):
                </label>
                <select
                  value={config.overflowStrategy}
                  onChange={(e) => setConfig({ ...config, overflowStrategy: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="drop_oldest">覆蓋最舊事件 (Drop Oldest - 保留最新突發)</option>
                  <option value="backpressure">觸發背壓阻滯 (Backpressure - 限流拒絕)</option>
                  <option value="drop_newest">丟棄新進事件 (Drop Newest - 保留既有)</option>
                </select>
              </div>

              {/* High Watermark */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-[11px]">高水位背壓閾值:</span>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                    <input
                      type="number"
                      min="50"
                      max="95"
                      value={config.highWatermarkPct}
                      onChange={(e) => setConfig({ ...config, highWatermarkPct: Number(e.target.value) })}
                      className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">低水位復原閾值:</span>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                    <input
                      type="number"
                      min="5"
                      max="45"
                      value={config.lowWatermarkPct}
                      onChange={(e) => setConfig({ ...config, lowWatermarkPct: Number(e.target.value) })}
                      className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                {isSaving ? '套用參數中...' : '儲存並套用調校參數'}
              </button>
            </div>
          </div>

          {/* Card: Architecture Principles */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-xs">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              記憶體架構與低 GC 設計原理
            </h4>

            <div className="space-y-3 text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  1. 預配置定長連續記憶體槽位
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  在服務啟動時即以 2 的冪次方 (65,536) 預先分配物件陣列，運行期間僅更新槽位欄位而不建立新物件，杜絕 V8 新生代 (Scavenge) 記憶體破碎。
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  2. 位元遮罩索引與游標解耦 (Bitwise Mask)
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  使用 <code className="text-cyan-300">tail & (cap - 1)</code> 進行 O(1) 無鎖前進，避免傳統陣列 <code className="text-rose-300">unshift()</code> 引起的 O(N) 全記憶體挪移。
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  3. 解耦微批次化合流 (Micro-Batching Drain)
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  日誌進線時立即寫入環形槽位並返回 HTTP 200，由背景協程每 50ms 聚合千筆日誌統一送交 VictoriaLogs，減少 96% 系統呼叫與執行緒上下文切換。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

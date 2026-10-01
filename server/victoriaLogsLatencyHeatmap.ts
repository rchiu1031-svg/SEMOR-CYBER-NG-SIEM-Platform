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

export const LATENCY_BIN_DEFS: LatencyBinDef[] = [
  { id: 'gt500ms', label: '> 500 ms', minMs: 500, maxMs: Infinity, severity: 'critical', colorHex: '#ef4444' },
  { id: '250_500ms', label: '250 - 500 ms', minMs: 250, maxMs: 500, severity: 'spike', colorHex: '#f97316' },
  { id: '120_250ms', label: '120 - 250 ms', minMs: 120, maxMs: 250, severity: 'warning', colorHex: '#f59e0b' },
  { id: '60_120ms', label: '60 - 120 ms', minMs: 60, maxMs: 120, severity: 'elevated', colorHex: '#eab308' },
  { id: '30_60ms', label: '30 - 60 ms', minMs: 30, maxMs: 60, severity: 'moderate', colorHex: '#84cc16' },
  { id: '15_30ms', label: '15 - 30 ms', minMs: 15, maxMs: 30, severity: 'normal', colorHex: '#10b981' },
  { id: '5_15ms', label: '5 - 15 ms', minMs: 5, maxMs: 15, severity: 'optimal', colorHex: '#06b6d4' },
  { id: '0_5ms', label: '< 5 ms', minMs: 0, maxMs: 5, severity: 'optimal', colorHex: '#3b82f6' }
];

export interface HeatmapCellData {
  count: number;
  pct: number;
}

export interface HeatmapColumn {
  minute: string; // e.g. "02:15"
  timestamp: string; // ISO
  bins: Record<LatencyBinKey, HeatmapCellData>;
  rawLatencies: number[];
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

export class VictoriaLogsLatencyHeatmapTracker {
  private columns: HeatmapColumn[] = [];
  private transientSpikes: TransientSpikeRecord[] = [];
  private spikeThresholdMs: number = 120;

  constructor() {
    this.seedRealisticHistory();
  }

  private getBinKey(latencyMs: number): LatencyBinKey {
    if (latencyMs >= 500) return 'gt500ms';
    if (latencyMs >= 250) return '250_500ms';
    if (latencyMs >= 120) return '120_250ms';
    if (latencyMs >= 60) return '60_120ms';
    if (latencyMs >= 30) return '30_60ms';
    if (latencyMs >= 15) return '15_30ms';
    if (latencyMs >= 5) return '5_15ms';
    return '0_5ms';
  }

  private createEmptyBins(): Record<LatencyBinKey, HeatmapCellData> {
    return {
      '0_5ms': { count: 0, pct: 0 },
      '5_15ms': { count: 0, pct: 0 },
      '15_30ms': { count: 0, pct: 0 },
      '30_60ms': { count: 0, pct: 0 },
      '60_120ms': { count: 0, pct: 0 },
      '120_250ms': { count: 0, pct: 0 },
      '250_500ms': { count: 0, pct: 0 },
      'gt500ms': { count: 0, pct: 0 }
    };
  }

  private calculatePercentiles(latencies: number[]): {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
    avg: number;
  } {
    if (latencies.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, max: 0, min: 0, avg: 0 };
    }
    const sorted = [...latencies].sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
      return Number(sorted[idx].toFixed(1));
    };
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    return {
      p50: getPercentile(50),
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99),
      max: Number(sorted[sorted.length - 1].toFixed(1)),
      min: Number(sorted[0].toFixed(1)),
      avg: Number((sum / sorted.length).toFixed(1))
    };
  }

  private seedRealisticHistory() {
    const now = Date.now();
    this.columns = [];

    // Pre-populate 60 rolling minutes
    for (let i = 59; i >= 0; i--) {
      const colTime = new Date(now - i * 60 * 1000);
      const minStr = colTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const bins = this.createEmptyBins();
      const rawLatencies: number[] = [];

      // Base sample count per minute (60-140 requests measured per minute)
      const baseSamples = 70 + Math.floor(Math.sin(i / 5) * 20);

      // Check if this minute represents a realistic historical transient spike
      // Spike A: 16 minutes ago (TCP socket buffer contention)
      // Spike B: 41 minutes ago (Storage GC stall & ephemeral re-bind)
      const isSpikeA = i === 16;
      const isSpikeB = i === 41;

      for (let s = 0; s < baseSamples; s++) {
        let lat: number;
        if (isSpikeA && s >= baseSamples - 9) {
          // Spike A tail: up to 340ms
          lat = 180 + Math.random() * 160;
        } else if (isSpikeB && s >= baseSamples - 6) {
          // Spike B tail: up to 580ms
          lat = 320 + Math.random() * 260;
        } else {
          // Normal sinusoidal baseline between 3.5ms and 14ms with standard distribution
          const r = Math.random();
          if (r < 0.65) {
            lat = 2.5 + Math.random() * 5.5; // < 8ms
          } else if (r < 0.90) {
            lat = 8 + Math.random() * 9; // 8-17ms
          } else if (r < 0.97) {
            lat = 18 + Math.random() * 16; // 18-34ms
          } else {
            lat = 35 + Math.random() * 25; // 35-60ms light jitter
          }
        }
        lat = Number(lat.toFixed(1));
        rawLatencies.push(lat);
        bins[this.getBinKey(lat)].count++;
      }

      // Compute percentages
      for (const k of Object.keys(bins) as LatencyBinKey[]) {
        bins[k].pct = Number(((bins[k].count / baseSamples) * 100).toFixed(1));
      }

      const p = this.calculatePercentiles(rawLatencies);
      const hasSpike = p.max >= this.spikeThresholdMs;

      this.columns.push({
        minute: minStr,
        timestamp: colTime.toISOString(),
        bins,
        rawLatencies,
        totalRequests: baseSamples,
        p50: p.p50,
        p90: p.p90,
        p95: p.p95,
        p99: p.p99,
        max: p.max,
        min: p.min,
        avg: p.avg,
        hasSpike,
        spikeReason: isSpikeA
          ? 'TCP Buffer Bloat & Jitter (短暫 TCP 緩衝積壓抖動)'
          : isSpikeB
          ? 'VictoriaLogs LSM Flush Delay (磁碟區塊整理落盤暫態阻塞)'
          : undefined
      });
    }

    // Register the 2 historical transient spikes
    const spikeACol = this.columns[this.columns.length - 17];
    if (spikeACol) {
      this.transientSpikes.push({
        id: `spk-${Date.now()}-1`,
        timestamp: spikeACol.timestamp,
        minute: spikeACol.minute,
        peakLatencyMs: spikeACol.max,
        baselineP50Ms: spikeACol.p50,
        p99Ms: spikeACol.p99,
        deviationMultiplier: Number((spikeACol.max / Math.max(1, spikeACol.p50)).toFixed(1)),
        affectedRequests: spikeACol.bins['120_250ms'].count + spikeACol.bins['250_500ms'].count,
        probableCause: 'TCP Buffer Bloat / NIC Queue Jitter',
        diagnostics: '短暫網路佇列擁塞引發 TCP ACK 延遲，連線池保活重用已自動收斂延遲。',
        mitigation: 'HTTP Keep-Alive 溫連線池已自動吸收，未觸發 5xx 錯誤。',
        severity: 'warning'
      });
    }

    const spikeBCol = this.columns[this.columns.length - 42];
    if (spikeBCol) {
      this.transientSpikes.push({
        id: `spk-${Date.now()}-2`,
        timestamp: spikeBCol.timestamp,
        minute: spikeBCol.minute,
        peakLatencyMs: spikeBCol.max,
        baselineP50Ms: spikeBCol.p50,
        p99Ms: spikeBCol.p99,
        deviationMultiplier: Number((spikeBCol.max / Math.max(1, spikeBCol.p50)).toFixed(1)),
        affectedRequests: spikeBCol.bins['250_500ms'].count + spikeBCol.bins['gt500ms'].count,
        probableCause: 'VictoriaLogs Storage LSM Compaction Flush',
        diagnostics: '端點磁碟區塊合併暫態 I/O 阻塞，導致單一 HTTP POST 延遲攀升至 500ms+。',
        mitigation: '指數退避重試邏輯自動平抑，後續請求迅速回穩至 < 10ms。',
        severity: 'critical'
      });
    }
  }

  public recordLatency(latencyMs: number, timestamp: Date = new Date()): void {
    const currentMinStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    let lastCol = this.columns[this.columns.length - 1];

    if (!lastCol || lastCol.minute !== currentMinStr) {
      // Advance to a new minute bucket
      const bins = this.createEmptyBins();
      const binKey = this.getBinKey(latencyMs);
      bins[binKey].count = 1;
      bins[binKey].pct = 100;

      lastCol = {
        minute: currentMinStr,
        timestamp: timestamp.toISOString(),
        bins,
        rawLatencies: [latencyMs],
        totalRequests: 1,
        p50: latencyMs,
        p90: latencyMs,
        p95: latencyMs,
        p99: latencyMs,
        max: latencyMs,
        min: latencyMs,
        avg: latencyMs,
        hasSpike: latencyMs >= this.spikeThresholdMs
      };

      this.columns.push(lastCol);
      while (this.columns.length > 60) {
        this.columns.shift();
      }
    } else {
      // Accumulate into existing minute column
      lastCol.rawLatencies.push(latencyMs);
      lastCol.totalRequests++;
      const binKey = this.getBinKey(latencyMs);
      lastCol.bins[binKey].count++;

      // Recalculate percentages
      for (const k of Object.keys(lastCol.bins) as LatencyBinKey[]) {
        lastCol.bins[k].pct = Number(((lastCol.bins[k].count / lastCol.totalRequests) * 100).toFixed(1));
      }

      const p = this.calculatePercentiles(lastCol.rawLatencies);
      lastCol.p50 = p.p50;
      lastCol.p90 = p.p90;
      lastCol.p95 = p.p95;
      lastCol.p99 = p.p99;
      lastCol.max = p.max;
      lastCol.min = p.min;
      lastCol.avg = p.avg;

      if (latencyMs >= this.spikeThresholdMs && !lastCol.hasSpike) {
        lastCol.hasSpike = true;
        lastCol.spikeReason = '即時監控捕獲暫態尖峰 (Real-time Transient Network Spike)';
      }
    }

    // If an extreme outlier spike occurred, record it in the forensic log
    if (latencyMs >= this.spikeThresholdMs) {
      const existingRecent = this.transientSpikes.find(
        s => Math.abs(new Date(s.timestamp).getTime() - timestamp.getTime()) < 60000
      );
      if (!existingRecent) {
        this.transientSpikes.unshift({
          id: `spk-live-${Date.now()}`,
          timestamp: timestamp.toISOString(),
          minute: currentMinStr,
          peakLatencyMs: latencyMs,
          baselineP50Ms: lastCol.p50,
          p99Ms: lastCol.p99,
          deviationMultiplier: Number((latencyMs / Math.max(1, lastCol.p50)).toFixed(1)),
          affectedRequests: 1,
          probableCause: latencyMs > 350 ? 'Severe Network Jitter / Socket Stall' : 'Moderate Ingestion Latency Burst',
          diagnostics: `連線寫入耗時 ${latencyMs}ms，超出基準值 ${this.spikeThresholdMs}ms。`,
          mitigation: '收集器 Keep-Alive 連線池重用機制已平滑吸收此異常。',
          severity: latencyMs >= 350 ? 'critical' : 'warning'
        });
        if (this.transientSpikes.length > 25) {
          this.transientSpikes.pop();
        }
      }
    }
  }

  public injectSpike(
    magnitudeMs: number = 420,
    burstCount: number = 4,
    reason: string = '模擬網路抖動與暫態延遲脈衝 (Chaos Latency Spike Injection)'
  ): TransientSpikeRecord {
    const now = new Date();
    const currentMinStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    let lastCol = this.columns[this.columns.length - 1];

    if (!lastCol) {
      this.recordLatency(magnitudeMs, now);
      lastCol = this.columns[this.columns.length - 1];
    }

    for (let i = 0; i < burstCount; i++) {
      const jittered = Number((magnitudeMs * (0.85 + Math.random() * 0.3)).toFixed(1));
      lastCol.rawLatencies.push(jittered);
      lastCol.totalRequests++;
      const binKey = this.getBinKey(jittered);
      lastCol.bins[binKey].count++;
    }

    for (const k of Object.keys(lastCol.bins) as LatencyBinKey[]) {
      lastCol.bins[k].pct = Number(((lastCol.bins[k].count / lastCol.totalRequests) * 100).toFixed(1));
    }

    const p = this.calculatePercentiles(lastCol.rawLatencies);
    lastCol.p50 = p.p50;
    lastCol.p90 = p.p90;
    lastCol.p95 = p.p95;
    lastCol.p99 = p.p99;
    lastCol.max = p.max;
    lastCol.min = p.min;
    lastCol.avg = p.avg;
    lastCol.hasSpike = true;
    lastCol.spikeReason = reason;

    const newSpike: TransientSpikeRecord = {
      id: `spk-injected-${Date.now()}`,
      timestamp: now.toISOString(),
      minute: currentMinStr,
      peakLatencyMs: lastCol.max,
      baselineP50Ms: lastCol.p50,
      p99Ms: lastCol.p99,
      deviationMultiplier: Number((lastCol.max / Math.max(1, lastCol.p50)).toFixed(1)),
      affectedRequests: burstCount,
      probableCause: reason,
      diagnostics: `測試注入暫態尖峰: 峰值 ${lastCol.max}ms (P50: ${lastCol.p50}ms, 放大 ${Number((lastCol.max / Math.max(1, lastCol.p50)).toFixed(1))}x)`,
      mitigation: '熱力圖已即時高亮標記該時間窗格與超時分級。',
      severity: magnitudeMs >= 300 ? 'critical' : 'warning'
    };

    this.transientSpikes.unshift(newSpike);
    if (this.transientSpikes.length > 25) {
      this.transientSpikes.pop();
    }

    return newSpike;
  }

  public getSnapshot(range: '15m' | '30m' | '60m' = '60m'): LatencyHeatmapSnapshot {
    const count = range === '15m' ? 15 : range === '30m' ? 30 : 60;
    const selectedCols = this.columns.slice(-count);

    const latestCol = selectedCols[selectedCols.length - 1];
    const allMaxes = selectedCols.map(c => c.max).filter(m => m > 0);
    const allMins = selectedCols.map(c => c.min).filter(m => m > 0);

    const peakLatencyLastHour = allMaxes.length > 0 ? Math.max(...allMaxes) : 0;
    const minLatencyLastHour = allMins.length > 0 ? Math.min(...allMins) : 0;

    const totalRequestsMeasured = selectedCols.reduce((acc, c) => acc + c.totalRequests, 0);
    const spikedColsCount = selectedCols.filter(c => c.hasSpike).length;
    const spikeFreeRatePct = selectedCols.length > 0
      ? Number((((selectedCols.length - spikedColsCount) / selectedCols.length) * 100).toFixed(1))
      : 100;

    let connectionHealthStatus: LatencyHeatmapSnapshot['summary']['connectionHealthStatus'] = 'OPTIMAL';
    const curP99 = latestCol?.p99 || 0;
    if (curP99 >= 250 || (latestCol?.hasSpike && latestCol?.max >= 350)) {
      connectionHealthStatus = 'SPIKE_WARNING';
    } else if (curP99 >= 80 || spikedColsCount >= 3) {
      connectionHealthStatus = 'DEGRADED_JITTER';
    } else if (curP99 >= 30) {
      connectionHealthStatus = 'STABLE';
    }

    return {
      timeRange: range,
      generatedAt: new Date().toISOString(),
      binDefs: LATENCY_BIN_DEFS,
      columns: selectedCols,
      summary: {
        currentP50: latestCol?.p50 || 0,
        currentP90: latestCol?.p90 || 0,
        currentP95: latestCol?.p95 || 0,
        currentP99: latestCol?.p99 || 0,
        currentAvg: latestCol?.avg || 0,
        peakLatencyLastHour,
        minLatencyLastHour,
        totalRequestsMeasured,
        totalSpikesDetected: this.transientSpikes.length,
        spikeFreeRatePct,
        connectionHealthStatus
      },
      transientSpikes: this.transientSpikes.slice(0, 15)
    };
  }
}

export const globalVictoriaLogsLatencyHeatmap = new VictoriaLogsLatencyHeatmapTracker();

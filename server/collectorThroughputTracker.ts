/**
 * Collector Ingestion Throughput & Performance Bottleneck Tracker
 *
 * Tracks 60-minute per-minute log ingestion volume, moving averages,
 * protocol breakdowns, and automated bottleneck identification algorithms.
 */

export interface MinuteThroughputBucket {
  minuteIndex: number;          // 0 to 59 (0 = 59 mins ago, 59 = current minute)
  timestamp: number;            // Epoch ms of minute start
  timeLabel: string;            // E.g. "14:05"
  relativeLabel: string;        // E.g. "T-45m" or "Now"
  volume: number;               // Logs ingested in this minute
  eps: number;                  // Average EPS during this minute (volume / 60)
  bytesMB: number;              // Ingestion payload volume in MB
  movingAvgVolume: number;      // 5-minute rolling average
  bufferDepthAvg: number;       // Ring buffer depth during this minute
  workerSaturationPct: number;  // Worker pool saturation during this minute
  droppedLogs: number;          // Dropped or throttled logs
  isBottleneck: boolean;        // True if flagged as a bottleneck minute
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
    warningThreshold: number;      // Default 38,000 logs/min (~633 EPS)
    saturationThreshold: number;   // Default 50,000 logs/min (~833 EPS)
    bufferCapacity: number;        // Default 50,000 logs
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

export class CollectorThroughputTracker {
  private buckets: MinuteThroughputBucket[] = [];
  private warningThreshold: number = 38000;
  private saturationThreshold: number = 50000;
  private alerts: BottleneckAlert[] = [];
  private lastAdvancedMinute: number = 0;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initHistoricalBuckets();
    this.lastAdvancedMinute = Math.floor(Date.now() / 60000);
    this.startAutoRollover();
  }

  /**
   * Initializes 60 realistic 1-minute buckets representing the last hour.
   * Includes typical diurnal variations, a realistic surge at T-22m, and normal baseline.
   */
  private initHistoricalBuckets() {
    const now = Date.now();
    const currentMinuteEpoch = Math.floor(now / 60000) * 60000;
    this.buckets = [];

    for (let i = 59; i >= 0; i--) {
      const minuteTime = currentMinuteEpoch - i * 60000;
      const d = new Date(minuteTime);
      const timeLabel = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const relativeLabel = i === 0 ? 'Now' : `-${i}m`;

      // Generate realistic log baseline (approx 22,000 - 32,000 logs/min baseline)
      // Introduce an intentional transient surge around 18-24 mins ago to illustrate bottleneck detection
      let baseVolume = 24000 + Math.floor(Math.sin((60 - i) * 0.25) * 6000) + Math.floor(Math.random() * 3500);

      // Bottleneck spike simulation at T-22m to T-19m
      let isSpike = false;
      if (i >= 19 && i <= 23) {
        baseVolume = 48000 + Math.floor(Math.random() * 6500);
        isSpike = true;
      }

      // If current minute (i === 0), partial volume
      if (i === 0) {
        const secondsInCurrentMinute = new Date().getSeconds();
        const fraction = Math.max(0.15, secondsInCurrentMinute / 60);
        baseVolume = Math.floor(baseVolume * fraction);
      }

      const eps = Math.round(baseVolume / 60);
      const avgBytesPerLog = 420;
      const bytesMB = Number(((baseVolume * avgBytesPerLog) / (1024 * 1024)).toFixed(2));

      // Worker saturation and buffer depth correlation
      const bufferDepth = isSpike
        ? 38500 + Math.floor(Math.random() * 5000)
        : 1200 + Math.floor((baseVolume / 35000) * 2200);

      const workerSaturation = isSpike
        ? Math.min(96, 75 + Math.floor((baseVolume / 55000) * 22))
        : Math.min(70, 35 + Math.floor((baseVolume / 35000) * 30));

      const droppedLogs = baseVolume > this.saturationThreshold ? Math.floor((baseVolume - this.saturationThreshold) * 0.05) : 0;

      let isBottleneck = false;
      let bottleneckSeverity: 'none' | 'warning' | 'critical' = 'none';
      let bottleneckType: MinuteThroughputBucket['bottleneckType'] = 'none';
      let bottleneckReason: string | undefined = undefined;

      if (baseVolume >= this.saturationThreshold || bufferDepth >= 37500 || workerSaturation >= 90) {
        isBottleneck = true;
        bottleneckSeverity = 'critical';
        bottleneckType = 'buffer_saturation';
        bottleneckReason = `吞吐量超出消費閾值 (${baseVolume.toLocaleString()} 筆/分)。環形緩衝深度達 ${bufferDepth.toLocaleString()}，協程池飽和度 ${workerSaturation}%。`;
      } else if (baseVolume >= this.warningThreshold || bufferDepth >= 25000 || workerSaturation >= 75) {
        isBottleneck = true;
        bottleneckSeverity = 'warning';
        bottleneckType = 'worker_starvation';
        bottleneckReason = `進線速率升高至預警水位 (${baseVolume.toLocaleString()} 筆/分)。協程飽和度接近臨界點 (${workerSaturation}%)。`;
      }

      // Protocol distribution (typical mix: UDP 48%, HTTP 28%, TLS 14%, TCP 10%)
      const syslogUdp = Math.floor(baseVolume * 0.48);
      const httpIngest = Math.floor(baseVolume * 0.28);
      const syslogTls = Math.floor(baseVolume * 0.14);
      const syslogTcp = baseVolume - syslogUdp - httpIngest - syslogTls;

      this.buckets.push({
        minuteIndex: 59 - i,
        timestamp: minuteTime,
        timeLabel,
        relativeLabel,
        volume: baseVolume,
        eps,
        bytesMB,
        movingAvgVolume: baseVolume,
        bufferDepthAvg: bufferDepth,
        workerSaturationPct: workerSaturation,
        droppedLogs,
        isBottleneck,
        bottleneckSeverity,
        bottleneckType,
        bottleneckReason,
        protocols: {
          syslogUdp,
          syslogTcp,
          syslogTls,
          httpIngest
        }
      });
    }

    this.recomputeMovingAveragesAndAlerts();
  }

  /**
   * Recalculates 5-minute rolling averages and extracts alert entries.
   */
  private recomputeMovingAveragesAndAlerts() {
    this.alerts = [];

    for (let idx = 0; idx < this.buckets.length; idx++) {
      const start = Math.max(0, idx - 4);
      const window = this.buckets.slice(start, idx + 1);
      const sum = window.reduce((acc, curr) => acc + curr.volume, 0);
      this.buckets[idx].movingAvgVolume = Math.round(sum / window.length);

      const b = this.buckets[idx];
      if (b.isBottleneck && b.bottleneckSeverity === 'critical') {
        // Only keep distinct alert episodes
        const lastAlert = this.alerts[this.alerts.length - 1];
        if (!lastAlert || (b.timestamp - lastAlert.timestamp > 180000)) {
          this.alerts.push({
            id: `btl-${b.timestamp}`,
            timestamp: b.timestamp,
            timeLabel: b.timeLabel,
            severity: 'critical',
            title: '採集器管線吞吐瓶頸 (Ingestion Saturation)',
            volume: b.volume,
            threshold: this.saturationThreshold,
            impact: `緩衝區深度達到 ${(b.bufferDepthAvg).toLocaleString()} 條 (80% 水位)，協程池飽和度 ${b.workerSaturationPct}%`,
            recommendation: '建議動態擴容解碼 Goroutine 工作池至 24 條，或啟用環形緩衝微批次即時排空。',
            rootCause: '突發巨量 Syslog UDP 封包進線，下游解析與 Rust IPC 提交速度暫時低於進線流速。'
          });
        }
      }
    }
  }

  /**
   * Automatically advances bucket every minute.
   */
  private startAutoRollover() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.intervalTimer = setInterval(() => {
      this.checkAndRollover();
    }, 5000); // Check every 5s
  }

  private checkAndRollover() {
    const currentMinute = Math.floor(Date.now() / 60000);
    if (currentMinute > this.lastAdvancedMinute) {
      const minutesToAdvance = currentMinute - this.lastAdvancedMinute;
      for (let m = 0; m < Math.min(minutesToAdvance, 60); m++) {
        const nextTime = (this.lastAdvancedMinute + m + 1) * 60000;
        const d = new Date(nextTime);
        const timeLabel = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

        // Shift oldest
        this.buckets.shift();

        // Push new empty/baseline bucket
        const baselineVol = 24000 + Math.floor(Math.random() * 4000);
        this.buckets.push({
          minuteIndex: 59,
          timestamp: nextTime,
          timeLabel,
          relativeLabel: 'Now',
          volume: baselineVol,
          eps: Math.round(baselineVol / 60),
          bytesMB: Number(((baselineVol * 420) / (1024 * 1024)).toFixed(2)),
          movingAvgVolume: baselineVol,
          bufferDepthAvg: 1450,
          workerSaturationPct: 48,
          droppedLogs: 0,
          isBottleneck: false,
          bottleneckSeverity: 'none',
          bottleneckType: 'none',
          protocols: {
            syslogUdp: Math.floor(baselineVol * 0.48),
            syslogTcp: Math.floor(baselineVol * 0.1),
            syslogTls: Math.floor(baselineVol * 0.14),
            httpIngest: Math.floor(baselineVol * 0.28)
          }
        });

        // Re-index relative labels
        for (let j = 0; j < 60; j++) {
          const diff = 59 - j;
          this.buckets[j].minuteIndex = j;
          this.buckets[j].relativeLabel = diff === 0 ? 'Now' : `-${diff}m`;
        }
      }
      this.lastAdvancedMinute = currentMinute;
      this.recomputeMovingAveragesAndAlerts();
    }
  }

  /**
   * Records newly ingested logs into the current active minute bucket.
   */
  public recordIngest(
    count: number,
    bytes: number = 0,
    protocol: string = 'Syslog UDP',
    bufferDepth: number = 1450,
    workerSaturation: number = 50
  ) {
    this.checkAndRollover();
    const currentBucket = this.buckets[this.buckets.length - 1];
    if (!currentBucket) return;

    currentBucket.volume += count;
    currentBucket.eps = Math.round(currentBucket.volume / 60);
    const addedMB = bytes > 0 ? bytes / (1024 * 1024) : (count * 420) / (1024 * 1024);
    currentBucket.bytesMB = Number((currentBucket.bytesMB + addedMB).toFixed(2));
    currentBucket.bufferDepthAvg = Math.max(currentBucket.bufferDepthAvg, bufferDepth);
    currentBucket.workerSaturationPct = Math.max(currentBucket.workerSaturationPct, workerSaturation);

    const protoLower = protocol.toLowerCase();
    if (protoLower.includes('udp')) {
      currentBucket.protocols.syslogUdp += count;
    } else if (protoLower.includes('tls')) {
      currentBucket.protocols.syslogTls += count;
    } else if (protoLower.includes('tcp')) {
      currentBucket.protocols.syslogTcp += count;
    } else {
      currentBucket.protocols.httpIngest += count;
    }

    // Evaluate bottleneck condition
    if (currentBucket.volume >= this.saturationThreshold || currentBucket.bufferDepthAvg >= 38000) {
      currentBucket.isBottleneck = true;
      currentBucket.bottleneckSeverity = 'critical';
      currentBucket.bottleneckType = 'buffer_saturation';
      currentBucket.bottleneckReason = `當前分鐘進線巨量湧入 (${currentBucket.volume.toLocaleString()} 筆/分)。超過飽和警戒閾值 (${this.saturationThreshold.toLocaleString()})。`;
    } else if (currentBucket.volume >= this.warningThreshold || currentBucket.bufferDepthAvg >= 25000) {
      currentBucket.isBottleneck = true;
      currentBucket.bottleneckSeverity = 'warning';
      currentBucket.bottleneckType = 'worker_starvation';
      currentBucket.bottleneckReason = `當前分鐘流量達到高載水位 (${currentBucket.volume.toLocaleString()} 筆/分)。`;
    } else {
      currentBucket.isBottleneck = false;
      currentBucket.bottleneckSeverity = 'none';
      currentBucket.bottleneckType = 'none';
      currentBucket.bottleneckReason = undefined;
    }

    this.recomputeMovingAveragesAndAlerts();
  }

  /**
   * Simulates an immediate burst injection across the recent minutes to test visualization.
   */
  public simulateBurst(burstVolume: number = 35000, profile: 'spike' | 'saturation' | 'stoppage' = 'spike') {
    this.checkAndRollover();
    const current = this.buckets[this.buckets.length - 1];
    if (!current) return;

    if (profile === 'saturation') {
      current.volume = this.saturationThreshold + burstVolume;
      current.bufferDepthAvg = 42000;
      current.workerSaturationPct = 95;
      current.isBottleneck = true;
      current.bottleneckSeverity = 'critical';
      current.bottleneckType = 'buffer_saturation';
      current.bottleneckReason = `持續性高吞吐注入引發管線飽和 (進線: ${current.volume.toLocaleString()} 筆/分，緩衝深度: 42,000 / 50,000)。`;
    } else if (profile === 'stoppage') {
      current.volume = 1200;
      current.bufferDepthAvg = 150;
      current.workerSaturationPct = 8;
      current.isBottleneck = true;
      current.bottleneckSeverity = 'warning';
      current.bottleneckType = 'upstream_drop';
      current.bottleneckReason = '偵測到吞吐量異常暴跌至 1,200 筆/分，懷疑上游日誌源斷線或防火牆阻擋封包。';
    } else {
      current.volume += burstVolume;
      current.bufferDepthAvg = Math.min(48000, current.bufferDepthAvg + 8500);
      current.workerSaturationPct = Math.min(98, current.workerSaturationPct + 30);
      if (current.volume >= this.saturationThreshold) {
        current.isBottleneck = true;
        current.bottleneckSeverity = 'critical';
        current.bottleneckType = 'buffer_saturation';
        current.bottleneckReason = `突發暴增注入：單分鐘達 ${current.volume.toLocaleString()} 筆，觸發紅色瓶頸預警。`;
      }
    }

    current.eps = Math.round(current.volume / 60);
    current.bytesMB = Number(((current.volume * 420) / (1024 * 1024)).toFixed(2));
    this.recomputeMovingAveragesAndAlerts();
  }

  /**
   * Updates bottleneck detection thresholds.
   */
  public updateThresholds(warningThreshold?: number, saturationThreshold?: number) {
    if (warningThreshold && warningThreshold > 1000) {
      this.warningThreshold = Number(warningThreshold);
    }
    if (saturationThreshold && saturationThreshold > this.warningThreshold) {
      this.saturationThreshold = Number(saturationThreshold);
    }

    // Re-evaluate existing buckets
    for (const b of this.buckets) {
      if (b.volume >= this.saturationThreshold || b.bufferDepthAvg >= 38000) {
        b.isBottleneck = true;
        b.bottleneckSeverity = 'critical';
        b.bottleneckType = 'buffer_saturation';
      } else if (b.volume >= this.warningThreshold || b.bufferDepthAvg >= 25000) {
        b.isBottleneck = true;
        b.bottleneckSeverity = 'warning';
        b.bottleneckType = 'worker_starvation';
      } else {
        b.isBottleneck = false;
        b.bottleneckSeverity = 'none';
        b.bottleneckType = 'none';
        b.bottleneckReason = undefined;
      }
    }

    this.recomputeMovingAveragesAndAlerts();
  }

  /**
   * Returns complete 60-minute throughput history and analytical summary.
   */
  public getHistorySummary(windowMinutes: number = 60): {
    buckets: MinuteThroughputBucket[];
    summary: ThroughputHistorySummary;
  } {
    this.checkAndRollover();

    const selectedBuckets = windowMinutes >= 60
      ? this.buckets
      : this.buckets.slice(Math.max(0, 60 - windowMinutes));

    let totalVolume = 0;
    let totalBytesMB = 0;
    let peakVolume = 0;
    let peakTime = '--:--';
    let minVolume = Infinity;
    let minTime = '--:--';

    let totalUdp = 0;
    let totalTcp = 0;
    let totalTls = 0;
    let totalHttp = 0;
    let criticalCount = 0;
    let warningCount = 0;

    for (const b of selectedBuckets) {
      totalVolume += b.volume;
      totalBytesMB += b.bytesMB;

      if (b.volume > peakVolume) {
        peakVolume = b.volume;
        peakTime = b.timeLabel;
      }
      if (b.volume < minVolume && b.volume > 0) {
        minVolume = b.volume;
        minTime = b.timeLabel;
      }

      totalUdp += b.protocols.syslogUdp;
      totalTcp += b.protocols.syslogTcp;
      totalTls += b.protocols.syslogTls;
      totalHttp += b.protocols.httpIngest;

      if (b.isBottleneck) {
        if (b.bottleneckSeverity === 'critical') criticalCount++;
        else warningCount++;
      }
    }

    if (minVolume === Infinity) minVolume = 0;

    const count = selectedBuckets.length || 1;
    const avgVolumePerMinute = Math.round(totalVolume / count);
    const avgEps = Math.round(avgVolumePerMinute / 60);

    const currentBucket = this.buckets[this.buckets.length - 1];
    const currentMinuteVolume = currentBucket ? currentBucket.volume : 0;
    const currentMinuteEps = currentBucket ? currentBucket.eps : 0;

    let overallStatus: ThroughputHistorySummary['overallBottleneckStatus'] = 'HEALTHY';
    if (criticalCount > 0 || (currentBucket && currentBucket.bottleneckSeverity === 'critical')) {
      overallStatus = 'CRITICAL_BOTTLENECK';
    } else if (warningCount > 2 || (currentBucket && currentBucket.bottleneckSeverity === 'warning')) {
      overallStatus = 'WARNING_ELEVATED';
    }

    const protoTotal = totalUdp + totalTcp + totalTls + totalHttp || 1;
    const protocolDistribution = [
      {
        name: 'Syslog UDP (:5140)',
        volume: totalUdp,
        percentage: Number(((totalUdp / protoTotal) * 100).toFixed(1)),
        color: '#10b981' // emerald-500
      },
      {
        name: 'HTTP Batch Ingest (:8080)',
        volume: totalHttp,
        percentage: Number(((totalHttp / protoTotal) * 100).toFixed(1)),
        color: '#f59e0b' // amber-500
      },
      {
        name: 'Syslog TLS (:6514)',
        volume: totalTls,
        percentage: Number(((totalTls / protoTotal) * 100).toFixed(1)),
        color: '#a855f7' // purple-500
      },
      {
        name: 'Syslog TCP (:5140)',
        volume: totalTcp,
        percentage: Number(((totalTcp / protoTotal) * 100).toFixed(1)),
        color: '#6366f1' // indigo-500
      }
    ];

    return {
      buckets: selectedBuckets,
      summary: {
        windowMinutes: selectedBuckets.length,
        totalVolume,
        totalBytesMB: Number(totalBytesMB.toFixed(2)),
        avgVolumePerMinute,
        avgEps,
        peakMinuteVolume: peakVolume,
        peakMinuteTime: peakTime,
        minMinuteVolume: minVolume,
        minMinuteTime: minTime,
        currentMinuteVolume,
        currentMinuteEps,
        bottleneckThresholds: {
          warningThreshold: this.warningThreshold,
          saturationThreshold: this.saturationThreshold,
          bufferCapacity: 50000
        },
        overallBottleneckStatus: overallStatus,
        activeBottlenecksCount: criticalCount + warningCount,
        recentAlerts: this.alerts.slice(-5),
        protocolDistribution
      }
    };
  }
}

// Global Singleton Instance
export const globalCollectorThroughputTracker = new CollectorThroughputTracker();

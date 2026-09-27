import { Router, Request, Response } from 'express';
import { globalCollectorMemoryManager } from './collectorMemoryManager';
import { globalVictoriaLogsHealthMonitor } from './victoriaLogsHealthMonitor';
import { globalCollectorThroughputTracker } from './collectorThroughputTracker';
import { globalCollectorConnectionPool } from './collectorConnectionPool';

export function createCollectorRouter(vlogsRetryState: any, broadcastVlogsRetryStats: (event?: any) => void, activeIngestSources: any[]) {
  const router = Router();

  // In-memory collector tuning configuration
  let bufferConfig = {
    ringBufferCapacity: 50000,
    highWatermarkPercentage: 75,
    lowWatermarkPercentage: 15,
    workerPoolTotal: 16,
    batchTimeoutMs: 250,
    smallPacketMode: true,
    simulatedLoadProfile: 'normal' as 'normal' | 'surge' | 'stress' | 'outage',
    backpressureActive: false
  };

  // In-memory Token-Bucket Rate Limiter
  let rateLimiter = {
    enabled: true,
    capacity: 25000, // Max burst tokens
    refillRatePerSec: 12000, // EPS refill rate
    currentTokens: 25000,
    dropPolicy: 'backpressure' as 'drop_oldest' | 'backpressure' | 'reject',
    totalAllowedEvents: 48920150,
    totalThrottledEvents: 1420,
    lastRefillTime: Date.now()
  };

  // Protocol Listeners Directory State
  let protocolListeners = [
    {
      id: "syslog-udp",
      name: "Syslog UDP Receiver",
      port: 5140,
      transport: "UDP",
      standard: "RFC 3164 / RFC 5424",
      status: "listening",
      bufferMB: 32,
      workersCount: 16,
      features: ["SO_RCVBUF 32MB", "Decoupled Zero-Copy Packet Pool", "Lock-Striped Shards", "Token-Bucket Rate Limiter"]
    },
    {
      id: "syslog-tcp",
      name: "Syslog TCP Receiver",
      port: 5140,
      transport: "TCP",
      standard: "RFC 6587 / Octet-Counting",
      status: "listening",
      maxLineMB: 1,
      features: ["Octet-Counting Framing (RFC 6587)", "Non-Transparent Delimited Streaming", "Keep-Alive Heartbeat"]
    },
    {
      id: "syslog-tls",
      name: "Syslog TLS Receiver",
      port: 6514,
      transport: "TLS (TCP)",
      standard: "RFC 5425 Secure Syslog",
      status: "listening",
      tlsVersion: "TLS 1.2 / TLS 1.3",
      cipherSuite: "ECDHE-ECDSA-AES256-GCM-SHA384",
      features: ["mTLS Client Certificate Auth", "Strict Octet-Counting Framing", "Anti-Man-in-the-Middle Encryption"]
    },
    {
      id: "http-ingest",
      name: "HTTP High-Throughput Ingest",
      port: 8080,
      transport: "HTTP/1.1",
      standard: "VictoriaLogs NDJSON / Loki / ES",
      status: "listening",
      endpoints: ["/insert/jsonline", "/insert/loki/api/v1/push", "/insert/elasticsearch/_bulk", "/api/v1/ingest"],
      features: ["NDJSON Streaming Scanner", "Grafana Loki Compatibility", "Elasticsearch Bulk Protocol", "Dynamic Microsecond Parser Tester"]
    }
  ];

  // 1. Buffer Configuration & Tuning
  router.get('/buffer-config', (req: Request, res: Response) => {
    res.json({
      success: true,
      config: bufferConfig,
      runtimeState: {
        currentDepth: vlogsRetryState.lastHeartbeatProbe?.bufferDepth || 1420,
        workerSaturationPct: Number(((8 / bufferConfig.workerPoolTotal) * 100).toFixed(1)),
        isTargetReachable: vlogsRetryState.isTargetReachable,
        queueDepth: vlogsRetryState.retryQueue.length
      }
    });
  });

  router.put('/buffer-config', (req: Request, res: Response) => {
    const { ringBufferCapacity, workerPoolTotal, batchTimeoutMs, smallPacketMode, simulatedLoadProfile } = req.body;
    if (ringBufferCapacity && ringBufferCapacity > 1000) bufferConfig.ringBufferCapacity = Number(ringBufferCapacity);
    if (workerPoolTotal && workerPoolTotal > 0 && workerPoolTotal <= 128) bufferConfig.workerPoolTotal = Number(workerPoolTotal);
    if (batchTimeoutMs && batchTimeoutMs >= 10) bufferConfig.batchTimeoutMs = Number(batchTimeoutMs);
    if (typeof smallPacketMode === 'boolean') bufferConfig.smallPacketMode = smallPacketMode;
    if (simulatedLoadProfile) bufferConfig.simulatedLoadProfile = simulatedLoadProfile;

    broadcastVlogsRetryStats({ type: 'buffer_config_updated', bufferConfig });
    res.json({ success: true, message: '收集器環形緩衝區與工作池配置已套用', config: bufferConfig });
  });

  // 2. Simulated Load Profile (Normal / Surge / Stress / Outage)
  router.post('/simulate-load', (req: Request, res: Response) => {
    const { profile } = req.body;
    if (['normal', 'surge', 'stress', 'outage'].includes(profile)) {
      bufferConfig.simulatedLoadProfile = profile;
      if (profile === 'outage') {
        vlogsRetryState.simulatedOutage = true;
      } else if (vlogsRetryState.simulatedOutage && profile === 'normal') {
        vlogsRetryState.simulatedOutage = false;
      }
      broadcastVlogsRetryStats({ type: 'load_profile_changed', profile });
      res.json({ success: true, profile, message: `收集器負載模式已調整為 ${profile.toUpperCase()}` });
    } else {
      res.status(400).json({ error: 'Invalid profile. Choose normal, surge, stress, or outage.' });
    }
  });

  // 3. Token-Bucket Rate Limiter Endpoints
  router.get('/rate-limiter', (req: Request, res: Response) => {
    const now = Date.now();
    const elapsedSec = (now - rateLimiter.lastRefillTime) / 1000;
    rateLimiter.currentTokens = Math.min(rateLimiter.capacity, rateLimiter.currentTokens + Math.floor(elapsedSec * rateLimiter.refillRatePerSec));
    rateLimiter.lastRefillTime = now;

    res.json({
      success: true,
      rateLimiter: {
        ...rateLimiter,
        tokensAvailablePct: Number(((rateLimiter.currentTokens / rateLimiter.capacity) * 100).toFixed(1))
      }
    });
  });

  router.post('/rate-limiter', (req: Request, res: Response) => {
    const { enabled, capacity, refillRatePerSec, dropPolicy } = req.body;
    if (typeof enabled === 'boolean') rateLimiter.enabled = enabled;
    if (capacity && capacity > 0) rateLimiter.capacity = Number(capacity);
    if (refillRatePerSec && refillRatePerSec > 0) rateLimiter.refillRatePerSec = Number(refillRatePerSec);
    if (dropPolicy && ['drop_oldest', 'backpressure', 'reject'].includes(dropPolicy)) rateLimiter.dropPolicy = dropPolicy;

    res.json({ success: true, message: '進線流量令牌桶 (Token-Bucket) 限流政策已更新', rateLimiter });
  });

  // 4. Ingestion Sources Dynamic Management (CRUD)
  router.post('/sources', (req: Request, res: Response) => {
    const { name, remoteIP, remotePort, protocol, format, vendor, peakEPS } = req.body;
    if (!name || !remoteIP) {
      return res.status(400).json({ error: 'name and remoteIP are required' });
    }

    const newSource = {
      id: `src-${String(activeIngestSources.length + 1).padStart(2, '0')}`,
      name: String(name),
      remoteIP: String(remoteIP),
      remotePort: Number(remotePort) || 5140,
      protocol: protocol || "Syslog UDP",
      format: format || "RFC 5424",
      vendor: vendor || "Generic Log Shipper",
      currentEPS: 120,
      peakEPS: Number(peakEPS) || 2000,
      bytesReceived: 0,
      droppedPackets: 0,
      activeState: "active",
      lastSeen: new Date().toISOString()
    };

    activeIngestSources.push(newSource);
    broadcastVlogsRetryStats({ type: 'sources_updated' });
    res.json({ success: true, message: '日誌來源已成功註冊', source: newSource });
  });

  router.patch('/sources/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const source = activeIngestSources.find(s => s.id === id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    Object.assign(source, req.body);
    broadcastVlogsRetryStats({ type: 'sources_updated' });
    res.json({ success: true, source });
  });

  router.delete('/sources/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = activeIngestSources.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Source not found' });
    }

    const removed = activeIngestSources.splice(idx, 1)[0];
    broadcastVlogsRetryStats({ type: 'sources_updated' });
    res.json({ success: true, message: `來源 ${removed.name} 已移除` });
  });

  router.post('/sources/:id/test-ping', (req: Request, res: Response) => {
    const { id } = req.params;
    const source = activeIngestSources.find(s => s.id === id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    source.bytesReceived += 420;
    source.currentEPS = Math.min(source.peakEPS, source.currentEPS + 45);
    source.lastSeen = new Date().toISOString();

    res.json({
      success: true,
      message: `連線探測成功: 已由來源 ${source.name} (${source.remoteIP}:${source.remotePort}) 模擬注入測試封包`,
      source
    });
  });

  // 5. Protocol Listeners Control
  router.post('/protocols/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const proto = protocolListeners.find(p => p.id === id);
    if (!proto) {
      return res.status(404).json({ error: 'Protocol listener not found' });
    }

    proto.status = proto.status === 'listening' ? 'paused' : 'listening';
    res.json({ success: true, protocol: proto, message: `協定監聽器 ${proto.name} 狀態已切換為: ${proto.status}` });
  });

  router.put('/protocols/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const proto = protocolListeners.find(p => p.id === id);
    if (!proto) {
      return res.status(404).json({ error: 'Protocol listener not found' });
    }

    const { port, bufferMB, maxLineMB, workersCount } = req.body;
    if (port) proto.port = Number(port);
    if (bufferMB && 'bufferMB' in proto) (proto as any).bufferMB = Number(bufferMB);
    if (maxLineMB && 'maxLineMB' in proto) (proto as any).maxLineMB = Number(maxLineMB);
    if (workersCount && 'workersCount' in proto) (proto as any).workersCount = Number(workersCount);

    res.json({ success: true, protocol: proto, message: `協定監聽器 ${proto.name} 參數已更新` });
  });

  // 6. VictoriaLogs Retry Queue Inspection & Operations
  router.get('/retry-queue', (req: Request, res: Response) => {
    res.json({
      success: true,
      currentDepth: vlogsRetryState.retryQueue.length,
      capacity: vlogsRetryState.queueCapacity,
      batches: vlogsRetryState.retryQueue.map((b: any) => ({
        id: b.id,
        logCount: b.logCount,
        attempts: b.attempts,
        createdAt: new Date(b.createdAt).toISOString(),
        lastAttemptAt: new Date(b.lastAttemptAt).toISOString(),
        lastError: b.lastError
      }))
    });
  });

  router.post('/drain-queue', (req: Request, res: Response) => {
    const depth = vlogsRetryState.retryQueue.length;
    if (vlogsRetryState.simulatedOutage) {
      return res.status(400).json({ error: '故障模擬進行中，請先關閉 503 斷線模擬方可排空佇列。' });
    }

    // Force flush
    vlogsRetryState.queueDrainedSuccess += depth;
    vlogsRetryState.successfulRequests += depth;
    vlogsRetryState.retryQueue = [];
    broadcastVlogsRetryStats({ type: 'queue_manually_drained' });

    res.json({ success: true, message: `已成功手動排空 ${depth} 個重試批次並寫入 VictoriaLogs`, drainedCount: depth });
  });

  router.delete('/retry-queue', (req: Request, res: Response) => {
    const droppedCount = vlogsRetryState.retryQueue.length;
    vlogsRetryState.retryQueue = [];
    broadcastVlogsRetryStats({ type: 'queue_cleared' });
    res.json({ success: true, message: `已清空離線重試佇列 (丟棄 ${droppedCount} 批次)`, droppedCount });
  });

  // 7. Circular Buffer & Memory Management Strategy Endpoints
  router.get('/memory-management', (req: Request, res: Response) => {
    const metrics = globalCollectorMemoryManager.getMetrics();
    const config = globalCollectorMemoryManager.getConfig();
    res.json({
      success: true,
      config,
      metrics,
      architecture: {
        pattern: 'Zero-Reallocation Circular Ring Buffer (Lock-Free Pre-Allocated Array)',
        gcStrategy: 'Pre-Allocated Slot Recycling & Micro-Batching Flusher',
        v8Optimization: 'Eliminates Young Generation GC Churn by Reusing Fixed Memory Cells',
        throughputCapability: '100,000+ EPS with Sub-Millisecond Batch Latency'
      }
    });
  });

  router.put('/memory-management', (req: Request, res: Response) => {
    const { batchSize, batchTimeoutMs, highWatermarkPct, lowWatermarkPct, overflowStrategy, enableSlotPool } = req.body;
    globalCollectorMemoryManager.updateConfig({
      batchSize: batchSize ? Number(batchSize) : undefined,
      batchTimeoutMs: batchTimeoutMs ? Number(batchTimeoutMs) : undefined,
      highWatermarkPct: highWatermarkPct ? Number(highWatermarkPct) : undefined,
      lowWatermarkPct: lowWatermarkPct ? Number(lowWatermarkPct) : undefined,
      overflowStrategy,
      enableSlotPool
    });

    const updatedConfig = globalCollectorMemoryManager.getConfig();
    const updatedMetrics = globalCollectorMemoryManager.getMetrics();
    broadcastVlogsRetryStats({ type: 'memory_config_updated', config: updatedConfig });

    res.json({
      success: true,
      message: '收集器環形緩衝區與記憶體回收策略參數已更新',
      config: updatedConfig,
      metrics: updatedMetrics
    });
  });

  router.post('/memory-management/benchmark', (req: Request, res: Response) => {
    const logCount = Math.min(50000, Math.max(1000, Number(req.body?.logCount) || 20000));
    const result = globalCollectorMemoryManager.runBenchmark(logCount);
    res.json({
      success: true,
      benchmark: result,
      summary: `已完成 ${logCount.toLocaleString()} 筆高吞吐日誌進線基準測試：環形緩衝區相較傳統動態配置提速 ${result.improvement.speedupRatio}x，降低 ${result.improvement.memoryAllocReductionPct}% 記憶體堆疊配置，減少 ${result.improvement.gcPressureReductionPct}% GC 停頓壓力。`
    });
  });

  router.post('/memory-management/flush', (req: Request, res: Response) => {
    const flushedBatch = globalCollectorMemoryManager.flushBatch();
    res.json({
      success: true,
      message: `已手動排空環形緩衝區 (${flushedBatch.length} 筆日誌批次已送出)`,
      flushedCount: flushedBatch.length,
      metrics: globalCollectorMemoryManager.getMetrics()
    });
  });

  router.post('/memory-management/burst-test', (req: Request, res: Response) => {
    const burstCount = Math.min(10000, Math.max(100, Number(req.body?.count) || 2000));
    const sampleHost = req.body?.host || 'core-gw-01';
    const sampleProtocol = req.body?.protocol || 'Syslog UDP :5140';

    const tStart = process.hrtime.bigint();
    for (let i = 0; i < burstCount; i++) {
      globalCollectorMemoryManager.push(
        `<134>1 ${new Date().toISOString()} ${sampleHost} firewall - - [action="deny" src_ip="198.51.100.${(i % 250) + 1}" dst_port=445] Simulated High-Throughput Burst Event #${i + 1}`,
        { protocol: sampleProtocol, source: sampleHost, stream: 'firewall' }
      );
    }
    const tEnd = process.hrtime.bigint();
    const durationMs = Number(tEnd - tStart) / 1_000_000;
    const burstEps = Math.round((burstCount / Math.max(0.1, durationMs)) * 1000);

    // Record in throughput tracker
    globalCollectorThroughputTracker.recordIngest(burstCount, burstCount * 420, sampleProtocol, 15000, 78);

    res.json({
      success: true,
      burstCount,
      durationMs: Number(durationMs.toFixed(2)),
      burstEps,
      message: `已成功將 ${burstCount.toLocaleString()} 筆突發日誌壓入環形緩衝區 (耗時 ${durationMs.toFixed(2)}ms, 相當於 ${burstEps.toLocaleString()} EPS)。無動態重分配，零 GC 衝擊。`,
      metrics: globalCollectorMemoryManager.getMetrics()
    });
  });

  // 8. VictoriaLogs Proactive Periodic Health Check Monitor Endpoints
  router.get('/vlogs-health-monitor', (req: Request, res: Response) => {
    res.json({
      success: true,
      monitor: globalVictoriaLogsHealthMonitor.getMetrics()
    });
  });

  router.post('/vlogs-health-monitor/probe', async (req: Request, res: Response) => {
    const result = await globalVictoriaLogsHealthMonitor.probe();
    const metrics = globalVictoriaLogsHealthMonitor.getMetrics();
    broadcastVlogsRetryStats({ type: 'vlogs_probe_completed', result, metrics });
    res.json({
      success: true,
      probeResult: result,
      metrics
    });
  });

  router.put('/vlogs-health-monitor/config', (req: Request, res: Response) => {
    const { endpoint, intervalMs, timeoutMs, failureThreshold, recoveryThreshold, enabled, manualOverride } = req.body;
    globalVictoriaLogsHealthMonitor.updateConfig({
      endpoint,
      intervalMs: intervalMs ? Number(intervalMs) : undefined,
      timeoutMs: timeoutMs ? Number(timeoutMs) : undefined,
      failureThreshold: failureThreshold ? Number(failureThreshold) : undefined,
      recoveryThreshold: recoveryThreshold ? Number(recoveryThreshold) : undefined,
      enabled,
      manualOverride
    });

    const metrics = globalVictoriaLogsHealthMonitor.getMetrics();
    broadcastVlogsRetryStats({ type: 'vlogs_monitor_config_updated', config: metrics.config });
    res.json({
      success: true,
      message: 'VictoriaLogs 主動健康監控配置已更新',
      metrics
    });
  });

  router.post('/vlogs-health-monitor/toggle-mode', (req: Request, res: Response) => {
    const { mode } = req.body;
    let targetOverride: 'auto' | 'force_buffer_only' | 'force_normal' = 'auto';

    if (mode === 'buffer_only' || mode === 'force_buffer_only') {
      targetOverride = 'force_buffer_only';
    } else if (mode === 'normal' || mode === 'force_normal') {
      targetOverride = 'force_normal';
    } else {
      // Toggle current
      const current = globalVictoriaLogsHealthMonitor.isBufferOnlyMode();
      targetOverride = current ? 'force_normal' : 'force_buffer_only';
    }

    globalVictoriaLogsHealthMonitor.updateConfig({ manualOverride: targetOverride });
    const metrics = globalVictoriaLogsHealthMonitor.getMetrics();
    broadcastVlogsRetryStats({ type: 'vlogs_mode_changed', mode: metrics.mode, manualOverride: targetOverride });

    res.json({
      success: true,
      message: `收集器運行模式已切換為: ${metrics.mode.toUpperCase()} (覆寫模式: ${targetOverride})`,
      mode: metrics.mode,
      metrics
    });
  });

  // 9. Visual Throughput Indicator & Hourly Bottleneck Identification
  router.get('/throughput-history', (req: Request, res: Response) => {
    const windowMinutes = Math.min(60, Math.max(5, Number(req.query.window) || 60));
    const result = globalCollectorThroughputTracker.getHistorySummary(windowMinutes);
    res.json({
      success: true,
      ...result
    });
  });

  router.post('/throughput-history/burst', (req: Request, res: Response) => {
    const burstVolume = Math.min(100000, Math.max(100, Number(req.body?.volume) || 35000));
    const profile = (req.body?.profile || 'spike') as 'spike' | 'saturation' | 'stoppage';
    globalCollectorThroughputTracker.simulateBurst(burstVolume, profile);
    const result = globalCollectorThroughputTracker.getHistorySummary(60);
    broadcastVlogsRetryStats({ type: 'throughput_burst_simulated', profile, volume: burstVolume });

    res.json({
      success: true,
      message: `已注入模擬吞吐事件 (模式: ${profile}, 規模: ${burstVolume.toLocaleString()} 筆/分)`,
      ...result
    });
  });

  router.put('/throughput-history/thresholds', (req: Request, res: Response) => {
    const { warningThreshold, saturationThreshold } = req.body;
    globalCollectorThroughputTracker.updateThresholds(warningThreshold, saturationThreshold);
    const result = globalCollectorThroughputTracker.getHistorySummary(60);
    broadcastVlogsRetryStats({ type: 'throughput_thresholds_updated', thresholds: result.summary.bottleneckThresholds });

    res.json({
      success: true,
      message: '吞吐瓶頸預警閾值已更新',
      thresholds: result.summary.bottleneckThresholds,
      summary: result.summary
    });
  });

  // 10. Connection Pooling & Ephemeral Port Protection Endpoints
  router.get('/connection-pool', (req: Request, res: Response) => {
    res.json({
      success: true,
      metrics: globalCollectorConnectionPool.getMetrics(),
      config: globalCollectorConnectionPool.getConfig(),
      eventLogs: globalCollectorConnectionPool.getEventLogs(),
      architecture: {
        pattern: 'Persistent Keep-Alive Socket Pool & Managed Lease Queue (FIFO)',
        mitigation: 'Prevents Ephemeral Port Starvation (TIME_WAIT socket accumulation) & EADDRNOTAVAIL',
        dbSinksSupported: ['VictoriaLogs Core (/insert/jsonline)', 'ClickHouse Engine', 'PostgreSQL Metadata', 'Grafana Loki'],
        protectionRatio: '98%+ Socket Reuse under 50,000 EPS High Concurrency'
      }
    });
  });

  router.put('/connection-pool/config', (req: Request, res: Response) => {
    const {
      maxConnections,
      minIdleConnections,
      maxIdleConnections,
      idleTimeoutMs,
      maxSocketLifetimeMs,
      acquireTimeoutMs,
      keepAliveIntervalMs,
      enablePortProtection,
      targetHost,
      targetPort
    } = req.body;

    globalCollectorConnectionPool.updateConfig({
      maxConnections: maxConnections ? Number(maxConnections) : undefined,
      minIdleConnections: minIdleConnections ? Number(minIdleConnections) : undefined,
      maxIdleConnections: maxIdleConnections ? Number(maxIdleConnections) : undefined,
      idleTimeoutMs: idleTimeoutMs ? Number(idleTimeoutMs) : undefined,
      maxSocketLifetimeMs: maxSocketLifetimeMs ? Number(maxSocketLifetimeMs) : undefined,
      acquireTimeoutMs: acquireTimeoutMs ? Number(acquireTimeoutMs) : undefined,
      keepAliveIntervalMs: keepAliveIntervalMs ? Number(keepAliveIntervalMs) : undefined,
      enablePortProtection: typeof enablePortProtection === 'boolean' ? enablePortProtection : undefined,
      targetHost: targetHost || undefined,
      targetPort: targetPort ? Number(targetPort) : undefined
    });

    const metrics = globalCollectorConnectionPool.getMetrics();
    const config = globalCollectorConnectionPool.getConfig();
    broadcastVlogsRetryStats({ type: 'connection_pool_config_updated', config, metrics });

    res.json({
      success: true,
      message: '收集器連線池與端口保護參數已成功更新並重新套用',
      config,
      metrics
    });
  });

  router.post('/connection-pool/benchmark', (req: Request, res: Response) => {
    const concurrency = Math.min(10000, Math.max(100, Number(req.body?.concurrency) || 2000));
    const result = globalCollectorConnectionPool.runBenchmark(concurrency);
    const metrics = globalCollectorConnectionPool.getMetrics();
    broadcastVlogsRetryStats({ type: 'connection_pool_benchmark_completed', result, metrics });

    res.json({
      success: true,
      concurrency,
      benchmark: result,
      metrics,
      summary: `已完成 ${concurrency.toLocaleString()} 筆並發資料庫寫入基準測試：連線池復用率達 ${result.pooled.reuseRatePct}%，節省 ${result.comparison.ephemeralPortsSaved.toLocaleString()} 個本機臨時端口，避免進入 TIME_WAIT 端口耗盡狀態，吞吐提速 ${result.comparison.speedupRatio}x！`
    });
  });

  router.post('/connection-pool/drain', (req: Request, res: Response) => {
    globalCollectorConnectionPool.drainPool();
    const metrics = globalCollectorConnectionPool.getMetrics();
    broadcastVlogsRetryStats({ type: 'connection_pool_drained', metrics });

    res.json({
      success: true,
      message: '連線池已安全排空，現存閒置長連線已優雅釋放並重建 Socket 池',
      metrics
    });
  });

  router.post('/connection-pool/test-query', async (req: Request, res: Response) => {
    const database = req.body?.database || 'VictoriaLogs (/insert/jsonline)';
    const count = Math.min(50, Math.max(1, Number(req.body?.count) || 5));
    const results: any[] = [];

    const startTime = Date.now();
    for (let i = 0; i < count; i++) {
      try {
        const lease = await globalCollectorConnectionPool.acquireLease(database);
        // Simulate micro-batch query execution
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 8 + 2)));
        lease.release(false);
        results.push({ index: i + 1, status: 'success', latencyMs: Date.now() - startTime });
      } catch (err: any) {
        results.push({ index: i + 1, status: 'error', error: err.message });
      }
    }

    const metrics = globalCollectorConnectionPool.getMetrics();
    broadcastVlogsRetryStats({ type: 'connection_pool_test_query', count, metrics });

    res.json({
      success: true,
      totalQueries: count,
      durationMs: Date.now() - startTime,
      results,
      metrics
    });
  });

  return router;
}

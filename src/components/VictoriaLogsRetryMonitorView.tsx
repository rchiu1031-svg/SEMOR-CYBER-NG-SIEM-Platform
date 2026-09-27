import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  TrendingUp,
  Server,
  Layers,
  Database,
  Radio,
  RefreshCw,
  Play,
  Pause,
  Copy,
  Check,
  Flame,
  ArrowRight,
  Download,
  FileSpreadsheet,
  HeartPulse,
  Gauge,
  BarChart3,
  TrendingDown,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';

export interface HealthMonitorData {
  mode: 'normal' | 'buffer_only';
  outageFlagged: boolean;
  outageReason: string;
  outageStartedAt: string | null;
  outageDurationSec: number;
  restorationAt: string | null;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalProbes: number;
  successfulProbes: number;
  failedProbes: number;
  lastProbeTime: string;
  lastProbeLatencyMs: number;
  lastProbeStatus: 'healthy' | 'unhealthy' | 'timeout' | 'simulated_outage';
  lastProbeMessage: string;
  config: {
    endpoint: string;
    intervalMs: number;
    timeoutMs: number;
    failureThreshold: number;
    recoveryThreshold: number;
    enabled: boolean;
    manualOverride: 'auto' | 'force_buffer_only' | 'force_normal';
  };
  recentProbes: Array<{
    timestamp: string;
    status: string;
    statusCode?: number;
    latencyMs: number;
    message: string;
    mode: string;
  }>;
}

interface RetryStatsResponse {
  success: boolean;
  targetURL: string;
  healthMonitor?: HealthMonitorData;
  config: {
    initialIntervalMs: number;
    maxIntervalMs: number;
    multiplier: number;
    jitterFraction: number;
    maxRetries: number;
    queueCapacity: number;
  };
  stats: {
    totalPostRequests: number;
    successfulRequests: number;
    initialFailures: number;
    retryAttemptsTotal: number;
    retrySuccessTotal: number;
    queuedDueToOutage: number;
    queueDrainedSuccess: number;
    currentQueueDepth: number;
    currentBackoffMs: number;
    isTargetReachable: boolean;
    lastError: string;
    lastErrorTime: string;
    lastSuccessTime: string;
    simulatedOutage: boolean;
    simulatedFailureCode: number;
  };
  heartbeatProbe?: {
    intervalSeconds: number;
    totalHeartbeatsLogged: number;
    lastProbe: {
      timestamp: string;
      uptimeSeconds: number;
      bufferDepth: number;
      bufferCapacity: number;
      bufferDepthPercentage: number;
      activeWorkers: number;
      totalWorkers: number;
      throughputEps: number;
      isHealthy: boolean;
      victoriaLogsStatus: string;
      queueDepth: number;
      totalPosts: number;
    };
  };
  ingestionVolumeLastHour?: {
    summary: {
      totalLogsLastHour: number;
      avgLogsPerMinute: number;
      peakLogsPerMinute: number;
      minLogsPerMinute: number;
      currentLogsPerMinute: number;
      currentEps: number;
      totalBytesMBLastHour: number;
      peakEpsLastHour: number;
    };
    points: Array<{
      minute: string;
      timestamp: string;
      volume: number;
      avgEps: number;
      peakEps: number;
      bytesMB: number;
      successRate: number;
      failureCount: number;
    }>;
  };
  recentRetryLogs: Array<{
    timestamp: string;
    level: string;
    message: string;
    attempt: number;
    delayMs: number;
    isHeartbeat?: boolean;
  }>;
}

export function VictoriaLogsRetryMonitorView() {
  const [data, setData] = useState<RetryStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [injectResult, setInjectResult] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Real-time synchronization state
  const [activeSyncMode, setActiveSyncMode] = useState<'websocket' | 'polling'>('websocket');
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'disconnected'>('connecting');
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<number>(1500); // 1.5s
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [lastReceivedAt, setLastReceivedAt] = useState<Date | null>(null);
  const [wsLatencyMs, setWsLatencyMs] = useState<number | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'heartbeat' | 'info'>('all');
  const [isTriggeringHeartbeat, setIsTriggeringHeartbeat] = useState(false);
  const [isProbingNow, setIsProbingNow] = useState(false);
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [showMonitorSettings, setShowMonitorSettings] = useState(false);
  const [monitorConfigInput, setMonitorConfigInput] = useState({
    intervalMs: 5000,
    failureThreshold: 2,
    recoveryThreshold: 2
  });

  const hm = data?.healthMonitor;

  const handleProbeNow = async () => {
    setIsProbingNow(true);
    try {
      const res = await fetch('/api/engine/collector/vlogs-health-monitor/probe', { method: 'POST' });
      const json = await res.json();
      if (json.metrics && isMountedRef.current) {
        setData(prev => prev ? { ...prev, healthMonitor: json.metrics } : null);
      }
    } catch (e) {
      console.error('Failed to trigger manual probe:', e);
    } finally {
      setIsProbingNow(false);
    }
  };

  const handleToggleBufferOnly = async () => {
    setIsTogglingMode(true);
    try {
      const res = await fetch('/api/engine/collector/vlogs-health-monitor/toggle-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.metrics && isMountedRef.current) {
        setData(prev => prev ? { ...prev, healthMonitor: json.metrics } : null);
      }
    } catch (e) {
      console.error('Failed to toggle buffer mode:', e);
    } finally {
      setIsTogglingMode(false);
    }
  };

  const handleSaveMonitorConfig = async () => {
    try {
      const res = await fetch('/api/engine/collector/vlogs-health-monitor/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitorConfigInput)
      });
      const json = await res.json();
      if (json.metrics && isMountedRef.current) {
        setData(prev => prev ? { ...prev, healthMonitor: json.metrics } : null);
      }
      setShowMonitorSettings(false);
    } catch (e) {
      console.error('Failed to update monitor config:', e);
    }
  };

  // 60-Minute Log Ingestion Volume Line Chart controls
  const [chartMetricMode, setChartMetricMode] = useState<'volume' | 'eps' | 'dual'>('volume');
  const [showAvgReferenceLine, setShowAvgReferenceLine] = useState<boolean>(true);
  const [chartZoomRange, setChartZoomRange] = useState<'all' | 'last30m' | 'last15m'>('all');

  const chartData = useMemo(() => {
    let pts = data?.ingestionVolumeLastHour?.points;
    if (!pts || pts.length === 0) {
      const now = Date.now();
      pts = Array.from({ length: 60 }, (_, i) => {
        const t = new Date(now - (59 - i) * 60 * 1000);
        const minStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const cycle = Math.sin((t.getTime() / (1000 * 60 * 12))) * 55000 + Math.cos((t.getTime() / (1000 * 60 * 28))) * 38000;
        const volume = Math.max(150000, 525000 + Math.floor(cycle));
        const avgEps = Math.round(volume / 60);
        return {
          minute: minStr,
          timestamp: t.toISOString(),
          volume,
          avgEps,
          peakEps: Math.round(avgEps * 1.15),
          bytesMB: Number(((volume * 340) / (1024 * 1024)).toFixed(1)),
          successRate: 100,
          failureCount: 0
        };
      });
    }

    if (chartZoomRange === 'last15m') {
      return pts.slice(-15);
    }
    if (chartZoomRange === 'last30m') {
      return pts.slice(-30);
    }
    return pts;
  }, [data?.ingestionVolumeLastHour?.points, chartZoomRange]);

  const chartSummary = useMemo(() => {
    if (data?.ingestionVolumeLastHour?.summary && chartZoomRange === 'all') {
      return data.ingestionVolumeLastHour.summary;
    }
    const total = chartData.reduce((s, p) => s + p.volume, 0);
    const avg = Math.round(total / Math.max(1, chartData.length));
    const peak = chartData.length > 0 ? Math.max(...chartData.map(p => p.volume)) : 0;
    const current = chartData[chartData.length - 1]?.volume || 0;
    const currentEps = chartData[chartData.length - 1]?.avgEps || 0;
    const totalMB = Number(chartData.reduce((s, p) => s + p.bytesMB, 0).toFixed(1));
    const peakEps = chartData.length > 0 ? Math.max(...chartData.map(p => p.peakEps)) : 0;
    return {
      totalLogsLastHour: total,
      avgLogsPerMinute: avg,
      peakLogsPerMinute: peak,
      minLogsPerMinute: chartData.length > 0 ? Math.min(...chartData.map(p => p.volume)) : 0,
      currentLogsPerMinute: current,
      currentEps,
      totalBytesMBLastHour: totalMB,
      peakEpsLastHour: peakEps
    };
  }, [data?.ingestionVolumeLastHour?.summary, chartData, chartZoomRange]);

  // Relative time ticker for "X seconds ago"
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(Date.now());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const [testPayload, setTestPayload] = useState(
    JSON.stringify([
      {
        _msg: `<134>1 ${new Date().toISOString()} fgt-edge-01 ftgd - - [action="deny" src_ip="198.51.100.77" dst_ip="10.0.4.12" dst_port=3389] RDP Brute-force Blocked`,
        host: "fgt-edge-01",
        stream: "firewall",
        severity: "Critical",
        action: "deny"
      },
      {
        _msg: `<189>1 ${new Date().toISOString()} srv-db-core mysqld 9812 - [user="admin" src_ip="10.0.4.55" action="query_fail"] Deadlock detected`,
        host: "srv-db-core",
        stream: "database",
        severity: "Warning",
        action: "deadlock"
      }
    ], null, 2)
  );

  // Clock ticker every second to compute live relative time
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // REST API fetch helper
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/collector/victorialogs-retry-stats');
      const json = await res.json();
      if (json.success && isMountedRef.current) {
        setData(json);
        setUpdateCount(c => c + 1);
        setLastReceivedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch retry stats:', err);
    }
  };

  // WebSocket Connection Management
  useEffect(() => {
    isMountedRef.current = true;

    if (!isLiveActive || activeSyncMode !== 'websocket') {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
      return;
    }

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        setWsStatus('connecting');

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setWsStatus('connected');
          // Subscribe specifically to collector retry diagnostics
          ws.send(JSON.stringify({ type: 'subscribe_collector_diagnostics' }));
          
          // Measure latency with an initial ping
          const start = Date.now();
          ws.send(JSON.stringify({ type: 'ping', sendTime: start }));
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'collector_retry_stats' && msg.data) {
              setData(msg.data);
              setUpdateCount(c => c + 1);
              setLastReceivedAt(new Date());
            } else if (msg.type === 'pong') {
              if (msg.timestamp) {
                setWsLatencyMs(Math.max(1, Date.now() - msg.timestamp));
              }
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setWsStatus('disconnected');
          // Reconnect with exponential backoff if live streaming is still requested
          if (isLiveActive && activeSyncMode === 'websocket') {
            reconnectTimeoutRef.current = setTimeout(() => {
              setWsStatus('reconnecting');
              connectWebSocket();
            }, 3000);
          }
        };

        ws.onerror = () => {
          if (!isMountedRef.current) return;
          setWsStatus('disconnected');
        };
      } catch (err) {
        console.error('WebSocket connection initialization error:', err);
        setWsStatus('disconnected');
      }
    };

    connectWebSocket();

    // Ping every 8 seconds to monitor latency and keep alive
    const pingTimer = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 8000);

    return () => {
      clearInterval(pingTimer);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'unsubscribe_collector_diagnostics' }));
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [isLiveActive, activeSyncMode]);

  // Polling Fallback or explicit Polling Mode
  useEffect(() => {
    // If polling mode is selected OR WebSocket is disconnected while streaming is enabled
    const shouldUsePolling = isLiveActive && (activeSyncMode === 'polling' || wsStatus === 'disconnected');

    if (!shouldUsePolling) return;

    fetchStats();
    const timer = setInterval(fetchStats, pollingInterval);
    return () => clearInterval(timer);
  }, [isLiveActive, activeSyncMode, wsStatus, pollingInterval]);

  // Initial fetch on mount
  useEffect(() => {
    fetchStats();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Trigger single test batch forward
  const handleTriggerForward = async () => {
    setIsInjecting(true);
    setInjectResult(null);
    try {
      let parsed = [];
      try {
        parsed = JSON.parse(testPayload);
      } catch (e) {
        parsed = testPayload.split('\n').filter(Boolean);
      }

      const res = await fetch('/api/v1/collector/forward-victorialogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: parsed })
      });
      const resJson = await res.json();
      setInjectResult(resJson);
      // Immediate fetch if polling
      if (activeSyncMode === 'polling') fetchStats();
    } catch (err: any) {
      setInjectResult({ success: false, error: err.message });
    } finally {
      setIsInjecting(false);
    }
  };

  // Trigger rapid burst of 5 batches to demonstrate zero-loss queue accumulation & backoff
  const handleTriggerBurst = async () => {
    setIsBursting(true);
    setInjectResult(null);
    try {
      const promises = [1, 2, 3, 4, 5].map((idx) =>
        fetch('/api/v1/collector/forward-victorialogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs: [
              {
                _msg: `<134>1 ${new Date().toISOString()} burst-test-${idx} daemon - - [burst_seq=${idx}] Rapid Ingest Load Spike Simulation`,
                host: `burst-test-${idx}`,
                stream: 'burst_test',
                severity: 'Alert'
              }
            ]
          })
        }).then(r => r.json())
      );
      const results = await Promise.all(promises);
      const lastResult = results[results.length - 1];
      setInjectResult({
        ...lastResult,
        burstSummary: `已連續發送 5 批次突發日誌。成功: ${results.filter(r => r.success).length}，轉入保護佇列: ${results.filter(r => r.queued).length}`
      });
      if (activeSyncMode === 'polling') fetchStats();
    } catch (err: any) {
      setInjectResult({ success: false, error: err.message });
    } finally {
      setIsBursting(false);
    }
  };

  const handleToggleSimulation = async () => {
    if (!data) return;
    setIsLoading(true);
    try {
      await fetch('/api/v1/collector/simulate-victorialogs-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enable: !data.stats.simulatedOutage,
          failureCode: 503
        })
      });
      if (activeSyncMode === 'polling') await fetchStats();
    } catch (err) {
      console.error('Toggle simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyEndpointUrl = () => {
    if (data?.targetURL) {
      navigator.clipboard.writeText(data.targetURL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Export current retry attempt logs and network stability statistics as CSV for forensic analysis
  const handleExportCSV = () => {
    if (!data) return;
    setIsExporting(true);

    try {
      const now = new Date();
      const isoExportTime = now.toISOString();
      const localExportTime = now.toLocaleString('zh-TW', { hour12: false });
      const targetUrl = data.targetURL || 'http://localhost:9428/insert/jsonline';
      const stats = data.stats;
      const config = data.config;

      const totalReq = stats?.totalPostRequests || 0;
      const successReq = stats?.successfulRequests || 0;
      const successRate = totalReq > 0
        ? ((successReq / totalReq) * 100).toFixed(2) + '%'
        : '100.00%';

      const rows: string[] = [];

      // SECTION 1: Forensic Network Stability Audit Metadata
      rows.push('# ==========================================================================================');
      rows.push('# VICTORIALOGS INGESTION GATEWAY - NETWORK STABILITY & RETRY FORENSIC AUDIT REPORT');
      rows.push('# ==========================================================================================');
      rows.push('METRIC_KEY,METRIC_VALUE,FORENSIC_NOTES');
      rows.push(`Report_Generated_At_ISO,"${isoExportTime}","Standard ISO8601 audit timestamp"`);
      rows.push(`Report_Generated_At_Local,"${localExportTime}","Local analysis timestamp"`);
      rows.push(`Target_Endpoint_URL,"${targetUrl}","VictoriaLogs Ingest JSONLine HTTP API"`);
      rows.push(`Target_Reachability,"${stats?.isTargetReachable ? 'REACHABLE_HEALTHY' : 'UNREACHABLE_DEGRADED'}","Real-time probe state at export"`);
      rows.push(`Simulated_Outage_Active,"${stats?.simulatedOutage ? 'TRUE (HTTP ' + stats.simulatedFailureCode + ')' : 'FALSE'}","Chaos engineering fault injection flag"`);
      rows.push(`Total_POST_Requests,"${totalReq}","Cumulative batch write attempts"`);
      rows.push(`Successful_POST_Requests,"${successReq}","Batches successfully ingested into VictoriaLogs"`);
      rows.push(`Ingestion_Reliability_Rate,"${successRate}","Overall delivery delivery success percentage"`);
      rows.push(`Initial_Write_Failures,"${stats?.initialFailures || 0}","Batches failing on 1st attempt requiring retry"`);
      rows.push(`Total_Retry_Attempts,"${stats?.retryAttemptsTotal || 0}","Cumulative exponential backoff attempts executed"`);
      rows.push(`Retry_Healed_Successes,"${stats?.retrySuccessTotal || 0}","Batches successfully delivered after backoff retries"`);
      rows.push(`Queued_Due_To_Outage,"${stats?.queuedDueToOutage || 0}","Batches exceeding max retries saved to zero-loss queue"`);
      rows.push(`Queue_Drained_Successes,"${stats?.queueDrainedSuccess || 0}","Offline queued batches successfully flushed after recovery"`);
      rows.push(`Current_Queue_Depth,"${stats?.currentQueueDepth || 0}","Unsent batches currently in memory protection queue"`);
      rows.push(`Active_Backoff_Delay_Ms,"${stats?.currentBackoffMs || 0}","Current dynamic exponential backoff delay window"`);
      rows.push(`Last_Successful_POST_Timestamp,"${stats?.lastSuccessTime || 'None'}","Timestamp of most recent confirmed delivery"`);
      rows.push(`Last_Error_Timestamp,"${stats?.lastErrorTime || 'None'}","Timestamp of most recent network or HTTP failure"`);
      rows.push(`Last_Error_Message,"${(stats?.lastError || 'None').replace(/"/g, '""')}","Detailed error reason"`);
      rows.push(`Config_Initial_Interval_Ms,"${config?.initialIntervalMs || 200}","Base backoff duration for retry #1"`);
      rows.push(`Config_Max_Interval_Ms,"${config?.maxIntervalMs || 15000}","Maximum ceiling for exponential backoff"`);
      rows.push(`Config_Multiplier,"${config?.multiplier || 2.0}x","Exponential backoff multiplier"`);
      rows.push(`Config_Jitter_Fraction,"±${((config?.jitterFraction || 0.15) * 100).toFixed(0)}%","Full Jitter variance ratio to prevent thundering herd"`);
      rows.push(`Config_Max_Retries,"${config?.maxRetries || 5}","Max in-place retries before zero-loss queue buffering"`);
      rows.push(`Config_Queue_Capacity,"${config?.queueCapacity || 5000}","Max buffer capacity in memory"`);
      rows.push('');
      rows.push('# ==========================================================================================');
      rows.push('# RETRY ATTEMPT & NETWORK STABILITY DETAILED EVENT LOGS');
      rows.push('# ==========================================================================================');
      rows.push('Log_Index,Timestamp_ISO8601,Timestamp_Local,Severity_Level,Attempt_Number,Backoff_Delay_Ms,Target_Endpoint,Forensic_Classification,Event_Message');

      const logs = data.recentRetryLogs || [];
      if (logs.length === 0) {
        rows.push(`1,"${isoExportTime}","${localExportTime}",INFO,0,0,"${targetUrl}",NORMAL_STATUS,"目前無重試事件或網路錯誤紀錄，連線運作正常"`);
      } else {
        logs.forEach((log, index) => {
          const localTime = new Date(log.timestamp).toLocaleString('zh-TW', { hour12: false });
          let classification = 'STATUS_UPDATE';
          if (log.isHeartbeat || log.message.includes('心跳') || log.message.includes('Heartbeat')) {
            classification = 'COLLECTOR_HEARTBEAT_30S';
          } else if (log.level === 'error') {
            classification = log.attempt >= (config?.maxRetries || 5) ? 'MAX_RETRIES_EXHAUSTED_QUEUED' : 'BACKOFF_RETRY_FAILED';
          } else if (log.level === 'warn') {
            classification = log.message.includes('模擬') ? 'FAULT_SIMULATION_ACTIVE' : 'RETRY_WARNING';
          } else if (log.message.includes('排空') || log.message.includes('Drain')) {
            classification = 'OFFLINE_QUEUE_FLUSHED';
          } else if (log.attempt > 0) {
            classification = 'BACKOFF_RETRY_SELF_HEALED';
          }

          const escapedMsg = log.message ? `"${log.message.replace(/"/g, '""')}"` : '""';
          rows.push(`${index + 1},"${log.timestamp}","${localTime}",${log.level.toUpperCase()},${log.attempt},${log.delayMs || 0},"${targetUrl}",${classification},${escapedMsg}`);
        });
      }

      // SECTION 3: 60-Minute Log Ingestion Volume per Minute Time Series
      if (data.ingestionVolumeLastHour?.points && data.ingestionVolumeLastHour.points.length > 0) {
        rows.push('');
        rows.push('# ==========================================================================================');
        rows.push('# SECTION 3: 60-MINUTE LOG INGESTION VOLUME & THROUGHPUT TIME SERIES (LAST 1 HOUR)');
        rows.push('# ==========================================================================================');
        rows.push('Minute_Window,Timestamp_ISO8601,Logs_Ingested_Count,Average_EPS,Peak_EPS,Volume_MB,Delivery_Success_Rate_Pct,Failure_Count');
        data.ingestionVolumeLastHour.points.forEach((pt) => {
          rows.push(`"${pt.minute}","${pt.timestamp}",${pt.volume},${pt.avgEps},${pt.peakEps},${pt.bytesMB},"${pt.successRate}%",${pt.failureCount}`);
        });
      }

      // Add UTF-8 BOM (\uFEFF) to guarantee correct rendering of Chinese and special chars in Excel & Google Sheets
      const csvContent = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeFilenameTime = isoExportTime.replace(/[:.]/g, '-');
      link.setAttribute('href', url);
      link.setAttribute('download', `victorialogs-retry-forensic-report-${safeFilenameTime}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export CSV report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const s = data?.stats;
  const c = data?.config;

  // Compute live relative time elapsed since last successful POST
  const relativeLastSuccess = useMemo(() => {
    if (!s?.lastSuccessTime) return '尚未有成功寫入紀錄';
    const diffMs = currentTimeTick - new Date(s.lastSuccessTime).getTime();
    if (diffMs < 0) return '剛剛';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 2) return '剛剛 (Just now)';
    if (sec < 60) return `${sec} 秒前`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} 分鐘前`;
    const hours = Math.floor(min / 60);
    return `${hours} 小時前`;
  }, [s?.lastSuccessTime, currentTimeTick]);

  // Compute live relative time elapsed since last received WS/polling update
  const relativeLastUpdate = useMemo(() => {
    if (!lastReceivedAt) return '連線中...';
    const diffMs = currentTimeTick - lastReceivedAt.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 2) return '剛剛更新';
    return `${sec} 秒前`;
  }, [lastReceivedAt, currentTimeTick]);

  // Manual trigger for 30s lightweight heartbeat probe
  const handleTriggerHeartbeatProbe = async () => {
    setIsTriggeringHeartbeat(true);
    try {
      await fetch('/api/v1/collector/heartbeat-probe', { method: 'POST' });
      if (activeSyncMode === 'polling') await fetchStats();
    } catch (e) {
      console.error('Trigger heartbeat error:', e);
    } finally {
      setIsTriggeringHeartbeat(false);
    }
  };

  // Next 30-second probe countdown (0..30s)
  const nextProbeCountdown = useMemo(() => {
    const secInCycle = Math.floor(currentTimeTick / 1000) % 30;
    return 30 - secInCycle;
  }, [currentTimeTick]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!data?.recentRetryLogs) return [];
    if (logFilter === 'all') return data.recentRetryLogs;
    if (logFilter === 'heartbeat') return data.recentRetryLogs.filter(l => l.isHeartbeat || l.message.includes('心跳') || l.message.includes('Heartbeat'));
    return data.recentRetryLogs.filter(l => l.level === logFilter && !l.isHeartbeat && !l.message.includes('心跳'));
  }, [data?.recentRetryLogs, logFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-Time Stream Engine Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Resilient Transport Layer
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Zero-Loss Buffer Guarantee
              </span>

              {/* Real-time Connection State Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border bg-slate-950/70 border-slate-700">
                {activeSyncMode === 'websocket' ? (
                  <>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        wsStatus === 'connected'
                          ? 'bg-emerald-400 animate-pulse'
                          : wsStatus === 'connecting' || wsStatus === 'reconnecting'
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      WebSocket: {wsStatus === 'connected' ? '即時推播中 (Live)' : wsStatus === 'reconnecting' ? '重連中...' : '已斷線'}
                    </span>
                    {wsLatencyMs !== null && wsStatus === 'connected' && (
                      <span className="text-emerald-400 text-[10px]">({wsLatencyMs}ms)</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                      智慧輪詢: {pollingInterval / 1000}s 間隔
                    </span>
                  </>
                )}
              </div>

              {/* Live Updates Counter */}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                更新計數: #{updateCount} ({relativeLastUpdate})
              </span>
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-cyan-400" />
              VictoriaLogs POST 指數退避重試與防遺失即時診斷儀表板
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-4xl">
              收集器向 VictoriaLogs (<code className="text-slate-200 font-mono">POST /insert/jsonline</code>) 推送日誌遭遇網路抖動或暫態故障 (429, 500, 502, 503, 504) 時，
              即時透過 <strong>WebSocket 全雙工串流</strong> 與 <strong>智慧輪詢機制</strong> 即時推播連線狀態、退避序列與防遺失佇列深度，無需手動重新整理頁面。
            </p>
          </div>

          {/* Real-time Mode Controls & Failure Simulation */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Mode Switcher: WebSocket vs Polling */}
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center text-xs">
              <button
                onClick={() => setActiveSyncMode('websocket')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  activeSyncMode === 'websocket'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="啟用 WebSocket 全雙工零延遲即時推播"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                WebSocket 串流
              </button>
              <button
                onClick={() => setActiveSyncMode('polling')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  activeSyncMode === 'polling'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="啟用智慧定時自動輪詢"
              >
                <RefreshCw className="w-3 h-3 text-white" />
                定時輪詢
              </button>
            </div>

            {/* If Polling Mode: Interval selector */}
            {activeSyncMode === 'polling' && (
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value={1000}>1.0 秒更新</option>
                <option value={1500}>1.5 秒更新</option>
                <option value={3000}>3.0 秒更新</option>
                <option value={5000}>5.0 秒更新</option>
              </select>
            )}

            {/* Pause / Play Live Stream Toggle */}
            <button
              onClick={() => setIsLiveActive(!isLiveActive)}
              className={`p-2 rounded-lg border transition text-xs flex items-center gap-1.5 ${
                isLiveActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
              }`}
              title={isLiveActive ? '暫停即時串流更新' : '恢復即時串流更新'}
            >
              {isLiveActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">暫停</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">繼續</span>
                </>
              )}
            </button>

            {/* Outage Simulation Toggle */}
            <button
              onClick={handleToggleSimulation}
              disabled={isLoading}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-2 ${
                s?.simulatedOutage
                  ? 'bg-rose-950/90 border-rose-500/50 text-rose-300 hover:bg-rose-900/90 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {s?.simulatedOutage ? (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>關閉 503 斷線模擬</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>模擬 503 暫態故障</span>
                </>
              )}
            </button>

            {/* Export CSV Forensic Report Button */}
            <button
              onClick={handleExportCSV}
              disabled={!data || isExporting}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-2 shadow-sm ${
                exportSuccess
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40 hover:border-emerald-400/60'
              } disabled:opacity-50`}
              title="匯出當前退避重試紀錄與連線統計為 CSV 檔，用於長期網路穩定度鑑識分析"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>已匯出 CSV 報告</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>匯出 CSV 鑑識報告</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Proactive Health Check Monitor & Buffer-Only Mode Control Banner */}
      <div className={`rounded-xl border p-4 transition-all duration-300 shadow-md ${
        hm?.mode === 'buffer_only'
          ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/50 border-rose-500/60 shadow-rose-950/40'
          : 'bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border-emerald-500/40'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border mt-0.5 ${
              hm?.mode === 'buffer_only'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {hm?.mode === 'buffer_only' ? (
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  VictoriaLogs 端點主動健康監控與模式控制 (Proactive Health Check Monitor)
                </span>
                
                {/* Mode Badge */}
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                  hm?.mode === 'buffer_only'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hm?.mode === 'buffer_only' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                  運行模式: {hm?.mode === 'buffer_only' ? '純緩衝模式 (BUFFER-ONLY MODE)' : '線上即時串流 (ONLINE STREAMING)'}
                </span>

                {/* Override Flag */}
                {hm?.config?.manualOverride !== 'auto' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    管理員手動覆寫中 ({hm?.config?.manualOverride})
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                {hm?.mode === 'buffer_only' ? (
                  <>
                    <strong className="text-rose-300 font-semibold">⚠️ 觸發離線保護：</strong>
                    端點探針偵測到 VictoriaLogs 服務中斷（<code className="text-rose-200 bg-rose-950/60 px-1 py-0.5 rounded font-mono">{hm.outageReason || '端點連線異常'}</code>）。
                    收集器已全面切換至純緩衝模式，<strong>停止一切下游 HTTP 發送與重試超時等待</strong>，以杜絕連線阻塞與 CPU 耗竭；所有進線日誌安全寫入環形緩衝區與防遺失佇列。
                    已持續保護: <span className="text-amber-300 font-mono font-bold">{hm.outageDurationSec} 秒</span>。
                    端點連續通過 <span className="text-cyan-300 font-mono font-bold">{hm.config?.recoveryThreshold || 2} 次</span> 健康檢查後將自動切換回線上模式並排空佇列（目前通過: {hm.consecutiveSuccesses}/{hm.config?.recoveryThreshold || 2}）。
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-300 font-semibold">✓ 監控狀態正常：</strong>
                    週期性探針以每 <span className="text-white font-mono font-bold">{hm?.config?.intervalMs ? hm.config.intervalMs / 1000 : 5} 秒</span> 頻率主動檢測端點健康。
                    最近一次探測於 <span className="text-slate-200 font-mono">{hm?.lastProbeTime ? new Date(hm.lastProbeTime).toLocaleTimeString() : '---'}</span> 完成，
                    延遲 <span className="text-emerald-300 font-mono font-bold">{hm?.lastProbeLatencyMs || 0}ms</span>，累計通過 <span className="text-cyan-300 font-mono font-bold">{hm?.consecutiveSuccesses || 0} 次</span> 連續探測。
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Control Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            <button
              onClick={handleProbeNow}
              disabled={isProbingNow}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="立即對 VictoriaLogs /health 發起一次主動 HTTP 健康檢查"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbingNow ? 'animate-spin' : ''}`} />
              {isProbingNow ? '探測中...' : '立即主動探測'}
            </button>

            <button
              onClick={handleToggleBufferOnly}
              disabled={isTogglingMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 shadow-sm ${
                hm?.mode === 'buffer_only'
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/50 text-amber-300'
              } disabled:opacity-50`}
              title="強制切換收集器運作模式"
            >
              <Layers className="w-3.5 h-3.5" />
              {hm?.mode === 'buffer_only' ? '切換為自動/正常模式' : '手動切換至純緩衝模式'}
            </button>

            <button
              onClick={() => setShowMonitorSettings(!showMonitorSettings)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="調校健康探針週期與失敗門檻"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Monitor Settings */}
        {showMonitorSettings && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg">
            <div>
              <label className="text-slate-400 block mb-1">主動探測週期 (Probe Interval):</label>
              <select
                value={monitorConfigInput.intervalMs}
                onChange={(e) => setMonitorConfigInput({ ...monitorConfigInput, intervalMs: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
              >
                <option value={2000}>2 秒 (高頻敏感)</option>
                <option value={5000}>5 秒 (標準推薦)</option>
                <option value={10000}>10 秒</option>
                <option value={30000}>30 秒</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">斷線判定門檻 (Failure Threshold):</label>
              <select
                value={monitorConfigInput.failureThreshold}
                onChange={(e) => setMonitorConfigInput({ ...monitorConfigInput, failureThreshold: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
              >
                <option value={1}>連續 1 次失敗 (立即切換純緩衝)</option>
                <option value={2}>連續 2 次失敗 (防突發抖動)</option>
                <option value={3}>連續 3 次失敗</option>
                <option value={5}>連續 5 次失敗</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">連線復原門檻 (Recovery Threshold):</label>
              <select
                value={monitorConfigInput.recoveryThreshold}
                onChange={(e) => setMonitorConfigInput({ ...monitorConfigInput, recoveryThreshold: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
              >
                <option value={1}>連續 1 次成功 (快速復原)</option>
                <option value={2}>連續 2 次成功 (穩定復原)</option>
                <option value={3}>連續 3 次成功</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSaveMonitorConfig}
                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition text-xs shadow-sm"
              >
                套用門檻設定
              </button>
            </div>
          </div>
        )}

        {/* Recent Probes History Tape */}
        {hm?.recentProbes && hm.recentProbes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] font-mono py-1">
            <span className="text-slate-500 shrink-0 font-sans text-xs flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
              探針足跡:
            </span>
            {hm.recentProbes.slice(0, 8).map((p, idx) => (
              <div
                key={idx}
                className={`px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 ${
                  p.status === 'healthy'
                    ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                    : p.status === 'simulated_outage'
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/50 border-amber-500/30 text-amber-300'
                }`}
                title={`${new Date(p.timestamp).toLocaleTimeString()}: ${p.message}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  p.status === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span>{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span className="text-[10px] text-slate-400">({p.latencyMs}ms)</span>
                <span className="font-bold">{p.statusCode ? `HTTP ${p.statusCode}` : p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 Metric Cards with Real-time Live Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Reachability & Target Endpoint */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-300">連線狀態 (Connection Status)</span>
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="font-mono text-xs text-white truncate max-w-[210px]"
                title={data?.targetURL || 'http://localhost:9428/insert/jsonline'}
              >
                {data?.targetURL || 'http://localhost:9428/insert/jsonline'}
              </div>
              <button
                onClick={copyEndpointUrl}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition shrink-0"
                title="複製端點 URL"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  s?.simulatedOutage
                    ? 'bg-rose-500 animate-ping'
                    : s?.isTargetReachable
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400 animate-bounce'
                }`}
              />
              <span className="text-white font-bold">
                {s?.simulatedOutage
                  ? '模擬斷線 (Simulated 503 Outage)'
                  : s?.isTargetReachable
                  ? '連線正常 (Connected & Active)'
                  : '重試連線中 (Retrying Connection)'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
              <span className="truncate">
                {s?.simulatedOutage
                  ? '503 故障注入測試啟動中'
                  : s?.lastError
                  ? `錯誤: ${s.lastError}`
                  : '握手良好 (HTTP 200/204)'}
              </span>
              <span className="text-emerald-400 font-mono font-bold shrink-0 ml-1">
                {s?.isTargetReachable ? 'Online' : 'Degraded'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Last Successful POST Timestamp */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-300">前次成功寫入 (Last Successful POST)</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-300 font-mono">
              {s?.lastSuccessTime ? (
                <div>
                  <div className="text-base text-emerald-200">
                    {new Date(s.lastSuccessTime).toLocaleTimeString()}
                  </div>
                  <div className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
                    ⏱️ {relativeLastSuccess}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs font-normal py-1">
                  尚無寫入紀錄 (待測試觸發)
                </div>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>累計成功推送:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {s?.successfulRequests || 0} 批次
            </span>
          </div>
        </div>

        {/* Card 3: Backoff Parameters & Jitter Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-300">指數退避參數 (Backoff Curve)</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {c?.initialIntervalMs || 200}ms <span className="text-xs text-slate-400 font-normal">→ {c?.maxIntervalMs || 15000}ms</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>倍率乘數: <span className="text-cyan-300 font-mono font-bold">{c?.multiplier || 2}x</span></span>
              <span>隨機抖動: <span className="text-cyan-300 font-mono font-bold">±15% Full Jitter</span></span>
            </div>
            <div className="text-[10px] text-slate-400">
              就地上限: <span className="text-cyan-300 font-mono font-bold">{c?.maxRetries || 5} 次</span> (超額轉存零遺失佇列)
            </div>
          </div>
        </div>

        {/* Card 4: Retry Counts & Outage Zero-Loss Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-300">退避重試與保護佇列 (Retry & Queue)</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <div className="text-lg font-bold text-amber-300">
                {s?.retryAttemptsTotal || 0} <span className="text-xs text-slate-400 font-normal">次重試</span>
              </div>
              <div className="text-sm font-bold">
                <span className={s && s.currentQueueDepth > 0 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-emerald-400'}>
                  {s?.currentQueueDepth || 0}
                </span>
                <span className="text-xs text-slate-400 font-normal"> 待排空佇列</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>退避修復: <span className="text-emerald-400 font-mono font-bold">{s?.retrySuccessTotal || 0}</span></span>
            <span>佇列已排空: <span className="text-cyan-400 font-mono font-bold">{s?.queueDrainedSuccess || 0}</span></span>
          </div>
        </div>
      </div>

      {/* 30s Lightweight Heartbeat Probe Component Card */}
      {data?.heartbeatProbe && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
                <HeartPulse className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    收集器內部狀態 30s 輕量級心跳探針 (Heartbeat Probe)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {data.heartbeatProbe.lastProbe?.isHealthy !== false ? 'HEALTHY (狀態正常)' : 'DEGRADED (降級監控)'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    週期: 30 秒 | 累計心跳: #{data.heartbeatProbe.totalHeartbeatsLogged} 次
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  收集器背景協程每 30 秒自動探測並記錄環形緩衝深度、工作池並行數、即時吞吐與 VictoriaLogs 鏈路狀態至診斷事件串流。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
              {/* Countdown Badge */}
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">下次自動探針:</span>
                <span className="text-cyan-300 font-bold w-6 text-right">{nextProbeCountdown}s</span>
              </div>

              {/* Manual Trigger Probe Button */}
              <button
                onClick={handleTriggerHeartbeatProbe}
                disabled={isTriggeringHeartbeat}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold border border-indigo-500/40 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                title="立即發送一次輕量級收集器內部狀態心跳探針"
              >
                <HeartPulse className={`w-3.5 h-3.5 ${isTriggeringHeartbeat ? 'animate-spin' : ''}`} />
                <span>{isTriggeringHeartbeat ? '探測中...' : '立即探測'}</span>
              </button>
            </div>
          </div>

          {/* 4 Internal State Metrics Pill-Row */}
          {data.heartbeatProbe.lastProbe && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block mb-0.5">環形接收緩衝 (Ring Buffer)</span>
                <span className="text-cyan-300 font-bold">
                  {data.heartbeatProbe.lastProbe.bufferDepth.toLocaleString()} / {data.heartbeatProbe.lastProbe.bufferCapacity.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({data.heartbeatProbe.lastProbe.bufferDepthPercentage}%)
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block mb-0.5">並行工作池 (Worker Pool)</span>
                <span className="text-emerald-300 font-bold">
                  {data.heartbeatProbe.lastProbe.activeWorkers} / {data.heartbeatProbe.lastProbe.totalWorkers}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({Math.round((data.heartbeatProbe.lastProbe.activeWorkers / data.heartbeatProbe.lastProbe.totalWorkers) * 100)}%)
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block mb-0.5">進線吞吐量 (Ingest EPS)</span>
                <span className="text-indigo-300 font-bold">
                  {data.heartbeatProbe.lastProbe.throughputEps.toLocaleString()} EPS
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  (~{(data.heartbeatProbe.lastProbe.throughputEps * 0.00035).toFixed(2)} MB/s)
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block mb-0.5">VictoriaLogs 鏈路狀態</span>
                <span className={`font-bold truncate block ${
                  data.heartbeatProbe.lastProbe.victoriaLogsStatus.includes('503')
                    ? 'text-rose-400'
                    : data.heartbeatProbe.lastProbe.victoriaLogsStatus.includes('RETRY')
                    ? 'text-amber-400'
                    : 'text-emerald-300'
                }`}>
                  {data.heartbeatProbe.lastProbe.victoriaLogsStatus}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 60-Minute Log Ingestion Volume per Minute Line Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Header & Metric Mode Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">
                過去一小時每分鐘日誌接收吞吐量 (Log Ingestion Volume per Minute - Last 1 Hour)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                60m 滾動監控
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              即時追蹤每分鐘接收日誌筆數 (Logs/min) 與吞吐速率 (EPS) 波動，直觀反映突發流量高載與 VictoriaLogs 寫入穩定度
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center text-xs font-mono">
              <button
                onClick={() => setChartMetricMode('volume')}
                className={`px-2.5 py-1 rounded transition ${
                  chartMetricMode === 'volume'
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                日誌量 (Logs/min)
              </button>
              <button
                onClick={() => setChartMetricMode('eps')}
                className={`px-2.5 py-1 rounded transition ${
                  chartMetricMode === 'eps'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                速率 (EPS)
              </button>
              <button
                onClick={() => setChartMetricMode('dual')}
                className={`px-2.5 py-1 rounded transition ${
                  chartMetricMode === 'dual'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                雙指標對比
              </button>
            </div>

            {/* Time Zoom Range */}
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center text-xs font-mono">
              {(['all', 'last30m', 'last15m'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setChartZoomRange(range)}
                  className={`px-2 py-1 rounded text-[11px] transition ${
                    chartZoomRange === range
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range === 'all' ? '1小時 (60m)' : range === 'last30m' ? '30分鐘' : '15分鐘'}
                </button>
              ))}
            </div>

            {/* Reference Line Toggle */}
            <button
              onClick={() => setShowAvgReferenceLine(!showAvgReferenceLine)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 ${
                showAvgReferenceLine
                  ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
              title="切換顯示平均基準參考線"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>基準線</span>
            </button>
          </div>
        </div>

        {/* 4 Ingestion Throughput Statistics Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">過去 1 小時累計接收</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-cyan-300 font-bold text-base">
                {(chartSummary.totalLogsLastHour / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-slate-400 font-sans">logs</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              (~{(chartSummary.totalBytesMBLastHour / 1024).toFixed(2)} GB 資料吞吐)
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">平均每分鐘吞吐量</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-indigo-300 font-bold text-base">
                {chartSummary.avgLogsPerMinute.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">/min</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              (基準 ~{Math.round(chartSummary.avgLogsPerMinute / 60).toLocaleString()} EPS)
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">尖峰分鐘負載</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-amber-300 font-bold text-base">
                {chartSummary.peakLogsPerMinute.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">/min</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              (最高瞬間 {chartSummary.peakEpsLastHour.toLocaleString()} EPS)
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">當前即時寫入速率</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-emerald-300 font-bold text-base">
                {chartSummary.currentEps.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">EPS</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              (~{((chartSummary.currentLogsPerMinute * 340) / (1024 * 1024)).toFixed(1)} MB/min)
            </span>
          </div>
        </div>

        {/* Recharts Responsive Line Chart */}
        <div className="w-full h-64 bg-slate-950/60 rounded-xl border border-slate-800/80 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 24, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis
                dataKey="minute"
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                interval={chartZoomRange === 'last15m' ? 1 : chartZoomRange === 'last30m' ? 2 : 4}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                tickFormatter={(val: number) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${Math.round(val / 1000)}k`;
                  return String(val);
                }}
              />
              {chartMetricMode === 'dual' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#a855f7"
                  tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#c084fc' }}
                  tickFormatter={(val: number) => `${Math.round(val / 1000)}k EPS`}
                />
              )}
              <Tooltip
                content={({ active, payload }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-lg shadow-2xl font-mono text-xs backdrop-blur-md space-y-1.5">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5">
                        <span className="text-slate-300 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          時間: {item.minute}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-cyan-400 font-semibold">日誌接收量:</span>
                          <span className="text-white font-bold">{item.volume.toLocaleString()} logs/min</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-indigo-300 font-semibold">平均吞吐速率:</span>
                          <span className="text-slate-200">{item.avgEps.toLocaleString()} EPS</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-purple-400 font-semibold">尖峰速率 (Peak):</span>
                          <span className="text-slate-200">{item.peakEps.toLocaleString()} EPS</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-amber-300 font-semibold">估計資料量:</span>
                          <span className="text-slate-200">~{item.bytesMB} MB</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
                          <span className="text-slate-400 text-[11px]">存儲交付狀態:</span>
                          <span className={`font-bold text-[11px] ${
                            item.successRate < 100 || item.failureCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {item.successRate}% {item.failureCount > 0 ? `(${item.failureCount} 失敗/退避)` : '(連線正常)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              {showAvgReferenceLine && (
                <ReferenceLine
                  yAxisId="left"
                  y={chartMetricMode === 'eps' ? Math.round(chartSummary.avgLogsPerMinute / 60) : chartSummary.avgLogsPerMinute}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{
                    value: `平均 (${chartMetricMode === 'eps' ? Math.round(chartSummary.avgLogsPerMinute / 60) + ' EPS' : (chartSummary.avgLogsPerMinute / 1000).toFixed(0) + 'k/min'})`,
                    fill: '#818cf8',
                    fontSize: 10,
                    position: 'insideTopLeft'
                  }}
                />
              )}
              {(chartMetricMode === 'volume' || chartMetricMode === 'dual') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="volume"
                  name="日誌量 (Logs/min)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
              {chartMetricMode === 'eps' && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgEps"
                  name="吞吐速率 (EPS)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
              {chartMetricMode === 'dual' && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="peakEps"
                  name="尖峰 EPS (Peak Rate)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 4, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 1.5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer legend and stability diagnosis */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>實線藍: 每分鐘接收量 (Logs/min)</span>
            </span>
            {chartMetricMode === 'dual' && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-purple-400 inline-block" />
                <span>虛線紫: 尖峰速率 (Peak EPS)</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-indigo-400 inline-block" />
              <span>基準紫線: 1小時平均基準線</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>吞吐效能評估: 負載平穩，無進線背壓或巨幅掉速異常</span>
          </div>
        </div>
      </div>

      {/* Exponential Backoff Curve Graphic & Interactive Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Exponential Backoff Timing Visualization */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              指數退避重試時間序列階梯 (Exponential Backoff Ladder)
            </h3>
            <span className="text-[11px] text-cyan-400 font-mono">Full Jitter Enabled</span>
          </div>

          <p className="text-xs text-slate-400">
            當 VictoriaLogs 遇到暫時性壅塞或故障時，收集器不會同時湧入重試（避免驚群效應 Thundering Herd），而是依照指數遞增延遲並疊加隨機因子：
          </p>

          <div className="space-y-2 font-mono text-xs">
            {[
              { attempt: 1, base: 200, jitterRange: '170ms ~ 230ms', desc: '初次失敗後迅速探測' },
              { attempt: 2, base: 400, jitterRange: '340ms ~ 460ms', desc: '短暫壅塞退讓' },
              { attempt: 3, base: 800, jitterRange: '680ms ~ 920ms', desc: '服務重啟中等待' },
              { attempt: 4, base: 1600, jitterRange: '1.36s ~ 1.84s', desc: '緩慢回復等待' },
              { attempt: 5, base: 3200, jitterRange: '2.72s ~ 3.68s', desc: '最後就地重試' },
            ].map((step) => {
              const isActive = s && s.currentBackoffMs > 0 && Math.abs(s.currentBackoffMs - step.base) < step.base * 0.5;
              return (
                <div
                  key={step.attempt}
                  className={`p-2.5 rounded-lg border transition flex items-center justify-between ${
                    isActive
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold text-[10px]">
                      第 {step.attempt} 次重試
                    </span>
                    <span className="text-slate-200 font-medium">{step.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-300 font-bold">{step.jitterRange}</span>
                  </div>
                </div>
              );
            })}

            <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>第 6 次以上 (超過就地上限):</span>
              </div>
              <span className="font-semibold">轉入離線佇列，背景排空協程以 4s 間隔持續探測復原</span>
            </div>
          </div>
        </div>

        {/* Right: Live Test Bench & Failure Simulation Injection */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              日誌寫入與退避重試即時驗證台 (Live Test Bench)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">POST /insert/jsonline</span>
          </div>

          <p className="text-xs text-slate-400">
            可直接在此發起日誌傳輸測試。若當前 VictoriaLogs 離線或已開啟模擬故障，前端將即時捕捉退避階梯、連續嘗試日誌與離線保護佇列狀態更新。
          </p>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">
              測試日誌 Payload (JSON / NDJSON):
            </label>
            <textarea
              rows={4}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerForward}
                disabled={isInjecting || isBursting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-60"
              >
                <Send className={`w-3.5 h-3.5 ${isInjecting ? 'animate-spin' : ''}`} />
                {isInjecting ? '執行指數退避重試中...' : '推播測試日誌 (Trigger POST)'}
              </button>

              <button
                onClick={handleTriggerBurst}
                disabled={isInjecting || isBursting}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-60"
                title="連續發送 5 批次快速日誌以測試佇列緩衝與退避行為"
              >
                <Flame className={`w-3.5 h-3.5 text-amber-400 ${isBursting ? 'animate-bounce' : ''}`} />
                {isBursting ? '突發注入中...' : '突發壓力測試 (5 批次)'}
              </button>
            </div>

            {s?.simulatedOutage && (
              <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                故障模擬已啟用 (503)
              </span>
            )}
          </div>

          {/* Execution Result Banner */}
          {injectResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs font-mono transition space-y-1.5 ${
                injectResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : injectResult.queued
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>
                  {injectResult.success
                    ? '✅ 寫入成功交付 VictoriaLogs！'
                    : injectResult.queued
                    ? '⚠️ 就地重試耗盡，已安全轉入離線佇列 (保證不丟失)'
                    : '❌ 寫入失敗'}
                </span>
                <span>嘗試次數: {injectResult.attempts} 次</span>
              </div>
              {injectResult.burstSummary && (
                <div className="text-[11px] text-amber-200 font-sans font-medium">
                  {injectResult.burstSummary}
                </div>
              )}
              {injectResult.backoffDelays && injectResult.backoffDelays.length > 0 && (
                <div className="text-[11px] text-slate-300">
                  指數退避延遲序列: <span className="text-cyan-300">{injectResult.backoffDelays.map((d: number) => `${d}ms`).join(' → ')}</span>
                </div>
              )}
              {injectResult.error && (
                <div className="text-[11px] text-amber-300">
                  最終錯誤訊息: {injectResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Retry Execution Activity Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              退避重試與佇列保護即時事件紀錄 (Live Retry Execution Logs)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredLogs.length} 條紀錄)
            </span>
          </div>

          {/* Filter options and CSV export */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1 text-[11px]">篩選:</span>
              {(['all', 'heartbeat', 'error', 'warn', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition flex items-center gap-1 ${
                    logFilter === f
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f === 'heartbeat' && <HeartPulse className="w-3 h-3 text-indigo-400" />}
                  {f === 'all' ? '全部' : f === 'heartbeat' ? '30s 心跳探針' : f.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              disabled={!data || isExporting}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 transition flex items-center gap-1.5 disabled:opacity-50"
              title="匯出當前退避日誌與統計為 CSV 檔案"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>匯出 CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">時間 (Timestamp)</th>
                <th className="py-2.5 px-3">層級 (Level)</th>
                <th className="py-2.5 px-3">重試次數</th>
                <th className="py-2.5 px-3">退避延遲 (Delay)</th>
                <th className="py-2.5 px-3">事件詳細訊息 (Message)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    目前尚未觸發重試事件。可點擊上方「推播測試日誌」或開啟「模擬 503 暫態故障」進行測試。
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-850 transition ${
                      idx === 0 ? 'bg-cyan-950/20' : log.isHeartbeat || log.message.includes('心跳') ? 'bg-indigo-950/10' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                    </td>
                    <td className="py-2 px-3">
                      {log.isHeartbeat || log.message.includes('心跳') || log.message.includes('Heartbeat') ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 w-fit">
                          <HeartPulse className="w-3 h-3 text-indigo-400 animate-pulse" />
                          HEARTBEAT
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.level === 'error'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : log.level === 'warn'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {log.isHeartbeat || log.message.includes('心跳') ? (
                        <span className="text-indigo-300 font-semibold">30s 探針</span>
                      ) : log.attempt > 0 ? (
                        `第 ${log.attempt} 次`
                      ) : (
                        '初始請求'
                      )}
                    </td>
                    <td className="py-2 px-3 text-cyan-300">
                      {log.delayMs > 0 ? `${log.delayMs} ms` : '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-200">
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


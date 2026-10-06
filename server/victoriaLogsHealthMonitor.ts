import axios from 'axios';
import { globalCollectorConnectionPool } from './collectorConnectionPool.ts';

export type CollectorOperatingMode = 'normal' | 'buffer_only';
export type HealthProbeStatus = 'healthy' | 'unhealthy' | 'timeout' | 'simulated_outage';

export interface HealthProbeResult {
  timestamp: string;
  status: HealthProbeStatus;
  statusCode?: number;
  latencyMs: number;
  message: string;
  mode: CollectorOperatingMode;
}

export interface HealthMonitorConfig {
  endpoint: string;
  intervalMs: number;
  timeoutMs: number;
  failureThreshold: number; // Consecutive failures to switch to buffer-only
  recoveryThreshold: number; // Consecutive successes to switch back to normal
  enabled: boolean;
  manualOverride: 'auto' | 'force_buffer_only' | 'force_normal';
}

export interface HealthMonitorMetrics {
  mode: CollectorOperatingMode;
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
  lastProbeStatus: HealthProbeStatus;
  lastProbeMessage: string;
  config: HealthMonitorConfig;
  recentProbes: HealthProbeResult[];
}

export class VictoriaLogsHealthMonitor {
  private config: HealthMonitorConfig;
  private mode: CollectorOperatingMode = 'normal';
  private outageFlagged: boolean = false;
  private outageReason: string = '';
  private outageStartedAt: number | null = null;
  private restorationAt: string | null = null;

  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private totalProbes: number = 0;
  private successfulProbes: number = 0;
  private failedProbes: number = 0;

  private lastProbeTime: string = new Date().toISOString();
  private lastProbeLatencyMs: number = 0;
  private lastProbeStatus: HealthProbeStatus = 'healthy';
  private lastProbeMessage: string = '監控器已初始化，準備執行首次主動端點探針';
  private recentProbes: HealthProbeResult[] = [];

  private timer: NodeJS.Timeout | null = null;
  private isProbing: boolean = false;

  // Chaos simulation hook
  private simulatedOutage: boolean = false;
  private simulatedFailureCode: number = 503;

  // Callbacks
  private onOutageCallback?: (reason: string) => void;
  private onRecoveryCallback?: () => void;
  private onProbeCompletedCallback?: (result: HealthProbeResult, metrics: HealthMonitorMetrics) => void;

  constructor(customConfig?: Partial<HealthMonitorConfig>) {
    this.config = {
      endpoint: customConfig?.endpoint || 'http://localhost:9428/health',
      intervalMs: customConfig?.intervalMs || 5000,
      timeoutMs: customConfig?.timeoutMs || 2500,
      failureThreshold: customConfig?.failureThreshold || 2,
      recoveryThreshold: customConfig?.recoveryThreshold || 2,
      enabled: customConfig?.enabled ?? true,
      manualOverride: customConfig?.manualOverride || 'auto'
    };

    if (this.config.enabled) {
      this.start();
    }
  }

  public setCallbacks(callbacks: {
    onOutage?: (reason: string) => void;
    onRecovery?: () => void;
    onProbeCompleted?: (result: HealthProbeResult, metrics: HealthMonitorMetrics) => void;
  }) {
    if (callbacks.onOutage) this.onOutageCallback = callbacks.onOutage;
    if (callbacks.onRecovery) this.onRecoveryCallback = callbacks.onRecovery;
    if (callbacks.onProbeCompleted) this.onProbeCompletedCallback = callbacks.onProbeCompleted;
  }

  public setSimulatedOutage(enable: boolean, failureCode: number = 503) {
    this.simulatedOutage = enable;
    this.simulatedFailureCode = failureCode;
    // Trigger immediate probe to react quickly
    this.probe();
  }

  public getSimulatedOutage(): { enabled: boolean; failureCode: number } {
    return {
      enabled: this.simulatedOutage,
      failureCode: this.simulatedFailureCode
    };
  }

  public isBufferOnlyMode(): boolean {
    if (this.config.manualOverride === 'force_buffer_only') return true;
    if (this.config.manualOverride === 'force_normal') return false;
    return this.mode === 'buffer_only';
  }

  public getMode(): CollectorOperatingMode {
    if (this.config.manualOverride === 'force_buffer_only') return 'buffer_only';
    if (this.config.manualOverride === 'force_normal') return 'normal';
    return this.mode;
  }

  public updateConfig(newConfig: Partial<HealthMonitorConfig>) {
    if (newConfig.endpoint) this.config.endpoint = newConfig.endpoint;
    if (newConfig.intervalMs && newConfig.intervalMs >= 1000) {
      this.config.intervalMs = newConfig.intervalMs;
      this.restart();
    }
    if (newConfig.timeoutMs && newConfig.timeoutMs >= 500) {
      this.config.timeoutMs = newConfig.timeoutMs;
    }
    if (newConfig.failureThreshold && newConfig.failureThreshold >= 1) {
      this.config.failureThreshold = newConfig.failureThreshold;
    }
    if (newConfig.recoveryThreshold && newConfig.recoveryThreshold >= 1) {
      this.config.recoveryThreshold = newConfig.recoveryThreshold;
    }
    if (typeof newConfig.enabled === 'boolean') {
      this.config.enabled = newConfig.enabled;
      if (this.config.enabled) this.start();
      else this.stop();
    }
    if (newConfig.manualOverride && ['auto', 'force_buffer_only', 'force_normal'].includes(newConfig.manualOverride)) {
      this.config.manualOverride = newConfig.manualOverride;
      if (this.config.manualOverride === 'force_buffer_only' && this.mode !== 'buffer_only') {
        this.switchToBufferOnly('管理員手動強制啟用純緩衝模式');
      } else if (this.config.manualOverride === 'force_normal' && this.mode !== 'normal') {
        this.switchToNormal('管理員手動強制還原正常模式');
      }
    }
  }

  public getConfig(): HealthMonitorConfig {
    return { ...this.config };
  }

  public start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.probe();
    }, this.config.intervalMs);
    if (this.timer.unref) this.timer.unref();

    // Trigger initial probe after 500ms
    setTimeout(() => this.probe(), 500);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private restart() {
    this.stop();
    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Executes a periodic active health check probe against the VictoriaLogs health endpoint
   */
  public async probe(): Promise<HealthProbeResult> {
    if (this.isProbing) {
      return {
        timestamp: new Date().toISOString(),
        status: this.lastProbeStatus,
        latencyMs: this.lastProbeLatencyMs,
        message: '上一次探針尚未完成',
        mode: this.getMode()
      };
    }

    this.isProbing = true;
    this.totalProbes++;
    const startTime = Date.now();
    let probeResult: HealthProbeResult;

    // Check simulated outage first
    if (this.simulatedOutage) {
      const latencyMs = Math.floor(Math.random() * 8 + 3);
      this.failedProbes++;
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;
      this.lastProbeTime = new Date().toISOString();
      this.lastProbeLatencyMs = latencyMs;
      this.lastProbeStatus = 'simulated_outage';
      this.lastProbeMessage = `模擬端點故障: HTTP ${this.simulatedFailureCode} 服務暫時不可用`;

      probeResult = {
        timestamp: this.lastProbeTime,
        status: 'simulated_outage',
        statusCode: this.simulatedFailureCode,
        latencyMs,
        message: this.lastProbeMessage,
        mode: this.getMode()
      };

      this.recordProbe(probeResult);
      this.evaluateStateTransitions(`VictoriaLogs 端點模擬故障 (${this.simulatedFailureCode})`);
      this.isProbing = false;
      return probeResult;
    }

    try {
      // Normal live probe: try health endpoint (or fallback to root if not available)
      const healthUrl = this.config.endpoint;
      const pooledClient = globalCollectorConnectionPool.getAxiosClient();
      const response = await pooledClient.get(healthUrl, {
        timeout: this.config.timeoutMs,
        headers: {
          'User-Agent': 'SEMOR-VictoriaLogs-ProactiveHealthMonitor/2.5'
        },
        validateStatus: () => true // Allow handling all status codes manually
      });

      const latencyMs = Date.now() - startTime;
      this.lastProbeTime = new Date().toISOString();
      this.lastProbeLatencyMs = latencyMs;

      // Status 200 OK or 204 or 404 (if VictoriaLogs has no /health route, endpoint socket is reachable)
      const isReachable = response.status >= 200 && response.status < 400;

      if (isReachable) {
        this.successfulProbes++;
        this.consecutiveSuccesses++;
        this.consecutiveFailures = 0;
        this.lastProbeStatus = 'healthy';
        this.lastProbeMessage = `端點探測正常 (HTTP ${response.status}, 延遲: ${latencyMs}ms)`;

        probeResult = {
          timestamp: this.lastProbeTime,
          status: 'healthy',
          statusCode: response.status,
          latencyMs,
          message: this.lastProbeMessage,
          mode: this.getMode()
        };
      } else {
        this.failedProbes++;
        this.consecutiveFailures++;
        this.consecutiveSuccesses = 0;
        this.lastProbeStatus = 'unhealthy';
        this.lastProbeMessage = `端點異常回應: HTTP ${response.status} ${response.statusText || ''}`;

        probeResult = {
          timestamp: this.lastProbeTime,
          status: 'unhealthy',
          statusCode: response.status,
          latencyMs,
          message: this.lastProbeMessage,
          mode: this.getMode()
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      this.failedProbes++;
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;
      this.lastProbeTime = new Date().toISOString();
      this.lastProbeLatencyMs = latencyMs;

      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      this.lastProbeStatus = isTimeout ? 'timeout' : 'unhealthy';
      const errMsg = err.code ? `${err.code}: ${err.message}` : (err.message || '連線失敗');
      this.lastProbeMessage = `端點連線異常: ${errMsg}`;

      probeResult = {
        timestamp: this.lastProbeTime,
        status: this.lastProbeStatus,
        latencyMs,
        message: this.lastProbeMessage,
        mode: this.getMode()
      };
    } finally {
      this.isProbing = false;
    }

    this.recordProbe(probeResult);
    this.evaluateStateTransitions(probeResult.message);

    if (this.onProbeCompletedCallback) {
      try {
        this.onProbeCompletedCallback(probeResult, this.getMetrics());
      } catch (e) {
        console.error('[HealthMonitor] onProbeCompleted callback error:', e);
      }
    }

    return probeResult;
  }

  private recordProbe(result: HealthProbeResult) {
    this.recentProbes.unshift(result);
    if (this.recentProbes.length > 20) {
      this.recentProbes = this.recentProbes.slice(0, 20);
    }
  }

  private evaluateStateTransitions(reason: string) {
    if (this.config.manualOverride !== 'auto') {
      return; // Obey manual override
    }

    // Condition 1: Outage Trigger
    if (this.mode === 'normal' && this.consecutiveFailures >= this.config.failureThreshold) {
      this.switchToBufferOnly(reason);
    }
    // Condition 2: Recovery Trigger
    else if (this.mode === 'buffer_only' && this.consecutiveSuccesses >= this.config.recoveryThreshold) {
      this.switchToNormal('端點連線成功復原並通過連續健康檢查門檻');
    }
  }

  public switchToBufferOnly(reason: string) {
    this.mode = 'buffer_only';
    this.outageFlagged = true;
    this.outageReason = reason;
    this.outageStartedAt = Date.now();
    this.restorationAt = null;

    console.warn(`[VictoriaLogs 主動健康監控] 警報: 端點異常 (${reason})。收集器已主動切換至「純緩衝模式 (BUFFER-ONLY MODE)」，保護下游連線並防止執行緒阻塞！`);

    if (this.onOutageCallback) {
      try {
        this.onOutageCallback(reason);
      } catch (e) {
        console.error('[HealthMonitor] onOutage callback error:', e);
      }
    }
  }

  public switchToNormal(reason: string) {
    this.mode = 'normal';
    this.outageFlagged = false;
    this.restorationAt = new Date().toISOString();
    this.outageStartedAt = null;

    console.log(`[VictoriaLogs 主動健康監控] 恢復: VictoriaLogs 連線已復原 (${reason})！收集器已切換回「正常線上即時串流模式 (NORMAL MODE)」，開始自動排空離線重試佇列！`);

    if (this.onRecoveryCallback) {
      try {
        this.onRecoveryCallback();
      } catch (e) {
        console.error('[HealthMonitor] onRecovery callback error:', e);
      }
    }
  }

  public getMetrics(): HealthMonitorMetrics {
    const now = Date.now();
    const outageDurationSec = (this.outageStartedAt && this.mode === 'buffer_only')
      ? Math.max(0, Math.floor((now - this.outageStartedAt) / 1000))
      : 0;

    return {
      mode: this.getMode(),
      outageFlagged: this.outageFlagged,
      outageReason: this.outageReason,
      outageStartedAt: this.outageStartedAt ? new Date(this.outageStartedAt).toISOString() : null,
      outageDurationSec,
      restorationAt: this.restorationAt,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalProbes: this.totalProbes,
      successfulProbes: this.successfulProbes,
      failedProbes: this.failedProbes,
      lastProbeTime: this.lastProbeTime,
      lastProbeLatencyMs: this.lastProbeLatencyMs,
      lastProbeStatus: this.lastProbeStatus,
      lastProbeMessage: this.lastProbeMessage,
      config: { ...this.config },
      recentProbes: this.recentProbes.slice(0, 15)
    };
  }
}

// Global Singleton Instance for Collector VictoriaLogs Health Monitor
export const globalVictoriaLogsHealthMonitor = new VictoriaLogsHealthMonitor({
  endpoint: 'http://localhost:9428/health',
  intervalMs: 5000,
  timeoutMs: 2500,
  failureThreshold: 2,
  recoveryThreshold: 2,
  enabled: true
});

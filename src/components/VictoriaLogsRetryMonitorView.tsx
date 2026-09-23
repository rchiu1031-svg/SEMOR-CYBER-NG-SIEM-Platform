import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  WifiOff,
  Activity,
  Zap,
  TrendingUp,
  Server,
  Layers,
  Database
} from 'lucide-react';

interface RetryStatsResponse {
  success: boolean;
  targetURL: string;
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
  recentRetryLogs: Array<{
    timestamp: string;
    level: string;
    message: string;
    attempt: number;
    delayMs: number;
  }>;
}

export function VictoriaLogsRetryMonitorView() {
  const [data, setData] = useState<RetryStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectResult, setInjectResult] = useState<any>(null);
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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/collector/victorialogs-retry-stats');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch retry stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 2500);
    return () => clearInterval(timer);
  }, []);

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
      fetchStats();
    } catch (err: any) {
      setInjectResult({ success: false, error: err.message });
    } finally {
      setIsInjecting(false);
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
      await fetchStats();
    } catch (err) {
      console.error('Toggle simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const s = data?.stats;
  const c = data?.config;

  return (
    <div className="space-y-6">
      {/* Top Banner: Exponential Backoff & Outage Buffer Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Resilient Transport Layer
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Zero-Loss Ingestion Guarantee
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-cyan-400" />
              VictoriaLogs POST 指數退避重試與防遺失離線佇列機制 (Exponential Backoff with Full Jitter)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              當日誌收集服務向 VictoriaLogs (<code className="text-slate-200 font-mono">POST /insert/jsonline</code>) 推送日誌遭遇網路中斷或暫態故障 (429, 500, 502, 503, 504) 時，
              啟動<strong>指數退避重試演算法</strong>並加入<strong>隨機抖動 (Full Jitter)</strong>，並於重試上限耗盡時自動轉存至<strong>記憶體保護佇列</strong>，確保伺服器復原前零資料遺失。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleToggleSimulation}
              disabled={isLoading}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-2 ${
                s?.simulatedOutage
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-300 hover:bg-rose-900/80'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {s?.simulatedOutage ? (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>關閉 VictoriaLogs 503 斷線模擬</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>模擬 VictoriaLogs 暫態故障 (503)</span>
                </>
              )}
            </button>
            <button
              onClick={fetchStats}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              重新整理
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Reachability & Target */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>目標 VictoriaLogs 端點</span>
            <Server className="w-4 h-4 text-slate-500" />
          </div>
          <div className="font-mono text-xs text-white truncate mb-2">
            {data?.targetURL || 'http://localhost:9428/insert/jsonline'}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                s?.simulatedOutage
                  ? 'bg-rose-500 animate-pulse'
                  : s?.isTargetReachable
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {s?.simulatedOutage
                ? '模擬中斷 (Simulated 503)'
                : s?.isTargetReachable
                ? '服務連通正常 (Active)'
                : '連線重試中 (Retrying)'}
            </span>
          </div>
        </div>

        {/* Card 2: Backoff Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>退避參數 (Backoff Curve)</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {c?.initialIntervalMs || 200}ms <span className="text-xs text-slate-400 font-normal">→ {c?.maxIntervalMs || 15000}ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            乘數: <span className="text-cyan-300 font-mono">{c?.multiplier || 2}x</span> | 抖動: <span className="text-cyan-300 font-mono">±15%</span> | 上限: <span className="text-cyan-300 font-mono">{c?.maxRetries || 5} 次</span>
          </div>
        </div>

        {/* Card 3: Retry Attempts & Recovery Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>重試累計與自癒率</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono">
            {s?.retryAttemptsTotal || 0} <span className="text-xs text-slate-400 font-normal">次退避重試</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">成功修復: {s?.retrySuccessTotal || 0} 批次</span>
            <span>|</span>
            <span>初態失敗: {s?.initialFailures || 0}</span>
          </div>
        </div>

        {/* Card 4: Outage Protection Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>離線保護佇列 (Zero-Loss Queue)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono flex items-baseline gap-1.5">
            <span className={s && s.currentQueueDepth > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {s?.currentQueueDepth || 0}
            </span>
            <span className="text-xs text-slate-400 font-normal">/ {c?.queueCapacity || 5000} 批次</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            已排空交付: <span className="text-emerald-300 font-mono">{s?.queueDrainedSuccess || 0}</span> 批次 (零丟失)
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
            可直接在此發起日誌傳輸測試。若當前 VictoriaLogs 離線或已開啟模擬故障，可即時觀察前端捕捉到的多次指數退避階梯與離線佇列保護行為。
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

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleTriggerForward}
              disabled={isInjecting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-60"
            >
              <Send className={`w-3.5 h-3.5 ${isInjecting ? 'animate-spin' : ''}`} />
              {isInjecting ? '執行指數退避重試中...' : '推播測試日誌 (Trigger POST)'}
            </button>

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
                    ? '寫入成功！'
                    : injectResult.queued
                    ? '⚠️ 就地重試耗盡，已安全轉入離線佇列 (保證不丟失)'
                    : '寫入失敗'}
                </span>
                <span>嘗試次數: {injectResult.attempts} 次</span>
              </div>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            退避重試與佇列保護即時事件紀錄 (Live Retry Execution Logs)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {data?.recentRetryLogs.length || 0} 條最新紀錄
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">時間 (Timestamp)</th>
                <th className="py-2.5 px-3">層級 (Level)</th>
                <th className="py-2.5 px-3">重試次數</th>
                <th className="py-2.5 px-3">退避延遲 (Delay)</th>
                <th className="py-2.5 px-3">事件詳細訊息 (Message)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(!data?.recentRetryLogs || data.recentRetryLogs.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    目前尚未觸發重試事件。可點擊上方「推播測試日誌」或開啟「模擬 VictoriaLogs 故障」進行測試。
                  </td>
                </tr>
              ) : (
                data.recentRetryLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-850 transition">
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
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
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {log.attempt > 0 ? `第 ${log.attempt} 次` : '初始請求'}
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

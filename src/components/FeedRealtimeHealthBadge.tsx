import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Zap, 
  RefreshCw, 
  Pause, 
  Radio, 
  Sliders, 
  ArrowRight,
  ShieldCheck,
  Server,
  ChevronDown,
  Layers,
  Sparkles,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { useTranslation } from 'react-i18next';

export type HealthStatusLevel = 'optimal' | 'moderate' | 'degraded' | 'error' | 'syncing' | 'paused';

export interface FeedHealthInfo {
  level: HealthStatusLevel;
  colorKey: 'emerald' | 'lime' | 'amber' | 'rose' | 'blue' | 'gray';
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeGlow: string;
  dotColor: string;
  pingDotColor?: string;
  titleZh: string;
  titleEn: string;
  latencyText: string;
  ingestionText: string;
  httpStatusText: string;
  latencyTier: 'optimal' | 'moderate' | 'slow' | 'timeout';
  ingestionTier: 'full' | 'partial' | 'failed';
  summaryDescriptionZh: string;
  summaryDescriptionEn: string;
}

export interface FeedHealthProps {
  id: string;
  name: string;
  discoveryUrl: string;
  status: 'active' | 'syncing' | 'warning' | 'error' | 'paused';
  latencyMs: number;
  httpStatusCode?: number;
  ingestionSuccessRate?: number;
  ingestedInLastSync?: number;
  droppedCount?: number;
  lastErrorMessage?: string;
  lastSyncTime?: string;
}

/**
 * Computes health classification and styling based on HTTP response time (latency) and data ingestion success.
 */
export function computeFeedHealth(feed: FeedHealthProps, isZh: boolean): FeedHealthInfo {
  const statusCode = feed.httpStatusCode ?? (feed.status === 'error' ? 503 : 200);
  const ingestionRate = feed.ingestionSuccessRate ?? (feed.status === 'error' ? 0 : feed.status === 'warning' ? 91.2 : 100);
  const latency = feed.latencyMs;

  // 1. Paused state
  if (feed.status === 'paused') {
    return {
      level: 'paused',
      colorKey: 'gray',
      badgeBg: 'bg-gray-800/80',
      badgeBorder: 'border-gray-700/80 hover:border-gray-600',
      badgeText: 'text-gray-400',
      badgeGlow: '',
      dotColor: 'bg-gray-500',
      titleZh: '已休止暫停',
      titleEn: 'Paused (Standby)',
      latencyText: `${latency}ms (休止)`,
      ingestionText: `${ingestionRate}% (維持)`,
      httpStatusText: 'Standby',
      latencyTier: 'moderate',
      ingestionTier: 'full',
      summaryDescriptionZh: '情資來源目前處於手動暫停狀態，暫停自動輪詢與 STIX 物件拉取。',
      summaryDescriptionEn: 'Feed is paused. Automatic polling and observable ingestion are suspended.'
    };
  }

  // 2. Live Syncing state
  if (feed.status === 'syncing') {
    return {
      level: 'syncing',
      colorKey: 'blue',
      badgeBg: 'bg-blue-500/15',
      badgeBorder: 'border-blue-500/50 hover:border-blue-400',
      badgeText: 'text-blue-400',
      badgeGlow: 'shadow-blue-900/30 shadow-sm',
      dotColor: 'bg-blue-400',
      pingDotColor: 'bg-blue-400',
      titleZh: '交握傳輸中',
      titleEn: 'Syncing HTTP...',
      latencyText: `${latency}ms (探測中)`,
      ingestionText: '串流接收中',
      httpStatusText: 'Handshake',
      latencyTier: 'optimal',
      ingestionTier: 'full',
      summaryDescriptionZh: '正在與遠端 TAXII 2.1 探索端點建立 TLS 1.3 交握，串流接收最新 STIX 物件。',
      summaryDescriptionEn: 'Active TLS 1.3 handshake and streaming ingestion of STIX 2.1 bundles.'
    };
  }

  // 3. Error state: HTTP >= 400 (except 429), or ingestion < 50%, or status === 'error', or latency >= 1000ms
  const isHttpError = statusCode >= 400 && statusCode !== 429;
  const isIngestionFailure = ingestionRate < 50 || feed.status === 'error';
  const isTimeout = latency >= 1000;

  if (isHttpError || isIngestionFailure || isTimeout) {
    return {
      level: 'error',
      colorKey: 'rose',
      badgeBg: 'bg-rose-500/15',
      badgeBorder: 'border-rose-500/40 hover:border-rose-500/70',
      badgeText: 'text-rose-400',
      badgeGlow: 'shadow-rose-950/40 shadow-sm',
      dotColor: 'bg-rose-500',
      pingDotColor: 'bg-rose-500',
      titleZh: '連線異常 / 接收失敗',
      titleEn: 'Ingestion Failed',
      latencyText: `${latency}ms (逾時延遲)`,
      ingestionText: `${ingestionRate}% 接收異常`,
      httpStatusText: `HTTP ${statusCode}`,
      latencyTier: 'timeout',
      ingestionTier: 'failed',
      summaryDescriptionZh: `端點連線或資料解析失敗 (${statusCode >= 400 ? `HTTP ${statusCode}` : '接收率低於門檻'})。延遲 ${latency}ms。${feed.lastErrorMessage || '請檢查端點 URL 或認證金鑰。'}`,
      summaryDescriptionEn: `Connection or parsing error (${statusCode >= 400 ? `HTTP ${statusCode}` : 'Critical drops'}). Latency: ${latency}ms. ${feed.lastErrorMessage || 'Check endpoint URL or credentials.'}`
    };
  }

  // 4. Degraded state: Latency >= 450ms OR Ingestion 50% ~ 95% OR HTTP 206 / 429 OR status === 'warning'
  const isHighLatency = latency >= 450;
  const isPartialIngestion = ingestionRate < 96;
  const isThrottled = statusCode === 429 || statusCode === 206;

  if (isHighLatency || isPartialIngestion || isThrottled || feed.status === 'warning') {
    return {
      level: 'degraded',
      colorKey: 'amber',
      badgeBg: 'bg-amber-500/15',
      badgeBorder: 'border-amber-500/40 hover:border-amber-500/70',
      badgeText: 'text-amber-400',
      badgeGlow: 'shadow-amber-950/40 shadow-sm',
      dotColor: 'bg-amber-400',
      pingDotColor: 'bg-amber-400',
      titleZh: '效能下降 / 部分接收',
      titleEn: 'Degraded / Partial',
      latencyText: `${latency}ms (偏高)`,
      ingestionText: `${ingestionRate}% (部分遺失)`,
      httpStatusText: `HTTP ${statusCode}`,
      latencyTier: 'slow',
      ingestionTier: 'partial',
      summaryDescriptionZh: `傳輸延遲偏高 (${latency}ms) 或部分指標解析遺失 (接收成功率 ${ingestionRate}%)。可能受到遠端 API 頻率限制 (HTTP ${statusCode})。`,
      summaryDescriptionEn: `Elevated latency (${latency}ms) or partial indicator drops (Ingestion rate ${ingestionRate}%). Subject to remote rate-limiting (HTTP ${statusCode}).`
    };
  }

  // 5. Moderate state: Latency 200ms - 450ms AND Ingestion >= 96%
  if (latency >= 200) {
    return {
      level: 'moderate',
      colorKey: 'lime',
      badgeBg: 'bg-lime-500/15',
      badgeBorder: 'border-lime-500/40 hover:border-lime-500/70',
      badgeText: 'text-lime-300',
      badgeGlow: 'shadow-lime-950/30 shadow-sm',
      dotColor: 'bg-lime-400',
      titleZh: '正常良好',
      titleEn: 'Normal / Moderate',
      latencyText: `${latency}ms (正常)`,
      ingestionText: `${ingestionRate}% (穩定)`,
      httpStatusText: `HTTP ${statusCode}`,
      latencyTier: 'moderate',
      ingestionTier: 'full',
      summaryDescriptionZh: `端點回應正常 (HTTP ${statusCode})，延遲 ${latency}ms，STIX 物件接收成功率 ${ingestionRate}%，運作穩定。`,
      summaryDescriptionEn: `Normal endpoint response (HTTP ${statusCode}), latency ${latency}ms, STIX ingestion success rate ${ingestionRate}%.`
    };
  }

  // 6. Optimal state: Latency < 200ms AND Ingestion >= 98%
  return {
    level: 'optimal',
    colorKey: 'emerald',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/40 hover:border-emerald-500/70',
    badgeText: 'text-emerald-400',
    badgeGlow: 'shadow-emerald-950/40 shadow-sm',
    dotColor: 'bg-emerald-400',
    pingDotColor: 'bg-emerald-400/80',
    titleZh: '極速最佳',
    titleEn: 'Optimal (High-Speed)',
    latencyText: `${latency}ms (極速)`,
    ingestionText: '100% 完整收錄',
    httpStatusText: `HTTP ${statusCode}`,
    latencyTier: 'optimal',
    ingestionTier: 'full',
    summaryDescriptionZh: `極速回應狀態 (HTTP ${statusCode})，延遲低於 200ms (${latency}ms)，STIX 2.1 指標 100% 無損收錄入庫。`,
    summaryDescriptionEn: `High-speed optimal state (HTTP ${statusCode}), latency ${latency}ms (<200ms), 100% STIX 2.1 ingestion accuracy.`
  };
}

export interface FeedRealtimeHealthBadgeProps {
  feed: FeedHealthProps;
  isZh?: boolean;
  onPing?: () => void;
  onSimulateState?: (level: 'optimal' | 'moderate' | 'degraded' | 'error') => void;
  compact?: boolean;
  showDetails?: boolean;
}

export default function FeedRealtimeHealthBadge({
  feed,
  isZh: propIsZh,
  onPing,
  onSimulateState,
  compact = false
}: FeedRealtimeHealthBadgeProps) {
  const { i18n } = useTranslation();
  const isZh = propIsZh !== undefined ? propIsZh : (!i18n.language || i18n.language.startsWith('zh'));
  const [isOpen, setIsOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const health = computeFeedHealth(feed, isZh);

  const handleTriggerPing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinging(true);
    if (onPing) {
      onPing();
    }
    setTimeout(() => {
      setIsPinging(false);
    }, 600);
  };

  return (
    <div className="relative inline-block text-left">
      {/* Real-time status indicator badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border transition-all duration-200 active:scale-95 group",
          health.badgeBg,
          health.badgeBorder,
          health.badgeText,
          health.badgeGlow
        )}
        title={isZh ? "點擊檢視即時 HTTP 回應延遲與情資接收品質診斷" : "Click to view real-time HTTP response and ingestion telemetry"}
      >
        {/* Pulsing indicator dot */}
        <span className="relative flex h-2 w-2">
          {health.pingDotColor && (
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", health.pingDotColor)} />
          )}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", health.dotColor)} />
        </span>

        {/* Dynamic status labels */}
        <div className="flex items-center gap-1.5 font-bold">
          <span className="tracking-tight">
            {feed.httpStatusCode ? `HTTP ${feed.httpStatusCode}` : 'HTTP 200'}
          </span>
          <span className="opacity-40">•</span>
          <span className={cn(
            "font-black tracking-tight",
            health.latencyTier === 'optimal' ? "text-emerald-400" :
            health.latencyTier === 'moderate' ? "text-lime-400" :
            health.latencyTier === 'slow' ? "text-amber-400" : "text-rose-400"
          )}>
            {feed.latencyMs}ms
          </span>
          {!compact && (
            <>
              <span className="opacity-40">•</span>
              <span className="text-[10px] font-normal opacity-90 hidden sm:inline">
                {feed.ingestionSuccessRate ?? 100}% {isZh ? '接收' : 'Ingest'}
              </span>
            </>
          )}
        </div>

        {/* Live ping spinner or chevron */}
        {isPinging ? (
          <RefreshCw size={11} className="animate-spin opacity-80" />
        ) : (
          <ChevronDown size={11} className={cn("opacity-60 transition-transform duration-200", isOpen && "rotate-180")} />
        )}
      </button>

      {/* Floating Telemetry & Diagnostics Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click dismiss */}
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-2 z-40 w-80 sm:w-96 bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-2xl shadow-black/80 backdrop-blur-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg border",
                    health.level === 'optimal' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                    health.level === 'moderate' ? "bg-lime-500/10 border-lime-500/30 text-lime-400" :
                    health.level === 'degraded' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                    health.level === 'error' ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                    health.level === 'syncing' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                    "bg-gray-800 border-gray-700 text-gray-400"
                  )}>
                    {health.level === 'optimal' ? <CheckCircle2 size={14} /> :
                     health.level === 'moderate' ? <Zap size={14} /> :
                     health.level === 'degraded' ? <AlertTriangle size={14} /> :
                     health.level === 'error' ? <AlertCircle size={14} /> :
                     health.level === 'syncing' ? <Activity size={14} className="animate-spin" /> :
                     <Pause size={14} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">
                      {isZh ? '即時傳輸品質指標 (Telemetry)' : 'Real-time Feed Telemetry'}
                    </h4>
                    <span className={cn("text-[10px] font-bold", health.badgeText)}>
                      {isZh ? health.titleZh : health.titleEn}
                    </span>
                  </div>
                </div>

                {/* Instant Ping Button */}
                <button
                  onClick={handleTriggerPing}
                  disabled={isPinging || feed.status === 'paused'}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] font-bold text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                  title={isZh ? "即刻向遠端端點發起 HTTP Ping 測速" : "Probe endpoint latency now"}
                >
                  <RefreshCw size={11} className={cn(isPinging && "animate-spin text-blue-400")} />
                  <span>{isPinging ? (isZh ? '測速中...' : 'Probing...') : (isZh ? '立即探測' : 'Ping Probe')}</span>
                </button>
              </div>

              {/* Status explanation */}
              <p className="text-[11px] text-gray-300 my-3 leading-relaxed bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/80">
                {isZh ? health.summaryDescriptionZh : health.summaryDescriptionEn}
              </p>

              {/* Section 1: HTTP Response Time Gauge */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-400" />
                    <span>{isZh ? 'HTTP 往返延遲 (RTT)' : 'HTTP Response Time'}</span>
                  </span>
                  <span className={cn(
                    "font-mono font-black",
                    health.latencyTier === 'optimal' ? "text-emerald-400" :
                    health.latencyTier === 'moderate' ? "text-lime-400" :
                    health.latencyTier === 'slow' ? "text-amber-400" : "text-rose-400"
                  )}>
                    {feed.latencyMs} ms
                  </span>
                </div>

                {/* Latency Tier Visual Gauge */}
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden flex border border-gray-800">
                  <div 
                    style={{ width: `${Math.min(100, Math.max(8, (feed.latencyMs / 1200) * 100))}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      health.latencyTier === 'optimal' ? "bg-emerald-400 shadow-emerald-500/50 shadow-sm" :
                      health.latencyTier === 'moderate' ? "bg-lime-400 shadow-lime-500/50 shadow-sm" :
                      health.latencyTier === 'slow' ? "bg-amber-400 shadow-amber-500/50 shadow-sm" :
                      "bg-rose-500 shadow-rose-500/50 shadow-sm"
                    )}
                  />
                </div>

                <div className="flex justify-between text-[9px] font-mono text-gray-500 pt-0.5">
                  <span className="text-emerald-500 font-bold">&lt;200ms (Fast)</span>
                  <span className="text-lime-500">200-450ms</span>
                  <span className="text-amber-500">450-1000ms</span>
                  <span className="text-rose-500">&gt;1000ms (Slow)</span>
                </div>
              </div>

              {/* Section 2: Ingestion Success & Validation */}
              <div className="space-y-2 mb-4 pt-3 border-t border-gray-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>{isZh ? '資料收錄成功率 (Ingestion)' : 'Data Ingestion Success'}</span>
                  </span>
                  <span className={cn(
                    "font-mono font-black",
                    health.ingestionTier === 'full' ? "text-emerald-400" :
                    health.ingestionTier === 'partial' ? "text-amber-400" : "text-rose-400"
                  )}>
                    {feed.ingestionSuccessRate ?? 100}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden flex border border-gray-800">
                  <div 
                    style={{ width: `${feed.ingestionSuccessRate ?? 100}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      health.ingestionTier === 'full' ? "bg-emerald-400" :
                      health.ingestionTier === 'partial' ? "bg-amber-400" :
                      "bg-rose-500"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-1 text-[10px] font-mono">
                  <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-2">
                    <span className="text-gray-500 block">{isZh ? 'HTTP 回應碼' : 'HTTP Code'}:</span>
                    <span className={cn(
                      "font-bold text-xs",
                      (feed.httpStatusCode ?? 200) < 300 ? "text-emerald-400" :
                      (feed.httpStatusCode ?? 200) < 500 ? "text-amber-400" : "text-rose-400"
                    )}>
                      {feed.httpStatusCode ?? 200} {(feed.httpStatusCode ?? 200) === 200 ? 'OK' : (feed.httpStatusCode ?? 200) === 206 ? 'Partial' : 'Error'}
                    </span>
                  </div>

                  <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-2">
                    <span className="text-gray-500 block">{isZh ? '上次增量接收' : 'Last Batch Ingest'}:</span>
                    <span className="font-bold text-xs text-white">
                      +{feed.ingestedInLastSync ?? 28} IoCs
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Interactive Simulation Controls (for testing different color states) */}
              {onSimulateState && (
                <div className="pt-3 border-t border-gray-800/80">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Sliders size={11} />
                      <span>{isZh ? '模擬情資狀態測試 (Simulate Status):' : 'Simulate Feed Condition:'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => onSimulateState('optimal')}
                      className="px-2 py-1.5 rounded-lg font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                      title="Simulate <200ms and 100% ingestion"
                    >
                      🟢 {isZh ? '極速綠' : 'Optimal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateState('moderate')}
                      className="px-2 py-1.5 rounded-lg font-bold bg-lime-500/10 hover:bg-lime-500/20 text-lime-300 border border-lime-500/30 transition-colors"
                      title="Simulate 310ms and 100% ingestion"
                    >
                      🟡 {isZh ? '正常黃' : 'Normal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateState('degraded')}
                      className="px-2 py-1.5 rounded-lg font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                      title="Simulate 640ms and 91% partial ingestion"
                    >
                      🟠 {isZh ? '降級橘' : 'Degraded'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateState('error')}
                      className="px-2 py-1.5 rounded-lg font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Simulate HTTP 504 timeout and 0% ingestion"
                    >
                      🔴 {isZh ? '異常紅' : 'Error'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Secondary in-card telemetry bar displayed in the card footer to give immediate visual
 * clarity on latency & ingestion health without opening the popover.
 */
export function InCardTelemetryBar({
  feed,
  isZh: propIsZh,
  onPing
}: {
  feed: FeedHealthProps;
  isZh?: boolean;
  onPing?: () => void;
}) {
  const { i18n } = useTranslation();
  const isZh = propIsZh !== undefined ? propIsZh : (!i18n.language || i18n.language.startsWith('zh'));
  const [isPinging, setIsPinging] = useState(false);
  const health = computeFeedHealth(feed, isZh);

  const handlePing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinging(true);
    if (onPing) onPing();
    setTimeout(() => setIsPinging(false), 500);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-gray-900/40 rounded-xl border border-gray-800/80 text-xs font-mono">
      {/* Latency breakdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase">{isZh ? '延遲' : 'RTT'}:</span>
          <span className={cn(
            "font-black text-[11px]",
            health.latencyTier === 'optimal' ? "text-emerald-400" :
            health.latencyTier === 'moderate' ? "text-lime-400" :
            health.latencyTier === 'slow' ? "text-amber-400" : "text-rose-400"
          )}>
            {feed.latencyMs}ms
          </span>
        </div>

        {/* Small sparkbar */}
        <div className="w-14 h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
          <div 
            style={{ width: `${Math.min(100, Math.max(10, (feed.latencyMs / 1000) * 100))}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-300",
              health.latencyTier === 'optimal' ? "bg-emerald-400" :
              health.latencyTier === 'moderate' ? "bg-lime-400" :
              health.latencyTier === 'slow' ? "bg-amber-400" : "bg-rose-500"
            )}
          />
        </div>

        {/* Ingestion percentage */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-800">
          <ShieldCheck size={12} className="text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase">{isZh ? '接收率' : 'Ingest'}:</span>
          <span className={cn(
            "font-black text-[11px]",
            health.ingestionTier === 'full' ? "text-emerald-400" :
            health.ingestionTier === 'partial' ? "text-amber-400" : "text-rose-400"
          )}>
            {feed.ingestionSuccessRate ?? 100}%
          </span>
        </div>

        {/* HTTP code */}
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold",
          (feed.httpStatusCode ?? 200) === 200 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
          (feed.httpStatusCode ?? 200) === 206 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        )}>
          HTTP {feed.httpStatusCode ?? 200}
        </span>
      </div>

      {/* Direct live probe button */}
      <button
        type="button"
        onClick={handlePing}
        disabled={isPinging || feed.status === 'paused'}
        className="flex items-center gap-1 px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-40"
        title={isZh ? "立即探測延遲與接收狀態" : "Ping feed now"}
      >
        <RefreshCw size={10} className={cn(isPinging && "animate-spin text-blue-400")} />
        <span>{isPinging ? (isZh ? '探測中...' : 'Probing...') : 'Ping'}</span>
      </button>
    </div>
  );
}

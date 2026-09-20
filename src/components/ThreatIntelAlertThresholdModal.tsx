import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Mail, 
  Send, 
  Radio, 
  Zap, 
  RefreshCw, 
  Play, 
  Pause, 
  ShieldCheck, 
  Volume2, 
  Info, 
  ExternalLink,
  Check,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ThreatFeed } from './ThreatIntelSourcesSettingView';

export interface ThreatIntelAlertThresholds {
  enabled: boolean;
  maxFailedAttempts: number; // 1 to 10 attempts
  highLatencyMs: number; // 200 to 3000 ms
  notifyChannels: {
    inApp: boolean;
    email: boolean;
    webhook: boolean;
    syslog: boolean;
  };
  emailRecipients: string;
  webhookUrl: string;
  autoPauseOnExceeded: boolean;
  suppressDurationMinutes: number;
}

export interface TriggeredFeedAlert {
  feedId: string;
  feedName: string;
  severity: 'critical' | 'warning';
  reasons: string[];
  consecutiveFailures: number;
  maxFailedAttemptsThreshold: number;
  latencyMs: number;
  highLatencyThreshold: number;
  httpStatusCode?: number;
  lastErrorMessage?: string;
  triggeredAt: number;
}

export function evaluateFeedAlerts(
  feeds: ThreatFeed[], 
  settings: ThreatIntelAlertThresholds
): TriggeredFeedAlert[] {
  if (!settings.enabled) return [];
  const alerts: TriggeredFeedAlert[] = [];

  for (const feed of feeds) {
    if (feed.status === 'paused') continue;

    const maxFailures = feed.customAlertThresholds?.enabled
      ? feed.customAlertThresholds.maxFailedAttempts
      : settings.maxFailedAttempts;

    const maxLatency = feed.customAlertThresholds?.enabled
      ? feed.customAlertThresholds.highLatencyMs
      : settings.highLatencyMs;

    const failures = feed.consecutiveFailures ?? (feed.status === 'error' ? 2 : 0);
    const latency = feed.latencyMs ?? 0;

    const reasons: string[] = [];
    let severity: 'critical' | 'warning' = 'warning';

    if (failures >= maxFailures) {
      severity = 'critical';
      reasons.push(
        `Failed Ingestion Attempts: ${failures} (Threshold: ≥${maxFailures})`
      );
    }

    if (latency >= maxLatency) {
      if (latency >= maxLatency * 1.4 || feed.status === 'error') {
        severity = 'critical';
      }
      reasons.push(
        `High Response Time: ${latency}ms (Threshold: ≥${maxLatency}ms)`
      );
    }

    if (reasons.length > 0) {
      alerts.push({
        feedId: feed.id,
        feedName: feed.name,
        severity,
        reasons,
        consecutiveFailures: failures,
        maxFailedAttemptsThreshold: maxFailures,
        latencyMs: latency,
        highLatencyThreshold: maxLatency,
        httpStatusCode: feed.httpStatusCode,
        lastErrorMessage: feed.lastErrorMessage,
        triggeredAt: Date.now()
      });
    }
  }

  return alerts;
}

interface ThreatIntelAlertThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThreatIntelAlertThresholds;
  onSaveThresholds: (settings: ThreatIntelAlertThresholds) => void;
  feeds: ThreatFeed[];
  onProbeFeed?: (feedId: string) => void;
  onTriggerTestNotification?: (type: 'failure' | 'latency') => void;
  isZh?: boolean;
}

export default function ThreatIntelAlertThresholdModal({
  isOpen,
  onClose,
  thresholds: initialThresholds,
  onSaveThresholds,
  feeds,
  onProbeFeed,
  onTriggerTestNotification,
  isZh = false
}: ThreatIntelAlertThresholdModalProps) {
  const [localSettings, setLocalSettings] = useState<ThreatIntelAlertThresholds>(initialThresholds);
  const [activeTab, setActiveTab] = useState<'thresholds' | 'channels' | 'active_alerts' | 'test'>('thresholds');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testSentType, setTestSentType] = useState<string | null>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(initialThresholds);
      setSavedSuccess(false);
      setTestSentType(null);
    }
  }, [isOpen, initialThresholds]);

  // Evaluate currently triggered alerts with current local settings
  const currentAlerts = evaluateFeedAlerts(feeds, localSettings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveThresholds(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleTestSim = (type: 'failure' | 'latency') => {
    setTestSentType(type);
    if (onTriggerTestNotification) {
      onTriggerTestNotification(type);
    }
    setTimeout(() => setTestSentType(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 rounded-xl text-amber-400 shadow-sm">
                <Bell size={20} className={localSettings.enabled ? "animate-pulse" : "text-gray-500"} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {isZh ? '威脅情資來源告警閾值與通知設定' : 'Threat Feed Ingestion Alert Thresholds'}
                  </h3>
                  {currentAlerts.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-500/20 border border-red-500/40 text-red-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span>{currentAlerts.length} {isZh ? '個端點觸發告警' : 'Active Alerts'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isZh
                    ? '設定 STIX/TAXII 饋送端點連續收錄失敗次數與高響應延遲閾值，自動推播告警通知並執行保護機制'
                    : 'Configure failure attempt limits and high response latency thresholds to trigger automated SOC notifications.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Master Alert Switch */}
              <div className="flex items-center gap-2 pr-2 border-r border-gray-800">
                <span className="text-xs font-bold text-gray-400">
                  {localSettings.enabled ? (isZh ? '告警監控已啟用' : 'Alerting Active') : (isZh ? '告警已關閉' : 'Alerting Off')}
                </span>
                <button
                  type="button"
                  onClick={() => setLocalSettings(s => ({ ...s, enabled: !s.enabled }))}
                  className={cn(
                    "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    localSettings.enabled ? "bg-amber-600" : "bg-gray-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      localSettings.enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-6 pt-3 bg-gray-900/40 border-b border-gray-800 flex items-center gap-2">
            {[
              { id: 'thresholds', label: isZh ? '觸發閾值設定' : 'Alert Thresholds', icon: Sliders },
              { id: 'channels', label: isZh ? '通知推播管道' : 'Notification Channels', icon: Radio },
              { 
                id: 'active_alerts', 
                label: isZh ? `違規情資來源 (${currentAlerts.length})` : `Breached Feeds (${currentAlerts.length})`, 
                icon: AlertTriangle,
                badgeColor: currentAlerts.length > 0 ? 'text-amber-400' : undefined
              },
              { id: 'test', label: isZh ? '告警推播模擬測試' : 'Simulate & Test', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all",
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                )}
              >
                <tab.icon size={13} className={tab.badgeColor} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* TAB 1: Thresholds Configuration */}
            {activeTab === 'thresholds' && (
              <div className="space-y-6">
                {/* Setting 1: Failed Ingestion Attempts */}
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-red-500/20 text-red-400">
                          <ShieldAlert size={14} />
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {isZh ? '收錄失敗次數觸發閾值 (Failed Ingestion Attempts)' : 'Failed Ingestion Attempts Limit'}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {isZh 
                          ? '當情資端點連續發生 N 次輪詢失敗（如 HTTP 5xx 伺服器錯誤、TLS 逾時或 STIX 物件解析異常）時，立即觸發告警通知。'
                          : 'Trigger notification after N consecutive polling failures (e.g. HTTP 5xx, connection dropped, empty bundle).'}
                      </p>
                    </div>

                    {/* Numeric Display & Stepper */}
                    <div className="flex items-center gap-2 bg-gray-950 border border-gray-700/80 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-gray-400 font-bold">{isZh ? '連續' : 'Threshold'}:</span>
                      <span className="text-base font-mono font-black text-amber-400">
                        {localSettings.maxFailedAttempts}
                      </span>
                      <span className="text-[11px] text-gray-400">{isZh ? '次失敗' : 'failures'}</span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="pt-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={localSettings.maxFailedAttempts}
                      onChange={(e) => setLocalSettings({ ...localSettings, maxFailedAttempts: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                      <span>1 ({isZh ? '最嚴格 / 即時' : 'Aggressive'})</span>
                      <span>2 ({isZh ? '推薦建議' : 'Recommended'})</span>
                      <span>3 ({isZh ? '適度容錯' : 'Moderate'})</span>
                      <span>5 ({isZh ? '高容忍' : 'Tolerant'})</span>
                      <span>10 ({isZh ? '寬鬆' : 'Relaxed'})</span>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      { val: 1, label: isZh ? '1 次 (敏感即時)' : '1 Attempt (Strict)' },
                      { val: 2, label: isZh ? '2 次 (平衡推薦)' : '2 Attempts (Recommended)' },
                      { val: 3, label: isZh ? '3 次 (過濾短暫抖動)' : '3 Attempts (Filtered)' },
                      { val: 5, label: isZh ? '5 次 (寬鬆免擾)' : '5 Attempts (Tolerant)' }
                    ].map(btn => (
                      <button
                        type="button"
                        key={btn.val}
                        onClick={() => setLocalSettings({ ...localSettings, maxFailedAttempts: btn.val })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border",
                          localSettings.maxFailedAttempts === btn.val
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-900/20"
                            : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200"
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Setting 2: High Response Time (Latency) */}
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                          <Activity size={14} />
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {isZh ? '端點響應延遲過高告警閾值 (High Response Time Threshold)' : 'High Response Time Latency Limit'}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {isZh 
                          ? '當情資來源探索或拉取 STIX 集合的往返時間 (RTT) 超出此閾值時，視為端點服務降級並觸發告警通知。'
                          : 'Trigger alert when round-trip response time exceeds this latency limit, indicating network throttling or feed degradation.'}
                      </p>
                    </div>

                    {/* Latency Display */}
                    <div className="flex items-center gap-2 bg-gray-950 border border-gray-700/80 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-gray-400 font-bold">{isZh ? '上限' : 'Limit'}:</span>
                      <span className="text-base font-mono font-black text-amber-400">
                        {localSettings.highLatencyMs}
                      </span>
                      <span className="text-[11px] text-gray-400">ms</span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="pt-2">
                    <input
                      type="range"
                      min={200}
                      max={2500}
                      step={50}
                      value={localSettings.highLatencyMs}
                      onChange={(e) => setLocalSettings({ ...localSettings, highLatencyMs: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                      <span className="text-green-400">200ms ({isZh ? '極速' : 'Fast'})</span>
                      <span className="text-lime-400">500ms</span>
                      <span className="text-amber-400">800ms ({isZh ? '推薦建議' : 'Recommended'})</span>
                      <span className="text-orange-400">1200ms</span>
                      <span className="text-red-400">2500ms ({isZh ? '極高' : 'High'})</span>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      { val: 300, label: '300 ms (Intranet/Gov)' },
                      { val: 500, label: '500 ms (Standard)' },
                      { val: 800, label: isZh ? '800 ms (推薦建議)' : '800 ms (Recommended)' },
                      { val: 1200, label: '1,200 ms (Relaxed TAXII)' },
                      { val: 2000, label: '2,000 ms (Satellite/VPN)' }
                    ].map(btn => (
                      <button
                        type="button"
                        key={btn.val}
                        onClick={() => setLocalSettings({ ...localSettings, highLatencyMs: btn.val })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border",
                          localSettings.highLatencyMs === btn.val
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-900/20"
                            : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200"
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Safety & Protection Policy */}
                <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-400" />
                    <span>{isZh ? '自動化保護與通知抑制機制' : 'Automated Protection & Alert Suppression'}</span>
                  </h4>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-bold text-gray-200 block">
                        {isZh ? '連續失敗嚴重時自動暫停情資饋送 (Auto-Pause Feed)' : 'Auto-Pause Feed on Excessive Failures'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {isZh 
                          ? `當失敗次數達 ${localSettings.maxFailedAttempts * 2} 次 (閾值之 2 倍) 時自動暫停該端點，防止連線阻塞與日誌暴增`
                          : `Automatically suspend feed if failures exceed 2x threshold (${localSettings.maxFailedAttempts * 2} attempts) to prevent worker starvation.`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalSettings(s => ({ ...s, autoPauseOnExceeded: !s.autoPauseOnExceeded }))}
                      className={cn(
                        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        localSettings.autoPauseOnExceeded ? "bg-blue-600" : "bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          localSettings.autoPauseOnExceeded ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-200 block">
                        {isZh ? '重複告警靜音冷卻週期 (Suppression Window)' : 'Notification Cooldown / Snooze Window'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {isZh ? '同一來源在冷卻時間內不重複發送相同告警推播' : 'Avoid duplicate alert storms during transient outage'}
                      </span>
                    </div>
                    <select
                      value={localSettings.suppressDurationMinutes}
                      onChange={(e) => setLocalSettings({ ...localSettings, suppressDurationMinutes: parseInt(e.target.value, 10) })}
                      className="bg-gray-900 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                    >
                      <option value={10}>10 {isZh ? '分鐘' : 'Minutes'}</option>
                      <option value={30}>30 {isZh ? '分鐘 (推薦)' : 'Minutes (Recommended)'}</option>
                      <option value={60}>1 {isZh ? '小時' : 'Hour'}</option>
                      <option value={180}>3 {isZh ? '小時' : 'Hours'}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Channels Configuration */}
            {activeTab === 'channels' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    {isZh ? '告警推播管道選擇 (Notification Delivery Channels)' : 'Delivery Channels'}
                  </h4>

                  {/* Channel 1: In-App Banner */}
                  <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                        <Bell size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {isZh ? '平台即時頂部橫幅與系統 Toast 提示' : 'In-App Top Banner & Toast Notification'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {isZh ? '在 Threat Intel Sources 頁面上方即時顯示告警警告橫幅與計數' : 'Display high-visibility warning banner and notification badge.'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.notifyChannels.inApp}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        notifyChannels: { ...localSettings.notifyChannels, inApp: e.target.checked }
                      })}
                      className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {/* Channel 2: Email Alert */}
                  <div className="space-y-2 p-3 bg-gray-950 border border-gray-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                          <Mail size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {isZh ? 'SOC 資安維運小組電子郵件 (SOC Alert Email)' : 'SOC Security Team Email Alerts'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {isZh ? '寄送收錄異常與端點失敗摘要至指定的收件信箱' : 'Dispatch automated incident email on threshold violations.'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localSettings.notifyChannels.email}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          notifyChannels: { ...localSettings.notifyChannels, email: e.target.checked }
                        })}
                        className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    {localSettings.notifyChannels.email && (
                      <div className="pt-2 pl-11">
                        <input
                          type="text"
                          value={localSettings.emailRecipients}
                          onChange={(e) => setLocalSettings({ ...localSettings, emailRecipients: e.target.value })}
                          placeholder="soc-tier2@ke-la.com, threat-intel-ops@corp.internal"
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Channel 3: Webhook (SIEM / Slack / Teams) */}
                  <div className="space-y-2 p-3 bg-gray-950 border border-gray-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                          <Send size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {isZh ? 'SIEM / Slack / Teams 外部 Webhook 轉發' : 'Webhook Dispatch (Slack / Teams / Splunk)'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {isZh ? '向外部資安事件回報端點發送 JSON Webhook 酬載' : 'POST structured JSON incident payload to SIEM or team channel.'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localSettings.notifyChannels.webhook}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          notifyChannels: { ...localSettings.notifyChannels, webhook: e.target.checked }
                        })}
                        className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    {localSettings.notifyChannels.webhook && (
                      <div className="pt-2 pl-11">
                        <input
                          type="url"
                          value={localSettings.webhookUrl}
                          onChange={(e) => setLocalSettings({ ...localSettings, webhookUrl: e.target.value })}
                          placeholder="https://hooks.slack.com/services/T00/B00/X00 or https://siem.internal/api/taxii-alert"
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Channel 4: Syslog */}
                  <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
                        <Server size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {isZh ? 'Syslog (RFC 5424) 本地/遠端日誌轉送' : 'Syslog (RFC 5424) Telemetry Audit'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {isZh ? '將饋送告警事件寫入平台安全稽核紀錄 (Facility: LOG_LOCAL0)' : 'Stream structured syslog events to central SIEM collector.'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.notifyChannels.syslog}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        notifyChannels: { ...localSettings.notifyChannels, syslog: e.target.checked }
                      })}
                      className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Breached Feeds List */}
            {activeTab === 'active_alerts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isZh ? '目前超出閾值之情資來源清單' : 'Feeds Currently Breaching Alert Thresholds'}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {currentAlerts.length} / {feeds.length} feeds
                  </span>
                </div>

                {currentAlerts.length === 0 ? (
                  <div className="p-8 text-center bg-gray-900/40 border border-gray-800 rounded-xl space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-green-400" />
                    <h5 className="text-sm font-bold text-white">
                      {isZh ? '目前無任何情資來源觸發告警' : 'All Feeds Healthy'}
                    </h5>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      {isZh 
                        ? `所有運作中端點之連續失敗次數均低於 ${localSettings.maxFailedAttempts} 次，且響應延遲均低於 ${localSettings.highLatencyMs}ms。`
                        : `All active feeds have fewer than ${localSettings.maxFailedAttempts} failed attempts and latency under ${localSettings.highLatencyMs}ms.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentAlerts.map(alert => {
                      const feed = feeds.find(f => f.id === alert.feedId);
                      return (
                        <div
                          key={alert.feedId}
                          className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              <h5 className="text-xs font-bold text-white">{alert.feedName}</h5>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300">
                                {alert.severity.toUpperCase()}
                              </span>
                            </div>

                            {onProbeFeed && (
                              <button
                                type="button"
                                onClick={() => onProbeFeed(alert.feedId)}
                                className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-bold text-gray-200 rounded-lg flex items-center gap-1.5 transition-all"
                              >
                                <RefreshCw size={11} />
                                <span>{isZh ? '重新探測 (Probe)' : 'Re-Probe Feed'}</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                                {isZh ? '連續失敗次數' : 'Ingestion Failures'}
                              </span>
                              <span className={cn(
                                "font-mono font-bold",
                                alert.consecutiveFailures >= alert.maxFailedAttemptsThreshold ? "text-red-400" : "text-gray-300"
                              )}>
                                {alert.consecutiveFailures} / {alert.maxFailedAttemptsThreshold} allowed
                              </span>
                            </div>

                            <div className="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                                {isZh ? '當前響應延遲' : 'Response Latency'}
                              </span>
                              <span className={cn(
                                "font-mono font-bold",
                                alert.latencyMs >= alert.highLatencyThreshold ? "text-amber-400" : "text-gray-300"
                              )}>
                                {alert.latencyMs}ms (Threshold: {alert.highLatencyThreshold}ms)
                              </span>
                            </div>
                          </div>

                          {/* Violations */}
                          <div className="space-y-1 pt-1">
                            {alert.reasons.map((r, i) => (
                              <div key={i} className="text-[11px] text-red-300/90 flex items-center gap-1.5">
                                <AlertTriangle size={12} className="text-red-400 shrink-0" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Simulation & Test Alerts */}
            {activeTab === 'test' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    <span>{isZh ? '告警推播功能驗證測試 (Notification Simulation)' : 'Simulate Trigger & Test Alerts'}</span>
                  </h4>
                  <p className="text-xs text-gray-400">
                    {isZh
                      ? '在不影響實際威脅情資運作的情況下，發送模擬收錄失敗或高延遲警報，以驗證桌面通知、橫幅、電子郵件及 Webhook 是否正常觸發。'
                      : 'Trigger synthetic threshold events to verify banner notifications, email dispatch, and SIEM webhook integration.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestSim('failure')}
                      disabled={testSentType !== null}
                      className="p-3.5 bg-gray-950 hover:bg-gray-900 border border-red-500/30 hover:border-red-500/60 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                          <ShieldAlert size={14} />
                          <span>{isZh ? '測試收錄失敗告警' : 'Test Ingestion Failure Alert'}</span>
                        </span>
                        {testSentType === 'failure' && (
                          <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                            <Check size={12} /> Sent!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {isZh 
                          ? `模擬端點連續 ${localSettings.maxFailedAttempts} 次失敗 (HTTP 504 Timeout) 觸發通知` 
                          : `Simulate ${localSettings.maxFailedAttempts} consecutive failed attempts`}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestSim('latency')}
                      disabled={testSentType !== null}
                      className="p-3.5 bg-gray-950 hover:bg-gray-900 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Activity size={14} />
                          <span>{isZh ? '測試高延遲告警' : 'Test High Latency Alert'}</span>
                        </span>
                        {testSentType === 'latency' && (
                          <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                            <Check size={12} /> Sent!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {isZh 
                          ? `模擬端點 RTT 達 ${localSettings.highLatencyMs + 240}ms (超限) 觸發警告通知` 
                          : `Simulate high response time (${localSettings.highLatencyMs + 240}ms)`}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Notification Payload Format Preview */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    {isZh ? 'Webhook / Syslog 告警推播 JSON 酬載預覽' : 'Alert Dispatch JSON Payload Sample'}
                  </span>
                  <pre className="p-3.5 bg-black/90 border border-gray-800 rounded-xl font-mono text-[11px] text-amber-300/90 overflow-x-auto">
{JSON.stringify({
  event: "THREAT_FEED_ALERT_TRIGGERED",
  timestamp: new Date().toISOString(),
  thresholds: {
    maxFailedAttempts: localSettings.maxFailedAttempts,
    highLatencyMs: localSettings.highLatencyMs
  },
  triggerDetails: {
    feedId: "feed-shadowserver-critical",
    feedName: "Shadowserver Foundation Sinkhole Telemetry",
    consecutiveFailures: 2,
    currentLatencyMs: 1380,
    httpStatus: 504,
    reasons: [
      `Consecutive Ingestion Failures: 2 >= ${localSettings.maxFailedAttempts}`,
      `High Latency: 1380ms >= ${localSettings.highLatencyMs}ms`
    ]
  },
  severity: "CRITICAL",
  channelsDispatched: Object.keys(localSettings.notifyChannels).filter(
    (k) => localSettings.notifyChannels[k as keyof typeof localSettings.notifyChannels]
  )
}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {savedSuccess ? (
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    <span>{isZh ? '閾值設定已成功儲存！' : 'Threshold settings saved successfully!'}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500">
                    {isZh ? '設定將同步套用至所有未設個別覆蓋的 STIX/TAXII 情資來源。' : 'Thresholds apply globally across all threat feeds.'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{isZh ? '儲存告警閾值設定' : 'Save Thresholds'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

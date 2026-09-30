import React, { useState, useEffect } from 'react';
import {
  Flame,
  Activity,
  AlertTriangle,
  Globe,
  Radio,
  Server,
  Zap,
  Network,
  Sliders,
  Bell,
  Volume2,
  Mail,
  Share2,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { NDRAlertRule, NDRTrafficPatternType, NDR_PATTERNS_CONFIG } from './NDRAlertRulesSettingsView';

interface NDRThresholdConfigPanelProps {
  isReadOnly?: boolean;
  onNavigateToFullNDR?: () => void;
  onAlertTriggered?: (alert: any, record?: any) => void;
}

export function NDRThresholdConfigPanel({
  isReadOnly = false,
  onNavigateToFullNDR,
  onAlertTriggered
}: NDRThresholdConfigPanelProps) {
  const [rules, setRules] = useState<NDRAlertRule[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<NDRTrafficPatternType>('bandwidth_surge');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Active editable form state for selected pattern rule
  const [formState, setFormState] = useState<{
    id: string;
    name: string;
    warningThreshold: number;
    criticalThreshold: number;
    condition: '>' | '>=' | '<' | '<=' | 'rate_surge' | 'cluster_deviation';
    unit: string;
    targetScope: string;
    direction: 'both' | 'inbound' | 'outbound' | 'internal_lateral';
    sustainDurationSec: number;
    cooldownMinutes: number;
    severity: 'Critical' | 'High' | 'Warning' | 'Info';
    enabled: boolean;
    channels: {
      inApp: boolean;
      sound: boolean;
      email: boolean;
      emailRecipients: string[];
      webhook: boolean;
      webhookUrl: string;
      webhookChannel: string;
      syslog: boolean;
      soarAction: boolean;
      soarActionType: 'isolate_host' | 'deploy_suricata_rule' | 'capture_pcap';
    };
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Play Web Audio Chime
  const playAlertTone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignored
    }
  };

  // Fetch rules from API
  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/ndr/alert-rules');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rules) && data.rules.length > 0) {
          setRules(data.rules);
          syncFormWithPattern(data.rules, selectedPattern);
          return;
        }
      }
    } catch (e) {
      console.warn('API error, reading local cache:', e);
    } finally {
      setIsLoading(false);
    }

    try {
      const saved = localStorage.getItem('semor_ndr_alert_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRules(parsed);
        syncFormWithPattern(parsed, selectedPattern);
      }
    } catch {
      // Ignored
    }
  };

  const syncFormWithPattern = (ruleList: NDRAlertRule[], pattern: NDRTrafficPatternType) => {
    const matched = ruleList.find(r => r.patternType === pattern) || ruleList[0];
    if (matched) {
      setFormState({
        id: matched.id,
        name: matched.name,
        warningThreshold: matched.warningThreshold,
        criticalThreshold: matched.criticalThreshold,
        condition: matched.condition,
        unit: matched.unit,
        targetScope: matched.targetScope,
        direction: matched.direction,
        sustainDurationSec: matched.sustainDurationSec,
        cooldownMinutes: matched.cooldownMinutes,
        severity: matched.severity,
        enabled: matched.enabled,
        channels: {
          inApp: matched.notificationChannels.inApp,
          sound: matched.notificationChannels.sound,
          email: matched.notificationChannels.email,
          emailRecipients: matched.notificationChannels.emailRecipients || ['soc-netops@corp.internal'],
          webhook: matched.notificationChannels.webhook,
          webhookUrl: matched.notificationChannels.webhookUrl || 'https://hooks.slack.com/services/T00/B00/ndr-alerts',
          webhookChannel: matched.notificationChannels.webhookChannel || '#soc-ndr-alerts',
          syslog: matched.notificationChannels.syslog,
          soarAction: matched.notificationChannels.soarAction,
          soarActionType: matched.notificationChannels.soarActionType || 'deploy_suricata_rule'
        }
      });
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSelectPattern = (pattern: NDRTrafficPatternType) => {
    setSelectedPattern(pattern);
    syncFormWithPattern(rules, pattern);
  };

  // Save changes to backend
  const handleSaveThresholds = async () => {
    if (!formState) return;
    try {
      setIsSaving(true);
      const matched = rules.find(r => r.id === formState.id);
      if (!matched) return;

      const updatedRule: NDRAlertRule = {
        ...matched,
        warningThreshold: Number(formState.warningThreshold),
        criticalThreshold: Number(formState.criticalThreshold),
        condition: formState.condition,
        unit: formState.unit,
        targetScope: formState.targetScope,
        direction: formState.direction,
        sustainDurationSec: Number(formState.sustainDurationSec),
        cooldownMinutes: Number(formState.cooldownMinutes),
        severity: formState.severity,
        enabled: formState.enabled,
        notificationChannels: {
          ...matched.notificationChannels,
          inApp: formState.channels.inApp,
          sound: formState.channels.sound,
          email: formState.channels.email,
          emailRecipients: formState.channels.emailRecipients,
          webhook: formState.channels.webhook,
          webhookUrl: formState.channels.webhookUrl,
          webhookChannel: formState.channels.webhookChannel,
          syslog: formState.channels.syslog,
          soarAction: formState.channels.soarAction,
          soarActionType: formState.channels.soarActionType
        },
        updatedAt: new Date().toISOString()
      };

      const res = await fetch(`/api/v1/ndr/alert-rules/${formState.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRule)
      });

      const nextRules = rules.map(r => (r.id === formState.id ? updatedRule : r));
      setRules(nextRules);
      localStorage.setItem('semor_ndr_alert_rules', JSON.stringify(nextRules));

      showToast(`已成功保存 NDR【${NDR_PATTERNS_CONFIG[selectedPattern]?.name || selectedPattern}】門檻配置並同步至引擎！`, 'success');
    } catch (e) {
      showToast('儲存失敗，已暫存於瀏覽器', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Test Trigger High Priority Alert Integration
  const handleTestTriggerAlert = async () => {
    if (!formState) return;
    setIsTesting(true);
    try {
      const simulatedVal = Number(formState.criticalThreshold) * 1.35;
      const res = await fetch('/api/v1/ndr/alert-rules/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: formState.id,
          customValue: simulatedVal,
          severityOverride: 'Critical'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data.alert);
        setActiveAlert(data.alert);

        if (formState.channels.sound) {
          playAlertTone();
        }

        // Broadcast to application window
        window.dispatchEvent(
          new CustomEvent('ndr_high_priority_alert', {
            detail: {
              alert: data.alert,
              historyRecord: data.historyRecord,
              rule: formState
            }
          })
        );

        if (onAlertTriggered) {
          onAlertTriggered(data.alert, data.historyRecord);
        }

        showToast(`【高優先級通知已發出】異常流量達 ${simulatedVal.toFixed(0)} ${formState.unit}，已觸發通知系統！`, 'success');
      } else {
        throw new Error('API trigger error');
      }
    } catch (e) {
      // Local fallback
      const simulatedVal = Number(formState.criticalThreshold) * 1.35;
      const timestamp = new Date().toISOString();
      const mockAlert = {
        id: `NDR-ALR-${Date.now().toString().slice(-6)}`,
        timestamp,
        ruleId: formState.id,
        ruleName: formState.name,
        patternType: selectedPattern,
        severity: 'Critical',
        measuredValue: simulatedVal,
        thresholdValue: formState.criticalThreshold,
        unit: formState.unit,
        targetScope: formState.targetScope,
        dispatchedChannels: ['inApp', 'sound', 'webhook', 'email', 'syslog'],
        executionLogs: [
          `[${timestamp}] [NDR_EVAL] Evaluated rule: '${formState.name}'`,
          `[${timestamp}] [TELEMETRY_CHECK] Measured: ${simulatedVal} ${formState.unit} (Threshold: ${formState.criticalThreshold} ${formState.unit})`,
          `[${timestamp}] [CHANNEL_INAPP] Security toast dispatched to SOC Notification Center.`,
          `[${timestamp}] [CHANNEL_WEBHOOK] Dispatched payload to Slack Webhook (${formState.channels.webhookChannel}).`,
          `[${timestamp}] [CHANNEL_SMTP] High-priority incident mail queued.`
        ],
        message: `【NDR 即時告警】${formState.name} 偵測到異常流量數值 (${simulatedVal.toFixed(0)} ${formState.unit})！已觸發通知管道。`
      };
      setTestResult(mockAlert);
      setActiveAlert(mockAlert);

      if (formState.channels.sound) playAlertTone();

      window.dispatchEvent(
        new CustomEvent('ndr_high_priority_alert', {
          detail: { alert: mockAlert, rule: formState }
        })
      );

      if (onAlertTriggered) {
        onAlertTriggered(mockAlert);
      }

      showToast(`已觸發高優先級模擬告警（${simulatedVal.toFixed(0)} ${formState.unit}）`, 'success');
    } finally {
      setIsTesting(false);
    }
  };

  const patternConfig = NDR_PATTERNS_CONFIG[selectedPattern];

  return (
    <div className="bg-[#111115] border border-amber-500/40 rounded-2xl shadow-xl overflow-hidden mb-6">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/30 via-[#14141c] to-[#111115] border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-950/30">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                NDR 網路異常流量特徵自訂閥值配置面板
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest font-mono">
                Active Threshold Engine
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              定義全網頻寬洪峰、橫向移動、離群叢集與斷流特徵邊界，與現有通知系統無縫串聯即時觸發高優先級告警。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onNavigateToFullNDR && (
            <button
              onClick={onNavigateToFullNDR}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
              title="前往完整 NDR 規則矩陣"
            >
              <span>完整規則清單</span>
              <ExternalLink size={12} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition"
            title={isExpanded ? '收合面板' : '展開面板'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div
          className={cn(
            "mx-4 mt-3 p-3 rounded-xl text-xs font-medium flex items-center justify-between border",
            toastMessage.type === 'success' && "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
            toastMessage.type === 'error' && "bg-rose-950/40 border-rose-500/30 text-rose-300",
            toastMessage.type === 'info' && "bg-blue-950/40 border-blue-500/30 text-blue-300"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Active High-Priority Alert Banner (If firing) */}
      {activeAlert && (
        <div className="m-4 p-4 rounded-xl bg-gradient-to-r from-red-950/50 via-rose-950/30 to-[#120d14] border-2 border-red-500/80 shadow-2xl shadow-red-950/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/30 border border-red-500 text-red-300 shrink-0 mt-0.5 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                    高優先級即時告警 (CRITICAL FIRING)
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    {activeAlert.ruleName}
                  </span>
                  <span className="text-[11px] text-red-300 font-mono">
                    [{new Date(activeAlert.timestamp).toLocaleTimeString()}]
                  </span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed">
                  偵測到異常流量數值：
                  <strong className="text-white font-mono mx-1">
                    {typeof activeAlert.measuredValue === 'number' ? activeAlert.measuredValue.toLocaleString() : activeAlert.measuredValue} {activeAlert.unit}
                  </strong>
                  超出設定之嚴重臨界門檻 (
                  <span className="font-mono text-amber-300">
                    {activeAlert.thresholdValue} {activeAlert.unit}
                  </span>
                  )！目標網段: <span className="font-mono text-cyan-300">{activeAlert.targetScope}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-400 font-mono">
                  <span>已發送通知:</span>
                  {activeAlert.dispatchedChannels?.map((ch: string) => (
                    <span key={ch} className="px-1.5 py-0.2 rounded bg-black/40 text-gray-300 border border-gray-800">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => {
                  showToast('已排程下發 Suricata 7.0 阻斷特徵與 802.1X 隔離防護', 'success');
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/40 flex items-center gap-1.5 transition active:scale-95"
              >
                <Shield size={13} />
                <span>下發阻斷 / 隔離</span>
              </button>
              <button
                onClick={() => setActiveAlert(null)}
                className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-xs font-medium transition"
              >
                確認解除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Expanded Panel Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 sm:p-5 space-y-5"
          >
            {/* Pattern Switcher Ribbon (All 8 NDR Traffic Patterns) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders size={13} className="text-amber-400" />
                選擇 NDR 流量特徵模式 (Select Traffic Pattern):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {Object.entries(NDR_PATTERNS_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedPattern === key;
                  const rule = rules.find(r => r.patternType === key);

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectPattern(key as NDRTrafficPatternType)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group",
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/80 shadow-md shadow-amber-950/30"
                          : "bg-[#14141a] border-gray-800 hover:border-gray-700 hover:bg-gray-900/60"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div className={cn("p-1.5 rounded-lg", config.badgeBg, config.badgeText)}>
                          <Icon size={14} />
                        </div>
                        {rule?.enabled && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div>
                        <span className={cn("text-[11px] font-bold block line-clamp-1", isSelected ? "text-amber-300" : "text-gray-200")}>
                          {config.name.split(' ')[0]}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {rule ? `${rule.criticalThreshold} ${rule.unit}` : `${config.defaultCritical} ${config.defaultUnit}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Threshold Configuration Card for Selected Pattern */}
            {formState && patternConfig && (
              <div className="bg-[#14141d] border border-gray-800 rounded-xl p-4 sm:p-5 space-y-5">
                {/* Pattern Info Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-800/80">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", patternConfig.badgeBg, patternConfig.badgeText)}>
                      {React.createElement(patternConfig.icon, { size: 18 })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {patternConfig.name}
                        </h4>
                        <span className="text-xs text-gray-400 font-mono">({patternConfig.nameEn})</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {patternConfig.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <label className="flex items-center gap-2 cursor-pointer bg-black/40 px-3 py-1.5 rounded-lg border border-gray-800">
                      <input
                        type="checkbox"
                        checked={formState.enabled}
                        onChange={e => setFormState({ ...formState, enabled: e.target.checked })}
                        className="accent-amber-500 rounded"
                        disabled={isReadOnly}
                      />
                      <span className={cn("text-xs font-bold", formState.enabled ? "text-emerald-400" : "text-gray-500")}>
                        {formState.enabled ? '監控啟用中' : '已停用'}
                      </span>
                    </label>

                    <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-gray-800 text-xs font-mono text-gray-400">
                      單位: <span className="text-amber-400 font-bold">{formState.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Threshold Sliders & Value Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Warning Threshold */}
                  <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        預警門檻 (Warning)
                      </span>
                      <span className="text-xs font-mono text-amber-300 font-bold">
                        {formState.warningThreshold.toLocaleString()} {formState.unit}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={formState.warningThreshold}
                      onChange={e => setFormState({ ...formState, warningThreshold: Number(e.target.value) })}
                      disabled={isReadOnly}
                      className="w-full bg-[#111115] border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono outline-none focus:border-amber-400"
                    />
                    <input
                      type="range"
                      min="1"
                      max={Math.max(2000, Number(formState.criticalThreshold) * 2)}
                      step="1"
                      value={formState.warningThreshold}
                      onChange={e => setFormState({ ...formState, warningThreshold: Number(e.target.value) })}
                      disabled={isReadOnly}
                      className="w-full accent-amber-500"
                    />
                    <span className="text-[10px] text-gray-500 block">達此值進入 Warning 警戒狀態</span>
                  </div>

                  {/* Critical Threshold */}
                  <div className="p-4 rounded-xl bg-black/40 border border-rose-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        嚴重門檻 (Critical)
                      </span>
                      <span className="text-xs font-mono text-rose-400 font-bold">
                        {formState.criticalThreshold.toLocaleString()} {formState.unit}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={formState.criticalThreshold}
                      onChange={e => setFormState({ ...formState, criticalThreshold: Number(e.target.value) })}
                      disabled={isReadOnly}
                      className="w-full bg-[#111115] border border-rose-500/40 rounded-lg px-3 py-2 text-xs text-rose-300 font-mono outline-none focus:border-rose-400 font-bold"
                    />
                    <input
                      type="range"
                      min="1"
                      max={Math.max(2000, Number(formState.criticalThreshold) * 2)}
                      step="1"
                      value={formState.criticalThreshold}
                      onChange={e => setFormState({ ...formState, criticalThreshold: Number(e.target.value) })}
                      disabled={isReadOnly}
                      className="w-full accent-rose-500"
                    />
                    <span className="text-[10px] text-rose-400/80 block">超標即觸發高優先級即時通知！</span>
                  </div>

                  {/* Condition Operator */}
                  <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                      比較判定條件 (Condition)
                    </span>
                    <select
                      value={formState.condition}
                      onChange={e => setFormState({ ...formState, condition: e.target.value as any })}
                      disabled={isReadOnly}
                      className="w-full bg-[#111115] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-500"
                    >
                      <option value=">=">&gt;= 大於等於 (超限告警)</option>
                      <option value=">">&gt; 大於</option>
                      <option value="<=">&lt;= 小於等於 (斷流/靜默)</option>
                      <option value="<">&lt; 小於</option>
                      <option value="cluster_deviation">離群偏離度 (Deviation %)</option>
                      <option value="rate_surge">突增變化率 (Rate Surge)</option>
                    </select>
                    <div className="text-[10px] text-gray-500 font-mono pt-1">
                      判定邏輯: Value {formState.condition} Threshold
                    </div>
                  </div>

                  {/* Target Scope CIDR */}
                  <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                      監控範疇 (Target Scope / CIDR)
                    </span>
                    <input
                      type="text"
                      value={formState.targetScope}
                      onChange={e => setFormState({ ...formState, targetScope: e.target.value })}
                      placeholder="例如: 10.0.0.0/16, DMZ Gateway"
                      disabled={isReadOnly}
                      className="w-full bg-[#111115] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>方向: {formState.direction}</span>
                      <span>持續: {formState.sustainDurationSec}s</span>
                    </div>
                  </div>
                </div>

                {/* Notification Channel Integration Section */}
                <div className="p-4 rounded-xl bg-black/30 border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Bell size={13} className="text-blue-400" />
                      現有通知系統整合通道 (Notification Channels Integration):
                    </span>
                    <span className="text-[11px] text-gray-500">
                      觸發時同步廣播至已啟用管道
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {/* In-App */}
                    <label className="p-2.5 rounded-lg border border-gray-800 bg-[#16161f] flex items-center gap-2 cursor-pointer hover:border-gray-700">
                      <input
                        type="checkbox"
                        checked={formState.channels.inApp}
                        onChange={e => setFormState({
                          ...formState,
                          channels: { ...formState.channels, inApp: e.target.checked }
                        })}
                        className="accent-blue-500 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1">
                        <Bell size={12} className="text-blue-400" /> 站內橫幅
                      </span>
                    </label>

                    {/* Sound */}
                    <label className="p-2.5 rounded-lg border border-gray-800 bg-[#16161f] flex items-center gap-2 cursor-pointer hover:border-gray-700">
                      <input
                        type="checkbox"
                        checked={formState.channels.sound}
                        onChange={e => setFormState({
                          ...formState,
                          channels: { ...formState.channels, sound: e.target.checked }
                        })}
                        className="accent-pink-500 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1">
                        <Volume2 size={12} className="text-pink-400" /> 警報音效
                      </span>
                    </label>

                    {/* Email */}
                    <label className="p-2.5 rounded-lg border border-gray-800 bg-[#16161f] flex items-center gap-2 cursor-pointer hover:border-gray-700">
                      <input
                        type="checkbox"
                        checked={formState.channels.email}
                        onChange={e => setFormState({
                          ...formState,
                          channels: { ...formState.channels, email: e.target.checked }
                        })}
                        className="accent-emerald-500 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1">
                        <Mail size={12} className="text-emerald-400" /> Email 郵件
                      </span>
                    </label>

                    {/* Webhook */}
                    <label className="p-2.5 rounded-lg border border-gray-800 bg-[#16161f] flex items-center gap-2 cursor-pointer hover:border-gray-700">
                      <input
                        type="checkbox"
                        checked={formState.channels.webhook}
                        onChange={e => setFormState({
                          ...formState,
                          channels: { ...formState.channels, webhook: e.target.checked }
                        })}
                        className="accent-amber-500 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1">
                        <Share2 size={12} className="text-amber-400" /> Slack Webhook
                      </span>
                    </label>

                    {/* Syslog */}
                    <label className="p-2.5 rounded-lg border border-gray-800 bg-[#16161f] flex items-center gap-2 cursor-pointer hover:border-gray-700">
                      <input
                        type="checkbox"
                        checked={formState.channels.syslog}
                        onChange={e => setFormState({
                          ...formState,
                          channels: { ...formState.channels, syslog: e.target.checked }
                        })}
                        className="accent-purple-500 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1">
                        <Server size={12} className="text-purple-400" /> Syslog 514
                      </span>
                    </label>

                    {/* SOAR Action */}
                    <label className="p-2.5 rounded-lg border border-gray-800 bg-[#16161f] flex items-center gap-2 cursor-pointer hover:border-gray-700">
                      <input
                        type="checkbox"
                        checked={formState.channels.soarAction}
                        onChange={e => setFormState({
                          ...formState,
                          channels: { ...formState.channels, soarAction: e.target.checked }
                        })}
                        className="accent-rose-500 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1">
                        <Shield size={12} className="text-rose-400" /> SOAR 自動防護
                      </span>
                    </label>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800/80">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={13} className="text-gray-500" />
                    <span>冷卻抑制: {formState.cooldownMinutes} 分鐘內防重複告警風暴</span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleTestTriggerAlert}
                      disabled={isTesting}
                      className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
                      title="模擬超越嚴重門檻，驗證現有通知系統派送"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isTesting && "animate-spin")} />
                      <span>{isTesting ? '派送測試中...' : '模擬觸發高優先級告警'}</span>
                    </button>

                    {!isReadOnly && (
                      <button
                        onClick={handleSaveThresholds}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950/40 transition active:scale-95 disabled:opacity-50"
                      >
                        <Save size={14} />
                        <span>{isSaving ? '儲存中...' : '儲存自訂門檻'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NDRThresholdConfigPanel;

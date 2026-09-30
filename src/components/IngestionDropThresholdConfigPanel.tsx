import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Sliders,
  Bell,
  Mail,
  Send,
  Volume2,
  VolumeX,
  ShieldAlert,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  Zap,
  Radio,
  Clock,
  Layers,
  Info,
  Save,
  RotateCcw,
  Sparkles,
  Server,
  Activity,
  ArrowDownRight,
  Play,
  XCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface DropThresholdSettings {
  enabled: boolean;
  dropWarningThreshold: number;
  dropCriticalThreshold: number;
  dropPercentageThreshold: number;
  consecutiveMinutes: number;
  channels: {
    inApp: boolean;
    email: boolean;
    webhook: boolean;
    syslog: boolean;
    sound: boolean;
  };
  emailRecipients: string;
  webhookUrl: string;
  autoProbeOnDrop: boolean;
}

export interface DropAlert {
  id: string;
  timestamp: number;
  timeLabel: string;
  severity: 'warning' | 'critical';
  title: string;
  volume: number;
  threshold: number;
  dropPercentage?: number;
  expectedVolume?: number;
  impact: string;
  recommendation: string;
  rootCause: string;
}

interface IngestionDropThresholdConfigPanelProps {
  isZh?: boolean;
  onThresholdsUpdated?: (settings: DropThresholdSettings) => void;
  onClose?: () => void;
  standalone?: boolean;
}

const DEFAULT_SETTINGS: DropThresholdSettings = {
  enabled: true,
  dropWarningThreshold: 15000,
  dropCriticalThreshold: 5000,
  dropPercentageThreshold: 45,
  consecutiveMinutes: 2,
  channels: {
    inApp: true,
    email: true,
    webhook: true,
    syslog: false,
    sound: true
  },
  emailRecipients: 'admin-infra@corp.internal, soc-oncall@corp.internal',
  webhookUrl: 'https://hooks.slack.com/services/T00/B00/soc-collector-alerts',
  autoProbeOnDrop: true
};

export function IngestionDropThresholdConfigPanel({
  isZh = true,
  onThresholdsUpdated,
  onClose,
  standalone = false
}: IngestionDropThresholdConfigPanelProps) {
  const [settings, setSettings] = useState<DropThresholdSettings>(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<DropThresholdSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeAlert, setActiveAlert] = useState<DropAlert | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<DropAlert[]>([]);
  const [currentVolume, setCurrentVolume] = useState<number>(24500);
  const [currentEps, setCurrentEps] = useState<number>(408);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSimulatingDrop, setIsSimulatingDrop] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'thresholds' | 'notifications' | 'simulation' | 'history'>('thresholds');

  // Fetch current settings from backend API
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/engine/collector/throughput-history/drop-thresholds');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.dropThresholds) {
            setSettings(data.dropThresholds);
            setTempSettings(data.dropThresholds);
          }
          if (data.activeDropAlert) {
            setActiveAlert(data.activeDropAlert);
          } else {
            setActiveAlert(null);
          }
          if (Array.isArray(data.recentDropAlerts)) {
            setRecentAlerts(data.recentDropAlerts);
          }
        }
      }

      // Also get current live volume
      const histRes = await fetch('/api/engine/collector/throughput-history?window=15');
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.summary) {
          setCurrentVolume(histData.summary.currentMinuteVolume || 24500);
          setCurrentEps(histData.summary.currentMinuteEps || 408);
          if (histData.summary.activeDropAlert) {
            setActiveAlert(histData.summary.activeDropAlert);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load drop threshold settings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const timer = setInterval(fetchSettings, 6000);
    return () => clearInterval(timer);
  }, []);

  // Save settings to backend
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/engine/collector/throughput-history/drop-thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.dropThresholds || tempSettings);
        onThresholdsUpdated?.(data.dropThresholds || tempSettings);
        setFeedbackMsg({
          text: isZh ? '進線量閾值與突降即時告警設定已成功儲存並同步至收集器核心！' : 'Drop thresholds & alerting settings saved successfully!',
          type: 'success'
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (e) {
      setFeedbackMsg({
        text: isZh ? '儲存設定失敗，請確認後端服務連線狀態。' : 'Failed to save settings to backend.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to recommended defaults
  const handleResetDefaults = () => {
    setTempSettings(DEFAULT_SETTINGS);
    setFeedbackMsg({
      text: isZh ? '已重置為資安維運中心 (SOC) 建議的進線閾值基準。請點擊「儲存」套用。' : 'Reset to recommended baseline. Click Save to apply.',
      type: 'info'
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Trigger simulated drop alert
  const handleSimulateDrop = async (volume: number) => {
    try {
      setIsSimulatingDrop(true);
      const res = await fetch('/api/engine/collector/throughput-history/test-drop-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAlert(data.alert);
        setCurrentVolume(volume);
        setCurrentEps(Math.round(volume / 60));
        setFeedbackMsg({
          text: isZh 
            ? `已成功注入吞吐量突降測試事件 (${volume.toLocaleString()} 筆/分)！系統已即時觸發告警通道。` 
            : `Injected drop test event (${volume} logs/min)! Real-time alert triggered.`,
          type: 'success'
        });
        // Play audio chime if enabled
        if (tempSettings.channels.sound) {
          playAlertTone();
        }
      }
    } catch {
      setFeedbackMsg({ text: '模擬測試請求失敗', type: 'error' });
    } finally {
      setIsSimulatingDrop(false);
    }
  };

  // Restore normal baseline
  const handleRestoreNormal = async () => {
    try {
      setIsSimulatingDrop(true);
      await fetch('/api/engine/collector/throughput-history/burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: 'spike', volume: 28000 })
      });
      await fetch('/api/engine/collector/throughput-history/acknowledge-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: activeAlert?.id })
      });
      setActiveAlert(null);
      setCurrentVolume(28000);
      setCurrentEps(466);
      setFeedbackMsg({
        text: isZh ? '已恢復常態基準進線流速，並解除即時突降告警狀態。' : 'Restored normal throughput baseline.',
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch {
      setFeedbackMsg({ text: '恢復操作失敗', type: 'error' });
    } finally {
      setIsSimulatingDrop(false);
    }
  };

  // Acknowledge active alert
  const handleAcknowledgeAlert = async () => {
    if (!activeAlert) return;
    try {
      await fetch('/api/engine/collector/throughput-history/acknowledge-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: activeAlert.id })
      });
      setActiveAlert(null);
      setFeedbackMsg({
        text: isZh ? '已確認並解除目前進線突降告警。' : 'Alert acknowledged and cleared.',
        type: 'info'
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setActiveAlert(null);
    }
  };

  // Web Audio chime helper
  const playAlertTone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext may be restricted by autoplay policy
    }
  };

  const isCurrentVolumeBelowWarning = currentVolume <= tempSettings.dropWarningThreshold;
  const isCurrentVolumeBelowCritical = currentVolume <= tempSettings.dropCriticalThreshold;

  return (
    <div className={cn("space-y-5", standalone ? "p-6 bg-[#0c0c0e] rounded-3xl border border-gray-800 shadow-2xl" : "")}>
      {/* Real-time Alert Active Banner */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl backdrop-blur-md relative overflow-hidden",
              activeAlert.severity === 'critical'
                ? "bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-rose-950/40"
                : "bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-amber-950/40"
            )}
          >
            <div className="flex items-start gap-3.5">
              <div className={cn(
                "p-2.5 rounded-xl border mt-0.5",
                activeAlert.severity === 'critical'
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              )}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm tracking-wide">
                    {activeAlert.title}
                  </span>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border",
                    activeAlert.severity === 'critical'
                      ? "bg-rose-500/30 text-rose-300 border-rose-500/50"
                      : "bg-amber-500/30 text-amber-300 border-amber-500/50"
                  )}>
                    {activeAlert.severity.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    {activeAlert.timeLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
                  {activeAlert.impact}
                </p>
                <div className="text-[11px] text-gray-400 flex items-center gap-2 pt-0.5">
                  <span className="text-gray-300 font-mono">
                    當前流速: <strong className="text-white">{activeAlert.volume.toLocaleString()} 筆/分</strong>
                  </span>
                  <span>•</span>
                  <span>門檻: <strong className="text-amber-300">{activeAlert.threshold.toLocaleString()} 筆/分</strong></span>
                  {activeAlert.dropPercentage && (
                    <>
                      <span>•</span>
                      <span className="text-rose-400 font-bold">突降 -{activeAlert.dropPercentage}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={handleAcknowledgeAlert}
                className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition flex items-center gap-1.5 border border-gray-700"
              >
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>{isZh ? '確認並清除告警' : 'Acknowledge'}</span>
              </button>
              <button
                onClick={handleRestoreNormal}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Zap size={13} />
                <span>{isZh ? '恢復正常流速' : 'Restore Baseline'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Panel Header Card */}
      <div className="bg-[#111114] border border-gray-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-md">
              <TrendingDown size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {isZh ? '日誌進線量閾值與突降即時告警配置面板' : 'Ingestion Volume Drop Thresholds & Real-time Alerting Configuration'}
                </h3>
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-mono rounded-full font-bold border",
                  tempSettings.enabled
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-gray-800 text-gray-400 border-gray-700"
                )}>
                  {tempSettings.enabled ? (isZh ? '● 突降守護監控中' : '● Watchdog Active') : (isZh ? '○ 已停用' : '○ Disabled')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh
                  ? '設定全網採集管線之進線吞吐量低限與偏差百分比門檻。當進線流速異常驟降或中斷時，即時觸發螢幕廣播、Webhooks 與告警通知。'
                  : 'Configure minimum throughput floors and sudden drop rate thresholds to trigger immediate alerts upon unexpected flow drops.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master Toggle */}
            <button
              onClick={() => setTempSettings({ ...tempSettings, enabled: !tempSettings.enabled })}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border",
                tempSettings.enabled
                  ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", tempSettings.enabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500")} />
              <span>{tempSettings.enabled ? (isZh ? '監控已啟用' : 'Enabled') : (isZh ? '監控已停用' : 'Disabled')}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Live Ingestion Real-time Status Gauge Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#09090b] p-3.5 rounded-xl border border-gray-800/80 text-xs">
          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase">{isZh ? '即時進線吞吐 (Volume)' : 'Current Ingest Rate'}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={cn(
                "text-lg font-black font-mono",
                isCurrentVolumeBelowCritical 
                  ? "text-rose-400" 
                  : (isCurrentVolumeBelowWarning ? "text-amber-400" : "text-emerald-400")
              )}>
                {currentVolume.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">筆/分</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
              約 {currentEps} EPS
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase">{isZh ? '突降預警水位 (Warning Line)' : 'Warning Threshold'}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-amber-400">
                {tempSettings.dropWarningThreshold.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">筆/分</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
              {Math.round(tempSettings.dropWarningThreshold / 60)} EPS
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase">{isZh ? '中斷危急門檻 (Critical Floor)' : 'Critical Outage Floor'}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-rose-400">
                {tempSettings.dropCriticalThreshold.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">筆/分</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
              {Math.round(tempSettings.dropCriticalThreshold / 60)} EPS
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase">{isZh ? '移動均線突降偏差 (Drop %)' : 'Max Drop Deviation'}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-purple-400">
                -{tempSettings.dropPercentageThreshold}%
              </span>
              <span className="text-[10px] text-gray-400 font-mono">偏離</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
              連續 {tempSettings.consecutiveMinutes} 分鐘觸發
            </span>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2 text-xs">
          {[
            { id: 'thresholds', label: isZh ? '🎯 進線量門檻調校' : 'Threshold Settings', icon: Sliders },
            { id: 'notifications', label: isZh ? '🔔 告警聯動管道' : 'Alert Channels', icon: Bell },
            { id: 'simulation', label: isZh ? '🧪 突降演練與測試' : 'Simulation & Testing', icon: Zap },
            { id: 'history', label: isZh ? '📋 歷史突降事件記錄' : 'Incident Logs', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                )}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Ingestion Volume Drop Thresholds Configuration */}
        {activeSubTab === 'thresholds' && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Warning Drop Floor */}
              <div className="bg-[#09090b] border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400" />
                    {isZh ? '吞吐量突降預警門檻 (Drop Warning Threshold)' : 'Drop Warning Floor'}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {tempSettings.dropWarningThreshold.toLocaleString()} 筆/分
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isZh
                    ? '當全網日誌進線量連續低於此數值時，觸發黃色預警提示，提醒檢查是否有邊界交換機或局部工作站停止發送日誌。'
                    : 'Triggers elevated warning when ingestion falls below this rate, suggesting partial source disconnection.'}
                </p>
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="3000"
                    max="35000"
                    step="1000"
                    value={tempSettings.dropWarningThreshold}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTempSettings({
                        ...tempSettings,
                        dropWarningThreshold: val,
                        dropCriticalThreshold: Math.min(tempSettings.dropCriticalThreshold, val - 1000)
                      });
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>3,000 (50 EPS)</span>
                    <span>15,000 (250 EPS) [建議]</span>
                    <span>35,000 (583 EPS)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-gray-800/80">
                  <span className="text-[11px] text-gray-400">{isZh ? '自訂精確數值:' : 'Precise value:'}</span>
                  <input
                    type="number"
                    step="500"
                    value={tempSettings.dropWarningThreshold}
                    onChange={(e) => setTempSettings({ ...tempSettings, dropWarningThreshold: Number(e.target.value) })}
                    className="w-28 px-2 py-1 bg-[#111114] border border-gray-700 focus:border-amber-400 rounded-lg text-xs font-mono text-white outline-none"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">筆/分 ({Math.round(tempSettings.dropWarningThreshold / 60)} EPS)</span>
                </div>
              </div>

              {/* Critical Outage Drop Floor */}
              <div className="bg-[#09090b] border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-rose-400" />
                    {isZh ? '嚴重斷流低限門檻 (Critical Outage Floor)' : 'Critical Outage Floor'}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {tempSettings.dropCriticalThreshold.toLocaleString()} 筆/分
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isZh
                    ? '進線量暴跌至此水位視為重大管線故障或核心路由中斷。系統將立即發出紅色警報並啟動高優先度資安事件應變。'
                    : 'Considered a major ingestion outage. Triggers critical alarm for immediate pipeline recovery.'}
                </p>
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="500"
                    max="20000"
                    step="500"
                    value={tempSettings.dropCriticalThreshold}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTempSettings({
                        ...tempSettings,
                        dropCriticalThreshold: val,
                        dropWarningThreshold: Math.max(tempSettings.dropWarningThreshold, val + 1000)
                      });
                    }}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>500 (~8 EPS)</span>
                    <span>5,000 (~83 EPS) [建議]</span>
                    <span>20,000 (~333 EPS)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-gray-800/80">
                  <span className="text-[11px] text-gray-400">{isZh ? '自訂精確數值:' : 'Precise value:'}</span>
                  <input
                    type="number"
                    step="500"
                    value={tempSettings.dropCriticalThreshold}
                    onChange={(e) => setTempSettings({ ...tempSettings, dropCriticalThreshold: Number(e.target.value) })}
                    className="w-28 px-2 py-1 bg-[#111114] border border-gray-700 focus:border-rose-400 rounded-lg text-xs font-mono text-white outline-none"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">筆/分 ({Math.round(tempSettings.dropCriticalThreshold / 60)} EPS)</span>
                </div>
              </div>
            </div>

            {/* Relative Deviation and Duration Window */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Relative Percentage Drop */}
              <div className="bg-[#09090b] border border-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <TrendingDown size={14} className="text-purple-400" />
                    {isZh ? '相較 5 分鐘均線突降百分比 (Drop Rate %)' : 'Drop Rate % from Moving Average'}
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    -{tempSettings.dropPercentageThreshold}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isZh
                    ? '運用滑動窗口演算法動態比對。若短時間內進線量驟減超過此百分比，即使總量尚未低於絕對低限亦發出突降預警。'
                    : 'Triggers alert if ingestion drops abruptly by this percentage against recent 5-minute moving average.'}
                </p>
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="20"
                    max="85"
                    step="5"
                    value={tempSettings.dropPercentageThreshold}
                    onChange={(e) => setTempSettings({ ...tempSettings, dropPercentageThreshold: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>20% (高度敏感)</span>
                    <span>45% (建議平衡)</span>
                    <span>85% (寬鬆防抖)</span>
                  </div>
                </div>
              </div>

              {/* Consecutive Duration Window */}
              <div className="bg-[#09090b] border border-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-400" />
                    {isZh ? '持續時間容忍窗口 (Consecutive Minutes)' : 'Sustained Duration Window'}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {tempSettings.consecutiveMinutes} {isZh ? '分鐘' : 'Mins'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isZh
                    ? '需連續維持低於門檻之分鐘數。設為 2 分鐘可有效排除上游網路暫態微斷線或緩衝區批次刷新產生之短暫假陽性。'
                    : 'Number of consecutive minutes below threshold before dispatching alerts to prevent transient false alarms.'}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 5].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setTempSettings({ ...tempSettings, consecutiveMinutes: mins })}
                      className={cn(
                        "flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition",
                        tempSettings.consecutiveMinutes === mins
                          ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/25"
                          : "bg-[#111114] text-gray-400 border-gray-700 hover:text-white"
                      )}
                    >
                      {mins} {isZh ? '分鐘' : 'min'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Notification & Dispatch Channels */}
        {activeSubTab === 'notifications' && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* In-App Floating Alert */}
              <div 
                onClick={() => setTempSettings({
                  ...tempSettings,
                  channels: { ...tempSettings.channels, inApp: !tempSettings.channels.inApp }
                })}
                className={cn(
                  "p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between",
                  tempSettings.channels.inApp
                    ? "bg-indigo-950/30 border-indigo-500/40 text-white"
                    : "bg-[#09090b] border-gray-800 text-gray-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Bell size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{isZh ? '系統頂部動態懸浮橫幅' : 'In-App Top Alert Banner'}</span>
                    <span className="text-[10px] text-gray-400">{isZh ? '診斷儀表板頂部持續閃爍警戒' : 'Persistent banner on dashboard'}</span>
                  </div>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center text-[10px]",
                  tempSettings.channels.inApp ? "bg-indigo-600 border-indigo-400 text-white" : "border-gray-600"
                )}>
                  {tempSettings.channels.inApp && '✓'}
                </div>
              </div>

              {/* Sound Alert */}
              <div 
                onClick={() => setTempSettings({
                  ...tempSettings,
                  channels: { ...tempSettings.channels, sound: !tempSettings.channels.sound }
                })}
                className={cn(
                  "p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between",
                  tempSettings.channels.sound
                    ? "bg-purple-950/30 border-purple-500/40 text-white"
                    : "bg-[#09090b] border-gray-800 text-gray-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {tempSettings.channels.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{isZh ? '即時音效警示音 (Audio Ping)' : 'Web Audio Alert Chime'}</span>
                    <span className="text-[10px] text-gray-400">{isZh ? '突降時觸發音頻警示' : 'Play audio chime on drop'}</span>
                  </div>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center text-[10px]",
                  tempSettings.channels.sound ? "bg-purple-600 border-purple-400 text-white" : "border-gray-600"
                )}>
                  {tempSettings.channels.sound && '✓'}
                </div>
              </div>

              {/* Email Notification */}
              <div 
                onClick={() => setTempSettings({
                  ...tempSettings,
                  channels: { ...tempSettings.channels, email: !tempSettings.channels.email }
                })}
                className={cn(
                  "p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between",
                  tempSettings.channels.email
                    ? "bg-emerald-950/30 border-emerald-500/40 text-white"
                    : "bg-[#09090b] border-gray-800 text-gray-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Mail size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{isZh ? 'SOC 維運群組電子郵件' : 'Email Alerts'}</span>
                    <span className="text-[10px] text-gray-400">{isZh ? '派送至值班資安工程師' : 'Dispatch to on-call engineers'}</span>
                  </div>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center text-[10px]",
                  tempSettings.channels.email ? "bg-emerald-600 border-emerald-400 text-white" : "border-gray-600"
                )}>
                  {tempSettings.channels.email && '✓'}
                </div>
              </div>

              {/* Webhook Alert */}
              <div 
                onClick={() => setTempSettings({
                  ...tempSettings,
                  channels: { ...tempSettings.channels, webhook: !tempSettings.channels.webhook }
                })}
                className={cn(
                  "p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between",
                  tempSettings.channels.webhook
                    ? "bg-amber-950/30 border-amber-500/40 text-white"
                    : "bg-[#09090b] border-gray-800 text-gray-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Send size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{isZh ? '外部 Webhook (Slack / Teams)' : 'Webhook Notification'}</span>
                    <span className="text-[10px] text-gray-400">{isZh ? '即時推送 JSON Payload 至事件頻道' : 'Push JSON to Slack / PagerDuty'}</span>
                  </div>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center text-[10px]",
                  tempSettings.channels.webhook ? "bg-amber-600 border-amber-400 text-white" : "border-gray-600"
                )}>
                  {tempSettings.channels.webhook && '✓'}
                </div>
              </div>
            </div>

            {/* Channel Detailed Settings */}
            <div className="bg-[#09090b] border border-gray-800 rounded-2xl p-4 space-y-3 text-xs">
              <div>
                <label className="text-gray-400 font-bold block mb-1">
                  {isZh ? '電子郵件收件人清單 (以逗號分隔):' : 'Email Recipients:'}
                </label>
                <input
                  type="text"
                  value={tempSettings.emailRecipients}
                  onChange={(e) => setTempSettings({ ...tempSettings, emailRecipients: e.target.value })}
                  placeholder="admin@corp.internal, soc-oncall@corp.internal"
                  className="w-full bg-[#111114] border border-gray-700 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold block mb-1">
                  {isZh ? 'Webhook 端點 URL (Slack Incoming Webhook 或 PagerDuty):' : 'Webhook URL:'}
                </label>
                <input
                  type="text"
                  value={tempSettings.webhookUrl}
                  onChange={(e) => setTempSettings({ ...tempSettings, webhookUrl: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-[#111114] border border-gray-700 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs font-mono text-white outline-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoProbe"
                    checked={tempSettings.autoProbeOnDrop}
                    onChange={(e) => setTempSettings({ ...tempSettings, autoProbeOnDrop: e.target.checked })}
                    className="accent-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="autoProbe" className="text-gray-300 font-medium cursor-pointer text-xs">
                    {isZh ? '突降時自動啟動上游日誌來源連線探測 (Auto-Probe Source Connectivity)' : 'Auto-probe sources on drop'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Simulation & Real-time Alert Testing */}
        {activeSubTab === 'simulation' && (
          <div className="space-y-4 pt-1">
            <div className="bg-[#09090b] border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap size={15} className="text-amber-400" />
                  {isZh ? '即時吞吐量突降演練與告警響應測試器' : 'Drop Alert Drill & Testing'}
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {isZh ? '驗證 In-App 懸浮條、音頻警報與 Webhook 連動' : 'Verify notifications'}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isZh
                  ? '點擊下方測試按鈕，將在收集器核心注入突發斷流模擬事件。此測試能立即驗證您設定的低限門檻是否能正常觸發即時告警通知。'
                  : 'Inject a synthetic drop event to verify real-time alert dispatch and notification triggers.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => handleSimulateDrop(1200)}
                  disabled={isSimulatingDrop}
                  className="p-3 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <ShieldAlert size={14} className="text-rose-400" />
                    <span>{isZh ? '模擬嚴重斷流 (1,200 筆/分)' : 'Simulate Outage (1.2k/m)'}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 text-left">
                    {isZh ? '低於 5,000 門檻，觸發紅色危急告警' : 'Below 5k critical floor'}
                  </span>
                </button>

                <button
                  onClick={() => handleSimulateDrop(11500)}
                  disabled={isSimulatingDrop}
                  className="p-3 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span>{isZh ? '模擬異常偏低 (11,500 筆/分)' : 'Simulate Low (11.5k/m)'}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 text-left">
                    {isZh ? '低於 15,000 門檻，觸發黃色預警' : 'Below 15k warning floor'}
                  </span>
                </button>

                <button
                  onClick={handleRestoreNormal}
                  disabled={isSimulatingDrop}
                  className="p-3 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Zap size={14} className="text-emerald-400" />
                    <span>{isZh ? '恢復正常 (28,000 筆/分)' : 'Restore Baseline (28k/m)'}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 text-left">
                    {isZh ? '解除突降狀態，恢復常態進線' : 'Clear drop alert status'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Drop Incident History */}
        {activeSubTab === 'history' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-300">
                {isZh ? '最近突降告警事件日誌 (Recent Drop Alerts)' : 'Recent Drop Incidents'}
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {isZh ? `共 ${recentAlerts.length} 筆記錄` : `${recentAlerts.length} events`}
              </span>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#09090b] border border-gray-800 text-center text-xs text-gray-500">
                <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2 opacity-60" />
                <p>{isZh ? '過去 60 分鐘內未檢測到異常進線量突降事件，採集器運行平穩。' : 'No throughput drop incidents recorded.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl bg-[#09090b] border border-gray-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle size={13} className={alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'} />
                        {alert.title}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{alert.timeLabel}</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      {alert.impact}
                    </p>
                    <div className="text-[10px] font-mono text-gray-500 flex justify-between pt-1 border-t border-gray-800/80">
                      <span>流速: <strong className="text-rose-400">{alert.volume.toLocaleString()} 筆/分</strong></span>
                      <span>告警門檻: <strong className="text-amber-400">{alert.threshold.toLocaleString()} 筆/分</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons & Feedback Bar */}
        <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {feedbackMsg && (
              <span className={cn(
                "text-xs font-medium flex items-center gap-1.5",
                feedbackMsg.type === 'success' ? "text-emerald-400" : (feedbackMsg.type === 'error' ? "text-rose-400" : "text-sky-400")
              )}>
                {feedbackMsg.type === 'success' ? <CheckCircle2 size={13} /> : <Info size={13} />}
                {feedbackMsg.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>{isZh ? '恢復推薦預設值' : 'Reset Defaults'}</span>
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{isZh ? '儲存並套用門檻' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IngestionDropThresholdConfigPanel;

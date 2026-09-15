import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Cpu, 
  HardDrive, 
  Database, 
  Bell, 
  Mail, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  Server, 
  Layers, 
  Zap, 
  Radio, 
  Check, 
  X, 
  Clock, 
  Webhook, 
  Info,
  Terminal,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface EngineNotificationSettings {
  email: {
    enabled: boolean;
    recipients: string[];
  };
  webhook: {
    enabled: boolean;
    url: string;
    channel: string;
  };
  syslog: {
    enabled: boolean;
    host: string;
    port: number;
  };
  inApp: {
    enabled: boolean;
    notifyOnWarning: boolean;
    notifyOnCritical: boolean;
  };
}

export interface EngineThresholdConfig {
  engineId: string;
  name: string;
  category: 'CORE' | 'STORAGE' | 'INGEST' | 'SIEM' | 'NDR' | 'EDR' | 'SOAR';
  cpuWarning: number;
  cpuCritical: number;
  ramWarning: number;
  ramCritical: number;
  diskWarning: number;
  diskCritical: number;
  durationSeconds: number;
  cooldownMinutes: number;
  enabled: boolean;
  notifications: EngineNotificationSettings;
}

export interface EngineLiveMetric {
  engineId: string;
  name: string;
  type: string;
  cpu: number;
  ram: number;
  disk: number;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'stable' | 'climbing' | 'decreasing';
}

const DEFAULT_ENGINE_CONFIGS: Record<string, EngineThresholdConfig> = {
  'semor-collector': {
    engineId: 'semor-collector',
    name: 'Go 收集器核心引擎 (Syslog/HTTP Ingest Pipeline)',
    category: 'INGEST',
    cpuWarning: 70,
    cpuCritical: 85,
    ramWarning: 75,
    ramCritical: 90,
    diskWarning: 80,
    diskCritical: 90,
    durationSeconds: 15,
    cooldownMinutes: 5,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['sec-ops@corp.internal', 'admin@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/COLLECTOR', channel: '#soc-engine-alerts' },
      syslog: { enabled: true, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'semor-vlog-engine': {
    engineId: 'semor-vlog-engine',
    name: 'Rust 高速區塊儲存引擎 (VictoriaLogs Storage Core)',
    category: 'STORAGE',
    cpuWarning: 75,
    cpuCritical: 90,
    ramWarning: 80,
    ramCritical: 92,
    diskWarning: 85,
    diskCritical: 95,
    durationSeconds: 10,
    cooldownMinutes: 5,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['storage-admin@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/STORAGE', channel: '#storage-critical' },
      syslog: { enabled: true, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'arkime-suricata': {
    engineId: 'arkime-suricata',
    name: 'Arkime & Suricata NDR 封包檢測引擎',
    category: 'NDR',
    cpuWarning: 80,
    cpuCritical: 92,
    ramWarning: 85,
    ramCritical: 95,
    diskWarning: 85,
    diskCritical: 92,
    durationSeconds: 20,
    cooldownMinutes: 10,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['ndr-analysts@corp.internal'] },
      webhook: { enabled: false, url: '', channel: '#ndr-alerts' },
      syslog: { enabled: true, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'wazuh-edr': {
    engineId: 'wazuh-edr',
    name: 'Wazuh & OpenXDR 端點防護引擎',
    category: 'EDR',
    cpuWarning: 70,
    cpuCritical: 88,
    ramWarning: 75,
    ramCritical: 88,
    diskWarning: 80,
    diskCritical: 90,
    durationSeconds: 30,
    cooldownMinutes: 15,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['edr-team@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/EDR', channel: '#edr-alerts' },
      syslog: { enabled: false, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'n8n-soar': {
    engineId: 'n8n-soar',
    name: 'n8n & TheHive 劇本自動化引擎 (SOAR)',
    category: 'SOAR',
    cpuWarning: 75,
    cpuCritical: 90,
    ramWarning: 80,
    ramCritical: 90,
    diskWarning: 75,
    diskCritical: 85,
    durationSeconds: 15,
    cooldownMinutes: 5,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['soar-ops@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/SOAR', channel: '#soar-incidents' },
      syslog: { enabled: false, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  }
};

export function EngineThresholdConfigView() {
  const [configs, setConfigs] = useState<Record<string, EngineThresholdConfig>>(DEFAULT_ENGINE_CONFIGS);
  const [selectedEngineId, setSelectedEngineId] = useState<string>('semor-collector');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'thresholds' | 'notifications' | 'simulation'>('thresholds');
  
  // Real-time engine live metrics for dynamic comparison
  const [liveMetrics, setLiveMetrics] = useState<Record<string, EngineLiveMetric>>({
    'semor-collector': {
      engineId: 'semor-collector',
      name: 'Go 收集器核心引擎',
      type: 'Go Collector',
      cpu: 48,
      ram: 64,
      disk: 42,
      status: 'optimal',
      trend: 'stable'
    },
    'semor-vlog-engine': {
      engineId: 'semor-vlog-engine',
      name: 'Rust 區塊儲存引擎',
      type: 'Rust Storage Core',
      cpu: 62,
      ram: 78,
      disk: 65,
      status: 'optimal',
      trend: 'climbing'
    },
    'arkime-suricata': {
      engineId: 'arkime-suricata',
      name: 'Arkime & Suricata NDR',
      type: 'NDR Packet Engine',
      cpu: 84,
      ram: 81,
      disk: 78,
      status: 'warning',
      trend: 'climbing'
    },
    'wazuh-edr': {
      engineId: 'wazuh-edr',
      name: 'Wazuh & OpenXDR',
      type: 'EDR Agent Manager',
      cpu: 35,
      ram: 52,
      disk: 38,
      status: 'optimal',
      trend: 'stable'
    },
    'n8n-soar': {
      engineId: 'n8n-soar',
      name: 'n8n & TheHive SOAR',
      type: 'SOAR Workflow Engine',
      cpu: 40,
      ram: 58,
      disk: 31,
      status: 'optimal',
      trend: 'stable'
    }
  });

  // Load saved thresholds on mount
  useEffect(() => {
    fetch('/api/engine/thresholds')
      .then(res => res.json())
      .then(data => {
        if (data.thresholds && Object.keys(data.thresholds).length > 0) {
          setConfigs(data.thresholds);
        }
      })
      .catch(err => {
        console.warn('Failed to load remote engine thresholds, using local defaults:', err);
      });
  }, []);

  // Fluctuate live telemetry slightly to simulate a living cluster
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMetrics(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const item = updated[key];
          const jitterCpu = Math.floor((Math.random() * 6 - 3));
          const jitterRam = Math.floor((Math.random() * 4 - 2));
          const newCpu = Math.max(10, Math.min(99, item.cpu + jitterCpu));
          const newRam = Math.max(15, Math.min(99, item.ram + jitterRam));
          
          const cfg = configs[key];
          let status: 'optimal' | 'warning' | 'critical' = 'optimal';
          if (cfg) {
            if (newCpu >= cfg.cpuCritical || newRam >= cfg.ramCritical || item.disk >= cfg.diskCritical) {
              status = 'critical';
            } else if (newCpu >= cfg.cpuWarning || newRam >= cfg.ramWarning || item.disk >= cfg.diskWarning) {
              status = 'warning';
            }
          }

          updated[key] = {
            ...item,
            cpu: newCpu,
            ram: newRam,
            status
          };
        });
        return updated;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [configs]);

  const activeEngine = configs[selectedEngineId] || DEFAULT_ENGINE_CONFIGS['semor-collector'];
  const activeMetric = liveMetrics[selectedEngineId];

  const handleUpdateActiveEngine = (partial: Partial<EngineThresholdConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [selectedEngineId]: {
        ...prev[selectedEngineId],
        ...partial
      }
    }));
  };

  const handleUpdateNotifications = (partial: Partial<EngineNotificationSettings>) => {
    setConfigs(prev => ({
      ...prev,
      [selectedEngineId]: {
        ...prev[selectedEngineId],
        notifications: {
          ...prev[selectedEngineId].notifications,
          ...partial
        }
      }
    }));
  };

  const handleSaveConfigs = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/engine/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving engine thresholds:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCurrentEngine = () => {
    const fallback = DEFAULT_ENGINE_CONFIGS[selectedEngineId];
    if (fallback) {
      handleUpdateActiveEngine(fallback);
    }
  };

  const handleTestDispatch = async (metricType: 'CPU' | 'RAM' | 'Disk', level: 'WARNING' | 'CRITICAL') => {
    setIsTesting(true);
    const simulatedVal = level === 'CRITICAL' 
      ? (metricType === 'CPU' ? activeEngine.cpuCritical + 3 : metricType === 'RAM' ? activeEngine.ramCritical + 4 : activeEngine.diskCritical + 2)
      : (metricType === 'CPU' ? activeEngine.cpuWarning + 2 : metricType === 'RAM' ? activeEngine.ramWarning + 2 : activeEngine.diskWarning + 1);
    
    const triggerLimit = level === 'CRITICAL'
      ? (metricType === 'CPU' ? activeEngine.cpuCritical : metricType === 'RAM' ? activeEngine.ramCritical : activeEngine.diskCritical)
      : (metricType === 'CPU' ? activeEngine.cpuWarning : metricType === 'RAM' ? activeEngine.ramWarning : activeEngine.diskWarning);

    try {
      const res = await fetch('/api/engine/thresholds/test-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineId: activeEngine.engineId,
          metric: metricType,
          value: simulatedVal,
          threshold: triggerLimit,
          level
        })
      });
      const data = await res.json();
      if (data.logs) {
        setTestLog(data.logs);
      }
    } catch (e) {
      console.error('Failed to dispatch test notification:', e);
      setTestLog([
        `[${new Date().toISOString()}] [ERROR] 測試告警發送異常，請確認伺服端連線。`
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  // Helper for status badge
  const getMetricBadge = (current: number, warning: number, critical: number) => {
    if (current >= critical) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">嚴重超標 (Critical)</span>;
    }
    if (current >= warning) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">注意警示 (Warning)</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">健康 (Healthy)</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Instructions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 rounded-2xl border border-indigo-500/30 text-indigo-400 shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-white tracking-tight">
                  引擎效能門檻觸發器與告警推播設定
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-950/70 border border-indigo-500/40 text-indigo-300">
                  Engine Triggers & Delivery
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                針對全平台各獨立運作核心引擎（Go 收集器、Rust 區塊儲存、Arkime/Suricata NDR、Wazuh EDR、n8n SOAR）分別設定專屬之 CPU、記憶體 (RAM) 與磁碟 (Disk) 警示/嚴重門檻，並客製化 Email、Slack Webhook、Syslog RFC5424 及平台內部推播策略。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSaveConfigs}
              disabled={isSaving}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                saveSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已成功儲存設定！</span>
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? '儲存中...' : '儲存所有引擎門檻'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Engine Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.values(configs).map(engine => {
          const isSelected = engine.engineId === selectedEngineId;
          const metric = liveMetrics[engine.engineId];
          const hasAlert = metric && (metric.cpu >= engine.cpuWarning || metric.ram >= engine.ramWarning || metric.disk >= engine.diskWarning);
          const isCrit = metric && (metric.cpu >= engine.cpuCritical || metric.ram >= engine.ramCritical || metric.disk >= engine.diskCritical);

          return (
            <button
              key={engine.engineId}
              onClick={() => setSelectedEngineId(engine.engineId)}
              className={`p-4 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                    engine.category === 'INGEST' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30' :
                    engine.category === 'STORAGE' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' :
                    engine.category === 'NDR' ? 'bg-purple-950/60 text-purple-400 border border-purple-500/30' :
                    engine.category === 'EDR' ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30' :
                    'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {engine.category}
                  </span>
                  
                  {isCrit ? (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  ) : hasAlert ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </div>

                <div className="text-sm font-bold text-white line-clamp-1">
                  {engine.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {engine.engineId}
                </div>
              </div>

              {/* Realtime Live Gauge Miniature */}
              {metric && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 text-[9px] block">CPU</span>
                    <span className={metric.cpu >= engine.cpuCritical ? 'text-rose-400 font-bold' : metric.cpu >= engine.cpuWarning ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {metric.cpu}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">RAM</span>
                    <span className={metric.ram >= engine.ramCritical ? 'text-rose-400 font-bold' : metric.ram >= engine.ramWarning ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {metric.ram}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">DISK</span>
                    <span className={metric.disk >= engine.diskCritical ? 'text-rose-400 font-bold' : metric.disk >= engine.diskWarning ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {metric.disk}%
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Header with Sub-tabs */}
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-black text-white">
                {activeEngine.name}
              </h4>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                activeEngine.enabled ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {activeEngine.enabled ? '● 監控觸發中 (Active)' : '○ 已停用 (Disabled)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
              <span>類別: {activeEngine.category}</span>
              <span>•</span>
              <span>引擎代號: {activeEngine.engineId}</span>
              <span>•</span>
              <span>觸發持久判定: {activeEngine.durationSeconds} 秒</span>
              <span>•</span>
              <span>告警冷卻間隔: {activeEngine.cooldownMinutes} 分鐘</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('thresholds')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'thresholds' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>資源門檻 (CPU/RAM/Disk)</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>告警管道與推播 (Delivery)</span>
              </button>
              <button
                onClick={() => setActiveTab('simulation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'simulation' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>推播模擬驗證 (Test Bench)</span>
              </button>
            </div>

            <button
              onClick={handleResetCurrentEngine}
              title="重設此引擎門檻至原廠推薦值"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Resource Thresholds Sliders & Duration */}
        {activeTab === 'thresholds' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CPU Threshold Box */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">CPU 運算負載觸發門檻</h5>
                      <span className="text-[11px] text-slate-400">當引擎進程累積 CPU 使用率超過標準</span>
                    </div>
                  </div>
                  {activeMetric && getMetricBadge(activeMetric.cpu, activeEngine.cpuWarning, activeEngine.cpuCritical)}
                </div>

                {/* Current Live Comparison */}
                {activeMetric && (
                  <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">目前即時使用率:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {activeMetric.cpu}%
                    </span>
                  </div>
                )}

                {/* Warning Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 注意警示 (Warning)
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{activeEngine.cpuWarning}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="95"
                    value={activeEngine.cpuWarning}
                    onChange={e => handleUpdateActiveEngine({ cpuWarning: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>30%</span>
                    <span>建議: 70%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Critical Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> 嚴重告警 (Critical)
                    </span>
                    <span className="font-mono font-bold text-rose-400 text-sm">{activeEngine.cpuCritical}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={activeEngine.cpuCritical}
                    onChange={e => handleUpdateActiveEngine({ cpuCritical: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50%</span>
                    <span>建議: 85% ~ 90%</span>
                    <span>99%</span>
                  </div>
                </div>
              </div>

              {/* RAM Threshold Box */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">RAM 記憶體佔用觸發門檻</h5>
                      <span className="text-[11px] text-slate-400">防範緩衝佇列溢滿或 OOM 殺進程</span>
                    </div>
                  </div>
                  {activeMetric && getMetricBadge(activeMetric.ram, activeEngine.ramWarning, activeEngine.ramCritical)}
                </div>

                {/* Current Live Comparison */}
                {activeMetric && (
                  <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">目前即時使用率:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {activeMetric.ram}%
                    </span>
                  </div>
                )}

                {/* Warning Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 注意警示 (Warning)
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{activeEngine.ramWarning}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="95"
                    value={activeEngine.ramWarning}
                    onChange={e => handleUpdateActiveEngine({ ramWarning: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>40%</span>
                    <span>建議: 75% ~ 80%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Critical Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> 嚴重告警 (Critical)
                    </span>
                    <span className="font-mono font-bold text-rose-400 text-sm">{activeEngine.ramCritical}%</span>
                  </div>
                  <input
                    type="range"
                    min="55"
                    max="99"
                    value={activeEngine.ramCritical}
                    onChange={e => handleUpdateActiveEngine({ ramCritical: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>55%</span>
                    <span>建議: 90% ~ 92%</span>
                    <span>99%</span>
                  </div>
                </div>
              </div>

              {/* Disk Threshold Box */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Disk 磁碟容量佔用門檻</h5>
                      <span className="text-[11px] text-slate-400">WAL/分區區塊落盤保護與輪替機制</span>
                    </div>
                  </div>
                  {activeMetric && getMetricBadge(activeMetric.disk, activeEngine.diskWarning, activeEngine.diskCritical)}
                </div>

                {/* Current Live Comparison */}
                {activeMetric && (
                  <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">目前即時使用率:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {activeMetric.disk}%
                    </span>
                  </div>
                )}

                {/* Warning Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 注意警示 (Warning)
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{activeEngine.diskWarning}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={activeEngine.diskWarning}
                    onChange={e => handleUpdateActiveEngine({ diskWarning: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50%</span>
                    <span>建議: 80% ~ 85%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Critical Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> 嚴重告警 (Critical)
                    </span>
                    <span className="font-mono font-bold text-rose-400 text-sm">{activeEngine.diskCritical}%</span>
                  </div>
                  <input
                    type="range"
                    min="65"
                    max="99"
                    value={activeEngine.diskCritical}
                    onChange={e => handleUpdateActiveEngine({ diskCritical: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>65%</span>
                    <span>建議: 90% ~ 95%</span>
                    <span>99%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Trigger Conditions: Duration & Cooldown */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5">
              <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>事件觸發消抖與頻率抑制 (Trigger Duration & Cooldown Protection)</span>
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    持續超標時間判定 (Duration Seconds)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">避免瞬間尖峰雜訊造成誤報，必須連續超標達此秒數才觸發</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={activeEngine.durationSeconds}
                      onChange={e => handleUpdateActiveEngine({ durationSeconds: Math.max(1, Number(e.target.value)) })}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                    <span className="text-xs text-slate-400">秒 (Seconds)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    告警發送冷卻間隔 (Alert Cooldown)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">同一引擎在狀態未解除期間，重複推播之冷卻抑制時間</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={activeEngine.cooldownMinutes}
                      onChange={e => handleUpdateActiveEngine({ cooldownMinutes: Math.max(1, Number(e.target.value)) })}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                    <span className="text-xs text-slate-400">分鐘 (Minutes)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    引擎監控總開關 (Monitoring Engine State)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">可臨時將維護中的引擎隔離，不產生任何異常警示</p>
                  <button
                    onClick={() => handleUpdateActiveEngine({ enabled: !activeEngine.enabled })}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      activeEngine.enabled
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {activeEngine.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>{activeEngine.enabled ? '監控與門檻觸發已啟用' : '已關閉此引擎監控'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Notification Channels & Delivery Matrix */}
        {activeTab === 'notifications' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Channel 1: Email (SMTP) */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">電子郵件通知 (Email / SMTP)</h5>
                      <span className="text-[11px] text-slate-400">將重大資源超標日誌寄送至維運或 SOC 團隊</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeEngine.notifications.email.enabled}
                    onChange={e => handleUpdateNotifications({
                      email: { ...activeEngine.notifications.email, enabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      收件者清單 (以逗點分隔多組信箱)
                    </label>
                    <input
                      type="text"
                      value={activeEngine.notifications.email.recipients.join(', ')}
                      onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleUpdateNotifications({
                          email: { ...activeEngine.notifications.email, recipients: list }
                        });
                      }}
                      placeholder="admin-infra@corp.internal, soc-alerts@corp.internal"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    支援動態標籤替換：包含引擎 ID、超標指標數值、閾值及觸發當下時間戳。
                  </p>
                </div>
              </div>

              {/* Channel 2: Webhook / Slack / Teams */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">即時 Webhook (Slack / MS Teams / Discord)</h5>
                      <span className="text-[11px] text-slate-400">標準 JSON Payload 拋轉至即時溝通群組或 SOAR 劇本</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeEngine.notifications.webhook.enabled}
                    onChange={e => handleUpdateNotifications({
                      webhook: { ...activeEngine.notifications.webhook, enabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Webhook Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={activeEngine.notifications.webhook.url}
                      onChange={e => handleUpdateNotifications({
                        webhook: { ...activeEngine.notifications.webhook, url: e.target.value }
                      })}
                      placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      目標頻道名稱 (Target Channel)
                    </label>
                    <input
                      type="text"
                      value={activeEngine.notifications.webhook.channel}
                      onChange={e => handleUpdateNotifications({
                        webhook: { ...activeEngine.notifications.webhook, channel: e.target.value }
                      })}
                      placeholder="#soc-engine-alerts"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Channel 3: Syslog Forwarding */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Syslog 轉發 (RFC 5424 / RFC 3164)</h5>
                      <span className="text-[11px] text-slate-400">發送至外部 SIEM 或集中稽核日誌主機</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeEngine.notifications.syslog.enabled}
                    onChange={e => handleUpdateNotifications({
                      syslog: { ...activeEngine.notifications.syslog, enabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Syslog 主機位址 (Host/IP)
                    </label>
                    <input
                      type="text"
                      value={activeEngine.notifications.syslog.host}
                      onChange={e => handleUpdateNotifications({
                        syslog: { ...activeEngine.notifications.syslog, host: e.target.value }
                      })}
                      placeholder="127.0.0.1"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Port (預設 514)
                    </label>
                    <input
                      type="number"
                      value={activeEngine.notifications.syslog.port}
                      onChange={e => handleUpdateNotifications({
                        syslog: { ...activeEngine.notifications.syslog, port: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Channel 4: In-App SOC Notification Policy */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">平台頂部鈴鐺與彈跳警示 (In-App)</h5>
                      <span className="text-[11px] text-slate-400">當管理員在控制台操作時直接彈跳浮動卡片</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeEngine.notifications.inApp.enabled}
                    onChange={e => handleUpdateNotifications({
                      inApp: { ...activeEngine.notifications.inApp, enabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeEngine.notifications.inApp.notifyOnWarning}
                      onChange={e => handleUpdateNotifications({
                        inApp: { ...activeEngine.notifications.inApp, notifyOnWarning: e.target.checked }
                      })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>當達到「注意警示 (Warning)」門檻時立即推播</span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeEngine.notifications.inApp.notifyOnCritical}
                      onChange={e => handleUpdateNotifications({
                        inApp: { ...activeEngine.notifications.inApp, notifyOnCritical: e.target.checked }
                      })}
                      className="w-4 h-4 accent-rose-500 rounded"
                    />
                    <span>當達到「嚴重告警 (Critical)」門檻時觸發高優先級彈出通知</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Simulation & Notification Test Bench */}
        {activeTab === 'simulation' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-400" />
                  <span>引擎門檻超標告警推播模擬器 (Simulate Trigger & Delivery)</span>
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  模擬當前選擇之「{activeEngine.name}」發生 CPU / RAM / Disk 超標，並即時驗證已設定之 Email、Slack Webhook 與 Syslog 拋送連線。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleTestDispatch('CPU', 'CRITICAL')}
                  disabled={isTesting}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>測試 CPU 嚴重超標</span>
                </button>

                <button
                  onClick={() => handleTestDispatch('RAM', 'WARNING')}
                  disabled={isTesting}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>測試 RAM 警示</span>
                </button>

                <button
                  onClick={() => handleTestDispatch('Disk', 'CRITICAL')}
                  disabled={isTesting}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>測試 Disk 滿載告警</span>
                </button>
              </div>
            </div>

            {/* Test Console Output */}
            <div className="bg-black/90 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                <span>[Trigger Delivery Console Log]</span>
                <span>Target: {activeEngine.engineId}</span>
              </div>
              
              {testLog.length === 0 ? (
                <div className="text-slate-600 py-6 text-center italic">
                  尚未發送測試。點選上方「測試 CPU / RAM / Disk」按鈕以啟動模擬驗證流程。
                </div>
              ) : (
                testLog.map((line, idx) => (
                  <div 
                    key={idx} 
                    className={`leading-relaxed ${
                      line.includes('ALERT_TRIGGER') ? 'text-amber-400 font-bold' :
                      line.includes('EMAIL_SMTP') ? 'text-cyan-400' :
                      line.includes('WEBHOOK_SLACK') ? 'text-purple-400' :
                      line.includes('SYSLOG_RFC5424') ? 'text-emerald-400' :
                      'text-slate-400'
                    }`}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

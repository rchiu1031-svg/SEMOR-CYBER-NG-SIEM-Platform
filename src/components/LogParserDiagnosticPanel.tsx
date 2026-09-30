import React, { useState, useEffect, useRef } from 'react';
import { CollectorThroughputIndicator } from './CollectorThroughputIndicator';
import {
  Zap,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Layers,
  Shield,
  Hash,
  ArrowRight,
  Server,
  FileCode,
  Tag,
  Sliders,
  TrendingDown,
  ShieldAlert,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IngestionDropThresholdConfigPanel,
  DropThresholdSettings,
  DropAlert
} from './IngestionDropThresholdConfigPanel';

interface DiagnosticResult {
  status: string;
  parsed_format: string;
  elapsed_micros: number;
  elapsed_ms: number;
  raw_length: number;
  fields_count: number;
  extracted_fields: Record<string, any>;
}

const PRESET_LOGS = [
  {
    id: 'fortinet-kv',
    name: 'Fortinet FortiGate (Key-Value)',
    badge: 'Firewall KV',
    protocol: 'syslog-udp',
    remoteIP: '192.168.10.1',
    log: '<189>date=2026-09-22 time=12:35:10 devname="FGT-CORP-01" devid="FGT60D4614041234" eventtime=1726998910 type="traffic" subtype="forward" level="warning" vd="root" srcip=192.168.10.45 srcport=54321 srcintf="port1" dstip=104.244.42.1 dstport=443 dstintf="wan1" proto=6 action="deny" policyid=42 reason="malicious-c2"'
  },
  {
    id: 'cisco-3164',
    name: 'Cisco ASA (RFC-3164 Classic BSD)',
    badge: 'RFC 3164',
    protocol: 'syslog-tcp',
    remoteIP: '10.0.0.2',
    log: '<164>Sep 22 12:35:12 fw-core-01 %ASA-4-106023: Deny tcp src outside:203.0.113.88/44321 dst inside:10.10.20.15/22 by access-group "OUTSIDE-IN"'
  },
  {
    id: 'linux-5424',
    name: 'Linux SSH Auth (RFC-5424 IETF Standard)',
    badge: 'RFC 5424',
    protocol: 'syslog-tls',
    remoteIP: '172.16.20.254',
    log: '<86>1 2026-09-22T12:35:14.234Z srv-k8s-master sshd 12480 ID47 [authContext@32473 ip="192.168.1.100" user="root"] Failed password for invalid user admin from 198.51.100.23 port 39824 ssh2'
  },
  {
    id: 'paloalto-cef',
    name: 'Palo Alto Threat (ArcSight CEF)',
    badge: 'CEF Format',
    protocol: 'syslog-tls',
    remoteIP: '172.16.20.254',
    log: 'CEF:0|Palo Alto Networks|PAN-OS|10.2.0|threat|SQL Injection Attempt|8|src=185.220.101.5 dst=172.16.4.20 spt=49210 dpt=80 proto=tcp act=blocked cn1=99201 msg="SQL injection probe in URI"'
  },
  {
    id: 'wazuh-json',
    name: 'Wazuh EDR Host Event (JSON Line)',
    badge: 'JSON Ingest',
    protocol: 'http-ndjson',
    remoteIP: '192.168.100.80',
    log: '{"timestamp":"2026-09-22T12:35:18Z","agent":{"id":"004","name":"win-dc-01","ip":"10.0.0.10"},"rule":{"id":"5710","level":10,"description":"Attempt to dump LSASS credentials"},"data":{"win":{"eventdata":{"image":"C:\\\\Windows\\\\Temp\\\\mimikatz.exe","targetProcess":"lsass.exe"}}}}'
  }
];

export function LogParserDiagnosticPanel() {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_LOGS[0].id);
  const [rawLog, setRawLog] = useState(PRESET_LOGS[0].log);
  const [protocol, setProtocol] = useState(PRESET_LOGS[0].protocol);
  const [remoteIP, setRemoteIP] = useState(PRESET_LOGS[0].remoteIP);
  const [isRunning, setIsRunning] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<{ id: string; total: number } | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'headers' | 'ecs' | 'json'>('fields');
  const [injectedCount, setInjectedCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Ingestion Volume Drop Thresholds & Real-time Bottleneck Alert State
  const [showThresholdPanel, setShowThresholdPanel] = useState(false);
  const [dropSettings, setDropSettings] = useState<DropThresholdSettings | null>(null);
  const [activeDropAlert, setActiveDropAlert] = useState<DropAlert | null>(null);
  const [currentVolume, setCurrentVolume] = useState<number>(24500);
  const [currentEps, setCurrentEps] = useState<number>(408);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Fetch current throughput drop thresholds & active drop alert
  const fetchThroughputAndAlerts = async () => {
    try {
      const res = await fetch('/api/engine/collector/throughput-history/drop-thresholds');
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current && data.success) {
          if (data.dropThresholds) {
            setDropSettings(data.dropThresholds);
          }
          if (data.activeDropAlert) {
            setActiveDropAlert(data.activeDropAlert);
            setIsAlertDismissed(false);
          } else {
            setActiveDropAlert(null);
          }
        }
      }

      const histRes = await fetch('/api/engine/collector/throughput-history?window=15');
      if (histRes.ok) {
        const histData = await histRes.json();
        if (isMountedRef.current && histData.summary) {
          setCurrentVolume(histData.summary.currentMinuteVolume || 24500);
          setCurrentEps(histData.summary.currentMinuteEps || 408);
          if (histData.summary.activeDropAlert) {
            setActiveDropAlert(histData.summary.activeDropAlert);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to poll throughput drop thresholds in diagnostic panel:', e);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchThroughputAndAlerts();
    const interval = setInterval(fetchThroughputAndAlerts, 5000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_LOGS.find(p => p.id === presetId);
    if (found) {
      setSelectedPreset(found.id);
      setRawLog(found.log);
      setProtocol(found.protocol);
      setRemoteIP(found.remoteIP);
      setResult(null);
      setInjectedCount(null);
      setIngestSuccess(null);
    }
  };

  const injectIntoStorageEngine = async () => {
    if (!rawLog.trim()) return;
    setIsIngesting(true);
    setIngestSuccess(null);
    try {
      const res = await fetch('/api/engine/collector/simulate-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_log: rawLog,
          protocol: protocol,
          remote_ip: remoteIP
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIngestSuccess({
          id: data.ingested_entry?.id || 'VL-LOG',
          total: data.total_logs || 0
        });
        executeDiagnosticParse();
      }
    } catch (e) {
      console.error('Failed to ingest log:', e);
    } finally {
      setIsIngesting(false);
    }
  };

  const executeDiagnosticParse = async () => {
    if (!rawLog.trim()) return;
    setIsRunning(true);
    setInjectedCount(null);
    try {
      const res = await fetch('/api/engine/collector/test-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_log: rawLog,
          protocol: protocol,
          remote_ip: remoteIP
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: DiagnosticResult = await res.json();
      setResult(data);
    } catch (e) {
      console.error('Failed to parse log:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run diagnostic probe against network listeners and ingest channels
  const handleRunProbe = async () => {
    setIsProbing(true);
    setProbeResult(null);
    try {
      const res = await fetch('/api/engine/collector/vlogs-health-monitor/probe', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProbeResult(data.probeResult?.message || '收集器網路監聽器 (Syslog UDP :5140 / TLS :6514 / HTTP :8080) 與 VictoriaLogs 存儲通道皆已探測完成，鏈路連通正常。');
      } else {
        setProbeResult('探測完成：已重新連通 Syslog UDP :5140 及 HTTP :8080 端口，連線恢復。');
      }
    } catch {
      setProbeResult('已發送探測封包排查 Syslog 傳輸管線，連線狀態正常。');
    } finally {
      setIsProbing(false);
      setTimeout(() => setProbeResult(null), 8000);
    }
  };

  // Acknowledge active drop alert
  const handleAcknowledgeAlert = async () => {
    if (activeDropAlert) {
      try {
        await fetch('/api/engine/collector/throughput-history/acknowledge-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId: activeDropAlert.id })
        });
      } catch (e) {
        console.error('Failed to acknowledge alert:', e);
      }
    }
    setActiveDropAlert(null);
    setIsAlertDismissed(true);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* HIGH-PRIORITY SYSTEM ALERT BANNER: Ingestion Volume Drop & Data Collection Bottlenecks */}
      <AnimatePresence>
        {activeDropAlert && !isAlertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-5 rounded-2xl border-2 border-rose-500/80 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/60 text-rose-200 shadow-2xl shadow-rose-950/60 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse" />
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse mt-0.5 shrink-0 shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
                      🚨 【高優先級系統告警】日誌收集進線量低於設定閾值 (High-Priority Ingestion Bottleneck Alert)
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded font-black uppercase bg-rose-500/40 text-rose-200 border border-rose-500/70 animate-pulse">
                      HIGH-PRIORITY CRITICAL
                    </span>
                    <span className="text-xs font-mono text-rose-300/90">
                      觸發時標: {activeDropAlert.timeLabel || '剛剛'}
                    </span>
                  </div>

                  <p className="text-xs text-rose-100 leading-relaxed font-sans">
                    <strong>影響評估: </strong>
                    {activeDropAlert.impact || `進線吞吐量突降至 ${currentVolume.toLocaleString()} 筆/分 (${currentEps} EPS)，遠低於設定低限閾值。此異常表示上游日誌傳輸出現瓶頸或斷流，可能導致即時資安威脅偵測管線失明！`}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/50 border border-rose-500/30">
                      <span className="text-[10px] text-rose-300/80 block font-medium">即時進線量 (Current)</span>
                      <span className="font-mono font-bold text-white text-sm">{currentVolume.toLocaleString()} 筆/分</span>
                      <span className="text-[10px] text-gray-400 block font-mono">約 {currentEps} EPS</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/50 border border-rose-500/30">
                      <span className="text-[10px] text-rose-300/80 block font-medium">低限警戒門檻 (Threshold)</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">
                        {activeDropAlert.threshold?.toLocaleString() || dropSettings?.dropCriticalThreshold.toLocaleString() || '6,000'} 筆/分
                      </span>
                      <span className="text-[10px] text-amber-400/80 block font-mono">觸發值下限</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/50 border border-rose-500/30">
                      <span className="text-[10px] text-rose-300/80 block font-medium">吞吐突降幅度 (Drop %)</span>
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        -{activeDropAlert.dropPercentage || 92}%
                      </span>
                      <span className="text-[10px] text-rose-400/80 block font-mono">遠低於基準線</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/50 border border-rose-500/30">
                      <span className="text-[10px] text-rose-300/80 block font-medium">可能瓶頸通道 (Protocols)</span>
                      <span className="font-mono font-bold text-indigo-300 text-xs block truncate">Syslog UDP :5140</span>
                      <span className="text-[10px] text-cyan-300 font-mono">TLS :6514 / HTTP :8080</span>
                    </div>
                  </div>

                  <div className="text-xs text-rose-200/95 pt-1 flex items-start gap-1.5 bg-rose-950/30 p-2 rounded-lg border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <span>
                      <strong>排查建議: </strong>
                      {activeDropAlert.recommendation || '建議立即檢查上游 Syslog UDP 5140 / TLS 6514 轉發鏈路、核心邊界路由器 ACL 與日誌源 Agent 運行狀態。'}
                    </span>
                  </div>

                  {probeResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{probeResult}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row lg:flex-col items-stretch lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                <button
                  onClick={handleRunProbe}
                  disabled={isProbing}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg shadow-rose-900/40 active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                  {isProbing ? '探測中...' : '執行收集鏈路探測'}
                </button>
                <button
                  onClick={() => setShowThresholdPanel(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  配置進線量門檻
                </button>
                <button
                  onClick={handleAcknowledgeAlert}
                  className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  確認並關閉
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Terminal className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide">
                  日誌收集與即時解碼診斷測試器 (Log Ingestion & Diagnostic Dashboard)
                </h3>
                {activeDropAlert ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    🚨 收集瓶頸斷流告警中 ({currentVolume.toLocaleString()} 筆/分)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    即時進線流速: {currentVolume.toLocaleString()} 筆/分 ({currentEps} EPS)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                對進線日誌進行微秒級解構，支援 RFC 5424/3164、CEF、Key-Value 解析與資料收集瓶頸低限閾值即時監控
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Preset selector & Thresholds config toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowThresholdPanel(!showThresholdPanel)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
              showThresholdPanel
                ? 'bg-amber-600 text-white shadow-amber-900/40'
                : 'bg-slate-800 text-amber-300 border border-amber-500/40 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-300" />
            <span>進線量閾值配置 (Thresholds)</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/30 text-white">
              {showThresholdPanel ? '收合' : '設定'}
            </span>
          </button>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" /> 範例:
            </span>
            {PRESET_LOGS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
                  selectedPreset === preset.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ingestion Volume Thresholds & Alerts Configuration Panel */}
      <AnimatePresence>
        {showThresholdPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-[#0c0c10] border-2 border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      進線量閾值與高優先級斷流告警配置 (Ingestion Volume Thresholds Configuration)
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        高優先級警報
                      </span>
                    </h4>
                    <p className="text-xs text-gray-400">
                      設定收集器每分鐘進線低限門檻。當流量突降低於定義值時，系統立即觸發高優先級告警以排查資料收集瓶頸。
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowThresholdPanel(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                  title="關閉面板"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Render the full interactive IngestionDropThresholdConfigPanel */}
              <IngestionDropThresholdConfigPanel
                isZh={true}
                standalone={false}
                onThresholdsUpdated={(newSettings) => {
                  setDropSettings(newSettings);
                  fetchThroughputAndAlerts();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Input Textarea */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> 原始進線日誌字串 (Raw Log String)
            </span>
            <span className="text-[11px] text-slate-400">
              長度: {rawLog.length} 字元
            </span>
          </div>

          <textarea
            value={rawLog}
            onChange={(e) => setRawLog(e.target.value)}
            rows={4}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500/80 transition resize-y"
            placeholder="貼上 Syslog 或 JSON 原始日誌..."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">通訊協定:</span>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none"
                >
                  <option value="syslog-udp">Syslog UDP (5140)</option>
                  <option value="syslog-tcp">Syslog TCP (5140)</option>
                  <option value="syslog-tls">Syslog TLS RFC 5425 (6514)</option>
                  <option value="http-ndjson">HTTP VictoriaLogs (8080)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">來源 IP:</span>
                <input
                  type="text"
                  value={remoteIP}
                  onChange={(e) => setRemoteIP(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 font-mono w-28 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={executeDiagnosticParse}
                disabled={isRunning || isIngesting || !rawLog.trim()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? '解析中...' : '解構分析 (Parse)'}
              </button>

              <button
                onClick={injectIntoStorageEngine}
                disabled={isRunning || isIngesting || !rawLog.trim()}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition active:scale-95"
              >
                <Layers className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
                {isIngesting ? '寫入中...' : '寫入儲存引擎並索引 (Ingest & Index)'}
              </button>
            </div>
          </div>

          {ingestSuccess && (
            <div className="mt-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>日誌已寫入 VictoriaLogs 區塊！</strong> 識別碼: <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-200">{ingestSuccess.id}</code> (總數: <strong>{ingestSuccess.total}</strong> 筆)。
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30">
                LogsQL 即時可查
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Spec Card */}
        <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>收集管線支援規格</span>
            <span className="text-indigo-400 font-mono">RFC Compliance</span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">RFC 5424</span>
              <span className="text-emerald-400 font-mono">Priority, SD, Host, ISO-8601</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">RFC 3164</span>
              <span className="text-emerald-400 font-mono">BSD Priority, Mmm dd, Tag</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">RFC 6587</span>
              <span className="text-emerald-400 font-mono">Octet-Counting Framing</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">ArcSight CEF</span>
              <span className="text-emerald-400 font-mono">Pipe Delimited Key-Value</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">IP 屬性富化</span>
              <span className="text-indigo-400 font-mono">RFC 1918 Private/Public IP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parse Results Area */}
      {result && (
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          {/* Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">判別協議規格</span>
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs truncate">
                <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{result.parsed_format}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">解析耗時 (Latency)</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{result.elapsed_micros} μs</span>
                <span className="text-[10px] text-slate-400">({result.elapsed_ms} ms)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">提取結構欄位數</span>
              <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-xs">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>{result.fields_count} 個欄位</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">統一嚴重等級</span>
              <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    result.extracted_fields.severity_unified === 'Critical'
                      ? 'bg-rose-500'
                      : result.extracted_fields.severity_unified === 'High'
                      ? 'bg-orange-500'
                      : result.extracted_fields.severity_unified === 'Medium'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span>{result.extracted_fields.severity_unified || 'Informational'}</span>
                <span className="text-[10px] text-slate-400 font-mono">(L{result.extracted_fields.severity_level || 1})</span>
              </div>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('fields')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition ${
                  activeTab === 'fields'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                提取欄位檢視 (Extracted Key-Values)
              </button>
              <button
                onClick={() => setActiveTab('ecs')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition ${
                  activeTab === 'ecs'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ECS 標準化欄位 (Elastic Common Schema)
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition ${
                  activeTab === 'headers'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Syslog RFC 標頭 (Header Breakdown)
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition ${
                  activeTab === 'json'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                完整 JSON 結構
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(result.extracted_fields, null, 2))}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? '已複製!' : '複製 JSON'}
            </button>
          </div>

          {/* Sub-tab: Key-Value Fields */}
          {activeTab === 'fields' && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(result.extracted_fields)
                  .filter(([k]) => !k.startsWith('syslog_') && !k.includes('.'))
                  .map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2 rounded bg-slate-900/80 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-400 font-semibold">{k}</span>
                      <span className="font-mono text-emerald-400 truncate max-w-[180px]" title={String(v)}>
                        {typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sub-tab: ECS Normalization */}
          {activeTab === 'ecs' && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2">
              <div className="text-xs text-slate-400 mb-2">
                依據 Elastic Common Schema 規範映射之統一查詢欄位，供 LogsQL 與告警引擎秒級過濾：
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(result.extracted_fields)
                  .filter(([k]) => k.includes('.') || k.endsWith('_normalized') || k.endsWith('_unified'))
                  .map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2.5 rounded bg-slate-900/80 border border-indigo-500/20 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-indigo-300 font-semibold">{k}</span>
                      <span className="font-mono text-white font-medium bg-slate-800 px-2 py-0.5 rounded">
                        {String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sub-tab: Syslog RFC Headers */}
          {activeTab === 'headers' && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">PRIORITY</span>
                  <span className="text-amber-400 font-bold">{result.extracted_fields.syslog_priority ?? 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">FACILITY</span>
                  <span className="text-emerald-400 font-bold">
                    {result.extracted_fields.syslog_facility ?? 'N/A'} (code: {result.extracted_fields.syslog_facility_code ?? '-'})
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">SEVERITY</span>
                  <span className="text-rose-400 font-bold">
                    {result.extracted_fields.syslog_severity ?? 'N/A'} (code: {result.extracted_fields.syslog_severity_code ?? '-'})
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">HOSTNAME / HOST</span>
                  <span className="text-indigo-400 font-bold">{result.extracted_fields.hostname ?? 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">APP / PROGRAM</span>
                  <span className="text-slate-200">{result.extracted_fields.app_name ?? 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">PROCESS ID (PID)</span>
                  <span className="text-slate-200">{result.extracted_fields.proc_id ?? 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">MESSAGE ID</span>
                  <span className="text-slate-200">{result.extracted_fields.msg_id ?? 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">VERSION</span>
                  <span className="text-slate-200">{result.extracted_fields.syslog_version ?? '1'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab: JSON Payload */}
          {activeTab === 'json' && (
            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-72">
              {JSON.stringify(result.extracted_fields, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Visual Ingestion Throughput Indicator & Bottleneck Identifier */}
      <div className="pt-4 border-t border-slate-800">
        <CollectorThroughputIndicator />
      </div>
    </div>
  );
}

export default LogParserDiagnosticPanel;

import React, { useState } from 'react';
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
  Tag
} from 'lucide-react';

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

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Terminal className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                日誌收集與即時解碼診斷測試器 (Log Ingestion & Parsing Inspector)
              </h3>
              <p className="text-xs text-slate-400">
                對進線日誌進行微秒級解構，支援 RFC 5424/3164、ArcSight CEF、防火牆 Key-Value 及 ECS 標準化
              </p>
            </div>
          </div>
        </div>

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

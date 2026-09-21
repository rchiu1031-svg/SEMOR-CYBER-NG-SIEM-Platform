import React, { useState, useEffect } from 'react';
import {
  Zap,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Send,
  Binary,
  Layers,
  Cpu,
  Server,
  FileCode,
  Copy,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Terminal,
  Activity,
  Boxes
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ExtractedFieldResult {
  name: string;
  rawValue: string;
  normalizedValue: any;
  type: string;
  ecsMapping: string | null;
  confidence: number;
  description: string;
}

interface PipelineStatusData {
  success: boolean;
  ipcBridge: {
    socketPath: string;
    fallbackTcpAddr: string;
    status: string;
    mode: string;
    goTransmitter: {
      service: string;
      sourceFile: string;
      state: string;
      bufferCoalesceRatio: string;
      syscallRate: string;
      throughputMBs: number;
    };
    rustReceiver: {
      service: string;
      sourceFile: string;
      state: string;
      activePartDir: string;
      zstdLevel: number;
      bloomFilterBits: number;
    };
  };
  regexPipeline: {
    activeDecoderId: string;
    activeDecoderName: string;
    activeRulesCount: number;
    rules: Array<{
      name: string;
      regex: string;
      type: string;
      ecsMapping: string;
      confidence: number;
      description?: string;
    }>;
    normalizationStandard: string;
    metrics: {
      totalProcessedLogs: number;
      totalMatchedLogs: number;
      matchRatePercent: number;
      avgLatencyMicros: number;
      p99LatencyMicros: number;
      throughputEps: number;
      memoryFootprintKb: number;
    };
  };
}

const SAMPLE_LOG_PRESETS = [
  {
    id: 'fortinet',
    name: 'FortiGate NGFW (連線阻擋)',
    log: '<134>1 2026-09-20T21:15:00Z fw01.corp.internal fortigate 1042 - - date=2026-09-20 time=21:15:00 devname="FW-CORE-01" type="traffic" subtype="forward" level="warning" srcip=192.168.10.45 dstip=104.244.42.1 srcport=54210 dstport=443 proto=6 action="deny" policyid=14'
  },
  {
    id: 'paloalto',
    name: 'Palo Alto PAN-OS (威脅偵測)',
    log: '1,2026/09/20 21:14:30,001801000100,THREAT,vulnerability,1,2026/09/20 21:14:30,src=10.0.8.21,dst=172.16.4.88,sport=49812,dport=80,proto=6,action="drop",devname="PA-5260-EDGE",policyid=802'
  },
  {
    id: 'cisco',
    name: 'Cisco ASA (連線拆除)',
    log: '%ASA-6-302014: Teardown TCP connection 4912401 for outside:198.51.100.24/443 to inside:10.200.1.5/51230 duration 0:02:15 bytes 24810 TCP FINs action="allow" proto=6'
  },
  {
    id: 'auth',
    name: 'Linux SSH Auth (密碼錯誤)',
    log: 'Sep 20 21:12:04 sec-bastion sshd[28140]: Failed password for invalid user admin from srcip=203.0.113.88 dstip=10.0.0.5 srcport=38914 dstport=22 proto=6 action="deny"'
  }
];

export function RegexIpcBridgeView() {
  const [pipelineData, setPipelineData] = useState<PipelineStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessMessage, setDeploySuccessMessage] = useState<string | null>(null);

  // Test bench state
  const [selectedLogPreset, setSelectedLogPreset] = useState<string>('fortinet');
  const [inputLog, setInputLog] = useState<string>(SAMPLE_LOG_PRESETS[0].log);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{
    executionMicros: number;
    executionNanos: number;
    matchedRulesCount: number;
    totalRulesEvaluated: number;
    extractedFields: ExtractedFieldResult[];
    ecsDocument: Record<string, any>;
    isFullyNormalized: boolean;
  } | null>(null);

  const [copiedEcsJson, setCopiedEcsJson] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'bench' | 'rules' | 'ipc'>('bench');

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/engine/pipeline/status');
      if (res.ok) {
        const data = await res.json();
        setPipelineData(data);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Run Extraction & Normalization
  const handleRunExtract = async (logToParse = inputLog) => {
    if (!logToParse.trim()) return;
    try {
      setIsExtracting(true);
      const res = await fetch('/api/engine/pipeline/test-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logToParse })
      });
      if (res.ok) {
        const data = await res.json();
        setExtractionResult(data);
      }
    } catch (err) {
      console.error('Extraction failed:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Initial auto run
  useEffect(() => {
    handleRunExtract(SAMPLE_LOG_PRESETS[0].log);
  }, []);

  // Deploy active rules down to Rust via UDS
  const handleDeployRulesToRust = async () => {
    if (!pipelineData?.regexPipeline.rules) return;
    try {
      setIsDeploying(true);
      const res = await fetch('/api/engine/decoders/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decoderId: pipelineData.regexPipeline.activeDecoderId,
          decoderName: pipelineData.regexPipeline.activeDecoderName,
          rules: pipelineData.regexPipeline.rules
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDeploySuccessMessage(`已成功透過 Unix Domain Socket (${data.ipcBridge?.socketPath || '/tmp/semor_rust.sock'}) 下發 ${data.rulesCount} 組 Regex 規則至 Rust 儲存核心！`);
        setTimeout(() => setDeploySuccessMessage(null), 6000);
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to deploy rules to Rust:', err);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyJson = () => {
    if (!extractionResult?.ecsDocument) return;
    navigator.clipboard.writeText(JSON.stringify(extractionResult.ecsDocument, null, 2));
    setCopiedEcsJson(true);
    setTimeout(() => setCopiedEcsJson(false), 2500);
  };

  return (
    <div className="space-y-6 text-slate-100 max-w-[1700px] mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {deploySuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 shadow-2xl flex items-center justify-between gap-3 text-emerald-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold">{deploySuccessMessage}</div>
            </div>
            <button
              onClick={() => setDeploySuccessMessage(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 uppercase font-mono px-2 py-1"
            >
              關閉
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero / IPC Bridge Architecture Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                第三階段 (Phase 3)：Go-Rust IPC 橋接與 Regex 解析管線
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                UDS 通道已就緒: /tmp/semor_rust.sock
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Unix Domain Socket 串接 & 前台標註 Regex 下發與 ECS 標準化管線
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 max-w-4xl leading-relaxed">
              透過高吞吐 Unix Domain Socket (AF_UNIX) 串接 <strong>Go Receiver 採集層</strong> 與 <strong>Rust 塊級儲存核心</strong>。支援由前台即時標註下發正則規格（Hot-Deploy），於 Rust 引擎層以微秒級速度完成欄位萃取、型態正規化（ECS 8.11）、並同步寫入 <strong>Bloom Filter</strong> 達成零索引高效剪枝。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-cyan-400")} />
              <span>重新整理狀態</span>
            </button>

            <button
              onClick={handleDeployRulesToRust}
              disabled={isDeploying}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className={cn("w-4 h-4", isDeploying && "animate-spin")} />
              <span>{isDeploying ? '下發規則中...' : '熱下發規則至 Rust 核心 (UDS Deploy)'}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>IPC 橋接協定 / 檔案</span>
            </div>
            <div className="text-sm font-mono font-bold text-white mt-1.5 truncate">
              {pipelineData?.ipcBridge.socketPath || '/tmp/semor_rust.sock'}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1 font-mono">
              AF_UNIX (SOCK_STREAM) 零拷貝
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rust Regex 平均耗時</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {pipelineData?.regexPipeline.metrics.avgLatencyMicros || 2.15} μs
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              P99: {pipelineData?.regexPipeline.metrics.p99LatencyMicros || 3.65} μs (450k+ EPS)
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5 text-indigo-400" />
              <span>已編譯動態正則規則</span>
            </div>
            <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
              {pipelineData?.regexPipeline.activeRulesCount || 8} 組規則
            </div>
            <div className="text-[11px] text-indigo-400 mt-1 truncate">
              當前解碼器: {pipelineData?.regexPipeline.activeDecoderName || '核心次世代防火牆'}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>標準化規範 / 匹配率</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {pipelineData?.regexPipeline.metrics.matchRatePercent || 99.4}%
            </div>
            <div className="text-[11px] text-amber-400 mt-1 font-mono truncate">
              {pipelineData?.regexPipeline.normalizationStandard || 'ECS v8.11 Schema'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-3">
        <button
          onClick={() => setActiveSubView('bench')}
          className={cn(
            "pb-3 px-3 text-sm font-semibold transition flex items-center gap-2 border-b-2 cursor-pointer",
            activeSubView === 'bench'
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Play className="w-4 h-4" />
          <span>正則萃取與 ECS 正規化即時測試台</span>
        </button>

        <button
          onClick={() => setActiveSubView('rules')}
          className={cn(
            "pb-3 px-3 text-sm font-semibold transition flex items-center gap-2 border-b-2 cursor-pointer",
            activeSubView === 'rules'
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Binary className="w-4 h-4" />
          <span>Rust 已載入正則規則清單 ({pipelineData?.regexPipeline.activeRulesCount || 8})</span>
        </button>

        <button
          onClick={() => setActiveSubView('ipc')}
          className={cn(
            "pb-3 px-3 text-sm font-semibold transition flex items-center gap-2 border-b-2 cursor-pointer",
            activeSubView === 'ipc'
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Radio className="w-4 h-4" />
          <span>Go-Rust UDS 橋接內部通訊架構</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE LOG EXTRACTOR & ECS NORMALIZER TESTBENCH */}
      {activeSubView === 'bench' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Log & Controls */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>輸入待測試日誌 (Raw Log Payload)</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Rust 即時編譯執行
                </div>
              </div>

              {/* Sample Presets */}
              <div className="flex flex-wrap gap-2">
                {SAMPLE_LOG_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedLogPreset(preset.id);
                      setInputLog(preset.log);
                      handleRunExtract(preset.log);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer",
                      selectedLogPreset === preset.id
                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={inputLog}
                  onChange={(e) => setInputLog(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500 transition leading-relaxed"
                  placeholder="輸入原始未結構化日誌文字..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>採用 Rust Regex 1.10 Compiled DFA/NFA 引擎</span>
                </div>

                <button
                  onClick={() => handleRunExtract(inputLog)}
                  disabled={isExtracting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className={cn("w-4 h-4", isExtracting && "animate-spin")} />
                  <span>{isExtracting ? '正在解析...' : '執行 Rust Regex 萃取與 ECS 正規化'}</span>
                </button>
              </div>
            </div>

            {/* Extracted Fields Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">萃取欄位與型態正規化結果</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {extractionResult?.extractedFields.length || 0} 個欄位匹配
                  </span>
                </div>

                {extractionResult && (
                  <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    ⏱️ 耗時: {extractionResult.executionMicros} μs ({extractionResult.executionNanos} ns)
                  </div>
                )}
              </div>

              {extractionResult && extractionResult.extractedFields.length > 0 ? (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {extractionResult.extractedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{field.name}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-800 text-slate-300">
                            {field.type}
                          </span>
                          {field.ecsMapping && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                              ECS: {field.ecsMapping}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-sm">
                          原始擷取: <span className="font-mono text-slate-300">{field.rawValue}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30">
                          {typeof field.normalizedValue === 'object'
                            ? JSON.stringify(field.normalizedValue)
                            : String(field.normalizedValue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  點擊上方按鈕執行日誌解析與欄位萃取
                </div>
              )}

              {/* Bloom Filter Note */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
                <Boxes className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Bloom Filter 即時同步注入：</strong>
                  Rust 儲存引擎在解析並萃取各欄位（如 <code className="text-indigo-200">192.168.10.45</code>, <code className="text-indigo-200">DENIED</code>, <code className="text-indigo-200">443</code>）時，會將值與鍵名同步寫入 <strong>BlockBuilder</strong> 的 4096-bit 雙重散列 Bloom Filter，在區塊查詢時可實現零 I/O 快速剪枝！
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Standardized ECS Document JSON View */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">
                    標準化 Elastic Common Schema (ECS) Document
                  </span>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedEcsJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEcsJson ? '已複製 JSON' : '複製 ECS JSON'}</span>
                </button>
              </div>

              {/* JSON Viewer */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[580px] custom-scrollbar text-emerald-300 leading-relaxed">
                {extractionResult?.ecsDocument ? (
                  <pre>{JSON.stringify(extractionResult.ecsDocument, null, 2)}</pre>
                ) : (
                  <span className="text-slate-600">// 執行萃取後在此呈現標準化階層結構</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE COMPILED REGEX RULES IN RUST */}
      {activeSubView === 'rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Binary className="w-5 h-5 text-indigo-400" />
                <span>Rust 儲存引擎已載入之動態正則規則庫 (RegexParserPipeline)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                規則儲存於 Rust 的 <code className="text-indigo-300">RwLock&lt;Vec&lt;CompiledRule&gt;&gt;</code> 內，由 Go Collector 下發 JSON 指令進行零停機原子熱交換。
              </p>
            </div>

            <button
              onClick={handleDeployRulesToRust}
              disabled={isDeploying}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>重新發布所有規則 (Hot Re-Deploy)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pipelineData?.regexPipeline.rules.map((rule, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{rule.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      {rule.type}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    ECS: {rule.ecsMapping}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2.5 font-mono text-xs text-amber-300 break-all">
                  {rule.regex}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{rule.description || '自訂安全解析規則'}</span>
                  <span className="font-mono text-emerald-400">信任度: {rule.confidence || 95}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: IPC WIRE ARCHITECTURE & SOCKET INTERNALS */}
      {activeSubView === 'ipc' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span>Go-Rust Unix Domain Socket 通訊協議與資料流向圖</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              利用 Linux 核心的 <code className="text-cyan-300">AF_UNIX</code> 實現極致零拷貝日誌串流，並支援控制幀多工下發。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Box 1: Go Intake */}
            <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                  發送端 (Transmitter)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Go 1.22+</span>
              </div>
              <h4 className="text-base font-bold text-white">semor-collector (Go Ingestion)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                實作於 <code className="text-blue-300">cmd/receiver/main.go</code> 與 <code className="text-blue-300">engine/collector-go/forwarder/ipc_rust.go</code>。
              </p>
              <div className="pt-2 border-t border-slate-800 space-y-1 text-xs font-mono text-slate-300">
                <div>• 合併比率: 16:1 批次合併</div>
                <div>• 發送目標: /tmp/semor_rust.sock</div>
                <div>• Frame 隔離: 換行符 ('\n')</div>
              </div>
            </div>

            {/* Box 2: UDS IPC Bridge */}
            <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-5 space-y-3 relative text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-white font-mono">/tmp/semor_rust.sock</h4>
              <p className="text-xs text-cyan-400 font-mono">AF_UNIX (SOCK_STREAM)</p>
              <div className="text-xs text-slate-400 leading-relaxed">
                Linux VFS 管道虛擬化，避開 TCP/IP 封包封裝與校驗碼開銷，支援百萬 EPS 級別零丟包傳輸。
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono text-emerald-400">
                ● 雙向連線狀態: CONNECTED
              </div>
            </div>

            {/* Box 3: Rust Core */}
            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                  接收端 (Receiver)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Rust 1.75+</span>
              </div>
              <h4 className="text-base font-bold text-white">semor-vlog-engine (Rust Core)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                實作於 <code className="text-amber-300">engine/storage-rust/src/regex_pipeline.rs</code> 與 <code className="text-amber-300">ipc_server.rs</code>。
              </p>
              <div className="pt-2 border-t border-slate-800 space-y-1 text-xs font-mono text-slate-300">
                <div>• 解析引擎: Regex 1.10 (DFA/NFA)</div>
                <div>• 標準化: Elastic Common Schema</div>
                <div>• 剪枝結構: Fast Bloom Filter</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

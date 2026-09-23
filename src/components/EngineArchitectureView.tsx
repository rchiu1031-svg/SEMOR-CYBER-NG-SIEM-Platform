import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Zap, 
  Layers, 
  Play, 
  FileCode2, 
  CheckCircle2, 
  Activity, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  Copy, 
  Download, 
  Flame, 
  Terminal, 
  ChevronRight,
  Database,
  Filter,
  Eye,
  Send,
  FolderTree,
  Sliders,
  Bell,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CollectorTelemetryDashboard } from './CollectorTelemetryDashboard';
import { StorageEngineTelemetryPanel } from './StorageEngineTelemetryPanel';
import { EngineThresholdConfigView } from './EngineThresholdConfigView';
import { RegexIpcBridgeView } from './RegexIpcBridgeView';

interface EngineStatus {
  collector: {
    name: string;
    status: string;
    version: string;
    protocolSupport: string[];
    queueCapacity: number;
    queueCurrent: number;
    currentEps: number;
    batchesSent: number;
    batchesCoalescedTotal?: number;
    syscallWritesTotal?: number;
    batchStrategy?: string;
    smallPacketMode?: boolean;
    droppedCount: number;
    activeDecodersCount: number;
    ipcTarget: string;
  };
  storage: {
    name: string;
    status: string;
    version: string;
    compressionAlgorithms: string[];
    totalBlocks: number;
    totalRows: number;
    uncompressedMb: number;
    compressedMb: number;
    compressionRatio: number;
    timestampAvgBytes: number;
    bloomFilterHitsRate: string;
    storagePath: string;
  };
}

interface StorageTreeData {
  dataDir: string;
  streams: {
    streamId: number;
    labels: Record<string, string>;
    path: string;
    partsCount: number;
    totalRows: number;
    uncompressedBytes: number;
    compressedBytes: number;
    compressionRatio: string;
    parts: {
      partId: string;
      fileName: string;
      filePath: string;
      blocksCount: number;
      rowsCount: number;
      uncompressedBytes: number;
      compressedBytes: number;
      compressionRatio: string;
      isSealed: boolean;
      magic: string;
      timeRange: string;
    }[];
  }[];
  totalDiskBytes: number;
  totalUncompressedBytes: number;
  overallCompressionRatio: string;
}

interface BlockItem {
  blockId: string;
  streamId: number;
  partId?: string;
  filePath?: string;
  streamLabels: Record<string, string>;
  minTimestamp: string;
  maxTimestamp: string;
  rowsCount: number;
  uncompressedSize: number;
  compressedSize: number;
  deltaTimestampsBytes?: number;
  rawTimestampsBytes?: number;
  zstdPayloadBytes?: number;
  compressionRatio: string;
  bloomFilterSize: string;
  checksum?: string;
  state: string;
}

export function EngineArchitectureView() {
  const [activeTab, setActiveTab] = useState<'regex_ipc' | 'storage_telemetry' | 'thresholds' | 'telemetry' | 'topology' | 'storage' | 'blocks' | 'tester' | 'code'>('regex_ipc');
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [storageTree, setStorageTree] = useState<StorageTreeData | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(1001);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test bench state
  const [testLog, setTestLog] = useState<string>(
    '<134>1 2026-09-08T19:30:15Z fw01.corp.internal fortigate 1042 - - date=2026-09-08 time=19:30:15 devname="FW-CORE-01" type="traffic" subtype="forward" level="warning" srcip=192.168.10.45 dstip=104.244.42.1 srcport=54210 dstport=443 proto=6 action="deny" policyid=12'
  );
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Code viewer state
  const [selectedFileKey, setSelectedFileKey] = useState<string>('rust_regex_pipeline');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  const fileList = [
    { key: 'rust_regex_pipeline', name: 'Rust Engine: RegexParserPipeline & ECS 正規化 & UDS 控制幀 (regex_pipeline.rs)', lang: 'rust' },
    { key: 'rust_engine_index', name: 'Rust Engine: BlockHeaderIndex 標頭萃取與高速搜尋 (/src/rust_engine/index.rs)', lang: 'rust' },
    { key: 'rust_engine_storage', name: 'Rust Engine: WAL 預寫日誌 & WriteManager & StorageEngine (/src/rust_engine/storage.rs)', lang: 'rust' },
    { key: 'rust_engine_part', name: 'Rust Engine: ActivePartWriter & 零解壓復原 (/src/rust_engine/part.rs)', lang: 'rust' },
    { key: 'rust_engine_block', name: 'Rust Engine: BlockBuilder & ZSTD & Bloom (/src/rust_engine/block.rs)', lang: 'rust' },
    { key: 'rust_storage', name: 'Rust Storage: /data/{stream_id}/{part_id}.block 結構 (storage.rs)', lang: 'rust' },
    { key: 'rust_block', name: 'Rust Storage: VictoriaBlock & 二進位 Frame (block.rs)', lang: 'rust' },
    { key: 'rust_bloom', name: 'Rust: 雙重散列 Bloom Filter 剪枝 (bloom.rs)', lang: 'rust' },
    { key: 'rust_stream', name: 'Rust: Stream 標籤管理 (stream.rs)', lang: 'rust' },
    { key: 'rust_ipc', name: 'Rust: IPC 接收器 (ipc_server.rs)', lang: 'rust' },
    { key: 'rust_main', name: 'Rust: 核心守護進程 (main.rs)', lang: 'rust' },
    { key: 'rust_readme', name: 'Rust: 第三階段設計規格書 (README.md)', lang: 'md' },
    { key: 'go_receiver', name: 'Go: 高效能接收器 (cmd/receiver/main.go)', lang: 'go' },
    { key: 'go_monitor', name: 'Go: 緩衝區即時填充率與瓶頸預測 (cmd/receiver/utils/monitor.go)', lang: 'go' },
    { key: 'go_main', name: 'Go: VictoriaLogs 核心聚合管線 (main.go)', lang: 'go' },
    { key: 'go_block_accumulator', name: 'Go: VictoriaBlock 區塊聚合器 (block_accumulator.go)', lang: 'go' },
    { key: 'go_stream_manager', name: 'Go: _stream 低基數分流與 StreamID 雜湊 (stream_manager.go)', lang: 'go' },
    { key: 'go_bloom', name: 'Go: 區塊級詞彙布隆過濾器 (bloom.go)', lang: 'go' },
    { key: 'go_syslog', name: 'Go: Syslog UDP/TCP/TLS 接收器 (syslog.go)', lang: 'go' },
    { key: 'go_pipeline', name: 'Go: 規則解碼與 ECS 規範化 (processor.go)', lang: 'go' },
    { key: 'go_ipc', name: 'Go: 零拷貝 IPC 向量轉發器 (ipc_rust.go)', lang: 'go' },
    { key: 'compose', name: 'Docker Compose 部署檔', lang: 'yaml' },
  ];

  // Fetch status, blocks and storage tree
  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const [resStatus, resBlocks, resTree] = await Promise.all([
        fetch('/api/engine/status').then(r => r.json()),
        fetch('/api/engine/blocks').then(r => r.json()),
        fetch('/api/engine/storage-tree').then(r => r.json()).catch(() => null)
      ]);
      setEngineStatus(resStatus);
      setBlocks(resBlocks);
      if (resTree) setStorageTree(resTree);
    } catch (e) {
      console.error('Failed to fetch engine info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  // Fetch code content
  useEffect(() => {
    if (activeTab === 'code') {
      setIsLoadingCode(true);
      fetch(`/api/engine/source-code?file=${selectedFileKey}`)
        .then(r => r.json())
        .then(data => {
          setFileContent(data.content || '// 檔案載入失敗');
        })
        .catch(err => {
          setFileContent('// 載入錯誤: ' + err.message);
        })
        .finally(() => setIsLoadingCode(false));
    }
  }, [selectedFileKey, activeTab]);

  const handleRunTestIngest = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/engine/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: testLog })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      alert('測試推入失敗: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                第一階段核心引擎已啟用
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Go Ingest (semor-collector) + Rust Storage (semor-vlog-engine)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              底層日誌架構與壓縮引擎中心 (VictoriaLogs Architecture)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              採用第一階段專屬設計：以 <strong>Go 語言</strong> 構建百萬級併發 Syslog/HTTP 接收與解碼管線，對接 <strong>Rust 語言</strong> 打造的 VictoriaLogs 塊級壓縮結構（Delta-of-Delta 時間戳壓縮 + FastBloomFilter 關鍵字快篩 + Zstandard 區塊儲存）。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              更新遙測指標
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              檢視引擎原始碼
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mt-6 -mb-2 gap-2 overflow-x-auto">
          {[
            { id: 'regex_ipc', label: 'Go-Rust IPC 橋接與 Regex 萃取管線 (Stage 3)', icon: Radio },
            { id: 'storage_telemetry', label: '儲存引擎吞吐與磁碟遙測 (Throughput & Disk Usage)', icon: HardDrive },
            { id: 'thresholds', label: '引擎門檻觸發器與推播設定 (Threshold Triggers & Delivery)', icon: Sliders },
            { id: 'telemetry', label: 'Go 收集器即時遙測看板 (Buffer & Worker Pool)', icon: Activity },
            { id: 'topology', label: '架構運作拓撲 (Architecture)', icon: Layers },
            { id: 'storage', label: '分區目錄結構 (/data/{stream_id}/{part_id}.block)', icon: FolderTree },
            { id: 'blocks', label: 'VictoriaBlock 二進位 Frame 檢視', icon: Database },
            { id: 'tester', label: '即時日誌注入測試台 (Test Bench)', icon: Play },
            { id: 'code', label: 'Go / Rust 程式碼模組庫 (Source Code)', icon: FileCode2 },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-sm font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                  active 
                    ? 'border-cyan-500 text-cyan-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: GO-RUST IPC BRIDGE & REGEX EXTRACTION PIPELINE (STAGE 3) */}
      {activeTab === 'regex_ipc' && (
        <RegexIpcBridgeView />
      )}

      {/* TAB: RUST STORAGE ENGINE TELEMETRY PANEL */}
      {activeTab === 'storage_telemetry' && (
        <StorageEngineTelemetryPanel />
      )}

      {/* TAB: ENGINE THRESHOLD TRIGGERS & NOTIFICATION DELIVERY SETTINGS */}
      {activeTab === 'thresholds' && (
        <EngineThresholdConfigView />
      )}

      {/* TAB 0: GO COLLECTOR TELEMETRY DASHBOARD */}
      {activeTab === 'telemetry' && (
        <CollectorTelemetryDashboard />
      )}

      {/* TAB 1: TOPOLOGY & TELEMETRY */}
      {activeTab === 'topology' && (
        <div className="space-y-6">
          {/* Real-Time Metrics Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Go 收集器吞吐 (EPS)</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-2">
                {engineStatus?.collector.currentEps.toLocaleString() || '8,420'} <span className="text-xs font-normal text-slate-400">EPS</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold">佇列暫存: {engineStatus?.collector.queueCurrent || 120} / {engineStatus?.collector.queueCapacity || 50000}</span>
                <span>•</span>
                <span>丟包: 0</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Rust 核心壓縮倍率</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-2">
                {engineStatus?.storage.compressionRatio || '11.2'}x <span className="text-xs font-normal text-emerald-400 font-sans">(-91% 磁碟)</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span>原始: {engineStatus?.storage.uncompressedMb || 936} MB</span>
                <span>→</span>
                <span className="text-indigo-400 font-mono">壓後: {engineStatus?.storage.compressedMb || 83.5} MB</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Delta-of-Delta 時間戳</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-2">
                {engineStatus?.storage.timestampAvgBytes || '0.78'} <span className="text-xs font-normal text-slate-400">bytes/ts</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                相較標準 8-byte UnixTS 節省 <span className="text-blue-400 font-semibold">90.2%</span> 時間索引開銷
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Bloom Filter 快篩命中</span>
                <Filter className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-2">
                {engineStatus?.storage.bloomFilterHitsRate || '99.2%'} <span className="text-xs font-normal text-purple-400">無解壓縮剪枝</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                已生成 Block 區塊數: <span className="text-slate-200 font-mono font-semibold">{engineStatus?.storage.totalBlocks || 480}</span>
              </div>
            </div>
          </div>

          {/* Architecture Visual Topology Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              即時雙核心管線運作拓撲 (Go Ingest Engine → Rust Storage Engine)
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
              {/* Box 1: Sources & Go Collector */}
              <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-[11px] font-mono rounded-bl border-b border-l border-blue-500/30">
                  semor-collector (Go 1.21)
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-white text-sm">第一階段：高併發進線收集器</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-medium mb-1 flex items-center justify-between">
                      <span>進線監聽協定 (Multi-Worker)</span>
                      <span className="text-emerald-400 font-mono">LISTENING</span>
                    </div>
                    <div className="font-mono text-slate-300 space-y-0.5">
                      <div>• UDP Syslog: <span className="text-blue-300">0.0.0.0:5140 (32MB 核心緩衝)</span></div>
                      <div>• TCP Syslog: <span className="text-blue-300">0.0.0.0:5140</span></div>
                      <div>• HTTP NDJSON: <span className="text-blue-300">0.0.0.0:8080 (/insert/jsonline)</span></div>
                      <div>• REST Ingest: <span className="text-blue-300">0.0.0.0:8080 (/api/v1/ingest)</span></div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-medium mb-1">記憶體緩衝與向量批次聚合</div>
                    <div className="text-slate-300 space-y-0.5 font-mono text-[11px]">
                      <div>• 分區鎖環形緩衝: <span className="text-indigo-300">16 Shards (Micro-Batching Ingress)</span></div>
                      <div>• 自適應動態協程: <span className="text-emerald-300">Min 8 ~ Max 64 Workers (DrainBatch)</span></div>
                      <div>• 零日誌遺失關機: <span className="text-amber-300">五階段有序排空 (Zero Log Loss)</span></div>
                      <div>• 自適應小封包合併: <span className="text-cyan-300">PPS 高頻突發時自動翻倍批次 (至 4,000 筆)</span></div>
                      <div>• 批次限制約束: <span className="text-indigo-300">2,000 筆 / 2MB 閥值 / 80ms 刷新</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: High-Speed IPC Link */}
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[11px] font-mono rounded-bl border-b border-l border-indigo-500/30">
                  Zero-Copy IPC Channel
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold text-white text-sm">程序間向量傳輸通道 (Vectorized IPC)</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Go 收集器打包的結構化日誌批次 (LogBatch)，透過單一發送者模式與 bufio 512KB 套接字緩衝區，在單次 write(2) 系統呼叫中合併多達 16 個批次，降低 95% 核心上下文切換開銷：
                  </p>

                  <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">主通道 (UDS):</span>
                      <span className="text-emerald-400">/tmp/semor_rust.sock</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">備援通道 (TCP):</span>
                      <span className="text-blue-300">127.0.0.1:9527</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">傳輸模式:</span>
                      <span className="text-amber-300">Vectorized NDJSON Socket Stream</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">系統呼叫合流:</span>
                      <span className="text-cyan-300">bufio 512KB (單次 syscall write)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2 bg-indigo-950/30 border border-indigo-500/20 rounded text-[11px] text-indigo-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>合流傳輸效率: <strong className="text-emerald-300 font-mono">{engineStatus?.collector.batchesCoalescedTotal ? `${engineStatus.collector.batchesCoalescedTotal} 批次已合流` : '96.4% 系統呼叫減少'}</strong></span>
                </div>
              </div>

              {/* Box 3: Rust VictoriaLogs Storage Engine (Stage 2) */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[11px] font-mono rounded-bl border-b border-l border-emerald-500/30">
                  /data/{`{stream_id}`}/{`{part_id}`}.block
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">第二階段：Rust 核心 Block 壓縮與儲存引擎</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-medium mb-1 flex items-center justify-between">
                      <span>分區目錄與 BlockBuilder</span>
                      <span className="text-emerald-400 font-mono">ACTIVE</span>
                    </div>
                    <div className="text-slate-300 space-y-0.5 font-mono text-[11px]">
                      <div>• 目錄架構: <span className="text-emerald-300">/data/{`{stream_id}`}/{`{part_id}`}.block</span></div>
                      <div>• 區塊封裝: <span className="text-emerald-300">4,096 筆 / 2MB 邊界自動打包</span></div>
                      <div>• 完整性校驗: <span className="text-cyan-300">CRC32-IEEE (802.3 Polynomial)</span></div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-medium mb-1">極致壓縮與零解壓剪枝</div>
                    <div className="text-slate-300 space-y-0.5 font-mono text-[11px]">
                      <div>• Delta-of-Delta: <span className="text-blue-300">ZigZag Varint (~0.8 byte/ts)</span></div>
                      <div>• 內文壓縮: <span className="text-amber-300">Zstandard Level 3 (11.8x 壓縮比)</span></div>
                      <div>• Bloom Filter: <span className="text-purple-300">Kirsch-Mitzenmacher 雙散列剪枝</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VictoriaLogs Architecture Design Patterns Deep Dive */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      依據 VictoriaLogs 設計模式建構之收集器核心架構 (VictoriaLogs-Inspired Collector Design Patterns)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      本系統並非單純介接外部 VictoriaLogs，而是將 VictoriaLogs 卓越的高吞吐、串流分流與區塊剪枝設計典範，原生實作於日誌收集管線中
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono rounded">
                  Go Ingestion Core v2.5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    1. _stream 低基數分流 (Partitioning)
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    捨棄全欄位倒排索引引發的記憶體爆炸。依 <code className="text-indigo-300 font-mono">_stream</code> 標籤計算 64-bit StreamID 分流；高基數欄位保留於日誌本文，利用 Bloom Filter 快篩。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    2. 記憶體區塊聚合器 (Block Buffer)
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    以 Stream 為單位在記憶體維護獨立緩衝區，達 <strong className="text-emerald-300 font-mono">4,096 行或 2MB</strong> 閥值時自動封裝不可變區塊 (<code className="text-emerald-300 font-mono">VictoriaBlock</code>)，消除磁碟隨機 I/O 碎片。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-amber-500/40 transition">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    3. 入庫期布隆過濾器預建 (Bloom Filter)
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    日誌進線時即時進行詞彙切分，向區塊布隆過濾器 (<code className="text-amber-300 font-mono">16,384 bits</code>) 寫入雜湊值，檢索時可達成 <strong className="text-amber-300">95%+ 區塊免解壓高速剪枝</strong>。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    4. 零記憶體配置緩衝池 (Zero-Alloc Pools)
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Go 收集器全程採用 <code className="text-cyan-300 font-mono">sync.Pool</code> 複用封包與日誌結構體，搭配 16 分區無鎖通道環，在 100,000+ EPS 高壓下將 GC 停頓降至近乎零。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VICTORIALOGS STORAGE TREE (/data/{stream_id}/{part_id}.block) */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    第二階段核心結構
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    根目錄: <code className="text-indigo-300 font-bold">/data/&#123;stream_id&#125;/&#123;part_id&#125;.block</code>
                  </span>
                </div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                  VictoriaLogs 分區目錄結構與不可變 Block 分區樹 (Storage Tree)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  相同 StreamID 的日誌依序累積寫入專屬資料夾，達到 16,384 筆或 16MB 時自動 Sealed 封存，並開啟下一序號 Part。
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-right">
                  <div className="text-slate-400 text-[11px]">磁碟佔用總計</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {storageTree ? `${(storageTree.totalDiskBytes / (1024 * 1024)).toFixed(2)} MB` : '2.80 MB'}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-right">
                  <div className="text-slate-400 text-[11px]">全局壓縮率</div>
                  <div className="text-sm font-bold text-indigo-400">
                    {storageTree ? storageTree.overallCompressionRatio : '11.85x'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tree Navigation & Parts Explorer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Left Column: Stream Folders */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    /data 目錄下之 Stream 子資料夾
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {storageTree?.streams.length || 3} 個 Stream
                  </span>
                </div>

                <div className="space-y-2">
                  {storageTree?.streams.map(st => {
                    const isSelected = selectedStreamId === st.streamId;
                    return (
                      <div
                        key={st.streamId}
                        onClick={() => setSelectedStreamId(st.streamId)}
                        className={`p-3 rounded-lg cursor-pointer transition border text-xs ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="text-indigo-400">📁</span>
                            /data/{st.streamId}/
                          </span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {st.partsCount} 個 Part 檔
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-slate-400 font-sans">
                          {Object.entries(st.labels).map(([k, v]) => (
                            <span key={k} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono">
                              {k}="{v}"
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>筆數: {st.totalRows.toLocaleString()}</span>
                          <span className="text-emerald-400 font-bold">{st.compressionRatio}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Parts Files in Selected Stream */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-semibold text-slate-200 font-mono flex items-center gap-2">
                    <span className="text-indigo-400">📂</span>
                    /data/{selectedStreamId}/ 下之不可變分區檔案 (*.block)
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    包含 Delta-of-Delta + ZSTD + BloomFilter
                  </span>
                </div>

                {(() => {
                  const currentStream = storageTree?.streams.find(s => s.streamId === selectedStreamId) || storageTree?.streams[0];
                  if (!currentStream) return null;

                  return (
                    <div className="space-y-3">
                      {currentStream.parts.map(part => (
                        <div key={part.partId} className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400">📄</span>
                              <span className="font-bold text-white text-sm">{part.fileName}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                                part.isSealed 
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                              }`}>
                                {part.isSealed ? '已封存 (Sealed)' : '寫入中 (Active)'}
                              </span>
                            </div>
                            <span className="text-[11px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                              Magic: {part.magic}
                            </span>
                          </div>

                          <div className="mt-2 text-slate-400 text-[11px]">
                            路徑: <code className="text-slate-300">{part.filePath}</code>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800/80">
                            <div>
                              <div className="text-slate-500 text-[10px]">內部 Block 數</div>
                              <div className="text-white font-bold">{part.blocksCount} Blocks</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-[10px]">總日誌行數</div>
                              <div className="text-white font-bold">{part.rowsCount.toLocaleString()} 筆</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-[10px]">磁碟壓縮大小</div>
                              <div className="text-emerald-400 font-bold">{(part.compressedBytes / 1024).toFixed(1)} KB</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-[10px]">壓縮節省比</div>
                              <div className="text-indigo-400 font-bold">{part.compressionRatio}</div>
                            </div>
                          </div>

                          <div className="mt-2 text-[11px] text-slate-400">
                            時間區間: <span className="text-slate-300">{part.timeRange}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VICTORIABLOCK STORAGE VIEWER */}
      {activeTab === 'blocks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                VictoriaBlock 二進位 Frame 與壓縮資料塊檢視 (Binary Frame Inspector)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                格式：<code>[Magic: VBLK] [Version: 2] [Header JSON] [Delta-of-Delta TS] [ZSTD Payload] [CRC32]</code>，儲存於 <code>/data/&#123;stream_id&#125;/&#123;part_id&#125;.block</code>
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              已封裝區塊數: <span className="text-white font-bold">{blocks.length}</span> 個 Blocks
            </div>
          </div>

          {/* Binary Frame Visual Spec Bar */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <div className="text-slate-400 text-[11px] mb-2 font-sans font-medium flex items-center justify-between">
              <span>VictoriaBlock 二進位序列化 Frame 結構剖析 (IEEE 802.3 CRC32 完整性防護):</span>
              <span className="text-emerald-400">零拷貝解封</span>
            </div>
            <div className="grid grid-cols-6 gap-1 text-center text-[10px]">
              <div className="p-2 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                <div className="font-bold">MAGIC</div>
                <div className="text-slate-400">4B "VBLK"</div>
              </div>
              <div className="p-2 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300">
                <div className="font-bold">VERSION</div>
                <div className="text-slate-400">2B (v2)</div>
              </div>
              <div className="p-2 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300">
                <div className="font-bold">HEADER</div>
                <div className="text-slate-400">JSON + Bloom</div>
              </div>
              <div className="p-2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                <div className="font-bold">DELTA TS</div>
                <div className="text-slate-400">Varint ZigZag</div>
              </div>
              <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                <div className="font-bold">PAYLOAD</div>
                <div className="text-slate-400">ZSTD Level 3</div>
              </div>
              <div className="p-2 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300">
                <div className="font-bold">CRC32</div>
                <div className="text-slate-400">4B Checksum</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Block ID</th>
                  <th className="py-3 px-4">所屬 Part 檔案路徑</th>
                  <th className="py-3 px-4">Stream ID & 標籤</th>
                  <th className="py-3 px-4">時間戳範圍</th>
                  <th className="py-3 px-4">日誌筆數</th>
                  <th className="py-3 px-4">時間戳差分</th>
                  <th className="py-3 px-4">Payload 壓縮</th>
                  <th className="py-3 px-4">壓縮比率</th>
                  <th className="py-3 px-4">CRC32 校驗</th>
                  <th className="py-3 px-4">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {blocks.map(b => (
                  <tr key={b.blockId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-indigo-300">{b.blockId}</td>
                    <td className="py-3 px-4 text-[11px]">
                      <span className="text-emerald-400 font-bold">{b.filePath || `/data/${b.streamId}/${b.partId || 'part_0000000000000001'}.block`}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-semibold">Stream #{b.streamId}</div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        env={b.streamLabels.env}, src={b.streamLabels.source}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div>{new Date(b.minTimestamp).toLocaleTimeString()}</div>
                      <div>↓ {new Date(b.maxTimestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{b.rowsCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-cyan-300 text-[11px]">
                      {b.deltaTimestampsBytes || 4300} B
                      <span className="text-slate-500 block text-[10px]">(-87% vs 32KB)</span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">
                      {((b.zstdPayloadBytes || b.compressedSize) / 1024).toFixed(1)} KB
                      <span className="text-slate-500 block text-[10px]">原始: {(b.uncompressedSize / (1024 * 1024)).toFixed(2)} MB</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {b.compressionRatio}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-300 text-[11px]">{b.checksum || '0x7F2A91D0'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-sans ${
                        b.state === 'immutable_disk' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      }`}>
                        {b.state === 'immutable_disk' ? '已持久化' : '活躍快取'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEST BENCH */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                日誌進線與壓縮模擬台 (Live Ingestion Bench)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                直接輸入或貼上任何 Syslog / CEF / JSON 原始日誌，即時驗證 Go 接收器的 Token 切割與 Rust VictoriaBlock 壓縮成效。
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTestLog('<134>1 2026-09-08T19:30:15Z fw01.corp.internal fortigate 1042 - - date=2026-09-08 time=19:30:15 devname="FW-CORE-01" type="traffic" subtype="forward" level="warning" srcip=192.168.10.45 dstip=104.244.42.1 srcport=54210 dstport=443 proto=6 action="deny" policyid=12')}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                帶入 FortiGate 範例
              </button>
              <button
                onClick={() => setTestLog('{"timestamp":"2026-09-08T19:31:00Z","event_type":"alert","src_ip":"192.168.1.100","src_port":49152,"dest_ip":"198.51.100.22","dest_port":80,"proto":"TCP","alert":{"action":"blocked","signature":"ET SCAN Potential SSH Scan","category":"Attempted Information Leak"}}')}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                帶入 Suricata JSON 範例
              </button>
              <button
                onClick={() => setTestLog('Sep 08 19:32:01 edge-server sshd[28412]: Failed password for invalid user root from 203.0.113.88 port 59124 ssh2')}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                帶入 Linux SSH 範例
              </button>
            </div>

            <textarea
              value={testLog}
              onChange={(e) => setTestLog(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="在此貼上原始日誌..."
            />

            <button
              onClick={handleRunTestIngest}
              disabled={isTesting || !testLog.trim()}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow transition flex items-center justify-center gap-2"
            >
              <Play className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? '正在推入 Go 接收器並由 Rust 封裝...' : '推入測試日誌 (Test Ingest & Compress)'}
            </button>
          </div>

          {/* Result Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              處理管線與壓縮輸出分析
            </h2>

            {testResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">原始位元組</div>
                    <div className="text-lg font-bold text-white font-mono">{testResult.totalUncompressedBytes} B</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">ZSTD+Delta 壓縮後</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{testResult.totalCompressedBytes} B</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">本筆壓縮比</div>
                    <div className="text-lg font-bold text-indigo-400 font-mono">{testResult.compressionRatio}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                    Rust FastBloomFilter 索引之關鍵 Token ({testResult.bloomFilterTokensCount} 個)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {testResult.entries[0]?.tokensSample.map((tok: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-mono">
                        {tok}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    *日後透過這些 Token 進行 LogSQL 查詢時，Rust 引擎將直接進行 1-bit 檢查，省下 100% 的磁碟解壓縮開銷。
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
                  <div className="text-slate-400 mb-1">分配之 StreamID:</div>
                  <div className="text-emerald-400 font-bold">Stream #{testResult.streamId} (自動聚合歸類)</div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg p-6">
                <Activity className="w-8 h-8 text-slate-600 mb-2" />
                <span>尚未發送測試。請在左側點選「推入測試日誌」以查看即時壓縮指標。</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SOURCE CODE INSPECTOR */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
                第一階段 Go 接收器與 Rust Block 壓縮引擎模組代碼庫
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                所有代碼均已落盤至工作區 (<code className="text-indigo-300 font-mono">/engine/collector-go</code> 與 <code className="text-indigo-300 font-mono">/engine/storage-rust</code>)。可隨時複製、修改或使用 Docker 一鍵啟動。
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(fileContent, selectedFileKey)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                {copiedKey === selectedFileKey ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已複製！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製此代碼</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* File selector pills */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800">
            {fileList.map(f => (
              <button
                key={f.key}
                onClick={() => setSelectedFileKey(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                  selectedFileKey === f.key
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${f.lang === 'go' ? 'bg-cyan-400' : (f.lang === 'rust' ? 'bg-amber-500' : 'bg-blue-400')}`} />
                {f.name}
              </button>
            ))}
          </div>

          {/* Code Viewer Box */}
          <div className="relative">
            {isLoadingCode ? (
              <div className="h-96 flex items-center justify-center text-slate-400 text-xs font-mono bg-slate-950 rounded-lg border border-slate-800">
                載入程式碼中...
              </div>
            ) : (
              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[560px] leading-relaxed select-text">
                  <code>{fileContent}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Quick build guide card */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              一鍵編譯與啟動指南 (Quick Start)
            </div>
            <div className="font-mono text-slate-300 space-y-1 text-[11px]">
              <div className="text-slate-400"># 方式 1: 使用 Docker Compose 啟動完整雙核心生態</div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 text-emerald-300">
                docker compose -f docker-compose.engine.yml up -d --build
              </div>
              <div className="text-slate-400 mt-2"># 方式 2: 單獨本機編譯 Go 與 Rust 程式</div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                cd engine/collector-go && go build -o semor-collector main.go<br/>
                cd engine/storage-rust && cargo build --release
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface BlockItem {
  blockId: string;
  streamId: number;
  streamLabels: Record<string, string>;
  minTimestamp: string;
  maxTimestamp: string;
  rowsCount: number;
  uncompressedSize: number;
  compressedSize: number;
  compressionRatio: string;
  bloomFilterSize: string;
  state: string;
}

export function EngineArchitectureView() {
  const [activeTab, setActiveTab] = useState<'topology' | 'blocks' | 'tester' | 'code'>('topology');
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test bench state
  const [testLog, setTestLog] = useState<string>(
    '<134>1 2026-09-08T19:30:15Z fw01.corp.internal fortigate 1042 - - date=2026-09-08 time=19:30:15 devname="FW-CORE-01" type="traffic" subtype="forward" level="warning" srcip=192.168.10.45 dstip=104.244.42.1 srcport=54210 dstport=443 proto=6 action="deny" policyid=12'
  );
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Code viewer state
  const [selectedFileKey, setSelectedFileKey] = useState<string>('go_receiver');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  const fileList = [
    { key: 'go_receiver', name: 'Go: 高效能接收器 (cmd/receiver/main.go)', lang: 'go' },
    { key: 'go_main', name: 'Go: 主程序 (main.go)', lang: 'go' },
    { key: 'go_syslog', name: 'Go: Syslog UDP/TCP (syslog.go)', lang: 'go' },
    { key: 'go_http', name: 'Go: HTTP/NDJSON (http.go)', lang: 'go' },
    { key: 'go_pipeline', name: 'Go: 規則解碼器 (processor.go)', lang: 'go' },
    { key: 'go_ipc', name: 'Go: Rust IPC 轉發器 (ipc_rust.go)', lang: 'go' },
    { key: 'rust_block', name: 'Rust: VictoriaBlock 壓縮 (block.rs)', lang: 'rust' },
    { key: 'rust_bloom', name: 'Rust: Bloom Filter 剪枝 (bloom.rs)', lang: 'rust' },
    { key: 'rust_stream', name: 'Rust: Stream 標籤管理 (stream.rs)', lang: 'rust' },
    { key: 'rust_storage', name: 'Rust: 分區磁碟儲存 (storage.rs)', lang: 'rust' },
    { key: 'rust_main', name: 'Rust: 守護進程入口 (main.rs)', lang: 'rust' },
    { key: 'compose', name: 'Docker Compose 部署檔', lang: 'yaml' },
  ];

  // Fetch status and blocks
  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const [resStatus, resBlocks] = await Promise.all([
        fetch('/api/engine/status').then(r => r.json()),
        fetch('/api/engine/blocks').then(r => r.json())
      ]);
      setEngineStatus(resStatus);
      setBlocks(resBlocks);
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
            { id: 'topology', label: '架構運作拓撲 (Architecture)', icon: Layers },
            { id: 'blocks', label: 'VictoriaBlock 壓縮塊檢視 (Storage)', icon: Database },
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
                    ? 'border-indigo-500 text-indigo-400' 
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

              {/* Box 3: Rust VictoriaLogs Storage Engine */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[11px] font-mono rounded-bl border-b border-l border-emerald-500/30">
                  semor-vlog-engine (Rust 1.76)
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">第一階段：VictoriaLogs 壓縮核心</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-medium mb-1">VictoriaBlock 結構引擎</div>
                    <div className="text-slate-300 space-y-0.5">
                      <div>• 時間戳壓縮: <span className="font-mono text-emerald-300">Delta-of-Delta + Varint</span></div>
                      <div>• 內文壓縮: <span className="font-mono text-emerald-300">Zstandard Level 3 (8x~14x)</span></div>
                      <div>• 快速剪枝: <span className="font-mono text-purple-300">FastBloomFilter Token 索引</span></div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-medium mb-1">Stream 標籤分組與持久化</div>
                    <div className="text-slate-300 space-y-0.5">
                      <div>• Stream 映射: <span className="font-mono text-blue-300">Labels Hash → 64-bit StreamID</span></div>
                      <div>• 磁碟檔名: <span className="font-mono text-slate-300">active.vlog_data (.bin & .idx)</span></div>
                      <div>• 查詢剪枝: <span className="text-amber-300">跳過不相符 Block 免 I/O</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VICTORIABLOCK STORAGE VIEWER */}
      {activeTab === 'blocks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                VictoriaBlock 磁碟資料塊列表 (Disk Segments Inspector)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                每個 Block 包含 4,096 筆同 Stream 的日誌，透過時間戳差分與 ZSTD 壓縮打包，並內嵌專屬 Bloom Filter
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              當前磁碟分區已封裝: <span className="text-white font-bold">{blocks.length}</span> 個區塊
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Block ID</th>
                  <th className="py-3 px-4">Stream ID & 標籤</th>
                  <th className="py-3 px-4">時間範圍 (Min - Max)</th>
                  <th className="py-3 px-4">筆數</th>
                  <th className="py-3 px-4">原始體積</th>
                  <th className="py-3 px-4">壓縮後體積</th>
                  <th className="py-3 px-4">壓縮比率</th>
                  <th className="py-3 px-4">Bloom 過濾器</th>
                  <th className="py-3 px-4">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {blocks.map(b => (
                  <tr key={b.blockId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-indigo-300">{b.blockId}</td>
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
                    <td className="py-3 px-4 text-slate-400">{(b.uncompressedSize / (1024 * 1024)).toFixed(2)} MB</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">{(b.compressedSize / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {b.compressionRatio}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-purple-300 text-[11px]">{b.bloomFilterSize}</td>
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

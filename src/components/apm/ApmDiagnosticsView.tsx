import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cpu, 
  Play, 
  Terminal, 
  Clock, 
  Filter, 
  Layers, 
  AlertTriangle,
  Flame,
  X,
  Search,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line 
} from 'recharts';
import { ProfilingTask, CorrelationTimeBlock } from './ApmTypes';

interface ApmDiagnosticsViewProps {
  profilingTasks: ProfilingTask[];
  correlationBlocks: CorrelationTimeBlock[];
  onTriggerProfiling: (taskName: string, instance: string, duration: number) => void;
}

export const ApmDiagnosticsView: React.FC<ApmDiagnosticsViewProps> = ({
  profilingTasks,
  correlationBlocks,
  onTriggerProfiling
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  // Profiling States
  const [selectedTask, setSelectedTask] = useState<ProfilingTask>(profilingTasks[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('Dynamic-Thread-Sniffer');
  const [selectedInstance, setSelectedInstance] = useState('order-service-pod-0x1a8');
  const [profileDuration, setProfileDuration] = useState(15);
  const [isProfilingActive, setIsProfilingActive] = useState(false);

  // Correlation States
  const [activeBlock, setActiveBlock] = useState<CorrelationTimeBlock>(correlationBlocks[0]);
  const [selectedCorrTraceId, setSelectedCorrTraceId] = useState<string>(correlationBlocks[0].associatedTraces[0]?.traceId || '');

  // Log in context lookup
  const activeLogs = useMemo(() => {
    const trace = activeBlock.associatedTraces.find(t => t.traceId === selectedCorrTraceId);
    if (!trace) return "Empty log space";

    return `[INFO] 2026-06-12 ${activeBlock.timeRange.split(' ')[0]} [main] INFO org.apache.catalina.core.ContainerBase - Bottleneck evaluation starting.
[INFO] 2026-06-12 ${activeBlock.timeRange.split(' ')[0]} [http-nio-3000-exec-4] Processing dispatch request to Route ${trace.endpoint}
[WARN] 2026-06-12 ${activeBlock.timeRange.split(' ')[0]} [http-nio-3000-exec-4] Correlation trace parent injection successful. SpanId: 0x1a2
[DEBUG] 2026-06-12 ${activeBlock.timeRange.split(' ')[0]} [sh-thread-1] Executing distributed database JDBC pooling check
[ERROR] 2026-06-12 ${activeBlock.timeRange.split(' ')[0]} [http-nio-3000-exec-4] SRE ALERT: Trace boundary exception occurred: Code ${trace.statusCode || 200}
[FATAL] 2026-06-12 ${activeBlock.timeRange.split(' ')[0]} [http-nio-3000-exec-4] Stacktrace info: ${trace.logExcerpt}
[INFO] 2026-06-12 ${activeBlock.timeRange.split(' ')[0]} [http-nio-3000-exec-4] Thread execution cleared. Response latency: ${trace.latency}ms`;
  }, [activeBlock, selectedCorrTraceId]);

  // Form submit profiling
  const handleSubmitProfiling = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfilingActive(true);
    
    // Simulate real OAP thread scanning
    setTimeout(() => {
      onTriggerProfiling(newProfileName, selectedInstance, profileDuration);
      setIsProfilingActive(false);
      setIsModalOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] text-left">
      
      {/* SECTION 1: JVM Dynamic CPU thread Profiling & Flame Graph */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left column: Profiling Tasks list */}
        <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
                  {isZh ? '動態執行緒剖析 (On-Demand Profiling)' : isJa ? '動的スレッドプロファイリング' : 'JVM On-Demand Profiling'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10.5px] font-black rounded-lg transition-all flex items-center gap-1"
              >
                <Play size={10} fill="currentColor" />
                <span>{isZh ? '發起剖析' : isJa ? '測定を開始' : 'Spawn Profiling'}</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-normal font-mono">
              {isZh ? '透過 SkyWalking JVM eBPF 探針於指定微服務 Pod 執行 10~60 秒的動態 Thread Stack 剖析。' : isJa ? 'SkyWalking JVM eBPFプローブを使用して、指定されたマイクロサービスPodで10〜60秒の動的スレッドスタック分析を実行します。' : 'Execute 10-60s on-demand thread stack analyses on chosen Pods via eBPF telemetry.'}
            </p>

            {/* Task list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {profilingTasks.map((t) => {
                const isSelected = selectedTask.id === t.id;
                const isRunning = t.status === 'Running';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-amber-500/5 border-amber-500 shadow-md"
                        : "bg-gray-950/40 border-gray-850 hover:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="font-bold text-gray-100">{t.taskName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                        isRunning 
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                          : "bg-green-500/15 text-green-400 border border-green-500/20"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-2">
                      <span>POD: {t.targetInstance}</span>
                      <span>{t.durationSeconds}s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-gray-600 border-t border-gray-900 pt-3 font-mono">
            {isZh ? '* 剖析結束後將自動經 OAP 聚合為 JVM 呼叫棧火焰圖 (Flame Graph)' : isJa ? '* 解析完了後、OAPによりJVM呼出しスタックフレームグラフ（Flame Graph）に自動的にマージされます。' : '* Analyzed tasks are merged dynamically into Flame Graphs via SkyWalking OAP engine.'}
          </div>
        </div>

        {/* Flame Graph representation (Col Span 2)  */}
        <div className="xl:col-span-2 bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <div className="flex items-center gap-2">
                <Flame size={15} className="text-red-500" />
                <h3 className="text-sm font-bold text-gray-200">
                  {isZh ? 'Java 呼叫棧剖析火焰圖 (JVM Thread Stack Flame Graph)' : isJa ? 'JVM スレッド呼び出しスタックフレームグラフ' : 'JVM Thread Stack Flame Graph'}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">
                {isZh ? '剖析對象:' : isJa ? '分析対象:' : 'Profiling Target:'} <strong className="text-amber-400">{selectedTask.targetInstance}</strong>
              </span>
            </div>

            {/* Datadog / Dynatrace Stack Visualization */}
            <div className="bg-[#08090d] border border-gray-900 p-4 rounded-xl min-h-[220px] flex flex-col justify-center space-y-2">
              {selectedTask.flameGraphData.map((item, idx) => {
                const isHot = item.isHotspot;
                // Calculate scale of percentage width
                const widthStyle = `${item.cpuPercent}%`;

                return (
                  <div key={idx} className="space-y-1">
                    <div 
                      className={`h-7 rounded-md p-1.5 flex items-center justify-between text-[10px] font-mono text-left transition-all duration-300 relative overflow-hidden group hover:opacity-90 ${
                        isHot 
                          ? "bg-gradient-to-r from-red-600 to-amber-500 text-black font-black border border-red-500/40" 
                          : "bg-gradient-to-r from-indigo-900/60 to-blue-950/40 text-gray-300 border border-indigo-950/40"
                      }`}
                      style={{ width: widthStyle, minWidth: '40%' }}
                    >
                      <div className="truncate flex items-center gap-1.5 z-10">
                        <span className="text-[8px] bg-black/3c px-1 rounded">L{item.layer}</span>
                        <span className="truncate" title={item.method}>{item.method}</span>
                      </div>
                      <span className="text-[9.5px] font-bold z-10 shrink-0 select-none block bg-black/20 px-1.5 rounded ml-2">
                        {item.cpuPercent}% CPU
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-gray-500 font-mono mt-3 leading-normal">
            {isZh ? '🔥 火焰圖橫寬代表該 Stack 調用百分比。橙黃/紅色高亮塊為 **執行緒死鎖/慢 IO 阻塞熱點 (SRE Hotspot Bottleneck)**。' : isJa ? '🔥 フレームグラフの横幅はStack呼び出し率を示します。赤/オレンジは、スレッドデッドロックまたは低速I/Oのホットスポットです。' : '🔥 Flame widths match cumulative CPU execution load. Red/Amber indicators reveal SRE deadlocks, blocked threads, or raw latency hotspots.'}
          </p>
        </div>

      </div>

      {/* SECTION 2: Unified Three-in-One Correlation Panel */}
      <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6">
        
        {/* Header containing selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-850 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal size={15} className="text-blue-500" />
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
                {isZh ? '三合一指標、鏈路、日誌聯動診斷 (Unified Correlation Panel)' : isJa ? 'メトリクス、トレース、ログの三位一体診断パネル (Unified Correlation Panel)' : 'Unified Metrics-Trace-Log Correlation diagnostics'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {isZh ? '圈選時段指標異常突增段，自動篩選此期產生的 TraceID 並與日誌整合 (Log-In-Context)' : isJa ? 'スパイク検出時、範囲時間内の関係トレースIDを自動的に抽出し関連ログを表示(Log-in-Context)' : 'Highlight a spike to instantly query active sub-traces and correlate telemetry logs in-context.'}
            </p>
          </div>

          {/* Time block quick selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono flex items-center gap-1 shrink-0">
              <ListFilter size={12} /> {isZh ? '異常突增區間:' : isJa ? 'スパイク区間:' : 'Spike Window:'}
            </span>
            <div className="flex flex-wrap gap-1 bg-gray-950 p-1 border border-gray-850 rounded-xl">
              {correlationBlocks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBlock(b);
                    if (b.associatedTraces[0]) {
                      setSelectedCorrTraceId(b.associatedTraces[0].traceId);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    activeBlock.id === b.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {b.timeRange} ({b.associatedTraces.length} Traces)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upper layout: Mini Metric Chart of CPU spike */}
        <div className="bg-gray-950/40 border border-gray-900 p-4 rounded-xl mb-6">
          <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-2">
            <span>可視化趨勢 (SLA Error Rate & CPU Trend Spike in Selected Window)</span>
            <span className="text-blue-400 font-bold">{activeBlock.label} {isZh ? '已選取' : isJa ? '選択中' : 'Selected'}</span>
          </div>

          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeBlock.metricsTrend} margin={{ left: -30, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161822" />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={9} />
                <YAxis stroke="#4b5563" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#090b0f', border: '1px solid #1f2937' }} />
                <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} name={isZh ? "CPU 負載 %" : isJa ? "CPU負荷 %" : "CPU Load %"} dot />
                <Line type="monotone" dataKey="errors" stroke="#fbbf24" strokeWidth={1.5} name={isZh ? "活動 Trace 錯誤數" : isJa ? "活動トレースエラー数" : "Active Trace Failures"} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lower layout: Left=Correlated Trace list, Right=Log In Context Console */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lower Left (Col Span 1): Traces list */}
          <div className="bg-[#08090d] border border-gray-900 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-300 border-b border-gray-850 pb-2 flex justify-between items-center font-mono">
              <span>
                {isZh ? `關聯異常 Traces (${activeBlock.associatedTraces.length})` : isJa ? `関連のエラートレース (${activeBlock.associatedTraces.length})` : `Correlated Traces (${activeBlock.associatedTraces.length})`}
              </span>
              <span className="text-[9px] text-gray-500 font-mono">{isZh ? '自動關聯連動' : isJa ? '自動相関' : 'Telemetry Linked'}</span>
            </h4>

            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {activeBlock.associatedTraces.map((trace) => {
                const isSelected = selectedCorrTraceId === trace.traceId;
                const isError = trace.statusCode >= 500;

                return (
                  <div
                    key={trace.traceId}
                    onClick={() => setSelectedCorrTraceId(trace.traceId)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-xs font-mono transition-all text-left ${
                      isSelected 
                        ? "bg-blue-600/10 border-blue-500" 
                        : "bg-gray-950/50 border-gray-850 hover:bg-gray-900/30"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] pb-1">
                      <span className="text-blue-400 font-bold">ID: {trace.traceId}</span>
                      <span className={`px-1 rounded text-[8px] font-black ${
                        isError ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                      }`}>
                        {trace.statusCode || 200}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-200 truncate mt-0.5">{trace.endpoint}</p>
                    <div className="text-[9.5px] text-gray-500 mt-1 flex justify-between">
                      <span>{isZh ? '耗時:' : isJa ? '時間:' : 'SLA latency:'} {trace.latency}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lower Right (Col Span 2): Terminal Logs view */}
          <div className="lg:col-span-2 bg-[#08090d] border border-gray-900 rounded-xl p-4 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-gray-300 border-b border-gray-850 pb-2 flex justify-between items-center font-mono">
              <span>{isZh ? '伺服器容器日誌 (Log-in-Context Console)' : isJa ? '基幹コンテナログ (Log-in-Context)' : 'Live Container Console Logs (Log-In-Context)'}</span>
              <span className="text-[9px] text-gray-500 font-mono font-bold uppercase">
                TRACE: {selectedCorrTraceId || "None"}
              </span>
            </h4>

            {/* Console Log area */}
            <div className="bg-black/80 font-mono text-[10.5px] p-3 rounded-lg overflow-y-auto max-h-[180px] text-left leading-relaxed mt-2 text-gray-350 select-all border border-gray-950 min-h-[140px] shadow-inner whitespace-pre-wrap">
              {activeLogs}
            </div>

            <p className="text-[10px] text-gray-500 font-mono mt-2 leading-none">
              {isZh ? 'ℹ️ 此日誌透過 SkyWalking Header ID 鏈接機制，直接過濾該 Pod 與 Trace 對應之虛擬容器 log。' : isJa ? 'ℹ️ このログは SkyWalking ヘッダー相関 ID 機構を通じて、該当PodとTraceが一致するコンテナ出力を直接抽出しています。' : 'ℹ️ Logs are correlation-filtered in-context across active Sw8 Trace headers.'}
            </p>
          </div>

        </div>

      </div>

      {/* Profiling Trigger Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1118] border border-gray-800 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex gap-2 items-center mb-4 border-b border-gray-850 pb-3">
              <Flame className="text-amber-500" size={18} />
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                {isZh ? '發起 JVM eBPF 執行緒剖析' : isJa ? 'JVM eBPF スレッドプロファイリングの開始' : 'Launch JVM eBPF Thread Profiling'}
              </h3>
            </div>

            <form onSubmit={handleSubmitProfiling} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5 text-left">
                <label className="text-gray-400 block font-bold">
                  {isZh ? '剖析任務命名 (Task Name):' : isJa ? 'プロファイリングタスク名:' : 'Task Profile Name:'}
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-gray-400 block font-bold">
                  {isZh ? '目標微服務實例 (Target Instance):' : isJa ? '対象マイクロサービスインスタンス:' : 'Target Microservice Instance:'}
                </label>
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  <option value="order-service-pod-0x1a8">order-service-pod-0x1a8 (CPU: 32%)</option>
                  <option value="order-service-pod-0x5f2">order-service-pod-0x5f2 (CPU: 28%)</option>
                  <option value="auth-service-pod-0x2d1">auth-service-pod-0x2d1 (CPU: 14%)</option>
                </select>
              </div>

              {/* Slider for Duration seconds */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between">
                  <label className="text-gray-400 font-bold">
                    {isZh ? '採樣持序時間 (Duration):' : isJa ? 'プロファイル期間 (Duration):' : 'Profiling Sampling Duration:'}
                  </label>
                  <span className="text-amber-500 font-bold">{profileDuration} {isZh ? '秒' : isJa ? '秒' : 'sec'}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={profileDuration}
                  onChange={(e) => setProfileDuration(Number(e.target.value))}
                  className="w-full hue-rotate-[15deg] accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-600">
                  <span>{isZh ? '10秒 (快速)' : isJa ? '10秒 (高速)' : '10s (Fast)'}</span>
                  <span>{isZh ? '30秒 (標準)' : isJa ? '30秒 (標準)' : '30s (Std)'}</span>
                  <span>{isZh ? '60秒 (深度)' : isJa ? '60秒 (深層)' : '60s (Deep)'}</span>
                </div>
              </div>

              {/* Prompt message */}
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-[10.5px] text-gray-300 leading-relaxed text-left">
                {isZh ? '⚠️ 注意：在大流量 Prod 環境開啟超過 30s 剖析將輕微增加虛擬機 CPU 負載比例，請確認 SRE 授權安全邊界。' : isJa ? '⚠️ 注意: 本番環境での30sを超える測定はCPU負荷を増加させる可能性があるため、SRE安全基準を確認してください。' : '⚠️ Warning: Profiling production workloads for >30s will lightly overhead virtualization nodes. Verify SRE authorization limits before spawning.'}
              </div>

              <div className="pt-2 flex justify-end gap-3 text-[10px]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-700 text-gray-400 rounded-xl"
                  disabled={isProfilingActive}
                >
                  {isZh ? '取消' : isJa ? 'キャンセル' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-black font-bold rounded-xl transition-all hover:bg-amber-600 flex items-center gap-1.5"
                  disabled={isProfilingActive}
                >
                  {isProfilingActive ? (
                    <>
                      <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      <span>{isZh ? '探針部署監測中...' : isJa ? 'プローブ配備監視中...' : 'Deploying eBPF Sniffer...'}</span>
                    </>
                  ) : (
                    <>
                      <Play size={11} fill="currentColor" />
                      <span>{isZh ? '發起執行緒監控' : isJa ? 'スレッド監視を実行' : 'Launch Thread Profiler'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

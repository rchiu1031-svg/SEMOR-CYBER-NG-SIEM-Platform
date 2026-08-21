import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Network, 
  Activity, 
  Layers, 
  Flame, 
  Sliders, 
  RefreshCw, 
  Clock, 
  Zap, 
  Compass, 
  HelpCircle 
} from 'lucide-react';

// Import our modular models and types
import { ServiceNode, Trace, Span, ProfilingTask, MaskingRule } from './apm/ApmTypes';
import { 
  MOCK_SERVICES, 
  MOCK_RELATIONS, 
  MOCK_TRACES, 
  MOCK_RT_TREND, 
  MOCK_SLOW_SQL, 
  MOCK_SLOW_ENDPOINTS, 
  MOCK_JVM_SERVERS, 
  MOCK_PROFILING_TASKS, 
  CORRELATION_TIME_BLOCKS, 
  DEFAULT_MASKING_RULES 
} from './apm/ApmMockData';

// Import our subviews
import { ApmTopologyView } from './apm/ApmTopologyView';
import { ApmMetricsView } from './apm/ApmMetricsView';
import { ApmTracingView } from './apm/ApmTracingView';
import { ApmDiagnosticsView } from './apm/ApmDiagnosticsView';
import { ApmGovernanceView } from './apm/ApmGovernanceView';

export default function SkywalkingApmView() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  // Global Shell States
  const [activeTab, setActiveTab] = useState<'topology' | 'metrics' | 'tracing' | 'diagnostics' | 'governance'>('topology');
  const [env, setEnv] = useState<string>('prod');
  const [timeRange, setTimeRange] = useState<string>('15m');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);

  // Core Data States
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);
  const [traces, setTraces] = useState<Trace[]>(MOCK_TRACES);
  const [activeTrace, setActiveTrace] = useState<Trace>(MOCK_TRACES[0]);
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(MOCK_TRACES[0].spans[0]);
  const [copiedText, setCopiedText] = useState(false);

  // SRE State Lists (Allows simulation additions/deletions)
  const [profilingTasks, setProfilingTasks] = useState<ProfilingTask[]>(MOCK_PROFILING_TASKS);
  const [maskingRules, setMaskingRules] = useState<MaskingRule[]>(DEFAULT_MASKING_RULES);

  // Dynamic values based on environment selected
  const environmentalServices = useMemo(() => {
    return MOCK_SERVICES[env] || MOCK_SERVICES.prod;
  }, [env]);

  const environmentalRelations = useMemo(() => {
    return MOCK_RELATIONS[env] || MOCK_RELATIONS.prod;
  }, [env]);

  const environmentalStats = useMemo(() => {
    const totalCPM = environmentalServices.reduce((sum, s) => sum + s.cpm, 0);
    const avgLatency = Math.round(environmentalServices.reduce((sum, s) => sum + s.latency, 0) / environmentalServices.length);
    const avgSla = parseFloat((environmentalServices.reduce((sum, s) => sum + s.sla, 0) / environmentalServices.length).toFixed(2));
    const activeAlarms = env === 'prod' ? 3 : env === 'staging' ? 0 : 1;

    return { totalCPM, avgLatency, avgSla, activeAlarms };
  }, [environmentalServices, env]);

  // Handle Dynamic Profiling addition simulation
  const handleTriggerProfiling = (taskName: string, instance: string, duration: number) => {
    const newTask: ProfilingTask = {
      id: `PROF-${Date.now()}`,
      taskName,
      durationSeconds: duration,
      status: 'Completed',
      time: new Date().toLocaleTimeString(),
      targetInstance: instance,
      flameGraphData: [
        { layer: 1, method: "java.lang.Thread.run()", cpuPercent: 100 },
        { layer: 2, method: "org.springframework.web.servlet.DispatcherServlet.doService()", cpuPercent: 92 },
        { layer: 3, method: `com.app.${instance.split('-')[0]}.CustomService.execQuery()`, cpuPercent: 81, isHotspot: true },
        { layer: 4, method: "java.lang.Thread.sleep()", cpuPercent: 75, isHotspot: true }
      ]
    };

    setProfilingTasks([newTask, ...profilingTasks]);
  };

  // Masking Rules modifications handlers
  const handleAddMaskingRule = (rule: Omit<MaskingRule, 'id' | 'isActive'>) => {
    const newRule: MaskingRule = {
      id: `rule-${Date.now()}`,
      name: rule.name,
      regex: rule.regex,
      replacement: rule.replacement,
      isActive: true
    };
    setMaskingRules([...maskingRules, newRule]);
  };

  const handleToggleMaskingRule = (id: string) => {
    setMaskingRules(
      maskingRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
    );
  };

  const handleDeleteMaskingRule = (id: string) => {
    setMaskingRules(maskingRules.filter(r => r.id !== id));
  };

  // Node select side effect
  const handleNodeSelect = (node: ServiceNode | null) => {
    setSelectedNode(node);
  };

  // Simulate quick selection
  const handleQuickSimulate = (id: string) => {
    const target = environmentalServices.find(s => s.id === id);
    if (target) {
      setSelectedNode(target);
    }
  };

  // Manual Reload Simulation
  const handleManualReload = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  // Copy helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 flex overflow-hidden">
      
      {/* SRE Navigation Sidebar (固定在左側) */}
      <aside className="w-64 bg-[#0d0f14] border-r border-[#1a1c23] flex flex-col justify-between shrink-0 select-none">
        <div className="flex flex-col">
          {/* SRE Branding element */}
          <div className="p-6 border-b border-[#1a1c23] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center border border-blue-500/30">
              <Compass className="text-white animate-spin-slow text-lg" style={{ animationDuration: '24s' }} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-white">APM PLATFORM</h1>
              <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest block mt-0.5">APM Insights</span>
            </div>
          </div>

          {/* Navigation Items list */}
          <nav className="p-4 space-y-1.5 text-left">
            {[
              { 
                id: 'topology', 
                label: isZh ? '全景動態拓撲' : isJa ? '動的トポロジー' : 'Dynamic Topology', 
                icon: <Network size={16} />, 
                desc: isZh ? '服務拓撲依賴拓撲分析' : isJa ? 'サービス依存関係トポロジー解析' : 'Dynamic service dependency analysis' 
              },
              { 
                id: 'metrics', 
                label: isZh ? '黃金指標效能' : isJa ? 'ゴールデンメトリクス' : 'Golden Metrics', 
                icon: <Activity size={16} />, 
                desc: isZh ? '服務 SLA、SQL & 容器效能' : isJa ? 'サービスSLA、SQL＆コンテナ性能' : 'SLA, slow SQL & container health' 
              },
              { 
                id: 'tracing', 
                label: isZh ? '分散式鏈路追蹤' : isJa ? '分散トレース' : 'Distributed Tracing', 
                icon: <Layers size={16} />, 
                desc: isZh ? 'Gantt 鏈路軌跡溯源' : isJa ? 'Ganttチャートによる呼出痕跡追跡' : 'Gantt trace call chain' 
              },
              { 
                id: 'diagnostics', 
                label: isZh ? '進階故障診斷' : isJa ? '高度な障害診断' : 'Advanced RCA Diagnostics', 
                icon: <Flame size={16} />, 
                desc: isZh ? '火焰圖、指標日誌聯動' : isJa ? 'スレッド・フレームグラフ＆ログ連携' : 'Thread flamegraph & log correlation' 
              },
              { 
                id: 'governance', 
                label: isZh ? '管理者治理中心' : isJa ? 'ガバナンスセンター' : 'SRE Governance', 
                icon: <Sliders size={16} />, 
                desc: isZh ? '採樣率脫敏、隱私編碼' : isJa ? 'サンプリング、マスキング制御' : 'Sampling & payload masking' 
              }
            ].map((nav) => {
              const isActive = activeTab === nav.id;

              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveTab(nav.id as any)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3.5 transition-all text-left relative overflow-hidden group ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/5 text-blue-400 border border-blue-500/20" 
                      : "text-gray-400 hover:text-white border border-transparent hover:bg-gray-900/40"
                  }`}
                >
                  <span className={`${isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}`}>
                    {nav.icon}
                  </span>
                  <div>
                    <span className="block font-medium">{nav.label}</span>
                    <span className="text-[8px] text-gray-500 font-mono font-medium block mt-0.5">{nav.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info box to minimize noise in margins */}
        <div className="p-5 border-t border-[#1a1c23] space-y-3 font-mono text-[10px] text-gray-500 text-left">
          <div className="flex justify-between items-center">
            <span>OAP Core Node:</span>
            <span className="text-emerald-400 font-bold uppercase select-none flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </span>
          </div>
          <div className="flex justify-between">
            <span>API SLA Status:</span>
            <span className="text-gray-350 font-bold">100.0%</span>
          </div>
          <p className="text-[9px] text-gray-600 mt-2 leading-relaxed">
            Apache SkyWalking v9.4 Enterprise Edition Client
          </p>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#090b0f] overflow-y-auto">
        
        {/* Top Global Bar */}
        <header className="h-[72px] bg-[#0d0f14] border-b border-[#1a1c23] px-8 flex justify-between items-center shrink-0 z-20">
          
          <div className="flex items-center gap-4 text-left">
            <span className="text-xs text-gray-400 font-mono font-bold shrink-0">
              {isZh ? '環境切換器 (Environment):' : isJa ? '環境スイッチャー (Environment):' : 'Environment Selection:'}
            </span>
            <div className="flex gap-1.5 bg-gray-950 p-1 border border-gray-850 rounded-xl">
              {[
                { id: 'prod', label: isZh ? 'Production (正式)' : isJa ? '本番環境 (Prod)' : 'Production (Prod)' },
                { id: 'staging', label: isZh ? 'Staging (測試)' : isJa ? '検証環境 (Staging)' : 'Staging (Staging)' },
                { id: 'dev', label: 'Dev / Sandbox' }
              ].map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setEnv(e.id);
                    setSelectedNode(null); // Clear drawer selection
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-mono font-black transition-all ${
                    env === e.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right quick tools: Time scope & dynamic refresh loading widget */}
          <div className="flex items-center gap-5">
            
            {/* Time scope indicators */}
            <div className="flex gap-1 bg-gray-950 p-1 border border-gray-850 rounded-xl">
              {[
                { id: '5m', label: '5 Mins' },
                { id: '15m', label: '15 Mins' },
                { id: '1h', label: '1 Hour' },
                { id: '24h', label: '24 Hours' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    timeRange === t.id
                      ? "bg-gray-800 text-blue-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Manual Loader & Setting */}
            <div className="flex items-center gap-2 border-l border-[#1a1c23] pl-5 font-mono text-[11px]">
              <span className="text-gray-600">Auto SLA Check: 30s</span>
              <button
                onClick={handleManualReload}
                className={`w-8 h-8 rounded-xl bg-gray-950 border border-gray-850 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:border-gray-700 ${
                  isRefreshing ? "text-blue-400" : ""
                }`}
                title="立即同步 OAP 核心"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>

          </div>

        </header>

        {/* Dynamic Tab Panel content area */}
        <div className="flex-1 p-8 space-y-8">
          
          {/* Topology Page */}
          {activeTab === 'topology' && (
            <ApmTopologyView
              services={environmentalServices}
              relations={environmentalRelations}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              onQuickSimulate={handleQuickSimulate}
              env={env}
            />
          )}

          {/* Metrics Page */}
          {activeTab === 'metrics' && (
            <ApmMetricsView
              stats={environmentalStats}
              rtTrend={MOCK_RT_TREND}
              slowSql={MOCK_SLOW_SQL}
              slowEndpoints={MOCK_SLOW_ENDPOINTS}
              jvmServers={MOCK_JVM_SERVERS}
              env={env}
            />
          )}

          {/* Tracing Page */}
          {activeTab === 'tracing' && (
            <ApmTracingView
              traces={traces}
              activeTrace={activeTrace}
              setActiveTrace={setActiveTrace}
              selectedSpan={selectedSpan}
              setSelectedSpan={setSelectedSpan}
              copiedText={copiedText}
              onCopyText={handleCopyText}
            />
          )}

          {/* Advanced SRE Diagnostics Page */}
          {activeTab === 'diagnostics' && (
            <ApmDiagnosticsView
              profilingTasks={profilingTasks}
              correlationBlocks={CORRELATION_TIME_BLOCKS}
              onTriggerProfiling={handleTriggerProfiling}
            />
          )}

          {/* Governance Rules Page */}
          {activeTab === 'governance' && (
            <ApmGovernanceView
              maskingRules={maskingRules}
              onAddRule={handleAddMaskingRule}
              onToggleRule={handleToggleMaskingRule}
              onDeleteRule={handleDeleteMaskingRule}
            />
          )}

        </div>

      </main>

    </div>
  );
}

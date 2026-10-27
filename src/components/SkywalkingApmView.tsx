import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

// Import our modular models and types
import { ServiceNode, Trace, Span, ProfilingTask, MaskingRule, CorrelationTimeBlock } from './apm/ApmTypes';
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

// Import SIEM Service for real backend API synchronization
import { siemService } from '../services/siemService';

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
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Core Data States
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);
  const [topologyServices, setTopologyServices] = useState<ServiceNode[]>(MOCK_SERVICES.prod);
  const [topologyRelations, setTopologyRelations] = useState(MOCK_RELATIONS.prod);
  const [backendStats, setBackendStats] = useState<{ totalCPM: number; avgLatency: number; avgSla: number; activeAlarms: number } | null>(null);

  const [traces, setTraces] = useState<Trace[]>(MOCK_TRACES);
  const [activeTrace, setActiveTrace] = useState<Trace>(MOCK_TRACES[0]);
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(MOCK_TRACES[0]?.spans?.[0] || null);
  const [copiedText, setCopiedText] = useState(false);

  // Metrics Data States
  const [rtTrend, setRtTrend] = useState(MOCK_RT_TREND);
  const [slowSql, setSlowSql] = useState(MOCK_SLOW_SQL);
  const [slowEndpoints, setSlowEndpoints] = useState(MOCK_SLOW_ENDPOINTS);
  const [jvmServers, setJvmServers] = useState(MOCK_JVM_SERVERS);

  // SRE State Lists (Governance & Diagnostics)
  const [profilingTasks, setProfilingTasks] = useState<ProfilingTask[]>(MOCK_PROFILING_TASKS);
  const [maskingRules, setMaskingRules] = useState<MaskingRule[]>(DEFAULT_MASKING_RULES);
  const [correlationBlocks, setCorrelationBlocks] = useState<CorrelationTimeBlock[]>(CORRELATION_TIME_BLOCKS);
  const [samplingRate, setSamplingRate] = useState<number>(75);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);

  // Toast notification helper
  const showToast = useCallback((text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => prev?.text === text ? null : prev);
    }, 3500);
  }, []);

  // 1. Fetch Topology from Backend
  const loadTopology = useCallback(async (currentEnv: string) => {
    try {
      const res = await siemService.getApmTopology(currentEnv);
      if (res && res.success && res.services) {
        setTopologyServices(res.services);
        setTopologyRelations(res.relations || []);
        if (res.stats) {
          setBackendStats(res.stats);
        }
        setBackendConnected(true);
      }
    } catch (err) {
      console.warn('Backend APM topology offline, fallback to mock data', err);
      setTopologyServices(MOCK_SERVICES[currentEnv] || MOCK_SERVICES.prod);
      setTopologyRelations(MOCK_RELATIONS[currentEnv] || MOCK_RELATIONS.prod);
      setBackendConnected(false);
    }
  }, []);

  // 2. Fetch Metrics from Backend with timeRange support
  const loadMetrics = useCallback(async (currentEnv: string, currentTimeRange: string = '15m') => {
    try {
      const res = await siemService.getApmMetrics(currentEnv, currentTimeRange);
      if (res && res.success) {
        if (res.stats) setBackendStats(res.stats);
        if (res.rtTrend) setRtTrend(res.rtTrend);
        if (res.slowSql) setSlowSql(res.slowSql);
        if (res.slowEndpoints) setSlowEndpoints(res.slowEndpoints);
        if (res.jvmServers) setJvmServers(res.jvmServers);
      }
    } catch (err) {
      console.warn('Backend APM metrics offline', err);
    }
  }, []);

  // 3. Fetch Traces from Backend
  const loadTraces = useCallback(async () => {
    try {
      const res = await siemService.getApmTraces();
      if (res && res.success && res.traces && res.traces.length > 0) {
        setTraces(res.traces);
        if (!res.traces.some((t: Trace) => t.traceId === activeTrace?.traceId)) {
          setActiveTrace(res.traces[0]);
          setSelectedSpan(res.traces[0]?.spans?.[0] || null);
        }
      }
    } catch (err) {
      console.warn('Backend APM traces offline', err);
    }
  }, [activeTrace]);

  // 4. Fetch Governance Config & Masking Rules from Backend
  const loadGovernance = useCallback(async () => {
    try {
      const res = await siemService.getApmGovernance();
      if (res && res.success) {
        if (res.config) {
          setSamplingRate(res.config.samplingRate);
          setIsEmergencyActive(res.config.isEmergencyActive);
        }
        if (res.maskingRules) {
          setMaskingRules(res.maskingRules);
        }
      }
    } catch (err) {
      console.warn('Backend APM governance offline', err);
    }
  }, []);

  // 5. Fetch Profiling Tasks from Backend
  const loadProfilingTasks = useCallback(async () => {
    try {
      const res = await siemService.getApmProfilingTasks();
      if (res && res.success && res.tasks) {
        setProfilingTasks(res.tasks);
      }
    } catch (err) {
      console.warn('Backend APM profiling offline', err);
    }
  }, []);

  // 6. Fetch Correlation Blocks from Backend
  const loadCorrelationBlocks = useCallback(async () => {
    try {
      const res = await siemService.getApmCorrelationBlocks();
      if (res && res.success && res.blocks) {
        setCorrelationBlocks(res.blocks);
      }
    } catch (err) {
      console.warn('Backend APM correlation blocks offline', err);
    }
  }, []);

  // Synchronize all data on mount and environment / timeRange change
  useEffect(() => {
    loadTopology(env);
    loadMetrics(env, timeRange);
    loadTraces();
    loadGovernance();
    loadProfilingTasks();
    loadCorrelationBlocks();
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [env, timeRange, loadTopology, loadMetrics, loadTraces, loadGovernance, loadProfilingTasks, loadCorrelationBlocks]);

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      loadTopology(env);
      loadMetrics(env, timeRange);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(timer);
  }, [env, timeRange, loadTopology, loadMetrics]);

  // Calculated Stats
  const environmentalStats = useMemo(() => {
    if (backendStats) return backendStats;
    const totalCPM = topologyServices.reduce((sum, s) => sum + s.cpm, 0);
    const avgLatency = Math.round(topologyServices.reduce((sum, s) => sum + s.latency, 0) / (topologyServices.length || 1));
    const avgSla = parseFloat((topologyServices.reduce((sum, s) => sum + s.sla, 0) / (topologyServices.length || 1)).toFixed(2));
    const activeAlarms = env === 'prod' ? 3 : env === 'staging' ? 0 : 1;
    return { totalCPM, avgLatency, avgSla, activeAlarms };
  }, [backendStats, topologyServices, env]);

  // Handle Dynamic Profiling addition
  const handleTriggerProfiling = async (taskName: string, instance: string, duration: number) => {
    try {
      const res = await siemService.createApmProfilingTask({
        taskName,
        targetInstance: instance,
        durationSeconds: duration
      });
      if (res && res.success) {
        setProfilingTasks(res.tasks);
        showToast(isZh ? `剖析任務已完成並建立火焰圖 (${instance})` : `Profiling completed for ${instance}`);
        return;
      }
    } catch (err) {
      console.warn('Backend profiling create failed, using local simulation', err);
    }

    // Fallback simulation
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
    showToast(isZh ? `剖析任務已完成 (${instance})` : `Profiling finished for ${instance}`);
  };

  // Masking Rules modifications handlers with real backend integration
  const handleAddMaskingRule = async (rule: Omit<MaskingRule, 'id' | 'isActive'>) => {
    try {
      const res = await siemService.addApmMaskingRule(rule);
      if (res && res.success && res.rules) {
        setMaskingRules(res.rules);
        showToast(isZh ? `成功建立機敏脫敏規則: ${rule.name}` : `Masking rule created: ${rule.name}`);
        return;
      }
    } catch (err) {
      console.warn('Backend add rule failed, using local fallback', err);
    }

    const newRule: MaskingRule = {
      id: `rule-${Date.now()}`,
      name: rule.name,
      regex: rule.regex,
      replacement: rule.replacement,
      isActive: true
    };
    setMaskingRules([...maskingRules, newRule]);
    showToast(isZh ? `脫敏規則已建立 (本機模式)` : `Rule created locally`);
  };

  const handleToggleMaskingRule = async (id: string) => {
    try {
      const res = await siemService.toggleApmMaskingRule(id);
      if (res && res.success && res.rules) {
        setMaskingRules(res.rules);
        const target = res.rules.find((r: MaskingRule) => r.id === id);
        showToast(isZh ? `規則狀態已切換為: ${target?.isActive ? '啟用' : '停用'}` : `Rule state toggled`);
        return;
      }
    } catch (err) {
      console.warn('Backend toggle rule failed', err);
    }

    setMaskingRules(
      maskingRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
    );
  };

  const handleDeleteMaskingRule = async (id: string) => {
    try {
      const res = await siemService.deleteApmMaskingRule(id);
      if (res && res.success && res.rules) {
        setMaskingRules(res.rules);
        showToast(isZh ? '脫敏規則已刪除' : 'Masking rule deleted', 'warning');
        return;
      }
    } catch (err) {
      console.warn('Backend delete rule failed', err);
    }

    setMaskingRules(maskingRules.filter(r => r.id !== id));
    showToast(isZh ? '脫敏規則已刪除' : 'Masking rule deleted', 'warning');
  };

  // Update Sampling rate with backend sync
  const handleUpdateSamplingRate = async (rate: number) => {
    setSamplingRate(rate);
    try {
      await siemService.updateApmSamplingRate(rate);
    } catch (err) {
      console.warn('Failed to persist sampling rate', err);
    }
  };

  // Emergency Shedding action
  const handleEmergencyShedding = async () => {
    setIsEmergencyActive(true);
    setSamplingRate(5);
    try {
      await siemService.triggerApmEmergencyShedding();
      showToast(isZh ? '🚨 熔斷 bypass 機制已啟動 (採樣率降至 5%)' : '🚨 Emergency traffic shedding activated (5%)', 'warning');
    } catch (err) {
      console.warn('Emergency shedding API failed', err);
    }
    setTimeout(() => {
      setIsEmergencyActive(false);
    }, 6000);
  };

  // Reset all APM settings to default
  const handleResetDefaults = async () => {
    if (!window.confirm(isZh ? '確定要將所有 APM 治理與探針設定恢復為預設範本嗎？' : 'Reset all APM governance settings to defaults?')) {
      return;
    }
    try {
      const res = await siemService.resetApmDefaults();
      if (res && res.success) {
        setSamplingRate(res.config.samplingRate);
        setIsEmergencyActive(res.config.isEmergencyActive);
        setMaskingRules(res.maskingRules);
        setProfilingTasks(res.profilingTasks);
        showToast(isZh ? 'APM 設定已成功重置為初始出廠狀態' : 'APM settings reset to defaults');
        return;
      }
    } catch (err) {
      console.warn('Failed to reset APM defaults', err);
    }
    setMaskingRules(DEFAULT_MASKING_RULES);
    setProfilingTasks(MOCK_PROFILING_TASKS);
    setSamplingRate(75);
    showToast(isZh ? '已重置為預設設定' : 'Reset completed');
  };

  // Node select side effect
  const handleNodeSelect = (node: ServiceNode | null) => {
    setSelectedNode(node);
  };

  // Quick selection simulation
  const handleQuickSimulate = (id: string) => {
    const target = topologyServices.find(s => s.id === id);
    if (target) {
      setSelectedNode(target);
    }
  };

  // Manual Reload
  const handleManualReload = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadTopology(env),
      loadMetrics(env),
      loadTraces(),
      loadGovernance(),
      loadProfilingTasks()
    ]);
    setLastSyncTime(new Date().toLocaleTimeString());
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(isZh ? 'OAP 探針遙測與拓撲數據已更新' : 'OAP telemetry synced');
    }, 600);
  };

  // Copy helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 flex overflow-hidden relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-5 right-8 z-50 px-4 py-2.5 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-2.5 animate-[fadeIn_0.3s_ease-out] ${
          toastMessage.type === 'warning'
            ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
        }`}>
          {toastMessage.type === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

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

        {/* Footer info box with reset action */}
        <div className="p-5 border-t border-[#1a1c23] space-y-3 font-mono text-[10px] text-gray-500 text-left">
          <div className="flex justify-between items-center">
            <span>OAP Core Node:</span>
            <span className={`font-bold uppercase select-none flex items-center gap-1 ${backendConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {backendConnected ? 'Online (v9.4)' : 'Fallback'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>採樣率持久化:</span>
            <span className="text-gray-300 font-bold">{samplingRate}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>上次同步:</span>
            <span className="text-gray-400">{lastSyncTime}</span>
          </div>
          
          <button
            onClick={handleResetDefaults}
            className="w-full mt-2 py-1.5 px-2 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800 rounded-lg text-[9.5px] font-mono flex items-center justify-center gap-1.5 transition-all"
            title="將採樣率與脫敏規則重置為工廠預設值"
          >
            <RotateCcw size={11} />
            <span>{isZh ? '恢復 APM 預設範本' : 'Reset APM Defaults'}</span>
          </button>

          <p className="text-[9px] text-gray-600 pt-1 leading-relaxed">
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
              services={topologyServices}
              relations={topologyRelations}
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
              rtTrend={rtTrend}
              slowSql={slowSql}
              slowEndpoints={slowEndpoints}
              jvmServers={jvmServers}
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
              correlationBlocks={correlationBlocks}
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
              samplingRate={samplingRate}
              onUpdateSamplingRate={handleUpdateSamplingRate}
              onEmergencyShedding={handleEmergencyShedding}
              isEmergencyActive={isEmergencyActive}
            />
          )}

        </div>

      </main>

    </div>
  );
}

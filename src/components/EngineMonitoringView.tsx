import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Search, 
  Settings2, 
  RotateCcw, 
  Terminal, 
  Globe, 
  Fingerprint, 
  Key, 
  Save, 
  Power, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Zap, 
  ShieldCheck, 
  Play, 
  Pause, 
  SlidersHorizontal,
  Server,
  Layers,
  Check,
  AlertTriangle,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { siemService } from '../services/siemService';

export interface EngineItem {
  id: string;
  name: string;
  category: 'siem' | 'mon' | 'intel' | 'net' | 'edr' | 'misc';
  categoryLabel?: string;
  status: 'active' | 'inactive' | 'locked' | 'degraded' | 'restarting';
  version: string;
  type: string;
  port: number;
  url: string;
  cpu: number;
  ram: string;
  ramBytes?: number;
  perf: string;
  perfLabel: string;
  uptimeSec?: number;
  lastRestartAt?: string;
  pid?: number;
  containerId?: string;
  restartCount?: number;
  details?: string;
  accountId?: string;
  projectId?: string;
}

interface EngineMonitoringViewProps {
  isReadOnly?: boolean;
}

export default function EngineMonitoringView({ isReadOnly = false }: EngineMonitoringViewProps) {
  const { t, i18n } = useTranslation();
  const isZh = !i18n.language || i18n.language.startsWith('zh');

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive' | 'locked'>('all');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [engineConfigs, setEngineConfigs] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Engines telemetry from backend
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [clusterSummary, setClusterSummary] = useState<any>({
    totalEngines: 32,
    activeEngines: 31,
    inactiveEngines: 1,
    clusterCpuPercent: 26,
    clusterMemoryAllocatedGB: '148.6 GB',
    clusterThroughputEPS: '1.2M EPS',
    clusterHealthStatus: 'OPTIMAL'
  });

  // Action status states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [restartingAll, setRestartingAll] = useState(false);
  const [showRestartAllModal, setShowRestartAllModal] = useState(false);

  // Selected engine in config editor
  const [selectedEngineId, setSelectedEngineId] = useState('victorialogs');

  // Interactive Test Connection Modal
  const [testResultModal, setTestResultModal] = useState<{
    isOpen: boolean;
    testing: boolean;
    engine?: EngineItem;
    result?: any;
    error?: string;
  } | null>(null);

  // Interactive Log Viewer Modal
  const [logViewerModal, setLogViewerModal] = useState<{
    isOpen: boolean;
    engineId: string;
    engineName: string;
    containerId?: string;
    logs: Array<{ timestamp: string; level: 'INFO' | 'WARN' | 'DEBUG' | 'ERROR'; component: string; message: string }>;
    loading: boolean;
  } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const categories = [
    { id: 'all', name: isZh ? '全部引擎群組 (All Clusters)' : 'All Clusters', engines: [] },
    { id: 'siem', name: isZh ? 'SIEM 與日誌管理 (SIEM & Logging)' : 'SIEM & Logging', engines: ['victorialogs', 'filebeat', 'logstash', 'syslog_ng'] },
    { id: 'mon', name: isZh ? '系統與效能監控 (Monitoring & APM)' : 'Monitoring & APM', engines: ['metricbeat', 'heartbeat', 'auditbeat', 'fleet', 'skywalking'] },
    { id: 'intel', name: isZh ? '威脅情資系統 (Threat Intel / CTI)' : 'Threat Intel (CTI)', engines: ['thehive', 'cortex', 'misp', 'opencti', 'mwdb'] },
    { id: 'net', name: isZh ? '網路安全探測 (Network & NDR)' : 'Network & NDR', engines: ['arkime', 'suricata', 'zeek', 'snort', 'nmap', 'traefik'] },
    { id: 'edr', name: isZh ? 'EDR 與自動化處置 (EDR & SOAR)' : 'EDR & Automation', engines: ['velociraptor', 'zircolite', 'n8n', 'watchtower'] },
    { id: 'misc', name: isZh ? '工具與周邊系統 (Utilities & OSINT)' : 'Utilities & OSINT', engines: ['spiderfoot', 'codimd', 'homer', 'opencve', 'capa', 'secubian', 'tpot', 'lab_dfir_soc'] }
  ];

  const getEngineDisplayName = (id: string) => {
    const map: Record<string, string> = {
      victorialogs: 'VictoriaLogs',
      syslog_ng: 'Syslog-ng',
      skywalking: 'Apache SkyWalking',
      n8n: 'n8n',
      opencti: 'OpenCTI',
      mwdb: 'MWDB',
      codimd: 'CodiMD',
      thehive: 'TheHive',
      opencve: 'OpenCVE',
      lab_dfir_soc: 'Lab-DFIR-SOC',
      tpot: 'T-POT'
    };
    return map[id] || id.charAt(0).toUpperCase() + id.slice(1);
  };

  // Fetch telemetry from backend
  const fetchTelemetry = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await siemService.getEngineMetrics();
      if (res?.engines) {
        setEngines(res.engines);
      }
      if (res?.summary) {
        setClusterSummary(res.summary);
      }
    } catch (e) {
      console.warn('Failed to fetch engine metrics:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Load configs & initial telemetry
  useEffect(() => {
    fetchTelemetry(false);

    siemService.getEngineConfigs()
      .then(configs => {
        if (configs) setEngineConfigs(configs);
      })
      .catch(() => {});
  }, []);

  // Polling Interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTelemetry(true);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle Update Config in Editor
  const handleUpdateConfig = (engine: string, field: string, value: string) => {
    setEngineConfigs(prev => ({
      ...prev,
      [engine]: {
        ...prev[engine],
        [field]: value
      }
    }));
  };

  // Save Config to Backend
  const saveConfig = async (engine: string) => {
    if (isReadOnly) return;
    setIsSaving(true);
    try {
      await siemService.updateEngineConfig(engine, engineConfigs[engine]);
      showToast(isZh ? `${getEngineDisplayName(engine)} 服務節點參數已成功更新並持久化！` : `${getEngineDisplayName(engine)} configuration saved!`, 'success');
      fetchTelemetry(true);
    } catch (err: any) {
      showToast(isZh ? `儲存服務設定失敗: ${err.message}` : 'Failed to save config', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Test Engine Connection
  const handleTestConnection = async (targetId: string, customUrl?: string) => {
    const engine = engines.find(e => e.id === targetId) || {
      id: targetId,
      name: getEngineDisplayName(targetId),
      url: customUrl || engineConfigs[targetId]?.url || 'http://localhost:8000',
      port: 8000,
      version: 'v1.0'
    } as EngineItem;

    setTestResultModal({
      isOpen: true,
      testing: true,
      engine
    });

    try {
      const res = await siemService.testEngineConnection(targetId, customUrl || engine.url);
      setTestResultModal({
        isOpen: true,
        testing: false,
        engine,
        result: res
      });
    } catch (e: any) {
      setTestResultModal({
        isOpen: true,
        testing: false,
        engine,
        error: e.message || '連線逾時或通訊埠未開放'
      });
    }
  };

  // Single Engine Restart
  const handleRestartEngine = async (id: string, name: string) => {
    if (isReadOnly) return;
    setActionLoadingId(id);
    try {
      const res = await siemService.restartEngine(id);
      showToast(res.message || (isZh ? `服務引擎 ${name} 已成功發送重啟命令！` : `Engine ${name} restarted.`), 'success');
      
      // Update local state temporarily
      setEngines(prev => prev.map(e => e.id === id ? { ...e, status: 'restarting' } : e));
      setTimeout(() => {
        fetchTelemetry(true);
        setActionLoadingId(null);
      }, 1800);
    } catch (e: any) {
      showToast(isZh ? `重啟失敗: ${e.message}` : 'Restart failed', 'error');
      setActionLoadingId(null);
    }
  };

  // Toggle Engine (Start/Stop)
  const handleToggleEngine = async (id: string, name: string) => {
    if (isReadOnly) return;
    setActionLoadingId(id);
    try {
      const res = await siemService.toggleEngineStatus(id);
      showToast(res.message || (isZh ? `服務引擎 ${name} 狀態已變更` : `Engine status updated`), 'info');
      fetchTelemetry(true);
    } catch (e: any) {
      showToast(isZh ? `操作失敗: ${e.message}` : 'Operation failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Restart All Engines
  const handleConfirmRestartAll = async () => {
    if (isReadOnly) return;
    setShowRestartAllModal(false);
    setRestartingAll(true);
    try {
      const res = await siemService.restartAllEngines();
      showToast(res.message || (isZh ? '全平台 32 項服務引擎已開始滾動重啟！' : 'All engines restarted'), 'success');
      setTimeout(() => {
        fetchTelemetry(true);
        setRestartingAll(false);
      }, 2500);
    } catch (e: any) {
      showToast(isZh ? `重啟失敗: ${e.message}` : 'Restart failed', 'error');
      setRestartingAll(false);
    }
  };

  // View Engine Container Logs
  const handleViewLogs = async (id: string, name: string) => {
    setLogViewerModal({
      isOpen: true,
      engineId: id,
      engineName: name,
      logs: [],
      loading: true
    });

    try {
      const res = await siemService.getEngineLogs(id);
      setLogViewerModal(prev => prev ? {
        ...prev,
        logs: res.logs || [],
        containerId: res.containerId,
        loading: false
      } : null);
    } catch (e) {
      setLogViewerModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  // Filtered Engines List
  const filteredEngines = engines.filter(e => {
    const matchesSearch = 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(e.port).includes(searchTerm) ||
      (e.details && e.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = 
      selectedCategory === 'all' || e.category === selectedCategory;

    const matchesStatus = 
      selectedStatusFilter === 'all' || e.status === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom duration-300",
          toastMessage.type === 'success' ? "bg-emerald-950/90 border-emerald-700 text-emerald-200" :
          toastMessage.type === 'error' ? "bg-red-950/90 border-red-700 text-red-200" :
          "bg-blue-950/90 border-blue-700 text-blue-200"
        )}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> :
           toastMessage.type === 'error' ? <AlertCircle size={16} className="text-red-400 shrink-0" /> :
           <Activity size={16} className="text-blue-400 shrink-0" />}
          <span className="text-xs font-bold font-mono">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Top Cluster Health & Performance KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '運作中核心引擎' : 'Active Core Engines'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {clusterSummary.activeEngines}
            </span>
            <span className="text-[10px] font-bold text-gray-500">
              / {clusterSummary.totalEngines} {isZh ? '個微服務' : 'Services'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{clusterSummary.clusterHealthStatus} ({isZh ? '叢集健康度 100%' : '100% SLA'})</span>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '全叢集 CPU 平均負載' : 'Cluster CPU Load'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400 font-mono">
              {clusterSummary.clusterCpuPercent}%
            </span>
            <span className="text-[10px] font-bold text-gray-500">Avg Utilization</span>
          </div>
          <div className="mt-2 w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${clusterSummary.clusterCpuPercent}%` }}></div>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '記憶體配置總量' : 'RAM Allocated'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">
              {clusterSummary.clusterMemoryAllocatedGB || '148.6 GB'}
            </span>
            <span className="text-[10px] font-bold text-gray-500">/ 256 GB</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-gray-400">
            {isZh ? '記憶體總佔用率：' : 'Mem Ratio:'} <span className="text-white font-mono">58.0%</span>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '實時核心吞吐總量' : 'Total Throughput'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Zap size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-orange-400 font-mono">
              {clusterSummary.clusterThroughputEPS || '1.2M EPS'}
            </span>
            <span className="text-[10px] font-bold text-gray-500">~ 2.4 Gbps</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>{isZh ? '列式壓縮 & 零丟包緩衝' : 'Lossless Buffer Active'}</span>
          </div>
        </div>
      </div>

      {/* Main Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
              {isZh ? '平台核心引擎監控 (Engine Monitoring)' : 'Core Engine Telemetry & Monitoring'}
            </h3>
            {isLoading && <RefreshCw size={14} className="animate-spin text-gray-500" />}
          </div>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            {isZh 
              ? '全維度安全核心、分散式儲存、情資分析與 NDR/EDR 守護行程之即時資源遙測、診斷與生命週期控制。' 
              : 'Real-time telemetry, diagnostic logs, socket testing, and lifecycle management for all 32 core security services.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto Refresh Toggle */}
          <button 
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
              autoRefresh 
                ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300" 
                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
            )}
          >
            {autoRefresh ? <Play size={12} className="text-emerald-400" /> : <Pause size={12} className="text-amber-400" />}
            <span>{autoRefresh ? (isZh ? '自動更新 (4.5s)' : 'Auto-Poll') : (isZh ? '已暫停' : 'Paused')}</span>
          </button>

          {/* Manual Refresh Button */}
          <button 
            type="button"
            onClick={() => fetchTelemetry(false)}
            className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl border border-gray-800 transition-all hover:text-white"
            title={isZh ? '立即重新整理' : 'Refresh Now'}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Instance Config Editor Toggle */}
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              isConfigOpen 
                ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30" 
                : "bg-gray-900 border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800"
            )}
          >
            <Settings2 size={14} /> 
            {isConfigOpen ? (isZh ? '關閉實例編輯器' : 'Close Editor') : (isZh ? '容器實例參數設定' : 'Instance Config')}
          </button>

          {/* Rolling Restart Button */}
          <button 
            onClick={() => setShowRestartAllModal(true)}
            disabled={isReadOnly || restartingAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-950/40 border border-red-800/60 hover:bg-red-900/50 rounded-xl text-xs font-black text-red-300 uppercase tracking-wider transition-all shadow-md"
          >
            <RotateCcw size={14} className={restartingAll ? 'animate-spin' : ''} /> 
            {restartingAll ? (isZh ? '滾動重啟中...' : 'Restarting...') : (isZh ? '重啟所有服務引擎' : 'Restart All')}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0d0d0f] p-3.5 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                selectedCategory === cat.id 
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30" 
                  : "bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {cat.id === 'all' ? (isZh ? '全部引擎 (32)' : 'All') : cat.name.split(' (')[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="bg-black/60 border border-gray-800 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-300 outline-none focus:border-red-500"
          >
            <option value="all">{isZh ? '所有狀態 (All Status)' : 'All Status'}</option>
            <option value="active">{isZh ? '僅運作中 (Active)' : 'Active'}</option>
            <option value="inactive">{isZh ? '未啟用 (Inactive)' : 'Inactive'}</option>
            <option value="locked">{isZh ? '已鎖定 (Locked)' : 'Locked'}</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
            <input 
              type="text" 
              placeholder={isZh ? "搜尋引擎、服務類型或通訊埠..." : "Search engine, type, port..."} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-black/60 border border-gray-800 rounded-xl pl-8 pr-4 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-red-500 outline-none w-56 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Section: Docker Instance Configuration Drawer / Editor */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#111114] border border-red-500/30 rounded-3xl p-6 sm:p-8 relative shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                    <Settings2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white italic tracking-tighter uppercase">
                      {isZh ? 'Docker 容器實例與通訊參數編輯器' : 'Container Instance Parameter Editor'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {isZh ? '配置各引擎實例之連線位址、內部橋接 URL、驗證金鑰與通訊協定' : 'Configure engine connectivity URLs, authentication keys, and network bindings.'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Engine Selector List */}
                <div className="w-full lg:w-64 space-y-1.5 border-r border-gray-800/80 pr-4 max-h-80 overflow-y-auto">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-2">
                    {isZh ? '選擇目標服務引擎' : 'Select Target Engine'}
                  </span>
                  {engines.map(e => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEngineId(e.id)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                        selectedEngineId === e.id 
                          ? "bg-red-600/20 border border-red-500 text-white shadow-md shadow-red-600/10" 
                          : "text-gray-400 hover:bg-gray-900 hover:text-white"
                      )}
                    >
                      <span>{e.name}</span>
                      <span className="text-[10px] font-mono text-gray-500">:{e.port}</span>
                    </button>
                  ))}
                </div>

                {/* Form Fields for Selected Engine */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <div>
                      <h5 className="text-sm font-black text-white uppercase italic">
                        {getEngineDisplayName(selectedEngineId)} {isZh ? '實例參數配置' : 'Instance Configuration'}
                      </h5>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Container: {engines.find(e => e.id === selectedEngineId)?.containerId || `semor-${selectedEngineId}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">
                        Port {engines.find(e => e.id === selectedEngineId)?.port || 8000} (Active)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe size={12} className="text-blue-400" />
                        {isZh ? '連線位址 (Connectivity URL)' : 'Connectivity URL'}
                      </label>
                      <input 
                        type="text" 
                        value={engineConfigs[selectedEngineId]?.url || ''} 
                        onChange={(e) => handleUpdateConfig(selectedEngineId, 'url', e.target.value)}
                        placeholder="http://localhost:8000"
                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-blue-400 focus:border-red-500 outline-none"
                      />
                      <span className="text-[9px] text-gray-600 block">
                        {isZh ? '內部 Docker 橋接網路或對外 FQDN 位址' : 'Docker internal bridge or external host IP'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Fingerprint size={12} className="text-purple-400" />
                        {isZh ? '服務帳號 / 用戶名稱 (Account ID)' : 'Account Identity'}
                      </label>
                      <input 
                        type="text" 
                        value={engineConfigs[selectedEngineId]?.accountId || ''} 
                        onChange={(e) => handleUpdateConfig(selectedEngineId, 'accountId', e.target.value)}
                        placeholder="admin 或 semor-user"
                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-red-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={12} className="text-amber-400" />
                        {isZh ? '存取金鑰 / 專案 Token (Project ID / Access Key)' : 'Access Key / Token'}
                      </label>
                      <input 
                        type="password" 
                        value={engineConfigs[selectedEngineId]?.projectId || ''} 
                        onChange={(e) => handleUpdateConfig(selectedEngineId, 'projectId', e.target.value)}
                        placeholder="••••••••••••••••••••"
                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-red-500 outline-none"
                      />
                      <span className="text-[9px] text-gray-600 block">
                        {isZh ? '安全保存於 engine_config.json 檔案中' : 'Encrypted & persisted to engine_config.json'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => handleTestConnection(selectedEngineId, engineConfigs[selectedEngineId]?.url)}
                      className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded-xl text-xs font-bold transition-all border border-gray-800 flex items-center gap-1.5"
                    >
                      <Radio size={14} className="text-blue-400" />
                      {isZh ? '連線測試' : 'Ping Test'}
                    </button>

                    <button 
                      type="button"
                      onClick={() => saveConfig(selectedEngineId)}
                      disabled={isSaving || isReadOnly}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center gap-2"
                    >
                      {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      {isSaving ? (isZh ? '儲存中...' : 'Saving...') : (isZh ? '儲存服務設定' : 'Save Config')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEngines.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-[#0d0d0f] border border-gray-800 rounded-3xl text-gray-500">
            {isZh ? '查無符合條件的服務引擎，請嘗試重設搜尋字串或篩選條件。' : 'No service engines match the current filter.'}
          </div>
        ) : (
          filteredEngines.map((engine, index) => (
            <motion.div 
              key={engine.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className={cn(
                "group relative bg-[#0e0e11] border p-5 rounded-3xl transition-all overflow-hidden flex flex-col justify-between shadow-lg",
                engine.status === 'active' ? "border-gray-800 hover:border-gray-700 hover:shadow-xl" :
                engine.status === 'restarting' ? "border-amber-500/40 bg-amber-950/10" :
                engine.status === 'locked' ? "border-red-900/40 bg-red-950/10" :
                "border-gray-900 opacity-70"
              )}
            >
              <div>
                {/* Header: Title, Status, Version */}
                <div className="flex items-start justify-between relative z-10 gap-2">
                  <div className="truncate">
                    <h4 className="text-[13px] font-black text-white italic tracking-tight group-hover:text-red-400 transition-colors uppercase truncate">
                      {engine.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[9px] text-gray-500 font-black uppercase italic tracking-widest truncate">
                        {engine.type}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-gray-700 shrink-0" />
                      <span className="text-[9px] text-gray-600 font-mono font-bold shrink-0">
                        {engine.version}
                      </span>
                    </div>
                  </div>

                  <div className={cn(
                    "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border shrink-0",
                    engine.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                    engine.status === 'restarting' ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" :
                    engine.status === 'inactive' ? "bg-gray-500/10 text-gray-500 border-gray-500/20" : 
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {engine.status === 'active' ? (isZh ? '運作中' : 'Active') : 
                     engine.status === 'restarting' ? (isZh ? '重啟中' : 'Restarting') :
                     engine.status === 'inactive' ? (isZh ? '未啟用' : 'Inactive') : (isZh ? '已鎖定' : 'Locked')}
                  </div>
                </div>

                {/* Telemetry Meters (CPU & RAM) */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 relative z-10">
                  <div className="bg-black/40 border border-white/5 p-2.5 rounded-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest italic">CPU</span>
                      <span className={cn(
                        "text-[9px] font-mono font-bold", 
                        engine.cpu > 80 ? "text-red-400" : engine.cpu > 50 ? "text-amber-400" : "text-blue-400"
                      )}>
                        {engine.cpu}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500", 
                          engine.cpu > 80 ? "bg-red-500" : engine.cpu > 50 ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(100, engine.cpu)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-2.5 rounded-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest italic">RAM</span>
                      <span className="text-[9px] font-mono font-bold text-gray-300">{engine.ram}</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-500" 
                        style={{ width: engine.status === 'active' ? '45%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Metric & Port info */}
                <div className="mt-3.5 flex items-baseline justify-between relative z-10 px-0.5">
                  <div>
                    <span className="text-[8px] text-gray-500 font-black uppercase italic tracking-widest block">
                      {engine.perfLabel}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs font-black text-white italic font-mono tracking-tight">
                        {engine.perf}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] text-gray-500 font-mono block">PORT</span>
                    <span className="text-[10px] text-orange-400 font-mono font-bold">
                      :{engine.port}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between relative z-10">
                <span className="text-[9px] text-gray-500 font-mono truncate max-w-[120px]">
                  {engine.containerId ? engine.containerId.slice(0, 16) : `pid:${engine.pid || 0}`}
                </span>

                <div className="flex items-center gap-1">
                  {/* Ping Test */}
                  <button 
                    type="button"
                    onClick={() => handleTestConnection(engine.id, engine.url)}
                    title={isZh ? '測試此引擎連線' : 'Ping Test'}
                    className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-blue-400 rounded-lg transition-colors"
                  >
                    <Radio size={13} />
                  </button>

                  {/* Logs */}
                  <button 
                    type="button"
                    onClick={() => handleViewLogs(engine.id, engine.name)}
                    title={isZh ? '檢視容器標準輸出日誌' : 'View Logs'}
                    className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-amber-400 rounded-lg transition-colors"
                  >
                    <Terminal size={13} />
                  </button>

                  {/* Edit Params */}
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedEngineId(engine.id);
                      setIsConfigOpen(true);
                    }}
                    title={isZh ? '編輯實例參數' : 'Edit Config'}
                    className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    <Settings2 size={13} />
                  </button>

                  {/* Restart Engine */}
                  <button 
                    type="button"
                    onClick={() => handleRestartEngine(engine.id, engine.name)}
                    disabled={isReadOnly || actionLoadingId === engine.id}
                    title={isZh ? '重啟單一服務程序' : 'Restart Engine'}
                    className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-emerald-400 rounded-lg transition-colors"
                  >
                    <RotateCcw size={13} className={actionLoadingId === engine.id ? 'animate-spin' : ''} />
                  </button>

                  {/* Power Toggle */}
                  <button 
                    type="button"
                    onClick={() => handleToggleEngine(engine.id, engine.name)}
                    disabled={isReadOnly || actionLoadingId === engine.id || engine.status === 'locked'}
                    title={engine.status === 'active' ? (isZh ? '停止服務' : 'Stop') : (isZh ? '啟動服務' : 'Start')}
                    className={cn(
                      "p-1.5 hover:bg-gray-800 rounded-lg transition-colors",
                      engine.status === 'active' ? "text-gray-400 hover:text-red-400" : "text-gray-400 hover:text-emerald-400"
                    )}
                  >
                    <Power size={13} />
                  </button>
                </div>
              </div>

              {/* Decorative Subtle Glow */}
              <div className={cn(
                "absolute -right-8 -bottom-8 w-28 h-28 blur-[50px] rounded-full opacity-0 group-hover:opacity-10 transition-all pointer-events-none",
                engine.status === 'active' ? "bg-blue-600" : engine.status === 'locked' ? "bg-red-600" : "bg-gray-600"
              )} />
            </motion.div>
          ))
        )}
      </div>

      {/* Modal: Test Connection Result */}
      {testResultModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Radio size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {isZh ? '服務引擎連線診斷報告' : 'Engine Connection Diagnostic'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {testResultModal.engine?.name} ({testResultModal.engine?.url})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTestResultModal(null)}
                className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {testResultModal.testing ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="animate-spin text-blue-400" size={28} />
                  <p className="text-xs font-bold text-gray-300">
                    {isZh ? '正在執行 TCP/HTTP Socket 探針與協定交握...' : 'Probing target host and socket handshake...'}
                  </p>
                </div>
              ) : testResultModal.error ? (
                <div className="p-4 bg-red-950/30 border border-red-800/60 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                    <AlertTriangle size={16} />
                    <span>{isZh ? '連線探測失敗' : 'Connection Failed'}</span>
                  </div>
                  <p className="text-[11px] font-mono text-gray-300">
                    {testResultModal.error}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">STATUS</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 size={13} />
                        {testResultModal.result?.status || 'CONNECTED (HEALTHY)'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">LATENCY</span>
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {testResultModal.result?.latencyMs || 4} ms
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/60 border border-gray-800/80 rounded-2xl space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-gray-400">
                      <span>目標位址 (Endpoint):</span>
                      <span className="text-white font-bold">{testResultModal.result?.host}:{testResultModal.result?.port}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>通訊協定 (Protocol):</span>
                      <span className="text-white font-bold">{testResultModal.result?.protocol}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>服務標頭 (Banner):</span>
                      <span className="text-emerald-400 font-bold">{testResultModal.result?.banner}</span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-gray-300 bg-gray-900/40 p-3 rounded-xl border border-gray-800">
                    {testResultModal.result?.message}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-black/30 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setTestResultModal(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
              >
                {isZh ? '關閉' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Container Log Viewer */}
      {logViewerModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Terminal size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {logViewerModal.engineName} {isZh ? '容器標準輸出記錄 (Container Output)' : 'Container Output'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">
                    ID: {logViewerModal.containerId || `semor-${logViewerModal.engineId}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewLogs(logViewerModal.engineId, logViewerModal.engineName)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                  title={isZh ? '刷新日誌' : 'Refresh'}
                >
                  <RefreshCw size={14} className={logViewerModal.loading ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => setLogViewerModal(null)}
                  className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] bg-black/90 space-y-1.5">
              {logViewerModal.loading ? (
                <div className="py-16 flex items-center justify-center text-gray-500">
                  <RefreshCw size={24} className="animate-spin text-amber-400" />
                </div>
              ) : logViewerModal.logs.length === 0 ? (
                <div className="py-16 text-center text-gray-600">
                  {isZh ? '暫無近期日誌輸出' : 'No logs recorded.'}
                </div>
              ) : (
                logViewerModal.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 py-1 border-b border-gray-900/60 hover:bg-white/[0.02] px-2 rounded">
                    <span className="text-gray-500 text-[10px] shrink-0">{log.timestamp}</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 border",
                      log.level === 'INFO' ? "bg-blue-950/40 text-blue-400 border-blue-900/40" :
                      log.level === 'WARN' ? "bg-amber-950/40 text-amber-400 border-amber-900/40" :
                      log.level === 'ERROR' ? "bg-red-950/40 text-red-400 border-red-900/40" :
                      "bg-gray-800 text-gray-400 border-gray-700"
                    )}>
                      {log.level}
                    </span>
                    <span className="text-gray-400 text-[10px] shrink-0">[{log.component}]</span>
                    <span className="text-gray-200 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-black/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const text = logViewerModal.logs.map(l => `[${l.timestamp}] [${l.level}] [${l.component}] ${l.message}`).join('\n');
                  navigator.clipboard.writeText(text);
                  showToast(isZh ? '日誌內容已複製至剪貼簿！' : 'Logs copied to clipboard');
                }}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Copy size={13} /> {isZh ? '複製所有日誌' : 'Copy All'}
              </button>

              <button
                type="button"
                onClick={() => setLogViewerModal(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
              >
                {isZh ? '關閉' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rolling Restart All Confirmation */}
      {showRestartAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-red-500/40 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-base font-black text-white uppercase italic tracking-tight">
                  {isZh ? '確認重啟所有服務引擎？' : 'Restart All 32 Service Engines?'}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold">
                  {isZh ? '此操作將進行平滑滾動重啟 (Rolling Restart)' : 'Sequential rolling restart across clusters'}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-gray-800">
              {isZh 
                ? '系統將依照相依性依序重啟日誌資料庫、收集管線、網路檢測與自動化工作流引擎。期間可能會有短暫數百毫秒之遙測微抖動，但不會遺失本機快取日誌。' 
                : 'Engines will be gracefully cycled in dependency order. In-flight buffers will be saved to disk spooling.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestartAllModal(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestartAll}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                {isZh ? '立即確認重啟' : 'Confirm Restart'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

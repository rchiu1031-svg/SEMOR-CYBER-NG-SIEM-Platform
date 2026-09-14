import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, 
  Server, 
  Radio, 
  Settings2, 
  RefreshCw, 
  AlertTriangle, 
  Bell, 
  Mail, 
  Send, 
  CheckCircle2, 
  X, 
  Sliders, 
  ShieldAlert, 
  Cpu, 
  HardDrive, 
  Database, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Zap, 
  Layers, 
  ChevronRight, 
  Save, 
  RotateCcw,
  Sparkles,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EngineArchitectureView } from './EngineArchitectureView';
import { CollectorTelemetryDashboard } from './CollectorTelemetryDashboard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

interface NodeInfo {
  id: string;
  name: string;
  type: string;
  rawType: 'Dashboard Node' | 'Master Node' | 'Work Node';
  ip: string;
  cpu: number;
  ram: number;
  disk: number;
  traffic: { tcp: number; udp: number; agent: number };
  status: 'Online' | 'Warning' | 'Offline';
}

interface ThresholdSettings {
  cpuWarning: number;
  cpuCritical: number;
  cpuDurationMinutes: number;
  ramWarning: number;
  ramCritical: number;
  ramDurationMinutes: number;
  diskWarning: number;
  diskCritical: number;
  trafficWarningMbps: number;
  trafficCriticalMbps: number;
  // Notification channels
  enableEmail: boolean;
  emailRecipients: string;
  enableWebhook: boolean;
  webhookUrl: string;
  webhookChannel: string;
  enableSyslog: boolean;
  syslogServer: string;
  syslogPort: number;
  alertCooldownMinutes: number;
  notifyOnWarning: boolean;
  notifyOnCritical: boolean;
  // Node overrides
  nodeOverrides: Record<string, { cpuCritical?: number; ramCritical?: number; diskCritical?: number }>;
}

const DEFAULT_THRESHOLDS: ThresholdSettings = {
  cpuWarning: 75,
  cpuCritical: 90,
  cpuDurationMinutes: 3,
  ramWarning: 80,
  ramCritical: 90,
  ramDurationMinutes: 5,
  diskWarning: 85,
  diskCritical: 92,
  trafficWarningMbps: 120,
  trafficCriticalMbps: 180,
  enableEmail: true,
  emailRecipients: 'admin-infra@corp.internal, soc-alerts@corp.internal',
  enableWebhook: true,
  webhookUrl: 'https://hooks.slack.com/services/T00/B00/platform-infra-alerts',
  webhookChannel: '#infra-alerts-soc',
  enableSyslog: false,
  syslogServer: '192.168.10.250',
  syslogPort: 514,
  alertCooldownMinutes: 15,
  notifyOnWarning: true,
  notifyOnCritical: true,
  nodeOverrides: {
    'master-01': { cpuCritical: 80, ramCritical: 85, diskCritical: 85 }
  }
};

export function PlatformPerformanceView() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Tabs: 'overview' | 'analytics' | 'engine' | 'telemetry'
  const [activeViewMode, setActiveViewMode] = useState<'overview' | 'analytics' | 'engine' | 'telemetry'>('overview');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalTab, setConfigModalTab] = useState<'thresholds' | 'notifications' | 'overrides' | 'test'>('thresholds');
  const [isSyncing, setIsSyncing] = useState(false);
  const [testAlertSent, setTestAlertSent] = useState(false);
  const [testAlertLog, setTestAlertLog] = useState<string[]>([]);

  // Thresholds state with localStorage persistence
  const [thresholds, setThresholds] = useState<ThresholdSettings>(() => {
    try {
      const saved = localStorage.getItem('platform_performance_thresholds');
      return saved ? { ...DEFAULT_THRESHOLDS, ...JSON.parse(saved) } : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  });

  const [tempThresholds, setTempThresholds] = useState<ThresholdSettings>(thresholds);

  // Nodes state
  const [nodes, setNodes] = useState<NodeInfo[]>([
    {
      id: 'dash-01',
      name: 'Dashboard-Node-01',
      type: isZh ? '控制台節點' : 'Dashboard Node',
      rawType: 'Dashboard Node',
      ip: '192.168.10.10',
      cpu: 45,
      ram: 62,
      disk: 38,
      traffic: { tcp: 12.5, udp: 2.1, agent: 0.8 },
      status: 'Online'
    },
    {
      id: 'master-01',
      name: 'Master-Node-01',
      type: isZh ? '主控管理節點' : 'Master Node',
      rawType: 'Master Node',
      ip: '192.168.10.20',
      cpu: 28,
      ram: 45,
      disk: 22,
      traffic: { tcp: 45.2, udp: 8.4, agent: 1.2 },
      status: 'Online'
    },
    {
      id: 'work-01',
      name: 'Work-Node-01',
      type: isZh ? '運算工作節點' : 'Work Node',
      rawType: 'Work Node',
      ip: '192.168.10.31',
      cpu: 78,
      ram: 82,
      disk: 55,
      traffic: { tcp: 120.5, udp: 15.2, agent: 5.4 },
      status: 'Online'
    },
    {
      id: 'work-02',
      name: 'Work-Node-02',
      type: isZh ? '運算工作節點' : 'Work Node',
      rawType: 'Work Node',
      ip: '192.168.10.32',
      cpu: 65,
      ram: 70,
      disk: 48,
      traffic: { tcp: 98.2, udp: 12.1, agent: 4.8 },
      status: 'Online'
    },
    {
      id: 'work-03',
      name: 'Work-Node-03',
      type: isZh ? '運算工作節點' : 'Work Node',
      rawType: 'Work Node',
      ip: '192.168.10.33',
      cpu: 92,
      ram: 88,
      disk: 62,
      traffic: { tcp: 150.8, udp: 18.5, agent: 6.2 },
      status: 'Warning'
    }
  ]);

  // Historical trend data for 24h analytics
  const historyTrendData = [
    { time: '00:00', avgCpu: 42, avgRam: 58, peakTraffic: 140, clusterEvents: 3 },
    { time: '03:00', avgCpu: 35, avgRam: 55, peakTraffic: 110, clusterEvents: 1 },
    { time: '06:00', avgCpu: 48, avgRam: 62, peakTraffic: 190, clusterEvents: 5 },
    { time: '09:00', avgCpu: 72, avgRam: 75, peakTraffic: 380, clusterEvents: 12 },
    { time: '12:00', avgCpu: 68, avgRam: 73, peakTraffic: 320, clusterEvents: 8 },
    { time: '15:00', avgCpu: 84, avgRam: 82, peakTraffic: 460, clusterEvents: 19 },
    { time: '18:00', avgCpu: 76, avgRam: 78, peakTraffic: 390, clusterEvents: 11 },
    { time: '21:00', avgCpu: 61, avgRam: 69, peakTraffic: 275, clusterEvents: 4 },
  ];

  // Compare each node with active thresholds to identify alerts
  const getNodeAlerts = (node: NodeInfo) => {
    const override = thresholds.nodeOverrides[node.id];
    const critCpu = override?.cpuCritical ?? thresholds.cpuCritical;
    const critRam = override?.ramCritical ?? thresholds.ramCritical;
    const critDisk = override?.diskCritical ?? thresholds.diskCritical;

    const alerts: { level: 'critical' | 'warning'; metric: string; val: number; threshold: number }[] = [];
    if (node.cpu >= critCpu) {
      alerts.push({ level: 'critical', metric: 'CPU', val: node.cpu, threshold: critCpu });
    } else if (node.cpu >= thresholds.cpuWarning) {
      alerts.push({ level: 'warning', metric: 'CPU', val: node.cpu, threshold: thresholds.cpuWarning });
    }

    if (node.ram >= critRam) {
      alerts.push({ level: 'critical', metric: 'RAM', val: node.ram, threshold: critRam });
    } else if (node.ram >= thresholds.ramWarning) {
      alerts.push({ level: 'warning', metric: 'RAM', val: node.ram, threshold: thresholds.ramWarning });
    }

    if (node.disk >= critDisk) {
      alerts.push({ level: 'critical', metric: 'Disk', val: node.disk, threshold: critDisk });
    } else if (node.disk >= thresholds.diskWarning) {
      alerts.push({ level: 'warning', metric: 'Disk', val: node.disk, threshold: thresholds.diskWarning });
    }

    return alerts;
  };

  // Compute cluster-wide stats
  const totalNodes = nodes.length;
  const avgCpu = Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / totalNodes);
  const avgRam = Math.round(nodes.reduce((acc, n) => acc + n.ram, 0) / totalNodes);
  const avgDisk = Math.round(nodes.reduce((acc, n) => acc + n.disk, 0) / totalNodes);
  const totalTraffic = nodes.reduce((acc, n) => acc + n.traffic.tcp + n.traffic.udp + n.traffic.agent, 0).toFixed(1);
  
  const nodesWithAlerts = nodes.map(n => ({ node: n, alerts: getNodeAlerts(n) })).filter(item => item.alerts.length > 0);
  const criticalCount = nodesWithAlerts.filter(item => item.alerts.some(a => a.level === 'critical')).length;
  const warningCount = nodesWithAlerts.filter(item => !item.alerts.some(a => a.level === 'critical') && item.alerts.some(a => a.level === 'warning')).length;

  const handleSyncNodes = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Simulate dynamic fluctuations
      setNodes(prev => prev.map(n => {
        const delta = (Math.random() - 0.5) * 4;
        const newCpu = Math.min(99, Math.max(15, Math.round(n.cpu + delta)));
        const newRam = Math.min(98, Math.max(25, Math.round(n.ram + (Math.random() - 0.5) * 2)));
        const newStatus = newCpu >= thresholds.cpuCritical || newRam >= thresholds.ramCritical ? 'Warning' : 'Online';
        return {
          ...n,
          cpu: newCpu,
          ram: newRam,
          status: newStatus
        };
      }));
      setIsSyncing(false);
      showToast(isZh ? '已完成所有叢集節點即時指標同步！' : 'All cluster node metrics refreshed successfully.', 'success');
    }, 800);
  };

  const handleSaveThresholds = () => {
    setThresholds(tempThresholds);
    localStorage.setItem('platform_performance_thresholds', JSON.stringify(tempThresholds));
    setShowConfigModal(false);
    showToast(isZh ? '效能指標與管理者告警門檻設定已成功儲存！' : 'Performance thresholds and notification settings saved successfully.', 'success');
  };

  const handleResetThresholds = () => {
    setTempThresholds(DEFAULT_THRESHOLDS);
    showToast(isZh ? '已重置為系統預設指標閥值。' : 'Reset to default metrics thresholds.', 'info');
  };

  const handleSendTestAlert = () => {
    setTestAlertSent(true);
    const now = new Date().toLocaleTimeString();
    const mockLog = [
      `[${now}] [INFO] 觸發效能告警模擬程序...`,
      `[${now}] [METRICS] 模擬 Work-Node-03 CPU 92% (超標 > ${tempThresholds.cpuCritical}%) 且持續超標 3 分鐘`,
      tempThresholds.enableEmail ? `[${now}] [EMAIL] 成功發送高急迫性通知郵件至: ${tempThresholds.emailRecipients}` : `[${now}] [EMAIL] Email 渠道未啟用 (略過)`,
      tempThresholds.enableWebhook ? `[${now}] [WEBHOOK] 成功發送 Slack/Teams JSON Payload 至: ${tempThresholds.webhookChannel} (HTTP 200 OK)` : `[${now}] [WEBHOOK] Webhook 渠道未啟用 (略過)`,
      tempThresholds.enableSyslog ? `[${now}] [SYSLOG] 已轉發 CEF 格式效能告警至 ${tempThresholds.syslogServer}:${tempThresholds.syslogPort}` : `[${now}] [SYSLOG] Syslog 渠道未啟用 (略過)`,
      `[${now}] [SUCCESS] 效能告警分發完成，管理者可於通訊渠道中檢視完整節點診斷報表！`
    ];
    setTestAlertLog(mockLog);
    showToast(isZh ? '已成功發送效能告警測試通知！' : 'Test performance alert dispatched successfully.', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const el = document.createElement('div');
    el.className = `fixed bottom-8 right-8 z-[9999] px-5 py-3 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
      type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'
    }`;
    el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${message}</span>`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'text-green-400';
      case 'Warning': return 'text-yellow-400';
      case 'Offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getProgressColor = (value: number, type: 'cpu' | 'ram' | 'disk') => {
    const crit = type === 'cpu' ? thresholds.cpuCritical : type === 'ram' ? thresholds.ramCritical : thresholds.diskCritical;
    const warn = type === 'cpu' ? thresholds.cpuWarning : type === 'ram' ? thresholds.ramWarning : thresholds.diskWarning;
    if (value >= crit) return 'bg-red-500';
    if (value >= warn) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const topologyNodes = [
    { id: 'INTERNET', label: isZh ? '外部流量' : 'External Traffic', type: 'external', x: 200, y: 50 },
    { id: 'MASTER', label: isZh ? '主控節點' : 'Master Node', type: 'master', x: 200, y: 150 },
    { id: 'DASHBOARD', label: isZh ? '儀表板' : 'Dashboard', type: 'dashboard', x: 50, y: 150 },
    { id: 'WORK-01', label: 'Work-01', type: 'work', x: 50, y: 300 },
    { id: 'WORK-02', label: 'Work-02', type: 'work', x: 200, y: 300 },
    { id: 'WORK-03', label: 'Work-03', type: 'work', x: 350, y: 300 },
  ];

  const topologyLinks = [
    { from: 'INTERNET', to: 'MASTER' },
    { from: 'MASTER', to: 'DASHBOARD' },
    { from: 'MASTER', to: 'WORK-01' },
    { from: 'MASTER', to: 'WORK-02' },
    { from: 'MASTER', to: 'WORK-03' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111114] border border-gray-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-3.5 rounded-2xl border border-purple-500/30 shadow-inner">
            <Activity className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isZh ? '平台效能監控' : 'Platform Performance Monitoring'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950/70 border border-purple-500/40 text-purple-300">
                Cluster Health
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> 
              <span>
                {isZh 
                  ? '即時監控全叢集 5 台節點負載、磁碟/記憶體消耗、流量拓撲與管理者門檻告警' 
                  : 'Real-time observability across 5 cluster nodes, disk/RAM consumption, traffic topology & threshold alerts'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          {/* View Mode Toggle */}
          <div className="bg-black/60 border border-gray-800 rounded-xl p-1 flex items-center">
            <button
              onClick={() => setActiveViewMode('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewMode === 'overview'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers size={13} />
              {isZh ? '節點拓撲' : 'Nodes & Topology'}
            </button>
            <button
              onClick={() => setActiveViewMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewMode === 'analytics'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart3 size={13} />
              {isZh ? '效能分析報表' : 'Analytics & Trends'}
            </button>
            <button
              onClick={() => setActiveViewMode('telemetry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewMode === 'telemetry'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Activity size={13} className="text-cyan-400" />
              {isZh ? 'Go 收集器即時遙測' : 'Collector Telemetry (Go)'}
            </button>
            <button
              onClick={() => setActiveViewMode('engine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewMode === 'engine'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Zap size={13} className="text-amber-400" />
              {isZh ? '底層核心架構 (Go+Rust)' : 'Core Engine (Go & Rust)'}
            </button>
          </div>

          <button
            onClick={() => {
              setTempThresholds(thresholds);
              setShowConfigModal(true);
            }}
            className="px-4 py-2 bg-gray-800/90 hover:bg-gray-700/90 border border-gray-700/80 hover:border-purple-500/50 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 shadow-sm relative group"
          >
            <Settings2 className="w-4 h-4 text-purple-400 group-hover:rotate-45 transition-transform" />
            <span>{isZh ? '效能指標設定' : 'Metrics & Alerts Config'}</span>
            {criticalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            onClick={handleSyncNodes}
            disabled={isSyncing}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isZh ? '同步節點狀態' : 'Sync Nodes'}</span>
          </button>
        </div>
      </div>

      {/* Cluster Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isZh ? '叢集節點數' : 'Total Nodes'}</span>
            <Server size={15} className="text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalNodes}</span>
            <span className="text-[10px] font-semibold text-emerald-400">{totalNodes - criticalCount} 正常</span>
            {criticalCount > 0 && (
              <span className="text-[10px] font-semibold text-red-400">{criticalCount} 告警</span>
            )}
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isZh ? '平均 CPU 負載' : 'Avg CPU Load'}</span>
            <Cpu size={15} className="text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${avgCpu >= thresholds.cpuCritical ? 'text-red-400' : avgCpu >= thresholds.cpuWarning ? 'text-amber-400' : 'text-white'}`}>
              {avgCpu}%
            </span>
            <span className="text-[10px] text-gray-500 font-mono">門檻 {thresholds.cpuCritical}%</span>
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isZh ? '平均記憶體' : 'Avg RAM'}</span>
            <Database size={15} className="text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${avgRam >= thresholds.ramCritical ? 'text-red-400' : avgRam >= thresholds.ramWarning ? 'text-amber-400' : 'text-white'}`}>
              {avgRam}%
            </span>
            <span className="text-[10px] text-gray-500 font-mono">門檻 {thresholds.ramCritical}%</span>
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isZh ? '平均磁碟使用率' : 'Avg Disk'}</span>
            <HardDrive size={15} className="text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{avgDisk}%</span>
            <span className="text-[10px] text-gray-500 font-mono">容量充裕</span>
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isZh ? '全網總吞吐量' : 'Network Total'}</span>
            <Wifi size={15} className="text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{totalTraffic}</span>
            <span className="text-[10px] text-gray-400 font-mono">Mbps</span>
          </div>
        </div>
      </div>

      {/* Active Threshold Alert Banner (If any node exceeds thresholds) */}
      {nodesWithAlerts.length > 0 && (
        <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400 shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-300">
                  {isZh ? '效能門檻告警已觸發' : 'Performance Threshold Alert Triggered'}
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-red-500/30 text-red-200">
                  {nodesWithAlerts.length} {isZh ? '台節點超標' : 'Nodes Warning'}
                </span>
              </div>
              <p className="text-xs text-red-300/80 mt-0.5">
                {nodesWithAlerts.map(({ node, alerts }) => (
                  <span key={node.id} className="mr-3 font-mono">
                    • <strong>{node.name}</strong>: {alerts.map(a => `${a.metric} ${a.val}% (閥值 ${a.threshold}%)`).join(', ')}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setTempThresholds(thresholds);
              setShowConfigModal(true);
              setConfigModalTab('test');
            }}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap self-start sm:self-center flex items-center gap-1.5"
          >
            <Bell size={13} />
            <span>{isZh ? '檢視通知狀態' : 'View Alert Status'}</span>
          </button>
        </div>
      )}

      {/* MAIN VIEW MODE 1: Overview & Topology */}
      {activeViewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Dashboard & Master Nodes */}
          <div className="space-y-6">
            {['Dashboard Node', 'Master Node'].map((type) => (
              <div key={type} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${type === 'Dashboard Node' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    {type === 'Dashboard Node' 
                      ? (isZh ? '控制台節點 (Dashboard Node)' : 'Dashboard Node') 
                      : (isZh ? '主控管理節點 (Master Node)' : 'Master Node')}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {nodes.filter(n => n.rawType === type).length} Node
                  </span>
                </div>
                
                <div className="space-y-4">
                  {nodes.filter(n => n.rawType === type).map(node => {
                    const alerts = getNodeAlerts(node);
                    return (
                      <div 
                        key={node.id} 
                        className={`bg-[#111114] border rounded-2xl p-5 shadow-lg transition-all group ${
                          alerts.length > 0 ? 'border-amber-500/50 hover:border-amber-400' : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gray-900 rounded-xl group-hover:bg-gray-800 transition-colors">
                              <Server className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{node.name}</h4>
                                {alerts.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300">
                                    Alert
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{node.ip}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${getStatusColor(node.status)}`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${node.status === 'Online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            {node.status}
                          </div>
                        </div>

                        {/* CPU / RAM / Disk bars */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] text-gray-500 uppercase font-bold">CPU</span>
                              <span className={`text-xs font-mono font-bold ${node.cpu >= thresholds.cpuCritical ? 'text-red-400' : 'text-white'}`}>
                                {node.cpu}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${getProgressColor(node.cpu, 'cpu')}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${node.cpu}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] text-gray-500 uppercase font-bold">RAM</span>
                              <span className={`text-xs font-mono font-bold ${node.ram >= thresholds.ramCritical ? 'text-red-400' : 'text-white'}`}>
                                {node.ram}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${getProgressColor(node.ram, 'ram')}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${node.ram}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '磁碟' : 'Disk'}</span>
                              <span className="text-xs text-white font-mono font-bold">{node.disk}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${getProgressColor(node.disk, 'disk')}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${node.disk}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-gray-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-purple-400" /> {isZh ? '即時吞吐' : 'Traffic'}
                          </span>
                          <span className="text-xs text-purple-300 font-mono font-bold">
                            {(node.traffic.tcp + node.traffic.udp + node.traffic.agent).toFixed(1)} Mbps
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Middle Column: Node Topology Map */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                {isZh ? '叢集節點拓撲圖' : 'Cluster Topology Map'}
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-gray-500 font-bold uppercase">{isZh ? '即時連線' : 'Live Sync'}</span>
              </div>
            </div>

            <div className="bg-[#111114] border border-gray-800 rounded-2xl shadow-xl overflow-hidden sticky top-6 p-4">
              <div className="relative h-[340px] w-full bg-black/40 rounded-xl border border-gray-800/50 p-2 overflow-hidden flex items-center justify-center">
                {/* SVG Topology Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {topologyLinks.map((link, idx) => {
                    const fromNode = topologyNodes.find(n => n.id === link.from);
                    const toNode = topologyNodes.find(n => n.id === link.to);
                    if (!fromNode || !toNode) return null;
                    return (
                      <line 
                        key={idx}
                        x1={`${(fromNode.x / 400) * 100}%`}
                        y1={`${(fromNode.y / 360) * 100}%`}
                        x2={`${(toNode.x / 400) * 100}%`}
                        y2={`${(toNode.y / 360) * 100}%`}
                        stroke="rgba(168, 85, 247, 0.3)"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                    );
                  })}
                </svg>

                {/* Topology Nodes */}
                {topologyNodes.map(node => (
                  <motion.div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                    style={{
                      left: `${(node.x / 400) * 100}%`,
                      top: `${(node.y / 360) * 100}%`
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className={`p-2.5 rounded-xl border shadow-lg transition-all ${
                      node.type === 'external' ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' :
                      node.type === 'master' ? 'bg-purple-600/30 border-purple-500/60 text-purple-300 ring-2 ring-purple-500/20' :
                      node.type === 'dashboard' ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400' :
                      'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                    }`}>
                      {node.type === 'external' ? <Radio size={16} /> :
                       node.type === 'master' ? <Zap size={16} /> :
                       node.type === 'dashboard' ? <Activity size={16} /> :
                       <Server size={16} />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 mt-1.5 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-gray-800">
                      {node.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3.5 border-t border-gray-800/80">
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{isZh ? '外部流量 (External)' : 'External Ingress'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>{isZh ? '主控節點 (Master)' : 'Master Control'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>{isZh ? '儀表板 (Dashboard)' : 'Dashboard'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{isZh ? '運算節點 (Work)' : 'Worker Nodes'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Work Nodes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {isZh ? '運算工作節點 (Work Nodes)' : 'Work Nodes'}
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">
                {nodes.filter(n => n.rawType === 'Work Node').length} Nodes
              </span>
            </div>
            
            <div className="space-y-4">
              {nodes.filter(n => n.rawType === 'Work Node').map(node => {
                const alerts = getNodeAlerts(node);
                return (
                  <div 
                    key={node.id} 
                    className={`bg-[#111114] border rounded-2xl p-5 shadow-lg transition-all group ${
                      alerts.some(a => a.level === 'critical') 
                        ? 'border-red-500/60 bg-red-950/10 hover:border-red-400' 
                        : alerts.length > 0 
                        ? 'border-amber-500/50 hover:border-amber-400' 
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-900 rounded-xl group-hover:bg-gray-800 transition-colors">
                          <Server className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{node.name}</h4>
                            {alerts.some(a => a.level === 'critical') && (
                              <span className="px-1.5 py-0.2 rounded bg-red-500/30 border border-red-500/50 text-[9px] font-black text-red-300 uppercase">
                                Critical Alert
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{node.ip}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${getStatusColor(node.status)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${node.status === 'Online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        {node.status}
                      </div>
                    </div>

                    {/* Bars */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">CPU</span>
                          <span className={`text-xs font-mono font-bold ${node.cpu >= thresholds.cpuCritical ? 'text-red-400 font-black' : 'text-white'}`}>
                            {node.cpu}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${getProgressColor(node.cpu, 'cpu')}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${node.cpu}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">RAM</span>
                          <span className={`text-xs font-mono font-bold ${node.ram >= thresholds.ramCritical ? 'text-red-400' : 'text-white'}`}>
                            {node.ram}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${getProgressColor(node.ram, 'ram')}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${node.ram}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '磁碟' : 'Disk'}</span>
                          <span className="text-xs text-white font-mono font-bold">{node.disk}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${getProgressColor(node.disk, 'disk')}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${node.disk}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>TCP: {node.traffic.tcp}M / UDP: {node.traffic.udp}M</span>
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        {(node.traffic.tcp + node.traffic.udp + node.traffic.agent).toFixed(1)} Mbps
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW MODE 2: Analytics & Trends */}
      {activeViewMode === 'analytics' && (
        <div className="space-y-6">
          {/* 24h Trend Chart */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  {isZh ? '全叢集 24 小時負載趨勢與流量峰值分析' : '24h Cluster Workload & Traffic Surge Trends'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isZh ? '整合 CPU 平均使用率、記憶體消耗、網路吞吐量與門檻超標事件紀錄' : 'Aggregated CPU, RAM usage, network bandwidth & threshold triggers over 24 hours'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-3 rounded-sm bg-purple-500/50 border border-purple-400" />
                  CPU Avg (%)
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500/50 border border-cyan-400" />
                  RAM Avg (%)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-400" />
                  Traffic (Mbps)
                </span>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="time" stroke="#737373" fontSize={11} />
                  <YAxis stroke="#737373" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="avgCpu" name="Avg CPU (%)" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" />
                  <Area type="monotone" dataKey="avgRam" name="Avg RAM (%)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#ramGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Node Metrics Comparison Table */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              {isZh ? '所有節點指標深度分析與告警判定清單' : 'Comprehensive Node Metrics & Alert Diagnosis Table'}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">{isZh ? '節點名稱' : 'Node'}</th>
                    <th className="pb-3 px-3">{isZh ? '角色類型' : 'Role'}</th>
                    <th className="pb-3 px-3">IP</th>
                    <th className="pb-3 px-3">CPU</th>
                    <th className="pb-3 px-3">RAM</th>
                    <th className="pb-3 px-3">{isZh ? '磁碟' : 'Disk'}</th>
                    <th className="pb-3 px-3">{isZh ? '總流量' : 'Traffic'}</th>
                    <th className="pb-3 px-3">{isZh ? '閥值判定' : 'Alert Evaluation'}</th>
                    <th className="pb-3 px-3 text-right">{isZh ? '處置建議' : 'Recommendation'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {nodes.map(node => {
                    const alerts = getNodeAlerts(node);
                    return (
                      <tr key={node.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                          <Server size={14} className="text-gray-400" />
                          {node.name}
                        </td>
                        <td className="py-3.5 px-3 text-gray-400">{node.type}</td>
                        <td className="py-3.5 px-3 text-gray-500">{node.ip}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${node.cpu >= thresholds.cpuCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-200'}`}>
                            {node.cpu}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${node.ram >= thresholds.ramCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-200'}`}>
                            {node.ram}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-gray-300">{node.disk}%</td>
                        <td className="py-3.5 px-3 text-emerald-400 font-bold">
                          {(node.traffic.tcp + node.traffic.udp + node.traffic.agent).toFixed(1)} Mbps
                        </td>
                        <td className="py-3.5 px-3">
                          {alerts.length === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-sans text-[11px] font-bold">
                              ✓ {isZh ? '指標正常' : 'Healthy'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-sans text-[11px] font-bold flex items-center gap-1 w-fit">
                              <AlertTriangle size={12} />
                              {alerts.map(a => `${a.metric} ${a.level}`).join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-sans text-[11px]">
                          {node.cpu >= thresholds.cpuCritical 
                            ? (isZh ? '建議水平擴展 Worker 或分流工作負載' : 'Scale out worker or rebalance task')
                            : (isZh ? '運作狀態平穩，無須介入' : 'Optimal load')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW MODE: Go Collector Telemetry Dashboard */}
      {activeViewMode === 'telemetry' && (
        <CollectorTelemetryDashboard />
      )}

      {/* MAIN VIEW MODE 3: Core Engine (Go Ingest + Rust Storage) */}
      {activeViewMode === 'engine' && (
        <EngineArchitectureView />
      )}

      {/* METRICS & ALERT THRESHOLDS CONFIG MODAL */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400">
                    <Sliders size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {isZh ? '平台效能指標與管理者告警門檻設定' : 'Platform Metrics & Admin Alert Thresholds'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isZh ? '自訂所有節點的資源警戒閥值、持續超標判定與管理者通訊通知管道' : 'Configure node resource thresholds, evaluation windows & notification channels'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="px-6 pt-4 border-b border-gray-800 flex gap-2 bg-black/20 overflow-x-auto">
                <button
                  onClick={() => setConfigModalTab('thresholds')}
                  className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    configModalTab === 'thresholds'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Cpu size={14} />
                  {isZh ? '資源告警閥值' : 'Resource Thresholds'}
                </button>
                <button
                  onClick={() => setConfigModalTab('notifications')}
                  className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    configModalTab === 'notifications'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Mail size={14} />
                  {isZh ? '管理者通報管道' : 'Notification Channels'}
                </button>
                <button
                  onClick={() => setConfigModalTab('overrides')}
                  className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    configModalTab === 'overrides'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Server size={14} />
                  {isZh ? '個別節點微調' : 'Node Overrides'}
                </button>
                <button
                  onClick={() => setConfigModalTab('test')}
                  className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    configModalTab === 'test'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Send size={14} />
                  {isZh ? '告警測試與日誌' : 'Test & Simulation'}
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {/* TAB 1: Resource Thresholds */}
                {configModalTab === 'thresholds' && (
                  <div className="space-y-6">
                    {/* CPU Thresholds */}
                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-400">
                          <Cpu size={18} />
                          <h4 className="text-sm font-bold text-white">{isZh ? 'CPU 負載告警門檻' : 'CPU Load Thresholds'}</h4>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">範圍: 10% ~ 99%</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400 font-bold flex justify-between">
                            <span>{isZh ? '警告門檻 (Warning)' : 'Warning Threshold'}</span>
                            <span className="text-amber-400 font-mono font-bold">{tempThresholds.cpuWarning}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="30" 
                            max="90" 
                            value={tempThresholds.cpuWarning} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, cpuWarning: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400 font-bold flex justify-between">
                            <span>{isZh ? '嚴重/緊急門檻 (Critical)' : 'Critical Threshold'}</span>
                            <span className="text-red-400 font-mono font-bold">{tempThresholds.cpuCritical}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="50" 
                            max="99" 
                            value={tempThresholds.cpuCritical} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, cpuCritical: Number(e.target.value) })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400 font-bold flex justify-between">
                            <span>{isZh ? '持續判定時間' : 'Evaluation Window'}</span>
                            <span className="text-purple-300 font-mono font-bold">{tempThresholds.cpuDurationMinutes} {isZh ? '分鐘' : 'min'}</span>
                          </label>
                          <select
                            value={tempThresholds.cpuDurationMinutes}
                            onChange={(e) => setTempThresholds({ ...tempThresholds, cpuDurationMinutes: Number(e.target.value) })}
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                          >
                            <option value={1}>持續超標 1 分鐘</option>
                            <option value={3}>持續超標 3 分鐘 (推薦)</option>
                            <option value={5}>持續超標 5 分鐘</option>
                            <option value={10}>持續超標 10 分鐘</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* RAM Thresholds */}
                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Database size={18} />
                          <h4 className="text-sm font-bold text-white">{isZh ? '記憶體 (RAM) 耗盡警戒門檻' : 'RAM Exhaustion Thresholds'}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400 font-bold flex justify-between">
                            <span>{isZh ? '警告門檻 (Warning)' : 'Warning Threshold'}</span>
                            <span className="text-amber-400 font-mono font-bold">{tempThresholds.ramWarning}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="40" 
                            max="90" 
                            value={tempThresholds.ramWarning} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, ramWarning: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400 font-bold flex justify-between">
                            <span>{isZh ? '嚴重門檻 (Critical)' : 'Critical Threshold'}</span>
                            <span className="text-red-400 font-mono font-bold">{tempThresholds.ramCritical}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="60" 
                            max="99" 
                            value={tempThresholds.ramCritical} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, ramCritical: Number(e.target.value) })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Disk & Network Thresholds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <HardDrive size={18} />
                          <h4 className="text-sm font-bold text-white">{isZh ? '磁碟空間警戒 (Disk)' : 'Disk Capacity'}</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{isZh ? '嚴重滿載門檻' : 'Critical Threshold'}</span>
                            <span className="text-red-400 font-mono font-bold">{tempThresholds.diskCritical}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="70" 
                            max="99" 
                            value={tempThresholds.diskCritical} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, diskCritical: Number(e.target.value) })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Wifi size={18} />
                          <h4 className="text-sm font-bold text-white">{isZh ? '單節點頻寬上限 (Traffic)' : 'Traffic Surge'}</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{isZh ? '異常突波門檻 (Mbps)' : 'Surge Limit (Mbps)'}</span>
                            <span className="text-emerald-400 font-mono font-bold">{tempThresholds.trafficCriticalMbps} Mbps</span>
                          </div>
                          <input 
                            type="range" 
                            min="50" 
                            max="500" 
                            step="10"
                            value={tempThresholds.trafficCriticalMbps} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, trafficCriticalMbps: Number(e.target.value) })}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Notification Channels */}
                {configModalTab === 'notifications' && (
                  <div className="space-y-5">
                    {/* Email / SMTP Configuration */}
                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Mail className="w-5 h-5 text-purple-400" />
                          <div>
                            <h4 className="text-sm font-bold text-white">{isZh ? '管理者 Email / SMTP 通報' : 'Admin Email Notification'}</h4>
                            <p className="text-[11px] text-gray-400">{isZh ? '當節點達到警告或臨界閥值時，即刻發送詳細診斷郵件' : 'Dispatch diagnostics email when threshold is breached'}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={tempThresholds.enableEmail} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, enableEmail: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {tempThresholds.enableEmail && (
                        <div className="space-y-2 pt-2 border-t border-gray-800/80">
                          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                            {isZh ? '管理者收件人清單 (逗號分隔)' : 'Admin Recipient List (Comma-separated)'}
                          </label>
                          <input 
                            type="text" 
                            value={tempThresholds.emailRecipients}
                            onChange={(e) => setTempThresholds({ ...tempThresholds, emailRecipients: e.target.value })}
                            placeholder="admin@corp.internal, soc-oncall@corp.internal"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {/* Webhook (Slack / MS Teams / Discord) */}
                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Zap className="w-5 h-5 text-indigo-400" />
                          <div>
                            <h4 className="text-sm font-bold text-white">{isZh ? '即時通訊 Webhook (Slack / MS Teams / Telegram)' : 'Instant Messaging Webhook'}</h4>
                            <p className="text-[11px] text-gray-400">{isZh ? '推播格式化 JSON 卡片至 SOC 運維專用頻道' : 'Push formatted alert cards to operational channels'}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={tempThresholds.enableWebhook} 
                            onChange={(e) => setTempThresholds({ ...tempThresholds, enableWebhook: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      {tempThresholds.enableWebhook && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-800/80">
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-bold text-gray-300">Webhook URL</label>
                            <input 
                              type="text" 
                              value={tempThresholds.webhookUrl}
                              onChange={(e) => setTempThresholds({ ...tempThresholds, webhookUrl: e.target.value })}
                              placeholder="https://hooks.slack.com/services/..."
                              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-300">{isZh ? '頻道名稱' : 'Channel'}</label>
                            <input 
                              type="text" 
                              value={tempThresholds.webhookChannel}
                              onChange={(e) => setTempThresholds({ ...tempThresholds, webhookChannel: e.target.value })}
                              placeholder="#infra-alerts"
                              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-300">{isZh ? '告警冷卻防風暴' : 'Cooldown / Throttle'}</label>
                            <select
                              value={tempThresholds.alertCooldownMinutes}
                              onChange={(e) => setTempThresholds({ ...tempThresholds, alertCooldownMinutes: Number(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            >
                              <option value={5}>5 分鐘內不重複推播</option>
                              <option value={15}>15 分鐘冷卻 (推薦)</option>
                              <option value={30}>30 分鐘冷卻</option>
                              <option value={60}>60 分鐘冷卻</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: Node Overrides */}
                {configModalTab === 'overrides' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400">
                      {isZh 
                        ? '可針對特定節點（例如主控 Master 節點需特別嚴格把關，運算 Work 節點容許較高工作負載）設定專屬臨界值：' 
                        : 'Configure custom threshold overrides for specific high-priority nodes (e.g. Master Node):'}
                    </p>

                    <div className="space-y-3">
                      {nodes.map(node => {
                        const override = tempThresholds.nodeOverrides[node.id] || {};
                        return (
                          <div key={node.id} className="bg-black/40 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Server size={18} className={node.rawType === 'Master Node' ? 'text-purple-400' : 'text-gray-400'} />
                              <div>
                                <h5 className="text-xs font-bold text-white">{node.name}</h5>
                                <p className="text-[10px] text-gray-500">{node.type} ({node.ip})</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">CPU 門檻:</span>
                                <input 
                                  type="number" 
                                  min="40" 
                                  max="99"
                                  value={override.cpuCritical ?? tempThresholds.cpuCritical}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTempThresholds({
                                      ...tempThresholds,
                                      nodeOverrides: {
                                        ...tempThresholds.nodeOverrides,
                                        [node.id]: { ...override, cpuCritical: val }
                                      }
                                    });
                                  }}
                                  className="w-16 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-center text-purple-300 font-mono font-bold"
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">RAM 門檻:</span>
                                <input 
                                  type="number" 
                                  min="40" 
                                  max="99"
                                  value={override.ramCritical ?? tempThresholds.ramCritical}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTempThresholds({
                                      ...tempThresholds,
                                      nodeOverrides: {
                                        ...tempThresholds.nodeOverrides,
                                        [node.id]: { ...override, ramCritical: val }
                                      }
                                    });
                                  }}
                                  className="w-16 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-center text-cyan-300 font-mono font-bold"
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: Test & Simulation */}
                {configModalTab === 'test' && (
                  <div className="space-y-4">
                    <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Send size={16} className="text-purple-400" />
                          {isZh ? '管理者告警發送模擬測試' : 'Admin Alert Simulation Test'}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {isZh ? '手動觸發一筆效能超標事件，驗證 Email 與 Webhook 是否能正確傳遞給管理者' : 'Trigger a test threshold event to verify email & webhook dispatch'}
                        </p>
                      </div>
                      <button
                        onClick={handleSendTestAlert}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 whitespace-nowrap self-start sm:self-center"
                      >
                        <Zap size={14} />
                        <span>{isZh ? '立刻發送測試告警' : 'Dispatch Test Alert'}</span>
                      </button>
                    </div>

                    {testAlertLog.length > 0 && (
                      <div className="bg-black/60 border border-gray-800 rounded-2xl p-4 font-mono text-[11px] space-y-1.5 custom-scrollbar max-h-56 overflow-y-auto">
                        <div className="text-gray-500 font-bold uppercase text-[10px] pb-1 border-b border-gray-800 mb-2">
                          [Alert Dispatch Engine Console]
                        </div>
                        {testAlertLog.map((log, i) => (
                          <div key={i} className={log.includes('[SUCCESS]') ? 'text-emerald-400 font-bold' : log.includes('[METRICS]') ? 'text-amber-400' : 'text-gray-300'}>
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-800 flex items-center justify-between bg-black/40">
                <button
                  onClick={handleResetThresholds}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>{isZh ? '重設為預設值' : 'Reset Defaults'}</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    {isZh ? '取消' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveThresholds}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>{isZh ? '儲存指標與告警門檻' : 'Save Thresholds'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

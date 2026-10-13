import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert, Activity, Globe, Flame, AlertTriangle, Layers,
  Filter, Search, RefreshCw, Download, ArrowUpRight, ArrowDownRight,
  ChevronRight, ExternalLink, Zap, Shield, CheckCircle2, XCircle,
  Eye, Terminal, Play, RotateCcw, Sliders, Info, HardDrive, Cpu,
  Server, Lock, Unlock, Wifi, CornerDownRight, FileText, Check, X,
  Radio, BarChart2, Hash, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { siemService } from '../services/siemService';
import { cn } from '../lib/utils';

// Types
export interface NdrAlertItem {
  id: string;
  ruleId: string;
  ruleName: string;
  patternType: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  protocol: 'TCP' | 'UDP' | 'TLS/HTTPS' | 'DNS' | 'ICMP' | 'SSH' | 'HTTP';
  srcIp: string;
  srcPort: number;
  srcCountry: string;
  srcCountryCode: string;
  srcFlag: string;
  srcCity: string;
  srcAsn: string;
  dstIp: string;
  dstPort: number;
  dstCountry: string;
  dstCountryCode: string;
  dstFlag: string;
  timestamp: string;
  duration: string;
  bytesTransferred: string;
  bytesNumeric: number;
  packetsCount: number;
  throughput: string;
  throughputMbps: number;
  mitreTactic: string;
  mitreTechnique: string;
  payloadSnippet: string;
  ja3Hash?: string;
  ruleThresholdViolated: string;
  status: 'Active' | 'Investigating' | 'Mitigated' | 'Resolved';
  actionTaken: string;
}

export interface RuleViolationSummary {
  ruleId: string;
  ruleName: string;
  patternType: string;
  severity: string;
  count: number;
  percentage: number;
  affectedHostsCount: number;
  topProtocol: string;
  topGeo: string;
  lastTriggered: string;
  thresholdInfo: string;
}

export interface SeverityDist {
  severity: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

export interface ProtocolDist {
  protocol: string;
  count: number;
  volumeMb: number;
  percentage: number;
  color: string;
}

export interface GeoDist {
  country: string;
  countryCode: string;
  flag: string;
  count: number;
  inbound: number;
  outbound: number;
  percentage: number;
  threatScore: number;
}

export interface TimeSeriesDist {
  time: string;
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
  total: number;
  bandwidthMbps: number;
}

interface AnalyticsData {
  summary: {
    totalAlerts: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    activeThreats: number;
    mitigatedCount: number;
    totalBandwidthBurstGbps: string;
    uniqueThreatActors: number;
    lastUpdatedAt: string;
  };
  distributions: {
    severity: SeverityDist[];
    protocol: ProtocolDist[];
    geo: GeoDist[];
    timeSeries: TimeSeriesDist[];
  };
  ruleViolations: RuleViolationSummary[];
  alerts: NdrAlertItem[];
}

export const NDRAlertAnalyticsView: React.FC<{ onNavigateToRuleSettings?: () => void }> = ({ onNavigateToRuleSettings }) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  // State Filters
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data & Loading state
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(new Date().toLocaleTimeString());

  // Interactive Drilldown Modal & Simulation Modal
  const [inspectedAlert, setInspectedAlert] = useState<NdrAlertItem | null>(null);
  const [isSimulatingModalOpen, setIsSimulatingModalOpen] = useState<boolean>(false);
  const [simRuleId, setSimRuleId] = useState<string>('ndr-rule-bandwidth-burst');
  const [simProtocol, setSimProtocol] = useState<string>('TCP');
  const [simSeverity, setSimSeverity] = useState<string>('Critical');
  const [simulatingLoading, setSimulatingLoading] = useState<boolean>(false);

  // Mitigation state feedback
  const [mitigationFeedback, setMitigationFeedback] = useState<string | null>(null);

  // Fetch Analytics Data
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const res = await siemService.getNdrAlertAnalytics({
        timeRange,
        severity: selectedSeverity,
        protocol: selectedProtocol,
        country: selectedCountry,
        ruleId: selectedRuleId,
        search: searchQuery
      });
      if (res && res.success) {
        setData(res);
        setLastRefreshedTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load NDR alert analytics:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [timeRange, selectedSeverity, selectedProtocol, selectedCountry, selectedRuleId, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Execute Mitigation Action
  const handleMitigate = async (alertId: string, action: string, notes?: string) => {
    try {
      const res = await siemService.mitigateNdrAlert(alertId, action, notes);
      if (res.success) {
        setMitigationFeedback(res.message);
        setTimeout(() => setMitigationFeedback(null), 4000);
        // Update inspected alert if open
        if (inspectedAlert && inspectedAlert.id === alertId) {
          setInspectedAlert(res.alert);
        }
        // Refresh data quietly
        fetchData(true);
      }
    } catch (err: any) {
      console.error('Mitigation failed:', err);
      setMitigationFeedback(err?.response?.data?.error || '處置操作失敗');
      setTimeout(() => setMitigationFeedback(null), 4000);
    }
  };

  // Execute Simulation
  const handleSimulateViolation = async () => {
    setSimulatingLoading(true);
    try {
      const res = await siemService.simulateNdrRuleViolation({
        ruleId: simRuleId,
        customProtocol: simProtocol,
        customSeverity: simSeverity
      });
      if (res.success) {
        setIsSimulatingModalOpen(false);
        setMitigationFeedback(`已成功模擬注入流量違規事件: ${res.alert.id} (${res.alert.ruleName})`);
        setTimeout(() => setMitigationFeedback(null), 5000);
        await fetchData(true);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulatingLoading(false);
    }
  };

  // Reset all drilldown filters
  const resetAllFilters = () => {
    setSelectedSeverity('ALL');
    setSelectedProtocol('ALL');
    setSelectedCountry('ALL');
    setSelectedRuleId('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedSeverity !== 'ALL' || selectedProtocol !== 'ALL' || selectedCountry !== 'ALL' || selectedRuleId !== 'ALL' || searchQuery !== '';

  // Export CSV Report
  const handleExportCsv = () => {
    if (!data || !data.alerts.length) return;
    const headers = ['AlertID', 'Timestamp', 'RuleID', 'RuleName', 'Severity', 'Protocol', 'Source_IP', 'Source_Country', 'Dest_IP', 'Dest_Port', 'Throughput', 'Status', 'Violation_Condition'];
    const rows = data.alerts.map(a => [
      a.id,
      a.timestamp,
      a.ruleId,
      `"${a.ruleName.replace(/"/g, '""')}"`,
      a.severity,
      a.protocol,
      a.srcIp,
      `"${a.srcCountry}"`,
      a.dstIp,
      a.dstPort,
      a.throughput,
      a.status,
      `"${a.ruleThresholdViolated.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `semor_ndr_alert_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6 font-sans">
      {/* Top Banner / Feedback Alert */}
      {mitigationFeedback && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-lg shadow-xl shadow-emerald-950/40 backdrop-blur-md animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{mitigationFeedback}</span>
          <button onClick={() => setMitigationFeedback(null)} className="ml-2 text-emerald-400/70 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <span>NDR Flow Security</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span>Traffic Telemetry</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-300 font-semibold">{isZh ? '流量告警多維分析' : 'Alert Analytics'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart2 className="w-7 h-7 text-cyan-400" />
            {isZh ? 'NDR 流量告警分析與違規下鑽 (Alert Analytics)' : 'NDR Alert Analytics & Rule Drilldown'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isZh 
              ? '視覺化全網網路流量告警之嚴重性、通訊協定與地理來源分佈，支援即時跨維度交叉下鑽與違規流量深度取證處置。' 
              : 'Multi-dimensional visualization of network traffic alerts by severity, protocol, and geographical source with instant rule violation drilldown.'}
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-medium">
            {['1h', '6h', '24h', '7d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors',
              autoRefresh 
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400'
            )}
            title="Toggle 20s auto-refresh"
          >
            <Radio className={cn('w-3.5 h-3.5', autoRefresh ? 'animate-pulse text-emerald-400' : 'text-slate-500')} />
            <span>{autoRefresh ? (isZh ? '自動更新' : 'Auto 20s') : (isZh ? '已暫停' : 'Paused')}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin text-cyan-400')} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZh ? '匯出報表' : 'Export CSV'}</span>
          </button>

          {/* Simulate Alert Button */}
          <button
            onClick={() => setIsSimulatingModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-900/20 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-200 fill-cyan-200" />
            <span>{isZh ? '模擬流量違規' : 'Simulate Spike'}</span>
          </button>

          {/* Link to Rules Settings */}
          {onNavigateToRuleSettings && (
            <button
              onClick={onNavigateToRuleSettings}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isZh ? '規則門檻配置' : 'Rule Thresholds'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium">{isZh ? '總流量告警數' : 'Total Alerts'}</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {data?.summary.totalAlerts ?? 0}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>{data?.summary.activeThreats ?? 0} {isZh ? '件活躍監控' : 'Active'}</span>
          </div>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-red-950/60 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-xs text-red-300 font-medium">{isZh ? '嚴重危害 (Critical)' : 'Critical Threats'}</div>
          <div className="text-2xl font-bold text-red-400 mt-1 font-mono">
            {data?.summary.criticalCount ?? 0}
          </div>
          <div className="text-[11px] text-red-400/80 mt-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500" />
            <span>{isZh ? '需立即處置' : 'Immediate Action'}</span>
          </div>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-950/60 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-xs text-amber-300 font-medium">{isZh ? '高危威脅 (High)' : 'High Severity'}</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {data?.summary.highCount ?? 0}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{isZh ? 'C2/DNS 隧道潛伏' : 'C2 & Tunnels'}</span>
          </div>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium">{isZh ? '主要攻擊通訊協定' : 'Top Protocol'}</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
            {data?.distributions.protocol[0]?.protocol || 'TCP'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {data?.distributions.protocol[0]?.count ?? 0} {isZh ? '筆事件' : 'violations'} ({data?.distributions.protocol[0]?.percentage ?? 0}%)
          </div>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium">{isZh ? '主要來源國別' : 'Top Geo Source'}</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1 flex items-center gap-1.5 font-mono">
            <span>{data?.distributions.geo[0]?.flag || '🌐'}</span>
            <span>{data?.distributions.geo[0]?.countryCode || 'N/A'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {data?.distributions.geo[0]?.country || 'Unknown'} ({data?.distributions.geo[0]?.count ?? 0})
          </div>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
            <Globe className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-950/60 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-xs text-emerald-300 font-medium">{isZh ? '已防護處置事件' : 'Mitigated / Drop'}</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {data?.summary.mitigatedCount ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isZh ? '防火牆/EDR 已攔截' : 'Enforced'}</span>
          </div>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Active Drilldown Filter Indicator & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            {isZh ? '目前下鑽條件:' : 'Active Filters:'}
          </span>

          {selectedSeverity !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-950/50 border border-red-600/50 text-red-300">
              <span>{isZh ? '嚴重性:' : 'Severity:'} {selectedSeverity}</span>
              <button onClick={() => setSelectedSeverity('ALL')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedProtocol !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-950/50 border border-indigo-600/50 text-indigo-300">
              <span>{isZh ? '協定:' : 'Proto:'} {selectedProtocol}</span>
              <button onClick={() => setSelectedProtocol('ALL')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCountry !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/50 border border-cyan-600/50 text-cyan-300">
              <span>{isZh ? '來源國:' : 'Geo:'} {selectedCountry}</span>
              <button onClick={() => setSelectedCountry('ALL')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedRuleId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-950/50 border border-purple-600/50 text-purple-300">
              <span>{isZh ? '違規規則:' : 'Rule:'} {data?.ruleViolations.find(r => r.ruleId === selectedRuleId)?.ruleName || selectedRuleId}</span>
              <button onClick={() => setSelectedRuleId('ALL')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {!hasActiveFilters && (
            <span className="text-slate-500 italic">
              {isZh ? '顯示全量告警分佈 (點擊圖表長條或圓餅切片可即時下鑽篩選)' : 'Showing all alerts. Click any chart element to drill down.'}
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {isZh ? '清除所有篩選' : 'Clear All'}
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={isZh ? '搜尋 IP / 規則 / 酬載 / MITRE...' : 'Search IP, rule, payload, MITRE...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Visualizations Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Severity Distribution (Donut Chart) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                {isZh ? '告警嚴重性分佈 (Severity Distribution)' : 'Alerts by Severity'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isZh ? '依威脅影響層級劃分 (點擊切片可下鑽過濾)' : 'Distribution across Critical, High, Medium, Low'}
              </p>
            </div>
            {selectedSeverity !== 'ALL' && (
              <button 
                onClick={() => setSelectedSeverity('ALL')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {isZh ? '重設' : 'Reset'}
              </button>
            )}
          </div>

          {/* Recharts Pie/Donut */}
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.distributions.severity || []}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const sev = entry?.severity || entry?.payload?.severity;
                    if (sev) setSelectedSeverity(sev === selectedSeverity ? 'ALL' : sev);
                  }}
                >
                  {(data?.distributions.severity || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#0f172a" 
                      strokeWidth={selectedSeverity === entry.severity ? 3 : 1}
                      opacity={selectedSeverity === 'ALL' || selectedSeverity === entry.severity ? 1 : 0.4}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as SeverityDist;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span>{d.severity}</span>
                          </div>
                          <div className="text-slate-300 font-mono">
                            {d.count} {isZh ? '筆告警' : 'alerts'} ({d.percentage}%)
                          </div>
                          <div className="text-[10px] text-slate-400">{d.description}</div>
                          <div className="text-[10px] text-cyan-400 mt-1 italic">
                            {isZh ? '點擊鎖定下鑽' : 'Click to drilldown'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Count Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-white">{data?.summary.totalAlerts ?? 0}</span>
              <span className="text-[10px] uppercase text-slate-400 tracking-wider">Alerts</span>
            </div>
          </div>

          {/* Interactive Severity Badges */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/80">
            {(data?.distributions.severity || []).map((s) => {
              const isSelected = selectedSeverity === s.severity;
              return (
                <button
                  key={s.severity}
                  onClick={() => setSelectedSeverity(isSelected ? 'ALL' : s.severity)}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border text-xs transition-all text-left',
                    isSelected 
                      ? 'bg-slate-800 border-cyan-500 shadow-sm' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-slate-200">{s.severity}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-300">{s.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Protocol Distribution (Bar Chart) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                {isZh ? '通訊協定分佈 (Protocol Breakdown)' : 'Alerts by Protocol'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isZh ? 'TCP, TLS, UDP, DNS, ICMP 等流量分析 (點擊長條可下鑽)' : 'Violation volume and alert occurrences by protocol'}
              </p>
            </div>
            {selectedProtocol !== 'ALL' && (
              <button 
                onClick={() => setSelectedProtocol('ALL')}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                {isZh ? '重設' : 'Reset'}
              </button>
            )}
          </div>

          {/* Recharts BarChart */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.distributions.protocol || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="protocol" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as ProtocolDist;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span>{d.protocol}</span>
                          </div>
                          <div className="text-slate-300 font-mono">
                            {d.count} {isZh ? '次違規告警' : 'violations'} ({d.percentage}%)
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono">
                            {isZh ? '累積吞吐資料量:' : 'Volume:'} {d.volumeMb} MB
                          </div>
                          <div className="text-[10px] text-indigo-400 mt-1 italic">
                            {isZh ? '點擊此長條進行下鑽' : 'Click bar to filter'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]} 
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const proto = entry?.protocol || entry?.payload?.protocol;
                    if (proto) setSelectedProtocol(proto === selectedProtocol ? 'ALL' : proto);
                  }}
                >
                  {(data?.distributions.protocol || []).map((entry, index) => (
                    <Cell 
                      key={`bar-${index}`} 
                      fill={entry.color}
                      opacity={selectedProtocol === 'ALL' || selectedProtocol === entry.protocol ? 1 : 0.35}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Protocol Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2 pt-3 border-t border-slate-800/80">
            {(data?.distributions.protocol || []).slice(0, 6).map((p) => (
              <button
                key={p.protocol}
                onClick={() => setSelectedProtocol(selectedProtocol === p.protocol ? 'ALL' : p.protocol)}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-mono border transition-all flex items-center gap-1',
                  selectedProtocol === p.protocol
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                <span>{p.protocol}</span>
                <span className="text-slate-500">({p.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Geographical Source Distribution (Horizontal Bar Chart) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                {isZh ? '地理來源分佈 (Geographical Origin)' : 'Alerts by Geo Source'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isZh ? '來源國與進出境威脅度分佈 (點擊國別可下鑽)' : 'Top originating countries and inbound/outbound ratio'}
              </p>
            </div>
            {selectedCountry !== 'ALL' && (
              <button 
                onClick={() => setSelectedCountry('ALL')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {isZh ? '重設' : 'Reset'}
              </button>
            )}
          </div>

          {/* Recharts Horizontal BarChart */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={(data?.distributions.geo || []).slice(0, 5)}
                margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <YAxis 
                  dataKey="countryCode" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as GeoDist;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span className="text-base">{d.flag}</span>
                            <span>{d.country} ({d.countryCode})</span>
                          </div>
                          <div className="text-slate-300 font-mono">
                            {isZh ? '告警次數:' : 'Alerts:'} {d.count} ({d.percentage}%)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isZh ? '進線攻擊:' : 'Inbound:'} {d.inbound} | {isZh ? '出境連線:' : 'Outbound:'} {d.outbound}
                          </div>
                          <div className="text-[10px] text-red-400 font-mono">
                            {isZh ? '威脅評分 (Risk Index):' : 'Risk Index:'} {d.threatScore} / 100
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#06b6d4" 
                  radius={[0, 4, 4, 0]} 
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const code = entry?.countryCode || entry?.payload?.countryCode;
                    if (code) setSelectedCountry(code === selectedCountry ? 'ALL' : code);
                  }}
                >
                  {(data?.distributions.geo || []).slice(0, 5).map((entry, index) => (
                    <Cell 
                      key={`geo-${index}`} 
                      fill={entry.threatScore > 85 ? '#ef4444' : entry.threatScore > 75 ? '#f59e0b' : '#06b6d4'}
                      opacity={selectedCountry === 'ALL' || selectedCountry === entry.countryCode ? 1 : 0.35}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Geo Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2 pt-3 border-t border-slate-800/80">
            {(data?.distributions.geo || []).slice(0, 5).map((g) => (
              <button
                key={g.countryCode}
                onClick={() => setSelectedCountry(selectedCountry === g.countryCode ? 'ALL' : g.countryCode)}
                className={cn(
                  'px-2 py-1 rounded text-[11px] border transition-all flex items-center gap-1',
                  selectedCountry === g.countryCode
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                <span>{g.flag}</span>
                <span>{g.countryCode}</span>
                <span className="text-slate-500">({g.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Timeline Alert Velocity & Throughput Trend (Full Width Area Chart) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {isZh ? '流量告警時序分佈與吞吐量洪峰趨勢 (Alert Velocity & Bandwidth Trend)' : 'Alert Timeline & Bandwidth Velocity'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isZh ? '24 小時嚴重性堆疊分佈與即時吞吐量曲線 (Mbps)' : 'Hourly stacked alert distribution with correlated Mbps bandwidth trajectory'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Critical
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> High
            </span>
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400" /> Throughput (Mbps)
            </span>
          </div>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data?.distributions.timeSeries || []}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as TimeSeriesDist;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
                        <div className="font-semibold text-white font-mono border-b border-slate-800 pb-1">
                          {isZh ? '時間段:' : 'Time:'} {label}
                        </div>
                        <div className="text-red-400 font-mono flex items-center justify-between gap-4">
                          <span>Critical:</span> <span className="font-bold">{d.Critical}</span>
                        </div>
                        <div className="text-amber-400 font-mono flex items-center justify-between gap-4">
                          <span>High:</span> <span className="font-bold">{d.High}</span>
                        </div>
                        <div className="text-yellow-400 font-mono flex items-center justify-between gap-4">
                          <span>Medium:</span> <span className="font-bold">{d.Medium}</span>
                        </div>
                        <div className="text-cyan-400 font-mono flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                          <span>Throughput:</span> <span className="font-bold">{d.bandwidthMbps} Mbps</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="Critical" 
                stackId="1" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorCritical)" 
              />
              <Area 
                type="monotone" 
                dataKey="High" 
                stackId="1" 
                stroke="#f97316" 
                fillOpacity={1} 
                fill="url(#colorHigh)" 
              />
              <Area 
                type="monotone" 
                dataKey="Medium" 
                stackId="1" 
                stroke="#eab308" 
                fillOpacity={1} 
                fill="url(#colorMedium)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Rule Violations Drilldown Selector Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              {isZh ? '特定流量違規規則下鑽 (Drill Down by Rule Violations)' : 'Drill Down by Rule Violations'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isZh ? '點擊任一規則卡片可立即隔離該規則之所有違規流量與取證紀錄' : 'Click a rule card to isolate its specific alerts and forensic telemetry.'}
            </p>
          </div>
          {selectedRuleId !== 'ALL' && (
            <button
              onClick={() => setSelectedRuleId('ALL')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>{isZh ? '重設規則過濾' : 'Reset Rule Filter'}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data?.ruleViolations || []).map((rule) => {
            const isSelected = selectedRuleId === rule.ruleId;
            return (
              <div
                key={rule.ruleId}
                onClick={() => setSelectedRuleId(isSelected ? 'ALL' : rule.ruleId)}
                className={cn(
                  'p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group',
                  isSelected
                    ? 'bg-slate-900 border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-950/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider',
                      rule.severity === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800/40' :
                      rule.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' :
                      rule.severity === 'Medium' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800/40' :
                      'bg-blue-950 text-blue-300 border border-blue-800/40'
                    )}>
                      {rule.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                      <span className="text-purple-400">{rule.count}</span>
                      <span className="text-slate-500 text-[10px]">{isZh ? '次違規' : 'violations'}</span>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1">
                    {rule.ruleName}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                    <span className="text-slate-500">{rule.ruleId}</span>
                    <span>•</span>
                    <span className="text-cyan-400">{rule.patternType}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{rule.affectedHostsCount} {isZh ? '受影響端點' : 'hosts'}</span>
                  <span>{rule.topGeo}</span>
                  <span className="text-indigo-400">{rule.topProtocol}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Granular Traffic Alert Violations Table (Drilldown Detail List) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              {isZh ? '流量違規取證清單 (Traffic Violation Forensics)' : 'Traffic Violation Forensics List'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isZh ? `當前符合條件共 ${data?.alerts.length ?? 0} 筆告警，點擊任一行可開啟深層取證與即時響應抽屜` : `Showing ${data?.alerts.length ?? 0} matching alerts. Click any row to inspect & respond.`}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {isZh ? '最後更新時間:' : 'Updated:'} <span className="text-slate-200">{lastRefreshedTime}</span>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Alert ID</th>
                <th className="py-2.5 px-3">{isZh ? '違規時間' : 'Timestamp'}</th>
                <th className="py-2.5 px-3">{isZh ? '違規規則' : 'Violated Rule'}</th>
                <th className="py-2.5 px-3">{isZh ? '嚴重性' : 'Severity'}</th>
                <th className="py-2.5 px-3">{isZh ? '協定' : 'Proto'}</th>
                <th className="py-2.5 px-3">{isZh ? '來源來源地 / IP' : 'Source / Geo'}</th>
                <th className="py-2.5 px-3">{isZh ? '目的目標 / 埠號' : 'Destination / Port'}</th>
                <th className="py-2.5 px-3">{isZh ? '即時吞吐 / 傳輸' : 'Throughput / Bytes'}</th>
                <th className="py-2.5 px-3">{isZh ? '狀態 / 處置' : 'Status / Action'}</th>
                <th className="py-2.5 px-3 text-right">{isZh ? '操作' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.alerts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-mono">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    {isZh ? '無符合目前篩選條件的流量違規告警紀錄' : 'No alerts match the selected drilldown criteria.'}
                  </td>
                </tr>
              ) : (
                data?.alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setInspectedAlert(alert)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-cyan-400 whitespace-nowrap">
                      {alert.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <div className="font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {alert.ruleName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">
                        {alert.ruleThresholdViolated}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full font-mono',
                        alert.severity === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800/40' :
                        alert.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' :
                        alert.severity === 'Medium' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800/40' :
                        'bg-blue-950 text-blue-300 border border-blue-800/40'
                      )}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-400 font-semibold whitespace-nowrap">
                      {alert.protocol}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-slate-200">
                        <span>{alert.srcFlag}</span>
                        <span>{alert.srcIp}</span>
                        <span className="text-slate-500 text-[10px]">:{alert.srcPort}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {alert.srcCity || alert.srcCountry}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-slate-200">
                        <span>{alert.dstFlag}</span>
                        <span>{alert.dstIp}</span>
                        <span className="text-slate-500 text-[10px]">:{alert.dstPort}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono font-semibold text-cyan-300">
                        {alert.throughput}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {alert.bytesTransferred} ({alert.packetsCount.toLocaleString()} pkts)
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded-md inline-flex items-center gap-1',
                        alert.status === 'Active' ? 'bg-red-950/60 text-red-300 border border-red-800/40' :
                        alert.status === 'Investigating' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' :
                        'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', alert.status === 'Active' ? 'bg-red-400 animate-pulse' : alert.status === 'Investigating' ? 'bg-amber-400' : 'bg-emerald-400')} />
                        {alert.status}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5">
                        {alert.actionTaken}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedAlert(alert);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-medium transition-colors"
                      >
                        {isZh ? '深入取證' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Deep Forensic Drilldown Modal / Drawer */}
      {inspectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-base',
                  inspectedAlert.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-700' :
                  inspectedAlert.severity === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-700' :
                  'bg-yellow-950 text-yellow-400 border border-yellow-700'
                )}>
                  {inspectedAlert.severity[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">{inspectedAlert.id}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {inspectedAlert.protocol}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded font-mono',
                      inspectedAlert.status === 'Active' ? 'bg-red-950 text-red-300' :
                      inspectedAlert.status === 'Investigating' ? 'bg-amber-950 text-amber-300' :
                      'bg-emerald-950 text-emerald-300'
                    )}>
                      {inspectedAlert.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {inspectedAlert.ruleName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectedAlert(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Threshold Violation Callout */}
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{isZh ? '觸發門檻違規細節' : 'Rule Violation Condition'}</span>
                </div>
                <div className="text-sm font-semibold font-mono mt-1 text-white">
                  {inspectedAlert.ruleThresholdViolated}
                </div>
                <div className="text-xs text-red-300/80 mt-1">
                  {isZh ? '規則 ID:' : 'Rule ID:'} <span className="font-mono text-cyan-400">{inspectedAlert.ruleId}</span> | {isZh ? '模式類型:' : 'Pattern:'} {inspectedAlert.patternType}
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{isZh ? '瞬時吞吐量' : 'Peak Throughput'}</div>
                  <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{inspectedAlert.throughput}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{isZh ? '傳輸資料量' : 'Data Volume'}</div>
                  <div className="text-lg font-bold font-mono text-indigo-300 mt-0.5">{inspectedAlert.bytesTransferred}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{isZh ? '封包總數' : 'Packet Count'}</div>
                  <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">{inspectedAlert.packetsCount.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{isZh ? '連線時長' : 'Duration'}</div>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{inspectedAlert.duration}</div>
                </div>
              </div>

              {/* Endpoint Connection Map */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {isZh ? '連線雙端位址與地理資訊' : 'Connection Endpoints & Geo'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span>{inspectedAlert.srcFlag}</span>
                      <span>{isZh ? '來源端 (Source)' : 'Source Host'}</span>
                    </div>
                    <div className="font-mono text-sm font-bold text-white">{inspectedAlert.srcIp}:{inspectedAlert.srcPort}</div>
                    <div className="text-xs text-slate-400 mt-1">{inspectedAlert.srcCity}, {inspectedAlert.srcCountry}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{inspectedAlert.srcAsn}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-indigo-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span>{inspectedAlert.dstFlag}</span>
                      <span>{isZh ? '目的端 (Destination)' : 'Destination Host'}</span>
                    </div>
                    <div className="font-mono text-sm font-bold text-white">{inspectedAlert.dstIp}:{inspectedAlert.dstPort}</div>
                    <div className="text-xs text-slate-400 mt-1">{inspectedAlert.dstCountry}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Port {inspectedAlert.dstPort} ({inspectedAlert.protocol})</div>
                  </div>
                </div>
              </div>

              {/* MITRE ATT&CK & JA3 Fingerprint */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    MITRE ATT&CK Matrix Mapping
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Tactic:</span>
                      <span className="text-xs font-semibold text-purple-300 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 font-mono">
                        {inspectedAlert.mitreTactic}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Technique:</span>
                      <span className="text-xs font-semibold text-cyan-300 font-mono">
                        {inspectedAlert.mitreTechnique}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    TLS JA3 Fingerprint / Crypto
                  </div>
                  <div className="font-mono text-xs text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                    {inspectedAlert.ja3Hash || 'N/A (Cleartext or Raw Packet Stream)'}
                  </div>
                </div>
              </div>

              {/* Forensic Payload Snippet */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{isZh ? '封包深層鑑識截圖 (DPI Forensic Payload)' : 'Deep Packet Inspection Payload'}</span>
                  <span className="text-[11px] font-mono text-cyan-400">Hex / ASCII Preview</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {inspectedAlert.payloadSnippet}
                </div>
              </div>

              {/* Action Response Toolkit */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>{isZh ? '即時應急處置與 SOAR 聯動 (SOC Response Actions)' : 'SOAR & Mitigation Actions'}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handleMitigate(inspectedAlert.id, 'isolate_host', 'User manually triggered host quarantine from NDR drilldown')}
                    className="px-3 py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isZh ? '隔離內部端點 (EDR/NAC VLAN 999)' : 'Isolate Host'}</span>
                  </button>

                  <button
                    onClick={() => handleMitigate(inspectedAlert.id, 'block_ip', `Border drop applied for ${inspectedAlert.srcIp}`)}
                    className="px-3 py-2 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-700 text-orange-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{isZh ? '邊界防火牆阻斷來源 IP' : 'Block Source IP'}</span>
                  </button>

                  <button
                    onClick={() => handleMitigate(inspectedAlert.id, 'deploy_suricata', 'Dynamic Suricata drop signature generated')}
                    className="px-3 py-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isZh ? '動態部署 Suricata 攔截特徵' : 'Deploy Suricata Signature'}</span>
                  </button>

                  <button
                    onClick={() => handleMitigate(inspectedAlert.id, 'export_pcap', 'PCAP forensic stream dump requested')}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isZh ? '下載 PCAP 取證封包' : 'Dump PCAP Forensics'}</span>
                  </button>

                  <button
                    onClick={() => handleMitigate(inspectedAlert.id, 'resolve', 'Marked as resolved by analyst')}
                    className="px-3 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isZh ? '標記為已處置完成' : 'Mark as Resolved'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Simulate Violation Modal */}
      {isSimulatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                {isZh ? '模擬網路流量違規事件 (Simulate Traffic Violation)' : 'Simulate Traffic Violation'}
              </h3>
              <button onClick={() => setIsSimulatingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {isZh 
                ? '此功能將向後端發送即時流量洪峰或特定特徵封包，動態驗證 NDR 告警規則門檻並在 Recharts 圖表上呈現即時統計演變。' 
                : 'Inject a simulated network anomaly to test alert rules and verify real-time Recharts visualization.'}
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  {isZh ? '目標觸發告警規則:' : 'Target NDR Rule:'}
                </label>
                <select
                  value={simRuleId}
                  onChange={(e) => setSimRuleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {(data?.ruleViolations || []).map((r) => (
                    <option key={r.ruleId} value={r.ruleId}>
                      {r.ruleName} ({r.severity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    {isZh ? '通訊協定 (Protocol):' : 'Protocol:'}
                  </label>
                  <select
                    value={simProtocol}
                    onChange={(e) => setSimProtocol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {['TCP', 'TLS/HTTPS', 'UDP', 'DNS', 'ICMP', 'SSH'].map((proto) => (
                      <option key={proto} value={proto}>{proto}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    {isZh ? '嚴重等級 (Severity):' : 'Severity:'}
                  </label>
                  <select
                    value={simSeverity}
                    onChange={(e) => setSimSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {['Critical', 'High', 'Medium', 'Low'].map((sev) => (
                      <option key={sev} value={sev}>{sev}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsSimulatingModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleSimulateViolation}
                disabled={simulatingLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all"
              >
                {simulatingLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Zap className="w-4 h-4 fill-white" />
                )}
                <span>{isZh ? '立即觸發模擬違規' : 'Trigger Simulation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NDRAlertAnalyticsView;

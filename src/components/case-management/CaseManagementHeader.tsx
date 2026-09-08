import React from 'react';
import { 
  Layers, 
  Settings2, 
  Plus, 
  Download, 
  RotateCw, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Activity,
  Flame
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CaseFilterState, CaseIncident } from './types';

interface CaseManagementHeaderProps {
  currentMode: 'workspace' | 'studio';
  onChangeMode: (mode: 'workspace' | 'studio') => void;
  cases: CaseIncident[];
  filterState: CaseFilterState;
  onFilterChange: (filters: Partial<CaseFilterState>) => void;
  onOpenCreateModal: () => void;
  onExportReport: () => void;
  onRefresh: () => void;
  lastRefreshed: Date;
}

export const CaseManagementHeader: React.FC<CaseManagementHeaderProps> = ({
  currentMode,
  onChangeMode,
  cases,
  filterState,
  onFilterChange,
  onOpenCreateModal,
  onExportReport,
  onRefresh,
  lastRefreshed
}) => {
  // Compute SOC Metrics
  const activeCases = cases.filter(c => c.status !== 'Closed' && c.status !== 'False Positive');
  const criticalCount = activeCases.filter(c => c.severity === 'Critical').length;
  const slaBreachedOrRiskCount = activeCases.filter(c => c.sla.remainingMinutes <= 30).length;

  return (
    <div className="bg-[#111114] border border-gray-800 rounded-2xl p-4 lg:p-5 shadow-2xl space-y-4">
      {/* Top Row: Title + Mode Switcher + Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Module Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                SOAR 資安案件管理與應變處置中心
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                TheHive SIRP
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cortex SOAR v2.4
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              整合 EDR 遙測、網路封包 PCAP、身分驗證日誌與自動化應變劇本的一體化處置平台
            </p>
          </div>
        </div>

        {/* View Switcher & Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Tabs */}
          <div className="flex bg-black/60 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => onChangeMode('workspace')}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentMode === 'workspace'
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              案件作業與處置中心
            </button>
            <button
              onClick={() => onChangeMode('studio')}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentMode === 'studio'
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Settings2 className="w-3.5 h-3.5" />
              案件架構與流程設計器
            </button>
          </div>

          {/* New Incident Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            通報新案件
          </button>

          {/* Export Report */}
          <button
            onClick={onExportReport}
            className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold border border-gray-800 transition-colors"
            title="匯出案件稽核報告 (CSV)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold border border-gray-800 transition-colors"
            title={`同步最新狀態 (最後更新: ${lastRefreshed.toLocaleTimeString()})`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Realtime KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1 border-t border-gray-800/80">
        <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">處理中案件</span>
            <div className="text-xl font-black text-white mt-0.5">{activeCases.length} <span className="text-xs font-normal text-gray-500">件</span></div>
          </div>
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">P1 極高危案件</span>
            <div className="text-xl font-black text-red-400 mt-0.5">{criticalCount} <span className="text-xs font-normal text-red-400/70">件</span></div>
          </div>
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg animate-pulse">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">SLA 緊迫警戒 (&le;30分)</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">{slaBreachedOrRiskCount} <span className="text-xs font-normal text-amber-400/70">件</span></div>
          </div>
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">平均遏阻時效 (MTTR)</span>
            <div className="text-xl font-black text-purple-400 mt-0.5">38 <span className="text-xs font-normal text-gray-500">分鐘</span></div>
          </div>
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl col-span-2 sm:col-span-4 lg:col-span-1 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">劇本自動處置率</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">86.4% <span className="text-xs font-normal text-gray-500">自動化</span></div>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <RotateCw className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Pipeline (Shown in Workspace Mode) */}
      {currentMode === 'workspace' && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋案件編號、標題、資產、IP 或 MITRE 技法..."
                value={filterState.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="w-full bg-gray-900/80 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={filterState.severity}
              onChange={(e) => onFilterChange({ severity: e.target.value })}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">所有嚴重程度</option>
              <option value="Critical">Critical (極高風險)</option>
              <option value="High">High (高風險)</option>
              <option value="Medium">Medium (中等風險)</option>
              <option value="Low">Low (低風險)</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterState.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">所有處理狀態</option>
              <option value="Investigating">調查中 (Investigating)</option>
              <option value="Awaiting Approval">等待核准 (Awaiting Approval)</option>
              <option value="In Remediation">處置修復中 (In Remediation)</option>
              <option value="New">新進件 (New)</option>
              <option value="Closed">已結案 (Closed)</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterState.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">所有威脅分類</option>
              <option value="Ransomware">勒索軟體 (Ransomware)</option>
              <option value="APT C2">APT 外部 C2 (APT C2)</option>
              <option value="Privilege Escalation">特權提升 (Privilege Escalation)</option>
              <option value="Data Exfiltration">機密外洩 (Data Exfiltration)</option>
              <option value="Phishing">釣魚信件 (Phishing)</option>
            </select>
          </div>

          {/* Toggle for Only My Cases */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFilterChange({ onlyMyCases: !filterState.onlyMyCases })}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5",
                filterState.onlyMyCases
                  ? "bg-purple-600/20 text-purple-400 border-purple-500/40"
                  : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", filterState.onlyMyCases ? "bg-purple-400" : "bg-gray-600")} />
              只看我負責的案件
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

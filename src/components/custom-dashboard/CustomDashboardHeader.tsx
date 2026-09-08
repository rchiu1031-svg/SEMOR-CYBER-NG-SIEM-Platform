import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Settings2, 
  RefreshCw, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Download, 
  SlidersHorizontal, 
  ChevronDown, 
  FolderKanban, 
  Clock, 
  Server, 
  Search,
  Sparkles,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DashboardTemplate, GlobalFilterState } from './types';
import { 
  AVAILABLE_DATA_SOURCES, 
  TIME_RANGE_OPTIONS, 
  CLUSTER_OPTIONS, 
  REFRESH_OPTIONS 
} from './customDashboardData';

interface CustomDashboardHeaderProps {
  currentDashboard: DashboardTemplate;
  allDashboards: DashboardTemplate[];
  onSelectDashboard: (dashboardId: string) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenAddWidget: () => void;
  onOpenManageDashboards: () => void;
  filterState: GlobalFilterState;
  onFilterChange: (newFilters: Partial<GlobalFilterState>) => void;
  isKioskMode: boolean;
  onToggleKioskMode: () => void;
  onExportDashboard: () => void;
  lastRefreshed: Date;
  onManualRefresh: () => void;
  hasUnsavedChanges: boolean;
  onSaveDashboard: () => void;
}

export const CustomDashboardHeader: React.FC<CustomDashboardHeaderProps> = ({
  currentDashboard,
  allDashboards,
  onSelectDashboard,
  isEditMode,
  onToggleEditMode,
  onOpenAddWidget,
  onOpenManageDashboards,
  filterState,
  onFilterChange,
  isKioskMode,
  onToggleKioskMode,
  onExportDashboard,
  lastRefreshed,
  onManualRefresh,
  hasUnsavedChanges,
  onSaveDashboard
}) => {
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Dashboard Identity & Primary Actions */}
      <div className="bg-[#111114] border border-gray-800 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Dashboard Selector & Metadata */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <LayoutDashboard className="w-6 h-6" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
                className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-colors group text-left"
              >
                <span>{currentDashboard.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-transform duration-200" />
              </button>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {currentDashboard.category}
              </span>

              {hasUnsavedChanges && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                  未儲存變更 (Unsaved)
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              {currentDashboard.description}
            </p>

            {/* Dashboard Selector Dropdown */}
            {showDashboardDropdown && (
              <div 
                className="absolute left-0 top-full mt-2 w-96 bg-[#16161a] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden py-2"
                onMouseLeave={() => setShowDashboardDropdown(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 flex justify-between items-center">
                  <span>切換工作區儀表板 ({allDashboards.length})</span>
                  <button 
                    onClick={() => {
                      setShowDashboardDropdown(false);
                      onOpenManageDashboards();
                    }}
                    className="text-blue-400 hover:underline lowercase"
                  >
                    管理清單
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/60">
                  {allDashboards.map((dash) => {
                    const isSelected = dash.id === currentDashboard.id;
                    return (
                      <button
                        key={dash.id}
                        onClick={() => {
                          onSelectDashboard(dash.id);
                          setShowDashboardDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left p-3 hover:bg-gray-800/80 transition-colors flex items-start gap-3",
                          isSelected && "bg-blue-600/10 border-l-2 border-blue-500"
                        )}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          ) : (
                            <LayoutDashboard className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn("text-xs font-bold truncate", isSelected ? "text-blue-400" : "text-gray-200")}>
                              {dash.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono ml-2">
                              {dash.widgets.length} 組件
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {dash.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Master Control Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unsaved Changes Save Button */}
          {hasUnsavedChanges && (
            <button
              onClick={onSaveDashboard}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              儲存配置 (Save)
            </button>
          )}

          {/* Add Widget Button */}
          <button
            onClick={onOpenAddWidget}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            新增組件
          </button>

          {/* Edit Mode Toggle */}
          <button
            onClick={onToggleEditMode}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
              isEditMode
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10"
                : "bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-700"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            {isEditMode ? '完成佈局編輯' : '自訂佈局'}
          </button>

          {/* Manage Dashboards */}
          <button
            onClick={onOpenManageDashboards}
            className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-xl transition-colors"
            title="儀表板範本庫與管理"
          >
            <FolderKanban className="w-4 h-4" />
          </button>

          {/* Export JSON */}
          <button
            onClick={onExportDashboard}
            className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-xl transition-colors"
            title="匯出儀表板設定 (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Share Link */}
          <button
            onClick={handleCopyLink}
            className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-xl transition-colors relative"
            title="複製分享連結"
          >
            <Share2 className="w-4 h-4" />
            {showShareToast && (
              <span className="absolute -bottom-8 right-0 bg-black text-xs text-emerald-400 px-2 py-1 rounded shadow-lg whitespace-nowrap border border-gray-700">
                已複製連結！
              </span>
            )}
          </button>

          {/* Kiosk / Fullscreen Presentation Mode */}
          <button
            onClick={onToggleKioskMode}
            className={cn(
              "p-2 rounded-xl border transition-colors",
              isKioskMode 
                ? "bg-purple-600 text-white border-purple-500" 
                : "bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-700"
            )}
            title={isKioskMode ? "退出全螢幕戰情室" : "全螢幕戰情室 (Kiosk Mode)"}
          >
            {isKioskMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Second Tier: Operational Variables & Filter Pipeline */}
      <div className="bg-[#111114] border border-gray-800 px-4 py-3 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Data Source Selector */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-lg">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] uppercase font-bold text-gray-500">來源:</span>
            <select
              value={filterState.dataSource}
              onChange={(e) => onFilterChange({ dataSource: e.target.value })}
              className="bg-transparent text-gray-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900 text-gray-200">所有聚合資料來源 (All Engines)</option>
              {AVAILABLE_DATA_SOURCES.map((ds) => (
                <option key={ds.id} value={ds.id} className="bg-gray-900 text-gray-200">
                  {ds.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold text-gray-500">時間:</span>
            <select
              value={filterState.timeRange}
              onChange={(e) => onFilterChange({ timeRange: e.target.value })}
              className="bg-transparent text-gray-200 font-semibold focus:outline-none cursor-pointer"
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-gray-900 text-gray-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cluster / Node Selector */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-lg">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] uppercase font-bold text-gray-500">節點:</span>
            <select
              value={filterState.cluster}
              onChange={(e) => onFilterChange({ cluster: e.target.value })}
              className="bg-transparent text-gray-200 font-semibold focus:outline-none cursor-pointer"
            >
              {CLUSTER_OPTIONS.map((c) => (
                <option key={c.id} value={c.id} className="bg-gray-900 text-gray-200">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Query / Lucene Filter Input */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg w-52 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="搜尋事件或過濾器 (e.g. host:WS-22)..."
              value={filterState.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Right: Refresh & Telemetry Heartbeat */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Auto Refresh Frequency */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-lg">
            <RefreshCw className={cn("w-3.5 h-3.5 text-blue-400", filterState.refreshRate > 0 && "animate-spin text-emerald-400")} style={{ animationDuration: '6s' }} />
            <span className="text-[10px] uppercase font-bold text-gray-500">自動整理:</span>
            <select
              value={filterState.refreshRate}
              onChange={(e) => onFilterChange({ refreshRate: Number(e.target.value) })}
              className="bg-transparent text-gray-200 font-semibold focus:outline-none cursor-pointer"
            >
              {REFRESH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900 text-gray-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onManualRefresh}
            className="p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 rounded-lg transition-colors"
            title="手動重新整理遙測數據"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Last sync timestamp */}
          <div className="text-[10px] text-gray-500 font-mono hidden md:block">
            更新於 {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

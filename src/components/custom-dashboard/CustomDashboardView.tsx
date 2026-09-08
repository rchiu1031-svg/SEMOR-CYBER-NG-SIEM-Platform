import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Settings2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  LayoutGrid,
  Minimize2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  DashboardTemplate, 
  DashboardWidget, 
  GlobalFilterState, 
  WidgetWidth, 
  DashboardCategory 
} from './types';
import { INITIAL_DASHBOARD_TEMPLATES } from './customDashboardData';
import { CustomDashboardHeader } from './CustomDashboardHeader';
import { WidgetRenderer } from './WidgetRenderer';
import { AddWidgetModal } from './AddWidgetModal';
import { WidgetConfigModal } from './WidgetConfigModal';
import { WidgetFullscreenModal } from './WidgetFullscreenModal';
import { DashboardManagerModal } from './DashboardManagerModal';

const STORAGE_KEY = 'semor_custom_dashboards_v2';
const ACTIVE_DASH_KEY = 'semor_active_dashboard_id_v2';

export const CustomDashboardView: React.FC = () => {
  // 1. Dashboards State (with local storage hydration)
  const [dashboards, setDashboards] = useState<DashboardTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load dashboards from localStorage:', e);
    }
    return INITIAL_DASHBOARD_TEMPLATES;
  });

  // 2. Active Dashboard ID State
  const [currentDashboardId, setCurrentDashboardId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_DASH_KEY);
      if (savedId) return savedId;
    } catch (e) {
      console.error('Failed to load active dashboard id:', e);
    }
    return INITIAL_DASHBOARD_TEMPLATES[0].id;
  });

  // Find active dashboard or fallback
  const currentDashboard = dashboards.find((d) => d.id === currentDashboardId) || dashboards[0] || INITIAL_DASHBOARD_TEMPLATES[0];

  // 3. Operational UI States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // 4. Global Filter State
  const [filterState, setFilterState] = useState<GlobalFilterState>({
    dataSource: 'all',
    timeRange: '1h',
    cluster: 'all',
    environment: 'production',
    refreshRate: 30, // 30s auto-refresh by default
    searchQuery: '',
    activeTags: []
  });

  // 5. Modal Control States
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isManageDashboardsOpen, setIsManageDashboardsOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [fullscreenWidget, setFullscreenWidget] = useState<DashboardWidget | null>(null);

  // Auto-refresh interval
  useEffect(() => {
    if (filterState.refreshRate <= 0) return;
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, filterState.refreshRate * 1000);
    return () => clearInterval(interval);
  }, [filterState.refreshRate]);

  // Show toast helper
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist dashboards
  const saveToStorage = (updatedDashboards: DashboardTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDashboards));
      setHasUnsavedChanges(false);
      showToast('儀表板變更已成功保存至瀏覽器儲存區！', 'success');
    } catch (e) {
      console.error('Failed to save dashboards to localStorage:', e);
      showToast('儲存失敗，請檢查瀏覽器空間', 'error');
    }
  };

  // Dashboard Operations
  const handleSelectDashboard = (id: string) => {
    setCurrentDashboardId(id);
    localStorage.setItem(ACTIVE_DASH_KEY, id);
    setIsEditMode(false);
  };

  const handleCreateDashboard = (
    name: string, 
    description: string, 
    category: DashboardCategory, 
    tags: string[]
  ) => {
    const newDash: DashboardTemplate = {
      id: `dash-${Date.now()}`,
      name,
      description,
      category,
      isCustom: true,
      author: 'Security Admin',
      lastModified: new Date().toLocaleString(),
      tags,
      widgets: []
    };
    const updated = [newDash, ...dashboards];
    setDashboards(updated);
    setCurrentDashboardId(newDash.id);
    saveToStorage(updated);
    showToast(`已建立新儀表板「${name}」！`, 'success');
  };

  const handleCloneDashboard = (sourceId: string) => {
    const source = dashboards.find((d) => d.id === sourceId);
    if (!source) return;
    const cloned: DashboardTemplate = {
      ...source,
      id: `dash-clone-${Date.now()}`,
      name: `${source.name} (副本)`,
      isDefault: false,
      isCustom: true,
      lastModified: new Date().toLocaleString(),
      widgets: source.widgets.map((w) => ({ ...w, id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` }))
    };
    const updated = [cloned, ...dashboards];
    setDashboards(updated);
    setCurrentDashboardId(cloned.id);
    saveToStorage(updated);
    showToast(`已成功複製儀表板為「${cloned.name}」！`, 'success');
  };

  const handleDeleteDashboard = (id: string) => {
    if (dashboards.length <= 1) {
      showToast('無法刪除最後一組儀表板！', 'error');
      return;
    }
    const updated = dashboards.filter((d) => d.id !== id);
    setDashboards(updated);
    if (currentDashboardId === id) {
      setCurrentDashboardId(updated[0].id);
    }
    saveToStorage(updated);
    showToast('已刪除指定儀表板！', 'info');
  };

  const handleSetDefaultDashboard = (id: string) => {
    const updated = dashboards.map((d) => ({
      ...d,
      isDefault: d.id === id
    }));
    setDashboards(updated);
    saveToStorage(updated);
    showToast('已設定為登入預設儀表板！', 'success');
  };

  const handleImportDashboard = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.name || !Array.isArray(parsed.widgets)) {
        showToast('無效的儀表板 JSON 格式！', 'error');
        return;
      }
      const imported: DashboardTemplate = {
        ...parsed,
        id: `dash-imported-${Date.now()}`,
        isCustom: true,
        lastModified: new Date().toLocaleString()
      };
      const updated = [imported, ...dashboards];
      setDashboards(updated);
      setCurrentDashboardId(imported.id);
      saveToStorage(updated);
      showToast(`已成功匯入儀表板「${imported.name}」！`, 'success');
    } catch (e) {
      showToast('解析 JSON 檔案失敗！', 'error');
    }
  };

  const handleExportDashboard = () => {
    const jsonStr = JSON.stringify(currentDashboard, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDashboard.name.replace(/\s+/g, '_')}_config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('已匯出儀表板 JSON 設定檔！', 'success');
  };

  // Widget Operations
  const handleAddWidget = (newWidget: DashboardWidget) => {
    const updatedWidgets = [...currentDashboard.widgets, newWidget];
    const updatedDashboards = dashboards.map((d) => 
      d.id === currentDashboard.id 
        ? { ...d, widgets: updatedWidgets, lastModified: new Date().toLocaleString() } 
        : d
    );
    setDashboards(updatedDashboards);
    setHasUnsavedChanges(true);
    showToast(`已加入組件「${newWidget.title}」！`, 'success');
  };

  const handleDeleteWidget = (widgetId: string) => {
    const updatedWidgets = currentDashboard.widgets.filter((w) => w.id !== widgetId);
    const updatedDashboards = dashboards.map((d) => 
      d.id === currentDashboard.id 
        ? { ...d, widgets: updatedWidgets, lastModified: new Date().toLocaleString() } 
        : d
    );
    setDashboards(updatedDashboards);
    setHasUnsavedChanges(true);
    showToast('已移除組件', 'info');
  };

  const handleChangeWidgetWidth = (widgetId: string, newWidth: WidgetWidth) => {
    const updatedWidgets = currentDashboard.widgets.map((w) => 
      w.id === widgetId ? { ...w, width: newWidth } : w
    );
    const updatedDashboards = dashboards.map((d) => 
      d.id === currentDashboard.id 
        ? { ...d, widgets: updatedWidgets, lastModified: new Date().toLocaleString() } 
        : d
    );
    setDashboards(updatedDashboards);
    setHasUnsavedChanges(true);
  };

  const handleSaveWidgetConfig = (updatedWidget: DashboardWidget) => {
    const updatedWidgets = currentDashboard.widgets.map((w) => 
      w.id === updatedWidget.id ? updatedWidget : w
    );
    const updatedDashboards = dashboards.map((d) => 
      d.id === currentDashboard.id 
        ? { ...d, widgets: updatedWidgets, lastModified: new Date().toLocaleString() } 
        : d
    );
    setDashboards(updatedDashboards);
    setHasUnsavedChanges(true);
    showToast('已更新組件設定！', 'success');
  };

  const handleResetToDefault = () => {
    const initial = INITIAL_DASHBOARD_TEMPLATES.find((d) => d.id === currentDashboard.id);
    if (!initial) return;
    const updatedDashboards = dashboards.map((d) => 
      d.id === currentDashboard.id ? { ...initial } : d
    );
    setDashboards(updatedDashboards);
    saveToStorage(updatedDashboards);
    showToast('已重置為原廠預設佈局！', 'info');
  };

  // Filter widgets by search query if present
  const displayWidgets = currentDashboard.widgets.filter((w) => {
    if (!filterState.searchQuery) return true;
    const q = filterState.searchQuery.toLowerCase();
    return w.title.toLowerCase().includes(q) || 
           w.dataSource.toLowerCase().includes(q) ||
           (w.description && w.description.toLowerCase().includes(q));
  });

  return (
    <div className={cn("space-y-6 relative transition-all duration-300", isKioskMode && "p-6 bg-[#09090b] min-h-screen")}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs font-bold text-white",
            toastMessage.type === 'success' && "bg-emerald-950/90 border-emerald-500/50 text-emerald-200",
            toastMessage.type === 'info' && "bg-blue-950/90 border-blue-500/50 text-blue-200",
            toastMessage.type === 'error' && "bg-red-950/90 border-red-500/50 text-red-200"
          )}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <CustomDashboardHeader
        currentDashboard={currentDashboard}
        allDashboards={dashboards}
        onSelectDashboard={handleSelectDashboard}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenAddWidget={() => setIsAddWidgetOpen(true)}
        onOpenManageDashboards={() => setIsManageDashboardsOpen(true)}
        filterState={filterState}
        onFilterChange={(newFilters) => setFilterState({ ...filterState, ...newFilters })}
        isKioskMode={isKioskMode}
        onToggleKioskMode={() => setIsKioskMode(!isKioskMode)}
        onExportDashboard={handleExportDashboard}
        lastRefreshed={lastRefreshed}
        onManualRefresh={() => {
          setLastRefreshed(new Date());
          showToast('已同步最新遙測串流！', 'info');
        }}
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveDashboard={() => saveToStorage(dashboards)}
      />

      {/* Edit Mode Helper Notification Bar */}
      {isEditMode && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>
              <strong>自訂佈局編輯模式已啟用</strong>：您可自由調整各卡片欄寬、點選齒輪編輯指標參數或刪除組件。
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-gray-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-gray-400" />
              恢復範本預設值
            </button>
            <button
              onClick={() => {
                saveToStorage(dashboards);
                setIsEditMode(false);
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold shadow-md shadow-amber-600/20"
            >
              完成並儲存
            </button>
          </div>
        </div>
      )}

      {/* Kiosk Mode Exit Bar */}
      {isKioskMode && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setIsKioskMode(false)}
            className="px-3 py-1.5 bg-black/80 hover:bg-gray-800 border border-gray-700 text-xs font-bold text-gray-300 rounded-xl flex items-center gap-1.5 shadow-2xl"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            退出全螢幕戰情室
          </button>
        </div>
      )}

      {/* Dynamic Responsive 12-Column Grid */}
      {displayWidgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {displayWidgets.map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              onEditWidget={(w) => setEditingWidget(w)}
              onDeleteWidget={handleDeleteWidget}
              onFullscreenWidget={(w) => setFullscreenWidget(w)}
              onChangeWidth={handleChangeWidgetWidth}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-2xl text-gray-500">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">此儀表板尚無任何顯示組件</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              您可以點選下方按鈕從「組件範本庫」中挑選預設圖表，或自訂專屬於您的資安戰情監控卡片。
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsAddWidgetOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增卡片組件
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700"
            >
              恢復預設佈局
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        onAddWidget={handleAddWidget}
      />

      <WidgetConfigModal
        isOpen={!!editingWidget}
        widget={editingWidget}
        onClose={() => setEditingWidget(null)}
        onSave={handleSaveWidgetConfig}
      />

      <WidgetFullscreenModal
        isOpen={!!fullscreenWidget}
        widget={fullscreenWidget}
        onClose={() => setFullscreenWidget(null)}
      />

      <DashboardManagerModal
        isOpen={isManageDashboardsOpen}
        onClose={() => setIsManageDashboardsOpen(false)}
        dashboards={dashboards}
        currentDashboardId={currentDashboard.id}
        onSelectDashboard={handleSelectDashboard}
        onCreateDashboard={handleCreateDashboard}
        onCloneDashboard={handleCloneDashboard}
        onDeleteDashboard={handleDeleteDashboard}
        onSetDefaultDashboard={handleSetDefaultDashboard}
        onImportDashboard={handleImportDashboard}
      />
    </div>
  );
};

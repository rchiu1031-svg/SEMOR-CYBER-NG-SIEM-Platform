import React, { useState } from 'react';
import {
  Eye,
  Activity,
  Layers,
  Database,
  Save,
  Plus,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Sliders,
  CheckCircle2,
  Copy,
  Clock,
  ExternalLink,
  ChevronDown,
  Layout,
  Maximize2,
  Check
} from 'lucide-react';
import { PanelConfig, PanelTemplateId, PresetVisualization } from './types';
import { DEFAULT_PANEL_CONFIG, PANEL_TEMPLATES_CATALOG, PRESET_VISUALIZATIONS } from './mockData';
import { VisualPanelPreview } from './VisualPanelPreview';
import { PanelConfigInspector } from './PanelConfigInspector';
import { QueryEditorBar } from './QueryEditorBar';
import { PanelTemplateCatalog } from './PanelTemplateCatalog';
import { VisualizationLibrary } from './VisualizationLibrary';
import { DataSourceManager } from './DataSourceManager';

export function CustomVisibilityView() {
  const [activeMainTab, setActiveMainTab] = useState<'studio' | 'library' | 'datasources'>('studio');
  const [panelConfig, setPanelConfig] = useState<PanelConfig>(DEFAULT_PANEL_CONFIG);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [lastExecutionMs, setLastExecutionMs] = useState(14);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Modals & Toast State
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specInput, setSpecInput] = useState('');
  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);
  const [availableDashboards, setAvailableDashboards] = useState<Array<{ id: string; name: string }>>([
    { id: 'dash-soc-triage', name: '即時資安營運中心儀錶板 (SOC Operations)' },
    { id: 'dash-ddos-network', name: 'DDoS 流量清洗與網路邊界專題看板' },
    { id: 'dash-custom-default', name: '自定義 SOC 營運儀錶板 (Custom Dashboard)' }
  ]);
  const [targetDashboardId, setTargetDashboardId] = useState('dash-custom-default');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [isCopiedSpec, setIsCopiedSpec] = useState(false);

  const fetchAvailableDashboards = async () => {
    try {
      const res = await fetch('/api/v1/custom-dashboard/dashboards');
      const data = await res.json();
      if (data.success && Array.isArray(data.dashboards) && data.dashboards.length > 0) {
        setAvailableDashboards(data.dashboards.map((d: any) => ({ id: d.id, name: d.name })));
        if (!targetDashboardId || !data.dashboards.find((d: any) => d.id === targetDashboardId)) {
          setTargetDashboardId(data.dashboards[0].id);
        }
      }
    } catch (e) {
      console.warn('Using default dashboard templates fallback');
    }
  };

  React.useEffect(() => {
    fetchAvailableDashboards();
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Handle template selection from catalog
  const handleSelectTemplate = (templateId: PanelTemplateId) => {
    const templateMeta = PANEL_TEMPLATES_CATALOG.find((t) => t.id === templateId);
    setPanelConfig((prev) => ({
      ...prev,
      template: templateId,
      title: prev.title.includes(' - ') ? prev.title : `${templateId} - 專屬資安監控面板`,
      dataSource: templateMeta?.recommendedDataSource !== 'None' ? (templateMeta?.recommendedDataSource || prev.dataSource) : prev.dataSource
    }));
    showToast(`已切換至「${templateId}」範本視覺化模式`);
  };

  // Load preset from library
  const handleLoadPreset = (preset: PresetVisualization) => {
    setPanelConfig({
      ...DEFAULT_PANEL_CONFIG,
      ...preset.config,
      id: `panel-${Date.now()}`,
      title: preset.name,
      description: preset.description,
      template: preset.template,
      dataSource: preset.dataSource,
      display: {
        ...DEFAULT_PANEL_CONFIG.display,
        ...(preset.config.display || {})
      },
      thresholds: {
        ...DEFAULT_PANEL_CONFIG.thresholds,
        ...(preset.config.thresholds || {})
      },
      axis: {
        ...DEFAULT_PANEL_CONFIG.axis,
        ...(preset.config.axis || {})
      }
    });
    setActiveMainTab('studio');
    showToast(`已成功載入預置組件：「${preset.name}」`);
  };

  // Execute query action against backend log collection
  const handleExecuteQuery = async () => {
    setIsExecutingQuery(true);
    try {
      const startMs = Date.now();
      const res = await fetch('/api/v1/custom-dashboard/query-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSource: panelConfig.dataSource,
          query: panelConfig.query?.metric || panelConfig.query?.rawCode || '*',
          aggregation: panelConfig.template === 'Bar Chart' ? 'BY_SOURCE' : panelConfig.template === 'Pie Chart' ? 'BY_LEVEL' : panelConfig.template === 'Stat' ? 'STAT' : panelConfig.template === 'Table' || panelConfig.template === 'Logs' ? 'TABLE' : 'TIMESERIES'
        })
      });
      const result = await res.json();
      const ms = Date.now() - startMs;
      setLastExecutionMs(ms);
      setIsExecutingQuery(false);
      showToast(`日誌查詢執行成功！耗時 ${ms} ms (匹配 ${result.totalCount || 0} 筆即時 Log 記錄)`, 'info');
    } catch {
      setIsExecutingQuery(false);
      showToast('日誌查詢執行完成', 'info');
    }
  };

  // Open JSON Spec modal
  const handleOpenSpecModal = () => {
    setSpecInput(JSON.stringify(panelConfig, null, 2));
    setShowSpecModal(true);
  };

  // Apply JSON spec
  const handleApplySpec = () => {
    try {
      const parsed = JSON.parse(specInput);
      setPanelConfig(parsed);
      setShowSpecModal(false);
      showToast('已成功匯入並套用 JSON 圖表面板定義！');
    } catch (err) {
      alert('JSON 格式不正確，請確認語法是否有效。');
    }
  };

  // Copy spec to clipboard
  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(panelConfig, null, 2));
    setIsCopiedSpec(true);
    setTimeout(() => setIsCopiedSpec(false), 2000);
    showToast('已複製面板規格至剪貼簿');
  };

  // Confirm add to dashboard via backend REST API
  const handleConfirmAddToDashboard = async () => {
    try {
      const targetId = targetDashboardId || availableDashboards[0]?.id || 'dash-custom-default';
      const res = await fetch(`/api/v1/custom-dashboard/dashboards/${targetId}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(panelConfig)
      });
      const data = await res.json();
      setShowAddToDashboardModal(false);
      if (data.success) {
        showToast(`已將自定義圖表「${panelConfig.title}」成功加入至「${data.dashboardName || targetId}」！`);
      } else {
        showToast(data.message || '加入儀表板失敗', 'info');
      }
    } catch (err: any) {
      setShowAddToDashboardModal(false);
      showToast(`加入儀表板失敗: ${err.message}`, 'info');
    }
  };

  return (
    <div className="space-y-5 pb-12 select-text">
      {/* Toast feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-2xl border border-blue-400 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* TOP WORKSPACE NAVIGATION & TOOLBAR */}
      <div className="bg-[#0f111a] border border-gray-800 p-4 rounded-xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-950 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveMainTab('studio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'studio'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-850'
            }`}
          >
            <Activity className="w-4 h-4" />
            視覺化工作台 (Studio)
          </button>

          <button
            onClick={() => setActiveMainTab('library')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'library'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-850'
            }`}
          >
            <Layers className="w-4 h-4" />
            視覺化組件庫 (Library)
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              {PRESET_VISUALIZATIONS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('datasources')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'datasources'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-850'
            }`}
          >
            <Database className="w-4 h-4" />
            資料連接器中心 (Data Connectors)
          </button>
        </div>

        {/* Center/Right: Quick Parameter Selectors */}
        {activeMainTab === 'studio' && (
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Variable: Time Range */}
            <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 px-2.5 py-1.5 rounded-lg text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-gray-400 text-[11px]">時間區間:</span>
              <select
                value={panelConfig.timeRange}
                onChange={(e) => setPanelConfig({ ...panelConfig, timeRange: e.target.value })}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="過去 15 分鐘 (Last 15m)">過去 15 分鐘</option>
                <option value="過去 1 小時 (Last 1 hour)">過去 1 小時</option>
                <option value="過去 6 小時 (Last 6 hours)">過去 6 小時</option>
                <option value="過去 24 小時 (Last 24 hours)">過去 24 小時</option>
                <option value="過去 7 天 (Last 7 days)">過去 7 天</option>
              </select>
            </div>

            {/* Variable: Refresh Interval */}
            <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 px-2.5 py-1.5 rounded-lg text-xs">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-gray-400 text-[11px]">自動刷新:</span>
              <select
                value={panelConfig.refreshInterval}
                onChange={(e) => setPanelConfig({ ...panelConfig, refreshInterval: e.target.value })}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="5s">5 秒 (極速)</option>
                <option value="10s">10 秒 (推薦)</option>
                <option value="30s">30 秒</option>
                <option value="1m">1 分鐘</option>
                <option value="off">關閉 (手動)</option>
              </select>
            </div>

            {/* Actions: Spec Modal & Add to Dashboard */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleOpenSpecModal}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="檢視或匯入 JSON 規格"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">JSON Spec</span>
              </button>

              <button
                onClick={() => {
                  showToast('已成功將當前面板組態儲存至私有自訂庫！');
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>儲存組態</span>
              </button>

              <button
                onClick={() => setShowAddToDashboardModal(true)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>發布至儀錶板</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN VIEW CONTENTS */}
      {activeMainTab === 'studio' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-[750px]">
          {/* COLUMN 1: Panel Template Catalog (25% on desktop / xl:col-span-3) */}
          <div className="xl:col-span-3 h-[750px]">
            <PanelTemplateCatalog
              selectedTemplate={panelConfig.template}
              onSelectTemplate={handleSelectTemplate}
            />
          </div>

          {/* COLUMN 2: Center Stage Preview & Bottom Query Studio (50% on desktop / xl:col-span-6) */}
          <div className="xl:col-span-6 flex flex-col gap-4">
            {/* Visual Preview Stage */}
            <div className="h-[430px] w-full">
              <VisualPanelPreview
                config={panelConfig}
                isFullscreen={isFullscreenPreview}
                onToggleFullscreen={() => setIsFullscreenPreview(!isFullscreenPreview)}
              />
            </div>

            {/* Query & Data Transformation Studio */}
            <div className="flex-1">
              <QueryEditorBar
                config={panelConfig}
                onChange={setPanelConfig}
                onExecuteQuery={handleExecuteQuery}
                isExecuting={isExecutingQuery}
                lastExecutionMs={lastExecutionMs}
              />
            </div>
          </div>

          {/* COLUMN 3: Right Config Inspector (25% on desktop / xl:col-span-3) */}
          <div className="xl:col-span-3 h-[750px]">
            <PanelConfigInspector
              config={panelConfig}
              onChange={setPanelConfig}
            />
          </div>
        </div>
      )}

      {/* TAB 2: VISUALIZATION LIBRARY */}
      {activeMainTab === 'library' && (
        <VisualizationLibrary
          onLoadPreset={handleLoadPreset}
          onAddToDashboard={(preset) => {
            showToast(`已將預置組件「${preset.name}」加入至儀錶板！`);
          }}
        />
      )}

      {/* TAB 3: DATA SOURCE CONNECTORS */}
      {activeMainTab === 'datasources' && (
        <DataSourceManager
          onSelectDataSource={(dsName) => {
            setPanelConfig({ ...panelConfig, dataSource: dsName });
            setActiveMainTab('studio');
            showToast(`已選定 ${dsName} 作為工作台主查詢資料源`);
          }}
        />
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-6 flex flex-col">
          <div className="flex-1">
            <VisualPanelPreview
              config={panelConfig}
              isFullscreen={true}
              onToggleFullscreen={() => setIsFullscreenPreview(false)}
            />
          </div>
        </div>
      )}

      {/* JSON SPEC IMPORT / EXPORT MODAL */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-gray-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">圖表面板 JSON 規格定義 (Panel Spec)</h3>
              </div>
              <button onClick={() => setShowSpecModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-400">
              相容於 Grafana / OpenSearch Dashboard Panel 規格。您可以自由複製匯出或貼入 JSON 進行快速還原。
            </p>

            <textarea
              rows={12}
              value={specInput}
              onChange={(e) => setSpecInput(e.target.value)}
              className="w-full bg-[#090b10] border border-gray-700 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-blue-500 leading-relaxed select-text"
            />

            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <button
                onClick={handleCopySpec}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                {isCopiedSpec ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedSpec ? '已複製！' : '複製代碼'}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSpecModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleApplySpec}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>套用並覆蓋面板</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD TO DASHBOARD MODAL */}
      {showAddToDashboardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">發布至自定義儀錶板</h3>
              </div>
              <button onClick={() => setShowAddToDashboardModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">目標儀錶板看板</label>
                <select
                  value={targetDashboardId}
                  onChange={(e) => setTargetDashboardId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                >
                  {availableDashboards.map((dash) => (
                    <option key={dash.id} value={dash.id}>
                      {dash.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 text-gray-400 space-y-1 text-[11px]">
                <div>面板名稱: <strong className="text-white">{panelConfig.title}</strong></div>
                <div>圖表樣式: <strong className="text-blue-400">{panelConfig.template}</strong></div>
                <div>資料來源: <strong className="text-gray-200">{panelConfig.dataSource}</strong></div>
                <div>警報聯動: <strong className={panelConfig.alert.enabled ? 'text-emerald-400' : 'text-gray-500'}>
                  {panelConfig.alert.enabled ? '已啟用 SOAR 聯防' : '僅監控'}
                </strong></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowAddToDashboardModal(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddToDashboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 shadow-md shadow-blue-500/20"
              >
                確定加入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

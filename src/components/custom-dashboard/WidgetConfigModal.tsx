import React, { useState, useEffect } from 'react';
import { X, Settings2, Sliders, CheckCircle2 } from 'lucide-react';
import { DashboardWidget, WidgetType, WidgetWidth } from './types';
import { AVAILABLE_DATA_SOURCES } from './customDashboardData';

interface WidgetConfigModalProps {
  isOpen: boolean;
  widget: DashboardWidget | null;
  onClose: () => void;
  onSave: (updatedWidget: DashboardWidget) => void;
}

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  widget,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<DashboardWidget>>({});

  useEffect(() => {
    if (widget) {
      setFormData({
        title: widget.title,
        description: widget.description,
        type: widget.type,
        width: widget.width,
        dataSource: widget.dataSource,
        color: widget.color || '#3b82f6',
        query: widget.query || '',
        thresholds: widget.thresholds || { warning: 70, critical: 90, condition: 'gt' }
      });
    }
  }, [widget]);

  if (!isOpen || !widget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...widget,
      ...formData
    } as DashboardWidget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#16161c]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">自訂組件參數設定</h3>
              <p className="text-xs text-gray-400">設定卡片標題、資料來源與警報臨界值</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              組件顯示標題
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              副標題 / 描述
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Grid Layout: Type & Width */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                圖表展現型態
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WidgetType })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="stat">HUD 指標卡 (Stat)</option>
                <option value="timeseries_area">面積趨勢圖 (Area)</option>
                <option value="timeseries_bar">長條分佈圖 (Bar)</option>
                <option value="timeseries_line">多軸折線圖 (Line)</option>
                <option value="donut">甜甜圈圓餅圖 (Donut)</option>
                <option value="table">高密度清單 (Table)</option>
                <option value="gauge">防護評分量表 (Gauge)</option>
                <option value="network_flow">網路串流通訊 (NetFlow)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                版面欄寬度 (Width)
              </label>
              <select
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value as WidgetWidth })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="col-span-3">1/4 寬度 (3 欄)</option>
                <option value="col-span-4">1/3 寬度 (4 欄)</option>
                <option value="col-span-6">1/2 寬度 (6 欄)</option>
                <option value="col-span-8">2/3 寬度 (8 欄)</option>
                <option value="col-span-12">全寬度 (12 欄)</option>
              </select>
            </div>
          </div>

          {/* Data Source */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              後端遙測日誌引擎 (Data Source)
            </label>
            <select
              value={formData.dataSource}
              onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {AVAILABLE_DATA_SOURCES.map((ds) => (
                <option key={ds.id} value={ds.name}>
                  {ds.name} ({ds.type})
                </option>
              ))}
            </select>
          </div>

          {/* Query Expression */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              查詢表達式 (Query Filter / Lucene)
            </label>
            <input
              type="text"
              placeholder="e.g. rate(events_total[5m]) or severity >= 3"
              value={formData.query || ''}
              onChange={(e) => setFormData({ ...formData, query: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 font-mono text-blue-400 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Alert Thresholds */}
          <div className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">
              警戒臨界值 (Threshold Alerts)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-amber-400 block mb-1">警告值 (Warning)</span>
                <input
                  type="number"
                  value={formData.thresholds?.warning || 70}
                  onChange={(e) => setFormData({
                    ...formData,
                    thresholds: { ...formData.thresholds, warning: Number(e.target.value) }
                  })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-red-400 block mb-1">嚴重臨界值 (Critical)</span>
                <input
                  type="number"
                  value={formData.thresholds?.critical || 90}
                  onChange={(e) => setFormData({
                    ...formData,
                    thresholds: { ...formData.thresholds, critical: Number(e.target.value) }
                  })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              套用變更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

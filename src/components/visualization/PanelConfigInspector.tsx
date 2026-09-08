import React, { useState } from 'react';
import {
  Settings,
  Palette,
  Sliders,
  Bell,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { PanelConfig, ColorPaletteId, ThresholdLevel } from './types';

interface PanelConfigInspectorProps {
  config: PanelConfig;
  onChange: (newConfig: PanelConfig) => void;
}

export function PanelConfigInspector({ config, onChange }: PanelConfigInspectorProps) {
  const [activeSection, setActiveSection] = useState<'general' | 'display' | 'thresholds' | 'axis' | 'alert'>('display');

  const updateDisplay = (partial: Partial<PanelConfig['display']>) => {
    onChange({
      ...config,
      display: { ...config.display, ...partial }
    });
  };

  const updateAxis = (partial: Partial<PanelConfig['axis']>) => {
    onChange({
      ...config,
      axis: { ...config.axis, ...partial }
    });
  };

  const updateThresholds = (partial: Partial<PanelConfig['thresholds']>) => {
    onChange({
      ...config,
      thresholds: { ...config.thresholds, ...partial }
    });
  };

  const updateAlert = (partial: Partial<PanelConfig['alert']>) => {
    onChange({
      ...config,
      alert: { ...config.alert, ...partial }
    });
  };

  const addThresholdLevel = () => {
    const newLvl: ThresholdLevel = {
      id: `th-${Date.now()}`,
      label: '新警戒水位',
      value: 1000,
      color: '#f59e0b'
    };
    updateThresholds({
      levels: [...config.thresholds.levels, newLvl]
    });
  };

  const removeThresholdLevel = (id: string) => {
    updateThresholds({
      levels: config.thresholds.levels.filter(l => l.id !== id)
    });
  };

  const updateThresholdLevel = (id: string, partial: Partial<ThresholdLevel>) => {
    updateThresholds({
      levels: config.thresholds.levels.map(l => (l.id === id ? { ...l, ...partial } : l))
    });
  };

  const toggleChannel = (channel: any) => {
    const exists = config.alert.channels.includes(channel);
    const updated = exists
      ? config.alert.channels.filter(c => c !== channel)
      : [...config.alert.channels, channel];
    updateAlert({ channels: updated });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f111a] border border-gray-800 rounded-xl overflow-hidden shadow-xl text-xs">
      {/* Inspector Header */}
      <div className="px-4 py-3 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">面板詳細設定 (Panel Inspector)</h3>
        </div>
        <span className="text-[10px] text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded">
          {config.template}
        </span>
      </div>

      {/* Navigation Pills */}
      <div className="grid grid-cols-5 p-1 bg-gray-950 border-b border-gray-800 text-[11px] font-semibold text-center">
        <button
          onClick={() => setActiveSection('general')}
          className={`py-1.5 rounded transition-all ${
            activeSection === 'general' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          常規
        </button>
        <button
          onClick={() => setActiveSection('display')}
          className={`py-1.5 rounded transition-all ${
            activeSection === 'display' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          樣式
        </button>
        <button
          onClick={() => setActiveSection('thresholds')}
          className={`py-1.5 rounded transition-all ${
            activeSection === 'thresholds' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          閾值
        </button>
        <button
          onClick={() => setActiveSection('axis')}
          className={`py-1.5 rounded transition-all ${
            activeSection === 'axis' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          座標軸
        </button>
        <button
          onClick={() => setActiveSection('alert')}
          className={`py-1.5 rounded transition-all ${
            activeSection === 'alert' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          警報
        </button>
      </div>

      {/* Form Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {/* SECTION 1: GENERAL */}
        {activeSection === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">面板主標題 (Title)</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => onChange({ ...config, title: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">副標題 / 補充說明 (Subtitle)</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => onChange({ ...config, subtitle: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">詳細備註與描述 (Description)</label>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => onChange({ ...config, description: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div className="pt-2 border-t border-gray-800 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300 font-medium">透明背景 (Transparent)</span>
                <input
                  type="checkbox"
                  checked={config.display.transparentBackground}
                  onChange={(e) => updateDisplay({ transparentBackground: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300 font-medium">卡片邊框科技光暈 (Glow Border)</span>
                <input
                  type="checkbox"
                  checked={config.display.cardBorderGlow}
                  onChange={(e) => updateDisplay({ cardBorderGlow: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* SECTION 2: DISPLAY */}
        {activeSection === 'display' && (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 font-semibold block mb-1.5">圖表型態 (Graph Type)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['area', 'line', 'bar'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateDisplay({ graphType: type })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold capitalize transition-all ${
                      config.display.graphType === type
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {type === 'area' ? '面積圖 (Area)' : type === 'line' ? '折線圖 (Line)' : '長條圖 (Bar)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1.5">折線內插曲線 (Interpolation)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'smooth', label: '平滑 (Smooth)' },
                  { id: 'linear', label: '直線 (Linear)' },
                  { id: 'step', label: '階梯 (Step)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateDisplay({ lineInterpolation: item.id as any })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                      config.display.lineInterpolation === item.id
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">
                線條寬度 (Line Width): <span className="text-blue-400 font-bold">{config.display.strokeWidth} px</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={config.display.strokeWidth}
                onChange={(e) => updateDisplay({ strokeWidth: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">
                區域填滿不透明度 (Fill Opacity): <span className="text-blue-400 font-bold">{config.display.fillOpacity}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.display.fillOpacity}
                onChange={(e) => updateDisplay({ fillOpacity: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1.5">調色盤樣式 (Color Palette)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cyber-blue', name: 'Cyber 藍科技', color: 'bg-blue-500' },
                  { id: 'emerald-defense', name: '翡翠防禦綠', color: 'bg-emerald-500' },
                  { id: 'amber-warning', name: '琥珀警戒橘', color: 'bg-amber-500' },
                  { id: 'crimson-alert', name: '高危致命紅', color: 'bg-red-500' },
                  { id: 'high-contrast-neon', name: '霓虹高對比', color: 'bg-purple-500' }
                ].map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => updateDisplay({ colorPalette: palette.id as ColorPaletteId })}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      config.display.colorPalette === palette.id
                        ? 'bg-gray-800 border-blue-500 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${palette.color}`} />
                    <span className="text-[11px] font-medium">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">堆疊序列 (Stacked Series)</span>
                <input
                  type="checkbox"
                  checked={config.display.stacked}
                  onChange={(e) => updateDisplay({ stacked: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">顯示背景網格 (Show Grid)</span>
                <input
                  type="checkbox"
                  checked={config.display.showGrid}
                  onChange={(e) => updateDisplay({ showGrid: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">漸層填滿 (Gradient Fill)</span>
                <input
                  type="checkbox"
                  checked={config.display.gradientFill}
                  onChange={(e) => updateDisplay({ gradientFill: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* SECTION 3: THRESHOLDS */}
        {activeSection === 'thresholds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800">
              <span className="font-semibold text-gray-200">啟用動態警戒閾值 (Thresholds)</span>
              <input
                type="checkbox"
                checked={config.thresholds.enabled}
                onChange={(e) => updateThresholds({ enabled: e.target.checked })}
                className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
              />
            </div>

            {config.thresholds.enabled && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">數值模式</label>
                    <select
                      value={config.thresholds.mode}
                      onChange={(e) => updateThresholds({ mode: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="absolute">絕對數值 (Absolute)</option>
                      <option value="percentage">百分比 (Percentage)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">標註樣式</label>
                    <select
                      value={config.thresholds.displayStyle}
                      onChange={(e) => updateThresholds({ displayStyle: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="dashed">虛線 (Dashed)</option>
                      <option value="line">實線 (Solid)</option>
                      <option value="fill">背景漸層區間 (Fill)</option>
                      <option value="none">隱藏 (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">水位分級定義</span>
                    <button
                      onClick={addThresholdLevel}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                    >
                      <Plus className="w-3 h-3" /> 新增水位
                    </button>
                  </div>

                  {config.thresholds.levels.map((lvl) => (
                    <div key={lvl.id} className="p-2.5 bg-gray-900/90 border border-gray-800 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={lvl.color}
                          onChange={(e) => updateThresholdLevel(lvl.id, { color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={lvl.label}
                          onChange={(e) => updateThresholdLevel(lvl.id, { label: e.target.value })}
                          className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-white text-[11px]"
                          placeholder="水位標籤"
                        />
                        <input
                          type="number"
                          value={lvl.value}
                          onChange={(e) => updateThresholdLevel(lvl.id, { value: Number(e.target.value) })}
                          className="w-20 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-white text-[11px] font-mono"
                        />
                        <button
                          onClick={() => removeThresholdLevel(lvl.id)}
                          className="text-gray-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 4: AXIS & UNITS */}
        {activeSection === 'axis' && (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Y 軸數值單位 (Unit Format)</label>
              <select
                value={config.axis.yFormat}
                onChange={(e) => updateAxis({ yFormat: e.target.value as any })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="bits_sec">頻寬 (Bits/sec - Mbps)</option>
                <option value="bytes_sec">資料量 (Bytes/sec - MB/s)</option>
                <option value="percent">百分比 (%)</option>
                <option value="req_sec">請求數 (Requests/sec - rps)</option>
                <option value="ms">延遲時間 (Milliseconds - ms)</option>
                <option value="count">純事件筆數 (Raw Count)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">小數位數 (Decimals)</label>
                <select
                  value={config.axis.decimals}
                  onChange={(e) => updateAxis({ decimals: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white"
                >
                  <option value={0}>0 (無小數)</option>
                  <option value={1}>1 位</option>
                  <option value={2}>2 位</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">圖例位置 (Legend)</label>
                <select
                  value={config.axis.legendPosition}
                  onChange={(e) => updateAxis({ legendPosition: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white"
                >
                  <option value="bottom">底部 (Bottom)</option>
                  <option value="right">右側 (Right)</option>
                  <option value="table">統計表格 (Table)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">Y 軸最小值 (Min)</label>
                <input
                  type="number"
                  placeholder="Auto"
                  value={config.axis.yMin ?? ''}
                  onChange={(e) => updateAxis({ yMin: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Y 軸最大值 (Max)</label>
                <input
                  type="number"
                  placeholder="Auto"
                  value={config.axis.yMax ?? ''}
                  onChange={(e) => updateAxis({ yMax: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">顯示指標圖例 (Show Legend)</span>
                <input
                  type="checkbox"
                  checked={config.axis.showLegend}
                  onChange={(e) => updateAxis({ showLegend: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* SECTION 5: ALERTING & SOAR */}
        {activeSection === 'alert' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-gray-200">警報規則連動 (Alert Rule)</span>
              </div>
              <input
                type="checkbox"
                checked={config.alert.enabled}
                onChange={(e) => updateAlert({ enabled: e.target.checked })}
                className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0 w-4 h-4"
              />
            </div>

            {config.alert.enabled && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">評估條件 (Condition)</label>
                    <select
                      value={config.alert.condition}
                      onChange={(e) => updateAlert({ condition: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[11px]"
                    >
                      <option value="IS_ABOVE">數值高於 (Above)</option>
                      <option value="IS_BELOW">數值低於 (Below)</option>
                      <option value="IS_OUTSIDE_RANGE">超出區間</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">觸發臨界數值</label>
                    <input
                      type="number"
                      value={config.alert.thresholdValue}
                      onChange={(e) => updateAlert({ thresholdValue: Number(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">持續判定時長</label>
                    <select
                      value={config.alert.duration}
                      onChange={(e) => updateAlert({ duration: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[11px]"
                    >
                      <option value="1m">持續 1 分鐘</option>
                      <option value="3m">持續 3 分鐘</option>
                      <option value="5m">持續 5 分鐘</option>
                      <option value="15m">持續 15 分鐘</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">告警嚴重程度</label>
                    <select
                      value={config.alert.severity}
                      onChange={(e) => updateAlert({ severity: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[11px]"
                    >
                      <option value="critical">Critical (嚴重高危)</option>
                      <option value="warning">Warning (警戒注意)</option>
                      <option value="info">Info (資訊提示)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-2">通知廣播目標 (Notification Channels)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'slack', label: 'Slack SOC 頻道' },
                      { id: 'teams', label: 'MS Teams 群組' },
                      { id: 'pagerduty', label: 'PagerDuty 輪值' },
                      { id: 'webhook', label: '自訂 Webhook' }
                    ].map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => toggleChannel(channel.id)}
                        className={`p-2 rounded border text-left flex items-center justify-between text-[11px] transition-all ${
                          config.alert.channels.includes(channel.id as any)
                            ? 'bg-blue-950/60 border-blue-500 text-blue-200 font-semibold'
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <span>{channel.label}</span>
                        {config.alert.channels.includes(channel.id as any) && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>SOAR 自動化聯防劇本綁定</span>
                  </div>
                  <select
                    value={config.alert.triggerSOARPlaybook || ''}
                    onChange={(e) => updateAlert({ triggerSOARPlaybook: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-white text-[11px]"
                  >
                    <option value="">-- 無自動連動 (僅通知) --</option>
                    <option value="SOAR-PB-802: 邊界防火牆主動限流與黑名單阻斷">SOAR-PB-802: 邊界防火牆主動限流與黑名單阻斷</option>
                    <option value="SOAR-PB-104: 終端主機微隔離與進程終止劇本">SOAR-PB-104: 終端主機微隔離與進程終止劇本</option>
                    <option value="SOAR-PB-310: 雲端帳號 Session 強制登出與密鑰撤銷">SOAR-PB-310: 雲端帳號 Session 強制登出與密鑰撤銷</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

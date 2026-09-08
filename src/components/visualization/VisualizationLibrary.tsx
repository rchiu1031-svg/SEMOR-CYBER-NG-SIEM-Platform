import React, { useState } from 'react';
import {
  Search,
  Filter,
  Layers,
  Activity,
  Shield,
  Download,
  Plus,
  Play,
  Share2,
  Copy,
  ExternalLink,
  Sparkles,
  Tag,
  Check
} from 'lucide-react';
import { PresetVisualization, PanelConfig } from './types';
import { PRESET_VISUALIZATIONS } from './mockData';

interface VisualizationLibraryProps {
  onLoadPreset: (preset: PresetVisualization) => void;
  onAddToDashboard: (preset: PresetVisualization) => void;
}

export function VisualizationLibrary({
  onLoadPreset,
  onAddToDashboard
}: VisualizationLibraryProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['all', '網路與流量防護', '威脅情報與地理分析', '系統與基礎設施效能', '安全日誌與事件', 'MITRE 框架與合規'];

  const filtered = PRESET_VISUALIZATIONS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopySpec = (preset: PresetVisualization) => {
    const specStr = JSON.stringify(preset, null, 2);
    navigator.clipboard.writeText(specStr);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 select-text">
      {/* Header Bar */}
      <div className="bg-[#0f111a] border border-gray-800 p-5 rounded-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">SOC 企業級可視化預置組件庫 (Preset Gallery)</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            精選開箱即用的資安與系統度量面板，涵蓋 DDoS 清洗、地理威脅航線、MITRE 框架與 EDR 即時串流。
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜尋組件標籤或名稱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-[#0f111a] text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-gray-200'
            }`}
          >
            {cat === 'all' ? '全部組件 (6)' : cat}
          </button>
        ))}
      </div>

      {/* Grid of Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((preset) => (
          <div
            key={preset.id}
            className="bg-[#0f111a] border border-gray-800 rounded-xl p-5 shadow-lg hover:border-blue-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-300 font-semibold">
                  {preset.template}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {preset.dataSource}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                {preset.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
                {preset.description}
              </p>

              {/* Metric Callout */}
              <div className="mt-3 p-2 bg-gray-900/80 border border-gray-800 rounded-lg text-xs flex items-center justify-between">
                <span className="text-gray-500 text-[10px]">即時度量基準:</span>
                <span className="font-mono text-emerald-400 font-bold">{preset.previewMetric}</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {preset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopySpec(preset)}
                className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-colors text-xs flex items-center gap-1"
                title="複製 JSON Spec"
              >
                {copiedId === preset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLoadPreset(preset)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <Activity className="w-3.5 h-3.5" />
                  進入工作台編輯
                </button>
                <button
                  onClick={() => onAddToDashboard(preset)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs border border-gray-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  加入儀錶板
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

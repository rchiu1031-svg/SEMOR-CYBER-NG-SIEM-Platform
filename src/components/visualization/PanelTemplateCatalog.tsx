import React, { useState } from 'react';
import {
  Search,
  Activity,
  TrendingUp,
  Zap,
  List,
  Globe,
  BarChart3,
  PieChart,
  LayoutGrid,
  Terminal,
  Bell,
  Network,
  Workflow,
  History,
  Target,
  FileText,
  Layers,
  Package,
  Layout,
  Cpu,
  Radio,
  Check
} from 'lucide-react';
import { PanelTemplateId, TemplateCategory } from './types';
import { PANEL_TEMPLATES_CATALOG } from './mockData';

interface PanelTemplateCatalogProps {
  selectedTemplate: PanelTemplateId;
  onSelectTemplate: (templateId: PanelTemplateId) => void;
}

export function PanelTemplateCatalog({
  selectedTemplate,
  onSelectTemplate
}: PanelTemplateCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');

  const categories: { id: TemplateCategory | 'all'; label: string }[] = [
    { id: 'all', label: '全部 (21)' },
    { id: 'trends', label: '趨勢時間序列' },
    { id: 'metrics', label: '指標與量錶' },
    { id: 'distribution', label: '比例與分佈' },
    { id: 'logs_alerts', label: '安全日誌告警' },
    { id: 'topology_traces', label: '拓撲與追蹤' },
    { id: 'specialized', label: '自由擴充' }
  ];

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'List': return <List className="w-4 h-4" />;
      case 'Globe': return <Globe className="w-4 h-4" />;
      case 'BarChart3': return <BarChart3 className="w-4 h-4" />;
      case 'PieChart': return <PieChart className="w-4 h-4" />;
      case 'LayoutGrid': return <LayoutGrid className="w-4 h-4" />;
      case 'Terminal': return <Terminal className="w-4 h-4" />;
      case 'Bell': return <Bell className="w-4 h-4" />;
      case 'Network': return <Network className="w-4 h-4" />;
      case 'Workflow': return <Workflow className="w-4 h-4" />;
      case 'History': return <History className="w-4 h-4" />;
      case 'Target': return <Target className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Layers': return <Layers className="w-4 h-4" />;
      case 'Package': return <Package className="w-4 h-4" />;
      case 'Layout': return <Layout className="w-4 h-4" />;
      case 'Radio': return <Radio className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const filteredTemplates = PANEL_TEMPLATES_CATALOG.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#0f111a] border border-gray-800 rounded-xl overflow-hidden shadow-xl text-xs">
      {/* Search Header */}
      <div className="p-3 bg-gray-900/90 border-b border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-xs uppercase tracking-wider">圖表範本庫 (Templates)</span>
          <span className="text-[10px] text-blue-400 font-mono bg-blue-950/60 border border-blue-800 px-1.5 py-0.5 rounded">
            {filteredTemplates.length} / 21 個視覺化模式
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜尋範本 (如 Time Series, Geomap)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-800/80 text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 group ${
                isSelected
                  ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-800/60'
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-colors mt-0.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 group-hover:text-blue-400 group-hover:bg-gray-750'
                }`}
              >
                {getTemplateIcon(template.iconName)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                    {template.name}
                  </span>
                  {template.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                      {template.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {template.description}
                </p>

                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                  <span>推薦資料源: <strong className="text-gray-300 font-normal">{template.recommendedDataSource}</strong></span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

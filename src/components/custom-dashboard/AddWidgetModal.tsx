import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Activity, 
  TrendingUp, 
  Layers, 
  Terminal, 
  Network, 
  CheckCircle2, 
  Plus, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DashboardWidget, WidgetType } from './types';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (newWidget: DashboardWidget) => void;
}

interface WidgetCatalogItem {
  id: string;
  title: string;
  category: 'KPI Metrics' | 'Time-Series' | 'Threat Distribution' | 'Audit & Tables' | 'Posture & Gauges';
  type: WidgetType;
  description: string;
  defaultWidth: 'col-span-12' | 'col-span-8' | 'col-span-6' | 'col-span-4' | 'col-span-3';
  dataSource: string;
  color: string;
  previewSnippet: string;
  sampleConfig: any;
}

const CATALOG_ITEMS: WidgetCatalogItem[] = [
  {
    id: 'cat-stat-eps',
    title: '即時事件解析速率 (EPS Throughput)',
    category: 'KPI Metrics',
    type: 'stat',
    description: '顯示全網每秒事件處理吞吐量、峰值對比與即時趨勢曲線。',
    defaultWidth: 'col-span-3',
    dataSource: 'VictoriaLogs Engine',
    color: '#3b82f6',
    previewSnippet: '148,500 EPS (+12%)',
    sampleConfig: {
      statValue: '148,500',
      statChange: '+12.4% peak',
      statTrend: 'up',
      showSparkline: true,
      unit: 'EPS',
      chartData: [
        { time: '1', value: 120 },
        { time: '2', value: 135 },
        { time: '3', value: 142 },
        { time: '4', value: 148.5 },
      ]
    }
  },
  {
    id: 'cat-stat-threats',
    title: '活躍重大攻擊威脅 (P1/P2 Critical Threats)',
    category: 'KPI Metrics',
    type: 'stat',
    description: '即時統計未遏止之高危入侵警報，附帶臨界值自動脈衝警示。',
    defaultWidth: 'col-span-3',
    dataSource: 'Semor AI Correlation Engine',
    color: '#ef4444',
    previewSnippet: '8 威脅 (Critical Alert)',
    sampleConfig: {
      statValue: '8',
      statChange: '3 Critical / 5 High',
      statTrend: 'up',
      alertThresholdExceeded: true,
      showSparkline: true,
      unit: '件',
      chartData: [
        { time: '1', value: 2 },
        { time: '2', value: 4 },
        { time: '3', value: 5 },
        { time: '4', value: 8 },
      ]
    }
  },
  {
    id: 'cat-area-traffic',
    title: '多協定流量關聯趨勢 (Multi-Protocol Flow)',
    category: 'Time-Series',
    type: 'timeseries_area',
    description: '堆疊展示 TCP、UDP、HTTPS 及異常通訊串流歷程。',
    defaultWidth: 'col-span-8',
    dataSource: 'OpenSearch NetFlow Analytics',
    color: '#3b82f6',
    previewSnippet: '堆疊面積圖 (TCP / UDP / HTTP / Anomaly)',
    sampleConfig: {
      showLegend: true,
      stacked: true,
      seriesKeys: [
        { key: 'tcp', name: 'TCP Traffic', color: '#3b82f6' },
        { key: 'udp', name: 'UDP Traffic', color: '#10b981' },
        { key: 'anomaly', name: 'Exfiltration Alert', color: '#ef4444' }
      ],
      chartData: [
        { time: '10:00', tcp: 300, udp: 90, anomaly: 2 },
        { time: '10:15', tcp: 420, udp: 110, anomaly: 6 },
        { time: '10:30', tcp: 510, udp: 130, anomaly: 18 },
        { time: '10:45', tcp: 450, udp: 105, anomaly: 4 },
      ]
    }
  },
  {
    id: 'cat-bar-severity',
    title: 'Syslog 資安事件嚴重性頻譜 (Severity Distribution)',
    category: 'Time-Series',
    type: 'timeseries_bar',
    description: '長條圖展示 Emergency、Critical、Warning 與 Info 級別事件。',
    defaultWidth: 'col-span-6',
    dataSource: 'VictoriaLogs Syslog-NG',
    color: '#8b5cf6',
    previewSnippet: '堆疊長條圖 (Emergency / Critical / Warning / Info)',
    sampleConfig: {
      showLegend: true,
      stacked: true,
      seriesKeys: [
        { key: 'crit', name: 'Critical (嚴重)', color: '#ef4444' },
        { key: 'warn', name: 'Warning (警告)', color: '#f59e0b' },
        { key: 'info', name: 'Info (一般)', color: '#3b82f6' }
      ],
      chartData: [
        { time: '08:00', crit: 4, warn: 12, info: 90 },
        { time: '09:00', crit: 7, warn: 20, info: 120 },
        { time: '10:00', crit: 15, warn: 35, info: 180 },
      ]
    }
  },
  {
    id: 'cat-donut-threats',
    title: '威脅來源地理與 ASN 分佈 (Threat Origins)',
    category: 'Threat Distribution',
    type: 'donut',
    description: '甜甜圈圖解析邊界防火牆攔截之境外攻擊來源國別與自治系統 (ASN)。',
    defaultWidth: 'col-span-4',
    dataSource: 'Perimeter WAF / CTI Feed',
    color: '#f97316',
    previewSnippet: '甜甜圈分佈 (東歐 / 北美 / 東南亞 / Tor)',
    sampleConfig: {
      showLegend: true,
      chartData: [
        { name: '東歐境外代理', value: 45, color: '#ef4444' },
        { name: '北美殭屍網路', value: 25, color: '#f97316' },
        { name: '東南亞中繼站', value: 18, color: '#eab308' },
        { name: 'Tor 匿名節點', value: 12, color: '#a855f7' },
      ]
    }
  },
  {
    id: 'cat-gauge-posture',
    title: '企業資安防護合規量表 (Security Posture Gauge)',
    category: 'Posture & Gauges',
    type: 'gauge',
    description: '環形量表評估全域端點合規率、CIS 基準與防禦漏洞加權得分。',
    defaultWidth: 'col-span-3',
    dataSource: 'CIS Benchmark Evaluator',
    color: '#10b981',
    previewSnippet: '88% 合規評分 (Good)',
    sampleConfig: {
      gaugeValue: 88,
      gaugeMax: 100,
      gaugeLabel: '88% 企業資安基準達標'
    }
  },
  {
    id: 'cat-table-ueba',
    title: 'AI 實體行為分析 (UEBA) 高風險名單',
    category: 'Audit & Tables',
    type: 'table',
    description: '高密度表格追蹤異常操作帳號、部門、偏差指數與建議 SOAR 處置動作。',
    defaultWidth: 'col-span-6',
    dataSource: 'Semor AI UEBA Engine',
    color: '#06b6d4',
    previewSnippet: 'UEBA 使用者偏差監控表',
    sampleConfig: {
      tableColumns: [
        { key: 'user', label: '帳號 / 實體名稱', isMono: true },
        { key: 'dept', label: '部門' },
        { key: 'anomaly', label: '主要異常行為' },
        { key: 'riskScore', label: '風險指數' },
        { key: 'action', label: '建議動作' }
      ],
      tableData: [
        { user: 'kevin.lin@corp.local', dept: 'SecOps', anomaly: '短時間下載未授權 CTI 威脅特徵包', riskScore: 88, action: '查驗權限' },
        { user: 'srv-db-sync', dept: 'Data Platform', anomaly: '非預期排程觸發跨網段大量傳輸', riskScore: 79, action: '審計日誌' },
      ]
    }
  },
  {
    id: 'cat-table-blocked-ips',
    title: '邊界防火牆即時阻斷 IP 清單 (Null-Routed)',
    category: 'Audit & Tables',
    type: 'table',
    description: '展示邊界核心防火牆自動下發阻斷之外部黑名單與命中防禦規則。',
    defaultWidth: 'col-span-6',
    dataSource: 'Edge Firewall Syslog',
    color: '#ef4444',
    previewSnippet: '防火牆封鎖清單表格',
    sampleConfig: {
      tableColumns: [
        { key: 'ip', label: '惡意來源 IP', isMono: true },
        { key: 'geo', label: '地理 / 國家' },
        { key: 'hits', label: '攔截次數' },
        { key: 'rule', label: '命中防禦規則' }
      ],
      tableData: [
        { ip: '185.196.220.14', geo: 'BG (Bulgaria)', hits: '4,892 次', rule: 'RULE-BRUTE-FORCE-SSH' },
        { ip: '45.154.255.89', geo: 'RU (Russia)', hits: '2,310 次', rule: 'RULE-CVE-2024-LOG4J' },
      ]
    }
  }
];

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  onAddWidget
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'KPI Metrics', 'Time-Series', 'Threat Distribution', 'Audit & Tables', 'Posture & Gauges'];

  const filteredItems = CATALOG_ITEMS.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.dataSource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSelectCatalogItem = (item: WidgetCatalogItem) => {
    const newWidget: DashboardWidget = {
      id: `w-${Date.now()}`,
      title: item.title,
      description: item.description,
      type: item.type,
      width: item.defaultWidth,
      dataSource: item.dataSource,
      color: item.color,
      customConfig: item.sampleConfig
    };
    onAddWidget(newWidget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#16161c]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">組件範本庫 (Widget Catalog)</h3>
              <p className="text-xs text-gray-400">挑選預設企業級戰情儀表板卡片或自訂指標串流</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-gray-800/80 bg-[#141418] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl w-72">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜尋組件名稱或資料來源..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                {cat === 'All' ? '全部類別' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#16161b] border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 transition-all flex flex-col justify-between group relative shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400 uppercase">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-blue-400">
                      {item.dataSource}
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {item.defaultWidth.replace('col-span-', '')}/12 欄
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {item.description}
                </p>

                {/* Visual Preview Badge */}
                <div className="mt-3 p-2 bg-black/40 border border-gray-800/80 rounded-lg text-[11px] font-mono text-gray-400 flex items-center justify-between">
                  <span>預覽預設格式:</span>
                  <span className="text-emerald-400 font-bold">{item.previewSnippet}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectCatalogItem(item)}
                className="mt-4 w-full py-2 bg-gray-800 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md group-hover:shadow-blue-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                加入儀表板
              </button>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#141418] flex items-center justify-between text-xs text-gray-500">
          <span>共 {filteredItems.length} 項精選組件範本</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Database, 
  Maximize2, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { DashboardWidget } from './types';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

interface WidgetFullscreenModalProps {
  isOpen: boolean;
  widget: DashboardWidget | null;
  onClose: () => void;
}

export const WidgetFullscreenModal: React.FC<WidgetFullscreenModalProps> = ({
  isOpen,
  widget,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual');

  if (!isOpen || !widget) return null;

  const { title, description, type, dataSource, color, customConfig } = widget;

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (customConfig?.chartData) {
      const keys = Object.keys(customConfig.chartData[0] || {});
      csvContent += keys.join(',') + '\r\n';
      customConfig.chartData.forEach((row: any) => {
        csvContent += keys.map((k) => row[k]).join(',') + '\r\n';
      });
    } else if (customConfig?.tableData) {
      const keys = Object.keys(customConfig.tableData[0] || {});
      csvContent += keys.join(',') + '\r\n';
      customConfig.tableData.forEach((row: any) => {
        csvContent += keys.map((k) => `"${row[k]}"`).join(',') + '\r\n';
      });
    } else {
      csvContent += 'metric,value\r\n' + `${widget.title},${customConfig?.statValue || 'N/A'}\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${widget.title.replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-gray-800 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-gray-800 bg-[#16161c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-blue-400 border border-gray-700">
                  {dataSource}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${activeTab === 'visual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                高畫質視覺圖表
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${activeTab === 'raw' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                原始遙測數據 (Raw)
              </button>
            </div>

            {/* Export button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              匯出 CSV
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0f0f13]">
          {activeTab === 'visual' ? (
            <div className="h-full flex flex-col justify-between">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-500">主指標數值</span>
                  <p className="text-2xl font-black text-white mt-1">{customConfig?.statValue || '148,500'}</p>
                </div>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-500">取樣間隔</span>
                  <p className="text-2xl font-black text-blue-400 mt-1">15 秒 (Realtime)</p>
                </div>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-500">信賴度評分</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">99.8%</p>
                </div>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-500">觸發警報</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">{customConfig?.alertThresholdExceeded ? 'CRITICAL' : 'NORMAL'}</p>
                </div>
              </div>

              {/* Large Chart Container */}
              <div className="flex-1 min-h-[380px] bg-[#141418] border border-gray-800 rounded-2xl p-6 shadow-inner">
                {type === 'timeseries_area' || type === 'stat' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={customConfig?.chartData || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="time" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                      <Legend />
                      {(customConfig?.seriesKeys || [{ key: 'value', name: 'Value', color: color || '#3b82f6' }]).map((s) => (
                        <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.25} strokeWidth={2} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : type === 'timeseries_bar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customConfig?.chartData || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="time" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                      <Legend />
                      {(customConfig?.seriesKeys || [{ key: 'value', name: 'Value', color: '#8b5cf6' }]).map((s) => (
                        <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    已切換至全螢幕檢視模式，可點選右上角「原始遙測數據」查看所有序列詳情
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Raw JSON / Data Viewer */
            <div className="bg-[#141418] border border-gray-800 rounded-2xl p-4 font-mono text-xs text-blue-300 overflow-auto max-h-full">
              <pre>{JSON.stringify(customConfig?.chartData || customConfig?.tableData || widget, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

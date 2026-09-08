import React from 'react';
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
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Settings2, 
  Trash2, 
  Maximize2, 
  RefreshCw, 
  GripVertical, 
  ArrowUpRight, 
  ShieldAlert, 
  Network, 
  Database, 
  Terminal, 
  Layers, 
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DashboardWidget, WidgetWidth } from './types';

interface WidgetRendererProps {
  widget: DashboardWidget;
  isEditMode: boolean;
  onEditWidget: (widget: DashboardWidget) => void;
  onDeleteWidget: (widgetId: string) => void;
  onFullscreenWidget: (widget: DashboardWidget) => void;
  onChangeWidth: (widgetId: string, newWidth: WidgetWidth) => void;
  onMoveWidget?: (widgetId: string, direction: 'up' | 'down') => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isEditMode,
  onEditWidget,
  onDeleteWidget,
  onFullscreenWidget,
  onChangeWidth,
  onMoveWidget
}) => {
  const { title, description, type, width, dataSource, color, customConfig } = widget;

  const renderWidgetIcon = () => {
    switch (type) {
      case 'stat':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'timeseries_area':
      case 'timeseries_line':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'timeseries_bar':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'donut':
        return <Network className="w-4 h-4 text-amber-400" />;
      case 'table':
        return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'gauge':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'network_flow':
        return <Network className="w-4 h-4 text-indigo-400" />;
      default:
        return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderWidgetContent = () => {
    switch (type) {
      case 'stat': {
        const val = customConfig?.statValue || '0';
        const change = customConfig?.statChange || '';
        const trend = customConfig?.statTrend || 'neutral';
        const isAlert = customConfig?.alertThresholdExceeded;
        const sparkData = customConfig?.chartData || [
          { time: '1', value: 4 },
          { time: '2', value: 7 },
          { time: '3', value: 5 },
          { time: '4', value: 8 },
          { time: '5', value: 12 },
        ];

        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className={cn(
                  "text-3xl font-black tracking-tight",
                  isAlert ? "text-red-400" : "text-white"
                )}>
                  {val}
                </span>
                {customConfig?.unit && (
                  <span className="text-xs font-semibold text-gray-500 ml-1.5">{customConfig.unit}</span>
                )}
              </div>

              {change && (
                <div className={cn(
                  "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border",
                  trend === 'up' 
                    ? (isAlert ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                )}>
                  {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{change}</span>
                </div>
              )}
            </div>

            {/* Sparkline */}
            {customConfig?.showSparkline !== false && (
              <div className="h-14 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`stat-grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color || '#3b82f6'} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={color || '#3b82f6'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={color || '#3b82f6'} 
                      strokeWidth={2}
                      fill={`url(#stat-grad-${widget.id})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      }

      case 'timeseries_area': {
        const data = customConfig?.chartData || [];
        const series = customConfig?.seriesKeys || [{ key: 'value', name: 'Value', color: '#3b82f6' }];

        return (
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {series.map((s) => (
                    <linearGradient key={s.key} id={`grad-${widget.id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                />
                {customConfig?.showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />}
                {series.map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    fill={`url(#grad-${widget.id}-${s.key})`}
                    strokeWidth={2}
                    stackId={customConfig?.stacked ? '1' : undefined}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'timeseries_bar': {
        const data = customConfig?.chartData || [];
        const series = customConfig?.seriesKeys || [{ key: 'value', name: 'Value', color: '#8b5cf6' }];

        return (
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                />
                {customConfig?.showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />}
                {series.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    fill={s.color}
                    stackId={customConfig?.stacked ? 'a' : undefined}
                    radius={customConfig?.stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'timeseries_line': {
        const data = customConfig?.chartData || [];
        const series = customConfig?.seriesKeys || [{ key: 'value', name: 'Metric', color: '#10b981' }];

        return (
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                />
                {customConfig?.showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />}
                {series.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: s.color }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'donut': {
        const data = customConfig?.chartData || [];
        const total = data.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);

        return (
          <div className="h-56 w-full mt-2 flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white">{total}</span>
              <span className="text-[10px] text-gray-500 uppercase font-bold">總數計</span>
            </div>

            {/* Custom mini legend */}
            <div className="w-full flex flex-wrap justify-center gap-3 mt-1 px-2">
              {data.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1 text-[11px] text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate max-w-[120px]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'gauge': {
        const val = customConfig?.gaugeValue || 85;
        const max = customConfig?.gaugeMax || 100;
        const percent = Math.round((val / max) * 100);
        const label = customConfig?.gaugeLabel || '合規率良好';

        return (
          <div className="h-44 w-full flex flex-col items-center justify-center text-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={cn(percent >= 80 ? "text-emerald-500" : percent >= 60 ? "text-amber-500" : "text-red-500")}
                  strokeDasharray={`${percent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white">{percent}%</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">SCORE</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-300 mt-2">{label}</p>
          </div>
        );
      }

      case 'table': {
        const columns = customConfig?.tableColumns || [];
        const rows = customConfig?.tableData || [];

        return (
          <div className="mt-3 overflow-x-auto max-h-64 custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/60 sticky top-0">
                <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  {columns.map((col: any) => (
                    <th key={col.key} className="py-2.5 px-3">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-gray-800/40 transition-colors">
                    {columns.map((col: any) => {
                      const val = row[col.key];
                      const isStatus = col.key === 'riskScore' || col.key === 'action' || col.key === 'state';

                      if (col.key === 'riskScore') {
                        const num = Number(val);
                        return (
                          <td key={col.key} className="py-2.5 px-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              num >= 85 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              num >= 70 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            )}>
                              {num} / 100
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'action' || col.key === 'state') {
                        return (
                          <td key={col.key} className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {val}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td 
                          key={col.key} 
                          className={cn(
                            "py-2.5 px-3 text-gray-300",
                            col.isMono && "font-mono font-bold text-blue-300 text-[11px]"
                          )}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'network_flow': {
        const rows = customConfig?.tableData || [];

        return (
          <div className="mt-3 overflow-x-auto max-h-56 custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/60 sticky top-0">
                <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <th className="py-2.5 px-3">來源主機 / IP</th>
                  <th className="py-2.5 px-3">目的節點 / 外部 IP</th>
                  <th className="py-2.5 px-3">協定 / 連接埠</th>
                  <th className="py-2.5 px-3">累計流量</th>
                  <th className="py-2.5 px-3">即時速率</th>
                  <th className="py-2.5 px-3">安全狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{row.source}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-300">{row.destination}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                        {row.protocol}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{row.bytes}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400">{row.rate}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        row.status.includes('CRITICAL') ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" :
                        row.status.includes('MONITORING') ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return (
          <div className="p-8 text-center text-gray-500 text-xs">
            未定義之圖表組件型態
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "bg-[#111114] border border-gray-800 rounded-2xl p-5 shadow-xl relative group flex flex-col justify-between transition-all duration-200 hover:border-gray-700",
      width,
      isEditMode && "border-blue-500/40 hover:border-blue-500 shadow-blue-500/5 ring-1 ring-blue-500/20"
    )}>
      {/* Edit Mode Top Action Bar */}
      {isEditMode && (
        <div className="absolute -top-3 right-4 flex items-center gap-1.5 bg-[#18181b] border border-gray-700 rounded-lg px-2 py-1 shadow-2xl z-20">
          {/* Change width selector */}
          <select
            value={width}
            onChange={(e) => onChangeWidth(widget.id, e.target.value as WidgetWidth)}
            className="bg-transparent text-[10px] font-bold text-gray-300 focus:outline-none cursor-pointer pr-1"
            title="調整卡片寬度"
          >
            <option value="col-span-3" className="bg-gray-900">1/4 寬度 (3 欄)</option>
            <option value="col-span-4" className="bg-gray-900">1/3 寬度 (4 欄)</option>
            <option value="col-span-6" className="bg-gray-900">1/2 寬度 (6 欄)</option>
            <option value="col-span-8" className="bg-gray-900">2/3 寬度 (8 欄)</option>
            <option value="col-span-12" className="bg-gray-900">全寬度 (12 欄)</option>
          </select>

          <div className="w-[1px] h-3 bg-gray-700" />

          {/* Edit config */}
          <button
            onClick={() => onEditWidget(widget)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400 transition-colors"
            title="編輯指標與外觀"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete widget */}
          <button
            onClick={() => onDeleteWidget(widget.id)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
            title="刪除組件"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Widget Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {isEditMode && (
              <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <div className="p-1.5 bg-gray-900 border border-gray-800 rounded-lg shrink-0">
              {renderWidgetIcon()}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-200 truncate tracking-tight">
                {title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-gray-500 bg-gray-900/80 px-2 py-0.5 rounded border border-gray-800">
              {dataSource}
            </span>

            {/* Fullscreen deep-dive */}
            <button
              onClick={() => onFullscreenWidget(widget)}
              className="p-1 text-gray-500 hover:text-white rounded hover:bg-gray-800 transition-colors"
              title="全螢幕放大檢視"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {description && (
          <p className="text-[11px] text-gray-500 mb-2 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {renderWidgetContent()}
      </div>
    </div>
  );
};

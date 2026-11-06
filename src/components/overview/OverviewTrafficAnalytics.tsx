import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Activity, Radio, BarChart2, Layers } from 'lucide-react';
import { TrafficDataPoint } from './types';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface OverviewTrafficAnalyticsProps {
  data: TrafficDataPoint[];
  isZh: boolean;
}

export const OverviewTrafficAnalytics: React.FC<OverviewTrafficAnalyticsProps> = ({
  data,
  isZh
}) => {
  const { isLight } = useTheme();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [visibleWorkers, setVisibleWorkers] = useState<{ [key: string]: boolean }>({
    worker1: true,
    worker2: true,
    worker3: true,
  });

  const toggleWorker = (key: string) => {
    setVisibleWorkers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalEps = data.reduce((acc, curr) => acc + curr.worker1Eps + curr.worker2Eps + curr.worker3Eps, 0);
  const avgEps = Math.round(totalEps / (data.length * 3));

  return (
    <div className={`border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#111114] border-gray-800/80'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-blue-500" size={18} />
            <h2 className={`text-base font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isZh ? '分散式跨集群 (CCS) 流量與 EPS 即時分析' : 'Distributed CCS Ingestion & EPS Telemetry'}
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            {isZh
              ? '即時監控台北主要節點、東京邊緣與法蘭克福搜尋節點事件吞吐'
              : 'Real-time multi-worker log parsing & search throughput stream'}
          </p>
        </div>

        {/* Worker toggles and view selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Worker toggles */}
          <div className={`flex items-center gap-1.5 p-1 rounded-lg border text-[11px] ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-gray-800'
          }`}>
            <button
              onClick={() => toggleWorker('worker1')}
              className={cn(
                "px-2 py-0.5 rounded flex items-center gap-1.5 transition-all font-medium",
                visibleWorkers.worker1 
                  ? "bg-blue-600/20 text-blue-500 border border-blue-500/30" 
                  : isLight ? "text-slate-400 hover:text-slate-600" : "text-gray-500"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Worker-01 (TPE)</span>
            </button>
            <button
              onClick={() => toggleWorker('worker2')}
              className={cn(
                "px-2 py-0.5 rounded flex items-center gap-1.5 transition-all font-medium",
                visibleWorkers.worker2 
                  ? "bg-emerald-600/20 text-emerald-500 border border-emerald-500/30" 
                  : isLight ? "text-slate-400 hover:text-slate-600" : "text-gray-500"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Worker-02 (TYO)</span>
            </button>
            <button
              onClick={() => toggleWorker('worker3')}
              className={cn(
                "px-2 py-0.5 rounded flex items-center gap-1.5 transition-all font-medium",
                visibleWorkers.worker3 
                  ? "bg-purple-600/20 text-purple-500 border border-purple-500/30" 
                  : isLight ? "text-slate-400 hover:text-slate-600" : "text-gray-500"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Worker-03 (FRA)</span>
            </button>
          </div>

          {/* Chart type toggle */}
          <div className={`flex items-center p-1 rounded-lg border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-gray-800'
          }`}>
            <button
              onClick={() => setChartType('area')}
              className={cn(
                "p-1 rounded text-xs transition-all",
                chartType === 'area' 
                  ? isLight ? "bg-white text-slate-900 shadow-sm" : "bg-gray-800 text-white" 
                  : isLight ? "text-slate-500 hover:text-slate-900" : "text-gray-400 hover:text-white"
              )}
              title={isZh ? '面積圖' : 'Area Chart'}
            >
              <Activity size={14} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                "p-1 rounded text-xs transition-all",
                chartType === 'bar' 
                  ? isLight ? "bg-white text-slate-900 shadow-sm" : "bg-gray-800 text-white" 
                  : isLight ? "text-slate-500 hover:text-slate-900" : "text-gray-400 hover:text-white"
              )}
              title={isZh ? '長條圖' : 'Bar Chart'}
            >
              <BarChart2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="worker1Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="worker2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="worker3Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1f2937'} vertical={false} />
              <XAxis dataKey="time" stroke={isLight ? '#64748b' : '#6b7280'} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={isLight ? '#64748b' : '#6b7280'} fontSize={11} tickLine={false} axisLine={false} unit=" eps" />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#ffffff' : '#111114',
                  borderColor: isLight ? '#cbd5e1' : '#374151',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: isLight ? '#0f172a' : '#fff' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                iconType="circle"
              />
              {visibleWorkers.worker1 && (
                <Area
                  type="monotone"
                  dataKey="worker1Eps"
                  name={isZh ? 'Worker-01 (台北核心)' : 'Worker-01 (Taipei)'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#worker1Grad)"
                />
              )}
              {visibleWorkers.worker2 && (
                <Area
                  type="monotone"
                  dataKey="worker2Eps"
                  name={isZh ? 'Worker-02 (東京邊緣)' : 'Worker-02 (Tokyo)'}
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#worker2Grad)"
                />
              )}
              {visibleWorkers.worker3 && (
                <Area
                  type="monotone"
                  dataKey="worker3Eps"
                  name={isZh ? 'Worker-03 (法蘭克福)' : 'Worker-03 (Frankfurt)'}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#worker3Grad)"
                />
              )}
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1f2937'} vertical={false} />
              <XAxis dataKey="time" stroke={isLight ? '#64748b' : '#6b7280'} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={isLight ? '#64748b' : '#6b7280'} fontSize={11} tickLine={false} axisLine={false} unit=" eps" />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#ffffff' : '#111114',
                  borderColor: isLight ? '#cbd5e1' : '#374151',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: isLight ? '#0f172a' : '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
              {visibleWorkers.worker1 && (
                <Bar dataKey="worker1Eps" name={isZh ? 'Worker-01 (台北)' : 'Worker-01 (TPE)'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              )}
              {visibleWorkers.worker2 && (
                <Bar dataKey="worker2Eps" name={isZh ? 'Worker-02 (東京)' : 'Worker-02 (TYO)'} fill="#10b981" radius={[4, 4, 0, 0]} />
              )}
              {visibleWorkers.worker3 && (
                <Bar dataKey="worker3Eps" name={isZh ? 'Worker-03 (法蘭克福)' : 'Worker-03 (FRA)'} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer statistics summary */}
      <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <div>
            <span>{isZh ? '平均節點吞吐：' : 'Avg Node Throughput: '}</span>
            <strong className="text-white font-mono">{avgEps} EPS</strong>
          </div>
          <div className="w-px h-3 bg-gray-800"></div>
          <div>
            <span>{isZh ? '全域峰值帶寬：' : 'Peak Ingress: '}</span>
            <strong className="text-emerald-400 font-mono">7.2 Gbps</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <Radio size={12} className="text-blue-500" />
          <span>{isZh ? '日誌無損緩衝隊列：0.00% 丟包率' : 'Lossless queue: 0.00% drop rate'}</span>
        </div>
      </div>
    </div>
  );
};

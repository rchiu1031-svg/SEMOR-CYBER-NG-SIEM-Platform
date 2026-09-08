import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { ShieldCheck, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ExecutiveTimeRange, ExecutiveTrendDataPoint } from './types';
import { TREND_DATA_7D, TREND_DATA_30D, TREND_DATA_90D } from './executiveData';

interface ExecutiveTrendChartProps {
  timeRange: ExecutiveTimeRange;
  isZh: boolean;
}

export function ExecutiveTrendChart({ timeRange, isZh }: ExecutiveTrendChartProps) {
  const [chartMode, setChartMode] = useState<'threats' | 'financial'>('threats');

  const data: ExecutiveTrendDataPoint[] =
    timeRange === '7d'
      ? TREND_DATA_7D
      : timeRange === '30d'
      ? TREND_DATA_30D
      : TREND_DATA_90D;

  const totalAttacks = data.reduce((acc, d) => acc + d.attacksDetected, 0);
  const totalNeutralized = data.reduce((acc, d) => acc + d.threatsNeutralized, 0);
  const totalLossesPrevented = data.reduce((acc, d) => acc + d.lossesPreventedUsd, 0);

  return (
    <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? '戰略威脅趨勢與財務風險避險成效' : 'Strategic Threat Velocity & Financial Loss Mitigation'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '跨時間軸追蹤資安防線攔截效率、平均應變速度 (MTTR) 與預期財務損失避險累積'
              : 'Tracking attack interception rates, resolution velocity, and calculated loss avoidance'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setChartMode('threats')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              chartMode === 'threats'
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-gray-400 hover:text-white"
            )}
          >
            {isZh ? '威脅與防禦攔截 (件數)' : 'Threats vs Defended'}
          </button>
          <button
            type="button"
            onClick={() => setChartMode('financial')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              chartMode === 'financial'
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-gray-400 hover:text-white"
            )}
          >
            {isZh ? '預期財務避險 (USD)' : 'Losses Averted ($)'}
          </button>
        </div>
      </div>

      {/* Snapshot Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-black/30 border border-white/5 rounded-2xl">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono text-gray-500 block">
              {isZh ? '區間總偵測威脅' : 'Attacks Detected'}
            </span>
            <span className="text-xl font-black font-mono text-white">
              {totalAttacks.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 sm:border-l sm:border-white/5 sm:pl-4">
          <div>
            <span className="text-[10px] uppercase font-mono text-gray-500 block">
              {isZh ? '自動中和處置率' : 'Neutralized Deflection'}
            </span>
            <span className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck size={18} />
              {((totalNeutralized / totalAttacks) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 sm:border-l sm:border-white/5 sm:pl-4">
          <div>
            <span className="text-[10px] uppercase font-mono text-gray-500 block">
              {isZh ? '避險財務總值' : 'Prevented Loss Value'}
            </span>
            <span className="text-xl font-black font-mono text-blue-400 flex items-center gap-1">
              <DollarSign size={16} />
              ${(totalLossesPrevented / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'threats' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111114',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ fontSize: 12, fontWeight: 700 }}
              />
              <Area
                name={isZh ? '偵測威脅' : 'Detected Attacks'}
                type="monotone"
                dataKey="attacksDetected"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAttacks)"
              />
              <Area
                name={isZh ? '已處置阻斷' : 'Neutralized Threats'}
                type="monotone"
                dataKey="threatsNeutralized"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorBlocked)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any) => [
                  `$${Number(value).toLocaleString()} USD`,
                  isZh ? '預估避險金額' : 'Losses Averted'
                ]}
                contentStyle={{
                  backgroundColor: '#111114',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '1rem'
                }}
              />
              <Bar
                name={isZh ? '預估避險金額 (USD)' : 'Losses Averted'}
                dataKey="lossesPreventedUsd"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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
import { ShieldCheck, DollarSign, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { ExecutiveTimeRange, ExecutiveTrendDataPoint } from './types';
import { TREND_DATA_7D, TREND_DATA_30D, TREND_DATA_90D } from './executiveData';

interface ExecutiveTrendChartProps {
  timeRange: ExecutiveTimeRange;
  isZh: boolean;
  data?: ExecutiveTrendDataPoint[];
}

export function ExecutiveTrendChart({ timeRange, isZh, data: externalData }: ExecutiveTrendChartProps) {
  const { isLight } = useTheme();
  const [chartMode, setChartMode] = useState<'threats' | 'financial'>('threats');

  const data: ExecutiveTrendDataPoint[] =
    externalData && externalData.length > 0
      ? externalData
      : timeRange === '7d'
      ? TREND_DATA_7D
      : timeRange === '30d'
      ? TREND_DATA_30D
      : TREND_DATA_90D;

  const totalAttacks = data.reduce((acc, d) => acc + d.attacksDetected, 0);
  const totalNeutralized = data.reduce((acc, d) => acc + d.threatsNeutralized, 0);
  const totalLossesPrevented = data.reduce((acc, d) => acc + d.lossesPreventedUsd, 0);
  const deflectionPct = totalAttacks > 0 ? ((totalNeutralized / totalAttacks) * 100).toFixed(1) : '100.0';

  const gridStroke = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)';
  const axisTickColor = isLight ? '#475569' : '#9ca3af';
  const tooltipStyle = {
    backgroundColor: isLight ? '#ffffff' : '#111114',
    borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)',
    color: isLight ? '#0f172a' : '#f8fafc',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-blue-500 shrink-0" />
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? '戰略威脅攔截趨勢與財務風險避險成效' : 'Strategic Threat Velocity & Financial Loss Mitigation'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '跨時間軸追蹤資安防線攔截效率、平均應變速度 (MTTR) 與預期財務損失避險累積'
              : 'Tracking attack interception rates, resolution velocity, and calculated loss avoidance'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setChartMode('threats')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
              chartMode === 'threats'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {isZh ? '威脅與防禦攔截 (件數)' : 'Threats vs Defended'}
          </button>
          <button
            type="button"
            onClick={() => setChartMode('financial')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
              chartMode === 'financial'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {isZh ? '預期財務避險 (USD)' : 'Losses Averted ($)'}
          </button>
        </div>
      </div>

      {/* Snapshot Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 px-4 bg-black/30 border border-white/5 rounded-xl">
        <div>
          <span className="text-[10px] uppercase font-mono text-gray-400 block">
            {isZh ? '區間總偵測威脅' : 'Attacks Detected'}
          </span>
          <span className="text-xl font-black font-mono tabular-nums text-white">
            {totalAttacks.toLocaleString()}
          </span>
        </div>

        <div className="sm:border-l sm:border-white/10 sm:pl-4">
          <span className="text-[10px] uppercase font-mono text-gray-400 block">
            {isZh ? '自動中和處置率' : 'Neutralized Deflection'}
          </span>
          <span className="text-xl font-black font-mono tabular-nums text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck size={17} />
            {deflectionPct}%
          </span>
        </div>

        <div className="sm:border-l sm:border-white/10 sm:pl-4">
          <span className="text-[10px] uppercase font-mono text-gray-400 block">
            {isZh ? '避險財務總值' : 'Prevented Loss Value'}
          </span>
          <span className="text-xl font-black font-mono tabular-nums text-blue-400 flex items-center gap-1">
            <DollarSign size={16} />
            ${(totalLossesPrevented / 1000000).toFixed(2)}M
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'threats' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 600 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 600 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 600 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any) => [
                  `$${Number(value).toLocaleString()} USD`,
                  isZh ? '預估避險金額' : 'Losses Averted'
                ]}
                contentStyle={tooltipStyle}
              />
              <Bar
                name={isZh ? '預估避險金額 (USD)' : 'Losses Averted'}
                dataKey="lossesPreventedUsd"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

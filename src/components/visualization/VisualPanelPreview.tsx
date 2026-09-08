import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Server,
  Terminal,
  Globe,
  List,
  Network,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Copy,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  FileText
} from 'lucide-react';
import { PanelConfig } from './types';
import {
  MOCK_TIME_SERIES,
  MOCK_STAT_DATA,
  MOCK_TABLE_ROWS,
  MOCK_BAR_CATEGORIES,
  MOCK_PIE_DISTRIBUTION,
  MOCK_HEATMAP_GRID,
  MOCK_STREAM_LOGS,
  MOCK_ALERT_LIST,
  MOCK_RADAR_DATA,
  MOCK_NODE_GRAPH,
  MOCK_STATUS_HISTORY,
  MOCK_TRACES
} from './mockData';

interface VisualPanelPreviewProps {
  config: PanelConfig;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function VisualPanelPreview({
  config,
  isFullscreen = false,
  onToggleFullscreen
}: VisualPanelPreviewProps) {
  const [logFilter, setLogFilter] = useState('');
  const [isLogStreaming, setIsLogStreaming] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Determine color palette mapping
  const getPaletteColors = () => {
    switch (config.display.colorPalette) {
      case 'emerald-defense':
        return { primary: '#10b981', secondary: '#059669', accent: '#34d399', bg: 'from-emerald-950/20 to-transparent' };
      case 'amber-warning':
        return { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24', bg: 'from-amber-950/20 to-transparent' };
      case 'crimson-alert':
        return { primary: '#ef4444', secondary: '#dc2626', accent: '#f87171', bg: 'from-red-950/20 to-transparent' };
      case 'high-contrast-neon':
        return { primary: '#a855f7', secondary: '#ec4899', accent: '#06b6d4', bg: 'from-purple-950/20 to-transparent' };
      case 'cyber-blue':
      default:
        return { primary: '#3b82f6', secondary: '#2563eb', accent: '#60a5fa', bg: 'from-blue-950/20 to-transparent' };
    }
  };

  const colors = getPaletteColors();

  const formatYValue = (val: number) => {
    switch (config.axis.yFormat) {
      case 'bits_sec':
        return `${val.toFixed(config.axis.decimals || 0)} Mbps`;
      case 'bytes_sec':
        return `${(val / 8).toFixed(config.axis.decimals || 0)} MB/s`;
      case 'percent':
        return `${val.toFixed(config.axis.decimals || 0)}%`;
      case 'ms':
        return `${val} ms`;
      case 'req_sec':
        return `${val} rps`;
      default:
        return val.toLocaleString();
    }
  };

  // Render specific template
  const renderVisualizationContent = () => {
    switch (config.template) {
      case 'Time Series': {
        const isArea = config.display.graphType === 'area';
        return (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="h-[360px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                {isArea ? (
                  <AreaChart data={MOCK_TIME_SERIES} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIngress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={config.display.fillOpacity / 100} />
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.accent} stopOpacity={config.display.fillOpacity / 100 * 0.7} />
                        <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {config.display.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />}
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={11}
                      domain={[config.axis.yMin ?? 'auto', config.axis.yMax ?? 'auto']}
                      tickFormatter={formatYValue}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(val: any) => [formatYValue(Number(val)), '']}
                    />
                    {config.axis.showLegend && <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />}
                    {config.thresholds.enabled &&
                      config.thresholds.levels.map((lvl) => (
                        <ReferenceLine
                          key={lvl.id}
                          y={lvl.value}
                          label={{ value: `${lvl.label} (${lvl.value})`, fill: lvl.color, fontSize: 10, position: 'right' }}
                          stroke={lvl.color}
                          strokeDasharray={config.thresholds.displayStyle === 'dashed' ? '4 4' : undefined}
                          strokeWidth={1.5}
                        />
                      ))}
                    <Area
                      type={config.display.lineInterpolation === 'smooth' ? 'monotone' : config.display.lineInterpolation === 'step' ? 'stepAfter' : 'linear'}
                      dataKey="ingress"
                      name="入口流量 (Ingress)"
                      stroke={colors.primary}
                      strokeWidth={config.display.strokeWidth}
                      fillOpacity={1}
                      fill="url(#colorIngress)"
                      stackId={config.display.stacked ? '1' : undefined}
                    />
                    <Area
                      type={config.display.lineInterpolation === 'smooth' ? 'monotone' : config.display.lineInterpolation === 'step' ? 'stepAfter' : 'linear'}
                      dataKey="egress"
                      name="出口流量 (Egress)"
                      stroke={colors.accent}
                      strokeWidth={config.display.strokeWidth}
                      fillOpacity={1}
                      fill="url(#colorEgress)"
                      stackId={config.display.stacked ? '1' : undefined}
                    />
                    <Area
                      type="monotone"
                      dataKey="dropped"
                      name="阻斷封包 (Dropped)"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      fillOpacity={0.2}
                      fill="#ef4444"
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={MOCK_TIME_SERIES} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    {config.display.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />}
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={11}
                      tickFormatter={formatYValue}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [formatYValue(Number(val)), '']}
                    />
                    {config.axis.showLegend && <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />}
                    {config.thresholds.enabled &&
                      config.thresholds.levels.map((lvl) => (
                        <ReferenceLine
                          key={lvl.id}
                          y={lvl.value}
                          label={{ value: lvl.label, fill: lvl.color, fontSize: 10 }}
                          stroke={lvl.color}
                          strokeDasharray="4 4"
                        />
                      ))}
                    <Line
                      type={config.display.lineInterpolation === 'smooth' ? 'monotone' : 'linear'}
                      dataKey="ingress"
                      name="入口流量 (Ingress)"
                      stroke={colors.primary}
                      strokeWidth={config.display.strokeWidth}
                      dot={config.display.showPoints ? { r: config.display.pointRadius } : false}
                    />
                    <Line
                      type={config.display.lineInterpolation === 'smooth' ? 'monotone' : 'linear'}
                      dataKey="egress"
                      name="出口流量 (Egress)"
                      stroke={colors.accent}
                      strokeWidth={config.display.strokeWidth}
                      dot={config.display.showPoints ? { r: config.display.pointRadius } : false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            {/* Quick Stat Bar at Bottom of Time Series */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-800/80 text-xs">
              <div className="bg-gray-900/60 p-2 rounded border border-gray-800">
                <span className="text-gray-400 block text-[10px]">即時流量 (Current)</span>
                <span className="font-bold text-white text-sm">1,350 Mbps</span>
              </div>
              <div className="bg-gray-900/60 p-2 rounded border border-gray-800">
                <span className="text-gray-400 block text-[10px]">時段峰值 (Peak)</span>
                <span className="font-bold text-amber-400 text-sm">1,420 Mbps</span>
              </div>
              <div className="bg-gray-900/60 p-2 rounded border border-gray-800">
                <span className="text-gray-400 block text-[10px]">自動阻斷率</span>
                <span className="font-bold text-emerald-400 text-sm">28.1% (380 Mbps)</span>
              </div>
              <div className="bg-gray-900/60 p-2 rounded border border-gray-800">
                <span className="text-gray-400 block text-[10px]">SOAR 警戒狀態</span>
                <span className="font-bold text-red-400 text-sm">觸發清洗聯防</span>
              </div>
            </div>
          </div>
        );
      }

      case 'Stat': {
        return (
          <div className="w-full h-full flex flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{config.subtitle || '主動監控指標'}</span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-5xl font-black text-white tracking-tight">
                    {MOCK_STAT_DATA.currentValue.toLocaleString()}
                  </span>
                  <span className="text-xl font-bold text-blue-400">{MOCK_STAT_DATA.unit}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                <ArrowUpRight className="w-4 h-4" />
                <span>{MOCK_STAT_DATA.change}</span>
                <span className="text-gray-400 font-normal ml-1">vs 昨基準</span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-28 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_STAT_DATA.sparkline.map((val, idx) => ({ idx, val }))}>
                  <defs>
                    <linearGradient id="statGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke={colors.primary} strokeWidth={3} fill="url(#statGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sub Metrics */}
            <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-800">
              {MOCK_STAT_DATA.subMetrics.map((sm, idx) => (
                <div key={idx} className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
                  <div className="text-[10px] text-gray-400 mb-1">{sm.label}</div>
                  <div className={`text-sm font-bold ${sm.color}`}>{sm.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'Gauge': {
        const val = 84.2;
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative w-72 h-44 flex items-center justify-center">
              {/* Custom SVG Half-Gauge */}
              <svg className="w-full h-full" viewBox="0 0 200 120">
                {/* Background Arc */}
                <path
                  d="M 20 110 A 80 80 0 0 1 180 110"
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Zone Green */}
                <path
                  d="M 20 110 A 80 80 0 0 1 80 40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="18"
                  strokeDasharray="2 3"
                  strokeOpacity="0.4"
                />
                {/* Zone Yellow */}
                <path
                  d="M 80 40 A 80 80 0 0 1 140 45"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="18"
                  strokeDasharray="2 3"
                  strokeOpacity="0.4"
                />
                {/* Zone Red */}
                <path
                  d="M 140 45 A 80 80 0 0 1 180 110"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="18"
                  strokeDasharray="2 3"
                  strokeOpacity="0.6"
                />
                {/* Active Meter Arc */}
                <path
                  d="M 20 110 A 80 80 0 0 1 165 80"
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="70%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-2 text-center">
                <span className="text-4xl font-black text-white">{val}%</span>
                <span className="text-xs text-amber-400 block font-semibold">接近臨界警戒水位</span>
              </div>
            </div>
            <div className="flex justify-between w-full max-w-sm mt-4 text-xs text-gray-400 px-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 正常 (&lt;70%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 警示 (70-85%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> 臨界 (&gt;85%)</span>
            </div>
          </div>
        );
      }

      case 'Table': {
        return (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="p-3 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">即時威脅會話列表 (即時 6 筆異常來源)</span>
              <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">自動更新中 (10s)</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 bg-gray-950/40">
                    <th className="py-2.5 px-3">來源 IP (Source)</th>
                    <th className="py-2.5 px-3">國家</th>
                    <th className="py-2.5 px-3">協定 / 埠號</th>
                    <th className="py-2.5 px-3">處置狀態</th>
                    <th className="py-2.5 px-3">威脅分級</th>
                    <th className="py-2.5 px-3">累計事件</th>
                    <th className="py-2.5 px-3">觸發防護規則</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {MOCK_TABLE_ROWS.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-blue-400">{row.ip}</td>
                      <td className="py-2.5 px-3 text-gray-300">{row.country}</td>
                      <td className="py-2.5 px-3 text-gray-400">{row.protocol}:{row.port}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.action === 'BLOCKED' ? 'bg-red-950 text-red-400 border border-red-800/40' :
                          row.action === 'ISOLATED' ? 'bg-purple-950 text-purple-400 border border-purple-800/40' :
                          'bg-amber-950 text-amber-400 border border-amber-800/40'
                        }`}>
                          {row.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold ${
                          row.severity === 'CRITICAL' ? 'text-red-400' :
                          row.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'
                        }`}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-200">{row.events.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-sans text-gray-300">{row.rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'Geomap': {
        return (
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-gray-950/80 p-4">
            {/* World Map SVG Layout */}
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-gray-800/80 bg-[#090b10] flex items-center justify-center">
              <svg className="w-full h-full opacity-35" viewBox="0 0 1000 500">
                {/* Simplified Continents outlines */}
                <path
                  d="M150,120 Q180,80 250,90 Q320,100 300,180 Q260,250 200,230 Q160,200 150,120 Z"
                  fill="#1e293b"
                  stroke="#334155"
                />
                <path
                  d="M240,260 Q280,270 290,340 Q280,420 230,410 Q210,340 240,260 Z"
                  fill="#1e293b"
                  stroke="#334155"
                />
                <path
                  d="M480,90 Q560,70 600,120 Q620,180 540,190 Q480,160 480,90 Z"
                  fill="#1e293b"
                  stroke="#334155"
                />
                <path
                  d="M490,210 Q580,200 590,280 Q560,380 500,360 Q460,280 490,210 Z"
                  fill="#1e293b"
                  stroke="#334155"
                />
                <path
                  d="M620,80 Q780,60 850,120 Q880,220 750,230 Q650,180 620,80 Z"
                  fill="#1e293b"
                  stroke="#334155"
                />
                <path
                  d="M740,300 Q840,280 860,350 Q830,410 750,390 Q720,340 740,300 Z"
                  fill="#1e293b"
                  stroke="#334155"
                />
              </svg>

              {/* Dynamic Attack Beacons */}
              {/* Origin 1: Moscow/Eastern Europe -> Taipei DC */}
              <div className="absolute top-[32%] left-[58%]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-[10px] text-red-300 font-bold ml-2 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-red-800">
                  RU: 1,420 attacks
                </span>
              </div>

              {/* Origin 2: Netherlands */}
              <div className="absolute top-[28%] left-[51%]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-[10px] text-red-300 font-bold ml-2 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-red-800">
                  NL: 890 attacks
                </span>
              </div>

              {/* Origin 3: Vietnam */}
              <div className="absolute top-[48%] left-[73%]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
                <span className="text-[10px] text-amber-300 font-bold ml-2 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-amber-800">
                  VN: 430 attacks
                </span>
              </div>

              {/* Target: Taipei SOC Datacenter */}
              <div className="absolute top-[44%] left-[78%] flex flex-col items-center">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border border-white" />
                </span>
                <span className="text-[11px] text-blue-200 font-black mt-1 bg-blue-950/90 px-2 py-0.5 rounded border border-blue-500">
                  企業主要資料中心 (HQ)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full mt-3 text-xs">
              <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                <span className="text-gray-400 text-[10px] block">最高頻攻擊來源國</span>
                <span className="font-bold text-red-400">1. 俄羅斯 (34.2%)</span>
              </div>
              <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                <span className="text-gray-400 text-[10px] block">跨國 C2 節點連線</span>
                <span className="font-bold text-amber-400">84 個活躍 IP</span>
              </div>
              <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                <span className="text-gray-400 text-[10px] block">邊界自動阻斷狀態</span>
                <span className="font-bold text-emerald-400">100% 自動清洗</span>
              </div>
            </div>
          </div>
        );
      }

      case 'Bar Chart': {
        return (
          <div className="w-full h-full pt-4">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={MOCK_BAR_CATEGORIES} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                {config.display.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />}
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="count" name="今日告警數 (Today)" fill={colors.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="prev" name="昨日對比 (Yesterday)" fill="#4b5563" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'Pie Chart': {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={MOCK_PIE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {MOCK_PIE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}% 流量佔比`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'Heatmap': {
        return (
          <div className="w-full h-full flex flex-col p-2">
            <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
              <span>全週 7 天 x 24 小時攻擊密度熱力矩陣</span>
              <span className="flex items-center gap-1">
                <span>低</span>
                <span className="w-3 h-3 bg-blue-950 rounded-sm" />
                <span className="w-3 h-3 bg-blue-700 rounded-sm" />
                <span className="w-3 h-3 bg-amber-600 rounded-sm" />
                <span className="w-3 h-3 bg-red-600 rounded-sm" />
                <span>高</span>
              </span>
            </div>
            <div className="flex-1 space-y-1.5">
              {MOCK_HEATMAP_GRID.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-10 text-[11px] text-gray-400 font-bold">{row.day}</span>
                  <div className="flex-1 grid grid-cols-24 gap-1">
                    {row.hours.map((val, hIdx) => {
                      const color =
                        val > 120 ? 'bg-red-600' :
                        val > 80 ? 'bg-amber-500' :
                        val > 40 ? 'bg-blue-600' :
                        val > 15 ? 'bg-blue-900' : 'bg-gray-900';
                      return (
                        <div
                          key={hIdx}
                          title={`${row.day} ${hIdx}:00 - ${val} 次威脅事件`}
                          className={`h-6 rounded-sm ${color} transition-all hover:scale-110 hover:ring-2 hover:ring-white cursor-pointer`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-gray-500 pl-12 pr-1 pt-1 font-mono">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>
        );
      }

      case 'Logs': {
        const filteredLogs = MOCK_STREAM_LOGS.filter(l =>
          logFilter === '' || l.msg.toLowerCase().includes(logFilter.toLowerCase()) || l.level.includes(logFilter.toUpperCase())
        );

        return (
          <div className="w-full h-full flex flex-col font-mono text-xs bg-[#090b10] rounded-lg overflow-hidden border border-gray-800">
            {/* Terminal Header */}
            <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-gray-300 text-xs">VictoriaLogs Live Stream Terminal</span>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isLogStreaming ? 'STREAMING (280 eps)' : 'PAUSED'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="過濾日誌關鍵字..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-gray-950 border border-gray-700 text-[11px] px-2 py-0.5 rounded text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setIsLogStreaming(!isLogStreaming)}
                  className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                >
                  {isLogStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 select-text">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 hover:bg-gray-900/60 p-1 rounded transition-colors">
                  <span className="text-gray-500 text-[10px] whitespace-nowrap">{log.time}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    log.level === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                    log.level === 'ERROR' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                    log.level === 'WARN' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-purple-400 text-[10px] font-bold">[{log.source}]</span>
                  <span className="text-gray-400 text-[10px] font-semibold">@{log.host}:</span>
                  <span className="text-gray-200 text-xs flex-1 break-all">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'Alert List': {
        return (
          <div className="w-full h-full flex flex-col overflow-auto divide-y divide-gray-800/80 p-2">
            {MOCK_ALERT_LIST.map((alert) => (
              <div key={alert.id} className="p-3 hover:bg-gray-900/40 rounded-lg transition-colors flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    alert.severity === 'critical' ? 'bg-red-950/60 border border-red-800 text-red-400' :
                    alert.severity === 'warning' ? 'bg-amber-950/60 border border-amber-800 text-amber-400' :
                    'bg-blue-950/60 border border-blue-800 text-blue-400'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{alert.title}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded font-mono">{alert.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                      <span>來源: {alert.source}</span>
                      <span>•</span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200 font-semibold">
                    {alert.status}
                  </span>
                  <button className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold">
                    調查處置
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'Node Graph': {
        return (
          <div className="w-full h-full flex flex-col p-4 bg-[#090b10] rounded-xl border border-gray-800/80">
            <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
              <span>攻擊路徑拓撲圖 (點擊節點檢視流向詳情)</span>
              <span className="text-emerald-400 font-mono">連線狀態: 正常聯防中</span>
            </div>
            <div className="flex-1 relative flex items-center justify-center">
              <svg className="w-full h-full max-h-[300px]" viewBox="0 0 600 240">
                {/* Connecting lines */}
                {MOCK_NODE_GRAPH.links.map((link, idx) => (
                  <g key={idx}>
                    <line
                      x1={idx === 0 ? 80 : idx === 1 ? 200 : idx === 2 ? 320 : idx === 3 ? 320 : 440}
                      y1={idx === 0 ? 120 : idx === 1 ? 120 : idx === 2 ? 80 : idx === 3 ? 160 : idx === 4 ? 80 : 160}
                      x2={idx === 0 ? 200 : idx === 1 ? 320 : idx === 2 ? 440 : idx === 3 ? 440 : 540}
                      y2={idx === 0 ? 120 : idx === 1 ? 120 : idx === 2 ? 80 : idx === 3 ? 160 : 120}
                      stroke={link.color}
                      strokeWidth="2.5"
                      strokeDasharray={idx === 0 ? '4 2' : undefined}
                    />
                  </g>
                ))}

                {/* Nodes */}
                {/* Attacker */}
                <g transform="translate(40, 95)" onClick={() => setSelectedNode('attacker')} className="cursor-pointer">
                  <circle cx="25" cy="25" r="24" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                  <text x="25" y="30" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">駭客</text>
                  <text x="25" y="62" textAnchor="middle" fill="#ef4444" fontSize="9">194.26.29.112</text>
                </g>

                {/* Firewall */}
                <g transform="translate(175, 95)" onClick={() => setSelectedNode('firewall')} className="cursor-pointer">
                  <rect width="50" height="50" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                  <text x="25" y="30" textAnchor="middle" fill="#c7d2fe" fontSize="10" fontWeight="bold">FW-清洗</text>
                  <text x="25" y="62" textAnchor="middle" fill="#818cf8" fontSize="9">邊界清洗機</text>
                </g>

                {/* Ingress LB */}
                <g transform="translate(295, 95)" onClick={() => setSelectedNode('lb')} className="cursor-pointer">
                  <rect width="50" height="50" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                  <text x="25" y="30" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">LB 閘道</text>
                  <text x="25" y="62" textAnchor="middle" fill="#34d399" fontSize="9">API Gateway</text>
                </g>

                {/* Web Tier 1 */}
                <g transform="translate(415, 55)" onClick={() => setSelectedNode('web1')} className="cursor-pointer">
                  <rect width="50" height="50" rx="8" fill="#172554" stroke="#3b82f6" strokeWidth="2" />
                  <text x="25" y="30" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="bold">Web-01</text>
                </g>

                {/* Web Tier 2 */}
                <g transform="translate(415, 135)" onClick={() => setSelectedNode('web2')} className="cursor-pointer">
                  <rect width="50" height="50" rx="8" fill="#172554" stroke="#3b82f6" strokeWidth="2" />
                  <text x="25" y="30" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="bold">Web-02</text>
                </g>

                {/* DB Server */}
                <g transform="translate(515, 95)" onClick={() => setSelectedNode('db')} className="cursor-pointer">
                  <rect width="50" height="50" rx="8" fill="#3b0764" stroke="#a855f7" strokeWidth="2" />
                  <text x="25" y="30" textAnchor="middle" fill="#e9d5ff" fontSize="10" fontWeight="bold">Core DB</text>
                  <text x="25" y="62" textAnchor="middle" fill="#c084fc" fontSize="9">受隔離庫</text>
                </g>
              </svg>
            </div>
            {selectedNode && (
              <div className="p-2.5 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs flex items-center justify-between mt-2">
                <span className="text-blue-300">已選取節點: <strong className="text-white">{selectedNode}</strong> (所有流量經 eBPF 探針深度校驗)</span>
                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">✕ 關閉詳情</button>
              </div>
            )}
          </div>
        );
      }

      case 'Traces': {
        return (
          <div className="w-full h-full flex flex-col p-4 bg-[#090b10] rounded-xl border border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-xs text-gray-400">
              <span>Trace ID: <strong className="text-white font-mono">trace-9842af3e091b</strong></span>
              <span>總耗時: <strong className="text-emerald-400 font-mono">142 ms</strong> (6 個跨度 Spans)</span>
            </div>
            <div className="flex-1 pt-3 space-y-2 overflow-y-auto">
              {MOCK_TRACES.map((span) => {
                const leftPercent = (span.start / 142) * 100;
                const widthPercent = Math.max(5, (span.duration / 142) * 100);
                return (
                  <div key={span.id} className="text-xs">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-300 font-mono">{span.name}</span>
                      <span className="text-gray-400 font-mono">{span.duration} ms</span>
                    </div>
                    <div className="w-full bg-gray-900 h-4 rounded relative overflow-hidden border border-gray-800">
                      <div
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        className={`absolute top-0 bottom-0 rounded ${
                          span.status === 'warn' ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'Radar': {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart cx="50%" cy="50%" outerRadius={95} data={MOCK_RADAR_DATA}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={11} />
                <PolarRadiusAxis stroke="#4b5563" fontSize={10} angle={30} domain={[0, 100]} />
                <Radar name="現行防護水準 (Current)" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="安全基線標準 (Baseline)" dataKey="baseline" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'Status History': {
        return (
          <div className="w-full h-full flex flex-col p-4 bg-[#090b10] rounded-xl border border-gray-800 justify-between">
            <div className="space-y-4">
              {MOCK_STATUS_HISTORY.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-200">{item.name}</span>
                    <span className="text-emerald-400 font-mono">{item.uptime} SLA</span>
                  </div>
                  <div className="grid grid-cols-24 gap-1">
                    {item.blocks.map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className={`h-5 rounded-sm ${
                          block === 1 ? 'bg-emerald-500' : 'bg-amber-500'
                        } hover:opacity-80 transition-opacity`}
                        title={`時段: ${bIdx}:00 - 狀態: ${block === 1 ? '正常' : '波動'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 pt-3 border-t border-gray-800">
              <span>24 小時前</span>
              <span>12 小時前</span>
              <span>即時現況 (全節點高可用性)</span>
            </div>
          </div>
        );
      }

      case 'Text': {
        return (
          <div className="w-full h-full p-6 bg-[#090b10] rounded-xl border border-gray-800 overflow-y-auto prose prose-invert max-w-none text-xs text-gray-300">
            <h3 className="text-base font-bold text-white mb-2">SOC 應變處置標準指引 (SOP)</h3>
            <p className="text-gray-400">當入口流量超過 <strong>1,200 Mbps</strong> 且阻斷率超過 <strong>25%</strong> 時，請依下列程序處置：</p>
            <ol className="list-decimal pl-4 space-y-1.5 my-3 text-gray-300">
              <li>確認 BGP Anycast 防禦清洗節點已自動啟用。</li>
              <li>檢查 EDR Agent 端點核心負載是否正常。</li>
              <li>調閱 Arkime 封包分析，確認 SYN-Flood 攻擊特徵來源。</li>
              <li>執行 SOAR 劇本 <code>SOAR-PB-802</code> 進行 BGP Blackhole 宣告。</li>
            </ol>
            <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded text-blue-300 mt-4">
              <strong>提示：</strong>本文件與 VictoriaLogs 警報條件動態綁定，可隨時自訂 Markdown 格式。
            </div>
          </div>
        );
      }

      default: {
        // Fallback or generic placeholder
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#090b10] rounded-xl border border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-800 flex items-center justify-center mb-4 text-blue-400 shadow-xl">
              <Activity className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{config.template} 視覺化畫布</h4>
            <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
              目前已連線至資料源 <span className="text-blue-400 font-semibold">{config.dataSource}</span>。
              所有即時度量資料已在後台完成流式聚合，可於下方切換查詢參數或調整樣式。
            </p>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gray-900 text-gray-300 rounded text-xs border border-gray-800 font-mono">
                查詢延遲: 12 ms
              </span>
              <span className="px-3 py-1 bg-emerald-950 text-emerald-400 rounded text-xs border border-emerald-800 font-mono">
                資料點數: 4,820 點
              </span>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col rounded-xl overflow-hidden transition-all ${
        config.display.transparentBackground ? 'bg-transparent' : 'bg-[#0d0f17]'
      } ${
        config.display.cardBorderGlow
          ? 'border border-blue-500/30 shadow-2xl shadow-blue-500/5'
          : 'border border-gray-800 shadow-lg'
      }`}
    >
      {/* Panel Top Bar */}
      <div className="px-4 py-3 border-b border-gray-800/80 bg-gray-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">{config.title}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                {config.template}
              </span>
            </div>
            {config.subtitle && (
              <p className="text-[11px] text-gray-400 font-normal">{config.subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-mono px-2 py-1 rounded bg-gray-950/80 border border-gray-800">
            來源: {config.dataSource}
          </span>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
              title={isFullscreen ? '退出全螢幕' : '全螢幕預覽'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Stage */}
      <div className="flex-1 p-4 overflow-hidden relative flex flex-col justify-center">
        {renderVisualizationContent()}
      </div>
    </div>
  );
}

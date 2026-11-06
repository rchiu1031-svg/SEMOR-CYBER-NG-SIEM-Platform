import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Wifi, 
  Layers,
  Thermometer
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { MasterNodeSystemHealth } from './types';
import { useTheme } from '../../context/ThemeContext';

interface OverviewSystemHealthProps {
  systemHealth?: MasterNodeSystemHealth;
  isZh: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const OverviewSystemHealth: React.FC<OverviewSystemHealthProps> = ({
  systemHealth,
  isZh,
  onRefresh,
  isRefreshing = false
}) => {
  const { isLight } = useTheme();
  const [activeSeries, setActiveSeries] = useState<'all' | 'cpu' | 'ram' | 'disk'>('all');
  const [isLivePolling, setIsLivePolling] = useState(true);

  // Fallback data if systemHealth is still loading
  const node = systemHealth || {
    nodeId: 'master-01',
    nodeName: 'Master-Node-01',
    role: 'Kubernetes/Cluster Control Plane & 排程仲裁',
    ip: '192.168.10.20',
    status: 'Online' as const,
    uptime: '5d 04h 18m',
    cpu: 28,
    ram: 45,
    disk: 22,
    loadAvg: [1.12, 1.05, 0.98] as [number, number, number],
    vCpu: 16,
    totalRamGB: 64,
    usedRamGB: 28.8,
    totalDiskGB: 1000,
    usedDiskGB: 220,
    processCount: 245,
    networkRxMbps: 54.8,
    networkTxMbps: 62.1,
    timeline: [
      { time: '10:00:00', cpu: 26, ram: 44, disk: 22, temperatureC: 41, iops: 3100 },
      { time: '10:00:05', cpu: 27, ram: 44, disk: 22, temperatureC: 41, iops: 3150 },
      { time: '10:00:10', cpu: 29, ram: 45, disk: 22, temperatureC: 42, iops: 3300 },
      { time: '10:00:15', cpu: 32, ram: 45, disk: 22, temperatureC: 42, iops: 3450 },
      { time: '10:00:20', cpu: 30, ram: 45, disk: 22, temperatureC: 42, iops: 3280 },
      { time: '10:00:25', cpu: 28, ram: 45, disk: 22, temperatureC: 41, iops: 3200 },
      { time: '10:00:30', cpu: 27, ram: 44, disk: 22, temperatureC: 41, iops: 3180 },
      { time: '10:00:35', cpu: 28, ram: 45, disk: 22, temperatureC: 42, iops: 3250 },
      { time: '10:00:40', cpu: 31, ram: 45, disk: 22, temperatureC: 42, iops: 3380 },
      { time: '10:00:45', cpu: 29, ram: 45, disk: 22, temperatureC: 41, iops: 3220 },
      { time: '10:00:50', cpu: 28, ram: 45, disk: 22, temperatureC: 41, iops: 3240 },
      { time: '10:00:55', cpu: 28, ram: 45, disk: 22, temperatureC: 41, iops: 3210 }
    ],
    thresholds: {
      cpuWarning: 75,
      cpuCritical: 85,
      ramWarning: 80,
      ramCritical: 90,
      diskWarning: 80,
      diskCritical: 90
    }
  };

  const cpuStatus = node.cpu >= node.thresholds.cpuCritical ? 'critical' : node.cpu >= node.thresholds.cpuWarning ? 'warning' : 'healthy';
  const ramStatus = node.ram >= node.thresholds.ramCritical ? 'critical' : node.ram >= node.thresholds.ramWarning ? 'warning' : 'healthy';
  const diskStatus = node.disk >= node.thresholds.diskCritical ? 'critical' : node.disk >= node.thresholds.diskWarning ? 'warning' : 'healthy';

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 min-w-[190px] border ${
          isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#0b0d13]/95 border-gray-800 text-gray-200'
        }`}>
          <div className={`flex justify-between items-center border-b pb-1.5 ${isLight ? 'border-slate-200 text-slate-500' : 'border-gray-800/80 text-gray-400'}`}>
            <span>{isZh ? '採樣時間' : 'Timestamp'}</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>{label}</span>
          </div>
          {payload.map((entry: any, index: number) => {
            const isCpu = entry.dataKey === 'cpu';
            const isRam = entry.dataKey === 'ram';
            const isDisk = entry.dataKey === 'disk';
            const labelName = isCpu 
              ? (isZh ? 'CPU 使用率' : 'CPU Load') 
              : isRam 
              ? (isZh ? 'RAM 記憶體' : 'RAM Usage') 
              : (isZh ? '磁碟佔用' : 'Disk Storage');

            const val = entry.value;
            const threshold = isCpu ? node.thresholds.cpuWarning : isRam ? node.thresholds.ramWarning : node.thresholds.diskWarning;
            const isWarning = val >= threshold;

            return (
              <div key={`item-${index}`} className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className={isLight ? 'text-slate-600' : 'text-gray-300'}>{labelName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{val}%</span>
                  {isWarning && (
                    <span className="text-[10px] text-amber-500 font-bold">({isZh ? '偏高' : 'High'})</span>
                  )}
                </div>
              </div>
            );
          })}
          {payload[0]?.payload?.temperatureC && (
            <div className={`pt-1 border-t flex justify-between text-[10px] ${isLight ? 'border-slate-200 text-slate-500' : 'border-gray-850 text-gray-500'}`}>
              <span>{isZh ? '核心溫度' : 'Die Temp'}:</span>
              <span className={isLight ? 'text-slate-800 font-bold' : 'text-gray-300'}>{payload[0].payload.temperatureC} °C</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all text-left ${
      isLight 
        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-slate-100' 
        : 'bg-[#0d0f14] border-gray-800 hover:border-gray-700/80 group'
    }`}>
      
      {/* Background ambient mesh glow */}
      <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-blue-500/5' : 'bg-blue-500/5'}`} />
      <div className={`absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-purple-500/5' : 'bg-purple-500/5'}`} />

      {/* Header bar: Title, Host Details & Quick Controls */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5 ${isLight ? 'border-slate-200' : 'border-gray-850'}`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
              <Server size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-black tracking-wide font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isZh ? 'SIEM 主控節點系統健康' : 'SIEM Master Node · System Health'}
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {node.status}
                </span>
              </div>
              <p className={`text-xs font-mono mt-0.5 flex flex-wrap items-center gap-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                <span className="font-semibold">{node.nodeName} ({node.ip})</span>
                <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>·</span>
                <span>{isZh ? '控制平面仲裁核心' : 'Cluster Control Plane'}</span>
                <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>·</span>
                <span>{isZh ? '負載均值' : 'Load Avg'}: {node.loadAvg.join(', ')}</span>
                <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>·</span>
                <span>{isZh ? '運行時長' : 'Uptime'}: {node.uptime}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right side filter tabs & action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Series filter segmented control */}
          <div className={`flex p-1 border rounded-xl font-mono text-[11px] ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#12141a] border-gray-800'}`}>
            {[
              { id: 'all', label: isZh ? '全部' : 'All' },
              { id: 'cpu', label: 'CPU' },
              { id: 'ram', label: 'RAM' },
              { id: 'disk', label: 'Disk' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSeries(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeSeries === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Live stream status indicator button */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all ${
              isLivePolling
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
            title={isZh ? '切換即時輪詢狀態' : 'Toggle live telemetry stream'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLivePolling ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
            <span>{isLivePolling ? 'LIVE 3s' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-1.5 border rounded-xl transition-all disabled:opacity-50 ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                  : 'bg-[#12141a] hover:bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-300'
              }`}
              title={isZh ? '即時更新節點負載指標' : 'Refresh master telemetry'}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards Row (CPU, RAM, Disk) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 mb-6">
        
        {/* 1. CPU Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          cpuStatus === 'critical' 
            ? 'bg-red-500/5 border-red-500/30' 
            : cpuStatus === 'warning'
            ? 'bg-amber-500/5 border-amber-500/30'
            : isLight 
            ? 'bg-slate-50 border-slate-200 hover:border-blue-400' 
            : 'bg-[#12141a] border-gray-800/80 hover:border-blue-500/30'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border ${isLight ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                <Cpu size={16} />
              </span>
              <div>
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {isZh ? 'CPU 核心運算使用率' : 'CPU Utilization'}
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  {node.vCpu} vCPU · AMD EPYC 7763
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              cpuStatus === 'critical' ? 'text-red-500 bg-red-500/10' : cpuStatus === 'warning' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10'
            }`}>
              {cpuStatus === 'critical' ? 'CRITICAL' : cpuStatus === 'warning' ? 'WARNING' : 'HEALTHY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{node.cpu}%</span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              / {isZh ? '警戒門檻' : 'Warn threshold'} {node.thresholds.cpuWarning}%
            </span>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-1.5 rounded-full overflow-hidden mt-3 ${isLight ? 'bg-slate-200' : 'bg-gray-900'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.cpu >= 85 ? 'bg-red-500' : node.cpu >= 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, node.cpu)}%` }}
            />
          </div>

          <div className={`flex justify-between items-center text-[10px] font-mono mt-2 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
            <span>{isZh ? '處理序總量' : 'Processes'}: {node.processCount}</span>
            <span>{isZh ? '核心溫度' : 'Die Temp'}: ~42°C</span>
          </div>
        </div>

        {/* 2. RAM Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          ramStatus === 'critical' 
            ? 'bg-red-500/5 border-red-500/30' 
            : ramStatus === 'warning'
            ? 'bg-amber-500/5 border-amber-500/30'
            : isLight 
            ? 'bg-slate-50 border-slate-200 hover:border-purple-400' 
            : 'bg-[#12141a] border-gray-800/80 hover:border-purple-500/30'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border ${isLight ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                <Activity size={16} />
              </span>
              <div>
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {isZh ? 'RAM 記憶體佔用率' : 'Memory (RAM) Usage'}
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  DDR4 ECC Reg · {node.totalRamGB} GB Total
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              ramStatus === 'critical' ? 'text-red-500 bg-red-500/10' : ramStatus === 'warning' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10'
            }`}>
              {ramStatus === 'critical' ? 'CRITICAL' : ramStatus === 'warning' ? 'WARNING' : 'HEALTHY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{node.ram}%</span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              ({node.usedRamGB} GB / {node.totalRamGB} GB)
            </span>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-1.5 rounded-full overflow-hidden mt-3 ${isLight ? 'bg-slate-200' : 'bg-gray-900'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.ram >= 90 ? 'bg-red-500' : node.ram >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'
              }`}
              style={{ width: `${Math.min(100, node.ram)}%` }}
            />
          </div>

          <div className={`flex justify-between items-center text-[10px] font-mono mt-2 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
            <span>{isZh ? '空閒' : 'Free'}: {(node.totalRamGB - node.usedRamGB).toFixed(1)} GB</span>
            <span>{isZh ? '快取' : 'Cached'}: ~14.5 GB</span>
          </div>
        </div>

        {/* 3. Disk Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          diskStatus === 'critical' 
            ? 'bg-red-500/5 border-red-500/30' 
            : diskStatus === 'warning'
            ? 'bg-amber-500/5 border-amber-500/30'
            : isLight 
            ? 'bg-slate-50 border-slate-200 hover:border-emerald-400' 
            : 'bg-[#12141a] border-gray-800/80 hover:border-emerald-500/30'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border ${isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                <HardDrive size={16} />
              </span>
              <div>
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {isZh ? 'NVMe 磁碟儲存佔用' : 'NVMe Disk Storage'}
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  PCIe 4.0 NVMe RAID · {node.totalDiskGB} GB
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              diskStatus === 'critical' ? 'text-red-500 bg-red-500/10' : diskStatus === 'warning' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10'
            }`}>
              {diskStatus === 'critical' ? 'CRITICAL' : diskStatus === 'warning' ? 'WARNING' : 'HEALTHY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{node.disk}%</span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              ({node.usedDiskGB} GB / {node.totalDiskGB} GB)
            </span>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-1.5 rounded-full overflow-hidden mt-3 ${isLight ? 'bg-slate-200' : 'bg-gray-900'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.disk >= 90 ? 'bg-red-500' : node.disk >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, node.disk)}%` }}
            />
          </div>

          <div className={`flex justify-between items-center text-[10px] font-mono mt-2 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
            <span>{isZh ? '剩餘空間' : 'Available'}: {(node.totalDiskGB - node.usedDiskGB).toFixed(0)} GB</span>
            <span>{isZh ? '壓縮比率' : 'Ratio'}: 11.85x</span>
          </div>
        </div>

      </div>

      {/* Real-Time Recharts Area Visualizer */}
      <div className={`border rounded-xl p-4 relative ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090b10] border-gray-850/80'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-500 animate-pulse" />
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
              {isZh ? '實時負載波動趨勢 (Real-Time Telemetry Timeline)' : 'Real-Time Telemetry Timeline (Last 2m)'}
            </span>
          </div>
          <div className={`flex items-center gap-3 text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-blue-500" />
              <span>CPU</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-purple-500" />
              <span>RAM</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-500" />
              <span>Disk</span>
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <span className="w-2.5 h-0.5 border-b border-dashed border-amber-500" />
              <span>Threshold (75%)</span>
            </span>
          </div>
        </div>

        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={node.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#181c26'} vertical={false} />

              <XAxis 
                dataKey="time" 
                stroke={isLight ? '#64748b' : '#4b5563'} 
                fontSize={10} 
                tickLine={false}
                axisLine={{ stroke: isLight ? '#cbd5e1' : '#1f2430' }}
                dy={6}
              />

              <YAxis 
                domain={[0, 100]} 
                stroke={isLight ? '#64748b' : '#4b5563'} 
                fontSize={10} 
                tickLine={false}
                axisLine={{ stroke: isLight ? '#cbd5e1' : '#1f2430' }}
                tickFormatter={(v) => `${v}%`}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine 
                y={75} 
                stroke="#f59e0b" 
                strokeDasharray="4 4" 
                strokeOpacity={0.7}
              />

              {(activeSeries === 'all' || activeSeries === 'cpu') && (
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  isAnimationActive={false}
                />
              )}

              {(activeSeries === 'all' || activeSeries === 'ram') && (
                <Area
                  type="monotone"
                  dataKey="ram"
                  name="RAM"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRam)"
                  isAnimationActive={false}
                />
              )}

              {(activeSeries === 'all' || activeSeries === 'disk') && (
                <Area
                  type="monotone"
                  dataKey="disk"
                  name="Disk"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDisk)"
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Telemetry Strip */}
      <div className={`mt-4 pt-4 border-t flex flex-wrap items-center justify-between text-xs font-mono gap-3 ${
        isLight ? 'border-slate-200 text-slate-500' : 'border-gray-850/80 text-gray-500'
      }`}>
        <div className="flex flex-wrap items-center gap-4">
          <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>kube-apiserver: Running</span>
          </span>
          <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>etcd-cluster: Healthy (Quorum 3/3)</span>
          </span>
          <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>VictoriaLogs Ingest: Active</span>
          </span>
        </div>

        <div className={`flex items-center gap-3 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
          <span>Net Rx: {node.networkRxMbps} Mbps</span>
          <span>·</span>
          <span>Net Tx: {node.networkTxMbps} Mbps</span>
          <span>·</span>
          <span>IOPS: ~3,400</span>
        </div>
      </div>

    </div>
  );
};

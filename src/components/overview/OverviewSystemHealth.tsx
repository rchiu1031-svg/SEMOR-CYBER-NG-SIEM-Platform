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
        <div className="bg-[#0b0d13]/95 border border-gray-800 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 min-w-[190px]">
          <div className="flex justify-between items-center border-b border-gray-800/80 pb-1.5 text-gray-400">
            <span>{isZh ? '採樣時間' : 'Timestamp'}</span>
            <span className="font-bold text-gray-200">{label}</span>
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
                  <span className="text-gray-300">{labelName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white">{val}%</span>
                  {isWarning && (
                    <span className="text-[10px] text-amber-400">({isZh ? '偏高' : 'High'})</span>
                  )}
                </div>
              </div>
            );
          })}
          {payload[0]?.payload?.temperatureC && (
            <div className="pt-1 border-t border-gray-850 flex justify-between text-[10px] text-gray-500">
              <span>{isZh ? '核心溫度' : 'Die Temp'}:</span>
              <span className="text-gray-300">{payload[0].payload.temperatureC} °C</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-gray-700/80 transition-all text-left">
      
      {/* Background ambient mesh glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Title, Host Details & Quick Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-850 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Server size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide font-sans">
                  {isZh ? 'SIEM 主控節點系統健康' : 'SIEM Master Node · System Health'}
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {node.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                <span>{node.nodeName} ({node.ip})</span>
                <span className="text-gray-600">·</span>
                <span>{isZh ? '控制平面仲裁核心' : 'Cluster Control Plane'}</span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-400">{isZh ? '負載均值' : 'Load Avg'}: {node.loadAvg.join(', ')}</span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-400">{isZh ? '運行時長' : 'Uptime'}: {node.uptime}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right side filter tabs & action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Series filter segmented control */}
          <div className="flex bg-[#12141a] p-1 border border-gray-800 rounded-xl font-mono text-[11px]">
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
                    : 'text-gray-400 hover:text-gray-200'
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
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
            title={isZh ? '切換即時輪詢狀態' : 'Toggle live telemetry stream'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLivePolling ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
            <span>{isLivePolling ? 'LIVE 3s' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 bg-[#12141a] hover:bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 rounded-xl transition-all disabled:opacity-50"
              title={isZh ? '即時更新節點負載指標' : 'Refresh master telemetry'}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
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
            : 'bg-[#12141a] border-gray-800/80 hover:border-blue-500/30'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Cpu size={16} />
              </span>
              <div>
                <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  {isZh ? 'CPU 核心運算使用率' : 'CPU Utilization'}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {node.vCpu} vCPU · AMD EPYC 7763
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              cpuStatus === 'critical' ? 'text-red-400 bg-red-500/10' : cpuStatus === 'warning' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
            }`}>
              {cpuStatus === 'critical' ? 'CRITICAL' : cpuStatus === 'warning' ? 'WARNING' : 'HEALTHY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">{node.cpu}%</span>
            <span className="text-xs text-gray-400 font-mono">
              / {isZh ? '警戒門檻' : 'Warn threshold'} {node.thresholds.cpuWarning}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.cpu >= 85 ? 'bg-red-500' : node.cpu >= 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, node.cpu)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-2">
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
            : 'bg-[#12141a] border-gray-800/80 hover:border-purple-500/30'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Activity size={16} />
              </span>
              <div>
                <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  {isZh ? 'RAM 記憶體佔用率' : 'Memory (RAM) Usage'}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  DDR4 ECC Reg · {node.totalRamGB} GB Total
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              ramStatus === 'critical' ? 'text-red-400 bg-red-500/10' : ramStatus === 'warning' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
            }`}>
              {ramStatus === 'critical' ? 'CRITICAL' : ramStatus === 'warning' ? 'WARNING' : 'HEALTHY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">{node.ram}%</span>
            <span className="text-xs text-gray-400 font-mono">
              ({node.usedRamGB} GB / {node.totalRamGB} GB)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.ram >= 90 ? 'bg-red-500' : node.ram >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'
              }`}
              style={{ width: `${Math.min(100, node.ram)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-2">
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
            : 'bg-[#12141a] border-gray-800/80 hover:border-emerald-500/30'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HardDrive size={16} />
              </span>
              <div>
                <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  {isZh ? 'NVMe 磁碟儲存佔用' : 'NVMe Disk Storage'}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  PCIe 4.0 NVMe RAID · {node.totalDiskGB} GB
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              diskStatus === 'critical' ? 'text-red-400 bg-red-500/10' : diskStatus === 'warning' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
            }`}>
              {diskStatus === 'critical' ? 'CRITICAL' : diskStatus === 'warning' ? 'WARNING' : 'HEALTHY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">{node.disk}%</span>
            <span className="text-xs text-gray-400 font-mono">
              ({node.usedDiskGB} GB / {node.totalDiskGB} GB)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.disk >= 90 ? 'bg-red-500' : node.disk >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, node.disk)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-2">
            <span>{isZh ? '剩餘空間' : 'Available'}: {(node.totalDiskGB - node.usedDiskGB).toFixed(0)} GB</span>
            <span>{isZh ? '壓縮比率' : 'Ratio'}: 11.85x</span>
          </div>
        </div>

      </div>

      {/* Real-Time Recharts Area Visualizer */}
      <div className="bg-[#090b10] border border-gray-850/80 rounded-xl p-4 relative">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-gray-300">
              {isZh ? '實時負載波動趨勢 (Real-Time Telemetry Timeline)' : 'Real-Time Telemetry Timeline (Last 2m)'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-blue-400" />
              <span>CPU</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-purple-400" />
              <span>RAM</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-400" />
              <span>Disk</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400/80">
              <span className="w-2.5 h-0.5 border-b border-dashed border-amber-400" />
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

              <CartesianGrid strokeDasharray="3 3" stroke="#181c26" vertical={false} />

              <XAxis 
                dataKey="time" 
                stroke="#4b5563" 
                fontSize={10} 
                tickLine={false}
                axisLine={{ stroke: '#1f2430' }}
                dy={6}
              />

              <YAxis 
                domain={[0, 100]} 
                stroke="#4b5563" 
                fontSize={10} 
                tickLine={false}
                axisLine={{ stroke: '#1f2430' }}
                tickFormatter={(v) => `${v}%`}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine 
                y={75} 
                stroke="#f59e0b" 
                strokeDasharray="4 4" 
                strokeOpacity={0.6}
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
      <div className="mt-4 pt-4 border-t border-gray-850/80 flex flex-wrap items-center justify-between text-xs font-mono text-gray-500 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>kube-apiserver: Running</span>
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>etcd-cluster: Healthy (Quorum 3/3)</span>
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>VictoriaLogs Ingest: Active</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
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

import React from 'react';
import {
  Layers,
  Server,
  Monitor,
  ShieldAlert,
  HardDrive,
  Wifi,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { MetricCardData } from './types';
import { SOC_SLA_METRICS } from './overviewData';
import { cn } from '../../lib/utils';

interface OverviewMetricCardsProps {
  metrics: MetricCardData[];
  isZh: boolean;
  onSelectMetric?: (metricId: string) => void;
  selectedMetricId?: string;
}

export const OverviewMetricCards: React.FC<OverviewMetricCardsProps> = ({
  metrics,
  isZh,
  onSelectMetric,
  selectedMetricId
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'total_events':
        return <Layers className="text-blue-400" size={18} />;
      case 'ccs_workers':
        return <Server className="text-emerald-400" size={18} />;
      case 'endpoints':
        return <Monitor className="text-cyan-400" size={18} />;
      case 'active_threats':
        return <ShieldAlert className="text-red-400" size={18} />;
      case 'storage_efficiency':
        return <HardDrive className="text-purple-400" size={18} />;
      case 'network_bandwidth':
        return <Wifi className="text-amber-400" size={18} />;
      default:
        return <Layers className="text-blue-400" size={18} />;
    }
  };

  const getBorderColor = (color: string, isSelected: boolean) => {
    if (isSelected) return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]';
    switch (color) {
      case 'blue': return 'hover:border-blue-500/40';
      case 'green': return 'hover:border-emerald-500/40';
      case 'cyan': return 'hover:border-cyan-500/40';
      case 'red': return 'hover:border-red-500/40';
      case 'purple': return 'hover:border-purple-500/40';
      case 'orange': return 'hover:border-amber-500/40';
      default: return 'hover:border-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* 6 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric) => {
          const isSelected = selectedMetricId === metric.id;
          return (
            <div
              key={metric.id}
              id={`overview-metric-${metric.id}`}
              onClick={() => onSelectMetric && onSelectMetric(metric.id)}
              className={cn(
                "bg-[#111114] border border-gray-800/80 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group",
                getBorderColor(metric.color, isSelected)
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-gray-900/90 rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors">
                  {getIcon(metric.id)}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                  {metric.trend === 'up' && <TrendingUp size={12} className="text-emerald-400" />}
                  {metric.trend === 'down' && <TrendingDown size={12} className="text-emerald-400" />}
                  <span className={metric.id === 'active_threats' ? 'text-red-400 font-bold' : 'text-gray-400'}>
                    {isZh ? metric.changeZh : metric.changeEn}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-gray-400 tracking-wider block mb-1 uppercase">
                  {isZh ? metric.titleZh : metric.titleEn}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white tracking-tight font-mono">
                    {metric.value}
                  </span>
                  {metric.subValue && (
                    <span className="text-xs text-gray-400 font-medium">
                      {metric.subValue}
                    </span>
                  )}
                </div>
              </div>

              {/* Sparkline Visual Bar */}
              <div className="mt-3 pt-2 border-t border-gray-900 flex items-end gap-1 h-4">
                {metric.sparkline.map((val, idx) => {
                  const max = Math.max(...metric.sparkline);
                  const heightPercent = Math.max(20, Math.round((val / max) * 100));
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex-1 rounded-sm transition-all",
                        metric.id === 'active_threats'
                          ? "bg-red-500/40 group-hover:bg-red-500/80"
                          : "bg-blue-500/30 group-hover:bg-blue-500/70"
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* SOC Operational SLAs & Automation Performance Bar */}
      <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs divide-x-0 sm:divide-x divide-gray-800">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {isZh ? '平均威脅偵測時間 (MTTD)' : 'Mean Time to Detect (MTTD)'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black text-white font-mono">{isZh ? SOC_SLA_METRICS.mttdZh : SOC_SLA_METRICS.mttdEn}</span>
              <span className="text-[10px] text-emerald-400 font-bold">{SOC_SLA_METRICS.mttdChange}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {isZh ? '平均威脅回應時間 (MTTR)' : 'Mean Time to Respond (MTTR)'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black text-white font-mono">{isZh ? SOC_SLA_METRICS.mttrZh : SOC_SLA_METRICS.mttrEn}</span>
              <span className="text-[10px] text-emerald-400 font-bold">{SOC_SLA_METRICS.mttrChange}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {isZh ? 'SOAR 自動阻斷率' : 'SOAR Auto-Containment'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black text-purple-400 font-mono">{SOC_SLA_METRICS.autoContainmentRate}</span>
              <span className="text-[10px] text-gray-400">{isZh ? '免人工介入' : 'Zero-touch'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <ShieldAlert size={16} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {isZh ? '告警誤報率 (FP Rate)' : 'False Positive Rate'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black text-emerald-400 font-mono">{SOC_SLA_METRICS.falsePositiveRate}</span>
              <span className="text-[10px] text-gray-400">{isZh ? 'AI 降噪過濾' : 'Noise-reduced'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

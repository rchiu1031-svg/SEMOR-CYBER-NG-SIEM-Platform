import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Clock,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EXECUTIVE_OVERVIEW_METRICS } from './executiveData';

interface ExecutiveMetricsGridProps {
  isZh: boolean;
  onOpenFinancialModal?: () => void;
}

export function ExecutiveMetricsGrid({ isZh, onOpenFinancialModal }: ExecutiveMetricsGridProps) {
  const m = EXECUTIVE_OVERVIEW_METRICS;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Security Health Posture */}
      <div className="p-6 bg-[#111114] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            {isZh ? '全域資安健康指數' : 'Security Posture Health'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {m.healthGrade}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white tracking-tight">
              {m.healthIndex}
            </span>
            <span className="text-sm font-bold text-gray-500">/ 100</span>
          </div>
          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-400">
            <TrendingUp size={13} />
            +{m.healthIndexDelta}% {isZh ? '較上季' : 'QoQ'}
          </span>
        </div>

        <div className="mt-3">
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.healthIndex}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-mono">
            <span>{isZh ? '防禦韌性門檻: 80' : 'Baseline Target: 80'}</span>
            <span className="text-emerald-400 font-bold">{isZh ? '優於同業 24%' : 'Top 10% Industry'}</span>
          </div>
        </div>
      </div>

      {/* 2. Cyber Risk Financial VaR (Value at Risk) */}
      <div
        onClick={onOpenFinancialModal}
        className="p-6 bg-[#111114] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={14} className="text-blue-400" />
            {isZh ? '財務風險暴險值 (95% VaR)' : 'Value at Risk (95% VaR)'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            FAIR Model
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black font-mono text-white tracking-tight">
              ${(m.valueAtRiskUsd / 1000000).toFixed(2)}M
            </span>
          </div>
          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-400">
            <TrendingDown size={13} />
            {m.valueAtRiskDelta}% {isZh ? '暴險降幅' : 'Reduced'}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{isZh ? '同業平均暴險' : 'Peer Benchmark'}</span>
            <span className="font-mono text-gray-300 font-bold">
              ${(m.industryPeerAvgVaR / 1000000).toFixed(1)}M
            </span>
          </div>
          <p className="text-[10px] text-blue-400/90 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 size={11} />
            {isZh ? '有效節省約 $5.55M 預期損失風險' : 'Defenses mitigated $5.55M exposure'}
          </p>
        </div>
      </div>

      {/* 3. SecOps Automation & Cost Savings */}
      <div className="p-6 bg-[#111114] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400" />
            {isZh ? '自動化防禦與工時節省' : 'SOAR Automation & ROI'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {m.deflectionRatio}% Auto
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white tracking-tight">
              {m.analystHoursSaved.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-500">{isZh ? '小時節省' : 'hrs saved'}</span>
          </div>
          <span className="text-xs font-bold text-amber-400 font-mono">
            +${(m.costSavingsUsd / 1000000).toFixed(2)}M ROI
          </span>
        </div>

        <div className="mt-3">
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.deflectionRatio}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-mono">
            <span>{isZh ? '零人工介入自動隔離率' : 'Zero-touch Containment'}</span>
            <span className="text-gray-300 font-bold">96.8%</span>
          </div>
        </div>
      </div>

      {/* 4. MTTR / MTTD Velocity */}
      <div className="p-6 bg-[#111114] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-400" />
            {isZh ? '應變速度 (MTTD / MTTR)' : 'Velocity (MTTD / MTTR)'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            Sub-15m
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '偵測 (MTTD)' : 'MTTD'}</span>
            <span className="text-2xl font-black font-mono text-white">{m.mttdMinutes}m</span>
            <span className="text-[9px] text-gray-500 block">{isZh ? '同業約 20 天' : 'vs 20d ind.'}</span>
          </div>
          <div className="border-l border-white/10 pl-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '阻斷 (MTTR)' : 'MTTR'}</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{m.mttrMinutes}m</span>
            <span className="text-[9px] text-gray-500 block">{isZh ? '同業約 70 天' : 'vs 70d ind.'}</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
          <span>{isZh ? '核心業務妥善率' : 'SLA Availability'}</span>
          <span className="text-emerald-400 font-mono font-bold">{m.businessUptime}%</span>
        </div>
      </div>
    </div>
  );
}

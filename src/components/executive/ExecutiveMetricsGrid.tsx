import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EXECUTIVE_OVERVIEW_METRICS } from './executiveData';
import type { CtoOverviewMetrics, ComplianceSummaryMetrics } from './types';

interface ExecutiveMetricsGridProps {
  isZh: boolean;
  metrics?: CtoOverviewMetrics;
  complianceSummary?: ComplianceSummaryMetrics;
  onOpenFinancialModal?: () => void;
  onOpenComplianceTab?: () => void;
}

export function ExecutiveMetricsGrid({
  isZh,
  metrics,
  complianceSummary,
  onOpenFinancialModal,
  onOpenComplianceTab
}: ExecutiveMetricsGridProps) {
  const m: CtoOverviewMetrics = metrics || {
    ...EXECUTIVE_OVERVIEW_METRICS,
    sbomSignedCoverage: 97.4,
    pqcReadinessPct: 42,
    zeroTrustAdoptionPct: 88,
    totalWormBlocks: 10428
  };

  const comp: ComplianceSummaryMetrics = complianceSummary || {
    averageScore: 94,
    totalControls: 453,
    totalPassed: 423,
    totalWarnings: 21,
    totalViolations: 9,
    pendingApprovalsCount: 2
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Architecture & Security Posture Health */}
      <div className="p-5 bg-[#111114] border border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between transition-colors hover:border-blue-500/40">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            {isZh ? '架構與資安健康分' : 'Tech & Security Health'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
            {m.healthGrade}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono tabular-nums text-white tracking-tight">
              {m.healthIndex}
            </span>
            <span className="text-xs font-bold text-gray-500 font-mono">/ 100</span>
          </div>
          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-400 font-mono tabular-nums whitespace-nowrap">
            <TrendingUp size={13} />
            +{m.healthIndexDelta}% {isZh ? '較上季' : 'QoQ'}
          </span>
        </div>

        <div className="mt-3">
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.healthIndex}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-mono tabular-nums">
            <span>{isZh ? `Zero Trust ${m.zeroTrustAdoptionPct}%` : `Zero Trust ${m.zeroTrustAdoptionPct}%`}</span>
            <span className="text-emerald-400 font-bold">
              {isZh ? `SBOM 簽章 ${m.sbomSignedCoverage}%` : `SBOM ${m.sbomSignedCoverage}%`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Global 6-Framework Compliance Attainment */}
      <button
        type="button"
        onClick={onOpenComplianceTab}
        className="p-5 bg-[#111114] border border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between text-left transition-colors hover:border-blue-500/40 group cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <Award size={14} className="text-blue-400 shrink-0" />
            {isZh ? '六大法規合規達成率' : '6-Framework Compliance'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 whitespace-nowrap shrink-0">
            <span>{isZh ? '稽核中心' : 'Audit Hub'}</span>
            <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-2 w-full">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono tabular-nums text-white tracking-tight">
              {comp.averageScore}%
            </span>
            <span className="text-xs font-bold text-gray-500 font-mono tabular-nums">
              ({comp.totalPassed}/{comp.totalControls})
            </span>
          </div>
          <span
            className={cn(
              'text-xs font-bold font-mono tabular-nums whitespace-nowrap',
              comp.totalViolations > 0 ? 'text-rose-400' : 'text-emerald-400'
            )}
          >
            {comp.totalViolations} {isZh ? '待修復缺口' : 'Open Gaps'}
          </span>
        </div>

        <div className="mt-3 w-full">
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${comp.averageScore}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-mono tabular-nums">
            <span>{isZh ? `WORM 存證 ${m.totalWormBlocks.toLocaleString()} 塊` : `${m.totalWormBlocks.toLocaleString()} WORM Blocks`}</span>
            <span className="text-amber-400 font-bold">
              {comp.totalWarnings} {isZh ? '警告' : 'Warn'}
            </span>
          </div>
        </div>
      </button>

      {/* 3. Cyber Risk Financial VaR (Value at Risk) */}
      <button
        type="button"
        onClick={onOpenFinancialModal}
        className="p-5 bg-[#111114] border border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between text-left transition-colors hover:border-blue-500/40 group cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <DollarSign size={14} className="text-cyan-400 shrink-0" />
            {isZh ? '財務暴險值 (95% VaR)' : 'FAIR 95% Value at Risk'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1 whitespace-nowrap shrink-0">
            <span>FAIR Model</span>
            <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-2 w-full">
          <span className="text-3xl font-black font-mono tabular-nums text-white tracking-tight">
            ${(m.valueAtRiskUsd / 1000000).toFixed(2)}M
          </span>
          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-400 font-mono tabular-nums whitespace-nowrap">
            <TrendingDown size={13} />
            {m.valueAtRiskDelta}% {isZh ? '降幅' : 'Reduced'}
          </span>
        </div>

        <div className="mt-3 w-full">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{isZh ? '同業平均暴險基準' : 'Peer Benchmark'}</span>
            <span className="font-mono tabular-nums text-gray-300 font-bold">
              ${(m.industryPeerAvgVaR / 1000000).toFixed(1)}M
            </span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
            <CheckCircle2 size={11} className="shrink-0" />
            {isZh
              ? `較同業節省 $${((m.industryPeerAvgVaR - m.valueAtRiskUsd) / 1000000).toFixed(2)}M 風險暴險`
              : `$${((m.industryPeerAvgVaR - m.valueAtRiskUsd) / 1000000).toFixed(2)}M exposure avoided vs peers`}
          </p>
        </div>
      </button>

      {/* 4. Engineering Velocity, SLA & SOAR Savings */}
      <div className="p-5 bg-[#111114] border border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between transition-colors hover:border-blue-500/40">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <Clock size={14} className="text-indigo-400 shrink-0" />
            {isZh ? '工程韌性與 SOAR 效能' : 'Resilience & SOAR ROI'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono tabular-nums whitespace-nowrap shrink-0">
            SLA {m.businessUptime}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase block">MTTD / MTTR</span>
            <span className="text-xl font-black font-mono tabular-nums text-white">
              {m.mttdMinutes}m <span className="text-gray-500">/</span>{' '}
              <span className="text-emerald-400">{m.mttrMinutes}m</span>
            </span>
          </div>
          <div className="border-l border-white/10 pl-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">
              {isZh ? '自動化省時' : 'Hours Saved'}
            </span>
            <span className="text-xl font-black font-mono tabular-nums text-amber-400">
              {m.analystHoursSaved.toLocaleString()}h
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono tabular-nums">
          <span>{isZh ? `自動攔截率 ${m.deflectionRatio}%` : `${m.deflectionRatio}% Auto Containment`}</span>
          <span className="text-emerald-400 font-bold">+${(m.costSavingsUsd / 1000000).toFixed(2)}M ROI</span>
        </div>
      </div>
    </div>
  );
}

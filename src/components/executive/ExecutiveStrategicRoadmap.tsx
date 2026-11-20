import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Target,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { StrategicRoadmapItem } from './types';
import { STRATEGIC_ROADMAP_DATA } from './executiveData';

interface ExecutiveStrategicRoadmapProps {
  isZh: boolean;
  roadmap?: StrategicRoadmapItem[];
  onUpdateRoadmap?: (
    id: string,
    updates: Partial<Pick<StrategicRoadmapItem, 'progress' | 'status'>>
  ) => Promise<void> | void;
}

export function ExecutiveStrategicRoadmap({
  isZh,
  roadmap,
  onUpdateRoadmap
}: ExecutiveStrategicRoadmapProps) {
  const [filter, setFilter] = useState<'all' | 'on_track' | 'completed' | 'at_risk'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const items = roadmap && roadmap.length > 0 ? roadmap : STRATEGIC_ROADMAP_DATA;

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const totalBudget = items.reduce((acc, i) => acc + i.budgetTotal, 0);
  const totalUtilized = items.reduce((acc, i) => acc + i.budgetUtilized, 0);

  const handleAdvanceMilestone = async (item: StrategicRoadmapItem) => {
    if (!onUpdateRoadmap) return;
    setUpdatingId(item.id);
    const nextProgress = Math.min(100, item.progress + 10);
    const nextStatus = nextProgress >= 100 ? 'completed' : 'on_track';
    try {
      await onUpdateRoadmap(item.id, { progress: nextProgress, status: nextStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-blue-400 shrink-0" />
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? 'CTO 零信任架構藍圖與技術安全投資里程碑' : 'CTO Architecture Security Roadmap & Milestones'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '追蹤 2026-2027 零信任邊界、SOAR 自動化、SBOM 供應鏈與後量子密碼 (PQC) 執行進度'
              : 'Tracking Zero Trust, SOAR coverage, SBOM gates, and Post-Quantum Cryptography delivery'}
          </p>
        </div>

        {/* Budget Execution Quick Summary */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2 rounded-xl shrink-0">
          <div>
            <span className="text-[10px] uppercase font-mono text-gray-400 block">
              {isZh ? '戰略預算執行率' : 'Budget Executed'}
            </span>
            <div className="flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-sm font-black text-white">
                ${(totalUtilized / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-gray-400">
                / ${(totalBudget / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-emerald-400 font-bold ml-1">
                ({totalBudget > 0 ? Math.round((totalUtilized / totalBudget) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'all', label: isZh ? '全部戰略專案' : 'All Projects' },
          { id: 'on_track', label: isZh ? '正常推進中' : 'On Track' },
          { id: 'completed', label: isZh ? '已驗收交付' : 'Completed' },
          { id: 'at_risk', label: isZh ? '需資源協調' : 'At Risk' }
        ].map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setFilter(btn.id as any)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
              filter === btn.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white'
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Roadmap Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isCompleted = item.status === 'completed';
          const isAtRisk = item.status === 'at_risk';

          return (
            <div
              key={item.id}
              className="p-5 bg-black/30 border border-white/10 rounded-xl space-y-3 hover:border-blue-500/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                        {item.targetQuarter}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{item.domain}</span>
                    </div>
                    <h4 className="text-xs font-black text-white mt-1.5 leading-snug">{item.title}</h4>
                  </div>

                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0',
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isAtRisk
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    )}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono tabular-nums">
                    <span className="text-gray-400">{isZh ? '專案達成進度' : 'Milestone Progress'}</span>
                    <span className="text-white font-bold">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      className={cn(
                        'h-full rounded-full',
                        isCompleted ? 'bg-emerald-500' : isAtRisk ? 'bg-rose-500' : 'bg-blue-500'
                      )}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono text-gray-400">
                  <span className="flex items-center gap-1 truncate">
                    <User size={11} className="text-gray-500 shrink-0" />
                    {item.owner}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums">
                      ${(item.budgetUtilized / 1000).toFixed(0)}k / ${(item.budgetTotal / 1000).toFixed(0)}k
                    </span>
                    {onUpdateRoadmap && !isCompleted && (
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => handleAdvanceMilestone(item)}
                        className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 font-bold transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <ArrowUpRight size={10} />
                        <span>+10%</span>
                      </button>
                    )}
                    {isCompleted && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 size={11} />
                        {isZh ? '已驗收' : 'Done'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

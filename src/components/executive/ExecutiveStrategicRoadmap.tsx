import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GitBranch,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { StrategicRoadmapItem } from './types';
import { STRATEGIC_ROADMAP_DATA } from './executiveData';

interface ExecutiveStrategicRoadmapProps {
  isZh: boolean;
}

export function ExecutiveStrategicRoadmap({ isZh }: ExecutiveStrategicRoadmapProps) {
  const [filter, setFilter] = useState<'all' | 'on_track' | 'completed' | 'at_risk'>('all');

  const filteredItems = STRATEGIC_ROADMAP_DATA.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const totalBudget = STRATEGIC_ROADMAP_DATA.reduce((acc, i) => acc + i.budgetTotal, 0);
  const totalUtilized = STRATEGIC_ROADMAP_DATA.reduce((acc, i) => acc + i.budgetUtilized, 0);

  return (
    <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-blue-400" />
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? '全域資安戰略進程與零信任里程碑' : 'Strategic Security Roadmap & Zero Trust Milestones'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '追蹤 2026-2027 企業防禦架構轉型、預算執行率與戰略交付成果'
              : 'Tracking enterprise defense modernization, budget execution, and delivery milestones'}
          </p>
        </div>

        {/* Budget Execution Quick Summary */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2 rounded-2xl">
          <div>
            <span className="text-[10px] uppercase font-mono text-gray-500 block">
              {isZh ? '戰略預算執行率' : 'Budget Executed'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black font-mono text-white">
                ${(totalUtilized / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                / ${(totalBudget / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold ml-1">
                ({Math.round((totalUtilized / totalBudget) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'all', label: isZh ? '全部戰略專案' : 'All Projects' },
          { id: 'on_track', label: isZh ? '正常推進中 (On Track)' : 'On Track' },
          { id: 'completed', label: isZh ? '已驗收交付 (Completed)' : 'Completed' },
          { id: 'at_risk', label: isZh ? '需資源協調 (At Risk)' : 'At Risk' }
        ].map(btn => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setFilter(btn.id as any)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              filter === btn.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-white/5 text-gray-400 hover:text-white"
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Roadmap Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const isCompleted = item.status === 'completed';
          const isAtRisk = item.status === 'at_risk';

          return (
            <div
              key={item.id}
              className="p-5 bg-black/30 border border-white/5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {item.targetQuarter}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {item.domain}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white mt-1.5 leading-snug">
                    {item.title}
                  </h4>
                </div>

                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0",
                    isCompleted
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : isAtRisk
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                {item.description}
              </p>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">{isZh ? '專案達成進度' : 'Milestone Progress'}</span>
                  <span className="text-white font-bold">{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    className={cn(
                      "h-full rounded-full",
                      isCompleted ? "bg-emerald-500" : isAtRisk ? "bg-rose-500" : "bg-blue-500"
                    )}
                  />
                </div>
              </div>

              {/* Footer info: Owner and budget */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="flex items-center gap-1">
                  <User size={11} className="text-gray-500" />
                  {item.owner}
                </span>
                <span>
                  ${(item.budgetUtilized / 1000).toFixed(0)}k / ${(item.budgetTotal / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

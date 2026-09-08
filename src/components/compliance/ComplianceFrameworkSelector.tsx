import React from 'react';
import { ComplianceFrameworkMeta, FrameworkId } from './types';
import { cn } from '../../lib/utils';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Award, ChevronRight } from 'lucide-react';

interface ComplianceFrameworkSelectorProps {
  frameworks: ComplianceFrameworkMeta[];
  selectedFrameworkId: FrameworkId;
  onSelect: (id: FrameworkId) => void;
  isZh: boolean;
}

export const ComplianceFrameworkSelector: React.FC<ComplianceFrameworkSelectorProps> = ({
  frameworks,
  selectedFrameworkId,
  onSelect,
  isZh
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {frameworks.map((fw) => {
        const isSelected = selectedFrameworkId === fw.id;
        const passRate = Math.round((fw.passedControls / fw.totalControls) * 100);

        return (
          <button
            key={fw.id}
            onClick={() => onSelect(fw.id)}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group flex flex-col justify-between",
              isSelected
                ? "bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30"
                : "bg-[#111114] border-white/5 hover:border-white/20 hover:bg-white/[0.03]"
            )}
          >
            {/* Top active indicator line */}
            {isSelected && (
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"
              />
            )}

            <div>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                    isSelected ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 group-hover:text-gray-300"
                  )}
                >
                  {fw.shortName}
                </span>

                <span
                  className={cn(
                    "text-xs font-black tracking-tight",
                    fw.score >= 95 ? "text-emerald-400" : fw.score >= 90 ? "text-blue-400" : "text-amber-400"
                  )}
                >
                  {fw.score}%
                </span>
              </div>

              {/* Title & category */}
              <div className="text-sm font-bold text-white tracking-tight line-clamp-1 mb-1">
                {fw.name}
              </div>
              <div className="text-[11px] text-gray-500 line-clamp-1 mb-3">
                {fw.category}
              </div>
            </div>

            {/* Score progress bar & quick metrics */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    fw.score >= 95 ? "bg-emerald-500" : fw.score >= 90 ? "bg-blue-500" : "bg-amber-500"
                  )}
                  style={{ width: `${passRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={11} /> {fw.passedControls} {isZh ? '通過' : 'Pass'}
                </span>
                {fw.violatedControls > 0 ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <XCircle size={11} /> {fw.violatedControls} {isZh ? '未過' : 'Fail'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle size={11} /> {fw.warningControls} {isZh ? '警告' : 'Warn'}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

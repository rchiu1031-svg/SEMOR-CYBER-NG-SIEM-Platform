import React, { useState } from 'react';
import {
  ShieldAlert,
  Crosshair,
  Terminal,
  Share2,
  Lock,
  UploadCloud,
  Layers,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { MitreTacticItem } from './types';
import { cn } from '../../lib/utils';

interface OverviewMitreMatrixProps {
  tactics: MitreTacticItem[];
  isZh: boolean;
  onSelectTactic?: (tacticId: string) => void;
}

export const OverviewMitreMatrix: React.FC<OverviewMitreMatrixProps> = ({
  tactics,
  isZh,
  onSelectTactic
}) => {
  const [selectedTacticId, setSelectedTacticId] = useState<string | null>(null);

  const getTacticIcon = (id: string) => {
    switch (id) {
      case 'initial_access': return <Crosshair size={14} className="text-amber-400" />;
      case 'execution': return <Terminal size={14} className="text-red-400" />;
      case 'persistence': return <Lock size={14} className="text-blue-400" />;
      case 'lateral_movement': return <Share2 size={14} className="text-purple-400" />;
      case 'exfiltration': return <UploadCloud size={14} className="text-rose-400" />;
      default: return <Layers size={14} className="text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-400" size={18} />
            <h2 className="text-base font-bold text-white tracking-wide">
              {isZh ? 'MITRE ATT&CK® 即時攻擊戰術矩陣' : 'Live MITRE ATT&CK® Tactical Heatmap'}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isZh
              ? '即時關聯端點 EDR 與網路流量特徵對應之戰術階段'
              : 'Real-time telemetry mapped to cyber kill-chain tactics'}
          </p>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-bold">
          {isZh ? '偵測到 5 項戰術階段' : '5 Tactics Active'}
        </span>
      </div>

      {/* Grid of 5 major tactics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {tactics.map((tactic) => {
          const isSelected = selectedTacticId === tactic.id;
          return (
            <div
              key={tactic.id}
              onClick={() => {
                const nextId = isSelected ? null : tactic.id;
                setSelectedTacticId(nextId);
                if (onSelectTactic && nextId) onSelectTactic(nextId);
              }}
              className={cn(
                "bg-black/40 border rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group",
                isSelected
                  ? "border-blue-500 bg-blue-950/20 shadow-md shadow-blue-500/10"
                  : "border-gray-800 hover:border-gray-700 hover:bg-gray-900/30"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {getTacticIcon(tactic.id)}
                    <span className="text-[10px] font-mono text-gray-400 font-bold">{tactic.code}</span>
                  </div>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase", getSeverityBadge(tactic.severity))}>
                    {tactic.detectedCount}
                  </span>
                </div>

                <div className="text-xs font-bold text-gray-200 group-hover:text-blue-400 transition-colors mb-2">
                  {isZh ? tactic.tacticZh : tactic.tacticEn}
                </div>
              </div>

              {/* Sub-techniques */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
                {tactic.techniques.map((tech) => (
                  <div
                    key={tech.code}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded bg-gray-900/60 border border-gray-800/50"
                  >
                    <div className="flex items-center gap-1.5 truncate mr-1">
                      {tech.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0"></span>
                      )}
                      <span className="font-mono text-gray-400 shrink-0 text-[10px]">{tech.code}</span>
                      <span className="truncate text-gray-300 text-[10px]">
                        {isZh ? tech.nameZh : tech.nameEn}
                      </span>
                    </div>
                    <span className="font-mono text-gray-400 font-bold text-[10px] shrink-0">
                      {tech.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tactic summary strip */}
      <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>
            {isZh ? '高危威脅：已自動與 EDR 聯防阻斷橫向擴散' : 'High-risk threats automatically blocked across endpoints'}
          </span>
        </div>
        <button className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
          <span>{isZh ? '查看完整 MITRE ATT&CK 覆蓋度' : 'Full MITRE Matrix'}</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

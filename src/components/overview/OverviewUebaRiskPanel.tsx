import React from 'react';
import {
  Brain,
  ChevronRight,
  AlertTriangle,
  User,
  Shield,
  FileSearch,
  ExternalLink
} from 'lucide-react';
import { UebaHighRiskEntity } from './types';
import { cn } from '../../lib/utils';

interface OverviewUebaRiskPanelProps {
  entities: UebaHighRiskEntity[];
  isZh: boolean;
  onSelectEntity: (entity: UebaHighRiskEntity) => void;
  onNavigateUebaView: () => void;
}

export const OverviewUebaRiskPanel: React.FC<OverviewUebaRiskPanelProps> = ({
  entities,
  isZh,
  onSelectEntity,
  onNavigateUebaView
}) => {
  return (
    <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="text-purple-400" size={18} />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {isZh ? '高風險實體 (UEBA 行為分析)' : 'High-Risk Entities (UEBA)'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh ? 'AI 實體行為基準線 (Baseline) 偏離異常評估' : 'Behavior baseline anomaly deviations'}
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateUebaView}
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1"
            title={isZh ? '查看完整 UEBA 系統' : 'Go to UEBA investigation'}
          >
            <ExternalLink size={14} />
          </button>
        </div>

        {/* Entities List */}
        <div className="space-y-3">
          {entities.map((entity) => {
            const isCritical = entity.score >= 80;
            return (
              <div
                key={entity.id}
                id={`overview-ueba-entity-${entity.id}`}
                onClick={() => onSelectEntity(entity)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2",
                  isCritical
                    ? "bg-red-950/10 border-red-900/40 hover:border-red-500/50 hover:bg-red-950/20"
                    : "bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 font-mono",
                      isCritical
                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                        : "bg-purple-500/20 border-purple-500/40 text-purple-400"
                    )}>
                      {entity.avatarInitials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                        <span>{entity.name}</span>
                        {isCritical && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {isZh ? entity.departmentZh : entity.departmentEn} · {isZh ? entity.roleZh : entity.roleEn}
                      </div>
                    </div>
                  </div>

                  {/* Score & Gauge */}
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={cn(
                        "text-base font-black font-mono",
                        isCritical ? "text-red-400" : "text-purple-400"
                      )}>
                        {entity.score}
                      </span>
                      <span className="text-[10px] text-gray-500">/100</span>
                    </div>
                    <div className="w-14 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={cn("h-full rounded-full", isCritical ? "bg-red-500" : "bg-purple-500")}
                        style={{ width: `${entity.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Primary anomaly trigger tag */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-900">
                  <div className="flex items-center gap-1.5 text-gray-300 truncate max-w-[210px]">
                    <AlertTriangle size={11} className={isCritical ? "text-red-400 shrink-0" : "text-amber-400 shrink-0"} />
                    <span className="truncate">
                      {isZh ? entity.triggersZh[0] : entity.triggersEn[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0">
                    {entity.lastAnomalyTime}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <button
        id="overview-ueba-deep-dive-btn"
        onClick={onNavigateUebaView}
        className="w-full mt-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-gray-800 flex items-center justify-center gap-2"
      >
        <FileSearch size={14} />
        <span>{isZh ? '開啟使用者與實體行為深度調查' : 'Open UEBA Investigation'}</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

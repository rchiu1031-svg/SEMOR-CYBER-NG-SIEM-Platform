import React, { useState } from 'react';
import { 
  Database, 
  RotateCw, 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  Plus, 
  Clock, 
  Layers, 
  FileCheck2, 
  Server,
  AlertTriangle
} from 'lucide-react';
import { FimBaselineSnapshot } from '../../../data/soarFimData';

interface FimBaselinesTabProps {
  baselines: FimBaselineSnapshot[];
  onRecalculateBaseline: (baselineId: string) => void;
  onAddBaseline: (newBaseline: Partial<FimBaselineSnapshot>) => void;
}

export const FimBaselinesTab: React.FC<FimBaselinesTabProps> = ({
  baselines,
  onRecalculateBaseline,
  onAddBaseline
}) => {
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleRecalculate = (id: string) => {
    setRecalculatingId(id);
    setTimeout(() => {
      onRecalculateBaseline(id);
      setRecalculatingId(null);
      setSuccessNotice(`基線 [${id}] 已完成最新 SHA-256 雜湊樹重構與核准簽章！`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="text-purple-400" size={18} />
            黃金基線快照庫 (Golden Baseline Snapshot Library)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            儲存通過 ITIL 變更審批 (Change Request) 之各主機叢集標準 SHA-256 / SSDEEP 雜湊樹，作為 SOAR 自動秒級還原之防篡改依據
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold font-mono">
            {baselines.length} Clusters Indexed
          </span>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Baseline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {baselines.map((base) => (
          <div
            key={base.id}
            className="bg-[#0e131f] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                  {base.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {base.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-snug">{base.clusterName}</h3>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{base.osType}</div>
              </div>

              {/* Stats */}
              <div className="p-4 bg-black/50 rounded-xl border border-gray-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">已索引檔案總數:</span>
                  <span className="text-white font-mono font-bold">{base.totalFilesIndexed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">加密雜湊演算法:</span>
                  <span className="text-purple-400 font-mono">{base.hashAlgorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">關聯變更單號:</span>
                  <span className="text-blue-400 font-mono font-bold">{base.changeRequestTicket}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">審批簽核者:</span>
                  <span className="text-gray-300">{base.approvedBy}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-800">
                  <span className="text-gray-500">現存漂移項目:</span>
                  <span className={base.driftCount > 0 ? 'text-red-400 font-bold font-mono' : 'text-emerald-400 font-mono'}>
                    {base.driftCount} 處漂移
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-500 font-mono">
                {base.createdDate}
              </span>

              <button
                onClick={() => handleRecalculate(base.id)}
                disabled={recalculatingId === base.id}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
              >
                <RotateCw size={12} className={recalculatingId === base.id ? 'animate-spin' : ''} />
                {recalculatingId === base.id ? '計算雜湊中...' : '重新建立基線'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

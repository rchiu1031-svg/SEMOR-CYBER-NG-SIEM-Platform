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
  AlertTriangle,
  X
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCluster, setNewCluster] = useState('');
  const [newOs, setNewOs] = useState('Linux Ubuntu 24.04 LTS');
  const [newTicket, setNewTicket] = useState('CR-2026-0955');

  const handleCreateBaseline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCluster.trim()) return;

    onAddBaseline({
      id: `BASE-2026-${Date.now().toString().slice(-4)}`,
      clusterName: newCluster.trim(),
      osType: newOs,
      totalFilesIndexed: Math.floor(Math.random() * 25000) + 12000,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      hashAlgorithm: 'SHA-256 + SSDEEP Fuzzy Hash',
      approvedBy: 'CISO / SOC SecOps Lead',
      changeRequestTicket: newTicket.trim(),
      status: 'Active Golden Baseline',
      driftCount: 0
    });

    setNewCluster('');
    setShowAddModal(false);
    setSuccessNotice(`叢集黃金基線快照 [${newCluster}] 已成功建立並納入自動防篡改庫！`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleRecalculate = (id: string) => {
    setRecalculatingId(id);
    setTimeout(() => {
      onRecalculateBaseline(id);
      setRecalculatingId(null);
      setSuccessNotice(`基線 [${id}] 已完成最新 SHA-256 雜湊樹重構與核准簽章！`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }, 1200);
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

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold font-mono">
            {baselines.length} Clusters Indexed
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
          >
            <Plus size={14} />
            建立黃金快照
          </button>
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

      {/* Add Baseline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="text-purple-400" size={18} />
                建立主機叢集黃金基線快照
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBaseline} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  叢集名稱 (Cluster / Node Group) *
                </label>
                <input
                  type="text"
                  value={newCluster}
                  onChange={(e) => setNewCluster(e.target.value)}
                  placeholder="例如：k8s-ingress-prod-cluster"
                  required
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  作業系統版本 (OS Environment)
                </label>
                <select
                  value={newOs}
                  onChange={(e) => setNewOs(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Linux Ubuntu 24.04 LTS">Linux Ubuntu 24.04 LTS</option>
                  <option value="Linux Red Hat Enterprise Linux 9.4">Linux Red Hat Enterprise Linux 9.4</option>
                  <option value="Windows Server 2022 Datacenter">Windows Server 2022 Datacenter</option>
                  <option value="Debian 12 Bookworm (Hardened Kernel)">Debian 12 Bookworm (Hardened Kernel)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  ITIL 變更審批單號 (CR Ticket)
                </label>
                <input
                  type="text"
                  value={newTicket}
                  onChange={(e) => setNewTicket(e.target.value)}
                  placeholder="CR-2026-XXXX"
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-xl text-[11px] text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-400" />
                  自動雜湊樹防偽校驗
                </div>
                <p className="text-gray-400">
                  系統將調用 eBPF 探針爬梳節點核心二進位檔與組態目錄，自動生成 SHA-256 + SSDEEP 模糊雜湊庫。
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20"
                >
                  確認建立快照
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

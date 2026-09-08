import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  CheckCircle2, 
  Shield, 
  Lock, 
  Check, 
  X, 
  Server, 
  ExternalLink,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { FimPolicyItem } from '../../../data/soarFimData';

interface FimPoliciesTabProps {
  policies: FimPolicyItem[];
  onTogglePolicy: (id: string) => void;
  onAddPolicy: (newPolicy: Partial<FimPolicyItem>) => void;
}

export const FimPoliciesTab: React.FC<FimPoliciesTabProps> = ({
  policies,
  onTogglePolicy,
  onAddPolicy
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newStandard, setNewStandard] = useState<FimPolicyItem['standard']>('Custom');
  const [newPath, setNewPath] = useState('/etc/nginx/**');
  const [newEngine, setNewEngine] = useState<FimPolicyItem['detectionEngine']>('Real-time eBPF / inotify');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) return;

    onAddPolicy({
      id: `POL-CUSTOM-${Date.now().toString().slice(-4)}`,
      name: newPolicyName,
      standard: newStandard,
      description: '自訂資安監控規則與特定路徑即時防護',
      monitoredPaths: newPath.split(',').map(s => s.trim()),
      recursive: true,
      checkAttributes: {
        contentHash: true,
        permissions: true,
        ownership: true,
        size: true,
        mtime: true
      },
      detectionEngine: newEngine,
      activeHostsCount: 16,
      enabled: true
    });

    setNewPolicyName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="text-purple-400" size={18} />
            監控策略與合規樣板庫 (FIM Compliance Policies & Rule Sets)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            設定 eBPF 核心級即時攔截目標路徑、雜湊檢查屬性與 PCI-DSS 4.0 / CIS / IEC 62443 規範基線
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus size={16} />
          新增監控策略
        </button>
      </div>

      {/* Policy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((pol) => (
          <div
            key={pol.id}
            className="bg-[#0e131f] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                      {pol.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {pol.standard}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">{pol.name}</h3>
                </div>

                <button
                  onClick={() => onTogglePolicy(pol.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 shrink-0 ${
                    pol.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {pol.enabled ? <Check size={12} /> : <X size={12} />}
                  {pol.enabled ? '已啟用' : '已停用'}
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                {pol.description}
              </p>

              {/* Monitored Paths */}
              <div className="space-y-1.5">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  監控標的路徑清單 (Monitored Paths)
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {pol.monitoredPaths.map((path, idx) => (
                    <span key={idx} className="bg-black/60 border border-gray-800 px-2 py-0.5 rounded text-gray-300">
                      {path}
                    </span>
                  ))}
                </div>
              </div>

              {/* Attribute check badges */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  稽核校驗屬性 (Checked Attributes)
                </span>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded ${pol.checkAttributes.contentHash ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40' : 'bg-gray-800 text-gray-500'}`}>
                    SHA-256 Hash
                  </span>
                  <span className={`px-2 py-0.5 rounded ${pol.checkAttributes.permissions ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40' : 'bg-gray-800 text-gray-500'}`}>
                    權限 (Permissions)
                  </span>
                  <span className={`px-2 py-0.5 rounded ${pol.checkAttributes.ownership ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40' : 'bg-gray-800 text-gray-500'}`}>
                    擁有者 (UID/GID)
                  </span>
                  <span className={`px-2 py-0.5 rounded ${pol.checkAttributes.size ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40' : 'bg-gray-800 text-gray-500'}`}>
                    檔案大小 (Size)
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Telemetry */}
            <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>引擎: <strong className="text-purple-400">{pol.detectionEngine}</strong></span>
              <span>覆蓋主機: <strong className="text-white">{pol.activeHostsCount} 台</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                建立新 FIM 檔案完整性監控策略
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-400 block">策略名稱</label>
                <input
                  type="text"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  placeholder="例如: Web 靜態資源目錄防篡改策略"
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-gray-400 block">合規標準</label>
                  <select
                    value={newStandard}
                    onChange={(e) => setNewStandard(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="PCI-DSS 4.0">PCI-DSS 4.0</option>
                    <option value="CIS Benchmark">CIS Benchmark</option>
                    <option value="ISO 27001">ISO 27001</option>
                    <option value="IEC 62443">IEC 62443</option>
                    <option value="Custom">自訂規範 (Custom)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400 block">偵測核心引擎</label>
                  <select
                    value={newEngine}
                    onChange={(e) => setNewEngine(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="Real-time eBPF / inotify">eBPF / inotify (零延遲)</option>
                    <option value="Periodic Hash Crawl">定時排程爬網雜湊</option>
                    <option value="Auditd Subsystem">Linux Auditd 核心審計</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 block">監控路徑 (以逗號分隔)</label>
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="/var/www/html/**, /etc/nginx/**"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                >
                  確認建立策略
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

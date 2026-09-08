import React, { useState } from 'react';
import { X, Plus, AlertTriangle, ShieldCheck, Server, User, Tag, Layers } from 'lucide-react';
import { CaseIncident, CaseSeverity, CaseCategory } from './types';

interface CaseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (newCase: Partial<CaseIncident>) => void;
}

export const CaseCreateModal: React.FC<CaseCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateCase
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<CaseSeverity>('High');
  const [category, setCategory] = useState<CaseCategory>('Ransomware');
  const [sourceEngine, setSourceEngine] = useState('SentinelOne + TheHive SIRP');
  const [affectedHost, setAffectedHost] = useState('');
  const [affectedIp, setAffectedIp] = useState('');
  const [primaryIoc, setPrimaryIoc] = useState('');
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateCase({
      title: title.trim(),
      description: description.trim() || '分析師手動立案之資安疑難事件。',
      severity,
      category,
      sourceEngine,
      affectedAssets: affectedHost ? [
        {
          id: `ast-${Date.now()}`,
          name: affectedHost.trim(),
          type: 'Endpoint',
          ip: affectedIp.trim() || '192.168.1.100',
          status: 'At Risk',
          os: 'Windows 11 Pro'
        }
      ] : [],
      observables: primaryIoc ? [
        {
          id: `obs-${Date.now()}`,
          type: primaryIoc.includes('.') && !primaryIoc.includes('/') ? 'IP' : 'Domain',
          value: primaryIoc.trim(),
          reputation: 'Suspicious',
          score: 85,
          hits: 1,
          source: 'Manual Analyst Input'
        }
      ] : [],
      tags: tagInput ? tagInput.split(',').map(t => t.trim()) : ['Manual-Reported']
    });

    // Reset form
    setTitle('');
    setDescription('');
    setAffectedHost('');
    setAffectedIp('');
    setPrimaryIoc('');
    setTagInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#16161c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">建立或通報新資安案件</h3>
              <p className="text-xs text-gray-400">手動建立高優先級調查案或由外部通報轉入</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              案件主旨 / 事件標題 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如: 核心財務伺服器偵測到異常勒索加密行為..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Severity & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                嚴重程度 (Severity)
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as CaseSeverity)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Critical">Critical (極高危 - P1)</option>
                <option value="High">High (高危 - P2)</option>
                <option value="Medium">Medium (中危 - P3)</option>
                <option value="Low">Low (低危 - P4)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                威脅類型 (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CaseCategory)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Ransomware">勒索軟體 (Ransomware)</option>
                <option value="APT C2">APT 外部 C2 (APT C2)</option>
                <option value="Privilege Escalation">特權提升 (Privilege Escalation)</option>
                <option value="Data Exfiltration">機密外洩 (Data Exfiltration)</option>
                <option value="Phishing">釣魚詐欺 (Phishing)</option>
                <option value="DDoS">分散式阻斷服務 (DDoS)</option>
              </select>
            </div>
          </div>

          {/* Source Engine */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              遙測進線來源 (Source Engine)
            </label>
            <input
              type="text"
              value={sourceEngine}
              onChange={(e) => setSourceEngine(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              事態描述與初步取證備註
            </label>
            <textarea
              rows={3}
              placeholder="詳細描述發現經過、告警規則觸發時間與已採取之措施..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          {/* Asset & IoC Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                首要受害主機 (Hostname)
              </label>
              <input
                type="text"
                placeholder="例如: SRV-FIN-01"
                value={affectedHost}
                onChange={(e) => setAffectedHost(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                受害主機 IP 位址
              </label>
              <input
                type="text"
                placeholder="例如: 10.240.10.5"
                value={affectedIp}
                onChange={(e) => setAffectedIp(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Primary IoC */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              初始關鍵 IoC 特徵 (IP / Domain / Hash)
            </label>
            <input
              type="text"
              placeholder="例如: 185.199.110.153 或 maldomain.xyz"
              value={primaryIoc}
              onChange={(e) => setPrimaryIoc(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              自訂分類標籤 (以逗號分隔)
            </label>
            <input
              type="text"
              placeholder="例如: Locky, Pass-the-Hash, DC-Impact"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              確認立案並啟動 SLA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

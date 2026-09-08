import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Ban, Lock, Globe, Terminal, RefreshCw } from 'lucide-react';
import { CaseIncident } from './types';
import { cn } from '../../lib/utils';

interface CaseActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CaseIncident | null;
  actionType: string;
  onConfirmAction: (actionType: string, note: string) => void;
}

export const CaseActionConfirmModal: React.FC<CaseActionConfirmModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  actionType,
  onConfirmAction
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [note, setNote] = useState('');

  if (!isOpen || !caseItem) return null;

  const ACTION_CONFIGS: Record<string, { title: string; desc: string; icon: any; targetText: string; color: string }> = {
    quarantine: {
      title: '主機網路層級微隔離 (EDR Host Isolation)',
      desc: '此動作將透過 SentinelOne / Wazuh Agent 中斷該主機對內外網之所有 TCP/UDP 流量，僅保留 8443 遙測管理埠，可能造成該主機業務暫時中斷。',
      icon: Ban,
      targetText: caseItem.affectedAssets.length > 0 ? caseItem.affectedAssets[0].name : '主要受害主機',
      color: 'text-red-400'
    },
    block_ip: {
      title: '周邊防火牆 IP 全域阻斷 (Perimeter IP Drop)',
      desc: '自動向邊界 Palo Alto / Fortinet 防火牆派發 ACL 規則，全域丟棄此 IP 之任何連線請求。',
      icon: Globe,
      targetText: caseItem.observables.length > 0 ? caseItem.observables[0].value : '外部惡意 C2 IP',
      color: 'text-purple-400'
    },
    revoke_token: {
      title: '強制作廢 Session 與重設 Kerberos (Revoke Credentials)',
      desc: '作廢 Active Directory / Okta SSO 臨時 Token 並強制登出所有活躍連線，防止特權帳號繼續在內網橫向移動。',
      icon: Lock,
      targetText: caseItem.affectedUsers.length > 0 ? caseItem.affectedUsers[0].username : '受影響使用者',
      color: 'text-amber-400'
    },
    memory_dump: {
      title: 'Velociraptor 記憶體鑑識傾印 (Memory Forensics)',
      desc: '下發 LiME/WinPmem 取證腳本傾印主機記憶體，並安全加密傳送至鑑識冷庫。',
      icon: Terminal,
      targetText: caseItem.affectedAssets.length > 0 ? caseItem.affectedAssets[0].name : '目標主機',
      color: 'text-emerald-400'
    }
  };

  const config = ACTION_CONFIGS[actionType] || {
    title: '執行安全應變動作',
    desc: '即時呼叫自動化 SOAR 劇本進行風險圍堵。',
    icon: AlertTriangle,
    targetText: caseItem.caseNumber,
    color: 'text-purple-400'
  };

  const Icon = config.icon;

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      onConfirmAction(actionType, note);
      setConfirmed(false);
      setNote('');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#16161c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">確認執行高風險應變動作</h3>
              <p className="text-xs text-gray-400">雙人核准機制 (Four-Eyes Principle) 安全防護</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-2">
            <h4 className="text-xs font-black text-red-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {config.title}
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {config.desc}
            </p>
            <div className="text-xs font-mono pt-2 border-t border-red-500/20 text-red-200">
              處置目標: <strong className="text-white">{config.targetText}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              分析師處置備註 (將寫入案件稽核紀錄)
            </label>
            <input
              type="text"
              placeholder="例如: 經確認橫向擴散跡象，啟動 P1 緊急微隔離..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 bg-gray-900/60 border border-gray-800 rounded-xl cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-gray-700 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-300 leading-relaxed">
              我已知悉此項處置之潛在業務衝擊，且已獲得緊急資安事態處置授權。
            </span>
          </label>

          {/* Buttons */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={executing}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              disabled={!confirmed || executing}
              onClick={handleExecute}
              className={cn(
                "px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {executing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  指令下發執行中...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  確認下發處置指令
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

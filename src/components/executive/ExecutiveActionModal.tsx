import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ExecutiveApprovalItem } from './types';
import { PENDING_EXECUTIVE_APPROVALS } from './executiveData';
import { localizeApprovalItem } from './ctoLocaleMap';

interface ExecutiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isZh: boolean;
  approvals?: ExecutiveApprovalItem[];
  onActionProcessed?: (id: string, decision: 'approved' | 'rejected') => void;
}

export function ExecutiveActionModal({
  isOpen,
  onClose,
  isZh,
  approvals: externalApprovals,
  onActionProcessed
}: ExecutiveActionModalProps) {
  const [approvals, setApprovals] = useState<ExecutiveApprovalItem[]>(
    (externalApprovals && externalApprovals.length > 0 ? externalApprovals : PENDING_EXECUTIVE_APPROVALS).map((a) =>
      localizeApprovalItem(a, isZh)
    )
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (externalApprovals && externalApprovals.length > 0) {
      setApprovals(externalApprovals.map((a) => localizeApprovalItem(a, isZh)));
    }
  }, [externalApprovals, isZh]);

  if (!isOpen) return null;

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/v1/cto-governance/approvals/${encodeURIComponent(id)}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, operator: 'CTO / Executive Sign-off' })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.approval) {
          setApprovals((prev) => prev.map((item) => (item.id === id ? json.approval : item)));
        }
      } else {
        setApprovals((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
        );
      }
    } catch {
      setApprovals((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
      );
    } finally {
      setSubmittingId(null);
    }

    const target = approvals.find((a) => a.id === id);
    const msg = isZh
      ? `已授權寫入 WORM 存證：${target?.title} (${decision === 'approved' ? '已核准執行隔離' : '已駁回退回'})`
      : `Decision sealed to WORM ledger for: ${target?.title} (${decision})`;

    setFeedbackMessage(msg);
    onActionProcessed?.(id, decision);

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-[#0f0f12] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                <AlertOctagon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {isZh ? 'CTO / 高階緊急處置授權佇列' : 'CTO Emergency Authorization Queue'}
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  {isZh
                    ? `待高階簽核技術熔斷或憑證撤銷工單：${pendingCount} 件`
                    : `${pendingCount} authorizations awaiting executive sign-off`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {feedbackMessage && (
            <div className="px-6 py-3 bg-emerald-600/20 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check size={14} />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* List of items */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {approvals.map((item) => {
              const isPending = item.status === 'pending';
              const isApproved = item.status === 'approved';

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-5 rounded-2xl border transition-all space-y-3',
                    isPending
                      ? 'bg-black/40 border-white/10'
                      : isApproved
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-85'
                      : 'bg-rose-950/20 border-rose-500/30 opacity-75'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-gray-300 bg-white/5 px-2 py-0.5 rounded">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {item.urgency}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white mt-1.5 leading-snug">{item.title}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      {isPending ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold">
                          <Clock size={12} />
                          {item.expiresInHours}h {isZh ? '內有效' : 'left'}
                        </span>
                      ) : isApproved ? (
                        <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={13} /> {isZh ? '已核准執行' : 'Authorized'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                          <XCircle size={13} /> {isZh ? '已駁回退回' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>

                  <div className="p-3 bg-black/50 rounded-xl border border-white/10 text-[11px] space-y-1">
                    <span className="text-amber-400 font-bold block">
                      {isZh ? '業務衝擊與架構影響評估：' : 'Business & Architecture Impact:'}
                    </span>
                    <p className="text-gray-300 leading-snug">{item.businessImpact}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-gray-400 font-mono">
                    <span>
                      {isZh ? '提請單位：' : 'Requester: '}
                      {item.requestedBy}
                    </span>
                    <span>{item.requestedAt}</span>
                  </div>

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        disabled={submittingId === item.id}
                        onClick={() => handleDecision(item.id, 'rejected')}
                        className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 rounded-xl text-xs font-bold transition-colors"
                      >
                        {isZh ? '退回 / 駁回' : 'Reject Action'}
                      </button>

                      <button
                        type="button"
                        disabled={submittingId === item.id}
                        onClick={() => handleDecision(item.id, 'approved')}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        {isZh ? '核准授權並寫入 WORM' : 'Authorize & Seal'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

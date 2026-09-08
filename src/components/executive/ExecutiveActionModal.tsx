import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Building,
  User,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ExecutiveApprovalItem } from './types';
import { PENDING_EXECUTIVE_APPROVALS } from './executiveData';

interface ExecutiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isZh: boolean;
  onActionProcessed?: (id: string, decision: 'approved' | 'rejected') => void;
}

export function ExecutiveActionModal({
  isOpen,
  onClose,
  isZh,
  onActionProcessed
}: ExecutiveActionModalProps) {
  const [approvals, setApprovals] = useState<ExecutiveApprovalItem[]>(PENDING_EXECUTIVE_APPROVALS);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    setApprovals(prev =>
      prev.map(item => (item.id === id ? { ...item, status: decision } : item))
    );

    const target = approvals.find(a => a.id === id);
    const msg = isZh
      ? `已成功授權執行決策：${target?.title} (${decision === 'approved' ? '已核准發布' : '已駁回退回'})`
      : `Decision recorded for: ${target?.title} (${decision})`;

    setFeedbackMessage(msg);
    onActionProcessed?.(id, decision);

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0f0f12] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                <AlertOctagon size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {isZh ? '高階主管緊急處置授權佇列 (Executive Authorization Queue)' : 'Executive Emergency Authorization Queue'}
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  {isZh ? `目前待核准高管權限工單：${pendingCount} 件` : `${pendingCount} approvals pending executive sign-off`}
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

          {/* Toast feedback */}
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-3 bg-emerald-600/20 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2"
            >
              <Check size={14} />
              <span>{feedbackMessage}</span>
            </motion.div>
          )}

          {/* List of items */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {approvals.map((item) => {
              const isPending = item.status === 'pending';
              const isApproved = item.status === 'approved';
              const isRejected = item.status === 'rejected';

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all space-y-3",
                    isPending
                      ? "bg-black/40 border-white/10"
                      : isApproved
                      ? "bg-emerald-950/20 border-emerald-500/30 opacity-75"
                      : "bg-rose-950/20 border-rose-500/30 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {item.category}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {item.urgency}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white mt-1.5 leading-snug">
                        {item.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      {isPending ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold">
                          <Clock size={12} />
                          {item.expiresInHours}h {isZh ? '剩餘有效' : 'remaining'}
                        </span>
                      ) : isApproved ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={13} /> {isZh ? '已核准執行' : 'Authorized'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                          <XCircle size={13} /> {isZh ? '已駁回退回' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="p-3 bg-black/60 rounded-xl border border-white/5 text-[11px] space-y-1">
                    <span className="text-amber-400 font-bold block">
                      {isZh ? '營運影響與業務風險評估：' : 'Business Impact Assessment:'}
                    </span>
                    <p className="text-gray-400 leading-snug">
                      {item.businessImpact}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500 font-mono">
                    <span>{isZh ? '提請者：' : 'Requester: '} {item.requestedBy}</span>
                    <span>{item.requestedAt}</span>
                  </div>

                  {/* Actions buttons */}
                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleDecision(item.id, 'rejected')}
                        className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 rounded-xl text-xs font-bold transition-all"
                      >
                        {isZh ? '退回 / 駁回' : 'Reject Action'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision(item.id, 'approved')}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/25 active:scale-95"
                      >
                        {isZh ? '高階授權並啟動處置' : 'Authorize & Execute'}
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

import React, { useState } from 'react';
import { RemediationTask, Severity, FrameworkId } from './types';
import { cn } from '../../lib/utils';
import {
  AlertTriangle, CheckCircle2, Clock, Play, UserCheck, ShieldAlert,
  Search, Filter, HardDrive, Check, ExternalLink, ArrowRight
} from 'lucide-react';

interface ComplianceGapRemediationProps {
  tasks: RemediationTask[];
  isZh: boolean;
  onRunAction?: (task: RemediationTask) => void;
}

export const ComplianceGapRemediation: React.FC<ComplianceGapRemediationProps> = ({
  tasks: initialTasks,
  isZh,
  onRunAction
}) => {
  const [tasks, setTasks] = useState<RemediationTask[]>(initialTasks);
  const [filterFramework, setFilterFramework] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleResolve = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'Resolved' } : t))
    );
    const notice = isZh
      ? `工單 ${taskId} 已標記為處置完成，將於下次 WORM 週期進行自動重測核實。`
      : `Task ${taskId} marked as resolved. Automated verification will occur on next audit cycle.`;
    setActionNotice(notice);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRunPlaybook = (task: RemediationTask) => {
    if (onRunAction) {
      onRunAction(task);
    }
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: 'In-Progress' } : t))
    );
    const notice = isZh
      ? `已執行修復劇本 [${task.playbookId || '自動化修補'}] 針對資產 ${task.affectedAsset}`
      : `Executed playbook [${task.playbookId || 'Auto-Patch'}] for asset ${task.affectedAsset}`;
    setActionNotice(notice);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredTasks = tasks.filter(task => {
    if (filterFramework !== 'ALL' && task.framework !== filterFramework) return false;
    if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q) ||
        task.assignedTo.toLowerCase().includes(q) ||
        task.affectedAsset.toLowerCase().includes(q) ||
        task.controlId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
  const inProgressCount = tasks.filter(t => t.status === 'In-Progress').length;
  const resolvedCount = tasks.filter(t => t.status === 'Resolved').length;

  const getPriorityBadge = (priority: Severity) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            High
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Medium
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center justify-between shadow-lg shadow-blue-500/5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-gray-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
            {isZh ? '待改善缺陷總數' : 'Total CAPA Tasks'}
          </span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{tasks.length}</span>
          <span className="text-[10px] text-gray-400 mt-1 block">
            {isZh ? '跨 6 大標準稽核發現' : 'Across all 6 standards'}
          </span>
        </div>

        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
            {isZh ? '高危緊急缺陷' : 'Critical Deficiencies'}
          </span>
          <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">{criticalCount}</span>
          <span className="text-[10px] text-rose-500/80 mt-1 block">
            {isZh ? '需在 24 小時內處置' : 'Requires 24h SLA'}
          </span>
        </div>

        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
            {isZh ? '修復中 (In Progress)' : 'In Progress'}
          </span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{inProgressCount}</span>
          <span className="text-[10px] text-amber-500/80 mt-1 block">
            {isZh ? '已綁定自動化劇本' : 'Playbooks triggered'}
          </span>
        </div>

        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
            {isZh ? '已改善核實 (Resolved)' : 'Resolved & Closed'}
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{resolvedCount}</span>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">
            {isZh ? '符合持續合規標準' : 'Verified compliant'}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-[#111114] border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isZh ? '搜尋改善單號、負責工程師、標的資產...' : 'Search task ID, owner, asset...'}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Framework Filter */}
          <select
            value={filterFramework}
            onChange={e => setFilterFramework(e.target.value)}
            className="bg-white/5 border border-white/10 text-xs text-gray-300 rounded-xl px-3 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="ALL" className="bg-[#18181c] text-white">{isZh ? '所有標準 (全部)' : 'All Frameworks'}</option>
            <option value="ISO27001" className="bg-[#18181c] text-white">ISO 27001</option>
            <option value="GDPR" className="bg-[#18181c] text-white">GDPR</option>
            <option value="NIST-800" className="bg-[#18181c] text-white">NIST 800-53</option>
            <option value="TSC" className="bg-[#18181c] text-white">SOC 2 (TSC)</option>
            <option value="HIPAA" className="bg-[#18181c] text-white">HIPAA</option>
            <option value="PCI-DSS" className="bg-[#18181c] text-white">PCI DSS</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-white/5 border border-white/10 text-xs text-gray-300 rounded-xl px-3 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="ALL" className="bg-[#18181c] text-white">{isZh ? '所有優先級' : 'All Priorities'}</option>
            <option value="Critical" className="bg-[#18181c] text-white">Critical</option>
            <option value="High" className="bg-[#18181c] text-white">High</option>
            <option value="Medium" className="bg-[#18181c] text-white">Medium</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const isResolved = task.status === 'Resolved';

          return (
            <div
              key={task.id}
              className={cn(
                "p-5 rounded-2xl border transition-all duration-200",
                isResolved
                  ? "bg-white/[0.01] border-white/5 opacity-60"
                  : "bg-[#111114] border-white/5 hover:border-white/15 shadow-lg"
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Task Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded">
                      {task.id}
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-400 px-2 py-0.5 bg-white/5 rounded">
                      {task.framework} ({task.controlId})
                    </span>
                    {getPriorityBadge(task.priority)}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : task.status === 'In-Progress'
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      )}
                    >
                      {task.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {task.title}
                  </h4>

                  <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-500 font-bold mr-1">
                      {isZh ? '改善行動策略:' : 'Action:'}
                    </span>
                    {task.remediationAction}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-500 font-mono pt-1">
                    <span className="flex items-center gap-1 text-gray-400">
                      <UserCheck size={12} className="text-blue-400" /> {task.assignedTo}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <HardDrive size={12} className="text-purple-400" /> {task.affectedAsset}
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <Clock size={12} /> {task.deadline}
                    </span>
                  </div>
                </div>

                {/* Task Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
                  {!isResolved && (
                    <>
                      {task.playbookId && (
                        <button
                          type="button"
                          onClick={() => handleRunPlaybook(task)}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>{isZh ? `執行劇本 (${task.playbookId})` : `Run ${task.playbookId}`}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleResolve(task.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-emerald-500/20"
                      >
                        <Check size={13} />
                        <span>{isZh ? '標記為已改善' : 'Mark Resolved'}</span>
                      </button>
                    </>
                  )}

                  {isResolved && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold py-2">
                      <CheckCircle2 size={14} />
                      <span>{isZh ? '已完成並通過驗證' : 'Verified Closed'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

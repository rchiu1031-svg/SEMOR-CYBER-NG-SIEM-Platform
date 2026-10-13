import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  AlertTriangle, 
  Layers, 
  Filter, 
  Kanban, 
  ListFilter, 
  ExternalLink, 
  Flame, 
  Server, 
  Lock, 
  Shield, 
  MoreHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CaseIncident, CaseSeverity, CaseStatus } from './types';

interface CaseListViewProps {
  cases: CaseIncident[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onQuickStatusChange: (caseId: string, newStatus: CaseStatus) => void;
  onOpenActionModal: (caseItem: CaseIncident, actionType: string) => void;
}

const SEVERITY_BADGES: Record<CaseSeverity, { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500 animate-pulse' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  Low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  Informational: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-500' }
};

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string }> = {
  New: { label: '新進通報', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  Investigating: { label: '深入調查中', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  'Awaiting Approval': { label: '等待主管核准', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  'In Remediation': { label: '執行處置遏阻', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  Closed: { label: '已完成結案', color: 'bg-gray-800 text-gray-400 border-gray-700' },
  'False Positive': { label: '誤報排除', color: 'bg-gray-900 text-gray-500 border-gray-800' }
};

export const CaseListView: React.FC<CaseListViewProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onQuickStatusChange,
  onOpenActionModal
}) => {
  const [viewLayout, setViewLayout] = useState<'table' | 'kanban'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toggle selection
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === cases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cases.map(c => c.id));
    }
  };

  const KANBAN_COLUMNS: { status: CaseStatus; title: string; color: string }[] = [
    { status: 'New', title: '新進分流 (New)', color: 'border-blue-500/40 text-blue-400' },
    { status: 'Investigating', title: '調查取證 (Investigating)', color: 'border-purple-500/40 text-purple-400' },
    { status: 'Awaiting Approval', title: '等待核准 (Awaiting Approval)', color: 'border-amber-500/40 text-amber-400' },
    { status: 'In Remediation', title: '應變遏阻 (Remediation)', color: 'border-emerald-500/40 text-emerald-400' },
    { status: 'Closed', title: '歸檔結案 (Closed)', color: 'border-gray-700 text-gray-400' }
  ];

  return (
    <div className="space-y-4">
      {/* Table / Kanban Switcher & Selection Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex bg-[#121216] border border-gray-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewLayout('table')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all",
                viewLayout === 'table' ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-gray-400 hover:text-white"
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
              清單列表 (Table)
            </button>
            <button
              onClick={() => setViewLayout('kanban')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all",
                viewLayout === 'kanban' ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-gray-400 hover:text-white"
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
              看板流程 (Kanban)
            </button>
          </div>

          <span className="text-xs text-gray-400">
            共 <strong className="text-white">{cases.length}</strong> 筆案件
          </span>
        </div>

        {/* Batch Operations */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-xl animate-in fade-in duration-200">
            <span className="text-xs text-purple-300 font-bold">
              已選取 {selectedIds.length} 個案件
            </span>
            <div className="h-4 w-px bg-purple-500/30" />
            <button
              onClick={() => {
                selectedIds.forEach(id => onQuickStatusChange(id, 'In Remediation'));
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold"
            >
              批次轉為處置中
            </button>
            <button
              onClick={() => {
                selectedIds.forEach(id => onQuickStatusChange(id, 'Closed'));
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[11px] font-bold"
            >
              批次結案
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-gray-400 hover:text-white ml-1"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* TABLE VIEW */}
      {viewLayout === 'table' ? (
        <div className="bg-[#111114] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-[#15151a] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-white">
                      {selectedIds.length === cases.length && cases.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">案件編號 / 主旨</th>
                  <th className="py-3.5 px-4">嚴重度</th>
                  <th className="py-3.5 px-4">狀態</th>
                  <th className="py-3.5 px-4">SLA 剩餘時間</th>
                  <th className="py-3.5 px-4">關聯資產 / 身分</th>
                  <th className="py-3.5 px-4">負責分析師</th>
                  <th className="py-3.5 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80 text-xs">
                {cases.map((caseItem) => {
                  const isSelected = selectedCaseId === caseItem.id;
                  const isChecked = selectedIds.includes(caseItem.id);
                  const sevStyle = SEVERITY_BADGES[caseItem.severity];
                  const statusStyle = STATUS_CONFIG[caseItem.status];

                  return (
                    <tr
                      key={caseItem.id}
                      onClick={() => onSelectCase(caseItem.id)}
                      className={cn(
                        "group transition-colors cursor-pointer",
                        isSelected 
                          ? "bg-purple-900/15 hover:bg-purple-900/20" 
                          : "hover:bg-gray-800/40"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => handleToggleSelect(caseItem.id, e)}>
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                        )}
                      </td>

                      {/* Title + Case Number */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-purple-400 font-bold text-xs">
                            {caseItem.caseNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                            {caseItem.category}
                          </span>
                        </div>
                        <p className="text-white font-bold mt-1 group-hover:text-purple-300 transition-colors line-clamp-1">
                          {caseItem.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-mono">
                          <span>來源: {caseItem.sourceEngine}</span>
                          <span>•</span>
                          <span>建立於 {caseItem.createdAt.split(' ')[1]}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider",
                          sevStyle.bg, sevStyle.text, sevStyle.border
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sevStyle.dot)} />
                          {caseItem.severity}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-bold border",
                          statusStyle.color
                        )}>
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* SLA Progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-lg",
                            caseItem.sla.remainingMinutes <= 20 ? "bg-red-500/10 text-red-400 animate-pulse" : "bg-gray-800 text-purple-400"
                          )}>
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className={cn(
                              "font-bold text-xs",
                              caseItem.sla.remainingMinutes <= 20 ? "text-red-400" : "text-gray-200"
                            )}>
                              {caseItem.status === 'Closed' ? '已達標結案' : `倒數 ${caseItem.sla.remainingMinutes} 分鐘`}
                            </span>
                            <span className="block text-[10px] text-gray-500">
                              階段: {caseItem.sla.stage}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Affected Assets & Users */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-300 font-mono flex items-center gap-1">
                            <Server className="w-3 h-3 text-blue-400" />
                            {caseItem.affectedAssets.length > 0 
                              ? `${caseItem.affectedAssets[0].name}${caseItem.affectedAssets.length > 1 ? ` (+${caseItem.affectedAssets.length - 1})` : ''}` 
                              : '無直接資產'}
                          </span>
                          {caseItem.affectedUsers.length > 0 && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-purple-400" />
                              {caseItem.affectedUsers[0].username}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white", caseItem.assignee.avatarBg)}>
                            {caseItem.assignee.name.substring(0, 1)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{caseItem.assignee.name}</p>
                            <p className="text-[10px] text-gray-500">{caseItem.assignee.role.split(' ')[0]}</p>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenActionModal(caseItem, 'quarantine');
                            }}
                            className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            隔離處置
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCase(caseItem.id);
                            }}
                            className="p-1.5 bg-gray-800 hover:bg-purple-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                            title="開啟調查戰情室"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {cases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldAlert className="w-9 h-9 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-400">目前尚無調查案件 (No Active Cases)</span>
                        <span className="text-xs text-gray-600">系統關聯引擎偵測到高危事件或管理員手動立案時，將即時呈現於此</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const colCases = cases.filter(c => c.status === col.status);

            return (
              <div key={col.status} className="bg-[#111114] border border-gray-800 rounded-2xl p-3 flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-black", col.color)}>
                      {col.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                    {colCases.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                  {colCases.map((caseItem) => {
                    const isSelected = selectedCaseId === caseItem.id;
                    const sevStyle = SEVERITY_BADGES[caseItem.severity];

                    return (
                      <div
                        key={caseItem.id}
                        onClick={() => onSelectCase(caseItem.id)}
                        className={cn(
                          "p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5",
                          isSelected 
                            ? "bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-600/10" 
                            : "bg-[#15151a] border-gray-800 hover:border-gray-700 hover:bg-[#18181f]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-purple-400">
                            {caseItem.caseNumber}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-tight",
                            sevStyle.bg, sevStyle.text, sevStyle.border
                          )}>
                            {caseItem.severity}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                          {caseItem.title}
                        </h4>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400 border-t border-gray-800/60 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {caseItem.sla.remainingMinutes}m
                          </span>
                          <span>{caseItem.assignee.name.split(' ')[0]}</span>
                        </div>
                      </div>
                    );
                  })}

                  {colCases.length === 0 && (
                    <div className="h-32 flex items-center justify-center border border-dashed border-gray-800/60 rounded-xl text-xs text-gray-600">
                      尚無案件
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

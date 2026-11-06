import React, { useState } from 'react';
import {
  ShieldAlert,
  MoreVertical,
  Workflow,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CriticalIncidentRecord } from './types';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface OverviewCriticalIncidentsProps {
  incidents: CriticalIncidentRecord[];
  isZh: boolean;
  onOpenTopology: (incident: CriticalIncidentRecord) => void;
  onOpenSoar: (incident: CriticalIncidentRecord) => void;
  onNavigateIncidentsView: () => void;
}

export const OverviewCriticalIncidents: React.FC<OverviewCriticalIncidentsProps> = ({
  incidents,
  isZh,
  onOpenTopology,
  onOpenSoar,
  onNavigateIncidentsView
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'Critical' | 'High'>('ALL');
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.threatZh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.threatEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.srcIp.includes(searchTerm) ||
      inc.host.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || inc.risk === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const pagedIncidents = filteredIncidents.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden transition-colors",
      isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-[#111114] border border-red-900/30 shadow-xl shadow-red-950/5"
    )}>
      {/* Header */}
      <div className={cn(
        "p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors",
        isLight
          ? "border-slate-200 bg-gradient-to-r from-red-50/70 via-white to-transparent"
          : "border-gray-800 bg-gradient-to-r from-red-950/20 via-transparent to-transparent"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 border rounded-xl transition-colors",
            isLight ? "bg-red-50 border-red-200 text-red-600" : "bg-red-600/20 border-red-500/30 text-red-400"
          )}>
            <ShieldAlert size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={cn("text-base font-bold tracking-wide", isLight ? "text-slate-900" : "text-white")}>
                {isZh ? '重大資安事件即時分析與處置佇列' : 'Critical Incidents Triage & Response Queue'}
              </h2>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                isLight ? "bg-red-50 text-red-600 border-red-200" : "bg-red-500/20 text-red-400 border-red-500/30"
              )}>
                {incidents.length} {isZh ? '件重大事件' : 'Active'}
              </span>
            </div>
            <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
              {isZh
                ? '端點、網路與身分行為即時關聯告警，支援一鍵觸發 SOAR 劇本'
                : 'Real-time correlated multi-source threats with SOAR rapid containment'}
            </p>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Severity filter pills */}
          <div className={cn(
            "flex items-center p-1 rounded-lg border text-xs transition-colors",
            isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-gray-800"
          )}>
            {(['ALL', 'Critical', 'High'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold transition-all",
                  severityFilter === sev
                    ? isLight
                      ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-bold"
                      : "bg-gray-800 text-white border border-gray-700 font-bold"
                    : isLight
                      ? "text-slate-500 hover:text-slate-900"
                      : "text-gray-400 hover:text-gray-200"
                )}
              >
                {sev === 'ALL' ? (isZh ? '全部' : 'All') : sev === 'Critical' ? (isZh ? '嚴重' : 'Critical') : (isZh ? '高風險' : 'High')}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={13} className={cn("absolute left-3 top-2.5", isLight ? "text-slate-400" : "text-gray-500")} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isZh ? '搜尋威脅或 IP...' : 'Search threat or IP...'}
              className={cn(
                "pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 w-44 transition-colors",
                isLight
                  ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400"
                  : "bg-black/40 border border-gray-800 text-gray-200 placeholder-gray-500"
              )}
            />
          </div>

          <button
            onClick={onNavigateIncidentsView}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
            )}
          >
            <span>{isZh ? '完整事件中心' : 'Full Reports'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Incident Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={cn(
              "text-[10px] font-bold uppercase tracking-wider border-b",
              isLight ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-gray-900/40 text-gray-400 border-gray-800"
            )}>
              <th className="px-5 py-3.5">{isZh ? '事件代號 / 時間' : 'ID / Time'}</th>
              <th className="px-5 py-3.5">{isZh ? '威脅行為與分類' : 'Threat Category'}</th>
              <th className="px-5 py-3.5">{isZh ? '來源 / 受害資產' : 'Source & Victim'}</th>
              <th className="px-5 py-3.5">{isZh ? 'MITRE 戰術 / SOAR 狀態' : 'MITRE / SOAR'}</th>
              <th className="px-5 py-3.5">{isZh ? '風險等級' : 'Risk Level'}</th>
              <th className="px-5 py-3.5 text-right">{isZh ? '動作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y", isLight ? "divide-slate-200" : "divide-gray-800/60")}>
            {pagedIncidents.map((incident, idx) => (
              <tr
                key={incident.id}
                className={cn("transition-colors group", isLight ? "hover:bg-slate-50/80" : "hover:bg-red-500/[0.03]")}
              >
                {/* ID and Time */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={cn("text-xs font-bold font-mono", isLight ? "text-blue-600" : "text-blue-400")}>
                      {incident.id}
                    </span>
                    <span className={cn("text-[11px] font-mono", isLight ? "text-slate-500" : "text-gray-400")}>
                      {incident.time}
                    </span>
                    {incident.logCategory && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border tracking-wider w-fit mt-0.5",
                        incident.logCategory === 'SYS_LOG'
                          ? isLight ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-blue-950/40 text-blue-400 border-blue-500/30" :
                        incident.logCategory === 'EVENT_LOG'
                          ? isLight ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-purple-950/40 text-purple-400 border-purple-500/30" :
                          isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      )}>
                        {incident.logCategory === 'SYS_LOG' ? 'SYS' : incident.logCategory === 'EVENT_LOG' ? 'EVENT' : 'FLOW'}
                        {incident.logFormat ? ` · ${incident.logFormat}` : ''}
                        {incident.eventId ? ` #${incident.eventId}` : ''}
                      </span>
                    )}
                  </div>
                </td>

                {/* Threat description */}
                <td className="px-5 py-4">
                  <div className="flex flex-col max-w-sm">
                    <span className={cn("text-xs font-bold transition-colors", isLight ? "text-slate-900 group-hover:text-blue-600" : "text-gray-100 group-hover:text-blue-300")}>
                      {isZh ? incident.threatZh : incident.threatEn}
                    </span>
                    <span className={cn("text-[11px] mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                      {isZh ? incident.categoryZh : incident.categoryEn}
                    </span>
                  </div>
                </td>

                {/* Source & Victim */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className={cn("font-bold", isLight ? "text-red-600" : "text-red-400")}>{incident.srcIp}</span>
                      <span className={isLight ? "text-slate-400" : "text-gray-600"}>➔</span>
                      <span className={isLight ? "text-slate-800" : "text-gray-200"}>{incident.host}</span>
                    </div>
                    <span className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-gray-500")}>
                      {isZh ? incident.countryZh : incident.countryEn}
                    </span>
                  </div>
                </td>

                {/* MITRE Tactic and SOAR status */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={cn("text-[10px] font-mono font-bold", isLight ? "text-purple-700" : "text-purple-300")}>
                      {incident.mitreTactic}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className={cn("text-[10px] font-medium", isLight ? "text-emerald-700" : "text-emerald-400")}>
                        {incident.soarStatus}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Risk badge */}
                <td className="px-5 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono inline-block",
                    incident.risk === 'Critical'
                      ? isLight ? "bg-red-50 text-red-600 border-red-200" : "bg-red-500/20 text-red-400 border-red-500/40"
                      : isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  )}>
                    {incident.risk}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right relative">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenTopology(incident)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border",
                        isLight
                          ? "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border-purple-500/30"
                      )}
                      title={isZh ? '開啟攻擊拓撲圖' : 'Open Attack Topology'}
                    >
                      <Workflow size={12} />
                      <span className="hidden lg:inline">{isZh ? '拓撲圖' : 'Graph'}</span>
                    </button>

                    <button
                      onClick={() => onOpenSoar(incident)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border",
                        isLight
                          ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                          : "bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30"
                      )}
                      title={isZh ? '執行 SOAR 阻斷' : 'Execute SOAR Containment'}
                    >
                      <ShieldCheck size={12} />
                      <span className="hidden lg:inline">{isZh ? '處置' : 'SOAR'}</span>
                    </button>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownIdx(openDropdownIdx === idx ? null : idx);
                        }}
                        className={cn(
                          "p-1.5 rounded-lg border transition-all",
                          isLight
                            ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                            : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                        )}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openDropdownIdx === idx && (
                        <div className={cn(
                          "absolute right-0 top-9 w-48 rounded-xl shadow-2xl z-50 py-1 text-left border",
                          isLight ? "bg-white border-slate-200 text-slate-800" : "bg-[#1a1a1e] border-gray-700"
                        )}>
                          <button
                            onClick={() => {
                              onOpenTopology(incident);
                              setOpenDropdownIdx(null);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-xs flex items-center gap-2",
                              isLight ? "text-slate-700 hover:bg-slate-50" : "text-gray-300 hover:bg-white/5"
                            )}
                          >
                            <Workflow size={13} className={isLight ? "text-purple-600" : "text-purple-400"} />
                            <span>{isZh ? '詳細攻擊鏈圖譜' : 'Attack Path Graph'}</span>
                          </button>
                          <button
                            onClick={() => {
                              onOpenSoar(incident);
                              setOpenDropdownIdx(null);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-xs flex items-center gap-2",
                              isLight ? "text-red-600 hover:bg-red-50" : "text-red-400 hover:bg-red-500/10"
                            )}
                          >
                            <ShieldCheck size={13} />
                            <span>{isZh ? '啟動端點網路隔離' : 'Isolate Endpoint'}</span>
                          </button>
                          <div className={cn("h-px my-1", isLight ? "bg-slate-100" : "bg-gray-800")} />
                          <button
                            onClick={() => {
                              onNavigateIncidentsView();
                              setOpenDropdownIdx(null);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-xs flex items-center gap-2",
                              isLight ? "text-blue-600 hover:bg-blue-50" : "text-blue-400 hover:bg-white/5"
                            )}
                          >
                            <ExternalLink size={13} />
                            <span>{isZh ? '前往資安事件管理' : 'Go to IR Center'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className={cn(
        "p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors",
        isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-gray-800/80 bg-black/40 text-gray-400"
      )}>
        <div className="flex items-center gap-2">
          <span>
            {isZh
              ? `共 ${filteredIncidents.length} 筆重大事件 (顯示第 ${(validCurrentPage - 1) * pageSize + 1}-${Math.min(validCurrentPage * pageSize, filteredIncidents.length)} 筆)`
              : `Showing ${(validCurrentPage - 1) * pageSize + 1}-${Math.min(validCurrentPage * pageSize, filteredIncidents.length)} of ${filteredIncidents.length} critical incidents`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Page size toggle */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={isLight ? "text-slate-500" : "text-gray-500"}>{isZh ? '每頁顯示：' : 'Page size:'}</span>
            {[10, 20].map((sz) => (
              <button
                key={sz}
                onClick={() => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-2 py-0.5 rounded transition-all",
                  pageSize === sz
                    ? isLight
                      ? "bg-white text-slate-900 font-bold border border-slate-200 shadow-xs"
                      : "bg-gray-800 text-white font-bold border border-gray-700"
                    : isLight
                      ? "text-slate-500 hover:text-slate-800"
                      : "text-gray-400 hover:text-gray-200"
                )}
              >
                {sz === 20 ? (isZh ? '20 (全部)' : '20 (All)') : sz}
              </button>
            ))}
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className={cn(
                  "p-1 rounded-md border transition-all disabled:opacity-30 disabled:pointer-events-none",
                  isLight
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-gray-900 border-gray-800 text-gray-300 hover:text-white"
                )}
                title={isZh ? '上一頁' : 'Previous page'}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-semibold transition-all",
                    validCurrentPage === pg
                      ? "bg-red-600 text-white font-bold shadow-md shadow-red-600/30"
                      : isLight
                        ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className={cn(
                  "p-1 rounded-md border transition-all disabled:opacity-30 disabled:pointer-events-none",
                  isLight
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-gray-900 border-gray-800 text-gray-300 hover:text-white"
                )}
                title={isZh ? '下一頁' : 'Next page'}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

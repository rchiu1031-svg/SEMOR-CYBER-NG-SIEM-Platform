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
  ArrowRight
} from 'lucide-react';
import { CriticalIncidentRecord } from './types';
import { cn } from '../../lib/utils';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'Critical' | 'High'>('ALL');
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.threatZh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.threatEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.srcIp.includes(searchTerm) ||
      inc.host.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || inc.risk === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="bg-[#111114] border border-red-900/30 rounded-2xl overflow-hidden shadow-xl shadow-red-950/5">
      {/* Header */}
      <div className="p-5 border-b border-gray-800 bg-gradient-to-r from-red-950/20 via-transparent to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400">
            <ShieldAlert size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                {isZh ? '重大資安事件即時分析與處置佇列' : 'Critical Incidents Triage & Response Queue'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                {incidents.length} {isZh ? '件重大事件' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isZh
                ? '端點、網路與身分行為即時關聯告警，支援一鍵觸發 SOAR 劇本'
                : 'Real-time correlated multi-source threats with SOAR rapid containment'}
            </p>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Severity filter pills */}
          <div className="flex items-center bg-black/40 p-1 rounded-lg border border-gray-800 text-xs">
            {(['ALL', 'Critical', 'High'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold transition-all",
                  severityFilter === sev
                    ? "bg-gray-800 text-white border border-gray-700 font-bold"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {sev === 'ALL' ? (isZh ? '全部' : 'All') : sev === 'Critical' ? (isZh ? '嚴重' : 'Critical') : (isZh ? '高風險' : 'High')}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isZh ? '搜尋威脅或 IP...' : 'Search threat or IP...'}
              className="pl-8 pr-3 py-1.5 bg-black/40 border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          <button
            onClick={onNavigateIncidentsView}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all"
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
            <tr className="bg-gray-900/40 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <th className="px-5 py-3.5">{isZh ? '事件代號 / 時間' : 'ID / Time'}</th>
              <th className="px-5 py-3.5">{isZh ? '威脅行為與分類' : 'Threat Category'}</th>
              <th className="px-5 py-3.5">{isZh ? '來源 / 受害資產' : 'Source & Victim'}</th>
              <th className="px-5 py-3.5">{isZh ? 'MITRE 戰術 / SOAR 狀態' : 'MITRE / SOAR'}</th>
              <th className="px-5 py-3.5">{isZh ? '風險等級' : 'Risk Level'}</th>
              <th className="px-5 py-3.5 text-right">{isZh ? '動作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filteredIncidents.map((incident, idx) => (
              <tr
                key={incident.id}
                className="hover:bg-red-500/[0.03] transition-colors group"
              >
                {/* ID and Time */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-400 font-mono">
                      {incident.id}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {incident.time}
                    </span>
                  </div>
                </td>

                {/* Threat description */}
                <td className="px-5 py-4">
                  <div className="flex flex-col max-w-sm">
                    <span className="text-xs font-bold text-gray-100 group-hover:text-blue-300 transition-colors">
                      {isZh ? incident.threatZh : incident.threatEn}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      {isZh ? incident.categoryZh : incident.categoryEn}
                    </span>
                  </div>
                </td>

                {/* Source & Victim */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-red-400 font-bold">{incident.srcIp}</span>
                      <span className="text-gray-600">➔</span>
                      <span className="text-gray-200">{incident.host}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {isZh ? incident.countryZh : incident.countryEn}
                    </span>
                  </div>
                </td>

                {/* MITRE Tactic and SOAR status */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      {incident.mitreTactic}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-[10px] text-emerald-400 font-medium">
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
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  )}>
                    {incident.risk}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right relative">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenTopology(incident)}
                      className="px-2.5 py-1 bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      title={isZh ? '開啟攻擊拓撲圖' : 'Open Attack Topology'}
                    >
                      <Workflow size={12} />
                      <span className="hidden lg:inline">{isZh ? '拓撲圖' : 'Graph'}</span>
                    </button>

                    <button
                      onClick={() => onOpenSoar(incident)}
                      className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
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
                        className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openDropdownIdx === idx && (
                        <div className="absolute right-0 top-9 w-48 bg-[#1a1a1e] border border-gray-700 rounded-xl shadow-2xl z-50 py-1 text-left">
                          <button
                            onClick={() => {
                              onOpenTopology(incident);
                              setOpenDropdownIdx(null);
                            }}
                            className="w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Workflow size={13} className="text-purple-400" />
                            <span>{isZh ? '詳細攻擊鏈圖譜' : 'Attack Path Graph'}</span>
                          </button>
                          <button
                            onClick={() => {
                              onOpenSoar(incident);
                              setOpenDropdownIdx(null);
                            }}
                            className="w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <ShieldCheck size={13} />
                            <span>{isZh ? '啟動端點網路隔離' : 'Isolate Endpoint'}</span>
                          </button>
                          <div className="h-px bg-gray-800 my-1" />
                          <button
                            onClick={() => {
                              onNavigateIncidentsView();
                              setOpenDropdownIdx(null);
                            }}
                            className="w-full px-3 py-2 text-xs text-blue-400 hover:bg-white/5 flex items-center gap-2"
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
    </div>
  );
};

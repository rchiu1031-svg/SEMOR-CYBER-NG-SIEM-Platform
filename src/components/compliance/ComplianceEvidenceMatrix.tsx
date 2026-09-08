import React, { useState, useMemo } from 'react';
import { ComplianceControl, ComplianceFrameworkMeta, ComplianceStatus } from './types';
import { cn } from '../../lib/utils';
import {
  Search, Filter, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Play, ExternalLink, HardDrive, Terminal,
  Cpu, Activity, Lock, Database, ArrowRight, RefreshCw, FileText
} from 'lucide-react';

interface ComplianceEvidenceMatrixProps {
  framework: ComplianceFrameworkMeta;
  controls: ComplianceControl[];
  isZh: boolean;
  onTriggerPlaybook?: (control: ComplianceControl) => void;
  onAssignRemediation?: (control: ComplianceControl) => void;
}

export const ComplianceEvidenceMatrix: React.FC<ComplianceEvidenceMatrixProps> = ({
  framework,
  controls,
  isZh,
  onTriggerPlaybook,
  onAssignRemediation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Available unique domains
  const domains = useMemo(() => {
    const set = new Set<string>();
    controls.forEach(c => set.add(c.domain));
    return Array.from(set);
  }, [controls]);

  // Filtered controls
  const filteredControls = useMemo(() => {
    return controls.filter(c => {
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
      if (selectedDomain !== 'ALL' && c.domain !== selectedDomain) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(query);
        const matchCode = c.code.toLowerCase().includes(query);
        const matchEvidence = c.evidence.toLowerCase().includes(query);
        const matchDomain = c.domain.toLowerCase().includes(query);
        const matchAssets = c.affectedAssets.some(a => a.toLowerCase().includes(query));
        return matchTitle || matchCode || matchEvidence || matchDomain || matchAssets;
      }
      return true;
    });
  }, [controls, selectedStatus, selectedDomain, searchQuery]);

  const handleTriggerSOAR = (control: ComplianceControl) => {
    if (onTriggerPlaybook) {
      onTriggerPlaybook(control);
    }
    const noticeText = isZh
      ? `已觸發 SOAR 自動化劇本 [${control.remediationPlaybook || '即時聯防處置'}] 針對控制項 ${control.code} 進行修復處置`
      : `Triggered SOAR Playbook [${control.remediationPlaybook || 'Auto-Defense'}] for control ${control.code}`;
    setActionNotice(noticeText);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const handleAssign = (control: ComplianceControl) => {
    if (onAssignRemediation) {
      onAssignRemediation(control);
    }
    const noticeText = isZh
      ? `已建立 CAPA 改善工單並指派專責工程師處理 ${control.code}`
      : `Created CAPA remediation task and assigned to security team for ${control.code}`;
    setActionNotice(noticeText);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'Compliant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={11} />
            {isZh ? '符合規範' : 'Compliant'}
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={11} />
            {isZh ? '偏離警告' : 'Warning'}
          </span>
        );
      case 'Violated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <ShieldAlert size={11} />
            {isZh ? '未達標違規' : 'Violated'}
          </span>
        );
      case 'Under-Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RefreshCw size={11} className="animate-spin" />
            {isZh ? '審查驗證中' : 'Under Review'}
          </span>
        );
      case 'Compensating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Lock size={11} />
            {isZh ? '補償控制' : 'Compensating'}
          </span>
        );
      default:
        return null;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'EDR/XDR':
        return <Activity size={12} className="text-blue-400" />;
      case 'UEBA':
        return <Cpu size={12} className="text-indigo-400" />;
      case 'WORM Storage':
        return <Database size={12} className="text-emerald-400" />;
      case 'NDR':
        return <Activity size={12} className="text-cyan-400" />;
      case 'FIM':
        return <Terminal size={12} className="text-rose-400" />;
      case 'DLP':
        return <Lock size={12} className="text-amber-400" />;
      default:
        return <HardDrive size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#111114] border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isZh ? '搜尋控制項編號、法規條款、舉證關鍵字或受測主機...' : 'Search control code, requirement, evidence, or asset...'}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-1 flex items-center gap-1">
            <Filter size={11} /> {isZh ? '狀態篩選' : 'Status'}:
          </span>
          {[
            { id: 'ALL', label: isZh ? '全部' : 'All' },
            { id: 'Compliant', label: isZh ? '符合規範' : 'Compliant' },
            { id: 'Warning', label: isZh ? '偏離警告' : 'Warning' },
            { id: 'Violated', label: isZh ? '違規未達標' : 'Violated' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedStatus(item.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                selectedStatus === item.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Domain Filter */}
        {domains.length > 1 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-white/5 border border-white/10 text-xs text-gray-300 rounded-xl px-3 py-1.5 outline-none focus:border-blue-500"
            >
              <option value="ALL" className="bg-[#18181c] text-white">
                {isZh ? '所有稽核維度 (全部)' : 'All Domains'}
              </option>
              {domains.map((dom) => (
                <option key={dom} value={dom} className="bg-[#18181c] text-white">
                  {dom}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Control Evidence Table */}
      <div className="bg-[#111114] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="py-3.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-wider w-24">
                  {isZh ? '控制代碼' : 'Code'}
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-wider w-40">
                  {isZh ? '稽核領域' : 'Domain'}
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  {isZh ? '規範主題與即時遙測舉證 (Telemetry Evidence)' : 'Control & Telemetry Evidence'}
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-wider w-36">
                  {isZh ? '基準偏差度' : 'Variance'}
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-wider w-28">
                  {isZh ? '審計判定' : 'Status'}
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right w-24">
                  {isZh ? '操作' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredControls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{isZh ? '無符合條件的稽核控制項' : 'No matching compliance controls found'}</p>
                  </td>
                </tr>
              ) : (
                filteredControls.map((control) => {
                  const isExpanded = expandedRowId === control.id;

                  return (
                    <React.Fragment key={control.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpanded ? null : control.id)}
                        className={cn(
                          "cursor-pointer transition-colors group",
                          isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                        )}
                      >
                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 inline-block">
                            {control.code}
                          </span>
                        </td>

                        {/* Domain */}
                        <td className="py-3.5 px-4 font-medium text-gray-300 whitespace-nowrap">
                          {control.domain}
                        </td>

                        {/* Control Title & Evidence Preview */}
                        <td className="py-3.5 px-4 max-w-lg">
                          <div className="font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                            {control.title}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono line-clamp-1 flex items-center gap-1.5">
                            {getSourceIcon(control.telemetrySource)}
                            <span className="text-gray-500">[{control.telemetrySource}]:</span>
                            <span>{control.evidence}</span>
                          </div>
                        </td>

                        {/* Variance */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "text-[11px] font-mono font-bold",
                              control.status === 'Violated'
                                ? "text-rose-400"
                                : control.status === 'Warning'
                                ? "text-amber-400"
                                : "text-emerald-400"
                            )}
                          >
                            {control.baselineVariance}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(control.status)}
                        </td>

                        {/* Expand toggle */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-black/30 border-b border-white/5">
                          <td colSpan={6} className="p-5">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#16161a] border border-white/10 rounded-2xl p-6">
                              {/* Left 2 Cols: Requirements & Evidence Breakdown */}
                              <div className="lg:col-span-2 space-y-4">
                                <div>
                                  <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <FileText size={12} className="text-blue-400" />
                                    {isZh ? '法規條款官方標準要求 (Regulatory Mandate)' : 'Official Mandate Requirement'}
                                  </h5>
                                  <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                    {control.requirementText}
                                  </p>
                                </div>

                                <div>
                                  <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Terminal size={12} className="text-emerald-400" />
                                    {isZh ? '連續性遙測舉證日誌 (Telemetry & Forensic Trace)' : 'Forensic Trace & Telemetry'}
                                  </h5>
                                  <div className="p-3 bg-black/60 rounded-xl border border-white/5 font-mono text-[11px] text-emerald-400 leading-relaxed">
                                    <div className="flex items-center justify-between text-gray-500 text-[10px] mb-1.5 pb-1.5 border-b border-white/5">
                                      <span>SOURCE: {control.telemetrySource}</span>
                                      <span>TIMESTAMP: {control.lastChecked}</span>
                                    </div>
                                    <div>{control.evidence}</div>
                                  </div>
                                </div>

                                {/* Affected Assets */}
                                <div>
                                  <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Cpu size={12} className="text-indigo-400" />
                                    {isZh ? '關聯受測標的資產 (Affected Target Assets)' : 'Affected Target Assets'}
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {control.affectedAssets.map((asset, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-mono text-gray-300 flex items-center gap-1.5"
                                      >
                                        <HardDrive size={11} className="text-gray-400" />
                                        {asset}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Right Col: Remediation & SOAR Playbooks */}
                              <div className="space-y-4 border-l border-white/5 pl-0 lg:pl-6 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle size={13} />
                                    {isZh ? '稽核缺陷處置指引 (Remediation Guidance)' : 'Remediation Guidance'}
                                  </h5>
                                  <p className="text-xs text-gray-300 leading-relaxed bg-amber-500/5 p-3 rounded-xl border border-amber-500/15">
                                    {control.remediationGuidance || (isZh ? '建議立即審查該設定偏離情況，並將變更記錄歸檔至 WORM 不可篡改稽核庫。' : 'Review configuration deviation and archive records.')}
                                  </p>

                                  {control.mitreRef && (
                                    <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">
                                        MITRE ATT&CK 對齊:
                                      </span>
                                      <span className="text-[11px] font-mono text-cyan-400">{control.mitreRef}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-white/5 space-y-2">
                                  {control.remediationPlaybook && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTriggerSOAR(control);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                    >
                                      <Play size={13} fill="currentColor" />
                                      {isZh ? '觸發 SOAR 自動化聯防處置' : 'Trigger SOAR Playbook'}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssign(control);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95"
                                  >
                                    <ExternalLink size={13} />
                                    {isZh ? '建立 CAPA 改善工作單' : 'Create CAPA Remediation Task'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

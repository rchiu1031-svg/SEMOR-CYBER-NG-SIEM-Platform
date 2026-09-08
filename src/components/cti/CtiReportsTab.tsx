import React, { useState } from 'react';
import { 
  FileText, Download, Eye, Search, Filter, ShieldAlert, 
  ExternalLink, Calendar, User, Tag, Lock, ArrowUpRight 
} from 'lucide-react';
import { motion } from 'motion/react';
import { CtiReport, CTI_REPORTS, TlpLevel } from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

interface CtiReportsTabProps {
  isZh: boolean;
  onReadReport: (report: CtiReport) => void;
  onEnrichQuery: (val: string) => void;
}

export function CtiReportsTab({ isZh, onReadReport, onEnrichQuery }: CtiReportsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedTlp, setSelectedTlp] = useState<string>('ALL');

  const filteredReports = CTI_REPORTS.filter(r => {
    if (selectedTlp !== 'ALL' && r.tlp !== selectedTlp) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.adversaryProfile.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownloadStixBundle = (report: CtiReport) => {
    const blob = new Blob([report.rawStixJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}-bundle.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-600/20 border border-cyan-500/30 rounded-2xl">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {isZh ? 'STIX 2.1 威脅情報分析報告與快報庫' : 'STIX 2.1 Threat Intelligence Dossiers & Advisories'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                  {filteredReports.length} REPORTS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isZh 
                  ? '專家撰寫的戰略、戰術與技術威脅研判，支援一鍵匯出完整 STIX 2.1 JSON 包' 
                  : 'Expert threat research dossiers with standardized STIX 2.1 Bundle exports and actionable mitigations'
                }
              </p>
            </div>
          </div>

          {/* Search & TLP Filter */}
          <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder={isZh ? '搜尋研判報告標題或組織...' : 'Search reports or threat actors...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <select
              value={selectedTlp}
              onChange={e => setSelectedTlp(e.target.value)}
              className="bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All TLP Protocols</option>
              <option value="TLP:CLEAR">TLP:CLEAR</option>
              <option value="TLP:GREEN">TLP:GREEN</option>
              <option value="TLP:AMBER">TLP:AMBER</option>
              <option value="TLP:RED">TLP:RED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div 
            key={report.id}
            className="bg-[#111114] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all group space-y-4"
          >
            {/* Top Badges */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  {report.id}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {report.tlp}
                </span>
              </div>

              <h4 className="text-sm font-black text-white leading-snug group-hover:text-cyan-400 transition-colors">
                {report.title}
              </h4>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono mt-2">
                <span>{report.published}</span>
                <span>•</span>
                <span className="truncate max-w-[140px]">{report.author}</span>
              </div>
            </div>

            {/* Summary Snippet */}
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 bg-black/40 p-3 rounded-xl border border-gray-800/60">
              {report.summary}
            </p>

            {/* MITRE Tags */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                MITRE Techniques
              </span>
              <div className="flex flex-wrap gap-1">
                {report.mitreTechniques.slice(0, 3).map(tech => (
                  <span key={tech} className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => onReadReport(report)}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20"
              >
                <Eye size={13} />
                {isZh ? '詳閱情資研判' : 'Read Dossier'}
              </button>

              <button
                onClick={() => handleDownloadStixBundle(report)}
                className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-xl transition-colors"
                title="Download STIX 2.1 Bundle"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

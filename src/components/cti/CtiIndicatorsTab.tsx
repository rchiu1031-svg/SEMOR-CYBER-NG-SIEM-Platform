import React, { useState, useMemo } from 'react';
import { 
  Activity, Search, Filter, Plus, Download, ShieldAlert, ShieldCheck, 
  Trash2, ExternalLink, CheckSquare, Square, ChevronDown, RefreshCw, 
  Terminal, ArrowUpRight, Copy, Check, Lock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CtiIndicator, TlpLevel, INITIAL_INDICATORS } from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

interface CtiIndicatorsTabProps {
  isZh: boolean;
  indicators: CtiIndicator[];
  onAddIndicatorClick: () => void;
  onEnrichQuery: (val: string) => void;
  onPushToFirewall: (val: string) => void;
}

export function CtiIndicatorsTab({
  isZh,
  indicators,
  onAddIndicatorClick,
  onEnrichQuery,
  onPushToFirewall,
}: CtiIndicatorsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedTlp, setSelectedTlp] = useState<string>('ALL');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedVal, setCopiedVal] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const filteredIndicators = useMemo(() => {
    return indicators.filter(item => {
      if (selectedType !== 'ALL' && item.type !== selectedType) return false;
      if (selectedTlp !== 'ALL' && item.tlp !== selectedTlp) return false;
      if (selectedPhase !== 'ALL' && item.killChainPhase !== selectedPhase) return false;
      if (search) {
        const query = search.toLowerCase();
        return (
          item.value.toLowerCase().includes(query) ||
          item.actor.toLowerCase().includes(query) ||
          item.campaign.toLowerCase().includes(query) ||
          item.tags.some(t => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [indicators, selectedType, selectedTlp, selectedPhase, search]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredIndicators.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIndicators.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVal(val);
    setTimeout(() => setCopiedVal(null), 2000);
  };

  const handleBatchPush = (target: string) => {
    setPushStatus(`Pushed ${selectedIds.length} indicators to ${target}`);
    setTimeout(() => setPushStatus(null), 3000);
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Type", "Value", "Actor", "Campaign", "Confidence", "TLP", "KillChain", "Status"];
    const rows = filteredIndicators.map(i => [
      i.id, i.type, i.value, i.actor, i.campaign, i.score, i.tlp, i.killChainPhase, i.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stix2.1_indicators_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStix = () => {
    const stixBundle = {
      type: "bundle",
      id: `bundle--${Math.random().toString(36).substring(7)}`,
      objects: filteredIndicators.map(i => ({
        type: "indicator",
        spec_version: "2.1",
        id: i.stixId,
        pattern: `[${i.type.toLowerCase()}:value = '${i.value}']`,
        pattern_type: "stix",
        confidence: i.score,
        labels: i.tags,
        created: i.firstSeen
      }))
    };
    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "stix2.1-indicators-bundle.json";
    a.click();
  };

  const getTlpColor = (tlp: TlpLevel) => {
    switch (tlp) {
      case 'TLP:CLEAR': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'TLP:GREEN': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'TLP:AMBER': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'TLP:AMBER+STRICT': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'TLP:RED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-green-400" />
              {isZh ? 'STIX 2.1 威脅指標管理庫 (IOC Repository)' : 'STIX 2.1 Threat Indicator Repository & Enforcement'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isZh 
                ? `目前庫存 ${indicators.length} 項活躍指標，已過濾顯示 ${filteredIndicators.length} 項`
                : `Managing ${indicators.length} active observables, ${filteredIndicators.length} displayed`
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onAddIndicatorClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus size={14} />
              {isZh ? '新增 STIX 指標' : 'Add STIX Indicator'}
            </button>

            <button
              onClick={handleExportStix}
              className="px-3.5 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Export as STIX 2.1 JSON Bundle"
            >
              <Download size={13} />
              STIX 2.1 JSON
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Export as CSV spreadsheet"
            >
              <Download size={13} />
              CSV
            </button>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-800/80 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={isZh ? '搜尋 IOC 數值、威脅組織、戰役或標籤...' : 'Search IOC value, actor, campaign, tag...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{isZh ? '全部類型' : 'All Types'}</option>
            <option value="IPv4-Addr">IPv4 Address</option>
            <option value="IPv6-Addr">IPv6 Address</option>
            <option value="Domain-Name">Domain Name</option>
            <option value="URL">URL / URI</option>
            <option value="File-SHA256">File SHA-256</option>
            <option value="Windows-Registry">Windows Registry</option>
            <option value="Email-Addr">Email Address</option>
          </select>

          {/* TLP Filter */}
          <select
            value={selectedTlp}
            onChange={e => setSelectedTlp(e.target.value)}
            className="bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All TLP</option>
            <option value="TLP:CLEAR">TLP:CLEAR</option>
            <option value="TLP:GREEN">TLP:GREEN</option>
            <option value="TLP:AMBER">TLP:AMBER</option>
            <option value="TLP:AMBER+STRICT">TLP:AMBER+STRICT</option>
            <option value="TLP:RED">TLP:RED</option>
          </select>

          {/* Kill Chain Phase Filter */}
          <select
            value={selectedPhase}
            onChange={e => setSelectedPhase(e.target.value)}
            className="bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{isZh ? '全部殺傷鏈階段' : 'All Kill Chain'}</option>
            <option value="Reconnaissance">Reconnaissance</option>
            <option value="Weaponization">Weaponization</option>
            <option value="Delivery">Delivery</option>
            <option value="Exploitation">Exploitation</option>
            <option value="Installation">Installation</option>
            <option value="C2">Command & Control</option>
            <option value="Exfiltration">Exfiltration</option>
          </select>
        </div>
      </div>

      {/* Batch Actions Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <CheckSquare size={16} />
            <span>{isZh ? `已選取 ${selectedIds.length} 項指標` : `${selectedIds.length} Indicators Selected`}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBatchPush('Palo Alto / Fortinet Firewall')}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/20"
            >
              <ShieldAlert size={13} />
              {isZh ? '下發次世代防火牆 (Firewall)' : 'Push to NGFW'}
            </button>

            <button
              onClick={() => handleBatchPush('CrowdStrike Falcon & Defender EDR')}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <ShieldCheck size={13} />
              {isZh ? '下發 EDR 端點封鎖' : 'Push to EDR'}
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold"
            >
              {isZh ? '取消選取' : 'Deselect All'}
            </button>
          </div>
        </motion.div>
      )}

      {pushStatus && (
        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-xs font-mono font-bold flex items-center gap-2">
          <Check size={14} />
          {pushStatus}
        </div>
      )}

      {/* Main IOC Table */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-10">
                  <button onClick={handleSelectAll} className="text-gray-400 hover:text-white">
                    {selectedIds.length === filteredIndicators.length && filteredIndicators.length > 0 ? (
                      <CheckSquare size={16} className="text-blue-500" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="p-4">{isZh ? '類型 / 數值 (Indicator)' : 'Type & Observable Value'}</th>
                <th className="p-4">{isZh ? '關聯組織 / 戰役' : 'Actor & Campaign'}</th>
                <th className="p-4">{isZh ? '置信度評分' : 'Confidence'}</th>
                <th className="p-4">{isZh ? 'TLP / 殺傷鏈' : 'TLP & Kill Chain'}</th>
                <th className="p-4">{isZh ? '全球沙箱檢測' : 'Detection Ratio'}</th>
                <th className="p-4">{isZh ? '狀態' : 'Status'}</th>
                <th className="p-4 text-right">{isZh ? '情資操作' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {filteredIndicators.map((ioc) => {
                const isSelected = selectedIds.includes(ioc.id);
                return (
                  <tr 
                    key={ioc.id} 
                    className={cn(
                      "hover:bg-gray-900/40 transition-colors group",
                      isSelected && "bg-blue-600/5"
                    )}
                  >
                    <td className="p-4">
                      <button onClick={() => toggleSelectOne(ioc.id)} className="text-gray-500 hover:text-white">
                        {isSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                      </button>
                    </td>

                    {/* Observable Value */}
                    <td className="p-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-bold whitespace-nowrap">
                          {ioc.type}
                        </span>
                        <button
                          onClick={() => onEnrichQuery(ioc.value)}
                          className="text-xs font-mono font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate max-w-xs"
                          title="Click to enrich and investigate"
                        >
                          {ioc.value}
                          <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleCopy(ioc.value)}
                          className="text-gray-500 hover:text-white"
                          title="Copy indicator value"
                        >
                          {copiedVal === ioc.value ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px] text-gray-500">
                        {ioc.tags.map(t => (
                          <span key={t} className="bg-black/40 px-1.5 py-0.5 rounded border border-gray-800">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Actor & Campaign */}
                    <td className="p-4 font-sans">
                      <div className="text-xs font-bold text-red-400">{ioc.actor}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[180px]">{ioc.campaign}</div>
                    </td>

                    {/* Confidence */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          ioc.score >= 90 ? "text-red-400" : ioc.score >= 80 ? "text-orange-400" : "text-yellow-400"
                        )}>
                          {ioc.score}%
                        </span>
                        <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              ioc.score >= 90 ? "bg-red-500" : ioc.score >= 80 ? "bg-orange-500" : "bg-yellow-500"
                            )} 
                            style={{ width: `${ioc.score}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* TLP & Kill Chain */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded uppercase border inline-block",
                          getTlpColor(ioc.tlp)
                        )}>
                          {ioc.tlp}
                        </span>
                        <div className="text-[10px] text-blue-400 font-sans font-medium">
                          {ioc.killChainPhase}
                        </div>
                      </div>
                    </td>

                    {/* Detection */}
                    <td className="p-4">
                      <span className="text-xs font-bold text-gray-300 font-mono">
                        {ioc.vtDetectionRatio}
                      </span>
                      <span className="block text-[9px] text-gray-500">{ioc.sightings} sightings</span>
                    </td>

                    {/* Status */}
                    <td className="p-4 font-sans">
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase",
                        ioc.status === 'Active' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-800 text-gray-400"
                      )}>
                        {ioc.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-4 text-right font-sans">
                      <button
                        onClick={() => onPushToFirewall(ioc.value)}
                        className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                        title="Block on firewall"
                      >
                        <ShieldAlert size={12} />
                        {isZh ? '阻斷' : 'Block'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

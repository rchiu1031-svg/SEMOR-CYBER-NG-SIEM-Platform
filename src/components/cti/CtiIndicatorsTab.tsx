import React, { useState, useMemo } from 'react';
import { 
  Activity, Search, Filter, Plus, Download, ShieldAlert, ShieldCheck, 
  Trash2, ExternalLink, CheckSquare, Square, ChevronDown, RefreshCw, 
  Terminal, ArrowUpRight, Copy, Check, Lock, Zap, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CtiIndicator, TlpLevel } from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

interface CtiIndicatorsTabProps {
  isZh: boolean;
  indicators: CtiIndicator[];
  onAddIndicatorClick: () => void;
  onEnrichQuery: (val: string) => void;
  onPushToFirewall: (val: string, vendor?: string) => void;
  onDeleteIndicator?: (id: string) => void;
  onPurgeAll?: () => void;
  onSeedBaseline?: () => void;
  onImportStixClick?: () => void;
  onSyncFirstConnector?: () => void;
}

export function CtiIndicatorsTab({
  isZh,
  indicators,
  onAddIndicatorClick,
  onEnrichQuery,
  onPushToFirewall,
  onDeleteIndicator,
  onPurgeAll,
  onSeedBaseline,
  onImportStixClick,
  onSyncFirstConnector,
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
    const selectedVals = indicators.filter(i => selectedIds.includes(i.id)).map(i => i.value);
    selectedVals.forEach(val => onPushToFirewall(val, target));
    setPushStatus(isZh ? `已將 ${selectedIds.length} 項指標下發至 ${target}` : `Pushed ${selectedIds.length} indicators to ${target}`);
    setTimeout(() => setPushStatus(null), 3000);
    setSelectedIds([]);
  };

  const handleExportCsv = () => {
    const targetUrl = selectedIds.length > 0 
      ? `/api/v1/cti/export/csv?ids=${selectedIds.join(',')}`
      : '/api/v1/cti/export/csv';
    window.open(targetUrl, '_blank');
  };

  const handleExportStix = () => {
    const targetUrl = selectedIds.length > 0 
      ? `/api/v1/cti/export/stix?ids=${selectedIds.join(',')}`
      : '/api/v1/cti/export/stix';
    window.open(targetUrl, '_blank');
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
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-green-400" />
                {isZh ? 'STIX 2.1 威脅指標管理庫 (IOC Repository)' : 'STIX 2.1 Threat Indicator Repository & Enforcement'}
              </h3>
              <span className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded font-bold border",
                indicators.length === 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              )}>
                {indicators.length === 0 ? (isZh ? '乾淨狀態 (CLEAN)' : 'CLEAN STATE') : `${indicators.length} IOCs`}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isZh 
                ? (indicators.length === 0 ? '系統處於初始乾淨狀態，無測試殘留數據' : `目前庫存 ${indicators.length} 項活躍指標，已過濾顯示 ${filteredIndicators.length} 項`)
                : (indicators.length === 0 ? 'System in clean initial state, 0 observables' : `Managing ${indicators.length} active observables, ${filteredIndicators.length} displayed`)
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAddIndicatorClick}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
            >
              <Plus size={14} />
              {isZh ? '新增 STIX 指標' : 'Add STIX IOC'}
            </button>
            {onImportStixClick && (
              <button
                onClick={onImportStixClick}
                className="px-3 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Import STIX 2.1 JSON Bundle"
              >
                <Upload size={13} />
                {isZh ? '匯入 STIX' : 'Import STIX'}
              </button>
            )}
            <button
              onClick={handleExportStix}
              className="px-3 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Export as STIX 2.1 JSON Bundle"
            >
              <Download size={13} />
              STIX 2.1
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Export as CSV spreadsheet"
            >
              <Download size={13} />
              CSV
            </button>
            {onSeedBaseline && indicators.length === 0 && (
              <button
                onClick={onSeedBaseline}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Load benchmark intelligence baseline"
              >
                <RefreshCw size={13} />
                {isZh ? '載入基準' : 'Seed'}
              </button>
            )}
            {onPurgeAll && indicators.length > 0 && (
              <button
                onClick={onPurgeAll}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Purge all indicators for clean state"
              >
                <Trash2 size={13} />
                {isZh ? '清空' : 'Purge'}
              </button>
            )}
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
              className="w-full bg-black/60 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="IPv4-Addr">IPv4 Address</option>
            <option value="IPv6-Addr">IPv6 Address</option>
            <option value="Domain-Name">Domain Name</option>
            <option value="URL">Uniform Resource Locator (URL)</option>
            <option value="File-SHA256">File SHA-256 Hash</option>
            <option value="File-MD5">File MD5 Hash</option>
            <option value="Windows-Registry">Windows Registry Key</option>
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
              onClick={() => handleBatchPush('Palo Alto NGFW')}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/20"
            >
              <ShieldAlert size={13} />
              {isZh ? '下發 Palo Alto NGFW' : 'Push to Palo Alto'}
            </button>
            <button
              onClick={() => handleBatchPush('Fortinet FortiGate')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
            >
              <ShieldAlert size={13} />
              {isZh ? '下發 FortiGate' : 'Push to FortiGate'}
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

      {/* Indicators Table or Clean Empty State */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl overflow-hidden">
        {filteredIndicators.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-base font-bold text-white">
                {indicators.length === 0 
                  ? (isZh ? '情資指標庫目前處於乾淨初始狀態' : 'Indicator Repository in Clean Initial State')
                  : (isZh ? '無符合條件的指標' : 'No indicators found matching filters')
                }
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {indicators.length === 0
                  ? (isZh 
                      ? '所有模擬測試特徵已全數移除。系統已就緒，可立即進行真實環境安裝 (Live Deployment)、接取實體 SPAN/TAP 鏡像網路流量，或自 TAXII 饋送同步即時情資。'
                      : 'All simulated test indicators have been purged. The platform is ready for live production deployment and real-time TAXII ingestion.')
                  : (isZh ? '請嘗試清除或更換篩選條件關鍵字' : 'Try broadening your search or reset filters')
                }
              </p>
            </div>
            {indicators.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onSyncFirstConnector && (
                  <button
                    onClick={onSyncFirstConnector}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                  >
                    <RefreshCw size={14} />
                    {isZh ? '同步 TAXII 2.1 饋送' : 'Sync TAXII 2.1 Feed'}
                  </button>
                )}
                <button
                  onClick={onAddIndicatorClick}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  {isZh ? '手動新增指標' : 'Add Indicator'}
                </button>
                {onSeedBaseline && (
                  <button
                    onClick={onSeedBaseline}
                    className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    {isZh ? '載入基準情資 (Demo/Testing)' : 'Load Demo Baseline'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-black/40">
                  <th className="p-4 w-10">
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-white">
                      {selectedIds.length === filteredIndicators.length ? <CheckSquare size={15} /> : <Square size={15} />}
                    </button>
                  </th>
                  <th className="p-4">{isZh ? '指標特徵值 (Indicator Value)' : 'Indicator Value'}</th>
                  <th className="p-4">{isZh ? '組織與戰役 (Actor & Campaign)' : 'Actor & Campaign'}</th>
                  <th className="p-4">{isZh ? '置信度 (Confidence)' : 'Confidence'}</th>
                  <th className="p-4">{isZh ? '協定與階段 (TLP & Kill Chain)' : 'TLP & Kill Chain'}</th>
                  <th className="p-4">{isZh ? '威脅偵測 (VT / Sightings)' : 'Detection / Sightings'}</th>
                  <th className="p-4">{isZh ? '狀態 (Status)' : 'Status'}</th>
                  <th className="p-4 text-right">{isZh ? '邊界聯防 (Enforcement)' : 'Enforcement'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {filteredIndicators.map((ioc) => {
                  const isSelected = selectedIds.includes(ioc.id);
                  return (
                    <tr 
                      key={ioc.id}
                      className={cn(
                        "hover:bg-blue-600/5 transition-colors group",
                        isSelected && "bg-blue-600/10"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <button onClick={() => toggleSelectOne(ioc.id)} className="text-gray-400 hover:text-white">
                          {isSelected ? <CheckSquare size={15} className="text-blue-400" /> : <Square size={15} />}
                        </button>
                      </td>

                      {/* Indicator Value & Type */}
                      <td className="p-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] font-sans font-bold uppercase">
                            {ioc.type}
                          </span>
                          <button
                            onClick={() => onEnrichQuery(ioc.value)}
                            className="text-xs font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1"
                            title="Click to deeply enrich IOC with VirusTotal, Shodan, WHOIS"
                          >
                            <span>{ioc.value}</span>
                            <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleCopy(ioc.value)}
                            className="text-gray-600 hover:text-gray-300 transition-colors p-1"
                            title="Copy IOC"
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPushToFirewall(ioc.value)}
                            className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                            title="Push rule to NGFW"
                          >
                            <ShieldAlert size={12} />
                            {isZh ? '阻斷' : 'Block'}
                          </button>
                          {onDeleteIndicator && (
                            <button
                              onClick={() => onDeleteIndicator(ioc.id)}
                              className="p-1 text-gray-600 hover:text-red-400 rounded transition-colors"
                              title="Delete Indicator"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

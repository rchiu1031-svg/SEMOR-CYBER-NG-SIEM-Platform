import React, { useState } from 'react';
import { 
  Target, Shield, ShieldAlert, ShieldCheck, Search, Filter, 
  Terminal, ExternalLink, Copy, Check, Info, X, Zap, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MITRE_TACTICS_DATA, MitreTechnique } from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

interface CtiMitreTabProps {
  isZh: boolean;
  onEnrichQuery: (val: string) => void;
}

export function CtiMitreTab({ isZh, onEnrichQuery }: CtiMitreTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoverage, setSelectedCoverage] = useState<string>('ALL');
  const [activeTechnique, setActiveTechnique] = useState<MitreTechnique | null>(null);
  const [copiedRule, setCopiedRule] = useState(false);
  const [deployedRule, setDeployedRule] = useState<string | null>(null);

  const totalTechniques = MITRE_TACTICS_DATA.reduce((acc, t) => acc + t.techniques.length, 0);
  const coveredTechniques = MITRE_TACTICS_DATA.reduce((acc, t) => acc + t.techniques.filter(tech => tech.coverage === 'Covered').length, 0);
  const partialTechniques = MITRE_TACTICS_DATA.reduce((acc, t) => acc + t.techniques.filter(tech => tech.coverage === 'Partial').length, 0);
  const gapTechniques = MITRE_TACTICS_DATA.reduce((acc, t) => acc + t.techniques.filter(tech => tech.coverage === 'Gap').length, 0);

  const coveragePercent = Math.round(((coveredTechniques + partialTechniques * 0.5) / totalTechniques) * 100);

  const handleCopyRule = (rule: string) => {
    navigator.clipboard.writeText(rule);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2000);
  };

  const handleDeployRule = (techId: string) => {
    setDeployedRule(techId);
    setTimeout(() => setDeployedRule(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* MITRE Overview Metrics Header */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  MITRE ATT&CK® Enterprise Matrix v14.1
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
                  SOC HEATMAP
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isZh 
                  ? '全面對齊全球攻防 TTPs 與企業 SIEM/EDR 偵測規則覆蓋率評估' 
                  : 'Tactical adversarial technique matrix with real-time detection engineering gap analysis'
                }
              </p>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-black/50 border border-gray-800 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '防禦覆蓋率' : 'Coverage Score'}</span>
              <span className="text-xl font-mono font-black text-green-400">{coveragePercent}%</span>
            </div>
            <div className="bg-black/50 border border-gray-800 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '全面防護' : 'Covered TTPs'}</span>
              <span className="text-xl font-mono font-black text-green-400">{coveredTechniques}</span>
            </div>
            <div className="bg-black/50 border border-gray-800 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '部分覆蓋' : 'Partial'}</span>
              <span className="text-xl font-mono font-black text-amber-400">{partialTechniques}</span>
            </div>
            <div className="bg-black/50 border border-gray-800 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '防禦盲點 (Gaps)' : 'Detection Gaps'}</span>
              <span className="text-xl font-mono font-black text-red-400">{gapTechniques}</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={isZh ? '搜尋手法名稱或編號 (如 T1059, PowerShell)...' : 'Search technique name or ID (e.g. T1059, PowerShell)...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase">{isZh ? '覆蓋狀態' : 'Coverage'}:</span>
            <div className="flex bg-black/60 p-1 rounded-xl border border-gray-800">
              {(['ALL', 'Covered', 'Partial', 'Gap'] as const).map(cov => (
                <button
                  key={cov}
                  onClick={() => setSelectedCoverage(cov)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                    selectedCoverage === cov 
                      ? cov === 'Covered' ? 'bg-green-600 text-white' : cov === 'Partial' ? 'bg-amber-600 text-white' : cov === 'Gap' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {cov}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Matrix Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-2">
        {MITRE_TACTICS_DATA.map((tactic) => {
          const filteredTechniques = tactic.techniques.filter(tech => {
            if (selectedCoverage !== 'ALL' && tech.coverage !== selectedCoverage) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              return tech.name.toLowerCase().includes(q) || tech.id.toLowerCase().includes(q);
            }
            return true;
          });

          return (
            <div key={tactic.id} className="bg-[#111114] border border-gray-800 rounded-2xl p-3.5 space-y-3 flex flex-col">
              {/* Tactic Column Header */}
              <div className="border-b border-gray-800 pb-2.5">
                <span className="text-[9px] font-mono text-purple-400 font-bold block">{tactic.id}</span>
                <h4 className="text-xs font-black text-white tracking-tight">{tactic.name}</h4>
                <span className="text-[9px] text-gray-500 font-mono mt-0.5 block">
                  {filteredTechniques.length} Techniques
                </span>
              </div>

              {/* Techniques List */}
              <div className="space-y-2 flex-1">
                {filteredTechniques.map((tech) => {
                  const isSelected = activeTechnique?.id === tech.id;
                  return (
                    <motion.div
                      key={tech.id}
                      onClick={() => setActiveTechnique(tech)}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-2.5 rounded-xl border transition-all cursor-pointer",
                        isSelected 
                          ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-600/10" 
                          : "bg-black/40 border-gray-800/80 hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono font-bold text-gray-400">{tech.id}</span>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          tech.coverage === 'Covered' ? "bg-green-500" : tech.coverage === 'Partial' ? "bg-amber-500" : "bg-red-500"
                        )} />
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">{tech.name}</div>
                      
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-800/60 text-[9px] text-gray-500 font-mono">
                        <span>Threat Score</span>
                        <span className="font-bold text-white">{tech.threatScore}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Technique Deep-Dive Modal / Drawer */}
      <AnimatePresence>
        {activeTechnique && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-800 bg-black/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {activeTechnique.id}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono border",
                      activeTechnique.coverage === 'Covered' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      activeTechnique.coverage === 'Partial' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      Coverage: {activeTechnique.coverage}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{activeTechnique.name}</h3>
                </div>
                <button onClick={() => setActiveTechnique(null)} className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
                {/* Description */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    {isZh ? '戰術手法行為描述' : 'Technique Behavioral Description'}
                  </span>
                  <p className="text-gray-300 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-gray-800">
                    {activeTechnique.description}
                  </p>
                </div>

                {/* Threat Actors */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    {isZh ? '已知活躍利用此技術的 APT 組織' : 'Known Associated Threat Groups'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeTechnique.actors.map(actor => (
                      <button
                        key={actor}
                        onClick={() => onEnrichQuery(actor)}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldAlert size={12} />
                        {actor}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sigma / SIEM Detection Rule */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal size={13} />
                      {isZh ? 'SOC 偵測防禦規則 (Sigma Rule)' : 'Sigma Detection Rule'}
                    </span>
                    <button
                      onClick={() => handleCopyRule(activeTechnique.sigmaRule)}
                      className="text-gray-400 hover:text-white flex items-center gap-1 text-[10px] font-mono"
                    >
                      {copiedRule ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copiedRule ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製規則' : 'Copy')}
                    </button>
                  </div>
                  <pre className="bg-black p-3.5 rounded-xl border border-gray-800 font-mono text-[11px] text-green-400 whitespace-pre-wrap overflow-x-auto">
                    {activeTechnique.sigmaRule}
                  </pre>
                </div>

                {/* Mitigation */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    {isZh ? '建議緩解措施與防護策略' : 'Actionable Mitigations'}
                  </span>
                  <p className="text-gray-300 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-gray-800">
                    {activeTechnique.mitigation}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 bg-black/50 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">MITRE ATT&CK® Matrix</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeployRule(activeTechnique.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
                  >
                    <ShieldCheck size={14} />
                    {deployedRule === activeTechnique.id ? (isZh ? '已派送至 SIEM/EDR' : 'Deployed to SIEM') : (isZh ? '派送偵測規則至 SIEM' : 'Deploy Rule to SIEM')}
                  </button>
                  <button
                    onClick={() => setActiveTechnique(null)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                  >
                    {isZh ? '關閉' : 'Close'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

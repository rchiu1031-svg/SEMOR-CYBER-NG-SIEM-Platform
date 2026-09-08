import React, { useState, useRef, useMemo } from 'react';
import { 
  Users, Bug, Server, Target, Activity, ShieldAlert, Zap, Globe, 
  Layers, Plus, Minus, RefreshCw, Search, Filter, ShieldCheck, 
  ExternalLink, Copy, Check, Info, X, Sliders, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STIX_CAMPAIGNS, StixNode, StixEntityType } from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

interface CtiGraphTabProps {
  isZh: boolean;
  onEnrichQuery: (val: string) => void;
}

export function CtiGraphTab({ isZh, onEnrichQuery }: CtiGraphTabProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(STIX_CAMPAIGNS[0].id);
  const [selectedNode, setSelectedNode] = useState<StixNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState(50);
  const [copied, setCopied] = useState(false);

  const campaign = useMemo(() => {
    return STIX_CAMPAIGNS.find(c => c.id === selectedCampaignId) || STIX_CAMPAIGNS[0];
  }, [selectedCampaignId]);

  // Position nodes radially or in a structured network layout
  const positionedNodes = useMemo(() => {
    const nodes = campaign.nodes;
    const total = nodes.length;
    const centerX = 360;
    const centerY = 240;
    const radius = 170;

    return nodes.map((node, index) => {
      // Actor or Campaign in center
      if (node.type === 'threat-actor' || node.type === 'campaign') {
        const offset = node.type === 'threat-actor' ? -40 : 40;
        return { ...node, x: centerX, y: centerY + offset };
      }
      const angle = (index / (total - 1)) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...node, x, y };
    });
  }, [campaign]);

  const filteredNodes = useMemo(() => {
    return positionedNodes.filter(node => {
      if (typeFilter !== 'ALL' && node.type !== typeFilter) return false;
      if (node.confidence < minConfidence) return false;
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [positionedNodes, typeFilter, minConfidence, searchQuery]);

  const getNodeColor = (type: StixEntityType) => {
    switch (type) {
      case 'threat-actor': return { border: 'border-red-500', bg: 'bg-red-600', text: 'text-red-400', light: 'bg-red-500/10' };
      case 'malware': return { border: 'border-orange-500', bg: 'bg-orange-600', text: 'text-orange-400', light: 'bg-orange-500/10' };
      case 'infrastructure': return { border: 'border-blue-500', bg: 'bg-blue-600', text: 'text-blue-400', light: 'bg-blue-500/10' };
      case 'attack-pattern': return { border: 'border-purple-500', bg: 'bg-purple-600', text: 'text-purple-400', light: 'bg-purple-500/10' };
      case 'indicator': return { border: 'border-green-500', bg: 'bg-green-600', text: 'text-green-400', light: 'bg-green-500/10' };
      case 'vulnerability': return { border: 'border-amber-500', bg: 'bg-amber-600', text: 'text-amber-400', light: 'bg-amber-500/10' };
      case 'identity': return { border: 'border-cyan-500', bg: 'bg-cyan-600', text: 'text-cyan-400', light: 'bg-cyan-500/10' };
      case 'campaign': return { border: 'border-pink-500', bg: 'bg-pink-600', text: 'text-pink-400', light: 'bg-pink-500/10' };
      default: return { border: 'border-gray-500', bg: 'bg-gray-600', text: 'text-gray-400', light: 'bg-gray-500/10' };
    }
  };

  const getNodeIcon = (type: StixEntityType) => {
    switch (type) {
      case 'threat-actor': return <Users size={16} />;
      case 'malware': return <Bug size={16} />;
      case 'infrastructure': return <Server size={16} />;
      case 'attack-pattern': return <Target size={16} />;
      case 'indicator': return <Activity size={16} />;
      case 'vulnerability': return <ShieldAlert size={16} />;
      case 'identity': return <Globe size={16} />;
      case 'campaign': return <Zap size={16} />;
      default: return <Info size={16} />;
    }
  };

  const handleCopyStixId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Campaign Selection Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-[#111114] p-4 rounded-2xl border border-gray-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? 'STIX 2.1 戰役情資圖譜 (Threat Campaigns)' : 'STIX 2.1 Threat Campaign Knowledge Graphs'}
            </h3>
            <p className="text-[10px] text-gray-500">
              {campaign.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STIX_CAMPAIGNS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCampaignId(c.id);
                setSelectedNode(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                selectedCampaignId === c.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                  : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                c.severity === 'Critical' ? "bg-red-400" : "bg-orange-400"
              )} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Visual Canvas & Interactive Toolbar */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 min-h-[620px] relative overflow-hidden flex flex-col">
        {/* Controls Overlay */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder={isZh ? '搜尋圖譜節點...' : 'Search graph node...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-black/60 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 w-48"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-black/60 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">{isZh ? '全部 STIX 類型' : 'All STIX Types'}</option>
              <option value="threat-actor">Threat Actor</option>
              <option value="malware">Malware</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="attack-pattern">Attack Pattern</option>
              <option value="indicator">Indicator</option>
              <option value="vulnerability">Vulnerability</option>
            </select>

            {/* Confidence Slider */}
            <div className="hidden sm:flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-gray-800 text-xs">
              <span className="text-[10px] text-gray-500 font-bold uppercase">{isZh ? '最低置信度' : 'Min Conf'}:</span>
              <span className="font-mono font-bold text-purple-400">{minConfidence}%</span>
              <input 
                type="range" 
                min="0" 
                max="95" 
                value={minConfidence} 
                onChange={e => setMinConfidence(Number(e.target.value))}
                className="w-16 accent-purple-500"
              />
            </div>
          </div>

          {/* Canvas Zoom & Reset Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.6))}
              className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white"
              title="Zoom In"
            >
              <Plus size={14} />
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.6))}
              className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white"
              title="Zoom Out"
            >
              <Minus size={14} />
            </button>
            <button 
              onClick={() => { setZoom(1); setSearchQuery(''); setTypeFilter('ALL'); setMinConfidence(50); }}
              className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white"
              title="Reset View"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Interactive SVG / Canvas Viewport */}
        <div className="flex-1 relative border border-gray-900 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center min-h-[460px]">
          {/* Subtle Grid Background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <motion.div 
            className="relative w-[720px] h-[480px]"
            animate={{ scale: zoom }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* SVG Connecting Links with Animated Stroke */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#4b5563" />
                </marker>
              </defs>
              {campaign.links.map((link, idx) => {
                const sourceNode = positionedNodes.find(n => n.id === link.source);
                const targetNode = positionedNodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                const isHighlighted = selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target);

                return (
                  <g key={`link-${idx}`}>
                    <line 
                      x1={sourceNode.x} 
                      y1={sourceNode.y} 
                      x2={targetNode.x} 
                      y2={targetNode.y} 
                      stroke={isHighlighted ? "#a855f7" : "#374151"} 
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeDasharray={link.relationship_type === 'communicates-with' ? "4,4" : "none"}
                      markerEnd="url(#arrow)"
                    />
                    {/* Relationship Label Pill */}
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 4}
                      fill="#9ca3af"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="bg-black"
                    >
                      {link.relationship_type}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Graph Nodes */}
            {filteredNodes.map((node) => {
              const colors = getNodeColor(node.type);
              const isSelected = selectedNode?.id === node.id;

              return (
                <motion.div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  initial={{ scale: 0 }}
                  animate={{ scale: isSelected ? 1.15 : 1 }}
                  whileHover={{ scale: 1.1 }}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 select-none group"
                  style={{ left: node.x, top: node.y }}
                >
                  <div className={cn(
                    "p-3 rounded-2xl shadow-xl transition-all flex items-center justify-center border-2",
                    colors.bg,
                    isSelected ? "ring-4 ring-purple-500/50 scale-110 shadow-2xl" : colors.border
                  )}>
                    <div className="text-white">
                      {getNodeIcon(node.type)}
                    </div>
                  </div>

                  {/* Label Card under Node */}
                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none">
                    <div className="bg-[#111114]/90 backdrop-blur-md border border-gray-800 px-2.5 py-1 rounded-lg text-center shadow-lg">
                      <span className="text-[10px] font-bold text-white block">
                        {node.name}
                      </span>
                      <div className="flex items-center justify-center gap-1.5 text-[8px] font-mono">
                        <span className={colors.text}>{node.type}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{node.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Node Inspector Drawer */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ x: 340, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 340, opacity: 0 }}
                className="absolute top-0 right-0 bottom-0 w-80 bg-[#111114]/95 backdrop-blur-xl border-l border-gray-800 p-5 z-30 shadow-2xl overflow-y-auto custom-scrollbar flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded uppercase border font-mono",
                        getNodeColor(selectedNode.type).light,
                        getNodeColor(selectedNode.type).text,
                        getNodeColor(selectedNode.type).border
                      )}>
                        {selectedNode.type}
                      </span>
                      <h4 className="text-sm font-black text-white mt-1.5">{selectedNode.name}</h4>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white p-1">
                      <X size={16} />
                    </button>
                  </div>

                  {/* STIX 2.1 Metadata */}
                  <div className="bg-black/40 p-3 rounded-xl border border-gray-800/80 space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">STIX 2.1 Identifier</span>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-300 mt-0.5">
                        <span className="truncate max-w-[190px]">{selectedNode.stixId}</span>
                        <button onClick={() => handleCopyStixId(selectedNode.stixId)} className="text-gray-400 hover:text-white">
                          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-gray-800/60">
                      <span className="text-gray-500">Confidence:</span>
                      <span className="font-bold text-green-400">{selectedNode.confidence}%</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">TLP Classification:</span>
                      <span className="font-bold text-amber-400">{selectedNode.tlp}</span>
                    </div>

                    {selectedNode.details.cvss && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">CVSS v3.1:</span>
                        <span className="font-mono font-bold text-red-400">{selectedNode.details.cvss}</span>
                      </div>
                    )}

                    {selectedNode.details.origin && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Geopolitical Origin:</span>
                        <span className="font-bold text-white">{selectedNode.details.origin}</span>
                      </div>
                    )}

                    {selectedNode.details.mitreTtp && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">MITRE Technique:</span>
                        <span className="font-mono font-bold text-blue-400">{selectedNode.details.mitreTtp}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {isZh ? '情報研判與情資備註' : 'Intelligence Summary'}
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3 rounded-xl border border-gray-800/50">
                      {selectedNode.details.description}
                    </p>
                  </div>

                  {selectedNode.details.aliases && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Known Aliases
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.details.aliases.map(a => (
                          <span key={a} className="text-[9px] bg-gray-900 text-gray-300 px-2 py-0.5 rounded border border-gray-800">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-gray-800 space-y-2">
                  <button 
                    onClick={() => onEnrichQuery(selectedNode.name)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                  >
                    <Search size={13} />
                    {isZh ? '深度關聯分析 (Deep Enrich)' : 'Deep Enrich & Pivot'}
                  </button>
                  <button 
                    onClick={() => handleCopyStixId(JSON.stringify(selectedNode, null, 2))}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={13} />
                    {isZh ? '複製 STIX 2.1 JSON' : 'Copy STIX JSON'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {[
              { type: 'threat-actor', label: 'Actor', color: 'bg-red-500' },
              { type: 'malware', label: 'Malware', color: 'bg-orange-500' },
              { type: 'infrastructure', label: 'Infra C2', color: 'bg-blue-500' },
              { type: 'attack-pattern', label: 'TTP Pattern', color: 'bg-purple-500' },
              { type: 'indicator', label: 'Indicator', color: 'bg-green-500' },
              { type: 'vulnerability', label: 'Vulnerability', color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", item.color)} />
                <span className="text-gray-400 text-[10px]">{item.label}</span>
              </div>
            ))}
          </div>

          <span className="text-[10px] font-mono text-gray-500">
            {isZh ? '按一下節點可查看 STIX 屬性並下發防護規則' : 'Click any node to inspect STIX properties & enforce mitigations'}
          </span>
        </div>
      </div>
    </div>
  );
}

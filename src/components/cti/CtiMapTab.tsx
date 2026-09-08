import React, { useState } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker, 
  Line as MapLine 
} from 'react-simple-maps';
import { 
  Globe, ShieldAlert, Target, Activity, Flame, Radio, 
  Filter, Layers, ArrowUpRight, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  THREAT_ACTOR_ORIGINS, 
  INDICATOR_DISTRIBUTION, 
  ATTACK_CORRIDORS, 
  GEOPOLITICAL_HOTSPOTS, 
  GEO_ALERTS 
} from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CtiMapTabProps {
  isZh: boolean;
  onEnrichQuery: (val: string) => void;
}

export function CtiMapTab({ isZh, onEnrichQuery }: CtiMapTabProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState(GEOPOLITICAL_HOTSPOTS[0]);

  const filteredOrigins = THREAT_ACTOR_ORIGINS.filter(actor => {
    if (selectedOrigin === 'ALL') return true;
    return actor.origin === selectedOrigin;
  });

  const filteredCorridors = ATTACK_CORRIDORS.filter(corr => {
    if (selectedOrigin === 'ALL') return true;
    return corr.actor.toLowerCase().includes(selectedOrigin.toLowerCase()) || 
           (selectedOrigin === 'Russia' && corr.actor.includes('APT28')) ||
           (selectedOrigin === 'China' && corr.actor.includes('Volt Typhoon')) ||
           (selectedOrigin === 'North Korea' && corr.actor.includes('Lazarus')) ||
           (selectedOrigin === 'Iran' && corr.actor.includes('Charming Kitten'));
  });

  return (
    <div className="space-y-6">
      {/* Geopolitical Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111114] p-4 rounded-2xl border border-gray-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl">
            <Globe className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '全球國家級地緣政治網路衝突與攻擊走廊' : 'Global Geopolitical Cyber Infiltration Corridors'}
            </h3>
            <p className="text-[10px] text-gray-500">
              {isZh ? '即時追蹤 APT 國家級駭客組織跨境 C2 傳輸與關鍵基礎設施滲透路徑' : 'Live tracking of state-sponsored APT cross-border telemetry & C2 infrastructure'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '威脅源頭' : 'Origin'}:</span>
          <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-xl border border-gray-800">
            {['ALL', 'Russia', 'China', 'North Korea', 'Iran'].map((origin) => (
              <button
                key={origin}
                onClick={() => setSelectedOrigin(origin)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold transition-all uppercase",
                  selectedOrigin === origin ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                {origin}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map and Hotspots Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* World Map Interactive Viewport (2 Columns wide on XL) */}
        <div className="xl:col-span-2 bg-[#111114] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[560px]">
          {/* Top Floating Badge */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
            <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-gray-800 flex items-center gap-2 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-[11px] font-bold text-white font-mono">
                {isZh ? '全球即時攻擊走廊連線監控中' : 'ACTIVE INFILTRATION CHANNELS: 6'}
              </span>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="w-full h-full min-h-[480px] flex items-center justify-center">
            <ComposableMap
              projectionConfig={{
                scale: 175,
                center: [20, 15]
              }}
              className="w-full h-full max-h-[500px]"
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#151518"
                      stroke="#27272a"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#1f1f23", outline: "none" },
                        pressed: { fill: "#151518", outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Active Threat Corridors / Lines */}
              {filteredCorridors.map((corr, idx) => (
                <MapLine
                  key={`corr-${idx}`}
                  from={corr.from}
                  to={corr.to}
                  stroke={corr.color}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  opacity={0.7}
                />
              ))}

              {/* Threat Actor Origin Markers */}
              {filteredOrigins.map(({ name, coordinates, color, threatLevel, activeCampaigns }) => (
                <Marker key={name} coordinates={coordinates as [number, number]}>
                  <motion.circle
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: [6, 14, 6], opacity: [0.7, 0.2, 0.7] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    fill={color}
                  />
                  <circle r={4.5} fill={color} stroke="#ffffff" strokeWidth={1} />
                  <text
                    textAnchor="middle"
                    y={-14}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      fill: "#ffffff",
                      fontWeight: "bold",
                      textShadow: "0 1px 3px rgba(0,0,0,0.9)"
                    }}
                  >
                    {name}
                  </text>
                </Marker>
              ))}

              {/* Indicator Distribution Sighting Clusters */}
              {INDICATOR_DISTRIBUTION.map(({ name, coordinates, count, color }) => (
                <Marker key={name} coordinates={coordinates as [number, number]}>
                  <circle r={Math.sqrt(count) / 1.8} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1} />
                  <circle r={2.5} fill={color} />
                  {count > 500 && (
                    <motion.circle
                      initial={{ r: 2, opacity: 0.8 }}
                      animate={{ r: Math.sqrt(count) / 1.2, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                    />
                  )}
                </Marker>
              ))}
            </ComposableMap>
          </div>

          {/* Bottom Corridor Explainer */}
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[10px] text-gray-500 font-bold uppercase">{isZh ? '活動走廊' : 'Corridors'}:</span>
              {filteredCorridors.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-gray-300">{c.name}</span>
                </div>
              ))}
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {isZh ? '源頭節點帶有呼吸動態圓環' : 'Pulsing rings represent state-sponsored command hubs'}
            </span>
          </div>
        </div>

        {/* Hotspot & National Threat Threat Index (1 Column wide on XL) */}
        <div className="space-y-4">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Flame size={15} className="text-red-400" />
                {isZh ? '國家級威脅源頭評等' : 'State Threat Hotspots'}
              </h4>
              <span className="text-[10px] font-mono text-red-400">CYBER WAR INDEX</span>
            </div>

            <div className="space-y-2.5">
              {GEOPOLITICAL_HOTSPOTS.map((hotspot) => {
                const isSelected = selectedHotspot.country === hotspot.country;
                return (
                  <div
                    key={hotspot.country}
                    onClick={() => setSelectedHotspot(hotspot)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer",
                      isSelected 
                        ? "bg-gray-900/90 border-red-500/60 shadow-lg shadow-red-500/10" 
                        : "bg-black/40 border-gray-800/80 hover:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{hotspot.flag}</span>
                        <span className="text-xs font-bold text-white">{hotspot.country}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono",
                        hotspot.threatIndex >= 90 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      )}>
                        INDEX: {hotspot.threatIndex}/100
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 mb-2">
                      <span className="text-gray-500 font-bold">{isZh ? '核心組織' : 'Actors'}: </span>
                      {hotspot.actors.join(', ')}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-gray-800/80">
                      <span className="text-gray-500">Active Campaigns:</span>
                      <span className="font-bold text-white">{hotspot.campaignsCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Hotspot Deep Dive Card */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={14} className="text-blue-400" />
                {selectedHotspot.country} {isZh ? '戰略目標與戰術' : 'Tactical Profile'}
              </span>
              <span className="text-base">{selectedHotspot.flag}</span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed bg-black/40 p-3 rounded-xl border border-gray-800/60">
              {selectedHotspot.tactics}
            </p>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {isZh ? '主要攻擊受害產業' : 'Primary Targeted Sectors'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedHotspot.sectors.map(sec => (
                  <span key={sec} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                    {sec}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => onEnrichQuery(selectedHotspot.actors[0])}
              className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-2"
            >
              <ArrowUpRight size={13} />
              {isZh ? `研判 ${selectedHotspot.actors[0]} 情資` : `Investigate ${selectedHotspot.actors[0]}`}
            </button>
          </div>
        </div>
      </div>

      {/* Geopolitical Live Alert Wire */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-amber-400 animate-pulse" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              {isZh ? '地緣戰略資安情報快報 (Flash Geopolitical Bulletins)' : 'Flash Geopolitical Intelligence Wire'}
            </h4>
          </div>
          <span className="text-[10px] font-mono text-gray-500">CRITICAL INTELLIGENCE FEED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {GEO_ALERTS.map(alert => (
            <div key={alert.id} className="p-3.5 bg-black/40 border border-gray-800 rounded-xl space-y-2 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-gray-500">{alert.time}</span>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono",
                  alert.severity === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                )}>
                  {alert.severity}
                </span>
              </div>
              <h5 className="text-xs font-bold text-white">{alert.title}</h5>
              <p className="text-[11px] text-gray-400 leading-normal">{alert.summary}</p>
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[9px] text-gray-500 font-mono">
                <span>{alert.region}</span>
                <span className="text-blue-400">{alert.actor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Flame, 
  Crosshair, 
  Play, 
  Pause, 
  RotateCcw, 
  Filter, 
  Download, 
  Server, 
  Cpu, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  ExternalLink, 
  Terminal, 
  Activity, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  SlidersHorizontal,
  Sliders,
  Send,
  Eye,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, Line as MapLine } from 'react-simple-maps';
import { cn } from '../../lib/utils';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface GeoLocation {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  asn?: string;
  isp?: string;
}

export interface TPotSensorNode {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  ip: string;
  type: 'HIVE' | 'SENSOR';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
  containers: string[];
  attacksCapturedCount: number;
}

export interface LiveAttackEvent {
  id: string;
  timestamp: string;
  sourceIp: string;
  sourceGeo: GeoLocation;
  targetNodeId: string;
  targetNodeName: string;
  targetGeo: { lat: number; lng: number };
  targetPort: number;
  protocol: string;
  honeypot: 'Cowrie' | 'Dionaea' | 'Conpot' | 'Tanner' | 'Honeytrap' | 'Log4pot' | 'Elasticpot' | 'Heralding' | 'Suricata';
  attackType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cve?: string;
  mitreTechnique?: string;
  payloadSummary: string;
  rawPayload?: string;
  capturedCredentials?: { username: string; password?: string };
  actionTaken: 'TRAPPED' | 'ISOLATED' | 'BLOCKED_BY_NAC' | 'SANDBOX_EXTRACTED';
  isSimulated?: boolean;
}

export interface BlockedAttackerRecord {
  ip: string;
  country: string;
  countryCode: string;
  blockedAt: string;
  reason: string;
  blockedBy: string;
  honeypotTrap: string;
  attacksCountBeforeBlock: number;
  nacSyncStatus: 'SYNCED_NAC_AND_FW' | 'PENDING_PROPAGATION';
}

export interface TPotContainerInfo {
  id: string;
  name: string;
  image: string;
  service: string;
  type: string;
  ports: number[];
  status: 'running' | 'restarting' | 'stopped';
  uptime: string;
  capturedEventsCount: number;
  lastCaptureTime: string;
  description: string;
}

interface TPotAttackMapTabProps {
  onNotify?: (text: string, type: 'info' | 'success' | 'warning' | 'danger') => void;
  synthSoundEnabled?: boolean;
}

export default function TPotAttackMapTab({ onNotify, synthSoundEnabled = true }: TPotAttackMapTabProps) {
  // Live Telemetry States
  const [nodes, setNodes] = useState<TPotSensorNode[]>([]);
  const [attacks, setAttacks] = useState<LiveAttackEvent[]>([]);
  const [blockedList, setBlockedList] = useState<BlockedAttackerRecord[]>([]);
  const [containers, setContainers] = useState<TPotContainerInfo[]>([]);
  const [stats, setStats] = useState({
    totalAttacksToday: 28419,
    uniqueIpsToday: 4812,
    malwareSamplesCaptured: 184,
    credentialsHarvested: 8940,
    velocityRatePerSec: '1.5',
    activeBlockedIpsCount: 3,
    topOrigins: [] as any[],
    protocolBreakdown: [] as any[]
  });

  // UI Control States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [velocity, setVelocity] = useState<number>(1);
  const [soundMuted, setSoundMuted] = useState<boolean>(!synthSoundEnabled);
  const [selectedHoneypotFilter, setSelectedHoneypotFilter] = useState<string>('All');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedAttack, setFocusedAttack] = useState<LiveAttackEvent | null>(null);
  const [focusedNode, setFocusedNode] = useState<TPotSensorNode | null>(null);
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);
  const [showBlockedModal, setShowBlockedModal] = useState<boolean>(false);
  const [showContainersModal, setShowContainersModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [blockingLoadingIp, setBlockingLoadingIp] = useState<string | null>(null);

  // Simulator Form State
  const [simCountry, setSimCountry] = useState<string>('RU');
  const [simHoneypot, setSimHoneypot] = useState<'Cowrie' | 'Dionaea' | 'Conpot' | 'Tanner' | 'Log4pot'>('Cowrie');
  const [simSeverity, setSimSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('CRITICAL');
  const [simTargetNode, setSimTargetNode] = useState<string>('node-central-taipei');
  const [simSubmitting, setSimSubmitting] = useState<boolean>(false);

  // Sound Synth Helper
  const playAlertSound = (type: 'danger' | 'success' | 'ping' = 'ping') => {
    if (soundMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'danger') {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Fetch Live Telemetry from Backend
  const fetchAttackMapData = async () => {
    try {
      const res = await fetch('/api/v1/honeypot/attack-map/live?limit=35');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNodes(data.nodes || []);
          setAttacks(data.attacks || []);
          if (data.summary) {
            setStats(prev => ({
              ...prev,
              ...data.summary
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch attack map data:', err);
    }
  };

  // Fetch Blocked IPs
  const fetchBlockedIps = async () => {
    try {
      const res = await fetch('/api/v1/honeypot/blocked-ips');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBlockedList(data.blockedList || []);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch blocked ips:', err);
    }
  };

  // Fetch Containers
  const fetchContainers = async () => {
    try {
      const res = await fetch('/api/v1/honeypot/containers');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setContainers(data.containers || []);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch containers:', err);
    }
  };

  // Initial Load & Polling Loop
  useEffect(() => {
    fetchAttackMapData();
    fetchBlockedIps();
    fetchContainers();

    const interval = setInterval(() => {
      if (isPlaying) {
        fetchAttackMapData();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle Block Attacker Action
  const handleBlockAttacker = async (ip: string, eventObj?: LiveAttackEvent) => {
    setBlockingLoadingIp(ip);
    try {
      const reason = eventObj 
        ? `${eventObj.honeypot} 蜜罐捕獲: ${eventObj.attackType} (${eventObj.payloadSummary.slice(0, 50)})`
        : 'T-Pot 攻擊地圖分析師主動封鎖惡意探針';

      const res = await fetch('/api/v1/honeypot/block-attacker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip,
          reason,
          blockedBy: 'SOC Analyst (Attack Map Console)'
        })
      });

      const data = await res.json();
      if (data.success) {
        playAlertSound('danger');
        if (onNotify) {
          onNotify(`【NAC 阻斷成功】攻擊者 IP ${ip} 已全面隔離下發防火牆黑名單`, 'danger');
        }
        // Refresh states
        await fetchAttackMapData();
        await fetchBlockedIps();
        if (focusedAttack && focusedAttack.sourceIp === ip) {
          setFocusedAttack(prev => prev ? { ...prev, actionTaken: 'BLOCKED_BY_NAC' } : null);
        }
      } else {
        if (onNotify) onNotify(data.message || '阻斷失敗', 'warning');
      }
    } catch (err) {
      if (onNotify) onNotify('阻斷下發失敗，請檢測網路連線', 'danger');
    } finally {
      setBlockingLoadingIp(null);
    }
  };

  // Handle Unblock Attacker
  const handleUnblockAttacker = async (ip: string) => {
    try {
      const res = await fetch('/api/v1/honeypot/unblock-attacker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (data.success) {
        playAlertSound('success');
        if (onNotify) onNotify(`IP ${ip} 已成功自阻斷庫中移除並恢復路由`, 'success');
        await fetchBlockedIps();
        await fetchAttackMapData();
      }
    } catch {
      if (onNotify) onNotify('解除阻斷失敗', 'danger');
    }
  };

  // Handle Manual Attack Simulation
  const handleTriggerSimulation = async () => {
    setSimSubmitting(true);
    try {
      const res = await fetch('/api/v1/honeypot/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: simCountry,
          honeypot: simHoneypot,
          targetNodeId: simTargetNode,
          severity: simSeverity
        })
      });
      const data = await res.json();
      if (data.success) {
        playAlertSound('danger');
        if (onNotify) onNotify(`已成功向 T-Pot 注入模擬流量: ${data.event.attackType}`, 'warning');
        await fetchAttackMapData();
        setShowSimulatorModal(false);
      }
    } catch {
      if (onNotify) onNotify('模擬攻擊注入失敗', 'danger');
    } finally {
      setSimSubmitting(false);
    }
  };

  // Handle Velocity Change
  const handleVelocityChange = async (val: number) => {
    setVelocity(val);
    try {
      await fetch('/api/v1/honeypot/velocity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier: val })
      });
    } catch {
      // Ignore
    }
  };

  // Handle Restart Container
  const handleRestartContainer = async (containerId: string) => {
    try {
      const res = await fetch(`/api/v1/honeypot/containers/${containerId}/restart`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        playAlertSound('success');
        if (onNotify) onNotify(data.message, 'success');
        await fetchContainers();
      }
    } catch {
      if (onNotify) onNotify('重啟容器失敗', 'danger');
    }
  };

  // Export IOC rules
  const handleExportIoc = (format: 'suricata' | 'stix') => {
    setIsExporting(true);
    window.open(`/api/v1/honeypot/ioc/export?format=${format}`, '_blank');
    setTimeout(() => setIsExporting(false), 1200);
  };

  // Helper for honeypot color themes
  const getHoneypotColor = (honeypot: string) => {
    switch (honeypot) {
      case 'Cowrie': return '#F97316'; // Orange (SSH/Telnet)
      case 'Dionaea': return '#EF4444'; // Red (SMB/Malware)
      case 'Conpot': return '#F59E0B'; // Amber (SCADA/Modbus)
      case 'Tanner': return '#A855F7'; // Purple (Web SQLi)
      case 'Log4pot': return '#EC4899'; // Pink (Log4j JNDI)
      case 'Honeytrap': return '#3B82F6'; // Blue (Dynamic Port)
      default: return '#10B981';
    }
  };

  // Filtered Attacks
  const filteredAttacks = attacks.filter(a => {
    if (selectedHoneypotFilter !== 'All' && a.honeypot !== selectedHoneypotFilter) return false;
    if (selectedSeverityFilter !== 'All' && a.severity !== selectedSeverityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.sourceIp.toLowerCase().includes(q) ||
        a.sourceGeo.country.toLowerCase().includes(q) ||
        a.attackType.toLowerCase().includes(q) ||
        a.payloadSummary.toLowerCase().includes(q) ||
        a.targetNodeName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP STATUS & CONTROL BANNER */}
      <div className="bg-gradient-to-r from-[#0d111a] via-[#101524] to-[#0a0d14] border border-gray-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF3366]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="p-2 bg-[#FF3366]/15 border border-[#FF3366]/30 rounded-xl text-[#FF3366]">
                <Globe size={22} className="animate-spin-slow" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white font-mono tracking-tight">
                    T-POT 24.04-HEXA 全球即時攻擊地圖 (Attack Map)
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LIVE STREAMING
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Deutsche Telekom T-Pot 多層級蜜罐集群 • Cowrie, Dionaea, Conpot, Tanner, Log4pot, Honeytrap, Suricata IDS 實時關聯
                </p>
              </div>
            </div>
          </div>

          {/* Action and Control Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all",
                isPlaying 
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/50" 
                  : "bg-amber-950/40 text-amber-300 border-amber-700/60 hover:bg-amber-900/50"
              )}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? '串流暫停' : '繼續監控'}</span>
            </button>

            {/* Velocity Multiplier */}
            <div className="flex items-center bg-gray-900/80 border border-gray-800 rounded-xl p-1 text-xs font-mono">
              <span className="text-gray-400 px-2 text-[10px] uppercase font-bold">流速:</span>
              {[0.5, 1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleVelocityChange(speed)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[11px] font-bold transition-colors",
                    velocity === speed 
                      ? "bg-[#FF3366] text-white shadow-sm" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className={cn(
                "p-2 rounded-xl border text-xs font-mono transition-colors",
                !soundMuted 
                  ? "bg-blue-950/40 text-blue-300 border-blue-800/60" 
                  : "bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300"
              )}
              title={soundMuted ? "開啟警報音效" : "靜音警報"}
            >
              {!soundMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* War Gaming Simulator Modal Button */}
            <button
              onClick={() => setShowSimulatorModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-red-900/20 flex items-center gap-1.5 transition-all"
            >
              <Zap size={14} />
              <span>發射演練突襲</span>
            </button>

            {/* Blocked List Drawer Button */}
            <button
              onClick={() => setShowBlockedModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-gray-900 border border-gray-800 text-gray-200 hover:bg-gray-800 flex items-center gap-1.5"
            >
              <ShieldAlert size={14} className="text-red-400" />
              <span>黑名單庫 ({blockedList.length})</span>
            </button>

            {/* Honeypot Daemon Matrix Button */}
            <button
              onClick={() => setShowContainersModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-gray-900 border border-gray-800 text-gray-200 hover:bg-gray-800 flex items-center gap-1.5"
            >
              <Server size={14} className="text-cyan-400" />
              <span>蜜罐容器 (7)</span>
            </button>

            {/* Export IOC Dropdown */}
            <button
              onClick={() => handleExportIoc('suricata')}
              disabled={isExporting}
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-gray-900 border border-gray-800 text-emerald-400 hover:bg-gray-800 flex items-center gap-1.5"
              title="匯出 Suricata IDS / BGP FlowSpec 規則"
            >
              <Download size={14} />
              <span>匯出 IOC 規則</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-850/80">
          <div className="bg-black/40 border border-gray-850 p-3 rounded-xl">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-mono uppercase">
              <span>今日誘捕總次數</span>
              <Activity size={12} className="text-[#FF3366]" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {stats.totalAttacksToday.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
              實時流速 ~{stats.velocityRatePerSec} 次/秒
            </div>
          </div>

          <div className="bg-black/40 border border-gray-850 p-3 rounded-xl">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-mono uppercase">
              <span>不重複威脅來源 IP</span>
              <Globe size={12} className="text-blue-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {stats.uniqueIpsToday.toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">
              全球 48+ 國家與自治系統 (ASN)
            </div>
          </div>

          <div className="bg-black/40 border border-gray-850 p-3 rounded-xl">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-mono uppercase">
              <span>捕獲惡意軟體 (Binaries)</span>
              <Flame size={12} className="text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {stats.malwareSamplesCaptured} 隻
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
              Dionaea & Cowrie 自動沙箱萃取
            </div>
          </div>

          <div className="bg-black/40 border border-gray-850 p-3 rounded-xl">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-mono uppercase">
              <span>NAC / 邊界防火牆已阻斷</span>
              <ShieldCheck size={12} className="text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {blockedList.length} 組 IP
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              BGP FlowSpec 黑洞路由同步生效
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BATTLEFIELD CANVAS: 2-COLUMN VIEW (MAP ON LEFT, LIVE FEED ON RIGHT) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: INTERACTIVE T-POT WORLD ATTACK MAP (8 COLS) */}
        <div className="xl:col-span-8 bg-[#0c0f16] border border-gray-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl">
          {/* Header & Map Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-850">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3366] animate-ping"></span>
              <h3 className="text-xs font-black font-mono uppercase tracking-wider text-white">
                T-Pot Global Infiltration Corridor (全球攻擊航道視覺化)
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="text-gray-500 mr-1 text-[10px]">蜜罐過濾:</span>
              {['All', 'Cowrie', 'Dionaea', 'Conpot', 'Tanner', 'Log4pot', 'Honeytrap'].map(hp => (
                <button
                  key={hp}
                  onClick={() => setSelectedHoneypotFilter(hp)}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-colors",
                    selectedHoneypotFilter === hp 
                      ? "bg-gray-800 text-white font-bold border border-gray-700" 
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  )}
                >
                  {hp}
                </button>
              ))}
            </div>
          </div>

          {/* Map Visualizer Area */}
          <div className="bg-black/70 rounded-xl border border-gray-850/80 p-2 relative min-h-[440px] flex items-center justify-center overflow-hidden">
            <ComposableMap 
              projectionConfig={{ scale: 195, center: [20, 15] }}
              className="w-full h-full max-h-[500px]"
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#121620"
                      stroke="#222b3b"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#1c2333", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Dynamic Attack Lines Flying from Source to Target */}
              {filteredAttacks.slice(0, 20).map((atk) => {
                const strokeColor = getHoneypotColor(atk.honeypot);
                const isBlocked = atk.actionTaken === 'BLOCKED_BY_NAC';
                return (
                  <MapLine
                    key={atk.id}
                    from={[atk.sourceGeo.lng, atk.sourceGeo.lat]}
                    to={[atk.targetGeo.lng, atk.targetGeo.lat]}
                    stroke={isBlocked ? "#64748B" : strokeColor}
                    strokeWidth={atk.severity === 'CRITICAL' ? 1.8 : 1.2}
                    strokeLinecap="round"
                    strokeDasharray={isBlocked ? "3,3" : atk.severity === 'CRITICAL' ? "none" : "4,2"}
                    className={cn(!isBlocked && "animate-pulse")}
                  />
                );
              })}

              {/* Target Honey Hive & Sensor Node Markers */}
              {nodes.map(node => (
                <Marker 
                  key={node.id} 
                  coordinates={[node.lng, node.lat]}
                  onClick={() => setFocusedNode(node)}
                >
                  <circle r={node.type === 'HIVE' ? 7 : 5} fill="#10B981" className="animate-ping opacity-75" />
                  <circle r={node.type === 'HIVE' ? 5 : 3.5} fill="#10B981" stroke="#ffffff" strokeWidth={1.5} />
                  <text 
                    textAnchor="middle" 
                    y={-10} 
                    className="text-[8px] font-mono fill-emerald-300 font-bold pointer-events-none select-none drop-shadow"
                  >
                    {node.type === 'HIVE' ? '★ TAIPEI HIVE' : node.name.split(' ')[0].replace('TPOT-SENSOR-', '')}
                  </text>
                </Marker>
              ))}

              {/* Source Attack Origin Markers */}
              {filteredAttacks.slice(0, 25).map((atk) => {
                const markerColor = getHoneypotColor(atk.honeypot);
                const isBlocked = atk.actionTaken === 'BLOCKED_BY_NAC';

                return (
                  <Marker
                    key={`src-${atk.id}`}
                    coordinates={[atk.sourceGeo.lng, atk.sourceGeo.lat]}
                    onClick={() => setFocusedAttack(atk)}
                    className="cursor-pointer group"
                  >
                    <circle 
                      r={atk.severity === 'CRITICAL' ? 4 : 3} 
                      fill={isBlocked ? "#64748B" : markerColor} 
                      stroke="#ffffff"
                      strokeWidth={0.7}
                      className={cn(!isBlocked && atk.severity === 'CRITICAL' && "animate-ping")}
                    />
                  </Marker>
                );
              })}
            </ComposableMap>

            {/* Map Legend Overlay */}
            <div className="absolute left-3 bottom-3 bg-black/85 backdrop-blur-md border border-gray-800 rounded-xl p-3 text-[10px] font-mono space-y-1.5 z-10 select-none shadow-xl">
              <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">蜜罐攻擊協議走廊圖例</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-emerald-500/20"></span>
                <span className="text-gray-200">T-Pot 誘捕節點 (HIVE / Edge Sensors)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                <span className="text-gray-200">Dionaea SMB / MS17-010 / 惡意 Payload</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                <span className="text-gray-200">Cowrie SSH / Telnet 密碼爆破</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span className="text-gray-200">Conpot 工控 SCADA Modbus 探針</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7]"></span>
                <span className="text-gray-200">Tanner Web / SQLi 注入探針</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]"></span>
                <span className="text-gray-200">Log4pot JNDI 漏洞試探 (CVE-2021-44228)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]"></span>
                <span className="text-gray-400">已由 NAC 阻斷隔離的來源</span>
              </div>
            </div>

            {/* Quick Action Floating Widget */}
            <div className="absolute right-3 top-3 bg-black/80 backdrop-blur-md border border-gray-800 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-300 flex items-center gap-2 z-10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>分散式探針在線: <b>{nodes.filter(n => n.status === 'ONLINE').length} / {nodes.length}</b></span>
            </div>
          </div>

          {/* Quick Manual Attack Testing Bar */}
          <div className="mt-3 bg-[#111622] p-3 rounded-xl border border-gray-850 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-gray-300">
              <Zap size={14} className="text-amber-400 shrink-0" />
              <span>快速注入突襲演練：</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSimCountry('RU');
                  setSimHoneypot('Cowrie');
                  setSimSeverity('CRITICAL');
                  handleTriggerSimulation();
                }}
                disabled={simSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white flex items-center gap-1"
              >
                🇷🇺 Cowrie SSH 爆破
              </button>
              <button
                onClick={() => {
                  setSimCountry('CN');
                  setSimHoneypot('Tanner');
                  setSimSeverity('HIGH');
                  handleTriggerSimulation();
                }}
                disabled={simSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white flex items-center gap-1"
              >
                🇨🇳 Tanner SQLi 探針
              </button>
              <button
                onClick={() => {
                  setSimCountry('US');
                  setSimHoneypot('Dionaea');
                  setSimSeverity('CRITICAL');
                  handleTriggerSimulation();
                }}
                disabled={simSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white flex items-center gap-1"
              >
                🇺🇸 Dionaea SMB 漏洞
              </button>
              <button
                onClick={() => {
                  setSimCountry('KP');
                  setSimHoneypot('Conpot');
                  setSimSeverity('CRITICAL');
                  handleTriggerSimulation();
                }}
                disabled={simSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white flex items-center gap-1"
              >
                🇰🇵 Conpot SCADA 突襲
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REALTIME ATTACK FEED & ATTACKER DOSSIER (4 COLS) */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* Top Threat Origin Heat Ranking */}
          <div className="bg-[#0c0f16] border border-gray-850 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-850">
              <h4 className="text-xs font-mono font-black uppercase text-gray-300 flex items-center gap-1.5">
                <Flame size={14} className="text-[#FF3366]" />
                攻擊來源地理排行 (Top Threat Origins)
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">即時統計</span>
            </div>

            <div className="space-y-2">
              {stats.topOrigins.slice(0, 5).map((origin: any, idx: number) => {
                const percent = Math.min(100, Math.round((origin.count / (stats.topOrigins[0]?.count || 1)) * 100));
                return (
                  <div key={origin.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold w-4">{idx + 1}.</span>
                        <span className="text-gray-200 font-bold">{origin.country}</span>
                        <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.2 rounded border border-gray-800">
                          {origin.code}
                        </span>
                      </div>
                      <span className="text-gray-300 font-bold">{origin.count} 次</span>
                    </div>
                    <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-850">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-rose-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focused Attacker Card / Selected Event Details */}
          {focusedAttack ? (
            <div className="bg-gradient-to-b from-[#161b26] to-[#0c0f16] border-2 border-[#FF3366]/40 rounded-2xl p-4 shadow-2xl relative">
              <button 
                onClick={() => setFocusedAttack(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-lg bg-gray-900"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-[#FF3366]/20 text-[#FF3366] rounded-lg">
                  <Crosshair size={14} />
                </span>
                <span className="text-xs uppercase font-mono font-black text-white">
                  捕獲目標特徵剖析 (Attacker Dossier)
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-400">來源 IP:</span>
                  <span className="text-white font-bold select-all">{focusedAttack.sourceIp}</span>
                </div>

                <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-400">地理坐標:</span>
                  <span className="text-gray-200">
                    {focusedAttack.sourceGeo.city}, {focusedAttack.sourceGeo.country} ({focusedAttack.sourceGeo.lat.toFixed(1)}, {focusedAttack.sourceGeo.lng.toFixed(1)})
                  </span>
                </div>

                <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-400">蜜罐目標:</span>
                  <span className="text-white font-bold">
                    {focusedAttack.honeypot} ({focusedAttack.protocol})
                  </span>
                </div>

                <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-400">攻擊類型:</span>
                  <span className="text-rose-400 font-bold">{focusedAttack.attackType}</span>
                </div>

                {focusedAttack.cve && (
                  <div className="flex justify-between items-center bg-red-950/20 p-2 rounded-lg border border-red-900/40">
                    <span className="text-red-300">關聯 CVE:</span>
                    <span className="text-red-400 font-bold">{focusedAttack.cve}</span>
                  </div>
                )}

                {focusedAttack.capturedCredentials && (
                  <div className="bg-amber-950/20 border border-amber-900/40 p-2 rounded-lg">
                    <span className="text-amber-400 block text-[10px] uppercase font-bold mb-1">捕獲字典憑據 (Credential Lure):</span>
                    <div className="text-gray-200">
                      帳號: <b className="text-white">{focusedAttack.capturedCredentials.username}</b> | 密碼: <b className="text-white">{focusedAttack.capturedCredentials.password || '******'}</b>
                    </div>
                  </div>
                )}

                <div className="bg-black/50 border border-gray-850 p-2 rounded-lg">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">即時 Payload 摘要:</span>
                  <pre className="text-[10px] text-gray-300 break-all whitespace-pre-wrap font-mono">
                    {focusedAttack.payloadSummary}
                  </pre>
                </div>

                {/* Instant Block Button */}
                <div className="pt-2">
                  {focusedAttack.actionTaken === 'BLOCKED_BY_NAC' ? (
                    <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 flex items-center justify-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>此來源 IP 已於邊界 NAC 阻斷中</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBlockAttacker(focusedAttack.sourceIp, focusedAttack)}
                      disabled={blockingLoadingIp === focusedAttack.sourceIp}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
                    >
                      <Lock size={14} />
                      <span>{blockingLoadingIp === focusedAttack.sourceIp ? '阻斷下發中...' : '立即透過 NAC 下發阻斷 (Block IP)'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Selected Node Dossier */
            focusedNode ? (
              <div className="bg-gradient-to-b from-[#121824] to-[#0c0f16] border-2 border-emerald-500/40 rounded-2xl p-4 shadow-2xl relative">
                <button 
                  onClick={() => setFocusedNode(null)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-lg bg-gray-900"
                >
                  <X size={14} />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Server size={14} className="text-emerald-400" />
                  <span className="text-xs uppercase font-mono font-black text-white">
                    T-Pot 誘捕節點詳情
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-white font-bold text-sm">{focusedNode.name}</div>
                  <div className="text-gray-400">{focusedNode.location} (IP: {focusedNode.ip})</div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>CPU / RAM / Disk:</span>
                    <span>{focusedNode.cpuUsage}% / {focusedNode.memoryUsage}% / {focusedNode.diskUsage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>累計捕獲次數:</span>
                    <span className="text-emerald-400 font-bold">{focusedNode.attacksCapturedCount.toLocaleString()}</span>
                  </div>
                  <div className="bg-black/40 p-2 rounded-lg border border-gray-800">
                    <span className="text-gray-500 text-[10px] block mb-1">運行蜜罐容器:</span>
                    <div className="flex flex-wrap gap-1">
                      {focusedNode.containers.map(c => (
                        <span key={c} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          )}

          {/* Realtime Stream Ticker Feed */}
          <div className="bg-[#0c0f16] border border-gray-850 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-850">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                <h4 className="text-xs font-mono font-black uppercase text-gray-300">
                  實時攻擊情報滾動 (Live Attack Ticker)
                </h4>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {filteredAttacks.length} 筆最新事件
              </span>
            </div>

            {/* Quick Search */}
            <div className="mb-3 relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋來源 IP, 國家, 協議, Payload..."
                className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-7 pr-3 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#FF3366]"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredAttacks.slice(0, 15).map((atk) => {
                const color = getHoneypotColor(atk.honeypot);
                const isBlocked = atk.actionTaken === 'BLOCKED_BY_NAC';

                return (
                  <div
                    key={atk.id}
                    onClick={() => setFocusedAttack(atk)}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all cursor-pointer group text-xs font-mono",
                      focusedAttack?.id === atk.id
                        ? "bg-gray-800/80 border-[#FF3366]"
                        : "bg-black/40 border-gray-850 hover:bg-gray-900 hover:border-gray-800"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: isBlocked ? '#64748B' : color }}
                        ></span>
                        <span className="font-bold text-gray-200 group-hover:text-white">
                          {atk.sourceIp}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({atk.sourceGeo.countryCode})
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {new Date(atk.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-bold" style={{ color }}>
                        {atk.honeypot} • {atk.protocol}
                      </span>
                      {isBlocked ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 font-bold">
                          已阻斷
                        </span>
                      ) : (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase",
                          atk.severity === 'CRITICAL' ? "bg-red-950/60 text-red-400 border border-red-800/40" : "bg-orange-950/60 text-orange-400"
                        )}>
                          {atk.severity}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-500 truncate mt-1 group-hover:text-gray-400">
                      {atk.payloadSummary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 3. SIMULATION MODAL (WAR GAMING DIALOG) */}
      {showSimulatorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowSimulatorModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-600/20 text-red-400 rounded-xl">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-mono">
                  T-Pot 蜜罐突襲演練控制器 (War Gaming Injector)
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  手動模擬全球 APT 威脅或殭屍網路入侵，驗證蜜罐誘捕與阻斷聯動
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-gray-400 block mb-1">攻擊來源國別 (GeoIP Origin):</label>
                <select
                  value={simCountry}
                  onChange={(e) => setSimCountry(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-red-500"
                >
                  <option value="RU">🇷🇺 俄羅斯 (Moscow / Rostelecom AS12389)</option>
                  <option value="CN">🇨🇳 中國 (Beijing / Chinanet AS4134)</option>
                  <option value="US">🇺🇸 美國 (Ashburn / AWS Cloud AS16509)</option>
                  <option value="DE">🇩🇪 德國 (Frankfurt / Hetzner AS24940)</option>
                  <option value="NL">🇳🇱 荷蘭 (Amsterdam / LeaseWeb AS60781)</option>
                  <option value="KP">🇰🇵 北韓 (Pyongyang / Star JV AS131279)</option>
                  <option value="IR">🇮🇷 伊朗 (Tehran / TIC AS58224)</option>
                  <option value="BR">🇧🇷 巴西 (São Paulo / Claro AS28573)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">目標蜜罐服務 (Honeypot Vector):</label>
                <select
                  value={simHoneypot}
                  onChange={(e) => setSimHoneypot(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-red-500"
                >
                  <option value="Cowrie">Cowrie - SSH / Telnet 密碼爆破 & 反彈 Shell</option>
                  <option value="Dionaea">Dionaea - SMBv1 EternalBlue (MS17-010) / MSSQL 注入</option>
                  <option value="Conpot">Conpot - 工控 SCADA Modbus PLC 停機指令</option>
                  <option value="Tanner">Tanner - Web OWASP SQLi & 任意路徑穿越</option>
                  <option value="Log4pot">Log4pot - Apache Log4j JNDI 注入 (CVE-2021-44228)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">目標誘捕節點 (Target Hive):</label>
                <select
                  value={simTargetNode}
                  onChange={(e) => setSimTargetNode(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-red-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">威脅等級 (Severity):</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CRITICAL', 'HIGH', 'MEDIUM'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSimSeverity(sev)}
                      className={cn(
                        "py-2 rounded-xl text-center font-bold border transition-all",
                        simSeverity === sev 
                          ? "bg-red-600 text-white border-red-500" 
                          : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white"
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 font-mono">
              <button
                type="button"
                onClick={() => setShowSimulatorModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-gray-300 hover:bg-gray-800 text-xs"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleTriggerSimulation}
                disabled={simSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-900/30"
              >
                <Send size={14} />
                <span>{simSubmitting ? '流量發射中...' : '立即發送模擬流量'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. BLOCKED IPS VAULT MODAL */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowBlockedModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-600/20 text-red-400 rounded-xl">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-mono">
                  NAC & 邊界防火牆主動阻斷庫 ({blockedList.length})
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  所有經由 T-Pot 誘捕後下發自動隔離阻斷的惡意 IP 清單
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {blockedList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 font-mono text-xs">
                  目前阻斷庫為空
                </div>
              ) : (
                blockedList.map(record => (
                  <div 
                    key={record.ip} 
                    className="p-3 bg-black/40 border border-gray-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold select-all">{record.ip}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-900 px-1.5 py-0.2 rounded border border-gray-800">
                          {record.country} ({record.countryCode})
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/40">
                          NAC 同步生效
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {record.reason}
                      </p>
                      <span className="text-[10px] text-gray-500">
                        封鎖時間: {new Date(record.blockedAt).toLocaleString()} • {record.honeypotTrap}
                      </span>
                    </div>

                    <button
                      onClick={() => handleUnblockAttacker(record.ip)}
                      className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 text-xs font-bold self-end md:self-center shrink-0 flex items-center gap-1"
                    >
                      <Unlock size={12} />
                      <span>解除阻斷</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-gray-800 flex justify-between items-center font-mono text-xs">
              <span className="text-gray-500">規則格式: RFC 5575 BGP FlowSpec / iptables -j DROP</span>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TPOT CONTAINERS HEALTH MODAL */}
      {showContainersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-gray-850 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowContainersModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-xl">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-mono">
                  T-Pot 容器服務狀態矩陣 (Honeypot Daemons)
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  管理 Docker Compose 誘捕守護進程，即時重置各埠口監聽監控
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {containers.map(c => (
                <div 
                  key={c.id}
                  className="p-3.5 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{c.service}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-800/40">
                        {c.image}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded font-bold uppercase",
                        c.status === 'running' ? "text-emerald-400 bg-emerald-950/50" : "text-amber-400 bg-amber-950/50"
                      )}>
                        ● {c.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {c.description}
                    </p>
                    <div className="text-[10px] text-gray-500 flex gap-4">
                      <span>監聽埠口: {c.ports.join(', ') || 'IDS Mirror'}</span>
                      <span>已捕獲事件: <b>{c.capturedEventsCount.toLocaleString()}</b></span>
                      <span>運行時間: {c.uptime}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestartContainer(c.id)}
                    className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 text-xs font-bold shrink-0 flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className={cn(c.status === 'restarting' && "animate-spin")} />
                    <span>重啟容器</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-800 flex justify-end font-mono text-xs">
              <button
                onClick={() => setShowContainersModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

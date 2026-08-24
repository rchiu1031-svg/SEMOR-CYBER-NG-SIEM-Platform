import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts';
import {
  Activity,
  Signal,
  TrafficCone,
  Car,
  Gauge,
  ArrowRightLeft,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Settings,
  Sliders,
  Maximize2,
  Minimize2,
  RefreshCw,
  FastForward,
  Lock,
  Unlock,
  ChevronRight,
  Radio,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Siren,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

export type SignalPhaseState = 'NS_GREEN' | 'NS_YELLOW' | 'EW_GREEN' | 'EW_YELLOW' | 'FLASHING_YELLOW' | 'ALL_RED' | 'EMERGENCY_CORRIDOR';

export interface TelemetryDataPoint {
  time: string;
  timestamp: number;
  northSouthFlow: number; // Vehicles / min (博愛一路)
  eastWestFlow: number;   // Vehicles / min (中正路)
  expresswayFlow: number; // Vehicles / min (信義快速道路)
  tunnelFlow: number;     // Vehicles / min (中央隧道)
  signalFrequency: number;// Signal phase switch frequency (cycles / hour)
  greenEfficiency: number;// Green wave progression / efficiency percentage (0-100%)
  avgSpeedKmh: number;    // Average corridor speed
  queueLengthMeters: number; // Queue length
  activePhase: string;
}

export interface CorridorMetric {
  id: string;
  name: string;
  zone: string;
  inflowVpm: number;
  outflowVpm: number;
  capacityRatio: number; // 0 - 100%
  avgSpeedKmh: number;
  queueMeters: number;
  status: 'Smooth' | 'Normal' | 'Congested' | 'Critical';
}

// Initial 15 data points for 5-minute rolling window
const generateInitialTelemetry = (): TelemetryDataPoint[] => {
  const points: TelemetryDataPoint[] = [];
  const now = Date.now();
  for (let i = 14; i >= 0; i--) {
    const t = new Date(now - i * 10000);
    const timeStr = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
    
    // Baseline calculations with natural oscillations
    const ns = Math.floor(45 + Math.sin(i * 0.5) * 12 + Math.random() * 8);
    const ew = Math.floor(32 + Math.cos(i * 0.6) * 10 + Math.random() * 6);
    const exp = Math.floor(65 + Math.sin(i * 0.3) * 15 + Math.random() * 10);
    const tun = Math.floor(40 + Math.cos(i * 0.4) * 8 + Math.random() * 5);
    const freq = Number((26 + Math.sin(i * 0.8) * 4 + (ns > 50 ? 3 : 0)).toFixed(1));
    const eff = Math.min(99, Math.max(60, Math.floor(88 - (ns + ew) * 0.15 + Math.random() * 5)));
    const speed = Math.floor(48 - (ns / 55) * 12 + Math.random() * 4);
    const queue = Math.floor(15 + (ns / 40) * 25 + Math.random() * 10);

    points.push({
      time: timeStr,
      timestamp: t.getTime(),
      northSouthFlow: ns,
      eastWestFlow: ew,
      expresswayFlow: exp,
      tunnelFlow: tun,
      signalFrequency: freq,
      greenEfficiency: eff,
      avgSpeedKmh: speed,
      queueLengthMeters: queue,
      activePhase: i % 4 === 0 ? 'EW_GREEN' : 'NS_GREEN'
    });
  }
  return points;
};

// Initial Corridor Overview
const INITIAL_CORRIDORS: CorridorMetric[] = [
  {
    id: 'corridor_ns',
    name: '博愛一路 (南北向幹道)',
    zone: '中正特區 Zone-A',
    inflowVpm: 52,
    outflowVpm: 49,
    capacityRatio: 76,
    avgSpeedKmh: 42.8,
    queueMeters: 45,
    status: 'Normal'
  },
  {
    id: 'corridor_ew',
    name: '中正路 (東西向主軸)',
    zone: '核心商業區 Zone-A',
    inflowVpm: 36,
    outflowVpm: 34,
    capacityRatio: 58,
    avgSpeedKmh: 48.2,
    queueMeters: 20,
    status: 'Smooth'
  },
  {
    id: 'corridor_exp',
    name: '信義快速道路 (高架段)',
    zone: '外環快速走廊 Zone-B',
    inflowVpm: 78,
    outflowVpm: 71,
    capacityRatio: 88,
    avgSpeedKmh: 68.5,
    queueMeters: 110,
    status: 'Congested'
  },
  {
    id: 'corridor_tun',
    name: '中央隧道 (南向入口)',
    zone: '隧道安全管制區 Zone-C',
    inflowVpm: 44,
    outflowVpm: 44,
    capacityRatio: 62,
    avgSpeedKmh: 56.0,
    queueMeters: 15,
    status: 'Smooth'
  }
];

export default function TrafficTelemetryDashboard() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Real-time telemetry state
  const [telemetryData, setTelemetryData] = useState<TelemetryDataPoint[]>(generateInitialTelemetry);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [timeSpan, setTimeSpan] = useState<'5m' | '1h' | '24h' | '7d'>('5m');
  const [trafficScenario, setTrafficScenario] = useState<'NORMAL' | 'RUSH_HOUR' | 'ACCIDENT' | 'RAIN'>('NORMAL');

  // Interactive Traffic Signal Simulator State
  const [currentPhase, setCurrentPhase] = useState<SignalPhaseState>('NS_GREEN');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(32);
  const [pedestrianWalkActive, setPedestrianWalkActive] = useState<boolean>(true);
  const [leftTurnArrowActive, setLeftTurnArrowActive] = useState<boolean>(false);
  const [manualOverrideMode, setManualOverrideMode] = useState<boolean>(false);
  const [signalCycleCount, setSignalCycleCount] = useState<number>(142);
  const [greenExtensionSec, setGreenExtensionSec] = useState<number>(0);

  // Selected Visible Chart Series
  const [visibleSeries, setVisibleSeries] = useState({
    nsFlow: true,
    ewFlow: true,
    expresswayFlow: false,
    signalFreq: true,
    greenEff: true,
    avgSpeed: false
  });

  // Highlighted Corridor
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor_ns');

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // --------------------------------------------------------------------------
  // REAL-TIME CLOCK & SIGNAL STATE MACHINE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (manualOverrideMode) return;

    const signalTimer = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition state machine
          if (currentPhase === 'NS_GREEN') {
            setCurrentPhase('NS_YELLOW');
            setPedestrianWalkActive(false);
            setLeftTurnArrowActive(false);
            return 4; // 4s yellow
          } else if (currentPhase === 'NS_YELLOW') {
            setCurrentPhase('EW_GREEN');
            setPedestrianWalkActive(true);
            setLeftTurnArrowActive(true);
            setSignalCycleCount((c) => c + 1);
            return 35 + greenExtensionSec; // 35s EW
          } else if (currentPhase === 'EW_GREEN') {
            setCurrentPhase('EW_YELLOW');
            setPedestrianWalkActive(false);
            setLeftTurnArrowActive(false);
            return 4; // 4s yellow
          } else if (currentPhase === 'EW_YELLOW') {
            setCurrentPhase('NS_GREEN');
            setPedestrianWalkActive(true);
            setLeftTurnArrowActive(true);
            setSignalCycleCount((c) => c + 1);
            return 45 + greenExtensionSec; // 45s NS
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(signalTimer);
  }, [currentPhase, manualOverrideMode, greenExtensionSec]);

  // --------------------------------------------------------------------------
  // REAL-TIME TELEMETRY DATA GENERATOR
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isLiveStreaming) return;

    const dataTimer = setInterval(() => {
      setTelemetryData((prev) => {
        const last = prev[prev.length - 1] || { timestamp: Date.now() };
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Factor in current scenario
        let multiplier = 1.0;
        let speedPenalty = 0;
        if (trafficScenario === 'RUSH_HOUR') {
          multiplier = 1.45;
          speedPenalty = 14;
        } else if (trafficScenario === 'ACCIDENT') {
          multiplier = 0.65;
          speedPenalty = 25;
        } else if (trafficScenario === 'RAIN') {
          multiplier = 1.15;
          speedPenalty = 10;
        }

        const nsBase = (currentPhase.startsWith('NS') ? 48 : 34) * multiplier;
        const ewBase = (currentPhase.startsWith('EW') ? 42 : 28) * multiplier;
        const expBase = 70 * multiplier;
        const tunBase = 42 * multiplier;

        const newPoint: TelemetryDataPoint = {
          time: timeStr,
          timestamp: now.getTime(),
          northSouthFlow: Math.max(10, Math.floor(nsBase + (Math.random() * 12 - 6))),
          eastWestFlow: Math.max(8, Math.floor(ewBase + (Math.random() * 10 - 5))),
          expresswayFlow: Math.max(15, Math.floor(expBase + (Math.random() * 14 - 7))),
          tunnelFlow: Math.max(10, Math.floor(tunBase + (Math.random() * 8 - 4))),
          signalFrequency: Number((26 + (currentPhase.includes('YELLOW') ? 4 : 0) + (Math.random() * 3 - 1.5)).toFixed(1)),
          greenEfficiency: Math.min(99, Math.max(50, Math.floor((currentPhase === 'NS_GREEN' || currentPhase === 'EW_GREEN' ? 92 : 72) - speedPenalty * 0.5 + Math.random() * 6))),
          avgSpeedKmh: Math.max(15, Math.floor(48 - speedPenalty + (Math.random() * 6 - 3))),
          queueLengthMeters: Math.floor((trafficScenario === 'ACCIDENT' ? 140 : 25) + (currentPhase.includes('RED') ? 35 : 5) + Math.random() * 10),
          activePhase: currentPhase
        };

        // Keep a rolling buffer of 16 points
        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 3000);

    return () => clearInterval(dataTimer);
  }, [isLiveStreaming, currentPhase, trafficScenario]);

  // Derive Summary Live Figures
  const latestTelemetry: TelemetryDataPoint = telemetryData[telemetryData.length - 1] || {
    time: '12:00:00',
    timestamp: Date.now(),
    northSouthFlow: 48,
    eastWestFlow: 35,
    expresswayFlow: 70,
    tunnelFlow: 42,
    signalFrequency: 28.5,
    greenEfficiency: 92,
    avgSpeedKmh: 45,
    queueLengthMeters: 28,
    activePhase: 'NS_GREEN'
  };

  const totalHourlyFlow = Math.round((latestTelemetry.northSouthFlow + latestTelemetry.eastWestFlow + latestTelemetry.expresswayFlow) * 60);

  // Corridor Distribution Chart Data
  const corridorBarData = useMemo(() => {
    return INITIAL_CORRIDORS.map((c) => ({
      name: c.name.split(' ')[0],
      inflow: c.inflowVpm,
      outflow: c.outflowVpm,
      capacity: c.capacityRatio,
      speed: c.avgSpeedKmh,
      queue: c.queueMeters
    }));
  }, []);

  return (
    <div className="space-y-6 text-left text-gray-100 font-sans select-none animate-in fade-in duration-500">
      
      {/* FLOATING TOAST FEEDBACK */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 right-8 z-50 bg-[#0e1322] border border-[#00FF66]/80 text-white px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(0,255,102,0.3)] flex items-center gap-3 backdrop-blur-md font-mono text-xs"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-ping" />
            <ShieldCheck className="text-[#00FF66]" size={18} />
            <span className="font-bold">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DASHBOARD HEADER & QUICK ACTIONS */}
      <div className="bg-[#090c15] border border-blue-950/80 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-blue-600/10 via-emerald-600/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-900/60 via-gray-900 to-emerald-950/60 rounded-xl border border-blue-500/40 text-blue-400 shadow-inner">
                <Activity size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                  <span>{isZh ? '即時車流量與號誌變更頻率動態儀表盤' : 'Live Traffic Flow & Signal Frequency Telemetry'}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/10 text-[#00FF66] border border-emerald-500/30 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
                    RECHARTS 實時雙軸引擎
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                  {isZh
                    ? '整合多走廊即時車流 (Vehicles/min)、號誌週期切換頻率 (Cycles/Hour)、綠波帶效率與純 CSS 高擬真紅綠燈光學模擬。'
                    : 'Real-time multi-corridor flow telemetry, signal switching frequency metrics, green-wave coordination & pure CSS optical signal simulation.'}
                </p>
              </div>
            </div>
          </div>

          {/* TELEMETRY ENGINE CONTROLS & SCENARIO SWITCHES */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Live Streaming Toggle */}
            <button
              onClick={() => {
                setIsLiveStreaming(!isLiveStreaming);
                triggerToast(isLiveStreaming ? '⏸️ 已暫停即時串流採樣' : '▶️ 已恢復 3 秒即時遙測推播');
              }}
              className={cn(
                'px-3.5 py-2 rounded-xl font-bold border flex items-center gap-2 transition-all shadow-md',
                isLiveStreaming
                  ? 'bg-emerald-950/80 text-[#00FF66] border-emerald-500/60 shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                  : 'bg-gray-900 text-gray-400 border-gray-750 hover:text-white'
              )}
            >
              {isLiveStreaming ? <Pause size={14} /> : <Play size={14} />}
              {isLiveStreaming ? (isZh ? '即時採樣推播中 (3s)' : 'Live Streaming (3s)') : (isZh ? '採樣已暫停' : 'Streaming Paused')}
            </button>

            {/* Traffic Scenario Injection */}
            <div className="flex items-center bg-black/80 p-1 rounded-xl border border-gray-800 gap-1">
              <span className="text-[11px] text-gray-400 px-2 flex items-center gap-1">
                <Flame size={12} className="text-amber-400" />
                {isZh ? '情境模擬:' : 'Scenario:'}
              </span>
              {[
                { id: 'NORMAL', label: isZh ? '常態平峰' : 'Normal' },
                { id: 'RUSH_HOUR', label: isZh ? '尖峰車潮 🚀' : 'Rush Hour' },
                { id: 'ACCIDENT', label: isZh ? '事故瓶頸 ⚠️' : 'Accident' },
                { id: 'RAIN', label: isZh ? '雨天減速 🌧️' : 'Rain' }
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setTrafficScenario(sc.id as any);
                    triggerToast(isZh ? `已切換車流情境至 [${sc.label}]` : `Set scenario to ${sc.label}`);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                    trafficScenario === sc.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Manual Fast Forward Next Phase */}
            <button
              onClick={() => {
                setPhaseSecondsLeft(1);
                triggerToast(isZh ? '⚡ 強制加速號誌相態切換！' : 'Fast-forwarding to next phase');
              }}
              className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-cyan-400 hover:text-white rounded-xl transition-colors"
              title={isZh ? '手動跳至下一相態' : 'Next Phase'}
            >
              <FastForward size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* TOP 4 KEY TELEMETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Hourly Traffic */}
        <div className="bg-[#0b0e17] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded-xl text-blue-400">
              <Car size={20} />
            </div>
            <span className="text-[10px] font-mono bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50 flex items-center gap-1">
              <ArrowUpRight size={12} className="text-emerald-400" />
              +12.4% vs. 昨日
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '全走廊即時總車流率' : 'Total Inflow Rate'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-white font-mono">{totalHourlyFlow.toLocaleString()}</h3>
              <span className="text-xs text-gray-500 font-mono">輛/小時 (Veh/hr)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>南北主幹: {latestTelemetry.northSouthFlow} vpm</span>
            <span>東西支線: {latestTelemetry.eastWestFlow} vpm</span>
          </div>
        </div>

        {/* Metric 2: Signal Switch Frequency */}
        <div className="bg-[#0b0e17] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-950/60 border border-amber-500/30 rounded-xl text-amber-400">
              <Signal size={20} />
            </div>
            <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/50">
              {signalCycleCount} 累計週期
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '號誌時相變更頻率' : 'Signal Switch Frequency'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-amber-400 font-mono">{latestTelemetry.signalFrequency}</h3>
              <span className="text-xs text-gray-500 font-mono">次/小時 (Cycles/hr)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>平均週期時基: 126 秒</span>
            <span className="text-emerald-400">NTCIP 1202 鎖定</span>
          </div>
        </div>

        {/* Metric 3: Green Wave Progression & Coordination */}
        <div className="bg-[#0b0e17] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[#00FF66]">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-mono bg-emerald-950/80 text-[#00FF66] px-2 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              雙向連鎖正常
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '綠波帶連續通行效率' : 'Green Wave Efficiency'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-[#00FF66] font-mono">{latestTelemetry.greenEfficiency}%</h3>
              <span className="text-xs text-gray-400 font-mono">/ 100% (極優)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>停等車隊長度: {latestTelemetry.queueLengthMeters}m</span>
            <span className="text-[#00FF66]">0 次非預期急煞</span>
          </div>
        </div>

        {/* Metric 4: Corridor Speed & Flow State */}
        <div className="bg-[#0b0e17] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-950/60 border border-purple-500/30 rounded-xl text-purple-400">
              <Gauge size={20} />
            </div>
            <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50">
              LOS 等級: B (良好)
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '幹道動態平均車速' : 'Corridor Average Speed'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-purple-300 font-mono">{latestTelemetry.avgSpeedKmh}</h3>
              <span className="text-xs text-gray-500 font-mono">公里/小時 (km/h)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>市區速限: 50 km/h</span>
            <span className="text-purple-400">速差比: 92%</span>
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* MAIN DUAL SECTION:                                                    */}
      {/* LEFT: RECHARTS DUAL-AXIS REAL-TIME LINE & AREA CHARTS                 */}
      {/* RIGHT: REALISTIC CSS SIMULATED TRAFFIC LIGHT SIGNAL CLUSTER           */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT 8 COLS: RECHARTS REAL-TIME TELEMETRY CHARTS */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* PRIMARY RECHARTS CHART: REAL-TIME TRAFFIC FLOW & SIGNAL FREQUENCY */}
          <div className="bg-[#07090f] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800 gap-3">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity size={16} className="text-[#00FF66]" />
                  <span>{isZh ? '即時車流量 vs. 號誌變更頻率雙軸時序圖' : 'Real-Time Flow vs. Signal Change Frequency (Dual Axis)'}</span>
                </h4>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {isZh ? '綠線/藍線為雙向車流量 (輛/分，左軸)；金黃色折線為號誌相態切換頻率 (次/小時，右軸)' : 'Left Axis: Traffic Flow (Veh/min) | Right Axis: Signal Switch Frequency (Cycles/hr)'}
                </p>
              </div>

              {/* Time Span Filter */}
              <div className="flex items-center bg-black/80 p-1 rounded-xl border border-gray-800 text-[11px] font-mono">
                {[
                  { id: '5m', label: isZh ? '即時 5 分鐘' : '5m Live' },
                  { id: '1h', label: isZh ? '1 小時' : '1h' },
                  { id: '24h', label: isZh ? '24 小時' : '24h' },
                  { id: '7d', label: isZh ? '7 日趨勢' : '7D' }
                ].map((span) => (
                  <button
                    key={span.id}
                    onClick={() => {
                      setTimeSpan(span.id as any);
                      triggerToast(isZh ? `已切換時序視角至 [${span.label}]` : `Changed span to ${span.label}`);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-bold transition-all',
                      timeSpan === span.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    {span.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Series Toggle Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="text-gray-500">{isZh ? '圖表曲線切換:' : 'Series Filter:'}</span>
              
              <button
                onClick={() => setVisibleSeries((p) => ({ ...p, nsFlow: !p.nsFlow }))}
                className={cn(
                  'px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all',
                  visibleSeries.nsFlow
                    ? 'bg-emerald-950/80 text-[#00FF66] border-emerald-500/60 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                    : 'bg-gray-900 text-gray-500 border-gray-800'
                )}
              >
                <div className="w-2 h-2 rounded-full bg-[#00FF66]" />
                南北向車流 (博愛一路)
              </button>

              <button
                onClick={() => setVisibleSeries((p) => ({ ...p, ewFlow: !p.ewFlow }))}
                className={cn(
                  'px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all',
                  visibleSeries.ewFlow
                    ? 'bg-blue-950/80 text-blue-400 border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-gray-900 text-gray-500 border-gray-800'
                )}
              >
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                東西向車流 (中正路)
              </button>

              <button
                onClick={() => setVisibleSeries((p) => ({ ...p, signalFreq: !p.signalFreq }))}
                className={cn(
                  'px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all',
                  visibleSeries.signalFreq
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-gray-900 text-gray-500 border-gray-800'
                )}
              >
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                號誌切換頻率 (次/時)
              </button>

              <button
                onClick={() => setVisibleSeries((p) => ({ ...p, greenEff: !p.greenEff }))}
                className={cn(
                  'px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all',
                  visibleSeries.greenEff
                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/60 shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                    : 'bg-gray-900 text-gray-500 border-gray-800'
                )}
              >
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                綠波通行率 (%)
              </button>
            </div>

            {/* RECHARTS COMPOSED / LINE CHART CONTAINER */}
            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={telemetryData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientNSFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF66" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00FF66" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientEWFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  
                  {/* Left Y Axis: Traffic Flow (Vehicles / min) */}
                  <YAxis
                    yAxisId="left"
                    stroke="#00FF66"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="monospace"
                    domain={[0, 100]}
                    unit=" vpm"
                  />

                  {/* Right Y Axis: Signal Frequency & Green Efficiency */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#f59e0b"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="monospace"
                    domain={[0, 120]}
                    unit=" cyc"
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c101c',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '0 0 25px rgba(0,0,0,0.8)',
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: any, name: string) => {
                      if (name === '南北向車流 (博愛一路)') return [`${value} 輛/分`, name];
                      if (name === '東西向車流 (中正路)') return [`${value} 輛/分`, name];
                      if (name === '號誌切換頻率') return [`${value} 次/小時`, name];
                      if (name === '綠波通行效率') return [`${value} %`, name];
                      return [value, name];
                    }}
                  />

                  {/* North-South Area Flow */}
                  {visibleSeries.nsFlow && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="northSouthFlow"
                      name="南北向車流 (博愛一路)"
                      stroke="#00FF66"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradientNSFlow)"
                      isAnimationActive={false}
                      dot={{ r: 3, fill: '#00FF66', strokeWidth: 1, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#00FF66', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {/* East-West Area Flow */}
                  {visibleSeries.ewFlow && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="eastWestFlow"
                      name="東西向車流 (中正路)"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradientEWFlow)"
                      isAnimationActive={false}
                      dot={{ r: 3, fill: '#38bdf8' }}
                    />
                  )}

                  {/* Signal Frequency Line (Right Axis) */}
                  {visibleSeries.signalFreq && (
                    <Line
                      yAxisId="right"
                      type="stepAfter"
                      dataKey="signalFrequency"
                      name="號誌切換頻率"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={{ r: 4, fill: '#f59e0b', stroke: '#000000' }}
                      isAnimationActive={false}
                    />
                  )}

                  {/* Green Efficiency Line (Right Axis) */}
                  {visibleSeries.greenEff && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="greenEfficiency"
                      name="綠波通行效率"
                      stroke="#c084fc"
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Insight Bar */}
            <div className="p-3 bg-black/60 rounded-xl border border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-gray-400">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span>
                  {isZh
                    ? 'AI 號誌動態評估：博愛一路幹道目前綠信比為 55%，號誌變更頻率處於平穩自適應區間 (28.5 次/hr)。'
                    : 'AI Signal Assessment: Green split ratio at 55%, switch frequency stable at 28.5 cycles/hr.'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-[#00FF66] font-bold">● 綠波相鎖定</span>
                <span className="text-blue-400 font-bold">● 無相撞衝突</span>
              </div>
            </div>

          </div>

          {/* SECONDARY RECHARTS ROW: 4 CORRIDOR TRAFFIC FLOW DISTRIBUTION */}
          <div className="bg-[#07090f] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-blue-400" />
                  <span>{isZh ? '4 大主要走廊車流負載與停等長度對比' : 'Multi-Corridor Flow & Queue Breakdown'}</span>
                </h4>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {isZh ? '各交通分區進出流量 (vpm)、容量佔有率 (%) 與停等車隊長度 (m)' : 'Inflow, Outflow, Capacity Utilization and Queue Length'}
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 border border-blue-800/50 text-blue-300 rounded">
                4 核心走廊監控
              </span>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={corridorBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c101c',
                      border: '1px solid #1e293b',
                      borderRadius: '10px',
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Bar dataKey="inflow" name="進入流量 (vpm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" name="流出流量 (vpm)" fill="#00FF66" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="queue" name="排隊長度 (m)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT 4 COLS: CSS SIMULATED REALISTIC TRAFFIC SIGNAL CLUSTER */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* TRAFFIC LIGHT HOUSING & SIMULATOR ENCLOSURE */}
          <div className="bg-[#07090e] border-2 border-gray-800 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#00FF66] animate-ping" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                      {isZh ? 'CSS 光學模擬紅綠燈號誌燈柱' : 'CSS Optical Signal Head Simulator'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {isZh ? '智慧實體燈號連動 (NEMA 3-Aspect + 箭頭 + 行人)' : 'NEMA 3-Aspect + Protected Left + Pedestrian'}
                    </p>
                  </div>
                </div>

                <div className="px-2 py-0.5 bg-gray-900 border border-gray-700 text-cyan-400 rounded text-[10px] font-mono font-bold">
                  {currentPhase}
                </div>
              </div>

              {/* SIGNAL VISUAL DISPLAY: AUTHENTIC NEMA TRAFFIC SIGNAL HOUSING */}
              <div className="my-5 flex flex-col items-center justify-center">
                
                {/* Traffic Signal Outer Enclosure / Backplate with Zebra Border */}
                <div className="relative p-4 rounded-3xl bg-[#12151c] border-4 border-[#252b3b] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.1)] flex flex-col items-center gap-4">
                  
                  {/* Visor Mount Accent */}
                  <div className="absolute -top-3 w-16 h-3 bg-[#0a0d14] rounded-t-lg border-t border-gray-600" />
                  
                  {/* DIGITAL 7-SEGMENT COUNTDOWN DISPLAY */}
                  <div className="w-24 bg-black/90 border-2 border-gray-800 rounded-xl py-1.5 px-3 flex flex-col items-center shadow-inner">
                    <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">COUNTDOWN</span>
                    <span
                      className={cn(
                        'text-2xl font-black font-mono tracking-widest',
                        currentPhase.includes('RED')
                          ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                          : currentPhase.includes('YELLOW')
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                          : 'text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]'
                      )}
                    >
                      {phaseSecondsLeft < 10 ? `0${phaseSecondsLeft}` : phaseSecondsLeft}s
                    </span>
                  </div>

                  {/* 1. RED SIGNAL LAMP WITH HOOD/VISOR (紅燈) */}
                  <div className="relative group">
                    {/* Upper Hood / Visor Shadow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-gradient-to-b from-[#1a1e28] to-transparent rounded-t-full pointer-events-none z-10" />
                    
                    <div
                      className={cn(
                        'w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center relative overflow-hidden',
                        currentPhase.startsWith('EW') || currentPhase === 'ALL_RED' || currentPhase === 'EMERGENCY_CORRIDOR'
                          ? 'bg-gradient-to-br from-[#ff3b30] via-[#ef4444] to-[#b91c1c] border-red-300 shadow-[0_0_35px_rgba(239,68,68,1),0_0_70px_rgba(239,68,68,0.5),inset_0_0_20px_rgba(255,255,255,0.7)]'
                          : 'bg-[#180909] border-[#2f1313] opacity-35'
                      )}
                    >
                      {/* Hexagonal LED Texture overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] opacity-40" />
                      {/* Specular Highlight */}
                      <div className="absolute top-2 left-4 w-6 h-3 bg-white/40 rounded-full blur-[1px] transform -rotate-45" />
                      <span className="text-[9px] font-black font-mono text-white/90 drop-shadow select-none">
                        {currentPhase.startsWith('EW') || currentPhase === 'ALL_RED' ? 'STOP' : ''}
                      </span>
                    </div>
                  </div>

                  {/* 2. AMBER / YELLOW SIGNAL LAMP WITH HOOD (黃燈) */}
                  <div className="relative group">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-gradient-to-b from-[#1a1e28] to-transparent rounded-t-full pointer-events-none z-10" />
                    
                    <div
                      className={cn(
                        'w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center relative overflow-hidden',
                        currentPhase.includes('YELLOW') || currentPhase === 'FLASHING_YELLOW'
                          ? 'bg-gradient-to-br from-[#fde047] via-[#f59e0b] to-[#d97706] border-amber-200 shadow-[0_0_35px_rgba(245,158,11,1),0_0_70px_rgba(245,158,11,0.5),inset_0_0_20px_rgba(255,255,255,0.8)] animate-pulse'
                          : 'bg-[#1a1708] border-[#312b12] opacity-35'
                      )}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] opacity-40" />
                      <div className="absolute top-2 left-4 w-6 h-3 bg-white/40 rounded-full blur-[1px] transform -rotate-45" />
                      <span className="text-[9px] font-black font-mono text-amber-950/90 drop-shadow select-none">
                        {currentPhase.includes('YELLOW') ? 'CLEAR' : ''}
                      </span>
                    </div>
                  </div>

                  {/* 3. GREEN SIGNAL LAMP WITH HOOD (綠燈) */}
                  <div className="relative group">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-gradient-to-b from-[#1a1e28] to-transparent rounded-t-full pointer-events-none z-10" />
                    
                    <div
                      className={cn(
                        'w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center relative overflow-hidden',
                        currentPhase === 'NS_GREEN'
                          ? 'bg-gradient-to-br from-[#00FF66] via-[#10b981] to-[#047857] border-emerald-200 shadow-[0_0_40px_rgba(0,255,102,1),0_0_80px_rgba(0,255,102,0.5),inset_0_0_20px_rgba(255,255,255,0.8)]'
                          : 'bg-[#09180f] border-[#132d1e] opacity-35'
                      )}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] opacity-40" />
                      <div className="absolute top-2 left-4 w-6 h-3 bg-white/40 rounded-full blur-[1px] transform -rotate-45" />
                      <span className="text-[9px] font-black font-mono text-emerald-950/90 drop-shadow select-none">
                        {currentPhase === 'NS_GREEN' ? 'GO' : ''}
                      </span>
                    </div>
                  </div>

                  {/* 4. PROTECTED TURN ARROWS & PEDESTRIAN INDICATOR ROW */}
                  <div className="flex items-center gap-3 pt-1 border-t border-gray-800/80">
                    
                    {/* Protected Left Turn Arrow */}
                    <div
                      title="左轉專用保護箭頭號誌"
                      className={cn(
                        'w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all',
                        currentPhase === 'NS_GREEN' && leftTurnArrowActive
                          ? 'bg-[#00FF66] border-emerald-300 text-emerald-950 shadow-[0_0_20px_#00FF66]'
                          : 'bg-[#09180f] border-gray-800 text-gray-700'
                      )}
                    >
                      <ArrowLeft size={18} className="font-bold stroke-[3]" />
                    </div>

                    {/* Pedestrian Walk / Don't Walk Animated Indicator */}
                    <div
                      title="行人穿越專用號誌"
                      className={cn(
                        'w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center transition-all p-1',
                        pedestrianWalkActive && currentPhase === 'NS_GREEN'
                          ? 'bg-emerald-950 border-emerald-400 text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.6)]'
                          : 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                      )}
                    >
                      {pedestrianWalkActive && currentPhase === 'NS_GREEN' ? (
                        <div className="flex flex-col items-center animate-bounce">
                          <span className="text-[8px] font-black">WALK</span>
                          <span className="text-[10px]">🚶‍♂️</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black">WAIT</span>
                          <span className="text-[10px]">🛑</span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>

              {/* 4-DIRECTION LIVE MINI MONITOR */}
              <div className="p-3.5 bg-black/70 rounded-xl border border-gray-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 border-b border-gray-800/80 pb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Compass size={13} className="text-blue-400" />
                    {isZh ? '4 向路口燈態同步監控' : '4-Way Synchronized Aspect Matrix'}
                  </span>
                  <span className="text-emerald-400">MMU 互鎖安全</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 bg-[#0e121c] rounded-lg border border-gray-850 flex items-center justify-between">
                    <span className="text-gray-400">北向 (博愛一路):</span>
                    <span className={cn('font-bold px-1.5 py-0.5 rounded', currentPhase.startsWith('NS') && currentPhase.includes('GREEN') ? 'bg-emerald-950 text-[#00FF66]' : 'bg-red-950 text-red-400')}>
                      {currentPhase.startsWith('NS') ? (currentPhase === 'NS_GREEN' ? '● 綠燈 GO' : '● 黃燈') : '● 紅燈 STOP'}
                    </span>
                  </div>

                  <div className="p-2 bg-[#0e121c] rounded-lg border border-gray-850 flex items-center justify-between">
                    <span className="text-gray-400">南向 (博愛一路):</span>
                    <span className={cn('font-bold px-1.5 py-0.5 rounded', currentPhase.startsWith('NS') && currentPhase.includes('GREEN') ? 'bg-emerald-950 text-[#00FF66]' : 'bg-red-950 text-red-400')}>
                      {currentPhase.startsWith('NS') ? (currentPhase === 'NS_GREEN' ? '● 綠燈 GO' : '● 黃燈') : '● 紅燈 STOP'}
                    </span>
                  </div>

                  <div className="p-2 bg-[#0e121c] rounded-lg border border-gray-850 flex items-center justify-between">
                    <span className="text-gray-400">東向 (中正路):</span>
                    <span className={cn('font-bold px-1.5 py-0.5 rounded', currentPhase.startsWith('EW') && currentPhase.includes('GREEN') ? 'bg-emerald-950 text-[#00FF66]' : 'bg-red-950 text-red-400')}>
                      {currentPhase.startsWith('EW') ? (currentPhase === 'EW_GREEN' ? '● 綠燈 GO' : '● 黃燈') : '● 紅燈 STOP'}
                    </span>
                  </div>

                  <div className="p-2 bg-[#0e121c] rounded-lg border border-gray-850 flex items-center justify-between">
                    <span className="text-gray-400">西向 (中正路):</span>
                    <span className={cn('font-bold px-1.5 py-0.5 rounded', currentPhase.startsWith('EW') && currentPhase.includes('GREEN') ? 'bg-emerald-950 text-[#00FF66]' : 'bg-red-950 text-red-400')}>
                      {currentPhase.startsWith('EW') ? (currentPhase === 'EW_GREEN' ? '● 綠燈 GO' : '● 黃燈') : '● 紅燈 STOP'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* MANUAL INTERACTIVE CONTROLS FOR SIGNAL */}
            <div className="pt-4 border-t border-gray-800 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                  <Sliders size={13} className="text-cyan-400" />
                  {isZh ? '號誌時相直接操控' : 'Manual Aspect Control'}
                </span>
                
                <button
                  onClick={() => {
                    setManualOverrideMode(!manualOverrideMode);
                    triggerToast(manualOverrideMode ? '✅ 恢復 SCADA 自動排程時制' : '⚠️ 已進入手動強制模式');
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1',
                    manualOverrideMode ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-gray-900 text-gray-400 border-gray-750'
                  )}
                >
                  {manualOverrideMode ? <Unlock size={10} /> : <Lock size={10} />}
                  {manualOverrideMode ? '手動模式中' : 'SCADA 自動'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setCurrentPhase('NS_GREEN');
                    setPhaseSecondsLeft(45);
                    setPedestrianWalkActive(true);
                    triggerToast(isZh ? '🚦 手動強制：南北向綠燈通行' : 'Forced NS Green');
                  }}
                  className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-[#00FF66] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowUp size={13} />
                  南北綠燈
                </button>

                <button
                  onClick={() => {
                    setCurrentPhase('EW_GREEN');
                    setPhaseSecondsLeft(35);
                    setPedestrianWalkActive(true);
                    triggerToast(isZh ? '🚦 手動強制：東西向綠燈通行' : 'Forced EW Green');
                  }}
                  className="px-3 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowRight size={13} />
                  東西綠燈
                </button>

                <button
                  onClick={() => {
                    setCurrentPhase('FLASHING_YELLOW');
                    setPhaseSecondsLeft(99);
                    triggerToast(isZh ? '⚠️ 手動強制：全路口閃黃燈 (夜間模式)' : 'Forced Flashing Yellow');
                  }}
                  className="px-3 py-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle size={13} />
                  夜間閃黃
                </button>

                <button
                  onClick={() => {
                    setCurrentPhase('ALL_RED');
                    setPhaseSecondsLeft(15);
                    setPedestrianWalkActive(false);
                    triggerToast(isZh ? '🛑 手動強制：全路口全紅清空 (All Red Clearance)' : 'Forced All Red');
                  }}
                  className="px-3 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert size={13} />
                  全紅清道
                </button>
              </div>

              {/* Green Extension Slider */}
              <div className="p-2.5 bg-black/60 rounded-xl border border-gray-800 space-y-1.5 text-[10px]">
                <div className="flex justify-between text-gray-400">
                  <span>幹道動態綠燈延長 (Green Extension):</span>
                  <span className="text-[#00FF66] font-bold">+{greenExtensionSec} 秒</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={greenExtensionSec}
                  onChange={(e) => {
                    setGreenExtensionSec(Number(e.target.value));
                    triggerToast(isZh ? `已設定綠燈延長 +${e.target.value}s` : `Green extension +${e.target.value}s`);
                  }}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00FF66]"
                />
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* BOTTOM SECTION: CORRIDOR AUDIT TABLE & EXPORT */}
      <div className="bg-[#07090f] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800 gap-3">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <span>{isZh ? '路網走廊車流與號誌執行審計表 (Corridor Execution Telemetry)' : 'Corridor Execution Telemetry'}</span>
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isZh ? '即時紀錄各走廊服務水準 (LOS)、通訊協議與容量飽和比率' : 'Real-time LOS and protocol diagnostics'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerToast(isZh ? '📥 已成功匯出 CSV 即時車流與號誌日誌！' : 'Exported telemetry CSV');
              }}
              className="px-3.5 py-1.5 bg-gray-850 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} />
              {isZh ? '匯出 CSV 日誌' : 'Export CSV'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/60 text-gray-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">走廊名稱 / 區域</th>
                <th className="p-3.5">流入/流出量 (vpm)</th>
                <th className="p-3.5">容量飽和度</th>
                <th className="p-3.5">平均車速</th>
                <th className="p-3.5">停等長度</th>
                <th className="p-3.5">服務水準 (LOS)</th>
                <th className="p-3.5 text-right">即時診斷</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {INITIAL_CORRIDORS.map((c) => (
                <tr key={c.id} className="hover:bg-gray-850/40 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-[10px] text-gray-500">{c.zone}</div>
                  </td>
                  <td className="p-3.5 font-bold">
                    <span className="text-blue-400">{c.inflowVpm}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-[#00FF66]">{c.outflowVpm}</span>
                    <span className="text-gray-500 text-[10px] ml-1">vpm</span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div
                          className={cn('h-full', c.capacityRatio > 80 ? 'bg-red-500' : c.capacityRatio > 65 ? 'bg-amber-400' : 'bg-[#00FF66]')}
                          style={{ width: `${c.capacityRatio}%` }}
                        />
                      </div>
                      <span className="text-gray-300 font-bold">{c.capacityRatio}%</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-purple-300 font-bold">{c.avgSpeedKmh} km/h</td>
                  <td className="p-3.5 text-amber-400 font-bold">{c.queueMeters} m</td>
                  <td className="p-3.5">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        c.status === 'Smooth'
                          ? 'bg-emerald-950 text-[#00FF66] border-emerald-800'
                          : c.status === 'Normal'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      )}
                    >
                      {c.status === 'Smooth' ? 'LOS A (暢通)' : c.status === 'Normal' ? 'LOS B (正常)' : 'LOS D (壅塞)'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedCorridorId(c.id);
                        triggerToast(isZh ? `已選定 [${c.name}] 進行詳細遙測追蹤！` : `Inspecting ${c.name}`);
                      }}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg text-[11px] font-bold transition-all"
                    >
                      {isZh ? '鎖定追蹤' : 'Track'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

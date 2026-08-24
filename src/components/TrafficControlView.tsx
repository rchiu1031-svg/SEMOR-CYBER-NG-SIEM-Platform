import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrafficCone,
  Signal,
  Radio,
  Activity,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Server,
  Cpu,
  Database,
  Network,
  MessageSquare,
  ArrowRightLeft,
  Gauge,
  Wind,
  Video,
  Maximize2,
  Minimize2,
  Settings2,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Lock,
  Unlock,
  Eye,
  Download,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  Sliders,
  SlidersHorizontal,
  Terminal,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Box,
  Compass,
  Zap,
  Flame,
  HardDrive,
  Wifi,
  WifiOff,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  Car,
  Siren,
  AlertOctagon,
  HelpCircle,
  FileCode,
  Monitor,
  EyeOff,
  Sun,
  CloudRain,
  Volume2,
  VolumeX,
  FastForward,
  Rewind
} from 'lucide-react';
import { cn } from '../lib/utils';

// =========================================================================
// DATA STRUCTURES & INTERFACES
// =========================================================================

export type TrafficTab = 'intersection' | 'cms_matrix' | 'scada_topology' | 'ics_security' | 'cctv_vision';

export interface TrafficSensor {
  id: string;
  name: string;
  type: 'CMS' | 'LCS' | 'VSLS' | 'FAFYL' | 'ISC' | 'CCTV' | 'NPM' | 'RADAR' | 'WEATHER';
  zone: string;
  ip: string;
  mac: string;
  protocol: 'NTCIP 1202' | 'NTCIP 1209' | 'Modbus TCP' | 'DNP3' | 'SNMP v3' | 'RTSP/H.265' | 'S7Comm';
  status: 'Online' | 'Offline' | 'Alert' | 'Maintenance';
  trafficLoad: string;
  latencyMs: number;
  lastUpdate: string;
  hubId: string;
  tamperProtection: 'Active' | 'Warning' | 'Disabled';
  firmware: string;
  cves: string[];
  metrics: {
    temp?: number;
    voltage?: number;
    packetLoss?: number;
  };
}

export interface PhaseTiming {
  phaseId: number;
  direction: 'North-South' | 'East-West' | 'North-South Left' | 'East-West Left';
  state: 'RED' | 'YELLOW' | 'GREEN' | 'FLASHING_YELLOW';
  countdownSec: number;
  maxGreenSec: number;
  minGreenSec: number;
  yellowSec: number;
  allRedSec: number;
  pedestrianState: 'WALK' | 'FLASHING_DONT_WALK' | 'DONT_WALK';
  vehicleCount: number;
  occupancyPercent: number;
}

export interface CMSPreset {
  id: string;
  title: string;
  category: 'traffic' | 'weather' | 'emergency' | 'roadwork';
  line1: string;
  line2: string;
  color: 'amber' | 'red' | 'green';
  signType: 'LED_DOT_MATRIX';
}

export interface ICSAuditLog {
  id: string;
  timestamp: string;
  protocol: 'NTCIP 1202' | 'Modbus TCP' | 'DNP3' | 'SNMP v3';
  sourceIp: string;
  destIp: string;
  unitId: number;
  functionCode: string;
  functionDesc: string;
  registerAddress: string;
  valueHex: string;
  safetyStatus: 'Authorized' | 'Suspicious' | 'Blocked (Tamper)' | 'Policy Violation';
  mitreTtp?: string;
  description: string;
}

export interface CCTVFeed {
  id: string;
  name: string;
  location: string;
  ip: string;
  resolution: string;
  fps: number;
  status: 'Streaming' | 'Degraded' | 'Offline';
  aiDetections: {
    cars: number;
    trucks: number;
    buses: number;
    motorcycles: number;
    pedestrians: number;
    avgSpeedKmh: number;
    queueLengthMeters: number;
  };
  anomalyFlag: boolean;
  anomalyReason?: string;
}

// Initial Sensor Fleet
const INITIAL_SENSORS: TrafficSensor[] = [
  {
    id: 'ISC-01',
    name: '中正路/博愛一路 智慧號誌控制器 (ISC-01)',
    type: 'ISC',
    zone: '中正核心路段 (Zone-A)',
    ip: '10.88.10.12',
    mac: '00:1E:C0:92:11:4A',
    protocol: 'NTCIP 1202',
    status: 'Online',
    trafficLoad: '2.4 Mbps',
    latencyMs: 11,
    lastUpdate: '剛剛 (1s ago)',
    hubId: 'HUB-01',
    tamperProtection: 'Active',
    firmware: 'v4.18.2-MIL',
    cves: [],
    metrics: { temp: 42, voltage: 220.4, packetLoss: 0.01 }
  },
  {
    id: 'CMS-01',
    name: '信義快速道路入口 資訊可變標誌看板 (CMS-01)',
    type: 'CMS',
    zone: '高架快速走廊 (Zone-B)',
    ip: '10.88.20.15',
    mac: '00:1E:C0:88:32:1B',
    protocol: 'NTCIP 1209',
    status: 'Online',
    trafficLoad: '1.2 Mbps',
    latencyMs: 14,
    lastUpdate: '2 秒前',
    hubId: 'HUB-01',
    tamperProtection: 'Active',
    firmware: 'v3.90.1',
    cves: [],
    metrics: { temp: 45, voltage: 221.0, packetLoss: 0.02 }
  },
  {
    id: 'LCS-05',
    name: '中央隧道南向 車道管制號誌陣列 (LCS-05)',
    type: 'LCS',
    zone: '隧道安全管制區 (Zone-C)',
    ip: '10.88.30.22',
    mac: '00:1E:C0:77:44:2C',
    protocol: 'Modbus TCP',
    status: 'Online',
    trafficLoad: '0.8 Mbps',
    latencyMs: 18,
    lastUpdate: '5 秒前',
    hubId: 'HUB-02',
    tamperProtection: 'Active',
    firmware: 'v2.88-OT',
    cves: [],
    metrics: { temp: 38, voltage: 219.5, packetLoss: 0.0 }
  },
  {
    id: 'VSLS-12',
    name: '國道一號 35K 動態可變速限標誌 (VSLS-12)',
    type: 'VSLS',
    zone: '主線高速公路 (Zone-D)',
    ip: '10.88.40.18',
    mac: '00:1E:C0:66:55:3D',
    protocol: 'Modbus TCP',
    status: 'Online',
    trafficLoad: '0.5 Mbps',
    latencyMs: 16,
    lastUpdate: '10 秒前',
    hubId: 'HUB-02',
    tamperProtection: 'Active',
    firmware: 'v3.12.0',
    cves: [],
    metrics: { temp: 41, voltage: 220.1, packetLoss: 0.05 }
  },
  {
    id: 'FAFYL-03',
    name: '林口台地濃霧區 智慧閃黃燈控制器 (FAFYL-03)',
    type: 'FAFYL',
    zone: '濃霧特殊氣候區 (Zone-E)',
    ip: '10.88.50.09',
    mac: '00:1E:C0:55:66:4E',
    protocol: 'Modbus TCP',
    status: 'Offline',
    trafficLoad: '0 Mbps',
    latencyMs: 999,
    lastUpdate: '15 分鐘前 (連線逾時)',
    hubId: 'HUB-03',
    tamperProtection: 'Warning',
    firmware: 'v1.94-LEGACY',
    cves: ['CVE-2023-38545'],
    metrics: { temp: 33, voltage: 204.2, packetLoss: 100.0 }
  },
  {
    id: 'CCTV-22',
    name: '仁愛圓環 高解析全景 AI 車流辨識攝影機 (CCTV-22)',
    type: 'CCTV',
    zone: '中正核心路段 (Zone-A)',
    ip: '10.88.10.88',
    mac: '00:1E:C0:44:77:5F',
    protocol: 'RTSP/H.265',
    status: 'Online',
    trafficLoad: '15.4 Mbps',
    latencyMs: 8,
    lastUpdate: '即時串流 (30 FPS)',
    hubId: 'HUB-01',
    tamperProtection: 'Active',
    firmware: 'v5.04.1-AI',
    cves: [],
    metrics: { temp: 47, voltage: 220.8, packetLoss: 0.0 }
  },
  {
    id: 'NPM-01',
    name: '工業級網路效能與封包深度剖析探針 (NPM-01)',
    type: 'NPM',
    zone: '主控制中心 (HQ-DMZ)',
    ip: '10.88.1.5',
    mac: '00:1E:C0:33:88:6A',
    protocol: 'SNMP v3',
    status: 'Online',
    trafficLoad: '4.8 Mbps',
    latencyMs: 2,
    lastUpdate: '1 秒前',
    hubId: 'HUB-00',
    tamperProtection: 'Active',
    firmware: 'v6.20.0',
    cves: [],
    metrics: { temp: 36, voltage: 220.0, packetLoss: 0.0 }
  }
];

// Presets for CMS Matrix Sign
const CMS_PRESETS: CMSPreset[] = [
  {
    id: 'cms_p1',
    title: '道路暢通 (Normal Flow)',
    category: 'traffic',
    line1: '國道全線通暢',
    line2: '行車平安 祝您順風',
    color: 'green',
    signType: 'LED_DOT_MATRIX'
  },
  {
    id: 'cms_p2',
    title: '前方施工減速 (Roadwork Warning)',
    category: 'roadwork',
    line1: '前方 2KM 外側施工',
    line2: '速限 40 請減速慢行',
    color: 'amber',
    signType: 'LED_DOT_MATRIX'
  },
  {
    id: 'cms_p3',
    title: '濃霧警報 (Heavy Fog Advisory)',
    category: 'weather',
    line1: '濃霧能見度低於 50M',
    line2: '開啟霧燈 拉大車距',
    color: 'amber',
    signType: 'LED_DOT_MATRIX'
  },
  {
    id: 'cms_p4',
    title: '重大事故封閉 (Critical Incident Closure)',
    category: 'emergency',
    line1: '主線全線封閉',
    line2: '請配合改道 行駛替代道路',
    color: 'red',
    signType: 'LED_DOT_MATRIX'
  },
  {
    id: 'cms_p5',
    title: '防空民防演習廣播 (Civil Defense Alert)',
    category: 'emergency',
    line1: '防空演習 號誌管制',
    line2: '車輛靠邊 依指揮避難',
    color: 'red',
    signType: 'LED_DOT_MATRIX'
  }
];

// ICS Protocol Audit Logs
const INITIAL_ICS_LOGS: ICSAuditLog[] = [
  {
    id: 'log_001',
    timestamp: '10:48:32.140',
    protocol: 'NTCIP 1202',
    sourceIp: '10.88.1.100 (Central SCADA)',
    destIp: '10.88.10.12 (ISC-01)',
    unitId: 1,
    functionCode: 'SET_SPLIT_PLAN',
    functionDesc: '設定路口時相時制表 (Plan #3: 尖峰時相 120s)',
    registerAddress: '0x1202:PhaseTimingTable',
    valueHex: '0x00 0x78 0x00 0x28 0x00 0x14',
    safetyStatus: 'Authorized',
    description: '中央號誌排程引擎常規尖峰相態切換指令，校驗通過。'
  },
  {
    id: 'log_002',
    timestamp: '10:48:29.880',
    protocol: 'Modbus TCP',
    sourceIp: '192.168.99.45 (Unauthorized Pivot)',
    destIp: '10.88.20.15 (CMS-01)',
    unitId: 2,
    functionCode: '0x10 (Write Multiple Registers)',
    functionDesc: '企圖竄改 CMS 標誌看板顯示字元暫存器',
    registerAddress: '40001 - 40064',
    valueHex: '0x48 0x41 0x43 0x4B 0x45 0x44 0x21',
    safetyStatus: 'Blocked (Tamper)',
    mitreTtp: 'T0855 Unauthorized Command Message',
    description: '偵測到非授權來源 IP 嘗試進行 Modbus 惡意塗鴉寫入，已被 SEMOR 工控防火牆即時阻斷！'
  },
  {
    id: 'log_003',
    timestamp: '10:48:20.510',
    protocol: 'NTCIP 1202',
    sourceIp: '10.88.10.12 (ISC-01)',
    destIp: '10.88.1.100 (Central SCADA)',
    unitId: 1,
    functionCode: 'REPORT_STATUS',
    functionDesc: '回傳 MMU/CMU 防衝突安全連鎖單元心跳檢測',
    registerAddress: '0x1202:ConflictMonitor',
    valueHex: '0x00 0x00 (NO_CONFLICT_DETECTED)',
    safetyStatus: 'Authorized',
    description: '路口硬體衝突監控儀 (Conflict Monitor Unit) 回報各方向綠燈互鎖正常，無綠燈相撞衝突。'
  },
  {
    id: 'log_004',
    timestamp: '10:48:15.220',
    protocol: 'Modbus TCP',
    sourceIp: '10.88.1.100 (Central SCADA)',
    destIp: '10.88.40.18 (VSLS-12)',
    unitId: 4,
    functionCode: '0x06 (Write Single Register)',
    functionDesc: '更新可變速限標誌數值 (VSLS: 80 km/h)',
    registerAddress: '40102',
    valueHex: '0x00 0x50',
    safetyStatus: 'Authorized',
    description: '天候自適應引擎下發雨天降速指令至國道主線標誌。'
  },
  {
    id: 'log_005',
    timestamp: '10:47:58.010',
    protocol: 'DNP3',
    sourceIp: '10.88.30.22 (LCS-05)',
    destIp: '10.88.1.100 (Central SCADA)',
    unitId: 3,
    functionCode: '0x01 (Read Class 1 Data)',
    functionDesc: '上傳隧道車道通行狀態 (Lane 1: Green, Lane 2: Green)',
    registerAddress: 'Point Index 0-3',
    valueHex: '0x01 0x01 0x01 0x00',
    safetyStatus: 'Authorized',
    description: '隧道車道指示器回傳定期狀態遙測。'
  }
];

// CCTV Feeds Data
const INITIAL_CCTV_FEEDS: CCTVFeed[] = [
  {
    id: 'CCTV-01',
    name: '中正路/博愛一路 十字路口 (Cam-North)',
    location: '台北市中正區 (Zone-A)',
    ip: '10.88.10.81',
    resolution: '4K (3840x2160)',
    fps: 30,
    status: 'Streaming',
    aiDetections: {
      cars: 28,
      trucks: 4,
      buses: 3,
      motorcycles: 42,
      pedestrians: 15,
      avgSpeedKmh: 43.5,
      queueLengthMeters: 65
    },
    anomalyFlag: false
  },
  {
    id: 'CCTV-02',
    name: '信義快速道路 高架匯流處 (Cam-East)',
    location: '信義快速道路 1.5K (Zone-B)',
    ip: '10.88.20.82',
    resolution: '1080P (1920x1080)',
    fps: 30,
    status: 'Streaming',
    aiDetections: {
      cars: 64,
      trucks: 12,
      buses: 7,
      motorcycles: 18,
      pedestrians: 0,
      avgSpeedKmh: 72.0,
      queueLengthMeters: 120
    },
    anomalyFlag: true,
    anomalyReason: '偵測到外側車道有微型車輛違規停靠慢速減速 (AI Alert)'
  },
  {
    id: 'CCTV-03',
    name: '中央隧道南口 入口車道 (Cam-Tunnel)',
    location: '中央隧道 0K+200 (Zone-C)',
    ip: '10.88.30.83',
    resolution: '1080P (1920x1080)',
    fps: 25,
    status: 'Streaming',
    aiDetections: {
      cars: 34,
      trucks: 8,
      buses: 2,
      motorcycles: 0,
      pedestrians: 0,
      avgSpeedKmh: 58.5,
      queueLengthMeters: 25
    },
    anomalyFlag: false
  }
];

export default function TrafficControlView() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Navigation State
  const [activeTab, setActiveTab] = useState<TrafficTab>('intersection');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Online' | 'Offline' | 'Alert'>('All');
  const [selectedSensor, setSelectedSensor] = useState<TrafficSensor>(INITIAL_SENSORS[0]);

  // Phase Controller State (Interactive 4-Way Intersection)
  const [currentPhase, setCurrentPhase] = useState<'NS_GREEN' | 'NS_YELLOW' | 'EW_GREEN' | 'EW_YELLOW' | 'FLASHING_YELLOW' | 'EMERGENCY_LOCK'>('NS_GREEN');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(28);
  const [cycleLength] = useState<number>(120);
  const [controlMode, setControlMode] = useState<'AI_ADAPTIVE' | 'MANUAL_FIXED' | 'EMERGENCY_CORRIDOR' | 'CIVIL_DEFENSE_LOCK'>('AI_ADAPTIVE');
  const [cmuSafetyLock, setCmuSafetyLock] = useState<boolean>(true);

  // CMS Matrix Sign State
  const [cmsLine1, setCmsLine1] = useState<string>('前方施工 減速慢行');
  const [cmsLine2, setCmsLine2] = useState<string>('速限 40KM 請依號誌行駛');
  const [cmsColor, setCmsColor] = useState<'amber' | 'red' | 'green'>('amber');
  const [cmsSpeedLimit, setCmsSpeedLimit] = useState<number>(50);
  const [cmsAutoWeather, setCmsAutoWeather] = useState<boolean>(true);

  // LCS Lane Control State (4 Lanes)
  const [laneStates, setLaneStates] = useState<('ARROW_GREEN' | 'MERGE_LEFT' | 'MERGE_RIGHT' | 'CROSS_RED')[]>([
    'ARROW_GREEN',
    'ARROW_GREEN',
    'ARROW_GREEN',
    'CROSS_RED'
  ]);

  // FAFYL Fog Light State
  const [fogVisibilityMeters, setFogVisibilityMeters] = useState<number>(45);
  const [fogStrobeActive, setFogStrobeActive] = useState<boolean>(true);
  const [fogStrobeHz, setFogStrobeHz] = useState<number>(2);

  // Interactive Topology State
  const [selectedTopologyNode, setSelectedTopologyNode] = useState<string>('ISC-01');
  const [topologySimPacketLoss, setTopologySimPacketLoss] = useState<boolean>(false);

  // Modals & Feedback
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideType, setOverrideType] = useState<'EMERGENCY_CORRIDOR' | 'CIVIL_DEFENSE_LOCK' | 'ALL_RED'>('EMERGENCY_CORRIDOR');
  const [operatorToken, setOperatorToken] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuditingLogs, setIsAuditingLogs] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------------------
  // TRAFFIC SIGNAL STATE MACHINE (Simulated Real-Time Controller)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (controlMode === 'CIVIL_DEFENSE_LOCK' || controlMode === 'EMERGENCY_CORRIDOR') {
      return; // Paused in manual lock
    }

    const timer = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition State
          if (currentPhase === 'NS_GREEN') {
            setCurrentPhase('NS_YELLOW');
            return 4; // 4s yellow
          } else if (currentPhase === 'NS_YELLOW') {
            setCurrentPhase('EW_GREEN');
            return 35; // 35s East-West Green
          } else if (currentPhase === 'EW_GREEN') {
            setCurrentPhase('EW_YELLOW');
            return 4; // 4s yellow
          } else if (currentPhase === 'EW_YELLOW') {
            setCurrentPhase('NS_GREEN');
            return 45; // 45s North-South Green
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPhase, controlMode]);

  // Filtered Sensor List
  const filteredSensors = INITIAL_SENSORS.filter((s) => {
    const matchesSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.zone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate High-level Dashboard Metrics
  const totalSensors = INITIAL_SENSORS.length;
  const onlineSensors = INITIAL_SENSORS.filter((s) => s.status === 'Online').length;
  const alertSensors = INITIAL_SENSORS.filter((s) => s.status === 'Alert' || s.status === 'Offline').length;
  const avgLatency = Math.round(INITIAL_SENSORS.reduce((acc, s) => acc + s.latencyMs, 0) / totalSensors);

  return (
    <div className="space-y-6 text-left text-gray-100 pb-12 font-sans select-none animate-in fade-in duration-500">
      
      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0c101c] border border-emerald-500/60 text-white px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(0,255,102,0.25)] flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-ping" />
            <ShieldCheck className="text-[#00FF66]" size={18} />
            <span className="text-xs font-bold font-mono tracking-wide text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER: SMART TRAFFIC SCADA & CYBERSECURITY OPERATIONS */}
      <div className="bg-[#0b0d14] border-2 border-blue-950/70 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.06)]">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-blue-600/10 via-emerald-600/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-950/80 via-gray-900 to-emerald-950/60 rounded-2xl flex items-center justify-center border border-blue-500/40 shadow-inner text-blue-400">
              <TrafficCone size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                  <span>{isZh ? '智慧城市交通號誌與 SCADA 工控安全指揮中心' : 'Smart Traffic Signal SCADA & ICS Security Command'}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
                    NTCIP 1202 / 1209 & MODBUS OT
                  </span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
                  {isZh ? 'SCADA 實時聯動中' : 'SCADA LIVE TELEMETRY'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl font-mono">
                {isZh
                  ? '整合「智慧路口號誌控制器 (ISC) 雙環時相時制」、「資訊可變標誌看板 (CMS) 防竄改監控」、「車道管制 (LCS) / 可變速限 (VSLS) / 濃霧閃黃燈 (FAFYL)」、「工控協定封包深度解析 (DPI)」與「CCTV AI 車流視覺邊緣運算」。'
                  : 'Featuring NTCIP 1202 Dual-Ring Signal Phase Controller, Cryptographically Signed CMS LED Matrix, LCS/VSLS/FAFYL Subsystems, Deep Packet Inspection (DPI) & Edge Vision Analytics.'}
              </p>
            </div>
          </div>

          {/* QUICK COMMAND BUTTONS & EMERGENCY OVERRIDE */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => {
                setOverrideType('EMERGENCY_CORRIDOR');
                setShowOverrideModal(true);
              }}
              className="px-3.5 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all"
            >
              <Siren size={15} className="text-red-400 animate-bounce" />
              {isZh ? '緊急綠波車道 (VIP/救護)' : 'Emergency Green Corridor'}
            </button>

            <button
              onClick={() => {
                setOverrideType('CIVIL_DEFENSE_LOCK');
                setShowOverrideModal(true);
              }}
              className="px-3.5 py-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 rounded-xl font-bold flex items-center gap-2 shadow transition-all"
            >
              <AlertOctagon size={15} className="text-amber-400" />
              {isZh ? '防空民防號誌封鎖' : 'Civil Defense Lock'}
            </button>

            <button
              onClick={() => {
                showToast(isZh ? '已完成 SCADA/HMI 全網號誌節點通訊刷新！' : 'Refreshed all SCADA signal telemetry.');
              }}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors"
              title={isZh ? '重新整理 SCADA 遙測' : 'Refresh Telemetry'}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* PRIMARY SUB-MODULE NAVIGATION TABS */}
        <div className="mt-6 flex flex-wrap bg-black/80 p-1.5 rounded-xl border border-gray-800 gap-1.5">
          {[
            { id: 'intersection', label: isZh ? '🚦 路口號誌實時相態控制 (ISC Phase Controller)' : 'ISC Signal Phase Controller', icon: <Signal size={14} /> },
            { id: 'cms_matrix', label: isZh ? '📺 資訊看板與標誌矩陣 (CMS / LCS / VSLS / FAFYL)' : 'CMS / LCS / VSLS / FAFYL Matrix', icon: <MessageSquare size={14} /> },
            { id: 'scADA_topology', key: 'scada_topology', label: isZh ? '🗺️ 交通基礎設施 SCADA 拓撲 (Network Topology)' : 'SCADA Infrastructure Topology', icon: <Network size={14} /> },
            { id: 'ics_security', label: isZh ? '🛡️ 工控協定資安稽核與 DPI (ICS Protocol Security)' : 'ICS Protocol Security & DPI', icon: <ShieldAlert size={14} /> },
            { id: 'cctv_vision', label: isZh ? '📹 CCTV 交通監控與 AI 車流辨識 (Edge Vision)' : 'CCTV Vision & Edge Analytics', icon: <Video size={14} /> }
          ].map((tab) => {
            const tabKey = tab.key || tab.id;
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey as TrafficTab)}
                className={cn(
                  'flex-1 min-w-[170px] py-2.5 px-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-mono border',
                  activeTab === tabKey
                    ? 'bg-blue-950/80 text-blue-400 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-850'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP TACTICAL METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Devices */}
        <div className="bg-[#0a0c13] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded-xl text-blue-400">
              <TrafficCone size={20} />
            </div>
            <span className="text-[10px] font-mono bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50">
              156 Total Assets
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '交通號誌與感測節點總數' : 'Total Field Sensors & Signals'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-white font-mono">{totalSensors}</h3>
              <span className="text-xs text-gray-500 font-mono">/ 7 核心路段</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>ISC: 42 | CMS: 28 | LCS: 36</span>
            <span className="text-emerald-400 font-bold">100% 納管</span>
          </div>
        </div>

        {/* Metric 2: Online Status */}
        <div className="bg-[#0a0c13] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[#00FF66]">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-mono bg-emerald-950/80 text-[#00FF66] px-2 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              {Math.round((onlineSensors / totalSensors) * 100)}% 在線率
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '即時正常在線運作中' : 'Active Online Devices'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-[#00FF66] font-mono">{onlineSensors}</h3>
              <span className="text-xs text-gray-400 font-mono">/ {totalSensors} 節點</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>平均封包延遲: {avgLatency} ms</span>
            <span className="text-[#00FF66]">雙向心跳正常</span>
          </div>
        </div>

        {/* Metric 3: Offline & Alarms */}
        <div className="bg-[#0a0c13] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-950/60 border border-amber-500/30 rounded-xl text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/50">
              1 離線 / 0 綠燈衝突
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '離線告警與硬體異常' : 'Offline / Fault Alarms'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-amber-400 font-mono">{alertSensors}</h3>
              <span className="text-xs text-amber-400/80 font-mono">FAFYL-03 (濃霧閃黃燈)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>MMU/CMU 防衝突安全機制</span>
            <span className="text-emerald-400 font-bold">100% 鎖定有效</span>
          </div>
        </div>

        {/* Metric 4: Protocol Bandwidth & ICS Security */}
        <div className="bg-[#0a0c13] border border-gray-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-950/60 border border-purple-500/30 rounded-xl text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50">
              DPI Active
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs font-mono">{isZh ? '工控傳輸負載與防竄改防護' : 'Total Bandwidth & Tamper Shield'}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-purple-300 font-mono">25.1 Mbps</h3>
              <span className="text-xs text-emerald-400 font-mono">0 滲透違規</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>Modbus / NTCIP / DNP3</span>
            <span className="text-purple-400 font-bold">ED25519 簽章校驗</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 🚦 路口號誌實時相態控制與雙環時相 (ISC & INTERSECTION LIVE)           */}
      {/* ========================================================================= */}
      {activeTab === 'intersection' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT 7 COLS: 4-WAY INTERSECTION VISUAL LIVE CANVAS */}
            <div className="lg:col-span-7 bg-[#07090e] border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#00FF66] animate-ping" />
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <span>{isZh ? '中正路 / 博愛一路 4向智慧十字路口 (ISC-01 即時相態)' : 'Intersection ISC-01 Live Phase Monitor'}</span>
                      </h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {isZh ? '雙環八時相 (Dual Ring & Barrier) 實時倒數與衝突監控儀 (MMU/CMU)' : 'Dual Ring & Barrier Real-Time Phasing with Conflict Monitor'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-950 border border-blue-500/40 text-blue-300 rounded text-xs font-mono font-bold">
                      {controlMode === 'AI_ADAPTIVE' ? '🤖 AI 自適應最佳化' : controlMode === 'EMERGENCY_CORRIDOR' ? '🚨 緊急車道鎖定' : '⚙️ 手動時制'}
                    </span>
                  </div>
                </div>

                {/* 4-WAY INTERSECTION SCHEMATIC GRAPHIC */}
                <div className="relative w-full h-[400px] bg-[#040609] rounded-xl my-4 overflow-hidden border border-gray-850 flex items-center justify-center">
                  
                  {/* Road Grid Layout */}
                  {/* Vertical Road (North-South) */}
                  <div className="absolute w-36 h-full bg-[#151922] border-x-2 border-dashed border-gray-600/60 flex items-center justify-center">
                    <div className="w-0.5 h-full border-r-2 border-dashed border-yellow-500/50" />
                  </div>

                  {/* Horizontal Road (East-West) */}
                  <div className="absolute h-36 w-full bg-[#151922] border-y-2 border-dashed border-gray-600/60 flex items-center justify-center">
                    <div className="h-0.5 w-full border-b-2 border-dashed border-yellow-500/50" />
                  </div>

                  {/* Zebra Crosswalks */}
                  {/* North Crosswalk */}
                  <div className="absolute top-[88px] w-36 h-8 flex justify-between px-1 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="w-2.5 h-full bg-white/40" />
                    ))}
                  </div>
                  {/* South Crosswalk */}
                  <div className="absolute bottom-[88px] w-36 h-8 flex justify-between px-1 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="w-2.5 h-full bg-white/40" />
                    ))}
                  </div>
                  {/* West Crosswalk */}
                  <div className="absolute left-[88px] h-36 w-8 flex flex-col justify-between py-1 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-2.5 w-full bg-white/40" />
                    ))}
                  </div>
                  {/* East Crosswalk */}
                  <div className="absolute right-[88px] h-36 w-8 flex flex-col justify-between py-1 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-2.5 w-full bg-white/40" />
                    ))}
                  </div>

                  {/* NORTH SIGNAL HEAD & COUNTDOWN */}
                  <div className="absolute top-4 flex flex-col items-center">
                    <div className="text-[10px] font-mono text-gray-400 font-bold mb-1">NORTH (博愛一路 北向)</div>
                    <div className="bg-black/90 p-2 rounded-lg border border-gray-700 flex items-center gap-2 shadow-2xl">
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase.startsWith('NS') && currentPhase.includes('GREEN') ? 'bg-gray-800 border-gray-700' : 'bg-red-500 border-red-400 shadow-[0_0_10px_#ef4444]')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'NS_YELLOW' ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b]' : 'bg-gray-800 border-gray-700')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'NS_GREEN' ? 'bg-[#00FF66] border-emerald-400 shadow-[0_0_10px_#00FF66]' : 'bg-gray-800 border-gray-700')} />
                      <span className="text-xs font-mono font-black text-cyan-400 ml-1">
                        {currentPhase.startsWith('NS') ? `${phaseSecondsLeft}s` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* SOUTH SIGNAL HEAD & COUNTDOWN */}
                  <div className="absolute bottom-4 flex flex-col items-center">
                    <div className="bg-black/90 p-2 rounded-lg border border-gray-700 flex items-center gap-2 shadow-2xl">
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase.startsWith('NS') && currentPhase.includes('GREEN') ? 'bg-gray-800 border-gray-700' : 'bg-red-500 border-red-400 shadow-[0_0_10px_#ef4444]')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'NS_YELLOW' ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b]' : 'bg-gray-800 border-gray-700')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'NS_GREEN' ? 'bg-[#00FF66] border-emerald-400 shadow-[0_0_10px_#00FF66]' : 'bg-gray-800 border-gray-700')} />
                      <span className="text-xs font-mono font-black text-cyan-400 ml-1">
                        {currentPhase.startsWith('NS') ? `${phaseSecondsLeft}s` : '--'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 font-bold mt-1">SOUTH (博愛一路 南向)</div>
                  </div>

                  {/* WEST SIGNAL HEAD & COUNTDOWN */}
                  <div className="absolute left-4 flex items-center gap-2">
                    <div className="text-[10px] font-mono text-gray-400 font-bold -rotate-90">WEST (中正路 西向)</div>
                    <div className="bg-black/90 p-2 rounded-lg border border-gray-700 flex flex-col items-center gap-2 shadow-2xl">
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase.startsWith('EW') && currentPhase.includes('GREEN') ? 'bg-gray-800 border-gray-700' : 'bg-red-500 border-red-400 shadow-[0_0_10px_#ef4444]')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'EW_YELLOW' ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b]' : 'bg-gray-800 border-gray-700')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'EW_GREEN' ? 'bg-[#00FF66] border-emerald-400 shadow-[0_0_10px_#00FF66]' : 'bg-gray-800 border-gray-700')} />
                      <span className="text-xs font-mono font-black text-cyan-400 mt-0.5">
                        {currentPhase.startsWith('EW') ? `${phaseSecondsLeft}s` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* EAST SIGNAL HEAD & COUNTDOWN */}
                  <div className="absolute right-4 flex items-center gap-2">
                    <div className="bg-black/90 p-2 rounded-lg border border-gray-700 flex flex-col items-center gap-2 shadow-2xl">
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase.startsWith('EW') && currentPhase.includes('GREEN') ? 'bg-gray-800 border-gray-700' : 'bg-red-500 border-red-400 shadow-[0_0_10px_#ef4444]')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'EW_YELLOW' ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b]' : 'bg-gray-800 border-gray-700')} />
                      <div className={cn('w-4 h-4 rounded-full border', currentPhase === 'EW_GREEN' ? 'bg-[#00FF66] border-emerald-400 shadow-[0_0_10px_#00FF66]' : 'bg-gray-800 border-gray-700')} />
                      <span className="text-xs font-mono font-black text-cyan-400 mt-0.5">
                        {currentPhase.startsWith('EW') ? `${phaseSecondsLeft}s` : '--'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 font-bold rotate-90">EAST (中正路 東向)</div>
                  </div>

                  {/* CENTER INTERSECTION HUD OVERLAY */}
                  <div className="z-10 bg-black/85 border border-blue-500/40 p-3.5 rounded-xl shadow-2xl text-center backdrop-blur-md">
                    <div className="text-[9px] font-mono text-gray-400 uppercase font-bold">CURRENT ACTIVE PHASE</div>
                    <div className="text-sm font-black font-mono text-white mt-0.5">
                      {currentPhase === 'NS_GREEN' && '南北向 直行/右轉通行'}
                      {currentPhase === 'NS_YELLOW' && '南北向 黃燈清道中'}
                      {currentPhase === 'EW_GREEN' && '東西向 直行/右轉通行'}
                      {currentPhase === 'EW_YELLOW' && '東西向 黃燈清道中'}
                      {currentPhase === 'EMERGENCY_LOCK' && '🚨 緊急車輛全紅清空'}
                    </div>
                    <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                      00:{phaseSecondsLeft < 10 ? `0${phaseSecondsLeft}` : phaseSecondsLeft}
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400 flex items-center justify-center gap-1 mt-1">
                      <ShieldCheck size={12} />
                      MMU 安全互鎖啟動
                    </div>
                  </div>

                </div>
              </div>

              {/* BOTTOM QUICK INTERACTION SWITCHES */}
              <div className="p-3.5 bg-black/60 border border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{isZh ? '控制模式切換:' : 'Control Mode:'}</span>
                  {(['AI_ADAPTIVE', 'MANUAL_FIXED'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setControlMode(mode);
                        showToast(isZh ? `已切換號誌控制模式至 [${mode}]` : `Switched mode to ${mode}`);
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded text-[11px] font-bold border transition-colors',
                        controlMode === mode
                          ? 'bg-blue-950 text-blue-300 border-blue-500'
                          : 'bg-gray-900 text-gray-400 border-gray-750 hover:text-white'
                      )}
                    >
                      {mode === 'AI_ADAPTIVE' ? 'AI 車流自適應' : '固定時制'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Trigger Next Phase manually
                      setPhaseSecondsLeft(1);
                      showToast(isZh ? '已手動提前觸發下一相態切換！' : 'Manually advancing to next phase.');
                    }}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-[11px] font-bold flex items-center gap-1 border border-gray-700"
                  >
                    <FastForward size={12} />
                    {isZh ? '強制跳至下一時相' : 'Next Phase'}
                  </button>

                  <button
                    onClick={() => {
                      setCmuSafetyLock(!cmuSafetyLock);
                      showToast(cmuSafetyLock ? '⚠️ 已解鎖 CMU 衝突監控防護' : '✅ 已啟動 CMU 衝突硬體防護');
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded text-[11px] font-bold border flex items-center gap-1',
                      cmuSafetyLock ? 'bg-emerald-950 text-[#00FF66] border-emerald-500/50' : 'bg-red-950 text-red-300 border-red-500'
                    )}
                  >
                    {cmuSafetyLock ? <Lock size={12} /> : <Unlock size={12} />}
                    {cmuSafetyLock ? 'CMU 防衝突鎖定' : 'CMU 旁路測試'}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: DUAL-RING TIMING CHART & NTCIP 1202 REGISTERS */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Dual-Ring Phase Split Progress Bar */}
              <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    {isZh ? 'NTCIP 1202 雙環時相時制表 (Split Timing)' : 'Dual Ring & Barrier Split'}
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-400">週期: {cycleLength}s</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Ring 1 (North-South Phasing) */}
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>環 1: 博愛一路 (南北向幹道)</span>
                      <span className="text-[#00FF66] font-bold">60s (50% 綠燈比)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden flex border border-gray-800">
                      <div className="h-full bg-[#00FF66]" style={{ width: '45%' }} title="Green 54s" />
                      <div className="h-full bg-amber-400" style={{ width: '5%' }} title="Yellow 6s" />
                      <div className="h-full bg-red-600" style={{ width: '50%' }} title="Red 60s" />
                    </div>
                  </div>

                  {/* Ring 2 (East-West Phasing) */}
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>環 2: 中正路 (東西向支線)</span>
                      <span className="text-cyan-400 font-bold">60s (50% 綠燈比)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden flex border border-gray-800">
                      <div className="h-full bg-red-600" style={{ width: '50%' }} title="Red 60s" />
                      <div className="h-full bg-[#00FF66]" style={{ width: '45%' }} title="Green 54s" />
                      <div className="h-full bg-amber-400" style={{ width: '5%' }} title="Yellow 6s" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800/80 text-center font-mono">
                  <div className="p-2 bg-black/60 rounded-lg border border-gray-850">
                    <div className="text-[9px] text-gray-500">時段方案</div>
                    <div className="text-xs font-bold text-white mt-0.5">Plan #03 (尖峰)</div>
                  </div>
                  <div className="p-2 bg-black/60 rounded-lg border border-gray-850">
                    <div className="text-[9px] text-gray-500">車流飽和度</div>
                    <div className="text-xs font-bold text-amber-400 mt-0.5">78.4% (高)</div>
                  </div>
                  <div className="p-2 bg-black/60 rounded-lg border border-gray-850">
                    <div className="text-[9px] text-gray-500">行人早開秒數</div>
                    <div className="text-xs font-bold text-cyan-400 mt-0.5">5.0 秒</div>
                  </div>
                </div>
              </div>

              {/* NTCIP 1202 / Modbus Register Live Inspection */}
              <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCode size={14} className="text-emerald-400" />
                    {isZh ? 'ISC-01 工控暫存器實時狀態 (Live Registers)' : 'ISC-01 Live Registers'}
                  </h4>
                  <span className="text-[9px] bg-emerald-950 text-[#00FF66] px-1.5 py-0.5 rounded border border-emerald-800">
                    Modbus 40001
                  </span>
                </div>

                <div className="bg-[#05070a] p-3 rounded-xl border border-gray-850 space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-gray-850 pb-1">
                    <span className="text-gray-500">Coil 0x0001 (Phase 1 Red):</span>
                    <span className="text-red-400 font-bold">{currentPhase.startsWith('NS') ? '0 (OFF)' : '1 (ON)'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-850 pb-1">
                    <span className="text-gray-500">Coil 0x0002 (Phase 1 Yellow):</span>
                    <span className="text-amber-400 font-bold">{currentPhase === 'NS_YELLOW' ? '1 (ON)' : '0 (OFF)'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-850 pb-1">
                    <span className="text-gray-500">Coil 0x0003 (Phase 1 Green):</span>
                    <span className="text-[#00FF66] font-bold">{currentPhase === 'NS_GREEN' ? '1 (ON)' : '0 (OFF)'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-850 pb-1">
                    <span className="text-gray-500">Holding Reg 40012 (MMU State):</span>
                    <span className="text-emerald-400 font-bold">0x0000 (NORMAL_LOCKED)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Holding Reg 40025 (Loop Sensor EPS):</span>
                    <span className="text-white font-bold">42 pkts/sec</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                  <span>安全哈希: SHA256-ED25519</span>
                  <span className="text-emerald-400">校驗通過</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 📺 資訊看板與公路號誌矩陣 (CMS / LCS / VSLS / FAFYL)                  */}
      {/* ========================================================================= */}
      {activeTab === 'cms_matrix' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SUB-PANEL 1: CMS CHANGEABLE MESSAGE SIGN INTERACTIVE BOARD (7 COLS) */}
            <div className="lg:col-span-7 bg-[#07090e] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                      {isZh ? 'CMS (資訊可變標誌看板) 即時廣播與防竄改驗證' : 'CMS Matrix Sign Broadcaster'}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      NTCIP 1209 協定 | ED25519 加密防禦非法塗鴉攻擊 (Anti-Defacement)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-950 text-[#00FF66] border border-emerald-800 rounded text-xs font-mono font-bold flex items-center gap-1">
                  <ShieldCheck size={14} />
                  簽章防護生效
                </span>
              </div>

              {/* REALISTIC LED DOT MATRIX BOARD PREVIEW */}
              <div className="p-6 bg-black rounded-2xl border-4 border-gray-800 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                {/* Dot Grid Background Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-25"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)',
                    backgroundSize: '8px 8px'
                  }}
                />

                <div className="z-10 text-center space-y-2 font-mono tracking-widest uppercase">
                  <div
                    className={cn(
                      'text-xl md:text-2xl font-black transition-colors filter drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]',
                      cmsColor === 'amber' && 'text-amber-400',
                      cmsColor === 'red' && 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]',
                      cmsColor === 'green' && 'text-[#00FF66] drop-shadow-[0_0_12px_rgba(0,255,102,0.9)]'
                    )}
                  >
                    {cmsLine1 || '【系統待機中 STANDBY】'}
                  </div>
                  <div
                    className={cn(
                      'text-lg md:text-xl font-bold transition-colors filter drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]',
                      cmsColor === 'amber' && 'text-amber-300',
                      cmsColor === 'red' && 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]',
                      cmsColor === 'green' && 'text-[#00FF66] drop-shadow-[0_0_10px_rgba(0,255,102,0.7)]'
                    )}
                  >
                    {cmsLine2 || '請保持安全行車距離'}
                  </div>
                </div>

                <div className="absolute bottom-2 right-3 text-[9px] font-mono text-gray-600">
                  CMS-01 | 信義快速道路 1.5K
                </div>
              </div>

              {/* CMS PRESET TEMPLATES SELECTOR */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-gray-300 flex items-center justify-between">
                  <span>{isZh ? '預設情境廣播範本 (Quick Presets):' : 'Broadcast Templates:'}</span>
                  <span className="text-[10px] text-gray-500">點擊即時套用</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono">
                  {CMS_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setCmsLine1(preset.line1);
                        setCmsLine2(preset.line2);
                        setCmsColor(preset.color);
                        showToast(isZh ? `已發送 CMS 廣播 [${preset.title}]！` : `Dispatched CMS: ${preset.title}`);
                      }}
                      className="p-2.5 bg-black/60 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-gray-200 group-hover:text-amber-400 truncate">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate mt-1">
                        {preset.line1}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM CMS INPUT FORM */}
              <div className="p-4 bg-black/60 border border-gray-800 rounded-xl space-y-3 font-mono text-xs">
                <div className="font-bold text-gray-300">{isZh ? '自訂發布文字 (Custom Text Input):' : 'Custom Text Input:'}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500">第一行文字 (Line 1):</label>
                    <input
                      type="text"
                      value={cmsLine1}
                      onChange={(e) => setCmsLine1(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-amber-500 outline-none mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">第二行文字 (Line 2):</label>
                    <input
                      type="text"
                      value={cmsLine2}
                      onChange={(e) => setCmsLine2(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-amber-500 outline-none mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">LED 發光顏色:</span>
                    {(['amber', 'red', 'green'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setCmsColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-transform',
                          color === 'amber' && 'bg-amber-400 border-amber-300',
                          color === 'red' && 'bg-red-500 border-red-400',
                          color === 'green' && 'bg-[#00FF66] border-emerald-400',
                          cmsColor === color ? 'scale-125 shadow-lg' : 'opacity-60'
                        )}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      showToast(isZh ? 'CMS 廣播指令已由私鑰簽章並下發至看板！' : 'Signed CMS broadcast deployed.');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    <Check size={14} />
                    {isZh ? '簽章發布廣播' : 'Deploy Broadcast'}
                  </button>
                </div>
              </div>

            </div>

            {/* SUB-PANEL 2: LCS / VSLS / FAFYL ROADWAY DEVICES (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* 1. LCS (Lane Control Signals) */}
              <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="text-blue-400" size={16} />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {isZh ? 'LCS (車道管制號誌 4線陣列)' : 'LCS Lane Control'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-gray-500">中央隧道南向</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {laneStates.map((state, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const nextStates = [...laneStates];
                        if (state === 'ARROW_GREEN') nextStates[idx] = 'MERGE_LEFT';
                        else if (state === 'MERGE_LEFT') nextStates[idx] = 'MERGE_RIGHT';
                        else if (state === 'MERGE_RIGHT') nextStates[idx] = 'CROSS_RED';
                        else nextStates[idx] = 'ARROW_GREEN';
                        setLaneStates(nextStates);
                        showToast(isZh ? `已更新第 ${idx + 1} 車道號誌為 [${nextStates[idx]}]` : `Updated lane ${idx + 1}`);
                      }}
                      className="p-3 bg-black/70 border border-gray-800 hover:border-blue-500 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group shadow"
                    >
                      <div className="text-[10px] text-gray-400 font-bold">車道 {idx + 1}</div>
                      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-750">
                        {state === 'ARROW_GREEN' && <ArrowDown className="text-[#00FF66] animate-bounce" size={20} />}
                        {state === 'MERGE_LEFT' && <ArrowLeft className="text-amber-400 animate-pulse" size={20} />}
                        {state === 'MERGE_RIGHT' && <ArrowRight className="text-amber-400 animate-pulse" size={20} />}
                        {state === 'CROSS_RED' && <X className="text-red-500 animate-pulse" size={22} />}
                      </div>
                      <div className="text-[9px] text-gray-500 group-hover:text-blue-300">
                        {state === 'ARROW_GREEN' && '通行'}
                        {state === 'MERGE_LEFT' && '左偏'}
                        {state === 'MERGE_RIGHT' && '右偏'}
                        {state === 'CROSS_RED' && '封閉'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. VSLS (Variable Speed Limit Sign) */}
              <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Gauge className="text-purple-400" size={16} />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {isZh ? 'VSLS (動態可變速限標誌)' : 'VSLS Variable Speed'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-purple-400 font-bold">國道一號 35K</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-black/60 border border-gray-800 rounded-xl">
                  {/* Round Speed Limit Sign Graphic */}
                  <div className="w-16 h-16 rounded-full border-4 border-red-600 bg-black flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                    <span className="text-2xl font-black text-white font-mono">{cmsSpeedLimit}</span>
                  </div>

                  <div className="space-y-2 flex-1 ml-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">目前速限設定:</span>
                      <span className="text-cyan-400 font-bold">{cmsSpeedLimit} KM/H</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {[40, 60, 80, 100].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            setCmsSpeedLimit(speed);
                            showToast(isZh ? `已將 VSLS 速限調整為 ${speed} km/h` : `Set speed to ${speed} km/h`);
                          }}
                          className={cn(
                            'flex-1 py-1 rounded text-[11px] font-bold border transition-colors',
                            cmsSpeedLimit === speed
                              ? 'bg-purple-950 text-purple-300 border-purple-500'
                              : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                          )}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. FAFYL (Fog Area Flashing Yellow Light) */}
              <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Wind className="text-amber-400" size={16} />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {isZh ? 'FAFYL (濃霧區閃黃燈控制器)' : 'FAFYL Fog Strobe'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-amber-400">林口台地 濃霧監測</span>
                </div>

                <div className="p-3 bg-black/60 border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">氣象感測能見度:</span>
                    <span className="text-amber-400 font-black">{fogVisibilityMeters} 公尺 (大霧)</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-4 h-4 rounded-full border', fogStrobeActive ? 'bg-amber-400 border-amber-300 animate-ping' : 'bg-gray-800')} />
                      <span className="text-xs text-gray-300 font-bold">
                        {fogStrobeActive ? '頻閃警示中 (2.0 Hz)' : '停用狀態'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setFogStrobeActive(!fogStrobeActive);
                        showToast(fogStrobeActive ? '已關閉濃霧閃黃燈' : '已啟動濃霧閃黃燈頻閃');
                      }}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold border transition-colors',
                        fogStrobeActive
                          ? 'bg-amber-950 text-amber-300 border-amber-500'
                          : 'bg-gray-900 text-gray-400 border-gray-700'
                      )}
                    >
                      {fogStrobeActive ? '強制關閉' : '手動啟動'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 🗺️ 交通基礎設施 SCADA 拓撲 (SCADA INFRASTRUCTURE TOPOLOGY)          */}
      {/* ========================================================================= */}
      {activeTab === 'scada_topology' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT 8 COLS: SCADA TOPOLOGY CANVAS */}
            <div className="lg:col-span-8 bg-[#07090e] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Network size={16} className="text-blue-400" />
                    {isZh ? '智慧交通 SCADA/HMI 光纖骨幹拓撲圖' : 'SCADA/HMI OT Network Topology'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {isZh ? '中央 SEMOR 控制平台 ➔ 工業防火牆 ➔ 區域現場集線器 (Hub) ➔ 號誌與感知終端' : 'Central Platform to Field Edge Ring Topology'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    onClick={() => {
                      setTopologySimPacketLoss(!topologySimPacketLoss);
                      showToast(topologySimPacketLoss ? '已恢復正常鏈路傳輸' : '已注入類比丟包故障');
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-colors',
                      topologySimPacketLoss ? 'bg-red-950 text-red-300 border-red-500' : 'bg-gray-900 text-gray-300 border-gray-700'
                    )}
                  >
                    <Zap size={13} />
                    {topologySimPacketLoss ? '模擬故障中 (Packet Drop)' : '注入模擬鏈路故障'}
                  </button>
                </div>
              </div>

              {/* TOPOLOGY SVG SCHEMATIC */}
              <div className="relative w-full h-[460px] bg-[#040609] rounded-xl border border-gray-850 overflow-hidden flex items-center justify-center">
                <svg width="740" height="440" viewBox="0 0 740 440" className="w-full h-full">
                  <defs>
                    <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#00FF66" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Connecting Links */}
                  {/* Central Platform to Industrial Firewall */}
                  <line x1="370" y1="50" x2="370" y2="130" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                  
                  {/* Firewall to Hub 1 & Hub 2 */}
                  <line x1="370" y1="130" x2="180" y2="230" stroke="#00FF66" strokeWidth="2.5" />
                  <line x1="370" y1="130" x2="560" y2="230" stroke="#00FF66" strokeWidth="2.5" />

                  {/* Hub 1 to Endpoints */}
                  <line x1="180" y1="230" x2="90" y2="340" stroke="#00FF66" strokeWidth="2" />
                  <line x1="180" y1="230" x2="180" y2="340" stroke="#00FF66" strokeWidth="2" />
                  <line x1="180" y1="230" x2="270" y2="340" stroke="#00FF66" strokeWidth="2" />

                  {/* Hub 2 to Endpoints */}
                  <line x1="560" y1="230" x2="470" y2="340" stroke="#00FF66" strokeWidth="2" />
                  <line x1="560" y1="230" x2="560" y2="340" stroke={topologySimPacketLoss ? '#ef4444' : '#00FF66'} strokeWidth="2" strokeDasharray={topologySimPacketLoss ? '4,4' : undefined} />
                  <line x1="560" y1="230" x2="650" y2="340" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />

                  {/* NODES */}
                  {/* Platform Node */}
                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('PLATFORM')} transform="translate(370, 50)">
                    <circle r="26" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
                    <text y="40" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">SEMOR 控制中心</text>
                  </g>

                  {/* Industrial Firewall */}
                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('FIREWALL')} transform="translate(370, 130)">
                    <rect x="-24" y="-18" width="48" height="36" rx="8" fill="#581c87" stroke="#a855f7" strokeWidth="2" />
                    <text y="30" textAnchor="middle" fill="#d8b4fe" fontSize="9" fontWeight="bold">工控防護閘道</text>
                  </g>

                  {/* Hub 01 */}
                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('HUB-01')} transform="translate(180, 230)">
                    <circle r="20" fill="#064e3b" stroke="#00FF66" strokeWidth="2" />
                    <text y="32" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold">區域集線器 HUB-01</text>
                  </g>

                  {/* Hub 02 */}
                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('HUB-02')} transform="translate(560, 230)">
                    <circle r="20" fill="#064e3b" stroke="#00FF66" strokeWidth="2" />
                    <text y="32" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold">區域集線器 HUB-02</text>
                  </g>

                  {/* Leaf Endpoints */}
                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('ISC-01')} transform="translate(90, 340)">
                    <circle r="16" fill="#111827" stroke="#00FF66" strokeWidth="2" />
                    <text y="28" textAnchor="middle" fill="#9ca3af" fontSize="9">ISC-01</text>
                  </g>

                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('CMS-01')} transform="translate(180, 340)">
                    <circle r="16" fill="#111827" stroke="#00FF66" strokeWidth="2" />
                    <text y="28" textAnchor="middle" fill="#9ca3af" fontSize="9">CMS-01</text>
                  </g>

                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('CCTV-22')} transform="translate(270, 340)">
                    <circle r="16" fill="#111827" stroke="#00FF66" strokeWidth="2" />
                    <text y="28" textAnchor="middle" fill="#9ca3af" fontSize="9">CCTV-22</text>
                  </g>

                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('LCS-05')} transform="translate(470, 340)">
                    <circle r="16" fill="#111827" stroke="#00FF66" strokeWidth="2" />
                    <text y="28" textAnchor="middle" fill="#9ca3af" fontSize="9">LCS-05</text>
                  </g>

                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('VSLS-12')} transform="translate(560, 340)">
                    <circle r="16" fill="#111827" stroke="#00FF66" strokeWidth="2" />
                    <text y="28" textAnchor="middle" fill="#9ca3af" fontSize="9">VSLS-12</text>
                  </g>

                  <g className="cursor-pointer" onClick={() => setSelectedTopologyNode('FAFYL-03')} transform="translate(650, 340)">
                    <circle r="16" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                    <text y="28" textAnchor="middle" fill="#fca5a5" fontSize="9">FAFYL-03 (離線)</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* RIGHT 4 COLS: NODE INSPECTOR & TELEMETRY */}
            <div className="lg:col-span-4 bg-[#080a10] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={14} className="text-cyan-400" />
                  {isZh ? '拓撲節點屬性檢查器' : 'Node Inspector'}
                </h4>
                <span className="text-[9px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                  {selectedTopologyNode}
                </span>
              </div>

              <div className="bg-[#05070a] p-4 rounded-xl border border-gray-850 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">節點名稱:</span>
                  <span className="text-white font-bold">{selectedTopologyNode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">實體位置:</span>
                  <span className="text-gray-300">中正核心路段 (Zone-A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IP 位址:</span>
                  <span className="text-cyan-400">10.88.10.12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">通訊協定:</span>
                  <span className="text-emerald-400">NTCIP 1202 / Modbus TCP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">傳輸負載:</span>
                  <span className="text-white font-bold">2.4 Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">運行狀態:</span>
                  <span className="text-[#00FF66] font-bold">● 在線 (健康度 98%)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-800">
                <button
                  onClick={() => {
                    showToast(isZh ? `已向 ${selectedTopologyNode} 發送 ICMP/Modbus 遙測探針！` : `Sent ping probe.`);
                  }}
                  className="w-full py-2 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/50 rounded-xl text-xs font-bold transition-colors"
                >
                  發送主動診斷探針 (Ping / Modbus Echo)
                </button>

                <button
                  onClick={() => {
                    showToast(isZh ? `已重啟 ${selectedTopologyNode} 之工控邊緣通訊模組！` : `Restarted module.`);
                  }}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-750 rounded-xl text-xs font-bold transition-colors"
                >
                  重啟通訊伺服程序 (Service Restart)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 🛡️ 工控協定資安稽核與 DPI (ICS PROTOCOL SECURITY & AUDIT)           */}
      {/* ========================================================================= */}
      {activeTab === 'ics_security' && (
        <div className="space-y-6">
          
          <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldAlert size={16} className="text-purple-400" />
                  {isZh ? '工控協定深度解析與防禦紀錄 (DPI Inspection Logs)' : 'ICS Protocol Security & DPI Audit'}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {isZh ? '即時過濾 Modbus TCP、NTCIP 1202/1209 與 DNP3 指令，比對 MITRE ATT&CK for ICS 攻擊特徵' : 'Real-time inspection of ICS protocol commands and MITRE ATT&CK for ICS mapping'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-950 text-[#00FF66] border border-emerald-800 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                  {isZh ? 'DPI 側錄防護中' : 'DPI ACTIVE'}
                </span>
              </div>
            </div>

            {/* AUDIT LOG TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">時間戳記</th>
                    <th className="p-3.5">通訊協定</th>
                    <th className="p-3.5">來源 ➔ 目的 IP</th>
                    <th className="p-3.5">工控功能碼 (FC)</th>
                    <th className="p-3.5">暫存器 / Payload</th>
                    <th className="p-3.5">安全判定</th>
                    <th className="p-3.5">MITRE TTP / 說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {INITIAL_ICS_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="p-3.5 text-gray-400">{log.timestamp}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-blue-950/80 text-blue-300 rounded border border-blue-800 text-[10px] font-bold">
                          {log.protocol}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-300">{log.sourceIp} ➔ {log.destIp}</td>
                      <td className="p-3.5 font-bold text-white">{log.functionCode}</td>
                      <td className="p-3.5 text-cyan-400 font-mono text-[11px]">{log.registerAddress}</td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border',
                            log.safetyStatus === 'Authorized'
                              ? 'bg-emerald-950 text-[#00FF66] border-emerald-800'
                              : 'bg-red-950 text-red-300 border-red-800 animate-pulse'
                          )}
                        >
                          {log.safetyStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400 text-[11px] max-w-xs truncate">
                        {log.mitreTtp && <span className="text-red-400 font-bold mr-1">[{log.mitreTtp}]</span>}
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 📹 CCTV 交通監控與 AI 車流視覺邊緣運算 (EDGE VISION ANALYTICS)        */}
      {/* ========================================================================= */}
      {activeTab === 'cctv_vision' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {INITIAL_CCTV_FEEDS.map((feed) => (
              <div key={feed.id} className="bg-[#080a10] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
                
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">{feed.name}</h4>
                      <p className="text-[10px] text-gray-500">{feed.location}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-[#00FF66] px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
                    30 FPS
                  </span>
                </div>

                {/* SIMULATED CAMERA VIEW SCREEN WITH BOUNDING BOXES */}
                <div className="relative w-full h-48 bg-gray-950 rounded-xl overflow-hidden border border-gray-850 flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Simulated Road Graphic */}
                  <div className="w-full h-full opacity-40 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Bounding Box 1 (Vehicle) */}
                  <div className="absolute top-10 left-12 w-24 h-16 border-2 border-emerald-400 bg-emerald-500/10 rounded flex flex-col justify-between p-1">
                    <span className="text-[8px] bg-emerald-950 text-emerald-300 font-bold px-1 rounded self-start">CAR: 98%</span>
                    <span className="text-[8px] text-emerald-400 self-end">45 km/h</span>
                  </div>

                  {/* Bounding Box 2 (Bus / Truck) */}
                  <div className="absolute bottom-8 right-14 w-32 h-20 border-2 border-cyan-400 bg-cyan-500/10 rounded flex flex-col justify-between p-1">
                    <span className="text-[8px] bg-cyan-950 text-cyan-300 font-bold px-1 rounded self-start">BUS: 94%</span>
                    <span className="text-[8px] text-cyan-400 self-end">38 km/h</span>
                  </div>

                  <div className="absolute bottom-2 left-3 text-[10px] text-white font-bold flex items-center gap-2">
                    <Car size={14} className="text-cyan-400" />
                    <span>車流負載: {feed.aiDetections.cars} 小型車 / {feed.aiDetections.trucks + feed.aiDetections.buses} 大客貨車</span>
                  </div>
                </div>

                {/* AI EDGE TELEMETRY GRID */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-black/60 rounded-xl border border-gray-850">
                    <div className="text-[9px] text-gray-500">平均車速</div>
                    <div className="text-sm font-black text-cyan-400 mt-0.5">{feed.aiDetections.avgSpeedKmh} KM/H</div>
                  </div>
                  <div className="p-2.5 bg-black/60 rounded-xl border border-gray-850">
                    <div className="text-[9px] text-gray-500">停等車隊長度</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">{feed.aiDetections.queueLengthMeters} 公尺</div>
                  </div>
                </div>

                {feed.anomalyFlag && (
                  <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-[10px] text-amber-300 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span>{feed.anomalyReason}</span>
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SENSOR INVENTORY & ASSET FLEET TABLE (FULL-WIDTH AT BOTTOM)               */}
      {/* ========================================================================= */}
      <div className="bg-[#080a10] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        
        <div className="p-5 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 border border-blue-500/40 rounded-xl text-blue-400">
              <TrafficCone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {isZh ? '交通號誌與感測資產清冊 (All Field Assets)' : 'Traffic Assets Inventory'}
              </h3>
              <p className="text-[10px] text-gray-500">
                {isZh ? '全網 156 個 SCADA/HMI 感測號誌即時連線與防禦狀態' : 'Real-time telemetry and cybersecurity monitoring'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-750 rounded-xl text-gray-300">
              <Search size={14} />
              <input
                type="text"
                placeholder={isZh ? '搜尋設備代碼、名稱或路段...' : 'Search asset ID or zone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-500 w-36 md:w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-gray-900 border border-gray-750 text-gray-300 rounded-xl px-3 py-1.5 text-xs outline-none"
            >
              <option value="All">{isZh ? '全部狀態' : 'All Status'}</option>
              <option value="Online">{isZh ? '在線 (Online)' : 'Online'}</option>
              <option value="Offline">{isZh ? '離線 (Offline)' : 'Offline'}</option>
            </select>
          </div>
        </div>

        {/* ASSET TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">設備代碼 (ID)</th>
                <th className="p-4">名稱與管轄路段</th>
                <th className="p-4">設備類型</th>
                <th className="p-4">通訊協定 / IP</th>
                <th className="p-4">傳輸負載 / 延遲</th>
                <th className="p-4">集線節點</th>
                <th className="p-4">安全簽章</th>
                <th className="p-4">連線狀態</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {filteredSensors.map((sensor) => (
                <tr key={sensor.id} className="hover:bg-gray-900/40 transition-colors group">
                  <td className="p-4 font-bold text-white">{sensor.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-gray-200">{sensor.name}</div>
                    <div className="text-[10px] text-gray-500">{sensor.zone}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-blue-950/80 text-blue-300 rounded border border-blue-800 text-[10px] font-bold">
                      {sensor.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-300">{sensor.protocol}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{sensor.ip}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-300">{sensor.trafficLoad}</div>
                    <div className="text-[10px] text-emerald-400">{sensor.latencyMs} ms</div>
                  </td>
                  <td className="p-4 text-gray-400">{sensor.hubId}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-emerald-950 text-[#00FF66] rounded border border-emerald-800 text-[10px] font-bold flex items-center gap-1 w-max">
                      <ShieldCheck size={11} />
                      {sensor.tamperProtection}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'flex items-center gap-1.5 text-[10px] font-bold uppercase',
                        sensor.status === 'Online' ? 'text-[#00FF66]' : 'text-red-400'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full', sensor.status === 'Online' ? 'bg-[#00FF66] animate-pulse' : 'bg-red-500')} />
                      {sensor.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedSensor(sensor);
                        showToast(isZh ? `已載入 [${sensor.name}] 之細部參數！` : `Loaded ${sensor.name}`);
                      }}
                      className="px-3 py-1 bg-gray-800 hover:bg-blue-600 text-gray-200 hover:text-white rounded-lg text-xs font-bold transition-all"
                    >
                      {isZh ? '檢視診斷' : 'Inspect'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* EMERGENCY OVERRIDE & AUTHORIZATION MODAL                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0d14] border-2 border-red-500/60 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] font-mono space-y-5 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-950 text-red-400 border border-red-500/50 rounded-xl">
                    <Siren size={20} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">
                      {isZh ? '【緊急指揮授權】號誌覆寫控制' : 'Emergency Signal Override Authorization'}
                    </h3>
                    <p className="text-xs text-red-400 mt-0.5">
                      {overrideType === 'EMERGENCY_CORRIDOR' ? '緊急救護/車隊綠波通行鎖定' : '防空民防信號管制鎖定'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-gray-300 space-y-2">
                <div className="font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>重要警告 (High Priority Security Notice):</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {overrideType === 'EMERGENCY_CORRIDOR'
                    ? '此操作將強制覆寫博愛一路主線為持續綠燈，並切換東西向橫交路段為全紅清空。需記錄操作員安全權杖以供審計。'
                    : '此操作將觸發防空警報模式，全路口閃黃燈/全紅並在 CMS 廣播防空避難引導。'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">請輸入值班指揮官雙因子認證權杖 (Token / MFA):</label>
                <input
                  type="password"
                  placeholder="e.g. AUTH-TOKEN-9942"
                  value={operatorToken}
                  onChange={(e) => setOperatorToken(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-750 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
                >
                  {isZh ? '取消返回' : 'Cancel'}
                </button>

                <button
                  onClick={() => {
                    if (overrideType === 'EMERGENCY_CORRIDOR') {
                      setControlMode('EMERGENCY_CORRIDOR');
                      setCurrentPhase('NS_GREEN');
                      setPhaseSecondsLeft(99);
                      showToast(isZh ? '🚨 已成功啟動「緊急綠波車道」！南北向號誌鎖定全綠！' : 'Emergency Corridor Active!');
                    } else {
                      setControlMode('CIVIL_DEFENSE_LOCK');
                      setCurrentPhase('EMERGENCY_LOCK');
                      setCmsLine1('防空演習 號誌管制');
                      setCmsLine2('車輛靠邊 依指揮避難');
                      setCmsColor('red');
                      showToast(isZh ? '🚨 已啟動「防空民防號誌封鎖」並同步下發 CMS 廣播！' : 'Civil Defense Locked!');
                    }
                    setShowOverrideModal(false);
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                >
                  <Check size={14} />
                  {isZh ? '確認授權執行覆寫' : 'Confirm Override'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Swords,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Crosshair,
  Radar,
  Radio,
  Terminal,
  Cpu,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  FileText,
  Download,
  Flame,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Activity,
  Sliders,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Database,
  Server,
  HardDrive,
  Search,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  HelpCircle,
  Copy,
  Check,
  XCircle,
  FileCode,
  Globe,
  Plus,
  Trash2,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  MousePointer,
  Link,
  Unlink,
  Compass,
  ZapOff,
  Box,
  Key,
  FlameKindling,
  Binary,
  Volume2,
  VolumeX,
  Grid,
  Filter,
  BarChart3,
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

// =========================================================================
// 1. DATA STRUCTURES & INTERFACES
// =========================================================================

export type WargameTab = 'workbench' | 'cop' | 'aar_infinity' | 'mitre_matrix' | 'scenarios';

export interface TopologyNode {
  id: string;
  name: string;
  code: string;
  type: 'c4isr' | 'radar' | 'router' | 'firewall' | 'scada' | 'workstation' | 'crypto_vault' | 'honeypot';
  zone: 'External' | 'DMZ' | 'Tactical' | 'C4ISR Core' | 'OT Field';
  ip: string;
  defconLevel: 1 | 2 | 3 | 4 | 5;
  cveVulns: string[];
  successProbability: number; // 0-100%
  status: 'healthy' | 'targeted' | 'compromised' | 'shielded' | 'isolated';
  health: number; // 0 - 100
  x: number; // in canvas px coordinates
  y: number;
  attachedTTPs: AttachedTTP[];
  bandwidthMbps: number;
}

export interface AttachedTTP {
  id: string;
  tacticId: string;
  name: string;
  phase: string;
  technique: string;
  color: string;
  icon: string;
  attackIntensity: 'Stealthy' | 'Aggressive' | 'Brute Force';
}

export interface TopologyEdge {
  id: string;
  from: string;
  to: string;
  bandwidth: string;
  firewallPolicy: 'Allow-All' | 'Stateful-Inspect' | 'Strict-ZeroTrust' | 'Blocked';
  isCompromisedPath: boolean;
}

export interface PaletteItem {
  id: string;
  name: string;
  category: 'defense_entity' | 'attack_tactic';
  type?: TopologyNode['type'];
  zone?: TopologyNode['zone'];
  icon: string;
  description: string;
  mitreCode?: string;
  defaultCVE?: string[];
  color: string;
}

export interface TimelineEvent {
  id: string;
  timeSec: number; // relative second from 0 to 600
  timeFormatted: string; // e.g. "01:30"
  track: 'red' | 'blue' | 'siem';
  origin: 'real_siem' | 'wargame_sim'; // Real SOC Ingestion vs Simulated Attack
  icon: string;
  title: string;
  description: string;
  targetNodeId: string;
  nodeStateAfter: TopologyNode['status'];
  healthDelta?: number;
  mitreTTP?: string;
  rawLog: string;
  logRateEps: number; // Events Per Second at this moment
}

// Preset Palette Catalog (CYBER RANGES Style)
const PALETTE_DEFENSE_ENTITIES: PaletteItem[] = [
  {
    id: 'ent_c4isr',
    name: 'C4ISR 指管中樞主機',
    category: 'defense_entity',
    type: 'c4isr',
    zone: 'C4ISR Core',
    icon: 'Cpu',
    description: '核心戰區指揮與防空作戰分發主機 (Linux Hardened / MIL-STD)',
    defaultCVE: ['CVE-2024-21626'],
    color: '#00FF66'
  },
  {
    id: 'ent_radar_gw',
    name: '防空雷達站資料網閘',
    category: 'defense_entity',
    type: 'radar',
    zone: 'Tactical',
    icon: 'Radar',
    description: '連接超高頻 (EHF) 戰術雷達天線與光纖介面之單向網閘 (Data Diode)',
    defaultCVE: ['CVE-2023-38545'],
    color: '#22d3ee'
  },
  {
    id: 'ent_mil_router',
    name: '軍用戰術加密路由器',
    category: 'defense_entity',
    type: 'router',
    zone: 'DMZ',
    icon: 'Radio',
    description: '具備 IPSec Type-1 硬體加密晶片之戰場骨幹路由器',
    defaultCVE: [],
    color: '#3b82f6'
  },
  {
    id: 'ent_ngfw',
    name: '戰略邊界次世代防火牆',
    category: 'defense_entity',
    type: 'firewall',
    zone: 'DMZ',
    icon: 'Shield',
    description: '深度封包過濾 (DPI) 與零信任策略閘道',
    defaultCVE: ['CVE-2024-21887'],
    color: '#a855f7'
  },
  {
    id: 'ent_ot_scada',
    name: '飛彈發射井 SCADA/PLC',
    category: 'defense_entity',
    type: 'scada',
    zone: 'OT Field',
    icon: 'Server',
    description: 'S7Comm / Modbus 協定之發射架伺服控制與液壓動力單元',
    defaultCVE: ['CVE-2022-38465'],
    color: '#f97316'
  },
  {
    id: 'ent_crypto_vault',
    name: '戰術密碼金鑰資料庫',
    category: 'defense_entity',
    type: 'crypto_vault',
    zone: 'C4ISR Core',
    icon: 'Database',
    description: '存放戰術通信加密密鑰 (Crypto Keys) 與身份憑證庫',
    defaultCVE: [],
    color: '#ec4899'
  },
  {
    id: 'ent_honeypot',
    name: '主動誘敵戰術蜜罐 (Deception Trap)',
    category: 'defense_entity',
    type: 'honeypot',
    zone: 'Tactical',
    icon: 'Target',
    description: '高互動偽裝節點，即時誘捕紅軍滲透載荷與 TTPs',
    defaultCVE: ['CVE-Trap-Sim'],
    color: '#eab308'
  }
];

const PALETTE_ATTACK_TTPS: PaletteItem[] = [
  {
    id: 'ttp_init_access',
    name: 'T1190: 邊界漏洞突破 (Initial Access)',
    category: 'attack_tactic',
    mitreCode: 'T1190',
    icon: 'Zap',
    description: '利用邊界 VPN 或公開服務零日漏洞注入 WebShell 取得立足點',
    color: '#FF3333'
  },
  {
    id: 'ttp_spearphish',
    name: 'T1566: 戰術公文魚叉釣魚',
    category: 'attack_tactic',
    mitreCode: 'T1566.001',
    icon: 'Flame',
    description: '偽冒戰略演習命令發送惡意巨集武器化檔案 (Weaponized Doc)',
    color: '#FF5533'
  },
  {
    id: 'ttp_lateral_mov',
    name: 'T1021: 內網橫向推進 (Lateral Movement)',
    category: 'attack_tactic',
    mitreCode: 'T1021.002',
    icon: 'ArrowRight',
    description: '透過 Mimikatz 傾印 Pass-the-Hash 或 SMB 憑證快速滲透鄰近節點',
    color: '#FF2200'
  },
  {
    id: 'ttp_priv_esc',
    name: 'T1548: SYSTEM 特權提升',
    category: 'attack_tactic',
    mitreCode: 'T1548',
    icon: 'Key',
    description: '利用核心漏洞或服務提權繞過 UAC 取得最高管理者權限',
    color: '#FF0055'
  },
  {
    id: 'ttp_c2_beacon',
    name: 'T1071: 隱蔽 C2 協定通道',
    category: 'attack_tactic',
    mitreCode: 'T1071.004',
    icon: 'Radio',
    description: '透過 DNS 隧道或加密 HTTPS 建立長週期心跳連線 (Cobalt Strike)',
    color: '#FF0088'
  },
  {
    id: 'ttp_wipe_impact',
    name: 'T1489: 指管通訊破壞抹除 (Impact)',
    category: 'attack_tactic',
    mitreCode: 'T1489',
    icon: 'AlertOctagon',
    description: '向 C4ISR 節點發送破壞性 Wipe 程式碼，毀滅戰場感知即時資料',
    color: '#990000'
  }
];

// Initial Topology Nodes with Standard Tactical Layout
const INITIAL_NODES: TopologyNode[] = [
  {
    id: 'node_gw',
    name: '邊界次世代防火牆 (GW-NGFW-01)',
    code: 'NGFW-BORDER',
    type: 'firewall',
    zone: 'DMZ',
    ip: '192.168.1.1',
    defconLevel: 3,
    cveVulns: ['CVE-2024-21887'],
    successProbability: 85,
    status: 'targeted',
    health: 65,
    x: 120,
    y: 140,
    bandwidthMbps: 10000,
    attachedTTPs: [
      {
        id: 'att_1',
        tacticId: 'ttp_init_access',
        name: 'T1190: 邊界漏洞突破',
        phase: 'Initial Access',
        technique: 'Exploit Public-Facing App',
        color: '#FF3333',
        icon: 'Zap',
        attackIntensity: 'Aggressive'
      }
    ]
  },
  {
    id: 'node_router',
    name: '戰術核心骨幹路由器 (TAC-RTR-02)',
    code: 'RTR-CORE',
    type: 'router',
    zone: 'Tactical',
    ip: '10.100.1.1',
    defconLevel: 3,
    cveVulns: [],
    successProbability: 40,
    status: 'healthy',
    health: 90,
    x: 360,
    y: 140,
    bandwidthMbps: 40000,
    attachedTTPs: []
  },
  {
    id: 'node_radar',
    name: '防空預警雷達資料網閘 (RADAR-GW)',
    code: 'RADAR-INT',
    type: 'radar',
    zone: 'Tactical',
    ip: '10.100.20.5',
    defconLevel: 2,
    cveVulns: ['CVE-2023-38545'],
    successProbability: 70,
    status: 'compromised',
    health: 35,
    x: 360,
    y: 320,
    bandwidthMbps: 1000,
    attachedTTPs: [
      {
        id: 'att_2',
        tacticId: 'ttp_lateral_mov',
        name: 'T1021: 內網橫向推進',
        phase: 'Lateral Movement',
        technique: 'SMB Admin Shares',
        color: '#FF2200',
        icon: 'ArrowRight',
        attackIntensity: 'Stealthy'
      }
    ]
  },
  {
    id: 'node_c4isr',
    name: 'C4ISR 指揮管制核心 (C4ISR-CORE-01)',
    code: 'C4ISR-HQ',
    type: 'c4isr',
    zone: 'C4ISR Core',
    ip: '10.200.1.10',
    defconLevel: 1,
    cveVulns: ['CVE-2024-21626'],
    successProbability: 95,
    status: 'targeted',
    health: 50,
    x: 640,
    y: 140,
    bandwidthMbps: 100000,
    attachedTTPs: [
      {
        id: 'att_3',
        tacticId: 'ttp_wipe_impact',
        name: 'T1489: 指管通訊破壞抹除',
        phase: 'Impact',
        technique: 'Service Stop / Wiper',
        color: '#990000',
        icon: 'AlertOctagon',
        attackIntensity: 'Brute Force'
      }
    ]
  },
  {
    id: 'node_vault',
    name: '戰術密碼金鑰資料庫 (CRYPTO-VAULT)',
    code: 'DB-CRYPTO',
    type: 'crypto_vault',
    zone: 'C4ISR Core',
    ip: '10.200.1.50',
    defconLevel: 2,
    cveVulns: [],
    successProbability: 25,
    status: 'shielded',
    health: 98,
    x: 640,
    y: 320,
    bandwidthMbps: 10000,
    attachedTTPs: []
  },
  {
    id: 'node_honeypot',
    name: '誘敵密網戰術蜜罐 (DECOY-TRAP)',
    code: 'TRAP-C4ISR',
    type: 'honeypot',
    zone: 'Tactical',
    ip: '172.16.99.88',
    defconLevel: 4,
    cveVulns: ['CVE-Trap-Sim'],
    successProbability: 10,
    status: 'healthy',
    health: 100,
    x: 120,
    y: 320,
    bandwidthMbps: 1000,
    attachedTTPs: []
  }
];

const INITIAL_EDGES: TopologyEdge[] = [
  { id: 'edge_gw_rtr', from: 'node_gw', to: 'node_router', bandwidth: '10 Gbps', firewallPolicy: 'Stateful-Inspect', isCompromisedPath: true },
  { id: 'edge_rtr_c4isr', from: 'node_router', to: 'node_c4isr', bandwidth: '40 Gbps', firewallPolicy: 'Strict-ZeroTrust', isCompromisedPath: true },
  { id: 'edge_rtr_radar', from: 'node_router', to: 'node_radar', bandwidth: '1 Gbps', firewallPolicy: 'Stateful-Inspect', isCompromisedPath: false },
  { id: 'edge_c4isr_vault', from: 'node_c4isr', to: 'node_vault', bandwidth: '10 Gbps', firewallPolicy: 'Strict-ZeroTrust', isCompromisedPath: false },
  { id: 'edge_gw_honey', from: 'node_gw', to: 'node_honeypot', bandwidth: '1 Gbps', firewallPolicy: 'Allow-All', isCompromisedPath: false }
];

// Complete Multi-Track Timeline Events with Origin Flag (Real SIEM vs Wargame Simulation)
const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt_001',
    timeSec: 30,
    timeFormatted: '00:30',
    track: 'red',
    origin: 'wargame_sim',
    icon: '🎯',
    title: '紅軍發起邊界 VPN 探測 (Reconnaissance)',
    description: 'APT 組織對邊界防火牆 (GW-BORDER) 發送大量 TCP 443 探測與 CVE-2024-21887 漏洞驗證特徵。',
    targetNodeId: 'node_gw',
    nodeStateAfter: 'targeted',
    healthDelta: -10,
    mitreTTP: 'T1190 Exploit Public-Facing App',
    rawLog: '[00:30.12] [SIM-SURICATA] ET EXPLOIT Ivanti/VPN WebShell Injection attempt from 198.51.100.44 -> 192.168.1.1:443',
    logRateEps: 180
  },
  {
    id: 'evt_002',
    timeSec: 90,
    timeFormatted: '01:30',
    track: 'red',
    origin: 'wargame_sim',
    icon: '⚡',
    title: '突破 DMZ 邊界，植入 WebShell 立足點',
    description: '利用 VPN 韌體緩衝區溢位漏洞成功寫入記憶體常駐 Beacon，節點變為受駭狀態。',
    targetNodeId: 'node_gw',
    nodeStateAfter: 'compromised',
    healthDelta: -25,
    mitreTTP: 'T1059.004 Command & Scripting Interpreter',
    rawLog: '[01:30.45] [SIM-ZEEK] HTTP POST /api/v1/license with suspicious encoded payload (size=4820B) from 198.51.100.44',
    logRateEps: 450
  },
  {
    id: 'evt_003',
    timeSec: 140,
    timeFormatted: '02:20',
    track: 'siem',
    origin: 'real_siem',
    icon: '🚨',
    title: 'SIEM 湧入真實高危告警 (Log Surge 12,000 EPS)',
    description: 'SEMOR 關聯分析引擎觸發跨節點「異質威脅情資高信度比對」，發出 Level 4 戰時緊急廣播。',
    targetNodeId: 'node_gw',
    nodeStateAfter: 'targeted',
    rawLog: '[02:20.00] [REAL-SEMOR-CORRELATION] Incident #INC-2026-9901 created: Critical Severity APT Lateral Pipeline Ingestion.',
    logRateEps: 1200
  },
  {
    id: 'evt_004',
    timeSec: 200,
    timeFormatted: '03:20',
    track: 'red',
    origin: 'wargame_sim',
    icon: '☠️',
    title: 'Pass-the-Hash 橫向滲透戰術雷達網閘',
    description: '竊取管理者 Kerberos TGT 票證，以 SMB 偽冒指令登入防空雷達資料網閘 (RADAR-GW)。',
    targetNodeId: 'node_radar',
    nodeStateAfter: 'compromised',
    healthDelta: -35,
    mitreTTP: 'T1021.002 SMB/Windows Admin Shares',
    rawLog: '[03:20.18] [SIM-VELOCIRAPTOR] Windows Event 4624 (Logon Type 3) with High Privilege NTLM Hash to RADAR-INT',
    logRateEps: 680
  },
  {
    id: 'evt_005',
    timeSec: 260,
    timeFormatted: '04:20',
    track: 'blue',
    origin: 'wargame_sim',
    icon: '🛡️',
    title: '藍軍觸發 DEFCON 2 交戰規則：啟用零信任能量盾',
    description: '指揮官授權執行 SOAR 戰術劇本，下發微隔離 (Micro-segmentation) 策略，阻斷雷達向密碼庫連線。',
    targetNodeId: 'node_vault',
    nodeStateAfter: 'shielded',
    healthDelta: +20,
    rawLog: '[04:20.30] [SOAR-ACTION] SDN Controller isolated subnet 10.200.1.50/32; Zero-Trust Ring Fence Active.',
    logRateEps: 320
  },
  {
    id: 'evt_006',
    timeSec: 340,
    timeFormatted: '05:40',
    track: 'red',
    origin: 'wargame_sim',
    icon: '💥',
    title: '紅軍發起 C4ISR 指管伺服器抹除突襲 (Impact)',
    description: '下發毀滅性 Wiper 指令企圖中斷戰時態勢圖資料分發，C4ISR 核心伺服器遭受強烈衝擊！',
    targetNodeId: 'node_c4isr',
    nodeStateAfter: 'compromised',
    healthDelta: -45,
    mitreTTP: 'T1489 Service Stop / Wiper Destruction',
    rawLog: '[05:40.02] [SIM-EDR] Suspicious mass file unlinking in /opt/c4isr/tactical_stream/ (Process: wiper_x64.bin)',
    logRateEps: 1850
  },
  {
    id: 'evt_007',
    timeSec: 420,
    timeFormatted: '07:00',
    track: 'blue',
    origin: 'real_siem',
    icon: '⚙️',
    title: '誘敵蜜罐成功誘捕！真實 SIEM 接收樣本雜湊',
    description: '戰術蜜罐 (DECOY-TRAP) 廣播虛假 C4ISR 密碼廣播，紅軍攻擊載荷全數被導引並捕獲樣本。',
    targetNodeId: 'node_honeypot',
    nodeStateAfter: 'shielded',
    healthDelta: +10,
    rawLog: '[07:00.15] [REAL-DECEPTION] Attacker pivoted into Honeypot Sandbox; SHA256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    logRateEps: 410
  },
  {
    id: 'evt_008',
    timeSec: 500,
    timeFormatted: '08:20',
    track: 'blue',
    origin: 'wargame_sim',
    icon: '🔒',
    title: '全網熱備份秒級切換，清除惡意常駐程式',
    description: 'C4ISR 主備切換完成，恢復戰場共同作戰圖像 (COP)，防禦判定全面勝利！',
    targetNodeId: 'node_c4isr',
    nodeStateAfter: 'healthy',
    healthDelta: +50,
    rawLog: '[08:20.55] [SYSTEM-HEALTH] C4ISR Failover Cluster promoted secondary node; Integrity Hash verified 100%.',
    logRateEps: 150
  }
];

// MITRE ATT&CK Matrix Coverage Reference for the wargame
const MITRE_TACTIC_COLUMNS = [
  {
    tactic: 'Initial Access (初始突破)',
    techniques: [
      { id: 'T1190', name: 'Exploit Public-Facing App', hit: true, status: 'Compromised' },
      { id: 'T1566', name: 'Phishing: Spearphishing Attachment', hit: true, status: 'Blocked' },
      { id: 'T1133', name: 'External Remote Services', hit: false, status: 'Unused' }
    ]
  },
  {
    tactic: 'Execution (指令執行)',
    techniques: [
      { id: 'T1059', name: 'Command & Scripting: PowerShell', hit: true, status: 'Compromised' },
      { id: 'T1204', name: 'User Execution: Malicious File', hit: false, status: 'Unused' },
      { id: 'T1053', name: 'Scheduled Task / Job', hit: true, status: 'Mitigated' }
    ]
  },
  {
    tactic: 'Lateral Movement (橫向移動)',
    techniques: [
      { id: 'T1021.002', name: 'SMB/Windows Admin Shares', hit: true, status: 'Compromised' },
      { id: 'T1021.001', name: 'Remote Desktop Protocol', hit: false, status: 'Unused' },
      { id: 'T1550', name: 'Pass the Hash / Kerberos Ticket', hit: true, status: 'Mitigated' }
    ]
  },
  {
    tactic: 'Command & Control (指揮控制)',
    techniques: [
      { id: 'T1071.004', name: 'DNS Tunneling / Beacon', hit: true, status: 'Compromised' },
      { id: 'T1071.001', name: 'Web Protocols: HTTPS C2', hit: true, status: 'Blocked' },
      { id: 'T1105', name: 'Ingress Tool Transfer', hit: false, status: 'Unused' }
    ]
  },
  {
    tactic: 'Impact (破壞抹除)',
    techniques: [
      { id: 'T1489', name: 'Service Stop / C4ISR Disruption', hit: true, status: 'Mitigated' },
      { id: 'T1485', name: 'Data Destruction / Wiper', hit: true, status: 'Blocked' },
      { id: 'T1498', name: 'Network Denial of Service', hit: false, status: 'Unused' }
    ]
  }
];

export default function CyberWargamingView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Primary Wargaming Navigation Mode
  const [activeTab, setActiveTab] = useState<WargameTab>('workbench');

  // Topology Canvas State (CYBER RANGES)
  const [nodes, setNodes] = useState<TopologyNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<TopologyEdge[]>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_c4isr');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging Nodes / Connecting Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // AAR Infinity Dynamic Timeline State
  const [playheadSec, setPlayheadSec] = useState<number>(140); // 0 to 600 seconds
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<1 | 2 | 4>(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>('evt_003');
  const [originFilter, setOriginFilter] = useState<'all' | 'real_siem' | 'wargame_sim'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Play audio synthetic tactical feedback
  const playTacticalSound = (freq = 880, type: OscillatorType = 'sine', duration = 0.1) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  // -------------------------------------------------------------------------
  // TIMELINE PLAYBACK & TOPOLOGY SNAPSHOT SYNCHRONIZATION
  // -------------------------------------------------------------------------
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlayheadSec((prev) => {
          if (prev >= 600) {
            setIsPlaying(false);
            return 600;
          }
          return prev + 2 * playSpeed;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playSpeed]);

  // Synchronize Topology Node States with Timeline Playhead Scrubbing
  useEffect(() => {
    // Filter all events happened on or before current playheadSec
    const pastEvents = TIMELINE_EVENTS.filter((e) => e.timeSec <= playheadSec);

    // Compute dynamic state for each node based on event history
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const relatedEvents = pastEvents.filter((e) => e.targetNodeId === node.id);
        if (relatedEvents.length === 0) {
          return {
            ...node,
            status: 'healthy',
            health: 100
          };
        }
        const lastEvt = relatedEvents[relatedEvents.length - 1];
        let totalHealth = 100;
        relatedEvents.forEach((e) => {
          if (e.healthDelta) totalHealth += e.healthDelta;
        });
        totalHealth = Math.max(10, Math.min(100, totalHealth));

        return {
          ...node,
          status: lastEvt.nodeStateAfter,
          health: totalHealth
        };
      })
    );
  }, [playheadSec]);

  // -------------------------------------------------------------------------
  // CANVAS DRAG & DROP HANDLERS (HTML5 Drag and Drop)
  // -------------------------------------------------------------------------
  const handleDragStartPalette = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const item: PaletteItem = JSON.parse(rawData);
      const rect = canvasRef.current?.getBoundingClientRect();
      const dropX = rect ? (e.clientX - rect.left - pan.x) / zoom : 200;
      const dropY = rect ? (e.clientY - rect.top - pan.y) / zoom : 200;

      if (item.category === 'defense_entity') {
        // Create a new defense entity node
        const newNode: TopologyNode = {
          id: `node_${Date.now()}`,
          name: `${item.name} (${item.zone})`,
          code: `ASSET-${Math.floor(Math.random() * 900 + 100)}`,
          type: item.type || 'c4isr',
          zone: item.zone || 'Tactical',
          ip: `10.100.${Math.floor(Math.random() * 50 + 1)}.${Math.floor(Math.random() * 200 + 10)}`,
          defconLevel: 3,
          cveVulns: item.defaultCVE || [],
          successProbability: 50,
          status: 'healthy',
          health: 100,
          x: Math.round(dropX - 60),
          y: Math.round(dropY - 30),
          bandwidthMbps: 10000,
          attachedTTPs: []
        };

        setNodes((prev) => [...prev, newNode]);
        setSelectedNodeId(newNode.id);
        playTacticalSound(600, 'sine', 0.15);
        showToast(isZh ? `已將防禦實體 [${item.name}] 佈署至拓撲畫布！` : `Deployed [${item.name}] to canvas.`);
      } else if (item.category === 'attack_tactic') {
        // If dropped onto a specific node, attach the TTP!
        if (hoveredNodeId) {
          handleAttachTTPToNode(hoveredNodeId, item);
        } else {
          showToast(isZh ? '請將攻擊戰術徽章拖曳並「附著」至特定資產節點上！' : 'Please drop attack tactic badge directly ONTO a node.');
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped item', err);
    }
  };

  const handleAttachTTPToNode = (nodeId: string, item: PaletteItem) => {
    const newAttached: AttachedTTP = {
      id: `att_${Date.now()}`,
      tacticId: item.id,
      name: item.name,
      phase: item.category,
      technique: item.description,
      color: item.color,
      icon: item.icon,
      attackIntensity: 'Aggressive'
    };

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            status: 'compromised',
            attachedTTPs: [...n.attachedTTPs, newAttached]
          };
        }
        return n;
      })
    );

    setSelectedNodeId(nodeId);
    playTacticalSound(300, 'sawtooth', 0.25);
    showToast(isZh ? `🎯 已將攻擊戰術 [${item.name}] 附著於節點，觸發受駭紅光光暈！` : `Attached TTP to node with red glow!`);
  };

  // Node Dragging Inside Canvas
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingSourceId) {
      // Complete connection
      if (connectingSourceId !== nodeId) {
        const newEdge: TopologyEdge = {
          id: `edge_${connectingSourceId}_${nodeId}`,
          from: connectingSourceId,
          to: nodeId,
          bandwidth: '10 Gbps',
          firewallPolicy: 'Stateful-Inspect',
          isCompromisedPath: false
        };
        setEdges((prev) => [...prev, newEdge]);
        playTacticalSound(800, 'sine', 0.1);
        showToast(isZh ? `🔗 已在節點間建立拓撲連線！` : `Edge connection created.`);
      }
      setConnectingSourceId(null);
      return;
    }

    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === draggingNodeId) {
            return {
              ...n,
              x: Math.round(mouseX - 60),
              y: Math.round(mouseY - 30)
            };
          }
          return n;
        })
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setConnectingSourceId(null);
    }
  };

  // Auto Layout Nodes neatly across zones
  const handleAutoLayout = () => {
    const zoneMap: Record<string, { x: number; count: number }> = {
      'External': { x: 80, count: 0 },
      'DMZ': { x: 180, count: 0 },
      'Tactical': { x: 420, count: 0 },
      'C4ISR Core': { x: 680, count: 0 },
      'OT Field': { x: 920, count: 0 }
    };

    setNodes((prev) =>
      prev.map((n) => {
        const zoneInfo = zoneMap[n.zone] || { x: 300, count: 0 };
        const yPos = 140 + zoneInfo.count * 160;
        zoneInfo.count += 1;
        return {
          ...n,
          x: zoneInfo.x,
          y: yPos
        };
      })
    );
    showToast(isZh ? '已完成軍事防禦區段自動對齊排列 (Auto Layout)！' : 'Auto aligned nodes by tactical zones.');
  };

  // Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.0, Math.max(0.5, prev * zoomFactor)));
  };

  // Filtered timeline events by origin (Real SIEM vs Wargame Sim)
  const filteredTimelineEvents = TIMELINE_EVENTS.filter((e) => {
    if (originFilter === 'all') return true;
    return e.origin === originFilter;
  });

  // Selected Object References
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const activeTimelineEvent = TIMELINE_EVENTS.find((e) => e.id === selectedEventId) || TIMELINE_EVENTS[0];

  return (
    <div className="space-y-6 text-left text-gray-100 pb-12 font-sans select-none animate-in fade-in duration-500">
      
      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0c101c] border border-emerald-500/60 text-white px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(0,255,102,0.2)] flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-ping" />
            <ShieldCheck className="text-[#00FF66]" size={18} />
            <span className="text-xs font-bold font-mono tracking-wide text-white">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BANNER: MILITARY CYBER WARFARE COMMAND CENTER */}
      <div className="bg-[#0b0d14] border-2 border-emerald-950/70 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_40px_rgba(0,255,102,0.06)]">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-red-600/10 via-emerald-600/5 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-950/60 via-gray-900 to-emerald-950/60 rounded-2xl flex items-center justify-center border border-emerald-500/40 shadow-inner text-[#00FF66]">
              <Swords size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                  <span>{isZh ? 'SEMOR CYBER 兵棋推演與網路靶場工作台' : 'SEMOR Cyber Wargaming & Range Workbench'}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/10 text-[#00FF66] border border-emerald-500/30 font-mono">
                    CYBER RANGES & AIRBUS AAR
                  </span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {isZh ? '靶場實時連線中' : 'LIVE EXERCISE'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl font-mono">
                {isZh
                  ? '整合「CYBER RANGES 畫布式拖拽拓撲編輯器」與「Airbus Infinity 多軌交戰復盤時間軸」：支援軍事資產節點自由佈局、MITRE 攻擊徽章附著與雷達光暈、真實 SIEM 告警與虛擬攻擊標記區隔、毫秒級戰況重播快照同步。'
                  : 'Featuring drag-and-drop Range Workbench canvas with MITRE TTPs badge snapping, real SIEM vs wargame sim distinction, plus Airbus Infinity multi-track AAR scrubbable playback.'}
              </p>
            </div>
          </div>

          {/* QUICK TELEMETRY BADGES & AUDIO/REPORT CONTROLS */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-4 py-2.5 bg-black/70 border border-red-900/60 rounded-xl text-left shadow-inner">
              <div className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {isZh ? '紅軍攻勢節點' : 'Red Compromised'}
              </div>
              <div className="text-xl font-black text-red-400">
                {nodes.filter((n) => n.status === 'compromised' || n.status === 'targeted').length} / {nodes.length}
              </div>
            </div>

            <div className="px-4 py-2.5 bg-black/70 border border-emerald-900/60 rounded-xl text-left shadow-inner">
              <div className="text-[10px] text-[#00FF66] uppercase font-bold flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#00FF66]" />
                {isZh ? '藍軍防禦健康度' : 'Blue Fleet Health'}
              </div>
              <div className="text-xl font-black text-[#00FF66]">
                {Math.round(nodes.reduce((acc, n) => acc + n.health, 0) / nodes.length)}%
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? '音效已開啟' : '音效已靜音'}
                className={cn(
                  'p-2 rounded-lg border text-xs flex items-center justify-center transition-colors',
                  soundEnabled ? 'bg-emerald-950/80 text-[#00FF66] border-emerald-500/50' : 'bg-black text-gray-500 border-gray-800'
                )}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow"
              >
                <Download size={12} />
                {isZh ? 'AAR 報告' : 'AAR PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY WORKSPACE MODE TABS */}
        <div className="mt-6 flex flex-wrap bg-black/80 p-1.5 rounded-xl border border-gray-800 gap-1.5">
          {[
            { id: 'workbench', label: isZh ? '🎨 介面 1: 畫布式拖拽拓撲編輯器 (CYBER RANGES)' : 'Range Workbench Canvas', icon: <Layers size={14} /> },
            { id: 'aar_infinity', label: isZh ? '🕒 介面 2: 交戰時序復盤時間軸 (Airbus Infinity AAR)' : 'Airbus Infinity AAR Timeline', icon: <Clock size={14} /> },
            { id: 'mitre_matrix', label: isZh ? '🎯 MITRE ATT&CK 攻防戰術覆蓋矩陣' : 'MITRE ATT&CK Coverage', icon: <BarChart3 size={14} /> },
            { id: 'cop', label: isZh ? '🛡️ 藍軍戰區態勢感知 (COP & ROE)' : 'Blue COP & ROE', icon: <Shield size={14} /> },
            { id: 'scenarios', label: isZh ? '📜 國家級 APT 攻防想定庫 (Scenarios & Schema)' : 'APT Scenarios', icon: <FileText size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 min-w-[180px] py-2.5 px-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-mono border',
                activeTab === tab.id
                  ? 'bg-emerald-950/80 text-[#00FF66] border-emerald-500/60 shadow-[0_0_20px_rgba(0,255,102,0.2)]'
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-850'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: CYBER RANGES STYLE DRAG-AND-DROP TOPOLOGY WORKBENCH               */}
      {/* ========================================================================= */}
      {(activeTab === 'workbench' || activeTab === 'aar_infinity') && (
        <div className="space-y-6">

          {/* THREE-COLUMN WORKBENCH LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
            
            {/* ----------------------------------------------------------------- */}
            {/* COLUMN 1: LEFT PALETTE (防禦實體資產庫 + MITRE 攻擊戰術徽章) */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-[#080a10] border border-gray-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
              <div className="space-y-5 overflow-y-auto custom-scrollbar pr-1 max-h-[620px]">
                
                {/* Section Header */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Box className="text-[#00FF66]" size={14} />
                      {isZh ? '兵棋元件庫 (Palette Catalog)' : 'Tactical Palette'}
                    </h3>
                    <span className="text-[9px] font-mono bg-emerald-950 text-[#00FF66] px-2 py-0.5 rounded border border-emerald-800">
                      Drag & Drop
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">
                    {isZh ? '可將下方元件拖入中央畫布生成節點，或將紅色戰術徽章附著於節點上！' : 'Drag items into canvas or drop TTP badges onto nodes.'}
                  </p>
                </div>

                {/* Sub-Group 1: 防禦實體 (Defense Entities) */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-black font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    {isZh ? '【防禦實體】網路與指管節點' : 'Defense Entities (Nodes)'}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {PALETTE_DEFENSE_ENTITIES.map((ent) => (
                      <div
                        key={ent.id}
                        draggable
                        onDragStart={(e) => handleDragStartPalette(e, ent)}
                        className="p-2.5 bg-black/60 hover:bg-emerald-950/30 border border-gray-800 hover:border-emerald-500/50 rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group shadow-sm hover:shadow-[0_0_15px_rgba(0,255,102,0.1)]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-1.5 rounded-lg border flex items-center justify-center"
                            style={{ borderColor: ent.color + '60', backgroundColor: ent.color + '15', color: ent.color }}
                          >
                            <Cpu size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-200 group-hover:text-white font-mono">{ent.name}</div>
                            <div className="text-[9px] text-gray-500 font-mono truncate max-w-[170px]">{ent.zone}</div>
                          </div>
                        </div>
                        <Plus size={14} className="text-gray-600 group-hover:text-[#00FF66] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-Group 2: 攻擊戰術 (MITRE ATT&CK TTP Badges) */}
                <div className="space-y-2.5 pt-2 border-t border-gray-800">
                  <div className="text-[10px] font-black font-mono text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={12} className="animate-pulse" />
                    {isZh ? '【攻擊戰術】MITRE ATT&CK 徽章' : 'Attack TTP Badges (Drag to Snap)'}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {PALETTE_ATTACK_TTPS.map((ttp) => (
                      <div
                        key={ttp.id}
                        draggable
                        onDragStart={(e) => handleDragStartPalette(e, ttp)}
                        className="p-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-500/80 rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group shadow-sm hover:shadow-[0_0_20px_rgba(255,51,51,0.2)]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-1.5 rounded-lg border flex items-center justify-center animate-pulse"
                            style={{ borderColor: ttp.color + '80', backgroundColor: ttp.color + '20', color: ttp.color }}
                          >
                            <Target size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-red-300 group-hover:text-white font-mono">{ttp.name}</div>
                            <div className="text-[9px] text-red-400/70 font-mono">{ttp.mitreCode}</div>
                          </div>
                        </div>
                        <Zap size={14} className="text-red-500 group-hover:text-red-300" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Palette Quick Help */}
              <div className="mt-4 pt-3 border-t border-gray-850 text-[10px] font-mono text-gray-500 flex items-center justify-between">
                <span>💡 支援滾輪縮放與連線拉取</span>
                <span className="text-emerald-400">Ver. 4.3-MIL</span>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* COLUMN 2: CENTER CANVAS (動態畫布 + 雷達網格 + 連線拓撲 + 攻擊光暈) */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-6 bg-[#07090e] border border-gray-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              
              {/* Canvas Top Bar Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-ping" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Compass size={14} className="text-[#00FF66]" />
                    {isZh ? '戰術拓撲畫布 (Dynamic Workbench)' : 'Topology Workbench'}
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500">[{nodes.length} 節點 / {edges.length} 鏈路]</span>
                </div>

                {/* Canvas Zoom & Tool Controls */}
                <div className="flex items-center gap-1.5 bg-black/70 p-1 rounded-lg border border-gray-800 font-mono text-xs">
                  <button
                    onClick={handleAutoLayout}
                    title={isZh ? '自動排列對齊節點' : 'Auto Align Nodes'}
                    className="p-1.5 hover:bg-gray-800 text-emerald-400 hover:text-emerald-300 rounded flex items-center gap-1 text-[10px]"
                  >
                    <Grid size={13} />
                    <span className="hidden sm:inline">{isZh ? '自動對齊' : 'Align'}</span>
                  </button>
                  <div className="w-px h-4 bg-gray-800 mx-0.5" />
                  <button
                    onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
                    title="Zoom In"
                    className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <span className="px-1 text-[10px] text-cyan-400 font-bold">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    title="Zoom Out"
                    className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <button
                    onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                    title="Reset View"
                    className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded text-[10px]"
                  >
                    1:1
                  </button>
                </div>
              </div>

              {/* INTERACTIVE WORKBENCH CANVAS AREA */}
              <div
                ref={canvasRef}
                onDragOver={handleCanvasDragOver}
                onDrop={handleCanvasDrop}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onWheel={handleWheel}
                className="relative w-full h-[520px] bg-[#05070a] rounded-xl overflow-hidden border border-gray-850 cursor-crosshair select-none my-3"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at center, rgba(0, 255, 102, 0.03) 0%, transparent 70%),
                    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 30px 30px, 30px 30px'
                }}
              >
                {/* Military Radar Sweep Line Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#00FF66] to-transparent animate-bounce opacity-40" />
                </div>

                {/* Transformable Canvas Group */}
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: '1200px',
                    height: '800px',
                    position: 'absolute'
                  }}
                >
                  {/* SVG CONNECTING EDGES */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                    <defs>
                      <marker id="arrow-green" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#00FF66" />
                      </marker>
                      <marker id="arrow-red" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#FF3333" />
                      </marker>
                    </defs>

                    {edges.map((edge) => {
                      const fromNode = nodes.find((n) => n.id === edge.from);
                      const toNode = nodes.find((n) => n.id === edge.to);
                      if (!fromNode || !toNode) return null;

                      const startX = fromNode.x + 80;
                      const startY = fromNode.y + 35;
                      const endX = toNode.x + 80;
                      const endY = toNode.y + 35;
                      const isSelected = selectedEdgeId === edge.id;

                      return (
                        <g key={edge.id} className="cursor-pointer pointer-events-auto" onClick={() => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}>
                          {/* Outer halo line */}
                          <line
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke={edge.isCompromisedPath ? '#FF3333' : isSelected ? '#00FF66' : '#1e293b'}
                            strokeWidth={isSelected ? 5 : edge.isCompromisedPath ? 3 : 2}
                            strokeDasharray={edge.isCompromisedPath ? '6 4' : undefined}
                            opacity={0.8}
                          />

                          {/* Pulsing particle on edge */}
                          {edge.isCompromisedPath ? (
                            <circle cx={(startX + endX) / 2} cy={(startY + endY) / 2} r="4" fill="#FF3333" className="animate-ping" />
                          ) : (
                            <circle cx={(startX + endX) / 2} cy={(startY + endY) / 2} r="3" fill="#00FF66" />
                          )}

                          {/* Edge Bandwidth & Firewall Badge */}
                          <foreignObject
                            x={(startX + endX) / 2 - 40}
                            y={(startY + endY) / 2 - 12}
                            width="80"
                            height="24"
                          >
                            <div className="bg-black/80 border border-gray-700 text-[8px] font-mono text-gray-300 px-1 py-0.5 rounded text-center truncate shadow">
                              {edge.firewallPolicy === 'Strict-ZeroTrust' ? '🔒 0-Trust' : edge.bandwidth}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}

                    {/* Temporary Connecting Line while user drags to link */}
                    {connectingSourceId && (
                      <line
                        x1={(nodes.find((n) => n.id === connectingSourceId)?.x || 0) + 80}
                        y1={(nodes.find((n) => n.id === connectingSourceId)?.y || 0) + 35}
                        x2={hoveredNodeId ? (nodes.find((n) => n.id === hoveredNodeId)?.x || 0) + 80 : 500}
                        y2={hoveredNodeId ? (nodes.find((n) => n.id === hoveredNodeId)?.y || 0) + 35 : 300}
                        stroke="#00FF66"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}
                  </svg>

                  {/* TOPOLOGY NODES */}
                  {nodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const isCompromised = node.status === 'compromised';
                    const isTargeted = node.status === 'targeted';
                    const isShielded = node.status === 'shielded';
                    const hasAttachedTTPs = node.attachedTTPs.length > 0;

                    return (
                      <div
                        key={node.id}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          zIndex: isSelected ? 30 : 10
                        }}
                        className={cn(
                          'absolute w-44 p-3 rounded-xl border transition-all cursor-move select-none shadow-xl backdrop-blur-md',
                          // RED GLOW EFFECT FOR COMPROMISED OR TARGETED NODES WITH MITRE BADGES
                          isCompromised
                            ? 'bg-red-950/80 border-red-500 shadow-[0_0_30px_rgba(255,51,51,0.7)] animate-pulse'
                            : isTargeted
                            ? 'bg-amber-950/70 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                            : isShielded
                            ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)]'
                            : 'bg-[#0f1422]/90 border-gray-700 hover:border-[#00FF66]/70',
                          isSelected && 'ring-2 ring-[#00FF66] ring-offset-2 ring-offset-black'
                        )}
                      >
                        {/* Node Top Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded border',
                              isCompromised
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : isShielded
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-emerald-500/20 text-[#00FF66] border-emerald-500/40'
                            )}
                          >
                            {node.zone}
                          </span>

                          {/* Link Anchor Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConnectingSourceId(connectingSourceId === node.id ? null : node.id);
                              showToast(isZh ? `點選另一個節點以建立連線...` : `Click another node to link...`);
                            }}
                            title="拉出連線 (Link)"
                            className="p-1 text-gray-400 hover:text-[#00FF66] bg-black/50 rounded border border-gray-800"
                          >
                            <Link size={10} />
                          </button>
                        </div>

                        {/* Node Name & IP */}
                        <div className="mt-1.5">
                          <h4 className="text-xs font-black text-white truncate font-mono">{node.name}</h4>
                          <div className="text-[9px] text-gray-400 font-mono mt-0.5">{node.ip}</div>
                        </div>

                        {/* Health Bar */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[8px] font-mono text-gray-400">
                            <span>Health:</span>
                            <span className={cn('font-bold', node.health < 40 ? 'text-red-400' : 'text-[#00FF66]')}>
                              {node.health}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all duration-300',
                                node.health < 40 ? 'bg-red-500' : node.health < 70 ? 'bg-amber-500' : 'bg-[#00FF66]'
                              )}
                              style={{ width: `${node.health}%` }}
                            />
                          </div>
                        </div>

                        {/* ATTACHED MITRE TTPs BADGES */}
                        {hasAttachedTTPs && (
                          <div className="mt-2 pt-1.5 border-t border-red-900/50 space-y-1">
                            <div className="text-[7px] font-mono font-bold text-red-400 uppercase tracking-tight flex items-center gap-1">
                              <Target size={8} />
                              {isZh ? '已附著攻擊戰術 (TTPs):' : 'Attached TTPs:'}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {node.attachedTTPs.map((ttp) => (
                                <span
                                  key={ttp.id}
                                  className="text-[7px] font-mono bg-red-900/60 text-red-200 border border-red-500/60 px-1 py-0.5 rounded truncate max-w-full"
                                  title={ttp.name}
                                >
                                  ⚡ {ttp.name.split(':')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Bottom Instructions */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-2 border-t border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500 animate-ping" /> 紅色光暈：受駭節點</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-cyan-400" /> 青色：零信任能量盾</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#00FF66]" /> 綠色：正常守備</span>
                </div>
                <button
                  onClick={() => {
                    setNodes(INITIAL_NODES);
                    setEdges(INITIAL_EDGES);
                    showToast(isZh ? '已重置拓撲畫布至初始戰術預設值！' : 'Reset canvas to default preset.');
                  }}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw size={12} /> {isZh ? '重設畫布' : 'Reset'}
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* COLUMN 3: RIGHT INSPECTOR PANEL (節點屬性、連線策略、CVE 與攻擊機率) */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-[#080a10] border border-gray-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 max-h-[620px]">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Sliders className="text-[#00FF66]" size={14} />
                    {isZh ? '屬性檢查面板 (Inspector)' : 'Properties Inspector'}
                  </h3>
                  <span className="text-[9px] font-mono bg-gray-850 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                    {selectedNode ? 'NODE' : selectedEdge ? 'EDGE' : 'NONE'}
                  </span>
                </div>

                {/* NODE INSPECTOR DETAILS */}
                {selectedNode ? (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="p-3 bg-black/60 border border-gray-800 rounded-xl space-y-2">
                      <div className="text-[10px] text-gray-500 uppercase font-black">{isZh ? '目標資產識別' : 'Asset Identifier'}</div>
                      <div className="text-sm font-bold text-white">{selectedNode.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-gray-800">
                        <div>
                          <span className="text-gray-500">Code:</span> <span className="text-cyan-400 font-bold">{selectedNode.code}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Zone:</span> <span className="text-emerald-400 font-bold">{selectedNode.zone}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">IP:</span> <span className="text-white font-bold">{selectedNode.ip}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">DEFCON:</span> <span className="text-amber-400 font-bold">Level {selectedNode.defconLevel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attack Probability & Vulnerabilities */}
                    <div className="p-3 bg-black/60 border border-gray-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 uppercase font-black">{isZh ? '攻擊突破成功機率' : 'Breach Probability'}:</span>
                        <span className={cn('font-bold text-xs', selectedNode.successProbability > 70 ? 'text-red-400' : 'text-[#00FF66]')}>
                          {selectedNode.successProbability}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full',
                            selectedNode.successProbability > 70 ? 'bg-red-500' : 'bg-[#00FF66]'
                          )}
                          style={{ width: `${selectedNode.successProbability}%` }}
                        />
                      </div>

                      {/* CVE List */}
                      <div className="pt-2 border-t border-gray-800 space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase">{isZh ? '已知重大漏洞 (CVEs):' : 'Known CVEs:'}</span>
                        {selectedNode.cveVulns.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedNode.cveVulns.map((cve) => (
                              <span key={cve} className="text-[9px] bg-red-950/80 text-red-300 border border-red-500/50 px-1.5 py-0.5 rounded">
                                {cve}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400">{isZh ? '已完成安全強化與熱補丁修復' : 'Hardened, No Critical CVE'}</div>
                        )}
                      </div>
                    </div>

                    {/* Attached TTPs Details */}
                    <div className="p-3 bg-black/60 border border-red-900/40 rounded-xl space-y-2">
                      <div className="text-[10px] text-red-400 uppercase font-black flex items-center justify-between">
                        <span>{isZh ? '已附著攻擊戰術 (TTPs)' : 'Attached TTPs'}</span>
                        <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded">
                          {selectedNode.attachedTTPs.length} Active
                        </span>
                      </div>

                      {selectedNode.attachedTTPs.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedNode.attachedTTPs.map((ttp) => (
                            <div key={ttp.id} className="p-2 bg-red-950/30 border border-red-500/30 rounded-lg text-[10px] flex items-center justify-between">
                              <div>
                                <div className="font-bold text-red-300">{ttp.name}</div>
                                <div className="text-[8px] text-gray-400">{ttp.technique}</div>
                              </div>
                              <button
                                onClick={() => {
                                  setNodes((prev) =>
                                    prev.map((n) =>
                                      n.id === selectedNode.id
                                        ? { ...n, attachedTTPs: n.attachedTTPs.filter((t) => t.id !== ttp.id) }
                                        : n
                                    )
                                  );
                                  showToast(isZh ? '已移除該攻擊戰術！' : 'Removed TTP badge.');
                                }}
                                className="p-1 text-gray-500 hover:text-red-400"
                                title="移除戰術"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-500 italic">
                          {isZh ? '尚未附著攻擊手法。請由左側拖曳紅色戰術徽章至此節點。' : 'No TTP attached. Drag red badge here.'}
                        </div>
                      )}
                    </div>

                    {/* Quick Tactical Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          setNodes((prev) =>
                            prev.map((n) => (n.id === selectedNode.id ? { ...n, status: 'shielded', health: 100 } : n))
                          );
                          playTacticalSound(750, 'sine', 0.2);
                          showToast(isZh ? '已為該節點啟動零信任防禦能量盾！' : 'Shield applied to node.');
                        }}
                        className="py-2 px-3 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl text-[10px] font-black flex items-center justify-center gap-1"
                      >
                        <Shield size={12} /> {isZh ? '加固能量盾' : 'Shield Node'}
                      </button>
                      <button
                        onClick={() => {
                          setNodes((prev) =>
                            prev.map((n) => (n.id === selectedNode.id ? { ...n, status: 'compromised', health: 20 } : n))
                          );
                          playTacticalSound(250, 'sawtooth', 0.3);
                          showToast(isZh ? '已發動突襲！模擬節點受駭！' : 'Forced compromised state.');
                        }}
                        className="py-2 px-3 bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/50 rounded-xl text-[10px] font-black flex items-center justify-center gap-1"
                      >
                        <Flame size={12} /> {isZh ? '模擬受駭' : 'Simulate Breach'}
                      </button>
                    </div>

                    {/* SOAR Countermeasure Trigger */}
                    <button
                      onClick={() => {
                        setNodes((prev) =>
                          prev.map((n) => (n.id === selectedNode.id ? { ...n, status: 'isolated', health: 50 } : n))
                        );
                        showToast(isZh ? `已下發 SOAR 微隔離指令：完全阻斷 ${selectedNode.name} 之跨網段通訊！` : 'SOAR isolation executed.');
                      }}
                      className="w-full py-2 bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/50 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} /> {isZh ? '執行 SOAR 戰術微隔離' : 'Execute SOAR Isolation'}
                    </button>
                  </div>
                ) : selectedEdge ? (
                  /* EDGE INSPECTOR DETAILS */
                  <div className="space-y-4 font-mono text-xs">
                    <div className="p-3 bg-black/60 border border-gray-800 rounded-xl space-y-2">
                      <div className="text-[10px] text-gray-500 uppercase font-black">{isZh ? '連線鏈路屬性' : 'Edge Link Policy'}</div>
                      <div className="text-xs font-bold text-white">{selectedEdge.from} ➔ {selectedEdge.to}</div>
                      <div className="pt-2 border-t border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">{isZh ? '鏈路帶寬' : 'Bandwidth'}:</span>
                          <span className="text-cyan-400 font-bold">{selectedEdge.bandwidth}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">{isZh ? '防火牆過濾' : 'FW Policy'}:</span>
                          <span className="text-emerald-400 font-bold">{selectedEdge.firewallPolicy}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEdges((prev) =>
                          prev.map((e) =>
                            e.id === selectedEdge.id ? { ...e, isCompromisedPath: !e.isCompromisedPath } : e
                          )
                        );
                        showToast(isZh ? '已切換該鏈路之橫向攻擊滲透路徑狀態！' : 'Toggled compromised path.');
                      }}
                      className="w-full py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/50 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5"
                    >
                      <Zap size={12} /> {isZh ? '切換攻擊滲透管道' : 'Toggle Attack Path'}
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 font-mono text-xs space-y-2">
                    <MousePointer size={24} className="mx-auto text-gray-600 animate-bounce" />
                    <div>{isZh ? '請點擊畫布中任一節點或連線鏈路以檢視詳細屬性。' : 'Click any node or edge to inspect properties.'}</div>
                  </div>
                )}

              </div>

              {/* Inspector Footer */}
              <div className="pt-3 border-t border-gray-800 text-[10px] font-mono text-gray-500">
                {isZh ? '屬性變更將實時同步至後端裁決引擎' : 'Real-time sync with AAR referee engine'}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* VIEW 2: AIRBUS INFINITY STYLE AAR TIMELINE (交戰時序復盤時間軸)           */}
          {/* ========================================================================= */}
          <div className="bg-[#080a10] border-2 border-emerald-950/80 rounded-2xl p-5 shadow-2xl space-y-4">
            
            {/* TIMELINE CONTROL TOOLBAR (Top Bar) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-800 font-mono">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-400">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      {isZh ? 'Airbus Infinity 交戰時序復盤時間軸 (AAR Multi-Track Timeline)' : 'Airbus Infinity AAR Multi-Track Timeline'}
                    </h3>
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                      Scrubbable Playhead
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {isZh ? '拖曳指針或播放可即時同步上方拓撲圖戰場狀態與真實 SIEM 告警日誌湧入密度！' : 'Drag playhead to scrub battlefield snapshot & SIEM log surge rate.'}
                  </div>
                </div>
              </div>

              {/* Origin Tag Visual Filter & Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-black/90 p-1 rounded-lg border border-gray-800 text-[10px] gap-1">
                  <Filter size={12} className="text-gray-500 ml-1" />
                  {[
                    { id: 'all', label: isZh ? '全部告警' : 'All' },
                    { id: 'real_siem', label: isZh ? '真實 SIEM 告警' : 'Real SIEM' },
                    { id: 'wargame_sim', label: isZh ? '兵推虛擬攻擊' : 'Wargame Sim' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOriginFilter(f.id as any)}
                      className={cn(
                        'px-2 py-1 rounded font-bold transition-all',
                        originFilter === f.id
                          ? f.id === 'real_siem'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600'
                            : f.id === 'wargame_sim'
                            ? 'bg-red-950 text-red-300 border border-red-600'
                            : 'bg-emerald-950 text-[#00FF66] border border-emerald-600'
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPlayheadSec(0)}
                    title="Rewind to 00:00"
                    className="p-2 bg-black hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-800 text-xs"
                  >
                    <Rewind size={14} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all border shadow',
                      isPlaying
                        ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/50'
                        : 'bg-[#00FF66] hover:bg-[#00e65c] text-black border-emerald-400 font-black'
                    )}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPlaying ? 'PAUSE' : 'PLAY AAR'}</span>
                  </button>

                  {/* Speed Toggles */}
                  <div className="flex items-center bg-black border border-gray-800 rounded-lg p-0.5 text-[10px]">
                    {[1, 2, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaySpeed(s as any)}
                        className={cn(
                          'px-2 py-1 rounded font-bold transition-colors',
                          playSpeed === s ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-gray-400 hover:text-white'
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Current Playhead Time Display */}
                  <div className="px-3 py-1.5 bg-black border border-cyan-900/60 rounded-lg text-cyan-400 font-black text-xs">
                    ELAPSED: {Math.floor(playheadSec / 60).toString().padStart(2, '0')}:{(playheadSec % 60).toString().padStart(2, '0')} / 10:00
                  </div>
                </div>
              </div>
            </div>

            {/* MULTI-TRACK TIMELINE CANVAS */}
            <div className="bg-[#05070a] border border-gray-850 rounded-xl p-4 relative overflow-hidden font-mono select-none">
              
              {/* Ruler Ticks (00:00 to 10:00) */}
              <div className="relative h-6 border-b border-gray-800 flex items-center justify-between text-[8px] text-gray-500 px-2">
                {Array.from({ length: 11 }).map((_, i) => (
                  <span key={i} className="flex flex-col items-center">
                    <span>{i.toString().padStart(2, '0')}:00</span>
                    <span className="w-0.5 h-1 bg-gray-700 mt-0.5" />
                  </span>
                ))}
              </div>

              {/* Playhead Vertical Line (Scrubbing Indicator) */}
              <div
                style={{ left: `${(playheadSec / 600) * 100}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-[#00FF66] shadow-[0_0_15px_#00FF66] z-30 pointer-events-none transition-all duration-75"
              >
                <div className="w-3 h-3 bg-[#00FF66] rounded-full -ml-1.5 -top-1 absolute shadow-[0_0_10px_#00FF66]" />
              </div>

              {/* Slider Input for Interactive Scrubbing */}
              <input
                type="range"
                min="0"
                max="600"
                value={playheadSec}
                onChange={(e) => setPlayheadSec(Number(e.target.value))}
                className="w-full absolute top-2 left-0 right-0 opacity-0 z-40 cursor-ew-resize h-8"
              />

              {/* TRACK 1: RED TEAM ATTACK TRACK */}
              <div className="mt-3 relative h-10 bg-red-950/10 border border-red-900/30 rounded-lg flex items-center px-3">
                <div className="w-28 text-[9px] font-black text-red-400 uppercase tracking-tight flex items-center gap-1.5">
                  <Target size={12} className="text-red-500 animate-pulse" />
                  {isZh ? '🔴 紅軍攻擊軌' : 'Red Track'}
                </div>
                <div className="flex-1 relative h-full">
                  {filteredTimelineEvents.filter((e) => e.track === 'red').map((evt) => {
                    const leftPercent = (evt.timeSec / 600) * 100;
                    const isPassed = evt.timeSec <= playheadSec;
                    const isSelected = selectedEventId === evt.id;

                    return (
                      <button
                        key={evt.id}
                        onClick={() => { setSelectedEventId(evt.id); setPlayheadSec(evt.timeSec); }}
                        style={{ left: `${leftPercent}%` }}
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 p-1.5 rounded-full text-xs transition-all border',
                          isPassed
                            ? 'bg-red-600 text-white border-red-300 shadow-[0_0_15px_rgba(255,51,51,0.8)] scale-110'
                            : 'bg-red-950 text-red-400 border-red-800 opacity-60',
                          isSelected && 'ring-2 ring-white scale-125'
                        )}
                        title={`${evt.timeFormatted} - ${evt.title}`}
                      >
                        <span className="text-[10px]">{evt.icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TRACK 2: BLUE TEAM RESPONSE TRACK */}
              <div className="mt-2 relative h-10 bg-blue-950/10 border border-blue-900/30 rounded-lg flex items-center px-3">
                <div className="w-28 text-[9px] font-black text-blue-400 uppercase tracking-tight flex items-center gap-1.5">
                  <Shield size={12} className="text-blue-400" />
                  {isZh ? '🔵 藍軍回應軌' : 'Blue Track'}
                </div>
                <div className="flex-1 relative h-full">
                  {filteredTimelineEvents.filter((e) => e.track === 'blue').map((evt) => {
                    const leftPercent = (evt.timeSec / 600) * 100;
                    const isPassed = evt.timeSec <= playheadSec;
                    const isSelected = selectedEventId === evt.id;

                    return (
                      <button
                        key={evt.id}
                        onClick={() => { setSelectedEventId(evt.id); setPlayheadSec(evt.timeSec); }}
                        style={{ left: `${leftPercent}%` }}
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 p-1.5 rounded-full text-xs transition-all border',
                          isPassed
                            ? 'bg-cyan-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.8)] scale-110'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-800 opacity-60',
                          isSelected && 'ring-2 ring-white scale-125'
                        )}
                        title={`${evt.timeFormatted} - ${evt.title}`}
                      >
                        <span className="text-[10px]">{evt.icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TRACK 3: SIEM LOG RATE & ALERT DENSITY SPARKLINE */}
              <div className="mt-2 relative h-12 bg-amber-950/10 border border-amber-900/30 rounded-lg flex items-center px-3">
                <div className="w-28 text-[9px] font-black text-amber-400 uppercase tracking-tight flex items-center gap-1.5">
                  <Activity size={12} className="text-amber-400" />
                  {isZh ? '🟠 SIEM告警軌' : 'SIEM Alerts'}
                </div>
                
                {/* Visual Alert Density Sparkline Bars */}
                <div className="flex-1 h-8 flex items-end gap-1 px-2">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const timeWindow = (i / 40) * 600;
                    const isPassed = timeWindow <= playheadSec;
                    // Mock wave spike around minute 2 and minute 5
                    let height = 15;
                    if (i >= 7 && i <= 12) height = 85; // Spike 1 (12,000 EPS)
                    else if (i >= 20 && i <= 26) height = 95; // Spike 2 (C4ISR Wiper)
                    else if (i >= 30 && i <= 34) height = 40;

                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 rounded-t transition-all',
                          isPassed
                            ? height > 70
                              ? 'bg-red-500 shadow-[0_0_5px_#ef4444]'
                              : 'bg-amber-400'
                            : 'bg-gray-800'
                        )}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>

            </div>

            {/* EVENT DETAIL TOOLTIP DRAWER (Active Selected Snapshot) */}
            {activeTimelineEvent && (
              <div className="p-3.5 bg-black/80 border border-gray-800 rounded-xl font-mono text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl p-2 bg-gray-900 rounded-lg border border-gray-800">
                    {activeTimelineEvent.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                        {activeTimelineEvent.timeFormatted}
                      </span>
                      
                      {/* ORIGIN BADGE (REAL SIEM vs WARGAME SIM) */}
                      <span
                        className={cn(
                          'text-[9px] px-2 py-0.5 rounded border font-black uppercase',
                          activeTimelineEvent.origin === 'real_siem'
                            ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            : 'bg-red-950 text-red-300 border-red-600'
                        )}
                      >
                        {activeTimelineEvent.origin === 'real_siem' ? '⚡ 真實 SIEM 告警 (SOC Live)' : '🎯 兵推虛擬告警 (Sim)'}
                      </span>

                      <h4 className="text-xs font-bold text-white">{activeTimelineEvent.title}</h4>
                      
                      {activeTimelineEvent.mitreTTP && (
                        <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800">
                          {activeTimelineEvent.mitreTTP}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{activeTimelineEvent.description}</p>
                  </div>
                </div>

                <div className="bg-gray-950 p-2 rounded-lg border border-gray-850 text-[9px] text-emerald-400 max-w-md truncate">
                  <span className="text-gray-500">[RAW LOG]:</span> {activeTimelineEvent.rawLog}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MITRE ATT&CK MATRIX COVERAGE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'mitre_matrix' && (
        <div className="space-y-6">
          <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <BarChart3 className="text-[#00FF66]" size={18} />
                  {isZh ? 'MITRE ATT&CK 企業與工控矩陣演練覆蓋率 (Coverage Heatmap)' : 'MITRE ATT&CK Heatmap'}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {isZh ? '矩陣即時呈現目前想定所觸發之各階段攻擊技術代碼與藍軍防禦緩解策略 (Mitigations)。' : 'Real-time coverage of triggered MITRE techniques and defense mitigations.'}
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500" /> 已突破 (Compromised)</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-500" /> 已緩解 (Mitigated)</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-cyan-400" /> 已阻斷 (Blocked)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono">
              {MITRE_TACTIC_COLUMNS.map((col, idx) => (
                <div key={idx} className="bg-black/60 border border-gray-800 rounded-xl p-3 space-y-2.5">
                  <div className="text-xs font-black text-cyan-400 pb-2 border-b border-gray-850 truncate">
                    {col.tactic}
                  </div>
                  <div className="space-y-2">
                    {col.techniques.map((tech) => (
                      <div
                        key={tech.id}
                        className={cn(
                          'p-2.5 rounded-lg border text-[11px] transition-all',
                          tech.hit
                            ? tech.status === 'Compromised'
                              ? 'bg-red-950/50 border-red-500 text-red-200'
                              : tech.status === 'Mitigated'
                              ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                              : 'bg-cyan-950/50 border-cyan-500 text-cyan-200'
                            : 'bg-gray-900/30 border-gray-800 text-gray-500'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{tech.id}</span>
                          <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-black/50">{tech.status}</span>
                        </div>
                        <div className="text-[10px] mt-1 line-clamp-2">{tech.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: BLUE TEAM CYBER COP & DEFCON RULES                                */}
      {/* ========================================================================= */}
      {activeTab === 'cop' && (
        <div className="space-y-6">
          <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
              <Shield className="text-[#00FF66]" size={18} />
              {isZh ? '藍軍共同作戰圖像 (Common Operating Picture) 與 ROE 交戰規則' : 'Blue COP & Rules of Engagement'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'DEFCON 1 (最高戰備)', desc: '遭受毀滅性攻擊，全域切換硬體實體隔離與純白名單。', color: 'border-red-500/60 bg-red-950/20 text-red-400' },
                { title: 'DEFCON 2 (全面防禦)', desc: '已偵測到橫向跨網段推進，啟用微隔離與自動 SOAR 劇本阻斷。', color: 'border-amber-500/60 bg-amber-950/20 text-amber-400' },
                { title: 'DEFCON 3 (標準戰備)', desc: '常態性日誌監控與主動蜜罐誘捕。', color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400' }
              ].map((def, idx) => (
                <div key={idx} className={cn('p-4 rounded-xl border', def.color)}>
                  <div className="text-xs font-black font-mono">{def.title}</div>
                  <p className="text-[11px] text-gray-400 font-mono mt-1.5">{def.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: NATION-STATE APT SCENARIOS CATALOG & DEV EXPORT SCHEMA            */}
      {/* ========================================================================= */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          <div className="bg-[#080a10] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileText className="text-[#00FF66]" size={18} />
                  {isZh ? '預設國家級 APT 攻防想定庫 (Nation-State Scenarios)' : 'Nation-State Threat Scenarios'}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {isZh ? '可一鍵載入預設想定之網路拓撲、MITRE 攻擊戰術與 Airbus AAR 復盤時序。' : 'One-click load pre-configured topology, MITRE TTPs and AAR timeline events.'}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({ nodes, edges, TIMELINE_EVENTS }, null, 2));
                  showToast(isZh ? '已複製前端與後端 JSON 資料結構至剪貼簿！' : 'Copied JSON schema to clipboard!');
                }}
                className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-[#00FF66] rounded-xl font-mono text-xs font-bold flex items-center gap-2 shadow"
              >
                <Copy size={14} />
                {isZh ? '導出串聯資料結構 (JSON Schema)' : 'Export JSON Schema'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-black/60 border border-red-900/40 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    海峽風暴：C4ISR 指揮管制鏈路突襲與癱瘓想定
                  </span>
                  <span className="text-[9px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800">APT-66</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  模擬某國網軍針對國防通信中樞發動的多階段混合式 APT 攻擊，包含特權提升、橫向跨網段移動與資料破壞性抹除 (Wiper Attack)。
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-[10px]">
                  <span className="text-gray-500">節點數: 6 | 總時長: 10:00</span>
                  <button
                    onClick={() => {
                      setNodes(INITIAL_NODES);
                      setEdges(INITIAL_EDGES);
                      setPlayheadSec(140);
                      setActiveTab('workbench');
                      showToast(isZh ? '已載入「海峽風暴」想定至拓撲畫布與時間軸！' : 'Loaded Strait Storm scenario.');
                    }}
                    className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded border border-red-800"
                  >
                    {isZh ? '載入想定進行演練 ➔' : 'Load Scenario ➔'}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-black/60 border border-cyan-900/40 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    暗夜伏擊：飛彈預警雷達鏈路偽冒與誘騙竊密
                  </span>
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">APT-29</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  高隱蔽無檔案記憶體攻擊，利用 Living-off-the-Land (LOLBins) 進行長週期偵察與慢速外洩，重點考驗戰術蜜罐誘捕能力。
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-[10px]">
                  <span className="text-gray-500">節點數: 6 | 總時長: 10:00</span>
                  <button
                    onClick={() => {
                      setNodes(INITIAL_NODES);
                      setEdges(INITIAL_EDGES);
                      setPlayheadSec(420);
                      setActiveTab('aar_infinity');
                      showToast(isZh ? '已載入「暗夜伏擊」蜜罐誘捕階段復盤！' : 'Loaded Night Ambush scenario.');
                    }}
                    className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800"
                  >
                    {isZh ? '載入復盤時序 ➔' : 'Load AAR Replay ➔'}
                  </button>
                </div>
              </div>
            </div>

            {/* DEVELOPER INTEGRATION CODE BLOCK & SCHEMA SPECIFICATION */}
            <div className="p-4 bg-black/90 border border-gray-800 rounded-xl font-mono space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <FileCode size={14} />
                  <span>{isZh ? '📥 前後端聯動架構與 Event Array 資料規格 (工程交付規格)' : 'Developer Integration Schema & Event Array'}</span>
                </div>
                <span className="text-[10px] text-gray-500">React + Tailwind + Event State Sync</span>
              </div>
              <div className="bg-[#05070a] p-3 rounded-lg border border-gray-850 text-[10px] text-gray-300 overflow-x-auto max-h-48 custom-scrollbar">
                <pre>{`// 1. 後端傳入之交戰時序 Event Array 資料規格
interface TimelineEvent {
  id: string;
  timeSec: number;        // 秒數 (0 ~ 600)
  timeFormatted: string;  // 例如 "01:30"
  track: 'red' | 'blue' | 'siem';
  origin: 'real_siem' | 'wargame_sim'; // 區隔真實 SIEM 與虛擬兵推告警
  icon: string;           // 🎯, ⚡, ☠️, 🛡️, ⚙️
  title: string;
  description: string;
  targetNodeId: string;   // 拓撲關聯節點 ID (如 'node_c4isr')
  nodeStateAfter: 'healthy' | 'targeted' | 'compromised' | 'shielded';
  healthDelta?: number;
  mitreTTP?: string;
  rawLog: string;
  logRateEps: number;
}

// 2. 前端時間軸指針拖曳與畫布拓撲變色聯動核心邏輯
useEffect(() => {
  const pastEvents = TIMELINE_EVENTS.filter((e) => e.timeSec <= playheadSec);
  setNodes((prevNodes) =>
    prevNodes.map((node) => {
      const related = pastEvents.filter((e) => e.targetNodeId === node.id);
      if (!related.length) return { ...node, status: 'healthy', health: 100 };
      const lastEvt = related[related.length - 1];
      return { ...node, status: lastEvt.nodeStateAfter };
    })
  );
}, [playheadSec]);`}</pre>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AAR SUMMARY REPORT MODAL                                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0c101c] border-2 border-emerald-500/60 rounded-2xl w-full max-w-2xl p-6 font-mono text-xs space-y-4 shadow-[0_0_50px_rgba(0,255,102,0.2)] text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Award className="text-[#00FF66]" size={18} />
                  <span>{isZh ? '兵棋推演裁決與行動後復盤報告 (AAR Summary Report)' : 'Cyber Wargame AAR Summary'}</span>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="space-y-3 text-gray-300">
                <div className="p-3 bg-black/60 border border-gray-800 rounded-xl grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">總演練時間</div>
                    <div className="text-sm font-bold text-cyan-400">10 分 00 秒</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">平均防禦處置 (MTTR)</div>
                    <div className="text-sm font-bold text-emerald-400">42 秒 (優異)</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">戰損評級 / 裁決結果</div>
                    <div className="text-sm font-bold text-white bg-emerald-950 px-2 py-0.5 rounded">DEFENSE WIN (勝)</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="font-bold text-white">關鍵戰鬥評述 (Executive Summary):</div>
                  <p className="text-gray-400 leading-relaxed">
                    在 01:30 紅軍透過邊界防火牆零日漏洞突破並橫向移動至雷達網閘。藍軍防禦指揮中心於 04:20 及時啟動 DEFCON 2 零信任能量盾，並透過戰術蜜罐捕獲攻擊載荷，成功於 08:20 恢復 C4ISR 主備切換。
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl"
                >
                  關閉
                </button>
                <button
                  onClick={() => {
                    showToast(isZh ? '已成功下載 AAR 鑑識分析報告 (PDF)！' : 'Downloaded AAR Report.');
                    setShowReportModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Download size={14} />
                  匯出 AAR 報告 (PDF)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

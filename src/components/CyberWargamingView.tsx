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
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- Tactical Types ---
type FactionTab = 'red' | 'blue' | 'white';

interface NetworkNode {
  id: string;
  name: string;
  code: string;
  zone: 'external' | 'dmz' | 'tactical' | 'c4isr' | 'honeypot';
  ip: string;
  status: 'healthy' | 'targeted' | 'compromised' | 'isolated' | 'defended';
  health: number; // 0 - 100
  mitreTTP?: string;
  tacticsApplied?: string[];
  x: number; // visual layout percentage
  y: number;
}

interface AttackScenario {
  id: string;
  title: string;
  codeName: string;
  threatActor: string;
  objective: string;
  initialVector: string;
  difficulty: 'Standard' | 'Advanced' | 'Nation-State APT';
  stealthLevel: 'Stealthy' | 'Balanced' | 'Aggressive';
  targetSystem: string;
  description: string;
  steps: {
    stage: string;
    tactic: string;
    technique: string;
    targetNodeId: string;
    action: string;
  }[];
}

const PRESET_SCENARIOS: AttackScenario[] = [
  {
    id: 'SCN-MIL-01',
    title: '海峽風暴：C4ISR 指揮管制鏈路突襲與癱瘓想定',
    codeName: 'OPERATION TYPHOON BREACH',
    threatActor: 'APT-66 (State-Sponsored Cyber Unit)',
    objective: '滲透軍事戰術網路，破壞 C4ISR 指揮中樞與防空雷達資料庫，阻斷各戰區通信。',
    initialVector: '邊界 VPN 設備零日漏洞 (CVE-2024-21887) 初始突破',
    difficulty: 'Nation-State APT',
    stealthLevel: 'Balanced',
    targetSystem: 'C4ISR 指揮核心 (NODE-C4ISR-01)',
    description: '模擬某國網軍針對國防通信中樞發動的多階段混合式 APT 攻擊，包含特權提升、橫向跨網段移動與資料破壞性抹除。',
    steps: [
      { stage: 'Stage 1: 初始突破', tactic: 'Initial Access', technique: 'T1190 Exploit Public-Facing App', targetNodeId: 'node-dmz-vpn', action: '利用 VPN 韌體漏洞注入 WebShell 取得 DMZ 立足點' },
      { stage: 'Stage 2: 內網橫向推進', tactic: 'Lateral Movement', technique: 'T1021.002 SMB/Windows Admin Shares', targetNodeId: 'node-tactical-relay', action: '利用 Mimikatz 傾印憑證橫向移動至戰術通信節點' },
      { stage: 'Stage 3: 提權與持久化', tactic: 'Privilege Escalation', technique: 'T1548 Abuse Elevation Control', targetNodeId: 'node-tactical-relay', action: '利用 Windows 服務偽冒取得 SYSTEM 最高控制權' },
      { stage: 'Stage 4: 戰略核心突襲', tactic: 'Impact', technique: 'T1489 Service Stop / Data Wipe', targetNodeId: 'node-c4isr-core', action: '向 C4ISR 指揮伺服器下發抹除指令，中斷防空戰術資訊流' }
    ]
  },
  {
    id: 'SCN-MIL-02',
    title: '暗夜伏擊：飛彈預警雷達鏈路偽冒與誘騙竊密',
    codeName: 'PROJECT SILENT RADAR',
    threatActor: 'APT-29 (Cozy Bear Variant)',
    objective: '潛伏於演習通信網段，竊取超高頻 (EHF) 衛星加密通信密鑰與雷達軌跡資料。',
    initialVector: '偽造國防部演習公文之魚叉釣魚郵件 (T1566.001)',
    difficulty: 'Advanced',
    stealthLevel: 'Stealthy',
    targetSystem: '密碼中心與戰術雷達庫 (NODE-CRYPTO-01)',
    description: '高隱蔽無檔案記憶體攻擊，利用 Living-off-the-Land (LOLBins) 進行長週期偵察與慢速外洩。',
    steps: [
      { stage: 'Stage 1: 釣魚進入', tactic: 'Initial Access', technique: 'T1566 Spearphishing Attachment', targetNodeId: 'node-office-net', action: '誘騙指揮官開啟惡意 Word 巨集檔案釋放無檔案 Beacon' },
      { stage: 'Stage 2: 記憶體注入', tactic: 'Defense Evasion', technique: 'T1055 Process Injection', targetNodeId: 'node-office-net', action: '注入合法 svchost.exe 行程規避 EDR 偵測' },
      { stage: 'Stage 3: 慢速外洩', tactic: 'Exfiltration', technique: 'T1048 Exfiltration Over C2', targetNodeId: 'node-crypto-db', action: '將加密密鑰經 DNS 隱蔽通道慢速分批外傳' }
    ]
  },
  {
    id: 'SCN-MIL-03',
    title: '蜂群作戰：戰時戰區指揮網路 DDoS 洪水與日誌淹沒干擾',
    codeName: 'TACTICAL LOG FLOOD & SWARM',
    threatActor: 'RedForce Botnet Fleet',
    objective: '發動百萬級垃圾日誌與 UDP 洪水，造成 SIEM 系統延遲並掩蓋真實 APT 提權動作。',
    initialVector: '戰術無人機基地台與物聯網節點受控發起反射攻擊',
    difficulty: 'Standard',
    stealthLevel: 'Aggressive',
    targetSystem: '作戰邊界閘道 (NODE-BORDER-GW)',
    description: '攻防演練中典型之聲東擊西戰術，透過海量告警淹沒 SOC 監控中心，企圖降低藍軍應變效率。',
    steps: [
      { stage: 'Stage 1: 日誌淹沒', tactic: 'Deception / Jamming', technique: 'T1499 Endpoint Denial of Service', targetNodeId: 'node-border-gw', action: '持續發射每秒 50,000 筆偽冒 Syslog 塞滿分析隊列' },
      { stage: 'Stage 2: 掩護滲透', tactic: 'Defense Evasion', technique: 'T1070 Indicator Removal', targetNodeId: 'node-dmz-vpn', action: '在告警風暴掩護下悄悄執行敏感資料庫連線' }
    ]
  }
];

export default function CyberWargamingView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Active Faction View Tab
  const [factionTab, setFactionTab] = useState<FactionTab>('red');

  // Red Team State
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario>(PRESET_SCENARIOS[0]);
  const [attackIntensity, setAttackIntensity] = useState<'Stealthy' | 'Balanced' | 'Aggressive'>('Balanced');
  const [enableLogFlooding, setEnableLogFlooding] = useState(false);
  const [enableDecoyAlerts, setEnableDecoyAlerts] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0); // 0 to 100
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [selectedMitreTTP, setSelectedMitreTTP] = useState<string>('T1190 Exploit Public App');
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Blue Team / COP State
  const [defconLevel, setDefconLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-c4isr-core');
  const [isExecutingROE, setIsExecutingROE] = useState<string | null>(null);
  const [roeCountdown, setRoeCountdown] = useState<number | null>(null);
  const [blueScore, setBlueScore] = useState(82);
  const [redScore, setRedScore] = useState(68);
  const [trappedPayloads, setTrappedPayloads] = useState([
    { time: '14:22:05', trap: 'HONEY-C4ISR-DECOY', attackerIP: '198.51.100.44', payload: 'c4isr_exploit_v3.elf (Captured)', points: '+150' },
    { time: '14:18:30', trap: 'HONEY-TELNET-ICS', attackerIP: '203.0.113.88', payload: 'brute_force_dict.txt (Blocked)', points: '+80' }
  ]);

  // White Cell / AAR State
  const [playbackTime, setPlaybackTime] = useState(240); // in seconds (0 to 600)
  const [isPlayingAAR, setIsPlayingAAR] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Network Topology Nodes State
  const [nodes, setNodes] = useState<NetworkNode[]>([
    { id: 'node-border-gw', name: '邊界防火牆閘道', code: 'GW-BORDER-01', zone: 'external', ip: '192.168.1.1', status: 'healthy', health: 95, x: 15, y: 30, tacticsApplied: [] },
    { id: 'node-dmz-vpn', name: 'DMZ 戰術 VPN 閘道', code: 'VPN-CONCENTRATOR', zone: 'dmz', ip: '172.16.10.5', status: 'compromised', health: 42, mitreTTP: 'T1190 Exploit Public App', x: 35, y: 25, tacticsApplied: ['T1190'] },
    { id: 'node-office-net', name: '指揮所行政終端', code: 'WS-COMMAND-HQ', zone: 'tactical', ip: '10.100.4.18', status: 'targeted', health: 70, mitreTTP: 'T1566 Spearphishing', x: 40, y: 70, tacticsApplied: ['T1566'] },
    { id: 'node-tactical-relay', name: '戰術中繼通信節點', code: 'RELAY-TAC-UHF', zone: 'tactical', ip: '10.100.20.1', status: 'targeted', health: 60, mitreTTP: 'T1021 Lateral Movement', x: 60, y: 40, tacticsApplied: ['T1021'] },
    { id: 'node-c4isr-core', name: 'C4ISR 指揮核心伺服器', code: 'C4ISR-MAIN-CORE', zone: 'c4isr', ip: '10.200.1.10', status: 'targeted', health: 55, mitreTTP: 'T1489 Service Disruption', x: 85, y: 35, tacticsApplied: [] },
    { id: 'node-crypto-db', name: '國防戰術密碼資料庫', code: 'DB-CRYPTO-VAULT', zone: 'c4isr', ip: '10.200.1.50', status: 'healthy', health: 92, x: 85, y: 75, tacticsApplied: [] },
    { id: 'node-honeypot', name: '主動防禦誘敵蜜罐 (Trap)', code: 'HONEY-C4ISR-DECOY', zone: 'honeypot', ip: '172.16.99.88', status: 'defended', health: 100, x: 55, y: 80, tacticsApplied: ['T-Pot Active'] }
  ]);

  // Simulation Timer Hook
  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimulationProgress((prev) => {
          if (prev >= 100) {
            setIsSimulating(false);
            setSimulationLogs((l) => [
              `[${new Date().toLocaleTimeString()}] [DIRECTOR-VERDICT] 兵棋推演模擬執行完畢！裁決引擎已產生 AAR 戰術評估。`,
              ...l
            ]);
            return 100;
          }
          const next = prev + 5;
          const currentStage = Math.floor((next / 100) * selectedScenario.steps.length);
          setActiveStageIndex(Math.min(currentStage, selectedScenario.steps.length - 1));

          // Generate Tactical Logs
          const step = selectedScenario.steps[Math.min(currentStage, selectedScenario.steps.length - 1)];
          setSimulationLogs((l) => [
            `[${new Date().toLocaleTimeString()}] [RED-EXEC] ${step.stage} -> 正在目標 ${step.targetNodeId} 執行 ${step.technique} (${step.action})`,
            ...l.slice(0, 20)
          ]);

          // Dynamically change node health
          setNodes((prevNodes) =>
            prevNodes.map((n) => {
              if (n.id === step.targetNodeId) {
                return {
                  ...n,
                  status: next > 75 ? 'compromised' : 'targeted',
                  health: Math.max(15, n.health - 6)
                };
              }
              return n;
            })
          );

          return next;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isSimulating, selectedScenario]);

  // AAR Playback Timer Hook
  useEffect(() => {
    let playTimer: any;
    if (isPlayingAAR) {
      playTimer = setInterval(() => {
        setPlaybackTime((t) => {
          if (t >= 600) {
            setIsPlayingAAR(false);
            return 600;
          }
          return t + 10;
        });
      }, 500);
    }
    return () => clearInterval(playTimer);
  }, [isPlayingAAR]);

  // Handle Launch Simulation
  const handleLaunchSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationLogs([
      `[${new Date().toLocaleTimeString()}] [WARGAME-INIT] 啟動戰術想定：${selectedScenario.title}`,
      `[${new Date().toLocaleTimeString()}] [OP-PARAMS] 攻擊強度：${attackIntensity} | 日誌干擾：${enableLogFlooding ? '已開啟' : '未開啟'} | 偽冒告警：${enableDecoyAlerts ? '已啟動' : '停用'}`
    ]);
  };

  // Handle Blue Team SOAR Playbook Execution
  const handleExecuteROE = (actionName: string, targetId: string) => {
    setIsExecutingROE(actionName);
    setRoeCountdown(4);

    const countInterval = setInterval(() => {
      setRoeCountdown((c) => {
        if (c && c <= 1) {
          clearInterval(countInterval);
          setIsExecutingROE(null);
          setRoeCountdown(null);

          // Update Node state to defended/isolated
          setNodes((prev) =>
            prev.map((n) => {
              if (n.id === targetId) {
                return {
                  ...n,
                  status: actionName.includes('隔離') ? 'isolated' : 'defended',
                  health: Math.min(100, n.health + 35)
                };
              }
              return n;
            })
          );

          setBlueScore((prev) => Math.min(100, prev + 8));
          setTrappedPayloads((prev) => [
            {
              time: new Date().toLocaleTimeString(),
              trap: `ROE-${targetId.toUpperCase()}`,
              attackerIP: '198.51.100.44',
              payload: `ROE Countermeasure: ${actionName} Succeeded`,
              points: '+120'
            },
            ...prev
          ]);

          return null;
        }
        return c ? c - 1 : null;
      });
    }, 1000);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner: Cyber Warfare Military Command Bar */}
      <div className="bg-[#0b0c10] border-2 border-emerald-950/60 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.05)]">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-red-600/10 via-emerald-600/5 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-900/40 via-gray-900 to-emerald-900/40 rounded-2xl flex items-center justify-center border border-emerald-500/40 shadow-inner text-emerald-400">
              <Swords size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>{isZh ? 'SEMOR CYBER 網絡兵棋推演平台' : 'SEMOR Cyber Wargaming System'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    MIL-SPEC STD-810H
                  </span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {isZh ? '戰術推演進行中' : 'EXERCISE LIVE'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl">
                {isZh
                  ? '將被動日誌分析升級為主動攻防對抗模擬：支援紅軍戰術想定路徑配置、藍軍戰區態勢感知 (COP) 與 DEFCON 交戰規則、導演部裁決引擎與戰後復盤 (AAR)。'
                  : 'Upgrade static SIEM into an active cyber warfare simulator: Automated attack paths, Blue Team Cyber COP with DEFCON ROE, and White Cell AAR Referee.'}
              </p>
            </div>
          </div>

          {/* Tactical Status Badges */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-4 py-2 bg-black/60 border border-red-900/50 rounded-xl text-left">
              <div className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {isZh ? '紅軍戰術得分' : 'Red Attack Score'}
              </div>
              <div className="text-xl font-black text-white">{redScore} / 100</div>
            </div>

            <div className="px-4 py-2 bg-black/60 border border-blue-900/50 rounded-xl text-left">
              <div className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {isZh ? '藍軍防禦得分' : 'Blue Defense Score'}
              </div>
              <div className="text-xl font-black text-emerald-400">{blueScore} / 100</div>
            </div>

            <div className="px-4 py-2 bg-black/60 border border-emerald-900/50 rounded-xl text-left">
              <div className="text-[10px] text-gray-400 uppercase font-bold">{isZh ? '戰備狀況' : 'Readiness'}</div>
              <div className="text-xl font-black text-amber-400">DEFCON {defconLevel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Faction Navigation Tabs */}
      <div className="flex bg-[#0c0d12] p-1.5 rounded-2xl border border-gray-800/80 gap-2">
        <button
          onClick={() => setFactionTab('red')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border',
            factionTab === 'red'
              ? 'bg-gradient-to-r from-red-950/80 to-red-900/40 text-red-300 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/40'
          )}
        >
          <Crosshair size={16} className={factionTab === 'red' ? 'text-red-400 animate-spin' : ''} />
          <span>🔴 {isZh ? '攻擊端想定與路徑配置 (Red Team)' : 'Red Team: Scenario & Attack Paths'}</span>
        </button>

        <button
          onClick={() => setFactionTab('blue')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border',
            factionTab === 'blue'
              ? 'bg-gradient-to-r from-blue-950/80 to-blue-900/40 text-blue-300 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/40'
          )}
        >
          <Shield size={16} className={factionTab === 'blue' ? 'text-blue-400' : ''} />
          <span>🔵 {isZh ? '防禦端戰區態勢感知 (Blue Team COP)' : 'Blue Team: Cyber COP & ROE'}</span>
        </button>

        <button
          onClick={() => setFactionTab('white')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border',
            factionTab === 'white'
              ? 'bg-gradient-to-r from-amber-950/80 to-amber-900/40 text-amber-300 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/40'
          )}
        >
          <Award size={16} className={factionTab === 'white' ? 'text-amber-400' : ''} />
          <span>🟡 {isZh ? '導演部裁決與戰後復盤 (White Cell AAR)' : 'White Cell: Referee & AAR'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🔴 TAB 1: RED TEAM - SCENARIO & ATTACK PATH CONFIGURATION (PROMPT 1) */}
      {/* ========================================================================= */}
      {factionTab === 'red' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): Scenario Selector & Tactic Config */}
          <div className="lg:col-span-4 space-y-6">
            {/* Scenario Card */}
            <div className="bg-[#0f1015] border border-red-950/70 p-5 rounded-2xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                  <Target size={16} />
                  <span>{isZh ? '戰術想定劇本選擇' : 'Scenario Selection'}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">3 Presets</span>
              </div>

              <div className="space-y-2.5">
                {PRESET_SCENARIOS.map((scn) => (
                  <div
                    key={scn.id}
                    onClick={() => {
                      setSelectedScenario(scn);
                      setSimulationProgress(0);
                    }}
                    className={cn(
                      'p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 text-left',
                      selectedScenario.id === scn.id
                        ? 'bg-red-950/30 border-red-500/50 shadow-lg shadow-red-950/50'
                        : 'bg-black/40 border-gray-800/80 hover:border-gray-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-400">{scn.codeName}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded font-mono">
                        {scn.difficulty}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white leading-tight">{scn.title}</div>
                    <div className="text-[10px] text-gray-400 line-clamp-2">{scn.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attack Parameters Tuner */}
            <div className="bg-[#0f1015] border border-gray-800 p-5 rounded-2xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                  <SlidersHorizontal size={16} className="text-red-400" />
                  <span>{isZh ? '作戰參數與干擾調校' : 'Simulation Tuning'}</span>
                </div>
              </div>

              {/* Intensity Switch */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">{isZh ? '攻擊強度 (Attack Intensity)' : 'Attack Intensity'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Stealthy', 'Balanced', 'Aggressive'] as const).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => setAttackIntensity(intensity)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-[10px] font-bold uppercase transition-all border',
                        attackIntensity === intensity
                          ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/30'
                          : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                      )}
                    >
                      {intensity === 'Stealthy' ? (isZh ? '隱蔽慢速' : 'Stealthy') : intensity === 'Balanced' ? (isZh ? '常規推進' : 'Balanced') : (isZh ? '激進全速' : 'Aggressive')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tactical Deception & Jamming Switches */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-800/80 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-white">{isZh ? '日誌淹沒干擾 (Log Flooding)' : 'Tactical Log Flooding'}</div>
                    <div className="text-[10px] text-gray-400">{isZh ? '發送每秒 50,000 筆垃圾日誌癱瘓 SIEM' : 'Flood SIEM queue with junk logs'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableLogFlooding}
                    onChange={(e) => setEnableLogFlooding(e.target.checked)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-800/80 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-white">{isZh ? '偽冒告警干擾 (Decoy False Alerts)' : 'Decoy Alert Swarm'}</div>
                    <div className="text-[10px] text-gray-400">{isZh ? '誘騙藍軍分析師分散防禦能量' : 'Disperse SOC analyst attention'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDecoyAlerts}
                    onChange={(e) => setEnableDecoyAlerts(e.target.checked)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleLaunchSimulation}
                  disabled={isSimulating}
                  className={cn(
                    'w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl',
                    isSimulating
                      ? 'bg-red-900/50 text-red-300 border border-red-500/40 cursor-not-allowed animate-pulse'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-[0.98]'
                  )}
                >
                  <Play size={16} />
                  {isSimulating
                    ? `${isZh ? '紅軍作戰路徑推進中...' : 'Attack Executing...'} (${simulationProgress}%)`
                    : (isZh ? '啟動紅軍模擬攻擊 (Launch)' : 'Launch Red Simulation')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Interactive Topology & Attack Pipeline */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visual Topology Canvas */}
            <div className="bg-[#0c0d12] border-2 border-red-950/60 rounded-2xl p-6 relative overflow-hidden shadow-2xl min-h-[460px] flex flex-col justify-between">
              {/* Radar Grid Background Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
              
              {/* Topology Header */}
              <div className="flex items-center justify-between relative z-10 pb-4 border-b border-gray-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                    <Radar size={18} className="animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {isZh ? '軍事作戰網路拓撲與 MITRE 攻擊路徑' : 'Military Cyber Target Topology & Attack Paths'}
                    </h3>
                    <p className="text-[10px] font-mono text-gray-400">
                      {isZh ? '點擊節點可配置 ATT&CK 技戰術或檢視滲透深度' : 'Click nodes to inspect or assign ATT&CK tactics'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />正常 (90%+)</span>
                  <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" />鎖定 (50-89%)</span>
                  <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />淪陷 (&lt;50%)</span>
                </div>
              </div>

              {/* Topology Graph Display Canvas */}
              <div className="relative flex-1 my-6 min-h-[280px] w-full">
                {/* Visual SVG Connecting lines with dynamic glow during simulation */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <line x1="15%" y1="30%" x2="35%" y2="25%" stroke="#ef4444" strokeWidth="2" strokeDasharray={isSimulating ? "4 2" : "none"} className={isSimulating ? "animate-pulse" : ""} />
                  <line x1="35%" y1="25%" x2="60%" y2="40%" stroke="#ef4444" strokeWidth="2" strokeDasharray={isSimulating ? "4 2" : "none"} />
                  <line x1="60%" y1="40%" x2="85%" y2="35%" stroke="#ef4444" strokeWidth="3" strokeDasharray={isSimulating ? "6 3" : "none"} />
                  <line x1="35%" y1="25%" x2="40%" y2="70%" stroke="#374151" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="60%" y1="40%" x2="85%" y2="75%" stroke="#374151" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="35%" y1="25%" x2="55%" y2="80%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                </svg>

                {/* Nodes on Canvas */}
                {nodes.map((node) => {
                  const isCompromised = node.status === 'compromised';
                  const isTargeted = node.status === 'targeted';
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <motion.div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform hover:scale-110 p-2.5 rounded-2xl border flex flex-col items-center gap-1 shadow-2xl backdrop-blur-md',
                        isSelected ? 'ring-2 ring-blue-500 scale-105' : '',
                        isCompromised
                          ? 'bg-red-950/80 border-red-500 text-red-200 shadow-red-600/30'
                          : isTargeted
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-amber-600/30'
                          : node.zone === 'honeypot'
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : 'bg-[#11121a] border-gray-700 text-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {node.zone === 'c4isr' ? (
                          <Cpu size={14} className="text-red-400" />
                        ) : node.zone === 'honeypot' ? (
                          <ShieldCheck size={14} className="text-emerald-400" />
                        ) : (
                          <Server size={14} />
                        )}
                        <span className="text-[11px] font-black font-mono">{node.code}</span>
                      </div>
                      <div className="text-[9px] text-gray-400">{node.name}</div>

                      {/* Health bar */}
                      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                        <div
                          className={cn(
                            'h-full transition-all duration-500',
                            node.health > 70 ? 'bg-emerald-500' : node.health > 40 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${node.health}%` }}
                        />
                      </div>

                      {node.mitreTTP && (
                        <span className="text-[8px] font-mono px-1 py-0.2 bg-red-900/60 text-red-300 rounded border border-red-500/40 mt-0.5">
                          {node.mitreTTP.split(' ')[0]}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom Attack Path Stages Progress */}
              <div className="relative z-10 pt-4 border-t border-gray-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-red-400 uppercase font-mono flex items-center gap-2">
                    <Activity size={14} />
                    {isZh ? '當前想定攻擊鏈階段 (Attack Chain Pipeline)' : 'Active Kill-Chain Stages'}
                  </span>
                  <span className="text-gray-400 font-mono">
                    Stage {activeStageIndex + 1} / {selectedScenario.steps.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {selectedScenario.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-2.5 rounded-xl border text-left space-y-1 transition-all',
                        idx === activeStageIndex && isSimulating
                          ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/30 animate-pulse'
                          : idx < activeStageIndex || simulationProgress === 100
                          ? 'bg-red-950/20 border-red-900/60 text-gray-300'
                          : 'bg-black/40 border-gray-800 text-gray-500'
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span>{step.stage.split(':')[0]}</span>
                        <span className="text-red-400">{step.tactic}</span>
                      </div>
                      <div className="text-[11px] font-bold truncate text-white">{step.technique}</div>
                      <div className="text-[9px] text-gray-400 line-clamp-1">{step.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-time Red Attack Terminal Logs */}
            <div className="bg-[#090a0f] border border-gray-800 rounded-2xl p-4 font-mono text-xs shadow-2xl space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/80 text-[11px] text-gray-400">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <Terminal size={14} />
                  <span>CALDERA / Atomic Red Team Attack Execution Console</span>
                </div>
                <span>Session: RED-OP-7701</span>
              </div>

              <div className="h-36 overflow-y-auto custom-scrollbar space-y-1 text-[11px]">
                {simulationLogs.length === 0 ? (
                  <div className="text-gray-600 py-4 text-center">
                    {isZh ? '點擊「啟動紅軍模擬攻擊」後，即時戰術執行日誌將在此串流輸出...' : 'Waiting for simulation launch...'}
                  </div>
                ) : (
                  simulationLogs.map((log, i) => (
                    <div
                      key={i}
                      className={cn(
                        'leading-relaxed',
                        log.includes('RED-EXEC') ? 'text-red-400' : log.includes('DIRECTOR') ? 'text-amber-400 font-bold' : 'text-gray-300'
                      )}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔵 TAB 2: BLUE TEAM - CYBER COP & DEFCON ROE (PROMPT 2) */}
      {/* ========================================================================= */}
      {factionTab === 'blue' && (
        <div className="space-y-6">
          {/* DEFCON Tactical Readiness Selector Bar */}
          <div className="bg-[#0e0f14] border border-blue-900/50 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/40">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>{isZh ? '國防資安戰備等級 (Cyber DEFCON)' : 'Tactical Cyber DEFCON Status'}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    ROE ACTIVE
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  {isZh ? '切換不同戰備層級以即時觸發自動化防禦交戰規則與蜜罐誘捕機制。' : 'Select defense readiness to dynamically invoke SOAR playbooks and active honeytraps.'}
                </p>
              </div>
            </div>

            {/* DEFCON 5 to 1 Selector */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-gray-800">
              {[
                { lvl: 5, label: 'DEFCON 5', sub: isZh ? '平時' : 'Normal', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40' },
                { lvl: 4, label: 'DEFCON 4', sub: isZh ? '警戒' : 'Guarded', color: 'border-blue-500 text-blue-400 bg-blue-950/40' },
                { lvl: 3, label: 'DEFCON 3', sub: isZh ? '高度' : 'Elevated', color: 'border-amber-500 text-amber-400 bg-amber-950/40' },
                { lvl: 2, label: 'DEFCON 2', sub: isZh ? '臨戰' : 'Armed', color: 'border-orange-500 text-orange-400 bg-orange-950/40' },
                { lvl: 1, label: 'DEFCON 1', sub: isZh ? '決戰' : 'Maximum', color: 'border-red-500 text-red-400 bg-red-950/40' }
              ].map((item) => (
                <button
                  key={item.lvl}
                  onClick={() => setDefconLevel(item.lvl as any)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-black uppercase transition-all flex flex-col items-center gap-0.5 border',
                    defconLevel === item.lvl
                      ? `${item.color} shadow-lg scale-105`
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  )}
                >
                  <span>{item.label}</span>
                  <span className="text-[9px] font-normal">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cyber COP Main Dashboard: 2-Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left COP Column (8 cols): Heatmap & Critical Infrastructure Health */}
            <div className="lg:col-span-8 space-y-6">
              {/* Asset Damage & Health Heatmap */}
              <div className="bg-[#0e0f14] border border-gray-800 p-6 rounded-2xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-wider">
                    <Activity size={16} />
                    <span>{isZh ? '戰區態勢感知 (Cyber COP) — 資產損害熱圖' : 'Cyber COP Asset Damage Heatmap'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">7 Critical Nodes Tracked</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={cn(
                          'p-4 rounded-xl border cursor-pointer transition-all space-y-3 text-left relative overflow-hidden',
                          isSelected
                            ? 'bg-blue-950/30 border-blue-500 ring-1 ring-blue-500 shadow-xl'
                            : 'bg-black/40 border-gray-800 hover:border-gray-700'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{node.code}</span>
                          <span
                            className={cn(
                              'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                              node.status === 'compromised'
                                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                : node.status === 'targeted'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : node.status === 'isolated'
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            )}
                          >
                            {node.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-300 font-bold">{node.name}</div>
                        <div className="text-[10px] font-mono text-gray-500">IP: {node.ip}</div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-gray-400">{isZh ? '系統健康存活率' : 'Health Score'}</span>
                            <span className={cn('font-bold', node.health > 70 ? 'text-emerald-400' : node.health > 40 ? 'text-amber-400' : 'text-red-400')}>
                              {node.health}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all duration-500',
                                node.health > 70 ? 'bg-emerald-500' : node.health > 40 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${node.health}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Honeypots & Cyber Traps Captured Matrix */}
              <div className="bg-[#0e0f14] border border-emerald-950/70 p-6 rounded-2xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck size={16} />
                    <span>{isZh ? '主動密碼戰與反制蜜罐誘捕記錄 (Deception Traps)' : 'Cyber Traps & Decoy Intelligence'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">+230 Defense Pts</span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {trappedPayloads.map((trap, idx) => (
                    <div key={idx} className="p-3 bg-black/40 border border-emerald-900/30 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-emerald-400 font-bold text-[11px]">{trap.trap} • {trap.time}</div>
                        <div className="text-gray-300 text-[10px]">{trap.payload}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-black text-xs">
                          {trap.points}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right COP Column (4 cols): Selected Node Details & SOAR ROE Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0e0f14] border border-blue-950/70 p-6 rounded-2xl shadow-2xl space-y-5">
                <div className="pb-3 border-b border-gray-800">
                  <div className="text-xs font-black text-blue-400 uppercase font-mono">SELECTED NODE ROE</div>
                  <h4 className="text-base font-black text-white mt-1">{selectedNode.name}</h4>
                  <div className="text-xs font-mono text-gray-400 mt-0.5">{selectedNode.code} ({selectedNode.ip})</div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-gray-400">
                    <span>所屬作戰區段 (Zone):</span>
                    <span className="text-white uppercase font-bold">{selectedNode.zone}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>當前狀態 (Status):</span>
                    <span className={cn('font-bold uppercase', selectedNode.status === 'compromised' ? 'text-red-400' : 'text-emerald-400')}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>遭鎖定攻擊手法:</span>
                    <span className="text-red-400 font-bold">{selectedNode.mitreTTP || 'None'}</span>
                  </div>
                </div>

                {/* ROE Quick Action Buttons */}
                <div className="space-y-3 pt-3 border-t border-gray-800">
                  <div className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-400" />
                    <span>{isZh ? '動態交戰規則 (ROE) 應變指令' : 'Instant SOAR ROE Countermeasures'}</span>
                  </div>

                  {[
                    { id: 'isolate', label: isZh ? '即時隔離受害主機 (Isolate)' : 'Isolate Compromised Node', icon: <Lock size={14} />, color: 'bg-red-600 hover:bg-red-500' },
                    { id: 'backup', label: isZh ? '切換抗毀備援衛星線路 (Failover)' : 'Failover to Satellite Link', icon: <Wifi size={14} />, color: 'bg-blue-600 hover:bg-blue-500' },
                    { id: 'decoy', label: isZh ? '部署誘敵蜜罐陷阱 (Deploy Trap)' : 'Deploy Active Honey Trap', icon: <ShieldCheck size={14} />, color: 'bg-emerald-600 hover:bg-emerald-500' },
                    { id: 'scrub', label: isZh ? '啟動 BGP 流量清洗 (Scrubbing)' : 'Activate BGP FlowScrub', icon: <RefreshCw size={14} />, color: 'bg-purple-600 hover:bg-purple-500' }
                  ].map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleExecuteROE(action.label, selectedNode.id)}
                      disabled={isExecutingROE !== null}
                      className={cn(
                        'w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-between shadow-lg',
                        action.color,
                        isExecutingROE !== null ? 'opacity-50 cursor-not-allowed' : ''
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {action.icon}
                        <span>{action.label}</span>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  ))}

                  {/* Countdown overlay when executing ROE */}
                  {isExecutingROE && roeCountdown !== null && (
                    <div className="p-3 bg-blue-950/80 border border-blue-500/50 rounded-xl text-center font-mono space-y-1 animate-pulse">
                      <div className="text-xs text-blue-300 font-bold">
                        {isZh ? '正在執行防禦交戰規則：' : 'Executing ROE:'} {isExecutingROE}
                      </div>
                      <div className="text-xl font-black text-white">{roeCountdown}s</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🟡 TAB 3: WHITE CELL - REFEREE ENGINE & AFTER ACTION REVIEW (PROMPT 3) */}
      {/* ========================================================================= */}
      {factionTab === 'white' && (
        <div className="space-y-6">
          {/* Referee Score Verdict Card */}
          <div className="bg-[#0f1015] border-2 border-amber-950/70 p-6 rounded-2xl shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span>{isZh ? '導演部交戰裁決引擎 (Referee Verdict)' : 'White Cell Engagement Referee Engine'}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold">
                      {isZh ? '藍軍防禦勝利 (Blue Victory)' : 'Blue Team Victory'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isZh ? '依據攻防對抗指令時序、系統損害率與情報外洩損失，綜合計算戰術評分。' : 'Algorithmic assessment of tactical objective completion, damage percentage, and exfiltration volume.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <Download size={15} />
                {isZh ? '匯出軍用標準裁決報告 (PDF)' : 'Export Military AAR Report (PDF)'}
              </button>
            </div>

            {/* Verdict Score Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-left">
              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 uppercase font-bold">{isZh ? '核心 C4ISR 存活率' : 'C4ISR Survival Rate'}</div>
                <div className="text-2xl font-black text-emerald-400">88.5%</div>
                <div className="text-[10px] text-emerald-500/80">{isZh ? '指揮管制鏈路保持完整' : 'Command chain intact'}</div>
              </div>

              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 uppercase font-bold">{isZh ? '紅軍目標達成率' : 'Red Objective Hit'}</div>
                <div className="text-2xl font-black text-red-400">32.0%</div>
                <div className="text-[10px] text-red-500/80">{isZh ? '提權階段遭蜜罐阻斷' : 'Blocked at PrivEsc stage'}</div>
              </div>

              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 uppercase font-bold">{isZh ? '平均防禦應變時間 (MTTD/R)' : 'Mean Response Time'}</div>
                <div className="text-2xl font-black text-blue-400">14.2s</div>
                <div className="text-[10px] text-blue-400/80">{isZh ? '符合戰時 30 秒準則' : 'Within 30s mil standard'}</div>
              </div>

              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 uppercase font-bold">{isZh ? '資料外洩控制' : 'Data Loss Volume'}</div>
                <div className="text-2xl font-black text-purple-400">0.02 MB</div>
                <div className="text-[10px] text-purple-400/80">{isZh ? '未達機密外洩門檻' : 'Zero classified loss'}</div>
              </div>
            </div>
          </div>

          {/* Interactive Combat Timeline Playback (AAR Timeline) */}
          <div className="bg-[#0f1015] border border-gray-800 p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                <Clock size={16} className="text-amber-400" />
                <span>{isZh ? '戰後復盤 (AAR) — 時間軸回溯重播 (Combat Timeline Playback)' : 'Combat Timeline Playback'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingAAR(!isPlayingAAR)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isPlayingAAR ? <Pause size={13} /> : <Play size={13} />}
                  {isPlayingAAR ? (isZh ? '暫停重播' : 'Pause') : (isZh ? '播放推演' : 'Play Timeline')}
                </button>
                <button
                  onClick={() => setPlaybackTime(0)}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all"
                  title="Reset Timeline"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Timeline Slider and Key Events */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>00:00 (演習開始)</span>
                <span className="text-amber-400 font-bold text-sm">
                  T+ {Math.floor(playbackTime / 60)}m {playbackTime % 60}s
                </span>
                <span>10:00 (演習結束)</span>
              </div>

              <input
                type="range"
                min={0}
                max={600}
                value={playbackTime}
                onChange={(e) => setPlaybackTime(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
              />

              {/* Milestone Event Flags */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                {[
                  { time: '01:15', title: '紅軍突破 DMZ VPN', detail: 'CVE-2024-21887 注入成功', faction: 'red' },
                  { time: '03:40', title: '藍軍升級 DEFCON 2', detail: '觸發自動化 ROE 隔離策略', faction: 'blue' },
                  { time: '06:20', title: '蜜罐捕獲 C2 憑證', detail: '阻斷 Mimikatz 橫向移動', faction: 'blue' },
                  { time: '08:50', title: '導演部發佈停火裁決', detail: '核心 C4ISR 成功守護', faction: 'white' }
                ].map((ev, i) => (
                  <div
                    key={i}
                    onClick={() => setPlaybackTime(parseInt(ev.time.split(':')[0]) * 60 + parseInt(ev.time.split(':')[1]))}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all text-left space-y-1',
                      ev.faction === 'red'
                        ? 'bg-red-950/20 border-red-900/60 hover:border-red-500'
                        : ev.faction === 'blue'
                        ? 'bg-blue-950/20 border-blue-900/60 hover:border-blue-500'
                        : 'bg-amber-950/20 border-amber-900/60 hover:border-amber-500'
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className={ev.faction === 'red' ? 'text-red-400' : ev.faction === 'blue' ? 'text-blue-400' : 'text-amber-400'}>
                        {ev.time}
                      </span>
                      <span className="text-gray-500 uppercase">{ev.faction}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{ev.title}</div>
                    <div className="text-[10px] text-gray-400">{ev.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NG-SIEM Real-world Rule Remediation Recommendations */}
          <div className="bg-[#0f1015] border border-gray-800 p-6 rounded-2xl shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                <FileCode size={16} />
                <span>{isZh ? '實體 NG-SIEM 防禦規則強化建議 (Remediation Actions)' : 'NG-SIEM Rule Hardening Matrix'}</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">3 Recommendations</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {[
                {
                  ruleId: 'CORR-RULE-108',
                  name: 'VPN 設備異常連線且短時間內大量特權指令執行',
                  gap: '推演中紅軍在突破 VPN 閘道後於 40 秒內發起橫向掃描，原 SIEM 規則窗口為 5 分鐘，建議縮短至 60 秒。',
                  status: 'Ready to Deploy'
                },
                {
                  ruleId: 'EDR-SIGMA-042',
                  name: 'LSASS 記憶體傾印特徵阻斷 (Mimikatz Variant)',
                  gap: '演習網行政終端之 EDR 策略僅設定為「告警」，建議直接調整為「即時記憶體注入隔離 (Active Block)」。',
                  status: 'Policy Update'
                },
                {
                  ruleId: 'NDR-SURICATA-991',
                  name: '超高頻 (UHF) 戰術通信協定非標準封包深度偵測',
                  gap: '針對 C4ISR 戰術中繼節點，啟用 Zeek-ICS 協定解析外掛以捕捉異常指令碼。',
                  status: 'Enforce Filter'
                }
              ].map((rec, i) => (
                <div key={i} className="p-3.5 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs">{rec.name}</div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                      {rec.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 leading-relaxed">{rec.gap}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Military PDF Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0b0c10] border-2 border-amber-500/50 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-6 shadow-2xl text-left font-mono"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase">
                      {isZh ? '國防網絡戰兵棋推演・作戰裁決評定書' : 'Military Cyber Wargame Referee Verdict'}
                    </h3>
                    <p className="text-[10px] text-red-400">
                      CLASSIFICATION: TOP SECRET // EXERCISE ONLY // MIL-CYBER-2026
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
              </div>

              <div className="space-y-4 text-xs text-gray-300">
                <div className="grid grid-cols-2 gap-4 p-4 bg-black/50 border border-gray-800 rounded-xl">
                  <div>演習代號：OPERATION TYPHOON BREACH</div>
                  <div>裁決日期：2026-08-20 19:30:00</div>
                  <div>紅軍扮演：APT-66 (State Cyber Unit)</div>
                  <div>藍軍防禦：國防資通安全指揮作戰中心</div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
                  <div className="text-emerald-400 font-bold text-sm">【導演部裁決判定】藍軍獲勝 (Blue Team Victory)</div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    紅軍雖於 DMZ 戰術 VPN 取得初始突破，但藍軍防禦小組在 14.2 秒內將戰備等級升級至 DEFCON 2，並藉由部署之主動蜜罐成功捕捉惡意 C2 憑證，完全守護 C4ISR 指揮核心伺服器，指揮鏈路無損壞。
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-white font-bold">【實體 NG-SIEM 補強要求】</div>
                  <ul className="list-disc list-inside text-gray-400 text-[11px] space-y-1">
                    <li>立即於生產環境部署 CORR-RULE-108 短窗口關聯規則。</li>
                    <li>將行政終端 EDR 策略切換為主動記憶體阻斷模式。</li>
                    <li>全面更新戰術中繼節點之 Zeek ICS 協定檢驗外掛。</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                >
                  {isZh ? '關閉' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    alert(isZh ? '作戰裁決評定書 (PDF) 已成功產生並開始下載！' : 'AAR Verdict Report downloaded successfully!');
                    setShowReportModal(false);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30"
                >
                  <Download size={14} />
                  {isZh ? '確認下載 PDF 裁決書' : 'Download Military PDF'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

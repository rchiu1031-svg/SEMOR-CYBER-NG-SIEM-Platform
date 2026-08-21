import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  Cpu,
  Database,
  Search,
  Server,
  Play,
  PlayCircle,
  RefreshCw,
  Trash2,
  Monitor,
  ArrowRight,
  Lock,
  Unlock,
  Network,
  Activity,
  Sparkles,
  Radio,
  Check,
  X,
  ExternalLink,
  Flame,
  UserX,
  Zap,
  Globe,
  Tag,
  Users,
  SearchCode,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Sliders,
  Layers,
  Layers2,
  HardDrive,
  Laptop,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Crosshair,
  Filter,
  Download,
  Share2,
  SlidersHorizontal,
  Workflow,
  Target,
  Send,
  CornerDownRight,
  Code,
  FileCode,
  HardDriveDownload,
  PowerOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { siemService } from '../services/siemService';
import AIDetectionView from './AIDetectionView';
import { AssetsManager } from './DiscoveryView';

// Threat Actors database
const THREAT_ACTORS_DATA: Record<string, any> = {
  'Lazarus Group': {
    origin: 'North Korea (DPRK)',
    alias: 'APT38 / Hidden Cobra / BlueNoroff',
    description: 'DPRK state-sponsored cyber group focused on financial theft, cryptojacking, destructive wiper attacks, and defense espionage.',
    ttps: ['T1059.001 (PowerShell)', 'T1204.002 (Malicious File)', 'T1486 (Ransomware)', 'T1071.001 (C2 Over TLS)', 'T1027 (Binary Padding)'],
    targetedSectors: ['Banking & Fintech', 'Defense Contractors', 'Cryptocurrency Exchanges', 'Critical Infrastructure'],
    cveList: ['CVE-2021-44228', 'CVE-2023-38606', 'CVE-2024-21413'],
    reports: [
      { name: 'CISA AA22-109A: Lazarus Cryptocurrency Thefts', url: 'https://cisa.gov' },
      { name: 'Mandiant Threat Profile: HIDDEN COBRA', url: 'https://mandiant.com' }
    ]
  },
  'APT28': {
    origin: 'Russian Federation (GRU)',
    alias: 'Fancy Bear / Sofacy / Strontium / Sednit',
    description: 'Specialized military intelligence cyber espionage group conducting high-impact credential harvesting, zero-day exploitation, and supply-chain tampering.',
    ttps: ['T1190 (Exploit Public App)', 'T1078 (Valid Accounts)', 'T1003.001 (LSASS Dumping)', 'T1566.002 (Spearphishing Link)'],
    targetedSectors: ['Government & NATO Allies', 'Aerospace & Military', 'Energy Grid', 'Think Tanks'],
    cveList: ['CVE-2023-23397', 'CVE-2023-38831', 'CVE-2024-3400'],
    reports: [
      { name: 'Unit 42: Fancy Bear Campaign Analysis', url: 'https://unit42.paloaltonetworks.com' },
      { name: 'Microsoft Threat Intelligence: Strontium', url: 'https://microsoft.com/security' }
    ]
  },
  'Mustang Panda': {
    origin: 'China (PRC-aligned)',
    alias: 'Bronze President / HoneyMyte / RedDelta',
    description: 'State-sponsored cyber espionage group targeting diplomatic, non-governmental, and telecommunication entities via custom loaders (PlugX, Hodur).',
    ttps: ['T1566.001 (Spearphishing Attachment)', 'T1071.001 (Web Protocols)', 'T1105 (Ingress Tool Transfer)', 'T1547.001 (Registry Run Keys)'],
    targetedSectors: ['Diplomatic Missions', 'Telecom Operators', 'Maritime Logistics', 'SE Asia Governments'],
    cveList: ['CVE-2022-30190 (Follina)', 'CVE-2023-22515'],
    reports: [
      { name: 'Recorded Future: Mustang Panda RedDelta', url: 'https://recordedfuture.com' },
      { name: 'Trend Micro: PlugX Variants Research', url: 'https://trendmicro.com' }
    ]
  },
  'Sandworm': {
    origin: 'Russian Federation (GRU 74455)',
    alias: 'TeleBots / Voodoo Bear / BlackEnergy',
    description: 'Elite destructive warfare group notorious for ICS/SCADA grid blackouts, NotPetya ransomware attacks, and Prestige wiper campaigns.',
    ttps: ['T1485 (Data Destruction)', 'T1053.005 (Scheduled Task)', 'T1021.002 (SMB/Windows Admin Shares)', 'T0814 (Inhibit Response Function)'],
    targetedSectors: ['Electric Grid & Water Utilities', 'Rail & Transport Logistics', 'Media & Government'],
    cveList: ['CVE-2017-0144 (EternalBlue)', 'CVE-2022-26925'],
    reports: [
      { name: 'Mandiant: Sandworm Industrial Sabotage', url: 'https://mandiant.com' },
      { name: 'CISA Advisory: Sandworm Tactics and ICS Tools', url: 'https://cisa.gov' }
    ]
  }
};

// MITRE ATT&CK Enterprise Matrix Data
const MITRE_ENTERPRISE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access', nameZh: '初始存取', count: 42, icon: '🚪', techniques: ['T1566 Phishing', 'T1190 Exploit Public App', 'T1078 Valid Accounts', 'T1133 External Remote Services'] },
  { id: 'TA0002', name: 'Execution', nameZh: '執行程式', count: 68, icon: '⚡', techniques: ['T1059 PowerShell/CLI', 'T1204 User Execution', 'T1047 WMI', 'T1569 System Services'] },
  { id: 'TA0003', name: 'Persistence', nameZh: '持續性潛伏', count: 35, icon: '⚓', techniques: ['T1547 Boot/Logon Autostart', 'T1053 Scheduled Task', 'T1136 Create Account', 'T1543 Create System Process'] },
  { id: 'TA0004', name: 'Privilege Escalation', nameZh: '特權提升', count: 29, icon: '👑', techniques: ['T1548 Abuse Elevation', 'T1068 Exploitation for PrivEsc', 'T1134 Access Token Manipulation', 'T1055 Process Injection'] },
  { id: 'TA0005', name: 'Defense Evasion', nameZh: '防禦規避', count: 54, icon: '🎭', techniques: ['T1027 Obfuscated Files', 'T1070 Indicator Removal', 'T1562 Impair Defenses', 'T1036 Masquerading'] },
  { id: 'TA0006', name: 'Credential Access', nameZh: '憑證存取', count: 48, icon: '🔑', techniques: ['T1003 OS Credential Dumping', 'T1555 Password Stores', 'T1110 Brute Force', 'T1558 Steal Kerberos Tickets'] },
  { id: 'TA0007', name: 'Discovery', nameZh: '環境探勘', count: 61, icon: '🔍', techniques: ['T1087 Account Discovery', 'T1082 System Info Discovery', 'T1046 Network Service Scanning', 'T1018 Remote System Discovery'] },
  { id: 'TA0008', name: 'Lateral Movement', nameZh: '橫向移動', count: 38, icon: '↔️', techniques: ['T1021 Remote Services (SMB/RDP)', 'T1550 Use Alternate Auth', 'T1570 Lateral Tool Transfer', 'T1563 Session Hijacking'] },
  { id: 'TA0009', name: 'Collection', nameZh: '資料搜集', count: 24, icon: '📦', techniques: ['T1560 Archive Collected Data', 'T1005 Data from Local System', 'T1114 Email Collection', 'T1115 Clipboard Data'] },
  { id: 'TA0011', name: 'Command and Control', nameZh: '命令與控制 (C2)', count: 45, icon: '📡', techniques: ['T1071 App Layer Protocol (TLS/DNS)', 'T1573 Encrypted Channel', 'T1105 Ingress Tool Transfer', 'T1568 Dynamic Resolution'] },
  { id: 'TA0010', name: 'Exfiltration', nameZh: '資料外洩', count: 19, icon: '📤', techniques: ['T1041 Exfil Over C2', 'T1048 Exfil Over Alt Protocol', 'T1567 Exfil to Cloud Storage', 'T1029 Scheduled Transfer'] },
  { id: 'TA0040', name: 'Impact', nameZh: '損害破壞', count: 12, icon: '💥', techniques: ['T1486 Data Encrypted for Impact', 'T1485 Data Destruction', 'T1490 Inhibit System Recovery', 'T1489 Service Stop'] }
];

export default function OpenXDRView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'hunting' | 'fleet' | 'ai-correlate' | 'soar' | 'matrix' | 'interflow'>('hunting');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActor, setSelectedActor] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);

  // Interaction Modals & States
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isCommandRunning, setIsCommandRunning] = useState(false);

  // SOAR Execution State
  const [autoContainmentEnabled, setAutoContainmentEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [soarExecutionLogs, setSoarExecutionLogs] = useState<any[]>([
    {
      id: 'SOAR-EXEC-991',
      time: '11:42:08',
      playbook: isZh ? '勒索軟體全自動緊急隔離' : 'Ransomware Auto-Containment',
      target: 'WS-FINANCE-088 (192.168.10.142)',
      trigger: 'T1486 Shadow Copy Deletion Detected',
      actions: [
        { name: isZh ? '驅動層 EDR 網路隔離' : 'EDR Driver Isolation', status: 'Completed' },
        { name: isZh ? '強制終止 powershell.exe 程序樹' : 'Kill Malicious Process Tree', status: 'Completed' },
        { name: isZh ? 'Fortinet 防火牆自動阻斷 C2 IP' : 'Firewall Edge Rule Block', status: 'Completed' },
        { name: isZh ? 'SOC 告警單自動指派與 Slack 通知' : 'Jira Incident Created #SEC-819', status: 'Completed' }
      ],
      status: 'Success'
    },
    {
      id: 'SOAR-EXEC-990',
      time: '10:15:33',
      playbook: isZh ? '憑證濫用與異常登入防護' : 'Credential Hijack Auto-Revocation',
      target: 'SVC-SQL-BACKUP (10.0.4.19)',
      trigger: 'T1078 Suspicious Admin Login from Tor Exit Node',
      actions: [
        { name: isZh ? '強制重設 AD 網域帳號 Token' : 'Active Directory Token Revocation', status: 'Completed' },
        { name: isZh ? '暫時停用遠端 RDP 存取' : 'Disable Remote Desktop Session', status: 'Completed' }
      ],
      status: 'Success'
    }
  ]);

  // Endpoint Fleet Data (EDR Agents)
  const [endpoints, setEndpoints] = useState<any[]>([
    {
      id: 'EP-001',
      hostname: 'WS-FINANCE-088',
      ip: '192.168.10.142',
      os: 'Windows 11 Enterprise 23H2',
      agentVer: 'v7.4.2-EDR',
      group: isZh ? '財務處 (Finance)' : 'Finance Dept',
      user: 'alice.chen@corp.cyber',
      status: 'Isolated',
      riskScore: 96,
      cpu: '84%',
      ram: '7.8 / 16 GB',
      lastSeen: isZh ? '剛剛' : 'Just now',
      threats: ['Lazarus Ransomware Beacon', 'PowerShell Encoded Command', 'vssadmin Shadow Tamper'],
      isolated: true
    },
    {
      id: 'EP-002',
      hostname: 'SRV-DB-PROD-01',
      ip: '10.0.2.15',
      os: 'Ubuntu 22.04 LTS (Kernel 6.2 eBPF)',
      agentVer: 'v7.4.2-Linux',
      group: isZh ? '生產資料庫叢集' : 'Production DB',
      user: 'svc_postgres',
      status: 'Warning',
      riskScore: 78,
      cpu: '45%',
      ram: '28.2 / 64 GB',
      lastSeen: isZh ? '1 分鐘前' : '1 min ago',
      threats: ['Abnormal Outbound SSH to Foreign ASN', 'Privilege Escalation attempt'],
      isolated: false
    },
    {
      id: 'EP-003',
      hostname: 'K8S-WORKER-NODE-04',
      ip: '10.244.3.88',
      os: 'Red Hat Enterprise Linux 9.2',
      agentVer: 'v7.4.1-Container',
      group: isZh ? 'Kubernetes 運算叢集' : 'K8s Cluster Alpha',
      user: 'root (container runtime)',
      status: 'Healthy',
      riskScore: 12,
      cpu: '22%',
      ram: '14.5 / 32 GB',
      lastSeen: isZh ? '即時連線' : 'Live',
      threats: [],
      isolated: false
    },
    {
      id: 'EP-004',
      hostname: 'MAC-ENG-DESIGN-09',
      ip: '192.168.20.73',
      os: 'macOS Sonoma 14.5 (Apple M3 Pro)',
      agentVer: 'v7.4.0-macOS',
      group: isZh ? '研發設計部 (R&D)' : 'R&D Engineering',
      user: 'kevin.lin@corp.cyber',
      status: 'Healthy',
      riskScore: 24,
      cpu: '18%',
      ram: '12.0 / 36 GB',
      lastSeen: isZh ? '即時連線' : 'Live',
      threats: [],
      isolated: false
    },
    {
      id: 'EP-005',
      hostname: 'DC-PRIMARY-01.CORP',
      ip: '10.0.1.10',
      os: 'Windows Server 2022 Datacenter',
      agentVer: 'v7.4.2-EDR',
      group: isZh ? '網域控制站 (Active Directory)' : 'Core Infrastructure',
      user: 'SYSTEM',
      status: 'Warning',
      riskScore: 68,
      cpu: '38%',
      ram: '18.4 / 32 GB',
      lastSeen: isZh ? '即時連線' : 'Live',
      threats: ['Kerberoasting (T1558.003)', 'Pass-the-Hash Probe'],
      isolated: false
    }
  ]);

  // Correlated Cross-Layer XDR Incidents
  const incidents = [
    {
      id: 'INC-2026-0881',
      title: isZh ? '多層次跨維度雙重勒索行動攻擊 (Lazarus APT)' : 'Multi-Stage Ransomware Campaign (Lazarus APT)',
      severity: 'Critical',
      score: 99,
      actor: 'Lazarus Group',
      targetHost: 'WS-FINANCE-088 (192.168.10.142)',
      c2Ip: '185.220.101.44 (Pyongyang Proxy Gateway)',
      time: isZh ? '5 分鐘前' : '5 mins ago',
      tactics: ['TA0001', 'TA0002', 'TA0005', 'TA0006', 'TA0011', 'TA0040'],
      techniques: ['T1566.001', 'T1059.001', 'T1027', 'T1003.001', 'T1071.001', 'T1486', 'T1490'],
      summary: isZh 
        ? '受害者透過釣魚郵件點擊惡意巨集 Word 檔，觸發 PowerShell 無檔案注入下載二階段 C2 載荷，隨後執行 Mimikatz 傾印 LSASS 憑證並試圖透過 vssadmin 抹除陰影副本以發動勒索加密。'
        : 'Victim opened spearphishing document initiating in-memory PowerShell injector contacting C2 relay, executing LSASS credential dumping, and deleting volume shadow copies prior to encryption.',
      processTree: [
        { name: 'explorer.exe (PID: 3412)', hash: '3a88...c110', parent: null, status: 'Normal' },
        { name: 'WINWORD.EXE (PID: 6820)', hash: '9b77...44a1', parent: 'explorer.exe', status: 'Suspicious' },
        { name: 'powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAaQBl... (PID: 9144)', hash: 'e102...89bb', parent: 'WINWORD.EXE', status: 'Malicious' },
        { name: 'cmd.exe /c vssadmin.exe delete shadows /all /quiet (PID: 9812)', hash: '7c33...1192', parent: 'powershell.exe', status: 'Malicious' },
        { name: 'rundll32.exe C:\\ProgramData\\svchost.dll,Start (PID: 10420)', hash: 'f556...dead', parent: 'powershell.exe', status: 'Malicious (C2 Beacon)' }
      ],
      networkFlows: [
        { proto: 'HTTPS/TLS 1.3', src: '192.168.10.142:51280', dst: '185.220.101.44:443', sni: 'cloud-cdn-sync.azureedge-verify.net', bytes: '14.2 MB', state: 'Blocked by NDR' }
      ]
    },
    {
      id: 'INC-2026-0879',
      title: isZh ? '雲端 IAM 憑證濫用與 S3 敏感機密洩漏 (APT28)' : 'Cloud IAM Key Compromise & Exfiltration (APT28)',
      severity: 'High',
      score: 87,
      actor: 'APT28',
      targetHost: 'AWS-VPC-GATEWAY-PROD (10.0.1.5)',
      c2Ip: '45.154.255.89 (Tor Guard Node)',
      time: isZh ? '28 分鐘前' : '28 mins ago',
      tactics: ['TA0001', 'TA0006', 'TA0010'],
      techniques: ['T1078.004', 'T1555.003', 'T1567.002'],
      summary: isZh 
        ? '偵測到異常地理位置 (俄羅斯聖彼得堡) 使用長期存取密鑰 (AKIA...) 呼叫 GetSecretValue 與 S3 Sync，跨多個儲存庫批次下載加密金鑰與客戶 PII 資料。'
        : 'Anomalous geographical access from St. Petersburg utilizing persistent AWS IAM access key calling GetSecretValue and executing mass S3 sync against encrypted customer repositories.',
      processTree: [
        { name: 'aws-cli (Python runtime)', hash: '4f29...912a', parent: 'bash', status: 'High Anomaly' }
      ],
      networkFlows: [
        { proto: 'HTTPS API', src: '10.0.1.5', dst: 's3.ap-northeast-1.amazonaws.com', bytes: '4.8 GB', state: 'Rate Limited' }
      ]
    },
    {
      id: 'INC-2026-0875',
      title: isZh ? '內部網段 Pass-the-Hash 橫向移動與 Kerberoasting' : 'Internal Pass-the-Hash & Kerberoasting Probe',
      severity: 'Medium',
      score: 72,
      actor: 'Mustang Panda',
      targetHost: 'DC-PRIMARY-01.CORP (10.0.1.10)',
      c2Ip: '192.168.10.142 (Compromised Host Jump)',
      time: isZh ? '1 小時前' : '1 hour ago',
      tactics: ['TA0006', 'TA0008'],
      techniques: ['T1558.003', 'T1550.002', 'T1021.002'],
      summary: isZh
        ? '從受駭工作站嘗試向 Active Directory 發起大規模 SPN 請求 (Kerberoasting)，並試圖透過 SMB 命名管道向其他內部主機執行遠端 RPC 存取。'
        : 'Multiple SPN ticket requests issued to Active Directory from compromised endpoint attempting offline cracking and lateral RPC execution via SMB named pipes.',
      processTree: [],
      networkFlows: []
    }
  ];

  // Quick action to toggle endpoint isolation
  const toggleIsolateEndpoint = (epId: string) => {
    setEndpoints(prev => prev.map(ep => {
      if (ep.id === epId) {
        const nextIsolated = !ep.isolated;
        const updated = {
          ...ep,
          isolated: nextIsolated,
          status: nextIsolated ? 'Isolated' : 'Healthy'
        };
        
        // Trigger Toast & SOAR log
        const toastMsg = nextIsolated
          ? (isZh ? `已成功隔離端點 ${ep.hostname} (僅保留 SOC 通訊)` : `Host ${ep.hostname} has been isolated from network`)
          : (isZh ? `已恢復端點 ${ep.hostname} 正常網路通訊` : `Host ${ep.hostname} network isolation removed`);
        
        setActiveToast({ type: nextIsolated ? 'danger' : 'success', text: toastMsg });
        setTimeout(() => setActiveToast(null), 4000);

        return updated;
      }
      return ep;
    }));
  };

  // Run mock terminal commands
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${timestamp}] root@${selectedEndpoint?.hostname || 'edr-node'}:~# ${cmd}`]);
    setTerminalInput('');
    setIsCommandRunning(true);

    setTimeout(() => {
      let output = '';
      if (cmd === 'help') {
        output = 'Available commands: ps, netstat, kill -9 <PID>, isolate, unisolate, dump-memory, get-service, check-integrity, clear';
      } else if (cmd === 'ps' || cmd === 'ps aux') {
        output = 'PID    USER     %CPU %MEM COMMAND\n1      root     0.0  0.1  /sbin/init\n3412   user     1.2  0.4  explorer.exe\n9144   user     88.4 4.2  powershell.exe -Enc JABjAGw...\n9812   user     42.1 1.1  vssadmin.exe delete shadows /all';
      } else if (cmd.startsWith('kill')) {
        output = 'Process termination signal sent. Process killed successfully via Kernel driver.';
      } else if (cmd === 'isolate') {
        if (selectedEndpoint) toggleIsolateEndpoint(selectedEndpoint.id);
        output = 'EDR Driver: Host isolated. Inbound/Outbound egress dropped (except port 8443 to XDR Cloud).';
      } else if (cmd === 'dump-memory') {
        output = 'Live volatile RAM capture in progress... Saved to /opt/edr/dumps/mem_dump_2026.raw (Size: 8.2 GB).';
      } else if (cmd === 'clear') {
        setTerminalLogs([]);
        setIsCommandRunning(false);
        return;
      } else {
        output = `Executed: ${cmd}\nReturn code: 0 [SUCCESS]`;
      }

      setTerminalLogs(prev => [...prev, output]);
      setIsCommandRunning(false);
    }, 600);
  };

  // Open live terminal for an endpoint
  const openEndpointTerminal = (ep: any) => {
    setSelectedEndpoint(ep);
    setTerminalLogs([
      `=== EDR Live Response Terminal (Kernel eBPF / Windows Filter Driver) ===`,
      `Connected to Host: ${ep.hostname} (${ep.ip})`,
      `Agent Version: ${ep.agentVer} | OS: ${ep.os}`,
      `Type 'help' for quick forensic commands.`
    ]);
    setTerminalOpen(true);
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter(inc => {
    const matchActor = selectedActor === 'All' || inc.actor === selectedActor;
    const matchSeverity = selectedSeverity === 'All' || inc.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchQuery = !searchQuery || 
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.targetHost.toLowerCase().includes(searchQuery.toLowerCase());
    return matchActor && matchSeverity && matchQuery;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[1000] max-w-md"
          >
            <div className={cn(
              "px-5 py-4 rounded-xl border shadow-2xl flex items-center gap-3 text-white backdrop-blur-md",
              activeToast.type === 'danger' 
                ? "bg-red-950/90 border-red-500/50 shadow-red-500/20" 
                : "bg-emerald-950/90 border-emerald-500/50 shadow-emerald-500/20"
            )}>
              <ShieldAlert className={activeToast.type === 'danger' ? "text-red-400" : "text-emerald-400"} size={22} />
              <div className="text-xs font-bold leading-relaxed">{activeToast.text}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-[#111116] to-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-400 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {isZh ? '開放式 XDR 統一威脅防禦平台 (Open XDR & EDR)' : 'SEMOR Open XDR & EDR Telemetry Platform'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Interflow™ v7.4.2
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                {isZh 
                  ? '整合端點 EDR 探針、網路 NDR 串流、雲端 IAM 日誌與 SOAR 自動聯防劇本，提供秒級偵測、攻擊樹溯源 (Kill-Chain) 與一鍵自主隔離。'
                  : 'Stellar Cyber-style Open XDR orchestrating EDR sensors, NDR network telemetry, Cloud IAM logs, and SOAR automation for instant correlation and autonomous isolation.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setActiveToast({ type: 'success', text: isZh ? '已完成全域 EDR 探針心跳同步檢測' : 'Synchronized all EDR sensor fleet heartbeats' });
                setTimeout(() => setActiveToast(null), 3000);
              }}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={14} />
              {isZh ? '探針同步' : 'Sync Fleet'}
            </button>
            <button
              onClick={() => setActiveTab('soar')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg",
                autoContainmentEnabled
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700"
              )}
            >
              <Zap size={14} className={autoContainmentEnabled ? "animate-pulse text-amber-300" : ""} />
              {isZh ? 'SOAR 自動聯防隔離: 啟用' : 'Autonomous Containment: ON'}
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800/80">
          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? 'Interflow™ 關聯吞吐' : 'Interflow™ Throughput'}</span>
              <Activity size={14} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5 font-mono">4.85 <span className="text-xs text-blue-400 font-sans">Gbps</span></div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-emerald-400 font-bold">138,400 EPS</span> | 99.98% Parse
            </div>
          </div>

          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? '管理端點 EDR 艦隊' : 'Managed EDR Fleet'}</span>
              <Monitor size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5 font-mono">1,480 <span className="text-xs text-emerald-400 font-sans">Hosts</span></div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-emerald-400">1,452 Healthy</span> | <span className="text-amber-400">18 Warn</span> | <span className="text-red-400">10 Isolated</span>
            </div>
          </div>

          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? '跨層關聯事件 (Incidents)' : 'Correlated Incidents'}</span>
              <ShieldAlert size={14} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5 font-mono">3 <span className="text-xs text-amber-400 font-sans">Active</span></div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="text-red-400 font-bold">1 Critical (Lazarus)</span> | <span className="text-amber-400">2 High</span>
            </div>
          </div>

          <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{isZh ? '平均自動應答遏制時間 (MTTR)' : 'Automated MTTR'}</span>
              <Zap size={14} className="text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 mt-1.5 font-mono">42 <span className="text-xs text-white font-sans">seconds</span></div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="text-purple-300 font-bold">98.6%</span> Auto-Containment Rate
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 overflow-x-auto custom-scrollbar gap-1">
        {[
          { id: 'hunting', label: isZh ? '跨維度威脅獵捕 (Threat Hunting)' : 'Threat Hunting & Kill-Chain', icon: <SearchCode size={15} /> },
          { id: 'fleet', label: isZh ? '端點 EDR 艦隊與現場處置' : 'Endpoint Fleet & Live Response', icon: <Monitor size={15} /> },
          { id: 'ai-correlate', label: isZh ? 'AI 攻擊圖與行為偵測' : 'AI Attack Graph & Correlation', icon: <Sparkles size={15} /> },
          { id: 'soar', label: isZh ? 'SOAR 劇本自動化聯防' : 'SOAR Playbooks & Automation', icon: <Zap size={15} /> },
          { id: 'matrix', label: isZh ? 'MITRE ATT&CK 戰術矩陣' : 'MITRE ATT&CK Matrix', icon: <Target size={15} /> },
          { id: 'interflow', label: isZh ? 'Interflow™ 資料湖拓撲' : 'Interflow™ Lake & Connectors', icon: <Database size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800/60"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: THREAT HUNTING & KILL-CHAIN INVESTIGATION */}
      {activeTab === 'hunting' && (
        <div className="space-y-6">
          {/* Universal Query Hunter */}
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isZh 
                    ? '輸入 KQL / Interflow 查詢語法（例如：event.category:process AND process.name:powershell.exe OR actor:"Lazarus"）...' 
                    : 'Search Interflow™ records, process command-lines, MITRE techniques, or adversary names...'
                  }
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedActor}
                  onChange={(e) => setSelectedActor(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-3 text-xs text-gray-300 font-bold focus:border-blue-500 focus:outline-none"
                >
                  <option value="All">{isZh ? '全部攻擊組織 (All Actors)' : 'All Threat Actors'}</option>
                  <option value="Lazarus Group">Lazarus Group (北韓)</option>
                  <option value="APT28">APT28 (俄羅斯 GRU)</option>
                  <option value="Mustang Panda">Mustang Panda (中國)</option>
                  <option value="Sandworm">Sandworm (俄羅斯 GRU)</option>
                </select>

                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-3 text-xs text-gray-300 font-bold focus:border-blue-500 focus:outline-none"
                >
                  <option value="All">{isZh ? '全部威脅等級' : 'All Severities'}</option>
                  <option value="critical">{isZh ? '嚴重 (Critical)' : 'Critical'}</option>
                  <option value="high">{isZh ? '高風險 (High)' : 'High'}</option>
                  <option value="medium">{isZh ? '中風險 (Medium)' : 'Medium'}</option>
                </select>
              </div>
            </div>

            {/* Quick Hunt Presets */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-1">
                {isZh ? '常用威脅獵捕範本:' : 'Hunt Presets:'}
              </span>
              {[
                { label: isZh ? '勒索無檔案 PowerShell 注入' : 'PowerShell In-Memory Inject', query: 'powershell.exe -Enc' },
                { label: isZh ? '陰影副本刪除 (vssadmin)' : 'Shadow Copy Tampering', query: 'vssadmin delete shadows' },
                { label: isZh ? 'LSASS 記憶體傾印 (Mimikatz)' : 'LSASS Dump (T1003)', query: 'T1003.001' },
                { label: isZh ? '異常 C2 突發外洩流量' : 'DNS/TLS C2 Exfiltration', query: 'T1071.001' }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setSearchQuery(preset.query)}
                  className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-400 hover:text-blue-400 transition-all font-mono text-[11px]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Incidents List & Deep Dive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Incident Cards */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Flame size={16} className="text-red-400" />
                  {isZh ? `跨層關聯事件 (${filteredIncidents.length})` : `Correlated Incidents (${filteredIncidents.length})`}
                </h3>
              </div>

              <div className="space-y-3">
                {filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative group",
                        isSelected 
                          ? "bg-blue-950/20 border-blue-500 shadow-lg shadow-blue-950/40" 
                          : "bg-[#111116] border-gray-800 hover:border-gray-700 hover:bg-gray-900/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                          inc.severity === 'Critical' ? "bg-red-500/10 text-red-400 border-red-500/30" :
                          inc.severity === 'High' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        )}>
                          {inc.severity} • {inc.score}% Conf
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{inc.time}</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors leading-snug">
                          {inc.title}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          {inc.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-[10px]">
                        <span className="text-gray-400 font-bold flex items-center gap-1">
                          <Target size={12} className="text-red-400" /> {inc.actor}
                        </span>
                        <span className="text-blue-400 font-mono flex items-center gap-1 font-bold">
                          {inc.targetHost.split(' ')[0]}
                          <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredIncidents.length === 0 && (
                  <div className="p-8 text-center bg-[#111116] border border-dashed border-gray-800 rounded-xl">
                    <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2 opacity-60" />
                    <p className="text-xs text-gray-400 font-bold">{isZh ? '無符合條件的威脅事件' : 'No incidents match criteria'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Detailed Kill-Chain & Process Tree */}
            <div className="lg:col-span-2 space-y-6">
              {selectedIncident ? (
                <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-blue-400 font-bold">{selectedIncident.id}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs font-bold text-gray-400">{selectedIncident.actor}</span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1">{selectedIncident.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const targetEp = endpoints.find(e => selectedIncident.targetHost.includes(e.hostname));
                          if (targetEp) {
                            toggleIsolateEndpoint(targetEp.id);
                          } else {
                            setActiveToast({ type: 'danger', text: isZh ? `已向主機 ${selectedIncident.targetHost} 發送 EDR 隔離指令` : `Host isolated` });
                            setTimeout(() => setActiveToast(null), 3000);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-red-950/30"
                      >
                        <PowerOff size={14} />
                        {isZh ? '一鍵隔離端點' : 'Isolate Host'}
                      </button>
                      <button
                        onClick={() => {
                          const ep = endpoints[0];
                          openEndpointTerminal(ep);
                        }}
                        className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Terminal size={14} />
                        {isZh ? '連線現場鑑識' : 'Live Triage'}
                      </button>
                    </div>
                  </div>

                  {/* Summary & Actor Intel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Fingerprint size={13} /> {isZh ? '受害端點與 C2 中繼' : 'Victim Host & C2 Node'}
                      </div>
                      <div className="text-xs text-gray-300 font-mono">
                        <div><span className="text-gray-500">{isZh ? '目標主機:' : 'Host:'}</span> {selectedIncident.targetHost}</div>
                        <div className="mt-1"><span className="text-gray-500">{isZh ? 'C2 節點:' : 'C2 Node:'}</span> <span className="text-red-400 font-bold">{selectedIncident.c2Ip}</span></div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
                      <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Target size={13} /> {isZh ? '威脅組織歸因情報' : 'Attribution Intel'}
                      </div>
                      <div className="text-xs text-gray-300">
                        <div className="font-bold text-white">{selectedIncident.actor} ({THREAT_ACTORS_DATA[selectedIncident.actor]?.origin || 'Unknown'})</div>
                        <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {THREAT_ACTORS_DATA[selectedIncident.actor]?.alias}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MITRE Techniques Pill Bar */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {isZh ? '命中 MITRE ATT&CK 戰術與技術標註 (Tactics & Techniques)' : 'Mapped MITRE ATT&CK TTPs'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIncident.techniques.map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-[11px] font-mono font-bold"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Visual Process Tree */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Workflow size={14} /> {isZh ? '端點程序執行溯源樹 (Process Execution Tree)' : 'Endpoint Process Tree (Parent/Child)'}
                    </div>

                    <div className="bg-black/60 border border-gray-800 rounded-xl p-4 font-mono text-xs space-y-3 overflow-x-auto">
                      {selectedIncident.processTree.length > 0 ? (
                        selectedIncident.processTree.map((proc: any, idx: number) => (
                          <div
                            key={idx}
                            style={{ paddingLeft: `${idx * 16}px` }}
                            className="flex items-start gap-2 text-xs"
                          >
                            <CornerDownRight size={14} className={cn(
                              "mt-0.5 shrink-0",
                              proc.status.includes('Malicious') ? "text-red-500" :
                              proc.status.includes('Suspicious') ? "text-amber-400" : "text-gray-500"
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "font-bold",
                                  proc.status.includes('Malicious') ? "text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900" :
                                  proc.status.includes('Suspicious') ? "text-amber-300" : "text-gray-300"
                                )}>
                                  {proc.name}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">SHA256: {proc.hash}</span>
                                <span className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold",
                                  proc.status.includes('Malicious') ? "bg-red-500/20 text-red-400" : "bg-gray-800 text-gray-400"
                                )}>
                                  {proc.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-xs py-2">{isZh ? '無本地程序資訊（純網路或雲端 IAM 事件）' : 'No local process telemetry (Network/Cloud IAM event)'}</div>
                      )}
                    </div>
                  </div>

                  {/* Network Telemetry Flow */}
                  {selectedIncident.networkFlows.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Network size={14} /> {isZh ? '關聯網路連線紀錄 (Network Flows)' : 'Correlated Network Flows'}
                      </div>
                      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-900/80 border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                            <tr>
                              <th className="p-3">{isZh ? '協定' : 'Protocol'}</th>
                              <th className="p-3">{isZh ? '來源位址' : 'Source'}</th>
                              <th className="p-3">{isZh ? '目標位址 / SNI' : 'Destination / SNI'}</th>
                              <th className="p-3">{isZh ? '流量大小' : 'Volume'}</th>
                              <th className="p-3">{isZh ? '處置狀態' : 'Action'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 font-mono">
                            {selectedIncident.networkFlows.map((flow: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-800/30">
                                <td className="p-3 text-blue-400 font-bold">{flow.proto}</td>
                                <td className="p-3 text-gray-300">{flow.src}</td>
                                <td className="p-3 text-gray-300">
                                  <div>{flow.dst}</div>
                                  <div className="text-[10px] text-gray-500">{flow.sni}</div>
                                </td>
                                <td className="p-3 text-gray-400">{flow.bytes}</td>
                                <td className="p-3">
                                  <span className="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-800 px-2 py-0.5 rounded">
                                    {flow.state}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#111116] border border-gray-800 rounded-2xl p-12 text-center space-y-3">
                  <SearchCode size={40} className="text-gray-600 mx-auto" />
                  <h4 className="text-base font-bold text-white">{isZh ? '請選擇左側事件查看 Kill-Chain 溯源圖' : 'Select an incident to view Kill-Chain details'}</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    {isZh ? '系統已自動關聯端點程序、網路流向與雲端審計日誌，點擊可展開多維度調查。' : 'Unified cross-telemetry is pre-correlated across endpoint processes, network sessions, and cloud audit logs.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ENDPOINT FLEET & LIVE EDR RESPONSE */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Monitor size={20} className="text-blue-400" />
                  {isZh ? '端點 EDR 艦隊即時遙測與現場處置' : 'Endpoint EDR Fleet & Live Response'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isZh 
                    ? '支援 Windows 驅動級隔離、Linux eBPF 內核探針、macOS EndpointSecurity 與容器 DaemonSet 即時控制。' 
                    : 'Manage kernel-level isolation, eBPF telemetry, and live interactive forensics across hybrid environments.'
                  }
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveToast({ type: 'success', text: isZh ? '已向全部 1,480 台端點下發最新 IOC 特徵庫 (v2026.08.20)' : 'Pushed latest IOC threat bundle to 1,480 endpoints' });
                    setTimeout(() => setActiveToast(null), 3000);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/30"
                >
                  <Download size={14} />
                  {isZh ? '下發最新 IOC 特徵庫' : 'Push IOC Rules'}
                </button>
              </div>
            </div>

            {/* Endpoints Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/70 border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="p-4">{isZh ? '主機名稱 / IP' : 'Hostname / IP'}</th>
                    <th className="p-4">{isZh ? '作業系統 & EDR 探針' : 'OS & Agent'}</th>
                    <th className="p-4">{isZh ? '部門群組 / 使用者' : 'Dept / User'}</th>
                    <th className="p-4">{isZh ? '資源負載' : 'CPU / RAM'}</th>
                    <th className="p-4">{isZh ? '風險狀態' : 'Risk & State'}</th>
                    <th className="p-4 text-right">{isZh ? '即時處置動作' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 font-sans">
                  {endpoints.map((ep) => (
                    <tr key={ep.id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Laptop size={14} className={ep.isolated ? "text-red-400" : "text-gray-400"} />
                          {ep.hostname}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{ep.ip}</div>
                      </td>

                      <td className="p-4">
                        <div className="text-gray-300 font-medium">{ep.os}</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">{ep.agentVer}</div>
                      </td>

                      <td className="p-4">
                        <div className="text-gray-300">{ep.group}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{ep.user}</div>
                      </td>

                      <td className="p-4 font-mono text-[11px]">
                        <div>CPU: <span className={parseInt(ep.cpu) > 70 ? "text-red-400 font-bold" : "text-gray-300"}>{ep.cpu}</span></div>
                        <div className="text-gray-500 text-[10px]">RAM: {ep.ram}</div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            ep.isolated ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" :
                            ep.status === 'Warning' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          )}>
                            {ep.isolated ? (isZh ? '網路已隔離' : 'ISOLATED') : ep.status}
                          </span>
                          <span className="font-mono text-xs font-bold text-gray-300">
                            {ep.riskScore}<span className="text-[10px] text-gray-600">/100</span>
                          </span>
                        </div>
                        {ep.threats.length > 0 && (
                          <div className="text-[10px] text-red-400 font-bold mt-1 line-clamp-1">
                            ⚠ {ep.threats[0]}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEndpointTerminal(ep)}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            title={isZh ? '開啟現場終端除錯' : 'Open Live Terminal'}
                          >
                            <Terminal size={13} />
                            {isZh ? '終端' : 'Terminal'}
                          </button>

                          <button
                            onClick={() => toggleIsolateEndpoint(ep.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1",
                              ep.isolated 
                                ? "bg-emerald-700 hover:bg-emerald-600 text-white" 
                                : "bg-red-600/90 hover:bg-red-600 text-white shadow-md shadow-red-950/40"
                            )}
                          >
                            {ep.isolated ? <Unlock size={13} /> : <Lock size={13} />}
                            {ep.isolated ? (isZh ? '解除隔離' : 'Unisolate') : (isZh ? '隔離主機' : 'Isolate')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI ATTACK GRAPH & ANOMALY DETECTION */}
      {activeTab === 'ai-correlate' && (
        <div className="space-y-6">
          <AIDetectionView />
        </div>
      )}

      {/* TAB 4: SOAR PLAYBOOKS & AUTOMATION */}
      {activeTab === 'soar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playbooks Configuration */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    {isZh ? 'SOAR 自動聯防劇本 (Playbooks)' : 'Active SOAR Playbooks'}
                  </h3>
                </div>

                <div className="space-y-3">
                  {[
                    { name: isZh ? '勒索軟體全自動緊急隔離' : 'Ransomware Auto-Containment', desc: isZh ? '偵測到 vssadmin 或大量副檔名加密時，秒級下發驅動隔離' : 'Instant host isolation upon shadow copy deletion', status: 'Enabled', count: 18 },
                    { name: isZh ? '惡意 C2 IP 防火牆動態阻斷' : 'C2 Edge Firewall IP Blacklist', desc: isZh ? '同步將 high-confidence C2 IP 寫入邊界防火牆黑名單' : 'Push C2 IPs to Fortinet/Palo Alto edge firewalls', status: 'Enabled', count: 42 },
                    { name: isZh ? '外洩憑證與雲端 IAM 自動吊銷' : 'Compromised IAM Token Revocation', desc: isZh ? '強制重設 AD 密碼並終止異常地理登入 Session' : 'Revoke AWS/Azure/AD tokens on impossible travel', status: 'Enabled', count: 9 },
                    { name: isZh ? '社交釣魚信箱全域垃圾郵件清除' : 'Phishing Mailbox Auto-Purge', desc: isZh ? '在 Exchange / Office 365 批次刪除包含同 Hash 的郵件' : 'Batch delete phishing emails across all mailboxes', status: 'Enabled', count: 12 }
                  ].map((pb, i) => (
                    <div key={i} className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{pb.name}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {pb.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{pb.desc}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-[10px] text-gray-500">
                        <span>{isZh ? `今日觸發: ${pb.count} 次` : `Triggers today: ${pb.count}`}</span>
                        <span className="text-blue-400 font-bold cursor-pointer hover:underline">{isZh ? '配置參數' : 'Configure'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Playbook Execution Live Logs */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Activity size={18} className="text-purple-400" />
                    {isZh ? 'SOAR 自主應答執行歷程審計' : 'SOAR Autonomous Execution History'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">{isZh ? '聯防引擎就緒' : 'Engine Live'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {soarExecutionLogs.map((log) => (
                    <div key={log.id} className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-purple-400 font-bold">{log.id}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-xs text-gray-400">{log.time}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{log.playbook}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {log.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-300 font-mono bg-black/40 p-3 rounded-lg border border-gray-800/80">
                        <div><span className="text-gray-500">{isZh ? '觸發條件:' : 'Trigger:'}</span> <span className="text-amber-400">{log.trigger}</span></div>
                        <div className="mt-1"><span className="text-gray-500">{isZh ? '受影響目標:' : 'Target:'}</span> {log.target}</div>
                      </div>

                      {/* Action Steps */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {log.actions.map((act: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-gray-900/80 border border-gray-800 rounded-lg flex items-center justify-between text-xs">
                            <span className="text-gray-300 font-medium">{act.name}</span>
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MITRE ATT&CK MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Target size={20} className="text-amber-400" />
                  {isZh ? 'MITRE ATT&CK 跨維度戰術熱力覆蓋矩陣 (Enterprise Matrix)' : 'MITRE ATT&CK Enterprise Matrix'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isZh 
                    ? '視覺化呈現 12 類戰術階段之攻擊檢測覆蓋度、活動告警數與歷史觸發技術分析。' 
                    : 'Tactics and techniques mapping showing detection coverage and active adversary alert density.'
                  }
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">{isZh ? '熱力圖例:' : 'Heatmap Legend:'}</span>
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px]">{isZh ? '低密度' : 'Low'}</span>
                <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded text-[10px]">{isZh ? '中密度' : 'Med'}</span>
                <span className="px-2 py-0.5 bg-amber-900/60 text-amber-300 rounded text-[10px]">{isZh ? '高密度' : 'High'}</span>
                <span className="px-2 py-0.5 bg-red-900/80 text-red-200 rounded text-[10px] font-bold">{isZh ? '極高危' : 'Critical'}</span>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {MITRE_ENTERPRISE_TACTICS.map((tactic) => {
                const isSelected = selectedTactic === tactic.id;
                return (
                  <div
                    key={tactic.id}
                    onClick={() => setSelectedTactic(isSelected ? null : tactic.id)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3",
                      isSelected 
                        ? "bg-blue-950/40 border-blue-500 shadow-md" 
                        : tactic.count > 50 
                          ? "bg-red-950/20 border-red-900/50 hover:border-red-500" 
                          : tactic.count > 30 
                            ? "bg-amber-950/20 border-amber-900/50 hover:border-amber-500" 
                            : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-base">{tactic.icon}</span>
                        <span className="text-[10px] font-mono text-gray-500">{tactic.id}</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1 leading-snug">
                        {isZh ? tactic.nameZh : tactic.name}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-800/60">
                        <span className="text-gray-500">{isZh ? '檢測技術' : 'Techniques'}</span>
                        <span className="font-mono font-bold text-blue-400">{tactic.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tactic Techniques Drilldown */}
            {selectedTactic && (
              <div className="p-5 bg-gray-900/60 border border-blue-500/40 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-blue-400 uppercase tracking-widest">
                    {isZh ? `戰術技術清單 (${selectedTactic})` : `Techniques for ${selectedTactic}`}
                  </div>
                  <button onClick={() => setSelectedTactic(null)} className="text-gray-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MITRE_ENTERPRISE_TACTICS.find(t => t.id === selectedTactic)?.techniques.map((tech, idx) => (
                    <div key={idx} className="p-3 bg-black/40 border border-gray-800 rounded-lg text-xs space-y-1">
                      <div className="font-mono text-amber-400 font-bold">{tech.split(' ')[0]}</div>
                      <div className="text-gray-200">{tech.split(' ').slice(1).join(' ')}</div>
                      <div className="text-[10px] text-gray-500 pt-1 flex justify-between">
                        <span>{isZh ? '覆蓋狀態: 監控中' : 'Monitored'}</span>
                        <span className="text-emerald-400 font-bold">100% Rule Match</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: INTERFLOW DATA LAKE & CONNECTORS */}
      {activeTab === 'interflow' && (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Database size={20} className="text-blue-400" />
                {isZh ? 'Interflow™ 標準化資料湖架構與連接器' : 'Interflow™ Normalized Data Lake Architecture'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isZh 
                  ? '將來自數十種安全工具與探針的多源異質資料，自動清洗轉換為具備完整脈絡的 Interflow™ JSON 統一紀錄。' 
                  : 'Normalizing disparate multi-vendor telemetry into enriched JSON records with contextual threat metadata.'
                }
              </p>
            </div>

            {/* Pipeline Architecture Graphic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl space-y-4">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Radio size={16} className="text-blue-400" />
                  1. {isZh ? '多源資料擷取 (Ingestion)' : 'Telemetry Ingestion'}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'EDR Agent Sensors (Windows / Linux / macOS)', status: 'Active (1,480)' },
                    { name: 'Network NDR Flow (Zeek / Suricata / IPFIX)', status: 'Active (4.85 Gbps)' },
                    { name: 'Cloud Logs (AWS CloudTrail, Azure Monitor)', status: 'Active (12k EPS)' },
                    { name: 'Identity & Auth (Okta, Active Directory, Ping)', status: 'Active (18k EPS)' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-black/40 border border-gray-800 rounded-lg text-xs flex justify-between items-center">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-blue-950/20 border border-blue-500/40 rounded-xl space-y-4">
                <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={16} />
                  2. {isZh ? 'Interflow™ 脈絡擴增引擎' : 'Contextual Enrichment'}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'GeoIP & Autonomous System (ASN)', tag: 'Enriched' },
                    { name: 'Threat Intelligence (CTI Feeds / VirusTotal)', tag: 'Enriched' },
                    { name: 'MITRE ATT&CK TTP Dynamic Tagging', tag: 'Mapped' },
                    { name: 'Asset Criticality & User Risk Scoring', tag: 'Calculated' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg text-xs flex justify-between items-center">
                      <span className="text-gray-200">{item.name}</span>
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded">{item.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl space-y-4">
                <div className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                  <HardDrive size={16} />
                  3. {isZh ? '高效能資安資料湖 (Storage)' : 'Data Lake & ML Training'}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Hot Tier (ClickHouse & Memory Cache)', size: '2.4 TB (7 Days)' },
                    { name: 'Warm Tier (Elasticsearch Cluster)', size: '18.8 TB (90 Days)' },
                    { name: 'Cold Tier (S3 Glacier Compliant Archive)', size: '142 TB (1 Year)' },
                    { name: 'AI Feature Store (Graph Neural Model)', size: 'Live Matrix' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-black/40 border border-gray-800 rounded-lg text-xs flex justify-between items-center">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-[10px] font-mono font-bold text-purple-400">{item.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE FORENSIC TERMINAL MODAL */}
      <AnimatePresence>
        {terminalOpen && selectedEndpoint && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c0e] border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
            >
              {/* Terminal Title Bar */}
              <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer" onClick={() => setTerminalOpen(false)} />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="text-xs font-mono text-gray-300 font-bold flex items-center gap-2">
                    <Terminal size={14} className="text-emerald-400" />
                    <span>root@{selectedEndpoint.hostname}:~#</span>
                    <span className="text-gray-500">({selectedEndpoint.ip})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                    TLS 1.3 SECURE SHELL
                  </span>
                  <button
                    onClick={() => setTerminalOpen(false)}
                    className="p-1 text-gray-400 hover:text-white rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Terminal Content Screen */}
              <div className="flex-1 p-5 bg-black font-mono text-xs text-emerald-400/90 overflow-y-auto space-y-2 select-text custom-scrollbar">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">{log}</div>
                ))}
                {isCommandRunning && (
                  <div className="text-amber-400 animate-pulse">{isZh ? '執行指令中...' : 'Executing command on remote agent...'}</div>
                )}
              </div>

              {/* Terminal Input */}
              <form onSubmit={handleTerminalSubmit} className="p-3 bg-gray-900 border-t border-gray-800 flex items-center gap-2">
                <span className="font-mono text-xs text-emerald-400 font-bold pl-2">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder={isZh ? '輸入指令（例如：ps, netstat, kill -9 9144, isolate, dump-memory）...' : 'Type forensic command (e.g. ps, netstat, kill -9 <PID>, dump-memory)...'}
                  className="flex-1 bg-transparent border-none text-xs text-white font-mono focus:outline-none placeholder-gray-600"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1"
                >
                  <Send size={12} />
                  {isZh ? '發送' : 'Send'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

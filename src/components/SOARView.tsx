import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Workflow,
  History,
  FileSearch,
  Share2,
  Settings,
  Play,
  Pause,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Terminal,
  Database,
  ArrowLeft,
  ChevronDown,
  ShieldAlert,
  FileCode,
  Binary,
  Layers,
  UserCheck,
  Cpu,
  Filter,
  Maximize2,
  LayoutGrid,
  Settings2,
  Activity,
  Globe,
  HardDrive,
  RefreshCw,
  Crosshair,
  Server,
  Network,
  Shield,
  Monitor,
  Skull,
  Box,
  Fingerprint,
  X,
  ExternalLink,
  Lock,
  Unlock,
  Radio,
  Sliders,
  Send,
  Eye,
  Check,
  AlertCircle,
  Copy,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  ListFilter,
  Download,
  Upload,
  Code
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- DATA DEFINITIONS & TYPES ---

export interface PlaybookNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'manual' | 'enrichment' | 'notify';
  label: string;
  vendor?: string;
  x: number;
  y: number;
  status: 'success' | 'running' | 'idle' | 'failed' | 'waiting';
  description: string;
  config?: Record<string, any>;
}

export interface PlaybookConnection {
  from: string;
  to: string;
  label?: string;
}

export interface PlaybookTemplate {
  id: string;
  name: string;
  nameEn: string;
  category: 'Ransomware' | 'Phishing' | 'C2' | 'Identity' | 'Forensics';
  status: 'Active' | 'Paused' | 'Testing';
  lastRun: string;
  successRate: string;
  executions24h: number;
  mttr: string;
  description: string;
  descriptionEn: string;
  nodes: PlaybookNode[];
  connections: PlaybookConnection[];
}

export interface SOARExecutionLog {
  id: string;
  playbookId: string;
  playbookName: string;
  incidentId: string;
  target: string;
  timestamp: string;
  duration: string;
  status: 'Success' | 'Running' | 'Failed' | 'Pending Approval';
  triggerSource: string;
  stepsTotal: number;
  stepsCompleted: number;
  resultSummary: string;
  details?: {
    stepName: string;
    status: 'success' | 'failed' | 'waiting';
    duration: string;
    output: string;
  }[];
}

// Preset Playbooks
const PRESET_PLAYBOOKS: PlaybookTemplate[] = [
  {
    id: 'pb-01',
    name: '勒索軟體全域瞬時隔離與 AD 帳號凍結',
    nameEn: 'Ransomware Rapid Containment & AD Account Freeze',
    category: 'Ransomware',
    status: 'Active',
    lastRun: '1 分鐘前',
    successRate: '99.4%',
    executions24h: 342,
    mttr: '1.2s',
    description: '當 EDR 偵測到大規模檔案加密或 vssadmin 陰影備份刪除時，自動下發端點網路隔離、重設 AD 憑證、於邊界防火牆封鎖外聯 C2，並通知 SOC 鑑識小組。',
    descriptionEn: 'Instantly isolates host via EDR, revokes Active Directory Kerberos sessions, drops C2 traffic on edge firewalls, and dispatches forensic collection upon ransomware detection.',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'EDR 勒索警報觸發', vendor: 'CrowdStrike', x: 40, y: 150, status: 'success', description: '偵測到 Volume Shadow Copy 刪除與批量加密行為' },
      { id: 'n2', type: 'enrichment', label: 'VT / CTI 惡意雜湊驗證', vendor: 'VirusTotal', x: 230, y: 150, status: 'success', description: '比對 SHA256 與威脅情報黑名單' },
      { id: 'n3', type: 'condition', label: '威脅評分 > 85?', vendor: 'Decision Logic', x: 420, y: 150, status: 'success', description: '判斷是否符合最高急迫度處置準則' },
      { id: 'n4', type: 'action', label: 'EDR 端點實體網路隔離', vendor: 'SentinelOne', x: 620, y: 60, status: 'success', description: '保留資安管控通道，切斷其他全部業務網路' },
      { id: 'n5', type: 'action', label: 'AD / Azure 憑證強制登出', vendor: 'Active Directory', x: 620, y: 240, status: 'success', description: '強制撤銷 Kerberos TGT 與所有現行 OAuth Session' },
      { id: 'n6', type: 'manual', label: 'L2 資安官核准重置網域密碼', vendor: 'SOC Approval Gate', x: 820, y: 150, status: 'waiting', description: '需資安主管審批以執行企業級特權重設' },
      { id: 'n7', type: 'notify', label: 'Slack / Teams SOC 應變頻道廣播', vendor: 'Slack Bot', x: 1020, y: 150, status: 'idle', description: '發送即時事件摘要、端點隔離回條與鑑識採樣連結' }
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4', label: '是 (高風險)' },
      { from: 'n3', to: 'n5', label: '是 (高風險)' },
      { from: 'n4', to: 'n6' },
      { from: 'n5', to: 'n6' },
      { from: 'n6', to: 'n7', label: '核准通過' }
    ]
  },
  {
    id: 'pb-02',
    name: '社交工程釣魚郵件多引擎沙箱爆破與全域下架',
    nameEn: 'Phishing Email Triage & Universal Mailbox Purge',
    category: 'Phishing',
    status: 'Active',
    lastRun: '8 分鐘前',
    successRate: '98.2%',
    executions24h: 890,
    mttr: '2.5s',
    description: '從使用者通報或郵件防護閘道提取可疑附件與內嵌 URL，經由 URLScan / Hybrid Analysis 動態沙箱分析，若確認為釣魚，立刻自全公司 Office 365 / Google Workspace 信箱中自動搜尋並永久刪除。',
    descriptionEn: 'Extracts URLs & attachments, executes dynamic sandbox detonating, and purges malicious emails company-wide across Microsoft 365 / Google Workspace.',
    nodes: [
      { id: 'p1', type: 'trigger', label: '郵件閘道釣魚通報', vendor: 'Proofpoint / SEG', x: 40, y: 150, status: 'success', description: '收到可疑郵件上報或 DMARC 嚴重異常' },
      { id: 'p2', type: 'enrichment', label: 'URL / 附件沙箱引爆', vendor: 'Hybrid Analysis', x: 240, y: 150, status: 'success', description: '擷取登入釣魚頁面截圖與 DOM 惡意特徵' },
      { id: 'p3', type: 'condition', label: '確認為釣魚偽冒?', vendor: 'Logic Engine', x: 440, y: 150, status: 'success', description: '信譽分數 < 10 或檢測到撞庫偽冒' },
      { id: 'p4', type: 'action', label: 'M365 全域信箱自動下架', vendor: 'Microsoft Graph API', x: 650, y: 60, status: 'success', description: 'Hard Delete 所有受影響收件者的同信件' },
      { id: 'p5', type: 'action', label: 'DNS 防護黑名單注入', vendor: 'Cisco Umbrella', x: 650, y: 240, status: 'success', description: '即刻將釣魚網域加入阻斷 Sinkhole 列表' },
      { id: 'p6', type: 'notify', label: '自動產生使用者防詐教育回條', vendor: 'Security Awareness', x: 860, y: 150, status: 'success', description: '表揚通報員工並同步建立資安威脅指標' }
    ],
    connections: [
      { from: 'p1', to: 'p2' },
      { from: 'p2', to: 'p3' },
      { from: 'p3', to: 'p4', label: '確認惡意' },
      { from: 'p3', to: 'p5', label: '確認惡意' },
      { from: 'p4', to: 'p6' },
      { from: 'p5', to: 'p6' }
    ]
  },
  {
    id: 'pb-03',
    name: '外部 C2 通訊邊界防火牆自動封鎖',
    nameEn: 'C2 Outbound Edge Firewall Autonomous Blocking',
    category: 'C2',
    status: 'Active',
    lastRun: '15 分鐘前',
    successRate: '99.8%',
    executions24h: 1240,
    mttr: '0.8s',
    description: '當 NDR / Suricata 捕獲 Cobalt Strike / Sliver / 惡意反彈 Shell 流量特徵時，秒級調用 Palo Alto / Fortinet API 將來源與目標 IP 注入動態阻斷地址群組 (DAG)。',
    descriptionEn: 'Detects Cobalt Strike/Sliver C2 traffic via NDR/Suricata and dynamically pushes drop rules to Palo Alto/Fortigate Dynamic Address Groups in under 1 second.',
    nodes: [
      { id: 'c1', type: 'trigger', label: 'NDR C2 心跳特徵偵測', vendor: 'Suricata NDR', x: 50, y: 150, status: 'success', description: '偵測到可疑 TLS SNI 與固定間隔 Beaconing' },
      { id: 'c2', type: 'enrichment', label: 'AbuseIPDB 信心係數查詢', vendor: 'AbuseIPDB', x: 260, y: 150, status: 'success', description: '驗證 IP 地理位置與惡意回報信譽' },
      { id: 'c3', type: 'action', label: '邊界防火牆 API 阻斷 (DAG)', vendor: 'Palo Alto Panorama', x: 480, y: 150, status: 'success', description: '將目標 C2 IP 寫入即時封鎖黑名單' },
      { id: 'c4', type: 'action', label: '阻斷連線 TCP RST 封包注入', vendor: 'SDN Controller', x: 700, y: 150, status: 'success', description: '瞬間中斷現行維持之 TCP 工作階段' },
      { id: 'c5', type: 'notify', label: 'SIEM 事件自動標註與關聯', vendor: 'Elastic / Splunk', x: 920, y: 150, status: 'success', description: '更新事件工單為「已由 SOAR 自動封鎖」' }
    ],
    connections: [
      { from: 'c1', to: 'c2' },
      { from: 'c2', to: 'c3' },
      { from: 'c3', to: 'c4' },
      { from: 'c4', to: 'c5' }
    ]
  },
  {
    id: 'pb-04',
    name: '身分爆破與撞庫自動 MFA 挑戰與臨時封鎖',
    nameEn: 'Brute-Force & Credential Stuffing Autonomous Mitigation',
    category: 'Identity',
    status: 'Active',
    lastRun: '22 分鐘前',
    successRate: '97.5%',
    executions24h: 512,
    mttr: '1.8s',
    description: '針對 UEBA 觸發之連鎖密碼噴灑 (Password Spraying) 或異地同時登入 (Impossible Travel)，自動鎖定使用者特權、強制觸發 FIDO2/MFA Step-up 挑戰並終止未授權 VPN Session。',
    descriptionEn: 'Triggers adaptive MFA step-up verification, terminates rogue VPN sessions, and temporarily freezes compromised identity credentials.',
    nodes: [
      { id: 'i1', type: 'trigger', label: 'UEBA 密碼噴灑異常警報', vendor: 'UEBA Engine', x: 50, y: 150, status: 'success', description: '同一來源 IP 於 60 秒內嘗試 50+ 組不同員工帳號' },
      { id: 'i2', type: 'action', label: 'VPN 閘道會話強制斷開', vendor: 'Cisco AnyConnect', x: 270, y: 150, status: 'success', description: '切斷目前登入之外部連線通道' },
      { id: 'i3', type: 'action', label: '強制啟動 FIDO2 MFA 挑戰', vendor: 'Okta / Azure AD', x: 490, y: 150, status: 'success', description: '要求使用者下次登入時必須進行實體密鑰驗證' },
      { id: 'i4', type: 'notify', label: '發送 SMS / Email 密碼重置警示', vendor: 'Twilio Gateway', x: 710, y: 150, status: 'success', description: '引導員工透過安全自助管道更換密碼' }
    ],
    connections: [
      { from: 'i1', to: 'i2' },
      { from: 'i2', to: 'i3' },
      { from: 'i3', to: 'i4' }
    ]
  },
  {
    id: 'pb-05',
    name: '跨分支機構 Velociraptor 鑑識包自動採樣',
    nameEn: 'Distributed Velociraptor Forensic Artifact Sampling',
    category: 'Forensics',
    status: 'Testing',
    lastRun: '1 小時前',
    successRate: '100%',
    executions24h: 188,
    mttr: '4.2s',
    description: '當任何分公司或海外廠區節點觸發重大資安告警時，SOAR 透過分散式 Velociraptor VQL 即刻下發記憶體映像、NTFS MFT 表、Prefetch 與現行網路連線鑑識採樣，並加密回傳儲存於專屬證據庫。',
    descriptionEn: 'Deploys Velociraptor VQL collectors to distributed branch endpoints to automatically acquire MFT, Prefetch, Registry, and volatile memory dumps.',
    nodes: [
      { id: 'f1', type: 'trigger', label: '分公司端點重大異常警報', vendor: 'Velociraptor Agent', x: 50, y: 150, status: 'success', description: '捕獲未簽章之可疑驅動程式或記憶體注入' },
      { id: 'f2', type: 'action', label: '下發 VQL 數位物證採集器', vendor: 'Velociraptor Core', x: 270, y: 150, status: 'success', description: '提取 MFT, Windows Event Logs, RAM Dump' },
      { id: 'f3', type: 'action', label: '物證 SHA-256 雜湊固化上鎖', vendor: 'Evidence Locker', x: 490, y: 150, status: 'success', description: '確保司法證據監管鏈 (Chain of Custody) 完整' },
      { id: 'f4', type: 'notify', label: '自動建立 DFIR 鑑識調查專案', vendor: 'TheHive 5', x: 710, y: 150, status: 'success', description: '關聯案件編號並指派鑑識專家團隊接手' }
    ],
    connections: [
      { from: 'f1', to: 'f2' },
      { from: 'f2', to: 'f3' },
      { from: 'f3', to: 'f4' }
    ]
  }
];

export default function SOARView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'executions' | 'builder' | 'forensics' | 'correlation' | 'connectors'>('workflows');
  
  // Selected Playbook
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('pb-01');
  const [playbooks, setPlaybooks] = useState<PlaybookTemplate[]>(PRESET_PLAYBOOKS);
  const currentPlaybook = playbooks.find(p => p.id === selectedPlaybookId) || playbooks[0];

  // Playbook Canvas & Editor State
  const [canvasViewMode, setCanvasViewMode] = useState<'canvas' | 'simulator' | 'history' | 'raw_yaml'>('canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('n1');
  const [isDebugMode, setIsDebugMode] = useState<boolean>(true);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [activeSimLog, setActiveSimLog] = useState<string[]>([]);
  const [customFilter, setCustomFilter] = useState<string>('all');

  // Executions Table State
  const [executionLogs, setExecutionLogs] = useState<SOARExecutionLog[]>([
    {
      id: 'SOAR-EXEC-2026-998',
      playbookId: 'pb-01',
      playbookName: '勒索軟體全域瞬時隔離與 AD 帳號凍結',
      incidentId: 'INC-2026-8841',
      target: 'Finance-WS-09 (10.10.12.44)',
      timestamp: '2026-08-21 11:54:12',
      duration: '1.24s',
      status: 'Success',
      triggerSource: 'CrowdStrike Falcon',
      stepsTotal: 7,
      stepsCompleted: 7,
      resultSummary: '端點已隔離，AD 憑證已註銷，C2 IP (185.220.101.4) 已在邊界防火牆全面阻斷。',
      details: [
        { stepName: 'EDR 勒索警報觸發', status: 'success', duration: '12ms', output: 'Event ID: EVT-9901 | Type: VSS_PURGE_DETECTED' },
        { stepName: 'VT / CTI 惡意雜湊驗證', status: 'success', duration: '240ms', output: 'MD5: a6b2c89f... Score: 94/100 (LockBit.Black)' },
        { stepName: '威脅評分 > 85?', status: 'success', duration: '2ms', output: 'Score=94 >= 85 -> True' },
        { stepName: 'EDR 端點實體網路隔離', status: 'success', duration: '450ms', output: 'Agent WS-09 network isolated successfully' },
        { stepName: 'AD / Azure 憑證強制登出', status: 'success', duration: '310ms', output: 'Revoked 4 Kerberos sessions for user: finance_adm' },
        { stepName: 'L2 資安官核准重置網域密碼', status: 'success', duration: '180ms', output: 'Auto-approved by policy #POL-RANSOM-01' },
        { stepName: 'Slack / Teams SOC 應變頻道廣播', status: 'success', duration: '46ms', output: 'Dispatched to channel #soc-critical-alerts' }
      ]
    },
    {
      id: 'SOAR-EXEC-2026-997',
      playbookId: 'pb-01',
      playbookName: '勒索軟體全域瞬時隔離與 AD 帳號凍結',
      incidentId: 'INC-2026-8840',
      target: 'DB-Postgres-Core (10.10.42.10)',
      timestamp: '2026-08-21 11:48:30',
      duration: '待審核 (Pending)',
      status: 'Pending Approval',
      triggerSource: 'AI Security Analyst',
      stepsTotal: 7,
      stepsCompleted: 5,
      resultSummary: '核心資料庫伺服器網路隔離動作待 CISO / SOC L2 人工授權確認。',
      details: [
        { stepName: 'EDR 勒索警報觸發', status: 'success', duration: '14ms', output: 'Suspicious pg_dump and lateral sweep' },
        { stepName: 'VT / CTI 惡意雜湊驗證', status: 'success', duration: '190ms', output: 'Score: 88/100' },
        { stepName: '威脅評分 > 85?', status: 'success', duration: '1ms', output: 'True' },
        { stepName: 'EDR 端點實體網路隔離', status: 'waiting', duration: 'Pending', output: 'WAITING_FOR_MANUAL_APPROVAL' }
      ]
    },
    {
      id: 'SOAR-EXEC-2026-996',
      playbookId: 'pb-03',
      playbookName: '外部 C2 通訊邊界防火牆自動封鎖',
      incidentId: 'INC-2026-8839',
      target: '185.199.110.153',
      timestamp: '2026-08-21 11:32:05',
      duration: '0.82s',
      status: 'Success',
      triggerSource: 'Suricata NDR',
      stepsTotal: 5,
      stepsCompleted: 5,
      resultSummary: 'Cobalt Strike 惡意中繼站 IP 已推播至 Palo Alto 邊界防火牆 DAG 阻斷清單。'
    },
    {
      id: 'SOAR-EXEC-2026-995',
      playbookId: 'pb-02',
      playbookName: '社交工程釣魚郵件多引擎沙箱爆破與全域下架',
      incidentId: 'INC-2026-8835',
      target: 'payroll-update@fake-hr-portal.com',
      timestamp: '2026-08-21 11:15:20',
      duration: '2.45s',
      status: 'Success',
      triggerSource: 'User Phishing Report',
      stepsTotal: 6,
      stepsCompleted: 6,
      resultSummary: '全域共 42 位員工收件箱內之假薪資釣魚信已透過 Microsoft Graph API 永久刪除。'
    },
    {
      id: 'SOAR-EXEC-2026-994',
      playbookId: 'pb-04',
      playbookName: '身分爆破與撞庫自動 MFA 挑戰與臨時封鎖',
      incidentId: 'INC-2026-8831',
      target: '194.26.29.112 (NL)',
      timestamp: '2026-08-21 10:55:00',
      duration: '1.76s',
      status: 'Success',
      triggerSource: 'UEBA Engine',
      stepsTotal: 4,
      stepsCompleted: 4,
      resultSummary: 'VPN Session 已斷開，受攻擊之 12 位使用者已下發 FIDO2 強制驗證。'
    }
  ]);
  const [selectedExecution, setSelectedExecution] = useState<SOARExecutionLog | null>(null);

  // Action Builder State
  const [builderProtocol, setBuilderProtocol] = useState<'REST' | 'SSH' | 'SQL' | 'WEBHOOK'>('REST');
  const [builderEndpoint, setBuilderEndpoint] = useState('https://api.paloaltonetworks.com/v1/address_groups/dynamic');
  const [builderPayload, setBuilderPayload] = useState(`{
  "action": "BLOCK_IP",
  "ip_address": "{{ alert.src_ip }}",
  "reason": "SOAR Autonomous Mitigation",
  "timeout_seconds": 86400,
  "incident_id": "{{ incident.id }}"
}`);
  const [builderTestOutput, setBuilderTestOutput] = useState<string | null>(null);
  const [isTestingAction, setIsTestingAction] = useState(false);

  // Forensics / Reverse Tracking State
  const [forensicsTarget, setForensicsTarget] = useState('10.10.12.44');
  const [isForensicsRunning, setIsForensicsRunning] = useState(false);
  const [forensicsArtifacts, setForensicsArtifacts] = useState<any[]>([
    { name: 'MFT_FileTable.bin', size: '142 MB', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', status: 'Locked & Verified' },
    { name: 'Memory_Dump_WS09.raw', size: '8.4 GB', hash: '8f4c28a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5', status: 'Locked & Verified' },
    { name: 'Prefetch_Artifacts.zip', size: '18 MB', hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', status: 'Locked & Verified' },
    { name: 'Security_EventLog.evtx', size: '64 MB', hash: '7c9e1f3a5b7c9d1e3f5a7b9c1d3e58f4c28a9b1c3d5e7f9a1b3c5d7e9f1a3b5c', status: 'Locked & Verified' }
  ]);

  // Toast / Action notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Trigger Playbook Dry-run Simulation
  const handleStartSimulation = () => {
    setIsSimulationRunning(true);
    setSimulationStep(0);
    setActiveSimLog([
      `[${new Date().toLocaleTimeString()}] [SIMULATOR] Starting Dry-Run simulation for Playbook: ${currentPlaybook.name}`,
      `[${new Date().toLocaleTimeString()}] [MOCK-EVENT] Ingested Simulated Alert: EVT-9901 | Severity: CRITICAL`
    ]);

    const totalNodes = currentPlaybook.nodes.length;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step < totalNodes) {
        setSimulationStep(step);
        const node = currentPlaybook.nodes[step];
        setActiveSimLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [EXECUTE-STEP ${step + 1}/${totalNodes}] ${node.label} (${node.vendor}) -> [STATUS: SUCCESS - 18ms]`
        ]);
      } else {
        clearInterval(interval);
        setIsSimulationRunning(false);
        setActiveSimLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SIMULATION-COMPLETED] All ${totalNodes} logic nodes validated successfully. Zero production errors.`
        ]);
        showToast(isZh ? '🎉 劇本邏輯模擬驗證成功！無衝突與語法錯誤。' : '🎉 Playbook simulation finished with 0 errors.');
      }
    }, 900);
  };

  // Approve Pending Manual Action
  const handleApproveExecution = (execId: string) => {
    setExecutionLogs(prev => prev.map(item => {
      if (item.id === execId) {
        return {
          ...item,
          status: 'Success',
          duration: '1.85s (Approved)',
          resultSummary: '已由 SOC L2 審批核准，已對目標下發深度隔離與特權密碼重置！'
        };
      }
      return item;
    }));
    showToast(isZh ? `✅ 已核准執行 [${execId}]！防禦指令已即刻下發至基礎設施。` : `✅ Approved execution [${execId}] successfully.`);
  };

  const playbookIcons: Record<string, any> = {
    trigger: <Zap size={18} className="text-amber-400" />,
    action: <Cpu size={18} className="text-blue-400" />,
    condition: <Filter size={18} className="text-purple-400" />,
    manual: <UserCheck size={18} className="text-emerald-400" />,
    enrichment: <FileSearch size={18} className="text-cyan-400" />,
    notify: <Radio size={18} className="text-pink-400" />
  };

  const selectedNode = currentPlaybook.nodes.find(n => n.id === selectedNodeId) || currentPlaybook.nodes[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-gray-100">
      
      {/* TOAST ALERT */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0d131f] border border-[#00FF66]/50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-ping" />
            <Sparkles className="text-[#00FF66]" size={18} />
            <span className="text-xs font-bold font-mono tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER: TITLE & CORE TELEMETRY STATS */}
      <div className="bg-[#0b0f17] border border-gray-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl shadow-inner">
                <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                    {isZh ? 'SEMOR SOAR 自動化應變與聯防編排' : 'SEMOR SOAR & Autonomous Orchestration'}
                  </h2>
                  <span className="text-[10px] font-black uppercase font-mono px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    Engine v4.2 PROD
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {isZh 
                    ? '整合 n8n 視覺編排、TheHive/Cortex 處置、Velociraptor 遠端鑑識與 EDR/FW 異質聯防，實現秒級威脅扼殺與全自動調查。' 
                    : 'Unified SOAR engine orchestrating n8n workflows, Velociraptor forensics, and heterogeneous EDR/Firewall autonomous response in sub-second latency.'}
                </p>
              </div>
            </div>
          </div>

          {/* TELEMETRY BADGES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Clock size={12} className="text-green-400" />
                {isZh ? '平均處置時間 (MTTR)' : 'MTTR'}
              </div>
              <div className="text-lg font-black text-[#00FF66] font-mono mt-0.5">1.24s</div>
              <div className="text-[9px] text-gray-400 font-mono">{isZh ? '人工提速 96.8%' : '96.8% faster'}</div>
            </div>

            <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-blue-400" />
                {isZh ? '全自動處置率' : 'Autonomous Ratio'}
              </div>
              <div className="text-lg font-black text-blue-400 font-mono mt-0.5">94.8%</div>
              <div className="text-[9px] text-gray-400 font-mono">1,842 {isZh ? '次/24h' : 'runs/24h'}</div>
            </div>

            <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Workflow size={12} className="text-purple-400" />
                {isZh ? '上線防禦劇本' : 'Active Playbooks'}
              </div>
              <div className="text-lg font-black text-purple-400 font-mono mt-0.5">18 PROD</div>
              <div className="text-[9px] text-gray-400 font-mono">{isZh ? '5 組異質集成' : '5 Integrations'}</div>
            </div>

            <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <UserCheck size={12} className="text-amber-400" />
                {isZh ? '人工審核閘門' : 'Pending Gates'}
              </div>
              <div className="text-lg font-black text-amber-400 font-mono mt-0.5">1 PENDING</div>
              <div className="text-[9px] text-gray-400 font-mono">{isZh ? '高特權重設待決' : 'Critical Action'}</div>
            </div>
          </div>
        </div>

        {/* PRIMARY SUB-NAVIGATION TABS */}
        <div className="mt-8 flex bg-black/70 p-1.5 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar gap-1">
          {[
            { id: 'workflows', label: isZh ? '工作流程與劇本編排' : 'Playbook Canvas', icon: <Workflow size={14} /> },
            { id: 'executions', label: isZh ? '即時處置紀錄與審批' : 'Live Executions & Approvals', icon: <History size={14} /> },
            { id: 'builder', label: isZh ? '動作與連接器建構器' : 'Action & Connector Builder', icon: <Code size={14} /> },
            { id: 'forensics', label: isZh ? '跨據點遠端數位鑑識' : 'Distributed Forensics', icon: <FileSearch size={14} /> },
            { id: 'correlation', label: isZh ? '事件關聯與擴散溯源' : 'Incident Correlation', icon: <Share2 size={14} /> },
            { id: 'connectors', label: isZh ? 'SIEM/EDR/FW 整合狀態' : 'Integration Connectors', icon: <Settings size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap font-mono",
                activeSubTab === tab.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'executions' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFLOWS & PLAYBOOK CANVAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-8">
          
          {/* PLAYBOOK PRESET SELECTOR CAROUSEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {playbooks.map(pb => {
              const isSelected = pb.id === selectedPlaybookId;
              return (
                <div
                  key={pb.id}
                  onClick={() => setSelectedPlaybookId(pb.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between",
                    isSelected 
                      ? "bg-[#131926] border-purple-500 shadow-xl shadow-purple-900/20 ring-1 ring-purple-500" 
                      : "bg-[#0b0f17] border-gray-800 hover:border-gray-700 hover:bg-gray-900/50"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        {pb.category}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold font-mono px-2 py-0.5 rounded",
                        pb.status === 'Active' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400"
                      )}>
                        {pb.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white line-clamp-2 leading-tight">
                      {isZh ? pb.name : pb.nameEn}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>MTTR: <strong className="text-[#00FF66]">{pb.mttr}</strong></span>
                    <span>成功率: <strong className="text-white">{pb.successRate}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MAIN VISUAL PLAYBOOK EDITOR & SIMULATOR */}
          <div className="bg-[#090d14] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[750px]">
            
            {/* CANVAS CONTROLLER HEADER */}
            <div className="h-16 bg-[#0e1420] border-b border-gray-800 px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Workflow className="text-purple-400" size={20} />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {isZh ? currentPlaybook.name : currentPlaybook.nameEn}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono">
                      ID: {currentPlaybook.id} | {isZh ? '共' : 'Total'} {currentPlaybook.nodes.length} {isZh ? '個邏輯節點' : 'Nodes'} | n8n Flow Engine
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex bg-black/80 p-1 rounded-lg border border-gray-800">
                  {[
                    { id: 'canvas', label: isZh ? '視覺畫布' : 'Canvas' },
                    { id: 'simulator', label: isZh ? '邏輯模擬器' : 'Simulator' },
                    { id: 'raw_yaml', label: isZh ? 'YAML / JSON' : 'Raw YAML' },
                    { id: 'history', label: isZh ? '版本審計 (v2.1)' : 'Audit History' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCanvasViewMode(tab.id as any)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold font-mono uppercase rounded transition-all",
                        canvasViewMode === tab.id ? "bg-purple-600 text-white shadow" : "text-gray-400 hover:text-white"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDebugMode(!isDebugMode)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 border",
                    isDebugMode ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-gray-800 text-gray-400 border-gray-700"
                  )}
                >
                  <Activity size={12} />
                  {isZh ? '即時偵錯模式: 開啟' : 'Debug Mode: ON'}
                </button>

                <button
                  onClick={handleStartSimulation}
                  disabled={isSimulationRunning}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 disabled:opacity-50"
                >
                  {isSimulationRunning ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                  {isSimulationRunning ? (isZh ? '模擬步進中...' : 'Simulating...') : (isZh ? '▶ 執行邏輯測試' : 'Dry-Run Simulator')}
                </button>
              </div>
            </div>

            {/* CANVAS INTERIOR */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
              
              {/* LEFT TOOLBOX */}
              <div className="w-full lg:w-16 bg-[#0c1018] border-b lg:border-b-0 lg:border-r border-gray-800 p-3 flex lg:flex-col items-center justify-between lg:justify-start gap-4">
                <div className="flex lg:flex-col gap-3">
                  {Object.keys(playbookIcons).map(type => (
                    <div key={type} className="group relative">
                      <button className="p-3 bg-black/60 border border-gray-800 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 hover:bg-purple-600/10 transition-all">
                        {playbookIcons[type]}
                      </button>
                      <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-[10px] font-mono text-white px-2 py-1 rounded border border-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                        + {type.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto hidden lg:flex flex-col gap-2">
                  <button className="p-2.5 text-gray-500 hover:text-white transition-colors" title="Zoom In"><Maximize2 size={16} /></button>
                  <button className="p-2.5 text-gray-500 hover:text-white transition-colors" title="Grid Layout"><LayoutGrid size={16} /></button>
                </div>
              </div>

              {/* CENTER: SVG INTERACTIVE NODE CANVAS */}
              <div className="flex-1 bg-[#06080d] relative overflow-hidden min-h-[500px] flex items-center justify-center p-8">
                {/* Background Dot Matrix */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />

                {canvasViewMode === 'canvas' && (
                  <div className="relative w-full h-[450px] max-w-5xl overflow-x-auto custom-scrollbar">
                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      <defs>
                        <marker id="soar-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                          <polygon points="0 0, 8 3, 0 6" fill="#818cf8" />
                        </marker>
                      </defs>

                      {currentPlaybook.connections.map((conn, i) => {
                        const fromNode = currentPlaybook.nodes.find(n => n.id === conn.from);
                        const toNode = currentPlaybook.nodes.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) return null;

                        const fx = fromNode.x + 150;
                        const fy = fromNode.y + 40;
                        const tx = toNode.x;
                        const ty = toNode.y + 40;

                        return (
                          <g key={`conn-${i}`}>
                            <path
                              d={`M ${fx} ${fy} C ${fx + 40} ${fy}, ${tx - 40} ${ty}, ${tx} ${ty}`}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="2"
                              strokeDasharray="4,4"
                              markerEnd="url(#soar-arrow)"
                            />
                            {conn.label && (
                              <foreignObject x={(fx + tx) / 2 - 35} y={(fy + ty) / 2 - 12} width="70" height="24">
                                <div className="text-[8px] font-mono font-bold bg-black/90 border border-purple-500/40 text-purple-300 rounded px-1 text-center truncate">
                                  {conn.label}
                                </div>
                              </foreignObject>
                            )}

                            {/* Animated flow particle */}
                            {isDebugMode && (
                              <motion.circle
                                r="3"
                                fill="#00FF66"
                                initial={{ offsetDistance: "0%" }}
                                animate={{ offsetDistance: "100%" }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
                                style={{
                                  offsetPath: `path('M ${fx} ${fy} C ${fx + 40} ${fy}, ${tx - 40} ${ty}, ${tx} ${ty}')`
                                }}
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Nodes Rendering */}
                    {currentPlaybook.nodes.map((node, idx) => {
                      const isSelected = node.id === selectedNodeId;
                      const isSimActive = isSimulationRunning && simulationStep === idx;

                      return (
                        <motion.div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          style={{ left: node.x, top: node.y }}
                          className={cn(
                            "absolute w-44 p-3.5 rounded-xl border-2 transition-all cursor-pointer z-10 select-none",
                            isSelected
                              ? "bg-[#111827] border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-105"
                              : "bg-[#0b0f17] border-gray-800 hover:border-gray-700 hover:bg-[#0e1420]",
                            isSimActive && "ring-4 ring-[#00FF66] border-[#00FF66] animate-pulse"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {playbookIcons[node.type]}
                              <span className="text-[9px] font-mono font-bold uppercase text-gray-400">
                                {node.type}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-gray-400 border border-gray-800">
                              {node.vendor || 'Custom'}
                            </span>
                          </div>

                          <h5 className="text-xs font-black text-white leading-tight mb-1 truncate">
                            {node.label}
                          </h5>
                          <p className="text-[9px] text-gray-400 line-clamp-2 leading-relaxed">
                            {node.description}
                          </p>

                          {/* Status Badge */}
                          <div className="mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[8px] font-mono">
                            <span className="text-gray-500">ID: {node.id}</span>
                            <span className={cn(
                              "font-bold uppercase flex items-center gap-1",
                              node.status === 'success' ? "text-green-400" :
                              node.status === 'waiting' ? "text-amber-400" : "text-gray-400"
                            )}>
                              <CheckCircle2 size={10} />
                              {node.status}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* RAW YAML / JSON VIEW */}
                {canvasViewMode === 'raw_yaml' && (
                  <div className="w-full h-full p-6 bg-black/80 rounded-xl border border-gray-800 font-mono text-xs overflow-auto custom-scrollbar text-purple-300">
                    <pre>{JSON.stringify(currentPlaybook, null, 2)}</pre>
                  </div>
                )}

                {/* SIMULATOR TRACE LOG VIEW */}
                {canvasViewMode === 'simulator' && (
                  <div className="w-full h-full p-6 bg-black/90 rounded-xl border border-gray-800 font-mono text-xs flex flex-col justify-between">
                    <div className="space-y-2 overflow-y-auto max-h-[360px] custom-scrollbar">
                      <div className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                        <Terminal size={14} /> SOAR Autonomous Trace Log Output:
                      </div>
                      {activeSimLog.length === 0 ? (
                        <div className="text-gray-500 italic">點擊上方「▶ 執行邏輯測試」以開始模擬步進。</div>
                      ) : (
                        activeSimLog.map((log, i) => (
                          <div key={i} className="text-gray-300 text-[11px] leading-relaxed border-l-2 border-purple-500 pl-3">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: NODE INSPECTOR & CONFIGURATION DRAWER */}
              <div className="w-full lg:w-80 bg-[#0c1018] border-t lg:border-t-0 lg:border-l border-gray-800 p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Settings2 size={16} className="text-purple-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        {isZh ? '節點屬性檢查器' : 'Node Inspector'}
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                      {selectedNode.id}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                        {isZh ? '節點標籤 (Label)' : 'Node Label'}
                      </label>
                      <input
                        type="text"
                        value={selectedNode.label}
                        readOnly
                        className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                        {isZh ? '整合驅動模組 (Vendor)' : 'Integration Vendor'}
                      </label>
                      <input
                        type="text"
                        value={selectedNode.vendor || 'Native SEMOR'}
                        readOnly
                        className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-purple-300 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                        {isZh ? '變數參數映射 (Payload Mapping)' : 'Parameter Mapping'}
                      </label>
                      <div className="bg-black/90 border border-gray-800 rounded-lg p-3 font-mono text-[10px] text-gray-300 space-y-1">
                        <div className="text-gray-500">// Dynamic Jinja2 Injection</div>
                        <div>target_ip: <span className="text-green-400">{"{{ alert.src_ip }}"}</span></div>
                        <div>action: <span className="text-blue-400">"QUARANTINE"</span></div>
                        <div>timeout: <span className="text-amber-400">3600</span></div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                        {isZh ? '錯誤重試策略 (Retry Policy)' : 'Error Strategy'}
                      </label>
                      <select className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono outline-none">
                        <option>Exponential Backoff (3 Retries)</option>
                        <option>Fail-Safe Immediate Fallback</option>
                        <option>Escalate to Human Analyst</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-800 space-y-2">
                  <button 
                    onClick={() => showToast(isZh ? '已套用並更新節點配置！' : 'Saved node configuration.')}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black uppercase font-mono tracking-wider transition-all"
                  >
                    {isZh ? '儲存節點參數' : 'Save Config'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXECUTIONS & APPROVAL GATE */}
      {/* ========================================================================= */}
      {activeSubTab === 'executions' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-gray-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <History className="text-purple-400" size={20} />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    {isZh ? 'SOAR 自動化處置執行審計歷程' : 'Autonomous Execution Audit Logs'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {isZh ? '即時追蹤自主聯防劇本派發結果與人工審批隊列' : 'Track real-time autonomous containment runs and approval queue'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {['all', 'Pending Approval', 'Success', 'Failed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setCustomFilter(st)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border",
                      customFilter === st ? "bg-purple-600 text-white border-purple-500" : "bg-black/60 text-gray-400 border-gray-800 hover:text-white"
                    )}
                  >
                    {st === 'all' ? (isZh ? '全部歷程' : 'All') : st}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/60 border-b border-gray-800 text-gray-400 uppercase text-[10px] tracking-wider">
                    <th className="p-4">{isZh ? '執行編號 / 事件 ID' : 'Exec ID / Incident'}</th>
                    <th className="p-4">{isZh ? '對應處置劇本' : 'Playbook'}</th>
                    <th className="p-4">{isZh ? '受影響目標 / 來源' : 'Target Asset'}</th>
                    <th className="p-4">{isZh ? '執行耗時 (MTTR)' : 'Latency'}</th>
                    <th className="p-4">{isZh ? '狀態' : 'Status'}</th>
                    <th className="p-4">{isZh ? '處置結果摘要' : 'Result Summary'}</th>
                    <th className="p-4 text-right">{isZh ? '操作' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {executionLogs
                    .filter(ex => customFilter === 'all' || ex.status === customFilter)
                    .map(item => (
                      <tr key={item.id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white">{item.id}</div>
                          <div className="text-[10px] text-purple-400">{item.incidentId}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-200">{item.playbookName}</div>
                          <div className="text-[10px] text-gray-500">{item.triggerSource}</div>
                        </td>
                        <td className="p-4 text-gray-300">{item.target}</td>
                        <td className="p-4">
                          <span className="text-[#00FF66] font-bold">{item.duration}</span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold uppercase font-mono",
                            item.status === 'Success' ? "bg-green-500/10 text-green-400 border border-green-500/30" :
                            item.status === 'Pending Approval' ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse" :
                            "bg-red-500/10 text-red-400 border border-red-500/30"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 max-w-xs truncate" title={item.resultSummary}>
                          {item.resultSummary}
                        </td>
                        <td className="p-4 text-right">
                          {item.status === 'Pending Approval' ? (
                            <button
                              onClick={() => handleApproveExecution(item.id)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-black rounded text-[10px] uppercase transition-all shadow-lg active:scale-95"
                            >
                              {isZh ? '⚡ 授權核准處置' : 'Approve Action'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedExecution(item)}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded text-[10px] uppercase transition-all"
                            >
                              {isZh ? '鑑識明細' : 'Details'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* EXECUTION DETAILS DRAWER MODAL */}
          <AnimatePresence>
            {selectedExecution && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
              >
                <div className="w-full max-w-2xl bg-[#0e1422] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <Terminal className="text-purple-400" size={20} />
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">{selectedExecution.id} 執行鑑識明細</h4>
                        <p className="text-[10px] text-gray-400 font-mono">{selectedExecution.playbookName}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedExecution(null)} className="text-gray-400 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
                      <div><strong className="text-gray-400">事件目標：</strong> <span className="text-white">{selectedExecution.target}</span></div>
                      <div><strong className="text-gray-400">觸發時間：</strong> <span className="text-white">{selectedExecution.timestamp}</span></div>
                      <div><strong className="text-gray-400">執行總耗時：</strong> <span className="text-[#00FF66]">{selectedExecution.duration}</span></div>
                      <div><strong className="text-gray-400">處置摘要：</strong> <span className="text-purple-300">{selectedExecution.resultSummary}</span></div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">分步執行鏈詳細輸出 (Step-by-Step Breakdown)</h5>
                      {selectedExecution.details?.map((step, idx) => (
                        <div key={idx} className="p-3 bg-black/40 border border-gray-800 rounded-lg flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-bold text-gray-200 text-[11px]">{idx + 1}. {step.stepName}</div>
                            <div className="text-[10px] text-gray-500">{step.output}</div>
                          </div>
                          <span className="text-[10px] font-bold text-[#00FF66] font-mono">{step.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-800">
                    <button
                      onClick={() => setSelectedExecution(null)}
                      className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-mono font-bold uppercase"
                    >
                      {isZh ? '關閉' : 'Close'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACTION & CONNECTOR BUILDER */}
      {/* ========================================================================= */}
      {activeSubTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0b0f17] border border-gray-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <Code className="text-purple-400" size={20} />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {isZh ? '自訂 SOAR 動作驅動建構器' : 'Custom Action & Driver Builder'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {isZh ? '支援 REST API、SSH/Linux CLI、SQL 與 Webhook 異質整合' : 'Build extensible mitigation drivers for any network or cloud API'}
                  </p>
                </div>
              </div>

              <div className="flex bg-black p-1 rounded-lg border border-gray-800">
                {['REST', 'SSH', 'SQL', 'WEBHOOK'].map(p => (
                  <button
                    key={p}
                    onClick={() => setBuilderProtocol(p as any)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all",
                      builderProtocol === p ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                  API 端點 URL / 連線目標
                </label>
                <input
                  type="text"
                  value={builderEndpoint}
                  onChange={(e) => setBuilderEndpoint(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                  請求標頭 (Request Headers)
                </label>
                <div className="bg-black/60 border border-gray-800 rounded-lg p-3 font-mono text-[11px] text-gray-300 space-y-1">
                  <div>Authorization: Bearer <span className="text-purple-400">{"{{ secrets.PAN_FIREWALL_KEY }}"}</span></div>
                  <div>Content-Type: application/json</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                  處置負載範本 (Payload Template with Jinja2 Placeholders)
                </label>
                <textarea
                  rows={8}
                  value={builderPayload}
                  onChange={(e) => setBuilderPayload(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-lg p-4 font-mono text-xs text-[#00FF66] outline-none focus:border-purple-500 leading-relaxed custom-scrollbar"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setIsTestingAction(true);
                    setTimeout(() => {
                      setIsTestingAction(false);
                      setBuilderTestOutput(JSON.stringify({
                        status: 200,
                        response: "SUCCESS",
                        action_id: "ACT-DAG-991",
                        applied_rules: 1,
                        message: "IP 185.199.110.153 successfully added to Dynamic Address Group 'AUTO_SOAR_BLOCK_LIST'"
                      }, null, 2));
                      showToast(isZh ? '測試請求成功回傳 200 OK！' : 'Test driver executed successfully.');
                    }, 800);
                  }}
                  disabled={isTestingAction}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                >
                  {isTestingAction ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                  {isTestingAction ? '正在下發測試請求...' : '▶ 執行沙箱連線測試'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: TEST RUNNER & RESPONSE INSPECTOR */}
          <div className="bg-[#0b0f17] border border-gray-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-green-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    {isZh ? '沙箱回傳與語意解析 (Response Inspector)' : 'Sandbox Output & Regex Extractor'}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-green-400">Mock Mode: Active</span>
              </div>

              <div className="bg-black/90 border border-gray-800 rounded-xl p-4 font-mono text-xs min-h-[300px] overflow-auto custom-scrollbar">
                {builderTestOutput ? (
                  <pre className="text-green-400 leading-relaxed">{builderTestOutput}</pre>
                ) : (
                  <div className="text-gray-500 italic flex flex-col items-center justify-center h-64 gap-2">
                    <Code size={32} className="text-gray-700" />
                    <span>尚未執行測試。請在左側點擊「執行沙箱連線測試」。</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-purple-600/5 border border-purple-500/20 rounded-xl text-xs font-mono text-gray-400 space-y-1">
              <div className="text-purple-300 font-bold">💡 智慧型連接器提示：</div>
              <div>此驅動模組已自動綁定至 SEMOR 全域金鑰庫 (Vault)。發布後可在任意劇本的「Action Node」中直接引用。</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DISTRIBUTED VELOCIRAPTOR FORENSICS */}
      {/* ========================================================================= */}
      {activeSubTab === 'forensics' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/30">
                  <HardDrive className="text-blue-400" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    {isZh ? '跨據點分散式 Velociraptor 鑑識採樣中心' : 'Distributed Velociraptor Forensics Center'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {isZh ? '透過 VQL 引擎秒級跨分支機構下發實體物證萃取與證據鏈 (CoC) 固化' : 'Deploy Velociraptor VQL hunters to acquire MFT, prefetch, and memory images across branches'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={forensicsTarget}
                  onChange={(e) => setForensicsTarget(e.target.value)}
                  placeholder="目標 IP / 主機名稱 (例如 10.10.12.44)"
                  className="bg-black border border-gray-800 rounded-lg px-4 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    setIsForensicsRunning(true);
                    setTimeout(() => {
                      setIsForensicsRunning(false);
                      showToast(isZh ? `已從目標 ${forensicsTarget} 成功萃取 4 項物證！` : 'Forensics collected.');
                    }, 2000);
                  }}
                  disabled={isForensicsRunning}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2"
                >
                  {isForensicsRunning ? <RefreshCw className="animate-spin" size={14} /> : <FileSearch size={14} />}
                  {isForensicsRunning ? '採樣中...' : '下發 VQL 採集'}
                </button>
              </div>
            </div>

            {/* BRANCH TELEMETRY MATRIX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: '台北總部 (Taipei HQ)', id: 'CCS-TPE-01', nodes: '1,420 端點', sync: '1.2s 前', status: 'Online' },
                { name: '新竹晶圓廠 (Hsinchu Fab)', id: 'CCS-HSZ-02', nodes: '890 端點', sync: '0.8s 前', status: 'Online' },
                { name: '台中資料中心 (Taichung DC)', id: 'CCS-TXG-03', nodes: '420 伺服器', sync: '2.1s 前', status: 'Online' },
                { name: '高雄物流園區 (Kaohsiung)', id: 'CCS-KHH-04', nodes: '310 端點', sync: '1.5s 前', status: 'Online' }
              ].map((br, i) => (
                <div key={i} className="p-4 bg-black/60 border border-gray-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{br.name}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="text-[10px] font-mono text-gray-500">ID: {br.id} | {br.nodes}</div>
                  <div className="text-[10px] font-mono text-blue-400">VQL 通道同步: {br.sync}</div>
                </div>
              ))}
            </div>

            {/* FORENSICS EVIDENCE VAULT */}
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-black text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Lock size={14} className="text-green-400" />
                {isZh ? '司法證據鏈固化物證清單 (Chain of Custody Evidence Locker)' : 'Chain of Custody Evidence Locker'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forensicsArtifacts.map((art, i) => (
                  <div key={i} className="p-4 bg-black/80 border border-gray-800 rounded-xl space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="text-blue-400" size={16} />
                        <span className="text-xs font-bold text-white">{art.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{art.size}</span>
                    </div>
                    <div className="text-[9px] text-gray-500 break-all">
                      SHA-256: <span className="text-purple-400">{art.hash}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[9px]">
                      <span className="text-green-400 font-bold">{art.status}</span>
                      <button className="text-blue-400 hover:underline">下載鑑識封包</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INCIDENT CORRELATION & KILL-CHAIN */}
      {/* ========================================================================= */}
      {activeSubTab === 'correlation' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600/20 rounded-xl border border-red-500/30">
                  <Share2 className="text-red-400" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    {isZh ? '重大事件多維關聯與橫向擴散溯源 (Kill-Chain Visualizer)' : 'Multi-Vector Kill-Chain Visualizer'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {isZh ? '視覺化呈現 Patient Zero 零號感染源、橫向提權路徑與 SOAR 攔截點' : 'Visualizing Patient Zero entry, lateral SMB propagation, and SOAR mitigation barriers'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => showToast(isZh ? '已下發全域 SOAR 聯防阻斷指令！' : 'Executed SOAR Containment.')}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-red-600/30"
              >
                <Zap size={14} />
                {isZh ? '一鍵下發全域 SOAR 聯防阻斷' : '1-Click SOAR Quarantine'}
              </button>
            </div>

            {/* CORRELATION TOPOLOGY GRAPH */}
            <div className="bg-black/80 rounded-2xl border border-gray-800 p-6 min-h-[420px] flex items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 900 350" className="w-full h-full select-none font-mono">
                <defs>
                  <marker id="corr-arr" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                  </marker>
                </defs>

                {/* Paths */}
                <path d="M 120 175 L 280 175" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#corr-arr)" />
                <path d="M 280 175 L 450 175" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#corr-arr)" />
                <path d="M 450 175 L 620 100" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#corr-arr)" />
                <path d="M 450 175 L 620 250" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#corr-arr)" />

                {/* Node 1: External C2 */}
                <g transform="translate(100, 175)">
                  <circle r="30" fill="#111" stroke="#3b82f6" strokeWidth="2" />
                  <Globe x="-10" y="-10" size={20} className="text-blue-400" />
                  <text y="46" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">External C2 Relay</text>
                  <text y="58" textAnchor="middle" fill="#9ca3af" fontSize="8">185.220.101.4</text>
                </g>

                {/* Node 2: Edge Firewall */}
                <g transform="translate(280, 175)">
                  <circle r="30" fill="#111" stroke="#6b7280" strokeWidth="2" />
                  <Shield x="-10" y="-10" size={20} className="text-gray-400" />
                  <text y="46" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Edge Firewall</text>
                  <text y="58" textAnchor="middle" fill="#9ca3af" fontSize="8">10.10.0.1</text>
                </g>

                {/* Node 3: Patient Zero */}
                <g transform="translate(450, 175)">
                  <circle r="34" fill="#111" stroke="#ef4444" strokeWidth="3" className="animate-pulse" />
                  <Skull x="-10" y="-10" size={20} className="text-red-500" />
                  <text y="50" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="black">PATIENT ZERO</text>
                  <text y="62" textAnchor="middle" fill="white" fontSize="9">WS-09 (10.10.12.44)</text>
                </g>

                {/* Node 4: Lateral Target 1 */}
                <g transform="translate(640, 100)">
                  <circle r="28" fill="#111" stroke="#ef4444" strokeWidth="2" />
                  <Monitor x="-10" y="-10" size={20} className="text-red-400" />
                  <text y="44" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">WS-131 (Finance)</text>
                  <text y="56" textAnchor="middle" fill="#ef4444" fontSize="8">Infected (SMB)</text>
                </g>

                {/* Node 5: Lateral Target 2 */}
                <g transform="translate(640, 250)">
                  <circle r="28" fill="#111" stroke="#00FF66" strokeWidth="3" />
                  <Database x="-10" y="-10" size={20} className="text-[#00FF66]" />
                  <text y="44" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Postgres Core</text>
                  <text y="56" textAnchor="middle" fill="#00FF66" fontSize="8">SOAR 守衛隔離</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CONNECTORS & SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'connectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'CrowdStrike Falcon', cat: 'EDR Endpoint', status: 'Connected', latency: '32ms', desc: '即時主機隔離與微指令下發通道' },
            { name: 'Palo Alto Panorama', cat: 'Next-Gen Firewall', status: 'Connected', latency: '45ms', desc: '動態阻斷群組 (DAG) 與 URL 黑名單同步' },
            { name: 'Microsoft 365 Graph API', cat: 'Email & Identity', status: 'Connected', latency: '120ms', desc: '全域郵件下架與 OAuth 憑證撤銷' },
            { name: 'Velociraptor Master', cat: 'DFIR Forensics', status: 'Connected', latency: '18ms', desc: '分散式 VQL 物證萃取微服務' },
            { name: 'TheHive 5 / Cortex', cat: 'Case Management', status: 'Connected', latency: '24ms', desc: '自動工單派發與分析器整合' },
            { name: 'Slack / Teams Webhook', cat: 'Notification', status: 'Connected', latency: '80ms', desc: 'SOC 核心應變頻道廣播' },
          ].map((c, i) => (
            <div key={i} className="p-6 bg-[#0b0f17] border border-gray-800 rounded-2xl space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{c.cat}</span>
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  {c.status}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">{c.name}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500">
                <span>API 延遲: <strong className="text-purple-400">{c.latency}</strong></span>
                <button 
                  onClick={() => showToast(`已重新同步 ${c.name} 連線狀態！`)}
                  className="text-blue-400 hover:underline"
                >
                  測試連線
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

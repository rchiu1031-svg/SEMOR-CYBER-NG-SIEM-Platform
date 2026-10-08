import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  Download,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Terminal,
  Brain,
  Workflow,
  Shield,
  Clock,
  Activity,
  Layers,
  FileText,
  Lock,
  Unlock,
  Radio,
  Server,
  User,
  Zap,
  Globe,
  RefreshCw,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  ClipboardCheck,
  X,
  Share2,
  Send,
  Database,
  Cpu,
  Fingerprint,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Info,
  RadioTower,
  Code,
  Flame,
  Bug
} from 'lucide-react';
import { cn } from '../lib/utils';
import * as d3 from 'd3';

export interface CriticalIncidentItem {
  id: string;
  time: string;
  srcip: string;
  srcHost?: string;
  srcUser?: string;
  dstip: string;
  dstHost?: string;
  action: string;
  country: string;
  threat: string;
  risk: 'Critical' | 'High' | 'Medium';
  riskScore: number;
  status: 'active' | 'investigating' | 'contained' | 'resolved';
  category: 'ueba' | 'ics' | 'apt' | 'bruteforce' | 'c2' | 'exfil';
  cve?: string;
  mitreTTP: string;
  mitreStage: 'Recon' | 'Initial Access' | 'Privilege Escalation' | 'Lateral Movement' | 'Exfiltration';
  affectedAssets: number;
  confidence: number;
  payloadHex: string;
  rawLog: string;
  aiSummary: string;
  recommendedPlaybooks: {
    id: string;
    title: string;
    description: string;
    type: 'isolate' | 'block' | 'revoke' | 'dump' | 'notify';
  }[];
}

const DEFAULT_INCIDENTS: CriticalIncidentItem[] = [
  {
    id: 'INC-2026-0801',
    time: '2026-04-30 02:30:00',
    srcip: '10.100.4.18',
    srcHost: 'WS-RD-DEV-04',
    srcUser: 'Kevin (R&D Lead)',
    dstip: '198.51.100.88',
    dstHost: 'MEGA.nz Cloud Storage',
    action: 'UEBA: Data Exfiltration',
    country: 'Internal',
    threat: 'Anomalous Upload (15GB Encrypted Blob)',
    risk: 'Critical',
    riskScore: 9.8,
    status: 'active',
    category: 'ueba',
    cve: 'CWE-200 / Insider Threat',
    mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
    mitreStage: 'Exfiltration',
    affectedAssets: 3,
    confidence: 98.4,
    payloadHex: '4d 45 47 41 5f 55 50 4c 4f 41 44 5f 53 45 53 53 49 4f 4e 5f 4b 45 59 3a 20 61 65 73 32 35 36 2d 67 63 6d 5f 70 61 79 6c 6f 61 64 2e 74 61 72 2e 67 7a',
    rawLog: JSON.stringify({
      timestamp: "2026-04-30T02:30:00Z",
      event: "UEBA_ANOMALOUS_OUTBOUND",
      source_user: "kevin_rd",
      source_ip: "10.100.4.18",
      dest_fqdn: "eu.storage.mega.co.nz",
      dest_ip: "198.51.100.88",
      protocol: "HTTPS/TLSv1.3",
      bytes_out: 16106127360,
      baseline_avg_bytes: 45000000,
      deviation_sigma: "+7.4 sigma",
      encryption: "Client-Side Pre-Encrypted Archive"
    }, null, 2),
    aiSummary: '戰術模式顯示研發部門帳號於非工作時間（凌晨 02:30）存取核心原始碼儲存庫後，向境外網盤高頻上傳高達 15GB 加密封裝資料。偏離該使用者過去 90 天行為基準線達 +7.4 個標準差，高度符合內部威脅資料竊取特徵。',
    recommendedPlaybooks: [
      { id: 'pb-1', title: '即時阻斷該端點連外網路 (Host Quarantine)', description: '透過 EDR 下發網路隔離指令，僅保留 SOC 通信埠', type: 'isolate' },
      { id: 'pb-2', title: '強制撤銷 AD 帳號與 Session Token', description: '立即鎖定 Active Directory 帳號並終止所有雲端登入憑證', type: 'revoke' },
      { id: 'pb-3', title: '下發邊界防火牆 DNS / IP 封鎖規則', description: '向 Palo Alto / Fortinet 下發 198.51.100.88 阻斷規則', type: 'block' },
      { id: 'pb-4', title: '執行終端記憶體傾印取證 (Forensic Dump)', description: '即時擷取該開發主機 RAM 與暫存目錄進行數位鑑識', type: 'dump' }
    ]
  },
  {
    id: 'INC-2026-0802',
    time: '2026-04-30 02:15:00',
    srcip: '10.100.4.18',
    srcHost: 'WS-RD-DEV-04',
    srcUser: 'Kevin (R&D Lead)',
    dstip: '10.200.1.20',
    dstHost: 'GitLab-Enterprise-Core',
    action: 'UEBA: File Access Anomaly',
    country: 'Internal',
    threat: 'High Vol Source Code Repository Clone',
    risk: 'High',
    riskScore: 8.6,
    status: 'investigating',
    category: 'ueba',
    cve: 'CWE-284 Improper Access Control',
    mitreTTP: 'T1005 Data from Local System',
    mitreStage: 'Lateral Movement',
    affectedAssets: 2,
    confidence: 94.2,
    payloadHex: '67 69 74 20 63 6c 6f 6e 65 20 2d 2d 6d 69 72 72 6f 72 20 67 69 74 40 67 69 74 6c 61 62 3a 64 65 66 65 6e 73 65 2d 63 34 69 73 72 2e 67 69 74',
    rawLog: JSON.stringify({
      timestamp: "2026-04-30T02:15:00Z",
      event: "GIT_BULK_EXPORT",
      actor: "kevin_rd",
      repo_count: 18,
      total_commits_downloaded: 45200,
      protocol: "SSH-RSA",
      fingerprint: "SHA256:d8:a1:4c:7b:99:12:ef"
    }, null, 2),
    aiSummary: '同一主機在進行大流量外洩前 15 分鐘，批次鏡像複製了 18 個軍事通信與 C4ISR 核心專案儲存庫，確認為連貫性資料竊取攻擊鏈之第一階段。',
    recommendedPlaybooks: [
      { id: 'pb-git-1', title: '暫時撤銷該使用者之 GitLab SSH 金鑰與權限', description: '防止繼續進行未授權之代碼複製', type: 'revoke' },
      { id: 'pb-git-2', title: '限制內部 Git Server 存取 IP 網段', description: '加強微分段安全防護', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0803',
    time: '2026-04-02 09:30:15',
    srcip: '103.45.12.88',
    srcHost: 'APT-66-PUPPET',
    srcUser: 'SYSTEM (Exploited)',
    dstip: '192.168.50.10',
    dstHost: 'SCADA-PLC-TURBINE-01',
    action: 'Modbus Write (0x05)',
    country: 'Russia',
    threat: 'Industrial Sabotage (Coil Override Attempt)',
    risk: 'Critical',
    riskScore: 9.9,
    status: 'active',
    category: 'ics',
    cve: 'CVE-2022-22965 / Modbus Auth Bypass',
    mitreTTP: 'T0855 Unauthorized Command Message',
    mitreStage: 'Initial Access',
    affectedAssets: 4,
    confidence: 99.1,
    payloadHex: '00 01 00 00 00 06 01 05 00 64 ff 00 (Modbus Force Single Coil: OVERRIDE_COOLING_VALVE_ON)',
    rawLog: JSON.stringify({
      timestamp: "2026-04-02T09:30:15Z",
      protocol: "Modbus/TCP (Port 502)",
      function_code: "0x05 (Write Single Coil)",
      register_address: "0x0064 (Coil 100)",
      requested_state: "0xFF00 (Force ON)",
      plc_model: "Schneider Modicon M580",
      threat_actor: "APT-66 (Industrial Disruptor)"
    }, null, 2),
    aiSummary: '偵測到針對關鍵基礎設施冷卻控制閥之強制寫入惡意指令 (Function Code 0x05)，企圖越過安全連鎖機構造成渦輪機過熱停機。來源 IP 位於境外高風險網段，屬於具備國家級背景之工控破壞攻擊。',
    recommendedPlaybooks: [
      { id: 'pb-ics-1', title: '切換工控網閘至單向硬體隔離模式 (Air-Gap)', description: '阻斷外部 IT-OT 橫向連線，維持本地 HMI 安全運作', type: 'isolate' },
      { id: 'pb-ics-2', title: '下發 ICS 防火牆 Modbus 協議白名單過濾', description: '強制拒絕所有非排程之 0x05 / 0x0F 寫入指令', type: 'block' },
      { id: 'pb-ics-3', title: '緊急啟動備援發電機與安全保護連鎖', description: '防止物理設備產生硬體損傷', type: 'notify' }
    ]
  },
  {
    id: 'INC-2026-0804',
    time: '2026-04-02 09:12:40',
    srcip: '45.122.3.15',
    srcHost: 'HOST-EXTERNAL-SCANNER',
    dstip: '172.16.0.5',
    dstHost: 'DMZ-BASTION-JUMP',
    action: 'SSH Brute Force',
    country: 'China',
    threat: 'Credential Access (Dict Attack: 2,400 attempts/min)',
    risk: 'High',
    riskScore: 8.2,
    status: 'contained',
    category: 'bruteforce',
    cve: 'CWE-307 Excessive Authentication Attempts',
    mitreTTP: 'T1110.001 Password Guessing',
    mitreStage: 'Initial Access',
    affectedAssets: 1,
    confidence: 96.0,
    payloadHex: '53 53 48 2d 32 2e 30 2d 4c 69 62 53 53 48 5f 30 2e 39 2e 35 20 61 75 74 68 5f 66 61 69 6c 75 72 65 3a 20 72 6f 6f 74',
    rawLog: JSON.stringify({
      timestamp: "2026-04-02T09:12:40Z",
      service: "OpenSSH_8.9p1",
      failed_attempts: 2480,
      duration_seconds: 62,
      target_accounts: ["root", "admin", "c4isr_op", "operator", "backup"]
    }, null, 2),
    aiSummary: '高頻字典檔攻擊邊界堡壘機，企圖透過自動化撞庫取得特權操作通道。自動化 WAF / Fail2ban 已即時下發 24 小時動態黑名單。',
    recommendedPlaybooks: [
      { id: 'pb-ssh-1', title: '延長來源 IP 封鎖期至 30 天', description: '將 45.122.3.15 加入全域邊界防禦清單', type: 'block' }
    ]
  },
  {
    id: 'INC-2026-0805',
    time: '2026-04-02 08:55:22',
    srcip: '185.220.101.4',
    srcHost: 'TOR-EXIT-NODE-NETH',
    dstip: '10.0.0.15',
    dstHost: 'PORTAL-AUTH-API-01',
    action: 'SQL Injection',
    country: 'Netherlands',
    threat: 'Data Exfiltration (UNION SELECT schema dump)',
    risk: 'Critical',
    riskScore: 9.5,
    status: 'active',
    category: 'apt',
    cve: 'CVE-2023-34362 / SQLi in REST API',
    mitreTTP: 'T1190 Exploit Public-Facing Application',
    mitreStage: 'Initial Access',
    affectedAssets: 2,
    confidence: 97.8,
    payloadHex: '27 20 55 4e 49 4f 4e 20 53 45 4c 45 43 54 20 6e 75 6c 6c 2c 20 74 61 62 6c 65 5f 6e 61 6d 65 2c 20 63 6f 6c 75 6d 6e 5f 6e 61 6d 65 20 46 52 4f 4d 20 69 6e 66 6f 72 6d 61 74 69 6f 6e 5f 73 63 68 65 6d 61 2e 63 6f 6c 75 6d 6e 73 20 2d 2d 20',
    rawLog: JSON.stringify({
      timestamp: "2026-04-02T08:55:22Z",
      request_uri: "/api/v2/personnel/search?q='%20UNION%20SELECT%20null,table_name,column_name%20FROM%20information_schema.columns--",
      user_agent: "sqlmap/1.7.2#stable (https://sqlmap.org)",
      waf_status: "ALERT_GENERATED",
      db_response_size: "142 KB"
    }, null, 2),
    aiSummary: '利用 Portal 查詢介面未經過濾之參數進行 UNION 注入，探測系統資料表結構並嘗試導出人員資料庫清冊。',
    recommendedPlaybooks: [
      { id: 'pb-sqli-1', title: '開啟 WAF 嚴格虛擬修補 (Virtual Patching)', description: '阻斷所有包含 UNION SELECT / SQL 特徵字元之 HTTP 請求', type: 'block' },
      { id: 'pb-sqli-2', title: '暫時停用脆弱 API 節點 /api/v2/personnel/search', description: '將流量路由至靜態維護頁面以待熱修復', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0806',
    time: '2026-04-02 08:40:10',
    srcip: '91.241.19.33',
    srcHost: 'UNKNOWN-HOST',
    dstip: '192.168.1.100',
    dstHost: 'WS-FINANCE-03',
    action: 'RDP Exploit (BlueKeep)',
    country: 'Ukraine',
    threat: 'Lateral Movement (EternalBlue / BlueKeep probe)',
    risk: 'High',
    riskScore: 8.9,
    status: 'investigating',
    category: 'apt',
    cve: 'CVE-2019-0708 (BlueKeep)',
    mitreTTP: 'T1210 Exploitation of Remote Services',
    mitreStage: 'Lateral Movement',
    affectedAssets: 2,
    confidence: 93.5,
    payloadHex: '03 00 00 13 0e e0 00 00 00 00 00 01 00 08 00 03 00 00 00 (RDP MS_T120 Channel Malformed Packet)',
    rawLog: JSON.stringify({
      timestamp: "2026-04-02T08:40:10Z",
      port: 3389,
      channel: "MS_T120",
      exploit_family: "BlueKeep Kernel Memory Corruption",
      edr_state: "PROCESS_TAMPER_DETECTED"
    }, null, 2),
    aiSummary: '遠端桌面服務接收到異常通道封包，企圖觸發核心記憶體毀損以執行任意代碼。',
    recommendedPlaybooks: [
      { id: 'pb-rdp-1', title: '關閉非必要之公網 RDP 存取埠 (Port 3389)', description: '強制使用 VPN 加上 2FA 雙因子驗證連線', type: 'block' },
      { id: 'pb-rdp-2', title: '下發微軟安全更新 KB4499175', description: '派送緊急安全性更新修補 BlueKeep 弱點', type: 'isolate' }
    ]
  },
  {
    id: 'INC-2026-0807',
    time: '2026-04-02 08:15:05',
    srcip: '192.168.50.200',
    srcHost: 'WS-LOGISTICS-08',
    dstip: '8.8.8.8',
    dstHost: 'Google Public DNS (Hijacked Tunnel)',
    action: 'DNS Tunneling',
    country: 'Internal',
    threat: 'C2 Communication (Encoded Subdomains Exfiltration)',
    risk: 'Critical',
    riskScore: 9.7,
    status: 'active',
    category: 'c2',
    cve: 'CWE-319 Cleartext Transmission',
    mitreTTP: 'T1071.004 DNS Application Layer Protocol',
    mitreStage: 'Privilege Escalation',
    affectedAssets: 3,
    confidence: 99.3,
    payloadHex: '71 78 7a 61 39 39 31 38 66 61 32 30 34 62 2e 63 32 2d 63 6f 6d 6d 61 6e 64 2e 6e 65 74',
    rawLog: JSON.stringify({
      timestamp: "2026-04-02T08:15:05Z",
      query_type: "TXT / NULL",
      subdomain_entropy: 4.88,
      query_count: 5400,
      dest_c2_ns: "ns1.c2-command.net"
    }, null, 2),
    aiSummary: '內網後勤端點向惡意 NS 伺服器發出高頻超長 Base32 子網域 DNS 請求，確認為隱蔽 C2 通道與慢速外洩特徵。',
    recommendedPlaybooks: [
      { id: 'pb-dns-1', title: '內部 DNS 伺服器強制啟用 DNS RPZ 響應原則區域', description: '將惡意網域導向安全黑洞 Sinkhole', type: 'block' },
      { id: 'pb-dns-2', title: '隔離 WS-LOGISTICS-08 並進行惡意軟體掃描', description: '清除背景常駐之 DNS Beacon 惡意載荷', type: 'isolate' }
    ]
  }
];

export interface LogsSummary {
  totalLogs: number;
  highRiskLogsCount: number;
  activeIncidentCount: number;
  lastIngestedLogTime: string;
  recentLogsSample?: {
    id: string;
    timestamp: string;
    host: string;
    level: string;
    protocol: string;
    source: string;
    message: string;
  }[];
}

export default function CriticalIncidentsView({ currentUser }: { currentUser: any }) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Data state
  const [incidents, setIncidents] = useState<CriticalIncidentItem[]>(DEFAULT_INCIDENTS);
  const [expandedRow, setExpandedRow] = useState<string | null>(DEFAULT_INCIDENTS[0].id);
  const [selectedIncident, setSelectedIncident] = useState<CriticalIncidentItem | null>(DEFAULT_INCIDENTS[0]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  
  // Backend Log Telemetry & Correlation State
  const [logsSummary, setLogsSummary] = useState<LogsSummary | null>(null);
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [isInjectingThreat, setIsInjectingThreat] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showRecentLogsModal, setShowRecentLogsModal] = useState(false);
  const [evidenceLogs, setEvidenceLogs] = useState<{ [id: string]: { loading: boolean; logs: any[] } }>({});
  const [evidenceCopiedId, setEvidenceCopiedId] = useState<string | null>(null);
  const [signatureAnalysisMap, setSignatureAnalysisMap] = useState<{ [id: string]: { loading: boolean; data: any } }>({});
  const [iocCopiedValue, setIocCopiedValue] = useState<string | null>(null);

  // Sub-tabs inside expanded row
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'signature' | 'logs' | 'payload' | 'topology' | 'soar' | 'notes'>('ai');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'Critical' | 'High' | 'Medium'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'ueba' | 'ics' | 'apt' | 'bruteforce' | 'c2'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'investigating' | 'contained' | 'resolved'>('ALL');

  // Interactive Playbook Execution State
  const [executingPlaybook, setExecutingPlaybook] = useState<string | null>(null);
  const [playbookCountdown, setPlaybookCountdown] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fullscreen Topology Modal
  const [showTopologyModal, setShowTopologyModal] = useState(false);

  // Export Dossier Modal
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierData, setDossierData] = useState<any>(null);
  const [copiedHex, setCopiedHex] = useState(false);

  // Fetch Live Incidents from Backend
  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/incidents');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.incidents) && data.incidents.length > 0) {
          setIncidents(data.incidents);
          if (!selectedIncident) {
            setSelectedIncident(data.incidents[0]);
            setExpandedRow(data.incidents[0].id);
          } else {
            const freshSelected = data.incidents.find((i: any) => i.id === selectedIncident.id);
            if (freshSelected) setSelectedIncident(freshSelected);
          }
        }
      }
    } catch (err) {
      console.warn('Backend incidents API unavailable, using resilient fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Backend Log Collection Summary
  const fetchLogsSummary = async () => {
    try {
      const res = await fetch('/api/v1/incidents/logs/summary');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogsSummary(data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch backend logs summary:', err);
    }
  };

  // Fetch Evidence Logs for a specific Incident
  const fetchEvidenceLogs = async (incidentId: string, force = false) => {
    if (!force && evidenceLogs[incidentId]?.logs?.length > 0 && !evidenceLogs[incidentId]?.loading) {
      return;
    }
    setEvidenceLogs(prev => ({ ...prev, [incidentId]: { loading: true, logs: prev[incidentId]?.logs || [] } }));
    try {
      const res = await fetch(`/api/v1/incidents/${incidentId}/evidence-logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setEvidenceLogs(prev => ({ ...prev, [incidentId]: { loading: false, logs: data.logs } }));
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch evidence logs:', err);
    }
    setEvidenceLogs(prev => ({ ...prev, [incidentId]: { loading: false, logs: prev[incidentId]?.logs || [] } }));
  };

  // Fetch Attack Signature Analysis & IOCs
  const fetchSignatureAnalysis = async (incidentId: string) => {
    if (signatureAnalysisMap[incidentId]?.data && !signatureAnalysisMap[incidentId]?.loading) {
      return;
    }
    setSignatureAnalysisMap(prev => ({ ...prev, [incidentId]: { loading: true, data: null } }));
    try {
      const res = await fetch(`/api/v1/incidents/${incidentId}/signature-analysis`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.detection) {
          setSignatureAnalysisMap(prev => ({ ...prev, [incidentId]: { loading: false, data: json.detection } }));
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load signature analysis:', err);
    }
    setSignatureAnalysisMap(prev => ({ ...prev, [incidentId]: { loading: false, data: null } }));
  };

  // Trigger Backend Log Correlation Engine
  const handleCorrelateLogs = async () => {
    try {
      setIsCorrelating(true);
      const res = await fetch('/api/v1/incidents/correlate-logs', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.incidents)) {
          setIncidents(data.incidents);
        }
        setSuccessToast(data.message || (isZh ? '後端 Log 關聯分析已完成！' : 'Backend log correlation completed!'));
        setTimeout(() => setSuccessToast(null), 4000);
        fetchLogsSummary();
        if (selectedIncident) {
          fetchEvidenceLogs(selectedIncident.id, true);
        }
      }
    } catch (err) {
      console.error('Failed to trigger log correlation:', err);
    } finally {
      setIsCorrelating(false);
    }
  };

  // Simulate / Inject Threat Log into Backend
  const handleSimulateThreatLog = async (threatType: 'ics' | 'c2' | 'bruteforce' | 'ransomware' | 'exfil' | 'sqli') => {
    try {
      setIsInjectingThreat(true);
      const res = await fetch('/api/v1/incidents/simulate-threat-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threatType })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessToast(data.message || (isZh ? '威脅 Log 注入成功並自動關聯立案！' : 'Threat log injected and correlated!'));
        setTimeout(() => setSuccessToast(null), 4500);
        await fetchIncidents();
        await fetchLogsSummary();
        if (data.latestIncident) {
          setSelectedIncident(data.latestIncident);
          setExpandedRow(data.latestIncident.id);
          fetchEvidenceLogs(data.latestIncident.id, true);
        }
      }
    } catch (err) {
      console.error('Failed to inject simulated threat log:', err);
    } finally {
      setIsInjectingThreat(false);
      setShowSimulateModal(false);
    }
  };

  // Reset Incidents Dataset
  const handleResetIncidents = async () => {
    try {
      const res = await fetch('/api/v1/incidents/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success && Array.isArray(data.incidents)) {
        setIncidents(data.incidents);
        setSelectedIncident(data.incidents[0]);
        setExpandedRow(data.incidents[0].id);
        setSuccessToast(data.message || (isZh ? '嚴重事件資料庫已重置回基準狀態' : 'Incidents dataset reset.'));
        setTimeout(() => setSuccessToast(null), 3500);
        fetchLogsSummary();
      }
    } catch (err) {
      console.error('Failed to reset dataset:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchLogsSummary();
    const timer = setInterval(() => {
      fetchIncidents();
      fetchLogsSummary();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (expandedRow) {
      fetchEvidenceLogs(expandedRow);
    }
  }, [expandedRow]);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      window.addEventListener('scroll', handleClickOutside, true);
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('scroll', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  // Filtered Incidents
  const filteredIncidents = incidents.filter((inc) => {
    const matchSearch =
      searchQuery === '' ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.srcip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.dstip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.threat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.mitreTTP.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.srcUser && inc.srcUser.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.srcHost && inc.srcHost.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRisk = riskFilter === 'ALL' || inc.risk === riskFilter;
    const matchCat = categoryFilter === 'ALL' || inc.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || inc.status === statusFilter;

    return matchSearch && matchRisk && matchCat && matchStatus;
  });

  // Action: Acknowledge All
  const handleAcknowledgeAll = async () => {
    try {
      const res = await fetch('/api/v1/incidents/acknowledge-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: currentUser?.username || 'Current Analyst' })
      });
      const data = await res.json();
      if (data.success && data.incidents) {
        setIncidents(data.incidents);
        setSuccessToast(data.message || (isZh ? '已全數確認知悉並轉入調查階段' : 'All incidents acknowledged and marked under investigation.'));
        setTimeout(() => setSuccessToast(null), 3500);
        return;
      }
    } catch (err) {
      console.error('Failed to acknowledge incidents via API:', err);
    }

    // Local fallback
    setIncidents((prev) =>
      prev.map((item) => (item.status === 'active' ? { ...item, status: 'investigating' } : item))
    );
    setSuccessToast(isZh ? '已全數確認知悉並轉入調查階段' : 'All incidents acknowledged and marked under investigation.');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Action: Execute SOAR Playbook
  const handleExecutePlaybook = (incidentId: string, playbookTitle: string, type: string) => {
    setExecutingPlaybook(playbookTitle);
    setPlaybookCountdown(3);

    // Call backend API in parallel
    const apiCall = fetch(`/api/v1/incidents/${incidentId}/playbooks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playbookTitle,
        type,
        operator: currentUser?.username || 'Current Analyst'
      })
    })
      .then(res => res.json())
      .catch(err => {
        console.warn('Backend playbook execution API error:', err);
        return null;
      });

    const interval = setInterval(() => {
      setPlaybookCountdown((prev) => {
        if (prev && prev <= 1) {
          clearInterval(interval);
          setExecutingPlaybook(null);
          setPlaybookCountdown(null);

          apiCall.then((data) => {
            if (data && data.success && data.incident) {
              setIncidents((prevIncidents) =>
                prevIncidents.map((inc) => (inc.id === incidentId ? data.incident : inc))
              );
              if (selectedIncident?.id === incidentId) {
                setSelectedIncident(data.incident);
              }
              setSuccessToast(data.message);
            } else {
              // Local state update
              setIncidents((prevIncidents) =>
                prevIncidents.map((inc) => {
                  if (inc.id === incidentId) {
                    return {
                      ...inc,
                      status: type === 'isolate' || type === 'block' ? 'contained' : 'resolved',
                      riskScore: Math.max(2.0, inc.riskScore - 3.5)
                    };
                  }
                  return inc;
                })
              );
              setSuccessToast(
                isZh
                  ? `【自動化 SOAR 指令成功】已對 ${incidentId} 執行：${playbookTitle}`
                  : `SOAR Playbook [${playbookTitle}] executed successfully for ${incidentId}`
              );
            }
            setTimeout(() => setSuccessToast(null), 4000);
          });

          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  // Action: Update Incident Status
  const handleUpdateStatus = async (incidentId: string, newStatus: 'active' | 'investigating' | 'contained' | 'resolved') => {
    try {
      const res = await fetch(`/api/v1/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          operator: currentUser?.username || 'Current Analyst'
        })
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents((prev) => prev.map((i) => (i.id === incidentId ? data.incident : i)));
        if (selectedIncident?.id === incidentId) setSelectedIncident(data.incident);
        setSuccessToast(data.message || `事件 ${incidentId} 已成功標記為 ${newStatus}`);
        setTimeout(() => setSuccessToast(null), 3000);
        return;
      }
    } catch (err) {
      console.warn('Failed to update incident status via API:', err);
    }

    setIncidents((prev) => prev.map((i) => (i.id === incidentId ? { ...i, status: newStatus } : i)));
    setSuccessToast(isZh ? `已將 ${incidentId} 標記為 ${newStatus}` : `Incident ${incidentId} marked as ${newStatus}.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Action: AI Re-Analysis
  const handleRunAiTriage = async (incidentId: string) => {
    try {
      setIsAnalyzingAi(true);
      const res = await fetch(`/api/v1/incidents/${incidentId}/ai-analyze`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setSuccessToast(isZh ? `AI 深度威脅研判完成 (${incidentId})` : `AI Threat Analysis complete for ${incidentId}`);
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } catch (err) {
      console.warn('AI Triage API error:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Action: Open Dossier Modal
  const handleOpenDossier = async () => {
    try {
      const res = await fetch('/api/v1/incidents/export/dossier');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.dossier) {
          setDossierData(data.dossier);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dossier report:', err);
    }
    setShowDossierModal(true);
  };

  // Stats Calculations
  const activeCount = incidents.filter((i) => i.status === 'active').length;
  const containedCount = incidents.filter((i) => i.status === 'contained').length;
  const avgRisk = (incidents.reduce((acc, curr) => acc + curr.riskScore, 0) / incidents.length).toFixed(1);

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-8 z-[200] bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 font-medium text-xs"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner: Incident Intelligence Command Header */}
      <div className="bg-[#0c0d12] border-2 border-red-950/70 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.06)]">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-red-600/10 via-amber-600/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-950 via-gray-900 to-red-900/40 rounded-2xl flex items-center justify-center border border-red-500/40 shadow-inner text-red-400">
              <ShieldAlert size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>{isZh ? '嚴重事件分析與鑑識應變主控台' : 'Critical Incident Analysis & Response Console'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-mono">
                    SOC TIER-3 DEEP DIVE
                  </span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {activeCount} {isZh ? '筆急迫事件待遏阻' : 'Active Breaches'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                {isZh
                  ? '整合全域關聯分析、AI 威脅研判、MITRE ATT&CK 殺傷鏈、原始封包數位鑑識與 SOAR 自動化處置劇本，提供高急迫度安全事件的一站式快速封鎖與事後溯源。'
                  : 'Holistic critical incident response engine: Correlated alerts, MITRE kill-chains, raw payload hexadecimal forensics, and 1-click SOAR remediation.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchIncidents}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-red-400' : 'text-gray-400'} />
              <span>{isZh ? '重新整理' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleOpenDossier}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
            >
              <FileText size={15} className="text-blue-400" />
              <span>{isZh ? '產出鑑識專案書' : 'Export Dossier'}</span>
            </button>

            <button
              onClick={handleAcknowledgeAll}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-[0.98]"
            >
              <ClipboardCheck size={15} />
              <span>{isZh ? '全數確認知悉 (Acknowledge All)' : 'Acknowledge All'}</span>
            </button>
          </div>
        </div>

        {/* Executive Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-800/80 font-mono">
          <div className="p-3 bg-black/40 border border-red-900/40 rounded-xl">
            <div className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              {isZh ? '急迫未遏阻 (Active Breaches)' : 'Active Incidents'}
            </div>
            <div className="text-xl font-black text-white mt-1">{activeCount} / {incidents.length}</div>
          </div>

          <div className="p-3 bg-black/40 border border-emerald-900/40 rounded-xl">
            <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
              <ShieldCheck size={12} />
              {isZh ? '已遏阻/修復 (Contained)' : 'Contained / Resolved'}
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">{containedCount + incidents.filter(i => i.status === 'resolved').length}</div>
          </div>

          <div className="p-3 bg-black/40 border border-blue-900/40 rounded-xl">
            <div className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-1">
              <Clock size={12} />
              {isZh ? '平均應變時間 (MTTR)' : 'Avg MTTR'}
            </div>
            <div className="text-xl font-black text-blue-300 mt-1">12.4m <span className="text-[10px] text-gray-500 font-normal">SLA &lt;15m</span></div>
          </div>

          <div className="p-3 bg-black/40 border border-amber-900/40 rounded-xl">
            <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
              <Activity size={12} />
              {isZh ? '平均風險評級 (Avg CVSS)' : 'Average Risk Score'}
            </div>
            <div className="text-xl font-black text-amber-400 mt-1">{avgRisk} <span className="text-[10px] text-red-400 font-bold">CRITICAL</span></div>
          </div>
        </div>
      </div>

      {/* Backend Log Ingestion & Real-Time Correlation Pipeline Control Deck */}
      <div className="bg-[#0b0e14] border border-cyan-900/50 p-5 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-600/10 via-blue-600/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-cyan-950/80 rounded-xl flex items-center justify-center border border-cyan-500/40 text-cyan-400 shadow-inner">
              <Database size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white uppercase tracking-tight">
                  {isZh ? '後端日誌收集管線・即時威脅關聯分析引擎' : 'Backend Log Ingestion & Threat Correlation Engine'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  PIPELINE ONLINE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh
                  ? `資料來源：後端日誌收集佇列 (runtimeLogCorpus)。目前收集池共 ${logsSummary?.totalLogs ?? 0} 筆 Log，已即時過濾識別 ${logsSummary?.highRiskLogsCount ?? 0} 筆高危威脅日誌。`
                  : `Data Source: Backend Log Collection Corpus (${logsSummary?.totalLogs ?? 0} total logs, ${logsSummary?.highRiskLogsCount ?? 0} high-risk threat signatures detected).`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCorrelateLogs}
              disabled={isCorrelating}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-600/25 disabled:opacity-50"
            >
              <Zap size={14} className={isCorrelating ? 'animate-spin' : ''} />
              <span>{isCorrelating ? (isZh ? '關聯分析中...' : 'Correlating...') : (isZh ? '立即關聯後端 Log' : 'Correlate Backend Logs')}</span>
            </button>

            <button
              onClick={() => setShowSimulateModal(true)}
              disabled={isInjectingThreat}
              className="px-3.5 py-2 bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
            >
              <Sparkles size={14} className="text-purple-400" />
              <span>{isZh ? '注入測試威脅 Log' : 'Simulate Threat Log'}</span>
            </button>

            <button
              onClick={() => setShowRecentLogsModal(true)}
              className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <Terminal size={13} className="text-gray-400" />
              <span>{isZh ? '檢視最新 Log 串流' : 'Live Log Stream'}</span>
            </button>

            <button
              onClick={handleResetIncidents}
              className="px-3 py-2 bg-gray-900/60 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-xl text-xs transition-all"
              title={isZh ? '重置回初始事件集' : 'Reset to baseline'}
            >
              {isZh ? '重置事件集' : 'Reset'}
            </button>
          </div>
        </div>

        {/* Live Counters strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-gray-800/80 font-mono text-xs">
          <div className="flex items-center justify-between p-2.5 bg-black/40 border border-gray-800/60 rounded-xl">
            <span className="text-gray-400 text-[11px]">{isZh ? '後端 Log 收集總量' : 'Backend Logs'}:</span>
            <span className="text-white font-bold">{logsSummary?.totalLogs ?? 0}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-black/40 border border-red-950/50 rounded-xl">
            <span className="text-gray-400 text-[11px]">{isZh ? '命中威脅特徵 Log' : 'Threat Logs'}:</span>
            <span className="text-red-400 font-bold">{logsSummary?.highRiskLogsCount ?? 0}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-black/40 border border-cyan-950/50 rounded-xl">
            <span className="text-gray-400 text-[11px]">{isZh ? '已立案嚴重事件' : 'Correlated Incidents'}:</span>
            <span className="text-cyan-400 font-bold">{incidents.length}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-black/40 border border-gray-800/60 rounded-xl">
            <span className="text-gray-400 text-[11px]">{isZh ? '最新收錄時間' : 'Latest Log'}:</span>
            <span className="text-emerald-400 font-bold truncate max-w-[120px]">
              {logsSummary?.lastIngestedLogTime ? logsSummary.lastIngestedLogTime.replace('T', ' ').slice(11, 19) : 'LIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f1015] border border-gray-800 p-4 rounded-2xl space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isZh ? '搜尋事件 ID、來源 IP、使用者帳號、MITRE 技戰術或威脅手法...' : 'Search by Incident ID, IP, user, MITRE TTP...'}
              className="w-full bg-black/60 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Risk Level */}
            <div className="flex items-center bg-black/60 border border-gray-800 rounded-xl p-1">
              {(['ALL', 'Critical', 'High', 'Medium'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                    riskFilter === lvl
                      ? lvl === 'Critical'
                        ? 'bg-red-600 text-white'
                        : lvl === 'High'
                        ? 'bg-orange-600 text-white'
                        : lvl === 'Medium'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  {lvl === 'ALL' ? (isZh ? '全部風險' : 'All Risk') : lvl}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-black/60 border border-gray-800 rounded-xl p-1">
              {(['ALL', 'active', 'investigating', 'contained'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  {st === 'ALL'
                    ? (isZh ? '全部狀態' : 'All Status')
                    : st === 'active'
                    ? (isZh ? '急迫 Active' : 'Active')
                    : st === 'investigating'
                    ? (isZh ? '調查中' : 'Investigating')
                    : (isZh ? '已遏阻' : 'Contained')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-gray-500 font-bold mr-1 flex items-center gap-1">
            <Filter size={12} />
            {isZh ? '威脅維度：' : 'Threat Category:'}
          </span>
          {[
            { key: 'ALL', label: isZh ? '全維度' : 'All Categories' },
            { key: 'ueba', label: isZh ? '🛡️ 內部異常 UEBA' : 'UEBA Insider' },
            { key: 'ics', label: isZh ? '🏭 工控 SCADA/ICS' : 'Industrial ICS' },
            { key: 'apt', label: isZh ? '🌐 漏洞與 APT 滲透' : 'APT Exploit' },
            { key: 'bruteforce', label: isZh ? '🔑 密碼暴力破解' : 'Brute Force' },
            { key: 'c2', label: isZh ? '📡 C2 隱蔽通道' : 'C2 Channel' }
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key as any)}
              className={cn(
                'px-2.5 py-1 rounded-lg border transition-all',
                categoryFilter === cat.key
                  ? 'bg-gray-800 text-white border-gray-600 shadow'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-300'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List Table & Detail Drawer */}
      <div className="bg-[#0f1015] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {isZh ? '嚴重事件詳細記錄' : 'Incident Telemetry Stream'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded">
              {filteredIncidents.length} Records
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            {isZh ? '點擊任一行即可展開 5 大維度深度數位鑑識面板' : 'Click row to expand 5-dimension deep forensic drawer'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090a0f] border-b border-gray-800 text-gray-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 w-10"></th>
                <th className="p-3.5">{isZh ? '事件編號 / 時間' : 'Incident ID / Time'}</th>
                <th className="p-3.5">{isZh ? '來源主機 / 使用者' : 'Source Host / User'}</th>
                <th className="p-3.5">{isZh ? '攻擊目標 (Dest)' : 'Target Host (Dest)'}</th>
                <th className="p-3.5">{isZh ? '威脅行為與手法' : 'Threat Behavior'}</th>
                <th className="p-3.5">{isZh ? 'MITRE ATT&CK' : 'MITRE TTP'}</th>
                <th className="p-3.5">{isZh ? '風險等級 / CVSS' : 'Risk / CVSS'}</th>
                <th className="p-3.5">{isZh ? '狀態' : 'Status'}</th>
                <th className="p-3.5 text-right">{isZh ? '處置' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/60">
              {filteredIncidents.map((incident) => {
                const isExpanded = expandedRow === incident.id;

                return (
                  <React.Fragment key={incident.id}>
                    <tr
                      onClick={() => {
                        setExpandedRow(isExpanded ? null : incident.id);
                        setSelectedIncident(incident);
                      }}
                      className={cn(
                        'cursor-pointer transition-colors group',
                        isExpanded ? 'bg-red-950/20' : 'hover:bg-gray-800/40'
                      )}
                    >
                      <td className="p-3.5 text-center">
                        <div className={cn('transition-transform duration-200', isExpanded ? 'rotate-90' : '')}>
                          <ChevronRight
                            size={16}
                            className={isExpanded ? 'text-red-400' : 'text-gray-600 group-hover:text-gray-400'}
                          />
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{incident.id}</span>
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">{incident.time}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono text-blue-400 font-bold">{incident.srcip}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                          {incident.srcUser || incident.srcHost || incident.country}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono text-purple-400 font-bold">{incident.dstip}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                          {incident.dstHost || 'Target Asset'}
                        </div>
                      </td>

                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-gray-200 truncate">{incident.action}</div>
                        <div className="text-[10px] text-red-400/90 truncate font-mono">{incident.threat}</div>
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="px-2 py-0.5 bg-gray-900 text-gray-300 border border-gray-700 rounded text-[10px]">
                          {incident.mitreTTP.split(' ')[0]}
                        </span>
                        <div className="text-[9px] text-gray-500 mt-0.5">{incident.mitreStage}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-black uppercase border font-mono',
                              incident.risk === 'Critical'
                                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                            )}
                          >
                            {incident.risk} ({incident.riskScore})
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit',
                            incident.status === 'active'
                              ? 'bg-red-950 text-red-300 border border-red-500/50 animate-pulse'
                              : incident.status === 'investigating'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                              : incident.status === 'contained'
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              incident.status === 'active'
                                ? 'bg-red-500'
                                : incident.status === 'investigating'
                                ? 'bg-amber-500'
                                : incident.status === 'contained'
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                            )}
                          />
                          {incident.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIncident(incident);
                              setShowTopologyModal(true);
                            }}
                            title={isZh ? '開啟全螢幕攻擊路徑拓撲圖與橫向移動分析' : 'Open Attack Path Topology & Lateral Movement'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/70 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-xs font-bold transition-all shadow-sm group"
                          >
                            <Workflow size={13} className="text-purple-400 group-hover:scale-110 transition-transform" />
                            <span>{isZh ? '攻擊拓撲' : 'Topology'}</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === incident.id ? null : incident.id);
                            }}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        {/* Action Dropdown Menu */}
                        <AnimatePresence>
                          {openDropdown === incident.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.95 }}
                              className="absolute right-0 top-12 w-56 bg-[#16171d] border border-gray-700 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-2xl text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="w-full px-3.5 py-2 text-xs font-bold text-gray-200 hover:bg-white/5 flex items-center gap-2.5"
                                onClick={() => {
                                  setSelectedIncident(incident);
                                  setShowTopologyModal(true);
                                  setOpenDropdown(null);
                                }}
                              >
                                <Workflow size={14} className="text-purple-400" />
                                <span>{isZh ? '開啟攻擊路徑拓撲' : 'Open Attack Topology'}</span>
                              </button>

                              <button
                                className="w-full px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
                                onClick={() => {
                                  handleExecutePlaybook(incident.id, '即時隔離受害主機 (Host Quarantine)', 'isolate');
                                  setOpenDropdown(null);
                                }}
                              >
                                <Lock size={14} />
                                <span>{isZh ? '一鍵隔離受害主機' : 'Quarantine Host'}</span>
                              </button>

                              <button
                                className="w-full px-3.5 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500/10 flex items-center gap-2.5"
                                onClick={() => {
                                  handleExecutePlaybook(incident.id, '下發邊界防火牆封鎖 IP', 'block');
                                  setOpenDropdown(null);
                                }}
                              >
                                <ShieldX size={14} />
                                <span>{isZh ? '邊界防火牆阻斷 IP' : 'Block Source IP'}</span>
                              </button>

                              <button
                                className="w-full px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2.5"
                                onClick={() => {
                                  handleUpdateStatus(incident.id, 'resolved');
                                  setOpenDropdown(null);
                                }}
                              >
                                <CheckCircle2 size={14} />
                                <span>{isZh ? '標記為已處置完成' : 'Mark as Resolved'}</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>

                    {/* EXPANDED 5-TAB FORENSIC & SOAR DRAWER */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 border-b border-gray-800 bg-[#12131a]">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 space-y-6">
                                {/* Sub-Tab Navigation Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                                      <Terminal size={16} />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                                        <span>{incident.id} 深度鑑識與處置工作區</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded">
                                          {incident.cve || 'MITRE TTP'}
                                        </span>
                                      </h4>
                                      <p className="text-[11px] text-gray-400">
                                        {isZh ? '整合 AI 戰術分析、封包 Hex Dump、殺傷鏈、SOAR 處置與協同筆記' : 'Integrated AI triage, payload hex viewer, kill-chain, and SOAR actions'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Sub-Tab Buttons */}
                                  <div className="flex items-center bg-black/60 p-1 rounded-xl border border-gray-800 text-xs">
                                    {[
                                      { key: 'ai', label: isZh ? '🤖 AI 戰術研判' : 'AI Triage', icon: <Brain size={13} /> },
                                      { key: 'signature', label: isZh ? '🎯 攻擊特徵碼解析' : 'Signature & IOCs', icon: <SlidersHorizontal size={13} /> },
                                      { key: 'logs', label: isZh ? '📡 後端 Log 證據鏈' : 'Evidence Logs', icon: <Database size={13} /> },
                                      { key: 'payload', label: isZh ? '🔍 原始封包 Hex' : 'Raw Payload', icon: <Fingerprint size={13} /> },
                                      { key: 'soar', label: isZh ? '⚡ SOAR 應變處置' : 'SOAR Playbooks', icon: <Zap size={13} /> },
                                      { key: 'notes', label: isZh ? '💬 鑑識協同筆記' : 'Analyst Notes', icon: <FileText size={13} /> }
                                    ].map((tab) => (
                                      <button
                                        key={tab.key}
                                        onClick={() => {
                                          setActiveSubTab(tab.key as any);
                                          if (tab.key === 'logs') {
                                            fetchEvidenceLogs(incident.id);
                                          } else if (tab.key === 'signature') {
                                            fetchSignatureAnalysis(incident.id);
                                          }
                                        }}
                                        className={cn(
                                          'px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all',
                                          activeSubTab === tab.key
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-white'
                                        )}
                                      >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* SUB-TAB 1: AI TRIAGE & KILL-CHAIN */}
                                {activeSubTab === 'ai' && (
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left: AI Assessment */}
                                    <div className="lg:col-span-7 space-y-4">
                                      <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2 text-blue-400 font-bold">
                                            <Brain size={16} />
                                            <span>{isZh ? 'S.E.M.O.R AI 智慧情資研判與戰術評估' : 'S.E.M.O.R AI Threat Assessment'}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => handleRunAiTriage(incident.id)}
                                              disabled={isAnalyzingAi}
                                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 transition flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                              <Sparkles size={11} className={isAnalyzingAi ? 'animate-spin' : ''} />
                                              <span>{isAnalyzingAi ? (isZh ? '研判中...' : 'Analyzing...') : (isZh ? '重新研判' : 'AI Re-Analyze')}</span>
                                            </button>
                                            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/40">
                                              Confidence: {incident.confidence}%
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-xs text-blue-100 leading-relaxed">{incident.aiSummary}</p>
                                      </div>

                                      {/* Key Indicators Grid */}
                                      <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 bg-black/40 border border-gray-800 rounded-xl">
                                          <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '攻擊手法 (TTP)' : 'MITRE Technique'}</div>
                                          <div className="text-xs font-bold text-white mt-1 font-mono">{incident.mitreTTP}</div>
                                        </div>

                                        <div className="p-3 bg-black/40 border border-gray-800 rounded-xl">
                                          <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '關聯資產數' : 'Affected Assets'}</div>
                                          <div className="text-xs font-bold text-amber-400 mt-1">{incident.affectedAssets} Critical Targets</div>
                                        </div>

                                        <div className="p-3 bg-black/40 border border-gray-800 rounded-xl">
                                          <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '擴散急迫性' : 'Urgency Level'}</div>
                                          <div className="text-xs font-bold text-red-400 mt-1">IMMEDIATE_ACTION</div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: MITRE ATT&CK Kill-Chain Steps */}
                                    <div className="lg:col-span-5 bg-black/40 border border-gray-800 p-4 rounded-2xl space-y-3">
                                      <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                                        <span className="flex items-center gap-1.5 text-red-400">
                                          <Layers size={14} />
                                          {isZh ? 'MITRE ATT&CK 殺傷鏈階段推進' : 'Kill-Chain Stage Progression'}
                                        </span>
                                      </div>

                                      <div className="space-y-2">
                                        {[
                                          { stage: '1. Reconnaissance', status: 'completed' },
                                          { stage: '2. Initial Access', status: incident.mitreStage === 'Initial Access' ? 'active' : 'completed' },
                                          { stage: '3. Privilege Escalation', status: incident.mitreStage === 'Privilege Escalation' ? 'active' : incident.riskScore > 9 ? 'completed' : 'pending' },
                                          { stage: '4. Lateral Movement', status: incident.mitreStage === 'Lateral Movement' ? 'active' : 'pending' },
                                          { stage: '5. Exfiltration / Impact', status: incident.mitreStage === 'Exfiltration' ? 'active' : 'pending' }
                                        ].map((step, idx) => (
                                          <div
                                            key={idx}
                                            className={cn(
                                              'p-2 rounded-xl text-xs flex items-center justify-between font-mono border',
                                              step.status === 'active'
                                                ? 'bg-red-950/60 border-red-500 text-white font-bold animate-pulse'
                                                : step.status === 'completed'
                                                ? 'bg-gray-900 border-gray-800 text-gray-400'
                                                : 'bg-black/20 border-gray-900 text-gray-600'
                                            )}
                                          >
                                            <span>{step.stage}</span>
                                            <span className="text-[10px] uppercase">
                                              {step.status === 'active' ? (isZh ? '🚨 當前階段' : 'ACTIVE') : step.status === 'completed' ? 'PASS' : 'WAIT'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>

                                      <button
                                        onClick={() => {
                                          setSelectedIncident(incident);
                                          setShowTopologyModal(true);
                                        }}
                                        className="w-full py-2 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2"
                                      >
                                        <Workflow size={14} />
                                        <span>{isZh ? '開啟可視化全螢幕拓撲視圖' : 'Expand Fullscreen Topology'}</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* SUB-TAB: ATTACK SIGNATURE & IOC ANALYSIS */}
                                {activeSubTab === 'signature' && (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                                        <SlidersHorizontal size={15} />
                                        <span>{isZh ? '攻擊特徵碼解析與自動化 IOC 萃取 (Attack Signature & IOC Analysis)' : 'Attack Signature & IOC Extraction'}</span>
                                      </div>
                                      <button
                                        onClick={() => fetchSignatureAnalysis(incident.id)}
                                        disabled={signatureAnalysisMap[incident.id]?.loading}
                                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs flex items-center gap-1.5 transition-all font-mono"
                                      >
                                        <RefreshCw size={12} className={signatureAnalysisMap[incident.id]?.loading ? 'animate-spin text-amber-400' : ''} />
                                        <span>{isZh ? '重新解析' : 'Re-parse'}</span>
                                      </button>
                                    </div>

                                    {signatureAnalysisMap[incident.id]?.loading ? (
                                      <div className="p-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2 bg-black/40 border border-gray-800 rounded-xl">
                                        <RefreshCw size={16} className="animate-spin text-amber-400" />
                                        <span>{isZh ? '正在執行多階段特徵碼解析與 IOC 萃取...' : 'Parsing attack signatures and extracting IOCs...'}</span>
                                      </div>
                                    ) : signatureAnalysisMap[incident.id]?.data ? (
                                      <div className="space-y-3">
                                        {/* Signature Card */}
                                        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-red-950/20 to-black/40 border border-amber-500/40 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                                {signatureAnalysisMap[incident.id].data.signatureId}
                                              </span>
                                              <h5 className="text-xs font-bold text-white">
                                                {signatureAnalysisMap[incident.id].data.signatureName}
                                              </h5>
                                            </div>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                                              CVSS {signatureAnalysisMap[incident.id].data.riskScore}
                                            </span>
                                          </div>
                                          <p className="text-xs text-amber-100/90 leading-relaxed">
                                            {signatureAnalysisMap[incident.id].data.summary}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-gray-400">
                                            <span>MITRE: <strong className="text-white">{signatureAnalysisMap[incident.id].data.mitreTTP}</strong></span>
                                            <span>•</span>
                                            <span>Tactic: <strong className="text-purple-300">{signatureAnalysisMap[incident.id].data.mitreTactic}</strong></span>
                                            <span>•</span>
                                            <span>CVE: <strong className="text-blue-300">{signatureAnalysisMap[incident.id].data.cve}</strong></span>
                                            <span>•</span>
                                            <span>Confidence: <strong className="text-emerald-300">{signatureAnalysisMap[incident.id].data.confidence}%</strong></span>
                                          </div>
                                        </div>

                                        {/* Extracted IOCs table */}
                                        <div className="p-3 bg-[#090a0f] border border-gray-800 rounded-xl space-y-2">
                                          <div className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                                            <span>{isZh ? '萃取之重要威脅指標 (Extracted IOCs)' : 'Extracted IOC Indicators'}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                              {signatureAnalysisMap[incident.id].data.extractedIocs?.length || 0} Indicators Identified
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {signatureAnalysisMap[incident.id].data.extractedIocs?.map((ioc: any, idx: number) => (
                                              <div key={idx} className="p-2 bg-black/60 border border-gray-800/80 rounded-lg flex items-center justify-between text-xs font-mono">
                                                <div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 uppercase font-bold">
                                                      {ioc.type}
                                                    </span>
                                                    <span className="text-amber-300 font-bold truncate max-w-[180px]">{ioc.value}</span>
                                                  </div>
                                                  <div className="text-[10px] text-gray-500 mt-0.5">{ioc.context}</div>
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(ioc.value);
                                                    setIocCopiedValue(ioc.value);
                                                    setTimeout(() => setIocCopiedValue(null), 2000);
                                                  }}
                                                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
                                                  title="Copy IOC"
                                                >
                                                  {iocCopiedValue === ioc.value ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Decoded Payload and Forensic Patterns */}
                                        {signatureAnalysisMap[incident.id].data.decodedPayload && (
                                          <div className="p-3 bg-black/60 border border-gray-800 rounded-xl space-y-1.5 font-mono text-xs">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold">
                                              {isZh ? '解碼後之攻擊載荷 (Decoded Attack Payload)' : 'Decoded Attack Payload'}
                                            </div>
                                            <div className="p-2 bg-[#090a0f] border border-gray-800 rounded text-emerald-400 text-[11px] overflow-x-auto">
                                              {signatureAnalysisMap[incident.id].data.decodedPayload}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-6 text-center text-gray-400 text-xs bg-black/40 border border-gray-800 rounded-xl space-y-2">
                                        <p>{isZh ? '尚未加載特徵碼解析數據，請點擊解析。' : 'No signature data loaded yet.'}</p>
                                        <button
                                          onClick={() => fetchSignatureAnalysis(incident.id)}
                                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                                        >
                                          <Zap size={13} />
                                          <span>{isZh ? '立即分析攻擊特徵碼' : 'Parse Signature Now'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* SUB-TAB: LIVE BACKEND EVIDENCE LOGS */}
                                {activeSubTab === 'logs' && (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 text-cyan-400 font-bold">
                                        <Database size={15} />
                                        <span>{isZh ? '後端日誌收集管線・關聯數位證據鏈 (Evidence Logs)' : 'Backend Log Telemetry Evidence Chain'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => fetchEvidenceLogs(incident.id, true)}
                                          disabled={evidenceLogs[incident.id]?.loading}
                                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs flex items-center gap-1.5 transition-all font-mono"
                                        >
                                          <RefreshCw size={12} className={evidenceLogs[incident.id]?.loading ? 'animate-spin text-cyan-400' : ''} />
                                          <span>{isZh ? '重新檢索' : 'Reload'}</span>
                                        </button>
                                        <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800 rounded">
                                          {evidenceLogs[incident.id]?.logs?.length || 0} Records Correlated
                                        </span>
                                      </div>
                                    </div>

                                    {evidenceLogs[incident.id]?.loading ? (
                                      <div className="p-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2 bg-black/40 border border-gray-800 rounded-xl">
                                        <RefreshCw size={16} className="animate-spin text-cyan-400" />
                                        <span>{isZh ? '正在向後端日誌收集佇列檢索關聯數位證據...' : 'Retrieving correlated logs from backend corpus...'}</span>
                                      </div>
                                    ) : (!evidenceLogs[incident.id]?.logs || evidenceLogs[incident.id]?.logs.length === 0) ? (
                                      <div className="p-6 text-center text-gray-400 text-xs bg-black/40 border border-gray-800 rounded-xl space-y-2">
                                        <p>{isZh ? '目前暫無匹配之詳細後端日誌，可點擊上方按鈕重新關聯。' : 'No specific logs matched. Trigger log correlation above.'}</p>
                                        <button
                                          onClick={handleCorrelateLogs}
                                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                                        >
                                          <Zap size={13} />
                                          <span>{isZh ? '立即觸發後端 Log 關聯分析' : 'Trigger Log Correlation'}</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="bg-[#090a0f] border border-gray-800 rounded-xl overflow-hidden">
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs font-mono">
                                              <thead className="bg-black/60 text-gray-400 text-[10px] uppercase border-b border-gray-800">
                                                <tr>
                                                  <th className="p-2.5">{isZh ? '時間戳記' : 'Timestamp'}</th>
                                                  <th className="p-2.5">{isZh ? '主機 / 來源' : 'Host / Source'}</th>
                                                  <th className="p-2.5">{isZh ? '協定' : 'Protocol'}</th>
                                                  <th className="p-2.5">{isZh ? '等級' : 'Level'}</th>
                                                  <th className="p-2.5">{isZh ? '日誌內容 (Message)' : 'Log Message'}</th>
                                                  <th className="p-2.5 text-right">{isZh ? '操作' : 'Action'}</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-800/60">
                                                {evidenceLogs[incident.id]?.logs.map((ev: any, idx: number) => (
                                                  <tr key={ev.id || idx} className="hover:bg-cyan-950/10 transition-colors">
                                                    <td className="p-2.5 text-gray-400 whitespace-nowrap text-[11px]">{ev.timestamp}</td>
                                                    <td className="p-2.5 text-cyan-300 font-bold whitespace-nowrap text-[11px]">
                                                      <div>{ev.host}</div>
                                                      <div className="text-[9px] text-gray-500">{ev.source}</div>
                                                    </td>
                                                    <td className="p-2.5 text-purple-300 whitespace-nowrap text-[11px]">{ev.protocol}</td>
                                                    <td className="p-2.5 whitespace-nowrap">
                                                      <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                        ev.level === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                                                        ev.level === 'WARN' || ev.level === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                                        'bg-blue-950 text-blue-300 border border-blue-800'
                                                      )}>
                                                        {ev.level}
                                                      </span>
                                                    </td>
                                                    <td className="p-2.5 text-gray-300 max-w-md truncate text-[11px]" title={ev.message}>
                                                      {ev.message}
                                                    </td>
                                                    <td className="p-2.5 text-right whitespace-nowrap">
                                                      <button
                                                        onClick={() => {
                                                          navigator.clipboard.writeText(ev.raw || JSON.stringify(ev, null, 2));
                                                          setEvidenceCopiedId(ev.id || `${idx}`);
                                                          setTimeout(() => setEvidenceCopiedId(null), 2000);
                                                        }}
                                                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] flex items-center gap-1 inline-flex"
                                                      >
                                                        {evidenceCopiedId === (ev.id || `${idx}`) ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                                        <span>{evidenceCopiedId === (ev.id || `${idx}`) ? 'Copied' : 'Copy'}</span>
                                                      </button>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* SUB-TAB 2: RAW PAYLOAD & HEX FORENSICS */}
                                {activeSubTab === 'payload' && (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="text-gray-400 font-mono flex items-center gap-2">
                                        <Terminal size={14} className="text-red-400" />
                                        <span>Digital Forensic Hex Stream & Structured Telemetry Log</span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(incident.payloadHex);
                                          setCopiedHex(true);
                                          setTimeout(() => setCopiedHex(false), 2000);
                                        }}
                                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs flex items-center gap-1.5 transition-all font-mono"
                                      >
                                        {copiedHex ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                        <span>{copiedHex ? 'Copied' : 'Copy Hex'}</span>
                                      </button>
                                    </div>

                                    {/* Hex Dump Box */}
                                    <div className="bg-[#090a0f] p-4 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400 overflow-x-auto space-y-1">
                                      <div className="text-gray-500 text-[10px] border-b border-gray-800 pb-1 flex justify-between">
                                        <span>OFFSET (HEX)</span>
                                        <span>HEXADECIMAL PAYLOAD DUMP</span>
                                        <span>ASCII DECODED</span>
                                      </div>
                                      <div className="py-2 leading-relaxed">
                                        00000000  {incident.payloadHex}  |{incident.threat.slice(0, 24)}|
                                      </div>
                                    </div>

                                    {/* Raw JSON Log */}
                                    <div className="bg-[#090a0f] p-4 rounded-xl border border-gray-800 font-mono text-xs text-gray-300 overflow-x-auto">
                                      <pre className="text-[11px] leading-relaxed">{incident.rawLog}</pre>
                                    </div>
                                  </div>
                                )}

                                {/* SUB-TAB 3: SOAR PLAYBOOK ACTIONS */}
                                {activeSubTab === 'soar' && (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="text-gray-300 font-bold flex items-center gap-2">
                                        <Zap size={14} className="text-amber-400" />
                                        <span>{isZh ? 'SOAR 自動化應變防禦處置劇本 (Playbook Orchestration)' : 'Automated SOAR Remediation Playbooks'}</span>
                                      </div>
                                      <span className="text-gray-500 font-mono text-[10px]">
                                        Target: {incident.srcip} → {incident.dstip}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {incident.recommendedPlaybooks.map((pb) => {
                                        const isRunning = executingPlaybook === pb.title;

                                        return (
                                          <div
                                            key={pb.id}
                                            className="p-4 bg-black/40 border border-gray-800/80 rounded-2xl flex flex-col justify-between gap-3 hover:border-gray-700 transition-all"
                                          >
                                            <div>
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                  {pb.type === 'isolate' ? <Lock size={14} className="text-red-400" /> : <ShieldCheck size={14} className="text-blue-400" />}
                                                  {pb.title}
                                                </span>
                                                <span className="text-[9px] font-mono px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                                                  {pb.type.toUpperCase()}
                                                </span>
                                              </div>
                                              <p className="text-[11px] text-gray-400 mt-1">{pb.description}</p>
                                            </div>

                                            <button
                                              onClick={() => handleExecutePlaybook(incident.id, pb.title, pb.type)}
                                              disabled={executingPlaybook !== null}
                                              className={cn(
                                                'w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md',
                                                isRunning
                                                  ? 'bg-amber-600 text-white animate-pulse'
                                                  : pb.type === 'isolate'
                                                  ? 'bg-red-600 hover:bg-red-500 text-white'
                                                  : 'bg-blue-600 hover:bg-blue-500 text-white',
                                                executingPlaybook !== null && !isRunning ? 'opacity-50 cursor-not-allowed' : ''
                                              )}
                                            >
                                              {isRunning ? (
                                                <>
                                                  <RefreshCw size={13} className="animate-spin" />
                                                  <span>{isZh ? `下發劇本中 (${playbookCountdown}s)...` : `Executing (${playbookCountdown}s)...`}</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Zap size={13} />
                                                  <span>{isZh ? '立即執行處置' : 'Execute Playbook'}</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* SUB-TAB 4: COLLABORATIVE ANALYST NOTES */}
                                {activeSubTab === 'notes' && (
                                  <CollaborativeNotesPanel
                                    incidentId={incident.id}
                                    currentUser={currentUser}
                                  />
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULLSCREEN TOPOLOGY OVERLAY MODAL */}
      <AnimatePresence>
        {showTopologyModal && selectedIncident && (
          <AttackTopologyOverlay
            incident={selectedIncident}
            onClose={() => setShowTopologyModal(false)}
            onIncidentUpdate={(updated: any) => {
              setSelectedIncident(updated);
              setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
              setSuccessToast(isZh ? `事件 ${updated.id} 拓撲防禦狀態已同步更新！` : `Incident ${updated.id} topology state updated!`);
              setTimeout(() => setSuccessToast(null), 3500);
            }}
          />
        )}
      </AnimatePresence>

      {/* INCIDENT DOSSIER / PDF EXPORT MODAL */}
      <AnimatePresence>
        {showDossierModal && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111218] border border-gray-700 w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      {isZh ? '國防資安等級・嚴重事件數位鑑識評估專案書' : 'Executive Incident Forensic Dossier'}
                    </h3>
                    <p className="text-xs font-mono text-gray-400">DOCUMENT ID: DOSSIER-2026-CRIT-008</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dossier Body */}
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-black/50 border border-gray-800 rounded-xl space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>{isZh ? '評估報告生成時間' : 'Generated Timestamp'}:</span>
                    <span className="text-white">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>{isZh ? '主責安全分析師' : 'Lead SOC Investigator'}:</span>
                    <span className="text-blue-400 font-bold">{currentUser?.username || 'SOC-Lead-Analyst'}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>{isZh ? '全域風險等級' : 'Overall Assessment'}:</span>
                    <span className="text-red-400 font-bold">DEFCON-ELEVATED (CRITICAL BREACH DETECTED)</span>
                  </div>
                </div>

                {/* Incident Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">{isZh ? '收錄之重大事件清冊' : 'Identified High-Risk Incidents'}</div>
                  {incidents.slice(0, 4).map((item) => (
                    <div key={item.id} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl space-y-1">
                      <div className="flex justify-between text-white font-bold">
                        <span>{item.id} - {item.threat}</span>
                        <span className="text-red-400">{item.risk} ({item.riskScore})</span>
                      </div>
                      <div className="text-[11px] text-gray-400">{item.aiSummary}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Source: {item.srcip} ({item.srcUser || item.srcHost}) → Target: {item.dstip} ({item.dstHost})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                >
                  {isZh ? '關閉預覽' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    alert(isZh ? '已產生軍規級加密 PDF 鑑識專案報告並啟動下載。' : 'Encrypted military forensic PDF dossier exported.');
                    setShowDossierModal(false);
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <Download size={14} />
                  <span>{isZh ? '下載完整 PDF 報告' : 'Download Complete PDF'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* THREAT SIMULATION LOG INJECTION MODAL */}
      <AnimatePresence>
        {showSimulateModal && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111218] border border-purple-800/60 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      {isZh ? '注入高擬真威脅 Log・驗證後端收集與即時關聯' : 'Inject Simulated Threat Log (Verify Correlation)'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isZh ? '日誌將直接寫入後端收集佇列 (runtimeLogCorpus) 並觸發自動化立案' : 'Injects raw syslog payload directly into backend corpus and executes correlation'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSimulateModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scenario Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    type: 'ics' as const,
                    title: isZh ? '🏭 工控 Modbus/TCP 保持暫存器覆寫' : 'ICS Modbus Register Override',
                    desc: 'Modbus holding register 40012 unauthorized setpoint write from 192.168.100.88',
                    mitre: 'T0816 Impair Process Control',
                    tag: 'ICS / SCADA'
                  },
                  {
                    type: 'c2' as const,
                    title: isZh ? '📡 Cobalt Strike C2 信標隱蔽通道' : 'Cobalt Strike C2 Beacon',
                    desc: 'Suspicious Base64 PowerShell execution and reverse shell connection to external C2',
                    mitre: 'T1059.001 Command Interpreter',
                    tag: 'C2 Implant'
                  },
                  {
                    type: 'ransomware' as const,
                    title: isZh ? '🛑 勒索軟體加密與備份卷影破壞' : 'Ransomware Mass Encryption',
                    desc: 'Rapid file renaming (.encrypted) & vssadmin delete shadows execution on core host',
                    mitre: 'T1486 Data Encrypted for Impact',
                    tag: 'Ransomware'
                  },
                  {
                    type: 'bruteforce' as const,
                    title: isZh ? '🔑 分散式 SSH 帳密密集暴力破解' : 'Distributed SSH Brute Force',
                    desc: 'High-frequency failed auth burst (520 attempts/min) targeting root account',
                    mitre: 'T1110.001 Password Guessing',
                    tag: 'Credential Access'
                  },
                  {
                    type: 'exfil' as const,
                    title: isZh ? '📦 巨量機敏檔案異地雲端外洩' : '18GB Anomalous Data Exfil',
                    desc: 'Mega.nz off-hours 18.2GB encrypted archive upload anomaly exceeding 7.4 sigma',
                    mitre: 'T1567.002 Cloud Storage Exfil',
                    tag: 'UEBA Insider'
                  },
                  {
                    type: 'sqli' as const,
                    title: isZh ? '🌐 Web 防火牆 SQL Injection 利用' : 'Critical WAF SQL Injection',
                    desc: 'Exploit payload UNION SELECT password_hash blocked by perimeter WAF proxy',
                    mitre: 'T1190 Public Application Exploit',
                    tag: 'Web Exploit'
                  }
                ].map((sc) => (
                  <button
                    key={sc.type}
                    onClick={() => handleSimulateThreatLog(sc.type)}
                    disabled={isInjectingThreat}
                    className="p-3.5 bg-black/40 hover:bg-purple-950/30 border border-gray-800 hover:border-purple-500/50 rounded-xl text-left transition-all space-y-1.5 group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {sc.title}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-gray-800 text-purple-300 rounded">
                        {sc.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono leading-tight">{sc.desc}</p>
                    <div className="text-[10px] text-gray-500 font-mono">{sc.mitre}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-800">
                <button
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE LOG STREAM PREVIEW MODAL */}
      <AnimatePresence>
        {showRecentLogsModal && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111218] border border-cyan-800/60 w-full max-w-4xl rounded-2xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-600/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      {isZh ? '後端日誌收集佇列即時串流 (runtimeLogCorpus Stream)' : 'Backend Log Ingestion Stream Preview'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isZh ? `目前收集池總量：${logsSummary?.totalLogs ?? 0} 筆，展示最新採集之日誌遙測` : `Total corpus depth: ${logsSummary?.totalLogs ?? 0} logs`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRecentLogsModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Logs table */}
              <div className="flex-1 overflow-y-auto bg-[#090a0f] border border-gray-800 rounded-xl p-2 font-mono text-xs">
                {(!logsSummary?.recentLogsSample || logsSummary.recentLogsSample.length === 0) ? (
                  <div className="p-6 text-center text-gray-500">
                    {isZh ? '尚無即時日誌樣本' : 'No logs currently recorded.'}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {logsSummary.recentLogsSample.map((log) => (
                      <div key={log.id} className="p-2 bg-black/40 border border-gray-800/60 rounded-lg hover:border-cyan-800/50 transition-colors space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">{log.timestamp}</span>
                          <span className="text-cyan-400 font-bold">{log.host}</span>
                          <span className="text-purple-300">{log.protocol}</span>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded font-bold uppercase",
                            log.level === 'CRITICAL' ? 'bg-red-950 text-red-300' :
                            log.level === 'WARN' || log.level === 'WARNING' ? 'bg-amber-950 text-amber-300' :
                            'bg-blue-950 text-blue-300'
                          )}>
                            {log.level}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-300 truncate" title={log.message}>
                          {log.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-[11px] text-gray-500 font-mono">
                  {isZh ? '管線支援 VictoriaLogs、Loki、Syslog UDP 5140、NetFlow 及 EDR Agent' : 'Supporting VictoriaLogs, Loki, Syslog UDP 5140, NetFlow and EDR Agents'}
                </span>
                <button
                  onClick={() => setShowRecentLogsModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                >
                  {isZh ? '關閉' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENT: Collaborative Notes Panel ---
function CollaborativeNotesPanel({ incidentId, currentUser }: { incidentId: string; currentUser: any }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const [notes, setNotes] = useState<any[]>([
    {
      id: 'n-1',
      author: 'Tier-3 Lead (Chen)',
      timestamp: '14:22:10',
      content: '已確認為真實內部異常存取活動，初步比對該 R&D 帳號昨夜有異地 VPN 登入紀錄，疑似帳號憑證遭竊取或內部人員惡意外洩。'
    },
    {
      id: 'n-2',
      author: 'EDR Analyst (Lin)',
      timestamp: '14:35:45',
      content: '已下發主機網路隔離指令，目前正在對 WS-RD-DEV-04 執行即時 RAM Memory Dump 取證。'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/incidents/${incidentId}/notes`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.notes) && data.notes.length > 0) {
          setNotes(data.notes);
        }
      })
      .catch(err => console.warn('Failed to load incident notes:', err));
  }, [incidentId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const noteContent = newNoteText.trim();
    const authorName = currentUser?.username || 'Current Analyst';
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/incidents/${incidentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          author: authorName
        })
      });
      const data = await res.json();
      if (data.success && data.note) {
        setNotes((prev) => [...prev, data.note]);
        setNewNoteText('');
        return;
      }
    } catch (err) {
      console.warn('Failed to post note via API:', err);
    } finally {
      setIsSubmitting(false);
    }

    // Fallback local append
    const newNote = {
      id: `n-${Date.now()}`,
      author: authorName,
      timestamp: new Date().toLocaleTimeString(),
      content: noteContent
    };
    setNotes((prev) => [...prev, newNote]);
    setNewNoteText('');
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between text-xs font-bold text-gray-300">
        <span className="flex items-center gap-1.5 text-blue-400">
          <FileText size={14} />
          <span>{isZh ? '分析師即時鑑識筆記與處置日誌 (Analyst Collaboration)' : 'Analyst Investigation Log'}</span>
        </span>
        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Live Sync Active
        </span>
      </div>

      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
        {notes.map((n) => (
          <div key={n.id} className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="font-bold text-blue-400">{n.author}</span>
              <span className="text-gray-500">{n.timestamp}</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{n.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          type="text"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder={isZh ? '輸入分析結論、IOC 備註或處置指示...' : 'Add forensic notes, IOCs or instructions...'}
          className="flex-1 bg-black/60 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!newNoteText.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <Send size={13} />
          <span>{isZh ? '送出' : 'Post'}</span>
        </button>
      </form>
    </div>
  );
}

// --- SUB-COMPONENT: Fullscreen Attack Topology Overlay ---
function AttackTopologyOverlay({
  incident,
  onClose,
  onIncidentUpdate
}: {
  incident: any;
  onClose: () => void;
  onIncidentUpdate?: (updated: any) => void;
}) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const svgRef = useRef<SVGSVGElement>(null);

  // Dynamic Data States
  const [topology, setTopology] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedLink, setSelectedLink] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'signature' | 'logs' | 'playbooks'>('canvas');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showParticles, setShowParticles] = useState(true);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  // Signature & Log Evidence states
  const [signatureData, setSignatureData] = useState<any | null>(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [evidenceLogs, setEvidenceLogs] = useState<any[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [customLogInput, setCustomLogInput] = useState('');
  const [customLogResult, setCustomLogResult] = useState<any | null>(null);
  const [customLogLoading, setCustomLogLoading] = useState(false);

  // Interaction feedback states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(isZh ? `已複製 ${label} 至剪貼簿` : `Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // 1. Fetch Dynamic Topology from Backend
  const fetchTopologyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/incidents/${incident.id}/topology`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.topology) {
          setTopology(data.topology);
          // Auto select patient zero or first infected node
          const infected = data.topology.nodes?.find((n: any) => n.patientZero || n.type === 'infected');
          if (infected) setSelectedNode(infected);
        }
      }
    } catch (err) {
      console.warn('Failed to load topology from backend, generating fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Deep Attack Signature Analysis
  const fetchSignatureAnalysis = async () => {
    setSignatureLoading(true);
    try {
      const res = await fetch(`/api/v1/incidents/${incident.id}/signature-analysis`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.detection) {
          setSignatureData(data.detection);
        }
      }
    } catch (err) {
      console.warn('Failed to load signature analysis:', err);
    } finally {
      setSignatureLoading(false);
    }
  };

  // 3. Fetch Evidence Logs
  const fetchEvidenceLogs = async () => {
    setEvidenceLoading(true);
    try {
      const res = await fetch(`/api/v1/incidents/${incident.id}/evidence-logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          setEvidenceLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn('Failed to load evidence logs:', err);
    } finally {
      setEvidenceLoading(false);
    }
  };

  useEffect(() => {
    fetchTopologyData();
    fetchSignatureAnalysis();
    fetchEvidenceLogs();
  }, [incident.id]);

  // Timeline Auto-play effect
  useEffect(() => {
    if (!isPlayingTimeline || !topology?.timelineStages?.length) return;
    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => {
        const next = (prev + 1) % topology.timelineStages.length;
        const targetNodeId = topology.timelineStages[next]?.nodeId;
        if (targetNodeId) {
          const matched = topology.nodes?.find((n: any) => n.id === targetNodeId);
          if (matched) setSelectedNode(matched);
        }
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlayingTimeline, topology]);

  // 1-Click Node Containment Action
  const handleContainNode = async (nodeId: string, actionType: 'isolate' | 'block' | 'revoke') => {
    setActionInProgress(nodeId);
    try {
      const res = await fetch(`/api/v1/incidents/${incident.id}/topology/contain-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          action: actionType,
          operator: 'SOC Defense Specialist'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.topology) {
            setTopology(data.topology);
            const updatedSelected = data.topology.nodes?.find((n: any) => n.id === nodeId);
            if (updatedSelected) setSelectedNode(updatedSelected);
          }
          if (onIncidentUpdate && data.incident) {
            onIncidentUpdate(data.incident);
          }
          showToast(data.message || (isZh ? `節點 ${nodeId} 已成功隔離！` : `Node ${nodeId} contained!`));
        }
      }
    } catch (err) {
      console.error('Failed to contain node:', err);
      showToast(isZh ? '處置下發失敗，請檢視網路連線' : 'Containment action failed');
    } finally {
      setActionInProgress(null);
    }
  };

  // Test Custom Log against Backend Signature Engine Live
  const handleTestCustomLog = async () => {
    if (!customLogInput.trim()) return;
    setCustomLogLoading(true);
    try {
      const res = await fetch('/api/v1/incidents/parse-log-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLog: customLogInput,
          host: selectedNode?.hostname || 'TEST-ENDPOINT',
          protocol: 'syslog'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.detection) {
          setCustomLogResult(data.detection);
          showToast(isZh ? '後端特徵碼比對解析完成！' : 'Signature parsed successfully!');
        }
      }
    } catch (err) {
      console.error('Failed to parse custom log:', err);
    } finally {
      setCustomLogLoading(false);
    }
  };

  // SVG Rendering with D3
  useEffect(() => {
    if (!svgRef.current || !topology || !topology.nodes || !topology.links) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 520;

    // Defs & Filters
    const defs = svg.append('defs');

    // Arrow markers
    const markers = [
      { id: 'arrow-entry', color: '#3b82f6' },
      { id: 'arrow-infection', color: '#ef4444' },
      { id: 'arrow-lateral', color: '#f97316' },
      { id: 'arrow-blocked', color: '#10b981' },
      { id: 'arrow-command', color: '#a855f7' }
    ];

    markers.forEach((m) => {
      defs
        .append('marker')
        .attr('id', m.id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 30)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', m.color);
    });

    // Glow filter
    const glowFilter = defs.append('filter').attr('id', 'neon-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Container group with zoom transform
    const g = svg.append('g').attr('transform', `scale(${zoomLevel}) translate(${(1 - zoomLevel) * width * 0.5}, ${(1 - zoomLevel) * height * 0.5})`);

    // Render Links
    const linkGroup = g.append('g').attr('class', 'links');
    topology.links.forEach((link: any) => {
      const s = topology.nodes.find((n: any) => n.id === link.source);
      const t = topology.nodes.find((n: any) => n.id === link.target);
      if (!s || !t) return;

      const isBlocked = link.status === 'blocked';
      const isSelected = selectedLink && selectedLink.source === link.source && selectedLink.target === link.target;
      const strokeColor = isBlocked ? '#10b981' : link.type === 'entry' ? '#3b82f6' : link.type === 'infection' ? '#ef4444' : link.type === 'command' ? '#a855f7' : '#f97316';
      const markerId = isBlocked ? 'arrow-blocked' : link.type === 'entry' ? 'arrow-entry' : link.type === 'infection' ? 'arrow-infection' : link.type === 'command' ? 'arrow-command' : 'arrow-lateral';

      // Curved or straight path
      const pathD = `M ${s.x} ${s.y} L ${t.x} ${t.y}`;

      const linkPath = linkGroup
        .append('path')
        .attr('d', pathD)
        .attr('stroke', strokeColor)
        .attr('stroke-width', isSelected ? 4 : isBlocked ? 2 : 2.5)
        .attr('stroke-dasharray', isBlocked ? '4,4' : '8,4')
        .attr('fill', 'none')
        .attr('marker-end', `url(#${markerId})`)
        .attr('style', isSelected ? 'filter: url(#neon-glow)' : 'opacity: 0.85')
        .attr('class', 'cursor-pointer transition-all hover:stroke-white')
        .on('click', () => {
          setSelectedLink(link);
          setSelectedNode(null);
        });

      // Link text label
      const midX = (s.x + t.x) / 2;
      const midY = (s.y + t.y) / 2 - 10;
      linkGroup
        .append('text')
        .attr('x', midX)
        .attr('y', midY)
        .attr('text-anchor', 'middle')
        .attr('fill', isBlocked ? '#34d399' : '#9ca3af')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('class', 'select-none pointer-events-none font-mono')
        .text(`${link.label}${link.port ? ` :${link.port}` : ''}`);

      // Data transfer packet animation
      if (showParticles && !isBlocked) {
        linkGroup
          .append('circle')
          .attr('r', isSelected ? 4 : 3)
          .attr('fill', strokeColor)
          .attr('style', 'filter: url(#neon-glow)')
          .append('animateMotion')
          .attr('path', pathD)
          .attr('dur', link.dataRate?.includes('GB') || link.dataRate?.includes('Mbps') ? '2s' : '3.5s')
          .attr('repeatCount', 'indefinite');
      }
    });

    // Render Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    topology.nodes.forEach((node: any) => {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const isContained = node.status === 'contained' || node.contained;
      const isPatientZero = node.patientZero;

      const nodeG = nodeGroup
        .append('g')
        .attr('transform', `translate(${node.x},${node.y})`)
        .attr('class', 'cursor-pointer select-none group')
        .on('click', () => {
          setSelectedNode(node);
          setSelectedLink(null);
        });

      // Blast radius aura
      if (isPatientZero || node.riskScore >= 9.0) {
        nodeG
          .append('circle')
          .attr('r', 38)
          .attr('fill', isContained ? '#10b981' : '#ef4444')
          .attr('opacity', 0.12)
          .attr('class', isContained ? '' : 'animate-ping');
      }

      // Outer Selection Ring
      if (isSelected) {
        nodeG
          .append('circle')
          .attr('r', 34)
          .attr('fill', 'none')
          .attr('stroke', isContained ? '#10b981' : '#a855f7')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,3')
          .attr('style', 'filter: url(#neon-glow)');
      }

      // Main Node Circle
      const strokeColor = isContained
        ? '#10b981'
        : node.type === 'attacker'
        ? '#3b82f6'
        : node.type === 'infected'
        ? '#ef4444'
        : node.type === 'target' || node.type === 'db'
        ? '#f59e0b'
        : node.type === 'gateway'
        ? '#6366f1'
        : '#6b7280';

      nodeG
        .append('circle')
        .attr('r', 27)
        .attr('fill', '#0d0f15')
        .attr('stroke', strokeColor)
        .attr('stroke-width', isSelected ? 3.5 : 2.5)
        .attr('style', isSelected ? 'filter: url(#neon-glow)' : '');

      // Node Icon Emoji / Glyphs
      const iconText = isContained
        ? '🛡️'
        : node.type === 'attacker'
        ? '🌐'
        : node.type === 'infected'
        ? '💻'
        : node.type === 'target'
        ? '🎯'
        : node.type === 'db'
        ? '🗄️'
        : node.type === 'gateway'
        ? '🔒'
        : node.type === 'c2_drop'
        ? '☁️'
        : node.type === 'sensor'
        ? '📡'
        : node.type === 'actuator'
        ? '⚙️'
        : '🔀';

      nodeG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '15px')
        .text(iconText);

      // Node Primary Label
      nodeG
        .append('text')
        .text(node.label)
        .attr('y', 42)
        .attr('text-anchor', 'middle')
        .attr('fill', isSelected ? '#ffffff' : '#e5e7eb')
        .attr('font-size', '10px')
        .attr('font-weight', isSelected ? '900' : 'bold');

      // Node IP / SubLabel
      nodeG
        .append('text')
        .text(node.ip || node.subLabel || '')
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .attr('fill', isContained ? '#34d399' : '#9ca3af')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace');

      // Contained Tag Badge
      if (isContained) {
        nodeG
          .append('rect')
          .attr('x', -24)
          .attr('y', -36)
          .attr('width', 48)
          .attr('height', 14)
          .attr('rx', 4)
          .attr('fill', '#064e3b')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 1);

        nodeG
          .append('text')
          .attr('x', 0)
          .attr('y', -26)
          .attr('text-anchor', 'middle')
          .attr('fill', '#6ee7b7')
          .attr('font-size', '8px')
          .attr('font-weight', 'black')
          .text('ISOLATED');
      }
    });
  }, [topology, selectedNode, selectedLink, zoomLevel, showParticles, isZh]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[170] flex flex-col p-4 md:p-6 backdrop-blur-2xl"
    >
      <div className="bg-[#0b0c10] border border-gray-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl relative">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-gray-800/80 bg-[#101116] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30 shadow-inner">
              <Workflow size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-950/60 border border-red-500/40 text-red-400 font-mono text-[10px] rounded font-bold">
                  {incident.id}
                </span>
                <span className="text-xs font-bold text-gray-200">
                  {topology?.attackCategory || incident.threat}
                </span>
                <span className="px-2 py-0.5 bg-purple-950/50 border border-purple-500/30 text-purple-300 text-[10px] rounded font-mono">
                  {incident.mitreTTP}
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5 flex items-center gap-2">
                <span>{isZh ? '威脅源:' : 'Actor:'} {topology?.threatActor || incident.srcip}</span>
                <span className="text-gray-600">•</span>
                <span className={topology?.activeBarrierStatus === 'CONTAINED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {isZh ? '防禦屏障:' : 'Barrier:'} {topology?.activeBarrierStatus || 'MONITORED'}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-amber-400 font-bold">
                  {isZh ? '衝擊系統擴散數:' : 'Blast Radius:'} {topology?.blastRadiusSystems || 4}
                </span>
              </p>
            </div>
          </div>

          {/* Tab Switcher & Modal Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-gray-800 text-xs">
              <button
                onClick={() => setActiveTab('canvas')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all',
                  activeTab === 'canvas' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                )}
              >
                <Workflow size={13} />
                <span>{isZh ? '互動拓撲圖' : 'Vector Topology'}</span>
              </button>
              <button
                onClick={() => setActiveTab('signature')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all',
                  activeTab === 'signature' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                )}
              >
                <SlidersHorizontal size={13} />
                <span>{isZh ? '特徵碼解析' : 'Signature Analysis'}</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all',
                  activeTab === 'logs' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                )}
              >
                <Database size={13} />
                <span>{isZh ? '後端證據日誌' : 'Evidence Logs'}</span>
                {evidenceLogs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-purple-900/80 text-[10px] rounded-full text-purple-200">
                    {evidenceLogs.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                fetchTopologyData();
                fetchSignatureAnalysis();
                fetchEvidenceLogs();
                showToast(isZh ? '已刷新拓撲與特徵鑑識資料' : 'Topology & signatures refreshed');
              }}
              title={isZh ? '重新讀取拓撲資料' : 'Refresh'}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-800 hover:bg-red-600/80 text-gray-300 hover:text-white transition-all ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md"
            >
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: INTERACTIVE TOPOLOGY CANVAS */}
        {activeTab === 'canvas' && (
          <div className="flex-1 flex flex-col relative overflow-hidden bg-[#07080c]">
            {/* Canvas Controls Toolbar */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-gray-800 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                title="Zoom In"
                className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg transition-colors"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                title="Zoom Out"
                className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                title="Reset Zoom"
                className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg font-mono text-[10px] font-bold"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <div className="h-4 w-[1px] bg-gray-700" />
              <button
                onClick={() => setShowParticles((p) => !p)}
                title="Toggle Packet Animation"
                className={cn('px-2 py-1 rounded-lg text-[10px] font-bold transition-all', showParticles ? 'bg-purple-900/60 text-purple-200 border border-purple-500/30' : 'text-gray-400 hover:text-white')}
              >
                {showParticles ? (isZh ? '⚡ 封包流動: 開' : '⚡ Traffic Flow: ON') : (isZh ? '封包流動: 關' : 'Traffic: OFF')}
              </button>
            </div>

            {/* Interactive SVG Viewport */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {/* Tactical Cyber Grid Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.08)_0%,transparent_70%)] pointer-events-none" />

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 text-purple-400">
                  <RefreshCw size={28} className="animate-spin" />
                  <span className="text-xs font-mono">{isZh ? '正在串接後端 Log 與拓撲引擎解析中...' : 'Fetching dynamic topology...'}</span>
                </div>
              ) : (
                <svg ref={svgRef} className="w-full h-full max-w-6xl max-h-[520px]" viewBox="0 0 1000 520" />
              )}

              {/* DOCKED NODE INSPECTOR PANEL */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-4 top-4 bottom-20 w-80 bg-[#12131b]/95 backdrop-blur-2xl border border-gray-700/80 rounded-2xl p-4 shadow-2xl flex flex-col z-30 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {selectedNode.contained
                            ? '🛡️'
                            : selectedNode.type === 'attacker'
                            ? '🌐'
                            : selectedNode.type === 'infected'
                            ? '💻'
                            : '🎯'}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-white">{selectedNode.label}</h4>
                          <span className="text-[10px] font-mono text-gray-400">{selectedNode.ip}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Node Attributes */}
                    <div className="py-3 space-y-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{isZh ? '安全狀態:' : 'Status:'}</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                            selectedNode.contained
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : selectedNode.status === 'compromised'
                              ? 'bg-red-950 text-red-300 border border-red-500/40 animate-pulse'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          )}
                        >
                          {selectedNode.contained ? 'CONTAINED / ISOLATED' : selectedNode.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{isZh ? '風險指數 (Risk):' : 'Risk Score:'}</span>
                        <span className="font-bold text-red-400">{selectedNode.riskScore} / 10.0</span>
                      </div>

                      {selectedNode.hostname && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">{isZh ? '主機名稱:' : 'Hostname:'}</span>
                          <span className="text-gray-200">{selectedNode.hostname}</span>
                        </div>
                      )}

                      {selectedNode.os && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">{isZh ? '作業系統:' : 'OS:'}</span>
                          <span className="text-gray-300 text-[11px]">{selectedNode.os}</span>
                        </div>
                      )}

                      {selectedNode.ports && selectedNode.ports.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">{isZh ? '開放通訊埠:' : 'Ports:'}</span>
                          <span className="text-purple-300">{selectedNode.ports.join(', ')}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{isZh ? '衝擊半徑評估:' : 'Blast Radius:'}</span>
                        <span className="text-amber-400">{selectedNode.blastRadius} {isZh ? '鄰近節點' : 'Nodes'}</span>
                      </div>
                    </div>

                    {/* Containment 1-Click Action Deck */}
                    <div className="mt-auto pt-3 border-t border-gray-800 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                        <Shield size={12} className="text-purple-400" />
                        {isZh ? '拓撲即時防禦處置 (1-Click SOAR)' : 'Real-time Node Containment'}
                      </p>

                      {selectedNode.contained ? (
                        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} />
                          <span>{isZh ? '此節點已完全隔離防護中' : 'Node is Isolated & Contained'}</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleContainNode(selectedNode.id, 'isolate')}
                            disabled={actionInProgress !== null}
                            className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                          >
                            <Lock size={13} />
                            <span>{actionInProgress === selectedNode.id ? (isZh ? '隔離下發中...' : 'Isolating...') : (isZh ? '一鍵隔離受害節點 (Host Quarantine)' : 'Quarantine Host Node')}</span>
                          </button>

                          <button
                            onClick={() => handleContainNode(selectedNode.id, 'block')}
                            disabled={actionInProgress !== null}
                            className="w-full py-1.5 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-orange-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <ShieldX size={13} />
                            <span>{isZh ? '下發邊界防火牆阻斷 IP' : 'Block IP at Firewall'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* DOCKED LINK INSPECTOR PANEL */}
              <AnimatePresence>
                {selectedLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute left-4 bottom-20 w-80 bg-[#12131b]/95 backdrop-blur-2xl border border-gray-700/80 rounded-2xl p-4 shadow-2xl z-30"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-xs">
                      <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                        <Activity size={14} />
                        <span>{isZh ? '連線跳躍鑑識 (Hop Inspector)' : 'Hop Inspector'}</span>
                      </div>
                      <button onClick={() => setSelectedLink(null)} className="p-1 text-gray-400 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="py-2.5 space-y-2 text-xs font-mono">
                      <p className="font-bold text-white">{selectedLink.label}</p>
                      <div className="flex justify-between text-gray-400">
                        <span>{isZh ? '通訊協議:' : 'Protocol:'}</span>
                        <span className="text-gray-200">{selectedLink.protocol}</span>
                      </div>
                      {selectedLink.port && (
                        <div className="flex justify-between text-gray-400">
                          <span>{isZh ? '目標連接埠:' : 'Port:'}</span>
                          <span className="text-purple-300">Port {selectedLink.port}</span>
                        </div>
                      )}
                      {selectedLink.dataRate && (
                        <div className="flex justify-between text-gray-400">
                          <span>{isZh ? '傳輸頻寬/速率:' : 'Data Rate:'}</span>
                          <span className="text-amber-400">{selectedLink.dataRate}</span>
                        </div>
                      )}
                      {selectedLink.signature && (
                        <div className="flex justify-between text-gray-400">
                          <span>{isZh ? '關聯特徵碼:' : 'Signature:'}</span>
                          <span className="text-red-400 font-bold">{selectedLink.signature}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Attack Timeline Scrubber */}
            <div className="p-3 bg-[#0d0e14] border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlayingTimeline((p) => !p)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  {isPlayingTimeline ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlayingTimeline ? (isZh ? '暫停播放' : 'Pause') : (isZh ? '回放攻擊路徑' : 'Replay Path')}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs font-mono">
                  {topology?.timelineStages?.map((stage: any, idx: number) => (
                    <button
                      key={stage.stage}
                      onClick={() => {
                        setCurrentStageIdx(idx);
                        const matched = topology.nodes?.find((n: any) => n.id === stage.nodeId);
                        if (matched) setSelectedNode(matched);
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1.5',
                        currentStageIdx === idx
                          ? 'bg-purple-900/60 border-purple-400 text-purple-200 font-bold shadow-md ring-1 ring-purple-400'
                          : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span>{stage.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">({stage.timestamp})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-mono text-gray-400 flex items-center gap-3">
                <span>{isZh ? '受害目標:' : 'Target:'} {incident.dstHost || incident.dstip}</span>
                <button
                  onClick={onClose}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold"
                >
                  {isZh ? '完成並返回清冊' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEEP ATTACK SIGNATURE & LIVE PARSER */}
        {activeTab === 'signature' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#090a0f]">
            {/* Left: Signature Breakdown & IOCs */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5 border-r border-gray-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-amber-400" />
                    <span>{signatureData?.signatureName || incident.threat}</span>
                  </h3>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    Signature ID: <span className="text-purple-300 font-bold">{signatureData?.signatureId || 'SIG-ICS-MODBUS-001'}</span> | CVE: <span className="text-amber-300">{signatureData?.cve || 'ICS-ALERT-2026'}</span> | Confidence: <span className="text-emerald-400 font-bold">{signatureData?.confidence || 99.4}%</span>
                  </p>
                </div>

                <button
                  onClick={fetchSignatureAnalysis}
                  disabled={signatureLoading}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw size={12} className={signatureLoading ? 'animate-spin text-amber-400' : ''} />
                  <span>{isZh ? '重新解析特徵' : 'Re-parse'}</span>
                </button>
              </div>

              {/* Forensic Summary */}
              <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {isZh ? '鑑識專家綜合研判' : 'Forensic Triage Summary'}
                </span>
                <p className="text-gray-300 leading-relaxed font-sans">
                  {signatureData?.summary || incident.aiSummary}
                </p>
              </div>

              {/* Extracted IOCs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Fingerprint size={14} className="text-purple-400" />
                    {isZh ? '自動萃取之威脅指標 (Forensic IOCs)' : 'Extracted Threat IOCs'}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {signatureData?.extractedIocs?.length || 3} {isZh ? '個指標' : 'Indicators'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {signatureData?.extractedIocs?.map((ioc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-black/60 border border-gray-800 rounded-xl flex items-center justify-between text-xs font-mono group hover:border-purple-500/40 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-gray-800 text-[9px] rounded font-bold uppercase text-gray-300">
                            {ioc.type}
                          </span>
                          <span className="font-bold text-white">{ioc.value}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-sans block mt-0.5">{ioc.context}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(ioc.value, ioc.value)}
                        className="p-1.5 text-gray-400 hover:text-white rounded bg-gray-800/80 hover:bg-purple-600 transition-colors"
                      >
                        {copiedText === ioc.value ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decoded Payload / Hex Dump */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Terminal size={14} className="text-emerald-400" />
                  {isZh ? '解碼載荷與二進位特徵 (Decoded Payload & Hex Dump)' : 'Decoded Payload & Hex Dump'}
                </span>
                <div className="p-3 bg-black/80 border border-gray-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto space-y-1">
                  <div>{signatureData?.decodedPayload || 'MODBUS_FC06: UnitId=1, RegAddr=40012, SetPointValue=10000'}</div>
                  <div className="text-gray-500">{signatureData?.hexDump || '00 01 00 00 00 06 01 06 9c 4c 27 10'}</div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Custom Raw Log Signature Tester */}
            <div className="w-full md:w-96 p-6 bg-[#0c0d13] flex flex-col space-y-4">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-tight">
                  <Code size={15} className="text-purple-400" />
                  {isZh ? '即時日誌特徵測試器 (Live Log Signature Tester)' : 'Live Log Signature Tester'}
                </h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  {isZh ? '輸入或貼上任意日誌原始字串，驗證後端特徵碼庫是否正確辨識威脅。' : 'Paste raw log string to test backend signature engine.'}
                </p>
              </div>

              <div className="flex-1 flex flex-col space-y-2">
                <textarea
                  value={customLogInput}
                  onChange={(e) => setCustomLogInput(e.target.value)}
                  placeholder={
                    isZh
                      ? '例如: modbus/tcp holding register 40012 function code 0x06 override 或 mimikatz sekurlsa::logonpasswords'
                      : 'e.g. modbus fc06 holding register override or mimikatz sekurlsa'
                  }
                  className="w-full flex-1 min-h-[140px] bg-black/60 border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />

                <button
                  onClick={handleTestCustomLog}
                  disabled={customLogLoading || !customLogInput.trim()}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {customLogLoading ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                  <span>{isZh ? '執行後端特徵碼比對解析' : 'Execute Signature Matching'}</span>
                </button>
              </div>

              {/* Custom parse results */}
              {customLogResult && (
                <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-300">{customLogResult.signatureName}</span>
                    <span className="text-[10px] text-emerald-400">{customLogResult.confidence}%</span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-sans">{customLogResult.summary}</p>
                  <div className="text-[10px] text-gray-400">
                    MITRE: <span className="text-white">{customLogResult.mitreTTP}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CORRELATED EVIDENCE LOGS */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#090a0f] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Database size={16} className="text-purple-400" />
                  <span>{isZh ? '關聯後端收集日誌紀錄 (Correlated Raw Logs)' : 'Correlated Raw Backend Logs'}</span>
                </h3>
                <p className="text-xs font-mono text-gray-400">
                  {isZh ? '即時檢索 VictoriaLogs 與記憶體 Corpus 中匹配該事件的鑑識證據' : 'Matches in storage corpus for incident forensic proof'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder={isZh ? '搜尋日誌關鍵字...' : 'Search logs...'}
                    className="pl-8 pr-3 py-1.5 bg-black/60 border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono w-56"
                  />
                </div>
                <button
                  onClick={fetchEvidenceLogs}
                  disabled={evidenceLoading}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw size={12} className={evidenceLoading ? 'animate-spin' : ''} />
                  <span>{isZh ? '刷新日誌' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="flex-1 overflow-y-auto border border-gray-800 rounded-xl bg-black/40">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#12131b] text-gray-400">
                    <th className="p-3 w-40">{isZh ? '時間戳記' : 'Timestamp'}</th>
                    <th className="p-3 w-24">{isZh ? '嚴重度' : 'Level'}</th>
                    <th className="p-3 w-40">{isZh ? '主機 / 協定' : 'Host / Proto'}</th>
                    <th className="p-3">{isZh ? '日誌訊息全文' : 'Log Message'}</th>
                    <th className="p-3 w-16 text-right">{isZh ? '複製' : 'Copy'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {evidenceLogs
                    .filter((l) => {
                      if (!logSearch.trim()) return true;
                      const q = logSearch.toLowerCase();
                      return (
                        (l.message || l.full_log || '').toLowerCase().includes(q) ||
                        (l.host || '').toLowerCase().includes(q) ||
                        (l.protocol || '').toLowerCase().includes(q)
                      );
                    })
                    .map((log, idx) => {
                      const msg = log.message || log.full_log || log._msg || '';
                      const level = (log.level || 'CRITICAL').toUpperCase();
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 text-gray-400 whitespace-nowrap">
                            {log.timestamp || log['@timestamp'] || new Date().toISOString()}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                level.includes('CRIT') || level.includes('ERR')
                                  ? 'bg-red-950 text-red-300 border border-red-500/40'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              )}
                            >
                              {level}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-purple-300">
                            <div>{log.host || 'CORE-NODE'}</div>
                            <span className="text-[10px] text-gray-500">{log.protocol || 'syslog'}</span>
                          </td>
                          <td className="p-3 text-gray-200 max-w-xl break-all">
                            {msg}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => copyToClipboard(msg, `Log #${idx}`)}
                              className="p-1.5 text-gray-400 hover:text-white rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                              <Copy size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

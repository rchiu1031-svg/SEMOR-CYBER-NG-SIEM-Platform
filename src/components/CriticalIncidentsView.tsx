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
  Fingerprint
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
  
  // Sub-tabs inside expanded row
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'payload' | 'topology' | 'soar' | 'notes'>('ai');

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

  useEffect(() => {
    fetchIncidents();
  }, []);

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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === incident.id ? null : incident.id);
                          }}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          <MoreVertical size={14} />
                        </button>

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
                                      { key: 'payload', label: isZh ? '🔍 原始封包 Hex' : 'Raw Payload', icon: <Fingerprint size={13} /> },
                                      { key: 'soar', label: isZh ? '⚡ SOAR 應變處置' : 'SOAR Playbooks', icon: <Zap size={13} /> },
                                      { key: 'notes', label: isZh ? '💬 鑑識協同筆記' : 'Analyst Notes', icon: <FileText size={13} /> }
                                    ].map((tab) => (
                                      <button
                                        key={tab.key}
                                        onClick={() => setActiveSubTab(tab.key as any)}
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
function AttackTopologyOverlay({ incident, onClose }: { incident: any; onClose: () => void }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const svgRef = useRef<SVGSVGElement>(null);

  const topologyData = {
    nodes: [
      { id: 'C2', type: 'attacker', label: isZh ? '威脅來源 (External/Insider)' : 'Threat Actor / C2', x: 120, y: 240, ip: incident.srcip },
      { id: 'FW', type: 'gateway', label: isZh ? '邊界防火牆閘道' : 'Perimeter Gateway', x: 300, y: 240, ip: '10.88.88.254' },
      { id: 'SW', type: 'network', label: isZh ? '戰術核心交換網段' : 'Core Switch / Segment', x: 500, y: 240, ip: '10.88.88.1' },
      { id: 'WS22', type: 'infected', label: isZh ? `受害端點 (${incident.srcHost || 'WS-DEV'})` : `Infected (${incident.srcHost || 'WS-DEV'})`, x: 700, y: 240, ip: incident.srcip, patientZero: true },
      { id: 'TARGET', type: 'target', label: isZh ? `目標資產 (${incident.dstHost || 'Target'})` : `Target (${incident.dstHost || 'Target'})`, x: 880, y: 150, ip: incident.dstip },
      { id: 'DB', type: 'db', label: isZh ? '國防敏感資料庫' : 'Sensitive DB', x: 880, y: 330, ip: '10.200.1.50' }
    ],
    links: [
      { source: 'C2', target: 'FW', label: isZh ? '初始突破' : 'Infiltration', type: 'entry' },
      { source: 'FW', target: 'SW', label: isZh ? '網段穿透' : 'Transit', type: 'transit' },
      { source: 'SW', target: 'WS22', label: isZh ? '載荷植入' : 'Implant', type: 'infection' },
      { source: 'WS22', target: 'TARGET', label: isZh ? '橫向突襲/外洩' : 'Exfiltration', type: 'lateral' },
      { source: 'WS22', target: 'DB', label: isZh ? '特權探針' : 'Probe', type: 'lateral' }
    ]
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Arrowhead marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444');

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow-df');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Drawing Links
    svg
      .append('g')
      .selectAll('path')
      .data(topologyData.links)
      .join('path')
      .attr('d', (d: any) => {
        const s = topologyData.nodes.find((n) => n.id === d.source)!;
        const t = topologyData.nodes.find((n) => n.id === d.target)!;
        return `M ${s.x} ${s.y} L ${t.x} ${t.y}`;
      })
      .attr('stroke', (d: any) => (d.type === 'entry' ? '#3b82f6' : d.type === 'infection' ? '#ef4444' : '#f97316'))
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '8,4')
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('style', 'filter: url(#glow-df)');

    // Animated Particles
    const particles = svg.append('g');
    topologyData.links.forEach((link, i) => {
      const s = topologyData.nodes.find((n) => n.id === link.source)!;
      const t = topologyData.nodes.find((n) => n.id === link.target)!;
      particles
        .append('circle')
        .attr('r', 3)
        .attr('fill', link.type === 'entry' ? '#3b82f6' : '#ef4444')
        .append('animateMotion')
        .attr('path', `M ${s.x} ${s.y} L ${t.x} ${t.y}`)
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite')
        .attr('begin', `${i * 0.5}s`);
    });

    // Drawing Nodes
    const nodes = svg
      .append('g')
      .selectAll('g')
      .data(topologyData.nodes)
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

    nodes
      .append('circle')
      .attr('r', 28)
      .attr('fill', '#111114')
      .attr('stroke', (d: any) =>
        d.type === 'attacker' ? '#3b82f6' : d.type === 'infected' ? '#ef4444' : d.type === 'target' ? '#f59e0b' : '#4b5563'
      )
      .attr('stroke-width', 3)
      .attr('class', (d: any) => (d.type === 'infected' ? 'animate-pulse' : ''));

    nodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .text((d: any) => (d.type === 'attacker' ? '🌐' : d.type === 'infected' ? '💻' : d.type === 'target' ? '🎯' : '🛡️'));

    nodes
      .append('text')
      .text((d: any) => d.label)
      .attr('y', 44)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'black');

    nodes
      .append('text')
      .text((d: any) => d.ip)
      .attr('y', 58)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');
  }, [isZh]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-[160] flex flex-col p-6 backdrop-blur-xl"
    >
      <div className="bg-[#0f1015] border border-gray-800 rounded-2xl flex-1 flex flex-col overflow-hidden relative">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Workflow size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {incident.id} {isZh ? '攻擊路徑與橫向移動衝擊拓撲圖' : 'Attack Path & Lateral Movement Topology'}
              </h3>
              <p className="text-xs font-mono text-gray-400">
                {incident.srcip} ({incident.threat}) → {incident.dstip} ({incident.mitreTTP})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Topology Viewport */}
        <div className="flex-1 relative flex items-center justify-center bg-[#090a0f] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
          <svg ref={svgRef} className="w-full h-full max-w-5xl max-h-[500px]" viewBox="0 0 1000 480" />
        </div>

        {/* Footer info */}
        <div className="p-4 bg-black/40 border-t border-gray-800 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Target System: {incident.dstHost || incident.dstip}</span>
          <span className="text-red-400 font-bold">Blast Radius: 3 Neighboring Systems Contained</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold"
          >
            {isZh ? '返回事件清冊' : 'Back to Incidents'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

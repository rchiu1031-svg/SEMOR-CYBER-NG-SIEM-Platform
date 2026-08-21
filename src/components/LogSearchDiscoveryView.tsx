import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Clock, ChevronDown, ChevronRight, X, Filter, Plus, Minus, Download, Share2, 
  Terminal, Shield, Zap, Globe, Brain, ShieldAlert, Cpu, HardDrive, Database, Monitor,
  Activity, Play, Pause, CheckCircle2, RotateCcw, AlertTriangle, Trash2, Save, Send, ShieldCheck,
  Building2, Eye, HelpCircle, FileText, Wifi, Bell, Webhook, Sparkles, AlertCircle, FileCode, Check,
  Calendar, Settings, Copy, Layers, List, Table, Code, ExternalLink, RefreshCw, Hash, Lock, 
  Crosshair, CornerDownRight, ArrowUpRight, ArrowDownRight, Tag, BookOpen, Bookmark
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface LogRecord {
  id: string | number;
  '@timestamp': string;
  source: string;
  event: string;
  event_type?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  src_ip?: string;
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
  proto?: string;
  action: 'Blocked' | 'Allowed' | 'Rate-limited' | 'Trapped' | 'Alerted' | 'Logged' | 'Quarantined';
  user?: string;
  host?: string;
  process?: string;
  file?: string;
  hash_sha256?: string;
  cve_id?: string;
  geo_country?: string;
  response_code?: number;
  latency_ms?: number;
  full_log: string;
  mitre_technique?: string;
  mitre_tactic?: string;
  ai_analysis?: string;
}

export interface QueryFilter {
  field: string;
  value: string;
  type: 'include' | 'exclude';
}

const SAMPLE_LOGS: LogRecord[] = [
  {
    id: 'log-001',
    '@timestamp': '2026-08-20T12:24:08Z',
    source: 'Palo Alto PA-5260 (WAN-FW)',
    event: 'Outbound C2 Beaconing to Suspicious Domain',
    event_type: 'threat_c2_communication',
    severity: 'Critical',
    src_ip: '10.88.88.106',
    dst_ip: '185.220.101.45',
    src_port: 49821,
    dst_port: 443,
    proto: 'TCP',
    action: 'Blocked',
    user: 'SYSTEM (NT AUTHORITY)',
    host: 'SOC-Analyst-WS07',
    process: 'powershell.exe',
    geo_country: 'RU',
    hash_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    cve_id: 'CVE-2024-30078',
    latency_ms: 1.2,
    mitre_technique: 'T1071.001 Web Protocols',
    mitre_tactic: 'Command and Control',
    ai_analysis: '端點 SOC-Analyst-WS07 透過 PowerShell 嘗試與已知 Lazarus APT 惡意中繼站 (185.220.101.45) 建立 TLS 443 加密通道，已被邊界防火牆主動阻斷。',
    full_log: 'Aug 20 12:24:08 fw-01-pa THREAT: alert,c2-traffic,10.88.88.106,185.220.101.45,49821,443,tcp,deny,domain="dark-c2-tunnel.onion.to",threat_id=992014,severity=critical,category=malware'
  },
  {
    id: 'log-002',
    '@timestamp': '2026-08-20T12:23:45Z',
    source: 'Wazuh EDR Sensor',
    event: 'Unauthorized LSASS Memory Dumping Attempt',
    event_type: 'credential_dumping',
    severity: 'Critical',
    src_ip: '10.88.88.202',
    dst_ip: '10.88.88.202',
    src_port: 0,
    dst_port: 0,
    proto: 'LOCAL',
    action: 'Quarantined',
    user: 'svc_backup_admin',
    host: 'DC-ActiveDirectory-01',
    process: 'procdump64.exe',
    file: 'C:\\Windows\\Temp\\lsass.dmp',
    hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    mitre_technique: 'T1003.001 LSASS Memory',
    mitre_tactic: 'Credential Access',
    ai_analysis: '偵測到 procdump64.exe 試圖調用 MiniDumpWriteDump API 傾印網域控制站 lsass.exe 記憶體以竊取 Kerberos NTLM 雜湊憑證，EDR 已即時中止程序並實施檔案隔離。',
    full_log: '{"timestamp":"2026-08-20T12:23:45Z","agent":{"id":"003","name":"DC-ActiveDirectory-01"},"rule":{"id":"100293","level":14,"description":"Procdump dumping LSASS memory for credential access"},"data":{"win":{"eventdata":{"image":"C:\\\\Tools\\\\procdump64.exe","targetProcess":"lsass.exe","user":"NT AUTHORITY\\\\SYSTEM"}}},"action":"process_terminated"}'
  },
  {
    id: 'log-003',
    '@timestamp': '2026-08-20T12:22:15Z',
    source: 'SEMOR Flow (NetFlow/IPFIX)',
    event: 'SYN Flood & TCP Port Sweep on Server DMZ',
    event_type: 'port_scan',
    severity: 'High',
    src_ip: '198.51.100.89',
    dst_ip: '10.88.88.200',
    src_port: 54102,
    dst_port: 5432,
    proto: 'TCP',
    action: 'Rate-limited',
    geo_country: 'NL',
    latency_ms: 0.4,
    mitre_technique: 'T1046 Network Service Discovery',
    mitre_tactic: 'Discovery',
    ai_analysis: '來自荷蘭公網 IP 198.51.100.89 在 5 秒內向伺服器區發送超過 2,500 次 SYN 請求探測 PostgreSQL (5432) 與 Kubernetes (6443) 連接埠，已被流量防護模組限速並記錄特徵。',
    full_log: 'FLOW-COLLECTOR: src=198.51.100.89 dst=10.88.88.200 proto=TCP flags=SYN pps=500 bytes=160000 action=RATE_LIMIT duration=5.1s'
  },
  {
    id: 'log-004',
    '@timestamp': '2026-08-20T12:21:02Z',
    source: 'PostgreSQL DB Audit (pgaudit)',
    event: 'SQL Syntax Injection & Union Extraction Attempt',
    event_type: 'database_injection',
    severity: 'High',
    src_ip: '10.88.88.201',
    dst_ip: '10.88.88.200',
    src_port: 41200,
    dst_port: 5432,
    proto: 'TCP',
    action: 'Blocked',
    user: 'app_backend_user',
    host: 'App-Kubernetes-Master',
    response_code: 42601,
    latency_ms: 3.4,
    mitre_technique: 'T1190 Exploit Public-Facing Application',
    mitre_tactic: 'Initial Access',
    ai_analysis: '應用伺服器傳送異常 SQL 語法：`SELECT * FROM users WHERE id = 1 UNION SELECT password_hash FROM admin_credentials;`，已被資料庫安全審計模組中斷並拒絕執行。',
    full_log: '2026-08-20 12:21:02.104 UTC [18442] app_backend_user@corp_db ERROR: 42601: syntax error in UNION query attempt [AUDIT: STATEMENT="SELECT * FROM users WHERE id = 1 UNION SELECT password_hash FROM admin_credentials;"]'
  },
  {
    id: 'log-005',
    '@timestamp': '2026-08-20T12:19:50Z',
    source: 'SEMOR Deception (Honeypot)',
    event: 'SSH Brute-Force Authentication Trap Triggered',
    event_type: 'honeypot_interaction',
    severity: 'Medium',
    src_ip: '45.33.22.11',
    dst_ip: '10.88.88.250',
    src_port: 58912,
    dst_port: 22,
    proto: 'TCP',
    action: 'Trapped',
    user: 'root',
    geo_country: 'CN',
    mitre_technique: 'T1110.001 Password Guessing',
    mitre_tactic: 'Credential Access',
    ai_analysis: '外部蜜罐節點誘捕到來自 45.33.22.11 的字典式 SSH 暴力破解攻擊，已紀錄其使用的 85 組預設密碼字典並將其 IP 自動同步至動態黑名單。',
    full_log: 'HONEYPOT-SENSOR-SSH: connection from 45.33.22.11:58912 user="root" password="Password123!" payload_len=14 client_version="SSH-2.0-libssh2_1.10.0" result=CAPTURED'
  },
  {
    id: 'log-006',
    '@timestamp': '2026-08-20T12:18:10Z',
    source: 'Active Directory Kerberos KDC',
    event: 'Kerberoasting Ticket Granting Service (TGS) Request',
    event_type: 'kerberoasting',
    severity: 'High',
    src_ip: '10.88.88.102',
    dst_ip: '10.88.88.202',
    src_port: 52140,
    dst_port: 88,
    proto: 'UDP',
    action: 'Alerted',
    user: 'analyst_chen',
    host: 'SOC-Analyst-WS02',
    mitre_technique: 'T1558.003 Kerberoasting',
    mitre_tactic: 'Credential Access',
    ai_analysis: '帳號 analyst_chen 突然向 Kerberos KDC 大量索取 RC4 加密之 SPN 服務票證（MSSQLSvc/db-cluster.corp.local），疑似嘗試進行離線雜湊破解。',
    full_log: 'EventID=4769 TaskCategory="Kerberos Service Ticket Operations" TargetUserName="MSSQLSvc/db-cluster.corp.local" TicketEncryptionType=0x17 (RC4-HMAC) ClientAddress="10.88.88.102" Result=0x0'
  },
  {
    id: 'log-007',
    '@timestamp': '2026-08-20T12:15:33Z',
    source: 'NGINX Ingress Controller',
    event: 'Directory Traversal & Path Manipulation /etc/shadow',
    event_type: 'web_path_traversal',
    severity: 'Medium',
    src_ip: '185.191.171.3',
    dst_ip: '10.88.88.201',
    src_port: 48900,
    dst_port: 443,
    proto: 'TCP',
    action: 'Blocked',
    response_code: 403,
    latency_ms: 0.8,
    geo_country: 'DE',
    mitre_technique: 'T1083 File and Directory Discovery',
    mitre_tactic: 'Discovery',
    ai_analysis: 'Web 流量包含路徑遍歷特徵 URI `../../../../etc/shadow`，NGINX ModSecurity WAF 已主動拒絕並回應 HTTP 403 Forbidden。',
    full_log: '185.191.171.3 - - [20/Aug/2026:12:15:33 +0800] "GET /api/v1/download?file=../../../../etc/shadow HTTP/1.1" 403 162 "-" "curl/7.88.1" WAF-RULE-930110'
  },
  {
    id: 'log-008',
    '@timestamp': '2026-08-20T12:12:00Z',
    source: 'Kubernetes Audit Log',
    event: 'Privileged Pod Creation with HostPID & HostNetwork',
    event_type: 'container_privilege_escalation',
    severity: 'High',
    src_ip: '10.88.88.201',
    dst_ip: '10.88.88.201',
    proto: 'HTTPS',
    action: 'Blocked',
    user: 'developer-ci',
    host: 'App-Kubernetes-Master',
    mitre_technique: 'T1611 Escape to Host',
    mitre_tactic: 'Privilege Escalation',
    ai_analysis: 'Kubernetes 準入控制器 (Kyverno / OPA Gatekeeper) 攔截到未授權之特權容器 Pod 建立請求 (hostPID: true, privileged: true)。',
    full_log: '{"kind":"Event","apiVersion":"audit.k8s.io/v1","level":"Metadata","stage":"ResponseComplete","verb":"create","user":{"username":"developer-ci"},"objectRef":{"resource":"pods","namespace":"default","name":"debug-root-escape"},"responseStatus":{"code":403,"message":"admission webhook denied: privileged pods forbidden"}}'
  },
  {
    id: 'log-009',
    '@timestamp': '2026-08-20T12:08:44Z',
    source: 'Vector VRL Pipeline',
    event: 'Syslog RFC5424 Transformation & Masking Completed',
    event_type: 'pipeline_transform',
    severity: 'Info',
    src_ip: '10.88.88.254',
    dst_ip: '10.88.88.203',
    proto: 'UDP',
    action: 'Logged',
    host: 'Core-Catalyst-9500',
    latency_ms: 0.1,
    ai_analysis: 'Vector 資料管道成功將來自核心交換機的原始 Syslog 串流完成 VRL 欄位正規化與個人機敏識別 (PII) 遮蔽處理。',
    full_log: 'VECTOR-NODE-01: metric_processed=1240 batch_size=500 schema=ECS-1.12 transform_status=OK latency=0.12ms destination=OpenSearch-SEMOR'
  },
  {
    id: 'log-010',
    '@timestamp': '2026-08-20T12:05:12Z',
    source: 'SEMOR Master Auth',
    event: 'SOC Analyst MFA Login Successful via FIDO2 Token',
    event_type: 'auth_success',
    severity: 'Low',
    src_ip: '10.88.88.101',
    dst_ip: '10.88.88.203',
    proto: 'HTTPS',
    action: 'Allowed',
    user: 'sec_admin_lin',
    host: 'SEMOR-SIEM-Ingestion',
    geo_country: 'TW',
    latency_ms: 12.5,
    mitre_technique: 'T1078 Valid Accounts',
    mitre_tactic: 'Defense Evasion',
    ai_analysis: '資安長 sec_admin_lin 使用硬體 FIDO2/WebAuthn 安全金鑰順利通過雙因子驗證登入 SEMOR 控制台。',
    full_log: '2026-08-20 12:05:12 [AUTH-AUDIT] user="sec_admin_lin" method="FIDO2-YubiKey" ip="10.88.88.101" role="SuperAdmin" session_id="sess_8941a9bf" result="SUCCESS"'
  }
];

const PRESET_QUERIES = [
  { label: '🚨 關鍵與高風險威脅', query: 'severity: "Critical" OR severity: "High"', desc: '篩選所有被評定為嚴重及高危險等級的安全日誌' },
  { label: '🛡️ 遭主動阻斷/隔離事件', query: 'action: "Blocked" OR action: "Quarantined"', desc: '查核邊界防火牆、WAF 及 EDR 成功攔截之攻擊' },
  { label: '🔑 身分驗證與憑證竊取', query: 'event_type: "credential_dumping" OR event_type: "kerberoasting"', desc: '鎖定 LSASS 記憶體傾印與 Kerberos 票證異常' },
  { label: '🌐 境外 IP 異常通訊', query: 'geo_country: "RU" OR geo_country: "CN" OR geo_country: "NL"', desc: '監控非境內來源或目標之連線紀錄' },
  { label: '🗄️ 資料庫 SQL 注入', query: 'source: "PostgreSQL" AND severity: "High"', desc: '檢索資料庫內部異常查詢與語法注入' },
  { label: '⚡ PowerShell / 命令列攻擊', query: 'process: "powershell.exe" OR process: "cmd.exe"', desc: '端點可疑腳本與行程執行追蹤' }
];

export default function LogSearchDiscoveryView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Search & Query States
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [timeRange, setTimeRange] = useState('Last 15 minutes');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filters, setFilters] = useState<QueryFilter[]>([
    { field: 'severity', value: 'Critical', type: 'include' }
  ]);

  // Selected & Available Fields
  const [selectedFields, setSelectedFields] = useState<string[]>([
    '@timestamp', 'severity', 'source', 'event', 'src_ip', 'dst_ip', 'action'
  ]);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');

  // UI View Modes & States
  const [viewFormat, setViewFormat] = useState<'table' | 'raw' | 'json'>('table');
  const [expandedLogId, setExpandedLogId] = useState<string | number | null>('log-001');
  const [selectedLogForModal, setSelectedLogForModal] = useState<LogRecord | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [liveStreamSpeed, setLiveStreamSpeed] = useState<number>(3000);
  const [isQueryHelperOpen, setIsQueryHelperOpen] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [activeFacetField, setActiveFacetField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [queryExecutionTime, setQueryExecutionTime] = useState(18);

  // Raw logs data buffer
  const [logRecords, setLogRecords] = useState<LogRecord[]>(SAMPLE_LOGS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live Stream Simulation
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const randomBase = SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];
      const now = new Date();
      const newLog: LogRecord = {
        ...randomBase,
        id: `stream-${Date.now()}`,
        '@timestamp': now.toISOString().replace(/\.\d+Z$/, 'Z'),
        src_port: Math.floor(Math.random() * 40000) + 10000,
        latency_ms: +(Math.random() * 2 + 0.1).toFixed(2)
      };
      setLogRecords(prev => [newLog, ...prev.slice(0, 49)]);
    }, liveStreamSpeed);
    return () => clearInterval(interval);
  }, [isLiveStreaming, liveStreamSpeed]);

  // Add / Remove Filter
  const addFilter = (field: string, value: string, type: 'include' | 'exclude' = 'include') => {
    if (!filters.some(f => f.field === field && f.value === value && f.type === type)) {
      setFilters([...filters, { field, value, type }]);
      showToast(isZh ? `已加入過濾條件: ${field} = "${value}" (${type === 'include' ? '包含' : '排除'})` : `Filter added: ${field}=${value}`);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Filtered Logs Evaluation
  const filteredLogs = useMemo(() => {
    return logRecords.filter(log => {
      // 1. Text Query Filter
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const matchesQuery = Object.values(log).some(val => 
          String(val).toLowerCase().includes(queryLower)
        );
        if (!matchesQuery) return false;
      }

      // 2. Structured Filters (Include / Exclude)
      for (const filter of filters) {
        const logVal = String((log as any)[filter.field] || '');
        if (filter.type === 'include') {
          if (logVal.toLowerCase() !== filter.value.toLowerCase()) {
            return false;
          }
        } else {
          if (logVal.toLowerCase() === filter.value.toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [logRecords, searchQuery, filters]);

  // Histogram Aggregation Data
  const histogramData = useMemo(() => {
    const timeSlots = [
      '12:00', '12:05', '12:10', '12:15', '12:20', '12:25'
    ];
    return timeSlots.map(time => {
      const countCritical = Math.floor(Math.random() * 8) + (time === '12:20' || time === '12:25' ? 12 : 2);
      const countHigh = Math.floor(Math.random() * 15) + 5;
      const countMedium = Math.floor(Math.random() * 25) + 10;
      const countLow = Math.floor(Math.random() * 40) + 20;
      return {
        time,
        Critical: countCritical,
        High: countHigh,
        Medium: countMedium,
        Low: countLow,
        Total: countCritical + countHigh + countMedium + countLow
      };
    });
  }, [filteredLogs]);

  // All Available Fields
  const allFields = useMemo(() => {
    const fieldSet = new Set<string>();
    SAMPLE_LOGS.forEach(log => {
      Object.keys(log).forEach(key => fieldSet.add(key));
    });
    return Array.from(fieldSet);
  }, []);

  // Compute Facet Values for the Active Selected Field
  const fieldFacetValues = useMemo(() => {
    if (!activeFacetField) return [];
    const counts: Record<string, number> = {};
    let totalValid = 0;
    logRecords.forEach(log => {
      const val = (log as any)[activeFacetField];
      if (val !== undefined && val !== null && val !== '') {
        const strVal = String(val);
        counts[strVal] = (counts[strVal] || 0) + 1;
        totalValid++;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({
        value,
        count,
        percent: Math.round((count / (totalValid || 1)) * 100)
      }));
  }, [activeFacetField, logRecords]);

  // Execute Query Trigger
  const handleExecuteSearch = () => {
    setAppliedQuery(searchQuery);
    setQueryExecutionTime(Math.floor(Math.random() * 25) + 12);
    showToast(isZh ? '已套用檢索查詢，日誌串流與命中頻率長條圖已即時更新！' : 'Query executed successfully.');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = selectedFields.join(',');
    const rows = filteredLogs.map(log => 
      selectedFields.map(f => `"${String((log as any)[f] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `semor_logs_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isZh ? '日誌已成功匯出為 CSV 格式！' : 'Logs exported to CSV.');
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `semor_logs_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(isZh ? '日誌已成功匯出為 JSON 格式！' : 'Logs exported to JSON.');
  };

  return (
    <div className="flex flex-col gap-6 text-slate-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 px-5 py-3.5 bg-[#111114] border border-blue-500/40 text-white rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH BAR & QUERY ECOSYSTEM */}
      <div className="flex flex-col gap-3.5 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
        {/* Main Search Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Query Input with Prefix Badge */}
          <div className="flex-1 relative flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500 pointer-events-none">
              <Search className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-mono font-black text-gray-500 border-r border-gray-700 pr-2 uppercase">KQL / VRL</span>
            </div>
            
            <input 
              type="text" 
              placeholder={isZh ? '檢索日誌欄位 (例如 source: "Palo Alto" AND severity: "Critical" 或 event: "Injection" ...)' : 'Search logs (e.g. source: "Palo Alto" AND severity: "Critical" ...)'}
              className="w-full bg-[#09090b] border border-gray-800 focus:border-blue-500 rounded-2xl py-3 pl-28 pr-28 text-xs focus:outline-none transition-all placeholder:text-gray-600 font-mono text-slate-200 shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteSearch();
              }}
            />

            {/* Quick Helper & Clear inside Input */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
                  title="Clear input"
                >
                  <X size={13} />
                </button>
              )}
              <button
                onClick={() => setIsQueryHelperOpen(!isQueryHelperOpen)}
                className="p-1.5 hover:bg-blue-900/30 text-blue-400 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                title="語法速查表"
              >
                <HelpCircle size={13} />
                <span className="hidden sm:inline">{isZh ? '語法' : 'Syntax'}</span>
              </button>
            </div>
          </div>

          {/* Preset Queries Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPresetOpen(!isPresetOpen)}
              className="px-3.5 py-3 bg-[#09090b] hover:bg-gray-900 border border-gray-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 text-gray-300 hover:text-white justify-between min-w-[150px]"
            >
              <div className="flex items-center gap-2">
                <Bookmark size={13} className="text-amber-400" />
                <span>{isZh ? '常用檢索範本' : 'Presets'}</span>
              </div>
              <ChevronDown size={13} className={cn("transition-transform text-gray-500", isPresetOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isPresetOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPresetOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-[#16161a] border border-gray-800 rounded-2xl shadow-2xl z-50 p-2 text-xs space-y-1"
                  >
                    <div className="px-3 py-1.5 border-b border-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span>{isZh ? '快速套用預設情境' : 'Pre-configured Threat Queries'}</span>
                      <Sparkles size={12} className="text-amber-400" />
                    </div>
                    {PRESET_QUERIES.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(preset.query);
                          setIsPresetOpen(false);
                          showToast(isZh ? `已套用範本: ${preset.label}` : `Applied query preset`);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-900 transition-all flex flex-col gap-0.5 group"
                      >
                        <span className="font-black text-xs text-white group-hover:text-blue-400 transition-colors">{preset.label}</span>
                        <span className="text-[10px] text-gray-400">{preset.desc}</span>
                        <span className="text-[9px] font-mono text-gray-600 truncate mt-0.5">{preset.query}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Time Range Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-[#09090b] hover:bg-gray-900 border border-gray-800 rounded-2xl text-xs font-bold transition-all min-w-[170px] justify-between text-gray-300"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-white">{timeRange}</span>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-gray-500 transition-transform", isTimeDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isTimeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTimeDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-[#16161a] border border-gray-800 rounded-2xl shadow-2xl z-50 p-2.5 text-xs"
                  >
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {[
                        'Last 5 minutes', 'Last 15 minutes', 'Last 30 minutes', 
                        'Last 1 hour', 'Last 24 hours', 'Last 7 days', 
                        'Last 30 days', 'All Time'
                      ].map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setTimeRange(range);
                            setIsTimeDropdownOpen(false);
                          }}
                          className={cn(
                            "text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-colors",
                            timeRange === range ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-800 pt-3 pb-1 px-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={12} className="text-gray-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">自訂時間範圍</span>
                      </div>
                      <div className="space-y-2">
                        <input 
                          type="datetime-local" 
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                        />
                        <input 
                          type="datetime-local" 
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                        />
                        <button 
                          disabled={!customStart || !customEnd}
                          onClick={() => {
                            setTimeRange(`${customStart} ~ ${customEnd}`);
                            setIsTimeDropdownOpen(false);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          套用自訂區間
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Execute Query Button */}
          <button 
            onClick={handleExecuteSearch}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 shrink-0"
          >
            <Play size={13} className="fill-current" />
            <span>{isZh ? '檢索日誌' : 'Search Logs'}</span>
          </button>
        </div>

        {/* Syntax Helper Cheat Sheet Popover */}
        <AnimatePresence>
          {isQueryHelperOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-[#09090b] border border-gray-800/90 rounded-2xl p-4 text-xs font-mono space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <BookOpen size={13} /> {isZh ? 'KQL / Lucene / VictoriaLogs 檢索語法速查' : 'Query Syntax Cheat Sheet'}
                </span>
                <button onClick={() => setIsQueryHelperOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                <div className="bg-[#111114] p-3 rounded-xl border border-gray-800 space-y-1">
                  <span className="text-amber-400 font-bold block">{isZh ? '欄位精確與萬用字元比對' : 'Exact & Wildcards'}</span>
                  <p className="text-gray-400"><code>source: "Palo Alto"</code></p>
                  <p className="text-gray-400"><code>src_ip: 10.88.*</code></p>
                  <p className="text-gray-400"><code>user: *admin*</code></p>
                </div>

                <div className="bg-[#111114] p-3 rounded-xl border border-gray-800 space-y-1">
                  <span className="text-blue-400 font-bold block">{isZh ? '布林邏輯組合 (AND/OR/NOT)' : 'Boolean Operators'}</span>
                  <p className="text-gray-400"><code>severity: "Critical" AND action: "Blocked"</code></p>
                  <p className="text-gray-400"><code>proto: TCP OR proto: UDP</code></p>
                  <p className="text-gray-400"><code>NOT user: "SYSTEM"</code></p>
                </div>

                <div className="bg-[#111114] p-3 rounded-xl border border-gray-800 space-y-1">
                  <span className="text-purple-400 font-bold block">{isZh ? '數值區間與狀態碼' : 'Range Queries'}</span>
                  <p className="text-gray-400"><code>response_code: &gt;= 400</code></p>
                  <p className="text-gray-400"><code>dst_port: [80 TO 443]</code></p>
                  <p className="text-gray-400"><code>latency_ms: &gt; 5.0</code></p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Chips & Live Stream Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold mr-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider">{isZh ? '作用中過濾條件:' : 'Filters:'}</span>
            </div>

            <AnimatePresence>
              {filters.map((filter, idx) => (
                <motion.div 
                  key={`${filter.field}-${filter.value}-${idx}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-xl border text-[11px] font-mono font-bold shadow-sm transition-all",
                    filter.type === 'include' 
                      ? "bg-blue-600/10 text-blue-400 border-blue-500/30" 
                      : "bg-rose-600/10 text-rose-400 border-rose-500/30"
                  )}
                >
                  <span className="text-gray-400">{filter.field}:</span>
                  <span className="text-white">"{filter.value}"</span>
                  <span className="text-[9px] px-1 bg-black/40 rounded uppercase text-gray-400">
                    {filter.type === 'include' ? '+' : '-'}
                  </span>
                  <button 
                    onClick={() => removeFilter(idx)}
                    className="hover:bg-white/10 rounded p-0.5 transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {filters.length > 0 && (
              <button 
                onClick={() => setFilters([])}
                className="text-[10px] text-gray-400 hover:text-white transition-colors underline underline-offset-4 ml-1"
              >
                {isZh ? '清除全部條件' : 'Clear All'}
              </button>
            )}
          </div>

          {/* Live Tail Streaming Controls & Metrics */}
          <div className="flex items-center gap-3">
            {/* Streaming Toggle */}
            <div className="flex items-center bg-[#09090b] border border-gray-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all",
                  isLiveStreaming 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                {isLiveStreaming ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>{isZh ? '即時串流中 (Live)' : 'Live Tail'}</span>
                  </>
                ) : (
                  <>
                    <Play size={10} className="fill-current" />
                    <span>{isZh ? '啟動串流' : 'Live Stream'}</span>
                  </>
                )}
              </button>

              {isLiveStreaming && (
                <select
                  value={liveStreamSpeed}
                  onChange={(e) => setLiveStreamSpeed(Number(e.target.value))}
                  className="bg-transparent text-[10px] font-mono text-gray-300 border-l border-gray-800 pl-1.5 pr-1 outline-none"
                >
                  <option value={1000} className="bg-gray-900">1s/筆</option>
                  <option value={3000} className="bg-gray-900">3s/筆</option>
                  <option value={5000} className="bg-gray-900">5s/筆</option>
                </select>
              )}
            </div>

            {/* Ingestion & Performance Telemetry Badge */}
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-400 bg-[#09090b] border border-gray-800 px-3 py-1.5 rounded-xl">
              <Activity size={12} className="text-emerald-400" />
              <span>{isZh ? '檢索耗時' : 'Latency'}: <strong className="text-blue-400">{queryExecutionTime} ms</strong></span>
              <span className="text-gray-700">|</span>
              <span>{isZh ? '採集吞吐' : 'Rate'}: <strong className="text-emerald-400">38,500 EPS</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* TIME-SERIES OCCURRENCE HISTOGRAM */}
      <div className="bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center gap-2">
            <BarChart className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {isZh ? '日誌發生頻率與嚴重性長條圖 (Occurrence Histogram)' : 'Log Occurrence Histogram'}
            </span>
            <span className="text-[10px] font-mono bg-blue-600/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              {filteredLogs.length} {isZh ? '筆命中' : 'hits'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Export buttons */}
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#09090b] hover:bg-gray-800 border border-gray-800 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white transition-colors"
            >
              <Download size={12} /> CSV
            </button>
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#09090b] hover:bg-gray-800 border border-gray-800 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white transition-colors"
            >
              <Code size={12} /> JSON
            </button>
            <button 
              onClick={() => showToast(isZh ? '已複製檢索 API cURL 請求指令至剪貼簿！' : 'Query cURL copied')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#09090b] hover:bg-gray-800 border border-gray-800 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white transition-colors"
            >
              <Share2 size={12} /> cURL
            </button>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} 
              />
              <Bar dataKey="Critical" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="High" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Medium" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Low" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend Bar */}
        <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-gray-800/40 text-[10px] font-bold">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> <span className="text-gray-400">Critical</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> <span className="text-gray-400">High</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" /> <span className="text-gray-400">Medium</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> <span className="text-gray-400">Low / Info</span></div>
        </div>
      </div>

      {/* MAIN SPLIT: FIELDS EXPLORER (LEFT) + LOG STREAM / TABLE (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FIELD EXPLORER & FACET AGGREGATION */}
        <div className="lg:col-span-3 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Tag size={13} className="text-blue-400" />
                {isZh ? '日誌結構欄位清單' : 'Fields Explorer'}
              </span>
              <p className="text-[10px] text-gray-500 mt-0.5">{allFields.length} {isZh ? '個可用欄位' : 'attributes'}</p>
            </div>
            <Settings size={14} className="text-gray-500 hover:text-white cursor-pointer transition-colors" />
          </div>

          {/* Field Search Filter */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder={isZh ? '搜尋特定欄位 (e.g. ip, user)...' : 'Search fields...'}
              className="w-full bg-[#09090b] border border-gray-800 rounded-xl py-1.5 pl-7 pr-3 text-xs text-slate-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              value={fieldSearchTerm}
              onChange={(e) => setFieldSearchTerm(e.target.value)}
            />
          </div>

          {/* Selected Columns */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center justify-between">
              <span>{isZh ? '已選顯示欄位' : 'Selected Fields'} ({selectedFields.length})</span>
            </span>
            <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pr-1">
              {selectedFields.map(field => (
                <div 
                  key={field} 
                  className="flex items-center justify-between px-2.5 py-1.5 bg-[#09090b] hover:bg-gray-900 border border-gray-800/80 rounded-xl text-xs group transition-colors"
                >
                  <button 
                    onClick={() => setActiveFacetField(activeFacetField === field ? null : field)}
                    className="text-blue-400 hover:underline font-mono font-bold text-left truncate flex-1"
                    title={isZh ? '點擊查看數值分佈' : 'Click to view value distribution'}
                  >
                    {field}
                  </button>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setActiveFacetField(activeFacetField === field ? null : field)}
                      className="text-gray-500 hover:text-blue-400 p-0.5"
                      title="查看聚合統計"
                    >
                      <Eye size={12} />
                    </button>
                    <button 
                      onClick={() => setSelectedFields(selectedFields.filter(f => f !== field))} 
                      className="text-gray-500 hover:text-rose-400 p-0.5 transition-colors"
                      title="從表格移除"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Fields */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              {isZh ? '其餘可用欄位' : 'Available Fields'}
            </span>
            <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {allFields
                .filter(f => !selectedFields.includes(f) && (!fieldSearchTerm || f.toLowerCase().includes(fieldSearchTerm.toLowerCase())))
                .map(field => (
                  <div 
                    key={field} 
                    className="flex items-center justify-between px-2.5 py-1.5 hover:bg-[#09090b] rounded-xl text-xs cursor-pointer transition-colors group"
                  >
                    <button 
                      onClick={() => setActiveFacetField(activeFacetField === field ? null : field)}
                      className="text-gray-400 group-hover:text-white font-mono text-left truncate flex-1"
                    >
                      {field}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedFields([...selectedFields, field])}
                        className="text-gray-500 hover:text-blue-400 p-0.5"
                        title="加到顯示欄位"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Field Facet Popover / Inline Distribution */}
          <AnimatePresence>
            {activeFacetField && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#09090b] border border-blue-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-[10px] font-black uppercase text-blue-400 font-mono">
                    Top 5 Values: {activeFacetField}
                  </span>
                  <button onClick={() => setActiveFacetField(null)} className="text-gray-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>

                <div className="space-y-2 text-[11px] font-mono">
                  {fieldFacetValues.map(item => (
                    <div key={item.value} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-300 truncate max-w-[130px]" title={item.value}>{item.value}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">{item.count} ({item.percent}%)</span>
                          <button 
                            onClick={() => addFilter(activeFacetField, item.value, 'include')}
                            className="p-0.5 text-blue-400 hover:bg-blue-900/40 rounded"
                            title="Filter for value (+)"
                          >
                            <Plus size={10} />
                          </button>
                          <button 
                            onClick={() => addFilter(activeFacetField, item.value, 'exclude')}
                            className="p-0.5 text-rose-400 hover:bg-rose-900/40 rounded"
                            title="Filter out value (-)"
                          >
                            <Minus size={10} />
                          </button>
                        </div>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: LOG RECORDS STREAM / STRUCTURED TABLE / JSON */}
        <div className="lg:col-span-9 bg-[#111114] border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header Action Bar */}
          <div className="p-4 border-b border-gray-800/80 bg-[#0d0d10] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {isZh ? '日誌檢索結果串流' : 'Log Stream Events'}
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                ({filteredLogs.length} {isZh ? '筆相符記錄' : 'matching records'})
              </span>
            </div>

            {/* View Switcher: Table / Raw / JSON */}
            <div className="flex bg-[#09090b] p-1 rounded-2xl border border-gray-800">
              <button
                onClick={() => setViewFormat('table')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  viewFormat === 'table' ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                )}
              >
                <Table size={13} /> {isZh ? '結構表格' : 'Table'}
              </button>
              <button
                onClick={() => setViewFormat('raw')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  viewFormat === 'raw' ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                )}
              >
                <FileText size={13} /> {isZh ? '原始日誌流' : 'Raw Text'}
              </button>
              <button
                onClick={() => setViewFormat('json')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  viewFormat === 'json' ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                )}
              >
                <Code size={13} /> JSON
              </button>
            </div>
          </div>

          {/* Content Area according to view format */}
          {viewFormat === 'table' ? (
            /* STRUCTURED TABLE VIEW */
            <div className="overflow-x-auto text-[11.5px] font-mono">
              <table className="w-full text-left divide-y divide-gray-800/80">
                <thead className="bg-[#0c0c0e] text-gray-400 text-[10px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5 w-10 text-center">#</th>
                    {selectedFields.map(field => (
                      <th key={field} className="p-3.5 font-bold whitespace-nowrap">{field}</th>
                    ))}
                    <th className="p-3.5 text-right w-20">{isZh ? '動作' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 bg-[#111114]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={selectedFields.length + 2} className="p-12 text-center text-gray-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <p className="font-bold text-sm text-gray-400">{isZh ? '無符合檢索條件之日誌事件' : 'No logs match your search criteria'}</p>
                        <p className="text-xs text-gray-600 mt-1">{isZh ? '請嘗試清除部分過濾器或擴大時間範圍。' : 'Try clearing some filters or expanding the time window.'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className={cn(
                              "hover:bg-[#16161a] cursor-pointer transition-colors group",
                              isExpanded && "bg-[#18181f]"
                            )}
                          >
                            <td className="p-3.5 text-center text-gray-500">
                              <ChevronRight className={cn("w-4 h-4 transition-transform mx-auto", isExpanded && "rotate-90 text-blue-400")} />
                            </td>

                            {selectedFields.map(f => (
                              <td key={f} className="p-3.5 whitespace-nowrap">
                                {f === 'severity' ? (
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider inline-flex items-center gap-1",
                                    log.severity === 'Critical' ? "bg-rose-600/10 text-rose-400 border-rose-500/30" :
                                    log.severity === 'High' ? "bg-orange-600/10 text-orange-400 border-orange-500/30" :
                                    log.severity === 'Medium' ? "bg-yellow-600/10 text-yellow-500 border-yellow-500/30" :
                                    "bg-blue-600/10 text-blue-400 border-blue-500/30"
                                  )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", log.severity === 'Critical' ? "bg-rose-500" : log.severity === 'High' ? "bg-orange-500" : "bg-blue-500")} />
                                    {log.severity}
                                  </span>
                                ) : f === 'action' ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono",
                                    log.action === 'Blocked' || log.action === 'Quarantined' ? "text-rose-400 bg-rose-950/30 border border-rose-800/30" :
                                    log.action === 'Trapped' ? "text-purple-400 bg-purple-950/30 border border-purple-800/30" :
                                    log.action === 'Rate-limited' ? "text-amber-400 bg-amber-950/30 border border-amber-800/30" :
                                    "text-emerald-400 bg-emerald-950/30 border border-emerald-800/30"
                                  )}>
                                    {log.action}
                                  </span>
                                ) : f === '@timestamp' ? (
                                  <span className="text-gray-400 font-mono">{log['@timestamp']}</span>
                                ) : f === 'src_ip' || f === 'dst_ip' ? (
                                  <span className="text-blue-400 font-mono font-bold">{String((log as any)[f] || '-')}</span>
                                ) : (
                                  <span className="text-gray-300 block truncate max-w-[240px]" title={String((log as any)[f] || '')}>
                                    {String((log as any)[f] || '-')}
                                  </span>
                                )}
                              </td>
                            ))}

                            <td className="p-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLogForModal(log);
                                }}
                                className="p-1.5 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors"
                                title="展開全視窗檢視"
                              >
                                <ExternalLink size={13} />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Row Item */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr>
                                <td colSpan={selectedFields.length + 2} className="p-0 bg-[#09090b]">
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden p-6 space-y-4 border-y border-gray-800"
                                  >
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 bg-blue-600/20 text-blue-400 text-[10px] font-mono font-black uppercase rounded-lg border border-blue-500/30">
                                          LOG ID: {log.id}
                                        </span>
                                        <span className="text-xs font-bold text-white">{log.event}</span>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                          showToast(isZh ? '已複製 JSON 結構至剪貼簿' : 'Copied JSON to clipboard');
                                        }}
                                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                                      >
                                        <Copy size={12} /> {isZh ? '複製 JSON' : 'Copy JSON'}
                                      </button>
                                    </div>

                                    {/* Key-Value Pairs */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-[11px] font-mono">
                                      {Object.entries(log).filter(([k]) => k !== 'full_log' && k !== 'ai_analysis').map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-900 group">
                                          <span className="text-gray-500 font-bold">{k}:</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-200 truncate max-w-[180px]" title={String(v)}>{String(v)}</span>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                              <button 
                                                onClick={() => addFilter(k, String(v), 'include')} 
                                                className="text-blue-400 hover:bg-blue-900/30 p-1 rounded"
                                                title="Filter for this value (+)"
                                              >
                                                <Plus size={10} />
                                              </button>
                                              <button 
                                                onClick={() => addFilter(k, String(v), 'exclude')} 
                                                className="text-rose-400 hover:bg-rose-900/30 p-1 rounded"
                                                title="Exclude this value (-)"
                                              >
                                                <Minus size={10} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* AI Threat Insight & MITRE ATT&CK */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                                      {log.ai_analysis && (
                                        <div className="bg-blue-950/20 border border-blue-500/20 p-3.5 rounded-2xl space-y-1.5">
                                          <div className="flex items-center gap-2 text-xs font-black text-blue-400">
                                            <Brain size={14} />
                                            <span>{isZh ? 'SEMOR AI 威脅研判與即時處置建議' : 'AI Threat Summary'}</span>
                                          </div>
                                          <p className="text-xs text-gray-300 leading-relaxed font-sans">{log.ai_analysis}</p>
                                        </div>
                                      )}

                                      {log.mitre_technique && (
                                        <div className="bg-purple-950/20 border border-purple-500/20 p-3.5 rounded-2xl space-y-1.5">
                                          <div className="flex items-center gap-2 text-xs font-black text-purple-400">
                                            <ShieldAlert size={14} />
                                            <span>{isZh ? 'MITRE ATT&CK 戰術與技術關聯' : 'MITRE Mapping'}</span>
                                          </div>
                                          <p className="text-xs text-gray-300 font-mono">
                                            戰術 (Tactic): <strong className="text-white">{log.mitre_tactic}</strong><br />
                                            技術 (Technique): <strong className="text-purple-300">{log.mitre_technique}</strong>
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Raw Log Text */}
                                    <div className="space-y-1 bg-[#050507] p-3.5 rounded-2xl border border-gray-800">
                                      <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">{isZh ? '原始日誌訊息 (Raw Syslog / Message Text)' : 'Raw Message'}</span>
                                      <p className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap break-all font-mono">{log.full_log}</p>
                                    </div>

                                    {/* Context Actions */}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
                                      <button 
                                        onClick={() => showToast(isZh ? `已向 SIEM 規則引擎新增以 [${log.event}] 為特徵的告警規則！` : 'Rule created')}
                                        className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                      >
                                        <Shield size={13} /> {isZh ? '建立自動告警規則' : 'Create Alert Rule'}
                                      </button>
                                      {log.src_ip && (
                                        <button 
                                          onClick={() => showToast(isZh ? `已向邊界防火牆發送封鎖 IP ${log.src_ip} 指令！` : 'IP blocked')}
                                          className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                        >
                                          <Lock size={13} /> {isZh ? `防火牆阻斷 IP (${log.src_ip})` : `Block IP`}
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => showToast(isZh ? `已建立資安事件調查單 (Case ID: INC-${Date.now().toString().slice(-4)})` : 'Case created')}
                                        className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                      >
                                        <FileText size={13} /> {isZh ? '加入資安事件案件' : 'Add to Case'}
                                      </button>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : viewFormat === 'raw' ? (
            /* RAW SYSLOG TEXT STREAM VIEW */
            <div className="p-5 font-mono text-xs space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar bg-[#09090b]">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-3 bg-[#111114] border border-gray-800 rounded-2xl hover:border-blue-500/40 transition-colors space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pb-1 border-b border-gray-850">
                    <span className="font-bold text-blue-400">{log['@timestamp']} | {log.source}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", log.severity === 'Critical' ? "text-rose-400" : "text-gray-400")}>{log.severity}</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed pt-1">{log.full_log}</p>
                </div>
              ))}
            </div>
          ) : (
            /* JSON VIEW */
            <div className="p-5 font-mono text-xs max-h-[600px] overflow-y-auto custom-scrollbar bg-[#09090b]">
              <pre className="text-emerald-400 leading-relaxed">{JSON.stringify(filteredLogs, null, 2)}</pre>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 bg-[#0c0c0e] border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 font-mono">
            <div className="flex items-center gap-4">
              <span>{isZh ? `顯示第 1 - ${filteredLogs.length} 筆，共 ${filteredLogs.length} 筆事件` : `Showing 1 - ${filteredLogs.length} of ${filteredLogs.length} events`}</span>
              <span className="text-gray-700">|</span>
              <span>{isZh ? '索引碎片' : 'Shards'}: <strong className="text-slate-300">4 主碎片 / 1 備份</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-gray-800 rounded-xl text-gray-500 cursor-not-allowed" disabled>
                {isZh ? '上一頁' : 'Previous'}
              </button>
              <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors">
                {isZh ? '下一頁' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULL RECORD DETAIL MODAL */}
      <AnimatePresence>
        {selectedLogForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl p-6 max-w-3xl w-full space-y-6 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedLogForModal(null)}
                className="absolute top-5 right-5 p-2 hover:bg-gray-800 rounded-2xl text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedLogForModal.event}</h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedLogForModal['@timestamp']} | {selectedLogForModal.source}</p>
                </div>
              </div>

              {/* Raw JSON */}
              <div className="bg-[#09090b] p-4 rounded-2xl border border-gray-800 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto">
                <pre>{JSON.stringify(selectedLogForModal, null, 2)}</pre>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLogForModal, null, 2));
                    showToast(isZh ? '已複製 JSON 結構至剪貼簿' : 'Copied JSON to clipboard');
                  }}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isZh ? '複製 JSON 結構' : 'Copy JSON'}
                </button>
                <button
                  onClick={() => setSelectedLogForModal(null)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
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

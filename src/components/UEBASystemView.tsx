import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, ShieldX, Activity, Sparkles, Bot, Settings,
  Users, Server, Database, Network, Globe, Key, AlertTriangle, Play,
  Zap, ChevronRight, Send, Search, Terminal, ArrowRight, UserCheck, 
  Smartphone, Monitor, FileText, FileSearch, Trash2, Check, RefreshCw, X, Flame, Clock, ClipboardCheck, ArrowUpRight,
  Code, Sliders, Layers, Link, CheckCircle2, Cpu, Wifi, Lock, Download, Copy, RotateCcw, Filter
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import UEBASettingsView from './UEBASettingsView';

// Data types & Schemas 
export interface UEBAEntity {
  id: string;
  name: string;
  type: 'User' | 'Host' | 'IP';
  department: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  status: 'Critical' | 'Suspicious' | 'Attention' | 'Normal';
  avatar: string;
  associatedEntities: string[];
  riskFactors: string[];
  privileges: string[];
  devices: { name: string; type: string; id: string }[];
  lastActive: string;
  baselineSummary: string;
  watchlist?: boolean;
  contained?: boolean;
  peerGroup?: string;
  baselineDeviationPct?: number;
}

export interface ActivityLog {
  id: string;
  time: string;
  entityId: string;
  entityName: string;
  type: 'Authentication' | 'Endpoint' | 'Network' | 'SaaS' | 'Database';
  source: string;
  deviation: string; // e.g., +2,400%
  score: number;
  description: string;
  vector: 'Time/Space' | 'Data Volume' | 'Privilege Mutation';
  rawLog: string;
}

export default function UEBASystemView() {
  // Navigation tab for the UEBA Rail Menu (首頁, 威脅實體排行, 事件調查, GenAI助理, 系統設定, 落地規劃指標)
  const [activeRailTab, setActiveRailTab] = useState<'home' | 'threats' | 'investigate' | 'copilot' | 'settings' | 'indicators'>('home');
  const [selectedEntity, setSelectedEntity] = useState<UEBAEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAnomalyFilter, setActiveAnomalyFilter] = useState<'All' | 'Time/Space' | 'Data Volume' | 'Privilege Mutation'>('All');
  
  // Indicators Interactive states
  const [activeIndicatorsSubTab, setActiveIndicatorsSubTab] = useState<'indicator1_dataflow' | 'indicator2_aurora' | 'indicator3_soar'>('indicator2_aurora');
  const [featuresExtractionStatus, setFeaturesExtractionStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [featuresProgress, setFeaturesProgress] = useState(0);
  const [auroraAnalyzing, setAuroraAnalyzing] = useState(false);
  const [auroraRevealed, setAuroraRevealed] = useState(false);
  
  // Indicator 3: SOAR integration forms
  const [splunkHost, setSplunkHost] = useState('https://splunk-prod.internal.corp:8089');
  const [splunkToken, setSplunkToken] = useState('spl_tok_8f93ha819ahd8213aa');
  const [fortisiemHost, setFortisiemHost] = useState('https://fortisiem-manager.internal.corp:5443');
  const [fortisiemToken, setFortisiemToken] = useState('ft_sec_991823aaed9ab78213');
  const [qradarHost, setQradarHost] = useState('https://qradar-console.internal.corp:443');
  const [qradarToken, setQradarToken] = useState('qr_sec_441029ba22378f89ac');
  const [paloaltoHost, setPaloaltoHost] = useState('https://panorama-fw.internal.corp:443');
  const [paloaltoToken, setPaloaltoToken] = useState('pa_sec_883201bcaff28a31ea');
  const [crowdstrikeClientId, setCrowdstrikeClientId] = useState('cs_oauth_client_98213aa3ee');
  const [crowdstrikeClientSecret, setCrowdstrikeClientSecret] = useState('••••••••••••••••••••••••••••••••••••••••');
  
  // API Connection node statuses
  const [apiTesting, setApiTesting] = useState(false);
  const [apiNodesStatus, setApiNodesStatus] = useState<Record<string, 'idle' | 'checking' | 'online' | 'failed'>>({
    splunk: 'idle',
    fortisiem: 'idle',
    qradar: 'idle',
    paloalto: 'idle',
    crowdstrike: 'idle',
    okta: 'idle'
  });

  // Gemini Interactive Chat state
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<Array<{
    sender: 'user' | 'gemini';
    text: string;
    sql?: string;
    chartType?: 'trend' | 'risk_profile';
    isWriting?: boolean;
  }>>([
    {
      sender: 'gemini',
      text: '您好！我是您的 Gemini AI 安全調查聯防助手。整合 Vertex AI 本地非監督式學習集群及 BigQuery 安全大數據湖，能即時關聯多維度使用者異常行為。\n\n請輸入自然語言問題，例如：「幫我找出上週風險飆升前五名的研發部員工，並說明原因。」，或點擊下方快捷提示晶片。'
    }
  ]);

  // Selected audit timeline log in the drawer
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [geminiLogInterpretation, setGeminiLogInterpretation] = useState<string | null>(null);
  const [interpretingLogId, setInterpretingLogId] = useState<string | null>(null);

  // Behavior Ingestion flow status animation
  const [ingestionCount, setIngestionCount] = useState({ authCount: 4120, endCount: 8840, netCount: 15430, saasCount: 6511 });
  const [activePipelinePulse, setActivePipelinePulse] = useState(0);

  // Playbook execution orchestration
  const [executingPlaybook, setExecutingPlaybook] = useState<string | null>(null);
  const [playbookStep, setPlaybookStep] = useState(0);

  useEffect(() => {
    // Background counter and pipeline visual feedback loops
    const counterTimer = setInterval(() => {
      setIngestionCount(prev => ({
        authCount: prev.authCount + Math.floor(Math.random() * 3),
        endCount: prev.endCount + Math.floor(Math.random() * 5),
        netCount: prev.netCount + Math.floor(Math.random() * 12),
        saasCount: prev.saasCount + Math.floor(Math.random() * 4),
      }));
    }, 3000);

    const pulseTimer = setInterval(() => {
      setActivePipelinePulse(prev => (prev + 1) % 4);
    }, 1500);

    return () => {
      clearInterval(counterTimer);
      clearInterval(pulseTimer);
    };
  }, []);

  // Static Data conforming strictly to the requested architecture
  const initialEntitiesData: UEBAEntity[] = [
    {
      id: 'usr-johndoe',
      name: 'John Doe',
      type: 'User',
      department: '研發部 (R&D)',
      score: 92,
      trend: 'up',
      trendValue: '+34%',
      status: 'Critical',
      avatar: 'JD',
      associatedEntities: ['IP: 185.220.101.5', 'Laptop-JohnD', 'ID: AD-65231', 'Phone: iPhone-JD'],
      riskFactors: ['時間/空間異常 (Impossible Travel)', '資料異常 (異常大體積資料夾壓縮外傳)', '權限異常 (嘗試存取敏感 Finance_DB)'],
      privileges: ['Git-Access', 'Jenkins-Admin', 'Standard-Corp-VM', 'Finance_DB (Temporary Request)'],
      devices: [
        { name: 'MacBook Pro R&D', type: 'Laptop', id: 'Laptop-JohnD' },
        { name: 'iPhone 15 Enterprise', type: 'Mobile', id: 'Phone-JD' }
      ],
      lastActive: '今日 03:25 AM',
      baselineSummary: '過去 90 天正常基準：工作時間 09:00 - 18:30 (台北 IP)，每日平均下載研發程式碼約 150MB，未曾查詢過財務或薪資帳務主機之資料庫。'
    },
    {
      id: 'usr-sarahchen',
      name: 'Sarah Chen',
      type: 'User',
      department: '財務處 (Finance)',
      score: 74,
      trend: 'up',
      trendValue: '+18%',
      status: 'Suspicious',
      avatar: 'SC',
      associatedEntities: ['IP: 192.168.10.45', 'Desktop-SarahC', 'ID: AD-72031'],
      riskFactors: ['非常規工作時段登入', '向外部雲端儲存發送複數查詢'],
      privileges: ['ERP-Read', 'PayrollViewer', 'Standard-Corp-VM'],
      devices: [
        { name: 'Corporate Desktop', type: 'Workstation', id: 'Desktop-SarahC' }
      ],
      lastActive: '今日 04:12 AM',
      baselineSummary: '過去 60 天正常基準：工作時間 08:30 - 17:30，僅存取財務申報系統。'
    },
    {
      id: 'host-gateway-01',
      name: 'GW-CORE-MAIN',
      type: 'Host',
      department: '資訊部 (IT-Infra)',
      score: 82,
      trend: 'up',
      trendValue: '+22%',
      status: 'Suspicious',
      avatar: 'GW',
      associatedEntities: ['IP: 10.0.1.254', 'Router-M3', 'Core-Gateway'],
      riskFactors: ['偵測到未配置的連接埠掃描行為', '高頻跨網路區段的 ARP 回應'],
      privileges: ['Network Routing', 'VPN Gateway Host'],
      devices: [
        { name: 'Gateway Appliance', type: 'Server', id: 'Core-Gateway' }
      ],
      lastActive: '今日 02:40 AM',
      baselineSummary: '過去 180 天正常基準：靜態路由，不應產生主動內網主機遍歷或非預期連接埠探測。'
    },
    {
      id: 'usr-robertfox',
      name: 'Robert Fox',
      type: 'User',
      department: '決策層 (Executive)',
      score: 52,
      trend: 'down',
      trendValue: '-5%',
      status: 'Attention',
      avatar: 'RF',
      associatedEntities: ['IP: 203.74.12.9', 'iPad-Executive-V', 'ID: CEO-AD'],
      riskFactors: ['自非慣用 IP 登入 Outlook Web App'],
      privileges: ['Enterprise-All-Access', 'E-mail-Admin'],
      devices: [
        { name: 'CEO iPad Pro', type: 'Tablet', id: 'iPad-Executive-V' }
      ],
      lastActive: '昨日 22:15 PM',
      baselineSummary: '日常多維度基準：差旅频繁，IP分布於美中台三地，低量文件存取。'
    }
  ];

  const initialActivityLogs: ActivityLog[] = [
    {
      id: 'log-001',
      time: '今日 03:15:22',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Authentication',
      source: '企業身分之一 (Active Directory)',
      deviation: ' impossible_travel_99%',
      score: 89,
      vector: 'Time/Space',
      description: '使用者自日常在台 IP 離線後，僅隔 10 分鐘，突自「英國倫敦遠端 IP (85.25.10.4)」透過 TLS VPN 成功驗證登入。',
      rawLog: '{"event_timestamp":"2026-06-12 03:15:22", "auth_status":"SUCCESS", "username":"jdoe", "source_ip":"85.25.10.4", "vpn_gateway":"GW-VPN-LON-02", "impossible_travel_check":{"distance_km":9800, "delta_minutes":10, "velocity_kph":58800}}'
    },
    {
      id: 'log-002',
      time: '今日 03:18:40',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Database',
      source: '關聯式數據庫 (Finance_DB)',
      deviation: 'db_access_volume_+1,500%',
      score: 91,
      vector: 'Privilege Mutation',
      description: '成功登入後，使用者發起 15 次跨表敏感查詢 (預算、薪資、專利程式碼)，而在過去 90 天基準中，該帳戶未發生任何對 Finance_DB 的查詢。',
      rawLog: '{"event_timestamp":"2026-06-12 03:18:40", "session_id":"sess-88912", "action":"SELECT_WILDCARD", "target_table":"tbl_payroll_confidential", "rows_returned":42100, "baseline_avg_rows_day":0}'
    },
    {
      id: 'log-003',
      time: '今日 03:22:10',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Endpoint',
      source: '端點安控日誌 (Wazuh/EDR)',
      deviation: 'new_program_heuristic_critical',
      score: 94,
      vector: 'Data Volume',
      description: '執行本地 PowerShell 檔案，調用特徵符合 7z.exe 的加密容器工具，將 R&D 底層核心演算法封裝成 "/temp/research_bk.7z" 巨大壓縮檔。',
      rawLog: '{"event_timestamp":"2026-06-12 03:22:10", "agent_id":"agent-094", "host":"Laptop-JohnD", "process_tree":"explorer.exe -> powershell.exe -> 7z.exe", "arguments":["a", "/temp/research_bk.7z", "/src/core/"], "integrity_hash":"sha256-abc8812f"}'
    },
    {
      id: 'log-004',
      time: '今日 03:25:05',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Network',
      source: '次世代防火牆 (PaloAlto / Netflow)',
      deviation: 'outbound_data_egress_4.2GB_surge',
      score: 95,
      vector: 'Data Volume',
      description: '偵測到對外部雲端空間 MEGA.nz (31.21.4.150) 的大頻寬加密連線，短短 3 分鐘內將 4.2GB 壓縮數據完成外傳，與一般每日平均外派基準嚴重偏離。',
      rawLog: '{"event_timestamp":"2026-06-12 03:25:05", "source_zone":"Trust-LAN", "dest_zone":"Untrust-WAN", "dest_ip":"31.21.4.150", "bytes_sent":4509715200, "app_id":"mega-upload", "action":"ALLOW"}'
    },
    {
      id: 'log-005',
      time: '今日 04:05:00',
      entityId: 'usr-sarahchen',
      entityName: 'Sarah Chen',
      type: 'SaaS',
      source: '雲端套件監控 (SaaS Logs / Exchange)',
      deviation: 'abnormal_working_hours_100%',
      score: 65,
      vector: 'Time/Space',
      description: '財務處 Sarah Chen 登入 Microsoft Exchange Online，並觸發 55 次非營業時間郵件轉寄，疑似行為遭背後巨量腳本操作。',
      rawLog: '{"event_timestamp":"2026-06-12 04:05:00", "client_ip":"114.34.8.99", "action":"Set-InboxRule", "parameters":"ForwardTo: outside-attacker@compromised.com"}'
    }
  ];

  // Live state synchronized with UEBA Backend API
  const [entities, setEntities] = useState<UEBAEntity[]>(initialEntitiesData);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);
  const [simulatorForm, setSimulatorForm] = useState({
    entityId: 'usr-johndoe',
    vector: 'Time/Space' as 'Time/Space' | 'Data Volume' | 'Privilege Mutation',
    type: 'Authentication' as 'Authentication' | 'Endpoint' | 'Network' | 'SaaS' | 'Database',
    description: '倫敦跳板 Impossible Travel (10 分鐘跨國登入異常)',
    score: 94,
    deviation: '+5,800 km/h'
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Threats Leaderboard Filtering
  const [threatSearchQuery, setThreatSearchQuery] = useState('');
  const [threatDeptFilter, setThreatDeptFilter] = useState('All');
  const [threatStatusFilter, setThreatStatusFilter] = useState('All');

  // Event Investigate Filtering
  const [investigateSearch, setInvestigateSearch] = useState('');
  const [investigateEntityId, setInvestigateEntityId] = useState('All');

  // Copilot BigQuery SQL Execution
  const [executingSqlIndex, setExecutingSqlIndex] = useState<number | null>(null);
  const [sqlResults, setSqlResults] = useState<Record<number, { executionTimeMs: number; bytesProcessed: string; columns: string[]; rows: any[] }>>({});

  // Settings Sub-view inside UEBA
  const [settingsActiveView, setSettingsActiveView] = useState<'matrix' | 'baseline'>('matrix');

  const entitiesData = entities;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchUEBAData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [entitiesRes, activitiesRes, statsRes] = await Promise.all([
        fetch('/api/v1/ueba/entities'),
        fetch('/api/v1/ueba/activities'),
        fetch('/api/v1/ueba/stats')
      ]);

      if (entitiesRes.ok) {
        const entData = await entitiesRes.json();
        if (entData.success && Array.isArray(entData.entities)) {
          setEntities(entData.entities);
          setSelectedEntity(prev => {
            if (!prev) return entData.entities[0] || null;
            return entData.entities.find((e: UEBAEntity) => e.id === prev.id) || prev;
          });
        }
      }

      if (activitiesRes.ok) {
        const actData = await activitiesRes.json();
        if (actData.success && Array.isArray(actData.activities)) {
          setActivityLogs(actData.activities);
        }
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success && sData.ingestion) {
          setIngestionCount({
            authCount: sData.ingestion.authCount || 4120,
            endCount: sData.ingestion.endCount || 8840,
            netCount: sData.ingestion.netCount || 15430,
            saasCount: sData.ingestion.saasCount || 6511
          });
        }
      }
      setIsBackendConnected(true);
    } catch (e) {
      console.warn('UEBA backend fetch failed, utilizing client fallback data:', e);
      setIsBackendConnected(false);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUEBAData();
    const interval = setInterval(() => {
      fetchUEBAData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleWatchlist = async (entity: UEBAEntity) => {
    const nextWatchlist = !entity.watchlist;
    try {
      const res = await fetch('/api/v1/ueba/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: entity.id, enable: nextWatchlist })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || '觀察名單狀態已更新');
      }
    } catch (e) {}
    setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, watchlist: nextWatchlist } : e));
    if (selectedEntity?.id === entity.id) {
      setSelectedEntity({ ...selectedEntity, watchlist: nextWatchlist });
    }
  };

  const handleToggleContainment = async (entity: UEBAEntity) => {
    const nextContainment = !entity.contained;
    try {
      const res = await fetch('/api/v1/ueba/containment/isolate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: entity.id, isolate: nextContainment })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || '隔離狀態已更新');
      }
    } catch (e) {}
    setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, contained: nextContainment } : e));
    if (selectedEntity?.id === entity.id) {
      setSelectedEntity({ ...selectedEntity, contained: nextContainment });
    }
  };

  const handleSimulateAnomalySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/ueba/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulatorForm)
      });
      if (res.ok) {
        showToast(`✓ 異常事件注入成功！實體 ${simulatorForm.entityId} 風險指標已即時重算。`);
        setShowSimulatorModal(false);
        await fetchUEBAData(false);
      }
    } catch (err) {
      showToast('異常注入失敗，請確認後端連線。');
    }
  };

  const handleExportDossier = (entity: UEBAEntity) => {
    const dossierData = {
      exportTimestamp: new Date().toISOString(),
      entityProfile: entity,
      relatedActivities: activityLogs.filter(l => l.entityId === entity.id || l.entityName === entity.name),
      mitreTacticsMapped: entity.riskFactors,
      status: entity.status,
      containmentEnforced: entity.contained,
      watchlisted: entity.watchlist
    };
    const blob = new Blob([JSON.stringify(dossierData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UEBA-Forensics-Dossier-${entity.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`已匯出 ${entity.name} 完整的行為鑑識調查報告 (JSON)！`);
  };

  const handleResetEntityRisk = async (entity: UEBAEntity) => {
    try {
      const res = await fetch(`/api/v1/ueba/entities/${entity.id}/reset-risk`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || `實體 ${entity.name} 風險值已重置為基準`);
        if (data.entity) {
          setEntities(prev => prev.map(e => e.id === entity.id ? data.entity : e));
          if (selectedEntity?.id === entity.id) {
            setSelectedEntity(data.entity);
          }
        }
      }
    } catch (e) {
      showToast('重設風險值失敗，請檢查網路連線');
    }
  };

  const handleExecuteBigQuerySql = async (index: number, sql: string) => {
    setExecutingSqlIndex(index);
    try {
      const res = await fetch('/api/v1/ueba/copilot/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSqlResults(prev => ({
            ...prev,
            [index]: {
              executionTimeMs: data.executionTimeMs,
              bytesProcessed: data.bytesProcessed,
              columns: data.columns,
              rows: data.rows
            }
          }));
          showToast(`✓ BigQuery 查詢執行成功！處理 ${data.bytesProcessed}，耗時 ${data.executionTimeMs}ms`);
        }
      }
    } catch (e) {
      showToast('BigQuery 查詢執行失敗');
    } finally {
      setExecutingSqlIndex(null);
    }
  };

  const handleCopyJson = (data: any, label: string) => {
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(text);
      showToast(`✓ 已複製 ${label} 至剪貼簿！`);
    } catch (e) {
      showToast('複製失敗');
    }
  };

  const handleInvestigateInCopilot = (log: ActivityLog) => {
    setActiveRailTab('copilot');
    const prompt = `針對實體 ${log.entityName} 發生的【${log.vector} - ${log.type}】異常日誌 (ID: ${log.id})，偏離度為 ${log.deviation}：「${log.description}」，請深入分析其攻擊鏈階段、潛在橫向移動威脅，並提供防禦處置措施。`;
    handleCopilotSubmit(prompt);
  };

  const handleClearCopilotHistory = () => {
    setCopilotMessages([
      {
        sender: 'gemini',
        text: '您好！我是您的 Gemini AI 安全調查聯防助手。歷史對話已重置。\n\n請輸入自然語言問題，例如：「幫我找出上週風險飆升前五名的研發部員工，並說明原因。」，或點擊下方快捷提示晶片。'
      }
    ]);
    setSqlResults({});
    showToast('已重設 Gemini Copilot 對話紀錄');
  };

  // Map entities for scatter chart
  const scatterPlotData = entitiesData.map(ent => ({
    x: ent.type === 'User' ? 1 : ent.type === 'Host' ? 2 : 3,
    y: ent.score,
    z: ent.score * 5, // size
    name: ent.name,
    dept: ent.department,
    id: ent.id,
    status: ent.status
  }));

  // Risk Heatmap data structure (X-axis: 0-23 hours, Y-axis: Mon-Sun)
  const heatmapHours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const heatmapDays = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  
  // Generating a realistic threat distribution map (higher peaks on off-hours and weekends for stealth vectors)
  const getHeatmapColor = (dayIndex: number, hour: number) => {
    // Simulated anomaly triggers
    if ((dayIndex === 4 && hour === 3) || (dayIndex === 4 && hour === 4)) return 'bg-red-500/80 ring-1 ring-red-400'; // Critical Red
    if (hour >= 1 && hour <= 5) {
      if (dayIndex >= 5) return 'bg-orange-500/60'; // Weekend night: Medium Orange
      return 'bg-blue-500/40'; // Weekday night: Low-Med Blue
    }
    if (dayIndex <= 4 && hour >= 9 && hour <= 18) {
      return 'bg-gray-800/30'; // Working hours: Super quiet
    }
    return 'bg-blue-500/20'; // Base noise
  };

  const handleEntitySelection = (id: string) => {
    const found = entitiesData.find(e => e.id === id);
    if (found) {
      setSelectedEntity(found);
      // Auto switch to Copilot or Investigate is fine, but keeping left active view intact
    }
  };

  // Ask Gemini about selected Log behavior
  const handleInterpretLog = async (log: ActivityLog) => {
    setInterpretingLogId(log.id);
    setSelectedLog(log);
    setGeminiLogInterpretation(null);
    
    try {
      const res = await fetch('/api/v1/ueba/copilot/interpret-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: log.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.interpretation) {
          setGeminiLogInterpretation(data.interpretation);
          setInterpretingLogId(null);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend interpret-log failed, falling back to local model:', e);
    }

    setTimeout(() => {
      let analysisResult = '';
      if (log.id === 'log-001') {
        analysisResult = '【Gemini 智慧解碼】：此登入日誌代表一宗重大的「憑證遭竊或跨國代理跳板劫持」。系統於 03:15:22 追蹤到一個成功的 Active Directory 安全驗證，然而 VPN 端點解析自英國倫敦。10 分鐘前該員工仍在台北存取資訊。換算其不可能的等效移動速度高達 58,800 km/h，係典型的地理不可能移動 (Impossible Travel)。行為特徵極高機率為帳戶憑證已被駭客竊取，並透過國外代理跳板切入內網自主發動攻擊。';
      } else if (log.id === 'log-002') {
        analysisResult = '【Gemini 智慧解碼】：此資料庫稽核軌跡呈現顯著的「特權濫用與敏感目錄偵察行為 (Database Discovery)」。此帳戶在此前 90 天被判定為【開發唯讀開發組權限】且從未呼叫過財務主動稽核資料。今日登入後突然橫向移動 (Lateral Movement) 並使用高頻 Wildcard 查詢語句一次性提取 42k 筆敏感財務資料。該活動偏離基準曲線 1,500%，疑似正著手抓取內部敏感勒索籌碼。';
      } else if (log.id === 'log-003') {
        analysisResult = '【Gemini 智慧解碼】：此端點日誌由 Wazuh 智能插針截獲。偵測事件為：透過無簽署、不常規被一般 R&D 執行的 PowerShell 微指令編譯並調用 7z.exe (AES-256 具備自解密防禦抗災性) 工具，強行建立一個高熵、大體積的外部封包儲存體。代表惡意主機代理解密正在清空或封裝底層財產，是雙重勒索發作前极具危險性的行為特徵。';
      } else if (log.id === 'log-004') {
        analysisResult = '【Gemini 智慧解碼】：極高風險的「敏感資料外發 exfiltration 警示門檻」。網路層監聽指出，該受監管端點向 MEGA.nz 網址發生突發性的 4.2GB 巨大對等對接（對等頻寬佔用高達專線 95%）。此行為偏離正常的月度外發水平，是駭客成功拼湊好資料包、繞過一般 DLP 行為防禦後的最後一個【黑產套現外傳】階段，應立即採取防禦攔截。';
      } else {
        analysisResult = '【Gemini 智慧解碼】：該日誌之時間軸特徵高度偏離Sarah的工作基準模式。財務處員工在 04:05:00 執行微軟郵件收件匣過濾規則竄改 (Rule Mutation)，將所有包含 sensitive, report, payment 之信件私下抄送外部伺服器。具有明顯的電子郵件劫持威脅特徵，可能為釣魚憑證外洩。';
      }
      setGeminiLogInterpretation(analysisResult);
      setInterpretingLogId(null);
    }, 1200);
  };

  // Submit prompt to Gemini Chat
  const handleCopilotSubmit = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;

    const query = userPrompt;
    setCopilotInput('');
    setCopilotMessages(prev => [...prev, { sender: 'user', text: query }]);
    setCopilotMessages(prev => [...prev, { sender: 'gemini', text: '', isWriting: true }]);

    try {
      const res = await fetch('/api/v1/ueba/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.response) {
          setCopilotMessages(prev => {
            const withoutWriting = prev.filter(m => !m.isWriting);
            return [...withoutWriting, data.response];
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Backend copilot query failed, falling back to local reasoner:', e);
    }

    setTimeout(() => {
      setCopilotMessages(prev => {
        const withoutWriting = prev.filter(m => !m.isWriting);
        
        let responseText = '';
        let responseSql = '';
        let chart: 'trend' | 'risk_profile' | undefined;

        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('五名') || lowerQuery.includes('5') || lowerQuery.includes('研發部') || lowerQuery.includes('jdoe') || lowerQuery.includes('john')) {
          responseText = `### 🔍 Gemini 行為大數據即時探針：\n\n基於您提出的意圖，我已自動呼叫 **GCP Dataflow 與 BigQuery APM Behavioral Engine**。我們將本週的行為偏差度、不可能的時間移動特徵、與大量資料庫存取數值進行聚合分析。\n\n**研發部風險居高前列者為：**\n\n1. **John Doe (jdoe)** - 分數 **92**: 發生Impossible Travel、跨網域 Finance_DB 野卡遍歷與 4.2GB MEGA 外傳。\n2. **James Wilson** - 分數 **88**: 觸發本地 7z 惡意封裝及 System32 密鑰導出。\n3. **Kevin (R&D-Agent2)** - 分數 **79**: 橫向嘗試連接 Git 主要儲存庫。\n\n我已將上述自然語言問題轉譯為 **BigQuery SQL 關聯聚合查詢**，並提取即時數值分佈。`;
          responseSql = `SELECT \n  user_id, \n  department, \n  anomaly_vector,\n  COUNT(log_id) AS total_anomalies,\n  AVG(risk_score) AS avg_score\nFROM \n  \`sec-ueba-prod.analytics.behavior_logs\`\nWHERE \n  department = 'R&D'\n  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)\nGROUP BY 1, 2, 3\nHAVING avg_score >= 60\nORDER BY avg_score DESC\nLIMIT 5;`;
          chart = 'risk_profile';
        } else if (lowerQuery.includes('ip') || lowerQuery.includes('接觸') || lowerQuery.includes('dossier')) {
          responseText = `### 🌐 惡意來源 IP 行為關聯報告 (IP Dossier)：\n\n對指標 IP **85.25.10.4** 進行反向追蹤，偵測為受控代理節點。本機與該 IP 曾建立 VPN 加密連線：\n\n- **接觸實體**：\`John Doe (R&D)\`\n- **登入通道**：TLS VPN 閘道端口 (Port 443)\n- **關聯警報**：Impossible Travel \n- **外傳記錄**：4.2GB 壓縮流量\n\n以下是 Google BigQuery 特徵關聯統計，可直接對 Looker Embedded 圖表進行深度交叉分析：`;
          responseSql = `SELECT \n  src_ip, \n  dest_ip, \n  bytes_sent, \n  app_id, \n  DATE_TRUNC(timestamp, HOUR) AS hour_bucket\nFROM \n  \`sec-ueba-prod.analytics.netflow\`\nWHERE \n  src_ip = '85.25.10.4' \n  OR dest_ip = '31.21.4.150';`;
          chart = 'trend';
        } else if (lowerQuery.includes('建議') || lowerQuery.includes('自動') || lowerQuery.includes('聯防') || lowerQuery.includes('playbook') || lowerQuery.includes('劇本')) {
          responseText = `### 🛡️ Gemini 智慧防禦劇本配置建議 (SOAR Playbook Oracle)：\n\n針對 John Doe (jdoe) 財務高危害勒索外傳鏈，Gemini 建議立刻串接 **Google Cloud Pub/Sub 與本地 XDR 控制台**，觸發以下自動聯防防護機制：\n\n1. **首要隔離**：下發 XDR 指令，全面中斷受 compromises 的 PC 端點。\n2. **憑證撤銷**：自動使 Azure AD/Okta 內該使用者的所有憑證 Session 失效。\n3. **零信任阻斷**：在 Firewall/VPN 模組直接全面封殺 MEGA.nz 外部 C2 及該英國跳板 IP。`;
          responseSql = `-- 自動聯防劇本 JSON 組態 (Payload)\n{\n  "action": "orchestrate_containment",\n  "target_user_id": "usr-johndoe",\n  "isolate_endpoints": ["Laptop-JohnD"],\n  "palo_alto_block_ips": ["85.25.10.4", "31.21.4.150"],\n  "revoke_ad_sessions": true\n}`;
        } else {
          responseText = `已收到您的查詢：*"${query}"*\n\n我已將問題提交至 **Vertex AI (Gemini 1.5 Pro) 模型代理庫**，將透過安全日誌特徵即時查詢底層資料湖。\n\n**推薦快捷指令晶片**：\n- 點擊下方 \`[✨ 生成此用戶的調查報告]\` \n- 點擊下方 \`[✨ 追蹤此惡意 IP 的所有接觸實體]\` \n- 點擊下方 \`[✨ 建議此事件的自動化聯防阻斷劇本]\``;
        }

        return [
          ...withoutWriting,
          {
            sender: 'gemini',
            text: responseText,
            sql: responseSql || undefined,
            chartType: chart || undefined
          }
        ];
      });
    }, 1500);
  };

  // Simulate API Connection nodes test for Indicator 3
  const handleApiNodesTest = async () => {
    if (apiTesting) return;
    setApiTesting(true);
    
    // Set all to checking
    setApiNodesStatus({
      splunk: 'checking',
      fortisiem: 'checking',
      qradar: 'checking',
      paloalto: 'checking',
      crowdstrike: 'checking',
      okta: 'checking'
    });

    try {
      const res = await fetch('/api/v1/ueba/integrations/test', { method: 'POST' });
      if (res.ok) {
        showToast('✓ 成功向後端完成 6 處 SIEM / EDR / SOAR API 異質聯防心跳驗證！');
      }
    } catch (e) {}

    setTimeout(() => {
      setApiNodesStatus(prev => ({ ...prev, splunk: 'online' }));
    }, 300);

    setTimeout(() => {
      setApiNodesStatus(prev => ({ ...prev, fortisiem: 'online' }));
    }, 600);

    setTimeout(() => {
      setApiNodesStatus(prev => ({ ...prev, qradar: 'online' }));
    }, 900);

    setTimeout(() => {
      setApiNodesStatus(prev => ({ ...prev, paloalto: 'online' }));
    }, 1200);

    setTimeout(() => {
      setApiNodesStatus(prev => ({ ...prev, crowdstrike: 'online' }));
    }, 1500);

    setTimeout(() => {
      setApiNodesStatus(prev => ({ ...prev, okta: 'online' }));
      setApiTesting(false);
    }, 1800);
  };

  // Simulate BigQuery & Dataflow Feature vector extraction for Indicator 1
  const handleFeatureExtractionSimulate = async () => {
    setFeaturesExtractionStatus('running');
    setFeaturesProgress(0);

    try {
      fetch('/api/v1/ueba/pipeline/feature-extraction', { method: 'POST' }).catch(() => {});
    } catch (e) {}
    
    const interval = setInterval(() => {
      setFeaturesProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setFeaturesExtractionStatus('completed');
          showToast('✓ 已調用 Dataflow & BigQuery 完成行為特徵向量提取！');
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  // Simulate Gemini 1.5 Pro Aurora Card Generation for Indicator 2
  const handleTriggerAuroraAnalysis = async () => {
    setAuroraAnalyzing(true);
    setAuroraRevealed(false);

    try {
      await fetch('/api/v1/ueba/models/aurora-analysis', { method: 'POST' });
    } catch (e) {}

    setTimeout(() => {
      setAuroraAnalyzing(false);
      setAuroraRevealed(true);
      showToast('✓ Gemini 極光智慧研判報告已即時生成！');
    }, 1500);
  };

  // Run containment playbook animation
  const handleExecutePlaybook = async (userName: string) => {
    setExecutingPlaybook(userName);
    setPlaybookStep(1);

    try {
      fetch('/api/v1/ueba/playbooks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUser: userName })
      }).catch(() => {});
    } catch (e) {}

    const steps = [
      '透過 Google Pub/Sub 向 Okta API 呼叫：即時凍結使用者 AD 帳戶...',
      '宣告 Open XDR 代理強制撤銷該實體所有雲端 SaaS Active Token...',
      '在防護牆下發指令：阻斷境外跳板 IP (85.25.10.4) 網路封包並限制 MEGA.nz 網域訪問...',
      '下發 EDR 端點指令：核心隔離 Laptop-JohnD 主機網路並導出完整的記憶體鑑識分析 (Memory Dump)...',
      '✓ 自動化遏阻劇本執行成功，安全阻斷措施完成！'
    ];

    let current = 1;
    const interval = setInterval(() => {
      current++;
      setPlaybookStep(current);
      if (current >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          setExecutingPlaybook(null);
          fetchUEBAData(true);
        }, 3500);
      }
    }, 1400);
  };

  return (
    <div className="w-full text-left bg-[#050608] min-h-[90vh] text-gray-200 font-sans p-2 relative selection:bg-indigo-500/30">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[300] bg-indigo-950/90 border border-indigo-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md text-xs font-bold"
          >
            <Sparkles size={16} className="text-cyan-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Anomaly Event Simulator Modal */}
      <AnimatePresence>
        {showSimulatorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-left"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0e1017] border border-amber-500/30 rounded-3xl w-full max-w-lg p-7 space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">UEBA 行為異常動態注入模擬器</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">即時發送異常資料至推論管道，驗證基準偏離計算與警示聯防</p>
                  </div>
                </div>
                <button onClick={() => setShowSimulatorModal(false)} className="text-gray-500 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSimulateAnomalySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">目標監控實體 (Entity)</label>
                  <select
                    value={simulatorForm.entityId}
                    onChange={(e) => setSimulatorForm({ ...simulatorForm, entityId: e.target.value })}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                  >
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.department} - {e.type})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">行為維度 (Vector)</label>
                    <select
                      value={simulatorForm.vector}
                      onChange={(e) => setSimulatorForm({ ...simulatorForm, vector: e.target.value as any })}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="Time/Space">時間與空間 (Time/Space)</option>
                      <option value="Data Volume">巨量資料傳輸 (Data Volume)</option>
                      <option value="Privilege Mutation">特權異動 (Privilege Mutation)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">日誌類型 (Type)</label>
                    <select
                      value={simulatorForm.type}
                      onChange={(e) => setSimulatorForm({ ...simulatorForm, type: e.target.value as any })}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="Authentication">身分認證 (Authentication)</option>
                      <option value="Endpoint">端點行為 (Endpoint)</option>
                      <option value="Network">網路封包 (Network)</option>
                      <option value="Database">資料庫存取 (Database)</option>
                      <option value="SaaS">SaaS 雲端 (SaaS)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">異常事件描述 (Description)</label>
                  <textarea
                    rows={2}
                    value={simulatorForm.description}
                    onChange={(e) => setSimulatorForm({ ...simulatorForm, description: e.target.value })}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                    placeholder="輸入詳細異常特徵描述..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">風險衝擊分數: {simulatorForm.score}</label>
                    <input
                      type="range"
                      min={50}
                      max={99}
                      value={simulatorForm.score}
                      onChange={(e) => setSimulatorForm({ ...simulatorForm, score: Number(e.target.value) })}
                      className="w-full accent-amber-500 mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">基準偏離標記 (Deviation)</label>
                    <input
                      type="text"
                      value={simulatorForm.deviation}
                      onChange={(e) => setSimulatorForm({ ...simulatorForm, deviation: e.target.value })}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-amber-500 text-xs"
                      placeholder="+5,800 km/h 或 +1,500%"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowSimulatorModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Zap size={13} />
                    <span>立即發送注入事件</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playbook Orchestration Floating Overlay */}
      <AnimatePresence>
        {executingPlaybook && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#0e1014] border border-red-500/30 rounded-[2.5rem] w-full max-w-lg p-10 space-y-8 shadow-[0_0_120px_rgba(239,68,68,0.15)] text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 animate-pulse">
                  <ShieldX size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">UEBA 全自動聯防處置控制器</h3>
                  <p className="text-xs text-red-400 font-mono mt-0.5">目標對象：{executingPlaybook}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  '1. 呼叫 Okta 停用該使用者 AD 身分權限',
                  '2. 下發 SaaS API 強行撤銷雲端 Session Token',
                  '3. 次世代防火牆策略阻斷惡意跳板與 MEGA.nz 連線',
                  '4. 核心實施 EDR 本端主機隔離網路 & 提取記憶體鏡像',
                  '5. 聯防部署就緒：觸發 SOC 警示推播 (Completed)'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-white/[0.02]">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black border transition-all ${
                      playbookStep > i + 1 
                        ? 'bg-green-500/20 border-green-500 text-green-400' 
                        : playbookStep === i + 1 
                          ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                          : 'bg-gray-800/20 border-gray-700 text-gray-500'
                    }`}>
                      {playbookStep > i + 1 ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-bold ${
                      playbookStep > i + 1 
                        ? 'text-green-400 font-normal line-through' 
                        : playbookStep === i + 1 
                          ? 'text-white font-black' 
                          : 'text-gray-500'
                    }`}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right">
                <button 
                  disabled={playbookStep < 5}
                  onClick={() => setExecutingPlaybook(null)}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-all shadow-lg shadow-red-600/20"
                >
                  確認並關閉監控
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Top Header - Platform Title with Technology Stack Markers */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 bg-gradient-to-br from-[#0c0d12]/90 to-[#07080b]/90 border border-gray-900 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 relative">
              <Sparkles className="text-white animate-pulse" size={32} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center text-[8px] font-black border border-[#050608] text-white">AI</div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">User & Entity Behavior Analytics (UEBA)</h1>
                <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Google Vertex AI Connected
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  isBackendConnected 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {isBackendConnected ? 'UEBA 推論引擎: 線上即時 (Connected: /api/v1/ueba)' : '離線容錯模式'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed max-w-4xl">
                基於 Google Cloud 數據生態（Pub/Sub + BigQuery）與 Vertex AI 的高維行為分析集群。
                能動態建模使用者正常行為基線 (Baseline Profiling)，極速追蹤不可能之移動、資料大量異常解密外傳、與越權橫向移動，並提供 Gemini 1.5 自然語言威脅故事線轉譯。
              </p>
            </div>
          </div>
          
          {/* GCP Ecosystem Pillars & Live Backend Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-black/40 border border-white/[0.03] p-4 rounded-2xl">
            <div className="text-right pr-3 border-r border-white/5">
              <span className="text-[9px] font-black text-gray-500 uppercase block tracking-wider">Storage & Analytic Stack</span>
              <span className="text-xs font-mono font-bold text-gray-300">BigQuery Data Lake</span>
            </div>
            <div className="text-right pr-3 border-r border-white/5">
              <span className="text-[9px] font-black text-gray-500 uppercase block tracking-wider">Engine Mode</span>
              <span className="text-xs font-mono font-bold text-indigo-400">Vertex AI / Isolation</span>
            </div>
            <div className="text-left pr-3 border-r border-white/5">
              <span className="text-[9px] font-black text-gray-500 uppercase block tracking-wider">AI Copilot</span>
              <span className="text-xs font-mono font-bold text-cyan-400">Gemini 1.5 Pro</span>
            </div>
            {/* Live Backend Connection Indicator & Simulator */}
            <div className="flex items-center gap-2 pl-1">
              <button
                onClick={() => setShowSimulatorModal(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/5"
              >
                <Zap size={12} className="text-amber-400 animate-pulse" />
                <span>模擬注入異常</span>
              </button>
              <button
                onClick={() => fetchUEBAData(false)}
                disabled={isRefreshing}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-xs"
                title="重新整理行為模型特徵"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Data Behavior Ingestion Pipeline - Live Monitoring Schematic */}
        <div className="p-5 bg-[#0b0c10]/70 border border-gray-900 rounded-3xl">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-400 animate-pulse" size={16} />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">多源資料特徵匯流與即時模型處理管道 (Pub/Sub + Dataflow Ingestion)</h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> GCP Pub/Sub Ingestion Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Core logs categories */}
            {[
              { id: 0, label: 'AD &身分登入 (AD/IAM)', count: ingestionCount.authCount, icon: <Key size={14} />, desc: '身分權限 & MFA 記錄', source: 'Pub/Sub Stream-01' },
              { id: 1, label: '端點偵測指標 (EDR)', count: ingestionCount.endCount, icon: <Monitor size={14} />, desc: '進程特徵 & Wazuh Logs', source: 'Pub/Sub Stream-02' },
              { id: 2, label: '邊際與VPN流量 (Network)', count: ingestionCount.netCount, icon: <Network size={14} />, desc: 'Netflow & VPN Gateway', source: 'Pub/Sub Stream-03' },
              { id: 3, label: '雲端行為審計 (SaaS Logs)', count: ingestionCount.saasCount, icon: <Globe size={14} />, desc: 'Exchange & Cloud Audit', source: 'Pub/Sub Stream-04' },
            ].map((stream) => (
              <div 
                key={stream.id} 
                className={`p-4 bg-black/40 border rounded-2xl transition-all duration-300 relative overflow-hidden ${
                  activePipelinePulse === stream.id ? 'border-indigo-500/40 bg-indigo-500/[0.02]' : 'border-white/[0.02]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${activePipelinePulse === stream.id ? 'bg-indigo-500/15 text-indigo-400' : 'bg-white/5 text-gray-400'}`}>
                      {stream.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-200">{stream.label}</h4>
                      <p className="text-[8px] font-medium text-gray-500 mt-0.5">{stream.desc}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono bg-white/5 px-1.5 py-0.5 text-gray-400 rounded">{stream.source}</span>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <span className="text-[8px] font-black text-gray-500 block uppercase tracking-wider">即時匯量 (Packets)</span>
                    <span className="text-lg font-mono font-bold text-white transition-all duration-500">{stream.count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-green-400">
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
                    <span>即時解析</span>
                  </div>
                </div>
                {/* Active pipeline fluid wave */}
                {activePipelinePulse === stream.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* THREE-COLUMN LAYOUT STRICTLY FOLLOWING UI SPECIFICATIONS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: LEFT NAVIGATION RAIL (Google Material M3-inspired layout) */}
          <div className="xl:col-span-2 bg-[#0c0d12]/90 border border-gray-900 rounded-3xl p-4 space-y-4">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-1">UEBA CONTROLLER</span>
              <p className="text-xs font-bold text-white uppercase tracking-tight">監控功能導覽列</p>
            </div>
            
            <nav className="space-y-1.5">
              {[
                { id: 'home', label: '首頁儀表板', desc: 'Global Dashboard', icon: <Activity size={18} /> },
                { id: 'threats', label: '威脅實體排行', desc: 'Leaderboard', icon: <Users size={18} /> },
                { id: 'investigate', label: '事件調查中心', desc: 'Dossier Log', icon: <FileSearch size={18} /> },
                { id: 'copilot', label: 'GenAI 助理對話', desc: 'Gemini Copilot', icon: <Bot size={18} /> },
                { id: 'indicators', label: '落地規劃三核心指標', desc: 'Core Implementation', icon: <Sliders size={18} /> },
                { id: 'settings', label: '正常行為基準設定', desc: 'M3 Base Profile', icon: <Settings size={18} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRailTab(tab.id as any)}
                  className={`w-full group px-4 py-3.5 rounded-2xl flex items-center gap-4 transition-all text-left ${
                    activeRailTab === tab.id 
                      ? 'bg-indigo-600 border border-indigo-500/30 text-white shadow-xl shadow-indigo-600/10' 
                      : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`transition-all duration-300 ${activeRailTab === tab.id ? 'scale-110 text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {tab.icon}
                  </div>
                  <div>
                    <span className="text-xs font-black block tracking-tight">{tab.label}</span>
                    <span className={`text-[8px] font-mono tracking-widest block uppercase ${activeRailTab === tab.id ? 'text-indigo-200' : 'text-gray-600'}`}>{tab.desc}</span>
                  </div>
                </button>
              ))}
            </nav>

            <div className="pt-6 border-t border-white/5 px-2">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <span className="text-[8px] font-black text-gray-500 uppercase block tracking-widest">實體與行為建模統計</span>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">被追蹤使用者:</span>
                  <span className="font-mono font-bold text-white">1,402 人</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">受建模主機 (Hosts):</span>
                  <span className="font-mono font-bold text-white">3,124 台</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">今日異常行為判斷:</span>
                  <span className="font-mono font-bold text-red-400">12 組</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: CENTRAL MAIN VISUALIZATION AREA */}
          <div className="xl:col-span-7 space-y-6">
            
            {activeRailTab === 'home' && (
              <>
                {/* 1. Global Interactive Risk Bubble Chart (Size is Risk score, X-axis represents Users/Hosts, Y-axis represents Risk) */}
                <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">高風險實體關聯泡泡圖 (Risk Bubble Chart)</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">X 軸：實體主要類別，Y 軸：Vertex AI 非監督式非線性風險評估百分比（泡泡越大代表衝擊分數越高）</p>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest bg-black/40 border border-white/5 p-2 rounded-xl">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> 危險 (&gt;85)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> 可疑 (60-84)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> 注意 (40-59)</span>
                    </div>
                  </div>

                  {/* Bubble coordinates plot area (D3 styled interactive React visualization) */}
                  <div className="h-72 w-full bg-black/30 border border-white/5 rounded-2xl relative p-4 flex items-center justify-center">
                    <div className="absolute inset-0 grid grid-cols-3 divide-x divide-white/[0.02]" />
                    <div className="absolute inset-0 grid grid-rows-5 divide-y divide-white/[0.02]" />
                    
                    {/* Floating Bubble Nodes */}
                    <AnimatePresence>
                      {entitiesData.map((ent, idx) => {
                        const score = ent.score;
                        const bubbleSize = 35 + (score - 50) * 0.8; // scaling bubble
                        
                        // Positioning layout depending on their category types
                        let leftOffset = '20%';
                        if (ent.type === 'Host') leftOffset = '50%';
                        if (ent.type === 'IP') leftOffset = '80%';
                        if (ent.id === 'usr-sarahchen') leftOffset = '30%';

                        const topOffset = `${100 - score}%`;
                        const isSelected = selectedEntity?.id === ent.id;

                        return (
                          <motion.div
                            key={ent.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 15, delay: idx * 0.1 }}
                            onClick={() => handleEntitySelection(ent.id)}
                            className="absolute cursor-pointer flex flex-col items-center justify-center group"
                            style={{ 
                              left: leftOffset, 
                              top: topOffset, 
                              transform: 'translate(-50%, -50%)',
                              zIndex: isSelected ? 30 : 10
                            }}
                          >
                            <div 
                              className={`rounded-full flex flex-col items-center justify-center relative transition-all duration-300 shadow-2xl ${
                                ent.status === 'Critical' 
                                  ? 'bg-red-500/10 border-2 border-red-500/80 text-red-400 group-hover:bg-red-500/30' 
                                  : ent.status === 'Suspicious'
                                    ? 'bg-orange-500/10 border-2 border-orange-500/80 text-orange-400 group-hover:bg-orange-500/30'
                                    : 'bg-blue-500/10 border border-blue-500/60 text-blue-400 group-hover:bg-blue-500/30'
                              } ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-[#050608] scale-110 shadow-indigo-500/10' : ''}`}
                              style={{ width: `${bubbleSize}px`, height: `${bubbleSize}px` }}
                            >
                              <span className="text-[10px] font-black uppercase tracking-wider">{ent.avatar}</span>
                              <span className="text-[11px] font-black italic mt-0.5">{score}</span>
                              
                              {/* Pulse overlay inside bubble */}
                              {ent.status === 'Critical' && (
                                <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-25 pointer-events-none" />
                              )}
                            </div>
                            
                            {/* Hover tooltip label */}
                            <div className="mt-2 bg-black/90 border border-white/10 px-2.5 py-1 rounded-lg text-center opacity-70 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-black text-white block truncate max-w-[120px]">{ent.name}</span>
                              <span className="text-[8px] font-mono font-black text-gray-500 uppercase block">{ent.department}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Stage labels */}
                    <div className="absolute bottom-2 left-[20%] -translate-x-1/2 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-black">使用身分 (Users)</div>
                    <div className="absolute bottom-2 left-[50%] -translate-x-1/2 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-black">實體資產 (Hosts)</div>
                    <div className="absolute bottom-2 left-[80%] -translate-x-1/2 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-black">外部資源 (SaaS/IPs)</div>
                  </div>
                </div>

                {/* 2. Global Behavior Risk Heatmap (24 hours / Weekly) */}
                <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2rem] p-6 shadow-2xl relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">全域日常風險熱趨勢圖 (Enterprise Risk Heatmap)</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">根據 14 天滾動多源資料建模，展示過去一週異常事件在 24 小時時段中的發生頻率分佈</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2.5 py-1 text-gray-400 rounded-lg">UTC+8台北時間關聯</span>
                  </div>

                  {/* Grid system representing the heatmap directly */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[650px] space-y-1.5 p-2 bg-black/40 border border-white/5 rounded-2xl">
                      {heatmapDays.map((dayName, dayIdx) => (
                        <div key={dayName} className="flex items-center gap-1">
                          <div className="w-12 text-[10px] font-bold text-gray-400 capitalize">{dayName}</div>
                          <div className="flex-1 grid grid-cols-24 gap-1">
                            {heatmapHours.map((_, hrIdx) => (
                              <div
                                key={hrIdx}
                                className={`h-6 rounded-md hover:scale-110 active:scale-95 transition-all cursor-pointer relative group ${getHeatmapColor(dayIdx, hrIdx)}`}
                              >
                                {/* Heatmap custom hover tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/95 border border-white/10 p-2 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-2xl">
                                  <span className="text-[9px] font-black text-white block">{dayName} {hrIdx}:00 - {hrIdx}:59</span>
                                  <span className="text-[8px] font-bold text-indigo-400 block mt-0.5">
                                    {(dayIdx === 4 && hrIdx === 3) ? '🚨 Critical: Impossible travel 關聯' : '正常噪聲級別'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* X-axis indicators */}
                      <div className="flex items-center gap-1 pt-1 pl-12">
                        <div className="flex-1 grid grid-cols-24 gap-1 text-[8px] font-mono text-gray-600 font-bold text-center">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i}>{i}h</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeRailTab === 'threats' && (
              <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2rem] p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase flex items-center gap-2">
                      <ShieldAlert className="text-red-400" size={22} />
                      威脅特徵與實體排行 (UEBA Threat Leaderboard)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Vertex AI 實體非監督式學習引擎：多維異常關聯已聚類高風險實體，支援即時隔離處置與觀察名單管理。
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl font-bold">
                      總監控實體: <span className="text-indigo-400">{entitiesData.length}</span>
                    </span>
                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold">
                      高危實體: {entitiesData.filter(e => e.status === 'Critical').length}
                    </span>
                  </div>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-xs">
                  <div className="relative md:col-span-2">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={threatSearchQuery}
                      onChange={(e) => setThreatSearchQuery(e.target.value)}
                      placeholder="搜尋實體姓名、帳號 ID、部門或異常特徵..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <select
                      value={threatDeptFilter}
                      onChange={(e) => setThreatDeptFilter(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none focus:border-indigo-500"
                    >
                      <option value="All">所有部門 (All Depts)</option>
                      <option value="研發部">研發部 (R&D)</option>
                      <option value="財務處">財務處 (Finance)</option>
                      <option value="資訊部">資訊部 (IT-Infra)</option>
                      <option value="決策層">決策層 (Executive)</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={threatStatusFilter}
                      onChange={(e) => setThreatStatusFilter(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none focus:border-indigo-500"
                    >
                      <option value="All">所有風險等級 (All Levels)</option>
                      <option value="Critical">🚨 危險 (Critical &gt;85)</option>
                      <option value="Suspicious">⚠️ 可疑 (Suspicious 60-84)</option>
                      <option value="Attention">ℹ️ 注意 (Attention 40-59)</option>
                      <option value="WatchlistOnly">🔥 僅觀察名單 (Watchlist)</option>
                    </select>
                  </div>
                </div>

                {/* Entities Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {entitiesData
                    .filter(ent => {
                      if (threatDeptFilter !== 'All' && !ent.department.includes(threatDeptFilter)) return false;
                      if (threatStatusFilter === 'WatchlistOnly' && !ent.watchlist) return false;
                      if (threatStatusFilter !== 'All' && threatStatusFilter !== 'WatchlistOnly' && ent.status !== threatStatusFilter) return false;
                      if (threatSearchQuery.trim()) {
                        const q = threatSearchQuery.toLowerCase();
                        const match = ent.name.toLowerCase().includes(q) ||
                          ent.id.toLowerCase().includes(q) ||
                          ent.department.toLowerCase().includes(q) ||
                          ent.riskFactors.some(rf => rf.toLowerCase().includes(q));
                        if (!match) return false;
                      }
                      return true;
                    })
                    .map((ent) => (
                      <div 
                        key={ent.id}
                        className={`p-6 bg-black/40 border rounded-[2rem] transition-all flex flex-col justify-between ${
                          selectedEntity?.id === ent.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleEntitySelection(ent.id)}>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                                ent.status === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {ent.avatar}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                  {ent.name}
                                  {ent.watchlist && (
                                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[8px] font-black uppercase">
                                      Watchlist
                                    </span>
                                  )}
                                  {ent.contained && (
                                    <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-[8px] font-black uppercase">
                                      Contained
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-0.5">{ent.department} • {ent.type} • ID: {ent.id}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-2xl font-mono font-black italic block ${
                                ent.score >= 85 ? 'text-red-400' : ent.score >= 60 ? 'text-orange-400' : 'text-indigo-400'
                              }`}>
                                {ent.score}
                              </span>
                              <span className="text-[8px] font-black text-gray-600 block uppercase tracking-wider">行為風險指數</span>
                            </div>
                          </div>

                          {/* Peer group and deviation pills */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {ent.peerGroup && (
                              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded">
                                同儕群組: {ent.peerGroup}
                              </span>
                            )}
                            {ent.baselineDeviationPct !== undefined && ent.baselineDeviationPct > 0 && (
                              <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[9px] font-mono font-bold rounded">
                                基準偏離度 +{ent.baselineDeviationPct}%
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 mt-2">
                            <span className="text-[9px] font-black text-gray-500 uppercase block tracking-widest">異常因子偵測：</span>
                            <div className="flex flex-wrap gap-1.5">
                              {ent.riskFactors.map((factor, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/[0.03] text-[9px] font-bold text-gray-400 rounded">
                                  {factor}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Action Toolbar */}
                        <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-gray-500">
                            <span>最後活動時間：{ent.lastActive}</span>
                            <button
                              onClick={() => handleEntitySelection(ent.id)}
                              className="text-indigo-400 hover:text-indigo-300 font-extrabold flex items-center gap-1"
                            >
                              展開 360 側欄 <ArrowRight size={10} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleToggleWatchlist(ent)}
                              className={`py-1.5 px-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1 border transition-all ${
                                ent.watchlist
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              <Flame size={10} className={ent.watchlist ? 'text-amber-400' : ''} />
                              {ent.watchlist ? '移出觀察' : '入觀察名單'}
                            </button>

                            <button
                              onClick={() => handleToggleContainment(ent)}
                              className={`py-1.5 px-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1 border transition-all ${
                                ent.contained
                                  ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              <Lock size={10} className={ent.contained ? 'text-red-400' : ''} />
                              {ent.contained ? '解除隔離' : '即時隔離'}
                            </button>

                            <button
                              onClick={() => handleResetEntityRisk(ent)}
                              className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-1 transition-all"
                              title="重設該實體風險指標為正常背景值"
                            >
                              <RotateCcw size={10} />
                              重置風險
                            </button>
                          </div>

                          {ent.status === 'Critical' && (
                            <button
                              onClick={() => handleExecutePlaybook(ent.name)}
                              className="w-full py-2 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-red-900/20"
                            >
                              <ShieldX size={12} />
                              立即執行全自動遏阻 Playbook
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeRailTab === 'investigate' && (
              <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2rem] p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase flex items-center gap-2">
                      <Activity className="text-cyan-400" size={22} />
                      多維度異常日誌調查矩陣 (Incident Multi-Dimensional Logs)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      可直接對底層 BigQuery 行為大數據湖進行「Gemini 智慧解碼、白話轉譯」與多維度特徵調取。
                    </p>
                  </div>
                  
                  {/* Category Filter Pills */}
                  <div className="flex gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
                    {['All', 'Time/Space', 'Data Volume', 'Privilege Mutation'].map((pill) => (
                      <button
                        key={pill}
                        onClick={() => setActiveAnomalyFilter(pill as any)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeAnomalyFilter === pill 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {pill === 'All' ? '全域向量' : pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-xs">
                  <div className="relative md:col-span-2">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={investigateSearch}
                      onChange={(e) => setInvestigateSearch(e.target.value)}
                      placeholder="搜尋事件特徵、偏離描述、原始日誌內容、IP 或來源..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <select
                      value={investigateEntityId}
                      onChange={(e) => setInvestigateEntityId(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none focus:border-indigo-500"
                    >
                      <option value="All">全部實體 (All Entities)</option>
                      {entitiesData.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {activityLogs
                    .filter(log => {
                      if (activeAnomalyFilter !== 'All' && log.vector !== activeAnomalyFilter) return false;
                      if (investigateEntityId !== 'All' && log.entityId !== investigateEntityId) return false;
                      if (investigateSearch.trim()) {
                        const q = investigateSearch.toLowerCase();
                        const match = log.description.toLowerCase().includes(q) ||
                          log.entityName.toLowerCase().includes(q) ||
                          log.source.toLowerCase().includes(q) ||
                          log.rawLog.toLowerCase().includes(q) ||
                          log.vector.toLowerCase().includes(q);
                        if (!match) return false;
                      }
                      return true;
                    })
                    .map((log) => (
                      <div 
                        key={log.id} 
                        className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all relative"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-gray-500">{log.time}</span>
                            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded">
                              {log.type}
                            </span>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-300 text-[9px] font-bold rounded">
                              維度: {log.vector}
                            </span>
                            <span 
                              onClick={() => handleEntitySelection(log.entityId)}
                              className="text-xs font-bold text-gray-300 hover:text-indigo-400 cursor-pointer italic"
                            >
                              {log.entityName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                              {log.deviation}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                              Score: {log.score}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 font-bold leading-relaxed">{log.description}</p>

                        <div className="p-3 bg-black/60 rounded-xl border border-white/5 font-mono text-[10px] text-gray-400 whitespace-pre-wrap overflow-x-auto truncate">
                          {log.rawLog}
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                          <span className="text-[10px] text-gray-500 font-bold">來源管道：{log.source}</span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyJson(log.rawLog, '原始日誌')}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5"
                            >
                              <Copy size={11} />
                              複製 JSON
                            </button>

                            <button
                              onClick={() => handleInvestigateInCopilot(log)}
                              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                            >
                              <Bot size={11} />
                              帶入 Copilot 深入調查
                            </button>

                            <button
                              onClick={() => handleInterpretLog(log)}
                              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-500/10"
                            >
                              <Sparkles size={12} className="animate-pulse" />
                              {interpretingLogId === log.id ? '分析解碼中...' : '要求 Gemini 翻譯此 Log'}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Interpretation UI */}
                        {interpretingLogId === log.id && (
                          <div className="p-4 bg-[#0a0d15] border border-cyan-500/30 rounded-xl text-xs text-gray-300 animate-pulse mt-3">
                            Gemini AI 正在呼叫行為模型引擎並進行深度情境關聯解讀...
                          </div>
                        )}

                        {selectedLog?.id === log.id && !interpretingLogId && geminiLogInterpretation && (
                          <div className="p-5 bg-gradient-to-br from-indigo-950/20 via-[#0d0e15] to-[#07090f] border border-indigo-500/30 rounded-xl text-xs text-gray-300 space-y-2 mt-3 shadow-inner relative">
                            <button 
                              onClick={() => { setSelectedLog(null); setGeminiLogInterpretation(null); }} 
                              className="absolute top-2 right-2 text-gray-500 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                              <Bot size={14} />
                              <span>Gemini 威脅故事白話摘要</span>
                            </div>
                            <p className="leading-relaxed text-gray-300 font-medium whitespace-pre-line">{geminiLogInterpretation}</p>
                          </div>
                        )}

                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeRailTab === 'copilot' && (
              <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2rem] p-8 space-y-6 shadow-2xl relative min-h-[500px] flex flex-col justify-between">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase flex items-center gap-2">
                      <Sparkles className="text-indigo-400" size={20} />
                      Gemini 自然語言大數據調查助手 (Security Copilot)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Vertex AI 已串接 BigQuery 實體數據庫。直接呼叫自然語言探針，Gemini 將自動把問題轉譯為 BigQuery 標準 SQL 並視覺化。
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyJson(copilotMessages, '對話紀錄')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Copy size={11} />
                      複製紀錄
                    </button>
                    <button
                      onClick={handleClearCopilotHistory}
                      className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={11} />
                      清空對話
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 max-h-[460px] overflow-y-auto p-4 bg-black/30 border border-white/5 rounded-2xl custom-scrollbar my-4">
                  {copilotMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-3 max-w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'gemini' && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                          <Bot size={16} />
                        </div>
                      )}
                      
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed text-gray-300 max-w-[90%] border ${
                        msg.sender === 'user' 
                          ? 'bg-indigo-600/10 border-indigo-500/30' 
                          : 'bg-black/60 border-white/[0.04]'
                      }`}>
                        {msg.isWriting ? (
                          <div className="flex items-center gap-2 text-indigo-400 font-bold">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            <span>Gemini 正在轉譯 SQL 與獲取日誌特徵...</span>
                          </div>
                        ) : (
                          <>
                            <div className="whitespace-pre-line font-medium text-gray-200">{msg.text}</div>
                            
                            {/* Render translated BigQuery SQL Code block if exists */}
                            {msg.sql && (
                              <div className="mt-4 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider font-mono">
                                    Translated Looker-BigQuery SQL:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleCopyJson(msg.sql, 'SQL 語法')}
                                      className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded text-[9px] font-mono flex items-center gap-1"
                                    >
                                      <Copy size={9} /> 複製
                                    </button>
                                    <button
                                      onClick={() => handleExecuteBigQuerySql(idx, msg.sql!)}
                                      disabled={executingSqlIndex === idx}
                                      className="px-2.5 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all"
                                    >
                                      <Play size={9} className={executingSqlIndex === idx ? 'animate-spin' : ''} />
                                      {executingSqlIndex === idx ? '執行中...' : '▶ 執行 BigQuery 查詢'}
                                    </button>
                                  </div>
                                </div>
                                <pre className="p-3 bg-black/80 rounded-xl border border-white/5 text-[9px] font-mono text-cyan-100 overflow-x-auto whitespace-pre">
                                  {msg.sql}
                                </pre>

                                {/* Live BigQuery Execution Result Table */}
                                {sqlResults[idx] && (
                                  <div className="mt-3 p-3 bg-[#080a10] border border-cyan-500/30 rounded-xl space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400">
                                      <span className="flex items-center gap-1.5 font-bold">
                                        <CheckCircle2 size={11} className="text-emerald-400" />
                                        BigQuery 查詢結果 (Live Dataset)
                                      </span>
                                      <div className="flex items-center gap-2 text-gray-400">
                                        <span>處理量: {sqlResults[idx].bytesProcessed}</span>
                                        <span>•</span>
                                        <span>耗時: {sqlResults[idx].executionTimeMs}ms</span>
                                      </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-[9px] font-mono text-left border-collapse">
                                        <thead>
                                          <tr className="border-b border-white/10 text-gray-400 bg-white/[0.02]">
                                            {sqlResults[idx].columns.map(col => (
                                              <th key={col} className="p-1.5 font-bold uppercase">{col}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-gray-300">
                                          {sqlResults[idx].rows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-white/[0.02]">
                                              {sqlResults[idx].columns.map(col => (
                                                <td key={col} className="p-1.5 whitespace-nowrap">
                                                  {String(row[col])}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Render simulated Looker charts embed inside chat messages */}
                            {msg.chartType && (
                              <div className="mt-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                                <span className="text-[9px] font-black text-gray-500 block uppercase tracking-widest">Looker Embedded Query Chart (Live)</span>
                                {msg.chartType === 'risk_profile' ? (
                                  <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                      <span>John Doe (Impossible Travel)</span>
                                      <span className="font-mono text-red-400">92/100</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-red-500 h-full w-[92%]" />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                      <span>James Wilson (7z Packing Anomaly)</span>
                                      <span className="font-mono text-orange-400">88/100</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-orange-500 h-full w-[88%]" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-20 flex items-end justify-between pl-4 pr-4 border-b border-white/5 pt-2">
                                    {[20, 45, 12, 89, 110, 60, 40].map((v, i) => (
                                      <div 
                                        key={i} 
                                        className="w-4 bg-indigo-500 rounded-t-sm relative group"
                                        style={{ height: `${(v / 120) * 100}%` }}
                                      >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">{v} GB</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prompt chips */}
                <div className="flex flex-wrap gap-2 py-2">
                  {[
                    { label: '✨ 找出研發部前五名高風險員工', text: '幫我找出上週風險飆升前五名的研發部員工，並說明原因。' },
                    { label: '✨ 生成 John Doe 的綜合調查報告', text: '請生成 John Doe (jdoe) 今日異常外傳的綜合威脅調查報告' },
                    { label: '✨ 追蹤惡意 IP 85.25.10.4 接觸實體', text: '追蹤與跳板 IP 85.25.10.4 進行 VPN 封包接觸的所有實體資產與對象' },
                    { label: '✨ 建議自動阻斷編排劇本 (SOAR)', text: '針對 John Doe 今日發生的 impossible travel 及 MEGA 大量外傳，建議自動化 SOAR 聯防阻斷劇本' }
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleCopilotSubmit(chip.text)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider rounded-full transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Chat input form */}
                <div className="relative mt-2">
                  <input 
                    type="text" 
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCopilotSubmit(copilotInput)}
                    placeholder="請輸入自然語言指令，Gemini 將自動執行大數據查詢..."
                    className="w-full bg-black/60 border border-white/10 p-4 pl-5 pr-14 text-xs text-white rounded-2xl outline-none focus:border-indigo-500 transition-all shadow-inner placeholder-gray-600"
                  />
                  <button 
                    onClick={() => handleCopilotSubmit(copilotInput)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all shadow-lg"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeRailTab === 'indicators' && (
              <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2.5rem] p-8 space-y-6 shadow-2xl text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase flex items-center gap-2">
                      <Sparkles className="text-cyan-400 animate-pulse" size={20} />
                      Google Gemini UEBA 落地專案開發指標
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      本模組深度分解 GCP Dataflow / BigQuery 數據特徵清洗、Gemini 極光智慧卡與 SOAR API 異質聯防設定。
                    </p>
                  </div>

                  {/* Switch Sub-Tabs */}
                  <div className="flex p-1 bg-black/50 border border-white/5 rounded-xl self-start md:self-center">
                    {[
                      { id: 'indicator2_aurora', label: '指標 2: 極光智慧卡', icon: <Sparkles size={12} /> },
                      { id: 'indicator1_dataflow', label: '指標 1: 資料清洗 SQL/Beam', icon: <Code size={12} /> },
                      { id: 'indicator3_soar', label: '指標 3: EDR/SIEM API 聯防', icon: <Network size={12} /> },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveIndicatorsSubTab(tab.id as any)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                          activeIndicatorsSubTab === tab.id
                            ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300 shadow-lg'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub Tab Contents */}
                
                {/* 1. INDICATOR 2: GEMINI AURORA SMART JUDGEMENT REPORT */}
                {activeIndicatorsSubTab === 'indicator2_aurora' && (
                  <div className="space-y-6">
                    <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
                      <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">場景：R&D 核心代碼庫異常外洩與特權橫向移動</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-bold">
                        當前系統持續對接 R&D 主任工程師 <span className="text-cyan-300">jason_dev</span> 的日誌。此處模擬當其帳戶憑證被竊後，
                        觸發的多個異常行為日誌堆疊在 BigQuery 行為安全湖。
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Left Pane - Raw telemetry log stack */}
                      <div className="space-y-4 bg-black/40 border border-white/5 p-6 rounded-[2rem]">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">第一批日誌對接規格事件：</span>
                        
                        <div className="space-y-3">
                          {/* Log Event A: Windows AD Log */}
                          <div className="p-3.5 bg-black/60 rounded-xl border-l-2 border-red-500 text-xs">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="font-mono text-gray-500">Log A • Windows Security AD Log</span>
                              <span className="text-red-400 font-bold font-mono">Event ID 4624</span>
                            </div>
                            <p className="text-gray-300 font-bold mb-1.5">jason_dev 帳戶於非慣用時段自英國 IP 登入 AD</p>
                            <pre className="p-2 bg-black/80 rounded border border-white/5 font-mono text-[9px] text-gray-500 overflow-x-auto">
                              LogonType: 10 (RemoteInteractive) | SrcIP: 185.25.10.4 (UK Proxy)
                            </pre>
                          </div>

                          {/* Log Event B: Syslog Git Code Repo */}
                          <div className="p-3.5 bg-black/60 rounded-xl border-l-2 border-amber-500 text-xs">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="font-mono text-gray-500">Log B • Linux Git Server Syslog</span>
                              <span className="text-amber-400 font-bold font-mono">SSH session</span>
                            </div>
                            <p className="text-gray-300 font-bold mb-1.5">SSH 金鑰登入代碼伺服器，並大量拉取 (Clone) 秘密商業專利 Repo</p>
                            <pre className="p-2 bg-black/80 rounded border border-white/5 font-mono text-[9px] text-gray-500 overflow-x-auto">
                              git-daemon: Connection from 10.150.2.82 | Cmd: git-upload-pack --strict
                            </pre>
                          </div>

                          {/* Log Event C: Network Flow */}
                          <div className="p-3.5 bg-black/60 rounded-xl border-l-2 border-teal-500 text-xs">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="font-mono text-gray-500">Log C • Network Flow Log</span>
                              <span className="text-teal-400 font-bold font-mono">DLP Netflow</span>
                            </div>
                            <p className="text-gray-300 font-bold mb-1.5">本機啟動壓縮並加密外發大封包 (總量達 4.8GB) 至外部 MEGA 雲端儲存</p>
                            <pre className="p-2 bg-black/80 rounded border border-white/5 font-mono text-[9px] text-gray-500 overflow-x-auto">
                              Protocol: TCP | Dst: 31.216.4.150 (mega.nz) | Bytes: 5,153,960,755
                            </pre>
                          </div>
                        </div>

                        <button
                          onClick={handleTriggerAuroraAnalysis}
                          disabled={auroraAnalyzing}
                          className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-2xl text-white shadow-xl shadow-cyan-500/10 transition-all flex items-center justify-center gap-2"
                        >
                          {auroraAnalyzing ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Gemini 1.5 Pro 多源稽核特徵對齊中...
                            </>
                          ) : (
                            <>
                              <Bot size={14} className="animate-pulse" />
                              召喚 Gemini 雙引擎進行自動安全研判
                            </>
                          )}
                        </button>
                      </div>

                      {/* Right Pane - The Aurora Glow Card Mockup */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">指標 2 前端成果：「智慧研判極光漸層卡」</span>
                        
                        {!auroraRevealed && !auroraAnalyzing && (
                          <div className="h-[430px] border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center p-6 bg-black/20">
                            <Bot className="text-gray-600 mb-3 animate-bounce" size={32} />
                            <h5 className="text-xs font-black text-gray-400 uppercase">等待 AI 研判召喚</h5>
                            <p className="text-[10px] text-gray-500 max-w-[250px] mx-auto mt-2 leading-relaxed">
                              點擊左側「召喚 Gemini 雙引擎進行自動安全研判」按鈕，前端將以極光流光漸層動態展現 Gemini 輸出之 SOC 分析報告。
                            </p>
                          </div>
                        )}

                        {auroraAnalyzing && (
                          <div className="h-[430px] border border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center p-6 bg-black/50 space-y-4">
                            <span className="w-10 h-10 rounded-full border-t-2 border-cyan-400 border-r-2 border-indigo-400 animate-spin" />
                            <div>
                              <p className="text-xs font-mono font-bold text-cyan-300">Vertex AI Pipeline Invocation</p>
                              <p className="text-[10px] text-gray-500 mt-1">正在召喚 1.5 Pro 進行標準無監督基礎對標及 MITRE ATT&CK 對局反推...</p>
                            </div>
                          </div>
                        )}

                        {auroraRevealed && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-[1.5px] bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 rounded-[2rem] shadow-2xl relative overflow-hidden group shadow-cyan-500/5"
                          >
                            {/* Inner Card */}
                            <div className="bg-[#0c0d12]/95 p-6 rounded-[1.9rem] space-y-4 text-left relative z-10 transition-all duration-300">
                              
                              {/* Header & Score */}
                              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold">
                                    AI
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h5 className="text-xs font-black text-white uppercase tracking-wider">jason_dev (資深工程師)</h5>
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    </div>
                                    <span className="text-[8px] font-black text-gray-500 block uppercase tracking-widest mt-0.5">安全合規與威脅故事研判</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-mono font-black text-red-500 italic">95</span>
                                  <span className="text-[8px] font-black text-gray-500 block uppercase tracking-wide">行為偏差係數</span>
                                </div>
                              </div>

                              {/* Target Report Sections */}
                              <div className="space-y-4">
                                {/* Section A: Threat Summary */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] tracking-widest uppercase mb-1">
                                    <ShieldAlert size={12} />
                                    【一、Gemini 威脅研判白話文摘要】
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-gray-300 font-bold">
                                    偵測到受害工程師 <span className="text-cyan-300">jason_dev</span> 於非慣用時區 (03:15:22) 從未知英國跳板 IP 實施不可能的遠端。
                                    隨後橫向移動使用 SSH 連接 R&D 主要 Git 機密庫，並將 4.8GB 封裝專利程式碼，透過加密 DLP 繞過管道上傳至 MEGA。
                                    此為典型的【帳戶憑證遭劫持、內部智慧資產勒索轉移】威脅，涉及 MITRE 憑證濫用與資料外傳戰術。
                                  </p>
                                </div>

                                {/* Section B: Deviations Analyses */}
                                <div className="space-y-1 bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
                                  <div className="flex items-center gap-2 text-amber-400 font-black text-[10px] tracking-widest uppercase mb-1">
                                    <Cpu size={12} />
                                    【二、無監督基準偏差深度分析】
                                  </div>
                                  <div className="space-y-1 text-[10px] text-gray-400 leading-relaxed font-bold">
                                    <p>
                                      • <span className="text-white">身分端異常</span>：常態登入地為台北內湖，換算其在 12 分鐘內切換至英國，偏離地理限制極限速度。
                                    </p>
                                    <p>
                                      • <span className="text-white">橫向移動軌跡</span>：本機與 Git Server 進行不對稱 SSH 流量，提取封包量為同儕 normal baseline 的 <span className="text-amber-300">32 倍</span>。
                                    </p>
                                    <p>
                                      • <span className="text-white">外傳異常</span>：MEGA.nz 外傳活動高達 <span className="text-red-400">4.8GB</span>，歷史學習 Windows 中此使用者從未向該雲端發生任何傳輸，判定為完全偏離基線。
                                    </p>
                                  </div>
                                </div>

                                {/* Section C: Playbooks */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] tracking-widest uppercase mb-1">
                                    <ShieldX size={12} />
                                    【三、建議防禦處置 SOAR 響應劇本】
                                  </div>
                                  <p className="text-[10px] leading-relaxed text-gray-300 font-bold">
                                    請立刻啟動 <span className="text-rose-400 font-black">Playbook #RD-Containment</span>。該劇本將即時經由 Pub/Sub 事件總線，呼叫 Okta API 撤銷 AD 當前 Session，
                                    並調用 CrowdStrike API 將本機端點完全隔離 (Isolate)，在 Palo Alto 防火牆禁止跳板 IP 通行。
                                  </p>
                                </div>
                              </div>

                              {/* Test Link and Action */}
                              <div className="pt-2 border-t border-white/5 flex gap-2">
                                <button
                                  onClick={() => handleExecutePlaybook('jason_dev')}
                                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/15"
                                >
                                  <ShieldX size={12} />
                                  立刻下發 SOAR API 異質阻斷
                                </button>
                                <button
                                  onClick={() => { setAuroraRevealed(false); }}
                                  className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-[10px]"
                                >
                                  重置
                                </button>
                              </div>
                            </div>

                            {/* Shimmer light effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. INDICATOR 1: BIGQUERY SQL & DATAFLOW PIPELINE ARCHITECTURE */}
                {activeIndicatorsSubTab === 'indicator1_dataflow' && (
                  <div className="space-y-6">
                    <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
                      <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">指標 1：BigQuery / Dataflow 數據清洗與特徵工程（AD Log ⟶ ML 特徵）</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-bold">
                        在進行無監督模型（如 Isolation Forest）或多維威脅偵測前，必須將非結構化的原始身分 (EventID 4624) 與網路日誌 (Netflow) 
                        對齊，並轉換成數值矩陣。本模組展示真實的 Dataflow (Apache Beam) 流處理常式與 BigQuery 特徵計算。
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Sub-Pane A: BI BigQuery SQL Feature extract */}
                      <div className="space-y-4 bg-[#0a0d14] border border-white/5 rounded-[2rem] p-6 relative">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <Database className="text-amber-400" size={14} />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">BigQuery SQL 特徵計算 (時間週期與 IP 熵值編碼)</span>
                          </div>
                          <span className="text-[8px] font-mono bg-white/5 px-2 py-0.5 text-gray-400 rounded">Batch ETL</span>
                        </div>

                        <p className="text-[10px] text-gray-400 font-bold mb-2">
                          利用數學三角函數 `sin`/`cos` 24小時循環編碼，將絕對登入時間投射為二維平面，便於 Isolation Forest 做時間分佈異常評估：
                        </p>

                        <div className="relative">
                          <pre className="p-4 bg-black/80 rounded-2xl border border-white/5 font-mono text-[9px] text-cyan-200 overflow-x-auto whitespace-pre leading-relaxed max-h-[290px] custom-scrollbar">
{`-- BigQuery SQL: Encoding Logons Temporal Cyclic Patterns
WITH raw_logon_time AS (
  SELECT
    user_id,
    src_ip,
    timestamp,
    EXTRACT(HOUR FROM timestamp) AS logon_hour,
    EXTRACT(DAYOFWEEK FROM timestamp) AS logon_dow
  FROM
    \`ueba-p1.security.windows_ad_event_4624\`
  WHERE
    event_id = 4624
)
SELECT
  user_id,
  src_ip,
  -- 24小時週期轉換，編碼為正弦與餘弦特徵
  SIN(2 * ACOS(-1) * logon_hour / 24.0) AS user_logon_hour_sin,
  COS(2 * ACOS(-1) * logon_hour / 24.0) AS user_logon_hour_cos,
  -- 14天滾動計算不重複來源 IP 數量
  COUNT(DISTINCT src_ip) OVER(
    PARTITION BY user_id 
    ORDER BY timestamp 
    RANGE BETWEEN INTERVAL 14 DAY PRECEDING AND CURRENT ROW
  ) AS unique_ip_count_7d
FROM
  raw_logon_time;`}
                          </pre>
                        </div>
                      </div>

                      {/* Sub-Pane B: Dataflow / Apache Beam python Pipeline */}
                      <div className="space-y-4 bg-[#0a0d14] border border-white/5 rounded-[2rem] p-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <Code className="text-indigo-400" size={14} />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Dataflow/Beam Python 流量視窗動態特徵工程</span>
                          </div>
                          <span className="text-[8px] font-mono bg-white/5 px-2 py-0.5 text-gray-400 rounded">Stream Processing</span>
                        </div>

                        <p className="text-[10px] text-gray-400 font-bold mb-2">
                          通過 Apache Beam 的流處理 Window.into() 會話視窗計算工程師的短時累計傳輸字節熵值：
                        </p>

                        <div className="relative">
                          <pre className="p-4 bg-black/80 rounded-2xl border border-white/5 font-mono text-[9px] text-indigo-300 overflow-x-auto whitespace-pre leading-relaxed max-h-[290px] custom-scrollbar">
{`# Apache Beam python pipeline snippet
import apache_beam as beam
from apache_beam.transforms.window import SlidingWindows

def calculate_net_features(element):
    # element = (user_id, [bytes_sent1, bytes_sent2, ...])
    user_id, bytes_list = element
    total_bytes = sum(bytes_list)
    # 計算短時間内流量尖峰與熵值偏離
    return {
        'user_id': user_id,
        'bytes_sent_1h': total_bytes,
        'has_exfiltration_spike': 1 if total_bytes > 2000000000 else 0
    }

pipeline = (
    p 
    | 'ReadFromPubSub' >> beam.io.ReadFromPubSub(topic='projects/ueba/topics/netflow')
    | 'ParseNetflow' >> beam.Map(lambda x: eval(x))
    | 'AssignTime' >> beam.Map(lambda x: beam.window.TimestampedValue(x, x['timestamp']))
    | 'SlidingWindow' >> beam.WindowInto(SlidingWindows(size=3600, period=60))
    | 'GroupByKPI' >> beam.GroupByKey()
    | 'ExtractFeatures' >> beam.Map(calculate_net_features)
    | 'WriteToFeatureStore' >> beam.io.WriteToBigQuery('sec-ueba.analytics.feature_online')
)`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Beam trigger widget */}
                    <div className="p-5 bg-black/40 border border-white/5 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-xs font-black text-white uppercase tracking-wider">執行 BigQuery 數據特徵聯動模擬器</h5>
                        <p className="text-[10px] text-gray-500 mt-1">此處可以向 GCP 核心管道調用，驗證特徵是否能正確即時產出符合模型規格的 Feature Vector。</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {featuresExtractionStatus === 'running' && (
                          <div className="w-32 bg-gray-800 h-2 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-cyan-500 h-full transition-all duration-100" style={{ width: `${featuresProgress}%` }} />
                          </div>
                        )}

                        {featuresExtractionStatus === 'completed' && (
                          <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">
                            ✓ Vector 特徵值產出完成 !
                          </span>
                        )}

                        <button
                          onClick={handleFeatureExtractionSimulate}
                          disabled={featuresExtractionStatus === 'running'}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 text-xs font-black uppercase rounded-xl transition-all"
                        >
                          {featuresExtractionStatus === 'running' ? '特徵解析提取中...' : '模擬清洗並提取 AD/Network 特徵'}
                        </button>
                      </div>
                    </div>

                    {/* Extracted Feature vector viewer */}
                    {featuresExtractionStatus === 'completed' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-[#0a0d14] border border-green-500/20 rounded-2xl flex flex-col space-y-3"
                      >
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">GCP Vertex AI Feature Store 線上輸入向量 (Feature Vector Output) :</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { key: 'user_logon_hour_sin', value: '-0.7071 (倫敦午夜時段偏差)' },
                            { key: 'user_logon_hour_cos', value: '+0.7071 (24h循環二維座標)' },
                            { key: 'unique_ip_count_7d', value: '4 (平時基準同儕為 1)' },
                            { key: 'bytes_sent_1h_spike', value: '5,153,960,755 Bytes (熱點溢流)' }
                          ].map((feat, i) => (
                            <div key={i} className="p-3 bg-black/60 border border-white/5 rounded-xl text-left">
                              <span className="text-[8px] font-black text-gray-500 uppercase block">{feat.key}</span>
                              <span className="text-xs font-mono font-black text-white mt-1 block">{feat.value}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 3. INDICATOR 3: AUTOMATION PLAYBOOK INTEGRATION (SOAR CONFIGURATION SCREEN) */}
                {activeIndicatorsSubTab === 'indicator3_soar' && (
                  <div className="space-y-6">
                    <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
                      <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">指標 3：企業安全控制接軌 API 聯防設定 (SIEM & EDR SOAR API Integration)</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-bold">
                        當行為偏差係數大於 85 高風險預警值時，SOAR 劇本將自動通過此介面呼叫外部實體阻斷。
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Form inputs */}
                      <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">企業異質 API 聯防對接憑證</span>
                        
                        <div className="space-y-4 text-xs text-left max-h-[440px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {/* SIEM Splunk config */}
                          <div className="space-y-1.5 bg-white/[0.01] p-3 rounded-xl border border-white/[0.02]">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">1. IBM Splunk SIEM Integration</span>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Database size={11} className="text-indigo-400" />
                                Splunk REST API 主機網址
                              </label>
                              <input
                                type="text"
                                value={splunkHost}
                                onChange={(e) => setSplunkHost(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 text-xs text-white rounded-xl outline-none focus:border-indigo-500 transition-all"
                              />
                            </div>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Key size={11} className="text-indigo-400" />
                                Splunk HEC (Auth Token)
                              </label>
                              <input
                                type="text"
                                value={splunkToken}
                                onChange={(e) => setSplunkToken(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 font-mono text-xs text-white rounded-xl outline-none focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>

                          {/* Fortinet FortiSIEM config */}
                          <div className="space-y-1.5 bg-white/[0.01] p-3 rounded-xl border border-white/[0.02]">
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">2. Fortinet FortiSIEM Integration</span>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Database size={11} className="text-amber-400" />
                                FortiSIEM REST API 網址
                              </label>
                              <input
                                type="text"
                                value={fortisiemHost}
                                onChange={(e) => setFortisiemHost(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 text-xs text-white rounded-xl outline-none focus:border-amber-500 transition-all"
                              />
                            </div>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Key size={11} className="text-amber-400" />
                                FortiSIEM AppKey / Token
                              </label>
                              <input
                                type="text"
                                value={fortisiemToken}
                                onChange={(e) => setFortisiemToken(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 font-mono text-xs text-white rounded-xl outline-none focus:border-amber-500 transition-all"
                              />
                            </div>
                          </div>

                          {/* IBM QRadar (Qrader) config */}
                          <div className="space-y-1.5 bg-white/[0.01] p-3 rounded-xl border border-white/[0.02]">
                            <span className="text-[9px] font-black text-teal-400 uppercase tracking-wider block">3. IBM QRadar (Qrader) Integration</span>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Database size={11} className="text-teal-400" />
                                QRadar Console REST Endpoint
                              </label>
                              <input
                                type="text"
                                value={qradarHost}
                                onChange={(e) => setQradarHost(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 text-xs text-white rounded-xl outline-none focus:border-teal-500 transition-all"
                              />
                            </div>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Key size={11} className="text-teal-400" />
                                SEC Token (Security Service Token)
                              </label>
                              <input
                                type="text"
                                value={qradarToken}
                                onChange={(e) => setQradarToken(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 font-mono text-xs text-white rounded-xl outline-none focus:border-teal-500 transition-all"
                              />
                            </div>
                          </div>

                          {/* Palo Alto Networks integration */}
                          <div className="space-y-1.5 bg-white/[0.01] p-3 rounded-xl border border-white/[0.02]">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider block">4. Palo Alto Networks NGFW / Cortex</span>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Sliders size={11} className="text-cyan-400" />
                                Panorama / FireWall 主機位址
                              </label>
                              <input
                                type="text"
                                value={paloaltoHost}
                                onChange={(e) => setPaloaltoHost(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 text-xs text-white rounded-xl outline-none focus:border-cyan-500 transition-all"
                              />
                            </div>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Key size={11} className="text-cyan-400" />
                                Palo Alto XML API Key
                              </label>
                              <input
                                type="text"
                                value={paloaltoToken}
                                onChange={(e) => setPaloaltoToken(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 font-mono text-xs text-white rounded-xl outline-none focus:border-cyan-500 transition-all"
                              />
                            </div>
                          </div>

                          {/* EDR Crowdstrike config */}
                          <div className="space-y-1.5 bg-white/[0.01] p-3 rounded-xl border border-white/[0.02]">
                            <span className="text-[9px] font-black text-[#fc6076] uppercase tracking-wider block font-bold">5. Crowdstrike Falcon EDR Integration</span>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Link size={11} className="text-[#fc6076]" />
                                Client ID (OAuth 2.0)
                              </label>
                              <input
                                type="text"
                                value={crowdstrikeClientId}
                                onChange={(e) => setCrowdstrikeClientId(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 font-mono text-xs text-white rounded-xl outline-none focus:border-[#fc6076] transition-all"
                              />
                            </div>
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                <Key size={11} className="text-[#fc6076]" />
                                Client Secret Key
                              </label>
                              <input
                                type="password"
                                value={crowdstrikeClientSecret}
                                onChange={(e) => setCrowdstrikeClientSecret(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 p-2 font-mono text-xs text-white rounded-xl outline-none focus:border-[#fc6076] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Connection test and playbook orchestration list */}
                      <div className="space-y-4 bg-black/40 border border-white/5 rounded-[2rem] p-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">聯防自動阻斷 API 網卡測試</span>
                          <button
                            onClick={handleApiNodesTest}
                            disabled={apiTesting}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <Wifi size={11} className={apiTesting ? 'animate-bounce' : ''} />
                            {apiTesting ? '連線心跳偵測中...' : '測試所有聯防 API 節點'}
                          </button>
                        </div>

                        {/* Status elements */}
                        <div className="space-y-3 pt-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                          {[
                            { id: 'splunk', label: 'SIEM Splunk Cloud Endpoint', desc: '負責即時推送事件並抓取歷史索引' },
                            { id: 'fortisiem', label: 'SIEM Fortinet FortiSIEM Connection', desc: '收集多源設備流資料並過濾重複告警' },
                            { id: 'qradar', label: 'SIEM IBM QRadar (Qrader) Connect API', desc: '深度整合 Ariel 資料庫進行日誌關聯' },
                            { id: 'paloalto', label: 'NGFW Palo Alto Networks Panorama API', desc: '負責直接把跳板代理 IP 錄入黑名單實體阻斷' },
                            { id: 'crowdstrike', label: 'EDR Crowdstrike Falcon API Endpoint', desc: '負責主機網路層級遠端隔離 (Network Contain)' },
                            { id: 'okta', label: 'SaaS Okta Identity Identity Engine', desc: '負責使用者帳戶憑證會話強制失效與 Revoke Session' }
                          ].map((node) => {
                            const stat = apiNodesStatus[node.id];
                            return (
                              <div key={node.id} className="p-3.5 bg-black/60 rounded-xl border border-white/[0.03] flex items-center justify-between gap-4">
                                <div>
                                  <span className="text-[11px] font-bold text-white block">{node.label}</span>
                                  <span className="text-[9px] text-gray-500 block mt-0.5">{node.desc}</span>
                                </div>

                                <div className="text-right whitespace-nowrap">
                                  {stat === 'idle' && (
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">未驗證</span>
                                  )}
                                  {stat === 'checking' && (
                                    <span className="text-[9px] font-mono font-bold text-cyan-400 animate-pulse uppercase">驗證中...</span>
                                  )}
                                  {stat === 'online' && (
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[9px] font-black">
                                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                                      <span>連線成功 (200)</span>
                                    </div>
                                  )}
                                  {stat === 'failed' && (
                                    <span className="text-[9px] font-serif font-black text-red-500 uppercase">授權過期</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Automatic rule assignment snippet */}
                        <div className="p-4 bg-indigo-500/[0.01] border border-indigo-500/10 rounded-2xl space-y-1.5">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={11} />
                            聯防編排阻斷劇本組態 (JSON REST Trigger) :
                          </span>
                          <pre className="p-3 bg-[#07080e] rounded-xl border border-white/5 font-mono text-[9px] text-gray-400 overflow-x-auto whitespace-pre">
{`curl -X POST "https://security.example.com/api/v1/trigger" \\
  -H "Authorization: Bearer \${OKA_SECRE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "trigger_type": "UEBA_ANOMALY_RISK_SURGE",
    "risk_score": 95.0,
    "user_id": "usr-jason_dev",
    "mitre_tactics": ["TA0006", "TA0010"],
    "automatic_actions": ["isolate_endpoint", "revoke_session", "block_proxy_ip"]
  }'`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeRailTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-2xl">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSettingsActiveView('matrix')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        settingsActiveView === 'matrix'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Sliders size={13} />
                      風險權重矩陣與偵測原則 (Risk Weights & Policies)
                    </button>
                    <button
                      onClick={() => setSettingsActiveView('baseline')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        settingsActiveView === 'baseline'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Clock size={13} />
                      基準設定檔與風險衰減 (Baseline Profile & Decay)
                    </button>
                  </div>
                </div>

                {settingsActiveView === 'matrix' ? (
                  <UEBASettingsView />
                ) : (
                  <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2rem] p-8 space-y-6 shadow-2xl text-left">
                    <div>
                      <h3 className="text-xl font-black text-white italic tracking-tight uppercase">基準設定檔與風險評分衰減 (Baseline Profile & Decay Settings)</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        配置非監督式機器學習引擎參數，設定多源日誌基準設定檔學習窗口與風險評分動態衰減因子。
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Decay Factor Card */}
                      <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-300">行為基準建立時間窗</span>
                          <span className="text-xs font-mono font-black text-indigo-400">90 Days Rolling</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[90%]" />
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          機器學習演算法在每次進行日常基線比對時，調用過去 90 天做為動態對標，當使用者存取偏離該窗口之平均標準差 (σ) 3倍以上即判定為異常。
                        </p>
                      </div>

                      <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-300">動態風險分數時效衰減 (Risk Decay)</span>
                          <span className="text-xs font-mono font-black text-indigo-400">0.85% / Hour</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[85%]" />
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          若使用者此後未再觸發進程、登入或流量異常，原 100 分的高風險值，每小時會自動按 0.85% 指數遞減，逐步回復至原始背景值。
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-500/[0.02] border border-indigo-500/20 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} /> Vertex AI 集群非監督學習狀態
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-center pt-2">
                        <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black text-gray-600 block uppercase">Cluster Distance</span>
                          <span className="text-sm font-mono font-bold text-white mt-1 block">Euclidean (L2)</span>
                        </div>
                        <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black text-gray-600 block uppercase">Model Version</span>
                          <span className="text-sm font-mono font-bold text-white mt-1 block">v3.1.2-beta</span>
                        </div>
                        <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black text-gray-600 block uppercase">Continuous Audit</span>
                          <span className="text-sm font-mono font-bold text-green-400 mt-1 block">ENABLED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}



          </div>

          {/* COLUMN 3: RIGHT SIDEBAR - LIVE ALERTS & INDIVIDUAL ENTITY DOSSIER */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Live Alerts Panel */}
            <div className="bg-[#0b0c10]/90 border border-gray-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="text-red-500" size={14} />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">即時異常警示串流 (Live Alert Roll)</h3>
                </div>
                <span className="text-[9px] font-black bg-red-600/10 px-2 py-0.5 text-red-500 rounded border border-red-500/10 animate-pulse">
                  即時更新
                </span>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 flex flex-col custom-scrollbar">
                {[
                  { time: '04:12', user: 'Sarah Chen (Finance)', text: '非營業時段 Exchange 規則竄改', score: 74, status: 'Suspicious' },
                  { time: '03:25', user: 'John Doe (R&D)', text: '加密外派 4.2GB 壓縮檔案至 MEGA.nz', score: 92, status: 'Critical' },
                  { time: '03:22', user: 'John Doe (R&D)', text: '本機隱蔽執行 PowerShell 加密進程', score: 94, status: 'Critical' },
                  { time: '03:18', user: 'John Doe (R&D)', text: 'Finance_DB 密集越權野卡查詢', score: 91, status: 'Critical' },
                  { time: '03:15', user: 'John Doe (R&D)', text: '倫敦跳板 Impossible Travel VPN 登入', score: 89, status: 'Critical' },
                ].map((alert, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const associatedId = alert.user.includes('John') ? 'usr-johndoe' : 'usr-sarahchen';
                      handleEntitySelection(associatedId);
                    }}
                    className={`p-3 bg-black/40 border rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer ${
                      alert.status === 'Critical' ? 'border-red-500/20' : 'border-orange-500/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-gray-500">{alert.time}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${alert.status === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                        <span className="text-[10px] font-bold text-gray-300 italic truncate max-w-[120px]">{alert.user}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-black italic ${alert.status === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>
                        {alert.score}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{alert.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Entity 360 Detail Card - Dynamic Profile */}
            <div className="bg-[#0c0d12]/95 border border-gray-900 rounded-[2rem] p-6 text-left relative overflow-hidden shadow-2xl">
              {selectedEntity ? (
                <div className="space-y-6">
                  {/* Entity Header & Risk Avatar */}
                  <div className="flex justify-between items-start pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-md font-black shadow-lg ${
                        selectedEntity.status === 'Critical' ? 'bg-red-600/10 border border-red-500/30 text-red-500' : 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400'
                      }`}>
                        {selectedEntity.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-white uppercase tracking-wide">{selectedEntity.name}</h4>
                          <span className={`w-2 h-2 rounded-full ${selectedEntity.status === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                        </div>
                        <p className="text-[9px] font-black text-gray-500 uppercase block tracking-widest mt-0.5">
                          {selectedEntity.department} • {selectedEntity.type}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-mono font-black text-red-500 tracking-tighter block">{selectedEntity.score}</span>
                      <span className="text-[8px] font-black text-gray-500 block uppercase tracking-widest">實體風險分數</span>
                    </div>
                  </div>

                  {/* Gemini Aurora Aura-glowing border container */}
                  <div className="p-1.5 bg-gradient-to-r from-[#fc6076] via-[#ff9a9e] to-[#4facfe] rounded-3xl shadow-xl shadow-indigo-600/5 relative">
                    <div className="bg-[#0c0d12] p-5 rounded-[1.3rem] space-y-3">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Sparkles size={14} className="animate-spin-slow" />
                        <h5 className="text-[10px] font-black uppercase tracking-wider">Gemini 核心安全智慧研判</h5>
                      </div>
                      
                      <p className="text-[11px] leading-relaxed text-gray-300 font-bold italic">
                        {selectedEntity.id === 'usr-johndoe' 
                          ? '「Impossible Travel 與資料庫高維越權查詢關聯特徵。隨後進行本地本級進程壓縮及 MEGA 巨大外派。高度懷疑該員工主動利用國外代理跳板，或其帳戶 AD 憑證已經遭外部 APT 黑產外洩盜取，目前正在實施資產勒索轉移。」'
                          : `針對 ${selectedEntity.name} 所進行的日常關聯分析，判定當前風險主因在於「偏離背景基準的异常營業時間活動(非慣用時段)以及敏感郵件規則之變更」，疑似遭遇網域憑證釣魚控制。`}
                      </p>
                    </div>
                  </div>

                  {/* Association Map & Privileges */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[8px] font-black text-gray-500 uppercase block tracking-widest mb-2">實體關聯分析 (Associated Identites)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntity.associatedEntities.map((item, i) => {
                          let isIP = item.includes('IP:');
                          return (
                            <span key={i} className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg border transition-colors ${
                              isIP 
                                ? 'bg-[#ff9f43]/10 border-[#ff9f43]/20 text-[#ff9f43]' 
                                : 'bg-white/5 border-white/[0.04] text-gray-300'
                            }`}>
                              {item}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Hardware / Laptops Cards */}
                    <div>
                      <span className="text-[8px] font-black text-gray-500 uppercase block tracking-widest mb-2">常態綁定實體設備 (Devices)</span>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedEntity.devices.map((dev, i) => (
                          <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-xl text-left">
                            <span className="text-[8px] font-black text-gray-500 uppercase block tracking-wider">{dev.type}</span>
                            <span className="text-[10px] font-bold text-gray-200 block truncate mt-1">{dev.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Baseline comparison stats */}
                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl relative text-xs text-gray-400 space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">
                        <Clock size={11} /> 靜態行為正常基準 (Peer Baseline)
                      </div>
                      <p className="leading-relaxed text-[11px] font-bold">{selectedEntity.baselineSummary}</p>
                    </div>

                    {/* Watchlist & Contained Badges */}
                    <div className="flex flex-wrap gap-2">
                      {selectedEntity.watchlist && (
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-[9px] font-black flex items-center gap-1">
                          <Flame size={10} className="text-amber-400" />
                          已列入高風險特權觀察名單 (Watchlist)
                        </span>
                      )}
                      {selectedEntity.contained && (
                        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-[9px] font-black flex items-center gap-1">
                          <ShieldX size={10} className="text-red-400" />
                          已執行端點網路隔離與帳戶凍結
                        </span>
                      )}
                    </div>

                    {/* Quick Response Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleToggleWatchlist(selectedEntity)}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                          selectedEntity.watchlist
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Flame size={12} className={selectedEntity.watchlist ? 'text-amber-400' : ''} />
                        {selectedEntity.watchlist ? '移出觀察名單' : '加入觀察名單'}
                      </button>

                      <button
                        onClick={() => handleToggleContainment(selectedEntity)}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                          selectedEntity.contained
                            ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Lock size={12} className={selectedEntity.contained ? 'text-red-400' : ''} />
                        {selectedEntity.contained ? '解除主機隔離' : '即時隔離端點'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Export Forensic Dossier */}
                      <button
                        onClick={() => handleExportDossier(selectedEntity)}
                        className="py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download size={12} />
                        匯出鑑識報告
                      </button>

                      {/* Reset Entity Risk */}
                      <button
                        onClick={() => handleResetEntityRisk(selectedEntity)}
                        className="py-2.5 px-2 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/30 text-gray-300 hover:text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        title="已確認無威脅或處置完畢，重置風險指標"
                      >
                        <RotateCcw size={12} />
                        重置風險指標
                      </button>
                    </div>

                    {/* Orchestration container SOAR Playbook trigger */}
                    {selectedEntity.status === 'Critical' && (
                      <button 
                        onClick={() => handleExecutePlaybook(selectedEntity.name)}
                        className="w-full group py-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-600/10 transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldX size={14} className="group-hover:rotate-12 transition-transform" />
                        啟動全自動遏阻阻斷 Playbook
                      </button>
                    )}

                  </div>

                </div>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 mx-auto">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400">尚未選擇實體</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px] mx-auto mt-1">
                      請於左側列表、泡泡圖或警示面板點選高風險使用者，以展開多維行為模型 360° 調查。
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

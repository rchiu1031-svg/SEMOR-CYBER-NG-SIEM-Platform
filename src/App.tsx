import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Code, Flame } from 'lucide-react';
import { 
  Flag,
  Shield, 
  Activity, 
  Zap, 
  Globe, 
  Bug, 
  Search, 
  Target, 
  Settings, 
  LayoutDashboard, 
  ShieldAlert,
  Biohazard,
  Menu, 
  X,
  Bell,
  User,
  Users,
  UserMinus,
  Key,
  RefreshCw,
  Edit3,
  Wrench,
  Lock,
  CreditCard,
  Layers,
  Terminal,
  Cpu,
  Database,
  Network,
  Binary,
  TrendingUp,
  TrendingDown,
  Monitor,
  Brain,
  UserCheck,
  BarChart3,
  Server,
  HardDrive,
  Files,
  Wifi,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Box,
  Filter,
  Calendar,
  Building2,
  Download,
  Share2,
  History,
  Clock,
  FileSearch,
  Share,
  Workflow,
  CheckCircle2,
  Check,
  AlertCircle,
  Play,
  PlayCircle,
  Bot,
  Sparkles,
  GitBranch,
  MessageSquare,
  MoreVertical,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Factory,
  Radio,
  Map as MapIcon,
  ShieldCheck,
  Crosshair,
  Cloud,
  AppWindow,
  SearchCode,
  Fingerprint,
  FileCode,
  SearchX,
  ShieldQuestion,
  FileWarning,
  ShieldX,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Package,
  PackagePlus,
  Rss,
  ClipboardCheck,
  FileText,
  Send,
  UploadCloud,
  Scroll,
  LogOut,
  History as HistoryIcon,
  ExternalLink,
  BellRing,
  Slack,
  Github,
  Maximize2,
  Settings2,
  LayoutGrid,
  List,
  Layout,
  Power,
  Smartphone,
  Image,
  Save,
  Mail,
  TrafficCone,
  Signal,
  Video,
  Upload,
  Gauge,
  Wind,
  Lightbulb,
  Edit2,
  Tag,
  Hash,
  ArrowRightLeft,
  Skull,
  PhoneCall,
  ArrowRight,
  ArrowLeft,
  Folder,
  MinusCircle,
  Webhook,
  Radar as RadarIcon,
  RotateCcw,
  ZapOff,
  Swords
} from 'lucide-react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Line as MapLine, 
  Marker 
} from "react-simple-maps";
import { siemService } from './services/siemService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Legend,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { useTranslation } from 'react-i18next';
import { cn } from './lib/utils';
import * as d3 from 'd3';
import { MODULES, ModuleInfo, LicenseInfo } from './types';
import AIDetectionView from './components/AIDetectionView';
import VulnerabilityDetailRow from './components/VulnerabilityDetailRow';
import AIAttackAnalysisView from './components/AIAttackAnalysisView';
import AIModelConfigView from './components/AIModelConfigView';
import HoneypotManagerView from './components/HoneypotManagerView';
import SkywalkingApmView from './components/SkywalkingApmView';
import UEBASystemView from './components/UEBASystemView';
import NetworkAccessControlViewPF from './components/NetworkAccessControlView';
import DiscoveryView, { AssetsManager } from './components/DiscoveryView';
import Correlation24hHeatmap from './components/Correlation24hHeatmap';
import RemoteLogServerSettingView from './components/RemoteLogServerSettingView';
import EngineMonitoringView from './components/EngineMonitoringView';
import SignatureUpdateSettingsView from './components/SignatureUpdateSettingsView';
import ThreatIntelSourcesSettingView from './components/ThreatIntelSourcesSettingView';
import GeneralSettingsView from './components/GeneralSettingsView';
import UserSettingsView from './components/UserSettingsView';
import AuthenticationSettingsView from './components/AuthenticationSettingsView';
import UEBASettingsView from './components/UEBASettingsView';
import AlertSettingsView from './components/AlertSettingsView';
import NDRAlertRulesSettingsView from './components/NDRAlertRulesSettingsView';
import DecoderView from './components/DecoderView';
import { PlatformPerformanceView } from './components/PlatformPerformanceView';
import { LicenseManagementView } from './components/LicenseManagementView';
import NetworkMonitorView from './components/NetworkMonitorView';
import TrafficAnalysisNDRView from './components/TrafficAnalysisNDRView';
import NDRAlertAnalyticsView from './components/NDRAlertAnalyticsView';
import OpenXDRView from './components/OpenXDRView';
import CorrelationSummaryView from './components/CorrelationSummaryView';
import CorrelationSettingView from './components/CorrelationSettingView';
import CyberWargamingView from './components/CyberWargamingView';
import CriticalIncidentsView from './components/CriticalIncidentsView';
import AIAnalystView from './components/AIAnalystView';
import SOARViewComponent from './components/SOARView';
import OTSecurityViewComponent from './components/OTSecurityView';
import IntelCTIViewComponent from './components/cti/IntelCTIView';
import { MalwareAnalysisView } from './components/malware/MalwareAnalysisView';
import { VulnerabilityView } from './components/vulnerability/VulnerabilityView';
import { SOARFIMView } from './components/soar/fim/SOARFIMView';
import { CustomVisibilityView } from './components/visualization/CustomVisibilityView';
import { ComplianceCenterView } from './components/compliance/ComplianceCenterView';
import { ExecutiveDashboardView } from './components/executive/ExecutiveDashboardView';
import { OverviewDashboardView } from './components/overview/OverviewDashboardView';
import { CustomDashboardView } from './components/custom-dashboard/CustomDashboardView';
import { CaseManagementView } from './components/case-management';
import { EngineArchitectureView } from './components/EngineArchitectureView';
import DigitalForensicsViewComponent from './components/DigitalForensicsView';

// Mock Data
const ALERT_DATA = [
  { time: '00:00', alerts: 12, traffic: 450 },
  { time: '04:00', alerts: 8, traffic: 320 },
  { time: '08:00', alerts: 25, traffic: 890 },
  { time: '12:00', alerts: 45, traffic: 1200 },
  { time: '16:00', alerts: 30, traffic: 950 },
  { time: '20:00', alerts: 15, traffic: 600 },
];

const ATTACK_VECTORS = [
  { name: 'Brute Force', value: 45 },
  { name: 'Malware', value: 30 },
  { name: 'Phishing', value: 15 },
  { name: 'DDoS', value: 10 },
];

const ABNORMAL_LOGINS = [
  { time: '09:45:12', ip: '10.0.4.12', host: 'PROD-DB-01', attempts: 45 },
  { time: '09:44:05', ip: '192.168.1.55', host: 'WEB-SRV-02', attempts: 28 },
  { time: '09:42:30', ip: '172.16.0.10', host: 'MAIL-GW', attempts: 12 },
];

const TREND_DATA = {
  daily: [
    { name: 'Mon', users: 120, traffic: 450, events: 1200 },
    { name: 'Tue', users: 150, traffic: 520, events: 1500 },
    { name: 'Wed', users: 180, traffic: 610, events: 1800 },
    { name: 'Thu', users: 170, traffic: 580, events: 1700 },
    { name: 'Fri', users: 210, traffic: 720, events: 2100 },
    { name: 'Sat', users: 140, traffic: 400, events: 1100 },
    { name: 'Sun', users: 110, traffic: 350, events: 900 },
  ],
  weekly: [
    { name: 'W1', users: 850, traffic: 3200, events: 9500 },
    { name: 'W2', users: 920, traffic: 3500, events: 10200 },
    { name: 'W3', users: 1100, traffic: 4100, events: 12500 },
    { name: 'W4', users: 1050, traffic: 3900, events: 11800 },
  ],
  monthly: [
    { name: 'Jan', users: 3200, traffic: 12000, events: 45000 },
    { name: 'Feb', users: 3500, traffic: 13500, events: 48000 },
    { name: 'Mar', users: 4100, traffic: 15000, events: 55000 },
    { name: 'Apr', users: 4200, traffic: 15500, events: 57000 },
  ]
};

const TOP_MALWARE = [
  { name: 'WannaCry.v2', type: 'Ransomware', count: 12, risk: 'Critical' },
  { name: 'Emotet.Generic', type: 'Trojan', count: 45, risk: 'High' },
  { name: 'Log4j.Exploit', type: 'Exploit', count: 8, risk: 'Critical' },
  { name: 'Adware.SearchHelper', type: 'PUP', count: 156, risk: 'Low' },
];

const TOP_VULNERABILITIES = [
  { cve: 'CVE-2024-21887', name: 'Ivanti Connect Secure RCE', severity: 'Critical', hosts: 5 },
  { cve: 'CVE-2023-4966', name: 'Citrix Bleed', severity: 'High', hosts: 12 },
  { cve: 'CVE-2024-1709', name: 'ScreenConnect Auth Bypass', severity: 'Critical', hosts: 3 },
  { cve: 'CVE-2023-22515', name: 'Confluence Broken Access', severity: 'High', hosts: 8 },
];

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const THREAT_ACTOR_ORIGINS = [
  { name: "APT28", coordinates: [37.6173, 55.7558], color: "#ef4444", country: "Russia" }, // Moscow
  { name: "Lazarus", coordinates: [125.7625, 39.0392], color: "#ef4444", country: "North Korea" }, // Pyongyang
  { name: "Mustang Panda", coordinates: [116.4074, 39.9042], color: "#ef4444", country: "China" }, // Beijing
  { name: "Fancy Bear", coordinates: [38.9733, 45.0393], color: "#ef4444", country: "Russia" }, // Krasnodar (approx)
  { name: "OceanLotus", coordinates: [105.8342, 21.0278], color: "#ef4444", country: "Vietnam" }, // Hanoi
];

const INDICATOR_DISTRIBUTION = [
  { name: "Exploit Servers", coordinates: [-74.006, 40.7128], count: 450, color: "#3b82f6" }, // New York
  { name: "Botnet C2", coordinates: [139.6503, 35.6762], count: 850, color: "#8b5cf6" }, // Tokyo
  { name: "Phishing Hub", coordinates: [31.2357, 30.0444], count: 320, color: "#f59e0b" }, // Cairo
  { name: "Drop Zones", coordinates: [-46.6333, -23.5505], count: 180, color: "#10b981" }, // Sao Paulo
  { name: "Vulnerability Scanners", coordinates: [55.2708, 25.2048], count: 620, color: "#ef4444" }, // Dubai
  { name: "Leaked Creds", coordinates: [18.4233, -33.9249], count: 140, color: "#6b7280" }, // Cape Town
];

const UEBA_HIGH_RISK_ENTITIES = [
  { id: 'u1', name: 'James Wilson', type: 'user', department: 'Research', score: 92, trend: '+15%', status: 'Critical', avatar: 'JW', riskFactors: ['Impossible Travel', 'Abnormal Data Transfer', 'First-time DB Access'] },
  { id: 'u2', name: 'Sarah Chen', type: 'user', department: 'Finance', score: 85, trend: '+5%', status: 'High', avatar: 'SC', riskFactors: ['Credential Sharing Suspicion', 'Late Night Login'] },
  { id: 'h1', name: 'SRV-DATA-PROD-01', type: 'host', department: 'IT-Infrastructure', score: 88, trend: '+22%', status: 'High', icon: <Server size={14} />, riskFactors: ['Outbound Traffic Spike', 'New Process Injection'] },
  { id: 'u3', name: 'Robert Fox', type: 'user', department: 'Executive', score: 78, trend: '-2%', status: 'Medium', avatar: 'RF', riskFactors: ['Accessing Engineering Docs'] },
];

const BEHAVIOR_TIMELINE = [
  { time: '02:15:00', type: 'ueba', event: 'Impossible Travel Detected', description: 'Login from London, UK then Shanghai, China within 20 mins', risk: 'High', category: 'Identity' },
  { time: '02:40:12', type: 'xdr', event: 'Malware Execution Blocked', description: 'Injected thread detected in svchost.exe', risk: 'Critical', category: 'Endpoint' },
  { time: '03:10:05', type: 'ueba', event: 'Abnormal Data Volume', description: '5.2 GB uploaded to personal cloud storage', risk: 'High', category: 'Exfiltration' },
  { time: '03:45:20', type: 'ueba', event: 'Lateral Movement Suspicion', description: 'Iterative scan of internal DB ports', risk: 'Medium', category: 'Network' },
  { time: '04:12:00', type: 'xdr', event: 'Brute Force Attempt', description: '50+ failed logins targeting DC-Primary', risk: 'High', category: 'Auth' },
];

function EntityInvestigationDialog({ entity, onClose }: { entity: any, onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [activeView, setActiveView] = useState<'storyline' | 'topology' | 'causal' | 'baseline' | 'notes'>('storyline');
  const [notes, setNotes] = useState<string[]>([
    isZh ? '已核對 AD 日誌：確認該帳號於凌晨 02:00 透過 VPN 登入保持連線。' : 'Checked AD logs: Account confirmed active through VPN at 02:00 AM.',
    isZh ? '發現異常跡證：02:25 透過 PowerShell 執行了 7z.exe 加密壓縮工具。' : 'Evidence found: 7z.exe was executed via PowerShell at 02:25 AM.'
  ]);
  const [newNote, setNewNote] = useState('');
  const [isExecutingPlaybook, setIsExecutingPlaybook] = useState(false);
  const [playbookStep, setPlaybookStep] = useState(0);

  const executePlaybook = () => {
    setIsExecutingPlaybook(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setPlaybookStep(step);
      if (step >= 4) {
        clearInterval(interval);
        setTimeout(() => setIsExecutingPlaybook(false), 2000);
      }
    }, 1500);
  };

  const causalSteps = [
    { label: isZh ? '異常存取行為' : 'Abnormal Access Behavior', status: 'danger', icon: <Globe size={14} />, detail: isZh ? '首次來源 IP / 非慣用時段' : 'First-time source IP / off-hours login' },
    { label: isZh ? '異常目錄遍歷' : 'Abnormal Directory Traversal', status: 'warning', icon: <FileSearch size={14} />, detail: isZh ? '遍歷 /src/core 敏感目錄' : 'Traversing /src/core sensitive paths' },
    { label: isZh ? '工具特徵識別' : 'Tool Signature Identification', status: 'warning', icon: <Fingerprint size={14} />, detail: isZh ? '偵測到 7z.exe (加密壓縮工具)' : 'Detected 7z.exe (encryption tool)' },
    { label: isZh ? '資料外洩流量' : 'Data Exfiltration Traffic', status: 'critical', icon: <UploadCloud size={14} />, detail: isZh ? '15GB 傳輸至外部儲存伺服器' : '15GB transferred to external storage' },
  ];

  const baselineMetrics = [
    { label: isZh ? '登入時段' : 'Login Hours', current: '02:00 - 04:00', baseline: isZh ? '09:00 - 18:00 (平日)' : '09:00 - 18:00', diff: isZh ? '偏離基線' : 'Anomalous', status: 'danger' },
    { label: isZh ? '檔案存取量' : 'File Access Vol', current: isZh ? '1,240 份檔案' : '1,240 Files', baseline: isZh ? '45 份/天' : '45 Files/Day', diff: '+2,655%', status: 'danger' },
    { label: isZh ? '出站流量' : 'Outbound Traffic', current: '15.2 GB', baseline: isZh ? '22 MB/天' : '22 MB/Day', diff: isZh ? '嚴重暴增' : 'Critical Surge', status: 'danger' },
    { label: isZh ? '執行行程多樣性' : 'Process Diversity', current: 'Powershell, 7z', baseline: 'Web Browser, Slack', diff: isZh ? '行為不符' : 'Mismatch', status: 'warning' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-8 text-left">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-[#0c0c0e] border border-white/10 rounded-[3rem] w-full max-w-7xl h-[94vh] overflow-hidden flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.8)]"
      >
        {/* Playbook Overlay */}
        <AnimatePresence>
          {isExecutingPlaybook && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-12"
            >
              <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap size={40} className="text-blue-500 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">
                    {isZh ? '自動化 XDR 應變編排' : 'Automated XDR Orchestration'}
                  </h3>
                  <p className="text-sm text-gray-500 font-bold mt-2">
                    {isZh ? '正在執行「資料外洩圍堵應變劇本」' : 'Executing Exfiltration Containment Playbook'}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {[
                    isZh ? '停用該使用者的 LDAP/AD 帳號' : 'Disabling User LDAP/AD account',
                    isZh ? '撤銷所有 O365 / Azure 活動連線 Token' : 'Revoking all O365/Azure active tokens',
                    isZh ? '即時隔離來源工作站 (XDR 代理程式)' : 'Isolating Source Workstation (XDR Agent)',
                    isZh ? '觸發完整記憶體鑑識掃描' : 'Triggering Full Memory Forensics Scan'
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
                        playbookStep > i ? "bg-green-600 border-green-500 text-white" : playbookStep === i ? "bg-blue-600/20 border-blue-500 text-blue-400 animate-pulse" : "bg-gray-800 border-gray-700 text-gray-600"
                      )}>
                        {playbookStep > i ? <Check size={12} /> : <div className="text-[10px] font-black">{i+1}</div>}
                      </div>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest",
                        playbookStep > i ? "text-green-400" : playbookStep === i ? "text-white" : "text-gray-600"
                      )}>
                        {s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with 360 Context */}
        <div className="p-10 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-gradient-to-br from-blue-600/5 via-transparent to-red-600/5">
          <div className="flex items-center gap-10">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="72" cy="72" r="66" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-800" />
                <motion.circle 
                  cx="72" cy="72" r="66" stroke="currentColor" strokeWidth="10" fill="transparent" 
                  strokeDasharray="414.6"
                  initial={{ strokeDashoffset: 414.6 }}
                  animate={{ strokeDashoffset: 414.6 - (414.6 * entity.score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn(
                    entity.status === 'Critical' ? "text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.6)]" : "text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black italic tracking-tighter text-white">{entity.score}</span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                  {isZh ? '全局風險分' : 'Global Risk'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-left">
                <h2 className="text-4xl font-black text-white tracking-tighter">{entity.name}</h2>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                     <ShieldCheck size={12} /> {isZh ? '重點監控對象' : 'VIP Entity'}
                   </div>
                   <div className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                     <ShieldAlert size={12} /> {isZh ? '活躍異常告警' : 'Anomaly Active'}
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                 <div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">
                      {isZh ? '身份與部門' : 'Identity/Dept'}
                    </span>
                    <p className="text-sm font-bold text-gray-300 italic">
                      {isZh ? (
                        entity.department === 'Research' ? '研發部 / 研發主管' :
                        entity.department === 'Finance' ? '財務部 / 財務專員' :
                        entity.department === 'IT-Infrastructure' ? 'IT 基礎設施 / 系統管理員' :
                        entity.department === 'Executive' ? '高階主管 / 總監' :
                        `${entity.department} / Team-Lead`
                      ) : `${entity.department} / Research-Lead`}
                    </p>
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">
                      {isZh ? '上次基線同步' : 'Last Baseline Sync'}
                    </span>
                    <p className="text-sm font-bold text-gray-300 italic">
                      {isZh ? '2026-04-29 (昨天)' : '2026-04-29 (Yesterday)'}
                    </p>
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">
                      {isZh ? 'UEBA 同儕風險排名' : 'UEBA Peer Ranking'}
                    </span>
                    <p className="text-sm font-bold text-red-400 italic">
                      {isZh ? '部門內前 1% 高風險' : 'Top 1% Risk in Dept'}
                    </p>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
             {[
               { id: 'storyline', label: isZh ? '事件故事線' : 'Storyline' },
               { id: 'causal', label: isZh ? '因果關聯鏈' : 'Causal' },
               { id: 'baseline', label: isZh ? '行為基線分析' : 'Baseline' },
               { id: 'topology', label: isZh ? '資產拓撲圖' : 'Topology' }
             ].map((view) => (
               <button 
                 key={view.id}
                 onClick={() => setActiveView(view.id as any)}
                 className={cn(
                   "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", 
                   activeView === view.id ? "bg-white text-black shadow-xl" : "bg-white/5 text-gray-500 hover:text-white"
                 )}
               >
                 {view.label}
               </button>
             ))}
             <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all ml-4">
               <X size={20} />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Visualizations */}
          <div className="flex-1 overflow-auto p-12 bg-black/20">
            {activeView === 'storyline' && (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black text-white italic tracking-tight">
                     {isZh ? '整合式 XDR / UEBA 威脅情節故事線' : 'Consolidated XDR/UEBA Storyline'}
                   </h3>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500" />
                         <span className="text-[10px] font-black text-gray-500 uppercase">{isZh ? '行為標籤 (UEBA)' : 'Behavior Tags'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-500" />
                         <span className="text-[10px] font-black text-gray-500 uppercase">{isZh ? 'XDR 遙測警報' : 'XDR Telemetry'}</span>
                      </div>
                   </div>
                </div>

                <div className="relative pl-12 space-y-12 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-blue-600 before:via-gray-800 before:to-red-600">
                  {BEHAVIOR_TIMELINE.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative">
                      <div className={cn(
                        "absolute -left-[42px] top-2 rounded-full border-4 border-[#0c0c0e] shadow-2xl z-10 flex items-center justify-center transition-all",
                        item.risk === 'Critical' ? "w-10 h-10 bg-red-600" : item.risk === 'High' ? "w-8 h-8 bg-blue-600" : "w-6 h-6 bg-gray-600"
                      )}>
                        {item.type === 'xdr' ? <ShieldAlert size={16} className="text-white" /> : <Zap size={14} className="text-white" />}
                      </div>
                      <div className={cn(
                        "p-8 rounded-[2.5rem] border transition-all hover:border-white/20 hover:bg-white/[0.04]",
                        item.type === 'xdr' ? "bg-red-500/5 border-red-500/10" : "bg-blue-500/5 border-blue-500/10"
                      )}>
                        <div className="flex items-start justify-between gap-10">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-4 mb-3">
                              <span className="text-xs font-mono text-gray-500">{item.time}</span>
                              <span className={cn("px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", item.type === 'xdr' ? "bg-red-600 text-white" : "bg-blue-600 text-white")}>
                                {item.category}
                              </span>
                            </div>
                            <h4 className="text-2xl font-black text-white italic mb-3 tracking-tight">
                              {isZh ? (
                                item.event === 'Impossible Travel Detected' ? '偵測到不可達旅行登入 (Impossible Travel)' :
                                item.event === 'Malware Execution Blocked' ? '已成功攔截惡意程式執行' :
                                item.event === 'Abnormal Data Volume' ? '異常資料傳輸量警告' :
                                item.event === 'Lateral Movement Suspicion' ? '疑似內部橫向移動掃描' :
                                item.event === 'Brute Force Attempt' ? '暴力密碼破解登入嘗試' :
                                item.event
                              ) : item.event}
                            </h4>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 italic">
                              "{isZh ? (
                                item.description === 'Login from London, UK then Shanghai, China within 20 mins' ? '20分鐘內分別從英國倫敦與中國上海登入成功' :
                                item.description === 'Injected thread detected in svchost.exe' ? '在 svchost.exe 中偵測到注入執行緒' :
                                item.description === '5.2 GB uploaded to personal cloud storage' ? '已上傳 5.2 GB 資料至私人雲端儲存空間' :
                                item.description === 'Iterative scan of internal DB ports' ? '連續反覆掃描內部資料庫通訊埠' :
                                item.description === '50+ failed logins targeting DC-Primary' ? '針對 DC-Primary 網域控制器嘗試 50 次以上登入失敗' :
                                item.description
                              ) : item.description}"
                            </p>
                            
                            <div className="flex gap-4">
                               <button className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                                 {isZh ? '詳細日誌' : 'Details'}
                               </button>
                               <button className="px-5 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600/20 transition-all flex items-center gap-2">
                                 <FileSearch size={12} /> {isZh ? '基線偏離分析' : 'Baseline Diff'}
                               </button>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] font-black text-gray-600 uppercase mb-2 tracking-widest">
                               {isZh ? '基線偏離度' : 'Baseline Variance'}
                             </div>
                             <div className="text-4xl font-black italic text-red-500">+{Math.floor(Math.random() * 1000) + 500}%</div>
                             <div className="mt-4 flex gap-2 justify-end">
                                <div className="w-1 bg-blue-500/20 h-10 rounded-full overflow-hidden flex flex-col justify-end"><div className="h-2 bg-blue-500 w-full" /></div>
                                <div className="w-1 bg-red-500/20 h-10 rounded-full overflow-hidden flex flex-col justify-end"><div className="h-8 bg-red-500 w-full" /></div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'baseline' && (
              <div className="h-full flex flex-col items-center justify-center p-10">
                 <div className="w-full max-w-5xl space-y-12">
                    <div className="text-center">
                       <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
                         {isZh ? '跨維度行為基線比對分析' : 'Cross-Vector Baseline Analysis'}
                       </h3>
                       <p className="text-gray-500 font-bold text-sm">
                         {isZh ? '將 14 天滾動基準特徵與目前 24 小時內的激增行為進行比對' : 'Comparing 14-day rolling profile against current 24-hour surge'}
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       {baselineMetrics.map((metric, i) => (
                         <motion.div 
                           key={i}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: i * 0.1 }}
                           className="p-8 bg-[#111114] border border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all"
                         >
                            <div className="flex justify-between items-center mb-6">
                               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{metric.label}</span>
                               <span className={cn(
                                 "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                 metric.status === 'danger' ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                               )}>{metric.diff}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-10">
                               <div>
                                  <div className="text-[8px] font-black text-gray-600 uppercase mb-2">{isZh ? '歷史正常基線' : 'Standard Profile'}</div>
                                  <p className="text-sm font-bold text-gray-400">{metric.baseline}</p>
                               </div>
                               <div>
                                  <div className="text-[8px] font-black text-gray-600 uppercase mb-2">{isZh ? '當前即時活動' : 'Current Activity'}</div>
                                  <p className="text-lg font-black text-white italic tracking-tight">{metric.current}</p>
                                </div>
                            </div>
                         </motion.div>
                       ))}
                    </div>

                    <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl flex items-center gap-8">
                       <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl">
                          <Activity size={32} />
                       </div>
                       <div className="text-left">
                          <h4 className="text-xl font-black text-white italic">
                            {isZh ? '異常置信度：98.2%' : 'Anomaly Confidence: 98.2%'}
                          </h4>
                          <p className="text-sm text-gray-400 leading-relaxed max-w-2xl mt-1">
                            {isZh ? '行為模式與已知資料外洩特徵高度吻合。根據工作站內部橫向移動跡象，帳號被盜用的機率極高。' : 'Behavior pattern matches known exfiltration profile. Probability of account compromise is high based on lateral workstation movement.'}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeView === 'causal' && (
              <div className="h-full flex flex-col items-center justify-center p-10">
                 <div className="w-full max-w-3xl">
                    <h3 className="text-2xl font-black text-white italic tracking-tight mb-16 text-center underline underline-offset-8 decoration-red-600/50 uppercase">
                      {isZh ? '資料外洩行為因果關聯鏈' : 'Data Exfiltration Behavior Chain'}
                    </h3>
                    <div className="flex flex-col items-center">
                       {causalSteps.map((step, i) => (
                         <div key={i} className="flex flex-col items-center w-full">
                           <motion.div 
                             initial={{ opacity: 0, x: -30 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.2 }}
                             className="w-full p-8 bg-[#111114] border border-white/5 rounded-3xl flex items-center gap-8 relative group hover:border-blue-500/30 transition-all"
                           >
                              <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110",
                                step.status === 'critical' ? "bg-red-600" : step.status === 'danger' ? "bg-orange-600" : "bg-blue-600"
                              )}>
                                {step.icon}
                              </div>
                              <div className="text-left flex-1">
                                <h4 className="text-xl font-black text-white italic tracking-tight">{step.label}</h4>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">{step.detail}</p>
                              </div>
                              {i === causalSteps.length - 1 && (
                                <div className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                  {isZh ? '最終外洩階段' : 'Final Stage'}
                                </div>
                              )}
                           </motion.div>
                           {i < causalSteps.length - 1 && (
                             <motion.div 
                               initial={{ height: 0 }}
                               animate={{ height: 60 }}
                               className="w-px bg-gradient-to-b from-blue-600 to-red-600 my-4 border-l border-dashed border-white/20"
                             />
                           )}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}
            
            {activeView === 'topology' && (
               <div className="h-full flex flex-col items-center justify-center bg-transparent">
                  <div className="text-center mb-12">
                     <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">
                       {isZh ? '實體關聯圖譜' : 'Entity Relationship Graph'}
                     </h3>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                       {isZh ? '可視化一級基礎設施關聯網路' : 'Visualizing 1st Degree Infrastructure Connections'}
                     </p>
                  </div>
                  <div className="w-[500px] h-[500px] border border-white/5 rounded-full relative flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]">
                     <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-[0_0_50px_rgba(59,130,246,0.4)] z-10 border-4 border-[#0c0c0e]">
                        {entity.avatar || 'JW'}
                     </div>
                     
                     {[
                       { label: 'SRV-FILE-01', color: 'red', icon: <Server size={14} />, angle: 0 },
                       { label: 'Workstation-92', color: 'blue', icon: <Smartphone size={14} />, angle: 90 },
                       { label: 'VPN-LND-GW', color: 'blue', icon: <Globe size={14} />, angle: 180 },
                       { label: 'MEGA-Cloud-X', color: 'red', icon: <UploadCloud size={14} />, angle: 270 },
                     ].map((node, i) => (
                       <motion.div 
                         key={i}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ delay: 0.5 + i * 0.2 }}
                         className="absolute flex items-center justify-center"
                         style={{ transform: `rotate(${node.angle}deg) translateY(-200px) rotate(-${node.angle}deg)` }}
                       >
                          <div className={cn(
                            "p-5 rounded-2xl border flex flex-col items-center gap-2 shadow-2xl transition-all hover:scale-110 cursor-pointer",
                            node.color === 'red' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                          )}>
                             {node.icon}
                             <span className="text-[10px] font-black uppercase tracking-widest">{node.label}</span>
                          </div>
                          <div className={cn(
                            "absolute bottom-0 w-px h-32 origin-bottom",
                            node.color === 'red' ? "bg-gradient-to-t from-red-600/50 to-transparent" : "bg-gradient-to-t from-blue-600/50 to-transparent"
                          )} style={{ transform: 'translateY(-60px)' }} />
                       </motion.div>
                     ))}
                     
                     <div className="absolute inset-0 border border-white/5 rounded-full scale-110" />
                     <div className="absolute inset-0 border border-white/5 rounded-full scale-125 border-dashed" />
                  </div>
               </div>
            )}
          </div>

          {/* Right Column: 360 Response Panel */}
          <div className="w-[30rem] border-l border-white/5 bg-white/[0.02] flex flex-col">
            <div className="p-12 flex-1 overflow-auto space-y-12">
               {/* Context Overview */}
               <section className="text-left space-y-6">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                    {isZh ? '實體 360° 健康度' : 'Entity 360° Health'}
                  </h4>
                  <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 italic">{isZh ? '身分驗證有效性' : 'Auth Validity'}</span>
                        <span className="text-xs font-black text-green-500 uppercase">{isZh ? '已通過 (MFA)' : 'Verified (MFA)'}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 italic">{isZh ? 'UEBA 群組' : 'UEBA Cluster'}</span>
                        <span className="text-xs font-black text-blue-400 uppercase">Dev-Lead-Group</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 italic">{isZh ? '資安意識培訓' : 'Security Training'}</span>
                        <span className="text-xs font-black text-gray-300 uppercase">{isZh ? '已完成' : 'Completed'}</span>
                     </div>
                     <div className="pt-4 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                           {['AnomalousEgress', 'SensitiveFileScan', 'NewProcess7z'].map(tag => (
                             <span key={tag} className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-400">#{tag}</span>
                           ))}
                        </div>
                     </div>
                  </div>
               </section>

               {/* Orchestration Response */}
               <section className="text-left space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                      {isZh ? 'XDR 處置響應面板' : 'XDR Response Panel'}
                    </h4>
                    <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                      {isZh ? '自動模式：已啟用' : 'AUTO-MODE: ENABLED'}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={executePlaybook}
                      disabled={isExecutingPlaybook}
                      className="w-full group py-5 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                       <ShieldX size={18} className="group-hover:rotate-12 transition-transform" />
                       {isZh ? '啟動圍堵應變劇本' : 'Activate Containment Playbook'}
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-red-600/10 hover:border-red-500/30 transition-all">
                          <LogOut size={14} className="text-orange-500" />
                          {isZh ? '強制登出' : 'Force Logout'}
                       </button>
                       <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-orange-600/10 hover:border-orange-500/30 transition-all">
                          <Key size={14} className="text-blue-500" />
                          {isZh ? '重設憑證密碼' : 'Reset Credentials'}
                       </button>
                       <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-blue-600/10 hover:border-blue-500/30 transition-all">
                          <ShieldCheck size={14} className="text-green-500" />
                          {isZh ? '加入觀察名單 (+)' : 'Watchlist (+)'}
                       </button>
                       <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-white/20 transition-all">
                          <FileText size={14} className="text-gray-400" />
                          {isZh ? '手動人工審查' : 'Manual Review'}
                       </button>
                    </div>
                  </div>
               </section>

               {/* Investigation Log */}
               <section className="text-left space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                      {isZh ? '協同調查筆記' : 'Collaborative Notes'}
                    </h4>
                    <span className="text-[9px] font-black text-gray-600 italic">
                      {isZh ? '2 位分析師協作' : '2 Contributors'}
                    </span>
                 </div>
                 
                 <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                   {notes.map((note, i) => (
                     <div key={i} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl relative group">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[9px] font-black text-blue-400 uppercase italic">
                             {isZh ? 'SOAR 資安分析師 • 剛剛' : 'SOAR Analyst • Just now'}
                           </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed italic pr-4">"{note}"</p>
                     </div>
                   ))}
                 </div>

                 <div className="relative">
                   <textarea 
                     value={newNote}
                     onChange={(e) => setNewNote(e.target.value)}
                     placeholder={isZh ? "輸入調查結論或備註..." : "Type investigative findings..."}
                     className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-5 text-sm text-white h-32 outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                   />
                   <button 
                     onClick={() => { if(newNote) { setNotes([...notes, newNote]); setNewNote(''); } }}
                     className="absolute bottom-4 right-4 p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-all shadow-xl"
                   >
                     <Send size={16} />
                   </button>
                 </div>
               </section>
            </div>

            {/* AI Summary Footer */}
            <div className="p-10 border-t border-white/5 bg-blue-600/[0.02] text-left">
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse">
                     <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                      {isZh ? 'AI 分析師評估脈絡' : 'AI Analyst Context'}
                    </div>
                    <p className="text-[11px] font-bold text-blue-400 leading-relaxed italic">
                      {isZh 
                        ? '「檔案存取量暴增與後續連接外部雲端儲存之間存在極高關聯性。建議立即啟動自動隔離措施。」'
                        : '"High correlation between file access surge and the subsequent MEGA.nz connection. Recommend immediate containment."'}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


const CRITICAL_INCIDENTS = [
  {
    time: '2026-04-30 02:30:00',
    srcip: 'Kevin (R&D)',
    dstip: 'MEGA.nz Cloud',
    action: 'UEBA: Data Exfiltration',
    country: 'Internal',
    threat: 'Anomalous Upload (15GB)',
    risk: 'Critical'
  },
  {
    time: '2026-04-30 02:15:00',
    srcip: 'Kevin (R&D)',
    dstip: 'Git Server',
    action: 'UEBA: File Access Anomaly',
    country: 'Internal',
    threat: 'High Vol Source Code Access',
    risk: 'High'
  },
  {
    time: '2026-04-02 09:30:15',
    srcip: '103.45.12.88',
    dstip: '192.168.50.10',
    action: 'Modbus Write (0x05)',
    country: 'Russia',
    threat: 'Industrial Sabotage',
    risk: 'Critical'
  },
  {
    time: '2026-04-02 09:12:40',
    srcip: '45.122.3.15',
    dstip: '172.16.0.5',
    action: 'SSH Brute Force',
    country: 'China',
    threat: 'Credential Access',
    risk: 'High'
  },
  {
    time: '2026-04-02 08:55:22',
    srcip: '185.220.101.4',
    dstip: '10.0.0.15',
    action: 'SQL Injection',
    country: 'Netherlands',
    threat: 'Data Exfiltration',
    risk: 'Critical'
  },
  {
    time: '2026-04-02 08:40:10',
    srcip: '91.241.19.33',
    dstip: '192.168.1.100',
    action: 'RDP Exploit (BlueKeep)',
    country: 'Ukraine',
    threat: 'Lateral Movement',
    risk: 'High'
  },
  {
    time: '2026-04-02 08:15:05',
    srcip: '192.168.50.200',
    dstip: '8.8.8.8',
    action: 'DNS Tunneling',
    country: 'Internal',
    threat: 'C2 Communication',
    risk: 'Critical'
  }
];

function NodeGraph({ data }: { data: any }) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;

    // Marker for arrowheads
    svg.append("defs").append("marker")
      .attr("id", "arrowhead-mini")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", (d: any) => {
        if (d.type === 'malicious') return '#ef4444';
        if (d.type === 'suspicious') return '#f97316';
        return '#4b5563';
      })
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("marker-end", "url(#arrowhead-mini)")
      .attr("class", "flow-animation");

    // Link Labels (Methods/Techniques)
    const linkText = svg.append("g")
      .selectAll("text")
      .data(data.links)
      .join("text")
      .text((d: any) => d.method || '')
      .attr("fill", "#6b7280")
      .attr("font-size", "8px")
      .attr("text-anchor", "middle")
      .attr("font-weight", "medium");

    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 14)
      .attr("fill", (d: any) => {
        if (d.type === 'Actor') return '#7f1d1d';
        if (d.type === 'IOC') return '#f97316';
        if (d.type === 'Asset') return '#1e40af';
        return '#374151';
      })
      .attr("stroke", (d: any) => d.risk === 'high' ? '#f87171' : 'none')
      .attr("stroke-width", 2)
      .attr("class", (d: any) => d.risk === 'high' ? 'animate-pulse' : '');

    node.append("text")
      .text((d: any) => d.id)
      .attr("y", 24)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "bold");

    node.append("text")
      .text((d: any) => d.label || '')
      .attr("y", 34)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .attr("font-size", "8px");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkText
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="w-full h-full bg-[#0a0a0c] rounded-xl border border-gray-800/50 overflow-hidden relative shadow-inner">
      <div className="absolute top-3 left-3 flex gap-4 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-900" />
          <span className="text-[8px] text-gray-500 uppercase font-black">Threat Actor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
          <span className="text-[8px] text-gray-500 uppercase font-black">IOC / Malware</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
          <span className="text-[8px] text-gray-500 uppercase font-black">Target Asset</span>
        </div>
      </div>
      <svg ref={svgRef} viewBox="0 0 800 400" className="w-full h-full" />
    </div>
  );
}

// Note: Custom Dashboard (客製化儀錶板) has been fully refactored and modularized into ./components/custom-dashboard/CustomDashboardView.tsx

// Note: Custom Visibility Studio and Panel Editor have been modularized into ./components/visualization/CustomVisibilityView.tsx

function CollaborativeNotesPanel({ incidentId, currentUser }: { incidentId: string, currentUser: any }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setSocketStatus('connecting');

    ws.onopen = () => {
      setSocketStatus('connected');
      ws.send(JSON.stringify({ type: 'join', incidentId }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'sync_notes') {
          setNotes(payload.notes);
        } else if (payload.type === 'new_note') {
          setNotes(prev => {
            if (prev.some(n => n.id === payload.note.id)) return prev;
            return [...prev, payload.note];
          });
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onclose = () => {
      setSocketStatus('disconnected');
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      setSocketStatus('disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [incidentId]);

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const authorName = currentUser?.username || 'analyst';

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'add_note',
        incidentId,
        content: newNoteText.trim(),
        author: authorName
      }));
      setNewNoteText('');
    } else {
      fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          incidentId,
          content: newNoteText.trim(),
          author: authorName
        })
      })
      .then(r => r.json())
      .then(data => {
        if (data?.success) {
          const freshNote = data.note;
          setNotes(prev => {
            if (prev.some(n => n.id === freshNote.id)) return prev;
            return [...prev, freshNote];
          });
          setNewNoteText('');
        }
      })
      .catch(err => {
        console.error('Failed to post note via REST fallback:', err);
      });
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          Collaborative Investigator Notes
        </h4>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            socketStatus === 'connected' ? "bg-green-500 animate-pulse" :
            socketStatus === 'connecting' ? "bg-yellow-500" : "bg-red-500"
          )} />
          <span className={cn(
            socketStatus === 'connected' ? "text-green-400" :
            socketStatus === 'connecting' ? "text-yellow-500" : "text-red-500"
          )}>Real-Time: {socketStatus}</span>
        </div>
      </div>

      <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-5 space-y-4">
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-600 font-bold italic text-xs uppercase tracking-wider">
              No investigative notes added yet
            </div>
          ) : (
            notes.map((note) => {
              const dateStr = new Date(note.timestamp).toLocaleString();
              return (
                <div key={note.id} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-1.5 hover:border-purple-500/10 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500/40" />
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider italic">
                        {note.author}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono">{dateStr}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{note.content}</p>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmitNote} className="flex gap-2 items-end pt-2 border-t border-white/5">
          <div className="flex-1">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add findings, commands executed, PCAP observations..."
              rows={2}
              className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitNote(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!newNoteText.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 font-black text-[10px] uppercase tracking-widest text-shadow-glow text-white rounded-xl transition-all h-[42px] flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/10 active:scale-95"
          >
            <Send size={12} />
            Add Note
          </button>
        </form>
      </div>
    </div>
  );
}

// CriticalIncidentsView is now imported from ./components/CriticalIncidentsView

function AttackTopologyOverlay({ incident, onClose }: { incident: any, onClose: () => void }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const svgRef = React.useRef<SVGSVGElement>(null);

  // WannaCry Infection Topology Data
  const topologyData = {
    nodes: [
      { id: 'C2', type: 'attacker', label: isZh ? 'C2 中繼站' : 'C2 Relay Station', x: 100, y: 250, ip: 'External C2' },
      { id: 'FW', type: 'gateway', label: isZh ? '防火牆' : 'Firewall', x: 250, y: 250, ip: '10.88.88.254' },
      { id: 'SW', type: 'network', label: isZh ? '核心交換器' : 'Core Switch', x: 450, y: 250, ip: '10.88.88.1' },
      { id: 'WS22', type: 'infected', label: isZh ? '受害端點 (WS 22)' : 'Endpoint (WS 22)', x: 650, y: 250, ip: '10.88.88.22', patientZero: true },
      { id: 'WS131', type: 'infected', label: isZh ? '已感染節點 1' : 'Infected Node 1', x: 800, y: 150, ip: '10.88.88.131' },
      { id: 'WS132', type: 'infected', label: isZh ? '已感染節點 2' : 'Infected Node 2', x: 800, y: 350, ip: '10.88.88.132' },
    ],
    links: [
      { source: 'C2', target: 'FW', label: isZh ? '入侵入口' : 'Entry', type: 'entry' },
      { source: 'FW', target: 'SW', label: isZh ? '傳輸鏈結' : 'Transit', type: 'transit' },
      { source: 'SW', target: 'WS22', label: isZh ? '感染植入' : 'Infection', type: 'infection' },
      { source: 'WS22', target: 'WS131', label: isZh ? '橫向擴散' : 'Spread', type: 'lateral' },
      { source: 'WS22', target: 'WS132', label: isZh ? '橫向擴散' : 'Spread', type: 'lateral' },
    ],
    timeline: [
      { time: '10:15:22', event: isZh ? '經由 DNS 隧道偵測到初始感染嘗試' : 'Initial infection detected via DNS Tunneling', status: 'detected' },
      { time: '10:18:45', event: isZh ? 'C2 中繼站已建立與邊界防火牆之連線' : 'C2 Relay established connection with Perimeter Firewall', status: 'processing' },
      { time: '10:22:10', event: isZh ? '偵測到向核心交換器之未授權橫向移動' : 'Unauthorized lateral movement detected to Core Switch', status: 'alert' },
      { time: '10:45:05', event: isZh ? 'WannaCry 惡意載荷於端點 WS 22 執行' : 'WannaCry payload executed on Endpoint WS 22', status: 'critical' },
      { time: '10:48:12', event: isZh ? '透過 SMB 漏洞於內部子網域進行掃描探針' : 'Scanning detected on internal subnets via SMB exploit', status: 'critical' },
    ]
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Define Arrow markers
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    // Glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow-df");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Drawing Links
    svg.append("g")
      .selectAll("path")
      .data(topologyData.links)
      .join("path")
      .attr("d", (d: any) => {
        const s = topologyData.nodes.find(n => n.id === d.source)!;
        const t = topologyData.nodes.find(n => n.id === d.target)!;
        return `M ${s.x} ${s.y} L ${t.x} ${t.y}`;
      })
      .attr("stroke", (d: any) => {
        if (d.type === 'entry') return '#3b82f6';
        if (d.type === 'infection') return '#ef4444';
        return '#f97316';
      })
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)")
      .attr("style", "filter: url(#glow-df)");

    // Animated Flow Particles
    const particles = svg.append("g");
    topologyData.links.forEach((link, i) => {
      const s = topologyData.nodes.find(n => n.id === link.source)!;
      const t = topologyData.nodes.find(n => n.id === link.target)!;
      particles.append("circle")
        .attr("r", 3)
        .attr("fill", link.type === 'entry' ? "#3b82f6" : "#ef4444")
        .append("animateMotion")
        .attr("path", `M ${s.x} ${s.y} L ${t.x} ${t.y}`)
        .attr("dur", "3s")
        .attr("repeatCount", "indefinite")
        .attr("begin", `${i * 0.5}s`);
    });

    // Drawing Nodes
    const nodes = svg.append("g")
      .selectAll("g")
      .data(topologyData.nodes)
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    nodes.append("circle")
      .attr("r", 28)
      .attr("fill", "#111114")
      .attr("stroke", (d: any) => d.type === 'attacker' ? "#3b82f6" : d.type === 'infected' ? "#ef4444" : "#4b5563")
      .attr("stroke-width", 3)
      .attr("class", (d: any) => d.type === 'infected' ? 'animate-pulse' : '');

    // Icons Mapping (using text or foreignObject for simplicity here but could use Lucide components)
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .text((d: any) => d.type === 'attacker' ? '🌐' : d.type === 'infected' ? '💻' : '🛡️');

    nodes.append("text")
      .text((d: any) => d.label)
      .attr("y", 45)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "black")
      .attr("class", "uppercase italic tracking-tighter");

    nodes.append("text")
      .text((d: any) => d.ip)
      .attr("y", 58)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .attr("font-size", "11px")
      .attr("font-family", "monospace");

    nodes.append("text")
      .text((d: any) => d.label)
      .attr("y", 50)
      .attr("text-anchor", "middle")
      .attr("fill", "#9ca3af")
      .attr("font-size", "9px");

  }, [isZh]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden"
    >
      <div className="bg-[#111114] w-full h-full flex flex-col overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all z-20 group"
        >
          <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            {isZh ? '返回事件列表' : 'Back to Incidents'}
          </span>
          <X className="w-8 h-8" />
        </button>

        <div className="p-8 pb-6 border-b border-gray-800 flex items-center justify-between bg-[#111114]">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600/20 p-3 rounded-xl border border-purple-500/30">
              <Workflow className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isZh ? '攻擊路徑拓撲分析圖' : 'Attack Analysis Topology Diagram'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                  {isZh ? '關聯分析狀態：' : 'Correlation Status:'}
                </span>
                <span className="text-xs text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
                  {isZh ? '分析完成' : 'Analysis Complete'}
                </span>
                <span className="text-xs text-gray-500 ml-4">
                  {isZh ? '事故發生時間：' : 'Incident Time: '}{incident?.time}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-black">
                  {isZh ? '關聯資料來源' : 'Correlation Data'}
                </p>
                <p className="text-xs text-white font-bold">
                  {isZh ? '日誌、流量、威脅情資 (±1小時視窗)' : 'Logs, Flows, CTI (±1h Window)'}
                </p>
             </div>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 bg-black/40 relative overflow-hidden">
            <div className="absolute top-4 left-4 p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-2 pointer-events-none">
              <p className="text-[10px] font-black uppercase text-gray-500">
                {isZh ? '圖例說明' : 'Legend'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-900" />
                <span className="text-[10px] text-gray-400">
                  {isZh ? '攻擊者 (C2 節點)' : 'Threat Actor'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-gray-400">
                  {isZh ? '主要感染受害資產' : 'Primary Infected Asset'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-[10px] text-gray-400">
                  {isZh ? '內部網路資產' : 'Internal Asset'}
                </span>
              </div>
            </div>
            <svg ref={svgRef} className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" />
          </div>

          <div className="w-96 border-l border-gray-800 bg-[#16161a] p-6 overflow-y-auto space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Clock size={12} />
                {isZh ? '感染時間軸 (關聯分析)' : 'Infection Timeline (Correlation)'}
              </h3>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gray-800">
                {topologyData.timeline.map((item, idx) => (
                  <div key={idx} className="relative pl-8 group">
                    <div className={cn(
                      "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#16161a] z-10 transition-transform group-hover:scale-110",
                      item.status === 'detected' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                      item.status === 'processing' ? 'bg-yellow-500' :
                      item.status === 'alert' ? 'bg-orange-500' :
                      item.status === 'escalation' ? 'bg-red-500' : 'bg-red-600 animate-pulse border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    )}>
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-500 flex items-center gap-2">
                        {item.time}
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/30">
                            {isZh ? '首波感染源' : 'Patient Zero'}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-200 leading-relaxed font-medium">
                        {item.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-purple-600/5 border border-purple-600/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Brain size={16} />
                <span className="text-xs font-black uppercase tracking-widest">
                  {isZh ? 'AI 關聯分析洞察' : 'Correlation Insights'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed italic">
                {isZh ? 
                  `"網路流量與端點日誌之自動關聯分析顯示，該惡意程式利用客製編譯之類 PSEXEC 腳本進行橫向移動。目標帳號識別為 'SVC_DATA_MASTER'。建議立即重設密碼並隔離受害主機。"` :
                  `"Automatic correlation of network flows with endpoint logs suggests the malware used a custom compiled PSEXEC-like script for lateral movement. Target accounts identified as 'SVC_DATA_MASTER'. Immediate password reset and host isolation is critical."`
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-900/50 border-t border-gray-800 flex justify-between items-center">
          <div className="flex gap-4">
             <div className="px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-gray-300">
                  {isZh ? '流量分析：正常' : 'Flow Analysis: OK'}
                </span>
             </div>
             <div className="px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-gray-300">
                  {isZh ? '威脅情資比對：4 個實體' : 'CTI Match: 4 Entities'}
                </span>
             </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold transition-all text-white">
              {isZh ? '下載完整報告' : 'Download Report'}
            </button>
            <button className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-bold transition-all text-white shadow-lg shadow-purple-600/20">
              {isZh ? '套用阻斷隔離策略' : 'Apply Containment Policy'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const CyberRadarLogo = () => {
  return (
    <div className="relative group flex items-center justify-center">
      {/* Dynamic Pulse Rings */}
      <motion.div 
        animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-10 h-10 bg-blue-500/20 rounded-full"
      />
      <motion.div 
        animate={{ scale: [1, 2.8], opacity: [0.4, 0] }}
        transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-10 h-10 bg-blue-500/10 rounded-full"
      />

      {/* Main Scanner Container */}
      <div className="relative w-11 h-11 bg-blue-900/10 rounded-full border border-blue-500/20 flex items-center justify-center overflow-hidden backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        {/* Spinning Scanner Sweep */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-tr from-blue-500/40 via-transparent to-transparent origin-center scale-150 z-10"
        />

        {/* Custom SVG icon inspired by segmented radar */}
        <svg viewBox="0 0 100 100" className="w-8 h-8 relative z-20 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">
          <path d="M50 5 L50 20 A30 30 0 0 1 80 50 L95 50 A45 45 0 0 0 50 5 Z" fill="currentColor" className="text-blue-400 opacity-80" />
          <path d="M95 50 L80 50 A30 30 0 0 1 50 80 L50 95 A45 45 0 0 0 95 50 Z" fill="currentColor" className="text-blue-300 opacity-90" />
          <path d="M50 95 L50 80 A30 30 0 0 1 20 50 L5 50 A45 45 0 0 0 50 95 Z" fill="currentColor" className="text-blue-500 opacity-80" />
          <path d="M5 50 L20 50 A30 30 0 0 1 50 20 L50 5 A45 45 0 0 0 5 50 Z" fill="currentColor" className="text-blue-400 opacity-70" />
          <circle cx="50" cy="50" r="8" className="fill-blue-400 animate-pulse" />
        </svg>

        {/* Scanning Grid Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(59,130,246,0.3)_1px,transparent_1px)] bg-[size:8px_8px]" />
      </div>
    </div>
  );
};

export default function App() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(() => {
    try {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('seeor_user') : null;
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      // ignore
    }
    return { id: '1', username: 'supervisor', role: 'supervisor', email: 'supervisor@seeor.cyber', status: 'active', modules: ['all'] };
  });

  const canAccessEngineMonitor = user?.role === 'supervisor';

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('seeor_user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('seeor_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('seeor_user');
      }
    }
  }, []);

  const handleLogin = (u: any) => {
    setUser(u);
    localStorage.setItem('seeor_user', JSON.stringify(u));
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState<'network' | 'auth' | 'users' | 'general' | 'collection' | 'remotelog' | 'nac' | 'decoder' | 'alert' | 'ndr_alerts' | 'engine_monitoring' | 'update' | 'ueba' | 'threat_intel'>('network');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'dashboard': true,
    'core': true,
    'detection': true,
    'intelligence': true,
    'performance': true,
    'correlation': false,
    'settings': false
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const userCanSeeModule = (moduleId: string) => {
    if (!user) return false;
    if (user.role === 'supervisor' || user.role === 'admin') return true;
    if (user.modules?.includes('all')) return true;
    return user.modules?.includes(moduleId) || false;
  };

  const [license] = useState<LicenseInfo>({
    status: 'Active',
    type: 'Enterprise',
    expiryDate: '2027-12-31',
    maxNodes: 500,
    currentNodes: 142
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OverviewDashboardView setActiveTab={setActiveTab} />;
      case 'custom-dashboard':
        return <CustomDashboardView />;
      case 'custom-visibility':
        return <CustomVisibilityView />;
      case 'critical-incidents':
        return <CriticalIncidentsView currentUser={user} />;
      case 'discovery':
        return <DiscoveryView />;
      case 'agent-summary':
        return <AgentSummaryView />;
      case 'malware-analysis':
        return <MalwareAnalysisView />;
      case 'vulnerability':
        return <VulnerabilityView />;
      case 'fim':
        return <FIMView />;
      case 'industrial':
      case 'traffic-control':
        return <OTSecurityViewComponent />;
      case 'monitor':
        return <NetworkMonitorView />;
      case 'gateway':
        return <PlatformPerformanceView />;
      case 'apm':
        return <APMView />;
      case 'flow':
        return <TrafficAnalysisNDRView />;
      case 'ndr-analytics':
        return <NDRAlertAnalyticsView onNavigateToRuleSettings={() => { setActiveTab('settings'); setActiveSettingsTab('ndr_alerts'); }} />;
      case 'endpoint':
        return <OpenXDRView />;
      case 'soar':
        return <SOARViewComponent />;
      case 'digital-forensics':
        return <DigitalForensicsViewComponent />;
      case 'case-management':
        return <CaseManagementView />;
      case 'ai-analyst':
        return <AIAnalystView />;
      case 'intel':
        return <IntelCTIView />;
      case 'correlation-summary':
        return <CorrelationSummaryView />;
      case 'correlation-setting':
        return <CorrelationSettingView />;
      case 'wargaming':
        return <CyberWargamingView />;
      case 'honeypot-map':
        return <HoneypotManagerView />;
      case 'ueba-investigation':
        return <UEBASystemView />;
      case 'license':
        return <LicenseManagementView />;
      case 'correlation':
        return (
          <div className="space-y-8">
            {/* Incident Correlation & Reverse Tracking View */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar: Incident Summary */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600/20 p-2 rounded-lg">
                      <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <h3 className="font-bold text-white">Incident Summary</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Patient Zero</p>
                      <p className="text-sm font-bold text-white">Marketing-WS-01</p>
                      <p className="text-[10px] text-gray-500 font-mono">192.168.1.45</p>
                    </div>

                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                      <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Malware Identified</p>
                      <div className="flex items-center gap-2">
                        <Skull size={14} className="text-purple-400" />
                        <p className="text-sm font-bold text-white">Cobalt Strike Beacon</p>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">SHA256: 4a2b...f3e1</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Correlation Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {['NDR', 'XDR', 'Log', 'CTI', 'Flow'].map(s => (
                          <span key={s} className="px-2 py-0.5 bg-gray-800 rounded text-[9px] font-bold text-gray-400 border border-gray-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Attack Timeline</p>
                      <div className="space-y-4">
                        {[
                          { time: '10:42:01', event: 'Initial Access (Phishing)', status: 'Source' },
                          { time: '10:45:15', event: 'Malware Execution', status: 'Infection' },
                          { time: '10:52:30', event: 'Lateral Movement (SMB)', status: 'Spread' },
                          { time: '11:05:12', event: 'DC Compromise Attempt', status: 'Target' },
                        ].map((step, i) => (
                          <div key={i} className="flex gap-3 relative">
                            {i < 3 && <div className="absolute left-1.5 top-4 bottom-[-16px] w-0.5 bg-gray-800"></div>}
                            <div className={cn(
                              "w-3 h-3 rounded-full mt-1 z-10",
                              i === 0 ? "bg-blue-500" : i === 3 ? "bg-red-500" : "bg-purple-500"
                            )}></div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-200">{step.event}</p>
                              <p className="text-[9px] text-gray-500 font-mono">{step.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main View: Reverse Tracking Topology */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 relative overflow-hidden min-h-[600px]">
                  <div className="absolute top-6 left-6 z-10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Share2 className="text-red-400" size={20} />
                      Reverse Tracking Topology View
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Multi-source Correlation: Log + Event + Flow + CTI + NDR + XDR</p>
                  </div>

                  <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 border border-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Initial Vector</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 border border-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Lateral Spread</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 border border-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Final Target</span>
                    </div>
                  </div>

                  <div className="w-full h-full flex items-center justify-center pt-12">
                    <svg width="100%" height="500" viewBox="0 0 1000 500" className="overflow-visible">
                      {/* Infection Flow Lines */}
                      {[
                        { from: [100, 250], to: [300, 250], color: '#3b82f6', label: 'Initial Access' },
                        { from: [300, 250], to: [450, 150], color: '#a855f7', label: 'Lateral Movement' },
                        { from: [300, 250], to: [450, 350], color: '#a855f7', label: 'Lateral Movement' },
                        { from: [450, 150], to: [700, 250], color: '#ef4444', label: 'Privilege Escalation' },
                        { from: [450, 350], to: [700, 250], color: '#ef4444', label: 'Data Exfiltration' },
                        { from: [700, 250], to: [900, 250], color: '#ef4444', label: 'Impact' },
                      ].map((line, i) => (
                        <g key={`flow-${i}`}>
                          <motion.path
                            d={`M ${line.from[0]} ${line.from[1]} L ${line.to[0]} ${line.to[1]}`}
                            stroke={line.color}
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray="6,6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: i * 0.3 }}
                          />
                          {/* Dynamic Infection Flow Animation */}
                          <motion.circle
                            r="3"
                            fill={line.color}
                            initial={{ offsetDistance: "0%" }}
                            animate={{ offsetDistance: "100%" }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "linear",
                              delay: i * 0.3
                            }}
                            style={{
                              offsetPath: `path('M ${line.from[0]} ${line.from[1]} L ${line.to[0]} ${line.to[1]}')`,
                              offsetRotate: "auto"
                            }}
                          />
                          <text 
                            x={(line.from[0] + line.to[0]) / 2} 
                            y={(line.from[1] + line.to[1]) / 2 - 10} 
                            textAnchor="middle" 
                            className="text-[8px] fill-gray-600 font-bold uppercase tracking-tighter"
                          >
                            {line.label}
                          </text>
                        </g>
                      ))}

                      {/* Nodes */}
                      {[
                        { x: 100, y: 250, label: 'Attacker C2', type: 'attacker', ip: '185.199.110.153', icon: <Globe size={24} /> },
                        { x: 300, y: 250, label: 'Patient Zero', type: 'host', ip: '192.168.1.45', name: 'Marketing-WS-01', icon: <Monitor size={24} /> },
                        { x: 450, y: 150, label: 'File Server', type: 'host', ip: '192.168.1.10', name: 'FS-PROD-01', icon: <Server size={24} /> },
                        { x: 450, y: 350, label: 'Backup Server', type: 'host', ip: '192.168.1.12', name: 'BK-OFFSITE', icon: <Database size={24} /> },
                        { x: 700, y: 250, label: 'Domain Controller', type: 'target', ip: '10.0.5.2', name: 'DC-PRIMARY', icon: <ShieldAlert size={24} /> },
                        { x: 900, y: 250, label: 'Data Exfil', type: 'impact', ip: 'Cloud Storage', icon: <Cloud size={24} /> },
                      ].map((node, i) => (
                        <g key={`node-${i}`} transform={`translate(${node.x}, ${node.y})`}>
                          <motion.circle 
                            r="32" 
                            fill={
                              node.type === 'attacker' ? "#3b82f6" : 
                              node.type === 'target' ? "#ef4444" : 
                              node.type === 'impact' ? "#ef4444" : "#9333ea"
                            } 
                            fillOpacity="0.1" 
                            stroke={
                              node.type === 'attacker' ? "#3b82f6" : 
                              node.type === 'target' ? "#ef4444" : 
                              node.type === 'impact' ? "#ef4444" : "#9333ea"
                            } 
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.2 }}
                          />
                          <foreignObject x="-12" y="-12" width="24" height="24">
                            <div className={cn(
                              "w-full h-full flex items-center justify-center",
                              node.type === 'attacker' ? "text-blue-400" : 
                              node.type === 'target' ? "text-red-400" : 
                              node.type === 'impact' ? "text-red-400" : "text-purple-400"
                            )}>
                              {node.icon}
                            </div>
                          </foreignObject>
                          <text y="45" textAnchor="middle" className="text-[10px] font-bold fill-white uppercase tracking-widest">{node.label}</text>
                          <text y="57" textAnchor="middle" className="text-[8px] fill-gray-500 font-mono">{node.ip}</text>
                          {node.name && <text y="67" textAnchor="middle" className="text-[8px] fill-gray-600 font-bold italic">{node.name}</text>}
                          
                          {/* Infection Pulse for infected nodes */}
                          {node.type !== 'attacker' && (
                            <motion.circle
                              r="32"
                              fill="none"
                              stroke={node.type === 'target' ? "#ef4444" : "#9333ea"}
                              strokeWidth="1"
                              initial={{ scale: 1, opacity: 0.5 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
                    <div className="bg-gray-900/80 border border-gray-800 p-3 rounded-lg">
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Initial Infection Vector</p>
                      <p className="text-xs text-blue-400 font-bold">Phishing Email (Log Correlation)</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 p-3 rounded-lg">
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Lateral Movement Method</p>
                      <p className="text-xs text-purple-400 font-bold">SMB Relay / Kerberoasting (Flow/NDR)</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 p-3 rounded-lg">
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Data Exfiltration Channel</p>
                      <p className="text-xs text-red-400 font-bold">DNS Tunneling (XDR Detection)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* D3-based 24-Hour Incident Frequency & Intensity Heatmap */}
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 shadow-2xl space-y-4">
              <Correlation24hHeatmap isZh={isZh} />
            </div>
          </div>
        );
      case 'executive-insights':
        return <ExecutiveDashboardView setActiveTab={setActiveTab} />;
      case 'compliance-center':
        return <ComplianceCenterView />;
      case 'settings':
        return <SettingsView activeSubTab={activeSettingsTab} setActiveSubTab={setActiveSettingsTab} currentUser={user} />;
      default:
        return <OverviewDashboardView setActiveTab={setActiveTab} />;
    }
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-[#111114] border-r border-gray-800 flex flex-col z-50"
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <CyberRadarLogo />

          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-white via-blue-200 to-gray-500 bg-clip-text text-transparent italic">
                SEMOR CYBER
              </span>
              <span className="text-[8px] text-blue-500 font-bold uppercase tracking-[0.2em] -mt-1 italic">Unified Threat Control</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarGroup 
            icon={<LayoutDashboard />} 
            label={t('common.dashboard')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['dashboard']}
            onToggle={() => toggleGroup('dashboard')}
          >
            <SidebarSubItem 
              label={t('modules.executive')} 
              active={activeTab === 'executive-insights'} 
              onClick={() => setActiveTab('executive-insights')}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('modules.compliance_center')} 
              active={activeTab === 'compliance-center'} 
              onClick={() => setActiveTab('compliance-center')}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('common.overview')} 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('common.custom_dashboard')} 
              active={activeTab === 'custom-dashboard'} 
              onClick={() => setActiveTab('custom-dashboard')}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('common.custom_visibility')} 
              active={activeTab === 'custom-visibility'} 
              onClick={() => setActiveTab('custom-visibility')}
              collapsed={!isSidebarOpen}
            />
          </SidebarGroup>

          <SidebarItem 
            icon={<ShieldAlert className="text-red-500" />} 
            label={t('common.critical_incidents')} 
            active={activeTab === 'critical-incidents'} 
            onClick={() => setActiveTab('critical-incidents')}
            collapsed={!isSidebarOpen}
          />

          <SidebarItem 
            icon={<Swords className="text-red-400" />} 
            label={t('modules.wargaming')} 
            active={activeTab === 'wargaming'} 
            onClick={() => setActiveTab('wargaming')}
            collapsed={!isSidebarOpen}
          />

          <SidebarItem 
            icon={<Globe className="text-blue-400" />} 
            label={t('modules.monitor')} 
            active={activeTab === 'monitor'} 
            onClick={() => setActiveTab('monitor')}
            collapsed={!isSidebarOpen}
          />

          {/* Collection Layer Group */}
          <SidebarGroup 
            icon={<Database />} 
            label={t('common.collection_layer')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['collection'] !== false}
            onToggle={() => toggleGroup('collection')}
          >
            {MODULES.filter(m => userCanSeeModule(m.id) && ['flow', 'ndr-analytics', 'endpoint', 'discovery'].includes(m.id)).map(module => (
              <SidebarSubItem 
                key={module.id}
                label={t(`modules.${module.id}`)} 
                active={activeTab === module.id} 
                onClick={() => setActiveTab(module.id)}
                collapsed={!isSidebarOpen}
              />
            ))}
            
            <SidebarNestedGroup
              label={t('modules.correlation-analysis')}
              active={activeTab === 'correlation-summary' || activeTab === 'correlation-setting'}
              collapsed={!isSidebarOpen}
              isExpanded={expandedGroups['correlation']}
              onToggle={() => toggleGroup('correlation')}
            >
              <SidebarSubItem 
                label={t('modules.correlation-summary')} 
                active={activeTab === 'correlation-summary'} 
                onClick={() => setActiveTab('correlation-summary')}
                collapsed={!isSidebarOpen}
              />
              <SidebarSubItem 
                label={t('modules.correlation-setting')} 
                active={activeTab === 'correlation-setting'} 
                onClick={() => setActiveTab('correlation-setting')}
                collapsed={!isSidebarOpen}
              />
            </SidebarNestedGroup>
          </SidebarGroup>

          {/* Intelligence Layer Group */}
          <SidebarGroup 
            icon={<Brain />} 
            label={t('common.intelligence_layer')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['intelligence']}
            onToggle={() => toggleGroup('intelligence')}
          >
            {MODULES.filter(m => userCanSeeModule(m.id) && ['intel', 'malware-analysis', 'vulnerability', 'ai-analyst', 'honeypot-map', 'digital-forensics'].includes(m.id)).map(module => (
              <SidebarSubItem 
                key={module.id}
                label={t(`modules.${module.id}`)} 
                active={activeTab === module.id} 
                onClick={() => setActiveTab(module.id)}
                collapsed={!isSidebarOpen}
              />
            ))}
            <SidebarSubItem 
              label={t('modules.ueba')} 
              active={activeTab === 'ueba-investigation'} 
              onClick={() => setActiveTab('ueba-investigation')}
              collapsed={!isSidebarOpen}
            />
          </SidebarGroup>

          {/* SOAR & Automation Group */}
          <SidebarGroup 
            icon={<Zap />} 
            label={t('common.orchestration_response')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['soar']}
            onToggle={() => toggleGroup('soar')}
          >
            {userCanSeeModule('soar') && (
              <SidebarSubItem 
                label={t('modules.soar')} 
                active={activeTab === 'soar'} 
                onClick={() => setActiveTab('soar')}
                collapsed={!isSidebarOpen}
              />
            )}
            {MODULES.filter(m => userCanSeeModule(m.id) && ['case-management', 'fim'].includes(m.id)).map(module => (
              <SidebarSubItem 
                key={module.id}
                label={t(`modules.${module.id}`)} 
                active={activeTab === module.id} 
                onClick={() => setActiveTab(module.id)}
                collapsed={!isSidebarOpen}
              />
            ))}
          </SidebarGroup>

          {/* Industrial Security Group */}
          <SidebarGroup 
            icon={<Factory />} 
            label={t('modules.industrial')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['industrial']}
            onToggle={() => toggleGroup('industrial')}
          >
            {MODULES.filter(m => userCanSeeModule(m.id) && m.category === 'INDUSTRIAL').map(module => (
              <SidebarSubItem 
                key={module.id}
                label={t(`modules.${module.id}`)} 
                active={activeTab === module.id} 
                onClick={() => setActiveTab(module.id)}
                collapsed={!isSidebarOpen}
              />
            ))}
          </SidebarGroup>

          {/* Performance & Insights Group */}
          <SidebarGroup 
            icon={<BarChart3 />} 
            label={t('modules.apm')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['performance']}
            onToggle={() => toggleGroup('performance')}
          >
            {MODULES.filter(m => userCanSeeModule(m.id) && ['apm'].includes(m.id)).map(module => (
              <SidebarSubItem 
                key={module.id}
                label={t(`modules.${module.id}`)} 
                active={activeTab === module.id} 
                onClick={() => setActiveTab(module.id)}
                collapsed={!isSidebarOpen}
              />
            ))}
          </SidebarGroup>
          
          <div className="pt-4 pb-2 px-3">
            {isSidebarOpen && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System</span>}
          </div>
          <SidebarItem 
            icon={<CreditCard />} 
            label={t('common.license')} 
            active={activeTab === 'license'} 
            onClick={() => setActiveTab('license')}
            collapsed={!isSidebarOpen}
          />
          
          {/* Settings Group */}
          <SidebarGroup 
            icon={<Settings />} 
            label={t('common.settings')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['settings']}
            onToggle={() => toggleGroup('settings')}
          >
            {canAccessEngineMonitor && (
              <SidebarSubItem 
                label={t('settings.tabs.engine_monitoring') || "引擎監控 (Engine Monitoring)"} 
                active={activeTab === 'settings' && activeSettingsTab === 'engine_monitoring'} 
                onClick={() => { setActiveTab('settings'); setActiveSettingsTab('engine_monitoring'); }}
                collapsed={!isSidebarOpen}
              />
            )}
            <SidebarSubItem 
              label={t('settings.tabs.collection') || "資料採集設定 (Data Collection)"} 
              active={activeTab === 'settings' && activeSettingsTab === 'collection'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('collection'); }}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={isZh ? "NDR 流量告警規則" : "NDR Alert Rules"} 
              active={activeTab === 'settings' && activeSettingsTab === 'ndr_alerts'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('ndr_alerts'); }}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('settings.tabs.update') || "更新管理"} 
              active={activeTab === 'settings' && activeSettingsTab === 'update'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('update'); }}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('settings.tabs.threat_intel') || (isZh ? "威脅情資來源 (STIX/TAXII)" : "Threat Intel Sources")} 
              active={activeTab === 'settings' && activeSettingsTab === 'threat_intel'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('threat_intel'); }}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('settings.tabs.nac') || "網路存取控制 (NAC)"} 
              active={activeTab === 'settings' && activeSettingsTab === 'nac'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('nac'); }}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('settings.tabs.remotelog') || "遠端日誌伺服器"} 
              active={activeTab === 'settings' && activeSettingsTab === 'remotelog'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('remotelog'); }}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('settings.tabs.network')} 
              active={activeTab === 'settings' && activeSettingsTab === 'network'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('network'); }}
              collapsed={!isSidebarOpen}
            />
            <SidebarSubItem 
              label={t('settings.tabs.auth')} 
              active={activeTab === 'settings' && activeSettingsTab === 'auth'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('auth'); }}
              collapsed={!isSidebarOpen}
            />
            {(user.role === 'supervisor' || user.role === 'admin') && (
              <SidebarSubItem 
                label={t('settings.tabs.users')} 
                active={activeTab === 'settings' && activeSettingsTab === 'users'} 
                onClick={() => { setActiveTab('settings'); setActiveSettingsTab('users'); }}
                collapsed={!isSidebarOpen}
              />
            )}
            <SidebarSubItem 
              label={t('settings.tabs.general')} 
              active={activeTab === 'settings' && activeSettingsTab === 'general'} 
              onClick={() => { setActiveTab('settings'); setActiveSettingsTab('general'); }}
              collapsed={!isSidebarOpen}
            />
          </SidebarGroup>

          <div className="pt-4 pb-2 px-3">
            {isSidebarOpen && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Infrastructure</span>}
          </div>

          {/* Core Infrastructure Group (Moved to bottom) */}
          <SidebarGroup 
            icon={<Server />} 
            label={t('common.infrastructure_layer')} 
            collapsed={!isSidebarOpen}
            isExpanded={expandedGroups['core']}
            onToggle={() => toggleGroup('core')}
          >
            {MODULES.filter(m => userCanSeeModule(m.id) && m.category === 'CORE').map(module => (
              <SidebarSubItem 
                key={module.id}
                label={t(`modules.${module.id}`)} 
                active={activeTab === module.id} 
                onClick={() => setActiveTab(module.id)}
                collapsed={!isSidebarOpen}
              />
            ))}
          </SidebarGroup>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-[#111114]/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-gray-300">
              {activeTab === 'dashboard' ? t('common.dashboard') : 
               activeTab === 'critical-incidents' ? t('common.critical_incidents') :
               t(`modules.${activeTab}`, { defaultValue: MODULES.find(m => m.id === activeTab)?.name || 'System' })}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-[10px] font-bold transition-all border border-gray-800 hover:border-gray-700"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-300">
                  {i18n.language === 'en' ? 'ENGLISH' : i18n.language === 'zh' ? 'CHINESE' : 'JAPANESE'}
                </span>
                <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform", isLangOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-40 bg-[#111114] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-1.5 space-y-0.5">
                        {[
                          { code: 'en', label: 'English', native: 'English' },
                          { code: 'zh', label: 'Traditional Chinese', native: 'CHINESE' },
                          { code: 'ja', label: 'Japanese', native: 'JAPANESE' }
                        ].map((lang) => (
                          <button 
                            key={lang.code}
                            onClick={() => {
                              i18n.changeLanguage(lang.code);
                              localStorage.setItem('i18nextLng', lang.code);
                              setIsLangOpen(false);
                            }} 
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors flex items-center justify-between group",
                              i18n.language === lang.code ? "bg-blue-600/10 text-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold">{lang.native}</span>
                              <span className="text-[9px] opacity-50 group-hover:opacity-100">{lang.label}</span>
                            </div>
                            {i18n.language === lang.code && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsUserOpen(!isUserOpen)}
                className="flex items-center gap-3 pl-6 border-l border-gray-800 hover:opacity-80 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium uppercase italic font-black">{user?.username}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user?.role}</p>
                </div>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center border",
                  user?.role === 'supervisor' ? "bg-red-600/10 border-red-500/50 text-red-500" : "bg-blue-600/10 border-blue-500/50 text-blue-400"
                )}>
                  <User className="w-5 h-5" />
                </div>
              </button>

              <AnimatePresence>
                {isUserOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-[#0c0c0e] border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                    >
                      <div className="p-4 border-b border-white/5 mb-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Security Principal</p>
                        <p className="text-sm font-bold text-white uppercase italic">{user?.username}</p>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-widest"
                      >
                        <LogOut size={16} />
                        Terminate Session
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
        active ? "bg-blue-600/10 text-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
      )}
    >
      <div className={cn("transition-transform duration-200", active && "scale-110")}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
      </div>
      {!collapsed && <span className="font-medium text-sm">{label}</span>}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />}
    </button>
  );
}

function SidebarGroup({ icon, label, collapsed, isExpanded, onToggle, children }: { icon: React.ReactNode, label: string, collapsed: boolean, isExpanded: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-400 hover:bg-gray-800 hover:text-gray-200 group"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-500 group-hover:text-gray-300">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
          </div>
          {!collapsed && <span className="font-medium text-sm">{label}</span>}
        </div>
        {!collapsed && (
          <div className="text-gray-600">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </button>
      <AnimatePresence>
        {isExpanded && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-10 space-y-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarSubItem({ label, active, onClick, collapsed }: { label: string, active: boolean, onClick: () => void, collapsed: boolean, key?: string }) {
  if (collapsed) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
        active ? "text-blue-400 font-bold" : "text-gray-500 hover:text-gray-300"
      )}
    >
      <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-blue-500" : "bg-gray-700")} />
      <span>{label}</span>
    </button>
  );
}

function SidebarNestedGroup({ label, active, collapsed, isExpanded, onToggle, children }: { label: string, active: boolean, collapsed: boolean, isExpanded: boolean, onToggle: () => void, children: React.ReactNode }) {
  if (collapsed) return null;
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between py-1.5 rounded-lg transition-all duration-200 text-sm group",
          active ? "text-blue-400 font-bold" : "text-gray-500 hover:text-gray-300"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-blue-500" : "bg-gray-700")} />
          <span>{label}</span>
        </div>
        <div className="text-gray-600 group-hover:text-gray-400">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-6 space-y-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OTSecurityView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [activeTab, setActiveTab] = useState('assets');

  const otStats = [
    { label: isZh ? 'OT 工控資產' : 'OT Assets', value: '1,245', icon: <Factory className="text-blue-400" /> },
    { label: isZh ? 'PLC/HMI 告警' : 'PLC/HMI Alerts', value: '12', icon: <ShieldAlert className="text-red-400" /> },
    { label: isZh ? '活動中通訊協定' : 'Active Protocols', value: '12', icon: <Activity className="text-green-400" /> },
    { label: isZh ? '存在漏洞感測器' : 'Vulnerable Sensors', value: '3', icon: <Target className="text-orange-400" /> },
  ];

  const industrialAssets = [
    { id: 'PLC-01', name: 'Siemens S7-1500', type: 'PLC', ip: '192.168.50.10', protocol: 'S7Comm', status: isZh ? '在線' : 'Online' },
    { id: 'HMI-01', name: 'Schneider Magelis', type: 'HMI', ip: '192.168.50.20', protocol: 'Modbus TCP', status: isZh ? '在線' : 'Online' },
    { id: 'SCADA-01', name: 'Ignition SCADA', type: 'Server', ip: '192.168.50.5', protocol: 'OPC UA', status: isZh ? '在線' : 'Online' },
    { id: 'SENSOR-01', name: 'Honeywell Pressure', type: 'Sensor', ip: '192.168.50.30', protocol: 'DNP3', status: isZh ? '在線' : 'Online' },
    { id: 'PLC-02', name: 'Rockwell ControlLogix', type: 'PLC', ip: '192.168.50.11', protocol: 'EtherNet/IP', status: isZh ? '離線' : 'Offline' },
  ];

  const correlationEvents = [
    { 
      id: 1, 
      time: '2026-04-02 09:30:15', 
      source: 'AD-ADMIN-01 (IT)', 
      target: 'PLC-01 (OT)', 
      action: 'Write Single Coil (0x05)', 
      risk: isZh ? '嚴重' : 'Critical', 
      description: isZh ? '未授權之 Modbus 寫入指令來自 IT 管理員帳號至生產線 PLC。疑似從 IT 橫向移動至 OT。' : 'Unauthorized Modbus write command from IT admin account to production PLC. Potential lateral movement from IT to OT.' 
    },
    { 
      id: 2, 
      time: '2026-04-02 09:25:40', 
      source: 'Jumpbox-01 (IT)', 
      target: 'HMI-01 (OT)', 
      action: 'S7Comm Read (0x04)', 
      risk: isZh ? '中風險' : 'Medium', 
      description: isZh ? '來自堡壘機至 HMI 的異常讀取流量，疑似偵察活動。' : 'Unusual read volume from jumpbox to HMI. Possible reconnaissance activity.' 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600/20 p-2 rounded-lg border border-orange-500/30">
            <Factory className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{isZh ? 'SEMOR 工業控制安全 (OT/IoT)' : 'SEMOR Industrial (OT/IoT)'}</h2>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <Radio className="w-3 h-3 text-green-400 animate-pulse" /> 
              {isZh ? '經由 SPAN/Mirror 鏡像埠進行非侵入式監控 (Worker-01)' : 'Non-Intrusive Monitoring via SPAN/Mirror Port (Worker-01)'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> {isZh ? '下載 PCAP 封包 (Arkime)' : 'Download PCAP (Arkime)'}
          </button>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-blue-600/5 border border-blue-500/20 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg"><HardDrive className="w-5 h-5 text-blue-400" /></div>
          <div>
            <h4 className="text-xs font-bold text-blue-400 uppercase mb-1">{isZh ? 'Arkime 側錄引擎' : 'Arkime Engine'}</h4>
            <p className="text-[11px] text-gray-400">{isZh ? '全封包側錄 (FPC)，記錄所有工控流量以供深度鑑識。' : 'Full Packet Capture (FPC) recording all industrial traffic for deep forensic analysis.'}</p>
          </div>
        </div>
        <div className="bg-green-600/5 border border-green-500/20 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-green-500/10 rounded-lg"><Cpu className="w-5 h-5 text-green-400" /></div>
          <div>
            <h4 className="text-xs font-bold text-green-400 uppercase mb-1">{isZh ? 'Zeek 工控分析框架' : 'Zeek ICS Framework'}</h4>
            <p className="text-[11px] text-gray-400">{isZh ? '對 Modbus、S7Comm、DNP3 及三菱 MELSEC 進行深度封包檢查 (DPI)。' : 'Deep Packet Inspection (DPI) for Modbus, S7Comm, DNP3, and Mitsubishi MELSEC.'}</p>
          </div>
        </div>
        <div className="bg-purple-600/5 border border-purple-500/20 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg"><ShieldAlert className="w-5 h-5 text-purple-400" /></div>
          <div>
            <h4 className="text-xs font-bold text-purple-400 uppercase mb-1">{isZh ? 'Suricata 工控檢測規則' : 'Suricata ICS Rules'}</h4>
            <p className="text-[11px] text-gray-400">{isZh ? '針對已知工控漏洞利用與未授權功能碼的特徵偵測。' : 'Signature-based detection for known ICS exploits and unauthorized function codes.'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {otStats.map((stat, idx) => (
          <div key={idx} className="bg-[#111114] border border-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-900 rounded-xl">{stat.icon}</div>
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isZh ? '資產清單 (自動發現)' : 'Asset Inventory (Auto-Discovery)'}</h3>
            <div className="flex gap-2">
              {['PLC', 'HMI', 'Server', 'Sensor'].map(type => (
                <span key={type} className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-400">{type}</span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50">
                <tr className="text-gray-500 uppercase text-[10px] tracking-widest">
                  <th className="p-4">{isZh ? '資產 ID' : 'Asset ID'}</th>
                  <th className="p-4">{isZh ? '名稱' : 'Name'}</th>
                  <th className="p-4">{isZh ? 'IP 位址' : 'IP Address'}</th>
                  <th className="p-4">{isZh ? '通訊協定' : 'Protocol'}</th>
                  <th className="p-4">{isZh ? '狀態' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {industrialAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-500">{asset.id}</td>
                    <td className="p-4 font-medium text-blue-400">{asset.name}</td>
                    <td className="p-4 text-gray-400">{asset.ip}</td>
                    <td className="p-4 text-gray-400">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] border border-blue-500/20">
                        {asset.protocol}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold uppercase",
                        asset.status === 'Online' || asset.status === '在線' ? "text-green-400" : "text-red-400"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", asset.status === 'Online' || asset.status === '在線' ? "bg-green-400" : "bg-red-400")} />
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#111114] border border-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{isZh ? '工控通訊協定佔比' : 'Industrial Protocol Mix'}</h3>
          <div className="space-y-6">
            {[
              { name: 'Modbus TCP', value: 45, color: '#f59e0b' },
              { name: 'S7Comm', value: 30, color: '#3b82f6' },
              { name: 'EtherNet/IP', value: 15, color: '#ef4444' },
              { name: 'MELSEC', value: 10, color: '#8b5cf6' },
            ].map(protocol => (
              <div key={protocol.name} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{protocol.name}</span>
                  <span className="text-white font-bold">{protocol.value}%</span>
                </div>
                <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${protocol.value}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: protocol.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-blue-600/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-400 uppercase">{isZh ? 'AI 工控安全分析師' : 'AI OT Analyst'}</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {isZh ? '偵測到來自 IT 區段 IP 的「Write Single Coil」(0x05) 指令。這與此 PLC 的基準線不符。正與 AD 日誌關聯中...' : 'Detected "Write Single Coil" (0x05) from an IT-segment IP. This is atypical for this PLC\'s baseline. Correlating with AD logs...'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#111114] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isZh ? 'IT 至 OT 跨區攻擊鏈關聯' : 'IT-to-OT Attack Chain Correlation'}</h3>
          </div>
          <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 font-bold">
            {isZh ? '偵測到橫向移動攻擊' : 'LATERAL MOVEMENT DETECTED'}
          </span>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {correlationEvents.map(event => (
              <div key={event.id} className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "px-3 py-1 rounded text-[10px] font-bold uppercase",
                      event.risk === 'Critical' || event.risk === '嚴重' ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                    )}>
                      {event.risk}
                    </div>
                    <span className="text-xs text-gray-500">{event.time}</span>
                  </div>
                  <button className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {isZh ? '檢視 Arkime PCAP 封包' : 'View Arkime PCAP'} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex flex-col items-center">
                        <span title="IT Account"><User className="w-4 h-4 text-gray-400" /></span>
                        <div className="w-px h-4 bg-gray-800 my-1" />
                        <span title="Jumpbox"><HardDrive className="w-4 h-4 text-blue-400" /></span>
                        <div className="w-px h-4 bg-gray-800 my-1" />
                        <span title="PLC"><Factory className="w-4 h-4 text-orange-400" /></span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{event.source} → {event.target}</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{event.description}</p>
                        <div className="mt-3 flex gap-2">
                          <span className="text-[9px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">AD Event ID: 4624</span>
                          <span className="text-[9px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">Modbus FC: 0x05</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-800 text-center min-w-[100px]">
                      <p className="text-[10px] text-gray-500 uppercase">Action</p>
                      <p className="text-xs font-bold text-white">{event.action}</p>
                    </div>
                    <div className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-800 text-center min-w-[100px]">
                      <p className="text-[10px] text-gray-500 uppercase">Engine</p>
                      <p className="text-xs font-bold text-blue-400">Zeek-OT / Arkime</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfrastructureGatewayView() {
  return <PlatformPerformanceView />;
}

function MalwareDetectionView() {
  const [activeTab, setActiveTab] = useState('events');

  const stats = [
    { label: 'Total Events', value: '1,245', change: '+12%', icon: <ShieldAlert className="text-red-400" /> },
    { label: 'Malware Detected', value: '12', change: '-5%', icon: <Bug className="text-orange-400" /> },
    { label: 'FIM Alerts', value: '84', change: '+2%', icon: <HardDrive className="text-blue-400" /> },
    { label: 'Rootkits Found', value: '0', change: '0%', icon: <Target className="text-green-400" /> },
  ];

  const malwareEvents = [
    { id: 1, time: '2026-04-02 09:15:22', agent: 'workstation-01', type: 'Malware', description: 'Trojan.Generic detected in /tmp/installer.sh', severity: 'Critical' },
    { id: 2, time: '2026-04-02 09:12:45', agent: 'server-db-01', type: 'FIM', description: 'File /etc/shadow modified by unknown process', severity: 'High' },
    { id: 3, time: '2026-04-02 09:10:12', agent: 'workstation-05', type: 'Policy', description: 'Unauthorized USB device connected', severity: 'Medium' },
    { id: 4, time: '2026-04-02 09:08:30', agent: 'laptop-ceo', type: 'Malware', description: 'Suspicious PowerShell execution detected', severity: 'High' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Malware Detection & FIM</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Last 24 Hours</button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-[#111114] border border-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gray-900 rounded-lg">{stat.icon}</div>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded",
                stat.change.startsWith('+') ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              )}>{stat.change}</span>
            </div>
            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-800">
          {['events', 'inventory', 'policy'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2",
                activeTab === tab ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 uppercase text-[10px] tracking-widest">
                <th className="pb-4">Time</th>
                <th className="pb-4">Agent</th>
                <th className="pb-4">Type</th>
                <th className="pb-4">Description</th>
                <th className="pb-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {malwareEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="py-4 text-gray-400">{event.time}</td>
                  <td className="py-4 font-medium text-blue-400">{event.agent}</td>
                  <td className="py-4 text-gray-300">{event.type}</td>
                  <td className="py-4 text-gray-400 group-hover:text-gray-200">{event.description}</td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      event.severity === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      event.severity === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                      "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    )}>
                      {event.severity}
                    </span>
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

function AgentSummaryView() {
  const agentStats = [
    { label: 'Total Agents', value: '142', icon: <Monitor className="text-blue-400" /> },
    { label: 'Active', value: '128', icon: <Activity className="text-green-400" /> },
    { label: 'Disconnected', value: '14', icon: <Wifi className="text-red-400" /> },
    { label: 'Never Connected', value: '0', icon: <Shield className="text-gray-400" /> },
  ];

  const osDistribution = [
    { name: 'Windows', value: 85, color: '#3b82f6' },
    { name: 'Linux', value: 45, color: '#10b981' },
    { name: 'macOS', value: 12, color: '#f59e0b' },
  ];

  const agents = [
    { id: '001', name: 'server-prod-01', ip: '10.0.0.1', os: 'Ubuntu 22.04', status: 'Active', version: '4.7.2' },
    { id: '002', name: 'workstation-05', ip: '192.168.1.15', os: 'Windows 11', status: 'Active', version: '4.7.2' },
    { id: '003', name: 'laptop-dev-02', ip: '192.168.1.22', os: 'macOS 14.2', status: 'Disconnected', version: '4.7.1' },
    { id: '004', name: 'server-db-01', ip: '10.0.0.5', os: 'CentOS 7', status: 'Active', version: '4.7.2' },
    { id: '005', name: 'workstation-12', ip: '192.168.1.30', os: 'Windows 10', status: 'Active', version: '4.7.2' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Agent Summary</h2>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Deploy New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agentStats.map((stat, idx) => (
          <div key={idx} className="bg-[#111114] border border-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-900 rounded-xl">{stat.icon}</div>
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-[#111114] border border-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">OS Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={osDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {osDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {osDistribution.map(os => (
              <div key={os.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: os.color }} />
                  <span className="text-gray-400">{os.name}</span>
                </div>
                <span className="text-white font-bold">{os.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Agents</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search agents..." 
                className="bg-gray-900 border border-gray-700 rounded-lg py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50">
                <tr className="text-gray-500 uppercase text-[10px] tracking-widest">
                  <th className="p-4">ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">OS</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-500">{agent.id}</td>
                    <td className="p-4 font-medium text-blue-400">{agent.name}</td>
                    <td className="p-4 text-gray-400">{agent.ip}</td>
                    <td className="p-4 text-gray-400">{agent.os}</td>
                    <td className="p-4 text-gray-500">{agent.version}</td>
                    <td className="p-4">
                      <span className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold uppercase",
                        agent.status === 'Active' ? "text-green-400" : "text-red-400"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", agent.status === 'Active' ? "bg-green-400" : "bg-red-400")} />
                        {agent.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-900/50 border-t border-gray-800 text-center">
            <button className="text-xs text-blue-400 hover:underline">View All Agents</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoveryViewOld() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('Last 15 minutes');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedFields, setSelectedFields] = useState(['@timestamp', 'source', 'event', 'severity']);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filters, setFilters] = useState<{ field: string, value: string, type: 'include' | 'exclude' }[]>([
    { field: 'severity', value: 'High', type: 'include' }
  ]);

  const addFilter = (field: string, value: string, type: 'include' | 'exclude' = 'include') => {
    if (!filters.find(f => f.field === field && f.value === value && f.type === type)) {
      setFilters([...filters, { field, value, type }]);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Mock data for histogram
  const histogramData = Array.from({ length: 20 }, (_, i) => ({
    time: `${9}:${String(i).padStart(2, '0')}`,
    count: Math.floor(Math.random() * 50) + 10
  }));

  const events = [
    { id: 1, '@timestamp': '2026-04-02T09:07:01Z', source: 'SEMOR Flow', event: 'Suspicious outbound connection', severity: 'High', src_ip: '192.168.1.10', dst_ip: '8.8.8.8', action: 'Blocked', user: 'system', full_log: 'Apr  2 09:07:01 semor-sensor-01 kernel: [SEMOR-FILTER] OUTBOUND-DROP SRC=192.168.1.10 DST=8.8.8.8 PROTO=TCP SPT=44332 DPT=443' },
    { id: 2, '@timestamp': '2026-04-02T09:06:45Z', source: 'SEMOR Endpoint', event: 'Unauthorized file access', severity: 'Medium', user: 'jdoe', file: '/etc/passwd', action: 'Alerted', host: 'workstation-01', full_log: '{"timestamp":"2026-04-02T09:06:45Z","event_type":"file_integrity","host":"workstation-01","user":"jdoe","path":"/etc/passwd","action":"read","result":"denied"}' },
    { id: 3, '@timestamp': '2026-04-02T09:06:12Z', source: 'SEMOR Master', event: 'Admin login success', severity: 'Low', user: 'admin', ip: '10.0.0.5', action: 'Logged', location: 'Office-HQ', full_log: '2026-04-02 09:06:12 [AUTH] Admin user successfully logged in from 10.0.0.5 (Office-HQ) via Web UI' },
    { id: 4, '@timestamp': '2026-04-02T09:05:30Z', source: 'SEMOR Deception', event: 'Honeypot interaction detected', severity: 'Critical', src_ip: '45.33.22.11', service: 'SSH', action: 'Trapped', country: 'RU', full_log: 'INBOUND CONNECTION ATTEMPT: SRC=45.33.22.11 DST=HONEPOT-01 SERVICE=SSH(22) PAYLOAD="\\x05\\x01\\x00" RESULT=REDIRECTED' },
    { id: 5, '@timestamp': '2026-04-02T09:04:55Z', source: 'SEMOR Flow', event: 'Port scan detected', severity: 'Medium', src_ip: '172.16.0.55', ports: '1-1024', action: 'Rate-limited', full_log: 'TRAFFIC ALERT: Massive SYNC scan from 172.16.0.55 targeting common ports 1-1024. Rate limiting applied by SEMOR-IPS.' },
  ];

  const [customFields] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('discovery_custom_fields') : null;
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const allFields = ['@timestamp', 'source', 'event', 'severity', 'user', 'src_ip', 'dst_ip', 'action', 'file', 'host', 'ip', 'location', 'service', 'country', 'ports', 'full_log', ...customFields];

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 bg-[#111114] border border-gray-800 rounded-xl p-4 shadow-2xl">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search events (e.g. severity: High AND source: Flow)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors min-w-[160px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 font-medium">{timeRange}</span>
              </div>
              <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform", isTimeDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isTimeDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsTimeDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-[#16161a] border border-gray-800 rounded-xl shadow-2xl z-50 p-2 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {[
                        'Last 15 minutes', 'Last 30 minutes', 'Last 1 hour', 
                        'Last 1 day', 'Last 7 days', 'This week', 
                        'Last 60 days', 'Last 90 days', 'Last 1 year'
                      ].map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setTimeRange(range);
                            setIsTimeDropdownOpen(false);
                          }}
                          className={cn(
                            "text-left px-3 py-2 text-[11px] font-bold rounded-lg transition-colors",
                            timeRange === range ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-800 pt-3 pb-1 px-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={12} className="text-gray-600" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Custom Range</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black text-gray-600 uppercase">Start Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black text-gray-600 uppercase">End Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                          />
                        </div>
                        <button 
                          disabled={!customStart || !customEnd}
                          onClick={() => {
                            setTimeRange(`${customStart} to ${customEnd}`);
                            setIsTimeDropdownOpen(false);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Apply Custom Range
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
            Update
          </button>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 min-h-[32px]">
          <div className="flex items-center gap-2 text-xs text-gray-500 mr-2">
            <Filter className="w-3 h-3" />
            <span className="font-bold uppercase tracking-wider">Filters:</span>
          </div>
          
          <AnimatePresence>
            {filters.map((filter, idx) => (
              <motion.div 
                key={`${filter.field}-${filter.value}-${idx}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-medium transition-colors",
                  filter.type === 'include' 
                    ? "bg-blue-600/10 text-blue-400 border-blue-600/30" 
                    : "bg-red-600/10 text-red-400 border-red-600/30"
                )}
              >
                <span className="opacity-60">{filter.field}:</span>
                <span>{filter.value}</span>
                <button 
                  onClick={() => removeFilter(idx)}
                  className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filters.length > 0 && (
            <button 
              onClick={() => setFilters([])}
              className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors ml-2 underline underline-offset-2"
            >
              Clear all
            </button>
          )}
          
          <button className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 ml-auto">
            <Plus className="w-3 h-3" /> Add filter
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar: Fields */}
        <div className="w-64 flex flex-col gap-4 bg-[#111114] border border-gray-800 rounded-xl p-4 overflow-y-auto custom-scrollbar shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Available Fields</h3>
            <div className="flex gap-2">
              <Search className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-400" />
              <Settings className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-8 mt-2">
            <div>
              <p className="text-xs text-gray-600 font-black mb-4 uppercase tracking-widest">Selected Fields</p>
              <div className="space-y-1.5">
                {selectedFields.map(field => (
                  <div key={field} className="flex items-center justify-between group px-3 py-2 hover:bg-gray-800/50 rounded-lg text-sm cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-blue-400 font-bold">{field}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFields(selectedFields.filter(f => f !== field));
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-700 rounded transition-all"
                    >
                      <Minus className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-600 font-black mb-4 uppercase tracking-widest">Available Fields</p>
              <div className="space-y-1.5">
                {allFields.filter(f => !selectedFields.includes(f)).map(field => (
                  <div key={field} className="flex items-center justify-between group px-3 py-2 hover:bg-gray-800/50 rounded-lg text-sm cursor-pointer transition-colors">
                    <span className="text-gray-400 group-hover:text-gray-200 font-medium">{field}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFields([...selectedFields, field]);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-700 rounded transition-all"
                    >
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Histogram & Table */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Histogram */}
          <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 h-56 shadow-xl relative group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">1,245</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">Total Hits</span>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] font-bold text-gray-400 transition-all">
                  <Download className="w-3 h-3" /> Export
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] font-bold text-gray-400 transition-all">
                  <Share2 className="w-3 h-3" /> Share
                </button>
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#4b5563" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    radius={[2, 2, 0, 0]} 
                    className="hover:fill-blue-400 transition-colors"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 bg-[#111114] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-10 border-b border-gray-800"></th>
                    {selectedFields.map(field => (
                      <th key={field} className="p-4 font-black text-gray-500 uppercase text-xs tracking-widest border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          {field}
                          <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {events.map((event, idx) => (
                    <React.Fragment key={event.id}>
                      <tr 
                        className={cn(
                          "hover:bg-blue-600/5 transition-all cursor-pointer group",
                          expandedRow === idx && "bg-blue-600/10"
                        )} 
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                      >
                        <td className="p-4 text-center">
                          <div className={cn(
                            "transition-transform duration-200",
                            expandedRow === idx ? "rotate-90" : ""
                          )}>
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400" />
                          </div>
                        </td>
                        {selectedFields.map(field => (
                          <td key={field} className="p-4">
                            {field === 'severity' ? (
                              <span className={cn(
                                "px-3 py-1 rounded text-xs font-black uppercase tracking-wider",
                                event.severity === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                event.severity === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                event.severity === 'Medium' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                                "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              )}>
                                {event.severity}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors truncate block max-w-[200px] font-medium">
                                {event[field as keyof typeof event] || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <AnimatePresence>
                        {expandedRow === idx && (
                          <tr>
                            <td colSpan={selectedFields.length + 1} className="p-0 border-b border-gray-800">
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-gray-900/40"
                              >
                                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                  <div className="lg:col-span-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Document Details</p>
                                      <div className="flex gap-2">
                                        <button className="text-[10px] text-blue-400 hover:underline">Table View</button>
                                        <span className="text-gray-700">|</span>
                                        <button className="text-[10px] text-gray-500 hover:underline">JSON View</button>
                                      </div>
                                    </div>
                                    <div className="bg-black/60 rounded-xl border border-gray-800 p-6 font-mono text-[13px] leading-relaxed shadow-inner overflow-hidden flex flex-col gap-6">
                                      <div className="space-y-2">
                                        {Object.entries(event).filter(([k]) => k !== 'full_log').map(([key, value]) => (
                                          <div key={key} className="flex group/field items-start">
                                            <div className="w-40 shrink-0 flex items-center gap-2">
                                              <div className="flex opacity-0 group-hover/field:opacity-100 transition-opacity">
                                                <button 
                                                  onClick={() => addFilter(key, String(value), 'include')}
                                                  title="Filter for value"
                                                  className="p-0.5 hover:bg-blue-600/20 rounded text-blue-400"
                                                >
                                                  <Plus size={10} />
                                                </button>
                                                <button 
                                                  onClick={() => addFilter(key, String(value), 'exclude')}
                                                  title="Filter out value"
                                                  className="p-0.5 hover:bg-red-600/20 rounded text-red-400"
                                                >
                                                  <Minus size={10} />
                                                </button>
                                              </div>
                                              <span className="text-blue-500/80 font-bold">{key}</span>
                                            </div>
                                            <span className="text-gray-400 break-all">: {JSON.stringify(value)}</span>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Full Log Section */}
                                      {event.full_log && (
                                        <div className="pt-4 border-t border-gray-800">
                                          <div className="flex items-center gap-2 mb-3">
                                            <Terminal size={14} className="text-green-400" />
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">full_log</span>
                                          </div>
                                          <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-800/50 text-gray-300 whitespace-pre-wrap break-all leading-normal text-sm">
                                            {event.full_log}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-6">
                                    <div className="space-y-4">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contextual Actions</p>
                                      <div className="grid grid-cols-1 gap-2">
                                        <button className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-3 group">
                                          <Shield className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" /> 
                                          <span>Create Alert Rule</span>
                                        </button>
                                        <button className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-3 group">
                                          <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" /> 
                                          <span>Trigger Playbook</span>
                                        </button>
                                        <button className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-3 group">
                                          <Terminal className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" /> 
                                          <span>Remote Forensic</span>
                                        </button>
                                        <button className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-3 group">
                                          <Globe className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" /> 
                                          <span>Whois Lookup</span>
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="p-4 bg-blue-600/5 border border-blue-600/20 rounded-xl space-y-2">
                                      <div className="flex items-center gap-2 text-blue-400">
                                        <Brain size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">AI Insight</span>
                                      </div>
                                      <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                        "This event matches patterns of a known lateral movement technique. Recommended action: Isolate host workstation-01 and verify user jdoe's recent activity."
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Showing 1 - 5 of 1,245 events</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-gray-600">Page Size:</span>
                  <select className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-[10px] outline-none">
                    <option>5</option>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                  Previous
                </button>
                <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: File Integrity Monitoring (FIM) & SOAR Automation has been refactored into ./components/soar/fim/SOARFIMView.tsx
function FIMView() {
  return <SOARFIMView />;
}


// Note: VulnerabilityView and VANS compliance components have been refactored into ./components/vulnerability/VulnerabilityView.tsx

function TopologyMap({ hosts, onNodeSelect, selectedId }: { hosts: any[], onNodeSelect: (id: string) => void, selectedId: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || hosts.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous SVG
    d3.select(containerRef.current).selectAll("svg").remove();

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Graph setup
    const nodes = [
      { id: 'Scanner', type: 'scanner', label: 'SEMOR Probe' },
      { id: 'Switch', type: 'switch', label: 'Core Switch' },
      ...hosts.map(h => ({ id: h.ip, type: h.hasReport ? 'target' : 'host', label: h.hostname || h.ip }))
    ];

    const links = [
      { source: 'Scanner', target: 'Switch' },
      ...hosts.map(h => ({ source: 'Switch', target: h.ip }))
    ];

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(220))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d: any) => {
        if (d.type !== 'scanner' && d.type !== 'switch') {
          onNodeSelect(d.id);
        }
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", (d: any) => d.type === 'scanner' ? 18 : d.type === 'switch' ? 14 : 12)
      .attr("fill", (d: any) => {
        if (d.id === selectedId) return "#fff";
        return d.type === 'scanner' ? "#3b82f6" : d.type === 'switch' ? "#6366f1" : d.type === 'target' ? "#ef4444" : "#10b981";
      })
      .attr("stroke", (d: any) => d.id === selectedId ? "#3b82f6" : "#000")
      .attr("stroke-width", (d: any) => d.id === selectedId ? 4 : 2)
      .style("filter", (d: any) => d.type === 'scanner' || d.id === selectedId ? "drop-shadow(0 0 12px rgba(59,130,246,0.6))" : "none");

    node.append("text")
      .attr("dx", 28)
      .attr("dy", 4)
      .text((d: any) => d.label)
      .attr("font-size", "13px")
      .attr("fill", (d: any) => d.id === selectedId ? "#fff" : d.type === 'scanner' ? "#3b82f6" : "#94a3b8")
      .attr("font-weight", (d: any) => d.id === selectedId ? "black" : "bold")
      .style("user-select", "none")
      .attr("font-family", "JetBrains Mono, monospace");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as any).x)
        .attr("y1", (d: any) => (d.source as any).y)
        .attr("x2", (d: any) => (d.target as any).x)
        .attr("y2", (d: any) => (d.target as any).y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [hosts, selectedId]);

  return (
    <div className="relative w-full h-full bg-[#050505] rounded-2xl border border-gray-800 overflow-hidden shadow-inner flex flex-col">
       <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-black/40 p-4 rounded-xl border border-gray-800/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">掃描器實例 (Scanner)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">網路節點 (GCB 基準)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">活躍主機 (Active Host)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">致命威脅 (Critical Threat)</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 cursor-grab active:cursor-grabbing" />
    </div>
  );
}

function DiscoveryFindingsSummary({ hosts }: { hosts: any[] }) {
  const criticalHost = hosts.find(h => h.hasReport);
  if (!criticalHost) return null;

  const maxVulns = Math.max(...hosts.map(h => h.vulnerabilities));
  const rating = maxVulns >= 10 ? '致命高風險 (Critical)' : maxVulns >= 5 ? '中度風險 (Medium)' : '低風險 (Low)';
  const ratingColor = maxVulns >= 10 ? 'text-red-500' : maxVulns >= 5 ? 'text-orange-500' : 'text-green-500';
  const ratingBg = maxVulns >= 10 ? 'bg-red-600' : maxVulns >= 5 ? 'bg-orange-600' : 'bg-green-600';
  const ratingLightBg = maxVulns >= 10 ? 'bg-red-500/10' : maxVulns >= 5 ? 'bg-orange-500/10' : 'bg-green-500/10';
  const ratingBorder = maxVulns >= 10 ? 'border-red-500/20' : maxVulns >= 5 ? 'border-orange-500/20' : 'border-green-500/20';

  return (
    <div className="space-y-12 py-10 border-t border-gray-800 mt-10">
      <div className="flex items-center gap-4 border-l-4 border-blue-600 pl-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">SEMOR 自動化掃描發現分析報告 (Scan Findings Breakdown)</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">針對目標網段 {criticalHost.ip.split('.').slice(0, 3).join('.')}.0/24 之綜合弱點評估結果</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Section I: Risk Assessment */}
        <div className="bg-[#111114] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-6 mb-8">
            <div className="text-3xl font-black text-white px-6 py-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">一</div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">資安風險綜合評估 (Risk Assessment)</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className={cn(
              "lg:col-span-1 border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-inner",
              ratingLightBg, ratingBorder
            )}>
               <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-6",
                  ratingBg
                )}
              >
                <Skull className="text-white w-12 h-12" />
              </motion.div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">整體風險評等</span>
              <div className={cn("text-3xl font-black italic uppercase", ratingColor)}>
                {maxVulns >= 10 ? '🔴 ' : maxVulns >= 5 ? '🟠 ' : '🟢 '}
                {rating}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 leading-tight font-bold uppercase tracking-widest italic">
                {maxVulns >= 10 ? '偵測到致命資安防護警訊' : maxVulns >= 5 ? '偵測到升高的威脅態勢' : '建議維持日常資安維護'}
              </p>
            </div>

            <div className="lg:col-span-3 space-y-6">
               <div className="bg-zinc-900 border border-gray-800 p-8 rounded-3xl relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <CheckCircle2 size={120} />
                </div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <span className="p-1.5 bg-blue-600/20 rounded-lg"><CheckCircle2 size={16} className="text-blue-400" /></span>
                  核心結論與診斷摘要 (Executive Summary)
                </h4>
                <div className="text-base text-gray-300 font-medium leading-relaxed space-y-4">
                  <p>
                    於網段 <span className="text-blue-400 font-mono">10.120.100.0/24</span> 執行的探測作業中，發現主機 <span className="text-white font-bold">{criticalHost.hostname} ({criticalHost.ip})</span> 存在關鍵弱點叢集。
                    開放多達 <span className="text-red-500 font-black">14 個服務埠</span> 形成了巨大的攻擊面，嚴重偏離政府資安基準 (GCB) 與企業資安規範。
                  </p>
                  <div className={cn(
                    "p-5 rounded-2xl flex items-center gap-4 shadow-xl",
                    ratingBg
                  )}>
                    <ShieldX size={28} className="text-white animate-bounce" />
                    <p className="text-sm font-black text-white uppercase tracking-wider">
                      {maxVulns >= 10 ? '緊急告警：目標主機必須立即自生產網段實施實體隔離。' :
                       maxVulns >= 5 ? '警告：請於 48 小時內完成弱點修補以防遭受利用。' :
                       '提示：建議執行例行性軟體修補與系統組態加固。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section II: Detection Explanation */}
        <div className="bg-[#111114] border border-gray-800 rounded-3xl p-8 shadow-xl">
           <div className="flex items-center gap-6 mb-8">
            <div className="text-3xl font-black text-white px-6 py-3 bg-blue-600 rounded-2xl">二</div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">偵測發現說明 (Detection Explanation)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-blue-400" />
                <span className="text-[11px] font-black text-gray-200 uppercase tracking-widest">A. 核心資料庫直連曝光 (3306)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">"MySQL 資料庫直接對網路開放且無白名單管控。探測期間已成功擷取出 Salt 驗證特徵。"</p>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-gray-300 font-bold uppercase"><span className="text-red-500">修復方案:</span> 限制只能綁定 localhost 或 VPC 內部特定 IP 網段。於 DB 層級啟用多因素驗證。</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-blue-400" />
                <span className="text-[11px] font-black text-gray-200 uppercase tracking-widest">B. Web 服務組態安全性缺失 (8088)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">"於 Nginx/Kestrel 端點探測到不安全的 TRACE 方法以及 Allow-Origin: * 全開放跨域策略。"</p>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-gray-300 font-bold uppercase"><span className="text-red-500">修復方案:</span> 於 nginx.conf 停用 TRACE 方法。將 CORS Allow-Origin 嚴格限制為指定內部網域。</p>
              </div>
            </div>

             <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Network size={20} className="text-blue-400" />
                <span className="text-[11px] font-black text-gray-200 uppercase tracking-widest">C. 協定簽章缺失防護瑕疵 (445)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">"SMB 簽章已設定為啟用但非強制。違反 GCB 政府資安基準，易遭受身分驗證中繼轉發攻擊。"</p>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-gray-300 font-bold uppercase"><span className="text-red-500">修復方案:</span> 透過 Active Directory GPO 於全數內網網段強制執行「需要訊息簽署」。</p>
              </div>
            </div>

            <div className="md:col-span-3 bg-zinc-900 border border-gray-800 p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-green-400" />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">整體處置與應變策略 (Remediation Strategy)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    即時緊急處置 (T+0h)
                  </h5>
                  <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                    <li>將 {criticalHost.ip} 從核心交換器網段斷開實施隔離。</li>
                    <li>撤銷掃描期間暴露的 MySQL 暫時性存取憑證。</li>
                    <li>發動事件應變程序 (Incident Response) 第一階段應對。</li>
                  </ul>
                </div>
                 <div className="space-y-4">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    中長期系統加固 (未來 48 小時內)
                  </h5>
                  <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                    <li>重新配置 Nginx 拒絕不合規之 HTTP 請求方法。</li>
                    <li>於該網段全面更新並推送 GCB 資安基準套件。</li>
                    <li>針對 {criticalHost.hostname} 排定人工深度滲透測試。</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDiscoveryView() {
  const [target, setTarget] = useState('10.120.100.0/24');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'System ready. Prior discovery database loaded.',
    'Discovered 5 reactive hosts in subnet 10.120.100.0/24.',
    'Analysis complete. Critical CVEs and vulnerability details identified.'
  ]);
  const [progress, setProgress] = useState(100);
  const [results, setResults] = useState<{ip: string, hostname: string, os: string, status: string, services: string, vulnerabilities: number, hasReport?: boolean, mac?: string, lastSeen?: string, uptime?: string, portCount?: number, actor?: string, timestamp: number}[]>([
    { 
      ip: '10.120.100.100', 
      hostname: 'WIN-23LQ', 
      os: 'Windows Server 2022', 
      status: 'Up', 
      services: '3306, 445, 3389, 5985, 8088, 7001 + 8 more', 
      vulnerabilities: 14, 
      hasReport: true,
      mac: '00:15:5D:8A:2B:CC',
      lastSeen: '剛剛 (Just now)',
      uptime: '24d 12h 45m',
      actor: 'Lazarus Group',
      portCount: 14,
      timestamp: Date.now() - 60000
    },
    { 
      ip: '10.0.0.1', 
      hostname: 'gateway.internal', 
      os: 'MikroTik RouterOS', 
      status: 'Up', 
      services: '80, 443, 22', 
      vulnerabilities: 0,
      mac: 'E4:8D:8C:F2:1A:01',
      lastSeen: '2 分鐘前',
      uptime: '365d 04h 12m',
      actor: 'None',
      portCount: 3,
      timestamp: Date.now() - 120000
    },
    { 
      ip: '10.0.0.12', 
      hostname: 'db-prod-cluster', 
      os: 'Ubuntu 20.04 LTS', 
      status: 'Up', 
      services: '5432, 22', 
      vulnerabilities: 5,
      mac: '00:50:56:B3:94:DD',
      lastSeen: '5 分鐘前',
      uptime: '12d 18h 30m',
      actor: 'Sandworm',
      portCount: 2,
      timestamp: Date.now() - 300000
    },
    { 
      ip: '10.0.0.45', 
      hostname: 'nas-storage-01', 
      os: 'Synology DSM 7.x', 
      status: 'Up', 
      services: '445, 139, 2049', 
      vulnerabilities: 8,
      mac: '00:11:32:8E:45:90',
      lastSeen: '12 分鐘前',
      uptime: '89d 02h 15m',
      actor: 'APT28',
      portCount: 3,
      timestamp: Date.now() - 720000
    },
    { 
      ip: '10.0.0.100', 
      hostname: 'workstation-dev-01', 
      os: 'Windows 11 Pro', 
      status: 'Down', 
      services: '', 
      vulnerabilities: 0,
      mac: 'D8:BB:C1:2F:90:BB',
      lastSeen: '離線 (Offline)',
      uptime: '0m',
      actor: 'None',
      portCount: 0,
      timestamp: Date.now() - 1800000 
    }
  ]);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [expandedHost, setExpandedHost] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'inventory' | 'topology'>('inventory');
  const [filters, setFilters] = useState({
    os: 'All',
    status: 'All',
    minPorts: 0,
    severity: 'All',
    actor: 'All'
  });
  const [topoSelectedHost, setTopoSelectedHost] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1 day');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const handleExportCsv = () => {
    const dataToExport = filteredResults.length > 0 ? filteredResults : results;
    if (!dataToExport || dataToExport.length === 0) return;

    const headers = [
      "Hostname",
      "IP Address",
      "Status",
      "Operating System",
      "Risk Severity",
      "Vulnerabilities Count",
      "Associated Threat Actor",
      "Probed Ports & Services",
      "Identified CVEs",
      "Scan Findings Breakdown",
      "Remediation Strategy & Action Plan",
      "MAC Address",
      "Uptime",
      "Last Scanned"
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = dataToExport.map(host => {
      const riskLevel = host.vulnerabilities >= 10 ? 'Critical' :
                        host.vulnerabilities >= 5 ? 'High' :
                        host.vulnerabilities > 0 ? 'Medium' : 'Low';

      let cves = "None Detected";
      let findings = "Baseline security parameters verified; No critical CVEs detected";
      let remediation = "Maintain regular scheduled patching and operational baseline checks";

      if (host.ip === '10.120.100.100') {
        cves = "CVE-2024-21413, CVE-2023-5678, CVE-2022-9999, CVE-2024-30078";
        findings = "1. Direct MySQL 3306 exposure without network ACL; 2. Web service HTTP TRACE method enabled & CORS wildcard (*); 3. SMB unforced packet signing; 4. RTSP/SIP backup path leak (Trinity.txt.bak)";
        remediation = "Isolate host from production segment immediately; Bind MySQL to internal VPC subnet; Disable TRACE & restrict CORS origins in Nginx; Enforce SMB packet signing via AD GPO";
      } else if (host.ip === '10.0.0.12') {
        cves = "CVE-2024-1234, CVE-2023-38545";
        findings = "1. PostgreSQL 5432 exposed to broad subnet; 2. Outdated OpenSSL libcrypto.so library; 3. Deprecated SSH MAC algorithms (3DES-CBC, RC4)";
        remediation = "Upgrade PostgreSQL to v13.5+; Recompile OpenSSL to 1.1.1t+; Restrict allowed ciphers in /etc/ssh/sshd_config";
      } else if (host.ip === '10.0.0.45') {
        cves = "CVE-2023-3450, CVE-2023-2729";
        findings = "1. Legacy SMBv1/v2 enabled on NAS storage; 2. Overly permissive NFS export parameters on port 2049; 3. DSM administrative portal exposed on untrusted segment";
        remediation = "Disable SMBv1 daemon; Restrict NFS mount permissions by CIDR block; Enforce MFA on administrative portal";
      } else if (host.ip === '10.0.0.1') {
        cves = "Baseline Verified (0 CVE)";
        findings = "Perimeter router gateway ports 80, 443, 22 operational; Access list applied";
        remediation = "Apply quarterly RouterOS firmware upgrades and review management access rules";
      } else if (host.ip === '10.0.0.100') {
        cves = "N/A (Host Offline)";
        findings = "Node offline or unreachable during scheduled probe window; No responsive ports";
        remediation = "Verify physical cabling, network power, and endpoint agent heartbeat status";
      }

      return [
        escapeCsv(host.hostname),
        escapeCsv(host.ip),
        escapeCsv(host.status),
        escapeCsv(host.os),
        escapeCsv(riskLevel),
        escapeCsv(host.vulnerabilities),
        escapeCsv(host.actor || 'None'),
        escapeCsv(host.services),
        escapeCsv(cves),
        escapeCsv(findings),
        escapeCsv(remediation),
        escapeCsv(host.mac || 'N/A'),
        escapeCsv(host.uptime || 'N/A'),
        escapeCsv(host.lastSeen || new Date(host.timestamp).toLocaleString())
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `discovery_findings_vulnerabilities_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startScan = async () => {
    setIsScanning(true);
    setLogs([]);
    setProgress(0);
    setResults([]);

    const now = Date.now();
    const timestampLog = () => new Date().toLocaleTimeString();
    const addLog = (msg: string) => setLogs(prev => [...prev, `${timestampLog()} - ${msg}`]);

    addLog('Starting NMAP path discovery...');
    addLog('Flags: -sS -sV -O --script vulners -T4');
    addLog(`Target: ${target}`);
    
    // Step 1: Host Discovery
    await new Promise(r => setTimeout(r, 600));
    setProgress(15);
    addLog('Host discovery initiated. Sending ARP probes...');
    await new Promise(r => setTimeout(r, 400));
    addLog('ARP response received from 12 gateway nodes.');
    addLog('Discovered 4 reactive hosts in targeted subnet.');

    // Step 2: Port Scanning
    setProgress(30);
    addLog('Beginning SYN Stealth Scan against 1000 common ports...');
    await new Promise(r => setTimeout(r, 800));
    setProgress(45);
    addLog('Port 80/tcp open on 10.0.0.1');
    addLog('Port 443/tcp open on 10.0.0.1');
    addLog('Port 5432/tcp open on 10.0.0.12');
    addLog('Port 22/tcp open on 10.0.0.12');
    addLog('Port 445/tcp open on 10.0.0.45');
    addLog('Port 139/tcp open on 10.0.0.45');
    addLog('Port 3389/tcp open on 10.0.0.100');
    addLog('Port 3306/tcp open on 10.120.100.100');
    addLog('Port 445/tcp open on 10.120.100.100');
    addLog('Port 5985/tcp open on 10.120.100.100');
    addLog('Port 8088/tcp open on 10.120.100.100');
    addLog('Port 7001/tcp open on 10.120.100.100');

    // Step 3: Service Versioning
    setProgress(60);
    addLog('Probing services for version identification...');
    await new Promise(r => setTimeout(r, 1000));
    setProgress(75);
    addLog('10.0.0.1 identified as MikroTik RouterOS (Gateway)');
    addLog('10.0.0.12 identified as PostgreSQL 13.4 on Ubuntu Focal');
    addLog('10.0.0.45 identified as Synology DiskStation Manager (DSM)');
    addLog('10.0.0.100 identified as Windows 11 Pro Enterprise');

    // Step 4: Vulnerability Scanning
    setProgress(90);
    addLog('Executing NSE Script: vulners.nse...');
    await new Promise(r => setTimeout(r, 1200));
    addLog('Analysis complete. Critical CVEs detected on 10.120.100.100');
    
    setProgress(100);
    setResults([
      { 
        ip: '10.120.100.100', 
        hostname: 'WIN-23LQ', 
        os: 'Windows Server 2022', 
        status: 'Up', 
        services: '3306, 445, 3389, 5985, 8088, 7001 + 8 more', 
        vulnerabilities: 14, 
        hasReport: true,
        mac: '00:15:5D:8A:2B:CC',
        lastSeen: 'Just now',
        uptime: '24d 12h 45m',
        actor: 'Lazarus Group',
        portCount: 14,
        timestamp: now
      },
      { 
        ip: '10.0.0.1', 
        hostname: 'gateway.internal', 
        os: 'MikroTik RouterOS', 
        status: 'Up', 
        services: '80, 443, 22', 
        vulnerabilities: 0,
        mac: 'E4:8D:8C:F2:1A:01',
        lastSeen: '2 mins ago',
        uptime: '365d 04h 12m',
        actor: 'None',
        portCount: 3,
        timestamp: now - 120000
      },
      { 
        ip: '10.0.0.12', 
        hostname: 'db-prod-cluster', 
        os: 'Ubuntu 20.04 LTS', 
        status: 'Up', 
        services: '5432, 22', 
        vulnerabilities: 5,
        mac: '00:50:56:B3:94:DD',
        lastSeen: '5 mins ago',
        uptime: '12d 18h 30m',
        actor: 'Sandworm',
        portCount: 2,
        timestamp: now - 300000
      },
      { 
        ip: '10.0.0.45', 
        hostname: 'nas-storage-01', 
        os: 'Synology DSM 7.x', 
        status: 'Up', 
        services: '445, 139, 2049', 
        vulnerabilities: 8,
        mac: '00:11:32:8E:45:90',
        lastSeen: '12 mins ago',
        uptime: '89d 02h 15m',
        actor: 'APT28',
        portCount: 3,
        timestamp: now - 720000
      },
      { 
        ip: '10.0.0.100', 
        hostname: 'workstation-dev-01', 
        os: 'Windows 11 Pro', 
        status: 'Down', 
        services: '', 
        vulnerabilities: 0,
        mac: 'D8:BB:C1:2F:90:BB',
        lastSeen: 'Just now',
        uptime: '0m',
        actor: 'None',
        portCount: 0,
        timestamp: now - 1800000 
      }
    ]);
    setIsScanning(false);
    addLog('Scan finished. 5 hosts up (1024 IP addresses scanned).');
  };

  const renderDetailedReport = () => {
    if (!selectedHost) return null;
    
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedHost(null)}
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-[#0d0d0f] border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="bg-red-500/20 p-3 rounded-2xl border border-red-500/30">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">弱點防禦評估報告 (Assessment Report)</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">受評估目標主機: {selectedHost} (WIN-23LQ)</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedHost(null)}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
            {/* Section I: Risk Assessment */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-white px-4 py-2 bg-blue-600 rounded-xl">一</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">風險評估與核心結論 (Executive Summary)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] mb-4">
                    <Skull className="text-white w-8 h-8" />
                  </div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">整體綜合評等</h4>
                  <div className="text-2xl font-black text-red-500 italic uppercase tracking-tighter">🔴 致命高風險 (Critical)</div>
                </div>
                
                <div className="md:col-span-3 bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    核心結論與診斷摘要
                  </h4>
                  <div className="text-sm text-gray-300 leading-relaxed font-medium space-y-4">
                    <p>
                      此主機 (10.120.100.100) 曝露極大的攻擊面，對外開啟多達 <span className="text-white font-bold">14 個 TCP 服務連接埠</span>。此狀態嚴重違反政府與企業資安基準 (GCB)，極易遭受資料庫入侵、API 漏洞利用或橫向移動攻擊。
                    </p>
                    <div className="text-red-400 font-bold bg-red-400/5 p-4 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
                      <ShieldX className="shrink-0" size={20} />
                      在完成全數漏洞修補與網段隔離前，嚴禁上線正式營運。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section II: Detection Explanation */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-white px-4 py-2 bg-blue-600 rounded-xl">二</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">偵測發現與威脅說明</h3>
              </div>
              
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 mb-4">
                <p className="text-sm text-gray-200 font-medium">該主機資安評等判定為 <span className="text-red-500 font-black">🔴 致命高風險</span>，主要基於以下三大核心檢驗發現：</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    title: "攻擊面過度龐大且缺乏核心存取控制",
                    desc: "偵測到 14 個開放服務埠。MySQL (3306) 資料庫在無白名單管控下直接對外曝露，攻擊者可輕易發起暴力破解或利用資料庫固有漏洞。"
                  },
                  {
                    title: "Web 服務存在多項不當配置漏洞",
                    desc: "Web 服務 (Nginx/Kestrel) 包含嚴重設定錯誤：啟用不安全的 TRACE 方法以及全開放的 CORS 跨域存取 (Allow-Origin: *)，使系統面臨 XST 攻擊與敏感資料竊取風險。"
                  },
                  {
                    title: "基礎設施安全性設定未達標",
                    desc: "同時啟用多種遠端管理協定 (RDP, WinRM, SMB, RTSP, SIP)，且 SMB 數位簽章未強制執行，違反政府資安基準 (GCB) 與區域防衛原則。"
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-gray-900/50 border border-gray-800 rounded-2xl transition-all hover:bg-gray-800/50">
                    <div className="text-xl font-black text-red-500/20">{i+1}</div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-200 mb-1">{item.title}</h5>
                      <p className="text-xs text-gray-400 leading-relaxed italic">"{item.desc}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section III: Detailed Explanation */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-white px-4 py-2 bg-blue-600 rounded-xl">三</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">技術細節與補強建議</h3>
              </div>

              <div className="space-y-6">
                {/* A. MySQL */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-orange-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-orange-500/5">
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">A. 核心資料庫直連曝光 (MySQL 3306)</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold">致命風險 (Critical)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      詳細技術說明：Nmap 探測確認 <span className="text-white font-mono">MySQL 8.0.45</span> 正於背景運行，並成功擷取出資料庫 salt 與能力標記。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/80 rounded-xl border border-gray-800">
                        <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">影響評估</span>
                        <p className="text-xs text-gray-300">缺乏網段隔離允許外部直接連線，極易遭致爆破與 SQL 隱碼注入。</p>
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <span className="text-[9px] font-black text-green-500 uppercase block mb-1">改善建議與處置</span>
                        <p className="text-xs text-gray-300">於硬體防火牆設定 ACL 規則，僅允許應用伺服器 (App Server) IP 連線，停用跨網段直連。</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. Web Services */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-blue-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-blue-500/5">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">B. 不安全 Web 服務配置 (443, 8088, 8089)</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold">高風險 (High)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      技術發現：Nginx 與 Kestrel 服務啟用了 HTTP TRACE 方法，並將 CORS 策略設定為全開放 (*)。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/80 rounded-xl">
                        <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">風險評估</span>
                        <ul className="text-[11px] text-gray-400 list-disc list-inside space-y-1">
                          <li>TRACE：可被用於 XST 攻擊，攔截竊取認證標頭。</li>
                          <li>CORS：允許惡意跨網域腳本讀取敏感 API 資料。</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <span className="text-[9px] font-black text-green-500 uppercase block mb-1">修復建議</span>
                        <p className="text-xs text-gray-300">於伺服器設定中停用 TRACE；限制 <span className="font-mono">Access-Control-Allow-Origin</span> 僅允許受信任的內部網域。</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Complex Protocols */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-pink-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-pink-500/5">
                    <div className="flex items-center gap-3">
                      <Radio className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">C. 複雜通訊與路徑洩漏 (7001)</span>
                    </div>
                    <span className="text-[10px] font-mono text-orange-400 uppercase font-bold">風險：高 (High)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      技術發現：埠口回應 RTSP、SIP 及 HTTP。301 轉址回應中洩漏備份檔特徵 (<span className="text-white font-mono">Trinity.txt.bak</span>)。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/80 rounded-xl">
                        <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">風險評估</span>
                        <p className="text-xs text-gray-300">缺乏 RTSP/SIP 管控可能使內網易受勒索軟體橫向擴散影響。</p>
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <span className="text-[9px] font-black text-green-500 uppercase block mb-1">防禦建議</span>
                        <p className="text-xs text-gray-300">若無影音服務需求應關閉 7001 與 554 埠；隱藏轉址標頭資訊以遮蔽內部檔案結構。</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* D. SMB Post 445 */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-purple-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-purple-500/5">
                    <div className="flex items-center gap-3">
                      <Network className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">D. GCB 基礎安全設定缺失 (445 SMB)</span>
                    </div>
                    <span className="text-[10px] font-mono text-orange-400 uppercase font-bold">風險：高 (High)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed italic">
                      "SMB 數位簽章設定為啟用但非強制 (not required)，違反政府資安基準 (GCB)。"
                    </p>
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <span className="text-[9px] font-black text-red-500 uppercase block mb-1">中繼轉發攻擊風險 (Relay Attack)</span>
                      <p className="text-xs text-gray-300">攻擊者可發起 SMB Relay 攻擊，攔截驗證封包並冒充合法使用者權限。</p>
                    </div>
                    <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                      <span className="text-[9px] font-black text-green-500 uppercase block mb-1">修復建議</span>
                      <p className="text-xs text-gray-300">透過群組原則 (GPO) 強制開啟「Microsoft 網路伺服器: 數位簽署通訊 (永遠)」。</p>
                    </div>
                  </div>
                </div>

                {/* E. Remote Management */}
                <div className="bg-zinc-900/40 border border-gray-800 rounded-2xl shadow-lg hover:border-cyan-500/30 transition-all">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-cyan-500/5">
                    <div className="flex items-center gap-3">
                      <Settings2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black text-gray-200 uppercase">E. 遠端管理服務過度曝光 (3389, 5985)</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold">致命風險 (Critical)</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      技術發現：RDP/WinRM 在無網段限制下開放，主機名稱 <span className="text-white font-mono">WIN-23LQ</span> 完整曝光。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                         <span className="text-[9px] font-black text-red-500 uppercase block mb-1">威脅評估</span>
                        <p className="text-xs text-gray-300">WinRM 為指令執行的核心管道，一旦曝露即成為內網橫向移動的首要目標。</p>
                      </div>
                      <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                         <span className="text-[9px] font-black text-green-500 uppercase block mb-1">改善處置建議</span>
                        <p className="text-xs text-gray-300">於生產環境關閉 5985；限制 3389 僅允許 VPN 連入，並隱藏主機識別標頭。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-800 bg-zinc-900/80 flex gap-4">
             <button className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-sm font-black transition-all border border-gray-700 flex items-center justify-center gap-3 shadow-lg">
              <Download size={18} />
              匯出完整技術檢測 PCAP
            </button>
            <button className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95">
              <ShieldAlert size={18} />
              發動自動化隔離程序
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const filteredResults = results.filter(h => {
    const osMatch = filters.os === 'All' || h.os.includes(filters.os);
    const statusMatch = filters.status === 'All' || h.status === filters.status;
    const portMatch = (h.portCount || 0) >= filters.minPorts;
    const actorMatch = filters.actor === 'All' || h.actor === filters.actor;
    
    let severityMatch = true;
    if (filters.severity !== 'All') {
      const level = h.vulnerabilities >= 10 ? 'Critical' :
                    h.vulnerabilities >= 5 ? 'High' :
                    h.vulnerabilities > 0 ? 'Medium' : 'Low';
      severityMatch = level === filters.severity;
    }

    // Temporal Filtering Logic
    let timeMatch = true;
    const now = Date.now();
    const age = now - h.timestamp;
    
    if (timeRange !== 'custom') {
      const msMap: Record<string, number> = {
        'last 15 minutes': 15 * 60 * 1000,
        'last 30 minutes': 30 * 60 * 1000,
        '1 hour': 60 * 60 * 1000,
        '1 day': 24 * 60 * 60 * 1000,
        '7 days': 7 * 24 * 60 * 60 * 1000,
        'this week': 7 * 24 * 60 * 60 * 1000, // Roughly same for demo
        '60 days': 60 * 24 * 60 * 60 * 1000,
        '90 days': 90 * 24 * 60 * 60 * 1000,
        '1 year': 365 * 24 * 60 * 60 * 1000
      };
      if (msMap[timeRange]) {
        timeMatch = age <= msMap[timeRange];
      }
    } else {
      if (customRange.start) {
        const startTs = new Date(customRange.start).getTime();
        timeMatch = timeMatch && h.timestamp >= startTs;
      }
      if (customRange.end) {
        const endTs = new Date(customRange.end).getTime();
        timeMatch = timeMatch && h.timestamp <= endTs;
      }
    }

    return osMatch && statusMatch && portMatch && actorMatch && severityMatch && timeMatch;
  });

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {selectedHost && renderDetailedReport()}
      </AnimatePresence>
      
      {/* Control Panel */}
      <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 flex flex-col gap-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Time Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} className="text-blue-500" />
              時間關聯分析視窗 (Temporal Window)
            </label>
            <div className="flex gap-2">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-gray-300 font-bold min-w-[200px]"
              >
                <option value="last 15 minutes">最近 15 分鐘</option>
                <option value="last 30 minutes">最近 30 分鐘</option>
                <option value="1 hour">最近 1 小時</option>
                <option value="1 day">最近 24 小時</option>
                <option value="7 days">最近 7 天</option>
                <option value="this week">本週</option>
                <option value="60 days">最近 60 天</option>
                <option value="90 days">最近 90 天</option>
                <option value="1 year">最近 1 年</option>
                <option value="custom">自訂時間範圍</option>
              </select>
              
              {timeRange === 'custom' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                  <input 
                    type="datetime-local" 
                    value={customRange.start}
                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 text-xs focus:border-blue-500 outline-none text-gray-400 font-mono"
                  />
                  <span className="text-gray-600 text-xs uppercase font-black">至</span>
                  <input 
                    type="datetime-local" 
                    value={customRange.end}
                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 text-xs focus:border-blue-500 outline-none text-gray-400 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subnet Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe size={12} className="text-blue-500" />
              目標掃描位址空間 (Target Address Space)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="例如: 10.120.100.0/24"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-gray-700 font-mono"
                />
              </div>
              <button 
                onClick={startScan}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-lg shadow-blue-600/20 active:scale-95"
              >
                {isScanning ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                {isScanning ? '主機探測中...' : '發動資產掃描'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">時間關聯分析視窗: <span className="text-blue-400">{timeRange === 'custom' ? `${customRange.start || '開始'} ➜ ${customRange.end || '結束'}` : timeRange}</span></p>
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-600 uppercase font-black">已偵測資產數</span>
              <span className="text-sm font-bold text-white">{results.length}</span>
            </div>
            <div className="w-[1px] h-8 bg-gray-800" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-600 uppercase font-black">偵測弱點總數</span>
              <span className="text-sm font-bold text-red-500">{results.reduce((acc, curr) => acc + curr.vulnerabilities, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner UI */}
      <div className="grid grid-cols-1 gap-6">
        {/* Terminal Console */}
        <div className="bg-black rounded-xl border border-gray-800 flex flex-col min-h-[400px] max-h-[600px] shadow-2xl relative overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-blue-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SEMOR NMAP 探測控制台</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-[11px] text-blue-400/80 overflow-y-auto space-y-2 custom-scrollbar">
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-20 grayscale">
                <Radio className="w-12 h-12 animate-pulse" />
                <p className="text-xs uppercase font-black tracking-widest italic">等待發動主探測程序</p>
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 group">
                <span className="text-gray-700 select-none">{i+1}</span>
                <span className={cn(
                  "transition-colors",
                  log.includes('complete') || log.includes('finished') ? "text-green-400 font-bold" : "group-hover:text-white"
                )}>{log}</span>
              </div>
            ))}
            {isScanning && (
              <div className="flex gap-3 animate-pulse">
                <span className="text-gray-700">{logs.length + 1}</span>
                <span className="text-white font-bold opacity-60">腳本引擎執行中...</span>
              </div>
            )}
          </div>
          {isScanning && (
            <div className="p-4 border-t border-gray-800 bg-zinc-900/50">
              <div className="flex justify-between mb-2 px-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">資產發現進度</span>
                <span className="text-[9px] font-black text-blue-400 tracking-tighter">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Discovery Results Table */}
        <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden flex flex-col min-h-[600px] shadow-xl">
          <div className="p-6 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Database size={16} className="text-purple-400" />
              已發現資產清冊 (Discovered Assets)
            </h3>
            <div className="flex items-center gap-4">
               {results.length > 0 && (
                <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800">
                  <button 
                    onClick={() => setViewMode('inventory')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      viewMode === 'inventory' ? "bg-gray-800 text-blue-400" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    資產清單
                  </button>
                  <button 
                    onClick={() => setViewMode('topology')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      viewMode === 'topology' ? "bg-gray-800 text-purple-400" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    網路拓撲
                  </button>
                </div>
              )}
              {results.length > 0 && (
                <button 
                  id="export-discovery-findings-csv-btn-app"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-[10px] font-black text-blue-400 uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-sm"
                  title="Export identified vulnerability details to CSV"
                >
                  <Download size={13} className="text-blue-400" />
                  <span>匯出 CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          {results.length > 0 && viewMode === 'inventory' && (
            <div className="px-6 py-3 bg-zinc-900 border-b border-gray-800 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 mr-2">
                <Filter size={12} className="text-gray-500" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">清冊篩選條件:</span>
              </div>
              
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">作業系統</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.os}
                  onChange={e => setFilters({...filters, os: e.target.value})}
                >
                  <option value="All">所有系統</option>
                  <option value="Windows">Windows</option>
                  <option value="Ubuntu">Ubuntu</option>
                  <option value="MikroTik">MikroTik</option>
                  <option value="Synology">Synology</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">連線狀態</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.status}
                  onChange={e => setFilters({...filters, status: e.target.value})}
                >
                  <option value="All">所有狀態</option>
                  <option value="Up">在線 (Up)</option>
                  <option value="Down">離線 (Down)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">風險等級</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.severity}
                  onChange={e => setFilters({...filters, severity: e.target.value})}
                >
                  <option value="All">所有等級</option>
                  <option value="Critical">致命 (Critical)</option>
                  <option value="High">高風險 (High)</option>
                  <option value="Medium">中風險 (Medium)</option>
                  <option value="Low">低風險 (Low)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">威脅組織</span>
                <select 
                  className="bg-black/40 border border-gray-800 text-[10px] text-gray-400 px-2 py-1 rounded outline-none focus:border-blue-500"
                  value={filters.actor}
                  onChange={e => setFilters({...filters, actor: e.target.value})}
                >
                  <option value="All">所有組織</option>
                  <option value="Lazarus Group">Lazarus Group</option>
                  <option value="Sandworm">Sandworm</option>
                  <option value="APT28">APT28</option>
                  <option value="None">無關聯</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-600 uppercase">最少開放埠數</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="0" max="20" 
                    value={filters.minPorts}
                    onChange={e => setFilters({...filters, minPorts: parseInt(e.target.value)})}
                    className="w-24 accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-blue-400 min-w-[20px]">{filters.minPorts}</span>
                </div>
              </div>

              <button 
                onClick={() => setFilters({os: 'All', status: 'All', minPorts: 0, severity: 'All', actor: 'All'})}
                className="ml-auto text-[9px] font-black text-gray-600 uppercase hover:text-red-500 transition-colors"
              >
                重設篩選
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto custom-scrollbar relative">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center relative">
                  <Search size={32} className="text-gray-600" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-blue-500 rounded-full scale-110"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-400">已就緒，準備執行自動化探測。</p>
                  <p className="text-xs text-gray-600">請輸入目標位址網段，並發動 SEMOR 探測器進行內網主探測。</p>
                </div>
              </div>
            ) : viewMode === 'topology' ? (
              <div className="h-full p-4 relative flex">
                <div className="flex-1 min-w-0">
                  <TopologyMap 
                    hosts={results} 
                    onNodeSelect={(id) => setTopoSelectedHost(id === topoSelectedHost ? null : id)}
                    selectedId={topoSelectedHost}
                  />
                </div>
                
                <AnimatePresence>
                  {topoSelectedHost && (
                    <motion.div
                      initial={{ x: 400, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 400, opacity: 0 }}
                      className="w-80 bg-zinc-900/90 border-l border-gray-800 backdrop-blur-xl absolute right-0 top-0 bottom-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col p-6 overflow-y-auto custom-scrollbar"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <Monitor size={16} className="text-blue-400" />
                          </div>
                          <span className="text-xs font-black text-white uppercase tracking-widest">節點檢視器 (Node Inspector)</span>
                        </div>
                        <button 
                          onClick={() => setTopoSelectedHost(null)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {results.find(h => h.ip === topoSelectedHost) && (
                        <div className="space-y-8">
                          {/* Basic Info */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">主機名稱 (Hostname)</p>
                              <p className="text-lg font-bold text-white">{results.find(h => h.ip === topoSelectedHost)?.hostname}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">目標 IP 位址</p>
                              <p className="text-base font-mono text-blue-400">{topoSelectedHost}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">風險威脅狀態</p>
                              <div className="flex items-center gap-2">
                                <ShieldAlert size={14} className={cn(
                                  (results.find(h => h.ip === topoSelectedHost)?.vulnerabilities || 0) >= 10 ? "text-red-500" : "text-yellow-500"
                                )} />
                                <span className={cn(
                                  "text-xs font-black uppercase italic",
                                  (results.find(h => h.ip === topoSelectedHost)?.vulnerabilities || 0) >= 10 ? "text-red-500" : "text-yellow-500"
                                )}>
                                  {(results.find(h => h.ip === topoSelectedHost)?.vulnerabilities || 0) >= 10 ? '致命威脅 (Critical)' : '中度優先 (Medium)'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Stats */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 border border-gray-800 p-3 rounded-xl">
                              <p className="text-[8px] font-black text-gray-600 uppercase mb-1">開放通訊埠</p>
                              <p className="text-lg font-bold text-gray-200">{results.find(h => h.ip === topoSelectedHost)?.portCount || 3}</p>
                            </div>
                            <div className="bg-black/40 border border-gray-800 p-3 rounded-xl">
                              <p className="text-[8px] font-black text-gray-600 uppercase mb-1">漏洞數</p>
                              <p className="text-lg font-bold text-red-500">{results.find(h => h.ip === topoSelectedHost)?.vulnerabilities}</p>
                            </div>
                          </div>

                          {/* Detected Services */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <Terminal size={12} /> 已偵測服務 (Services)
                            </h4>
                            <div className="space-y-2">
                              {results.find(h => h.ip === topoSelectedHost)?.services.split(',').filter(s => s).map((s, i) => (
                                <div key={i} className="bg-black/40 border border-gray-800 p-3 rounded-xl flex items-center justify-between group/port hover:border-blue-500/30 transition-all">
                                  <span className="text-[10px] font-mono text-blue-400 font-bold">{s.trim()}</span>
                                  <span className="text-[9px] text-gray-500 uppercase font-black opacity-0 group-hover/port:opacity-100 transition-opacity">已擷取協定</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Threat Intel */}
                          {results.find(h => h.ip === topoSelectedHost)?.actor !== 'None' && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2">
                              <div className="flex items-center gap-2 text-red-400">
                                <Skull size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">關聯威脅組織 (Threat Actor)</span>
                              </div>
                              <p className="text-sm font-black text-red-500 tracking-tight italic uppercase">
                                {results.find(h => h.ip === topoSelectedHost)?.actor}
                              </p>
                            </div>
                          )}

                          <button 
                            onClick={() => {
                              setSelectedHost(topoSelectedHost);
                              setTopoSelectedHost(null);
                            }}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                          >
                            產生完整技術評估報告
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#111114] z-10">
                  <tr className="border-b border-gray-800 bg-black/20">
                    <th className="w-12 px-6 py-4"></th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">主機名稱 (Hostname)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">IP 位址</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">關聯威脅組織</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">風險等級</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">系統指紋</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">探測到的通訊埠</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>弱點數</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportCsv();
                          }}
                          className="px-2 py-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                          title="匯出弱點清冊為 CSV (Export to CSV)"
                        >
                          <Download size={11} />
                          <span>Export to CSV</span>
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredResults.map((host, idx) => (
                    <React.Fragment key={idx}>
                      <tr 
                        className={cn(
                          "hover:bg-blue-600/5 transition-colors group cursor-pointer",
                          expandedHost === host.ip && "bg-blue-600/10"
                        )}
                        onClick={() => setExpandedHost(expandedHost === host.ip ? null : host.ip)}
                      >
                        <td className="px-6 py-4">
                          <motion.div
                            animate={{ rotate: expandedHost === host.ip ? 90 : 0 }}
                            className="text-gray-500 group-hover:text-blue-400 transition-colors"
                          >
                            <ChevronRight size={14} />
                          </motion.div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 bg-gray-900 rounded-lg group-hover:bg-blue-600/20 transition-colors",
                              host.hasReport && "group-hover:bg-red-500/20"
                            )}>
                              <Monitor size={14} className={cn("text-blue-500", host.hasReport && "text-red-500 animate-pulse")} />
                            </div>
                            <span className="text-xs font-bold text-gray-200">{host.hostname}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded group-hover:text-blue-400 transition-colors">{host.ip}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {host.actor && host.actor !== 'None' ? (
                            <div className="flex items-center justify-center gap-1.5 py-1 px-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-black text-red-400 uppercase tracking-tight">
                              <Skull size={10} />
                              {host.actor}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">---</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              host.vulnerabilities >= 10 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                              host.vulnerabilities >= 5 ? "bg-orange-500" :
                              host.vulnerabilities > 0 ? "bg-yellow-500" : "bg-green-500"
                            )} />
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tighter",
                              host.vulnerabilities >= 10 ? "text-red-500" :
                              host.vulnerabilities >= 5 ? "text-orange-500" :
                              host.vulnerabilities > 0 ? "text-yellow-500" : "text-green-500"
                            )}>
                              {host.vulnerabilities >= 10 ? '致命 (Critical)' :
                               host.vulnerabilities >= 5 ? '高風險 (High)' :
                               host.vulnerabilities > 0 ? '中風險 (Medium)' : '低風險 (Low)'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold text-gray-300 py-1 px-3 bg-gray-800/50 rounded-full border border-gray-700">
                            {host.os}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {host.services.split(',').slice(0, 3).map((port, pidx) => (
                              <span key={pidx} className="text-[9px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500 font-mono">
                                {port.trim()}
                              </span>
                            ))}
                            {host.services.split(',').length > 3 && (
                              <span className="text-[9px] text-gray-600">+{host.services.split(',').length - 3} 個</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-black shadow-sm",
                              host.vulnerabilities >= 10 ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                              host.vulnerabilities >= 5 ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : 
                              "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                            )}>
                              {host.vulnerabilities}
                            </span>
                            {host.hasReport && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHost(host.ip);
                                }}
                                className="text-[10px] font-black text-red-500 uppercase hover:underline flex items-center gap-1 active:scale-95"
                              >
                                <ShieldAlert size={10} />
                                檢視檢驗報告
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Dropdown Details */}
                      <AnimatePresence>
                        {expandedHost === host.ip && (
                          <tr className="bg-blue-600/5">
                            <td colSpan={6} className="px-6 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-gray-800/30">
                                  <div className="col-span-1 space-y-6">
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">主機識別資訊</span>
                                      <div className="space-y-4">
                                        <div>
                                          <label className="text-[8px] text-gray-600 uppercase font-bold block">MAC 位址</label>
                                          <p className="text-xs font-mono text-blue-400/80">{host.mac || '00:00:00:00:00:00'}</p>
                                        </div>
                                        <div>
                                          <label className="text-[8px] text-gray-600 uppercase font-bold block">持續運作時間 (Uptime)</label>
                                          <p className="text-xs text-gray-300 font-medium">{host.uptime || 'N/A'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">探測時間軸</span>
                                      <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <p className="text-xs text-gray-400">最近掃描: <span className="text-white">{host.lastSeen}</span></p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-span-1 flex flex-col gap-3 justify-center">
                                    <button className="w-full py-4 bg-gray-800 hover:bg-blue-600/20 border border-gray-700/50 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">
                                      <SearchCode size={14} />
                                      協定封包分析
                                    </button>
                                    <button className="w-full py-4 bg-gray-800 hover:bg-purple-600/20 border border-gray-700/50 hover:border-purple-500/30 text-gray-300 hover:text-purple-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">
                                      <Fingerprint size={14} />
                                      OS 系統指紋
                                    </button>
                                    <button className="w-full py-4 bg-gray-800 hover:bg-orange-600/20 border border-gray-700/50 hover:border-orange-500/30 text-gray-300 hover:text-orange-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">
                                      <Signal size={14} />
                                      即時 Traceroute 追蹤
                                    </button>
                                  </div>

                                  <div className="col-span-2 space-y-4">
                                    <div className="bg-black/60 rounded-2xl border border-gray-800 p-6 shadow-inner">
                                      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                                        <div className="flex items-center gap-2">
                                          <Terminal size={14} className="text-blue-500" />
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">服務 Banner 日誌完整記錄</span>
                                        </div>
                                        <div className="flex gap-1">
                                          <div className="w-2 h-2 rounded-full bg-red-500/40" />
                                          <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                                          <div className="w-2 h-2 rounded-full bg-green-500/40" />
                                        </div>
                                      </div>
                                      <div className="space-y-3 custom-scrollbar max-h-[180px] overflow-y-auto pr-2">
                                        {host.services.split(',').map((port, pidx) => (
                                          <div key={pidx} className="flex items-start justify-between group/banner p-2 rounded-lg hover:bg-gray-800/40 transition-all border border-transparent hover:border-gray-700/50">
                                            <div className="flex items-center gap-4">
                                              <div className="px-2 py-1 bg-gray-900 border border-gray-800 rounded font-mono text-[9px] text-blue-400 group-hover/banner:text-white transition-colors">
                                                {port.trim()}
                                              </div>
                                              <div>
                                                <p className="text-[10px] font-bold text-gray-300">
                                                  {port.includes('80') || port.includes('443') ? 'HTTP/HTTPS Web Service' : 
                                                   port.includes('22') ? 'OpenSSH 8.4p1 Debian' : 
                                                   port.includes('3389') ? 'Microsoft Remote Desktop' : 
                                                   port.includes('3306') ? 'MySQL Community Server 8.0' : 
                                                   port.includes('445') ? 'Microsoft Windows SMB' : 'Custom Process Service'}
                                                </p>
                                                <p className="text-[9px] text-gray-500 font-mono italic">指紋: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                                              </div>
                                            </div>
                                            <button className="text-[9px] font-black text-gray-600 hover:text-blue-400 uppercase transition-colors">擷取</button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detailed Findings Summary Card */}
        {results.length > 0 && !isScanning && (
          <DiscoveryFindingsSummary hosts={results} />
        )}
      </div>
    </div>
  );
}

function SummarySection() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const riskData = [
    { name: isZh ? '高風險' : 'High', value: 45, color: '#ef4444' },
    { name: isZh ? '中風險' : 'Medium', value: 120, color: '#f97316' },
    { name: isZh ? '低風險' : 'Low', value: 350, color: '#eab308' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="text-blue-400" /> {t('common.global_summary')}
        </h2>
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
          {(['daily', 'weekly', 'monthly'] as const).map((ti) => (
            <button
              key={ti}
              onClick={() => setTimeframe(ti)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                timeframe === ti ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {ti === 'daily' ? (isZh ? '日' : 'Daily') : ti === 'weekly' ? (isZh ? '週' : 'Weekly') : (isZh ? '月' : 'Monthly')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution & Trends */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Pie Chart */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 self-start">{t('common.risk_dist')}</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2">
              {riskData.map((r) => (
                <div key={r.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{r.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User & Traffic Trends */}
          <div className="md:col-span-2 bg-[#111114] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
              {isZh ? '使用者與網路流量趨勢' : 'Users & Traffic Trends'}
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA[timeframe]}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="traffic" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTraffic)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{isZh ? '使用者數' : 'Users'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{isZh ? '傳輸流量 (GB)' : 'Traffic (GB)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Count Trends */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
            {isZh ? '總事件數趨勢' : 'Total Events Trend'}
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TREND_DATA[timeframe]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Bar dataKey="events" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">{isZh ? '平均事件數：' : 'Avg. Events:'}</span>
            <span className="text-sm font-bold text-purple-400">
              {Math.round(TREND_DATA[timeframe].reduce((acc, curr) => acc + curr.events, 0) / TREND_DATA[timeframe].length).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Malware Summary */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-red-900/5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest">
                {isZh ? '活躍惡意程式威脅' : 'Active Malware Threats'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-gray-500">{isZh ? '已偵測前 4 大' : 'TOP 4 DETECTED'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-500 uppercase text-[10px] tracking-widest border-b border-gray-800 bg-black/20">
                  <th className="px-5 py-3 font-bold">{isZh ? '惡意程式名稱' : 'Malware Name'}</th>
                  <th className="px-5 py-3 font-bold">{isZh ? '威脅類型' : 'Type'}</th>
                  <th className="px-5 py-3 font-bold">{isZh ? '偵測次數' : 'Detections'}</th>
                  <th className="px-5 py-3 font-bold">{isZh ? '風險等級' : 'Risk'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {TOP_MALWARE.map((m, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-bold text-gray-200">{m.name}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {isZh ? (m.type === 'Ransomware' ? '勒索軟體' : m.type === 'Trojan' ? '特洛伊木馬' : m.type === 'Exploit' ? '漏洞利用' : m.type === 'PUP' ? '有害垃圾程式' : m.type) : m.type}
                    </td>
                    <td className="px-5 py-3 font-mono text-blue-400">{m.count}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        m.risk === 'Critical' ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                      )}>
                        {isZh ? (m.risk === 'Critical' ? '嚴重' : m.risk === 'High' ? '高風險' : m.risk === 'Low' ? '低風險' : m.risk) : m.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Current Vulnerability Summary */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-orange-900/5">
            <div className="flex items-center gap-2">
              <Bug className="text-orange-500" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest">
                {isZh ? '主要漏洞風險總覽' : 'Top Vulnerabilities'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-gray-500">{isZh ? '需立即修補' : 'PATCH REQUIRED'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-500 uppercase text-[10px] tracking-widest border-b border-gray-800 bg-black/20">
                  <th className="px-5 py-3 font-bold">{isZh ? 'CVE 編號' : 'CVE ID'}</th>
                  <th className="px-5 py-3 font-bold">{isZh ? '漏洞描述' : 'Description'}</th>
                  <th className="px-5 py-3 font-bold">{isZh ? '嚴重度' : 'Severity'}</th>
                  <th className="px-5 py-3 font-bold">{isZh ? '影響主機' : 'Hosts'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {TOP_VULNERABILITIES.map((v, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-orange-400">{v.cve}</td>
                    <td className="px-5 py-3 text-gray-300 truncate max-w-[150px]">
                      {isZh ? (
                        v.name === 'Ivanti Connect Secure RCE' ? 'Ivanti 遠端程式碼執行 (RCE)' :
                        v.name === 'Citrix Bleed' ? 'Citrix Bleed 記憶體資訊外洩' :
                        v.name === 'ScreenConnect Auth Bypass' ? 'ScreenConnect 身份驗證繞過' :
                        v.name === 'Confluence Broken Access' ? 'Confluence 權限控制缺陷' :
                        v.name
                      ) : v.name}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        v.severity === 'Critical' ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                      )}>
                        {isZh ? (v.severity === 'Critical' ? '嚴重' : '高風險') : v.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-blue-400">{v.hosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MalwareTable({ data }: { data: typeof TOP_MALWARE }) {
  return (
    <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Biohazard className="text-red-500" size={18} />
          TOP MALWARE ANALYSIS
        </h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest">
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-500 uppercase text-[10px] tracking-widest border-b border-gray-800 bg-black/20">
              <th className="px-5 py-3 font-bold">Malware Name</th>
              <th className="px-5 py-3 font-bold">Type</th>
              <th className="px-5 py-3 font-bold">Detections</th>
              <th className="px-5 py-3 font-bold">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {data.map((m, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 font-bold text-gray-200">{m.name}</td>
                <td className="px-5 py-3 text-gray-400">{m.type}</td>
                <td className="px-5 py-3 font-mono text-blue-400">{m.count}</td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                    m.risk === 'Critical' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                    m.risk === 'High' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : 
                    "bg-gray-500/10 text-gray-400 border-gray-500/20"
                  )}>
                    {m.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Note: MalwareAnalysisView has been refactored into ./components/malware/MalwareAnalysisView.tsx

function AgentMonitoringView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const stats = [
    { label: isZh ? 'Agent 總數' : 'Total Agents', value: 1284, color: 'text-blue-400' },
    { label: isZh ? '活動中' : 'Active', value: 1150, color: 'text-green-500', percent: 89.5 },
    { label: isZh ? '等待中' : 'Pending', value: 42, color: 'text-yellow-500', percent: 3.3 },
    { label: isZh ? '已離線' : 'Disconnected', value: 85, color: 'text-red-500', percent: 6.6 },
    { label: isZh ? '未曾連線' : 'Never Connected', value: 7, color: 'text-gray-500', percent: 0.6 },
  ];

  const osStats = [
    { label: 'Windows', count: 850, percent: 66, color: 'bg-blue-500' },
    { label: 'Linux', count: 320, percent: 25, color: 'bg-orange-500' },
    { label: 'MacOS', count: 114, percent: 9, color: 'bg-purple-500' },
  ];

  const agents = [
    { 
      id: 'AGT-001', 
      name: 'WKSTN-OFFICE-04', 
      os: 'Windows 11', 
      ip: '10.88.88.104', 
      status: 'active', 
      cpu: 12, 
      ram: 45, 
      disk: 24, 
      disk_capacity: '1TB SSD',
      network: '450 Mbps',
      version: '2.4.1',
      software: ['Windows 11 Pro', 'Office 365', 'Slack', 'VS Code', 'Crowdstrike Falcon'],
      processes: ['explorer.exe', 'svchost.exe', 'slack.exe', 'code.exe', 'wininit.exe'],
      os_version: 'Windows 11 22H2 (Build 22621)',
      update_version: 'KB5036899 (April 2026 Update)'
    },
    { 
      id: 'AGT-002', 
      name: 'SRV-PROD-SQL-01', 
      os: 'Ubuntu 22.04', 
      ip: '10.88.88.201', 
      status: 'active', 
      cpu: 28, 
      ram: 68, 
      disk: 55, 
      disk_capacity: '2.5TB NVMe',
      network: '8.2 Gbps',
      version: '2.4.0',
      software: ['Ubuntu 22.04 LTS', 'Docker', 'PostgreSQL 15', 'Nginx', 'Prometheus Node Exporter'],
      processes: ['systemd', 'postgres', 'docker-proxy', 'nginx', 'sshd'],
      os_version: 'Ubuntu 22.04.2 LTS (Jammy Jellyfish)',
      update_version: 'Kernel 5.15.0-70-generic'
    },
    { 
      id: 'AGT-003', 
      name: 'WKSTN-DEV-09', 
      os: 'MacOS Ventura', 
      ip: '192.168.1.45', 
      status: 'disconnected', 
      cpu: 0, 
      ram: 0, 
      disk: 0, 
      disk_capacity: '512GB',
      network: '0 Mbps',
      version: '2.3.9',
      software: ['macOS Ventura 13.4', 'Xcode', 'Docker Desktop', 'Spotify'],
      processes: [],
      os_version: 'macOS 13.4.1 (22F82)',
      update_version: 'Ventura Security Update 2026.01'
    },
    { 
      id: 'AGT-004', 
      name: 'WKSTN-REMOTE-01', 
      os: 'Windows 10', 
      ip: '172.16.5.12', 
      status: 'pending', 
      cpu: 5, 
      ram: 15, 
      disk: 8, 
      disk_capacity: '256GB',
      network: '12 Mbps',
      version: '2.4.1',
      software: ['Windows 10 Enterprise', 'Cisco AnyConnect', 'Zoom'],
      processes: ['vpn.exe', 'zoom.exe', 'explorer.exe'],
      os_version: 'Windows 10 21H2',
      update_version: 'KB5023706'
    },
    { 
      id: 'AGT-005', 
      name: 'UNKNOWN-DEVICE', 
      os: 'Linux', 
      ip: '10.0.0.15', 
      status: 'never connected', 
      cpu: 0, 
      ram: 0, 
      disk: 0, 
      disk_capacity: 'Unknown',
      network: '-',
      version: '2.4.1',
      software: [],
      processes: [],
      os_version: 'Unknown Kernel',
      update_version: 'N/A'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-[#111114] border border-gray-800 p-6 rounded-2xl">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={cn("text-3xl font-black italic tracking-tighter", s.color)}>{s.value}</div>
            {s.percent && (
               <div className="text-[9px] text-gray-600 font-bold uppercase mt-1">{s.percent}% of total</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* OS Proportions & Compliance Summary */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-8">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex-1">
                 <h3 className="text-sm font-black text-white italic tracking-tight uppercase mb-6 flex items-center gap-2">
                   <Layers size={16} className="text-blue-400" />
                   {isZh ? '作業系統分布與比例' : 'OS Distribution & Proportions'}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {osStats.map(os => (
                      <div key={os.label} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                               <span className="text-xs font-black text-gray-300 uppercase tracking-tight">{os.label}</span>
                               <span className="text-[10px] text-gray-600 font-bold italic">{os.count} Agents</span>
                            </div>
                            <span className="text-xs font-black text-white italic">{os.percent}%</span>
                         </div>
                         <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${os.percent}%` }}
                              className={cn("h-full", os.color)}
                            />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="lg:w-1/3 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl h-fit">
                 <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck size={20} className="text-blue-500" />
                    <h4 className="text-xs font-black text-white uppercase italic tracking-widest">{isZh ? '合規健康狀態' : 'Compliance Health'}</h4>
                 </div>
                 <p className="text-[10px] text-gray-500 leading-relaxed italic">
                   {isZh ? '98.2% 的 Agent 正運行版本 ' : '98.2% of agents are running version '}
                   <span className="text-blue-400">v2.4.1</span>. 
                   {isZh ? ' 2 個 Agent 提示核心相容性提醒。' : ' 2 agents flagged for kernel incompatibility.'}
                 </p>
              </div>
           </div>
        </div>

        {/* Detailed Agent List - Full Width */}
        <div className="bg-[#111114] border border-gray-800 rounded-2xl overflow-hidden">
           <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white italic tracking-tight uppercase">{isZh ? 'Agent 效能與遙測數據' : 'Agent Performance Telemetry'}</h3>
              <div className="flex items-center gap-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
                    <input type="text" placeholder={isZh ? '篩選 Agent...' : 'Filter agents...'} className="bg-black/50 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-[10px] outline-none focus:border-blue-500 transition-all w-48" />
                 </div>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-black/40 border-b border-gray-800">
                       <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">{isZh ? '端點設備' : 'Endpoint'}</th>
                       <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">{isZh ? '狀態' : 'Status'}</th>
                       <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">{isZh ? '效能指標' : 'Performance'}</th>
                       <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">{isZh ? '操作' : 'Action'}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800/50">
                    {agents.map(agent => (
                      <React.Fragment key={agent.id}>
                        <tr 
                          onClick={() => setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)}
                          className={cn(
                            "hover:bg-white/[0.02] transition-colors group cursor-pointer",
                            expandedAgentId === agent.id ? "bg-white/[0.03]" : ""
                          )}
                        >
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 border border-gray-800",
                                  agent.os.includes('Windows') ? "bg-blue-500/5 text-blue-400" :
                                  agent.os.includes('MacOS') ? "bg-purple-500/5 text-purple-400" :
                                  "bg-orange-500/5 text-orange-400"
                                )}>
                                   {agent.os.includes('Windows') ? <Monitor size={14} /> : 
                                    agent.os.includes('MacOS') ? <Cpu size={14} /> : <Terminal size={14} />}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs font-black text-white italic tracking-tight">{agent.name}</span>
                                   <span className="text-[9px] text-gray-600 font-bold uppercase">{agent.ip}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={cn(
                               "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                               agent.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                               agent.status === 'pending' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                               agent.status === 'disconnected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                               "bg-gray-500/10 text-gray-500 border-gray-500/20"
                             )}>
                                {agent.status}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[8px] font-black uppercase text-gray-600 italic">
                                   <span>CPU: {agent.cpu}%</span>
                                   <span className="text-blue-500">{agent.network}</span>
                                </div>
                                <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                   <div className={cn("h-full", agent.cpu > 80 ? "bg-red-500" : "bg-blue-500")} style={{ width: `${agent.cpu}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2 text-gray-600 group-hover:text-white transition-all">
                                {expandedAgentId === agent.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                             </div>
                          </td>
                        </tr>

                        {expandedAgentId === agent.id && (
                          <tr>
                            <td colSpan={4} className="p-0 bg-black/40">
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 className="overflow-hidden"
                               >
                                 <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10 border-b border-gray-800">
                                    {/* System Stats */}
                                    <div className="space-y-6">
                                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic border-b border-white/5 pb-2">
                                         {isZh ? '遙測與健康指標' : 'Telemetry & Health'}
                                       </h4>
                                       <div className="grid grid-cols-2 gap-4">
                                          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                             <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-black text-gray-500 uppercase italic">CPU Load</span>
                                                <span className={cn("text-xs font-black italic", agent.cpu > 80 ? "text-red-500" : "text-blue-400")}>{agent.cpu}%</span>
                                             </div>
                                             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className={cn("h-full", agent.cpu > 80 ? "bg-red-500" : "bg-blue-500")} style={{ width: `${agent.cpu}%` }} />
                                             </div>
                                          </div>
                                          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                             <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-black text-gray-500 uppercase italic">RAM Usage</span>
                                                <span className="text-xs font-black text-purple-400 italic">{agent.ram}%</span>
                                             </div>
                                             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500" style={{ width: `${agent.ram}%` }} />
                                             </div>
                                          </div>
                                          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                             <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-black text-gray-500 uppercase italic">Disk Space</span>
                                                <span className="text-xs font-black text-green-400 italic">{agent.disk}% <span className="text-[10px] text-gray-600 ml-1">/ {agent.disk_capacity}</span></span>
                                             </div>
                                             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500" style={{ width: `${agent.disk}%` }} />
                                             </div>
                                          </div>
                                          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                             <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-black text-gray-500 uppercase italic">Network</span>
                                                <span className="text-xs font-black text-cyan-400 italic">{agent.network}</span>
                                             </div>
                                             <div className="flex items-center gap-1.5 mt-1">
                                                <Activity size={10} className="text-cyan-500 animate-pulse" />
                                                <span className="text-[8px] text-gray-600 font-black uppercase">IOPS Active</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Asset Details */}
                                    <div className="space-y-6">
                                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic border-b border-white/5 pb-2">
                                         {isZh ? 'ITSM 資產管理' : 'ITSM Asset management'}
                                       </h4>
                                       <div className="space-y-4">
                                          <div className="flex items-center justify-between text-[11px]">
                                             <span className="text-gray-500 font-bold uppercase italic">{isZh ? '作業系統版本' : 'OS Build'}</span>
                                             <span className="text-white font-black">{agent.os_version}</span>
                                          </div>
                                          <div className="flex items-center justify-between text-[11px]">
                                             <span className="text-gray-500 font-bold uppercase italic">{isZh ? 'Agent 版本' : 'Agent Version'}</span>
                                             <span className="text-blue-400 font-black">v{agent.version}</span>
                                          </div>
                                          <div className="flex items-center justify-between text-[11px]">
                                             <span className="text-gray-500 font-bold uppercase italic">{isZh ? '最後更新' : 'Last Update'}</span>
                                             <span className="text-gray-400 font-black">{agent.update_version}</span>
                                          </div>
                                          <div className="space-y-2">
                                             <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">{isZh ? '軟體清單' : 'Inventory Software'}</span>
                                             <div className="flex flex-wrap gap-2">
                                                {agent.software.map((s, si) => (
                                                  <span key={si} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-gray-400 italic uppercase">
                                                    {s}
                                                  </span>
                                                ))}
                                             </div>
                                          </div>

                                          {/* Alerts & Thresholds */}
                                          <div className="p-4 bg-red-600/5 border border-red-500/10 rounded-2xl space-y-4 mt-2">
                                             <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                   <AlertCircle size={12} className="text-red-500" />
                                                   <h5 className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">{isZh ? '告警閾值' : 'Alert Thresholds'}</h5>
                                                </div>
                                                <div className={cn(
                                                   "w-6 h-3 rounded-full relative transition-colors",
                                                   agent.cpu > 80 ? "bg-red-600" : "bg-gray-800"
                                                )}>
                                                   <div className={cn(
                                                     "absolute top-0.5 w-2 h-2 rounded-full transition-all",
                                                     agent.cpu > 80 ? "right-0.5 bg-white" : "left-0.5 bg-gray-600"
                                                   )} />
                                                </div>
                                             </div>
                                             <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                   <span className="text-[8px] text-gray-400 font-bold uppercase">{isZh ? 'CPU 上限' : 'CPU Max'}</span>
                                                   <input type="number" defaultValue={80} className="w-10 bg-black border border-white/10 rounded px-1 text-[9px] text-white text-right outline-none focus:border-red-500" />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                   <span className="text-[8px] text-gray-400 font-bold uppercase">{isZh ? '記憶體上限' : 'RAM Max'}</span>
                                                   <input type="number" defaultValue={90} className="w-10 bg-black border border-white/10 rounded px-1 text-[9px] text-white text-right outline-none focus:border-red-500" />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                   <span className="text-[8px] text-gray-400 font-bold uppercase">{isZh ? '硬碟上限' : 'Disk Max'}</span>
                                                   <input type="number" defaultValue={85} className="w-10 bg-black border border-white/10 rounded px-1 text-[9px] text-white text-right outline-none focus:border-red-500" />
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Running Tasks */}
                                    <div className="space-y-6">
                                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic border-b border-white/5 pb-2">
                                         {isZh ? '活動任務監控' : 'Active Task Monitor'}
                                       </h4>
                                       <div className="bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[10px] space-y-2 h-[200px] overflow-y-auto">
                                          {agent.processes.length > 0 ? agent.processes.map((p, pi) => (
                                            <div key={pi} className="flex items-center justify-between group/proc pb-1 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                               <span className="text-green-500 font-bold italic">PRO-#{Math.floor(Math.random() * 900) + 100}</span>
                                               <span className="text-gray-400 font-black">{p}</span>
                                               <span className="text-[8px] text-gray-600 uppercase">{isZh ? '執行中' : 'Running'}</span>
                                            </div>
                                          )) : (
                                            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50 italic">
                                              <ZapOff size={24} className="text-gray-700" />
                                              <p className="text-gray-600 uppercase font-black">{isZh ? '無活動程序串流' : 'No Active Process Stream'}</p>
                                            </div>
                                          )}
                                       </div>
                                       <div className="flex gap-2">
                                          <button className="flex-1 py-3 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                                            {isZh ? '中止裝置連線' : 'Terminate Device'}
                                          </button>
                                          <button className="flex-1 py-3 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                                            {isZh ? '稽核攻擊故事線' : 'Audit Storyline'}
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                               </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="p-4 bg-black/40 text-center">
              <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-blue-400 transition-all">View All 1,284 Endpoints</button>
           </div>
        </div>
      </div>
    </div>
  );
}

const THREAT_ACTORS: Record<string, any> = {
  'Mustang Panda': {
    origin: 'China',
    description: 'China-linked cyber espionage group primarily targeting government entities in SE Asia.',
    ttps: ['T1071.001', 'T1566.001', 'T1105'],
    reports: [
      { name: 'Mandiant APT Analysis', url: '#' },
      { name: 'CrowdStrike Intelligence', url: '#' }
    ]
  },
  'Lazarus Group': {
    origin: 'North Korea',
    description: 'DPRK state-sponsored group responsible for high-profile financial theft and espionage.',
    ttps: ['T1059.001', 'T1204.002', 'T1020'],
    reports: [
      { name: 'CISA Alert AA22-109A', url: '#' },
      { name: 'SANS Institute Report', url: '#' }
    ]
  },
  'APT28': {
    origin: 'Russia',
    description: 'Russian military intelligence (GRU) group focused on government and military targets.',
    ttps: ['T1071.001', 'T1547.001', 'T1003'],
    reports: [
      { name: 'Unit 42 Analysis', url: '#' },
      { name: 'Microsoft Threat Intel', url: '#' }
    ]
  }
};

const MITRE_FRAMEWORK = {
  tactics: [
    { id: 'TA0001', name: 'Initial Access', description: 'Adversary is trying to get into your network.' },
    { id: 'TA0002', name: 'Execution', description: 'Adversary is trying to run malicious code.' },
    { id: 'TA0003', name: 'Persistence', description: 'Adversary is trying to maintain their foothold.' },
    { id: 'TA0004', name: 'Privilege Escalation', description: 'Adversary is trying to gain higher-level permissions.' },
    { id: 'TA0005', name: 'Defense Evasion', description: 'Adversary is trying to avoid being detected.' },
    { id: 'TA0006', name: 'Credential Access', description: 'Adversary is trying to steal account names and passwords.' },
    { id: 'TA0007', name: 'Discovery', description: 'Adversary is trying to figure out your environment.' },
    { id: 'TA0008', name: 'Lateral Movement', description: 'Adversary is trying to move through your environment.' },
    { id: 'TA0009', name: 'Collection', description: 'Adversary is trying to gather data of interest to their goal.' },
    { id: 'TA0011', name: 'Command and Control', description: 'Adversary is trying to communicate with compromised systems to control them.' },
    { id: 'TA0010', name: 'Exfiltration', description: 'Adversary is trying to steal data.' },
    { id: 'TA0040', name: 'Impact', description: 'Adversary is trying to manipulate, interrupt, or destroy your systems and data.' },
  ],
  techniques: [
    { id: 'T1566', name: 'Phishing', tacticId: 'TA0001' },
    { id: 'T1190', name: 'Exploit Public-Facing Application', tacticId: 'TA0001' },
    { id: 'T1059', name: 'Command and Scripting Interpreter', tacticId: 'TA0002' },
    { id: 'T1204', name: 'User Execution', tacticId: 'TA0002' },
    { id: 'T1078', name: 'Valid Accounts', tacticId: 'TA0001' },
    { id: 'T1053', name: 'Scheduled Task/Job', tacticId: 'TA0003' },
    { id: 'T1037', name: 'Boot or Logon Initialization Scripts', tacticId: 'TA0003' },
    { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tacticId: 'TA0004' },
    { id: 'T1027', name: 'Obfuscated Files or Information', tacticId: 'TA0005' },
    { id: 'T1070', name: 'Indicator Removal on Host', tacticId: 'TA0005' },
    { id: 'T1003', name: 'OS Credential Dumping', tacticId: 'TA0006' },
    { id: 'T1555', name: 'Credentials from Password Stores', tacticId: 'TA0006' },
    { id: 'T1087', name: 'Account Discovery', tacticId: 'TA0007' },
    { id: 'T1082', name: 'System Information Discovery', tacticId: 'TA0007' },
    { id: 'T1021', name: 'Remote Services', tacticId: 'TA0008' },
    { id: 'T1563', name: 'Remote Service Session Hijacking', tacticId: 'TA0008' },
    { id: 'T1071', name: 'Application Layer Protocol', tacticId: 'TA0011' },
    { id: 'T1550', name: 'Use Alternate Authentication Material', tacticId: 'TA0008' },
    { id: 'T1041', name: 'Exfiltration Over C2 Channel', tacticId: 'TA0010' },
    { id: 'T1486', name: 'Data Encrypted for Impact', tacticId: 'TA0040' },
  ]
};

function MITREMatrixView({ framework, alerts, records, manualTags }: { framework: any, alerts: any[], records: any[], manualTags: any }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const getAllMappedTechniques = () => {
    const fromAlerts = alerts.flatMap(a => (a.mitre || []).concat(manualTags[a.id] || []));
    const fromRecords = records.flatMap(r => (r.mitre || []).concat(manualTags[r.id] || []));
    return Array.from(new Set([...fromAlerts, ...fromRecords]));
  };

  const mappedTechniques = getAllMappedTechniques();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600/20 p-3 rounded-2xl border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <Target className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">MITRE ATT&CK® Matrix</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                {isZh ? '即時對應與聯防偵測到的對手戰術與技術 (TTPs)' : 'Real-time mapping of detected adversary tactics and techniques.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isZh ? '已偵測' : 'Detected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-800 border border-gray-700 rounded"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isZh ? '可觀測' : 'Observable'}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {framework.tactics.map((tactic: any) => (
              <div key={tactic.id} className="flex-1 min-w-[180px] space-y-4">
                <div className="p-3 bg-gray-900 border-b-2 border-gray-800 text-center rounded-t-xl group">
                  <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1 group-hover:text-blue-400 transition-colors">{tactic.id}</div>
                  <div className="text-[11px] font-black text-white uppercase tracking-tight leading-tight">{tactic.name}</div>
                </div>
                <div className="space-y-2">
                  {framework.techniques.filter((tech: any) => tech.tacticId === tactic.id).map((tech: any) => {
                    const isMapped = mappedTechniques.includes(tech.id);
                    return (
                      <div 
                        key={tech.id} 
                        className={cn(
                          "p-4 rounded-xl border transition-all relative group cursor-help",
                          isMapped 
                            ? "bg-orange-600/10 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.05)]" 
                            : "bg-gray-900/40 border-gray-800/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <div className={cn(
                            "text-[9px] font-black mb-1",
                            isMapped ? "text-orange-400" : "text-gray-600"
                          )}>{tech.id}</div>
                          <div className={cn(
                            "text-[10px] font-bold leading-tight uppercase tracking-tight",
                            isMapped ? "text-white" : "text-gray-500"
                          )}>{tech.name}</div>
                        </div>
                        {isMapped && (
                          <div className="absolute top-2 right-2">
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                            />
                          </div>
                        )}
                        
                        {/* Tooltip-like reveal on hover */}
                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                           <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-black border border-gray-700 rounded-lg shadow-2xl z-20">
                             <p className="text-[9px] text-gray-400 leading-relaxed italic">Technique mapped via autonomous Interflow™ correlation scoring.</p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  {framework.techniques.filter((tech: any) => tech.tacticId === tactic.id).length === 0 && (
                    <div className="h-20 border border-dashed border-gray-800 rounded-xl flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest italic">No Mappings</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={14} className="text-orange-400" />
            Active Adversary Profiles
          </h3>
          <div className="space-y-4">
             {Object.entries(THREAT_ACTORS).map(([name, data]: [string, any]) => (
               <div key={name} className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-orange-500/30 transition-all">
                 <div className="flex justify-between items-start mb-2">
                   <div className="text-xs font-black text-white uppercase italic">{name}</div>
                   <span className="text-[9px] font-bold text-orange-400 uppercase bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">{data.origin}</span>
                 </div>
                 <div className="flex flex-wrap gap-1">
                   {data.ttps.map((ttp: string) => (
                     <span key={ttp} className={cn(
                       "px-1.5 py-0.5 rounded text-[8px] font-black",
                       mappedTechniques.includes(ttp.split('.')[0]) ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-500 border border-gray-700"
                     )}>
                       {ttp}
                     </span>
                   ))}
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Target size={120} />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8 border-b border-gray-800 pb-4">Adversary Tactic Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {framework.tactics.slice(0, 8).map((tactic: any) => {
              const count = framework.techniques.filter((tech: any) => tech.tacticId === tactic.id && mappedTechniques.includes(tech.id)).length;
              const total = framework.techniques.filter((tech: any) => tech.tacticId === tactic.id).length;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={tactic.id} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter truncate w-24" title={tactic.name}>{tactic.name}</span>
                    <span className="text-[10px] font-black text-white">{count}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        percentage > 50 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                        percentage > 0 ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" :
                        "bg-gray-800"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 p-4 bg-orange-600/5 rounded-xl border border-orange-500/20">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-orange-500/20 rounded-lg shrink-0">
                <AlertTriangle size={16} className="text-orange-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1 italic">Forensic Observation</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">Adversary activity is concentrated in <span className="text-white font-bold italic">Persistence</span> and <span className="text-white font-bold italic">Lateral Movement</span> phases. Mitigation playbooks 4 & 7 recommended for automated enforcement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function XDRView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const detections = [
    { id: 'DET-001', name: isZh ? '勒索軟體執行嘗試' : 'Ransomware Execution', confidence: 98, source: isZh ? '深度學習 (Deep Learning)' : 'Deep Learning', time: isZh ? '2 分鐘前' : '2 mins ago', actor: 'Lazarus Group', mitre: ['T1486'] },
    { id: 'DET-002', name: isZh ? '異常管理員登入' : 'Unusual Admin Login', confidence: 85, source: 'UEBA', time: isZh ? '15 分鐘前' : '15 mins ago', actor: 'APT28', mitre: ['T1078'] },
    { id: 'DET-003', name: isZh ? '敏感資料外洩 (DNS)' : 'Data Exfiltration (DNS)', confidence: 92, source: 'NTA', time: isZh ? '1 小時前' : '1 hour ago', actor: 'Mustang Panda', mitre: ['T1071'] },
    { id: 'DET-004', name: isZh ? '零日漏洞利用 (Zero-Day)' : 'Zero-Day Exploitation', confidence: 95, source: isZh ? '沙盒 (Sandbox)' : 'Sandbox', time: isZh ? '3 小時前' : '3 hours ago', actor: 'Fancy Bear', mitre: ['T1203'] },
    { id: 'DET-005', name: isZh ? 'SSH 密碼暴力破解' : 'SSH Brute Force', confidence: 78, source: isZh ? '蜜罐 (Honeypot)' : 'Honeypot', time: isZh ? '5 小時前' : '5 hours ago', actor: isZh ? '未知來源' : 'Unknown', mitre: ['T1110'] },
  ];

  const recentRecords = [
    { id: 'REC-001', time: '10:51:20', src: 'Endpoint-01', type: isZh ? '程序啟動' : 'Process Start', ctx: 'powershell.exe -enc ...', actor: 'Lazarus Group', mitre: ['T1059'] },
    { id: 'REC-002', time: '10:50:45', src: 'AWS-VPC-04', type: isZh ? '流量日誌' : 'Flow Log', ctx: '10.0.1.5 -> 185.x.x.x:443', actor: 'APT28', mitre: ['T1071'] },
    { id: 'REC-003', time: '10:50:12', src: 'Auth-Svc', type: isZh ? '登入成功' : 'Login Success', ctx: 'User: admin (MFA)', actor: 'Mustang Panda', mitre: ['T1078'] },
    { id: 'REC-004', time: '10:48:30', src: 'Mail-Server', type: isZh ? 'Outlook 存取' : 'Outlook Access', ctx: 'OAuth Token Hijack', actor: 'Fancy Bear', mitre: ['T1550'] },
  ];

  const interflowStats = [
    { name: isZh ? '網路流量 (Network)' : 'Network', count: '1.2B', status: isZh ? '健康' : 'Healthy' },
    { name: isZh ? '端點設備 (Endpoint)' : 'Endpoint', count: '450M', status: isZh ? '健康' : 'Healthy' },
    { name: isZh ? '雲端服務 (Cloud)' : 'Cloud', count: '890M', status: isZh ? '健康' : 'Healthy' },
    { name: isZh ? '應用系統 (Application)' : 'Application', count: '120M', status: isZh ? '警告' : 'Warning' },
  ];

  const playbooks = [
    { name: isZh ? '勒索軟體自動阻斷與隔離' : 'Ransomware Containment', status: isZh ? '穩定運作' : 'Stable', triggers: 12 },
    { name: isZh ? '資料外洩即時防護' : 'Data Exfiltration Protection', status: isZh ? '穩定運作' : 'Stable', triggers: 5 },
    { name: isZh ? '社交工程釣魚自動處置' : 'Phishing Auto-Response', status: isZh ? '執行中' : 'Running', triggers: 8 },
    { name: isZh ? '雲端資安態勢即時稽核 (CSPM)' : 'Cloud Security Posture (CSPM)', status: isZh ? '穩定運作' : 'Stable', triggers: 24 },
  ];

  const [activeSubTab, setActiveSubTab] = useState<'hunting' | 'interflow' | 'detection' | 'soar' | 'matrix' | 'agents' | 'assets'>('hunting');
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActor, setSelectedActor] = useState('All');
  const [selectedUEBAEntity, setSelectedUEBAEntity] = useState<any | null>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [isLogLoading, setIsLogLoading] = useState(false);
  const [manualMitreTags, setManualMitreTags] = useState<{[key: string]: string[]}>({});
  const [taggingRecord, setTaggingRecord] = useState<any | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [soarLogs, setSoarLogs] = useState<any[]>([]);
  const [isAutoResponseEnabled, setIsAutoResponseEnabled] = useState(true);
  const [activeAutoResponse, setActiveAutoResponse] = useState<any | null>(null);

  const triggerPlaybook = (detection: any) => {
    const newLog = {
      id: `SOAR-${Math.floor(Math.random() * 10000)}`,
      time: new Date().toLocaleTimeString(),
      incident: detection.name,
      actions: [
        { type: isZh ? '網絡/主機隔離' : 'Isolation', target: 'Endpoint-WS-22', status: isZh ? '已完成' : 'Completed' },
        { type: isZh ? '防火牆規則套用' : 'Firewall', target: 'Block 185.x.x.x', status: isZh ? '已完成' : 'Completed' }
      ],
      target: detection.actor,
      status: isZh ? '強制執行完成' : 'Enforced'
    };
    
    setSoarLogs(prev => [newLog, ...prev]);
    setActiveAutoResponse({ detection, log: newLog });
    
    // Auto-clear notification after 8 seconds
    setTimeout(() => setActiveAutoResponse(null), 8000);
  };

  useEffect(() => {
    if (isAutoResponseEnabled) {
      // Look for critical exfiltration detection
      const criticalExfiltration = detections.find(d => 
        (d.name.includes('Exfiltration') || d.name.includes('資料外洩')) && 
        !soarLogs.some(log => log.incident === d.name)
      );
      
      if (criticalExfiltration) {
        // Delay slightly to simulate real-time detection and response
        const timer = setTimeout(() => triggerPlaybook(criticalExfiltration), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAutoResponseEnabled, detections]);

  const THREAT_ACTORS_LOCAL: Record<string, any> = THREAT_ACTORS;

  const MITRETaggingModal = () => {
    if (!taggingRecord) return null;
    const currentTags = (taggingRecord.mitre || []).concat(manualMitreTags[taggingRecord.id] || []);

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600/20 p-2 rounded-lg border border-orange-500/30">
                <Tag className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  {isZh ? '手動 MITRE ATT&CK 戰術標註' : 'Manual MITRE ATT&CK Tagging'}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">{taggingRecord.id} | {taggingRecord.type}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowTagModal(false)}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic mb-4">
                {isZh ? '選擇欲對應之戰術技巧 (Techniques)' : 'Select Techniques to Map'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MITRE_FRAMEWORK.techniques.map((tech) => {
                  const isSelected = currentTags.includes(tech.id);
                  const tactic = MITRE_FRAMEWORK.tactics.find(t => t.id === tech.tacticId);
                  
                  return (
                    <button
                      key={tech.id}
                      onClick={() => {
                        const newTags = isSelected 
                          ? manualMitreTags[taggingRecord.id]?.filter(id => id !== tech.id) || []
                          : [...(manualMitreTags[taggingRecord.id] || []), tech.id];
                        
                        setManualMitreTags({
                          ...manualMitreTags,
                          [taggingRecord.id]: newTags
                        });
                      }}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        isSelected 
                          ? "bg-orange-600/10 border-orange-500/40" 
                          : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded mt-1 border flex items-center justify-center transition-all",
                        isSelected ? "bg-orange-500 border-orange-400" : "bg-gray-800 border-gray-700"
                      )}>
                        {isSelected && <Check size={10} className="text-black font-black" />}
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-white leading-tight mb-1">{tech.id}: {tech.name}</div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{tactic?.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-900/50 border-t border-gray-800 flex justify-end gap-3">
            <button 
              onClick={() => setShowTagModal(false)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
            >
              {isZh ? '關閉並套用映射標籤' : 'Close & Apply Mapping'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  useEffect(() => {
    if (activeSubTab === 'interflow') {
      const loadLiveLogs = async () => {
        setIsLogLoading(true);
        try {
          const logs = await siemService.fetchLogs('*', 20);
          if (logs && logs.length > 0) {
            setLiveLogs(logs);
          }
        } catch (err) {
          console.error("Live log fetch failed, showing mock data instead.");
        } finally {
          setIsLogLoading(false);
        }
      };
      loadLiveLogs();
    }
  }, [activeSubTab]);

  const threatActorsList = ['All', 'APT28', 'Lazarus Group', 'Mustang Panda', 'Fancy Bear', 'Sandworm'];

  const recordsToDisplay = liveLogs.length > 0 ? liveLogs.map(log => ({
    actor: log.app || log.container_name || log.service || 'System',
    time: log._time || new Date().toISOString(),
    src: log.host || log.ip || log.source || 'Internal',
    type: log.level || log.status || 'LOG',
    ctx: log._msg || log.message || JSON.stringify(log)
  })) : recentRecords;

  const filteredDetections = detections.filter(d => 
    (selectedActor === 'All' || d.actor === selectedActor) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.actor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRecords = recordsToDisplay.filter(r => 
    (selectedActor === 'All' || r.actor === selectedActor) &&
    (r.ctx.toLowerCase().includes(searchQuery.toLowerCase()) || r.actor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'assets':
        return <AssetsManager />;
      case 'agents':
        return <AgentMonitoringView />;
      case 'hunting':
        return (
          <div className="space-y-8">
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <div className="flex justify-center items-center gap-3 mb-4">
                  <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                    <SearchCode className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{isZh ? '威脅獵捕 (Threat Hunting)' : 'Threat Hunting'}</h3>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Search className="text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                    </div>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isZh ? '搜尋 Interflow™ 紀錄（依組織、內容或關鍵字）...' : 'Search Interflow™ records by actor, context, or query...'}
                      className="w-full bg-gray-900/50 border-2 border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-lg focus:border-blue-500 outline-none transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                      <kbd className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-500 font-mono">⌘K</kbd>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center items-center gap-3">
                    <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800">
                      <Users size={14} className="text-gray-500" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                        {isZh ? '目標威脅組織：' : 'Target Actor:'}
                      </span>
                    </div>
                    {threatActorsList.map(actor => (
                      <button 
                        key={actor}
                        onClick={() => setSelectedActor(actor)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                          selectedActor === actor 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                            : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-blue-500"
                        )}
                      >
                        {actor === 'All' && isZh ? '全部' : actor}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {(isZh ? ['過去 24 小時', '僅限嚴重級', '來源: AWS', '類型: 程序'] : ['Last 24h', 'Critical Only', 'Source: AWS', 'Type: Process']).map(tag => (
                    <button key={tag} className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-[10px] font-bold text-gray-500 hover:text-white hover:border-gray-700 transition-all uppercase tracking-widest">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="text-blue-400" size={20} />
                      <h3 className="font-bold text-white">{isZh ? '近期 Interflow™ 資料紀錄' : 'Recent Interflow™ Records'}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">
                        {isZh ? `顯示 ${filteredRecords.length} 筆比對紀錄` : `Showing ${filteredRecords.length} match(es)`}
                      </div>
                      <button className="text-xs text-blue-400 hover:underline">{isZh ? '檢視全部' : 'View All'}</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-900/50 border-b border-gray-800">
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">{isZh ? '威脅組織' : 'Actor'}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isZh ? '時間戳記' : 'Timestamp'}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isZh ? '來源' : 'Source'}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isZh ? '事件類型' : 'Event Type'}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-orange-500 italic">{isZh ? 'MITRE ATT&CK 映射' : 'MITRE ATT&CK Mapping'}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isZh ? '內容脈絡' : 'Context'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredRecords.map((row, i) => (
                          <React.Fragment key={i}>
                            <tr 
                              onClick={() => setExpandedRecordId(expandedRecordId === i ? null : i)}
                              className={cn(
                                "hover:bg-gray-800/30 transition-colors cursor-pointer group",
                                expandedRecordId === i ? "bg-white/[0.03]" : ""
                              )}
                            >
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "text-[9px] font-black px-2 py-0.5 rounded border uppercase block text-center min-w-[90px]",
                                  row.actor === 'Lazarus Group' ? "text-red-400 bg-red-400/10 border-red-400/20" :
                                  row.actor === 'APT28' ? "text-purple-400 bg-purple-400/10 border-purple-400/20" :
                                  row.actor === 'Mustang Panda' ? "text-orange-400 bg-orange-400/10 border-orange-400/20" :
                                  "text-blue-400 bg-blue-400/10 border-blue-400/20"
                                )}>
                                  {row.actor}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-gray-500 whitespace-nowrap">{row.time}</td>
                              <td className="px-6 py-4 text-xs text-gray-300">{row.src}</td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 uppercase whitespace-nowrap">
                                  {row.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {(((row as any).mitre || []) as string[]).concat(manualMitreTags[(row as any).id] || []).map((tagId: string) => (
                                    <span key={tagId} className="px-2 py-0.5 bg-orange-900/20 border border-orange-800/40 rounded text-orange-400 text-[9px] font-black tracking-tighter" title={MITRE_FRAMEWORK.techniques.find(t => t.id === tagId)?.name}>
                                      {tagId}
                                    </span>
                                  ))}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaggingRecord(row);
                                      setShowTagModal(true);
                                    }}
                                    className="p-1 hover:bg-orange-600/20 rounded text-orange-500 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-orange-500/30"
                                  >
                                    <Tag size={10} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs font-mono text-gray-400 truncate max-w-[400px]">{row.ctx}</span>
                                  <div className="text-gray-700 group-hover:text-white transition-all">
                                    {expandedRecordId === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {expandedRecordId === i && (
                              <tr className="bg-black/40">
                                <td colSpan={6} className="p-0">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 border-b border-gray-800">
                                      <div className="space-y-4">
                                        <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-2">
                                          <RadarIcon size={12} /> {isZh ? '鑑識地理位置' : 'Forensic Geolocation'}
                                        </h4>
                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 font-bold uppercase">{isZh ? '來源 IP' : 'Source IP'}</span>
                                            <span className="text-white font-mono">{row.src.split(' ')[0]}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 font-bold uppercase">{isZh ? '地理位置' : 'Location'}</span>
                                            <span className="text-white">{isZh ? '平壤，北韓 (代理跳板節點)' : 'Pyongyang, NK (Proxy Exit)'}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 font-bold uppercase">ISP</span>
                                            <span className="text-blue-400 italic">Star Joint Venture Co.</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <h4 className="text-[9px] font-black text-purple-400 uppercase tracking-widest italic flex items-center gap-2">
                                          <ShieldCheck size={12} /> {isZh ? 'AI 偵測策略' : 'AI Detection Strategy'}
                                        </h4>
                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 font-bold uppercase">{isZh ? '規則 ID' : 'Rule ID'}</span>
                                            <span className="text-purple-400 font-mono">XDR-SIG-8821-L</span>
                                          </div>
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 font-bold uppercase">{isZh ? '模型可信度' : 'Model Conf.'}</span>
                                            <span className="text-white">99.4% ({isZh ? '於 MITRE 訓練' : 'Trained on MITRE'})</span>
                                          </div>
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 font-bold uppercase">{isZh ? '攻擊戰術' : 'Tactics'}</span>
                                            <span className="text-gray-400 italic">{isZh ? '透過 C2 中繼站外洩資料' : 'Exfiltration over C2'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Threat Actor Intelligence Section */}
                                      <div className="space-y-4">
                                        <h4 className="text-[9px] font-black text-orange-400 uppercase tracking-widest italic flex items-center gap-2 text-left">
                                          <Target size={12} /> {isZh ? '威脅組織情報' : 'Threat Actor Intelligence'}
                                        </h4>
                                        <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 space-y-3">
                                          {THREAT_ACTORS_LOCAL[row.actor] ? (
                                            <>
                                              <div className="flex justify-between items-start text-left">
                                                <div>
                                                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">{isZh ? '組織身份' : 'Actor Identity'}</span>
                                                  <span className="text-white font-bold">{row.actor}</span>
                                                  <span className="text-[9px] text-orange-400 font-bold ml-2 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">{THREAT_ACTORS_LOCAL[row.actor].origin}</span>
                                                </div>
                                                <div className="text-right">
                                                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">{isZh ? '已知 TTP 戰術' : 'Known TTPs'}</span>
                                                  <div className="flex flex-wrap gap-1 justify-end">
                                                    {THREAT_ACTORS_LOCAL[row.actor].ttps.map((ttp: string) => (
                                                      <span key={ttp} className="px-1.5 py-0.5 bg-gray-800 rounded text-[8px] font-bold text-gray-400 border border-gray-700">{ttp}</span>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-left">
                                                <p className="text-[10px] text-gray-300 leading-tight italic">
                                                  "{THREAT_ACTORS_LOCAL[row.actor].description}"
                                                </p>
                                              </div>
                                              <div className="pt-2 border-t border-orange-500/10 space-y-1.5 text-left">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase block">{isZh ? '外部 CTI 報告' : 'External CTI Reports'}</span>
                                                <div className="flex gap-2">
                                                  {THREAT_ACTORS_LOCAL[row.actor].reports.map((report: any, i: number) => (
                                                    <a key={i} href={report.url} className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold underline decoration-blue-400/30">
                                                      <ExternalLink size={10} />
                                                      {report.name}
                                                    </a>
                                                  ))}
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <div className="text-center py-4">
                                              <p className="text-[10px] text-gray-500 font-bold italic uppercase tracking-tighter">
                                                {isZh ? '此簽章尚無歸因資料檔' : 'No attribution profile available for this signature'}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic flex items-center gap-2 text-left">
                                          <Terminal size={12} /> {isZh ? '原始事件串流' : 'Raw Event Stream'}
                                        </h4>
                                        <div className="bg-black p-4 rounded-xl border border-white/5 font-mono text-[9px] text-green-500/80 leading-relaxed max-h-[120px] overflow-y-auto">
                                          {"{"}
                                          <br />
                                          &nbsp;&nbsp;"event_uuid": "c-882-xf-99",<br />
                                          &nbsp;&nbsp;"actor_sig": "{row.actor}",<br />
                                          &nbsp;&nbsp;"payload": "{row.ctx}",<br />
                                          &nbsp;&nbsp;"entropy": 7.82,<br />
                                          &nbsp;&nbsp;"agent_health": "stable"<br />
                                          {"}"}
                                        </div>
                                        <div className="flex gap-2">
                                          <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-700">
                                            {isZh ? '隔離節點' : 'Isolate Node'}
                                          </button>
                                          <button className="flex-1 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:text-white">
                                            {isZh ? '數據轉軸分析' : 'Pivot Data'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                    {filteredRecords.length === 0 && (
                      <div className="p-12 text-center">
                        <UserMinus className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h4 className="text-gray-500 font-bold uppercase text-[10px]">
                          {isZh ? '無符合目前篩選條件之對手紀錄' : 'No adversary records match current filter criteria'}
                        </h4>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-1 border-l-2 border-blue-500/50 pl-3 ml-[-20px]">
                    {isZh ? '威脅組織告警' : 'Adversary Alerting'}
                  </h3>
                  <div className="space-y-6">
                    {filteredDetections.map((det) => (
                      <div key={det.id} className="group">
                        <div 
                          onClick={() => setExpandedAlertId(expandedAlertId === det.id ? null : det.id)}
                          className={cn(
                            "p-4 bg-gray-900/30 border border-gray-800 rounded-xl space-y-3 hover:border-blue-500/30 transition-all cursor-pointer",
                            expandedAlertId === det.id ? "border-blue-500/50 bg-blue-500/[0.02]" : ""
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter opacity-70 mb-0.5">{det.actor}</span>
                              <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{det.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-400">{det.confidence}%</span>
                              <div className="text-gray-700 group-hover:text-gray-400 transition-colors">
                                {expandedAlertId === det.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${det.confidence}%` }}
                              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex flex-wrap gap-1 flex-1">
                              {(det.mitre || []).concat(manualMitreTags[det.id] || []).map((tagId: string) => (
                                <span key={tagId} className="px-2 py-0.5 bg-orange-900/10 border border-orange-800/20 rounded text-orange-400 text-[8px] font-black tracking-tighter" title={MITRE_FRAMEWORK.techniques.find(t => t.id === tagId)?.name}>
                                  {tagId}
                                </span>
                              ))}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaggingRecord({ ...det, type: 'Alert' });
                                  setShowTagModal(true);
                                }}
                                className="p-1 hover:bg-orange-600/20 rounded text-orange-500 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-orange-500/30"
                              >
                                <Tag size={10} />
                              </button>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                               <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{det.source}</div>
                               <div className="text-[9px] text-gray-600">{det.time}</div>
                            </div>
                          </div>
                        </div>

                        {expandedAlertId === det.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="p-6 bg-black/40 border border-gray-800 rounded-xl space-y-6">
                              {/* Threat Actor Intelligence section */}
                              <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-orange-400 uppercase tracking-widest italic flex items-center gap-2 text-left">
                                  <Target size={12} /> {isZh ? '威脅組織情報' : 'Threat Actor Intelligence'}
                                </h4>
                                <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 space-y-3">
                                  {THREAT_ACTORS_LOCAL[det.actor] ? (
                                    <>
                                      <div className="flex justify-between items-start text-left">
                                        <div>
                                          <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">{isZh ? '組織身份' : 'Actor Identity'}</span>
                                          <span className="text-white font-bold">{det.actor}</span>
                                          <span className="text-[9px] text-orange-400 font-bold ml-2 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">{THREAT_ACTORS_LOCAL[det.actor].origin}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">{isZh ? '已知 TTP 戰術' : 'Known TTPs'}</span>
                                          <div className="flex flex-wrap gap-1 justify-end">
                                            {THREAT_ACTORS_LOCAL[det.actor].ttps.map((ttp: string) => (
                                              <span key={ttp} className={cn(
                                                "px-1.5 py-0.5 bg-gray-800 rounded text-[8px] font-bold border border-gray-700",
                                                (det.mitre || []).includes(ttp.split('.')[0]) ? "text-orange-400 border-orange-400/30" : "text-gray-500"
                                              )}>{ttp}</span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-left">
                                        <p className="text-[10px] text-gray-300 leading-tight italic">
                                          "{THREAT_ACTORS_LOCAL[det.actor].description}"
                                        </p>
                                      </div>
                                      <div className="pt-2 border-t border-orange-500/10 space-y-1.5 text-left">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase block">{isZh ? '外部 CTI 報告' : 'External CTI Reports'}</span>
                                        <div className="flex gap-2">
                                          {THREAT_ACTORS_LOCAL[det.actor].reports.map((report: any, i: number) => (
                                            <a key={i} href={report.url} className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold underline decoration-blue-400/30">
                                              <ExternalLink size={10} />
                                              {report.name}
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-center py-4">
                                      <p className="text-[10px] text-gray-500 font-bold italic uppercase tracking-tighter">
                                        {isZh ? '此簽章尚無歸因資料檔' : 'No attribution profile available for this signature'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Alert Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-2 text-left">
                                    <Zap size={12} /> {isZh ? '建議處置應答' : 'Recommended Response'}
                                  </h4>
                                  <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 space-y-3 text-left">
                                    <div className="text-[10px] text-gray-400 leading-relaxed">
                                      {isZh 
                                        ? `Interflow™ 引擎根據 ${det.confidence}% 可信度分數，建議立即進行自主阻斷。`
                                        : `The Interflow™ engine recommends autonomous containment based on ${det.confidence}% confidence scoring.`
                                      }
                                    </div>
                                    <button 
                                      onClick={() => triggerPlaybook(det)}
                                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                    >
                                      {isZh ? '強制執行隔離劇本' : 'Enforce Isolation Playbook'}
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic flex items-center gap-2 text-left">
                                    <Database size={12} /> {isZh ? '關聯鑑識事證' : 'Associated Evidence'}
                                  </h4>
                                  <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 space-y-2 text-left">
                                    <div className="flex justify-between items-center p-2 bg-black/20 rounded border border-gray-800">
                                      <span className="text-[9px] text-gray-400 font-mono">Process-Tree-Dump.bin</span>
                                      <span className="text-[8px] font-bold text-blue-400 uppercase">{isZh ? '數位證物' : 'Artifact'}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-black/20 rounded border border-gray-800">
                                      <span className="text-[9px] text-gray-400 font-mono">Pcap-Extract-C2.pcap</span>
                                      <span className="text-[8px] font-bold text-blue-400 uppercase">PCAP</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                    {filteredDetections.length === 0 && (
                      <div className="py-8 text-center bg-black/20 rounded-xl border border-dashed border-gray-800">
                        <p className="text-[10px] font-bold text-gray-600 uppercase">{isZh ? '安全狀態良好' : 'Clear state'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* UEBA High-Risk Entities Widget */}
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                      <Brain size={16} className="text-blue-400" />
                      {isZh ? '高風險實體 (UEBA)' : 'High-Risk Entities (UEBA)'}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {UEBA_HIGH_RISK_ENTITIES.map((entity) => (
                      <div 
                        key={entity.id} 
                        onClick={() => setSelectedUEBAEntity(entity)}
                        className="p-4 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border",
                              entity.status === 'Critical' ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            )}>
                              {entity.avatar || entity.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{entity.name}</div>
                              <div className="text-[10px] text-gray-500 font-bold">{entity.department}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-lg font-black italic", entity.score > 80 ? "text-red-500" : "text-blue-500")}>
                              {entity.score}
                            </div>
                            <div className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">{isZh ? '風險分數' : 'Score'}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {entity.riskFactors.slice(0, 2).map((factor, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-800 rounded text-[9px] font-bold text-gray-400 border border-gray-700">
                              {factor}
                            </span>
                          ))}
                          {entity.riskFactors.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[9px] font-bold text-gray-500">
                              +{entity.riskFactors.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'interflow':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {interflowStats.map((stat) => (
                <div key={stat.name} className="bg-[#111114] border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {stat.name.includes('Network') || stat.name.includes('網路') ? <Activity size={48} /> : null}
                    {stat.name.includes('Endpoint') || stat.name.includes('端點') ? <Monitor size={48} /> : null}
                    {stat.name.includes('Cloud') || stat.name.includes('雲端') ? <Cloud size={48} /> : null}
                    {stat.name.includes('Application') || stat.name.includes('應用') ? <AppWindow size={48} /> : null}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{stat.name} {isZh ? '數據' : 'Data'}</div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.count}</div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", stat.status === 'Healthy' || stat.status === '健康' ? "bg-green-500" : "bg-orange-500")}></div>
                    <span className={cn("text-[10px] font-bold uppercase", stat.status === 'Healthy' || stat.status === '健康' ? "text-green-500" : "text-orange-500")}>
                      {stat.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#111114] border border-gray-800 rounded-xl p-8">
              <h3 className="text-lg font-bold text-white mb-8">{isZh ? 'Interflow™ 資料湖架構' : 'Interflow™ Data Lake Architecture'}</h3>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="grid grid-cols-2 gap-4 w-full lg:w-1/3">
                  {(isZh ? ['感測器 (Sensors)', '端點代理 (Agents)', '接收器 (Receivers)', '日誌轉發器 (Forwarders)'] : ['Sensors', 'Agents', 'Receivers', 'Log Forwarders']).map(item => (
                    <div key={item} className="p-4 bg-gray-900 border border-gray-800 rounded-xl text-center">
                      <div className="text-xs font-bold text-gray-400">{item}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-12 h-1 bg-blue-500/30 rounded-full relative">
                    <div className="absolute inset-0 bg-blue-500 animate-[dash_2s_linear_infinite]" style={{ strokeDasharray: "4, 4" }}></div>
                  </div>
                </div>
                <div className="w-full lg:w-1/3 p-8 bg-blue-600/10 border-2 border-blue-500/30 rounded-2xl text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    Interflow™ Processor
                  </div>
                  <div className="text-xl font-bold text-white mb-2">{isZh ? '脈絡化資訊擴增' : 'Contextual Enrichment'}</div>
                  <p className="text-xs text-gray-500">
                    {isZh ? '將多源數據標準化為具備完整資安脈絡之統一紀錄。' : 'Normalizing multi-source data into unified records with full security context.'}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-12 h-1 bg-blue-500/30 rounded-full"></div>
                </div>
                <div className="w-full lg:w-1/3 p-8 bg-gray-900 border border-gray-800 rounded-2xl text-center">
                  <Database className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <div className="text-xl font-bold text-white mb-2">{isZh ? '資安資料湖' : 'Data Lake'}</div>
                  <p className="text-xs text-gray-500">
                    {isZh ? '高效能存儲，專用於鑑識調查與機器學習模型訓練。' : 'High-performance storage for forensic investigation and ML training.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'soar':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-1 border-l-2 border-blue-500/50 pl-3 ml-[-20px]">
                    {isZh ? '運行中 SOAR 劇本' : 'Active SOAR Playbooks'}
                  </h3>
                  <div className="space-y-4">
                    {playbooks.map((pb) => (
                      <div key={pb.name} className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-blue-500/30 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-600/20 p-2 rounded-lg">
                            <Zap size={18} className="text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{pb.name}</div>
                            <div className="text-[10px] text-gray-500">
                              {isZh ? `今日已執行 ${pb.triggers + (soarLogs.filter(l => l.incident === pb.name).length)} 次自動處置` : `${pb.triggers + (soarLogs.filter(l => l.incident === pb.name).length)} Automated Responses Today`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                            pb.status === 'Running' || pb.status === '執行中' ? "bg-blue-500/10 text-blue-400 animate-pulse" : "bg-green-500/10 text-green-400"
                          )}>
                            {pb.status}
                          </span>
                          <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                            <Settings size={14} className="text-gray-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automation Action History */}
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 border-l-2 border-purple-500/50 pl-3 ml-[-20px]">
                      {isZh ? '自動化處置歷史' : 'Automation History'}
                    </h3>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-600/10 border border-blue-500/20 rounded">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                         <span className="text-[9px] font-black text-blue-400 uppercase">{isZh ? '引擎就緒' : 'Engine Ready'}</span>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {soarLogs.length === 0 ? (
                      <div className="py-12 text-center bg-black/20 rounded-xl border border-dashed border-gray-800">
                        <p className="text-[10px] font-bold text-gray-600 uppercase italic">
                          {isZh ? '等待自動觸發事件中...' : 'Waiting for auto-trigger events...'}
                        </p>
                      </div>
                    ) : (
                      soarLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-3 group hover:border-blue-500/30 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="font-mono text-blue-400 font-bold">{log.id}</span>
                                <span className="text-gray-500 font-bold tracking-tighter opacity-50">•</span>
                                <span className="text-gray-500 font-bold">{log.time}</span>
                              </div>
                              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">{log.incident}</h4>
                            </div>
                            <span className="text-[9px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 uppercase shadow-[0_0_10px_rgba(74,222,128,0.1)]">{log.status}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {log.actions?.map((action: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg border border-gray-800/50 group-hover:bg-blue-600/5 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-600/10 rounded">
                                    {action.type.includes('Isolation') || action.type.includes('隔離') ? <Monitor size={12} className="text-blue-400" /> : <Shield size={12} className="text-blue-400" />}
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-tight">{action.type}</div>
                                    <div className="text-[9px] text-gray-500 font-mono italic">{action.target}</div>
                                  </div>
                                </div>
                                <div className="p-1 rounded-full bg-green-500/20">
                                  <Check size={10} className="text-green-500" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 h-fit sticky top-0">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 border-l-2 border-green-500/50 pl-3 ml-[-20px]">
                    {isZh ? 'MTTD 平均偵測時間最佳化' : 'MTTD Optimization'}
                  </h3>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Zap size={16} className="text-green-500" />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-8">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="74" fill="transparent" stroke="#1f2937" strokeWidth="12" />
                      <circle cx="80" cy="80" r="74" fill="transparent" stroke="url(#blue-grad)" strokeWidth="12" strokeDasharray="465" strokeDashoffset="58" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-black text-white italic tracking-tighter">8.2x</div>
                      <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mt-1">{isZh ? '效率提升' : 'Efficiency Gain'}</div>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-xl font-black text-white uppercase italic tracking-tighter">{isZh ? 'MTTD 縮短優化引擎' : 'MTTD Reduction Engine'}</div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      {isZh ? '劇本將基於高可信度之 Interflow™ 關聯分析分數自主觸發執行。' : 'Playbooks are autonomously triggered based on high-confidence Interflow™ correlation scoring.'}
                    </p>
                  </div>
                  
                  <div className="w-full mt-8 pt-8 border-t border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isZh ? '自動應答模式' : 'Auto-Response Mode'}</span>
                      <button 
                        onClick={() => setIsAutoResponseEnabled(!isAutoResponseEnabled)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors",
                          isAutoResponseEnabled ? "bg-blue-600" : "bg-gray-800"
                        )}
                      >
                        <motion.div 
                          animate={{ x: isAutoResponseEnabled ? 22 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg" 
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'detection':
        return <AIDetectionView />;
      case 'matrix':
        return <MITREMatrixView framework={MITRE_FRAMEWORK} alerts={detections} records={recordsToDisplay} manualTags={manualMitreTags} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {selectedUEBAEntity && (
          <EntityInvestigationDialog 
            entity={selectedUEBAEntity} 
            onClose={() => setSelectedUEBAEntity(null)} 
          />
        )}
      </AnimatePresence>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{isZh ? '開放式 XDR 平台 (Open XDR)' : 'Open XDR Platform'}</h2>
            <p className="text-xs text-gray-500 mt-1">{isZh ? '統一威脅偵測、聯動應答與威脅獵捕平台' : 'Unified Detection, Response & Threat Hunting'}</p>
          </div>
        </div>
        
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'hunting', label: isZh ? '威脅獵捕' : 'Threat Hunting', icon: <SearchCode className="w-3.5 h-3.5" /> },
            { id: 'assets', label: isZh ? '端點資產管理' : '端點資產管理', icon: <Monitor className="w-3.5 h-3.5" /> },
            { id: 'agents', label: isZh ? 'Agent 監控' : 'Agent Monitoring', icon: <Monitor className="w-3.5 h-3.5" /> },
            { id: 'interflow', label: isZh ? 'Interflow™ 資料湖' : 'Interflow™ Lake', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'detection', label: isZh ? 'AI 威脅偵測' : 'AI Detection', icon: <Brain className="w-3.5 h-3.5" /> },
            { id: 'soar', label: isZh ? 'SOAR 劇本自動化' : 'SOAR Playbooks', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'matrix', label: isZh ? 'MITRE 戰術矩陣' : 'MITRE Matrix', icon: <Target className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeSubTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderSubContent()}
      </motion.div>

      {/* SOAR Auto-Response Notification */}
      <AnimatePresence>
        {activeAutoResponse && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[200] w-96 font-sans"
          >
            <div className="bg-[#111114] border-2 border-blue-500/50 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] overflow-hidden text-left text-white">
              <div className="bg-blue-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-white animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{isZh ? '自主應答劇本已觸發' : 'Autonomous Playbook Triggered'}</span>
                </div>
                <button onClick={() => setActiveAutoResponse(null)}>
                  <X size={14} className="text-white/70 hover:text-white" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-[9px] font-bold text-blue-400 uppercase mb-1">{isZh ? '偵測到之威脅' : 'Detected Threat'}</div>
                  <div className="text-sm font-black text-white uppercase italic tracking-tighter">
                    {activeAutoResponse.detection.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-gray-500 uppercase">{isZh ? '強制執行之自動處置' : 'Automated Actions Enforced'}</div>
                  {activeAutoResponse.log.actions.map((action: any, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (i * 0.2) }}
                      className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800"
                    >
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                         <span className="text-[10px] font-bold text-gray-300">{action.type}</span>
                      </div>
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">{action.status}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-gray-800">
                  <div className="text-[9px] text-gray-500 font-mono italic">
                    {isZh ? '目標身份: ' : 'Target Identity: '}{activeAutoResponse.log.target}
                  </div>
                  <button 
                    onClick={() => setActiveSubTab('soar')}
                    className="text-[10px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors"
                  >
                    {isZh ? '詳細資料' : 'Details'}
                  </button>
                </div>
              </div>
              
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HoneypotMapView() {
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'honeypot'>('map');
  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  const attackLines = [
    { from: [116.4074, 39.9042], to: [121.5654, 25.0330], color: "#ef4444" }, // Beijing to Taipei
    { from: [37.6173, 55.7558], to: [121.5654, 25.0330], color: "#ef4444" }, // Moscow to Taipei
    { from: [-74.0060, 40.7128], to: [121.5654, 25.0330], color: "#3b82f6" }, // NY to Taipei (Friendly?)
    { from: [126.9780, 37.5665], to: [121.5654, 25.0330], color: "#ef4444" }, // Seoul to Taipei
    { from: [4.8952, 52.3702], to: [121.5654, 25.0330], color: "#ef4444" }, // Amsterdam to Taipei
  ];

  const honeypotStats = [
    { name: 'Cowrie (SSH/Telnet)', attacks: 12403, status: 'Active' },
    { name: 'Dionaea (SMB/MSSQL)', attacks: 8542, status: 'Active' },
    { name: 'HoneyTrap (Generic)', attacks: 3210, status: 'Active' },
    { name: 'Mailoney (SMTP)', attacks: 1450, status: 'Active' },
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'map':
        return (
          <div className="space-y-6">
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 min-h-[600px] flex flex-col gap-6 overflow-hidden relative">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600/20 p-2 rounded-lg border border-red-500/30">
                    <Globe className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Global Attack Map</h3>
                    <p className="text-xs text-gray-500">Real-time visualization of honeypot triggers</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest italic">Live Attacks</span>
                  </div>
                  <div className="h-4 w-px bg-gray-800"></div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">2,401</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black">Events/Min</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-gray-900/30 rounded-xl border border-gray-800 relative group overflow-hidden">
                <ComposableMap 
                  projectionConfig={{ 
                    scale: 200,
                    center: [20, 10]
                  }}
                  className="w-full h-full"
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#1a1a1e"
                          stroke="#374151"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#1f2937", outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>
                  
                  {attackLines.map((line, i) => (
                    <MapLine
                      key={i}
                      from={line.from as [number, number]}
                      to={line.to as [number, number]}
                      stroke={line.color}
                      strokeWidth={1}
                      strokeLinecap="round"
                      className="animate-[dash_3s_linear_infinite]"
                      style={{ strokeDasharray: "4, 4" }}
                    />
                  ))}

                  <Marker coordinates={[121.5654, 25.0330]}>
                    <motion.circle
                      initial={{ r: 0, opacity: 0 }}
                      animate={{ r: [4, 8, 4], opacity: [0.6, 0.4, 0.6] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      fill="#ef4444"
                    />
                    <circle r={3} fill="#ef4444" stroke="#fff" strokeWidth={1} />
                    <text 
                      textAnchor="middle" 
                      y={-15} 
                      style={{ fontFamily: "Inter", fill: "#fff", fontSize: "10px", fontWeight: "bold", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      Local Node (T-Pot)
                    </text>
                  </Marker>
                </ComposableMap>

                <div className="absolute bottom-6 right-6 bg-gray-900/80 backdrop-blur-md border border-gray-800 p-4 rounded-xl space-y-3 z-10">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Top Attack Sources</h4>
                  <div className="space-y-2">
                    {[
                      { country: 'China', count: '45%', color: 'bg-red-500' },
                      { country: 'Russia', count: '22%', color: 'bg-orange-500' },
                      { country: 'USA', count: '12%', color: 'bg-blue-500' },
                    ].map((item) => (
                      <div key={item.country} className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>
                        <span className="text-[10px] text-gray-300 w-12">{item.country}</span>
                        <span className="text-[10px] font-bold text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Recent Honeypot Events</h3>
                <div className="space-y-4">
                  {[
                    { time: '10:42:01', ip: '185.234.219.12', type: 'SSH Brute Force', honeypot: 'Cowrie', severity: 'High' },
                    { time: '10:41:45', ip: '45.12.33.102', type: 'SMB Exploit Attempt', honeypot: 'Dionaea', severity: 'Critical' },
                    { time: '10:41:30', ip: '103.44.12.5', type: 'HTTP Vulnerability Scan', honeypot: 'HoneyTrap', severity: 'Medium' },
                  ].map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-red-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-mono text-gray-500">{event.time}</div>
                        <div>
                          <div className="text-sm font-bold text-white">{event.ip}</div>
                          <div className="text-[10px] text-gray-500">{event.type} • {event.honeypot}</div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                        event.severity === 'Critical' ? "bg-red-500/10 text-red-400" : 
                        event.severity === 'High' ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {event.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">T-Pot Engine Status</h3>
                <div className="space-y-4">
                  {honeypotStats.map((stat) => (
                    <div key={stat.name} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{stat.name}</span>
                        <span className="text-[10px] font-bold text-green-400">{stat.status}</span>
                      </div>
                      <div className="text-xl font-bold text-white">{stat.attacks.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500 mt-1">Total Captures</div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      <span className="text-[10px] text-gray-500 font-bold uppercase">22 Honeypots Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'honeypot':
        return (
          <div className="bg-[#111114] border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="bg-red-600/20 p-4 rounded-full border border-red-500/30 mb-6">
              <Crosshair className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">T-Pot Deception Platform</h3>
            <p className="text-gray-400 max-w-md text-sm leading-relaxed">
              T-Pot is an all-in-one honeypot platform. It combines more than 20 honeypots with the ELK stack for visualization and analysis.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-2xl">
              {['Cowrie', 'Dionaea', 'HoneyTrap', 'Mailoney', 'Adbhoney', 'Conpot', 'Elasticpot', 'Snare'].map(hp => (
                <div key={hp} className="p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs font-bold text-gray-300">
                  {hp}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-600/20 p-2 rounded-lg border border-red-500/30">
            <MapIcon className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Honeypot & Attack Map</h2>
            <p className="text-xs text-gray-500 mt-1">Active Deception & Global Threat Visualization</p>
          </div>
        </div>
        
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'map', label: 'Attack Map', icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'honeypot', label: 'T-Pot Engines', icon: <Crosshair className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeSubTab === tab.id ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderSubContent()}
      </motion.div>
    </div>
  );
}

function IntelCTIView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language ? i18n.language.startsWith("zh") : true;
  return <IntelCTIViewComponent isZh={isZh} />;
}

// AIAnalystView is imported from ./components/AIAnalystView

function UEBAInvestigationView() {
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {selectedEntity && (
          <EntityInvestigationDialog 
            entity={selectedEntity} 
            onClose={() => setSelectedEntity(null)} 
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic">UEBA Entity Analysis</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Behavioral Intelligence & Risk Scoring</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-6 py-3 bg-[#111114] border border-white/5 rounded-2xl">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-gray-300 tracking-tight">Active Entities: 1,402</span>
           </div>
           <div className="flex items-center gap-2 px-6 py-3 bg-[#111114] border border-white/5 rounded-2xl">
              <ShieldAlert size={16} className="text-red-400" />
              <span className="text-xs font-bold text-gray-300 tracking-tight">Critical Anomalies: 12</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {UEBA_HIGH_RISK_ENTITIES.map(entity => (
          <motion.div 
            key={entity.id}
            whileHover={{ y: -10 }}
            onClick={() => setSelectedEntity(entity)}
            className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 cursor-pointer group hover:border-blue-500/30 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black border",
                entity.status === 'Critical' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
              )}>
                {entity.avatar || entity.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-right">
                <div className={cn("text-3xl font-black italic", entity.score > 80 ? "text-red-500" : "text-blue-500")}>
                  {entity.score}
                </div>
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Risk Score</div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{entity.name}</h4>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1 italic">{entity.department} • {entity.type}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {entity.riskFactors.slice(0, 2).map((factor: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-white/5 rounded text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  {factor}
                </span>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Growth Trend</span>
              <span className={cn("text-xs font-black italic", entity.trend.startsWith('+') ? "text-red-500" : "text-green-500")}>
                {entity.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#111114] border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full" />
        
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-bold text-white italic tracking-tight flex items-center gap-3">
             <Activity className="text-blue-500" size={24} />
             Live Behavior Stream
          </h3>
          <button className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Export Logs</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Time</th>
                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Entity</th>
                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Anomaly Type</th>
                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Deviation</th>
                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { time: '14:22:15', entity: 'James Wilson', type: 'Abnormal Download', deviation: '+1,200%', action: 'Risk Alert' },
                { time: '14:18:02', entity: 'SRV-NAS-01', type: 'Unusual Outbound', deviation: '+850%', action: 'Policy Check' },
                { time: '13:55:40', entity: 'Sarah Chen', type: 'Concurrent Logins', deviation: 'Static', action: 'Identity Verify' },
                { time: '13:42:12', entity: 'Admin-K', type: 'Privilege Escalation', deviation: 'New Behavior', action: 'Auto-Block' },
              ].map((log, i) => (
                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 text-xs font-mono text-gray-500">{log.time}</td>
                  <td className="py-4 font-bold text-gray-200 text-sm italic">{log.entity}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-black uppercase tracking-widest">{log.type}</span>
                  </td>
                  <td className="py-4 text-sm font-black text-white italic">{log.deviation}</td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.action}</span>
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

// Note: Compliance Center has been modularized into ./components/compliance/ComplianceCenterView.tsx

function LoginView({ onLogin }: { onLogin: (user: any) => void }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [username, setUsername] = useState('supervisor');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fallbackUsers: Record<string, any> = {
    supervisor: { id: '1', username: 'supervisor', role: 'supervisor', email: 'supervisor@seeor.cyber', status: 'active', modules: ['all'] },
    admin: { id: '2', username: 'admin', role: 'admin', email: 'admin@seeor.cyber', status: 'active', modules: ['all'] },
    auditor: { id: '3', username: 'auditor', role: 'auditor', email: 'audit@seeor.cyber', status: 'active', modules: ['discovery', 'flow', 'endpoint', 'case-management'] }
  };

  const handleQuickLogin = (role: 'supervisor' | 'admin' | 'auditor') => {
    const user = fallbackUsers[role];
    onLogin(user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await siemService.login({ username, password });
      if (data && data.success && data.user) {
        onLogin(data.user);
        return;
      }
    } catch (err) {
      console.warn('Backend login unavailable, falling back to local principal:', err);
    }
    
    // Fallback authentication
    if (fallbackUsers[username.toLowerCase()]) {
      onLogin(fallbackUsers[username.toLowerCase()]);
    } else {
      onLogin({
        id: String(Date.now()),
        username: username || 'supervisor',
        role: username.toLowerCase().includes('admin') ? 'admin' : 'supervisor',
        email: `${username || 'user'}@seeor.cyber`,
        status: 'active',
        modules: ['all']
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="h-screen w-full bg-[#060608] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0c0c0e] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <CyberRadarLogo />
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase text-center leading-none">
            SEMOR CYBER<br />
            <span className="text-sm font-bold text-gray-500 tracking-[0.3em] ml-1">NG-SIEM Platform</span>
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            {isZh ? '新世代威脅管理與資安事件指揮中心' : 'Next-Gen Threat Management & Incident Center'}
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="mb-6 p-3 bg-white/[0.03] border border-white/10 rounded-2xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-2">
            {isZh ? '快速體驗登入' : 'Quick Demo Access'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('supervisor')}
              className="px-2 py-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 rounded-xl text-[10px] font-bold text-red-400 uppercase tracking-wider transition-all"
            >
              {isZh ? '主管' : 'Supervisor'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="px-2 py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 rounded-xl text-[10px] font-bold text-blue-400 uppercase tracking-wider transition-all"
            >
              {isZh ? '管理員' : 'Admin'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('auditor')}
              className="px-2 py-2 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 rounded-xl text-[10px] font-bold text-green-400 uppercase tracking-wider transition-all"
            >
              {isZh ? '稽核員' : 'Auditor'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">
              {isZh ? '使用者帳號' : 'System Principal'}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-mono"
                placeholder="Username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">
              {isZh ? '安全權限金鑰' : 'Security Token'}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest italic">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {isLoading ? <Activity size={16} className="animate-spin" /> : <Fingerprint size={16} />}
            {isZh ? '驗證並進入系統' : 'Authenticate Access'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic">
            {isZh ? 'SEMOR 資安統一管控架構 • 已建立安全連線' : 'AUTHORIZED BY FOCUSECURE SEMOR • IP Logged: 192.168.1.5'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Note: Executive Dashboard has been modularized into ./components/executive/ExecutiveDashboardView.tsx

// Note: EngineMonitoringView has been modularized into ./components/EngineMonitoringView.tsx

function SettingsView({ activeSubTab, setActiveSubTab, currentUser }: { activeSubTab: 'general' | 'network' | 'auth' | 'users' | 'collection' | 'remotelog' | 'nac' | 'decoder' | 'alert' | 'ndr_alerts' | 'update' | 'ueba' | 'engine_monitoring' | 'threat_intel', setActiveSubTab: (tab: any) => void, currentUser: any }) {
  const { t, i18n } = useTranslation();
  const isZh = !i18n.language || i18n.language.startsWith('zh');
  const [isSyncing, setIsSyncing] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  const isReadOnly = currentUser.role === 'auditor' || currentUser.role === 'viewer';

  const handleSaveGeminiKey = () => {
    localStorage.setItem('gemini_api_key', geminiApiKey);
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[1000] font-bold text-sm animate-bounce';
    notification.innerHTML = 'Gemini API Configuration Saved Successfully';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const [networkConfig, setNetworkConfig] = useState({
    ip: '192.168.1.100',
    netmask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: ['8.8.8.8', '8.8.4.4'],
    ntp: 'pool.ntp.org',
    routes: [
      { destination: '10.0.0.0/24', gateway: '192.168.1.1' },
      { destination: '172.16.0.0/16', gateway: '192.168.1.254' }
    ],
    interfaces: {
      mgmt: {
        name: 'eth0',
        status: 'Up',
        speed: '1000Mbps',
        mac: '00:0C:29:4F:8B:34'
      },
      bypass: {
        name: 'eth1/eth2',
        status: 'Enabled',
        mode: 'Bypass',
        mac: '00:0C:29:4F:8B:35 / 36'
      }
    }
  });

  const [networkSaveStatus, setNetworkSaveStatus] = useState<string | null>(null);
  const [networkPingResult, setNetworkPingResult] = useState<{ testing: boolean; message?: string } | null>(null);

  useEffect(() => {
    siemService.getNetworkSettings()
      .then(res => {
        if (res?.network) {
          setNetworkConfig(res.network);
        }
      })
      .catch(err => console.warn('Failed to load backend network settings, using defaults', err));
  }, []);

  const handleSaveNetworkSettings = async () => {
    if (isReadOnly) return;
    try {
      setNetworkSaveStatus('saving');
      const res = await siemService.updateNetworkSettings(networkConfig);
      setNetworkSaveStatus(isZh ? '網路與介面配置已成功儲存並同步套用生效！' : 'Network settings saved and synchronized!');
      setTimeout(() => setNetworkSaveStatus(null), 4000);
    } catch (e) {
      alert(isZh ? '網路設定儲存失敗，請確認後端服務狀態' : 'Failed to save network settings');
      setNetworkSaveStatus(null);
    }
  };

  const handleTestNetworkPing = async (targetIp: string) => {
    try {
      setNetworkPingResult({ testing: true });
      const res = await siemService.testNetworkPing(targetIp);
      setNetworkPingResult({
        testing: false,
        message: `${res.target} 回應正常 (RTT: ${res.latencyMs}ms, 0% Packet Loss)`
      });
      setTimeout(() => setNetworkPingResult(null), 5000);
    } catch (e) {
      setNetworkPingResult({ testing: false, message: '目標連線逾時 (Timeout)' });
      setTimeout(() => setNetworkPingResult(null), 4000);
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const addDns = () => {
    setNetworkConfig({ ...networkConfig, dns: [...networkConfig.dns, ''] });
  };

  const removeDns = (index: number) => {
    const newDns = networkConfig.dns.filter((_, i) => i !== index);
    setNetworkConfig({ ...networkConfig, dns: newDns });
  };

  const updateDns = (index: number, value: string) => {
    const newDns = [...networkConfig.dns];
    newDns[index] = value;
    setNetworkConfig({ ...networkConfig, dns: newDns });
  };

  const addRoute = () => {
    setNetworkConfig({ 
      ...networkConfig, 
      routes: [...networkConfig.routes, { destination: '', gateway: '' }] 
    });
  };

  const removeRoute = (index: number) => {
    const newRoutes = networkConfig.routes.filter((_, i) => i !== index);
    setNetworkConfig({ ...networkConfig, routes: newRoutes });
  };

  const updateRoute = (index: number, field: 'destination' | 'gateway', value: string) => {
    const newRoutes = [...networkConfig.routes];
    newRoutes[index] = { ...newRoutes[index], [field]: value };
    setNetworkConfig({ ...networkConfig, routes: newRoutes });
  };

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'engine_monitoring':
        return <EngineMonitoringView isReadOnly={isReadOnly} />;
      case 'update':
        return <SignatureUpdateSettingsView isReadOnly={isReadOnly} />;
      case 'threat_intel':
        return <ThreatIntelSourcesSettingView isReadOnly={isReadOnly} />;
      case 'collection':
        return <DataCollectionSettingView isReadOnly={isReadOnly} />;
      case 'ueba':
        return <UEBASettingsView isReadOnly={isReadOnly} />;
      case 'decoder':
        return <DecoderView isReadOnly={isReadOnly} />;
      case 'alert':
        return <AlertSettingsView isReadOnly={isReadOnly} />;
      case 'ndr_alerts':
        return <NDRAlertRulesSettingsView isReadOnly={isReadOnly} />;
      case 'nac':
        return <NetworkAccessControlView isReadOnly={isReadOnly} />;
      case 'remotelog':
        return <RemoteLogServerSettingView isReadOnly={isReadOnly} />;
      case 'network':
        return (
          <div className="space-y-6">
            {/* Interface Settings */}
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-600/20 p-2 rounded-lg border border-green-500/30">
                  <Network className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('settings.network.interfaces')}</h3>
                  <p className="text-xs text-gray-500">Manage management and bypass network ports.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('settings.network.mgmt_port')}</span>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded uppercase">{networkConfig.interfaces.mgmt.status}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Interface</span>
                      <span className="text-gray-200 font-mono">{networkConfig.interfaces.mgmt.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Speed</span>
                      <span className="text-gray-200 font-mono">{networkConfig.interfaces.mgmt.speed}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">MAC Address</span>
                      <span className="text-gray-200 font-mono">{networkConfig.interfaces.mgmt.mac}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('settings.network.bypass_port')}</span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase">{networkConfig.interfaces.bypass.status}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Interface</span>
                      <span className="text-gray-200 font-mono">{networkConfig.interfaces.bypass.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Mode</span>
                      <span className="text-gray-200 font-mono">{networkConfig.interfaces.bypass.mode}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">MAC Address</span>
                      <span className="text-gray-200 font-mono">{networkConfig.interfaces.bypass.mac}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IP Configuration */}
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('settings.network.title')}</h3>
                  <p className="text-xs text-gray-500">{t('settings.network.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('settings.network.ip')}</label>
                  <input 
                    type="text" 
                    value={networkConfig.ip}
                    onChange={(e) => setNetworkConfig({...networkConfig, ip: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('settings.network.netmask')}</label>
                  <input 
                    type="text" 
                    value={networkConfig.netmask}
                    onChange={(e) => setNetworkConfig({...networkConfig, netmask: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('settings.network.gateway')}</label>
                  <input 
                    type="text" 
                    value={networkConfig.gateway}
                    onChange={(e) => setNetworkConfig({...networkConfig, gateway: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('settings.network.ntp')}</label>
                  <input 
                    type="text" 
                    value={networkConfig.ntp}
                    onChange={(e) => setNetworkConfig({...networkConfig, ntp: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Multiple DNS */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('settings.network.dns')}</label>
                  <button 
                    onClick={addDns}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <PlusCircle size={14} />
                    {t('settings.network.add_dns')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {networkConfig.dns.map((dns, index) => (
                    <div key={index} className="relative group">
                      <input 
                        type="text" 
                        value={dns}
                        onChange={(e) => updateDns(index, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all pr-10"
                        placeholder="8.8.8.8"
                      />
                      {networkConfig.dns.length > 1 && (
                        <button 
                          onClick={() => removeDns(index)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Multiple Routes */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('settings.network.route')}</label>
                  <button 
                    onClick={addRoute}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <PlusCircle size={14} />
                    {t('settings.network.add_route')}
                  </button>
                </div>
                <div className="space-y-3">
                  {networkConfig.routes.map((route, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          value={route.destination}
                          onChange={(e) => updateRoute(index, 'destination', e.target.value)}
                          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                          placeholder="Destination (e.g. 10.0.0.0/24)"
                        />
                        <input 
                          type="text" 
                          value={route.gateway}
                          onChange={(e) => updateRoute(index, 'gateway', e.target.value)}
                          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                          placeholder="Gateway"
                        />
                      </div>
                      {networkConfig.routes.length > 1 && (
                        <button 
                          onClick={() => removeRoute(index)}
                          className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {networkSaveStatus && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-bold flex items-center justify-between">
                  <span>{networkSaveStatus}</span>
                  <button onClick={() => setNetworkSaveStatus(null)} className="text-gray-400 hover:text-white">✕</button>
                </div>
              )}

              {networkPingResult && (
                <div className="mt-3 p-3 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-300 text-xs font-mono flex items-center justify-between">
                  <span>{networkPingResult.testing ? '正在測試連線中...' : networkPingResult.message}</span>
                  <button onClick={() => setNetworkPingResult(null)} className="text-gray-400 hover:text-white">✕</button>
                </div>
              )}

              {!isReadOnly && (
                <div className="mt-8 pt-6 border-t border-gray-800 flex flex-wrap items-center gap-3">
                  <button 
                    onClick={handleSaveNetworkSettings}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                  >
                    {t('settings.network.save') || "儲存系統網路設定 (Save Network Settings)"}
                  </button>
                  <button
                    onClick={() => handleTestNetworkPing(networkConfig.gateway)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-sm font-medium transition-all"
                  >
                    測試閘道連線 (Ping Gateway: {networkConfig.gateway})
                  </button>
                  <button
                    onClick={() => handleTestNetworkPing(networkConfig.dns[0] || '8.8.8.8')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-sm font-medium transition-all"
                  >
                    測試 DNS 解析端點 (Ping DNS)
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'auth':
        return (
          <AuthenticationSettingsView 
            isReadOnly={isReadOnly}
          />
        );
      case 'users':
        return (
          <UserSettingsView 
            currentUser={currentUser}
            isReadOnly={isReadOnly}
          />
        );
      case 'general':
        return (
          <GeneralSettingsView 
            isReadOnly={isReadOnly}
            geminiApiKey={geminiApiKey}
            setGeminiApiKey={setGeminiApiKey}
            onSaveGeminiKey={handleSaveGeminiKey}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-gray-800 p-2 rounded-lg border border-gray-700">
            {activeSubTab === 'engine_monitoring' && <Activity className="w-6 h-6 text-emerald-400" />}
            {activeSubTab === 'update' && <RefreshCw className="w-6 h-6 text-blue-400" />}
            {activeSubTab === 'threat_intel' && <Radio className="w-6 h-6 text-blue-400 animate-pulse" />}
            {activeSubTab === 'nac' && <ShieldCheck className="w-6 h-6 text-red-500" />}
            {activeSubTab === 'collection' && <Database className="w-6 h-6 text-blue-400" />}
            {activeSubTab === 'remotelog' && <Share2 className="w-6 h-6 text-orange-400" />}
            {activeSubTab === 'network' && <Cpu className="w-6 h-6 text-blue-400" />}
            {activeSubTab === 'auth' && <Key className="w-6 h-6 text-purple-400" />}
            {activeSubTab === 'users' && <Users className="w-6 h-6 text-green-400" />}
            {activeSubTab === 'general' && <Settings className="w-6 h-6 text-gray-400" />}
            {activeSubTab === 'decoder' && <Binary className="w-6 h-6 text-cyan-400" />}
            {activeSubTab === 'alert' && <Bell className="w-6 h-6 text-red-400" />}
            {activeSubTab === 'ndr_alerts' && <Flame className="w-6 h-6 text-amber-400" />}
            {activeSubTab === 'ueba' && <Brain className="w-6 h-6 text-blue-400" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {activeSubTab === 'engine_monitoring' ? '平台核心引擎監控 (Engine Monitoring)' :
               activeSubTab === 'update' ? '特徵庫與規則庫更新管理' :
               activeSubTab === 'threat_intel' ? (isZh ? '外部威脅情資來源管理 (STIX/TAXII Feeds)' : 'Threat Intelligence Sources (STIX/TAXII)') :
               activeSubTab === 'nac' ? '網路存取控制 (Network Access Control / NAC)' :
               activeSubTab === 'collection' ? '資料採集配置 (Data Collection Setting)' : 
               activeSubTab === 'remotelog' ? '遠端日誌伺服器' : 
               activeSubTab === 'ueba' ? 'UEBA 使用者與實體行為分析配置 (UEBA Analytics & Profiling)' :
               activeSubTab === 'decoder' ? 'AI 日誌解碼器 (AI Log Decoder)' :
               activeSubTab === 'alert' ? '告警規則配置 (Alert Configuration)' :
               activeSubTab === 'ndr_alerts' ? (isZh ? 'NDR 網路流量特徵自訂告警規則 (NDR Traffic Alert Rules)' : 'NDR Traffic Pattern Alert Rules') :
               activeSubTab === 'users' ? '使用者帳號與 RBAC 權限管理 (User Access Matrix)' :
               activeSubTab === 'auth' ? '身分認證管理與 SSO 單一登入配置 (Authentication & SSO)' :
               activeSubTab === 'general' ? '平台一般設定與 AI 引擎配置 (General Platform & AI Settings)' :
               t(`settings.tabs.${activeSubTab}`)}
            </h2>
            <p className="text-xs text-gray-500 mt-1">管理系統配置與平台引擎整合節點。</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-900/50 rounded-xl border border-gray-800">
          {[
            { id: 'engine_monitoring', label: '引擎監控', icon: <Activity size={14} />, supervisorOnly: true },
            { id: 'collection', label: '資料採集', icon: <Database size={14} /> },
            { id: 'update', label: '更新管理', icon: <RefreshCw size={14} /> },
            { id: 'threat_intel', label: isZh ? '情資來源' : 'Threat Intel', icon: <Radio size={14} /> },
            { id: 'nac', label: 'NAC 控管', icon: <ShieldCheck size={14} /> },
            { id: 'remotelog', label: '遠端日誌', icon: <Share2 size={14} /> },
            { id: 'decoder', label: '日誌解碼', icon: <Binary size={14} /> },
            { id: 'alert', label: '告警設定', icon: <Bell size={14} /> },
            { id: 'ndr_alerts', label: isZh ? 'NDR 流量告警' : 'NDR Alerts', icon: <Flame size={14} className="text-amber-400" /> },
            { id: 'ueba', label: 'UEBA', icon: <Brain size={14} /> },
            { id: 'network', label: '系統介面', icon: <Cpu size={14} /> },
            { id: 'auth', label: '認證管理', icon: <Key size={14} /> },
            { id: 'users', label: '使用者', icon: <Users size={14} /> },
            { id: 'general', label: '一般設定', icon: <Settings size={14} /> },
          ].filter(tab => 
            (!tab.supervisorOnly || currentUser.role === 'supervisor') && 
            (tab.id !== 'users' || (currentUser.role === 'supervisor' || currentUser.role === 'admin'))
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeSubTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderSubContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SSHRegexExtractor({ onSave, onCancel }: { onSave: (regex: string, mappings: any[]) => void, onCancel: () => void }) {
  const [regex, setRegex] = useState('/root\\s+(\\d+)\\s+([\\d\\.]+)/g');
  const [mappings, setMappings] = useState([
    { group: 'Group 1 (\\d+)', variable: 'pid', type: 'Integer', preview: '1234' },
    { group: 'Group 2 ([\\d\\.]+)', variable: 'cpu_percent', type: 'Float', preview: '5.2' },
  ]);

  const rawOutput = `Last login: Tue Oct 24 10:00:01
USER       PID  %CPU  %MEM    COMMAND
root      1234  5.2  1.1    python3
admin     5678  1.2  0.5    nginx
guest     9012  0.5  0.2    bash`;

  return (
    <div className="absolute inset-0 z-[100] bg-[#09090b] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="h-16 border-b border-gray-800 px-8 flex items-center justify-between bg-[#111114]">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
               <Fingerprint size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">SSH Regex Extractor</h3>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Smart Output Parsing Assistant</p>
            </div>
         </div>
         <div className="flex gap-3">
            <button onClick={onCancel} className="px-5 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700">Cancel</button>
            <button onClick={() => onSave(regex, mappings)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all active:scale-95">Save Extraction Logic</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
         {/* 1. Raw Output */}
         <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">1. SSH Raw Response (Select text to suggest regex)</label>
               <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest">Interactive Terminal</span>
                 <button className="text-[9px] font-black text-gray-600 uppercase hover:text-blue-400">Clear Highlights</button>
               </div>
            </div>
            <div className="bg-black border border-gray-800 rounded-[2rem] p-8 font-mono text-sm leading-relaxed relative group overflow-hidden shadow-inner">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-30 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
               <pre className="text-gray-400 italic relative z-10 selection:bg-blue-500 selection:text-white">
                  {rawOutput.split('\n').map((line, i) => (
                    <div key={i} className="hover:bg-blue-600/5 transition-colors px-2 rounded cursor-text group/line relative">
                       {line.includes('root') ? (
                         <span>
                           root      <span className="bg-blue-600/40 text-blue-100 px-1 rounded shadow-[0_0_8px_rgba(59,130,246,0.3)] border border-blue-500/30 cursor-pointer hover:bg-blue-600/60 transition-all">1234</span>  <span className="bg-blue-600/40 text-blue-100 px-1 rounded shadow-[0_0_8px_rgba(59,130,246,0.3)] border border-blue-500/30 cursor-pointer hover:bg-blue-600/60 transition-all">5.2</span>  1.1    python3
                         </span>
                       ) : line}
                       <div className="absolute right-0 top-0 opacity-0 group-hover/line:opacity-100 transition-opacity flex gap-2">
                         <span className="text-[8px] bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-gray-600 uppercase">Match Found</span>
                       </div>
                    </div>
                  ))}
               </pre>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Terminal size={120} className="text-blue-500" />
               </div>
            </div>
         </div>

         {/* 2. Regex Config */}
         <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">2. Regex Configuration</label>
               <div className="flex gap-3">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10} /> Pattern Helper:</span>
                  <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all bg-blue-600/5 px-3 py-1 rounded-lg border border-blue-500/10 active:scale-95">IP Address</button>
                  <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all bg-blue-600/5 px-3 py-1 rounded-lg border border-blue-500/10 active:scale-95">Numbers</button>
                  <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all bg-blue-600/5 px-3 py-1 rounded-lg border border-blue-500/10 active:scale-95">Paths</button>
                  <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all bg-blue-600/5 px-3 py-1 rounded-lg border border-blue-500/10 active:scale-95">Timestamp</button>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="flex-1 bg-black border-2 border-gray-800 focus-within:border-blue-500/50 rounded-2xl p-4 flex gap-4 items-center shadow-xl transition-all">
                  <div className="p-2 bg-gray-900 rounded-lg border border-gray-800">
                    <SearchCode size={16} className="text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                  </div>
                  <span className="text-gray-600 font-mono text-lg">/</span>
                  <input 
                    className="flex-1 bg-transparent border-none outline-none font-mono text-blue-400 italic text-base placeholder:text-gray-800"
                    placeholder="Enter regular expression here..."
                    value={regex}
                    onChange={(e) => setRegex(e.target.value)}
                  />
                  <span className="text-gray-600 font-mono text-lg">/g</span>
               </div>
               <div className="flex flex-col gap-2">
                 <div className="flex-1 flex gap-4 items-center bg-gray-900/50 border border-gray-800 px-6 rounded-2xl group hover:border-blue-500/30 transition-all cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-800 bg-black checked:bg-blue-500 cursor-pointer" />
                    <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-300 uppercase tracking-widest transition-colors">Global Matching</span>
                 </div>
                 <div className="flex-1 flex gap-4 items-center bg-gray-900/50 border border-gray-800 px-6 rounded-2xl group hover:border-blue-500/30 transition-all cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-800 bg-black checked:bg-blue-500 cursor-pointer" />
                    <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-300 uppercase tracking-widest transition-colors">Case Sensitive</span>
                 </div>
               </div>
            </div>
         </div>

         {/* 3. Data Mapping */}
         <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h4 className="text-xl font-black text-white italic uppercase tracking-tighter underline decoration-blue-600 decoration-8 underline-offset-8">Output Data Mapping</h4>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg">+ Add Extraction Pattern</button>
            </div>
            
            <div className="bg-[#111114]/50 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-black/50 border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
                        <th className="p-8">Capturing Group (Regex)</th>
                        <th className="p-8">Internal Variable Name</th>
                        <th className="p-8">Output Data Type</th>
                        <th className="p-8">Real-time Preview</th>
                        <th className="p-8">Action</th>
                     </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gray-800/50">
                     {mappings.map((m, i) => (
                       <tr key={i} className="hover:bg-white/[0.03] transition-all group relative">
                          <td className="p-8 font-mono text-blue-500/70 italic group-hover:text-blue-400 transition-colors">{m.group}</td>
                          <td className="p-8">
                             <div className="relative">
                               <input className="w-48 bg-black border border-gray-800 rounded-xl px-4 py-2 focus:border-blue-500 outline-none text-blue-300 font-mono text-[11px] shadow-inner transition-all" defaultValue={m.variable} />
                               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800 group-hover:text-blue-900 transition-colors"><Tag size={12} /></div>
                             </div>
                          </td>
                          <td className="p-8">
                             <div className="relative inline-block">
                               <select className="appearance-none bg-black border border-gray-800 rounded-xl px-4 py-2 pr-10 focus:border-blue-500 outline-none text-gray-400 uppercase text-[9px] font-black tracking-[0.2em] shadow-inner cursor-pointer">
                                  <option>Integer</option>
                                  <option>Float</option>
                                  <option>String</option>
                                  <option>Boolean</option>
                               </select>
                               <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                             </div>
                          </td>
                          <td className="p-8">
                             <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                               <span className="text-green-400 font-mono italic underline decoration-green-500/30 underline-offset-4 decoration-2">{m.preview}</span>
                             </div>
                          </td>
                          <td className="p-8 text-center">
                             <button className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-700 hover:text-red-500 hover:border-red-500/50 transition-all active:scale-90"><Trash2 size={14} /></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               <div className="p-8 bg-black/30 border-t border-gray-800/50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Activity size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Smart Detection: <span className="text-blue-400">2 Matches Found in Current Output</span></span>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-5 py-2 border border-gray-800 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Export as Config</button>
                    <button className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Dry Run Extraction</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function ActionBuilder({ onBack, initialProtocol = 'REST', autoOpenExtractor = false }: { onBack: () => void, initialProtocol?: 'REST' | 'SSH' | 'SQL', autoOpenExtractor?: boolean }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [protocol, setProtocol] = useState<'REST' | 'SSH' | 'SQL'>(initialProtocol);
  const [activeBuilderTab, setActiveBuilderTab] = useState<'config' | 'test' | 'mapping'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [showRegexExtractor, setShowRegexExtractor] = useState(autoOpenExtractor);

  return (
    <div className="flex flex-col h-[800px] bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative mb-10 animate-in zoom-in-95 duration-500">
      {showRegexExtractor && (
        <SSHRegexExtractor 
          onCancel={() => setShowRegexExtractor(false)}
          onSave={() => setShowRegexExtractor(false)}
        />
      )}
      {/* Top Navigation */}
      <div className="h-16 bg-[#111114] border-b border-gray-800 px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-pink-600/20 rounded-lg border border-pink-500/30">
                <Box size={18} className="text-pink-400" />
             </div>
             <div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">{isZh ? '動作建構器' : 'Action Builder'}</h3>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">{isZh ? '建立客製化系統整合模組' : 'Create Custom Integration Modules'}</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {['REST', 'SSH', 'SQL'].map(p => (
             <button 
              key={p}
              onClick={() => setProtocol(p as any)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
                protocol === p 
                  ? "bg-pink-600 border-pink-500 text-white shadow-[0_0_20px_rgba(219,39,119,0.3)]" 
                  : "bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300"
              )}
             >{p}</button>
           ))}
        </div>

        <div className="flex items-center gap-3">
           <button className="px-5 py-2 border border-gray-800 hover:bg-white/5 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest transition-all">{isZh ? '儲存草稿' : 'Save as Draft'}</button>
           <button className="px-5 py-2 bg-white text-black hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">{isZh ? '完成動作' : 'Complete Action'}</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Config Panel */}
        <div className="w-[500px] border-r border-gray-800 bg-[#111114] flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
             {protocol === 'REST' && (
               <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Endpoint Definition</label>
                     <div className="flex gap-2">
                        <div className="px-4 py-3 bg-black border border-gray-800 rounded-xl text-[11px] font-black text-pink-400 uppercase">POST</div>
                        <input 
                          type="text" 
                          defaultValue="https://api.sentinel-one.com/v2/agents/{{agent_id}}/quarantine"
                          className="flex-1 bg-black border border-gray-800 rounded-xl px-4 text-xs font-mono text-gray-300 focus:border-pink-500 outline-none transition-all"
                        />
                     </div>
                     <p className="text-[9px] text-gray-600 font-bold uppercase italic mt-1">Live URL Preview: <span className="text-gray-400">https://api.sentinel-one.com/v2/agents/S1-9928/quarantine</span></p>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Request Headers</label>
                        <button className="text-pink-500"><Plus size={16} /></button>
                     </div>
                     <div className="space-y-2">
                        {['Content-Type: application/json', 'Authorization: Bearer {{secrets.S1_TOKEN}}'].map((h, i) => (
                          <div key={i} className="flex gap-2 group">
                             <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-[10px] font-mono text-gray-400 group-hover:border-pink-500/30 transition-all">{h}</div>
                             <button className="p-3 text-gray-700 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">JSON Payload Template</label>
                     <div className="bg-black border border-gray-800 rounded-[2rem] p-6 font-mono text-xs relative group overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-100 transition-opacity">
                           <FileCode size={40} className="text-pink-500" />
                        </div>
                        <pre className="text-pink-400/80 italic leading-[2.2]">
{`{
  "quarantine": true,
  "reason": "{{incident.summary}}",
  "isolated_by": "SOAR_n8n_V2",
  "timestamp": "{{now}}",
  "ioc_match": [
    "{{observable.val}}"
  ]
}`}
                        </pre>
                        <div className="absolute bottom-4 right-4">
                           <button className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all shadow-xl">Insert Variable</button>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {protocol === 'SSH' && (
               <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Remote Connection Settings</label>
                     <div className="grid grid-cols-2 gap-4">
                        <input className="bg-black border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 placeholder:text-gray-700" placeholder="Host: {{target_ip}}" />
                        <input className="bg-black border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 placeholder:text-gray-700" placeholder="User: {{secrets.SSH_USER}}" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Exec Command Script</label>
                     <div className="bg-[#09090b] border border-gray-800 rounded-[1.5rem] p-6 font-mono text-[13px] shadow-inner relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Terminal size={60} /></div>
                        <textarea 
                          className="w-full h-48 bg-transparent border-none outline-none resize-none text-green-500/90 italic leading-relaxed"
                          defaultValue={`# Block attacker IP via IPTables
iptables -A INPUT -s {{src_ip}} -j DROP
# Log action to syslog
logger "SOAR: Blocked malicious IP {{src_ip}} from Case #{{case_id}}"
# Verify status
iptables -L -n | grep {{src_ip}}`}
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Output Regex Parser</label>
                        <button 
                          onClick={() => setShowRegexExtractor(true)}
                          className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest hover:bg-blue-600 transition-all shadow-glow"
                        >
                          Open Smart Extractor
                        </button>
                     </div>
                     <input 
                      type="text" 
                      defaultValue="^Chain INPUT.*(?<status>DROP).*{{src_ip}}"
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-blue-400 focus:border-blue-500 outline-none transition-all shadow-inner"
                     />
                     <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-xl">
                        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest italic">Captures variable: <span className="text-white font-black underline underline-offset-4 decoration-blue-500">status</span></p>
                     </div>
                  </div>
               </div>
             )}

             {protocol === 'SQL' && (
               <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Database Connection (MISP/Local)</label>
                     <div className="h-14 w-full bg-black border border-gray-800 rounded-xl flex items-center px-6 justify-between group hover:border-pink-500/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                           <Database size={18} className="text-gray-400 group-hover:text-pink-400 transition-colors" />
                           <span className="text-xs font-black text-gray-300 uppercase italic tracking-widest">Threat_Intel_Archive (MySQL)</span>
                        </div>
                        <ChevronDown size={14} className="text-gray-700" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Parameterized Query</label>
                     <div className="bg-[#1a1a1e] border-2 border-gray-800 rounded-[2rem] p-8 shadow-2xl relative">
                        <div className="absolute top-6 right-6 p-2 bg-gray-900 border border-gray-800 rounded-lg text-yellow-500/50 shadow-md">
                           <ShieldAlert size={16} />
                        </div>
                        <textarea 
                          className="w-full h-56 bg-transparent border-none outline-none resize-none font-mono text-sm text-yellow-400/90 leading-relaxed italic"
                          defaultValue={`SELECT id, event_time, payload, src_ip, dst_ip
FROM vulnerability_scans
WHERE src_ip = :attacker_ip
  AND severity > :min_sev
  AND status = 'UNREMEDIATED'
ORDER BY event_time DESC
LIMIT 50`}
                        />
                        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-800 opacity-60">
                           <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Query Sanitization active</span>
                           <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Rows: 50 MAX</span>
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Right Tester & Mapping Panel */}
        <div className="flex-1 bg-[#09090b] flex flex-col relative">
           {/* Section Tabs */}
           <div className="h-14 border-b border-gray-800 bg-[#111114] flex px-8 gap-10 items-center z-10 shadow-lg">
              {[
                { id: 'test', label: 'Live Test Runner' },
                { id: 'mapping', label: 'Output Data Paths' },
                { id: 'history', label: 'Logic Versions' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveBuilderTab(tab.id as any)}
                  className={cn(
                    "relative h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    activeBuilderTab === tab.id ? "text-pink-400" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {tab.label}
                  {activeBuilderTab === tab.id && <motion.div layoutId="builderActive" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 shadow-[0_0_10px_rgba(219,39,119,0.5)]" />}
                </button>
              ))}
           </div>

           <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                 {activeBuilderTab === 'test' && (
                   <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
                      <div className="space-y-6">
                         <h4 className="text-xl font-black text-white italic uppercase tracking-tighter underline decoration-pink-600 underline-offset-8 decoration-8">Execute Module Test</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic border-b border-gray-800 pb-2 block">Inputs Configuration</label>
                               {protocol === 'REST' && (
                                 <div className="space-y-3">
                                    <div className="group">
                                       <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5 block">agent_id</span>
                                       <input className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs font-mono text-pink-400 italic shadow-inner outline-none focus:border-pink-500/50" defaultValue="S1-9928" />
                                    </div>
                                    <div className="group">
                                       <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5 block">incident_summary</span>
                                       <input className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs font-mono text-pink-400 italic shadow-inner outline-none focus:border-pink-500/50" defaultValue="Phishing Campaign #44" />
                                    </div>
                                 </div>
                               )}
                               {protocol === 'SSH' && (
                                 <div className="space-y-3">
                                    <div className="group">
                                       <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5 block">src_ip</span>
                                       <input className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs font-mono text-green-400 italic shadow-inner outline-none focus:border-green-500/50" defaultValue="142.250.66.110" />
                                    </div>
                                 </div>
                               )}
                               {protocol === 'SQL' && (
                                 <div className="space-y-3">
                                    <div className="group">
                                       <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5 block">attacker_ip</span>
                                       <input className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs font-mono text-yellow-400 italic shadow-inner outline-none focus:border-yellow-500/50" defaultValue="45.132.88.21" />
                                    </div>
                                 </div>
                               )}
                            </div>
                            <div className="flex flex-col justify-end">
                               <button 
                                onClick={() => {
                                  setIsTesting(true);
                                  setTimeout(() => setIsTesting(false), 2000);
                                }}
                                className={cn(
                                  "w-full h-32 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 transition-all group overflow-hidden shadow-2xl active:scale-95",
                                  isTesting ? "bg-gray-800 border-gray-700 pointer-events-none" : "bg-pink-600 border-pink-400 hover:bg-pink-700 hover:scale-[1.02]"
                                )}
                               >
                                 {isTesting ? (
                                   <RefreshCw size={40} className="text-pink-500 animate-spin" />
                                 ) : (
                                   <PlayCircle size={40} className="text-white group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                                 )}
                                 <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">{isTesting ? 'Routing Traffic...' : 'Run Module Test'}</span>
                               </button>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                           <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Execution Response</h4>
                           <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">HTTP 200 OK</span>
                              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Time: 142ms</span>
                           </div>
                         </div>

                         {protocol === 'REST' && (
                           <div className="bg-black border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-1 h-full bg-pink-600 opacity-50" />
                              <pre className="text-xs font-mono text-gray-400 leading-relaxed italic group-hover:text-gray-200 transition-colors">
{`{
  "status": "success",
  "data": {
    "action": "quarantine",
    "agent_id": "S1-9928",
    "task_uuid": "f4a1-88bc-d922",
    "result": "host_isolated",
    "policy_applied": "SOC_STRICT_V1"
  }
}`}
                              </pre>
                           </div>
                         )}

                         {protocol === 'SSH' && (
                           <div className="bg-[#09090b] border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden font-mono text-xs text-green-500/90 leading-loose border-l-8 border-l-green-900 group">
                              <div className="flex gap-2 mb-4 border-b border-green-900/40 pb-2">
                                <Activity size={14} className="text-green-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Remote Terminal Output</span>
                              </div>
                              <p>$ iptables -A INPUT -s 142.250.66.110 -j DROP</p>
                              <p className="text-gray-600"> [OK] Command successful.</p>
                              <p>$ logger "SOAR: Blocked malicious IP 142.250.66.110 from Case #1002"</p>
                              <p className="text-gray-600"> [OK] Written to syslog.</p>
                              <p>$ iptables -L -n | grep 142.250.66.110</p>
                              <p className="bg-green-600/10 inline-block px-2 animate-in fade-in underline decoration-green-500/50 underline-offset-4 decoration-2 italic">Chain INPUT (policy ACCEPT) DROP all -- 142.250.66.110 0.0.0.0/0</p>
                           </div>
                         )}

                         {protocol === 'SQL' && (
                           <div className="bg-black border border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl">
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
                                       <th className="p-4">id</th>
                                       <th className="p-4">event_time</th>
                                       <th className="p-4">src_ip</th>
                                       <th className="p-4">severity</th>
                                       <th className="p-4">status</th>
                                    </tr>
                                 </thead>
                                 <tbody className="text-[11px] font-mono text-yellow-400/80 italic">
                                    {[1, 2, 3].map(i => (
                                      <tr key={i} className="border-b border-gray-800 hover:bg-yellow-600/[0.02] transition-colors cursor-pointer group">
                                         <td className="p-4 text-gray-500">#4409{i}</td>
                                         <td className="p-4 text-gray-500">2026-04-28 09:12</td>
                                         <td className="p-4 group-hover:text-yellow-400 transition-colors">45.132.88.21</td>
                                         <td className="p-4 text-red-500 font-black">CRITICAL</td>
                                         <td className="p-4">UNREMEDIATED</td>
                                      </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                         )}
                      </div>
                   </div>
                 )}

                 {activeBuilderTab === 'mapping' && (
                   <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right-10 duration-500">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                        <div className="space-y-2">
                           <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Output DataPath Mapper</h4>
                           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic decoration-pink-500/30 underline underline-offset-4 decoration-4">Map raw results to reusable global Data Tags</p>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2 bg-pink-600/10 text-pink-400 border border-pink-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all shadow-lg active:scale-95"><Plus size={14} /> Add Manual Path</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Result Discovery (Auto)</h5>
                            <div className="space-y-3">
                               {[
                                 { path: 'data.task_uuid', type: 'String', color: 'pink' },
                                 { path: 'data.result', type: 'Status', color: 'green' },
                                 { path: 'data.policy_applied', type: 'Meta', color: 'blue' }
                               ].map(item => (
                                 <div key={item.path} className="p-4 bg-black border border-gray-800 rounded-2xl flex items-center justify-between group hover:border-pink-500/30 transition-all cursor-move">
                                    <div className="flex items-center gap-3">
                                       <div className="text-gray-700 transition-colors group-hover:text-pink-500"><List size={14} /></div>
                                       <span className="text-[11px] font-mono text-gray-400 italic">{item.path}</span>
                                    </div>
                                    <span className="text-[8px] font-black px-2 py-0.5 bg-gray-900 text-gray-600 rounded uppercase tracking-widest">{item.type}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">SOAR Output Mapping</h5>
                            <div className="space-y-3">
                               {[
                                 { tag: 'Action_UUID', maps: 'data.task_uuid', status: 'Mapped' },
                                 { tag: 'Response_Status', maps: 'data.result', status: 'Mapped' },
                                 { tag: 'Compliance_ID', maps: 'data.policy_applied', status: 'Mapped' }
                               ].map(item => (
                                 <div key={item.tag} className="p-4 bg-pink-600/[0.03] border border-pink-500/20 rounded-2xl space-y-3 shadow-xl">
                                    <div className="flex items-center justify-between">
                                       <span className="text-[11px] font-black text-pink-400 uppercase tracking-widest italic underline decoration-pink-500/40 decoration-2 underline-offset-4">{item.tag}</span>
                                       <span className="text-[8px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-widest shadow-sm">{item.status}</span>
                                    </div>
                                    <div className="bg-black border border-gray-800 rounded-xl p-3 flex items-center justify-between group hover:border-pink-500/40 transition-all">
                                       <span className="text-[10px] font-mono text-gray-500 group-hover:text-pink-300 transition-colors">{item.maps}</span>
                                       <Settings2 size={12} className="text-gray-700 hover:text-white cursor-pointer" />
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </div>

           {/* Version Control Footer */}
           <div className="h-14 border-t border-gray-800 bg-black/40 flex items-center justify-between px-10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-600/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-6 relative z-10">
                 <div className="flex items-center gap-3">
                    <History size={16} className="text-gray-600" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Module Versioning</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-pink-400 underline decoration-pink-600 decoration-2 underline-offset-4 decoration-opacity-30">v1.2.4 Production</span>
                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">By Admin SOC (3h ago)</span>
                 </div>
              </div>
              <div className="flex gap-4 relative z-10">
                 <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-pink-400 transition-all hover:scale-105 active:scale-95 italic border-r border-gray-800 pr-4">View Diff</button>
                 <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all hover:scale-105 active:scale-95 italic">Commit Change</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// CaseManagementView modularized into ./components/case-management

function PlaybookEditor() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [activePlaybookTab, setActivePlaybookTab] = useState<'canvas' | 'simulator' | 'history'>('canvas');
  const [selectedNode, setSelectedNode] = useState<string | null>('n1');
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [activeVersion, setActiveVersion] = useState('v1.8');
  
  const playbookIcons: Record<string, any> = {
    trigger: <Zap size={18} className="text-blue-400" />,
    action: <Cpu size={18} className="text-purple-400" />,
    condition: <Filter size={18} className="text-yellow-400" />,
    manual: <UserCheck size={18} className="text-green-400" />,
    sub: <Layers size={18} className="text-blue-300" />
  };

  const nodes = [
    { id: 'n1', type: 'trigger', label: isZh ? 'TheHive 告警觸發' : 'TheHive Alert', x: 50, y: 150, status: 'success', description: isZh ? '有新增勒索軟體案件時觸發' : 'Triggers on new "Malware" cases' },
    { id: 'n2', type: 'action', label: isZh ? 'VirusTotal 檢索' : 'VirusTotal Scan', x: 250, y: 150, status: 'success', description: isZh ? '分析 IP 與檔案雜湊碼' : 'Analyze IPs and Hashes' },
    { id: 'n3', type: 'condition', label: isZh ? '風險分數 > 50?' : 'Score > 50?', x: 450, y: 150, status: 'success', description: isZh ? '判斷 VT 分數是否過高' : 'If VT score is high risk' },
    { id: 'n4', type: 'manual', label: isZh ? 'L2 資安官審核' : 'L2 Review', x: 650, y: 50, status: 'idle', description: isZh ? '阻斷前人工核准' : 'Human approval for blocking' },
    { id: 'n5', type: 'action', label: isZh ? '阻斷 IP (Cisco)' : 'Block IP (Cisco)', x: 850, y: 150, status: 'idle', description: isZh ? '透過防火牆 API 下發隔離' : 'Quarantine via Firewall API' },
    { id: 'n6', type: 'action', label: isZh ? '自動結案' : 'Close Case', x: 650, y: 250, status: 'success', description: isZh ? '誤報或低風險自動關閉' : 'False positive or low risk' },
  ];

  const connections = [
    { from: 'n1', to: 'n2' },
    { from: 'n2', to: 'n3' },
    { from: 'n3', to: 'n4', label: isZh ? '是' : 'Yes' },
    { from: 'n3', to: 'n6', label: isZh ? '否' : 'No' },
    { from: 'n4', to: 'n5', label: isZh ? '核准' : 'Approve' },
  ];

  const renderNode = (node: typeof nodes[0]) => {
    const isSelected = selectedNode === node.id;
    const isCondition = node.type === 'condition';

    return (
      <motion.div 
        key={node.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ left: node.x, top: node.y }}
        onClick={() => setSelectedNode(node.id)}
        className={cn(
          "absolute w-44 p-4 rounded-2xl border-2 transition-all cursor-pointer z-10",
          isCondition ? "rounded-[2rem] rotate-45 flex items-center justify-center aspect-square w-32 h-32" : "rounded-2xl w-44",
          isSelected ? "bg-[#111114] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]" : "bg-[#09090b] border-gray-800 hover:border-gray-600",
          isDebugMode && node.status === 'success' && "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
        )}
      >
        <div className={cn("flex flex-col items-center text-center", isCondition && "-rotate-45")}>
          <div className="flex items-center gap-3 mb-2 justify-center">
            {playbookIcons[node.type]}
            <span className="text-[11px] font-black text-white uppercase tracking-tighter italic">{node.label}</span>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest line-clamp-1">{node.description}</p>
        </div>
        
        {isDebugMode && node.status === 'success' && (
          <div className={cn("absolute bg-green-500 text-white rounded-full p-1 shadow-lg z-20", isCondition ? "top-0 right-0" : "-top-2 -right-2")}>
            <CheckCircle2 size={10} />
          </div>
        )}

        {/* Port Indicators for Logic */}
        {isCondition && (
          <>
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-[750px] bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative mb-10">
      {/* Playbook Header */}
      <div className="h-14 bg-[#111114] border-b border-gray-800 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <Workflow size={16} className="text-blue-400" />
             </div>
             <h3 className="text-[11px] font-black text-white uppercase italic tracking-tighter">{isZh ? 'SOAR 劇本視覺化編輯器' : 'SOAR Playbook Editor'}</h3>
          </div>
          <div className="h-6 w-px bg-gray-800" />
          <div className="flex bg-black p-0.5 rounded-lg border border-gray-800">
             {['canvas', 'simulator', 'history'].map(tab => (
               <button 
                key={tab}
                onClick={() => setActivePlaybookTab(tab as any)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                  activePlaybookTab === tab ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
                )}
               >{isZh ? (tab === 'canvas' ? '畫布' : tab === 'simulator' ? '模擬器' : '歷史審計') : tab}</button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
            onClick={() => setIsDebugMode(!isDebugMode)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
              isDebugMode ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-gray-800 text-gray-400 border border-gray-700"
            )}
           ><Activity size={12} /> {isZh ? '偵錯模式' : 'Debug Mode'}</button>
           <button className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">{isZh ? '發布劇本' : 'Publish Playbook'}</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Components Sidebar */}
        <div className="w-16 border-r border-gray-800 bg-[#111114] flex flex-col items-center py-6 gap-6">
           {Object.keys(playbookIcons).map(type => (
             <div key={type} className="group relative">
                <button className="p-3 bg-black border border-gray-800 rounded-xl hover:border-blue-500/50 hover:bg-blue-600/5 text-gray-500 hover:text-blue-400 transition-all active:scale-90 shadow-md">
                   {playbookIcons[type]}
                </button>
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-[10px] font-black text-white px-3 py-1.5 rounded border border-gray-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-2xl">
                   {type} Node
                </div>
             </div>
           ))}
           <div className="w-8 h-px bg-gray-900 mt-auto" />
           <button className="p-3 text-gray-600 hover:text-white transition-colors"><Search size={20} /></button>
           <button className="p-3 text-gray-600 hover:text-white transition-colors"><Settings size={20} /></button>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-[#09090b] relative overflow-hidden group/canvas">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          <div className="absolute top-6 left-6 z-20 flex gap-2">
             <button className="p-2 bg-black/80 border border-gray-800 rounded-lg hover:border-gray-600 text-gray-400"><Maximize2 size={14} /></button>
             <button className="p-2 bg-black/80 border border-gray-800 rounded-lg hover:border-gray-600 text-gray-400"><LayoutGrid size={14} /></button>
          </div>

          <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
             <div className="px-3 py-1.5 bg-black/80 border border-gray-800 rounded-full flex items-center gap-3 shadow-2xl">
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active nodes: 6</span>
                </div>
                <div className="w-px h-3 bg-gray-800" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">v1.8.4</span>
             </div>
          </div>

          <div className="h-full w-full relative">
            {/* SVG Connections Layout */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
               <defs>
                 <marker id="playbook-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                   <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
                 </marker>
                 <filter id="path-glow">
                   <feGaussianBlur stdDeviation="2" result="blur" />
                   <feComposite in="SourceGraphic" in2="blur" operator="over" />
                 </filter>
               </defs>
               {connections.map((conn, i) => {
                 const fromNode = nodes.find(n => n.id === conn.from)!;
                 const toNode = nodes.find(n => n.id === conn.to)!;
                 
                 const fx = fromNode.x + 176; // node width
                 const fy = fromNode.y + 40;  // node center
                 const tx = toNode.x;
                 const ty = toNode.y + 40;

                 const isSuccessPath = isDebugMode && fromNode.status === 'success' && toNode.status === 'success';

                 return (
                   <g key={`conn-${i}`}>
                      <path 
                        d={`M ${fx} ${fy} C ${fx + 50} ${fy}, ${tx - 50} ${ty}, ${tx} ${ty}`}
                        fill="none" 
                        stroke={isSuccessPath ? "#22c55e" : "#1f2937"} 
                        strokeWidth={isSuccessPath ? "3" : "2"}
                        markerEnd="url(#playbook-arrow)"
                        className="transition-all duration-1000"
                        filter={isSuccessPath ? "url(#path-glow)" : ""}
                      />
                      {conn.label && (
                        <foreignObject x={(fx + tx) / 2 - 40} y={(fy + ty) / 2 - 15} width="80" height="30">
                           <div className="flex justify-center">
                              <span className="bg-[#1a1a1e] text-[9px] font-black text-gray-500 px-2.5 py-1 rounded-full border border-gray-800 shadow-xl uppercase tracking-widest">{conn.label}</span>
                           </div>
                        </foreignObject>
                      )}
                      {isSuccessPath && (
                        <motion.circle 
                          r="3" 
                          fill="#22c55e"
                          initial={{ offsetDistance: "0%" }}
                          animate={{ offsetDistance: "100%" }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          style={{ offsetPath: `path('M ${fx} ${fy} C ${fx + 50} ${fy}, ${tx - 50} ${ty}, ${tx} ${ty}')` }}
                        />
                      )}
                   </g>
                 );
               })}
            </svg>

            <div className="relative w-full h-full p-20">
               {nodes.map(node => renderNode(node))}
            </div>
          </div>

          {/* Mini-map */}
          <div className="absolute bottom-6 right-[380px] w-48 h-32 bg-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl z-20 group peer transition-transform hover:scale-105">
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="relative w-full h-full p-2">
                {nodes.map(node => (
                  <div 
                    key={`mini-${node.id}`}
                    style={{ left: node.x / 6 + 50, top: node.y / 6 + 20 }}
                    className={cn(
                      "absolute w-8 h-4 rounded-[2px] transition-all",
                      selectedNode === node.id ? "bg-purple-500" : "bg-gray-800"
                    )}
                  />
                ))}
             </div>
             <div className="absolute top-2 left-2 text-[8px] font-black text-gray-600 uppercase tracking-widest">Mini-map</div>
          </div>
        </div>

        {/* Right: Properties Panel */}
        <div className="w-[350px] border-l border-gray-800 bg-[#111114] flex flex-col z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
           <div className="h-12 border-b border-gray-800 flex items-center justify-between px-6 bg-black/40">
              <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Node Inspector</span>
              <div className="flex gap-1.5">
                 <button className="p-1 px-2 border border-gray-800 rounded bg-gray-900 text-[8px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Doc</button>
                 <button className="p-1 px-2 border border-blue-500/30 rounded bg-blue-600/10 text-[8px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">API</button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {selectedNode ? (
                <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-black border border-gray-800 rounded-2xl flex items-center justify-center shadow-inner">
                         {playbookIcons[nodes.find(n => n.id === selectedNode)?.type || 'trigger']}
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">{nodes.find(n => n.id === selectedNode)?.label}</h4>
                         <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest bg-gray-900 px-2 py-0.5 rounded border border-gray-800 italic">Playbook Node v3.2</span>
                      </div>
                   </div>

                   {nodes.find(n => n.id === selectedNode)?.type === 'condition' ? (
                     <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                           <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logic Flow Branches</h5>
                           <button className="flex items-center gap-1.5 px-2 py-1 bg-purple-600/10 text-purple-400 rounded text-[8px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all"><Plus size={10} /> Add Branch</button>
                        </div>

                        {/* Branch 1: Critical Threat */}
                        <div className="p-5 bg-black border border-gray-800 rounded-2xl space-y-4 border-l-4 border-l-purple-500 shadow-xl group">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest italic underline decoration-purple-600/30 decoration-2 underline-offset-4">Branch A: Critical Threat</span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Settings2 size={10} className="text-gray-600 cursor-pointer" />
                                <Trash2 size={10} className="text-gray-600 hover:text-red-500 cursor-pointer" />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-4">
                                 <div className="flex items-center gap-3">
                                    <div className="bg-black border border-purple-500/30 px-2 py-1 rounded text-[10px] text-purple-400 font-mono font-bold">Severity</div>
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Equals</span>
                                    <div className="bg-black border border-gray-800 px-2 py-1 rounded text-[10px] text-gray-400">High</div>
                                 </div>
                                 <div className="flex justify-center">
                                    <span className="text-[8px] font-black text-purple-500 bg-purple-600/10 px-3 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest italic">AND GATE</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <div className="bg-black border border-purple-500/30 px-2 py-1 rounded text-[10px] text-purple-400 font-mono font-bold">VT_Score</div>
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Greater Than</span>
                                    <div className="bg-black border border-gray-800 px-2 py-1 rounded text-[10px] text-gray-400">10</div>
                                 </div>
                              </div>
                              <button className="w-full py-2 bg-gray-900 border border-dashed border-gray-700 text-[9px] font-black text-gray-500 uppercase tracking-widest rounded-lg hover:border-purple-500/30 hover:text-purple-400 transition-all">+ Add Nested Condition</button>
                           </div>
                        </div>

                        {/* Branch 2: Whitelist */}
                        <div className="p-5 bg-black border border-gray-800 rounded-2xl border-l-4 border-l-blue-500 shadow-lg">
                           <span className="text-[10px] font-black text-white uppercase tracking-widest italic mb-4 block underline decoration-blue-500/30 decoration-2 underline-offset-4">Branch B: Whitelist IP</span>
                           <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex items-center gap-3">
                              <div className="bg-black border border-blue-500/30 px-2 py-1 rounded text-[10px] text-blue-400 font-mono font-bold">Src_IP</div>
                              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">In List</span>
                              <div className="bg-black border border-gray-800 px-2 py-1 rounded text-[10px] text-gray-400">Internal_Wht</div>
                           </div>
                        </div>

                        {/* Else Branch */}
                        <div className="p-5 bg-black border border-gray-800 rounded-2xl border-l-4 border-l-gray-700 opacity-60">
                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic mb-2 block tracking-[0.2em]">Default: Else</span>
                           <p className="text-[9px] text-gray-600 font-bold italic leading-relaxed">Runs if all specific Logic Paths fail valuation benchmarks.</p>
                        </div>

                        <div className="p-6 bg-purple-600/5 border border-purple-500/10 rounded-3xl mt-10">
                           <div className="flex items-center justify-between mb-4">
                              <h6 className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic">Live Logic evaluation</h6>
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                           </div>
                           <div className="space-y-4">
                              <p className="text-[10px] text-gray-400 font-bold leading-relaxed italic border-l-2 border-purple-600 pl-4">Simulating current data through logic gates...</p>
                              <div className="flex items-center justify-between p-3 bg-black border border-gray-800 rounded-xl">
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Result path</span>
                                 <span className="text-[10px] font-black text-green-400 uppercase bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 shadow-md animate-in fade-in duration-1000 tracking-widest">Branch B</span>
                              </div>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-800 pb-2">Configuration</h5>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Input JSON Mapping</label>
                              <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-[10px] space-y-2 group">
                                 <div className="flex justify-between items-center mb-2">
                                    <span className="text-purple-400 font-bold">query_target</span>
                                    <code className="text-gray-500 italic opacity-50 group-hover:opacity-100 transition-opacity">{"{{ alert.src_ip }}"}</code>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-purple-400 font-bold">api_key</span>
                                    <code className="text-gray-500 italic opacity-50 group-hover:opacity-100 transition-opacity">{"{{ secrets.VT_API }}"}</code>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Error Strategy</label>
                              <div className="grid grid-cols-2 gap-2">
                                 <button className="py-2.5 bg-gray-900 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-md">Retry (3x)</button>
                                 <button className="py-2.5 bg-gray-900 border border-red-500/20 text-[9px] font-black text-red-500/60 uppercase tracking-widest rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-md">Fail Flow</button>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {nodes.find(n => n.id === selectedNode)?.type !== 'condition' && (
                     <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-800 pb-2">Diagnostic Data</h5>
                        <div className="bg-black border border-gray-800 rounded-2xl p-4 overflow-hidden relative group">
                           <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                              <Terminal size={14} className="text-purple-500" />
                           </div>
                           <pre className="text-[9px] font-mono text-gray-500 overflow-x-auto">
                              {`{
  "last_status": "200 OK",
  "execution_time": "342ms",
  "output": {
    "malicious": true,
    "score": 88
  }
}`}
                           </pre>
                        </div>
                     </div>
                   )}

                   <div className="pt-6">
                      <button className="w-full py-3 bg-red-600/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95">Delete Logic Node</button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                   <Box size={48} className="text-gray-700" />
                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] italic">Select a node to inspect</p>
                </div>
              )}
           </div>

           {/* History / Version Bar */}
           <div className="p-6 bg-black/40 border-t border-gray-800">
              <div className="flex items-center justify-between pointer-events-none mb-4">
                 <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Versioning</span>
                 <span className="text-[9px] font-black text-blue-500 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">LIVE: v1.8.4</span>
              </div>
              <div className="space-y-1.5">
                 <button 
                  onClick={() => setActivePlaybookTab('history')}
                  className="w-full py-2 bg-gray-900 border border-gray-800 hover:border-purple-500/30 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest transition-all hover:bg-purple-600/[0.03] flex items-center justify-center gap-2 group"
                 >
                   <History size={12} className="group-hover:text-purple-400 transition-colors" />
                   Review Audit History
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Simulator Overlay */}
      <AnimatePresence>
        {activePlaybookTab === 'simulator' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-20"
          >
             <div className="w-full max-w-2xl bg-[#111114] border border-gray-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-full">
                <div className="h-14 border-b border-gray-800 flex items-center justify-between px-8 bg-black/40">
                   <div className="flex items-center gap-3">
                      <Play size={16} className="text-green-500" />
                      <span className="text-[11px] font-black text-white uppercase italic tracking-widest">Playbook Logic Simulator</span>
                   </div>
                   <button onClick={() => setActivePlaybookTab('canvas')} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest italic tracking-[0.2em]">Input Mock Data (JSON Trigger)</label>
                      <div className="h-48 w-full bg-black border border-gray-800 rounded-3xl p-6 font-mono text-xs overflow-hidden relative group">
                         <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-100 transition-opacity">
                            <Binary size={24} className="text-blue-500" />
                         </div>
                         <pre className="text-blue-400/80 italic leading-relaxed">
                            {`{
  "alert": {
    "source": "TheHive",
    "case_id": "CAS-8822",
    "src_ip": "185.199.110.153",
    "severity": 3,
    "tags": ["Malware", "Phishing"]
  }
}`}
                         </pre>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-black border border-gray-800 rounded-3xl space-y-3 border-l-4 border-l-blue-600">
                         <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Predictive Path</h5>
                         <p className="text-[10px] text-gray-400 font-bold uppercase italic leading-loose underline-offset-4 decoration-blue-500/30 underline">Trigger → IP Scan → High Risk [TRUE] → Manuel L2 Review</p>
                      </div>
                      <div className="p-6 bg-black border border-gray-800 rounded-3xl space-y-3 border-l-4 border-l-purple-600 shadow-xl">
                         <h5 className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Expected Outcome</h5>
                         <p className="text-[11px] text-gray-400 font-bold italic">Node [Block IP] will likely be skipped pending analyst approval.</p>
                      </div>
                   </div>
                   <div className="pt-6">
                      <button 
                        onClick={() => {
                          setIsSimulatorRunning(true);
                          setIsDebugMode(true);
                          setTimeout(() => {
                            setIsSimulatorRunning(false);
                            setActivePlaybookTab('canvas');
                          }, 1500);
                        }}
                        className={cn(
                          "w-full py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95",
                          isSimulatorRunning ? "bg-gray-800 text-gray-500" : "bg-green-600 hover:bg-green-700 text-white shadow-green-900/40"
                        )}
                      >
                        {isSimulatorRunning ? <RefreshCw size={18} className="animate-spin text-green-500" /> : <Play size={18} />}
                        {isSimulatorRunning ? 'Running Simulation...' : 'Dry Run Logic Flow'}
                      </button>
                   </div>
                   <p className="text-center text-[9px] text-gray-600 font-black uppercase tracking-widest italic opacity-50">Simulation uses safe Mock Mode - No traffic or API calls sent to production gateways.</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {activePlaybookTab === 'history' && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 400 }}
            exit={{ height: 0 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-[#09090b] border-t border-gray-800 shadow-[0_-30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
             <div className="h-14 border-b border-gray-800 flex items-center justify-between px-10 bg-black/60 relative">
                <div className="flex items-center gap-3">
                   <History size={16} className="text-purple-500" />
                   <span className="text-[11px] font-black text-white uppercase italic tracking-[0.2em] underline decoration-purple-600 underline-offset-8 decoration-4">Playbook Audit Log & Logic Diffs</span>
                </div>
                <button onClick={() => setActivePlaybookTab('canvas')} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-x-auto p-10 flex gap-8 custom-scrollbar">
                {[
                  { v: 'v1.8.4', date: '2026-04-28 09:42', user: 'Admin A', note: 'Modified conditional logic for internal VLAN detection.', type: 'current' },
                  { v: 'v1.8.3', date: '2026-04-20 14:15', user: 'Admin B', note: 'Added Sub-playbook for Forensic Collection.', type: 'version' },
                  { v: 'v1.8.0', date: '2026-04-12 10:30', user: 'Admin A', note: 'Initial implementation of Cisco ISE integration.', type: 'version' },
                ].map((item, idx) => (
                  <div key={idx} className="w-[450px] flex-shrink-0 p-8 bg-[#111114] border border-gray-800 rounded-[2.5rem] space-y-6 relative group hover:border-purple-500/50 transition-all hover:bg-purple-600/[0.02] shadow-2xl cursor-pointer">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <h4 className="text-lg font-black text-white italic underline decoration-purple-600/30 group-hover:decoration-purple-600 transition-all">{item.v}</h4>
                           <p className="text-[10px] text-gray-600 font-bold uppercase italic">{item.date}</p>
                        </div>
                        {item.type === 'current' && <span className="text-[9px] font-black bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/30 uppercase italic tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.3)]">ACTIVE PRODUCTION</span>}
                     </div>
                     <p className="text-[11px] text-gray-400 font-bold leading-relaxed italic border-l-2 border-purple-600 pl-6 border-opacity-30 group-hover:border-opacity-100 transition-all">"{item.note}"</p>
                     <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-2xl bg-gray-900 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase border border-gray-800">{item.user.substring(0, 2)}</div>
                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.user}</span>
                        </div>
                        <div className="flex gap-4">
                           <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-all underline decoration-blue-500/20 underline-offset-4 decoration-2">Inspect Diff</button>
                           {item.type !== 'current' && <button className="text-[10px] font-black text-gray-500 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-90"><History size={11} /> Rollback</button>}
                        </div>
                     </div>
                  </div>
                ))}
                <div className="w-[300px] flex-shrink-0 border-4 border-dashed border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center opacity-30 hover:opacity-100 hover:border-purple-500/30 transition-all cursor-pointer bg-white/[0.01]">
                   <Maximize2 size={32} className="text-purple-500 mb-4" />
                   <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest italic">View Extended History</span>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


const FORENSICS_LOCALES: Record<string, Record<string, string>> = {
  zh: {
    assistantWelcome: '您好，我是您的 **Gemini 3 數位鑑識專家助理**。\\n\\n本系統之證據設計完全基於**證據不變性（Chain of Custody）**原則。我已完成對當前案件 \`finance_srv_phys.E01\` (檢驗雜湊 MD5: a6b2c89f...) 的底層特徵讀取與物理扇區還原。\\n\\n請下達自然語言指令（例如語意查詢異常 RDP 時間軸、生成客製化 YARA 檢索規則或解析記憶體中還原的編碼 Payload），我將隨時透過**生成式繪圖（Generative UI）Canvas 畫布**即時渲染分析組件！',
    forensicsDeepEngine: '數位鑑識深度引擎',
    verNativeAi: 'Ver 3.5 原生 AI',
    mainTitle: 'AI 驅動型數位鑑識平台',
    mainDesc: '圍繞在證據不變性（Chain of Custody）與高效分析兩大核心原則，深度融合 Google Gemini 多模態與代碼執行能力的前後端分離微服務架構，助您秒級剖析磁碟鏡像與還原勒索威脅。',
    agentOnline: 'Gemini 3.5 Pro 代理線上',
    carvingBtnActive: '正在執行深度物理還原',
    carvingBtnIdle: '一鍵執行 File Carving 還原',
    currentCasesTitle: '當前鑑識案件清單',
    physicalEvidenceTitle: '物理物證清單 (Locks)',
    qty: '數量:',
    hashLocked: '🔒 雜湊鎖定',
    hashCompromised: '⚠️ 校驗失敗',
    sourceLabel: '來源:',
    examinerLabel: '監管人:',
    deviceLabel: '設備:',
    authExaminerSig: '鑑識官數位簽章審計',
    authOfficerText: '執行安全官：已認證 (Chiur)',
    authAuditText: '您的操作日誌均已由實體鑑識微服務 (Sleuthkit / Volatility) 自動串接雜湊寫入受控日誌內，具備完全之法庭法律效力。',
    canvasTitle: 'AI 互動式 Canvas 畫布 (Generative UI)',
    tabOverview: '概述',
    tabTimeline: '異常時間軸',
    tabMultimodal: '多模態截圖',
    tabSandbox: 'UI 渲染沙盒與動態畫布',
    overviewStatusTitle: '當前物理鏡像深度解析狀態',
    overviewStatusDesc: 'AI 檢索微服務已與物理證據鏈條建立管道。請透過右側的 **Gemini 詢問助理** 發送指令「*請分析 2026/06/12 的異常登入時間軸*」或「*請分析受駭電腦螢幕截圖*」來動態轉變此區域。',
    statAnalyzedSectors: '已分析實體磁區',
    statCarvedFiles: '物理還原已刪檔案',
    statCarvedUnit: '件還原',
    statMemoryArtifacts: '記憶體暫存特徵碼',
    statMemoryUnit: '個物件',
    statSecuredCoC: 'MD5 校驗與 E01 完全一致',
    statFileCarvingDeployed: 'File Carving 功能已部署',
    statVolatileTarget: '易失性標的 (Volatile)',
    sandboxSecurityActive: '證據安全隔離沙箱環境已啟動',
    sandboxSecurityDesc: '所有分析僅施加於只讀鏡像對拷，絕對維持法理純潔性。',
    timelineTitle: '異常時間軸 (2026/06/12)',
    timelineSrc: '來源: EventLog Security.evtx 物理提取',
    timelineAlertDesc: 'Gemini 自動提示：點擊上方滑塊節點，可即時驅動下方 Hex Viewer 切換至該突變時間點並解讀。',
    timelineBruteForce: 'RDP 暴破成功',
    timelinePrivEsc: 'PsExec 提權',
    timelineVss: '刪除 VSS 備份',
    timelineRansom: '全磁碟勒索加密',
    timelineBruteForceDesc: '由 185.220.101.4 登入 Administrator',
    timelinePrivEscDesc: '安裝 sec_sys.sys 驅動環節',
    timelineVssDesc: '調用 vssadmin.exe 清空磁區',
    timelineRansomDesc: 'LockBit 3.0 開始重寫快照區段',
    multimodalTitle: 'Gemini 3.5 Pro 多模態截圖研判',
    multimodalFamilyTitle: '勒索病毒家族精準比對',
    multimodalFamilyName: 'LockBit 3.0 (Black)',
    multimodalFeature1: '• **加密擴展名**：.lockbit',
    multimodalFeature2: '• **通訊代理**：Tor onion routing service',
    multimodalFeature3: '• **主要戰術**：Sleuthkit 快照刪除與實體重組硬驅',
    multimodalRecommendationTitle: '對策建議與自動化防護',
    multimodalRecommendationDesc: '該黑客現已成功藉由 API 整合至安全聯防中。請在右側 Copilot 中「部署 YARA 規則」實施全局逆向檢索。',
    sandboxTitle: '物證 UI 即時編譯安全沙盒 (Generative UI Sandbox)',
    sandboxSystemModule: '隔離沙盒模組: Active Production',
    sandboxStep1Title: '1. 鑑識實體數據與上下文組裝',
    sandboxSelectEntity: '選擇可疑實體 (Select Entity Context)',
    sandboxGeminiJson: '📦 送至 Gemini 3.5 設計之結構化數據 (Context JSON)',
    sandboxDesignPrompt: '⚙️ 視覺限制規範（Design System）：',
    sandboxDesignPromptDesc: '背景限定 bg-slate-950, text-slate-100, MFT異動＝藍色, 系統日誌＝橘色, 流量＝紫色, 情資＝紅色高亮。',
    sandboxGenerateBtnCode: '召喚 Gemini 設計師 [自適應生成]',
    sandboxGeneratingText: 'Gemini 正在編寫 UI 中...',
    sandboxStep2Title: '2. Live HTML / Tailwind 代碼編輯',
    sandboxFilterStatus: '過濾狀態:',
    sandboxSecureStatus: '🟢 安全無威脅',
    sandboxWarningStatus: '⚠️ 安全隔離',
    sandboxCompileBtn: '⚡ 重新編譯並熱重載 (Compile & Hot Reload)',
    sandboxStep3Title: '3. 前端動態畫布獨立沙盒 (Generative Canvas)',
    sandboxIsolatedFrame: '隔離框架 (Isolated Frame)',
    sandboxCompilingText: '[COMPILING] 數位簽章對位與安全防護探針隔離中',
    sandboxEscapeWarningTitle: '沙盒代碼逃逸阻斷警報 (Isolation Active)',
    sandboxEscapeWarningDesc: '實體防空汙指引：已偵測到可疑的程式腳本標籤（或 event 注入）。為確保數位證據不變性並杜絕 XSS 進階攻擊，畫布已被安全防護網自動阻斷渲染，請修正並移除惡意指令！',
    sandboxRecoveryBtn: '復原安全代碼',
    sandboxDiagnosticsTitle: '💻 沙盒編譯器診斷與安審日誌 (Diagnostic Logs)',
    md5SuccessFooter: '物理證據安全雜湊對：MD5 Verified Match',
    classicHexViewer: '證據細節與二進位解析檢視器 (Classic Hex Viewer)',
    currentEvidenceLabel: '當前對位證據:',
    sleuthkitPhysicalMap: 'Sleuthkit 物理映射',
    physicalHexViewTitle: '實體十六進位檢視 (Dual-Column layout)',
    currentOffset: '目前偏移:',
    interpretSector: '解讀磁區',
    physicalSectorInterpretation: '物理扇區 AI 語意標註',
    aiMarkPushBtn: '✨ AI 標註此區段並推送至 Copilot',
    sleuthkitMACBTitle: 'Sleuthkit / Coroner 檔案與 MACB 特徵',
    imagePhysicalPath: '鏡像內物理路徑:',
    sizeLabel: '大小:',
    permissionsLabel: '物理權限校準:',
    timelineMACBLabel: '時間戳記 (MACB TimeLine):',
    carvingRecoveryLabel: 'File Carving 還原備忘：',
    carvingRecoverySuccess: '✅ Sleuthkit Carving還原成功：在物理未分配空間（Unallocated Space）偵測到符合 PE 標頭特徵磁區。已完整拼接並隔離恢復，排除 AI 污染篡改。',
    carvingRecoveryNone: '無。此為流式純文字日誌，未偵測到刪除磁區特徵。',
    quickForensicsHeader: '快速 AI 鑑識指令預設 (Generative UI)',
    copilotInputPlaceholder: '詢問 Gemini 鑑識官助理...',
    activeTimelineLabel: '異常登入時間軸',
    ransomScreenMultimodalLabel: '勒索截圖多模態',
    generateYaraRuleLabel: '產生特徵檢索 YARA 規則'
  },
  en: {
    assistantWelcome: 'Hello, I am your **Gemini 3 Digital Forensics Expert Assistant**.==============\\n\\nThe evidence architecture of this system is designed fully according to the **Chain of Custody (CoC)** principle. I have completed reading the low-level signatures and restoring physical sectors for the active case \`finance_srv_phys.E01\` (Validation hash MD5: a6b2c89f...).\\n\\nPlease issue natural language commands (such as querying anomalous RDP timelines, generating custom YARA detection rules, or decoding malicious payloads restored from physical memory), and I will instantly render custom interactive UI components in the **Generative UI Canvas**!',
    forensicsDeepEngine: 'Forensics Deep Engine',
    verNativeAi: 'Ver 3.5 Native AI',
    mainTitle: 'AI-Powered Digital Forensics Platform',
    mainDesc: 'Centered on the principles of Chain of Custody and high-efficiency analysis, our next-gen microservice platform deeply integrates Google Geminis multimodal and code-execution abilities, helping you dissect disk images and recover from ransomware threats within seconds.',
    agentOnline: 'Gemini 3.5 Pro Agent Active',
    carvingBtnActive: 'Executing Deep Physical File Carving',
    carvingBtnIdle: 'Run File Carving Recovery',
    currentCasesTitle: 'Active Forensics Case Registry',
    physicalEvidenceTitle: 'Physical Evidence Log (Locks)',
    qty: 'Qty:',
    hashLocked: '🔒 Hash Locked',
    hashCompromised: '⚠️ Verification Failed',
    sourceLabel: 'Source:',
    examinerLabel: 'Examiner:',
    deviceLabel: 'Device:',
    authExaminerSig: 'Examiner Digital Signature Audit',
    authOfficerText: 'Active Safety Officer: Authenticated (Chiur)',
    authAuditText: 'All operation logs are automatically hashed and integrated into audit trails by Sleuthkit / Volatility services, assuring strict legal custody compliance.',
    canvasTitle: 'AI Interactive Canvas Box (Generative UI)',
    tabOverview: 'Overview',
    tabTimeline: 'Anomalous Timeline',
    tabMultimodal: 'Multimodal Captures',
    tabSandbox: 'UI Sandbox & Canvas',
    overviewStatusTitle: 'Active Disk Physical Analysis Status',
    overviewStatusDesc: 'The AI microservice retrieval channel is successfully bound to the Chain of Custody. Use the **Gemini Co-Examiner** on the right side and input commands like "*Analyze aberrant login times on 2026/06/12*" or "*Analyze system screenshots of the compromised server*" to dynamically transform this canvas view.',
    statAnalyzedSectors: 'Analyzed Physical Sectors',
    statCarvedFiles: 'Carved Files Recovered',
    statCarvedUnit: 'Item(s)',
    statMemoryArtifacts: 'Memory Footprints Identified',
    statMemoryUnit: 'Object(s)',
    statSecuredCoC: 'MD5 matches E01 master hash',
    statFileCarvingDeployed: 'File Carving engine standard run initiated',
    statVolatileTarget: 'Volatile Registry Targets',
    sandboxSecurityActive: 'Evidence-Isolated Sandbox Sandbox Initialized',
    sandboxSecurityDesc: 'All calculations are executed solely in read-only forensic overlay mirrors, securing evidentiary absolute custody status.',
    timelineTitle: 'Anomalous Timeline Tracker (2026/06/12)',
    timelineSrc: 'Source: EventLog Security.evtx physical extraction',
    timelineAlertDesc: 'Gemini Hint: Tap any slider node above to instantly reposition the Hex Viewer underneath to that exact physical offset and translate it.',
    timelineBruteForce: 'Brute-force RDP Succeeded',
    timelinePrivEsc: 'PsExec Privilege Escalation',
    timelineVss: 'VSS Backups Purged',
    timelineRansom: 'Full Disk Ransom Encryption',
    timelineBruteForceDesc: 'Authenticated as Administrator from 185.220.101.4',
    timelinePrivEscDesc: 'Installed sec_sys.sys kernel-level ring driver',
    timelineVssDesc: 'Executed vssadmin.exe deletion sequences',
    timelineRansomDesc: 'LockBit 3.0 ransomware starts overwriting storage sectors',
    multimodalTitle: 'Gemini 3.5 Pro Multimodal Video & Image Triage',
    multimodalFamilyTitle: 'Precise Malware Signature Correlation',
    multimodalFamilyName: 'LockBit 3.0 (Black)',
    multimodalFeature1: '• **Encrypted Ext**: .lockbit',
    multimodalFeature2: '• **Control Proxy**: Tor onion routing services',
    multimodalFeature3: '• **Tactics**: Sleuthkit shadow deletion and physical MFT override',
    multimodalRecommendationTitle: 'Recommended Measures & Adaptive Shield',
    multimodalRecommendationDesc: 'This attacker pattern is successfully synthesized into our active network shield. Use "Deploy YARA rules globally" within the chatbot to begin network-wide active hunting.',
    sandboxTitle: 'Evidentiary UI Compiling Sandbox (Generative UI Sandbox)',
    sandboxSystemModule: 'Sandbox Module Isolation: Active Production',
    sandboxStep1Title: '1. Forensic Entity Data & Context Setup',
    sandboxSelectEntity: 'Select Entity Context',
    sandboxGeminiJson: '📦 Structured Context JSON passed to Gemini 3.5',
    sandboxDesignPrompt: '⚙️ Design System Prompt Guidelines:',
    sandboxDesignPromptDesc: 'Background restricted to bg-slate-950, primary content text-slate-100, MFT changes = Blue, Audit logs = Orange, Netflow = Purple, CTI threat = Highlight Red.',
    sandboxGenerateBtnCode: 'Summon Gemini UI/UX Designer [Adaptive]',
    sandboxGeneratingText: 'Gemini is drafting UI components...',
    sandboxStep2Title: '2. Live HTML / Tailwind Interactive Editor',
    sandboxFilterStatus: 'Sanitization Status:',
    sandboxSecureStatus: '🟢 Safe & Approved',
    sandboxWarningStatus: '⚠️ Isolation Engaged',
    sandboxCompileBtn: '⚡ Recompile & Hot Reload UI',
    sandboxStep3Title: '3. Isolated Rendering Interface (Generative Canvas)',
    sandboxIsolatedFrame: 'Isolated Sandbox Frame',
    sandboxCompilingText: '[COMPILING] Digital signature verification and safety sandbox isolation active',
    sandboxEscapeWarningTitle: 'Sandbox Escape and Code Execution Prevention Active',
    sandboxEscapeWarningDesc: 'Security Shield Action: Unpermitted script hooks or inline events detected. To enforce continuous custody and counter cross-site security threats, the execution layer has isolated this canvas. Please remove malicious nodes or tags!',
    sandboxRecoveryBtn: 'Restore Default Safe Template',
    sandboxDiagnosticsTitle: '💻 Sandbox Diagnostic Trail & Safety Records (Logs)',
    md5SuccessFooter: 'Evidence File Verified Hash Integrity: MD5 Match',
    classicHexViewer: 'Evidence Detail & Binary Analysis Viewer (Classic Hex Viewer)',
    currentEvidenceLabel: 'Active Reference Evidence:',
    sleuthkitPhysicalMap: 'Sleuthkit Physical Map',
    physicalHexViewTitle: 'Physical Hexdecimal view (Dual-Column layout)',
    currentOffset: 'CURRENT OFFSET:',
    interpretSector: 'Decode Sector',
    physicalSectorInterpretation: 'Physical Sector AI Annotation',
    aiMarkPushBtn: '✨ Tag Segment & Send to Copilot',
    sleuthkitMACBTitle: 'Sleuthkit / Coroner File & MACB Metadata',
    imagePhysicalPath: 'Image Physical Path:',
    sizeLabel: 'Size:',
    permissionsLabel: 'Physical Permissions Alignment:',
    timelineMACBLabel: 'Timestamps (MACB TimeLine):',
    carvingRecoveryLabel: 'File Carving Recovery Backlogs:',
    carvingRecoverySuccess: '✅ Sleuthkit Carving success: Detected active contiguous sector matching Win PE headers in Physical Unallocated Space index. Fully reconstructed, verified original MD5 matching template.',
    carvingRecoveryNone: 'None. Streaming plain access stream, no physical deleted partitions or blocks identified.',
    quickForensicsHeader: 'Quick AI Forensics Commands Preset (Generative UI)',
    copilotInputPlaceholder: 'Inquire Gemini about this digital evidence...',
    activeTimelineLabel: 'Abnormal Login Timeline',
    ransomScreenMultimodalLabel: 'Ransom Screen Multimodal',
    generateYaraRuleLabel: 'Generate Signature YARA Rule'
  },
  ja: {
    assistantWelcome: 'こんにちは、私はあなたの **Gemini 3 デジタルフォレンジック専門AIアシスタント** です。\\n\\n本システムの証拠保管設計は、**証拠の同一性（Chain of Custody）**の原則に完全に準拠しています。現在の案件である \`finance_srv_phys.E01\` (検証用ハッシュ値 MD5: a6b2c89f...) の低レイヤー・シグネチャの読み取りと、物理セクタの復元処理を完了しました。\\n\\n「異常なRDPログインのタイムラインを解析して」「カスタムYARAルールの作成をして」「物理メモリから抽出したペイロードをデコードして」といった多様な指示を発行してください。**Generative UIキャンバス** を通じてインタラクティブなUIコンポーネントを即時に描画・生成します！',
    forensicsDeepEngine: 'フォレンジックディープエンジン',
    verNativeAi: 'Ver 3.5 ネイティブ AI',
    mainTitle: 'AI駆動型デジタルフォレンジックプラットフォーム',
    mainDesc: '「証拠の同一性」と「超高速分析」の2つの柱を中心に、Google Geminiの高度なマルチモーダル能力とコード実行環境をビルトインし、ディスクイメージ解析やランサムウェア脅威の復元を数秒で完結する安全なマイクロサービス設計モデルです。',
    agentOnline: 'Gemini 3.5 Pro エージェントオンライン',
    carvingBtnActive: '物理ファイル・カービングを実行中...',
    carvingBtnIdle: '物理フォアカービング（CARVE）実行',
    currentCasesTitle: 'アクティブフォレンジック案件レジストリ',
    physicalEvidenceTitle: '証拠保管ファイル一覧（ハッシュロック）',
    qty: '数量:',
    hashLocked: '🔒 ハッシュ保護済',
    hashCompromised: '⚠️ 完全性不整合あり',
    sourceLabel: 'ソース:',
    examinerLabel: 'アナリスト:',
    deviceLabel: 'デバイス:',
    authExaminerSig: '鑑識官デジタル署名・監査履歴',
    authOfficerText: '主任セキュリティ検証官：認証済 (Chiur)',
    authAuditText: 'アナリストの一連の操作。これらは Sleuthkit / Volatility を用いて自動追記型のハッシュログとして記録され、証拠として高い法的証拠能力を保証します。',
    canvasTitle: 'AIインタラクティブキャンバス（Generative UI）',
    tabOverview: '概要',
    tabTimeline: '異常タイムライン',
    tabMultimodal: 'マルチモーダル判定物',
    tabSandbox: 'UIサンドボックス保護とキャンバス',
    overviewStatusTitle: '現在の物理ディスクイメージ深層解析ステータス',
    overviewStatusDesc: 'AI検索マイクロサービスが証拠の同一性パスにバインドされました。右側の **Gemini 専門アシスタント** に「*2026/06/12の異常ログインタイムラインを可視化して*」など指示を送信すると、このエリアに独自のUIエレメントが即座に生成されます。',
    statAnalyzedSectors: '解析された物理セクタ数',
    statCarvedFiles: '整合復元された削除済ファイル',
    statCarvedUnit: 'ファイル復元',
    statMemoryArtifacts: 'メモリ内で検出された重要フットプリント',
    statMemoryUnit: '個のオブジェクト',
    statSecuredCoC: 'MD5ハッシュ検証：E01原本と完全一致',
    statFileCarvingDeployed: 'ファイルカービング復元エンジンの配備完了',
    statVolatileTarget: '揮発性キャッシュ（Volatile）',
    sandboxSecurityActive: '証拠保管保護サンドボックスが稼働中',
    sandboxSecurityDesc: 'すべてのデータ処理はリードオンリーのイメージコピーに対して行われ、原本の証拠同一性は完全に保証されます。',
    timelineTitle: '異常なログインタイムライン追跡 (2026/06/12)',
    timelineSrc: 'ソース: EventLog Security.evtx 物理抽出',
    timelineAlertDesc: 'Geminiヒント：タイムラインのノードをタップすると、下部の16進数（Hex）ビュワーが瞬時に該当オフセットへ連動移動し、詳細情報を翻訳・解説します。',
    timelineBruteForce: 'RDP 総当たり攻撃（成功）',
    timelinePrivEsc: 'PsExec 特権昇格成功',
    timelineVss: 'VSSバックアップシャドウデータ削除',
    timelineRansom: '全ディスクのランサム暗号化',
    timelineBruteForceDesc: '185.220.101.4 から Administrator 權限でログイン',
    timelinePrivEscDesc: '内核層に sec_sys.sys 署名ドライバを注入',
    timelineVssDesc: 'vssadmin.exe 削除コマンドを実行',
    timelineRansomDesc: 'LockBit 3.0 による高速暗号化ブロック処理開始',
    multimodalTitle: 'Gemini 3.5 Pro マルチモーダル証跡アナリスト',
    multimodalFamilyTitle: 'ランサムウェアマルウェアファミリ詳細一致',
    multimodalFamilyName: 'LockBit 3.0 (Black)',
    multimodalFeature1: '• **暗号化拡張子**: .lockbit',
    multimodalFeature2: '• **通信プロキシ**: Tor オニオン・ルーティング',
    multimodalFeature3: '• **主な戦術**: Sleuthkit シャドウ削除及び物理MFT破壊',
    multimodalRecommendationTitle: '推奨対策＆自動化アクティブシールド',
    multimodalRecommendationDesc: 'この攻撃パターンはセキュリティ連携防御シールドに適用されました。右側のCopilotプロンプトで「YARA検出ルールの配備」を入力して、ネットワーク全体の能動的追跡を開始できます。',
    sandboxTitle: '証拠UI即時ビルド・サンドボックス (Generative UI Sandbox)',
    sandboxSystemModule: 'サンドボックス隔離モード: Active Production',
    sandboxStep1Title: '1. フォレンジックデータ & コンテキストコンテキスト結合',
    sandboxSelectEntity: '疑わしいエンティティの選択',
    sandboxGeminiJson: '📦 Gemini 3.5 に渡される構造化データ(Context JSON)',
    sandboxDesignPrompt: '⚙️ デザインシステム適用ルール:',
    sandboxDesignPromptDesc: '背景は bg-slate-950 限定。主要フォント text-slate-100。MFT変化=青色。監査ログ=オレンジ色。ネットワーク=紫色。CTI=高輝度赤色。',
    sandboxGenerateBtnCode: 'Gemini UI/UXデザイナーを召喚 (自律生成)',
    sandboxGeneratingText: 'Gemini が独自の UI コードをコンパイル中...',
    sandboxStep2Title: '2. リアルタイム HTML / Tailwind CSS エディタ',
    sandboxFilterStatus: '検証プロセス状況:',
    sandboxSecureStatus: '🟢 安全宣言（検証済）',
    sandboxWarningStatus: '⚠️ 例外隔離（ブロック）',
    sandboxCompileBtn: '⚡ コードを再ビルドしてキャンバスに反映',
    sandboxStep3Title: '3. 独立レンダリングキャンバス (Generative Canvas)',
    sandboxIsolatedFrame: '独立サンドボックスフレーム',
    sandboxCompilingText: '[COMPILING] デジタル署名と隔離サンドボックスセキュリティチェックを実行中',
    sandboxEscapeWarningTitle: 'サンドボックスエスケープ防止＆不正スクリプト警告',
    sandboxEscapeWarningDesc: 'セキュリティ・シールド動作：許可されていないスクリプトタグ（またはイベント処理）を検出しました。証拠の同一性を遵守し、XSS脅威からアナリストを保護するため、該当キャンバスのレンダリングを自動で無効化しました。不正タグを取り除いてください。',
    sandboxRecoveryBtn: 'デフォルトの安全なコードに戻す',
    sandboxDiagnosticsTitle: '💻 サンドボックス診断履歴＆安全性レコード（ログ）',
    md5SuccessFooter: '証拠整合性検証：MD5原本と一致 (Integrity OK)',
    classicHexViewer: '証拠詳細・二進解析ビューア (Classic Hex Viewer)',
    currentEvidenceLabel: '現在の証跡対象:',
    sleuthkitPhysicalMap: 'Sleuthkit 物理マッピング',
    physicalHexViewTitle: '実体16進表現 (Dual-Column layout)',
    currentOffset: '対象オフセット:',
    interpretSector: 'セクタ解読',
    physicalSectorInterpretation: 'セクタ物理領域 AI 解析',
    aiMarkPushBtn: '✨ AI 診断アノテーションをCopilotに送信',
    sleuthkitMACBTitle: 'Sleuthkit / Coroner ファイル属性及び MACB メタデータ',
    imagePhysicalPath: 'イメージ内物理パス:',
    sizeLabel: 'サイズ:',
    permissionsLabel: '物理アクセス制限アライメント:',
    timelineMACBLabel: 'タイムスタンプ (MACB TimeLine):',
    carvingRecoveryLabel: 'File Carving ファイル修復記録:',
    carvingRecoverySuccess: '✅ Sleuthkit Carving正常完了：未割り当て空き領域（Unallocated Space）で Windows PE 実行形式ヘッダを検出、ハッシュ完全回復し、原本とのMD5完全一致を確認。',
    carvingRecoveryNone: 'なし。純粋ログストリームのため、物理的に削除されたブロックやファイル破損等は確認されません。',
    quickForensicsHeader: '快速フォレンジックAIコマンドプリセット (Generative UI)',
    copilotInputPlaceholder: 'デジタル証跡について相談する...',
    activeTimelineLabel: '異常タイムライン',
    ransomScreenMultimodalLabel: 'ランサムウェアマルチモーダル',
    generateYaraRuleLabel: 'YARA検出ルールのビルド'
  }
};

const FORENSICS_TEMPLATES: Record<string, Record<string, string>> = {
  zh: {
    svchost: `<div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div>
      <span class="text-[9px] font-mono tracking-widest text-blue-400 uppercase font-black">DETECTION: MULTI-INJECTION LINK</span>
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
        ⚡ 威脅多維交叉時序對齊軌跡 (Evidentiary Card)
      </h3>
    </div>
    <span class="text-[10px] text-red-500 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase">CRITICAL</span>
  </div>

  <div class="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-800">
    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">DISK</div>
      <div class="bg-slate-900/40 border border-blue-500/20 rounded-xl p-3 flex-1 hover:border-blue-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-blue-400 font-bold mb-1">
          <span>🛡️ MFT 實體磁區異動</span>
          <span>Timestamp: 14:22:10</span>
        </div>
        <p class="text-[11px] text-slate-100 font-bold">
          偵測異常檔案寫入：<code class="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/80 text-blue-400 font-mono">C:\\Windows\\Temp\\svch0st.exe</code>
        </p>
        <p class="text-[9px] text-slate-400 mt-1">Sleuthkit 檢索：未分配位元區段重新對位後判定為已被刪除的 PE 還原體。</p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-amber-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]">LOGS</div>
      <div class="bg-slate-900/40 border border-amber-500/20 rounded-xl p-3 flex-1 hover:border-amber-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-amber-400 font-bold mb-1">
          <span>📝 系統安全日誌審計</span>
          <span>ID: Sysmon Event 1</span>
        </div>
        <p class="text-[11px] text-slate-100">
          執行命令包含高度敏感沙盒逃逸引數：
        </p>
        <p class="text-[9px] bg-black/60 p-1.5 rounded text-amber-300 font-mono mt-1 break-all border border-slate-900">
          powershell.exe -ExecutionPolicy Bypass -File C:\\Windows\\Temp\\svch0st.exe
        </p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.2)]">FLOW</div>
      <div class="bg-slate-900/40 border border-purple-500/20 rounded-xl p-3 flex-1 hover:border-purple-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-purple-400 font-bold mb-1">
          <span>🌌 網路連線關聯</span>
          <span>Established Outbound</span>
        </div>
          <p class="text-[11px] text-slate-200">
            受控處理程序向外聯網連線至敏感 C2 位址：
          </p>
          <p class="text-[10px] text-purple-300 font-mono mt-1 font-bold">
            45.227.254.12:443
          </p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-red-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]">CTI</div>
      <div class="bg-red-950/20 border-2 border-red-500/50 rounded-xl p-4 flex-1">
        <div class="flex justify-between text-[10px] font-mono text-red-400 font-black mb-1.5">
          <span>🚨 MISP 情資高對位命中</span>
          <span>Severity: Critical (9.8)</span>
        </div>
        <p class="text-xs text-slate-100 font-bold">
          威脅中繼站警告：
        </p>
        <p class="text-[11px] text-red-200 leading-relaxed mt-1">
          目的地 IP <span class="bg-red-500/20 border border-red-500/50 px-1 py-0.5 rounded font-mono text-red-400">45.227.254.12</span> 被確認屬於具有高度主機勒索加密經驗的犯罪中繼站。
        </p>
      </div>
    </div>
  </div>

  <div class="mt-5 pt-3 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500">
    <span>物理安全沙盒防護</span>
    <span>SOP-SECURE-CHAIN</span>
  </div>
</div>`,
    adversary: `<div class="bg-slate-950 border border-purple-500/30 rounded-2xl p-5 text-slate-100 font-sans shadow-xl max-w-xl mx-auto">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span>
      <h3 class="text-xs font-black tracking-widest text-slate-200 uppercase">C2 FLOW RADAR MONITOR</h3>
    </div>
    <span class="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">PORT 3389 RDP</span>
  </div>
  
  <div class="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between mb-4">
    <div class="text-left w-5/12">
      <p class="text-[9px] text-slate-400 font-mono uppercase tracking-widest">ADVERSARY (TOR)</p>
      <p class="text-sm font-black text-rose-400 mt-1 tracking-wider">185.220.101.4</p>
      <span class="text-[10px] text-slate-500 font-mono">Bypassing Gateway</span>
    </div>
    <div class="w-2/12 flex flex-col items-center justify-center shrink-0">
      <span class="text-[9px] text-purple-400 font-mono font-bold">RDP</span>
      <div class="w-full h-[1px] bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 relative my-1">
        <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]">⚠️</span>
      </div>
      <span class="text-[8px] text-slate-500">154.2 MB</span>
    </div>
    <div class="text-right w-5/12">
      <p class="text-[9px] text-slate-400 font-mono uppercase tracking-widest">DEST TARGET</p>
      <p class="text-sm font-black text-blue-400 mt-1 tracking-wider">192.168.10.88</p>
      <span class="text-[10px] text-slate-500 font-mono">FINANCE-SRV</span>
    </div>
  </div>

  <div class="space-y-2.5">
    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
      <span class="text-xs text-slate-400">協定類型:</span>
      <span class="text-xs text-purple-400 font-mono font-bold">Encrypted RDP Tunnel</span>
    </div>
    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
      <span class="text-xs text-slate-400">登入嘗試次數:</span>
      <span class="text-xs text-amber-400 font-bold">14,210 次嘗試 (Brute-force)</span>
    </div>
    <div class="p-3 bg-red-950/10 border border-red-500/20 flex justify-between items-center">
      <span class="text-xs text-slate-300 font-bold">狀態標記:</span>
      <span class="text-xs text-red-400 font-bold bg-red-950/50 border border-red-500/30 px-1.5 py-0.5 rounded">CTI 威脅中繼站</span>
    </div>
  </div>

  <div class="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center">
    <span class="text-[9px] font-mono text-slate-400">安全隔離沙盒</span>
    <span class="text-[9px] text-purple-400 font-bold">ACTIVE FORENSICS</span>
  </div>
</div>`,
    lockbit: `<div class="bg-slate-950 border border-red-500/30 rounded-2xl p-5 text-slate-100 font-sans shadow-xl max-w-xl mx-auto">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div>
      <span class="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-black">THREAT ARTIFACT IDENTIFICATION</span>
      <h3 class="text-xs font-bold text-slate-205 mt-0.5">☣️ LockBit 3.0 (Black) 勒索威脅指標</h3>
    </div>
    <span class="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">HIGH DANGER</span>
  </div>

  <div class="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
    <div class="flex justify-between border-b border-slate-800 pb-1.5">
      <span class="text-slate-400">加密後綴:</span>
      <span class="font-bold text-red-400">.lockbit</span>
    </div>
    <div class="flex justify-between border-b border-slate-800 py-1.5">
      <span class="text-slate-400">影子複製修刪:</span>
      <span class="font-semibold text-amber-500 font-mono text-[10px]">vssadmin.exe delete shadows /all /quiet</span>
    </div>
    <div class="flex justify-between pt-1.5">
      <span class="text-slate-400">初始化配置庫:</span>
      <span class="font-mono text-[10px] text-slate-300">HKLM\\SOFTWARE\\LockBit</span>
    </div>
  </div>

  <p class="text-[11px] text-slate-400 leading-relaxed mt-3.5 italic border-l-2 border-red-500 pl-3">
    "所有主機物理檔案包含財務紀錄、帳目數據已使用特製暫存器參數被全數加密。"
  </p>
</div>`,
    custom: `<div class="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 text-slate-100 font-sans shadow-xl">
  <div class="border-b border-slate-900 pb-3 mb-4 flex justify-between items-center">
    <h3 class="text-xs font-bold text-slate-100">💻 客製化鑑識分析防護面板</h3>
    <span class="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black">SOP CUSTOM</span>
  </div>
  
  <p class="text-xs text-slate-300 leading-relaxed">
    這是一個經由資由前端設計師指令所生成的即時渲染元件。您可以隨意在左側編輯器修改我的 CSS/HTML 屬性，極速實現物證的可視化！
  </p>
</div>`
  },
  en: {
    svchost: `<div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div>
      <span class="text-[9px] font-mono tracking-widest text-blue-400 uppercase font-black">DETECTION: MULTI-INJECTION LINK</span>
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
        ⚡ Threat Multi-dimensional Timeline Alignment Orbit (Evidentiary Card)
      </h3>
    </div>
    <span class="text-[10px] text-red-500 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase">CRITICAL</span>
  </div>

  <div class="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-800">
    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">DISK</div>
      <div class="bg-slate-900/40 border border-blue-500/20 rounded-xl p-3 flex-1 hover:border-blue-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-blue-400 font-bold mb-1">
          <span>🛡️ MFT Physical Sector Modification</span>
          <span>Timestamp: 14:22:10</span>
        </div>
        <p class="text-[11px] text-slate-100 font-bold">
          Anomalous file write detected: <code class="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/80 text-blue-400 font-mono">C:\\Windows\\Temp\\svch0st.exe</code>
        </p>
        <p class="text-[9px] text-slate-400 mt-1">Sleuthkit scan: Unallocated sector alignment reconstructs a deleted PE payload.</p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-amber-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]">LOGS</div>
      <div class="bg-slate-900/40 border border-amber-500/20 rounded-xl p-3 flex-1 hover:border-amber-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-amber-400 font-bold mb-1">
          <span>📝 System Security Logs Audit</span>
          <span>ID: Sysmon Event 1</span>
        </div>
        <p class="text-[11px] text-slate-100">
          Command line contains sensitive escape arguments:
        </p>
        <p class="text-[9px] bg-black/60 p-1.5 rounded text-amber-300 font-mono mt-1 break-all border border-slate-900">
          powershell.exe -ExecutionPolicy Bypass -File C:\\Windows\\Temp\\svch0st.exe
        </p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.2)]">FLOW</div>
      <div class="bg-slate-900/40 border border-purple-500/20 rounded-xl p-3 flex-1 hover:border-purple-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-purple-400 font-bold mb-1">
          <span>🌌 Netflow Context Relationship</span>
          <span>Established Outbound</span>
        </div>
          <p class="text-[11px] text-slate-200">
            Hacked process initiated connections to remote C2:
          </p>
          <p class="text-[10px] text-purple-300 font-mono mt-1 font-bold">
            45.227.254.12:443
          </p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-red-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]">CTI</div>
      <div class="bg-red-950/20 border-2 border-red-500/50 rounded-xl p-4 flex-1">
        <div class="flex justify-between text-[10px] font-mono text-red-400 font-black mb-1.5">
          <span>🚨 MISP Intelligence Correlation matching</span>
          <span>Severity: Critical (9.8)</span>
        </div>
        <p class="text-xs text-slate-100 font-bold">
          Threat Relay Warning:
        </p>
        <p class="text-[11px] text-red-200 leading-relaxed mt-1">
          Destination IP <span class="bg-red-500/20 border border-red-500/50 px-1 py-0.5 rounded font-mono text-red-400">45.227.254.12</span> confirmed as active ransomware group command center.
        </p>
      </div>
    </div>
  </div>

  <div class="mt-5 pt-3 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500">
    <span>Physical Security Sandbox Shielded</span>
    <span>SOP-SECURE-CHAIN</span>
  </div>
</div>`,
    adversary: `<div class="bg-slate-950 border border-purple-500/30 rounded-2xl p-5 text-slate-100 font-sans shadow-xl max-w-xl mx-auto">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span>
      <h3 class="text-xs font-black tracking-widest text-slate-200 uppercase">C2 FLOW RADAR MONITOR</h3>
    </div>
    <span class="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">PORT 3389 RDP</span>
  </div>
  
  <div class="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between mb-4">
    <div class="text-left w-5/12">
      <p class="text-[9px] text-slate-400 font-mono uppercase tracking-widest">ADVERSARY (TOR)</p>
      <p class="text-sm font-black text-rose-400 mt-1 tracking-wider">185.220.101.4</p>
      <span class="text-[10px] text-slate-500 font-mono">Bypassing Gateway</span>
    </div>
    <div class="w-2/12 flex flex-col items-center justify-center shrink-0">
      <span class="text-[9px] text-purple-400 font-mono font-bold">RDP</span>
      <div class="w-full h-[1px] bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 relative my-1">
        <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]">⚠️</span>
      </div>
      <span class="text-[8px] text-slate-500">154.2 MB</span>
    </div>
    <div class="text-right w-5/12">
      <p class="text-[9px] text-slate-400 font-mono uppercase tracking-widest">DEST TARGET</p>
      <p class="text-sm font-black text-blue-400 mt-1 tracking-wider">192.168.10.88</p>
      <span class="text-[10px] text-slate-500 font-mono">FINANCE-SRV</span>
    </div>
  </div>

  <div class="space-y-2.5">
    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
      <span class="text-xs text-slate-400">Protocol Type:</span>
      <span class="text-xs text-purple-400 font-mono font-bold">Encrypted RDP Tunnel</span>
    </div>
    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
      <span class="text-xs text-slate-400">Login Attempts:</span>
      <span class="text-xs text-amber-400 font-bold">14,210 Attempts (Brute-force)</span>
    </div>
    <div class="p-3 bg-red-950/10 border border-red-500/20 flex justify-between items-center">
      <span class="text-xs text-slate-300 font-bold">Status Flag:</span>
      <span class="text-xs text-red-400 font-bold bg-red-950/50 border border-red-500/30 px-1.5 py-0.5 rounded">CTI Threat Relay</span>
    </div>
  </div>

  <div class="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center">
    <span class="text-[9px] font-mono text-slate-400">Security Sandbox</span>
    <span class="text-[9px] text-purple-400 font-bold">ACTIVE FORENSICS</span>
  </div>
</div>`,
    lockbit: `<div class="bg-slate-950 border border-red-500/30 rounded-2xl p-5 text-slate-100 font-sans shadow-xl max-w-xl mx-auto">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div>
      <span class="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-black">THREAT ARTIFACT IDENTIFICATION</span>
      <h3 class="text-xs font-bold text-slate-205 mt-0.5">☣️ LockBit 3.0 (Black) Threat Indicators</h3>
    </div>
    <span class="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">HIGH DANGER</span>
  </div>

  <div class="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
    <div class="flex justify-between border-b border-slate-800 pb-1.5">
      <span class="text-slate-400">Encryption Suffix:</span>
      <span class="font-bold text-red-400">.lockbit</span>
    </div>
    <div class="flex justify-between border-b border-slate-800 py-1.5">
      <span class="text-slate-400">Volume Shadows Purged:</span>
      <span class="font-semibold text-amber-500 font-mono text-[10px]">vssadmin.exe delete shadows /all /quiet</span>
    </div>
    <div class="flex justify-between pt-1.5">
      <span class="text-slate-400">Registry Initialization:</span>
      <span class="font-mono text-[10px] text-slate-300">HKLM\\SOFTWARE\\LockBit</span>
    </div>
  </div>

  <p class="text-[11px] text-slate-400 leading-relaxed mt-3.5 italic border-l-2 border-red-500 pl-3">
    "All physical database records and accounting directories have been fully compiled and encrypted with custom thread-exclusive keys."
  </p>
</div>`,
    custom: `<div class="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 text-slate-100 font-sans shadow-xl">
  <div class="border-b border-slate-900 pb-3 mb-4 flex justify-between items-center">
    <h3 class="text-sm font-bold text-slate-100">💻 Custom Evidence Analysis Protection Deck</h3>
    <span class="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black">SOP CUSTOM</span>
  </div>
  
  <p class="text-xs text-slate-300 leading-relaxed">
    This component was dynamically compiled and assembled on instructions from your AI Senior Frontend Designer. You can make adjustments to the HTML structure or Tailwind style classes in the editor on the left!
  </p>
</div>`
  },
  ja: {
    svchost: `<div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div>
      <span class="text-[9px] font-mono tracking-widest text-blue-400 uppercase font-black">DETECTION: MULTI-INJECTION LINK</span>
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
        ⚡ 脅威マルチディメンション時系列整列軌跡 (調査証拠カード)
      </h3>
    </div>
    <span class="text-[10px] text-red-500 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase">CRITICAL</span>
  </div>

  <div class="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-800">
    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">DISK</div>
      <div class="bg-slate-900/40 border border-blue-500/20 rounded-xl p-3 flex-1 hover:border-blue-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-blue-400 font-bold mb-1">
          <span>🛡️ MFT物理セクタ修正履歴</span>
          <span>Timestamp: 14:22:10</span>
        </div>
        <p class="text-[11px] text-slate-100 font-bold">
          異常ファイルの書き込みを検出：<code class="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/80 text-blue-400 font-mono">C:\\Windows\\Temp\\svch0st.exe</code>
        </p>
        <p class="text-[9px] text-slate-400 mt-1">Sleuthkitスキャン：未割り当て領域の整列検索により、削除されたPEファイルを再構成しました。</p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-amber-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]">LOGS</div>
      <div class="bg-slate-900/40 border border-amber-500/20 rounded-xl p-3 flex-1 hover:border-amber-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-amber-400 font-bold mb-1">
          <span>📝 系統安全日誌審計</span>
          <span>ID: Sysmon Event 1</span>
        </div>
        <p class="text-[11px] text-slate-100">
          コマンドラインに機密制限回避の引数が含まれています：
        </p>
        <p class="text-[9px] bg-black/60 p-1.5 rounded text-amber-300 font-mono mt-1 break-all border border-slate-900">
          powershell.exe -ExecutionPolicy Bypass -File C:\\Windows\\Temp\\svch0st.exe
        </p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.2)]">FLOW</div>
      <div class="bg-slate-900/40 border border-purple-500/20 rounded-xl p-3 flex-1 hover:border-purple-500/40 transition-all">
        <div class="flex justify-between text-[10px] font-mono text-purple-400 font-bold mb-1">
          <span>🌌 ネットワークフロー相関</span>
          <span>Established Outbound</span>
        </div>
          <p class="text-[11px] text-slate-200">
            乗っ取られたプロセスが外部C2への接続を開始しました：
          </p>
          <p class="text-[10px] text-purple-300 font-mono mt-1 font-bold">
            45.227.254.12:443
          </p>
      </div>
    </div>

    <div class="flex gap-4 relative">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-red-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]">CTI</div>
      <div class="bg-red-950/20 border-2 border-red-500/50 rounded-xl p-4 flex-1">
        <div class="flex justify-between text-[10px] font-mono text-red-400 font-black mb-1.5">
          <span>🚨 MISP威脅インテルマッチング</span>
          <span>Severity: Critical (9.8)</span>
        </div>
        <p class="text-xs text-slate-100 font-bold">
          威脅中繼點警告：
        </p>
        <p class="text-[11px] text-red-200 leading-relaxed mt-1">
          接続先IP <span class="bg-red-500/20 border border-red-500/50 px-1 py-0.5 rounded font-mono text-red-400">45.227.254.12</span> は、高度なランサムウェア攻撃グループの拠点と確認されました。
        </p>
      </div>
    </div>
  </div>

  <div class="mt-5 pt-3 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500">
    <span>物理サンドボックス隔離完了</span>
    <span>SOP-SECURE-CHAIN</span>
  </div>
</div>`,
    adversary: `<div class="bg-slate-950 border border-purple-500/30 rounded-2xl p-5 text-slate-100 font-sans shadow-xl max-w-xl mx-auto">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span>
      <h3 class="text-xs font-black tracking-widest text-slate-200 uppercase">C2 FLOW RADAR MONITOR</h3>
    </div>
    <span class="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">PORT 3389 RDP</span>
  </div>
  
  <div class="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between mb-4">
    <div class="text-left w-5/12">
      <p class="text-[9px] text-slate-400 font-mono uppercase tracking-widest">ADVERSARY (TOR)</p>
      <p class="text-sm font-black text-rose-400 mt-1 tracking-wider">185.220.101.4</p>
      <span class="text-[10px] text-slate-500 font-mono">Bypassing Gateway</span>
    </div>
    <div class="w-2/12 flex flex-col items-center justify-center shrink-0">
      <span class="text-[9px] text-purple-400 font-mono font-bold">RDP</span>
      <div class="w-full h-[1px] bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 relative my-1">
        <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]">⚠️</span>
      </div>
      <span class="text-[8px] text-slate-500">154.2 MB</span>
    </div>
    <div class="text-right w-5/12">
      <p class="text-[9px] text-slate-400 font-mono uppercase tracking-widest">DEST TARGET</p>
      <p class="text-sm font-black text-blue-400 mt-1 tracking-wider">192.168.10.88</p>
      <span class="text-[10px] text-slate-500 font-mono">FINANCE-SRV</span>
    </div>
  </div>

  <div class="space-y-2.5">
    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
      <span class="text-xs text-slate-400">接続方式:</span>
      <span class="text-xs text-purple-400 font-mono font-bold">Encrypted RDP Tunnel</span>
    </div>
    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
      <span class="text-xs text-slate-400">ログイン試行件数:</span>
      <span class="text-xs text-amber-400 font-bold">14,210 回の試行 (総当たりRDP)</span>
    </div>
    <div class="p-3 bg-red-950/10 border border-red-500/20 flex justify-between items-center">
      <span class="text-xs text-slate-300 font-bold">状況フラグ:</span>
      <span class="text-xs text-red-400 font-bold bg-red-950/50 border border-red-500/30 px-1.5 py-0.5 rounded">CTI 威脅中繼に合致</span>
    </div>
  </div>

  <div class="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center">
    <span class="text-[9px] font-mono text-slate-400">セキュリティサンドボックス</span>
    <span class="text-[9px] text-purple-400 font-bold">ACTIVE FORENSICS</span>
  </div>
</div>`,
    lockbit: `<div class="bg-slate-950 border border-red-500/30 rounded-2xl p-5 text-slate-100 font-sans shadow-xl max-w-xl mx-auto">
  <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
    <div>
      <span class="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-black">THREAT ARTIFACT IDENTIFICATION</span>
      <h3 class="text-xs font-bold text-slate-205 mt-0.5">☣️ LockBit 3.0 (Black) 勒索威脅指標</h3>
    </div>
    <span class="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">HIGH DANGER</span>
  </div>

  <div class="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
    <div class="flex justify-between border-b border-slate-800 pb-1.5">
      <span class="text-slate-400">暗号化拡張子:</span>
      <span class="font-bold text-red-400">.lockbit</span>
    </div>
    <div class="flex justify-between border-b border-slate-800 py-1.5">
      <span class="text-slate-400">シャドウ複製削除:</span>
      <span class="font-semibold text-amber-500 font-mono text-[10px]">vssadmin.exe delete shadows /all /quiet</span>
    </div>
    <div class="flex justify-between pt-1.5">
      <span class="text-slate-400">レジストリ初期化:</span>
      <span class="font-mono text-[10px] text-slate-300">HKLM\\SOFTWARE\\LockBit</span>
    </div>
  </div>

  <p class="text-[11px] text-slate-400 leading-relaxed mt-3.5 italic border-l-2 border-red-500 pl-3">
    "財務記録や各種フォルダを含むすべての物理端末ファイルは、特定レジスタパラメータにより完全暗号化されました。"
  </p>
</div>`,
    custom: `<div class="bg-slate-950 border border-indigo-500/30 rounded-xl p-5 text-slate-100 font-sans shadow-xl">
  <div class="border-b border-slate-900 pb-3 mb-4 flex justify-between items-center">
    <h3 class="text-xs font-bold text-slate-100">💻 カスタムフォレンジック可視化パネル</h3>
    <span class="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black font-mono">SOP CUSTOM</span>
  </div>
  
  <p class="text-xs text-slate-300 leading-relaxed">
    このコンポーネントは、AIフロントエンドデザイナーの記述ルールに従い即座にビルドされました。左側のエディターエリアでCSSやTailwindスタイルクラス、HTMLタグを自在に編集して即時にレンダリング検証を行えます！
  </p>
</div>`
  }
};

function LegacyDigitalForensicsView() {
  const { i18n } = useTranslation();
  const currentLang = (i18n && i18n.language) ? (i18n.language.slice(0, 2)) : 'zh';
  const msg = FORENSICS_LOCALES[currentLang] || FORENSICS_LOCALES.zh;
  const templateHTML = FORENSICS_TEMPLATES[currentLang] || FORENSICS_TEMPLATES.zh;

  const [selectedCase, setSelectedCase] = useState('CASE-2026-004');
  const [selectedEvidence, setSelectedEvidence] = useState('EVI-001');
  const [activeCanvasView, setActiveCanvasView] = useState<'overview' | 'timeline' | 'multimodal' | 'sandbox'>('overview');

  // Generative UI Sandbox States
  const [sandboxEntity, setSandboxEntity] = useState<'svchost' | 'adversary' | 'lockbit' | 'custom'>('svchost');
  const [customTask, setCustomTask] = useState('請為以下多維度交叉感染鏈設計一個『時間軸對齊卡片元件』。');
  const [customDisk, setCustomDisk] = useState('發現異常檔案寫入 C:\\Windows\\Temp\\svch0st.exe');
  const [customLog, setCustomLog] = useState('Sysmon ID 1: powershell 啟動了該程序');
  const [customFlow, setCustomFlow] = useState('該程序建立連線至 45.227.254.12:443');
  const [customCti, setCustomCti] = useState('MISP 命中：此 IP 為 BlackByte 勒索軟體 C2 中繼站');
  
  const [compileStatus, setCompileStatus] = useState<'success' | 'idle' | 'warning'>('success');
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    '[SYSTEM] 數位安全沙盒隔離引擎啓動成功',
    '[SYSTEM] 進入只讀鑑識鏈 (SOP-Secure-Isolation)',
    '[SYSTEM] Tailwind CSS 核心樣式庫 3.4.1 已就緒',
    '[AUDIT] 零惡意 Script 代碼探針監控中...'
  ]);
  const [isGeneratingUI, setIsGeneratingUI] = useState(false);
  const [sandboxProgress, setSandboxProgress] = useState(0);

  const [sandboxCode, setSandboxCode] = useState<string>('');

  useEffect(() => {
    if (templateHTML && templateHTML[sandboxEntity]) {
      setSandboxCode(templateHTML[sandboxEntity]);
    }
  }, [currentLang, sandboxEntity]);

  const triggerSandboxCompilation = (newCode: string) => {
    setIsGeneratingUI(true);
    setSandboxProgress(0);
    setSandboxLogs(prev => [
      ...prev,
      `[INF] [${new Date().toLocaleTimeString()}] 開始安全審計分析工程...`,
    ]);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;
      setSandboxProgress(currentProgress);
      
      if (currentProgress === 25) {
        setSandboxLogs(prev => [...prev, '[INF] 正在執行 XSS 安全靜態漏洞掃描...']);
      } else if (currentProgress === 50) {
        setSandboxLogs(prev => [...prev, '[INF] 驗證 HTML 及 CSS 規範是否遵守色標系統...']);
      } else if (currentProgress === 75) {
        setSandboxLogs(prev => [...prev, '[INF] 成功注入 Tailwind CSS Core Styles.']);
      } else if (currentProgress >= 100) {
        clearInterval(interval);
        setIsGeneratingUI(false);
        setCompileStatus('success');
        setSandboxLogs(prev => [
          ...prev,
          `[SUCCESS] 零惡意代碼注入，沙盒執行成功 (MD5: Verify Match).`
        ]);
      }
    }, 150);
  };

  const handleSandboxCodeChange = (val: string) => {
    setSandboxCode(val);
    const hasScript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val) || /on\w+\s*=/gi.test(val);
    if (hasScript) {
      setCompileStatus('warning');
      if (!sandboxLogs.includes('[SEC_WARN] 偵測到潛在惡意代碼注入 (如 Script 標籤或 inline event)，沙盒已自動強制封鎖執行權益！')) {
        setSandboxLogs(prev => [...prev, '[SEC_WARN] 偵測到潛在惡意代碼注入 (如 Script 標籤或 inline event)，沙盒已自動強制封鎖執行權益！']);
      }
    } else {
      setCompileStatus('success');
    }
  };

  // Interactive Gemini Chat State
  const [chatInput, setChatInput] = useState('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'gemini', text: string, code?: string, hasDeployButton?: boolean }>>([]);

  useEffect(() => {
    setChatMessages([
      { 
        sender: 'gemini', 
        text: msg.assistantWelcome 
      }
    ]);
  }, [currentLang]);

  // Forensic Evidence Store
  const cases = [
    { id: 'CASE-2026-004', name: currentLang === 'en' ? 'Financial Host Ransomware Intrusion' : currentLang === 'ja' ? '金融ホストランサムウェア攻撃事件' : '金融主機 Ransomware 勒索事件', status: currentLang === 'en' ? 'Active' : currentLang === 'ja' ? '進行中' : '進行中', date: '2026-06-12' },
    { id: 'CASE-2026-003', name: currentLang === 'en' ? 'Taipei HQ Database API leak' : currentLang === 'ja' ? '台北本社人事データベースAPI漏洩調査' : '台北總部人事庫 API 外洩調查', status: currentLang === 'en' ? 'Archived' : currentLang === 'ja' ? 'アーカイブ済' : '已歸檔', date: '2026-06-08' },
  ];

  const evidenceList = [
    { 
      id: 'EVI-001', 
      name: 'finance_srv_phys.E01', 
      type: currentLang === 'en' ? 'Disk Image Overlay (E01)' : currentLang === 'ja' ? 'ディスク原本イメージ(E01)' : '完整磁碟鏡像 (E01)', 
      size: '256.4 GB', 
      hash: 'MD5: a6b2c89fca6e1aef91236ea9cbde78f2', 
      status: 'locked', // locked or compromised
      examiner: 'Chiur [CH-9912]',
      device: 'Hyper-V Windows Server 2022'
    },
    { 
      id: 'EVI-002', 
      name: 'win_mem_dump.raw', 
      type: currentLang === 'en' ? 'Physical Memory Dump (Volatile)' : currentLang === 'ja' ? '物理メモリダンプ(Volatile)' : '物理記憶體鏡像 (Volatile)', 
      size: '64.0 GB', 
      hash: 'SHA-256: 3c1a89f92adbc018ee89fa72bb3c881fa2', 
      status: 'locked',
      examiner: 'Chiur [CH-9912]',
      device: 'FINANCE-SRV (Memory)'
    },
    { 
      id: 'EVI-003', 
      name: 'ceo_mobile_backup.ufdr', 
      type: currentLang === 'en' ? 'Mobile Decoupled Logic Backup' : currentLang === 'ja' ? 'モバイルデバイス論理・物理バックアップ' : '行動裝置邏輯物理備份', 
      size: '128.2 GB', 
      hash: 'SHA-256: d83b77ab22cd81a9f023ea519bfb8fa9c', 
      status: 'locked',
      examiner: 'Chiur [CH-9912]',
      device: 'Cellebrite Extraction (iPhone 15 Pro)'
    },
    { 
      id: 'EVI-004', 
      name: 'exchange_server_logs.log', 
      type: currentLang === 'en' ? 'Exchange Web Service Logs' : currentLang === 'ja' ? 'Exchangeウェブ・アクセスログ' : 'Exchange 網路與存取日誌', 
      size: '12.4 GB', 
      hash: currentLang === 'en' ? 'MD5: b81d77a834ef... (⚠️ Discrepancy!)' : currentLang === 'ja' ? 'MD5: b81d77a834ef... (⚠️ 整合性例外！)' : 'MD5: b81d77a834ef... (⚠️ 雜湊不一致！)', 
      status: 'compromised', // Hash doesn't match baseline
      examiner: 'Chiur [CH-9912]',
      device: 'Exchange Server IIS Portal'
    },
  ];

  // Active Hex Viewer state
  const [selectedHexOffset, setSelectedHexOffset] = useState('0x000F83C0');
  const [selectedHexValue, setSelectedHexValue] = useState('4D 5A 90 00 03 00 00 00');
  const [selectedHexInterpretation, setSelectedHexInterpretation] = useState('PE 執行檔標頭：MZ 簽章 (DOS Header)，代表該磁區快照中可能藏有已被刪除或提權植入的二進位執行程式。');
  const [isCarvingActive, setIsCarvingActive] = useState(false);
  const [carvingProgress, setCarvingProgress] = useState(100);

  // Hex viewer grid content based on selection
  const getHexData = () => {
    if (selectedEvidence === 'EVI-004') {
      // Exchange logs fake hex
      return [
        { offset: '0x000A1A00', hex: '2F 61 70 69 2F 76 31 2F 61 75 74 68 20 48 54 54', ascii: '/api/v1/auth HTT' },
        { offset: '0x000A1A10', hex: '50 2F 31 2E 31 20 32 30 30 20 4F 4B 20 2D 20 49', ascii: 'P/1.1 200 OK - I' },
        { offset: '0x000A1A20', hex: '50 3A 20 31 38 35 2e 32 32 30 2e 31 30 31 2e 34', ascii: 'P: 185.220.101.4' },
        { offset: '0x000A1A30', hex: '20 75 73 65 72 3A 61 64 6D 69 6e 69 73 74 72 61', ascii: ' user:administra' },
        { offset: '0x000A1A40', hex: '74 6F 72 20 41 75 74 68 53 65 63 74 6F 72 20 42', ascii: 'tor AuthSector B' },
        { offset: '0x000A1A50', hex: '41 53 45 36 34 20 45 4E 43 4F 44 45 44 20 53 45', ascii: 'ASE64 ENCODED SE' },
        { offset: '0x000A1A60', hex: '53 53 49 4F 4E 3A 20 59 57 52 74 61 57 34 7a 64', ascii: 'SSION: YWRtaW4zd' },
        { offset: '0x000A1A70', hex: '48 4a 70 64 47 56 79 4c 6e 42 6f 63 33 4d 3d 0d', ascii: 'HJpdGVyLnBoc3M=' },
      ];
    }
    // Default MZ header for finance server physical image
    return [
      { offset: '0x000F83C0', hex: '4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00', ascii: 'MZ..............' },
      { offset: '0x000F83D0', hex: 'B8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00', ascii: '........@.......' },
      { offset: '0x000F83E0', hex: '00 00 00 00 00 00 00 00 00 00 00 00 f0 00 00 00', ascii: '............ð...' },
      { offset: '0x000F83F0', hex: '0E 1F BA 0E 00 B4 09 CD 21 B8 01 4C CD 21 54 68', ascii: '..º..´.Í!¸.LÍ!Th' },
      { offset: '0x000F8400', hex: '69 73 20 70 72 6F 67 72 61 6D 20 63 61 6E 6E 6F', ascii: 'is program canno' },
      { offset: '0x000F8410', hex: '74 20 62 65 20 72 75 6E 20 69 6E 20 44 4F 53 20', ascii: 't be run in DOS ' },
      { offset: '0x000F8420', hex: '6D 4F 64 65 2E 0D 0D 0A 24 00 00 00 00 00 00 00', ascii: 'mode....$.......' },
      { offset: '0x000F8430', hex: '50 45 00 00 4C 01 05 00 D9 5E CB 65 00 00 00 00', ascii: 'PE..L...Ù^Ëe....' },
    ];
  };

  // Sleuthkit & Extracted attributes metadata
  const currentAttr = {
    path: selectedEvidence === 'EVI-004' 
      ? 'C:\\inetpub\\logs\\LogFiles\\W3SVC1\\u_ex260612.log'
      : 'C:\\Windows\\System32\\drivers\\sec_sys.sys (🔍 ' + (currentLang === 'en' ? 'Carved Deleted Executable Binary' : currentLang === 'ja' ? '修復した削除済み実行バイナリ' : '物理還原已刪執行檔二進位') + ')',
    size: selectedEvidence === 'EVI-004' ? '12.4 GB' : '524 KB',
    permissions: 'NTFS Integrity Check // FULL CONTROL',
    timestamps: {
      modified: '2026-06-12 02:40:50 (M)',
      accessed: '2026-06-12 02:40:50 (A)',
      created: '2026-06-12 02:15:20 (C)',
      born: '2026-06-12 02:15:20 (B)',
    },
    carvingRecovery: selectedEvidence === 'EVI-001' 
      ? msg.carvingRecoverySuccess 
      : msg.carvingRecoveryNone
  };

  // Alert message for one-click deployment
  const [alertNotification, setAlertNotification] = useState<string | null>(null);

  const triggerDeployNotification = (ruleName: string) => {
    const activeText = currentLang === 'en' 
      ? `🚀 [Retrieval Engine Synced] YARA Rule "${ruleName}" successfully compiled into Velociraptor / Sleuthkit physical search core! Security sync complete.` 
      : currentLang === 'ja'
      ? `🚀 [シグネチャ同期完了] YARAルール「${ruleName}」が Velociraptor / Sleuthkit の検索エンジンに書き込まれました！安全な同期が完了しました。`
      : `🚀 [檢索核心部署成功] YARA 檢索規則「${ruleName}」已安全寫入 Velociraptor / Sleuthkit 物理特徵檢索核心！全網聯防探針已在 5 秒內同步上線。`;
    setAlertNotification(activeText);
    setTimeout(() => {
      setAlertNotification(null);
    }, 6000);
  };

  // Simulation handlers for Chat presets
  const handleChatPreset = (type: 'timeline' | 'multimodal' | 'yara') => {
    setChatInput('');
    setIsCopilotTyping(true);

    if (type === 'timeline') {
      setActiveCanvasView('timeline');
      // Add user message
      const userText = currentLang === 'en' ? 'Analyze anomalous RDP login timeline.' : currentLang === 'ja' ? '2026/06/12の異常ログインタイムラインを可視化して。' : '請分析 2026/06/12 的異常登入時間軸。';
      setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
      
      setTimeout(() => {
        setIsCopilotTyping(false);
        const replyText = currentLang === 'en'
          ? `🎯 **Anomalous RDP Login Timeline Analysis**: \n\nBased on physical disk log analysis, Gemini 3 Pro identified suspicious high-frequency RDP password spraying on **2026/06/12**. Focus of suspicion is at **02:15:20**, when the adversary hacked into the system administrator (\`Administrator\`) account from proxy IP \`185.220.101.4\`. \n\n**Timeline Signature Features**:\n1. At **02:18:10**, escalated privileges to kernel space via \`psexec.exe\`.\n2. At **02:22:45**, executed \`vssadmin\` commands to purge shadow backups.\n3. At **02:40:00**, initiated encryption sequences using LockBit 3.0.\n\nI have rendered the dynamic **Timeline Slider** in the Center Canvas above. Tap nodes to position the Classic Hex Viewer underneath.`
          : currentLang === 'ja'
          ? `🎯 **異常なRDPログインタイムラインの分析結果**：\n\n物理ディスクのログ分析に基づき、Gemini 3 Proは**2026/06/12**に不審な高頻度のRDPログイン試行（ブルートフォース）を検出しました。最大脅威は**02:15:20**。悪意のある送信元IP \`185.220.101.4\` から \`FINANCE-SRV\` の管理者（Administrator）アカウントへの不正侵入に成功しました。\n\n**時系列痕跡の特長**：\n1. **02:18:10**：\`psexec.exe\` サービスを悪用して**特権昇格・管理者権限**への常駐・持続化に移行。\n2. **02:22:45**：バックグラウンドで \`vssadmin\` を呼び出し、データの復元を妨げるため**シャドウコピーのバックアップを全削除**。\n3. **02:40:00**：LockBit 3.0 ランサムウェアを用いた大規模暗号化処理を開始。\n\nセンターキャンバスに**「異常時系列動性スライダー」**コンポーネントを描画しました。該当ノードをクリックして下部Hexビュワーにて対象セクタを翻訳・解析できます。`
          : `🎯 **異常 RDP 登入時間軸研判結果**：\n\n基於當前實體磁碟日誌 analysis，Gemini 3 Pro 解析出 **2026/06/12** 存在可疑的高頻 RDP 登入暴破。核心異常集中在於 **02:15:20**，攻擊者由惡意代理 IP \`185.220.101.4\` 成功暴破進入 \`FINANCE-SRV\` 的系統管理員 (Administrator) 帳戶。\n\n**研判軌跡特徵**：\n1. 隨即在 **02:18:10** 透過 \`psexec.exe\` 服務實施**特權提升**與持久化。\n2. 在 **02:22:45** 調用 \`vssadmin\` 在背景**刪除磁區影子複製備份**防止復原。\n3. 在 **02:40:00** 發起大規模檔案磁區加密、留存 LockBit 勒索信案。\n\n我已在 **Center Canvas 畫布**渲染了**「異常時序動態滑塊 (Timeline Slider)」**組件，您可以點擊任一節點即時在下方 Hex Viewer 中觀察該威脅時間點對應的日誌二進位檔案結構。`;

        setChatMessages(prev => [...prev, { sender: 'gemini', text: replyText }]);
      }, 1000);
    } 
    
    else if (type === 'multimodal') {
      setActiveCanvasView('multimodal');
      const userText = currentLang === 'en' ? 'Please analyze system screenshot and signature family.' : currentLang === 'ja' ? '感染マシンのスクリーンショットと脅威ファミリーを解析して。' : '請分析受駭電腦螢幕截圖 / 勒索軟體特徵。';
      setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
      
      setTimeout(() => {
        setIsCopilotTyping(false);
        const replyText = currentLang === 'en'
          ? `🖼️ **Multimodal Ransomware Recognition Report**: \n\nAnalyzing the compromised desktop preview uploaded by the forensics officer:\n- **Signature A**: System background has been replaced with the lock screen message: "ALL YOUR FILES ARE ENCRYPTED..."\n- **Signature B**: Files prepended or appended with the \`.lockbit\` extension are recursively spread.\n- **Signature C**: Instructions detail Tor anonymization portals at address \`lockbitapt...onion\`.\n\n**Cyber Threat Intelligence (CTI) Correlation Output**:\n- **Matching threat family**: **LockBit 3.0 (Black)**\n- **Known Indicator of Compromise (IOC)**: Mutates registry paths \`HKLM\\SOFTWARE\\LockBit\` to store cryptographic seeds, and purge recovery backup pools via \`vssadmin.exe delete shadows /all /quiet\`.\n\nWe locked this metadata cluster in the Main Canvas to display active threat profiles.`
          : currentLang === 'ja'
          ? `🖼️ **マルチモーダルランサムウェア識別報告書**：\n\n管理者からアップロードされた、感染マシンの画面スクリーンショットの分析結果をお知らせします：\n- **特徴 A**：システムの壁紙が「ALL YOUR FILES ARE ENCRYPTED...（すべてのファイルを暗号化した）」という黒背景に赤文字の警告画面へ完全に置き換わっています。\n- **特徴 B**：デスクトップ上のすべてのドキュメント等に \`.lockbit\` という拡張子が自動付与されています。\n- **特徴 C**：Tor匿名通信チャネルのURL：\`lockbitapt...onion\` 記載の身代金請求書（Ransom Note）がMFTセクタ内へ書き込まれています。\n\n**脅威インターフェース CTI とのマッチング判定**：\n- **判定脅威ファミリー**：**LockBit 3.0 (Black)**\n- **既知の攻撃特徴（IOC）**：レジストリ \`HKLM\\SOFTWARE\\LockBit\` を改ざんして強制暗号化を行い、同時にシャドウコピーを抹消するためにコマンド \`vssadmin.exe delete shadows /all /quiet\` を実行。\n\nCenter Canvas に「マルチモーダルランサムウェア脅威カード」をレンダリングし、ファミリー対比・防御を提示しています。`
          : `🖼️ **多模態勒索軟體辨識報告**：\n\n分析鑑識官所上傳的被害系統螢幕截圖：\n- **特徵 A**：系統壁紙已被替換為「ALL YOUR FILES ARE ENCRYPTED...」的黑底紅字警告頁面。\n- **特徵 B**：桌面隨處可見 \`.lockbit\` 後綴名的加密檔案。\n- **特徵 C**：提示中附帶了 Tor 匿名通訊渠道的網址：\`lockbitapt...onion\`。\n\n**結合威脅情資（CTI）比對結果**：\n- **精準匹配威脅家族**：**LockBit 3.0 (Black)**\n- **已知 IOC 攻擊特徵**：利用登錄檔 \`HKLM\\SOFTWARE\\LockBit\` 初始化加密常數，並透過 \`vssadmin.exe delete shadows /all /quiet\` 強力抹除快照。\n\n核心數據已加載至 Center Main Canvas 的「多模態勒索軟體卡片組件」，可觀察與該惡意家族關聯之 YARA 指標及系統阻斷對策。`;

        setChatMessages(prev => [...prev, { sender: 'gemini', text: replyText }]);
      }, 1000);
    }
  };

  // Custom single chat query input
  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsCopilotTyping(true);

    setTimeout(() => {
      setIsCopilotTyping(false);
      let reply = '';
      let code: string | undefined;
      const lower = userText.toLowerCase();

      const hitsTimeline = lower.includes('時間') || lower.includes('登入') || lower.includes('timeline') || lower.includes('time') || lower.includes('rdp');
      const hitsMultimodal = lower.includes('圖片') || lower.includes('螢幕') || lower.includes('截圖') || lower.includes('勒索') || lower.includes('screenshot') || lower.includes('wall') || lower.includes('ext');
      const hitsYara = lower.includes('yara') || lower.includes('規則') || lower.includes('rule');

      if (hitsTimeline) {
        setActiveCanvasView('timeline');
        reply = currentLang === 'en'
          ? `🎯 **Command Handled: Canvas Switched to RDP Login Timeline Analysis**:\n\nSuccessfully isolated events on \`finance_srv_phys.E01\`. Identified anomalous high-frequency brute force logins highlighted on the Canvas slider above.\nSource: \`185.220.101.4\` (Tor Node)\nTarget account: \`Administrator\`\nSeverity: **CRITICAL ⚠️**`
          : currentLang === 'ja'
          ? `🎯 **指示を受理：キャンバスを「異常ログインタイムライン解析」に切り替えました**：\n\n\`finance_srv_phys.E01\` 磁気ディスク内のログから不審なブルートフォース軌跡をフィルタリングしました（詳細履歴は上記スライダーに連動）。\n侵入元IP: \`185.220.101.4\` (Tor)\n対象アカウント: \`Administrator\`\n脅威レベル: **CRITICAL ⚠️**`
          : `🎯 **分析命令已受理，動態 Canvas 已切換至「異常登入時間軸分析」**：\n\n已成功過濾 \`finance_srv_phys.E01\` 發送的事件，辨識出關鍵暴迫登入起點（詳細軌跡已於 Canvas 動態高亮）。\nIP來源：\`185.220.101.4\` (基於 Tor Proxy)\n帳戶：\`Administrator\`\n鑑識等級：**CRITICAL ⚠️**`;
      } else if (hitsMultimodal) {
        setActiveCanvasView('multimodal');
        reply = currentLang === 'en'
          ? `🖼️ **Multimodal Recognition Completed (Canvas Switched)**:\n\nFinished OCR and semantic payload association of the uploaded suspicious screenshot. Family correlated to **LockBit 3.0**. Cross-examined in forensic file registries, matched payload program: \`sec_sys.sys\`.`
          : currentLang === 'ja'
          ? `🖼️ **マルチモーダル認識エンジン起動（キャンバスを切り替え）**：\n\n証拠スクリーンショットのOCRと脅威インテルの相互照合を完了。ファミリーは **LockBit 3.0** と断定しました。物理スキャンデータベースにおいて、1件の合致ファイル \`sec_sys.sys\` を不時着セクションに特定。`
          : `🖼️ **多模態識別組件渲染完畢（已切換 Canvas）**：\n\n已完成對可疑螢幕截圖的 OCR 與多模態語意關聯分析。AI 模組判明為 **LockBit 3.0**。我們已經為您鏈接了 MD5/SHA256 惡意文件比對庫，在物理檢索中發現 1 處吻合程式：\`sec_sys.sys\`。`;
      } else if (hitsYara) {
        reply = currentLang === 'en'
          ? `✍️ **Adaptive Forensic YARA Rule Generated Based on Your Query**:\n\nYou can review code structure, and press the sync button below to immediately deploy physical guards into Velociraptor Core:`
          : currentLang === 'ja'
          ? `✍️ **ご希望の YARA シグニチャ検出ルールが自律生成されました**：\n\nコード以下の「一鍵配備（Velociraptorと同期）」ボタンをクリックすると、ホストクラスタの深層スキャンエンジンの高速展開を行います。`
          : `✍️ **基於您詢問的 YARA 規則需求，已自動生成客製化檢索特徵碼**：\n\n可直接點擊程式碼下方的「一鍵部署至檢索核心」按鈕進行極速佈防。`;
        
        code = `rule Forensic_Query_Custom {\n    meta:\n        author = "Gemini AI Agent"\n        source_evidence = "finance_srv_phys.E01"\n    strings:\n        $custom_sig = /${lower.replace(/[^a-zA-Z0-9]/g, '') || 'suspicious_payload'}/ i\n    condition:\n        $custom_sig\n}`;
      } else {
        reply = currentLang === 'en'
          ? `🧠 **CO-Examiner Gemini has integrated your command**: "${userText}"\n\nUnder strict evidentiary isolation rules, the active asset \`${evidenceList.find(e => e.id === selectedEvidence)?.name}\` is globally write-protected. Under correlation analysis, this search matches deleted cache paths in NTFS metadata.\n\n💡 Tip: You can click the **Forensics AI Command Presets** underneath to drive the dynamic Generative UI Sandbox, time sliders, or multimodal ransomware profiles directly!`
          : currentLang === 'ja'
          ? `🧠 **AIデジタルフォレンジックエージェントが指示を解釈しました**: "${userText}"\n\n証拠保管の整合性ルールに基づき、対象証跡 \`${evidenceList.find(e => e.id === selectedEvidence)?.name}\` はライトプロテクト（書き込み保護）状態に維持されています。Gemini 3 Proがホスト内の非割り当てNTFSセクションとログキャッシュを相互に探索しました。\n\n💡 ヒント：Copilotチャット入力欄の下にある「快速AIコマンド」をクリックすると、時系列のインタラクティブ・アニメーションやマルチモーダル分析を直接呼び出せます。`
          : `🧠 **AI 鑑識助理已理解您的指令：** "${userText}"\n\n依據證據鏈規範，當前證據 \`${evidenceList.find(e => e.id === selectedEvidence)?.name}\` 處於實體唯讀保護。我已通過與 Google AI Studio (Gemini 3 Pro) 進行代理通信，判別此項搜尋目標與主機內被刪除的 NTFS 暫存日誌一致。\n\n建議您可以試試看點擊 Copilot 下方的**「快速 AI 鑑識指令」預設按鈕**，直接體驗動態 Canvas Generative UI、時間軸滑動、或是多模態勒索軟體特徵卡片渲染！`;
      }

      setChatMessages(prev => [...prev, { sender: 'gemini', text: reply, code, hasDeployButton: !!code }]);
    }, 1200);
  };

  // Highlight specific hex row
  const handleHexRowClick = (offset: string, hexBytes: string, ascii: string) => {
    setSelectedHexOffset(offset);
    setSelectedHexValue(hexBytes);
    if (selectedEvidence === 'EVI-004') {
      setSelectedHexInterpretation(
        currentLang === 'en'
          ? `Web logs capture Exchange REST API remote calls dispatched from cyber proxy ${ascii.trim() || '185.220.101.4'}, containing obfuscated Base64 security string metadata. Suspected authentication harvesting.`
          : currentLang === 'ja'
          ? `ウェブアクセスログから、不審なプロキシサーバ ${ascii.trim() || '185.220.101.4'} によって試行された Exchange REST API の遠隔呼び出し形跡、およびBase64難読化された特権アクセスログを発見。`
          : `Web日誌記錄了由威脅代理IP 185.220.101.4 進行的 Exchange REST API 遠端調用，包含 base64 認證字串，疑似進行特權探測。`
      );
    } else {
      if (offset === '0x000F83C0') {
        setSelectedHexInterpretation(
          currentLang === 'en'
            ? 'Portable Executable header signature: DOS Header standard MZ signature. Indicates possible existence of a deleted binary artifact or kernel privilege driver implanted on this volume partition.'
            : currentLang === 'ja'
            ? 'PE（可移植実行）ヘッダー：DOSヘッダのMZ署名。不法な特権昇格ドライバ、または不審な隠し削除バイナリエレメントが該当ストレージセグメント内に存在する疑いを示唆。'
            : 'PE 執行檔標頭：MZ 簽章 (DOS Header)，代表該磁區快照中可能藏有已被刪除或提權植入的二真位元執行程式。'
        );
      } else if (offset === '0x000F8400' || offset === '0x000F8410') {
        setSelectedHexInterpretation(
          currentLang === 'en'
            ? 'PE string resource segment. Identifies legacy warning string "This program cannot be run in DOS mode.", confirming traditional Windows execution core structure.'
            : currentLang === 'ja'
            ? 'PEビルド文字列領域。レガシーDOS互換「This program cannot be run in DOS mode.」を明示、標準のWindowsバイナリファイル形式定義を実証。'
            : 'PE 提示訊息區段：表明 "This program cannot be run in DOS mode."，這是典型的 Windows 可執行檔二進位標誌。'
        );
      } else if (offset === '0x000F8430') {
        setSelectedHexInterpretation(
          currentLang === 'en'
            ? 'PE Signature Header "PE\\0\\0", proving the file structure belongs to a complete 32 or 64-bit Windows execution thread. Integrity matches baseline perfectly.'
            : currentLang === 'ja'
            ? 'PE署名ヘッダ「PE\\0\\0」。分析対象ドライブ内に32ビットまたは64ビットの完全な形式でWindows実行イメージが維持されていることを担保、証拠の同一性を証明。'
            : 'PE 簽章標頭 (Portable Executable Signature)，偏移值證明該程式碼是完整的 32/64 位元 Windows PE 快照，不變性狀態完好。'
        );
      } else {
        setSelectedHexInterpretation(
          currentLang === 'en'
            ? `Disk raw sector offset ${offset}, loaded physical signature: "${ascii.trim()}". Standard parity MD5 checks are secure, assuring zero evidence manipulation.`
            : currentLang === 'ja'
            ? `物理オフセット領域 ${offset}、格納されたデータ： 「${ascii.trim()}」。検証ハッシュMD5チェックサムの改ざんは認められず、証拠は原本状態に一致。`
            : `物理偏移區段 ${offset}，包含關鍵字特徵 \`${ascii.trim()}\`。底層簽章計算 MD5 無偏離，符合證據不變性。`
        );
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 text-gray-200">
      
      {/* Platform Banner Header */}
      <div className="bg-[#0b0c10] border border-gray-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center border border-blue-400/20 shadow-[0_0_25px_rgba(59,130,246,0.25)]">
              <Zap size={28} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded tracking-widest uppercase">Forensics Deep Engine</span>
                <span className="text-[10px] font-mono text-gray-400">Ver 3.5 Native AI</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-widest uppercase mt-1">
                AI 驅動型數位鑑識平台
              </h1>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                圍繞在<span className="text-blue-400 font-bold">證據不變性（Chain of Custody）</span>與<span className="text-teal-400 font-bold">高效分析</span>兩大核心原則，深度融合 Google Gemini 多模態與代碼執行能力的前後端分離微服務架構，助您秒級剖析磁碟鏡像與還原勒索威脅。
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black/40 border border-white/5 py-1.5 px-3 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] font-bold text-gray-300">Gemini 3 Pro Agent 在線</span>
            </div>
            <button 
              onClick={() => {
                setIsCarvingActive(true);
                setCarvingProgress(0);
                const interval = setInterval(() => {
                  setCarvingProgress(prev => {
                    if (prev >= 100) {
                      clearInterval(interval);
                      setIsCarvingActive(false);
                      return 100;
                    }
                    return prev + 20;
                  });
                }, 200);
              }}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              {isCarvingActive ? `正在執行深度物理還原 (${carvingProgress}%)` : '一鍵執行 File Carving 還原'}
            </button>
          </div>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alertNotification && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-400 font-medium animate-bounce flex items-center gap-3 shadow-lg shadow-emerald-950/30">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{alertNotification}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* SECTION 1: Left Case & Evidence Sidebar (col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Active Case Card */}
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Database size={15} className="text-indigo-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest">當前鑑識案件清單</span>
            </div>
            <div className="space-y-2">
              {cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCase(c.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    selectedCase === c.id 
                      ? 'bg-indigo-600/10 border-indigo-500/40 shadow-inner' 
                      : 'bg-black/30 border-white/[0.03] hover:bg-black/50 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-black text-indigo-400">{c.id}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                      c.status === '進行中' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'
                    }`}>{c.status}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-200 truncate">{c.name}</span>
                  <span className="text-[10px] text-gray-500">{c.date}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Evidence List Card */}
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-blue-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">物理物證清單 (Locks)</span>
              </div>
              <span className="font-mono text-[10px] text-blue-400 font-bold">Qty: {evidenceList.length}</span>
            </div>

            <div className="space-y-2.5">
              {evidenceList.map(evi => (
                <button
                  key={evi.id}
                  onClick={() => setSelectedEvidence(evi.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all relative ${
                    selectedEvidence === evi.id 
                      ? 'bg-blue-950/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-black/30 border-white/[0.03] hover:bg-black/50 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="truncate">
                      <span className="text-xs font-bold text-gray-200 block truncate">{evi.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono italic block mt-0.5">{evi.type} • {evi.size}</span>
                    </div>
                    
                    {/* Hash Lock status */}
                    <div className="shrink-0 pt-0.5">
                      {evi.status === 'locked' ? (
                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded select-none cursor-help" title="證據鏈完整無缺，雜湊防篡改已鎖定">
                          <Lock size={10} />
                          <span>🔒 雜湊鎖定</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[9px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse select-none cursor-help" title="雜湊校驗警告！日誌與基準特質比對不符">
                          <AlertTriangle size={10} />
                          <span>⚠️ 校驗失敗</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-gray-500">
                    <span>來源: {evi.device}</span>
                    <span>監管人: {evi.examiner}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Examiner Signature Card */}
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-2 text-left">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">鑑識官數位簽章審計</span>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-gray-300">執行安全官：Authenticated (Chiur)</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                您的操作日誌均已由實體鑑識微服務 (Sleuthkit / Volatility) 自動串接雜湊寫入受控日誌內，具備完全之法庭法律效力。
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Center Main Interactive Generative Canvas (col-span-6) */}
        <div className="xl:col-span-6 space-y-6">
          
          {/* Canvas Card */}
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-[2.5rem] p-6 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-40 h-40 bg-purple-600/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-gray-900 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="text-purple-400 animate-spin" size={16} />
                <h2 className="text-xs font-black text-white uppercase tracking-widest italic">
                  AI 互動式 Canvas 畫布 (Generative UI)
                </h2>
              </div>
              <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/5">
                {[
                  { id: 'overview', label: '概述' },
                  { id: 'timeline', label: '異常時間軸' },
                  { id: 'multimodal', label: '多模態截圖' },
                  { id: 'sandbox', label: 'UI 渲染沙盒與動態畫布' },
                ].map(nav => (
                  <button
                    key={nav.id}
                    onClick={() => setActiveCanvasView(nav.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      activeCanvasView === nav.id 
                        ? 'bg-purple-600 text-white shadow' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {nav.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Canvas Views */}
            <div className="min-h-[360px] bg-black/60 rounded-2xl border border-white/5 p-5 relative overflow-hidden flex flex-col justify-between">
              
              {/* VIEW A: OVERVIEW */}
              {activeCanvasView === 'overview' && (
                <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      <span className="text-xs font-black text-gray-200 uppercase tracking-widest">當前物理鏡像深度解析狀態</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      AI 檢索微服務已與物理證據鏈條建立管道。請透過右側的 **Gemini 詢問助理** 發送指令「*請分析 2026/06/12 的異常登入時間軸*」或「*請分析受駭電腦螢幕截圖*」來動態轉變此區域。
                    </p>
                  </div>

                  {/* Sleuthkit filesystem statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 uppercase font-black block">已分析實體磁區</span>
                      <span className="text-xl font-black text-indigo-400 font-mono block mt-1">2,048,150</span>
                      <span className="text-[9px] text-emerald-400 mt-1 block">MD5 校驗與 E01 完全一致</span>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 uppercase font-black block">物理還原已刪檔案</span>
                      <span className="text-xl font-black text-rose-400 font-mono block mt-1">14 件還原</span>
                      <span className="text-[9px] text-gray-500 mt-1 block">File Carving 功能已部署</span>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 uppercase font-black block">記憶體暫存特徵碼</span>
                      <span className="text-xl font-black text-amber-400 font-mono block mt-1">185 個物件</span>
                      <span className="text-[9px] text-amber-500/20 bg-amber-500/10 px-1 py-0.5 rounded block mt-1 font-bold">Volatile Target</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0c0d12]/50 border border-indigo-500/15 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                        <Terminal size={14} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-300">{currentLang === 'en' ? 'Evidence Isolation Sandbox Active' : currentLang === 'ja' ? '証拠隔離サンドボックスアクティブ' : '證據安全隔離沙箱環境已啟動'}</p>
                        <p className="text-[10px] text-gray-500">{currentLang === 'en' ? 'All operations are executed purely on write-protected copies to protect evidence.' : currentLang === 'ja' ? 'すべての操作は、原本の保全を最大化するために書き込み防止コピーで行われます。' : '所有分析僅施加於唯讀鏡像對拷，絕對維持法理不變性與完整性。'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW B: TIMELINE SLIDER (異常登入活動時間軸) */}
              {activeCanvasView === 'timeline' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded tracking-wider uppercase block w-fit">
                      {currentLang === 'en' ? 'Anomaly Timeline (2026/06/12)' : currentLang === 'ja' ? '異常タイムライン (2026/06/12)' : '異常時間軸 (2026/06/12)'}
                    </span>
                    <span className="text-[10px] text-gray-500">{currentLang === 'en' ? 'Source: Physical extraction of EventLog Security.evtx' : currentLang === 'ja' ? 'ソース: EventLog Security.evtx の物理的抽出' : '來源: EventLog Security.evtx 物理提取'}</span>
                  </div>

                  {/* Interactive Slider representation */}
                  <div className="py-4 space-y-6">
                    <div className="h-1 bg-gray-800 rounded-full relative">
                      {/* Active line accent */}
                      <div className="absolute left-0 top-0 w-3/4 h-full bg-gradient-to-r from-red-600 to-amber-500" />
                      
                      {/* Interactive nodes */}
                      {[
                        { time: '02:15:20', offset: '0x000F83C0', label: currentLang === 'en' ? 'RDP Spray Success' : currentLang === 'ja' ? 'RDPブルートフォース成功' : 'RDP 暴破成功', desc: currentLang === 'en' ? 'Logged in Administrator from 185.220.101.4' : currentLang === 'ja' ? '185.220.101.4 から Administrator ログイン' : '由 185.220.101.4 登入 Administrator', text: '4D 5A 90 00', highlight: 'text-red-400' },
                        { time: '02:18:10', offset: '0x000F8400', label: currentLang === 'en' ? 'PsExec Escalation' : currentLang === 'ja' ? 'PsExec 特権昇格' : 'PsExec 提權', desc: currentLang === 'en' ? 'Implanting sec_sys.sys driver payload' : currentLang === 'ja' ? 'sec_sys.sys 脆弱なドライバ持続化' : '安裝 sec_sys.sys 驅動環節', text: '69 73 20 70', highlight: 'text-orange-400' },
                        { time: '02:22:45', offset: '0x000F8430', label: currentLang === 'en' ? 'Purge VSS Backups' : currentLang === 'ja' ? 'シャドウコピー全消去' : '刪除 VSS 備份', desc: currentLang === 'en' ? 'Invoking vssadmin.exe delete shadows' : currentLang === 'ja' ? 'vssadmin.exe でシャドウコピーを完全消去' : '調用 vssadmin.exe 清空磁區', text: '50 45 00 00', highlight: 'text-amber-400' },
                        { time: '02:40:00', offset: '0x000F8440', label: currentLang === 'en' ? 'Mass Encryption Triggered' : currentLang === 'ja' ? '全保護領域暗号化' : '全磁碟勒索加密', desc: currentLang === 'en' ? 'LockBit 3.0 starts rewinding partition sectors' : currentLang === 'ja' ? 'LockBit 3.0 が物理MFTセクタの強制置換を開始' : 'LockBit 3.0 開始重寫快照區段', text: '41 53 45 36', highlight: 'text-rose-500' },
                      ].map((node, i) => (
                        <button
                          key={i}
                          onClick={() => handleHexRowClick(node.offset, node.text, node.label)}
                          className="absolute -top-1.5 -translate-x-1/2 group outline-none"
                          style={{ left: `${(i + 1) * 20}%` }}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full bg-black border-2 border-red-500 hover:scale-125 transition-transform ${
                            selectedHexOffset === node.offset ? 'ring-4 ring-red-500/30 bg-red-400' : ''
                          }`} />
                          
                          {/* Node label popup on hover */}
                          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#0c0d12] border border-gray-800 p-2 rounded-lg text-left hidden group-hover:block z-50 w-44">
                            <p className="text-[9px] font-black text-rose-500">{node.time}</p>
                            <p className="text-[10px] font-bold text-white mt-0.5">{node.label}</p>
                            <p className="text-[8px] text-gray-500 mt-1">{node.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 pt-2 text-[9px] font-mono text-gray-500 text-center">
                      <div>{currentLang === 'en' ? '02:15:20 RDP Spray' : currentLang === 'ja' ? '02:15:20 RDPブルート' : '02:15:20 RDP暴破'}</div>
                      <div>{currentLang === 'en' ? '02:18:10 Escalation' : currentLang === 'ja' ? '02:18:10 特権昇格' : '02:18:10 特權提升'}</div>
                      <div>{currentLang === 'en' ? '02:22:45 Purge VSS' : currentLang === 'ja' ? '02:22:45 物理影消去' : '02:22:45 影子複製'}</div>
                      <div>{currentLang === 'en' ? '02:40:00 Encryption' : currentLang === 'ja' ? '02:40:00 暗号化開始' : '02:40:00 啟動加密'}</div>
                    </div>
                  </div>

                  {/* Interactive timeline event list */}
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-2 text-xs">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {currentLang === 'en' ? 'Gemini Notice: Click slider nodes above to drive Hex Viewer underneath and interpret disk segments.' : currentLang === 'ja' ? 'Gemini ヒント: スライダーノードをクリックして、下部の16進数ビューアのスナップショットを同期・翻訳。' : 'Gemini 自動提示：點擊上方滑塊節點，可即時驅動下方 Hex Viewer 切換至該突變時間點並解讀。'}
                    </p>
                    <div className="p-2.5 bg-red-950/20 border border-red-500/10 rounded group transition-all flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-rose-400 font-bold">02:15:20</span>
                        <p className="text-xs text-white font-bold uppercase mt-0.5">
                          {currentLang === 'en' ? 'Successful RDP Logins (EventID: 4624) - Source 185.220.101.4' : currentLang === 'ja' ? 'RDPログイン成功 (EventID: 4624) - 送信元IP 185.220.101.4' : 'RDP 成功登入 (EventID: 4624) - 異常來源 185.220.101.4'}
                        </p>
                      </div>
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">CRITICAL</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW C: MULTIMODAL RANSOMWARE RECOGNITION (多模態勒索軟體截圖) */}
              {activeCanvasView === 'multimodal' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-xs font-black text-indigo-400 bg-indigo-505/10 px-2 py-0.5 rounded tracking-wider uppercase block w-fit">
                    Gemini 3 Pro 多模態截圖研判
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Simulated screen capture with bounding boxes */}
                    <div className="md:col-span-6 border border-gray-800 rounded-xl overflow-hidden bg-zinc-950 p-2 flex flex-col justify-between relative min-h-[180px]">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent)] z-0 pointer-events-none" />
                      
                      <div className="border border-red-500/20 bg-red-500/5 p-3 rounded text-center z-10">
                        <div className="text-red-500 font-black text-sm tracking-widest font-mono animate-pulse">
                          !!! ALL YOUR FILES ARE ENCRYPTED !!!
                        </div>
                        <p className="text-[9px] text-gray-400 font-mono mt-2 leading-relaxed">
                          Your personal identifier: <span className="text-amber-400">77918AECD</span>
                          <br />
                          Download Tor Browser to decrypt: lockbitapt...onion
                        </p>
                      </div>

                      {/* AI dynamic target point highlight */}
                      <div className="border border-dashed border-indigo-500 bg-indigo-500/10 p-1.5 rounded z-10 mt-2 flex items-center justify-between text-[9px] font-mono">
                        <span className="text-indigo-400">🔍 Gemini 智慧辨識區域: Tor URL</span>
                        <span className="text-gray-500">[x: 120, y: 180]</span>
                      </div>
                    </div>

                    {/* Threat Intelligence details */}
                    <div className="md:col-span-6 space-y-2.5">
                      <div className="p-3.5 bg-[#0c0d12]/60 border border-indigo-500/15 rounded-xl">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">勒索病毒家族精準比對</span>
                        <p className="text-sm font-black text-white mt-1">LockBit 3.0 (Black)</p>
                        
                        <div className="mt-2.5 space-y-1 text-[10px] text-gray-400">
                          <p>• **{currentLang === 'en' ? 'Encrypted Extension' : currentLang === 'ja' ? '暗号化拡張子' : '加密擴展名'}**：.lockbit</p>
                          <p>• **{currentLang === 'en' ? 'Communication Agent' : currentLang === 'ja' ? '通信エージェント' : '通訊代理'}**：Tor onion routing service</p>
                          <p>• **{currentLang === 'en' ? 'Tactics & Techniques' : currentLang === 'ja' ? '主な戦術' : '主要戰術'}**：Sleuthkit 快照刪除與實體重組硬驅</p>
                        </div>
                      </div>

                      <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-xl">
                        <span className="text-[9px] font-black text-red-400 block uppercase">
                          {currentLang === 'en' ? 'Recommendations & Auto-Defense' : currentLang === 'ja' ? '推奨対策と自動防御' : '對策建議與自動化防護'}
                        </span>
                        <p className="text-[10px] text-gray-300 leading-relaxed mt-1">
                          {currentLang === 'en' ? 'This adversary integration has been synchronized with the joint defense API space. Check Copilot to deploy rules.' : currentLang === 'ja' ? 'この攻撃者はAPI連携による安全な共同防衛に統合されています。右側のCopilotで「YARAルールを展開」して調査してください。' : '該黑客現已成功藉由 API 整合至安全聯防中。請在右側 Copilot 中「部署 YARA 規則」實施全局逆向檢索。'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW D: SANDBOX & GENERATIVE CANVAS */}
              {activeCanvasView === 'sandbox' && (
                <div className="space-y-4 animate-in fade-in duration-300 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-900/50 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded tracking-wider uppercase">
                        {currentLang === 'en' ? 'Evidence UI Instant Compilation Sandbox' : currentLang === 'ja' ? '物証UI・即時コンパイル安全サンドボックス' : '物證 UI 即時編譯安全沙盒 (Generative UI Sandbox)'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {currentLang === 'en' ? 'Sandbox Mode: Active Production' : currentLang === 'ja' ? 'サンドボックス状態: アクティブ本番機' : '隔離沙盒模組: Active Production'}
                    </span>
                  </div>

                  {/* Dual layouts inside Sandbox */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
                    {/* Parameters & assembly config (col-span-5) */}
                    <div className="lg:col-span-5 space-y-4 text-left">
                      <div className="bg-zinc-950/60 border border-slate-900 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 border-b border-gray-900 pb-2">
                          <Database size={13} className="text-indigo-400" />
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">
                            {currentLang === 'en' ? '1. Forensic Entity Data & Context Setup' : currentLang === 'ja' ? '1. 鑑識エンティティデータとコンテキスト構成' : '1. 鑑識實體數據與上下文組裝'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                            {currentLang === 'en' ? 'Select Suspect Entity Context' : currentLang === 'ja' ? '容疑エンティティ選択' : '選擇可疑實體 (Select Entity Context)'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'svchost', label: currentLang === 'en' ? 'svch0st.exe (Random Write)' : currentLang === 'ja' ? 'svch0st.exe (ランダム書込み)' : 'svch0st.exe (隨機寫入)', active: sandboxEntity === 'svchost' },
                              { id: 'adversary', label: currentLang === 'en' ? '185.220.101.4 (Conn IP)' : currentLang === 'ja' ? '185.220.101.4 (接続IP)' : '185.220.101.4 (連線 IP)', active: sandboxEntity === 'adversary' },
                              { id: 'lockbit', label: currentLang === 'en' ? 'LockBit3.0 (Reg Footprint)' : currentLang === 'ja' ? 'LockBit3.0 (レジストリ軌跡)' : 'LockBit3.0 (登錄軌跡)', active: sandboxEntity === 'lockbit' },
                              { id: 'custom', label: currentLang === 'en' ? 'Custom Prompt Components' : currentLang === 'ja' ? 'カスタムデータ・要望' : '自訂數據/需求組件', active: sandboxEntity === 'custom' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setSandboxEntity(opt.id as any);
                                  setSandboxCode(templateHTML[opt.id as 'svchost' | 'adversary' | 'lockbit' | 'custom']);
                                  setSandboxLogs(prev => [
                                    ...prev,
                                    `[INF] ${currentLang === 'en' ? 'Configured context entity to' : currentLang === 'ja' ? 'コンテキストを次のように設定しました:' : '設定鑑識上下文實體為:'} ${opt.label}`
                                  ]);
                                  if (opt.id === 'svchost') {
                                    setCustomTask(currentLang === 'en' ? 'Please design a "Timeline Alignment Card component" for this multi-dimensional infection vector.' : currentLang === 'ja' ? '次の多次元インフェクションチェーン向けに「タイムライン整列カードコンポーネント」を設計してください。' : '請為以下多維度交叉感染鏈設計一個『時間軸對齊卡片元件』。');
                                    setCustomDisk(currentLang === 'en' ? 'Detected suspect write to C:\\Windows\\Temp\\svch0st.exe' : currentLang === 'ja' ? 'C:\\Windows\\Temp\\svch0st.exe への不正なファイル書き込み' : '發現異常檔案寫入 C:\\Windows\\Temp\\svch0st.exe');
                                    setCustomLog(currentLang === 'en' ? 'Sysmon ID 1: powershell spawned this program' : currentLang === 'ja' ? 'Sysmon ID 1: powershell が本プロセスを起動' : 'Sysmon ID 1: powershell 啟動了該程序');
                                    setCustomFlow(currentLang === 'en' ? 'Process established outbound connection to 45.227.254.12:443' : currentLang === 'ja' ? '本プロセスが 45.227.254.12:443 接続を確立' : '該程序建立連線至 45.227.254.12:443');
                                    setCustomCti(currentLang === 'en' ? 'MISP Hit: BlackByte Ransomware C2 node' : currentLang === 'ja' ? 'MISP 一致：BlackByte C2 サーバーIP' : 'MISP 命中：此 IP 為 BlackByte 勒索軟體 C2 中繼站');
                                  } else if (opt.id === 'adversary') {
                                    setCustomTask(currentLang === 'en' ? 'Design a "Network Packet Restoration Dashboard" for analyzing compromised RDP logins & C2 active channels.' : currentLang === 'ja' ? 'RDPログインおよびC2活動を分析するための「ネットワークパケット復元メーター」を設計してください。' : '設計一個用於分析 RDP 登入與 C2 活動的『網路流量封包還原儀表』。');
                                    setCustomDisk(currentLang === 'en' ? 'Physical image: 185.220.101.4 connection remnants' : currentLang === 'ja' ? '物理イメージに残存する 185.220.101.4 接続レコード' : '物理鏡像 185.220.101.4 殘存連線紀錄');
                                    setCustomLog('Security.evtx ID 4624 (Administrator)');
                                    setCustomFlow('185.220.101.4 -> 192.168.10.88:3389');
                                    setCustomCti('CTI: Known Tor Proxy exit node used in LockBit attack');
                                  } else if (opt.id === 'lockbit') {
                                    setCustomTask(currentLang === 'en' ? 'Design a "System Properties Inspection Panel" for forensic Registry Carving & LockBit OS Footprints.' : currentLang === 'ja' ? 'レジストリ復元（Registry Carving）とOS改ざん追跡用の「システム特性検証パネル」を設計してください。' : '請為勒索軟體登錄檔修改（Registry Carving & OS Footprint）設計一個『系統屬性檢校面板』。');
                                    setCustomDisk('Registry Carved: Setup key detected');
                                    setCustomLog('System Registry Modification audit');
                                    setCustomFlow('N/A (Offline Persistence)');
                                    setCustomCti('LockBit 3.0 configuration indicators matching BlackByte parameters');
                                  }
                                }}
                                className={`px-2 py-2 rounded-lg text-[9px] font-black text-left border ${
                                  opt.active
                                    ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-400 font-bold'
                                    : 'bg-black/40 border-white/[0.03] text-gray-400 hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Show Context Input JSON Block for Gemini */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                            {currentLang === 'en' ? '📦 Structured Context parameters sent to Gemini (Context JSON)' : currentLang === 'ja' ? '📦 Gemini 3.5に送信される構造化コンテキストデータ' : '📦 送至 Gemini 3.5 設計之結構化數據 (Context JSON)'}
                          </span>
                          <div className="bg-black/85 border border-slate-900 rounded-lg p-2.5 font-mono text-[9px] text-gray-400 overflow-x-auto max-h-[120px] custom-scrollbar space-y-1 text-left">
                            <span className="text-purple-400">{"{"}</span>
                            <div className="pl-3">
                              <span className="text-slate-500">"task":</span> <span className="text-emerald-400">"{customTask}"</span>,<br />
                              <span className="text-slate-500">"data_context": {"{"}</span><br />
                              <div className="pl-3">
                                <span className="text-slate-500">"timestamp":</span> <span className="text-amber-400">"2026-06-12 14:25:00"</span>,<br />
                                <span className="text-slate-500">"disk_artifact":</span> <span className="text-sky-400">"{customDisk}"</span>,<br />
                                <span className="text-slate-500">"log_event":</span> <span className="text-amber-400">"{customLog}"</span>,<br />
                                <span className="text-slate-500">"network_flow":</span> <span className="text-purple-400">"{customFlow}"</span>,<br />
                                <span className="text-slate-500">"cti_alert":</span> <span className="text-red-400">"{customCti}"</span><br />
                              </div>
                              <span className="text-slate-500">{"}"}</span>,<br />
                              <span className="text-slate-500">"ui_requirement":</span> <span className="text-slate-300">"{currentLang === 'en' ? 'Match dark cyber security theme aesthetics.' : currentLang === 'ja' ? 'ダーク背景サイバーセキュリティ風に調和。' : '符合深色背景資安風格。'}"</span>
                            </div>
                            <span className="text-purple-400">{"}"}</span>
                          </div>
                        </div>

                        {/* Prompt constraint notification */}
                        <div className="bg-slate-950 border border-indigo-500/10 p-2 text-[9px] text-indigo-400 leading-relaxed font-mono">
                          <span className="font-extrabold text-white">{currentLang === 'en' ? '⚙️ Design System Constraint Rules:' : currentLang === 'ja' ? '⚙️ デザインシステム制約ガイドライン:' : '⚙️ 視覺限制規範（Design System）：'}</span>
                          {currentLang === 'en' ? 'Outer bg-slate-950, text-slate-100, MFT = blue, Logs = orange, Flows = purple, Threat Intel = red hightlights.' : currentLang === 'ja' ? '背景 bg-slate-950、文字 text-slate-100、MFT異動＝青色、システムログ＝オレンジ色、トラフィック＝紫色、脅威インテリジェンス＝赤色ハイライト' : '背景限定 bg-slate-950, text-slate-100, MFT異動＝藍色, 系統日誌＝橘色, 流量＝紫色, 情資＝紅色高亮。'}
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsGeneratingUI(true);
                              setSandboxLogs(prev => [
                                ...prev,
                                `[INF] ${currentLang === 'en' ? 'Initiated Gemini 3.5 communication channel (Senior UI Designer Role)...' : currentLang === 'ja' ? 'Gemini 3.5との協調通信を開始しました（シニアセキュリティデザイナーロール）...' : '發起 Gemini 3.5 協同通訊（資深前端設計師 Role）...'}`,
                                `[LLM] ${currentLang === 'en' ? 'Received forensic JSON vector signatures and design constraints bounds...' : currentLang === 'ja' ? '多次元検証JSON特徴とビジュアルデザイン制限をロードしています...' : '接收多維鑑識 JSON 特徵與視覺系統約束規則限制...'}`,
                                `[LLM] ${currentLang === 'en' ? 'Outputting sandboxed HTML code matching design rules...' : currentLang === 'ja' ? 'カラー要件に適合するセキュアなHTMLコードプールを生成中...' : '正在輸出符合色彩和佈局規則的 HTML 程式碼區塊...'}`
                              ]);
                              setTimeout(() => {
                                triggerSandboxCompilation(sandboxCode);
                              }, 1200);
                            }}
                            disabled={isGeneratingUI}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1"
                          >
                            <Cpu size={12} className={isGeneratingUI ? 'animate-spin' : ''} />
                            {isGeneratingUI ? (currentLang === 'en' ? 'Gemini composing adaptive UI...' : currentLang === 'ja' ? 'GeminiがUIコードを記述中...' : 'Gemini 正在編寫 UI 中...') : (currentLang === 'en' ? 'Summon Gemini UI Designer [Generative adaptive]' : currentLang === 'ja' ? 'GeminiのAIデザイナーを召喚 [自律型生成]' : '召喚 Gemini 設計師 [自適應生成]')}
                          </button>
                        </div>
                      </div>

                      {/* Live Code Editor for sandbox code */}
                      <div className="bg-zinc-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                          <div className="flex items-center gap-2">
                            <Code size={13} className="text-teal-400" />
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">
                              {currentLang === 'en' ? '2. Live HTML / Secure Tailwind Editor' : currentLang === 'ja' ? '2. ライブHTMLとTailwindのエディタ' : '2. Live HTML / Tailwind 代碼編輯'}
                            </span>
                          </div>
                          {sandboxEntity === 'custom' && (
                            <span className="text-[8px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1 rounded uppercase font-bold">Editable</span>
                          )}
                        </div>
                        
                        <textarea
                          value={sandboxCode}
                          onChange={(e) => handleSandboxCodeChange(e.target.value)}
                          className="w-full h-[120px] bg-black text-emerald-400 border border-slate-800 p-2 text-[9px] font-mono rounded-lg focus:border-teal-500 outline-none resize-none"
                          placeholder={currentLang === 'en' ? "Input compliant, sandboxed pure HTML/Tailwind CSS raw code..." : currentLang === 'ja' ? "Tailwind CSS に準拠した安全なHTMLコードを入力してください..." : "請輸入符合 Tailwind CSS 的純 HTML 代碼..."}
                        />
                        
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>{currentLang === 'en' ? 'XSS Guard Filter:' : currentLang === 'ja' ? 'XSSフィルタステート:' : '過濾狀態:'} {compileStatus === 'warning' ? (currentLang === 'en' ? '⚠️ Quarantine Blocked' : currentLang === 'ja' ? '⚠️ セキュリティ隔離中' : '⚠️ 安全隔離') : (currentLang === 'en' ? '🟢 Verified Safe' : currentLang === 'ja' ? '🟢 検証済・安全' : '🟢 安全無威脅')}</span>
                          <span className="text-indigo-400 font-bold">UTF-8 Isolated</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => triggerSandboxCompilation(sandboxCode)}
                          className="w-full py-2 bg-zinc-950 hover:bg-slate-900 text-teal-400 border border-slate-800 hover:border-teal-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          ⚡ {currentLang === 'en' ? 'Compile & Live Hot Reload' : currentLang === 'ja' ? 'ライブコンパイルとホットリロード' : '重新編譯並熱重載 (Compile & Hot Reload)'}
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Canvas Iframe renderer (col-span-7) */}
                    <div className="lg:col-span-7 space-y-3 text-left">
                      <div className="bg-zinc-950/40 border border-slate-805 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Sparkles className="text-indigo-400 animate-pulse" size={13} />
                            <span className="font-extrabold text-slate-100 uppercase tracking-wider">
                              {currentLang === 'en' ? '3. Generative UI Interactive Sandbox Stage' : currentLang === 'ja' ? '3. フロントエンド動的キャンバス独立サンドボックス' : '3. 前端動態畫布獨立沙盒 (Generative Canvas)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                            <span className="text-[9px] font-mono text-gray-500">Isolated Frame</span>
                          </div>
                        </div>

                        {/* Sandbox Compiler Status Panel */}
                        {isGeneratingUI && (
                          <div className="w-full h-[280px] rounded-xl bg-black border border-slate-900 flex flex-col items-center justify-center p-6 space-y-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
                            <p className="text-xs font-mono text-indigo-400 animate-pulse text-center">
                              [COMPILING] {currentLang === 'en' ? 'Sanitizing signature vectors and spawning safety sandbox' : currentLang === 'ja' ? 'デジタル署名の突合およびプローブ防御網の配置中' : '數位簽章對位與安全防護探針隔離中'} ({sandboxProgress}%)
                            </p>
                            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
                                style={{ width: `${sandboxProgress}%` }}
                              />
                            </div>
                            <div className="text-[8px] font-mono text-gray-600 max-w-sm truncate text-center">
                              {sandboxLogs[sandboxLogs.length - 1]}
                            </div>
                          </div>
                        )}

                        {/* The true sandboxed render iframe */}
                        {!isGeneratingUI && (
                          <div className="relative">
                            {compileStatus === 'warning' && (
                              <div className="absolute inset-0 bg-red-950/90 border border-red-500 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center z-50">
                                <AlertTriangle className="text-red-500 animate-bounce" size={24} />
                                <h4 className="text-xs font-black text-white mt-3 uppercase tracking-widest">
                                  {currentLang === 'en' ? 'Sandbox Isolation Alert (Isolation Activated)' : currentLang === 'ja' ? 'サンドボックスコードエスケープ検知アラート (Isolation Active)' : '沙盒代碼逃逸阻斷警報 (Isolation Active)'}
                                </h4>
                                <p className="text-[10px] text-gray-300 max-w-md mt-2 leading-relaxed">
                                  {currentLang === 'en' ? 'Quarantine directive: Detected unstable execution elements or scripting tags. To prevent forensic contamination and advanced memory XSS injection vectors, rendering is self-quarantined. Rectify or remove scripting tags.' : currentLang === 'ja' ? '原本汚染防止ガイド：不審なスクリプトタグまたはイベントハンドラの混入が検知されました。証拠改ざん防止とXSS攻撃の遮断のため、レンダリングを自動遮断しました。悪質なコードを修正してください。' : '實體防空汙指引：已偵測到可疑的程式腳本標籤（或 event 注入）。為確保數位證據不變性並杜絕 XSS 進階攻擊，畫布已被安全防護網自動阻斷渲染，請修正並移除惡意指令！'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSandboxCode(templateHTML[sandboxEntity]);
                                    setCompileStatus('success');
                                    setSandboxLogs(prev => [...prev, '[SYSTEM] ' + (currentLang === 'en' ? 'Manually restored to secure sandbox default state.' : currentLang === 'ja' ? '安全なデフォルトコードへ正常にロールバックしました。' : '已手動復原到安全的預設沙盒代碼。')]);
                                  }}
                                  className="mt-4 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-black uppercase tracking-widest transition-all"
                                >
                                  {currentLang === 'en' ? 'Restore Secured Core Code' : currentLang === 'ja' ? '安全コードへ復元' : '復原安全代碼'}
                                </button>
                              </div>
                            )}

                            {/* Sanitize sandbox code or inject Tailwind CDN in isolated manner */}
                            <iframe
                                title="Generative UI Sandbox"
                                id="ai-ui-root"
                                srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <script src="https://cdn.tailwindcss.com"></script>
                                    <style>
                                      body { 
                                        background-color: #020617; 
                                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                        padding: 0.5rem;
                                        margin: 0;
                                      }
                                      ::-webkit-scrollbar {
                                        width: 4px;
                                        height: 4px;
                                      }
                                      ::-webkit-scrollbar-track {
                                        background: #020617;
                                      }
                                      ::-webkit-scrollbar-thumb {
                                        background: #1e293b;
                                        border-radius: 9999px;
                                      }
                                    </style>
                                  </head>
                                  <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-[260px]">
                                    <div class="w-full">
                                      {HTML_CONTENT}
                                    </div>
                                  </body>
                                </html>
                              `.replace('{HTML_CONTENT}', sandboxCode)}
                              className="w-full h-[280px] rounded-xl border border-slate-900 bg-[#020617] shadow-inner"
                              sandbox="allow-scripts"
                            />
                          </div>
                        )}

                        {/* Sandbox Compilation Diagnostic Panel */}
                        <div className="mt-3 bg-black/60 rounded-xl border border-slate-900 p-2.5 h-[90px] overflow-y-auto text-[9px] font-mono text-slate-500 space-y-1 custom-scrollbar text-left">
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block border-b border-slate-900 pb-1 mb-1">
                            {currentLang === 'en' ? '💻 Sandbox Compiler Diagnostics & Diagnostic Auditing' : currentLang === 'ja' ? '💻 サンドボックスコンパイラ診断および安全監査ログ' : '💻 沙盒編譯器診斷與安審日誌 (Diagnostic Logs)'}
                          </span>
                          {sandboxLogs.slice(-5).map((log, lIdx) => (
                            <div key={lIdx} className={`${
                              log.includes('[SUCCESS]') ? 'text-emerald-400' :
                              log.includes('[SEC_WARN]') ? 'text-red-500 font-extrabold' :
                              log.includes('[INF]') ? 'text-indigo-400' : 'text-slate-500'
                            }`}>
                              {log}
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom footer bar on Center Main Panel */}
              <div className="pt-4 border-t border-white/[0.04] mt-4 flex items-center justify-between text-[9px] font-mono text-gray-500">
                <span>{currentLang === 'en' ? 'Evidence Chain Integrity: MD5 Verified Match' : currentLang === 'ja' ? '物理証拠安全ハッシュペア：MD5検証済' : '物理證據安全雜湊對：MD5 Verified Match'}</span>
                <span>{currentLang === 'en' ? 'System Verification status: 🔒 Chain Protected 100%' : currentLang === 'ja' ? 'システム検証状態: 🔒 証拠の保護 100%' : '系統校驗狀態：🔒 鏈條保護 100%'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Gemini Forensics Copilot Chat Sidebar (col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-[2.5rem] p-5 shadow-2xl flex flex-col justify-between h-[610px]">
            
            {/* Copilot Header */}
            <div className="space-y-2 border-b border-gray-900 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="text-blue-400" size={16} />
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  Gemini 鑑識助手 (Copilot)
                </span>
              </div>
              <p className="text-[10px] text-gray-500">
                利用雙引擎提供多模態日誌解析與 YARA 規則代碼生成 (Vibe Coding)
              </p>
            </div>

            {/* Chat Messages Section */}
            <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`space-y-1.5 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className="text-[9px] font-black text-gray-500 uppercase">
                    {msg.sender === 'user' ? '鑑識官 Chiur' : 'Gemini Forensics Agent'}
                  </span>
                  
                  <div className={`p-3 rounded-xl text-left text-xs leading-relaxed max-w-[95%] whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white ml-auto rounded-tr-none'
                      : 'bg-zinc-900/80 border border-white/5 text-gray-300 mr-auto rounded-tl-none'
                  }`}>
                    {msg.text}

                    {msg.code && (
                      <div className="mt-3 relative">
                        <pre className="bg-black/80 border border-white/10 p-2 rounded-lg font-mono text-[9px] text-emerald-400 overflow-x-auto max-h-48 custom-scrollbar">
                          <code>{msg.code}</code>
                        </pre>
                        {msg.hasDeployButton && (
                          <button
                            type="button"
                            onClick={() => triggerDeployNotification('LockBit3_Forensics_Payload')}
                            className="mt-2 w-full p-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 size={11} />
                            一鍵部署至檢索核心
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isCopilotTyping && (
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-black text-gray-500 uppercase">Gemini 正在研判分析...</span>
                  <div className="p-3 bg-zinc-900/60 rounded-xl rounded-tl-none mr-auto w-16 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Presets / Actions Panel */}
            <div className="space-y-2 border-t border-gray-900 pt-3">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">
                快速 AI 鑑識指令預設 (Generative UI)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleChatPreset('timeline')}
                  className="px-2.5 py-1.5 bg-black/40 hover:bg-black/80 border border-white/10 rounded-lg text-[10px] font-bold text-gray-300 text-left truncate flex items-center gap-1.5"
                >
                  <Clock size={11} className="text-red-400 shrink-0" />
                  <span className="truncate">異常登入時間軸</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChatPreset('multimodal')}
                  className="px-2.5 py-1.5 bg-black/40 hover:bg-black/80 border border-white/10 rounded-lg text-[10px] font-bold text-gray-300 text-left truncate flex items-center gap-1.5"
                >
                  <Image size={11} className="text-indigo-400 shrink-0" />
                  <span className="truncate">勒索截圖多模態</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChatPreset('yara')}
                  className="px-2.5 py-1.5 bg-black/40 hover:bg-black/80 border border-white/10 rounded-lg text-[10px] font-bold text-gray-300 text-left truncate flex items-center gap-1.5 col-span-2"
                >
                  <Code size={11} className="text-emerald-400 shrink-0" />
                  <span>產生特徵檢索 YARA 規則</span>
                </button>
              </div>

              {/* Chat Send Input Form */}
              <form onSubmit={handleCustomSend} className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="詢問 Gemini 鑑識官助理..."
                  className="flex-1 bg-black text-gray-200 border border-gray-800 p-2.5 text-xs rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center justify-center"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 4: Bottom Evidence detail & Classic HEX Viewer / Carving section (Full Width) */}
      <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-[2.5rem] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-900 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Binary className="text-teal-400" size={16} />
            <span className="text-xs font-black text-white uppercase tracking-widest">
              證據細節與二進位解析檢視器 (Classic Hex Viewer)
            </span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            當前對位證據: {evidenceList.find(e => e.id === selectedEvidence)?.name} • Sleuthkit 物理映射
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Left Column: Classic Hex viewer (col-span-7) */}
          <div className="xl:col-span-7 bg-black/90 p-4 rounded-2xl border border-white/5 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.04]">
              <span className="text-[10px] text-gray-500 uppercase font-black">實體十六進位檢視 (Dual-Column layout)</span>
              <span className="text-[10px] text-teal-400">OFFSET: {selectedHexOffset}</span>
            </div>

            <div className="space-y-1.5 select-all text-xs">
              {getHexData().map((row, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHexRowClick(row.offset, row.hex, row.ascii)}
                  className={`w-full text-left flex items-center justify-between py-1 px-2 rounded-lg transition-colors group cursor-pointer ${
                    selectedHexOffset === row.offset 
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' 
                      : 'hover:bg-white/[0.02] text-gray-400'
                  }`}
                >
                  <span className={`font-bold transition-colors ${
                    selectedHexOffset === row.offset ? 'text-teal-400' : 'text-gray-500'
                  }`}>
                    {row.offset}:
                  </span>
                  <span className="px-3 tracking-wider text-gray-300 shrink-0">{row.hex}</span>
                  <span className="text-gray-500 border-l border-white/10 pl-3 shrink-0">|</span>
                  <span className="px-3 text-sky-400 font-semibold truncate flex-1 text-left">{row.ascii}</span>
                  
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase">
                    解讀磁區
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Physical Attributes & MACB (col-span-5) */}
          <div className="xl:col-span-5 space-y-4">
            
            {/* Hex interpretation description card */}
            <div className="p-4 bg-[#0c0d12] border border-gray-900 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-teal-400" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">物理扇區 AI 語意標註</span>
              </div>
              <p className="text-xs text-teal-300/90 font-medium bg-teal-950/20 p-3 rounded-lg border border-teal-500/10 leading-relaxed">
                {selectedHexInterpretation}
              </p>
              
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCopilotTyping(true);
                    setTimeout(() => {
                      setIsCopilotTyping(false);
                      setChatMessages(prev => [...prev, {
                        sender: 'gemini',
                        text: `🔍 **對位磁區二進位語意解析**: \n\n您在 Hex Viewer 點擊了偏移點 \`${selectedHexOffset}\`。\n底層資料具有 MZ 執行簽章，經與 Sleuthkit 快照重建比對，為可疑程式碼的主驅動加載入口。此資訊可對其建立 YARA 防護特徵。\n\n**物理位置屬性:**\n- 扇區偏移：LBA Sector 4210\n- 物理雜湊校驗：MD5 無篡改偏離。`
                      }]);
                    }, 800);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  ✨ AI 標註此區段並推送至 Copilot
                </button>
              </div>
            </div>

            {/* Sleuthkit registry / system file state block */}
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sleuthkit / Coroner 檔案與 MACB 特徵</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 rounded">NTFS</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">鏡像內物理路徑:</span>
                  <span className="text-gray-300 truncate max-w-[240px]" title={currentAttr.path}>{currentAttr.path}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">大小:</span>
                  <span className="text-gray-300">{currentAttr.size}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-500">物理權限校準:</span>
                  <span className="text-sky-400 font-mono font-bold">{currentAttr.permissions}</span>
                </div>

                <div className="pt-1.5 space-y-1">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">時間戳記 (MACB TimeLine):</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-1 bg-white/[0.02] rounded">
                      <span className="text-purple-400 font-bold font-mono">M (Modified): </span>
                      <span className="text-gray-400">{currentAttr.timestamps.modified}</span>
                    </div>
                    <div className="p-1 bg-white/[0.02] rounded">
                      <span className="text-blue-400 font-bold font-mono">A (Accessed): </span>
                      <span className="text-gray-400">{currentAttr.timestamps.accessed}</span>
                    </div>
                    <div className="p-1 bg-white/[0.02] rounded">
                      <span className="text-emerald-400 font-bold font-mono">C (Created): </span>
                      <span className="text-gray-400">{currentAttr.timestamps.created}</span>
                    </div>
                    <div className="p-1 bg-white/[0.02] rounded">
                      <span className="text-amber-400 font-bold font-mono">B (Born): </span>
                      <span className="text-gray-400">{currentAttr.timestamps.born}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-gray-500 italic bg-white/[0.01] p-2.5 rounded-lg border border-white/5">
                  <span className="font-bold text-gray-400">File Carving 還原備忘：</span>
                  {currentAttr.carvingRecovery}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

function SOARView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'executions' | 'forensics' | 'correlation' | 'settings'>('workflows');
  const [showActionBuilder, setShowActionBuilder] = useState(false);
  const [builderProtocol, setBuilderProtocol] = useState<'REST' | 'SSH' | 'SQL'>('REST');
  const [autoOpenExtractor, setAutoOpenExtractor] = useState(false);
  const [forensicsTarget, setForensicsTarget] = useState('');
  const [isForensicsRunning, setIsForensicsRunning] = useState(false);
  const [trackingIp, setTrackingIp] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [forensicsViewMode, setForensicsViewMode] = useState<'global' | 'incident'>('global');

  const branches = [
    { id: 'BR-01', name: isZh ? '台北分公司' : 'Taipei Branch', status: isZh ? '在線' : 'Online', velociraptor: isZh ? '已連線' : 'Connected', lastSync: isZh ? '1 分鐘前' : '1 min ago' },
    { id: 'BR-02', name: isZh ? '台中分公司' : 'Taichung Branch', status: isZh ? '在線' : 'Online', velociraptor: isZh ? '已連線' : 'Connected', lastSync: isZh ? '5 分鐘前' : '5 mins ago' },
    { id: 'BR-03', name: isZh ? '高雄分公司' : 'Kaohsiung Branch', status: isZh ? '離線' : 'Offline', velociraptor: isZh ? '已斷線' : 'Disconnected', lastSync: isZh ? '2 小時前' : '2 hours ago' },
  ];

  const trackingResults = [
    { branch: isZh ? '台北' : 'Taipei', status: isZh ? '發現匹配流量' : 'Match Found', flow: '10.1.1.5 -> 185.x.x.x', time: '10:55:12' },
    { branch: isZh ? '台中' : 'Taichung', status: isZh ? '無匹配' : 'No Match', flow: '-', time: '-' },
    { branch: isZh ? '新竹' : 'Hsinchu', status: isZh ? '發現匹配流量' : 'Match Found', flow: '10.2.4.12 -> 185.x.x.x', time: '10:54:30' },
  ];

  const workflows = [
    { 
      id: 'wf-1', 
      name: isZh ? '資安威脅調查處置 (TheHive -> Cortex)' : 'Threat Investigation (TheHive -> Cortex)', 
      status: isZh ? '運行中' : 'Active', 
      lastRun: isZh ? '2 分鐘前' : '2 mins ago', 
      successRate: '98%',
      description: isZh ? '自動分析來自 TheHive 的可疑觀察對象，並使用 Cortex 分析器進行深度處置。' : 'Automated analysis of observables from TheHive using Cortex analyzers.'
    },
    { 
      id: 'wf-2', 
      name: isZh ? '社交工程郵件自動處置' : 'Phishing Response', 
      status: isZh ? '運行中' : 'Active', 
      lastRun: isZh ? '15 分鐘前' : '15 mins ago', 
      successRate: '95%',
      description: isZh ? '自動從可疑郵件擷取 URL，並透過 VirusTotal/UrlScan 進行沙箱掃描與阻斷。' : 'Extract URLs from emails and scan with VirusTotal/UrlScan.'
    },
    { 
      id: 'wf-3', 
      name: isZh ? '端點主機隔離編排' : 'Endpoint Quarantine', 
      status: isZh ? '已暫停' : 'Paused', 
      lastRun: isZh ? '1 天前' : '1 day ago', 
      successRate: '100%',
      description: isZh ? '當觸發高風險告警時，自動透過 Velociraptor 下發網路隔離指令。' : 'Isolate hosts in Velociraptor based on high-severity alerts.'
    }
  ];

  const executions = [
    { id: 'ex-102', workflow: isZh ? '資安威脅調查處置' : 'Threat Investigation', time: '10:25:12', status: isZh ? '成功' : 'Success', result: isZh ? '惡意 IP 已成功阻斷' : 'Malicious IP Blocked' },
    { id: 'ex-101', workflow: isZh ? '資安威脅調查處置' : 'Threat Investigation', time: '10:24:45', status: isZh ? '成功' : 'Success', result: isZh ? '無異常 - 無需處置' : 'Clean - No Action' },
    { id: 'ex-100', workflow: isZh ? '社交工程郵件自動處置' : 'Phishing Response', time: '10:20:15', status: isZh ? '失敗' : 'Failed', result: isZh ? 'API 連線逾時' : 'API Timeout' },
    { id: 'ex-099', workflow: isZh ? '資安威脅調查處置' : 'Threat Investigation', time: '10:18:30', status: isZh ? '成功' : 'Success', result: isZh ? '惡意 Hash 已標註並下發隔離' : 'Malicious Hash Tagged' },
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'settings':
        return <CorrelationSettingView />;
      case 'forensics':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-[#111114] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
                  <button 
                    onClick={() => setForensicsViewMode('global')}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                      forensicsViewMode === 'global' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <Globe size={14} /> {isZh ? '全域拓撲架構' : 'Global Topology'}
                  </button>
                  <button 
                    onClick={() => setForensicsViewMode('incident')}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                      forensicsViewMode === 'incident' ? "bg-red-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <Activity size={14} /> {isZh ? '事件關聯處置' : 'Incident Correlation'}
                  </button>
                </div>
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                {isZh ? '即時鑑識引擎運作中' : 'Live Forensics Engine Active'}
              </div>
            </div>

            {forensicsViewMode === 'global' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Remote Forensics Section */}
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600/20 p-2 rounded-lg">
                        <HardDrive size={18} className="text-blue-400" />
                      </div>
                      <h3 className="font-bold text-white">{isZh ? '遠端數位鑑識中心' : 'Remote Digital Forensics'}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-800 px-2 py-0.5 rounded">{isZh ? 'Velociraptor 整合' : 'Velociraptor Integration'}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">{isZh ? '目標端點 / 分公司' : 'Target Endpoint / Branch'}</label>
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={forensicsTarget}
                          onChange={(e) => setForensicsTarget(e.target.value)}
                          placeholder={isZh ? "例如：BR-01-WS-42 或 台北分公司" : "e.g., BR-01-WS-42 or Taipei Branch"}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                        <button 
                          onClick={() => {
                            setIsForensicsRunning(true);
                            setTimeout(() => setIsForensicsRunning(false), 3000);
                          }}
                          disabled={isForensicsRunning}
                          className={cn(
                            "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                            isForensicsRunning ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          {isForensicsRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          {isForensicsRunning ? (isZh ? "部署指令中..." : "Deploying...") : (isZh ? "啟動鑑識" : "Start Forensics")}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 italic">
                        {isZh ? '* 指令將下發至分公司 Velociraptor 節點，鑑識結果保留於在地分公司，主控端僅讀取摘要紀錄。' : '* Commands are deployed to branch Velociraptor; results stay at branch, Master reads summary only.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isZh ? '分公司節點狀態 (CCS)' : 'Branch Status (CCS)'}</h4>
                      {branches.map(branch => (
                        <div key={branch.id} className="flex items-center justify-between p-3 bg-gray-900/30 border border-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", branch.status === (isZh ? '在線' : 'Online') ? "bg-green-500" : "bg-red-500")}></div>
                            <div>
                              <div className="text-xs font-bold text-gray-200">{branch.name}</div>
                              <div className="text-[10px] text-gray-500">ID: {branch.id} | {isZh ? '同步' : 'Sync'}: {branch.lastSync}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-[10px] font-bold uppercase", branch.velociraptor === (isZh ? '已連線' : 'Connected') ? "text-blue-400" : "text-gray-600")}>
                              {branch.velociraptor}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cross-site Reverse Tracking Section */}
                <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 space-y-6 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-600/20 p-2 rounded-lg">
                        <Crosshair size={18} className="text-purple-400" />
                      </div>
                      <h3 className="font-bold text-white">Cross-site Reverse Tracking</h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-800 px-2 py-0.5 rounded">Global Traceability</span>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Suspicious IP to Trace</label>
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={trackingIp}
                          onChange={(e) => setTrackingIp(e.target.value)}
                          placeholder="e.g., 185.199.110.153"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-purple-500 transition-colors"
                        />
                        <button 
                          onClick={() => {
                            setIsTracking(true);
                            setTimeout(() => setIsTracking(false), 2000);
                          }}
                          disabled={isTracking}
                          className={cn(
                            "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                            isTracking ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"
                          )}
                        >
                          {isTracking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                          {isTracking ? "Querying..." : "Global Trace"}
                        </button>
                      </div>
                    </div>

                    <div className="p-0 bg-black/40 border border-gray-800 rounded-xl overflow-hidden relative min-h-[400px] flex items-center justify-center">
                      <div className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">Global Topology View</div>
                      
                        <svg width="100%" height="400" viewBox="0 0 1000 400" className="overflow-visible">
                          {/* Connection Lines First (so they are behind nodes) */}
                          {[
                            { x: 150, y: 80, label: 'Taipei', status: 'Match Found', ip: '10.1.1.5', throughput: '4.2 MB/s', latency: '12ms' },
                            { x: 850, y: 80, label: 'Taichung', status: 'No Match', ip: '10.2.1.8', throughput: '0.5 MB/s', latency: '25ms' },
                            { x: 150, y: 320, label: 'Hsinchu', status: 'Match Found', ip: '10.3.1.12', throughput: '8.7 MB/s', latency: '8ms' },
                            { x: 850, y: 320, label: 'Kaohsiung', status: 'No Match', ip: '10.4.1.20', throughput: '1.2 MB/s', latency: '32ms' },
                          ].map((branch, i) => {
                            const isMatch = branch.status === 'Match Found';
                            return (
                              <g key={`connection-${i}`}>
                                <motion.line 
                                  x1="500" y1="200" 
                                  x2={branch.x} y2={branch.y} 
                                  stroke={isMatch ? "#ef4444" : "#374151"} 
                                  strokeWidth={isMatch ? "2" : "1"}
                                  strokeDasharray={isMatch ? "none" : "4,4"}
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 1, delay: i * 0.2 }}
                                />
                                
                                {/* Animated Data Packets */}
                                <motion.circle
                                  r="2"
                                  fill={isMatch ? "#f87171" : "#9ca3af"}
                                  initial={{ offsetDistance: "0%" }}
                                  animate={{ offsetDistance: "100%" }}
                                  transition={{ 
                                    duration: isMatch ? 1.5 : 3, 
                                    repeat: Infinity, 
                                    ease: "linear",
                                    delay: i * 0.5
                                  }}
                                  style={{
                                    offsetPath: `path('M 500 200 L ${branch.x} ${branch.y}')`,
                                    offsetRotate: "auto"
                                  }}
                                />

                                {/* Transmission Metrics Label */}
                                <text 
                                  x={(500 + branch.x) / 2} 
                                  y={(200 + branch.y) / 2 - 10} 
                                  textAnchor="middle" 
                                  className="text-[8px] fill-gray-500 font-mono"
                                >
                                  {branch.throughput} | {branch.latency}
                                </text>
                              </g>
                            );
                          })}

                          {/* Central Master Node */}
                          <g transform="translate(500, 200)">
                            <motion.circle 
                              r="32" 
                              fill="#111114" 
                              stroke="#3b82f6" 
                              strokeWidth="2"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            />
                            <foreignObject x="-14" y="-14" width="28" height="28">
                              <Server className="text-blue-400" size={28} />
                            </foreignObject>
                            <text y="50" textAnchor="middle" className="text-[10px] fill-gray-200 font-bold uppercase tracking-widest">Master HQ</text>
                            <text y="62" textAnchor="middle" className="text-[11px] fill-blue-400 font-mono">10.0.0.1</text>
                          </g>

                          {/* Branch Nodes */}
                          {[
                            { x: 150, y: 80, label: 'Taipei', status: 'Match Found', ip: '10.1.1.5' },
                            { x: 850, y: 80, label: 'Taichung', status: 'No Match', ip: '10.2.1.8' },
                            { x: 150, y: 320, label: 'Hsinchu', status: 'Match Found', ip: '10.3.1.12' },
                            { x: 850, y: 320, label: 'Kaohsiung', status: 'No Match', ip: '10.4.1.20' },
                          ].map((branch, i) => {
                            const isMatch = branch.status === 'Match Found';
                            return (
                              <g key={`node-${i}`} transform={`translate(${branch.x}, ${branch.y})`}>
                                <motion.circle 
                                  r="20" 
                                  fill="#111114" 
                                  stroke={isMatch ? "#ef4444" : "#374151"} 
                                  strokeWidth="2"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.5 + i * 0.2 }}
                                />
                                <foreignObject x="-10" y="-10" width="20" height="20">
                                  <Network className={isMatch ? "text-red-400" : "text-gray-600"} size={20} />
                                </foreignObject>
                                
                                {/* Node Labels */}
                                <text 
                                  y={branch.y > 200 ? 40 : -30} 
                                  textAnchor="middle" 
                                  className={cn("text-[9px] font-bold", isMatch ? "fill-red-400" : "fill-gray-400")}
                                >
                                  {branch.label.toUpperCase()}
                                </text>
                                <text 
                                  y={branch.y > 200 ? 50 : -40} 
                                  textAnchor="middle" 
                                  className="text-[11px] fill-gray-600 font-mono"
                                >
                                  {branch.ip}
                                </text>

                                {/* Status Indicator Dot */}
                                <circle 
                                  cx="14" cy="-14" r="5" 
                                  fill={isMatch ? "#ef4444" : "#22c55e"} 
                                  className={isMatch ? "animate-pulse" : ""}
                                />

                                {isMatch && (
                                  <motion.circle 
                                    r="28" 
                                    fill="none" 
                                    stroke="#ef4444" 
                                    strokeWidth="1"
                                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                  />
                                )}
                              </g>
                            );
                          })}
                        </svg>
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800"></div>
                      <div className="space-y-6 relative">
                        {trackingResults.map((res, i) => (
                          <div key={i} className="ml-8 relative">
                            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                              <div className={cn("w-1.5 h-1.5 rounded-full", res.status === 'Match Found' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-gray-600")}></div>
                            </div>
                            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-gray-200">{res.branch} Branch</div>
                                <div className="text-[10px] text-gray-500">{res.status === 'Match Found' ? `Flow: ${res.flow}` : 'No matching flow records found'}</div>
                              </div>
                              {res.status === 'Match Found' && (
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">MATCH</span>
                                  <div className="text-[8px] text-gray-600 mt-1">{res.time}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar: Incident Summary */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 space-y-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      Incident Summary
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Patient Zero</p>
                        <p className="text-sm font-bold text-gray-200">Endpoint-WS-22</p>
                        <p className="text-xs font-mono text-gray-400">10.88.88.22</p>
                      </div>

                      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                        <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Malware Identified</p>
                        <div className="flex items-center gap-2">
                          <Skull size={14} className="text-purple-400" />
                          <p className="text-sm font-bold text-gray-200">WannaCry Ransomware v2.0</p>
                        </div>
                        <p className="text-xs font-mono text-gray-400">Infected: tasksche.exe, wcry.exe</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Infected Artifacts</p>
                        <div className="flex flex-wrap gap-2">
                          {['pci.sys', 'tasksche.exe', 'wcry.exe', 'mssecsvc.exe'].map(file => (
                            <span key={file} className="px-2 py-0.5 bg-gray-800 rounded text-[9px] font-bold text-gray-400 border border-gray-700">
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-800">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Attack Timeline</p>
                        <div className="space-y-4">
                          {[
                            { time: '10:15', event: 'C2 Relay -> Firewall Connection', status: 'Entry' },
                            { time: '10:18', event: 'Firewall -> Core Switch Traffic', status: 'Passed' },
                            { time: '10:22', event: 'SMB Exploit -> 10.88.88.22', status: 'Infected' },
                            { time: '10:45', event: 'Lateral Spread to 10.88.88.131', status: 'Spreading' },
                            { time: '10:48', event: 'Lateral Spread to 10.88.88.132', status: 'Spreading' },
                          ].map((item, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="text-[10px] font-mono text-gray-500 mt-0.5">{item.time}</div>
                              <div className="flex-1">
                                <p className="text-[11px] font-bold text-gray-300">{item.event}</p>
                                <p className="text-[9px] text-gray-500 uppercase">{item.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main View: Reverse Tracking Topology */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 min-h-[600px] relative overflow-hidden">
                    <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Reverse Tracking Topology View</h3>
                      <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                        <span className="text-[10px] font-bold text-red-400">ACTIVE THREAT FLOW</span>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-4 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-red-500"></div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Infection Path</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">C2 Channel</span>
                      </div>
                    </div>

                    <svg width="100%" height="500" viewBox="0 0 800 500" className="mt-12">
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                        </marker>
                      </defs>

                      {/* Connection Paths */}
                    {[
                      { from: [50, 250], to: [200, 250], label: 'C2 -> FW' },
                      { from: [200, 250], to: [350, 250], label: 'FW -> SW' },
                      { from: [350, 250], to: [500, 250], label: 'SW -> WS22' },
                      { from: [500, 250], to: [650, 150], label: 'WS22 -> WS131' },
                      { from: [500, 250], to: [650, 350], label: 'WS22 -> WS132' },
                    ].map((path, i) => (
                        <g key={`path-${i}`}>
                          <motion.path
                            d={`M ${path.from[0]} ${path.from[1]} L ${path.to[0]} ${path.to[1]}`}
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: i * 0.5 }}
                          />
                          {/* Animated Infection Flow */}
                          <motion.circle
                            r="3"
                            fill="#ef4444"
                            initial={{ offsetDistance: "0%" }}
                            animate={{ offsetDistance: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                            style={{
                              offsetPath: `path('M ${path.from[0]} ${path.from[1]} L ${path.to[0]} ${path.to[1]}')`,
                            }}
                          />
                        </g>
                      ))}

                    {/* Nodes */}
                    {[
                      { pos: [50, 250], label: 'C2 Relay Station', type: 'attacker', icon: Globe, ip: 'External C2' },
                      { pos: [200, 250], label: 'Firewall', type: 'target', icon: Shield, ip: '10.88.88.254' },
                      { pos: [350, 250], label: 'Core Switch', type: 'target', icon: Network, ip: '10.88.88.1' },
                      { pos: [500, 250], label: 'Endpoint WS 22', type: 'infected', icon: Monitor, ip: '10.88.88.22' },
                      { pos: [650, 150], label: 'Spread Target 1', type: 'infected', icon: Monitor, ip: '10.88.88.131' },
                      { pos: [650, 350], label: 'Spread Target 2', type: 'infected', icon: Monitor, ip: '10.88.88.132' },
                    ].map((node, i) => (
                      <g key={`node-${i}`} transform={`translate(${node.pos[0]}, ${node.pos[1]})`}>
                        <motion.circle
                          r="24"
                          fill="#111114"
                          stroke={node.type === 'attacker' ? "#3b82f6" : node.type === 'target' ? "#6b7280" : "#ef4444"}
                          strokeWidth="2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.3 }}
                        />
                        <node.icon 
                          size={20} 
                          x="-10" y="-10" 
                          className={node.type === 'attacker' ? "text-blue-400" : node.type === 'target' ? "text-gray-400" : "text-red-400"} 
                        />
                        
                        {/* Infection Pulse */}
                        {(node.type === 'infected' || node.type === 'target') && (
                          <motion.circle
                            r="30"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1"
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                          />
                        )}

                        <text y="45" textAnchor="middle" className="text-[10px] font-bold fill-gray-200 uppercase tracking-tighter">{node.label}</text>
                        <text y="57" textAnchor="middle" className="text-[11px] font-mono fill-gray-500">{node.ip}</text>
                      </g>
                    ))}
                    </svg>

                    {/* Legend / Info Cards */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Initial Vector</span>
                        </div>
                        <p className="text-xs text-gray-200">Malicious payload from C2 relay station detected at Gateway</p>
                      </div>
                      <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Infection Detail</span>
                        </div>
                        <p className="text-xs text-gray-200">WannaCry variant encrypting files: pci.sys, wcry.exe</p>
                      </div>
                      <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Spread Scope</span>
                        </div>
                        <p className="text-xs text-gray-200">Internal propagation via SMB v1 vulnerability (EternalBlue)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Forensics Summary (Master View)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-gray-800">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Case ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Branch</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Artifacts Collected</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Severity</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[
                      { id: 'FR-2026-001', branch: 'Taipei', artifacts: 'MFT, Prefetch, Registry', severity: 'High', status: 'Completed' },
                      { id: 'FR-2026-002', branch: 'Hsinchu', artifacts: 'Process List, Netstat', severity: 'Medium', status: 'In Progress' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-blue-400">{row.id}</td>
                        <td className="px-6 py-4 text-xs text-gray-300">{row.branch}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{row.artifacts}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                            row.severity === 'High' ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {row.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'correlation':
        const topologyData = {
          nodes: [
            { id: 'C2', type: 'attacker', label: 'C2 Relay Station', x: 50, y: 250, ip: 'External C2' },
            { id: 'FW', type: 'gateway', label: 'Firewall', x: 200, y: 250, ip: '10.88.88.254' },
            { id: 'SW', type: 'network', label: 'Core Switch', x: 350, y: 250, ip: '10.88.88.1' },
            { id: 'WS22', type: 'infected', label: 'Endpoint (WS 22)', x: 500, y: 250, ip: '10.88.88.22', patientZero: true },
            { id: 'WS131', type: 'infected', label: 'Infected Node 1', x: 650, y: 150, ip: '10.88.88.131' },
            { id: 'WS132', type: 'infected', label: 'Infected Node 2', x: 650, y: 350, ip: '10.88.88.132' },
          ],
          links: [
            { source: 'C2', target: 'FW', label: 'Entry', mitre: 'T1071.001' },
            { source: 'FW', target: 'SW', label: 'Transit', mitre: 'T1090' },
            { source: 'SW', target: 'WS22', label: 'Infection', mitre: 'T1566.001' },
            { source: 'WS22', target: 'WS131', label: 'Spread', mitre: 'T1570' },
            { source: 'WS22', target: 'WS132', label: 'Spread', mitre: 'T1021.001' },
          ]
        };

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Analysis Header */}
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Workflow size={120} className="text-red-500" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Activity className="text-red-500 w-5 h-5" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Incident Correlation & Propagation Analytics</h3>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Deep forensic analysis of the WannaCry propagation vector</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mb-1">Alert Level</p>
                    <p className="text-sm font-black text-red-500">CRITICAL THREAT</p>
                  </div>
                  <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-black text-blue-500 uppercase">Analysis Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main View: Full-Width Attack Topology Map */}
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-8 min-h-[600px] relative overflow-hidden shadow-2xl">
              <div className="absolute top-6 left-8 flex flex-col gap-1 z-10">
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Full-Spectrum Attack Topology</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Forensic Correlation & Propagation Mapping</p>
              </div>

              <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                  <span className="text-[10px] font-black text-red-400 uppercase">Real-time Infection Flow</span>
                </div>
              </div>

              <div className="w-full h-[550px] relative mt-12 overflow-visible">
                <svg width="100%" height="100%" viewBox="0 0 1000 500" className="overflow-visible">
                  <defs>
                    <linearGradient id="path-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Connection Paths */}
                  {topologyData.links.map((path, i) => {
                    const from = topologyData.nodes.find(n => n.id === path.source)!;
                    const to = topologyData.nodes.find(n => n.id === path.target)!;
                    const isInitial = i < 3;
                    
                    // Adjust coordinates for 1000px width
                    const scaleX = 1.2;
                    const offsetX = 50;
                    const fx = from.x * scaleX + offsetX;
                    const fy = from.y;
                    const tx = to.x * scaleX + offsetX;
                    const ty = to.y;

                    return (
                      <g key={`path-corr-${i}`}>
                        <motion.path
                          d={`M ${fx} ${fy} L ${tx} ${ty}`}
                          stroke={isInitial ? "#3b82f6" : "#ef4444"}
                          strokeWidth="2.5"
                          strokeDasharray="8,5"
                          fill="none"
                          filter="url(#glow)"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 1.5, delay: i * 0.4 }}
                        />
                        <motion.circle
                          r="4"
                          fill={isInitial ? "#3b82f6" : "#ef4444"}
                          initial={{ offsetDistance: "0%" }}
                          animate={{ offsetDistance: "100%" }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                          style={{
                            offsetPath: `path('M ${fx} ${fy} L ${tx} ${ty}')`,
                          }}
                        />
                        <text 
                          x={(fx + tx) / 2} 
                          y={(fy + ty) / 2 - 15} 
                          textAnchor="middle" 
                          className="text-[9px] font-black fill-gray-400 uppercase tracking-widest italic"
                        >
                          {path.label} {(path as any).mitre && `[${(path as any).mitre}]`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {topologyData.nodes.map((node, i) => {
                    const scaleX = 1.2;
                    const offsetX = 50;
                    const nx = node.x * scaleX + offsetX;
                    const ny = node.y;

                    return (
                      <g key={`node-corr-${i}`} transform={`translate(${nx}, ${ny})`}>
                        <motion.circle
                          r="32"
                          fill="#111114"
                          stroke={node.type === 'attacker' ? "#3b82f6" : node.type === 'infected' ? "#ef4444" : "#6b7280"}
                          strokeWidth="3"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.3 }}
                          className="shadow-2xl"
                        />
                        <foreignObject x="-14" y="-14" width="28" height="28">
                          {node.type === 'attacker' ? <Globe className="text-blue-500" /> :
                           node.type === 'infected' ? <Monitor className="text-red-500" /> :
                           node.id === 'FW' ? <Shield className="text-gray-400" /> : <Network className="text-gray-400" />}
                        </foreignObject>
                        
                        {(node.type === 'infected' || node.ip === '10.88.88.22') && (
                          <motion.circle
                            r="40"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                          />
                        )}

                        <text y="55" textAnchor="middle" className="text-[11px] font-black fill-white uppercase italic tracking-tighter">{node.label}</text>
                        <text y="70" textAnchor="middle" className="text-[12px] font-mono fill-gray-500 font-black">{node.ip}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Insight Panel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-inner">
                <div className="space-y-3 p-4 bg-gray-900/40 rounded-2xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Initial Entry</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-bold tracking-tight">Malicious payload from C2 relay station detected at gateway. Bypassed primary endpoint protection via novel injection.</p>
                </div>
                <div className="space-y-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
                    <span className="text-[11px] font-black text-red-400 uppercase tracking-[0.2em]">Patient Zero</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-bold italic font-mono lowercase tracking-tight">Endpoint WS 22 infected via SMB v1 vulnerability. Files encrypted: pci.sys, tasksche.exe, wcry.exe</p>
                </div>
                <div className="space-y-3 p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                    <span className="text-[11px] font-black text-yellow-400 uppercase tracking-[0.2em]">Propagation</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-bold tracking-tight">Internal lateral movement detected via EternalBlue. Spreading to highly segmented internal assets (WS 131, WS 132).</p>
                </div>
                <div className="space-y-3 p-4 bg-zinc-900 rounded-2xl border border-gray-800">
                   <div className="flex items-center justify-between mb-2">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Infected Files</p>
                     <Box size={14} className="text-gray-600" />
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {['pci.sys', 'tasksche.exe', 'wcry.exe', 'mssecsvc.exe'].map(f => (
                       <span key={f} className="text-[9px] font-mono bg-gray-800 px-2 py-1 rounded-md text-gray-400 border border-gray-700">{f}</span>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Detailed Timeline Table */}
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-3">
                    <History className="text-blue-500 w-5 h-5" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Correlated Attack Timeline</h3>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { time: '10:15', event: 'C2 Gateway Conn', type: 'Entry', risk: 'Medium' },
                    { time: '10:18', event: 'FW -> Core Switch', type: 'Transit', risk: 'High' },
                    { time: '10:22', event: 'Malware Execution', type: 'Infection', risk: 'Critical' },
                    { time: '10:45', event: 'Lateral Spread A', type: 'Spread', risk: 'Critical' },
                    { time: '10:48', event: 'Lateral Spread B', type: 'Spread', risk: 'Critical' },
                  ].map((evt, idx) => (
                    <div key={idx} className="p-4 bg-gray-900/50 border border-gray-800 rounded-2xl group hover:border-red-500/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-gray-500 font-bold">{evt.time}</span>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                          evt.risk === 'Critical' ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"
                        )}>{evt.risk}</div>
                      </div>
                      <p className="text-xs font-black text-white uppercase italic tracking-tighter mb-1">{evt.event}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{evt.type}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        );
      case 'workflows':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Workflow size={120} className="text-blue-500" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Workflow className="text-blue-500 w-6 h-6" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{isZh ? 'SOAR 自動化處置劇本' : 'SOAR Automation Playbooks'}</h3>
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic decoration-blue-500/30 underline underline-offset-4">{isZh ? '結合 n8n 與 TheHive 邏輯之視覺化編排介面' : 'Visual Orchestration Interface Powered by n8n & TheHive Logic'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">{isZh ? '使用中劇本' : 'Active Scripts'}</p>
                    <p className="text-lg font-black text-blue-500">12 PROD</p>
                  </div>
                  <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-[8px] font-bold text-purple-400 uppercase tracking-widest mb-1">{isZh ? '執行次數' : 'Executions'}</p>
                    <p className="text-lg font-black text-purple-500">48.2k / 24h</p>
                  </div>
                  <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-xl cursor-pointer hover:bg-pink-500/20 transition-all border-dashed" onClick={() => { setBuilderProtocol('REST'); setAutoOpenExtractor(false); setShowActionBuilder(true); }}>
                    <p className="text-[8px] font-bold text-pink-400 uppercase tracking-widest mb-1">{isZh ? '新增模組' : 'New Extra'}</p>
                    <p className="text-lg font-black text-pink-500 flex items-center gap-1">{isZh ? '動作建構器' : 'Builder'} <Plus size={14} /></p>
                  </div>
                  <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-pointer hover:bg-blue-600 transition-all border-dashed group" onClick={() => { setBuilderProtocol('SSH'); setAutoOpenExtractor(true); setShowActionBuilder(true); }}>
                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1 group-hover:text-white">{isZh ? '正規表示式' : 'Regex'}</p>
                    <p className="text-lg font-black text-blue-500 flex items-center gap-1 group-hover:text-white transition-colors">{isZh ? '擷取器' : 'Extractor'} <Fingerprint size={14} /></p>
                  </div>
                </div>
              </div>
            </div>

            {showActionBuilder ? <ActionBuilder onBack={() => setShowActionBuilder(false)} initialProtocol={builderProtocol} autoOpenExtractor={autoOpenExtractor} /> : <PlaybookEditor />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <List size={18} className="text-gray-400" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{isZh ? '全域自動化劇本清單' : 'Global Automation Inventory'}</h3>
                  </div>
                  <div className="flex gap-2">
                     <button className="px-4 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">{isZh ? '篩選' : 'Filter'}</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {workflows.map((wf) => (
                    <div key={wf.id} className="p-6 bg-black border border-gray-800 rounded-[1.5rem] hover:border-blue-500/40 transition-all group cursor-pointer shadow-lg active:scale-[0.99]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-2xl shadow-inner",
                            wf.status === (isZh ? '運行中' : 'Active') ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-800"
                          )}>
                            <Workflow size={20} />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">{wf.name}</h4>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed line-clamp-1">{wf.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "text-[9px] font-black uppercase px-3 py-1 rounded-full italic tracking-widest shadow-sm",
                            wf.status === (isZh ? '運行中' : 'Active') ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-500"
                          )}>
                            {wf.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-900">
                        <span className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest italic group-hover:text-gray-300"><Clock size={12} className="text-blue-500" /> {wf.lastRun}</span>
                        <span className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest italic group-hover:text-gray-300"><CheckCircle2 size={12} className="text-green-500" /> {isZh ? '成功率' : 'Success'}: {wf.successRate}</span>
                        <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-2 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-600 hover:text-white transition-all"><Play size={12} /></button>
                           <button className="p-2 border border-gray-800 rounded-lg text-gray-500 hover:text-white transition-all"><Settings2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{isZh ? 'SOAR 系統健康度' : 'SOAR Health'}</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-gray-400">{isZh ? '總執行次數 (24小時)' : 'Total Executions (24h)'}</span>
                      <span className="text-xl font-bold text-white">1,284</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-600/5 border border-green-500/20 rounded-xl">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-gray-400">{isZh ? '節省人力工時' : 'Automation Savings'}</span>
                      <span className="text-xl font-bold text-white">{isZh ? '42.5 小時' : '42.5 hrs'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">{isZh ? '已串接系統引擎' : 'Connected Engines'}</h4>
                    <div className="flex flex-wrap gap-2">
                      {['n8n', 'TheHive', 'Cortex', 'MISP', 'Slack'].map((engine) => (
                        <span key={engine} className="px-2 py-1 bg-gray-800 rounded text-[10px] font-bold text-gray-400 border border-gray-700">
                          {engine}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'executions':
        return (
          <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-900/50 text-gray-500 uppercase text-[10px] tracking-widest border-b border-gray-800">
                  <th className="px-6 py-4 font-bold">{isZh ? '執行編號' : 'Execution ID'}</th>
                  <th className="px-6 py-4 font-bold">{isZh ? '劇本名稱' : 'Workflow'}</th>
                  <th className="px-6 py-4 font-bold">{isZh ? '執行時間' : 'Timestamp'}</th>
                  <th className="px-6 py-4 font-bold">{isZh ? '狀態' : 'Status'}</th>
                  <th className="px-6 py-4 font-bold">{isZh ? '執行結果' : 'Result'}</th>
                  <th className="px-6 py-4 font-bold text-right">{isZh ? '操作' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {executions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-blue-400">{ex.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-200">{ex.workflow}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{ex.time}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        ex.status === (isZh ? '成功' : 'Success') ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">{ex.result}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs text-blue-400 hover:underline font-bold">{isZh ? '詳細資訊' : 'Details'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/20 p-2 rounded-lg border border-purple-500/30">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">SEMOR SOAR</h2>
            <p className="text-xs text-gray-500 mt-1">{isZh ? 'SOAR 自動化事件回應與處置 (n8n 編排)' : 'SOAR & Automated Incident Response (n8n)'}</p>
          </div>
        </div>
        
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'workflows', label: isZh ? '工作流程劇本' : 'Workflows', icon: <Workflow className="w-3.5 h-3.5" /> },
            { id: 'executions', label: isZh ? '執行紀錄' : 'Executions', icon: <History className="w-3.5 h-3.5" /> },
            { id: 'forensics', label: isZh ? '遠端數位鑑識' : 'Digital Forensics', icon: <FileSearch className="w-3.5 h-3.5" /> },
            { id: 'correlation', label: isZh ? '事件關聯追蹤' : 'Incident Correlation', icon: <Share2 className="w-3.5 h-3.5" /> },
            { id: 'settings', label: isZh ? '系統與整合設定' : 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeSubTab === tab.id ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderSubContent()}
      </motion.div>
    </div>
  );
}

function SessionTrafficTopology({ sessions }: { sessions: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare data
    const nodesMap = new Map();
    const links: any[] = [];

    sessions.forEach(s => {
      if (!nodesMap.has(s.src)) nodesMap.set(s.src, { id: s.src, type: 'source' });
      if (!nodesMap.has(s.dst)) nodesMap.set(s.dst, { id: s.dst, type: 'destination' });
      links.push({ source: s.src, target: s.dst, value: 1, proto: s.proto });
    });

    const nodes = Array.from(nodesMap.values());

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const g = svg.append("g");

    // Add arrows
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#4b5563")
      .style("stroke", "none");

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#374151")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2)
      .attr("marker-end", "url(#arrowhead)");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => d.type === 'source' ? "#3b82f6" : "#10b981")
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", -15)
      .attr("text-anchor", "middle")
      .attr("fill", "#9ca3af")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .text((d: any) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Zoom behavior
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      }));

  }, [sessions]);

  return (
    <div ref={containerRef} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-2xl overflow-hidden relative group">
      <div className="absolute top-6 left-6 z-10 space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Network size={16} className="text-blue-400" />
          Actual Traffic Topology
        </h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Captured Flows Visualization</p>
      </div>
      
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-800">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[9px] font-bold text-gray-400 uppercase">Source</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-800">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-[9px] font-bold text-gray-400 uppercase">Dest</span>
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing" />

      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 bg-gray-900/50 backdrop-blur-md p-2 rounded-lg border border-white/5 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-black">Nodes</span>
            <span className="text-xs font-bold text-white">4 Devices</span>
          </div>
          <div className="w-px h-6 bg-gray-800" />
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-black">Edges</span>
            <span className="text-xs font-bold text-white">{sessions.length} Flows</span>
          </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <button className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700">
            <Maximize2 size={14} />
          </button>
          <button className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NDRView() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const [activeSubTab, setActiveSubTab] = useState<'forensics' | 'monitoring' | 'analysis' | 'topology'>('forensics');
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const ndrStats = [
    { name: isZh ? '流量擷取速率' : 'Capture Rate', value: '1.2 Gbps', change: '+15%', status: isZh ? '運作中' : 'Active' },
    { name: isZh ? '索引解析速度' : 'Index Speed', value: '850k eps', change: isZh ? '穩定' : 'Stable', status: isZh ? '最佳' : 'Optimal' },
    { name: isZh ? '儲存使用量' : 'Storage Used', value: '12.4 TB', change: '75%', status: isZh ? '正常' : 'Normal' },
    { name: isZh ? '活躍連線 Session' : 'Active Sessions', value: '45.2k', change: '+2.1k', status: isZh ? '最佳' : 'Optimal' },
  ];

  const sessions = [
    { 
      id: 1, 
      time: '10:25:12', 
      src: '192.168.1.105', 
      dst: '10.0.4.12', 
      proto: 'HTTPS', 
      bytes: '1.2 MB', 
      packets: 450, 
      info: 'TLS v1.3 Handshake',
      details: {
        hex: [
          { offset: '0000', data: '00 50 56 c0 00 08 00 0c 29 d2 3f 5a 08 00 45 00', ascii: '..V.....).?Z..E.' },
          { offset: '0010', data: '00 3c 1c 46 40 00 40 06 b1 e6 c0 a8 01 69 c0 a8', ascii: '.<.F@.@......i..' },
          { offset: '0020', data: '01 01 d4 31 00 50 73 4f 21 54 00 00 00 00 a0 02', ascii: '...1.PsO!T......' }
        ],
        messages: [
          { time: '10:25:12.001', src: '192.168.1.105', dir: 'out', msg: 'Client Hello (TLS v1.3)' },
          { time: '10:25:12.145', src: '10.0.4.12', dir: 'in', msg: 'Server Hello, Change Cipher Spec' },
          { time: '10:25:12.210', src: '10.0.4.12', dir: 'in', msg: 'Encrypted Extensions, Certificate, Certificate Verify, Finished' },
          { time: '10:25:12.302', src: '192.168.1.105', dir: 'out', msg: 'Finished' },
          { time: '10:25:12.350', src: '192.168.1.105', dir: 'out', msg: 'Application Data (Encrypted)' }
        ]
      }
    },
    { 
      id: 2, 
      time: '10:24:45', 
      src: '172.16.0.50', 
      dst: '8.8.8.8', 
      proto: 'DNS', 
      bytes: '124 B', 
      packets: 2, 
      info: 'Query: google.com',
      details: {
        hex: [
          { offset: '0000', data: 'c0 a8 01 01 00 35 bb 42 01 00 00 01 00 00 00 00', ascii: '.....5.B........' },
          { offset: '0010', data: '00 00 06 67 6f 6f 67 6c 65 03 63 6f 6d 00 00 01', ascii: '...google.com...' }
        ],
        messages: [
          { time: '10:24:45.012', src: '172.16.0.50', dir: 'out', msg: 'Standard query 0xbb42 A google.com' },
          { time: '10:24:45.088', src: '8.8.8.8', dir: 'in', msg: 'Standard query response 0xbb42 A google.com A 142.250.190.46' }
        ]
      }
    },
    { 
      id: 3, 
      time: '10:24:30', 
      src: '10.0.0.15', 
      dst: '10.0.0.1', 
      proto: 'SSH', 
      bytes: '45 KB', 
      packets: 120, 
      info: 'Encrypted Session',
      details: {
        hex: [
          { offset: '0000', data: '53 53 48 2d 32 2e 30 2d 4f 70 65 6e 53 53 48 5f', ascii: 'SSH-2.0-OpenSSH_' }
        ],
        messages: [
          { time: '10:24:30.500', src: '10.0.0.15', dir: 'out', msg: 'Protocol exchange: SSH-2.0-OpenSSH_8.9' },
          { time: '10:24:30.550', src: '10.0.0.1', dir: 'in', msg: 'Protocol exchange: SSH-2.0-OpenSSH_8.2' },
          { time: '10:24:30.600', src: '10.0.0.15', dir: 'out', msg: 'Key Exchange Init' }
        ]
      }
    },
    { 
      id: 4, 
      time: '10:23:55', 
      src: '192.168.1.200', 
      dst: '192.168.1.1', 
      proto: 'HTTP', 
      bytes: '2.5 MB', 
      packets: 850, 
      info: 'GET /downloads/update.bin',
      details: {
        hex: [
          { offset: '0000', data: '47 45 54 20 2f 64 6f 77 6e 6c 6f 61 64 73 2f 75', ascii: 'GET /downloads/u' },
          { offset: '0010', data: '70 64 61 74 65 2e 62 69 6e 20 48 54 54 50 2f 31', ascii: 'pdate.bin HTTP/1' }
        ],
        messages: [
          { time: '10:23:55.101', src: '192.168.1.200', dir: 'out', msg: 'GET /downloads/update.bin HTTP/1.1' },
          { time: '10:23:55.150', src: '192.168.1.1', dir: 'in', msg: 'HTTP/1.1 200 OK (application/octet-stream)' }
        ]
      }
    },
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'forensics':
        return (
          <div className="space-y-6">
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div className="flex-1 max-w-2xl flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search PCAP (e.g., ip.addr == 192.168.1.105 && tcp.port == 443)..." 
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                    Search
                  </button>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors border border-gray-700 flex items-center gap-2">
                    <Download size={14} /> Export PCAP
                  </button>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors border border-gray-700 flex items-center gap-2">
                    <Share size={14} /> API JSON
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 uppercase text-[10px] tracking-widest border-b border-gray-800">
                      <th className="pb-4 font-bold">Timestamp</th>
                      <th className="pb-4 font-bold">Source IP</th>
                      <th className="pb-4 font-bold">Destination IP</th>
                      <th className="pb-4 font-bold">Protocol</th>
                      <th className="pb-4 font-bold">Size</th>
                      <th className="pb-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {sessions.map((s) => (
                      <React.Fragment key={s.id}>
                        <tr 
                          className={cn(
                            "hover:bg-white/5 transition-colors group cursor-pointer",
                            expandedSessionId === s.id && "bg-blue-600/5"
                          )}
                          onClick={() => setExpandedSessionId(expandedSessionId === s.id ? null : s.id)}
                        >
                          <td className="py-4 text-xs font-mono text-gray-400">
                            <div className="flex items-center gap-3">
                              <ChevronRight size={14} className={cn("transition-transform", expandedSessionId === s.id && "rotate-90 text-blue-400")} />
                              {s.time}
                            </div>
                          </td>
                          <td className="py-4 font-bold text-blue-400">{s.src}</td>
                          <td className="py-4 font-bold text-green-400">{s.dst}</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] font-bold text-gray-300 border border-gray-700">
                              {s.proto}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400">{s.bytes}</td>
                          <td className="py-4 text-right">
                            <button className="text-xs text-blue-400 hover:underline font-bold">
                              {expandedSessionId === s.id ? 'Close Details' : 'View PCAP'}
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedSessionId === s.id && (
                            <tr>
                              <td colSpan={6} className="p-0 border-b border-gray-800">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden bg-black/40"
                                >
                                  <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-gray-800">
                                    {/* Left: Message Exchange */}
                                    <div className="space-y-6">
                                      <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-blue-400" />
                                            Session Message Exchange
                                          </h4>
                                          <span className="text-[10px] text-gray-600 font-mono">Stream ID: {1000 + s.id}</span>
                                      </div>
                                      
                                      <div className="space-y-3 relative">
                                        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-800" />
                                        {s.details?.messages.map((ms, midx) => (
                                          <div key={midx} className="relative pl-10 group/msg">
                                            <div className={cn(
                                              "absolute left-3 w-2 h-2 rounded-full border-2 border-gray-900 bg-gray-800 group-hover/msg:scale-125 transition-transform top-1",
                                              ms.dir === 'out' ? "bg-blue-400" : "bg-green-400"
                                            )} />
                                            <div className="flex items-center justify-between mb-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-gray-500">{ms.time}</span>
                                                <span className={cn(
                                                  "text-[10px] font-bold uppercase px-1 rounded flex items-center gap-1",
                                                  ms.dir === 'out' ? "text-blue-400 bg-blue-400/10" : "text-green-400 bg-green-400/10"
                                                )}>
                                                  {ms.dir === 'out' ? <ArrowRight size={10} /> : <ArrowLeft size={10} />}
                                                  {ms.dir === 'out' ? 'Outgoing' : 'Incoming'}
                                                </span>
                                              </div>
                                              <span className="text-[10px] text-gray-600 font-mono">{ms.src}</span>
                                            </div>
                                            <p className="text-xs text-gray-300 font-medium bg-gray-900/50 p-2 rounded-lg border border-white/5 transition-colors group-hover/msg:border-white/10 group-hover/msg:bg-gray-800/50">
                                              {ms.msg}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Right: Deep Packet Analysis */}
                                    <div className="space-y-6">
                                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-purple-400" />
                                        Deep Packet Analysis (Hex Dump)
                                      </h4>
                                      
                                      <div className="bg-black/60 rounded-xl border border-gray-800 p-6 font-mono text-[11px] text-gray-400 space-y-2 shadow-inner overflow-x-auto custom-scrollbar">
                                        {s.details?.hex.map((h, hidx) => (
                                          <div key={hidx} className="flex gap-4 whitespace-nowrap group/hex hover:bg-white/5 transition-colors px-2 py-1 rounded">
                                            <span className="text-blue-500/60 font-bold w-12">{h.offset}</span>
                                            <span className="text-gray-300 group-hover/hex:text-white transition-colors">{h.data}</span>
                                            <span className="text-gray-600 font-bold opacity-40 group-hover/hex:opacity-100 transition-opacity">|</span>
                                            <span className="text-purple-400/60 tracking-wider font-bold">{h.ascii}</span>
                                          </div>
                                        ))}
                                        {s.proto === 'HTTP' && (
                                          <div className="pt-4 border-t border-gray-800 mt-4">
                                            <p className="text-green-400 mb-2 font-bold select-none">// Decoded Protocol Structure</p>
                                            <div className="text-gray-300 space-y-1">
                                              <p><span className="text-purple-400">Request:</span> GET /downloads/update.bin HTTP/1.1</p>
                                              <p><span className="text-purple-400">User-Agent:</span> Wget/1.21.1 (linux-gnu)</p>
                                              <p><span className="text-purple-400">Accept:</span> */*</p>
                                              <p><span className="text-purple-400">Connection:</span> Keep-Alive</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex gap-4">
                                        <button className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all border border-gray-700 flex items-center justify-center gap-2">
                                          <Download size={14} />
                                          Download Raw Payload
                                        </button>
                                        <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                                          <Shield size={14} />
                                          Analyze Protocol
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'monitoring':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Suricata IDS Alerts</h3>
              <div className="space-y-4">
                {[
                  { severity: 'High', msg: 'ET EXPLOIT Possible CVE-2021-44228 Log4j', src: '10.0.4.12', time: '10:22:01' },
                  { severity: 'Medium', msg: 'ET SCAN Potential SSH Brute Force', src: '172.16.0.50', time: '10:20:15' },
                  { severity: 'Low', msg: 'ET POLICY Suspicious User-Agent', src: '192.168.1.105', time: '10:18:45' },
                ].map((alert, i) => (
                  <div key={i} className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        alert.severity === 'High' ? "bg-red-500" : alert.severity === 'Medium' ? "bg-orange-500" : "bg-yellow-500"
                      )}></div>
                      <div>
                        <p className="text-xs font-bold text-gray-200">{alert.msg}</p>
                        <p className="text-[10px] text-gray-500">{alert.src} • {alert.time}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                      alert.severity === 'High' ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                    )}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Protocol Distribution</h3>
              <div className="space-y-6">
                {[
                  { name: 'HTTPS', value: 65, color: 'bg-blue-500' },
                  { name: 'HTTP', value: 15, color: 'bg-green-500' },
                  { name: 'DNS', value: 10, color: 'bg-purple-500' },
                  { name: 'SSH', value: 5, color: 'bg-orange-500' },
                  { name: 'Other', value: 5, color: 'bg-gray-500' },
                ].map((p, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{p.name}</span>
                      <span className="text-gray-200 font-bold">{p.value}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", p.color)} style={{ width: `${p.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div className="space-y-8">
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Network Bandwidth Utilization</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ALERT_DATA}>
                    <defs>
                      <linearGradient id="colorBandwidth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111114', borderColor: '#374151', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="alerts" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBandwidth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Top Talkers (Source)</h4>
                <div className="space-y-3">
                  {['192.168.1.105', '10.0.4.12', '172.16.0.50'].map((ip, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-mono text-blue-400">{ip}</span>
                      <span className="text-xs font-bold text-gray-200">{150 - i * 30} GB</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Top Destinations</h4>
                <div className="space-y-3">
                  {['8.8.8.8', '1.1.1.1', '10.0.0.1'].map((ip, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-mono text-green-400">{ip}</span>
                      <span className="text-xs font-bold text-gray-200">{120 - i * 25} GB</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Traffic Characteristics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Avg Packet Size</span>
                    <span className="text-xs font-bold text-gray-200">750 B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Flow Duration</span>
                    <span className="text-xs font-bold text-gray-200">12.4s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">TCP Retransmit</span>
                    <span className="text-xs font-bold text-red-400">0.02%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'topology':
        return (
          <div className="space-y-6">
            <SessionTrafficTopology sessions={sessions} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">SEMOR Flow (NDR)</h2>
            <p className="text-xs text-gray-500 mt-1">{isZh ? '全封包擷取 (PCAP) 與網路流量安全分析中心' : 'Full Packet Capture & Network Security Analysis'}</p>
          </div>
        </div>
        
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'forensics', label: t('ndr.tabs.forensics'), icon: <FileSearch className="w-3.5 h-3.5" /> },
            { id: 'monitoring', label: t('ndr.tabs.monitoring'), icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'topology', label: t('ndr.tabs.topology'), icon: <Network className="w-3.5 h-3.5" /> },
            { id: 'analysis', label: t('ndr.tabs.analysis'), icon: <TrendingUp className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeSubTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ndrStats.map((stat, idx) => (
          <div key={idx} className="bg-[#111114] border border-gray-800 p-6 rounded-xl shadow-lg">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">{stat.name}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              <span className={cn(
                "text-xs font-bold",
                stat.change.startsWith('+') ? "text-green-400" : "text-gray-400"
              )}>
                {stat.change}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] text-gray-500 font-bold uppercase">{stat.status}</span>
            </div>
          </div>
        ))}
      </div>

      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderSubContent()}
      </motion.div>
    </div>
  );
}

function APMView() {
  return <SkywalkingApmView />;
}

function APMView_Deprecated() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'topology' | 'tracing' | 'jvm' | 'alerts'>('overview');

  const apmStats = [
    { name: 'Avg Response Time', value: '124ms', change: '-12ms', status: 'Good' },
    { name: 'Throughput (TPS)', value: '4.2k', change: '+150', status: 'Good' },
    { name: 'Error Rate', value: '0.04%', change: '+0.01%', status: 'Warning' },
    { name: 'SLA', value: '99.96%', change: 'Stable', status: 'Good' },
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'topology':
        return (
          <div className="bg-[#111114] border border-gray-800 rounded-xl p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative z-10 w-full max-w-4xl h-[400px] flex items-center justify-center">
              {/* Simplified SVG Topology Map */}
              <svg viewBox="0 0 800 400" className="w-full h-full">
                {/* Connections */}
                <path d="M150,200 L300,100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="animate-[pulse_2s_infinite]" />
                <path d="M150,200 L300,200" stroke="#3b82f6" strokeWidth="2" />
                <path d="M150,200 L300,300" stroke="#3b82f6" strokeWidth="2" />
                <path d="M300,100 L500,100" stroke="#10b981" strokeWidth="2" />
                <path d="M300,200 L500,200" stroke="#10b981" strokeWidth="2" />
                <path d="M300,300 L500,300" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
                
                {/* Nodes */}
                <g transform="translate(100, 175)">
                  <rect width="100" height="50" rx="8" fill="#1e1e24" stroke="#3b82f6" strokeWidth="2" />
                  <text x="50" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Gateway</text>
                </g>
                
                <g transform="translate(300, 75)">
                  <rect width="100" height="50" rx="8" fill="#1e1e24" stroke="#10b981" strokeWidth="2" />
                  <text x="50" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Auth-Svc</text>
                </g>
                <g transform="translate(300, 175)">
                  <rect width="100" height="50" rx="8" fill="#1e1e24" stroke="#10b981" strokeWidth="2" />
                  <text x="50" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Order-Svc</text>
                </g>
                <g transform="translate(300, 275)">
                  <rect width="100" height="50" rx="8" fill="#1e1e24" stroke="#ef4444" strokeWidth="2" />
                  <text x="50" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Payment-Svc</text>
                </g>
                
                <g transform="translate(500, 75)">
                  <circle cx="50" cy="25" r="25" fill="#1e1e24" stroke="#6366f1" strokeWidth="2" />
                  <text x="50" y="30" textAnchor="middle" fill="white" fontSize="10">Redis</text>
                </g>
                <g transform="translate(500, 175)">
                  <circle cx="50" cy="25" r="25" fill="#1e1e24" stroke="#6366f1" strokeWidth="2" />
                  <text x="50" y="30" textAnchor="middle" fill="white" fontSize="10">PostgreSQL</text>
                </g>
                <g transform="translate(500, 275)">
                  <circle cx="50" cy="25" r="25" fill="#1e1e24" stroke="#ef4444" strokeWidth="2" />
                  <text x="50" y="30" textAnchor="middle" fill="white" fontSize="10">External API</text>
                </g>
              </svg>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-8 w-full max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-400">Healthy Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-400">Error State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-400">Ingress Gateway</span>
              </div>
            </div>
          </div>
        );
      case 'tracing':
        return (
          <div className="space-y-6">
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Distributed Trace Explorer</h3>
                <div className="flex gap-2">
                  <input type="text" placeholder="Trace ID..." className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-1.5 text-xs w-64" />
                  <button className="bg-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold">Search</button>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'tr-9821', start: '10:15:01.234', duration: '450ms', services: 4, status: 'Success', path: 'GET /api/orders/list' },
                  { id: 'tr-9822', start: '10:15:02.110', duration: '1.2s', services: 6, status: 'Slow', path: 'POST /api/checkout' },
                  { id: 'tr-9823', start: '10:15:03.456', duration: '85ms', services: 2, status: 'Error', path: 'GET /api/user/profile' },
                ].map((trace) => (
                  <div key={trace.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-blue-400">{trace.id}</span>
                        <span className="text-sm font-bold text-gray-200">{trace.path}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">{trace.start}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          trace.status === 'Success' ? "bg-green-500/10 text-green-400" : 
                          trace.status === 'Slow' ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {trace.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">{trace.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">{trace.services} Services</span>
                      </div>
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full",
                          trace.status === 'Success' ? "bg-green-500" : 
                          trace.status === 'Slow' ? "bg-yellow-500" : "bg-red-500"
                        )} style={{ width: trace.status === 'Slow' ? '80%' : '30%' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'jvm':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">JVM Heap Memory</h3>
              <div className="h-[200px] flex items-end gap-2">
                {[45, 52, 48, 60, 55, 70, 65, 80, 40, 45, 50, 55].map((val, i) => (
                  <div key={i} className="flex-1 bg-blue-600/20 border-t-2 border-blue-500 relative group" style={{ height: `${val}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {val}% Used
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-gray-500">
                <span>10:00</span>
                <span>10:15</span>
              </div>
            </div>
            
            <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Garbage Collection (GC)</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Young Gen GC</p>
                    <p className="text-lg font-bold">12ms <span className="text-xs font-normal text-gray-500">avg</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Frequency</p>
                    <p className="text-lg font-bold text-green-400">Normal</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Old Gen GC (Full GC)</p>
                    <p className="text-lg font-bold">150ms <span className="text-xs font-normal text-gray-500">avg</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Last Run</p>
                    <p className="text-lg font-bold text-blue-400">2m ago</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Infrastructure Telemetry (Istio/Service Mesh)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Sidecar CPU</p>
                  <p className="text-2xl font-bold">0.12 <span className="text-xs font-normal text-gray-500">cores</span></p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Sidecar Memory</p>
                  <p className="text-2xl font-bold">45 <span className="text-xs font-normal text-gray-500">MB</span></p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Mesh Latency</p>
                  <p className="text-2xl font-bold text-green-400">2.4ms</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-6">
            <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active APM Alerts</h3>
                <button className="bg-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                  <Plus className="w-3 h-3" /> New Alert Rule
                </button>
              </div>
              <div className="divide-y divide-gray-800">
                {[
                  { id: 1, rule: 'High Error Rate (>1%)', service: 'Auth-Service', status: 'Active', severity: 'Critical', time: '10:12:05' },
                  { id: 2, rule: 'Slow Response (>2s)', service: 'Order-Service', status: 'Active', severity: 'High', time: '10:08:30' },
                  { id: 3, rule: 'JVM Heap Usage (>90%)', service: 'PROD-DB-01', status: 'Resolved', severity: 'Medium', time: '09:45:12' },
                ].map((alert) => (
                  <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        alert.severity === 'Critical' ? "bg-red-500/20 text-red-400" : 
                        alert.severity === 'High' ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-200">{alert.rule}</p>
                        <p className="text-xs text-gray-500">{alert.service} • {alert.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        alert.status === 'Active' ? "bg-red-500/10 text-red-400 animate-pulse" : "bg-gray-500/10 text-gray-400"
                      )}>
                        {alert.status}
                      </span>
                      <button className="p-1.5 hover:bg-gray-700 rounded transition-colors">
                        <Settings className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apmStats.map((stat, idx) => (
                <div key={idx} className="bg-[#111114] border border-gray-800 p-6 rounded-xl shadow-lg">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">{stat.name}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    <span className={cn(
                      "text-xs font-bold",
                      stat.change.startsWith('-') ? "text-green-400" : "text-red-400"
                    )}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      stat.status === 'Good' ? "bg-green-500" : "bg-orange-500"
                    )}></div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{stat.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Abnormal API Calls */}
              <div className="bg-[#111114] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-800 bg-orange-900/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="text-orange-500 w-5 h-5" />
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Abnormal API Frequency</h3>
                  </div>
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">Security Alert</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/50">
                      <tr className="text-gray-500 uppercase text-[10px] tracking-widest">
                        <th className="p-4">Service</th>
                        <th className="p-4">Endpoint</th>
                        <th className="p-4">Frequency</th>
                        <th className="p-4">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {[
                        { id: 1, time: '10:05:12', service: 'Order-Service', endpoint: '/api/v1/checkout', frequency: '450 req/sec', threshold: '100 req/sec', risk: 'High' },
                        { id: 2, time: '10:02:45', service: 'Auth-Service', endpoint: '/api/v1/login', frequency: '1.2k req/sec', threshold: '200 req/sec', risk: 'Critical' },
                        { id: 3, time: '09:58:30', service: 'Payment-Gate', endpoint: '/api/v1/refund', frequency: '85 req/sec', threshold: '10 req/sec', risk: 'High' },
                      ].map((call) => (
                        <tr key={call.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="p-4 text-blue-400 font-medium">{call.service}</td>
                          <td className="p-4 text-gray-300 font-mono text-xs">{call.endpoint}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-red-400 font-bold">{call.frequency}</span>
                              <span className="text-[10px] text-gray-500">Threshold: {call.threshold}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              call.risk === 'Critical' ? "bg-red-600 text-white" : "bg-orange-600 text-white"
                            )}>
                              {call.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unauthorized Cross-Service Access */}
              <div className="bg-[#111114] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-800 bg-red-900/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="text-red-500 w-5 h-5" />
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Unauthorized Service Access</h3>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Access Violation</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/50">
                      <tr className="text-gray-500 uppercase text-[10px] tracking-widest">
                        <th className="p-4">Source Service</th>
                        <th className="p-4">Target Resource</th>
                        <th className="p-4">Protocol</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {[
                        { id: 1, time: '10:04:22', source: 'Public-Frontend', target: 'Internal-DB-Admin', protocol: 'gRPC', action: 'Blocked' },
                        { id: 2, time: '09:55:10', source: 'Report-Service', target: 'User-Secrets-Vault', protocol: 'HTTP/2', action: 'Alerted' },
                      ].map((access) => (
                        <tr key={access.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="p-4 text-gray-200 font-medium">{access.source}</td>
                          <td className="p-4 text-red-400 font-bold">{access.target}</td>
                          <td className="p-4 text-gray-500 font-mono text-xs">{access.protocol}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              access.action === 'Blocked' ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                            )}>
                              {access.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/20 p-2 rounded-lg border border-purple-500/30">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Application Performance Monitoring (APM)</h2>
            <p className="text-xs text-gray-500 mt-1">Distributed Observability & Security Insight</p>
          </div>
        </div>
        
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
            { id: 'topology', label: 'Topology Map', icon: <Share2 className="w-3.5 h-3.5" /> },
            { id: 'tracing', label: 'Tracing', icon: <History className="w-3.5 h-3.5" /> },
            { id: 'jvm', label: 'JVM & Infra', icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: 'alerts', label: 'Alerting', icon: <Bell className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeSubTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderSubContent()}
      </motion.div>
    </div>
  );
}

// Extracted to separate component files: CorrelationSummaryView & CorrelationSettingView

function NetworkAccessControlView({ isReadOnly = false }: { isReadOnly?: boolean }) {
  return <NetworkAccessControlViewPF isReadOnly={isReadOnly} />;
}

function NetworkAccessControlViewOld({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const [activeDeviceType, setActiveDeviceType] = useState<'firewall' | 'switch' | 'endpoint'>('firewall');
  const [devices, setDevices] = useState([
    { id: '1', name: 'Main Campus Firewall', type: 'firewall', brand: 'Fortigate', model: 'FG-200F', method: 'SSH', status: 'connected' },
    { id: '2', name: 'Core Distribution SW', type: 'switch', brand: 'Cisco', model: 'Catalyst 9300', method: 'SSH', status: 'connected' }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-red-600/5 border border-red-500/20 p-6 rounded-3xl mb-8 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-white uppercase italic tracking-widest mb-2">Automated Incident Response Settings</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Configure how the SOAR engine interacts with infrastructure to isolate threats.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveDeviceType('firewall')}
            className={cn(
              "px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase italic tracking-widest transition-all flex items-center gap-2",
              activeDeviceType === 'firewall' ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/20" : "bg-gray-900/40 border-gray-800 text-gray-500"
            )}
          >
            <ShieldAlert size={14} /> Firewall
          </button>
          <button 
            onClick={() => setActiveDeviceType('switch')}
            className={cn(
              "px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase italic tracking-widest transition-all flex items-center gap-2",
              activeDeviceType === 'switch' ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/20" : "bg-gray-900/40 border-gray-800 text-gray-500"
            )}
          >
            <Network size={14} /> Switch
          </button>
          <button 
            onClick={() => setActiveDeviceType('endpoint')}
            className={cn(
              "px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase italic tracking-widest transition-all flex items-center gap-2",
              activeDeviceType === 'endpoint' ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/20" : "bg-gray-900/40 border-gray-800 text-gray-500"
            )}
          >
            <Monitor size={14} /> Endpoint
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-6">
            <h4 className="text-md font-black text-white uppercase italic tracking-tighter">Add New {activeDeviceType}</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Device Name</label>
                <input type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-red-500" placeholder="e.g. Core-FW-01" />
              </div>

              {(activeDeviceType === 'firewall' || activeDeviceType === 'switch') && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Brand</label>
                    <select className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-red-500 italic uppercase">
                      {activeDeviceType === 'firewall' ? (
                        <>
                          <option>Fortigate</option>
                          <option>Palo Alto</option>
                          <option>Cisco (Firepower)</option>
                          <option>Check Point</option>
                        </>
                      ) : (
                        <>
                          <option>Cisco (Catalyst/Nexus)</option>
                          <option>Aruba</option>
                          <option>Juniper</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Management IP / Port</label>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-red-400 outline-none focus:border-red-500" placeholder="0.0.0.0" />
                      <input type="text" className="w-20 bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-red-400 outline-none focus:border-red-500" placeholder="22" />
                    </div>
                  </div>
                </>
              )}

              {activeDeviceType === 'endpoint' && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-relaxed">Endpoint isolation requires the SEMOR Agent to be installed. Commands are delivered via secure WebSocket encrypted tunnel.</p>
                </div>
              )}

              <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 transition-all mt-4">
                Connect Infrastructure
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-[#111114] border border-gray-800 rounded-3xl overflow-hidden h-full">
            <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/20">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Connected Nodes & Command capability</h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase">{devices.filter(d => d.type === activeDeviceType).length} Assets Active</span>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
               {devices.filter(d => d.type === activeDeviceType).map(device => (
                 <div key={device.id} className="p-6 bg-black/40 border border-gray-800 rounded-2xl hover:border-red-500/30 transition-all relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                      {device.type === 'firewall' ? <ShieldCheck size={60} className="text-red-500" /> : <Network size={60} className="text-red-500" />}
                    </div>
                    
                    <div className="flex items-start justify-between mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                            {device.type === 'firewall' ? <ShieldAlert className="text-red-400" size={20} /> : <Network className="text-red-400" size={20} />}
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-white uppercase italic">{device.name}</h5>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{device.brand} {device.model}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest italic">{device.status}</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Action Capability</span>
                          <span className="text-[10px] font-mono text-red-400 uppercase font-bold">{device.method} / CLI</span>
                       </div>
                       <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">
                            {device.type === 'firewall' ? 'Add Deny-Policy for Source IP (ACL Update)' : 'Interface Shutdown / VLAN Quarantine'}
                          </p>
                       </div>
                       <div className="flex gap-2">
                         <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-[9px] font-black text-white uppercase tracking-widest rounded-lg transition-colors">Test SSH</button>
                         <button className="p-2 bg-gray-800 hover:bg-red-600/20 rounded-lg text-gray-600 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                         </button>
                       </div>
                    </div>
                 </div>
               ))}

               <div className="p-6 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                    <Plus className="text-gray-500" size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Connect Additional Enforcement Node</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
           <Zap size={100} className="text-blue-500" />
         </div>
         <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <Lock className="text-blue-400" size={20} />
               </div>
               <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">SOAR Auto-Quarantine Policy</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-5 bg-black/40 border border-gray-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-400 uppercase italic">Infected Host Level</span>
                     <span className="text-[9px] font-bold text-red-500 uppercase">Critical</span>
                  </div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest italic">If Malware confirmed, isolation is AUTOMATIC.</p>
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-red-500"></div>
                  </div>
               </div>
               <div className="p-5 bg-black/40 border border-gray-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-400 uppercase italic">External Attacker</span>
                     <span className="text-[9px] font-bold text-orange-500 uppercase">Warning</span>
                  </div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest italic">Manual Block Trigger on Firewall (One-Click).</p>
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-orange-500"></div>
                  </div>
               </div>
               <div className="flex items-center">
                  <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3">
                    <Zap size={16} className="animate-pulse" />
                    Update Global Policy
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function DataCollectionSettingView({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const [selectedModes, setSelectedModes] = useState<string[]>(['syslog']);
  const [sources, setSources] = useState<Array<{ id: string; sourceIp: string; port: number; protocol: 'udp' | 'tcp' | 'tls'; description?: string; status: 'active' | 'standby' }>>([
    { id: 'src-1', sourceIp: '192.168.1.0/24', port: 514, protocol: 'udp', description: 'DMZ 核心交換器與邊界閘道日誌', status: 'active' },
    { id: 'src-2', sourceIp: '10.0.0.0/16', port: 5140, protocol: 'tcp', description: '內部應用微服務與 API Gateway', status: 'active' },
    { id: 'src-3', sourceIp: '172.16.10.50', port: 6514, protocol: 'tls', description: '核心主幹安全防火牆日誌', status: 'active' }
  ]);
  const [newIp, setNewIp] = useState('');
  const [newPort, setNewPort] = useState('514');
  const [newProtocol, setNewProtocol] = useState<'udp' | 'tcp' | 'tls'>('udp');
  const [newDesc, setNewDesc] = useState('');
  const [winrmEndpoint, setWinrmEndpoint] = useState('https://*:5986/wsman');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    siemService.getDataCollectionSettings()
      .then(res => {
        if (res?.collection) {
          if (res.collection.modes) setSelectedModes(res.collection.modes);
          if (res.collection.syslog?.sources) setSources(res.collection.syslog.sources);
          if (res.collection.windowsEventLog?.winrmEndpoint) setWinrmEndpoint(res.collection.windowsEventLog.winrmEndpoint);
        }
      })
      .catch(err => console.warn('Using default collection settings', err));
  }, []);

  const toggleMode = (mode: string) => {
    if (isReadOnly) return;
    setSelectedModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleAddSource = async () => {
    if (!newIp.trim()) {
      alert('請輸入來源 IP 或網段位址 (如: 192.168.1.0/24)');
      return;
    }
    try {
      const res = await siemService.addDataCollectionSource({
        sourceIp: newIp.trim(),
        port: Number(newPort) || 514,
        protocol: newProtocol,
        description: newDesc.trim() || '手動註冊資料採集端點'
      });
      if (res?.source) {
        setSources(prev => [...prev, res.source]);
        setNewIp('');
        setNewDesc('');
        setStatusBanner(res.message || '已成功新增資料接收端點！');
        setTimeout(() => setStatusBanner(null), 3500);
      }
    } catch (err) {
      alert('新增接收端點失敗');
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await siemService.deleteDataCollectionSource(id);
      setSources(prev => prev.filter(s => s.id !== id));
      setStatusBanner(`端點 ${id} 已成功移除`);
      setTimeout(() => setStatusBanner(null), 3000);
    } catch (err) {
      alert('刪除失敗');
    }
  };

  const handleDeployConfig = async () => {
    if (isReadOnly) return;
    try {
      await siemService.updateDataCollectionSettings({
        modes: selectedModes,
        syslog: { sources },
        windowsEventLog: {
          method: 'agent',
          winrmEndpoint,
          winrmPort: 5986,
          status: 'active'
        },
        networkFlow: {
          activeInterfaces: ['ens192', 'ens32', 'eth0'],
          mirrorSource: 'ens192',
          promiscuousMode: true,
          erspanEnabled: true
        }
      });
      setStatusBanner('資料採集拓樸配置已成功部署至 Ingestion Pipeline 守護程序！');
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner('已完成本地設定 (備援模式)');
      setTimeout(() => setStatusBanner(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {statusBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-between text-xs font-bold font-mono">
          <span>{statusBanner}</span>
          <button onClick={() => setStatusBanner(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-3xl mb-8">
        <h4 className="text-sm font-black text-white uppercase italic tracking-widest mb-4">選擇資料採集模式 (Select Data Collection Modes)</h4>
        <div className="flex flex-wrap gap-4">
          {[
            { id: 'syslog', label: 'Syslog 日誌採集 (Syslog Collection)', icon: FileText },
            { id: 'eventlog', label: 'Windows 事件日誌 (Event Log)', icon: Activity },
            { id: 'flow', label: '網路流量鏡像 (Network Flow)', icon: Network },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => toggleMode(mode.id)}
              className={cn(
                "px-6 py-3 rounded-2xl border transition-all flex items-center gap-3 font-black uppercase text-[10px] tracking-widest italic",
                selectedModes.includes(mode.id)
                  ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20"
                  : "bg-gray-900/40 border-gray-800 text-gray-500 hover:border-gray-700"
              )}
            >
              <mode.icon size={16} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Syslog Section */}
        {selectedModes.includes('syslog') && (
          <div className="p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <FileText size={80} className="text-blue-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <FileText className="text-blue-400" size={20} />
              </div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Syslog 接收伺服器配置 (Syslog Server Configuration)</h4>
            </div>

            {/* List of active syslog receivers */}
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">目前就緒之接收端點 ({sources.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sources.map(s => (
                  <div key={s.id} className="p-4 bg-black/40 border border-gray-800 rounded-2xl flex items-center justify-between group/src hover:border-blue-500/40 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{s.sourceIp}:{s.port}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">{s.protocol}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{s.description || 'Syslog Receiver'}</p>
                    </div>
                    {!isReadOnly && (
                      <button 
                        onClick={() => handleDeleteSource(s.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg opacity-0 group-hover/src:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-800">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">來源 IP / 網段 (Source IP / Subnet)</label>
                <input 
                  type="text" 
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="例如: 192.168.1.0/24" 
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-blue-400 outline-none focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">接聽連接埠 (Listening Port)</label>
                <input 
                  type="number" 
                  value={newPort}
                  onChange={(e) => setNewPort(e.target.value)}
                  defaultValue="514" 
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-blue-400 outline-none focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">通訊協定 (Protocol)</label>
                <select 
                  value={newProtocol}
                  onChange={(e) => setNewProtocol(e.target.value as any)}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-blue-500 transition-all italic tracking-tighter uppercase"
                >
                  <option value="udp">UDP (建議使用)</option>
                  <option value="tcp">TCP</option>
                  <option value="tls">TLS / 安全加密 TCP</option>
                </select>
              </div>
              <div className="flex items-end">
                {!isReadOnly && (
                  <button 
                    onClick={handleAddSource}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                  >
                    新增接收端點 (Add Receiver)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event Log Section */}
        {selectedModes.includes('eventlog') && (
          <div className="p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Monitor size={80} className="text-purple-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                <Activity className="text-purple-400" size={20} />
              </div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Windows 事件日誌收集 (Windows Event Log Collection)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-black/40 border border-gray-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest">採集方式 (Collection Method)</h5>
                  <span className="text-[9px] font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/20 uppercase">WinRM 服務已啟用</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-4 bg-blue-600/10 border border-blue-500/40 text-blue-400 rounded-xl text-[10px] font-black uppercase italic tracking-wider">代理端模式 (Agent-Based)</button>
                  <button className="py-4 bg-gray-900 border border-gray-800 text-gray-500 rounded-xl text-[10px] font-black uppercase italic tracking-wider hover:border-gray-600">無代理模式 (Agentless)</button>
                </div>
              </div>

              <div className="p-6 bg-black/40 border border-gray-800 rounded-2xl space-y-4">
                 <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest">無代理端配置 (WMS / WinRM)</h5>
                 <div className="space-y-4">
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">WS-Management 服務端點位址</p>
                      <input 
                        type="text" 
                        value={winrmEndpoint}
                        onChange={(e) => setWinrmEndpoint(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-[10px] font-mono text-gray-400 outline-none focus:border-purple-500/50"
                      />
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                     <span className="text-[9px] font-black text-blue-500 uppercase">Port 5986 監聽器運作中 (Listener Active)</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Flow Section */}
        {selectedModes.includes('flow') && (
          <div className="p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Network size={80} className="text-green-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                <Network className="text-green-400" size={20} />
              </div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">實體網路埠流量鏡像 (Physical Port Mirroring / Flow)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">已偵測到的 Linux 網路介面卡 (Detected Interfaces)</h5>
                  <div className="space-y-2">
                    {['ens192', 'ens32', 'eth0', 'lo'].map(iface => (
                      <div key={iface} className="p-4 bg-black/40 border border-gray-800 rounded-2xl flex items-center justify-between hover:border-green-500/30 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                             <Binary size={14} className="text-gray-500 group-hover:text-green-500" />
                           </div>
                           <span className="text-xs font-black text-white uppercase italic">{iface}</span>
                        </div>
                        {iface.startsWith('ens') ? (
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-green-500 uppercase tracking-widest italic">鏡像來源 (Mirror Source)</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-700 uppercase">待命 (Standby)</span>
                        )}
                      </div>
                    ))}
                  </div>
               </div>

               <div className="p-8 bg-black/40 border border-dashed border-gray-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/5 rounded-2xl flex items-center justify-center border border-green-500/10">
                    <Zap className="text-green-500" size={28} />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-black text-white uppercase italic tracking-widest">介面模式：混雜模式 (Promiscuous Mode)</h6>
                    <p className="text-[10px] text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed uppercase font-bold tracking-widest italic">請確認實體交換器 (Switch) 已完成 RSPAN/ERSPAN 配置，將網路流量導向至所選之監聽介面。</p>
                  </div>
                  <button 
                    onClick={handleDeployConfig}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    套用流量鏡像配置 (Apply Config)
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t border-gray-800">
         <button 
           onClick={() => setSelectedModes(['syslog'])}
           className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
         >
           重置預設 (Reset)
         </button>
         <button 
           onClick={handleDeployConfig}
           className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 transition-all"
         >
           部署採集配置 (Deploy Config)
         </button>
      </div>
    </div>
  );
}

function Stage1InfraView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-900/40 border border-gray-800 rounded-2xl space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase italic tracking-widest">
              <Key size={18} className="text-blue-500" />
              SAML 2.0 / SSO
            </h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Provider Status</p>
                <div className="flex items-center gap-2 text-green-400 text-xs font-black">
                  <CheckCircle2 size={14} /> Azure AD Connected
                </div>
              </div>
              <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-black uppercase text-gray-300 rounded-lg transition-all">Configure Identity Provider</button>
            </div>
          </div>
          
          <div className="p-6 bg-gray-900/40 border border-gray-800 rounded-2xl space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase italic tracking-widest">
              <Users size={18} className="text-purple-500" />
              RBAC Roles
            </h4>
            <div className="space-y-3">
              {['Administrator', 'Tier 2 Analyst', 'IT Operations', 'Guest (ReadOnly)'].map(role => (
                <div key={role} className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-xl hover:border-purple-500/30 transition-all cursor-pointer">
                  <span className="text-[11px] font-black text-gray-400 uppercase italic">{role}</span>
                  <Edit3 size={12} className="text-gray-600" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 p-8 bg-black/20 border border-dashed border-gray-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
            <Cpu className="text-blue-500 w-10 h-10 animate-pulse" />
          </div>
          <div>
            <h5 className="text-lg font-black text-white uppercase italic tracking-tight">XSOAR Engine Deployment</h5>
            <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">Engines act as secure proxies between the cloud platform and your on-premise infrastructure. Use these to orchestrate internal firewalls, local SIEMs, and air-gapped zones.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Download New Engine (Linux/K8s)</button>
            <button className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">View All Proxies (3 Active)</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stage2IntegrationsView() {
  const integrations = [
    { name: 'Palo Alto Panorama', cat: 'Network Security', status: 'Active', icon: Shield },
    { name: 'CrowdStrike Falcon', cat: 'EDR', status: 'Active', icon: Activity },
    { name: 'VirusTotal v3', cat: 'Threat Intel', status: 'Warning', icon: Globe },
    { name: 'Microsoft O365', cat: 'Email/Lighthouse', status: 'Disconnected', icon: Mail },
    { name: 'Fortigate Firewall', cat: 'Network Security', status: 'Active', icon: ShieldAlert },
    { name: 'Splunk ES', cat: 'SIEM/Logging', status: 'Active', icon: Database },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            placeholder="Search Marketplace Integrations..." 
            className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all italic"
          />
        </div>
        <button className="px-6 py-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/30 transition-all flex items-center gap-2">
          <PackagePlus size={16} />
          Marketplace Store
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item, idx) => (
          <div key={idx} className="p-6 bg-gray-900/40 border border-gray-800 rounded-3xl hover:border-blue-500/40 transition-all group cursor-pointer relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
                <item.icon size={24} className="text-blue-400" />
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                item.status === 'Active' ? "bg-green-500/20 text-green-400" : 
                item.status === 'Warning' ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-500"
              )}>{item.status}</div>
            </div>
            <h5 className="text-white font-black text-sm uppercase italic tracking-tight">{item.name}</h5>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 mb-6">{item.cat}</p>
            
            <div className="pt-6 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-600 uppercase">API Instance: v1.02</span>
              <Settings size={14} className="text-gray-500 hover:text-white transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stage3MappingView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Classification Rules</h4>
          <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Add Classifier</button>
        </div>
        <div className="space-y-4">
          {[
            { type: 'Phishing Alert', source: 'O365 Defender', match: 'Subject contains "Urgent"' },
            { type: 'Malware Detected', source: 'CrowdStrike', match: 'Behavior_Score > 80' },
            { type: 'Brute Force', source: 'Okta', match: 'Failed_Logins > 10' }
          ].map((rule, i) => (
            <div key={i} className="p-4 bg-gray-900/40 border border-gray-800 rounded-2xl flex items-center justify-between hover:border-gray-700 transition-all">
               <div className="space-y-1">
                 <p className="text-xs font-black text-white uppercase tracking-tight">{rule.type}</p>
                 <p className="text-[10px] text-gray-500 font-bold uppercase">{rule.source} // {rule.match}</p>
               </div>
               <ArrowRight size={14} className="text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black/20 border border-gray-800 rounded-3xl p-8 space-y-6">
        <h4 className="text-sm font-black text-white uppercase italic tracking-widest border-b border-gray-800 pb-4">Mapping: External → XSOAR</h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase italic tracking-widest">Mapping incoming JSON payload fields to standard case schema</p>
        
        <div className="space-y-4">
          {[
            { ext: 'source_ip', internal: 'srcip', transform: 'None' },
            { ext: 'target_user_email', internal: 'email', transform: 'Extract Domain' },
            { ext: 'threat_indicator_hash', internal: 'sha256', transform: 'To Uppercase' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-4 group">
               <input disabled value={m.ext} className="flex-1 bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-[11px] font-mono text-gray-400" />
               <ArrowRightLeft size={14} className="text-blue-500" />
               <select className="flex-1 bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-[11px] font-mono text-blue-400 outline-none">
                 <option>{m.internal}</option>
               </select>
               <div className="px-3 py-1 bg-gray-800 rounded text-[9px] font-black text-gray-500 uppercase italic whitespace-nowrap">{m.transform}</div>
            </div>
          ))}
        </div>
        
        <button className="w-full py-3 bg-blue-600/10 border border-dashed border-blue-500/30 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-600/20 transition-all">
          Trigger Incoming Payload Test (Dry Run)
        </button>
      </div>
    </div>
  );
}

function Stage4PlaybookView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="p-6 bg-gray-900/40 border border-gray-800 rounded-2xl">
             <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">Active Playbooks</h5>
             <div className="space-y-2">
               {['Automated Phishing Response', 'Malware Isolation v2', 'Credential Leak Check', 'AWS S3 Public Audit'].map(p => (
                 <div key={p} className="p-3 bg-black/40 border border-gray-800 rounded-xl hover:border-blue-500/30 transition-all cursor-pointer group">
                   <p className="text-[11px] font-bold text-gray-400 group-hover:text-blue-400 transition-colors uppercase italic">{p}</p>
                 </div>
               ))}
             </div>
           </div>
           
           <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
             <div className="flex items-center justify-between mb-4">
               <h5 className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic">Utility Scripts</h5>
               <Plus size={12} className="text-purple-400" />
             </div>
             <p className="text-[9px] text-gray-500 font-bold uppercase mb-4 leading-relaxed">Python 3.10 / PowerShell Core available for custom orchestration logic.</p>
             <div className="space-y-2">
               {['GetIPReputation', 'IsolateEndpoint', 'SlackNotify', 'SearchVirusTotal'].map(s => (
                 <div key={s} className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-all cursor-default">
                   <span className="text-[10px] font-mono text-gray-400">{s}.py</span>
                   <Terminal size={10} className="text-gray-600" />
                 </div>
               ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-3 bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-3xl min-h-[500px] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          <Workflow size={64} className="text-blue-500/20 mb-6 group-hover:scale-110 transition-transform" />
          <h5 className="text-xl font-black text-white uppercase italic tracking-tighter">Drag-and-Drop Playbook Designer</h5>
          <p className="text-xs text-gray-500 mt-4 max-w-sm leading-relaxed uppercase font-bold tracking-widest">Connect integrations, conditional logic, and scripts into a seamless automated response chain.</p>
          <div className="mt-8 flex gap-4">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20">Launch Visual Editor</button>
            <button className="px-8 py-3 bg-gray-800 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Import YAML / JSON</button>
          </div>
          
          {/* Visual fluff for grid background */}
          <div className="absolute inset-0 z-[-1] opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
      </div>
    </div>
  );
}

function Stage5TIMView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Feeds', value: '42', icon: Rss, color: 'text-blue-400' },
          { label: 'Total Indicators', value: '1,402,291', icon: Target, color: 'text-purple-400' },
          { label: 'High Risk IoCs', value: '8,212', icon: Skull, color: 'text-red-400' },
          { label: 'Avg MTTR', value: '14m 22s', icon: Zap, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-gray-900/40 border border-gray-800 rounded-2xl relative overflow-hidden group">
            <div className={cn("absolute -right-4 -bottom-4 opacity-5", stat.color)}>
              <stat.icon size={80} />
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic mb-2">{stat.label}</p>
            <p className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</p>
            <div className="mt-4 flex items-center gap-1 text-[9px] text-green-400 font-bold uppercase">
              <TrendingUp size={12} /> +12% from last week
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Feed Health & Last Sync</h4>
            <RefreshCw size={16} className="text-blue-500 animate-spin-slow" />
          </div>
          <div className="space-y-3">
             {[
               { name: 'AbuseIPDB Full List', type: 'IP', status: 'Healthy', time: '2 mins ago' },
               { name: 'Mandiant Threat Intelligence', type: 'STIX/IoC', status: 'Healthy', time: '14 mins ago' },
               { name: 'Internal HoneyNet Feed', type: 'Custom', status: 'Warning', time: '4 hours ago' },
               { name: 'AlienVault OTX', type: 'Pulses', status: 'Healthy', time: '1 min ago' },
             ].map((f, i) => (
               <div key={i} className="p-4 bg-black/40 border border-gray-800 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:bg-blue-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-tight">{f.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{f.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[10px] font-black uppercase mb-1", f.status === 'Healthy' ? "text-green-500" : "text-yellow-500")}>{f.status}</p>
                    <p className="text-[9px] font-mono text-gray-600">{f.time}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="space-y-6">
           <div className="p-8 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl relative overflow-hidden">
             <h5 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-6 italic">Orchestration KPI</h5>
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2">
                     <span>Auto-Remediation Rate</span>
                     <span className="text-blue-400 italic">88%</span>
                   </div>
                   <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 rounded-full" style={{ width: '88%' }} />
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2">
                     <span>Threat Feed Quality</span>
                     <span className="text-purple-400 italic">94%</span>
                   </div>
                   <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 rounded-full" style={{ width: '94%' }} />
                   </div>
                </div>
             </div>
             <button className="w-full mt-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all italic">
               {isZh ? '產出高階主管資安 PDF 報告' : 'Generate Executive PDF Report'}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// Note: The Overview dashboard has been fully refactored and modularized into ./components/overview/OverviewDashboardView.tsx
function DashboardView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return <OverviewDashboardView setActiveTab={setActiveTab} />;
}

function StatCard({ title, value, change, icon, color = "text-blue-400" }: { title: string, value: string, change: string, icon: React.ReactNode, color?: string }) {
  return (
    <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-900 rounded-lg">{icon}</div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full bg-gray-900", color.replace('text', 'bg').replace('400', '400/10'))}>
          {change}
        </span>
      </div>
      <h4 className="text-gray-400 text-sm font-medium">{title}</h4>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function IncidentRow({ id, severity, source, module, status, time }: any) {
  const sevColor = severity === 'Critical' ? 'text-red-500' : severity === 'High' ? 'text-orange-500' : 'text-blue-500';
  return (
    <tr className="hover:bg-gray-800/50 transition-colors cursor-pointer">
      <td className="px-6 py-4 text-sm font-mono text-blue-400">{id}</td>
      <td className="px-6 py-4">
        <span className={cn("text-xs font-bold uppercase", sevColor)}>{severity}</span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-300">{source}</td>
      <td className="px-6 py-4 text-sm text-gray-400">{module}</td>
      <td className="px-6 py-4">
        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{status}</span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{time}</td>
    </tr>
  );
}

function ModuleDetailView({ module }: { module: ModuleInfo }) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400">
              {getIcon(module.icon)}
            </div>
            <h2 className="text-3xl font-bold">{t(`modules.${module.id}`, { defaultValue: module.name })}</h2>
          </div>
          <p className="text-gray-400 max-w-2xl">{isZh ? (module.id === 'industrial' ? 'OT/IoT 工業控制安全：工業通訊協定深度解析 (Modbus, S7) 與全封包側錄。' : module.description) : module.description}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Open Web UI
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
            Configure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Engine Health & Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {module.engines.map(engine => (
                <div key={engine} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-medium">{engine}</span>
                  </div>
                  <span className="text-xs text-gray-500">v2.4.1</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-4 hover:bg-gray-800/30 rounded-lg transition-colors border-l-2 border-blue-500">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Log ingestion spike detected</p>
                    <p className="text-xs text-gray-500 mt-1">Source: suricata-sensor-01 | 12:45:00 UTC</p>
                  </div>
                  <button className="text-xs text-blue-400 hover:underline">Details</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111114] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Module Resources</h3>
            <div className="space-y-6">
              <ResourceGauge label="CPU Usage" value={45} />
              <ResourceGauge label="Memory Usage" value={72} />
              <ResourceGauge label="Disk I/O" value={12} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Integration Ready</h3>
            <p className="text-sm text-gray-400 mb-4">This module is fully integrated with n8n SOAR playbooks and MISP threat feeds.</p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              View Playbooks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceGauge({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function LicenseView({ license }: { license: LicenseInfo }) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const isModuleEnabled = (moduleId: string, licenseType: string) => {
    const communityModules = ['discovery', 'flow', 'endpoint', 'case-management', 'gateway', 'fim'];
    const professionalModules = [...communityModules, 'intel', 'malware-analysis', 'vulnerability'];
    const enterpriseModules = [...professionalModules, 'soar', 'industrial', 'apm', 'ai-analyst', 'honeypot-map'];

    if (licenseType === 'Enterprise') return enterpriseModules.includes(moduleId);
    if (licenseType === 'Professional') return professionalModules.includes(moduleId);
    return communityModules.includes(moduleId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">License Management</h2>
        <p className="text-gray-400">Manage your platform subscription and node limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Status</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xl font-bold text-green-400">{license.status}</span>
          </div>
        </div>
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Plan Type</p>
          <span className="text-xl font-bold text-blue-400">{license.type}</span>
        </div>
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Expiry Date</p>
          <span className="text-xl font-bold text-white">{license.expiryDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#111114] border border-gray-800 rounded-xl p-8">
            <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
              <Layers className="text-blue-400" size={20} />
              Module Entitlements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODULES.map((module) => {
                const enabled = isModuleEnabled(module.id, license.type);
                return (
                  <div 
                    key={module.id} 
                    className={cn(
                      "p-4 rounded-xl border transition-all flex items-center justify-between",
                      enabled 
                        ? "bg-gray-900/50 border-gray-800 hover:border-blue-500/30" 
                        : "bg-black/20 border-gray-900 opacity-50 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        enabled ? "bg-blue-600/10 text-blue-400" : "bg-gray-800 text-gray-600"
                      )}>
                        {getIcon(module.icon)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-200">
                          {t(`modules.${module.id}`, { defaultValue: module.name.replace('SEMOR ', '') })}
                        </div>
                        <div className="text-[10px] text-gray-500">{module.category}</div>
                      </div>
                    </div>
                    <div>
                      {enabled ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                          <CheckCircle2 size={12} />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase">
                          <X size={12} />
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#111114] border border-gray-800 rounded-xl p-8">
            <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
              <Monitor className="text-purple-400" size={20} />
              Node Utilization
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-5xl font-bold text-white">{license.currentNodes}</p>
                  <p className="text-gray-500 text-xs font-bold uppercase mt-1">Active Nodes</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-400">/ {license.maxNodes}</p>
                  <p className="text-gray-500 text-xs font-bold uppercase mt-1">Total Capacity</p>
                </div>
              </div>
              <div className="h-4 bg-gray-900 rounded-full overflow-hidden p-1 border border-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${(license.currentNodes / license.maxNodes) * 100}%` }}
                ></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-gray-500">Master Nodes</span>
                  <span className="text-white">1 / 1</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-gray-500">Worker Nodes</span>
                  <span className="text-white">4 / 8</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-gray-500">Flow Sensors</span>
                  <span className="text-white">12 / 20</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-gray-500">Endpoint Agents</span>
                  <span className="text-white">108 / 250</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 italic leading-relaxed">
                Usage is calculated across Master, Worker, Flow, and Endpoint agents. Exceeding limits may result in data ingestion throttling.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              <RefreshCw size={18} />
              Upgrade License
            </button>
            <button className="w-full px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <Download size={18} />
              Download Audit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getIcon(name: string) {
  switch (name) {
    case 'Shield': return <Shield />;
    case 'Database': return <Database />;
    case 'Activity': return <Activity />;
    case 'Monitor': return <Monitor />;
    case 'Brain': return <Brain />;
    case 'Zap': return <Zap />;
    case 'Globe': return <Globe />;
    case 'Target': return <Target />;
    case 'BarChart3': return <BarChart3 />;
    case 'UserCheck': return <UserCheck />;
    case 'Search': return <Search />;
    case 'ShieldAlert': return <ShieldAlert />;
    case 'Factory': return <Factory />;
    case 'Bug': return <Bug />;
    case 'Box': return <Box />;
    case 'Bot': return <Bot />;
    case 'Map': return <MapIcon />;
    case 'ShieldCheck': return <ShieldCheck />;
    case 'Layers': return <Layers />;
    default: return <Shield />;
  }
}

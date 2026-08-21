import React, { useState } from 'react';
import { 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Server, 
  Zap, 
  Radio, 
  Settings, 
  Sliders, 
  Plus, 
  FileText, 
  Check, 
  X, 
  Lock, 
  ExternalLink,
  ChevronRight,
  HardDrive,
  Cpu,
  Layers,
  Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export interface SignatureDB {
  id: string;
  name: string;
  category: 'threat_ids' | 'malware' | 'network' | 'fingerprint' | 'vulnerability' | 'threat_intel';
  categoryLabelZh: string;
  descriptionZh: string;
  version: string;
  latestVersion: string;
  lastUpdated: string;
  autoUpdate: boolean;
  status: 'up_to_date' | 'update_available' | 'updating' | 'stable' | 'error';
  ruleCount: number;
  sourceUrl: string;
}

interface SignatureUpdateSettingsViewProps {
  isReadOnly?: boolean;
}

export default function SignatureUpdateSettingsView({ isReadOnly = false }: SignatureUpdateSettingsViewProps) {
  const { i18n } = useTranslation();
  const isZh = !i18n.language || i18n.language.startsWith('zh');

  const [dbSettings, setDbSettings] = useState<SignatureDB[]>([
    { 
      id: 'zeek', 
      name: 'Zeek (Bro) 深度協定解析規則庫', 
      category: 'network',
      categoryLabelZh: '網路協定解析',
      descriptionZh: '用於 L7 協定深度特徵解析、DNS/SSL/HTTP 異常行為與元數據萃取引擎。',
      version: '2026.04.20', 
      latestVersion: '2026.04.20',
      lastUpdated: '2026-08-14 02:00:12', 
      autoUpdate: true, 
      status: 'up_to_date',
      ruleCount: 14820,
      sourceUrl: 'https://updates.zeek.org/signatures/release-v6'
    },
    { 
      id: 'suricata', 
      name: 'Suricata IDS/IPS 入侵防禦規則庫', 
      category: 'threat_ids',
      categoryLabelZh: '入侵偵測與防禦',
      descriptionZh: '包含最新零日漏洞 Exploit 阻斷、CVE 惡意特徵與異常封包檢測規則。',
      version: '2026.08.10', 
      latestVersion: '2026.08.14',
      lastUpdated: '2026-08-10 03:30:45', 
      autoUpdate: true, 
      status: 'update_available',
      ruleCount: 68420,
      sourceUrl: 'https://rules.emergingthreats.net/open/suricata-6.0/'
    },
    { 
      id: 'yara', 
      name: 'YARA 惡意程式與威脅特徵碼 (Malware Signatures)', 
      category: 'malware',
      categoryLabelZh: '惡意程式識別',
      descriptionZh: '針對二進位檔案、記憶體載入、惡意巨集腳本與勒索病毒之 YARA 規則庫。',
      version: '2026.08.12', 
      latestVersion: '2026.08.12',
      lastUpdated: '2026-08-12 12:15:30', 
      autoUpdate: true, 
      status: 'up_to_date',
      ruleCount: 35190,
      sourceUrl: 'https://yara-rules.semor-cyber.internal/rules.git'
    },
    { 
      id: 'et', 
      name: 'Emerging Threats (ET Pro/Open) 威脅情資規則', 
      category: 'threat_intel',
      categoryLabelZh: '威脅情資規則',
      descriptionZh: '即時關聯全網 C2 殭屍網路、惡意 IP 節點與暗網滲透工具特徵。',
      version: '2026.08.11', 
      latestVersion: '2026.08.15',
      lastUpdated: '2026-08-11 23:50:18', 
      autoUpdate: true, 
      status: 'update_available',
      ruleCount: 94100,
      sourceUrl: 'https://rules.emergingthreats.net/pro/rules/'
    },
    { 
      id: 'snort', 
      name: 'Snort 3.0 社群與原廠核心規則庫', 
      category: 'threat_ids',
      categoryLabelZh: '入侵偵測系統',
      descriptionZh: 'Cisco Talos 認證之網路層封包攻擊偵測與協定合規性檢查特徵。',
      version: '2026.08.08', 
      latestVersion: '2026.08.08',
      lastUpdated: '2026-08-08 01:45:00', 
      autoUpdate: true, 
      status: 'up_to_date',
      ruleCount: 42150,
      sourceUrl: 'https://snort.org/downloads/community/rules.tar.gz'
    },
    { 
      id: 'fingerbank', 
      name: 'Fingerbank 終端設備與 IoT 指紋識別庫', 
      category: 'fingerprint',
      categoryLabelZh: '資產指紋畫像',
      descriptionZh: 'DHCP Option55、User-Agent、mDNS 與 MAC OUI 設備識別指紋庫。',
      version: '2026.07.30', 
      latestVersion: '2026.07.30',
      lastUpdated: '2026-07-30 10:20:00', 
      autoUpdate: false, 
      status: 'stable',
      ruleCount: 72401,
      sourceUrl: 'https://api.fingerbank.org/v2/download'
    },
    { 
      id: 'opencve', 
      name: 'NVD / OpenCVE 國家弱點資料庫快照', 
      category: 'vulnerability',
      categoryLabelZh: '漏洞情資資料庫',
      descriptionZh: '同步 NIST NVD、MITRE CVE 與 EPSS 漏洞威脅利用率動態評分資料庫。',
      version: '2026.08.14', 
      latestVersion: '2026.08.14',
      lastUpdated: '2026-08-14 06:00:00', 
      autoUpdate: true, 
      status: 'up_to_date',
      ruleCount: 248600,
      sourceUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0'
    },
    { 
      id: 'openwips', 
      name: 'OpenWIPS-NG 無線網路防禦特徵庫', 
      category: 'network',
      categoryLabelZh: '無線安全防禦',
      descriptionZh: '偵測 Rogue AP、Evil Twin 偽冒基地台與 Wi-Fi 解除認證攻擊。',
      version: '2026.05.10', 
      latestVersion: '2026.05.10',
      lastUpdated: '2026-05-10 09:00:00', 
      autoUpdate: false, 
      status: 'stable',
      ruleCount: 3120,
      sourceUrl: 'https://openwips-ng.org/sigs/current.xml'
    }
  ]);

  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'threat_ids' | 'malware' | 'network' | 'fingerprint' | 'vulnerability'>('all');

  // Auto-Update Global Schedule Settings
  const [scheduleMode, setScheduleMode] = useState<'daily' | 'hourly' | 'weekly' | 'custom'>('daily');
  const [dailyTime, setDailyTime] = useState('03:00');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyAddress, setProxyAddress] = useState('http://proxy.corp.internal:8080');
  const [autoApplyAfterDownload, setAutoApplyAfterDownload] = useState(true);
  const [backupBeforeUpdate, setBackupBeforeUpdate] = useState(true);

  // Custom Signature Modal State
  const [showAddSignatureModal, setShowAddSignatureModal] = useState(false);
  const [newSignature, setNewSignature] = useState({
    name: '',
    type: 'snort',
    content: ''
  });

  // Offline Package Upload State
  const [isUploadingPackage, setIsUploadingPackage] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Toggle Auto Update
  const toggleAutoUpdate = (id: string) => {
    if (isReadOnly) return;
    setDbSettings(prev => prev.map(db => db.id === id ? { ...db, autoUpdate: !db.autoUpdate } : db));
  };

  // Update Single Database
  const updateNow = (id: string) => {
    if (isReadOnly) return;
    setDbSettings(prev => prev.map(db => db.id === id ? { ...db, status: 'updating' } : db));
    
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];

      setDbSettings(prev => prev.map(db => db.id === id ? { 
        ...db, 
        status: 'up_to_date', 
        version: dateStr.replace(/-/g, '.'),
        latestVersion: dateStr.replace(/-/g, '.'),
        lastUpdated: `${dateStr} ${timeStr}`,
        ruleCount: db.ruleCount + Math.floor(Math.random() * 45) + 5
      } : db));
    }, 1800);
  };

  // Update All Databases
  const handleUpdateAll = () => {
    if (isReadOnly) return;
    setIsUpdatingAll(true);
    setDbSettings(prev => prev.map(db => ({ ...db, status: 'updating' })));

    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];

      setDbSettings(prev => prev.map(db => ({ 
        ...db, 
        status: 'up_to_date',
        version: dateStr.replace(/-/g, '.'),
        latestVersion: dateStr.replace(/-/g, '.'),
        lastUpdated: `${dateStr} ${timeStr}`,
        ruleCount: db.ruleCount + Math.floor(Math.random() * 80) + 12
      })));
      setIsUpdatingAll(false);
      setUploadSuccessMessage(isZh ? '所有核心特徵庫與規則庫已全數同步更新至最新版本！' : 'All signature databases have been synchronized to the latest release!');
      setTimeout(() => setUploadSuccessMessage(null), 4500);
    }, 2600);
  };

  // Handle Offline Upload Simulation
  const handleUploadPackage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPackage(true);
    setTimeout(() => {
      setIsUploadingPackage(false);
      setUploadSuccessMessage(isZh ? `離線更新套件 ${file.name} 驗證成功，已自動載入並解壓縮更新至對應特徵庫！` : `Offline update package ${file.name} successfully verified and unpacked!`);
      setTimeout(() => setUploadSuccessMessage(null), 5000);
    }, 2000);
  };

  // Filtered DBs
  const filteredDBs = activeFilter === 'all' 
    ? dbSettings 
    : dbSettings.filter(db => db.category === activeFilter);

  const totalRules = dbSettings.reduce((acc, db) => acc + db.ruleCount, 0);
  const pendingUpdateCount = dbSettings.filter(db => db.status === 'update_available').length;
  const autoUpdateCount = dbSettings.filter(db => db.autoUpdate).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '已載入特徵規則總數' : 'Total Loaded Signatures'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Database size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {(totalRules / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] font-bold text-gray-500">
              {isZh ? '條有效規則' : 'Rules'}
            </span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={12} />
            <span>{isZh ? '引擎皆已全數載入運作中' : 'All Rules Engine Synced'}</span>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '待更新特徵資料庫' : 'Pending Updates'}
            </span>
            <div className={cn(
              "w-8 h-8 rounded-lg border flex items-center justify-center",
              pendingUpdateCount > 0 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            )}>
              <RefreshCw size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-black font-mono",
              pendingUpdateCount > 0 ? "text-amber-400" : "text-emerald-400"
            )}>
              {pendingUpdateCount}
            </span>
            <span className="text-[10px] font-bold text-gray-500">
              / {dbSettings.length} {isZh ? '個特徵模組' : 'Databases'}
            </span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-gray-400">
            {pendingUpdateCount > 0 ? (
              <span className="text-amber-400 font-bold">{isZh ? '有可用更新，建議立即同步' : 'Updates Available'}</span>
            ) : (
              <span className="text-emerald-400 font-bold">{isZh ? '所有特徵庫皆已是最新狀態' : 'Up to Date'}</span>
            )}
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '自動排程同步啟用率' : 'Auto-Sync Coverage'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">
              {Math.round((autoUpdateCount / dbSettings.length) * 100)}%
            </span>
            <span className="text-[10px] font-bold text-gray-500">
              ({autoUpdateCount}/{dbSettings.length})
            </span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-gray-400">
            {isZh ? '每日固定排程：' : 'Scheduled:'} <span className="text-white font-mono">{dailyTime} CST</span>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '更新通道與伺服器' : 'Update Server Health'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Server size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {isZh ? '連線暢通' : 'Active'}
            </span>
            <span className="text-[10px] font-bold text-gray-500">SSL v3/TLS</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-gray-400 flex items-center gap-1">
            <Zap size={12} className="text-cyan-400" />
            <span>{isZh ? '官方雲端 CDN 節點 (8 站點備援)' : 'Global CDN CDN Mirrors'}</span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center justify-between transition-all animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-400" size={18} />
            <span className="text-xs font-bold font-mono">{uploadSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setUploadSuccessMessage(null)}
            className="p-1 hover:bg-black/30 rounded-lg text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Action Header & Filter Bar */}
      <div className="p-6 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
              <RefreshCw className={cn("text-blue-400", isUpdatingAll && "animate-spin")} size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                {isZh ? '特徵庫與規則庫更新管理 (Signature & Rules Management)' : 'Signature & Rules Update Management'}
              </h3>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                {isZh 
                  ? '即時管理與同步平台各層安全防禦引擎之威脅特徵庫、入侵偵測 (IDS) 規則、YARA 特徵碼及終端裝置指紋庫。' 
                  : 'Configure and synchronize threat detection signatures, IDS rules, YARA definitions, and IoT device fingerprints.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Offline Package Upload Button */}
            <label className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-all flex items-center gap-2 cursor-pointer shadow">
              <Upload size={14} className={isUploadingPackage ? "animate-bounce text-blue-400" : "text-gray-400"} />
              <span>{isUploadingPackage ? (isZh ? '正在上傳驗證中...' : 'Verifying...') : (isZh ? '匯入離線更新套件 (.sig)' : 'Offline Package')}</span>
              <input 
                type="file" 
                accept=".sig,.tar.gz,.zip,.dat" 
                onChange={handleUploadPackage}
                disabled={isReadOnly || isUploadingPackage}
                className="hidden" 
              />
            </label>

            {/* Manual Sync All */}
            {!isReadOnly && (
              <button 
                onClick={handleUpdateAll}
                disabled={isUpdatingAll}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <RefreshCw size={14} className={isUpdatingAll ? "animate-spin" : ""} />
                <span>{isUpdatingAll ? (isZh ? '正在全域同步更新中...' : 'Syncing All...') : (isZh ? '全域一鍵更新 (Update All)' : 'Update All Databases')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">
            {isZh ? '特徵分類：' : 'CATEGORY:'}
          </span>
          {[
            { id: 'all', label: isZh ? '全部特徵庫' : 'All Databases' },
            { id: 'threat_ids', label: isZh ? '入侵防禦 (IDS/IPS)' : 'IDS / IPS Rules' },
            { id: 'malware', label: isZh ? '惡意程式 (YARA)' : 'Malware YARA' },
            { id: 'threat_intel', label: isZh ? '威脅情資 (Threat Intel)' : 'Threat Intelligence' },
            { id: 'fingerprint', label: isZh ? '裝置指紋 (Fingerbank)' : 'Device Fingerprints' },
            { id: 'network', label: isZh ? '協定解析 (Zeek/Wi-Fi)' : 'Protocol & Wireless' },
            { id: 'vulnerability', label: isZh ? '漏洞資料庫 (NVD/CVE)' : 'Vulnerability DB' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeFilter === f.id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Signature Databases Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {filteredDBs.map(db => (
          <div 
            key={db.id} 
            className="bg-[#0d0d0f] border border-gray-800 rounded-3xl p-6 hover:border-gray-700 transition-all group flex flex-col justify-between shadow-xl relative overflow-hidden"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 tracking-wider font-mono">
                      {db.categoryLabelZh}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono font-bold">
                      ID: {db.id}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white tracking-tight">
                    {db.name}
                  </h4>
                </div>

                {/* Status Badge */}
                <div className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap border",
                  db.status === 'updating' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse" :
                  db.status === 'update_available' ? "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse" :
                  db.status === 'stable' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {db.status === 'updating' && <RefreshCw size={10} className="animate-spin" />}
                  {db.status === 'update_available' && <AlertCircle size={10} />}
                  {db.status === 'up_to_date' && <CheckCircle2 size={10} />}
                  <span>
                    {db.status === 'updating' ? (isZh ? '正在更新中...' : 'Updating...') :
                     db.status === 'update_available' ? (isZh ? '發現新版本' : 'New Update') :
                     db.status === 'stable' ? (isZh ? '穩定運行中' : 'Stable') :
                     (isZh ? '已是最新版本' : 'Up to Date')}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                {db.descriptionZh}
              </p>

              {/* Metadata Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3 bg-black/40 border border-gray-800/80 rounded-2xl mb-4 font-mono">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block font-sans">
                    {isZh ? '目前版本' : 'Current Ver'}
                  </span>
                  <span className="text-xs font-bold text-gray-200 block truncate">
                    {db.version}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block font-sans">
                    {isZh ? '已載入規則' : 'Signatures'}
                  </span>
                  <span className="text-xs font-bold text-blue-400 block truncate">
                    {db.ruleCount.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block font-sans">
                    {isZh ? '最新版本' : 'Latest Ver'}
                  </span>
                  <span className={cn(
                    "text-xs font-bold block truncate",
                    db.status === 'update_available' ? "text-amber-400 font-black" : "text-gray-400"
                  )}>
                    {db.latestVersion}
                  </span>
                </div>
              </div>

              {/* Source URL & Last Updated */}
              <div className="flex flex-col gap-1 text-[10px] text-gray-500 mb-4 font-mono">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-gray-400">{isZh ? '最後更新時間：' : 'Last Sync:'}</span>
                  <span className="text-gray-300">{db.lastUpdated}</span>
                </div>
                <div className="flex justify-between items-center truncate">
                  <span className="font-sans font-bold text-gray-400">{isZh ? '更新來源：' : 'Source:'}</span>
                  <span className="text-gray-400 truncate max-w-[240px]" title={db.sourceUrl}>{db.sourceUrl}</span>
                </div>
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="flex items-center justify-between pt-3.5 border-t border-gray-800/80">
              {/* Auto Update Switch */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => toggleAutoUpdate(db.id)}
                  disabled={isReadOnly}
                  className={cn(
                    "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                    db.autoUpdate ? "bg-blue-600" : "bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-transform",
                    db.autoUpdate ? "translate-x-4" : "translate-x-0"
                  )}></div>
                </button>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {isZh ? '自動排程更新' : 'Auto Sync'}
                </span>
              </div>

              {/* Manual Update Button */}
              <button 
                onClick={() => updateNow(db.id)}
                disabled={isReadOnly || db.status === 'updating'}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm",
                  db.status === 'update_available'
                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 font-black"
                    : "bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 border border-gray-700"
                )}
              >
                <RefreshCw size={12} className={db.status === 'updating' ? "animate-spin" : ""} />
                <span>
                  {db.status === 'updating' ? (isZh ? '更新中...' : 'Syncing...') :
                   db.status === 'update_available' ? (isZh ? '立即升級新版' : 'Upgrade Now') :
                   (isZh ? '立即手動同步' : 'Manual Sync')}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section 1: Fingerbank Advanced Profiling Integration */}
      <div className="p-6 sm:p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5 border-b border-gray-800 pb-5">
          <div className="w-11 h-11 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-inner">
            <Layers className="text-purple-400" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
              {isZh ? 'Fingerbank 終端設備識別特徵整合 (Device Fingerprinting)' : 'Fingerbank Device Fingerprinting'}
            </h3>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">
              {isZh 
                ? '整合全網最大開源設備指紋庫，針對工控 OT、醫療物聯網 IoMT、辦公設備與伺服器進行自動化資產分類與風險畫像。' 
                : 'Advanced AI & heuristic profiling database for IoT, IT, OT, and medical device identification.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-black/40 p-4 rounded-2xl border border-gray-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {isZh ? '官方 Fingerbank API 連線端點' : 'Fingerbank API Endpoint'}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isZh ? 'API 連線正常' : 'Connected'}
                </span>
              </div>
              <input 
                type="text" 
                value="https://api.fingerbank.org/v2" 
                readOnly
                className="w-full bg-[#070709] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-purple-300 font-mono font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  {isZh ? 'DHCP Option55 指紋分析' : 'DHCP Option55 Matching'}
                </span>
                <p className="text-[11px] text-gray-400">
                  {isZh ? '即時監聽廣播請求並比對作業系統發行版本與版本號。' : 'Passive analysis of network requests to determine OS and build.'}
                </p>
              </div>

              <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  {isZh ? 'IEEE MAC OUI 廠商辨識' : 'IEEE MAC OUI Mapping'}
                </span>
                <p className="text-[11px] text-gray-400">
                  {isZh ? '自動對映網卡前綴至硬體原廠（如 Cisco, Apple, Hikvision 等）。' : 'Automatic hardware vendor attribution based on official IEEE registry.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowAddSignatureModal(true)}
              disabled={isReadOnly}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-2xl border border-gray-700 transition-all flex items-center justify-center gap-2 shadow"
            >
              <Plus size={16} className="text-purple-400" />
              <span>{isZh ? '新增自訂私有裝置識別特徵 (Custom Device Signature)' : 'Add Custom Device Signature'}</span>
            </button>
          </div>

          <div className="bg-gradient-to-b from-purple-950/20 to-black/60 p-6 rounded-3xl border border-purple-500/20 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">
                  {isZh ? '指紋庫統計態勢' : 'Signature Stats'}
                </h4>
                <Database size={14} className="text-purple-400" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-gray-800/80 pb-2">
                  <span className="text-[11px] text-gray-400 font-bold">
                    {isZh ? '已收錄設備特徵總數' : 'Total Profiles'}
                  </span>
                  <span className="text-xl font-black text-white font-mono">72,401</span>
                </div>

                <div className="flex justify-between items-end border-b border-gray-800/80 pb-2">
                  <span className="text-[11px] text-gray-400 font-bold">
                    {isZh ? '本月社群新增特徵' : 'Added This Month'}
                  </span>
                  <span className="text-lg font-black text-purple-400 font-mono">+1,284</span>
                </div>

                <div className="flex justify-between items-end border-b border-gray-800/80 pb-2">
                  <span className="text-[11px] text-gray-400 font-bold">
                    {isZh ? '企業私有特徵數' : 'Custom Profiles'}
                  </span>
                  <span className="text-lg font-black text-blue-400 font-mono">48</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                <span>{isZh ? '本機快取命中率' : 'Cache Hit Rate'}</span>
                <span className="text-purple-400 font-mono">98.4%</span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[98.4%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section 2: Global Auto-Sync Schedule & Proxy Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Schedule Settings */}
        <div className="p-6 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3">
            <Clock size={16} className="text-blue-400" />
            <h5 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '全域自動排程週期設定 (Update Schedule)' : 'Global Auto-Update Schedule'}
            </h5>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {isZh ? '自動同步排程模式' : 'Sync Frequency'}
              </label>
              <select 
                value={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.value as any)}
                disabled={isReadOnly}
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500 uppercase"
              >
                <option value="daily">{isZh ? '每日固定時間同步 (推薦)' : 'Daily Sync (Recommended)'}</option>
                <option value="hourly">{isZh ? '每小時即時同步 (高頻)' : 'Hourly Sync'}</option>
                <option value="weekly">{isZh ? '每週離峰時間同步' : 'Weekly Sync'}</option>
                <option value="custom">{isZh ? '自訂 Cron 排程表達式' : 'Custom Cron Expression'}</option>
              </select>
            </div>

            {scheduleMode === 'daily' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '每日執行時間 (CST 系統時區)' : 'Daily Execution Time'}
                </label>
                <input 
                  type="time" 
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono text-blue-400 font-bold outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-300">
                  {isZh ? '更新前自動備份舊版規則 (Rollback Snapshot)' : 'Snapshot Backup Before Update'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '若新規則編譯失敗時，自動無縫回滾至上一穩定版本。' : 'Auto rollback if new rules fail syntax test'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => !isReadOnly && setBackupBeforeUpdate(!backupBeforeUpdate)}
                className={cn(
                  "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                  backupBeforeUpdate ? "bg-blue-600" : "bg-gray-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  backupBeforeUpdate ? "translate-x-4" : "translate-x-0"
                )}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Proxy and Mirror Source Settings */}
        <div className="p-6 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3">
            <Server size={16} className="text-cyan-400" />
            <h5 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '更新代理與鏡像來源 (Proxy & Mirrors)' : 'Proxy & Update Mirrors'}
            </h5>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-300">
                  {isZh ? '啟用企業內部 HTTP/HTTPS 代理' : 'Enable Enterprise Proxy'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '適用於隔離內網 (Air-Gapped) 透過受控 Forward Proxy 存取外網' : 'For air-gapped environments'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => !isReadOnly && setProxyEnabled(!proxyEnabled)}
                className={cn(
                  "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                  proxyEnabled ? "bg-cyan-600" : "bg-gray-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  proxyEnabled ? "translate-x-4" : "translate-x-0"
                )}></div>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {isZh ? '代理伺服器連線位址 (Proxy URL)' : 'Proxy Address'}
              </label>
              <input 
                type="text" 
                value={proxyAddress}
                onChange={(e) => setProxyAddress(e.target.value)}
                disabled={isReadOnly || !proxyEnabled}
                placeholder="http://proxy.corp.internal:8080"
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-300">
                  {isZh ? '下載後自動重新載入引擎 (Hot Reload)' : 'Hot Reload Engines'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '規則更新後不中斷網路即時套用新特徵庫。' : 'Apply rules in-memory without service restart'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => !isReadOnly && setAutoApplyAfterDownload(!autoApplyAfterDownload)}
                className={cn(
                  "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                  autoApplyAfterDownload ? "bg-cyan-600" : "bg-gray-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  autoApplyAfterDownload ? "translate-x-4" : "translate-x-0"
                )}></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Signature Modal */}
      {showAddSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Plus size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">
                    {isZh ? '新增自訂裝置 / 威脅特徵規則' : 'Add Custom Signature Rule'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold">
                    {isZh ? '支援 Fingerbank JSON、Snort 3.0 或 YARA 語法自訂特徵定義。' : 'Define custom Fingerbank, Snort or YARA rule format.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddSignatureModal(false)}
                className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '特徵規則名稱' : 'Rule Name'}
                </label>
                <input 
                  type="text" 
                  value={newSignature.name}
                  onChange={(e) => setNewSignature({ ...newSignature, name: e.target.value })}
                  placeholder={isZh ? '例：Custom-PLC-Siemens-S7-1200' : 'e.g. Custom-PLC-Device'}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '特徵語法格式' : 'Rule Engine Format'}
                </label>
                <select 
                  value={newSignature.type}
                  onChange={(e) => setNewSignature({ ...newSignature, type: e.target.value })}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-purple-500 uppercase"
                >
                  <option value="fingerbank">Fingerbank JSON (DHCP / User-Agent 指紋)</option>
                  <option value="snort">Snort 3.0 Rule (網路封包特徵)</option>
                  <option value="yara">YARA 惡意特徵碼 (二進位比對)</option>
                  <option value="suricata">Suricata IDS Rule</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '特徵定義語法內容 (Rule Payload)' : 'Rule Content'}
                </label>
                <textarea 
                  rows={4}
                  value={newSignature.content}
                  onChange={(e) => setNewSignature({ ...newSignature, content: e.target.value })}
                  placeholder={newSignature.type === 'snort' 
                    ? 'alert tcp $EXTERNAL_NET any -> $HOME_NET 80 (msg:"CUSTOM Exploit Attempt"; content:"/admin.php"; sid:1000001; rev:1;)'
                    : '{\n  "dhcp_fingerprint": "1,3,6,15,119,252",\n  "vendor": "Siemens",\n  "device_type": "PLC Industrial Controller"\n}'
                  }
                  className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-xs font-mono text-purple-300 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowAddSignatureModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  if (!newSignature.name) {
                    alert(isZh ? '請輸入特徵規則名稱！' : 'Please provide rule name!');
                    return;
                  }
                  setShowAddSignatureModal(false);
                  setUploadSuccessMessage(isZh ? `自訂特徵「${newSignature.name}」已通過語法驗證並成功載入引擎！` : `Custom signature ${newSignature.name} compiled successfully!`);
                  setNewSignature({ name: '', type: 'snort', content: '' });
                  setTimeout(() => setUploadSuccessMessage(null), 5000);
                }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30"
              >
                {isZh ? '驗證並載入引擎' : 'Validate & Load'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

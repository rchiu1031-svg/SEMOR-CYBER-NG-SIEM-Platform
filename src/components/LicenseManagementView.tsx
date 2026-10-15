import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Key,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Upload,
  Cpu,
  Server,
  Layers,
  FileCheck,
  Activity,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Info,
  ExternalLink,
  Lock,
  Unlock,
  Sliders,
  ChevronRight,
  Database,
  Monitor,
  Terminal,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MODULES, type ModuleInfo } from '../types';

export interface LicenseData {
  licenseKey: string;
  tier: 'Community' | 'Professional' | 'Enterprise' | 'Ultimate';
  tierDisplayName: string;
  status: 'Active' | 'Warning' | 'GracePeriod' | 'Expired' | 'OverQuota' | 'Invalid' | 'Tampered';
  customer: {
    organization: string;
    department: string;
    contactEmail: string;
    contractId: string;
    country: string;
  };
  hardwareFingerprint: string;
  isNodeLocked: boolean;
  issuedDate: string;
  expiryDate: string;
  gracePeriodDays: number;
  daysRemaining: number;
  maxNodes: number;
  currentNodes: number;
  nodeBreakdown: {
    masterNodes: { active: number; max: number; description: string };
    workerNodes: { active: number; max: number; description: string };
    flowSensors: { active: number; max: number; description: string };
    endpointAgents: { active: number; max: number; description: string };
    otProbes: { active: number; max: number; description: string };
  };
  maxEps: number;
  currentEps: number;
  entitledModules: string[];
  addons: {
    aiInferenceCore: boolean;
    purdueOtdpi: boolean;
    soarPlaybooksPro: boolean;
    haClustering: boolean;
    vansCompliance: boolean;
    microsegmentation: boolean;
  };
  issuer: string;
  certificateSerial: string;
  digitalSignature: string;
  lastVerifiedAt: string;
  lastSyncAt: string;
}

export interface HardwareInfo {
  fingerprint: string;
  hostname: string;
  osPlatform: string;
  osArch: string;
  totalMemGB: number;
  cpuCores: number;
  cpuModel: string;
}

export interface VerificationResult {
  valid: boolean;
  signatureMatch: boolean;
  hardwareMatch: boolean;
  daysRemaining: number;
  status: string;
  details: string[];
  certificateSerial: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  operator: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export function LicenseManagementView() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // State
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'nodes' | 'hardware' | 'audit'>('overview');
  
  // Modals & UI states
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showKeyUnmasked, setShowKeyUnmasked] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHwid, setCopiedHwid] = useState(false);
  
  // Form states
  const [inputKey, setInputKey] = useState('');
  const [keyInputError, setKeyInputError] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<'Professional' | 'Enterprise' | 'Ultimate'>('Enterprise');
  const [upgradeMonths, setUpgradeMonths] = useState(12);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchLicenseData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [licRes, auditRes] = await Promise.all([
        fetch('/api/v1/license'),
        fetch('/api/v1/license/audit-logs')
      ]);

      if (licRes.ok) {
        const licData = await licRes.json();
        if (licData.success) {
          setLicense(licData.license);
          setHardware(licData.hardware);
        }
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        if (auditData.success) {
          setAuditLogs(auditData.logs || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to load license data:', err);
      showToast(isZh ? '載入授權資料失敗，請檢查後端連線' : 'Failed to fetch license data', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLicenseData();
    const interval = setInterval(() => {
      fetchLicenseData(true);
    }, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  // Online Activation
  const handleActivateKey = async (keyToUse?: string) => {
    const targetKey = (keyToUse || inputKey).trim();
    if (!targetKey) {
      setKeyInputError(isZh ? '請輸入授權金鑰' : 'Please enter license key');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: targetKey, operator: 'SecOps Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        setLicense(data.license);
        setShowActivateModal(false);
        setInputKey('');
        setKeyInputError('');
        showToast(data.message || (isZh ? '授權金鑰啟用成功！' : 'License key activated successfully!'), 'success');
        fetchLicenseData(true);
      } else {
        setKeyInputError(data.message || (isZh ? '金鑰無效或啟用失敗' : 'Invalid license key'));
        showToast(data.message || (isZh ? '啟用失敗' : 'Activation failed'), 'error');
      }
    } catch (err: any) {
      setKeyInputError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload Offline Certificate
  const handleUploadCertificate = async () => {
    if (!uploadContent.trim()) {
      showToast(isZh ? '請填入或上傳 .lic 憑證檔案內容' : 'Please provide license certificate content', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/license/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateContent: uploadContent, operator: 'SecOps Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        setLicense(data.license);
        setShowUploadModal(false);
        setUploadContent('');
        showToast(data.message || (isZh ? '離線憑證匯入成功！' : 'Offline certificate imported!'), 'success');
        fetchLicenseData(true);
      } else {
        showToast(data.message || (isZh ? '憑證校驗失敗' : 'Certificate validation failed'), 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadContent(content);
    };
    reader.readAsText(file);
  };

  // Verify Integrity
  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/v1/license/verify');
      const data = await res.json();
      if (data.success) {
        setVerificationResult(data);
        showToast(
          data.valid 
            ? (isZh ? '✅ 授權與數位簽章完整性校驗 100% 通過！' : 'License integrity verified!') 
            : (isZh ? '⚠️ 授權校驗發現警示或異常' : 'License verification flagged an anomaly'),
          data.valid ? 'success' : 'error'
        );
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Renew License
  const handleRenew = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/license/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: upgradeMonths, operator: 'SecOps Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        setLicense(data.license);
        setShowUpgradeModal(false);
        showToast(data.message, 'success');
        fetchLicenseData(true);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Upgrade Tier
  const handleUpgradeTier = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/license/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedUpgradeTier, operator: 'SecOps Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        setLicense(data.license);
        setShowUpgradeModal(false);
        showToast(data.message, 'success');
        fetchLicenseData(true);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync Node Usage
  const handleSyncNodes = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/license/sync-nodes', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || (isZh ? '節點配額同步完成' : 'Nodes synchronized'), 'success');
        fetchLicenseData(true);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Copy helpers
  const copyToClipboard = (text: string, type: 'key' | 'hwid') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedHwid(true);
      setTimeout(() => setCopiedHwid(false), 2000);
    }
    showToast(isZh ? '已複製至剪貼簿！' : 'Copied to clipboard!', 'info');
  };

  // Status Styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isZh ? '授權有效 (Active)' : 'Active'}</span>
          </div>
        );
      case 'Warning':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold shadow-lg shadow-amber-500/10">
            <AlertTriangle size={13} className="animate-bounce" />
            <span>{isZh ? '即將到期 (Expiring Soon)' : 'Expiring Soon'}</span>
          </div>
        );
      case 'GracePeriod':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-full text-xs font-bold shadow-lg shadow-orange-500/10">
            <Clock size={13} className="animate-spin" />
            <span>{isZh ? '寬限期運作中 (Grace Period)' : 'Grace Period'}</span>
          </div>
        );
      case 'OverQuota':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-bold">
            <Layers size={13} />
            <span>{isZh ? '節點配額超載 (Over Quota)' : 'Over Quota'}</span>
          </div>
        );
      case 'Expired':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-bold">
            <XCircle size={13} />
            <span>{isZh ? '授權已過期 (Expired)' : 'Expired'}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 border border-gray-500/30 text-gray-400 rounded-full text-xs font-bold">
            <Info size={13} />
            <span>{status}</span>
          </div>
        );
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Ultimate':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-md">Ultimate SecOps</span>;
      case 'Enterprise':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">Enterprise</span>;
      case 'Professional':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-cyan-600/30 border border-cyan-500/40 text-cyan-300">Professional</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gray-800 text-gray-300">Community</span>;
    }
  };

  if (isLoading && !license) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-xs tracking-wider uppercase font-semibold">
          {isZh ? '正在讀取平台底層授權引擎與硬體憑證資訊...' : 'Loading Enterprise License Engine...'}
        </p>
      </div>
    );
  }

  const currentLic = license || {
    licenseKey: 'SEMOR-ENT-2026-8841-9923-SEC8',
    tier: 'Enterprise' as const,
    tierDisplayName: 'Enterprise SecOps Suite (企業旗艦版)',
    status: 'Active' as const,
    customer: {
      organization: '國家關鍵基礎設施數位防禦中心',
      department: '資通安全處 / 核心 SOC 運籌中心',
      contactEmail: 'soc-admin@gov.internal.tw',
      contractId: 'CTR-2026-TW-CIP-9011',
      country: 'Taiwan (ROC)'
    },
    hardwareFingerprint: hardware?.fingerprint || 'HWID-7A9B-44E2-90FC-B138',
    isNodeLocked: false,
    issuedDate: '2026-01-01T00:00:00Z',
    expiryDate: '2028-12-31T23:59:59Z',
    gracePeriodDays: 14,
    daysRemaining: 730,
    maxNodes: 500,
    currentNodes: 142,
    nodeBreakdown: {
      masterNodes: { active: 1, max: 2, description: '主控中樞 HA 集群節點' },
      workerNodes: { active: 4, max: 8, description: '日誌解析與關聯運算 Worker' },
      flowSensors: { active: 12, max: 25, description: '全流量深包檢測 (DPI) 探針' },
      endpointAgents: { active: 110, max: 400, description: 'EDR/FIM 主機微代理' },
      otProbes: { active: 15, max: 65, description: '工控 Purdue 隔離邊界安全探針' }
    },
    maxEps: 25000,
    currentEps: 4850,
    entitledModules: MODULES.map(m => m.id),
    addons: {
      aiInferenceCore: true,
      purdueOtdpi: true,
      soarPlaybooksPro: true,
      haClustering: true,
      vansCompliance: true,
      microsegmentation: true
    },
    issuer: 'SEMOR GLOBAL ENTITLEMENT ROOT CA',
    certificateSerial: 'CERT-SN-89F1-44B7-A189',
    digitalSignature: '9A7B39E881741123405BC79124EA90B1',
    lastVerifiedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString()
  };

  const nodePercentage = Math.min(100, Math.round((currentLic.currentNodes / currentLic.maxNodes) * 100));
  const epsPercentage = Math.min(100, Math.round((currentLic.currentEps / currentLic.maxEps) * 100));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-bold flex items-center gap-3 animate-slide-up ${
          toastMessage.type === 'error'
            ? 'bg-red-950/90 border-red-500/50 text-red-200 shadow-red-900/30'
            : toastMessage.type === 'info'
            ? 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-900/30'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-900/30'
        }`}>
          {toastMessage.type === 'error' ? <XCircle size={18} /> : toastMessage.type === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/30 text-blue-400">
                <Shield size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-black text-white tracking-wide">
                    {isZh ? '授權與安全訂閱管理' : 'Enterprise License & Subscription'}
                  </h1>
                  {getStatusBadge(currentLic.status)}
                  {getTierBadge(currentLic.tier)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {currentLic.customer.organization} • {isZh ? '合約代號' : 'Contract'}: <span className="font-mono text-gray-300 font-semibold">{currentLic.customer.contractId}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowActivateModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Key size={14} />
              <span>{isZh ? '線上啟用金鑰' : 'Activate Key'}</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Upload size={14} />
              <span>{isZh ? '匯入離線憑證' : 'Import .lic'}</span>
            </button>
            <button
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
              className="px-3 py-2 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title={isZh ? '執行數位簽章與硬體防篡改驗證' : 'Verify HMAC signature and hardware binding'}
            >
              <FileCheck size={14} className={isVerifying ? 'animate-spin' : ''} />
              <span>{isZh ? '校驗簽章' : 'Verify'}</span>
            </button>
            <a
              href="/api/v1/license/export"
              download
              className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title={isZh ? '下載具數位簽章之離線 .lic 憑證檔' : 'Download signed .lic file'}
            >
              <Download size={14} />
              <span>{isZh ? '匯出憑證' : 'Export .lic'}</span>
            </a>
            <a
              href="/api/v1/license/export-report"
              download
              className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title={isZh ? '下載合規稽核報告 CSV' : 'Download CSV audit report'}
            >
              <FileText size={14} />
              <span>{isZh ? '稽核報表' : 'Audit CSV'}</span>
            </a>
            <button
              onClick={() => fetchLicenseData(true)}
              disabled={isRefreshing}
              className="p-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-all"
              title={isZh ? '重新讀取' : 'Refresh'}
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Plan Tier */}
        <div className="bg-[#111114] border border-gray-800 hover:border-blue-500/30 rounded-2xl p-5 shadow-lg relative group transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold mb-3">
            <span className="uppercase tracking-wider">{isZh ? '授權方案等級' : 'Plan Edition'}</span>
            <Sparkles size={16} className="text-blue-400" />
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {currentLic.tier}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            {currentLic.tierDisplayName}
          </p>
          <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{isZh ? '憑證發行者' : 'Issuer'}</span>
            <span className="text-blue-400 font-mono truncate max-w-[150px]">SEMOR Root CA</span>
          </div>
        </div>

        {/* Card 2: Expiry & Days Remaining */}
        <div className="bg-[#111114] border border-gray-800 hover:border-emerald-500/30 rounded-2xl p-5 shadow-lg relative group transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold mb-3">
            <span className="uppercase tracking-wider">{isZh ? '效期倒數與狀態' : 'Days Remaining'}</span>
            <Calendar size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-2xl font-black ${
              currentLic.daysRemaining <= 0 
                ? 'text-red-400' 
                : currentLic.daysRemaining <= 30 
                ? 'text-amber-400' 
                : 'text-emerald-400'
            }`}>
              {currentLic.daysRemaining > 0 ? `${currentLic.daysRemaining}` : (isZh ? '已屆期' : 'Expired')}
            </div>
            {currentLic.daysRemaining > 0 && (
              <span className="text-xs text-gray-400 font-semibold">{isZh ? '天剩餘' : 'days left'}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {isZh ? '截止日期' : 'Expires'}: <span className="font-mono text-gray-200">{currentLic.expiryDate.slice(0, 10)}</span>
          </p>
          <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{isZh ? '寬限保護期' : 'Grace Period'}</span>
            <span className="text-emerald-400 font-bold">{currentLic.gracePeriodDays} {isZh ? '天緩衝' : 'days'}</span>
          </div>
        </div>

        {/* Card 3: Node Capacity */}
        <div className="bg-[#111114] border border-gray-800 hover:border-purple-500/30 rounded-2xl p-5 shadow-lg relative group transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold mb-3">
            <span className="uppercase tracking-wider">{isZh ? '叢集節點授權配額' : 'Cluster Node Capacity'}</span>
            <Server size={16} className="text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">
              {currentLic.currentNodes} <span className="text-xs text-gray-500 font-normal">/ {currentLic.maxNodes}</span>
            </div>
            <span className="text-xs font-bold text-purple-400 font-mono">{nodePercentage}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-800/80 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${nodePercentage}%` }}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{isZh ? '可用餘額' : 'Available'}</span>
            <span className="text-purple-300 font-mono font-bold">{Math.max(0, currentLic.maxNodes - currentLic.currentNodes)} {isZh ? '節點' : 'nodes'}</span>
          </div>
        </div>

        {/* Card 4: EPS Quota */}
        <div className="bg-[#111114] border border-gray-800 hover:border-cyan-500/30 rounded-2xl p-5 shadow-lg relative group transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold mb-3">
            <span className="uppercase tracking-wider">{isZh ? '日誌吞吐量 (EPS)' : 'Ingestion Rate (EPS)'}</span>
            <Zap size={16} className="text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">
              {currentLic.currentEps.toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ {currentLic.maxEps.toLocaleString()}</span>
            </div>
            <span className="text-xs font-bold text-cyan-400 font-mono">{epsPercentage}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-800/80 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${epsPercentage}%` }}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{isZh ? '突發流量緩衝' : 'Peak Burst Buffer'}</span>
            <span className="text-cyan-300 font-mono font-bold">{isZh ? '支援 200% 突發' : '200% Supported'}</span>
          </div>
        </div>
      </div>

      {/* Verification Result Card (if triggered) */}
      {verificationResult && (
        <div className={`p-5 rounded-2xl border transition-all ${
          verificationResult.valid 
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
            : 'bg-red-950/20 border-red-500/40 text-red-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {verificationResult.valid ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertTriangle className="text-red-400" size={20} />}
              <h3 className="font-bold text-sm">
                {isZh ? '授權防篡改與密碼學簽章校驗報告' : 'Cryptographic Integrity Verification Report'}
              </h3>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {verificationResult.details.map((detail, idx) => (
              <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                <span>{detail}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <span>{isZh ? '憑證序號' : 'Certificate Serial'}: <code className="text-blue-300">{verificationResult.certificateSerial}</code></span>
            <span>{isZh ? '校驗演算法' : 'Algorithm'}: <code className="text-purple-300">HMAC-SHA256 (256-bit Key Digest)</code></span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <Info size={14} />
          <span>{isZh ? '授權總覽' : 'Overview'}</span>
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'modules'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <Layers size={14} />
          <span>{isZh ? '功能模組權限矩陣' : 'Module Entitlements'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-mono">
            {currentLic.entitledModules.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('nodes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'nodes'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <Server size={14} />
          <span>{isZh ? '節點配額與流量分佈' : 'Node & Quota Breakdown'}</span>
        </button>
        <button
          onClick={() => setActiveTab('hardware')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'hardware'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <Cpu size={14} />
          <span>{isZh ? '硬體綁定與憑證指紋' : 'Hardware Fingerprint'}</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <Clock size={14} />
          <span>{isZh ? '授權稽核日誌' : 'Audit Trail'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-800 text-gray-300 font-mono">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Information Box */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="text-blue-400" size={18} />
                  {isZh ? '現行授權憑證詳情' : 'Active Certificate Details'}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  SN: {currentLic.certificateSerial}
                </span>
              </h3>

              {/* License Key Field */}
              <div className="bg-black/40 border border-gray-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{isZh ? '正式授權金鑰 (License Key)' : 'License Key'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowKeyUnmasked(!showKeyUnmasked)}
                      className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-[11px]"
                    >
                      {showKeyUnmasked ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showKeyUnmasked ? (isZh ? '遮罩' : 'Mask') : (isZh ? '顯示' : 'Reveal')}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(currentLic.licenseKey, 'key')}
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-[11px]"
                    >
                      {copiedKey ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      <span>{copiedKey ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
                <div className="font-mono text-base font-bold text-blue-300 tracking-wider">
                  {showKeyUnmasked 
                    ? currentLic.licenseKey 
                    : `${currentLic.licenseKey.slice(0, 10)}••••-••••-••••-${currentLic.licenseKey.slice(-4)}`
                  }
                </div>
              </div>

              {/* Spec Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-gray-500">{isZh ? '授權組織' : 'Licensed Entity'}</span>
                  <p className="font-semibold text-gray-200">{currentLic.customer.organization}</p>
                  <p className="text-[11px] text-gray-400">{currentLic.customer.department}</p>
                </div>
                <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-gray-500">{isZh ? '維護合約編號 / 國家' : 'Contract & Jurisdiction'}</span>
                  <p className="font-mono font-semibold text-blue-300">{currentLic.customer.contractId}</p>
                  <p className="text-[11px] text-gray-400">{currentLic.customer.country}</p>
                </div>
                <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-gray-500">{isZh ? '生效簽發日期' : 'Issued Date'}</span>
                  <p className="font-mono text-gray-200">{currentLic.issuedDate.replace('T', ' ').slice(0, 19)}</p>
                  <p className="text-[11px] text-emerald-400">已通過 CA 根密鑰數位簽署</p>
                </div>
                <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-gray-500">{isZh ? '有效到期日期' : 'Expiration Date'}</span>
                  <p className="font-mono text-gray-200">{currentLic.expiryDate.replace('T', ' ').slice(0, 19)}</p>
                  <p className="text-[11px] text-purple-400">含 {currentLic.gracePeriodDays} 天無中斷寬限保護</p>
                </div>
              </div>

              {/* Digital Signature Fingerprint */}
              <div className="mt-4 pt-4 border-t border-gray-800/80">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1.5">
                    <FileCheck size={13} className="text-emerald-400" />
                    {isZh ? 'HMAC-SHA256 數位簽章雜湊值 (防篡改簽記)' : 'Cryptographic Signature'}
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">VERIFIED ROOT CA</span>
                </div>
                <div className="font-mono text-[11px] text-gray-400 bg-black/60 p-2.5 rounded-lg border border-gray-800/60 truncate">
                  {currentLic.digitalSignature}
                </div>
              </div>
            </div>

            {/* Advanced Enterprise Addons */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="text-amber-400" size={18} />
                {isZh ? '企業加值防禦模組 (Enterprise Security Add-ons)' : 'Enterprise Security Add-ons'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                      <Cpu size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-200">AI 推理核心本地授權</div>
                      <div className="text-[10px] text-gray-500">Llama-3 / Gemma-2 本地私有化分析</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {currentLic.addons.aiInferenceCore ? '已啟用' : '未授權'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Activity size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-200">工控 Purdue OT DPI 探針</div>
                      <div className="text-[10px] text-gray-500">Modbus / S7 / IEC-60870 工控協議</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {currentLic.addons.purdueOtdpi ? '已啟用' : '未授權'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                      <Sliders size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-200">SOAR 劇本全自動處置</div>
                      <div className="text-[10px] text-gray-500">防火牆自動聯防與主機微隔離</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {currentLic.addons.soarPlaybooksPro ? '已啟用' : '未授權'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                      <Server size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-200">跨機房主主高可用 (HA Cluster)</div>
                      <div className="text-[10px] text-gray-500">Raft / Paxos 雙活容錯熱備援</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {currentLic.addons.haClustering ? '已啟用' : '未授權'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Upgrade & Support SLA */}
          <div className="space-y-6">
            {/* Upgrade & Renew CTA Card */}
            <div className="bg-gradient-to-br from-blue-900/40 via-[#111114] to-purple-950/40 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={16} />
                <span>{isZh ? '方案升級與續約' : 'Subscription Upgrade'}</span>
              </div>
              <h4 className="text-lg font-black text-white">
                {isZh ? '需要更多節點或國家級國防防禦？' : 'Need More Nodes or Quotas?'}
              </h4>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                {isZh
                  ? '隨時升級至 Ultimate MSSP Sovereign 方案，獲得最高 2,000+ 節點、100,000 EPS 吞吐量及 24/7 專屬資安指揮中心支援。'
                  : 'Upgrade to Ultimate MSSP plan for up to 2,000+ nodes, 100k EPS, and dedicated 24/7 SLA.'}
              </p>

              <div className="mt-5 space-y-2.5">
                <button
                  onClick={() => {
                    setSelectedUpgradeTier('Ultimate');
                    setShowUpgradeModal(true);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  <Sparkles size={15} />
                  <span>{isZh ? '升級至 Ultimate 國家國防版' : 'Upgrade to Ultimate'}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedUpgradeTier(currentLic.tier === 'Ultimate' ? 'Ultimate' : 'Enterprise');
                    setShowUpgradeModal(true);
                  }}
                  className="w-full px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>{isZh ? '授權展延與續約申請' : 'Renew / Extend License'}</span>
                </button>
              </div>
            </div>

            {/* SLA & Support Card */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {isZh ? '原廠服務等級協定 (SLA Tier)' : 'Support & SLA Tier'}
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <span className="text-gray-400">{isZh ? '技術支援等級' : 'Support Level'}</span>
                  <span className="font-bold text-emerald-400">24/7/365 Platinum SOC</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <span className="text-gray-400">{isZh ? '重大事件回應時間' : 'Critical Response Time'}</span>
                  <span className="font-mono font-bold text-white">&lt; 15 mins</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <span className="text-gray-400">{isZh ? '威脅情報庫即時推送' : 'CTI Feed Sync'}</span>
                  <span className="font-mono font-bold text-blue-400">{isZh ? '每小時自動增量' : 'Hourly Delta'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{isZh ? '合規認證標準' : 'Compliance'}</span>
                  <span className="font-mono text-xs text-purple-300">ISO 27001 / VANS / NIST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Module Entitlements Matrix */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="text-blue-400" size={18} />
                  {isZh ? '平台全功能模組授權矩陣' : 'Complete Module Entitlements Matrix'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isZh 
                    ? `目前方案 (${currentLic.tierDisplayName}) 已解鎖 ${currentLic.entitledModules.length} 個核心資安防禦模組。` 
                    : `Active plan unlocks ${currentLic.entitledModules.length} modules.`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold">
                  <CheckCircle2 size={13} />
                  {isZh ? '已授權使用' : 'Active'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 border border-gray-700 text-gray-500 rounded-lg font-bold">
                  <Lock size={13} />
                  {isZh ? '方案鎖定' : 'Locked'}
                </span>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULES.map((module) => {
                const isEntitled = currentLic.entitledModules.includes(module.id) || currentLic.tier === 'Enterprise' || currentLic.tier === 'Ultimate';

                return (
                  <div
                    key={module.id}
                    className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                      isEntitled
                        ? 'bg-gradient-to-br from-gray-900/60 to-gray-900/20 border-gray-800 hover:border-blue-500/40 shadow-md'
                        : 'bg-black/30 border-gray-900/80 opacity-40 grayscale'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          isEntitled 
                            ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400' 
                            : 'bg-gray-800 text-gray-600'
                        }`}>
                          <Layers size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-200">
                            {t(`modules.${module.id}`, { defaultValue: module.name.replace('SEMOR ', '') })}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {module.category}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isEntitled ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-800 text-gray-500 border border-gray-700 flex items-center gap-1">
                            <Lock size={10} />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                      {module.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{isZh ? '後端底層引擎' : 'Engines'}:</span>
                      <span className="font-mono text-gray-400 truncate max-w-[170px]">
                        {module.engines?.join(', ') || 'Core Daemon'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Node & Quota Breakdown */}
      {activeTab === 'nodes' && (
        <div className="space-y-6">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="text-purple-400" size={18} />
                  {isZh ? '全網節點與感測探針配額分配' : 'Node & Sensor Quota Distribution'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isZh 
                    ? '監控主控機、運算節點、流量感測器與端點代理程式的授權額度消耗情況。' 
                    : 'Track active usage versus assigned capacity across all asset categories.'}
                </p>
              </div>
              <button
                onClick={handleSyncNodes}
                disabled={isRefreshing}
                className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isZh ? '同步底層節點數據' : 'Sync Node Telemetry'}</span>
              </button>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">{isZh ? '節點與感測器類別' : 'Category'}</th>
                    <th className="pb-3 font-semibold">{isZh ? '底層功能說明' : 'Description'}</th>
                    <th className="pb-3 font-semibold text-center">{isZh ? '目前使用' : 'Active'}</th>
                    <th className="pb-3 font-semibold text-center">{isZh ? '配額上限' : 'Max Quota'}</th>
                    <th className="pb-3 font-semibold">{isZh ? '消耗百分比' : 'Utilization'}</th>
                    <th className="pb-3 font-semibold text-right">{isZh ? '健康狀態' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {Object.entries(currentLic.nodeBreakdown).map(([key, item]) => {
                    const pct = Math.round((item.active / item.max) * 100);
                    return (
                      <tr key={key} className="hover:bg-gray-900/30 transition-colors">
                        <td className="py-4 text-white font-bold flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        </td>
                        <td className="py-4 text-gray-400 text-[11px]">{item.description}</td>
                        <td className="py-4 text-center font-mono font-bold text-white">{item.active}</td>
                        <td className="py-4 text-center font-mono text-gray-400">{item.max}</td>
                        <td className="py-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-gray-400 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pct > 90 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                              : pct > 75 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {pct > 90 ? (isZh ? '即將額滿' : 'Near Limit') : (isZh ? '充足' : 'Optimal')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Hardware Fingerprint */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Cpu className="text-cyan-400" size={18} />
              {isZh ? '伺服器實體硬體指紋綁定 (Hardware ID)' : 'Hardware Fingerprint Binding'}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              {isZh 
                ? '企業級離線授權可綁定專屬實體機指紋，防止非授權鏡像複製與非法虛擬機遷移。' 
                : 'Node-locked enterprise licenses are cryptographically bound to hardware fingerprints.'}
            </p>

            {/* Hardware ID Display */}
            <div className="bg-black/50 border border-gray-800 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-semibold text-gray-300">
                  {isZh ? '本機生成之硬體識別碼 (System HWID)' : 'System Hardware Fingerprint'}
                </span>
                <button
                  onClick={() => copyToClipboard(hardware?.fingerprint || currentLic.hardwareFingerprint, 'hwid')}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  {copiedHwid ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiedHwid ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製識別碼' : 'Copy HWID')}</span>
                </button>
              </div>
              <div className="font-mono text-xl font-bold text-cyan-300 tracking-wider">
                {hardware?.fingerprint || currentLic.hardwareFingerprint}
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                {isZh 
                  ? '如需申請離線授權 (.lic)，請將上方 HWID 代碼提供給 SEMOR 原廠授權中心。' 
                  : 'Submit this HWID to your account representative to issue an offline license.'}
              </p>
            </div>

            {/* Hardware specs breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl space-y-1">
                <span className="text-gray-500">{isZh ? '主機名稱 (Hostname)' : 'Hostname'}</span>
                <p className="font-mono font-bold text-white">{hardware?.hostname || 'semor-core-node'}</p>
                <p className="text-[10px] text-gray-400">{hardware?.osPlatform || 'Linux'} ({hardware?.osArch || 'x64'})</p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl space-y-1">
                <span className="text-gray-500">{isZh ? '處理器核心規格' : 'CPU Topology'}</span>
                <p className="font-mono font-bold text-white">{hardware?.cpuCores || 8} vCPUs</p>
                <p className="text-[10px] text-gray-400 truncate">{hardware?.cpuModel || 'Intel Xeon / AMD EPYC'}</p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl space-y-1">
                <span className="text-gray-500">{isZh ? '實體記憶體總量' : 'System Memory'}</span>
                <p className="font-mono font-bold text-white">{hardware?.totalMemGB || 32} GB RAM</p>
                <p className="text-[10px] text-emerald-400">ECC Registered Memory</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="text-blue-400" size={18} />
                  {isZh ? '授權防偽變更與安全稽核日誌' : 'License Security Audit Trail'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isZh 
                    ? '所有啟用、匯入、更換、展延與完整性校驗事件皆寫入防篡改日誌庫。' 
                    : 'Immutable log of activations, renewals, and tamper-check events.'}
                </p>
              </div>
              <a
                href="/api/v1/license/export-report"
                download
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>{isZh ? '匯出稽核報表 (CSV)' : 'Export CSV Report'}</span>
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">{isZh ? '時間戳記' : 'Timestamp'}</th>
                    <th className="pb-3 font-semibold">{isZh ? '動作類型' : 'Action'}</th>
                    <th className="pb-3 font-semibold">{isZh ? '操作者' : 'Operator'}</th>
                    <th className="pb-3 font-semibold">{isZh ? '變更細節與簽章記錄' : 'Details'}</th>
                    <th className="pb-3 font-semibold text-right">{isZh ? '狀態' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        {isZh ? '尚無稽核日誌記錄' : 'No audit entries found'}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-900/30 transition-colors">
                        <td className="py-3.5 font-mono text-gray-400 whitespace-nowrap">
                          {log.timestamp.replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 text-gray-300 font-semibold">{log.operator}</td>
                        <td className="py-3.5 text-gray-400 text-[11px] max-w-md">{log.details}</td>
                        <td className="py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Activate Key Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Key size={18} />
                </div>
                <h3 className="font-bold text-white text-base">
                  {isZh ? '線上啟用正式授權金鑰' : 'Activate License Key'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowActivateModal(false);
                  setKeyInputError('');
                }}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-300">
                {isZh ? '請輸入 SEMOR 授權金鑰 (25 字元金鑰)' : 'Enter 25-character License Key'}
              </label>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setKeyInputError('');
                }}
                placeholder="SEMOR-ENT-2026-XXXX-XXXX-XXXX"
                className="w-full bg-black/60 border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none"
              />
              {keyInputError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span>{keyInputError}</span>
                </p>
              )}
            </div>

            {/* Quick Demo Key Fillers for testing */}
            <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                {isZh ? '快速填入預設測試金鑰 (Quick Key Presets)' : 'Quick Test Key Presets'}
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleActivateKey('SEMOR-ENT-2026-8841-9923-SEC8')}
                  className="px-2.5 py-1.5 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 text-blue-300 rounded-lg font-mono text-[11px]"
                >
                  Enterprise 企業版 (500 Nodes)
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateKey('SEMOR-ULT-2026-7712-4418-SEC9')}
                  className="px-2.5 py-1.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 rounded-lg font-mono text-[11px]"
                >
                  Ultimate 國防旗艦版 (2000 Nodes)
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateKey('SEMOR-PRO-2026-1122-3344-SEC1')}
                  className="px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 rounded-lg font-mono text-[11px]"
                >
                  Professional 專業版 (150 Nodes)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowActivateModal(false)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={() => handleActivateKey()}
                disabled={isLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                <span>{isZh ? '驗證並啟用' : 'Verify & Activate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Offline Certificate Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Upload size={18} />
                </div>
                <h3 className="font-bold text-white text-base">
                  {isZh ? '匯入離線授權憑證 (.lic)' : 'Import Offline Certificate (.lic)'}
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-300">
                {isZh ? '選擇 .lic 憑證檔案或貼上 Base64 憑證內容' : 'Select .lic file or paste certificate content'}
              </label>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 hover:border-emerald-500/60 rounded-xl p-5 text-center cursor-pointer bg-black/30 transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".lic,.json"
                  className="hidden"
                />
                <Upload size={24} className="mx-auto text-gray-500 mb-2" />
                <p className="text-xs text-gray-300 font-semibold">
                  {isZh ? '點擊此處瀏覽檔案，或將 .lic 檔案拖曳至此' : 'Click to browse or drag & drop .lic file'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">支援 .lic / .json 格式之數位憑證</p>
              </div>

              <textarea
                rows={4}
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder={isZh ? '或在此直接貼上 Base64 或 JSON 格式之授權憑證字串...' : 'Or paste certificate string here...'}
                className="w-full bg-black/60 border border-gray-700 focus:border-emerald-500 rounded-xl p-3 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleUploadCertificate}
                disabled={isLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{isZh ? '解析並套用憑證' : 'Apply Certificate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Renew / Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Sparkles size={18} />
                </div>
                <h3 className="font-bold text-white text-base">
                  {isZh ? '授權升級與展延配置' : 'License Tier & Expiry Extension'}
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-2">
                  {isZh ? '選擇欲切換之訂閱方案等級' : 'Select Target Plan Tier'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Professional', 'Enterprise', 'Ultimate'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedUpgradeTier(tier)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedUpgradeTier === tier
                          ? 'bg-purple-600/20 border-purple-500 text-white font-bold'
                          : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{tier}</div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {tier === 'Ultimate' ? '2,000 節點' : tier === 'Enterprise' ? '500 節點' : '150 節點'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-2">
                  {isZh ? '有效期限展延時長' : 'Extension Period'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setUpgradeMonths(m)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                        upgradeMonths === m
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                          : 'bg-black/30 border-gray-800 text-gray-400'
                      }`}
                    >
                      +{m} {isZh ? '個月' : 'months'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleUpgradeTier}
                disabled={isLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{isZh ? '套用方案並展延' : 'Apply & Extend'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

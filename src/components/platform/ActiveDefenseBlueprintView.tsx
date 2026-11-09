import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Network,
  Cpu,
  Lock,
  Key,
  Radio,
  ArrowRight,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Terminal,
  Database,
  ExternalLink,
  Sliders,
  Send,
  Eye,
  FileCode,
  FileText,
  Activity,
  Bug,
  Globe,
  RefreshCw,
  Sparkles,
  Download,
  AlertOctagon,
  Copy,
  Check,
  Clock,
  Code2,
  SlidersHorizontal,
  Workflow,
  XCircle,
  HelpCircle,
  ShieldX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface DefenseNode {
  id: string;
  name: string;
  code: string;
  location: string;
  ip: string;
  role: 'HQ-Command' | 'Branch-Edge' | 'Cloud-Gateway' | 'Factory-OT';
  tier: 'Tier-1-Core' | 'Tier-2-R&D' | 'Tier-3-Cloud' | 'Tier-4-General';
  status: 'Online' | 'Synchronized' | 'Mitigating' | 'Alert';
  latencyMs: number;
  mTLSStatus: 'Active-Verified' | 'Rotating' | 'Revoked';
  installedHoneypots: string[];
  installedSandbox: string[];
  enforcementComponents: string[];
  activeBlockRulesCount: number;
  lastSyncTime: string;
}

interface ExtractedIoC {
  id: string;
  type: 'ipv4' | 'domain' | 'sha256' | 'url' | 'c2_pattern';
  value: string;
  sourceNodeId: string;
  sourceNodeName: string;
  honeypotOrSandbox: string;
  threatType: string;
  mitreTactic: string;
  confidenceScore: number;
  falsePositiveRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  extractedAt: string;
  status: 'Captured' | 'Validated' | 'Broadcasted' | 'Quarantined' | 'Restored';
  rawPayloadSample?: string;
  cuckooAnalysisId?: string;
  mispEventId?: string;
  scoreBreakdown?: {
    behaviorScore: number;
    confidenceScore: number;
    impactScore: number;
    totalScore: number;
    riskTier: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK';
    playbookTitle: string;
  };
}

interface WhitelistRule {
  id: string;
  name: string;
  type: 'IP_CIDR' | 'MAC_ADDR' | 'DOMAIN_ADMIN_CERT' | 'WEBHOOK_SOURCE' | 'CMDB_MAINTENANCE';
  value: string;
  description: string;
  cmdbAssetId?: string;
  maintenanceSchedule?: {
    daysOfWeek: number[];
    startHourUtc: number;
    endHourUtc: number;
  };
  enabled: boolean;
}

interface SoarPendingApproval {
  id: string;
  iocId: string;
  iocType: string;
  iocValue: string;
  sourceNodeId: string;
  sourceNodeName: string;
  threatType: string;
  totalScore: number;
  riskTier: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK';
  mode: 'AUTO' | 'MANUAL_ATTENDED';
  createdAt: string;
  slaExpiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SLA_AUTO_ESCALATED' | 'RESTORED';
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
  affectedComponents: {
    firewalls: string[];
    edrAgents: string[];
    dagGroup: string;
  };
}

interface SecurityConfig {
  autoBroadcastEnabled: boolean;
  soarMode: 'AUTO' | 'MANUAL_ATTENDED';
  slaTimeoutSeconds: number;
  minConfidenceThreshold: number;
  quarantineTtlHours: number;
  enableCoreWhitelistImmunity: boolean;
  enableDryRunImpactCheck: boolean;
  enableDualAuthorization: boolean;
  mTLSCertExpiryDays: number;
  hmacSharedSecret: string;
  ed25519PublicKeyFingerprint: string;
  whitelistedSubnets: string[];
  vaultCredentialsConfigured: boolean;
}

export function ActiveDefenseBlueprintView() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'architecture' | 'defense_lines' | 'soar_specs' | 'soar_queue' | 'sandbox_emulation'>('architecture');

  // State
  const [nodes, setNodes] = useState<DefenseNode[]>([]);
  const [iocs, setIocs] = useState<ExtractedIoC[]>([]);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [approvals, setApprovals] = useState<SoarPendingApproval[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistRule[]>([]);
  const [selectedNode, setSelectedNode] = useState<DefenseNode | null>(null);
  const [selectedIoC, setSelectedIoC] = useState<ExtractedIoC | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Emulation Simulation State
  const [emulationRunning, setEmulationRunning] = useState(false);
  const [emulationStep, setEmulationStep] = useState<number>(0);
  const [emulationLogs, setEmulationLogs] = useState<any[]>([]);
  const [emulationResultIoC, setEmulationResultIoC] = useState<ExtractedIoC | null>(null);
  const [stixJsonView, setStixJsonView] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Interactive Calculator State
  const [calcBehavior, setCalcBehavior] = useState<'PORT_SCAN' | 'AUTH_ATTEMPT' | 'INTERACTIVE_SHELL' | 'C2_DOWNLOAD' | 'RANSOM_EXEC'>('INTERACTIVE_SHELL');
  const [calcConfidence, setCalcConfidence] = useState<number>(94);
  const [calcTier, setCalcTier] = useState<'Tier-1-Core' | 'Tier-2-R&D' | 'Tier-3-Cloud' | 'Tier-4-General'>('Tier-1-Core');
  const [calcResult, setCalcResult] = useState<any>({
    behaviorScore: 40,
    confidenceScore: 24,
    impactScore: 25,
    totalScore: 89,
    riskTier: 'HIGH_RISK',
    playbookTitle: '高風險 / 已確認攻擊：受害分點及鄰近關鍵節點自動封鎖、派發 SOC Tier 2 工單'
  });

  // Code Snippet Tab inside SOAR specs
  const [apiCodeTab, setApiCodeTab] = useState<'pan_dag' | 'fortigate' | 'crowdstrike' | 'defender' | 'webhook_json'>('pan_dag');

  // SLA Time Remaining Timer
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchArchitecture = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/active-defense/architecture');
      const data = await res.json();
      if (data.success) {
        setNodes(data.branchNodes || []);
        setConfig(data.policyConfig || null);
        setApprovals(data.pendingApprovals || []);
        setWhitelist(data.whitelistRules || []);
        if (!selectedNode && data.branchNodes?.length > 0) {
          setSelectedNode(data.branchNodes[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch active defense architecture:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIocs = async () => {
    try {
      const res = await fetch('/api/v1/active-defense/iocs');
      const data = await res.json();
      if (data.success && Array.isArray(data.iocs)) {
        setIocs(data.iocs);
        if (!selectedIoC && data.iocs.length > 0) {
          setSelectedIoC(data.iocs[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch IoCs:', err);
    }
  };

  useEffect(() => {
    fetchArchitecture();
    fetchIocs();
  }, []);

  // Update Calculator on input changes
  useEffect(() => {
    const runCalc = async () => {
      try {
        const res = await fetch('/api/v1/active-defense/score-calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            behaviorLevel: calcBehavior,
            threatConfidence: calcConfidence,
            nodeTier: calcTier
          })
        });
        const data = await res.json();
        if (data.success) {
          setCalcResult(data.calculation);
        }
      } catch (err) {
        console.warn('Calc error:', err);
      }
    };
    runCalc();
  }, [calcBehavior, calcConfidence, calcTier]);

  // Launch Attack Emulation
  const handleLaunchEmulation = async (scenario: 'ssh_hsinchu' | 'ransom_taichung' | 'scada_kaohsiung') => {
    setEmulationRunning(true);
    setEmulationStep(1);
    setEmulationLogs([]);
    setEmulationResultIoC(null);
    setStixJsonView(null);

    let targetNodeId = 'node-branch-hsinchu';
    let hType: 'Cowrie' | 'Cuckoo' | 'Conpot' = 'Cowrie';
    let attackDesc = 'SSH 暴力破解與 Dropper 載體植入';

    if (scenario === 'ransom_taichung') {
      targetNodeId = 'node-branch-taichung';
      hType = 'Cuckoo';
      attackDesc = 'LockBit 3.0 變種勒索加密二進位檔投遞';
    } else if (scenario === 'scada_kaohsiung') {
      targetNodeId = 'node-branch-kaohsiung';
      hType = 'Conpot';
      attackDesc = '工控 S7/Modbus 非授權指令注入探測';
    }

    try {
      const res = await fetch('/api/v1/active-defense/simulate-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceNodeId: targetNodeId,
          honeypotType: hType,
          attackVector: attackDesc
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmulationResultIoC(data.ioc);
        setEmulationLogs(data.workflowSteps || []);
        
        for (let i = 1; i <= 5; i++) {
          await new Promise(r => setTimeout(r, 650));
          setEmulationStep(i);
        }
        showToast(isZh ? `誘捕成功！提取關鍵 IoC，1-100 評分: ${data.ioc.confidenceScore} 分 (${data.ioc.scoreBreakdown?.riskTier})。` : 'Captured successfully.', 'success');
        fetchIocs();
        fetchArchitecture();
      }
    } catch {
      showToast(isZh ? '模擬演練發生網路異常' : 'Emulation failed due to network error', 'error');
    } finally {
      setEmulationRunning(false);
    }
  };

  // Dispatch SOAR Broadcast
  const handleDispatchSoar = async (dryRun: boolean = false) => {
    const targetIoC = emulationResultIoC || selectedIoC || iocs[0];
    if (!targetIoC) {
      showToast(isZh ? '請先選取欲聯防下發的 IoC 指標' : 'Please select an IoC to broadcast', 'error');
      return;
    }

    try {
      const res = await fetch('/api/v1/active-defense/dispatch-soar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iocId: targetIoC.id,
          dryRun
        })
      });
      const data = await res.json();
      if (data.success) {
        setStixJsonView(JSON.stringify(data.stixPackage, null, 2));
        showToast(
          dryRun
            ? (isZh ? `【Dry-Run 模擬完成】評估 24h 正常連線衝擊數: ${data.auditRecord.impactTrafficHits24h} 筆，安全無誤！` : 'Dry-run evaluation passed.')
            : (isZh ? `【全網聯防下發成功】已向全台 6 處節點邊界防火牆 DAG、EDR 與核心交換器完成自動阻斷！` : 'Global SOAR containment broadcasted successfully!'),
          'success'
        );
        fetchArchitecture();
        fetchIocs();
      } else {
        showToast(data.message || (isZh ? '下發失敗' : 'Dispatch failed'), 'error');
      }
    } catch {
      showToast(isZh ? '執行自動化下發時發生錯誤' : 'Error executing SOAR broadcast', 'error');
    }
  };

  // Handle Approve or Reject
  const handleDecideApproval = async (approvalId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/v1/active-defense/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          operator: 'SOC-Lead-Attended',
          reason: action === 'REJECT' ? 'SOC Tier-2 維運人員確認為內部授權測試或誤報' : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, action === 'APPROVE' ? 'success' : 'info');
        fetchArchitecture();
      } else {
        showToast(data.message || '操作失敗', 'error');
      }
    } catch {
      showToast(isZh ? '連線錯誤，無法完成審批' : 'Network error during approval', 'error');
    }
  };

  // Handle Restore / Un-isolate
  const handleRestoreContainment = async (approvalId?: string, iocId?: string) => {
    try {
      const res = await fetch('/api/v1/active-defense/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          iocId,
          operator: 'SOC-Lead-Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchArchitecture();
      } else {
        showToast(data.message || '解隔離失敗', 'error');
      }
    } catch {
      showToast(isZh ? '解隔離復原失敗' : 'Failed to un-isolate', 'error');
    }
  };

  // Toggle Mode (Auto vs Attended)
  const handleToggleSoarMode = async (newMode: 'AUTO' | 'MANUAL_ATTENDED') => {
    try {
      const res = await fetch('/api/v1/active-defense/security-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soarMode: newMode })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        showToast(
          isZh
            ? `SOAR 聯防模式已切換為：【${newMode === 'AUTO' ? '全自動模式 (Fully Automated)' : '手動/審核模式 (Attended 5-Min SLA)'}】`
            : `SOAR Mode updated to ${newMode}`,
          'success'
        );
      }
    } catch {
      showToast(isZh ? '模式切換失敗' : 'Failed to update mode', 'error');
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-20 right-8 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold backdrop-blur-md",
              toastMessage.type === 'success'
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : toastMessage.type === 'error'
                  ? "bg-red-950/90 border-red-500/40 text-red-200"
                  : "bg-blue-950/90 border-blue-500/40 text-blue-200"
            )}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-red-400" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Banner */}
      <div className={cn(
        "rounded-2xl p-6 border relative overflow-hidden transition-colors shadow-xl",
        isLight
          ? "bg-gradient-to-r from-blue-50/80 via-white to-purple-50/80 border-slate-200"
          : "bg-gradient-to-r from-blue-950/40 via-[#111116] to-purple-950/30 border-blue-900/40 shadow-blue-950/10"
      )}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40 font-mono flex items-center gap-1.5">
                <Radio size={12} className="animate-pulse text-blue-400" />
                <span>NG-SIEM Active Defense & SOAR Mesh</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 font-mono">
                1-100 Threat Scoring · 3 Defense Lines
              </span>
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 border",
                config?.soarMode === 'AUTO'
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              )}>
                <Zap size={11} />
                <span>SOAR Mode: {config?.soarMode === 'AUTO' ? '全自動即時隔離' : '手動/審核模式 (5m SLA)'}</span>
              </span>
            </div>

            <h1 className={cn("text-xl md:text-2xl font-black tracking-tight", isLight ? "text-slate-900" : "text-white")}>
              {isZh ? '主動威脅誘捕、防誤報過濾與 1-100 威脅評分自動化聯防系統' : 'Active Defense Honeypot, False-Positive Shield & 1-100 Threat Scoring SOAR'}
            </h1>
            <p className={cn("text-xs md:text-sm max-w-4xl leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
              {isZh
                ? '分點端獨立部署 Cowrie/Conpot 蜜罐與 Cuckoo/Capa 動態沙箱即時捕獲威脅；總部 Command Node 透過「動態白名單、1-100 威脅加權評分矩陣與四級動態響應劇本」執行防誤報過濾，並支援雙軌 SOAR (全自動 / 5 分鐘 SLA 手動審批)、Palo Alto DAG 與 EDR API 秒級隔離與復原解隔離。'
                : 'Distributed branch honeypots (Cowrie/Conpot) and dynamic sandboxes (Cuckoo/Capa) coupled with HQ 3-layer false positive filtering, 1-100 weighted scoring, and dual-track SOAR DAG containment.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* SOAR Mode Selector Pill */}
            <div className={cn("p-1 rounded-xl border flex items-center gap-1 text-xs font-bold", isLight ? "bg-slate-100 border-slate-200" : "bg-black/60 border-gray-800")}>
              <button
                onClick={() => handleToggleSoarMode('AUTO')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  config?.soarMode === 'AUTO'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : isLight ? "text-slate-600 hover:text-slate-900" : "text-gray-400 hover:text-gray-200"
                )}
              >
                全自動模式
              </button>
              <button
                onClick={() => handleToggleSoarMode('MANUAL_ATTENDED')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  config?.soarMode === 'MANUAL_ATTENDED'
                    ? "bg-amber-600 text-white shadow-sm"
                    : isLight ? "text-slate-600 hover:text-slate-900" : "text-gray-400 hover:text-gray-200"
                )}
              >
                手動審核 (SLA)
              </button>
            </div>

            <button
              onClick={() => {
                fetchArchitecture();
                fetchIocs();
                showToast(isZh ? '已完成全節點狀態與待審批佇列更新' : 'Telemetry synchronized', 'info');
              }}
              disabled={isLoading}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm",
                isLight ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200" : "bg-gray-900/90 hover:bg-gray-800 text-gray-200 border-gray-800"
              )}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>{isZh ? '同步狀態' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Global Cluster Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-800/40">
          <div className={cn("p-3 rounded-xl border transition-colors", isLight ? "bg-white/80 border-slate-200" : "bg-black/30 border-gray-800/60")}>
            <span className={cn("text-[10px] font-semibold block uppercase", isLight ? "text-slate-500" : "text-gray-400")}>
              {isZh ? '第一道防線：白名單' : '1st Line: Whitelist CMDB'}
            </span>
            <span className={cn("text-xs font-bold font-mono mt-1 block text-emerald-500")}>
              {whitelist.length} 組核心規則 (CMDB 維護排程開啟)
            </span>
          </div>

          <div className={cn("p-3 rounded-xl border transition-colors", isLight ? "bg-white/80 border-slate-200" : "bg-black/30 border-gray-800/60")}>
            <span className={cn("text-[10px] font-semibold block uppercase", isLight ? "text-slate-500" : "text-gray-400")}>
              {isZh ? '第二道防線：1-100 評分' : '2nd Line: 1-100 Scoring'}
            </span>
            <span className={cn("text-xs font-bold font-mono mt-1 block text-purple-400")}>
              行為 50% + 信心 25% + 資產 25%
            </span>
          </div>

          <div className={cn("p-3 rounded-xl border transition-colors", isLight ? "bg-white/80 border-slate-200" : "bg-black/30 border-gray-800/60")}>
            <span className={cn("text-[10px] font-semibold block uppercase", isLight ? "text-slate-500" : "text-gray-400")}>
              {isZh ? '第三道防線：SOAR 劇本' : '3rd Line: 4-Tier SOAR'}
            </span>
            <span className={cn("text-xs font-bold font-mono mt-1 block text-blue-400")}>
              4 階響應門檻 (90+ 分啟動全域阻斷)
            </span>
          </div>

          <div className={cn("p-3 rounded-xl border transition-colors", isLight ? "bg-white/80 border-slate-200" : "bg-black/30 border-gray-800/60")}>
            <span className={cn("text-[10px] font-semibold block uppercase", isLight ? "text-slate-500" : "text-gray-400")}>
              {isZh ? '待審批隔離佇列' : 'Attended Queue (SLA)'}
            </span>
            <span className={cn("text-xs font-bold font-mono mt-1 block", approvals.filter(a => a.status === 'PENDING').length > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400")}>
              {approvals.filter(a => a.status === 'PENDING').length} 件待核准 · 5m 超時防護
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className={cn(
        "p-1.5 rounded-2xl border flex flex-wrap items-center gap-1.5 transition-colors shadow-sm",
        isLight ? "bg-slate-100 border-slate-200" : "bg-[#111114] border-gray-800"
      )}>
        {[
          { id: 'architecture', labelZh: '1. 分散式聯防架構與拓撲', labelEn: '1. Architecture & Mesh', icon: Network },
          { id: 'defense_lines', labelZh: '2. 三道防線與 1-100 評分標準說明書', labelEn: '2. 3 Defense Lines & 1-100 Scoring', icon: SlidersHorizontal },
          { id: 'soar_specs', labelZh: '3. SOAR 雙軌控制與防火牆/EDR API 規格書', labelEn: '3. SOAR Dual-Track & API Specs', icon: Code2 },
          { id: 'soar_queue', labelZh: '4. 實時雙軌審批佇列與解隔離復原', labelEn: '4. Attended SLA Queue & Restore', icon: ShieldCheck },
          { id: 'sandbox_emulation', labelZh: '5. 實戰演練與一鍵全網聯防沙盒', labelEn: '5. Live Emulation Sandbox', icon: Zap }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                isActive
                  ? isLight
                    ? "bg-white text-slate-900 shadow border border-slate-200 font-extrabold"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30 font-extrabold"
                  : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              )}
            >
              <Icon size={14} className={isActive ? (isLight ? "text-blue-600" : "text-white") : (isLight ? "text-slate-500" : "text-gray-400")} />
              <span>{isZh ? tab.labelZh : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 分散式架構拓撲 (Architecture) */}
      {/* ========================================================================= */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: HQ Command Node Box */}
            <div className={cn(
              "lg:col-span-4 rounded-2xl p-5 border flex flex-col justify-between transition-colors shadow-lg relative overflow-hidden",
              isLight ? "bg-white border-blue-200 shadow-blue-100" : "bg-[#111116] border-blue-500/30 shadow-blue-950/20"
            )}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl">
                      <Server size={20} />
                    </div>
                    <div>
                      <h3 className={cn("text-sm font-bold tracking-wide", isLight ? "text-slate-900" : "text-white")}>
                        {isZh ? '總部 Command Node' : 'HQ Command Node'}
                      </h3>
                      <span className="text-[10px] font-mono text-blue-500 font-semibold">
                        中央指揮控制核心 · 大腦腦庫
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                    ONLINE
                  </span>
                </div>

                <div className={cn("p-3.5 rounded-xl border text-xs space-y-2", isLight ? "bg-slate-50 border-slate-200" : "bg-black/40 border-gray-800")}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isLight ? "text-slate-500" : "text-gray-400"}>SOAR 調度協調引擎：</span>
                    <span className="font-mono font-bold text-purple-500">Cortex/Shuffle Engine</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isLight ? "text-slate-500" : "text-gray-400"}>威脅情資共享平台：</span>
                    <span className="font-mono font-bold text-amber-500">MISP Enterprise v2.4</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isLight ? "text-slate-500" : "text-gray-400"}>指令簽章核發器：</span>
                    <span className="font-mono font-bold text-blue-500">Ed25519 / HMAC-SHA256</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isLight ? "text-slate-500" : "text-gray-400"}>通信通訊協定：</span>
                    <span className="font-mono font-bold text-emerald-500">mTLS gRPC / TAXII 2.1</span>
                  </div>
                </div>

                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                  {isZh
                    ? '負責接收各分點加密回傳的 IoC 與攻擊特徵，執行「動態白名單、1-100 評分加權計算、四級處置劇本」，經確認後才下發防禦指令至全球節點，杜絕誤報鎖死正常業務。'
                    : 'Coordinates threat telemetry from branch decoys, applies 1-100 weighted scoring and whitelists, and issues cryptographically signed containment commands.'}
                </p>
              </div>

              <div className={cn("mt-4 pt-4 border-t flex items-center justify-between text-[11px]", isLight ? "border-slate-200 text-slate-500" : "border-gray-800 text-gray-500")}>
                <span>{isZh ? '證書狀態：' : 'Cert:'} <strong className="text-emerald-500">RSA 4096 / Ed25519 Valid</strong></span>
                <span>{isZh ? 'Vault 憑證庫：' : 'Vault:'} <strong className="text-purple-400">Palo Alto / Fortinet / EDR Ready</strong></span>
              </div>
            </div>

            {/* Right: Branch Mesh & Decoy Integration */}
            <div className={cn(
              "lg:col-span-8 rounded-2xl p-5 border transition-colors shadow-lg space-y-4",
              isLight ? "bg-white border-slate-200" : "bg-[#111116] border-gray-800"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={cn("text-sm font-bold tracking-wide flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                    <Network size={16} className="text-purple-500" />
                    <span>{isZh ? '分散式分點節點（各配置本地沙箱與蜜罐）' : 'Branch Nodes Mesh'}</span>
                  </h3>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                    {isZh ? '每個分點皆獨立部署本地沙箱與本地蜜罐，於第一時間誘捕並提取 IoC 回傳總部' : 'Local decoys and sandboxes extract threat indicators and sync to Cloud Command Node'}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-500">
                  {nodes.length} Nodes Connected · Zero-Trust mTLS
                </span>
              </div>

              {/* Node Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {nodes.map(node => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={cn(
                        "p-3.5 rounded-xl border text-left cursor-pointer transition-all relative group",
                        isSelected
                          ? isLight
                            ? "bg-blue-50/70 border-blue-400 shadow-md ring-1 ring-blue-400"
                            : "bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500"
                          : isLight
                            ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                            : "bg-black/30 border-gray-800 hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {node.code}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{node.latencyMs}ms</span>
                        </div>
                      </div>

                      <h4 className={cn("text-xs font-bold truncate", isLight ? "text-slate-800" : "text-white")}>
                        {node.name}
                      </h4>
                      <p className={cn("text-[10px] truncate mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                        {node.location} · <span className="font-mono text-purple-400">{node.tier}</span>
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-gray-800/40 flex items-center justify-between text-[10px]">
                        <span className={isLight ? "text-slate-500" : "text-gray-500"}>誘捕與沙箱:</span>
                        <span className="font-mono text-purple-400 font-semibold">{node.installedHoneypots[0]?.split(' ')[0]} + {node.installedSandbox[0]?.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Node Detailed Inspector */}
              {selectedNode && (
                <div className={cn("p-4 rounded-xl border text-xs space-y-3 mt-4 animate-fadeIn", isLight ? "bg-slate-50 border-slate-200" : "bg-black/40 border-gray-800")}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className={cn("font-bold text-sm", isLight ? "text-slate-900" : "text-white")}>
                        {selectedNode.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">({selectedNode.ip}) · {selectedNode.tier}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      mTLS 通道: {selectedNode.mTLSStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className={cn("p-2.5 rounded-lg border", isLight ? "bg-white border-slate-200" : "bg-gray-900/60 border-gray-800")}>
                      <span className="text-[10px] text-purple-400 font-bold block mb-1">🍯 本地部署蜜罐 (Local Honeypot)</span>
                      <ul className="space-y-1 text-[11px] font-mono">
                        {selectedNode.installedHoneypots.map((h, i) => (
                          <li key={i} className="text-gray-300">• {h}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={cn("p-2.5 rounded-lg border", isLight ? "bg-white border-slate-200" : "bg-gray-900/60 border-gray-800")}>
                      <span className="text-[10px] text-amber-400 font-bold block mb-1">🔬 本地動態沙箱 (Local Sandbox)</span>
                      <ul className="space-y-1 text-[11px] font-mono">
                        {selectedNode.installedSandbox.map((s, i) => (
                          <li key={i} className="text-gray-300">• {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={cn("p-2.5 rounded-lg border", isLight ? "bg-white border-slate-200" : "bg-gray-900/60 border-gray-800")}>
                      <span className="text-[10px] text-emerald-400 font-bold block mb-1">🛡️ 聯防執行組件 (Enforcement APIs)</span>
                      <ul className="space-y-1 text-[11px] font-mono">
                        {selectedNode.enforcementComponents.map((e, i) => (
                          <li key={i} className="text-gray-300">• {e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 三道防線與 1-100 威脅評分標準設計說明書 */}
      {/* ========================================================================= */}
      {activeTab === 'defense_lines' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Defense Line 1: Dynamic Whitelist & Filtering */}
          <div className={cn(
            "rounded-2xl p-6 border transition-colors shadow-lg space-y-4",
            isLight ? "bg-white border-slate-200" : "bg-[#111114] border-gray-800"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className={cn("text-base font-bold", isLight ? "text-slate-900" : "text-white")}>
                    {isZh ? '第一道防線：動態白名單與過濾機制 (White-list Filter)' : 'First Line of Defense: Dynamic Whitelist & CMDB Filtering'}
                  </h3>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                    {isZh ? '過濾內部合法自動化工具（Nessus 掃描器、資產盤點腳本、維運人員跳板機）與 CMDB 維護排程，避免誤觸蜜罐導致誤判' : 'Filtering authorized internal automation tools and scheduled CMDB maintenance windows'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                CMDB Active Sync
              </span>
            </div>

            {/* Whitelist Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={cn("border-b uppercase text-[10px] tracking-wider", isLight ? "border-slate-200 text-slate-500 bg-slate-50" : "border-gray-800 text-gray-400 bg-black/40")}>
                    <th className="p-3">白名單項目名稱</th>
                    <th className="p-3">類別與特徵識別</th>
                    <th className="p-3">特徵內容 (IP/MAC/憑證)</th>
                    <th className="p-3">CMDB 資產關聯與維護排程</th>
                    <th className="p-3">防護狀態</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y font-mono", isLight ? "divide-slate-200 text-slate-700" : "divide-gray-800 text-gray-300")}>
                  {whitelist.map(rule => (
                    <tr key={rule.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="p-3 font-bold">{rule.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {rule.type}
                        </span>
                      </td>
                      <td className="p-3 text-purple-400 font-semibold">{rule.value}</td>
                      <td className="p-3 text-[11px]">
                        <div>{rule.cmdbAssetId || '全域通用'}</div>
                        {rule.maintenanceSchedule && (
                          <span className="text-[10px] text-amber-500">
                            每週二/四 02:00-06:00 維護視窗 (自動靜默)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          自動豁免保護
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Defense Line 2: 1-100 Threat Scoring Model Specification */}
          <div className={cn(
            "rounded-2xl p-6 border transition-colors shadow-lg space-y-6",
            isLight ? "bg-white border-slate-200" : "bg-[#111114] border-gray-800"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className={cn("text-base font-bold", isLight ? "text-slate-900" : "text-white")}>
                    {isZh ? '第二道防線：1-100 威脅加權評分矩陣模型 (Scoring Model Matrix)' : 'Second Line: 1-100 Threat Weighted Scoring Model'}
                  </h3>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                    {isZh ? '整合「意圖與行為層 (50%) + 情資信心度層 (25%) + 資產影響度層 (25%)」精密算式，量化攻擊危險程度' : 'Comprehensive multi-layer algorithm: Behavior (50%) + Confidence (25%) + Asset Impact (25%)'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Formula: S = B(50) + C(25) + I(25)
              </span>
            </div>

            {/* Weighted Calculation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={cn("border-b uppercase text-[10px] tracking-wider", isLight ? "border-slate-200 text-slate-500 bg-slate-50" : "border-gray-800 text-gray-400 bg-black/40")}>
                    <th className="p-3">評估維度 (Layer)</th>
                    <th className="p-3">權重佔比</th>
                    <th className="p-3">評估依據與行為指標</th>
                    <th className="p-3">得分區間與計算公式範例</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y font-mono", isLight ? "divide-slate-200 text-slate-700" : "divide-gray-800 text-gray-300")}>
                  <tr className="hover:bg-purple-500/5 transition-colors">
                    <td className="p-3 font-bold text-purple-400">
                      意圖與行為層 (Behavior Layer)
                    </td>
                    <td className="p-3 font-bold text-purple-500">50% (最高 50 分)</td>
                    <td className="p-3">
                      攻擊者在蜜罐/沙箱中的實質操作深度：
                      <br />• 單純 Port Scan 初探：15 分
                      <br />• 帳密嘗試與連線試探：25 分
                      <br />• 成功登入蜜罐執行 Shell 命令：40 分
                      <br />• 沙箱捕捉下載 C2 Dropper：46 分
                      <br />• 沙箱執行勒索加密 / Process Hollowing：50 分
                    </td>
                    <td className="p-3 text-purple-400">
                      得分 = Raw_Behavior_Score (15 ~ 50 分)
                    </td>
                  </tr>

                  <tr className="hover:bg-purple-500/5 transition-colors">
                    <td className="p-3 font-bold text-blue-400">
                      情資信心度層 (Confidence Layer)
                    </td>
                    <td className="p-3 font-bold text-blue-500">25% (最高 25 分)</td>
                    <td className="p-3">
                      特徵在外部威脅情資庫 (CTI) 中的重合度：
                      <br />• AbuseIPDB 信心度、VirusTotal 引擎檢出數
                      <br />• MISP 既有威脅活動關聯度
                      <br />• MITRE ATT&CK 戰術行為匹配成功數
                    </td>
                    <td className="p-3 text-blue-400">
                      得分 = (CTI_Confidence_Pct / 100) * 25 分
                    </td>
                  </tr>

                  <tr className="hover:bg-purple-500/5 transition-colors">
                    <td className="p-3 font-bold text-amber-400">
                      資產影響度層 (Impact Layer)
                    </td>
                    <td className="p-3 font-bold text-amber-500">25% (最高 25 分)</td>
                    <td className="p-3">
                      受攻擊分點與受害目標在企業內部的核心程度：
                      <br />• Tier-1 核心總部 / 資料庫 / 工控 SCADA：25 分
                      <br />• Tier-2 研發中心 / 機密專案節點：22 分
                      <br />• Tier-3 公有雲核心 Gateway：18 分
                      <br />• Tier-4 一般行政辦公分點：12 分
                    </td>
                    <td className="p-3 text-amber-400">
                      得分 = Tier_Weight_Score (12 ~ 25 分)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Interactive Score Simulator Calculator */}
            <div className={cn("p-5 rounded-2xl border space-y-4", isLight ? "bg-slate-50 border-slate-200" : "bg-black/50 border-gray-800")}>
              <div className="flex items-center justify-between">
                <span className={cn("font-bold text-xs flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                  <Sliders size={15} className="text-purple-400" />
                  <span>1-100 威脅評分即時試算器 (Interactive Threat Score Calculator)</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">Real-time Matrix Testing</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">行為層級 (Behavior Layer - 50%):</label>
                  <select
                    value={calcBehavior}
                    onChange={(e: any) => setCalcBehavior(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:border-purple-500",
                      isLight ? "bg-white border-slate-200 text-slate-800" : "bg-gray-900 border-gray-800 text-gray-200"
                    )}
                  >
                    <option value="PORT_SCAN">Port Scan 端口掃描初探 (15分)</option>
                    <option value="AUTH_ATTEMPT">SSH 暴力破解/帳密試探 (25分)</option>
                    <option value="INTERACTIVE_SHELL">成功登入蜜罐執行 Shell 指令 (40分)</option>
                    <option value="C2_DOWNLOAD">沙箱捕獲下載 C2 載體 (46分)</option>
                    <option value="RANSOM_EXEC">沙箱動態執行勒索加密/注入 (50分)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">情資信心度 (Confidence - 25%): {calcConfidence}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={calcConfidence}
                    onChange={(e) => setCalcConfidence(Number(e.target.value))}
                    className="w-full accent-blue-500 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                    <span>Low (10%)</span>
                    <span>High (100%)</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">目標資產影響度 (Impact - 25%):</label>
                  <select
                    value={calcTier}
                    onChange={(e: any) => setCalcTier(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:border-amber-500",
                      isLight ? "bg-white border-slate-200 text-slate-800" : "bg-gray-900 border-gray-800 text-gray-200"
                    )}
                  >
                    <option value="Tier-1-Core">Tier-1 總部核心機房 / SCADA (25分)</option>
                    <option value="Tier-2-R&D">Tier-2 新竹研發中心 (22分)</option>
                    <option value="Tier-3-Cloud">Tier-3 雲端閘道節點 (18分)</option>
                    <option value="Tier-4-General">Tier-4 一般行政辦公分點 (12分)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Calculation Result Box */}
              <div className={cn(
                "p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all",
                calcResult.riskTier === 'CRITICAL_RISK' ? "bg-red-950/30 border-red-500/40 text-red-300" :
                calcResult.riskTier === 'HIGH_RISK' ? "bg-amber-950/30 border-amber-500/40 text-amber-300" :
                calcResult.riskTier === 'MEDIUM_RISK' ? "bg-blue-950/30 border-blue-500/40 text-blue-300" :
                "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-mono">
                      {calcResult.totalScore} / 100 分
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border",
                      calcResult.riskTier === 'CRITICAL_RISK' ? "bg-red-500/20 text-red-400 border-red-500/40" :
                      calcResult.riskTier === 'HIGH_RISK' ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
                      calcResult.riskTier === 'MEDIUM_RISK' ? "bg-blue-500/20 text-blue-400 border-blue-500/40" :
                      "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    )}>
                      {calcResult.riskTier}
                    </span>
                    <span className="text-xs font-mono opacity-80">
                      (行為: {calcResult.behaviorScore}分 + 信心: {calcResult.confidenceScore}分 + 資產: {calcResult.impactScore}分)
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {calcResult.playbookTitle}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="text-[11px] font-bold block text-right opacity-80">自動處置策略:</span>
                  <span className="text-xs font-mono font-bold">
                    {calcResult.totalScore >= 90 ? '觸發 SOAR 全網 DAG API 阻斷' : calcResult.totalScore >= 70 ? '局部節點阻斷 + Tier 2 工單' : calcResult.totalScore >= 40 ? '總部記錄 + 分點加強監控' : '僅本地記錄不廣播'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Defense Line 3: 4 Risk Tiers & Action Playbooks */}
          <div className={cn(
            "rounded-2xl p-6 border transition-colors shadow-lg space-y-4",
            isLight ? "bg-white border-slate-200" : "bg-[#111114] border-gray-800"
          )}>
            <div>
              <h3 className={cn("text-base font-bold", isLight ? "text-slate-900" : "text-white")}>
                {isZh ? '第三道防線：分數區間定義與四級動態響應劇本 (Thresholds & Action Playbooks)' : 'Third Line: 4-Tier Thresholds & Dynamic Action Playbooks'}
              </h3>
              <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                {isZh ? '依據計算出的 1-100 威脅評分，精準觸發對應的資安維運與自動化防禦動作' : 'Defines explicit action playbooks across low, medium, high, and critical risk score intervals'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className={cn("p-4 rounded-xl border space-y-2", isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-800")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>1 - 39 分【低風險 / 疑似性攻擊】</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Tier 1 劇本
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                  • <strong>處置原則</strong>：本地觀察、不觸發總部同步、僅做本地 Log 記錄。
                  <br />• <strong>動作細節</strong>：記錄於本地 VictoriaLogs/Syslog，蜜罐繼續保持通訊以捕獲後續指令；完全不對邊界防火牆下發阻斷，防止外部無差別掃描癱瘓分點日誌庫。
                </p>
              </div>

              <div className={cn("p-4 rounded-xl border space-y-2", isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-800")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>40 - 69 分【中風險 / 局部高可疑攻擊】</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                    Tier 2 劇本
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                  • <strong>處置原則</strong>：總部 Command Node 記錄，通知分點加強監控，但不對全球節點進行封鎖。
                  <br />• <strong>動作細節</strong>：IoC 上傳至總部 MISP 標註為「觀察中」；受害分點之 Zeek 啟動高頻連線追蹤，邊界防火牆進行速率限制（Rate-limiting），但不實施 Null-route 阻斷。
                </p>
              </div>

              <div className={cn("p-4 rounded-xl border space-y-2", isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-800")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>70 - 89 分【高風險 / 已確認的攻擊】</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                    Tier 3 劇本
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                  • <strong>處置原則</strong>：自動同步特徵，在受害分點及鄰近關鍵節點進行自動封鎖、派發工單給 SOC Tier 2 人員。
                  <br />• <strong>動作細節</strong>：特徵同步至鄰近關鍵節點防火牆執行 Address Group 封鎖，EDR 標記惡意雜湊；SOC 派工單（TheHive/Jira）由維運工程師進行攻擊拓撲覆核。
                </p>
              </div>

              <div className={cn("p-4 rounded-xl border space-y-2", isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-800")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>90 - 100 分【極度危險 / 緊急全面聯防】</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded">
                    Tier 4 SOAR 全網
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                  • <strong>處置原則</strong>：觸發 SOAR 自動化劇本，Command Node 直接下放防禦指令至全球/全分點所有節點，實施即時聯防封鎖！
                  <br />• <strong>動作細節</strong>：調用 Palo Alto DAG / FortiGate API 秒級加入動態惡意群組，調用 CrowdStrike Falcon 隔離受害主機，核心交換器切換 802.1X VLAN 隔離，阻斷橫向擴散。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SOAR 雙軌控制與防火牆/EDR API 規格書 */}
      {/* ========================================================================= */}
      {activeTab === 'soar_specs' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dual-Track Workflow Logic Explanation */}
          <div className={cn(
            "rounded-2xl p-6 border transition-colors shadow-lg space-y-5",
            isLight ? "bg-white border-slate-200" : "bg-[#111114] border-gray-800"
          )}>
            <div>
              <h3 className={cn("text-base font-bold", isLight ? "text-slate-900" : "text-white")}>
                {isZh ? 'SOAR 雙軌決策流程控制邏輯 (Dual-Track Workflow Control)' : 'SOAR Dual-Track Control Logic'}
              </h3>
              <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                {isZh ? '支援「全自動模式」與「手動/審核模式 (含 5 分鐘 SLA 逾時自動處置)」兩種企業級響應機制' : 'Fully Automated Mode vs Attended Mode with 5-minute SLA Timeout Escalation'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className={cn("p-4 rounded-xl border space-y-2.5", isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-800")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                    <Zap size={14} />
                    <span>模式 A：全自動模式 (Fully Automated Mode)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Zero-Touch
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                  當 Command Node 經 1-100 模型計算威脅達到 90 分以上時，SOAR 引擎<strong>完全不經過人工審批</strong>，立即簽署 Ed25519 數位指令，調用全台與全球分點 Palo Alto DAG / FortiGate / CrowdStrike API 實施秒級全網阻斷。
                </p>
                <div className="p-2.5 rounded bg-black/40 font-mono text-[10px] text-gray-300">
                  <code>if threat_score &gt;= 90 and mode == &quot;AUTO&quot;: execute_global_containment()</code>
                </div>
              </div>

              <div className={cn("p-4 rounded-xl border space-y-2.5", isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-800")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>模式 B：手動/審核模式 (Attended Mode with 5-min SLA)</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                    5-Min SLA Window
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                  當達到 90 分以上時，Command Node 發送 Slack/Teams 卡片或 Web 彈窗，提供【允許隔離 (Approve)】與【忽略 (Ignore)】按鈕。<strong>若 5 分鐘內無人點擊，自動啟動降級處置或語音電話通知，避免延誤黃金應變時機！</strong>
                </p>
                <div className="p-2.5 rounded bg-black/40 font-mono text-[10px] text-gray-300">
                  <code>wait_for_approval(timeout=300) -&gt; on_timeout: auto_escalate_or_quarantine()</code>
                </div>
              </div>
            </div>
          </div>

          {/* Code Snippets & API Implementations */}
          <div className={cn(
            "rounded-2xl p-6 border transition-colors shadow-lg space-y-4",
            isLight ? "bg-white border-slate-200" : "bg-[#111114] border-gray-800"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={cn("text-base font-bold flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                  <Code2 size={16} className="text-purple-400" />
                  <span>主流防火牆與 EDR 聯防 API 程式碼實作範例 (Python & Webhook JSON)</span>
                </h3>
                <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                  包含 Palo Alto Networks (PAN-OS DAG)、Fortinet (FortiGate)、CrowdStrike Falcon、Microsoft Defender 及標準 Webhook JSON
                </p>
              </div>

              {/* Sub-tab pills */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {[
                  { id: 'pan_dag', label: 'Palo Alto (DAG)' },
                  { id: 'fortigate', label: 'Fortinet (AddrGrp)' },
                  { id: 'crowdstrike', label: 'CrowdStrike (EDR)' },
                  { id: 'defender', label: 'MS Defender (EDR)' },
                  { id: 'webhook_json', label: 'SOAR Webhook JSON' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setApiCodeTab(item.id as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-mono font-bold transition-all text-[11px]",
                      apiCodeTab === item.id
                        ? "bg-purple-600 text-white shadow-sm"
                        : isLight ? "bg-slate-100 text-slate-600 hover:text-slate-900" : "bg-gray-800 text-gray-300 hover:text-white"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Content Display */}
            <div className="relative">
              {apiCodeTab === 'pan_dag' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400 font-mono">
                      【Palo Alto PAN-OS】使用 Dynamic Address Group (DAG) 註冊 IP 標籤 (無需 Commit，秒級生效)
                    </span>
                    <button
                      onClick={() => copyCode(PALO_ALTO_PYTHON_CODE, 'pan_dag')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs font-mono flex items-center gap-1"
                    >
                      {copiedCodeId === 'pan_dag' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedCodeId === 'pan_dag' ? '已複製' : '複製 Python 碼'}</span>
                    </button>
                  </div>
                  <pre className={cn("p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 custom-scrollbar leading-relaxed", isLight ? "bg-slate-50 text-slate-800 border border-slate-200" : "bg-[#090a0f] text-emerald-400 border border-gray-800")}>
                    {PALO_ALTO_PYTHON_CODE}
                  </pre>
                </div>
              )}

              {apiCodeTab === 'fortigate' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400 font-mono">
                      【Fortinet FortiGate】FortiOS REST API：新增 Address 物件並塞入封鎖群組
                    </span>
                    <button
                      onClick={() => copyCode(FORTINET_PYTHON_CODE, 'fortigate')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs font-mono flex items-center gap-1"
                    >
                      {copiedCodeId === 'fortigate' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedCodeId === 'fortigate' ? '已複製' : '複製 Python 碼'}</span>
                    </button>
                  </div>
                  <pre className={cn("p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 custom-scrollbar leading-relaxed", isLight ? "bg-slate-50 text-slate-800 border border-slate-200" : "bg-[#090a0f] text-emerald-400 border border-gray-800")}>
                    {FORTINET_PYTHON_CODE}
                  </pre>
                </div>
              )}

              {apiCodeTab === 'crowdstrike' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400 font-mono">
                      【CrowdStrike Falcon】調用 API 隔離受害端點主機 (Device Isolate) 或全球封鎖惡意 SHA256
                    </span>
                    <button
                      onClick={() => copyCode(CROWDSTRIKE_PYTHON_CODE, 'crowdstrike')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs font-mono flex items-center gap-1"
                    >
                      {copiedCodeId === 'crowdstrike' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedCodeId === 'crowdstrike' ? '已複製' : '複製 Python 碼'}</span>
                    </button>
                  </div>
                  <pre className={cn("p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 custom-scrollbar leading-relaxed", isLight ? "bg-slate-50 text-slate-800 border border-slate-200" : "bg-[#090a0f] text-emerald-400 border border-gray-800")}>
                    {CROWDSTRIKE_PYTHON_CODE}
                  </pre>
                </div>
              )}

              {apiCodeTab === 'defender' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400 font-mono">
                      【Microsoft Defender for Endpoint】MS Graph API：主機網路隔離與全域 IOC 封鎖
                    </span>
                    <button
                      onClick={() => copyCode(DEFENDER_PYTHON_CODE, 'defender')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs font-mono flex items-center gap-1"
                    >
                      {copiedCodeId === 'defender' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedCodeId === 'defender' ? '已複製' : '複製 Python 碼'}</span>
                    </button>
                  </div>
                  <pre className={cn("p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 custom-scrollbar leading-relaxed", isLight ? "bg-slate-50 text-slate-800 border border-slate-200" : "bg-[#090a0f] text-emerald-400 border border-gray-800")}>
                    {DEFENDER_PYTHON_CODE}
                  </pre>
                </div>
              )}

              {apiCodeTab === 'webhook_json' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400 font-mono">
                      【Command Node ➔ SOAR 標準 Webhook Payload】包含事件 ID、分點、精確分數、觸發源與 DAG 群組
                    </span>
                    <button
                      onClick={() => copyCode(STANDARD_SOAR_WEBHOOK_JSON, 'webhook_json')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs font-mono flex items-center gap-1"
                    >
                      {copiedCodeId === 'webhook_json' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedCodeId === 'webhook_json' ? '已複製' : '複製 JSON'}</span>
                    </button>
                  </div>
                  <pre className={cn("p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 custom-scrollbar leading-relaxed", isLight ? "bg-slate-50 text-slate-800 border border-slate-200" : "bg-[#090a0f] text-cyan-400 border border-gray-800")}>
                    {STANDARD_SOAR_WEBHOOK_JSON}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 實時雙軌審核佇列、解隔離復原與 Vault 憑證庫 */}
      {/* ========================================================================= */}
      {activeTab === 'soar_queue' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Attended Mode Approval Queue */}
          <div className={cn(
            "rounded-2xl p-6 border transition-colors shadow-lg space-y-4",
            isLight ? "bg-white border-slate-200" : "bg-[#111114] border-gray-800"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={cn("text-base font-bold flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                  <Clock size={16} className="text-amber-400 animate-pulse" />
                  <span>{isZh ? '手動審核佇列 (Attended SOAR Queue with 5-Minute SLA)' : 'Attended Approval Queue'}</span>
                </h3>
                <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                  {isZh ? '當威脅達到 90+ 分且設為手動審核時，系統自動啟動 5 分鐘 SLA 倒數，等待 SOC 人員一鍵確認或自動升級' : 'Pending items with real-time countdown. Once approved, API dispatches DAG blocklist to all nodes'}
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-amber-500">
                SLA 逾時機制：5 分鐘無人點擊自動降級處置或發送電話簡訊
              </span>
            </div>

            {approvals.length === 0 ? (
              <div className={cn("p-8 rounded-xl border text-center text-xs text-gray-500", isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-800")}>
                目前無待審批項目。可至「實戰演練」觸發 90+ 分攻擊事件進行模擬！
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map(appr => {
                  const expireTimestamp = new Date(appr.slaExpiresAt).getTime();
                  const remainingSec = Math.max(0, Math.floor((expireTimestamp - nowTime) / 1000));
                  const isPending = appr.status === 'PENDING';

                  return (
                    <div
                      key={appr.id}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all",
                        isPending
                          ? isLight ? "bg-amber-50/70 border-amber-300 shadow-sm" : "bg-amber-950/20 border-amber-500/40"
                          : appr.status === 'RESTORED'
                            ? isLight ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-black/40 border-gray-800 text-gray-500"
                            : isLight ? "bg-emerald-50/70 border-emerald-300" : "bg-emerald-950/20 border-emerald-500/40"
                      )}
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-purple-400">{appr.id}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase",
                            appr.status === 'PENDING' ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
                            appr.status === 'RESTORED' ? "bg-gray-800 text-gray-400 border-gray-700" :
                            "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          )}>
                            {appr.status}
                          </span>
                          <span className="text-xs font-mono font-bold text-red-500">
                            精確評分: {appr.totalScore} 分 (CRITICAL)
                          </span>
                        </div>

                        <h4 className={cn("text-xs md:text-sm font-bold font-mono", isLight ? "text-slate-900" : "text-white")}>
                          [{appr.iocType.toUpperCase()}] {appr.iocValue} · {appr.threatType}
                        </h4>
                        <p className={cn("text-xs", isLight ? "text-slate-600" : "text-gray-400")}>
                          觸發分點: {appr.sourceNodeName} · 防火牆 DAG: <code className="text-blue-500 font-mono font-bold">{appr.affectedComponents.dagGroup}</code>
                        </p>
                      </div>

                      {/* Right Action & SLA countdown */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        {isPending && (
                          <div className="text-left sm:text-right font-mono">
                            <span className="text-[10px] text-gray-500 block">SLA 剩餘倒數:</span>
                            <span className={cn("text-xs font-bold", remainingSec < 60 ? "text-red-500 animate-ping" : "text-amber-400")}>
                              {Math.floor(remainingSec / 60)}分 {remainingSec % 60}秒
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleDecideApproval(appr.id, 'APPROVE')}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                              >
                                <Check size={13} />
                                <span>允許全網隔離 (Approve)</span>
                              </button>
                              <button
                                onClick={() => handleDecideApproval(appr.id, 'REJECT')}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-xl text-xs font-bold transition-all"
                              >
                                忽略 (Ignore)
                              </button>
                            </>
                          ) : appr.status === 'APPROVED' ? (
                            <button
                              onClick={() => handleRestoreContainment(appr.id)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
                            >
                              <RotateCcw size={13} />
                              <span>一鍵解隔離復原 (Restore Playbook)</span>
                            </button>
                          ) : (
                            <span className="text-xs font-mono text-gray-400">已結案或已解除</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reversal / Un-isolate Restore Playbook & Vault Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Restore Playbook Specification */}
            <div className={cn(
              "rounded-2xl p-5 border transition-colors shadow-lg space-y-3",
              isLight ? "bg-white border-slate-200" : "bg-[#111116] border-gray-800"
            )}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <RotateCcw size={18} />
                </div>
                <h4 className={cn("text-sm font-bold", isLight ? "text-slate-900" : "text-white")}>
                  解隔離復原劇本設計 (Restore / Un-isolate Playbook)
                </h4>
              </div>
              <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                當資安事件調查完畢或確認攻擊已平息，SOAR 引擎支援一鍵「解隔離復原劇本」：
                <br />1. <strong>邊界防火牆</strong>：調用 API 將該 IP 自 Palo Alto DAG / FortiGate 動態群組中移除。
                <br />2. <strong>端點 EDR</strong>：調用 CrowdStrike Falcon / Defender API 對受害主機下發 `un-isolate`，恢復其內部區域網路連線。
                <br />3. <strong>核心交換器</strong>：透過 802.1X NAC 將主機動態劃回原業務 VLAN。
              </p>
              <div className="p-3 rounded-xl bg-black/40 font-mono text-[10px] text-emerald-400">
                Playbook ID: SOAR-PB-RESTORE-REVERSE-V2 · Zero Traffic Loss
              </div>
            </div>

            {/* Vault Key Management */}
            <div className={cn(
              "rounded-2xl p-5 border transition-colors shadow-lg space-y-3",
              isLight ? "bg-white border-slate-200" : "bg-[#111116] border-gray-800"
            )}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl">
                  <Key size={18} />
                </div>
                <h4 className={cn("text-sm font-bold", isLight ? "text-slate-900" : "text-white")}>
                  Command Node 憑證保險箱 (Vault API Key Manager)
                </h4>
              </div>
              <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-gray-400")}>
                Command Node 不以明文儲存任何防火牆或 EDR 帳密。所有連線金鑰存放於內部 HashiCorp Vault 相容之加密金鑰保險箱：
                <br />• Palo Alto API Key: <code className="text-purple-400">vault:secret/data/paloalto/api_key (AES-256)</code>
                <br />• FortiGate Token: <code className="text-purple-400">vault:secret/data/fortigate/token (AES-256)</code>
                <br />• CrowdStrike OAuth2: <code className="text-purple-400">Client Secret 自動 90 天自動輪轉 (Auto-rotate)</code>
              </p>
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-500 pt-1">
                <span>Vault 狀態: Sealed / Transit Encrypted</span>
                <span>Audit: 100% Zero-Trust Logging</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 實戰演練與一鍵全網聯防沙盒 */}
      {/* ========================================================================= */}
      {activeTab === 'sandbox_emulation' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Emulation Controls */}
          <div className={cn(
            "rounded-2xl p-6 border transition-colors shadow-lg space-y-5",
            isLight ? "bg-white border-slate-200" : "bg-[#111114] border-gray-800"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={cn("text-base font-bold", isLight ? "text-slate-900" : "text-white")}>
                  {isZh ? '主動誘捕與全網聯防實戰演練沙盒 (Live Emulation Sandbox)' : 'Live Attack Emulation Sandbox'}
                </h3>
                <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-gray-400")}>
                  {isZh ? '選擇不同分點攻擊情境，即時觀察「蜜罐/沙箱誘捕 ➔ 1-100 評分 ➔ mTLS 回傳 ➔ SOAR 雙軌下放 ➔ 全網 DAG 阻斷」' : 'Experience the closed-loop defense: decoy trap, 1-100 scoring, STIX bundle, and global SOAR DAG containment'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleLaunchEmulation('ssh_hsinchu')}
                  disabled={emulationRunning}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play size={12} />
                  <span>情境 A: 新竹研發節點 (SSH 爆破/Cowrie)</span>
                </button>

                <button
                  onClick={() => handleLaunchEmulation('ransom_taichung')}
                  disabled={emulationRunning}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play size={12} />
                  <span>情境 B: 台中資料中心 (勒索檔案/Cuckoo)</span>
                </button>

                <button
                  onClick={() => handleLaunchEmulation('scada_kaohsiung')}
                  disabled={emulationRunning}
                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play size={12} />
                  <span>情境 C: 高雄工廠 (Modbus工控/Conpot)</span>
                </button>
              </div>
            </div>

            {/* Real-time Timeline Flow Steps */}
            {emulationLogs.length > 0 && (
              <div className="space-y-3 pt-3">
                <h4 className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-slate-600" : "text-gray-400")}>
                  即時自動化處置時序進度追蹤 (Real-time Playbook Sequence):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {emulationLogs.map((log, index) => {
                    const stepNum = index + 1;
                    const isDone = emulationStep >= stepNum;
                    const isCurrent = emulationStep === stepNum;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-3.5 rounded-xl border text-xs space-y-1.5 transition-all relative overflow-hidden",
                          isCurrent
                            ? "bg-blue-500/20 border-blue-500 shadow-md ring-1 ring-blue-500"
                            : isDone
                              ? isLight ? "bg-emerald-50 border-emerald-200 text-slate-800" : "bg-emerald-950/20 border-emerald-500/30 text-gray-200"
                              : isLight ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60" : "bg-black/30 border-gray-800 text-gray-500 opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded", isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-400")}>
                            Step {stepNum}
                          </span>
                          {isDone ? (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-500" />
                          )}
                        </div>

                        <h5 className="font-bold text-[11px] leading-tight truncate">
                          {log.title}
                        </h5>
                        <p className="text-[10px] leading-relaxed line-clamp-3 opacity-90">
                          {log.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extracted IoC & Dispatch Controls */}
            {emulationResultIoC && (
              <div className={cn(
                "p-5 rounded-2xl border space-y-4 animate-fadeIn mt-4",
                isLight ? "bg-blue-50/50 border-blue-200" : "bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border-blue-500/40"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase font-mono">
                        成功提取攻擊特徵 (Extracted Threat IoC)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">
                        評分: {emulationResultIoC.confidenceScore} 分 ({emulationResultIoC.scoreBreakdown?.riskTier})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={cn("text-base font-black font-mono", isLight ? "text-slate-900" : "text-white")}>
                        [{emulationResultIoC.type.toUpperCase()}] {emulationResultIoC.value}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDispatchSoar(true)}
                      className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
                    >
                      <Eye size={13} className="text-cyan-400" />
                      <span>Dry-Run 模擬衝擊評估</span>
                    </button>

                    <button
                      onClick={() => handleDispatchSoar(false)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-900/30 flex items-center gap-1.5"
                    >
                      <Zap size={13} />
                      <span>一鍵全網節點自動化下放聯防 (Global Push)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className={cn("p-3 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-black/40 border-gray-800")}>
                    <span className="text-[10px] text-gray-400 block">攻擊來源與誘捕引擎:</span>
                    <span className="font-semibold">{emulationResultIoC.sourceNodeName} ({emulationResultIoC.honeypotOrSandbox})</span>
                  </div>
                  <div className={cn("p-3 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-black/40 border-gray-800")}>
                    <span className="text-[10px] text-gray-400 block">威脅行為分類:</span>
                    <span className="font-semibold text-purple-400">{emulationResultIoC.threatType}</span>
                  </div>
                  <div className={cn("p-3 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-black/40 border-gray-800")}>
                    <span className="text-[10px] text-gray-400 block">MITRE ATT&CK 戰術標籤:</span>
                    <span className="font-mono text-emerald-400 font-bold">{emulationResultIoC.mitreTactic}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STIX 2.1 JSON Inspection Viewer */}
            {stixJsonView && (
              <div className={cn("p-5 rounded-2xl border space-y-3 animate-fadeIn", isLight ? "bg-slate-50 border-slate-200" : "bg-black/60 border-gray-800")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <FileCode size={16} className="text-emerald-400" />
                    <span className={isLight ? "text-slate-900" : "text-white"}>
                      OASIS STIX 2.1 封裝與 mTLS 數位簽名下發內容 (STIX Threat Bundle Inspector)
                    </span>
                  </div>
                  <button
                    onClick={() => copyCode(stixJsonView, 'stix_view')}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"
                  >
                    {copiedCodeId === 'stix_view' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedCodeId === 'stix_view' ? '已複製' : '複製 STIX JSON'}</span>
                  </button>
                </div>

                <pre className={cn("p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 custom-scrollbar", isLight ? "bg-white border border-slate-200 text-slate-800" : "bg-[#090a0f] border border-gray-800 text-emerald-400")}>
                  {stixJsonView}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Real-world Python & JSON Code Snippets for Palo Alto, Fortinet, CrowdStrike, Defender
// =========================================================================

const PALO_ALTO_PYTHON_CODE = `# ==============================================================================
# NG-SIEM SOAR Playbook: Palo Alto Networks (PAN-OS) Dynamic Address Group (DAG)
# 核心優勢：直接透過 API 動態註冊 IP Tag，免 Commit、免 Reload、秒級阻斷生效
# ==============================================================================
import requests
import xml.etree.ElementTree as ET

PAN_FW_IP = "192.168.10.1"
PAN_API_KEY = "LUFRPT1XbWd..." # 自 Vault 加密庫讀取
DAG_TAG_NAME = "DAG_CRITICAL_MALICIOUS_IPS"

def register_ip_to_dag(target_ip: str, action: str = "register"):
    """
    將攻擊者 IP 動態註冊進 Palo Alto DAG (無需 Commit)
    action: 'register' (封鎖) 或 'unregister' (解隔離復原)
    """
    url = f"https://{PAN_FW_IP}/api/"
    
    # PAN-OS XML API Payload for Dynamic Tag Registration
    xml_payload = f"""
    <uid-message>
      <version>2.0</version>
      <type>update</type>
      <payload>
        <{action}>
          <entry ip="{target_ip}">
            <tag>
              <member>{DAG_TAG_NAME}</member>
            </tag>
          </entry>
        </{action}>
      </payload>
    </uid-message>
    """
    
    params = {
        "type": "user-id",
        "action": "set",
        "key": PAN_API_KEY,
        "cmd": xml_payload
    }
    
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    try:
        response = requests.post(url, params=params, verify=False, timeout=5)
        root = ET.fromstring(response.text)
        status = root.attrib.get("status")
        
        if status == "success":
            print(f"[PAN-OS SOAR] 成功將 IP {target_ip} 加入 DAG: {DAG_TAG_NAME}！")
            return {"success": True, "ip": target_ip, "dag": DAG_TAG_NAME}
        else:
            print(f"[PAN-OS SOAR] 失敗: {response.text}")
            return {"success": False, "error": response.text}
    except Exception as e:
        print(f"[PAN-OS SOAR] 連線異常: {str(e)}")
        return {"success": False, "error": str(e)}

# 執行範例:
# register_ip_to_dag("185.220.101.45", action="register")
`;

const FORTINET_PYTHON_CODE = `# ==============================================================================
# NG-SIEM SOAR Playbook: Fortinet (FortiGate) REST API Address Group Containment
# 核心優勢：自動創建 Address Object 並加入已存在之阻斷 Policy Address Group
# ==============================================================================
import requests

FORTIGATE_IP = "10.20.1.1"
FORTIGATE_TOKEN = "abcde12345..." # 自 Vault 加密庫讀取
ADDR_GROUP_NAME = "GRP_AUTO_CONTAINMENT"

def block_ip_on_fortigate(target_ip: str):
    """
    1. 於 FortiGate 建立 Address Object
    2. 將該物件附加加入 GRP_AUTO_CONTAINMENT 群組
    """
    headers = {
        "Authorization": f"Bearer {FORTIGATE_TOKEN}",
        "Content-Type": "application/json"
    }
    
    obj_name = f"SOAR_BLK_{target_ip.replace('.', '_')}"
    
    # Step 1: Create Address Object
    create_addr_url = f"https://{FORTIGATE_IP}/api/v2/cmdb/firewall/address"
    addr_payload = {
        "name": obj_name,
        "type": "ipmask",
        "subnet": f"{target_ip}/32",
        "comment": "NG-SIEM SOAR Automated Decoy Blocklist"
    }
    
    res1 = requests.post(create_addr_url, headers=headers, json=addr_payload, verify=False, timeout=5)
    
    # Step 2: Append to Address Group
    grp_url = f"https://{FORTIGATE_IP}/api/v2/cmdb/firewall/addrgrp/{ADDR_GROUP_NAME}/member"
    grp_payload = {"name": obj_name}
    res2 = requests.post(grp_url, headers=headers, json=grp_payload, verify=False, timeout=5)
    
    if res2.status_code in [200, 201]:
        print(f"[FortiGate SOAR] 成功將 {target_ip} 加入群組 {ADDR_GROUP_NAME}！")
        return {"success": True, "object": obj_name}
    else:
        return {"success": False, "response": res2.text}

# 執行範例:
# block_ip_on_fortigate("185.220.101.45")
`;

const CROWDSTRIKE_PYTHON_CODE = `# ==============================================================================
# NG-SIEM SOAR Playbook: CrowdStrike Falcon EDR Host Quarantine & Global Hash Block
# 核心優勢：對受害主機下發網路隔離，或對惡意 SHA256 建立全域阻斷 Indicator
# ==============================================================================
import requests

FALCON_BASE_URL = "https://api.crowdstrike.com"
CLIENT_ID = "falcon_client_id"
CLIENT_SECRET = "falcon_secret"

def get_falcon_token():
    url = f"{FALCON_BASE_URL}/oauth2/token"
    res = requests.post(url, data={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET})
    return res.json().get("access_token")

def isolate_host_device(device_id: str, action: str = "isolate"):
    """
    對特定受害端點主機實施網路隔離 (action: 'isolate' 或 'unisolate')
    """
    token = get_falcon_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    url = f"{FALCON_BASE_URL}/devices/entities/devices-actions/v1?action_name={action}"
    payload = {"ids": [device_id]}
    
    res = requests.post(url, headers=headers, json=payload, timeout=8)
    return res.json()

def block_sha256_hash(sha256_hash: str):
    """
    將沙箱萃取之惡意二進位檔案 SHA256 寫入 Falcon IOC 全球阻斷庫
    """
    token = get_falcon_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    url = f"{FALCON_BASE_URL}/indicators/entities/iocs/v1"
    payload = {
        "indicators": [{
            "type": "sha256",
            "value": sha256_hash,
            "policy": "prevent",
            "action": "prevent_silent",
            "severity": "critical",
            "comment": "NG-SIEM Dynamic Sandbox LockBit Extraction"
        }]
    }
    
    res = requests.post(url, headers=headers, json=payload, timeout=8)
    return res.json()

# 執行範例:
# isolate_host_device("e3b0c44298fc1c149afbf4c8996fb924", action="isolate")
# block_sha256_hash("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
`;

const DEFENDER_PYTHON_CODE = `# ==============================================================================
# NG-SIEM SOAR Playbook: Microsoft Defender for Endpoint (MDE) Graph API
# 核心優勢：呼叫 MDE Graph API 進行受害機器隔離與 Indicators 封鎖
# ==============================================================================
import requests

TENANT_ID = "your-tenant-id"
CLIENT_ID = "your-client-id"
CLIENT_SECRET = "your-client-secret"

def get_graph_token():
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
        "scope": "https://api.securitycenter.microsoft.com/.default"
    }
    res = requests.post(url, data=data)
    return res.json().get("access_token")

def isolate_defender_machine(machine_id: str, comment: str = "NG-SIEM SOAR Automated Quarantine"):
    """
    調用 Defender API 對指定機器 ID 執行網路隔離
    """
    token = get_graph_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    url = f"https://api.securitycenter.microsoft.com/api/machines/{machine_id}/isolate"
    payload = {
        "Comment": comment,
        "IsolationType": "Full" # 可選 Full 或 Selective (允許 Outlook/Teams)
    }
    
    res = requests.post(url, headers=headers, json=payload, timeout=8)
    return res.json()

# 執行範例:
# isolate_defender_machine("machine-guid-12345", comment="Ransomware memory injection detected")
`;

const STANDARD_SOAR_WEBHOOK_JSON = `{
  "event_id": "SOAR-EVT-20261109-9041",
  "timestamp": "2026-11-09T03:45:00.122Z",
  "source_branch": {
    "id": "node-branch-hsinchu",
    "name": "新竹科學園區研發節點 (Hsinchu R&D Branch)",
    "ip": "10.20.1.10",
    "tier": "Tier-2-R&D"
  },
  "threat_assessment": {
    "exact_score": 96,
    "risk_tier": "CRITICAL_RISK",
    "trigger_source": "Cowrie SSH 誘捕蜜罐",
    "threat_type": "SSH 交互式暴力破解與即時惡意腳本下載",
    "mitre_tactic": "T1110.001 (Brute Force: Password Guessing)"
  },
  "score_matrix_breakdown": {
    "behavior_score": 48,
    "confidence_score": 24,
    "impact_score": 24,
    "total_score": 96
  },
  "ioc_details": {
    "type": "IPV4",
    "value": "185.220.101.45",
    "misp_event_id": "MISP-2026-TW-0418",
    "cuckoo_analysis_id": null
  },
  "soar_policy": {
    "mode": "MANUAL_ATTENDED",
    "requires_human_approval": true,
    "sla_timeout_seconds": 300,
    "auto_escalate_on_timeout": true,
    "firewall_dag_group": "DAG_CRITICAL_MALICIOUS_IPS",
    "fortigate_addr_group": "GRP_AUTO_CONTAINMENT",
    "edr_action": "EDR_HOST_ISOLATION_AND_HASH_BLOCK",
    "signature": {
      "algorithm": "Ed25519",
      "key_fingerprint": "SHA256:d8a9f4c3b2e1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3",
      "nonce": "a8f102c4b5e6",
      "valid_seconds": 60
    }
  }
}`;

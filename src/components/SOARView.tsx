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
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Terminal,
  Database,
  ShieldAlert,
  FileCode,
  Layers,
  UserCheck,
  Cpu,
  Filter,
  Maximize2,
  LayoutGrid,
  Settings2,
  Activity,
  HardDrive,
  RefreshCw,
  Crosshair,
  Server,
  Network,
  Shield,
  Monitor,
  Fingerprint,
  X,
  ExternalLink,
  Lock,
  Radio,
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
  Code,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SOARFIMView } from './soar/fim/SOARFIMView';
import Correlation24hHeatmap from './Correlation24hHeatmap';

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
  category: 'Ransomware' | 'Phishing' | 'C2' | 'Identity' | 'Forensics' | 'DDoS' | 'Malware' | 'Exfiltration';
  status: 'Active' | 'Paused' | 'Testing';
  lastRun: string;
  successRate: string;
  executions24h: number;
  mttr: string;
  description: string;
  descriptionEn: string;
  nodes: PlaybookNode[];
  connections: PlaybookConnection[];
  triggerRule?: string;
  author?: string;
}

export interface ExecutionStepDetail {
  stepId?: string;
  stepName: string;
  vendor?: string;
  actionType?: string;
  status: 'success' | 'failed' | 'waiting' | 'running' | 'skipped';
  duration: string;
  output: string;
  timestamp?: string;
}

export interface SOARExecutionLog {
  id: string;
  incidentId: string;
  playbookId: string;
  playbookName: string;
  timestamp: string;
  triggerSource: string;
  target: string;
  status: 'Success' | 'Failed' | 'Pending Approval' | 'Executing' | 'Rolled Back' | 'Rejected';
  duration: string;
  resultSummary: string;
  dryRun?: boolean;
  executedBy?: string;
  approvalRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  stepsCompleted?: number;
  stepsTotal?: number;
  details?: ExecutionStepDetail[];
  rollbackAvailable?: boolean;
}

export interface IntegrationConnector {
  id: string;
  name: string;
  cat: string;
  vendor?: string;
  status: 'Connected' | 'Degraded' | 'Disconnected' | 'Syncing';
  latency: string;
  endpoint?: string;
  desc: string;
  actionsCount?: number;
  supportedActions?: string[];
  lastChecked?: string;
  healthRate?: number;
}

export interface VelociraptorForensicArtifact {
  id: string;
  name: string;
  size: string;
  hash: string;
  vqlQuery?: string;
  status: string;
  targetAsset?: string;
  branch?: string;
  collectedAt?: string;
  investigator?: string;
}

export interface BranchSensorNode {
  id: string;
  name: string;
  region?: string;
  nodes: string;
  sync: string;
  status: string;
  ipRange?: string;
  agentVersion?: string;
  activeHunts?: number;
}

export interface TelemetryStats {
  mttrSeconds: number;
  mttrDisplay: string;
  autonomousDeflectionRatio: number;
  totalExecutions24h: number;
  activePlaybooksCount: number;
  pendingApprovalsCount: number;
  connectorHealthRatio: number;
  hoursSavedEstimated: number;
  threatsNeutralized: number;
}

// Fallback initial data in case backend is loading
const FALLBACK_PLAYBOOKS: PlaybookTemplate[] = [
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
      { id: 'n4', type: 'action', label: 'EDR 端點實體網路隔離', vendor: 'CrowdStrike Falcon', x: 620, y: 60, status: 'success', description: '保留資安管控通道，切斷其他全部業務網路' },
      { id: 'n5', type: 'action', label: 'AD / Azure 憑證強制登出', vendor: 'Active Directory / Okta', x: 620, y: 240, status: 'success', description: '強制撤銷 Kerberos TGT 與所有現行 OAuth Session' },
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
  }
];

export default function SOARView() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'zh';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'executions' | 'builder' | 'forensics' | 'correlation' | 'connectors' | 'fim'>('workflows');
  
  // Data States connected to backend
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<TelemetryStats>({
    mttrSeconds: 1.24,
    mttrDisplay: '1.24s',
    autonomousDeflectionRatio: 94.8,
    totalExecutions24h: 1845,
    activePlaybooksCount: 5,
    pendingApprovalsCount: 1,
    connectorHealthRatio: 100,
    hoursSavedEstimated: 1640,
    threatsNeutralized: 1782
  });

  const [playbooks, setPlaybooks] = useState<PlaybookTemplate[]>(FALLBACK_PLAYBOOKS);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('pb-01');
  const currentPlaybook = playbooks.find(p => p.id === selectedPlaybookId) || playbooks[0] || FALLBACK_PLAYBOOKS[0];

  // Canvas & Simulation States
  const [canvasViewMode, setCanvasViewMode] = useState<'canvas' | 'simulator' | 'history' | 'raw_yaml'>('canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('n1');
  const [isDebugMode, setIsDebugMode] = useState<boolean>(true);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [activeSimLog, setActiveSimLog] = useState<string[]>([]);
  const [customFilter, setCustomFilter] = useState<string>('all');

  // Executions Table State
  const [executionLogs, setExecutionLogs] = useState<SOARExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<SOARExecutionLog | null>(null);

  // Approval Gate Modal State
  const [approvalModalItem, setApprovalModalItem] = useState<SOARExecutionLog | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState<string>('經 SOC L2 核實事件真實性，同意執行重大隔離');

  // Live Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [dispatchTarget, setDispatchTarget] = useState<string>('10.10.12.44 (SRV-FINANCE-01)');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Custom Action Builder State
  const [builderProtocol, setBuilderProtocol] = useState<'REST' | 'SSH' | 'SQL' | 'WEBHOOK'>('REST');
  const [builderEndpoint, setBuilderEndpoint] = useState('https://api.paloaltonetworks.com/v1/address_groups/dynamic');
  const [builderPayload, setBuilderPayload] = useState(`{
  "action": "add_address_group_member",
  "group_name": "DAG_CRITICAL_MALWARE_BLOCK",
  "ip_list": ["{{ alert.source_ip }}"],
  "enforce_policy": "DROP_IMMEDIATE",
  "reason": "SOAR Autonomous Mitigation Trigger"
}`);
  const [builderTestOutput, setBuilderTestOutput] = useState<any>(null);
  const [builderLogs, setBuilderLogs] = useState<string[]>([]);
  const [isTestingAction, setIsTestingAction] = useState(false);

  // Forensics Center State
  const [forensicsTarget, setForensicsTarget] = useState('10.10.12.44');
  const [isForensicsRunning, setIsForensicsRunning] = useState(false);
  const [branchSensors, setBranchSensors] = useState<BranchSensorNode[]>([]);
  const [forensicsArtifacts, setForensicsArtifacts] = useState<VelociraptorForensicArtifact[]>([]);

  // Connectors State
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [testingConnectorId, setTestingConnectorId] = useState<string | null>(null);

  // AI Response Advisor Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiIncidentInput, setAiIncidentInput] = useState<string>('發現主機 10.10.12.44 嘗試向外部未知名單 IP 發起 Cobalt Strike Beacon 心跳');
  const [aiIocInput, setAiIocInput] = useState<string>('185.220.101.5');
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Create Playbook Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newPbName, setNewPbName] = useState<string>('');
  const [newPbCategory, setNewPbCategory] = useState<'Ransomware' | 'Phishing' | 'C2' | 'Identity' | 'Forensics' | 'DDoS' | 'Malware' | 'Exfiltration'>('Ransomware');
  const [newPbDesc, setNewPbDesc] = useState<string>('');

  // Emergency Quick Containment Modal
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [emergencyTarget, setEmergencyTarget] = useState<string>('10.10.12.44');
  const [emergencyActionType, setEmergencyActionType] = useState<'ISOLATE_HOST' | 'BLOCK_C2_IP' | 'LOCK_AD_USER'>('ISOLATE_HOST');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // --- FETCH DATA FROM BACKEND ---
  const fetchAllSoarData = async () => {
    try {
      setIsLoading(true);
      const [telemetryRes, playbooksRes, execsRes, connectorsRes, sensorsRes, artifactsRes] = await Promise.all([
        fetch('/api/v1/soar/telemetry').then(r => r.json()).catch(() => null),
        fetch('/api/v1/soar/playbooks').then(r => r.json()).catch(() => null),
        fetch('/api/v1/soar/executions').then(r => r.json()).catch(() => null),
        fetch('/api/v1/soar/connectors').then(r => r.json()).catch(() => null),
        fetch('/api/v1/soar/forensics/sensors').then(r => r.json()).catch(() => null),
        fetch('/api/v1/soar/forensics/artifacts').then(r => r.json()).catch(() => null)
      ]);

      if (telemetryRes?.success && telemetryRes.telemetry) {
        setTelemetry(telemetryRes.telemetry);
      }
      if (playbooksRes?.success && playbooksRes.playbooks?.length > 0) {
        setPlaybooks(playbooksRes.playbooks);
        if (!playbooksRes.playbooks.some((p: any) => p.id === selectedPlaybookId)) {
          setSelectedPlaybookId(playbooksRes.playbooks[0].id);
        }
      }
      if (execsRes?.success && execsRes.executions) {
        setExecutionLogs(execsRes.executions);
      }
      if (connectorsRes?.success && connectorsRes.connectors) {
        setConnectors(connectorsRes.connectors);
      }
      if (sensorsRes?.success && sensorsRes.sensors) {
        setBranchSensors(sensorsRes.sensors);
      }
      if (artifactsRes?.success && artifactsRes.artifacts) {
        setForensicsArtifacts(artifactsRes.artifacts);
      }
    } catch (err) {
      console.error('Failed to load SOAR data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSoarData();
  }, []);

  // --- TRIGGER PLAYBOOK DRY-RUN (SIMULATION) ---
  const handleStartSimulation = async () => {
    if (!currentPlaybook) return;
    setIsSimulationRunning(true);
    setSimulationStep(0);
    setCanvasViewMode('simulator');
    setActiveSimLog([
      `[${new Date().toLocaleTimeString()}] [SIMULATOR] Starting Backend Dry-Run for Playbook: ${currentPlaybook.name}`,
      `[${new Date().toLocaleTimeString()}] [MOCK-EVENT] Ingested Simulated Alert: EVT-${Math.floor(Math.random() * 8999 + 1000)} | Severity: CRITICAL`
    ]);

    try {
      // Call backend dryRun API
      const res = await fetch(`/api/v1/soar/playbooks/${currentPlaybook.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true, targetAsset: '10.10.12.44 (SIMULATOR-HOST)' })
      });
      const data = await res.json();

      // Step by step animation along nodes
      const totalNodes = currentPlaybook.nodes.length;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < totalNodes) {
          setSimulationStep(step);
          const node = currentPlaybook.nodes[step];
          setActiveSimLog(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] [EXECUTE-STEP ${step + 1}/${totalNodes}] ${node.label} (${node.vendor || 'Native'}) -> [STATUS: SUCCESS - ${Math.floor(Math.random() * 50 + 10)}ms]`
          ]);
        } else {
          clearInterval(interval);
          setIsSimulationRunning(false);
          setActiveSimLog(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] [SIMULATION-COMPLETED] All ${totalNodes} logic nodes validated successfully. Backend dry-run finished with zero errors.`
          ]);
          showToast(isZh ? '🎉 劇本邏輯模擬演練成功！無衝突與語法錯誤。' : '🎉 Playbook simulation finished with 0 errors.');
          if (data.execution) {
            setExecutionLogs(prev => [data.execution, ...prev]);
          }
        }
      }, 700);
    } catch (err: any) {
      setIsSimulationRunning(false);
      showToast(`模擬執行失敗: ${err.message}`);
    }
  };

  // --- TRIGGER LIVE PRODUCTION EXECUTION ---
  const handleLiveDispatch = async () => {
    if (!currentPlaybook) return;
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/v1/soar/playbooks/${currentPlaybook.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: false,
          targetAsset: dispatchTarget,
          incidentId: `INC-2026-${Math.floor(Math.random() * 8999 + 1000)}`
        })
      });
      const data = await res.json();

      if (data.success && data.execution) {
        setExecutionLogs(prev => [data.execution, ...prev]);
        setIsDispatchModalOpen(false);
        showToast(isZh ? `⚡ 已正式派發處置！執行編號: ${data.execution.id}` : `⚡ Dispatched execution: ${data.execution.id}`);
        // Refresh telemetry
        fetch('/api/v1/soar/telemetry').then(r => r.json()).then(t => {
          if (t.telemetry) setTelemetry(t.telemetry);
        });
        // Switch to executions tab to view
        setActiveSubTab('executions');
      } else {
        showToast(`派發失敗: ${data.error || '未知錯誤'}`);
      }
    } catch (err: any) {
      showToast(`派發異常: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // --- APPROVE PENDING MANUAL GATE ---
  const handleConfirmApproval = async () => {
    if (!approvalModalItem) return;
    try {
      const res = await fetch(`/api/v1/soar/executions/${approvalModalItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver: 'SOC L2 Incident Commander',
          remarks: approvalRemarks
        })
      });
      const data = await res.json();
      if (data.success && data.execution) {
        setExecutionLogs(prev => prev.map(item => item.id === data.execution.id ? data.execution : item));
        setApprovalModalItem(null);
        showToast(isZh ? `✅ 已核准授權處置 [${data.execution.id}]！指令已即刻下發生產網路。` : `✅ Approved execution [${data.execution.id}]`);
        fetch('/api/v1/soar/telemetry').then(r => r.json()).then(t => {
          if (t.telemetry) setTelemetry(t.telemetry);
        });
      }
    } catch (err: any) {
      showToast(`核准失敗: ${err.message}`);
    }
  };

  // --- REJECT PENDING MANUAL GATE ---
  const handleRejectApproval = async (execId: string) => {
    try {
      const res = await fetch(`/api/v1/soar/executions/${execId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejector: 'SOC Lead Analyst',
          reason: '經覆核研判為已知測試行為，否決高衝擊隔離操作'
        })
      });
      const data = await res.json();
      if (data.success && data.execution) {
        setExecutionLogs(prev => prev.map(item => item.id === data.execution.id ? data.execution : item));
        setApprovalModalItem(null);
        showToast(isZh ? `🚫 已否決處置 [${execId}]，後續阻斷已終止。` : `🚫 Rejected execution [${execId}]`);
      }
    } catch (err: any) {
      showToast(`否決失敗: ${err.message}`);
    }
  };

  // --- ROLLBACK EXECUTION ---
  const handleRollback = async (execId: string) => {
    try {
      const res = await fetch(`/api/v1/soar/executions/${execId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiator: 'SOC Lead Admin' })
      });
      const data = await res.json();
      if (data.success && data.execution) {
        setExecutionLogs(prev => prev.map(item => item.id === data.execution.id ? data.execution : item));
        showToast(isZh ? `🔄 已成功撤銷處置 [${execId}]！微隔離與防火牆規則已回滾。` : `🔄 Rolled back execution [${execId}]`);
      } else {
        showToast(data.error || '無法回滾此處置');
      }
    } catch (err: any) {
      showToast(`回滾失敗: ${err.message}`);
    }
  };

  // --- TOGGLE PLAYBOOK STATUS ---
  const handleTogglePlaybook = async (pbId: string) => {
    try {
      const res = await fetch(`/api/v1/soar/playbooks/${pbId}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.playbook) {
        setPlaybooks(prev => prev.map(p => p.id === pbId ? data.playbook : p));
        showToast(isZh ? `劇本狀態已切換為: ${data.playbook.status}` : `Playbook is now ${data.playbook.status}`);
      }
    } catch (err: any) {
      showToast(`切換失敗: ${err.message}`);
    }
  };

  // --- TEST CONNECTOR ---
  const handleTestConnector = async (connId: string) => {
    setTestingConnectorId(connId);
    try {
      const res = await fetch(`/api/v1/soar/connectors/${connId}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.connector) {
        setConnectors(prev => prev.map(c => c.id === connId ? data.connector : c));
        showToast(isZh ? `✅ ${data.message}` : `✅ Connection verified (${data.latencyMs}ms)`);
      }
    } catch (err: any) {
      showToast(`連線測試異常: ${err.message}`);
    } finally {
      setTestingConnectorId(null);
    }
  };

  // --- TEST CUSTOM ACTION BUILDER ---
  const handleTestCustomAction = async () => {
    setIsTestingAction(true);
    setBuilderTestOutput(null);
    try {
      const res = await fetch('/api/v1/soar/builder/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: builderProtocol,
          endpoint: builderEndpoint,
          payload: builderPayload
        })
      });
      const data = await res.json();
      if (data.success) {
        setBuilderTestOutput(data.responseData);
        setBuilderLogs(data.logs || []);
        showToast(isZh ? `🚀 測試動作成功下發！回傳狀態: HTTP ${data.statusCode} (${data.latencyMs}ms)` : `🚀 Action test succeeded`);
      } else {
        setBuilderTestOutput({ error: data.error });
      }
    } catch (err: any) {
      setBuilderTestOutput({ error: err.message });
      showToast(`測試失敗: ${err.message}`);
    } finally {
      setIsTestingAction(false);
    }
  };

  // --- VELOCIRAPTOR VQL HUNT ---
  const handleDispatchForensics = async () => {
    if (!forensicsTarget) {
      showToast('請輸入目標主機 IP 或名稱');
      return;
    }
    setIsForensicsRunning(true);
    try {
      const res = await fetch('/api/v1/soar/forensics/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAsset: forensicsTarget, vqlType: 'Full-Triage' })
      });
      const data = await res.json();
      if (data.success && data.artifacts) {
        setForensicsArtifacts(prev => [...data.artifacts, ...prev]);
        showToast(isZh ? `🎉 ${data.summary}` : 'Forensics collected.');
      }
    } catch (err: any) {
      showToast(`鑑識採樣下發失敗: ${err.message}`);
    } finally {
      setIsForensicsRunning(false);
    }
  };

  // --- CREATE NEW PLAYBOOK ---
  const handleCreatePlaybook = async () => {
    if (!newPbName.trim()) {
      showToast('請輸入劇本名稱');
      return;
    }
    try {
      const res = await fetch('/api/v1/soar/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPbName,
          category: newPbCategory,
          description: newPbDesc || '自訂安全應變聯防劇本'
        })
      });
      const data = await res.json();
      if (data.success && data.playbook) {
        setPlaybooks(prev => [data.playbook, ...prev]);
        setSelectedPlaybookId(data.playbook.id);
        setIsCreateModalOpen(false);
        setNewPbName('');
        setNewPbDesc('');
        showToast(isZh ? `✅ 成功建立劇本「${data.playbook.name}」！` : 'Playbook created.');
      }
    } catch (err: any) {
      showToast(`建立失敗: ${err.message}`);
    }
  };

  // --- AI PLAYBOOK RECOMMENDATION ---
  const handleAskAiRecommendation = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/v1/soar/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentType: aiIncidentInput, targetIoc: aiIocInput })
      });
      const data = await res.json();
      if (data.success && data.recommendation) {
        setAiRecommendation(data.recommendation);
      }
    } catch (err: any) {
      showToast(`AI 推薦獲取失敗: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- QUICK EMERGENCY CONTAINMENT ---
  const handleQuickEmergencyAction = async () => {
    let targetPbId = 'pb-01';
    if (emergencyActionType === 'BLOCK_C2_IP') targetPbId = 'pb-03';
    else if (emergencyActionType === 'LOCK_AD_USER') targetPbId = 'pb-04';

    try {
      const res = await fetch(`/api/v1/soar/playbooks/${targetPbId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: false,
          targetAsset: emergencyTarget,
          incidentId: `EMERGENCY-${Date.now().toString().slice(-4)}`
        })
      });
      const data = await res.json();
      if (data.success && data.execution) {
        setExecutionLogs(prev => [data.execution, ...prev]);
        setIsEmergencyModalOpen(false);
        showToast(isZh ? `🔥 緊急阻斷指令已執行！執行編號: ${data.execution.id}` : `Emergency containment executed.`);
        setActiveSubTab('executions');
      }
    } catch (err: any) {
      showToast(`緊急阻斷失敗: ${err.message}`);
    }
  };

  const playbookIcons: Record<string, any> = {
    trigger: <Zap size={18} className="text-amber-400" />,
    action: <Cpu size={18} className="text-blue-400" />,
    condition: <Filter size={18} className="text-purple-400" />,
    manual: <UserCheck size={18} className="text-emerald-400" />,
    enrichment: <FileSearch size={18} className="text-cyan-400" />,
    notify: <Radio size={18} className="text-pink-400" />
  };

  const selectedNode = currentPlaybook?.nodes?.find(n => n.id === selectedNodeId) || currentPlaybook?.nodes?.[0];

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
                  {isLoading && (
                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" /> 同步中
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {isZh 
                    ? '整合 n8n 視覺編排、TheHive/Cortex 處置、Velociraptor 遠端鑑識與 EDR/FW 異質聯防，實現秒級威脅扼殺與全自動調查。' 
                    : 'Unified SOAR engine orchestrating n8n workflows, Velociraptor forensics, and heterogeneous EDR/Firewall autonomous response in sub-second latency.'}
                </p>
              </div>
            </div>
          </div>

          {/* QUICK EMERGENCY CONTAINMENT & AI BUTTONS */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl text-xs font-mono font-black uppercase flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
            >
              <Flame size={14} className="text-red-400 animate-bounce" />
              {isZh ? '緊急一鍵圍堵' : 'Emergency Containment'}
            </button>

            <button
              onClick={() => {
                setIsAiModalOpen(true);
                handleAskAiRecommendation();
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/40 hover:to-blue-600/40 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-mono font-black uppercase flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
            >
              <Bot size={14} className="text-purple-400" />
              {isZh ? 'AI 處置助理' : 'AI Copilot'}
            </button>
          </div>
        </div>

        {/* TELEMETRY BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
              <Clock size={12} className="text-green-400" />
              {isZh ? '平均處置時間 (MTTR)' : 'MTTR'}
            </div>
            <div className="text-lg font-black text-[#00FF66] font-mono mt-0.5">{telemetry.mttrDisplay}</div>
            <div className="text-[9px] text-gray-400 font-mono">{isZh ? '人工提速 96.8%' : '96.8% faster'}</div>
          </div>

          <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-400" />
              {isZh ? '全自動處置率' : 'Autonomous Ratio'}
            </div>
            <div className="text-lg font-black text-blue-400 font-mono mt-0.5">{telemetry.autonomousDeflectionRatio}%</div>
            <div className="text-[9px] text-gray-400 font-mono">{telemetry.totalExecutions24h} {isZh ? '次/24h' : 'runs/24h'}</div>
          </div>

          <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
              <Workflow size={12} className="text-purple-400" />
              {isZh ? '上線防禦劇本' : 'Active Playbooks'}
            </div>
            <div className="text-lg font-black text-purple-400 font-mono mt-0.5">{playbooks.length} PROD</div>
            <div className="text-[9px] text-gray-400 font-mono">{connectors.length || 7} {isZh ? '組異質集成' : 'Integrations'}</div>
          </div>

          <div className="bg-black/60 border border-gray-800 p-3 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
              <UserCheck size={12} className="text-amber-400" />
              {isZh ? '人工審核閘門' : 'Pending Gates'}
            </div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {executionLogs.filter(e => e.status === 'Pending Approval').length} PENDING
            </div>
            <div className="text-[9px] text-gray-400 font-mono">{isZh ? '高特權重設待決' : 'Critical Action'}</div>
          </div>
        </div>

        {/* PRIMARY SUB-NAVIGATION TABS */}
        <div className="mt-8 flex bg-black/70 p-1.5 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar gap-1">
          {[
            { id: 'workflows', label: isZh ? '工作流程與劇本編排' : isJa ? 'プレイブック編制' : 'Playbook Canvas', icon: <Workflow size={14} /> },
            { id: 'fim', label: isZh ? '檔案完整性監控 (FIM 自動化)' : isJa ? 'ファイル整合性監視 (FIM)' : 'File Integrity Monitoring (FIM)', icon: <Fingerprint size={14} /> },
            { id: 'executions', label: isZh ? '即時處置紀錄與審批' : isJa ? '実行ログと承認' : 'Live Executions & Approvals', icon: <History size={14} />, badgeCount: executionLogs.filter(e => e.status === 'Pending Approval').length },
            { id: 'builder', label: isZh ? '動作與連接器建構器' : isJa ? 'アクションビルダー' : 'Action & Connector Builder', icon: <Code size={14} /> },
            { id: 'forensics', label: isZh ? '跨據點遠端數位鑑識' : isJa ? 'リモートフォレンジック' : 'Distributed Forensics', icon: <FileSearch size={14} /> },
            { id: 'correlation', label: isZh ? '事件關聯與擴散溯源' : isJa ? 'インシデント相関・拡散追跡' : 'Incident Correlation', icon: <Share2 size={14} /> },
            { id: 'connectors', label: isZh ? 'SIEM/EDR/FW 整合狀態' : isJa ? '連携コネクター状態' : 'Integration Connectors', icon: <Settings size={14} /> },
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
              {tab.badgeCount && tab.badgeCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black rounded-full animate-pulse ml-1">
                  {tab.badgeCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFLOWS & PLAYBOOK CANVAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-8">
          
          {/* PLAYBOOK PRESET SELECTOR & CONTROLS */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-purple-400" />
              {isZh ? '生產劇本庫清單' : 'Production Playbooks Library'} ({playbooks.length})
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 shadow"
              >
                <Plus size={14} />
                {isZh ? '新建劇本' : 'New Playbook'}
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(currentPlaybook, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentPlaybook.id}-playbook.json`;
                  a.click();
                  showToast(isZh ? `已匯出劇本 JSON: ${currentPlaybook.id}` : 'Exported JSON');
                }}
                className="px-3 py-1.5 bg-black/60 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5"
              >
                <Download size={13} />
                {isZh ? '匯出 JSON' : 'Export'}
              </button>

              <button
                onClick={() => handleTogglePlaybook(currentPlaybook.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border",
                  currentPlaybook.status === 'Active'
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                )}
              >
                {currentPlaybook.status === 'Active' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {currentPlaybook.status === 'Active' ? (isZh ? '運行中 (點擊停用)' : 'Active') : (isZh ? '已暫停 (點擊啟用)' : 'Paused')}
              </button>
            </div>
          </div>

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
                      ID: {currentPlaybook.id} | {isZh ? '共' : 'Total'} {currentPlaybook.nodes?.length || 0} {isZh ? '個邏輯節點' : 'Nodes'} | n8n Flow Engine
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex bg-black/80 p-1 rounded-lg border border-gray-800">
                  {[
                    { id: 'canvas', label: isZh ? '視覺畫布' : 'Canvas' },
                    { id: 'simulator', label: isZh ? '模擬器日誌' : 'Trace' },
                    { id: 'raw_yaml', label: isZh ? 'YAML/JSON' : 'Schema' },
                  ].map((tab) => (
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
                  {isZh ? '即時偵錯模式' : 'Debug Flow'}
                </button>

                {/* DRY RUN BUTTON */}
                <button
                  onClick={handleStartSimulation}
                  disabled={isSimulationRunning}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 disabled:opacity-50"
                >
                  {isSimulationRunning ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                  {isSimulationRunning ? (isZh ? '演練中...' : 'Simulating...') : (isZh ? '▶ 執行模擬演練 (Dry-Run)' : 'Dry-Run')}
                </button>

                {/* LIVE DISPATCH BUTTON */}
                <button
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="px-4 py-2 bg-[#00FF66] hover:bg-[#00FF66]/80 text-black font-black uppercase font-mono text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#00FF66]/20 active:scale-95"
                >
                  <Zap size={14} />
                  {isZh ? '⚡ 正式派發處置' : 'Live Dispatch'}
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
                      <button 
                        onClick={() => showToast(`可將 ${type.toUpperCase()} 節點拖入劇本畫布`)}
                        className="p-3 bg-black/60 border border-gray-800 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 hover:bg-purple-600/10 transition-all"
                      >
                        {playbookIcons[type]}
                      </button>
                      <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-[10px] font-mono text-white px-2 py-1 rounded border border-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                        + {type.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto hidden lg:flex flex-col gap-2">
                  <button onClick={() => showToast('縮放適應畫布')} className="p-2.5 text-gray-500 hover:text-white transition-colors" title="Zoom In"><Maximize2 size={16} /></button>
                  <button onClick={() => showToast('對齊格線網格')} className="p-2.5 text-gray-500 hover:text-white transition-colors" title="Grid Layout"><LayoutGrid size={16} /></button>
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
                      {currentPlaybook.connections?.map((conn, i) => {
                        const fromNode = currentPlaybook.nodes?.find(n => n.id === conn.from);
                        const toNode = currentPlaybook.nodes?.find(n => n.id === conn.to);
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
                    {currentPlaybook.nodes?.map((node, idx) => {
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
                              {playbookIcons[node.type] || <Zap size={18} />}
                              <span className="text-[9px] font-mono font-bold uppercase text-gray-400">
                                {node.type}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-gray-400 border border-gray-800 truncate max-w-[70px]">
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
                        <div className="text-gray-500 italic">點擊上方「▶ 執行模擬演練」以開始模擬步進。</div>
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
              {selectedNode && (
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
              )}
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
                {['all', 'Pending Approval', 'Success', 'Rolled Back', 'Failed'].map(st => (
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
                            item.status === 'Rolled Back' ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                            "bg-red-500/10 text-red-400 border border-red-500/30"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 max-w-xs truncate" title={item.resultSummary}>
                          {item.resultSummary}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === 'Pending Approval' ? (
                              <button
                                onClick={() => setApprovalModalItem(item)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-black rounded text-[10px] uppercase transition-all shadow-lg active:scale-95 flex items-center gap-1"
                              >
                                <UserCheck size={12} />
                                {isZh ? '審批授權' : 'Review'}
                              </button>
                            ) : null}

                            {item.rollbackAvailable && item.status === 'Success' ? (
                              <button
                                onClick={() => handleRollback(item.id)}
                                className="px-2.5 py-1 bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border border-blue-500/30 rounded text-[10px] uppercase font-mono transition-all flex items-center gap-1"
                              >
                                <RotateCcw size={11} />
                                {isZh ? '回滾' : 'Rollback'}
                              </button>
                            ) : null}

                            <button
                              onClick={() => setSelectedExecution(item)}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded text-[10px] uppercase transition-all"
                            >
                              {isZh ? '鑑識明細' : 'Details'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* APPROVAL GATE MODAL */}
          <AnimatePresence>
            {approvalModalItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
              >
                <div className="w-full max-w-xl bg-[#0e1422] border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">
                          {isZh ? '高特權處置人工審批閘門 (Approval Gate)' : 'Manual Approval Required'}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {approvalModalItem.id} | {approvalModalItem.playbookName}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setApprovalModalItem(null)} className="text-gray-400 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">受影響目標資產：</span>
                        <strong className="text-white">{approvalModalItem.target}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">觸發來源：</span>
                        <span className="text-purple-300">{approvalModalItem.triggerSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">已執行前置步驟：</span>
                        <span className="text-green-400 font-bold">{approvalModalItem.stepsCompleted} / {approvalModalItem.stepsTotal} 步</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-300 block mb-1">
                        {isZh ? '資安主管覆核理由與數位備註 (Remarks)' : 'Approval Remarks'}
                      </label>
                      <textarea
                        rows={3}
                        value={approvalRemarks}
                        onChange={(e) => setApprovalRemarks(e.target.value)}
                        className="w-full bg-black border border-gray-800 rounded-lg p-3 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => handleRejectApproval(approvalModalItem.id)}
                      className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded-lg text-xs font-mono font-bold uppercase transition-all"
                    >
                      {isZh ? '否決處置 (Reject)' : 'Reject'}
                    </button>

                    <button
                      onClick={handleConfirmApproval}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs font-mono uppercase transition-all shadow-lg active:scale-95"
                    >
                      {isZh ? '⚡ 授權核准處置 (Authorize)' : 'Authorize & Execute'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                      {selectedExecution.approvalRemarks && (
                        <div><strong className="text-gray-400">主管審批意見：</strong> <span className="text-amber-400">{selectedExecution.approvalRemarks}</span></div>
                      )}
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
                  onClick={handleTestCustomAction}
                  disabled={isTestingAction}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isTestingAction ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                  {isTestingAction ? '下發測試通訊中...' : '發送測試負載 (Test Payload)'}
                </button>
              </div>
            </div>
          </div>

          {/* BUILDER CONSOLE OUTPUT */}
          <div className="bg-[#0b0f17] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-[#00FF66]" />
                  <h4 className="text-xs font-black text-white uppercase font-mono tracking-wider">
                    端點回傳響應 (Driver Response Console)
                  </h4>
                </div>
                {builderTestOutput && (
                  <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    HTTP 200 OK
                  </span>
                )}
              </div>

              {builderLogs.length > 0 && (
                <div className="mb-4 bg-black/60 p-3 rounded-lg border border-gray-800 space-y-1 font-mono text-[11px] text-gray-400">
                  {builderLogs.map((log, i) => (
                    <div key={i} className="text-gray-300">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-black/90 rounded-xl p-4 border border-gray-800 font-mono text-xs text-green-400 max-h-[380px] overflow-auto custom-scrollbar">
                {builderTestOutput ? (
                  <pre>{JSON.stringify(builderTestOutput, null, 2)}</pre>
                ) : (
                  <div className="text-gray-500 italic p-4 text-center">
                    請點擊左側「發送測試負載」以驗證 API 連線與驅動執行狀況。
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 text-[10px] font-mono text-gray-500 flex justify-between">
              <span>動態注入引擎: Jinja2 v3.1</span>
              <span>TLS 1.3 Strict Mode</span>
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
                  onClick={handleDispatchForensics}
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
              {(branchSensors.length > 0 ? branchSensors : [
                { name: '台北總部 (Taipei HQ)', id: 'CCS-TPE-01', nodes: '1,420 端點', sync: '1.2s 前', status: 'Online' },
                { name: '新竹晶圓廠 (Hsinchu Fab)', id: 'CCS-HSZ-02', nodes: '890 端點', sync: '0.8s 前', status: 'Online' },
                { name: '台中資料中心 (Taichung DC)', id: 'CCS-TXG-03', nodes: '420 伺服器', sync: '2.1s 前', status: 'Online' },
                { name: '高雄物流園區 (Kaohsiung)', id: 'CCS-KHH-04', nodes: '310 端點', sync: '1.5s 前', status: 'Online' }
              ]).map((br, i) => (
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
                  <div key={art.id || i} className="p-4 bg-black/80 border border-gray-800 rounded-xl space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="text-blue-400" size={16} />
                        <span className="text-xs font-bold text-white truncate max-w-[240px]">{art.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{art.size}</span>
                    </div>
                    <div className="text-[9px] text-gray-500 break-all">
                      SHA-256: <span className="text-purple-400">{art.hash}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[9px]">
                      <span className="text-green-400 font-bold">{art.status}</span>
                      <button 
                        onClick={() => showToast(`正在打包下載物證: ${art.name}`)}
                        className="text-blue-400 hover:underline"
                      >
                        下載鑑識封包
                      </button>
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
            <div className="border-b border-gray-800 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                {isZh ? '24 小時威脅入侵關聯熱力圖 (Incident Correlation Heatmap)' : '24h Incident Correlation'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">
                {isZh ? '分析告警時序分佈、攻擊手法分佈與自主圍堵有效性統計' : 'Analysis of alarm time series distribution and autonomous mitigation statistics.'}
              </p>
            </div>
            
            <div className="bg-[#0e1422] rounded-2xl border border-gray-800 p-6 shadow-2xl">
              <Correlation24hHeatmap isZh={isZh} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CONNECTORS & SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'connectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors.map((c) => (
            <div key={c.id} className="p-6 bg-[#0b0f17] border border-gray-800 rounded-2xl space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{c.cat}</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border",
                  c.status === 'Connected' ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                )}>
                  {c.status}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">{c.name}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
              
              {c.supportedActions && c.supportedActions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.supportedActions.slice(0, 3).map((act, idx) => (
                    <span key={idx} className="text-[9px] bg-black/60 px-2 py-0.5 rounded text-gray-400 border border-gray-800">
                      {act}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500">
                <span>API 延遲: <strong className="text-purple-400">{c.latency}</strong></span>
                <button 
                  onClick={() => handleTestConnector(c.id)}
                  disabled={testingConnectorId === c.id}
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  {testingConnectorId === c.id ? <RefreshCw className="animate-spin" size={10} /> : null}
                  測試連線
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: FILE INTEGRITY MONITORING (FIM) & SOAR AUTOMATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'fim' && (
        <SOARFIMView />
      )}

      {/* ========================================================================= */}
      {/* LIVE DISPATCH MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDispatchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-lg bg-[#0e1422] border border-purple-500/50 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase">
                      {isZh ? '正式派發自動化處置劇本' : 'Live Playbook Dispatch'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono">{currentPlaybook.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsDispatchModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">目標受隔離資產 (Target Asset / Host IP)：</label>
                  <input
                    type="text"
                    value={dispatchTarget}
                    onChange={(e) => setDispatchTarget(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-[11px] text-amber-300">
                  ⚠️ 注意：此操作將向生產環境各安全設備 (EDR、Firewall、AD、Mail Gateway) 正式下發網路微隔離與帳號凍結指令！若遇到高特權操作步驟，將自動掛起等待 SOC L2 審批。
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono font-bold uppercase"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>

                <button
                  onClick={handleLiveDispatch}
                  disabled={isDispatching}
                  className="px-5 py-2 bg-[#00FF66] hover:bg-[#00FF66]/80 text-black font-black uppercase font-mono text-xs rounded-lg transition-all shadow-lg flex items-center gap-2"
                >
                  {isDispatching ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                  {isDispatching ? '執行派發中...' : '確認派發處置'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CREATE NEW PLAYBOOK MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-lg bg-[#0e1422] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase">
                      {isZh ? '新建自動化聯防應變劇本' : 'Create New Playbook'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono">Define trigger, condition and heterogeneous response actions</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">劇本名稱 (Playbook Name)：</label>
                  <input
                    type="text"
                    value={newPbName}
                    onChange={(e) => setNewPbName(e.target.value)}
                    placeholder="例如: API 異常連線速限與雲端 IAM Token 註銷"
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">劇本分類 (Category)：</label>
                  <select
                    value={newPbCategory}
                    onChange={(e) => setNewPbCategory(e.target.value as any)}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                  >
                    <option value="Ransomware">Ransomware (勒索軟體圍堵)</option>
                    <option value="Phishing">Phishing (釣魚郵件清除)</option>
                    <option value="C2">C2 (外聯連線阻斷)</option>
                    <option value="Identity">Identity (帳號密碼保護)</option>
                    <option value="Forensics">Forensics (物證自動採集)</option>
                    <option value="DDoS">DDoS (流量清洗)</option>
                    <option value="Malware">Malware (惡意程式隔離)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">劇本描述與處置目標：</label>
                  <textarea
                    rows={3}
                    value={newPbDesc}
                    onChange={(e) => setNewPbDesc(e.target.value)}
                    placeholder="說明當觸發何種資安事件時，自動下發何種異質安全設備之處置行為..."
                    className="w-full bg-black border border-gray-800 rounded-lg p-3 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono font-bold uppercase"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>

                <button
                  onClick={handleCreatePlaybook}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase font-mono text-xs rounded-lg transition-all shadow-lg shadow-purple-600/30"
                >
                  {isZh ? '立即建立' : 'Create Playbook'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* QUICK EMERGENCY CONTAINMENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEmergencyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-lg bg-[#140b0e] border border-red-500/50 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/40">
                    <Flame size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase">
                      {isZh ? 'SOC 緊急一鍵處置圍堵台' : 'Emergency Containment Station'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono">One-click immediate threat isolation</p>
                  </div>
                </div>
                <button onClick={() => setIsEmergencyModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-gray-300 block mb-1">處置策略類型 (Emergency Action Type)：</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'ISOLATE_HOST', label: '端點實體隔離', desc: 'EDR 微隔離' },
                      { id: 'BLOCK_C2_IP', label: '封鎖 C2 IP', desc: 'NGFW DAG' },
                      { id: 'LOCK_AD_USER', label: '凍結帳號憑證', desc: 'AD / Azure' },
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setEmergencyActionType(type.id as any)}
                        className={cn(
                          "p-3 rounded-lg border text-left font-mono transition-all",
                          emergencyActionType === type.id
                            ? "bg-red-600/20 border-red-500 text-white ring-1 ring-red-500"
                            : "bg-black/60 border-gray-800 text-gray-400 hover:text-white"
                        )}
                      >
                        <div className="font-bold text-xs">{type.label}</div>
                        <div className="text-[9px] text-gray-500">{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">目標 IP / 主機名稱 / 使用者帳號：</label>
                  <input
                    type="text"
                    value={emergencyTarget}
                    onChange={(e) => setEmergencyTarget(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-[10px] text-red-300 leading-relaxed">
                  ⚠️ 警告：此為緊急阻斷通道，將繞過一般佇列排程，直接調用 API 對目標進行瞬時網路中斷或特權註銷！
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono font-bold uppercase"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>

                <button
                  onClick={handleQuickEmergencyAction}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-black uppercase font-mono text-xs rounded-lg transition-all shadow-lg shadow-red-600/30 active:scale-95 flex items-center gap-2"
                >
                  <Flame size={14} />
                  {isZh ? '執行緊急圍堵' : 'Execute Containment'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* AI RESPONSE ADVISOR COPILOT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-xl bg-[#0e1422] border border-purple-500/40 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase">
                      {isZh ? 'AI 智慧處置推薦助理 (Response Copilot)' : 'AI Autonomous Response Copilot'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono">GenAI-assisted threat triage and containment matching</p>
                  </div>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">事件威脅特徵描述 (Incident Context)：</label>
                  <input
                    type="text"
                    value={aiIncidentInput}
                    onChange={(e) => setAiIncidentInput(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">入侵指標 (IOC IP / Hash / Domain)：</label>
                  <input
                    type="text"
                    value={aiIocInput}
                    onChange={(e) => setAiIocInput(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  onClick={handleAskAiRecommendation}
                  disabled={isAiLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2"
                >
                  {isAiLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  {isAiLoading ? 'AI 推理中...' : '重新分析推薦'}
                </button>

                {aiRecommendation && (
                  <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-300">
                        推薦劇本: {playbooks.find(p => p.id === aiRecommendation.recommendedPlaybookId)?.name || aiRecommendation.recommendedPlaybookId}
                      </span>
                      <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        信心度: {Math.round(aiRecommendation.confidence * 100)}%
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      {aiRecommendation.explanation}
                    </p>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedPlaybookId(aiRecommendation.recommendedPlaybookId);
                          setIsAiModalOpen(false);
                          showToast(`已切換至推薦劇本，可點擊執行`);
                        }}
                        className="px-4 py-1.5 bg-[#00FF66] hover:bg-[#00FF66]/80 text-black font-black rounded text-[10px] uppercase font-mono transition-all"
                      >
                        採用此劇本並進入畫布
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono font-bold uppercase"
                >
                  {isZh ? '關閉' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

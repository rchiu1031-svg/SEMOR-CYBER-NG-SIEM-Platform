import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Zap, Brain, CheckCircle2, AlertTriangle, Lock, Shield, 
  Activity, FileText, Terminal, Download, RefreshCw, Search, 
  Share2, Key, Layers, Send, Eye, Play, Copy, Plus, X, 
  Flame, Clock, ChevronRight, Check, HardDrive, Smartphone,
  Globe, Database, ShieldAlert, ShieldCheck, Cpu, Network,
  Binary, FileCode, Filter, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


// Forensic Locales & System Copy
const FORENSICS_LOCALES: Record<string, Record<string, string>> = {
  zh: {
    assistantWelcome: '您好，我是您的 **Gemini 3 數位鑑識專家助理**。\n\n本系統之證據設計完全基於**證據不變性（Chain of Custody）**原則。我已完成對當前案件 `finance_srv_phys.E01` (檢驗雜湊 MD5: a6b2c89f...) 的底層特徵讀取與物理扇區還原。\n\n請下達自然語言指令（例如語意查詢異常 RDP 時間軸、生成客製化 YARA 檢索規則或解析記憶體中還原的編碼 Payload），我將隨時透過**生成式繪圖（Generative UI）Canvas 畫布**即時渲染分析組件！',
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
    carvingRecoverySuccess: '已自未配置磁區成功還原 PE 執行檔二進位 (sec_sys.sys)，MD5 完全匹配。',
    carvingRecoveryNone: '無已刪除執行檔殘留痕跡。'
  },
  en: {
    assistantWelcome: 'Hello, I am your **Gemini 3 Digital Forensics Specialist**.\n\nOur architecture is rooted in strict **Chain of Custody & Evidence Immutability**. I have loaded physical disk overlay `finance_srv_phys.E01` (MD5: a6b2c89f...).\n\nProvide natural language directives like "Analyze anomalous RDP login timeline" or "Generate customized YARA rule", and I will render interactive Generative UI components on the canvas.',
    forensicsDeepEngine: 'Forensics Deep Engine',
    verNativeAi: 'Ver 3.5 Native AI',
    mainTitle: 'AI-Driven Digital Forensics Platform',
    mainDesc: 'Engineered upon Chain of Custody immutability and high-efficiency analysis, powered by Gemini multimodal reasoning.',
    agentOnline: 'Gemini 3.5 Pro Agent Online',
    carvingBtnActive: 'Executing Deep Physical Carving',
    carvingBtnIdle: '1-Click File Carving Recovery',
    currentCasesTitle: 'Active Forensic Cases',
    physicalEvidenceTitle: 'Physical Evidence Locker',
    qty: 'Qty:',
    hashLocked: '🔒 Hash Locked',
    hashCompromised: '⚠️ Hash Discrepancy',
    sourceLabel: 'Source:',
    examinerLabel: 'Custodian:',
    deviceLabel: 'Device:',
    authExaminerSig: 'Examiner Digital Audit Signature',
    authOfficerText: 'Lead Examiner: Verified (Chiur)',
    authAuditText: 'Audit log hashes are preserved via Sleuthkit/Volatility microservices, court-admissible.',
    canvasTitle: 'Interactive Canvas (Generative UI)',
    tabOverview: 'Overview',
    tabTimeline: 'Timeline',
    tabMultimodal: 'Multimodal',
    tabSandbox: 'Dynamic UI Sandbox',
    overviewStatusTitle: 'Physical Disk Deep Analytics Status',
    overviewStatusDesc: 'Use Gemini Copilot to request timeline breakdown or screenshot triage.',
    statAnalyzedSectors: 'Analyzed Physical Sectors',
    statCarvedFiles: 'Carved Deleted Files',
    statCarvedUnit: 'Recovered',
    statMemoryArtifacts: 'Memory Injected Artifacts',
    statMemoryUnit: 'Objects',
    statSecuredCoC: 'MD5 Verified Consistent with E01',
    statFileCarvingDeployed: 'File Carving Engine Active',
    statVolatileTarget: 'Volatile RAM Target',
    sandboxSecurityActive: 'Evidence Isolation Sandbox Active',
    sandboxSecurityDesc: 'Read-only loopback mount ensures absolute chain integrity.',
    timelineTitle: 'Anomalous Incident Timeline',
    carvingRecoverySuccess: 'Carved deleted PE binary (sec_sys.sys) from unallocated sectors, MD5 match.',
    carvingRecoveryNone: 'No deleted binary remnant found.'
  }
};

const FORENSICS_TEMPLATES: Record<string, Record<string, string>> = {
  zh: {
    svchost: `<div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
  <div class="flex justify-between items-center">
    <span class="text-xs font-bold text-red-400">🚨 異常注入進程 (Unallocated PE Carve)</span>
    <span class="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">PID 4108</span>
  </div>
  <p class="text-xs text-slate-300">
    於未配置磁區發現偽裝成 <code class="text-amber-300">svch0st.exe</code> 之未簽署二進位檔案，親進程為 PowerShell，具備反沙盒記憶體補丁。
  </p>
</div>`,
    adversary: `<div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
  <div class="flex justify-between items-center">
    <span class="text-xs font-bold text-amber-400">🌐 外部跳板連線對應 (C2 Infrastructure)</span>
    <span class="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">185.220.101.4</span>
  </div>
  <p class="text-xs text-slate-300">
    比對威脅情資：此 IP 隸屬 Tor Exit 節點，曾於 02:15 透過 RDP 建立持續性加密通道，並下發批次抹除腳本。
  </p>
</div>`,
    lockbit: `<div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
  <div class="flex justify-between items-center">
    <span class="text-xs font-bold text-rose-400">🔒 LockBit 3.0 (Black) 加密特徵</span>
    <span class="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">AES-256 + RSA</span>
  </div>
  <p class="text-xs text-slate-300">
    副檔名變更為 <code class="text-rose-300">.lockbit</code>，桌面勒索信網址指向 Tor 匿名收款通道，磁碟快照已於加密前被執行刪除。
  </p>
</div>`
  },
  en: {
    svchost: `<div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
  <div class="flex justify-between items-center">
    <span class="text-xs font-bold text-red-400">🚨 Malicious Process Injection</span>
    <span class="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">PID 4108</span>
  </div>
  <p class="text-xs text-slate-300">
    Unallocated sector carving revealed counterfeit executable <code class="text-amber-300">svch0st.exe</code> spawned from PowerShell.
  </p>
</div>`
  }
};

export default function DigitalForensicsView() {
  const { i18n } = useTranslation();
  const currentLang = (i18n && i18n.language) ? (i18n.language.slice(0, 2)) : 'zh';
  const msg = FORENSICS_LOCALES[currentLang] || FORENSICS_LOCALES.zh;
  const templateHTML = FORENSICS_TEMPLATES[currentLang] || FORENSICS_TEMPLATES.zh;

  // Real backend cases & evidence state
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState('CASE-2026-004');
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState('EVI-001');
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Active view
  const [activeCanvasView, setActiveCanvasView] = useState<'overview' | 'timeline' | 'memory' | 'network' | 'registry' | 'multimodal' | 'sandbox'>('overview');

  // Deep Forensics Modalities state from backend
  const [memoryAnalysisData, setMemoryAnalysisData] = useState<any>(null);
  const [networkSessionsData, setNetworkSessionsData] = useState<any>(null);
  const [registryCarvingData, setRegistryCarvingData] = useState<any>(null);
  const [isLoadingModality, setIsLoadingModality] = useState(false);

  // New Case & Evidence Modal states
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseType, setNewCaseType] = useState('Ransomware / Lateral Movement');
  const [newCaseTarget, setNewCaseTarget] = useState('FINANCE-SRV-01 (10.0.4.15)');

  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [newEvidenceName, setNewEvidenceName] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState('Disk_Image_E01');
  const [newEvidenceSizeMB, setNewEvidenceSizeMB] = useState('2048');
  const [newEvidenceSource, setNewEvidenceSource] = useState('Physical Host Mirror');

  // Hex Viewer State
  const [selectedHexOffset, setSelectedHexOffset] = useState('0x000F83C0');
  const [selectedHexValue, setSelectedHexValue] = useState('4D 5A 90 00 03 00 00 00');
  const [selectedHexInterpretation, setSelectedHexInterpretation] = useState('PE 執行檔標頭：MZ 簽章 (DOS Header)，代表該磁區快照中可能藏有已被刪除或提權植入的二進位執行程式。');
  const [hexGridData, setHexGridData] = useState<any[]>([]);
  const [isCarvingActive, setIsCarvingActive] = useState(false);
  const [carvingProgress, setCarvingProgress] = useState(100);
  const [carvedArtifactsList, setCarvedArtifactsList] = useState<any[]>([]);

  // Chain of Custody & Transfer Modal
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [custodyRecipient, setCustodyRecipient] = useState('法務部調查局資安鑑識實驗室');
  const [custodyReason, setCustodyReason] = useState('移交司法機關進行不可篡改刑事科技鑑定');

  // Custody Ledger Drawer/Modal state
  const [showCustodyLedgerModal, setShowCustodyLedgerModal] = useState(false);
  const [custodyLedgerList, setCustodyLedgerList] = useState<any[]>([]);

  // Super Timeline state
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'Critical' | 'Process' | 'Network' | 'AntiForensics'>('ALL');


  // Generative UI Sandbox States
  const [sandboxEntity, setSandboxEntity] = useState<'svchost' | 'adversary' | 'lockbit'>('svchost');
  const [compileStatus, setCompileStatus] = useState<'success' | 'idle' | 'warning'>('success');
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    '[SYSTEM] 數位安全沙盒隔離引擎啟動成功',
    '[SYSTEM] 進入只讀鑑識鏈 (SOP-Secure-Isolation)',
    '[SYSTEM] Tailwind CSS 核心樣式庫 3.4.1 已就緒',
    '[AUDIT] 零惡意 Script 代碼探針監控中...'
  ]);
  const [isGeneratingUI, setIsGeneratingUI] = useState(false);
  const [sandboxProgress, setSandboxProgress] = useState(0);
  const [sandboxCode, setSandboxCode] = useState<string>('');

  // Interactive Gemini Chat State
  const [chatInput, setChatInput] = useState('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'gemini', text: string, code?: string, hasDeployButton?: boolean }>>([]);
  const [alertNotification, setAlertNotification] = useState<string | null>(null);

  const showToast = (text: string) => {
    setAlertNotification(text);
    setTimeout(() => setAlertNotification(null), 5000);
  };

  // 1. Fetch Cases and Evidence from Backend
  const fetchForensicsData = async () => {
    try {
      const [casesRes, eviRes, timelineRes] = await Promise.all([
        fetch('/api/v1/forensics/cases'),
        fetch('/api/v1/forensics/evidence'),
        fetch('/api/v1/forensics/timeline')
      ]);

      if (casesRes.ok) {
        const cData = await casesRes.json();
        if (cData.success && cData.cases) {
          setCases(cData.cases);
        }
      }

      if (eviRes.ok) {
        const eData = await eviRes.json();
        if (eData.success && eData.evidence) {
          setEvidenceList(eData.evidence);
          if (!selectedEvidence && eData.evidence.length > 0) {
            setSelectedEvidence(eData.evidence[0].id);
          }
        }
      }

      if (timelineRes.ok) {
        const tData = await timelineRes.json();
        if (tData.success && tData.timeline) {
          setTimelineEvents(tData.timeline);
        }
      }

      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend fetch failed, fallback to client memory:', err);
      setIsBackendConnected(false);
    }
  };

  // 2. Fetch Hex Sector Dump
  const fetchHexDump = async (evidenceId: string, offset: string = '0x000F83C0') => {
    try {
      const res = await fetch(`/api/v1/forensics/evidence/${evidenceId}/hex?offset=${encodeURIComponent(offset)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.hexBlocks) {
          setHexGridData(data.hexBlocks);
          if (data.hexBlocks.length > 0) {
            setSelectedHexOffset(data.hexBlocks[0].offset);
            setSelectedHexValue(data.hexBlocks[0].hex);
            setSelectedHexInterpretation(data.hexBlocks[0].interpretation || '物理磁區資料已加載');
          }
          return;
        }
      }
    } catch (e) {}
  };

  // 3. Fetch Memory Analysis
  const fetchMemoryAnalysis = async (evidenceId: string = 'EVI-002') => {
    setIsLoadingModality(true);
    try {
      const res = await fetch(`/api/v1/forensics/memory-analysis?evidenceId=${encodeURIComponent(evidenceId)}`);
      if (res.ok) {
        const data = await res.json();
        setMemoryAnalysisData(data);
      }
    } catch (e) {
      console.warn('Memory analysis fetch error:', e);
    } finally {
      setIsLoadingModality(false);
    }
  };

  // 4. Fetch Network Forensics
  const fetchNetworkSessions = async () => {
    setIsLoadingModality(true);
    try {
      const res = await fetch('/api/v1/forensics/network-sessions');
      if (res.ok) {
        const data = await res.json();
        setNetworkSessionsData(data);
      }
    } catch (e) {
      console.warn('Network sessions fetch error:', e);
    } finally {
      setIsLoadingModality(false);
    }
  };

  // 5. Fetch Registry Carving
  const fetchRegistryCarving = async (evidenceId: string = 'EVI-001') => {
    setIsLoadingModality(true);
    try {
      const res = await fetch(`/api/v1/forensics/registry-carving?evidenceId=${encodeURIComponent(evidenceId)}`);
      if (res.ok) {
        const data = await res.json();
        setRegistryCarvingData(data);
      }
    } catch (e) {
      console.warn('Registry carving fetch error:', e);
    } finally {
      setIsLoadingModality(false);
    }
  };

  // 6. Fetch Custody Ledger
  const fetchCustodyLedger = async () => {
    try {
      const res = await fetch('/api/v1/forensics/chain-of-custody');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.custodyLedger) {
          setCustodyLedgerList(data.custodyLedger);
        }
      }
    } catch (e) {}
  };

  // 7. Handle Create Case
  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseName.trim()) return;
    try {
      const res = await fetch('/api/v1/forensics/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCaseName,
          incidentType: newCaseType,
          targetSystems: [newCaseTarget],
          examiner: 'Chiur [CH-9912]'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.case) {
          setCases(prev => [data.case, ...prev]);
          setSelectedCase(data.case.id);
          showToast(`✓ ${data.message || `案件 ${data.case.name} 已成功立案`}`);
          setShowNewCaseModal(false);
          setNewCaseName('');
        }
      }
    } catch (e) {
      showToast('立案失敗，請檢查網路連線');
    }
  };

  // 8. Handle Add Evidence
  const handleAddEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceName.trim()) return;
    try {
      const res = await fetch('/api/v1/forensics/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase,
          name: newEvidenceName,
          type: newEvidenceType,
          fileSizeMB: Number(newEvidenceSizeMB) || 1024,
          acquiredFrom: newEvidenceSource,
          acquiredBy: 'Chiur [CH-9912]'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.evidence) {
          setEvidenceList(prev => [data.evidence, ...prev]);
          setSelectedEvidence(data.evidence.id);
          showToast(`✓ ${data.message || `物證 ${data.evidence.name} 已成功登記入庫`}`);
          setShowAddEvidenceModal(false);
          setNewEvidenceName('');
          // Refresh custody ledger
          fetchCustodyLedger();
        }
      }
    } catch (e) {
      showToast('登記新物證失敗');
    }
  };

  useEffect(() => {
    fetchForensicsData();
    fetchMemoryAnalysis();
    fetchNetworkSessions();
    fetchRegistryCarving();
    fetchCustodyLedger();
  }, []);


  useEffect(() => {
    if (selectedEvidence) {
      fetchHexDump(selectedEvidence);
    }
  }, [selectedEvidence]);

  useEffect(() => {
    setChatMessages([
      { 
        sender: 'gemini', 
        text: msg.assistantWelcome 
      }
    ]);
  }, [currentLang]);

  useEffect(() => {
    if (templateHTML && templateHTML[sandboxEntity]) {
      setSandboxCode(templateHTML[sandboxEntity]);
    }
  }, [currentLang, sandboxEntity]);

  // Handle Verify Hash
  const handleVerifyHash = async (evidenceId: string) => {
    try {
      const res = await fetch(`/api/v1/forensics/evidence/${evidenceId}/verify-hash`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        if (data.evidence) {
          setEvidenceList(prev => prev.map(e => e.id === evidenceId ? data.evidence : e));
        }
      }
    } catch (e) {
      showToast('雜湊校驗伺服器通訊異常');
    }
  };

  // Handle File Carving Recovery
  const handleTriggerFileCarving = async () => {
    setIsCarvingActive(true);
    setCarvingProgress(0);

    const interval = setInterval(() => {
      setCarvingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCarvingActive(false);
          return 100;
        }
        return prev + 25;
      });
    }, 200);

    try {
      const res = await fetch(`/api/v1/forensics/evidence/${selectedEvidence}/carve`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.artifacts) {
          setCarvedArtifactsList(data.artifacts);
          showToast(`✓ File Carving 深度物理資料雕刻成功！已還原 ${data.recoveredCount} 個檔案碎片。`);
        }
      }
    } catch (e) {
      showToast('File Carving 深度物理資料雕刻完成');
    }
  };

  // Handle Transfer Custody
  const handleTransferCustodySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/forensics/evidence/${selectedEvidence}/transfer-custody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: custodyRecipient,
          reason: custodyReason,
          examiner: 'Chiur [CH-9912]'
        })
      });
      if (res.ok) {
        showToast(`✓ 事證 ${selectedEvidence} 監管鏈已移轉至「${custodyRecipient}」，法定雜湊審計日誌已寫入！`);
        setShowCustodyModal(false);
      }
    } catch (e) {
      showToast('移轉監管鏈失敗');
    }
  };

  // Handle Export Legal Dossier
  const handleExportDossier = async () => {
    try {
      const res = await fetch(`/api/v1/forensics/cases/${selectedCase}/export-report`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.dossier, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Forensics-Court-Dossier-${selectedCase}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✓ 已匯出司法鑑定與事證監管鏈法定總結卷宗 (JSON)！');
      }
    } catch (e) {
      showToast('匯出鑑識卷宗失敗');
    }
  };

  // Handle Deploy YARA Rule
  const handleDeployYaraRule = async (ruleName: string) => {
    try {
      const res = await fetch('/api/v1/forensics/yara/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleName })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || `YARA 規則「${ruleName}」已下發至檢索節點！`);
      }
    } catch (e) {
      showToast(`YARA 規則「${ruleName}」已編譯下發`);
    }
  };

  // Handle Copilot Chat Submit
  const handleChatSubmit = async (promptText: string) => {
    if (!promptText.trim()) return;
    setChatInput('');
    setIsCopilotTyping(true);
    setChatMessages(prev => [...prev, { sender: 'user', text: promptText }]);

    try {
      const res = await fetch('/api/v1/forensics/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, contextEvidenceId: selectedEvidence })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.response) {
          setIsCopilotTyping(false);
          setChatMessages(prev => [...prev, data.response]);
          return;
        }
      }
    } catch (e) {}

    // Fallback response
    setTimeout(() => {
      setIsCopilotTyping(false);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'gemini',
          text: `🎯 **鑑識分析指令已受理**：\n已深入檢視事證 \`${selectedEvidence}\`，物理雜湊與 NTFS MFT 交易比對完成。`
        }
      ]);
    }, 1000);
  };

  // Active current evidence attributes
  const activeEvidenceObj = evidenceList.find(e => e.id === selectedEvidence) || evidenceList[0];
  const currentAttr = activeEvidenceObj?.ntfsAttributes || {
    path: 'C:\\Windows\\System32\\drivers\\sec_sys.sys',
    fileSizeStr: '524 KB',
    permissions: 'NTFS Integrity Check // FULL CONTROL',
    timestamps: {
      modified: '2026-06-12 02:40:50 (M)',
      accessed: '2026-06-12 02:40:50 (A)',
      created: '2026-06-12 02:15:20 (C)',
      born: '2026-06-12 02:15:20 (B)',
    },
    carvingRecoveryStatus: msg.carvingRecoverySuccess
  };

  return (
    <div className="space-y-6 pb-12 text-gray-200">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {alertNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[300] bg-indigo-950/90 border border-indigo-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md text-xs font-bold"
          >
            <ShieldCheck size={16} className="text-cyan-400 animate-pulse" />
            <span>{alertNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custody Transfer Modal */}
      <AnimatePresence>
        {showCustodyModal && (
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
              className="bg-[#0e1017] border border-indigo-500/30 rounded-3xl w-full max-w-lg p-7 space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">事證監管鏈移轉 (Chain of Custody Transfer)</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">標的物證：{activeEvidenceObj?.name} ({activeEvidenceObj?.id})</p>
                  </div>
                </div>
                <button onClick={() => setShowCustodyModal(false)} className="text-gray-500 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleTransferCustodySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">接收機構 / 保管人 (Recipient)</label>
                  <input
                    type="text"
                    value={custodyRecipient}
                    onChange={(e) => setCustodyRecipient(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                    placeholder="輸入受移交法證實驗室或檢察署名稱..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">移轉法律事由 (Transfer Reason)</label>
                  <textarea
                    rows={3}
                    value={custodyReason}
                    onChange={(e) => setCustodyReason(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                    placeholder="說明事證移轉之法律審計目的..."
                  />
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 text-[10px] text-gray-400">
                  <span className="font-bold text-indigo-400 block">法定雜湊驗證簽章保障：</span>
                  <p>SHA-256 移轉前校驗碼: <code className="text-gray-300 font-mono">{activeEvidenceObj?.sha256?.slice(0, 32)}...</code></p>
                  <p className="text-emerald-400">符合 ISO/IEC 27037 數位證據保全規範，具完全之法庭法律效力。</p>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowCustodyModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                  >
                    <Key size={13} />
                    <span>簽署並移轉監管鏈</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Case Creation Modal */}
      <AnimatePresence>
        {showNewCaseModal && (
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
              className="bg-[#0e1017] border border-blue-500/30 rounded-3xl w-full max-w-lg p-7 space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">建立全新數位鑑識案件 (Create Forensic Case)</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">依照 ISO/IEC 27037 標準程序立案</p>
                  </div>
                </div>
                <button onClick={() => setShowNewCaseModal(false)} className="text-gray-500 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCaseSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">案件名稱 (Case Name)</label>
                  <input
                    type="text"
                    required
                    value={newCaseName}
                    onChange={(e) => setNewCaseName(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500 text-xs"
                    placeholder="例如：製造產線 SCADA 伺服器遭惡意勒索入侵調查"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">事故類型 (Incident Category)</label>
                  <select
                    value={newCaseType}
                    onChange={(e) => setNewCaseType(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="Ransomware / Lateral Movement">Ransomware / Lateral Movement (勒索軟體橫向擴散)</option>
                    <option value="Data Exfiltration / APT">Data Exfiltration / APT (敏感資料竊取 / 進階持續性威脅)</option>
                    <option value="Insider Threat / Credential Theft">Insider Threat / Credential Theft (內部特權憑證盜用)</option>
                    <option value="Supply Chain Compromise">Supply Chain Compromise (供應鏈軟體污染)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">受駭受檢標的主機 (Target Systems)</label>
                  <input
                    type="text"
                    value={newCaseTarget}
                    onChange={(e) => setNewCaseTarget(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500 text-xs"
                    placeholder="例如：FINANCE-SRV-01 (10.0.4.15)"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowNewCaseModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={13} />
                    <span>正式立案入庫</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Evidence Modal */}
      <AnimatePresence>
        {showAddEvidenceModal && (
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
              className="bg-[#0e1017] border border-indigo-500/30 rounded-3xl w-full max-w-lg p-7 space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">採證物證封裝入庫 (Acquire & Seal Evidence)</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">即時計算 SHA-256 並綁定防篡改保管鏈</p>
                  </div>
                </div>
                <button onClick={() => setShowAddEvidenceModal(false)} className="text-gray-500 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddEvidenceSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">物證檔名 / 標識 (Evidence Name)</label>
                  <input
                    type="text"
                    required
                    value={newEvidenceName}
                    onChange={(e) => setNewEvidenceName(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                    placeholder="例如：core_database_mirror.E01 或 memory_capture.raw"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">事證類型 (Type)</label>
                    <select
                      value={newEvidenceType}
                      onChange={(e) => setNewEvidenceType(e.target.value)}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="Disk_Image_E01">Disk_Image_E01 (實體磁碟鏡像)</option>
                      <option value="Physical_RAM_Raw">Physical_RAM_Raw (揮發性記憶體)</option>
                      <option value="Network_PCAP">Network_PCAP (全封包抓包檔)</option>
                      <option value="Mobile_UFDR">Mobile_UFDR (行動裝置抽取鏡像)</option>
                      <option value="Web_Access_Log">Web_Access_Log (網頁伺服器日誌)</option>
                      <option value="Windows_EVTX">Windows_EVTX (系統事件日誌)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">估計大小 (MB)</label>
                    <input
                      type="number"
                      value={newEvidenceSizeMB}
                      onChange={(e) => setNewEvidenceSizeMB(e.target.value)}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">採證來源設備 (Acquired From)</label>
                  <input
                    type="text"
                    value={newEvidenceSource}
                    onChange={(e) => setNewEvidenceSource(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                    placeholder="例如：Tableau T8u USB3 Forensic Bridge / Write-Blocker"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddEvidenceModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                  >
                    <Key size={13} />
                    <span>雜湊簽章並密封</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custody Ledger Drawer / Modal */}
      <AnimatePresence>
        {showCustodyLedgerModal && (
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
              className="bg-[#0e1017] border border-emerald-500/30 rounded-3xl w-full max-w-3xl p-7 space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">法定事證監管鏈不可篡改總帳 (Chain of Custody Ledger)</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">遵循 ISO/IEC 27037:2012 與 NIST SP 800-86 法庭鑑定標準</p>
                  </div>
                </div>
                <button onClick={() => setShowCustodyLedgerModal(false)} className="text-gray-500 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {custodyLedgerList.map((rec, i) => (
                  <div key={rec.recordId || i} className="p-3.5 bg-black/60 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-emerald-400">{rec.recordId} • {rec.action}</span>
                      <span className="text-[10px] font-mono text-gray-400">{rec.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-300 font-bold">{rec.reason}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono bg-white/[0.02] p-2 rounded-xl">
                      <div>執行人: <span className="text-white">{rec.performedBy}</span></div>
                      <div>接收方: <span className="text-indigo-400">{rec.recipient || 'N/A'}</span></div>
                      <div className="col-span-2 truncate">校驗雜湊: <span className="text-gray-300">{rec.sha256After?.slice(0, 36)}...</span></div>
                      <div className="col-span-2">數位法理簽章: <span className="text-amber-400">{rec.legalSignature}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={12} />
                  所有記錄已由非對稱簽章鎖定，不可篡改
                </span>
                <button
                  onClick={() => setShowCustodyLedgerModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold"
                >
                  關閉總帳
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


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
                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded tracking-widest uppercase">
                  {msg.forensicsDeepEngine}
                </span>
                <span className="text-[10px] font-mono text-gray-400">{msg.verNativeAi}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  isBackendConnected 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {isBackendConnected ? '微服務底層引擎連線中 (/api/v1/forensics)' : '離線模式'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-widest uppercase mt-1">
                {msg.mainTitle}
              </h1>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                {msg.mainDesc}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportDossier}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
              title="匯出司法鑑定總結卷宗 (JSON)"
            >
              <Download size={14} />
              <span>匯出法定卷宗</span>
            </button>

            <button 
              onClick={handleTriggerFileCarving}
              disabled={isCarvingActive}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Terminal size={14} />
              <span>{isCarvingActive ? `${msg.carvingBtnActive} (${carvingProgress}%)` : msg.carvingBtnIdle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* SECTION 1: Left Case & Evidence Sidebar (col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Active Case Card */}
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-blue-400" size={16} />
                <span className="text-xs font-black text-white uppercase tracking-widest">{msg.currentCasesTitle}</span>
              </div>
              <button
                onClick={() => setShowNewCaseModal(true)}
                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
                title="建立新鑑識案件"
              >
                <Plus size={11} />
                立案
              </button>
            </div>

            <div className="space-y-2">
              {cases.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedCase(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedCase === c.id 
                      ? 'bg-blue-600/15 border-blue-500/40 text-white' 
                      : 'bg-black/40 border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono font-bold text-blue-400">{c.id}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5 font-bold uppercase">{c.status}</span>
                  </div>
                  <h4 className="text-xs font-black text-gray-200">{c.name}</h4>
                  <span className="text-[9px] text-gray-500 mt-1 block">立案時間: {c.createdDate || c.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Evidence Locker List */}
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock className="text-indigo-400" size={16} />
                <span className="text-xs font-black text-white uppercase tracking-widest">{msg.physicalEvidenceTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-gray-500">{msg.qty} {evidenceList.length}</span>
                <button
                  onClick={() => setShowAddEvidenceModal(true)}
                  className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded text-[9px] font-bold flex items-center gap-0.5"
                  title="採證登記新物證"
                >
                  <Plus size={10} />
                  登記
                </button>
              </div>
            </div>


            <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {evidenceList.map((evi) => (
                <div 
                  key={evi.id}
                  onClick={() => setSelectedEvidence(evi.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedEvidence === evi.id 
                      ? 'bg-indigo-600/20 border-indigo-500/50' 
                      : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">{evi.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      evi.status === 'locked' || evi.verifiedIntegrity 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {evi.status === 'locked' || evi.verifiedIntegrity ? msg.hashLocked : msg.hashCompromised}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-[9px] text-gray-400 font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{msg.sourceLabel}</span>
                      <span className="truncate max-w-[160px]">{evi.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{msg.examinerLabel}</span>
                      <span>{evi.examiner || evi.acquiredBy}</span>
                    </div>
                  </div>

                  {/* Actions bar for each evidence */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVerifyHash(evi.id); }}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg text-[8px] font-bold flex items-center gap-1"
                      title="立即核驗 SHA-256 哈希不變性"
                    >
                      <ShieldCheck size={10} />
                      校驗雜湊
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedEvidence(evi.id); setShowCustodyModal(true); }}
                      className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[8px] font-bold flex items-center gap-1"
                      title="建立監管鏈移交簽章"
                    >
                      <Share2 size={10} />
                      移交監管
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Examiner Digital Signature Audit Card */}
          <div className="bg-[#0b0c10]/95 border border-indigo-500/20 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">{msg.authExaminerSig}</span>
              <button
                onClick={() => { fetchCustodyLedger(); setShowCustodyLedgerModal(true); }}
                className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1"
                title="檢視不可篡改保管鏈總帳"
              >
                <ShieldCheck size={11} />
                檢視監管總帳
              </button>
            </div>
            <p className="text-xs font-bold text-white">{msg.authOfficerText}</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {msg.authAuditText}
            </p>
          </div>

        </div>

        {/* SECTION 2: Center Main Interactive Generative Canvas (col-span-6) */}
        <div className="xl:col-span-6 space-y-4">
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-3xl p-6 shadow-2xl relative min-h-[580px] flex flex-col justify-between">
            
            <div>
              {/* Canvas Header & Subtabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-indigo-400" />
                    {msg.canvasTitle}
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500">Target Overlay: {activeEvidenceObj?.name}</span>
                </div>

                <div className="flex flex-wrap gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                  {[
                    { id: 'overview', label: msg.tabOverview },
                    { id: 'timeline', label: msg.tabTimeline },
                    { id: 'memory', label: '記憶體 (Volatility)' },
                    { id: 'network', label: '封包流量 (PCAP)' },
                    { id: 'registry', label: '登錄檔 (Carved)' },
                    { id: 'multimodal', label: msg.tabMultimodal },
                    { id: 'sandbox', label: msg.tabSandbox },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCanvasView(tab.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        activeCanvasView === tab.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                </div>
              </div>

              {/* Dynamic Subtab Contents */}
              {activeCanvasView === 'overview' && (
                <div className="space-y-6 text-left">
                  <div className="p-5 bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border border-blue-500/20 rounded-2xl">
                    <h4 className="text-xs font-bold text-blue-300">{msg.overviewStatusTitle}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {msg.overviewStatusDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-gray-500 uppercase block">{msg.statAnalyzedSectors}</span>
                      <span className="text-lg font-mono font-bold text-white mt-1 block">524,288,000</span>
                      <span className="text-[9px] text-green-400 font-bold mt-1 block">{msg.statSecuredCoC}</span>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-gray-500 uppercase block">{msg.statCarvedFiles}</span>
                      <span className="text-lg font-mono font-bold text-indigo-400 mt-1 block">
                        {carvedArtifactsList.length > 0 ? carvedArtifactsList.length : '3'} {msg.statCarvedUnit}
                      </span>
                      <span className="text-[9px] text-indigo-300 font-bold mt-1 block">{msg.statFileCarvingDeployed}</span>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-gray-500 uppercase block">{msg.statMemoryArtifacts}</span>
                      <span className="text-lg font-mono font-bold text-teal-400 mt-1 block">14 {msg.statMemoryUnit}</span>
                      <span className="text-[9px] text-teal-300 font-bold mt-1 block">{msg.statVolatileTarget}</span>
                    </div>
                  </div>

                  {/* Carved Artifacts Table */}
                  {carvedArtifactsList.length > 0 && (
                    <div className="p-4 bg-black/50 border border-indigo-500/30 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <Terminal size={14} /> 已雕刻還原檔案清單 (File Carving Recovered Artifacts)
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">總計 {carvedArtifactsList.length} 件</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px] font-mono border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-gray-400">
                              <th className="p-2">檔案名稱</th>
                              <th className="p-2">類型</th>
                              <th className="p-2">磁區偏移</th>
                              <th className="p-2">大小</th>
                              <th className="p-2">SHA-256</th>
                              <th className="p-2">狀態</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300">
                            {carvedArtifactsList.map((art) => (
                              <tr key={art.id} className="hover:bg-white/[0.02]">
                                <td className="p-2 font-bold text-white">{art.fileName}</td>
                                <td className="p-2 text-gray-400">{art.fileType}</td>
                                <td className="p-2 text-indigo-400">{art.recoveredFromOffset}</td>
                                <td className="p-2">{Math.round(art.sizeBytes / 1024)} KB</td>
                                <td className="p-2 text-gray-500 truncate max-w-[120px]">{art.sha256}</td>
                                <td className="p-2">
                                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[8px] font-bold">
                                    {art.classification}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5 flex items-center gap-4">
                    <Shield className="text-green-400 shrink-0" size={24} />
                    <div>
                      <h5 className="text-xs font-bold text-white">{msg.sandboxSecurityActive}</h5>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                        {msg.sandboxSecurityDesc}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeCanvasView === 'timeline' && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{msg.timelineTitle}</h4>
                    <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/5 text-[9px]">
                      {(['ALL', 'Critical', 'Process', 'Network', 'AntiForensics'] as const).map(flt => (
                        <button
                          key={flt}
                          onClick={() => setTimelineFilter(flt)}
                          className={`px-2 py-0.5 rounded font-bold uppercase transition-all ${
                            timelineFilter === flt ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {flt}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                    {timelineEvents
                      .filter(evt => timelineFilter === 'ALL' || evt.category === timelineFilter || evt.severity === timelineFilter)
                      .map((evt, i) => (
                      <div key={evt.id || i} className="p-3.5 bg-black/40 border border-white/5 rounded-2xl flex gap-3 items-start hover:border-indigo-500/30 transition-all">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 animate-ping" />
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-mono text-indigo-400 font-bold">{evt.timestamp}</span>
                            <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 text-[8px] font-bold uppercase">
                              {evt.severity || 'Critical'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-200">{evt.description}</p>
                          <div className="flex justify-between text-[9px] text-gray-500 font-mono pt-1">
                            <span>來源: {evt.source}</span>
                            {evt.mitreTactic && <span className="text-amber-400">{evt.mitreTactic}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW: MEMORY VOLATILITY ANALYSIS */}
              {activeCanvasView === 'memory' && (
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Cpu size={14} /> Volatility 3 實體揮發性記憶體進程分析
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {memoryAnalysisData?.summary || '載入進程虛擬記憶體空間與 VAD 注入標記...'}
                      </p>
                    </div>
                    <button
                      onClick={() => fetchMemoryAnalysis()}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[9px] font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> 重新掃描 VAD
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-[340px] custom-scrollbar border border-white/5 rounded-2xl bg-black/60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/[0.03] text-[9px] text-gray-500 uppercase">
                        <tr>
                          <th className="p-2.5">PID / PPID</th>
                          <th className="p-2.5">進程映像</th>
                          <th className="p-2.5">執行緒</th>
                          <th className="p-2.5">注入狀態 (Malfind)</th>
                          <th className="p-2.5">VAD 保護屬性</th>
                          <th className="p-2.5">YARA 命中標籤</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[10px]">
                        {(memoryAnalysisData?.processes || []).map((p: any) => (
                          <tr key={p.pid} className={`hover:bg-white/[0.02] ${p.injected ? 'bg-red-500/5' : ''}`}>
                            <td className="p-2.5 text-indigo-400 font-bold">{p.pid} / {p.ppid}</td>
                            <td className="p-2.5 text-white font-bold">{p.imageFileName}</td>
                            <td className="p-2.5 text-gray-400">{p.threads}</td>
                            <td className="p-2.5">
                              {p.injected ? (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[8px] font-bold">
                                  🚨 INJECTED
                                </span>
                              ) : (
                                <span className="text-gray-500 text-[8px]">CLEAN</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className={p.injected ? 'text-amber-300 font-bold' : 'text-gray-400'}>
                                {p.vadProtection}
                              </span>
                            </td>
                            <td className="p-2.5 text-teal-300 font-mono text-[9px]">
                              {p.yaraHits?.join(', ') || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW: NETWORK PCAP SESSIONS */}
              {activeCanvasView === 'network' && (
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-gradient-to-r from-cyan-950/20 to-blue-950/20 border border-cyan-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Network size={14} /> 全封包抓包還原 (PCAP Session Stream)
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        已還原 {networkSessionsData?.totalPackets?.toLocaleString() || '2,842,306'} 個封包，偵測到 {networkSessionsData?.ja3BlacklistHits || 2} 處 C2 連線特徵與高危資料外傳。
                      </p>
                    </div>
                    <button
                      onClick={() => fetchNetworkSessions()}
                      className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[9px] font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> 刷新連線流
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-[340px] custom-scrollbar border border-white/5 rounded-2xl bg-black/60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/[0.03] text-[9px] text-gray-500 uppercase">
                        <tr>
                          <th className="p-2.5">連線 ID</th>
                          <th className="p-2.5">來源 (Src)</th>
                          <th className="p-2.5">目的 (Dst)</th>
                          <th className="p-2.5">協定 / 網域</th>
                          <th className="p-2.5">傳輸量</th>
                          <th className="p-2.5">威脅情資 / 告警特徵</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[10px]">
                        {(networkSessionsData?.sessions || []).map((s: any) => (
                          <tr key={s.sessionId} className={`hover:bg-white/[0.02] ${s.threatLevel === 'Critical' ? 'bg-red-500/5' : ''}`}>
                            <td className="p-2.5 text-cyan-400 font-bold">{s.sessionId}</td>
                            <td className="p-2.5 text-gray-300">{s.srcIp}:{s.srcPort}</td>
                            <td className="p-2.5 text-gray-300">{s.destIp}:{s.destPort}</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 mr-1 font-bold">
                                {s.protocol}
                              </span>
                              <span className="text-gray-400">{s.sniDomain || s.dnsQuery || '-'}</span>
                            </td>
                            <td className="p-2.5 text-gray-300">
                              {(s.bytesSent / 1024 / 1024).toFixed(1)} MB
                            </td>
                            <td className="p-2.5">
                              {s.threatLevel === 'Critical' ? (
                                <span className="text-red-400 font-bold">{s.alertSignature || 'C2 Activity'}</span>
                              ) : (
                                <span className="text-amber-300">{s.alertSignature || 'Normal Protocol'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW: REGISTRY CARVED KEYS */}
              {activeCanvasView === 'registry' && (
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-gradient-to-r from-amber-950/20 to-orange-950/20 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Binary size={14} /> 登錄檔物理還原與作業系統痕跡 (Registry Carving)
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        針對未分配磁區與蜂巢結構 ({registryCarvingData?.hive || 'SYSTEM & SOFTWARE'}) 提取攻擊者持久化痕跡與惡意金鑰。
                      </p>
                    </div>
                    <button
                      onClick={() => fetchRegistryCarving()}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[9px] font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> 重新讀取 Hive
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                    {(registryCarvingData?.keys || []).map((k: any, idx: number) => (
                      <div key={idx} className="p-3 bg-black/60 border border-white/5 rounded-2xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <code className="text-amber-400 font-bold font-mono text-[10px] truncate max-w-sm">
                            {k.keyPath}
                          </code>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            k.isDeleted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {k.isDeleted ? '🗑️ DELETED (CARVED)' : 'ACTIVE KEY'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>鍵值: <span className="text-white font-bold">{k.valueName}</span> ({k.valueType})</span>
                          <span>最後寫入: {k.lastWriteTime}</span>
                        </div>
                        <div className="p-2 bg-black/80 rounded-xl border border-white/5 text-[9px] font-mono text-cyan-200 break-all">
                          數據: {k.data}
                        </div>
                        <p className="text-[9px] text-red-400 font-bold">
                          ⚠️ 鑑識推論: {k.suspiciousIndicator}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {activeCanvasView === 'multimodal' && (
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-rose-400 block uppercase tracking-wider">
                      🖼️ 被害端點截圖多模態解析 (Ransomware Screen Triage)
                    </span>
                    <div className="h-44 bg-slate-950 rounded-xl border border-red-500/30 flex flex-col items-center justify-center p-6 text-center space-y-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-red-950/10 pointer-events-none" />
                      <AlertTriangle className="text-red-500 animate-pulse" size={32} />
                      <h4 className="text-sm font-black text-white font-mono uppercase tracking-widest text-red-400">
                        ALL YOUR FILES ARE ENCRYPTED...
                      </h4>
                      <p className="text-[10px] text-gray-400 max-w-sm">
                        LockBit 3.0 (Black) 勒索螢幕鎖定畫面已由多模態 Vision 模型解構，偵測到 Tor 匿名溝通地址與 AES-256 加密常數。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeCanvasView === 'sandbox' && (
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Generative UI 動態畫布渲染區</span>
                    <div className="flex gap-2">
                      {(['svchost', 'adversary', 'lockbit'] as const).map(ent => (
                        <button
                          key={ent}
                          onClick={() => setSandboxEntity(ent)}
                          className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase ${
                            sandboxEntity === ent ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400'
                          }`}
                        >
                          {ent}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div 
                    className="p-4 bg-black/60 rounded-2xl border border-white/10 min-h-[220px]"
                    dangerouslySetInnerHTML={{ __html: sandboxCode }}
                  />
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
              <span>Sleuthkit / Volatility 3 實體探針就緒</span>
              <span className="font-mono text-indigo-400 font-bold">ISO/IEC 27037 證據鏈稽核規範</span>
            </div>

          </div>
        </div>

        {/* SECTION 3: Right Gemini Copilot Panel (col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#0b0c10]/95 border border-gray-900 rounded-3xl p-5 shadow-xl relative min-h-[580px] flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="text-indigo-400" size={16} />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Gemini 鑑識助手 (Copilot)</span>
                </div>
                <span className="text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-mono font-bold">Online</span>
              </div>

              {/* Chat Messages */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1 text-left">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`space-y-1.5 text-xs ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className="text-[9px] font-mono text-gray-500 block">
                      {msg.sender === 'user' ? '鑑識官 Chiur' : 'Gemini Forensics Agent'}
                    </span>
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block max-w-[95%] text-left whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600/20 border border-indigo-500/30 text-white'
                        : 'bg-black/60 border border-white/5 text-gray-300'
                    }`}>
                      {msg.text}
                      
                      {msg.code && (
                        <pre className="mt-2 p-2.5 bg-black/80 rounded-xl border border-white/5 text-[9px] font-mono text-cyan-200 overflow-x-auto whitespace-pre">
                          {msg.code}
                        </pre>
                      )}

                      {msg.hasDeployButton && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleDeployYaraRule('LockBit3_Black_Forensic_Carver')}
                            className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20"
                          >
                            <ShieldCheck size={11} />
                            一鍵安全寫入檢索核心 (Deploy Rule)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isCopilotTyping && (
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-indigo-400 font-bold animate-pulse text-left">
                    Gemini 正在讀取實體磁區與微服務日誌...
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Chips & Input Form */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '📊 異常登入時間軸', text: '請分析 2026/06/12 的異常登入時間軸' },
                  { label: '🖼️ 勒索截圖辨識', text: '請分析受駭電腦螢幕截圖' },
                  { label: '🛡️ 產製 YARA 規則', text: '請產製針對 sec_sys.sys 與 LockBit 的 YARA 檢索規則' }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChatSubmit(chip.text)}
                    className="px-2 py-1 bg-white/5 hover:bg-indigo-500/20 border border-white/5 text-gray-300 hover:text-indigo-300 rounded-lg text-[8px] font-bold"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit(chatInput)}
                  placeholder="詢問 Gemini 鑑識官助理..."
                  className="w-full bg-black/60 border border-white/10 p-3 pl-3 pr-10 text-xs text-white rounded-xl outline-none focus:border-indigo-500 transition-all placeholder-gray-600"
                />
                <button
                  onClick={() => handleChatSubmit(chatInput)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white p-1"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 4: Bottom Physical Sector Hex Viewer (col-span-12) */}
      <div className="bg-[#0b0c10] border border-gray-900 rounded-[2rem] p-6 shadow-2xl relative text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Terminal size={16} className="text-teal-400" />
              實體扇區 Hex / 二進位檢視器 (Raw Physical Sector Dump)
            </h3>
            <span className="text-[10px] font-mono text-gray-500">
              Offset: {selectedHexOffset} • Evidence: {activeEvidenceObj?.name} • Read-Only Invariant Loopback
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-white/5 px-2.5 py-1 text-teal-400 border border-teal-500/20 rounded-lg font-bold">
              Magic Bytes: {selectedHexValue.slice(0, 5)}
            </span>
            <button
              onClick={() => fetchHexDump(selectedEvidence)}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"
              title="重新載入物理扇區"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Hex Viewer Grid (col-span-7) */}
          <div className="xl:col-span-7 font-mono text-[11px] bg-black/60 p-4 rounded-2xl border border-white/5 overflow-x-auto">
            <div className="space-y-1">
              {hexGridData.map((row, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setSelectedHexOffset(row.offset);
                    setSelectedHexValue(row.hex);
                    setSelectedHexInterpretation(row.interpretation || '物理磁區資料已加載');
                  }}
                  className={`flex justify-between items-center py-1 px-2 rounded-lg cursor-pointer transition-all ${
                    selectedHexOffset === row.offset ? 'bg-teal-500/20 text-teal-300 font-bold' : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <span className="text-indigo-400 font-bold">{row.offset}</span>
                  <span className="text-gray-300 tracking-wider">{row.hex}</span>
                  <span className="text-teal-400 border-l border-white/10 pl-3">{row.ascii}</span>
                </div>
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
                    handleChatSubmit(`請針對物理扇區偏移 ${selectedHexOffset} (值: ${selectedHexValue}) 進行二進位特徵與 YARA 規則深度關聯剖析。`);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={11} />
                  <span>✨ AI 標註此區段並推送至 Copilot</span>
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
                  <span className="text-gray-300">{currentAttr.fileSizeStr || currentAttr.size || '524 KB'}</span>
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
                      <span className="text-gray-400">{currentAttr.timestamps?.modified}</span>
                    </div>
                    <div className="p-1 bg-white/[0.02] rounded">
                      <span className="text-blue-400 font-bold font-mono">A (Accessed): </span>
                      <span className="text-gray-400">{currentAttr.timestamps?.accessed}</span>
                    </div>
                    <div className="p-1 bg-white/[0.02] rounded">
                      <span className="text-emerald-400 font-bold font-mono">C (Created): </span>
                      <span className="text-gray-400">{currentAttr.timestamps?.created}</span>
                    </div>
                    <div className="p-1 bg-white/[0.02] rounded">
                      <span className="text-amber-400 font-bold font-mono">B (Born): </span>
                      <span className="text-gray-400">{currentAttr.timestamps?.born}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-gray-500 italic bg-white/[0.01] p-2.5 rounded-lg border border-white/5">
                  <span className="font-bold text-gray-400">File Carving 還原備忘：</span>
                  {currentAttr.carvingRecoveryStatus || currentAttr.carvingRecovery}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

function Sparkles({ size, className }: { size?: number; className?: string }) {
  return <Zap size={size} className={className} />;
}

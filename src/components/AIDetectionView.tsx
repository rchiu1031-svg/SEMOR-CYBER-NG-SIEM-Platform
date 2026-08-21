import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Cpu, 
  Database, 
  Search, 
  Server, 
  Play, 
  PlayCircle,
  RefreshCw, 
  Trash2, 
  Monitor, 
  ArrowRight, 
  Lock, 
  Network, 
  Activity, 
  Sparkles, 
  Radio, 
  Check, 
  X,
  ExternalLink,
  Flame,
  UserX,
  Zap,
  Globe
} from 'lucide-react';

interface AIDetectionViewProps {
  currentUser?: any;
  setActiveTab?: (tab: string) => void;
}

// Multi-language translation dictionary
const TRANSLATIONS = {
  zh: {
    activeIncidentWatch: '關鍵安全事件即時監控',
    threatHuntingEngine: '威脅自動獵捕引擎',
    t_poweredBy: '技術支援',
    title: 'AI 網路勒索與惡意破壞行為審計',
    subtitle: '專門對抗「憑證濫用/異常登入、內部資產敏感檢索、備份日誌庫橫向滲透、以及數據與陰影副本惡意刪除」等高隱蔽性雙重勒索攻擊路徑之 AI 智慧辨識系統。',
    autoMode: '自動持續偵測系統',
    manualMode: '手動智慧鑑識沙盒',
    manualSandbox: '手動威脅稽核沙盒模式',
    simulationRunning: '正忙碌擷取歷史安全指標與系統程序軌跡 (步驟 {step}/4)...',
    simulationReady: '系統處於綠色就緒狀態。隨時可針對異常遠端使用者、高熵安全日誌、和備份主機連線啟動深層關聯式稽核',
    runAudit: '立即啟動全案追蹤破壞演練',
    runningAudit: '正在模擬執行智能稽核與行為拼圖重建...',
    attackMapTitle: '駭客橫向移動與備份破壞 Attack Map',
    clickNodes: '點擊地圖節點以查看即時區域警報與連線屬性',
    node1Title: '外部攻擊出口',
    node1Sub: 'APT 代理跳板節點',
    node2Title: '異常登入 & 敏感檢索',
    node3Title: '備份伺服器 惡意刪除',
    isolatedLabel: '已隔離 (ISOLATED)',
    recoveryLabel: '還原完成 (RECOVERY OK)',
    backupsDestroyed: '備份遭刪除 (BACKUPS DESTROYED)',
    traceLogsTitle: '特權登入及備份刪除完整追蹤日誌 (Trace Timeline)',
    catchingThreats: '共捕獲 {step} 個威脅因子',
    scanning: '正在執行全維度相關性解碼與威脅建模...',
    mitreTactics: 'MITRE ATT&CK® 戰術關鍵階段解析',
    ctiMatch: 'CTI 威脅情報庫匹配',
    ctiDesc: '行為模型經與 APT29 (Cozy Bear) 在 2025 年第四季針對關鍵基礎設施進行資料抹除與勒索攻擊之雙重代碼模式進行交叉比對，相似度高達 94.2%。',
    aiCounsel: 'AI 智慧安全防禦配置分析專欄',
    aiPatternLabel: '識別威脅模型',
    aiPatternDouble: '雙重勒索與數據備份破壞攻擊 (Double Extortion & Sabotage)',
    aiPatternHost: '內部主機遭攻破與資產搜索 (Host Breach & Data Reconnaissance)',
    aiPatternLoading: '偵測載入中...',
    aiAnalysisDesc: '此攻擊鏈屬非常典型的【勒索軟體預備執行 + 抗災備份阻斷】演算法模式。駭客首先在非辦公時間以合法管理帳戶登入內部系統，立即搜尋敏感財務檔案（勒索談判籌碼），接著鎖定主要備份伺服器，使用腳本清空 Windows 卷影複製服務 (VSS Shadow Copies) 及備份目錄，切斷受害者的災後重建可能，最大化逼迫高額贖金。',
    aiRemediationTitle: 'AI 智慧聯動安全處置控制台',
    aiAlertHeader: 'AI 研判指出，該局部網路節點已陷入高度滲透。為了因應嚴重的二次擴散或勒索蔓延風險，強制啟用以下三線隔離與阻斷措施：',
    isolateAppLabel: '隔離內部受駭主機',
    isolateAppTitle: 'Isolate Host (PROD-APP-01)',
    isolatedStatusOk: '已封鎖隔離',
    isolatedStatusNo: '未隔離',
    isolateBtnOk: '✓ 被駭主機安全隔離成功',
    isolateBtnAction: '立刻啟動防火牆 RDP 連線黑名單隔離',
    killProcessLabel: '終止惡意查詢程序',
    killProcessTitle: 'Kill File Probe Threads',
    killedStatusOk: '威脅已刪除',
    killedStatusNo: '程序活躍中',
    killBtnOk: '✓ cmd.exe 惡意搜索程序已遭刪除',
    killBtnAction: '手動啟動終止惡意 Process。',
    restoreBackupLabel: '啟動唯讀離線備份還原',
    restoreBackupTitle: 'Incorporate Immutable Restore',
    restoredStatusOk: '還原完成',
    restoredStatusNo: '未復原',
    restoreBtnOk: '✓ 備份庫已順利回復昨日無損狀態',
    restoreBtnAction: '手動喚醒唯讀備份磁碟鏡像',
    actionLoading: '執行中...',
    restoringLoading: '離線調用中...',
    pleaseRunAudit: '請點擊「立即啟動全案追蹤破壞演練」以執行安全關聯式追蹤與 MITRE 自動匹配。',
    high: '高 (High)',
    critical: '緊急 (Critical)',
    mitreTtpMap: 'MITRE TTP 映射:',
    categoryType: '威脅類型:'
  },
  en: {
    activeIncidentWatch: 'Critical Incident Real-time Watch',
    threatHuntingEngine: 'Automated Threat Hunting Engine',
    t_poweredBy: 'Powered by',
    title: 'AI Ransomware & Destructive Sabotage Auditing',
    subtitle: 'Advanced AI system targeting low-observable cyber attacks including privilege abuse/abnormal logins, directory exploration, lateral movement to backup units, and malicious shadow volume destruction.',
    autoMode: 'Continuous Auto Detection',
    manualMode: 'Manual Forensic Sandbox',
    manualSandbox: 'Manual Threat Audit Sandbox Mode',
    simulationRunning: 'Extracting historical security indexes & system telemetry (Step {step}/4)...',
    simulationReady: 'Green status config ready. Ready to scan and correlates elevated logs, abnormal processes, and database access.',
    runAudit: 'Initialize Cyber Path Forensic Trace',
    runningAudit: 'Executing automated security correlation & event puzzle rebuilding...',
    attackMapTitle: 'Credential Lateral Move & Backup Destruction Attack Map',
    clickNodes: 'Click network nodes to view active alert details & connection parameters',
    node1Title: 'External compromised ingress',
    node1Sub: 'APT Proxy leap node',
    node2Title: 'Unusual Login & Secrets Probe',
    node3Title: 'Backup Sabotage & Destruction',
    isolatedLabel: 'Isolated (ISOLATED)',
    recoveryLabel: 'Recovery Complete (RECOVERY OK)',
    backupsDestroyed: 'Backups Sabotaged (BACKUPS DESTROYED)',
    traceLogsTitle: 'Elevated Privilege & Backup Sabotage Chronological Trace Timeline',
    catchingThreats: 'Total of {step} threat indicators identified',
    scanning: 'Reconstructing multidimensional connection profiles and machine states...',
    mitreTactics: 'MITRE ATT&CK® Tactic Phase mapping',
    ctiMatch: 'CTI Threat Intelligence Match',
    ctiDesc: 'Behavioral sequence matched with APT29 (Cozy Bear) Q4 2025 wipeout campaign targeting critical host repositories. Similarity index score: 94.2%.',
    aiCounsel: 'AI Intelligent Incident Counsel Column',
    aiPatternLabel: 'Identified Attack Pattern',
    aiPatternDouble: 'Double Extortion & Backup Inhibit Sabotage Strategy',
    aiPatternHost: 'Host Integrity Loss & Rapid Secrets Exfiltration',
    aiPatternLoading: 'Detecting telemetry...',
    aiAnalysisDesc: 'This chain matches a typical [Pre-ransomware exfiltration + Offline Disaster Recovery Inhibit] ransomware attack model. Threat actors leverage trusted local credentials off-hours, execute wildcard directory sweeps for critical accounting/keys, pivot into the main backup hypervisor through WinRM, and purge active Windows shadow copies (VSS Volume Shadow copies) to maximize extortion success.',
    aiRemediationTitle: 'AI Coordinated Response Procedures Control Panel',
    aiAlertHeader: 'AI engine indicates this active subnet sector is heavily compromised. Action targets designated below must be locked or quarantined immediately:',
    isolateAppLabel: 'Quarantine Infected Host Node',
    isolateAppTitle: 'Isolate Host (PROD-APP-01)',
    isolatedStatusOk: 'Isolated Successfully',
    isolatedStatusNo: 'Exposed',
    isolateBtnOk: '✓ Host successfully isolated',
    isolateBtnAction: 'Apply Firewall Rule to Restrict Inbound/Outbound RDP',
    killProcessLabel: 'Kill Reconnaissance Processes',
    killProcessTitle: 'Kill File Probe Threads',
    killedStatusOk: 'Threat Remediated',
    killedStatusNo: 'Processes Active',
    killBtnOk: '✓ Active cmd.exe search subprocesses terminated',
    killBtnAction: 'Perform Remote Force Terminate on Process Tree',
    restoreBackupLabel: 'Initiate Immutable Read-Only Recovery',
    restoreBackupTitle: 'Incorporate Immutable Restore',
    restoredStatusOk: 'Restored',
    restoredStatusNo: 'Backup compromised',
    restoreBtnOk: '✓ Immutable backup mounted & successfully restored',
    restoreBtnAction: 'Mount Immutable Read-Only Backup Copy Pool',
    actionLoading: 'Enforcing...',
    restoringLoading: 'Retrieving secure mirror...',
    pleaseRunAudit: 'Please click "Initialize Cyber Path Forensic Trace" to generate real-time attack graph & MITRE taxonomy indicators.',
    high: 'High',
    critical: 'Critical',
    mitreTtpMap: 'MITRE TTP Mapping:',
    categoryType: 'Category:'
  },
  ja: {
    activeIncidentWatch: 'セキュリティインシデント常時監視',
    threatHuntingEngine: '脅威ハンティング自動検出エンジン',
    t_poweredBy: 'テクノロジーアシスト',
    title: 'AI Ransomware とバックアップ抹殺行動監査',
    subtitle: '「管理者権限の濫用/異常ログイン、内部情報の広範な詮索、バックアップアーカイブへの横移動、およびシャドウコピー破壊」を見破るインテリジェントAI検知システム。',
    autoMode: '常時自動検知システム',
    manualMode: '手動セキュリティ監査サンドボックス',
    manualSandbox: '手動脅威監査プレイグラウンド',
    simulationRunning: 'セキュリティ指標と過去の行動レコードを収集中 (ステップ {step}/4)...',
    simulationReady: 'システム稼働は正常。任意のタイミングで異常なリモートログイン、異常なパス検索、不審なネットワーク接続の監査を実行できます。',
    runAudit: '全事象追跡シミュレーション起動',
    runningAudit: '知能分析、および挙動ログの再構築を実行中...',
    attackMapTitle: '横移動経路およびバックアップ抹殺アタックマップ',
    clickNodes: '各ノードをクリックして、ホスト状態と詳細ログを参照します',
    node1Title: '悪意ある外部インバウンド',
    node1Sub: 'APT プロキシ出口',
    node2Title: '特権の異常ログインと詮索',
    node3Title: 'バックアップ・サーバ破壊',
    isolatedLabel: '隔離完了 (ISOLATED)',
    recoveryLabel: '復元完了 (RECOVERY OK)',
    backupsDestroyed: 'バックアップ破損 (BACKUPS DESTROYED)',
    traceLogsTitle: '特権ログインとファイル破壊の追跡タイムライン',
    catchingThreats: 'ステップ {step} 個の脅威アノマリを識別しました',
    scanning: '安全情報データベースとノードアソシエーションを検証中...',
    mitreTactics: 'MITRE ATT&CK® 戦術フェーズ分析',
    ctiMatch: 'CTI 脅威インテリジェンス適合率',
    ctiDesc: '実例の攻撃パターンは、2025年第4四半期に主要インフラに対してワイプアウト破壊を仕掛けたAPT29 (Cozy Bear)と94.2%の確率で一致しています。',
    aiCounsel: 'AI 専門のインシデント自動診断パネル',
    aiPatternLabel: '適合された侵威タイプ',
    aiPatternDouble: '二重脅迫とバックアップリカバリ妨害攻撃 (Double Extortion & Sabotage)',
    aiPatternHost: 'ホストの脆弱性および重要情報の流出',
    aiPatternLoading: 'テレメトリ解析中...',
    aiAnalysisDesc: 'このキルチェーンは典型的な【ランサムウェア作動前準備 ＋ 障害復旧封鎖】シナリオの一部です。不審者は特定の管理者資格で内部接続後、広範な機密データを検索（交渉カード）、さらにバックアップサーバにWinRM経由でアクセスし、復元の基礎となるスナップショット（VSSシャドウコピー）を悪意を持って消去、復元の鍵を奪う計画です。',
    aiRemediationTitle: 'AI 協調スマートシステム隔離パッチ',
    aiAlertHeader: 'AIエンジンは該当するホストセクタが非常に危険な状態にあると判断。これ以上の損害・蔓延を阻止するため、直ちに以下を処理してください：',
    isolateAppLabel: '受駭ホストのセキュリティ隔離',
    isolateAppTitle: 'Isolate Host (PROD-APP-01)',
    isolatedStatusOk: '完全隔離済み',
    isolatedStatusNo: '未隔離',
    isolateBtnOk: '✓ ファイアウォール隔離ブロック処理は正常に完了しました',
    isolateBtnAction: '直ちにホストへのRDPアクセス通信を完全切断する',
    killProcessLabel: '悪意ある詮索プロセスの停止',
    killProcessTitle: 'Kill File Probe Threads',
    killedStatusOk: '強制終了完了',
    killedStatusNo: 'プロセス実行中',
    killBtnOk: '✓ cmd.exe 不審プロセスの停止を確認しました',
    killBtnAction: 'アクティブプロセススレッドを強制終了する',
    restoreBackupLabel: '不変的なデータリカバリを呼び出す',
    restoreBackupTitle: 'Incorporate Immutable Restore',
    restoredStatusOk: '復旧完了',
    restoredStatusNo: '未復元',
    restoreBtnOk: '✓ 暗号化されていない前日のオフライン不変バックアップを復元しました',
    restoreBtnAction: 'オフラインの不変コピーボリュームを呼び出す',
    actionLoading: '処理を実行中...',
    restoringLoading: 'データを適用中...',
    pleaseRunAudit: '「全事象追跡シミュレーション起動」をクリックして攻撃マップとインシデント指標を表示してください。',
    high: '高 (High)',
    critical: '致命的 (Critical)',
    mitreTtpMap: 'MITRE TTP 対照:',
    categoryType: 'カテゴリ:'
  }
};

export default function AIDetectionView({ currentUser, setActiveTab }: AIDetectionViewProps) {
  const { i18n } = useTranslation();
  
  // Choose language mapping: support zh-TW, zh-CN, etc. using startsWith; default to 'zh' if 'zh' else match 'ja' or 'en'
  const currentLang = i18n.language || 'zh';
  const langKey = currentLang.startsWith('ja') ? 'ja' : currentLang.startsWith('en') ? 'en' : 'zh';
  const t = TRANSLATIONS[langKey];

  // Modes: 'auto' | 'manual'
  const [detectionMode, setDetectionMode] = useState<'auto' | 'manual'>('auto');
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(false);
  const [simulationStep, setSimulationStep] = useState(4); // Fully loaded by default for auto, starts at 0 for manual
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  
  // Interactive action states
  const [hostIsolated, setHostIsolated] = useState(false);
  const [backupIsolated, setBackupIsolated] = useState(false);
  const [threatTerminated, setThreatTerminated] = useState(false);
  const [vssRestored, setVssRestored] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

  // Auto/Manual mode synchronization
  useEffect(() => {
    if (detectionMode === 'auto') {
      setSimulationStep(4);
    } else {
      setSimulationStep(0);
    }
  }, [detectionMode]);

  // Run the manual scan step-by-step
  const startManualScan = () => {
    setIsPlayingSimulation(true);
    setSimulationStep(0);
    setHostIsolated(false);
    setBackupIsolated(false);
    setThreatTerminated(false);
    setVssRestored(false);

    // Timed ticks for trace steps
    const timers = [
      setTimeout(() => setSimulationStep(1), 1000),
      setTimeout(() => setSimulationStep(2), 2500),
      setTimeout(() => setSimulationStep(3), 4000),
      setTimeout(() => setSimulationStep(4), 5500),
      setTimeout(() => setIsPlayingSimulation(false), 6500)
    ];

    return () => timers.forEach(clearTimeout);
  };

  const handleMitigateAction = (actionId: string, actionFn: () => void) => {
    setIsProcessingAction(actionId);
    setTimeout(() => {
      actionFn();
      setIsProcessingAction(null);
    }, 1200);
  };

  // Localized trace steps data elements
  const traceSteps = [
    {
      id: 1,
      title: langKey === 'ja' 
        ? '通常外の特權ログイン (Abnormal Host Login)' 
        : langKey === 'en' 
        ? 'Anomalous Administrative Login' 
        : '異常登入偵測 (Abnormal Host Login)',
      time: '19:42:01',
      device: 'PROD-APP-01 (10.150.10.22)',
      type: 'Credential Abuse / Ingress hijacking',
      severity: t.high,
      desc: langKey === 'ja'
        ? '想定されていない時間帯（非勤務時間）に管理者が遠隔認証情報（RDP）を用いてログインしました。インバウンド元: 103.55.92.12（安全でないプロキシから転送）。'
        : langKey === 'en'
        ? 'Detected anomalous off-hours inbound RDP activity for user Local_Administrator. Source Gateway: 103.55.92.12 (potential leap-host block).'
        : '偵測到異常、不符日常作息規律之 RDP 登入行為，帳號為 Administrator。來源 IP 103.55.92.12 (屬外蒙古代理跳板)。',
      mitre: 'T1078.001 - Valid Accounts: Local Accounts',
      icon: <UserX className="text-red-400 w-5 h-5" />,
      nodeId: 'attacker'
    },
    {
      id: 2,
      title: langKey === 'ja'
        ? '機密スプレッドシートやデータの詮索 (Reconnaissance files)'
        : langKey === 'en'
        ? 'Secrets Enumeration & Wildcard File Discovery'
        : '內部主機敏感資料搜尋 (Host Secrets & File Directory Searching)',
      time: '19:43:15',
      device: 'PROD-APP-01 (10.150.10.22)',
      type: 'Local Reconnaissance / Directory Discovery',
      severity: t.critical,
      desc: langKey === 'ja'
        ? '侵害されたホスト上で cmd.exe プロセスが生成され、高感度ワイルドカード検索「dir /s *.xlsx *.xlsm *.db *.pgp」により財務文書、鍵情報、データベース名がリストアップされました。'
        : langKey === 'en'
        ? 'Host spawned command process spawning search directives "dir /s *.xlsx *.xlsm *.db *.pgp" querying financials, pass-stores, and active configurations.'
        : '駭客於主機內啟用 cmd.exe 連續下達高敏感檢索指令 dir /s *.xlsx *.xlsm *.db *.pgp，正積極搜尋財務密碼清冊與數據庫路徑。',
      mitre: 'T1083 - File and Directory Discovery',
      icon: <Search className="text-orange-400 w-5 h-5" />,
      nodeId: 'compromised-host'
    },
    {
      id: 3,
      title: langKey === 'ja'
        ? '管理用サービスを悪用した横移動 (Lateral Move to Backup Server)'
        : langKey === 'en'
        ? 'Lateral Translation & Authentication Hop'
        : '橫向滲透備份主機 (Lateral Movement to Backup Server)',
      time: '19:44:30',
      device: 'BACKUP-MASTER-SRV (10.150.20.100)',
      type: 'Remote Services hijacking',
      severity: t.critical,
      desc: langKey === 'ja'
        ? '不審者は、PROD-APP-01 から WinRM 接続（Credential Overpass / Overpass-the-Hash）を確立し、主バックアップサーバへの進入に成功。復旧装置の完全沈黙を試行中。'
        : langKey === 'en'
        ? 'Host malicious console established remote control terminal via WinRM to core backup controller BACKUP-MASTER-SRV seeking total asset compromise.'
        : '攻擊者意圖切斷備份復原路徑。自 PROD-APP-01 藉由 WinRM 憑證跳越 (Credential Overpass)，橫向連線登入至備份主機中。',
      mitre: 'T1021.006 - Remote Services: Windows Remote Management',
      icon: <Network className="text-purple-400 w-5 h-5" />,
      nodeId: 'lateral'
    },
    {
      id: 4,
      title: langKey === 'ja'
        ? 'VSS シャドウコピー抹殺およびバックアップ削除 (Ransomware Destruction)'
        : langKey === 'en'
        ? 'Active System Recovery Invalidation & Sabotage'
        : '惡意刪除備份檔案 (Destruction of Backup Databases)',
      time: '19:45:12',
      device: 'BACKUP-MASTER-SRV (10.150.20.100)',
      type: 'Data Sabotage / Inhibit System Recovery',
      severity: t.critical,
      desc: langKey === 'ja'
        ? '悪意あるPowerShellコードが走り、Windowsシャドウコピー(VSS Shadow Copies)を完全消去、さらにバックアッププールフォルダ内のファイルを不可逆的に削除しました。これにより、平常運用への自動復帰が遮断されました。'
        : langKey === 'en'
        ? 'Triggered hostile PowerShell payload executing deep deletion of shadow volume services (VSS Shadow Mirror) and purged archive paths on immutable pool.'
        : '執行惡意 PowerShell 腳本刪除 Windows 備份陰影複製磁碟 (VSS Shadow Copies) 並清空 backup-repository 日常備份檔案，阻斷客戶進行任何災後復原之機率。',
      mitre: 'T1485 - Data Destruction & T1490 - Inhibit Recovery',
      icon: <Trash2 className="text-red-500 w-5 h-5" />,
      nodeId: 'backup-server'
    }
  ];

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12 animate-fade-in" id="ai-threat-detection-module">
      
      {/* Title block with animated radar effect */}
      <div className="relative bg-gradient-to-r from-red-950/20 via-[#111114] to-gray-900 border border-gray-800 rounded-2xl p-6 lg:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[10px] font-mono text-red-400 font-extrabold uppercase tracking-widest">{t.activeIncidentWatch}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400 font-extrabold tracking-[0.3em] uppercase bg-red-500/10 px-2 py-0.5 rounded-md">{t.threatHuntingEngine}</span>
              <span className="text-xs text-gray-500">• {t.t_poweredBy} XDR Interflow™</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
              {t.title}
            </h2>
            <p className="text-xs lg:text-sm text-gray-400 max-w-2xl font-sans leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Mode Switcher panel */}
          <div className="shrink-0 p-1.5 bg-gray-900/80 border border-gray-800 rounded-xl flex items-center gap-1">
            <button
              onClick={() => { setDetectionMode('auto'); }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                detectionMode === 'auto' 
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/10" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Radio size={14} className={detectionMode === 'auto' ? 'animate-pulse' : ''} /> {t.autoMode}
            </button>
            <button
              onClick={() => { setDetectionMode('manual'); }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                detectionMode === 'manual' 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Cpu size={14} /> {t.manualMode}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Start Panel / Scan Engine state */}
      <AnimatePresence mode="wait">
        {detectionMode === 'manual' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-[#111114] border border-blue-900/30 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-blue-500 shadow-xl"
          >
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest font-mono block">{t.manualSandbox}</span>
              <p className="text-xs text-gray-300">
                {isPlayingSimulation 
                  ? t.simulationRunning.replace('{step}', String(simulationStep))
                  : t.simulationReady
                }
              </p>
            </div>
            <button
              onClick={startManualScan}
              disabled={isPlayingSimulation}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-blue-600/15"
            >
              <Play size={14} className={isPlayingSimulation ? "animate-spin" : ""} /> 
              {isPlayingSimulation ? t.runningAudit : t.runAudit}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Left - Attack Map (Visual Graph) & Steps Trace | Right - AI Analysis & Interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns (8 cols): Map and Timeline Logs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: ATTACK MAP Visual Topology */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/[0.015] via-transparent to-transparent pointer-events-none"></div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2">
                <Network className="text-red-400 w-5 h-5 animate-pulse" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider italic">{t.attackMapTitle}</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {t.clickNodes}
              </span>
            </div>

            {/* SVG Interactive Topology Visualization */}
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl relative min-h-[300px] flex items-center justify-center">
              
              {/* Outer Glow Overlay */}
              <div className="absolute inset-0 border border-red-500/5 rounded-xl pointer-events-none animate-pulse"></div>

              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

              {/* Central SVG lines for connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  {/* Animating marker gradients */}
                  <linearGradient id="attacker-to-host" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="host-to-backup" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Animated Packet Dashes Flow 1: Attacker to PROD-APP-01 */}
                {simulationStep >= 1 && (
                  <path 
                    d="M 120,150 Q 230,110 340,150" 
                    fill="none" 
                    stroke="url(#attacker-to-host)" 
                    strokeWidth="2" 
                    strokeDasharray="5, 5"
                    style={{ animationDuration: '1.5s' }}
                    className="animate-pulse"
                  />
                )}

                {/* Animated Packet Dashes Flow 2: PROD-APP-01 to Backup Srv */}
                {simulationStep >= 3 && (
                  <path 
                    d="M 440,150 Q 550,110 660,150" 
                    fill="none" 
                    stroke="url(#host-to-backup)" 
                    strokeWidth="2" 
                    strokeDasharray="5, 5"
                    style={{ animationDuration: '1s' }}
                    className="animate-pulse"
                  />
                )}
              </svg>

              {/* Nodes layout using Flex/Grid over absolute positioning absolute coords for precise sizing responsive */}
              <div className="grid grid-cols-3 gap-8 w-full max-w-3xl relative z-10 py-6">
                
                {/* Node 1: External Hacker console */}
                <div 
                  onClick={() => setHighlightedNode('attacker')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    highlightedNode === 'attacker' ? 'bg-red-500/10 border-red-500' : 'bg-gray-900/80 border-gray-800 hover:border-red-500/40'
                  } ${simulationStep >= 1 ? 'opacity-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'opacity-40'}`}
                >
                  <div className="relative p-3 bg-red-950/40 border border-red-500/40 rounded-full mb-3 animate-pulse">
                    <UserX className="w-8 h-8 text-red-500" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-600 rounded-full flex items-center justify-center text-[7px] text-white font-bold">1</span>
                  </div>
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest font-mono">103.55.92.12</span>
                  <span className="text-xs font-bold text-white uppercase mt-1">{t.node1Title}</span>
                  <span className="text-[9px] text-gray-500 italic mt-0.5">{t.node1Sub}</span>
                </div>

                {/* Node 2: PROD-APP-01 (Internal Compromised server) */}
                <div 
                  onClick={() => setHighlightedNode('compromised-host')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                    highlightedNode === 'compromised-host' ? 'bg-orange-500/10 border-orange-500' : 'bg-gray-900/80 border-gray-800 hover:border-orange-500/40'
                  } ${simulationStep >= 2 ? 'opacity-100 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'opacity-40'}`}
                >
                  {/* Status Indicator bubble */}
                  {hostIsolated && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-green-900/80 border border-green-500/40 text-[8px] font-black text-green-400 uppercase tracking-widest rounded-full">
                      {t.isolatedLabel}
                    </div>
                  )}

                  <div className="relative p-3 bg-orange-950/40 border border-orange-500/40 rounded-full mb-3">
                    <Monitor className={`w-8 h-8 ${hostIsolated ? 'text-green-400' : 'text-orange-500 animate-bounce'}`} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold">2</span>
                  </div>
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest font-mono">PROD-APP-01</span>
                  <span className="text-xs font-bold text-white mt-1">{t.node2Title}</span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5">10.150.10.22</span>
                </div>

                {/* Node 3: Backup Database Server */}
                <div 
                  onClick={() => setHighlightedNode('backup-server')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                    highlightedNode === 'backup-server' ? 'bg-red-500/10 border-red-500' : 'bg-gray-900/80 border-gray-800 hover:border-red-500/40'
                  } ${simulationStep >= 4 ? 'opacity-100 shadow-[0_0_20px_rgba(239,68,68,0.25)] border-red-600' : 'opacity-40'}`}
                >
                  {/* Backup destruction flashing alert */}
                  {simulationStep >= 4 && !vssRestored && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-red-950/80 border border-red-500 text-[8px] font-black text-red-500 uppercase tracking-widest rounded-full animate-pulse">
                      {t.backupsDestroyed}
                    </div>
                  )}
                  {vssRestored && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-green-900/80 border border-green-500 text-[8px] font-black text-green-400 uppercase tracking-widest rounded-full">
                      {t.recoveryLabel}
                    </div>
                  )}

                  <div className="relative p-3 bg-red-950/40 border border-red-500/40 rounded-full mb-3">
                    <Database className={`w-8 h-8 ${vssRestored ? 'text-green-400' : 'text-red-500 animate-pulse'}`} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-600 rounded-full flex items-center justify-center text-[7px] text-white font-bold">4</span>
                  </div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest font-mono">BACKUP-MASTER</span>
                  <span className="text-xs font-bold text-white mt-1">{t.node3Title}</span>
                  <span className="text-[9px] text-gray-400 font-mono mt-0.5">10.150.20.100</span>
                </div>

              </div>

            </div>
          </div>

          {/* Section 2: Hacker action trace records (all chronological tracks) */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2">
                <Terminal className="text-blue-400 w-5 h-5" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider italic">{t.traceLogsTitle}</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">
                {detectionMode === 'manual' && isPlayingSimulation 
                  ? t.scanning 
                  : t.catchingThreats.replace('{step}', String(simulationStep))
                }
              </span>
            </div>

            {/* Steps stream Container */}
            <div className="space-y-4">
              <AnimatePresence>
                {traceSteps.slice(0, simulationStep).map((step, idx) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setHighlightedNode(step.nodeId)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-left ${
                      highlightedNode === step.nodeId 
                        ? 'bg-red-500/[0.03] border-red-500/50' 
                        : 'bg-black/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                          {step.icon}
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-red-400 font-black border border-red-400/20 px-1.5 py-0.5 rounded bg-red-400/5 uppercase mr-2 text-[10px]">
                            {step.severity}
                          </span>
                          <span className="text-xs font-black text-white uppercase">{step.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <span className="text-[10px] font-mono text-gray-500">{step.time}</span>
                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-800/40 px-2 py-0.5 rounded">
                          {step.device}
                        </span>
                      </div>
                    </div>

                    <div className="pl-9 space-y-2.5">
                      <p className="text-xs text-gray-300 leading-relaxed font-sans font-medium">
                        {step.desc}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-500 uppercase font-black">{t.mitreTtpMap}</span>
                          <span className="px-2 py-0.5 bg-orange-900/10 border border-orange-800/30 rounded text-orange-400 text-[10px] font-mono font-black">
                            {step.mitre}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase font-bold italic">
                          {t.categoryType} {step.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {simulationStep === 0 && (
                <div className="p-12 text-center bg-black/20 rounded-xl border border-dashed border-gray-800">
                  <PlayCircle className="w-12 h-12 text-gray-700 mx-auto mb-4 animate-bounce" />
                  <h4 className="text-xs text-gray-500 uppercase font-bold tracking-widest font-mono">{t.pleaseRunAudit}</h4>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Columns (4 cols): AI Analysis, MITRE Framework mapping, Action buttons */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Box 1: AI Analysis & Cyber Attack Model Recognition */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-2 pb-4 border-b border-white/5 mb-6">
              <Sparkles className="text-purple-400 w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-extrabold text-white uppercase italic tracking-wider">{t.aiCounsel}</h3>
            </div>

            <div className="space-y-5 text-left">
              
              {/* Pattern Header */}
              <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-1.5">
                <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest block font-mono">{t.aiPatternLabel}</span>
                <span className="text-sm font-black text-white uppercase italic tracking-tight">
                  {simulationStep >= 4 
                    ? t.aiPatternDouble
                    : simulationStep >= 2
                    ? t.aiPatternHost
                    : t.aiPatternLoading
                  }
                </span>
                
                {simulationStep >= 4 && (
                  <p className="text-[10.5px] text-gray-300 font-sans leading-relaxed pt-1.5 border-t border-purple-500/10 mt-1">
                    {t.aiAnalysisDesc}
                  </p>
                )}
              </div>

              {/* MITRE ATT&CK Matrix Mapping tags */}
              <div className="space-y-2">
                <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block font-mono">{t.mitreTactics}</span>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'T1078', name: 'Valid Accounts', phase: 'Initial Access', active: simulationStep >= 1 },
                    { id: 'T1083', name: 'File Discovery', phase: 'Discovery', active: simulationStep >= 2 },
                    { id: 'T1021', name: 'Remote Services', phase: 'Lateral Move', active: simulationStep >= 3 },
                    { id: 'T1485', name: 'Data Destruction', phase: 'Impact', active: simulationStep >= 4 }
                  ].map(ttp => (
                    <div 
                      key={ttp.id} 
                      className={`p-2 border rounded-lg transition-all ${
                        ttp.active 
                          ? 'bg-red-950/20 border-red-500/30 text-red-400' 
                          : 'bg-black/30 border-white/5 text-gray-600'
                      }`}
                    >
                      <div className="font-mono text-[9px] font-extrabold">{ttp.id}</div>
                      <div className="text-[10px] font-bold text-white truncate">{ttp.name}</div>
                      <div className="text-[8px] text-gray-500 uppercase tracking-tighter truncate">{ttp.phase}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threat intelligence info box */}
              <div className="pt-4 border-t border-white/5 text-[10.5px] text-gray-500 space-y-1.5 leading-snug">
                <span className="font-extrabold uppercase block text-gray-400 tracking-wider">{t.ctiMatch}</span>
                <p className="font-sans text-gray-400">
                  {t.ctiDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Box 2: Automated Actions & Decision Mitigation Triggers */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-2 pb-4 border-b border-white/5 mb-6">
              <Zap className="text-red-400 w-5 h-5" />
              <h3 className="text-sm font-extrabold text-white uppercase italic tracking-wider">{t.aiRemediationTitle}</h3>
            </div>

            <div className="space-y-4">
              <div className="text-[10.5px] text-gray-400 leading-relaxed text-left font-sans bg-black/40 p-3 rounded-lg border border-white/5">
                {t.aiAlertHeader}
              </div>

              {/* Action 1: Isolate PROD-APP-01 */}
              <div className="flex flex-col gap-2 p-3 bg-black/50 border border-white/5 rounded-xl text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-0.5">{t.isolateAppLabel}</span>
                    <span className="text-xs font-black text-white uppercase">{t.isolateAppTitle}</span>
                  </div>
                  <span className={`text-[9px] font-mono py-0.5 px-1.5 rounded font-black ${
                    hostIsolated ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                  }`}>
                    {hostIsolated ? t.isolatedStatusOk : t.isolatedStatusNo}
                  </span>
                </div>
                <button
                  disabled={hostIsolated || isProcessingAction !== null || simulationStep < 1}
                  onClick={() => handleMitigateAction('isolate', () => setHostIsolated(true))}
                  className={`w-full py-2 ${
                    hostIsolated ? 'bg-green-600/20 text-green-400' : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-40 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1`}
                >
                  {isProcessingAction === 'isolate' ? (
                    t.actionLoading
                  ) : hostIsolated ? (
                    <><Check size={12} /> {t.isolateBtnOk}</>
                  ) : (
                    t.isolateBtnAction
                  )}
                </button>
              </div>

              {/* Action 2: Terminate Suspicious command process */}
              <div className="flex flex-col gap-2 p-3 bg-black/50 border border-white/5 rounded-xl text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-0.5">{t.killProcessLabel}</span>
                    <span className="text-xs font-black text-white uppercase">{t.killProcessTitle}</span>
                  </div>
                  <span className={`text-[9px] font-mono py-0.5 px-1.5 rounded font-black ${
                    threatTerminated ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                  }`}>
                    {threatTerminated ? t.killedStatusOk : t.killedStatusNo}
                  </span>
                </div>
                <button
                  disabled={threatTerminated || isProcessingAction !== null || simulationStep < 2}
                  onClick={() => handleMitigateAction('terminate', () => setThreatTerminated(true))}
                  className={`w-full py-2 ${
                    threatTerminated ? 'bg-green-600/20 text-green-400' : 'bg-orange-600 hover:bg-orange-700 text-white'
                  } disabled:opacity-40 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all`}
                >
                  {isProcessingAction === 'terminate' ? t.actionLoading : threatTerminated ? t.killBtnOk : t.killBtnAction}
                </button>
              </div>

              {/* Action 3: Restore backup snapshot from immutable pool */}
              <div className="flex flex-col gap-2 p-3 bg-black/50 border border-white/5 rounded-xl text-left col-span-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-0.5">{t.restoreBackupLabel}</span>
                    <span className="text-xs font-black text-white uppercase">{t.restoreBackupTitle}</span>
                  </div>
                  <span className={`text-[9px] font-mono py-0.5 px-1.5 rounded font-black ${
                    vssRestored ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                  }`}>
                    {vssRestored ? t.restoredStatusOk : t.restoredStatusNo}
                  </span>
                </div>
                <button
                  disabled={vssRestored || isProcessingAction !== null || simulationStep < 4}
                  onClick={() => handleMitigateAction('vss', () => setVssRestored(true))}
                  className={`w-full py-2 ${
                    vssRestored ? 'bg-green-600/20 text-green-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-40 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all`}
                >
                  {isProcessingAction === 'vss' ? t.restoringLoading : vssRestored ? t.restoreBtnOk : t.restoreBtnAction}
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

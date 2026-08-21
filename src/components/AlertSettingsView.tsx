import React, { useState } from 'react';
import { 
  Mail, 
  Users, 
  BellRing, 
  Layout, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Clock, 
  Tag, 
  Folder, 
  Database, 
  Activity, 
  Binary, 
  Target, 
  FileText, 
  Webhook, 
  Workflow, 
  ArrowLeft, 
  ArrowRight, 
  Settings2, 
  Image, 
  Smartphone, 
  Monitor, 
  Lightbulb, 
  Send, 
  Shield, 
  X, 
  Download, 
  Filter, 
  ExternalLink,
  MessageSquare,
  Radio,
  Sliders,
  Sparkles,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AlertSettingsViewProps {
  isReadOnly?: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  field: string;
  keyword: string;
  ip: string;
  group: string;
  severity: 'Critical' | 'High' | 'Warning' | 'Info';
  enabled: boolean;
  interval: string;
  pendingPeriod: string;
  summary: string;
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  contacts: { name: string; email: string; phone?: string }[];
  severity: string[];
  channels: ('email' | 'slack' | 'teams' | 'sms' | 'webhook')[];
}

interface TriggerLogItem {
  id: string;
  ruleName: string;
  lastTrigger: string;
  totalTriggers: number;
  status: '成功 (Success)' | '失敗 (SMTP 逾時)' | '部分傳遞 (Partial)';
  targets: string;
  severity: 'Critical' | 'High' | 'Warning' | 'Info';
  logs: {
    time: string;
    value: string;
    status: 'Success' | 'Failed';
    recipient: string;
    channel: string;
  }[];
}

export default function AlertSettingsView({ isReadOnly = false }: AlertSettingsViewProps) {
  const [activeConfigTab, setActiveConfigTab] = useState<'server' | 'groups' | 'rules' | 'template' | 'channels' | 'history'>('server');
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Email Server Configuration State
  const [emailServer, setEmailServer] = useState({
    host: 'smtp.office365.com',
    port: '587',
    encryption: 'TLS',
    auth: true,
    user: 'soc-alerts@semor-security.com',
    pass: '••••••••••••',
    fromName: 'SEMOR 資安監控與威脅應變中心',
    fromEmail: 'soc-alerts@semor-security.com',
    replyTo: 'security-team@semor-security.com',
    enableQueue: true,
    retryCount: '3',
    timeoutSec: '15'
  });

  // Test Mail Dialog State
  const [showTestMailModal, setShowTestMailModal] = useState(false);
  const [testMailRecipient, setTestMailRecipient] = useState('admin-oncall@semor-security.com');
  const [testMailStatus, setTestMailStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [testMailLogs, setTestMailLogs] = useState<string[]>([]);

  // Additional Alert Channels
  const [channels, setChannels] = useState({
    slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', channel: '#soc-critical-alerts' },
    teams: { enabled: true, webhookUrl: 'https://outlook.office.com/webhook/xxxxxxx/IncomingWebhook/xxxxxxx', channel: '資安應變專案群組' },
    lineNotify: { enabled: false, token: '••••••••••••••••••••••••••••••••••••••••' },
    syslogForward: { enabled: true, server: '192.168.10.250', port: '514', proto: 'UDP' }
  });

  // Notification Groups
  const [groups, setGroups] = useState<RecipientGroup[]>([
    { 
      id: '1', 
      name: 'SOC 一線值班應變組 (SOC Tier 1)', 
      description: '負責即時事件確認、威脅分流與初步阻斷處置',
      contacts: [
        { name: '王大明 (Lead)', email: 'alice.wang@semor-security.com', phone: '+886 912-345-678' },
        { name: '李小華 (Analyst)', email: 'bob.lee@semor-security.com', phone: '+886 923-456-789' }
      ], 
      severity: ['緊急 (Critical)', '高風險 (High)'],
      channels: ['email', 'slack']
    },
    { 
      id: '2', 
      name: 'IT 基礎架構與雲端管理員 (IT Infrastructure)', 
      description: '負責網路設備、網域伺服器與虛擬化主機之配置變更',
      contacts: [
        { name: '張志豪 (SysAdmin)', email: 'charlie.chang@semor-security.com', phone: '+886 934-567-890' }
      ], 
      severity: ['緊急 (Critical)'],
      channels: ['email', 'teams']
    },
    { 
      id: '3', 
      name: '資安主管與法遵決策層 (CISO & Executive)', 
      description: '重大資安事件升級、監管通報與企業營運衝擊評估',
      contacts: [
        { name: '陳執行長 (CISO)', email: 'ciso@semor-security.com' },
        { name: '林法遵長 (Compliance)', email: 'compliance@semor-security.com' }
      ], 
      severity: ['緊急 (Critical)'],
      channels: ['email', 'sms']
    }
  ]);

  // Quick Add Contact State
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactGroup, setNewContactGroup] = useState('1');

  // Alert Rules State
  const [rules, setRules] = useState<AlertRule[]>([
    { 
      id: '1', 
      name: '連續多次暴力破解與密碼噴灑攻擊 (Brute Force Detected)', 
      field: '事件類型 (event)', 
      keyword: '登入失敗 (failed_login) > 5次/分', 
      ip: '全部外部介面 (ANY)', 
      group: 'SOC 一線值班應變組 (SOC Tier 1)',
      severity: 'High',
      enabled: true,
      interval: '1m',
      pendingPeriod: '3m',
      summary: '偵測到單一來源 IP 對內網或 VPN 進行暴力密碼探測'
    },
    { 
      id: '2', 
      name: '疑似勒索軟體大規模檔案加密行為 (Ransomware Activity)', 
      field: '執行動作 (action)', 
      keyword: '大量寫入/副檔名異動 (encrypted_extensions)', 
      ip: '重要核心伺服器群 (10.10.0.0/16)', 
      group: 'SOC 一線值班應變組 (SOC Tier 1)',
      severity: 'Critical',
      enabled: true,
      interval: '30s',
      pendingPeriod: '1m',
      summary: '端點主機在短時間內密集修改上百個檔案且特徵符合已知勒索演算法'
    },
    { 
      id: '3', 
      name: '資料庫異常巨量匯出與外傳 (Database Exfiltration)', 
      field: '出站流量 (egress)', 
      keyword: '單次傳輸 > 5.0 GB 或高熵值壓縮包', 
      ip: '生產資料庫 (10.100.20.15)', 
      group: 'IT 基礎架構與雲端管理員 (IT Infrastructure)',
      severity: 'Critical',
      enabled: true,
      interval: '1m',
      pendingPeriod: '2m',
      summary: '核心客戶資料表於非維護時段產生異常龐大傳輸'
    },
    { 
      id: '4', 
      name: '非上班時段高特權群組成員變更 (Domain Admin Changed)', 
      field: '網域日誌 (AD Event)', 
      keyword: 'EventID 4728/4732 (特權群組新增成員)', 
      ip: '網域控制站 (DC01/DC02)', 
      group: '資安主管與法遵決策層 (CISO & Executive)',
      severity: 'Critical',
      enabled: true,
      interval: '1m',
      pendingPeriod: '0s',
      summary: 'Domain Admins 或 Enterprise Admins 群組遭新增使用者帳號'
    }
  ]);

  // Template Designer State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [templateBlocks, setTemplateBlocks] = useState<any[]>([
    { id: 'header', type: 'logo', content: 'SEMOR SECURITY OPERATIONS LOGO' },
    { id: 'h1', type: 'title', content: '【資安威脅警報】偵測到 {{alert_name}}' },
    { id: 'details', type: 'metadata', items: ['威脅來源 IP', '觸發特徵條件', '資產單位/主機', '告警嚴重度', '事件時間 (UTC+8)'] },
    { id: 'log', type: 'full_log', label: '原始資安事件遙測日誌 (Raw Event Telemetry)' },
    { id: 'remediation', type: 'remediation', label: '建議應變指引 (Recommended Action Plan)' },
    { id: 'footer', type: 'footer', content: '© 2026 SEMOR 智慧資安監控平台 | 系統自動發送，請勿直接回覆' }
  ]);

  const availableVariables = [
    { id: 'v1', name: 'alert_name', label: '告警規則名稱 (Alert Name)' },
    { id: 'v2', name: 'severity', label: '告警嚴重程度 (Severity)' },
    { id: 'v3', name: 'src_ip', label: '來源 IP 位址 (Source IP)' },
    { id: 'v4', name: 'dest_ip', label: '目的 IP 位址 (Dest IP)' },
    { id: 'v5', name: 'trigger', label: '觸發關鍵字/條件 (Trigger Value)' },
    { id: 'v6', name: 'timestamp', label: '觸發發生時間 (Event Time)' },
    { id: 'v7', name: 'unit', label: '所屬單位/主機 (Asset Name)' },
    { id: 'v8', name: 'mitre_id', label: 'MITRE ATT&CK 技戰術代碼' }
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMoveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...templateBlocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    setTemplateBlocks(newBlocks);
    showToast('已調整郵件範本區塊排序！');
  };

  const handleDeleteBlock = (id: string) => {
    setTemplateBlocks(templateBlocks.filter(b => b.id !== id));
    showToast('已移除該範本區塊！');
  };

  const handleAddSection = () => {
    const newBlock = {
      id: `custom_${Date.now()}`,
      type: 'custom',
      label: '自訂備註說明 (Custom Notes)',
      content: '此事件已由 SOC 系統自動指派，請於 15 分鐘內於平台完成處置簽核。'
    };
    setTemplateBlocks([...templateBlocks.slice(0, -1), newBlock, templateBlocks[templateBlocks.length - 1]]);
    showToast('已新增自訂郵件內容區塊！');
  };

  const handleTestSmtpConnection = () => {
    setTestMailStatus('sending');
    setTestMailLogs([
      `[${new Date().toLocaleTimeString()}] 連線至 SMTP 閘道伺服器 ${emailServer.host}:${emailServer.port}...`,
      `[${new Date().toLocaleTimeString()}] 發送 EHLO 握手指令... 收到 250-OK 回應碼`,
      `[${new Date().toLocaleTimeString()}] 啟用 ${emailServer.encryption} 安全傳輸通道加密交握... 憑證驗證成功`,
      `[${new Date().toLocaleTimeString()}] 執行身分認證 (AUTH LOGIN)... 帳號 ${emailServer.user} 認證通過`,
      `[${new Date().toLocaleTimeString()}] 建立測試郵件傳遞信封 (MAIL FROM: <${emailServer.fromEmail}>)...`,
      `[${new Date().toLocaleTimeString()}] 指定收件人 (RCPT TO: <${testMailRecipient}>)...`,
      `[${new Date().toLocaleTimeString()}] 發送郵件內文資料區塊 (DATA)... 250 2.0.0 郵件已排入發送佇列`
    ]);
    setShowTestMailModal(true);

    setTimeout(() => {
      setTestMailStatus('success');
      showToast(`測試郵件已成功發送至 ${testMailRecipient}！`);
    }, 1500);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactEmail) {
      showToast('請填寫聯絡人姓名與電子郵件！');
      return;
    }

    setGroups(groups.map(g => {
      if (g.id === newContactGroup) {
        return {
          ...g,
          contacts: [...g.contacts, { name: newContactName, email: newContactEmail, phone: newContactPhone }]
        };
      }
      return g;
    }));

    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    showToast('已成功新增聯絡人至指定群組！');
  };

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    showToast('告警規則啟用狀態已變更！');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    showToast('已成功刪除該告警規則！');
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
            className="fixed top-6 right-6 z-[3000] bg-red-600/90 backdrop-blur-md border border-red-400/30 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Mail Log Modal */}
      {showTestMailModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f12] border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-red-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">SMTP 發信伺服器連線與傳遞測試</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">即時檢測 TLS 握手憑證、認證流程與郵件投遞狀態</p>
                </div>
              </div>
              <button
                onClick={() => setShowTestMailModal(false)}
                className="text-gray-500 hover:text-white text-xs p-1.5 hover:bg-gray-800 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                <span className="text-gray-400">目標收件者信箱：</span>
                <span className="text-white font-mono">{testMailRecipient}</span>
              </div>

              {/* Logs Console */}
              <div className="bg-black/90 rounded-xl p-4 border border-gray-800 font-mono text-xs text-gray-300 space-y-2 max-h-[260px] overflow-y-auto">
                {testMailLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-red-400 select-none">&gt;</span>
                    <span className={log.includes('成功') || log.includes('250') ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400 font-bold">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>測試郵件已成功寄出！請前往收件匣確認格式與內容。</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/40 flex justify-end">
              <button
                onClick={() => setShowTestMailModal(false)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                關閉
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">告警通知通道</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              正常連線中
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Mail size={20} className="text-red-400" />
            <span>SMTP + 3 多元通道</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">主機: {emailServer.host}:{emailServer.port}</p>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">已配置告警規則</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {rules.filter(r => r.enabled).length} 項啟用中
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <BellRing size={20} className="text-blue-400" />
            <span>共 {rules.length} 條規則</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">緊急 (Critical) 規則共 3 條</p>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">通知群組與名冊</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
              3 大應變群組
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-purple-400" />
            <span>5 位關鍵聯絡人</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">涵蓋 SOC、IT 維運與管理層</p>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">24 小時派送統計</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              成功率 98.8%
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <span>98 筆已發送告警</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">平均傳遞延遲 &lt; 1.2 秒</p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-800 bg-gray-900/40 p-2 flex flex-wrap gap-2">
          {[
            { id: 'server', label: '發信伺服器設定 (SMTP Server)', icon: <Mail size={14} /> },
            { id: 'channels', label: '多元通報通道 (Alert Channels)', icon: <Webhook size={14} /> },
            { id: 'groups', label: '通知群組與通訊錄 (Recipient Groups)', icon: <Users size={14} /> },
            { id: 'rules', label: '告警規則與路由 (Alert Rules)', icon: <BellRing size={14} /> },
            { id: 'template', label: '郵件範本設計器 (Template Designer)', icon: <Layout size={14} /> },
            { id: 'history', label: '告警派送歷史記錄 (Delivery History)', icon: <History size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveConfigTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all",
                activeConfigTab === tab.id
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 md:p-8">
          {/* TAB 1: Outbound Email / SMTP Server */}
          {activeConfigTab === 'server' && (
            <div className="max-w-4xl space-y-8">
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">外發郵件閘道配置 (Outbound Email Gateway)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      設定用於傳送重大資安威脅警報、定期報表與即時稽核通知之企業 SMTP 郵件伺服器
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    SMTP 伺服器位址 (Host)
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={emailServer.host}
                    onChange={e => setEmailServer({...emailServer, host: e.target.value})}
                    placeholder="例如: smtp.office365.com 或 mail.company.com"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    通訊連接埠 (Port)
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={emailServer.port}
                    onChange={e => setEmailServer({...emailServer, port: e.target.value})}
                    placeholder="587, 465 或 25"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    連線傳輸加密協定 (Encryption)
                  </label>
                  <select 
                    disabled={isReadOnly}
                    value={emailServer.encryption}
                    onChange={e => setEmailServer({...emailServer, encryption: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-bold"
                  >
                    <option value="TLS">TLS / STARTTLS (Port 587 - 推薦標準)</option>
                    <option value="SSL">SSL 加密連線 (Port 465)</option>
                    <option value="NONE">明文無加密 (Port 25 - 僅限內網 Relay)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    寄件者名稱 (Sender Name)
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={emailServer.fromName}
                    onChange={e => setEmailServer({...emailServer, fromName: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    寄件者電子郵件 (From Email)
                  </label>
                  <input 
                    type="email" 
                    disabled={isReadOnly}
                    value={emailServer.fromEmail}
                    onChange={e => setEmailServer({...emailServer, fromEmail: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    回覆信箱 (Reply-To Email)
                  </label>
                  <input 
                    type="email" 
                    disabled={isReadOnly}
                    value={emailServer.replyTo}
                    onChange={e => setEmailServer({...emailServer, replyTo: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Authentication Toggle & Credentials */}
              <div className="p-6 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">SMTP 身分驗證 (Authentication)</h5>
                    <p className="text-[10px] text-gray-500">大多數企業郵件與雲端郵件伺服器皆需啟用使用者帳號密碼認證</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={emailServer.auth}
                      onChange={() => setEmailServer({...emailServer, auth: !emailServer.auth})}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                {emailServer.auth && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        驗證帳號 / 使用者名稱 (Username)
                      </label>
                      <input 
                        type="text" 
                        disabled={isReadOnly}
                        value={emailServer.user} 
                        onChange={e => setEmailServer({...emailServer, user: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        驗證密碼 / 應用程式金鑰 (Password / App Token)
                      </label>
                      <input 
                        type="password" 
                        disabled={isReadOnly}
                        value={emailServer.pass} 
                        onChange={e => setEmailServer({...emailServer, pass: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Test Recipient Input & Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="email"
                    value={testMailRecipient}
                    onChange={(e) => setTestMailRecipient(e.target.value)}
                    placeholder="輸入測試收件者信箱..."
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 w-full sm:w-72 font-mono"
                  />
                  <button 
                    onClick={handleTestSmtpConnection}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 border border-gray-700"
                  >
                    <Send size={14} className="text-red-400" />
                    發送測試郵件
                  </button>
                </div>

                {!isReadOnly && (
                  <button 
                    onClick={() => showToast('SMTP 發信伺服器設定已成功儲存！')}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 w-full sm:w-auto justify-center"
                  >
                    <Check size={14} />
                    儲存配置
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Multi-channel Alerting */}
          {activeConfigTab === 'channels' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Webhook size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">多元通報通道與即時通訊整合 (Multi-Channel Alert Integration)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      除了電子郵件外，可無縫串接企業即時通訊軟體、SOC 戰情室 Webhook 與第三方 Syslog 收集器
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Slack Webhook */}
                <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4A154B]/30 border border-[#4A154B]/50 flex items-center justify-center text-purple-300 font-black">
                        #
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Slack 機器人通知 (Incoming Webhook)</h5>
                        <p className="text-[10px] text-gray-500">將重大威脅告警即時推送至 Slack 資安頻道</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={channels.slack.enabled}
                        onChange={() => setChannels({ ...channels, slack: { ...channels.slack, enabled: !channels.slack.enabled } })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Webhook URL</label>
                      <input 
                        type="text" 
                        value={channels.slack.webhookUrl} 
                        onChange={(e) => setChannels({ ...channels, slack: { ...channels.slack, webhookUrl: e.target.value } })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">目標頻道名稱 (Channel)</label>
                      <input 
                        type="text" 
                        value={channels.slack.channel} 
                        onChange={(e) => setChannels({ ...channels, slack: { ...channels.slack, channel: e.target.value } })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Microsoft Teams Webhook */}
                <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#505AC9]/30 border border-[#505AC9]/50 flex items-center justify-center text-blue-300 font-black">
                        T
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Microsoft Teams 頻道通知</h5>
                        <p className="text-[10px] text-gray-500">支援 Adaptive Cards 富文本互動式卡片推送</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={channels.teams.enabled}
                        onChange={() => setChannels({ ...channels, teams: { ...channels.teams, enabled: !channels.teams.enabled } })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Teams 連接器 Webhook URL</label>
                      <input 
                        type="text" 
                        value={channels.teams.webhookUrl} 
                        onChange={(e) => setChannels({ ...channels, teams: { ...channels.teams, webhookUrl: e.target.value } })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">目標小組名稱 (Team Name)</label>
                      <input 
                        type="text" 
                        value={channels.teams.channel} 
                        onChange={(e) => setChannels({ ...channels, teams: { ...channels.teams, channel: e.target.value } })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Syslog Forwarding */}
                <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                        <Radio size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Syslog 即時轉發 (RFC 5424)</h5>
                        <p className="text-[10px] text-gray-500">將產生的安全告警轉發至外部 SIEM / 稽核系統</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={channels.syslogForward.enabled}
                        onChange={() => setChannels({ ...channels, syslogForward: { ...channels.syslogForward, enabled: !channels.syslogForward.enabled } })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">目標伺服器 IP</label>
                      <input 
                        type="text" 
                        value={channels.syslogForward.server} 
                        onChange={(e) => setChannels({ ...channels, syslogForward: { ...channels.syslogForward, server: e.target.value } })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">埠號 (Port)</label>
                      <input 
                        type="text" 
                        value={channels.syslogForward.port} 
                        onChange={(e) => setChannels({ ...channels, syslogForward: { ...channels.syslogForward, port: e.target.value } })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* LINE Notify / SMS */}
                <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">LINE Notify / 簡訊閘道 (SMS Gateway)</h5>
                        <p className="text-[10px] text-gray-500">緊急事件即時推送手機訊息與簡訊廣播</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={channels.lineNotify.enabled}
                        onChange={() => setChannels({ ...channels, lineNotify: { ...channels.lineNotify, enabled: !channels.lineNotify.enabled } })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">權杖存取碼 (Access Token / API Key)</label>
                    <input 
                      type="password" 
                      value={channels.lineNotify.token} 
                      onChange={(e) => setChannels({ ...channels, lineNotify: { ...channels.lineNotify, token: e.target.value } })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800">
                <button 
                  onClick={() => showToast('多元通報通道設定已成功更新！')}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
                >
                  <Check size={14} />
                  儲存通道設定
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Groups & Contacts */}
          {activeConfigTab === 'groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Group Cards */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">告警接收群組清單 (Recipient Groups)</h4>
                    <p className="text-xs text-gray-500">依據不同事件等級與負責業務範疇分派通知對象</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {groups.map(group => (
                    <div key={group.id} className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl hover:border-red-500/30 transition-all space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-2">
                            {group.name}
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono font-normal">
                              {group.contacts.length} 位成員
                            </span>
                          </h5>
                          <p className="text-xs text-gray-400 mt-1">{group.description}</p>
                        </div>
                      </div>

                      {/* Contacts Chips */}
                      <div className="space-y-2 pt-2 border-t border-gray-800/60">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">成員名單：</span>
                        <div className="flex flex-wrap gap-2">
                          {group.contacts.map((c, i) => (
                            <div key={i} className="px-3 py-1 bg-black/60 rounded-lg border border-gray-800 text-xs flex items-center gap-2">
                              <span className="font-bold text-gray-200">{c.name}</span>
                              <span className="text-gray-400 font-mono text-[10px]">({c.email})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subscribed Severity */}
                      <div className="flex items-center gap-2 pt-2 text-[10px]">
                        <span className="font-bold text-gray-400 uppercase tracking-wider">訂閱等級：</span>
                        <div className="flex gap-1.5">
                          {group.severity.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Quick Add Contact Form */}
              <div className="lg:col-span-5">
                <form onSubmit={handleAddContact} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 space-y-4 sticky top-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                    <Plus size={16} className="text-red-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">快速新增聯絡人至群組</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">聯絡人姓名 (Full Name)</label>
                    <input 
                      type="text" 
                      placeholder="例如: 林書豪 (SOC Analyst)"
                      value={newContactName}
                      onChange={e => setNewContactName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500" 
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">電子郵件地址 (Email)</label>
                    <input 
                      type="email" 
                      placeholder="例如: lin.sh@company.com"
                      value={newContactEmail}
                      onChange={e => setNewContactEmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono" 
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">行動電話 / 簡訊號碼 (Phone - 選填)</label>
                    <input 
                      type="tel" 
                      placeholder="+886 912-345-678"
                      value={newContactPhone}
                      onChange={e => setNewContactPhone(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">指派至目標群組 (Assign to Group)</label>
                    <select 
                      value={newContactGroup}
                      onChange={e => setNewContactGroup(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-bold"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 mt-2"
                  >
                    <Plus size={14} />
                    加入通訊群組
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: Alert Rules & Delivery History */}
          {activeConfigTab === 'rules' && (
            <div className="space-y-8">
              {isAddingRule ? (
                <AlertRuleFormWizard 
                  onCancel={() => setIsAddingRule(false)}
                  onSave={(newRuleData) => {
                    const newRule: AlertRule = {
                      id: `${Date.now()}`,
                      name: newRuleData.name || '未命名告警規則',
                      field: newRuleData.queryType || '自訂查詢',
                      keyword: `${newRuleData.reduceFunc || 'Mean'} ${newRuleData.thresholdCondition || '大於'} ${newRuleData.threshold || '90'}`,
                      ip: '全部監控資產 (ANY)',
                      group: 'SOC 一線值班應變組 (SOC Tier 1)',
                      severity: (newRuleData.severity as any) || 'High',
                      enabled: true,
                      interval: newRuleData.interval || '1m',
                      pendingPeriod: newRuleData.pendingPeriod || '3m',
                      summary: newRuleData.summary || '自訂告警規則觸發'
                    };
                    setRules([...rules, newRule]);
                    setIsAddingRule(false);
                    showToast('已成功建立並啟用新告警規則！');
                  }}
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">告警判定規則與分派邏輯 (Alert Rules & Routing)</h4>
                      <p className="text-xs text-gray-500">定義日誌特徵比對條件、閥值門檻與即時通知路由路徑</p>
                    </div>
                    {!isReadOnly && (
                      <button 
                        onClick={() => setIsAddingRule(true)}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 shrink-0"
                      >
                        <Plus size={14} />
                        新增告警規則精靈
                      </button>
                    )}
                  </div>

                  {/* Rules Table */}
                  <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/60 border-b border-gray-800">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">規則名稱與資產範圍</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">觸發條件與關鍵字</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">嚴重程度</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">指派通知群組</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">操作與開關</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-xs">
                          {rules.map(rule => (
                            <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4">
                                <div className="font-bold text-white">{rule.name}</div>
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">監控範圍: {rule.ip}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-black/60 border border-gray-800 text-blue-400">
                                  {rule.field} : "{rule.keyword}"
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded text-[10px] font-bold font-mono",
                                  rule.severity === 'Critical' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  rule.severity === 'High' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                )}>
                                  {rule.severity}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-300">
                                  <Users size={12} className="text-gray-500 shrink-0" />
                                  <span className="truncate max-w-[200px]">{rule.group}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  {!isReadOnly && (
                                    <button 
                                      onClick={() => handleDeleteRule(rule.id)}
                                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
                                      title="刪除規則"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      disabled={isReadOnly}
                                      checked={rule.enabled}
                                      onChange={() => handleToggleRule(rule.id)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-4.5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-600"></div>
                                  </label>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Trigger History Component */}
                  <AlertTriggerHistoryView />
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Template Designer */}
          {activeConfigTab === 'template' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left Column: Placeholders & Global Branding */}
              <div className="xl:col-span-3 space-y-6">
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">動態佔位符變數庫 (Placeholders)</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">可將動態標記填入標題、日誌欄位或郵件內文</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {availableVariables.map(v => (
                      <div 
                        key={v.id} 
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${v.name}}}`);
                          showToast(`已複製變數 {{${v.name}}} 至剪貼簿！`);
                        }}
                        className="p-2.5 bg-black/60 border border-gray-800 rounded-xl flex items-center justify-between group cursor-pointer hover:border-red-500/40 transition-all"
                        title="點擊複製變數標籤"
                      >
                        <span className="text-[10px] font-mono text-red-400 font-bold">{`{{${v.name}}}`}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[130px]">{v.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <Settings2 size={16} />
                    <span>企業品牌與主旨識別</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">監控單位識別名稱 (Unit)</label>
                      <input 
                        type="text" 
                        defaultValue="SEMOR 全球營運總部 SOC 團隊" 
                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Column: Interactive Template Canvas */}
              <div className="xl:col-span-6 space-y-4">
                <div className="border border-gray-800 rounded-2xl overflow-hidden bg-black/60 shadow-2xl">
                  {/* Canvas Header */}
                  <div className="bg-gray-900 border-b border-gray-800 px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 font-mono">告警郵件排版畫布 (HTML Mail Preview)</span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-gray-800">
                      <button 
                        onClick={() => setPreviewDevice('desktop')}
                        className={cn("p-1.5 rounded transition-all", previewDevice === 'desktop' ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300")}
                        title="桌面端排版預覽"
                      >
                        <Monitor size={14} />
                      </button>
                      <button 
                        onClick={() => setPreviewDevice('mobile')}
                        className={cn("p-1.5 rounded transition-all", previewDevice === 'mobile' ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300")}
                        title="手機行動端排版預覽"
                      >
                        <Smartphone size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Canvas Blocks */}
                  <div className={cn(
                    "p-6 md:p-8 space-y-4 min-h-[540px] transition-all mx-auto",
                    previewDevice === 'mobile' ? "max-w-sm border-x border-gray-800/80 my-4 bg-[#0a0a0c]" : "w-full"
                  )}>
                    {templateBlocks.map((block, index) => (
                      <div 
                        key={block.id} 
                        className="relative group p-3 rounded-xl border border-transparent hover:border-red-500/30 hover:bg-white/[0.02] transition-all"
                      >
                        {/* Move Controls */}
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            disabled={index === 0}
                            onClick={() => handleMoveBlock(index, index - 1)} 
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            disabled={index === templateBlocks.length - 1}
                            onClick={() => handleMoveBlock(index, index + 1)} 
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Block Type 1: Logo */}
                        {block.type === 'logo' && (
                          <div className="flex justify-center my-2">
                            <div className="px-6 py-3 bg-gray-900/60 border border-dashed border-gray-800 rounded-xl text-gray-400 text-xs font-bold flex items-center gap-2">
                              <Shield size={16} className="text-red-500" />
                              <span>{block.content}</span>
                            </div>
                          </div>
                        )}

                        {/* Block Type 2: Title */}
                        {block.type === 'title' && (
                          <div className="text-center my-3">
                            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight text-red-400">
                              {block.content}
                            </h2>
                          </div>
                        )}

                        {/* Block Type 3: Metadata Summary */}
                        {block.type === 'metadata' && (
                          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 grid grid-cols-2 gap-3 my-2 text-xs">
                            {block.items.map((item, idx) => (
                              <div key={idx} className="space-y-1">
                                <span className="text-[10px] text-gray-500 font-bold block">{item}</span>
                                <span className="font-mono text-red-400 font-bold text-[11px]">{"{{ ... }}"}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Block Type 4: Raw Log */}
                        {block.type === 'full_log' && (
                          <div className="space-y-1.5 my-2">
                            <span className="text-[10px] font-bold text-red-400/90">{block.label}</span>
                            <div className="bg-black border border-red-500/20 rounded-xl p-3 text-[10px] font-mono text-gray-400 leading-relaxed overflow-hidden">
                              {"[2026-08-15 01:42:00] EVENT_ID: SEMOR-AUTH-099\nSRC_ADDR: 185.234.219.12 (RU)\nSIGNATURE: lateral_movement_probe\nACTION: BLOCKED_BY_SOAR"}
                            </div>
                          </div>
                        )}

                        {/* Block Type 5: Remediation Actions */}
                        {block.type === 'remediation' && (
                          <div className="space-y-1.5 my-2 p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl">
                            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1.5">
                              <Sparkles size={12} />
                              {block.label}
                            </span>
                            <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                              <li>請立即確認該 IP 是否為合法遠端授權連線</li>
                              <li>進入 EDR 儀表板執行單鍵隔離該端點主機</li>
                            </ul>
                          </div>
                        )}

                        {/* Block Type 6: Custom block */}
                        {block.type === 'custom' && (
                          <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl my-2 text-xs text-gray-300 space-y-1">
                            <span className="text-[10px] font-bold text-gray-400">{block.label}</span>
                            <p className="text-xs text-gray-300">{block.content}</p>
                          </div>
                        )}

                        {/* Block Type 7: Footer */}
                        {block.type === 'footer' && (
                          <div className="pt-4 border-t border-gray-800/80 text-center">
                            <p className="text-[10px] text-gray-500">{block.content}</p>
                          </div>
                        )}

                        {/* Delete Button */}
                        {block.type !== 'footer' && (
                          <button 
                            onClick={() => handleDeleteBlock(block.id)}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="刪除區塊"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}

                    <div 
                      onClick={handleAddSection}
                      className="border-2 border-dashed border-gray-800 hover:border-red-500/40 rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-white/[0.01] flex flex-col items-center justify-center gap-1"
                    >
                      <Plus size={18} className="text-gray-500 group-hover:text-red-400" />
                      <span className="text-xs font-bold text-gray-400">新增自訂內容區塊</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="xl:col-span-3 space-y-6">
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">範本管理操作</h4>
                  <button 
                    onClick={() => showToast('已儲存郵件範本版型！')}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-900/20"
                  >
                    儲存範本設計
                  </button>
                  <button 
                    onClick={handleTestSmtpConnection}
                    className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all border border-gray-700"
                  >
                    發送範本測試郵件
                  </button>
                  <button 
                    onClick={() => {
                      setTemplateBlocks([
                        { id: 'header', type: 'logo', content: 'SEMOR SECURITY OPERATIONS LOGO' },
                        { id: 'h1', type: 'title', content: '【資安威脅警報】偵測到 {{alert_name}}' },
                        { id: 'details', type: 'metadata', items: ['威脅來源 IP', '觸發特徵條件', '資產單位/主機', '告警嚴重度', '事件時間 (UTC+8)'] },
                        { id: 'log', type: 'full_log', label: '原始資安事件遙測日誌 (Raw Event Telemetry)' },
                        { id: 'remediation', type: 'remediation', label: '建議應變指引 (Recommended Action Plan)' },
                        { id: 'footer', type: 'footer', content: '© 2026 SEMOR 智慧資安監控平台 | 系統自動發送，請勿直接回覆' }
                      ]);
                      showToast('已還原為原廠標準郵件範本！');
                    }}
                    className="w-full py-2.5 bg-transparent hover:bg-gray-800/60 text-gray-500 hover:text-gray-300 rounded-xl text-xs font-bold transition-all"
                  >
                    還原原廠預設範本
                  </button>
                </div>

                <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Lightbulb size={16} />
                    <span>排版設計建議</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    在行動裝置上，SOC 分析人員優先關注「來源 IP」與「嚴重度等級」，建議將關鍵元數據區塊維持置頂以利第一時間研判。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Trigger & Delivery History */}
          {activeConfigTab === 'history' && (
            <AlertTriggerHistoryView />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Helper Component: Alert Rule Wizard ----------------
function AlertRuleFormWizard({ onCancel, onSave }: { onCancel: () => void, onSave: (rule: any) => void }) {
  const [step, setStep] = useState(1);
  const [ruleData, setRuleData] = useState({
    name: '',
    folder: '系統預設資料夾 (Default)',
    group: 'SOC 一線值班應變組 (SOC Tier 1)',
    interval: '1m',
    pendingPeriod: '3m',
    query: 'SELECT avg(threat_score) FROM "ueba_events" WHERE time > now() - 5m',
    queryType: '時間範圍查詢 (Range Query)',
    reduceFunc: '平均值 (Mean)',
    threshold: 85,
    thresholdCondition: '大於等於 (IS ABOVE)',
    summary: '偵測到實體威脅分數持續偏高',
    description: '請立即登入系統確認該使用者行為軌跡與關聯告警日誌。',
    severity: 'Critical',
    team: 'soc'
  });

  const steps = [
    { id: 1, label: '查詢條件與閾值 (Query & Condition)', icon: <Search size={14} /> },
    { id: 2, label: '頻率與持續判定 (Evaluation & Interval)', icon: <Clock size={14} /> },
    { id: 3, label: '詳細說明與標籤 (Details & Annotations)', icon: <Tag size={14} /> },
    { id: 4, label: '通知路由與聯防 (Notification Routing)', icon: <BellRing size={14} /> }
  ];

  return (
    <div className="bg-[#0f0f12] border border-gray-800 rounded-2xl overflow-hidden flex flex-col lg:flex-row min-h-[640px] animate-in fade-in duration-300">
      {/* Sidebar Stepper */}
      <div className="w-full lg:w-80 bg-black/40 border-b lg:border-b-0 lg:border-r border-gray-800 p-8 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Plus size={16} />
            新增自訂告警規則精靈
          </h4>
          <div className="space-y-6">
            {steps.map(s => (
              <div key={s.id} className="flex items-start gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5",
                  step === s.id ? "bg-red-600 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white" :
                  step > s.id ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400" :
                  "bg-gray-900 border-gray-800 text-gray-500"
                )}>
                  {step > s.id ? <Check size={14} /> : s.icon}
                </div>
                <div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest block", step === s.id ? "text-red-400" : "text-gray-500")}>
                    步驟 0{s.id}
                  </span>
                  <span className={cn("text-xs font-bold leading-tight", step === s.id ? "text-white" : "text-gray-400")}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <button 
            onClick={onCancel}
            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all"
          >
            取消建立
          </button>
        </div>
      </div>

      {/* Wizard Form Content */}
      <div className="flex-1 p-8 md:p-10 overflow-y-auto flex flex-col justify-between">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">步驟 1：設定查詢條件與告警觸發閥值</h3>
              <p className="text-xs text-gray-500 mt-1">定義指標資料來源、PromQL/SQL 查詢表達式與統計判定門檻</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">告警規則名稱 (Rule Name)</label>
                <input 
                  type="text" 
                  placeholder="例如: 伺服器 CPU 使用率連續偏高或記憶體耗盡"
                  value={ruleData.name}
                  onChange={e => setRuleData({...ruleData, name: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">資料來源 (Data Source)</label>
                  <select className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-bold">
                    <option>UEBA-行為分析特徵資料庫 (Online Feature Store)</option>
                    <option>NDR-網路流量威脅日誌庫 (Flow Store)</option>
                    <option>系統監控指標庫 (Prometheus / Node Exporter)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">查詢運算類型 (Query Type)</label>
                  <select 
                    value={ruleData.queryType}
                    onChange={e => setRuleData({...ruleData, queryType: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500 font-bold"
                  >
                    <option>時間範圍查詢 (Range Query)</option>
                    <option>即時快照查詢 (Instant Query)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">查詢表達式 (Query String)</label>
                <textarea 
                  value={ruleData.query}
                  onChange={e => setRuleData({...ruleData, query: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-mono text-blue-400 outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">統計彙整函式 (Reduce Function)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mean (平均值)', 'Max (最大值)', 'Last (最新值)'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setRuleData({...ruleData, reduceFunc: f})}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold transition-all",
                          ruleData.reduceFunc === f ? "bg-red-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"
                        )}
                      >
                        {f.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">判定條件與門檻數值 (Threshold)</label>
                  <div className="flex gap-2">
                    <select 
                      value={ruleData.thresholdCondition}
                      onChange={e => setRuleData({...ruleData, thresholdCondition: e.target.value})}
                      className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option>大於等於 (IS ABOVE)</option>
                      <option>小於等於 (IS BELOW)</option>
                    </select>
                    <input 
                      type="number"
                      value={ruleData.threshold}
                      onChange={e => setRuleData({...ruleData, threshold: parseInt(e.target.value) || 0})}
                      className="w-24 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">步驟 2：評估週期與狀態判定持續時間</h3>
              <p className="text-xs text-gray-500 mt-1">設定系統檢查此規則的頻率，以及條件需持續多久才由 Pending 轉換為 Firing 告警狀態</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">評估檢查間隔 (Evaluation Interval)</label>
                <select 
                  value={ruleData.interval}
                  onChange={e => setRuleData({...ruleData, interval: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-bold"
                >
                  <option value="30s">每 30 秒 (高頻率 - 適用關鍵勒索/暴力破解)</option>
                  <option value="1m">每 1 分鐘 (標準推薦)</option>
                  <option value="5m">每 5 分鐘 (一般常態指標)</option>
                  <option value="1h">每小時檢查 (定期統計報表)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">持續滿足時間 (Pending Period / For)</label>
                <input 
                  type="text" 
                  value={ruleData.pendingPeriod}
                  onChange={e => setRuleData({...ruleData, pendingPeriod: e.target.value})}
                  placeholder="例如: 3m 或 5m"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-gray-500">指標需持續超過閥值達此時長才會正式觸發通知，可有效避免突發抖動引發之假警報。</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">步驟 3：告警詳細說明與自訂標籤</h3>
              <p className="text-xs text-gray-500 mt-1">填寫通知信件之主旨摘要、處理 SOP 說明與嚴重度分級標籤</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">告警主旨摘要 (Summary)</label>
                <input 
                  type="text" 
                  value={ruleData.summary}
                  onChange={e => setRuleData({...ruleData, summary: e.target.value})}
                  placeholder="簡要描述此告警觸發之威脅情境"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">處置指引說明 (Description / Remediation SOP)</label>
                <textarea 
                  value={ruleData.description}
                  onChange={e => setRuleData({...ruleData, description: e.target.value})}
                  rows={4}
                  placeholder="給第一線 SOC 或系統管理員的應變處置標準流程..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">嚴重程度分級 (Severity)</label>
                  <select 
                    value={ruleData.severity}
                    onChange={e => setRuleData({...ruleData, severity: e.target.value as any})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-bold"
                  >
                    <option value="Critical">緊急 (Critical - 需立即處置)</option>
                    <option value="High">高風險 (High - 30 分鐘內確認)</option>
                    <option value="Warning">警告 (Warning - 例行排查)</option>
                    <option value="Info">資訊 (Info - 純記錄備查)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">步驟 4：通知路由與自動化處置關聯</h3>
              <p className="text-xs text-gray-500 mt-1">確認接收對象群組與自動化通報通道</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-red-950/20 border border-red-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <Mail size={16} />
                  <span>郵件與即時通訊發送端點</span>
                </div>
                <p className="text-xs text-gray-400">
                  告警將同時透過企業 SMTP 閘道發送至「{ruleData.group}」以及設定之 Slack #soc-critical-alerts 頻道。
                </p>
              </div>

              <div className="p-5 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Workflow size={16} />
                  <span>升級與升級處置路徑 (Escalation)</span>
                </div>
                <p className="text-xs text-gray-400">
                  若緊急事件於 15 分鐘內無人認領 (Unacknowledged)，系統將自動發送簡訊通知 CISO 與資安主管。
                </p>
              </div>
            </div>

            <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
              <h5 className="text-sm font-bold text-white">規則已就緒，可立即啟用</h5>
              <p className="text-xs text-gray-500">點擊下方按鈕以發佈規則至線上監控評估引擎。</p>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-8 border-t border-gray-800 flex justify-between items-center mt-6">
          <div>
            {step > 1 && (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                <ArrowLeft size={14} /> 上一步
              </button>
            )}
          </div>

          <div>
            <button 
              type="button"
              onClick={() => {
                if (step < 4) setStep(step + 1);
                else onSave(ruleData);
              }}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
            >
              {step === 4 ? '儲存並立即啟用規則' : '下一步'}
              {step < 4 && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Helper Component: Trigger History ----------------
function AlertTriggerHistoryView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const historyData: TriggerLogItem[] = [
    {
      id: 'h1',
      ruleName: '緊急：疑似勒索軟體大規模檔案加密行為 (Ransomware Activity)',
      lastTrigger: '2026-08-15 01:25:10',
      totalTriggers: 2,
      status: '成功 (Success)',
      severity: 'Critical',
      targets: 'SOC 一線值班應變組 (Slack + Email)',
      logs: [
        { time: '01:25:10', value: '主機 10.10.30.42 於 10 秒內異動 320 個副檔名', status: 'Success', recipient: 'Slack: #soc-critical-alerts', channel: 'Slack Webhook' },
        { time: '01:25:11', value: '發送重要警報信件至 alice.wang@semor-security.com', status: 'Success', recipient: 'Email: alice.wang@semor-security.com', channel: 'SMTP Gateway' }
      ]
    },
    {
      id: 'h2',
      ruleName: '高風險：連續多次暴力破解與密碼噴灑攻擊 (Brute Force Detected)',
      lastTrigger: '2026-08-14 23:45:00',
      totalTriggers: 15,
      status: '成功 (Success)',
      severity: 'High',
      targets: 'SOC 一線值班應變組 (Email)',
      logs: [
        { time: '23:45:00', value: '外部來源 185.220.101.5 連續 20 次密碼失敗', status: 'Success', recipient: 'Email: bob.lee@semor-security.com', channel: 'SMTP Gateway' }
      ]
    },
    {
      id: 'h3',
      ruleName: '緊急：資料庫異常巨量匯出與外傳 (Database Exfiltration)',
      lastTrigger: '2026-08-14 18:10:20',
      totalTriggers: 1,
      status: '成功 (Success)',
      severity: 'Critical',
      targets: 'IT 基礎架構與雲端管理員 (Teams + Email)',
      logs: [
        { time: '18:10:20', value: '資料庫 10.100.20.15 傳輸 8.4GB 至外部雲端', status: 'Success', recipient: 'Teams: 資安應變專案群組', channel: 'Teams Webhook' }
      ]
    }
  ];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">告警觸發與派送記錄 (Trigger History & Delivery Log)</h4>
          <p className="text-xs text-gray-500">稽核每次告警事件之判斷時間點、派送狀態與各通道投遞結果</p>
        </div>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-gray-800">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">告警規則</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">最近觸發時間</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">觸發次數</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">投遞狀態</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">派送路徑與通道</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-xs">
              {historyData.map(item => (
                <React.Fragment key={item.id}>
                  <tr 
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{item.ruleName}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">{item.lastTrigger}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">×{item.totalTriggers}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                        <Check size={10} />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-[11px]">{item.targets}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 hover:bg-gray-800 rounded text-gray-400">
                        {expandedId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>

                  {expandedId === item.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-black/60 border-t border-gray-800/60">
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">詳細派送日誌：</span>
                          <div className="space-y-2">
                            {item.logs.map((l, li) => (
                              <div key={li} className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-4">
                                  <span className="font-mono text-gray-500 text-[10px]">{l.time}</span>
                                  <span className="text-gray-300 font-bold">{l.value}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-400 text-[11px] font-mono">{l.recipient}</span>
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {l.channel}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

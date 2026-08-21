import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Settings, 
  Send, 
  User, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  Cpu, 
  Zap, 
  Activity, 
  Flame, 
  Lock,
  Terminal,
  HelpCircle,
  CornerDownLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import AIAttackAnalysisView from './AIAttackAnalysisView';
import AIModelConfigView from './AIModelConfigView';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  actionSuggestions?: string[];
}

export default function AIAnalystView() {
  const [activeSubTab, setActiveSubTab] = useState<'analysis' | 'chat' | 'settings'>('analysis');
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isZh = currentLang.startsWith('zh') || currentLang === 'zh';
  const isJa = currentLang.startsWith('ja') || currentLang === 'ja';

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const getWelcomeText = () => {
        if (isZh) {
          return "您好！我是您的本地 Llama-3 資安威脅分析專用 AI。我已與平台的即時日誌流（Suricata、SSHD、Traefik、PostgreSQL）及網路遙測探針建立雙向連線。\n\n您可以隨時向我諮詢目前偵測到的攻擊事件、請求產生應變防護腳本、分析可疑流量或進行威脅歸屬研判。請點選下方的預設快捷指令或直接輸入您的問題！";
        } else if (isJa) {
          return "こんにちは！ローカルLlama-3セキュリティ脅威アナリストAIです。リアルタイムログ（Suricata、SSHD、Traefik、PostgreSQL）およびネットワークプローブと連動しています。\n\n攻撃イベントの調査、緩和策スクリプトの生成、不審なトラフィックの分析など、お気軽にお申し付けください。";
        } else {
          return "Hello! I am your local Llama-3 AI Security Analyst. I have established bi-directional links with real-time logs (Suricata, SSHD, Traefik, PostgreSQL) and network telemetry.\n\nYou can ask me to investigate detected incidents, generate mitigation playbooks, analyze suspicious packet streams, or assess threat attribution.";
        }
      };

      setChatMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: getWelcomeText(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionSuggestions: isZh 
            ? ['分析 10.10.42.5 的 DNS 異常外洩流量', '針對 SSH 暴力破解生成防禦腳本', '檢查 PostgreSQL 5432 暴露與 SQL 注入風險', '評估 APT29 與 Sandworm 的作戰路徑']
            : ['Analyze DNS exfiltration on 10.10.42.5', 'Generate SSH brute force defense script', 'Check PostgreSQL 5432 exposure risks', 'Assess APT29 & Sandworm attack paths']
        }
      ]);
    }
  }, [isZh, isJa]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsgId = String(Date.now());
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [
      ...prev, 
      { id: userMsgId, sender: 'user', text, timestamp: userTimestamp }
    ]);
    if (!textToSend) setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      let codeSnippet: string | undefined = undefined;
      let suggestions: string[] = [];
      const lower = text.toLowerCase();

      if (isZh) {
        if (lower.includes('dns') || lower.includes('流量') || lower.includes('10.10.42.5') || lower.includes('外洩')) {
          reply = `### 🔍 DNS 流量異常與通道外流深入研判：\n\n根據對主機 **10.10.42.5** 的日誌與網卡觀測：\n- **異常特徵**：在過去 2 小時內向境外動態 DNS 伺服器發送了多達 **1,850+ 次 TXT 記錄微型查詢**，累計外流約 1.5GB 載荷。\n- **威脅對齊**：高度契合 **MITRE ATT&CK T1071.004 (DNS Protocol Exfiltration)**。\n- **緊急處置策略**：已為您生成 iptables 與 Bind9 阻斷規則：`;
          codeSnippet = `# 1. 立即在網段核心路由器阻斷主機 10.10.42.5 對外的 UDP/53 流量\nsudo iptables -I FORWARD -s 10.10.42.5 -p udp --dport 53 -j DROP\n\n# 2. 啟動 DNS Sinkholing 並重導至安全黑洞\nsudo iptables -t nat -A PREROUTING -s 10.10.42.5 -p udp --dport 53 -j REDIRECT --to-ports 5353\n\n# 3. 隔離主機並提取記憶體 Process dump 以進行鑑識\nsudo pkill -STOP -u deployer`;
          suggestions = ['產生主機完整記憶體取證腳本', '將來源 IP 加入全網黑名單', '匯出資安事件 PDF 鑑識報告'];
        } else if (lower.includes('ssh') || lower.includes('暴力破解') || lower.includes('登入') || lower.includes('密碼')) {
          reply = `### 🛡️ SSH 暴力破解事件分析 (Incident R-001)：\n\n- **威脅源 IP**：\`185.234.219.82\` (俄羅斯 Tor Exit Node)\n- **攻擊手法**：在 120 秒內發動了超過 1,500 次帳密字典輪詢，成功突破 \`deployer\` 本機服務帳號，並將非授權後門公鑰寫入 \`~/.ssh/authorized_keys\`。\n- **建議立即下發以下安全修復指令**：`;
          codeSnippet = `# 1. 刪除未經授權的後門 SSH 公鑰\nsudo sed -i '/AAAAB3NzaC1yc/d' /home/deployer/.ssh/authorized_keys\n\n# 2. 強制 SSH 僅允許金鑰對登入，完全禁用密碼認證\nsudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config\nsudo systemctl restart sshd\n\n# 3. 透過 fail2ban 自動化封鎖惡意嘗試 IP\nsudo fail2ban-client set sshd banip 185.234.219.82`;
          suggestions = ['重置 deployer 帳號憑證', '全網主機掃描 authorized_keys 變更', '部署 Multi-Factor Authentication (MFA)'];
        } else if (lower.includes('postgresql') || lower.includes('5432') || lower.includes('資料庫') || lower.includes('sql')) {
          reply = `### ⚠️ PostgreSQL 5432 埠暴露與提權風險研判：\n\n- **風險評級**：**CRITICAL (CVSS 9.2)**\n- **威脅現狀**：PostgreSQL 生產叢集 (10.10.42.10) 監聽到來自前台網頁主機的惡意 \`COPY TO CSV\` 大容量傾印指令，威脅組織正試圖將核心 \`sales_ledger\` 表向海外 VPS 傳輸。\n- **處置命令與安全配置**：`;
          codeSnippet = `# 1. 修改 pg_hba.conf 僅允許應用伺服器白名單 IP 訪問\n# /var/lib/postgresql/data/pg_hba.conf\nhost    sales_ledger    app_user    10.10.12.30/32    scram-sha-256\nhost    all             all         0.0.0.0/0         reject\n\n# 2. 撤銷普通使用者的 COPY TO 命令執行權限\nREVOKE EXECUTE ON FUNCTION pg_read_file(text) FROM PUBLIC;\nREVOKE EXECUTE ON FUNCTION pg_read_binary_file(text) FROM PUBLIC;`;
          suggestions = ['中斷所有當前活躍的 Postgres 外部會話', '檢查資料庫日誌是否有未授權 Dump', '生成資料庫存取白名單規則'];
        } else if (lower.includes('apt') || lower.includes('sandworm') || lower.includes('cozy bear') || lower.includes('組織')) {
          reply = `### 🌐 APT 國家級威脅組織戰術情報分析：\n\n根據本次告警特徵碼比對：\n1. **APT29 (Cozy Bear)**：傾向使用密碼噴灑 (Password Spraying) 突破邊界 SSH/VPN，隨後在記憶體中常駐 Cobalt Strike 模組。\n2. **Sandworm (GRU 74455)**：擅長利用 Kerberoasting 橫向攫取 Active Directory / LDAP 核心目錄權限。\n3. **APT38 (Lazarus)**：專注於金融資料庫大數據打包外洩與加密勒索。\n\n系統已自動在「威脅關聯研判」面板中完成端到端的攻擊鏈映射，並產出相應的 MITRE ATT&CK 矩陣。`;
          suggestions = ['查看 MITRE ATT&CK 技戰術矩陣', '下載 IoCs 威脅失陷指標清單', '啟動全網資產漏洞自律掃描'];
        } else {
          reply = `收到您的查詢：「${text}」。\n\n作為您的 Llama-3 本地資安分析專家，我已即時調取當前 SOC 防禦平台的日誌特徵。系統目前處於高防禦警戒狀態，所有連線均經過 Purple Llama 安全過濾沙箱。\n\n您可以點擊下方的建議快捷按鈕，或要求我深入調查指定主機（如 \`10.10.12.31\`、\`10.10.42.5\`）的安全事件。`;
          suggestions = ['分析 10.10.42.5 的 DNS 異常外洩流量', '針對 SSH 暴力破解生成防禦腳本', '檢查 PostgreSQL 5432 暴露與 SQL 注入風險'];
        }
      } else {
        // English / Default
        if (lower.includes('dns') || lower.includes('traffic') || lower.includes('exfiltration')) {
          reply = `### 🔍 DNS Telemetry & Exfiltration Analysis:\n\nTelemetry from host **10.10.42.5** shows over **1,850+ micro TXT queries** within 2 hours, matching **MITRE ATT&CK T1071.004 (DNS Protocol Exfiltration)**. Mitigation scripts have been generated:`;
          codeSnippet = `# 1. Drop outbound DNS traffic from target host\nsudo iptables -I FORWARD -s 10.10.42.5 -p udp --dport 53 -j DROP\n\n# 2. Redirect to internal sinkhole\nsudo iptables -t nat -A PREROUTING -s 10.10.42.5 -p udp --dport 53 -j REDIRECT --to-ports 5353`;
          suggestions = ['Generate memory dump script', 'Add source IP to blocklist', 'Export PDF forensics report'];
        } else {
          reply = `Acknowledged. I have analyzed your query regarding "${text}". All inference is grounded on local Ollama / Llama-3-8B telemetry. You can ask me to evaluate ongoing incidents (R-001, R-002, R-003) or generate live hardening scripts.`;
          suggestions = ['Analyze DNS exfiltration on 10.10.42.5', 'Generate SSH brute force defense script', 'Check PostgreSQL 5432 exposure risks'];
        }
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'ai',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          codeSnippet,
          actionSuggestions: suggestions
        }
      ]);
      setIsTyping(false);
    }, 800);
  };

  const copyText = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    const textContent = chatMessages.map(m => `[${m.timestamp}] ${m.sender === 'user' ? 'USER' : 'AI ANALYST'}:\n${m.text}\n${m.codeSnippet ? `\nCode:\n${m.codeSnippet}\n` : ''}`).join('\n---\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-analyst-chat-history-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  return (
    <div className="space-y-8" id="ai-security-analyst-module">
      
      {/* MODULE HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#111114] border border-gray-800/90 p-5 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600/20 p-3 rounded-xl border border-purple-500/30 shrink-0">
            <Bot className="w-7 h-7 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {isZh ? "AI 資安威脅分析師" : isJa ? "AI セキュリティ脅威アナリスト" : "AI Security Analyst"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Llama-3 LLM Core
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">
              {isZh 
                ? "基於本地 Ollama 與 Llama-3 架構的自律型安全研判、攻擊路徑推論與對抗防禦專家系統" 
                : isJa 
                ? "Ollama & Llama-3 ベースの自律型セキュリティ脅威推論・攻撃ツリー分析エンジン" 
                : "Autonomous Security Reasoning, Kill-Chain Correlation & Containment Engine powered by Llama-3"}
            </p>
          </div>
        </div>
        
        {/* SUBTABS NAVIGATION */}
        <div className="flex bg-black/60 p-1.5 rounded-xl border border-gray-800 self-start lg:self-auto overflow-x-auto custom-scrollbar">
          {[
            { 
              id: 'analysis', 
              label: isZh ? '威脅關聯研判' : isJa ? '脅威関連分析' : 'AI Attack Analysis', 
              icon: <Sparkles className="w-3.5 h-3.5" /> 
            },
            { 
              id: 'chat', 
              label: isZh ? '專家對話助理' : isJa ? 'アナリスト対話' : 'Analyst Copilot', 
              icon: <MessageSquare className="w-3.5 h-3.5" /> 
            },
            { 
              id: 'settings', 
              label: isZh ? '模型與節點設定' : isJa ? 'モデル・API設定' : 'Model & API Config', 
              icon: <Settings className="w-3.5 h-3.5" /> 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeSubTab === tab.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB CONTENT WITH SMOOTH ANIMATION */}
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeSubTab === 'analysis' && <AIAttackAnalysisView />}
        
        {activeSubTab === 'chat' && (
          <div className="bg-[#111114] border border-gray-800 rounded-2xl h-[720px] flex flex-col shadow-2xl overflow-hidden" id="ai-analyst-chat-box">
            
            {/* Chat Top Action Bar */}
            <div className="p-4 md:px-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                    <Bot className="text-purple-400" size={18} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#111114]"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {isZh ? "Llama-3 資安應變智慧助理" : isJa ? "Llama-3 セキュリティアシスタント" : "Llama-3 Security Copilot"}
                    <span className="text-[9px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                      Local Node
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {isZh ? "即時聯動 Suricata、SSHD、Traefik 與 PostgreSQL 日誌" : "Linked to Suricata, SSHD, and PostgreSQL logs"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportChat}
                  title={isZh ? "匯出對話紀錄" : "Export Transcript"}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-bold transition-all border border-gray-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">{isZh ? "匯出紀錄" : "Export"}</span>
                </button>

                <button
                  onClick={handleClearChat}
                  title={isZh ? "清空對話" : "Clear Chat"}
                  className="p-1.5 bg-gray-900 hover:bg-red-950/40 text-gray-400 hover:text-red-400 rounded-lg text-xs transition-all border border-gray-800 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-gradient-to-b from-[#111114] to-black/40">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn("flex gap-3 md:gap-4", msg.sender === 'user' ? "justify-end" : "justify-start")}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={16} className="text-purple-400" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "space-y-3 max-w-[88%] md:max-w-[78%]",
                    msg.sender === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-lg relative group",
                      msg.sender === 'user' 
                        ? "bg-purple-600 text-white rounded-tr-none" 
                        : "bg-[#18181c] border border-gray-800 text-gray-200 rounded-tl-none"
                    )}>
                      <div className="whitespace-pre-line space-y-2">
                        {msg.text}
                      </div>

                      {/* Code Block if any */}
                      {msg.codeSnippet && (
                        <div className="mt-3 bg-black/80 rounded-xl border border-gray-800 p-3 font-mono text-xs overflow-x-auto custom-scrollbar relative">
                          <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">BASH / SHELL SCRIPT</span>
                            <button
                              onClick={() => copyText(msg.codeSnippet!, `code-${msg.id}`)}
                              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                            >
                              {copiedId === `code-${msg.id}` ? (
                                <span className="text-green-400 flex items-center gap-1"><Check size={11} /> {isZh ? '已複製' : 'Copied'}</span>
                              ) : (
                                <span className="flex items-center gap-1"><Copy size={11} /> {isZh ? '複製指令' : 'Copy'}</span>
                              )}
                            </button>
                          </div>
                          <pre className="text-green-400 font-mono text-[11px] leading-relaxed select-all">
                            {msg.codeSnippet}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-400">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'ai' && (
                          <button 
                            onClick={() => copyText(msg.text, `msg-${msg.id}`)}
                            className="hover:text-white transition-colors flex items-center gap-1"
                          >
                            {copiedId === `msg-${msg.id}` ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                            <span>{copiedId === `msg-${msg.id}` ? (isZh ? '已複製內容' : 'Copied') : (isZh ? '複製回覆' : 'Copy')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick suggestion buttons underneath AI messages */}
                    {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.actionSuggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(suggestion)}
                            className="px-3 py-1.5 bg-[#1e1e24] hover:bg-purple-900/30 border border-gray-800 hover:border-purple-500/40 text-gray-300 hover:text-purple-300 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Zap size={11} className="text-purple-400" />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={16} className="text-purple-200" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-purple-400" />
                  </div>
                  <div className="bg-[#18181c] border border-gray-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    <span className="ml-2 font-mono text-[11px] text-purple-300">
                      {isZh ? "Llama-3 正在調取日誌進行關聯推論..." : "Llama-3 is reasoning over logs..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Bar & Input Box */}
            <div className="p-4 border-t border-gray-800 bg-[#0d0d10] space-y-3">
              
              {/* Quick suggestion bar */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                  {isZh ? "快捷指令：" : "Quick:"}
                </span>
                {[
                  isZh ? "分析 10.10.42.5 的 DNS 異常流量" : "Analyze DNS on 10.10.42.5",
                  isZh ? "針對 SSH 暴力破解生成防禦腳本" : "SSH brute force defense",
                  isZh ? "檢查 PostgreSQL 5432 暴露風險" : "PostgreSQL 5432 check",
                  isZh ? "評估 APT29 與 Sandworm 作戰特徵" : "Assess APT29 & Sandworm"
                ].map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 rounded-md text-[11px] transition-all whitespace-nowrap cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }} 
                className="relative flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      isZh ? "向 AI 分析師提問（例如：請分析最新資料庫告警、提供防火牆阻斷腳本）..." : 
                      isJa ? "AIアナリストに指示または質問（例：最新のアラートを分析、隔離スクリプト生成）..." : 
                      "Ask the AI Security Analyst (e.g. analyze incident R-001, generate containment script)..."
                    }
                    className="w-full bg-black/60 border border-gray-800 rounded-xl pl-4 pr-12 py-3 text-xs md:text-sm focus:border-purple-500 outline-none transition-all text-white placeholder:text-gray-600 font-sans"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500 text-[10px] font-mono">
                    <span className="bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded">Enter</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || isTyping}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-purple-600/20 shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>

            </div>

          </div>
        )}

        {activeSubTab === 'settings' && <AIModelConfigView />}
      </motion.div>

    </div>
  );
}

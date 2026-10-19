import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Brain,
  Cpu,
  Activity,
  FileText,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Users,
  BarChart3,
  PieChart,
  Zap,
  Search,
  ArrowRight,
  ExternalLink,
  Layers,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Filter,
  Download,
  Key,
  Globe,
  Database,
  ChevronRight,
  Code2,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import axios from 'axios';

export default function AIGatewayView() {
  const [activeTab, setActiveTab] = useState<'kpi' | 'audit' | 'simulator' | 'architecture'>('kpi');
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>('aigw-evt-20261019-001');

  // Audit filters
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulator Form State
  const [simUserId, setSimUserId] = useState('usr_rd_7821');
  const [simUserName, setSimUserName] = useState('Alex Lin (資深後端工程師)');
  const [simDept, setSimDept] = useState('研發工程處 (R&D Engineering)');
  const [simModel, setSimModel] = useState('gpt-4o');
  const [simSystemPrompt, setSimSystemPrompt] = useState('You are an enterprise coding assistant. Strictly adhere to corporate guidelines.');
  const [simPromptContent, setSimPromptContent] = useState(`請幫我審查這段付款微服務的核心扣款與資料庫連線程式碼並撰寫單元測試：
const apiKey = "sk-live-99a8b7c6d5e4f3a2b1c09876543210fe";
async function executeBillingCharge(customerId, amountCents) {
  const dbConn = "postgres://superadmin:ProdDbSecretPass2026@db-cluster.corp.internal:5432/core_billing";
  const client = await pool.connect(dbConn);
  return await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amountCents, customerId]);
}`);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchGatewayData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, logsRes] = await Promise.all([
        axios.get('/api/v1/ai-gateway/metrics').catch(() => null),
        axios.get('/api/v1/ai-gateway/logs').catch(() => null)
      ]);
      if (metricsRes?.data?.metrics) {
        setMetrics(metricsRes.data.metrics);
      }
      if (logsRes?.data?.logs) {
        setLogs(logsRes.data.logs);
      }
    } catch (e) {
      console.warn('Failed to load AI Gateway data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayData();
  }, []);

  const handleCopyJson = (content: any, id: string) => {
    navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    setCopiedId(id);
    showToast('已複製結構化 JSON 到剪貼簿！');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRunScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simPromptContent.trim()) return;
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await axios.post('/api/v1/scan-prompt', {
        userId: simUserId,
        userName: simUserName,
        department: simDept,
        targetModel: simModel,
        systemPrompt: simSystemPrompt,
        promptContent: simPromptContent
      });
      setSimResult(res.data);
      showToast(`審查完成！判定結果：${res.data.status}`);
      fetchGatewayData();
    } catch (err: any) {
      showToast('審查請求失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  const loadPreset = (type: 'A' | 'B' | 'C' | 'CLEAN') => {
    if (type === 'A') {
      setSimUserId('usr_rd_7821');
      setSimUserName('Alex Lin (資深後端工程師)');
      setSimDept('研發工程處 (R&D Engineering)');
      setSimModel('gpt-4o');
      setSimPromptContent(`請幫我審查這段付款微服務的核心扣款與資料庫連線程式碼並撰寫單元測試：
const apiKey = "sk-live-99a8b7c6d5e4f3a2b1c09876543210fe";
async function executeBillingCharge(customerId, amountCents) {
  const dbConn = "postgres://superadmin:ProdDbSecretPass2026@db-cluster.corp.internal:5432/core_billing";
  const client = await pool.connect(dbConn);
  return await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amountCents, customerId]);
}`);
    } else if (type === 'B') {
      setSimUserId('usr_hr_3319');
      setSimUserName('Jessica Wang (人資招募與績效專員)');
      setSimDept('人力資源處 (Human Resources)');
      setSimModel('claude-3-5-sonnet');
      setSimPromptContent('請幫我潤飾這段年度考績評語與職等升遷推薦詞：員工【王大明】，身分證字號【A123456789】，本年度於雲端遷移專案表現卓越，考績評定為優等 (A+)。建議由資深專員晉升副理，建議調薪幅度為 12%，調整後月薪為【NT$ 115,000】，並發放績效獎金【NT$ 345,000】。');
    } else if (type === 'C') {
      setSimUserId('usr_sales_8812');
      setSimUserName('Kevin Chen (全球業務處代表)');
      setSimDept('全球業務處 (Global Sales)');
      setSimModel('gpt-4o-mini');
      setSimPromptContent('System Batch Automation Query #892: Summarize competitive product intelligence dataset chunk 449 and output raw JSON parameters...');
    } else {
      setSimUserId('usr_mkt_1102');
      setSimUserName('Emily Huang (行銷企劃專員)');
      setSimDept('行銷發展處 (Marketing)');
      setSimModel('gemini-1.5-pro');
      setSimPromptContent('請為我們 2026 年 Q4 舉辦之「企業雲端零信任架構研討會」草擬一份生動具吸引力的 LinkedIn 貼文，主軸圍繞在資安防護與業務韌性。');
    }
  };

  const filteredLogs = logs.filter(l => {
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    if (filterRisk !== 'ALL' && l.riskLevel !== filterRisk) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.userId?.toLowerCase().includes(q) ||
        l.userName?.toLowerCase().includes(q) ||
        l.department?.toLowerCase().includes(q) ||
        l.originalContent?.toLowerCase().includes(q) ||
        l.targetModel?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[3000] bg-blue-600/90 backdrop-blur-md border border-blue-400/30 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-black/80 border border-blue-500/20 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                <Brain size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white tracking-wide">
                    SEMOR CYBER · AI GATEWAY
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE PROXY ONLINE
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  企業級 AI 統一安全入口：SSO/RBAC 身份控管 · 動態機敏資料防護 (DLP) · 提示詞合規工作流 · 全量審計日誌與 SOC 聯防
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-2 bg-black/60 border border-gray-800 rounded-xl text-left">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">網關延遲 (Latency)</span>
              <span className="text-xs font-mono font-bold text-emerald-400">12.4 ms (Zero-Lag)</span>
            </div>
            <div className="px-3 py-2 bg-black/60 border border-gray-800 rounded-xl text-left">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">DLP 規則引擎</span>
              <span className="text-xs font-mono font-bold text-blue-400">8 Policies Enforced</span>
            </div>
            <button
              type="button"
              onClick={fetchGatewayData}
              disabled={isLoading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              重新整理數據
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-2">
        {[
          { id: 'kpi', label: 'AI 治理與即時監控 (5 大核心 KPI)', icon: <BarChart3 size={15} /> },
          { id: 'audit', label: '全量審計日誌 (3 大測試場景數據)', icon: <FileText size={15} /> },
          { id: 'simulator', label: '提示詞合規審查接口測試 (/api/v1/scan-prompt)', icon: <Terminal size={15} /> },
          { id: 'architecture', label: '系統架構圖與核心資料流 (Data Flow)', icon: <Layers size={15} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-gray-400 hover:text-white hover:bg-gray-800/60"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: 5 KEY DASHBOARD KPIS */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          {/* Top 5 KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1 */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KPI 1 · 影子 AI 阻擋</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30">
                  {metrics?.kpi1_shadowAiBlocked?.growthPercentage || '+18.4%'}
                </span>
              </div>
              <div className="space-y-1 my-2">
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <ShieldAlert size={22} className="text-red-400" />
                  <span>{metrics?.kpi1_shadowAiBlocked?.totalBlocks || 131} 次</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  攔截員工未經授權私自調用個人模型，阻斷 <strong className="text-red-300">45 次</strong> 外部影子 AI 連線。
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>防護狀態: 強制中斷</span>
                <span className="text-emerald-400">100% 阻斷</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KPI 2 · 機敏資料 (DLP) 分佈</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  即時防護
                </span>
              </div>
              <div className="space-y-1.5 my-1 text-[11px]">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1.5"><Users size={12} className="text-blue-400" /> 個資 PII (身分證/卡號)</span>
                  <span className="font-bold text-white font-mono">42%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1.5"><Key size={12} className="text-red-400" /> 密鑰 API Key / 憑證</span>
                  <span className="font-bold text-white font-mono">28%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1.5"><Code2 size={12} className="text-purple-400" /> 原始碼與資料庫連線</span>
                  <span className="font-bold text-white font-mono">18%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1.5"><DollarSign size={12} className="text-emerald-400" /> 薪資報酬與財報</span>
                  <span className="font-bold text-white font-mono">12%</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono">
                動態脫敏率: 92.4%
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KPI 3 · 各部門 Token 消耗</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  月度累計
                </span>
              </div>
              <div className="space-y-1 my-2">
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <Cpu size={22} className="text-blue-400" />
                  <span>29.5 M</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  研發工程處佔比最高 (<strong className="text-blue-300">48%</strong>)，主要模型為 GPT-4o 與 Claude 3.5。
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>平均回應延遲</span>
                <span className="text-emerald-400">840 ms</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KPI 4 · 提示詞合規放行率</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  治理合規
                </span>
              </div>
              <div className="space-y-1.5 my-1 text-[11px]">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-emerald-400 font-bold">● 合規安全放行</span>
                  <span className="font-mono text-white font-bold">{metrics?.kpi4_complianceRate?.passedRate || '71.5'}%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-blue-400 font-bold">● 動態遮蔽脫敏</span>
                  <span className="font-mono text-white font-bold">{metrics?.kpi4_complianceRate?.maskedRate || '21.4'}%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-red-400 font-bold">● 違規強制阻斷</span>
                  <span className="font-mono text-white font-bold">{metrics?.kpi4_complianceRate?.blockedRate || '7.1'}%</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono">
                System Prompt 統一覆蓋: 100%
              </div>
            </div>

            {/* KPI 5 */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KPI 5 · 高風險異常呼叫告警</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  重大威脅
                </span>
              </div>
              <div className="space-y-1 my-2">
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <Zap size={22} className="text-amber-400" />
                  <span>16 次告警</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  包含 <strong className="text-red-400">9 次</strong> 速率超標熔斷、<strong className="text-amber-400">5 次</strong> 深夜自動腳本刷取異常。
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>SOC 告警聯防</span>
                <span className="text-emerald-400">已自動推播</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown & Policy Enforcement Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Usage Breakdown */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  各部門 AI 模型調用量與 Token 消耗排行榜
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">基於企業 SSO/RBAC 追蹤</span>
              </div>

              <div className="space-y-3">
                {(metrics?.kpi3_departmentTokenUsage || [
                  { department: '研發工程處 (R&D)', tokens: 14200000, percentage: 48, topModel: 'gpt-4o' },
                  { department: '全球業務處 (Sales)', tokens: 6800000, percentage: 23, topModel: 'gpt-4o-mini' },
                  { department: '人力資源處 (HR)', tokens: 3500000, percentage: 12, topModel: 'claude-3-5-sonnet' },
                  { department: '行銷發展處 (Marketing)', tokens: 2900000, percentage: 10, topModel: 'gemini-1.5-pro' },
                  { department: '資安維運中心 (SecOps)', tokens: 2100000, percentage: 7, topModel: 'claude-3-haiku' }
                ]).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-black/40 border border-gray-800/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        {item.department}
                      </span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-[11px] text-gray-400">主要模型: <strong className="text-purple-300">{item.topModel}</strong></span>
                        <span className="text-blue-400 font-bold">{(item.tokens / 1000000).toFixed(1)}M Tokens ({item.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-purple-500" : idx === 2 ? "bg-emerald-500" : "bg-gray-500"
                        )}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core DLP Policies Active */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  AI Gateway 啟用之動態機敏防護原則 (DLP Policy Matrix)
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  8 條策略強制執行中
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'SEC-POL-001', name: '企業核心原始碼與演算法外流防護', action: 'BLOCK', category: 'SOURCE_CODE', desc: '偵測微服務商業邏輯、扣款與核心演算法原始碼，予以即時攔截。' },
                  { id: 'SEC-POL-002', name: '公有雲與內部 API Key / 憑證洩漏防護', action: 'BLOCK', category: 'SECRET', desc: '偵測 sk-live-*、AWS Key、資料庫連線帳密與私鑰字串，邊緣熔斷。' },
                  { id: 'DLP-POL-004', name: '國民身分證字號 (ROC ID) 動態遮蔽', action: 'MASK', category: 'PII', desc: '檢出身分證號碼自動轉化為 A1********，支援遮蔽後安全放行。' },
                  { id: 'DLP-POL-005', name: '信用卡與支付卡號 (PCI-DSS) 脫敏', action: 'MASK', category: 'PII', desc: '遮蔽前 12 碼信用卡號，僅保留後 4 碼以符合資安合規規範。' },
                  { id: 'DLP-POL-008', name: '員工薪資報酬與福利隱私保護原則', action: 'MASK', category: 'FINANCIAL', desc: '將具體薪資與獎金金額替換為 [CONFIDENTIAL_SALARY] 標記。' },
                  { id: 'RATE-LIMIT-POL-001', name: '單一帳號短時間呼叫頻率限制 (30 req/min)', action: 'BLOCK', category: 'RATE_LIMIT', desc: '針對自動化腳本刷取、帳號密碼外洩盜刷實施滑動窗口阻斷。' }
                ].map((pol, idx) => (
                  <div key={idx} className="p-3 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-blue-400 font-bold">{pol.id}</span>
                        <span className="text-xs font-bold text-white">{pol.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{pol.desc}</p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-bold uppercase shrink-0",
                      pol.action === 'BLOCK' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    )}>
                      {pol.action === 'BLOCK' ? '強制阻斷' : '動態遮蔽'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS (WITH 3 BENCHMARK SCENARIOS) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Quick Scenario Buttons */}
          <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-xs font-bold text-white">點選快速載入 3 大測試場景數據：</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedLogId('aigw-evt-20261019-001')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 flex items-center gap-1.5 transition-all"
              >
                <ShieldAlert size={13} />
                場景 A：研發洩漏原始碼與 API Key (阻擋)
              </button>
              <button
                type="button"
                onClick={() => setExpandedLogId('aigw-evt-20261019-002')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition-all"
              >
                <EyeOff size={13} />
                場景 B：HR 身分證與薪資考績 (脫敏放行)
              </button>
              <button
                type="button"
                onClick={() => setExpandedLogId('aigw-evt-20261019-003')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all"
              >
                <Zap size={13} />
                場景 C：深夜腳本高頻刷取 (限速告警)
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋使用者 ID、姓名、部門、模型或提示詞內容..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-bold">處置動作:</span>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 font-bold outline-none"
                >
                  <option value="ALL">全部動作 (ALL)</option>
                  <option value="BLOCK">攔截阻擋 (BLOCK)</option>
                  <option value="MASK">動態脫敏 (MASK)</option>
                  <option value="PASS">合規放行 (PASS)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-bold">風險層級:</span>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 font-bold outline-none"
                >
                  <option value="ALL">全部風險 (ALL)</option>
                  <option value="CRITICAL">嚴重 (CRITICAL)</option>
                  <option value="HIGH">高 (HIGH)</option>
                  <option value="MEDIUM">中 (MEDIUM)</option>
                  <option value="LOW">低 (LOW)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Cards */}
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className={cn(
                    "bg-[#111114] border rounded-2xl overflow-hidden transition-all duration-200 shadow-xl",
                    log.action === 'BLOCK' ? "border-red-500/30 hover:border-red-500/50" :
                    log.action === 'MASK' ? "border-blue-500/30 hover:border-blue-500/50" :
                    "border-gray-800"
                  )}
                >
                  {/* Card Header Summary */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-gray-900/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2.5 rounded-xl border shrink-0 mt-0.5",
                        log.action === 'BLOCK' ? "bg-red-500/20 text-red-400 border-red-500/40" :
                        log.action === 'MASK' ? "bg-blue-500/20 text-blue-400 border-blue-500/40" :
                        "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      )}>
                        {log.action === 'BLOCK' ? <ShieldAlert size={20} /> : log.action === 'MASK' ? <EyeOff size={20} /> : <ShieldCheck size={20} />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-400">{log.id}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                            log.action === 'BLOCK' ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                            log.action === 'MASK' ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" :
                            "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          )}>
                            {log.action === 'BLOCK' ? '攔截阻擋 (BLOCKED)' : log.action === 'MASK' ? '動態脫敏 (MASKED)' : '合規通過 (PASSED)'}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                            log.riskLevel === 'CRITICAL' ? "bg-red-600/30 text-red-300" :
                            log.riskLevel === 'HIGH' ? "bg-amber-600/30 text-amber-300" :
                            "bg-blue-600/30 text-blue-300"
                          )}>
                            風險等級: {log.riskLevel}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Users size={13} className="text-gray-400" />
                            {log.userName} ({log.userId})
                          </span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-300">{log.department}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-purple-300 font-mono">模型: {log.targetModel} ({log.modelProvider})</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-400 font-mono">Tokens: {log.promptTokensEstimate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end lg:self-center">
                      {log.socForwarded && (
                        <span className="px-2.5 py-1 bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <Shield size={11} />
                          SOC 告警: {log.socAlertId}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyJson(log, log.id);
                        }}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        {copiedId === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copiedId === log.id ? '已複製' : '複製 JSON'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="p-6 border-t border-gray-800/80 bg-black/60 space-y-5">
                      {/* Block Reason Warning if applicable */}
                      {log.blockReason && (
                        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-xs font-mono text-red-200 flex items-start gap-3">
                          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-red-300 uppercase block mb-0.5">邊緣安全攔截原因：</span>
                            {log.blockReason}
                          </div>
                        </div>
                      )}

                      {/* Side by Side: Original vs Processed Prompt */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            原始提示詞內容 (Original Prompt Sent by User)
                          </span>
                          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl font-mono text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {log.originalContent}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            網關脫敏/處理後內容 (Gateway Processed Output)
                          </span>
                          <div className={cn(
                            "p-3 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto border",
                            log.action === 'BLOCK' ? "bg-red-950/20 border-red-500/20 text-red-400 italic" : "bg-gray-900 border-gray-800 text-emerald-300"
                          )}>
                            {log.action === 'BLOCK' ? '【請求已阻斷 - 未傳送至外部大模型】' : (log.processedContent || log.originalContent)}
                          </div>
                        </div>
                      </div>

                      {/* Matched Entities & Policies */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            偵測到的機敏實體 (Detected Sensitive Entities)
                          </span>
                          <div className="space-y-1.5">
                            {log.matchDetails?.map((m: any, mIdx: number) => (
                              <div key={mIdx} className="p-2 bg-gray-900/60 border border-gray-800 rounded-lg text-xs font-mono flex items-center justify-between">
                                <span className="text-amber-400 font-bold">{m.type}:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400 line-through truncate max-w-[150px]">{m.detectedText}</span>
                                  {m.replacedWith && (
                                    <>
                                      <ArrowRight size={12} className="text-gray-500" />
                                      <span className="text-emerald-400">{m.replacedWith}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            觸發的企業資安政策 (Triggered Policies)
                          </span>
                          <div className="space-y-1.5">
                            {log.triggeredPolicies?.map((p: any, pIdx: number) => (
                              <div key={pIdx} className="p-2 bg-gray-900/60 border border-gray-800 rounded-lg text-xs flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-blue-400 font-bold mr-2">{p.id}</span>
                                  <span className="text-gray-200">{p.name}</span>
                                </div>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-purple-300 font-mono">
                                  {p.severity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Raw JSON Block */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            SEMOR CYBER SOC 結構化審計日誌 JSON (SOC Event Schema)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyJson(log, `raw-${log.id}`)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                          >
                            <Copy size={11} /> 複製標準 JSON
                          </button>
                        </div>
                        <pre className="p-3 bg-black border border-gray-800 rounded-xl font-mono text-[11px] text-gray-300 overflow-x-auto max-h-56 leading-relaxed">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PROMPT SCANNER & DLP SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-blue-950/20 to-transparent border border-blue-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal size={18} className="text-blue-400" />
                提示詞合規審查與遮蔽接口實時測試器 (Live /api/v1/scan-prompt Simulator)
              </h3>
              <p className="text-xs text-gray-400">
                模擬員工發送 Prompt，由後端 AI Gateway 執行動態 DLP 審查（身分證字號、信用卡、原始碼、金鑰、薪酬等），即時查看脫敏或阻斷回傳。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadPreset('A')}
                className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold"
              >
                帶入場景 A (原始碼/金鑰)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('B')}
                className="px-3 py-1.5 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold"
              >
                帶入場景 B (身分證/薪資)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('CLEAN')}
                className="px-3 py-1.5 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold"
              >
                帶入合規正常範例
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <form onSubmit={handleRunScan} className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-3">
                <Code2 size={14} className="text-blue-400" />
                Request Payload 參數設定
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">使用者 ID (SSO User)</label>
                  <input
                    type="text"
                    value={simUserId}
                    onChange={(e) => setSimUserId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">所屬部門 (Department)</label>
                  <input
                    type="text"
                    value={simDept}
                    onChange={(e) => setSimDept(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">目標外部大模型 (Target Model)</label>
                <select
                  value={simModel}
                  onChange={(e) => setSimModel(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-blue-500"
                >
                  <option value="gpt-4o">OpenAI · GPT-4o (企業版專屬授權)</option>
                  <option value="claude-3-5-sonnet">Anthropic · Claude 3.5 Sonnet</option>
                  <option value="gpt-4o-mini">OpenAI · GPT-4o-mini (快速查詢)</option>
                  <option value="gemini-1.5-pro">Google · Gemini 1.5 Pro</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  標準化 System Prompt 範本
                </label>
                <input
                  type="text"
                  value={simSystemPrompt}
                  onChange={(e) => setSimSystemPrompt(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  使用者輸入提示詞 (User Prompt Payload)
                </label>
                <textarea
                  rows={6}
                  value={simPromptContent}
                  onChange={(e) => setSimPromptContent(e.target.value)}
                  placeholder="輸入待審查之提示詞內容..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                {isSimulating ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                {isSimulating ? '執行 DLP 語意掃描與脫敏...' : '發送提示詞審查 (/api/v1/scan-prompt)'}
              </button>
            </form>

            {/* Live Response Panel */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} className="text-emerald-400" />
                    API 即時回應結果 (Response Inspection)
                  </h4>
                  {simResult && (
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono",
                      simResult.status === 'BLOCK' ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                      simResult.status === 'MASK' ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" :
                      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    )}>
                      {simResult.status} (耗時: {simResult.inspectionDurationMs}ms)
                    </span>
                  )}
                </div>

                {simResult ? (
                  <div className="space-y-4">
                    {/* Status Message */}
                    <div className={cn(
                      "p-4 rounded-xl border text-xs font-mono whitespace-pre-line leading-relaxed",
                      simResult.status === 'BLOCK' ? "bg-red-950/30 border-red-500/40 text-red-300" :
                      simResult.status === 'MASK' ? "bg-blue-950/30 border-blue-500/40 text-blue-300" :
                      "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                    )}>
                      <strong>審查判定：</strong> {simResult.summary?.message}
                    </div>

                    {/* Sanitized Prompt if not blocked */}
                    {simResult.status !== 'BLOCK' && simResult.sanitizedPrompt && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          最終放行至外部模型的脫敏內容 (Sanitized Prompt for LLM):
                        </span>
                        <div className="p-3 bg-black border border-gray-800 rounded-xl font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                          {simResult.sanitizedPrompt}
                        </div>
                      </div>
                    )}

                    {/* Policy Violations */}
                    {simResult.policyViolations?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          觸發之合規政策清單:
                        </span>
                        <div className="space-y-1">
                          {simResult.policyViolations.map((p: any, idx: number) => (
                            <div key={idx} className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono flex items-center justify-between">
                              <span className="text-white">{p.name} ({p.id})</span>
                              <span className="text-purple-400 font-bold">{p.severity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center text-gray-600 text-xs italic space-y-2">
                    <Terminal size={28} className="mx-auto text-gray-700" />
                    <p>尚未發起審查請求，請於左側設定參數後點選「發送提示詞審查」</p>
                  </div>
                )}
              </div>

              {simResult && (
                <div className="pt-3 border-t border-gray-800/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCopyJson(simResult, 'sim-result')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Copy size={13} />
                    複製 Response JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ARCHITECTURE & DATA FLOW */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Architecture Layer Description Card */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-blue-400" />
                AI Gateway 在 SEMOR CYBER 平台中的系統串接層級
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                邊緣網關與反向代理層 (Edge API Gateway & Ingress Proxy)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                <span className="text-blue-400 font-bold text-xs uppercase flex items-center gap-1.5">
                  <Globe size={14} /> 1. 邊緣接入與身分代理層
                </span>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  部署於企業網路邊界 (DMZ 或 Kubernetes Ingress)，充當反向代理（Reverse Proxy）。攔截所有出站模型調用，強制終止 TLS 並透過企業 SSO（Azure AD/Okta）進行 RBAC 憑證驗證，阻斷影子 AI。
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                <span className="text-purple-400 font-bold text-xs uppercase flex items-center gap-1.5">
                  <Cpu size={14} /> 2. 中介軟體深度檢查層 (Middleware)
                </span>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  串接在 SEMOR CYBER 核心中介軟體管線。在 Prompt 送出前掛載 DLP 語意過濾、PII 脫敏、金鑰偵測與 Token 速率限制器；在回應回傳時實施惡意輸出與 Prompt 注入過濾。
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                <span className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5">
                  <Database size={14} /> 3. 審計收集與 SOC 聯防層
                </span>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  全量日誌透過異步管線推送至 SEMOR CYBER NG-SIEM VictoriaLogs 與 SOAR 引擎。違規事件即時觸發告警，重大威脅自動聯動 PacketFence NAC 隔離惡意設備。
                </p>
              </div>
            </div>
          </div>

          {/* 7-Step Core Data Flow */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-3">
              <Activity size={16} className="text-emerald-400" />
              核心端到端資料流向 (7-Step End-to-End Data Flow)
            </h3>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: '員工終端發起 Prompt 請求 (SSO 身份認證與 RBAC 驗證)',
                  desc: '員工透過企業內部 AI 入口或 IDE 外掛程式發起查詢請求。AI Gateway 驗證其 JWT/OAuth2 權杖，確認其部門與模型存取權限。若未經認證或試圖繞道個人個人帳號，即刻拒絕連線 (阻斷影子 AI)。'
                },
                {
                  step: '02',
                  title: '注入企業標準化提示詞 (System Prompt Workflow Enforcement)',
                  desc: '根據使用者角色與業務場景，AI Gateway 自動將合規規範、格式要求或業務上下文注入 System Prompt，確保模型輸出符合企業標準。'
                },
                {
                  step: '03',
                  title: '邊緣動態 DLP 深度檢測 (Regex Pattern & NLP Semantic Matching)',
                  desc: '對 Prompt 進行深度語意解析與正規比對，掃描個人隱私 (PII)、商業機密 (未公開財報、專利程式碼)、認證金鑰 (API Key、資料庫密碼)。'
                },
                {
                  step: '04',
                  title: '策略判定與動作執行 (Pass / Mask / Block Execution)',
                  desc: '若偵測到高危機密 (如金鑰、原始碼)，立即中斷請求並回傳 403 Forbidden；若為個資或薪資，則依原則執行正則置換與去識別化遮蔽 (Masking)。'
                },
                {
                  step: '05',
                  title: '加密轉發外部公有模型 (Upstream Provider Proxy)',
                  desc: '將脫敏後或合規的提示詞，透過 AI Gateway 的安全金鑰集轉發至 OpenAI、Anthropic 或 Google 等外部大模型 API。'
                },
                {
                  step: '06',
                  title: '模型回應安全掃描 (Output Guardrails & Anti-Prompt Injection)',
                  desc: '接收外部模型生成之回覆，進行有害內容、幻覺資訊與反向 Prompt 注入檢測，確認安全後回傳給員工終端。'
                },
                {
                  step: '07',
                  title: '全量審計日誌非同步寫入 SEMOR CYBER SOC 中心',
                  desc: '以非同步不卡頓方式，將「使用者 ID、部門、時間戳記、模型名稱、原始/脫敏 Prompt、Token 數、違規策略」打包為結構化 JSON 匯入 SIEM，觸發風險評級與 SOAR 自動化響應。'
                }
              ].map((flow, fIdx) => (
                <div key={fIdx} className="p-4 bg-black/40 border border-gray-800/80 rounded-xl flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold shrink-0">
                    {flow.step}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {flow.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{flow.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

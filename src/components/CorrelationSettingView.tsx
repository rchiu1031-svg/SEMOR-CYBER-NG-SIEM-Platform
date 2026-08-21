import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Layers,
  Clock,
  ArrowRightLeft,
  Code,
  Sliders,
  Plus,
  Play,
  Save,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Database,
  RefreshCw,
  Terminal,
  FileCode,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Workflow,
  Sparkles,
  Server,
  Activity,
  HardDrive,
  Copy
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function CorrelationSettingView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'rules' | 'window' | 'mapping' | 'aggregation' | 'engine'>('rules');

  // Search & Filter state for rules
  const [ruleSearch, setRuleSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Live Test Simulation State
  const [testPayload, setTestPayload] = useState(`{
  "timestamp": "2026-08-20T19:14:00Z",
  "event_type": "windows_security_4688",
  "host": "WS-FINANCE-088",
  "src_ip": "192.168.10.55",
  "user": "alice.chen",
  "process": "powershell.exe",
  "cmdline": "powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAbwB1AGQA...",
  "parent_process": "WINWORD.EXE"
}`);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Sample Correlation Rules List
  const [rules, setRules] = useState([
    {
      id: 'CORR-RULE-101',
      name: isZh ? '多重登入失敗後緊接特權提升與橫向移動' : 'Brute Force Followed by PrivEsc & Lateral Jump',
      severity: 'Critical',
      tactic: 'TA0008 Lateral Movement',
      sources: ['Active Directory', 'EDR', 'Firewall'],
      window: '300s (5 min)',
      joinKey: 'user.name, host.ip',
      enabled: true,
      hits24h: 148,
      ruleLogic: 'EventA(Logon_Fail > 5 in 60s) -> EventB(PrivEsc_4672 in 120s) -> EventC(SMB_Session in 300s)'
    },
    {
      id: 'CORR-RULE-102',
      name: isZh ? '無檔案 PowerShell 記憶體注入且連線新註冊 C2 網域' : 'In-Memory PowerShell + High-Risk C2 Communication',
      severity: 'Critical',
      tactic: 'TA0011 Command & Control',
      sources: ['EDR Telemetry', 'Suricata NDR', 'DNS Server'],
      window: '120s (2 min)',
      joinKey: 'host.ip, process.guid',
      enabled: true,
      hits24h: 89,
      ruleLogic: 'EventA(EDR_Process_Inject) -> EventB(DNS_Query_NRD) -> EventC(TLS_JA3_Malicious)'
    },
    {
      id: 'CORR-RULE-103',
      name: isZh ? '不可能的移動登入 (異地 Tor 節點與內網特權存取)' : 'Impossible Travel + Tor Exit Node Admin Access',
      severity: 'High',
      tactic: 'TA0001 Initial Access',
      sources: ['Okta SSO', 'Threat Intel CTI', 'WAF Gateway'],
      window: '900s (15 min)',
      joinKey: 'user.id, user.email',
      enabled: true,
      hits24h: 42,
      ruleLogic: 'EventA(Geo_Distance > 5000km in < 1hr) AND EventB(CTI_Tor_Exit == true)'
    },
    {
      id: 'CORR-RULE-104',
      name: isZh ? '暗夜時段大量資料庫導出與突發雲端 S3 上傳' : 'Off-Hours Massive DB Dump + S3 Cloud Exfiltration',
      severity: 'Critical',
      tactic: 'TA0010 Exfiltration',
      sources: ['CloudTrail', 'PostgreSQL Audit', 'NetFlow'],
      window: '600s (10 min)',
      joinKey: 'host.ip, aws.iam_arn',
      enabled: true,
      hits24h: 24,
      ruleLogic: 'EventA(DB_Rows_Dump > 100000) -> EventB(S3_PutObject_Volume > 1GB in 600s)'
    },
    {
      id: 'CORR-RULE-105',
      name: isZh ? '陰影副本抹除與大量檔案副檔名異動 (勒索特徵)' : 'Volume Shadow Copy Delete + Rapid File Extension Changes',
      severity: 'Critical',
      tactic: 'TA0040 Impact',
      sources: ['EDR File Audit', 'Windows Sysmon'],
      window: '60s (1 min)',
      joinKey: 'host.name, host.ip',
      enabled: false,
      hits24h: 0,
      ruleLogic: 'EventA(Cmd == "vssadmin delete shadows") -> EventB(File_Rename_Count > 500 in 60s)'
    }
  ]);

  // Handle Rule Toggle
  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Run Test Simulation
  const handleRunSimulation = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        matched: true,
        ruleId: 'CORR-RULE-102',
        ruleName: isZh ? '無檔案 PowerShell 記憶體注入且連線新註冊 C2 網域' : 'In-Memory PowerShell + High-Risk C2 Communication',
        confidenceScore: 97,
        extractedKeys: {
          'host.ip': '192.168.10.55',
          'user.name': 'alice.chen',
          'process.name': 'powershell.exe',
          'threat.tactic': 'TA0011 Command & Control'
        },
        executionTime: '3.4 ms'
      });
    }, 600);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-[#111116] border border-gray-800 p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 text-blue-400">
            <Sliders size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {isZh ? '關聯設定與 CEP 規則引擎配置' : 'Correlation Engine & CEP Configuration'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isZh ? '引擎狀態：在線 (Flink CEP)' : 'Engine Status: Active'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isZh
                ? '自定義跨資料源關聯邏輯、滑動時間窗口、欄位標準化對齊與告警風暴聚合降噪規則。'
                : 'Configure cross-source event correlation pipelines, CEP sliding time windows, schema normalization, and de-duplication policies.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '活躍規則' : 'Active Rules'}</div>
            <div className="text-white font-bold">{rules.filter((r) => r.enabled).length} / {rules.length}</div>
          </div>
          <div className="px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '平均處理延遲' : 'Match Latency'}</div>
            <div className="text-emerald-400 font-bold">4.2 ms</div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 overflow-x-auto custom-scrollbar gap-1">
        {[
          { id: 'rules', label: isZh ? '關聯規則庫與編排 (Rules)' : 'Rule Catalog & Builder', icon: <FileCode size={15} /> },
          { id: 'window', label: isZh ? '滑動窗口與 CEP 參數 (Windows)' : 'Sliding Windows & CEP State', icon: <Clock size={15} /> },
          { id: 'mapping', label: isZh ? '欄位標準化與測試 (Schema)' : 'Schema Mapping & Live Test', icon: <ArrowRightLeft size={15} /> },
          { id: 'aggregation', label: isZh ? '告警聚合與降噪策略 (Grouping)' : 'Alert Aggregation & Storm Suppression', icon: <Layers size={15} /> },
          { id: 'engine', label: isZh ? '引擎叢集與狀態監控 (Engine)' : 'Engine Cluster & RocksDB', icon: <Server size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CORRELATION RULE CATALOG & VISUAL BUILDER */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Rules Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  placeholder={isZh ? '搜尋規則名稱、MITRE ATT&CK 標籤或 ID...' : 'Search rules by name, tactic, or ID...'}
                  className="w-full bg-[#111116] border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#111116] border border-gray-800 rounded-xl py-2 px-3 text-xs font-bold text-gray-300 outline-none"
              >
                <option value="ALL">{isZh ? '全部等級 (All Severity)' : 'All Severity'}</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSelectedRuleId(null);
                setIsEditingRule(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus size={15} />
              {isZh ? '建立自訂關聯規則' : 'Create Correlation Rule'}
            </button>
          </div>

          {/* Rules List Table */}
          <div className="bg-[#111116] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/80 border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="p-3.5 w-16 text-center">{isZh ? '狀態' : 'Status'}</th>
                    <th className="p-3.5">{isZh ? '規則名稱與關聯邏輯' : 'Rule Name & Logic'}</th>
                    <th className="p-3.5">{isZh ? '嚴重等級' : 'Severity'}</th>
                    <th className="p-3.5">{isZh ? '資料源' : 'Sources'}</th>
                    <th className="p-3.5">{isZh ? '滑動窗口' : 'Window'}</th>
                    <th className="p-3.5">{isZh ? '關聯鍵 (Join)' : 'Join Keys'}</th>
                    <th className="p-3.5 text-right">{isZh ? '操作' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {rules
                    .filter((r) => {
                      if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
                      if (
                        ruleSearch &&
                        !r.name.toLowerCase().includes(ruleSearch.toLowerCase()) &&
                        !r.id.toLowerCase().includes(ruleSearch.toLowerCase()) &&
                        !r.tactic.toLowerCase().includes(ruleSearch.toLowerCase())
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className={cn(
                              'w-8 h-4 rounded-full transition-colors relative inline-block',
                              rule.enabled ? 'bg-emerald-600' : 'bg-gray-700'
                            )}
                          >
                            <span
                              className={cn(
                                'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
                                rule.enabled ? 'right-0.5' : 'left-0.5'
                              )}
                            />
                          </button>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{rule.name}</div>
                          <div className="text-[10px] text-blue-400 font-mono mt-0.5">{rule.id} • {rule.tactic}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1 bg-black/40 px-2 py-1 rounded border border-gray-800/60 inline-block">
                            {rule.ruleLogic}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                              rule.severity === 'Critical'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            )}
                          >
                            {rule.severity}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex gap-1 flex-wrap">
                            {rule.sources.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[9px] font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-gray-400 text-[11px]">{rule.window}</td>
                        <td className="p-3.5 font-mono text-purple-300 text-[11px]">{rule.joinKey}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRuleId(rule.id);
                              setIsEditingRule(true);
                            }}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors inline-block"
                            title="Edit Rule"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setRules((prev) => prev.filter((r) => r.id !== rule.id));
                            }}
                            className="p-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg transition-colors inline-block"
                            title="Delete Rule"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Rule Builder Modal Drawer */}
          <AnimatePresence>
            {isEditingRule && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-[#111116] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-6 shadow-2xl text-left"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
                        <FileCode size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">
                          {selectedRuleId ? (isZh ? '編輯關聯規則' : 'Edit Correlation Rule') : (isZh ? '新建跨維度關聯規則' : 'Create New Correlation Rule')}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {isZh ? '定義多階段事件觸發條件、滑動時間閥值與關聯鍵' : 'Define multi-stage event triggers, CEP sliding thresholds, and entity join keys.'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setIsEditingRule(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">{isZh ? '規則名稱' : 'Rule Name'}</label>
                      <input
                        type="text"
                        defaultValue="Custom Multi-Stage Ransomware Beacon"
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">{isZh ? '嚴重等級' : 'Severity'}</label>
                      <select className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 font-bold">
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-Stage Visual Pipeline */}
                  <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl space-y-4">
                    <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center justify-between">
                      <span>{isZh ? '多事件關聯管道 (Event Stages)' : 'Event Stages Pipeline'}</span>
                      <span className="text-[10px] text-gray-500 font-mono">Sequential CEP Pattern</span>
                    </div>

                    {/* Stage A */}
                    <div className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">A</span>
                          {isZh ? '階段 A 條件：初始存取 / 異常程序執行' : 'Stage A: Initial Process Spawn'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Source: EDR Telemetry</span>
                      </div>
                      <input
                        type="text"
                        defaultValue="process.name in ['powershell.exe', 'wscript.exe'] AND process.parent.name == 'WINWORD.EXE'"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-[11px] text-emerald-400 outline-none"
                      />
                    </div>

                    {/* Stage B */}
                    <div className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">B</span>
                          {isZh ? '階段 B 條件：出境網路連線至 C2 代理' : 'Stage B: Outbound C2 Connection'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Source: Suricata NDR</span>
                      </div>
                      <input
                        type="text"
                        defaultValue="network.direction == 'outbound' AND destination.port == 443 AND threat.intel.confidence > 80"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-[11px] text-emerald-400 outline-none"
                      />
                    </div>

                    {/* Join Keys & Window */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">{isZh ? '關聯主鍵 (Join Keys)' : 'Join Keys (Cross-Event)'}</label>
                        <input
                          type="text"
                          defaultValue="host.ip, user.name"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-purple-300 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">{isZh ? '時間滑動窗口 (Sliding Window)' : 'Sliding Time Window'}</label>
                        <input
                          type="text"
                          defaultValue="300s (Within 5 minutes)"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => setIsEditingRule(false)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                    >
                      {isZh ? '取消' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingRule(false);
                        alert(isZh ? '關聯規則已成功編譯並載入 CEP 引擎！' : 'Rule successfully compiled and loaded into CEP engine!');
                      }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30"
                    >
                      <Save size={14} />
                      {isZh ? '儲存並立即套用' : 'Save & Hot Deploy'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* TAB 2: SLIDING WINDOWS & CEP STATE ENGINE */}
      {activeTab === 'window' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#111116] border border-gray-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-red-400">{isZh ? '快速突發攻擊窗口' : 'Fast Burst Window'}</span>
                <Clock size={16} className="text-red-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">60s ~ 5 min</div>
              <p className="text-xs text-gray-400">
                {isZh ? '專門針對暴力破解、DDoS 洪水與勒索軟體大規模加密抹除之高頻關聯。' : 'High-frequency correlation targeting brute force, DDoS bursts, and ransomware rapid encryption.'}
              </p>
              <div className="pt-2 border-t border-gray-800 flex justify-between text-[10px] font-mono text-gray-500">
                <span>In-Memory State: 380 MB</span>
                <span className="text-emerald-400 font-bold">Latency: 1.2ms</span>
              </div>
            </div>

            <div className="p-6 bg-[#111116] border border-gray-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400">{isZh ? '常規攻擊鏈推進窗口' : 'Kill-Chain Stage Window'}</span>
                <Clock size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">15 min ~ 2 hr</div>
              <p className="text-xs text-gray-400">
                {isZh ? '覆蓋從魚叉釣魚郵件點擊、C2 建立到內網橫向移動與特權提升之多階段時序。' : 'Spanning initial phishing, C2 beaconing, lateral movement, and privilege escalation stages.'}
              </p>
              <div className="pt-2 border-t border-gray-800 flex justify-between text-[10px] font-mono text-gray-500">
                <span>In-Memory State: 1.2 GB</span>
                <span className="text-emerald-400 font-bold">Latency: 4.8ms</span>
              </div>
            </div>

            <div className="p-6 bg-[#111116] border border-gray-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-blue-400">{isZh ? '慢速滲透 APT 漂移窗口' : 'Slow-and-Low APT Window'}</span>
                <Clock size={16} className="text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">24 hr ~ 14 days</div>
              <p className="text-xs text-gray-400">
                {isZh ? '專門偵測低頻心跳 Beaconing、定時暗夜探查與長週期資料庫慢速竊取行為。' : 'Catching stealth low-frequency beaconing, off-hours probing, and long-term exfiltration.'}
              </p>
              <div className="pt-2 border-t border-gray-800 flex justify-between text-[10px] font-mono text-gray-500">
                <span>RocksDB State: 3.4 GB</span>
                <span className="text-blue-400 font-bold">Checkpoint: Active</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive size={16} className="text-blue-400" />
              {isZh ? 'CEP 狀態暫存與亂序事件水線 (Watermark & Out-of-Order Lateness)' : 'CEP Watermark & Lateness Configuration'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">{isZh ? '日誌亂序到達容忍水線 (Allowed Lateness)' : 'Allowed Watermark Lateness'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue="30 seconds"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-white outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '當代理或遠端探針延遲送達時，在 30 秒內仍會被納入關聯滑動窗口計算。' : 'Late-arriving logs within 30s are seamlessly evaluated against active window states.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">{isZh ? 'RocksDB 記憶體狀態快照頻率 (State Checkpoint)' : 'RocksDB Checkpoint Interval'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue="Every 60 seconds (Incremental)"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-emerald-400 outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '發生節點故障時，CEP 引擎可在 2 秒內從 Checkpoint 無縫恢復關聯狀態。' : 'Enables instant state recovery in under 2s during worker failovers.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA MAPPING & LIVE TEST SIMULATOR */}
      {activeTab === 'mapping' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Schema Normalization Matrix */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-purple-400" />
                  {isZh ? 'ECS / Interflow 欄位標準化對齊' : 'ECS Schema Normalization Mapping'}
                </h3>
                <span className="text-[10px] font-mono text-gray-500">12 Connectors Active</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {[
                  { ext: 'Win_Event.TargetUserName', std: 'user.name', func: 'Extract & Trim', sample: 'alice.chen' },
                  { ext: 'Suricata.src_ip', std: 'source.ip', func: 'IPv4 Validate', sample: '192.168.10.55' },
                  { ext: 'CloudTrail.userIdentity.arn', std: 'aws.iam_arn', func: 'Parse ARN', sample: 'arn:aws:iam::123:role/Admin' },
                  { ext: 'Sysmon.ProcessCommandLine', std: 'process.command_line', func: 'De-obfuscate Base64', sample: 'powershell.exe -Enc...' }
                ].map((m, idx) => (
                  <div key={idx} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between gap-2">
                    <div className="text-gray-400 truncate flex-1">{m.ext}</div>
                    <ArrowRightLeft size={12} className="text-blue-500 flex-shrink-0" />
                    <div className="text-emerald-400 font-bold flex-1">{m.std}</div>
                    <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                      {m.func}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Test Simulator */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Play size={16} className="text-emerald-400" />
                  {isZh ? '即時日誌注入與規則模擬器' : 'Live Test Rule Simulator'}
                </h3>
                <button
                  onClick={handleRunSimulation}
                  disabled={isTesting}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Zap size={12} />
                  {isTesting ? (isZh ? '測試中...' : 'Evaluating...') : (isZh ? '執行匹配測試' : 'Run Match')}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '模擬日誌 JSON Payload' : 'Input JSON Payload'}</label>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  rows={8}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 font-mono text-[11px] text-blue-300 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {testResult && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> {isZh ? '規則成功命中 (Match Succeeded)' : 'Rule Match Hit!'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">Time: {testResult.executionTime}</span>
                  </div>
                  <div className="text-xs font-bold text-white">{testResult.ruleName}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{testResult.ruleId} • Confidence: {testResult.confidenceScore}%</div>

                  <div className="pt-2 border-t border-gray-800/80 font-mono text-[10px] text-gray-300 space-y-1">
                    {Object.entries(testResult.extractedKeys).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-500">{k}:</span>
                        <span className="text-purple-300">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALERT AGGREGATION & STORM SUPPRESSION */}
      {activeTab === 'aggregation' && (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-blue-400" />
              {isZh ? '告警風暴抑制與聚合降噪策略' : 'Alert Storm Suppression & Grouping Policies'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-white">{isZh ? '實體維度告警聚合 (Entity Grouping)' : 'Entity Clustering'}</div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isZh ? '同一主機 IP 或使用者帳號在 10 分鐘內觸發的同類告警自動聚合為單一事件，避免 SOC 告警疲勞。' : 'Group repeated detections from the same host or user within 10 minutes into 1 single clustered incident.'}
                </p>
                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-gray-800">
                  <span className="text-gray-400">{isZh ? '聚合窗口：10 分鐘' : 'Window: 10 mins'}</span>
                  <span className="text-emerald-400 font-bold">{isZh ? '已啟用' : 'Active'}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-white">{isZh ? '嚴重等級動態升級矩陣 (Severity Escalation)' : 'Dynamic Escalation Matrix'}</div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isZh ? '若同一實體在 30 分鐘內累積 3 次 Medium 告警，系統自動升級為 High Incident 並通知輪值分析師。' : 'Automatically escalates 3x Medium detections within 30 mins into a High Incident with on-call alert.'}
                </p>
                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-gray-800">
                  <span className="text-gray-400">{isZh ? '條件：3x Medium → 1x High' : '3x Medium -> 1x High'}</span>
                  <span className="text-emerald-400 font-bold">{isZh ? '已啟用' : 'Active'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ENGINE CLUSTER & ROCKSDB STATUS */}
      {activeTab === 'engine' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-[#111116] border border-gray-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-400">CEP Master 01</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-lg font-black text-white font-mono">Leader (Active)</div>
              <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                <div>CPU Load: 18.4%</div>
                <div>Memory: 2.1 GB / 8.0 GB</div>
              </div>
            </div>

            <div className="p-5 bg-[#111116] border border-gray-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-400">Worker Node 01</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-lg font-black text-white font-mono">92,400 EPS</div>
              <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                <div>RocksDB State: 1.2 GB</div>
                <div>Latency: 3.8 ms</div>
              </div>
            </div>

            <div className="p-5 bg-[#111116] border border-gray-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-400">Worker Node 02</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-lg font-black text-white font-mono">93,000 EPS</div>
              <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                <div>RocksDB State: 1.1 GB</div>
                <div>Latency: 4.1 ms</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

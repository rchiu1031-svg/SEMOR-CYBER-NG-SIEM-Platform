import React, { useState } from 'react';
import { 
  Brain, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Database, 
  Sliders, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Users, 
  Server, 
  Clock, 
  Lock, 
  Key, 
  FileText, 
  TrendingUp, 
  Download, 
  Upload, 
  RefreshCw, 
  X, 
  Terminal, 
  Layers, 
  Workflow, 
  Bell, 
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UEBASettingsViewProps {
  isReadOnly?: boolean;
}

interface RiskPolicy {
  id: string;
  name: string;
  category: '身份與認證' | '資料存取' | '網路與設備' | '特權管理' | '惡意行為';
  description: string;
  multiplier: number;
  addedScore: number;
  scope: string;
  enabled: boolean;
}

export default function UEBASettingsView({ isReadOnly = false }: UEBASettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'weights' | 'policies' | 'baselining' | 'automation' | 'telemetry'>('weights');
  
  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Behavior Weights
  const [weights, setWeights] = useState({
    impossibleTravel: 45,
    dataExfiltration: 50,
    lateralMovement: 40,
    credentialSharing: 35,
    abnormalDns: 30,
    privilegeEscalation: 40,
    massFileEncryption: 45,
    lateNightLogin: 15,
  });

  const defaultWeights = {
    impossibleTravel: 45,
    dataExfiltration: 50,
    lateralMovement: 40,
    credentialSharing: 35,
    abnormalDns: 30,
    privilegeEscalation: 40,
    massFileEncryption: 45,
    lateNightLogin: 15,
  };

  // Policies State
  const [policies, setPolicies] = useState<RiskPolicy[]>([
    { 
      id: 'p1', 
      name: '高階主管與特權帳號重點監控 (Executive & Privileged Account Guard)', 
      category: '特權管理',
      description: '針對隸屬於 Executive 與 Domain Admins AD 群組之帳號套用 1.5x 風險評分加權倍率。', 
      multiplier: 1.5,
      addedScore: 0,
      scope: 'OU=Executives, OU=Domain Admins',
      enabled: true 
    },
    { 
      id: 'p2', 
      name: '非上班時段核心資料庫防護 (Off-hours Core Database Guard)', 
      category: '資料存取',
      description: '凡於晚間 23:00 至清晨 05:00 期間存取生產環境核心資料庫，風險評分直接增加 +30 分。', 
      multiplier: 1.0,
      addedScore: 30,
      scope: '生產環境 DB 群組 (10.100.0.0/16)',
      enabled: true 
    },
    { 
      id: 'p3', 
      name: '新加入裝置適應期與信任度調整 (New Device Onboarding Grace Period)', 
      category: '網路與設備',
      description: '新上線未滿 48 小時之終端裝置降低初始信任分數，提升微小異常行為之偵測靈敏度。', 
      multiplier: 1.2,
      addedScore: 10,
      scope: '全體新註冊端點設備',
      enabled: false 
    },
    { 
      id: 'p4', 
      name: '未核准外部雲端儲存傳輸監控 (Unauthorized Cloud Storage Exfiltration)', 
      category: '資料存取',
      description: '針對使用者上傳大量檔案至個人 Dropbox、Mega、Google Drive 等非企業核准雲端網域進行告警。', 
      multiplier: 1.4,
      addedScore: 25,
      scope: '全體內網使用者',
      enabled: true 
    },
    { 
      id: 'p5', 
      name: '連續密碼噴灑與暴力破解防護 (Password Spraying & Brute Force Guard)', 
      category: '身份與認證',
      description: '偵測單一來源 IP 對多帳號使用相同密碼或多來源對單一帳號快速嘗試登入之異常行為。', 
      multiplier: 1.3,
      addedScore: 35,
      scope: '外部 VPN 與 SSO 端點',
      enabled: true 
    },
    { 
      id: 'p6', 
      name: '服務帳號互動式登入嚴密監控 (Service Account Interactive Login Guard)', 
      category: '特權管理',
      description: '嚴禁自動化服務帳號 (Service Accounts) 透過 RDP、SSH 或本機 Console 進行人為互動式登入。', 
      multiplier: 1.8,
      addedScore: 40,
      scope: 'OU=ServiceAccounts',
      enabled: true 
    }
  ]);

  // Modal for New / Edit Policy
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RiskPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState<Partial<RiskPolicy>>({
    name: '',
    category: '身份與認證',
    description: '',
    multiplier: 1.2,
    addedScore: 20,
    scope: '全體使用者',
    enabled: true
  });

  // Baselining Configuration
  const [baselineConfig, setBaselineConfig] = useState({
    trainingWindow: '14', // days
    peerGroupType: 'department', // 'department' | 'role' | 'location' | 'hybrid'
    deviationThreshold: '2.5', // sigma (standard deviation)
    reindexSchedule: 'weekly_sunday',
    minEventThreshold: 50,
    autoTuneThreshold: true
  });

  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState(0);
  const [retrainLogs, setRetrainLogs] = useState<string[]>([]);
  const [showRetrainModal, setShowRetrainModal] = useState(false);

  // XDR / SOAR Automation Triggers
  const [triggers, setTriggers] = useState({
    mfaEnforcement: 70,
    sessionTermination: 80,
    endpointIsolation: 85,
    accountDisable: 90
  });

  const [triggerActions, setTriggerActions] = useState({
    mfaEnforcement: true,
    sessionTermination: true,
    endpointIsolation: true,
    accountDisable: true,
    notifyAdmin: true,
    socWebhook: true
  });

  // Telemetry Pipelines Status
  const [telemetrySources] = useState([
    { name: 'EDR 行程與記憶體行為事件 (EDR Process & Memory)', count: '1,240,000 筆/小時', active: true, health: '優良', latency: '4ms' },
    { name: 'Active Directory / 網域身分認證日誌 (Identity & AD Logs)', count: '458,000 筆/小時', active: true, health: '優良', latency: '12ms' },
    { name: 'Netflow / IPFIX 網路流量中繼資料 (Netflow Metadata)', count: '8,420,000 筆/小時', active: true, health: '優良', latency: '2ms' },
    { name: 'DNS 查詢與 Proxy 網頁代理日誌 (DNS & Proxy Logs)', count: '2,130,000 筆/小時', active: true, health: '優良', latency: '6ms' },
    { name: '檔案完整性監控 (FIM / File Integrity Logs)', count: '125,000 筆/小時', active: true, health: '優良', latency: '8ms' },
    { name: '雲端環境稽核日誌 (AWS CloudTrail / Azure Activity)', count: '89,000 筆/小時', active: true, health: '正常', latency: '45ms' },
    { name: 'VPN / 零信任網關存取日誌 (ZTNA / VPN Access)', count: '16,500 筆/小時', active: true, health: '優良', latency: '15ms' },
    { name: '應用系統與核心 API 存取記錄 (Application & API Logs)', count: '74,000 筆/小時', active: false, health: '已暫停', latency: '-' },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetWeights = () => {
    setWeights(defaultWeights);
    showToast('已重設行為風險評分權重為系統預設值！');
  };

  const handleSaveSettings = () => {
    showToast('UEBA 行為分析引擎設定已成功儲存並同步生效！');
  };

  const handleTogglePolicy = (id: string) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    showToast('風險政策啟用狀態已更新！');
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id));
    showToast('風險政策已成功刪除！');
  };

  const handleOpenAddPolicy = () => {
    setEditingPolicy(null);
    setPolicyForm({
      name: '',
      category: '身份與認證',
      description: '',
      multiplier: 1.2,
      addedScore: 20,
      scope: '全體使用者',
      enabled: true
    });
    setShowPolicyModal(true);
  };

  const handleOpenEditPolicy = (policy: RiskPolicy) => {
    setEditingPolicy(policy);
    setPolicyForm(policy);
    setShowPolicyModal(true);
  };

  const handleSavePolicyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.name) return;

    if (editingPolicy) {
      setPolicies(policies.map(p => p.id === editingPolicy.id ? { ...p, ...policyForm } as RiskPolicy : p));
      showToast('風險政策已成功更新！');
    } else {
      const newPolicy: RiskPolicy = {
        id: `p${Date.now()}`,
        name: policyForm.name || '未命名政策',
        category: policyForm.category || '身份與認證',
        description: policyForm.description || '',
        multiplier: policyForm.multiplier || 1.0,
        addedScore: policyForm.addedScore || 0,
        scope: policyForm.scope || '全體使用者',
        enabled: policyForm.enabled ?? true
      };
      setPolicies([...policies, newPolicy]);
      showToast('已新增自訂風險政策！');
    }
    setShowPolicyModal(false);
  };

  const handleStartRetrain = () => {
    setIsRetraining(true);
    setRetrainProgress(10);
    setRetrainLogs([
      `[${new Date().toLocaleTimeString()}] 開始發起 UEBA 行為基準模型離線訓練工作...`,
      `[${new Date().toLocaleTimeString()}] 載入過去 ${baselineConfig.trainingWindow} 天歷史特徵日誌資料庫 (共計 1,420 實體)...`,
      `[${new Date().toLocaleTimeString()}] 執行同儕分群 (Peer Grouping: ${baselineConfig.peerGroupType === 'department' ? '部門維度' : '角色職務維度'})...`,
    ]);
    setShowRetrainModal(true);

    setTimeout(() => {
      setRetrainProgress(45);
      setRetrainLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 計算常態高斯分佈基準曲線 (Gaussian Distribution fitting)...`,
        `[${new Date().toLocaleTimeString()}] 標記異常偏離標準差門檻: σ ≥ ${baselineConfig.deviationThreshold}...`,
      ]);
    }, 1000);

    setTimeout(() => {
      setRetrainProgress(80);
      setRetrainLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 評估分組降噪效果，過濾 14 筆良性管理員例行排程...`,
        `[${new Date().toLocaleTimeString()}] 產生動態實體行為特徵向量資料庫 (Online Feature Store)...`,
      ]);
    }, 2000);

    setTimeout(() => {
      setRetrainProgress(100);
      setIsRetraining(false);
      setRetrainLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 行為基準模型重新訓練成功！新模型參數已發佈至推論引擎 (Inference Engine).`
      ]);
      showToast('行為基準模型訓練完成並已在線上生效！');
    }, 3000);
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
            className="fixed top-6 right-6 z-[3000] bg-blue-600/90 backdrop-blur-md border border-blue-400/30 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Retraining Modal */}
      {showRetrainModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f12] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <RotateCcw size={18} className={isRetraining ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">UEBA 行為基準模型訓練與建立</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">即時特徵聚類、常態分佈計算與特徵庫重新索引</p>
                </div>
              </div>
              {!isRetraining && (
                <button
                  onClick={() => setShowRetrainModal(false)}
                  className="text-gray-500 hover:text-white text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all"
                >
                  關閉
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-300 mb-2">
                  <span>{isRetraining ? '模型訓練演算法執行中...' : '模型訓練與發佈完成'}</span>
                  <span className="text-blue-400 font-mono">{retrainProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                    style={{ width: `${retrainProgress}%` }}
                  />
                </div>
              </div>

              {/* Logs */}
              <div className="bg-black/90 rounded-xl p-4 border border-gray-800/80 font-mono text-xs text-gray-300 space-y-2 max-h-[260px] overflow-y-auto">
                {retrainLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-blue-400 select-none">&gt;</span>
                    <span className={log.includes('成功') ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/40 flex justify-end">
              <button
                disabled={isRetraining}
                onClick={() => setShowRetrainModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                {isRetraining ? '訓練進行中...' : '完成並關閉'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Policy Modal (Add / Edit) */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f12] border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {editingPolicy ? '編輯風險政策 (Edit Risk Policy)' : '新增自訂風險政策 (New Risk Policy)'}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">定義實體行為風險加權倍率與特定防護觸發條件</p>
                </div>
              </div>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="text-gray-500 hover:text-white text-xs p-1.5 hover:bg-gray-800 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePolicyForm} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  政策名稱 (Policy Name)
                </label>
                <input
                  type="text"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                  placeholder="例如：特定 VIP 使用者深度異常監控政策"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    行為分類 (Category)
                  </label>
                  <select
                    value={policyForm.category}
                    onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                  >
                    <option value="身份與認證">身份與認證</option>
                    <option value="資料存取">資料存取</option>
                    <option value="網路與設備">網路與設備</option>
                    <option value="特權管理">特權管理</option>
                    <option value="惡意行為">惡意行為</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    套用範圍 (Scope / OU)
                  </label>
                  <input
                    type="text"
                    value={policyForm.scope}
                    onChange={(e) => setPolicyForm({ ...policyForm, scope: e.target.value })}
                    placeholder="例如：OU=Finance 或 10.20.0.0/16"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    風險加權倍率 (Multiplier)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={policyForm.multiplier}
                    onChange={(e) => setPolicyForm({ ...policyForm, multiplier: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    額外固定加分 (Fixed Added Score)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={policyForm.addedScore}
                    onChange={(e) => setPolicyForm({ ...policyForm, addedScore: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  政策規則說明 (Description)
                </label>
                <textarea
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  placeholder="詳細說明此政策之風險判定情境與觸發邏輯..."
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enablePolicy"
                  checked={policyForm.enabled}
                  onChange={(e) => setPolicyForm({ ...policyForm, enabled: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enablePolicy" className="text-xs font-bold text-gray-300 cursor-pointer">
                  立即啟用此風險政策
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Check size={14} />
                  儲存政策
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Top Status & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UEBA 引擎核心狀態</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              運作中 (ML-v4.2)
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Brain size={20} className="text-blue-400" />
            <span>行為異常評分引擎</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">即時推論延遲: 4.2ms | 吞吐量: 12.8K EPS</p>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">行為基準模型狀態</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              學習週期: 第 11/14 天
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-cyan-400" />
            <span>1,420 實體已建立基準</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">涵蓋 85 個部門同儕群組</p>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">高風險實體警示</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
              3 位高風險 (Score &gt; 80)
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-400" />
            <span>15 筆主動處置事件</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">中風險 12 位 | 正常 1,405 位</p>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">XDR / SOAR 自動化聯防</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
              4 項聯防機制就緒
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Zap size={20} className="text-purple-400" />
            <span>MFA + EDR 隔離 + 停用</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">自動化處置已觸發 28 次</p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-800 bg-gray-900/40 p-2 flex flex-wrap gap-2">
          {[
            { id: 'weights', label: '行為風險評分權重 (Weights)', icon: <Sliders size={14} /> },
            { id: 'policies', label: '風險政策與規則 (Policies)', icon: <Shield size={14} /> },
            { id: 'baselining', label: '行為基準與同儕分組 (Baselining)', icon: <RotateCcw size={14} /> },
            { id: 'automation', label: 'XDR / SOAR 聯防處置 (Automation)', icon: <Zap size={14} /> },
            { id: 'telemetry', label: '遙測資料串流狀態 (Telemetry)', icon: <Database size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all",
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

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {/* TAB 1: Behavior Score Weighting */}
          {activeTab === 'weights' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <SlidersHorizontal size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">實體異常行為加權評分機制 (Risk Score Weighting Engine)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      調整各項威脅向量在計算使用者與實體綜合風險指數 (Entity Risk Index) 時的權重分數貢獻
                    </p>
                  </div>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={handleResetWeights}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 border border-gray-700"
                  >
                    <RotateCcw size={14} />
                    重設為預設權重
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {/* Impossible Travel */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">異常跨國 / 不可能旅行登入 (Impossible Travel)</span>
                      <span className="text-[10px] text-gray-500">短時間內從兩個相距過遠的地理位置進行登入嘗試</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.impossibleTravel} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.impossibleTravel}
                      onChange={(e) => setWeights({ ...weights, impossibleTravel: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Data Exfiltration */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">大規模資料外洩與異常外發 (Data Exfiltration)</span>
                      <span className="text-[10px] text-gray-500">偏離日常基準之大量檔案傳輸、下載或上傳至外網</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.dataExfiltration} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.dataExfiltration}
                      onChange={(e) => setWeights({ ...weights, dataExfiltration: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Lateral Movement */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">內網橫向移動與異常主機探測 (Lateral Movement)</span>
                      <span className="text-[10px] text-gray-500">存取非所屬部門主機、SMB 檔案共用與 WMI/WinRM 探測</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.lateralMovement} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.lateralMovement}
                      onChange={(e) => setWeights({ ...weights, lateralMovement: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Credential Sharing */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">憑證共用與多重並行登入 (Credential Sharing)</span>
                      <span className="text-[10px] text-gray-500">同一使用者帳號於相同時段在多台不同內部設備並行登入</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.credentialSharing} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.credentialSharing}
                      onChange={(e) => setWeights({ ...weights, credentialSharing: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Privilege Escalation */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">特權提升與非預期權限變更 (Privilege Escalation)</span>
                      <span className="text-[10px] text-gray-500">使用者被加入高權限群組 (如 Domain Admins) 或 sudoer 異動</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.privilegeEscalation} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.privilegeEscalation}
                      onChange={(e) => setWeights({ ...weights, privilegeEscalation: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Mass File Encryption / Ransomware */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">大量檔案加密與修改 (Mass File Encryption)</span>
                      <span className="text-[10px] text-gray-500">短時間內批次重命名、寫入或疑似勒索軟體特徵活動</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.massFileEncryption} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.massFileEncryption}
                      onChange={(e) => setWeights({ ...weights, massFileEncryption: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Abnormal DNS */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">異常 DNS 請求與隧道通訊 (Abnormal DNS Tunneling)</span>
                      <span className="text-[10px] text-gray-500">偵測高熵值 (High Entropy) 查詢、DGA 域名與 DNS 外傳通道</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.abnormalDns} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.abnormalDns}
                      onChange={(e) => setWeights({ ...weights, abnormalDns: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Late Night / Off-hours Login */}
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">非上班時段 / 深夜異常登入 (Off-hours Login)</span>
                      <span className="text-[10px] text-gray-500">於例假日或凌晨 01:00 - 05:00 進行非常態存取</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                      +{weights.lateNightLogin} 分
                    </span>
                  </div>
                  <div className="relative flex items-center pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={isReadOnly}
                      value={weights.lateNightLogin}
                      onChange={(e) => setWeights({ ...weights, lateNightLogin: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Risk Policies Editor */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">自訂風險政策與加權規則 (Risk Policies & Rules)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">針對特權群組、特定資產網段或高敏感業務單位設定專屬行為加權與觸發條件</p>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={handleOpenAddPolicy}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 shrink-0"
                  >
                    <Plus size={14} />
                    新增自訂風險政策
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className={cn(
                      "p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                      policy.enabled
                        ? "bg-gray-900/40 border-gray-800 hover:border-blue-500/40"
                        : "bg-gray-950/40 border-gray-900 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        policy.enabled ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-gray-800 text-gray-500"
                      )}>
                        <Shield size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-bold text-white">{policy.name}</h5>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-bold">
                            {policy.category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                            {policy.multiplier > 1.0 ? `${policy.multiplier}x 倍率` : ''} 
                            {policy.addedScore > 0 ? ` +${policy.addedScore} 分` : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{policy.description}</p>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 pt-1">
                          <span>套用範圍：<strong className="text-gray-300 font-mono">{policy.scope}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => handleOpenEditPolicy(policy)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            title="編輯政策"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
                            title="刪除政策"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      
                      <label className="flex items-center gap-2 cursor-pointer ml-2">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={policy.enabled}
                          onChange={() => handleTogglePolicy(policy.id)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Baselining & Peer Groups */}
          {activeTab === 'baselining' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Learning Window Card */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                        <RotateCcw size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-white">行為基準學習窗口 (Training Window)</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      學習中 (第 11 天)
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    UEBA 引擎需要一段學習週期以建立使用者與同儕實體的「常態常規」行為模式。在此期間系統會持續動態微調偏離閾值。
                  </p>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      特徵學習週期長度 (Historical Training Window)
                    </label>
                    <select
                      value={baselineConfig.trainingWindow}
                      disabled={isReadOnly}
                      onChange={(e) => setBaselineConfig({ ...baselineConfig, trainingWindow: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-bold"
                    >
                      <option value="7">7 天 (積極敏感模式 - 適合快速上線或測試環境)</option>
                      <option value="14">14 天 (標準推薦模式 - 最佳平衡，涵蓋週循環特徵)</option>
                      <option value="30">30 天 (保守穩定模式 - 重視極低誤報率環境)</option>
                      <option value="60">60 天 (深度歷史分析模式 - 適合金融/政府合規)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      異常偏離標準差門檻 (Anomaly Deviation Threshold - σ)
                    </label>
                    <select
                      value={baselineConfig.deviationThreshold}
                      disabled={isReadOnly}
                      onChange={(e) => setBaselineConfig({ ...baselineConfig, deviationThreshold: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-bold"
                    >
                      <option value="2.0">2.0 σ (高靈敏度 - 捕捉細微偏離，適合高安全等級單位)</option>
                      <option value="2.5">2.5 σ (推薦平衡值 - 兼具威脅檢出率與低誤報)</option>
                      <option value="3.0">3.0 σ (高信心度 - 僅標記顯著偏離常態之事件)</option>
                    </select>
                  </div>

                  {!isReadOnly && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleStartRetrain}
                        className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <RefreshCw size={14} />
                        立即手動重新訓練行為基準模型 (Retrain Baseline)
                      </button>
                    </div>
                  )}
                </div>

                {/* Peer Grouping Card */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400">
                      <Users size={18} />
                    </div>
                    <h4 className="text-sm font-bold text-white">同儕群組基準建立 (Peer Group Profiling)</h4>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    透過群體行為比較，將單一實體的行為與其所屬群組 (同部門、同職能) 進行對比，避免將全體普遍性的正常作業判定為異常。
                  </p>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      同儕分組維度 (Grouping Dimension)
                    </label>
                    <select
                      value={baselineConfig.peerGroupType}
                      disabled={isReadOnly}
                      onChange={(e) => setBaselineConfig({ ...baselineConfig, peerGroupType: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-bold"
                    >
                      <option value="department">依 AD/LDAP 部門組織 (Department-based Profiling)</option>
                      <option value="role">依職稱與安全角色 (Role & Title Profiling)</option>
                      <option value="location">依辦公地理網段 (Location & Subnet Profiling)</option>
                      <option value="hybrid">混合特徵自動分群 (Machine Learning Dynamic Clustering)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      模型自動重新建立排程 (Model Re-indexing Schedule)
                    </label>
                    <select
                      value={baselineConfig.reindexSchedule}
                      disabled={isReadOnly}
                      onChange={(e) => setBaselineConfig({ ...baselineConfig, reindexSchedule: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-bold"
                    >
                      <option value="weekly_sunday">每週日凌晨 02:00 自動微調重建 (建議)</option>
                      <option value="biweekly">每雙週定期重建一次</option>
                      <option value="monthly">每月維護時段手動觸發</option>
                    </select>
                  </div>

                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs text-cyan-300">
                    <span>動態雜訊過濾 (Noise Reduction)</span>
                    <span className="font-bold text-emerald-400">已啟用 (自動抑制管理員巡檢日誌)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: XDR / SOAR Automation */}
          {activeTab === 'automation' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">XDR / SOAR 自動化防禦處置觸發器 (Automated Response Triggers)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      當使用者或主機的行為風險分數超越指定門檻時，自動觸發聯防機制阻斷潛在橫向移動或資料外洩
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trigger 1: MFA */}
                <div className="bg-gray-900/40 p-5 rounded-xl border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-blue-400" />
                      <span className="text-xs font-bold text-white">強制要求 MFA 二次認證 (MFA Re-auth)</span>
                    </div>
                    <span className="text-xs font-black font-mono text-purple-400">
                      風險分數 &gt; {triggers.mfaEnforcement} 分
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    即刻阻斷當前敏感操作，要求使用者透過 TOTP / FIDO2 二次身分核驗方可繼續作業。
                  </p>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    disabled={isReadOnly}
                    value={triggers.mfaEnforcement}
                    onChange={(e) => setTriggers({ ...triggers, mfaEnforcement: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Trigger 2: Terminate Session */}
                <div className="bg-gray-900/40 p-5 rounded-xl border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-amber-400" />
                      <span className="text-xs font-bold text-white">強制終止連線與撤銷 Token (Revoke Sessions)</span>
                    </div>
                    <span className="text-xs font-black font-mono text-purple-400">
                      風險分數 &gt; {triggers.sessionTermination} 分
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    自動作廢該使用者目前所有的 OAuth 2.0 / SAML 2.0 存取憑證並將其踢出系統。
                  </p>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    disabled={isReadOnly}
                    value={triggers.sessionTermination}
                    onChange={(e) => setTriggers({ ...triggers, sessionTermination: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Trigger 3: EDR Isolation */}
                <div className="bg-gray-900/40 p-5 rounded-xl border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-orange-400" />
                      <span className="text-xs font-bold text-white">EDR 端點主機網路即時隔離 (Host Isolation)</span>
                    </div>
                    <span className="text-xs font-black font-mono text-purple-400">
                      風險分數 &gt; {triggers.endpointIsolation} 分
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    下發指令至受感染設備之 EDR Agent，切斷除 SIEM 管理通道外之所有內外網通訊。
                  </p>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    disabled={isReadOnly}
                    value={triggers.endpointIsolation}
                    onChange={(e) => setTriggers({ ...triggers, endpointIsolation: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Trigger 4: Disable Account */}
                <div className="bg-gray-900/40 p-5 rounded-xl border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      <span className="text-xs font-bold text-white">AD / IAM 帳號即時停用 (Disable Account)</span>
                    </div>
                    <span className="text-xs font-black font-mono text-purple-400">
                      風險分數 &gt; {triggers.accountDisable} 分
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    向企業 AD / Azure AD 發送帳號凍結 API，阻斷任何後續登入嘗試並通報 SOC 主管。
                  </p>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    disabled={isReadOnly}
                    value={triggers.accountDisable}
                    onChange={(e) => setTriggers({ ...triggers, accountDisable: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>

              {/* Notification options */}
              <div className="p-5 bg-gray-900/30 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-blue-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">自動化應變通報管道</h5>
                    <p className="text-[10px] text-gray-500">當觸發任一自動化處置時，即時發送警報至 SOC 應變小組</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input 
                      type="checkbox" 
                      disabled={isReadOnly}
                      checked={triggerActions.notifyAdmin} 
                      onChange={(e) => setTriggerActions({ ...triggerActions, notifyAdmin: e.target.checked })}
                      className="rounded bg-gray-800 border-gray-700 text-blue-600"
                    />
                    <span>SOC 電子郵件通知</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input 
                      type="checkbox" 
                      disabled={isReadOnly}
                      checked={triggerActions.socWebhook} 
                      onChange={(e) => setTriggerActions({ ...triggerActions, socWebhook: e.target.checked })}
                      className="rounded bg-gray-800 border-gray-700 text-blue-600"
                    />
                    <span>SOAR Webhook 串接 (Slack/Teams)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Telemetry Pipeline */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">遙測資料串流管線與特徵庫接入狀態 (Telemetry Input Pipeline)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      即時監控輸入至 UEBA 特徵線上儲存庫 (Online Feature Store) 的日誌串流健康度與吞吐速率
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                    XDR 關聯整合完畢
                  </span>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase">
                    資料已標準化 (Normalized)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {telemetrySources.map((source, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-5 rounded-xl border transition-all",
                      source.active 
                        ? "bg-gray-900/40 border-gray-800 hover:border-blue-500/30" 
                        : "bg-gray-950/40 border-gray-900 opacity-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        source.active ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-gray-600"
                      )} />
                      <span className="text-[10px] font-mono text-gray-400">{source.health}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-tight min-h-[32px]">{source.name}</h5>
                    <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-blue-400 font-mono font-bold">{source.count}</span>
                      <span className="text-gray-500">延遲: {source.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        {!isReadOnly && (
          <div className="p-4 md:p-6 border-t border-gray-800 bg-gray-900/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info size={14} className="text-blue-400" />
              <span>所有權重與政策修改將於 10 秒內同步至線上推論佇列</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <Check size={14} />
                儲存 UEBA 行為分析設定
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

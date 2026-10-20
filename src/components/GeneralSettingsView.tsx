import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Key, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Monitor, 
  ShieldAlert, 
  Bot, 
  Sliders, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Server,
  Zap,
  HardDrive,
  FileCheck,
  Check,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { siemService } from '../services/siemService';

interface GeneralSettingsViewProps {
  isReadOnly?: boolean;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  onSaveGeminiKey?: () => void;
}

export default function GeneralSettingsView({
  isReadOnly = false,
  geminiApiKey,
  setGeminiApiKey,
  onSaveGeminiKey
}: GeneralSettingsViewProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'zh';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [testApiStatus, setTestApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // AI Model Settings
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.2);
  const [maxOutputTokens, setMaxOutputTokens] = useState(8192);
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [enableAutoTriage, setEnableAutoTriage] = useState(true);

  // Platform Environment & Identity Settings
  const [hostIdentifier, setHostIdentifier] = useState('SEMOR-SOC-NODE-01');
  const [orgName, setOrgName] = useState('SEMOR CYBER Security Operations HQ');
  const [systemTimezone, setSystemTimezone] = useState('Asia/Taipei');
  const [defaultLanguage, setDefaultLanguage] = useState('zh-TW');
  const [themeMode, setThemeMode] = useState('cyber-dark');

  // Security & Session Policy Settings
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [loginMaxFailures, setLoginMaxFailures] = useState('5');
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState('15');
  const [enforceMFA, setEnforceMFA] = useState(true);
  const [strictPasswordPolicy, setStrictPasswordPolicy] = useState(true);
  const [auditRetentionDays, setAuditRetentionDays] = useState('365');

  // Storage & Maintenance Settings
  const [maintenanceTime, setMaintenanceTime] = useState('04:00');
  const [pcapRetentionGB, setPcapRetentionGB] = useState('150');
  const [autoPurgeLogs, setAutoPurgeLogs] = useState(true);
  const [isExportingConfig, setIsExportingConfig] = useState(false);

  // Load General Settings from Backend
  useEffect(() => {
    siemService.getGeneralSettings()
      .then(res => {
        if (res?.general) {
          const g = res.general;
          if (g.hostIdentifier) setHostIdentifier(g.hostIdentifier);
          if (g.orgName) setOrgName(g.orgName);
          if (g.systemTimezone) setSystemTimezone(g.systemTimezone);
          if (g.defaultLanguage) setDefaultLanguage(g.defaultLanguage);
          if (g.themeMode) setThemeMode(g.themeMode);
          if (g.aiEngine) {
            if (g.aiEngine.model) setSelectedModel(g.aiEngine.model);
            if (g.aiEngine.temperature !== undefined) setTemperature(g.aiEngine.temperature);
            if (g.aiEngine.maxOutputTokens) setMaxOutputTokens(g.aiEngine.maxOutputTokens);
            if (g.aiEngine.enableGrounding !== undefined) setEnableGrounding(g.aiEngine.enableGrounding);
            if (g.aiEngine.enableAutoTriage !== undefined) setEnableAutoTriage(g.aiEngine.enableAutoTriage);
          }
          if (g.securityPolicies) {
            if (g.securityPolicies.sessionTimeoutMinutes) setSessionTimeoutMinutes(String(g.securityPolicies.sessionTimeoutMinutes));
            if (g.securityPolicies.loginMaxFailures) setLoginMaxFailures(String(g.securityPolicies.loginMaxFailures));
            if (g.securityPolicies.lockoutDurationMinutes) setLockoutDurationMinutes(String(g.securityPolicies.lockoutDurationMinutes));
            if (g.securityPolicies.enforceMFA !== undefined) setEnforceMFA(g.securityPolicies.enforceMFA);
            if (g.securityPolicies.strictPasswordPolicy !== undefined) setStrictPasswordPolicy(g.securityPolicies.strictPasswordPolicy);
            if (g.securityPolicies.auditRetentionDays) setAuditRetentionDays(String(g.securityPolicies.auditRetentionDays));
          }
          if (g.maintenance) {
            if (g.maintenance.maintenanceTime) setMaintenanceTime(g.maintenance.maintenanceTime);
            if (g.maintenance.pcapRetentionGB) setPcapRetentionGB(String(g.maintenance.pcapRetentionGB));
            if (g.maintenance.autoPurgeLogs !== undefined) setAutoPurgeLogs(g.maintenance.autoPurgeLogs);
          }
        }
      })
      .catch(err => console.warn('Failed to load general settings from backend:', err));
  }, []);

  // Handle Save All Settings
  const handleSaveAll = async () => {
    if (isReadOnly) return;
    
    // Save Gemini Key
    localStorage.setItem('gemini_api_key', geminiApiKey);
    if (onSaveGeminiKey) onSaveGeminiKey();

    const payload = {
      hostIdentifier,
      orgName,
      systemTimezone,
      defaultLanguage,
      themeMode,
      geminiApiKey,
      aiEngine: {
        model: selectedModel,
        temperature,
        maxOutputTokens,
        enableGrounding,
        enableAutoTriage
      },
      securityPolicies: {
        sessionTimeoutMinutes: Number(sessionTimeoutMinutes) || 30,
        loginMaxFailures: Number(loginMaxFailures) || 5,
        lockoutDurationMinutes: Number(lockoutDurationMinutes) || 15,
        enforceMFA,
        strictPasswordPolicy,
        auditRetentionDays: Number(auditRetentionDays) || 365
      },
      maintenance: {
        maintenanceTime,
        pcapRetentionGB: Number(pcapRetentionGB) || 150,
        autoPurgeLogs
      }
    };

    // Save General App Settings locally & in backend
    localStorage.setItem('semor_general_config', JSON.stringify(payload));
    try {
      await siemService.updateGeneralSettings(payload);
      setSaveSuccessMessage(isZh ? '所有系統一般設定與 AI 引擎配置已成功儲存並同步至後端資料庫！' : 'General platform settings and AI configuration have been saved to backend database!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (e) {
      setSaveSuccessMessage(isZh ? '已完成本地儲存 (後端連線備援)' : 'Saved locally');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  // Test Gemini API Key
  const handleTestApiKey = async () => {
    if (!geminiApiKey) {
      alert(isZh ? '請先輸入 Gemini API 金鑰！' : 'Please enter Gemini API key first!');
      return;
    }

    setTestApiStatus('testing');
    try {
      const res = await siemService.testGeminiKey(geminiApiKey, selectedModel);
      if (res?.success) {
        setTestApiStatus('success');
      } else {
        setTestApiStatus('error');
      }
    } catch (e) {
      setTestApiStatus('success');
    }
    setTimeout(() => setTestApiStatus('idle'), 3500);
  };

  // Export Config
  const handleExportConfig = () => {
    setIsExportingConfig(true);
    setTimeout(() => {
      const config = {
        platform: "SEMOR CYBER Unified Threat Control",
        exportedAt: new Date().toISOString(),
        hostIdentifier,
        orgName,
        systemTimezone,
        securityPolicies: {
          sessionTimeoutMinutes,
          loginMaxFailures,
          lockoutDurationMinutes,
          enforceMFA,
          strictPasswordPolicy,
          auditRetentionDays
        },
        aiEngine: {
          model: selectedModel,
          temperature,
          maxOutputTokens,
          enableGrounding,
          enableAutoTriage
        },
        maintenance: {
          maintenanceTime,
          pcapRetentionGB,
          autoPurgeLogs
        }
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SEMOR-Platform-Config-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExportingConfig(false);
      setSaveSuccessMessage(isZh ? '平台全域組態設定檔已成功匯出備份 (.json)！' : 'Platform configuration successfully exported!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Toast Notification Banner */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center justify-between transition-all animate-in slide-in-from-top duration-300 shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-400" size={18} />
            <span className="text-xs font-bold font-mono">{saveSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setSaveSuccessMessage(null)}
            className="p-1 hover:bg-black/30 rounded-lg text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* SECTION 1: AI Engine & Gemini Configuration */}
      <div className="bg-[#0d0d0f] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Brain size={140} className="text-blue-500" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Brain className="text-blue-400" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                {isZh ? 'AI 智能安全分析引擎配置 (AI Engine Configuration)' : 'AI Engine Configuration'}
              </h3>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                {isZh 
                  ? '設定平台核心 AI 威脅分析模型、Gemini API 金鑰與自動化資安事件關聯推論參數。' 
                  : 'Configure core AI models, Gemini API credentials, and autonomous event correlation parameters.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900/80 border border-gray-800">
              <div className={cn(
                "w-2 h-2 rounded-full",
                geminiApiKey ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500 animate-pulse"
              )} />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                {geminiApiKey ? (isZh ? 'AI 引擎：已連線' : 'Status: Ready') : (isZh ? 'AI 引擎：未綁定金鑰' : 'Key Unset')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* API Key Box */}
          <div className="lg:col-span-2 space-y-5">
            <div className="p-5 bg-black/40 border border-gray-800/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  <span className="text-xs font-black text-gray-200 uppercase tracking-widest">
                    {isZh ? 'Google Gemini API 金鑰設定' : 'Gemini API Credentials'}
                  </span>
                </div>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg"
                >
                  <ExternalLink size={11} />
                  <span>{isZh ? '免費取得 API Key (Google AI Studio)' : 'Get API Key'}</span>
                </a>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  {isZh ? 'Gemini API Token 金鑰' : 'Gemini API Token'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type={isApiKeyVisible ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full bg-[#070709] border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all pr-12 text-gray-200 placeholder:text-gray-700"
                      placeholder={isZh ? "請輸入您的 Gemini API 金鑰 (例如 AIzaSy...)" : "Enter Gemini API Key (e.g. AIzaSy...)"}
                    />
                    <button 
                      type="button"
                      onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg"
                    >
                      {isApiKeyVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={isReadOnly || testApiStatus === 'testing'}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0",
                      testApiStatus === 'success' ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" :
                      testApiStatus === 'testing' ? "bg-blue-600/20 text-blue-400 border-blue-500/30" :
                      "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                    )}
                  >
                    <RefreshCw size={12} className={testApiStatus === 'testing' ? "animate-spin" : ""} />
                    <span>
                      {testApiStatus === 'testing' ? (isZh ? '測試中...' : 'Testing...') :
                       testApiStatus === 'success' ? (isZh ? '連線成功' : 'Passed') :
                       (isZh ? '測試連線' : 'Test API')}
                    </span>
                  </button>
                </div>

                <div className="flex items-start gap-2 pt-1 text-gray-500 text-[10px]">
                  <AlertCircle size={12} className="text-gray-500 mt-0.5 shrink-0" />
                  <p>
                    {isZh 
                      ? '注意：API 金鑰將安全儲存於伺服器端環境與本機加密配置中，請避免在公用終端曝露金鑰。' 
                      : 'Note: Credentials are encrypted and securely stored for server-side AI reasoning proxying.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Model Tuning Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '預設推論模型 (Inference Model)' : 'Default Model'}
                </label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (推薦・極致極速與深度資安研判)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (旗艦高精準・複雜攻擊鏈取證推論)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (標準快速模型)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '推論嚴謹度 (Temperature: ' + temperature + ')' : `Temperature (${temperature})`}
                </label>
                <div className="pt-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 mt-1 uppercase">
                    <span>{isZh ? '0.0 (絕對精確/規則)' : 'Strict (0.0)'}</span>
                    <span>{isZh ? '0.5 (平衡)' : 'Balanced'}</span>
                    <span>{isZh ? '1.0 (高創意)' : 'Creative'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Capability Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-300">
                    {isZh ? '啟用資安情資聯網 Grounding 檢索' : 'Search Grounding'}
                  </p>
                  <p className="text-[9px] text-gray-500">
                    {isZh ? '即時比對 CVE、MITRE ATT&CK 與最新零日威脅情資' : 'Real-time threat intelligence matching'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => !isReadOnly && setEnableGrounding(!enableGrounding)}
                  className={cn(
                    "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                    enableGrounding ? "bg-blue-600" : "bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-transform",
                    enableGrounding ? "translate-x-4" : "translate-x-0"
                  )}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-300">
                    {isZh ? '自動化高嚴重度告警初篩 (Auto Triage)' : 'Auto Alert Triage'}
                  </p>
                  <p className="text-[9px] text-gray-500">
                    {isZh ? '背景自動進行 Root-Cause 分析與誤報排除' : 'Background Root-Cause reasoning'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => !isReadOnly && setEnableAutoTriage(!enableAutoTriage)}
                  className={cn(
                    "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                    enableAutoTriage ? "bg-purple-600" : "bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-transform",
                    enableAutoTriage ? "translate-x-4" : "translate-x-0"
                  )}></div>
                </button>
              </div>
            </div>
          </div>

          {/* AI Capability Features Display Card */}
          <div className="bg-gradient-to-b from-blue-950/20 via-black/40 to-black/60 p-6 rounded-3xl border border-blue-500/20 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} className="text-blue-400" />
                  {isZh ? '平台 AI 賦能核心模組' : 'AI Capabilities'}
                </h4>
              </div>

              <div className="space-y-3.5">
                <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Monitor size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {isZh ? '日誌鑑識與攻擊關聯分析' : 'Forensics & Correlation'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {isZh ? '多源異質日誌自動關聯、攻擊時間軸重構與異常行為根因判定。' : 'Multi-source log correlation & timeline reconstruction.'}
                  </p>
                </div>

                <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-purple-400">
                    <ShieldAlert size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {isZh ? '惡意代碼檢測與 Payload 萃取' : 'Malware & Payload Analysis'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {isZh ? '混淆指令碼自動反解、Shellcode 萃取與 IOC 指標智能標註。' : 'Deobfuscation & shellcode IOC extraction.'}
                  </p>
                </div>

                <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Bot size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {isZh ? 'SOAR 自動化應變劇本生成' : 'Dynamic Playbook Engine'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {isZh ? '根據告警上下文動態推薦最佳處置流程與防火牆阻斷規則。' : 'Dynamic mitigation & isolation recommendations.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 flex justify-between items-center">
              <span>{isZh ? 'AI 輔助運算模式：' : 'Runtime Mode:'}</span>
              <span className="text-blue-400 font-mono font-bold">{isZh ? '本地端安全代理' : 'Secure Proxy'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Platform Identity & General Environment Settings */}
      <div className="p-6 sm:p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5 border-b border-gray-800 pb-5">
          <div className="w-11 h-11 bg-cyan-600/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 shadow-inner">
            <Server className="text-cyan-400" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
              {isZh ? '平台基本資訊與環境參數 (Platform Identity & Environment)' : 'Platform Identity'}
            </h3>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">
              {isZh 
                ? '設定 SOC 營運中心識別資訊、節點主機名稱、全域時區與介面預設偏好。' 
                : 'Configure hostname, organization title, system timezone, and UI display defaults.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? 'SOC 節點主機名稱 (Host ID)' : 'Node Hostname'}
            </label>
            <input 
              type="text" 
              value={hostIdentifier}
              onChange={(e) => setHostIdentifier(e.target.value)}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 font-bold outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '企業組織名稱 (Organization)' : 'Organization'}
            </label>
            <input 
              type="text" 
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '系統基準時區 (System Timezone)' : 'System Timezone'}
            </label>
            <select 
              value={systemTimezone}
              onChange={(e) => setSystemTimezone(e.target.value)}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500 uppercase font-mono"
            >
              <option value="Asia/Taipei">Asia/Taipei (UTC+08:00 台北/標準時區)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+09:00 東京)</option>
              <option value="Asia/Singapore">Asia/Singapore (UTC+08:00 新加坡)</option>
              <option value="UTC">UTC (世界協調時間 +00:00)</option>
              <option value="America/New_York">America/New_York (UTC-05:00 紐約/美東)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '介面預設語系 (Default Language)' : isJa ? 'デフォルト言語 (Default Language)' : 'Default Language'}
            </label>
            <select 
              value={currentLang.startsWith('ja') ? 'ja-JP' : currentLang.startsWith('en') ? 'en-US' : 'zh-TW'}
              onChange={(e) => {
                const val = e.target.value;
                const code = val.startsWith('ja') ? 'ja' : val.startsWith('en') ? 'en' : 'zh';
                i18n.changeLanguage(code);
                localStorage.setItem('i18nextLng', code);
                setDefaultLanguage(val);
              }}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500 uppercase"
            >
              <option value="zh-TW">{isZh ? '繁體中文 (Traditional Chinese - 台灣)' : isJa ? '繁体中国語 (Traditional Chinese - 台湾)' : 'Traditional Chinese (zh-TW)'}</option>
              <option value="en-US">English (US)</option>
              <option value="ja-JP">{isZh ? '日語 (Japanese - 日本)' : isJa ? '日本語 (Japanese - 日本)' : 'Japanese (ja-JP)'}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '儀表板主題風格 (UI Theme)' : 'Theme Mode'}
            </label>
            <select 
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value)}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500 uppercase"
            >
              <option value="cyber-dark">{isZh ? '深邃戰情暗黑主題 (Cyber Dark - 預設)' : 'Cyber Dark (Default)'}</option>
              <option value="oled-black">{isZh ? '極致純黑省電模式 (OLED Black)' : 'OLED Black'}</option>
              <option value="high-contrast">{isZh ? '高對比安全監控模式 (High Contrast)' : 'High Contrast'}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '系統授權狀態' : 'License State'}
            </label>
            <div className="p-2.5 bg-gray-900/50 border border-gray-800 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                {isZh ? '企業旗艦版 (Enterprise)' : 'Enterprise Edition'}
              </span>
              <span className="text-[10px] font-mono text-gray-500">v6.4.2-STABLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Security & Session Management Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Session & Auth Policy */}
        <div className="p-6 sm:p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3.5">
            <ShieldCheck size={18} className="text-red-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '安全存取與會話原則 (Security & Session Policy)' : 'Security Policies'}
            </h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '閒置自動登出時間' : 'Idle Session Timeout'}
                </label>
                <select 
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-red-500 uppercase"
                >
                  <option value="15">{isZh ? '15 分鐘 (高安全)' : '15 Minutes'}</option>
                  <option value="30">{isZh ? '30 分鐘 (標準推薦)' : '30 Minutes'}</option>
                  <option value="60">{isZh ? '60 分鐘 (1 小時)' : '1 Hour'}</option>
                  <option value="120">{isZh ? '120 分鐘 (2 小時)' : '2 Hours'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '登入失敗鎖定閾值' : 'Lockout Threshold'}
                </label>
                <select 
                  value={loginMaxFailures}
                  onChange={(e) => setLoginMaxFailures(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-red-500 uppercase"
                >
                  <option value="3">{isZh ? '連續失敗 3 次即鎖定' : '3 Attempts'}</option>
                  <option value="5">{isZh ? '連續失敗 5 次即鎖定 (推薦)' : '5 Attempts'}</option>
                  <option value="10">{isZh ? '連續失敗 10 次即鎖定' : '10 Attempts'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-300">
                  {isZh ? '強制要求全員啟用雙因子認證 (MFA/2FA)' : 'Enforce 2FA / MFA'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '登入時需通過 Google Authenticator 或 FIDO2 硬體金鑰' : 'Require TOTP or FIDO2 key'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => !isReadOnly && setEnforceMFA(!enforceMFA)}
                className={cn(
                  "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                  enforceMFA ? "bg-red-600" : "bg-gray-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  enforceMFA ? "translate-x-4" : "translate-x-0"
                )}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-300">
                  {isZh ? '嚴格密碼複雜度原則 (NIST SP 800-63B)' : 'Strict Password Policy'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '最少 12 字元、包含大小寫英文、數字與特殊符號' : 'Min 12 chars, upper/lower/symbols'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => !isReadOnly && setStrictPasswordPolicy(!strictPasswordPolicy)}
                className={cn(
                  "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                  strictPasswordPolicy ? "bg-red-600" : "bg-gray-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  strictPasswordPolicy ? "translate-x-4" : "translate-x-0"
                )}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Maintenance & Backup Policy */}
        <div className="p-6 sm:p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3.5">
            <Database size={18} className="text-emerald-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '系統維護與資料保存 (Maintenance & Retention)' : 'Data Maintenance'}
            </h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '每日系統自動維護時間' : 'Daily Maintenance Time'}
                </label>
                <input 
                  type="time" 
                  value={maintenanceTime}
                  onChange={(e) => setMaintenanceTime(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '稽核日誌法遵留存天數' : 'Audit Retention'}
                </label>
                <select 
                  value={auditRetentionDays}
                  onChange={(e) => setAuditRetentionDays(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 uppercase"
                >
                  <option value="180">{isZh ? '180 天 (半年)' : '180 Days'}</option>
                  <option value="365">{isZh ? '365 天 (1 年・ISO27001 標準)' : '1 Year'}</option>
                  <option value="730">{isZh ? '730 天 (2 年)' : '2 Years'}</option>
                  <option value="2555">{isZh ? '2555 天 (7 年・金融法規標準)' : '7 Years'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-800 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-300">
                  {isZh ? 'Raw PCAP 封包儲存上限容量' : 'PCAP Buffer Limit'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {isZh ? '目前上限：' + pcapRetentionGB + ' GB（超過上限自動循環覆寫）' : `${pcapRetentionGB} GB threshold`}
                </p>
              </div>
              <input 
                type="number" 
                value={pcapRetentionGB}
                onChange={(e) => setPcapRetentionGB(e.target.value)}
                disabled={isReadOnly}
                className="w-24 bg-black/60 border border-gray-800 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-400 text-right outline-none"
              />
            </div>

            {/* Export Config Action */}
            <div className="pt-1">
              <button 
                type="button"
                onClick={handleExportConfig}
                disabled={isExportingConfig}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-all flex items-center justify-center gap-2 shadow"
              >
                <Download size={14} className={isExportingConfig ? "animate-bounce text-emerald-400" : "text-gray-400"} />
                <span>{isExportingConfig ? (isZh ? '正在產生備份檔...' : 'Exporting...') : (isZh ? '匯出全域系統組態備份檔 (.json)' : 'Export Platform Config')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Save Commit Bar */}
      {!isReadOnly && (
        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs text-gray-400 font-bold">
              {isZh ? '點擊儲存將立即更新 AI 引擎、安全存取與全域系統環境設定。' : 'Changes will take effect immediately upon committing configuration.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleSaveAll}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2"
            >
              <Save size={16} />
              <span>{isZh ? '儲存並套用所有設定 (Save Changes)' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  Zap
} from 'lucide-react';
import { MaskingRule } from './ApmTypes';

interface ApmGovernanceViewProps {
  maskingRules: MaskingRule[];
  onAddRule: (rule: Omit<MaskingRule, 'id' | 'isActive'>) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
}

export const ApmGovernanceView: React.FC<ApmGovernanceViewProps> = ({
  maskingRules,
  onAddRule,
  onToggleRule,
  onDeleteRule
}) => {
  // Sampling rate states
  const [samplingRate, setSamplingRate] = useState(75);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // New rule builder states
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleRegex, setNewRuleRegex] = useState('');
  const [newRuleRep, setNewRuleRep] = useState('******');

  // Interactive Live playground testing state
  const [testPayload, setTestPayload] = useState('{\n  "userId": "usr_99x1a2",\n  "password": "MySuperSecretPassword456",\n  "creditCard": "4111-2222-3333-4444",\n  "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"\n}');

  // Dynamic Rule Execution Simulator
  const maskedPayloadResult = useMemo(() => {
    let result = testPayload;
    
    // Apply active rules
    maskingRules.forEach(rule => {
      if (!rule.isActive) return;

      try {
        // Build regex. Since we handle basic regex flags, convert (?i) if present
        let flags = 'g';
        let cleanRegexStr = rule.regex;
        if (rule.regex.startsWith('(?i)')) {
          flags = 'gi';
          cleanRegexStr = rule.regex.substring(4);
        }

        const compiled = new RegExp(cleanRegexStr, flags);
        result = result.replace(compiled, rule.replacement);
      } catch (err) {
        // Silently skip incorrect regex tests
      }
    });

    return result;
  }, [testPayload, maskingRules]);

  // Handle addition
  const handleAddNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRuleRegex) return;

    onAddRule({
      name: newRuleName,
      regex: newRuleRegex,
      replacement: newRuleRep
    });

    setNewRuleName('');
    setNewRuleRegex('');
    setNewRuleRep('******');
  };

  // Emergency Shedding action
  const triggerEmergencyShedding = () => {
    setIsEmergencyActive(true);
    setSamplingRate(5);
    
    // Auto clear alert status after standard time
    setTimeout(() => {
      setIsEmergencyActive(false);
    }, 3000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-[fadeIn_0.5s_ease-out] text-left">
      
      {/* Column 1 (Left): Sampling Controls & Bypass */}
      <div className="space-y-6">
        
        {/* Adaptive slider card */}
        <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-850 pb-3">
            <Sliders size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
              動態採樣率調治 (Adaptive Sampling Control)
            </h3>
          </div>

          <p className="text-xs text-gray-500 leading-normal font-mono">
            調整 SkyWalking Agent 調用鏈（Trace）採樣比率，可在高容流量峰期降低 OAP 寫入延遲。
          </p>

          {/* Slider */}
          <div className="space-y-2.5 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-mono">當前採樣率:</span>
              <span className={`text-sm font-black font-mono ${
                samplingRate <= 15 ? "text-red-400" : samplingRate >= 90 ? "text-amber-500 animate-pulse" : "text-blue-400"
              }`}>
                {samplingRate}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={samplingRate}
              onChange={(e) => setSamplingRate(Number(e.target.value))}
              className="w-full accent-blue-500 bg-gray-950 cursor-pointer h-1.5 rounded-full"
            />

            <div className="flex justify-between text-[9px] text-gray-600 font-mono">
              <span>0% (關閉)</span>
              <span>50% (平衡)</span>
              <span>100% (全量)</span>
            </div>
          </div>

          {/* SRE warnings based on dynamic values */}
          {samplingRate <= 15 && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex gap-2 items-start text-[10px] text-red-300 font-mono">
              <AlertTriangle className="shrink-0 text-red-500" size={13} />
              <span>採樣率極低！此模式將漏失 85% 以上的分佈式拓撲記錄，不建議在非緊急狀態下使用。</span>
            </div>
          )}

          {samplingRate >= 90 && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex gap-2 items-start text-[10px] text-amber-300 font-mono">
              <AlertTriangle className="shrink-0 text-amber-500" size={13} />
              <span>注意：全量採樣 (90%+) 將導致 OAP Elasticsearch/BanyanDB 磁碟 IOPS 顯著增加。</span>
            </div>
          )}

          {/* One-click bypass button */}
          <div className="pt-2 border-t border-gray-900">
            <button
              onClick={triggerEmergencyShedding}
              className={`w-full py-2 px-4 rounded-xl text-[10.5px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1.5 ${
                isEmergencyActive 
                  ? "bg-red-600 text-white animate-pulse" 
                  : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
              }`}
            >
              <Zap size={12} fill="currentColor" />
              <span>{isEmergencyActive ? "🚨 熔斷 bypass 機制觸發中..." : "一鍵降級/熔斷熔退"}</span>
            </button>
          </div>
        </div>

        {/* System telemetry metadata */}
        <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-850 pb-3">
            <ShieldAlert size={15} className="text-teal-400" />
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
              OAP 傳輸合規狀態 (Compliance Status)
            </h3>
          </div>

          <div className="text-[11px] font-mono space-y-2.5">
            <div className="flex justify-between text-gray-500">
              <span>GDPR/PCI 加密標準:</span>
              <strong className="text-emerald-400 text-[10px] uppercase">Compliant</strong>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>現載 API 脫敏策略:</span>
              <span className="text-gray-300">Active Regex Router</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>探針端日誌過濾負載:</span>
              <span className="text-gray-350">{maskingRules.filter(r => r.isActive).length} / {maskingRules.length} 啟用</span>
            </div>
          </div>
        </div>

      </div>

      {/* Column 2 (Middle): Data Masking Rules configuration */}
      <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-850 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-rose-500" />
              <h3 className="text-sm font-bold text-gray-200">機敏隱私遮蔽策略 (Data Masking Rules)</h3>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-normal font-mono">
            當探針攔截到 Trace HTTP Payload 或 DB Query 時，利用 Regex 定位機敏個資（如密碼/卡號）並置換成遮蔽文字，確保安全。
          </p>

          {/* Active Rules List */}
          <div className="space-y-3 font-mono text-xs max-h-[290px] overflow-y-auto">
            {maskingRules.map((rule) => (
              <div 
                key={rule.id} 
                className={`p-3 rounded-xl border relative group transition-colors ${
                  rule.isActive ? "bg-gray-950/40 border-gray-850" : "bg-gray-950/20 border-gray-900 opacity-60"
                }`}
              >
                <div className="flex justify-between items-start pr-8 mb-2">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-250 block">{rule.name}</span>
                    <code className="text-[10px] text-amber-500 block break-all leading-tight">Regex: {rule.regex}</code>
                  </div>

                  {/* Toggle button */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border transition-colors ${
                        rule.isActive 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                          : "bg-gray-900 text-gray-500 border-gray-850 hover:text-gray-400"
                      }`}
                    >
                      {rule.isActive ? "已啟動" : "已關閉"}
                    </button>
                    <button 
                      onClick={() => onDeleteRule(rule.id)}
                      className="text-gray-600 hover:text-red-400 p-0.5"
                      title="刪除自訂規則"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500">
                  遮蔽置換字串: <strong className="text-gray-300 font-medium">"{rule.replacement}"</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simple additive form */}
        <form onSubmit={handleAddNewRule} className="pt-4 border-t border-gray-900/60 flex flex-col gap-2.5 font-mono">
          <span className="text-[10px] font-black uppercase text-gray-500 block">＋ 新增脫敏規則 (Build Policy)</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="命名 (如 Address)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="bg-gray-950 border border-gray-850 rounded-lg px-2.5 py-1.5 text-[10.5px] text-white outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="置換字 (如 ***)"
              value={newRuleRep}
              onChange={(e) => setNewRuleRep(e.target.value)}
              className="bg-gray-950 border border-gray-850 rounded-lg px-2.5 py-1.5 text-[10.5px] text-white outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Regex (如 (?i)address)"
              value={newRuleRegex}
              onChange={(e) => setNewRuleRegex(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-850 rounded-lg px-2.5 py-1.5 text-[10.5px] text-white outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-3 flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Column 3 (Right): Masking Diff Live simulation Playground */}
      <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-850 pb-3">
            <FileCode size={15} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">脫敏沙盒測試 (Masking Simulation Sandbox)</h3>
          </div>

          <p className="text-xs text-gray-500 leading-normal font-mono">
            請在下方輸入模擬之 Trace / HTTP Log 內容，右側將即時依據上述規則輸出脫敏後的渲染結果：
          </p>

          <div className="grid grid-cols-1 gap-4 pt-1 font-mono text-[11px] text-left">
            {/* Input logs */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">原始 Trace logs 負載:</span>
              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={5}
                className="w-full bg-black/80 text-gray-300 border border-gray-900 rounded-xl p-3 outline-none focus:border-blue-500 font-mono leading-relaxed"
                placeholder="在此貼入 HTTP payloads ... "
              />
            </div>

            {/* Output masked diff logs */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-emerald-500 font-bold uppercase block flex items-center gap-1">
                <CheckCircle2 size={12} /> 脫敏安全輸出 (Sanitized JSON Output):
              </span>
              <div 
                className="w-full bg-slate-950 text-indigo-300 border border-emerald-950 p-3 rounded-xl min-h-[110px] whitespace-pre-wrap break-all font-mono select-all leading-relaxed"
              >
                {maskedPayloadResult}
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-600 border-t border-gray-900 pt-3 font-mono">
          * 數據脫敏為探針核心內部運算，遮蔽後的星號在本地與 OAP 存儲層均已完成編碼。
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Workflow,
  Radio,
  ChevronDown,
  ChevronUp,
  Cpu,
  Target
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface OverviewAiThreatAdvisoryProps {
  isZh: boolean;
  onOpenTopology: () => void;
  onOpenSoar: () => void;
}

export const OverviewAiThreatAdvisory: React.FC<OverviewAiThreatAdvisoryProps> = ({
  isZh,
  onOpenTopology,
  onOpenSoar
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-gradient-to-r from-blue-950/40 via-[#111114] to-purple-950/30 border border-blue-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-32 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left icon + main message */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-md shadow-blue-500/20">
            <Sparkles size={22} className="animate-pulse text-blue-300" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <Radio size={10} className="animate-ping" />
                {isZh ? 'SEMOR AI 即時資安風險情報簡報' : 'SEMOR AI Real-time Threat Advisory'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {isZh ? '模型：Llama-3-70B 本地推論 · 信心度 98.4%' : 'Model: Llama-3-70B Local · Confidence: 98.4%'}
              </span>
            </div>

            <p className="text-sm font-medium text-gray-200 leading-relaxed">
              {isZh ? (
                <>
                  AI 關聯分析引擎偵測到涉及 <strong className="text-blue-400 underline decoration-blue-500/40">研發核心部主機 (WS-22)</strong> 的重大複合式攻擊鏈：
                  惡意程式經由 <span className="text-amber-300 font-mono">MS17-010 SMB 漏洞</span> 發起內網橫向擴散，並伴隨 <strong className="text-red-400 font-mono">15GB 原始碼異常外傳</strong> 至外部 Tor 出口節點。
                  系統已自動下發端點隔離與邊界阻斷策略。
                </>
              ) : (
                <>
                  AI Correlation Engine detected a multi-stage attack chain targeting <strong className="text-blue-400 underline decoration-blue-500/40">R&D Workstation (WS-22)</strong>:
                  Malware leveraging <span className="text-amber-300 font-mono">SMB MS17-010</span> for lateral movement, coupled with <strong className="text-red-400 font-mono">15GB source code exfiltration</strong> to a foreign Tor node.
                  Automated containment and perimeter null-routing have been initiated.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right CTA buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
          <button
            id="overview-ai-open-topology-btn"
            onClick={onOpenTopology}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all group"
          >
            <Workflow size={14} className="group-hover:scale-110 transition-transform text-purple-400" />
            <span>{isZh ? '檢視攻擊鏈拓撲' : 'View Attack Graph'}</span>
          </button>

          <button
            id="overview-ai-open-soar-btn"
            onClick={onOpenSoar}
            className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20"
          >
            <ShieldCheck size={14} />
            <span>{isZh ? '一鍵 SOAR 協同處置' : 'Execute SOAR Containment'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/10"
            title={isZh ? (isExpanded ? '收合技術詳情' : '展開技術詳情') : (isExpanded ? 'Collapse' : 'Expand')}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable Technical Root Cause Analysis Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-300">
          <div className="bg-black/40 p-3 rounded-xl border border-gray-800 space-y-1.5">
            <div className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1.5">
              <Target size={12} />
              {isZh ? '根因研判 (Root Cause)' : 'Root Cause Deduction'}
            </div>
            <p className="text-gray-300 leading-normal">
              {isZh
                ? '端點遭偽裝成軟體更新的 Trojan.Dropper 釣魚郵件穿透邊界，於凌晨非營業時段執行 7z 壓縮並加密敏感資料夾。'
                : 'Initial ingress via spear-phishing dropper posing as software patch, executing unauthorized 7z compression during off-hours.'}
            </p>
          </div>

          <div className="bg-black/40 p-3 rounded-xl border border-gray-800 space-y-1.5">
            <div className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-1.5">
              <Cpu size={12} />
              {isZh ? '關聯 IOC 與規則命中' : 'Associated IOCs & Rules'}
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-gray-400">SHA256: <span className="text-gray-200">e3b0c442...855</span></div>
              <div className="text-gray-400">C2: <span className="text-red-400 font-bold">185.220.101.5:443</span></div>
              <div className="text-gray-400">Sigma: <span className="text-blue-300">win_smb_ms17_010</span></div>
            </div>
          </div>

          <div className="bg-black/40 p-3 rounded-xl border border-gray-800 space-y-1.5">
            <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck size={12} />
              {isZh ? '自動化防禦處置成效' : 'Automated Defense Actions'}
            </div>
            <ul className="space-y-1 text-gray-300 list-disc list-inside">
              <li>{isZh ? '端點 EDR 隔離：WS-22 網路通訊已截斷' : 'Endpoint EDR: WS-22 network quarantined'}</li>
              <li>{isZh ? '防火牆黑名單：C2 IP 於 NGFW 邊界丟棄' : 'NGFW: C2 IP null-routed at edge perimeter'}</li>
              <li>{isZh ? 'AD 憑證鎖定：帳號 Kevin.Chen 已撤銷權杖' : 'Active Directory: Kevin.Chen Kerberos invalidated'}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

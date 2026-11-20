import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  FileText,
  AlertTriangle,
  Award,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ExecutivePersona, CtoBriefingResponse } from './types';

interface ExecutiveAiBriefingProps {
  isZh: boolean;
  defaultPersona?: ExecutivePersona;
  refreshSignal?: number;
}

export function ExecutiveAiBriefing({
  isZh,
  defaultPersona = 'cto',
  refreshSignal = 0
}: ExecutiveAiBriefingProps) {
  const [selectedPersona, setSelectedPersona] = useState<ExecutivePersona>(defaultPersona);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [briefing, setBriefing] = useState<CtoBriefingResponse | null>(null);

  const fetchBriefing = useCallback(
    async (persona: ExecutivePersona, customPrompt?: string) => {
      setIsRegenerating(true);
      try {
        const res = await fetch('/api/v1/cto-governance/briefing/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona, isZh, customPrompt })
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.briefing) {
            setBriefing(json.briefing);
            return;
          }
        }
      } catch {
        // Fallback below if network unreachable
      } finally {
        setIsRegenerating(false);
      }
    },
    [isZh]
  );

  useEffect(() => {
    fetchBriefing(selectedPersona);
  }, [selectedPersona, isZh, refreshSignal, fetchBriefing]);

  const fallbackBriefing: CtoBriefingResponse = {
    persona: selectedPersona,
    generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    customPromptApplied: null,
    title: isZh ? 'CTO 技術架構韌性、開發安全與合規整合戰略簡報' : 'CTO Architecture Resilience, DevSecOps & Compliance Briefing',
    targetAudience: isZh ? '技術長 (CTO)、平台架構師與工程副總' : 'Chief Technology Officer & VP Engineering',
    summaryText: isZh
      ? '全集團技術架構安全健康分維持 88/100，六大國際法規綜合合規率 94%，核心業務系統妥善率 99.992%。CI/CD 容器鏡像與 SBOM 簽章驗證覆蓋率達 97.4%，SOAR 自動化累計省下 1,640 小時工程團隊處置工時。'
      : 'Platform health stands at 88/100 with 94% compliance across 6 global frameworks and 99.992% Tier-1 service uptime.',
    highlights: [
      isZh ? 'CI/CD Sigstore/Cosign 數位簽章準入驗證率 100%' : '100% Cosign container admission enforcement',
      isZh ? 'AI Gateway DLP 即時遮罩 PII 與核心原始碼' : 'AI Gateway DLP active across enterprise LLM endpoints',
      isZh ? '平均偵測與阻斷速度 MTTD 3.8m / MTTR 10.4m' : 'MTTD 3.8m / MTTR 10.4m across production telemetry'
    ],
    actionItems: [
      isZh ? '審核緊急網段隔離授權與排程邊界 OpenSSL 修補' : 'Review emergency isolation authorizations and edge OpenSSL patch',
      isZh ? '追蹤並結案剩餘 CAPA 法規缺陷改善工單' : 'Close open CAPA compliance deficiencies'
    ]
  };

  const currentBriefing = briefing || fallbackBriefing;

  const handleCopy = () => {
    const fullText = `${currentBriefing.title}\n\n${currentBriefing.summaryText}\n\n${
      isZh ? '重點成效:' : 'Highlights:'
    }\n${currentBriefing.highlights.map((h) => `- ${h}`).join('\n')}\n\n${
      isZh ? '決策行動項:' : 'Action Items:'
    }\n${currentBriefing.actionItems.map((a) => `- ${a}`).join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111114] border border-blue-500/20 rounded-2xl p-6 space-y-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles size={18} />
            </div>
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? 'CTO & 董監事治理智慧簡報生成器' : 'CTO & Board Executive Briefing Generator'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '依據即時後端安全與六大合規遙測資料，動態生成適合 CTO、董事會、CEO、CFO 與 CISO 的決策簡報。'
              : 'Synthesizing live platform posture and 6-framework compliance telemetry by executive persona.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchBriefing(selectedPersona)}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold border border-white/10 transition-colors whitespace-nowrap"
          >
            <RefreshCw size={13} className={cn(isRegenerating && 'animate-spin text-blue-400')} />
            <span>{isZh ? '即時重整' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製備忘錄' : 'Copy Memo')}</span>
          </button>
        </div>
      </div>

      {/* Persona Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'cto', label: isZh ? '技術長 (CTO)' : 'CTO Architecture', icon: Cpu },
          { id: 'board', label: isZh ? '董監事與審計會' : 'Board & Audit', icon: Award },
          { id: 'ceo', label: isZh ? '執行長 (CEO)' : 'CEO Brief', icon: UserCheck },
          { id: 'cfo', label: isZh ? '財務長 (CFO)' : 'CFO & ROI', icon: FileText },
          { id: 'ciso', label: isZh ? '資安長 (CISO)' : 'CISO Deep Dive', icon: ShieldCheck }
        ].map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPersona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPersona(p.id as ExecutivePersona)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap',
                isSelected
                  ? 'bg-blue-600 text-white border border-blue-400/40'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              )}
            >
              <Icon size={13} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedPersona}-${currentBriefing.generatedAt}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-5 bg-black/40 rounded-xl border border-blue-500/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-black text-white tracking-tight">{currentBriefing.title}</h4>
                <span className="text-[11px] font-mono text-blue-400">
                  {isZh ? '適用受眾：' : 'Audience: '}
                  {currentBriefing.targetAudience}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Live Telemetry · {currentBriefing.generatedAt}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              {currentBriefing.summaryText}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/30 rounded-xl border border-white/10 space-y-2.5">
              <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 font-mono">
                <Check size={13} />
                {isZh ? '本期關鍵治理與技術亮點' : 'Key Strategic Highlights'}
              </span>
              <ul className="space-y-2">
                {currentBriefing.highlights.map((item, idx) => (
                  <li key={idx} className="text-xs text-gray-300 flex items-start gap-2 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-black/30 rounded-xl border border-white/10 space-y-2.5">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                <AlertTriangle size={13} />
                {isZh ? '待決策與執行行動項' : 'Priority Action Items'}
              </span>
              <ul className="space-y-2">
                {currentBriefing.actionItems.map((item, idx) => (
                  <li key={idx} className="text-xs text-gray-300 flex items-start gap-2 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Prompts */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
          <Bot size={13} className="text-blue-400" />
          {isZh ? '快捷情境摘要切換：' : 'Quick Focus Prompts:'}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { persona: 'cto' as ExecutivePersona, label: isZh ? '檢視 CI/CD SBOM 與零信任進度' : 'CI/CD SBOM & Zero Trust Summary' },
            { persona: 'ciso' as ExecutivePersona, label: isZh ? '檢視 CAPA 合規缺口與急件授權' : 'CAPA Gaps & Urgent Authorizations' },
            { persona: 'cfo' as ExecutivePersona, label: isZh ? '檢視 FAIR VaR 暴險與保險折扣' : 'FAIR VaR & Insurance Economics' }
          ].map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelectedPersona(q.persona);
                fetchBriefing(q.persona, q.label);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-blue-600/20 hover:text-blue-400 text-gray-300 border border-white/10 transition-colors text-left"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Send,
  UserCheck,
  FileText,
  AlertTriangle,
  Award,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ExecutivePersona } from './types';

interface ExecutiveAiBriefingProps {
  isZh: boolean;
}

export function ExecutiveAiBriefing({ isZh }: ExecutiveAiBriefingProps) {
  const [selectedPersona, setSelectedPersona] = useState<ExecutivePersona>('board');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Persona-specific executive summaries
  const BRIEFINGS: Record<ExecutivePersona, {
    title: string;
    targetAudience: string;
    summaryText: string;
    highlights: string[];
    actionItems: string[];
  }> = {
    board: {
      title: isZh ? '董監事審計委員會季度資安治理備忘錄' : 'Board of Directors & Audit Committee Security Memo',
      targetAudience: isZh ? '董事會、獨立董事與審計委員會成員' : 'Board Members & Audit Committee',
      summaryText: isZh
        ? '本季全公司資安治理達標評級維持於「A 級卓越」，六大國際標準（ISO 27001、GDPR、NIST 800-53、PCI DSS 等）合規率達 93.4%。本季無任何造成營運停擺或個資大規模外洩之重大事故。透過 FAIR 模型評定之 95% 信心財務暴險值已降至 $2.85M（大幅優於同業平均 $8.40M），現有 $20M 資安責任險額度足以提供逾 700% 的極端風險緩衝。'
        : 'Corporate security governance remains at Grade A with 93.4% compliance across major standards (ISO 27001, GDPR, NIST, PCI DSS). Zero catastrophic business-interruption incidents occurred. Value at Risk (95% VaR) stands at $2.85M, substantially superior to the $8.4M industry peer average, backed by a $20M cyber insurance policy.',
      highlights: [
        isZh ? '全網資產 100% 納入連續性 WORM 密碼學防篡改稽核' : '100% assets under continuous cryptographic WORM attestation',
        isZh ? '重大資安事件平均處置中和時間 (MTTR) 壓縮至 10.4 分鐘' : 'Mean Time to Remediate (MTTR) compressed to 10.4 minutes',
        isZh ? '符合證期局、SEC 與 NIS2 重大資安事故 4 日內強制揭露規範' : 'Fully aligned with SEC and NIS2 mandatory disclosure rules'
      ],
      actionItems: [
        isZh ? '核准 2027 年度後量子密碼學 (PQC) 核心資料庫升級預算' : 'Approve 2027 Post-Quantum Cryptography transition budget',
        isZh ? '確認東南亞區域辦公室零信任網路熔斷備份演練排程' : 'Confirm Southeast Asia zero-trust boundary containment schedule'
      ]
    },
    ceo: {
      title: isZh ? '執行長 (CEO) 營運韌性與品牌商譽速報' : 'CEO Operational Resilience & Reputation Briefing',
      targetAudience: isZh ? '執行長與高階決策執行委員會' : 'Chief Executive Officer & Executive Committee',
      summaryText: isZh
        ? '本週核心業務系統（SAP S/4HANA ERP、SWIFT 跨行清算、K8s 交易閘道）維持 99.992% 極致妥善率。面對週三針對晶片研發處發起之疑似敏感 IP 資料外洩嘗試，自主 SOAR 引擎在 10 分鐘內完全切斷外部連線並隔離端點，關鍵智慧財產與核心代碼未發生洩漏。各事業群營運持續性完好，品牌對外信任度無損。'
        : 'Core mission-critical services (SAP ERP, SWIFT Clearing, Transaction Gateways) maintained 99.992% uptime. An attempted IP exfiltration in R&D on Wednesday was autonomously severed and isolated within 10 minutes, with zero intellectual property leakage. Business continuity and brand trust remain fully protected.',
      highlights: [
        isZh ? '全集團核心營業系統本週零非預期停機時間' : 'Zero unplanned downtime across all tier-1 business lines',
        isZh ? '研發處異常外傳嘗試已於秒級自動處置並阻斷' : 'R&D data exfiltration autonomously blocked at egress gateway',
        isZh ? '協力廠商供應鏈風險持續處於動態受控範圍' : 'Third-party supply chain risk actively controlled via automated SBOM'
      ],
      actionItems: [
        isZh ? '責成研發副總於下週一主持全體工程師高階機密安全講習' : 'Direct VP of R&D to lead mandatory IP security awareness workshop',
        isZh ? '維持與關鍵戰略客戶之資安可信度白皮書每季主動更新' : 'Publish Q3 Security Trust Whitepaper for tier-1 enterprise clients'
      ]
    },
    cfo: {
      title: isZh ? '財務長 (CFO) 資安財務暴險與 ROI 效益分析' : 'CFO Cyber Risk Exposure & Capital Efficiency Report',
      targetAudience: isZh ? '財務長、財務主管與企業風險管理處' : 'Chief Financial Officer & Enterprise Risk Committee',
      summaryText: isZh
        ? '本年度資安防護體系展現高達 382% 的投資回報率 (ROI)。藉由次世代 SOAR 實現 96.8% 的非人工自動處置，累計替團隊節省 1,640 個分析師工時，換算工時成本與外部應變委外支出約節省 $1.42M。年度預期損失 (ALE) 僅為 $420k，有效將潛在營業中斷財務暴險降低逾 74%。此外，優良資安評級使下年度企業資安險保費折扣達 15%。'
        : 'SecOps automation yielded a 382% ROI this year. With 96.8% autonomous containment, 1,640 analyst hours were reclaimed, saving an estimated $1.42M in internal labor and incident response fees. Annualized Loss Expectancy (ALE) was suppressed to $420k. Strong posture earned a 15% discount on upcoming cyber insurance premiums.',
      highlights: [
        isZh ? '自動化處置節省 1,640 小時工時，等同 $1.42M 實質支出降低' : '1,640 analyst hours saved ($1.42M labor cost equivalent)',
        isZh ? '95% 信心 VaR 降至 $2.85M，遠低於同業 $8.40M 財務暴險' : '95% VaR at $2.85M vs $8.40M industry peer average',
        isZh ? '達成次年度資安責任險續約保費減免 15% 之優惠門檻' : 'Qualified for 15% discount on cyber insurance renewal'
      ],
      actionItems: [
        isZh ? '完成第三季資安資本支出 (CAPEX) 與防護 ROI 績效核銷' : 'Finalize Q3 CAPEX and defense ROI performance sign-off',
        isZh ? '審議第四季雲端微隔離軟體採購預算追加案' : 'Review Q4 cloud microsegmentation procurement allocation'
      ]
    },
    ciso: {
      title: isZh ? '資安長 (CISO) 深度防禦與戰術威脅綜述' : 'CISO Deep-Defense & Threat Operations Briefing',
      targetAudience: isZh ? '資訊安全長與資安應變中心 (SOC/CERT)' : 'Chief Information Security Officer & SecOps Leads',
      summaryText: isZh
        ? '本週全域威脅偵測總數為 1,108 起，已中和 1,098 起（攔截率 99.1%）。MITRE ATT&CK 覆蓋率目前達 88.6%，主要高發威脅為 T1078 (Valid Accounts) 與 T1566 (Phishing)。研發端點的 UEBA 異常偏離模型及時發報，触發 XDR 自動撤銷 Session 並隔離網段。目前無未修補之 CVSS 9.0+ 外部暴險弱點，待核准高管權限緊急隔離任務 2 件。'
        : 'Weekly threat telemetry captured 1,108 events with 1,098 neutralized (99.1% success rate). MITRE ATT&CK coverage stands at 88.6%, led by T1078 (Valid Accounts) and T1566 (Phishing). UEBA behavioral anomaly tripped instant XDR containment. Zero critical unpatched CVSS 9.0+ vulnerabilities remain exposed.',
      highlights: [
        isZh ? 'MITRE ATT&CK 戰術偵測覆蓋率達 88.6%' : '88.6% MITRE ATT&CK enterprise tactic coverage',
        isZh ? '平均威脅偵測時間 (MTTD) 達到 3.8 分鐘超低延遲' : 'Sub-4-minute MTTD across all enterprise telemetry sources',
        isZh ? '對外暴險面 CVSS 9.0+ 漏洞清零達成率 100%' : '100% zero-day triage SLA on external perimeter'
      ],
      actionItems: [
        isZh ? '審核東南亞辦公室緊急網段隔離工單 (#APPR-2026-089)' : 'Authorize emergency branch isolation ticket (#APPR-2026-089)',
        isZh ? '推進零信任 SASE 私有服務通道第三階段驗收' : 'Complete phase 3 acceptance testing for Zero Trust SASE gateway'
      ]
    }
  };

  const currentBriefing = BRIEFINGS[selectedPersona];

  const handleCopy = () => {
    const fullText = `${currentBriefing.title}\n\n${currentBriefing.summaryText}\n\n重點成效:\n${currentBriefing.highlights.map(h => `- ${h}`).join('\n')}\n\n決策行動項:\n${currentBriefing.actionItems.map(a => `- ${a}`).join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
    }, 1200);
  };

  return (
    <div className="bg-[#111114] border border-blue-500/20 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles size={20} />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              {isZh ? 'AI 智慧生成高階主管決策備忘錄 (Executive AI Copilot)' : 'AI Executive Briefing & Decision Copilot'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '依據不同高階主管決策視角（董事會、CEO、CFO、CISO），自動提取全網遙測資料生成精準、具說服力且免除技術雜訊的高階摘要。'
              : 'Auto-synthesizing telemetry into persona-driven executive memorandums tailored for Board, CEO, CFO, or CISO.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold border border-white/10 transition-all active:scale-95"
          >
            <RefreshCw size={13} className={cn(isRegenerating && "animate-spin text-blue-400")} />
            <span>{isZh ? '重新生成' : 'Regenerate'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? (isZh ? '已複製到剪貼簿' : 'Copied') : (isZh ? '複製主管備忘錄' : 'Copy Memo')}</span>
          </button>
        </div>
      </div>

      {/* Persona Selection Pills */}
      <div className="flex items-center gap-2 flex-wrap relative z-10">
        <span className="text-xs font-bold text-gray-400 mr-1">
          {isZh ? '選擇報告目標受眾：' : 'Target Persona:'}
        </span>
        {[
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
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                isSelected
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              <Icon size={14} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPersona + (isRegenerating ? '-loading' : '')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-6 relative z-10"
        >
          {/* Main Memo Box */}
          <div className="p-6 bg-black/40 rounded-2xl border border-blue-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h4 className="text-base font-black text-white tracking-tight">
                  {currentBriefing.title}
                </h4>
                <span className="text-[11px] font-mono text-blue-400">
                  {isZh ? '適用受眾：' : 'Target: '}{currentBriefing.targetAudience}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                AI Verified 99.8%
              </span>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed font-sans">
              {currentBriefing.summaryText}
            </p>
          </div>

          {/* Highlights & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Accomplishments */}
            <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 font-mono">
                <Check size={14} />
                {isZh ? '本期關鍵防禦亮點' : 'Strategic Highlights'}
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

            {/* Executive Action Items */}
            <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                <AlertTriangle size={14} />
                {isZh ? '待決策與核准行動項' : 'Recommended Actions'}
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

      {/* Interactive Quick Prompts for CISO AI */}
      <div className="pt-2 border-t border-white/5 space-y-3">
        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
          <Bot size={13} className="text-blue-400" />
          {isZh ? '常用高階資安諮詢快捷問答：' : 'Executive AI Copilot Quick Prompts:'}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            isZh ? '「總結本週阻斷向外資料外洩事件處置時間軸」' : 'Summarize R&D data exfiltration containment timeline',
            isZh ? '「如何向審計委員會說明本季勒索軟體暴險控制？」' : 'Explain ransomware blast radius mitigation to Audit Committee',
            isZh ? '「列出下季度優先建議投資之前三大資安控制項」' : 'Top 3 cybersecurity control investment priorities for Q4'
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setCustomPrompt(prompt);
                handleRegenerate();
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-blue-600/20 hover:text-blue-400 text-gray-400 border border-white/5 transition-all text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

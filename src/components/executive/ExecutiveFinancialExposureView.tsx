import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Sliders,
  Scale,
  RefreshCw
} from 'lucide-react';
import { FINANCIAL_EXPOSURE_DATA } from './executiveData';
import type { FinancialCyberRisk } from './types';

interface ExecutiveFinancialExposureViewProps {
  isZh: boolean;
  financialExposure?: FinancialCyberRisk;
}

export function ExecutiveFinancialExposureView({
  isZh,
  financialExposure
}: ExecutiveFinancialExposureViewProps) {
  const base = financialExposure || FINANCIAL_EXPOSURE_DATA;

  const [controlEfficacy, setControlEfficacy] = useState(88);
  const [threatFrequencyMultiplier, setThreatFrequencyMultiplier] = useState(1.0);
  const [simResult, setSimResult] = useState<{
    simulatedVaR: number;
    simulatedALE: number;
    simulatedSavings: number;
    protectionDelta: number;
    insuranceCoveragePct: number;
  }>({
    simulatedVaR: base.potentialValueAtRisk,
    simulatedALE: base.annualizedLossExpectancy,
    simulatedSavings: base.lossAvoidanceSavings,
    protectionDelta: base.industryPeerAvgVaR - base.potentialValueAtRisk,
    insuranceCoveragePct: Math.round((base.cyberInsuranceLimit / base.potentialValueAtRisk) * 100)
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Run backend FAIR model calculation when sliders settle
  useEffect(() => {
    // Immediate responsive local calculation first
    const factor = threatFrequencyMultiplier * (1 - (controlEfficacy - 50) / 100);
    const localVaR = Math.max(250000, Math.round(base.potentialValueAtRisk * factor));
    const localALE = Math.max(45000, Math.round(base.annualizedLossExpectancy * factor));
    const localSavings = Math.round(base.lossAvoidanceSavings * (controlEfficacy / 88));
    setSimResult({
      simulatedVaR: localVaR,
      simulatedALE: localALE,
      simulatedSavings: localSavings,
      protectionDelta: base.industryPeerAvgVaR - localVaR,
      insuranceCoveragePct: Math.round((base.cyberInsuranceLimit / localVaR) * 100)
    });

    const timer = setTimeout(async () => {
      try {
        setIsSyncing(true);
        const res = await fetch('/api/v1/cto-governance/fair-simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ controlEfficacy, threatFrequencyMultiplier })
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.simulation) {
            setSimResult(json.simulation);
          }
        }
      } catch {
        // Keep local responsive calculation
      } finally {
        setIsSyncing(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [controlEfficacy, threatFrequencyMultiplier, base]);

  return (
    <div className="space-y-6">
      {/* Top Header & Financial KPIs */}
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <DollarSign size={18} />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {isZh ? 'FAIR 財務風險量化模型與資安投資報酬率 (ROI)' : 'FAIR Cyber Risk Quantification & Security ROI'}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isZh
                ? '採用國際標準 FAIR (Factor Analysis of Information Risk) 量化方法，將技術控制強度換算為財務暴險值 (VaR) 與年度預期損失 (ALE)。'
                : 'Translating technical control efficacy into financial Value at Risk (VaR) and Annualized Loss Expectancy (ALE).'}
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold tabular-nums whitespace-nowrap shrink-0">
            {base.roiPercentage}% SecOps Automation ROI
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-gray-400 block">
              {isZh ? '95% 信心水準暴險值 (VaR)' : '95% Confidence VaR'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono tabular-nums text-white">
                ${(simResult.simulatedVaR / 1000000).toFixed(2)}M
              </span>
              <span className="text-xs text-emerald-400 font-bold font-mono">-18.5%</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              {isZh
                ? `相較同業基準 $${(base.industryPeerAvgVaR / 1000000).toFixed(2)}M`
                : `vs $${(base.industryPeerAvgVaR / 1000000).toFixed(2)}M peer avg`}
            </p>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-gray-400 block">
              {isZh ? '年度預期損失 (ALE)' : 'Annualized Loss Expectancy'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono tabular-nums text-amber-400">
                ${(simResult.simulatedALE / 1000).toFixed(0)}k
              </span>
              <span className="text-xs text-gray-400 font-mono">/ {isZh ? '年' : 'yr'}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {isZh ? '已透過主動防禦吸收 94%' : '94% absorbed by active controls'}
            </p>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-gray-400 block">
              {isZh ? '資安責任保險保障額度' : 'Cyber Insurance Limit'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono tabular-nums text-blue-400">
                ${(base.cyberInsuranceLimit / 1000000).toFixed(0)}M
              </span>
              <span className="text-xs text-gray-400 font-mono">
                (${(base.cyberInsuranceDeductible / 1000).toFixed(0)}k {isZh ? '自負額' : 'ded.'})
              </span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-1 font-bold font-mono tabular-nums">
              {isZh ? `覆蓋潛在暴險 ${simResult.insuranceCoveragePct}%` : `${simResult.insuranceCoveragePct}% VaR coverage`}
            </p>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-gray-400 block">
              {isZh ? '累計攔截避險總額' : 'Losses Averted (SOAR)'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono tabular-nums text-emerald-400">
                ${(simResult.simulatedSavings / 1000000).toFixed(1)}M
              </span>
              <span className="text-xs text-emerald-400 font-bold">Averted</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {isZh ? '基於 160+ 起高危攻擊劇本阻斷' : 'Based on 160+ critical playbooks'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column: FAIR Loss Breakdown & Interactive Backend-Backed Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Scale size={15} className="text-blue-500" />
              {isZh ? '重大資安事故潛在損失結構分析' : 'Cyber Incident Loss Structure Breakdown'}
            </h4>
            <span className="text-[10px] font-mono text-gray-400">FAIR Loss Magnitude</span>
          </div>

          <div className="space-y-3">
            {[
              {
                category: isZh ? '營業中斷與生產力停頓 (Business Interruption)' : 'Business Interruption',
                amount: '$1.45M',
                pct: 51,
                desc: isZh ? '依核心 ERP 停擺每小時 $120k 計算' : 'Core ERP downtime at $120k/hr'
              },
              {
                category: isZh ? '法規監理罰鍰與法律賠償 (GDPR/SEC Fines)' : 'Regulatory Fines & Legal Defense',
                amount: '$650k',
                pct: 23,
                desc: isZh ? '個資保護審查與法遵強制令預備金' : 'Privacy violation statutory exposure'
              },
              {
                category: isZh ? '數位鑑識、調查與資安應變服務 (Forensics/IR)' : 'Forensics & Incident Response',
                amount: '$450k',
                pct: 16,
                desc: isZh ? '委任第三方專業鑑識小組與應變顧問' : 'External DFIR retainer & remediation'
              },
              {
                category: isZh ? '客戶信譽挽回與通知作業 (Crisis PR & Notification)' : 'Crisis PR & Customer Notification',
                amount: '$300k',
                pct: 10,
                desc: isZh ? '個資外洩信函通知、信用監控與公關' : 'Mandatory notifications & credit monitoring'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2">
                <div className="flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-xs font-bold text-white block">{item.category}</span>
                    <span className="text-[10px] text-gray-400">{item.desc}</span>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <span className="text-xs font-black text-blue-400">{item.amount}</span>
                    <span className="text-[10px] text-gray-400 ml-1.5">({item.pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive FAIR Simulation Calculator */}
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={15} className="text-amber-500" />
                {isZh ? 'FAIR 風險參數情境模擬計算機' : 'FAIR Scenario Simulation Calculator'}
              </h4>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 whitespace-nowrap">
                {isSyncing && <RefreshCw size={10} className="animate-spin" />}
                What-If Engine
              </span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              {isZh
                ? '即時調整技術安全控制強度（如 SASE、SBOM、FIDO2）與地緣威脅頻率倍率，透過後端 FAIR 引擎即時試算 ALE 與 95% VaR 暴險變動。'
                : 'Adjust security control efficacy and threat multiplier to compute FAIR VaR & ALE sensitivity via backend simulation.'}
            </p>

            <div className="space-y-5 p-4 bg-black/40 rounded-xl border border-white/10">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-300">
                    {isZh ? '資安控制項綜合強度 (Control Efficacy)' : 'Control Efficacy'}
                  </span>
                  <span className="font-mono font-black tabular-nums text-blue-400">{controlEfficacy}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="98"
                  value={controlEfficacy}
                  onChange={(e) => setControlEfficacy(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>40% ({isZh ? '基本防護' : 'Baseline'})</span>
                  <span>88% ({isZh ? '當前 SOAR+零信任' : 'Current'})</span>
                  <span>98% ({isZh ? '全自主防禦' : 'Autonomous'})</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-300">
                    {isZh ? '外部威脅活動倍率 (Threat Multiplier)' : 'Threat Activity Multiplier'}
                  </span>
                  <span className="font-mono font-black tabular-nums text-amber-400">
                    {threatFrequencyMultiplier.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={threatFrequencyMultiplier}
                  onChange={(e) => setThreatFrequencyMultiplier(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>0.5x ({isZh ? '低波期' : 'Quiet'})</span>
                  <span>1.0x ({isZh ? '常態活動' : 'Normal'})</span>
                  <span>2.5x ({isZh ? '高強度網攻' : 'Surge'})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-600/10 border border-blue-500/25 rounded-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase font-bold block">
                {isZh ? '動態預估 95% VaR 財務暴險' : 'Simulated 95% VaR Exposure'}
              </span>
              <span className="text-2xl font-black font-mono tabular-nums text-white">
                ${(simResult.simulatedVaR / 1000000).toFixed(2)}M
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">
                {isZh ? '相較同業避險差額' : 'Protection Delta vs Peers'}
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-emerald-400">
                {simResult.protectionDelta >= 0 ? '+' : '-'}$
                {(Math.abs(simResult.protectionDelta) / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Percent,
  Sliders,
  Award,
  AlertOctagon,
  Scale,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { FINANCIAL_EXPOSURE_DATA } from './executiveData';

interface ExecutiveFinancialExposureViewProps {
  isZh: boolean;
}

export function ExecutiveFinancialExposureView({ isZh }: ExecutiveFinancialExposureViewProps) {
  const base = FINANCIAL_EXPOSURE_DATA;

  // Interactive FAIR simulation sliders
  const [controlEfficacy, setControlEfficacy] = useState(88); // 88% effective
  const [threatFrequencyMultiplier, setThreatFrequencyMultiplier] = useState(1.0); // 1.0x baseline

  // Simulated calculations
  const simulatedVaR = Math.round(
    base.potentialValueAtRisk * (threatFrequencyMultiplier * (1 - (controlEfficacy - 50) / 100))
  );
  const simulatedALE = Math.round(
    base.annualizedLossExpectancy * (threatFrequencyMultiplier * (1 - (controlEfficacy - 50) / 100))
  );
  const simulatedSavings = Math.round(
    base.lossAvoidanceSavings * (controlEfficacy / 88)
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <DollarSign size={20} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {isZh ? 'FAIR 財務風險量化模型與資安投資報酬率 (ROI)' : 'FAIR Cyber Risk Quantification & Security ROI'}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isZh
                ? '採用國際標準 FAIR (Factor Analysis of Information Risk) 量化方法，將抽象技術威脅轉化為董監事會通曉之財務暴險值 (VaR) 與年度預期損失 (ALE)。'
                : 'Translating cyber risk into financial Value at Risk (VaR) and Annualized Loss Expectancy (ALE) based on the FAIR standard.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              382% SecOps Automation ROI
            </span>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* 95% VaR */}
          <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-gray-500 block">
              {isZh ? '95% 信心水準暴險值 (VaR)' : '95% Confidence VaR'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                ${(simulatedVaR / 1000000).toFixed(2)}M
              </span>
              <span className="text-xs text-emerald-400 font-bold">
                -18.5%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {isZh ? '相較同業基準 $8.40M' : 'vs $8.40M peer average'}
            </p>
          </div>

          {/* Annualized Loss Expectancy */}
          <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-gray-500 block">
              {isZh ? '年度預期損失 (ALE)' : 'Annualized Loss Expectancy (ALE)'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-amber-400">
                ${(simulatedALE / 1000).toFixed(0)}k
              </span>
              <span className="text-xs text-gray-400 font-mono">/ {isZh ? '年' : 'yr'}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {isZh ? '已透過主動防禦吸收 94%' : '94% absorbed by active controls'}
            </p>
          </div>

          {/* Cyber Insurance Coverage */}
          <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-gray-500 block">
              {isZh ? '資安責任保險保障額度' : 'Cyber Insurance Limit'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-blue-400">
                ${(base.cyberInsuranceLimit / 1000000).toFixed(0)}M
              </span>
              <span className="text-xs text-gray-400 font-mono">($500k 自負額)</span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-1 font-bold">
              {isZh ? '覆蓋率達潛在暴險之 700%' : '700% coverage of maximum VaR'}
            </p>
          </div>

          {/* Total Cumulative Loss Averted */}
          <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-gray-500 block">
              {isZh ? '累計攔截避險總額' : 'Losses Averted (SOAR)'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-400">
                ${(simulatedSavings / 1000000).toFixed(1)}M
              </span>
              <span className="text-xs text-emerald-400 font-bold">Averted</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {isZh ? '基於 160+ 起高危攻擊情境防堵' : 'Based on 160+ critical playbooks'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column: FAIR Loss Breakdown & Interactive Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Financial Impact Breakdown */}
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Scale size={16} className="text-blue-500" />
              {isZh ? '重大資安事故潛在損失結構分析' : 'Cyber Incident Loss Structure Breakdown'}
            </h4>
            <span className="text-[10px] font-mono text-gray-500">FAIR Loss Magnitude</span>
          </div>

          <div className="space-y-4">
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
                desc: isZh ? '委任第三方專業鑑識小組與贖金談判顧問' : 'External DFIR retainer & remediation'
              },
              {
                category: isZh ? '客戶信譽挽回與通知作業 (Crisis PR & Notification)' : 'Crisis PR & Customer Notification',
                amount: '$300k',
                pct: 10,
                desc: isZh ? '個資外洩信函通知、信用監控與公關' : 'Mandatory notifications & credit monitoring'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-white block">{item.category}</span>
                    <span className="text-[10px] text-gray-500">{item.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-blue-400">{item.amount}</span>
                    <span className="text-[10px] text-gray-500 font-mono ml-1.5">({item.pct}%)</span>
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
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-amber-500" />
              {isZh ? 'FAIR 風險參數情境模擬計算機' : 'FAIR Scenario Simulation Calculator'}
            </h4>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Interactive What-If
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            {isZh
              ? '即時調整資安控制強度與威脅頻率倍率，動態預測其對年度預期損失 (ALE) 與 95% VaR 財務暴險之直接影響。'
              : 'Adjust control efficacy and threat frequency to dynamically simulate organizational financial exposure.'}
          </p>

          <div className="space-y-6 p-5 bg-black/40 rounded-2xl border border-white/5">
            {/* Slider 1: Control Efficacy */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-gray-300">
                  {isZh ? '資安控制項綜合強度 (Control Efficacy)' : 'Control Efficacy'}
                </span>
                <span className="font-mono font-black text-blue-400">{controlEfficacy}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="98"
                value={controlEfficacy}
                onChange={(e) => setControlEfficacy(Number(e.target.value))}
                className="w-full accent-blue-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>40% (基本防火牆)</span>
                <span>88% (當前 SOAR+零信任)</span>
                <span>98% (全自主 AI 防禦)</span>
              </div>
            </div>

            {/* Slider 2: Threat Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-gray-300">
                  {isZh ? '地緣或產業威脅活動倍率 (Threat Multiplier)' : 'Threat Activity Multiplier'}
                </span>
                <span className="font-mono font-black text-amber-400">{threatFrequencyMultiplier.toFixed(1)}x</span>
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
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>0.5x (平靜期)</span>
                <span>1.0x (常態活動)</span>
                <span>2.5x (嚴重地緣網攻浪潮)</span>
              </div>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase font-bold block">
                {isZh ? '動態預估 95% VaR 財務暴險' : 'Simulated 95% VaR Exposure'}
              </span>
              <span className="text-2xl font-black font-mono text-white">
                ${(simulatedVaR / 1000000).toFixed(2)}M
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">
                {isZh ? '相較同業避險差額' : 'Protection Delta'}
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                +${((base.industryPeerAvgVaR - simulatedVaR) / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

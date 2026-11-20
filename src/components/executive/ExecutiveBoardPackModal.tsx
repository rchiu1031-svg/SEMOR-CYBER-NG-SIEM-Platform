import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Award,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EXECUTIVE_OVERVIEW_METRICS, FINANCIAL_EXPOSURE_DATA } from './executiveData';
import type {
  CtoOverviewMetrics,
  FinancialCyberRisk,
  CtoTechPillar,
  ComplianceSummaryMetrics
} from './types';
import type { ComplianceFrameworkMeta, WormLedgerRecord } from '../compliance/types';

interface ExecutiveBoardPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  isZh: boolean;
  metrics?: CtoOverviewMetrics;
  financialExposure?: FinancialCyberRisk;
  frameworks?: ComplianceFrameworkMeta[];
  techPillars?: CtoTechPillar[];
  wormLedger?: WormLedgerRecord[];
  complianceSummary?: ComplianceSummaryMetrics;
}

export function ExecutiveBoardPackModal({
  isOpen,
  onClose,
  isZh,
  metrics,
  financialExposure,
  frameworks = [],
  techPillars = [],
  wormLedger = [],
  complianceSummary
}: ExecutiveBoardPackModalProps) {
  const [activeSlide, setActiveSlide] = useState(1);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const m: CtoOverviewMetrics = metrics || {
    ...EXECUTIVE_OVERVIEW_METRICS,
    sbomSignedCoverage: 97.4,
    pqcReadinessPct: 42,
    zeroTrustAdoptionPct: 88,
    totalWormBlocks: 10428
  };
  const f = financialExposure || FINANCIAL_EXPOSURE_DATA;
  const avgCompliance =
    complianceSummary?.averageScore ??
    (frameworks.length > 0
      ? Math.round(frameworks.reduce((s, fw) => s + fw.score, 0) / frameworks.length)
      : 94);
  const latestBlock = wormLedger[0];

  const handleDownload = async () => {
    let reportData: any = null;
    try {
      const res = await fetch('/api/v1/cto-governance/export-pack');
      if (res.ok) {
        const json = await res.json();
        if (json?.pack) {
          reportData = json.pack;
        }
      }
    } catch {
      // Fallback to client snapshot
    }

    if (!reportData) {
      reportData = {
        packId: `CTO-GRC-PACK-${new Date().toISOString().slice(0, 10)}`,
        generatedAt: new Date().toISOString(),
        executivePosture: m,
        complianceSummary,
        financialRiskQuantification: f,
        frameworks,
        latestWormBlocks: wormLedger.slice(0, 5)
      };
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CTO_Governance_Compliance_Pack_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-[#0f0f12] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {isZh
                    ? 'CTO 技術治理暨董監事會合規簡報包'
                    : 'CTO Governance & Board Compliance Audit Pack'}
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  Ref: CTO-GRC-2026-Q3 · Classification: Executive & Audit Confidential
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
              >
                <Printer size={14} />
                <span>{isZh ? '列印 / PDF' : 'Print'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
              >
                <Download size={14} />
                <span>
                  {downloadSuccess
                    ? isZh
                      ? '已匯出！'
                      : 'Exported!'
                    : isZh
                    ? '匯出稽核簡報包 (JSON)'
                    : 'Export Audit Pack'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Slide Navigator */}
          <div className="px-6 py-2.5 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { num: 1, title: isZh ? '1. CTO 架構與合規總評' : '1. CTO Posture & Compliance' },
                { num: 2, title: isZh ? '2. FAIR 財務暴險與 ROI' : '2. Financial VaR & ROI' },
                { num: 3, title: isZh ? '3. 六大法規認證與 WORM' : '3. 6-Framework WORM Audit' },
                { num: 4, title: isZh ? '4. 零信任與後量子藍圖' : '4. Zero Trust & PQC Roadmap' }
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveSlide(s.num)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap',
                    activeSlide === s.num
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <span className="font-mono text-gray-400 text-[11px] shrink-0">
              Slide {activeSlide} of 4
            </span>
          </div>

          {/* Slide Content Viewer */}
          <div className="p-6 lg:p-8 overflow-y-auto flex-1 space-y-6">
            {activeSlide === 1 && (
              <div className="space-y-6">
                <div className="p-6 bg-black/40 rounded-2xl border border-blue-500/25">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-widest">
                        CTO Executive Overview
                      </span>
                      <h4 className="text-xl font-black text-white mt-1">
                        {isZh
                          ? '企業技術防禦韌性暨國際合規綜合治理報告'
                          : 'Enterprise Architecture Resilience & Regulatory Governance Review'}
                      </h4>
                      <p className="text-xs text-gray-300 mt-2 max-w-2xl leading-relaxed">
                        {isZh
                          ? `整體資安健康分維持「${m.healthGrade} (${m.healthIndex}/100)」，六大國際法規平均合規達成率 ${avgCompliance}%。CI/CD 容器簽章驗證覆蓋率 ${m.sbomSignedCoverage}%，所有遙測證據皆已密封於 WORM 區塊鏈。`
                          : `Enterprise posture at ${m.healthGrade} (${m.healthIndex}/100) with ${avgCompliance}% cross-framework compliance and ${m.sbomSignedCoverage}% signed container artifacts under immutable WORM attestation.`}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[130px] shrink-0">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block">
                        {isZh ? '治理評級 / 合規率' : 'Health / Compliance'}
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                        {m.healthIndex} / {avgCompliance}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-gray-400">
                      {isZh ? '核心業務妥善率' : 'Service Uptime'}
                    </span>
                    <span className="text-xl font-black font-mono tabular-nums text-white block mt-1">
                      {m.businessUptime}%
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Tier-1 SLA Met</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-gray-400">
                      {isZh ? 'SOAR 自動攔截 / 省時' : 'SOAR Deflection'}
                    </span>
                    <span className="text-xl font-black font-mono tabular-nums text-blue-400 block mt-1">
                      {m.deflectionRatio}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {m.analystHoursSaved.toLocaleString()} hrs saved
                    </span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-gray-400">
                      {isZh ? 'MTTD / MTTR 速度' : 'Velocity'}
                    </span>
                    <span className="text-xl font-black font-mono tabular-nums text-emerald-400 block mt-1">
                      {m.mttdMinutes}m / {m.mttrMinutes}m
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Sub-15m Containment</span>
                  </div>
                </div>
              </div>
            )}

            {activeSlide === 2 && (
              <div className="p-6 bg-black/40 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-base font-black text-white">
                  {isZh
                    ? 'FAIR 模型量化財務暴險與資安保險防護緩衝'
                    : 'FAIR Financial Risk Quantification & Insurance Coverage'}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {isZh
                    ? `本公司 95% 信心水準最大潛在資安暴險 (VaR) 為 $${(f.potentialValueAtRisk / 1000000).toFixed(2)}M，較同業基準 $${(f.industryPeerAvgVaR / 1000000).toFixed(2)}M 具備顯著避險優勢，且 $20M 資安責任險提供逾 700% 的覆蓋緩衝。`
                    : `95% Value at Risk stands at $${(f.potentialValueAtRisk / 1000000).toFixed(2)}M vs $${(f.industryPeerAvgVaR / 1000000).toFixed(2)}M peer average, backed by $${(f.cyberInsuranceLimit / 1000000).toFixed(0)}M insurance coverage.`}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-black/50 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-gray-400 uppercase">
                      {isZh ? '年度預期損失 (ALE)' : 'Annual Loss Expectancy'}
                    </span>
                    <span className="text-2xl font-black font-mono tabular-nums text-amber-400 block mt-1">
                      ${(f.annualizedLossExpectancy / 1000).toFixed(0)}k / yr
                    </span>
                  </div>

                  <div className="p-4 bg-black/50 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-gray-400 uppercase">
                      {isZh ? '累計攔截避險總額' : 'Losses Averted'}
                    </span>
                    <span className="text-2xl font-black font-mono tabular-nums text-emerald-400 block mt-1">
                      ${(f.lossAvoidanceSavings / 1000000).toFixed(1)}M
                    </span>
                  </div>

                  <div className="p-4 bg-black/50 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-gray-400 uppercase">
                      {isZh ? '自動化防禦 ROI' : 'Automation ROI'}
                    </span>
                    <span className="text-2xl font-black font-mono tabular-nums text-blue-400 block mt-1">
                      {f.roiPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSlide === 3 && (
              <div className="p-6 bg-black/40 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-base font-black text-white">
                  {isZh
                    ? '六大國際法規合規框架稽核明細'
                    : 'Six-Framework Continuous Compliance Matrix'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {frameworks.map((fw) => (
                    <div
                      key={fw.id}
                      className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{fw.shortName}</span>
                        <span className="text-sm font-black font-mono tabular-nums text-emerald-400">
                          {fw.score}%
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 tabular-nums">
                        {fw.passedControls}/{fw.totalControls} {isZh ? '通過' : 'Passed'} ·{' '}
                        {fw.violatedControls} {isZh ? '違規' : 'Violated'}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">{fw.auditor}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSlide === 4 && (
              <div className="p-6 bg-black/40 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-base font-black text-white">
                  {isZh
                    ? 'CTO 四大技術安全支柱、零信任與後量子密碼規劃'
                    : 'CTO Technology Pillars, Zero Trust & PQC Planning'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {techPillars.map((p) => (
                    <div key={p.id} className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">{isZh ? p.nameZh : p.nameEn}</span>
                        <span className="text-xs font-mono font-black text-blue-400 tabular-nums">
                          {p.score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">{isZh ? p.summaryZh : p.summaryEn}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cryptographic Seal & Signature Block */}
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-gray-400 block">
                  CTO & CISO Cryptographic WORM Attestation
                </span>
                <span className="text-xs font-mono text-gray-300 font-bold">
                  WORM Block #{latestBlock?.blockId ?? 10428} · Sealed {m.totalWormBlocks.toLocaleString()} Blocks
                </span>
                <span className="text-[10px] font-mono text-blue-400 block break-all">
                  Merkle Root:{' '}
                  {latestBlock?.merkleRoot ||
                    '0x4c8a2e1f9b3d7c5e0a6f8b2d1c4e9a7f5b3d1c8e0a6f4b2d9e7c1a5f3b8d0c2e'}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold shrink-0 flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>SEALED & AUDITED</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

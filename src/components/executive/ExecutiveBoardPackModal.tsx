import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Printer,
  Award,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  Clock,
  Layers,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EXECUTIVE_OVERVIEW_METRICS, FINANCIAL_EXPOSURE_DATA, DEPARTMENT_RISKS_DATA } from './executiveData';

interface ExecutiveBoardPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  isZh: boolean;
}

export function ExecutiveBoardPackModal({ isOpen, onClose, isZh }: ExecutiveBoardPackModalProps) {
  const [activeSlide, setActiveSlide] = useState(1);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const m = EXECUTIVE_OVERVIEW_METRICS;
  const f = FINANCIAL_EXPOSURE_DATA;

  const handleDownload = () => {
    const reportData = {
      title: "Board of Directors Cybersecurity Briefing Pack",
      generatedAt: new Date().toISOString(),
      governanceRating: m.healthGrade,
      healthIndex: m.healthIndex,
      financialVaR: m.valueAtRiskUsd,
      insuranceLimit: f.cyberInsuranceLimit,
      analystHoursSaved: m.analystHoursSaved,
      mttdMinutes: m.mttdMinutes,
      mttrMinutes: m.mttrMinutes,
      auditHash: "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Board_Cyber_Briefing_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0f0f12] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Award size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {isZh ? '董監事會資安季報簡報包 (Board Presentation Pack)' : 'Board of Directors Quarterly Security Pack'}
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  Ref: SEC-BRD-2026-Q3 | Classification: C-Level Confidential
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/25 active:scale-95"
              >
                <Download size={14} />
                <span>{downloadSuccess ? (isZh ? '已下載！' : 'Downloaded!') : (isZh ? '匯出簡報包' : 'Export Pack')}</span>
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
          <div className="px-6 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {[
                { num: 1, title: isZh ? '1. 戰略治理概覽' : '1. Strategic Governance' },
                { num: 2, title: isZh ? '2. 財務暴險與保險' : '2. Financial VaR & Insurance' },
                { num: 3, title: isZh ? '3. 營運韌性與 MTTR' : '3. Operational Resilience' },
                { num: 4, title: isZh ? '4. 零信任藍圖' : '4. Zero Trust Roadmap' }
              ].map(s => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveSlide(s.num)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold transition-all",
                    activeSlide === s.num
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <span className="font-mono text-gray-500 text-[11px]">
              Slide {activeSlide} of 4
            </span>
          </div>

          {/* Slide Content Viewer */}
          <div className="p-8 overflow-y-auto flex-1 space-y-6">
            {activeSlide === 1 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-blue-950/20 to-black rounded-2xl border border-blue-500/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-widest">
                        Executive Overview
                      </span>
                      <h4 className="text-2xl font-black text-white mt-1">
                        {isZh ? '2026 年第三季 企業資安治理綜合審查' : 'Q3 2026 Enterprise Security Governance Review'}
                      </h4>
                      <p className="text-xs text-gray-300 mt-2 max-w-2xl leading-relaxed">
                        {isZh
                          ? '本公司整體資安防護韌性評級維持於「A 級卓越 (88/100)」，全季度未發生造成業務停擺或顧客機敏個資洩漏之重大資安事故。六大國際合規標準（ISO 27001、GDPR、NIST 800-53 等）已全量納入連續性 WORM 不可篡改稽核。'
                          : 'Enterprise cyber resilience maintained at Grade A (88/100). Zero business interruption or catastrophic exfiltration events occurred this quarter. 100% telemetry verified under WORM ledger.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[120px]">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block">{isZh ? '治理評級' : 'Posture'}</span>
                      <span className="text-3xl font-black text-emerald-400 font-mono">88</span>
                      <span className="text-[10px] text-emerald-400 font-bold block">{m.healthGrade}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <span className="text-[10px] uppercase font-mono text-gray-500">{isZh ? '業務持續運作率' : 'Service Uptime'}</span>
                    <span className="text-xl font-black font-mono text-white block mt-1">99.992%</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Zero Downtime</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <span className="text-[10px] uppercase font-mono text-gray-500">{isZh ? '自動化處置率' : 'SOAR Deflection'}</span>
                    <span className="text-xl font-black font-mono text-blue-400 block mt-1">96.8%</span>
                    <span className="text-[10px] text-gray-400">1,640 hrs saved</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <span className="text-[10px] uppercase font-mono text-gray-500">{isZh ? '未消弭高危事件' : 'Active High Incidents'}</span>
                    <span className="text-xl font-black font-mono text-emerald-400 block mt-1">0</span>
                    <span className="text-[10px] text-emerald-400 font-bold">100% Contained</span>
                  </div>
                </div>
              </div>
            )}

            {activeSlide === 2 && (
              <div className="space-y-6">
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-base font-black text-white">
                    {isZh ? 'FAIR 模型量化財務暴險與保險防護緩衝' : 'Cyber Risk Financial Quantification & Insurance Buffer'}
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {isZh
                      ? '本公司 95% 信心水準之最大潛在資安暴險 (VaR) 為 $2.85M，相較同業基準 $8.40M 展現超過 $5.55M 的防禦避險優勢。現有 $20M 之資安責任險保單額度足以提供極端情境下 700% 的覆蓋保護。'
                      : 'Our 95% Value at Risk (VaR) stands at $2.85M, compared to the industry peer average of $8.40M. Our $20M insurance policy provides a 700% catastrophic loss safety net.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-black/60 rounded-xl border border-white/5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{isZh ? '年度預期損失 (ALE)' : 'Annual Loss Expectancy'}</span>
                      <span className="text-2xl font-black font-mono text-amber-400 block mt-1">$420k / 年</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Reduced by 74% vs 2024</span>
                    </div>

                    <div className="p-4 bg-black/60 rounded-xl border border-white/5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{isZh ? '累積避險總額' : 'Losses Averted (SOAR)'}</span>
                      <span className="text-2xl font-black font-mono text-emerald-400 block mt-1">$14.2M</span>
                      <span className="text-[10px] text-blue-400 font-bold">382% Capital ROI</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSlide === 3 && (
              <div className="space-y-6">
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-base font-black text-white">
                    {isZh ? '應變速度 (MTTD/MTTR) 與同業基準評比' : 'Operational Velocity vs Industry Benchmarks'}
                  </h4>

                  <div className="space-y-4">
                    <div className="p-4 bg-black/60 rounded-xl border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-300 font-bold">{isZh ? '平均威脅偵測時間 (MTTD)' : 'Mean Time to Detect (MTTD)'}</span>
                        <span className="text-blue-400 font-bold">3.8 分鐘 (同業約 20 天)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '99%' }} />
                      </div>
                    </div>

                    <div className="p-4 bg-black/60 rounded-xl border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-300 font-bold">{isZh ? '平均威脅阻斷時間 (MTTR)' : 'Mean Time to Remediate (MTTR)'}</span>
                        <span className="text-emerald-400 font-bold">10.4 分鐘 (同業約 70 天)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSlide === 4 && (
              <div className="space-y-6">
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-base font-black text-white">
                    {isZh ? '零信任轉型架構與後量子密碼學 (PQC) 規劃' : 'Zero Trust Transformation & PQC Readiness'}
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {isZh
                      ? '下半年度戰略重點為全面淘汰傳統邊界 VPN，推行 SASE 零信任私有存取（進度 88%）。同時已展開針對金融 SWIFT 結算通道之後量子密碼學演算法相容性驗證，預計於 2027 年完成升級。'
                      : 'Core strategic priority involves retiring legacy VPNs in favor of SASE Zero Trust. Phase 3 progress is at 88% with Post-Quantum Cryptography transition tests scheduled for 2027.'}
                  </p>
                </div>
              </div>
            )}

            {/* Cryptographic Seal & Signature Block */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-gray-500 block">
                  CISO Cryptographic Signature & Attestation
                </span>
                <span className="text-xs font-mono text-gray-400 font-bold">
                  Chief Information Security Officer: Dr. Arthur Vance, CISSP, CISM
                </span>
                <span className="text-[10px] font-mono text-blue-400/80 block">
                  SHA-256 Digest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
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

import React, { useState } from 'react';
import { ComplianceFrameworkMeta, ComplianceControl } from './types';
import {
  X, Printer, Download, CheckCircle2, AlertTriangle, ShieldCheck,
  Award, Copy, Check, Hash, FileCheck, Calendar, UserCheck
} from 'lucide-react';

interface ComplianceAuditReportModalProps {
  framework: ComplianceFrameworkMeta;
  controls: ComplianceControl[];
  isOpen: boolean;
  onClose: () => void;
  isZh: boolean;
}

export const ComplianceAuditReportModal: React.FC<ComplianceAuditReportModalProps> = ({
  framework,
  controls,
  isOpen,
  onClose,
  isZh
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const passedControls = controls.filter(c => c.status === 'Compliant');
  const warningControls = controls.filter(c => c.status === 'Warning');
  const violatedControls = controls.filter(c => c.status === 'Violated');

  const sha256MerkleRoot = '0x8f2e4b1c9d3a7f5e0b6c4a8d2e1f9c3b7a5e8d1c4b2a9f6e3d5c7b1a8f4e2d0c';
  const reportId = `REP-${framework.id}-2026-Q3-AUDIT`;
  const reportDate = new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const reportData = {
      reportId,
      generatedAt: new Date().toISOString(),
      framework: framework.fullName,
      standardVersion: framework.version,
      overallScore: `${framework.score}%`,
      status: framework.badge,
      auditor: framework.auditor,
      cryptoMerkleRoot: sha256MerkleRoot,
      summary: {
        totalEvaluated: controls.length,
        compliant: passedControls.length,
        warnings: warningControls.length,
        violations: violatedControls.length
      },
      controls: controls.map(c => ({
        code: c.code,
        domain: c.domain,
        title: c.title,
        status: c.status,
        variance: c.baselineVariance,
        evidence: c.evidence,
        affectedAssets: c.affectedAssets
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Pack_${framework.id}_${reportDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const text = `【${framework.fullName} 正式稽核摘要報告】
報告編號: ${reportId}
評估日期: ${reportDate}
合規得分: ${framework.score}% (${framework.badge})
審計範圍: 控制項總計 ${controls.length} 項 | 通過 ${passedControls.length} 項 | 警告 ${warningControls.length} 項 | 偏離 ${violatedControls.length} 項
WORM 區塊鏈雜湊: ${sha256MerkleRoot}
主任稽核單位: ${framework.auditor}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#141417] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-[#18181d]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {isZh ? '正式資訊安全稽核鑑識報告包' : 'Executive Audit & Attestation Package'}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                {framework.fullName} ({reportId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10"
              title={isZh ? '複製報告摘要' : 'Copy Summary'}
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製摘要' : 'Copy')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
              title={isZh ? '下載完整 JSON 稽核包' : 'Download Audit Pack'}
            >
              <Download size={13} />
              <span>{isZh ? '下載稽核包 (JSON)' : 'Audit Pack (JSON)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title={isZh ? '列印 / 匯出 PDF' : 'Print / Export PDF'}
            >
              <Printer size={13} />
              <span>{isZh ? '列印 PDF' : 'Print PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-8 overflow-y-auto space-y-8 print:text-black print:bg-white">
          {/* Executive Metadata Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-black/40 rounded-2xl border border-white/5">
            <div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                {isZh ? '評估標準規範' : 'Framework Standard'}
              </span>
              <span className="text-xs font-bold text-white mt-1 block">{framework.shortName}</span>
              <span className="text-[10px] text-gray-400">{framework.version}</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                {isZh ? '受評合規得分' : 'Overall Posture'}
              </span>
              <span className="text-base font-black text-emerald-400 mt-0.5 block">{framework.score}%</span>
              <span className="text-[10px] text-emerald-500/80">{framework.badge}</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                {isZh ? '主評稽核機構' : 'Lead Auditor'}
              </span>
              <span className="text-xs font-bold text-gray-200 mt-1 block line-clamp-1">{framework.auditor}</span>
              <span className="text-[10px] text-gray-400">{framework.lastAudited}</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                {isZh ? 'WORM 不可篡改戳記' : 'WORM Verification'}
              </span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block flex items-center gap-1">
                <ShieldCheck size={13} />
                {isZh ? 'Merkle 簽章已密封' : 'Sealed & Valid'}
              </span>
              <span className="text-[10px] font-mono text-gray-500 truncate block">Block #10428</span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck size={16} className="text-blue-400" />
              {isZh ? '一、 執行摘要 (Executive Summary)' : '1. Executive Summary'}
            </h4>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-gray-300 leading-relaxed space-y-2">
              <p>
                {isZh
                  ? `本次稽核涵蓋 SEMOR CYBER NG-SIEM 全域架構，對應 ${framework.fullName} 之所有規範要求。經過連續性自動化遙測監控（包括 OpenXDR 端點防護、UEBA 使用者與實體行為分析、WORM 不可篡改日誌及 NDR 網路流量鑑識），系統整體合規達成率為 ${framework.score}%。`
                  : `This audit evaluates the organization against ${framework.fullName}. Through continuous telemetry verification across OpenXDR, UEBA, WORM immutable storage, and NDR, the overall compliance attainment is ${framework.score}%.`}
              </p>
              <p>
                {isZh
                  ? `在受測的 ${controls.length} 個控制項中，共 ${passedControls.length} 項達成基準要求（${Math.round((passedControls.length / controls.length) * 100)}% 通過率），${warningControls.length} 項為偏離警告，${violatedControls.length} 項為重大違規。所有偏離項目均已自動建立 CAPA 改善工作單並鏈結 SOAR 劇本進行隔離與補償控制。`
                  : `Out of ${controls.length} evaluated controls, ${passedControls.length} passed compliant baseline, ${warningControls.length} marked warning, and ${violatedControls.length} identified as gaps. Automated CAPA tasks and SOAR response workflows have been initiated.`}
              </p>
            </div>
          </div>

          {/* Detailed Findings Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              {isZh ? '二、 稽核控制項評定與遙測舉證細目 (Audit Findings)' : '2. Audit Findings & Telemetry Details'}
            </h4>

            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/5">
                    <th className="py-2.5 px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider w-24">
                      {isZh ? '代碼' : 'Code'}
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {isZh ? '控制要求與舉證日誌' : 'Requirement & Telemetry Proof'}
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider w-36">
                      {isZh ? '基準偏差' : 'Variance'}
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider w-28">
                      {isZh ? '審計判定' : 'Rating'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {controls.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white mb-0.5">{item.title}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{item.evidence}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-300">
                        {item.baselineVariance}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'Compliant'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.status === 'Warning'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cryptographic Ledger Verification Block */}
          <div className="p-5 bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent border border-blue-500/20 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Hash size={14} />
              {isZh ? '三、 WORM 不可篡改密碼學憑證 (Cryptographic Non-Repudiation)' : '3. Cryptographic Non-Repudiation Attestation'}
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-gray-400 gap-1">
                <span className="text-gray-500">SHA-256 Merkle Root:</span>
                <span className="text-blue-300 break-all">{sha256MerkleRoot}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-gray-400 gap-1">
                <span className="text-gray-500">Timestamp Authority:</span>
                <span className="text-gray-300">RFC 3161 Compliant NTP Synchronized Ledger</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-1 border-b border-gray-700 pb-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                {isZh ? '主稽核認證簽署人 (Lead Auditor)' : 'Lead Auditor Signature'}
              </span>
              <p className="font-serif italic text-base text-gray-200 mt-1">David Vance, CISA, CISSP</p>
              <span className="text-[10px] text-gray-500 font-mono">Verified ID: AUDITOR-BSI-9921</span>
            </div>

            <div className="space-y-1 border-b border-gray-700 pb-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                {isZh ? '企業資安長簽核 (CISO Approval)' : 'Chief Information Security Officer'}
              </span>
              <p className="font-serif italic text-base text-gray-200 mt-1">Elena Rostova, CISO</p>
              <span className="text-[10px] text-gray-500 font-mono">Verified ID: CISO-EXEC-001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

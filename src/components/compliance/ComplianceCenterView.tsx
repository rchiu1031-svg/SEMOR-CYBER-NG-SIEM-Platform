import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FrameworkId, ComplianceControl } from './types';
import {
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_CONTROLS_DATA,
  MOCK_WORM_LEDGER,
  MOCK_REMEDIATION_TASKS
} from './complianceData';
import { ComplianceFrameworkSelector } from './ComplianceFrameworkSelector';
import { ComplianceEvidenceMatrix } from './ComplianceEvidenceMatrix';
import { ComplianceAuditReportModal } from './ComplianceAuditReportModal';
import { ComplianceAssessmentRunnerModal } from './ComplianceAssessmentRunnerModal';
import { ComplianceGapRemediation } from './ComplianceGapRemediation';
import { ComplianceWormLedgerView } from './ComplianceWormLedgerView';
import { cn } from '../../lib/utils';
import {
  ShieldCheck, ShieldAlert, Award, Calendar, Package, Play,
  Scroll, FileCheck, Layers, Cpu, Activity, Database, Check,
  Sparkles, RefreshCw, BarChart3, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

export function ComplianceCenterView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const [frameworks, setFrameworks] = useState(COMPLIANCE_FRAMEWORKS);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<FrameworkId>('ISO27001');
  const [activeTab, setActiveTab] = useState<'matrix' | 'capa' | 'worm' | 'posture'>('matrix');

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

  // Selected framework and its controls
  const selectedFramework = frameworks.find(f => f.id === selectedFrameworkId) || frameworks[0];
  const frameworkControls = COMPLIANCE_CONTROLS_DATA.filter(c => c.framework === selectedFrameworkId);

  // Total metrics across all 6 frameworks
  const totalControls = frameworks.reduce((acc, f) => acc + f.totalControls, 0);
  const totalPassed = frameworks.reduce((acc, f) => acc + f.passedControls, 0);
  const totalWarnings = frameworks.reduce((acc, f) => acc + f.warningControls, 0);
  const totalViolations = frameworks.reduce((acc, f) => acc + f.violatedControls, 0);
  const averageScore = Math.round(
    frameworks.reduce((acc, f) => acc + f.score, 0) / frameworks.length
  );

  const handleScanCompleted = (fwId: FrameworkId, newScore: number) => {
    setFrameworks(prev =>
      prev.map(f =>
        f.id === fwId
          ? {
              ...f,
              score: newScore,
              lastAudited: new Date().toISOString().replace('T', ' ').slice(0, 16),
              passedControls: f.totalControls - 1,
              violatedControls: 0,
              warningControls: 1
            }
          : f
      )
    );
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Top Banner & Main Heading */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Award size={22} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {isZh ? '合規報表與連續性稽核中心' : 'Continuous Compliance & Audit Center'}
            </h2>
          </div>
          <p className="text-sm text-gray-400 tracking-wide">
            {isZh
              ? '支援 ISO 27001、GDPR、NIST SP 800-53、SOC 2 (TSC)、HIPAA 與 PCI DSS v4.0 六大國際標準之連續性遙測審計、WORM 不可篡改存證與正式稽核包生成。'
              : 'Audit-ready continuous monitoring, telemetry evidence verification, and cryptographic WORM attestation across 6 global standards.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-gray-300">
            <Calendar size={15} className="text-blue-400" />
            <span>{isZh ? '上次全檢: 2026-09-08 03:50' : 'Last Audit: 2026-09-08 03:50'}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAssessmentModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 shadow-lg"
          >
            <Play size={14} fill="currentColor" className="text-emerald-400" />
            <span>{isZh ? '啟動自動化全檢' : 'Run Assessment'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Package size={15} />
            <span>{isZh ? '生成完整稽核包' : 'Generate Audit Pack'}</span>
          </button>
        </div>
      </div>

      {/* Global Posture Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Compliance Score */}
        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              {isZh ? '六大標準綜合合規率' : 'Overall Posture Score'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Pass Grade A
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-white">{averageScore}%</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
              ↑ 2.4% (vs Q2)
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {isZh ? '通過 423 / 453 項關鍵控制項' : '423 of 453 controls compliant'}
          </p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${averageScore}%` }}
            />
          </div>
        </div>

        {/* Passed Controls */}
        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              {isZh ? '達標受測控制項' : 'Compliant Controls'}
            </span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-emerald-400">{totalPassed}</span>
            <span className="text-xs text-gray-500">/ {totalControls} 項</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {isZh ? '自動化遙測連續檢證通過' : 'Continuous telemetry verified'}
          </p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(totalPassed / totalControls) * 100}%` }}
            />
          </div>
        </div>

        {/* Gaps / Violations */}
        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              {isZh ? '待改善不合規缺口 (CAPA)' : 'Open Deficiencies'}
            </span>
            <ShieldAlert size={16} className="text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-rose-400">{totalViolations}</span>
            <span className="text-xs text-amber-400 font-bold">
              + {totalWarnings} {isZh ? '警告' : 'Warnings'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {isZh ? '已觸發 SOAR 自動化防護隔離' : 'SOAR automated defenses armed'}
          </p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${(totalViolations / totalControls) * 100 * 5}%` }}
            />
          </div>
        </div>

        {/* WORM Immutable Proof */}
        <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              {isZh ? 'WORM 不可篡改存證區塊' : 'WORM Merkle Blocks'}
            </span>
            <Database size={16} className="text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-blue-400">10,428</span>
            <span className="text-xs text-emerald-400 font-bold">100% Valid</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {isZh ? 'SHA-256 密碼學密封每 15m 執行' : 'Sealed every 15 mins'}
          </p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-500 rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Six Standards Navigation Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={13} className="text-blue-400" />
            {isZh ? '選擇合規稽核標準 (全方位 6 大國際架構)' : 'Select Regulatory Framework (6 Standards)'}
          </h3>
          <span className="text-[11px] text-gray-500 font-mono">
            Active: <strong className="text-white">{selectedFramework.fullName}</strong>
          </span>
        </div>

        <ComplianceFrameworkSelector
          frameworks={frameworks}
          selectedFrameworkId={selectedFrameworkId}
          onSelect={(id) => setSelectedFrameworkId(id)}
          isZh={isZh}
        />
      </div>

      {/* Selected Framework Banner */}
      <div className="p-6 bg-[#111114] border border-white/5 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-600 text-white font-mono">
              {selectedFramework.shortName}
            </span>
            <span className="text-xs font-mono text-gray-400">
              {selectedFramework.version}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {selectedFramework.badge}
            </span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-400">
              {isZh ? '主稽核認證機構:' : 'Lead Auditor:'} <strong className="text-gray-200">{selectedFramework.auditor}</strong>
            </span>
          </div>

          <h3 className="text-lg font-black text-white tracking-tight">
            {selectedFramework.fullName}
          </h3>

          <p className="text-xs text-gray-400 max-w-4xl leading-relaxed">
            {selectedFramework.description}
          </p>

          {/* Domain Breakdown Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {selectedFramework.domains.map((dom, i) => (
              <div
                key={i}
                className="px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-300 font-medium flex items-center gap-1.5"
              >
                <span>{dom.name}</span>
                <span className="font-mono font-bold text-blue-400">{dom.score}%</span>
                <span className="text-[9px] text-gray-500 font-mono">({dom.passedControls}/{dom.totalControls})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side Score Card */}
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-row lg:flex-col items-center justify-center min-w-[160px] text-center gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
              {isZh ? '當前框架達成率' : 'Framework Attainment'}
            </span>
            <span className="text-3xl font-black font-mono text-emerald-400 block mt-1">
              {selectedFramework.score}%
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all"
          >
            {isZh ? '檢視正式報告' : 'View Report'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'matrix'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Scroll size={14} />
          <span>{isZh ? '稽核軌跡舉證矩陣' : 'Evidence Matrix'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {frameworkControls.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('capa')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'capa'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <AlertTriangle size={14} />
          <span>{isZh ? '缺陷改善清單 (CAPA)' : 'Gap Remediation'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-mono">
            {MOCK_REMEDIATION_TASKS.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('worm')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'worm'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Database size={14} />
          <span>{isZh ? 'WORM 不可篡改存證鏈' : 'WORM Ledger'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-300 font-mono">
            10.4k
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('posture')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'posture'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <BarChart3 size={14} />
          <span>{isZh ? '資產覆蓋與行為風險散佈' : 'Posture & Risk Scatter'}</span>
        </button>
      </div>

      {/* Sub-Tab 1: Evidence Matrix */}
      {activeTab === 'matrix' && (
        <ComplianceEvidenceMatrix
          framework={selectedFramework}
          controls={frameworkControls}
          isZh={isZh}
        />
      )}

      {/* Sub-Tab 2: CAPA Remediation */}
      {activeTab === 'capa' && (
        <ComplianceGapRemediation
          tasks={MOCK_REMEDIATION_TASKS}
          isZh={isZh}
        />
      )}

      {/* Sub-Tab 3: Immutable WORM Ledger */}
      {activeTab === 'worm' && (
        <ComplianceWormLedgerView
          ledgerRecords={MOCK_WORM_LEDGER}
          isZh={isZh}
        />
      )}

      {/* Sub-Tab 4: Posture & Risk Scatter */}
      {activeTab === 'posture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Access Profile Risk Scatter */}
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                {isZh ? '存取行為風險散佈圖 (UEBA + IAM 關聯)' : 'Access Profile Risk Scatter'}
              </h4>
              <span className="text-[10px] font-mono text-gray-500">Live Telemetry</span>
            </div>

            <div className="h-64 flex items-center justify-center relative bg-black/40 rounded-2xl border border-white/5 p-4">
              {/* Axes lines */}
              <div className="absolute inset-0 flex items-end px-4 pb-4 pointer-events-none">
                <div className="w-0.5 h-full bg-white/10" />
                <div className="w-full h-0.5 bg-white/10" />
              </div>

              {/* Data points */}
              {[
                { x: 20, y: 30, color: 'blue', label: 'David (Dev)' },
                { x: 45, y: 55, color: 'blue', label: 'Sarah (DPO)' },
                { x: 86, y: 82, color: 'red', label: 'Kevin (ADM - 異常偏離 850%)' },
                { x: 62, y: 40, color: 'blue', label: 'Grace (SecOps)' },
                { x: 12, y: 15, color: 'blue', label: 'Service-Bot' },
                { x: 74, y: 68, color: 'amber', label: 'CI/CD Deployer (過度特權)' }
              ].map((dot, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "absolute w-4 h-4 rounded-full border-2 border-[#0c0c0e] shadow-xl group cursor-pointer",
                    dot.color === 'red'
                      ? "bg-rose-500 z-20 animate-ping-slow"
                      : dot.color === 'amber'
                      ? "bg-amber-400 z-10"
                      : "bg-blue-500"
                  )}
                  style={{ left: `${dot.x}%`, bottom: `${dot.y}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black/90 border border-white/20 px-2 py-1 rounded text-[9px] font-bold text-white whitespace-nowrap z-30 shadow-xl">
                    {dot.label}
                  </div>
                </motion.div>
              ))}

              <div className="absolute bottom-2 right-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                {isZh ? '存取頻率 →' : 'Access Frequency →'}
              </div>
              <div className="absolute top-4 left-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                {isZh ? '↑ 資料敏感度' : '↑ Data Sensitivity'}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              {isZh
                ? '紅色節點代表特權帳號高風險操作異常（如壓縮資料庫轉儲檔或異常異地存取），已自動串接 SOAR 防護。'
                : 'Red indicators represent extreme behavioral deviations flagged by UEBA.'}
            </p>
          </div>

          {/* Asset Monitoring Coverage */}
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu size={16} className="text-emerald-500" />
                {isZh ? '全網資產合規監控覆蓋率' : 'Asset Monitoring Coverage'}
              </h4>
              <span className="text-[10px] font-mono text-emerald-400">420/420 Nodes</span>
            </div>

            <div className="space-y-4">
              {[
                { label: isZh ? '財務與持卡人核心資料庫 (CDE)' : 'Financial & CDE Core DB', val: 100, standard: 'PCI-DSS Req 3.4' },
                { label: isZh ? '研發與程式碼 Git 伺服器 (CI/CD)' : 'R&D Git Repositories', val: 95, standard: 'SOC 2 CC8.1' },
                { label: isZh ? '雲端網路出站端點 (Egress EDR)' : 'Cloud Egress Endpoints', val: 100, standard: 'GDPR Art. 44' },
                { label: isZh ? '醫療終端與影像歸檔 PACS VLAN' : 'ePHI Healthcare Terminal VLAN', val: 92, standard: 'HIPAA § 164.312' },
                { label: isZh ? 'OT/IoT 邊界閘道與控制網路' : 'IoT / OT Control Gateways', val: 86, standard: 'NIST SP 800-53' }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-200">{item.label}</span>
                      <span className="text-[9px] font-mono text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">
                        {item.standard}
                      </span>
                    </div>
                    <span className="text-xs font-black text-white font-mono">{item.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      className={cn(
                        "h-full rounded-full",
                        item.val === 100 ? "bg-emerald-500" : item.val >= 90 ? "bg-blue-500" : "bg-amber-500"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Report Modal */}
      <ComplianceAuditReportModal
        framework={selectedFramework}
        controls={frameworkControls}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        isZh={isZh}
      />

      {/* Assessment Runner Modal */}
      <ComplianceAssessmentRunnerModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        selectedFrameworkId={selectedFrameworkId}
        onScanCompleted={handleScanCompleted}
        isZh={isZh}
      />
    </div>
  );
}
export default ComplianceCenterView;

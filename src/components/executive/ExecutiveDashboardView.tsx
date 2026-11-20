import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Package,
  Eye,
  Activity,
  DollarSign,
  Building2,
  Target,
  AlertOctagon,
  Scroll,
  Play,
  Database,
  BarChart3,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import type {
  ExecutiveTimeRange,
  CtoGovernanceOverviewResponse,
  CtoTechPillar,
  StrategicRoadmapItem
} from './types';
import type { FrameworkId, ComplianceControl, RemediationTask } from '../compliance/types';
import { ExecutiveMetricsGrid } from './ExecutiveMetricsGrid';
import { ExecutiveTrendChart } from './ExecutiveTrendChart';
import { ExecutiveBusinessRiskMatrix } from './ExecutiveBusinessRiskMatrix';
import { ExecutiveFinancialExposureView } from './ExecutiveFinancialExposureView';
import { ExecutiveAiBriefing } from './ExecutiveAiBriefing';
import { ExecutiveStrategicRoadmap } from './ExecutiveStrategicRoadmap';
import { ExecutiveBoardPackModal } from './ExecutiveBoardPackModal';
import { ExecutiveActionModal } from './ExecutiveActionModal';
import { ComplianceFrameworkSelector } from '../compliance/ComplianceFrameworkSelector';
import { ComplianceEvidenceMatrix } from '../compliance/ComplianceEvidenceMatrix';
import { ComplianceGapRemediation } from '../compliance/ComplianceGapRemediation';
import { ComplianceWormLedgerView } from '../compliance/ComplianceWormLedgerView';
import { ComplianceAuditReportModal } from '../compliance/ComplianceAuditReportModal';
import { ComplianceAssessmentRunnerModal } from '../compliance/ComplianceAssessmentRunnerModal';

export type UnifiedCtoSection = 'overview' | 'compliance' | 'architecture' | 'financial' | 'roadmap';

export interface ExecutiveDashboardViewProps {
  setActiveTab: (tab: string) => void;
  initialSection?: UnifiedCtoSection;
}

export function ExecutiveDashboardView({
  setActiveTab,
  initialSection = 'overview'
}: ExecutiveDashboardViewProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const [timeRange, setTimeRange] = useState<ExecutiveTimeRange>('30d');
  const [activeSection, setActiveSection] = useState<UnifiedCtoSection>(initialSection);

  // Compliance nested state
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<FrameworkId>('ISO27001');
  const [complianceSubTab, setComplianceSubTab] = useState<'matrix' | 'capa' | 'worm' | 'posture'>('matrix');

  // Live backend state
  const [overviewData, setOverviewData] = useState<CtoGovernanceOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshSignal, setRefreshSignal] = useState<number>(0);

  // Modals state
  const [isBoardPackOpen, setIsBoardPackOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAuditReportOpen, setIsAuditReportOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const fetchOverview = useCallback(async (range: ExecutiveTimeRange) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/cto-governance/overview?timeRange=${encodeURIComponent(range)}`);
      if (res.ok) {
        const json: CtoGovernanceOverviewResponse = await res.json();
        setOverviewData(json);
      }
    } catch (err) {
      console.error('Failed to fetch CTO governance overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(timeRange);
  }, [timeRange, fetchOverview]);

  const reloadAll = useCallback(async () => {
    await fetchOverview(timeRange);
    setRefreshSignal((s) => s + 1);
  }, [fetchOverview, timeRange]);

  const frameworks = overviewData?.frameworks || [];
  const controls = overviewData?.controls || [];
  const wormLedger = overviewData?.wormLedger || [];
  const remediationTasks = overviewData?.remediationTasks || [];
  const techPillars = overviewData?.techPillars || [];
  const approvals = overviewData?.approvals || [];
  const assetCoverage = overviewData?.assetCoverage || [];

  const selectedFramework = frameworks.find((f) => f.id === selectedFrameworkId) || frameworks[0];
  const frameworkControls = controls.filter((c) => c.framework === selectedFrameworkId);

  const pendingApprovalsCount =
    overviewData?.complianceSummary?.pendingApprovalsCount ??
    approvals.filter((a) => a.status === 'pending').length;
  const openCapaCount = remediationTasks.filter((t) => t.status !== 'Resolved').length;

  // Handlers calling backend endpoints
  const handleTriggerControlPlaybook = async (control: ComplianceControl) => {
    try {
      await fetch(`/api/v1/cto-governance/compliance/capa/${encodeURIComponent(control.id)}/playbook`, {
        method: 'POST'
      });
      await reloadAll();
    } catch (err) {
      console.error('Failed to trigger control playbook:', err);
    }
  };

  const handleRunCapaAction = async (task: RemediationTask) => {
    try {
      await fetch(`/api/v1/cto-governance/compliance/capa/${encodeURIComponent(task.id)}/playbook`, {
        method: 'POST'
      });
      await reloadAll();
    } catch (err) {
      console.error('Failed to trigger CAPA playbook:', err);
    }
  };

  const handleResolveCapaTask = async (taskId: string) => {
    try {
      await fetch(`/api/v1/cto-governance/compliance/capa/${encodeURIComponent(taskId)}/resolve`, {
        method: 'POST'
      });
      await reloadAll();
    } catch (err) {
      console.error('Failed to resolve CAPA task:', err);
    }
  };

  const handleVerifyWormChain = async () => {
    try {
      const res = await fetch('/api/v1/cto-governance/compliance/worm/verify', {
        method: 'POST'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to verify WORM chain:', err);
    }
    return null;
  };

  const handleUpdateRoadmap = async (
    id: string,
    updates: Partial<Pick<StrategicRoadmapItem, 'progress' | 'status'>>
  ) => {
    try {
      const res = await fetch(`/api/v1/cto-governance/roadmap/${encodeURIComponent(id)}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await reloadAll();
      }
    } catch (err) {
      console.error('Failed to update roadmap milestone:', err);
    }
  };

  const handleJumpToFramework = (fwId: FrameworkId) => {
    setSelectedFrameworkId(fwId);
    setComplianceSubTab('matrix');
    setActiveSection('compliance');
  };

  return (
    <div className="w-full space-y-7 pb-20">
      {/* Top Banner & CTO Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Award size={20} />
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {isZh ? 'CTO 技術治理與合規洞察中心' : 'CTO Governance, Risk & Compliance Hub'}
            </h2>
          </div>
          <p className="text-xs lg:text-sm text-gray-400 tracking-wide">
            {isZh
              ? '為 CTO 與董監事會打造之整合決策視圖：串聯 CI/CD 供應鏈、零信任架構、FAIR 財務風險、六大國際合規遙測舉證與 WORM 不可篡改存證。'
              : 'Unified CTO governance hub integrating engineering security pillars, FAIR financial risk, 6-framework compliance telemetry, and immutable WORM attestation.'}
          </p>
        </div>

        {/* Single-line crisp actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl shrink-0">
            {[
              { id: '7d', label: isZh ? '7 天' : '7D' },
              { id: '30d', label: isZh ? '30 天' : '30D' },
              { id: '90d', label: isZh ? '本季 Q3' : 'Q3' }
            ].map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setTimeRange(range.id as ExecutiveTimeRange)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap',
                  timeRange === range.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsActionModalOpen(true)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border whitespace-nowrap shrink-0',
              pendingApprovalsCount > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-gray-300 border-white/10'
            )}
          >
            <AlertOctagon size={14} className={pendingApprovalsCount > 0 ? 'text-amber-400' : ''} />
            <span>{isZh ? '緊急授權' : 'Authorizations'}</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-black text-[10px] leading-none">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAssessmentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Play size={13} fill="currentColor" className="text-emerald-400" />
            <span>{isZh ? '合規全檢' : 'Run Audit'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBoardPackOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Package size={14} />
            <span>{isZh ? 'CTO 簡報稽核包' : 'CTO Audit Pack'}</span>
          </button>

          <button
            type="button"
            onClick={reloadAll}
            title={isZh ? '重新整理遙測數據' : 'Refresh Telemetry'}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl transition-colors shrink-0"
          >
            <RefreshCw size={14} className={cn(isLoading && 'animate-spin text-blue-400')} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Eye size={14} />
            <span>{isZh ? '即時戰情' : 'War Room'}</span>
          </button>
        </div>
      </div>

      {/* Unified Top KPI Band */}
      <ExecutiveMetricsGrid
        isZh={isZh}
        metrics={overviewData?.overviewMetrics}
        complianceSummary={overviewData?.complianceSummary}
        onOpenFinancialModal={() => setActiveSection('financial')}
        onOpenComplianceTab={() => setActiveSection('compliance')}
      />

      {/* Primary Section Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2.5 overflow-x-auto">
        {[
          {
            id: 'overview',
            icon: Activity,
            label: isZh ? 'CTO 戰略總覽與技術支柱' : 'CTO Overview & Tech Pillars'
          },
          {
            id: 'compliance',
            icon: Scroll,
            label: isZh ? '法規合規與連續稽核 (6大標準)' : 'Compliance & WORM Audit',
            badge: openCapaCount > 0 ? `${openCapaCount} CAPA` : undefined
          },
          {
            id: 'architecture',
            icon: Building2,
            label: isZh ? '事業群風險與 SLA 韌性' : 'Business Units & SLA Resilience'
          },
          {
            id: 'financial',
            icon: DollarSign,
            label: isZh ? 'FAIR 財務風險與 ROI' : 'FAIR Financial Risk & ROI'
          },
          {
            id: 'roadmap',
            icon: Target,
            label: isZh ? '零信任藍圖與 CTO 投資' : 'Zero Trust Roadmap & Briefing'
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as UnifiedCtoSection)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold',
                    active ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: CTO Strategic Overview */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* 4 CTO Technology & Architecture Pillars */}
          {techPillars.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={14} className="text-blue-400" />
                  {isZh
                    ? 'CTO 核心技術安全支柱與工程治理指標'
                    : 'CTO Core Architecture & Engineering Security Pillars'}
                </h3>
                <span className="text-[11px] font-mono text-gray-400">
                  {isZh ? '點擊法規標籤可直達稽核舉證' : 'Click framework badge to inspect evidence'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {techPillars.map((pillar: CtoTechPillar) => (
                  <div
                    key={pillar.id}
                    className="p-5 bg-[#111114] border border-white/10 rounded-2xl flex flex-col justify-between space-y-3 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-gray-400 uppercase truncate">
                          {pillar.domain}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-black font-mono tabular-nums shrink-0',
                            pillar.status === 'optimal'
                              ? 'text-emerald-400'
                              : pillar.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          )}
                        >
                          {pillar.score}%
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-white leading-snug">
                        {isZh ? pillar.nameZh : pillar.nameEn}
                      </h4>

                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl">
                        <span className="text-[10px] text-gray-400 block">
                          {isZh ? pillar.keyMetricLabelZh : pillar.keyMetricLabelEn}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-400 tabular-nums">
                          {pillar.keyMetricValue}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                        {isZh ? pillar.summaryZh : pillar.summaryEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-gray-500 truncate">{pillar.owner}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {pillar.linkedFrameworks.map((fw) => (
                          <button
                            key={fw}
                            type="button"
                            onClick={() => handleJumpToFramework(fw)}
                            className="px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[9px] font-mono font-bold transition-colors"
                          >
                            {fw}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend Velocity & Financial Savings */}
          <ExecutiveTrendChart
            timeRange={timeRange}
            isZh={isZh}
            data={overviewData?.activeTrends}
          />

          {/* Bottom Split: AI Briefing + Live 6-Framework Compliance Readiness Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ExecutiveAiBriefing
                isZh={isZh}
                defaultPersona="cto"
                refreshSignal={refreshSignal}
              />
            </div>

            {/* Integrated Compliance Maturity Card */}
            <div className="p-6 bg-[#111114] border border-white/10 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                      Continuous GRC Attestation
                    </span>
                    <h4 className="text-base font-black text-white mt-1">
                      {isZh ? '六大國際法規合規成熟度' : 'Global Compliance Readiness'}
                    </h4>
                  </div>
                  <span className="text-lg font-black font-mono tabular-nums text-emerald-400">
                    {overviewData?.complianceSummary?.averageScore ?? 94}%
                  </span>
                </div>

                <div className="space-y-2.5">
                  {frameworks.map((fw) => (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => handleJumpToFramework(fw.id)}
                      className="w-full p-2.5 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-blue-500/30 rounded-xl text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                          {fw.shortName}
                        </span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          {fw.violatedControls > 0 && (
                            <span className="text-[10px] text-rose-400 font-bold">
                              {fw.violatedControls} {isZh ? '缺口' : 'gap'}
                            </span>
                          )}
                          <span className="text-emerald-400 font-black">{fw.score}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            fw.score >= 95 ? 'bg-emerald-500' : fw.score >= 90 ? 'bg-blue-500' : 'bg-amber-500'
                          )}
                          style={{ width: `${fw.score}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSection('compliance')}
                className="w-full py-2.5 bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Scroll size={14} />
                <span>{isZh ? '進入完整合規舉證與 CAPA 中心' : 'Open Full Compliance & CAPA Center'}</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Unified Compliance Center */}
      {activeSection === 'compliance' && selectedFramework && (
        <div className="space-y-6">
          {/* 6 Standards Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-400" />
                {isZh ? '選擇法規稽核框架 (6 大國際標準)' : 'Select Regulatory Framework (6 Standards)'}
              </h3>
              <span className="text-[11px] text-gray-400 font-mono">
                {selectedFramework.fullName} · Last Audited: {selectedFramework.lastAudited}
              </span>
            </div>

            <ComplianceFrameworkSelector
              frameworks={frameworks}
              selectedFrameworkId={selectedFrameworkId}
              onSelect={(id) => setSelectedFrameworkId(id)}
              isZh={isZh}
            />
          </div>

          {/* Selected Framework Detail Banner */}
          <div className="p-6 bg-[#111114] border border-white/10 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-600 text-white font-mono">
                  {selectedFramework.shortName}
                </span>
                <span className="text-xs font-mono text-gray-400">{selectedFramework.version}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {selectedFramework.badge}
                </span>
                <span className="text-xs text-gray-400">
                  · {isZh ? '稽核單位:' : 'Auditor:'}{' '}
                  <strong className="text-gray-200">{selectedFramework.auditor}</strong>
                </span>
              </div>

              <h3 className="text-lg font-black text-white tracking-tight">
                {selectedFramework.fullName}
              </h3>

              <p className="text-xs text-gray-400 max-w-4xl leading-relaxed">
                {selectedFramework.description}
              </p>

              {/* Domain Breakdown */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {selectedFramework.domains.map((dom, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-gray-300 font-medium flex items-center gap-1.5"
                  >
                    <span>{dom.name}</span>
                    <span className="font-mono font-bold text-blue-400 tabular-nums">{dom.score}%</span>
                    <span className="text-[10px] text-gray-500 font-mono tabular-nums">
                      ({dom.passedControls}/{dom.totalControls})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-white/10 rounded-xl flex flex-row lg:flex-col items-center justify-center min-w-[160px] text-center gap-3 shrink-0">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  {isZh ? '框架合規率' : 'Attainment'}
                </span>
                <span className="text-3xl font-black font-mono tabular-nums text-emerald-400 block mt-0.5">
                  {selectedFramework.score}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditReportOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
              >
                {isZh ? '檢視稽核報告' : 'Audit Report'}
              </button>
            </div>
          </div>

          {/* Compliance Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setComplianceSubTab('matrix')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap',
                complianceSubTab === 'matrix'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Scroll size={14} />
              <span>{isZh ? '稽核軌跡舉證矩陣' : 'Evidence Matrix'}</span>
              <span className="font-mono text-[10px] opacity-80">({frameworkControls.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setComplianceSubTab('capa')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap',
                complianceSubTab === 'capa'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <AlertTriangle size={14} />
              <span>{isZh ? '缺陷改善清單 (CAPA)' : 'Gap Remediation'}</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px]">
                {openCapaCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setComplianceSubTab('worm')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap',
                complianceSubTab === 'worm'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Database size={14} />
              <span>{isZh ? 'WORM 不可篡改存證鏈' : 'WORM Ledger'}</span>
              <span className="font-mono text-[10px] text-emerald-400">
                ({wormLedger.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setComplianceSubTab('posture')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap',
                complianceSubTab === 'posture'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <BarChart3 size={14} />
              <span>{isZh ? '資產覆蓋與 UEBA 風險散佈' : 'Asset Coverage & UEBA'}</span>
            </button>
          </div>

          {complianceSubTab === 'matrix' && (
            <ComplianceEvidenceMatrix
              framework={selectedFramework}
              controls={frameworkControls}
              isZh={isZh}
              onTriggerPlaybook={handleTriggerControlPlaybook}
              onAssignRemediation={() => setComplianceSubTab('capa')}
            />
          )}

          {complianceSubTab === 'capa' && (
            <ComplianceGapRemediation
              tasks={remediationTasks}
              isZh={isZh}
              onRunAction={handleRunCapaAction}
              onResolveTask={handleResolveCapaTask}
            />
          )}

          {complianceSubTab === 'worm' && (
            <ComplianceWormLedgerView
              ledgerRecords={wormLedger}
              isZh={isZh}
              onVerifyChain={handleVerifyWormChain}
            />
          )}

          {complianceSubTab === 'posture' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Access Profile Risk Scatter */}
              <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={15} className="text-blue-500" />
                    {isZh ? '存取行為風險散佈圖 (UEBA + IAM)' : 'Access Profile Risk Scatter'}
                  </h4>
                  <span className="text-[10px] font-mono text-gray-400">Live Telemetry</span>
                </div>

                <div className="h-64 flex items-center justify-center relative bg-black/40 rounded-xl border border-white/10 p-4">
                  <div className="absolute inset-0 flex items-end px-4 pb-4 pointer-events-none">
                    <div className="w-0.5 h-full bg-white/10" />
                    <div className="w-full h-0.5 bg-white/10" />
                  </div>

                  {[
                    { x: 20, y: 30, color: 'blue', label: 'David (Dev)' },
                    { x: 45, y: 55, color: 'blue', label: 'Sarah (DPO)' },
                    { x: 86, y: 82, color: 'red', label: 'Kevin (ADM - +850% 異常偏離)' },
                    { x: 62, y: 40, color: 'blue', label: 'Grace (SecOps)' },
                    { x: 12, y: 15, color: 'blue', label: 'Service-Bot' },
                    { x: 74, y: 68, color: 'amber', label: 'CI/CD Deployer (過度特權)' }
                  ].map((dot, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn(
                        'absolute w-3.5 h-3.5 rounded-full border-2 border-[#0c0c0e] shadow-lg group cursor-pointer',
                        dot.color === 'red'
                          ? 'bg-rose-500 z-20'
                          : dot.color === 'amber'
                          ? 'bg-amber-400 z-10'
                          : 'bg-blue-500'
                      )}
                      style={{ left: `${dot.x}%`, bottom: `${dot.y}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black/90 border border-white/20 px-2 py-1 rounded text-[10px] font-bold text-white whitespace-nowrap z-30">
                        {dot.label}
                      </div>
                    </motion.div>
                  ))}

                  <div className="absolute bottom-2 right-4 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                    {isZh ? '存取頻率 →' : 'Access Frequency →'}
                  </div>
                  <div className="absolute top-4 left-2 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                    {isZh ? '↑ 資料敏感度' : '↑ Data Sensitivity'}
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {isZh
                    ? '紅色節點代表特權帳號高風險操作偏離，已串接 SOAR 自動化撤銷與 WORM 存證。'
                    : 'Red nodes highlight high-risk privileged deviations linked to SOAR containment.'}
                </p>
              </div>

              {/* Asset Monitoring Coverage */}
              <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Cpu size={15} className="text-emerald-500" />
                    {isZh ? '全網資產合規監控覆蓋率' : 'Asset Monitoring Coverage'}
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-nums">
                    420/420 Nodes
                  </span>
                </div>

                <div className="space-y-3">
                  {assetCoverage.map((item) => (
                    <div key={item.id} className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-baseline gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-200">
                            {isZh ? item.labelZh : item.labelEn}
                          </span>
                          <span className="text-[9px] font-mono text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">
                            {item.standard}
                          </span>
                        </div>
                        <span className="text-xs font-black text-white font-mono tabular-nums shrink-0">
                          {item.coveragePct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            item.coveragePct === 100
                              ? 'bg-emerald-500'
                              : item.coveragePct >= 90
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          )}
                          style={{ width: `${item.coveragePct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Architecture, Business Units & Services SLA */}
      {activeSection === 'architecture' && (
        <ExecutiveBusinessRiskMatrix
          isZh={isZh}
          departments={overviewData?.departmentRisks}
          services={overviewData?.businessServices}
          assetCoverage={assetCoverage}
        />
      )}

      {/* SECTION 4: FAIR Financial Cyber Risk & ROI */}
      {activeSection === 'financial' && (
        <ExecutiveFinancialExposureView
          isZh={isZh}
          financialExposure={overviewData?.financialExposure}
        />
      )}

      {/* SECTION 5: Zero Trust Roadmap & Executive Briefing */}
      {activeSection === 'roadmap' && (
        <div className="space-y-6">
          <ExecutiveStrategicRoadmap
            isZh={isZh}
            roadmap={overviewData?.strategicRoadmap}
            onUpdateRoadmap={handleUpdateRoadmap}
          />
          <ExecutiveAiBriefing
            isZh={isZh}
            defaultPersona="cto"
            refreshSignal={refreshSignal}
          />
        </div>
      )}

      {/* Modals */}
      <ExecutiveBoardPackModal
        isOpen={isBoardPackOpen}
        onClose={() => setIsBoardPackOpen(false)}
        isZh={isZh}
        metrics={overviewData?.overviewMetrics}
        financialExposure={overviewData?.financialExposure}
        frameworks={frameworks}
        techPillars={techPillars}
        wormLedger={wormLedger}
        complianceSummary={overviewData?.complianceSummary}
      />

      <ExecutiveActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        isZh={isZh}
        approvals={approvals}
        onActionProcessed={() => {
          reloadAll();
        }}
      />

      {selectedFramework && (
        <ComplianceAuditReportModal
          framework={selectedFramework}
          controls={frameworkControls}
          isOpen={isAuditReportOpen}
          onClose={() => setIsAuditReportOpen(false)}
          isZh={isZh}
        />
      )}

      <ComplianceAssessmentRunnerModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        selectedFrameworkId={selectedFrameworkId}
        onScanCompleted={() => {
          reloadAll();
        }}
        isZh={isZh}
      />
    </div>
  );
}

export default ExecutiveDashboardView;

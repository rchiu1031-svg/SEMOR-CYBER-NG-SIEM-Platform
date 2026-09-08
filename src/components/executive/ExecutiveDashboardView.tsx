import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Award,
  Calendar,
  Package,
  Eye,
  Download,
  Share2,
  TrendingUp,
  Activity,
  DollarSign,
  Building2,
  FileText,
  Target,
  AlertOctagon,
  Sparkles,
  Scroll,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ExecutiveTimeRange } from './types';
import { ExecutiveMetricsGrid } from './ExecutiveMetricsGrid';
import { ExecutiveTrendChart } from './ExecutiveTrendChart';
import { ExecutiveBusinessRiskMatrix } from './ExecutiveBusinessRiskMatrix';
import { ExecutiveFinancialExposureView } from './ExecutiveFinancialExposureView';
import { ExecutiveAiBriefing } from './ExecutiveAiBriefing';
import { ExecutiveStrategicRoadmap } from './ExecutiveStrategicRoadmap';
import { ExecutiveBoardPackModal } from './ExecutiveBoardPackModal';
import { ExecutiveActionModal } from './ExecutiveActionModal';
import { PENDING_EXECUTIVE_APPROVALS } from './executiveData';

export interface ExecutiveDashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export function ExecutiveDashboardView({ setActiveTab }: ExecutiveDashboardViewProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const [timeRange, setTimeRange] = useState<ExecutiveTimeRange>('30d');
  const [activeTab, setActiveTabLocal] = useState<'posture' | 'financial' | 'business' | 'roadmap'>('posture');

  // Modals state
  const [isBoardPackOpen, setIsBoardPackOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(
    PENDING_EXECUTIVE_APPROVALS.filter(a => a.status === 'pending').length
  );

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Award size={22} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {isZh ? '主管資安決策與董監事治理儀表板' : 'Executive Security Insights & Board Governance'}
            </h2>
          </div>
          <p className="text-sm text-gray-400 tracking-wide">
            {isZh
              ? '為 CISO、執行長、財務長與董監事會量身打造之高階資安戰略視圖：整合 FAIR 財務風險量化、自主防護 ROI、事業體風控與應變速度 (MTTR)。'
              : 'Strategic cyber defense overview for CISO and Board: FAIR financial quantification, SOAR ROI, and mission-critical resilience.'}
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl">
            {[
              { id: '7d', label: isZh ? '過去 7 天' : '7D' },
              { id: '30d', label: isZh ? '本月 (30天)' : '30D' },
              { id: '90d', label: isZh ? '本季 (Q3)' : 'Q3' }
            ].map(range => (
              <button
                key={range.id}
                type="button"
                onClick={() => setTimeRange(range.id as ExecutiveTimeRange)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  timeRange === range.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Pending Executive Authorizations button */}
          <button
            type="button"
            onClick={() => setIsActionModalOpen(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border active:scale-95 shadow-lg",
              pendingApprovalsCount > 0
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-white/5 text-gray-400 border-white/10"
            )}
          >
            <AlertOctagon size={14} className={pendingApprovalsCount > 0 ? "text-amber-400 animate-pulse" : ""} />
            <span>{isZh ? '主管緊急授權' : 'Authorizations'}</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-mono font-black text-[10px]">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Generate Board Presentation Pack */}
          <button
            type="button"
            onClick={() => setIsBoardPackOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Package size={14} />
            <span>{isZh ? '董監事季報簡報包' : 'Board Presentation Pack'}</span>
          </button>

          {/* Jump to Real-Time War Room */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-2xl text-xs font-bold transition-all"
            title={isZh ? '切換至工程即時戰情視圖' : 'Switch to Real-Time War Room'}
          >
            <Eye size={14} />
            <span className="hidden sm:inline">{isZh ? '即時戰情' : 'War Room'}</span>
          </button>
        </div>
      </div>

      {/* Top Layer: Executive KPI Cards */}
      <ExecutiveMetricsGrid
        isZh={isZh}
        onOpenFinancialModal={() => setActiveTabLocal('financial')}
      />

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTabLocal('posture')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'posture'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Activity size={14} />
          <span>{isZh ? '全景戰略防禦與趨勢' : 'Strategic Posture & Trends'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabLocal('financial')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'financial'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <DollarSign size={14} />
          <span>{isZh ? 'FAIR 財務量化與 ROI' : 'FAIR Cyber Risk & ROI'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabLocal('business')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'business'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Building2 size={14} />
          <span>{isZh ? '事業群風險與核心服務' : 'Business Units & Core Services'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabLocal('roadmap')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'roadmap'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Target size={14} />
          <span>{isZh ? '零信任進程與高管 AI 備忘' : 'Roadmap & AI Executive Briefing'}</span>
        </button>
      </div>

      {/* Tab 1: Strategic Posture & Trends */}
      {activeTab === 'posture' && (
        <div className="space-y-8">
          <ExecutiveTrendChart timeRange={timeRange} isZh={isZh} />

          {/* Side by side: AI Executive Briefing snippet & Compliance shortcut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ExecutiveAiBriefing isZh={isZh} />
            </div>

            {/* Compliance Quick Link Card */}
            <div className="p-6 bg-[#111114] border border-white/5 rounded-3xl flex flex-col justify-between space-y-4 shadow-xl">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                  Regulatory Governance
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  {isZh ? '六大國際法規合規成熟度' : 'Global Standards Compliance'}
                </h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {isZh
                    ? '全面整合 ISO 27001、GDPR、NIST 800-53、SOC 2、HIPAA 與 PCI DSS v4.0。所有關鍵控制項均透過不可篡改之 WORM 密碼學區塊鏈存證。'
                    : 'Audited continuously across 6 frameworks with cryptographic WORM Merkle tree proofs.'}
                </p>

                <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-gray-300">
                      {isZh ? '綜合合規達成率' : 'Average Compliance Score'}
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-400">93%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '93%' }} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('compliance-center')}
                className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Scroll size={14} />
                <span>{isZh ? '開啟完整合規稽核舉證中心' : 'Open Compliance Center'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Cyber Risk & ROI */}
      {activeTab === 'financial' && (
        <ExecutiveFinancialExposureView isZh={isZh} />
      )}

      {/* Tab 3: Business Units & Core Services */}
      {activeTab === 'business' && (
        <ExecutiveBusinessRiskMatrix isZh={isZh} />
      )}

      {/* Tab 4: Strategic Roadmap & AI Briefing */}
      {activeTab === 'roadmap' && (
        <div className="space-y-8">
          <ExecutiveAiBriefing isZh={isZh} />
          <ExecutiveStrategicRoadmap isZh={isZh} />
        </div>
      )}

      {/* Modals */}
      <ExecutiveBoardPackModal
        isOpen={isBoardPackOpen}
        onClose={() => setIsBoardPackOpen(false)}
        isZh={isZh}
      />

      <ExecutiveActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        isZh={isZh}
        onActionProcessed={(id, decision) => {
          setPendingApprovalsCount(prev => Math.max(0, prev - 1));
        }}
      />
    </div>
  );
}

export default ExecutiveDashboardView;

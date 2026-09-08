import React, { useState } from 'react';
import { 
  Fingerprint, 
  LayoutDashboard, 
  FileCode, 
  Workflow, 
  Sliders, 
  Database, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  Download,
  Plus
} from 'lucide-react';
import { 
  INITIAL_FIM_EVENTS, 
  INITIAL_FIM_PLAYBOOKS, 
  INITIAL_FIM_POLICIES, 
  INITIAL_FIM_BASELINES, 
  FimEventItem, 
  FimPlaybookItem, 
  FimPolicyItem, 
  FimBaselineSnapshot 
} from '../../../data/soarFimData';
import { FimDashboardTab } from './FimDashboardTab';
import { FimForensicTab } from './FimForensicTab';
import { FimPlaybooksTab } from './FimPlaybooksTab';
import { FimPoliciesTab } from './FimPoliciesTab';
import { FimBaselinesTab } from './FimBaselinesTab';
import { FimDiffModal } from './FimDiffModal';

export const SOARFIMView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'forensics' | 'playbooks' | 'policies' | 'baselines'>('dashboard');

  // Core State
  const [events, setEvents] = useState<FimEventItem[]>(INITIAL_FIM_EVENTS);
  const [playbooks, setPlaybooks] = useState<FimPlaybookItem[]>(INITIAL_FIM_PLAYBOOKS);
  const [policies, setPolicies] = useState<FimPolicyItem[]>(INITIAL_FIM_POLICIES);
  const [baselines, setBaselines] = useState<FimBaselineSnapshot[]>(INITIAL_FIM_BASELINES);

  // Modal State
  const [selectedEventForDiff, setSelectedEventForDiff] = useState<FimEventItem | null>(null);

  // Handlers
  const handleExecuteRollback = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          soarActionTaken: 'Auto_Rolled_Back',
          status: 'Resolved',
          analystNotes: '已由管理員手動核准觸發 SOAR 黃金基線快照強制還原，檔案已回歸乾淨簽名。'
        };
      }
      return e;
    }));
  };

  const handleIsolateHost = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          soarActionTaken: 'Process_Killed_Host_Isolated',
          status: 'Contained',
          analystNotes: '已向邊界防火牆下發微隔離規則，僅保留 SOC 與 SIEM 管理通道。'
        };
      }
      return e;
    }));
  };

  const handleTogglePlaybook = (id: string) => {
    setPlaybooks(prev => prev.map(pb => pb.id === id ? { ...pb, isActive: !pb.isActive } : pb));
  };

  const handleChangePlaybookMode = (id: string, mode: FimPlaybookItem['executionMode']) => {
    setPlaybooks(prev => prev.map(pb => pb.id === id ? { ...pb, executionMode: mode } : pb));
  };

  const handleTogglePolicy = (id: string) => {
    setPolicies(prev => prev.map(pol => pol.id === id ? { ...pol, enabled: !pol.enabled } : pol));
  };

  const handleAddPolicy = (newPol: Partial<FimPolicyItem>) => {
    setPolicies([newPol as FimPolicyItem, ...policies]);
  };

  const handleRecalculateBaseline = (baselineId: string) => {
    setBaselines(prev => prev.map(b => b.id === baselineId ? { ...b, driftCount: 0, createdDate: new Date().toISOString().replace('T', ' ').substring(0, 19) } : b));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-gray-800/80">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600/20 p-3 rounded-2xl border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-600/10">
            <Fingerprint className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                檔案完整性監控與 SOAR 自律防禦 (FIM & Automated Containment)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                eBPF In-Kernel Probe
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              核心二進位檔、WebShell 後門與特權組態異動之零延遲即時攔截、行級 Diff 鑑識、密碼學 SHA-256 驗證及 SOAR 黃金快照秒級自動還原
            </p>
          </div>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
          <div className="bg-[#0e131f] border border-gray-800 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">已監控檔案</span>
            <span className="text-sm font-black text-white font-mono">284,910 筆</span>
          </div>

          <div className="bg-[#0e131f] border border-gray-800 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">未授權異動</span>
            <span className="text-sm font-black text-red-400 font-mono">
              {events.filter(e => e.severity === 'Critical' || e.severity === 'High').length} 起
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <div className="bg-[#0e131f] p-1.5 rounded-2xl border border-gray-800 flex items-center gap-1.5 shadow-md">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <LayoutDashboard size={14} />
            態勢總覽 (Dashboard)
          </button>

          <button
            onClick={() => setActiveTab('forensics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'forensics'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <FileCode size={14} />
            檔案異動鑑識清冊 (Forensic Explorer)
            <span className="text-[10px] bg-red-600/30 text-red-300 px-1.5 py-0.5 rounded-full font-bold ml-0.5">
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('playbooks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'playbooks'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Workflow size={14} />
            SOAR 自動化聯防劇本 (FIM Playbooks)
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold ml-0.5">
              4 Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'policies'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Sliders size={14} />
            監控策略與合規樣板 (Policies & Compliance)
          </button>

          <button
            onClick={() => setActiveTab('baselines')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'baselines'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Database size={14} />
            黃金基線快照庫 (Golden Baselines)
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'dashboard' && (
        <FimDashboardTab
          events={events}
          playbooks={playbooks}
          onSelectEvent={(evt) => setSelectedEventForDiff(evt)}
          onNavigateToTab={(t) => setActiveTab(t)}
        />
      )}

      {activeTab === 'forensics' && (
        <FimForensicTab
          events={events}
          onSelectEvent={(evt) => setSelectedEventForDiff(evt)}
          onExecuteRollback={handleExecuteRollback}
          onIsolateHost={handleIsolateHost}
        />
      )}

      {activeTab === 'playbooks' && (
        <FimPlaybooksTab
          playbooks={playbooks}
          onTogglePlaybook={handleTogglePlaybook}
          onChangeMode={handleChangePlaybookMode}
          onSimulatePlaybook={(id) => {}}
        />
      )}

      {activeTab === 'policies' && (
        <FimPoliciesTab
          policies={policies}
          onTogglePolicy={handleTogglePolicy}
          onAddPolicy={handleAddPolicy}
        />
      )}

      {activeTab === 'baselines' && (
        <FimBaselinesTab
          baselines={baselines}
          onRecalculateBaseline={handleRecalculateBaseline}
          onAddBaseline={() => {}}
        />
      )}

      {/* Diff & Forensic Modal */}
      <FimDiffModal
        event={selectedEventForDiff}
        onClose={() => setSelectedEventForDiff(null)}
        onExecuteRollback={handleExecuteRollback}
        onIsolateHost={handleIsolateHost}
      />
    </div>
  );
};

export default SOARFIMView;

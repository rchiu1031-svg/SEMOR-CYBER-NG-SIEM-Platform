import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  User, 
  Zap, 
  Activity, 
  MessageSquare, 
  Layers, 
  ExternalLink, 
  Lock, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Database, 
  Share2, 
  Sparkles, 
  Send, 
  Flame, 
  FileText,
  Ban,
  RefreshCw,
  Globe,
  Radio
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CaseIncident, CaseStatus } from './types';

interface CaseDetailWarRoomProps {
  caseItem: CaseIncident;
  onBack: () => void;
  onUpdateStatus: (newStatus: CaseStatus) => void;
  onOpenActionModal: (caseItem: CaseIncident, actionType: string) => void;
  onAddNote: (noteText: string) => void;
}

export const CaseDetailWarRoom: React.FC<CaseDetailWarRoomProps> = ({
  caseItem,
  onBack,
  onUpdateStatus,
  onOpenActionModal,
  onAddNote
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'topology' | 'ioc' | 'timeline' | 'actions' | 'chat'
  >('overview');

  const [chatInput, setChatInput] = useState('');
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onAddNote(chatInput.trim());
    setChatInput('');
  };

  const handleGenerateAiInsight = async () => {
    setAiAnalyzing(true);
    try {
      const res = await fetch(`/api/v1/cases/${caseItem.id}/ai-insight`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.insight) {
        setAiReport(data.insight);
      } else {
        setAiReport(`【SEMOR GenAI 調查評估報告】\n• 根本威脅特徵: 判定為 ${caseItem.category} 威脅事件。\n• 建議立即下發 EDR 端點微隔離與邊界防火牆黑名單阻斷。`);
      }
    } catch (err: any) {
      setAiReport(`【AI 分析異常】無法連線至 AI 研判微服務: ${err.message}`);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // SLA Percentage
  const slaProgressPercent = Math.max(
    0, 
    Math.min(100, Math.round((caseItem.sla.remainingMinutes / caseItem.sla.totalMinutes) * 100))
  );

  return (
    <div className="bg-[#111114] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl space-y-0 flex flex-col min-h-[820px]">
      {/* War Room Header */}
      <div className="p-5 lg:p-6 border-b border-gray-800 bg-[#16161c] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back + Case ID + Title */}
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-xl transition-colors mt-0.5"
            title="返回案件列表"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-black text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                {caseItem.caseNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/10 text-red-400 border border-red-500/30 uppercase tracking-wide">
                {caseItem.severity}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
                {caseItem.category}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5 leading-snug">
              {caseItem.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400 font-mono">
              <span>進線引擎: {caseItem.sourceEngine}</span>
              <span>•</span>
              <span>負責分析官: {caseItem.assignee.name}</span>
            </div>
          </div>
        </div>

        {/* Right: SLA Countdown + Status Selector + Fast Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* SLA Ring / Countdown Box */}
          <div className="px-4 py-2 bg-black/60 border border-gray-800 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">SLA 應變倒數 ({caseItem.sla.stage})</span>
              <span className={cn(
                "text-sm font-black font-mono",
                caseItem.sla.remainingMinutes <= 20 ? "text-red-400 animate-pulse" : "text-white"
              )}>
                {caseItem.sla.remainingMinutes} 分鐘剩餘
              </span>
            </div>
          </div>

          {/* Status Changer */}
          <select
            value={caseItem.status}
            onChange={(e) => onUpdateStatus(e.target.value as CaseStatus)}
            className="bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-purple-500"
          >
            <option value="New">新進通報 (New)</option>
            <option value="Investigating">深入調查中 (Investigating)</option>
            <option value="Awaiting Approval">等待主管核准 (Awaiting Approval)</option>
            <option value="In Remediation">處置遏阻中 (In Remediation)</option>
            <option value="Closed">已完成結案 (Closed)</option>
            <option value="False Positive">誤報排除 (False Positive)</option>
          </select>

          {/* Containment Trigger */}
          <button
            onClick={() => onOpenActionModal(caseItem, 'quarantine')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 flex items-center gap-1.5 transition-all"
          >
            <Ban className="w-3.5 h-3.5" />
            發起隔離遏阻
          </button>
        </div>
      </div>

      {/* War Room Navigation Tabs */}
      <div className="px-6 border-b border-gray-800 bg-[#141418] flex items-center gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: '事件摘要與資產總覽', icon: Activity },
          { id: 'topology', label: '攻擊因果拓撲圖 (Attack Graph)', icon: Layers },
          { id: 'ioc', label: `IoC 威脅情資聯防 (${caseItem.observables.length})`, icon: ShieldAlert },
          { id: 'timeline', label: `鑑識處置時間軸 (${caseItem.timeline.length})`, icon: Clock },
          { id: 'actions', label: 'SOAR 自動化應變處置庫', icon: Zap },
          { id: 'chat', label: `戰情室協同討論 (${caseItem.warRoomNotes.length})`, icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-3.5 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all",
                isActive 
                  ? "border-purple-500 text-purple-400 bg-purple-500/5" 
                  : "border-transparent text-gray-400 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-[#0d0d10]">
        {/* 1. OVERVIEW & BLAST RADIUS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Executive Description & AI Diagnosis Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-5 bg-[#141418] border border-gray-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    事件威脅脈絡與事態描述
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    最後更新: {caseItem.updatedAt}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-gray-800/80">
                  {caseItem.description}
                </p>

                {/* MITRE ATT&CK Badges */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    MITRE ATT&amp;CK 戰術與技法映射
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {caseItem.mitreTactics.map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono border bg-gray-900 border-gray-700 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color || '#a855f7' }} />
                        <span className="text-purple-400 font-bold">{m.id}</span>
                        <span className="text-gray-300 font-sans">{m.name}</span>
                        <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                          {m.tactic}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Copilot Card */}
              <div className="p-5 bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border border-purple-500/30 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      SEMOR AI 調查助手
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Gemini SOC Copilot
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    自動分析關聯日誌、PCAP 特徵、IoC 信譽與攻擊拓撲，提供高精確度根本原因診斷與自動處置方案。
                  </p>
                </div>

                {aiReport ? (
                  <div className="p-3 bg-black/60 border border-purple-500/30 rounded-xl text-[11px] text-purple-200 font-mono whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto">
                    {aiReport}
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateAiInsight}
                    disabled={aiAnalyzing}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {aiAnalyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        AI 智能分析研判中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        生成 AI 事態研判與建議
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Impacted Assets & Identities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets */}
              <div className="p-5 bg-[#141418] border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    受衝擊目標資產 ({caseItem.affectedAssets.length})
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {caseItem.affectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{asset.name}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            asset.status === 'Compromised' && "bg-red-500/10 text-red-400 border-red-500/30",
                            asset.status === 'Isolated' && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                            asset.status === 'At Risk' && "bg-orange-500/10 text-orange-400 border-orange-500/30"
                          )}>
                            {asset.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono mt-1">
                          <span>IP: {asset.ip}</span>
                          <span>•</span>
                          <span>{asset.type}</span>
                          <span>•</span>
                          <span>{asset.ownerDepartment}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenActionModal(caseItem, 'quarantine')}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 rounded-lg text-[11px] font-bold border border-gray-700 transition-colors"
                      >
                        主機微隔離
                      </button>
                    </div>
                  ))}
                  {caseItem.affectedAssets.length === 0 && (
                    <p className="text-xs text-gray-500 py-4 text-center">無特定受害資產紀錄</p>
                  )}
                </div>
              </div>

              {/* Users */}
              <div className="p-5 bg-[#141418] border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    受波及特權帳號與身分 ({caseItem.affectedUsers.length})
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {caseItem.affectedUsers.map((user) => (
                    <div
                      key={user.username}
                      className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{user.displayName}</span>
                          <span className="text-purple-400 font-mono text-[11px]">({user.username})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            MFA: {user.mfaStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono mt-1">
                          最後 Session: {user.lastActiveSession || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => onOpenActionModal(caseItem, 'revoke_token')}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-purple-600 hover:text-white text-gray-300 rounded-lg text-[11px] font-bold border border-gray-700 transition-colors"
                      >
                        強制註銷 Session
                      </button>
                    </div>
                  ))}
                  {caseItem.affectedUsers.length === 0 && (
                    <p className="text-xs text-gray-500 py-4 text-center">無特權帳號洩漏紀錄</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ATTACK TOPOLOGY GRAPH */}
        {activeTab === 'topology' && (
          <div className="p-6 bg-[#141418] border border-gray-800 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  攻擊路徑拓撲與因果關係鏈 (Attack Flow Graph)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  點選節點可檢視該元件於資安事件中的因果關聯、狀態指標與即時處置選項
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> 外部 C2 / 惡意
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> 受害端點
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> 特權網域
                </span>
              </div>
            </div>

            {/* Interactive Graph Canvas Container */}
            <div className="relative h-[480px] bg-black/60 border border-gray-800 rounded-2xl p-6 overflow-hidden flex flex-col justify-between">
              {/* Visual Nodes Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
                {caseItem.attackGraph.nodes.map((node) => {
                  const isSelected = selectedGraphNode === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedGraphNode(node.id)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer space-y-2 relative overflow-hidden group",
                        isSelected 
                          ? "bg-purple-900/30 border-purple-500 shadow-xl shadow-purple-600/20 scale-105" 
                          : "bg-[#181820] border-gray-800 hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {node.type}
                        </span>
                        {node.status && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900 border border-gray-700 text-purple-400">
                            {node.status}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-sm font-bold text-white group-hover:text-purple-300">
                        {node.label}
                      </div>
                      {node.subLabel && (
                        <div className="text-xs text-gray-400">{node.subLabel}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Edge Explanations Bar */}
              <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-gray-400">攻擊鏈因果路徑:</span>
                {caseItem.attackGraph.edges.map((e, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 text-purple-300">
                    <span>{e.label}</span>
                    {idx < caseItem.attackGraph.edges.length - 1 && <span className="text-gray-600">&rarr;</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. IoC THREAT INTEL */}
        {activeTab === 'ioc' && (
          <div className="bg-[#141418] border border-gray-800 rounded-2xl overflow-hidden space-y-4 animate-in fade-in duration-200">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  IoC 威脅特徵與多源情報豐富化 (MISP, VirusTotal, AlienVault)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  自動關聯全域 CTI 威脅情報庫，支援單鍵下發周邊邊界設備與 EDR 阻斷
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/60 text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">型態 (Type)</th>
                    <th className="py-3 px-4">特徵數值 (Observable Value)</th>
                    <th className="py-3 px-4">信譽評等 (Reputation)</th>
                    <th className="py-3 px-4">惡意評分</th>
                    <th className="py-3 px-4">進線情報源</th>
                    <th className="py-3 px-4">處置現況</th>
                    <th className="py-3 px-4 text-right">動作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {caseItem.observables.map((obs) => (
                    <tr key={obs.id} className="hover:bg-gray-800/30 font-mono">
                      <td className="py-3 px-4 text-purple-400 font-bold">{obs.type}</td>
                      <td className="py-3 px-4 text-white font-bold select-all max-w-xs truncate">
                        {obs.value}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/30">
                          {obs.reputation}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-red-400">{obs.score} / 100</td>
                      <td className="py-3 px-4 text-gray-400 font-sans">{obs.source}</td>
                      <td className="py-3 px-4 text-emerald-400 font-sans">{obs.actionTaken || '尚未處置'}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenActionModal(caseItem, 'block_ip')}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold transition-colors"
                        >
                          阻斷特徵
                        </button>
                      </td>
                    </tr>
                  ))}
                  {caseItem.observables.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 font-sans">
                        目前案件尚無關聯的 IoC 特徵
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. FORENSIC TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="p-6 bg-[#141418] border border-gray-800 rounded-2xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                事件鑑識處置與自動化時間軸 (Audit Timeline)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                完整記錄由偵測觸發、SOAR 劇本執行、分析師介入至圍堵復原的所有步驟
              </p>
            </div>

            <div className="relative pl-6 space-y-6 border-l-2 border-purple-500/30">
              {caseItem.timeline.map((entry) => (
                <div key={entry.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-purple-600 border-4 border-[#111114] shadow-md group-hover:scale-125 transition-transform" />

                  <div className="p-4 bg-gray-900/70 border border-gray-800 rounded-xl space-y-1.5 hover:border-purple-500/40 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-400 font-bold">{entry.timestamp}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                          {entry.type}
                        </span>
                      </div>
                      <span className="text-gray-500 font-mono text-[11px]">{entry.author}</span>
                    </div>

                    <p className="text-xs font-bold text-white leading-relaxed">
                      {entry.content}
                    </p>

                    {entry.details && (
                      <p className="text-[11px] text-gray-400 font-mono bg-black/40 p-2 rounded-lg border border-gray-800">
                        {entry.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {caseItem.timeline.length === 0 && (
                <p className="text-xs text-gray-500 py-6 text-center">暫無時間軸歷程紀錄</p>
              )}
            </div>
          </div>
        )}

        {/* 5. REMEDIATION HUB */}
        {activeTab === 'actions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 bg-[#141418] border border-gray-800 rounded-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                SOAR 一鍵聯防處置動作庫 (Containment & Remediation Actions)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                點選動作即時調用周邊防火牆、EDR、身分目錄或鑑識感測器進行自動化應變
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 'quarantine',
                  title: '主機網路層級微隔離',
                  desc: '透過 EDR Agent 阻斷除了 SOC 監控埠以外之所有端點入出站通訊',
                  icon: Ban,
                  color: 'text-red-400',
                  actionBtn: '執行主機隔離',
                  btnStyle: 'bg-red-600 hover:bg-red-500'
                },
                {
                  id: 'block_ip',
                  title: '周邊邊界防火牆 IP 阻斷',
                  desc: '向 Palo Alto / Fortinet / iptables 下發動態黑名單拋棄規則',
                  icon: Globe,
                  color: 'text-purple-400',
                  actionBtn: '下發周邊阻斷',
                  btnStyle: 'bg-purple-600 hover:bg-purple-500'
                },
                {
                  id: 'revoke_token',
                  title: '撤銷使用者 Token 與強制登出',
                  desc: '作廢 Active Directory Kerberos 票證或 Okta / Azure AD 臨時 STS 憑證',
                  icon: Lock,
                  color: 'text-amber-400',
                  actionBtn: '強制撤銷身分',
                  btnStyle: 'bg-amber-600 hover:bg-amber-500'
                },
                {
                  id: 'kill_process',
                  title: '終止惡意進程與檔案隔離',
                  desc: '向受害主機發送 SIGKILL 殺死異常 PID 並將可疑 Hash 移入保護沙箱',
                  icon: Cpu,
                  color: 'text-blue-400',
                  actionBtn: '終止處理序',
                  btnStyle: 'bg-blue-600 hover:bg-blue-500'
                },
                {
                  id: 'memory_dump',
                  title: 'Velociraptor 記憶體鑑識採證',
                  desc: '自動觸發記憶體 Dump 與進程注入取證，並安全上傳至冷儲存空間',
                  icon: Terminal,
                  color: 'text-emerald-400',
                  actionBtn: '啟動記憶體採證',
                  btnStyle: 'bg-emerald-600 hover:bg-emerald-500'
                },
                {
                  id: 'broadcast_alert',
                  title: '廣播重大事件至 Slack / Teams',
                  desc: '向 CISO 與核心資安應變小組 (CSIRT) 發送通報與會議連結',
                  icon: Radio,
                  color: 'text-indigo-400',
                  actionBtn: '發送緊急通報',
                  btnStyle: 'bg-indigo-600 hover:bg-indigo-500'
                }
              ].map((action) => {
                const Icon = action.icon;

                return (
                  <div
                    key={action.id}
                    className="p-5 bg-[#141418] border border-gray-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-gray-700 transition-all shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gray-900 rounded-xl border border-gray-800">
                          <Icon className={cn("w-5 h-5", action.color)} />
                        </div>
                        <h4 className="text-xs font-bold text-white">{action.title}</h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {action.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenActionModal(caseItem, action.id)}
                      className={cn(
                        "w-full py-2 text-white rounded-xl text-xs font-bold shadow-lg transition-all",
                        action.btnStyle
                      )}
                    >
                      {action.actionBtn}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. WAR ROOM CHAT & NOTES */}
        {activeTab === 'chat' && (
          <div className="p-6 bg-[#141418] border border-gray-800 rounded-2xl flex flex-col h-[540px] justify-between space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                戰情室分析官即時協同對話 (War Room Discussion)
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                由 n8n 與 Cortex 自動轉發鑑識情報
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 pr-2">
              {caseItem.warRoomNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-4 rounded-xl border text-xs space-y-1.5",
                    note.isAutomatedBot 
                      ? "bg-blue-950/20 border-blue-500/30 text-blue-200" 
                      : "bg-gray-900/80 border-gray-800 text-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        note.isAutomatedBot ? "bg-blue-400 animate-pulse" : "bg-purple-400"
                      )} />
                      <strong className="text-white font-bold">{note.author}</strong>
                      <span className="text-[10px] text-gray-500">({note.role})</span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500">{note.time}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line pl-4 border-l-2 border-purple-500/20">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-gray-800">
              <input
                type="text"
                placeholder="輸入分析調查紀錄、鑑識心得或處置指示..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                發布
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

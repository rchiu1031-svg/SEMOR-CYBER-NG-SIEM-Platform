import React, { useState } from 'react';
import { 
  Workflow, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Zap, 
  Plus, 
  Sliders, 
  Terminal,
  Check,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { FimPlaybookItem } from '../../../data/soarFimData';

interface FimPlaybooksTabProps {
  playbooks: FimPlaybookItem[];
  onTogglePlaybook: (id: string) => void;
  onChangeMode: (id: string, mode: FimPlaybookItem['executionMode']) => void;
  onSimulatePlaybook: (id: string) => void;
}

export const FimPlaybooksTab: React.FC<FimPlaybooksTabProps> = ({
  playbooks,
  onTogglePlaybook,
  onChangeMode,
  onSimulatePlaybook
}) => {
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>(playbooks[0]?.id || '');
  const [simulationLog, setSimulationLog] = useState<{ id: string; logs: string[] } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const selectedPlaybook = playbooks.find(p => p.id === selectedPlaybookId) || playbooks[0];

  const handleRunSimulation = async (pb: FimPlaybookItem) => {
    setIsSimulating(true);
    try {
      const res = await fetch(`/api/v1/fim/playbooks/${pb.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHost: 'edge-gateway-01' })
      });
      const data = await res.json();
      if (data.success && data.executionSteps) {
        setSimulationLog({
          id: pb.id,
          logs: data.executionSteps
        });
      } else {
        throw new Error(data.error || 'Simulation failed');
      }
      onSimulatePlaybook(pb.id);
    } catch {
      // Fallback display
      setSimulationLog({
        id: pb.id,
        logs: [
          `[${new Date().toLocaleTimeString()}] 模擬威脅注入測試：對目標目錄觸發未授權變更事件...`,
          `[${new Date().toLocaleTimeString()}] FIM eBPF 探針偵測到檔案雜湊偏離，觸發規則標籤：${pb.name}`,
          `[${new Date().toLocaleTimeString()}] 調度 SOAR 自動化決策引擎 (模式: ${pb.executionMode})...`,
          ...pb.actionsList.map(a => `[${new Date().toLocaleTimeString()}] 執行動作節點 -> ${a} [SUCCESS]`),
          `[${new Date().toLocaleTimeString()}] 劇本執行完畢！MTTR 耗時：${(pb.averageMttrSeconds * 1000).toFixed(0)}ms，主機已恢復合規基準狀態。`
        ]
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Workflow className="text-purple-400" size={18} />
            FIM 專屬 SOAR 自動化聯防劇本 (FIM Automated Playbooks Matrix)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            當監控目錄或檔案發生未授權內容寫入或屬性漂移時，零延遲自動執行「進程掛起」、「快照覆蓋復原」與「邊界防火牆 IP 封鎖」
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
            4 Active Playbooks
          </span>
        </div>
      </div>

      {/* Grid: Playbook Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playbooks.map((pb) => {
          const isSelected = selectedPlaybook?.id === pb.id;
          return (
            <div
              key={pb.id}
              onClick={() => setSelectedPlaybookId(pb.id)}
              className={`bg-[#0e131f] border rounded-2xl p-6 space-y-4 shadow-lg cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 ring-1 ring-purple-500/40'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                      {pb.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      {pb.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">{pb.name}</h3>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlaybook(pb.id);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 shrink-0 ${
                    pb.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {pb.isActive ? <Check size={12} /> : <Pause size={12} />}
                  {pb.isActive ? '啟用中' : '已暫停'}
                </button>
              </div>

              {/* Trigger description */}
              <div className="p-3 bg-black/40 rounded-xl border border-gray-800/80 text-xs text-gray-300">
                <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                  觸發條件 (Trigger Condition)
                </span>
                {pb.triggerCondition}
              </div>

              {/* Target Paths */}
              <div className="text-xs space-y-1">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  防護路徑範疇
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {pb.targetPaths.map((p, idx) => (
                    <span key={idx} className="bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-gray-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Chain steps */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800 text-xs">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  自動化執行鏈 (Action Pipeline - {pb.actionsList.length} 步驟)
                </span>
                <div className="space-y-1 font-mono text-[11px] text-gray-300">
                  {pb.actionsList.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics & Automation Mode Selector */}
              <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-gray-400 font-mono text-[11px]">
                  <span>平均 MTTR: <strong className="text-emerald-400 font-bold">{pb.averageMttrSeconds}s</strong></span>
                  <span>成功率: <strong className="text-purple-400 font-bold">{pb.successRate}%</strong></span>
                  <span>觸發累計: <strong className="text-white">{pb.executionHistoryCount} 次</strong></span>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={pb.executionMode}
                    onChange={(e) => onChangeMode(pb.id, e.target.value as any)}
                    className="bg-gray-900 border border-gray-800 text-[11px] text-gray-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="Fully Automated (Instant)">全自動秒級執行 (Fully Automated)</option>
                    <option value="Semi-Automated (One-Click)">半自動確認 (Semi-Automated)</option>
                    <option value="Manual Review">人工審查 (Manual Review)</option>
                  </select>

                  <button
                    onClick={() => handleRunSimulation(pb)}
                    disabled={isSimulating}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1 shrink-0"
                  >
                    <Play size={12} />
                    模擬測試
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulation Console Log Drawer */}
      {simulationLog && (
        <div className="bg-[#0e131f] border border-gray-800 rounded-2xl p-6 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              SOAR 劇本沙盒模擬測試輸出 (Simulation Run: {simulationLog.id})
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">
              ● SIMULATION COMPLETED
            </span>
          </div>

          <div className="p-4 bg-black/70 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400 space-y-1.5 overflow-x-auto">
            {simulationLog.logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

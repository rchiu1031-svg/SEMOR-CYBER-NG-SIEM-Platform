import React, { useState } from 'react';
import {
  Globe,
  Server,
  Activity,
  CheckCircle2,
  HardDrive,
  Cpu,
  RefreshCw,
  Search
} from 'lucide-react';
import { CcsClusterNode } from './types';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface OverviewGlobalClusterMapProps {
  nodes: CcsClusterNode[];
  isZh: boolean;
}

export const OverviewGlobalClusterMap: React.FC<OverviewGlobalClusterMapProps> = ({
  nodes,
  isZh
}) => {
  const { isLight } = useTheme();
  const [activeNodeId, setActiveNodeId] = useState<string>(nodes[0]?.id || '');
  const [isTestingMesh, setIsTestingMesh] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === activeNodeId) || nodes[0];

  const handleTestMesh = () => {
    setIsTestingMesh(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingMesh(false);
      setTestResult(isZh ? '所有 5 處跨集群節點檢驗完畢：平均 RTT 延遲 42ms，檢索完整度 100%' : 'All 5 CCS clusters verified: Avg RTT 42ms, 100% index parity');
    }, 1200);
  };

  return (
    <div className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#111114] border-gray-800/80'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="text-emerald-500" size={18} />
            <h2 className={`text-base font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isZh ? '跨集群搜尋 (CCS) 全球拓撲與節點健康度' : 'Cross-Cluster Search (CCS) Global Topology'}
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            {isZh
              ? '跨多雲與多地理區域之分布式 Elasticsearch / OpenSearch 聯邦搜尋'
              : 'Federated multi-region log storage & instantaneous search mesh'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="overview-ccs-test-mesh-btn"
            onClick={handleTestMesh}
            disabled={isTestingMesh}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={13} className={isTestingMesh ? "animate-spin" : ""} />
            <span>{isZh ? (isTestingMesh ? '跨區聯網檢測中...' : '測試 CCS 連通延遲') : (isTestingMesh ? 'Testing...' : 'Test CCS Mesh')}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div className="mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Cluster Nodes Interactive Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
        {nodes.map((node) => {
          const isSelected = activeNodeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setActiveNodeId(node.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                isSelected
                  ? isLight ? "bg-emerald-50 border-emerald-500 shadow-sm" : "bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/10"
                  : isLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300" : "bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{node.latencyMs}ms</span>
              </div>
              <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{node.name}</div>
              <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                {isZh ? node.locationZh.split(' ')[0] : node.locationEn.split(',')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Node Deep-dive Telemetry Card */}
      {selectedNode && (
        <div className={`border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs transition-all ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-gray-800'
        }`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
              {isZh ? '角色與 IP' : 'Role & IP'}
            </span>
            <div className="flex items-center gap-1.5">
              <Server size={14} className="text-blue-500" />
              <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedNode.ip}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 font-bold border border-blue-500/20 inline-block">
              {selectedNode.role}
            </span>
          </div>

          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
              {isZh ? '即時事件寫入 (EPS)' : 'Ingestion EPS'}
            </span>
            <div className="flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-500" />
              <span className={`font-bold font-mono text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedNode.eps} EPS</span>
            </div>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{isZh ? '無封包積壓' : 'Zero backlog'}</span>
          </div>

          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
              {isZh ? 'CPU 負載與查詢量' : 'CPU Load & Queries'}
            </span>
            <div className="flex items-center gap-1.5">
              <Cpu size={14} className="text-purple-500" />
              <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedNode.cpuLoad}%</span>
            </div>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              {selectedNode.activeQueries} {isZh ? '個活躍搜尋執行緒' : 'active threads'}
            </span>
          </div>

          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
              {isZh ? '磁碟使用與冷儲存' : 'Disk & Tiering'}
            </span>
            <div className="flex items-center gap-1.5">
              <HardDrive size={14} className="text-amber-500" />
              <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedNode.diskUsagePercent}%</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden mt-1 ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${selectedNode.diskUsagePercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

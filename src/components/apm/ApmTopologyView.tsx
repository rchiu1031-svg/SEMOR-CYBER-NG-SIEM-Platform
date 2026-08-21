import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Network, 
  HelpCircle, 
  Server, 
  Cpu, 
  Database, 
  Sparkles,
  Compass,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { ServiceNode, ServiceRelation } from './ApmTypes';

interface ApmTopologyViewProps {
  services: ServiceNode[];
  relations: ServiceRelation[];
  selectedNode: ServiceNode | null;
  onNodeSelect: (node: ServiceNode | null) => void;
  onQuickSimulate: (id: string) => void;
  env: string;
}

export const ApmTopologyView: React.FC<ApmTopologyViewProps> = ({
  services,
  relations,
  selectedNode,
  onNodeSelect,
  onQuickSimulate,
  env
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] text-left w-full">
      
      {/* 1. Title Header Block (Independent Block 1) */}
      <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3 tracking-tight font-sans">
              <span className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 flex items-center justify-center border border-blue-500/15">
                <Network size={22} className="animate-pulse" />
              </span>
              {isZh ? '全景動態拓撲依賴分析 (Panorama Interactive topology Topology)' : isJa ? '動的トポロジー依存関係解析 (Panorama Interactive topology Topology)' : 'Panorama Interactive Topology Analysis'}
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              {isZh ? `APM 基於 OAP 核心探針動態生成之運行拓撲學 (當前環境: ` : isJa ? `APM 稼働トポロジー (コア OAP プローブ動的生成、現在環境: ` : `APM Runtime Topology (dynamic OAP core probe generation, current env: `}
              <strong className="text-blue-400 capitalize">{env}</strong>)
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-300 bg-[#0d1017]/90 px-3 py-1.5 rounded-xl border border-gray-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span> {isZh ? '成功調用' : isJa ? '呼出成功' : 'Calls Successful'}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-300 bg-[#0d1017]/90 px-3 py-1.5 rounded-xl border border-gray-800">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span> {isZh ? 'SLA 告警' : isJa ? 'SLA 警告' : 'SLA Violations'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Topology Diagram Block (Standalone Single Block) */}
      <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 relative min-h-[540px] flex flex-col justify-between overflow-hidden shadow-lg">
        
        {/* Header block for the Canvas itself */}
        <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Compass size={15} className="text-blue-400 animate-spin-slow" />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">
              {isZh ? '實時微服務鏈路拓撲圖 (Interactive Topology Stage)' : isJa ? 'リアルタイムマイクロサービス依存トポロジー図 (Interactive Topology Stage)' : 'Real-time Microservices Topology Canvas'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">ID: apm-topology-canvas</span>
        </div>

        {/* Dynamic Interactive SVG Canvas - Single Large Independent Block */}
        <div id="apm-topology-stage" className="w-full h-[520px] bg-[#08090d]/60 border border-gray-900/80 rounded-xl relative overflow-hidden mb-4 shadow-inner">
          
          <svg className="w-full h-full" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet">
            {/* Draw Links/Connections */}
            {relations.map((rel, index) => {
              const srcNode = services.find(n => n.id === rel.source);
              const tgtNode = services.find(n => n.id === rel.target);
              if (!srcNode || !tgtNode) return null;

              const isLinkActive = selectedNode?.id === srcNode.id || selectedNode?.id === tgtNode.id;
              const hasAlert = tgtNode.sla < 96 || srcNode.sla < 96;

              return (
                <g key={`link-${index}`}>
                  {/* Outer glow line */}
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y - 15}
                    x2={tgtNode.x}
                    y2={tgtNode.y - 15}
                    stroke={hasAlert ? "#ef4444" : isLinkActive ? "#5F5FF6" : "#222530"}
                    strokeWidth={isLinkActive ? 3.5 : 2}
                    className="transition-all duration-300"
                  />
                  {/* Moving arrow path or flow bubble simulator */}
                  <circle
                    r="4"
                    fill={hasAlert ? "#f87171" : "#60a5fa"}
                    className="animate-flow-signal"
                    style={{
                      offsetPath: `path('M ${srcNode.x} ${srcNode.y - 15} L ${tgtNode.x} ${tgtNode.y - 15}')`,
                      offsetRotate: 'auto',
                      animation: `topology-flow ${4500 / (rel.cpm / 200 + 1)}ms linear infinite`
                    }}
                  />
                  {/* Traffic annotations midway */}
                  <foreignObject
                    x={(srcNode.x + tgtNode.x) / 2 - 35}
                    y={(srcNode.y + tgtNode.y) / 2 - 27}
                    width="70"
                    height="24"
                  >
                    <div className="bg-[#090b0f]/95 border border-gray-800 rounded-lg text-[8.5px] font-mono font-bold text-center text-gray-400 py-0.5 shadow-md">
                      {rel.cpm} cpm
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* Draw Node circles/shapes */}
            {services.map((node) => {
              const isNodeSelected = selectedNode?.id === node.id;
              const hasError = node.sla < 96;

              let typeIconColor = "text-sky-400";
              let nodeBorderColor = isNodeSelected ? "stroke-blue-500" : hasError ? "stroke-red-500 animate-pulse" : "stroke-gray-700 hover:stroke-gray-400";
              let nodeFill = isNodeSelected ? "fill-[#131d35]" : hasError ? "fill-[#240c0c]" : "fill-[#0e1015]";

              if (node.type === 'gateway') {
                typeIconColor = "text-blue-400";
              } else if (node.type === 'database') {
                typeIconColor = "text-amber-500";
              } else if (node.type === 'cache') {
                typeIconColor = "text-teal-400";
              } else if (node.type === 'external') {
                typeIconColor = "text-indigo-400";
              }

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y - 15})`}
                  className="cursor-pointer group transition-transform"
                  onClick={() => onNodeSelect(node)}
                >
                  {/* Selector Ring */}
                  {isNodeSelected && (
                    <circle r="42" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" className="animate-spin" style={{ animationDuration: '20s' }} />
                  )}
                  {/* Outer circle */}
                  <circle
                    r="34"
                    className={`${nodeBorderColor} ${nodeFill} transition-all duration-300`}
                    strokeWidth={isNodeSelected ? 3.5 : 2}
                  />
                  {/* Internal Symbol / Text abbreviation */}
                  <text
                    y="-4"
                    textAnchor="middle"
                    className="fill-gray-400 text-[10px] font-mono font-bold select-none group-hover:fill-white"
                  >
                    {node.type.substring(0, 3).toUpperCase()}
                  </text>
                  <text
                    y="14"
                    textAnchor="middle"
                    className={`text-[9px] font-mono font-extrabold select-none ${hasError ? "fill-red-400" : "fill-emerald-400"}`}
                  >
                    {node.sla}%
                  </text>

                  {/* HTML Label floating above Node in SVG */}
                  <foreignObject x="-75" y="38" width="150" height="40">
                    <div className="text-center">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-black/80 transition-colors ${
                        isNodeSelected ? "border-blue-500 text-blue-400" : hasError ? "border-red-500/50 text-red-500" : "border-gray-850 text-gray-300 group-hover:text-white"
                      }`}>
                        {node.name}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Quick instructions floating */}
          <div className="absolute bottom-3 left-3 bg-[#0d1017]/90 border border-gray-800 p-2.5 rounded-lg text-[9.5px] font-mono text-gray-500 leading-normal pointer-events-none">
            {isZh ? '⚡ 點擊拓撲圖中的服務圓圈節點，即可於下方核心控制台即時同步調用數據與診斷事件。' : isJa ? '⚡ トポロジー内のノードをクリックすると、下部の診断パネルにメトリクス情報が同期されます。' : '⚡ Click any service node on the map to sync SLA metrics and cluster health logs below.'}
          </div>
        </div>

        {/* Footer info showing telemetry control is active but humble */}
        <div className="text-[10.5px] font-mono text-gray-500 flex justify-between items-center border-t border-gray-900 pt-3">
          <span>{isZh ? '拓撲傳輸協定: SkyWalking Trace Protocol v3' : isJa ? 'トポロジープロトコル: SkyWalking Trace Protocol v3' : 'Topology Spec: SkyWalking Trace Protocol v3'}</span>
          <span>{isZh ? '探針狀態: 100% Active' : isJa ? 'プローブステータス: 100% Active' : 'Agent Heartbeat: 100% Active'}</span>
        </div>
      </div>

      {/* 3. Bottom Inspection Console Block (Horizontal Detailed view) */}
      <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 shadow-lg min-h-[160px]">
        {selectedNode ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-850 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black font-mono text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                  {selectedNode.type} NODE ACTIVE
                </span>
                <span className="text-gray-650 font-mono text-[11px]">•</span>
                <h3 className="text-base font-bold text-white font-mono break-all leading-none">{selectedNode.name}</h3>
              </div>
              <button
                onClick={() => onNodeSelect(null)}
                className="py-1 px-3 border border-gray-800 hover:border-gray-700 hover:text-white rounded-lg text-[10px] uppercase font-bold text-gray-400 transition-all font-mono self-end sm:self-auto"
              >
                {isZh ? '隱藏詳情 (Close)' : isJa ? '詳細を閉じる (Close)' : 'Close Panel'}
              </button>
            </div>

            {/* SLA, CPM, Latency rows */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Metrics Column */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider font-mono flex items-center gap-1.5 border-b border-gray-850 pb-1.5">
                  <Activity size={12} className="text-blue-400" />
                  {isZh ? 'SLA 與 吞吐量效能' : isJa ? 'SLA ＆ スループット指標' : 'SLA & Ingestion Throughput'}
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-gray-950/60 border border-gray-850 p-2.5 rounded-xl">
                    <span className="text-gray-500 block text-[8.5px] uppercase font-black mb-1">{isZh ? '可用率 SLA' : isJa ? '可用率 SLA' : 'Service SLA'}</span>
                    <strong className={`text-sm ${selectedNode.sla > 98 ? "text-green-400" : "text-amber-400"}`}>
                      {selectedNode.sla}%
                    </strong>
                  </div>
                  <div className="bg-gray-950/60 border border-gray-850 p-2.5 rounded-xl">
                    <span className="text-gray-500 block text-[8.5px] uppercase font-black mb-1">{isZh ? '吞吐量 CPM' : isJa ? '負荷 CPM' : 'CPM Load'}</span>
                    <strong className="text-sm text-blue-400">{selectedNode.cpm}</strong>
                  </div>
                  <div className="bg-gray-950/60 border border-gray-850 p-2.5 rounded-xl">
                    <span className="text-gray-500 block text-[8.5px] uppercase font-black mb-1">{isZh ? '延遲 ms' : isJa ? 'レイテンシ ms' : 'Latency ms'}</span>
                    <strong className="text-sm text-indigo-400">{selectedNode.latency}ms</strong>
                  </div>
                </div>
              </div>

              {/* Resource Utilization */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider font-mono flex items-center gap-1.5 border-b border-gray-850 pb-1.5">
                  <Server size={12} className="text-indigo-400" />
                  {isZh ? '容器集群資源 load' : isJa ? 'コンテナクラスタ負荷' : 'Cluster Hardware Load'}
                </span>

                <div className="space-y-2 font-mono text-[11px] pt-1">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">{isZh ? 'CPU 負載率:' : isJa ? 'CPU 使用率:' : 'CPU Utilization:'}</span>
                      <span className="text-gray-200 font-bold">{selectedNode.cpu}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${selectedNode.cpu}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">{isZh ? '已分配 JVM 內存:' : isJa ? 'JVMメモリ使用率:' : 'JVM Heap Memory:'}</span>
                      <span className="text-gray-200 font-bold">{selectedNode.memory}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${selectedNode.memory}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time alarms */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider font-mono flex items-center gap-1.5 border-b border-gray-850 pb-1.5">
                  <AlertTriangle size={12} className="text-red-400" />
                  {isZh ? '即時警報與調用鏈跟蹤' : isJa ? 'リアルタイム警告トレース' : 'Live Alerts & Failures'}
                </span>

                {selectedNode.alarms.length > 0 ? (
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pt-1">
                    {selectedNode.alarms.map((alarm, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-red-950/25 border border-red-500/20 shadow-inner">
                        <span className="text-[7.5px] font-mono font-extrabold text-red-400 block mb-0.5">
                          [CRITICAL SEC EVENT]
                        </span>
                        <p className="text-[10px] font-mono text-gray-300 leading-tight">
                          {alarm}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-gray-950/40 rounded-xl border border-gray-850 text-[10px] text-gray-500 italic mt-1 leading-normal">
                    {isZh ? '服務運行正常，未觸發 SkyWalking 告警機制。' : isJa ? 'サービスは正常に稼働しています。アラートはトリガーされていません。' : 'Service runs normally with no active SkyWalking OAP alarms.'}
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 rounded-xl bg-blue-500/5 border border-dashed border-blue-500/30 text-blue-400 shrink-0">
                <Compass size={22} className="animate-spin-slow" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{isZh ? '探針診斷控制台 (Diagnostic Console)' : isJa ? 'エージェント診断コンソール (Diagnostic Console)' : 'Agent Diagnostics Console'}</h4>
                <p className="text-xs text-gray-500 leading-normal mt-0.5">
                  {isZh ? '請點擊上方拓撲關係中的任意微服務圓圈，或使用快速模擬來檢索即時 SLA 指標與集群健康指標。' : isJa ? 'トポロジーマップ内のノードを選択するか、クイックシミュレータを使用すると診断指標を表示できます。' : 'Please select any active microservice node on the stage above or click quick-simulate below to display live telemetry diagnostic curves.'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => onQuickSimulate('order')}
              className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-[10.5px] font-semibold text-blue-400 tracking-wider uppercase transition-all whitespace-nowrap self-stretch md:self-auto flex items-center justify-center cursor-pointer"
            >
              {isZh ? '模擬選定 order-service' : isJa ? 'order-service をシミュレート' : 'Simulate order-service'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

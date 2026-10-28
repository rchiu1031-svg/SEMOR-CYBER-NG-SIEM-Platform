import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  X,
  Workflow,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  Target
} from 'lucide-react';
import { CriticalIncidentRecord, AttackTopologyNode, AttackTopologyLink, AttackTimelineEvent } from './types';
import { ATTACK_TOPOLOGY_DATA } from './overviewData';
import { cn } from '../../lib/utils';

interface OverviewAttackTopologyModalProps {
  incident: CriticalIncidentRecord | null;
  onClose: () => void;
  isZh: boolean;
  onExecuteContainment?: () => void;
}

export const OverviewAttackTopologyModal: React.FC<OverviewAttackTopologyModalProps> = ({
  incident,
  onClose,
  isZh,
  onExecuteContainment
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<AttackTopologyNode | null>(null);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  const topologyData = React.useMemo(() => {
    if (!incident) return ATTACK_TOPOLOGY_DATA;
    const nodes: AttackTopologyNode[] = [
      {
        id: 'attacker',
        type: 'attacker',
        labelZh: `攻擊來源 (${incident.countryZh || '外部'})`,
        labelEn: `Attacker (${incident.countryEn || 'External'})`,
        ip: incident.srcIp,
        x: 120,
        y: 190
      },
      {
        id: 'gateway',
        type: 'gateway',
        labelZh: '邊界 NGFW 防火牆',
        labelEn: 'Edge NGFW Cluster',
        ip: '10.88.88.254',
        x: 350,
        y: 190
      },
      {
        id: 'victim',
        type: 'infected',
        labelZh: `受害端點 (${incident.host})`,
        labelEn: `Victim (${incident.host})`,
        ip: incident.host.includes('.') ? incident.host : (incident.srcIp.startsWith('10.') ? incident.srcIp : '10.88.88.106'),
        x: 590,
        y: 140,
        patientZero: true
      },
      {
        id: 'target',
        type: 'target',
        labelZh: `目標 / C2 (${incident.destIp})`,
        labelEn: `Target / C2 (${incident.destIp})`,
        ip: incident.destIp,
        x: 830,
        y: 190
      }
    ];

    if (incident.affectedAssets && incident.affectedAssets.length > 1 && incident.affectedAssets[1] !== incident.host) {
      nodes.push({
        id: 'lateral-asset',
        type: 'target',
        labelZh: `關聯資產 (${incident.affectedAssets[1]})`,
        labelEn: `Related Asset (${incident.affectedAssets[1]})`,
        ip: '10.88.88.202',
        x: 830,
        y: 280
      });
    }

    const links: AttackTopologyLink[] = [
      {
        source: 'attacker',
        target: 'gateway',
        labelZh: '外部探針連線 (TCP/SSL)',
        labelEn: 'Inbound Probe (TCP/SSL)',
        type: 'entry'
      },
      {
        source: 'gateway',
        target: 'victim',
        labelZh: incident.mitreTactic?.substring(0, 20) || '惡意載荷傳輸',
        labelEn: incident.mitreTactic?.substring(0, 20) || 'Payload Delivery',
        type: 'infection'
      },
      {
        source: 'victim',
        target: 'target',
        labelZh: incident.actionZh?.substring(0, 16) || 'SOAR 微隔離攔截',
        labelEn: incident.actionEn?.substring(0, 16) || 'SOAR Intercept',
        type: 'exfil'
      }
    ];

    if (nodes.some(n => n.id === 'lateral-asset')) {
      links.push({
        source: 'victim',
        target: 'lateral-asset',
        labelZh: '內部橫向移動',
        labelEn: 'Lateral Movement',
        type: 'lateral'
      });
    }

    const timeline: AttackTimelineEvent[] = [
      { time: '12:20:00', eventZh: '外部來源 IP 建立探針連線與掃描', eventEn: 'Inbound probe & port scan detected', status: 'detected' },
      { time: '12:22:15', eventZh: `${incident.host} 觸發 ${incident.threatZh.substring(0, 24)}`, eventEn: `Triggered ${incident.threatEn.substring(0, 24)}`, status: 'alert' },
      { time: '12:24:08', eventZh: `SEMOR SOAR 執行處置：${incident.actionZh}`, eventEn: `SEMOR SOAR executed: ${incident.actionEn}`, status: 'critical' }
    ];

    return { nodes, links, timeline };
  }, [incident]);

  const [activeTimelineStep, setActiveTimelineStep] = useState(topologyData.timeline.length - 1);

  useEffect(() => {
    setActiveTimelineStep(topologyData.timeline.length - 1);
  }, [topologyData]);

  // Timeline playback loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingTimeline) {
      timer = setInterval(() => {
        setActiveTimelineStep((prev) => {
          if (prev >= topologyData.timeline.length - 1) {
            setIsPlayingTimeline(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline, topologyData.timeline.length]);

  // Render SVG D3 Topology
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 440;

    // Defs for gradients & markers
    const defs = svg.append('defs');

    // Arrow markers
    defs.append('marker')
      .attr('id', 'arrow-head')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');

    defs.append('marker')
      .attr('id', 'arrow-head-red')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444');

    // Filter glow
    const filter = defs.append('filter').attr('id', 'node-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('transform', 'translate(20, 20)');

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const nodeMap = new Map<string, AttackTopologyNode>();
    topologyData.nodes.forEach((n) => nodeMap.set(n.id, n));

    topologyData.links.forEach((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);
      if (!sourceNode || !targetNode) return;

      const isCritical = link.type === 'lateral' || link.type === 'exfil' || link.type === 'infection';

      // Path
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;

      linkGroup.append('path')
        .attr('d', link.type === 'exfil'
          ? `M${sourceNode.x},${sourceNode.y}A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`
          : `M${sourceNode.x},${sourceNode.y}L${targetNode.x},${targetNode.y}`
        )
        .attr('fill', 'none')
        .attr('stroke', isCritical ? '#ef4444' : '#475569')
        .attr('stroke-width', isCritical ? 2 : 1.5)
        .attr('stroke-dasharray', link.type === 'exfil' ? '4,4' : 'none')
        .attr('marker-end', isCritical ? 'url(#arrow-head-red)' : 'url(#arrow-head)');

      // Link label
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = link.type === 'exfil' ? (sourceNode.y + targetNode.y) / 2 - 50 : (sourceNode.y + targetNode.y) / 2 - 8;

      linkGroup.append('text')
        .attr('x', midX)
        .attr('y', midY)
        .attr('text-anchor', 'middle')
        .attr('fill', isCritical ? '#f87171' : '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(isZh ? link.labelZh : link.labelEn);
    });

    // Draw Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    topologyData.nodes.forEach((node) => {
      const nodeG = nodeGroup.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => setSelectedNode(node));

      const isPatientZero = !!node.patientZero;
      const isAttacker = node.type === 'attacker';
      const isTarget = node.type === 'target';

      // Node background circle
      const baseColor = isAttacker ? '#ef4444' : isPatientZero ? '#f97316' : isTarget ? '#a855f7' : '#3b82f6';

      // Pulse ring for patient zero or attacker
      if (isPatientZero || isAttacker) {
        nodeG.append('circle')
          .attr('r', 24)
          .attr('fill', 'none')
          .attr('stroke', baseColor)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.6)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '20;30;20')
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');
      }

      nodeG.append('circle')
        .attr('r', 18)
        .attr('fill', '#111114')
        .attr('stroke', baseColor)
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#node-glow)');

      // Center symbol / icon
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('fill', baseColor)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(node.id.substring(0, 3));

      // Node Label
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 30)
        .attr('fill', '#f1f5f9')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(isZh ? node.labelZh : node.labelEn);

      // Node IP
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 44)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(node.ip);
    });

  }, [isZh, topologyData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#111114] border border-gray-700/80 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-950/20 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Workflow size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {isZh ? '動態攻擊鏈拓撲與感染路徑圖譜' : 'Dynamic Attack Path & Infection Topology Graph'}
                </h3>
                {incident && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                    {incident.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh
                  ? '還原外部 C2 中繼站到零號受害主機 (Patient Zero) 及內網橫向擴散完整攻擊路徑'
                  : 'Reconstructed attack kill-chain from C2 entry to internal lateral pivot'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: D3 SVG Canvas */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="w-full bg-black/60 rounded-xl border border-gray-800 p-2 overflow-x-auto">
            <svg
              ref={svgRef}
              viewBox="0 0 960 440"
              className="w-full min-w-[850px] h-[360px]"
            />
          </div>

          {/* Bottom control bar & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Timeline playback controls */}
            <div className="lg:col-span-2 bg-black/40 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                  <Clock size={14} className="text-blue-400" />
                  <span>{isZh ? '攻擊序列時間軸 (Incident Timeline)' : 'Attack Timeline Playback'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeTimelineStep >= topologyData.timeline.length - 1) {
                        setActiveTimelineStep(0);
                      }
                      setIsPlayingTimeline(!isPlayingTimeline);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {isPlayingTimeline ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPlayingTimeline ? (isZh ? '暫停' : 'Pause') : (isZh ? '重播' : 'Play')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPlayingTimeline(false);
                      setActiveTimelineStep(topologyData.timeline.length - 1);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {topologyData.timeline.map((step, idx) => {
                  const isActive = idx <= activeTimelineStep;
                  const isCurrent = idx === activeTimelineStep;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveTimelineStep(idx)}
                      className={cn(
                        "p-2 rounded-lg text-xs flex items-center justify-between border transition-all cursor-pointer",
                        isCurrent
                          ? "bg-blue-950/30 border-blue-500 text-white font-semibold"
                          : isActive
                          ? "bg-gray-900/40 border-gray-800 text-gray-300"
                          : "opacity-40 border-transparent text-gray-500"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-400">{step.time}</span>
                        <span className="text-[11px]">{isZh ? step.eventZh : step.eventEn}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase",
                        step.status === 'critical' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                      )}>
                        {step.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Node Details or SOAR quick action */}
            <div className="bg-black/40 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target size={14} className="text-red-400" />
                  <span>{isZh ? '實體節點分析' : 'Node Inspector'}</span>
                </div>

                {selectedNode ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800">
                      <div className="text-sm font-bold text-white mb-0.5">
                        {isZh ? selectedNode.labelZh : selectedNode.labelEn}
                      </div>
                      <div className="text-gray-400 font-mono text-[11px]">{selectedNode.ip}</div>
                    </div>

                    <div className="space-y-1 text-[11px] text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{isZh ? '分類類型：' : 'Type:'}</span>
                        <span className="font-bold text-blue-400">{selectedNode.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{isZh ? '零號受害者：' : 'Patient Zero:'}</span>
                        <span className={selectedNode.patientZero ? "text-red-400 font-bold" : "text-gray-400"}>
                          {selectedNode.patientZero ? (isZh ? '是 (初始被感染點)' : 'Yes (Initial Breach)') : (isZh ? '否' : 'No')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-xs text-gray-500 italic bg-gray-900/40 rounded-lg border border-gray-800">
                    {isZh ? '點選上方拓撲圖中任一節點以檢視詳細資產狀態與連線紀錄' : 'Click any node on the topology graph to inspect details'}
                  </div>
                )}
              </div>

              {onExecuteContainment && (
                <button
                  onClick={onExecuteContainment}
                  className="w-full mt-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20"
                >
                  {isZh ? '針對受害節點下發隔離' : 'Quarantine Compromised Node'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{isZh ? '已捕獲 C2 通道連線並在次世代邊界防火牆建立阻斷規則' : 'C2 egress rule established at edge NGFW'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-all"
          >
            {isZh ? '關閉視窗' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

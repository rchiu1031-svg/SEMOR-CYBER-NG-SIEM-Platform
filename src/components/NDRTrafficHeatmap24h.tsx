import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Zap, Activity, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, 
  Flame, Clock, Filter, Eye, Layers, Globe, Radio, Play, Pause, 
  Sliders, ArrowUpRight, ArrowDownRight, Terminal, Shield, FileDown, 
  ChevronRight, Sparkles, X, Check, Info, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface HeatmapCell {
  hour: number;
  timeLabel: string;
  categoryId: string;
  categoryLabelZh: string;
  categoryLabelEn: string;
  trafficMbps: number;
  totalBytesGB: number;
  sessionCount: number;
  anomalyScore: number;
  isAbnormal: boolean;
  isCurrentHour: boolean;
  abnormalCluster?: {
    clusterId: string;
    timeRange: string;
    threatType: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    anomalyScore: number;
    confidencePct: number;
    peakMbps: number;
    normalBaselineMbps: number;
    deviationPct: string;
    affectedHosts: string[];
    description: string;
  };
}

export interface AbnormalClusterSummary {
  clusterId: string;
  timeRange: string;
  hourStart: number;
  hourEnd: number;
  threatType: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  anomalyScore: number;
  confidencePct: number;
  peakMbps: number;
  normalBaselineMbps: number;
  deviationPct: string;
  affectedHosts: string[];
  description: string;
}

interface NDRTrafficHeatmapProps {
  isZh: boolean;
  showToast?: (msg: string) => void;
  onIsolateHost?: (ip: string, reason?: string) => void;
}

export default function NDRTrafficHeatmap24h({ isZh, showToast, onIsolateHost }: NDRTrafficHeatmapProps) {
  // Navigation / Dimension states
  const [dimension, setDimension] = useState<'zones' | 'protocols' | 'days'>('zones');
  const [metricMode, setMetricMode] = useState<'bandwidth' | 'anomaly' | 'sessions'>('bandwidth');
  const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(75);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());

  // Data states
  const [matrixData, setMatrixData] = useState<HeatmapCell[]>([]);
  const [summaryData, setSummaryData] = useState<{
    total24hVolumeGB: number;
    maxThroughputMbps: number;
    minThroughputMbps: number;
    peakPeriod: string;
    totalAnomaliesDetected: number;
    activeAbnormalClustersCount: number;
  }>({
    total24hVolumeGB: 18450,
    maxThroughputMbps: 2240,
    minThroughputMbps: 18,
    peakPeriod: '12:00 - 14:00 (1,850 Mbps Peak)',
    totalAnomaliesDetected: 4,
    activeAbnormalClustersCount: 4
  });
  const [abnormalClustersList, setAbnormalClustersList] = useState<AbnormalClusterSummary[]>([]);

  // Selection & Inspector State
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  // SVG & D3 reference
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch 24h heatmap dataset from backend API
  const fetchHeatmapData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/ndr/bandwidth/heatmap-24h?dimension=${dimension}&metric=${metricMode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.matrix)) {
          setMatrixData(data.matrix);
          if (data.summary) setSummaryData(data.summary);
          if (Array.isArray(data.abnormalClusters)) {
            setAbnormalClustersList(data.abnormalClusters);
          }
          setLastUpdatedTime(new Date());

          // Re-sync selected cell with fresh data if already chosen
          if (selectedCell) {
            const fresh = data.matrix.find((c: HeatmapCell) => 
              c.hour === selectedCell.hour && c.categoryId === selectedCell.categoryId
            );
            if (fresh) setSelectedCell(fresh);
          }
          return;
        }
      }
      generateFallbackMatrix();
    } catch (e) {
      console.warn('NDR Heatmap fetch error, using local fallback generation:', e);
      generateFallbackMatrix();
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Generate fallback matrix in case server is restarting
  const generateFallbackMatrix = () => {
    const cats = dimension === 'protocols' 
      ? [
          { id: 'tls', labelZh: 'TLS 1.3 / HTTPS', labelEn: 'TLS 1.3 / HTTPS', baseLoad: 980 },
          { id: 'quic', labelZh: 'QUIC / HTTP3', labelEn: 'QUIC / HTTP3', baseLoad: 340 },
          { id: 'dns', labelZh: 'DNS 查詢 (UDP 53)', labelEn: 'DNS (UDP 53)', baseLoad: 210 },
          { id: 'smb', labelZh: 'SMBv3 / RPC 傳輸', labelEn: 'SMBv3 / RPC', baseLoad: 180 },
          { id: 'dbproto', labelZh: 'PostgreSQL Wire 協定', labelEn: 'PostgreSQL Wire', baseLoad: 290 },
          { id: 'ssh', labelZh: 'SSH 遠端管理 (TCP 22)', labelEn: 'SSH Admin', baseLoad: 85 }
        ]
      : dimension === 'days'
      ? [
          { id: 'mon', labelZh: '週一 (Mon)', labelEn: 'Monday', baseLoad: 720 },
          { id: 'tue', labelZh: '週二 (Tue)', labelEn: 'Tuesday', baseLoad: 850 },
          { id: 'wed', labelZh: '週三 (Wed)', labelEn: 'Wednesday', baseLoad: 920 },
          { id: 'thu', labelZh: '週四 (Thu)', labelEn: 'Thursday', baseLoad: 880 },
          { id: 'fri', labelZh: '週五 (Fri)', labelEn: 'Friday', baseLoad: 790 },
          { id: 'sat', labelZh: '週六 (Sat)', labelEn: 'Saturday', baseLoad: 380 },
          { id: 'sun', labelZh: '週日 (Sun)', labelEn: 'Sunday', baseLoad: 340 }
        ]
      : [
          { id: 'wan', labelZh: 'WAN 邊界出口網閘', labelEn: 'WAN Gateway', baseLoad: 750 },
          { id: 'dmz', labelZh: 'DMZ 對外應用伺服群', labelEn: 'DMZ Web Farm', baseLoad: 680 },
          { id: 'core', labelZh: '40G 高速核心骨幹', labelEn: 'Core Backbone 40G', baseLoad: 1450 },
          { id: 'k8s', labelZh: 'K8s 容器微服務網格', labelEn: 'K8s Microservices', baseLoad: 820 },
          { id: 'db', labelZh: '資料庫主備叢集 (DB)', labelEn: 'Database Cluster', baseLoad: 560 },
          { id: 'endpoints', labelZh: 'SOC 終端分析工作站', labelEn: 'Workstations / Endpoints', baseLoad: 390 },
          { id: 'vpn', labelZh: 'VPN 遠端安全通道', labelEn: 'VPN Remote Ingress', baseLoad: 320 }
        ];

    const curH = new Date().getHours();
    const fallbackList: HeatmapCell[] = [];

    cats.forEach(cat => {
      for (let h = 0; h < 24; h++) {
        const isAbn = (cat.id === 'db' && h >= 2 && h <= 3) || (cat.id === 'wan' && h === 17);
        const tf = h >= 9 && h <= 17 ? 1.0 : (h >= 6 ? 0.5 : 0.2);
        const mbps = Math.round(cat.baseLoad * tf * (isAbn ? 2.2 : 1.0));
        fallbackList.push({
          hour: h,
          timeLabel: `${h.toString().padStart(2, '0')}:00`,
          categoryId: cat.id,
          categoryLabelZh: cat.labelZh,
          categoryLabelEn: cat.labelEn,
          trafficMbps: mbps,
          totalBytesGB: Number(((mbps * 3600) / (8 * 1024)).toFixed(2)),
          sessionCount: mbps * 20,
          anomalyScore: isAbn ? 96 : Math.floor(Math.random() * 20 + 5),
          isAbnormal: isAbn,
          isCurrentHour: h === curH,
          abnormalCluster: isAbn ? {
            clusterId: 'AC-01',
            timeRange: '02:00 - 04:00',
            threatType: '離峰異常橫向漫延與資料外洩 (Off-Hours Lateral SMB Movement)',
            severity: 'Critical',
            anomalyScore: 96,
            confidencePct: 98.4,
            peakMbps: 680,
            normalBaselineMbps: 95,
            deviationPct: '+615%',
            affectedHosts: ['10.88.88.106', '10.88.88.200'],
            description: '端點 WS07 對核心資料庫發起高頻未授權 SMB 檔案讀取'
          } : undefined
        });
      }
    });

    setMatrixData(fallbackList);
  };

  // Trigger fetch on dimension change
  useEffect(() => {
    fetchHeatmapData(false);
  }, [dimension]);

  // Real-time live polling
  useEffect(() => {
    if (!isLiveStreaming) return;
    const timer = setInterval(() => {
      fetchHeatmapData(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [isLiveStreaming, dimension, metricMode]);

  // Distinct category list
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    matrixData.forEach(d => {
      if (!map.has(d.categoryId)) {
        map.set(d.categoryId, {
          id: d.categoryId,
          label: isZh ? d.categoryLabelZh : d.categoryLabelEn
        });
      }
    });
    return Array.from(map.values());
  }, [matrixData, isZh]);

  // Hours range (0..23)
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  // ---------------------------------------------------------------------------
  // D3.JS RENDERING ENGINE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || matrixData.length === 0 || categories.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Responsive container measurements
    const containerWidth = containerRef.current?.clientWidth || 980;
    const margin = { top: 40, right: 30, bottom: 40, left: 160 };
    const width = containerWidth - margin.left - margin.right;
    const rowHeight = 36;
    const height = categories.length * rowHeight;
    const totalSvgHeight = height + margin.top + margin.bottom;

    svg.attr('viewBox', `0 0 ${containerWidth} ${totalSvgHeight}`)
       .attr('width', '100%')
       .attr('height', totalSvgHeight);

    // Defs: Filters and Linear Gradients for Anomaly Glow
    const defs = svg.append('defs');

    // Glow filter for abnormal clusters
    const glowFilter = defs.append('filter')
      .attr('id', 'heat-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // D3 Scales
    const xScale = d3.scaleBand<number>()
      .domain(hours)
      .range([0, width])
      .padding(0.08);

    const yScale = d3.scaleBand<string>()
      .domain(categories.map(c => c.id))
      .range([0, height])
      .padding(0.12);

    // Color Scales based on selected metric
    const maxBandwidth = d3.max(matrixData, d => d.trafficMbps) || 2000;
    const maxSessions = d3.max(matrixData, d => d.sessionCount) || 50000;

    // Multi-stop cybersecurity color scales
    const bandwidthColorScale = d3.scaleLinear<string>()
      .domain([0, maxBandwidth * 0.15, maxBandwidth * 0.45, maxBandwidth * 0.75, maxBandwidth])
      .range(['#0d1424', '#0369a1', '#059669', '#d97706', '#e11d48']);

    const anomalyColorScale = d3.scaleLinear<string>()
      .domain([0, 30, 60, 75, 100])
      .range(['#0a1122', '#1e293b', '#eab308', '#f97316', '#ef4444']);

    const sessionsColorScale = d3.scaleLinear<string>()
      .domain([0, maxSessions * 0.25, maxSessions * 0.6, maxSessions])
      .range(['#0b1329', '#4338ca', '#9333ea', '#ec4899']);

    const getColor = (d: HeatmapCell) => {
      // If cell exceeds sensitivity threshold or is flagged as abnormal cluster
      if (d.anomalyScore >= sensitivityThreshold || d.isAbnormal) {
        return '#ef4444'; // Immediate neon alert
      }
      if (metricMode === 'anomaly') {
        return anomalyColorScale(d.anomalyScore);
      } else if (metricMode === 'sessions') {
        return sessionsColorScale(d.sessionCount);
      } else {
        return bandwidthColorScale(d.trafficMbps);
      }
    };

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // -------------------------------------------------------------------------
    // Background Peak Traffic Period Highlight Overlay (11:00 - 16:00)
    // -------------------------------------------------------------------------
    const peakStart = xScale(11) || 0;
    const peakEnd = (xScale(16) || 0) + xScale.bandwidth();
    const peakWidth = peakEnd - peakStart;

    g.append('rect')
      .attr('x', peakStart)
      .attr('y', -6)
      .attr('width', peakWidth)
      .attr('height', height + 12)
      .attr('fill', 'rgba(59, 130, 246, 0.04)')
      .attr('stroke', 'rgba(59, 130, 246, 0.2)')
      .attr('stroke-dasharray', '3,3')
      .attr('rx', 8)
      .attr('pointer-events', 'none');

    g.append('text')
      .attr('x', peakStart + peakWidth / 2)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#60a5fa')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '700')
      .text(isZh ? '⚡ 白天企業業務常態高峰期 (11:00 - 16:00)' : '⚡ Daytime Peak Period (11:00 - 16:00)');

    // -------------------------------------------------------------------------
    // Render Heatmap Grid Cells
    // -------------------------------------------------------------------------
    const cellGroups = g.selectAll('.heat-cell')
      .data(matrixData)
      .enter()
      .append('g')
      .attr('class', 'heat-cell cursor-pointer')
      .attr('transform', d => `translate(${xScale(d.hour) || 0}, ${yScale(d.categoryId) || 0})`);

    // Main Cell Rect
    cellGroups.append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => getColor(d))
      .attr('stroke', d => {
        if (selectedCell && selectedCell.hour === d.hour && selectedCell.categoryId === d.categoryId) {
          return '#38bdf8'; // Selected focus stroke
        }
        if (d.anomalyScore >= sensitivityThreshold || d.isAbnormal) {
          return '#f43f5e'; // Abnormal stroke
        }
        return 'rgba(255, 255, 255, 0.05)';
      })
      .attr('stroke-width', d => {
        if (selectedCell && selectedCell.hour === d.hour && selectedCell.categoryId === d.categoryId) {
          return 2.5;
        }
        return d.isAbnormal ? 1.8 : 0.8;
      })
      .attr('opacity', 0.92)
      .attr('filter', d => (d.isAbnormal || d.anomalyScore >= sensitivityThreshold) ? 'url(#heat-glow)' : 'none')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(120)
          .attr('opacity', 1)
          .attr('transform', 'scale(1.08)')
          .attr('transform-origin', 'center');

        // Show D3 Tooltip
        tooltip
          .style('opacity', 1)
          .html(`
            <div class="space-y-1.5 p-1 font-mono text-[11px]">
              <div class="flex items-center justify-between gap-3 border-b border-gray-700/60 pb-1">
                <span class="font-bold text-white">${isZh ? d.categoryLabelZh : d.categoryLabelEn}</span>
                <span class="text-blue-400 font-bold">${d.timeLabel}</span>
              </div>
              <div class="space-y-0.5 text-gray-300">
                <div class="flex justify-between gap-4">
                  <span class="text-gray-400">${isZh ? '頻寬吞吐:' : 'Throughput:'}</span>
                  <span class="text-emerald-400 font-bold">${d.trafficMbps} Mbps</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-400">${isZh ? '小時累計流量:' : 'Volume:'}</span>
                  <span class="text-gray-200">${d.totalBytesGB} GB</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-400">${isZh ? '連線階段數:' : 'Sessions:'}</span>
                  <span class="text-gray-200">${d.sessionCount.toLocaleString()} flows</span>
                </div>
                <div class="flex justify-between gap-4 border-t border-gray-800 pt-1">
                  <span class="text-gray-400">${isZh ? '異常偏離指數:' : 'Anomaly Score:'}</span>
                  <span class="${d.anomalyScore >= 75 ? 'text-rose-400 font-black' : 'text-cyan-400'}">${d.anomalyScore} / 100</span>
                </div>
              </div>
              ${d.isAbnormal || d.abnormalCluster ? `
                <div class="mt-1 pt-1 border-t border-rose-500/30 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                  <span>🚨 ${isZh ? '檢測到異常流量叢集' : 'Abnormal Cluster'}</span>
                  <span>(${d.abnormalCluster?.deviationPct || '+480%'})</span>
                </div>
              ` : ''}
              <div class="text-[9px] text-gray-500 pt-0.5">${isZh ? '點擊此單元格調閱深層鑑識' : 'Click to inspect forensic logs'}</div>
            </div>
          `);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 14}px`)
          .style('top', `${event.pageY - 40}px`);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(120)
          .attr('opacity', 0.92)
          .attr('transform', 'scale(1.0)');

        tooltip.style('opacity', 0);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedCell(d);
        if (showToast) {
          showToast(isZh ? `已鎖定 ${d.timeLabel} [${d.categoryLabelZh}] 流量單元格鑑識！` : `Inspecting ${d.timeLabel} ${d.categoryLabelEn}`);
        }
      });

    // Anomaly Warning Badge inside abnormal cells
    cellGroups.filter(d => d.isAbnormal || d.anomalyScore >= sensitivityThreshold)
      .append('circle')
      .attr('cx', xScale.bandwidth() / 2)
      .attr('cy', yScale.bandwidth() / 2)
      .attr('r', 3.5)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.95);

    cellGroups.filter(d => d.isAbnormal || d.anomalyScore >= sensitivityThreshold)
      .append('circle')
      .attr('cx', xScale.bandwidth() / 2)
      .attr('cy', yScale.bandwidth() / 2)
      .attr('r', 7)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.8)
      .append('animate')
      .attr('attributeName', 'r')
      .attr('values', '4;9;4')
      .attr('dur', '1.8s')
      .attr('repeatCount', 'indefinite');

    // -------------------------------------------------------------------------
    // Current Hour Indicator Line (Vertical Pulse Line)
    // -------------------------------------------------------------------------
    const currentHourIndex = new Date().getHours();
    const curHourPos = (xScale(currentHourIndex) || 0) + xScale.bandwidth() / 2;

    const currentHourGroup = g.append('g').attr('class', 'current-hour-indicator');

    currentHourGroup.append('line')
      .attr('x1', curHourPos)
      .attr('y1', -8)
      .attr('x2', curHourPos)
      .attr('y2', height + 8)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2')
      .attr('opacity', 0.85);

    currentHourGroup.append('circle')
      .attr('cx', curHourPos)
      .attr('cy', -8)
      .attr('r', 4)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#0c1527')
      .attr('stroke-width', 1.5);

    currentHourGroup.append('text')
      .attr('x', curHourPos)
      .attr('y', -16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#38bdf8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '800')
      .text('NOW');

    // -------------------------------------------------------------------------
    // X-Axis (24 Hours Labels)
    // -------------------------------------------------------------------------
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${d.toString().padStart(2, '0')}:00`)
      .tickSize(4);

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0, ${height + 6})`)
      .call(xAxis as any);

    xAxisGroup.select('.domain').attr('stroke', '#27272a');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#3f3f46');
    xAxisGroup.selectAll('.tick text')
      .attr('fill', (d: any) => d === currentHourIndex ? '#38bdf8' : '#71717a')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', (d: any) => d === currentHourIndex ? '800' : '500')
      .attr('transform', 'rotate(-35)')
      .attr('text-anchor', 'end')
      .attr('dx', '-4px')
      .attr('dy', '6px');

    // -------------------------------------------------------------------------
    // Y-Axis (Category Labels)
    // -------------------------------------------------------------------------
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(id => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.label : id;
      })
      .tickSize(0);

    const yAxisGroup = g.append('g')
      .attr('transform', 'translate(-8, 0)')
      .call(yAxis as any);

    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('.tick text')
      .attr('fill', '#d4d4d8')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('text-anchor', 'end');

    // -------------------------------------------------------------------------
    // Create / Hook Tooltip Element
    // -------------------------------------------------------------------------
    let tooltip = d3.select('body').select<HTMLDivElement>('.d3-ndr-heatmap-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
        .attr('class', 'd3-ndr-heatmap-tooltip fixed z-50 pointer-events-none px-3 py-2 bg-[#09090b]/95 border border-gray-700 rounded-xl shadow-2xl backdrop-blur-md transition-opacity duration-150 opacity-0')
        .style('max-width', '280px');
    }

    return () => {
      tooltip.remove();
    };
  }, [matrixData, categories, metricMode, sensitivityThreshold, isZh, selectedCell]);

  return (
    <div className="space-y-6">
      {/* 24-HOUR D3 TRAFFIC HEATMAP CARD */}
      <div className="bg-[#111114] border border-gray-800/90 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
                <Flame size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2.5">
                  {isZh ? '24 小時網路流量時態熱力圖與異常叢集檢測' : '24-Hour Traffic Density & Anomaly Flow Clusters Heatmap'}
                  <span className="px-2.5 py-0.5 text-[9px] uppercase font-mono font-black bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full">
                    D3.js Vector Engine
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isZh 
                    ? '即時可視化 24 小時業務高峰時段負載，運用統計機器學習演算法自動標記異常流量離群叢集 (Flow Outliers)。' 
                    : 'Visualizing peak traffic windows and detecting abnormal flow clusters across enterprise zones.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Controls & Metric Mode Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dimension Switcher */}
            <div className="flex bg-[#09090b] p-1 rounded-2xl border border-gray-800 text-xs">
              <button
                onClick={() => setDimension('zones')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5",
                  dimension === 'zones' ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-gray-400 hover:text-white"
                )}
              >
                <Layers size={13} />
                <span>{isZh ? '網段架構 (Zones)' : 'Zones'}</span>
              </button>
              <button
                onClick={() => setDimension('protocols')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5",
                  dimension === 'protocols' ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-gray-400 hover:text-white"
                )}
              >
                <Globe size={13} />
                <span>{isZh ? '協定分布 (Protocols)' : 'Protocols'}</span>
              </button>
              <button
                onClick={() => setDimension('days')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5",
                  dimension === 'days' ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-gray-400 hover:text-white"
                )}
              >
                <Clock size={13} />
                <span>{isZh ? '一週時態 (7 Days)' : '7 Days'}</span>
              </button>
            </div>

            {/* Metric Mode Filter */}
            <div className="flex bg-[#09090b] p-1 rounded-2xl border border-gray-800 text-xs">
              <button
                onClick={() => setMetricMode('bandwidth')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all",
                  metricMode === 'bandwidth' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-gray-400 hover:text-white"
                )}
              >
                {isZh ? '總頻寬 (Mbps)' : 'Throughput'}
              </button>
              <button
                onClick={() => setMetricMode('anomaly')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all",
                  metricMode === 'anomaly' ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "text-gray-400 hover:text-white"
                )}
              >
                {isZh ? '異常偏離指數' : 'Anomaly Score'}
              </button>
              <button
                onClick={() => setMetricMode('sessions')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all",
                  metricMode === 'sessions' ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-gray-400 hover:text-white"
                )}
              >
                {isZh ? '連線數 (Flows)' : 'Sessions'}
              </button>
            </div>

            {/* Live Streaming Toggle */}
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={cn(
                "px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all shadow-sm",
                isLiveStreaming 
                  ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-gray-800/60 border-gray-700 text-gray-400"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", isLiveStreaming ? "bg-emerald-400 animate-pulse" : "bg-gray-500")} />
              <span>{isLiveStreaming ? (isZh ? '即時串流同步' : 'Live Syncing') : (isZh ? '串流已暫停' : 'Paused')}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchHeatmapData(false)}
              disabled={isLoading}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-2xl transition-colors border border-gray-700"
              title={isZh ? '手動更新熱力圖資料' : 'Refresh Heatmap'}
            >
              <RefreshCw size={14} className={cn(isLoading && "animate-spin text-blue-400")} />
            </button>
          </div>
        </div>

        {/* 4-KPI Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#09090b] border border-gray-800/80 p-3.5 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '24 小時全網流量吞吐' : '24h Total Traffic'}</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-white">{(summaryData.total24hVolumeGB / 1024).toFixed(1)}</span>
              <span className="text-xs text-gray-400 font-mono">TB</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">{isZh ? '雙向零丟包監控' : 'Zero Loss Tap'}</span>
          </div>

          <div className="bg-[#09090b] border border-gray-800/80 p-3.5 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '今日高峰業務時段' : 'Peak Traffic Period'}</span>
            <div className="text-sm font-black font-mono text-blue-400 mt-1 truncate">
              {summaryData.peakPeriod}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">{isZh ? '核心交換負載 74%' : 'Core Load 74%'}</span>
          </div>

          <div className="bg-[#09090b] border border-gray-800/80 p-3.5 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '檢測到異常流量叢集' : 'Abnormal Flow Clusters'}</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-rose-400">{summaryData.activeAbnormalClustersCount}</span>
              <span className="text-xs text-rose-500/80 font-mono">{isZh ? '個潛在威脅叢集' : 'Active Clusters'}</span>
            </div>
            <span className="text-[10px] text-rose-400/80 mt-0.5 block">{isZh ? '包含離峰外洩與高熵 DNS' : 'Includes off-hours exfil'}</span>
          </div>

          <div className="bg-[#09090b] border border-gray-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase">{isZh ? '異常偵測靈敏度' : 'Detection Sensitivity'}</span>
              <span className="text-xs font-mono font-bold text-amber-400">{sensitivityThreshold}%</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={sensitivityThreshold}
                onChange={(e) => setSensitivityThreshold(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              />
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">{isZh ? '>= 75% 自動標註告警閃爍' : 'Threshold for cluster alert'}</span>
          </div>
        </div>

        {/* D3 Heatmap SVG Container */}
        <div ref={containerRef} className="w-full overflow-x-auto custom-scrollbar bg-[#09090b] border border-gray-800/80 rounded-2xl p-4 relative shadow-inner">
          <svg ref={svgRef} className="w-full select-none" />

          {/* Color Ramp Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-800/60 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-[11px] font-bold">
                {metricMode === 'bandwidth' ? (isZh ? '頻寬強度梯度 (Mbps):' : 'Throughput Scale:') :
                 metricMode === 'anomaly' ? (isZh ? '異常威脅程度 (Score):' : 'Anomaly Risk Scale:') :
                 (isZh ? '連線密度 (Flows):' : 'Flow Density:')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 font-mono">0</span>
                <div className={cn(
                  "w-36 h-2.5 rounded-full",
                  metricMode === 'bandwidth' ? "bg-gradient-to-r from-[#0d1424] via-[#059669] via-[#d97706] to-[#e11d48]" :
                  metricMode === 'anomaly' ? "bg-gradient-to-r from-[#0a1122] via-[#eab308] to-[#ef4444]" :
                  "bg-gradient-to-r from-[#0b1329] via-[#9333ea] to-[#ec4899]"
                )} />
                <span className="text-[10px] text-gray-400 font-mono">
                  {metricMode === 'bandwidth' ? '2.5 Gbps+' : metricMode === 'anomaly' ? '100 (Critical)' : '50k+'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                <span className="text-rose-400 font-bold font-mono">{isZh ? '異常流量離群叢集 (Flow Anomaly)' : 'Abnormal Cluster'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-400 font-mono">{isZh ? '當前時段 (NOW)' : 'Current Hour'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Abnormal Flow Clusters Quick Jump Carousel */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              {isZh ? '24 小時偵測到之異常流量叢集清單 (Detected Abnormal Flow Clusters)' : 'Detected Abnormal Flow Clusters'}
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              {isZh ? `點擊任一叢集即可在熱力圖聚焦` : 'Click cluster to inspect in heatmap'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {abnormalClustersList.map((cluster) => {
              const isSelected = selectedCell?.abnormalCluster?.clusterId === cluster.clusterId;
              return (
                <div
                  key={cluster.clusterId}
                  onClick={() => {
                    // Find matching cell
                    const target = matrixData.find(c => 
                      c.hour === cluster.hourStart && 
                      (c.isAbnormal || c.abnormalCluster?.clusterId === cluster.clusterId)
                    );
                    if (target) setSelectedCell(target);
                  }}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 shadow-lg",
                    isSelected 
                      ? "bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/40" 
                      : "bg-[#09090b] border-gray-800 hover:border-gray-700 hover:bg-[#0e0e12]"
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {cluster.timeRange}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      偏離 {cluster.deviationPct}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white line-clamp-1">
                    {cluster.threatType.split('(')[0]}
                  </p>

                  <div className="text-[11px] text-gray-400 flex justify-between font-mono">
                    <span>峰值: <strong className="text-rose-400">{cluster.peakMbps} Mbps</strong></span>
                    <span>可信度: <strong className="text-emerald-400">{cluster.confidencePct}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* ABNORMAL FLOW CLUSTER DEEP FORENSIC INSPECTOR (When Cell is Selected) */}
        {/* ------------------------------------------------------------------- */}
        <AnimatePresence>
          {selectedCell && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-[#0d0d10] border border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedCell(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                title={isZh ? '關閉鑑識面板' : 'Close Inspector'}
              >
                <X size={16} />
              </button>

              {/* Inspector Header */}
              <div className="flex items-center gap-3 pr-8">
                <div className={cn(
                  "p-2.5 rounded-xl border",
                  selectedCell.isAbnormal ? "bg-rose-500/15 border-rose-500/40 text-rose-400" : "bg-blue-500/15 border-blue-500/40 text-blue-400"
                )}>
                  {selectedCell.isAbnormal ? <ShieldAlert size={20} /> : <Activity size={20} />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{isZh ? '時態熱力單元格深層鑑識' : 'Heatmap Cell Forensic Deep Dive'}</span>
                    <span className="font-mono text-blue-400">[{selectedCell.timeLabel}]</span>
                    <span className="text-gray-400">• {isZh ? selectedCell.categoryLabelZh : selectedCell.categoryLabelEn}</span>
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    {selectedCell.isAbnormal 
                      ? (isZh ? '⚠️ 系統判定此時段存在重大異常流量叢集，偏離基線常態分佈。' : 'Abnormal flow cluster detected in this hourly window.') 
                      : (isZh ? '此時段流量屬於常態企業業務傳輸範圍。' : 'Flow metrics within normal enterprise baseline.')}
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#08080a] p-3.5 rounded-xl border border-gray-800 text-xs">
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">{isZh ? '小時平均吞吐' : 'Throughput'}</span>
                  <span className="text-base font-black font-mono text-emerald-400">{selectedCell.trafficMbps} Mbps</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">{isZh ? '小時總傳輸量' : 'Total Volume'}</span>
                  <span className="text-base font-black font-mono text-white">{selectedCell.totalBytesGB} GB</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">{isZh ? '連線 Sessions 數' : 'Session Count'}</span>
                  <span className="text-base font-black font-mono text-purple-400">{selectedCell.sessionCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">{isZh ? '異常偏離指數' : 'Anomaly Score'}</span>
                  <span className={cn("text-base font-black font-mono", selectedCell.anomalyScore >= 75 ? "text-rose-400" : "text-cyan-400")}>
                    {selectedCell.anomalyScore} / 100
                  </span>
                </div>
              </div>

              {/* Abnormal Cluster Details if applicable */}
              {selectedCell.abnormalCluster ? (
                <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      {selectedCell.abnormalCluster.threatType}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded font-mono font-bold text-[10px]">
                      {selectedCell.abnormalCluster.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {selectedCell.abnormalCluster.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-rose-900/30 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-[11px]">{isZh ? '關聯主機:' : 'Affected Hosts:'}</span>
                      {selectedCell.abnormalCluster.affectedHosts.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 bg-black/60 border border-rose-800/40 rounded text-[10px] font-mono text-rose-300">
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      {onIsolateHost && selectedCell.abnormalCluster.affectedHosts[0] && (
                        <button
                          onClick={() => onIsolateHost(selectedCell.abnormalCluster!.affectedHosts[0], '異常流量熱力圖叢集分析自動隔離')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/30"
                        >
                          <Lock size={12} />
                          <span>{isZh ? `隔離可疑來源 (${selectedCell.abnormalCluster.affectedHosts[0]})` : 'Isolate Host'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (showToast) showToast(isZh ? '已下發 Suricata 7.0 動態特徵碼攔截此時段異常特徵！' : 'Suricata rule deployed');
                        }}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        {isZh ? '下發 Suricata 阻斷規則' : 'Deploy Rule'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>{isZh ? '無異常流叢集，該時段封包行為與通訊協定均符合白名單常態模型。' : 'No anomalous cluster detected for this window.'}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Clock,
  Filter,
  Layers,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Download,
  Info,
  ChevronRight,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  Maximize2,
  RefreshCw,
  Search,
  ExternalLink,
  SlidersHorizontal,
  X,
  Target,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../lib/utils';

export type HeatmapDimension = 'tactics' | 'severity' | 'sources' | 'assets';
export type HeatmapMetric = 'count' | 'riskScore' | 'anomaly';

export interface IncidentRecord {
  id: string;
  time: string; // e.g., '14:22:10'
  hour: number;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  ruleName: string;
  source: string;
  patientZero: string;
  targetEntity: string;
  confidence: number;
  status: 'Active' | 'Investigating' | 'Mitigated';
  summary: string;
}

export interface CellData {
  hour: number;
  hourLabel: string; // '00:00' to '23:00'
  rowKey: string;
  rowLabel: string;
  count: number;
  riskScore: number; // 0 - 100
  anomalyScore: number; // 0 - 5.0 z-score
  isAnomalous: boolean;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  topRule: string;
  incidents: IncidentRecord[];
}

interface Correlation24hHeatmapProps {
  isZh?: boolean;
  onSelectIncident?: (incident: IncidentRecord) => void;
  className?: string;
  compact?: boolean;
}

// Generate deterministic, realistic 24-hour incident telemetry
function generate24hHeatmapDataset(isZh: boolean) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 1. MITRE ATT&CK Tactics
  const tacticsRows = [
    { key: 'TA0001', label: isZh ? 'TA0001 初始存取 (Initial Access)' : 'TA0001 Initial Access', short: 'Initial Access' },
    { key: 'TA0002', label: isZh ? 'TA0002 執行階段 (Execution)' : 'TA0002 Execution', short: 'Execution' },
    { key: 'TA0003', label: isZh ? 'TA0003 權限維持 (Persistence)' : 'TA0003 Persistence', short: 'Persistence' },
    { key: 'TA0004', label: isZh ? 'TA0004 特權提升 (Priv Escalation)' : 'TA0004 PrivEsc', short: 'PrivEsc' },
    { key: 'TA0005', label: isZh ? 'TA0005 防禦規避 (Defense Evasion)' : 'TA0005 Evasion', short: 'Evasion' },
    { key: 'TA0006', label: isZh ? 'TA0006 憑證竊取 (Credential Access)' : 'TA0006 Credential', short: 'Credential' },
    { key: 'TA0008', label: isZh ? 'TA0008 橫向移動 (Lateral Movement)' : 'TA0008 Lateral', short: 'Lateral Move' },
    { key: 'TA0011', label: isZh ? 'TA0011 命令控制 (Command & Control)' : 'TA0011 C2 Beacon', short: 'C2 Relay' },
    { key: 'TA0010', label: isZh ? 'TA0010 資料外洩 (Exfiltration)' : 'TA0010 Exfiltration', short: 'Exfiltration' },
  ];

  // 2. Severity Rows
  const severityRows = [
    { key: 'Critical', label: isZh ? '極高威脅 (Critical CVSS 9+)' : 'Critical (CVSS 9.0+)', short: 'Critical' },
    { key: 'High', label: isZh ? '高危威脅 (High CVSS 7-8.9)' : 'High (CVSS 7.0-8.9)', short: 'High' },
    { key: 'Medium', label: isZh ? '中度威脅 (Medium CVSS 4-6.9)' : 'Medium (CVSS 4.0-6.9)', short: 'Medium' },
    { key: 'Low', label: isZh ? '低度 / 警告 (Low/Warning)' : 'Low / Warning', short: 'Low' }
  ];

  // 3. Source Engines
  const sourcesRows = [
    { key: 'EDR', label: isZh ? '端點偵測 (CrowdStrike / EDR)' : 'Endpoint EDR / Falcon', short: 'EDR' },
    { key: 'NDR', label: isZh ? '網路流分析 (Suricata / NDR)' : 'Network Flow NDR', short: 'NDR' },
    { key: 'AD', label: isZh ? '身分驗證 (AD / Kerberos)' : 'Identity / Active Directory', short: 'Identity/AD' },
    { key: 'CLOUD', label: isZh ? '雲端稽核 (AWS CloudTrail)' : 'AWS CloudTrail / IAM', short: 'CloudTrail' },
    { key: 'MAIL', label: isZh ? '郵件閘道 (Office 365 / Mail)' : 'Mail Gateway (O365)', short: 'Mail GW' },
    { key: 'DAM', label: isZh ? '資料庫稽核 (DB Activity Audit)' : 'Database Audit (DAM)', short: 'DB Audit' }
  ];

  // 4. Asset Tiers
  const assetsRows = [
    { key: 'DC', label: isZh ? '網域控制站 (DC-PROD-01)' : 'Tier 0: Domain Controller', short: 'DC Prod' },
    { key: 'DB', label: isZh ? '核心資料庫 (SQL-DATA-MASTER)' : 'Tier 1: SQL Data Master', short: 'SQL Master' },
    { key: 'WS', label: isZh ? '關鍵端點 (WS-FINANCE-088)' : 'Tier 2: Finance Workstations', short: 'Finance WS' },
    { key: 'CLOUD_RES', label: isZh ? '雲端儲存庫 (S3 Customer Vault)' : 'Cloud: S3 Vault Storage', short: 'S3 Vault' },
    { key: 'PERIMETER', label: isZh ? '邊界閘道 (DMZ Ingress Proxy)' : 'Perimeter: DMZ Ingress', short: 'DMZ Proxy' }
  ];

  // Deterministic generator with attack bursts at 02:00-03:00 (Dark Dump) and 10:00-15:00 (Workday Peak)
  const buildGrid = (rows: { key: string; label: string; short: string }[]) => {
    const grid: CellData[] = [];

    rows.forEach((row, rIdx) => {
      hours.forEach((h) => {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;

        // Baseline volume
        let baseCount = 0;
        let isPeak = false;
        let isAnomalous = false;

        // Specific attack scenario injection:
        // Scenario A: 02:00 - 04:00 Off-Hours Anomalous Breach
        if (h >= 2 && h <= 3) {
          if (row.key === 'TA0010' || row.key === 'Critical' || row.key === 'DAM' || row.key === 'DB') {
            baseCount = 38 + ((rIdx * 7 + h * 13) % 24);
            isAnomalous = true;
          } else {
            baseCount = (h * 3 + rIdx * 2) % 6;
          }
        }
        // Scenario B: 10:00 - 15:00 Workday Lateral Movement & Phishing Campaign
        else if (h >= 10 && h <= 15) {
          isPeak = true;
          if (row.key === 'TA0001' && (h === 10 || h === 11)) baseCount = 52;
          else if (row.key === 'TA0008' && (h === 13 || h === 14)) baseCount = 68;
          else if (row.key === 'TA0011' && (h === 12 || h === 14)) baseCount = 47;
          else if (row.key === 'Critical' && (h === 14 || h === 15)) baseCount = 62;
          else if (row.key === 'High') baseCount = 45 + (h % 15);
          else if (row.key === 'EDR' || row.key === 'NDR') baseCount = 50 + ((h * 11) % 25);
          else {
            baseCount = 18 + ((h * 9 + rIdx * 5) % 22);
          }
        }
        // Scenario C: Evening beaconing (19:00 - 22:00)
        else if (h >= 19 && h <= 22) {
          if (row.key === 'TA0011' || row.key === 'NDR' || row.key === 'Medium') {
            baseCount = 22 + (h % 12);
          } else {
            baseCount = 4 + ((h + rIdx * 3) % 10);
          }
        }
        // Baseline off-hours (00:00, 01:00, 05:00 - 08:00, 23:00)
        else {
          baseCount = Math.max(0, ((h * 5 + rIdx * 7) % 14) - 4);
          if (h >= 5 && h <= 7) baseCount = Math.min(baseCount, 3);
        }

        const count = baseCount;
        const critical = Math.round(count * (isAnomalous ? 0.6 : isPeak ? 0.35 : 0.1));
        const high = Math.round(count * (isPeak ? 0.4 : 0.3));
        const medium = Math.round(count * 0.25);
        const low = Math.max(0, count - critical - high - medium);

        const riskScore = Math.min(100, Math.round(count > 0 ? (critical * 95 + high * 75 + medium * 50 + low * 20) / count : 5));
        const anomalyScore = isAnomalous ? 4.2 : isPeak ? 2.8 : Math.max(0.2, Number((count / 15).toFixed(1)));

        // Sample incidents list for cell detail drill-down
        const sampleIncidents: IncidentRecord[] = [];
        if (count > 0) {
          const numSamples = Math.min(5, Math.max(1, Math.ceil(count / 12)));
          for (let s = 0; s < numSamples; s++) {
            const minStr = (12 + s * 9).toString().padStart(2, '0');
            const secStr = (24 + s * 7).toString().padStart(2, '0');
            sampleIncidents.push({
              id: `INC-24H-${h.toString().padStart(2, '0')}${minStr}-${s + 1}`,
              time: `${h.toString().padStart(2, '0')}:${minStr}:${secStr}`,
              hour: h,
              category: row.label,
              severity: s === 0 && critical > 0 ? 'Critical' : s === 1 && high > 0 ? 'High' : 'Medium',
              ruleName: isAnomalous 
                ? (isZh ? '暗夜時段異常巨量資料庫導出與 S3 上傳' : 'Off-Hours High-Volume DB Dump & Exfil')
                : (isZh ? '多重端點記憶體注入與橫向 SMB 擴散' : 'Memory Injection & Lateral SMB Propagation'),
              source: row.short,
              patientZero: 'WS-FINANCE-088 (192.168.10.55)',
              targetEntity: isAnomalous ? 'SRV-SQL-DATA-MASTER (10.0.50.22)' : 'DC-PROD-01 (192.168.10.10)',
              confidence: 94 + (s % 5),
              status: isAnomalous ? 'Active' : s === 0 ? 'Investigating' : 'Mitigated',
              summary: isZh 
                ? `於 ${hourStr} 偵測到底層異常頻率聚合，觸發置信度 ${94 + (s % 5)}% 之關聯攻擊告警。`
                : `Correlated anomaly frequency cluster detected at ${hourStr} with ${94 + (s % 5)}% confidence.`
            });
          }
        }

        grid.push({
          hour: h,
          hourLabel: hourStr,
          rowKey: row.key,
          rowLabel: row.label,
          count,
          riskScore,
          anomalyScore,
          isAnomalous,
          severityBreakdown: { critical, high, medium, low },
          topRule: isAnomalous 
            ? (isZh ? 'CORR-804 暗夜資料外洩' : 'CORR-804 Off-Hours Exfil') 
            : (isZh ? 'CORR-801 橫向移動聯防' : 'CORR-801 Lateral Movement'),
          incidents: sampleIncidents
        });
      });
    });

    return grid;
  };

  return {
    tactics: { rows: tacticsRows, data: buildGrid(tacticsRows) },
    severity: { rows: severityRows, data: buildGrid(severityRows) },
    sources: { rows: sourcesRows, data: buildGrid(sourcesRows) },
    assets: { rows: assetsRows, data: buildGrid(assetsRows) },
  };
}

export default function Correlation24hHeatmap({
  isZh = true,
  onSelectIncident,
  className,
  compact = false
}: Correlation24hHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // States
  const [dimension, setDimension] = useState<HeatmapDimension>('tactics');
  const [metric, setMetric] = useState<HeatmapMetric>('count');
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [filterAnomaliesOnly, setFilterAnomaliesOnly] = useState(false);
  const [minCountFilter, setMinCountFilter] = useState<number>(0);
  const [selectedHourFilter, setSelectedHourFilter] = useState<number | null>(null);

  // Raw dataset
  const dataset = useMemo(() => generate24hHeatmapDataset(isZh), [isZh]);
  const activeDataset = dataset[dimension];

  // 24-Hour Summary Metrics
  const summaryMetrics = useMemo(() => {
    const data = activeDataset.data;
    const totalIncidents = data.reduce((acc, c) => acc + c.count, 0);

    // Hourly totals for marginal bar
    const hourlyTotals = Array.from({ length: 24 }, (_, h) => {
      const cellSubset = data.filter(c => c.hour === h);
      const sum = cellSubset.reduce((acc, c) => acc + c.count, 0);
      const crit = cellSubset.reduce((acc, c) => acc + c.severityBreakdown.critical, 0);
      return { hour: h, sum, crit };
    });

    // Row totals for marginal right
    const rowTotals = activeDataset.rows.map(r => {
      const cellSubset = data.filter(c => c.rowKey === r.key);
      const sum = cellSubset.reduce((acc, c) => acc + c.count, 0);
      return { key: r.key, label: r.label, short: r.short, sum };
    });

    // Peak hour
    let peakHour = 0;
    let maxHourlyCount = 0;
    hourlyTotals.forEach(item => {
      if (item.sum > maxHourlyCount) {
        maxHourlyCount = item.sum;
        peakHour = item.hour;
      }
    });

    // Off-hours count (00:00 - 07:00 + 19:00 - 23:00)
    const offHoursCount = hourlyTotals
      .filter(item => item.hour < 8 || item.hour >= 19)
      .reduce((acc, item) => acc + item.sum, 0);

    const offHoursRatio = totalIncidents > 0 ? Math.round((offHoursCount / totalIncidents) * 100) : 0;
    const anomalousCells = data.filter(c => c.isAnomalous);

    return {
      totalIncidents,
      hourlyTotals,
      rowTotals,
      peakHour,
      maxHourlyCount,
      offHoursRatio,
      anomalousCount: anomalousCells.length,
      maxCellCount: Math.max(...data.map(d => d.count), 1),
      maxRiskScore: 100,
      maxHourlySum: Math.max(...hourlyTotals.map(h => h.sum), 1)
    };
  }, [activeDataset]);

  // Color Scales using cyber SOC dark theme palettes
  const colorScale = useMemo(() => {
    if (metric === 'riskScore') {
      // 0 -> 100 Risk scale: Dark navy -> Cyan -> Amber -> Crimson Red
      return d3.scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateRgbBasis([
          '#111118',
          '#1e293b',
          '#0284c7',
          '#eab308',
          '#f97316',
          '#ef4444',
          '#fda4af'
        ]));
    }

    if (metric === 'anomaly') {
      // Z-score scale: Slate -> Violet -> Rose neon
      return d3.scaleSequential()
        .domain([0, 5])
        .interpolator(d3.interpolateRgbBasis([
          '#111118',
          '#1e1b4b',
          '#6366f1',
          '#c084fc',
          '#f43f5e',
          '#ffe4e6'
        ]));
    }

    // Default 'count' (Incident Frequency):
    // 0 -> maxCellCount: Deep dark -> Royal Blue -> Violet -> Flame Orange -> Neon Red -> Bright Flare
    return d3.scaleSequential()
      .domain([0, summaryMetrics.maxCellCount])
      .interpolator(d3.interpolateRgbBasis([
        '#101018',
        '#172554',
        '#1d4ed8',
        '#7e22ce',
        '#f97316',
        '#ef4444',
        '#fecdd3'
      ]));
  }, [metric, summaryMetrics.maxCellCount]);

  // Primary D3 Heatmap Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 960;
    const margin = {
      top: 55, // space for top marginal frequency bars + hour labels
      right: 90, // space for right row total badges
      bottom: 30, // bottom axis labels
      left: compact ? 130 : 200 // row category labels
    };

    const width = Math.max(760, containerWidth);
    const rowCount = activeDataset.rows.length;
    const cellHeight = compact ? 28 : 36;
    const height = margin.top + margin.bottom + (rowCount * cellHeight);

    svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const rowKeys = activeDataset.rows.map(r => r.key);

    const xScale = d3.scaleBand<number>()
      .domain(hours)
      .range([0, innerWidth])
      .padding(0.08);

    const yScale = d3.scaleBand<string>()
      .domain(rowKeys)
      .range([0, innerHeight])
      .padding(0.08);

    // Marginal Bar Scale (Top)
    const topBarHeight = 36;
    const topBarScale = d3.scaleLinear()
      .domain([0, summaryMetrics.maxHourlySum])
      .range([0, topBarHeight]);

    // 1. Render Top Marginal Hourly Incident Frequency Bars
    const topBarsGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, 12)`);

    summaryMetrics.hourlyTotals.forEach(item => {
      const x = xScale(item.hour) || 0;
      const barW = xScale.bandwidth();
      const barH = topBarScale(item.sum);
      const isPeak = item.hour === summaryMetrics.peakHour;
      const isSelected = selectedHourFilter === item.hour;

      const barG = topBarsGroup.append('g')
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedHourFilter(prev => prev === item.hour ? null : item.hour);
        });

      // Background tracking pill
      barG.append('rect')
        .attr('x', x)
        .attr('y', 0)
        .attr('width', barW)
        .attr('height', topBarHeight)
        .attr('rx', 3)
        .attr('fill', isSelected ? '#1e293b' : '#14141d')
        .attr('stroke', isSelected ? '#60a5fa' : '#272733')
        .attr('stroke-width', isSelected ? 1.5 : 0.8);

      // Value bar filling from bottom up
      barG.append('rect')
        .attr('x', x + 1)
        .attr('y', topBarHeight - barH)
        .attr('width', Math.max(1, barW - 2))
        .attr('height', barH)
        .attr('rx', 2)
        .attr('fill', isPeak ? '#ef4444' : isSelected ? '#38bdf8' : item.crit > 10 ? '#f97316' : '#3b82f6')
        .attr('opacity', 0.85);

      // Peak hour fire marker
      if (isPeak) {
        barG.append('circle')
          .attr('cx', x + barW / 2)
          .attr('cy', topBarHeight - barH - 4)
          .attr('r', 2)
          .attr('fill', '#ef4444');
      }
    });

    // 2. Render X-Axis (Hour Labels 00:00 - 23:00)
    hours.forEach(h => {
      const x = (xScale(h) || 0) + xScale.bandwidth() / 2;
      const isPeak = h === summaryMetrics.peakHour;
      const isSelected = selectedHourFilter === h;

      // Hour text
      g.append('text')
        .attr('x', x)
        .attr('y', -6)
        .attr('text-anchor', 'middle')
        .attr('fill', isPeak ? '#f87171' : isSelected ? '#38bdf8' : '#9ca3af')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isPeak || isSelected ? 'bold' : 'normal')
        .text(h % 2 === 0 || compact ? `${h.toString().padStart(2, '0')}:00` : `${h}`);
    });

    // 3. Render Y-Axis (Row Category Labels)
    activeDataset.rows.forEach(r => {
      const y = (yScale(r.key) || 0) + yScale.bandwidth() / 2;
      const textLabel = compact ? r.short : r.label;

      const rowLabel = svg.append('g')
        .attr('transform', `translate(${margin.left - 12}, ${margin.top + y})`);

      rowLabel.append('text')
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .attr('fill', '#cbd5e1')
        .attr('font-size', compact ? '10px' : '11px')
        .attr('font-weight', '600')
        .attr('letter-spacing', '0.02em')
        .text(textLabel);
    });

    // 4. Render Heatmap Cells
    const cellsGroup = g.append('g').attr('class', 'heatmap-cells');

    activeDataset.data.forEach(cell => {
      // Filter logic
      if (filterAnomaliesOnly && !cell.isAnomalous) return;
      if (minCountFilter > 0 && cell.count < minCountFilter) return;
      if (selectedHourFilter !== null && cell.hour !== selectedHourFilter) return;

      const x = xScale(cell.hour) || 0;
      const y = yScale(cell.rowKey) || 0;
      const cellW = xScale.bandwidth();
      const cellH = yScale.bandwidth();

      const metricVal = metric === 'riskScore' 
        ? cell.riskScore 
        : metric === 'anomaly' 
          ? cell.anomalyScore 
          : cell.count;

      const isZero = cell.count === 0;
      const fillColor = isZero ? '#101018' : colorScale(metricVal);
      const isSelected = selectedCell?.hour === cell.hour && selectedCell?.rowKey === cell.rowKey;

      const cellG = cellsGroup.append('g')
        .attr('class', 'heatmap-cell-group')
        .attr('cursor', 'pointer');

      // Cell rectangle
      const rect = cellG.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cellW)
        .attr('height', cellH)
        .attr('rx', 4)
        .attr('fill', fillColor)
        .attr('stroke', isSelected ? '#ffffff' : cell.isAnomalous ? '#ef4444' : '#222230')
        .attr('stroke-width', isSelected ? 2.5 : cell.isAnomalous ? 1.5 : 0.8)
        .attr('stroke-dasharray', cell.isAnomalous && !isSelected ? '2,2' : 'none')
        .attr('opacity', isZero ? 0.45 : 0.95);

      // Anomaly glow or ring
      if (cell.isAnomalous) {
        cellG.append('circle')
          .attr('cx', x + cellW - 5)
          .attr('cy', y + 5)
          .attr('r', 2.5)
          .attr('fill', '#ef4444')
          .append('animate')
          .attr('attributeName', 'opacity')
          .attr('values', '1;0.3;1')
          .attr('dur', '1.5s')
          .attr('repeatCount', 'indefinite');
      }

      // Value label inside cell if cell width is sufficient and count > 0
      if (cellW >= 20 && cell.count > 0) {
        const displayVal = metric === 'riskScore'
          ? `${cell.riskScore}`
          : metric === 'anomaly'
            ? cell.anomalyScore.toFixed(1)
            : `${cell.count}`;

        // Contrast text logic: bright text for dark cells, dark text for bright flare cells
        const isFlare = metric === 'count' ? cell.count > summaryMetrics.maxCellCount * 0.75 : cell.riskScore > 80;
        const textColor = isFlare ? '#0f172a' : '#f8fafc';

        cellG.append('text')
          .attr('x', x + cellW / 2)
          .attr('y', y + cellH / 2)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('fill', textColor)
          .attr('font-size', cellW < 28 ? '9px' : '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .attr('pointer-events', 'none')
          .text(displayVal);
      }

      // Event Listeners for Hover and Click
      cellG
        .on('mouseenter', (event) => {
          rect
            .transition()
            .duration(120)
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 2)
            .attr('opacity', 1);

          setHoveredCell(cell);
          const rectBounds = containerRef.current?.getBoundingClientRect();
          if (rectBounds) {
            setTooltipPos({
              x: event.clientX - rectBounds.left,
              y: event.clientY - rectBounds.top
            });
          }
        })
        .on('mousemove', (event) => {
          const rectBounds = containerRef.current?.getBoundingClientRect();
          if (rectBounds) {
            setTooltipPos({
              x: event.clientX - rectBounds.left,
              y: event.clientY - rectBounds.top
            });
          }
        })
        .on('mouseleave', () => {
          rect
            .transition()
            .duration(120)
            .attr('stroke', isSelected ? '#ffffff' : cell.isAnomalous ? '#ef4444' : '#222230')
            .attr('stroke-width', isSelected ? 2.5 : cell.isAnomalous ? 1.5 : 0.8)
            .attr('opacity', isZero ? 0.45 : 0.95);

          setHoveredCell(null);
        })
        .on('click', () => {
          setSelectedCell(prev => prev?.hour === cell.hour && prev?.rowKey === cell.rowKey ? null : cell);
        });
    });

    // 5. Render Right Marginal Total Badges
    const rightMarginGroup = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 12}, ${margin.top})`);

    summaryMetrics.rowTotals.forEach(rt => {
      const y = (yScale(rt.key) || 0) + yScale.bandwidth() / 2;

      const badge = rightMarginGroup.append('g')
        .attr('transform', `translate(0, ${y})`);

      badge.append('rect')
        .attr('x', 0)
        .attr('y', -10)
        .attr('width', 64)
        .attr('height', 20)
        .attr('rx', 6)
        .attr('fill', '#161622')
        .attr('stroke', '#27273a')
        .attr('stroke-width', 0.8);

      badge.append('text')
        .attr('x', 32)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(`${rt.sum} hits`);
    });

    // 6. Draw Highlight Guide Lines for Selected Hour if active
    if (selectedHourFilter !== null) {
      const hX = (xScale(selectedHourFilter) || 0) + xScale.bandwidth() / 2;
      g.append('line')
        .attr('x1', hX)
        .attr('y1', 0)
        .attr('x2', hX)
        .attr('y2', innerHeight)
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.6)
        .attr('pointer-events', 'none');
    }

  }, [
    activeDataset,
    metric,
    colorScale,
    summaryMetrics,
    compact,
    selectedCell,
    filterAnomaliesOnly,
    minCountFilter,
    selectedHourFilter
  ]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Hour', 'HourLabel', 'DimensionKey', 'DimensionLabel', 'IncidentCount', 'RiskScore', 'AnomalyScore', 'IsAnomalous', 'Critical', 'High', 'Medium', 'Low', 'TopRule'];
    const rows = activeDataset.data.map(c => [
      c.hour,
      `"${c.hourLabel}"`,
      `"${c.rowKey}"`,
      `"${c.rowLabel.replace(/"/g, '""')}"`,
      c.count,
      c.riskScore,
      c.anomalyScore,
      c.isAnomalous ? 1 : 0,
      c.severityBreakdown.critical,
      c.severityBreakdown.high,
      c.severityBreakdown.medium,
      c.severityBreakdown.low,
      `"${c.topRule.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `semor_24h_incident_intensity_heatmap_${dimension}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("space-y-4 text-left font-sans", className)}>
      {/* 24h Summary Scorecards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total 24h Correlated Frequency */}
        <div className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isZh ? '24 小時關聯事件總量' : '24h Total Correlated Incidents'}
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono flex items-baseline gap-1.5">
              <span>{summaryMetrics.totalIncidents.toLocaleString()}</span>
              <span className="text-[11px] text-blue-400 font-sans font-bold">incidents</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
              {isZh ? '平均 148 EPS 關聯提煉' : 'Avg 148 EPS Ingestion Fused'}
            </div>
          </div>
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Activity size={18} />
          </div>
        </div>

        {/* Metric 2: Peak Incident Window */}
        <div className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Flame size={12} className="text-rose-400" />
              <span>{isZh ? '攻擊最高峰時段' : 'Peak Attack Window'}</span>
            </div>
            <div className="text-xl font-black text-rose-400 mt-1 font-mono">
              {summaryMetrics.peakHour.toString().padStart(2, '0')}:00 - {(summaryMetrics.peakHour + 1).toString().padStart(2, '0')}:00
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
              <span className="text-white font-bold">{summaryMetrics.maxHourlyCount}</span> incidents (<span className="text-rose-400">+280% burst</span>)
            </div>
          </div>
          <div className="p-2.5 bg-rose-600/20 border border-rose-500/30 rounded-xl text-rose-400">
            <Flame size={18} />
          </div>
        </div>

        {/* Metric 3: Off-Hours Anomaly Ratio */}
        <div className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isZh ? '非上班暗夜時段佔比' : 'Off-Hours Anomaly Ratio'}
            </div>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">
              {summaryMetrics.offHoursRatio}%
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {isZh ? '02:00-04:00 突發資料庫導出' : '02:00-04:00 DB Dump Spike'}
            </div>
          </div>
          <div className="p-2.5 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Clock size={18} />
          </div>
        </div>

        {/* Metric 4: Correlated Active Tactics */}
        <div className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isZh ? '偵測到之攻擊戰術跨度' : 'Active Kill-Chain Scope'}
            </div>
            <div className="text-xl font-black text-purple-400 mt-1 font-mono">
              9 / 14 <span className="text-xs text-gray-400 font-sans">{isZh ? '戰術覆蓋' : 'Tactics'}</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">
              MITRE ATT&CK Enterprise
            </div>
          </div>
          <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Target size={18} />
          </div>
        </div>
      </div>

      {/* Control Bar: Dimension Switcher, Metric Toggle, Filters & Export */}
      <div className="p-4 bg-[#111118] border border-gray-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left: Dimension Switcher Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers size={13} className="text-blue-400" />
            {isZh ? '聚合維度：' : 'Dimension:'}
          </span>

          {[
            { id: 'tactics', label: isZh ? 'MITRE ATT&CK 戰術' : 'MITRE Tactics' },
            { id: 'severity', label: isZh ? '嚴重等級 (Severity)' : 'Severity Levels' },
            { id: 'sources', label: isZh ? '關聯日誌引擎 (Engines)' : 'Detection Sources' },
            { id: 'assets', label: isZh ? '核心資產層級 (Assets)' : 'Asset Tiers' },
          ].map(dim => (
            <button
              key={dim.id}
              onClick={() => {
                setDimension(dim.id as HeatmapDimension);
                setSelectedCell(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                dimension === dim.id
                  ? "bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-900/40"
                  : "bg-gray-900/90 text-gray-400 border-gray-800 hover:text-gray-200 hover:border-gray-700"
              )}
            >
              {dim.label}
            </button>
          ))}
        </div>

        {/* Right: Metric Toggle & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Metric Selector */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMetric('count')}
              className={cn(
                "px-2.5 py-1 rounded font-bold transition-all",
                metric === 'count' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
              title={isZh ? "以事件頻率數量為著色指標" : "Color by incident count"}
            >
              {isZh ? '事件數' : 'Hits'}
            </button>
            <button
              onClick={() => setMetric('riskScore')}
              className={cn(
                "px-2.5 py-1 rounded font-bold transition-all",
                metric === 'riskScore' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
              title={isZh ? "以加權風險評分為著色指標 (0-100)" : "Color by risk score"}
            >
              {isZh ? '風險分' : 'Risk'}
            </button>
            <button
              onClick={() => setMetric('anomaly')}
              className={cn(
                "px-2.5 py-1 rounded font-bold transition-all",
                metric === 'anomaly' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
              title={isZh ? "以 Z-score 異常突發係數為指標" : "Color by anomaly Z-score"}
            >
              {isZh ? '異常度' : 'Anomaly'}
            </button>
          </div>

          {/* Anomaly Only Filter Toggle */}
          <button
            onClick={() => setFilterAnomaliesOnly(prev => !prev)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
              filterAnomaliesOnly
                ? "bg-rose-950/70 border-rose-600 text-rose-300"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200"
            )}
            title={isZh ? "僅過濾突發異常攻擊時段" : "Filter only anomalous cells"}
          >
            <AlertTriangle size={12} className={filterAnomaliesOnly ? "text-rose-400" : "text-gray-500"} />
            <span>{isZh ? '僅高危異常' : 'Anomalies'}</span>
          </button>

          {/* Clear Hour Filter if active */}
          {selectedHourFilter !== null && (
            <button
              onClick={() => setSelectedHourFilter(null)}
              className="px-2.5 py-1.5 bg-blue-950/60 border border-blue-600/80 rounded-lg text-xs font-bold text-blue-300 flex items-center gap-1 hover:bg-blue-900"
            >
              <span>{selectedHourFilter.toString().padStart(2, '0')}:00</span>
              <X size={12} />
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
            title={isZh ? "將 24 小時熱力圖矩陣數據匯出為 CSV" : "Export 24h Heatmap Data as CSV"}
          >
            <FileSpreadsheet size={13} className="text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Main Heatmap Visualization Container */}
      <div className="bg-[#0f0f16] border border-gray-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Heatmap Header & Interactive Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                <Flame className="text-rose-500" size={16} />
                {isZh ? '24 小時時序關聯強度熱力矩陣 (D3 Intensity Heatmap)' : '24-Hour Intensity Correlation Heatmap (D3)'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                00:00 - 23:59 UTC
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isZh
                ? '點擊任一單元格或頂部時段長條柱，可立即釘選並向下穿透調閱該時段之關聯告警明細與端點取證資訊。'
                : 'Click any matrix cell or top marginal hour column to pin and inspect forensic incident records for that time slice.'}
            </p>
          </div>

          {/* D3 Continuous Color Intensity Legend */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{isZh ? '強度' : 'Intensity'}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-500">0</span>
              <div
                className="w-36 h-3 rounded-full border border-gray-700 shadow-inner"
                style={{
                  background: metric === 'riskScore'
                    ? 'linear-gradient(to right, #111118, #1e293b, #0284c7, #eab308, #ef4444, #fda4af)'
                    : metric === 'anomaly'
                      ? 'linear-gradient(to right, #111118, #1e1b4b, #6366f1, #c084fc, #f43f5e)'
                      : 'linear-gradient(to right, #101018, #172554, #1d4ed8, #7e22ce, #f97316, #ef4444, #fecdd3)'
                }}
              />
              <span className="text-[10px] font-mono text-rose-400 font-bold">
                {metric === 'riskScore' ? '100' : metric === 'anomaly' ? '5.0σ' : `${summaryMetrics.maxCellCount}+`}
              </span>
            </div>
          </div>
        </div>

        {/* SVG Container with Horizontal Scroll fallback */}
        <div ref={containerRef} className="w-full overflow-x-auto custom-scrollbar py-2 relative">
          <svg ref={svgRef} className="block select-none" />

          {/* Interactive Floating Tooltip */}
          {hoveredCell && tooltipPos && (
            <div
              className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
              style={{
                left: Math.max(160, Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 800) - 160)),
                top: Math.max(70, tooltipPos.y)
              }}
            >
              <div className="bg-[#14141e]/95 border border-gray-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-md w-72 text-left space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-400" />
                    <span className="text-xs font-mono font-bold text-white">{hoveredCell.hourLabel} - {(hoveredCell.hour + 1).toString().padStart(2, '0')}:00</span>
                  </div>
                  {hoveredCell.isAnomalous && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold">
                      {isZh ? '異常突發' : 'ANOMALY'}
                    </span>
                  )}
                </div>

                {/* Category & Hits */}
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{hoveredCell.rowLabel}</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-white font-mono">{hoveredCell.count} <span className="text-xs font-normal text-gray-400">incidents</span></span>
                    <span className="text-xs font-mono font-bold text-rose-400">Risk: {hoveredCell.riskScore}/100</span>
                  </div>
                </div>

                {/* Severity Breakdown Bar */}
                {hoveredCell.count > 0 && (
                  <div className="space-y-1">
                    <div className="text-[9px] text-gray-400 uppercase font-bold flex justify-between font-mono">
                      <span>{isZh ? '威脅嚴重性佔比' : 'Severity Breakdown'}</span>
                      <span className="text-rose-400">{hoveredCell.severityBreakdown.critical} Critical</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full flex overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${(hoveredCell.severityBreakdown.critical / hoveredCell.count) * 100}%` }} />
                      <div className="bg-orange-500 h-full" style={{ width: `${(hoveredCell.severityBreakdown.high / hoveredCell.count) * 100}%` }} />
                      <div className="bg-amber-500 h-full" style={{ width: `${(hoveredCell.severityBreakdown.medium / hoveredCell.count) * 100}%` }} />
                      <div className="bg-blue-500 h-full" style={{ width: `${(hoveredCell.severityBreakdown.low / hoveredCell.count) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* Top Rule Hint */}
                {hoveredCell.topRule && (
                  <div className="text-[10px] text-gray-400 border-t border-gray-800/80 pt-1.5 truncate">
                    <span className="text-gray-500 font-mono">Top:</span> <span className="text-slate-200">{hoveredCell.topRule}</span>
                  </div>
                )}

                <div className="text-[9px] text-blue-400/80 font-mono text-center pt-0.5">
                  {isZh ? '💡 點擊可鎖定並調閱原始關聯事件' : '💡 Click cell to inspect forensic records'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Heatmap Legend & Guide Footnotes */}
        <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#101018] border border-gray-700" />
              <span>{isZh ? '0 無異常事件' : '0 Normal'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#1d4ed8]" />
              <span>{isZh ? '低度命中' : 'Low Baseline'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#7e22ce]" />
              <span>{isZh ? '中度密集' : 'Medium Activity'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#ef4444]" />
              <span>{isZh ? '高度爆發' : 'High / Critical Burst'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{isZh ? '紅色虛線：統計學突發異常 (Z > 3.5)' : 'Dashed Border: Statistical Anomaly'}</span>
            </span>
          </div>

          <div className="text-[10px] font-mono text-gray-500">
            D3 ScaleBand / Interpolate Sequential // ISO 27001 Audited
          </div>
        </div>
      </div>

      {/* Selected Cell Drill-down Forensic Drawer */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="p-5 bg-[#12121b] border border-blue-500/40 rounded-2xl shadow-2xl space-y-4"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white">
                      {selectedCell.hourLabel} - {(selectedCell.hour + 1).toString().padStart(2, '0')}:00 // {selectedCell.rowLabel}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                      {selectedCell.count} Correlated Hits
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isZh ? '該 1 小時滑動窗口內之關聯攻擊記錄、首發受害者 (Patient Zero) 與處置狀態' : 'Correlated incident timeline, patient zero vectors, and forensic triage status for this 1-hour window.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => {
                    if (selectedCell.incidents.length > 0 && onSelectIncident) {
                      onSelectIncident(selectedCell.incidents[0]);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Zap size={13} />
                  <span>{isZh ? '帶入攻擊鏈調查' : 'Investigate Timeline'}</span>
                </button>

                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Incidents Table */}
            {selectedCell.incidents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900/90 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="p-3">{isZh ? '事件代號 / 時間' : 'Incident ID / Time'}</th>
                      <th className="p-3">{isZh ? '嚴重等級' : 'Severity'}</th>
                      <th className="p-3">{isZh ? '觸發關聯規則' : 'Triggered Rule'}</th>
                      <th className="p-3">{isZh ? '首發目標 / 核心實體' : 'Patient Zero / Target'}</th>
                      <th className="p-3">{isZh ? '置信度' : 'Confidence'}</th>
                      <th className="p-3">{isZh ? '處置狀態' : 'Status'}</th>
                      <th className="p-3 text-right">{isZh ? '動作' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 font-mono">
                    {selectedCell.incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white">{inc.id}</div>
                          <div className="text-[10px] text-gray-400">{inc.time} UTC</div>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                            inc.severity === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            inc.severity === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                            "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          )}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          <div className="font-semibold text-gray-200">{inc.ruleName}</div>
                          <div className="text-[10px] text-gray-500">{inc.summary}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-200 text-xs">{inc.patientZero}</div>
                          <div className="text-[10px] text-rose-400 font-mono">→ {inc.targetEntity}</div>
                        </td>
                        <td className="p-3 font-bold text-emerald-400">
                          {inc.confidence}%
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold",
                            inc.status === 'Active' ? "bg-red-950 text-red-300 border border-red-800" :
                            inc.status === 'Investigating' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                            "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          )}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onSelectIncident ? onSelectIncident(inc) : null}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <span>{isZh ? '審查' : 'Review'}</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 bg-gray-900/30 rounded-xl">
                {isZh ? '此時段無高危異常事件 (Baseline Normal)' : 'No anomalous incidents in this time slice.'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

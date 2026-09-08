import React from 'react';

export type PanelTemplateId =
  | 'Time Series'
  | 'Stat'
  | 'Gauge'
  | 'Table'
  | 'Geomap'
  | 'Bar Chart'
  | 'Pie Chart'
  | 'Heatmap'
  | 'Logs'
  | 'Alert List'
  | 'Node Graph'
  | 'Flame Graph'
  | 'Traces'
  | 'Status History'
  | 'Candlestick'
  | 'Radar'
  | 'Text'
  | 'News'
  | 'Dashboard List'
  | 'Plugin'
  | 'Canvas';

export type TemplateCategory =
  | 'trends'
  | 'metrics'
  | 'distribution'
  | 'logs_alerts'
  | 'topology_traces'
  | 'specialized';

export interface PanelTemplateMeta {
  id: PanelTemplateId;
  name: string;
  category: TemplateCategory;
  categoryLabel: string;
  iconName: string;
  description: string;
  badge?: string;
  recommendedDataSource: string;
}

export type ColorPaletteId = 'cyber-blue' | 'emerald-defense' | 'amber-warning' | 'crimson-alert' | 'high-contrast-neon';

export interface DisplayConfig {
  graphType: 'line' | 'area' | 'bar' | 'scatter';
  lineInterpolation: 'smooth' | 'linear' | 'step';
  strokeWidth: number;
  fillOpacity: number;
  showPoints: boolean;
  pointRadius: number;
  stacked: boolean;
  colorPalette: ColorPaletteId;
  showGrid: boolean;
  gradientFill: boolean;
  transparentBackground: boolean;
  cardBorderGlow: boolean;
}

export interface ThresholdLevel {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface ThresholdsConfig {
  enabled: boolean;
  mode: 'absolute' | 'percentage';
  displayStyle: 'line' | 'dashed' | 'fill' | 'none';
  levels: ThresholdLevel[];
}

export interface AxisConfig {
  yFormat: 'bytes_sec' | 'bits_sec' | 'percent' | 'req_sec' | 'ms' | 'count';
  yMin?: number;
  yMax?: number;
  decimals: number;
  showLegend: boolean;
  legendPosition: 'bottom' | 'right' | 'table';
  legendStats: ('min' | 'max' | 'avg' | 'current')[];
  tooltipMode: 'single' | 'all';
}

export interface QueryFilter {
  id: string;
  field: string;
  operator: '=' | '!=' | '=~' | '!~' | '>' | '<';
  value: string;
}

export interface QueryConfig {
  mode: 'visual' | 'code';
  queryLanguage: 'PromQL' | 'LogQL' | 'SQL' | 'Lucene';
  metric: string;
  aggregation: 'SUM' | 'AVG' | 'MAX' | 'MIN' | 'RATE' | 'COUNT' | 'P95' | 'P99';
  groupBy: string;
  timeBucket: '10s' | '30s' | '1m' | '5m' | '15m' | '1h';
  filters: QueryFilter[];
  rawCode: string;
}

export interface TransformationRule {
  id: string;
  type: 'filter_value' | 'rename_regex' | 'calculate_field' | 'series_to_columns' | 'sort_by';
  description: string;
  active: boolean;
  params: Record<string, string | number | boolean>;
}

export interface AlertIntegrationConfig {
  enabled: boolean;
  condition: 'IS_ABOVE' | 'IS_BELOW' | 'IS_OUTSIDE_RANGE';
  thresholdValue: number;
  duration: '1m' | '3m' | '5m' | '15m';
  severity: 'info' | 'warning' | 'critical';
  channels: ('slack' | 'teams' | 'email' | 'webhook' | 'pagerduty')[];
  triggerSOARPlaybook?: string;
}

export interface PanelConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  template: PanelTemplateId;
  dataSource: string;
  timeRange: string;
  refreshInterval: string;
  display: DisplayConfig;
  thresholds: ThresholdsConfig;
  axis: AxisConfig;
  query: QueryConfig;
  transformations: TransformationRule[];
  alert: AlertIntegrationConfig;
  updatedAt: string;
}

export interface DataSourceItem {
  id: string;
  name: string;
  type: 'victorialogs' | 'arkime' | 'elasticsearch' | 'prometheus' | 'cloudwatch' | 'datadog' | 'edr_stream' | 'clickhouse';
  icon: string;
  endpoint: string;
  status: 'connected' | 'degraded' | 'disconnected';
  latencyMs: number;
  indexPattern?: string;
  description: string;
  authType: 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'IAM_ROLE';
  tlsVerify: boolean;
  cacheTtlSec: number;
  activeQueriesCount: number;
}

export interface PresetVisualization {
  id: string;
  name: string;
  category: string;
  description: string;
  template: PanelTemplateId;
  dataSource: string;
  tags: string[];
  config: Partial<PanelConfig>;
  previewMetric: string;
}

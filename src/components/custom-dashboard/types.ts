export type WidgetType = 
  | 'stat'
  | 'timeseries_area'
  | 'timeseries_bar'
  | 'timeseries_line'
  | 'donut'
  | 'table'
  | 'gauge'
  | 'network_flow'
  | 'threat_map';

export type WidgetWidth = 
  | 'col-span-12'
  | 'col-span-8'
  | 'col-span-6'
  | 'col-span-4'
  | 'col-span-3';

export type WidgetHeight = 
  | 'h-52'
  | 'h-64'
  | 'h-80'
  | 'h-96';

export interface WidgetThresholds {
  warning?: number;
  critical?: number;
  condition?: 'gt' | 'lt';
}

export interface DashboardWidget {
  id: string;
  title: string;
  description?: string;
  type: WidgetType;
  width: WidgetWidth;
  height?: WidgetHeight;
  dataSource: string;
  metricKey?: string;
  query?: string;
  refreshInterval?: number; // in seconds
  color?: string; // Tailwind color or hex
  thresholds?: WidgetThresholds;
  // Specific data configurations
  customConfig?: {
    unit?: string;
    showLegend?: boolean;
    showSparkline?: boolean;
    stacked?: boolean;
    statValue?: string;
    statChange?: string;
    statTrend?: 'up' | 'down' | 'neutral';
    alertThresholdExceeded?: boolean;
    tableColumns?: { key: string; label: string; width?: string; isMono?: boolean }[];
    tableData?: any[];
    chartData?: any[];
    gaugeValue?: number;
    gaugeMax?: number;
    gaugeLabel?: string;
    seriesKeys?: { key: string; name: string; color: string }[];
  };
}

export type DashboardCategory = 
  | 'SOC Triage'
  | 'Incident Response'
  | 'Cloud & K8s'
  | 'Zero Trust'
  | 'Network & Flow'
  | 'Custom';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: DashboardCategory;
  isDefault?: boolean;
  isCustom?: boolean;
  author: string;
  lastModified: string;
  tags: string[];
  widgets: DashboardWidget[];
}

export interface GlobalFilterState {
  dataSource: string;
  timeRange: string;
  cluster: string;
  environment: string;
  refreshRate: number; // 0 = off, 5 = 5s, 10 = 10s, 30 = 30s, 60 = 60s
  searchQuery: string;
  activeTags: string[];
}

export interface Span {
  spanId: number;
  parentSpanId: number;
  serviceName: string;
  endpoint: string;
  startTime: number; // relative to trace start in ms
  duration: number; // in ms
  type: 'Entry' | 'Local' | 'Exit';
  status: 'Success' | 'Error';
  errorLog?: string;
  component?: string;
  peer?: string;
  sql?: string;
  httpHeaders?: Record<string, string>;
}

export interface Trace {
  traceId: string;
  endpoint: string;
  statusCode: number;
  totalDuration: number;
  serviceCount: number;
  startTime: string;
  spans: Span[];
}

export interface ServiceNode {
  id: string;
  name: string;
  type: 'gateway' | 'service' | 'database' | 'cache' | 'external';
  sla: number;
  cpm: number;
  latency: number;
  cpu: number;
  memory: number;
  alarms: string[];
  x: number;
  y: number;
}

export interface ServiceRelation {
  source: string;
  target: string;
  cpm: number;
  latency: number;
}

export interface FlameStackItem {
  layer: number;
  method: string;
  cpuPercent: number;
  isHotspot?: boolean;
}

export interface ProfilingTask {
  id: string;
  taskName: string;
  durationSeconds: number;
  status: 'Completed' | 'Analyzing' | 'Running';
  time: string;
  targetInstance: string;
  flameGraphData: FlameStackItem[];
}

export interface CorrelationTimeBlock {
  id: string;
  timeRange: string;
  label: string;
  metricsTrend: { time: string; cpu: number; errors: number; tps: number }[];
  associatedTraces: {
    traceId: string;
    endpoint: string;
    latency: number;
    statusCode: number;
    logExcerpt: string;
  }[];
}

export interface MaskingRule {
  id: string;
  name: string;
  regex: string;
  replacement: string;
  isActive: boolean;
}

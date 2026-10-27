import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';

const Router = express.Router;

const APM_SETTINGS_PATH = path.join(process.cwd(), 'apm_settings.json');
const APM_SETTINGS_TMP = path.join(process.cwd(), 'apm_settings.json.tmp');

// ==========================================
// 1. Data Type & Model Definitions
// ==========================================

export interface ApmServiceNode {
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
  healthScore?: number;
  status?: 'healthy' | 'degraded' | 'critical';
  instanceCount?: number;
}

export interface ApmServiceRelation {
  source: string;
  target: string;
  cpm: number;
  latency: number;
  errorRate?: number;
  status?: 'normal' | 'slow' | 'failing';
}

export interface ApmSpanLog {
  timestamp: string;
  event: string;
  message: string;
}

export interface ApmSpan {
  spanId: number;
  parentSpanId: number;
  serviceName: string;
  endpoint: string;
  startTime: number;
  duration: number;
  type: 'Entry' | 'Local' | 'Exit';
  status: 'Success' | 'Error';
  errorLog?: string;
  component?: string;
  peer?: string;
  sql?: string;
  httpHeaders?: Record<string, string>;
  tags?: Record<string, string | number | boolean>;
  logs?: ApmSpanLog[];
}

export interface ApmTrace {
  traceId: string;
  endpoint: string;
  statusCode: number;
  totalDuration: number;
  serviceCount: number;
  startTime: string;
  spans: ApmSpan[];
  httpMethod?: string;
  clientIp?: string;
  rootServiceName?: string;
  hasError?: boolean;
}

export interface FlameStackItem {
  layer: number;
  method: string;
  cpuPercent: number;
  isHotspot?: boolean;
}

export interface ApmProfilingTask {
  id: string;
  taskName: string;
  durationSeconds: number;
  status: 'Completed' | 'Analyzing' | 'Running';
  time: string;
  targetInstance: string;
  flameGraphData: FlameStackItem[];
  sampleCount?: number;
  threadState?: string;
}

export interface ApmMaskingRule {
  id: string;
  name: string;
  regex: string;
  replacement: string;
  isActive: boolean;
  category?: 'PII' | 'Credentials' | 'Financial' | 'Custom';
  hitsCount?: number;
}

export interface ApmGovernanceConfig {
  samplingRate: number;
  isEmergencyActive: boolean;
  complianceStandard: string;
  oapEncryption: boolean;
  maxTraceBufferMB: number;
  adaptiveSheddingThreshold: number;
  slowSqlThresholdMs?: number;
  slowEndpointThresholdMs?: number;
  alertNotificationWebhook?: string;
  autoProfilingEnabled?: boolean;
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

export interface ApmAlarm {
  id: string;
  service: string;
  time: string;
  reason: string;
  level: 'Critical' | 'High' | 'Warning' | 'Info';
  status: 'Active' | 'Acknowledged' | 'Resolved';
  metric: string;
  value: number;
  threshold: number;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface ApmSettingsData {
  config: ApmGovernanceConfig;
  maskingRules: ApmMaskingRule[];
  profilingTasks: ApmProfilingTask[];
  alarms?: ApmAlarm[];
}

// ==========================================
// 2. Default Configuration & Preset Templates
// ==========================================

const defaultMaskingRules: ApmMaskingRule[] = [
  {
    id: "mask-pwd",
    name: "機敏登入密碼遮蔽 (Password Regex Masking)",
    regex: "(?i)\"password\"\\s*:\\s*\"[^\"]+\"",
    replacement: "\"password\": \"******\"",
    isActive: true,
    category: "Credentials",
    hitsCount: 1420
  },
  {
    id: "mask-card",
    name: "信用卡卡號遮蔽 (Credit Card Masking)",
    regex: "\\b(?:\\d[ -]*?){13,16}\\b",
    replacement: "[CC CARD HOLDER MASKED]",
    isActive: true,
    category: "Financial",
    hitsCount: 890
  },
  {
    id: "mask-jwt",
    name: "API 授權金鑰遮蔽 (Bearer Auth Header Token)",
    regex: "Bearer\\s+ey[a-zA-Z0-9-_=]+\\.[a-zA-Z0-9-_=]+\\.?[a-zA-Z0-9-_.+/=]*",
    replacement: "Bearer [JWT TOKEN MASKED]",
    isActive: true,
    category: "Credentials",
    hitsCount: 3260
  },
  {
    id: "mask-tw-id",
    name: "身分證字號遮蔽 (National ID Masking)",
    regex: "\\b[A-Z][12]\\d{8}\\b",
    replacement: "[ID_NUMBER_MASKED]",
    isActive: true,
    category: "PII",
    hitsCount: 310
  },
  {
    id: "mask-email",
    name: "個人電子郵件脫敏 (Email Address Masking)",
    regex: "([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)",
    replacement: "$1***@domain.masked",
    isActive: false,
    category: "PII",
    hitsCount: 75
  }
];

const defaultProfilingTasks: ApmProfilingTask[] = [
  {
    id: "PROF-101",
    taskName: "CPU-Profiling-Task-01",
    durationSeconds: 10,
    status: "Completed",
    time: "2026-06-12 10:15:00",
    targetInstance: "order-service-pod-0x1a8",
    sampleCount: 1540,
    threadState: "RUNNABLE",
    flameGraphData: [
      { layer: 1, method: "java.lang.Thread.run()", cpuPercent: 100 },
      { layer: 2, method: "org.springframework.web.servlet.DispatcherServlet.doService()", cpuPercent: 85 },
      { layer: 3, method: "com.app.order.OrderService.calculateTotal()", cpuPercent: 72, isHotspot: true },
      { layer: 4, method: "com.app.order.OrderService.dbQueryTimeoutFetch()", cpuPercent: 48, isHotspot: true },
      { layer: 5, method: "java.net.SocketInputStream.socketRead0()", cpuPercent: 35 }
    ]
  },
  {
    id: "PROF-102",
    taskName: "Heap-Allocation-Tracer",
    durationSeconds: 30,
    status: "Completed",
    time: "2026-06-12 09:42:12",
    targetInstance: "payment-service-pod-0x2d1",
    sampleCount: 3200,
    threadState: "TIMED_WAITING",
    flameGraphData: [
      { layer: 1, method: "java.lang.Thread.run()", cpuPercent: 100 },
      { layer: 2, method: "com.app.payment.PaymentController.charge()", cpuPercent: 92 },
      { layer: 3, method: "com.stripe.net.APIResource.request()", cpuPercent: 84, isHotspot: true },
      { layer: 4, method: "com.stripe.net.HttpClient.post()", cpuPercent: 78 },
      { layer: 5, method: "java.net.KeepAliveCache.put()", cpuPercent: 55 }
    ]
  },
  {
    id: "PROF-103",
    taskName: "Active-Thread-Contention-Digger",
    durationSeconds: 15,
    status: "Completed",
    time: "2026-06-12 10:20:15",
    targetInstance: "auth-service-pod-0x2d1",
    sampleCount: 1980,
    threadState: "BLOCKED",
    flameGraphData: [
      { layer: 1, method: "java.lang.Thread.run()", cpuPercent: 100 },
      { layer: 2, method: "com.app.auth.AuthController.login()", cpuPercent: 90 },
      { layer: 3, method: "com.app.auth.TokenGenerator.hmac()", cpuPercent: 65, isHotspot: true },
      { layer: 4, method: "redis.clients.jedis.JedisPool.getResource()", cpuPercent: 45, isHotspot: true }
    ]
  }
];

const defaultAlarms: ApmAlarm[] = [
  {
    id: "ALM-102",
    service: "payment-service",
    time: "10:14:55",
    reason: "SLA drops below threshold of 95% (Current: 94.20%)",
    level: "Critical",
    status: "Active",
    metric: "sla_percent",
    value: 94.2,
    threshold: 95.0
  },
  {
    id: "ALM-103",
    service: "order-center-service",
    time: "10:15:02",
    reason: "Error rate spike detected: 1.50% in past 5m",
    level: "High",
    status: "Active",
    metric: "error_rate",
    value: 1.5,
    threshold: 1.0
  },
  {
    id: "ALM-104",
    service: "gateway-service",
    time: "09:42:15",
    reason: "SLA alert - minor latency warning on public auth path",
    level: "Warning",
    status: "Resolved",
    metric: "avg_latency_ms",
    value: 48,
    threshold: 40,
    resolvedAt: "09:55:00"
  }
];

const defaultGovernanceConfig: ApmGovernanceConfig = {
  samplingRate: 75,
  isEmergencyActive: false,
  complianceStandard: "GDPR/PCI-DSS",
  oapEncryption: true,
  maxTraceBufferMB: 2048,
  adaptiveSheddingThreshold: 90,
  slowSqlThresholdMs: 300,
  slowEndpointThresholdMs: 500,
  alertNotificationWebhook: "https://semor-cyber.internal/api/v1/soc/alerts",
  autoProfilingEnabled: true
};

const defaultCorrelationBlocks: CorrelationTimeBlock[] = [
  {
    id: "block-1010",
    timeRange: "10:10 - 10:15",
    label: "10:10 CPU Spike (微服務 CPU 核心突增段)",
    metricsTrend: [
      { time: '10:09', cpu: 18, errors: 0, tps: 1100 },
      { time: '10:10', cpu: 78, errors: 12, tps: 1250 },
      { time: '10:11', cpu: 94, errors: 45, tps: 1280 },
      { time: '10:12', cpu: 92, errors: 42, tps: 1260 },
      { time: '10:13', cpu: 85, errors: 28, tps: 1240 },
      { time: '10:14', cpu: 60, errors: 15, tps: 1210 },
      { time: '10:15', cpu: 45, errors: 4, tps: 1150 }
    ],
    associatedTraces: [
      { traceId: "99.123.14656453", endpoint: "/api/v1/order/create", latency: 120, statusCode: 500, logExcerpt: "NullPointerException at OrderService.java:45" },
      { traceId: "88.423.90124810", endpoint: "/api/v1/checkout/pay", latency: 1850, statusCode: 200, logExcerpt: "Timeout waiting for Stripe Gateway callback" },
      { traceId: "331.42.11545624", endpoint: "/api/v1/order/create", latency: 118, statusCode: 500, logExcerpt: "Could not retrieve JDBC Connection, Pool Exhausted" }
    ]
  },
  {
    id: "block-1020",
    timeRange: "10:18 - 10:23",
    label: "10:20 Thread Contention Block (線程等候與飢餓臨界點)",
    metricsTrend: [
      { time: '10:18', cpu: 22, errors: 2, tps: 1200 },
      { time: '10:19', cpu: 41, errors: 5, tps: 1210 },
      { time: '10:20', cpu: 65, errors: 8, tps: 1240 },
      { time: '10:21', cpu: 88, errors: 10, tps: 1260 },
      { time: '10:22', cpu: 45, errors: 4, tps: 1220 },
      { time: '10:23', cpu: 30, errors: 1, tps: 1190 }
    ],
    associatedTraces: [
      { traceId: "102.55.99281312", endpoint: "/api/v1/auth/login", latency: 45, statusCode: 200, logExcerpt: "Redis connection pool queue saturated - re-queued" },
      { traceId: "442.21.32598711", endpoint: "/api/v1/auth/validate", latency: 180, statusCode: 401, logExcerpt: "MFA signature timeout exception" }
    ]
  },
  {
    id: "block-safe",
    timeRange: "10:25 - 10:30",
    label: "10:25 Normal Baseline (安全維運基準期)",
    metricsTrend: [
      { time: '10:25', cpu: 14, errors: 0, tps: 1100 },
      { time: '10:26', cpu: 15, errors: 0, tps: 1120 },
      { time: '10:27', cpu: 13, errors: 0, tps: 1105 },
      { time: '10:28', cpu: 16, errors: 0, tps: 1130 },
      { time: '10:29', cpu: 15, errors: 0, tps: 1140 },
      { time: '10:30', cpu: 14, errors: 0, tps: 1150 }
    ],
    associatedTraces: [
      { traceId: "852.12.33921021", endpoint: "/api/v1/inventory/availability", latency: 85, statusCode: 200, logExcerpt: "Cache HIT for stock id 91bc9" },
      { traceId: "551.99.11234908", endpoint: "/api/v1/auth/login", latency: 12, statusCode: 200, logExcerpt: "MFA success login verified" }
    ]
  }
];

// ==========================================
// 3. Thread-Safe Atomic Persistence Helper
// ==========================================

function loadApmSettings(): ApmSettingsData {
  try {
    if (fs.existsSync(APM_SETTINGS_PATH)) {
      const data = JSON.parse(fs.readFileSync(APM_SETTINGS_PATH, 'utf-8'));
      return {
        config: { ...defaultGovernanceConfig, ...(data.config || {}) },
        maskingRules: data.maskingRules || defaultMaskingRules,
        profilingTasks: data.profilingTasks || defaultProfilingTasks,
        alarms: data.alarms || defaultAlarms
      };
    }
  } catch (err) {
    console.error('[APM] Failed to load apm_settings.json:', err);
  }

  const initialData: ApmSettingsData = {
    config: defaultGovernanceConfig,
    maskingRules: defaultMaskingRules,
    profilingTasks: defaultProfilingTasks,
    alarms: defaultAlarms
  };
  saveApmSettings(initialData);
  return initialData;
}

function saveApmSettings(data: ApmSettingsData): boolean {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(APM_SETTINGS_TMP, jsonStr, 'utf-8');
    fs.renameSync(APM_SETTINGS_TMP, APM_SETTINGS_PATH);
    return true;
  } catch (err) {
    console.error('[APM] Failed to atomic save apm_settings.json:', err);
    try {
      fs.writeFileSync(APM_SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('[APM] Fallback save failed:', e);
      return false;
    }
  }
}

// ==========================================
// 4. In-Memory Topology & Dynamic State
// ==========================================

const topologyByEnv: Record<string, { nodes: ApmServiceNode[]; relations: ApmServiceRelation[] }> = {
  prod: {
    nodes: [
      { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 99.98, cpm: 3450, latency: 15, cpu: 22, memory: 45, alarms: [], x: 100, y: 220, healthScore: 99, status: 'healthy', instanceCount: 4 },
      { id: 'order', name: 'order-center-service', type: 'service', sla: 98.50, cpm: 1250, latency: 45, cpu: 54, memory: 72, alarms: ['OrderService.java:45 slow DB connection pool'], x: 350, y: 120, healthScore: 84, status: 'degraded', instanceCount: 3 },
      { id: 'auth', name: 'auth-service', type: 'service', sla: 99.95, cpm: 890, latency: 35, cpu: 18, memory: 38, alarms: [], x: 350, y: 320, healthScore: 98, status: 'healthy', instanceCount: 2 },
      { id: 'payment', name: 'payment-service', type: 'service', sla: 94.20, cpm: 450, latency: 310, cpu: 75, memory: 65, alarms: ['HTTP 502 connection timed out to Stripe Gateway', 'High thread contention detected'], x: 580, y: 120, healthScore: 68, status: 'critical', instanceCount: 2 },
      { id: 'postgres', name: 'PostgreSQL-Prod', type: 'database', sla: 100.0, cpm: 1890, latency: 4, cpu: 40, memory: 88, alarms: [], x: 580, y: 320, healthScore: 95, status: 'healthy', instanceCount: 2 },
      { id: 'redis', name: 'Redis-Cluster', type: 'cache', sla: 99.99, cpm: 4120, latency: 0.8, cpu: 12, memory: 30, alarms: [], x: 350, y: 440, healthScore: 100, status: 'healthy', instanceCount: 3 },
      { id: 'stripe', name: 'Stripe-API Gateway', type: 'external', sla: 96.50, cpm: 420, latency: 680, cpu: 0, memory: 0, alarms: ['SLA drop in external upstream endpoint'], x: 780, y: 120, healthScore: 78, status: 'degraded', instanceCount: 1 }
    ],
    relations: [
      { source: 'gateway', target: 'order', cpm: 1250, latency: 45, errorRate: 1.5, status: 'normal' },
      { source: 'gateway', target: 'auth', cpm: 890, latency: 35, errorRate: 0.05, status: 'normal' },
      { source: 'order', target: 'payment', cpm: 450, latency: 310, errorRate: 5.8, status: 'slow' },
      { source: 'order', target: 'postgres', cpm: 1250, latency: 5, errorRate: 0.1, status: 'normal' },
      { source: 'payment', target: 'stripe', cpm: 420, latency: 680, errorRate: 3.5, status: 'slow' },
      { source: 'payment', target: 'postgres', cpm: 450, latency: 8, errorRate: 0.0, status: 'normal' },
      { source: 'auth', target: 'redis', cpm: 2670, latency: 1, errorRate: 0.01, status: 'normal' },
      { source: 'auth', target: 'postgres', cpm: 200, latency: 4, errorRate: 0.0, status: 'normal' }
    ]
  },
  staging: {
    nodes: [
      { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 100.0, cpm: 450, latency: 18, cpu: 12, memory: 35, alarms: [], x: 100, y: 220, healthScore: 100, status: 'healthy', instanceCount: 2 },
      { id: 'order', name: 'order-center-service', type: 'service', sla: 99.90, cpm: 150, latency: 42, cpu: 15, memory: 55, alarms: [], x: 350, y: 120, healthScore: 98, status: 'healthy', instanceCount: 2 },
      { id: 'auth', name: 'auth-service', type: 'service', sla: 100.0, cpm: 110, latency: 25, cpu: 10, memory: 28, alarms: [], x: 350, y: 320, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'payment', name: 'payment-service', type: 'service', sla: 100.0, cpm: 60, latency: 95, cpu: 20, memory: 40, alarms: [], x: 580, y: 120, healthScore: 99, status: 'healthy', instanceCount: 1 },
      { id: 'postgres', name: 'PostgreSQL-Stg', type: 'database', sla: 100.0, cpm: 240, latency: 6, cpu: 15, memory: 60, alarms: [], x: 580, y: 320, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'redis', name: 'Redis-Stg', type: 'cache', sla: 100.0, cpm: 500, latency: 1.2, cpu: 5, memory: 15, alarms: [], x: 350, y: 440, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'stripe', name: 'Stripe-Sandbox', type: 'external', sla: 99.90, cpm: 50, latency: 210, cpu: 0, memory: 0, alarms: [], x: 780, y: 120, healthScore: 98, status: 'healthy', instanceCount: 1 }
    ],
    relations: [
      { source: 'gateway', target: 'order', cpm: 150, latency: 38, errorRate: 0.1, status: 'normal' },
      { source: 'gateway', target: 'auth', cpm: 110, latency: 22, errorRate: 0.0, status: 'normal' },
      { source: 'order', target: 'payment', cpm: 60, latency: 82, errorRate: 0.0, status: 'normal' },
      { source: 'order', target: 'postgres', cpm: 150, latency: 6, errorRate: 0.0, status: 'normal' },
      { source: 'payment', target: 'stripe', cpm: 50, latency: 210, errorRate: 0.1, status: 'normal' },
      { source: 'payment', target: 'postgres', cpm: 60, latency: 7, errorRate: 0.0, status: 'normal' },
      { source: 'auth', target: 'redis', cpm: 330, latency: 1.2, errorRate: 0.0, status: 'normal' },
      { source: 'auth', target: 'postgres', cpm: 30, latency: 5, errorRate: 0.0, status: 'normal' }
    ]
  },
  dev: {
    nodes: [
      { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 100.0, cpm: 45, latency: 22, cpu: 5, memory: 20, alarms: [], x: 100, y: 220, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'order', name: 'order-center-service', type: 'service', sla: 100.0, cpm: 18, latency: 12, cpu: 4, memory: 30, alarms: [], x: 350, y: 120, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'auth', name: 'auth-service', type: 'service', sla: 100.0, cpm: 15, latency: 15, cpu: 3, memory: 20, alarms: [], x: 350, y: 320, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'payment', name: 'payment-service', type: 'service', sla: 90.00, cpm: 10, latency: 1500, cpu: 8, memory: 35, alarms: ['Dev DB query timeout'], x: 580, y: 120, healthScore: 60, status: 'critical', instanceCount: 1 },
      { id: 'postgres', name: 'PostgreSQL-Dev', type: 'database', sla: 100.0, cpm: 50, latency: 8, cpu: 2, memory: 40, alarms: [], x: 580, y: 320, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'redis', name: 'Redis-Dev', type: 'cache', sla: 100.0, cpm: 80, latency: 1.5, cpu: 1, memory: 10, alarms: [], x: 350, y: 440, healthScore: 100, status: 'healthy', instanceCount: 1 },
      { id: 'stripe', name: 'Stripe-Mock', type: 'external', sla: 100.0, cpm: 10, latency: 50, cpu: 0, memory: 0, alarms: [], x: 780, y: 120, healthScore: 100, status: 'healthy', instanceCount: 1 }
    ],
    relations: [
      { source: 'gateway', target: 'order', cpm: 18, latency: 10, errorRate: 0.0, status: 'normal' },
      { source: 'gateway', target: 'auth', cpm: 15, latency: 12, errorRate: 0.0, status: 'normal' },
      { source: 'order', target: 'payment', cpm: 10, latency: 1500, errorRate: 10.0, status: 'failing' },
      { source: 'order', target: 'postgres', cpm: 18, latency: 8, errorRate: 0.0, status: 'normal' },
      { source: 'payment', target: 'stripe', cpm: 10, latency: 50, errorRate: 0.0, status: 'normal' },
      { source: 'payment', target: 'postgres', cpm: 32, latency: 12, errorRate: 0.0, status: 'normal' },
      { source: 'auth', target: 'redis', cpm: 45, latency: 2, errorRate: 0.0, status: 'normal' },
      { source: 'auth', target: 'postgres', cpm: 5, latency: 8, errorRate: 0.0, status: 'normal' }
    ]
  }
};

// ==========================================
// 5. Distributed Traces In-Memory Repository
// ==========================================

let activeTraces: ApmTrace[] = [
  {
    traceId: "99.123.14656453",
    endpoint: "/api/v1/order/create",
    statusCode: 500,
    totalDuration: 120,
    serviceCount: 3,
    startTime: "2026-06-12 10:15:02.102",
    httpMethod: "POST",
    clientIp: "203.111.45.92",
    rootServiceName: "gateway-service",
    hasError: true,
    spans: [
      {
        spanId: 0,
        parentSpanId: -1,
        serviceName: "gateway-service",
        endpoint: "/api/v1/order/create",
        startTime: 0,
        duration: 120,
        type: "Entry",
        status: "Success",
        component: "SpringCloudGateway",
        httpHeaders: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "X-Forwarded-For": "203.111.45.92",
          "Traceparent": "00-99.123.14656453-0",
          "Accept": "application/json"
        },
        tags: {
          "http.method": "POST",
          "http.status_code": 500,
          "net.peer.ip": "203.111.45.92"
        }
      },
      {
        spanId: 1,
        parentSpanId: 0,
        serviceName: "order-center-service",
        endpoint: "OrderController.create",
        startTime: 10,
        duration: 110,
        type: "Local",
        status: "Error",
        component: "Tomcat-SpringMVC",
        errorLog: "NullPointerException at OrderService.java:45\n\tat com.app.order.OrderService.calculateTotal(OrderService.java:45)\n\tat com.app.order.OrderController.create(OrderController.java:28)\n\tat java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103)",
        tags: {
          "error": true,
          "error.kind": "java.lang.NullPointerException",
          "db.pool.exhausted": true
        },
        logs: [
          { timestamp: "10:15:02.115", event: "hikari.pool.acquire", message: "HikariPool-1 - Connection is not available, request timed out after 30000ms." },
          { timestamp: "10:15:02.122", event: "exception", message: "NullPointerException thrown during calculateTotal execution" }
        ]
      },
      {
        spanId: 2,
        parentSpanId: 1,
        serviceName: "inventory-service",
        endpoint: "InventoryClient.deduct",
        startTime: 25,
        duration: 40,
        type: "Exit",
        status: "Success",
        component: "PostgreSQL-JDBC",
        peer: "inventory-postgres-stg:5432",
        sql: "UPDATE inventory_stock SET available_qty = available_qty - 1 WHERE sku_id = 'sku_91bc9-1224' AND active = TRUE;",
        tags: {
          "db.system": "postgresql",
          "db.name": "inventory_db",
          "db.statement.affected_rows": 1
        }
      }
    ]
  },
  {
    traceId: "102.55.99281312",
    endpoint: "/api/v1/auth/login",
    statusCode: 200,
    totalDuration: 45,
    serviceCount: 2,
    startTime: "2026-06-12 10:15:03.245",
    httpMethod: "POST",
    clientIp: "180.201.32.11",
    rootServiceName: "gateway-service",
    hasError: false,
    spans: [
      {
        spanId: 0,
        parentSpanId: -1,
        serviceName: "gateway-service",
        endpoint: "POST /api/v1/auth/login",
        startTime: 0,
        duration: 45,
        type: "Entry",
        status: "Success",
        component: "SpringCloudGateway",
        httpHeaders: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)",
          "X-Forwarded-For": "180.201.32.11"
        },
        tags: {
          "http.method": "POST",
          "http.status_code": 200
        }
      },
      {
        spanId: 1,
        parentSpanId: 0,
        serviceName: "auth-service",
        endpoint: "AuthController.validateUser(..)",
        startTime: 5,
        duration: 40,
        type: "Entry",
        status: "Success",
        component: "SpringSecurity",
        tags: {
          "auth.type": "MFA_TOTP",
          "auth.success": true
        }
      },
      {
        spanId: 2,
        parentSpanId: 1,
        serviceName: "auth-service",
        endpoint: "Redis: GET session:token:92cf3",
        startTime: 8,
        duration: 4,
        type: "Exit",
        status: "Success",
        component: "Jedis-Cache",
        peer: "Redis-Cluster:6379",
        tags: {
          "db.system": "redis",
          "db.operation": "GET",
          "cache.hit": true
        }
      }
    ]
  },
  {
    traceId: "88.423.90124810",
    endpoint: "/api/v1/checkout/pay",
    statusCode: 200,
    totalDuration: 1850,
    serviceCount: 4,
    startTime: "2026-06-12 10:14:55.850",
    httpMethod: "POST",
    clientIp: "74.125.19.10",
    rootServiceName: "gateway-service",
    hasError: false,
    spans: [
      {
        spanId: 0,
        parentSpanId: -1,
        serviceName: "gateway-service",
        endpoint: "POST /api/v1/checkout/pay",
        startTime: 0,
        duration: 1850,
        type: "Entry",
        status: "Success",
        component: "SpringCloudGateway",
        httpHeaders: {
          "User-Agent": "Google-HTTP-Client/1.43.0",
          "X-Forwarded-For": "74.125.19.10"
        },
        tags: {
          "http.method": "POST",
          "http.status_code": 200
        }
      },
      {
        spanId: 1,
        parentSpanId: 0,
        serviceName: "payment-service",
        endpoint: "PaymentController.charge",
        startTime: 30,
        duration: 1820,
        type: "Local",
        status: "Success",
        component: "Tomcat-SpringMVC",
        tags: {
          "payment.provider": "stripe",
          "payment.currency": "USD"
        }
      },
      {
        spanId: 2,
        parentSpanId: 1,
        serviceName: "payment-service",
        endpoint: "Stripe-API: POST /v1/charges",
        startTime: 40,
        duration: 1510,
        type: "Exit",
        status: "Success",
        component: "HttpClient-External",
        peer: "api.stripe.com:443",
        httpHeaders: {
          "Authorization": "Bearer sk_prod_secret_8bc912ffcc33",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        tags: {
          "http.url": "https://api.stripe.com/v1/charges",
          "http.status_code": 200,
          "latency.warning": "High external RTT latency > 1500ms"
        }
      },
      {
        spanId: 3,
        parentSpanId: 1,
        serviceName: "payment-service",
        endpoint: "PostgreSQL: INSERT INTO payment_audit",
        startTime: 1560,
        duration: 15,
        type: "Exit",
        status: "Success",
        component: "PostgreSQL-JDBC",
        peer: "postgres-prod:5432",
        sql: "INSERT INTO payment_audit (charge_id, amount, status) VALUES ('ch_3M0x1a8', 29900, 'succeeded');"
      }
    ]
  },
  {
    traceId: "125.88.90124810",
    endpoint: "/api/v1/inventory/availability",
    statusCode: 200,
    totalDuration: 95,
    serviceCount: 2,
    startTime: "2026-06-12 10:15:08.410",
    httpMethod: "GET",
    clientIp: "123.45.67.89",
    rootServiceName: "gateway-service",
    hasError: false,
    spans: [
      {
        spanId: 0,
        parentSpanId: -1,
        serviceName: "gateway-service",
        endpoint: "GET /api/v1/inventory/availability",
        startTime: 0,
        duration: 95,
        type: "Entry",
        status: "Success",
        component: "SpringCloudGateway"
      },
      {
        spanId: 1,
        parentSpanId: 0,
        serviceName: "inventory-service",
        endpoint: "InventoryController.getAvailability",
        startTime: 5,
        duration: 88,
        type: "Entry",
        status: "Success",
        component: "Tomcat-SpringMVC"
      },
      {
        spanId: 2,
        parentSpanId: 1,
        serviceName: "inventory-service",
        endpoint: "PostgreSQL: SELECT stock",
        startTime: 12,
        duration: 76,
        type: "Exit",
        status: "Success",
        component: "PostgreSQL-JDBC",
        peer: "PostgreSQL-Prod:5432",
        sql: "SELECT * FROM inventory_stock WHERE warehouse_id = 104 AND sku_id IN ('sku_01', 'sku_02', 'sku_03');"
      }
    ]
  },
  {
    traceId: "331.42.11545624",
    endpoint: "/api/v1/user/profile",
    statusCode: 500,
    totalDuration: 320,
    serviceCount: 3,
    startTime: "2026-06-12 10:15:10.900",
    httpMethod: "GET",
    clientIp: "61.220.14.99",
    rootServiceName: "gateway-service",
    hasError: true,
    spans: [
      {
        spanId: 0,
        parentSpanId: -1,
        serviceName: "gateway-service",
        endpoint: "GET /api/v1/user/profile",
        startTime: 0,
        duration: 320,
        type: "Entry",
        status: "Error",
        component: "SpringCloudGateway"
      },
      {
        spanId: 1,
        parentSpanId: 0,
        serviceName: "auth-service",
        endpoint: "UserController.getUserProfile",
        startTime: 8,
        duration: 310,
        type: "Local",
        status: "Error",
        component: "Tomcat-SpringMVC",
        errorLog: "SQLException: Connection pool exhausted (HikariPool-auth) - Timeout waiting for idle connection after 3000ms"
      }
    ]
  }
];

// Helper to compute node health score dynamically
function calculateHealthScore(node: ApmServiceNode): number {
  let score = 100;
  if (node.sla < 99.9) score -= Math.min(25, (100 - node.sla) * 10);
  if (node.latency > 500) score -= 30;
  else if (node.latency > 100) score -= 15;
  if (node.cpu > 80) score -= 20;
  else if (node.cpu > 60) score -= 10;
  if (node.memory > 85) score -= 15;
  if (node.alarms.length > 0) score -= node.alarms.length * 10;
  return Math.max(10, Math.min(100, Math.round(score)));
}

// Generate realistic time series points according to requested time window
function generateTimeSeriesTrend(timeRange: string = '15m') {
  const pointsCount = timeRange === '24h' ? 24 : timeRange === '6h' ? 12 : timeRange === '1h' ? 12 : 7;
  const now = new Date();
  const trend = [];

  const stepMinutes = timeRange === '24h' ? 60 : timeRange === '6h' ? 30 : timeRange === '1h' ? 5 : 2;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * stepMinutes * 60 * 1000);
    const timeLabel = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    // Inject a realistic spike at index 2 or 3
    const isSpike = i === Math.floor(pointsCount / 2);
    const baseP99 = isSpike ? 290 : 145 + Math.floor(Math.sin(i) * 12);
    const baseP95 = isSpike ? 180 : 112 + Math.floor(Math.sin(i) * 8);
    const baseP90 = isSpike ? 125 : 92 + Math.floor(Math.cos(i) * 6);
    const median = isSpike ? 54 : 48 + Math.floor(Math.sin(i) * 3);
    const sla = isSpike ? 98.12 : 99.95 + (Math.sin(i) * 0.04);

    trend.push({
      time: timeLabel,
      P99: baseP99,
      P95: baseP95,
      P90: baseP90,
      Median: median,
      SLA: parseFloat(sla.toFixed(2))
    });
  }

  return trend;
}

// ==========================================
// 6. Router Implementation
// ==========================================

export function createApmRouter() {
  const router = Router();

  // -------------------------------------------------------------
  // 1. Health & Core Overview
  // -------------------------------------------------------------
  router.get('/health', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      const activeAlarmsCount = (settings.alarms || []).filter(a => a.status === 'Active').length;

      res.json({
        success: true,
        service: 'SkyWalking OAP Core v9.4 + SEMOR APM Engine',
        status: settings.config.isEmergencyActive ? 'emergency_bypass' : 'healthy',
        samplingRate: settings.config.samplingRate,
        emergencyShedding: settings.config.isEmergencyActive,
        activeRulesCount: settings.maskingRules.filter(r => r.isActive).length,
        activeAlarmsCount,
        maxTraceBufferMB: settings.config.maxTraceBufferMB,
        adaptiveSheddingThreshold: settings.config.adaptiveSheddingThreshold,
        complianceStandard: settings.config.complianceStandard,
        uptimeSeconds: Math.floor(process.uptime()) + 310500,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 2. Topology Management & Dynamic Incident Simulation
  // -------------------------------------------------------------
  router.get('/topology', (req: Request, res: Response) => {
    try {
      const env = (req.query.env as string) || 'prod';
      const topology = topologyByEnv[env] || topologyByEnv.prod;

      // Update dynamic health scores and status
      const nodesWithHealth = topology.nodes.map(n => {
        const score = calculateHealthScore(n);
        const status: 'healthy' | 'degraded' | 'critical' = score >= 90 ? 'healthy' : score >= 70 ? 'degraded' : 'critical';
        return {
          ...n,
          healthScore: score,
          status
        };
      });

      const totalCPM = nodesWithHealth.reduce((sum, s) => sum + s.cpm, 0);
      const avgLatency = Math.round(nodesWithHealth.reduce((sum, s) => sum + s.latency, 0) / (nodesWithHealth.length || 1));
      const avgSla = parseFloat((nodesWithHealth.reduce((sum, s) => sum + s.sla, 0) / (nodesWithHealth.length || 1)).toFixed(2));
      const activeAlarms = nodesWithHealth.reduce((sum, s) => sum + s.alarms.length, 0);

      res.json({
        success: true,
        env,
        services: nodesWithHealth,
        relations: topology.relations,
        stats: {
          totalCPM,
          avgLatency,
          avgSla,
          activeAlarms
        },
        timestamp: Date.now()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Incident Simulation endpoint (e.g. inject delay, connection pool exhaustion)
  router.post('/topology/simulate-incident', (req: Request, res: Response) => {
    try {
      const { env = 'prod', serviceId, incidentType, severity } = req.body;
      const targetEnv = topologyByEnv[env] || topologyByEnv.prod;
      const node = targetEnv.nodes.find(n => n.id === serviceId);

      if (!node) {
        return res.status(404).json({ success: false, message: `Service node '${serviceId}' not found in env '${env}'` });
      }

      if (incidentType === 'latency_spike') {
        node.latency = (node.latency || 50) * 4;
        node.sla = Math.max(88, node.sla - 8);
        node.alarms.push(`SLA Latency violation: Spike to ${node.latency}ms`);
      } else if (incidentType === 'cpu_overload') {
        node.cpu = 95;
        node.memory = 88;
        node.alarms.push(`High CPU overload (95%) detected on pod`);
      } else if (incidentType === 'db_pool_leak') {
        node.latency = 1200;
        node.sla = 82.5;
        node.alarms.push('HikariCP connection pool exhausted (100% active)');
      } else {
        node.sla = 91.0;
        node.alarms.push(`Custom incident simulated: ${incidentType || 'General degradation'}`);
      }

      node.healthScore = calculateHealthScore(node);
      node.status = node.healthScore >= 90 ? 'healthy' : node.healthScore >= 70 ? 'degraded' : 'critical';

      res.json({
        success: true,
        message: `Incident simulated on ${node.name}`,
        service: node
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Recover topology incident
  router.post('/topology/recover-incident', (req: Request, res: Response) => {
    try {
      const { env = 'prod', serviceId } = req.body;
      const targetEnv = topologyByEnv[env] || topologyByEnv.prod;

      if (serviceId) {
        const node = targetEnv.nodes.find(n => n.id === serviceId);
        if (node) {
          node.alarms = [];
          node.sla = 99.9;
          node.latency = node.type === 'gateway' ? 15 : node.type === 'database' ? 5 : 35;
          node.cpu = 25;
          node.healthScore = calculateHealthScore(node);
          node.status = 'healthy';
        }
      } else {
        // Reset all
        targetEnv.nodes.forEach(n => {
          n.alarms = [];
          n.sla = 99.9;
          n.latency = n.type === 'gateway' ? 15 : n.type === 'database' ? 5 : 35;
          n.cpu = 22;
          n.healthScore = calculateHealthScore(n);
          n.status = 'healthy';
        });
      }

      res.json({
        success: true,
        message: serviceId ? `Service ${serviceId} recovered` : `All services in ${env} recovered to healthy baseline`,
        nodes: targetEnv.nodes
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 3. Golden Metrics, Trends, Slow SQL & JVM Servers
  // -------------------------------------------------------------
  router.get('/metrics', (req: Request, res: Response) => {
    try {
      const env = (req.query.env as string) || 'prod';
      const timeRange = (req.query.timeRange as string) || '15m';
      const topology = topologyByEnv[env] || topologyByEnv.prod;

      const totalCPM = topology.nodes.reduce((sum, s) => sum + s.cpm, 0);
      const avgLatency = Math.round(topology.nodes.reduce((sum, s) => sum + s.latency, 0) / (topology.nodes.length || 1));
      const avgSla = parseFloat((topology.nodes.reduce((sum, s) => sum + s.sla, 0) / (topology.nodes.length || 1)).toFixed(2));
      const activeAlarms = env === 'prod' ? 3 : env === 'staging' ? 0 : 1;

      // Dynamic Time-Series Response Time Trend based on timeRange
      const rtTrend = generateTimeSeriesTrend(timeRange);

      const slowSql = [
        {
          sql: "SELECT DISTINCT u.*, r.role_name FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.deleted_at IS NULL AND u.email = ?;",
          count: 840,
          maxTime: "1250ms",
          avgTime: "840ms",
          db: "PostgreSQL-Prod",
          diagnosis: "Seq Scan on users without composite index on (deleted_at, email)",
          recommendation: "CREATE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL;"
        },
        {
          sql: "SELECT * FROM inventory_stock WHERE warehouse_id = ? AND sku_id IN (?, ?, ?, ?, ?, ?);",
          count: 1290,
          maxTime: "680ms",
          avgTime: "340ms",
          db: "PostgreSQL-Prod",
          diagnosis: "Index scan hit, but lock wait due to concurrent row updates",
          recommendation: "Enable read replica query offloading or batch inventory deductions with Redis INCRBY."
        },
        {
          sql: "UPDATE payment_tx SET rx_status = 'COMPLETED' WHERE transaction_uuid = ?;",
          count: 420,
          maxTime: "450ms",
          avgTime: "110ms",
          db: "PostgreSQL-Prod",
          diagnosis: "Row-exclusive lock contention under burst checkout traffic",
          recommendation: "Add connection-level statement timeout and partition payment_tx by month."
        }
      ];

      const slowEndpoints = [
        {
          path: "POST /api/v1/checkout/pay",
          type: "External API Integration",
          count: 450,
          errorRate: "5.80%",
          latency: "1850ms",
          p99Latency: "2100ms",
          slaGrade: "D",
          bottleneck: "Synchronous blocking HTTP calls to Stripe Gateway"
        },
        {
          path: "POST /api/v1/order/create",
          type: "Database Write/Internal Service",
          count: 1250,
          errorRate: "1.50%",
          latency: "45ms",
          p99Latency: "180ms",
          slaGrade: "B",
          bottleneck: "HikariCP connection pool timeout during peak order waves"
        },
        {
          path: "GET /api/v1/inventory/availability",
          type: "Query service",
          count: 3450,
          errorRate: "0.22%",
          latency: "95ms",
          p99Latency: "140ms",
          slaGrade: "A",
          bottleneck: "Normal query latency; Redis cache hit ratio 92%"
        }
      ];

      const jvmServers = [
        {
          name: "order-service-pod-0x1a8",
          cpu: 32,
          memoryUsed: "1420MB",
          memoryMax: "2048MB",
          heapUsed: 620,
          heapMax: 1024,
          threadCount: 84,
          gcCounts: 12,
          gcPauses: "28ms",
          heapEdenMB: 380,
          heapOldGenMB: 240,
          metaspaceMB: 128,
          threadStates: { RUNNABLE: 52, TIMED_WAITING: 24, BLOCKED: 8 }
        },
        {
          name: "order-service-pod-0x5f2",
          cpu: 28,
          memoryUsed: "1380MB",
          memoryMax: "2048MB",
          heapUsed: 590,
          heapMax: 1024,
          threadCount: 79,
          gcCounts: 10,
          gcPauses: "24ms",
          heapEdenMB: 360,
          heapOldGenMB: 230,
          metaspaceMB: 124,
          threadStates: { RUNNABLE: 48, TIMED_WAITING: 26, BLOCKED: 5 }
        },
        {
          name: "auth-service-pod-0x2d1",
          cpu: 14,
          memoryUsed: "840MB",
          memoryMax: "2048MB",
          heapUsed: 310,
          heapMax: 1024,
          threadCount: 45,
          gcCounts: 4,
          gcPauses: "12ms",
          heapEdenMB: 190,
          heapOldGenMB: 120,
          metaspaceMB: 98,
          threadStates: { RUNNABLE: 36, TIMED_WAITING: 8, BLOCKED: 1 }
        }
      ];

      res.json({
        success: true,
        stats: {
          totalCPM,
          avgLatency,
          avgSla,
          activeAlarms
        },
        rtTrend,
        slowSql,
        slowEndpoints,
        jvmServers,
        timestamp: Date.now()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 4. Distributed Traces API & Root Cause Diagnosis
  // -------------------------------------------------------------
  router.get('/traces', (req: Request, res: Response) => {
    try {
      const { query, filter, serviceName, minDuration, maxDuration, limit, offset } = req.query;
      let list = [...activeTraces];

      // Text search
      if (query && typeof query === 'string') {
        const q = query.toLowerCase();
        list = list.filter(t =>
          t.traceId.toLowerCase().includes(q) ||
          t.endpoint.toLowerCase().includes(q) ||
          t.spans.some(s =>
            s.serviceName.toLowerCase().includes(q) ||
            (s.errorLog && s.errorLog.toLowerCase().includes(q)) ||
            (s.sql && s.sql.toLowerCase().includes(q))
          )
        );
      }

      // Filter status
      if (filter === 'error') {
        list = list.filter(t => t.statusCode >= 500 || t.hasError || t.spans.some(s => s.status === 'Error'));
      } else if (filter === 'success') {
        list = list.filter(t => t.statusCode < 500 && !t.hasError && !t.spans.some(s => s.status === 'Error'));
      }

      // Service filter
      if (serviceName && typeof serviceName === 'string') {
        list = list.filter(t => t.spans.some(s => s.serviceName.toLowerCase() === serviceName.toLowerCase()));
      }

      // Duration range
      if (minDuration) {
        const min = Number(minDuration);
        if (!isNaN(min)) list = list.filter(t => t.totalDuration >= min);
      }
      if (maxDuration) {
        const max = Number(maxDuration);
        if (!isNaN(max)) list = list.filter(t => t.totalDuration <= max);
      }

      const totalCount = list.length;

      // Pagination
      if (offset) {
        list = list.slice(Number(offset));
      }
      if (limit) {
        list = list.slice(0, Number(limit));
      }

      res.json({
        success: true,
        total: totalCount,
        count: list.length,
        traces: list
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/traces/:traceId', (req: Request, res: Response) => {
    try {
      const { traceId } = req.params;
      const tr = activeTraces.find(t => t.traceId === traceId);
      if (!tr) {
        // Fallback to first if not found, or 404
        return res.status(404).json({ success: false, message: `Trace with id ${traceId} not found` });
      }

      res.json({ success: true, trace: tr });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Automated Root Cause Analysis (RCA) endpoint for a trace
  router.get('/traces/:traceId/analysis', (req: Request, res: Response) => {
    try {
      const { traceId } = req.params;
      const tr = activeTraces.find(t => t.traceId === traceId) || activeTraces[0];
      const errorSpan = tr.spans.find(s => s.status === 'Error');

      if (!errorSpan) {
        return res.json({
          success: true,
          traceId: tr.traceId,
          healthStatus: 'OPTIMAL',
          diagnosis: {
            titleZh: '鏈路運行良好 (Optimal Baseline)',
            titleEn: 'Trace Health Status: Optimal Baseline (Healthy)',
            summaryZh: '所有次級調用與資料庫查詢皆在預期 SLA 內，未偵測到任何鎖等待或連線耗竭。',
            summaryEn: 'All subordinate calls and queries executed within designated SLA limits. Zero deadlock or connection pool starvation detected.',
            recommendationZh: '保持現有 JVM GC 策略與探針採樣率設定。',
            recommendationEn: 'Maintain current JVM GC configurations and telemetry sampling frequency.'
          }
        });
      }

      // Order center error
      if (errorSpan.serviceName.includes('order')) {
        return res.json({
          success: true,
          traceId: tr.traceId,
          healthStatus: 'CRITICAL_EXCEPTION',
          culpritSpan: errorSpan,
          diagnosis: {
            titleZh: 'HikariCP 資料庫連線池耗竭引發連鎖 NullPointerException',
            titleEn: 'HikariCP Connection Pool Starvation leading to Cascading NullPointerException',
            summaryZh: `於微服務 ${errorSpan.serviceName} 端點 ${errorSpan.endpoint} 觸發重大異常。因資料庫連線池耗竭 (HikariPool Data Source)，查詢逾時回傳 null，未加防禦性程式碼引發 NullPointerException。`,
            summaryEn: `Critical exception in ${errorSpan.serviceName} at ${errorSpan.endpoint}. HikariPool connection timeout returned null which lacked defensive unwrapping, triggering cascading NPE.`,
            reasonsZh: [
              'HikariCP 內存池最大連線值 (maximum-pool-size) 超載 (當前佔用 100%)',
              '在 OrderService.java 45 行處未對數據查詢對象調用 Optional.ofNullable() 安全解包'
            ],
            reasonsEn: [
              'HikariCP datasource pool full (100% active connections in use)',
              'Missed Optional.ofNullable() defensive handling at OrderService.java:45'
            ],
            solutionZh: '1. 將 hikari connection-timeout 增至 15000ms，max-pool-size 增至 35。\n2. 對 OrderService.java:45 加入空值解包防護。',
            solutionEn: '1. Increase Hikari connection-timeout to 15000ms and max-pool-size to 35.\n2. Wrap line 45 with Optional.ofNullable safety checks.'
          }
        });
      }

      // Default upstream timeout
      return res.json({
        success: true,
        traceId: tr.traceId,
        healthStatus: 'UPSTREAM_LATENCY_TIMEOUT',
        culpritSpan: errorSpan,
        diagnosis: {
          titleZh: '外部第三方 API 回應延遲過長造成調用鏈逾時',
          titleEn: 'Upstream/External Outage SLA Timeout Defect',
          summaryZh: `在 ${errorSpan.serviceName} 調用外部服務時耗時過長，導致前端閘道超時中斷。`,
          summaryEn: `Prolonged latency while invoking external endpoint from ${errorSpan.serviceName}, throttling gateway throughput.`,
          reasonsZh: ['外部服務 RTT 達 1.5s 以上', '下游未設定 Hystrix / Sentinel 熔斷降級機制'],
          reasonsEn: ['External endpoint RTT exceeded 1.5s', 'Lack of circuit-breaker fallback protection'],
          solutionZh: '設定 @SentinelResource 降級策略，並將外部調用移至非同步線程池執行。',
          solutionEn: 'Implement @SentinelResource fallback pattern and offload calls to ThreadPoolExecutor.'
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 5. OpenTelemetry / SkyWalking Compatible Ingest Endpoint
  // -------------------------------------------------------------
  router.post('/ingest/trace', (req: Request, res: Response) => {
    try {
      const incoming = req.body;
      if (!incoming || !incoming.traceId || !incoming.endpoint) {
        return res.status(400).json({ success: false, message: 'traceId and endpoint are required for trace ingestion' });
      }

      const newTrace: ApmTrace = {
        traceId: String(incoming.traceId),
        endpoint: String(incoming.endpoint),
        statusCode: Number(incoming.statusCode) || 200,
        totalDuration: Number(incoming.totalDuration) || 50,
        serviceCount: Number(incoming.serviceCount) || (incoming.spans?.length || 1),
        startTime: incoming.startTime || new Date().toISOString().replace('T', ' ').substring(0, 23),
        spans: Array.isArray(incoming.spans) ? incoming.spans : [
          {
            spanId: 0,
            parentSpanId: -1,
            serviceName: incoming.serviceName || 'ai-gateway',
            endpoint: incoming.endpoint,
            startTime: 0,
            duration: incoming.totalDuration || 50,
            type: 'Entry',
            status: (incoming.statusCode >= 500) ? 'Error' : 'Success'
          }
        ],
        httpMethod: incoming.httpMethod || 'POST',
        clientIp: incoming.clientIp || '127.0.0.1',
        hasError: (Number(incoming.statusCode) >= 500)
      };

      activeTraces.unshift(newTrace);
      if (activeTraces.length > 50) {
        activeTraces = activeTraces.slice(0, 50);
      }

      res.status(201).json({
        success: true,
        message: 'Trace ingested successfully into APM repository',
        traceId: newTrace.traceId
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 6. Diagnostics, Profiling Tasks & Correlation Engine
  // -------------------------------------------------------------
  router.get('/diagnostics/correlation-blocks', (_req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        blocks: defaultCorrelationBlocks
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/diagnostics/profiling-tasks', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      res.json({ success: true, tasks: settings.profilingTasks });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/diagnostics/profiling-tasks', (req: Request, res: Response) => {
    try {
      const { taskName, targetInstance, durationSeconds } = req.body;
      if (!taskName || !targetInstance) {
        return res.status(400).json({ success: false, message: 'taskName and targetInstance are required' });
      }

      const settings = loadApmSettings();
      const servicePrefix = targetInstance.split('-')[0] || 'app';

      const newTask: ApmProfilingTask = {
        id: `PROF-${Date.now()}`,
        taskName,
        durationSeconds: Number(durationSeconds) || 15,
        status: 'Completed',
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        targetInstance,
        sampleCount: Math.round((Number(durationSeconds) || 15) * 120),
        threadState: 'RUNNABLE',
        flameGraphData: [
          { layer: 1, method: "java.lang.Thread.run()", cpuPercent: 100 },
          { layer: 2, method: "org.springframework.web.servlet.DispatcherServlet.doService()", cpuPercent: 92 },
          { layer: 3, method: `com.app.${servicePrefix}.BusinessService.executeWorkflow()`, cpuPercent: 82, isHotspot: true },
          { layer: 4, method: `com.app.${servicePrefix}.repository.DbRepository.findLockedRecords()`, cpuPercent: 64, isHotspot: true },
          { layer: 5, method: "java.net.SocketInputStream.socketRead0()", cpuPercent: 38 }
        ]
      };

      settings.profilingTasks.unshift(newTask);
      if (settings.profilingTasks.length > 25) {
        settings.profilingTasks = settings.profilingTasks.slice(0, 25);
      }
      saveApmSettings(settings);

      res.json({
        success: true,
        message: `Profiling task on ${targetInstance} completed successfully`,
        task: newTask,
        tasks: settings.profilingTasks
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // JVM Thread Dump capture endpoint
  router.get('/diagnostics/thread-dump', (req: Request, res: Response) => {
    try {
      const instance = (req.query.instance as string) || 'order-service-pod-0x1a8';
      const now = new Date().toISOString();

      const dump = {
        instance,
        timestamp: now,
        threadCountTotal: 84,
        deadlocksDetected: 0,
        threads: [
          {
            id: 14,
            name: "http-nio-8080-exec-1",
            state: "RUNNABLE",
            cpuTimeMs: 1420,
            stackTrace: [
              "java.base@17.0.8/java.net.SocketInputStream.socketRead0(Native Method)",
              "java.base@17.0.8/java.net.SocketInputStream.read(SocketInputStream.java:150)",
              "org.apache.coyote.http11.Http11InputBuffer.fill(Http11InputBuffer.java:785)",
              "org.apache.catalina.connector.CoyoteAdapter.service(CoyoteAdapter.java:343)"
            ]
          },
          {
            id: 28,
            name: "HikariPool-1 connection adder",
            state: "TIMED_WAITING",
            cpuTimeMs: 450,
            stackTrace: [
              "java.base@17.0.8/java.lang.Thread.sleep(Native Method)",
              "com.zaxxer.hikari.pool.HikariPool$PoolEntryCreator.call(HikariPool.java:725)"
            ]
          },
          {
            id: 42,
            name: "Async-ThreadPool-Worker-3",
            state: "BLOCKED",
            blockedOn: "0x0000000712ab9900 (a com.app.order.OrderService$LockObject)",
            ownerThreadId: 14,
            stackTrace: [
              "com.app.order.OrderService.calculateTotal(OrderService.java:45)",
              "com.app.order.OrderController.create(OrderController.java:28)"
            ]
          }
        ]
      };

      res.json({ success: true, dump });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // JVM Runtime memory pools breakdown
  router.get('/diagnostics/jvm-runtime', (req: Request, res: Response) => {
    try {
      const instance = (req.query.instance as string) || 'order-service-pod-0x1a8';
      res.json({
        success: true,
        instance,
        jvmVersion: 'OpenJDK 64-Bit Server VM (build 17.0.8+7, mixed mode, sharing)',
        garbageCollector: 'G1 Garbage Collector',
        memoryPools: {
          eden: { usedMB: 380, maxMB: 512, percent: 74 },
          survivor: { usedMB: 48, maxMB: 64, percent: 75 },
          oldGen: { usedMB: 240, maxMB: 512, percent: 46 },
          metaspace: { usedMB: 128, maxMB: 256, percent: 50 }
        },
        gcStats: {
          youngGcCount: 142,
          youngGcTimeMs: 1850,
          fullGcCount: 2,
          fullGcTimeMs: 420
        },
        systemLoad: {
          processCpuPercent: 32,
          systemCpuPercent: 54,
          openFileDescriptors: 245,
          maxFileDescriptors: 65535
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 7. Telemetry Alarms Management
  // -------------------------------------------------------------
  router.get('/alarms', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      res.json({
        success: true,
        alarms: settings.alarms || defaultAlarms
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/alarms/:id/acknowledge', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { user = 'admin' } = req.body;
      const settings = loadApmSettings();
      const alarms = settings.alarms || defaultAlarms;
      const alarm = alarms.find(a => a.id === id);

      if (!alarm) {
        return res.status(404).json({ success: false, message: `Alarm with id ${id} not found` });
      }

      alarm.status = 'Acknowledged';
      alarm.acknowledgedBy = user;
      settings.alarms = alarms;
      saveApmSettings(settings);

      res.json({ success: true, message: `Alarm ${id} acknowledged`, alarm });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/alarms/:id/resolve', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const settings = loadApmSettings();
      const alarms = settings.alarms || defaultAlarms;
      const alarm = alarms.find(a => a.id === id);

      if (!alarm) {
        return res.status(404).json({ success: false, message: `Alarm with id ${id} not found` });
      }

      alarm.status = 'Resolved';
      alarm.resolvedAt = new Date().toLocaleTimeString();
      settings.alarms = alarms;
      saveApmSettings(settings);

      res.json({ success: true, message: `Alarm ${id} resolved`, alarm });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 8. Governance, Adaptive Sampling & Emergency Shedding
  // -------------------------------------------------------------
  router.get('/governance', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      res.json({
        success: true,
        config: settings.config,
        maskingRules: settings.maskingRules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.put('/governance/sampling', (req: Request, res: Response) => {
    try {
      const { samplingRate } = req.body;
      if (typeof samplingRate !== 'number' || samplingRate < 0 || samplingRate > 100) {
        return res.status(400).json({ success: false, message: 'Invalid sampling rate (0-100 expected)' });
      }

      const settings = loadApmSettings();
      settings.config.samplingRate = samplingRate;
      saveApmSettings(settings);

      res.json({
        success: true,
        message: `Sampling rate successfully updated to ${samplingRate}%`,
        config: settings.config
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/governance/emergency-shedding', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      settings.config.isEmergencyActive = true;
      settings.config.samplingRate = 5;
      saveApmSettings(settings);

      // Auto restore after 10 seconds if not cancelled
      setTimeout(() => {
        try {
          const current = loadApmSettings();
          if (current.config.isEmergencyActive) {
            current.config.isEmergencyActive = false;
            current.config.samplingRate = 75;
            saveApmSettings(current);
          }
        } catch (e) {
          // ignore background timeout error
        }
      }, 10000);

      res.json({
        success: true,
        message: 'Emergency traffic shedding triggered! Sampling rate reduced to 5% bypass mode.',
        config: settings.config
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/governance/restore-shedding', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      settings.config.isEmergencyActive = false;
      settings.config.samplingRate = 75;
      saveApmSettings(settings);

      res.json({
        success: true,
        message: 'Normal sampling restored to 75%',
        config: settings.config
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 9. Data Masking & DLP Engine
  // -------------------------------------------------------------
  router.get('/masking-rules', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      res.json({ success: true, rules: settings.maskingRules });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/masking-rules', (req: Request, res: Response) => {
    try {
      const { name, regex, replacement, category } = req.body;
      if (!name || !regex) {
        return res.status(400).json({ success: false, message: 'Missing rule name or regex pattern' });
      }

      // Validate regex syntax
      try {
        new RegExp(regex.startsWith('(?i)') ? regex.substring(4) : regex);
      } catch (e: any) {
        return res.status(400).json({ success: false, message: `Invalid regular expression: ${e.message}` });
      }

      const settings = loadApmSettings();
      const newRule: ApmMaskingRule = {
        id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        regex,
        replacement: replacement || '******',
        isActive: true,
        category: category || 'Custom',
        hitsCount: 0
      };

      settings.maskingRules.push(newRule);
      saveApmSettings(settings);

      res.json({
        success: true,
        message: 'Masking rule created successfully',
        rule: newRule,
        rules: settings.maskingRules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.put('/masking-rules/:id/toggle', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const settings = loadApmSettings();
      const rule = settings.maskingRules.find(r => r.id === id);

      if (!rule) {
        return res.status(404).json({ success: false, message: 'Masking rule not found' });
      }

      rule.isActive = !rule.isActive;
      saveApmSettings(settings);

      res.json({
        success: true,
        message: `Rule "${rule.name}" is now ${rule.isActive ? 'Active' : 'Disabled'}`,
        rule,
        rules: settings.maskingRules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.delete('/masking-rules/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const settings = loadApmSettings();
      const prevCount = settings.maskingRules.length;
      settings.maskingRules = settings.maskingRules.filter(r => r.id !== id);

      if (settings.maskingRules.length === prevCount) {
        return res.status(404).json({ success: false, message: 'Masking rule not found' });
      }

      saveApmSettings(settings);
      res.json({
        success: true,
        message: 'Masking rule deleted successfully',
        rules: settings.maskingRules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Export masking rules
  router.get('/masking-rules/export', (_req: Request, res: Response) => {
    try {
      const settings = loadApmSettings();
      res.json({
        exportDate: new Date().toISOString(),
        version: '1.0',
        rules: settings.maskingRules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Import masking rules
  router.post('/masking-rules/import', (req: Request, res: Response) => {
    try {
      const { rules, overwrite = false } = req.body;
      if (!Array.isArray(rules)) {
        return res.status(400).json({ success: false, message: 'rules must be an array' });
      }

      const settings = loadApmSettings();
      if (overwrite) {
        settings.maskingRules = rules;
      } else {
        const existingIds = new Set(settings.maskingRules.map(r => r.id));
        rules.forEach((r: ApmMaskingRule) => {
          if (!existingIds.has(r.id)) {
            settings.maskingRules.push(r);
          }
        });
      }
      saveApmSettings(settings);

      res.json({
        success: true,
        message: `Imported ${rules.length} masking rules`,
        rules: settings.maskingRules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Masking Sandbox Simulation endpoint with detailed hits breakdown
  router.post('/masking/simulate', (req: Request, res: Response) => {
    try {
      const { payload } = req.body;
      if (typeof payload !== 'string') {
        return res.status(400).json({ success: false, message: 'payload string is required' });
      }

      const settings = loadApmSettings();
      let sanitized = payload;
      const matchedRules: Array<{ id: string; name: string; hitCount: number }> = [];

      settings.maskingRules.forEach(rule => {
        if (!rule.isActive) return;
        try {
          let flags = 'g';
          let cleanRegex = rule.regex;
          if (rule.regex.startsWith('(?i)')) {
            flags = 'gi';
            cleanRegex = rule.regex.substring(4);
          }
          const regex = new RegExp(cleanRegex, flags);
          const matches = sanitized.match(regex);
          if (matches && matches.length > 0) {
            matchedRules.push({
              id: rule.id,
              name: rule.name,
              hitCount: matches.length
            });
            sanitized = sanitized.replace(regex, rule.replacement);
            rule.hitsCount = (rule.hitsCount || 0) + matches.length;
          }
        } catch (e) {
          // ignore bad regex during simulation
        }
      });

      res.json({
        success: true,
        originalLength: payload.length,
        sanitizedLength: sanitized.length,
        matchedRulesCount: matchedRules.length,
        matchedRules,
        sanitized
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // -------------------------------------------------------------
  // 10. Reset to Factory Defaults
  // -------------------------------------------------------------
  router.post('/governance/reset-defaults', (_req: Request, res: Response) => {
    try {
      const defaultData: ApmSettingsData = {
        config: defaultGovernanceConfig,
        maskingRules: defaultMaskingRules,
        profilingTasks: defaultProfilingTasks,
        alarms: defaultAlarms
      };
      saveApmSettings(defaultData);
      res.json({
        success: true,
        message: 'APM settings successfully reset to factory defaults',
        ...defaultData
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

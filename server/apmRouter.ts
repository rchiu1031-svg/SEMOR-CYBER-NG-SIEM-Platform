import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';

const Router = express.Router;

const APM_SETTINGS_PATH = path.join(process.cwd(), 'apm_settings.json');

// Interface Definitions
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
}

export interface ApmServiceRelation {
  source: string;
  target: string;
  cpm: number;
  latency: number;
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
}

export interface ApmTrace {
  traceId: string;
  endpoint: string;
  statusCode: number;
  totalDuration: number;
  serviceCount: number;
  startTime: string;
  spans: ApmSpan[];
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
}

export interface ApmMaskingRule {
  id: string;
  name: string;
  regex: string;
  replacement: string;
  isActive: boolean;
}

export interface ApmGovernanceConfig {
  samplingRate: number;
  isEmergencyActive: boolean;
  complianceStandard: string;
  oapEncryption: boolean;
  maxTraceBufferMB: number;
  adaptiveSheddingThreshold: number; // e.g. 90%
}

export interface ApmSettingsData {
  config: ApmGovernanceConfig;
  maskingRules: ApmMaskingRule[];
  profilingTasks: ApmProfilingTask[];
}

// Initial defaults
const defaultMaskingRules: ApmMaskingRule[] = [
  {
    id: "mask-pwd",
    name: "機敏登入密碼遮蔽 (Password Regex Masking)",
    regex: "(?i)\"password\"\\s*:\\s*\"[^\"]+\"",
    replacement: "\"password\": \"******\"",
    isActive: true
  },
  {
    id: "mask-card",
    name: "信用卡卡號遮蔽 (Credit Card Masking)",
    regex: "\\b(?:\\d[ -]*?){13,16}\\b",
    replacement: "[CC CARD HOLDER MASKED]",
    isActive: true
  },
  {
    id: "mask-jwt",
    name: "API 授權金鑰遮蔽 (Bearer Auth Header Token)",
    regex: "Bearer\\s+ey[a-zA-Z0-9-_=]+\\.[a-zA-Z0-9-_=]+\\.?[a-zA-Z0-9-_.+/=]*",
    replacement: "Bearer [JWT TOKEN MASKED]",
    isActive: true
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
    status: "Running",
    time: "Running now...",
    targetInstance: "auth-service-pod-0x2d1",
    flameGraphData: [
      { layer: 1, method: "java.lang.Thread.run()", cpuPercent: 100 },
      { layer: 2, method: "com.app.auth.AuthController.login()", cpuPercent: 90 },
      { layer: 3, method: "com.app.auth.TokenGenerator.hmac()", cpuPercent: 65, isHotspot: true }
    ]
  }
];

const defaultGovernanceConfig: ApmGovernanceConfig = {
  samplingRate: 75,
  isEmergencyActive: false,
  complianceStandard: "GDPR/PCI-DSS",
  oapEncryption: true,
  maxTraceBufferMB: 2048,
  adaptiveSheddingThreshold: 90
};

// Persistence Helper functions
function loadApmSettings(): ApmSettingsData {
  try {
    if (fs.existsSync(APM_SETTINGS_PATH)) {
      const data = JSON.parse(fs.readFileSync(APM_SETTINGS_PATH, 'utf-8'));
      return {
        config: { ...defaultGovernanceConfig, ...(data.config || {}) },
        maskingRules: data.maskingRules || defaultMaskingRules,
        profilingTasks: data.profilingTasks || defaultProfilingTasks
      };
    }
  } catch (err) {
    console.error('Failed to load apm_settings.json:', err);
  }

  const initialData: ApmSettingsData = {
    config: defaultGovernanceConfig,
    maskingRules: defaultMaskingRules,
    profilingTasks: defaultProfilingTasks
  };
  saveApmSettings(initialData);
  return initialData;
}

function saveApmSettings(data: ApmSettingsData): boolean {
  try {
    fs.writeFileSync(APM_SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save apm_settings.json:', err);
    return false;
  }
}

// Topology per environment
const topologyByEnv: Record<string, { nodes: ApmServiceNode[]; relations: ApmServiceRelation[] }> = {
  prod: {
    nodes: [
      { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 99.98, cpm: 3450, latency: 15, cpu: 22, memory: 45, alarms: [], x: 100, y: 220 },
      { id: 'order', name: 'order-center-service', type: 'service', sla: 98.50, cpm: 1250, latency: 45, cpu: 54, memory: 72, alarms: ['OrderService.java:45 slow DB connection pool'], x: 350, y: 120 },
      { id: 'auth', name: 'auth-service', type: 'service', sla: 99.95, cpm: 890, latency: 35, cpu: 18, memory: 38, alarms: [], x: 350, y: 320 },
      { id: 'payment', name: 'payment-service', type: 'service', sla: 94.20, cpm: 450, latency: 310, cpu: 75, memory: 65, alarms: ['HTTP 502 connection timed out to Stripe Gateway', 'High thread contention detected'], x: 580, y: 120 },
      { id: 'postgres', name: 'PostgreSQL-Prod', type: 'database', sla: 100.0, cpm: 1890, latency: 4, cpu: 40, memory: 88, alarms: [], x: 580, y: 320 },
      { id: 'redis', name: 'Redis-Cluster', type: 'cache', sla: 99.99, cpm: 4120, latency: 0.8, cpu: 12, memory: 30, alarms: [], x: 350, y: 440 },
      { id: 'stripe', name: 'Stripe-API Gateway', type: 'external', sla: 96.50, cpm: 420, latency: 680, cpu: 0, memory: 0, alarms: ['SLA drop in external upstream endpoint'], x: 780, y: 120 }
    ],
    relations: [
      { source: 'gateway', target: 'order', cpm: 1250, latency: 45 },
      { source: 'gateway', target: 'auth', cpm: 890, latency: 35 },
      { source: 'order', target: 'payment', cpm: 450, latency: 310 },
      { source: 'order', target: 'postgres', cpm: 1250, latency: 5 },
      { source: 'payment', target: 'stripe', cpm: 420, latency: 680 },
      { source: 'payment', target: 'postgres', cpm: 450, latency: 8 },
      { source: 'auth', target: 'redis', cpm: 2670, latency: 1 },
      { source: 'auth', target: 'postgres', cpm: 200, latency: 4 }
    ]
  },
  staging: {
    nodes: [
      { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 100.0, cpm: 450, latency: 18, cpu: 12, memory: 35, alarms: [], x: 100, y: 220 },
      { id: 'order', name: 'order-center-service', type: 'service', sla: 99.90, cpm: 150, latency: 42, cpu: 15, memory: 55, alarms: [], x: 350, y: 120 },
      { id: 'auth', name: 'auth-service', type: 'service', sla: 100.0, cpm: 110, latency: 25, cpu: 10, memory: 28, alarms: [], x: 350, y: 320 },
      { id: 'payment', name: 'payment-service', type: 'service', sla: 100.0, cpm: 60, latency: 95, cpu: 20, memory: 40, alarms: [], x: 580, y: 120 },
      { id: 'postgres', name: 'PostgreSQL-Stg', type: 'database', sla: 100.0, cpm: 240, latency: 6, cpu: 15, memory: 60, alarms: [], x: 580, y: 320 },
      { id: 'redis', name: 'Redis-Stg', type: 'cache', sla: 100.0, cpm: 500, latency: 1.2, cpu: 5, memory: 15, alarms: [], x: 350, y: 440 },
      { id: 'stripe', name: 'Stripe-Sandbox', type: 'external', sla: 99.90, cpm: 50, latency: 210, cpu: 0, memory: 0, alarms: [], x: 780, y: 120 }
    ],
    relations: [
      { source: 'gateway', target: 'order', cpm: 150, latency: 38 },
      { source: 'gateway', target: 'auth', cpm: 110, latency: 22 },
      { source: 'order', target: 'payment', cpm: 60, latency: 82 },
      { source: 'order', target: 'postgres', cpm: 150, latency: 6 },
      { source: 'payment', target: 'stripe', cpm: 50, latency: 210 },
      { source: 'payment', target: 'postgres', cpm: 60, latency: 7 },
      { source: 'auth', target: 'redis', cpm: 330, latency: 1.2 },
      { source: 'auth', target: 'postgres', cpm: 30, latency: 5 }
    ]
  },
  dev: {
    nodes: [
      { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 100.0, cpm: 45, latency: 22, cpu: 5, memory: 20, alarms: [], x: 100, y: 220 },
      { id: 'order', name: 'order-center-service', type: 'service', sla: 100.0, cpm: 18, latency: 12, cpu: 4, memory: 30, alarms: [], x: 350, y: 120 },
      { id: 'auth', name: 'auth-service', type: 'service', sla: 100.0, cpm: 15, latency: 15, cpu: 3, memory: 20, alarms: [], x: 350, y: 320 },
      { id: 'payment', name: 'payment-service', type: 'service', sla: 90.00, cpm: 10, latency: 1500, cpu: 8, memory: 35, alarms: ['Dev DB query timeout'], x: 580, y: 120 },
      { id: 'postgres', name: 'PostgreSQL-Dev', type: 'database', sla: 100.0, cpm: 50, latency: 8, cpu: 2, memory: 40, alarms: [], x: 580, y: 320 },
      { id: 'redis', name: 'Redis-Dev', type: 'cache', sla: 100.0, cpm: 80, latency: 1.5, cpu: 1, memory: 10, alarms: [], x: 350, y: 440 },
      { id: 'stripe', name: 'Stripe-Mock', type: 'external', sla: 100.0, cpm: 10, latency: 50, cpu: 0, memory: 0, alarms: [], x: 780, y: 120 }
    ],
    relations: [
      { source: 'gateway', target: 'order', cpm: 18, latency: 10 },
      { source: 'gateway', target: 'auth', cpm: 15, latency: 12 },
      { source: 'order', target: 'payment', cpm: 10, latency: 1500 },
      { source: 'order', target: 'postgres', cpm: 18, latency: 8 },
      { source: 'payment', target: 'stripe', cpm: 10, latency: 50 },
      { source: 'payment', target: 'postgres', cpm: 32, latency: 12 },
      { source: 'auth', target: 'redis', cpm: 45, latency: 2 },
      { source: 'auth', target: 'postgres', cpm: 5, latency: 8 }
    ]
  }
};

// Rich Traces list
let activeTraces: ApmTrace[] = [
  {
    traceId: "99.123.14656453",
    endpoint: "/api/v1/order/create",
    statusCode: 500,
    totalDuration: 120,
    serviceCount: 3,
    startTime: "2026-06-12 10:15:02.102",
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
        errorLog: "NullPointerException at OrderService.java:45\n\tat com.app.order.OrderService.calculateTotal(OrderService.java:45)\n\tat com.app.order.OrderController.create(OrderController.java:28)\n\tat java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103)"
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
        sql: "UPDATE inventory_stock SET available_qty = available_qty - 1 WHERE sku_id = 'sku_91bc9-1224' AND active = TRUE;"
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
        component: "SpringSecurity"
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
        peer: "Redis-Cluster:6379"
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
        component: "Tomcat-SpringMVC"
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
        }
      }
    ]
  }
];

export function createApmRouter() {
  const router = Router();

  // 1. Get APM Runtime Overview & Health
  router.get('/health', (_req: Request, res: Response) => {
    const settings = loadApmSettings();
    res.json({
      success: true,
      service: 'SkyWalking OAP Core v9.4',
      status: 'healthy',
      samplingRate: settings.config.samplingRate,
      emergencyShedding: settings.config.isEmergencyActive,
      activeRulesCount: settings.maskingRules.filter(r => r.isActive).length,
      uptimeSeconds: 310500,
      timestamp: new Date().toISOString()
    });
  });

  // 2. Get Topology Data with Env and Dynamic Refresh Support
  router.get('/topology', (req: Request, res: Response) => {
    const env = (req.query.env as string) || 'prod';
    const topology = topologyByEnv[env] || topologyByEnv.prod;

    // Calculate aggregated environmental stats
    const totalCPM = topology.nodes.reduce((sum, s) => sum + s.cpm, 0);
    const avgLatency = Math.round(topology.nodes.reduce((sum, s) => sum + s.latency, 0) / topology.nodes.length);
    const avgSla = parseFloat((topology.nodes.reduce((sum, s) => sum + s.sla, 0) / topology.nodes.length).toFixed(2));
    const activeAlarms = env === 'prod' ? 3 : env === 'staging' ? 0 : 1;

    res.json({
      success: true,
      env,
      services: topology.nodes,
      relations: topology.relations,
      stats: {
        totalCPM,
        avgLatency,
        avgSla,
        activeAlarms
      }
    });
  });

  // 3. Get Golden Metrics, SLA Trends, Slow SQL, Slow Endpoints & JVM Servers
  router.get('/metrics', (req: Request, res: Response) => {
    const env = (req.query.env as string) || 'prod';
    const topology = topologyByEnv[env] || topologyByEnv.prod;
    const now = Date.now();

    const totalCPM = topology.nodes.reduce((sum, s) => sum + s.cpm, 0);
    const avgLatency = Math.round(topology.nodes.reduce((sum, s) => sum + s.latency, 0) / topology.nodes.length);
    const avgSla = parseFloat((topology.nodes.reduce((sum, s) => sum + s.sla, 0) / topology.nodes.length).toFixed(2));
    const activeAlarms = env === 'prod' ? 3 : env === 'staging' ? 0 : 1;

    // RT Trend (Response Time Trend & SLA)
    const rtTrend = [
      { time: '10:00', P99: 145, P95: 110, P90: 92, Median: 48, SLA: 99.98 },
      { time: '10:05', P99: 152, P95: 115, P90: 94, Median: 50, SLA: 99.95 },
      { time: '10:10', P99: 290, P95: 180, P90: 125, Median: 54, SLA: 98.12 },
      { time: '10:15', P99: 185, P95: 125, P90: 102, Median: 52, SLA: 98.85 },
      { time: '10:20', P99: 150, P95: 112, P90: 94, Median: 49, SLA: 99.96 },
      { time: '10:25', P99: 142, P95: 108, P90: 90, Median: 47, SLA: 99.99 },
      { time: '10:30', P99: 148, P95: 111, P90: 93, Median: 51, SLA: 100.0 }
    ];

    const slowSql = [
      { sql: "SELECT DISTINCT u.*, r.role_name FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.deleted_at IS NULL AND u.email = ?;", count: 840, maxTime: "1250ms", avgTime: "840ms", db: "PostgreSQL-Prod" },
      { sql: "SELECT * FROM inventory_stock WHERE warehouse_id = ? AND sku_id IN (?, ?, ?, ?, ?, ?);", count: 1290, maxTime: "680ms", avgTime: "340ms", db: "PostgreSQL-Prod" },
      { sql: "UPDATE payment_tx SET rx_status = 'COMPLETED' WHERE transaction_uuid = ?;", count: 420, maxTime: "450ms", avgTime: "110ms", db: "PostgreSQL-Prod" }
    ];

    const slowEndpoints = [
      { path: "POST /api/v1/checkout/pay", type: "External API Integration", count: 450, errorRate: "5.80%", latency: "1850ms" },
      { path: "POST /api/v1/order/create", type: "Database Write/Internal Service", count: 1250, errorRate: "1.50%", latency: "45ms" },
      { path: "GET /api/v1/inventory/availability", type: "Query service", count: 3450, errorRate: "0.22%", latency: "95ms" }
    ];

    const jvmServers = [
      { name: "order-service-pod-0x1a8", cpu: 32, memoryUsed: "1420MB", memoryMax: "2048MB", heapUsed: 620, heapMax: 1024, threadCount: 84, gcCounts: 12, gcPauses: "28ms" },
      { name: "order-service-pod-0x5f2", cpu: 28, memoryUsed: "1380MB", memoryMax: "2048MB", heapUsed: 590, heapMax: 1024, threadCount: 79, gcCounts: 10, gcPauses: "24ms" },
      { name: "auth-service-pod-0x2d1", cpu: 14, memoryUsed: "840MB", memoryMax: "2048MB", heapUsed: 310, heapMax: 1024, threadCount: 45, gcCounts: 4, gcPauses: "12ms" }
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
      timestamp: now
    });
  });

  // 4. Traces Management
  router.get('/traces', (req: Request, res: Response) => {
    const { query, filter } = req.query;
    let list = [...activeTraces];

    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      list = list.filter(t => t.traceId.toLowerCase().includes(q) || t.endpoint.toLowerCase().includes(q));
    }

    if (filter === 'error') {
      list = list.filter(t => t.statusCode >= 500);
    } else if (filter === 'success') {
      list = list.filter(t => t.statusCode < 500);
    }

    res.json({
      success: true,
      count: list.length,
      traces: list
    });
  });

  router.get('/traces/:traceId', (req: Request, res: Response) => {
    const { traceId } = req.params;
    const tr = activeTraces.find(t => t.traceId === traceId) || activeTraces[0];
    res.json({ success: true, trace: tr });
  });

  // 5. Governance Settings API (Get & Save configs)
  router.get('/governance', (_req: Request, res: Response) => {
    const settings = loadApmSettings();
    res.json({
      success: true,
      config: settings.config,
      maskingRules: settings.maskingRules
    });
  });

  router.put('/governance/sampling', (req: Request, res: Response) => {
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
  });

  // Emergency Shedding / Bypass API
  router.post('/governance/emergency-shedding', (_req: Request, res: Response) => {
    const settings = loadApmSettings();
    settings.config.isEmergencyActive = true;
    settings.config.samplingRate = 5;
    saveApmSettings(settings);

    // Schedule auto-reset or return status
    setTimeout(() => {
      const current = loadApmSettings();
      current.config.isEmergencyActive = false;
      saveApmSettings(current);
    }, 10000);

    res.json({
      success: true,
      message: 'Emergency traffic shedding triggered! Sampling rate reduced to 5% bypass mode.',
      config: settings.config
    });
  });

  // 6. Data Masking Rules CRUD
  router.get('/masking-rules', (_req: Request, res: Response) => {
    const settings = loadApmSettings();
    res.json({ success: true, rules: settings.maskingRules });
  });

  router.post('/masking-rules', (req: Request, res: Response) => {
    const { name, regex, replacement } = req.body;
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
      isActive: true
    };

    settings.maskingRules.push(newRule);
    saveApmSettings(settings);

    res.json({
      success: true,
      message: 'Masking rule created successfully',
      rule: newRule,
      rules: settings.maskingRules
    });
  });

  router.put('/masking-rules/:id/toggle', (req: Request, res: Response) => {
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
  });

  router.delete('/masking-rules/:id', (req: Request, res: Response) => {
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
  });

  // Masking Sandbox Simulation endpoint
  router.post('/masking/simulate', (req: Request, res: Response) => {
    const { payload } = req.body;
    if (typeof payload !== 'string') {
      return res.status(400).json({ success: false, message: 'payload string is required' });
    }

    const settings = loadApmSettings();
    let sanitized = payload;

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
        sanitized = sanitized.replace(regex, rule.replacement);
      } catch (e) {
        // Ignore bad regex at simulation
      }
    });

    res.json({
      success: true,
      originalLength: payload.length,
      sanitizedLength: sanitized.length,
      sanitized
    });
  });

  // 7. On-Demand Diagnostics & Profiling Tasks
  router.get('/diagnostics/profiling-tasks', (_req: Request, res: Response) => {
    const settings = loadApmSettings();
    res.json({ success: true, tasks: settings.profilingTasks });
  });

  router.post('/diagnostics/profiling-tasks', (req: Request, res: Response) => {
    const { taskName, targetInstance, durationSeconds } = req.body;
    if (!taskName || !targetInstance) {
      return res.status(400).json({ success: false, message: 'taskName and targetInstance are required' });
    }

    const settings = loadApmSettings();
    const newTask: ApmProfilingTask = {
      id: `PROF-${Date.now()}`,
      taskName,
      durationSeconds: Number(durationSeconds) || 15,
      status: 'Completed',
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      targetInstance,
      flameGraphData: [
        { layer: 1, method: "java.lang.Thread.run()", cpuPercent: 100 },
        { layer: 2, method: "org.springframework.web.servlet.DispatcherServlet.doService()", cpuPercent: 92 },
        { layer: 3, method: `com.app.${targetInstance.split('-')[0]}.BusinessService.execQuery()`, cpuPercent: 81, isHotspot: true },
        { layer: 4, method: "java.lang.Thread.sleep()", cpuPercent: 74, isHotspot: true },
        { layer: 5, method: "java.net.SocketInputStream.socketRead0()", cpuPercent: 42 }
      ]
    };

    settings.profilingTasks.unshift(newTask);
    // Keep max 20 tasks
    if (settings.profilingTasks.length > 20) {
      settings.profilingTasks = settings.profilingTasks.slice(0, 20);
    }
    saveApmSettings(settings);

    res.json({
      success: true,
      message: `Profiling task on ${targetInstance} completed successfully`,
      task: newTask,
      tasks: settings.profilingTasks
    });
  });

  // Reset to default settings
  router.post('/governance/reset-defaults', (_req: Request, res: Response) => {
    const defaultData: ApmSettingsData = {
      config: defaultGovernanceConfig,
      maskingRules: defaultMaskingRules,
      profilingTasks: defaultProfilingTasks
    };
    saveApmSettings(defaultData);
    res.json({
      success: true,
      message: 'APM settings successfully reset to factory defaults',
      ...defaultData
    });
  });

  return router;
}

import { 
  ServiceNode, 
  ServiceRelation, 
  Trace, 
  ProfilingTask, 
  CorrelationTimeBlock, 
  MaskingRule 
} from './ApmTypes';

// Environment-specific microservice topologies
export const MOCK_SERVICES: Record<string, ServiceNode[]> = {
  prod: [
    { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 99.98, cpm: 3450, latency: 15, cpu: 22, memory: 45, alarms: [], x: 100, y: 220 },
    { id: 'order', name: 'order-center-service', type: 'service', sla: 98.50, cpm: 1250, latency: 45, cpu: 54, memory: 72, alarms: ['OrderService.java:45 slow DB connection pool'], x: 350, y: 120 },
    { id: 'auth', name: 'auth-service', type: 'service', sla: 99.95, cpm: 890, latency: 35, cpu: 18, memory: 38, alarms: [], x: 350, y: 320 },
    { id: 'payment', name: 'payment-service', type: 'service', sla: 94.20, cpm: 450, latency: 310, cpu: 75, memory: 65, alarms: ['HTTP 502 connection timed out to Stripe Gateway', 'High thread contention detected'], x: 580, y: 120 },
    { id: 'postgres', name: 'PostgreSQL-Prod', type: 'database', sla: 100.0, cpm: 1890, latency: 4, cpu: 40, memory: 88, alarms: [], x: 580, y: 320 },
    { id: 'redis', name: 'Redis-Cluster', type: 'cache', sla: 99.99, cpm: 4120, latency: 0.8, cpu: 12, memory: 30, alarms: [], x: 350, y: 440 },
    { id: 'stripe', name: 'Stripe-API Gateway', type: 'external', sla: 96.50, cpm: 420, latency: 680, cpu: 0, memory: 0, alarms: ['SLA drop in external upstream endpoint'], x: 780, y: 120 }
  ],
  staging: [
    { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 100.0, cpm: 450, latency: 18, cpu: 12, memory: 35, alarms: [], x: 100, y: 220 },
    { id: 'order', name: 'order-center-service', type: 'service', sla: 99.90, cpm: 150, latency: 42, cpu: 15, memory: 55, alarms: [], x: 350, y: 120 },
    { id: 'auth', name: 'auth-service', type: 'service', sla: 100.0, cpm: 110, latency: 25, cpu: 10, memory: 28, alarms: [], x: 350, y: 320 },
    { id: 'payment', name: 'payment-service', type: 'service', sla: 100.0, cpm: 60, latency: 95, cpu: 20, memory: 40, alarms: [], x: 580, y: 120 },
    { id: 'postgres', name: 'PostgreSQL-Stg', type: 'database', sla: 100.0, cpm: 240, latency: 6, cpu: 15, memory: 60, alarms: [], x: 580, y: 320 },
    { id: 'redis', name: 'Redis-Stg', type: 'cache', sla: 100.0, cpm: 500, latency: 1.2, cpu: 5, memory: 15, alarms: [], x: 350, y: 440 },
    { id: 'stripe', name: 'Stripe-Sandbox', type: 'external', sla: 99.90, cpm: 50, latency: 210, cpu: 0, memory: 0, alarms: [], x: 780, y: 120 }
  ],
  dev: [
    { id: 'gateway', name: 'gateway-service', type: 'gateway', sla: 100.0, cpm: 45, latency: 22, cpu: 5, memory: 20, alarms: [], x: 100, y: 220 },
    { id: 'order', name: 'order-center-service', type: 'service', sla: 100.0, cpm: 18, latency: 12, cpu: 4, memory: 30, alarms: [], x: 350, y: 120 },
    { id: 'auth', name: 'auth-service', type: 'service', sla: 100.0, cpm: 15, latency: 15, cpu: 3, memory: 20, alarms: [], x: 350, y: 320 },
    { id: 'payment', name: 'payment-service', type: 'service', sla: 90.00, cpm: 10, latency: 1500, cpu: 8, memory: 35, alarms: ['Dev DB query timeout'], x: 580, y: 120 },
    { id: 'postgres', name: 'PostgreSQL-Dev', type: 'database', sla: 100.0, cpm: 50, latency: 8, cpu: 2, memory: 40, alarms: [], x: 580, y: 320 },
    { id: 'redis', name: 'Redis-Dev', type: 'cache', sla: 100.0, cpm: 80, latency: 1.5, cpu: 1, memory: 10, alarms: [], x: 350, y: 440 },
    { id: 'stripe', name: 'Stripe-Mock', type: 'external', sla: 100.0, cpm: 10, latency: 50, cpu: 0, memory: 0, alarms: [], x: 780, y: 120 }
  ]
};

export const MOCK_RELATIONS: Record<string, ServiceRelation[]> = {
  prod: [
    { source: 'gateway', target: 'order', cpm: 1250, latency: 45 },
    { source: 'gateway', target: 'auth', cpm: 890, latency: 35 },
    { source: 'order', target: 'payment', cpm: 450, latency: 310 },
    { source: 'order', target: 'postgres', cpm: 1250, latency: 5 },
    { source: 'payment', target: 'stripe', cpm: 420, latency: 680 },
    { source: 'payment', target: 'postgres', cpm: 450, latency: 8 },
    { source: 'auth', target: 'redis', cpm: 2670, latency: 1 },
    { source: 'auth', target: 'postgres', cpm: 200, latency: 4 }
  ],
  staging: [
    { source: 'gateway', target: 'order', cpm: 150, latency: 38 },
    { source: 'gateway', target: 'auth', cpm: 110, latency: 22 },
    { source: 'order', target: 'payment', cpm: 60, latency: 82 },
    { source: 'order', target: 'postgres', cpm: 150, latency: 6 },
    { source: 'payment', target: 'stripe', cpm: 50, latency: 210 },
    { source: 'payment', target: 'postgres', cpm: 60, latency: 7 },
    { source: 'auth', target: 'redis', cpm: 330, latency: 1.2 },
    { source: 'auth', target: 'postgres', cpm: 30, latency: 5 }
  ],
  dev: [
    { source: 'gateway', target: 'order', cpm: 18, latency: 10 },
    { source: 'gateway', target: 'auth', cpm: 15, latency: 12 },
    { source: 'order', target: 'payment', cpm: 10, latency: 1500 },
    { source: 'order', target: 'postgres', cpm: 18, latency: 8 },
    { source: 'payment', target: 'stripe', cpm: 10, latency: 50 },
    { source: 'payment', target: 'postgres', cpm: 32, latency: 12 },
    { source: 'auth', target: 'redis', cpm: 45, latency: 2 },
    { source: 'auth', target: 'postgres', cpm: 5, latency: 8 }
  ]
};

// Trace Analytics Viewer Datasets (Page C) - Fully mapped to user requirements
export const MOCK_TRACES: Trace[] = [
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

// Graph Trend Data for Page B
export const MOCK_RT_TREND = [
  { time: '10:00', P99: 145, P95: 110, P90: 92, Median: 48, SLA: 99.98 },
  { time: '10:05', P99: 152, P95: 115, P90: 94, Median: 50, SLA: 99.95 },
  { time: '10:10', P99: 290, P95: 180, P90: 125, Median: 54, SLA: 98.12 }, // spike due to order error
  { time: '10:15', P99: 185, P95: 125, P90: 102, Median: 52, SLA: 98.85 },
  { time: '10:20', P99: 150, P95: 112, P90: 94, Median: 49, SLA: 99.96 },
  { time: '10:25', P99: 142, P95: 108, P90: 90, Median: 47, SLA: 99.99 },
  { time: '10:30', P99: 148, P95: 111, P90: 93, Median: 51, SLA: 100.0 }
];

export const MOCK_SLOW_SQL = [
  { sql: "SELECT DISTINCT u.*, r.role_name FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.deleted_at IS NULL AND u.email = ?;", count: 840, maxTime: "1250ms", avgTime: "840ms", db: "PostgreSQL-Prod" },
  { sql: "SELECT * FROM inventory_stock WHERE warehouse_id = ? AND sku_id IN (?, ?, ?, ?, ?, ?);", count: 1290, maxTime: "680ms", avgTime: "340ms", db: "PostgreSQL-Prod" },
  { sql: "UPDATE payment_tx SET rx_status = 'COMPLETED' WHERE transaction_uuid = ?;", count: 420, maxTime: "450ms", avgTime: "110ms", db: "PostgreSQL-Prod" }
];

export const MOCK_SLOW_ENDPOINTS = [
  { path: "POST /api/v1/checkout/pay", type: "External API Integration", count: 450, errorRate: "5.80%", latency: "1850ms" },
  { path: "POST /api/v1/order/create", type: "Database Write/Internal Service", count: 1250, errorRate: "1.50%", latency: "45ms" },
  { path: "GET /api/v1/inventory/availability", type: "Query service", count: 3450, errorRate: "0.22%", latency: "95ms" }
];

// JVM Instance Metric Data
export const MOCK_JVM_SERVERS = [
  { name: "order-service-pod-0x1a8", cpu: 32, memoryUsed: "1420MB", memoryMax: "2048MB", heapUsed: 620, heapMax: 1024, threadCount: 84, gcCounts: 12, gcPauses: "28ms" },
  { name: "order-service-pod-0x5f2", cpu: 28, memoryUsed: "1380MB", memoryMax: "2048MB", heapUsed: 590, heapMax: 1024, threadCount: 79, gcCounts: 10, gcPauses: "24ms" },
  { name: "auth-service-pod-0x2d1", cpu: 14, memoryUsed: "840MB", memoryMax: "2048MB", heapUsed: 310, heapMax: 1024, threadCount: 45, gcCounts: 4, gcPauses: "12ms" }
];

// Profile tasks (Page D: Advanced Diagnostics)
export const MOCK_PROFILING_TASKS: ProfilingTask[] = [
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

// Unified Correlation Interval Blocks (Page D: Advanced Diagnostics)
export const CORRELATION_TIME_BLOCKS: CorrelationTimeBlock[] = [
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
      { traceId: "125.88.90124810", endpoint: "/api/v1/checkout/pay", latency: 1850, statusCode: 200, logExcerpt: "Timeout waiting for stripe Gateway callback" },
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
      { traceId: "102.55.99281312", endpoint: "/api/v1/auth/login", latency: 45, statusCode: 200, logExcerpt: "Redis connection speed slow - re-queued" },
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
      { traceId: "852.12.33921021", endpoint: "/api/v1/inventory/check", latency: 85, statusCode: 200, logExcerpt: "Cache HIT for stock id 91bc9" },
      { traceId: "551.99.11234908", endpoint: "/api/v1/auth/login", latency: 12, statusCode: 200, logExcerpt: "MFA success login verified" }
    ]
  }
];

// OAP Data Masking default policies (Page E: Governance Console)
export const DEFAULT_MASKING_RULES: MaskingRule[] = [
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

export const MOCK_ALARM_WEBHOOKS = [
  { id: "ALM-102", service: "payment-service", time: "10:14:55", reason: "SLA drops below threshold of 95% (Current: 94.20%)", level: "Critical", status: "Active" },
  { id: "ALM-103", service: "order-center-service", time: "10:15:02", reason: "Error rate spike detected: 1.50% in past 5m", level: "High", status: "Active" },
  { id: "ALM-104", service: "gateway-service", time: "09:42:15", reason: "SLA alert - minor rate warning on public auth path", level: "Warning", status: "Resolved" }
];

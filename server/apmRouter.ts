import express, { type Request, type Response } from 'express';
const Router = express.Router;

export function createApmRouter() {
  const router = Router();

  const topology = {
    nodes: [
      { id: "node-client", name: "External Client / Browser", type: "USER", status: "healthy", slaPct: 99.98, cpm: 9420 },
      { id: "node-ingress", name: "Traefik / NGINX Ingress WAF", type: "GATEWAY", status: "healthy", slaPct: 99.99, cpm: 9420 },
      { id: "node-collector", name: "semor-collector (Go Ingestion Core)", type: "SERVICE", status: "healthy", slaPct: 100.0, cpm: 8750 },
      { id: "node-siem-api", name: "semor-siem-api (Node.js/Express)", type: "SERVICE", status: "healthy", slaPct: 99.95, cpm: 4120 },
      { id: "node-vlog-engine", name: "semor-vlog-engine (Rust Block Core)", type: "STORAGE", status: "healthy", slaPct: 100.0, cpm: 8750 },
      { id: "node-redis", name: "Redis In-Memory Session Cache", type: "DATABASE", status: "healthy", slaPct: 100.0, cpm: 6410 }
    ],
    edges: [
      { source: "node-client", target: "node-ingress", latencyMs: 12.5, cpm: 9420, errorRatePct: 0.02 },
      { source: "node-ingress", target: "node-collector", latencyMs: 1.2, cpm: 8750, errorRatePct: 0.0 },
      { source: "node-ingress", target: "node-siem-api", latencyMs: 2.4, cpm: 4120, errorRatePct: 0.01 },
      { source: "node-collector", target: "node-vlog-engine", latencyMs: 0.45, cpm: 8750, errorRatePct: 0.0 },
      { source: "node-siem-api", target: "node-redis", latencyMs: 0.8, cpm: 6410, errorRatePct: 0.0 },
      { source: "node-siem-api", target: "node-vlog-engine", latencyMs: 1.8, cpm: 1240, errorRatePct: 0.0 }
    ]
  };

  const traces = [
    {
      traceId: "tr-941829104812",
      rootService: "semor-collector (Go Core)",
      endpoint: "POST /insert/jsonline",
      status: "SUCCESS",
      durationMs: 4.8,
      timestamp: new Date(Date.now() - 30000).toISOString(),
      spansCount: 4,
      spans: [
        { spanId: "sp-1", service: "Ingress WAF", operation: "HTTP POST /insert/jsonline", durationMs: 4.8, status: "OK" },
        { spanId: "sp-2", service: "Go Collector", operation: "RingBuffer.Push()", durationMs: 0.4, status: "OK" },
        { spanId: "sp-3", service: "Regex Pipeline", operation: "ECS Normalizer", durationMs: 1.8, status: "OK" },
        { spanId: "sp-4", service: "Rust Vlog Engine", operation: "Block.AppendRow()", durationMs: 2.2, status: "OK" }
      ]
    },
    {
      traceId: "tr-941829104813",
      rootService: "semor-siem-api",
      endpoint: "GET /api/engine/logsql/query",
      status: "SUCCESS",
      durationMs: 8.4,
      timestamp: new Date(Date.now() - 90000).toISOString(),
      spansCount: 3,
      spans: [
        { spanId: "sp-5", service: "SIEM API", operation: "handleLogsQLQuery", durationMs: 8.4, status: "OK" },
        { spanId: "sp-6", service: "Rust Storage", operation: "BloomFilter.Prune()", durationMs: 1.2, status: "OK" },
        { spanId: "sp-7", service: "Rust Storage", operation: "ZSTD.DecompressBlock()", durationMs: 5.6, status: "OK" }
      ]
    }
  ];

  router.get('/topology', (req: Request, res: Response) => {
    res.json({ success: true, topology });
  });

  router.get('/metrics', (req: Request, res: Response) => {
    const now = Date.now();
    res.json({
      success: true,
      serviceMetrics: [
        {
          service: "semor-collector-go",
          cpm: Math.floor(8500 + Math.sin(now / 4000) * 800),
          avgResponseTimeMs: 1.8,
          p95ResponseTimeMs: 3.2,
          p99ResponseTimeMs: 4.9,
          errorRatePct: 0.0,
          heapAllocMB: 48.5,
          goroutinesCount: 142
        },
        {
          service: "semor-vlog-engine-rust",
          cpm: Math.floor(8500 + Math.sin(now / 4000) * 800),
          avgResponseTimeMs: 0.85,
          p95ResponseTimeMs: 1.6,
          p99ResponseTimeMs: 2.4,
          errorRatePct: 0.0,
          residentMemoryMB: 94.2,
          activeThreads: 16
        },
        {
          service: "semor-siem-api",
          cpm: Math.floor(3800 + Math.sin(now / 6000) * 400),
          avgResponseTimeMs: 4.2,
          p95ResponseTimeMs: 7.8,
          p99ResponseTimeMs: 12.4,
          errorRatePct: 0.01,
          eventLoopLagMs: 0.4,
          memoryRssMB: 128.0
        }
      ]
    });
  });

  router.get('/traces', (req: Request, res: Response) => {
    res.json({ success: true, count: traces.length, traces });
  });

  router.get('/traces/:traceId', (req: Request, res: Response) => {
    const { traceId } = req.params;
    const tr = traces.find(t => t.traceId === traceId) || traces[0];
    res.json({ success: true, trace: tr });
  });

  return router;
}

import express, { type Request, type Response } from 'express';
import { 
  globalPlatformPerformanceEngine, 
  type ThresholdSettings 
} from './platformPerformanceEngine.ts';

const Router = express.Router;

export function createPlatformPerformanceRouter() {
  const router = Router();

  // GET /api/v1/platform-performance/nodes - List all cluster nodes with live telemetry
  router.get('/nodes', (req: Request, res: Response) => {
    try {
      const nodes = globalPlatformPerformanceEngine.getNodes();
      const thresholds = globalPlatformPerformanceEngine.getThresholds();
      const alerts = globalPlatformPerformanceEngine.evaluateAlerts();

      res.json({
        success: true,
        count: nodes.length,
        nodes,
        thresholds,
        activeAlertsCount: alerts.length,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/platform-performance/nodes/sync - Trigger real-time sync across nodes
  router.post('/nodes/sync', (req: Request, res: Response) => {
    try {
      const updatedNodes = globalPlatformPerformanceEngine.syncNodes();
      res.json({
        success: true,
        message: '已完成所有叢集節點即時指標同步！',
        count: updatedNodes.length,
        nodes: updatedNodes,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/platform-performance/nodes/:id - Node detail
  router.get('/nodes/:id', (req: Request, res: Response) => {
    try {
      const node = globalPlatformPerformanceEngine.getNodeById(req.params.id);
      if (!node) {
        return res.status(404).json({ success: false, message: 'Node not found' });
      }
      res.json({ success: true, node });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/platform-performance/nodes/:id/actions - Execute node remediation/operation
  router.post('/nodes/:id/actions', (req: Request, res: Response) => {
    try {
      const { action } = req.body;
      if (!['restart-service', 'purge-cache', 'toggle-drain'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid action specified' });
      }
      const result = globalPlatformPerformanceEngine.executeNodeAction(req.params.id, action);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/platform-performance/thresholds - Get current metric thresholds
  router.get('/thresholds', (req: Request, res: Response) => {
    try {
      const thresholds = globalPlatformPerformanceEngine.getThresholds();
      res.json({ success: true, thresholds });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // PUT /api/v1/platform-performance/thresholds - Save/update metric thresholds
  router.put('/thresholds', (req: Request, res: Response) => {
    try {
      const updates = req.body as Partial<ThresholdSettings>;
      const updated = globalPlatformPerformanceEngine.updateThresholds(updates);
      res.json({
        success: true,
        message: '效能指標與管理者告警門檻設定已成功儲存至系統！',
        thresholds: updated
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/platform-performance/thresholds/reset - Reset thresholds to default
  router.post('/thresholds/reset', (req: Request, res: Response) => {
    try {
      const reset = globalPlatformPerformanceEngine.resetThresholds();
      res.json({
        success: true,
        message: '已重置為系統預設指標閥值。',
        thresholds: reset
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/platform-performance/trends - Historical time series analytics
  router.get('/trends', (req: Request, res: Response) => {
    try {
      const trends = globalPlatformPerformanceEngine.getTrends();
      res.json({
        success: true,
        period: '24h',
        trends,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/platform-performance/topology - Live cluster topology
  router.get('/topology', (req: Request, res: Response) => {
    try {
      const topo = globalPlatformPerformanceEngine.getTopology();
      res.json({
        success: true,
        ...topo,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/platform-performance/test-alert - Test alert notification delivery
  router.post('/test-alert', (req: Request, res: Response) => {
    try {
      const { nodeId } = req.body;
      const result = globalPlatformPerformanceEngine.dispatchTestAlert(nodeId || 'work-03');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/platform-performance/alerts - List active alerts evaluated against thresholds
  router.get('/alerts', (req: Request, res: Response) => {
    try {
      const alerts = globalPlatformPerformanceEngine.evaluateAlerts();
      res.json({
        success: true,
        count: alerts.length,
        alerts,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/platform-performance/export - Export platform diagnostic report
  router.get('/export', (req: Request, res: Response) => {
    try {
      const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
      const report = globalPlatformPerformanceEngine.exportDiagnosticReport(format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="platform-performance-report.csv"');
        return res.send(report);
      }

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

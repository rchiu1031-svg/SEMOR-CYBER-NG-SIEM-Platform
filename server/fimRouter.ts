import express, { type Request, type Response } from 'express';
import { globalFimEngine } from './fimEngine.ts';

const Router = express.Router;

export function createFimRouter() {
  const router = Router();

  // --- 1. TELEMETRY & STATS ---
  router.get('/telemetry', (req: Request, res: Response) => {
    try {
      const data = globalFimEngine.getTelemetry();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 2. EVENTS ---
  router.get('/events', (req: Request, res: Response) => {
    try {
      const { severity, status, search, limit } = req.query;
      const events = globalFimEngine.getEvents({
        severity: typeof severity === 'string' ? severity : undefined,
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });
      res.json({ success: true, count: events.length, events });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/events/:id', (req: Request, res: Response) => {
    try {
      const event = globalFimEngine.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }
      res.json({ success: true, event });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Execute snapshot rollback
  router.post('/events/:id/rollback', (req: Request, res: Response) => {
    try {
      const { operator } = req.body || {};
      const result = globalFimEngine.executeRollback(req.params.id, operator);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Isolate host / kill offending process
  router.post('/events/:id/isolate', (req: Request, res: Response) => {
    try {
      const { operator } = req.body || {};
      const result = globalFimEngine.isolateHost(req.params.id, operator);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Update event status / analyst notes
  router.patch('/events/:id', (req: Request, res: Response) => {
    try {
      const updated = globalFimEngine.updateEvent(req.params.id, req.body);
      res.json({ success: true, event: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 3. PLAYBOOKS ---
  router.get('/playbooks', (req: Request, res: Response) => {
    try {
      const playbooks = globalFimEngine.getPlaybooks();
      res.json({ success: true, count: playbooks.length, playbooks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/playbooks/:id/toggle', (req: Request, res: Response) => {
    try {
      const updated = globalFimEngine.togglePlaybook(req.params.id);
      res.json({ success: true, playbook: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/playbooks/:id/mode', (req: Request, res: Response) => {
    try {
      const { mode } = req.body;
      const updated = globalFimEngine.changePlaybookMode(req.params.id, mode);
      res.json({ success: true, playbook: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/playbooks/:id/simulate', (req: Request, res: Response) => {
    try {
      const { targetHost } = req.body || {};
      const result = globalFimEngine.simulatePlaybook(req.params.id, targetHost);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 4. POLICIES ---
  router.get('/policies', (req: Request, res: Response) => {
    try {
      const policies = globalFimEngine.getPolicies();
      res.json({ success: true, count: policies.length, policies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/policies', (req: Request, res: Response) => {
    try {
      const newPolicy = globalFimEngine.createPolicy(req.body);
      res.json({ success: true, policy: newPolicy });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.patch('/policies/:id/toggle', (req: Request, res: Response) => {
    try {
      const updated = globalFimEngine.togglePolicy(req.params.id);
      res.json({ success: true, policy: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.delete('/policies/:id', (req: Request, res: Response) => {
    try {
      const removed = globalFimEngine.deletePolicy(req.params.id);
      res.json({ success: true, removed });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 5. BASELINES ---
  router.get('/baselines', (req: Request, res: Response) => {
    try {
      const baselines = globalFimEngine.getBaselines();
      res.json({ success: true, count: baselines.length, baselines });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/baselines/:id/recalculate', (req: Request, res: Response) => {
    try {
      const { approvedBy } = req.body || {};
      const updated = globalFimEngine.recalculateBaseline(req.params.id, approvedBy);
      res.json({ success: true, baseline: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/baselines', (req: Request, res: Response) => {
    try {
      const newBaseline = globalFimEngine.createBaseline(req.body);
      res.json({ success: true, baseline: newBaseline });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 6. ON-DEMAND INTEGRITY SCAN ---
  router.post('/scan', (req: Request, res: Response) => {
    try {
      const { path, host } = req.body || {};
      if (!path) {
        return res.status(400).json({ success: false, error: 'Target path is required for scanning' });
      }
      const scanResult = globalFimEngine.runScan(path, host);
      res.json({ success: true, scan: scanResult });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 7. AUDIT LOGS ---
  router.get('/audit', (req: Request, res: Response) => {
    try {
      const logs = globalFimEngine.getAuditLogs();
      res.json({ success: true, count: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 8. LEGACY MONITORED PATHS COMPATIBILITY ---
  router.get('/monitored-paths', (req: Request, res: Response) => {
    const paths = globalFimEngine.getMonitoredPaths();
    res.json({ success: true, count: paths.length, paths });
  });

  router.post('/monitored-paths', (req: Request, res: Response) => {
    const { path, host, os } = req.body;
    if (!path) {
      return res.status(400).json({ error: 'path is required' });
    }
    const newPath = globalFimEngine.addMonitoredPath(path, host, os);
    res.json({ success: true, message: `路徑 ${path} 已納入 FIM 完整性基準監控`, path: newPath });
  });

  router.post('/accept-baseline', (req: Request, res: Response) => {
    const { pathId, newSha256 } = req.body;
    const item = globalFimEngine.acceptBaseline(pathId, newSha256);
    res.json({ success: true, message: '已承認檔案變更並將當前特徵更新為正式合規基準', path: item });
  });

  return router;
}

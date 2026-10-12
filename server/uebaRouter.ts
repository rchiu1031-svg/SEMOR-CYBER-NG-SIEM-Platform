import express, { type Request, type Response } from 'express';
import { uebaEngine } from './uebaEngine.ts';

const Router = express.Router;

export function createUebaRouter() {
  const router = Router();

  // 1. Entities
  router.get('/entities', (req: Request, res: Response) => {
    const { minRisk, department, watchlist, type, search } = req.query;
    const filter: any = {};
    if (minRisk !== undefined) filter.minRisk = Number(minRisk);
    if (department !== undefined) filter.department = String(department);
    if (watchlist !== undefined) filter.watchlist = watchlist === 'true';
    if (type !== undefined) filter.type = String(type);
    if (search !== undefined) filter.search = String(search);

    const entities = uebaEngine.getEntities(filter);
    res.json({
      success: true,
      count: entities.length,
      entities
    });
  });

  router.get('/entities/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const entity = uebaEngine.getEntityById(id);
    if (!entity) {
      return res.status(404).json({ success: false, error: `Entity not found: ${id}` });
    }
    res.json({ success: true, entity });
  });

  // Backward compatibility: /users
  router.get('/users', (req: Request, res: Response) => {
    const { minRisk, department, watchlist, search } = req.query;
    const entities = uebaEngine.getEntities({
      minRisk: minRisk ? Number(minRisk) : undefined,
      department: department ? String(department) : undefined,
      watchlist: watchlist ? watchlist === 'true' : undefined,
      search: search ? String(search) : undefined
    });
    res.json({
      success: true,
      count: entities.length,
      users: entities.map(e => ({
        userId: e.id,
        username: e.name,
        department: e.department,
        riskScore: e.score,
        riskLevel: e.status,
        peerGroup: e.peerGroup,
        anomaliesCount: e.riskFactors.length,
        baselineDeviationPct: e.baselineDeviationPct,
        watchlist: e.watchlist,
        lastActive: e.lastActive
      }))
    });
  });

  router.get('/users/:id', (req: Request, res: Response) => {
    const entity = uebaEngine.getEntityById(req.params.id);
    if (!entity) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({ success: true, user: entity });
  });

  // 2. Activities & Anomalies
  router.get('/activities', (req: Request, res: Response) => {
    const { entityId, vector, minScore, limit } = req.query;
    const logs = uebaEngine.getActivityLogs({
      entityId: entityId ? String(entityId) : undefined,
      vector: vector ? String(vector) : undefined,
      minScore: minScore ? Number(minScore) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    res.json({
      success: true,
      count: logs.length,
      activities: logs
    });
  });

  // Backward compatibility: /anomalies
  router.get('/anomalies', (req: Request, res: Response) => {
    const logs = uebaEngine.getActivityLogs();
    res.json({
      success: true,
      count: logs.length,
      anomalies: logs.map(l => ({
        id: l.id,
        type: l.vector,
        desc: l.description,
        severity: l.score >= 85 ? 'Critical' : l.score >= 70 ? 'High' : 'Medium',
        time: l.time,
        username: l.entityName,
        riskScore: l.score
      }))
    });
  });

  // 3. Stats & Overview
  router.get('/stats', (req: Request, res: Response) => {
    const stats = uebaEngine.getStats();
    res.json({ success: true, ...stats });
  });

  // 4. Watchlist Toggle
  router.post('/watchlist', (req: Request, res: Response) => {
    const { username, entityId, enable, reason } = req.body;
    const target = entityId || username;
    if (!target) {
      return res.status(400).json({ success: false, error: 'Target entityId or username is required' });
    }
    const result = uebaEngine.toggleWatchlist(target, enable, reason);
    res.json(result);
  });

  // 5. Containment & Host Isolation
  router.post('/containment/isolate', (req: Request, res: Response) => {
    const { entityId, isolate } = req.body;
    if (!entityId) {
      return res.status(400).json({ success: false, error: 'entityId is required' });
    }
    const result = uebaEngine.toggleContainment(entityId, isolate !== false);
    res.json(result);
  });

  // 6. Playbook Orchestration
  router.post('/playbooks/execute', (req: Request, res: Response) => {
    const { targetUser } = req.body;
    if (!targetUser) {
      return res.status(400).json({ success: false, error: 'targetUser is required' });
    }
    const result = uebaEngine.executePlaybook(targetUser);
    res.json(result);
  });

  // 7. GenAI Security Copilot Query
  router.post('/copilot/query', (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }
    const result = uebaEngine.queryCopilot(query);
    res.json({ success: true, response: result });
  });

  // 7b. Execute BigQuery simulated analytics
  router.post('/copilot/execute-sql', (req: Request, res: Response) => {
    const { sql } = req.body;
    if (!sql) {
      return res.status(400).json({ success: false, error: 'sql query string is required' });
    }
    const result = uebaEngine.executeBigQuery(sql);
    res.json(result);
  });

  // 7c. Reset Entity Risk & Remediate
  router.post('/entities/:id/reset-risk', (req: Request, res: Response) => {
    const { id } = req.params;
    const result = uebaEngine.resetEntityRisk(id);
    res.json(result);
  });

  // 8. Log Interpretation
  router.post('/copilot/interpret-log', (req: Request, res: Response) => {
    const { logId } = req.body;
    if (!logId) {
      return res.status(400).json({ success: false, error: 'logId is required' });
    }
    const result = uebaEngine.interpretLog(logId);
    res.json(result);
  });

  // 9. Integrations Test (SIEM / SOAR)
  router.post('/integrations/test', (_req: Request, res: Response) => {
    const result = uebaEngine.testIntegrations();
    res.json(result);
  });

  // 10. Pipeline Feature Extraction
  router.post('/pipeline/feature-extraction', (_req: Request, res: Response) => {
    const result = uebaEngine.simulateFeatureExtraction();
    res.json(result);
  });

  // 11. Aurora Model Assessment
  router.post('/models/aurora-analysis', (_req: Request, res: Response) => {
    const result = uebaEngine.runAuroraAnalysis();
    res.json(result);
  });

  // 12. Simulate Behavior Event
  router.post('/simulate-event', (req: Request, res: Response) => {
    const { entityId, vector, type, description, score, deviation } = req.body;
    if (!entityId || !description) {
      return res.status(400).json({ success: false, error: 'entityId and description are required' });
    }
    const result = uebaEngine.simulateAnomalousEvent({
      entityId,
      vector: vector || 'Privilege Mutation',
      type: type || 'Endpoint',
      description,
      score: score || 85,
      deviation: deviation || '+500%'
    });
    res.json(result);
  });

  // 13. Settings (Weights & Policies)
  router.get('/settings', (_req: Request, res: Response) => {
    const settings = uebaEngine.getSettings();
    res.json({ success: true, settings });
  });

  router.post('/settings/weights', (req: Request, res: Response) => {
    const { weights } = req.body;
    if (!weights) {
      return res.status(400).json({ success: false, error: 'weights object is required' });
    }
    const result = uebaEngine.updateWeights(weights);
    res.json(result);
  });

  router.post('/settings/policies', (req: Request, res: Response) => {
    const { policy } = req.body;
    if (!policy || !policy.id || !policy.name) {
      return res.status(400).json({ success: false, error: 'valid policy object is required' });
    }
    const result = uebaEngine.addOrUpdatePolicy(policy);
    res.json(result);
  });

  router.delete('/settings/policies/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const result = uebaEngine.deletePolicy(id);
    res.json(result);
  });

  router.post('/models/retrain', (_req: Request, res: Response) => {
    const result = uebaEngine.retrainModel();
    res.json(result);
  });

  return router;
}

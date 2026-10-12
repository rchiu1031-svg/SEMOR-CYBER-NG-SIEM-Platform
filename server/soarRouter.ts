import express, { type Request, type Response } from 'express';
import { globalSoarEngine } from './soarEngine.ts';

const Router = express.Router;

export function createSoarRouter() {
  const router = Router();

  // --- 1. TELEMETRY & STATS ---
  router.get('/telemetry', (_req: Request, res: Response) => {
    try {
      const telemetry = globalSoarEngine.getTelemetryStats();
      res.json({ success: true, telemetry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 2. PLAYBOOKS CRUD & CONTROLS ---
  router.get('/playbooks', (_req: Request, res: Response) => {
    try {
      const playbooks = globalSoarEngine.getPlaybooks();
      res.json({ success: true, count: playbooks.length, playbooks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/playbooks/:id', (req: Request, res: Response) => {
    try {
      const pb = globalSoarEngine.getPlaybookById(req.params.id);
      if (!pb) {
        return res.status(404).json({ success: false, error: 'Playbook not found' });
      }
      res.json({ success: true, playbook: pb });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/playbooks', (req: Request, res: Response) => {
    try {
      const created = globalSoarEngine.createPlaybook(req.body);
      res.json({
        success: true,
        message: `SOAR 劇本 '${created.name}' 建立成功`,
        playbook: created
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.put('/playbooks/:id', (req: Request, res: Response) => {
    try {
      const updated = globalSoarEngine.updatePlaybook(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Playbook not found' });
      }
      res.json({
        success: true,
        message: `SOAR 劇本 '${updated.name}' 配置更新完成`,
        playbook: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.delete('/playbooks/:id', (req: Request, res: Response) => {
    try {
      const ok = globalSoarEngine.deletePlaybook(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Playbook not found' });
      }
      res.json({ success: true, message: `劇本 ${req.params.id} 已刪除` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/playbooks/:id/toggle', (req: Request, res: Response) => {
    try {
      const pb = globalSoarEngine.togglePlaybookStatus(req.params.id);
      if (!pb) {
        return res.status(404).json({ success: false, error: 'Playbook not found' });
      }
      res.json({
        success: true,
        message: `劇本狀態已切換為: ${pb.status}`,
        playbook: pb
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 3. EXECUTE PLAYBOOK (DRY-RUN & LIVE) ---
  router.post('/playbooks/:id/run', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { targetAsset, incidentId, dryRun, executedBy, parameters } = req.body;

      const execution = await globalSoarEngine.executePlaybook(id, {
        targetAsset,
        incidentId,
        dryRun: dryRun === true || dryRun === 'true',
        executedBy,
        parameters
      });

      res.json({
        success: true,
        message: execution.resultSummary,
        execution
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 4. EXECUTIONS AUDIT LOGS & ACTIONS ---
  router.get('/executions', (req: Request, res: Response) => {
    try {
      const filter = req.query.filter as string;
      const logs = globalSoarEngine.getExecutionLogs(filter);
      res.json({ success: true, count: logs.length, executions: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/executions/:id', (req: Request, res: Response) => {
    try {
      const log = globalSoarEngine.getExecutionById(req.params.id);
      if (!log) {
        return res.status(404).json({ success: false, error: 'Execution log not found' });
      }
      res.json({ success: true, execution: log });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/executions/:id/approve', (req: Request, res: Response) => {
    try {
      const { approver, remarks } = req.body;
      const updated = globalSoarEngine.approveExecution(req.params.id, approver, remarks);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Execution not found or not in pending state' });
      }
      res.json({
        success: true,
        message: `已核准處置執行 [${updated.id}]！指令已即刻下發基礎設施。`,
        execution: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/executions/:id/reject', (req: Request, res: Response) => {
    try {
      const { rejector, reason } = req.body;
      const updated = globalSoarEngine.rejectExecution(req.params.id, rejector, reason);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Execution not found' });
      }
      res.json({
        success: true,
        message: `已否決處置執行 [${updated.id}]，後續阻斷動作已取消。`,
        execution: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/executions/:id/rollback', (req: Request, res: Response) => {
    try {
      const { initiator } = req.body;
      const rolledBack = globalSoarEngine.rollbackExecution(req.params.id, initiator);
      if (!rolledBack) {
        return res.status(400).json({ success: false, error: 'Execution cannot be rolled back or already restored' });
      }
      res.json({
        success: true,
        message: `已成功對 [${rolledBack.id}] 發起安全補償性回滾！已解除隔離並恢復通訊。`,
        execution: rolledBack
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 5. CONNECTORS & HEALTH ---
  router.get('/connectors', (_req: Request, res: Response) => {
    try {
      const connectors = globalSoarEngine.getConnectors();
      res.json({ success: true, count: connectors.length, connectors });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/connectors/:id/test', (req: Request, res: Response) => {
    try {
      const result = globalSoarEngine.testConnector(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // --- 6. CUSTOM ACTION BUILDER TEST ---
  router.post('/builder/test', (req: Request, res: Response) => {
    try {
      const { protocol, endpoint, payload, headers } = req.body;
      const result = globalSoarEngine.testCustomAction({
        protocol: protocol || 'REST',
        endpoint: endpoint || 'https://api.paloaltonetworks.com/v1/address_groups/dynamic',
        payloadData: typeof payload === 'string' ? payload : JSON.stringify(payload || {}),
        headers
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 7. DISTRIBUTED VELOCIRAPTOR FORENSICS ---
  router.get('/forensics/sensors', (_req: Request, res: Response) => {
    try {
      const sensors = globalSoarEngine.getBranchSensors();
      res.json({ success: true, count: sensors.length, sensors });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/forensics/artifacts', (_req: Request, res: Response) => {
    try {
      const artifacts = globalSoarEngine.getForensicArtifacts();
      res.json({ success: true, count: artifacts.length, artifacts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/forensics/hunt', (req: Request, res: Response) => {
    try {
      const { targetAsset, vqlType } = req.body;
      if (!targetAsset) {
        return res.status(400).json({ success: false, error: 'targetAsset is required' });
      }
      const huntResult = globalSoarEngine.dispatchVelociraptorHunt(targetAsset, vqlType);
      res.json(huntResult);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 8. AI AUTOMATED RESPONSE COPILOT ---
  router.post('/ai/recommend', (req: Request, res: Response) => {
    try {
      const { incidentType, targetIoc } = req.body;
      const rec = globalSoarEngine.getAiPlaybookRecommendation(incidentType || '', targetIoc || '');
      res.json({ success: true, recommendation: rec });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

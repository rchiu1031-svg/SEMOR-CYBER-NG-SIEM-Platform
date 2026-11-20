import express, { type Request, type Response } from 'express';
import {
  globalCtoGovernanceEngine,
  type ExecutiveTimeRange,
  type ExecutivePersona,
  type FrameworkId
} from './ctoGovernanceEngine.ts';

const Router = express.Router;

export function createCtoGovernanceRouter() {
  const router = Router();

  // GET /api/v1/cto-governance/overview
  router.get('/overview', (req: Request, res: Response) => {
    try {
      const rangeParam = (req.query.timeRange as string) || '30d';
      const timeRange: ExecutiveTimeRange = ['7d', '30d', '90d'].includes(rangeParam)
        ? (rangeParam as ExecutiveTimeRange)
        : '30d';
      const data = globalCtoGovernanceEngine.getOverviewState(timeRange);
      res.json({
        success: true,
        ...data
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/fair-simulate
  router.post('/fair-simulate', (req: Request, res: Response) => {
    try {
      const controlEfficacy = Number(req.body?.controlEfficacy ?? 88);
      const threatFrequencyMultiplier = Number(req.body?.threatFrequencyMultiplier ?? 1.0);
      const simulation = globalCtoGovernanceEngine.simulateFair(controlEfficacy, threatFrequencyMultiplier);
      res.json({
        success: true,
        simulation
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/approvals/:id/decide
  router.post('/approvals/:id/decide', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { decision, operator } = req.body || {};
      if (decision !== 'approved' && decision !== 'rejected') {
        return res.status(400).json({ success: false, message: 'decision must be "approved" or "rejected"' });
      }
      const result = globalCtoGovernanceEngine.decideApproval(id, decision, operator);
      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/compliance/assess
  router.post('/compliance/assess', (req: Request, res: Response) => {
    try {
      const frameworkId = req.body?.frameworkId as FrameworkId;
      if (!frameworkId) {
        return res.status(400).json({ success: false, message: 'frameworkId is required' });
      }
      const result = globalCtoGovernanceEngine.runComplianceAssessment(frameworkId);
      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/compliance/capa/:id/playbook
  router.post('/compliance/capa/:id/playbook', (req: Request, res: Response) => {
    try {
      const result = globalCtoGovernanceEngine.triggerCapaPlaybook(req.params.id);
      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/compliance/capa/:id/resolve
  router.post('/compliance/capa/:id/resolve', (req: Request, res: Response) => {
    try {
      const result = globalCtoGovernanceEngine.resolveCapaTask(req.params.id);
      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/compliance/worm/verify
  router.post('/compliance/worm/verify', (req: Request, res: Response) => {
    try {
      const verification = globalCtoGovernanceEngine.verifyWormChain();
      res.json({
        success: true,
        ...verification
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/roadmap/:id/update
  router.post('/roadmap/:id/update', (req: Request, res: Response) => {
    try {
      const item = globalCtoGovernanceEngine.updateRoadmapItem(req.params.id, req.body || {});
      res.json({
        success: true,
        item
      });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/cto-governance/briefing/generate
  router.post('/briefing/generate', (req: Request, res: Response) => {
    try {
      const persona = (req.body?.persona as ExecutivePersona) || 'cto';
      const isZh = req.body?.isZh !== false;
      const customPrompt = req.body?.customPrompt as string | undefined;
      const briefing = globalCtoGovernanceEngine.generateBriefing(persona, isZh, customPrompt);
      res.json({
        success: true,
        briefing
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/cto-governance/export-pack
  router.get('/export-pack', (req: Request, res: Response) => {
    try {
      const pack = globalCtoGovernanceEngine.buildExportPack();
      res.json({
        success: true,
        pack
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

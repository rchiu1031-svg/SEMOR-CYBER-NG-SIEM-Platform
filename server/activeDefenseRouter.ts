import express, { type Request, type Response } from 'express';
import { globalActiveDefenseEngine } from './activeDefenseEngine.ts';

const Router = express.Router;

export function createActiveDefenseRouter() {
  const router = Router();

  // GET /api/v1/active-defense/architecture - Full distributed architecture & node mesh
  router.get('/architecture', (req: Request, res: Response) => {
    try {
      const state = globalActiveDefenseEngine.getArchitectureState();
      res.json({
        success: true,
        ...state
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/active-defense/iocs - List extracted threat indicators
  router.get('/iocs', (req: Request, res: Response) => {
    try {
      const iocs = globalActiveDefenseEngine.getIocList();
      res.json({
        success: true,
        count: iocs.length,
        iocs
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/active-defense/approvals - List pending approval queue
  router.get('/approvals', (req: Request, res: Response) => {
    try {
      const approvals = globalActiveDefenseEngine.getPendingApprovals();
      res.json({
        success: true,
        count: approvals.length,
        approvals
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/active-defense/approvals/:id/decide - Approve or Reject an attended SOAR item
  router.post('/approvals/:id/decide', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action, reason, operator } = req.body;

      if (action === 'APPROVE') {
        const appr = globalActiveDefenseEngine.getPendingApprovals().find(a => a.id === id);
        if (!appr) {
          return res.status(404).json({ success: false, message: '找不到此審批項目' });
        }
        const result = globalActiveDefenseEngine.executeSoarBroadcast({
          iocId: appr.iocId,
          dryRun: false,
          operator: operator || 'SOC-Lead-Attended'
        });
        res.json({
          success: true,
          action: 'APPROVED',
          message: '已通過核准！SOAR 引擎已完成全網節點 DAG/EDR 阻斷下發！',
          ...result
        });
      } else {
        const rejected = globalActiveDefenseEngine.rejectPendingApproval(id, reason || 'SOC 維運人員判定為誤報或維護活動', operator || 'SOC-Operator');
        res.json({
          success: true,
          action: 'REJECTED',
          message: '已忽略此阻斷請求，全網節點維持正常通行。',
          approval: rejected
        });
      }
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/active-defense/restore - Reversal / Un-isolate containment action
  router.post('/restore', (req: Request, res: Response) => {
    try {
      const { approvalId, iocId, operator } = req.body;
      const result = globalActiveDefenseEngine.executeRestoreAction({
        approvalId,
        iocId,
        operator: operator || 'SOC-Lead-Admin'
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/active-defense/score-calculate - Calculate 1-100 threat score
  router.post('/score-calculate', (req: Request, res: Response) => {
    try {
      const { behaviorLevel, threatConfidence, nodeTier, behaviorWeight, confidenceWeight, impactWeight } = req.body;
      const score = globalActiveDefenseEngine.calculateThreatScore({
        behaviorLevel: behaviorLevel || 'INTERACTIVE_SHELL',
        threatConfidence: Number(threatConfidence ?? 90),
        nodeTier: nodeTier || 'Tier-1-Core',
        behaviorWeight: behaviorWeight ? Number(behaviorWeight) : 0.5,
        confidenceWeight: confidenceWeight ? Number(confidenceWeight) : 0.25,
        impactWeight: impactWeight ? Number(impactWeight) : 0.25
      });
      res.json({
        success: true,
        calculation: score
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/active-defense/simulate-capture - Simulate Honeypot/Sandbox attack incursion
  router.post('/simulate-capture', (req: Request, res: Response) => {
    try {
      const { sourceNodeId, honeypotType, attackVector, targetIocValue } = req.body;
      const result = globalActiveDefenseEngine.simulateCaptureEvent({
        sourceNodeId: sourceNodeId || 'node-branch-hsinchu',
        honeypotType: honeypotType || 'Cowrie',
        attackVector: attackVector || 'Remote SSH Brute-Force & Dropper',
        targetIocValue
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/active-defense/dispatch-soar - Execute automated SOAR containment broadcast
  router.post('/dispatch-soar', (req: Request, res: Response) => {
    try {
      const { iocId, dryRun, operator } = req.body;
      if (!iocId) {
        return res.status(400).json({ success: false, message: '請指定欲下放聯防的 IoC 代號' });
      }

      const result = globalActiveDefenseEngine.executeSoarBroadcast({
        iocId,
        dryRun: Boolean(dryRun),
        operator: operator || 'SOC-Commander-Admin'
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/active-defense/verify-signature - Node-side verify signature test
  router.post('/verify-signature', (req: Request, res: Response) => {
    try {
      const { payload, signature } = req.body;
      const verification = globalActiveDefenseEngine.verifyDispatchSignature(payload, signature);
      res.json({
        success: verification.valid,
        ...verification,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/active-defense/security-config - Get anti-tamper and false positive policy
  router.get('/security-config', (req: Request, res: Response) => {
    try {
      const state = globalActiveDefenseEngine.getArchitectureState();
      res.json({
        success: true,
        config: state.policyConfig,
        whitelist: state.whitelistRules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // PUT /api/v1/active-defense/security-config - Update anti-tamper & false positive policy
  router.put('/security-config', (req: Request, res: Response) => {
    try {
      const updated = globalActiveDefenseEngine.updatePolicyConfig(req.body);
      res.json({
        success: true,
        message: '主動聯防安全策略、SOAR 雙軌模式與防誤報參數已成功更新！',
        config: updated
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

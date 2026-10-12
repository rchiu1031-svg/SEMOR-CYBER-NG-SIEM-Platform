import express, { type Request, type Response } from 'express';
import { globalCasesEngine } from './casesEngine.ts';

const Router = express.Router;

export function createCasesRouter() {
  const router = Router();

  // --- 1. METRICS & TELEMETRY ---
  router.get('/metrics', (_req: Request, res: Response) => {
    try {
      const metrics = globalCasesEngine.getMetrics();
      res.json({ success: true, metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 2. EXPORT CSV ---
  router.get('/export/csv', (_req: Request, res: Response) => {
    try {
      const csv = globalCasesEngine.exportCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=SEMOR_Cases_${new Date().toISOString().slice(0, 10)}.csv`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 3. STUDIO ADMIN CONFIGURATION ---
  router.get('/studio/config', (_req: Request, res: Response) => {
    try {
      const config = globalCasesEngine.getStudioConfig();
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.put('/studio/custom-fields', (req: Request, res: Response) => {
    try {
      const fields = globalCasesEngine.saveCustomFields(req.body.fields || []);
      res.json({ success: true, message: '自訂欄位設定已儲存', fields });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.put('/studio/layout-blocks', (req: Request, res: Response) => {
    try {
      const blocks = globalCasesEngine.saveLayoutBlocks(req.body.blocks || []);
      res.json({ success: true, message: '版面區塊配置已儲存', blocks });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.put('/studio/sla-stages', (req: Request, res: Response) => {
    try {
      const stages = globalCasesEngine.saveSlaStages(req.body.stages || []);
      res.json({ success: true, message: 'SLA 階段時效規範已儲存', stages });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.put('/studio/ingestion-mappings', (req: Request, res: Response) => {
    try {
      const mappings = globalCasesEngine.saveIngestionMappings(req.body.mappings || []);
      res.json({ success: true, message: '進線遙測映射已儲存', mappings });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/studio/versions', (req: Request, res: Response) => {
    try {
      const { author, note } = req.body;
      const ver = globalCasesEngine.createVersion(author, note);
      res.json({ success: true, message: `配置版本 ${ver.id} 建立成功`, version: ver });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/studio/versions/:id/revert', (req: Request, res: Response) => {
    try {
      const ok = globalCasesEngine.revertVersion(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Version not found' });
      }
      res.json({ success: true, message: `已成功復原至版本 ${req.params.id}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 4. CASES CRUD ---
  router.get('/', (req: Request, res: Response) => {
    try {
      const { status, severity, category, assignee, searchQuery, onlyMyCases } = req.query;
      const list = globalCasesEngine.getCases({
        status: status as string,
        severity: severity as string,
        category: category as string,
        assignee: assignee as string,
        searchQuery: searchQuery as string,
        onlyMyCases: onlyMyCases === 'true'
      });
      res.json({ success: true, count: list.length, cases: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/:id', (req: Request, res: Response) => {
    try {
      const item = globalCasesEngine.getCaseById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }
      res.json({ success: true, caseItem: item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/', (req: Request, res: Response) => {
    try {
      const newCase = globalCasesEngine.createCase(req.body);
      res.json({
        success: true,
        message: `案件 ${newCase.caseNumber} 已正式立案建立`,
        caseItem: newCase
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const updated = globalCasesEngine.updateCase(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }
      res.json({
        success: true,
        message: `案件 ${updated.caseNumber} 資料已更新`,
        caseItem: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const ok = globalCasesEngine.deleteCase(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }
      res.json({ success: true, message: `案件 ${req.params.id} 已刪除` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 5. WAR ROOM NOTES & CHAT ---
  router.post('/:id/notes', (req: Request, res: Response) => {
    try {
      const { text, author, role, avatarColor, isAutomatedBot } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: 'Note text is required' });
      }

      const note = globalCasesEngine.addWarRoomNote(req.params.id, {
        text,
        author,
        role,
        avatarColor,
        isAutomatedBot
      });

      if (!note) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }

      res.json({ success: true, note });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 6. REMEDIATION & CONTAINMENT ACTIONS ---
  router.post('/:id/actions', (req: Request, res: Response) => {
    try {
      const { actionType, note, analystName } = req.body;
      if (!actionType) {
        return res.status(400).json({ success: false, error: 'actionType is required' });
      }

      const result = globalCasesEngine.executeRemediationAction(
        req.params.id,
        actionType,
        note,
        analystName
      );

      if (!result) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 7. GENAI INVESTIGATION INSIGHT ---
  router.post('/:id/ai-insight', (req: Request, res: Response) => {
    try {
      const insight = globalCasesEngine.generateAiInsight(req.params.id);
      if (!insight) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }
      res.json(insight);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 8. OBSERVABLES ---
  router.post('/:id/observables', (req: Request, res: Response) => {
    try {
      const obs = globalCasesEngine.addObservable(req.params.id, req.body);
      if (!obs) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }
      res.json({ success: true, observable: obs });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}

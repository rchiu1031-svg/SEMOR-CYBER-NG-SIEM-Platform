import express, { type Request, type Response } from 'express';
import { forensicsEngine } from './forensicsEngine.ts';

const Router = express.Router;

export function createForensicsRouter() {
  const router = Router();

  // 1. Cases APIs
  router.get('/cases', (_req: Request, res: Response) => {
    const cases = forensicsEngine.getCases();
    res.json({ success: true, count: cases.length, cases });
  });

  router.get('/cases/:id', (req: Request, res: Response) => {
    const forensicCase = forensicsEngine.getCaseById(req.params.id);
    if (!forensicCase) {
      return res.status(404).json({ success: false, error: `案件未找到: ${req.params.id}` });
    }
    const evidence = forensicsEngine.getEvidence(forensicCase.id);
    res.json({ success: true, case: forensicCase, evidence });
  });

  router.post('/cases', (req: Request, res: Response) => {
    const newCase = forensicsEngine.createCase(req.body);
    res.json({ success: true, message: `案件 ${newCase.name} 已成功立案`, case: newCase });
  });

  router.post('/cases/:id/export-report', (req: Request, res: Response) => {
    const dossier = forensicsEngine.exportDossier(req.params.id);
    res.json({ success: true, dossier });
  });

  // 2. Evidence APIs
  router.get('/evidence', (req: Request, res: Response) => {
    const caseId = req.query.caseId as string | undefined;
    const evidence = forensicsEngine.getEvidence(caseId);
    res.json({ success: true, count: evidence.length, evidence });
  });

  router.get('/evidence/:id', (req: Request, res: Response) => {
    const evi = forensicsEngine.getEvidenceById(req.params.id);
    if (!evi) {
      return res.status(404).json({ success: false, error: `事證未找到: ${req.params.id}` });
    }
    res.json({ success: true, evidence: evi });
  });

  router.post('/evidence', (req: Request, res: Response) => {
    const newEvi = forensicsEngine.addEvidence(req.body);
    res.json({ success: true, message: `鑑識事證 '${newEvi.name}' 已成功封裝並計入監管鏈`, evidence: newEvi });
  });

  router.post('/evidence/:id/verify-hash', (req: Request, res: Response) => {
    const result = forensicsEngine.verifyEvidenceHash(req.params.id);
    res.json(result);
  });

  router.post('/evidence/:id/transfer-custody', (req: Request, res: Response) => {
    const { recipient, reason, examiner } = req.body;
    const record = forensicsEngine.transferCustody({
      evidenceId: req.params.id,
      recipient,
      reason,
      examiner
    });
    res.json({ success: true, message: '監管鏈移轉審計紀錄已成功簽署寫入', record });
  });

  // 3. Hex Sector Dump
  router.get('/evidence/:id/hex', (req: Request, res: Response) => {
    const offset = (req.query.offset as string) || '0x000F83C0';
    const hexBlocks = forensicsEngine.getHexDump(req.params.id, offset);
    res.json({ success: true, evidenceId: req.params.id, offset, hexBlocks });
  });

  // 4. File Carving Recovery
  router.post('/evidence/:id/carve', (req: Request, res: Response) => {
    const result = forensicsEngine.carveArtifacts(req.params.id);
    res.json(result);
  });

  // 5. Super-Timeline API
  router.get('/timeline', (req: Request, res: Response) => {
    const evidenceId = req.query.evidenceId as string | undefined;
    const timeline = forensicsEngine.getSuperTimeline(evidenceId);
    res.json({ success: true, count: timeline.length, timeline });
  });

  // 6. Chain of Custody Ledger API
  router.get('/chain-of-custody', (req: Request, res: Response) => {
    const evidenceId = req.query.evidenceId as string | undefined;
    const ledger = forensicsEngine.getCustodyLedger(evidenceId);
    res.json({ success: true, count: ledger.length, custodyLedger: ledger });
  });

  // 7. YARA Deployment API
  router.post('/yara/deploy', (req: Request, res: Response) => {
    const { ruleName, ruleBody } = req.body;
    if (!ruleName) {
      return res.status(400).json({ success: false, error: 'ruleName is required' });
    }
    const result = forensicsEngine.deployYaraRule({ ruleName, ruleBody });
    res.json(result);
  });

  // 8. GenAI Forensics Copilot Query
  router.post('/copilot/query', (req: Request, res: Response) => {
    const { prompt, contextEvidenceId } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }
    const result = forensicsEngine.queryForensicsCopilot(prompt, contextEvidenceId);
    res.json({ success: true, response: result });
  });

  // 8b. Volatility 3 Memory Extraction API
  router.get('/memory-analysis', (req: Request, res: Response) => {
    const evidenceId = (req.query.evidenceId as string) || 'EVI-002';
    const result = forensicsEngine.getMemoryAnalysis(evidenceId);
    res.json(result);
  });

  // 8c. Network PCAP Reconstruction API
  router.get('/network-sessions', (req: Request, res: Response) => {
    const evidenceId = req.query.evidenceId as string | undefined;
    const result = forensicsEngine.getNetworkSessions(evidenceId);
    res.json(result);
  });

  // 8d. Registry Carving & OS Footprint API
  router.get('/registry-carving', (req: Request, res: Response) => {
    const evidenceId = (req.query.evidenceId as string) || 'EVI-001';
    const result = forensicsEngine.getRegistryCarving(evidenceId);
    res.json(result);
  });


  // 9. Backward Compatibility: Artifacts API
  router.get('/artifacts', (_req: Request, res: Response) => {
    const evidence = forensicsEngine.getEvidence();
    res.json({
      success: true,
      count: evidence.length,
      artifacts: evidence.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        fileSizeMB: e.fileSizeMB,
        sha256: e.sha256,
        acquiredFrom: e.acquiredFrom,
        acquiredBy: e.acquiredBy,
        acquiredAt: e.acquiredAt,
        verifiedIntegrity: e.verifiedIntegrity,
        notes: e.notes
      }))
    });
  });

  router.post('/artifacts', (req: Request, res: Response) => {
    const newEvi = forensicsEngine.addEvidence(req.body);
    res.json({
      success: true,
      message: `鑑識證據 '${newEvi.name}' 已成功封裝並計入監管鏈`,
      artifact: {
        id: newEvi.id,
        name: newEvi.name,
        type: newEvi.type,
        fileSizeMB: newEvi.fileSizeMB,
        sha256: newEvi.sha256,
        acquiredFrom: newEvi.acquiredFrom,
        acquiredBy: newEvi.acquiredBy,
        acquiredAt: newEvi.acquiredAt,
        verifiedIntegrity: newEvi.verifiedIntegrity,
        notes: newEvi.notes
      }
    });
  });

  return router;
}

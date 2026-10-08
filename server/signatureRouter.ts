import express, { type Request, type Response } from 'express';
import {
  globalSignatureUpdateEngine,
  globalFingerbankEngine
} from './signatureUpdateEngine.ts';

const Router = express.Router;

export function createSignatureRouter(
  getLogsCorpus?: () => any[],
  getFlowCollectorEngine?: () => any
) {
  const router = Router();

  // 1. GET /api/v1/signatures/databases - List all 9 signature databases
  router.get('/databases', (_req: Request, res: Response) => {
    const databases = globalSignatureUpdateEngine.getDatabases();
    const totalRules = databases.reduce((sum, d) => sum + d.ruleCount, 0);
    const updateAvailableCount = databases.filter(d => d.status === 'update_available').length;

    res.json({
      success: true,
      count: databases.length,
      totalRules,
      updateAvailableCount,
      databases
    });
  });

  // 2. POST /api/v1/signatures/databases/:id/update - Update a specific signature database
  router.post('/databases/:id/update', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await globalSignatureUpdateEngine.updateDatabase(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || '更新特徵庫失敗' });
    }
  });

  // 3. POST /api/v1/signatures/databases/update-all - Update all eligible databases
  router.post('/databases/update-all', async (_req: Request, res: Response) => {
    try {
      const result = await globalSignatureUpdateEngine.updateAllDatabases();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || '批次更新失敗' });
    }
  });

  // 4. PUT /api/v1/signatures/databases/:id/toggle-auto - Toggle auto update
  router.put('/databases/:id/toggle-auto', (req: Request, res: Response) => {
    const { id } = req.params;
    const newState = globalSignatureUpdateEngine.toggleAutoUpdate(id);
    res.json({
      success: true,
      id,
      autoUpdate: newState,
      message: `特徵庫 ${id} 自動更新已${newState ? '啟用' : '關閉'}`
    });
  });

  // 5. GET /api/v1/signatures/config - Get auto-update configuration
  router.get('/config', (_req: Request, res: Response) => {
    res.json({
      success: true,
      config: globalSignatureUpdateEngine.getConfig()
    });
  });

  // 6. POST /api/v1/signatures/config - Save auto-update configuration
  router.post('/config', (req: Request, res: Response) => {
    const body = req.body;
    globalSignatureUpdateEngine.updateConfig(body);
    res.json({
      success: true,
      message: '特徵庫自動更新排程與網路代理設定已儲存',
      config: globalSignatureUpdateEngine.getConfig()
    });
  });

  // 7. GET /api/v1/signatures/audit-logs - Recent update activity logs
  router.get('/audit-logs', (_req: Request, res: Response) => {
    res.json({
      success: true,
      logs: globalSignatureUpdateEngine.getAuditLogs()
    });
  });

  // ==========================================
  // Fingerbank Device Fingerprinting Endpoints
  // ==========================================

  // 8. GET /api/v1/signatures/fingerbank/status - Fingerbank engine status & stats
  router.get('/fingerbank/status', (_req: Request, res: Response) => {
    const stats = globalFingerbankEngine.getStats();
    let flowCount = 0;
    if (getFlowCollectorEngine) {
      const engine = getFlowCollectorEngine();
      if (engine && typeof engine.getFlows === 'function') {
        flowCount = engine.getFlows().length;
      }
    }
    let logCount = 0;
    if (getLogsCorpus) {
      logCount = getLogsCorpus().length;
    }

    res.json({
      success: true,
      ...stats,
      activeFlowCount: flowCount,
      activeLogCorpusCount: logCount,
      sourceEndpoint: 'https://api.fingerbank.org/v2',
      status: 'active'
    });
  });

  // 9. POST /api/v1/signatures/fingerbank/sync - Sync latest Fingerbank DB package
  router.post('/fingerbank/sync', async (_req: Request, res: Response) => {
    try {
      const result = await globalSignatureUpdateEngine.updateDatabase('fingerbank');
      res.json({
        success: true,
        message: '已成功向 https://api.fingerbank.org/v2/download 下載並更新終端設備特徵庫！',
        database: result.database
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Fingerbank 同步失敗' });
    }
  });

  // 10. POST /api/v1/signatures/fingerbank/interrogate - Interactive device interrogation tester
  router.post('/fingerbank/interrogate', async (req: Request, res: Response) => {
    const { ip, mac, dhcp_fingerprint, user_agent, tcp_syn, hostname } = req.body;
    try {
      const match = await globalFingerbankEngine.interrogateDevice({
        ip,
        mac,
        dhcp_fingerprint,
        user_agent,
        tcp_syn,
        hostname
      });

      res.json({
        success: true,
        match,
        query: { ip, mac, dhcp_fingerprint, user_agent }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || '設備指紋比對失敗' });
    }
  });

  // 11. GET /api/v1/signatures/fingerbank/live-devices - List recognized devices in network
  router.get('/fingerbank/live-devices', (_req: Request, res: Response) => {
    const devices = globalFingerbankEngine.getIdentifiedEndpointsList();
    res.json({
      success: true,
      count: devices.length,
      devices
    });
  });

  return router;
}

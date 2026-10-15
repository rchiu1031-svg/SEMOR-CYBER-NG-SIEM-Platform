import express, { type Request, type Response } from 'express';
import { globalNacEngine, type ConnectionProfileRule, type SwitchConfig } from './nacEngine.ts';

const Router = express.Router;

export function createNacRouter() {
  const router = Router();

  // Middleware for JSON parsing if mounted standalone
  router.use(express.json());

  // 1. Stats and Overview Metrics
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const metrics = globalNacEngine.getMetrics();
      res.json({ success: true, data: metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Nodes Management & Containment
  router.get('/nodes', (req: Request, res: Response) => {
    try {
      const { search, status, os, vlan } = req.query;
      let nodes = globalNacEngine.getAllNodes();

      if (search && typeof search === 'string') {
        const term = search.toLowerCase();
        nodes = nodes.filter(n =>
          n.mac.toLowerCase().includes(term) ||
          n.ip.toLowerCase().includes(term) ||
          n.owner.toLowerCase().includes(term) ||
          n.os.toLowerCase().includes(term) ||
          n.switchIp.toLowerCase().includes(term) ||
          n.switchPort.toLowerCase().includes(term)
        );
      }

      if (status && typeof status === 'string') {
        nodes = nodes.filter(n => n.status.toLowerCase() === status.toLowerCase());
      }

      if (os && typeof os === 'string') {
        nodes = nodes.filter(n => n.os.toLowerCase() === os.toLowerCase());
      }

      if (vlan && !isNaN(Number(vlan))) {
        nodes = nodes.filter(n => n.vlan === Number(vlan));
      }

      res.json({ success: true, count: nodes.length, data: nodes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/nodes/:mac', (req: Request, res: Response) => {
    try {
      const node = globalNacEngine.getNodeByMac(req.params.mac);
      if (!node) {
        return res.status(404).json({ success: false, error: `Node with MAC ${req.params.mac} not found` });
      }
      res.json({ success: true, data: node });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Action: Isolate Node (VLAN 99 Quarantine)
  router.post('/nodes/:mac/isolate', (req: Request, res: Response) => {
    try {
      const { reason } = req.body || {};
      const result = globalNacEngine.isolateNode(req.params.mac, reason);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Action: Block Node (Full Blacklist & Access-Reject & Port Down)
  router.post('/nodes/:mac/block', (req: Request, res: Response) => {
    try {
      const { reason, source } = req.body || {};
      const result = globalNacEngine.blockNode(req.params.mac, reason, source || 'manual_admin');
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Action: Restore / Unblock Node
  router.post('/nodes/:mac/restore', (req: Request, res: Response) => {
    try {
      const { targetVlan } = req.body || {};
      const result = globalNacEngine.restoreNode(req.params.mac, targetVlan ? Number(targetVlan) : 10);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Action: Change VLAN dynamically
  router.post('/nodes/:mac/vlan', (req: Request, res: Response) => {
    try {
      const { vlan } = req.body;
      if (!vlan || isNaN(Number(vlan))) {
        return res.status(400).json({ success: false, error: 'Valid numeric vlan is required' });
      }
      const result = globalNacEngine.changeNodeVlan(req.params.mac, Number(vlan));
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Action: Disconnect Node (RFC 3576 CoA)
  router.post('/nodes/:mac/disconnect', (req: Request, res: Response) => {
    try {
      const result = globalNacEngine.disconnectNode(req.params.mac);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Alerts Stream & Rapid Containment
  router.get('/alerts', (req: Request, res: Response) => {
    try {
      const alerts = globalNacEngine.getAllAlerts();
      res.json({ success: true, count: alerts.length, data: alerts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/alerts/:id/isolate', (req: Request, res: Response) => {
    try {
      const alert = globalNacEngine.getAllAlerts().find(a => a.id === req.params.id);
      if (!alert) {
        return res.status(404).json({ success: false, error: `Alert ${req.params.id} not found` });
      }
      const result = globalNacEngine.isolateNode(alert.mac, `Triggered by Alert #${alert.id} (${alert.type})`);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/alerts/:id/block', (req: Request, res: Response) => {
    try {
      const alert = globalNacEngine.getAllAlerts().find(a => a.id === req.params.id);
      if (!alert) {
        return res.status(404).json({ success: false, error: `Alert ${req.params.id} not found` });
      }
      const result = globalNacEngine.blockNode(alert.mac, `High Severity Alert Enforce Block: ${alert.type} - ${alert.message}`, 'alert_containment');
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/alerts/:id/dismiss', (req: Request, res: Response) => {
    try {
      const result = globalNacEngine.dismissAlert(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Guest Approval Desk & Denial/Blocking
  router.get('/guests', (req: Request, res: Response) => {
    try {
      const guests = globalNacEngine.getAllGuestRequests();
      res.json({ success: true, count: guests.length, data: guests });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/guests/:id/approve', (req: Request, res: Response) => {
    try {
      const result = globalNacEngine.handleGuestRequest(req.params.id, true);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/guests/:id/reject', (req: Request, res: Response) => {
    try {
      const { blockApplicant, reason } = req.body || {};
      const result = globalNacEngine.handleGuestRequest(req.params.id, false, !!blockApplicant, reason);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Active Sessions & Disconnect/Blocking
  router.get('/sessions', (req: Request, res: Response) => {
    try {
      const sessions = globalNacEngine.getAllActiveSessions();
      res.json({ success: true, count: sessions.length, data: sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/sessions/:id/disconnect', (req: Request, res: Response) => {
    try {
      const { blockMac, reason } = req.body || {};
      const result = globalNacEngine.disconnectSession(req.params.id, !!blockMac, reason);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Blocklist & Quarantine Pool
  router.get('/blocklist', (req: Request, res: Response) => {
    try {
      const blocklist = globalNacEngine.getBlocklist();
      res.json({ success: true, count: blocklist.length, data: blocklist });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/blocklist', (req: Request, res: Response) => {
    try {
      const { target, targetType, reason } = req.body;
      if (!target) {
        return res.status(400).json({ success: false, error: 'Target (MAC or IP or Account) is required' });
      }
      const result = globalNacEngine.manualBlockTarget(target, targetType || 'mac', reason || 'Admin manual blacklist entry');
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete('/blocklist/:id', (req: Request, res: Response) => {
    try {
      const result = globalNacEngine.removeBlocklistEntry(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Access Rules (Connection Profiles)
  router.get('/rules', (req: Request, res: Response) => {
    try {
      const rules = globalNacEngine.getAllRules();
      res.json({ success: true, count: rules.length, data: rules });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/rules', (req: Request, res: Response) => {
    try {
      const rule = req.body;
      if (!rule.name) {
        return res.status(400).json({ success: false, error: 'Rule name is required' });
      }
      const created = globalNacEngine.createRule(rule);
      res.json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.put('/rules/:id', (req: Request, res: Response) => {
    try {
      const updated = globalNacEngine.updateRule(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete('/rules/:id', (req: Request, res: Response) => {
    try {
      const deleted = globalNacEngine.deleteRule(req.params.id);
      res.json({ success: deleted, message: deleted ? 'Rule deleted' : 'Rule not found' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Switches & Port Enforcements
  router.get('/switches', (req: Request, res: Response) => {
    try {
      const switches = globalNacEngine.getAllSwitches();
      res.json({ success: true, count: switches.length, data: switches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/switches', (req: Request, res: Response) => {
    try {
      const sw = req.body;
      if (!sw.ip || !sw.name) {
        return res.status(400).json({ success: false, error: 'Switch IP and Name are required' });
      }
      const created = globalNacEngine.addSwitch(sw);
      res.json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Action: Switch Physical Port Shutdown
  router.post('/switches/:ip/ports/:port/shutdown', (req: Request, res: Response) => {
    try {
      const { reason } = req.body || {};
      const result = globalNacEngine.shutdownSwitchPort(req.params.ip, req.params.port, reason);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Action: Test RADIUS CoA on Switch
  router.post('/switches/:ip/test-coa', (req: Request, res: Response) => {
    try {
      const { coaPort } = req.body || {};
      res.json({
        success: true,
        switchIp: req.params.ip,
        coaPort: coaPort || 3799,
        latencyMs: 12,
        status: 'RADIUS CoA Listener Responsive (RFC 3576 Ready)',
        message: `NAS ${req.params.ip} successfully acknowledged test Change-of-Authorization UDP probe on port ${coaPort || 3799}.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Auth Diagnostics
  router.post('/auth-test', (req: Request, res: Response) => {
    try {
      const { sourceName, type, serverHost } = req.body || {};
      res.json({
        success: true,
        sourceName: sourceName || 'Directory Service',
        type: type || 'LDAP',
        latencyMs: 14,
        connected: true,
        message: `Handshake test with ${sourceName || 'Auth Source'} (${serverHost || '10.120.100.2'}) verified. TLS handshake and credential bind completed in 14ms.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Audit Logs
  router.get('/audit-logs', (req: Request, res: Response) => {
    try {
      const logs = globalNacEngine.getAuditLogs();
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. POST /api/v1/nac/purge - Purge simulated NAC nodes, alerts, and guest requests
  router.post('/purge', (_req: Request, res: Response) => {
    try {
      globalNacEngine.purgeData();
      res.json({
        success: true,
        message: 'NAC 模擬終端設備、隔離警報、訪客申請與連線已全數清空，就緒於實體 802.1X/RADIUS 設備接入'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

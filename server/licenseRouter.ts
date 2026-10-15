import express, { type Request, type Response } from 'express';
import { globalLicenseEngine, type LicenseTier } from './licenseEngine.ts';
import { globalPlatformPerformanceEngine } from './platformPerformanceEngine.ts';

const Router = express.Router;

export function createLicenseRouter() {
  const router = Router();

  // GET /api/v1/license - Complete license state, hardware info, quotas and entitlements
  router.get('/', (req: Request, res: Response) => {
    try {
      // Opportunistically sync node count with platform performance engine if available
      try {
        const platformNodes = globalPlatformPerformanceEngine.getNodes();
        if (platformNodes && platformNodes.length > 0) {
          // Add estimated endpoints and sensors for total cluster assets
          const totalActive = Math.max(platformNodes.length, 142);
          globalLicenseEngine.syncNodeUsage(totalActive);
        }
      } catch (e) {
        // Platform performance engine optional fallback
      }

      const license = globalLicenseEngine.getLicense();
      const hardware = globalLicenseEngine.getHardwareFingerprint();

      res.json({
        success: true,
        license,
        hardware,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/license/status - Backward-compatible endpoint
  router.get('/status', (req: Request, res: Response) => {
    try {
      const lic = globalLicenseEngine.getLicense();
      res.json({
        success: true,
        licenseKey: lic.licenseKey,
        tier: lic.tierDisplayName,
        organization: lic.customer.organization,
        authorizedNodes: lic.maxNodes,
        activeNodes: lic.currentNodes,
        issuedAt: lic.issuedDate,
        expiresAt: lic.expiryDate,
        daysRemaining: lic.daysRemaining,
        status: lic.status,
        isPerpetual: false,
        features: lic.entitledModules
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/license/activate - Online activation with License Key
  router.post('/activate', (req: Request, res: Response) => {
    try {
      const { licenseKey, operator } = req.body || {};
      if (!licenseKey) {
        return res.status(400).json({ success: false, message: '請提供授權金鑰 (licenseKey)' });
      }

      const result = globalLicenseEngine.activateKey(licenseKey, operator || 'Admin');
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/license/upload - Upload offline .lic certificate file or base64 string
  router.post('/upload', (req: Request, res: Response) => {
    try {
      const { certificateContent, operator } = req.body || {};
      if (!certificateContent) {
        return res.status(400).json({ success: false, message: '請提供離線憑證內容 (certificateContent)' });
      }

      const result = globalLicenseEngine.importOfflineCertificate(certificateContent, operator || 'Admin');
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/license/verify - Cryptographic signature & hardware binding verification
  router.get('/verify', (req: Request, res: Response) => {
    try {
      const result = globalLicenseEngine.verifyIntegrity();
      res.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/license/hardware - Hardware fingerprint & machine binding info
  router.get('/hardware', (req: Request, res: Response) => {
    try {
      const hardware = globalLicenseEngine.getHardwareFingerprint();
      res.json({
        success: true,
        hardware,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/license/renew - Extend expiration date
  router.post('/renew', (req: Request, res: Response) => {
    try {
      const { months = 12, operator } = req.body || {};
      const result = globalLicenseEngine.renewLicense(Number(months) || 12, operator || 'Admin');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/license/upgrade - Upgrade plan tier & quotas
  router.post('/upgrade', (req: Request, res: Response) => {
    try {
      const { tier, maxNodes, operator } = req.body || {};
      if (!tier) {
        return res.status(400).json({ success: false, message: '請指定欲升級之方案等級 (tier)' });
      }
      const result = globalLicenseEngine.upgradeTier(tier as LicenseTier, maxNodes ? Number(maxNodes) : undefined, operator || 'Admin');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/license/sync-nodes - Synchronize node usage
  router.post('/sync-nodes', (req: Request, res: Response) => {
    try {
      let nodeCount = 142;
      try {
        const platformNodes = globalPlatformPerformanceEngine.getNodes();
        if (platformNodes && platformNodes.length > 0) {
          nodeCount = Math.max(platformNodes.length * 15, 142);
        }
      } catch (e) {
        // fallback
      }

      globalLicenseEngine.syncNodeUsage(nodeCount);
      const lic = globalLicenseEngine.getLicense();
      res.json({
        success: true,
        message: `節點額度已成功同步！目前活躍節點: ${lic.currentNodes} / 上限: ${lic.maxNodes}`,
        currentNodes: lic.currentNodes,
        maxNodes: lic.maxNodes,
        nodeBreakdown: lic.nodeBreakdown
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/license/audit-logs - Audit trail of all license operations
  router.get('/audit-logs', (req: Request, res: Response) => {
    try {
      const logs = globalLicenseEngine.getAuditLogs();
      res.json({
        success: true,
        count: logs.length,
        logs,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/license/export - Download signed license certificate file (.lic)
  router.get('/export', (req: Request, res: Response) => {
    try {
      const cert = globalLicenseEngine.exportCertificate();
      res.setHeader('Content-Disposition', `attachment; filename="${cert.filename}"`);
      res.setHeader('Content-Type', 'application/json');
      res.send(cert.rawJson);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/v1/license/export-report - Export compliance audit report in CSV format
  router.get('/export-report', (req: Request, res: Response) => {
    try {
      const lic = globalLicenseEngine.getLicense();
      const logs = globalLicenseEngine.getAuditLogs();

      const csvLines = [
        'SEMOR CYBER DEFENSE PLATFORM - LICENSE COMPLIANCE & AUDIT REPORT',
        `Generated At,${new Date().toISOString()}`,
        `Organization,${lic.customer.organization}`,
        `Department,${lic.customer.department}`,
        `Contract ID,${lic.customer.contractId}`,
        `License Key,${lic.licenseKey}`,
        `Tier,${lic.tierDisplayName}`,
        `Status,${lic.status}`,
        `Issued Date,${lic.issuedDate}`,
        `Expiry Date,${lic.expiryDate}`,
        `Days Remaining,${lic.daysRemaining}`,
        `Max Nodes,${lic.maxNodes}`,
        `Current Active Nodes,${lic.currentNodes}`,
        `Max EPS,${lic.maxEps}`,
        `Current EPS,${lic.currentEps}`,
        `Hardware Fingerprint,${lic.hardwareFingerprint}`,
        `Certificate Serial,${lic.certificateSerial}`,
        `Digital Signature,${lic.digitalSignature}`,
        '',
        '--- AUDIT TRAIL LOGS ---',
        'Log ID,Timestamp,Action,Operator,Status,Details'
      ];

      for (const log of logs) {
        csvLines.push(`"${log.id}","${log.timestamp}","${log.action}","${log.operator}","${log.status}","${log.details.replace(/"/g, '""')}"`);
      }

      res.setHeader('Content-Disposition', `attachment; filename="SEMOR_License_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv"`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.send('\uFEFF' + csvLines.join('\n'));
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/v1/license/reset - Reset to factory default
  router.post('/reset', (req: Request, res: Response) => {
    try {
      const lic = globalLicenseEngine.resetToDefault();
      res.json({
        success: true,
        message: '授權設定已重置為出廠預設值 (企業旗艦版)',
        license: lic
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

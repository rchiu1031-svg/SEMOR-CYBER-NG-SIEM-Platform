import express, { type Request, type Response } from 'express';
import { vulnDetectionEngine } from './vulnDetectionEngine.ts';

const Router = express.Router;

export function createVulnRouter() {
  const router = Router();

  let scanJobs = [
    {
      id: "scan-job-01",
      name: "核心機房伺服器群完整認證弱點掃描 (NVD + OpenCVE + EPSS 聯防檢測)",
      targetScope: "192.168.1.0/24, 10.0.0.0/24",
      scannerEngine: "OpenVAS / Greenbone + Nuclei Engine",
      status: "completed",
      durationSec: 1840,
      scannedHosts: 64,
      vulnsFound: { critical: 4, high: 2, medium: 1, low: 1 },
      completedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: "scan-job-02",
      name: "外部對外服務與 WAF 邊界快照掃描 (EPSS 高危漏洞突擊檢驗)",
      targetScope: "203.0.113.0/28",
      scannerEngine: "ProjectDiscovery Nuclei + OWASP ZAP",
      status: "running",
      durationSec: 420,
      scannedHosts: 12,
      vulnsFound: { critical: 2, high: 1, medium: 0, low: 0 },
      completedAt: null
    }
  ];

  /**
   * GET /api/v1/vuln/cves
   * Get all detected vulnerabilities with NVD, OpenCVE, and EPSS enriched details
   */
  router.get('/cves', (req: Request, res: Response) => {
    const { severity, quadrant, cisaKev, query, assetGroup } = req.query;
    
    const filterObj: any = {};
    if (severity) filterObj.severity = String(severity);
    if (quadrant) filterObj.quadrant = String(quadrant);
    if (cisaKev !== undefined) filterObj.cisaKev = cisaKev === 'true';
    if (query) filterObj.query = String(query);
    if (assetGroup) filterObj.assetGroup = String(assetGroup);

    const list = vulnDetectionEngine.getVulnerabilities(filterObj);

    // Provide both nested and top-level convenient fields for frontend compatibility
    const enrichedList = list.map(v => ({
      ...v,
      cvssScore: v.nvd.cvss.baseScore,
      cvss: v.nvd.cvss,
      epssScore: v.epss.epssScore,
      epssPercentile: v.epss.epssPercentile,
      cweId: v.nvd.cwes[0]?.id || 'CWE-Unknown',
      cweName: v.nvd.cwes[0]?.name || '',
      affectedProduct: `${v.openCve.vendor} ${v.openCve.product}`,
      openCveAlertId: v.openCve.alertId,
      threatActors: v.openCve.threatActors,
      threatTags: v.openCve.threatTags,
      pocAvailable: v.openCve.pocAvailable,
      inTheWildExploited: v.openCve.inTheWildExploit
    }));

    res.json({ success: true, count: enrichedList.length, cves: enrichedList });
  });

  /**
   * GET /api/v1/vuln/cves/:id
   * Get single vulnerability by CVE ID or ID
   */
  router.get('/cves/:id', (req: Request, res: Response) => {
    const item = vulnDetectionEngine.getVulnerabilityById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: `找不到弱點: ${req.params.id}` });
    }
    res.json({ success: true, vulnerability: item });
  });

  /**
   * GET /api/v1/vuln/stats
   * Aggregated statistics across NVD, OpenCVE, and EPSS
   */
  router.get('/stats', (req: Request, res: Response) => {
    const stats = vulnDetectionEngine.getStatsSummary();
    res.json({
      success: true,
      ...stats
    });
  });

  /**
   * GET /api/v1/vuln/matrix
   * EPSS vs CVSS Prioritization Matrix and Scatter Points
   */
  router.get('/matrix', (req: Request, res: Response) => {
    const matrix = vulnDetectionEngine.getEpssCvssMatrix();
    res.json({ success: true, matrix });
  });

  /**
   * GET /api/v1/vuln/opencve/alerts
   * OpenCVE platform threat alerts & vendor subscriptions
   */
  router.get('/opencve/alerts', (req: Request, res: Response) => {
    const alerts = vulnDetectionEngine.getOpenCveThreatFeed();
    res.json({ success: true, ...alerts });
  });

  /**
   * POST /api/v1/vuln/analyze-cve
   * Live lookup & deep comparative correlation for any arbitrary CVE
   */
  router.post('/analyze-cve', async (req: Request, res: Response) => {
    const { cveId } = req.body;
    if (!cveId || typeof cveId !== 'string') {
      return res.status(400).json({ success: false, message: '請提供有效的 CVE 編號 (例如 CVE-2024-21413)' });
    }

    try {
      const result = await vulnDetectionEngine.analyzeArbitraryCve(cveId);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: '比對分析發生錯誤', error: err?.message || String(err) });
    }
  });

  /**
   * POST /api/v1/vuln/detect
   * Trigger on-demand asset vulnerability detection and cross-correlation
   */
  router.post('/detect', (req: Request, res: Response) => {
    const { targetScope } = req.body;
    const scanReport = vulnDetectionEngine.runAssetDetectionScan(targetScope || '192.168.0.0/16');

    // Also register into scanJobs list
    scanJobs.unshift({
      id: scanReport.scanId,
      name: `即時資產弱點偵測與三方情資比對 [${scanReport.targetScope}]`,
      targetScope: scanReport.targetScope,
      scannerEngine: 'SEMOR NVD+OpenCVE+EPSS Correlation Engine',
      status: 'completed',
      durationSec: 15,
      scannedHosts: scanReport.hostsScanned,
      vulnsFound: {
        critical: scanReport.newFindings.filter(f => f.severity === 'Critical').length,
        high: scanReport.newFindings.filter(f => f.severity === 'High').length,
        medium: scanReport.newFindings.filter(f => f.severity === 'Medium').length,
        low: scanReport.newFindings.filter(f => f.severity === 'Low').length
      },
      completedAt: new Date().toISOString()
    });

    res.json({ success: true, report: scanReport });
  });

  /**
   * POST /api/v1/vuln/sync-threat-intel
   * Synchronize threat feed sources (NVD API 2.0, OpenCVE, FIRST.org EPSS)
   */
  router.post('/sync-threat-intel', (req: Request, res: Response) => {
    const updatedStatuses = vulnDetectionEngine.syncThreatIntel();
    res.json({
      success: true,
      message: 'NVD、OpenCVE 威脅平台與 FIRST.org EPSS 利用率評分庫已成功同步更新！',
      feedStatuses: updatedStatuses
    });
  });

  /**
   * POST /api/v1/vuln/remediate
   * Apply defense mitigation, virtual patching, or status update
   */
  router.post('/remediate', (req: Request, res: Response) => {
    const { cveId, action } = req.body;
    if (!cveId || !action) {
      return res.status(400).json({ success: false, message: '缺少 cveId 或 action 參數' });
    }

    const result = vulnDetectionEngine.applyRemediation(cveId, action);
    res.json(result);
  });

  /**
   * GET /api/v1/vuln/scans
   */
  router.get('/scans', (req: Request, res: Response) => {
    res.json({ success: true, count: scanJobs.length, scans: scanJobs });
  });

  /**
   * POST /api/v1/vuln/scans
   */
  router.post('/scans', (req: Request, res: Response) => {
    const { name, targetScope, scannerEngine } = req.body;
    const newScan = {
      id: `scan-job-${Date.now().toString().slice(-4)}`,
      name: name || "即時自訂資安弱點排查任務",
      targetScope: targetScope || "192.168.1.0/24",
      scannerEngine: scannerEngine || "Nuclei + OpenVAS Core",
      status: "running",
      durationSec: 1,
      scannedHosts: 0,
      vulnsFound: { critical: 0, high: 0, medium: 0, low: 0 },
      completedAt: null
    };

    scanJobs.unshift(newScan);
    res.json({ success: true, message: `掃描任務 '${newScan.name}' 已成功派發至排程引擎`, scan: newScan });
  });

  /**
   * GET /api/v1/vuln/vans-compliance
   */
  router.get('/vans-compliance', (req: Request, res: Response) => {
    const currentVulns = vulnDetectionEngine.getVulnerabilities();
    res.json({
      success: true,
      agencyCode: "GOV-SEC-TW-8841",
      vansSyncStatus: "ONLINE_SYNCHRONIZED",
      lastSyncTimestamp: new Date().toISOString(),
      pendingMitigationsCount: currentVulns.filter(v => v.status === 'Unpatched').length,
      guidelineStandard: "行政院國家資通安全會報技術服務中心 (NCCST) VANS 規範",
      cveLedger: currentVulns.map(c => ({
        cveId: c.cveId,
        title: c.title,
        vansStatus: c.vansStatus,
        complianceDeadline: c.slaDeadline,
        verifiedBy: c.assignedEngineer
      }))
    });
  });

  // Purge simulated scan jobs and reports for clean environment
  router.post('/purge-jobs', (_req: Request, res: Response) => {
    scanJobs = [];
    res.json({
      success: true,
      message: '弱點掃描工作與歷史報告已全數清空'
    });
  });

  return router;
}


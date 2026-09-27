import { Router, Request, Response } from 'express';

export function createVulnRouter() {
  const router = Router();

  let cves = [
    {
      cveId: "CVE-2024-21413",
      title: "Microsoft Outlook Moniker Link Remote Code Execution (MonikerLink)",
      cvss: 9.8,
      severity: "CRITICAL",
      epssScore: 0.942, // High exploit in wild probability
      cisaKev: true,
      affectedProduct: "Microsoft Outlook 2016 / 2019 / 365 Apps",
      affectedAssetsCount: 18,
      patchStatus: "Patch Available (KB5035853)",
      vansStatus: "REPORTED_TO_TWCERT",
      description: "攻擊者可構造包含 file:/// 協議 Moniker 特殊超鏈接繞過 Office 受保護檢視，在無使用者警示下直接執行遠端任意指令。"
    },
    {
      cveId: "CVE-2024-21887",
      title: "Ivanti Connect Secure / Policy Secure Command Injection",
      cvss: 9.1,
      severity: "CRITICAL",
      epssScore: 0.985,
      cisaKev: true,
      affectedProduct: "Ivanti Connect Secure VPN (ICS)",
      affectedAssetsCount: 2,
      patchStatus: "Mitigated via XML Workaround",
      vansStatus: "COMPLIANT_MITIGATED",
      description: "在 web 元件中未經身分驗證之遠端攻擊者可透過特定請求參數注入並以 root 權限執行任意系統指令。"
    },
    {
      cveId: "CVE-2017-0144",
      title: "Microsoft Windows SMBv1 Remote Code Execution (EternalBlue)",
      cvss: 9.8,
      severity: "CRITICAL",
      epssScore: 0.974,
      cisaKev: true,
      affectedProduct: "Microsoft Windows SMBv1 Server",
      affectedAssetsCount: 1,
      patchStatus: "Remediated (SMBv1 Disabled)",
      vansStatus: "COMPLIANT_RESOLVED",
      description: "Srv!SrvOs2FeaToNt 處理 SMBv1 擴充屬性時存在緩衝區溢位，導致遠端代碼執行。"
    }
  ];

  let scanJobs = [
    {
      id: "scan-job-01",
      name: "核心機房伺服器群完整認證弱點掃描",
      targetScope: "192.168.1.0/24, 10.0.0.0/24",
      scannerEngine: "OpenVAS / Greenbone + Nuclei Engine",
      status: "completed",
      durationSec: 1840,
      scannedHosts: 64,
      vulnsFound: { critical: 3, high: 8, medium: 15, low: 24 },
      completedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: "scan-job-02",
      name: "外部對外服務與 WAF 邊界快照掃描",
      targetScope: "203.0.113.0/28",
      scannerEngine: "ProjectDiscovery Nuclei + OWASP ZAP",
      status: "running",
      durationSec: 420,
      scannedHosts: 12,
      vulnsFound: { critical: 0, high: 1, medium: 4, low: 8 },
      completedAt: null
    }
  ];

  router.get('/cves', (req: Request, res: Response) => {
    const { severity, cisaKev, query } = req.query;
    let list = [...cves];
    if (severity && severity !== 'all') list = list.filter(c => c.severity.toLowerCase() === String(severity).toLowerCase());
    if (cisaKev === 'true') list = list.filter(c => c.cisaKev === true);
    if (query) {
      const q = String(query).toLowerCase();
      list = list.filter(c => c.cveId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.affectedProduct.toLowerCase().includes(q));
    }

    res.json({ success: true, count: list.length, cves: list });
  });

  router.get('/stats', (req: Request, res: Response) => {
    res.json({
      success: true,
      totalVulnerabilities: 48,
      severityBreakdown: { critical: 4, high: 12, medium: 18, low: 14 },
      cisaKevCount: 3,
      slaComplianceRatePct: 94.5,
      vansReportedPct: 100.0,
      unpatchedAssetsTotal: 5
    });
  });

  router.get('/scans', (req: Request, res: Response) => {
    res.json({ success: true, count: scanJobs.length, scans: scanJobs });
  });

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

  router.get('/vans-compliance', (req: Request, res: Response) => {
    res.json({
      success: true,
      agencyCode: "GOV-SEC-TW-8841",
      vansSyncStatus: "ONLINE_SYNCHRONIZED",
      lastSyncTimestamp: new Date().toISOString(),
      pendingMitigationsCount: 1,
      guidelineStandard: "行政院國家資通安全會報技術服務中心 (NCCST) VANS 規範",
      cveLedger: cves.map(c => ({
        cveId: c.cveId,
        vansStatus: c.vansStatus,
        complianceDeadline: "2026-10-15T00:00:00Z",
        verifiedBy: "Alex Chen (CISO)"
      }))
    });
  });

  return router;
}

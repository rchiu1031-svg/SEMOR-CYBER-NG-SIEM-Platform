import express, { type Request, type Response } from 'express';
const Router = express.Router;

export function createFimRouter() {
  const router = Router();

  let monitoredPaths = [
    {
      id: "fim-path-01",
      path: "/etc/passwd",
      os: "Linux",
      host: "edge-gateway-01",
      expectedSha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      currentSha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      status: "intact",
      lastChecked: new Date().toISOString()
    },
    {
      id: "fim-path-02",
      path: "/etc/shadow",
      os: "Linux",
      host: "edge-gateway-01",
      expectedSha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      currentSha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      status: "intact",
      lastChecked: new Date().toISOString()
    },
    {
      id: "fim-path-03",
      path: "C:\\Windows\\System32\\vssadmin.exe",
      os: "Windows",
      host: "HR-DESKTOP-09",
      expectedSha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      currentSha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      status: "tamper_attempt_prevented",
      lastChecked: new Date().toISOString()
    },
    {
      id: "fim-path-04",
      path: "/var/log/suricata/eve.json",
      os: "Linux",
      host: "edge-gateway-01",
      expectedSha256: "DYNAMIC",
      currentSha256: "DYNAMIC",
      status: "active_stream",
      lastChecked: new Date().toISOString()
    }
  ];

  let fimEvents = [
    {
      id: "fim-evt-101",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      host: "HR-DESKTOP-09",
      filePath: "C:\\Windows\\System32\\vssadmin.exe",
      eventType: "EXECUTION_WITH_TAMPER_PARAM",
      severity: "Critical",
      processUser: "hr_admin",
      commandLine: "vssadmin.exe delete shadows /all /quiet",
      sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      baselineDiff: "Process invoked with shadow deletion argument (Ransomware Preparation)",
      actionTaken: "Execution Blocked & Mother Process Terminated"
    },
    {
      id: "fim-evt-102",
      timestamp: new Date(Date.now() - 7200000 * 2).toISOString(),
      host: "edge-gateway-01",
      filePath: "/etc/ssh/sshd_config",
      eventType: "FILE_MODIFIED",
      severity: "High",
      processUser: "root",
      commandLine: "sed -i 's/PermitRootLogin no/PermitRootLogin yes/g' /etc/ssh/sshd_config",
      sha256: "8b12f45ea20909c0aa39029199a03982",
      baselineDiff: "PermitRootLogin toggled from NO to YES",
      actionTaken: "Security Alert Logged & SOC Verification Required"
    }
  ];

  router.get('/monitored-paths', (req: Request, res: Response) => {
    res.json({ success: true, count: monitoredPaths.length, paths: monitoredPaths });
  });

  router.post('/monitored-paths', (req: Request, res: Response) => {
    const { path, host, os } = req.body;
    if (!path) {
      return res.status(400).json({ error: 'path is required' });
    }

    const newPath = {
      id: `fim-path-${Date.now().toString().slice(-4)}`,
      path,
      os: os || "Linux",
      host: host || "all-managed-hosts",
      expectedSha256: `sha256:${Buffer.from(path).toString('hex').padEnd(64, 'a').slice(0, 64)}`,
      currentSha256: `sha256:${Buffer.from(path).toString('hex').padEnd(64, 'a').slice(0, 64)}`,
      status: "intact",
      lastChecked: new Date().toISOString()
    };

    monitoredPaths.unshift(newPath);
    res.json({ success: true, message: `路徑 ${path} 已納入 FIM 完整性基準監控`, path: newPath });
  });

  router.get('/events', (req: Request, res: Response) => {
    res.json({ success: true, count: fimEvents.length, events: fimEvents });
  });

  router.post('/accept-baseline', (req: Request, res: Response) => {
    const { pathId, newSha256 } = req.body;
    const item = monitoredPaths.find(p => p.id === pathId);
    if (item) {
      item.expectedSha256 = newSha256 || item.currentSha256;
      item.status = "intact";
      item.lastChecked = new Date().toISOString();
    }

    res.json({ success: true, message: '已承認檔案變更並將當前特徵更新為正式合規基準', path: item });
  });

  return router;
}

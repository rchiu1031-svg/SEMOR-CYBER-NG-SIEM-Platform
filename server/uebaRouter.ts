import express, { type Request, type Response } from 'express';
const Router = express.Router;

export function createUebaRouter() {
  const router = Router();

  let userProfiles = [
    {
      userId: "u-victim",
      username: "victim_user",
      department: "Finance & Accounting",
      riskScore: 94,
      riskLevel: "CRITICAL",
      peerGroup: "Finance Analysts",
      anomaliesCount: 4,
      baselineDeviationPct: 380,
      anomalies: [
        { type: "PROCESS_INJECTION", desc: "主機偵測到調用 powershell 啟動 mimikatz 訪問記憶體憑證", severity: "Critical", time: new Date(Date.now() - 3600000 * 3).toISOString() },
        { type: "MASS_FILE_ACCESS", desc: "於非工作時段 (02:15 AM) 密集存取超過 450 筆財務報表 PDF", severity: "High", time: new Date(Date.now() - 3600000 * 8).toISOString() }
      ],
      watchlist: true,
      lastActive: new Date().toISOString()
    },
    {
      userId: "u-eng",
      username: "eng_chen",
      department: "Software Engineering",
      riskScore: 78,
      riskLevel: "HIGH",
      peerGroup: "Core R&D Developers",
      anomaliesCount: 2,
      baselineDeviationPct: 180,
      anomalies: [
        { type: "DNS_TUNNEL_EXFILTRATION", desc: "本地裝置產生大量高長度 base64 DNS 查詢", severity: "High", time: new Date(Date.now() - 3600000 * 5).toISOString() }
      ],
      watchlist: true,
      lastActive: new Date().toISOString()
    },
    {
      userId: "u-hr",
      username: "hr_admin",
      department: "Human Resources",
      riskScore: 82,
      riskLevel: "HIGH",
      peerGroup: "HR Specialists",
      anomaliesCount: 3,
      baselineDeviationPct: 220,
      anomalies: [
        { type: "DEFENSE_TAMPERING", desc: "執行 vssadmin delete shadows 破壞系統還原點", severity: "Critical", time: new Date(Date.now() - 3600000 * 10).toISOString() }
      ],
      watchlist: true,
      lastActive: new Date().toISOString()
    },
    {
      userId: "u-admin",
      username: "administrator",
      department: "IT Infrastructure",
      riskScore: 35,
      riskLevel: "LOW",
      peerGroup: "Domain Admins",
      anomaliesCount: 0,
      baselineDeviationPct: 12,
      anomalies: [],
      watchlist: false,
      lastActive: new Date().toISOString()
    }
  ];

  router.get('/users', (req: Request, res: Response) => {
    const { minRisk, department, watchlist } = req.query;
    let list = [...userProfiles];
    if (minRisk) list = list.filter(u => u.riskScore >= Number(minRisk));
    if (department) list = list.filter(u => u.department.includes(String(department)));
    if (watchlist === 'true') list = list.filter(u => u.watchlist === true);

    res.json({ success: true, count: list.length, users: list });
  });

  router.get('/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const user = userProfiles.find(u => u.userId === id || u.username === id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({ success: true, user });
  });

  router.post('/watchlist', (req: Request, res: Response) => {
    const { username, enable, reason } = req.body;
    const user = userProfiles.find(u => u.username === username || u.userId === username);
    if (user) {
      user.watchlist = enable !== false;
    }

    res.json({
      success: true,
      message: `使用者 ${username} 特殊行為觀察名單狀態已設定為: ${enable !== false ? '加入高風險觀察名單' : '解除名單'}`,
      user
    });
  });

  router.get('/anomalies', (req: Request, res: Response) => {
    const allAnomalies = userProfiles.flatMap(u => 
      u.anomalies.map(a => ({ ...a, username: u.username, department: u.department, riskScore: u.riskScore }))
    );
    res.json({ success: true, count: allAnomalies.length, anomalies: allAnomalies });
  });

  return router;
}

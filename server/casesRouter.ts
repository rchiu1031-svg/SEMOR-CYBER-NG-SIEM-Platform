import express, { type Request, type Response } from 'express';
const Router = express.Router;

export function createCasesRouter() {
  const router = Router();

  let cases = [
    {
      id: "CASE-2026-081",
      title: "DC01 網域控制站 SMB 遠端漏洞探測與防禦調查案",
      severity: "CRITICAL",
      status: "WAR_ROOM_ACTIVE" as "NEW" | "IN_PROGRESS" | "WAR_ROOM_ACTIVE" | "RESOLVED" | "CLOSED",
      priority: "P1",
      leadAnalyst: "Alex Chen (Tier 3 Lead)",
      assignedTeam: "CSIRT Emergency Response Team",
      openedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 300000).toISOString(),
      slaDeadline: new Date(Date.now() + 3600000 * 2).toISOString(),
      slaStatus: "ON_TRACK",
      evidence: [
        { id: "ev-01", name: "dc01_smb_capture.pcapng", type: "Network Packet Trace", hash: "e3b0c442..." },
        { id: "ev-02", name: "firewall_deny_audit.log", type: "Perimeter Syslog Log", hash: "9f86d081..." }
      ],
      checklist: [
        { id: "chk-1", title: "確認邊界防火牆是否阻斷 10.88.14.92 連線", completed: true },
        { id: "chk-2", title: "檢查 DC01 登錄檔 SMBv1 停用鍵值", completed: true },
        { id: "chk-3", title: "全網弱點掃描排查是否尚有其他未修補 SMB 主機", completed: true },
        { id: "chk-4", title: "撰寫資安事件鑑識分析結案報告", completed: false }
      ],
      notesCount: 8,
      summary: "邊界防禦與內部 EDR 聯防處置中，目前未發現橫向擴散痕跡，待完成全盤掃描後結案。"
    },
    {
      id: "CASE-2026-082",
      title: "財務主機 Mimikatz 提取記憶體憑證行為調查案",
      severity: "CRITICAL",
      status: "IN_PROGRESS",
      priority: "P1",
      leadAnalyst: "Sarah Lin (Forensics Specialist)",
      assignedTeam: "Endpoint Security Unit",
      openedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 1200000).toISOString(),
      slaDeadline: new Date(Date.now() + 3600000 * 4).toISOString(),
      slaStatus: "ON_TRACK",
      evidence: [
        { id: "ev-03", name: "finance_pc03_memory.raw", type: "RAM Dump", hash: "5e884898..." }
      ],
      checklist: [
        { id: "chk-5", title: "終止 Mimikatz 及關聯 PowerShell 母行程", completed: true },
        { id: "chk-6", title: "實施 802.1X NAC 隔離主機至 VLAN 999", completed: true },
        { id: "chk-7", title: "強制重設被竊取之使用者與特權密碼", completed: true },
        { id: "chk-8", title: "執行端點全磁碟離線鑑識與重灌還原", completed: false }
      ],
      notesCount: 5,
      summary: "端點防護已生效，受影響財務人員帳號均已重設，刻正進行離線深層磁碟掃毒。"
    }
  ];

  router.get('/', (req: Request, res: Response) => {
    const { status, severity, priority } = req.query;
    let list = [...cases];
    if (status && status !== 'ALL') list = list.filter(c => c.status === status);
    if (severity && severity !== 'ALL') list = list.filter(c => c.severity === severity);
    if (priority && priority !== 'ALL') list = list.filter(c => c.priority === priority);

    res.json({ success: true, count: list.length, cases: list });
  });

  router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = cases.find(c => c.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json({ success: true, caseItem: item });
  });

  router.post('/', (req: Request, res: Response) => {
    const { title, severity, priority, leadAnalyst, summary } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const newCase = {
      id: `CASE-2026-${String(cases.length + 83).padStart(3, '0')}`,
      title,
      severity: severity || "HIGH",
      status: "NEW" as const,
      priority: priority || "P2",
      leadAnalyst: leadAnalyst || "Alex Chen (Tier 3 Lead)",
      assignedTeam: "CSIRT Emergency Response Team",
      openedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 3600000 * 24).toISOString(),
      slaStatus: "ON_TRACK",
      evidence: [],
      checklist: [
        { id: "chk-auto-1", title: "初步異常連線日誌留存與證據封裝", completed: true },
        { id: "chk-auto-2", title: "確認受影響資產是否需緊急網路隔離", completed: false },
        { id: "chk-auto-3", title: "執行根因追溯 (RCA) 與影響面評估", completed: false }
      ],
      notesCount: 0,
      summary: summary || "SOC 自動立案調查案件"
    };

    cases.unshift(newCase);
    res.json({ success: true, message: `案件 ${newCase.id} 已正式立案建立`, caseItem: newCase });
  });

  router.patch('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = cases.find(c => c.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Case not found' });
    }

    Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
    res.json({ success: true, message: `案件 ${id} 資料已更新`, caseItem: item });
  });

  router.post('/:id/evidence', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = cases.find(c => c.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const { name, type, hash } = req.body;
    const evidenceItem = {
      id: `ev-${Date.now().toString().slice(-4)}`,
      name: name || "evidence.raw",
      type: type || "Evidence Artifact",
      hash: hash || `sha256:${Buffer.from(String(Date.now())).toString('hex').padEnd(64, '9').slice(0, 64)}`
    };

    item.evidence.push(evidenceItem);
    item.updatedAt = new Date().toISOString();

    res.json({ success: true, message: `證據 ${evidenceItem.name} 已成功存入案件證據庫`, evidenceItem });
  });

  return router;
}

import { Router, Request, Response } from 'express';

export function createIncidentsRouter() {
  const router = Router();

  let criticalIncidents = [
    {
      id: "INC-2026-0901",
      title: "核心網域控制站 (DC-01) 遭受 EternalBlue SMB 遠端服務橫向入侵",
      severity: "Critical",
      status: "Investigating" as "New" | "Investigating" | "Contained" | "Remediated" | "Closed",
      priority: "P1",
      assignee: "Alex Chen (Tier 3 Lead)",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 600000).toISOString(),
      sourceIp: "10.88.14.92",
      targetIp: "192.168.1.100",
      mitreTechnique: "T1210 - Exploitation of Remote Services",
      mitreTactic: "Lateral Movement",
      cve: "CVE-2017-0144",
      evidenceCount: 14,
      mttdSec: 42,
      mttrSec: 0,
      description: "防火牆與 IDS 攔截到來源 10.88.14.92 對 DC01 445 埠發起格式異常之 SMBv1 封包，觸發 MS17-010 漏洞利用特徵。已通報 SOC 應變小組介入。",
      attackTree: {
        rootGoal: "獲得網域最高控制權 (Domain Compromise)",
        nodes: [
          { id: "node-1", label: "突破邊界獲取內網跳板", status: "completed", technique: "T1190" },
          { id: "node-2", label: "內網橫向 SMBv1 探測 (Port 445)", status: "blocked", technique: "T1210" },
          { id: "node-3", label: "竊取 NTDS.dit 網域密碼雜湊", status: "prevented", technique: "T1003.003" },
          { id: "node-4", label: "部署 Golden Ticket 持久化", status: "prevented", technique: "T1558.001" }
        ]
      }
    },
    {
      id: "INC-2026-0902",
      title: "財務主機 Mimikatz 提取記憶體密碼憑證行為",
      severity: "Critical",
      status: "Contained",
      priority: "P1",
      assignee: "Sarah Lin (Forensics Specialist)",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 1200000).toISOString(),
      sourceIp: "10.0.4.15",
      targetIp: "10.0.4.15",
      mitreTechnique: "T1003.001 - LSASS Memory",
      mitreTactic: "Credential Access",
      cve: "N/A",
      evidenceCount: 8,
      mttdSec: 15,
      mttrSec: 180,
      description: "端點 EDR 攔截 powershell.exe 調用 mimikatz.exe sekurlsa::logonpasswords 讀取 LSASS 記憶體，程序已遭強制終止，主機已隔離。",
      attackTree: {
        rootGoal: "竊取特權管理員明文密碼",
        nodes: [
          { id: "node-1", label: "釣魚郵件巨集誘騙執行", status: "completed", technique: "T1566" },
          { id: "node-2", label: "繞過 UAC 提權為 SYSTEM", status: "completed", technique: "T1548.002" },
          { id: "node-3", label: "讀取 LSASS 行程記憶體", status: "blocked", technique: "T1003.001" }
        ]
      }
    },
    {
      id: "INC-2026-0903",
      title: "研發 Mac 設備建立隱蔽 DNS C2 隧道",
      severity: "High",
      status: "Investigating",
      priority: "P2",
      assignee: "David Wu (Network Security)",
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      sourceIp: "10.0.12.44",
      targetIp: "8.8.8.8",
      mitreTechnique: "T1071.004 - DNS",
      mitreTactic: "Command and Control",
      cve: "N/A",
      evidenceCount: 6,
      mttdSec: 68,
      mttrSec: 0,
      description: "Palo Alto NGFW 發現異常長度的 base64 子域名頻繁發送至 8.8.8.8，特徵吻合 DNS Tunneling C2 惡意回傳，已實施邊界阻擋。",
      attackTree: {
        rootGoal: "繞過防火牆外洩敏感原始碼",
        nodes: [
          { id: "node-1", label: "惡意開源套件依賴混淆", status: "completed", technique: "T1195.001" },
          { id: "node-2", label: "編碼原始碼片段至 DNS TXT 查詢", status: "blocked", technique: "T1071.004" }
        ]
      }
    }
  ];

  router.get('/', (req: Request, res: Response) => {
    const { status, severity } = req.query;
    let list = [...criticalIncidents];
    if (status && status !== 'all') list = list.filter(i => i.status.toLowerCase() === String(status).toLowerCase());
    if (severity && severity !== 'all') list = list.filter(i => i.severity.toLowerCase() === String(severity).toLowerCase());

    res.json({ success: true, count: list.length, incidents: list });
  });

  router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ success: true, incident: item });
  });

  router.patch('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
    res.json({ success: true, message: `事件 ${id} 狀態已更新`, incident: item });
  });

  router.post('/', (req: Request, res: Response) => {
    const { title, severity, priority, sourceIp, targetIp, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const newInc = {
      id: `INC-2026-${Date.now().toString().slice(-4)}`,
      title,
      severity: severity || "High",
      status: "New" as const,
      priority: priority || "P2",
      assignee: "Unassigned (SOC Triage)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceIp: sourceIp || "0.0.0.0",
      targetIp: targetIp || "0.0.0.0",
      mitreTechnique: "T1046 - Network Discovery",
      mitreTactic: "Discovery",
      cve: "N/A",
      evidenceCount: 1,
      mttdSec: 30,
      mttrSec: 0,
      description: description || "SOC 系統自動立案之嚴重安全威脅事件。",
      attackTree: {
        rootGoal: title,
        nodes: [{ id: "node-1", label: "初步異常連線觸發", status: "investigating", technique: "T1046" }]
      }
    };

    criticalIncidents.unshift(newInc);
    res.json({ success: true, message: '事件立案成功', incident: newInc });
  });

  router.get('/:id/attack-tree', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ success: true, attackTree: item.attackTree });
  });

  return router;
}

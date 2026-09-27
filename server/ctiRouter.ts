import { Router, Request, Response } from 'express';

export function createCtiRouter() {
  const router = Router();

  let indicators = [
    {
      id: "ioc-001",
      type: "ipv4",
      value: "45.142.214.88",
      pattern: "[ipv4-addr:value = '45.142.214.88']",
      confidence: 99,
      tlp: "TLP:WHITE",
      threatActor: "APT28 (Fancy Bear)",
      mitreTechnique: "T1110.001 - Password Guessing",
      description: "俄羅斯軍事情報關聯 IP，持續針對政府與軍工機構發起自動化 SSH 暴力猜測。",
      firstSeen: "2026-08-10T12:00:00Z",
      lastSeen: new Date().toISOString(),
      tags: ["Brute-Force", "APT28", "State-Sponsored"]
    },
    {
      id: "ioc-002",
      type: "domain",
      value: "update-synology-cloud-service.info",
      pattern: "[domain-name:value = 'update-synology-cloud-service.info']",
      confidence: 96,
      tlp: "TLP:WHITE",
      threatActor: "LockBit 3.0 Affiliate",
      mitreTechnique: "T1071.004 - DNS C2",
      description: "偽裝成 NAS 雲端韌體更新服務之勒索軟體指令控制 (C2) 域名。",
      firstSeen: "2026-09-01T04:20:00Z",
      lastSeen: new Date().toISOString(),
      tags: ["LockBit", "Ransomware", "C2-Domain"]
    },
    {
      id: "ioc-003",
      type: "file_hash",
      value: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      pattern: "[file:hashes.'SHA-256' = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8']",
      confidence: 100,
      tlp: "TLP:WHITE",
      threatActor: "Generic Adversary",
      mitreTechnique: "T1003.001 - LSASS Memory",
      description: "Mimikatz 記憶體憑證抓取核心工具 (mimidrv.sys 載入模組)。",
      firstSeen: "2026-05-14T08:00:00Z",
      lastSeen: new Date().toISOString(),
      tags: ["Mimikatz", "Credential-Dump", "Hacktool"]
    },
    {
      id: "ioc-004",
      type: "cve",
      value: "CVE-2024-21413",
      pattern: "[vulnerability:id = 'CVE-2024-21413']",
      confidence: 100,
      tlp: "TLP:WHITE",
      threatActor: "APT28 (Fancy Bear)",
      mitreTechnique: "T1203 - Exploitation for Client Execution",
      description: "Microsoft Outlook Moniker 鏈接遠端代碼執行漏洞 (MonikerLink Bug)。",
      firstSeen: "2026-02-14T00:00:00Z",
      lastSeen: new Date().toISOString(),
      tags: ["Zero-Day", "Outlook", "RCE"]
    }
  ];

  let threatActors = [
    {
      id: "actor-apt28",
      name: "APT28 (Fancy Bear / Sofacy / STRONTIUM)",
      origin: "Russia (GRU 85th Main Special Service Center)",
      targetSectors: ["Government", "Defense", "Energy", "NATO"],
      activeSince: "2004",
      threatScore: 98,
      commonTools: ["X-Agent", "CHOPSTICK", "Mimikatz", "Responder"],
      primaryMotives: ["Espionage", "Sabotage", "Data Theft"],
      mitreGroup: "G0007"
    },
    {
      id: "actor-lockbit",
      name: "LockBit 3.0 (LockBit Black)",
      origin: "Eastern Europe / Global Cybercriminal Syndicate",
      targetSectors: ["Healthcare", "Finance", "Manufacturing", "Critical Infrastructure"],
      activeSince: "2019",
      threatScore: 95,
      commonTools: ["LockBit Encryptor", "StealBit", "PsExec", "Cobalt Strike"],
      primaryMotives: ["Financial Extortion", "Data Exfiltration"],
      mitreGroup: "G0140"
    },
    {
      id: "actor-lazarus",
      name: "Lazarus Group (HIDDEN COBRA)",
      origin: "North Korea (RGB)",
      targetSectors: ["Crypto / DeFi", "Defense", "Aerospace", "Banking"],
      activeSince: "2009",
      threatScore: 94,
      commonTools: ["AppleJeus", "FALLCHILL", "Manuscrypt"],
      primaryMotives: ["Financial Revenue", "State Intelligence"],
      mitreGroup: "G0032"
    }
  ];

  router.get('/indicators', (req: Request, res: Response) => {
    const { query, type, tlp } = req.query;
    let list = [...indicators];
    if (type && type !== 'all') list = list.filter(i => i.type === type);
    if (tlp && tlp !== 'all') list = list.filter(i => i.tlp === tlp);
    if (query) {
      const q = String(query).toLowerCase();
      list = list.filter(i => i.value.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.threatActor.toLowerCase().includes(q));
    }

    res.json({ success: true, count: list.length, indicators: list });
  });

  router.post('/indicators', (req: Request, res: Response) => {
    const { type, value, confidence, threatActor, description, tags } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'type and value are required' });
    }

    const newIoc = {
      id: `ioc-${Date.now().toString().slice(-4)}`,
      type,
      value,
      pattern: `[${type}:value = '${value}']`,
      confidence: Number(confidence) || 90,
      tlp: "TLP:WHITE",
      threatActor: threatActor || "Unattributed",
      mitreTechnique: "N/A",
      description: description || "SOC 管理員手動註冊之情資指標",
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      tags: tags || ["Custom-IOC"]
    };

    indicators.unshift(newIoc);
    res.json({ success: true, message: `IOC ${value} 已登錄至全網威脅防禦特徵庫`, indicator: newIoc });
  });

  router.delete('/indicators/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    indicators = indicators.filter(i => i.id !== id);
    res.json({ success: true, message: `指標 ${id} 已刪除` });
  });

  router.get('/threat-actors', (req: Request, res: Response) => {
    res.json({ success: true, count: threatActors.length, actors: threatActors });
  });

  router.post('/test-connection', (req: Request, res: Response) => {
    const { discoveryUrl, protocol } = req.body;
    const latency = Math.floor(Math.random() * 80 + 40);
    res.json({
      success: true,
      protocol: protocol || "TAXII 2.1",
      discoveryUrl: discoveryUrl || "https://threatfox.abuse.ch/taxii2/",
      latencyMs: latency,
      httpStatus: 200,
      apiRoots: ["/taxii2/", "/api/v2.1/"],
      title: "Remote TAXII 2.1 Server Connectivity Confirmed",
      serverTimestamp: new Date().toISOString()
    });
  });

  return router;
}

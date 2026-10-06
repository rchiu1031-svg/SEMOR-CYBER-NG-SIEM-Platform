import express, { type Request, type Response } from 'express';
const Router = express.Router;

export function createForensicsRouter() {
  const router = Router();

  let artifacts = [
    {
      id: "art-001",
      name: "dc01_smb_attack_capture.pcapng",
      type: "Network PCAP Packet Dump",
      fileSizeMB: 48.2,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      acquiredFrom: "sw-core-01 (SPAN Port 445)",
      acquiredBy: "Sarah Lin (Forensics Lead)",
      acquiredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      verifiedIntegrity: true,
      notes: "包含來源 10.88.14.92 對 DC01 完整 SMB 握手與 CVE-2017-0144 畸形封包原始二進位流。"
    },
    {
      id: "art-002",
      name: "finance_pc03_memory_dump.raw",
      type: "RAM Physical Memory Dump",
      fileSizeMB: 16384,
      sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      acquiredFrom: "FINANCE-PC03 (10.0.4.15)",
      acquiredBy: "Alex Chen (Tier 3 Lead)",
      acquiredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      verifiedIntegrity: true,
      notes: "利用 WinPmem 抓取之物理記憶體鏡像，Volatility 已成功提取 Mimikatz 注入 LSASS 殘留線程。"
    }
  ];

  router.get('/artifacts', (req: Request, res: Response) => {
    res.json({ success: true, count: artifacts.length, artifacts });
  });

  router.post('/artifacts', (req: Request, res: Response) => {
    const { name, type, fileSizeMB, acquiredFrom, notes } = req.body;
    const newArt = {
      id: `art-${Date.now().toString().slice(-4)}`,
      name: name || "forensic_evidence.raw",
      type: type || "Disk Image / Evidence",
      fileSizeMB: Number(fileSizeMB) || 120,
      sha256: `sha256:${Buffer.from(String(Date.now())).toString('hex').padEnd(64, 'e').slice(0, 64)}`,
      acquiredFrom: acquiredFrom || "Host Endpoint",
      acquiredBy: "SOC Digital Forensics Officer",
      acquiredAt: new Date().toISOString(),
      verifiedIntegrity: true,
      notes: notes || "已完成不可篡改數位簽章計算並歸檔至證據保險箱。"
    };

    artifacts.unshift(newArt);
    res.json({ success: true, message: `鑑識證據 '${newArt.name}' 已成功封裝並計入監管鏈`, artifact: newArt });
  });

  router.get('/timeline', (req: Request, res: Response) => {
    const now = Date.now();
    const timelineEvents = [
      { timestamp: new Date(now - 3600000 * 3).toISOString(), event: "初始連線建立: 10.88.14.92 發起 TCP SYN 至 192.168.1.100:445", source: "NDR Flow Engine" },
      { timestamp: new Date(now - 3600000 * 2.9).toISOString(), event: "SMB 協商完成: 請求 SMBv1 擴充屬性 (FEA List)", source: "Syslog NGFW" },
      { timestamp: new Date(now - 3600000 * 2.8).toISOString(), event: "IDS 規則命中: Suricata 觸發 ET EXPLOIT MS17-010 告警", source: "Suricata IDS" },
      { timestamp: new Date(now - 3600000 * 2.7).toISOString(), event: "自動化封鎖執行: 防火牆下發 DROP 阻絕策略並隔離跳板端點", source: "SOAR Automation" }
    ];

    res.json({ success: true, timeline: timelineEvents });
  });

  router.get('/chain-of-custody', (req: Request, res: Response) => {
    res.json({
      success: true,
      custodyLedger: artifacts.map(a => ({
        artifactId: a.id,
        artifactName: a.name,
        sha256: a.sha256,
        custodian: a.acquiredBy,
        location: "SOC Encrypted Offline Storage Vault S3-SECURE",
        status: "SEALED_VERIFIED",
        auditLedgerHash: `sha256:${Buffer.from(`${a.id}-${a.sha256}`).toString('hex').padEnd(64, 'f').slice(0, 64)}`
      }))
    });
  });

  return router;
}

import { Router, Request, Response } from 'express';

export function createHoneypotRouter() {
  const router = Router();

  let decoys = [
    {
      id: "decoy-ssh-01",
      name: "DMZ-SSH-HONEYPOT (Cowrie Engine)",
      type: "SSH / Telnet Emulation",
      ip: "192.168.10.88",
      port: 22,
      vlan: 50,
      attackerInteractionsTotal: 14208,
      credentialsCapturedCount: 3841,
      payloadsCapturedCount: 24,
      status: "active",
      lastInteractionAt: new Date(Date.now() - 45000).toISOString()
    },
    {
      id: "decoy-smb-02",
      name: "STORAGE-SMB-LURE (Conpot / Dionaea)",
      type: "SMBv1/v2 Decoy Share",
      ip: "192.168.10.89",
      port: 445,
      vlan: 50,
      attackerInteractionsTotal: 4210,
      credentialsCapturedCount: 195,
      payloadsCapturedCount: 8,
      status: "active",
      lastInteractionAt: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: "decoy-web-03",
      name: "ERP-ADMIN-PORTAL-DECOY",
      type: "Fake Web Admin & SQLi Trap",
      ip: "10.0.1.99",
      port: 8080,
      vlan: 50,
      attackerInteractionsTotal: 8490,
      credentialsCapturedCount: 940,
      payloadsCapturedCount: 15,
      status: "active",
      lastInteractionAt: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: "decoy-ot-04",
      name: "SCADA-MODBUS-PLC-HONEY",
      type: "Industrial Modbus/TCP 502 Trap",
      ip: "172.16.50.12",
      port: 502,
      vlan: 80,
      attackerInteractionsTotal: 340,
      credentialsCapturedCount: 12,
      payloadsCapturedCount: 2,
      status: "active",
      lastInteractionAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  router.get('/decoys', (req: Request, res: Response) => {
    res.json({ success: true, count: decoys.length, decoys });
  });

  router.post('/decoys', (req: Request, res: Response) => {
    const { name, type, ip, port } = req.body;
    const newDecoy = {
      id: `decoy-${Date.now().toString().slice(-4)}`,
      name: name || "NEW-DECEPTION-NODE",
      type: type || "Emulated Service Trap",
      ip: ip || "192.168.10.95",
      port: Number(port) || 21,
      vlan: 50,
      attackerInteractionsTotal: 0,
      credentialsCapturedCount: 0,
      payloadsCapturedCount: 0,
      status: "active",
      lastInteractionAt: new Date().toISOString()
    };

    decoys.unshift(newDecoy);
    res.json({ success: true, message: `誘捕蜜罐節點 '${newDecoy.name}' 已成功上線並發布誘餌廣播`, decoy: newDecoy });
  });

  router.get('/telemetry', (req: Request, res: Response) => {
    res.json({
      success: true,
      summary: {
        totalInteractionsToday: 27248,
        activeLuresCount: decoys.length,
        capturedMalwareBinariesCount: 49,
        topAttackerOrigins: [
          { country: "Russia", ip: "45.142.214.88", count: 9420 },
          { country: "Netherlands", ip: "185.220.101.5", count: 5210 },
          { country: "United States", ip: "198.51.100.44", count: 3410 },
          { country: "China", ip: "103.224.182.12", count: 2840 }
        ]
      }
    });
  });

  router.get('/wargaming/battle-map', (req: Request, res: Response) => {
    const now = Date.now();
    const liveBattles = [
      {
        id: "battle-01",
        timestamp: new Date(now - 12000).toISOString(),
        redTeamActor: "External Botnet Mozi (194.26.29.112)",
        attackVector: "Telnet/SSH Default Password Spray",
        targetedDecoy: "DMZ-SSH-HONEYPOT (192.168.10.88)",
        blueTeamResponse: "自動化下發 BGP FlowSpec 邊界路由黑洞阻斷",
        status: "NEUTRALIZED",
        impactScore: 12
      },
      {
        id: "battle-02",
        timestamp: new Date(now - 45000).toISOString(),
        redTeamActor: "Adversary APT28 Sub-node (45.142.214.88)",
        attackVector: "EternalBlue SMBv1 Exploit Payload",
        targetedDecoy: "STORAGE-SMB-LURE (192.168.10.89)",
        blueTeamResponse: "沙箱環境動態捕獲並即時生成 YARA 規則阻斷全網相同 Hash",
        status: "TRAPPED_AND_EXTRACTED",
        impactScore: 95
      }
    ];

    res.json({
      success: true,
      wargamingStatus: "ENGAGED",
      battlefieldReadiness: 100,
      activeEvents: liveBattles
    });
  });

  return router;
}

import express, { type Request, type Response } from 'express';
import { tpotEngine } from './tpotEngine.ts';

const Router = express.Router;

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

  // 1. T-Pot Platform Status & Health
  router.get('/tpot-status', (req: Request, res: Response) => {
    const summary = tpotEngine.getTelemetrySummary();
    const containers = tpotEngine.getContainers();
    const nodes = tpotEngine.getSensorNodes();

    res.json({
      success: true,
      platform: 'T-Pot Multi-Honeypot Framework',
      version: summary.tpotVersion,
      status: summary.platformHealth,
      elasticStatus: summary.elasticClusterStatus,
      containersCount: containers.length,
      onlineNodesCount: nodes.filter(n => n.status === 'ONLINE').length,
      activeBlockedIps: summary.activeBlockedIpsCount,
      summary
    });
  });

  // 2. Real-time Attack Map Telemetry & Live Attacks Feed
  router.get('/attack-map/live', (req: Request, res: Response) => {
    const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 35));
    const liveAttacks = tpotEngine.getLiveAttacks(limit);
    const nodes = tpotEngine.getSensorNodes();
    const summary = tpotEngine.getTelemetrySummary();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      nodes,
      attacks: liveAttacks,
      summary: {
        totalAttacksToday: summary.totalAttacksToday,
        uniqueIpsToday: summary.uniqueIpsToday,
        malwareSamplesCaptured: summary.malwareSamplesCaptured,
        credentialsHarvested: summary.credentialsHarvested,
        velocityRatePerSec: summary.velocityRatePerSec,
        activeBlockedIpsCount: summary.activeBlockedIpsCount,
        topOrigins: summary.topOrigins,
        protocolBreakdown: summary.protocolBreakdown
      }
    });
  });

  // 3. T-Pot Distributed Sensor Nodes
  router.get('/nodes', (req: Request, res: Response) => {
    const nodes = tpotEngine.getSensorNodes();
    res.json({ success: true, count: nodes.length, nodes });
  });

  // 4. Honeypot Daemon Containers
  router.get('/containers', (req: Request, res: Response) => {
    const containers = tpotEngine.getContainers();
    res.json({ success: true, count: containers.length, containers });
  });

  // 5. Restart Honeypot Container
  router.post('/containers/:id/restart', (req: Request, res: Response) => {
    const containerId = req.params.id;
    const ok = tpotEngine.restartContainer(containerId);
    if (ok) {
      res.json({ success: true, message: `容器 '${containerId}' 已成功下發重啟指令並重置監聽埠` });
    } else {
      res.status(404).json({ success: false, message: `找不到容器 '${containerId}'` });
    }
  });

  // 6. Active Defense: Block Malicious Attacker IP (NAC / Firewall / BGP FlowSpec)
  router.post('/block-attacker', (req: Request, res: Response) => {
    const { ip, reason, blockedBy } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, message: '必須指定要阻斷的攻擊來源 IP' });
    }

    const record = tpotEngine.blockAttacker(ip, reason, blockedBy);
    res.json({
      success: true,
      message: `攻擊者 IP [${ip}] 已成功透過 NAC 與邊界防火牆全面阻斷！`,
      record
    });
  });

  // 7. Unblock Attacker IP
  router.post('/unblock-attacker', (req: Request, res: Response) => {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, message: '必須指定解除阻斷的 IP' });
    }

    const unblocked = tpotEngine.unblockAttacker(ip);
    res.json({
      success: true,
      message: unblocked ? `IP [${ip}] 已自黑名單中移除並恢復網路通訊` : `IP [${ip}] 不在當前阻斷名單中`
    });
  });

  // 8. Get All Blocked Attackers
  router.get('/blocked-ips', (req: Request, res: Response) => {
    const blockedList = tpotEngine.getBlockedAttackers();
    res.json({ success: true, count: blockedList.length, blockedList });
  });

  // 9. Manual / Automated Attack Simulator (War Gaming)
  router.post('/simulate-attack', (req: Request, res: Response) => {
    const { countryCode, honeypot, targetNodeId, severity } = req.body;
    const simulatedEvent = tpotEngine.simulateAttack({
      countryCode,
      honeypot,
      targetNodeId,
      severity
    });

    res.json({
      success: true,
      message: `已向 T-Pot 蜜罐平台成功發送模擬入侵流量 (${simulatedEvent.honeypot} - ${simulatedEvent.attackType})`,
      event: simulatedEvent
    });
  });

  // 10. Adjust Attack Map Speed / Velocity
  router.post('/velocity', (req: Request, res: Response) => {
    const { multiplier } = req.body;
    const m = Number(multiplier) || 1;
    tpotEngine.setVelocity(m);
    res.json({ success: true, velocityMultiplier: m, message: `攻擊地圖流速已調整為 ${m}x` });
  });

  // 11. Export Threat IOC Rules
  router.get('/ioc/export', (req: Request, res: Response) => {
    const format = (req.query.format as any) || 'suricata';
    const rules = tpotEngine.exportIocRules(format);
    res.setHeader('Content-Disposition', `attachment; filename="tpot_ioc_${format}.${format === 'stix' ? 'json' : 'rules'}"`);
    res.setHeader('Content-Type', format === 'stix' ? 'application/json' : 'text/plain');
    res.send(rules);
  });

  // Backward compatible endpoints
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
    const summary = tpotEngine.getTelemetrySummary();
    res.json({
      success: true,
      summary: {
        totalInteractionsToday: summary.totalAttacksToday,
        activeLuresCount: decoys.length,
        capturedMalwareBinariesCount: summary.malwareSamplesCaptured,
        topAttackerOrigins: summary.topOrigins.slice(0, 5).map(o => ({
          country: o.country,
          ip: o.code,
          count: o.count
        }))
      }
    });
  });

  router.get('/wargaming/battle-map', (req: Request, res: Response) => {
    const recentAttacks = tpotEngine.getLiveAttacks(5);
    const liveBattles = recentAttacks.map((a, idx) => ({
      id: `battle-0${idx + 1}`,
      timestamp: a.timestamp,
      redTeamActor: `${a.sourceGeo.country} Adversary (${a.sourceIp})`,
      attackVector: `${a.honeypot} - ${a.attackType}`,
      targetedDecoy: `${a.targetNodeName} [Port ${a.targetPort}]`,
      blueTeamResponse: a.actionTaken === 'BLOCKED_BY_NAC' 
        ? "自動化下發 BGP FlowSpec 邊界路由黑洞阻斷"
        : "沙箱環境動態捕獲並即時分析特徵",
      status: a.actionTaken === 'BLOCKED_BY_NAC' ? "NEUTRALIZED" : "TRAPPED_AND_EXTRACTED",
      impactScore: a.severity === 'CRITICAL' ? 95 : a.severity === 'HIGH' ? 70 : 35
    }));

    res.json({
      success: true,
      wargamingStatus: "ENGAGED",
      battlefieldReadiness: 100,
      activeEvents: liveBattles
    });
  });

  return router;
}

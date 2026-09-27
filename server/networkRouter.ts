import { Router, Request, Response } from 'express';

export function createNetworkRouter() {
  const router = Router();

  let switches = [
    {
      id: "sw-core-01",
      name: "CORE-SW-CAT9300-A",
      model: "Cisco Catalyst 9300 48P PoE+",
      ip: "10.0.0.2",
      location: "HQ Server Room Rack-A2",
      totalPorts: 48,
      activePorts: 38,
      poeBudgetWatts: 740,
      poeUsedWatts: 385,
      cpuLoadPct: 24.5,
      temperatureC: 38.2,
      uptime: "142 天 8 小時",
      status: "healthy"
    },
    {
      id: "sw-dist-02",
      name: "DIST-SW-CAT9300-B",
      model: "Cisco Catalyst 9300 48P",
      ip: "10.0.0.3",
      location: "HQ Server Room Rack-B1",
      totalPorts: 48,
      activePorts: 32,
      poeBudgetWatts: 740,
      poeUsedWatts: 290,
      cpuLoadPct: 18.2,
      temperatureC: 36.8,
      uptime: "98 天 4 小時",
      status: "healthy"
    },
    {
      id: "sw-edge-03",
      name: "EDGE-SW-ARUBA-2930F",
      model: "Aruba 2930F 24G PoE+",
      ip: "10.0.0.10",
      location: "Floor 3 Wiring Closet",
      totalPorts: 24,
      activePorts: 19,
      poeBudgetWatts: 370,
      poeUsedWatts: 185,
      cpuLoadPct: 31.0,
      temperatureC: 41.5,
      uptime: "45 天 12 小時",
      status: "healthy"
    }
  ];

  let nacDevices = [
    {
      mac: "bc:d0:74:18:22:90",
      ip: "10.0.4.15",
      hostname: "FINANCE-PC03",
      authMethod: "802.1X (EAP-TLS)",
      user: "victim_user",
      vlan: 999, // Quarantined
      switchId: "sw-core-01",
      port: "GigabitEthernet1/0/15",
      complianceStatus: "Non-Compliant (EDR Mimikatz Alert)",
      accessState: "quarantined" as "allowed" | "quarantined" | "guest",
      lastSeen: new Date().toISOString()
    },
    {
      mac: "00:50:56:c0:00:08",
      ip: "192.168.1.100",
      hostname: "dc01.corp.internal",
      authMethod: "MAB (MAC Auth Bypass)",
      user: "SYSTEM",
      vlan: 10,
      switchId: "sw-core-01",
      port: "TenGigabitEthernet1/1/1",
      complianceStatus: "Compliant",
      accessState: "allowed" as "allowed" | "quarantined" | "guest",
      lastSeen: new Date().toISOString()
    },
    {
      mac: "f4:d4:88:9a:12:ef",
      ip: "10.0.12.44",
      hostname: "DEV-MAC-BOOK-12",
      authMethod: "802.1X (EAP-PEAP)",
      user: "eng_chen",
      vlan: 20,
      switchId: "sw-dist-02",
      port: "GigabitEthernet1/0/8",
      complianceStatus: "Warning (DNS C2 Investigation)",
      accessState: "allowed" as "allowed" | "quarantined" | "guest",
      lastSeen: new Date().toISOString()
    }
  ];

  router.get('/switches', (req: Request, res: Response) => {
    res.json({ success: true, count: switches.length, switches });
  });

  router.get('/ports/:switchId', (req: Request, res: Response) => {
    const { switchId } = req.params;
    const ports = Array.from({ length: 24 }, (_, i) => {
      const portNum = i + 1;
      const isUp = i < 18;
      return {
        port: `GigabitEthernet1/0/${portNum}`,
        status: isUp ? 'up' : 'down',
        vlan: i === 14 ? 999 : (i < 8 ? 10 : 20),
        speed: isUp ? '1000 Mbps Full' : 'N/A',
        duplex: isUp ? 'Full' : 'N/A',
        poeStatus: isUp && i % 2 === 0 ? 'Delivering (15.4W)' : 'Off',
        rxBytesMB: isUp ? Number((Math.random() * 1500 + 200).toFixed(1)) : 0,
        txBytesMB: isUp ? Number((Math.random() * 1200 + 150).toFixed(1)) : 0,
        crcErrors: i === 4 ? 2 : 0
      };
    });

    res.json({ success: true, switchId, ports });
  });

  router.post('/ports/toggle', (req: Request, res: Response) => {
    const { switchId, port, action } = req.body;
    res.json({
      success: true,
      message: `交換器 ${switchId} 埠號 ${port} 已執行行政設定: ${action === 'down' ? 'SHUTDOWN (禁用)' : 'NO SHUTDOWN (啟用)'}`,
      switchId,
      port,
      state: action || 'down'
    });
  });

  router.get('/nac/devices', (req: Request, res: Response) => {
    res.json({ success: true, count: nacDevices.length, devices: nacDevices });
  });

  router.post('/nac/quarantine', (req: Request, res: Response) => {
    const { mac, ip, reason } = req.body;
    const dev = nacDevices.find(d => d.mac === mac || d.ip === ip);
    if (dev) {
      dev.accessState = "quarantined";
      dev.vlan = 999;
      dev.complianceStatus = reason || "Security Policy Violation (Quarantined by NAC)";
    }

    res.json({
      success: true,
      mac,
      ip,
      message: `NAC 802.1X 已動態下發 CoA (Change of Authorization)，將設備 ${mac || ip} 重新導向至隔離區 VLAN 999`,
      device: dev
    });
  });

  router.post('/nac/allow', (req: Request, res: Response) => {
    const { mac, vlan } = req.body;
    const dev = nacDevices.find(d => d.mac === mac);
    if (dev) {
      dev.accessState = "allowed";
      dev.vlan = Number(vlan) || 20;
      dev.complianceStatus = "Compliant (Approved by Admin)";
    }

    res.json({
      success: true,
      mac,
      message: `NAC 已恢復設備 ${mac} 之網路連線存取權限 (VLAN ${dev?.vlan || vlan})`,
      device: dev
    });
  });

  return router;
}

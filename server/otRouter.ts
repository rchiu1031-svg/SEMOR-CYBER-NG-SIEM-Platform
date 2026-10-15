import express, { type Request, type Response } from 'express';
import { otSecurityEngine } from './otEngine.ts';

const Router = express.Router;

export function createOtRouter() {
  const router = Router();

  // 1. GET /api/v1/ot/telemetry - High-level OT/ICS security telemetry & metrics
  router.get('/telemetry', (_req: Request, res: Response) => {
    try {
      const summary = otSecurityEngine.getTelemetrySummary();
      res.json({
        success: true,
        summary
      });
    } catch (e: any) {
      console.error('Error fetching OT telemetry:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 2. GET /api/v1/ot/assets - List all Purdue model assets with filters
  router.get('/assets', (req: Request, res: Response) => {
    try {
      const { purdueLevel, protocol, vendor, search } = req.query;
      const assets = otSecurityEngine.getAssets({
        purdueLevel: purdueLevel ? String(purdueLevel) : undefined,
        protocol: protocol ? String(protocol) : undefined,
        vendor: vendor ? String(vendor) : undefined,
        search: search ? String(search) : undefined
      });
      res.json({
        success: true,
        count: assets.length,
        assets
      });
    } catch (e: any) {
      console.error('Error fetching OT assets:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 3. GET /api/v1/ot/assets/:id - Single asset detail
  router.get('/assets/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const asset = otSecurityEngine.getAssetById(id);
      if (!asset) {
        return res.status(404).json({ success: false, error: 'Asset not found' });
      }
      res.json({
        success: true,
        asset
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 4. POST /api/v1/ot/assets - Register new industrial asset
  router.post('/assets', (req: Request, res: Response) => {
    try {
      const newAsset = otSecurityEngine.createAsset(req.body);
      res.status(201).json({
        success: true,
        message: `資產 ${newAsset.name} 已成功登錄至工控資產清冊`,
        asset: newAsset
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 5. PATCH /api/v1/ot/assets/:id - Update asset status / PLC mode
  router.patch('/assets/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = otSecurityEngine.updateAssetStatus(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Asset not found' });
      }
      res.json({
        success: true,
        message: `資產 ${updated.name} 狀態已更新`,
        asset: updated
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 6. GET /api/v1/ot/dpi-commands - Deep Packet Inspection parsed stream
  router.get('/dpi-commands', (req: Request, res: Response) => {
    try {
      const { protocol, isAnomaly, riskLevel, limit } = req.query;
      const commands = otSecurityEngine.getDpiCommands({
        protocol: protocol ? String(protocol) : undefined,
        isAnomaly: isAnomaly !== undefined ? isAnomaly === 'true' : undefined,
        riskLevel: riskLevel ? String(riskLevel) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50
      });
      res.json({
        success: true,
        count: commands.length,
        commands
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 7. POST /api/v1/ot/dpi-commands/inject - Inject / simulate malicious or test ICS command
  router.post('/dpi-commands/inject', (req: Request, res: Response) => {
    try {
      const injected = otSecurityEngine.injectDpiCommand(req.body);
      res.status(201).json({
        success: true,
        message: '工控指令模擬注入成功，DPI 深度封包檢測已記錄！',
        command: injected
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 8. GET /api/v1/ot/dpi-commands/:id/payload - Dissect raw hex payload
  router.get('/dpi-commands/:id/payload', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cmd = otSecurityEngine.getDpiCommandById(id);
      if (!cmd) {
        return res.status(404).json({ success: false, error: 'Command not found' });
      }

      // Generate dissect breakdown
      const hexBytes = cmd.payloadHex.split(' ');
      const ascii = hexBytes.map(b => {
        const charCode = parseInt(b, 16);
        return (charCode >= 32 && charCode <= 126) ? String.fromCharCode(charCode) : '.';
      }).join('');

      res.json({
        success: true,
        commandId: cmd.id,
        protocol: cmd.protocol,
        payloadHex: cmd.payloadHex,
        ascii,
        length: hexBytes.length,
        dissector: {
          transport: 'TCP/IP Port 502 (Modbus) / Port 102 (S7Comm) / Port 44818 (EtherNet/IP)',
          functionCode: cmd.functionCode,
          parsedFields: {
            sourceEndpoint: cmd.source,
            destinationEndpoint: cmd.destination,
            actionTaken: cmd.actionTaken,
            anomalyDetected: cmd.isAnomaly,
            reason: cmd.anomalyReason || 'Normal Supervisory Polling'
          }
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 9. GET /api/v1/ot/incidents - List IT-to-OT breach incidents
  router.get('/incidents', (_req: Request, res: Response) => {
    try {
      const incidents = otSecurityEngine.getIncidents();
      res.json({
        success: true,
        count: incidents.length,
        incidents
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 10. POST /api/v1/ot/incidents/:id/mitigate - Approve & execute SOAR playbook containment
  router.post('/incidents/:id/mitigate', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const result = otSecurityEngine.mitigateIncident(id, notes);
      if (!result.success) {
        return res.status(404).json({ success: false, error: result.error });
      }
      res.json({
        success: true,
        message: `事件 ${id} 工控隔離劇本已執行完成`,
        incident: result.incident
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 11. GET /api/v1/ot/sensors - Physical process safety sensors telemetry
  router.get('/sensors', (_req: Request, res: Response) => {
    try {
      const sensors = otSecurityEngine.getSensors();
      res.json({
        success: true,
        count: sensors.length,
        sensors
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 12. POST /api/v1/ot/sensors/:id/thresholds - Update baseline / critical limits
  router.post('/sensors/:id/thresholds', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { baselineMin, baselineMax, hazardCriticalLimit } = req.body;
      if (baselineMin === undefined || baselineMax === undefined || hazardCriticalLimit === undefined) {
        return res.status(400).json({ success: false, error: 'Missing baselineMin, baselineMax, or hazardCriticalLimit' });
      }
      const updated = otSecurityEngine.updateSensorThresholds(
        id,
        Number(baselineMin),
        Number(baselineMax),
        Number(hazardCriticalLimit)
      );
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Sensor not found' });
      }
      res.json({
        success: true,
        message: `感測器 ${updated.name} 安全門檻已更新`,
        sensor: updated
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 13. POST /api/v1/ot/emergency-shutdown - Trigger Emergency Shutdown (ESD)
  router.post('/emergency-shutdown', (req: Request, res: Response) => {
    try {
      const { operator } = req.body;
      const result = otSecurityEngine.triggerEmergencyShutdown(operator);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 14. POST /api/v1/ot/reset-emergency-shutdown - Reset Emergency Shutdown (ESD)
  router.post('/reset-emergency-shutdown', (_req: Request, res: Response) => {
    try {
      const result = otSecurityEngine.resetEmergencyShutdown();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 15. GET /api/v1/ot/rules - Purdue boundary ACL rules
  router.get('/rules', (_req: Request, res: Response) => {
    try {
      const rules = otSecurityEngine.getRules();
      res.json({
        success: true,
        count: rules.length,
        rules
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 16. PATCH /api/v1/ot/rules/:id - Toggle / update rule
  router.patch('/rules/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = otSecurityEngine.updateRule(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Rule not found' });
      }
      res.json({
        success: true,
        message: `Purdue 防火牆規則 ${updated.name} 已更新`,
        rule: updated
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17. GET /api/v1/ot/pcap/export - Download sample or captured ICS PCAP metadata
  router.get('/pcap/export', (req: Request, res: Response) => {
    try {
      const { id } = req.query;
      res.json({
        success: true,
        pcapId: id || 'PCAP-ICS-FULL-CAPTURE-STREAM.pcap',
        capturedPackets: 28450,
        capturedBytes: 18459200,
        interface: 'eth1 (Industrial SPAN Mirror)',
        format: 'libpcap v2.4 (TCPDUMP / Wireshark compatible)',
        protocolsIncluded: ['Modbus TCP', 'S7Comm', 'EtherNet/IP', 'OPC UA', 'DNP3'],
        downloadUrl: `/api/v1/ot/pcap/download?id=${id || 'latest'}`
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 18. GET /api/v1/ot/pcap/download - Deliver valid libpcap binary for Wireshark analysis
  router.get('/pcap/download', (req: Request, res: Response) => {
    try {
      const pcapId = (req.query.id as string) || 'PCAP-ICS-CAPTURE.pcap';
      const filename = pcapId.endsWith('.pcap') ? pcapId : `${pcapId}.pcap`;

      // Construct a valid libpcap Global Header (24 bytes)
      // Magic: 0xa1b2c3d4 (little endian: d4 c3 b2 a1)
      // Major: 2, Minor: 4, TZ: 0, Sigfigs: 0, Snaplen: 65535, LinkType: 1 (Ethernet)
      const globalHeader = Buffer.alloc(24);
      globalHeader.writeUInt32LE(0xa1b2c3d4, 0); // magic_number
      globalHeader.writeUInt16LE(2, 4);          // version_major
      globalHeader.writeUInt16LE(4, 6);          // version_minor
      globalHeader.writeInt32LE(0, 8);           // thiszone
      globalHeader.writeUInt32LE(0, 12);         // sigfigs
      globalHeader.writeUInt32LE(65535, 16);     // snaplen
      globalHeader.writeUInt32LE(1, 20);         // network (LINKTYPE_ETHERNET)

      // Add a representative captured industrial packet frame
      // Frame Packet Header (16 bytes): ts_sec (4), ts_usec (4), incl_len (4), orig_len (4)
      const now = Math.floor(Date.now() / 1000);
      const rawPacket = Buffer.from([
        // Ethernet Header: Dst MAC (6), Src MAC (6), EtherType IPv4 0x0800
        0x00, 0x1B, 0x1B, 0x34, 0xA1, 0x02, 0x00, 0x50, 0x56, 0xC0, 0x00, 0x08, 0x08, 0x00,
        // IP Header (20 bytes): 192.168.50.80 -> 192.168.50.10, Proto TCP 6
        0x45, 0x00, 0x00, 0x3C, 0x1A, 0x2B, 0x40, 0x00, 0x40, 0x06, 0x00, 0x00,
        0xC0, 0xA8, 0x32, 0x50, 0xC0, 0xA8, 0x32, 0x0A,
        // TCP Header (20 bytes): Src Port 49152, Dst Port 102 (S7Comm/ISO-TSAP)
        0xC0, 0x00, 0x00, 0x66, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x50, 0x18, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00,
        // S7Comm Payload (Stop CPU / Read Var)
        0x03, 0x00, 0x00, 0x21, 0x02, 0xF0, 0x80, 0x32, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x0E, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xFD, 0x00, 0x00, 0x09, 0x5F, 0x49, 0x4E, 0x53, 0x45
      ]);

      const packetHeader = Buffer.alloc(16);
      packetHeader.writeUInt32LE(now, 0);                // ts_sec
      packetHeader.writeUInt32LE(125000, 4);             // ts_usec
      packetHeader.writeUInt32LE(rawPacket.length, 8);   // incl_len
      packetHeader.writeUInt32LE(rawPacket.length, 12);  // orig_len

      const pcapBuffer = Buffer.concat([globalHeader, packetHeader, rawPacket]);

      res.setHeader('Content-Type', 'application/vnd.tcpdump.pcap');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pcapBuffer.length);
      res.end(pcapBuffer);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 19. POST /api/v1/ot/purge - Purge all simulated OT assets and incidents
  router.post('/purge', (_req: Request, res: Response) => {
    try {
      otSecurityEngine.purgeData();
      res.json({
        success: true,
        message: '工控/OT 模擬資產、DPI 異常用量與事件已全數清除，就緒於實體 Purdue 探針探索'
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  return router;
}

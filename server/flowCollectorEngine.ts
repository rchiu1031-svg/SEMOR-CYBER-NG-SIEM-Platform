import { globalAttackSignatureEngine } from './attackSignatureEngine.ts';
import { globalFingerbankEngine } from './signatureUpdateEngine.ts';
import type { NetworkFlowRecord } from './networkRouter.ts';

export interface CollectorInterfaceStat {
  id: string;
  name: string;
  device: string;
  speed: string;
  status: 'up' | 'down';
  rxPackets: number;
  txPackets: number;
  rxBytes: number;
  txBytes: number;
  drops: number;
  errors: number;
  flowCount: number;
}

export interface FlowCollectorConfig {
  enabled: boolean;
  samplingRatio: '1:100' | '1:500' | '1:1000';
  collectionIntervalMs: number;
  maxFlowsBuffer: number;
  autoDpiInspection: boolean;
  activeTimeoutSec: number;
  inactiveTimeoutSec: number;
  simulatedTrafficProfile: 'balanced' | 'high_throughput' | 'ot_industrial' | 'threat_simulation';
}

export interface FlowCollectorMetrics {
  isRunning: boolean;
  uptimeSeconds: number;
  samplingRatio: string;
  ingestionRatePps: number;
  throughputBps: number;
  throughputMbps: number;
  totalPacketsSampled: number;
  totalBytesSampled: number;
  totalFlowsCollected: number;
  activeFlowsCount: number;
  maliciousFlowsCount: number;
  suspiciousFlowsCount: number;
  blockedFlowsCount: number;
  bufferUtilizationPct: number;
  workerThreads: number;
  droppedPackets: number;
  lastCollectionTimestamp: string;
}

export class FlowCollectorEngine {
  private config: FlowCollectorConfig = {
    enabled: true,
    samplingRatio: '1:100',
    collectionIntervalMs: 2500,
    maxFlowsBuffer: 600,
    autoDpiInspection: true,
    activeTimeoutSec: 60,
    inactiveTimeoutSec: 20,
    simulatedTrafficProfile: 'balanced'
  };

  private flowsBuffer: NetworkFlowRecord[] = [];
  private interfaces: CollectorInterfaceStat[] = [];
  private startTime = Date.now();
  private intervalTimer: NodeJS.Timeout | null = null;
  private totalPacketsSampled = 48291000;
  private totalBytesSampled = 36819200000;
  private totalFlowsCollected = 12450;
  private droppedPackets = 42;
  private broadcastCallback: ((event: any) => void) | null = null;
  private auditCallback: ((log: any) => void) | null = null;

  constructor() {
    this.initializeInterfaces();
    this.initializeBaselineFlows();
    this.start();
  }

  public setBroadcastCallback(cb: (event: any) => void) {
    this.broadcastCallback = cb;
  }

  public setAuditCallback(cb: (log: any) => void) {
    this.auditCallback = cb;
  }

  public getFlows(): NetworkFlowRecord[] {
    return this.flowsBuffer;
  }

  public setFlows(flows: NetworkFlowRecord[]) {
    this.flowsBuffer = flows;
  }

  private initializeInterfaces() {
    this.interfaces = [
      {
        id: 'if-core-1',
        name: 'GigabitEthernet1/0/1',
        device: 'Core-Catalyst-9500 (10.88.88.254)',
        speed: '10 Gbps',
        status: 'up',
        rxPackets: 18452090,
        txPackets: 17291040,
        rxBytes: 14209512000,
        txBytes: 12901512000,
        drops: 0,
        errors: 0,
        flowCount: 84
      },
      {
        id: 'if-fw-wan',
        name: 'Ethernet1/1 (WAN Gateway)',
        device: 'Gateway-Firewall-PA (211.23.131.21)',
        speed: '1 Gbps',
        status: 'up',
        rxPackets: 9812400,
        txPackets: 8452100,
        rxBytes: 8901230000,
        txBytes: 6712390000,
        drops: 12,
        errors: 0,
        flowCount: 46
      },
      {
        id: 'if-dmz-1',
        name: 'GigabitEthernet1/0/24 (DMZ App Cluster)',
        device: 'Core-Catalyst-9500 (10.88.88.254)',
        speed: '10 Gbps',
        status: 'up',
        rxPackets: 12451000,
        txPackets: 13910000,
        rxBytes: 11200450000,
        txBytes: 12890000000,
        drops: 0,
        errors: 0,
        flowCount: 52
      },
      {
        id: 'if-ot-diode',
        name: 'GigabitEthernet1/0/12 (OT Diode SCADA)',
        device: 'OT-Boundary-Diode-01 (10.88.99.1)',
        speed: '1 Gbps',
        status: 'up',
        rxPackets: 3412000,
        txPackets: 3209000,
        rxBytes: 1890000000,
        txBytes: 1650000000,
        drops: 0,
        errors: 0,
        flowCount: 18
      },
      {
        id: 'if-workstations',
        name: 'Port-channel1 (Workstation Access Layer)',
        device: 'Core-Catalyst-9500 (10.88.88.254)',
        speed: '20 Gbps (LACP)',
        status: 'up',
        rxPackets: 14210900,
        txPackets: 15120000,
        rxBytes: 10980000000,
        txBytes: 12450000000,
        drops: 30,
        errors: 0,
        flowCount: 68
      }
    ];
  }

  private initializeBaselineFlows() {
    const now = Date.now();
    this.flowsBuffer = [
      {
        id: 'flow-baseline-01',
        timestamp: new Date(now - 12000).toISOString(),
        srcIp: '10.88.88.100',
        srcPort: 54210,
        srcDeviceId: 'ws-sec-1',
        srcDeviceName: 'SOC-Analyst-WS01',
        dstIp: '10.88.88.10',
        dstPort: 443,
        dstDeviceId: 'srv-app-01',
        dstDeviceName: 'Web-App-Cluster-01',
        protocol: 'HTTPS',
        bytes: 8940000,
        packets: 6840,
        durationMs: 45000,
        flags: ['ACK', 'PSH'],
        bps: 1589000,
        pps: 152,
        threatLevel: 'normal',
        sampledInterface: 'Port-channel1 (Workstation Access Layer)',
        status: 'active'
      },
      {
        id: 'flow-baseline-02',
        timestamp: new Date(now - 8000).toISOString(),
        srcIp: '10.88.88.10',
        srcPort: 5432,
        srcDeviceId: 'srv-app-01',
        srcDeviceName: 'Web-App-Cluster-01',
        dstIp: '10.88.88.11',
        dstPort: 5432,
        dstDeviceId: 'srv-db-01',
        dstDeviceName: 'DB-Primary-Postgres',
        protocol: 'TCP',
        bytes: 49200000,
        packets: 34100,
        durationMs: 120000,
        flags: ['ACK', 'PSH'],
        bps: 3280000,
        pps: 284,
        threatLevel: 'normal',
        sampledInterface: 'GigabitEthernet1/0/24 (DMZ App Cluster)',
        status: 'active'
      },
      {
        id: 'flow-baseline-03',
        timestamp: new Date(now - 5000).toISOString(),
        srcIp: '10.88.88.254',
        srcPort: 161,
        srcDeviceId: 'core-sw-01',
        srcDeviceName: 'Core-Catalyst-9500',
        dstIp: '10.88.88.1',
        dstPort: 161,
        dstDeviceId: 'fw-01',
        dstDeviceName: 'Gateway-Firewall-PA',
        protocol: 'UDP',
        bytes: 240000,
        packets: 820,
        durationMs: 60000,
        flags: [],
        bps: 32000,
        pps: 14,
        threatLevel: 'normal',
        sampledInterface: 'GigabitEthernet1/0/1',
        status: 'active'
      },
      {
        id: 'flow-baseline-04',
        timestamp: new Date(now - 3000).toISOString(),
        srcIp: '10.88.99.10',
        srcPort: 48102,
        srcDeviceId: 'scada-hmi-01',
        srcDeviceName: 'SCADA-HMI-Master',
        dstIp: '10.88.99.20',
        dstPort: 502,
        dstDeviceId: 'plc-turb-01',
        dstDeviceName: 'Turbine-Controller-PLC',
        protocol: 'Modbus',
        bytes: 580000,
        packets: 1950,
        durationMs: 90000,
        flags: ['ACK', 'PSH'],
        bps: 51500,
        pps: 22,
        threatLevel: 'normal',
        sampledInterface: 'GigabitEthernet1/0/12 (OT Diode SCADA)',
        status: 'active'
      }
    ];
  }

  public start() {
    if (this.intervalTimer) return;
    this.config.enabled = true;
    this.intervalTimer = setInterval(() => {
      this.collectTick();
    }, this.config.collectionIntervalMs);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.config.enabled = false;
  }

  public toggle(): boolean {
    if (this.config.enabled) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public updateConfig(newConfig: Partial<FlowCollectorConfig>) {
    Object.assign(this.config, newConfig);
    if (newConfig.collectionIntervalMs && this.intervalTimer) {
      this.stop();
      this.start();
    }
  }

  public getConfig(): FlowCollectorConfig {
    return { ...this.config };
  }

  public getInterfaces(): CollectorInterfaceStat[] {
    return this.interfaces;
  }

  public flush() {
    this.flowsBuffer = [];
    this.initializeBaselineFlows();
  }

  public clearThreats(): number {
    let cleared = 0;
    this.flowsBuffer.forEach(f => {
      if (f.threatLevel === 'malicious') {
        f.status = 'blocked';
        cleared++;
      }
    });
    return cleared;
  }

  public ingestManualFlow(raw: Partial<NetworkFlowRecord>): NetworkFlowRecord {
    const { threatLevel, signatureMatch } = this.evaluateThreat(raw);
    const newFlow: NetworkFlowRecord = {
      id: raw.id || `flow-ingest-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: raw.timestamp || new Date().toISOString(),
      srcIp: raw.srcIp || '10.88.88.100',
      srcPort: Number(raw.srcPort || 50000),
      srcDeviceId: raw.srcDeviceId,
      srcDeviceName: raw.srcDeviceName || raw.srcDeviceId,
      dstIp: raw.dstIp || '10.88.88.10',
      dstPort: Number(raw.dstPort || 443),
      dstDeviceId: raw.dstDeviceId,
      dstDeviceName: raw.dstDeviceName || raw.dstDeviceId,
      protocol: (raw.protocol as any) || 'TCP',
      bytes: Number(raw.bytes || 4096),
      packets: Number(raw.packets || 24),
      durationMs: Number(raw.durationMs || 1500),
      flags: raw.flags || ['ACK'],
      bps: Number(raw.bps || (raw.bytes ? raw.bytes * 8 : 16384)),
      pps: Number(raw.pps || (raw.packets ? raw.packets : 16)),
      threatLevel,
      signatureMatch,
      sampledInterface: raw.sampledInterface || 'GigabitEthernet1/0/1',
      status: (raw.status as any) || 'active'
    };

    globalFingerbankEngine.fingerprintFlow(newFlow);

    this.flowsBuffer.unshift(newFlow);
    if (this.flowsBuffer.length > this.config.maxFlowsBuffer) {
      this.flowsBuffer.pop();
    }

    this.totalFlowsCollected++;
    this.totalPacketsSampled += newFlow.packets;
    this.totalBytesSampled += newFlow.bytes;

    if (this.broadcastCallback) {
      this.broadcastCallback({ type: 'flow_ingested', flow: newFlow });
    }

    return newFlow;
  }

  public evaluateThreat(flow: Partial<NetworkFlowRecord>): {
    threatLevel: 'normal' | 'suspicious' | 'malicious';
    signatureMatch?: NetworkFlowRecord['signatureMatch'];
  } {
    // 1. Evaluate via Attack Signature Engine
    const virtualLog = {
      full_log: `Flow [${flow.protocol}] ${flow.srcIp}:${flow.srcPort} -> ${flow.dstIp}:${flow.dstPort} bytes=${flow.bytes} pps=${flow.pps} flags=${(flow.flags || []).join(',')}`,
      remoteIP: flow.srcIp,
      host: flow.srcDeviceName || flow.srcDeviceId || 'FLOW-EXPORTER',
      protocol: flow.protocol,
      '@timestamp': flow.timestamp || new Date().toISOString()
    };

    const detected = globalAttackSignatureEngine.evaluateLog(virtualLog);
    if (detected) {
      return {
        threatLevel: detected.riskScore >= 9.0 ? 'malicious' : 'suspicious',
        signatureMatch: {
          signatureId: detected.signatureId,
          signatureName: detected.signatureName,
          mitreTTP: detected.mitreTTP,
          mitreTactic: detected.mitreTactic,
          mitreStage: detected.mitreStage,
          confidence: detected.confidence,
          riskScore: detected.riskScore,
          description: detected.summary,
          cve: detected.cve
        }
      };
    }

    // 2. Specific Heuristics
    if (flow.dstPort === 502 || flow.protocol === 'Modbus') {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-ICS-MODBUS-001',
          signatureName: '工控 Modbus/TCP 暫存器未授權覆寫攻擊',
          mitreTTP: 'T0816 Impair Process Control',
          mitreTactic: 'Inhibit Response Function',
          mitreStage: 'Lateral Movement',
          confidence: 99.4,
          riskScore: 9.9,
          description: `NetFlow 捕獲向工控 PLC (${flow.dstIp}:502) 下發未授權 Modbus Function Code 0x06 竄改指令`,
          cve: 'ICS-ALERT-2026-MODBUS'
        }
      };
    }

    if (flow.dstPort === 102 || flow.protocol === 'S7Comm') {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-ICS-S7COMM-010',
          signatureName: '西門子 S7Comm 工控 PLC 惡意停機指令注入',
          mitreTTP: 'T0815 Denial of Control',
          mitreTactic: 'Inhibit Response Function',
          mitreStage: 'Lateral Movement',
          confidence: 99.7,
          riskScore: 9.9,
          description: `NetFlow 捕獲未授權 S7Comm (Port 102) 下發 Function 0x29 停機指令`,
          cve: 'ICS-VU-S7-2026'
        }
      };
    }

    if (flow.dstPort === 20000) {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-ICS-DNP3-015',
          signatureName: 'DNP3 智慧電網變電所冷啟動破壞指令攻擊',
          mitreTTP: 'T0816 Impair Process Control',
          mitreTactic: 'Inhibit Process Control',
          mitreStage: 'Execution',
          confidence: 99.5,
          riskScore: 9.9,
          description: '電網 SCADA 遙測連線 (Port 20000) 捕獲 Function 0x0D Cold Restart 強制重啟指令',
          cve: 'ICS-VU-DNP3-2026'
        }
      };
    }

    if (flow.dstPort === 3389 && (flow.packets || 0) > 3000) {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-BRUTE-RDP-012',
          signatureName: 'RDP / SMB 遠端桌面連線暴力密碼破解',
          mitreTTP: 'T1110.001 Password Guessing',
          mitreTactic: 'Credential Access',
          mitreStage: 'Lateral Movement',
          confidence: 98.1,
          riskScore: 8.9,
          description: 'RDP (Port 3389) 階段捕獲連續 NLA/CredSSP 憑證嘗試循環',
          cve: 'MITRE-T1110'
        }
      };
    }

    return { threatLevel: 'normal' };
  }

  private collectTick() {
    if (!this.config.enabled) return;

    // 1. Update stats for active flows (duration, packets, bytes)
    for (const flow of this.flowsBuffer) {
      if (flow.status === 'active') {
        const deltaPkts = Math.floor(Math.random() * 20) + 2;
        const deltaBytes = deltaPkts * (Math.floor(Math.random() * 800) + 200);
        flow.packets += deltaPkts;
        flow.bytes += deltaBytes;
        flow.durationMs += this.config.collectionIntervalMs;
        flow.bps = Math.floor((deltaBytes * 8) / (this.config.collectionIntervalMs / 1000));
        flow.pps = Math.floor(deltaPkts / (this.config.collectionIntervalMs / 1000));
      }
    }

    // 2. Synthesize new realistic traffic sampled from network topology
    const samplePool = [
      {
        srcIp: '10.88.88.101',
        srcPort: Math.floor(Math.random() * 15000) + 40000,
        srcDeviceId: 'ws-rd-02',
        srcDeviceName: 'RD-Engineer-WS02',
        dstIp: '10.88.88.10',
        dstPort: 443,
        dstDeviceId: 'srv-app-01',
        dstDeviceName: 'Web-App-Cluster-01',
        protocol: 'HTTPS' as const,
        bytes: Math.floor(Math.random() * 40000) + 12000,
        packets: Math.floor(Math.random() * 40) + 10,
        sampledInterface: 'Port-channel1 (Workstation Access Layer)'
      },
      {
        srcIp: '10.88.88.10',
        srcPort: 5432,
        srcDeviceId: 'srv-app-01',
        srcDeviceName: 'Web-App-Cluster-01',
        dstIp: '10.88.88.11',
        dstPort: 5432,
        dstDeviceId: 'srv-db-01',
        dstDeviceName: 'DB-Primary-Postgres',
        protocol: 'TCP' as const,
        bytes: Math.floor(Math.random() * 120000) + 30000,
        packets: Math.floor(Math.random() * 90) + 20,
        sampledInterface: 'GigabitEthernet1/0/24 (DMZ App Cluster)'
      },
      {
        srcIp: '10.88.88.105',
        srcPort: Math.floor(Math.random() * 10000) + 50000,
        srcDeviceId: 'ws-fin-05',
        srcDeviceName: 'Finance-Lead-WS05',
        dstIp: '10.88.88.2',
        dstPort: 53,
        dstDeviceId: 'srv-dns-01',
        dstDeviceName: 'Core-DNS-Server',
        protocol: 'DNS' as const,
        bytes: Math.floor(Math.random() * 2000) + 400,
        packets: Math.floor(Math.random() * 6) + 2,
        sampledInterface: 'Port-channel1 (Workstation Access Layer)'
      },
      {
        srcIp: '10.88.88.100',
        srcPort: Math.floor(Math.random() * 12000) + 45000,
        srcDeviceId: 'ws-sec-1',
        srcDeviceName: 'SOC-Analyst-WS01',
        dstIp: '10.88.88.12',
        dstPort: 22,
        dstDeviceId: 'srv-mgmt-01',
        dstDeviceName: 'Bastion-Host-SSH',
        protocol: 'SSH' as const,
        bytes: Math.floor(Math.random() * 15000) + 4000,
        packets: Math.floor(Math.random() * 18) + 4,
        sampledInterface: 'Port-channel1 (Workstation Access Layer)'
      },
      {
        srcIp: '10.88.99.10',
        srcPort: 48010,
        srcDeviceId: 'scada-hmi-01',
        srcDeviceName: 'SCADA-HMI-Master',
        dstIp: '10.88.99.20',
        dstPort: 502,
        dstDeviceId: 'plc-turb-01',
        dstDeviceName: 'Turbine-Controller-PLC',
        protocol: 'Modbus' as const,
        bytes: Math.floor(Math.random() * 8000) + 1200,
        packets: Math.floor(Math.random() * 12) + 4,
        sampledInterface: 'GigabitEthernet1/0/12 (OT Diode SCADA)'
      }
    ];

    // Pick 1 to 2 random samples
    const numSamples = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numSamples; i++) {
      const template = samplePool[Math.floor(Math.random() * samplePool.length)];
      const flowId = `flow-col-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newFlow: NetworkFlowRecord = {
        id: flowId,
        timestamp: new Date().toISOString(),
        srcIp: template.srcIp,
        srcPort: template.srcPort,
        srcDeviceId: template.srcDeviceId,
        srcDeviceName: template.srcDeviceName,
        dstIp: template.dstIp,
        dstPort: template.dstPort,
        dstDeviceId: template.dstDeviceId,
        dstDeviceName: template.dstDeviceName,
        protocol: template.protocol,
        bytes: template.bytes,
        packets: template.packets,
        durationMs: 1200,
        flags: ['ACK', 'PSH'],
        bps: Math.floor((template.bytes * 8) / 1.2),
        pps: Math.floor(template.packets / 1.2),
        threatLevel: 'normal',
        sampledInterface: template.sampledInterface,
        status: 'active'
      };

      globalFingerbankEngine.fingerprintFlow(newFlow);

      this.flowsBuffer.unshift(newFlow);
      this.totalFlowsCollected++;
      this.totalPacketsSampled += template.packets;
      this.totalBytesSampled += template.bytes;
    }

    // 3. Trim buffer
    if (this.flowsBuffer.length > this.config.maxFlowsBuffer) {
      this.flowsBuffer.splice(this.config.maxFlowsBuffer);
    }

    // 4. Update interface traffic metrics
    this.interfaces.forEach(iface => {
      const addedPkts = Math.floor(Math.random() * 140) + 20;
      const addedBytes = addedPkts * (Math.floor(Math.random() * 700) + 300);
      iface.rxPackets += addedPkts;
      iface.txPackets += Math.floor(addedPkts * 0.95);
      iface.rxBytes += addedBytes;
      iface.txBytes += Math.floor(addedBytes * 0.95);
      iface.flowCount = this.flowsBuffer.filter(f => f.sampledInterface === iface.name).length;
    });

    // 5. Broadcast to subscribers if connected
    if (this.broadcastCallback && numSamples > 0) {
      this.broadcastCallback({
        type: 'collector_tick',
        metrics: this.getMetrics()
      });
    }
  }

  public getMetrics(): FlowCollectorMetrics {
    const activeFlows = this.flowsBuffer.filter(f => f.status === 'active');
    const maliciousFlows = this.flowsBuffer.filter(f => f.threatLevel === 'malicious' && f.status === 'active');
    const suspiciousFlows = this.flowsBuffer.filter(f => f.threatLevel === 'suspicious');
    const blockedFlows = this.flowsBuffer.filter(f => f.status === 'blocked');

    const totalBps = activeFlows.reduce((acc, f) => acc + (f.bps || 0), 0);
    const totalPps = activeFlows.reduce((acc, f) => acc + (f.pps || 0), 0);

    return {
      isRunning: this.config.enabled,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      samplingRatio: this.config.samplingRatio,
      ingestionRatePps: totalPps || 18450,
      throughputBps: totalBps || 48200000,
      throughputMbps: Number(((totalBps || 48200000) / 1000000).toFixed(2)),
      totalPacketsSampled: this.totalPacketsSampled,
      totalBytesSampled: this.totalBytesSampled,
      totalFlowsCollected: this.totalFlowsCollected,
      activeFlowsCount: activeFlows.length,
      maliciousFlowsCount: maliciousFlows.length,
      suspiciousFlowsCount: suspiciousFlows.length,
      blockedFlowsCount: blockedFlows.length,
      bufferUtilizationPct: Number(((this.flowsBuffer.length / this.config.maxFlowsBuffer) * 100).toFixed(1)),
      workerThreads: 8,
      droppedPackets: this.droppedPackets,
      lastCollectionTimestamp: new Date().toISOString()
    };
  }
}

export const globalFlowCollectorEngine = new FlowCollectorEngine();

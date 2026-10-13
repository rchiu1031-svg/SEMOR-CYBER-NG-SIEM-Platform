import fs from 'fs';
import path from 'path';

export type PurdueLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L3.5' | 'L4';

export interface IndustrialAsset {
  id: string;
  name: string;
  purdueLevel: PurdueLevel;
  levelLabel: string;
  type: 'PLC' | 'HMI' | 'SCADA' | 'Historian' | 'Engineering-WS' | 'Sensor' | 'DCS' | 'RTU' | 'Gateway';
  vendor: string;
  model: string;
  firmware: string;
  ip: string;
  mac: string;
  zone: string;
  protocol: string;
  plcMode: 'RUN' | 'STOP' | 'PROGRAM' | 'N/A';
  status: 'Online' | 'Offline' | 'Alert' | 'Maintenance';
  cvssScore: number;
  cves: string[];
  lastSeen: string;
  ioPointsCount: number;
  tagsCount: number;
  fpcRecording: boolean;
}

export interface ICSProtocolCommand {
  id: string;
  timestamp: string;
  protocol: 'Modbus TCP' | 'S7Comm' | 'EtherNet/IP' | 'DNP3' | 'OPC UA' | 'MELSEC' | 'BACnet';
  source: string;
  sourceZone: string;
  destination: string;
  destZone: string;
  functionCode: string;
  functionDesc: string;
  payloadHex: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';
  isAnomaly: boolean;
  anomalyReason?: string;
  actionTaken: 'Allowed' | 'Blocked (TCP RST)' | 'Quarantined' | 'Alerted';
}

export interface ITtoOTIncident {
  id: string;
  title: string;
  titleEn: string;
  timestamp: string;
  risk: 'Critical' | 'High' | 'Medium';
  killChainStage: string;
  attackVector: string;
  attackerSrc: string;
  jumpHost: string;
  targetPLC: string;
  plcFunctionCode: string;
  impact: string;
  soarPlaybookStatus: 'Mitigated' | 'In Progress' | 'Awaiting Approval';
  description: string;
  descriptionEn: string;
  rawPcapId: string;
  mitigatedAt?: string;
  mitigationNotes?: string;
}

export interface ProcessSensorData {
  id: string;
  name: string;
  unit: string;
  currentValue: number;
  baselineMin: number;
  baselineMax: number;
  hazardCriticalLimit: number;
  status: 'Normal' | 'Warning' | 'Hazardous Critical';
  trend: number[];
  plcInfo: string;
}

export interface PurdueBoundaryRule {
  id: string;
  name: string;
  srcZone: string;
  destZone: string;
  protocol: string;
  allowedFunctionCodes: string[];
  action: 'DROP' | 'ALLOW' | 'INSPECT' | 'ALERT';
  enabled: boolean;
  description: string;
}

export interface OTTelemetrySummary {
  totalAssets: number;
  plcsCount: number;
  hmisCount: number;
  scadaServersCount: number;
  criticalAnomaliesCount: number;
  dpiThroughputGbps: number;
  processSafetyIndex: number;
  purdueBreakdown: Record<PurdueLevel, number>;
  protocolBreakdown: Record<string, number>;
  esdActive: boolean;
  fpcActive: boolean;
  lastInspectionTimestamp: string;
}

const CONFIG_FILE = path.join(process.cwd(), 'ot_security_config.json');

export class OTSecurityEngine {
  private assets: IndustrialAsset[] = [];
  private dpiCommands: ICSProtocolCommand[] = [];
  private incidents: ITtoOTIncident[] = [];
  private sensors: ProcessSensorData[] = [];
  private rules: PurdueBoundaryRule[] = [];
  private esdActive: boolean = false;
  private fpcActive: boolean = true;
  private simulationTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromDisk();
    this.startTelemetryLoop();
  }

  // --- DISK PERSISTENCE ---

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.assets)) this.assets = data.assets;
        if (Array.isArray(data.dpiCommands)) this.dpiCommands = data.dpiCommands;
        if (Array.isArray(data.incidents)) this.incidents = data.incidents;
        if (Array.isArray(data.sensors)) this.sensors = data.sensors;
        if (Array.isArray(data.rules)) this.rules = data.rules;
        if (typeof data.esdActive === 'boolean') this.esdActive = data.esdActive;
        if (typeof data.fpcActive === 'boolean') this.fpcActive = data.fpcActive;
        return;
      }
    } catch (e) {
      console.error('Failed to load ot_security_config.json, using baseline template:', e);
    }
    this.seedDefaultConfiguration();
    this.saveToDisk();
  }

  public saveToDisk(): void {
    try {
      const data = {
        updatedAt: new Date().toISOString(),
        esdActive: this.esdActive,
        fpcActive: this.fpcActive,
        assets: this.assets,
        dpiCommands: this.dpiCommands.slice(0, 100), // persist most recent 100 commands
        incidents: this.incidents,
        sensors: this.sensors,
        rules: this.rules
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save ot_security_config.json:', e);
    }
  }

  // --- DEFAULT SEED TEMPLATE ---

  private seedDefaultConfiguration(): void {
    this.assets = [
      {
        id: 'PLC-S7-1500-01',
        name: 'Siemens Simatic S7-1500 (Line 1 Cleanroom Heat Exchanger)',
        purdueLevel: 'L1',
        levelLabel: 'Level 1: 基礎製程控制 (Basic Process Control)',
        type: 'PLC',
        vendor: 'Siemens',
        model: 'CPU 1516-3 PN/DP',
        firmware: 'v2.9.4',
        ip: '192.168.50.10',
        mac: '00:1B:1B:34:A1:02',
        zone: 'Zone 1: FAB-Chemical (OT)',
        protocol: 'S7Comm / Profinet',
        plcMode: 'RUN',
        status: 'Alert',
        cvssScore: 8.8,
        cves: ['CVE-2022-38465', 'CVE-2020-15782'],
        lastSeen: '1 秒前',
        ioPointsCount: 128,
        tagsCount: 540,
        fpcRecording: true
      },
      {
        id: 'PLC-AB-5580-02',
        name: 'Rockwell ControlLogix 5580 (Gas Turbine Turbine VFD)',
        purdueLevel: 'L1',
        levelLabel: 'Level 1: 基礎製程控制 (Basic Process Control)',
        type: 'PLC',
        vendor: 'Rockwell Automation',
        model: '1756-L83ES GuardLogix',
        firmware: 'v33.011',
        ip: '192.168.50.11',
        mac: '00:00:BC:48:92:EF',
        zone: 'Zone 2: Power Generation (OT)',
        protocol: 'EtherNet/IP (CIP Safety)',
        plcMode: 'RUN',
        status: 'Online',
        cvssScore: 6.5,
        cves: ['CVE-2023-3595'],
        lastSeen: '3 秒前',
        ioPointsCount: 256,
        tagsCount: 820,
        fpcRecording: true
      },
      {
        id: 'RTU-SCH-M340',
        name: 'Schneider Modicon M340 (Water Treatment Pump Station)',
        purdueLevel: 'L1',
        levelLabel: 'Level 1: 基礎製程控制 (Basic Process Control)',
        type: 'RTU',
        vendor: 'Schneider Electric',
        model: 'BMX P34 2020',
        firmware: 'v3.40',
        ip: '192.168.50.15',
        mac: '00:80:F4:11:22:33',
        zone: 'Zone 3: Water Station (OT)',
        protocol: 'Modbus TCP',
        plcMode: 'RUN',
        status: 'Online',
        cvssScore: 7.2,
        cves: ['CVE-2021-22779'],
        lastSeen: '5 秒前',
        ioPointsCount: 64,
        tagsCount: 190,
        fpcRecording: true
      },
      {
        id: 'HMI-MAG-01',
        name: 'Schneider Magelis Industrial Touch Panel HMI',
        purdueLevel: 'L2',
        levelLabel: 'Level 2: 區域控制與人機操作介面 (Area Control & HMI)',
        type: 'HMI',
        vendor: 'Schneider Electric',
        model: 'HMIGTO5310',
        firmware: 'v6.2',
        ip: '192.168.50.20',
        mac: '00:80:F4:55:66:77',
        zone: 'Zone 1: FAB-Chemical (OT)',
        protocol: 'Modbus TCP / S7Comm',
        plcMode: 'N/A',
        status: 'Online',
        cvssScore: 5.4,
        cves: [],
        lastSeen: '2 秒前',
        ioPointsCount: 0,
        tagsCount: 420,
        fpcRecording: true
      },
      {
        id: 'SCADA-IGNITION-01',
        name: 'Inductive Automation Ignition SCADA Server',
        purdueLevel: 'L3',
        levelLabel: 'Level 3: 廠區運維管理與歷史庫 (Operations & Historian)',
        type: 'SCADA',
        vendor: 'Inductive Automation',
        model: 'Ignition Platform v8.1.33',
        firmware: 'Linux Enterprise 6.1',
        ip: '192.168.50.5',
        mac: '00:50:56:A1:B2:C3',
        zone: 'Zone 0: Core OT Control Room',
        protocol: 'OPC UA / MQTT Sparkplug B',
        plcMode: 'N/A',
        status: 'Online',
        cvssScore: 4.3,
        cves: [],
        lastSeen: '現在 (即時連線中)',
        ioPointsCount: 2048,
        tagsCount: 14500,
        fpcRecording: true
      },
      {
        id: 'JUMPBOX-IDMZ-01',
        name: 'iDMZ Bastion Jumpbox (Cross-Purdue Isolated Broker)',
        purdueLevel: 'L3.5',
        levelLabel: 'Level 3.5: 工控非軍事區跳板機 (Industrial DMZ)',
        type: 'Gateway',
        vendor: 'Fortinet / Debian Hardened',
        model: 'FortiGate 200F Virtual VM',
        firmware: 'v7.4.3',
        ip: '172.20.10.25',
        mac: '00:09:0F:78:90:AB',
        zone: 'iDMZ Perimeter Buffer Zone',
        protocol: 'HTTPS / SSH / WireGuard',
        plcMode: 'N/A',
        status: 'Alert',
        cvssScore: 8.1,
        cves: ['CVE-2024-21762'],
        lastSeen: '現在 (偵測到 RDP 連線)',
        ioPointsCount: 0,
        tagsCount: 0,
        fpcRecording: true
      }
    ];

    this.dpiCommands = [
      {
        id: 'DPI-2026-9041',
        timestamp: new Date().toLocaleTimeString() + '.102',
        protocol: 'Modbus TCP',
        source: '172.20.10.25 (iDMZ Jumpbox)',
        sourceZone: 'iDMZ',
        destination: '192.168.50.15 (Schneider M340)',
        destZone: 'OT Level 1',
        functionCode: '0x05 (Write Single Coil)',
        functionDesc: '強制覆寫第 104 號閥門線圈狀態 (Valve Coil #104 -> 0xFF00 ON)',
        payloadHex: '00 01 00 00 00 06 01 05 00 68 FF 00',
        riskLevel: 'Critical',
        isAnomaly: true,
        anomalyReason: '【越界異常】未授權的 iDMZ 來源對生產線 PLC 下發單一線圈強制寫入指令，疑似偽冒控制指令。',
        actionTaken: 'Blocked (TCP RST)'
      },
      {
        id: 'DPI-2026-9040',
        timestamp: new Date(Date.now() - 30000).toLocaleTimeString() + '.845',
        protocol: 'S7Comm',
        source: '192.168.50.80 (TIA Portal Eng-WS)',
        sourceZone: 'OT Level 3',
        destination: '192.168.50.10 (Siemens S7-1500)',
        destZone: 'OT Level 1',
        functionCode: '0x28 (PLC Stop CPU)',
        functionDesc: '發送停機指令至 CPU 1516-3 (PI-Service: _INSE, Stop request)',
        payloadHex: '03 00 00 21 02 F0 80 32 01 00 00 00 01 00 0E 00 00 28 00 00 00 00 00 00 FD 00 00 09 5F 49 4E 53 45',
        riskLevel: 'Critical',
        isAnomaly: true,
        anomalyReason: '【非維護時段停機】偵測到未在排程維護視窗內對核心潔淨室 PLC 下發 Stop CPU 指令。',
        actionTaken: 'Quarantined'
      },
      {
        id: 'DPI-2026-9039',
        timestamp: new Date(Date.now() - 65000).toLocaleTimeString() + '.410',
        protocol: 'S7Comm',
        source: '192.168.50.20 (Magelis HMI)',
        sourceZone: 'OT Level 2',
        destination: '192.168.50.10 (Siemens S7-1500)',
        destZone: 'OT Level 1',
        functionCode: '0x04 (Read Var / DB100)',
        functionDesc: '定期讀取溫度與壓力暫存器 DB100.DBD0 (Size: 64 bytes)',
        payloadHex: '03 00 00 1F 02 F0 80 32 01 00 00 00 02 00 0E 00 00 04 01 12 0A 10 02 00 10 00 64 84 00 00 00',
        riskLevel: 'Safe',
        isAnomaly: false,
        actionTaken: 'Allowed'
      },
      {
        id: 'DPI-2026-9038',
        timestamp: new Date(Date.now() - 110000).toLocaleTimeString() + '.220',
        protocol: 'EtherNet/IP',
        source: '192.168.50.5 (Ignition SCADA)',
        sourceZone: 'OT Level 3',
        destination: '192.168.50.11 (ControlLogix)',
        destZone: 'OT Level 1',
        functionCode: '0x4C (Read Tag Fragmented)',
        functionDesc: 'CIP 標籤讀取: Turbine_Speed_RPM_Realtime',
        payloadHex: '6F 00 18 00 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00',
        riskLevel: 'Safe',
        isAnomaly: false,
        actionTaken: 'Allowed'
      },
      {
        id: 'DPI-2026-9037',
        timestamp: new Date(Date.now() - 180000).toLocaleTimeString() + '.991',
        protocol: 'Modbus TCP',
        source: '10.10.12.44 (IT Admin Workstation)',
        sourceZone: 'IT Level 4',
        destination: '192.168.50.15 (Schneider M340)',
        destZone: 'OT Level 1',
        functionCode: '0x10 (Write Multiple Registers)',
        functionDesc: '直接嘗試繞過 iDMZ 寫入保持暫存器 40001-40010 (SetPoint Alteration)',
        payloadHex: '00 02 00 00 00 0B 01 10 00 01 00 02 04 13 88 00 00',
        riskLevel: 'Critical',
        isAnomaly: true,
        anomalyReason: '【Purdue 模型嚴重違規】直接從 IT 辦公網段 (10.10.12.x) 直連 OT Level 1 PLC 寫入製程數值，無經由 iDMZ 閘道！',
        actionTaken: 'Blocked (TCP RST)'
      }
    ];

    this.incidents = [
      {
        id: 'INC-OT-2026-0881',
        title: '跨 Purdue 模型 IT-to-OT 橫向移動與 S7-1500 停機企圖',
        titleEn: 'Cross-Purdue IT-to-OT Lateral Movement & S7-1500 Sabotage Attempt',
        timestamp: '2026-08-21 11:45:10',
        risk: 'Critical',
        killChainStage: 'T0855 - Unauthorized Command Message / Lateral IT->OT',
        attackVector: 'IT 釣魚失陷 (finance_adm) ➔ RDP 攻陷 iDMZ Jumpbox ➔ 偽造 S7Comm 指令',
        attackerSrc: '10.10.12.44 (Finance-WS-09 / IT)',
        jumpHost: '172.20.10.25 (iDMZ-Jumpbox-01)',
        targetPLC: '192.168.50.10 (Siemens S7-1500 CPU 1516)',
        plcFunctionCode: '0x28 (Stop CPU) + 0x05 (Coil Override)',
        impact: '可能導致半導體潔淨室溫控失控，影響整批 12 吋晶圓物理化學反應！',
        soarPlaybookStatus: 'Awaiting Approval',
        description: '攻擊者先攻陷 IT 辦公網段電腦，竊取 RDP 憑證登入工控非軍事區 (iDMZ) 跳板機，隨後透過工程編程協議直接向產線 PLC 下發 0x28 停機與冷卻閥門關閉指令。SEMOR Zeek-OT 深度解析即時捕獲並已透過 SDN 下發 TCP RST 中斷連線。',
        descriptionEn: 'Attacker pivot from compromised IT workstation via RDP to iDMZ jump host, issuing unauthorized Siemens S7Comm Stop CPU and valve disable commands to Cleanroom PLC.',
        rawPcapId: 'PCAP-ICS-20260821-0881.pcap'
      },
      {
        id: 'INC-OT-2026-0879',
        title: 'Schneider M340 Modbus 異常高頻功能碼掃描 (Reconnaissance)',
        titleEn: 'Schneider M340 Modbus High-Frequency Function Code Recon Sweep',
        timestamp: '2026-08-21 11:20:05',
        risk: 'High',
        killChainStage: 'T0846 - Discovery / Internet-Accessible Device / ICS Probing',
        attackVector: 'iDMZ 未知掃描腳本 (Modscan/S7Scan) 對 Level 1 廣播',
        attackerSrc: '172.20.10.99 (Rogue Laptop)',
        jumpHost: 'N/A',
        targetPLC: '192.168.50.15 (Modicon M340)',
        plcFunctionCode: 'FC01, FC02, FC03, FC04, FC43',
        impact: '工控通訊佇列飽和，造成 SCADA 採樣延遲增加 850ms。',
        soarPlaybookStatus: 'Mitigated',
        description: '檢測到非標準 SCADA 來源持續以每秒 400 次發送 Modbus 讀取與診斷指令，SOAR 劇本已將來源 IP 隔離並通報現場工程師。',
        descriptionEn: 'High frequency Modbus reconnaissance probe detected against water station PLC; automated rate limiting and MAC isolation applied.',
        rawPcapId: 'PCAP-ICS-20260821-0879.pcap'
      }
    ];

    this.sensors = [
      {
        id: 'SENS-CHEM-TEMP',
        name: '反應槽核心化學反應溫度 (Vessel Reaction Temp)',
        unit: '°C',
        currentValue: 88.4,
        baselineMin: 60.0,
        baselineMax: 80.0,
        hazardCriticalLimit: 95.0,
        status: 'Warning',
        trend: [65.2, 68.0, 71.5, 76.2, 82.0, 85.5, 88.4],
        plcInfo: 'PLC-S7-1500 (DB100.DBD4)'
      },
      {
        id: 'SENS-LINE1-PRESS',
        name: '晶圓潔淨室管線差壓 (Chamber Differential Pressure)',
        unit: 'kPa',
        currentValue: 142.6,
        baselineMin: 80.0,
        baselineMax: 120.0,
        hazardCriticalLimit: 160.0,
        status: 'Hazardous Critical',
        trend: [95.0, 102.0, 115.4, 128.0, 136.2, 140.0, 142.6],
        plcInfo: 'PLC-S7-1500 (DB100.DBD8)'
      },
      {
        id: 'SENS-TURB-RPM',
        name: '電力發電機燃氣渦輪轉速 (Gas Turbine RPM)',
        unit: 'RPM',
        currentValue: 3600,
        baselineMin: 3550,
        baselineMax: 3650,
        hazardCriticalLimit: 4100,
        status: 'Normal',
        trend: [3598, 3602, 3599, 3600, 3601, 3599, 3600],
        plcInfo: 'PLC-AB-5580 (Tag: Turb_RPM)'
      },
      {
        id: 'SENS-WATER-FLOW',
        name: '水處理冷卻迴路流量 (Cooling Loop Flow Rate)',
        unit: 'm³/h',
        currentValue: 420.5,
        baselineMin: 400.0,
        baselineMax: 480.0,
        hazardCriticalLimit: 250.0,
        status: 'Normal',
        trend: [430.0, 428.5, 425.0, 423.2, 422.0, 421.0, 420.5],
        plcInfo: 'RTU-SCH-M340 (Holding Reg 40012)'
      }
    ];

    this.rules = [
      {
        id: 'RULE-PURDUE-01',
        name: '嚴禁 IT 辦公網段直連 L1 控制層 (Direct IT-to-L1 Block)',
        srcZone: 'IT Level 4',
        destZone: 'OT Level 1',
        protocol: 'ALL',
        allowedFunctionCodes: [],
        action: 'DROP',
        enabled: true,
        description: '違反 ISA-95/Purdue 模型之跨層通訊，必須經過 iDMZ 隔離代理'
      },
      {
        id: 'RULE-PURDUE-02',
        name: '非授權 S7Comm Stop CPU 指令攔截',
        srcZone: '*',
        destZone: 'OT Level 1',
        protocol: 'S7Comm',
        allowedFunctionCodes: ['0x04', '0x05'],
        action: 'INSPECT',
        enabled: true,
        description: '任何下發 0x28 (Stop CPU) 必須具備雙因素工控審批與排程視窗'
      },
      {
        id: 'RULE-PURDUE-03',
        name: 'Modbus 寫入暫存器限制 (Write Coils & Registers)',
        srcZone: 'iDMZ',
        destZone: 'OT Level 1',
        protocol: 'Modbus TCP',
        allowedFunctionCodes: ['0x01', '0x02', '0x03', '0x04'],
        action: 'INSPECT',
        enabled: true,
        description: '僅允許白名單 HMI/SCADA 讀取指令，嚴禁未授權寫入 0x05/0x06/0x10'
      }
    ];
  }

  // --- BACKGROUND TELEMETRY LOOP ---

  private startTelemetryLoop(): void {
    if (this.simulationTimer) clearInterval(this.simulationTimer);

    this.simulationTimer = setInterval(() => {
      // Gentle fluctuation of sensor metrics unless in ESD
      this.sensors = this.sensors.map(s => {
        if (this.esdActive) {
          // If ESD triggered, bring sensors to safe cold baseline
          const safeTarget = (s.baselineMin + s.baselineMax) / 2;
          const delta = (safeTarget - s.currentValue) * 0.15;
          const newVal = Number((s.currentValue + delta).toFixed(1));
          return {
            ...s,
            currentValue: newVal,
            trend: [...s.trend.slice(1), newVal],
            status: 'Normal'
          };
        }

        const delta = (Math.random() - 0.48) * 0.8;
        const newVal = Number((s.currentValue + delta).toFixed(1));
        const newTrend = [...s.trend.slice(1), newVal];
        let status: 'Normal' | 'Warning' | 'Hazardous Critical' = 'Normal';

        if (newVal > s.hazardCriticalLimit || newVal < s.baselineMin * 0.8) {
          status = 'Hazardous Critical';
        } else if (newVal > s.baselineMax || newVal < s.baselineMin) {
          status = 'Warning';
        }

        return {
          ...s,
          currentValue: newVal,
          trend: newTrend,
          status
        };
      });
    }, 3000);
  }

  // --- API SERVICE METHODS ---

  public getTelemetrySummary(): OTTelemetrySummary {
    const purdueBreakdown: Record<PurdueLevel, number> = {
      'L0': 0, 'L1': 0, 'L2': 0, 'L3': 0, 'L3.5': 0, 'L4': 0
    };
    const protocolBreakdown: Record<string, number> = {};

    this.assets.forEach(a => {
      if (purdueBreakdown[a.purdueLevel] !== undefined) {
        purdueBreakdown[a.purdueLevel]++;
      }
      const proto = a.protocol.split(' ')[0] || 'Other';
      protocolBreakdown[proto] = (protocolBreakdown[proto] || 0) + 1;
    });

    const plcsCount = this.assets.filter(a => a.type === 'PLC').length;
    const hmisCount = this.assets.filter(a => a.type === 'HMI').length;
    const scadaServersCount = this.assets.filter(a => a.type === 'SCADA').length;
    const criticalAnomaliesCount = this.dpiCommands.filter(c => c.riskLevel === 'Critical' && c.isAnomaly).length;

    // Safety calculation: 100 - (warnings * 2 + critical * 5)
    const warningCount = this.sensors.filter(s => s.status === 'Warning').length;
    const criticalHazardCount = this.sensors.filter(s => s.status === 'Hazardous Critical').length;
    const processSafetyIndex = Math.max(0, Math.min(100, Number((100 - warningCount * 2.5 - criticalHazardCount * 8.5).toFixed(1))));

    return {
      totalAssets: this.assets.length,
      plcsCount,
      hmisCount,
      scadaServersCount,
      criticalAnomaliesCount,
      dpiThroughputGbps: 1.48,
      processSafetyIndex,
      purdueBreakdown,
      protocolBreakdown,
      esdActive: this.esdActive,
      fpcActive: this.fpcActive,
      lastInspectionTimestamp: new Date().toISOString()
    };
  }

  // ASSETS CRUD
  public getAssets(filters?: { purdueLevel?: string; protocol?: string; vendor?: string; search?: string }): IndustrialAsset[] {
    let result = [...this.assets];
    if (!filters) return result;

    if (filters.purdueLevel && filters.purdueLevel !== 'all') {
      result = result.filter(a => a.purdueLevel === filters.purdueLevel);
    }
    if (filters.protocol && filters.protocol !== 'all') {
      result = result.filter(a => a.protocol.toLowerCase().includes(filters.protocol!.toLowerCase()));
    }
    if (filters.vendor && filters.vendor !== 'all') {
      result = result.filter(a => a.vendor.toLowerCase().includes(filters.vendor!.toLowerCase()));
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.ip.includes(q) ||
        a.vendor.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.zone.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getAssetById(id: string): IndustrialAsset | undefined {
    return this.assets.find(a => a.id === id);
  }

  public updateAssetStatus(id: string, updates: Partial<IndustrialAsset>): IndustrialAsset | null {
    const idx = this.assets.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.assets[idx] = { ...this.assets[idx], ...updates, lastSeen: '剛剛' };
    this.saveToDisk();
    return this.assets[idx];
  }

  public createAsset(asset: Partial<IndustrialAsset>): IndustrialAsset {
    const newAsset: IndustrialAsset = {
      id: asset.id || `PLC-GEN-${Date.now().toString().slice(-4)}`,
      name: asset.name || 'New Industrial Device',
      purdueLevel: asset.purdueLevel || 'L1',
      levelLabel: asset.levelLabel || 'Level 1: 基礎製程控制 (Basic Process Control)',
      type: asset.type || 'PLC',
      vendor: asset.vendor || 'Generic ICS',
      model: asset.model || 'Standard Controller',
      firmware: asset.firmware || 'v1.0.0',
      ip: asset.ip || '192.168.50.99',
      mac: asset.mac || '00:1A:2B:3C:4D:5E',
      zone: asset.zone || 'Zone 1: OT General',
      protocol: asset.protocol || 'Modbus TCP',
      plcMode: asset.plcMode || 'RUN',
      status: asset.status || 'Online',
      cvssScore: asset.cvssScore || 0,
      cves: asset.cves || [],
      lastSeen: '剛剛',
      ioPointsCount: asset.ioPointsCount || 16,
      tagsCount: asset.tagsCount || 32,
      fpcRecording: asset.fpcRecording ?? true
    };
    this.assets.unshift(newAsset);
    this.saveToDisk();
    return newAsset;
  }

  // DPI COMMANDS
  public getDpiCommands(filters?: { protocol?: string; isAnomaly?: boolean; riskLevel?: string; limit?: number }): ICSProtocolCommand[] {
    let list = [...this.dpiCommands];
    if (filters?.protocol && filters.protocol !== 'all') {
      list = list.filter(c => c.protocol.toLowerCase().includes(filters.protocol!.toLowerCase()));
    }
    if (filters?.isAnomaly !== undefined) {
      list = list.filter(c => c.isAnomaly === filters.isAnomaly);
    }
    if (filters?.riskLevel && filters.riskLevel !== 'all') {
      list = list.filter(c => c.riskLevel.toLowerCase() === filters.riskLevel!.toLowerCase());
    }
    const limit = filters?.limit || 50;
    return list.slice(0, limit);
  }

  public getDpiCommandById(id: string): ICSProtocolCommand | undefined {
    return this.dpiCommands.find(c => c.id === id);
  }

  public injectDpiCommand(commandPayload?: Partial<ICSProtocolCommand>): ICSProtocolCommand {
    const randomHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const defaultPayload = commandPayload?.payloadHex || `00 0${Math.floor(Math.random() * 9 + 1)} 00 00 00 06 01 05 00 ${randomHex()} FF 00`;

    const newCmd: ICSProtocolCommand = {
      id: `DPI-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: new Date().toLocaleTimeString() + '.' + Math.floor(Math.random() * 900 + 100),
      protocol: commandPayload?.protocol || 'Modbus TCP',
      source: commandPayload?.source || '10.10.12.44 (IT Compromised WS)',
      sourceZone: commandPayload?.sourceZone || 'IT Level 4',
      destination: commandPayload?.destination || '192.168.50.15 (Schneider M340)',
      destZone: commandPayload?.destZone || 'OT Level 1',
      functionCode: commandPayload?.functionCode || '0x05 (Force Coil Emergency Flush)',
      functionDesc: commandPayload?.functionDesc || '【模擬注入】強制觸發緊急洩壓閥門打開 (Coil #0099 = ON)',
      payloadHex: defaultPayload,
      riskLevel: commandPayload?.riskLevel || 'Critical',
      isAnomaly: commandPayload?.isAnomaly ?? true,
      anomalyReason: commandPayload?.anomalyReason || '【未授權 IT 寫入】經由跨層未過濾通道直達 PLC，已由 Zeek-OT 實時特徵比對攔截！',
      actionTaken: commandPayload?.actionTaken || 'Blocked (TCP RST)'
    };

    this.dpiCommands.unshift(newCmd);
    if (this.dpiCommands.length > 200) this.dpiCommands = this.dpiCommands.slice(0, 200);
    this.saveToDisk();
    return newCmd;
  }

  // INCIDENTS & SOAR PLAYBOOKS
  public getIncidents(): ITtoOTIncident[] {
    return this.incidents;
  }

  public getIncidentById(id: string): ITtoOTIncident | undefined {
    return this.incidents.find(i => i.id === id);
  }

  public mitigateIncident(id: string, notes?: string): { success: boolean; incident?: ITtoOTIncident; error?: string } {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) return { success: false, error: 'Incident not found' };

    inc.soarPlaybookStatus = 'Mitigated';
    inc.mitigatedAt = new Date().toISOString();
    inc.mitigationNotes = notes || '已自動阻斷 iDMZ 跳板機 (172.20.10.25) 連線、隔離來源 IP 並下發 SDN 防火牆規則。';

    // Also update target PLC status if affected
    const targetAsset = this.assets.find(a => a.ip === inc.targetPLC.split(' ')[0]);
    if (targetAsset && targetAsset.status === 'Alert') {
      targetAsset.status = 'Online';
    }

    this.saveToDisk();
    return { success: true, incident: inc };
  }

  // SENSORS
  public getSensors(): ProcessSensorData[] {
    return this.sensors;
  }

  public updateSensorThresholds(id: string, baselineMin: number, baselineMax: number, hazardLimit: number): ProcessSensorData | null {
    const sensor = this.sensors.find(s => s.id === id);
    if (!sensor) return null;
    sensor.baselineMin = baselineMin;
    sensor.baselineMax = baselineMax;
    sensor.hazardCriticalLimit = hazardLimit;
    this.saveToDisk();
    return sensor;
  }

  // EMERGENCY SHUTDOWN (ESD)
  public triggerEmergencyShutdown(operatorName = 'Supervisor / SOC Lead'): { success: boolean; esdActive: boolean; message: string } {
    this.esdActive = true;
    // Set all L1 PLCs to safe programmed mode or STOP
    this.assets.forEach(a => {
      if (a.purdueLevel === 'L1') {
        a.plcMode = 'STOP';
        a.status = 'Maintenance';
      }
    });

    const esdIncident: ITtoOTIncident = {
      id: `INC-ESD-${Date.now().toString().slice(-4)}`,
      title: '工控安全緊急停機 (Emergency Shutdown - ESD) 觸發',
      titleEn: 'Industrial Emergency Shutdown (ESD) System Tripped',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      risk: 'Critical',
      killChainStage: 'Emergency Containment / Safety Interlock',
      attackVector: '安全主管操作台人工手動觸發 或 物理參數超標聯鎖',
      attackerSrc: 'SOC Emergency Center',
      jumpHost: 'N/A',
      targetPLC: '全廠 L1/L2 PLC 控制器',
      plcFunctionCode: 'ESD_TRIP_ALL',
      impact: '所有化學反應槽與高壓管線已依標準停機程控進行洩壓安全隔離。',
      soarPlaybookStatus: 'Mitigated',
      description: `操作員 [${operatorName}] 觸發全廠緊急安全停機 (ESD)，所有產線 PLC 轉入 STOP 安全保護狀態。`,
      descriptionEn: `Operator [${operatorName}] triggered plant-wide Emergency Shutdown (ESD). All PLCs switched to STOP state.`,
      rawPcapId: 'PCAP-ESD-EMERGENCY.pcap',
      mitigatedAt: new Date().toISOString()
    };
    this.incidents.unshift(esdIncident);

    this.saveToDisk();
    return {
      success: true,
      esdActive: true,
      message: '全廠緊急安全停機 (ESD) 成功啟動，所有製程控制器已轉入安全 STOP 模式！'
    };
  }

  public resetEmergencyShutdown(): { success: boolean; esdActive: boolean; message: string } {
    this.esdActive = false;
    this.assets.forEach(a => {
      if (a.purdueLevel === 'L1') {
        a.plcMode = 'RUN';
        a.status = 'Online';
      }
    });
    this.saveToDisk();
    return {
      success: true,
      esdActive: false,
      message: '已解除緊急停機狀態，各工控 PLC 已恢復常態運轉。'
    };
  }

  // RULES
  public getRules(): PurdueBoundaryRule[] {
    return this.rules;
  }

  public updateRule(id: string, updates: Partial<PurdueBoundaryRule>): PurdueBoundaryRule | null {
    const idx = this.rules.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.rules[idx] = { ...this.rules[idx], ...updates };
    this.saveToDisk();
    return this.rules[idx];
  }
}

// Global Singleton Instance
export const otSecurityEngine = new OTSecurityEngine();

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Factory,
  ShieldAlert,
  Activity,
  Cpu,
  Layers,
  HardDrive,
  Radio,
  Download,
  RefreshCw,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  FileText,
  Terminal,
  Sliders,
  Gauge,
  Zap,
  Settings,
  Database,
  Network,
  Server,
  Workflow,
  Brain,
  ExternalLink,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  Copy,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Share2,
  Code,
  Flame,
  Thermometer,
  Droplets,
  RotateCw,
  Power,
  FileCode,
  Box,
  Monitor,
  Binary,
  X,
  Target,
  Maximize2,
  ArrowRight,
  Wifi,
  WifiOff,
  User,
  SlidersHorizontal,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- DATA TYPES & DEFINITIONS ---

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

// Mock Purdue Level Assets
const INITIAL_ASSETS: IndustrialAsset[] = [
  // Level 1: PLCs & Controllers
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
    cvssScore: 7.5,
    cves: ['CVE-2021-22779'],
    lastSeen: '2 秒前',
    ioPointsCount: 64,
    tagsCount: 210,
    fpcRecording: true
  },
  {
    id: 'PLC-OMRON-NJ501',
    name: 'Omron Sysmac NJ501 (Wafer Handling Robot Arm)',
    purdueLevel: 'L1',
    levelLabel: 'Level 1: 基礎製程控制 (Basic Process Control)',
    type: 'PLC',
    vendor: 'Omron',
    model: 'NJ501-1400',
    firmware: 'v1.45',
    ip: '192.168.50.18',
    mac: '00:00:0A:78:9B:CD',
    zone: 'Zone 1: FAB-Chemical (OT)',
    protocol: 'EtherNet/IP / FINS',
    plcMode: 'RUN',
    status: 'Online',
    cvssScore: 5.3,
    cves: ['CVE-2022-30563'],
    lastSeen: '1 秒前',
    ioPointsCount: 96,
    tagsCount: 380,
    fpcRecording: true
  },

  // Level 2: Supervisory HMI & Workstations
  {
    id: 'HMI-MAGELIS-01',
    name: 'Schneider Harmony Magelis GTU (Operator Console 01)',
    purdueLevel: 'L2',
    levelLabel: 'Level 2: 操作員監視控制 (HMI / Control Panels)',
    type: 'HMI',
    vendor: 'Schneider Electric',
    model: 'HMIGTU / Vijeo Designer',
    firmware: 'v6.2.SP11',
    ip: '192.168.50.20',
    mac: '00:80:F4:99:88:77',
    zone: 'Zone 1: Control Room (OT)',
    protocol: 'Modbus TCP / S7Comm',
    plcMode: 'N/A',
    status: 'Alert',
    cvssScore: 7.8,
    cves: ['CVE-2022-45788'],
    lastSeen: '即時',
    ioPointsCount: 0,
    tagsCount: 1200,
    fpcRecording: true
  },
  {
    id: 'HMI-SIEMENS-TP1200',
    name: 'Siemens SIMATIC Comfort Panel TP1200',
    purdueLevel: 'L2',
    levelLabel: 'Level 2: 操作員監視控制 (HMI / Control Panels)',
    type: 'HMI',
    vendor: 'Siemens',
    model: 'TP1200 Comfort',
    firmware: 'v17.0.0.5',
    ip: '192.168.50.22',
    mac: '00:1B:1B:77:66:55',
    zone: 'Zone 2: Control Room (OT)',
    protocol: 'S7Comm / Profinet',
    plcMode: 'N/A',
    status: 'Online',
    cvssScore: 4.8,
    cves: [],
    lastSeen: '即時',
    ioPointsCount: 0,
    tagsCount: 850,
    fpcRecording: true
  },

  // Level 3: Site Operations & SCADA
  {
    id: 'SCADA-IGNITION-CORE',
    name: 'Inductive Automation Ignition SCADA Primary Node',
    purdueLevel: 'L3',
    levelLabel: 'Level 3: 廠區運營與監控 (Site Operations & SCADA)',
    type: 'SCADA',
    vendor: 'Inductive Automation',
    model: 'Ignition 8.1.32 Gateway',
    firmware: 'v8.1.32',
    ip: '192.168.50.5',
    mac: '00:50:56:A1:B2:C3',
    zone: 'Zone 0: Central OT Server Farm',
    protocol: 'OPC UA / MQTT Sparkplug B',
    plcMode: 'N/A',
    status: 'Online',
    cvssScore: 3.2,
    cves: [],
    lastSeen: '即時',
    ioPointsCount: 0,
    tagsCount: 45000,
    fpcRecording: true
  },
  {
    id: 'ENG-WS-TIA-PORTAL',
    name: 'Siemens TIA Portal v18 Engineering Workstation',
    purdueLevel: 'L3',
    levelLabel: 'Level 3: 廠區運營與監控 (Site Operations & SCADA)',
    type: 'Engineering-WS',
    vendor: 'Dell Precision / Siemens TIA',
    model: 'Precision 5820 Win11 LTSC',
    firmware: 'TIA Portal v18.0',
    ip: '192.168.50.80',
    mac: 'B4:2E:99:C1:D2:E3',
    zone: 'Zone 0: Engineering VLAN',
    protocol: 'S7Comm / WinCC / RDP',
    plcMode: 'N/A',
    status: 'Alert',
    cvssScore: 9.1,
    cves: ['CVE-2023-28489', 'CVE-2024-22120'],
    lastSeen: '5 秒前',
    ioPointsCount: 0,
    tagsCount: 0,
    fpcRecording: true
  },

  // Level 3.5: Industrial DMZ (iDMZ)
  {
    id: 'IDMZ-HISTORIAN-OSI',
    name: 'OSIsoft PI System Data Historian (iDMZ Read-Only Replica)',
    purdueLevel: 'L3.5',
    levelLabel: 'Level 3.5: 工控非軍事區 (Industrial DMZ / iDMZ)',
    type: 'Historian',
    vendor: 'AVEVA / OSIsoft',
    model: 'PI Server 2023',
    firmware: 'v2023.2',
    ip: '172.20.10.5',
    mac: '00:50:56:88:99:AA',
    zone: 'iDMZ: Historian DMZ',
    protocol: 'HTTPS / OPC UA TCP',
    plcMode: 'N/A',
    status: 'Online',
    cvssScore: 2.1,
    cves: [],
    lastSeen: '即時',
    ioPointsCount: 0,
    tagsCount: 120000,
    fpcRecording: true
  },
  {
    id: 'IDMZ-JUMPBOX-01',
    name: 'Guacamole / CyberArk OT Access Bastion Jumpbox',
    purdueLevel: 'L3.5',
    levelLabel: 'Level 3.5: 工控非軍事區 (Industrial DMZ / iDMZ)',
    type: 'Gateway',
    vendor: 'Apache Guacamole / Linux',
    model: 'Ubuntu 22.04 LTS Hardened',
    firmware: 'v1.5.4-hardened',
    ip: '172.20.10.25',
    mac: '00:50:56:44:55:66',
    zone: 'iDMZ: Secure Jumpbox Subnet',
    protocol: 'SSH / HTTPS / RDP-Proxy',
    plcMode: 'N/A',
    status: 'Alert',
    cvssScore: 8.4,
    cves: ['CVE-2024-21626'],
    lastSeen: '即時',
    ioPointsCount: 0,
    tagsCount: 0,
    fpcRecording: true
  },

  // Level 0: Field Devices & Sensors
  {
    id: 'FIELD-SENSOR-PRESS-01',
    name: 'Honeywell ST 800 Differential Pressure Transmitter',
    purdueLevel: 'L0',
    levelLabel: 'Level 0: 物理現地感測與執行器 (Physical Process / Sensors)',
    type: 'Sensor',
    vendor: 'Honeywell',
    model: 'STD800 SmartLine',
    firmware: 'v4.12',
    ip: '4-20mA / HART to 192.168.50.30',
    mac: 'N/A (Fieldbus Gateway)',
    zone: 'Zone 1: Reaction Vessel Chamber',
    protocol: 'HART / Modbus-RTU Gateway',
    plcMode: 'N/A',
    status: 'Alert',
    cvssScore: 7.2,
    cves: [],
    lastSeen: '1 秒前',
    ioPointsCount: 1,
    tagsCount: 4,
    fpcRecording: true
  }
];

// Mock DPI ICS Commands
const INITIAL_DPI_COMMANDS: ICSProtocolCommand[] = [
  {
    id: 'DPI-2026-9041',
    timestamp: '11:58:44.102',
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
    timestamp: '11:58:12.845',
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
    timestamp: '11:57:30.410',
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
    timestamp: '11:56:15.220',
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
    timestamp: '11:54:02.991',
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

// Mock IT/OT Cross-Zone Kill Chain
const INITIAL_INCIDENTS: ITtoOTIncident[] = [
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

// Mock Sensors Data
const INITIAL_SENSORS: ProcessSensorData[] = [
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

export default function OTSecurityView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'purdue' | 'inventory' | 'dpi' | 'killchain' | 'safety' | 'fpc'>('purdue');
  
  // Data states
  const [assets, setAssets] = useState<IndustrialAsset[]>(INITIAL_ASSETS);
  const [dpiCommands, setDpiCommands] = useState<ICSProtocolCommand[]>(INITIAL_DPI_COMMANDS);
  const [incidents, setIncidents] = useState<ITtoOTIncident[]>(INITIAL_INCIDENTS);
  const [sensors, setSensors] = useState<ProcessSensorData[]>(INITIAL_SENSORS);
  
  // Filter & Selection States
  const [selectedAsset, setSelectedAsset] = useState<IndustrialAsset | null>(INITIAL_ASSETS[0]);
  const [selectedIncident, setSelectedIncident] = useState<ITtoOTIncident | null>(INITIAL_INCIDENTS[0]);
  const [selectedDpiCmd, setSelectedDpiCmd] = useState<ICSProtocolCommand | null>(INITIAL_DPI_COMMANDS[0]);
  const [filterPurdue, setFilterPurdue] = useState<string>('all');
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive Simulation & Action States
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Simulate Live ICS Packet Ingestion
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      // randomly update sensor subtle fluctuations
      setSensors(prev => prev.map(s => {
        const delta = (Math.random() - 0.48) * 0.8;
        const newVal = Number((s.currentValue + delta).toFixed(1));
        const newTrend = [...s.trend.slice(1), newVal];
        let status: 'Normal' | 'Warning' | 'Hazardous Critical' = 'Normal';
        if (newVal > s.hazardCriticalLimit || newVal < s.baselineMin * 0.8) status = 'Hazardous Critical';
        else if (newVal > s.baselineMax || newVal < s.baselineMin) status = 'Warning';
        return { ...s, currentValue: newVal, trend: newTrend, status };
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Inject Simulated Malicious ICS Command
  const handleInjectAttack = () => {
    const newCmd: ICSProtocolCommand = {
      id: `DPI-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: new Date().toLocaleTimeString() + '.' + Math.floor(Math.random() * 900 + 100),
      protocol: 'Modbus TCP',
      source: '10.10.12.44 (IT Compromised WS)',
      sourceZone: 'IT Level 4',
      destination: '192.168.50.15 (Schneider M340)',
      destZone: 'OT Level 1',
      functionCode: '0x05 (Force Coil Emergency Flush)',
      functionDesc: '【模擬注入】強制觸發緊急洩壓閥門打開 (Coil #0099 = ON)',
      payloadHex: '00 09 00 00 00 06 01 05 00 63 FF 00',
      riskLevel: 'Critical',
      isAnomaly: true,
      anomalyReason: '【未授權 IT 寫入】經由跨層未過濾通道直達 PLC，已由 Zeek-OT 實時特徵比對攔截！',
      actionTaken: 'Blocked (TCP RST)'
    };

    setDpiCommands(prev => [newCmd, ...prev]);
    showToast(isZh ? '🚨 已成功模擬注入跨 Purdue 模型之未授權 Modbus 寫入攻擊！' : '🚨 Injected unauthorized Modbus write command across Purdue layers!');
  };

  // Approve SOAR Containment for Incident
  const handleApproveMitigation = (incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          soarPlaybookStatus: 'Mitigated'
        };
      }
      return inc;
    }));
    showToast(isZh ? `✅ 已核准執行工控隔離劇本：已斷開 iDMZ 跳板機並封鎖 IT 直連 OT 路由！` : `✅ Approved OT containment playbook for ${incidentId}.`);
  };

  // Filtered Assets
  const filteredAssets = assets.filter(a => {
    const matchPurdue = filterPurdue === 'all' || a.purdueLevel === filterPurdue;
    const matchProto = filterProtocol === 'all' || a.protocol.includes(filterProtocol);
    const matchSearch = searchQuery === '' || 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.ip.includes(searchQuery) || 
      a.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPurdue && matchProto && matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-gray-100 pb-12">
      
      {/* TOAST ALERT */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0f1422] border border-orange-500/60 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
            <ShieldAlert className="text-orange-400" size={20} />
            <span className="text-xs font-bold font-mono tracking-wide">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER: TITLE & OT TELEMETRY STATS */}
      <div className="bg-[#0c0f18] border border-gray-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-600/20 border border-orange-500/40 rounded-xl shadow-inner">
                <Factory className="w-7 h-7 text-orange-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                    {isZh ? 'SEMOR 工業控制安全 (ICS / OT Security Center)' : 'SEMOR Industrial Control Security (ICS / OT)'}
                  </h2>
                  <span className="text-[10px] font-black uppercase font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    Purdue L0-L4 Active
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                  {isZh 
                    ? '基於 SPAN/TAP 鏡像非侵入式側錄，深度解析 S7Comm、Modbus、CIP 與 OPC UA 工控指令，即時阻斷 IT-to-OT 橫向滲透。' 
                    : 'Non-intrusive SPAN/TAP deep packet inspection for S7Comm, Modbus, CIP, and OPC UA with real-time IT-to-OT breach containment.'}
                </p>
              </div>
            </div>
          </div>

          {/* TELEMETRY GAUGES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/60 border border-gray-800 p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Cpu size={13} className="text-blue-400" />
                {isZh ? 'OT 工控資產清冊' : 'OT Assets'}
              </div>
              <div className="text-xl font-black text-blue-400 font-mono mt-0.5">1,248</div>
              <div className="text-[9px] text-gray-400 font-mono">{isZh ? '42 台 PLC / 18 組 HMI' : '42 PLCs / 18 HMIs'}</div>
            </div>

            <div className="bg-black/60 border border-gray-800 p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={13} className="text-red-400" />
                {isZh ? '工控異常指令告警' : 'ICS Anomalies'}
              </div>
              <div className="text-xl font-black text-red-400 font-mono mt-0.5">3 CRITICAL</div>
              <div className="text-[9px] text-gray-400 font-mono">{isZh ? '已主動 TCP RST 阻斷' : 'Auto-Blocked'}</div>
            </div>

            <div className="bg-black/60 border border-gray-800 p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Activity size={13} className="text-green-400" />
                {isZh ? '側錄傳輸流量' : 'DPI Telemetry'}
              </div>
              <div className="text-xl font-black text-[#00FF66] font-mono mt-0.5">1.48 Gbps</div>
              <div className="text-[9px] text-gray-400 font-mono">{isZh ? 'Arkime FPC 零丟包' : '0% Packet Loss'}</div>
            </div>

            <div className="bg-black/60 border border-gray-800 p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Gauge size={13} className="text-amber-400" />
                {isZh ? '物理製程安全指數' : 'Process Safety'}
              </div>
              <div className="text-xl font-black text-amber-400 font-mono mt-0.5">98.2%</div>
              <div className="text-[9px] text-gray-400 font-mono">{isZh ? '1 組差壓預警中' : '1 Warning Tag'}</div>
            </div>
          </div>
        </div>

        {/* PRIMARY SUB-NAVIGATION TABS */}
        <div className="mt-8 flex bg-black/70 p-1.5 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar gap-1">
          {[
            { id: 'purdue', label: isZh ? 'Purdue 模型與工控拓撲' : 'Purdue Model & Topology', icon: <Layers size={14} /> },
            { id: 'inventory', label: isZh ? 'OT 資產清冊與韌體漏洞' : 'Asset Inventory & CVEs', icon: <Box size={14} /> },
            { id: 'dpi', label: isZh ? '工控協定 DPI 與指令審計' : 'ICS Protocol DPI & Commands', icon: <Binary size={14} /> },
            { id: 'killchain', label: isZh ? 'IT-to-OT 跨區攻擊鏈關聯' : 'IT/OT Kill-Chain Correlation', icon: <Share2 size={14} /> },
            { id: 'safety', label: isZh ? '物理製程遙測與安全閾值' : 'Process Safety & Sensor Limits', icon: <Gauge size={14} /> },
            { id: 'fpc', label: isZh ? 'Arkime 全封包側錄與 Zeek 規則' : 'Arkime FPC & Zeek Engine', icon: <HardDrive size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap font-mono",
                activeTab === tab.id 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30 border border-orange-400/30" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'dpi' && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PURDUE MODEL & LIVE TOPOLOGY */}
      {/* ========================================================================= */}
      {activeTab === 'purdue' && (
        <div className="space-y-8">
          
          {/* PURDUE LEVEL SUMMARY HERO */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { level: 'Level 4/5', name: isZh ? '企業 IT 辦公網' : 'Enterprise IT', color: 'border-blue-500/40 bg-blue-950/20 text-blue-400', items: 'AD, ERP, Workstations' },
              { level: 'Level 3.5', name: isZh ? '工控非軍事區 (iDMZ)' : 'Industrial DMZ', color: 'border-purple-500/40 bg-purple-950/20 text-purple-400', items: 'Historian, Bastion Jumpbox' },
              { level: 'Level 3', name: isZh ? '廠區運營與 SCADA' : 'Site Ops & SCADA', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400', items: 'Ignition, TIA Eng-WS, OPC UA' },
              { level: 'Level 2', name: isZh ? '操作員控制 HMI' : 'Supervisory HMI', color: 'border-amber-500/40 bg-amber-950/20 text-amber-400', items: 'Magelis, Comfort Panels' },
              { level: 'Level 1/0', name: isZh ? 'PLC 控制器與感測器' : 'PLCs & Field Devices', color: 'border-orange-500/40 bg-orange-950/20 text-orange-400', items: 'S7-1500, ControlLogix, M340' },
            ].map((p, idx) => (
              <div key={idx} className={cn("p-4 rounded-xl border flex flex-col justify-between", p.color)}>
                <div>
                  <div className="text-[10px] font-mono font-black uppercase opacity-75">{p.level}</div>
                  <h4 className="text-xs font-black text-white mt-1">{p.name}</h4>
                </div>
                <div className="text-[9px] font-mono text-gray-400 mt-2 truncate">{p.items}</div>
              </div>
            ))}
          </div>

          {/* VISUAL PURDUE INTERACTIVE TOPOLOGY */}
          <div className="bg-[#090d15] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-gray-800 gap-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="text-orange-400" size={18} />
                  {isZh ? 'Purdue Enterprise 階層式工控隔離與實時流量拓撲' : 'Purdue Enterprise Reference Architecture (PERA) Live Map'}
                </h3>
                <p className="text-[11px] text-gray-400 font-mono mt-1">
                  {isZh ? '即時監控跨層通訊通道，紅色虛線表示偵測到未授權越界存取 (Purdue Boundary Violation)' : 'Real-time cross-level flow monitoring; red dashed links represent unauthorized Purdue boundary breaches.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInjectAttack}
                  className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                >
                  <Flame size={14} />
                  {isZh ? '⚡ 模擬注入工控攻擊' : 'Inject ICS Attack'}
                </button>
              </div>
            </div>

            {/* SVG PURDUE TOPOLOGY GRAPH */}
            <div className="bg-black/60 rounded-xl border border-gray-850 p-6 relative overflow-x-auto min-h-[520px] flex items-center justify-center">
              <svg viewBox="0 0 1000 500" className="w-full max-w-5xl h-full select-none font-mono">
                
                {/* Zone Backgrounds */}
                <g className="zones">
                  {/* Level 4 IT */}
                  <rect x="20" y="20" width="960" height="70" rx="8" fill="rgba(59, 130, 246, 0.05)" stroke="rgba(59, 130, 246, 0.2)" strokeDasharray="3 3" />
                  <text x="35" y="42" fill="#60a5fa" fontSize="10" fontWeight="bold">LEVEL 4/5: ENTERPRISE IT NETWORK (10.10.x.x)</text>

                  {/* Level 3.5 iDMZ */}
                  <rect x="20" y="110" width="960" height="70" rx="8" fill="rgba(168, 85, 247, 0.05)" stroke="rgba(168, 85, 247, 0.2)" strokeDasharray="3 3" />
                  <text x="35" y="132" fill="#c084fc" fontSize="10" fontWeight="bold">LEVEL 3.5: INDUSTRIAL DMZ (iDMZ) (172.20.10.x)</text>

                  {/* Level 3 Site Ops */}
                  <rect x="20" y="200" width="960" height="70" rx="8" fill="rgba(6, 182, 212, 0.05)" stroke="rgba(6, 182, 212, 0.2)" strokeDasharray="3 3" />
                  <text x="35" y="222" fill="#22d3ee" fontSize="10" fontWeight="bold">LEVEL 3: SITE OPERATIONS & SCADA (192.168.50.x)</text>

                  {/* Level 2 Control HMI */}
                  <rect x="20" y="290" width="960" height="70" rx="8" fill="rgba(245, 158, 11, 0.05)" stroke="rgba(245, 158, 11, 0.2)" strokeDasharray="3 3" />
                  <text x="35" y="312" fill="#fbbf24" fontSize="10" fontWeight="bold">LEVEL 2: SUPERVISORY CONTROL & HMI</text>

                  {/* Level 1 & 0 Field PLCs */}
                  <rect x="20" y="380" width="960" height="100" rx="8" fill="rgba(249, 115, 22, 0.05)" stroke="rgba(249, 115, 22, 0.2)" strokeDasharray="3 3" />
                  <text x="35" y="402" fill="#fb923c" fontSize="10" fontWeight="bold">LEVEL 1 & 0: BASIC PROCESS CONTROL (PLCs, RTUs, SENSORS)</text>
                </g>

                {/* Arrow markers */}
                <defs>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#00FF66" />
                  </marker>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                  </marker>
                </defs>

                {/* Normal Communication Paths */}
                {/* L4 Admin to iDMZ Jumpbox */}
                <path d="M 220 70 L 220 125" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />
                {/* iDMZ Historian to L3 SCADA */}
                <path d="M 720 160 L 720 215" stroke="#00FF66" strokeWidth="2" markerEnd="url(#arrow-green)" />
                {/* L3 SCADA to L2 HMI */}
                <path d="M 500 255 L 350 310" stroke="#00FF66" strokeWidth="2" markerEnd="url(#arrow-green)" />
                <path d="M 500 255 L 650 310" stroke="#00FF66" strokeWidth="2" markerEnd="url(#arrow-green)" />
                {/* L2 HMI to L1 PLCs */}
                <path d="M 350 345 L 250 405" stroke="#00FF66" strokeWidth="2" markerEnd="url(#arrow-green)" />
                <path d="M 650 345 L 750 405" stroke="#00FF66" strokeWidth="2" markerEnd="url(#arrow-green)" />

                {/* MALICIOUS / ANOMALY PATH (RED VIOLATION) */}
                {/* L4 Compromised WS directly bypassing iDMZ to Level 1 PLC */}
                <path d="M 220 70 C 80 180, 80 340, 200 425" stroke="#ef4444" strokeWidth="3" strokeDasharray="5 5" fill="none" markerEnd="url(#arrow-red)" />
                <rect x="75" y="240" width="130" height="22" rx="4" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" />
                <text x="140" y="255" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="black">
                  🚨 IT直通OT違規 (T0855)
                </text>

                {/* NODES RENDERING */}
                {/* L4: IT Admin WS */}
                <g transform="translate(220, 55)" className="cursor-pointer" onClick={() => setSelectedAsset(assets[0])}>
                  <rect x="-80" y="-18" width="160" height="36" rx="6" fill="#111827" stroke="#3b82f6" strokeWidth="1.5" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">IT-Workstation-09</text>
                  <text textAnchor="middle" y="10" fill="#9ca3af" fontSize="7">10.10.12.44 (Compromised)</text>
                </g>

                {/* L4: ERP Server */}
                <g transform="translate(720, 55)">
                  <rect x="-70" y="-18" width="140" height="36" rx="6" fill="#111827" stroke="#3b82f6" strokeWidth="1" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">Enterprise ERP Core</text>
                  <text textAnchor="middle" y="10" fill="#9ca3af" fontSize="7">10.10.1.5</text>
                </g>

                {/* L3.5: iDMZ Jumpbox */}
                <g transform="translate(220, 145)">
                  <rect x="-80" y="-18" width="160" height="36" rx="6" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">iDMZ-Bastion-Jumpbox</text>
                  <text textAnchor="middle" y="10" fill="#c084fc" fontSize="7">172.20.10.25 (RDP Proxy)</text>
                </g>

                {/* L3.5: iDMZ Historian */}
                <g transform="translate(720, 145)">
                  <rect x="-80" y="-18" width="160" height="36" rx="6" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">OSIsoft PI Historian</text>
                  <text textAnchor="middle" y="10" fill="#c084fc" fontSize="7">172.20.10.5 (Read-Only)</text>
                </g>

                {/* L3: SCADA Ignition */}
                <g transform="translate(500, 235)">
                  <rect x="-90" y="-18" width="180" height="36" rx="6" fill="#083344" stroke="#06b6d4" strokeWidth="2" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">Ignition SCADA Core</text>
                  <text textAnchor="middle" y="10" fill="#22d3ee" fontSize="7">192.168.50.5 (OPC UA / MQTT)</text>
                </g>

                {/* L3: TIA Portal Eng WS */}
                <g transform="translate(820, 235)">
                  <rect x="-80" y="-18" width="160" height="36" rx="6" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">TIA Portal Eng-WS</text>
                  <text textAnchor="middle" y="10" fill="#22d3ee" fontSize="7">192.168.50.80</text>
                </g>

                {/* L2: Schneider Magelis HMI */}
                <g transform="translate(350, 325)">
                  <rect x="-80" y="-18" width="160" height="36" rx="6" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">Magelis HMI Panel 01</text>
                  <text textAnchor="middle" y="10" fill="#fbbf24" fontSize="7">192.168.50.20 (Modbus/S7)</text>
                </g>

                {/* L2: Siemens Comfort Panel */}
                <g transform="translate(650, 325)">
                  <rect x="-80" y="-18" width="160" height="36" rx="6" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                  <text textAnchor="middle" y="-2" fill="#fff" fontSize="9" fontWeight="bold">SIMATIC TP1200 HMI</text>
                  <text textAnchor="middle" y="10" fill="#fbbf24" fontSize="7">192.168.50.22</text>
                </g>

                {/* L1: Siemens S7-1500 */}
                <g transform="translate(250, 430)" className="cursor-pointer" onClick={() => setSelectedAsset(assets[0])}>
                  <rect x="-85" y="-24" width="170" height="48" rx="8" fill="#18181b" stroke="#f97316" strokeWidth="2.5" />
                  <text textAnchor="middle" y="-6" fill="#fff" fontSize="9" fontWeight="black">Siemens S7-1500</text>
                  <text textAnchor="middle" y="6" fill="#fb923c" fontSize="7">192.168.50.10 (S7Comm)</text>
                  <rect x="-35" y="11" width="70" height="10" rx="3" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="0.5" />
                  <text textAnchor="middle" y="18" fill="#ef4444" fontSize="6" fontWeight="black">STOP CMD BLOCKED</text>
                </g>

                {/* L1: Rockwell ControlLogix */}
                <g transform="translate(500, 430)">
                  <rect x="-85" y="-24" width="170" height="48" rx="8" fill="#18181b" stroke="#f97316" strokeWidth="1.5" />
                  <text textAnchor="middle" y="-6" fill="#fff" fontSize="9" fontWeight="black">ControlLogix 5580</text>
                  <text textAnchor="middle" y="6" fill="#fb923c" fontSize="7">192.168.50.11 (CIP Safety)</text>
                  <rect x="-30" y="11" width="60" height="10" rx="3" fill="#00FF66" fillOpacity="0.2" stroke="#00FF66" strokeWidth="0.5" />
                  <text textAnchor="middle" y="18" fill="#00FF66" fontSize="6" fontWeight="black">RUNNING OK</text>
                </g>

                {/* L1: Schneider Modicon M340 */}
                <g transform="translate(750, 430)">
                  <rect x="-85" y="-24" width="170" height="48" rx="8" fill="#18181b" stroke="#f97316" strokeWidth="1.5" />
                  <text textAnchor="middle" y="-6" fill="#fff" fontSize="9" fontWeight="black">Modicon M340 RTU</text>
                  <text textAnchor="middle" y="6" fill="#fb923c" fontSize="7">192.168.50.15 (Modbus TCP)</text>
                  <rect x="-30" y="11" width="60" height="10" rx="3" fill="#00FF66" fillOpacity="0.2" stroke="#00FF66" strokeWidth="0.5" />
                  <text textAnchor="middle" y="18" fill="#00FF66" fontSize="6" fontWeight="black">RUNNING OK</text>
                </g>

              </svg>
            </div>

            {/* Purdue Legend & Status */}
            <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-4">
              <div className="flex items-center gap-6 font-mono text-[10px]">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#3b82f6]" /> L4 Enterprise IT</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#a855f7]" /> L3.5 iDMZ</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#06b6d4]" /> L3 Site SCADA</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#f59e0b]" /> L2 HMI Console</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#f97316]" /> L1/0 PLCs & Sensors</span>
              </div>
              <div className="text-gray-400 text-[11px] font-mono">
                {isZh ? '點選拓撲中任一節點以開啟資產韌體與程式碼審計抽屜' : 'Click any node to inspect asset firmware & logic audit'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ASSET INVENTORY & VULNERABILITIES */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-8">
          
          {/* SEARCH & FILTERS */}
          <div className="bg-[#090d15] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder={isZh ? '搜尋工控資產名稱、IP、Vendor、型號或 CVE...' : 'Search assets by name, IP, vendor, model, or CVE...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/60 border border-gray-800 rounded-xl px-3 py-2">
                <Filter size={14} className="text-gray-400" />
                <span className="text-[10px] font-mono text-gray-400 uppercase">Purdue:</span>
                <select
                  value={filterPurdue}
                  onChange={(e) => setFilterPurdue(e.target.value)}
                  className="bg-transparent text-xs text-white font-mono outline-none cursor-pointer"
                >
                  <option value="all">{isZh ? '全部階層 (All Levels)' : 'All Levels'}</option>
                  <option value="L1">Level 1 (PLCs/RTUs)</option>
                  <option value="L2">Level 2 (HMIs)</option>
                  <option value="L3">Level 3 (SCADA/Eng-WS)</option>
                  <option value="L3.5">Level 3.5 (iDMZ)</option>
                  <option value="L0">Level 0 (Sensors)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-black/60 border border-gray-800 rounded-xl px-3 py-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase">{isZh ? '協定' : 'Proto'}:</span>
                <select
                  value={filterProtocol}
                  onChange={(e) => setFilterProtocol(e.target.value)}
                  className="bg-transparent text-xs text-white font-mono outline-none cursor-pointer"
                >
                  <option value="all">{isZh ? '全部協定' : 'All'}</option>
                  <option value="S7Comm">Siemens S7Comm</option>
                  <option value="Modbus">Modbus TCP</option>
                  <option value="EtherNet/IP">EtherNet/IP (CIP)</option>
                  <option value="OPC UA">OPC UA</option>
                </select>
              </div>
            </div>
          </div>

          {/* ASSETS TABLE */}
          <div className="bg-[#090d15] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="text-orange-400" size={18} />
                {isZh ? '工控資產清冊與 Purdue 階層弱點矩陣' : 'OT Asset Inventory & Purdue Vulnerability Matrix'}
              </h3>
              <span className="text-[10px] font-mono bg-black text-gray-400 px-3 py-1 rounded border border-gray-800">
                {isZh ? '共篩選出' : 'Showing'} {filteredAssets.length} {isZh ? '筆資產' : 'Assets'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0e1420] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-4">{isZh ? '資產識別與型號' : 'Asset & Model'}</th>
                    <th className="p-4">{isZh ? 'Purdue 階層' : 'Purdue Level'}</th>
                    <th className="p-4">{isZh ? 'IP / MAC 位址' : 'IP & MAC'}</th>
                    <th className="p-4">{isZh ? '通訊協定' : 'Protocol'}</th>
                    <th className="p-4">{isZh ? 'PLC 模式' : 'PLC Mode'}</th>
                    <th className="p-4">{isZh ? 'CVE 弱點指數' : 'CVSS / CVEs'}</th>
                    <th className="p-4">{isZh ? '狀態' : 'Status'}</th>
                    <th className="p-4 text-right">{isZh ? '操作' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{asset.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {asset.vendor} • {asset.model} (FW: {asset.firmware})
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[9px] font-black uppercase border",
                          asset.purdueLevel === 'L1' || asset.purdueLevel === 'L0' ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                          asset.purdueLevel === 'L2' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          asset.purdueLevel === 'L3' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" :
                          asset.purdueLevel === 'L3.5' ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        )}>
                          {asset.purdueLevel}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-bold">{asset.ip}</div>
                        <div className="text-[9px] text-gray-500">{asset.mac}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] border border-gray-700">
                          {asset.protocol}
                        </span>
                      </td>
                      <td className="p-4">
                        {asset.plcMode !== 'N/A' ? (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit",
                            asset.plcMode === 'RUN' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400"
                          )}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            {asset.plcMode}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {asset.cves.length > 0 ? (
                          <div className="space-y-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black",
                              asset.cvssScore >= 8.0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400"
                            )}>
                              CVSS {asset.cvssScore}
                            </span>
                            <div className="text-[9px] text-gray-500">{asset.cves.join(', ')}</div>
                          </div>
                        ) : (
                          <span className="text-green-400 text-[10px] flex items-center gap-1 font-bold">
                            <ShieldCheck size={12} /> {isZh ? '無已知 CVE' : 'No CVEs'}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 w-fit",
                          asset.status === 'Alert' ? "bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse" :
                          asset.status === 'Online' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-800 text-gray-400"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", asset.status === 'Alert' ? "bg-red-400" : "bg-green-400")} />
                          {asset.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/40 rounded-lg text-xs font-mono font-bold transition-all"
                        >
                          {isZh ? '鑑識抽屜' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ICS PROTOCOL DPI & COMMAND AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'dpi' && (
        <div className="space-y-8">
          
          {/* DPI METRICS BANNER */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#090d15] border border-gray-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black font-mono">Modbus TCP DPI</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">452,190</div>
                <div className="text-[9px] text-gray-400 font-mono">FC01-FC16 {isZh ? '全指令解構' : 'Analyzed'}</div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20"><Binary className="text-amber-400" size={24} /></div>
            </div>

            <div className="bg-[#090d15] border border-gray-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black font-mono">Siemens S7Comm DPI</div>
                <div className="text-2xl font-black text-blue-400 font-mono mt-1">189,440</div>
                <div className="text-[9px] text-gray-400 font-mono">{isZh ? 'DB 暫存器與 CPU 控制碼' : 'DB / CPU commands'}</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><Cpu className="text-blue-400" size={24} /></div>
            </div>

            <div className="bg-[#090d15] border border-gray-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black font-mono">CIP / EtherNet/IP</div>
                <div className="text-2xl font-black text-green-400 font-mono mt-1">84,120</div>
                <div className="text-[9px] text-gray-400 font-mono">CIP Safety {isZh ? '即時校驗' : 'Tags'}</div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><Activity className="text-green-400" size={24} /></div>
            </div>

            <div className="bg-[#090d15] border border-gray-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black font-mono">OPC UA / DNP3</div>
                <div className="text-2xl font-black text-purple-400 font-mono mt-1">32,800</div>
                <div className="text-[9px] text-gray-400 font-mono">MQTT Sparkplug B</div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20"><Server className="text-purple-400" size={24} /></div>
            </div>
          </div>

          {/* REAL-TIME COMMAND AUDIT STREAM */}
          <div className="bg-[#090d15] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="text-orange-400" size={18} />
                  {isZh ? '工控通訊指令即時解構串流 (Real-time ICS Function Code Stream)' : 'Real-time ICS Protocol Function Code Audit'}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono mt-1">
                  {isZh ? '由 Zeek-OT 引擎深度解構二進位 Payload，比對功能碼、暫存器位址與設定基準線 (Baseline)' : 'Decoded by Zeek-OT engine; flag atypical Write/Stop commands against normal engineering baselines.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all",
                    isLiveStreaming ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-gray-800 text-gray-400 border-gray-700"
                  )}
                >
                  {isLiveStreaming ? <Radio size={14} className="animate-pulse" /> : <Pause size={14} />}
                  {isLiveStreaming ? (isZh ? '即時解構中 (Live)' : 'Live') : (isZh ? '已暫停' : 'Paused')}
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {dpiCommands.map(cmd => (
                <div key={cmd.id} className="p-5 hover:bg-gray-850/40 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-black uppercase font-mono border",
                        cmd.riskLevel === 'Critical' ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" :
                        cmd.riskLevel === 'High' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                        "bg-green-500/10 text-green-400 border-green-500/20"
                      )}>
                        {cmd.riskLevel}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {cmd.protocol}
                      </span>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {cmd.functionCode}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {cmd.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-mono px-2.5 py-0.5 rounded font-black uppercase",
                        cmd.actionTaken.includes('Blocked') ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                        cmd.actionTaken.includes('Quarantined') ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                        "bg-green-500/10 text-green-400"
                      )}>
                        {cmd.actionTaken}
                      </span>
                      <button
                        onClick={() => setSelectedDpiCmd(cmd)}
                        className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {isZh ? 'Hex 鑑識' : 'Hex Dump'} <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-black/60 p-3.5 rounded-xl border border-gray-800/80 font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">{isZh ? '連線路徑 (Source ➔ Destination)' : 'Flow Path'}</div>
                      <div className="text-gray-200 mt-1 flex items-center gap-2">
                        <span className="text-blue-400 font-bold">{cmd.source}</span>
                        <ArrowRight size={12} className="text-gray-500" />
                        <span className="text-orange-400 font-bold">{cmd.destination}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">{cmd.functionDesc}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">{isZh ? '原始十六進位封包 (Raw Hex Dump)' : 'Raw Hex Payload'}</div>
                      <div className="text-[11px] text-green-400 bg-black/80 px-2.5 py-1.5 rounded border border-gray-800 font-mono mt-1 truncate">
                        {cmd.payloadHex}
                      </div>
                    </div>
                  </div>

                  {cmd.isAnomaly && cmd.anomalyReason && (
                    <div className="mt-2.5 p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg text-xs text-red-300 font-mono flex items-start gap-2">
                      <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                      <span>{cmd.anomalyReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: IT/OT CROSS-ZONE KILL CHAIN CORRELATION */}
      {/* ========================================================================= */}
      {activeTab === 'killchain' && (
        <div className="space-y-8">
          
          <div className="bg-[#090d15] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="text-orange-400" size={18} />
                  {isZh ? 'IT 至 OT 跨區滲透攻擊鏈深度溯源 (Cross-Zone Kill-Chain)' : 'Cross-Zone IT-to-OT Incident Kill-Chain Forensics'}
                </h3>
                <p className="text-[11px] text-gray-400 font-mono mt-1">
                  {isZh ? '關聯 IT 端點失陷日誌、iDMZ 跳板機 Session 與 OT 現場 PLC 惡意寫入指令' : 'Correlates IT phishing/AD triage with iDMZ bastion jump sessions and OT PLC override payloads.'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {incidents.map(inc => (
                <div key={inc.id} className="bg-[#0d121c] border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 font-mono font-black text-xs rounded-lg uppercase animate-pulse">
                        {inc.risk}
                      </span>
                      <div>
                        <h4 className="text-base font-black text-white">
                          {isZh ? inc.title : inc.titleEn}
                        </h4>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          ID: {inc.id} • {inc.timestamp} • MITRE ATT&CK for ICS: {inc.killChainStage}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {inc.soarPlaybookStatus === 'Awaiting Approval' ? (
                        <button
                          onClick={() => handleApproveMitigation(inc.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-mono font-black text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all"
                        >
                          <ShieldAlert size={14} />
                          {isZh ? '一鍵核准 SOAR 工控隔離' : 'Approve SOAR Isolation'}
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 font-mono font-bold text-xs rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          {isZh ? '已完成 SOAR 自動隔離' : 'Mitigated by SOAR'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KILL CHAIN STEPPING GRAPH */}
                  <div className="bg-black/60 rounded-xl border border-gray-800 p-5 mb-5">
                    <div className="text-[10px] font-mono font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                      <Workflow size={14} className="text-purple-400" />
                      {isZh ? '四階段跨層滲透軌跡 (Cross-Zone Pivot Trace)' : 'Pivot Progression Stage'}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                      {/* Step 1: IT Compromise */}
                      <div className="p-3.5 bg-[#111827] border border-blue-500/40 rounded-xl space-y-1.5">
                        <div className="text-[9px] font-mono uppercase text-blue-400 font-bold">1. IT 辦公網失陷</div>
                        <div className="text-xs font-bold text-white">{inc.attackerSrc}</div>
                        <div className="text-[9px] text-gray-400">釣魚郵件 ➔ 竊取 AD 特權憑證</div>
                      </div>

                      {/* Step 2: iDMZ Bastion */}
                      <div className="p-3.5 bg-[#1e1b4b] border border-purple-500/40 rounded-xl space-y-1.5">
                        <div className="text-[9px] font-mono uppercase text-purple-400 font-bold">2. iDMZ 跳板機登入</div>
                        <div className="text-xs font-bold text-white">{inc.jumpHost}</div>
                        <div className="text-[9px] text-gray-400">RDP 越界會話 ➔ 開啟工控通道</div>
                      </div>

                      {/* Step 3: OT Level 1 Target */}
                      <div className="p-3.5 bg-[#451a03] border border-orange-500/40 rounded-xl space-y-1.5">
                        <div className="text-[9px] font-mono uppercase text-orange-400 font-bold">3. 產線 PLC 攻擊目標</div>
                        <div className="text-xs font-bold text-white">{inc.targetPLC}</div>
                        <div className="text-[9px] text-gray-400">S7 / Modbus 二進位控制碼注入</div>
                      </div>

                      {/* Step 4: Physical Sabotage */}
                      <div className="p-3.5 bg-[#3b0764] border border-red-500/40 rounded-xl space-y-1.5">
                        <div className="text-[9px] font-mono uppercase text-red-400 font-bold">4. 物理破壞企圖</div>
                        <div className="text-xs font-bold text-red-300">{inc.plcFunctionCode}</div>
                        <div className="text-[9px] text-gray-400">強制關閉冷卻閥門造成超溫</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 font-mono leading-relaxed bg-black/40 p-4 rounded-xl border border-gray-800">
                    <strong className="text-orange-400">{isZh ? '鑑識研判摘要：' : 'Forensics Summary: '}</strong>
                    {isZh ? inc.description : inc.descriptionEn}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs font-mono text-gray-400">
                    <span>{isZh ? '物理影響評估：' : 'Physical Impact: '} <strong className="text-red-400">{inc.impact}</strong></span>
                    <button 
                      onClick={() => showToast(isZh ? `已下載 ${inc.rawPcapId} 原始封包 (Arkime)` : `Downloading ${inc.rawPcapId}`)}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      <Download size={12} /> {inc.rawPcapId}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PROCESS SAFETY & SENSOR THRESHOLDS */}
      {/* ========================================================================= */}
      {activeTab === 'safety' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sensors.map(sensor => (
              <div key={sensor.id} className="bg-[#090d15] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "p-2.5 rounded-xl border",
                        sensor.status === 'Hazardous Critical' ? "bg-red-500/20 border-red-500/40 text-red-400" :
                        sensor.status === 'Warning' ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                        "bg-green-500/20 border-green-500/40 text-green-400"
                      )}>
                        <Gauge size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{sensor.name}</h4>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{sensor.plcInfo}</div>
                      </div>
                    </div>

                    <span className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-black uppercase font-mono border",
                      sensor.status === 'Hazardous Critical' ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" :
                      sensor.status === 'Warning' ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
                      "bg-green-500/10 text-green-400 border-green-500/30"
                    )}>
                      {sensor.status}
                    </span>
                  </div>

                  {/* SENSOR VALUE DISPLAY */}
                  <div className="flex items-baseline gap-2 my-4">
                    <span className="text-4xl font-black font-mono text-white tracking-tight">
                      {sensor.currentValue}
                    </span>
                    <span className="text-sm font-bold text-gray-400 font-mono">{sensor.unit}</span>
                  </div>

                  {/* THRESHOLD BAR */}
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between text-gray-400">
                      <span>安全基準: {sensor.baselineMin} - {sensor.baselineMax} {sensor.unit}</span>
                      <span className="text-red-400 font-bold">危險停機上限: {sensor.hazardCriticalLimit} {sensor.unit}</span>
                    </div>

                    <div className="h-2 bg-gray-850 rounded-full overflow-hidden relative">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          sensor.status === 'Hazardous Critical' ? "bg-red-500" :
                          sensor.status === 'Warning' ? "bg-amber-400" : "bg-[#00FF66]"
                        )}
                        style={{ width: `${Math.min(100, (sensor.currentValue / (sensor.hazardCriticalLimit * 1.1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* SENSOR SPARKLINE TREND */}
                <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono text-gray-500">
                  <span>過去 60 秒取樣軌跡: [{sensor.trend.join(', ')}]</span>
                  <span className="text-gray-400">取樣率: 100ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ARKIME FPC & ZEEK-OT ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'fpc' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#090d15] border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400"><HardDrive size={22} /></div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{isZh ? 'Arkime FPC 全封包側錄器' : 'Arkime FPC Capture'}</h4>
                    <div className="text-[10px] text-gray-500 font-mono">Worker-01 (OT SPAN Mirror)</div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                  {isZh ? '已連續側錄 90 天所有 Modbus、S7、CIP 與 BACnet 原始封包，支援隨選即時 Wireshark PCAP 匯出。' : 'Continuous 90-day retention for all industrial protocol packets with on-demand PCAP forensic retrieval.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between font-mono text-xs">
                <span className="text-gray-400">儲存使用率: <strong className="text-white">4.2 TB / 10 TB</strong></span>
                <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> 正常運作</span>
              </div>
            </div>

            <div className="bg-[#090d15] border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400"><Cpu size={22} /></div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{isZh ? 'Zeek-OT 深度解析框架' : 'Zeek ICS Framework'}</h4>
                    <div className="text-[10px] text-gray-500 font-mono">v5.2.0-ICS Custom</div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                  {isZh ? '即時抽取 Modbus Coils / Registers、S7 Job Header 與 CIP Class/Instance 標籤並寫入 JSON 結構化日誌。' : 'Extracts deep register values and S7 function codes into structured Elasticsearch/SEMOR logs.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between font-mono text-xs">
                <span className="text-gray-400">解析佇列延遲: <strong className="text-[#00FF66]">1.2ms</strong></span>
                <span className="text-blue-400 font-bold">14 支腳本加載</span>
              </div>
            </div>

            <div className="bg-[#090d15] border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400"><ShieldAlert size={22} /></div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{isZh ? 'Suricata-ICS 特徵規則庫' : 'Suricata ICS Rules'}</h4>
                    <div className="text-[10px] text-gray-500 font-mono">ET-Open ICS / CISA KEV</div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                  {isZh ? '包含 Industroyer、Triton、BlackEnergy 與 Stuxnet 之工控惡意特徵碼，並結合 AI 動態基準線。' : 'Armed with ICS exploit signatures including Stuxnet, Industroyer, and Triton with adaptive baselining.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between font-mono text-xs">
                <span className="text-gray-400">已啟用規則: <strong className="text-purple-400">4,120 Rules</strong></span>
                <span className="text-gray-400">版本: 2026.08</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSET FORENSIC MODAL / DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d121c] border border-orange-500/50 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/20 border border-orange-500/40 rounded-xl text-orange-400">
                    <Factory size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{selectedAsset.name}</h3>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {selectedAsset.levelLabel} • IP: {selectedAsset.ip}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                  <div className="text-[9px] text-gray-500 uppercase">{isZh ? '廠商 / 型號' : 'Vendor/Model'}</div>
                  <div className="font-bold text-white mt-1">{selectedAsset.vendor}</div>
                  <div className="text-[10px] text-gray-400">{selectedAsset.model}</div>
                </div>
                <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                  <div className="text-[9px] text-gray-500 uppercase">{isZh ? '韌體版本' : 'Firmware'}</div>
                  <div className="font-bold text-purple-400 mt-1">{selectedAsset.firmware}</div>
                  <div className="text-[9px] text-gray-400">{selectedAsset.mac}</div>
                </div>
                <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                  <div className="text-[9px] text-gray-500 uppercase">{isZh ? 'PLC 運作模式' : 'PLC Mode'}</div>
                  <div className="font-bold text-green-400 mt-1">{selectedAsset.plcMode}</div>
                  <div className="text-[9px] text-gray-400">{selectedAsset.ioPointsCount} I/O Points</div>
                </div>
                <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                  <div className="text-[9px] text-gray-500 uppercase">{isZh ? 'CVSS 弱點指數' : 'Vulnerability'}</div>
                  <div className="font-bold text-red-400 mt-1">{selectedAsset.cvssScore > 0 ? `CVSS ${selectedAsset.cvssScore}` : 'Safe'}</div>
                  <div className="text-[9px] text-gray-400">{selectedAsset.cves.length} CVEs</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-black text-white font-mono uppercase">{isZh ? '工控梯形圖程式碼雜湊與變更審計 (Logic Integrity)' : 'Ladder Logic Hash Audit'}</h5>
                <div className="bg-black/80 p-4 rounded-xl border border-gray-800 font-mono text-[11px] space-y-1.5 text-gray-300">
                  <div>SHA-256 (Current Logic): <span className="text-green-400">9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</span></div>
                  <div>Baseline Hash (2026-08-01): <span className="text-green-400">9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</span></div>
                  <div className="text-[#00FF66] font-bold mt-2">✅ 梯形圖程式碼雜湊值與基準線一致，未偵測到未授權邏輯修改。</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-mono font-bold transition-colors"
                >
                  {isZh ? '關閉' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    setSelectedAsset(null);
                    showToast(isZh ? `已下發 ${selectedAsset.name} 韌體安全掃描指令` : `Dispatched firmware scan`);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-mono font-bold transition-colors"
                >
                  {isZh ? '執行韌體安全掃描' : 'Scan Firmware'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DPI HEX DUMP MODAL */}
      <AnimatePresence>
        {selectedDpiCmd && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d121c] border border-orange-500/50 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <Binary className="text-orange-400" size={22} />
                  <div>
                    <h3 className="text-base font-black text-white">{selectedDpiCmd.protocol} {selectedDpiCmd.functionCode}</h3>
                    <div className="text-[10px] text-gray-400 font-mono">ID: {selectedDpiCmd.id} • {selectedDpiCmd.timestamp}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedDpiCmd(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">{isZh ? '功能描述' : 'Function Description'}</div>
                  <div className="text-white mt-1">{selectedDpiCmd.functionDesc}</div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-500 uppercase">{isZh ? '原始十六進位封包 (Hex Payload)' : 'Raw Hex Payload'}</div>
                  <div className="bg-black/90 p-4 rounded-xl border border-gray-800 text-green-400 text-sm font-mono tracking-widest break-all">
                    {selectedDpiCmd.payloadHex}
                  </div>
                </div>

                {selectedDpiCmd.anomalyReason && (
                  <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl text-red-300">
                    <strong className="text-red-400">{isZh ? '異常原因：' : 'Anomaly: '}</strong>
                    {selectedDpiCmd.anomalyReason}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800">
                <button
                  onClick={() => setSelectedDpiCmd(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-mono font-bold"
                >
                  {isZh ? '關閉' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

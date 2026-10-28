export type TimeRange = '15m' | '1h' | '24h' | '7d' | '30d';
export type RefreshInterval = 0 | 10 | 30 | 60; // 0 = paused, in seconds

export interface MetricCardData {
  id: string;
  titleZh: string;
  titleEn: string;
  value: string;
  subValue?: string;
  changeZh: string;
  changeEn: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'cyan';
  sparkline: number[];
}

export interface CcsClusterNode {
  id: string;
  name: string;
  locationZh: string;
  locationEn: string;
  role: 'Master' | 'Worker';
  ip: string;
  latencyMs: number;
  status: 'healthy' | 'degraded' | 'offline';
  eps: number;
  cpuLoad: number;
  diskUsagePercent: number;
  activeQueries: number;
  coordinates: [number, number]; // [lng, lat]
}

export interface MitreTacticItem {
  id: string;
  tacticZh: string;
  tacticEn: string;
  code: string;
  detectedCount: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  techniques: {
    code: string;
    nameZh: string;
    nameEn: string;
    count: number;
    active: boolean;
  }[];
}

export interface UebaHighRiskEntity {
  id: string;
  name: string;
  roleZh: string;
  roleEn: string;
  departmentZh: string;
  departmentEn: string;
  score: number;
  previousScore: number;
  status: 'Critical' | 'High' | 'Medium';
  avatarInitials: string;
  triggersZh: string[];
  triggersEn: string[];
  lastAnomalyTime: string;
  networkActivity: {
    bytesOutMb: number;
    filesAccessed: number;
    offHourLogins: number;
  };
}

export interface AbnormalLoginRecord {
  id: string;
  time: string;
  ip: string;
  locationZh: string;
  locationEn: string;
  host: string;
  service: 'SSH' | 'RDP' | 'Kerberos' | 'HTTPS' | 'VPN';
  attempts: number;
  status: 'BLOCKED' | 'RATE_LIMITED' | 'MONITORING';
  risk: 'Critical' | 'High' | 'Medium';
}

export interface CriticalIncidentRecord {
  id: string;
  time: string;
  threatZh: string;
  threatEn: string;
  categoryZh: string;
  categoryEn: string;
  srcIp: string;
  destIp: string;
  host: string;
  countryZh: string;
  countryEn: string;
  actionZh: string;
  actionEn: string;
  risk: 'Critical' | 'High' | 'Medium';
  mitreTactic: string;
  soarStatus: 'Auto-Contained' | 'In-Progress' | 'Pending-Approval' | 'Resolved';
  iocHash?: string;
  affectedAssets: string[];
  riskScore?: number;
  payloadHex?: string;
  rawLog?: string;
  aiSummary?: string;
  confidence?: number;
  cve?: string;
}

export interface TrafficDataPoint {
  time: string;
  worker1Eps: number;
  worker2Eps: number;
  worker3Eps: number;
  totalTrafficGbps: number;
  alerts: number;
}

export interface AttackTopologyNode {
  id: string;
  type: 'attacker' | 'gateway' | 'network' | 'infected' | 'target';
  labelZh: string;
  labelEn: string;
  ip: string;
  x: number;
  y: number;
  patientZero?: boolean;
}

export interface AttackTopologyLink {
  source: string;
  target: string;
  labelZh: string;
  labelEn: string;
  type: 'entry' | 'transit' | 'infection' | 'lateral' | 'exfil';
}

export interface AttackTimelineEvent {
  time: string;
  eventZh: string;
  eventEn: string;
  status: 'detected' | 'processing' | 'alert' | 'critical';
}

export interface MasterNodeUtilizationPoint {
  time: string;
  cpu: number;
  ram: number;
  disk: number;
  temperatureC?: number;
  iops?: number;
}

export interface MasterNodeSystemHealth {
  nodeId: string;
  nodeName: string;
  role: string;
  ip: string;
  status: 'Online' | 'Warning' | 'Offline' | 'Draining';
  uptime: string;
  cpu: number;
  ram: number;
  disk: number;
  loadAvg: [number, number, number];
  vCpu: number;
  totalRamGB: number;
  usedRamGB: number;
  totalDiskGB: number;
  usedDiskGB: number;
  processCount: number;
  networkRxMbps: number;
  networkTxMbps: number;
  timeline: MasterNodeUtilizationPoint[];
  thresholds: {
    cpuWarning: number;
    cpuCritical: number;
    ramWarning: number;
    ramCritical: number;
    diskWarning: number;
    diskCritical: number;
  };
}

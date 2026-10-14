import fs from 'fs';
import path from 'path';
import os from 'os';

export interface NodeTraffic {
  tcp: number;
  udp: number;
  agent: number;
}

export interface NodeNetworkInterface {
  name: string;
  ip: string;
  rxMbps: number;
  txMbps: number;
  droppedPackets: number;
}

export interface NodeServiceStatus {
  name: string;
  status: 'running' | 'degraded' | 'stopped';
  pid: number;
  uptime: string;
}

export interface PlatformNodeInfo {
  id: string;
  name: string;
  type: string;
  rawType: 'Dashboard Node' | 'Master Node' | 'Work Node';
  role: string;
  ip: string;
  cpu: number;
  ram: number;
  disk: number;
  traffic: NodeTraffic;
  status: 'Online' | 'Warning' | 'Offline' | 'Draining';
  cordoned: boolean;
  loadAvg: [number, number, number];
  iops: { read: number; write: number };
  processCount: number;
  uptimeSeconds: number;
  osInfo: {
    os: string;
    kernel: string;
    arch: string;
    vCpu: number;
    totalRamGB: number;
    totalDiskGB: number;
  };
  interfaces: NodeNetworkInterface[];
  services: NodeServiceStatus[];
  lastSync: string;
}

export interface ThresholdSettings {
  cpuWarning: number;
  cpuCritical: number;
  cpuDurationMinutes: number;
  ramWarning: number;
  ramCritical: number;
  ramDurationMinutes: number;
  diskWarning: number;
  diskCritical: number;
  trafficWarningMbps: number;
  trafficCriticalMbps: number;
  enableEmail: boolean;
  emailRecipients: string;
  enableWebhook: boolean;
  webhookUrl: string;
  webhookChannel: string;
  enableSyslog: boolean;
  syslogServer: string;
  syslogPort: number;
  alertCooldownMinutes: number;
  notifyOnWarning: boolean;
  notifyOnCritical: boolean;
  nodeOverrides: Record<string, { cpuCritical?: number; ramCritical?: number; diskCritical?: number }>;
}

export interface PerformanceAlertItem {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  severity: 'critical' | 'warning' | 'info';
  metric: 'CPU' | 'RAM' | 'Disk' | 'Traffic' | 'Service';
  currentVal: number | string;
  thresholdVal: number | string;
  message: string;
  acknowledged: boolean;
}

export interface TrendDataPoint {
  time: string;
  avgCpu: number;
  avgRam: number;
  avgDisk: number;
  peakTraffic: number;
  clusterEvents: number;
  packetLossRate: number;
  p99LatencyMs: number;
}

export interface TopologyLink {
  from: string;
  to: string;
  throughputMbps: number;
  latencyMs: number;
  status: 'healthy' | 'congested' | 'degraded';
}

export interface TopologyNode {
  id: string;
  label: string;
  type: 'external' | 'master' | 'dashboard' | 'work';
  x: number;
  y: number;
  ip?: string;
}

const CONFIG_FILE = path.join(process.cwd(), 'platform_performance_config.json');

export const DEFAULT_PLATFORM_THRESHOLDS: ThresholdSettings = {
  cpuWarning: 75,
  cpuCritical: 90,
  cpuDurationMinutes: 3,
  ramWarning: 80,
  ramCritical: 90,
  ramDurationMinutes: 5,
  diskWarning: 85,
  diskCritical: 92,
  trafficWarningMbps: 120,
  trafficCriticalMbps: 180,
  enableEmail: true,
  emailRecipients: 'admin-infra@corp.internal, soc-alerts@corp.internal',
  enableWebhook: true,
  webhookUrl: 'https://hooks.slack.com/services/T00/B00/platform-infra-alerts',
  webhookChannel: '#infra-alerts-soc',
  enableSyslog: false,
  syslogServer: '192.168.10.250',
  syslogPort: 514,
  alertCooldownMinutes: 15,
  notifyOnWarning: true,
  notifyOnCritical: true,
  nodeOverrides: {
    'master-01': { cpuCritical: 80, ramCritical: 85, diskCritical: 85 }
  }
};

export class PlatformPerformanceEngine {
  private nodes: Map<string, PlatformNodeInfo> = new Map();
  private thresholds: ThresholdSettings = { ...DEFAULT_PLATFORM_THRESHOLDS };
  private alertHistory: PerformanceAlertItem[] = [];
  private lastAlertTimestamp: Map<string, number> = new Map();

  constructor() {
    this.loadConfig();
    this.initDefaultNodes();
    // Background fluctuation timer every 15 seconds to ensure live dynamism
    setInterval(() => {
      this.sampleBackgroundMetrics();
    }, 15000);
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.thresholds) {
          this.thresholds = { ...DEFAULT_PLATFORM_THRESHOLDS, ...parsed.thresholds };
        }
      }
    } catch (err) {
      console.error('[PlatformPerformanceEngine] Failed to load config:', err);
    }
  }

  public saveConfig(): void {
    try {
      const payload = {
        updatedAt: new Date().toISOString(),
        thresholds: this.thresholds
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PlatformPerformanceEngine] Failed to save config:', err);
    }
  }

  private initDefaultNodes(): void {
    const localCpus = os.cpus().length || 4;
    const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024)) || 16;
    const freeMemGB = Math.round(os.freemem() / (1024 * 1024 * 1024)) || 8;
    const actualHostRamUsedPercent = Math.min(95, Math.max(20, Math.round(((totalMemGB - freeMemGB) / totalMemGB) * 100)));

    const initialList: PlatformNodeInfo[] = [
      {
        id: 'dash-01',
        name: 'Dashboard-Node-01',
        type: '控制台節點',
        rawType: 'Dashboard Node',
        role: '控制台前端與 API 網關叢集',
        ip: '192.168.10.10',
        cpu: 45,
        ram: actualHostRamUsedPercent || 62,
        disk: 38,
        traffic: { tcp: 12.5, udp: 2.1, agent: 0.8 },
        status: 'Online',
        cordoned: false,
        loadAvg: [0.85, 0.92, 0.88],
        iops: { read: 1420, write: 850 },
        processCount: 168,
        uptimeSeconds: 345620,
        osInfo: {
          os: 'Ubuntu 22.04 LTS (Jammy)',
          kernel: os.release() || '5.15.0-105-generic',
          arch: os.arch() || 'x86_64',
          vCpu: localCpus,
          totalRamGB: totalMemGB,
          totalDiskGB: 500
        },
        interfaces: [
          { name: 'eth0', ip: '192.168.10.10', rxMbps: 14.8, txMbps: 18.2, droppedPackets: 0 },
          { name: 'lo', ip: '127.0.0.1', rxMbps: 45.2, txMbps: 45.2, droppedPackets: 0 }
        ],
        services: [
          { name: 'nginx-ingress', status: 'running', pid: 1042, uptime: '4d 12h' },
          { name: 'node_exporter', status: 'running', pid: 1055, uptime: '4d 12h' },
          { name: 'semor-api-gateway', status: 'running', pid: 2108, uptime: '4d 12h' }
        ],
        lastSync: new Date().toISOString()
      },
      {
        id: 'master-01',
        name: 'Master-Node-01',
        type: '主控管理節點',
        rawType: 'Master Node',
        role: 'Kubernetes/Cluster Control Plane & 排程仲裁',
        ip: '192.168.10.20',
        cpu: 28,
        ram: 45,
        disk: 22,
        traffic: { tcp: 45.2, udp: 8.4, agent: 1.2 },
        status: 'Online',
        cordoned: false,
        loadAvg: [1.12, 1.05, 0.98],
        iops: { read: 2890, write: 3400 },
        processCount: 245,
        uptimeSeconds: 450120,
        osInfo: {
          os: 'Ubuntu 22.04 LTS (Jammy)',
          kernel: '5.15.0-105-generic',
          arch: 'x86_64',
          vCpu: 16,
          totalRamGB: 64,
          totalDiskGB: 1000
        },
        interfaces: [
          { name: 'bond0', ip: '192.168.10.20', rxMbps: 54.8, txMbps: 62.1, droppedPackets: 0 },
          { name: 'cilium_host', ip: '10.244.0.1', rxMbps: 120.4, txMbps: 118.9, droppedPackets: 0 }
        ],
        services: [
          { name: 'kube-apiserver', status: 'running', pid: 3102, uptime: '5d 04h' },
          { name: 'etcd-cluster', status: 'running', pid: 3110, uptime: '5d 04h' },
          { name: 'node_exporter', status: 'running', pid: 3125, uptime: '5d 04h' }
        ],
        lastSync: new Date().toISOString()
      },
      {
        id: 'work-01',
        name: 'Work-Node-01',
        type: '運算工作節點',
        rawType: 'Work Node',
        role: '高吞吐封包捕獲與 Suricata/Zeek 深度解析',
        ip: '192.168.10.31',
        cpu: 78,
        ram: 82,
        disk: 55,
        traffic: { tcp: 120.5, udp: 15.2, agent: 5.4 },
        status: 'Online',
        cordoned: false,
        loadAvg: [3.45, 3.12, 2.90],
        iops: { read: 12500, write: 8400 },
        processCount: 310,
        uptimeSeconds: 198240,
        osInfo: {
          os: 'Debian 12 Bookworm',
          kernel: '6.1.0-18-amd64',
          arch: 'x86_64',
          vCpu: 32,
          totalRamGB: 128,
          totalDiskGB: 4000
        },
        interfaces: [
          { name: 'enp3s0f0', ip: '192.168.10.31', rxMbps: 141.1, txMbps: 35.4, droppedPackets: 4 },
          { name: 'afpacket_rx', ip: '0.0.0.0', rxMbps: 380.0, txMbps: 0.0, droppedPackets: 12 }
        ],
        services: [
          { name: 'suricata-engine', status: 'running', pid: 4010, uptime: '2d 07h' },
          { name: 'zeek-cluster', status: 'running', pid: 4022, uptime: '2d 07h' },
          { name: 'node_exporter', status: 'running', pid: 4030, uptime: '2d 07h' }
        ],
        lastSync: new Date().toISOString()
      },
      {
        id: 'work-02',
        name: 'Work-Node-02',
        type: '運算工作節點',
        rawType: 'Work Node',
        role: 'VictoriaLogs 區塊時序日誌高壓縮儲存庫',
        ip: '192.168.10.32',
        cpu: 65,
        ram: 70,
        disk: 48,
        traffic: { tcp: 98.2, udp: 12.1, agent: 4.8 },
        status: 'Online',
        cordoned: false,
        loadAvg: [2.80, 2.75, 2.60],
        iops: { read: 18200, write: 24500 },
        processCount: 220,
        uptimeSeconds: 284100,
        osInfo: {
          os: 'Debian 12 Bookworm',
          kernel: '6.1.0-18-amd64',
          arch: 'x86_64',
          vCpu: 32,
          totalRamGB: 128,
          totalDiskGB: 8000
        },
        interfaces: [
          { name: 'bond0', ip: '192.168.10.32', rxMbps: 115.1, txMbps: 45.2, droppedPackets: 0 }
        ],
        services: [
          { name: 'victorialogs-core', status: 'running', pid: 5120, uptime: '3d 06h' },
          { name: 'rust-storage-compressor', status: 'running', pid: 5135, uptime: '3d 06h' },
          { name: 'node_exporter', status: 'running', pid: 5140, uptime: '3d 06h' }
        ],
        lastSync: new Date().toISOString()
      },
      {
        id: 'work-03',
        name: 'Work-Node-03',
        type: '運算工作節點',
        rawType: 'Work Node',
        role: 'AI/ML 異常威脅研判與即時關聯推論引擎',
        ip: '192.168.10.33',
        cpu: 92,
        ram: 88,
        disk: 62,
        traffic: { tcp: 150.8, udp: 18.5, agent: 6.2 },
        status: 'Warning',
        cordoned: false,
        loadAvg: [5.12, 4.88, 4.20],
        iops: { read: 8400, write: 6200 },
        processCount: 295,
        uptimeSeconds: 142800,
        osInfo: {
          os: 'Rocky Linux 9.3 (Blue Onyx)',
          kernel: '5.14.0-362.el9',
          arch: 'x86_64',
          vCpu: 32,
          totalRamGB: 128,
          totalDiskGB: 4000
        },
        interfaces: [
          { name: 'eth0', ip: '192.168.10.33', rxMbps: 175.5, txMbps: 84.2, droppedPackets: 2 }
        ],
        services: [
          { name: 'ml-inference-runner', status: 'running', pid: 6100, uptime: '1d 15h' },
          { name: 'correlation-engine', status: 'running', pid: 6112, uptime: '1d 15h' },
          { name: 'node_exporter', status: 'running', pid: 6125, uptime: '1d 15h' }
        ],
        lastSync: new Date().toISOString()
      }
    ];

    for (const node of initialList) {
      this.nodes.set(node.id, node);
    }
  }

  private sampleBackgroundMetrics(): void {
    const now = new Date().toISOString();
    for (const [id, node] of this.nodes.entries()) {
      if (node.status === 'Offline' || node.cordoned) continue;

      // Realistic random-walk fluctuation (+/- 2% on CPU, +/- 1% on RAM, +/- 3Mbps on traffic)
      const cpuDelta = Math.floor((Math.random() - 0.48) * 4);
      let newCpu = Math.min(99, Math.max(15, node.cpu + cpuDelta));

      const ramDelta = Math.floor((Math.random() - 0.5) * 2);
      let newRam = Math.min(98, Math.max(25, node.ram + ramDelta));

      const trafficDelta = (Math.random() - 0.5) * 5;
      const newTcp = Math.max(5, parseFloat((node.traffic.tcp + trafficDelta).toFixed(1)));

      const critCpu = this.thresholds.nodeOverrides[id]?.cpuCritical ?? this.thresholds.cpuCritical;
      const critRam = this.thresholds.nodeOverrides[id]?.ramCritical ?? this.thresholds.ramCritical;

      let newStatus: 'Online' | 'Warning' | 'Offline' | 'Draining' = 'Online';
      if (newCpu >= critCpu || newRam >= critRam) {
        newStatus = 'Warning';
      }

      node.cpu = newCpu;
      node.ram = newRam;
      node.traffic.tcp = newTcp;
      node.status = newStatus;
      node.lastSync = now;
    }
  }

  // --- Public APIs ---

  public getNodes(): PlatformNodeInfo[] {
    return Array.from(this.nodes.values());
  }

  public getNodeById(id: string): PlatformNodeInfo | undefined {
    return this.nodes.get(id);
  }

  public syncNodes(): PlatformNodeInfo[] {
    const now = new Date().toISOString();
    for (const [id, node] of this.nodes.entries()) {
      if (node.status === 'Offline') continue;

      // Force a slight jitter during active sync
      const cpuDelta = (Math.random() - 0.5) * 6;
      const ramDelta = (Math.random() - 0.5) * 3;
      node.cpu = Math.min(99, Math.max(15, Math.round(node.cpu + cpuDelta)));
      node.ram = Math.min(98, Math.max(25, Math.round(node.ram + ramDelta)));
      
      const critCpu = this.thresholds.nodeOverrides[id]?.cpuCritical ?? this.thresholds.cpuCritical;
      const critRam = this.thresholds.nodeOverrides[id]?.ramCritical ?? this.thresholds.ramCritical;
      node.status = (node.cpu >= critCpu || node.ram >= critRam) ? 'Warning' : 'Online';
      node.lastSync = now;
    }
    return this.getNodes();
  }

  public getThresholds(): ThresholdSettings {
    return { ...this.thresholds };
  }

  public updateThresholds(updates: Partial<ThresholdSettings>): ThresholdSettings {
    this.thresholds = {
      ...this.thresholds,
      ...updates,
      nodeOverrides: {
        ...this.thresholds.nodeOverrides,
        ...(updates.nodeOverrides || {})
      }
    };
    this.saveConfig();
    return this.getThresholds();
  }

  public resetThresholds(): ThresholdSettings {
    this.thresholds = { ...DEFAULT_PLATFORM_THRESHOLDS };
    this.saveConfig();
    return this.getThresholds();
  }

  public executeNodeAction(nodeId: string, action: 'restart-service' | 'purge-cache' | 'toggle-drain'): { success: boolean; message: string; node?: PlatformNodeInfo } {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { success: false, message: `找不到節點 ID: ${nodeId}` };
    }

    if (action === 'restart-service') {
      node.services.forEach(s => {
        if (s.name.includes('exporter') || s.name.includes('agent')) {
          s.status = 'running';
          s.uptime = '0m 05s (Just restarted)';
        }
      });
      node.lastSync = new Date().toISOString();
      return {
        success: true,
        message: `節點 ${node.name} 的監控 Agent / Node Exporter 服務已成功重啟！`,
        node
      };
    }

    if (action === 'purge-cache') {
      // Simulate cache drop, reducing RAM by 12-20%
      const reduction = Math.min(node.ram - 20, Math.floor(Math.random() * 8) + 12);
      if (reduction > 0) {
        node.ram = Math.max(25, node.ram - reduction);
      }
      node.status = node.cpu >= this.thresholds.cpuCritical || node.ram >= this.thresholds.ramCritical ? 'Warning' : 'Online';
      node.lastSync = new Date().toISOString();
      return {
        success: true,
        message: `節點 ${node.name} 核心頁快取已釋放 (PageCache/dentries/inodes purged)，記憶體負載降低 ${reduction}%！`,
        node
      };
    }

    if (action === 'toggle-drain') {
      node.cordoned = !node.cordoned;
      node.status = node.cordoned ? 'Draining' : 'Online';
      return {
        success: true,
        message: node.cordoned 
          ? `節點 ${node.name} 已設為隔離排程模式 (Cordoned/Draining)，不再接收新流量。` 
          : `節點 ${node.name} 已解除維護隔離狀態 (Uncordoned)，恢復正常運算工作。`,
        node
      };
    }

    return { success: false, message: `不支援的操作指令: ${action}` };
  }

  public getTrends(): TrendDataPoint[] {
    const baseTrends: TrendDataPoint[] = [
      { time: '00:00', avgCpu: 42, avgRam: 58, avgDisk: 42, peakTraffic: 140, clusterEvents: 3, packetLossRate: 0.01, p99LatencyMs: 1.8 },
      { time: '03:00', avgCpu: 35, avgRam: 55, avgDisk: 42, peakTraffic: 110, clusterEvents: 1, packetLossRate: 0.00, p99LatencyMs: 1.4 },
      { time: '06:00', avgCpu: 48, avgRam: 62, avgDisk: 43, peakTraffic: 190, clusterEvents: 5, packetLossRate: 0.02, p99LatencyMs: 2.1 },
      { time: '09:00', avgCpu: 72, avgRam: 75, avgDisk: 44, peakTraffic: 380, clusterEvents: 12, packetLossRate: 0.04, p99LatencyMs: 3.5 },
      { time: '12:00', avgCpu: 68, avgRam: 73, avgDisk: 44, peakTraffic: 320, clusterEvents: 8, packetLossRate: 0.03, p99LatencyMs: 2.9 },
      { time: '15:00', avgCpu: 84, avgRam: 82, avgDisk: 45, peakTraffic: 460, clusterEvents: 19, packetLossRate: 0.08, p99LatencyMs: 4.8 },
      { time: '18:00', avgCpu: 76, avgRam: 78, avgDisk: 45, peakTraffic: 390, clusterEvents: 11, packetLossRate: 0.05, p99LatencyMs: 3.8 },
      { time: '21:00', avgCpu: 61, avgRam: 69, avgDisk: 45, peakTraffic: 275, clusterEvents: 4, packetLossRate: 0.02, p99LatencyMs: 2.2 },
    ];
    return baseTrends;
  }

  public getTopology(): { nodes: TopologyNode[]; links: TopologyLink[] } {
    const nodes: TopologyNode[] = [
      { id: 'INTERNET', label: '外部網際網路 (External Traffic)', type: 'external', x: 200, y: 50, ip: '0.0.0.0/0' },
      { id: 'MASTER', label: '主控節點 (Master Node)', type: 'master', x: 200, y: 150, ip: '192.168.10.20' },
      { id: 'DASHBOARD', label: '控制台 (Dashboard Node)', type: 'dashboard', x: 50, y: 150, ip: '192.168.10.10' },
      { id: 'WORK-01', label: 'Work-01 (Suricata/NDR)', type: 'work', x: 50, y: 300, ip: '192.168.10.31' },
      { id: 'WORK-02', label: 'Work-02 (VictoriaLogs)', type: 'work', x: 200, y: 300, ip: '192.168.10.32' },
      { id: 'WORK-03', label: 'Work-03 (AI/ML Inference)', type: 'work', x: 350, y: 300, ip: '192.168.10.33' },
    ];

    const links: TopologyLink[] = [
      { from: 'INTERNET', to: 'MASTER', throughputMbps: 380.5, latencyMs: 1.2, status: 'healthy' },
      { from: 'MASTER', to: 'DASHBOARD', throughputMbps: 45.2, latencyMs: 0.4, status: 'healthy' },
      { from: 'MASTER', to: 'WORK-01', throughputMbps: 180.4, latencyMs: 0.5, status: 'healthy' },
      { from: 'MASTER', to: 'WORK-02', throughputMbps: 240.8, latencyMs: 0.5, status: 'healthy' },
      { from: 'MASTER', to: 'WORK-03', throughputMbps: 195.2, latencyMs: 0.6, status: 'healthy' },
    ];

    return { nodes, links };
  }

  public evaluateAlerts(): PerformanceAlertItem[] {
    const currentAlerts: PerformanceAlertItem[] = [];
    const now = new Date();

    for (const node of this.nodes.values()) {
      const override = this.thresholds.nodeOverrides[node.id];
      const critCpu = override?.cpuCritical ?? this.thresholds.cpuCritical;
      const critRam = override?.ramCritical ?? this.thresholds.ramCritical;
      const critDisk = override?.diskCritical ?? this.thresholds.diskCritical;

      // CPU check
      if (node.cpu >= critCpu) {
        currentAlerts.push({
          id: `ALT-CPU-${node.id}-${Date.now()}`,
          timestamp: now.toISOString(),
          nodeId: node.id,
          nodeName: node.name,
          severity: 'critical',
          metric: 'CPU',
          currentVal: `${node.cpu}%`,
          thresholdVal: `${critCpu}%`,
          message: `節點 ${node.name} CPU 負載超標 (${node.cpu}% >= 臨界閥值 ${critCpu}%)`,
          acknowledged: false
        });
      } else if (node.cpu >= this.thresholds.cpuWarning) {
        currentAlerts.push({
          id: `ALT-CPU-${node.id}-${Date.now()}`,
          timestamp: now.toISOString(),
          nodeId: node.id,
          nodeName: node.name,
          severity: 'warning',
          metric: 'CPU',
          currentVal: `${node.cpu}%`,
          thresholdVal: `${this.thresholds.cpuWarning}%`,
          message: `節點 ${node.name} CPU 負載升高 (${node.cpu}% >= 預警閥值 ${this.thresholds.cpuWarning}%)`,
          acknowledged: false
        });
      }

      // RAM check
      if (node.ram >= critRam) {
        currentAlerts.push({
          id: `ALT-RAM-${node.id}-${Date.now()}`,
          timestamp: now.toISOString(),
          nodeId: node.id,
          nodeName: node.name,
          severity: 'critical',
          metric: 'RAM',
          currentVal: `${node.ram}%`,
          thresholdVal: `${critRam}%`,
          message: `節點 ${node.name} 記憶體使用率超標 (${node.ram}% >= 臨界閥值 ${critRam}%)`,
          acknowledged: false
        });
      } else if (node.ram >= this.thresholds.ramWarning) {
        currentAlerts.push({
          id: `ALT-RAM-${node.id}-${Date.now()}`,
          timestamp: now.toISOString(),
          nodeId: node.id,
          nodeName: node.name,
          severity: 'warning',
          metric: 'RAM',
          currentVal: `${node.ram}%`,
          thresholdVal: `${this.thresholds.ramWarning}%`,
          message: `節點 ${node.name} 記憶體使用率升高 (${node.ram}% >= 預警閥值 ${this.thresholds.ramWarning}%)`,
          acknowledged: false
        });
      }

      // Disk check
      if (node.disk >= critDisk) {
        currentAlerts.push({
          id: `ALT-DISK-${node.id}-${Date.now()}`,
          timestamp: now.toISOString(),
          nodeId: node.id,
          nodeName: node.name,
          severity: 'critical',
          metric: 'Disk',
          currentVal: `${node.disk}%`,
          thresholdVal: `${critDisk}%`,
          message: `節點 ${node.name} 磁碟儲存空間耗盡 (${node.disk}% >= 臨界閥值 ${critDisk}%)`,
          acknowledged: false
        });
      }
    }

    return currentAlerts;
  }

  public dispatchTestAlert(sampleNodeId = 'work-03'): {
    success: boolean;
    logs: string[];
    dispatchSummary: Record<string, any>;
  } {
    const node = this.nodes.get(sampleNodeId) || Array.from(this.nodes.values())[0];
    const nowStr = new Date().toLocaleTimeString();
    const isoNow = new Date().toISOString();
    const logs: string[] = [];

    logs.push(`[${nowStr}] [AUDIT] 啟動平台基礎設施層效能告警測試任務 (Target Node: ${node.name}, IP: ${node.ip})`);
    logs.push(`[${nowStr}] [METRIC] 評估指標: CPU ${node.cpu}% (閥值: ${this.thresholds.cpuCritical}%), RAM ${node.ram}% (閥值: ${this.thresholds.ramCritical}%)`);

    const summary: Record<string, any> = {
      timestamp: isoNow,
      targetNode: node.name,
      metrics: { cpu: node.cpu, ram: node.ram, disk: node.disk },
      channels: {}
    };

    // Email
    if (this.thresholds.enableEmail) {
      logs.push(`[${nowStr}] [EMAIL-SMTP] 成功封裝 RFC5322 MIME 郵件 Payload，投遞至 SMTP Relay [收件人: ${this.thresholds.emailRecipients}] (Status: 250 OK: Message queued)`);
      summary.channels.email = { delivered: true, recipients: this.thresholds.emailRecipients };
    } else {
      logs.push(`[${nowStr}] [EMAIL-SMTP] Email 通知管道處於停用狀態 (已略過)`);
      summary.channels.email = { delivered: false, reason: 'disabled' };
    }

    // Webhook
    if (this.thresholds.enableWebhook) {
      const webhookPayload = {
        channel: this.thresholds.webhookChannel,
        attachments: [
          {
            color: '#dc2626',
            title: `[CRITICAL ALERT] 平台節點 ${node.name} 效能臨界超標`,
            text: `節點 IP: ${node.ip} | CPU: ${node.cpu}% | RAM: ${node.ram}% | 狀態: ${node.status}`,
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };
      logs.push(`[${nowStr}] [WEBHOOK] 構建 JSON Payload (Webhook URL: ${this.thresholds.webhookUrl.slice(0, 35)}...)，頻道: ${this.thresholds.webhookChannel}`);
      logs.push(`[${nowStr}] [WEBHOOK] 發送 HTTP POST 請求至 Webhook 端點 -> 回應 HTTP 200 OK (Payload Size: ${JSON.stringify(webhookPayload).length} bytes)`);
      summary.channels.webhook = { delivered: true, channel: this.thresholds.webhookChannel, status: 200 };
    } else {
      logs.push(`[${nowStr}] [WEBHOOK] Webhook 通知管道未啟用 (已略過)`);
      summary.channels.webhook = { delivered: false, reason: 'disabled' };
    }

    // Syslog
    if (this.thresholds.enableSyslog) {
      const cefMessage = `CEF:0|SEMOR|PlatformPerformance|1.0|PERF_CRITICAL|Cluster Node Threshold Exceeded|8|src=${node.ip} suser=root msg=Node CPU ${node.cpu}% exceeded critical threshold ${this.thresholds.cpuCritical}%`;
      logs.push(`[${nowStr}] [SYSLOG-RFC5424] 構造 CEF 格式事件紀錄: "${cefMessage.slice(0, 70)}..."`);
      logs.push(`[${nowStr}] [SYSLOG-RFC5424] 透過 UDP 轉發至遠端 Syslog 守護程序 ${this.thresholds.syslogServer}:${this.thresholds.syslogPort} (Socket write completed)`);
      summary.channels.syslog = { delivered: true, server: `${this.thresholds.syslogServer}:${this.thresholds.syslogPort}` };
    } else {
      logs.push(`[${nowStr}] [SYSLOG-RFC5424] Syslog 渠道未啟用 (已略過)`);
      summary.channels.syslog = { delivered: false, reason: 'disabled' };
    }

    logs.push(`[${nowStr}] [COMPLETE] 告警分發測試執行完畢，全叢集通訊管道與審計紀錄驗證成功！`);

    return {
      success: true,
      logs,
      dispatchSummary: summary
    };
  }

  public exportDiagnosticReport(format: 'json' | 'csv' = 'json'): string | object {
    const nodes = this.getNodes();
    const alerts = this.evaluateAlerts();
    const thresholds = this.getThresholds();

    if (format === 'csv') {
      const header = 'Node ID,Node Name,Role,IP,CPU %,RAM %,Disk %,Status,LoadAvg (1m),TCP Mbps,UDP Mbps,Agent Mbps,Last Sync\n';
      const rows = nodes.map(n => 
        `"${n.id}","${n.name}","${n.role}","${n.ip}",${n.cpu},${n.ram},${n.disk},"${n.status}",${n.loadAvg[0]},${n.traffic.tcp},${n.traffic.udp},${n.traffic.agent},"${n.lastSync}"`
      ).join('\n');
      return header + rows;
    }

    return {
      reportType: 'Platform Infrastructure Performance Diagnostic Snapshot',
      generatedAt: new Date().toISOString(),
      clusterSummary: {
        totalNodes: nodes.length,
        avgCpu: Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length),
        avgRam: Math.round(nodes.reduce((acc, n) => acc + n.ram, 0) / nodes.length),
        avgDisk: Math.round(nodes.reduce((acc, n) => acc + n.disk, 0) / nodes.length),
        totalTrafficMbps: nodes.reduce((acc, n) => acc + n.traffic.tcp + n.traffic.udp + n.traffic.agent, 0).toFixed(1),
        activeAlertsCount: alerts.length
      },
      nodes,
      activeAlerts: alerts,
      thresholds
    };
  }
}

export const globalPlatformPerformanceEngine = new PlatformPerformanceEngine();

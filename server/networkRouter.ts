import { Router, Request, Response } from 'express';

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

export function createNetworkRouter() {
  const router = Router();

  // Initial High-Fidelity Network Devices Dataset
  let networkDevices: NetworkDevice[] = [
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

  let networkConnections: NetworkConnection[] = [
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
      latestScan: latestScanJob
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

  return router;
}

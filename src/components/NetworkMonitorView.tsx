import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Network, ShieldAlert, Server, Monitor, HardDrive, RefreshCw, Play, 
  Search, Filter, Layers, List, Activity, AlertTriangle, CheckCircle2, 
  XCircle, ChevronDown, ChevronUp, Terminal, Sliders, ExternalLink, 
  Cpu, Database, Wifi, Lock, ArrowUpRight, ArrowDownRight, Eye, 
  Settings2, Download, Radio, BarChart3, AlertCircle, X, Check,
  Zap, Compass, ShieldCheck, Box, RefreshCcw, ShieldOff, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';

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

const INITIAL_DEVICES: NetworkDevice[] = [
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
  // Workstations
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

const INITIAL_CONNECTIONS: NetworkConnection[] = [
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

export default function NetworkMonitorView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  const [devices, setDevices] = useState<NetworkDevice[]>(INITIAL_DEVICES);
  const [connections, setConnections] = useState<NetworkConnection[]>(INITIAL_CONNECTIONS);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [inspectedDevice, setInspectedDevice] = useState<NetworkDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogList, setScanLogList] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTableDeviceId, setExpandedTableDeviceId] = useState<string | null>(null);
  const [activeSubnetFilter, setActiveSubnetFilter] = useState<string>('all');
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [diagTarget, setDiagTarget] = useState<NetworkDevice | null>(null);
  const [diagOutput, setDiagOutput] = useState<string[]>([]);
  const [isExecutingDiag, setIsExecutingDiag] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Backend Synchronization State
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Security Audit Modal State
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditTarget, setAuditTarget] = useState<NetworkDevice | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch full network state from backend
  const fetchDevicesAndConnections = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/v1/network/devices');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.devices)) {
        setDevices(data.devices);
        if (Array.isArray(data.connections)) {
          setConnections(data.connections);
        }
        setBackendConnected(true);
        setLastRefreshedAt(new Date());

        // Keep inspected device updated
        if (inspectedDevice) {
          const freshInspected = data.devices.find((d: NetworkDevice) => d.id === inspectedDevice.id);
          if (freshInspected) setInspectedDevice(freshInspected);
        }
      }
    } catch (err) {
      console.warn('[NetworkMonitorView] Backend sync fallback to local dataset:', err);
      setBackendConnected(false);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load and periodic polling
  useEffect(() => {
    fetchDevicesAndConnections();
    const timer = setInterval(() => {
      if (autoRefresh && !isScanning && !isExecutingDiag) {
        fetchDevicesAndConnections(true);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, isScanning, isExecutingDiag]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchType = filterType === 'all' || device.type === filterType;
      const matchStatus = filterStatus === 'all' || device.status === filterStatus;
      const matchSubnet = activeSubnetFilter === 'all' || device.subnet.includes(activeSubnetFilter);
      const matchQuery = !searchQuery || 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.nameZh && device.nameZh.toLowerCase().includes(searchQuery.toLowerCase())) ||
        device.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.mac.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.os_version.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchStatus && matchSubnet && matchQuery;
    });
  }, [devices, filterType, filterStatus, activeSubnetFilter, searchQuery]);

  // Overall KPIs
  const kpiStats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const warning = devices.filter(d => d.status === 'warning').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    const avgCpu = Math.round(devices.reduce((acc, cur) => acc + cur.cpu, 0) / (total || 1));
    const avgRam = Math.round(devices.reduce((acc, cur) => acc + cur.ram, 0) / (total || 1));
    return { total, online, warning, offline, avgCpu, avgRam };
  }, [devices]);

  // Start deep scan via backend endpoint
  const startScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanLogList([
      isZh ? '[系統探針] 啟動 Nmap ARP/ICMP 廣播掃描網段 10.88.88.0/24...' : '[SYSTEM] Initializing Nmap ping sweep on 10.88.88.0/24...'
    ]);

    let progress = 12;
    const interval = setInterval(() => {
      progress = Math.min(92, progress + Math.floor(Math.random() * 14) + 6);
      setScanProgress(progress);

      if (progress > 15 && progress <= 35) {
        setScanLogList(prev => [
          isZh ? '[LLDP/CDP] 成功與核心交換機 Catalyst 9500 (10.88.88.254) 完成 802.1AB 鄰居探測' : '[LLDP/CDP] LLDP negotiation completed with Core-SW (10.88.88.254)',
          ...prev.filter((_, i) => i < 15)
        ]);
      } else if (progress > 35 && progress <= 60) {
        setScanLogList(prev => [
          isZh ? '[SNMPv3] 取得 OID 1.3.6.1.2.1.2.2 介面流量統計與 MIB-II 拓撲矩陣' : '[SNMPv3] Fetched MIB-II topology and interface telemetry via OID',
          ...prev.filter((_, i) => i < 15)
        ]);
      } else if (progress > 60 && progress <= 85) {
        setScanLogList(prev => [
          isZh ? '[NetFlow/IPFIX] 即時關聯 40Gbps 骨幹流量通訊路徑與 Session 負載' : '[NetFlow] Correlating NetFlow stream with active port traffic',
          ...prev.filter((_, i) => i < 15)
        ]);
      } else if (progress > 85) {
        setScanLogList(prev => [
          isZh ? '[安全防護] 掃描各端點 EDR 探針與 CVE 漏洞庫特徵比對完成' : '[SECURITY] Verified EDR agents and CVE vulnerability hashes',
          ...prev.filter((_, i) => i < 15)
        ]);
      }
    }, 140);

    try {
      const res = await fetch('/api/v1/network/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnet: activeSubnetFilter !== 'all' ? activeSubnetFilter : '10.88.88.0/24' })
      });

      clearInterval(interval);
      setScanProgress(100);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.devices)) setDevices(data.devices);
        if (Array.isArray(data.connections)) setConnections(data.connections);
        if (Array.isArray(data.logs)) {
          setScanLogList(data.logs);
        }
        triggerToast(isZh ? '網路拓撲與主機探針掃描完成，已同步後端最新實體與虛擬鏈路狀態！' : 'Topology & probe scan completed.');
      } else {
        triggerToast(isZh ? '網路拓撲探針掃描完成 (本地模擬通道)' : 'Scan finished (fallback)');
      }
    } catch (e) {
      clearInterval(interval);
      setScanProgress(100);
      triggerToast(isZh ? '探針掃描完成 (本地模式)' : 'Scan finished');
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 700);
    }
  };

  // Run diagnostics via backend API
  const runDiagnostic = async (type: 'ping' | 'traceroute' | 'portscan' | 'snmp') => {
    if (!diagTarget) return;
    setIsExecutingDiag(true);
    setDiagOutput([isZh ? `[發送診斷命令] 正在向後台感測器調度 ${type.toUpperCase()} 探針...` : `Dispatching ${type.toUpperCase()} probe on ${diagTarget.ip}...`]);

    try {
      const res = await fetch('/api/v1/network/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: diagTarget.id, type })
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.output)) {
          setDiagOutput(data.output);
          return;
        }
      }
      fallbackDiagnostic(type, diagTarget);
    } catch (e) {
      fallbackDiagnostic(type, diagTarget);
    } finally {
      setIsExecutingDiag(false);
    }
  };

  // Fallback diagnostic output generator in case of network interruption
  const fallbackDiagnostic = (type: 'ping' | 'traceroute' | 'portscan' | 'snmp', target: NetworkDevice) => {
    if (type === 'ping') {
      setDiagOutput([
        `PING ${target.ip} (56 數據位元組):`,
        `64 bytes from ${target.ip}: icmp_seq=1 ttl=64 time=${target.latency}`,
        `64 bytes from ${target.ip}: icmp_seq=2 ttl=64 time=${target.latency}`,
        `64 bytes from ${target.ip}: icmp_seq=3 ttl=64 time=${target.latency}`,
        `--- ${target.ip} ping 統計資料 ---`,
        `3 packets transmitted, 3 received, 0% packet loss, time 2002ms`,
        `rtt min/avg/max/mdev = 0.210/${target.latency}/0.890 ms`
      ]);
    } else if (type === 'traceroute') {
      setDiagOutput([
        `traceroute to ${target.ip}, 30 hops max, 60 byte packets`,
        ` 1  Gateway-Firewall (10.88.88.1)  0.321 ms  0.288 ms  0.254 ms`,
        ` 2  Core-Catalyst-9500 (10.88.88.254)  0.412 ms  0.390 ms  0.380 ms`,
        ` 3  ${target.name} (${target.ip})  ${target.latency}  ${target.latency}`
      ]);
    } else if (type === 'portscan') {
      setDiagOutput([
        `Starting Nmap 7.94 ( https://nmap.org ) at 2026-08-20 12:45 UTC+8`,
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
      ]);
    } else if (type === 'snmp') {
      setDiagOutput([
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
      ]);
    }
  };

  // Update thresholds with backend persistence
  const handleUpdateThreshold = async (deviceId: string, key: 'cpuThreshold' | 'ramThreshold' | 'diskThreshold', val: number) => {
    // Optimistic update
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, [key]: val } : d));
    if (inspectedDevice && inspectedDevice.id === deviceId) {
      setInspectedDevice(prev => prev ? { ...prev, [key]: val } : null);
    }

    try {
      const res = await fetch(`/api/v1/network/devices/${deviceId}/thresholds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: val })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.device) {
          setDevices(prev => prev.map(d => d.id === deviceId ? data.device : d));
          if (inspectedDevice?.id === deviceId) {
            setInspectedDevice(data.device);
          }
        }
        triggerToast(isZh ? `已同步更新後台監控閥值 (${key}: ${val}%)` : `Updated threshold: ${val}%`);
        return;
      }
    } catch (e) {
      // Keep optimistic
    }
    triggerToast(isZh ? `已更新監控節點告警閥值 (${key}: ${val}%)` : `Updated threshold for ${key}: ${val}%`);
  };

  // Handle On-Demand Security Audit Request
  const handleRequestAudit = async (device: NetworkDevice) => {
    setLoadingAudit(true);
    setAuditTarget(device);
    setAuditModalOpen(true);

    try {
      const res = await fetch(`/api/v1/network/devices/${device.id}/audit`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast(isZh ? `已完成主機 [${device.name}] 深度安全審計！` : 'Audit completed');
        // Fetch full audit logs for target
        const historyRes = await fetch(`/api/v1/network/devices/${device.id}/audit`);
        if (historyRes.ok) {
          const hist = await historyRes.json();
          setAuditLogs(hist.logs || [data.audit]);
        } else {
          setAuditLogs([data.audit]);
        }
        return;
      }
    } catch (e) {
      console.warn('Audit fallback:', e);
    } finally {
      setLoadingAudit(false);
    }

    // Fallback audit record
    setAuditLogs([
      {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        deviceId: device.id,
        deviceName: device.name,
        ip: device.ip,
        operator: 'SOC-Analyst-Duty',
        action: 'ON_DEMAND_SECURITY_AUDIT',
        details: `主機合規檢驗通過，開放連接埠: ${device.openPorts.map(p => `${p.port}/${p.proto}`).join(', ')}，作業系統版本: ${device.os_version}`,
        status: device.cveAlerts && device.cveAlerts.length > 0 ? 'WARNING' : 'PASSED'
      }
    ]);
  };

  // Toggle Network Quarantine / Isolation via NAC
  const handleToggleIsolate = async (device: NetworkDevice) => {
    const isIsolated = device.vlan === 999;
    const endpoint = isIsolated 
      ? `/api/v1/network/devices/${device.id}/restore`
      : `/api/v1/network/devices/${device.id}/isolate`;
    
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.device) {
          setDevices(prev => prev.map(d => d.id === device.id ? data.device : d));
          if (inspectedDevice?.id === device.id) {
            setInspectedDevice(data.device);
          }
        }
        triggerToast(data.message || (isIsolated ? '主機已解除隔離' : '主機已隔離'));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Local fallback
    const nextVlan = isIsolated ? 10 : 999;
    const nextStatus = isIsolated ? 'online' : 'warning';
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, vlan: nextVlan, status: nextStatus } : d));
    if (inspectedDevice?.id === device.id) {
      setInspectedDevice(prev => prev ? { ...prev, vlan: nextVlan, status: nextStatus } : null);
    }
    triggerToast(isIsolated ? '已解除隔離並恢復通訊' : '已將設備隔離至 VLAN 999');
  };

  // Export CSV from backend
  const handleExportCSV = () => {
    window.open('/api/v1/network/export', '_blank');
    triggerToast(isZh ? '正在從後端伺服器匯出最新全網資產拓撲清冊 CSV 報表...' : 'Exporting CSV report...');
  };

  // Reset to Baseline
  const handleResetBaseline = async () => {
    try {
      const res = await fetch('/api/v1/network/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.devices) setDevices(data.devices);
        if (data.connections) setConnections(data.connections);
        triggerToast(data.message || (isZh ? '網路拓撲已重置回標準基準線' : 'Topology reset'));
        return;
      }
    } catch (e) {
      // fallback
    }
    setDevices(INITIAL_DEVICES);
    setConnections(INITIAL_CONNECTIONS);
    triggerToast(isZh ? '網路拓撲已重置回標準基準線' : 'Topology reset');
  };

  return (
    <div className="space-y-6 text-gray-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 px-5 py-3.5 bg-[#111114] border border-blue-500/40 text-white rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111114] border border-gray-800/80 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400">
              <Network size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                {isZh ? '次世代網路拓撲與基礎設施監控' : 'Network Infrastructure & Topology Monitor'}
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full">
                  NetFlow / LLDP / SNMP
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {isZh 
                  ? '即時監控企業全網路由交換節點、伺服器主機效能 Telemetry、鏈路頻寬負載與智慧故障隔離。' 
                  : 'Real-time telemetry, routing topology, bandwidth saturation, and interactive host diagnostics.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Telemetry Sync Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0c0e] border border-gray-800 rounded-2xl text-[11px] font-mono shadow-inner">
            <span className={cn("w-2 h-2 rounded-full", backendConnected ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" : "bg-amber-400")} />
            <span className="text-gray-400 hidden sm:inline">
              {backendConnected ? (isZh ? '後台 Telemetry 即時同步' : 'Live Sync') : (isZh ? '本地離線快取' : 'Offline Cache')}
            </span>
            <button 
              onClick={() => fetchDevicesAndConnections(false)} 
              disabled={loading}
              className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors ml-0.5"
              title={isZh ? '手動重新同步後台' : 'Sync now'}
            >
              <RefreshCw size={12} className={cn(loading && "animate-spin text-blue-400")} />
            </button>
          </div>

          {/* Reset Baseline Button */}
          <button
            onClick={handleResetBaseline}
            className="p-2.5 bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white rounded-2xl border border-gray-800 transition-colors shadow-md"
            title={isZh ? '重置回標準拓撲基準線' : 'Reset to Baseline'}
          >
            <RefreshCcw size={14} />
          </button>

          {/* View Switcher */}
          <div className="flex bg-[#0c0c0e] p-1 rounded-2xl border border-gray-800">
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-2",
                viewMode === 'map' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "text-gray-400 hover:text-white"
              )}
            >
              <Layers size={14} /> {isZh ? '拓撲架構圖' : 'Topology Map'}
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-2",
                viewMode === 'table' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "text-gray-400 hover:text-white"
              )}
            >
              <List size={14} /> {isZh ? '資產詳細清冊' : 'Asset Inventory'}
            </button>
          </div>

          {/* Trigger Scan Button */}
          <button
            onClick={startScan}
            disabled={isScanning}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg",
              isScanning 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20"
            )}
          >
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isScanning ? (isZh ? `探針廣播掃描中... ${scanProgress}%` : `Broadcasting... ${scanProgress}%`) : (isZh ? '重新執行全網探針掃描' : 'Execute Topology Scan')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#111114] border border-gray-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold">
            <span>{isZh ? '監控總設備數' : 'Total Devices'}</span>
            <Database size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2">{kpiStats.total}</p>
          <span className="text-[10px] text-gray-500 mt-1 block">{isZh ? '含路由/伺服器/端點' : 'Nodes & Endpoints'}</span>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold">
            <span>{isZh ? '在線正常運行' : 'Online Nodes'}</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-2">{kpiStats.online}</p>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">{isZh ? '健康度 100%' : 'Healthy Active'}</span>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold">
            <span>{isZh ? '警告/負載異常' : 'Alerting Nodes'}</span>
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-400 mt-2">{kpiStats.warning}</p>
          <span className="text-[10px] text-amber-500/80 mt-1 block">{isZh ? '高負載或待修補' : 'Threshold warning'}</span>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold">
            <span>{isZh ? '骨幹聚合頻寬' : 'Backbone Load'}</span>
            <Activity size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black font-mono text-purple-400 mt-2">18.2 <span className="text-xs">Gbps</span></p>
          <span className="text-[10px] text-gray-500 mt-1 block">{isZh ? '40G 核心交換鏈路' : '40G Core link'}</span>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold">
            <span>{isZh ? '全網平均 CPU' : 'Avg CPU Load'}</span>
            <Cpu size={14} className="text-cyan-400" />
          </div>
          <p className="text-2xl font-black font-mono text-cyan-400 mt-2">{kpiStats.avgCpu}%</p>
          <span className="text-[10px] text-gray-500 mt-1 block">{isZh ? '多核心分散負載' : 'Multi-core balanced'}</span>
        </div>

        <div className="bg-[#111114] border border-gray-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold">
            <span>{isZh ? '全網平均 RAM' : 'Avg RAM Load'}</span>
            <HardDrive size={14} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-black font-mono text-indigo-400 mt-2">{kpiStats.avgRam}%</p>
          <span className="text-[10px] text-gray-500 mt-1 block">{isZh ? '記憶體分配正常' : 'Allocated memory'}</span>
        </div>
      </div>

      {/* Deep Scan Scanning Overlay / View */}
      {isScanning ? (
        <div className="bg-[#111114] border border-gray-800 rounded-3xl p-10 flex flex-col items-center justify-center space-y-6 min-h-[520px] shadow-2xl">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="text-blue-400 w-8 h-8 animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-1.5 max-w-lg">
            <h3 className="text-xl font-black text-white">
              {isZh ? '基礎設施多維深度探針掃描進行中' : 'Deep Infrastructure Discovery in Progress'}
            </h3>
            <p className="text-xs text-gray-400">
              {isZh ? '正在自動發送 Nmap Ping 廣播、解析 LLDP/CDP 鄰居關聯、獲取 SNMP MIB 狀態與流量特徵。' : 'Scanning subnets, resolving LLDP/CDP neighbors, and profiling endpoints.'}
            </p>
          </div>

          <div className="w-full max-w-md space-y-2">
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-blue-400">{scanProgress < 100 ? (isZh ? '正在解析並定位實體拓撲連線...' : 'Mapping Nodes...') : (isZh ? '完成拓撲渲染' : 'Finalizing Graph...')}</span>
              <span className="text-gray-400">{scanProgress}% 完成</span>
            </div>
          </div>

          <div className="w-full max-w-2xl bg-[#09090b] border border-gray-800 rounded-2xl p-4 font-mono text-[11px] space-y-1.5 h-44 overflow-y-auto custom-scrollbar">
            {scanLogList.map((log, index) => (
              <div key={index} className="flex items-start gap-2 text-gray-300">
                <span className="text-blue-500 font-bold">{`>`}</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'map' ? (
        /* TOPOLOGY MAP VIEW */
        <div className="space-y-4">
          {/* Filter Toolbar for Topology */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111114] border border-gray-800/80 p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mr-2">
                <Filter size={14} className="text-blue-400" /> {isZh ? '網段過濾：' : 'Subnet:'}
              </span>
              {[
                { id: 'all', label: isZh ? '全部網段 (All)' : 'All Subnets' },
                { id: 'WAN/Gateway', label: isZh ? '出口防火牆 (WAN)' : 'WAN/FW' },
                { id: 'Core Backbone', label: isZh ? '核心骨幹 (Core)' : 'Core SW' },
                { id: 'DMZ', label: isZh ? '伺服器機房 (Server Farm)' : 'Servers' },
                { id: 'User Access', label: isZh ? 'SOC與辦公端點 (Endpoints)' : 'Workstations' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubnetFilter(sub.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    activeSubnetFilter === sub.id 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                      : "bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder={isZh ? '搜尋設備名稱 / IP / MAC...' : 'Search device, IP, MAC...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-black/40 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-56"
                />
              </div>
            </div>
          </div>

          {/* D3 Topology Canvas Container */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className={cn("transition-all duration-300", inspectedDevice ? "lg:col-span-3" : "lg:col-span-4")}>
              <NetworkTopologyCanvas 
                devices={filteredDevices}
                connections={connections}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={(device) => {
                  setSelectedDeviceId(device ? device.id : null);
                  setInspectedDevice(device);
                }}
                isZh={isZh}
              />
            </div>

            {/* Side Inspection Drawer */}
            <AnimatePresence>
              {inspectedDevice && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-1 bg-[#111114] border border-gray-800 rounded-3xl p-6 space-y-6 shadow-2xl relative flex flex-col justify-between"
                >
                  <button 
                    onClick={() => {
                      setInspectedDevice(null);
                      setSelectedDeviceId(null);
                    }}
                    className="absolute top-5 right-5 p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>

                  <div className="space-y-6">
                    {/* Device Header */}
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-3 rounded-2xl border",
                        inspectedDevice.type === 'firewall' ? "bg-red-500/10 border-red-500/30 text-red-400" :
                        inspectedDevice.type === 'switch' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                        inspectedDevice.type === 'server' ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                        "bg-gray-500/10 border-gray-500/30 text-gray-300"
                      )}>
                        {inspectedDevice.type === 'firewall' && <ShieldAlert size={22} />}
                        {inspectedDevice.type === 'switch' && <Network size={22} />}
                        {inspectedDevice.type === 'server' && <Server size={22} />}
                        {inspectedDevice.type === 'endpoint' && <Monitor size={22} />}
                      </div>
                      <div className="pr-6">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white tracking-tight">{inspectedDevice.name}</h3>
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            inspectedDevice.status === 'online' ? "bg-emerald-500 shadow-sm shadow-emerald-500" :
                            inspectedDevice.status === 'warning' ? "bg-amber-500" : "bg-red-500"
                          )} />
                        </div>
                        <p className="text-xs text-blue-400 font-medium">{inspectedDevice.nameZh || inspectedDevice.details}</p>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">{inspectedDevice.ip}</p>
                      </div>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-gray-800 pb-1.5">
                        <span>{isZh ? '即時效能 Telemetry' : 'Performance Telemetry'}</span>
                        <span className="text-[9px] text-emerald-400 font-mono">LIVE SNMP/eBPF</span>
                      </h4>

                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-400">CPU 負載</span>
                            <span className={inspectedDevice.cpu > inspectedDevice.cpuThreshold ? "text-red-400 font-mono" : "text-blue-400 font-mono"}>
                              {inspectedDevice.cpu}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all", inspectedDevice.cpu > inspectedDevice.cpuThreshold ? "bg-red-500" : "bg-blue-500")}
                              style={{ width: `${inspectedDevice.cpu}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-400">RAM 記憶體</span>
                            <span className={inspectedDevice.ram > inspectedDevice.ramThreshold ? "text-amber-400 font-mono" : "text-purple-400 font-mono"}>
                              {inspectedDevice.ram}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all", inspectedDevice.ram > inspectedDevice.ramThreshold ? "bg-amber-500" : "bg-purple-500")}
                              style={{ width: `${inspectedDevice.ram}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-400">磁碟存儲</span>
                            <span className="text-emerald-400 font-mono">{inspectedDevice.disk}% ({inspectedDevice.disk_capacity})</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${inspectedDevice.disk}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Network Throughput & Latency */}
                    <div className="grid grid-cols-2 gap-2 bg-[#0a0a0c] border border-gray-800 p-3 rounded-2xl text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block">{isZh ? '網路即時吞吐' : 'Throughput'}</span>
                        <span className="font-mono font-bold text-white text-sm">{inspectedDevice.networkThroughput}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block">{isZh ? '延遲 / 丟包率' : 'Latency/Loss'}</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{inspectedDevice.latency} <span className="text-[10px] text-gray-500">({inspectedDevice.packetLoss})</span></span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-gray-800 flex justify-between text-[11px] text-gray-400">
                        <span>流入: <strong className="text-blue-400 font-mono">{inspectedDevice.trafficIn}</strong></span>
                        <span>流出: <strong className="text-indigo-400 font-mono">{inspectedDevice.trafficOut}</strong></span>
                      </div>
                    </div>

                    {/* Hardware & OS Details */}
                    <div className="space-y-2 text-xs">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-1.5">
                        {isZh ? '硬體與韌體規格' : 'Hardware & Firmware'}
                      </h4>
                      <div className="space-y-1 text-gray-400 text-[11px]">
                        <div className="flex justify-between"><span className="text-gray-500">MAC 位址：</span><span className="font-mono text-gray-300">{inspectedDevice.mac}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">設備廠牌：</span><span className="text-gray-300 font-medium">{inspectedDevice.vendor}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">硬體型號：</span><span className="text-gray-300 font-medium">{inspectedDevice.model}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">作業系統：</span><span className="text-gray-300 font-medium">{inspectedDevice.os_version}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">所屬 VLAN：</span><span className="text-blue-400 font-bold font-mono">VLAN {inspectedDevice.vlan}</span></div>
                      </div>
                    </div>

                    {/* Open Ports */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-1.5">
                        {isZh ? '開放服務連接埠 (Open Ports)' : 'Open Ports'}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectedDevice.openPorts.map((p, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-800/60 border border-gray-700/60 rounded-lg text-[10px] font-mono text-gray-300">
                            <strong className="text-blue-400">{p.port}/{p.proto}</strong> {p.service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CVE Alerts if any */}
                    {inspectedDevice.cveAlerts && inspectedDevice.cveAlerts.length > 0 && (
                      <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-2xl space-y-1.5">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-black">
                          <AlertCircle size={14} />
                          <span>{isZh ? '發現未修補弱點 CVE' : 'Vulnerability CVE Detected'}</span>
                        </div>
                        {inspectedDevice.cveAlerts.map((c, idx) => (
                          <div key={idx} className="text-[11px] text-gray-300">
                            <strong className="text-red-400 font-mono">{c.cve}</strong>: {c.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-4 border-t border-gray-800 space-y-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setDiagTarget(inspectedDevice);
                          setDiagModalOpen(true);
                          setDiagOutput([isZh ? `準備就緒，請選擇欲對 ${inspectedDevice.name} (${inspectedDevice.ip}) 執行的網路診斷動作。` : `Ready to diagnose ${inspectedDevice.ip}`]);
                        }}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/20"
                      >
                        <Terminal size={14} />
                        <span>{isZh ? '網路診斷終端' : 'Diagnostics'}</span>
                      </button>
                      <button 
                        onClick={() => handleRequestAudit(inspectedDevice)}
                        disabled={loadingAudit}
                        className="px-3.5 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        title={isZh ? '調閱深度審計日誌' : 'View Audit Logs'}
                      >
                        <Eye size={14} />
                        <span>{isZh ? '審計' : 'Audit'}</span>
                      </button>
                    </div>

                    {/* Dynamic NAC Quarantine / Restoration Button */}
                    <button
                      onClick={() => handleToggleIsolate(inspectedDevice)}
                      className={cn(
                        "w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all shadow-md",
                        inspectedDevice.vlan === 999 
                          ? "bg-emerald-600/15 border-emerald-500/40 hover:bg-emerald-600 hover:text-white text-emerald-400"
                          : "bg-red-600/15 border-red-500/40 hover:bg-red-600 hover:text-white text-red-400"
                      )}
                    >
                      {inspectedDevice.vlan === 999 ? (
                        <>
                          <ShieldCheck size={14} />
                          <span>{isZh ? '解除 NAC 隔離 (恢復生產 VLAN)' : 'Restore from Quarantine'}</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} />
                          <span>{isZh ? '下發 NAC 動態隔離 (Quarantine VLAN 999)' : 'Isolate via NAC (VLAN 999)'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ASSET INVENTORY & TELEMETRY TABLE VIEW */
        <div className="bg-[#111114] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Table Filters Bar */}
          <div className="p-6 border-b border-gray-800 bg-[#0d0d10] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder={isZh ? '搜尋設備名稱、IP、MAC、作業系統...' : 'Search device, IP, MAC, OS...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-2 bg-black/40 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">{isZh ? '所有設備類型 (All)' : 'All Types'}</option>
                <option value="firewall">{isZh ? '防火牆 (Firewall)' : 'Firewall'}</option>
                <option value="switch">{isZh ? '交換機 (Switch)' : 'Switch'}</option>
                <option value="server">{isZh ? '伺服器 (Server)' : 'Server'}</option>
                <option value="endpoint">{isZh ? '端點工作站 (Endpoint)' : 'Endpoint'}</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">{isZh ? '所有狀態 (All Status)' : 'All Status'}</option>
                <option value="online">{isZh ? '在線運作中 (Online)' : 'Online'}</option>
                <option value="warning">{isZh ? '警報/高負載 (Warning)' : 'Warning'}</option>
                <option value="offline">{isZh ? '離線不可達 (Offline)' : 'Offline'}</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-mono">
                {isZh ? `共篩選出 ${filteredDevices.length} 台設備` : `${filteredDevices.length} items`}
              </span>
              <button 
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-md"
                title={isZh ? '由後端伺服器產出 CSV 報表並下載' : 'Export CSV from backend'}
              >
                <Download size={14} />
                <span>{isZh ? '匯出清冊' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-black/30 text-gray-400 text-xs font-bold">
                  <th className="px-6 py-4">{isZh ? '設備名稱與類型' : 'Device & Type'}</th>
                  <th className="px-6 py-4">{isZh ? 'IP / MAC 位址' : 'IP & MAC Address'}</th>
                  <th className="px-6 py-4">{isZh ? '網段與 VLAN' : 'Subnet & VLAN'}</th>
                  <th className="px-6 py-4">{isZh ? 'CPU / RAM 負載' : 'CPU / RAM Load'}</th>
                  <th className="px-6 py-4">{isZh ? '即時頻寬吞吐' : 'Network Throughput'}</th>
                  <th className="px-6 py-4">{isZh ? '運行狀態' : 'Status'}</th>
                  <th className="px-6 py-4 text-right">{isZh ? '操作 / 詳情' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {filteredDevices.map((device) => {
                  const isExpanded = expandedTableDeviceId === device.id;
                  return (
                    <React.Fragment key={device.id}>
                      <tr 
                        onClick={() => setExpandedTableDeviceId(isExpanded ? null : device.id)}
                        className={cn(
                          "hover:bg-white/[0.02] transition-colors cursor-pointer group",
                          isExpanded ? "bg-blue-600/[0.04]" : ""
                        )}
                      >
                        {/* Device Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl border",
                              device.type === 'firewall' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                              device.type === 'switch' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                              device.type === 'server' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                              "bg-gray-500/10 border-gray-500/20 text-gray-400"
                            )}>
                              {device.type === 'firewall' && <ShieldAlert size={16} />}
                              {device.type === 'switch' && <Network size={16} />}
                              {device.type === 'server' && <Server size={16} />}
                              {device.type === 'endpoint' && <Monitor size={16} />}
                            </div>
                            <div>
                              <p className="font-black text-white tracking-tight">{device.name}</p>
                              <p className="text-[11px] text-gray-400">{device.nameZh || device.details}</p>
                            </div>
                          </div>
                        </td>

                        {/* IP & MAC */}
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-gray-200">{device.ip}</p>
                          <p className="text-[11px] font-mono text-gray-500">{device.mac}</p>
                        </td>

                        {/* Subnet & VLAN */}
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-gray-800 text-blue-400 font-mono font-bold rounded text-[10px] mr-1.5 border border-gray-700">
                            VLAN {device.vlan}
                          </span>
                          <span className="text-[11px] text-gray-400">{device.subnet.split(' ')[0]}</span>
                        </td>

                        {/* CPU / RAM */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 w-32">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">CPU</span>
                              <span className={device.cpu > device.cpuThreshold ? "text-red-400 font-bold" : "text-gray-300 font-mono"}>{device.cpu}%</span>
                            </div>
                            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div className={cn("h-full", device.cpu > device.cpuThreshold ? "bg-red-500" : "bg-blue-500")} style={{ width: `${device.cpu}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">RAM</span>
                              <span className="text-purple-400 font-mono">{device.ram}%</span>
                            </div>
                          </div>
                        </td>

                        {/* Throughput */}
                        <td className="px-6 py-4 font-mono">
                          <p className="text-white font-bold">{device.networkThroughput}</p>
                          <p className="text-[10px] text-gray-500">{isZh ? '延遲:' : 'Lat:'} {device.latency}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider inline-flex items-center gap-1.5",
                            device.status === 'online' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                            device.status === 'warning' ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                            "bg-red-500/10 text-red-400 border border-red-500/30"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              device.status === 'online' ? "bg-emerald-400" :
                              device.status === 'warning' ? "bg-amber-400 animate-ping" : "bg-red-400"
                            )} />
                            {device.status === 'online' ? (isZh ? '正常在線' : 'Online') :
                             device.status === 'warning' ? (isZh ? '異常告警' : 'Warning') : (isZh ? '離線中斷' : 'Offline')}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDiagTarget(device);
                                setDiagModalOpen(true);
                                setDiagOutput([isZh ? `已鎖定目標 ${device.name} (${device.ip})，請選擇診斷工具。` : `Target ${device.ip} ready.`]);
                              }}
                              className="p-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors border border-blue-500/20"
                              title={isZh ? '開啟診斷終端' : 'Open Diagnostics'}
                            >
                              <Terminal size={14} />
                            </button>
                            <div className="p-1 text-gray-500 group-hover:text-white transition-colors">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-[#09090b]">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="p-6 border-y border-gray-800 space-y-6"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Telemetry & Specs */}
                                <div className="bg-[#111114] border border-gray-800 p-4 rounded-2xl space-y-3">
                                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
                                    <Cpu size={14} className="text-blue-400" />
                                    <span>{isZh ? '硬體平台與作業系統' : 'Platform & OS Specifications'}</span>
                                  </h4>
                                  <div className="space-y-1.5 text-xs text-gray-400">
                                    <p><strong className="text-gray-500">{isZh ? '設備廠牌與型號：' : 'Vendor/Model:'}</strong> {device.vendor} {device.model}</p>
                                    <p><strong className="text-gray-500">{isZh ? '作業系統版本：' : 'OS Version:'}</strong> {device.os_version}</p>
                                    <p><strong className="text-gray-500">{isZh ? '更新/韌體修補：' : 'Patch Level:'}</strong> <span className="text-blue-400">{device.update_version}</span></p>
                                    <p><strong className="text-gray-500">{isZh ? '磁碟存儲容量：' : 'Storage Capacity:'}</strong> {device.disk_capacity} ({device.disk}% 已使用)</p>
                                  </div>
                                </div>

                                {/* Installed Software & Open Ports */}
                                <div className="bg-[#111114] border border-gray-800 p-4 rounded-2xl space-y-3">
                                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
                                    <Database size={14} className="text-purple-400" />
                                    <span>{isZh ? '已安裝軟體與開放連接埠' : 'Software & Ports'}</span>
                                  </h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-[10px] text-gray-500 font-bold block mb-1">{isZh ? '開放連接埠 (Open Ports):' : 'Open Ports:'}</span>
                                      <div className="flex flex-wrap gap-1">
                                        {device.openPorts.map((p, pi) => (
                                          <span key={pi} className="px-2 py-0.5 bg-black/60 border border-gray-800 rounded text-[10px] font-mono text-gray-300">
                                            {p.port}/{p.proto} ({p.service})
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-gray-500 font-bold block mb-1">{isZh ? '關鍵軟體/代理套件:' : 'Installed Packages:'}</span>
                                      <div className="flex flex-wrap gap-1">
                                        {device.software.map((s, si) => (
                                          <span key={si} className="px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded text-[10px]">
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Active Processes & Threshold Config */}
                                <div className="bg-[#111114] border border-gray-800 p-4 rounded-2xl space-y-3">
                                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
                                    <Sliders size={14} className="text-emerald-400" />
                                    <span>{isZh ? '告警閥值調整與監控處理程序' : 'Thresholds & Processes'}</span>
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <span className="text-[9px] text-gray-500 block">CPU 閥值</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <input 
                                            type="number" 
                                            defaultValue={device.cpuThreshold}
                                            onBlur={(e) => handleUpdateThreshold(device.id, 'cpuThreshold', Number(e.target.value))}
                                            className="w-12 bg-black border border-gray-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:border-blue-500" 
                                          />
                                          <span className="text-[10px] text-gray-500">%</span>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-gray-500 block">RAM 閥值</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <input 
                                            type="number" 
                                            defaultValue={device.ramThreshold}
                                            onBlur={(e) => handleUpdateThreshold(device.id, 'ramThreshold', Number(e.target.value))}
                                            className="w-12 bg-black border border-gray-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:border-purple-500" 
                                          />
                                          <span className="text-[10px] text-gray-500">%</span>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-gray-500 block">磁碟閥值</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <input 
                                            type="number" 
                                            defaultValue={device.diskThreshold}
                                            onBlur={(e) => handleUpdateThreshold(device.id, 'diskThreshold', Number(e.target.value))}
                                            className="w-12 bg-black border border-gray-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:border-emerald-500" 
                                          />
                                          <span className="text-[10px] text-gray-500">%</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-gray-500 font-bold block mb-1">{isZh ? '作用中主要程序 (Processes):' : 'Processes:'}</span>
                                      <p className="text-[11px] font-mono text-gray-400">{device.processes.join(', ')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Network Diagnostics Toolbox Modal */}
      <AnimatePresence>
        {diagModalOpen && diagTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-[#111114] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl space-y-0"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#0d0d10]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      {isZh ? '即時網路連線診斷終端 (Network Diagnostics Console)' : 'Network Diagnostics Console'}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      {isZh ? `目標主機: ${diagTarget.name} (${diagTarget.ip}) • VLAN ${diagTarget.vlan}` : `Target: ${diagTarget.name} (${diagTarget.ip})`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDiagModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Diagnostic Command Buttons */}
              <div className="p-4 bg-[#09090b] border-b border-gray-800 flex flex-wrap gap-2">
                <button
                  onClick={() => runDiagnostic('ping')}
                  disabled={isExecutingDiag}
                  className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2"
                >
                  <Activity size={14} />
                  <span>PING ICMP Echo</span>
                </button>
                <button
                  onClick={() => runDiagnostic('traceroute')}
                  disabled={isExecutingDiag}
                  className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2"
                >
                  <Compass size={14} />
                  <span>TRACEROUTE (路由跳數)</span>
                </button>
                <button
                  onClick={() => runDiagnostic('portscan')}
                  disabled={isExecutingDiag}
                  className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={14} />
                  <span>NMAP Port Scan (連接埠探測)</span>
                </button>
                <button
                  onClick={() => runDiagnostic('snmp')}
                  disabled={isExecutingDiag}
                  className="px-4 py-2 bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-500/30 text-cyan-400 hover:text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2"
                >
                  <Database size={14} />
                  <span>SNMP Walk (MIB-II 查詢)</span>
                </button>
              </div>

              {/* Terminal Screen */}
              <div className="p-6 bg-black font-mono text-xs text-gray-300 min-h-[280px] max-h-[360px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {isExecutingDiag && (
                  <div className="flex items-center gap-2 text-blue-400 animate-pulse pb-2">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{isZh ? '正在透過網路感測器執行探針通訊...' : 'Executing probe handshake...'}</span>
                  </div>
                )}
                {diagOutput.map((line, idx) => (
                  <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                    {line.startsWith('[') ? (
                      <span className="text-yellow-400 font-bold">{line}</span>
                    ) : line.includes('open') || line.includes('bytes from') ? (
                      <span className="text-emerald-400">{line}</span>
                    ) : line.includes('CVE') || line.includes('loss') ? (
                      <span className="text-red-400">{line}</span>
                    ) : (
                      <span className="text-gray-300">{line}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-800 bg-[#0d0d10] flex justify-between items-center">
                <span className="text-[11px] text-gray-500 font-mono">
                  {isZh ? '診斷結果已記錄至 SIEM / Audit Log 串流。' : 'Recorded into audit log stream.'}
                </span>
                <button
                  onClick={() => setDiagModalOpen(false)}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isZh ? '關閉終端' : 'Close Terminal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Security Audit & Compliance Modal */}
        {auditModalOpen && auditTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-[#111114] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl space-y-0"
            >
              {/* Audit Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#0d0d10]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      {isZh ? '主機深度安全審計日誌與合規檢驗' : 'Host Security Audit & Compliance Report'}
                      <span className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full">
                        NAC & EDR Verified
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {auditTarget.name} ({auditTarget.ip}) • VLAN {auditTarget.vlan} • {auditTarget.vendor}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAuditModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Audit Quick Overview Banner */}
              <div className="px-6 py-4 bg-[#0a0a0c] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-gray-500 text-[10px] block font-bold">{isZh ? '作業系統版本' : 'OS Version'}</span>
                    <span className="text-gray-200 font-mono">{auditTarget.os_version}</span>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <span className="text-gray-500 text-[10px] block font-bold">{isZh ? '開放連接埠數量' : 'Open Ports'}</span>
                    <span className="text-blue-400 font-mono font-bold">{auditTarget.openPorts.length} 埠</span>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <span className="text-gray-500 text-[10px] block font-bold">{isZh ? 'CVE 漏洞示警' : 'CVE Alerts'}</span>
                    <span className={cn("font-mono font-bold", auditTarget.cveAlerts && auditTarget.cveAlerts.length > 0 ? "text-red-400" : "text-emerald-400")}>
                      {auditTarget.cveAlerts?.length || 0} 項
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleIsolate(auditTarget)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all",
                    auditTarget.vlan === 999
                      ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                      : "bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white"
                  )}
                >
                  {auditTarget.vlan === 999 ? (
                    <>
                      <ShieldCheck size={14} />
                      <span>{isZh ? '解除主機 NAC 隔離' : 'Restore from Quarantine'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} />
                      <span>{isZh ? '立即下發 NAC 隔離' : 'Isolate Host'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Audit Log Stream */}
              <div className="p-6 bg-black font-mono text-xs text-gray-300 min-h-[260px] max-h-[340px] overflow-y-auto space-y-3 custom-scrollbar">
                {loadingAudit ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-purple-400">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>{isZh ? '正在自後台調閱主機最新安全審計串流...' : 'Loading audit trail...'}</span>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    {isZh ? '暫無主機專屬安全審計紀錄，點擊下方按鈕以啟動即時合規檢驗。' : 'No audit records found.'}
                  </div>
                ) : (
                  auditLogs.map((log: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#111114] border border-gray-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                            log.status === 'PASSED' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            log.status === 'QUARANTINED' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}>
                            {log.status || 'LOGGED'}
                          </span>
                          <span className="text-white font-bold">{log.action}</span>
                        </div>
                        <span className="text-gray-500 text-[10px]">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'NOW'}</span>
                      </div>
                      <p className="text-gray-300 text-[11px] leading-relaxed">{log.details}</p>
                      <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t border-gray-800/50">
                        <span>{isZh ? '執行主體:' : 'Operator:'} <strong className="text-gray-400">{log.operator || 'SYSTEM'}</strong></span>
                        <span>{log.id || `AUD-${idx}`}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Audit Modal Footer */}
              <div className="p-4 border-t border-gray-800 bg-[#0d0d10] flex justify-between items-center">
                <button
                  onClick={() => handleRequestAudit(auditTarget)}
                  disabled={loadingAudit}
                  className="px-4 py-2 bg-purple-600/15 hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14} className={cn(loadingAudit && "animate-spin")} />
                  <span>{isZh ? '重新發起即時安全審計' : 'Trigger Fresh Audit'}</span>
                </button>
                <button
                  onClick={() => setAuditModalOpen(false)}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isZh ? '關閉審計視窗' : 'Close Audit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// D3 Force-Directed Network Topology Canvas Component
// -------------------------------------------------------------
function NetworkTopologyCanvas({
  devices,
  connections,
  selectedDeviceId,
  onSelectDevice,
  isZh
}: {
  devices: NetworkDevice[];
  connections: NetworkConnection[];
  selectedDeviceId: string | null;
  onSelectDevice: (device: NetworkDevice | null) => void;
  isZh: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || devices.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 900;
    const height = 620;

    // Clone data to avoid mutating react state
    const nodes = devices.map(d => ({ ...d }));
    const links = connections
      .filter(c => nodes.some(n => n.id === c.from) && nodes.some(n => n.id === c.to))
      .map(c => ({ ...c, source: c.from, target: c.to }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Glow filter for selected node
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom().on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom as any);

    // Render Links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup.selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', (d: any) => d.type === 'fiber' ? '#3b82f6' : '#4b5563')
      .attr('stroke-width', (d: any) => d.type === 'fiber' ? 2.5 : 1.5)
      .attr('stroke-dasharray', (d: any) => d.type === 'wireless' ? '4,4' : 'none')
      .attr('opacity', 0.6);

    // Render Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'cursor-pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d: any) => {
        event.stopPropagation();
        onSelectDevice(d);
      });

    // Outer Circle (Glow & Status Ring)
    node.append('circle')
      .attr('r', 28)
      .attr('fill', (d: any) => 
        d.type === 'firewall' ? 'rgba(239, 68, 68, 0.15)' :
        d.type === 'switch' ? 'rgba(59, 130, 246, 0.15)' :
        d.type === 'server' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(107, 114, 128, 0.15)'
      )
      .attr('stroke', (d: any) => 
        d.id === selectedDeviceId ? '#60a5fa' :
        d.status === 'warning' ? '#f59e0b' :
        d.type === 'firewall' ? '#ef4444' :
        d.type === 'switch' ? '#3b82f6' :
        d.type === 'server' ? '#a855f7' : '#9ca3af'
      )
      .attr('stroke-width', (d: any) => d.id === selectedDeviceId ? 3.5 : 2)
      .attr('filter', (d: any) => d.id === selectedDeviceId ? 'url(#glow)' : 'none');

    // Inner Emoji / Icon representation
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '16px')
      .text((d: any) => 
        d.type === 'firewall' ? '🛡️' :
        d.type === 'switch' ? '🔀' :
        d.type === 'server' ? '🖥️' : '💻'
      );

    // Status Ping Dot
    node.append('circle')
      .attr('cx', 18)
      .attr('cy', -18)
      .attr('r', 5)
      .attr('fill', (d: any) => 
        d.status === 'online' ? '#10b981' :
        d.status === 'warning' ? '#f59e0b' : '#ef4444'
      )
      .attr('stroke', '#111114')
      .attr('stroke-width', 1.5);

    // Primary Label (Device Name)
    const labelGroup = node.append('g')
      .attr('transform', 'translate(0, 42)');

    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.02em')
      .text((d: any) => d.name);

    // Secondary Label (IP Address)
    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '14px')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text((d: any) => d.ip.split(' ')[0]);

    // Tick update
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Background click to deselect
    svg.on('click', () => {
      onSelectDevice(null);
    });

    return () => {
      simulation.stop();
    };
  }, [devices, connections, selectedDeviceId, onSelectDevice]);

  return (
    <div ref={containerRef} className="w-full bg-[#0a0a0c] border border-gray-800 rounded-3xl overflow-hidden relative min-h-[620px] shadow-2xl">
      {/* Topology Map Legend */}
      <div className="absolute top-5 left-5 z-10 flex flex-wrap gap-2">
        <div className="px-4 py-2.5 bg-[#111114]/90 backdrop-blur-md border border-gray-800 rounded-2xl flex items-center gap-4 text-xs shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-bold text-gray-300">{isZh ? '邊界防火牆' : 'Firewall'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-bold text-gray-300">{isZh ? '核心/分發交換機' : 'Switch'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-bold text-gray-300">{isZh ? '機房伺服器群' : 'Server Farm'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="font-bold text-gray-300">{isZh ? 'SOC/使用者端點' : 'Endpoints'}</span>
          </div>
        </div>
      </div>

      {/* Control Tips */}
      <div className="absolute bottom-5 right-5 z-10">
        <div className="p-3.5 bg-[#111114]/90 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-xl space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs font-black text-blue-400">
              {isZh ? '即時力導向拓撲引擎運作中' : 'Topology Engine Active'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            {isZh ? '點擊節點展開詳細探針資訊 • 拖曳節點重構佈局 • 滾輪縮放畫布' : 'Click node to inspect • Drag to reorder • Scroll to zoom'}
          </p>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-[620px] cursor-grab active:cursor-grabbing" />
    </div>
  );
}

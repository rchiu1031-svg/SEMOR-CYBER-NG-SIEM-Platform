export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  category: 'CORE' | 'NDR' | 'EDR' | 'AI' | 'SOAR' | 'INTEL' | 'DECEPTION' | 'INSIGHT' | 'AUTH' | 'ANALYSIS' | 'SIEM' | 'INDUSTRIAL';
  engines: string[];
  icon: string;
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    description: 'Event Explorer: Real-time log searching, filtering, and time-series analysis via VictoriaLogs.',
    category: 'SIEM',
    engines: ['VictoriaLogs', 'Lucene', 'Filebeat'],
    icon: 'Search'
  },
  {
    id: 'flow',
    name: 'SEMOR Flow (NDR)',
    description: 'Network Detection & Response: Full Packet Capture (FPC), High-speed Indexing, and PCAP Forensics (Arkime-style).',
    category: 'NDR',
    engines: ['Arkime', 'Suricata', 'Zeek', 'VictoriaLogs'],
    icon: 'Activity'
  },
  {
    id: 'endpoint',
    name: 'SEMOR Open XDR (EDR/XDR)',
    description: 'Unified Security: Stellar Cyber-style Open XDR with Interflow™, AI/ML detection, and integrated SOAR/UEBA.',
    category: 'EDR',
    engines: ['Interflow', 'Velociraptor', 'Wazuh', 'AI-ML', 'SOAR'],
    icon: 'ShieldCheck'
  },
  {
    id: 'intel',
    name: 'Intel (CTI)',
    description: 'Threat Intelligence Platform (TIP): STIX2-based structured intelligence, knowledge graphs, and automated IOC response.',
    category: 'INTEL',
    engines: ['OpenCTI', 'MISP', 'STIX2', 'Taxii'],
    icon: 'Globe'
  },
  {
    id: 'malware-analysis',
    name: 'Malware Analysis',
    description: 'Endpoint Security: Real-time monitoring via FIM, Rootkit detection, YARA scanning, and VirusTotal integration.',
    category: 'ANALYSIS',
    engines: ['Wazuh-Agent', 'YARA', 'VirusTotal', 'FIM', 'SCA'],
    icon: 'ShieldAlert'
  },
  {
    id: 'soar',
    name: 'SEMOR SOAR',
    description: 'Orchestration: n8n workflows for automated threat investigation (TheHive + Cortex).',
    category: 'SOAR',
    engines: ['n8n', 'TheHive', 'Cortex'],
    icon: 'Zap'
  },
  {
    id: 'case-management',
    name: 'Case Management',
    description: 'Incident Response: Security Incident Response Platform (SIRP) powered by TheHive.',
    category: 'SOAR',
    engines: ['TheHive'],
    icon: 'Layers'
  },
  {
    id: 'gateway',
    name: '平台效能監控 (Platform Performance Monitoring)',
    description: '平台效能監控：即時監控 Dashboard、Master 及各 Worker 節點之 CPU、記憶體、磁碟負載與網路流量拓撲。',
    category: 'CORE',
    engines: ['Prometheus', 'Node-Exporter', 'Traefik'],
    icon: 'Activity'
  },
  {
    id: 'vulnerability',
    name: '漏洞偵測 (Vulnerability Detection)',
    description: '漏洞管理：透過 OpenVAS 與 Wazuh-Agent 進行主動掃描與評估。',
    category: 'SIEM',
    engines: ['OpenVAS', 'Wazuh-Agent'],
    icon: 'Bug'
  },
  {
    id: 'fim',
    name: '檔案完整性監控 (FIM)',
    description: '檔案完整性監控 (FIM)：即時偵測檔案變更與雜湊校驗碼 (Wazuh 模式)。',
    category: 'SIEM',
    engines: ['Wazuh-FIM', 'Auditbeat'],
    icon: 'Box'
  },
  {
    id: 'industrial',
    name: 'SEMOR 工業控制安全 (OT/IoT)',
    description: 'OT/IoT 工業控制安全：工業通訊協定深度解析 (Modbus, S7) 與全封包側錄。',
    category: 'INDUSTRIAL',
    engines: ['Arkime', 'Zeek-OT', 'Suricata-ICS'],
    icon: 'Factory'
  },
  {
    id: 'apm',
    name: 'SEMOR APM',
    description: 'Full-stack Observability: Distributed Tracing, Topology Mapping, Multi-language Probes, and JVM/Service Mesh monitoring.',
    category: 'INSIGHT',
    engines: ['SkyWalking', 'Prometheus', 'Istio', 'OpenTelemetry'],
    icon: 'BarChart3'
  },
  {
    id: 'ai-analyst',
    name: 'AI Security Analyst',
    description: 'Local AI Analysis: On-premise Ollama (Llama-3) for automated log/traffic analysis and Attack Graph generation.',
    category: 'AI',
    engines: ['Ollama', 'Llama-3', 'LangChain'],
    icon: 'Bot'
  },
  {
    id: 'digital-forensics',
    name: 'Digital Forensics',
    description: 'Combining NetworkMiner\'s "Object Extraction" and Xplico\'s "Protocol Reconstruction" logic with SEMOR CYBER NG-SIEM\'s AI dynamic analysis can address the limitation of traditional SIEMs, which can only view "Logs" but not "Payload."',
    category: 'INTEL',
    engines: ['NetworkMiner', 'Xplico', 'Gemini-AI', 'Artifact-Extraction-Engine'],
    icon: 'SearchCode'
  },
  {
    id: 'honeypot-map',
    name: 'Honeypot & Attack Map',
    description: 'Active Deception: T-Pot (20+ honeypots) and real-time global attack visualization.',
    category: 'INTEL',
    engines: ['T-Pot', 'Cowrie', 'Dionaea', 'HoneyTrap'],
    icon: 'Map'
  },
  {
    id: 'wargaming',
    name: '軍方網絡兵棋推演 (Cyber Wargaming)',
    description: '軍方攻防對抗模擬與戰術決策驗證平台：紅軍戰術想定劇本、MITRE ATT&CK 攻擊路徑模擬、藍軍戰區態勢感知 (COP) 與 DEFCON 戰備交戰規則 (ROE)、導演部交戰裁決引擎 (Referee) 與時間軸戰後復盤 (AAR)。',
    category: 'DECEPTION',
    engines: ['CALDERA', 'AtomicRedTeam', 'MITRE-ATT&CK', 'Referee-Engine', 'AAR-Playback'],
    icon: 'Swords'
  },
  {
    id: 'traffic-control',
    name: '交通號誌控制 (Traffic Control)',
    description: '智慧城市交通號誌基礎設施：結合 SCADA/HMI 整合監控 CMS 資訊可變標誌看板、車道管制、速限標誌與 CCTV 交通攝影機。',
    category: 'INDUSTRIAL',
    engines: ['SCADA', 'HMI', 'Modbus', 'DNP3', 'SNMP'],
    icon: 'TrafficCone'
  },
  {
    id: 'monitor',
    name: 'Network Monitor',
    description: 'Internal Network Monitoring: Using flow collection and Nmap scanning to dynamically identify devices and generate topology maps.',
    category: 'NDR',
    engines: ['Nmap', 'Flow-Collector', 'SNMP', 'Topology-Generator'],
    icon: 'Monitor'
  }
];

export interface LicenseInfo {
  status: 'Active' | 'Expired' | 'Trial';
  type: 'Enterprise' | 'Professional' | 'Community';
  expiryDate: string;
  maxNodes: number;
  currentNodes: number;
}

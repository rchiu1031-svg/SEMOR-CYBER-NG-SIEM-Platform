export interface ModuleInfo {
  id: string;
  name: string;
  nameZh?: string;
  description: string;
  descriptionZh?: string;
  category: 'CORE' | 'NDR' | 'EDR' | 'AI' | 'SOAR' | 'INTEL' | 'DECEPTION' | 'INSIGHT' | 'AUTH' | 'ANALYSIS' | 'SIEM' | 'INDUSTRIAL';
  engines: string[];
  icon: string;
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    nameZh: '日誌搜尋 (Discovery)',
    description: 'Event Explorer: Real-time log searching, filtering, and time-series analysis via VictoriaLogs.',
    descriptionZh: '事件探勘器：透過 VictoriaLogs 進行即時日誌搜尋、過濾與時間序列分析。',
    category: 'SIEM',
    engines: ['VictoriaLogs', 'Lucene', 'Filebeat'],
    icon: 'Search'
  },
  {
    id: 'flow',
    name: 'SEMOR Flow (NDR)',
    nameZh: 'SEMOR 流量分析 (NDR)',
    description: 'Network Detection & Response: Full Packet Capture (FPC), High-speed Indexing, and PCAP Forensics (Arkime-style).',
    descriptionZh: '網路偵測與回應：全封包側錄 (FPC)、高速索引與 PCAP 鑑識 (Arkime 模式)。',
    category: 'NDR',
    engines: ['Arkime', 'Suricata', 'Zeek', 'VictoriaLogs'],
    icon: 'Activity'
  },
  {
    id: 'ndr-analytics',
    name: 'NDR Alert Analytics',
    nameZh: 'NDR 流量告警分析 (Alert Analytics)',
    description: 'Visualize network traffic alert distributions (severity, protocol, geo-origin) with deep-dive rule inspection and rapid response.',
    descriptionZh: '視覺化全網流量告警分佈（嚴重性、通訊協定、地理來源），支援深入下鑽違規規則細節與即時應急處置。',
    category: 'NDR',
    engines: ['Suricata', 'Zeek', 'Recharts', 'Interflow'],
    icon: 'BarChart2'
  },
  {
    id: 'endpoint',
    name: 'SEMOR Open XDR (EDR/XDR)',
    nameZh: 'SEMOR 開放式 XDR (EDR/XDR)',
    description: 'Unified Security: Stellar Cyber-style Open XDR with Interflow™, AI/ML detection, and integrated SOAR/UEBA.',
    descriptionZh: '統一安全防禦：融合 Interflow™、AI/ML 偵測與整合式 SOAR/UEBA 之開放式 XDR 平台。',
    category: 'EDR',
    engines: ['Interflow', 'Velociraptor', 'Wazuh', 'AI-ML', 'SOAR'],
    icon: 'ShieldCheck'
  },
  {
    id: 'intel',
    name: 'Intel (CTI)',
    nameZh: '威脅情資 (Intel CTI)',
    description: 'Threat Intelligence Platform (TIP): STIX2-based structured intelligence, knowledge graphs, and automated IOC response.',
    descriptionZh: '威脅情資平台 (TIP)：基於 STIX2 的結構化情報、知識圖譜與自動化 IOC 回應。',
    category: 'INTEL',
    engines: ['OpenCTI', 'MISP', 'STIX2', 'Taxii'],
    icon: 'Globe'
  },
  {
    id: 'malware-analysis',
    name: 'Malware Analysis',
    nameZh: '惡意程式分析',
    description: 'Endpoint Security: Real-time monitoring via FIM, Rootkit detection, YARA scanning, and VirusTotal integration.',
    descriptionZh: '端點安全：結合 FIM、Rootkit 偵測、YARA 掃描與 VirusTotal 整合之即時分析。',
    category: 'ANALYSIS',
    engines: ['Wazuh-Agent', 'YARA', 'VirusTotal', 'FIM', 'SCA'],
    icon: 'ShieldAlert'
  },
  {
    id: 'soar',
    name: 'SEMOR SOAR',
    nameZh: '自動化響應 (SOAR)',
    description: 'Orchestration: n8n workflows for automated threat investigation (TheHive + Cortex).',
    descriptionZh: '安全編排自動化：結合 n8n、TheHive 與 Cortex 執行自動化威脅調查與應變。',
    category: 'SOAR',
    engines: ['n8n', 'TheHive', 'Cortex'],
    icon: 'Zap'
  },
  {
    id: 'case-management',
    name: 'Case Management',
    nameZh: '案件管理',
    description: 'Incident Response: Security Incident Response Platform (SIRP) powered by TheHive.',
    descriptionZh: '事件應變管理：由 TheHive 驅動之資安事件應變與案件協作平台。',
    category: 'SOAR',
    engines: ['TheHive'],
    icon: 'Layers'
  },
  {
    id: 'gateway',
    name: 'Platform Performance Monitoring',
    nameZh: '平台效能監控 (Platform Performance Monitoring)',
    description: 'Platform Performance Monitoring: Real-time telemetry of Dashboard, Master, and Worker nodes (CPU, Memory, Disk, Network Topology, and Active Defense SOAR).',
    descriptionZh: '平台效能監控：即時監控 Dashboard、Master 及各 Worker 節點之 CPU、記憶體、磁碟負載、網路拓撲與主動聯防調度。',
    category: 'CORE',
    engines: ['Prometheus', 'Node-Exporter', 'Traefik'],
    icon: 'Activity'
  },
  {
    id: 'vulnerability',
    name: 'Vulnerability Detection',
    nameZh: '漏洞偵測 (Vulnerability Detection)',
    description: 'Vulnerability Management: Active scanning and risk assessment powered by OpenVAS and Wazuh-Agent.',
    descriptionZh: '漏洞管理：透過 OpenVAS 與 Wazuh-Agent 進行主動掃描與評估。',
    category: 'SIEM',
    engines: ['OpenVAS', 'Wazuh-Agent'],
    icon: 'Bug'
  },
  {
    id: 'fim',
    name: 'File Integrity Monitoring (FIM)',
    nameZh: '檔案完整性監控 (FIM)',
    description: 'File Integrity Monitoring (FIM): Real-time file change detection and cryptographic hash verification (Wazuh mode).',
    descriptionZh: '檔案完整性監控 (FIM)：即時偵測檔案變更與雜湊校驗碼 (Wazuh 模式)。',
    category: 'SIEM',
    engines: ['Wazuh-FIM', 'Auditbeat'],
    icon: 'Box'
  },
  {
    id: 'industrial',
    name: 'Industrial Control Security (OT/IoT)',
    nameZh: 'SEMOR 工業控制安全 (OT/IoT)',
    description: 'OT/IoT Industrial Security: Deep packet inspection for industrial protocols (Modbus, S7) and full packet capture.',
    descriptionZh: 'OT/IoT 工業控制安全：工業通訊協定深度解析 (Modbus, S7) 與全封包側錄。',
    category: 'INDUSTRIAL',
    engines: ['Arkime', 'Zeek-OT', 'Suricata-ICS'],
    icon: 'Factory'
  },
  {
    id: 'apm',
    name: 'SEMOR APM',
    nameZh: 'SEMOR 應用效能監控 (APM)',
    description: 'Full-stack Observability: Distributed Tracing, Topology Mapping, Multi-language Probes, and JVM/Service Mesh monitoring.',
    descriptionZh: '全棧可觀測性：分散式追蹤、拓撲映射、多語言探針與 JVM / Service Mesh 監控。',
    category: 'INSIGHT',
    engines: ['SkyWalking', 'Prometheus', 'Istio', 'OpenTelemetry'],
    icon: 'BarChart3'
  },
  {
    id: 'ai-analyst',
    name: 'AI Security Analyst',
    nameZh: 'AI 安全分析師',
    description: 'Local AI Analysis: On-premise Ollama (Llama-3) for automated log/traffic analysis and Attack Graph generation.',
    descriptionZh: '本地 AI 分析：透過地端部署 Ollama (Llama-3) 自動解析日誌與流量並生成攻擊圖譜。',
    category: 'AI',
    engines: ['Ollama', 'Llama-3', 'LangChain'],
    icon: 'Bot'
  },
  {
    id: 'ai-gateway',
    name: 'AI Gateway (AI Governance Gateway)',
    nameZh: 'AI Gateway (AI 治理安全網關)',
    description: 'Enterprise AI Gateway: Unified entry with SSO RBAC control, dynamic DLP sensitive data masking/blocking, standardized prompt workflows, and full audit governance.',
    descriptionZh: 'Enterprise AI Gateway: 統一入口與 SSO 身份控管、動態 DLP 機敏資料遮蔽/阻擋、標準化提示詞工作流與全量審計治理。',
    category: 'AI',
    engines: ['SSO-RBAC', 'DLP-Engine', 'Prompt-Auditor', 'Rate-Limiter', 'SOC-Connector'],
    icon: 'ShieldCheck'
  },
  {
    id: 'digital-forensics',
    name: 'Digital Forensics',
    nameZh: '數位鑑識 (Digital Forensics)',
    description: 'Combining NetworkMiner\'s "Object Extraction" and Xplico\'s "Protocol Reconstruction" logic with SEMOR CYBER NG-SIEM\'s AI dynamic analysis can address the limitation of traditional SIEMs, which can only view "Logs" but not "Payload."',
    descriptionZh: '結合 NetworkMiner 物件提取與 Xplico 協定重組邏輯並融合 AI 動態分析，突破傳統 SIEM 僅能檢視日誌而無法還原 Payload 的限制。',
    category: 'INTEL',
    engines: ['NetworkMiner', 'Xplico', 'Gemini-AI', 'Artifact-Extraction-Engine'],
    icon: 'SearchCode'
  },
  {
    id: 'honeypot-map',
    name: 'Honeypot & Attack Map',
    nameZh: '誘捕與攻擊地圖',
    description: 'Active Deception: T-Pot (20+ honeypots) and real-time global attack visualization.',
    descriptionZh: '主動誘捕防禦：整合 T-Pot (20+ 蜜罐引擎) 與即時全球攻擊視覺化地圖。',
    category: 'INTEL',
    engines: ['T-Pot', 'Cowrie', 'Dionaea', 'HoneyTrap'],
    icon: 'Map'
  },
  {
    id: 'wargaming',
    name: 'Cyber Wargaming',
    nameZh: '軍方網絡兵棋推演 (Cyber Wargaming)',
    description: 'Military Cyber Wargaming & Tactical Validation Platform: Red team scenarios, MITRE ATT&CK attack path simulation, Blue team Common Operational Picture (COP), DEFCON Rules of Engagement (ROE), Referee adjudication engine, and timeline After-Action Review (AAR).',
    descriptionZh: '軍方攻防對抗模擬與戰術決策驗證平台：紅軍戰術想定劇本、MITRE ATT&CK 攻擊路徑模擬、藍軍戰區態勢感知 (COP) 與 DEFCON 戰備交戰規則 (ROE)、導演部交戰裁決引擎 (Referee) 與時間軸戰後復盤 (AAR)。',
    category: 'DECEPTION',
    engines: ['CALDERA', 'AtomicRedTeam', 'MITRE-ATT&CK', 'Referee-Engine', 'AAR-Playback'],
    icon: 'Swords'
  },
  {
    id: 'monitor',
    name: 'Network Monitor',
    nameZh: '網路監控 (Network Monitor)',
    description: 'Internal Network Monitoring: Using flow collection and Nmap scanning to dynamically identify devices and generate topology maps.',
    descriptionZh: '內網監控：透過流量採集與全網探針掃描動態識別設備並生成即時拓樸圖。',
    category: 'NDR',
    engines: ['Nmap', 'Flow-Collector', 'SNMP', 'Topology-Generator'],
    icon: 'Monitor'
  }
];

export interface LicenseInfo {
  status: 'Active' | 'Expired' | 'Trial' | 'Warning' | 'GracePeriod' | 'OverQuota' | 'Invalid' | 'Tampered';
  type: 'Enterprise' | 'Professional' | 'Community' | 'Ultimate';
  expiryDate: string;
  maxNodes: number;
  currentNodes: number;
  licenseKey?: string;
  tierDisplayName?: string;
  hardwareFingerprint?: string;
  daysRemaining?: number;
  maxEps?: number;
  currentEps?: number;
  customer?: {
    organization: string;
    department: string;
    contactEmail: string;
    contractId: string;
    country: string;
  };
  entitledModules?: string[];
  addons?: {
    aiInferenceCore?: boolean;
    purdueOtdpi?: boolean;
    soarPlaybooksPro?: boolean;
    haClustering?: boolean;
    vansCompliance?: boolean;
    microsegmentation?: boolean;
  };
  issuer?: string;
  certificateSerial?: string;
  digitalSignature?: string;
  lastVerifiedAt?: string;
}

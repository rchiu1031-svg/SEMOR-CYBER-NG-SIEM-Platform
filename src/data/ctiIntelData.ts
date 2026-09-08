// Cyber Threat Intelligence (CTI / STIX 2.1 / TAXII 2.1) Data Models & Mock Datasets

export type StixEntityType = 
  | 'threat-actor' 
  | 'malware' 
  | 'infrastructure' 
  | 'attack-pattern' 
  | 'indicator' 
  | 'vulnerability' 
  | 'campaign' 
  | 'identity';

export type TlpLevel = 'TLP:CLEAR' | 'TLP:GREEN' | 'TLP:AMBER' | 'TLP:AMBER+STRICT' | 'TLP:RED';

export interface StixNode {
  id: string;
  name: string;
  type: StixEntityType;
  stixId: string;
  confidence: number;
  tlp: TlpLevel;
  x?: number;
  y?: number;
  details: {
    description: string;
    aliases?: string[];
    firstSeen?: string;
    lastSeen?: string;
    origin?: string;
    mitreTtp?: string;
    cvss?: number;
    value?: string;
    killChainPhase?: string;
    externalRefs?: { source: string; url: string }[];
  };
}

export interface StixRelationship {
  source: string;
  target: string;
  relationship_type: 'uses' | 'indicates' | 'targets' | 'communicates-with' | 'exploits' | 'attributed-to' | 'mitigates';
  confidence: number;
}

export interface GraphCampaign {
  id: string;
  name: string;
  actor: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium';
  nodes: StixNode[];
  links: StixRelationship[];
}

export interface CtiIndicator {
  id: string;
  stixId: string;
  type: 'IPv4-Addr' | 'IPv6-Addr' | 'Domain-Name' | 'URL' | 'File-SHA256' | 'File-MD5' | 'Windows-Registry' | 'Email-Addr';
  value: string;
  score: number;
  tlp: TlpLevel;
  actor: string;
  campaign: string;
  killChainPhase: 'Reconnaissance' | 'Weaponization' | 'Delivery' | 'Exploitation' | 'Installation' | 'C2' | 'Exfiltration';
  firstSeen: string;
  lastSeen: string;
  sightings: number;
  status: 'Active' | 'Under Investigation' | 'Revoked' | 'Whitelisted';
  vtDetectionRatio: string;
  asn?: string;
  geo?: string;
  tags: string[];
}

export interface CtiConnector {
  id: string;
  name: string;
  vendor: string;
  type: 'Ingestion' | 'Enforcement' | 'Bi-directional';
  protocol: 'TAXII 2.1' | 'MISP REST' | 'STIX 2.1 Bundle' | 'OpenCTI GraphQL' | 'Vendor API';
  status: 'Active' | 'Syncing' | 'Warning' | 'Error' | 'Paused' | 'Healthy' | 'Degraded';
  lastSync: string;
  count: string;
  pullInterval: string;
  tlpFloor: TlpLevel;
  tlsStatus: 'TLS 1.3 Verified' | 'mTLS Enforced';
  endpoint: string;
  ingestedCount?: number;
  errorRate?: string;
  pollInterval?: string;
}

export interface CtiReport {
  id: string;
  stixId: string;
  title: string;
  author: string;
  published: string;
  tlp: TlpLevel;
  confidence: number;
  targetSectors: string[];
  summary: string;
  adversaryProfile: string;
  technicalAnalysis: string;
  mitigations: string[];
  relatedIocs: string[];
  mitreTechniques: string[];
  rawStixJson: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  coverage: 'Covered' | 'Partial' | 'Gap';
  threatScore: number;
  description: string;
  actors: string[];
  sigmaRule: string;
  mitigation: string;
}

export interface MitreTacticGroup {
  id: string;
  name: string;
  techniques: MitreTechnique[];
}

export interface MitreTechniqueItem {
  id: string; // e.g. T1566.001
  name: string;
  tactic: string;
  tacticId: string;
  description: string;
  threatFrequency: 'High' | 'Medium' | 'Low';
  coverageStatus: 'Covered' | 'Partial' | 'Gap';
  actors: string[];
  detectionRules: string[];
}

export const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const THREAT_ACTOR_ORIGINS = [
  { name: "APT28 (Fancy Bear)", coordinates: [37.6173, 55.7558], color: "#ef4444", country: "Russia", origin: "Russia", focus: "Gov, Defense & NATO", threatLevel: "Critical", activeCampaigns: 4 },
  { name: "Lazarus Group", coordinates: [125.7625, 39.0392], color: "#ef4444", country: "North Korea", origin: "North Korea", focus: "Financial & Crypto", threatLevel: "Critical", activeCampaigns: 3 },
  { name: "Volt Typhoon", coordinates: [116.4074, 39.9042], color: "#f97316", country: "China", origin: "China", focus: "Critical Infrastructure / SCADA", threatLevel: "High", activeCampaigns: 5 },
  { name: "Mustang Panda", coordinates: [113.2644, 23.1291], color: "#f97316", country: "China", origin: "China", focus: "Diplomatic & APAC Region", threatLevel: "High", activeCampaigns: 2 },
  { name: "Sandworm", coordinates: [30.5234, 50.4501], color: "#ef4444", country: "Eastern Europe", origin: "Russia", focus: "Power Grid & Wipers", threatLevel: "Critical", activeCampaigns: 3 },
  { name: "Charming Kitten", coordinates: [51.3890, 35.6892], color: "#eab308", country: "Iran", origin: "Iran", focus: "Dissidents & Think Tanks", threatLevel: "High", activeCampaigns: 2 },
  { name: "LockBit Syndicate", coordinates: [27.5615, 53.9045], color: "#ec4899", country: "Transnational", origin: "Russia", focus: "Double-Extortion Ransomware", threatLevel: "Critical", activeCampaigns: 6 },
];

export const INDICATOR_DISTRIBUTION = [
  { name: "Exploit C2 Relay (US-East)", coordinates: [-74.006, 40.7128], count: 850, color: "#3b82f6", activeThreats: 142 },
  { name: "Fast-Flux DNS Hub (Tokyo)", coordinates: [139.6503, 35.6762], count: 1240, color: "#8b5cf6", activeThreats: 218 },
  { name: "Phishing Distribution (Frankfurt)", coordinates: [8.6821, 50.1109], count: 680, color: "#f59e0b", activeThreats: 89 },
  { name: "Compromised SOHO Botnet (Singapore)", coordinates: [103.8198, 1.3521], count: 910, color: "#10b981", activeThreats: 165 },
  { name: "Tor Ingress Exfiltration (Sao Paulo)", coordinates: [-46.6333, -23.5505], count: 340, color: "#06b6d4", activeThreats: 52 },
  { name: "Watering Hole Proxy (Dubai)", coordinates: [55.2708, 25.2048], count: 520, color: "#ef4444", activeThreats: 78 },
  { name: "Crypto Drainer Infra (London)", coordinates: [-0.1278, 51.5074], count: 1120, color: "#6366f1", activeThreats: 194 },
  { name: "Scada Infiltration Sensor (Taipei)", coordinates: [121.5654, 25.0330], count: 760, color: "#ec4899", activeThreats: 130 }
];

export const ATTACK_CORRIDORS = [
  { id: 'corr-1', name: 'Moscow -> Washington C2 Channel', from: [37.6173, 55.7558], to: [-74.006, 40.7128], actor: 'APT28', target: 'US Gov Defense', color: '#ef4444' },
  { id: 'corr-2', name: 'Pyongyang -> Tokyo Crypto Drain', from: [125.7625, 39.0392], to: [139.6503, 35.6762], actor: 'Lazarus', target: 'Crypto Exchange APAC', color: '#8b5cf6' },
  { id: 'corr-3', name: 'Beijing -> Taipei SCADA Pivot', from: [116.4074, 39.9042], to: [121.5654, 25.0330], actor: 'Volt Typhoon', target: 'Energy SCADA Nodes', color: '#f97316' },
  { id: 'corr-4', name: 'Tehran -> Frankfurt Diplomatic Phish', from: [51.3890, 35.6892], to: [8.6821, 50.1109], actor: 'Charming Kitten', target: 'EU Think Tanks', color: '#eab308' },
  { id: 'corr-5', name: 'Eastern Europe -> London Ransomware Extortion', from: [27.5615, 53.9045], to: [-0.1278, 51.5074], actor: 'LockBit 3.0', target: 'Healthcare Conglomerate', color: '#ec4899' },
];

export const INGESTION_TRENDS = {
  daily: [
    { time: '00:00', ingested: 3200, suppressed: 850, highConfidence: 1240 },
    { time: '04:00', ingested: 2800, suppressed: 720, highConfidence: 1100 },
    { time: '08:00', ingested: 5800, suppressed: 1600, highConfidence: 2450 },
    { time: '12:00', ingested: 7900, suppressed: 2300, highConfidence: 3410 },
    { time: '16:00', ingested: 6800, suppressed: 1950, highConfidence: 2980 },
    { time: '20:00', ingested: 4900, suppressed: 1350, highConfidence: 2100 },
    { time: '23:59', ingested: 3600, suppressed: 980, highConfidence: 1540 },
  ],
  weekly: [
    { time: 'Mon', ingested: 28400, suppressed: 8200, highConfidence: 14200 },
    { time: 'Tue', ingested: 34100, suppressed: 9600, highConfidence: 16800 },
    { time: 'Wed', ingested: 39500, suppressed: 11400, highConfidence: 19400 },
    { time: 'Thu', ingested: 42300, suppressed: 12800, highConfidence: 21500 },
    { time: 'Fri', ingested: 48900, suppressed: 14500, highConfidence: 24800 },
    { time: 'Sat', ingested: 22100, suppressed: 6400, highConfidence: 11200 },
    { time: 'Sun', ingested: 19800, suppressed: 5800, highConfidence: 9900 },
  ],
  monthly: [
    { time: 'Week 1', ingested: 145000, suppressed: 42000, highConfidence: 74000 },
    { time: 'Week 2', ingested: 182000, suppressed: 51000, highConfidence: 93000 },
    { time: 'Week 3', ingested: 210000, suppressed: 63000, highConfidence: 108000 },
    { time: 'Week 4', ingested: 195000, suppressed: 58000, highConfidence: 99500 },
  ]
};

export const INDUSTRY_SECTOR_DATA = [
  { name: 'Financial & Banking', value: 320, pct: 28, color: '#3b82f6' },
  { name: 'Critical Infrastructure & Energy', value: 245, pct: 22, color: '#f59e0b' },
  { name: 'Government & Defense', value: 210, pct: 19, color: '#ef4444' },
  { name: 'Healthcare & Pharma', value: 160, pct: 14, color: '#10b981' },
  { name: 'Semiconductor & Tech', value: 125, pct: 11, color: '#8b5cf6' },
  { name: 'Telecom & ISP', value: 68, pct: 6, color: '#06b6d4' },
];

export const MALWARE_CATEGORY_DATA = [
  { name: 'Ransomware & Cryptors', value: 42, color: '#ef4444' },
  { name: 'Stealers & Credential Harvesters', value: 24, color: '#f97316' },
  { name: 'Remote Access Trojans (RAT)', value: 16, color: '#3b82f6' },
  { name: 'Botnets & DDoS Droppers', value: 10, color: '#10b981' },
  { name: 'Destructive Wipers', value: 5, color: '#8b5cf6' },
  { name: 'Adware & Miners', value: 3, color: '#6b7280' },
];

export const APT_RADAR_DATA = [
  { name: 'APT28 (Fancy Bear)', threatScore: 92, activity: 88, weaponization: 95 },
  { name: 'Lazarus Group', threatScore: 96, activity: 94, weaponization: 90 },
  { name: 'Volt Typhoon', threatScore: 89, activity: 85, weaponization: 92 },
  { name: 'LockBit 3.0', threatScore: 94, activity: 98, weaponization: 86 },
  { name: 'Mustang Panda', threatScore: 82, activity: 79, weaponization: 84 },
  { name: 'Sandworm', threatScore: 91, activity: 80, weaponization: 94 },
];

export const VULNERABILITY_TREND_DATA = [
  { time: '01/26', Critical: 14, High: 32, Medium: 45, KEV: 8 },
  { time: '02/26', Critical: 18, High: 38, Medium: 52, KEV: 12 },
  { time: '03/26', Critical: 22, High: 45, Medium: 48, KEV: 15 },
  { time: '04/26', Critical: 29, High: 58, Medium: 60, KEV: 21 },
  { time: '05/26', Critical: 35, High: 64, Medium: 68, KEV: 26 },
  { time: '06/26', Critical: 28, High: 59, Medium: 62, KEV: 19 },
  { time: '07/26', Critical: 34, High: 71, Medium: 75, KEV: 24 },
];

export const LIVE_SIGHTING_STREAM = [
  { id: 'sig-1', time: '10s ago', feed: 'AlienVault OTX', type: 'IPv4-Addr', value: '185.220.101.5', actor: 'LockBit 3.0', confidence: 96, tlp: 'TLP:AMBER', event: 'Tor Exit Node brute force attempt on VPN' },
  { id: 'sig-2', time: '28s ago', feed: 'MISP Community', type: 'File-SHA256', value: '4a9b...7f2c', actor: 'Lazarus', confidence: 92, tlp: 'TLP:GREEN', event: 'Weaponized Word macro with AppleJeus payload' },
  { id: 'sig-3', time: '45s ago', feed: 'Google Mandiant', type: 'Domain-Name', value: 'login.corp-portal-sso.com', actor: 'APT28', confidence: 98, tlp: 'TLP:AMBER+STRICT', event: 'Credential harvesting phishing domain for Azure AD' },
  { id: 'sig-4', time: '1m ago', feed: 'Unit 42', type: 'IPv4-Addr', value: '91.240.118.172', actor: 'Volt Typhoon', confidence: 89, tlp: 'TLP:GREEN', event: 'SOHO Router KV-Botnet staging proxy' },
  { id: 'sig-5', time: '2m ago', feed: 'CISA KEV', type: 'Vulnerability', value: 'CVE-2024-3400', actor: 'UTA0218', confidence: 99, tlp: 'TLP:CLEAR', event: 'Active zero-day exploitation of GlobalProtect Gateway' },
  { id: 'sig-6', time: '3m ago', feed: 'Recorded Future', type: 'URL', value: 'https://cdn.secure-update-patch.net/dl', actor: 'FIN7', confidence: 88, tlp: 'TLP:AMBER', event: 'DarkGate loader distribution payload URI' },
];

export const STIX_CAMPAIGNS: GraphCampaign[] = [
  {
    id: 'camp-1',
    name: 'Operation GhostWriter (APT28)',
    actor: 'APT28 (Fancy Bear)',
    severity: 'Critical',
    description: 'Sustained cyber espionage campaign targeting European defense ministries and critical infrastructure via spear-phishing and WinRAR zero-day CVE-2023-38831.',
    nodes: [
      { id: 'n-actor-1', name: 'APT28 (STRONTIUM)', type: 'threat-actor', stixId: 'threat-actor--b245e3f1-0982-411a-bf41-6e9f50e68d04', confidence: 95, tlp: 'TLP:AMBER', details: { description: 'State-sponsored cyber espionage group attributed to Russian GRU 85th Main Special Service Center.', aliases: ['Fancy Bear', 'Pawn Storm', 'Sofacy', 'Sednit'], origin: 'Russian Federation', firstSeen: '2004-03-12' } },
      { id: 'n-campaign-1', name: 'Op GhostWriter 2026', type: 'campaign', stixId: 'campaign--89fa3211-5367-4a0b-819a-24128fef61e2', confidence: 92, tlp: 'TLP:AMBER', details: { description: 'Disinformation and espionage operation aimed at leaking fabricated NATO intelligence documents.', firstSeen: '2025-11-04' } },
      { id: 'n-malware-1', name: 'Zebrocy Go Loader', type: 'malware', stixId: 'malware--f3710892-96cb-41d8-8255-081923e10fa1', confidence: 94, tlp: 'TLP:GREEN', details: { description: 'Trojanized Go executable utilized as a first-stage downloader to profile victim machines.', killChainPhase: 'Execution', value: 'SHA256: 7d11f8e12470a9cb...d567' } },
      { id: 'n-vuln-1', name: 'CVE-2023-38831 (WinRAR RCE)', type: 'vulnerability', stixId: 'vulnerability--709121a9-34bc-4882-990a-112233445566', confidence: 99, tlp: 'TLP:CLEAR', details: { description: 'Arbitrary code execution vulnerability in RARLAB WinRAR before 6.23 triggered when processing file archives.', cvss: 8.8 } },
      { id: 'n-infra-1', name: 'C2 Node 185.234.219.12', type: 'infrastructure', stixId: 'infrastructure--4891b2c4-7819-4cb5-8291-a1b2c3d4e5f6', confidence: 90, tlp: 'TLP:AMBER', details: { description: 'Bulletproof VPS hosted in AS44477, serving as dynamic HTTPS command-and-control handler.', value: '185.234.219.12:8443' } },
      { id: 'n-ioc-1', name: 'update.microsoft-security.com', type: 'indicator', stixId: 'indicator--12837192-3482-41a9-b384-908123741829', confidence: 96, tlp: 'TLP:AMBER', details: { description: 'Typosquatting domain masquerading as official Windows Defender telemetry update channel.', value: 'update.microsoft-security.com' } },
      { id: 'n-ttp-1', name: 'T1566.001 Spearphishing Attachment', type: 'attack-pattern', stixId: 'attack-pattern--24719283-9182-4ba1-8273-019283746152', confidence: 98, tlp: 'TLP:CLEAR', details: { description: 'Adversaries send spearphishing emails with malicious zip attachments targeting military attachés.', mitreTtp: 'T1566.001' } },
      { id: 'n-target-1', name: 'Gov & Defense Ministries', type: 'identity', stixId: 'identity--38192837-9182-4ca1-8172-381928471920', confidence: 92, tlp: 'TLP:AMBER', details: { description: 'Target sector: NATO affiliated ministries of defense, diplomatic missions, and military procurement contractors.' } },
    ],
    links: [
      { source: 'n-actor-1', target: 'n-campaign-1', relationship_type: 'attributed-to', confidence: 95 },
      { source: 'n-campaign-1', target: 'n-malware-1', relationship_type: 'uses', confidence: 94 },
      { source: 'n-campaign-1', target: 'n-target-1', relationship_type: 'targets', confidence: 92 },
      { source: 'n-malware-1', target: 'n-vuln-1', relationship_type: 'exploits', confidence: 98 },
      { source: 'n-malware-1', target: 'n-infra-1', relationship_type: 'communicates-with', confidence: 90 },
      { source: 'n-ioc-1', target: 'n-infra-1', relationship_type: 'indicates', confidence: 96 },
      { source: 'n-actor-1', target: 'n-ttp-1', relationship_type: 'uses', confidence: 98 },
    ]
  },
  {
    id: 'camp-2',
    name: 'Operation DreamJob (Lazarus Group)',
    actor: 'Lazarus (HIDDEN COBRA)',
    severity: 'Critical',
    description: 'Social engineering and crypto-theft operation targeting blockchain developers and decentralized finance organizations through deceptive employment offers.',
    nodes: [
      { id: 'n2-actor', name: 'Lazarus Group (HIDDEN COBRA)', type: 'threat-actor', stixId: 'threat-actor--e3891726-9182-4ba2-8172-918237461529', confidence: 98, tlp: 'TLP:AMBER', details: { description: 'North Korean state-sponsored threat group responsible for high-profile financial cyber heists.', aliases: ['APT38', 'BlueNoroff', 'Stardust Chollima'] } },
      { id: 'n2-malware', name: 'AppleJeus macOS Stealer', type: 'malware', stixId: 'malware--91827364-1829-4ba1-8273-918273645123', confidence: 95, tlp: 'TLP:GREEN', details: { description: 'Multi-stage cross-platform stealer bundled with trojanized cryptocurrency trading software.', killChainPhase: 'Exfiltration' } },
      { id: 'n2-ttp', name: 'T1204.002 User Execution Malicious File', type: 'attack-pattern', stixId: 'attack-pattern--18293746-9182-4ba1-8273-918273645120', confidence: 96, tlp: 'TLP:CLEAR', details: { description: 'Recruiter PDFs delivering obfuscated Mach-O payload upon job applicant click.', mitreTtp: 'T1204.002' } },
      { id: 'n2-infra', name: 'Fast-Flux Pool 104.244.78.11', type: 'infrastructure', stixId: 'infrastructure--81927364-9182-4ca1-8273-918273645199', confidence: 89, tlp: 'TLP:AMBER', details: { description: 'Rapidly shifting DNS records masquerading behind legitimate Cloudflare and Tor proxies.' } },
      { id: 'n2-ioc', name: 'blockchain-careers-web3.io', type: 'indicator', stixId: 'indicator--91827364-9182-4ba1-8273-918273645188', confidence: 97, tlp: 'TLP:AMBER', details: { description: 'Fake recruitment landing portal delivering backdoor DMG installers.' } },
      { id: 'n2-target', name: 'Web3 & Crypto Exchanges', type: 'identity', stixId: 'identity--91827364-9182-4ca1-8273-918273645177', confidence: 94, tlp: 'TLP:GREEN', details: { description: 'DeFi protocols, decentralized cross-chain bridges, and institutional crypto custody providers.' } },
    ],
    links: [
      { source: 'n2-actor', target: 'n2-malware', relationship_type: 'uses', confidence: 95 },
      { source: 'n2-actor', target: 'n2-ttp', relationship_type: 'uses', confidence: 96 },
      { source: 'n2-malware', target: 'n2-infra', relationship_type: 'communicates-with', confidence: 89 },
      { source: 'n2-ioc', target: 'n2-infra', relationship_type: 'indicates', confidence: 97 },
      { source: 'n2-actor', target: 'n2-target', relationship_type: 'targets', confidence: 94 },
    ]
  },
  {
    id: 'camp-3',
    name: 'Citrix Bleed Ransomware Surge (LockBit 3.0)',
    actor: 'LockBit Syndicate',
    severity: 'Critical',
    description: 'Mass automated exploitation of Citrix ADC NetScaler appliances (CVE-2023-4966) to hijack corporate sessions and deploy LockBit 3.0 double-extortion ransomware.',
    nodes: [
      { id: 'n3-actor', name: 'LockBit 3.0 (LockBit Black)', type: 'threat-actor', stixId: 'threat-actor--11223344-5566-7788-99aa-bbccddeeff00', confidence: 96, tlp: 'TLP:RED', details: { description: 'Prolific Ransomware-as-a-Service (RaaS) syndicate operating automated leak portals and bug bounties.' } },
      { id: 'n3-vuln', name: 'CVE-2023-4966 (Citrix Bleed)', type: 'vulnerability', stixId: 'vulnerability--22334455-6677-8899-aabb-ccddeeff0011', confidence: 99, tlp: 'TLP:CLEAR', details: { description: 'Sensitive information disclosure vulnerability allowing unauthenticated session token hijacking on Citrix NetScaler.', cvss: 9.4 } },
      { id: 'n3-malware', name: 'StealBit Exfiltration Tool', type: 'malware', stixId: 'malware--33445566-7788-99aa-bbcc-ddeeff001122', confidence: 94, tlp: 'TLP:AMBER', details: { description: 'High-speed multithreaded data exfiltration binary custom-tailored for LockBit affiliates.' } },
      { id: 'n3-infra', name: 'Tor Extortion Portal v3', type: 'infrastructure', stixId: 'infrastructure--44556677-8899-aabb-ccdd-eeff00112233', confidence: 92, tlp: 'TLP:CLEAR', details: { description: 'Onion mirror cluster hosting countdown timers and stolen corporate documents.' } },
      { id: 'n3-ioc', name: '194.26.29.112 (Scout Scanner)', type: 'indicator', stixId: 'indicator--55667788-99aa-bbcc-ddee-ff0011223344', confidence: 98, tlp: 'TLP:AMBER', details: { description: 'Automated mass-scanner probing /oauth/idp/.well-known/openid-configuration endpoints.' } },
    ],
    links: [
      { source: 'n3-actor', target: 'n3-vuln', relationship_type: 'exploits', confidence: 99 },
      { source: 'n3-actor', target: 'n3-malware', relationship_type: 'uses', confidence: 94 },
      { source: 'n3-malware', target: 'n3-infra', relationship_type: 'communicates-with', confidence: 92 },
      { source: 'n3-ioc', target: 'n3-vuln', relationship_type: 'indicates', confidence: 98 },
    ]
  },
  {
    id: 'camp-4',
    name: 'Volt Typhoon Critical Infrastructure Pre-positioning',
    actor: 'Volt Typhoon (Vanguard Panda)',
    severity: 'High',
    description: 'Stealthy living-off-the-land (LotL) campaign pre-positioning access into US & APAC water, energy, and transportation SCADA control systems.',
    nodes: [
      { id: 'n4-actor', name: 'Volt Typhoon (Bronze Silhouette)', type: 'threat-actor', stixId: 'threat-actor--66778899-aabb-ccdd-eeff-001122334455', confidence: 93, tlp: 'TLP:AMBER+STRICT', details: { description: 'Adversary sponsored by the PRC focusing on cyber espionage and disruptive sabotage capabilities.' } },
      { id: 'n4-infra', name: 'KV-Botnet (SOHO Routers)', type: 'infrastructure', stixId: 'infrastructure--778899aa-bbcc-ddee-ff00-112233445566', confidence: 91, tlp: 'TLP:AMBER', details: { description: 'EoL Cisco, Netgear, and DrayTek routers compromised to act as an anonymized operational relay box.' } },
      { id: 'n4-ttp', name: 'T1078 Valid Accounts (LotL)', type: 'attack-pattern', stixId: 'attack-pattern--8899aabb-ccdd-eeff-0011-223344556677', confidence: 97, tlp: 'TLP:CLEAR', details: { description: 'Exclusively uses native administrator tools (wmic, netsh, vssadmin) with legitimate stolen admin credentials.' } },
      { id: 'n4-target', name: 'Water & Power SCADA Grids', type: 'identity', stixId: 'identity--99aabbcc-ddee-ff00-1122-334455667788', confidence: 95, tlp: 'TLP:AMBER', details: { description: 'Industrial automation facilities, OT telemetry PLCs, and port logistics management systems.' } },
    ],
    links: [
      { source: 'n4-actor', target: 'n4-infra', relationship_type: 'uses', confidence: 91 },
      { source: 'n4-actor', target: 'n4-ttp', relationship_type: 'uses', confidence: 97 },
      { source: 'n4-actor', target: 'n4-target', relationship_type: 'targets', confidence: 95 },
    ]
  }
];

export const MOCK_INDICATORS: CtiIndicator[] = [
  {
    id: 'IOC-001',
    stixId: 'indicator--a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    type: 'IPv4-Addr',
    value: '185.234.219.12',
    score: 96,
    tlp: 'TLP:AMBER',
    actor: 'APT28 (Fancy Bear)',
    campaign: 'Operation GhostWriter',
    killChainPhase: 'C2',
    firstSeen: '2026-03-28',
    lastSeen: '2026-04-06 14:22',
    sightings: 1420,
    status: 'Active',
    vtDetectionRatio: '68/72',
    asn: 'AS44477 (Bulletproof Network Services)',
    geo: 'Seychelles / RU Relays',
    tags: ['C2-Server', 'Zebrocy', 'Proxy']
  },
  {
    id: 'IOC-002',
    stixId: 'indicator--b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    type: 'Domain-Name',
    value: 'update.microsoft-security.com',
    score: 94,
    tlp: 'TLP:AMBER+STRICT',
    actor: 'APT28',
    campaign: 'Operation GhostWriter',
    killChainPhase: 'Delivery',
    firstSeen: '2026-04-01',
    lastSeen: '2026-04-07 09:15',
    sightings: 320,
    status: 'Active',
    vtDetectionRatio: '64/71',
    asn: 'AS200052 (Fastly Edge CDN)',
    geo: 'Frankfurt, Germany',
    tags: ['Typosquatting', 'Phishing', 'Azure-Impersonation']
  },
  {
    id: 'IOC-003',
    stixId: 'indicator--c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    type: 'File-SHA256',
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    score: 88,
    tlp: 'TLP:GREEN',
    actor: 'LockBit 3.0',
    campaign: 'Citrix Bleed Surge',
    killChainPhase: 'Weaponization',
    firstSeen: '2026-03-15',
    lastSeen: '2026-04-05 18:30',
    sightings: 589,
    status: 'Active',
    vtDetectionRatio: '69/73',
    geo: 'Global Distribution',
    tags: ['Ransomware', 'StealBit', 'Crypter']
  },
  {
    id: 'IOC-004',
    stixId: 'indicator--d4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a',
    type: 'URL',
    value: 'https://cdn.secure-cloud-portal.net/auth/v2/session.php?id=99281',
    score: 91,
    tlp: 'TLP:AMBER',
    actor: 'Lazarus Group',
    campaign: 'Operation DreamJob',
    killChainPhase: 'Delivery',
    firstSeen: '2026-04-02',
    lastSeen: '2026-04-07 11:04',
    sightings: 84,
    status: 'Active',
    vtDetectionRatio: '58/69',
    asn: 'AS13335 (Cloudflare Inc.)',
    geo: 'Tokyo, Japan',
    tags: ['Credential-Harvester', 'DreamJob', 'Web3-Target']
  },
  {
    id: 'IOC-005',
    stixId: 'indicator--e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
    type: 'IPv4-Addr',
    value: '91.240.118.172',
    score: 85,
    tlp: 'TLP:CLEAR',
    actor: 'Volt Typhoon',
    campaign: 'Critical Infra LotL',
    killChainPhase: 'C2',
    firstSeen: '2026-03-10',
    lastSeen: '2026-04-06 22:50',
    sightings: 2400,
    status: 'Active',
    vtDetectionRatio: '45/70',
    asn: 'AS57523 (EoL SOHO Draytek Relay)',
    geo: 'Singapore / APAC',
    tags: ['KV-Botnet', 'Router-Compromise', 'SCADA-Prober']
  },
  {
    id: 'IOC-006',
    stixId: 'indicator--f6a7b89c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
    type: 'Windows-Registry',
    value: 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\DisableRealtimeMonitoring = 1',
    score: 99,
    tlp: 'TLP:CLEAR',
    actor: 'LockBit 3.0 / Scattered Spider',
    campaign: 'Defense Evasion Subversion',
    killChainPhase: 'Installation',
    firstSeen: '2026-01-12',
    lastSeen: '2026-04-07 08:00',
    sightings: 8900,
    status: 'Active',
    vtDetectionRatio: 'Behavioral Signature',
    geo: 'Endpoint Behavioral',
    tags: ['T1562.001', 'Defense-Evasion', 'EDR-Tamper']
  },
  {
    id: 'IOC-007',
    stixId: 'indicator--0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
    type: 'Email-Addr',
    value: 'recruiting-talent@web3-innovations-hr.com',
    score: 89,
    tlp: 'TLP:GREEN',
    actor: 'Lazarus Group',
    campaign: 'Operation DreamJob',
    killChainPhase: 'Reconnaissance',
    firstSeen: '2026-03-20',
    lastSeen: '2026-04-04 16:40',
    sightings: 190,
    status: 'Active',
    vtDetectionRatio: '42/68',
    geo: 'ProtonMail / Custom Relay',
    tags: ['Spearphishing', 'HR-Lure', 'LinkedIn-Attack']
  },
  {
    id: 'IOC-008',
    stixId: 'indicator--1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e',
    type: 'File-MD5',
    value: '8743b52063cd84097a65d1633f5c74f5',
    score: 74,
    tlp: 'TLP:CLEAR',
    actor: 'Unknown Affiliate',
    campaign: 'Generic Commodity Infostealer',
    killChainPhase: 'Weaponization',
    firstSeen: '2026-02-18',
    lastSeen: '2026-03-29 10:12',
    sightings: 430,
    status: 'Revoked',
    vtDetectionRatio: '52/70',
    geo: 'Redline Stealer Stager',
    tags: ['Redline', 'Infostealer', 'Credential-Dump']
  }
];

export const MOCK_CONNECTORS: CtiConnector[] = [
  {
    id: 'conn-1',
    name: 'AlienVault OTX TAXII 2.1 Feed',
    vendor: 'AT&T Cybersecurity',
    type: 'Ingestion',
    protocol: 'TAXII 2.1',
    status: 'Active',
    lastSync: '1 min ago',
    count: '64,120 Pulled',
    pullInterval: 'Every 5 mins',
    tlpFloor: 'TLP:GREEN',
    tlsStatus: 'TLS 1.3 Verified',
    endpoint: 'https://otx.alienvault.com/taxii/v2.1/collections'
  },
  {
    id: 'conn-2',
    name: 'MISP Community Global Pulse',
    vendor: 'MISP Project',
    type: 'Bi-directional',
    protocol: 'MISP REST',
    status: 'Active',
    lastSync: '3 mins ago',
    count: '28,950 Ingested / 450 Pushed',
    pullInterval: 'Every 15 mins',
    tlpFloor: 'TLP:AMBER',
    tlsStatus: 'mTLS Enforced',
    endpoint: 'https://misp.cyber.org/events/restSearch'
  },
  {
    id: 'conn-3',
    name: 'Google Cloud Mandiant Threat Intelligence',
    vendor: 'Google Mandiant',
    type: 'Ingestion',
    protocol: 'STIX 2.1 Bundle',
    status: 'Active',
    lastSync: '6 mins ago',
    count: '112,400 Curated',
    pullInterval: 'Every 10 mins',
    tlpFloor: 'TLP:AMBER+STRICT',
    tlsStatus: 'TLS 1.3 Verified',
    endpoint: 'https://api.intelligence.mandiant.com/v4/feeds'
  },
  {
    id: 'conn-4',
    name: 'Palo Alto Unit 42 & Cortex XSOAR',
    vendor: 'Palo Alto Networks',
    type: 'Bi-directional',
    protocol: 'Vendor API',
    status: 'Active',
    lastSync: '2 mins ago',
    count: '8,410 Enforced Blocklist',
    pullInterval: 'Instant Webhook',
    tlpFloor: 'TLP:AMBER',
    tlsStatus: 'TLS 1.3 Verified',
    endpoint: 'https://api.paloaltonetworks.com/v2/threats'
  },
  {
    id: 'conn-5',
    name: 'CrowdStrike Falcon Intelligence X',
    vendor: 'CrowdStrike',
    type: 'Ingestion',
    protocol: 'STIX 2.1 Bundle',
    status: 'Active',
    lastSync: '8 mins ago',
    count: '43,200 IOCs & Actors',
    pullInterval: 'Every 15 mins',
    tlpFloor: 'TLP:AMBER',
    tlsStatus: 'TLS 1.3 Verified',
    endpoint: 'https://api.crowdstrike.com/intel/combined/indicators/v1'
  },
  {
    id: 'conn-6',
    name: 'CISA KEV Catalog (Known Exploited Vulns)',
    vendor: 'CISA (US Homeland Security)',
    type: 'Ingestion',
    protocol: 'STIX 2.1 Bundle',
    status: 'Active',
    lastSync: '12 mins ago',
    count: '1,289 CVEs Active',
    pullInterval: 'Every 1 hour',
    tlpFloor: 'TLP:CLEAR',
    tlsStatus: 'TLS 1.3 Verified',
    endpoint: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
  },
  {
    id: 'conn-7',
    name: 'Recorded Future Dark Web & Threat Graph',
    vendor: 'Recorded Future',
    type: 'Ingestion',
    protocol: 'Vendor API',
    status: 'Warning',
    lastSync: '45 mins ago (Rate Limit Throttled)',
    count: '18,600 Breaches & Leaks',
    pullInterval: 'Every 30 mins',
    tlpFloor: 'TLP:RED',
    tlsStatus: 'TLS 1.3 Verified',
    endpoint: 'https://api.recordedfuture.com/gw/rest/v2'
  },
  {
    id: 'conn-8',
    name: 'FortiGuard Labs Threat Stream',
    vendor: 'Fortinet',
    type: 'Enforcement',
    protocol: 'Vendor API',
    status: 'Active',
    lastSync: '4 mins ago',
    count: '5,920 Edge Rules Pushed',
    pullInterval: 'Every 5 mins',
    tlpFloor: 'TLP:GREEN',
    tlsStatus: 'TLS 1.3 Verified',
    endpoint: 'https://api.fortiguard.com/threat-feed/v1'
  }
];

export const MITRE_ATTACK_TACTICS: { tactic: string; tacticId: string; techniques: MitreTechniqueItem[] }[] = [
  {
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    techniques: [
      { id: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', tacticId: 'TA0001', description: 'Malicious file attachments weaponized with exploits or scripts.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['APT28', 'Lazarus'], detectionRules: ['Sigma: WinRAR Exploit Lure', 'Suricata: Zip Attachment with CVE-2023-38831'] },
      { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', tacticId: 'TA0001', description: 'Exploiting internet-facing perimeter devices like VPN gateways.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['Volt Typhoon', 'LockBit 3.0'], detectionRules: ['WAF: Citrix Bleed CVE-2023-4966 Signature', 'Snort: Ivanti Connect Secure Auth Bypass'] },
      { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', tacticId: 'TA0001', description: 'Obtaining and abusing credentials of existing accounts.', threatFrequency: 'High', coverageStatus: 'Partial', actors: ['Volt Typhoon', 'Scattered Spider'], detectionRules: ['UEBA: Impossible Travel', 'AD: Abnormal Admin Login Time'] }
    ]
  },
  {
    tactic: 'Execution',
    tacticId: 'TA0002',
    techniques: [
      { id: 'T1059.001', name: 'PowerShell Execution', tactic: 'Execution', tacticId: 'TA0002', description: 'Executing malicious encoded scripts through Windows PowerShell.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['APT28', 'FIN7'], detectionRules: ['Sysmon EID 1: Encoded PowerShell args', 'EDR: Script Block Logging Alert'] },
      { id: 'T1059.003', name: 'Windows Command Shell', tactic: 'Execution', tacticId: 'TA0002', description: 'Executing cmd.exe for discovery and lateral movement.', threatFrequency: 'Medium', coverageStatus: 'Covered', actors: ['Volt Typhoon'], detectionRules: ['EDR: cmd.exe spawned by IIS Worker Process'] },
      { id: 'T1204.002', name: 'User Execution: Malicious File', tactic: 'Execution', tacticId: 'TA0002', description: 'Relying on victim clicking disguised executables or shortcuts.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['Lazarus'], detectionRules: ['Mail Gateway Sandbox: Suspicious LNK in ISO'] }
    ]
  },
  {
    tactic: 'Persistence',
    tacticId: 'TA0003',
    techniques: [
      { id: 'T1053.005', name: 'Scheduled Task', tactic: 'Persistence', tacticId: 'TA0003', description: 'Creating automated jobs via schtasks.exe to survive reboot.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['APT28', 'Sandworm'], detectionRules: ['Sysmon EID 106: New Scheduled Task in suspicious path'] },
      { id: 'T1547.001', name: 'Registry Run Keys / Startup Folder', tactic: 'Persistence', tacticId: 'TA0003', description: 'Modifying Run / RunOnce registry keys.', threatFrequency: 'Medium', coverageStatus: 'Covered', actors: ['LockBit 3.0'], detectionRules: ['Sysmon EID 13: Registry Value set under HKLM CurrentVersion Run'] }
    ]
  },
  {
    tactic: 'Privilege Escalation',
    tacticId: 'TA0004',
    techniques: [
      { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', tacticId: 'TA0004', description: 'Leveraging kernel or service exploits to gain SYSTEM rights.', threatFrequency: 'High', coverageStatus: 'Partial', actors: ['Volt Typhoon', 'Lazarus'], detectionRules: ['EDR: Token Impersonation (SeDebugPrivilege)'] },
      { id: 'T1548.002', name: 'Bypass User Account Control (UAC)', tactic: 'Privilege Escalation', tacticId: 'TA0004', description: 'Elevating process privileges without user elevation prompts.', threatFrequency: 'Medium', coverageStatus: 'Covered', actors: ['FIN7'], detectionRules: ['Sysmon EID 1: Fodhelper / Eventvwr registry hijacking'] }
    ]
  },
  {
    tactic: 'Defense Evasion',
    tacticId: 'TA0005',
    techniques: [
      { id: 'T1562.001', name: 'Disable or Modify Tools', tactic: 'Defense Evasion', tacticId: 'TA0005', description: 'Tampering with antivirus, EDR agents, or Windows Event Logs.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['LockBit 3.0', 'Sandworm'], detectionRules: ['SentinelOne Tamper Detection', 'Windows Event Log: Service stopped (WinDefend)'] },
      { id: 'T1027', name: 'Obfuscated / Encrypted Files or Info', tactic: 'Defense Evasion', tacticId: 'TA0005', description: 'Hiding code via packing, XOR encryption, or steganography.', threatFrequency: 'High', coverageStatus: 'Partial', actors: ['APT28', 'Lazarus'], detectionRules: ['YARA: High Entropy PE Sections', 'Sandbox: Memory Unpacking Detection'] },
      { id: 'T1036', name: 'Masquerading', tactic: 'Defense Evasion', tacticId: 'TA0005', description: 'Renaming malicious files to svchost.exe or system binary names.', threatFrequency: 'Medium', coverageStatus: 'Covered', actors: ['Volt Typhoon'], detectionRules: ['Sigma: svchost.exe executing outside of System32'] }
    ]
  },
  {
    tactic: 'Credential Access',
    tacticId: 'TA0006',
    techniques: [
      { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory', tactic: 'Credential Access', tacticId: 'TA0006', description: 'Extracting plaintext passwords or NTLM hashes from LSASS process.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['APT28', 'LockBit 3.0'], detectionRules: ['Sysmon EID 10: ProcessAccess target lsass.exe with 0x1FFFFF', 'Mimikatz command line signature'] },
      { id: 'T1110', name: 'Brute Force / Password Spraying', tactic: 'Credential Access', tacticId: 'TA0006', description: 'Spraying single password across thousands of enterprise AD accounts.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['Volt Typhoon', 'APT28'], detectionRules: ['SIEM Rule: 4625 Login failures > 20 within 5 minutes across distinct users'] }
    ]
  },
  {
    tactic: 'Command and Control',
    tacticId: 'TA0011',
    techniques: [
      { id: 'T1071.001', name: 'Web Protocols (HTTP/S C2)', tactic: 'Command and Control', tacticId: 'TA0011', description: 'Communicating using legitimate HTTP/HTTPS with custom beacons.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['APT28', 'Lazarus'], detectionRules: ['NDR: Periodic beaconing jitter analysis', 'Suricata: Cobalt Strike malleable C2 profile'] },
      { id: 'T1573.002', name: 'Asymmetric Cryptography (TLS C2)', tactic: 'Command and Control', tacticId: 'TA0011', description: 'Encrypting C2 channels with custom self-signed SSL/TLS certificates.', threatFrequency: 'High', coverageStatus: 'Partial', actors: ['Lazarus'], detectionRules: ['JA3 / JA4 Fingerprint Match against known C2 SSL certificates'] },
      { id: 'T1090.003', name: 'Multi-hop Proxy (Fast-Flux / Tor)', tactic: 'Command and Control', tacticId: 'TA0011', description: 'Routing C2 through layers of compromised SOHO routers or Tor.', threatFrequency: 'High', coverageStatus: 'Gap', actors: ['Volt Typhoon', 'LockBit 3.0'], detectionRules: ['Threat Intel: Ingress from active KV-Botnet node list'] }
    ]
  },
  {
    tactic: 'Exfiltration',
    tacticId: 'TA0010',
    techniques: [
      { id: 'T1567.002', name: 'Exfiltration to Cloud Storage', tactic: 'Exfiltration', tacticId: 'TA0010', description: 'Uploading sensitive archives to MEGA, Google Drive, or AWS S3 buckets.', threatFrequency: 'High', coverageStatus: 'Covered', actors: ['LockBit 3.0', 'Scattered Spider'], detectionRules: ['DLP: Outbound transfer > 500MB to cloud storage domain', 'CASB: Non-corporate Dropbox sync'] }
    ]
  }
];

export const MOCK_REPORTS: CtiReport[] = [
  {
    id: 'REP-2026-001',
    stixId: 'report--00112233-4455-6677-8899-aabbccddeeff',
    title: 'Flash Bulletin: Operation GhostWriter Exploiting WinRAR Zero-Day (CVE-2023-38831) in APAC & NATO Enclaves',
    author: 'SEMOR Threat Research Labs & Mandiant Frontline',
    published: '2026-04-06 09:30 UTC',
    tlp: 'TLP:AMBER',
    confidence: 96,
    targetSectors: ['Government', 'Defense', 'Diplomatic Enclaves', 'Energy SCADA'],
    summary: 'A coordinated cyber espionage campaign orchestrated by Russian state-sponsored adversary APT28 (Fancy Bear) has intensified. The threat group is targeting diplomatic attachés and critical infrastructure personnel using weaponized RAR archives containing disguised executable stagers that exploit CVE-2023-38831.',
    adversaryProfile: 'APT28 is a cyber espionage unit operating under Russian Military Intelligence (GRU 85th Main Special Service Center / GTsSS). Known for aggressive spearphishing, credential harvesting, and deployment of lightweight Go/C++ downloaders (Zebrocy, Drovorub).',
    technicalAnalysis: 'Victims receive tailored phishing emails referencing NATO geopolitical agreements. Upon clicking an image within the archive, a shell execution flaw bypasses security zone checks and drops Zebrocy Go loader to %TEMP%. The loader immediately beacons to bulletproof C2 at 185.234.219.12 via HTTPS port 8443, retrieving secondary memory-only DLL payloads.',
    mitigations: [
      'Upgrade RARLAB WinRAR to version 6.23 or newer immediately across all endpoints.',
      'Block egress traffic to known APT28 C2 IP range 185.234.219.0/24 and domain update.microsoft-security.com.',
      'Enforce strict Mark-of-the-Web (MOTW) propagation on incoming archive attachments at the Secure Email Gateway (SEG).',
      'Deploy Sigma rule "WinRAR Child Process Spawning from %TEMP%" to SIEM/EDR platforms.'
    ],
    relatedIocs: ['185.234.219.12', 'update.microsoft-security.com', 'e3b0c442...55'],
    mitreTechniques: ['T1566.001', 'T1059.001', 'T1071.001', 'T1003.001'],
    rawStixJson: JSON.stringify({
      "type": "bundle",
      "id": "bundle--00112233-4455-6677-8899-aabbccddeeff",
      "spec_version": "2.1",
      "objects": [
        {
          "type": "report",
          "id": "report--00112233-4455-6677-8899-aabbccddeeff",
          "name": "Flash Bulletin: Operation GhostWriter",
          "published": "2026-04-06T09:30:00.000Z",
          "confidence": 96,
          "labels": ["threat-report", "apt28", "ghostwriter"]
        }
      ]
    }, null, 2)
  },
  {
    id: 'REP-2026-002',
    stixId: 'report--11223344-5566-7788-99aa-bbccddeeff00',
    title: 'Adversary Intelligence: Lazarus Group "Operation DreamJob" Targeting Web3 Developers with Mach-O Backdoors',
    author: 'SEMOR CTI / Unit 42 Collaborative',
    published: '2026-04-04 16:15 UTC',
    tlp: 'TLP:GREEN',
    confidence: 94,
    targetSectors: ['Financial Services', 'Cryptocurrency Exchanges', 'Decentralized Finance (DeFi)'],
    summary: 'North Korean adversary Lazarus Group is actively executing fake job recruitment campaigns on professional networking sites. Senior developers in blockchain and Web3 projects are lured with lucrative compensation proposals that require executing custom macOS coding tests containing AppleJeus payloads.',
    adversaryProfile: 'Lazarus Group (attributed to RGB 3rd Bureau / Lab 110) conducts financially motivated attacks to bypass international economic sanctions and fund state ballistic missile programs.',
    technicalAnalysis: 'The adversary utilizes trojanized PDF reader bundles that execute a background AppleScript task upon file opening. The payload establishes persistence via ~/Library/LaunchAgents/com.apple.itunes.update.plist and queries Fast-Flux DNS nodes to exfiltrate browser credentials and private key keystore files.',
    mitigations: [
      'Isolate all developer workstations handling cryptocurrency transaction signing from general web browsing.',
      'Block known recruitment phishing domains matching regex *careers-web3*.io and *crypto-hr-talents*.net.',
      'Enforce Jamf / MDM Gatekeeper policies forbidding execution of unsigned Mach-O binaries in ~/Downloads.',
      'Audit DNS query logs for anomalous high-frequency queries to dynamic fast-flux infrastructure.'
    ],
    relatedIocs: ['https://cdn.secure-cloud-portal.net/auth/v2/session.php', 'recruiting-talent@web3-innovations-hr.com'],
    mitreTechniques: ['T1204.002', 'T1547.001', 'T1567.002'],
    rawStixJson: JSON.stringify({
      "type": "bundle",
      "id": "bundle--11223344-5566-7788-99aa-bbccddeeff00",
      "spec_version": "2.1",
      "objects": [
        {
          "type": "report",
          "id": "report--11223344-5566-7788-99aa-bbccddeeff00",
          "name": "Operation DreamJob Targeting Web3",
          "published": "2026-04-04T16:15:00.000Z",
          "confidence": 94
        }
      ]
    }, null, 2)
  },
  {
    id: 'REP-2026-003',
    stixId: 'report--22334455-6677-8899-aabb-ccddeeff0011',
    title: 'Threat Actor Profile: Volt Typhoon Living-Off-The-Land Pre-positioning in Critical Infrastructure',
    author: 'CISA / FBI / NSA Joint Advisory via SEMOR CTI',
    published: '2026-03-30 11:00 UTC',
    tlp: 'TLP:CLEAR',
    confidence: 98,
    targetSectors: ['Energy', 'Water & Wastewater', 'Transportation SCADA', 'Telecommunications'],
    summary: 'Volt Typhoon emphasizes operational security by almost exclusively employing built-in administrative utilities (LotL) after gaining initial access through unpatched edge routers and VPN appliances. The goal is long-term stealthy pre-positioning rather than immediate disruptive action.',
    adversaryProfile: 'State-sponsored threat actor from the People\'s Republic of China, specialized in intelligence collection and strategic positioning within foundational utility and logistics corridors.',
    technicalAnalysis: 'The actor routes all operational command traffic through KV-Botnet, an extensive proxy network constructed from end-of-life SOHO routers in the target country, masking traffic as residential internet traffic. Once inside, they dump NTDS.dit via ntdsutil and use PowerShell remoting to establish covert WMI event subscriptions.',
    mitigations: [
      'Decommission legacy SOHO edge routing hardware that does not support modern firmware security patches.',
      'Restrict and alert on the invocation of administrative binaries (wmic.exe, ntdsutil.exe, vssadmin.exe) from non-standard user contexts.',
      'Mandate phishing-resistant multi-factor authentication (FIDO2 / WebAuthn) for all remote administrative access portals.',
      'Baseline normal administrative command activity and implement UEBA anomaly triggers for unusual off-hours administrative sessions.'
    ],
    relatedIocs: ['91.240.118.172'],
    mitreTechniques: ['T1078', 'T1059.003', 'T1003.001', 'T1090.003'],
    rawStixJson: JSON.stringify({
      "type": "bundle",
      "id": "bundle--22334455-6677-8899-aabb-ccddeeff0011",
      "spec_version": "2.1",
      "objects": [
        {
          "type": "report",
          "id": "report--22334455-6677-8899-aabb-ccddeeff0011",
          "name": "Volt Typhoon Critical Infrastructure Pre-positioning",
          "published": "2026-03-30T11:00:00.000Z",
          "confidence": 98
        }
      ]
    }, null, 2)
  }
];

// Convenience Aliases for UI Components
export const INITIAL_INDICATORS = MOCK_INDICATORS;
export const INITIAL_CONNECTORS = MOCK_CONNECTORS;
export const CTI_REPORTS = MOCK_REPORTS;

export const GEOPOLITICAL_HOTSPOTS = [
  {
    country: "Russia",
    flag: "🇷🇺",
    threatIndex: 96,
    actors: ["APT28", "Sandworm", "Turla", "Gamaredon"],
    campaignsCount: 14,
    tactics: "Dual-track espionage, infrastructure wiper malware (HermeticWiper, CaddyWiper), and spearphishing against NATO and energy grids.",
    sectors: ["Defense", "Energy Grid", "Foreign Affairs", "Nuclear Research"]
  },
  {
    country: "China",
    flag: "🇨🇳",
    threatIndex: 94,
    actors: ["Volt Typhoon", "Mustang Panda", "APT41", "Salt Typhoon"],
    campaignsCount: 19,
    tactics: "Living-off-the-land (LotL) stealth pre-positioning, zero-day VPN exploits, telecom carrier interception, and maritime corridor surveillance.",
    sectors: ["Semiconductor", "Telecom", "Water / Power SCADA", "Logistics Ports"]
  },
  {
    country: "North Korea",
    flag: "🇰🇵",
    threatIndex: 91,
    actors: ["Lazarus Group", "Kimsuky", "Andariel"],
    campaignsCount: 11,
    tactics: "DeFi and crypto bridge financial drains, fake LinkedIn recruiter malware droppers (Operation DreamJob), and supply chain dependency poisoning.",
    sectors: ["Cryptocurrency", "Defense Aerospace", "Financial SWIFT", "Think Tanks"]
  },
  {
    country: "Iran",
    flag: "🇮🇷",
    threatIndex: 85,
    actors: ["Charming Kitten", "MuddyWater", "OilRig"],
    campaignsCount: 8,
    tactics: "Watering hole lures, credential harvesting via multi-persona social engineering, and defacement wiper operations across Middle Eastern targets.",
    sectors: ["Government", "Maritime Shipping", "Energy Refining", "Telecommunications"]
  },
  {
    country: "Transnational Syndicates",
    flag: "🏴‍☠️",
    threatIndex: 89,
    actors: ["LockBit Syndicate", "BlackCat / ALPHV", "Akira"],
    campaignsCount: 26,
    tactics: "Ransomware-as-a-Service (RaaS) with double extortion, active data leakage portals, and cloud credential exfiltration via compromised API tokens.",
    sectors: ["Healthcare", "Manufacturing", "Retail / E-Commerce", "Higher Education"]
  }
];

export const GEO_ALERTS = [
  {
    id: "GEO-ALT-01",
    time: "10m ago",
    severity: "Critical",
    title: "Volt Typhoon Pre-positioning on Pacific Submarine Fiber Cable Hubs",
    summary: "High-confidence telemetry observes persistent credential abuse and SOHO proxy hops targeting routing controllers in Guam and Hawaii.",
    region: "Asia-Pacific & US West",
    actor: "Volt Typhoon"
  },
  {
    id: "GEO-ALT-02",
    time: "28m ago",
    severity: "Critical",
    title: "Lazarus Weaponizing Fast-Flux C2 via Compromised AWS S3 Buckets",
    summary: "Active watering hole campaigns discovered hosting weaponized job application PDF lures targeting smart contract developers in Singapore and Tokyo.",
    region: "East Asia",
    actor: "Lazarus Group"
  },
  {
    id: "GEO-ALT-03",
    time: "1h ago",
    severity: "High",
    title: "APT28 Resuming Spearphishing against European Ministry of Foreign Affairs",
    summary: "Delivery documents exploiting CVE-2023-38831 distributed via bulletproof VPS relays in Frankfurt and Amsterdam.",
    region: "Western Europe",
    actor: "APT28 (Fancy Bear)"
  }
];

export const MITRE_TACTICS_DATA: MitreTacticGroup[] = [
  {
    id: "TA0001",
    name: "Initial Access",
    techniques: [
      {
        id: "T1566.001",
        name: "Spearphishing Attachment",
        coverage: "Covered",
        threatScore: 94,
        description: "Adversaries send spearphishing emails with malicious attachments to gain initial code execution on target host.",
        actors: ["APT28", "Lazarus Group", "Mustang Panda"],
        sigmaRule: "title: Suspicious Email Attachment Execution\nstatus: production\nlogsource:\n  category: process_creation\n  product: windows\ndetection:\n  selection:\n    ParentImage|endswith: ['outlook.exe', 'thunderbird.exe']\n    Image|endswith: ['powershell.exe', 'cmd.exe', 'wscript.exe']\n  condition: selection",
        mitigation: "Deploy sandbox attachment detonators and enforce strict file extension blocking on email gateway."
      },
      {
        id: "T1190",
        name: "Exploit Public-Facing Application",
        coverage: "Partial",
        threatScore: 98,
        description: "Adversaries exploit weaknesses and zero-day vulnerabilities in Internet-facing software (e.g. Citrix Bleed, ScreenConnect).",
        actors: ["LockBit Syndicate", "Volt Typhoon", "Lazarus Group"],
        sigmaRule: "title: Exploitation of Web Service Perimeter\nstatus: production\nlogsource:\n  category: webserver\ndetection:\n  selection:\n    c-uri-stem|contains: ['/vpn/../vpns/', '/logon/LogonPoint/']\n    sc-status: [200, 302]\n  condition: selection",
        mitigation: "Patch edge appliances immediately, enforce WAF virtual patching rules, and isolate perimeter interfaces."
      },
      {
        id: "T1078",
        name: "Valid Accounts",
        coverage: "Partial",
        threatScore: 90,
        description: "Adversaries obtain and abuse credentials of existing legitimate accounts to blend into baseline network noise.",
        actors: ["Volt Typhoon", "APT29"],
        sigmaRule: "title: Impossible Travel Anomaly\nstatus: experimental\nlogsource:\n  product: azure_ad\ndetection:\n  selection:\n    RiskEventType: 'unfamiliarFeatures' OR 'impossibleTravel'\n  condition: selection",
        mitigation: "Enforce conditional access policies, phishing-resistant FIDO2 tokens, and UEBA geovelocity alerts."
      }
    ]
  },
  {
    id: "TA0002",
    name: "Execution",
    techniques: [
      {
        id: "T1059.001",
        name: "PowerShell",
        coverage: "Covered",
        threatScore: 92,
        description: "Adversaries abuse PowerShell commands and scripts to execute payloads in-memory without dropping files to disk.",
        actors: ["APT28", "Lazarus Group", "MuddyWater"],
        sigmaRule: "title: Suspicious Encoded PowerShell Execution\nstatus: production\nlogsource:\n  category: process_creation\n  product: windows\ndetection:\n  selection:\n    CommandLine|contains:\n      - '-enc'\n      - '-EncodedCommand'\n      - 'FromBase64String'\n      - 'IEX('\n  condition: selection",
        mitigation: "Enable PowerShell Script Block Logging (Event ID 4104) and enforce ConstrainedLanguage mode via AppLocker."
      },
      {
        id: "T1059.003",
        name: "Windows Command Shell",
        coverage: "Covered",
        threatScore: 85,
        description: "Adversaries abuse cmd.exe to execute built-in batch utilities and coordinate staging.",
        actors: ["Volt Typhoon", "Sandworm"],
        sigmaRule: "title: Cmd Spawned by Non-Standard Parent\nstatus: production\nlogsource:\n  category: process_creation\n  product: windows\ndetection:\n  selection:\n    ParentImage|endswith: ['w3wp.exe', 'sqlservr.exe', 'nginx.exe']\n    Image|endswith: 'cmd.exe'\n  condition: selection",
        mitigation: "Audit process ancestry and prevent child process spawning from web and database services."
      },
      {
        id: "T1204.002",
        name: "Malicious File Execution",
        coverage: "Gap",
        threatScore: 88,
        description: "Adversaries rely on an unsuspecting user to open an executable, weaponized LNK file, or macro-enabled workbook.",
        actors: ["Lazarus Group", "LockBit 3.0"],
        sigmaRule: "title: LNK Shortcut Spawning Script Engine\nstatus: experimental\nlogsource:\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains: ['.lnk', 'mshta.exe', 'rundll32.exe']\n  condition: selection",
        mitigation: "Block execution of .iso, .vhd, and .lnk files originating from web downloads or email attachments."
      }
    ]
  },
  {
    id: "TA0003",
    name: "Persistence",
    techniques: [
      {
        id: "T1053.005",
        name: "Scheduled Task",
        coverage: "Covered",
        threatScore: 88,
        description: "Adversaries abuse task scheduler to execute programs at system startup or on a recurring basis.",
        actors: ["Volt Typhoon", "APT28", "Sandworm"],
        sigmaRule: "title: Scheduled Task Created via Schtasks Command\nstatus: production\nlogsource:\n  category: process_creation\n  product: windows\ndetection:\n  selection:\n    Image|endswith: 'schtasks.exe'\n    CommandLine|contains: ['/create', '/ru', 'SYSTEM']\n  condition: selection",
        mitigation: "Monitor Windows Event ID 4698 (A scheduled task was created) and restrict task scheduler write permissions."
      },
      {
        id: "T1547.001",
        name: "Registry Run Keys / Startup",
        coverage: "Covered",
        threatScore: 82,
        description: "Adversaries add program entries to Run or RunOnce registry keys to maintain execution on reboot.",
        actors: ["Mustang Panda", "LockBit Syndicate"],
        sigmaRule: "title: Registry Run Key Modification\nstatus: production\nlogsource:\n  category: registry_set\ndetection:\n  selection:\n    TargetObject|contains:\n      - '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\'\n      - '\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce\\'\n  condition: selection",
        mitigation: "Lock down administrative registry keys and deploy EDR behavioral blocking on auto-start persistence writes."
      }
    ]
  },
  {
    id: "TA0005",
    name: "Defense Evasion",
    techniques: [
      {
        id: "T1070.004",
        name: "File Deletion",
        coverage: "Covered",
        threatScore: 86,
        description: "Adversaries delete files and stagers to reduce their footprint and impede incident responders.",
        actors: ["Sandworm", "LockBit 3.0", "APT28"],
        sigmaRule: "title: Batch Self-Deletion Technique\nstatus: production\nlogsource:\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains: ['cmd.exe /c del', 'ping 127.0.0.1 -n 3', '>nul & del']\n  condition: selection",
        mitigation: "Enable Volume Shadow Copy protection and stream endpoint file-modification logs to an immutable SIEM."
      },
      {
        id: "T1562.001",
        name: "Disable Security Tools",
        coverage: "Partial",
        threatScore: 96,
        description: "Adversaries disable or modify antivirus and EDR drivers using Bring-Your-Own-Vulnerable-Driver (BYOVD).",
        actors: ["Lazarus Group", "LockBit Syndicate"],
        sigmaRule: "title: Antivirus Service Tampering\nstatus: production\nlogsource:\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - 'sc stop WinDefend'\n      - 'Set-MpPreference -DisableRealtimeMonitoring $true'\n  condition: selection",
        mitigation: "Enable Microsoft Defender Tamper Protection and configure kernel-mode vulnerable driver blocklists."
      },
      {
        id: "T1027",
        name: "Obfuscated Files or Information",
        coverage: "Gap",
        threatScore: 91,
        description: "Adversaries encrypt, encode, or pack files to evade static signature inspection.",
        actors: ["APT28", "Volt Typhoon", "Charming Kitten"],
        sigmaRule: "title: High Entropy Binary Execution in AppData\nstatus: experimental\nlogsource:\n  category: process_creation\ndetection:\n  selection:\n    Image|contains: '\\AppData\\Local\\Temp\\'\n  condition: selection",
        mitigation: "Deploy dynamic behavioral analysis sandboxes and enforce AMSI script buffer scanning."
      }
    ]
  },
  {
    id: "TA0006",
    name: "Credential Access",
    techniques: [
      {
        id: "T1003.001",
        name: "LSASS Memory Dumping",
        coverage: "Covered",
        threatScore: 97,
        description: "Adversaries dump memory of the Local Security Authority Subsystem Service (LSASS) to harvest plaintext passwords and NTLM hashes.",
        actors: ["Volt Typhoon", "APT28", "Sandworm"],
        sigmaRule: "title: LSASS Memory Dump via Task Manager or Procdump\nstatus: production\nlogsource:\n  category: process_access\ndetection:\n  selection:\n    TargetImage|endswith: 'lsass.exe'\n    GrantedAccess: ['0x1010', '0x1410', '0x1F3FFF']\n  condition: selection",
        mitigation: "Enable Windows LSA Protection (RunAsPPL) and Credential Guard via virtualization-based security (VBS)."
      },
      {
        id: "T1110.003",
        name: "Password Spraying",
        coverage: "Covered",
        threatScore: 89,
        description: "Adversaries test a single password or small set against many valid user accounts to bypass account lockouts.",
        actors: ["Charming Kitten", "APT28", "Volt Typhoon"],
        sigmaRule: "title: Password Spray Threshold Exceeded\nstatus: production\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 4625\n  condition: selection | count(TargetUserName) by IpAddress > 20",
        mitigation: "Deploy smart lockout thresholds and enforce multi-factor authentication across all endpoints and SSO portals."
      }
    ]
  },
  {
    id: "TA0011",
    name: "Command and Control",
    techniques: [
      {
        id: "T1071.001",
        name: "Web Protocols (HTTP/HTTPS)",
        coverage: "Covered",
        threatScore: 95,
        description: "Adversaries communicate using application layer protocols (HTTP/HTTPS) to blend C2 with normal web traffic.",
        actors: ["APT28", "Lazarus Group", "Mustang Panda", "Volt Typhoon"],
        sigmaRule: "title: C2 Beaconing Periodic Request Interval\nstatus: production\nlogsource:\n  category: proxy\ndetection:\n  selection:\n    r-dns: '*.duckdns.org'\n  condition: selection",
        mitigation: "Implement TLS inspection with SSL decryption, domain categorization, and jitter timing analysis."
      },
      {
        id: "T1090.003",
        name: "Multi-hop Proxy",
        coverage: "Partial",
        threatScore: 90,
        description: "Adversaries chain together multiple proxies, infected SOHO routers, or Tor circuits to hide origin IP addresses.",
        actors: ["Volt Typhoon", "APT28", "Lazarus Group"],
        sigmaRule: "title: Connection to Known Tor or Fast-Flux Relay\nstatus: production\nlogsource:\n  category: firewall\ndetection:\n  selection:\n    dst_ip: 'threat_intel_tor_nodes'\n  condition: selection",
        mitigation: "Correlate outbound network egress with threat intelligence IP reputation and Tor exit node feeds."
      }
    ]
  }
];

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  Server, 
  Key, 
  Lock, 
  Sliders, 
  Filter, 
  Search, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  FileCode, 
  Hash, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Activity,
  Globe,
  Database,
  ArrowRight,
  ShieldAlert,
  Zap,
  Tag,
  Share2,
  X,
  Bell,
  Info,
  ArrowUpDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import FeedRealtimeHealthBadge, { InCardTelemetryBar, computeFeedHealth } from './FeedRealtimeHealthBadge';
import ThreatIntelAlertThresholdModal, { 
  ThreatIntelAlertThresholds, 
  evaluateFeedAlerts, 
  TriggeredFeedAlert 
} from './ThreatIntelAlertThresholdModal';
import ThreatIntelImportExportModal from './ThreatIntelImportExportModal';
import FeedStatusOverviewWidget from './FeedStatusOverviewWidget';

export type TaxiiProtocol = 'TAXII 2.1' | 'TAXII 2.0' | 'TAXII 1.1' | 'STIX 2.1 JSON' | 'MISP REST';
export type TlpLevel = 'TLP:WHITE' | 'TLP:GREEN' | 'TLP:AMBER' | 'TLP:AMBER+STRICT' | 'TLP:RED';
export type IocType = 'ipv4' | 'ipv6' | 'domain' | 'url' | 'file_hash' | 'cve' | 'yara';

export interface StixSampleIndicator {
  id: string;
  type: IocType;
  value: string;
  pattern: string;
  confidence: number;
  validFrom: string;
  tlp: TlpLevel;
  threatActor?: string;
  mitreTechnique?: string;
  description: string;
}

export interface ThreatFeed {
  id: string;
  name: string;
  provider: string;
  description: string;
  protocol: TaxiiProtocol;
  discoveryUrl: string;
  apiRoot: string;
  collectionId: string;
  collectionTitle: string;
  authType: 'none' | 'api_key' | 'basic' | 'mtls';
  authConfig: {
    apiKey?: string;
    headerName?: string;
    username?: string;
    password?: string;
    clientCertName?: string;
  };
  autoRefresh: boolean;
  refreshIntervalMinutes: number;
  pollMode: 'incremental' | 'full';
  iocTypes: IocType[];
  confidenceThreshold: number;
  tlpCeiling: TlpLevel;
  autoEnforceBlocklist: boolean;
  verifySsl: boolean;
  status: 'active' | 'syncing' | 'warning' | 'error' | 'paused';
  lastSyncTime: string;
  lastSyncTimestamp: number;
  nextSyncCountdownSeconds: number;
  indicatorCount: number;
  correlationHitsCount: number;
  latencyMs: number;
  httpStatusCode?: number;
  ingestionSuccessRate?: number;
  ingestedInLastSync?: number;
  droppedCount?: number;
  lastErrorMessage?: string;
  tags: string[];
  sampleIndicators: StixSampleIndicator[];
  consecutiveFailures?: number;
  customAlertThresholds?: {
    enabled: boolean;
    maxFailedAttempts: number;
    highLatencyMs: number;
  };
}

const PRESET_FEEDS: Array<{
  name: string;
  provider: string;
  protocol: TaxiiProtocol;
  discoveryUrl: string;
  apiRoot: string;
  collectionId: string;
  collectionTitle: string;
  authType: 'none' | 'api_key' | 'basic' | 'mtls';
  refreshIntervalMinutes: number;
  description: string;
  iocTypes: IocType[];
  tlpCeiling: TlpLevel;
}> = [
  {
    name: 'CISA AIS (Automated Indicator Sharing)',
    provider: 'U.S. Cybersecurity and Infrastructure Security Agency',
    protocol: 'TAXII 2.1',
    discoveryUrl: 'https://taxii.cisa.gov/taxii2/',
    apiRoot: '/api/v2.1/',
    collectionId: 'urn:cisa:collection:ais-indicators-stream',
    collectionTitle: 'Federal Inter-Agency Threat Stream',
    authType: 'api_key',
    refreshIntervalMinutes: 15,
    description: 'Federal civilian and critical infrastructure real-time STIX 2.1 observable exchange.',
    iocTypes: ['ipv4', 'domain', 'url', 'file_hash', 'cve'],
    tlpCeiling: 'TLP:AMBER'
  },
  {
    name: 'AlienVault OTX Community Pulses',
    provider: 'AT&T Cybersecurity / AlienVault',
    protocol: 'TAXII 2.1',
    discoveryUrl: 'https://otx.alienvault.com/taxii/v2.1/',
    apiRoot: '/taxii/root/',
    collectionId: 'pulses-global-curated-v2',
    collectionTitle: 'AlienVault All Subscribed Pulses',
    authType: 'api_key',
    refreshIntervalMinutes: 5,
    description: 'Open threat community pulses, ransomware IOCs, and active C2 infrastructure tracking.',
    iocTypes: ['ipv4', 'ipv6', 'domain', 'url', 'file_hash'],
    tlpCeiling: 'TLP:GREEN'
  },
  {
    name: 'MITRE ATT&CK STIX 2.1 Enterprise Repository',
    provider: 'MITRE Corporation',
    protocol: 'STIX 2.1 JSON',
    discoveryUrl: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
    apiRoot: '/',
    collectionId: 'enterprise-attack-v15',
    collectionTitle: 'MITRE ATT&CK Enterprise Matrix v15.1',
    authType: 'none',
    refreshIntervalMinutes: 1440,
    description: 'Global knowledge base of adversary tactics, techniques, and procedures (TTPs).',
    iocTypes: ['cve', 'yara'],
    tlpCeiling: 'TLP:WHITE'
  },
  {
    name: 'Abuse.ch URLhaus & ThreatFox Combined Feeds',
    provider: 'Abuse.ch Research Project',
    protocol: 'TAXII 2.1',
    discoveryUrl: 'https://threatfox.abuse.ch/taxii2/',
    apiRoot: '/taxii2/',
    collectionId: 'collection:threatfox-verified-iocs',
    collectionTitle: 'ThreatFox Malware IOC Stream',
    authType: 'none',
    refreshIntervalMinutes: 10,
    description: 'High-confidence malware distribution URLs, botnet C2 IPs, and cryptomining domains.',
    iocTypes: ['ipv4', 'domain', 'url', 'file_hash'],
    tlpCeiling: 'TLP:WHITE'
  },
  {
    name: 'FS-ISAC Cyber Threat Intelligence Sharing',
    provider: 'Financial Services ISAC',
    protocol: 'TAXII 2.0',
    discoveryUrl: 'https://taxii.fsisac.com/taxii2/',
    apiRoot: '/api/v2.0/financial/',
    collectionId: 'fsisac-banking-threats-stix2',
    collectionTitle: 'Global Banking & SWIFT Threat Stream',
    authType: 'mtls',
    refreshIntervalMinutes: 30,
    description: 'Specialized indicators targeting banking trojans, ATM switch malware, and financial APTs.',
    iocTypes: ['ipv4', 'domain', 'file_hash', 'cve'],
    tlpCeiling: 'TLP:AMBER+STRICT'
  }
];

const INITIAL_FEEDS: ThreatFeed[] = [
  {
    id: 'feed-cisa-ais',
    name: 'CISA AIS (Automated Indicator Sharing)',
    provider: 'U.S. Cybersecurity and Infrastructure Security Agency',
    description: 'Real-time bidirectional machine-to-machine STIX 2.1 threat exchange for federal civilian and critical infrastructure.',
    protocol: 'TAXII 2.1',
    discoveryUrl: 'https://taxii.cisa.gov/taxii2/',
    apiRoot: '/api/v2.1/',
    collectionId: 'urn:cisa:collection:ais-indicators-stream',
    collectionTitle: 'Federal Inter-Agency Threat Stream',
    authType: 'api_key',
    authConfig: {
      apiKey: 'cisa_sec_tok_991823a4f89d',
      headerName: 'Authorization'
    },
    autoRefresh: true,
    refreshIntervalMinutes: 15,
    pollMode: 'incremental',
    iocTypes: ['ipv4', 'domain', 'url', 'file_hash', 'cve'],
    confidenceThreshold: 80,
    tlpCeiling: 'TLP:AMBER',
    autoEnforceBlocklist: true,
    verifySsl: true,
    status: 'active',
    lastSyncTime: '2 分鐘前 (2m ago)',
    lastSyncTimestamp: Date.now() - 120000,
    nextSyncCountdownSeconds: 780,
    indicatorCount: 148250,
    correlationHitsCount: 412,
    latencyMs: 142,
    httpStatusCode: 200,
    ingestionSuccessRate: 100,
    ingestedInLastSync: 42,
    droppedCount: 0,
    tags: ['Critical-Infra', 'Zero-Day', 'Government', 'Ransomware'],
    sampleIndicators: [
      {
        id: 'indicator--8e2e21b7-9f20-4e41-9c22-2b13b61eee99',
        type: 'ipv4',
        value: '198.51.100.23',
        pattern: "[ipv4-addr:value = '198.51.100.23']",
        confidence: 95,
        validFrom: '2026-09-18T04:00:00Z',
        tlp: 'TLP:AMBER',
        threatActor: 'APT29 (Cozy Bear)',
        mitreTechnique: 'T1071.001 - Application Layer Protocol',
        description: 'Command and control server utilized in active credential-harvesting spearphishing campaign.'
      },
      {
        id: 'indicator--991b10a2-aa41-419b-8bc1-12c823ea91aa',
        type: 'domain',
        value: 'auth-microsoft-security-check.com',
        pattern: "[domain-name:value = 'auth-microsoft-security-check.com']",
        confidence: 90,
        validFrom: '2026-09-17T22:30:00Z',
        tlp: 'TLP:AMBER',
        threatActor: 'Storm-0558',
        mitreTechnique: 'T1566.002 - Phishing: Spearphishing Link',
        description: 'Adversary-in-the-Middle (AiTM) proxy domain targeting Microsoft 365 OAuth tokens.'
      },
      {
        id: 'indicator--663b19c4-dd39-4d22-811c-99a8b7c61144',
        type: 'file_hash',
        value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        pattern: "[file:hashes.'SHA-256' = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']",
        confidence: 99,
        validFrom: '2026-09-18T01:15:00Z',
        tlp: 'TLP:AMBER',
        threatActor: 'Volt Typhoon',
        mitreTechnique: 'T1059.001 - PowerShell Stager',
        description: 'Cobalt Strike Beacon stager embedded in weaponized PDF document.'
      }
    ]
  },
  {
    id: 'feed-alienvault-otx',
    name: 'AlienVault OTX Community Pulses',
    provider: 'AT&T Cybersecurity',
    description: 'Crowdsourced open threat intelligence network delivering rapid indicators across worldwide security researchers.',
    protocol: 'TAXII 2.1',
    discoveryUrl: 'https://otx.alienvault.com/taxii/v2.1/',
    apiRoot: '/taxii/root/',
    collectionId: 'pulses-global-curated-v2',
    collectionTitle: 'AlienVault Curated Pulses Collection',
    authType: 'api_key',
    authConfig: {
      apiKey: 'otx_api_live_839103847291048b',
      headerName: 'X-OTX-API-KEY'
    },
    autoRefresh: true,
    refreshIntervalMinutes: 5,
    pollMode: 'incremental',
    iocTypes: ['ipv4', 'ipv6', 'domain', 'url', 'file_hash'],
    confidenceThreshold: 75,
    tlpCeiling: 'TLP:GREEN',
    autoEnforceBlocklist: true,
    verifySsl: true,
    status: 'active',
    lastSyncTime: '1 分鐘前 (1m ago)',
    lastSyncTimestamp: Date.now() - 60000,
    nextSyncCountdownSeconds: 240,
    indicatorCount: 94180,
    correlationHitsCount: 1289,
    latencyMs: 98,
    httpStatusCode: 200,
    ingestionSuccessRate: 100,
    ingestedInLastSync: 95,
    droppedCount: 0,
    tags: ['Crowdsourced', 'Malware-Pulses', 'Botnets', 'Rapid-IoC'],
    sampleIndicators: [
      {
        id: 'indicator--otx-01',
        type: 'url',
        value: 'http://185.220.101.5/bins/mirai.arm7',
        pattern: "[url:value = 'http://185.220.101.5/bins/mirai.arm7']",
        confidence: 88,
        validFrom: '2026-09-18T05:00:00Z',
        tlp: 'TLP:GREEN',
        threatActor: 'Mirai Botnet Operators',
        mitreTechnique: 'T1584.005 - Botnet Infrastructure',
        description: 'Mirai IoT botnet payload binary download point.'
      },
      {
        id: 'indicator--otx-02',
        type: 'ipv4',
        value: '45.154.255.89',
        pattern: "[ipv4-addr:value = '45.154.255.89']",
        confidence: 92,
        validFrom: '2026-09-18T03:20:00Z',
        tlp: 'TLP:GREEN',
        threatActor: 'Lazarus Group',
        mitreTechnique: 'T1105 - Ingress Tool Transfer',
        description: 'RedLine Stealer exfiltration drop server.'
      }
    ]
  },
  {
    id: 'feed-mitre-attack',
    name: 'MITRE ATT&CK STIX 2.1 Repository',
    provider: 'MITRE Corporation',
    description: 'Authoritative global knowledge base of adversary behaviors, threat groups, software tools, and mitigation frameworks.',
    protocol: 'STIX 2.1 JSON',
    discoveryUrl: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
    apiRoot: '/',
    collectionId: 'enterprise-attack-v15',
    collectionTitle: 'MITRE ATT&CK Enterprise Matrix v15.1',
    authType: 'none',
    authConfig: {},
    autoRefresh: true,
    refreshIntervalMinutes: 1440,
    pollMode: 'full',
    iocTypes: ['cve', 'yara'],
    confidenceThreshold: 100,
    tlpCeiling: 'TLP:WHITE',
    autoEnforceBlocklist: false,
    verifySsl: true,
    status: 'active',
    lastSyncTime: '3 小時前 (3h ago)',
    lastSyncTimestamp: Date.now() - 10800000,
    nextSyncCountdownSeconds: 75600,
    indicatorCount: 18450,
    correlationHitsCount: 68,
    latencyMs: 310,
    httpStatusCode: 200,
    ingestionSuccessRate: 100,
    ingestedInLastSync: 15,
    droppedCount: 0,
    tags: ['TTP-Matrix', 'Adversary-Profiling', 'MITRE', 'Framework'],
    sampleIndicators: [
      {
        id: 'attack-pattern--mitre-t1059',
        type: 'cve',
        value: 'CVE-2024-21413',
        pattern: "[vulnerability:id = 'CVE-2024-21413']",
        confidence: 100,
        validFrom: '2026-01-01T00:00:00Z',
        tlp: 'TLP:WHITE',
        threatActor: 'APT28 (Fancy Bear)',
        mitreTechnique: 'T1203 - Exploitation for Client Execution',
        description: 'Microsoft Outlook Moniker Link Remote Code Execution Vulnerability.'
      }
    ]
  },
  {
    id: 'feed-abuse-ch',
    name: 'Abuse.ch URLhaus & ThreatFox Feeds',
    provider: 'Abuse.ch Research Project',
    description: 'Curated indicators for tracking malware distributions, command-and-control IP clusters, and active payload drops.',
    protocol: 'TAXII 2.1',
    discoveryUrl: 'https://threatfox.abuse.ch/taxii2/',
    apiRoot: '/taxii2/',
    collectionId: 'collection:threatfox-verified-iocs',
    collectionTitle: 'ThreatFox Malware Verified IOCs',
    authType: 'none',
    authConfig: {},
    autoRefresh: true,
    refreshIntervalMinutes: 10,
    pollMode: 'incremental',
    iocTypes: ['ipv4', 'domain', 'url', 'file_hash'],
    confidenceThreshold: 85,
    tlpCeiling: 'TLP:WHITE',
    autoEnforceBlocklist: true,
    verifySsl: true,
    status: 'active',
    lastSyncTime: '5 分鐘前 (5m ago)',
    lastSyncTimestamp: Date.now() - 300000,
    nextSyncCountdownSeconds: 300,
    indicatorCount: 35700,
    correlationHitsCount: 614,
    latencyMs: 82,
    httpStatusCode: 200,
    ingestionSuccessRate: 100,
    ingestedInLastSync: 68,
    droppedCount: 0,
    tags: ['Malware-Drop', 'C2-Tracking', 'ThreatFox', 'Zero-Cost'],
    sampleIndicators: [
      {
        id: 'indicator--tf-01',
        type: 'domain',
        value: 'update-synology-cloud-service.info',
        pattern: "[domain-name:value = 'update-synology-cloud-service.info']",
        confidence: 96,
        validFrom: '2026-09-18T02:10:00Z',
        tlp: 'TLP:WHITE',
        threatActor: 'LockBit 3.0 Affiliate',
        mitreTechnique: 'T1071.004 - DNS C2',
        description: 'LockBit ransomware staging and beaconing infrastructure.'
      }
    ]
  },
  {
    id: 'feed-fsisac',
    name: 'FS-ISAC Cyber Threat Intelligence Sharing',
    provider: 'Financial Services ISAC',
    description: 'Restricted financial sector intelligence covering banking trojans, ATM fraud malware, and state-sponsored finance APTs.',
    protocol: 'TAXII 2.0',
    discoveryUrl: 'https://taxii.fsisac.com/taxii2/',
    apiRoot: '/api/v2.0/financial/',
    collectionId: 'fsisac-banking-threats-stix2',
    collectionTitle: 'Global Banking & SWIFT Threat Stream',
    authType: 'mtls',
    authConfig: {
      clientCertName: 'fsisac_mutual_tls_cert_2026.pem',
      username: 'corp_soc_ingest',
      password: '••••••••••••••••'
    },
    autoRefresh: true,
    refreshIntervalMinutes: 30,
    pollMode: 'incremental',
    iocTypes: ['ipv4', 'domain', 'file_hash', 'cve'],
    confidenceThreshold: 90,
    tlpCeiling: 'TLP:AMBER+STRICT',
    autoEnforceBlocklist: true,
    verifySsl: true,
    status: 'active',
    lastSyncTime: '18 分鐘前 (18m ago)',
    lastSyncTimestamp: Date.now() - 1080000,
    nextSyncCountdownSeconds: 720,
    indicatorCount: 52340,
    correlationHitsCount: 184,
    latencyMs: 165,
    httpStatusCode: 200,
    ingestionSuccessRate: 98.4,
    ingestedInLastSync: 31,
    droppedCount: 0,
    tags: ['Banking', 'SWIFT', 'mTLS', 'High-Trust'],
    sampleIndicators: [
      {
        id: 'indicator--fs-01',
        type: 'file_hash',
        value: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        pattern: "[file:hashes.'SHA-256' = 'a1b2c3d4...']",
        confidence: 94,
        validFrom: '2026-09-17T18:00:00Z',
        tlp: 'TLP:AMBER+STRICT',
        threatActor: 'Carbanak / FIN7',
        mitreTechnique: 'T1055 - Process Injection',
        description: 'Custom memory-injected memory scraper targeting Point of Sale (POS) terminals.'
      }
    ]
  },
  {
    id: 'feed-openphish-warning',
    name: 'OpenPhish Global Real-Time Phishing Feed',
    provider: 'OpenPhish Threat Intelligence',
    description: 'Autonomous zero-day phishing telemetry pipeline. Endpoints currently experiencing elevated network latency and intermittent rate throttling.',
    protocol: 'STIX 2.1 JSON',
    discoveryUrl: 'https://openphish.com/feed/stix2_stream.json',
    apiRoot: '/feed/',
    collectionId: 'openphish-active-spearphish',
    collectionTitle: 'OpenPhish Global Verified URLs',
    authType: 'api_key',
    authConfig: {
      apiKey: 'op_live_tok_84719284192b',
      headerName: 'X-API-KEY'
    },
    autoRefresh: true,
    refreshIntervalMinutes: 10,
    pollMode: 'incremental',
    iocTypes: ['url', 'domain', 'ipv4'],
    confidenceThreshold: 85,
    tlpCeiling: 'TLP:GREEN',
    autoEnforceBlocklist: true,
    verifySsl: true,
    status: 'warning',
    lastSyncTime: '7 分鐘前 (7m ago)',
    lastSyncTimestamp: Date.now() - 420000,
    nextSyncCountdownSeconds: 180,
    indicatorCount: 41280,
    correlationHitsCount: 520,
    latencyMs: 580,
    httpStatusCode: 206,
    ingestionSuccessRate: 89.5,
    ingestedInLastSync: 24,
    droppedCount: 8,
    lastErrorMessage: 'Rate-limiting backoff detected (HTTP 206 Partial Content). Ingestion partial (8 dropped observables).',
    tags: ['Phishing', 'Degraded-RTT', 'Rate-Limited', 'Web-Attacks'],
    sampleIndicators: [
      {
        id: 'indicator--op-01',
        type: 'url',
        value: 'https://secure-login.chase-online-account-verify.com/login',
        pattern: "[url:value = 'https://secure-login.chase-online-account-verify.com/login']",
        confidence: 91,
        validFrom: '2026-09-18T04:15:00Z',
        tlp: 'TLP:GREEN',
        threatActor: 'Generic AiTM Kit',
        mitreTechnique: 'T1566.002 - Spearphishing Link',
        description: 'Compromised credential harvesting proxy page impersonating online banking portal.'
      }
    ]
  },
  {
    id: 'feed-shadowserver-critical',
    name: 'Shadowserver Foundation Sinkhole Telemetry',
    provider: 'The Shadowserver Foundation',
    description: 'Critical C2 botnet sinkhole observable feed. Downstream TAXII relay experiencing gateway connection timeout.',
    protocol: 'TAXII 2.1',
    discoveryUrl: 'https://taxii.shadowserver.org/taxii2/discovery',
    apiRoot: '/taxii2/',
    collectionId: 'shadowserver-mirai-c2',
    collectionTitle: 'Mirai & IoT Botnet Sinkhole Feed',
    authType: 'api_key',
    authConfig: {
      apiKey: 'ss_tok_fail_expired_99201a',
      headerName: 'Authorization'
    },
    autoRefresh: true,
    refreshIntervalMinutes: 15,
    pollMode: 'incremental',
    iocTypes: ['ipv4', 'domain', 'url'],
    confidenceThreshold: 90,
    tlpCeiling: 'TLP:AMBER',
    autoEnforceBlocklist: true,
    verifySsl: true,
    status: 'error',
    lastSyncTime: '剛剛失敗 (Failed 1m ago)',
    lastSyncTimestamp: Date.now() - 60000,
    nextSyncCountdownSeconds: 900,
    indicatorCount: 12400,
    correlationHitsCount: 84,
    latencyMs: 1380,
    consecutiveFailures: 2,
    httpStatusCode: 504,
    ingestionSuccessRate: 0,
    ingestedInLastSync: 0,
    droppedCount: 64,
    lastErrorMessage: 'HTTP 504 Gateway Timeout: Remote TAXII server took 1,380ms (>1000ms threshold) and failed to reply.',
    tags: ['Botnets', 'IoT', 'Gateway-Timeout', 'Critical-Error'],
    sampleIndicators: [
      {
        id: 'indicator--ss-01',
        type: 'ipv4',
        value: '194.26.29.112',
        pattern: "[ipv4-addr:value = '194.26.29.112']",
        confidence: 99,
        validFrom: '2026-09-17T12:00:00Z',
        tlp: 'TLP:AMBER',
        threatActor: 'Mozi Botnet',
        mitreTechnique: 'T1584.005 - Botnet Infrastructure',
        description: 'Known active IoT worm master node participating in SYN flood amplification.'
      }
    ]
  }
];

interface ThreatIntelSourcesSettingViewProps {
  isReadOnly?: boolean;
}

export default function ThreatIntelSourcesSettingView({ isReadOnly = false }: ThreatIntelSourcesSettingViewProps) {
  const { i18n } = useTranslation();
  const isZh = !i18n.language || i18n.language.startsWith('zh');

  const [feeds, setFeeds] = useState<ThreatFeed[]>(() => {
    const saved = localStorage.getItem('taxii_threat_feeds_v3') || localStorage.getItem('taxii_threat_feeds_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((f: any) => ({
            ...f,
            httpStatusCode: f.httpStatusCode ?? (f.status === 'error' ? 504 : f.status === 'warning' ? 206 : 200),
            ingestionSuccessRate: f.ingestionSuccessRate ?? (f.status === 'error' ? 0 : f.status === 'warning' ? 89.5 : 100),
            ingestedInLastSync: f.ingestedInLastSync ?? (f.status === 'error' ? 0 : 35),
            droppedCount: f.droppedCount ?? (f.status === 'error' ? 64 : f.status === 'warning' ? 8 : 0),
            latencyMs: f.latencyMs ?? (f.status === 'error' ? 1380 : f.status === 'warning' ? 580 : 110),
            consecutiveFailures: f.consecutiveFailures ?? (f.status === 'error' ? 2 : 0),
            customAlertThresholds: f.customAlertThresholds
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved threat feeds', e);
      }
    }
    return INITIAL_FEEDS;
  });

  // Alert Thresholds Setting state & persistence
  const [alertThresholds, setAlertThresholds] = useState<ThreatIntelAlertThresholds>(() => {
    const saved = localStorage.getItem('taxii_alert_thresholds_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved alert thresholds', e);
      }
    }
    return {
      enabled: true,
      maxFailedAttempts: 2,
      highLatencyMs: 800,
      notifyChannels: {
        inApp: true,
        email: true,
        webhook: false,
        syslog: true
      },
      emailRecipients: 'soc-alerts@ke-la.com, threat-intel@corp.internal',
      webhookUrl: 'https://siem.internal/api/v1/taxii-ingestion-alert',
      autoPauseOnExceeded: false,
      suppressDurationMinutes: 30
    };
  });

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeAlertBannerDismissed, setActiveAlertBannerDismissed] = useState(false);
  const [isProbingAllFeeds, setIsProbingAllFeeds] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    message: string;
    severity: 'critical' | 'warning' | 'success';
  } | null>(null);

  // Evaluate active alerts against current thresholds
  const activeAlerts = useMemo(() => {
    return evaluateFeedAlerts(feeds, alertThresholds);
  }, [feeds, alertThresholds]);

  // Handle saving thresholds
  const handleSaveAlertThresholds = (newSettings: ThreatIntelAlertThresholds) => {
    setAlertThresholds(newSettings);
    localStorage.setItem('taxii_alert_thresholds_v1', JSON.stringify(newSettings));
    setActiveAlertBannerDismissed(false); // reset dismissal on change
    setToastNotification({
      id: `saved-${Date.now()}`,
      title: isZh ? '告警閾值已更新' : 'Alert Thresholds Updated',
      message: isZh
        ? `收錄失敗閾值: ${newSettings.maxFailedAttempts} 次 | 高延遲閾值: ${newSettings.highLatencyMs}ms`
        : `Ingestion failure limit: ${newSettings.maxFailedAttempts} attempts | High latency: ${newSettings.highLatencyMs}ms`,
      severity: 'success'
    });
    setLiveLogs(l => [
      `[${new Date().toLocaleTimeString()}] [THRESHOLD-UPDATE] Applied new alert policy: maxFailures=${newSettings.maxFailedAttempts}, highLatencyMs=${newSettings.highLatencyMs}ms, alertingEnabled=${newSettings.enabled}.`,
      ...l.slice(0, 49)
    ]);
  };

  // Trigger test notification
  const handleTriggerTestNotification = (type: 'failure' | 'latency') => {
    if (type === 'failure') {
      setToastNotification({
        id: `test-fail-${Date.now()}`,
        title: isZh ? '情資收錄告警：連續失敗次數超標' : 'Ingestion Alert: Failed Attempts Limit Exceeded',
        message: isZh 
          ? `來源 [Shadowserver Foundation Sinkhole] 連續 ${alertThresholds.maxFailedAttempts} 次輪詢失敗 (HTTP 504 Gateway Timeout)，已發送告警通知至 SOC。`
          : `Source [Shadowserver Foundation] reached ${alertThresholds.maxFailedAttempts} consecutive failed attempts (HTTP 504). Alert dispatched to SOC.`,
        severity: 'critical'
      });
      setLiveLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [ALERT-DISPATCH] [CRITICAL] Feed "Shadowserver Foundation" triggered failure threshold (consecutive_failures: ${alertThresholds.maxFailedAttempts}). Notification sent to channels: [In-App, Email, Syslog].`,
        ...prev.slice(0, 49)
      ]);
    } else {
      setToastNotification({
        id: `test-lat-${Date.now()}`,
        title: isZh ? '情資端點告警：網路延遲過高' : 'Endpoint Alert: High Round-Trip Latency',
        message: isZh
          ? `來源 [OpenPhish Global Real-Time] 往返延遲達 ${alertThresholds.highLatencyMs + 240}ms，超出閾值 (${alertThresholds.highLatencyMs}ms)。`
          : `Source [OpenPhish Global] latency is ${alertThresholds.highLatencyMs + 240}ms, exceeding threshold (${alertThresholds.highLatencyMs}ms).`,
        severity: 'warning'
      });
      setLiveLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [ALERT-DISPATCH] [WARNING] Feed "OpenPhish Global" response time (${alertThresholds.highLatencyMs + 240}ms) exceeded high latency threshold (${alertThresholds.highLatencyMs}ms).`,
        ...prev.slice(0, 49)
      ]);
    }
  };

  // Import / Export Modal State & Restore Handler
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  const handleImportFeeds = (
    importedFeeds: ThreatFeed[],
    importedAlerts: ThreatIntelAlertThresholds | null,
    mode: 'merge' | 'overwrite'
  ) => {
    if (mode === 'overwrite') {
      setFeeds(importedFeeds);
      const logMsg = `[${new Date().toLocaleTimeString()}] [RESTORE-OVERWRITE] Replaced all threat intel feeds with ${importedFeeds.length} feeds from backup.`;
      setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
    } else {
      // Merge mode
      setFeeds(prevFeeds => {
        const existingMap = new Map(prevFeeds.map(f => [f.id, f]));
        let updatedCount = 0;
        let newCount = 0;

        importedFeeds.forEach(newFeed => {
          if (existingMap.has(newFeed.id)) {
            existingMap.set(newFeed.id, { ...existingMap.get(newFeed.id)!, ...newFeed });
            updatedCount++;
          } else {
            existingMap.set(newFeed.id, newFeed);
            newCount++;
          }
        });

        const logMsg = `[${new Date().toLocaleTimeString()}] [RESTORE-MERGE] Merged ${importedFeeds.length} feeds (${updatedCount} updated, ${newCount} added). Total: ${existingMap.size}`;
        setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
        return Array.from(existingMap.values());
      });
    }

    if (importedAlerts) {
      setAlertThresholds(importedAlerts);
      localStorage.setItem('taxii_alert_thresholds_v1', JSON.stringify(importedAlerts));
      const logMsg = `[${new Date().toLocaleTimeString()}] [RESTORE-ALERTS] Restored alert policy from backup (failures: ${importedAlerts.maxFailedAttempts}x, latency: ${importedAlerts.highLatencyMs}ms).`;
      setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
    }

    setToastNotification({
      id: `import-${Date.now()}`,
      title: isZh ? '情資來源設定已成功還原' : 'Threat Feeds Restored Successfully',
      message: isZh 
        ? `成功以「${mode === 'overwrite' ? '完全覆蓋' : '合併新增'}」模式還原 ${importedFeeds.length} 個情資來源${importedAlerts ? '與告警規則' : ''}。`
        : `Successfully restored ${importedFeeds.length} feeds (${mode === 'overwrite' ? 'Overwrite' : 'Merge'})${importedAlerts ? ' and alert policies' : ''}.`,
      severity: 'success'
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState<'All' | TaxiiProtocol>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [autoRefreshFilter, setAutoRefreshFilter] = useState<'All' | 'enabled' | 'disabled'>('All');

  // Modal / Drawer states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<ThreatFeed | null>(null);
  const [inspectingFeed, setInspectingFeed] = useState<ThreatFeed | null>(null);
  const [showTerminalDrawer, setShowTerminalDrawer] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] TAXII Daemon initialized. Protocol engine v2.1 ready.`,
    `[${new Date().toLocaleTimeString()}] Registered STIX/TAXII threat intelligence feeds with real-time health telemetry.`,
    `[${new Date().toLocaleTimeString()}] Scheduler heartbeat active. Auto-refresh loop configured with HTTP response & ingestion probes.`
  ]);

  // Bulk sync state
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Add/Edit Form State
  const [formData, setFormData] = useState<Partial<ThreatFeed>>({
    name: '',
    provider: '',
    description: '',
    protocol: 'TAXII 2.1',
    discoveryUrl: '',
    apiRoot: '/taxii2/',
    collectionId: '',
    collectionTitle: '',
    authType: 'none',
    authConfig: {
      apiKey: '',
      headerName: 'Authorization',
      username: '',
      password: '',
      clientCertName: ''
    },
    autoRefresh: true,
    refreshIntervalMinutes: 15,
    pollMode: 'incremental',
    iocTypes: ['ipv4', 'domain', 'url', 'file_hash', 'cve'],
    confidenceThreshold: 75,
    tlpCeiling: 'TLP:AMBER',
    autoEnforceBlocklist: true,
    verifySsl: true,
    tags: ['Custom-Feed'],
    customAlertThresholds: {
      enabled: false,
      maxFailedAttempts: 2,
      highLatencyMs: 800
    }
  });

  // Test connection state in modal
  const [testConnStatus, setTestConnStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testConnMessage, setTestConnMessage] = useState<string>('');
  const [discoveredCollections, setDiscoveredCollections] = useState<Array<{ id: string; title: string; canRead: boolean }>>([]);
  const [isDiscoveringCollections, setIsDiscoveringCollections] = useState(false);

  // Active Tab within Add/Edit Modal
  const [modalTab, setModalTab] = useState<'general' | 'auth' | 'refresh' | 'filters' | 'alerts'>('general');

  // Persistence
  useEffect(() => {
    localStorage.setItem('taxii_threat_feeds_v3', JSON.stringify(feeds));
  }, [feeds]);

  // Countdown timer effect with real-time telemetry jitter
  useEffect(() => {
    const timer = setInterval(() => {
      setFeeds(prevFeeds => 
        prevFeeds.map(feed => {
          if (!feed.autoRefresh || feed.status === 'paused' || feed.status === 'syncing') {
            return feed;
          }
          if (feed.nextSyncCountdownSeconds <= 1) {
            // Trigger background auto sync simulation with telemetry update
            const newCount = feed.indicatorCount + Math.floor(Math.random() * 12) + 1;
            const jitterLatency = feed.status === 'error' 
              ? Math.floor(Math.random() * 200) + 1200
              : feed.status === 'warning'
              ? Math.floor(Math.random() * 100) + 500
              : Math.floor(Math.random() * 60) + 70;
            const logMsg = `[${new Date().toLocaleTimeString()}] [AUTO-SYNC] Polled "${feed.name}" (${feed.protocol}) -> Ingested STIX 2.1 observables. Total: ${newCount.toLocaleString()} (RTT: ${jitterLatency}ms)`;
            setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
            return {
              ...feed,
              lastSyncTime: '剛剛 (Just now)',
              lastSyncTimestamp: Date.now(),
              nextSyncCountdownSeconds: feed.refreshIntervalMinutes * 60,
              indicatorCount: newCount,
              latencyMs: jitterLatency,
              ingestedInLastSync: Math.floor(Math.random() * 12) + 1
            };
          }
          return {
            ...feed,
            nextSyncCountdownSeconds: feed.nextSyncCountdownSeconds - 1
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filtered feeds with name, URL, active state, and health status level matching
  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      // Name or URL matching (primary filter criteria)
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query || 
        feed.name.toLowerCase().includes(query) ||
        feed.discoveryUrl.toLowerCase().includes(query) ||
        feed.provider.toLowerCase().includes(query) ||
        feed.collectionId.toLowerCase().includes(query) ||
        feed.tags.some(t => t.toLowerCase().includes(query));

      // Active feeds filter (active or syncing state)
      const matchActive = !activeOnlyFilter || (feed.status === 'active' || feed.status === 'syncing');

      const matchProtocol = protocolFilter === 'All' || feed.protocol === protocolFilter;
      
      // Check standard status, computeFeedHealth level, or alert breach
      const healthInfo = computeFeedHealth(feed, isZh);
      const isAlerting = activeAlerts.some(a => a.feedId === feed.id);
      const matchStatus = 
        statusFilter === 'All' || 
        (statusFilter === 'active' ? (feed.status === 'active' || feed.status === 'syncing') :
         statusFilter === 'alerting' ? isAlerting : 
         (feed.status === statusFilter || healthInfo.level === statusFilter));

      const matchAutoRefresh = 
        autoRefreshFilter === 'All' || 
        (autoRefreshFilter === 'enabled' ? feed.autoRefresh : !feed.autoRefresh);

      return matchSearch && matchActive && matchProtocol && matchStatus && matchAutoRefresh;
    });
  }, [feeds, searchQuery, activeOnlyFilter, protocolFilter, statusFilter, autoRefreshFilter, activeAlerts, isZh]);

  // Aggregate statistics including real-time health indicator distribution
  const stats = useMemo(() => {
    const totalFeeds = feeds.length;
    const activeFeeds = feeds.filter(f => f.status === 'active' || f.status === 'syncing').length;
    const totalIndicators = feeds.reduce((sum, f) => sum + f.indicatorCount, 0);
    const totalCorrelationHits = feeds.reduce((sum, f) => sum + f.correlationHitsCount, 0);
    const autoRefreshCount = feeds.filter(f => f.autoRefresh).length;

    // Health distribution
    const healthSummary = {
      optimal: feeds.filter(f => computeFeedHealth(f, isZh).level === 'optimal').length,
      moderate: feeds.filter(f => computeFeedHealth(f, isZh).level === 'moderate').length,
      degraded: feeds.filter(f => computeFeedHealth(f, isZh).level === 'degraded').length,
      error: feeds.filter(f => computeFeedHealth(f, isZh).level === 'error').length,
      paused: feeds.filter(f => f.status === 'paused').length
    };

    return {
      totalFeeds,
      activeFeeds,
      totalIndicators,
      totalCorrelationHits,
      autoRefreshCount,
      healthSummary
    };
  }, [feeds, isZh]);

  // Format seconds into mm:ss or hh:mm:ss
  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Ping individual feed for real-time latency & ingestion probe
  const handlePingFeed = (feedId: string) => {
    setFeeds(prev => prev.map(f => {
      if (f.id === feedId) {
        let newLatency = f.latencyMs;
        let newRate = f.ingestionSuccessRate ?? 100;
        let newHttp = f.httpStatusCode ?? 200;

        if (f.status === 'error') {
          newLatency = Math.floor(Math.random() * 200) + 1220;
          newHttp = 504;
          newRate = 0;
        } else if (f.status === 'warning') {
          newLatency = Math.floor(Math.random() * 120) + 510;
          newHttp = 206;
          newRate = Math.floor(Math.random() * 6) + 88;
        } else {
          const base = f.latencyMs < 200 ? 75 : 240;
          newLatency = Math.floor(Math.random() * 45) + base;
          newHttp = 200;
          newRate = 100;
        }

        const logMsg = `[${new Date().toLocaleTimeString()}] [PING-PROBE] "${f.name}" -> HTTP ${newHttp} | RTT: ${newLatency}ms | Ingestion: ${newRate}%`;
        setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);

        return {
          ...f,
          latencyMs: newLatency,
          httpStatusCode: newHttp,
          ingestionSuccessRate: newRate
        };
      }
      return f;
    }));
  };

  // Simulate specific health state to demonstrate real-time badge color transition
  const handleSimulateFeedState = (feedId: string, level: 'optimal' | 'moderate' | 'degraded' | 'error') => {
    setFeeds(prev => prev.map(f => {
      if (f.id === feedId) {
        let updated: Partial<ThreatFeed> = {};
        if (level === 'optimal') {
          updated = {
            status: 'active',
            latencyMs: Math.floor(Math.random() * 40) + 75,
            httpStatusCode: 200,
            ingestionSuccessRate: 100,
            droppedCount: 0,
            lastErrorMessage: undefined
          };
        } else if (level === 'moderate') {
          updated = {
            status: 'active',
            latencyMs: Math.floor(Math.random() * 80) + 260,
            httpStatusCode: 200,
            ingestionSuccessRate: 99.2,
            droppedCount: 0,
            lastErrorMessage: undefined
          };
        } else if (level === 'degraded') {
          updated = {
            status: 'warning',
            latencyMs: Math.floor(Math.random() * 150) + 520,
            httpStatusCode: 206,
            ingestionSuccessRate: 88.5,
            droppedCount: 7,
            lastErrorMessage: 'Rate limit threshold reached (HTTP 206/429 partial content).'
          };
        } else if (level === 'error') {
          updated = {
            status: 'error',
            latencyMs: Math.floor(Math.random() * 250) + 1300,
            httpStatusCode: 504,
            ingestionSuccessRate: 0,
            droppedCount: 45,
            lastErrorMessage: 'Gateway Timeout: Remote TAXII server took >1200ms and timed out.'
          };
        }

        const logMsg = `[${new Date().toLocaleTimeString()}] [SIMULATE-HEALTH] "${f.name}" transition to [${level.toUpperCase()}] -> Latency: ${updated.latencyMs}ms, HTTP ${updated.httpStatusCode}, Ingestion: ${updated.ingestionSuccessRate}%`;
        setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);

        return {
          ...f,
          ...updated
        };
      }
      return f;
    }));
  };

  // Diagnostic probe across all threat feeds simultaneously
  const handleProbeAllFeeds = () => {
    setIsProbingAllFeeds(true);
    setLiveLogs(l => [
      `[${new Date().toLocaleTimeString()}] [DIAGNOSTIC-PROBE] Initiating simultaneous HTTP health probe across all ${feeds.length} TAXII endpoints...`,
      ...l.slice(0, 49)
    ]);

    setTimeout(() => {
      setFeeds(prev => prev.map(f => {
        let newLatency = f.latencyMs;
        let newHttp = f.httpStatusCode ?? 200;
        let newRate = f.ingestionSuccessRate ?? 100;

        if (f.status === 'error') {
          newLatency = Math.floor(Math.random() * 200) + 1220;
          newHttp = 504;
          newRate = 0;
        } else if (f.status === 'warning') {
          newLatency = Math.floor(Math.random() * 120) + 510;
          newHttp = 206;
          newRate = Math.floor(Math.random() * 6) + 88;
        } else if (f.status === 'paused') {
          newLatency = f.latencyMs;
        } else {
          const base = f.latencyMs < 200 ? 70 : 220;
          newLatency = Math.floor(Math.random() * 45) + base;
          newHttp = 200;
          newRate = 100;
        }

        return {
          ...f,
          latencyMs: newLatency,
          httpStatusCode: newHttp,
          ingestionSuccessRate: newRate,
          lastSyncTime: isZh ? '剛剛探測 (Probed just now)' : 'Probed just now'
        };
      }));

      setIsProbingAllFeeds(false);
      setLiveLogs(l => [
        `[${new Date().toLocaleTimeString()}] [DIAGNOSTIC-PROBE-DONE] Probe finished. Endpoints RTT latencies and health states refreshed.`,
        ...l.slice(0, 49)
      ]);
    }, 600);
  };

  // Quick filter handler from FeedStatusOverviewWidget
  const handleSelectOverviewFilter = (filter: 'All' | 'active' | 'error' | 'alerting' | 'optimal' | 'moderate' | 'degraded') => {
    if (filter === 'active') {
      setActiveOnlyFilter(prev => !prev);
      setStatusFilter('All');
    } else {
      setActiveOnlyFilter(false);
      setStatusFilter(prev => prev === filter ? 'All' : filter);
    }
  };

  // Trigger individual manual sync
  const handleSyncFeed = (feedId: string) => {
    const target = feeds.find(f => f.id === feedId);
    if (!target) return;

    setFeeds(prev => prev.map(f => f.id === feedId ? { ...f, status: 'syncing' } : f));
    const startMsg = `[${new Date().toLocaleTimeString()}] [TAXII-POLL] Initiating incremental STIX 2.1 poll for "${target.name}" at ${target.discoveryUrl}`;
    setLiveLogs(l => [startMsg, ...l.slice(0, 49)]);

    setTimeout(() => {
      // If feed was in error state, test recovery or simulated error
      if (target.status === 'error') {
        const recover = Math.random() > 0.5;
        if (!recover) {
          const timeoutLatency = Math.floor(Math.random() * 200) + 1320;
          setFeeds(prev => prev.map(f => f.id === feedId ? {
            ...f,
            status: 'error',
            lastSyncTime: '剛剛失敗 (Failed just now)',
            lastSyncTimestamp: Date.now(),
            latencyMs: timeoutLatency,
            httpStatusCode: 504,
            ingestionSuccessRate: 0,
            droppedCount: 48
          } : f));
          const failMsg = `[${new Date().toLocaleTimeString()}] [POLL-ERROR] ${target.name} [HTTP 504 Gateway Timeout] Ingestion failed (Latency: ${timeoutLatency}ms)`;
          setLiveLogs(l => [failMsg, ...l.slice(0, 49)]);
          return;
        }
      }

      const addedIocs = Math.floor(Math.random() * 45) + 8;
      const latency = Math.floor(Math.random() * 80) + 65;
      setFeeds(prev => prev.map(f => {
        if (f.id === feedId) {
          return {
            ...f,
            status: 'active',
            lastSyncTime: '剛剛 (Just now)',
            lastSyncTimestamp: Date.now(),
            nextSyncCountdownSeconds: f.refreshIntervalMinutes * 60,
            indicatorCount: f.indicatorCount + addedIocs,
            latencyMs: latency,
            httpStatusCode: 200,
            ingestionSuccessRate: 100,
            ingestedInLastSync: addedIocs,
            droppedCount: 0,
            lastErrorMessage: undefined
          };
        }
        return f;
      }));

      const completeMsg = `[${new Date().toLocaleTimeString()}] [POLL-SUCCESS] ${target.name} [HTTP 200 OK] Received STIX bundle (${addedIocs} new observables ingested, latency: ${latency}ms, 100% Ingestion Rate)`;
      setLiveLogs(l => [completeMsg, ...l.slice(0, 49)]);
    }, 1200);
  };

  // Toggle pause/active
  const handleTogglePause = (feedId: string) => {
    if (isReadOnly) return;
    setFeeds(prev => prev.map(f => {
      if (f.id === feedId) {
        const nextStatus = f.status === 'paused' ? 'active' : 'paused';
        const logMsg = `[${new Date().toLocaleTimeString()}] Feed "${f.name}" status transitioned to: ${nextStatus.toUpperCase()}`;
        setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
        return { ...f, status: nextStatus };
      }
      return f;
    }));
  };

  // Toggle auto-refresh toggle switch
  const handleToggleAutoRefresh = (feedId: string) => {
    if (isReadOnly) return;
    setFeeds(prev => prev.map(f => {
      if (f.id === feedId) {
        const nextVal = !f.autoRefresh;
        return {
          ...f,
          autoRefresh: nextVal,
          nextSyncCountdownSeconds: nextVal ? f.refreshIntervalMinutes * 60 : 0
        };
      }
      return f;
    }));
  };

  // Delete feed
  const handleDeleteFeed = (feedId: string) => {
    if (isReadOnly) return;
    const target = feeds.find(f => f.id === feedId);
    if (window.confirm(isZh ? `確定要移除情資來源 "${target?.name}" 嗎？` : `Are you sure you want to remove threat feed "${target?.name}"?`)) {
      setFeeds(prev => prev.filter(f => f.id !== feedId));
      const logMsg = `[${new Date().toLocaleTimeString()}] Removed threat feed: ${target?.name}`;
      setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
    }
  };

  // Bulk sync all feeds
  const handleSyncAllFeeds = () => {
    setIsBulkSyncing(true);
    setSyncProgress(10);
    const startMsg = `[${new Date().toLocaleTimeString()}] [BULK-SYNC] Initiating parallel poll across ${feeds.length} STIX/TAXII threat feeds...`;
    setLiveLogs(l => [startMsg, ...l.slice(0, 49)]);

    setFeeds(prev => prev.map(f => ({ ...f, status: 'syncing' })));

    let progress = 10;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setSyncProgress(100);
        setTimeout(() => {
          setIsBulkSyncing(false);
          setFeeds(prev => prev.map(f => {
            const isCritical = f.id === 'feed-shadowserver-critical';
            const isWarn = f.id === 'feed-openphish-warning';
            return {
              ...f,
              status: isCritical ? 'error' : isWarn ? 'warning' : 'active',
              lastSyncTime: '剛剛 (Just now)',
              lastSyncTimestamp: Date.now(),
              nextSyncCountdownSeconds: f.refreshIntervalMinutes * 60,
              indicatorCount: isCritical ? f.indicatorCount : f.indicatorCount + Math.floor(Math.random() * 50) + 10,
              latencyMs: isCritical ? 1340 : isWarn ? 540 : Math.floor(Math.random() * 70) + 75,
              httpStatusCode: isCritical ? 504 : isWarn ? 206 : 200,
              ingestionSuccessRate: isCritical ? 0 : isWarn ? 89.5 : 100,
              ingestedInLastSync: isCritical ? 0 : isWarn ? 22 : Math.floor(Math.random() * 50) + 10,
              droppedCount: isCritical ? 55 : isWarn ? 6 : 0
            };
          }));
          const finishMsg = `[${new Date().toLocaleTimeString()}] [BULK-SYNC-COMPLETE] Successfully synchronized all STIX/TAXII threat feeds with refreshed health telemetry.`;
          setLiveLogs(l => [finishMsg, ...l.slice(0, 49)]);
        }, 500);
      } else {
        setSyncProgress(progress);
      }
    }, 400);
  };

  // Apply Preset
  const handleSelectPreset = (presetName: string) => {
    const preset = PRESET_FEEDS.find(p => p.name === presetName);
    if (!preset) return;

    setFormData({
      ...formData,
      name: preset.name,
      provider: preset.provider,
      protocol: preset.protocol,
      discoveryUrl: preset.discoveryUrl,
      apiRoot: preset.apiRoot,
      collectionId: preset.collectionId,
      collectionTitle: preset.collectionTitle,
      authType: preset.authType,
      refreshIntervalMinutes: preset.refreshIntervalMinutes,
      description: preset.description,
      iocTypes: preset.iocTypes,
      tlpCeiling: preset.tlpCeiling,
      tags: [preset.provider.split(' ')[0], 'STIX2.1', 'Feed']
    });

    setTestConnStatus('idle');
    setTestConnMessage('');
  };

  // Test TAXII Connection
  const handleTestConnection = () => {
    setTestConnStatus('testing');
    setTestConnMessage(isZh ? '正在發起 TAXII 2.1 探索握手與 TLS 憑證驗證...' : 'Initiating TAXII 2.1 discovery handshake and TLS verification...');

    setTimeout(() => {
      if (!formData.discoveryUrl || !formData.discoveryUrl.startsWith('http')) {
        setTestConnStatus('error');
        setTestConnMessage(isZh ? '連線失敗: 請提供有效的 HTTP/HTTPS Discovery URL 端點' : 'Connection failed: Please specify a valid HTTP/HTTPS Discovery URL');
        return;
      }

      setTestConnStatus('success');
      setTestConnMessage(
        isZh 
          ? `連線成功: [HTTP 200 OK] 協定 ${formData.protocol} 通訊正常，延遲 118ms。發現 3 個可用 STIX 集合。`
          : `Connected successfully: [HTTP 200 OK] Protocol ${formData.protocol} verified, latency 118ms. 3 STIX collections identified.`
      );

      // Populate mock discovered collections
      setDiscoveredCollections([
        { id: formData.collectionId || 'primary-collection', title: formData.collectionTitle || 'Primary Curated Feed', canRead: true },
        { id: 'urgent-zero-days-v2', title: 'High-Velocity Zero-Day Flash IoCs', canRead: true },
        { id: 'ransomware-infrastructure-pulses', title: 'Ransomware C2 & Payment Infrastructure', canRead: true }
      ]);
    }, 1200);
  };

  // Discover Collections Button
  const handleDiscoverCollections = () => {
    setIsDiscoveringCollections(true);
    setTimeout(() => {
      setIsDiscoveringCollections(false);
      setDiscoveredCollections([
        { id: 'indicators-all-subscribers', title: 'All Subscribers Threat Indicators', canRead: true },
        { id: 'c2-infrastructure-stream', title: 'Active Command & Control Nodes', canRead: true },
        { id: 'phishing-credential-domains', title: 'Spearphishing & Credential Harvesters', canRead: true },
        { id: 'malware-sha256-hashes', title: 'High Confidence Malware Binaries (SHA256)', canRead: true }
      ]);
    }, 900);
  };

  // Save / Update Feed
  const handleSaveFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formData.name || !formData.discoveryUrl) {
      alert(isZh ? '請填寫情資來源名稱與 Discovery URL' : 'Please provide Feed Name and Discovery URL');
      return;
    }

    if (editingFeed) {
      // Update
      setFeeds(prev => prev.map(f => {
        if (f.id === editingFeed.id) {
          return {
            ...f,
            ...formData,
            id: editingFeed.id,
            nextSyncCountdownSeconds: (formData.refreshIntervalMinutes || 15) * 60
          } as ThreatFeed;
        }
        return f;
      }));
      const logMsg = `[${new Date().toLocaleTimeString()}] Updated configuration for threat feed: "${formData.name}"`;
      setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
    } else {
      // Add New
      const newFeed: ThreatFeed = {
        id: `feed-custom-${Date.now()}`,
        name: formData.name || 'Custom STIX/TAXII Feed',
        provider: formData.provider || 'External CTI Provider',
        description: formData.description || 'Configured external STIX/TAXII threat intelligence pipeline.',
        protocol: formData.protocol || 'TAXII 2.1',
        discoveryUrl: formData.discoveryUrl || '',
        apiRoot: formData.apiRoot || '/taxii2/',
        collectionId: formData.collectionId || 'default-collection',
        collectionTitle: formData.collectionTitle || 'Standard Observable Collection',
        authType: formData.authType || 'none',
        authConfig: formData.authConfig || {},
        autoRefresh: formData.autoRefresh ?? true,
        refreshIntervalMinutes: formData.refreshIntervalMinutes || 15,
        pollMode: formData.pollMode || 'incremental',
        iocTypes: formData.iocTypes || ['ipv4', 'domain', 'url', 'file_hash'],
        confidenceThreshold: formData.confidenceThreshold || 75,
        tlpCeiling: formData.tlpCeiling || 'TLP:AMBER',
        autoEnforceBlocklist: formData.autoEnforceBlocklist ?? true,
        verifySsl: formData.verifySsl ?? true,
        status: 'active',
        lastSyncTime: '剛剛建立 (Just Created)',
        lastSyncTimestamp: Date.now(),
        nextSyncCountdownSeconds: (formData.refreshIntervalMinutes || 15) * 60,
        indicatorCount: Math.floor(Math.random() * 5000) + 1200,
        correlationHitsCount: 0,
        latencyMs: 110,
        tags: formData.tags?.length ? formData.tags : ['Custom-TAXII'],
        sampleIndicators: [
          {
            id: `indicator--${Date.now()}-1`,
            type: 'ipv4',
            value: '203.0.113.195',
            pattern: "[ipv4-addr:value = '203.0.113.195']",
            confidence: 85,
            validFrom: new Date().toISOString(),
            tlp: formData.tlpCeiling || 'TLP:AMBER',
            threatActor: 'Generic Threat Actor',
            mitreTechnique: 'T1071 - Standard Application Layer Protocol',
            description: 'Suspicious IP address identified by newly connected TAXII feed.'
          }
        ]
      };
      setFeeds(prev => [newFeed, ...prev]);
      const logMsg = `[${new Date().toLocaleTimeString()}] Registered new STIX/TAXII threat feed: "${newFeed.name}" (${newFeed.protocol})`;
      setLiveLogs(l => [logMsg, ...l.slice(0, 49)]);
    }

    setIsAddModalOpen(false);
    setEditingFeed(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (feed: ThreatFeed) => {
    setEditingFeed(feed);
    setFormData({ ...feed });
    setTestConnStatus('idle');
    setTestConnMessage('');
    setModalTab('general');
    setIsAddModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingFeed(null);
    setFormData({
      name: '',
      provider: '',
      description: '',
      protocol: 'TAXII 2.1',
      discoveryUrl: '',
      apiRoot: '/taxii2/',
      collectionId: '',
      collectionTitle: '',
      authType: 'none',
      authConfig: {
        apiKey: '',
        headerName: 'Authorization',
        username: '',
        password: '',
        clientCertName: ''
      },
      autoRefresh: true,
      refreshIntervalMinutes: 15,
      pollMode: 'incremental',
      iocTypes: ['ipv4', 'domain', 'url', 'file_hash', 'cve'],
      confidenceThreshold: 75,
      tlpCeiling: 'TLP:AMBER',
      autoEnforceBlocklist: true,
      verifySsl: true,
      tags: ['New-Feed']
    });
    setTestConnStatus('idle');
    setTestConnMessage('');
    setDiscoveredCollections([]);
    setModalTab('general');
    setIsAddModalOpen(true);
  };

  // Export JSON Config
  const handleExportConfig = () => {
    const configData = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'Semor Unified Threat Control',
      feeds: feeds.map(f => ({
        ...f,
        authConfig: {
          ...f.authConfig,
          apiKey: f.authConfig.apiKey ? '***REDACTED***' : undefined,
          password: f.authConfig.password ? '***REDACTED***' : undefined
        }
      }))
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat_intel_sources_config_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {isZh ? '威脅情資來源 (Threat Intel Sources)' : 'Threat Intel Sources (STIX / TAXII)'}
                  </h2>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-full uppercase">
                    STIX 2.1 & TAXII 2.1
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isZh 
                    ? '配置外部 STIX 2.0/2.1 與 TAXII 1.1/2.0/2.1 威脅情資饋送端點、自動排程輪詢週期、驗證金鑰與 IoC 阻斷規則'
                    : 'Configure external STIX/TAXII threat feeds, auto-refresh polling intervals, authentication credentials, and IoC policy enforcement.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Alert Thresholds Settings Button */}
            <button
              id="alert-thresholds-btn"
              onClick={() => setIsAlertModalOpen(true)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
                activeAlerts.length > 0
                  ? "bg-amber-950/40 border-amber-500/60 text-amber-300 hover:bg-amber-900/50 shadow-md shadow-amber-950/40"
                  : "bg-gray-900/80 border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800"
              )}
              title={isZh ? '設定收錄失敗次數與高延遲告警閾值' : 'Configure Ingestion Failure and High Latency Alert Thresholds'}
            >
              <Bell size={14} className={cn(activeAlerts.length > 0 ? "text-amber-400 animate-bounce" : "text-gray-400")} />
              <span>{isZh ? '告警閾值設定' : 'Alert Thresholds'}</span>
              {activeAlerts.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[10px] font-black">
                  {activeAlerts.length}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 text-[10px] font-mono">
                  ≥{alertThresholds.maxFailedAttempts}x
                </span>
              )}
            </button>

            <button
              onClick={() => setShowTerminalDrawer(!showTerminalDrawer)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
                showTerminalDrawer
                  ? "bg-gray-800 border-blue-500 text-blue-400"
                  : "bg-gray-900/80 border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800"
              )}
              title="Toggle Live Ingestion Console"
            >
              <Terminal size={14} />
              <span>{isZh ? '即時輪詢日誌' : 'Live Ingestion Logs'}</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            </button>

            <button
              id="open-threat-intel-import-export-btn"
              onClick={() => setIsImportExportModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-blue-500/40 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all active:scale-95 shadow-sm"
              title={isZh ? '匯入或匯出情資來源與告警設定 (JSON)' : 'Import or Export Threat Intel Sources & Alert Policies (JSON)'}
            >
              <ArrowUpDown size={14} className="text-blue-400" />
              <span>{isZh ? '匯入 / 匯出' : 'Import / Export'}</span>
            </button>

            <button
              onClick={handleSyncAllFeeds}
              disabled={isBulkSyncing || isReadOnly}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border",
                isBulkSyncing
                  ? "bg-blue-900/30 border-blue-500/50 text-blue-300 cursor-wait"
                  : "bg-gray-900 hover:bg-gray-800 border-gray-700 text-white"
              )}
            >
              <RefreshCw size={14} className={cn(isBulkSyncing && "animate-spin text-blue-400")} />
              <span>{isBulkSyncing ? `${isZh ? '同步中' : 'Syncing'} (${syncProgress}%)` : (isZh ? '同步所有情資' : 'Sync All Feeds')}</span>
            </button>

            {!isReadOnly && (
              <button
                id="add-threat-intel-source-btn"
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-900/30 transition-all active:scale-95"
              >
                <Plus size={15} />
                <span>{isZh ? '新增情資來源' : 'Add Threat Source'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Ingestion Logs Drawer */}
        <AnimatePresence>
          {showTerminalDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-4 border-t border-gray-800/80 overflow-hidden"
            >
              <div className="bg-black/90 border border-gray-800 rounded-xl p-4 font-mono text-[11px] text-gray-300 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                  <span className="flex items-center gap-2">
                    <Terminal size={12} className="text-green-400" />
                    <span>STIX 2.1 / TAXII 2.1 INGESTION ENGINE LOG STREAM</span>
                  </span>
                  <button 
                    onClick={() => setLiveLogs([`[${new Date().toLocaleTimeString()}] Console logs cleared.`])} 
                    className="hover:text-gray-300 underline"
                  >
                    Clear
                  </button>
                </div>
                {liveLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed flex items-start gap-2">
                    <span className="text-gray-600 select-none">&gt;</span>
                    <span className={cn(
                      log.includes('POLL-SUCCESS') ? "text-green-400" :
                      log.includes('AUTO-SYNC') ? "text-blue-300" :
                      log.includes('ERROR') || log.includes('failed') ? "text-red-400" :
                      "text-gray-300"
                    )}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feed Status Overview Section */}
      <FeedStatusOverviewWidget
        feeds={feeds}
        activeAlerts={activeAlerts}
        isZh={isZh}
        activeFilter={statusFilter !== 'All' ? statusFilter : activeOnlyFilter ? 'active' : 'All'}
        onSelectFilter={handleSelectOverviewFilter}
        onProbeAllFeeds={handleProbeAllFeeds}
        isProbing={isProbingAllFeeds}
      />

      {/* Alert Notification Banner when active alerts exist */}
      {activeAlerts.length > 0 && !activeAlertBannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-red-950/40 via-amber-950/30 to-gray-950 border border-amber-500/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-amber-950/20"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 shrink-0 mt-0.5">
              <Bell size={18} className="animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isZh ? '威脅情資來源收錄與響應延遲告警通知' : 'Threat Feed Ingestion Alert Notice'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/30 text-red-300 border border-red-500/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  <span>{activeAlerts.length} {isZh ? '個來源超出設定閾值' : 'Feeds Breaching Limits'}</span>
                </span>
              </div>
              <div className="text-xs text-amber-200/90 mt-1 space-y-0.5">
                {activeAlerts.map(a => (
                  <div key={a.feedId} className="flex items-center gap-1.5">
                    <span className="font-bold text-white">• {a.feedName}:</span>
                    <span>{a.reasons.join(', ')}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400 font-mono">
                <span>{isZh ? '全域閾值' : 'Thresholds'}: {isZh ? '收錄失敗' : 'Failures'} ≥{alertThresholds.maxFailedAttempts}次 | {isZh ? '響應延遲' : 'Latency'} ≥{alertThresholds.highLatencyMs}ms</span>
                <span className="text-gray-600">|</span>
                <span>{isZh ? '推播管道' : 'Channels'}: {Object.keys(alertThresholds.notifyChannels).filter(k => alertThresholds.notifyChannels[k as keyof typeof alertThresholds.notifyChannels]).join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Sliders size={13} />
              <span>{isZh ? '調整告警閾值' : 'Configure Thresholds'}</span>
            </button>
            <button
              onClick={() => {
                activeAlerts.forEach(a => handlePingFeed(a.feedId));
              }}
              className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw size={13} />
              <span>{isZh ? '探測端點' : 'Probe Feeds'}</span>
            </button>
            <button
              onClick={() => setActiveAlertBannerDismissed(true)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title={isZh ? '忽略此通知' : 'Dismiss Alert'}
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-sm">
        {/* Search Input Container for filtering feeds by name or URL */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="threat-intel-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isZh ? '依情資名稱或 URL 篩選活躍來源 (Filter feeds by name or URL)...' : 'Filter active feeds by name or URL...'}
              className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                id="clear-search-query-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
                title={isZh ? '清除搜尋關鍵字' : 'Clear search query'}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Active Feeds Only Toggle */}
          <button
            id="toggle-active-feeds-filter-btn"
            type="button"
            onClick={() => setActiveOnlyFilter(!activeOnlyFilter)}
            className={cn(
              "flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 active:scale-95 select-none",
              activeOnlyFilter
                ? "bg-blue-600/25 border-blue-500 text-blue-300 shadow-sm shadow-blue-900/40 ring-1 ring-blue-500/30"
                : "bg-gray-900 hover:bg-gray-800/90 border-gray-800 text-gray-400 hover:text-gray-200"
            )}
            title={isZh ? '切換僅顯示活躍運作中的情資來源' : 'Toggle filter to show only active running feeds'}
          >
            <span className={cn("w-2 h-2 rounded-full", activeOnlyFilter ? "bg-blue-400 animate-pulse" : "bg-gray-500")} />
            <span>{isZh ? '僅活躍來源' : 'Active Feeds'}</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded text-[10px] font-mono",
              activeOnlyFilter ? "bg-blue-400/20 text-blue-200 font-bold" : "bg-gray-800 text-gray-400"
            )}>
              {stats.activeFeeds}
            </span>
          </button>
        </div>

        {/* Status, Protocol, and Auto-Refresh Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Result counter indicator */}
          <div className="text-[11px] font-mono text-gray-400 bg-gray-900/80 px-3 py-2 rounded-xl border border-gray-800 shrink-0 flex items-center gap-1.5">
            <span className="text-gray-500">{isZh ? '符合' : 'Showing'}:</span>
            <span className="font-bold text-white">{filteredFeeds.length}</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">{feeds.length}</span>
            {activeOnlyFilter && (
              <span className="text-[10px] text-blue-400 bg-blue-500/15 px-1 rounded ml-0.5">
                {isZh ? '活躍' : 'active'}
              </span>
            )}
          </div>

          {/* Protocol Filter */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '協定' : 'Proto'}:</span>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value as any)}
              className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer pr-1"
            >
              <option value="All">All Protocols</option>
              <option value="TAXII 2.1">TAXII 2.1</option>
              <option value="TAXII 2.0">TAXII 2.0</option>
              <option value="TAXII 1.1">TAXII 1.1</option>
              <option value="STIX 2.1 JSON">STIX 2.1 JSON</option>
              <option value="MISP REST">MISP REST</option>
            </select>
          </div>

          {/* Status & Health Filter */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '狀態' : 'Status'}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer pr-1"
            >
              <option value="All">{isZh ? '全部狀態 (All)' : 'All Health States'}</option>
              <option value="active">⚡ {isZh ? '活躍來源 (Active Feeds)' : 'Active Feeds Only'}</option>
              <option value="optimal">🟢 {isZh ? '最佳 (Optimal <200ms)' : 'Optimal (<200ms)'}</option>
              <option value="moderate">🟡 {isZh ? '良好 (Moderate 200~500ms)' : 'Moderate (200-500ms)'}</option>
              <option value="degraded">🟠 {isZh ? '降級 (Degraded 500~1000ms)' : 'Degraded (500-1000ms)'}</option>
              <option value="error">🔴 {isZh ? '嚴重異常 (Critical / Error)' : 'Critical / Error'}</option>
              <option value="syncing">🔄 {isZh ? '同步中 (Syncing)' : 'Syncing'}</option>
              <option value="paused">⏸️ {isZh ? '已暫停 (Paused)' : 'Paused'}</option>
            </select>
          </div>

          {/* Auto Refresh Filter */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '自動更新' : 'Auto-Sync'}:</span>
            <select
              value={autoRefreshFilter}
              onChange={(e) => setAutoRefreshFilter(e.target.value as any)}
              className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer pr-1"
            >
              <option value="All">All</option>
              <option value="enabled">Auto-Refresh On</option>
              <option value="disabled">Manual Only</option>
            </select>
          </div>

          {/* Clear all filters shortcut button */}
          {(searchQuery || activeOnlyFilter || protocolFilter !== 'All' || statusFilter !== 'All' || autoRefreshFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveOnlyFilter(false);
                setProtocolFilter('All');
                setStatusFilter('All');
                setAutoRefreshFilter('All');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1"
              title={isZh ? '重設所有搜尋與篩選條件' : 'Reset all search and filters'}
            >
              <X size={12} />
              <span>{isZh ? '重設' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Feed Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredFeeds.length === 0 ? (
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-12 text-center space-y-3">
            <Radio size={36} className="mx-auto text-gray-600 animate-pulse" />
            <p className="text-sm font-bold text-gray-300">
              {searchQuery
                ? (isZh ? `未找到符合名稱或 URL「${searchQuery}」的情資來源` : `No feeds matching name or URL "${searchQuery}".`)
                : (isZh ? '未找到符合條件的威脅情資來源' : 'No Threat Intel Feeds matching your filters.')}
            </p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {activeOnlyFilter 
                ? (isZh ? '目前已啟用「僅活躍來源」篩選。嘗試關閉活躍篩選或清除搜尋文字。' : 'Active-only filter is currently enabled. Try disabling it or clearing your search query.')
                : (isZh ? '請調整搜尋名稱、URL 關鍵字或清除篩選條件。' : 'Try searching a different feed name, URL, or clearing active filters.')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveOnlyFilter(false);
                setProtocolFilter('All');
                setStatusFilter('All');
                setAutoRefreshFilter('All');
              }}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              {isZh ? '重設所有搜尋與篩選條件' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          filteredFeeds.map((feed) => (
            <div 
              key={feed.id}
              className={cn(
                "bg-[#111114] border rounded-2xl p-5 transition-all relative overflow-hidden group hover:border-gray-700",
                feed.status === 'syncing' ? "border-blue-500/50 shadow-lg shadow-blue-950/20" :
                feed.status === 'paused' ? "border-gray-800/60 opacity-80" :
                feed.status === 'error' ? "border-red-500/40" :
                feed.status === 'warning' ? "border-amber-500/40" :
                "border-gray-800 hover:shadow-xl hover:shadow-black/40"
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      feed.protocol === 'TAXII 2.1' ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                      feed.protocol === 'TAXII 2.0' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" :
                      feed.protocol === 'TAXII 1.1' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                      feed.protocol === 'STIX 2.1 JSON' ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    )}>
                      {feed.protocol}
                    </span>

                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {feed.name}
                    </h3>

                    {/* Interactive Real-Time Status Indicator Badge */}
                    <FeedRealtimeHealthBadge
                      feed={feed}
                      showDetails={true}
                      onPing={() => handlePingFeed(feed.id)}
                      onSimulateState={(level) => handleSimulateFeedState(feed.id, level)}
                    />

                    {/* Alert Breached Pill */}
                    {(() => {
                      const feedAlert = activeAlerts.find(a => a.feedId === feed.id);
                      if (!feedAlert) return null;
                      return (
                        <button
                          onClick={() => setIsAlertModalOpen(true)}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 flex items-center gap-1 transition-all"
                          title={feedAlert.reasons.join(' | ')}
                        >
                          <Bell size={10} className="text-red-400 animate-bounce" />
                          <span>{isZh ? '告警觸發' : 'Alert Triggered'}</span>
                          {feed.consecutiveFailures !== undefined && feed.consecutiveFailures > 0 ? (
                            <span className="text-[9px] bg-red-950 px-1 rounded text-red-300 font-mono">
                              {feed.consecutiveFailures}x
                            </span>
                          ) : null}
                        </button>
                      );
                    })()}

                    {/* Auth Pill */}
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded flex items-center gap-1">
                      {feed.authType === 'none' ? <Globe size={11} className="text-gray-500" /> : <Lock size={11} className="text-yellow-400" />}
                      <span className="capitalize">{feed.authType.replace('_', ' ')}</span>
                    </span>

                    {/* TLP Floor */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-300">
                      {feed.tlpCeiling}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-1 max-w-3xl">
                    {feed.description}
                  </p>

                  {/* Discovery URL & Collection display */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Server size={12} className="text-gray-600" />
                      <span className="text-gray-400 truncate max-w-xs sm:max-w-md">{feed.discoveryUrl}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers size={12} className="text-gray-600" />
                      <span className="text-blue-400">{feed.collectionId}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Auto-Refresh interval badge & sync status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 border-t lg:border-t-0 border-gray-800/80 pt-3 lg:pt-0">
                  {/* Auto-Refresh Control */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className={feed.autoRefresh ? "text-cyan-400" : "text-gray-500"} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {isZh ? '自動輪詢間隔' : 'Auto-Refresh'}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-gray-200">
                          {feed.refreshIntervalMinutes >= 60 
                            ? `${feed.refreshIntervalMinutes / 60} ${isZh ? '小時' : 'hr'}`
                            : `${feed.refreshIntervalMinutes} ${isZh ? '分鐘' : 'min'}`}
                        </span>
                        {feed.autoRefresh && (
                          <span className="text-[10px] font-mono text-cyan-400" title="Next scheduled poll">
                            ({formatCountdown(feed.nextSyncCountdownSeconds)})
                          </span>
                        )}
                      </div>
                    </div>

                    {!isReadOnly && (
                      <button
                        onClick={() => handleToggleAutoRefresh(feed.id)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          feed.autoRefresh ? "bg-cyan-500" : "bg-gray-700"
                        )}
                        title={feed.autoRefresh ? "Disable Auto-Refresh" : "Enable Auto-Refresh"}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            feed.autoRefresh ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Indicators Count Badge */}
                  <div className="text-right min-w-[100px]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      {isZh ? '已接收指標' : 'Observables'}
                    </span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {feed.indicatorCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {feed.lastSyncTime}
                    </span>
                  </div>

                  {/* Operational Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Real-time Probe Ping Button */}
                    <button
                      onClick={() => handlePingFeed(feed.id)}
                      className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-blue-500/50 rounded-lg text-gray-400 hover:text-blue-400 transition-all active:scale-95"
                      title={isZh ? '即時探測連線延遲與收錄率 (Probe Health)' : 'Probe HTTP RTT & Health Telemetry'}
                    >
                      <Activity size={14} />
                    </button>

                    <button
                      onClick={() => handleSyncFeed(feed.id)}
                      disabled={feed.status === 'syncing' || isReadOnly}
                      className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 transition-all active:scale-95 disabled:opacity-50"
                      title={isZh ? '立即觸發輪詢 (Sync Now)' : 'Poll Feed Now'}
                    >
                      <RefreshCw size={14} className={cn(feed.status === 'syncing' && "animate-spin text-blue-400")} />
                    </button>

                    <button
                      onClick={() => setInspectingFeed(feed)}
                      className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-300 hover:text-cyan-400 transition-all active:scale-95"
                      title={isZh ? '檢視 STIX 2.1 指標物件 (Inspect IoCs)' : 'Inspect STIX 2.1 Indicators'}
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      onClick={() => {
                        handleOpenEdit(feed);
                        setModalTab('alerts');
                      }}
                      className={cn(
                        "p-2 rounded-lg border transition-all active:scale-95",
                        activeAlerts.some(a => a.feedId === feed.id)
                          ? "bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/50"
                          : "bg-gray-900 hover:bg-gray-800 border-gray-800 text-gray-400 hover:text-amber-400"
                      )}
                      title={isZh ? '設定此來源專屬告警閾值' : 'Configure Custom Alert Thresholds'}
                    >
                      <Bell size={14} className={cn(activeAlerts.some(a => a.feedId === feed.id) && "text-amber-400 animate-bounce")} />
                    </button>

                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => handleTogglePause(feed.id)}
                          className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-300 hover:text-yellow-400 transition-all active:scale-95"
                          title={feed.status === 'paused' ? (isZh ? '恢復運作' : 'Resume Feed') : (isZh ? '暫停饋送' : 'Pause Feed')}
                        >
                          {feed.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(feed)}
                          className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-300 hover:text-white transition-all active:scale-95"
                          title={isZh ? '編輯情資饋送設定' : 'Edit Feed Settings'}
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteFeed(feed.id)}
                          className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-500/50 rounded-lg text-gray-400 hover:text-red-400 transition-all active:scale-95"
                          title={isZh ? '刪除情資來源' : 'Delete Feed'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Real-time Health Telemetry Bar (HTTP Response + Ingestion Success) */}
              <div className="mt-4 pt-3 border-t border-gray-800/60">
                <InCardTelemetryBar feed={feed} />
              </div>

              {/* Ingestion Filters Pill Ribbon */}
              <div className="mt-3 pt-2.5 border-t border-gray-800/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '接收類型' : 'Types'}:</span>
                  {feed.iocTypes.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-gray-900/80 border border-gray-800/90 text-gray-300 rounded text-[10px] font-mono uppercase">
                      {t.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-gray-500 text-[10px] font-mono">
                  <span>Min Confidence: <strong className="text-blue-400">{feed.confidenceThreshold}%</strong></span>
                  {feed.autoEnforceBlocklist && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck size={12} />
                      <span>{isZh ? '自動推播防火牆/NDR' : 'Auto-Enforce Blocklist'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Threat Feed Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <Radio size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingFeed 
                        ? (isZh ? `編輯情資來源: ${editingFeed.name}` : `Configure Feed: ${editingFeed.name}`)
                        : (isZh ? '新增 STIX/TAXII 外部威脅情資來源' : 'Add STIX/TAXII Threat Intelligence Feed')}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isZh ? '設定 TAXII 2.1 探索端點、自動輪詢週期與情資過濾條件' : 'Configure TAXII 2.1 discovery service, auto-refresh cadence, and IoC filters.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Preset selector bar (only when adding) */}
              {!editingFeed && (
                <div className="px-6 py-3 bg-blue-950/20 border-b border-blue-900/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-blue-300 font-bold">
                    <Zap size={14} className="text-blue-400" />
                    <span>{isZh ? '載入預設熱門情資來源範本:' : 'Quick Presets:'}</span>
                  </div>
                  <select
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="bg-gray-900 border border-blue-500/30 text-xs text-blue-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>-- {isZh ? '選擇情資範本' : 'Select a preset feed'} --</option>
                    {PRESET_FEEDS.map(p => (
                      <option key={p.name} value={p.name}>{p.name} ({p.protocol})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Modal Subtabs */}
              <div className="px-6 pt-3 bg-gray-900/40 border-b border-gray-800 flex items-center gap-2 overflow-x-auto">
                {[
                  { id: 'general', label: isZh ? '基本端點與協定' : 'General & Protocol', icon: Server },
                  { id: 'auth', label: isZh ? '安全認證憑證' : 'Authentication', icon: Lock },
                  { id: 'refresh', label: isZh ? '自動更新週期' : 'Auto-Refresh & Polling', icon: Clock },
                  { id: 'filters', label: isZh ? '指標篩選與阻斷' : 'IoC Filters & Policy', icon: Sliders },
                  { id: 'alerts', label: isZh ? '告警閾值' : 'Alert Thresholds', icon: Bell }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setModalTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all",
                      modalTab === tab.id
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <tab.icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveFeed} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {/* Tab 1: General & Protocol */}
                {modalTab === 'general' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '情資來源名稱 *' : 'Feed Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. CISA AIS STIX 2.1 Threat Stream"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '提供組織 / Vendor' : 'Provider / Vendor'}
                        </label>
                        <input
                          type="text"
                          value={formData.provider || ''}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                          placeholder="e.g. US CISA / Mandiant / AlienVault"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '協定版本' : 'Protocol Version'}
                        </label>
                        <select
                          value={formData.protocol || 'TAXII 2.1'}
                          onChange={(e) => setFormData({ ...formData, protocol: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                          <option value="TAXII 2.1">TAXII 2.1 (STIX 2.1 - Recommended)</option>
                          <option value="TAXII 2.0">TAXII 2.0 (STIX 2.0)</option>
                          <option value="TAXII 1.1">TAXII 1.1 (STIX 1.2 XML)</option>
                          <option value="STIX 2.1 JSON">STIX 2.1 JSON Bundle URL</option>
                          <option value="MISP REST">MISP Threat Sharing REST</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '探索服務網址 (Discovery URL) *' : 'Discovery URL / Root Endpoint *'}
                        </label>
                        <input
                          type="url"
                          required
                          value={formData.discoveryUrl || ''}
                          onChange={(e) => setFormData({ ...formData, discoveryUrl: e.target.value })}
                          placeholder="https://taxii.example.org/taxii2/"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {isZh ? '集合識別碼 (Collection ID)' : 'Collection ID'}
                          </label>
                          <button
                            type="button"
                            onClick={handleDiscoverCollections}
                            disabled={isDiscoveringCollections}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                          >
                            <RefreshCw size={10} className={cn(isDiscoveringCollections && "animate-spin")} />
                            <span>{isZh ? '探索可用集合' : 'Discover Collections'}</span>
                          </button>
                        </div>
                        {discoveredCollections.length > 0 ? (
                          <select
                            value={formData.collectionId || ''}
                            onChange={(e) => {
                              const sel = discoveredCollections.find(c => c.id === e.target.value);
                              setFormData({
                                ...formData,
                                collectionId: e.target.value,
                                collectionTitle: sel?.title || e.target.value
                              });
                            }}
                            className="w-full bg-gray-900 border border-blue-500/40 rounded-xl px-3.5 py-2 text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="">-- {isZh ? '選擇探索到的集合' : 'Select collection'} --</option>
                            {discoveredCollections.map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.collectionId || ''}
                            onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                            placeholder="e.g. urn:cisa:ais:collection:federal-threats"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '集合名稱 (Collection Title)' : 'Collection Title / Alias'}
                        </label>
                        <input
                          type="text"
                          value={formData.collectionTitle || ''}
                          onChange={(e) => setFormData({ ...formData, collectionTitle: e.target.value })}
                          placeholder="e.g. Critical Infrastructure Observables"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {isZh ? '描述與備註' : 'Description & Notes'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={isZh ? '說明此威脅情資來源之目的與可信度...' : 'Describe purpose and threat coverage...'}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Authentication */}
                {modalTab === 'auth' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {isZh ? '身份驗證機制' : 'Authentication Method'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'none', label: isZh ? '公開 (無金鑰)' : 'None (Public)', icon: Globe },
                          { id: 'api_key', label: isZh ? 'API 金鑰 / Bearer' : 'API Token / Key', icon: Key },
                          { id: 'basic', label: isZh ? '帳號密碼 (Basic)' : 'HTTP Basic Auth', icon: Lock },
                          { id: 'mtls', label: isZh ? '雙向 mTLS 憑證' : 'mTLS Certificate', icon: ShieldCheck }
                        ].map(a => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => setFormData({ ...formData, authType: a.id as any })}
                            className={cn(
                              "p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all",
                              formData.authType === a.id
                                ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-900/20"
                                : "bg-gray-900/70 border-gray-800 text-gray-400 hover:text-gray-200"
                            )}
                          >
                            <a.icon size={16} className={formData.authType === a.id ? "text-blue-400" : "text-gray-500"} />
                            <span>{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.authType === 'api_key' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            HTTP Header Name
                          </label>
                          <input
                            type="text"
                            value={formData.authConfig?.headerName || 'Authorization'}
                            onChange={(e) => setFormData({
                              ...formData,
                              authConfig: { ...formData.authConfig, headerName: e.target.value }
                            })}
                            placeholder="Authorization or X-OTX-API-KEY"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            API Secret Token / Key *
                          </label>
                          <input
                            type="password"
                            value={formData.authConfig?.apiKey || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              authConfig: { ...formData.authConfig, apiKey: e.target.value }
                            })}
                            placeholder="Bearer cisa_sec_tok_... or API Key"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {formData.authType === 'basic' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={formData.authConfig?.username || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              authConfig: { ...formData.authConfig, username: e.target.value }
                            })}
                            placeholder="soc_taxii_user"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            value={formData.authConfig?.password || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              authConfig: { ...formData.authConfig, password: e.target.value }
                            })}
                            placeholder="••••••••••••"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {formData.authType === 'mtls' && (
                      <div className="space-y-3 p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Client Certificate (.pem / .crt)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={formData.authConfig?.clientCertName || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              authConfig: { ...formData.authConfig, clientCertName: e.target.value }
                            })}
                            placeholder="e.g. mutual_taxii_client.pem"
                            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                          />
                          <button
                            type="button"
                            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 rounded-xl flex items-center gap-1.5"
                          >
                            <Upload size={13} />
                            <span>Upload Cert</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 italic">
                          {isZh ? '適用於 FS-ISAC、國家級 CERT 等需嚴格雙向 TLS 1.3 身份驗證之情資端點。' : 'Enforces strict bidirectional TLS 1.3 handshake with signed certificate.'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="verifySslCheckbox"
                        checked={formData.verifySsl ?? true}
                        onChange={(e) => setFormData({ ...formData, verifySsl: e.target.checked })}
                        className="w-4 h-4 rounded bg-gray-900 border-gray-800 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="verifySslCheckbox" className="text-xs text-gray-300 font-bold cursor-pointer">
                        {isZh ? '嚴格驗證 TLS/SSL 憑證有效性 (Verify SSL/TLS Certificate)' : 'Strict TLS/SSL Certificate Verification (Reject untrusted CAs)'}
                      </label>
                    </div>
                  </div>
                )}

                {/* Tab 3: Auto-Refresh & Polling */}
                {modalTab === 'refresh' && (
                  <div className="space-y-4">
                    {/* Auto-Refresh Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          {isZh ? '啟用背景自動排程輪詢 (Enable Auto-Refresh)' : 'Enable Background Auto-Refresh Polling'}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {isZh 
                            ? '系統將依指定週期自動向 TAXII 端點發起 Incremental Poll 並將新 IoC 寫入快取與關聯引擎'
                            : 'Background worker periodically polls TAXII collection and streams new IoCs into the SIEM pipeline.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, autoRefresh: !formData.autoRefresh })}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          formData.autoRefresh ? "bg-blue-600" : "bg-gray-700"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            formData.autoRefresh ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Refresh Interval Selector */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {isZh ? '自動更新週期 (Auto-Refresh Interval)' : 'Auto-Refresh Polling Interval'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { minutes: 5, label: isZh ? '5 分鐘 (高頻重要)' : '5 Minutes (Critical)', desc: 'Fast C2' },
                          { minutes: 15, label: isZh ? '15 分鐘 (推薦平衡)' : '15 Minutes (Recommended)', desc: 'Standard' },
                          { minutes: 30, label: isZh ? '30 分鐘 (一般頻率)' : '30 Minutes', desc: 'Balanced' },
                          { minutes: 60, label: isZh ? '1 小時 (定期更新)' : '1 Hour (Hourly)', desc: 'Periodic' },
                          { minutes: 360, label: isZh ? '6 小時 (低負載)' : '6 Hours', desc: 'Low noise' },
                          { minutes: 720, label: isZh ? '12 小時 (半日匯流)' : '12 Hours', desc: 'Bi-daily' },
                          { minutes: 1440, label: isZh ? '24 小時 (每日全量)' : '24 Hours (Daily)', desc: 'TTP matrices' },
                          { minutes: -1, label: isZh ? '自訂間隔' : 'Custom Interval', desc: 'Cron / Min' }
                        ].map(interval => (
                          <button
                            type="button"
                            key={interval.minutes}
                            onClick={() => {
                              if (interval.minutes > 0) {
                                setFormData({ ...formData, refreshIntervalMinutes: interval.minutes });
                              }
                            }}
                            className={cn(
                              "p-3 rounded-xl border text-left flex flex-col justify-between transition-all",
                              formData.refreshIntervalMinutes === interval.minutes
                                ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-900/20"
                                : "bg-gray-900/70 border-gray-800 text-gray-400 hover:text-gray-200"
                            )}
                          >
                            <span className="text-xs font-black">{interval.label}</span>
                            <span className="text-[10px] text-gray-500 mt-1">{interval.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Polling Strategy */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '同步拉取策略' : 'Polling Sync Mode'}
                        </label>
                        <select
                          value={formData.pollMode || 'incremental'}
                          onChange={(e) => setFormData({ ...formData, pollMode: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                        >
                          <option value="incremental">{isZh ? '增量拉取 (Incremental - 僅取得最新 STIX 物件)' : 'Incremental (Only new STIX objects)'}</option>
                          <option value="full">{isZh ? '全量替換 (Full Snapshot - 覆蓋現有快取)' : 'Full Snapshot Replacement'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '逾時與重試 (Timeout)' : 'Socket Timeout & Retry'}
                        </label>
                        <select
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                          defaultValue="30s"
                        >
                          <option value="15s">15 Seconds (Aggressive)</option>
                          <option value="30s">30 Seconds (Recommended)</option>
                          <option value="60s">60 Seconds (High Latency Links)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Filters & Policy */}
                {modalTab === 'filters' && (
                  <div className="space-y-4">
                    {/* IoC Types to Ingest */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {isZh ? '允許收錄的 IoC 指標類型' : 'Ingested IoC Indicator Types'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'ipv4', label: 'IPv4 Addresses', icon: Globe },
                          { id: 'ipv6', label: 'IPv6 Addresses', icon: Globe },
                          { id: 'domain', label: 'Domains / FQDN', icon: Server },
                          { id: 'url', label: 'HTTP/S URLs', icon: ExternalLink },
                          { id: 'file_hash', label: 'File Hashes (SHA/MD5)', icon: Hash },
                          { id: 'cve', label: 'CVE Vulnerabilities', icon: ShieldAlert },
                          { id: 'yara', label: 'YARA Signatures', icon: FileCode }
                        ].map(type => {
                          const isChecked = formData.iocTypes?.includes(type.id as any);
                          return (
                            <button
                              type="button"
                              key={type.id}
                              onClick={() => {
                                const curr = formData.iocTypes || [];
                                const next = isChecked 
                                  ? curr.filter(t => t !== type.id)
                                  : [...curr, type.id as any];
                                setFormData({ ...formData, iocTypes: next });
                              }}
                              className={cn(
                                "p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all text-left",
                                isChecked
                                  ? "bg-blue-600/20 border-blue-500 text-white"
                                  : "bg-gray-900/60 border-gray-800 text-gray-500 hover:text-gray-300"
                              )}
                            >
                              <type.icon size={13} className={isChecked ? "text-blue-400" : "text-gray-600"} />
                              <span>{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Confidence Threshold Slider */}
                    <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {isZh ? '最低可信度門檻 (Minimum Confidence Score)' : 'Minimum Confidence Threshold'}
                        </label>
                        <span className="text-sm font-black text-blue-400 font-mono">
                          {formData.confidenceThreshold || 75}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.confidenceThreshold || 75}
                        onChange={(e) => setFormData({ ...formData, confidenceThreshold: Number(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-500">
                        {isZh 
                          ? '低於此門檻之 STIX Indicator 物件將被自動過濾，避免產生過量低品質誤報。' 
                          : 'Indicators with confidence scores below this threshold will be dropped at ingestion.'}
                      </p>
                    </div>

                    {/* TLP Ceiling */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isZh ? '最高允許 TLP 分級 (TLP Ceiling)' : 'Maximum TLP Permitted'}
                        </label>
                        <select
                          value={formData.tlpCeiling || 'TLP:AMBER'}
                          onChange={(e) => setFormData({ ...formData, tlpCeiling: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                          <option value="TLP:WHITE">TLP:WHITE (Public / Clear)</option>
                          <option value="TLP:GREEN">TLP:GREEN (Community)</option>
                          <option value="TLP:AMBER">TLP:AMBER (Restricted to Org)</option>
                          <option value="TLP:AMBER+STRICT">TLP:AMBER+STRICT</option>
                          <option value="TLP:RED">TLP:RED (Strictly Confidential)</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <div className="flex items-center gap-3 p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl">
                          <input
                            type="checkbox"
                            id="autoEnforceBlocklistCheckbox"
                            checked={formData.autoEnforceBlocklist ?? true}
                            onChange={(e) => setFormData({ ...formData, autoEnforceBlocklist: e.target.checked })}
                            className="w-4 h-4 rounded bg-gray-900 border-gray-800 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="autoEnforceBlocklistCheckbox" className="text-xs text-gray-300 font-bold cursor-pointer">
                            {isZh ? '自動推播高可信度 IoC 至阻斷清單' : 'Autonomously Push High-Confidence IoCs to Blocklist'}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Alert Thresholds */}
                {modalTab === 'alerts' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {isZh ? '為此來源自訂個別告警閾值 (Override Global Thresholds)' : 'Custom Alert Thresholds for this Feed'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {isZh ? '啟用後將覆蓋全域預設值，以此處設定之失敗次數與延遲上限為準' : 'Override global ingestion failure and latency thresholds for this specific feed.'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const current = formData.customAlertThresholds || { enabled: false, maxFailedAttempts: 2, highLatencyMs: 800 };
                            setFormData({
                              ...formData,
                              customAlertThresholds: {
                                ...current,
                                enabled: !current.enabled
                              }
                            });
                          }}
                          className={cn(
                            "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            formData.customAlertThresholds?.enabled ? "bg-amber-600" : "bg-gray-700"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              formData.customAlertThresholds?.enabled ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>

                      {formData.customAlertThresholds?.enabled ? (
                        <div className="space-y-4 pt-3 border-t border-gray-800">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-gray-300">
                                {isZh ? '收錄連續失敗上限次數' : 'Max Consecutive Ingestion Failures'}
                              </label>
                              <span className="text-xs font-mono font-bold text-amber-400">
                                {formData.customAlertThresholds.maxFailedAttempts} {isZh ? '次' : 'failures'}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              step={1}
                              value={formData.customAlertThresholds.maxFailedAttempts}
                              onChange={(e) => setFormData({
                                ...formData,
                                customAlertThresholds: {
                                  ...formData.customAlertThresholds!,
                                  maxFailedAttempts: parseInt(e.target.value, 10)
                                }
                              })}
                              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                              <span>1 ({isZh ? '嚴格' : 'Strict'})</span>
                              <span>2 ({isZh ? '推薦' : 'Rec.'})</span>
                              <span>5</span>
                              <span>10 ({isZh ? '寬鬆' : 'Relaxed'})</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-gray-300">
                                {isZh ? '高響應延遲觸發閾值 (High Latency Limit)' : 'High Latency Limit'}
                              </label>
                              <span className="text-xs font-mono font-bold text-amber-400">
                                {formData.customAlertThresholds.highLatencyMs} ms
                              </span>
                            </div>
                            <input
                              type="range"
                              min={200}
                              max={2500}
                              step={50}
                              value={formData.customAlertThresholds.highLatencyMs}
                              onChange={(e) => setFormData({
                                ...formData,
                                customAlertThresholds: {
                                  ...formData.customAlertThresholds!,
                                  highLatencyMs: parseInt(e.target.value, 10)
                                }
                              })}
                              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                              <span>200ms</span>
                              <span>500ms</span>
                              <span>800ms</span>
                              <span>1200ms</span>
                              <span>2500ms</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-950/80 border border-gray-800/80 rounded-xl space-y-1">
                          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <Info size={13} className="text-blue-400" />
                            <span>{isZh ? '目前繼承全域預設告警設定' : 'Inheriting Global Alert Policy'}</span>
                          </span>
                          <p className="text-[11px] text-gray-500">
                            {isZh 
                              ? `全域設定：連續失敗 ≥${alertThresholds.maxFailedAttempts} 次或響應延遲 ≥${alertThresholds.highLatencyMs}ms 即觸發通知。`
                              : `Global defaults: Failures ≥${alertThresholds.maxFailedAttempts} attempts or Latency ≥${alertThresholds.highLatencyMs}ms.`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Connection Test Bar inside Modal */}
                <div className="mt-4 p-4 bg-gray-900/90 border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testConnStatus === 'testing'}
                      className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Activity size={13} className={cn(testConnStatus === 'testing' && "animate-spin text-blue-400")} />
                      <span>{testConnStatus === 'testing' ? (isZh ? '連線握手中...' : 'Testing Handshake...') : (isZh ? '測試 TAXII 連線' : 'Test TAXII Connection')}</span>
                    </button>

                    {testConnMessage && (
                      <span className={cn(
                        "text-xs flex items-center gap-1.5 leading-tight font-mono",
                        testConnStatus === 'success' ? "text-green-400" :
                        testConnStatus === 'error' ? "text-red-400" :
                        "text-blue-400"
                      )}>
                        {testConnStatus === 'success' ? <CheckCircle2 size={14} className="shrink-0" /> :
                         testConnStatus === 'error' ? <AlertCircle size={14} className="shrink-0" /> :
                         <RefreshCw size={14} className="shrink-0 animate-spin" />}
                        <span>{testConnMessage}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-800 hover:bg-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all"
                  >
                    {isZh ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-900/30 transition-all active:scale-95"
                  >
                    {editingFeed 
                      ? (isZh ? '儲存變更' : 'Save Changes') 
                      : (isZh ? '確認建立情資來源' : 'Create Feed Source')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspect STIX 2.1 Indicators Modal */}
      <AnimatePresence>
        {inspectingFeed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400">
                    <Database size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {inspectingFeed.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-[10px] font-mono rounded">
                        {inspectingFeed.collectionId}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {isZh 
                        ? `檢視最新收錄之 STIX 2.1 指標物件 (共 ${inspectingFeed.indicatorCount.toLocaleString()} 筆)` 
                        : `Inspect ingested STIX 2.1 Observable Objects (${inspectingFeed.indicatorCount.toLocaleString()} total)`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingFeed(null)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body: STIX indicators list */}
              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isZh ? '最近擷取之 STIX 2.1 Indicators 樣本' : 'Recently Captured STIX 2.1 Indicators'}
                  </span>
                  <button
                    onClick={() => {
                      const csv = "ID,Type,Value,Confidence,TLP,ThreatActor,MITRE,Description\n" + 
                        inspectingFeed.sampleIndicators.map(i => `"${i.id}","${i.type}","${i.value}",${i.confidence},"${i.tlp}","${i.threatActor || ''}","${i.mitreTechnique || ''}","${i.description}"`).join("\n");
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `stix_indicators_${inspectingFeed.id}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
                  >
                    <Download size={13} />
                    <span>Export Indicators CSV</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {inspectingFeed.sampleIndicators.map((ind) => (
                    <div key={ind.id} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded text-[10px] font-mono uppercase font-bold">
                            {ind.type}
                          </span>
                          <span className="text-sm font-mono font-bold text-white selection:bg-blue-600">
                            {ind.value}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                            {ind.tlp}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            Confidence: {ind.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* STIX Pattern */}
                      <div className="bg-black/80 border border-gray-800 rounded-lg p-2 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                        {ind.pattern}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          {ind.threatActor && (
                            <span>Actor: <strong className="text-purple-400">{ind.threatActor}</strong></span>
                          )}
                          {ind.mitreTechnique && (
                            <span>MITRE: <strong className="text-amber-400">{ind.mitreTechnique}</strong></span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          Valid From: {new Date(ind.validFrom).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 italic">
                        {ind.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Raw STIX 2.1 Bundle preview */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    {isZh ? 'STIX 2.1 JSON 原生資料結構預覽' : 'Raw STIX 2.1 JSON Observable Bundle Preview'}
                  </span>
                  <pre className="p-4 bg-black/90 border border-gray-800 rounded-xl font-mono text-[10px] text-green-400 max-h-48 overflow-y-auto custom-scrollbar">
{JSON.stringify({
  type: "bundle",
  id: `bundle--${inspectingFeed.id}`,
  spec_version: "2.1",
  objects: inspectingFeed.sampleIndicators.map(i => ({
    type: "indicator",
    spec_version: "2.1",
    id: i.id,
    created: i.validFrom,
    modified: i.validFrom,
    name: `Observed ${i.type}: ${i.value}`,
    description: i.description,
    indicator_types: ["malicious-activity"],
    pattern: i.pattern,
    pattern_type: "stix",
    valid_from: i.validFrom,
    confidence: i.confidence,
    labels: [i.tlp.toLowerCase(), i.threatActor || "apt"]
  }))
}, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-900/80 border-t border-gray-800 flex items-center justify-end">
                <button
                  onClick={() => setInspectingFeed(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold"
                >
                  {isZh ? '關閉' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Ingestion & Response Alert Threshold Configuration Modal */}
      <ThreatIntelAlertThresholdModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        thresholds={alertThresholds}
        onSaveThresholds={handleSaveAlertThresholds}
        feeds={feeds}
        onProbeFeed={handlePingFeed}
        onTriggerTestNotification={handleTriggerTestNotification}
        isZh={isZh}
      />

      {/* Threat Intel Backup & Restore (Import / Export) Modal */}
      <ThreatIntelImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        feeds={feeds}
        alertThresholds={alertThresholds}
        onImportFeeds={handleImportFeeds}
        isZh={isZh}
      />

      {/* Real-time Alert Toast Dispatches */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            key={toastNotification.id}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl max-w-md flex items-start gap-3 backdrop-blur-md transition-all",
              toastNotification.severity === 'critical'
                ? "bg-red-950/95 border-red-500/60 text-white shadow-red-950/40"
                : toastNotification.severity === 'warning'
                ? "bg-amber-950/95 border-amber-500/60 text-white shadow-amber-950/40"
                : "bg-gray-900/95 border-green-500/60 text-white shadow-black/40"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl mt-0.5 shrink-0",
              toastNotification.severity === 'critical' ? "bg-red-500/20 text-red-400" :
              toastNotification.severity === 'warning' ? "bg-amber-500/20 text-amber-400" :
              "bg-green-500/20 text-green-400"
            )}>
              <Bell size={18} className="animate-pulse" />
            </div>

            <div className="flex-1 pr-2">
              <h5 className="text-xs font-bold">{toastNotification.title}</h5>
              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                {toastNotification.message}
              </p>
            </div>

            <button
              onClick={() => setToastNotification(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

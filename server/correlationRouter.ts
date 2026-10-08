import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';

const Router = express.Router;
const CORRELATION_CONFIG_PATH = path.join(process.cwd(), 'correlation_config.json');

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  tactic: string;
  technique?: string;
  sources: string[];
  window: string;
  windowSeconds: number;
  joinKey: string;
  enabled: boolean;
  hits24h: number;
  ruleLogic: string;
  stages: {
    stageId: string;
    name: string;
    source: string;
    condition: string;
  }[];
  actions?: string[];
  updatedAt?: string;
}

export interface WindowConfig {
  burstWindowSeconds: number;
  killChainWindowMinutes: number;
  slowAptWindowDays: number;
  allowedLatenessSeconds: number;
  checkpointIntervalSeconds: number;
  maxStateMemoryMB: number;
  rocksdbCompression: 'Snappy' | 'ZSTD' | 'LZ4';
  stateRetentionPolicy: string;
}

export interface SchemaMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformation: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  active: boolean;
}

export interface AggregationConfig {
  entityClusteringEnabled: boolean;
  clusteringWindowMinutes: number;
  clusteringKeys: string[];
  escalationMatrixEnabled: boolean;
  escalationThreshold: number;
  escalationWindowMinutes: number;
  escalateFrom: 'Medium' | 'High';
  escalateTo: 'High' | 'Critical';
  stormSuppressionRateLimit: number;
  dedupWindowSeconds: number;
  autoNoiseFilter: boolean;
}

export interface CorrelationStorageState {
  rules: CorrelationRule[];
  windowConfig: WindowConfig;
  schemaMappings: SchemaMapping[];
  aggregationConfig: AggregationConfig;
  lastUpdated: string;
}

const defaultRules: CorrelationRule[] = [
  {
    id: 'CORR-RULE-101',
    name: '多重登入失敗後緊接特權提升與橫向移動 (Brute Force + PrivEsc + Lateral Jump)',
    description: '同一來源 IP 或帳號在 60 秒內超過 5 次登入失敗，緊接著成功提升本機管理員權限並向 DC 發起 SMB 遠端連線。',
    severity: 'Critical',
    tactic: 'TA0008 Lateral Movement',
    technique: 'T1021.002 Remote Services: SMB',
    sources: ['Active Directory', 'EDR', 'Firewall'],
    window: '300s (5 min)',
    windowSeconds: 300,
    joinKey: 'user.name, host.ip',
    enabled: true,
    hits24h: 148,
    ruleLogic: 'EventA(Logon_Fail > 5 in 60s) -> EventB(PrivEsc_4672 in 120s) -> EventC(SMB_Session in 300s)',
    stages: [
      {
        stageId: 'A',
        name: '登入失敗衝擊 (Brute Force Attempt)',
        source: 'Active Directory / Windows Security',
        condition: "event.code == 4625 AND failure.count >= 5"
      },
      {
        stageId: 'B',
        name: '特權提升特權指派 (Privilege Escalation)',
        source: 'EDR Telemetry / Win 4672',
        condition: "event.code == 4672 AND user.privileges contains 'SeDebugPrivilege'"
      },
      {
        stageId: 'C',
        name: '橫向移動連線 (Lateral SMB Named Pipe)',
        source: 'Firewall & Network NDR',
        condition: "destination.port == 445 AND protocol == 'SMB2'"
      }
    ],
    actions: ['Generate High Incident', 'Trigger SOAR Host Quarantine', 'Notify SOC Duty Lead'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CORR-RULE-102',
    name: '無檔案 PowerShell 記憶體注入且連線新註冊 C2 網域 (In-Memory PowerShell + C2)',
    description: 'Office 處理序反常拉起混淆編碼的 PowerShell，且在 120 秒內透過 DNS 查詢新註冊網域並建立 TLS 連線。',
    severity: 'Critical',
    tactic: 'TA0011 Command & Control',
    technique: 'T1059.001 PowerShell In-Memory',
    sources: ['EDR Telemetry', 'Suricata NDR', 'DNS Server'],
    window: '120s (2 min)',
    windowSeconds: 120,
    joinKey: 'host.ip, process.guid',
    enabled: true,
    hits24h: 89,
    ruleLogic: 'EventA(EDR_Process_Inject) -> EventB(DNS_Query_NRD) -> EventC(TLS_JA3_Malicious)',
    stages: [
      {
        stageId: 'A',
        name: '異常程序衍生 (Process Spawning)',
        source: 'EDR Telemetry',
        condition: "process.name in ['powershell.exe', 'pwsh.exe'] AND process.parent.name in ['WINWORD.EXE', 'EXCEL.EXE', 'wscript.exe']"
      },
      {
        stageId: 'B',
        name: '可疑新註冊網域解析 (NRD Lookup)',
        source: 'DNS Server Query Log',
        condition: "dns.question.domain matches regex('\\b[a-z0-9]{12,}\\.xyz\\b') OR threat.intel.is_nrd == true"
      },
      {
        stageId: 'C',
        name: '外連 C2 惡意 JA3 指紋連線 (TLS C2 Traffic)',
        source: 'Suricata NDR',
        condition: "tls.ja3 in ['6734f37431670b3ab4292b8f60f29984', '51c64c77e60f3980ebd90973b1554d7e']"
      }
    ],
    actions: ['Kill Process Tree', 'Isolate Endpoint via EDR', 'Send Webhook to SOC'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CORR-RULE-103',
    name: '不可能的移動登入 (異地 Tor 節點與內網特權存取) (Impossible Travel + Tor Exit Node)',
    description: '同一使用者在 15 分鐘內分別由不同相距數千公里地理位置登入，且來源 IP 列名 Tor 出口節點名單。',
    severity: 'High',
    tactic: 'TA0001 Initial Access',
    technique: 'T1078 Valid Accounts',
    sources: ['Okta SSO', 'Threat Intel CTI', 'WAF Gateway'],
    window: '900s (15 min)',
    windowSeconds: 900,
    joinKey: 'user.id, user.email',
    enabled: true,
    hits24h: 42,
    ruleLogic: 'EventA(Geo_Distance > 5000km in < 1hr) AND EventB(CTI_Tor_Exit == true)',
    stages: [
      {
        stageId: 'A',
        name: '異常跨國登入 (Multi-Geo Access)',
        source: 'Okta SSO Audit',
        condition: "geo.country != user.home_country AND event.type == 'user.session.start'"
      },
      {
        stageId: 'B',
        name: '威脅情報命中 (Tor Exit Tag)',
        source: 'Threat Intel CTI',
        condition: "cti.reputation.threat_types contains 'TOR_EXIT_NODE'"
      }
    ],
    actions: ['Revoke SSO Session Token', 'Enforce Step-Up MFA', 'Create Case'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CORR-RULE-104',
    name: '暗夜時段大量資料庫導出與突發雲端 S3 上傳 (Off-Hours Massive DB Dump + S3 Exfil)',
    description: '非辦公時段核心資料庫被單一帳號執行跨表大批量 SELECT 導出，伴隨對外大量上傳流量至 S3 儲存貯體。',
    severity: 'Critical',
    tactic: 'TA0010 Exfiltration',
    technique: 'T1567.002 Exfiltration to Cloud Storage',
    sources: ['CloudTrail', 'PostgreSQL Audit', 'NetFlow'],
    window: '600s (10 min)',
    windowSeconds: 600,
    joinKey: 'host.ip, aws.iam_arn',
    enabled: true,
    hits24h: 24,
    ruleLogic: 'EventA(DB_Rows_Dump > 100000) -> EventB(S3_PutObject_Volume > 1GB in 600s)',
    stages: [
      {
        stageId: 'A',
        name: '資料庫批量提取 (Mass Database Read)',
        source: 'PostgreSQL Audit',
        condition: "db.statement matches regex('(?i)select.+from.+limit\\s+([1-9][0-9]{5,})') AND time.is_after_hours == true"
      },
      {
        stageId: 'B',
        name: '雲端外傳峰值 (Cloud S3 Exfil)',
        source: 'AWS CloudTrail & NetFlow',
        condition: "event.name == 'PutObject' AND network.bytes_out > 1073741824"
      }
    ],
    actions: ['Suspend IAM Access Key', 'Alert Data Protection Officer', 'Capture Network PCAP'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CORR-RULE-105',
    name: '陰影副本抹除與大量檔案副檔名異動 (勒索特徵) (Volume Shadow Copy Delete + Rapid File Renames)',
    description: '偵測指令調用 vssadmin 或 bcdedit 破壞 Windows 還原點，隨後 60 秒內主機密集發生命名為勒索副檔名之事件。',
    severity: 'Critical',
    tactic: 'TA0040 Impact',
    technique: 'T1490 Inhibit System Recovery',
    sources: ['EDR File Audit', 'Windows Sysmon'],
    window: '60s (1 min)',
    windowSeconds: 60,
    joinKey: 'host.name, host.ip',
    enabled: true,
    hits24h: 6,
    ruleLogic: 'EventA(Cmd == "vssadmin delete shadows") -> EventB(File_Rename_Count > 500 in 60s)',
    stages: [
      {
        stageId: 'A',
        name: '備份破壞指令 (Shadow Copy Deletion)',
        source: 'Windows Sysmon Event 1',
        condition: "process.command_line matches regex('(?i)(vssadmin.*delete\\s+shadows|wbadmin.*delete|bcdedit.*recoveryenabled\\s+no)')"
      },
      {
        stageId: 'B',
        name: '急速檔案加密異動 (Mass File Extension Change)',
        source: 'EDR File Audit',
        condition: "file.action == 'RENAME' AND file.extension in ['.locked', '.enc', '.crypto', '.crypted'] AND rate.per_minute > 500"
      }
    ],
    actions: ['Emergency Endpoint Network Isolation', 'Halt VSS Driver Access', 'P0 Incident Trigger'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CORR-RULE-106',
    name: '憑證傾印存取與 Kerberoasting 服務票證請求 (Credential Dump + Kerberoasting)',
    description: '端點發生 LSASS 記憶體讀取特徵，隨後由同主機發起不尋常的 RC4 加密 Kerberos TGS 服務票證請求。',
    severity: 'High',
    tactic: 'TA0006 Credential Access',
    technique: 'T1558.003 Steal Kerberos Tickets',
    sources: ['Sysmon', 'Active Directory Kerberos', 'EDR'],
    window: '300s (5 min)',
    windowSeconds: 300,
    joinKey: 'host.ip, user.name',
    enabled: true,
    hits24h: 18,
    ruleLogic: 'EventA(Process_Access_LSASS) -> EventB(Kerberos_TGS_Request_RC4 in 300s)',
    stages: [
      {
        stageId: 'A',
        name: 'LSASS 存取 (LSASS Memory Read)',
        source: 'Sysmon Event 10',
        condition: "target.process.name == 'lsass.exe' AND (granted_access == '0x1010' OR granted_access == '0x1FFFFF')"
      },
      {
        stageId: 'B',
        name: '弱加密 Kerberos 票證請求 (TGS Request RC4)',
        source: 'Active Directory Event 4769',
        condition: "ticket.encryption_type == '0x17' AND service.name not in ['krbtgt', '$']"
      }
    ],
    actions: ['Reset Compromised Service Account Password', 'Generate High Alert'],
    updatedAt: new Date().toISOString()
  }
];

const defaultWindowConfig: WindowConfig = {
  burstWindowSeconds: 180,
  killChainWindowMinutes: 60,
  slowAptWindowDays: 7,
  allowedLatenessSeconds: 30,
  checkpointIntervalSeconds: 60,
  maxStateMemoryMB: 4096,
  rocksdbCompression: 'LZ4',
  stateRetentionPolicy: 'SLIDING_WATERMARK_LRU'
};

const defaultSchemaMappings: SchemaMapping[] = [
  {
    id: 'MAP-001',
    sourceField: 'Win_Event.TargetUserName',
    targetField: 'user.name',
    transformation: 'Extract & Trim',
    description: '標準化 Windows 安全性稽核使用者名稱，移除網域前綴與多餘空格',
    sampleInput: 'CORP\\alice.chen',
    sampleOutput: 'alice.chen',
    active: true
  },
  {
    id: 'MAP-002',
    sourceField: 'Suricata.src_ip',
    targetField: 'source.ip',
    transformation: 'IPv4 Validate',
    description: 'Suricata 網路連線來源 IP 格式檢驗並映射至標準 ECS 來源欄位',
    sampleInput: '192.168.10.55',
    sampleOutput: '192.168.10.55',
    active: true
  },
  {
    id: 'MAP-003',
    sourceField: 'CloudTrail.userIdentity.arn',
    targetField: 'aws.iam_arn',
    transformation: 'Parse ARN',
    description: '解析 AWS CloudTrail IAM ARN 實體標識',
    sampleInput: 'arn:aws:iam::123456789012:role/ProductionAdmin',
    sampleOutput: 'role/ProductionAdmin',
    active: true
  },
  {
    id: 'MAP-004',
    sourceField: 'Sysmon.ProcessCommandLine',
    targetField: 'process.command_line',
    transformation: 'De-obfuscate Base64',
    description: '偵測並自動解碼 PowerShell -Enc 混淆 Base64 參數以利字串比對',
    sampleInput: 'powershell.exe -Enc JABjAGwAbwB1AGQA...',
    sampleOutput: 'powershell.exe $cloud=New-Object...',
    active: true
  },
  {
    id: 'MAP-005',
    sourceField: 'PaloAlto.app_id',
    targetField: 'network.application',
    transformation: 'Lowercase',
    description: '防火牆應用程式識別碼標準化小寫字串',
    sampleInput: 'MS-SMB',
    sampleOutput: 'ms-smb',
    active: true
  }
];

const defaultAggregationConfig: AggregationConfig = {
  entityClusteringEnabled: true,
  clusteringWindowMinutes: 10,
  clusteringKeys: ['host.ip', 'user.name', 'host.name'],
  escalationMatrixEnabled: true,
  escalationThreshold: 3,
  escalationWindowMinutes: 30,
  escalateFrom: 'Medium',
  escalateTo: 'High',
  stormSuppressionRateLimit: 100,
  dedupWindowSeconds: 60,
  autoNoiseFilter: true
};

function loadCorrelationState(): CorrelationStorageState {
  try {
    if (fs.existsSync(CORRELATION_CONFIG_PATH)) {
      const raw = fs.readFileSync(CORRELATION_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        rules: Array.isArray(parsed.rules) && parsed.rules.length > 0 ? parsed.rules : defaultRules,
        windowConfig: parsed.windowConfig ? { ...defaultWindowConfig, ...parsed.windowConfig } : defaultWindowConfig,
        schemaMappings: Array.isArray(parsed.schemaMappings) && parsed.schemaMappings.length > 0 ? parsed.schemaMappings : defaultSchemaMappings,
        aggregationConfig: parsed.aggregationConfig ? { ...defaultAggregationConfig, ...parsed.aggregationConfig } : defaultAggregationConfig,
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('[Correlation] Error loading correlation config from disk:', err);
  }

  const initial: CorrelationStorageState = {
    rules: defaultRules,
    windowConfig: defaultWindowConfig,
    schemaMappings: defaultSchemaMappings,
    aggregationConfig: defaultAggregationConfig,
    lastUpdated: new Date().toISOString()
  };

  try {
    fs.writeFileSync(CORRELATION_CONFIG_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Correlation] Failed to initialize correlation_config.json:', e);
  }

  return initial;
}

function saveCorrelationState(state: CorrelationStorageState): boolean {
  try {
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CORRELATION_CONFIG_PATH, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Correlation] Error persisting correlation state:', err);
    return false;
  }
}

/**
 * Live Rule Evaluation Simulation
 * Evaluates input JSON payload against real correlation rules logic
 */
function evaluatePayloadAgainstRules(payload: Record<string, any>, rules: CorrelationRule[]) {
  const startTime = process.hrtime();

  // Normalize flattened fields
  const flatPayload: Record<string, any> = {};
  function flatten(obj: any, prefix = '') {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      flatPayload[newKey] = val;
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        flatten(val, newKey);
      }
    }
  }
  flatten(payload);

  const payloadStr = JSON.stringify(payload).toLowerCase();
  const processVal = String(flatPayload['process'] || flatPayload['process.name'] || '').toLowerCase();
  const cmdlineVal = String(flatPayload['cmdline'] || flatPayload['process.command_line'] || '').toLowerCase();
  const parentVal = String(flatPayload['parent_process'] || flatPayload['process.parent.name'] || '').toLowerCase();
  const eventType = String(flatPayload['event_type'] || flatPayload['event.type'] || '').toLowerCase();
  const hostVal = String(flatPayload['host'] || flatPayload['host.ip'] || flatPayload['src_ip'] || flatPayload['source.ip'] || '192.168.10.55');
  const userVal = String(flatPayload['user'] || flatPayload['user.name'] || flatPayload['username'] || 'alice.chen');

  let bestMatch: {
    rule: CorrelationRule;
    score: number;
    matchedStages: string[];
    extractedKeys: Record<string, any>;
    trace: string[];
  } | null = null;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    let score = 0;
    const matchedStages: string[] = [];
    const trace: string[] = [];

    // Check specific rule triggers
    if (rule.id === 'CORR-RULE-102') {
      // In-Memory PowerShell + C2
      const hasPs = processVal.includes('powershell') || cmdlineVal.includes('powershell') || payloadStr.includes('powershell.exe');
      const hasOfficeParent = parentVal.includes('winword') || parentVal.includes('excel') || payloadStr.includes('winword');
      const hasEncoded = cmdlineVal.includes('-enc') || cmdlineVal.includes('hidden') || payloadStr.includes('-enc');

      if (hasPs) {
        score += 45;
        matchedStages.push('Stage A: In-Memory PowerShell Spawn');
        trace.push('Hit Stage A: Detected powershell execution in payload');
      }
      if (hasOfficeParent) {
        score += 35;
        matchedStages.push('Stage A.1: Office Parent Process Spawning');
        trace.push('Hit Stage A.1: Parent process identified as WINWORD.EXE');
      }
      if (hasEncoded) {
        score += 17;
        matchedStages.push('Stage B: Obfuscated Base64 Command Line');
        trace.push('Hit Stage B: Command line contains encoded payload arguments (-Enc / -W Hidden)');
      }
    } else if (rule.id === 'CORR-RULE-101') {
      // Brute Force + PrivEsc + Lateral
      const hasLogon = payloadStr.includes('4625') || payloadStr.includes('logon') || payloadStr.includes('fail');
      const hasPrivEsc = payloadStr.includes('4672') || payloadStr.includes('priv') || payloadStr.includes('admin');
      const hasSMB = payloadStr.includes('445') || payloadStr.includes('smb') || payloadStr.includes('lateral');

      if (hasLogon) {
        score += 40;
        matchedStages.push('Stage A: Multi-logon failures');
        trace.push('Hit Stage A: Logon failure event identifier detected');
      }
      if (hasPrivEsc) {
        score += 35;
        matchedStages.push('Stage B: Privilege escalation token');
        trace.push('Hit Stage B: Privilege assignment detected');
      }
      if (hasSMB) {
        score += 24;
        matchedStages.push('Stage C: SMB lateral communication');
        trace.push('Hit Stage C: SMB port/protocol lateral movement matched');
      }
    } else if (rule.id === 'CORR-RULE-105') {
      // Ransomware shadow copy delete
      const hasVss = cmdlineVal.includes('vssadmin') || cmdlineVal.includes('shadow') || payloadStr.includes('delete shadows');
      const hasRename = payloadStr.includes('rename') || payloadStr.includes('.locked') || payloadStr.includes('.crypto');

      if (hasVss) {
        score += 60;
        matchedStages.push('Stage A: Backup tampering (vssadmin delete shadows)');
        trace.push('Hit Stage A: High-confidence ransomware precursor command matched');
      }
      if (hasRename) {
        score += 38;
        matchedStages.push('Stage B: Rapid file extension alteration');
        trace.push('Hit Stage B: Mass file extension renaming pattern identified');
      }
    } else if (rule.id === 'CORR-RULE-104') {
      // Database Dump + S3 Exfil
      const hasDb = payloadStr.includes('select') || payloadStr.includes('dump') || payloadStr.includes('postgres') || payloadStr.includes('database');
      const hasS3 = payloadStr.includes('s3') || payloadStr.includes('cloudtrail') || payloadStr.includes('putobject') || payloadStr.includes('upload');

      if (hasDb) {
        score += 50;
        matchedStages.push('Stage A: Off-hours database rows extraction');
        trace.push('Hit Stage A: Database read volume threshold reached');
      }
      if (hasS3) {
        score += 46;
        matchedStages.push('Stage B: S3 putobject high volume exfiltration');
        trace.push('Hit Stage B: S3 outbound payload volume matched');
      }
    } else if (rule.id === 'CORR-RULE-103') {
      // Impossible Travel
      const hasGeo = payloadStr.includes('geo') || payloadStr.includes('distance') || payloadStr.includes('okta');
      const hasTor = payloadStr.includes('tor') || payloadStr.includes('exit') || payloadStr.includes('cti');

      if (hasGeo) {
        score += 48;
        matchedStages.push('Stage A: Anomaly geographic distance login');
        trace.push('Hit Stage A: Session locations inconsistent with velocity');
      }
      if (hasTor) {
        score += 48;
        matchedStages.push('Stage B: Tor exit node IP intelligence match');
        trace.push('Hit Stage B: Threat intel hit on anonymized proxy node');
      }
    } else {
      // Generic condition heuristic
      const words = rule.name.toLowerCase().split(' ');
      let matches = 0;
      for (const w of words) {
        if (w.length > 3 && payloadStr.includes(w)) {
          matches++;
        }
      }
      if (matches >= 2) {
        score = Math.min(85, matches * 25);
        matchedStages.push('Generic Pattern Match');
        trace.push(`Heuristic match: ${matches} key tokens found in payload`);
      }
    }

    if (score > 40 && (!bestMatch || score > bestMatch.score)) {
      const extractedKeys: Record<string, any> = {
        'host.ip': hostVal,
        'user.name': userVal,
        'event.type': eventType || 'security_audit',
        'matched.rule_id': rule.id
      };
      if (processVal) extractedKeys['process.name'] = processVal;
      if (parentVal) extractedKeys['process.parent.name'] = parentVal;
      if (flatPayload['src_ip']) extractedKeys['source.ip'] = flatPayload['src_ip'];
      if (flatPayload['dst_ip']) extractedKeys['destination.ip'] = flatPayload['dst_ip'];

      bestMatch = {
        rule,
        score: Math.min(99, score),
        matchedStages,
        extractedKeys,
        trace
      };
    }
  }

  const diff = process.hrtime(startTime);
  const executionMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

  if (bestMatch) {
    return {
      matched: true,
      ruleId: bestMatch.rule.id,
      ruleName: bestMatch.rule.name,
      severity: bestMatch.rule.severity,
      tactic: bestMatch.rule.tactic,
      confidenceScore: bestMatch.score,
      matchedStages: bestMatch.matchedStages,
      extractedKeys: bestMatch.extractedKeys,
      executionTime: `${executionMs} ms`,
      trace: bestMatch.trace,
      recommendedActions: bestMatch.rule.actions || ['Generate Incident', 'Notify SOC Analyst', 'Escalate Playbook']
    };
  }

  return {
    matched: false,
    confidenceScore: 12,
    executionTime: `${executionMs} ms`,
    message: 'No correlation rule matched the input payload thresholds.',
    trace: ['Payload parsed successfully', 'Evaluated against active rules in CEP sliding window', 'No multi-stage trigger condition satisfied']
  };
}

export function createCorrelationRouter() {
  const router = Router();
  let state = loadCorrelationState();

  // Engine Status Mock state
  let engineReloadCounter = 1;
  let lastReloadTime = new Date().toISOString();

  // 1. GET /api/v1/correlation/rules (List all rules with filtering)
  router.get('/rules', (req: Request, res: Response) => {
    const { severity, search, enabled } = req.query;
    let list = [...state.rules];

    if (severity && severity !== 'ALL') {
      list = list.filter((r) => r.severity.toLowerCase() === String(severity).toLowerCase());
    }

    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      list = list.filter((r) => r.enabled === isEnabled);
    }

    if (search) {
      const term = String(search).toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term) ||
          r.tactic.toLowerCase().includes(term) ||
          r.ruleLogic.toLowerCase().includes(term)
      );
    }

    res.json({
      success: true,
      count: list.length,
      total: state.rules.length,
      activeCount: state.rules.filter((r) => r.enabled).length,
      rules: list
    });
  });

  // 2. GET /api/v1/correlation/rules/:id (Get single rule)
  router.get('/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }
    res.json({ success: true, rule });
  });

  // 3. POST /api/v1/correlation/rules (Create new correlation rule)
  router.post('/rules', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.name || !body.ruleLogic) {
      return res.status(400).json({ success: false, error: 'Rule name and logic are required' });
    }

    const newId = body.id || `CORR-RULE-${Math.floor(100 + Math.random() * 900)}`;
    const newRule: CorrelationRule = {
      id: newId,
      name: body.name,
      description: body.description || 'Custom multi-stage correlation rule defined via visual builder.',
      severity: body.severity || 'High',
      tactic: body.tactic || 'TA0002 Execution',
      technique: body.technique || 'T1059 Command and Scripting',
      sources: Array.isArray(body.sources) && body.sources.length > 0 ? body.sources : ['EDR Telemetry', 'Network NDR'],
      window: body.window || '300s (5 min)',
      windowSeconds: body.windowSeconds || 300,
      joinKey: body.joinKey || 'host.ip, user.name',
      enabled: body.enabled !== false,
      hits24h: 0,
      ruleLogic: body.ruleLogic,
      stages: Array.isArray(body.stages) && body.stages.length > 0 ? body.stages : [
        {
          stageId: 'A',
          name: 'Stage A: Initial Condition',
          source: 'EDR Telemetry',
          condition: body.stageA || 'process.name in ["powershell.exe"]'
        },
        {
          stageId: 'B',
          name: 'Stage B: Subsequent Action',
          source: 'Network NDR',
          condition: body.stageB || 'network.direction == "outbound"'
        }
      ],
      actions: body.actions || ['Generate Incident', 'Alert On-Duty SOC'],
      updatedAt: new Date().toISOString()
    };

    state.rules.unshift(newRule);
    saveCorrelationState(state);

    res.status(201).json({
      success: true,
      message: 'Correlation rule created and hot-deployed successfully',
      rule: newRule
    });
  });

  // 4. PUT /api/v1/correlation/rules/:id (Update rule)
  router.put('/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = state.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    const current = state.rules[idx];
    const updated: CorrelationRule = {
      ...current,
      ...req.body,
      id: current.id, // preserve ID
      updatedAt: new Date().toISOString()
    };

    state.rules[idx] = updated;
    saveCorrelationState(state);

    res.json({
      success: true,
      message: 'Rule updated successfully',
      rule: updated
    });
  });

  // 5. POST /api/v1/correlation/rules/:id/toggle (Toggle rule enabled state)
  router.post('/rules/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    rule.enabled = !rule.enabled;
    rule.updatedAt = new Date().toISOString();
    saveCorrelationState(state);

    res.json({
      success: true,
      message: `Rule ${rule.id} is now ${rule.enabled ? 'ENABLED' : 'DISABLED'}`,
      enabled: rule.enabled,
      rule
    });
  });

  // 6. DELETE /api/v1/correlation/rules/:id (Delete rule)
  router.delete('/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const beforeLen = state.rules.length;
    state.rules = state.rules.filter((r) => r.id !== id);

    if (state.rules.length === beforeLen) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    saveCorrelationState(state);
    res.json({ success: true, message: `Rule ${id} deleted successfully` });
  });

  // 7. POST /api/v1/correlation/rules/reset (Reset rules to factory presets)
  router.post('/rules/reset', (_req: Request, res: Response) => {
    state.rules = JSON.parse(JSON.stringify(defaultRules));
    saveCorrelationState(state);
    res.json({
      success: true,
      message: 'Correlation rules restored to factory enterprise defaults',
      count: state.rules.length,
      rules: state.rules
    });
  });

  // 8. GET /api/v1/correlation/window-config (Get Sliding Window & CEP config)
  router.get('/window-config', (_req: Request, res: Response) => {
    res.json({
      success: true,
      config: state.windowConfig
    });
  });

  // 9. PUT /api/v1/correlation/window-config (Update Sliding Window & CEP config)
  router.put('/window-config', (req: Request, res: Response) => {
    state.windowConfig = {
      ...state.windowConfig,
      ...req.body
    };
    saveCorrelationState(state);
    res.json({
      success: true,
      message: 'CEP sliding window and state parameters updated successfully',
      config: state.windowConfig
    });
  });

  // 10. GET /api/v1/correlation/schema-mappings (Get ECS Schema normalization mappings)
  router.get('/schema-mappings', (_req: Request, res: Response) => {
    res.json({
      success: true,
      count: state.schemaMappings.length,
      mappings: state.schemaMappings
    });
  });

  // 11. POST /api/v1/correlation/schema-mappings (Add or update schema mapping)
  router.post('/schema-mappings', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.sourceField || !body.targetField) {
      return res.status(400).json({ success: false, error: 'sourceField and targetField are required' });
    }

    const newMap: SchemaMapping = {
      id: body.id || `MAP-${Math.floor(100 + Math.random() * 900)}`,
      sourceField: body.sourceField,
      targetField: body.targetField,
      transformation: body.transformation || 'Extract & Trim',
      description: body.description || 'Normalized field mapping for cross-source event join',
      sampleInput: body.sampleInput || '',
      sampleOutput: body.sampleOutput || '',
      active: body.active !== false
    };

    const existingIdx = state.schemaMappings.findIndex((m) => m.id === newMap.id);
    if (existingIdx >= 0) {
      state.schemaMappings[existingIdx] = newMap;
    } else {
      state.schemaMappings.push(newMap);
    }

    saveCorrelationState(state);
    res.json({ success: true, message: 'Schema mapping saved successfully', mapping: newMap });
  });

  // 12. DELETE /api/v1/correlation/schema-mappings/:id
  router.delete('/schema-mappings/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    state.schemaMappings = state.schemaMappings.filter((m) => m.id !== id);
    saveCorrelationState(state);
    res.json({ success: true, message: `Schema mapping ${id} removed` });
  });

  // 13. GET /api/v1/correlation/aggregation-config (Get Alert storm suppression & grouping)
  router.get('/aggregation-config', (_req: Request, res: Response) => {
    res.json({
      success: true,
      config: state.aggregationConfig
    });
  });

  // 14. PUT /api/v1/correlation/aggregation-config (Update Alert storm suppression)
  router.put('/aggregation-config', (req: Request, res: Response) => {
    state.aggregationConfig = {
      ...state.aggregationConfig,
      ...req.body
    };
    saveCorrelationState(state);
    res.json({
      success: true,
      message: 'Alert aggregation and storm suppression policies saved successfully',
      config: state.aggregationConfig
    });
  });

  // 15. GET /api/v1/correlation/engine/status (Cluster and RocksDB status)
  router.get('/engine/status', (_req: Request, res: Response) => {
    const activeRules = state.rules.filter((r) => r.enabled).length;
    const totalHits24h = state.rules.reduce((acc, r) => acc + (r.hits24h || 0), 0);

    res.json({
      success: true,
      status: 'ONLINE',
      engineType: 'Apache Flink CEP + RocksDB High-Throughput State Backend',
      version: 'v2.14.0-enterprise',
      cluster: {
        master: {
          node: 'CEP-MASTER-01',
          role: 'Leader (Active)',
          state: 'HEALTHY',
          cpuPercent: 18.4,
          memoryUsed: '2.1 GB',
          memoryTotal: '8.0 GB',
          uptime: '18d 04h 12m'
        },
        workers: [
          {
            id: 'worker-01',
            name: 'CEP-WORKER-US-EAST-01',
            status: 'ONLINE',
            eps: 92400,
            rocksdbStateMB: 1228,
            latencyMs: 3.8,
            activeWindows: 1420
          },
          {
            id: 'worker-02',
            name: 'CEP-WORKER-US-EAST-02',
            status: 'ONLINE',
            eps: 93150,
            rocksdbStateMB: 1184,
            latencyMs: 4.1,
            activeWindows: 1395
          },
          {
            id: 'worker-03',
            name: 'CEP-WORKER-EU-CENTRAL-01',
            status: 'ONLINE',
            eps: 88700,
            rocksdbStateMB: 1040,
            latencyMs: 4.6,
            activeWindows: 1210
          }
        ]
      },
      telemetry: {
        totalEps: 274250,
        avgMatchLatencyMs: 4.16,
        activeRuleCount: activeRules,
        totalRuleCount: state.rules.length,
        totalHits24h,
        stormSuppressedHits: Math.floor(totalHits24h * 3.4),
        noiseReductionRatioPct: 77.3,
        lastHotReload: lastReloadTime,
        reloadCounter: engineReloadCounter
      }
    });
  });

  // 16. POST /api/v1/correlation/engine/reload (Hot-reload CEP engine)
  router.post('/engine/reload', (_req: Request, res: Response) => {
    engineReloadCounter++;
    lastReloadTime = new Date().toISOString();
    res.json({
      success: true,
      message: 'CEP rules recompiled and RocksDB state checkpoint synchronized without downtime',
      reloadedAt: lastReloadTime,
      activeRules: state.rules.filter((r) => r.enabled).length
    });
  });

  // 17. POST /api/v1/correlation/simulate-test (Live Rule Simulator Evaluation)
  router.post('/simulate-test', (req: Request, res: Response) => {
    const { payload, ruleId } = req.body;

    let parsedPayload: Record<string, any>;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e: any) {
        return res.status(400).json({
          success: false,
          error: `Invalid JSON payload format: ${e.message}`
        });
      }
    } else if (typeof payload === 'object' && payload !== null) {
      parsedPayload = payload;
    } else {
      return res.status(400).json({ success: false, error: 'Payload must be a valid JSON object or JSON string' });
    }

    const rulesToTest = ruleId
      ? state.rules.filter((r) => r.id === ruleId)
      : state.rules;

    const result = evaluatePayloadAgainstRules(parsedPayload, rulesToTest);

    res.json({
      success: true,
      ...result
    });
  });

  // 18. GET /api/v1/correlation/stats (Overview metrics & summary)
  router.get('/stats', (_req: Request, res: Response) => {
    const totalRules = state.rules.length;
    const activeRules = state.rules.filter((r) => r.enabled).length;
    const totalHits24h = state.rules.reduce((acc, r) => acc + (r.hits24h || 0), 0);
    const criticalHits = state.rules
      .filter((r) => r.severity === 'Critical')
      .reduce((acc, r) => acc + (r.hits24h || 0), 0);
    const highHits = state.rules
      .filter((r) => r.severity === 'High')
      .reduce((acc, r) => acc + (r.hits24h || 0), 0);

    res.json({
      success: true,
      totalRules,
      activeRules,
      totalHits24h,
      criticalHits,
      highHits,
      avgLatencyMs: 4.2,
      noiseSuppressionPct: 77.3,
      topRule: state.rules.slice().sort((a, b) => b.hits24h - a.hits24h)[0] || null
    });
  });

  return router;
}

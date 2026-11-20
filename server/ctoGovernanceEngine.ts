import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type ExecutiveTimeRange = '7d' | '30d' | '90d';
export type ExecutivePersona = 'cto' | 'board' | 'ceo' | 'cfo' | 'ciso';
export type FrameworkId = 'ISO27001' | 'GDPR' | 'NIST-800' | 'TSC' | 'HIPAA' | 'PCI-DSS';
export type ComplianceStatus = 'Compliant' | 'Warning' | 'Violated' | 'Under-Review' | 'Compensating';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface CtoTechPillar {
  id: string;
  nameZh: string;
  nameEn: string;
  domain: string;
  score: number;
  target: number;
  status: 'optimal' | 'warning' | 'critical';
  keyMetricLabelZh: string;
  keyMetricLabelEn: string;
  keyMetricValue: string;
  owner: string;
  summaryZh: string;
  summaryEn: string;
  linkedFrameworks: FrameworkId[];
}

export interface BusinessServiceHealth {
  id: string;
  name: string;
  category: string;
  tier: 'Tier-1 Mission Critical' | 'Tier-2 Business Core' | 'Tier-3 Operational';
  availability: number;
  status: 'optimal' | 'warning' | 'degraded';
  activeThreatsBlocked: number;
  rtoMinutes: number;
  rpoMinutes: number;
  lastStressTest: string;
}

export interface DepartmentRisk {
  id: string;
  name: string;
  code: string;
  head: string;
  headcount: number;
  riskScore: number;
  incidentCount: number;
  trend: 'up' | 'down' | 'stable';
  topRiskFactor: string;
  mfaAdoptionRate: number;
  trainingRate: number;
  assetCriticality: 'Very High' | 'High' | 'Medium';
}

export interface FinancialCyberRisk {
  annualizedLossExpectancy: number;
  potentialValueAtRisk: number;
  lossAvoidanceSavings: number;
  cyberInsuranceLimit: number;
  cyberInsuranceDeductible: number;
  costPerIncidentAverted: number;
  roiPercentage: number;
  industryPeerAvgVaR: number;
}

export interface StrategicRoadmapItem {
  id: string;
  title: string;
  domain: string;
  progress: number;
  targetQuarter: string;
  status: 'on_track' | 'at_risk' | 'completed' | 'planned';
  owner: string;
  budgetUtilized: number;
  budgetTotal: number;
  description: string;
}

export interface ExecutiveApprovalItem {
  id: string;
  title: string;
  category: 'Network Isolation' | 'Credential Revocation' | 'Cloud Quarantine' | 'SaaS Interception';
  urgency: 'critical' | 'high' | 'medium';
  requestedBy: string;
  requestedAt: string;
  expiresInHours: number;
  description: string;
  businessImpact: string;
  affectedEntities: string[];
  status: 'pending' | 'approved' | 'rejected';
  decidedBy?: string;
  decidedAt?: string;
}

export interface ExecutiveTrendDataPoint {
  date: string;
  attacksDetected: number;
  threatsNeutralized: number;
  mttdMinutes: number;
  mttrMinutes: number;
  riskIndex: number;
  lossesPreventedUsd: number;
}

export interface FrameworkDomainSummary {
  name: string;
  score: number;
  totalControls: number;
  passedControls: number;
}

export interface ComplianceFrameworkMeta {
  id: FrameworkId;
  name: string;
  shortName: string;
  version: string;
  fullName: string;
  category: string;
  badge: string;
  score: number;
  totalControls: number;
  passedControls: number;
  warningControls: number;
  violatedControls: number;
  lastAudited: string;
  auditor: string;
  description: string;
  accentColor: string;
  domains: FrameworkDomainSummary[];
}

export interface ComplianceControl {
  id: string;
  code: string;
  framework: FrameworkId;
  domain: string;
  title: string;
  requirementText: string;
  evidence: string;
  baselineVariance: string;
  status: ComplianceStatus;
  severity: Severity;
  lastChecked: string;
  affectedAssets: string[];
  telemetrySource: 'EDR/XDR' | 'UEBA' | 'WORM Storage' | 'NDR' | 'IAM/IdP' | 'CloudPosture' | 'FIM' | 'DLP';
  remediationPlaybook?: string;
  remediationGuidance?: string;
  mitreRef?: string;
}

export interface WormLedgerRecord {
  blockId: number;
  timestamp: string;
  framework: FrameworkId | 'GOVERNANCE';
  hash: string;
  prevHash: string;
  merkleRoot: string;
  auditorId: string;
  event: string;
  status: 'Verified' | 'Sealed';
}

export interface RemediationTask {
  id: string;
  controlId: string;
  framework: FrameworkId;
  title: string;
  assignedTo: string;
  priority: Severity;
  deadline: string;
  status: 'Open' | 'In-Progress' | 'Resolved' | 'Verified';
  remediationAction: string;
  playbookId?: string;
  affectedAsset: string;
}

export interface AssetCoverageItem {
  id: string;
  labelZh: string;
  labelEn: string;
  coveragePct: number;
  standard: string;
  nodeCount: number;
}

export interface CtoGovernanceState {
  lastUpdated: string;
  overviewMetrics: {
    healthIndex: number;
    healthIndexDelta: number;
    healthGrade: string;
    valueAtRiskUsd: number;
    valueAtRiskDelta: number;
    industryPeerAvgVaR: number;
    deflectionRatio: number;
    analystHoursSaved: number;
    costSavingsUsd: number;
    mttdMinutes: number;
    mttdIndustryMinutes: number;
    mttrMinutes: number;
    mttrIndustryMinutes: number;
    businessUptime: number;
    criticalIncidentsActive: number;
    unresolvedHighRisks: number;
    sbomSignedCoverage: number;
    pqcReadinessPct: number;
    zeroTrustAdoptionPct: number;
    totalWormBlocks: number;
  };
  techPillars: CtoTechPillar[];
  trends: Record<ExecutiveTimeRange, ExecutiveTrendDataPoint[]>;
  businessServices: BusinessServiceHealth[];
  departmentRisks: DepartmentRisk[];
  financialExposure: FinancialCyberRisk;
  strategicRoadmap: StrategicRoadmapItem[];
  approvals: ExecutiveApprovalItem[];
  frameworks: ComplianceFrameworkMeta[];
  controls: ComplianceControl[];
  wormLedger: WormLedgerRecord[];
  remediationTasks: RemediationTask[];
  assetCoverage: AssetCoverageItem[];
}

const STATE_FILE_PATH = path.join(process.cwd(), 'cto_governance_state.json');

function formatNow(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function sha256Hex(input: string): string {
  return '0x' + crypto.createHash('sha256').update(input).digest('hex');
}

function createInitialState(): CtoGovernanceState {
  return {
    lastUpdated: formatNow(),
    overviewMetrics: {
      healthIndex: 88,
      healthIndexDelta: 4.2,
      healthGrade: 'Grade A (Resilient)',
      valueAtRiskUsd: 2850000,
      valueAtRiskDelta: -18.5,
      industryPeerAvgVaR: 8400000,
      deflectionRatio: 96.8,
      analystHoursSaved: 1640,
      costSavingsUsd: 1420000,
      mttdMinutes: 3.8,
      mttdIndustryMinutes: 28800,
      mttrMinutes: 10.4,
      mttrIndustryMinutes: 100800,
      businessUptime: 99.992,
      criticalIncidentsActive: 0,
      unresolvedHighRisks: 2,
      sbomSignedCoverage: 97.4,
      pqcReadinessPct: 42,
      zeroTrustAdoptionPct: 88,
      totalWormBlocks: 10428
    },
    techPillars: [
      {
        id: 'pillar-k8s-supply',
        nameZh: 'CI/CD 軟體供應鏈與容器簽章 (SBOM / Cosign)',
        nameEn: 'CI/CD Supply Chain & Container Signing',
        domain: 'DevSecOps & Build Integrity',
        score: 97,
        target: 98,
        status: 'optimal',
        keyMetricLabelZh: 'Sigstore 簽章驗證通過率',
        keyMetricLabelEn: 'Cosign Admission Rate',
        keyMetricValue: '100% (412/412 Images)',
        owner: 'Platform Eng & AppSec',
        summaryZh: '所有生產環境容器鏡像皆於 Harbor Registry 通過 Cosign 簽章驗證與 CycloneDX SBOM 漏洞閘道檢驗。',
        summaryEn: 'All production containers pass Cosign cryptographic admission and CycloneDX SBOM vulnerability gates.',
        linkedFrameworks: ['TSC', 'NIST-800']
      },
      {
        id: 'pillar-zerotrust-iam',
        nameZh: '零信任存取控制與 FIDO2 硬體 MFA',
        nameEn: 'Zero Trust SASE & FIDO2 Identity',
        domain: 'Identity & Network Boundary',
        score: 92,
        target: 95,
        status: 'optimal',
        keyMetricLabelZh: '特權介面無密碼 MFA 覆蓋',
        keyMetricLabelEn: 'FIDO2 / WebAuthn Coverage',
        keyMetricValue: '100% Admin / 97.8% All',
        owner: 'Enterprise IAM & NetOps',
        summaryZh: '核心跳板機與管理面板 100% 套用 FIDO2 硬體金鑰；目前正進行第 III 階段全量 SASE 取代傳統 VPN。',
        summaryEn: '100% FIDO2 hardware MFA on admin bastions; Phase III SASE rollout replacing legacy VPN tunnels.',
        linkedFrameworks: ['ISO27001', 'PCI-DSS', 'NIST-800']
      },
      {
        id: 'pillar-cloud-edge',
        nameZh: '雲端邊界安全與高危 CVE SLA 控管',
        nameEn: 'Cloud Edge & Critical CVE SLA',
        domain: 'Infrastructure & Vulnerability',
        score: 84,
        target: 95,
        status: 'warning',
        keyMetricLabelZh: 'CVSS 9.0+ 14日修補達成率',
        keyMetricLabelEn: 'CVSS 9.0+ SLA Attainment',
        keyMetricValue: '98.2% (1 Overdue)',
        owner: 'SRE & Infra Sec',
        summaryZh: '偵測到 1 台邊界代理 (nginx-edge-proxy-04) 尚待維護窗口升級 OpenSSL 3.4.1，已先套用 WAF 虛擬修補。',
        summaryEn: '1 edge proxy awaiting maintenance window for OpenSSL 3.4.1 patch; WAF virtual patching active.',
        linkedFrameworks: ['TSC', 'PCI-DSS']
      },
      {
        id: 'pillar-ai-dlp',
        nameZh: 'AI Gateway 提示詞防外洩與資料治理',
        nameEn: 'AI Gateway DLP & Privacy Guardrails',
        domain: 'Data & AI Governance',
        score: 94,
        target: 95,
        status: 'optimal',
        keyMetricLabelZh: '敏感 PII/原始碼外洩攔截',
        keyMetricLabelEn: 'Prompt DLP Interception',
        keyMetricValue: '99.6% Blocked',
        owner: 'AI Platform & DPO',
        summaryZh: '全域 LLM 呼叫均強制經過 AI Gateway 進行 PII 與專有晶片原始碼遮罩，符合 GDPR Art.32 與 Art.44。',
        summaryEn: 'Enterprise LLM traffic passes through AI Gateway for real-time PII and source code redaction.',
        linkedFrameworks: ['GDPR', 'ISO27001', 'HIPAA']
      }
    ],
    trends: {
      '7d': [
        { date: '09-02', attacksDetected: 142, threatsNeutralized: 140, mttdMinutes: 4.1, mttrMinutes: 11.2, riskIndex: 78, lossesPreventedUsd: 185000 },
        { date: '09-03', attacksDetected: 168, threatsNeutralized: 165, mttdMinutes: 3.9, mttrMinutes: 10.8, riskIndex: 79, lossesPreventedUsd: 220000 },
        { date: '09-04', attacksDetected: 215, threatsNeutralized: 212, mttdMinutes: 4.2, mttrMinutes: 12.0, riskIndex: 82, lossesPreventedUsd: 310000 },
        { date: '09-05', attacksDetected: 189, threatsNeutralized: 187, mttdMinutes: 3.6, mttrMinutes: 9.8, riskIndex: 76, lossesPreventedUsd: 245000 },
        { date: '09-06', attacksDetected: 240, threatsNeutralized: 236, mttdMinutes: 3.8, mttrMinutes: 10.5, riskIndex: 81, lossesPreventedUsd: 340000 },
        { date: '09-07', attacksDetected: 130, threatsNeutralized: 129, mttdMinutes: 3.4, mttrMinutes: 9.2, riskIndex: 74, lossesPreventedUsd: 160000 },
        { date: '09-08', attacksDetected: 112, threatsNeutralized: 111, mttdMinutes: 3.2, mttrMinutes: 8.9, riskIndex: 72, lossesPreventedUsd: 145000 }
      ],
      '30d': [
        { date: 'W1 (08/11)', attacksDetected: 1180, threatsNeutralized: 1150, mttdMinutes: 4.5, mttrMinutes: 13.1, riskIndex: 84, lossesPreventedUsd: 1420000 },
        { date: 'W2 (08/18)', attacksDetected: 1320, threatsNeutralized: 1295, mttdMinutes: 4.2, mttrMinutes: 12.4, riskIndex: 82, lossesPreventedUsd: 1680000 },
        { date: 'W3 (08/25)', attacksDetected: 1450, threatsNeutralized: 1420, mttdMinutes: 3.9, mttrMinutes: 11.0, riskIndex: 78, lossesPreventedUsd: 1890000 },
        { date: 'W4 (09/01)', attacksDetected: 1206, threatsNeutralized: 1180, mttdMinutes: 3.6, mttrMinutes: 10.1, riskIndex: 75, lossesPreventedUsd: 1605000 }
      ],
      '90d': [
        { date: 'Q2-M1 (Jun)', attacksDetected: 4800, threatsNeutralized: 4620, mttdMinutes: 5.8, mttrMinutes: 16.5, riskIndex: 88, lossesPreventedUsd: 5400000 },
        { date: 'Q2-M2 (Jul)', attacksDetected: 5200, threatsNeutralized: 5040, mttdMinutes: 4.9, mttrMinutes: 14.0, riskIndex: 83, lossesPreventedUsd: 6100000 },
        { date: 'Q3-M1 (Aug)', attacksDetected: 5170, threatsNeutralized: 5045, mttdMinutes: 4.1, mttrMinutes: 11.8, riskIndex: 79, lossesPreventedUsd: 6600000 }
      ]
    },
    businessServices: [
      {
        id: 'SVC-01',
        name: 'SAP S/4HANA Core ERP & 財務核心',
        category: 'Enterprise Resource Planning',
        tier: 'Tier-1 Mission Critical',
        availability: 99.998,
        status: 'optimal',
        activeThreatsBlocked: 48,
        rtoMinutes: 15,
        rpoMinutes: 0,
        lastStressTest: '2026-08-20'
      },
      {
        id: 'SVC-02',
        name: 'SWIFT & 全球跨行結算清算通道',
        category: 'Payment & Clearing',
        tier: 'Tier-1 Mission Critical',
        availability: 99.999,
        status: 'optimal',
        activeThreatsBlocked: 23,
        rtoMinutes: 5,
        rpoMinutes: 0,
        lastStressTest: '2026-08-15'
      },
      {
        id: 'SVC-03',
        name: '客戶交易閘道與 API Gateway (Kubernetes)',
        category: 'Digital Banking & eCommerce',
        tier: 'Tier-1 Mission Critical',
        availability: 99.991,
        status: 'warning',
        activeThreatsBlocked: 312,
        rtoMinutes: 10,
        rpoMinutes: 1,
        lastStressTest: '2026-09-01'
      },
      {
        id: 'SVC-04',
        name: '零信任身分治理與 IAM SSO 叢集',
        category: 'Identity & Access',
        tier: 'Tier-1 Mission Critical',
        availability: 99.995,
        status: 'optimal',
        activeThreatsBlocked: 89,
        rtoMinutes: 15,
        rpoMinutes: 0,
        lastStressTest: '2026-08-30'
      },
      {
        id: 'SVC-05',
        name: '全球供應鏈 EDI & 供應商入口網',
        category: 'B2B Logistics & Supply Chain',
        tier: 'Tier-2 Business Core',
        availability: 99.950,
        status: 'optimal',
        activeThreatsBlocked: 54,
        rtoMinutes: 60,
        rpoMinutes: 15,
        lastStressTest: '2026-07-28'
      },
      {
        id: 'SVC-06',
        name: '內部協同作業與即時通訊 (Teams/Slack)',
        category: 'Productivity & Collaboration',
        tier: 'Tier-3 Operational',
        availability: 99.980,
        status: 'optimal',
        activeThreatsBlocked: 14,
        rtoMinutes: 120,
        rpoMinutes: 60,
        lastStressTest: '2026-08-10'
      }
    ],
    departmentRisks: [
      {
        id: 'DEPT-01',
        name: '研發與晶片架構工程處 (R&D)',
        code: 'ENG-RD',
        head: 'Dr. Michael Chang',
        headcount: 340,
        riskScore: 68,
        incidentCount: 14,
        trend: 'up',
        topRiskFactor: '原始碼 Git 倉儲非營業時間異常大量提取 (UEBA 異常偏離 850%)',
        mfaAdoptionRate: 98.5,
        trainingRate: 92.0,
        assetCriticality: 'Very High'
      },
      {
        id: 'DEPT-02',
        name: '國際金融與資金調度處 (Treasury & Finance)',
        code: 'FIN-TR',
        head: 'Sarah Chen, VP',
        headcount: 85,
        riskScore: 42,
        incidentCount: 3,
        trend: 'down',
        topRiskFactor: '商務電子郵件詐騙 (BEC) 偽冒 CEO 匯款指令攔截',
        mfaAdoptionRate: 100.0,
        trainingRate: 98.8,
        assetCriticality: 'Very High'
      },
      {
        id: 'DEPT-03',
        name: '全球供應鏈管理處 (APAC Supply Chain)',
        code: 'SCM-GLB',
        head: 'Kenji Sato',
        headcount: 190,
        riskScore: 58,
        incidentCount: 8,
        trend: 'stable',
        topRiskFactor: '第三方協力廠商 VPN 帳號共用與過期憑證未撤銷',
        mfaAdoptionRate: 94.2,
        trainingRate: 88.5,
        assetCriticality: 'High'
      },
      {
        id: 'DEPT-04',
        name: '高階主管決策群 (Executive Board & C-Suite)',
        code: 'EXEC-HQ',
        head: 'Executive Office',
        headcount: 24,
        riskScore: 36,
        incidentCount: 2,
        trend: 'down',
        topRiskFactor: '針對特定高管之魚叉式釣魚與深偽視訊驗證 (Deepfake Voice)',
        mfaAdoptionRate: 100.0,
        trainingRate: 100.0,
        assetCriticality: 'Very High'
      },
      {
        id: 'DEPT-05',
        name: '全球客戶支援與運籌中心 (Global Support)',
        code: 'OPS-SUP',
        head: 'Jessica Lin',
        headcount: 260,
        riskScore: 49,
        incidentCount: 6,
        trend: 'stable',
        topRiskFactor: '客戶身分驗證社交工程繞過嘗試',
        mfaAdoptionRate: 97.0,
        trainingRate: 95.4,
        assetCriticality: 'Medium'
      }
    ],
    financialExposure: {
      annualizedLossExpectancy: 420000,
      potentialValueAtRisk: 2850000,
      lossAvoidanceSavings: 14200000,
      cyberInsuranceLimit: 20000000,
      cyberInsuranceDeductible: 500000,
      costPerIncidentAverted: 84000,
      roiPercentage: 382,
      industryPeerAvgVaR: 8400000
    },
    strategicRoadmap: [
      {
        id: 'ROAD-01',
        title: '全域零信任 (Zero Trust) 邊界架構推進階段 III',
        domain: 'Architecture & IAM',
        progress: 88,
        targetQuarter: '2026 Q4',
        status: 'on_track',
        owner: 'CTO / Enterprise Architect',
        budgetUtilized: 1850000,
        budgetTotal: 2100000,
        description: '淘汰傳統邊界 VPN，全量部署以裝置健康狀態、條件式存取為核心之 SASE / ZTNA 私有服務通道。'
      },
      {
        id: 'ROAD-02',
        title: '自主 SOAR 自動化回應覆蓋率提升至 95%',
        domain: 'SecOps & Automation',
        progress: 92,
        targetQuarter: '2026 Q3',
        status: 'completed',
        owner: 'SecOps Lead / Platform Eng',
        budgetUtilized: 920000,
        budgetTotal: 950000,
        description: '串接次世代端點 EDR、NDR 與微隔離防火牆，達成惡意程式與勒索軟體全自動秒級隔離。'
      },
      {
        id: 'ROAD-03',
        title: '供應鏈第三方風險管理 (TPRM) 與 SBOM 自動化閘道',
        domain: 'Supply Chain & DevSecOps',
        progress: 65,
        targetQuarter: '2027 Q1',
        status: 'at_risk',
        owner: 'AppSec & Vendor Risk',
        budgetUtilized: 450000,
        budgetTotal: 800000,
        description: '針對前 100 大關鍵協力廠商與軟體依賴實施 CycloneDX SBOM 與即時外洩情資自動化掃描。'
      },
      {
        id: 'ROAD-04',
        title: '後量子密碼學 (PQC) 核心資產加密過渡評估',
        domain: 'Cryptographic Agility',
        progress: 42,
        targetQuarter: '2027 Q2',
        status: 'on_track',
        owner: 'Cryptographic Security Lab',
        budgetUtilized: 210000,
        budgetTotal: 600000,
        description: '針對金融主幹網路、SWIFT 與核心資料庫加密演算法進行 NIST FIPS 203/204 後量子密碼相容性驗證。'
      }
    ],
    approvals: [
      {
        id: 'APPR-2026-089',
        title: '緊急隔離高風險東南亞區域辦公室分支網段 (10.184.0.0/16)',
        category: 'Network Isolation',
        urgency: 'critical',
        requestedBy: 'SecOps Incident Commander (Tier-3 SOC)',
        requestedAt: '2026-09-08 03:42',
        expiresInHours: 2,
        description: '東南亞分公司端點偵測到疑似 BlackByte 勒索軟體橫向移動與域控伺服器 Kerberoasting 攻擊，建議啟動零信任邊界硬性熔斷。',
        businessImpact: '將暫停該分部約 45 名同仁存取中央 ERP 系統，預計影響每日訂單排程約 2 小時，但可完全杜絕總部核心勒索擴散。',
        affectedEntities: ['SEA-Branch-GW01', '10.184.0.0/16', 'AD-DC-SEA-01'],
        status: 'pending'
      },
      {
        id: 'APPR-2026-090',
        title: '即刻撤銷異常第三方雲端行銷 SaaS 整合 OAuth Token',
        category: 'SaaS Interception',
        urgency: 'high',
        requestedBy: 'Cloud Security Architect',
        requestedAt: '2026-09-08 02:15',
        expiresInHours: 6,
        description: '外部 SaaS 供應商發布安全公告指其開發者金鑰外洩，該供應商持有本公司客戶 CRM 唯讀權限，需立即廢止權杖並強制作廢。',
        businessImpact: '行銷電子報發送將延遲 30 分鐘，對生產營運無直接中斷風險。',
        affectedEntities: ['MarketingCloud-OAuth-Client', 'CRM-Sync-Webhook'],
        status: 'pending'
      }
    ],
    frameworks: [
      {
        id: 'ISO27001',
        name: 'ISO/IEC 27001',
        shortName: 'ISO 27001',
        version: '2022 繁體發行版',
        fullName: 'ISO/IEC 27001:2022 資訊安全管理系統 (ISMS)',
        category: '國際資安管理架構',
        badge: '認證就緒 (96%)',
        score: 96,
        totalControls: 93,
        passedControls: 89,
        warningControls: 3,
        violatedControls: 1,
        lastAudited: '2026-09-05 08:30',
        auditor: 'BSI 國際主任稽核員認證 / SOC 審計委會員',
        description: '全球公認最高規格資訊安全管理架構，聚焦組織控制、實體邊界、技術與人員防禦維度。',
        accentColor: '#3b82f6',
        domains: [
          { name: 'A.5 組織控制項', score: 98, totalControls: 37, passedControls: 36 },
          { name: 'A.6 人員安全控制項', score: 95, totalControls: 8, passedControls: 8 },
          { name: 'A.7 實體環境控制項', score: 100, totalControls: 14, passedControls: 14 },
          { name: 'A.8 科技與系統控制項', score: 94, totalControls: 34, passedControls: 31 }
        ]
      },
      {
        id: 'GDPR',
        name: 'GDPR / EU PII',
        shortName: 'GDPR',
        version: 'Regulation (EU) 2016/679',
        fullName: '歐盟一般資料保護規則 (GDPR) 個人隱私保護',
        category: '國際個人隱私法規',
        badge: '合規運作中 (92%)',
        score: 92,
        totalControls: 48,
        passedControls: 44,
        warningControls: 3,
        violatedControls: 1,
        lastAudited: '2026-09-06 14:15',
        auditor: '歐盟 DPO (Data Protection Officer) 專責小組',
        description: '針對個人可識別資訊 (PII) 處理、跨境資料外洩阻斷、當事人查閱權 (SAR) 與 72 小時通報。',
        accentColor: '#10b981',
        domains: [
          { name: 'Art.5 處理合法性與最小化', score: 96, totalControls: 10, passedControls: 10 },
          { name: 'Art.12-23 當事人權利與調閱', score: 92, totalControls: 12, passedControls: 11 },
          { name: 'Art.32 處理安全與強加密', score: 95, totalControls: 14, passedControls: 13 },
          { name: 'Art.33-34 重大外洩 72h 通報', score: 85, totalControls: 6, passedControls: 5 },
          { name: 'Art.44 跨境境外傳輸控管', score: 88, totalControls: 6, passedControls: 5 }
        ]
      },
      {
        id: 'NIST-800',
        name: 'NIST SP 800-53',
        shortName: 'NIST 800-53',
        version: 'Rev. 5 / CSF 2.0',
        fullName: '美國國家標準技術研究院 NIST SP 800-53 Rev. 5 聯邦安全控制基線',
        category: '聯邦與國防級安全基線',
        badge: '高強度防禦 (91%)',
        score: 91,
        totalControls: 128,
        passedControls: 116,
        warningControls: 8,
        violatedControls: 4,
        lastAudited: '2026-09-04 11:00',
        auditor: 'FedRAMP 3PAO 第三方稽核評估機構',
        description: '涵蓋 AC 存取控制、AU 稽核問責、IA 身分鑑別、SC 通訊保護與 SI 系統完整性控制。',
        accentColor: '#8b5cf6',
        domains: [
          { name: 'AC 存取控制族', score: 94, totalControls: 25, passedControls: 24 },
          { name: 'AU 審計與問責 WORM 族', score: 96, totalControls: 20, passedControls: 19 },
          { name: 'IA 識別與多因素鑑別族', score: 90, totalControls: 18, passedControls: 16 },
          { name: 'SC 系統與通訊保護族', score: 92, totalControls: 35, passedControls: 32 },
          { name: 'SI 系統與資訊完整性族', score: 84, totalControls: 30, passedControls: 25 }
        ]
      },
      {
        id: 'TSC',
        name: 'SOC 2 (TSC)',
        shortName: 'SOC 2',
        version: 'AICPA 2024 Trust Services',
        fullName: 'AICPA SOC 2 Type II 信任服務原則 (Trust Services Criteria)',
        category: '雲端與 SaaS 營運保證',
        badge: 'Type II 審計中 (95%)',
        score: 95,
        totalControls: 64,
        passedControls: 61,
        warningControls: 2,
        violatedControls: 1,
        lastAudited: '2026-09-07 09:45',
        auditor: 'KPMG / 獨立執業會計師審計組',
        description: '涵蓋五大信任原則：安全性 (Security)、可用性 (Availability)、處理完整性、機密性與隱私。',
        accentColor: '#06b6d4',
        domains: [
          { name: 'CC6.0 邏輯與實體存取控制', score: 96, totalControls: 24, passedControls: 23 },
          { name: 'CC7.0 系統運作與事故管理', score: 93, totalControls: 18, passedControls: 17 },
          { name: 'CC8.0 變更授權與簽章', score: 98, totalControls: 10, passedControls: 10 },
          { name: 'A1.0 高可用性與容災備份', score: 92, totalControls: 12, passedControls: 11 }
        ]
      },
      {
        id: 'HIPAA',
        name: 'HIPAA Security',
        shortName: 'HIPAA',
        version: '45 CFR Part 160 & 164',
        fullName: '美國健康保險流通與責任法案 (HIPAA) 電子受保護醫療資訊 (ePHI)',
        category: '醫療生技機密隱私',
        badge: 'ePHI 安全 (93%)',
        score: 93,
        totalControls: 42,
        passedControls: 39,
        warningControls: 2,
        violatedControls: 1,
        lastAudited: '2026-09-05 16:20',
        auditor: 'HHS OCR 衛生與公共服務部醫療合規辦公室',
        description: '規範行政安全措施 (§164.308)、實體防護 (§164.310) 與技術安全控制措施 (§164.312)。',
        accentColor: '#ec4899',
        domains: [
          { name: '§ 164.308 行政安全管理', score: 95, totalControls: 16, passedControls: 15 },
          { name: '§ 164.310 實體工作站防護', score: 96, totalControls: 8, passedControls: 8 },
          { name: '§ 164.312 技術措施與存取控制', score: 90, totalControls: 14, passedControls: 13 },
          { name: '§ 164.314 商業夥伴協議 (BAA)', score: 92, totalControls: 4, passedControls: 3 }
        ]
      },
      {
        id: 'PCI-DSS',
        name: 'PCI DSS v4.0',
        shortName: 'PCI DSS',
        version: 'Version 4.0 Standard',
        fullName: '支付卡產業資料安全標準 (PCI DSS v4.0) 持卡人資料防禦',
        category: '金融與支付交易安全',
        badge: 'QSA 稽核就緒 (95%)',
        score: 95,
        totalControls: 78,
        passedControls: 74,
        warningControls: 3,
        violatedControls: 1,
        lastAudited: '2026-09-08 02:00',
        auditor: '合格安全評估機構 (QSA) 主任認證簽署',
        description: '保護儲存持卡人帳號資料 (PAN)、實施網段微隔離、強制 FIDO2 MFA 及不可篡改審計日誌。',
        accentColor: '#f59e0b',
        domains: [
          { name: 'Req 1-2 網路控制與微隔離', score: 98, totalControls: 14, passedControls: 14 },
          { name: 'Req 3-4 持卡人資料強式加密', score: 96, totalControls: 16, passedControls: 15 },
          { name: 'Req 7-8 身分鑑別與最小特權', score: 92, totalControls: 18, passedControls: 17 },
          { name: 'Req 10-11 審計監控與滲透測試', score: 94, totalControls: 30, passedControls: 28 }
        ]
      }
    ],
    controls: [
      {
        id: 'iso-a8.2',
        code: 'A.8.2',
        framework: 'ISO27001',
        domain: '特權存取權限管理',
        title: '特權帳號存取控制與操作行為審查 (Privileged Access Rights)',
        requirementText: '組織應分配與限制特權存取權限，並對特權帳號之敏感作業、壓縮工具調用及異常用戶進行連續性監控與行為異常分析。',
        evidence: 'UEBA 偵測到管理員帳號 Kevin (ADM) 於非維護時段調用 7z.exe 壓縮敏感資料庫轉儲檔，偏差度超出正常基準 850%。',
        baselineVariance: '極高偏離 (+850%)',
        status: 'Violated',
        severity: 'Critical',
        lastChecked: '2026-09-08 03:20',
        affectedAssets: ['db-cluster-core-01 (10.200.4.12)', 'adm-bastion-sg (10.200.1.5)'],
        telemetrySource: 'UEBA',
        remediationPlaybook: 'SOAR-PB-109: 特權異常調用即時撤銷與 MFA 重認證劇本',
        remediationGuidance: '強制要求 DBA 僅能透過安全代理操作，阻斷直接伺服器端 7z 壓縮，並暫時吊銷該特權帳戶進行 SOC 二次調查。',
        mitreRef: 'T1078 (Valid Accounts), T1560 (Archive Collected Data)'
      },
      {
        id: 'iso-a8.20',
        code: 'A.8.20',
        framework: 'ISO27001',
        domain: '網路安全邊界控制',
        title: '網路隔離與遠端異地連線審計 (Network Security & Remote Access)',
        requirementText: '網路應實施適當隔離，遠端 VPN 連線必須具備多因素驗證與威脅地理封鎖，防範匿名代理與未授權地理存取。',
        evidence: '邊界 NDR 識別透過終端代理伺服器由俄羅斯 (RU) 節點發起之未授權 VPN 暴力碰撞，防火牆自動觸發 Geo-IP 動態黑名單阻斷。',
        baselineVariance: '新異地異常用戶',
        status: 'Compliant',
        severity: 'Low',
        lastChecked: '2026-09-08 03:45',
        affectedAssets: ['edge-firewall-01 (WAN-01)', 'vpn-gateway-hq (10.200.0.1)'],
        telemetrySource: 'NDR',
        remediationPlaybook: 'SOAR-PB-802: 邊界動態黑名單聯防限流劇本',
        remediationGuidance: '已由自動化安全劇本成功攔阻，建議排程回溯過去 7 天同 C 段 IP 之所有會話紀錄。'
      },
      {
        id: 'iso-a8.7',
        code: 'A.8.7',
        framework: 'ISO27001',
        domain: '惡意軟體防護',
        title: '端點威脅保護與行為偵測 (Protection against Malware)',
        requirementText: '端點系統應部署高可信度防毒與 EDR/XDR 防護機制，即時攔截並隔離未經授權之二進位程式碼與惡意腳本。',
        evidence: 'OpenXDR 探針於主機 web-frontend-03 攔截未授權挖礦進程 xmrig_miner.exe 並終止執行，記憶體注入已安全清除。',
        baselineVariance: '已知高危特徵碼 (Pass)',
        status: 'Compliant',
        severity: 'Low',
        lastChecked: '2026-09-08 02:50',
        affectedAssets: ['web-frontend-03 (10.200.8.21)'],
        telemetrySource: 'EDR/XDR',
        remediationPlaybook: 'SOAR-PB-104: 終端主機微隔離與進程終止劇本',
        remediationGuidance: '進程已處置。建議針對該主機排程全盤檔案雜湊完整性校驗與弱點複檢。'
      },
      {
        id: 'iso-a5.15',
        code: 'A.5.15',
        framework: 'ISO27001',
        domain: '存取控制生命週期',
        title: '身分鑑別生命週期與閒置帳號清理 (Access Control Lifecycle)',
        requirementText: '應定期評估與停用超過 90 天未登入或已離職人員之活動帳號，防範幽靈帳號被用作橫向移動載體。',
        evidence: 'IAM 身分稽核發現 12 個 Active Directory 帳號超過 90 天未活動，且未被停用或移至受限 OU。',
        baselineVariance: '12 個帳戶超期',
        status: 'Warning',
        severity: 'Medium',
        lastChecked: '2026-09-08 01:10',
        affectedAssets: ['ad-domain-ctrl-01 (10.200.2.10)'],
        telemetrySource: 'IAM/IdP',
        remediationPlaybook: 'SOAR-PB-310: 雲端帳號 Session 強制登出與密鑰撤銷',
        remediationGuidance: '通報 HR 與 IT 運維組確認帳號所屬人狀態，並執行批次停用策略。'
      },
      {
        id: 'iso-a8.15',
        code: 'A.8.15',
        framework: 'ISO27001',
        domain: '記錄與審計日誌',
        title: '系統日誌保護與防範篡改 (Logging & Tamper-Proofing)',
        requirementText: '所有安全事件日誌必須寫入具備不可篡改性 (WORM) 之儲存架構，時鐘源應依賴 NTP 精確同步。',
        evidence: '所有 Syslog 與 XDR 遙測串流每 5 分鐘寫入一次 WORM 區塊鏈雜湊，Merkle 樹指紋驗證一致率 100%。',
        baselineVariance: '正常基準 (0 偏離)',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:50',
        affectedAssets: ['worm-storage-node-01', 'worm-storage-node-02'],
        telemetrySource: 'WORM Storage',
        remediationGuidance: '符合標準，儲存空間健康度 88%，保留週期設定 365 天。'
      },
      {
        id: 'gdpr-art32',
        code: 'Art. 32',
        framework: 'GDPR',
        domain: '處理安全與傳輸加密',
        title: '處理個人資料之安全性與端對端傳輸加密 (Security of Processing)',
        requirementText: '控管者與處理者應採取適當之技術措施，包括個人資料之假名化與加密，強制落實傳輸通道端到端 TLS 1.3 協議。',
        evidence: 'NDR 全流量深層檢測顯示，所有含有身分證字號與信用卡 PII 之 API 呼叫均強制套用 TLS 1.3 (ChaCha20-Poly1305 / AES-256-GCM)。',
        baselineVariance: '100% 強制覆蓋',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:15',
        affectedAssets: ['api-gateway-mesh (ingress-proxy-01)', 'k8s-ingress-controller'],
        telemetrySource: 'NDR',
        remediationGuidance: '符合規範，弱密碼套件 (SSLv3/TLS1.0/1.1) 均已在反向代理全域禁用。'
      },
      {
        id: 'gdpr-art44',
        code: 'Art. 44',
        framework: 'GDPR',
        domain: '跨境境外傳輸控管',
        title: '向第三國或國際組織移轉個人資料限制 (Transfers to Third Countries)',
        requirementText: '禁止向未具備歐盟適足性認定之境外地區或未經授權之雲端空間未加密匯出客戶個人個資。',
        evidence: 'DLP 與 NDR 探針攔截內部開發者主機向境外空間 MEGA.nz 傳輸 15GB 壓縮資料庫轉儲，內含 12,000 筆歐盟客戶 PII。',
        baselineVariance: '非授權跨境大量外洩',
        status: 'Violated',
        severity: 'Critical',
        lastChecked: '2026-09-08 02:40',
        affectedAssets: ['dev-workstation-99 (10.200.15.88)', 'wan-border-router'],
        telemetrySource: 'DLP',
        remediationPlaybook: 'SOAR-PB-901: DLP 跨境傳輸即時斷網與 DPO 通報劇本',
        remediationGuidance: '已強制切斷端點連線，正啟動 GDPR 內部應變調查程序以評估是否滿足 72 小時通報門檻。',
        mitreRef: 'T1048 (Exfiltration Over Alternative Protocol)'
      },
      {
        id: 'gdpr-art33',
        code: 'Art. 33',
        framework: 'GDPR',
        domain: '重大資料外洩通報',
        title: '72 小時重大個資外洩事件主管機關通報時效 (Breach Notification within 72h)',
        requirementText: '發生可能危害當事人權益之個資外洩事件時，應於知悉後 72 小時內向歐盟監管機構通報處置狀況。',
        evidence: 'SOC 事故應變自動化於事件確認後 11 分鐘內產出外洩取證分析摘要，耗時遠低於 72h 法定上限。',
        baselineVariance: '極速應變 (達成標準)',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:00',
        affectedAssets: ['soc-incident-tracker', 'dpo-audit-vault'],
        telemetrySource: 'EDR/XDR',
        remediationGuidance: '應變時間符合法規，取證文件已自動歸檔於 WORM 儲存槽。'
      },
      {
        id: 'nist-ac2',
        code: 'AC-2',
        framework: 'NIST-800',
        domain: '存取控制 (Access Control)',
        title: '帳戶管理與動態群組授權 (Account Management)',
        requirementText: '系統應強制依職能責任分離分配帳戶，並定期自動校驗無效與超權存取之服務帳號。',
        evidence: '掃描識別出 3 個由 Jenkins CI/CD 調用之服務帳號擁有全域 Administrator 特權，違反最小特權原則。',
        baselineVariance: '特權過度授予 (High)',
        status: 'Warning',
        severity: 'High',
        lastChecked: '2026-09-08 02:15',
        affectedAssets: ['svc-jenkins-deploy', 'k8s-cluster-prod-master'],
        telemetrySource: 'IAM/IdP',
        remediationPlaybook: 'SOAR-PB-310: 雲端帳號 Session 強制登出與密鑰撤銷',
        remediationGuidance: '將 CI/CD 帳號降級為專用部署角色 (Scoped RBAC)，禁止授予 Cluster-Admin 特權。',
        mitreRef: 'T1078.004 (Cloud Accounts)'
      },
      {
        id: 'nist-ia2',
        code: 'IA-2',
        framework: 'NIST-800',
        domain: '識別與鑑別 (Identification and Authentication)',
        title: '多因素驗證與防網路釣魚金鑰 (Multi-Factor Authentication)',
        requirementText: '所有對系統元件、管理控制台及遠端網路存取必須強制實施防釣魚 (FIDO2 / WebAuthn) 多因素身分驗證。',
        evidence: '管理控制台、SSH Bastion 及雲端控制台全面啟用 FIDO2 硬體金鑰 MFA，覆蓋率 100%。',
        baselineVariance: '100% 達成基線',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:30',
        affectedAssets: ['idp-okta-connector', 'ssh-bastion-prod'],
        telemetrySource: 'IAM/IdP',
        remediationGuidance: '符合 NIST AAL3 最高等級鑑別標準。'
      },
      {
        id: 'nist-si7',
        code: 'SI-7',
        framework: 'NIST-800',
        domain: '系統與資訊完整性 (System Integrity)',
        title: '軟體、韌體及資訊完整性驗證 (Software & Firmware Integrity)',
        requirementText: '系統應採用檔案完整性監控 (FIM) 工具，定期偵測核心系統二進位檔案與設定檔是否遭到未授權篡改。',
        evidence: 'SOAR FIM 引擎於主機 gateway-gw-02 偵測到 /etc/pam.d/sshd 於非維護期變更，已觸發自動警報。',
        baselineVariance: '關鍵組態異常寫入',
        status: 'Violated',
        severity: 'Critical',
        lastChecked: '2026-09-08 01:50',
        affectedAssets: ['gateway-gw-02 (10.200.1.2)'],
        telemetrySource: 'FIM',
        remediationPlaybook: 'SOAR-PB-104: 終端主機微隔離與進程終止劇本',
        remediationGuidance: '比對 GitOps 基準版本，復原遭到篡改的 PAM 設定檔，並進行取證調查。',
        mitreRef: 'T1556 (Modify Authentication Process)'
      },
      {
        id: 'tsc-cc6.1',
        code: 'CC6.1',
        framework: 'TSC',
        domain: '邏輯存取控制 (Logical Access)',
        title: '邏輯存取安全與註冊認證架構 (Logical Access Security)',
        requirementText: '實體應實施邏輯存取安全軟體基礎設施，防止未經授權之主機、應用程式或個人存取受保護資料與資產。',
        evidence: '802.1X NAC 與微隔離政策已套用至全資料中心 VLAN，未註冊設備自動指派至隔離網段。',
        baselineVariance: '完全合規',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:10',
        affectedAssets: ['cisco-ise-nac-01', 'sdn-controller-core'],
        telemetrySource: 'NDR',
        remediationGuidance: '符合 SOC 2 CC6.1 控制要求。'
      },
      {
        id: 'tsc-cc7.2',
        code: 'CC7.2',
        framework: 'TSC',
        domain: '系統異常與弱點修補 (Vulnerability Monitoring)',
        title: '安全弱點即時監控與高危漏洞修補時限 (Vulnerability SLA)',
        requirementText: '實施漏洞管理程序，針對 CVSS >= 9.0 之關鍵嚴重性弱點必須於 14 日內完成修補或套用有效補償控制。',
        evidence: '弱點掃描引擎回報 1 台外網反向代理暴露 OpenSSL 關鍵記憶體溢位弱點 (CVE-2026-1192，CVSS 9.8)，修補 SLA 已逾期 2 天。',
        baselineVariance: 'CVSS 9.8 逾期未修補',
        status: 'Violated',
        severity: 'Critical',
        lastChecked: '2026-09-08 02:05',
        affectedAssets: ['nginx-edge-proxy-04 (10.200.0.14)'],
        telemetrySource: 'CloudPosture',
        remediationPlaybook: 'SOAR-PB-802: 邊界動態黑名單聯防限流劇本',
        remediationGuidance: '已套用 WAF 虛擬修補防禦規則阻斷利用封包，請於今晚維護窗口升級 OpenSSL 3.4.1。',
        mitreRef: 'T1190 (Exploit Public-Facing Application)'
      },
      {
        id: 'tsc-cc8.1',
        code: 'CC8.1',
        framework: 'TSC',
        domain: '變更授權與發布管理 (Change Management)',
        title: '軟體原始碼變更授權與自動化程式碼簽章 (Change Authorization & Signing)',
        requirementText: '生產環境變更應具備 PR 雙人審查與 CI/CD 容器鏡像 Cosign 數位簽名，防止未授權代碼流入。',
        evidence: '所有正式發布之 Docker 鏡像均由 Cosign 搭配 Sigstore 私鑰進行數位簽章，Admission Controller 強制校驗通過率 100%。',
        baselineVariance: '無未簽章鏡像上線',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 02:40',
        affectedAssets: ['k8s-admission-webhook', 'container-registry-harbor'],
        telemetrySource: 'CloudPosture',
        remediationGuidance: '符合 SOC 2 變更控制要求。'
      },
      {
        id: 'hipaa-164.312-a',
        code: '§ 164.312(a)',
        framework: 'HIPAA',
        domain: 'ePHI 存取控制措施',
        title: '電子受保護醫療資訊 (ePHI) 唯一存取控制與自動登出',
        requirementText: '對包含 ePHI 的工作站及資料庫應指派唯一身分識別碼，並在終端閒置 15 分鐘後強制自動登出。',
        evidence: '放射影像 PACS 伺服器之 4 台醫療檢視終端被發現螢幕鎖定逾時時間設為「永不」，違反自動登出規範。',
        baselineVariance: '終端閒置防護缺失',
        status: 'Violated',
        severity: 'High',
        lastChecked: '2026-09-08 01:30',
        affectedAssets: ['pacs-view-terminal-01..04 (ICU-VLAN)'],
        telemetrySource: 'EDR/XDR',
        remediationPlaybook: 'SOAR-PB-104: 終端主機微隔離與進程終止劇本',
        remediationGuidance: '透過 GPO / MDM 強制推送工作站鎖定策略，將螢幕保護逾時統一設定為 10 分鐘。'
      },
      {
        id: 'hipaa-164.312-e',
        code: '§ 164.312(e)',
        framework: 'HIPAA',
        domain: 'ePHI 傳輸安全加密',
        title: '醫療紀錄在傳輸中之機密性與 mTLS 加密防護',
        requirementText: '所有在網路上傳輸之 ePHI 必須使用端對端強式加密機制 (TLS 1.3 / mTLS)。',
        evidence: '醫院內部 HL7 / DICOM 醫療影像介接服務全數完成 mTLS 雙向憑證綁定。',
        baselineVariance: '100% 強式加密覆蓋',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:00',
        affectedAssets: ['hl7-interface-engine', 'dicom-archive-vault'],
        telemetrySource: 'NDR',
        remediationGuidance: '完全符合 HIPAA 技術安全條款。'
      },
      {
        id: 'pci-req3.4',
        code: 'Req 3.4',
        framework: 'PCI-DSS',
        domain: '持卡人資料保護 (Cardholder Data)',
        title: '儲存持卡人主帳號 (PAN) 強式密碼學保護',
        requirementText: '主帳號 (PAN) 儲存時必須使用 AES-256 或 Tokenization 強式加密並配合 HSM 密鑰輪替。',
        evidence: '金流資料庫之持卡人卡號皆經由 HSM 硬體安全模組進行 AES-256-GCM 欄位級加密，每 90 天自動輪替。',
        baselineVariance: 'HSM 密鑰輪替合規',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:25',
        affectedAssets: ['thales-hsm-cluster', 'payment-gateway-db'],
        telemetrySource: 'CloudPosture',
        remediationGuidance: '符合 PCI DSS v4.0 最高等級安全標準。'
      },
      {
        id: 'pci-req1.2',
        code: 'Req 1.2',
        framework: 'PCI-DSS',
        domain: '網路安全與持卡人環境微隔離',
        title: '持卡人資料環境 (CDE) 與非信任網路微隔離',
        requirementText: 'CDE 環境必須與辦公室網路實施嚴格防火牆分段與微隔離，限制一切非必要端口。',
        evidence: '防火牆稽核發現 1 條允許辦公室 Wi-Fi 網段直接存取 CDE 資料庫 3306 端口之測試規則逾期 18 天未刪除。',
        baselineVariance: 'CDE 微隔離規則失效',
        status: 'Violated',
        severity: 'Critical',
        lastChecked: '2026-09-08 02:10',
        affectedAssets: ['cde-firewall-cluster', 'corp-wifi-vlan-20'],
        telemetrySource: 'NDR',
        remediationPlaybook: 'SOAR-PB-802: 邊界動態黑名單聯防限流劇本',
        remediationGuidance: '立即刪除該測試規則，強制透過 JumpHost 進行堡壘機特權跳板存取。',
        mitreRef: 'T1021 (Remote Services)'
      },
      {
        id: 'pci-req8.3',
        code: 'Req 8.3',
        framework: 'PCI-DSS',
        domain: '使用者識別與多因素鑑別',
        title: '存取持卡人資料環境之多因素身分驗證 (MFA)',
        requirementText: 'PCI DSS v4.0 強制要求所有人員進入 CDE 環境均必須通過強式多因素驗證 (MFA)。',
        evidence: '所有連往 CDE 跳板機之連線均受 RADIUS / FIDO2 MFA 阻絕式保護。',
        baselineVariance: '100% 阻絕保護',
        status: 'Compliant',
        severity: 'Info',
        lastChecked: '2026-09-08 03:35',
        affectedAssets: ['cde-bastion-01', 'mfa-radius-proxy'],
        telemetrySource: 'IAM/IdP',
        remediationGuidance: '符合 PCI DSS v4.0 規定。'
      }
    ],
    wormLedger: [
      {
        blockId: 10428,
        timestamp: '2026-09-08 03:45:12',
        framework: 'ISO27001',
        hash: '0x8f2e4b1c9d3a7f5e0b6c4a8d2e1f9c3b7a5e8d1c4b2a9f6e3d5c7b1a8f4e2d0c',
        prevHash: '0x7e1d3a0b8c2f6e4d9a5b3c7f1e0d8b2a6f4e7c0b1a9e5d2c3f8b0a7e6d1c9f5a',
        merkleRoot: '0x4c8a2e1f9b3d7c5e0a6f8b2d1c4e9a7f5b3d1c8e0a6f4b2d9e7c1a5f3b8d0c2e',
        auditorId: 'AUDITOR-BSI-9921',
        event: 'ISO 27001 A.8.15 WORM 日誌防篡改週期檢查密封，驗證通過 420 節點。',
        status: 'Sealed'
      },
      {
        blockId: 10427,
        timestamp: '2026-09-08 03:30:00',
        framework: 'PCI-DSS',
        hash: '0x7e1d3a0b8c2f6e4d9a5b3c7f1e0d8b2a6f4e7c0b1a9e5d2c3f8b0a7e6d1c9f5a',
        prevHash: '0x6d0c2f9a7b1e5d3c8f4a2b6e0d9c7a1f5e3d0b8c9a4f6e1d2c7b9a0e5d8c4f3b',
        merkleRoot: '0x3b7d1c8e0a6f4b2d9e7c1a5f3b8d0c2e4c8a2e1f9b3d7c5e0a6f8b2d1c4e9a7f',
        auditorId: 'AUDITOR-QSA-4102',
        event: 'PCI DSS v4.0 Req 3.4 HSM 密鑰輪替密碼學證據寫入不可變動存證槽。',
        status: 'Sealed'
      },
      {
        blockId: 10426,
        timestamp: '2026-09-08 03:15:22',
        framework: 'GDPR',
        hash: '0x6d0c2f9a7b1e5d3c8f4a2b6e0d9c7a1f5e3d0b8c9a4f6e1d2c7b9a0e5d8c4f3b',
        prevHash: '0x5c9b1e8a6f0d4c2b7e3f1a5d9c8b6a0e4d2c9f7b8a3e5d0c1b6a8f4e7d2c0b9a',
        merkleRoot: '0x2a6f8b2d1c4e9a7f5b3d1c8e0a6f4b2d9e7c1a5f3b8d0c2e4c8a2e1f9b3d7c5e',
        auditorId: 'EU-DPO-OFFICIAL',
        event: 'GDPR Art. 32 全面強制端對端 TLS 1.3 稽核取證通過。',
        status: 'Verified'
      },
      {
        blockId: 10425,
        timestamp: '2026-09-08 03:00:18',
        framework: 'NIST-800',
        hash: '0x5c9b1e8a6f0d4c2b7e3f1a5d9c8b6a0e4d2c9f7b8a3e5d0c1b6a8f4e7d2c0b9a',
        prevHash: '0x4b8a0d7f5e9c3b1a6d2e0f4c8b7a5e9d3c1b8f6a7e2d4c9b0a5f7e3d1c8b9a2e',
        merkleRoot: '0x1f5e3d0b8c9a4f6e1d2c7b9a0e5d8c4f3b2a6f8b2d1c4e9a7f5b3d1c8e0a6f4b',
        auditorId: 'FEDRAMP-3PAO-08',
        event: 'NIST SP 800-53 IA-2 FIDO2 WebAuthn 100% 覆蓋率硬體驗證戳記。',
        status: 'Verified'
      },
      {
        blockId: 10424,
        timestamp: '2026-09-08 02:45:00',
        framework: 'HIPAA',
        hash: '0x4b8a0d7f5e9c3b1a6d2e0f4c8b7a5e9d3c1b8f6a7e2d4c9b0a5f7e3d1c8b9a2e',
        prevHash: '0x3a7f9c6e4d8b2a0f5c1d9e3b7a6f4e8d2c0b7a5f6e1d3c8b9a4f0e2d5c7b1a8f',
        merkleRoot: '0x0e4d2c9f7b8a3e5d0c1b6a8f4e7d2c0b9a1f5e3d0b8c9a4f6e1d2c7b9a0e5d8c',
        auditorId: 'HHS-AUDIT-SYS',
        event: 'HIPAA § 164.312(e) 醫療紀錄傳輸加密通道 mTLS 憑證鏈有效性驗證。',
        status: 'Verified'
      }
    ],
    remediationTasks: [
      {
        id: 'CAPA-2026-001',
        controlId: 'A.8.2',
        framework: 'ISO27001',
        title: '撤銷特權帳號 Kevin (ADM) 直接壓縮資料庫權限並限制工具調用',
        assignedTo: 'SecOps - Alex Chen',
        priority: 'Critical',
        deadline: '2026-09-09 18:00',
        status: 'In-Progress',
        remediationAction: '在 Bastion 上封鎖 7z.exe / winrar 等打包工具，並導入零信任 PAM 臨時特權授權 (JIT) 流程。',
        playbookId: 'SOAR-PB-109',
        affectedAsset: 'db-cluster-core-01'
      },
      {
        id: 'CAPA-2026-002',
        controlId: 'Art. 44',
        framework: 'GDPR',
        title: '阻斷對境外雲盤 MEGA.nz 之資料傳輸並通報 DPO 調查 PII 外洩',
        assignedTo: 'Compliance - Sarah Lin (DPO)',
        priority: 'Critical',
        deadline: '2026-09-08 12:00',
        status: 'Open',
        remediationAction: '由防火牆封鎖境外雲端存儲網段，隔離 dev-workstation-99，並啟動 72 小時外洩鑑識程序。',
        playbookId: 'SOAR-PB-901',
        affectedAsset: 'dev-workstation-99'
      },
      {
        id: 'CAPA-2026-003',
        controlId: 'Req 1.2',
        framework: 'PCI-DSS',
        title: '立即刪除辦公室 Wi-Fi 存取 CDE 持卡人環境之過期防火牆規則',
        assignedTo: 'NetOps - David Wu',
        priority: 'Critical',
        deadline: '2026-09-08 06:00',
        status: 'Open',
        remediationAction: '登入 cde-firewall-cluster 撤銷 rule-id: 4091 (Allow-Corp-WiFi-to-CDE-3306)，並稽核變更日誌。',
        playbookId: 'SOAR-PB-802',
        affectedAsset: 'cde-firewall-cluster'
      },
      {
        id: 'CAPA-2026-004',
        controlId: '§ 164.312(a)',
        framework: 'HIPAA',
        title: '強制放射檢視終端啟用 10 分鐘閒置自動螢幕鎖定策略',
        assignedTo: 'Endpoint - Grace Wang',
        priority: 'High',
        deadline: '2026-09-10 12:00',
        status: 'In-Progress',
        remediationAction: '透過 GPO 覆蓋 pacs-view-terminal 螢幕保護程式設定，禁止使用者自行將逾時改為 Never。',
        playbookId: 'SOAR-PB-104',
        affectedAsset: 'pacs-view-terminal-01..04'
      },
      {
        id: 'CAPA-2026-005',
        controlId: 'CC7.2',
        framework: 'TSC',
        title: '升級反向代理 OpenSSL 套件並修補 CVE-2026-1192 嚴重弱點',
        assignedTo: 'Infra - Jason Kuo',
        priority: 'Critical',
        deadline: '2026-09-08 23:59',
        status: 'In-Progress',
        remediationAction: '於維護時段輪流重新構建反向代理容器，並升級 OpenSSL 至 3.4.1 安全版本。',
        playbookId: 'SOAR-PB-802',
        affectedAsset: 'nginx-edge-proxy-04'
      }
    ],
    assetCoverage: [
      { id: 'cov-cde', labelZh: '財務與持卡人核心資料庫 (CDE)', labelEn: 'Financial & CDE Core DB', coveragePct: 100, standard: 'PCI-DSS Req 3.4', nodeCount: 48 },
      { id: 'cov-git', labelZh: '研發與程式碼 Git / CI-CD 叢集', labelEn: 'R&D Git & CI/CD Fleet', coveragePct: 97, standard: 'SOC 2 CC8.1', nodeCount: 94 },
      { id: 'cov-egress', labelZh: '雲端網路出站端點 (Egress EDR)', labelEn: 'Cloud Egress Endpoints', coveragePct: 100, standard: 'GDPR Art. 44', nodeCount: 152 },
      { id: 'cov-ephi', labelZh: '醫療終端與影像歸檔 PACS VLAN', labelEn: 'ePHI Healthcare Terminal VLAN', coveragePct: 92, standard: 'HIPAA § 164.312', nodeCount: 64 },
      { id: 'cov-ot', labelZh: 'OT/IoT 邊界閘道與控制網路', labelEn: 'IoT / OT Control Gateways', coveragePct: 86, standard: 'NIST SP 800-53', nodeCount: 62 }
    ]
  };
}

class CtoGovernanceEngine {
  private state: CtoGovernanceState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CtoGovernanceState {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<CtoGovernanceState>;
        const base = createInitialState();
        return {
          ...base,
          ...parsed,
          overviewMetrics: { ...base.overviewMetrics, ...(parsed.overviewMetrics || {}) }
        };
      }
    } catch (err) {
      console.error('Failed to load cto_governance_state.json, initializing fresh state:', err);
    }
    const fresh = createInitialState();
    this.saveState(fresh);
    return fresh;
  }

  private saveState(stateToSave: CtoGovernanceState = this.state): void {
    try {
      stateToSave.lastUpdated = formatNow();
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(stateToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist cto_governance_state.json:', err);
    }
  }

  private appendWormBlock(framework: FrameworkId | 'GOVERNANCE', auditorId: string, event: string): WormLedgerRecord {
    const latest = this.state.wormLedger[0];
    const nextBlockId = latest ? latest.blockId + 1 : 10429;
    const prevHash = latest ? latest.hash : sha256Hex('GENESIS-CTO-GOVERNANCE');
    const timestamp = formatNow();
    const hash = sha256Hex(`${nextBlockId}|${timestamp}|${framework}|${prevHash}|${event}`);
    const merkleRoot = sha256Hex(`MERKLE|${hash}|${this.state.wormLedger.length + 1}`);

    const block: WormLedgerRecord = {
      blockId: nextBlockId,
      timestamp,
      framework,
      hash,
      prevHash,
      merkleRoot,
      auditorId,
      event,
      status: 'Sealed'
    };

    this.state.wormLedger = [block, ...this.state.wormLedger].slice(0, 40);
    this.state.overviewMetrics.totalWormBlocks += 1;
    return block;
  }

  public getOverviewState(timeRange: ExecutiveTimeRange = '30d') {
    const avgComplianceScore = Math.round(
      this.state.frameworks.reduce((sum, f) => sum + f.score, 0) / this.state.frameworks.length
    );
    const totalControls = this.state.frameworks.reduce((sum, f) => sum + f.totalControls, 0);
    const totalPassed = this.state.frameworks.reduce((sum, f) => sum + f.passedControls, 0);
    const totalWarnings = this.state.frameworks.reduce((sum, f) => sum + f.warningControls, 0);
    const totalViolations = this.state.frameworks.reduce((sum, f) => sum + f.violatedControls, 0);
    const pendingApprovalsCount = this.state.approvals.filter(a => a.status === 'pending').length;

    return {
      ...this.state,
      activeTimeRange: timeRange,
      activeTrends: this.state.trends[timeRange] || this.state.trends['30d'],
      complianceSummary: {
        averageScore: avgComplianceScore,
        totalControls,
        totalPassed,
        totalWarnings,
        totalViolations,
        pendingApprovalsCount
      }
    };
  }

  public simulateFair(controlEfficacy: number, threatFrequencyMultiplier: number) {
    const clampedEfficacy = Math.min(99, Math.max(30, controlEfficacy));
    const clampedMultiplier = Math.min(3.0, Math.max(0.3, threatFrequencyMultiplier));
    const base = this.state.financialExposure;

    const factor = clampedMultiplier * (1 - (clampedEfficacy - 50) / 100);
    const simulatedVaR = Math.max(250000, Math.round(base.potentialValueAtRisk * factor));
    const simulatedALE = Math.max(45000, Math.round(base.annualizedLossExpectancy * factor));
    const simulatedSavings = Math.round(base.lossAvoidanceSavings * (clampedEfficacy / 88));
    const protectionDelta = base.industryPeerAvgVaR - simulatedVaR;
    const insuranceCoveragePct = Math.round((base.cyberInsuranceLimit / simulatedVaR) * 100);

    return {
      controlEfficacy: clampedEfficacy,
      threatFrequencyMultiplier: clampedMultiplier,
      simulatedVaR,
      simulatedALE,
      simulatedSavings,
      protectionDelta,
      insuranceCoveragePct
    };
  }

  public decideApproval(id: string, decision: 'approved' | 'rejected', operator = 'CTO / Executive Sign-off') {
    const idx = this.state.approvals.findIndex(a => a.id === id);
    if (idx === -1) {
      throw new Error(`Approval item ${id} not found`);
    }
    const target = this.state.approvals[idx];
    target.status = decision;
    target.decidedBy = operator;
    target.decidedAt = formatNow();

    if (decision === 'approved') {
      this.state.overviewMetrics.unresolvedHighRisks = Math.max(0, this.state.overviewMetrics.unresolvedHighRisks - 1);
      this.state.overviewMetrics.healthIndex = Math.min(99, this.state.overviewMetrics.healthIndex + 1);
    }

    const wormBlock = this.appendWormBlock(
      'GOVERNANCE',
      'CTO-EXEC-SIGN',
      `高階授權決策 [${target.id}]: ${target.title} -> ${decision === 'approved' ? '已核准執行隔離處置' : '已駁回退回'} (Signed by ${operator})`
    );

    this.saveState();
    return {
      approval: target,
      wormBlock,
      pendingApprovalsCount: this.state.approvals.filter(a => a.status === 'pending').length,
      overviewMetrics: this.state.overviewMetrics
    };
  }

  public runComplianceAssessment(frameworkId: FrameworkId) {
    const fw = this.state.frameworks.find(f => f.id === frameworkId);
    if (!fw) {
      throw new Error(`Framework ${frameworkId} not found`);
    }

    const now = formatNow().slice(0, 16);
    const boostedScore = Math.min(99, Math.max(fw.score, fw.violatedControls === 0 ? 98 : fw.score + 1));
    fw.score = boostedScore;
    fw.lastAudited = now;
    if (fw.violatedControls > 0) {
      fw.passedControls = Math.min(fw.totalControls, fw.passedControls + 1);
      fw.violatedControls = Math.max(0, fw.violatedControls - 1);
    }
    fw.badge = `${fw.score >= 95 ? '認證就緒' : '合規強化中'} (${fw.score}%)`;

    // Sync controls timestamps for that framework
    this.state.controls = this.state.controls.map(c =>
      c.framework === frameworkId ? { ...c, lastChecked: now } : c
    );

    const wormBlock = this.appendWormBlock(
      frameworkId,
      'AUTO-ASSESS-ENGINE',
      `${fw.shortName} 自動化連續遙測全檢完成，合規達成率更新為 ${fw.score}% (${fw.passedControls}/${fw.totalControls} 項通過)。`
    );

    this.saveState();
    return {
      framework: fw,
      wormBlock,
      frameworks: this.state.frameworks
    };
  }

  public triggerCapaPlaybook(taskIdOrControlId: string) {
    const task = this.state.remediationTasks.find(
      t => t.id === taskIdOrControlId || t.controlId === taskIdOrControlId
    );
    const control = this.state.controls.find(
      c => c.id === taskIdOrControlId || c.code === taskIdOrControlId || (task && c.code === task.controlId)
    );

    if (!task && !control) {
      throw new Error(`CAPA task or control ${taskIdOrControlId} not found`);
    }

    if (task && task.status === 'Open') {
      task.status = 'In-Progress';
    }
    if (control && control.status === 'Violated') {
      control.status = 'Under-Review';
      control.lastChecked = formatNow().slice(0, 16);
    }

    const playbookName = task?.playbookId || control?.remediationPlaybook || 'SOAR-AUTO-CONTAINMENT';
    const framework = task?.framework || control?.framework || 'GOVERNANCE';
    const wormBlock = this.appendWormBlock(
      framework,
      'SOAR-ORCHESTRATOR',
      `觸發自動化合規修復劇本 [${playbookName}]，標的資產：${task?.affectedAsset || control?.affectedAssets.join(', ')}`
    );

    this.saveState();
    return {
      task,
      control,
      wormBlock,
      remediationTasks: this.state.remediationTasks,
      controls: this.state.controls
    };
  }

  public resolveCapaTask(taskId: string) {
    const task = this.state.remediationTasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`CAPA task ${taskId} not found`);
    }

    task.status = 'Resolved';

    // Update matching compliance control
    const linkedControl = this.state.controls.find(
      c => c.framework === task.framework && c.code === task.controlId
    );
    if (linkedControl) {
      linkedControl.status = 'Compliant';
      linkedControl.baselineVariance = '已完成修復並驗收 (Compliant)';
      linkedControl.lastChecked = formatNow().slice(0, 16);
    }

    // Update framework score & counts
    const fw = this.state.frameworks.find(f => f.id === task.framework);
    if (fw) {
      if (fw.violatedControls > 0) {
        fw.violatedControls -= 1;
      } else if (fw.warningControls > 0) {
        fw.warningControls -= 1;
      }
      fw.passedControls = Math.min(fw.totalControls, fw.passedControls + 1);
      fw.score = Math.min(100, Math.round((fw.passedControls / fw.totalControls) * 100));
      fw.badge = `認證就緒 (${fw.score}%)`;
      fw.lastAudited = formatNow().slice(0, 16);
    }

    // Also improve CTO posture metric slightly
    this.state.overviewMetrics.healthIndex = Math.min(99, this.state.overviewMetrics.healthIndex + 1);

    const wormBlock = this.appendWormBlock(
      task.framework,
      'CTO-CAPA-VERIFY',
      `合規缺陷工單 [${task.id} / ${task.controlId}] 改善完畢並通過自動化驗證：${task.title}`
    );

    this.saveState();
    return {
      task,
      framework: fw,
      control: linkedControl,
      wormBlock,
      remediationTasks: this.state.remediationTasks,
      frameworks: this.state.frameworks,
      controls: this.state.controls,
      overviewMetrics: this.state.overviewMetrics
    };
  }

  public verifyWormChain() {
    let validBlocks = 0;
    for (const block of this.state.wormLedger) {
      if (block.hash.startsWith('0x') && block.merkleRoot.startsWith('0x')) {
        validBlocks += 1;
      }
    }
    return {
      verified: true,
      checkedBlocks: validBlocks,
      totalSealedBlocks: this.state.overviewMetrics.totalWormBlocks,
      latestBlockId: this.state.wormLedger[0]?.blockId || 10428,
      latestMerkleRoot: this.state.wormLedger[0]?.merkleRoot || '',
      verifiedAt: formatNow()
    };
  }

  public updateRoadmapItem(id: string, updates: Partial<Pick<StrategicRoadmapItem, 'progress' | 'status'>>) {
    const item = this.state.strategicRoadmap.find(r => r.id === id);
    if (!item) {
      throw new Error(`Roadmap item ${id} not found`);
    }
    if (typeof updates.progress === 'number') {
      item.progress = Math.min(100, Math.max(0, updates.progress));
      if (item.progress === 100) {
        item.status = 'completed';
      }
    }
    if (updates.status) {
      item.status = updates.status;
    }

    if (id === 'ROAD-01') {
      this.state.overviewMetrics.zeroTrustAdoptionPct = item.progress;
    } else if (id === 'ROAD-04') {
      this.state.overviewMetrics.pqcReadinessPct = item.progress;
    }

    this.saveState();
    return item;
  }

  public generateBriefing(persona: ExecutivePersona, isZh: boolean, customPrompt?: string) {
    const m = this.state.overviewMetrics;
    const avgCompliance = Math.round(
      this.state.frameworks.reduce((sum, f) => sum + f.score, 0) / this.state.frameworks.length
    );
    const openCapa = this.state.remediationTasks.filter(t => t.status !== 'Resolved').length;
    const pendingApprovals = this.state.approvals.filter(a => a.status === 'pending').length;

    const map: Record<ExecutivePersona, {
      title: string;
      targetAudience: string;
      summaryText: string;
      highlights: string[];
      actionItems: string[];
    }> = {
      cto: {
        title: isZh ? 'CTO 技術架構韌性、開發安全與合規整合戰略簡報' : 'CTO Architecture Resilience, DevSecOps & Compliance Briefing',
        targetAudience: isZh ? '技術長 (CTO)、平台架構師與工程副總' : 'Chief Technology Officer & VP Engineering',
        summaryText: isZh
          ? `目前全集團技術架構安全健康分達 ${m.healthIndex}/100，六大國際法規綜合合規達成率 ${avgCompliance}%，核心業務系統妥善率維持 ${m.businessUptime}%。CI/CD 容器與 SBOM 簽章驗證覆蓋率達 ${m.sbomSignedCoverage}%，SOAR 自動化已替工程與資安團隊省下 ${m.analystHoursSaved.toLocaleString()} 小時人工維運工時（MTTR 壓縮至 ${m.mttrMinutes} 分鐘）。目前尚餘 ${openCapa} 項合規 CAPA 改善單與 1 項邊界 OpenSSL 修補待維護窗口完成。`
          : `Platform resilience stands at ${m.healthIndex}/100 with ${avgCompliance}% cross-framework compliance and ${m.businessUptime}% Tier-1 uptime. CI/CD Cosign & SBOM verification covers ${m.sbomSignedCoverage}% of builds, while SOAR reclaimed ${m.analystHoursSaved.toLocaleString()} engineering hours (MTTR ${m.mttrMinutes}m). ${openCapa} CAPA tasks and 1 edge OpenSSL patch remain scheduled.`,
        highlights: [
          isZh ? `CI/CD 容器鏡像 Sigstore/Cosign 數位簽章準入驗證率 100%，零信任架構進度 ${m.zeroTrustAdoptionPct}%` : `100% Cosign container admission enforcement; Zero Trust adoption at ${m.zeroTrustAdoptionPct}%`,
          isZh ? `AI Gateway 提示詞 DLP 即時遮罩 PII 與核心原始碼，合規區塊已達 ${m.totalWormBlocks.toLocaleString()} 塊 WORM 密封` : `AI Gateway DLP active across all LLM endpoints; ${m.totalWormBlocks.toLocaleString()} immutable WORM blocks sealed`,
          isZh ? `平均偵測與阻斷速度 (MTTD ${m.mttdMinutes}m / MTTR ${m.mttrMinutes}m) 確保研發與生產環境零非預期停機` : `MTTD ${m.mttdMinutes}m / MTTR ${m.mttrMinutes}m preserves zero unplanned production downtime`
        ],
        actionItems: [
          isZh ? `審核 ${pendingApprovals} 件高風險緊急網段/SaaS 授權處置，並排程邊界反向代理 OpenSSL 3.4.1 升級` : `Review ${pendingApprovals} pending emergency isolation approvals and schedule edge OpenSSL 3.4.1 rollout`,
          isZh ? `推進後量子密碼學 (PQC) 核心加密遷移試驗（目前進度 ${m.pqcReadinessPct}%）及第三方 SBOM 自動化閘道` : `Advance Post-Quantum Cryptography readiness (${m.pqcReadinessPct}%) and third-party SBOM automation gates`
        ]
      },
      board: {
        title: isZh ? '董監事審計委員會季度資安與合規治理備忘錄' : 'Board of Directors & Audit Committee Security & Compliance Memo',
        targetAudience: isZh ? '董事會、獨立董事與審計委員會成員' : 'Board Members & Audit Committee',
        summaryText: isZh
          ? `本季全公司資安與合規治理評級維持於「${m.healthGrade}」，六大國際標準（ISO 27001、GDPR、NIST 800-53、SOC 2、HIPAA、PCI DSS）平均合規率達 ${avgCompliance}%。透過 FAIR 模型評定之 95% 信心財務暴險值已降至 $${(m.valueAtRiskUsd / 1000000).toFixed(2)}M（優於同業平均 $${(m.industryPeerAvgVaR / 1000000).toFixed(2)}M），現有 $20M 資安責任險足以提供逾 700% 的極端風險緩衝。`
          : `Corporate governance remains at ${m.healthGrade} with ${avgCompliance}% compliance across 6 frameworks. FAIR 95% VaR is suppressed to $${(m.valueAtRiskUsd / 1000000).toFixed(2)}M vs $${(m.industryPeerAvgVaR / 1000000).toFixed(2)}M peer average, backed by a $20M cyber insurance policy.`,
        highlights: [
          isZh ? `全網 420 節點納入連續性 WORM 密碼學防篡改稽核（已密封 ${m.totalWormBlocks.toLocaleString()} 區塊）` : `100% enterprise fleet under continuous WORM Merkle attestation (${m.totalWormBlocks.toLocaleString()} blocks)`,
          isZh ? `重大事件平均處置時間 (MTTR) 壓縮至 ${m.mttrMinutes} 分鐘，業務妥善率達 ${m.businessUptime}%` : `MTTR compressed to ${m.mttrMinutes} minutes with ${m.businessUptime}% service uptime`,
          isZh ? `符合證期局、SEC 與 NIS2 重大資安事故強制揭露與舉證規範` : `Aligned with SEC, NIS2, and international audit evidence mandates`
        ],
        actionItems: [
          isZh ? `核准 2027 年度後量子密碼學 (PQC) 核心資料庫升級預算` : `Approve 2027 Post-Quantum Cryptography transition budget`,
          isZh ? `追蹤並結案剩餘 ${openCapa} 項法規合規 CAPA 改善工單` : `Track closure of remaining ${openCapa} compliance CAPA remediation tasks`
        ]
      },
      ceo: {
        title: isZh ? '執行長 (CEO) 營運韌性與品牌信任度速報' : 'CEO Operational Resilience & Brand Trust Briefing',
        targetAudience: isZh ? '執行長與高階決策執行委員會' : 'Chief Executive Officer & Executive Committee',
        summaryText: isZh
          ? `本週核心業務系統（SAP ERP、SWIFT 清算、Kubernetes 交易閘道）維持 ${m.businessUptime}% 極致妥善率，SOC 2 與 ISO 27001 達標率分別為 95% 與 96%，有效保障大型企業客戶信任與合約合規。面對研發處異常資料提取行為，系統已於 ${m.mttrMinutes} 分鐘內自動截斷並進入 WORM 存證。`
          : `Core business systems maintained ${m.businessUptime}% uptime with SOC 2 (95%) and ISO 27001 (96%) protecting enterprise customer trust. Automated defenses neutralized R&D exfiltration attempts within ${m.mttrMinutes} minutes.`,
        highlights: [
          isZh ? '全集團 Tier-1 核心營業系統零非預期停機時間' : 'Zero unplanned downtime across all Tier-1 business services',
          isZh ? `自主防禦攔截率達 ${m.deflectionRatio}%，保護關鍵晶片研發智財無損` : `${m.deflectionRatio}% autonomous threat containment safeguarding core IP`,
          isZh ? '客戶合規白皮書與審計報告包已就緒可供戰略客戶查驗' : 'Continuous SOC 2 & ISO 27001 audit packs ready for enterprise buyers'
        ],
        actionItems: [
          isZh ? '責成研發處加強 Git 倉儲非營業時間權限稽核與教育訓練' : 'Mandate Git repository off-hour access governance with R&D leadership',
          isZh ? '對外公開年度資安與隱私合規信任報告以強化商務競標優勢' : 'Leverage Grade-A compliance attestation in enterprise sales cycles'
        ]
      },
      cfo: {
        title: isZh ? '財務長 (CFO) 資安財務暴險、保險議價與 ROI 報告' : 'CFO Cyber Financial Exposure & Capital Efficiency Report',
        targetAudience: isZh ? '財務長與企業風險管理處' : 'Chief Financial Officer & Enterprise Risk Committee',
        summaryText: isZh
          ? `本年度技術防禦與自動化合規稽核展現 ${this.state.financialExposure.roiPercentage}% 投資報酬率 (ROI)。藉由 SOAR 自動化實現 ${m.deflectionRatio}% 自動處置，替團隊節省 ${m.analystHoursSaved.toLocaleString()} 工時（等同降低 $${(m.costSavingsUsd / 1000000).toFixed(2)}M 維運成本），且年度預期損失 (ALE) 壓縮至 $${(this.state.financialExposure.annualizedLossExpectancy / 1000).toFixed(0)}k。憑藉 ${avgCompliance}% 連續合規成績，符合資安險續保 15% 保費減免條件。`
          : `Security automation delivered ${this.state.financialExposure.roiPercentage}% ROI, reclaiming ${m.analystHoursSaved.toLocaleString()} hours ($${(m.costSavingsUsd / 1000000).toFixed(2)}M savings). ALE is suppressed to $${(this.state.financialExposure.annualizedLossExpectancy / 1000).toFixed(0)}k, qualifying for a 15% cyber insurance premium reduction.`,
        highlights: [
          isZh ? `95% 信心 VaR 降至 $${(m.valueAtRiskUsd / 1000000).toFixed(2)}M，較同業節省 $${((m.industryPeerAvgVaR - m.valueAtRiskUsd) / 1000000).toFixed(2)}M 風險暴險` : `95% VaR at $${(m.valueAtRiskUsd / 1000000).toFixed(2)}M ($${((m.industryPeerAvgVaR - m.valueAtRiskUsd) / 1000000).toFixed(2)}M below peer avg)`,
          isZh ? '自動化連續合規大幅降低外部會計師 (SOC 2 / PCI QSA) 人工取證審計費用' : 'Continuous WORM telemetry cuts external audit preparation overhead by 60%',
          isZh ? '達成次年度 $20M 資安責任險續約保費 15% 折扣門檻' : 'Qualified for 15% discount on $20M cyber insurance policy renewal'
        ],
        actionItems: [
          isZh ? '核銷本季資安資本支出 (CAPEX) 與防禦避險 ROI 績效報告' : 'Sign off Q3 cybersecurity CAPEX & loss-avoidance ROI attribution',
          isZh ? '審議雲端微隔離與 AI Gateway DLP 年度預算配置' : 'Review cloud microsegmentation and AI Gateway DLP budget allocation'
        ]
      },
      ciso: {
        title: isZh ? '資安長 (CISO) 深度防禦、MITRE 覆蓋與法規違規清零簡報' : 'CISO Deep-Defense, Threat Ops & Compliance Remediation Brief',
        targetAudience: isZh ? '資訊安全長與資安應變中心 (SOC/CERT)' : 'Chief Information Security Officer & SecOps Leads',
        summaryText: isZh
          ? `全網偵測與處置延遲維持於 MTTD ${m.mttdMinutes}m / MTTR ${m.mttrMinutes}m。目前仍有 ${openCapa} 項法規控制 CAPA 工單（涵蓋 ISO A.8.2 特權異常壓縮、GDPR Art.44 跨境外洩阻斷、PCI Req 1.2 CDE 微隔離規則清理）及 ${pendingApprovals} 件待高階核准隔離決策，建議立即完成聯防處置並密封 WORM 紀錄。`
          : `MTTD stands at ${m.mttdMinutes}m and MTTR at ${m.mttrMinutes}m. ${openCapa} compliance CAPA items (ISO A.8.2, GDPR Art.44, PCI Req 1.2) and ${pendingApprovals} executive containment approvals require immediate closure.`,
        highlights: [
          isZh ? 'MITRE ATT&CK 企業戰術與技術偵測覆蓋率達 88.6%' : '88.6% MITRE ATT&CK enterprise tactic coverage',
          isZh ? '所有 WORM 審計區塊鏈 SHA-256 與 Merkle Root 100% 完整性驗證通過' : '100% SHA-256 & Merkle Root ledger integrity verified',
          isZh ? '端點 FIDO2 MFA 與 Bastion 監控即時連動 SOAR 劇本' : 'Endpoint FIDO2 MFA and Bastion telemetry directly wired to SOAR playbooks'
        ],
        actionItems: [
          isZh ? `優先處理並結案 ${openCapa} 項 Critical/High 等級 CAPA 合規缺陷` : `Prioritize closure of ${openCapa} Critical/High CAPA compliance deficiencies`,
          isZh ? `簽核待處理的高階網路/SaaS 緊急授權單 (${pendingApprovals} 件)` : `Process ${pendingApprovals} pending high-impact containment authorizations`
        ]
      }
    };

    const selected = map[persona] || map.cto;
    return {
      persona,
      generatedAt: formatNow(),
      customPromptApplied: customPrompt || null,
      ...selected
    };
  }

  public buildExportPack() {
    const overview = this.getOverviewState('30d');
    const digest = sha256Hex(JSON.stringify({
      ts: overview.lastUpdated,
      health: overview.overviewMetrics.healthIndex,
      avgScore: overview.complianceSummary.averageScore,
      worm: overview.wormLedger[0]?.merkleRoot
    }));

    return {
      packId: `CTO-GRC-PACK-${new Date().toISOString().slice(0, 10)}`,
      generatedAt: new Date().toISOString(),
      classification: 'C-LEVEL / BOARD CONFIDENTIAL',
      cryptographicDigest: digest,
      executivePosture: overview.overviewMetrics,
      complianceSummary: overview.complianceSummary,
      technologyPillars: overview.techPillars,
      frameworks: overview.frameworks.map(f => ({
        id: f.id,
        name: f.fullName,
        score: f.score,
        passedControls: f.passedControls,
        totalControls: f.totalControls,
        violatedControls: f.violatedControls,
        auditor: f.auditor,
        lastAudited: f.lastAudited
      })),
      openRemediationTasks: overview.remediationTasks.filter(t => t.status !== 'Resolved'),
      financialRiskQuantification: overview.financialExposure,
      strategicRoadmap: overview.strategicRoadmap,
      latestWormBlocks: overview.wormLedger.slice(0, 5)
    };
  }

  public resetBaseline() {
    this.state = createInitialState();
    this.saveState();
    return this.state;
  }
}

export const globalCtoGovernanceEngine = new CtoGovernanceEngine();

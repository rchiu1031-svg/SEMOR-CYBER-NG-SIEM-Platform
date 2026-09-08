import {
  BusinessServiceHealth,
  DepartmentRisk,
  FinancialCyberRisk,
  StrategicRoadmapItem,
  ExecutiveApprovalItem,
  ExecutiveTrendDataPoint
} from './types';

export const EXECUTIVE_OVERVIEW_METRICS = {
  healthIndex: 88,
  healthIndexDelta: 4.2, // +4.2% vs last period
  healthGrade: 'Grade A (Resilient)',
  valueAtRiskUsd: 2850000, // $2.85M
  valueAtRiskDelta: -18.5, // -18.5% reduction in financial exposure
  industryPeerAvgVaR: 8400000, // $8.4M
  deflectionRatio: 96.8, // 96.8% auto-contained
  analystHoursSaved: 1640, // hours saved by SOAR
  costSavingsUsd: 1420000, // $1.42M saved
  mttdMinutes: 3.8, // MTTD 3.8 mins
  mttdIndustryMinutes: 28800, // Industry avg ~20 days (28800 mins)
  mttrMinutes: 10.4, // MTTR 10.4 mins
  mttrIndustryMinutes: 100800, // Industry avg ~70 days
  businessUptime: 99.992,
  criticalIncidentsActive: 0,
  unresolvedHighRisks: 2
};

export const TREND_DATA_7D: ExecutiveTrendDataPoint[] = [
  { date: '09-02', attacksDetected: 142, threatsNeutralized: 140, mttdMinutes: 4.1, mttrMinutes: 11.2, riskIndex: 78, lossesPreventedUsd: 185000 },
  { date: '09-03', attacksDetected: 168, threatsNeutralized: 165, mttdMinutes: 3.9, mttrMinutes: 10.8, riskIndex: 79, lossesPreventedUsd: 220000 },
  { date: '09-04', attacksDetected: 215, threatsNeutralized: 212, mttdMinutes: 4.2, mttrMinutes: 12.0, riskIndex: 82, lossesPreventedUsd: 310000 },
  { date: '09-05', attacksDetected: 189, threatsNeutralized: 187, mttdMinutes: 3.6, mttrMinutes: 9.8, riskIndex: 76, lossesPreventedUsd: 245000 },
  { date: '09-06', attacksDetected: 240, threatsNeutralized: 236, mttdMinutes: 3.8, mttrMinutes: 10.5, riskIndex: 81, lossesPreventedUsd: 340000 },
  { date: '09-07', attacksDetected: 130, threatsNeutralized: 129, mttdMinutes: 3.4, mttrMinutes: 9.2, riskIndex: 74, lossesPreventedUsd: 160000 },
  { date: '09-08', attacksDetected: 112, threatsNeutralized: 111, mttdMinutes: 3.2, mttrMinutes: 8.9, riskIndex: 72, lossesPreventedUsd: 145000 }
];

export const TREND_DATA_30D: ExecutiveTrendDataPoint[] = [
  { date: 'W1 (08/11)', attacksDetected: 1180, threatsNeutralized: 1150, mttdMinutes: 4.5, mttrMinutes: 13.1, riskIndex: 84, lossesPreventedUsd: 1420000 },
  { date: 'W2 (08/18)', attacksDetected: 1320, threatsNeutralized: 1295, mttdMinutes: 4.2, mttrMinutes: 12.4, riskIndex: 82, lossesPreventedUsd: 1680000 },
  { date: 'W3 (08/25)', attacksDetected: 1450, threatsNeutralized: 1420, mttdMinutes: 3.9, mttrMinutes: 11.0, riskIndex: 78, lossesPreventedUsd: 1890000 },
  { date: 'W4 (09/01)', attacksDetected: 1206, threatsNeutralized: 1180, mttdMinutes: 3.6, mttrMinutes: 10.1, riskIndex: 75, lossesPreventedUsd: 1605000 }
];

export const TREND_DATA_90D: ExecutiveTrendDataPoint[] = [
  { date: 'Q2-M1 (Jun)', attacksDetected: 4800, threatsNeutralized: 4620, mttdMinutes: 5.8, mttrMinutes: 16.5, riskIndex: 88, lossesPreventedUsd: 5400000 },
  { date: 'Q2-M2 (Jul)', attacksDetected: 5200, threatsNeutralized: 5040, mttdMinutes: 4.9, mttrMinutes: 14.0, riskIndex: 83, lossesPreventedUsd: 6100000 },
  { date: 'Q3-M1 (Aug)', attacksDetected: 5170, threatsNeutralized: 5045, mttdMinutes: 4.1, mttrMinutes: 11.8, riskIndex: 79, lossesPreventedUsd: 6600000 }
];

export const BUSINESS_SERVICES_DATA: BusinessServiceHealth[] = [
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
];

export const DEPARTMENT_RISKS_DATA: DepartmentRisk[] = [
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
];

export const FINANCIAL_EXPOSURE_DATA: FinancialCyberRisk = {
  annualizedLossExpectancy: 420000, // $420k expected ALE
  potentialValueAtRisk: 2850000, // $2.85M 95% VaR
  lossAvoidanceSavings: 14200000, // $14.2M total averted
  cyberInsuranceLimit: 20000000, // $20M coverage
  cyberInsuranceDeductible: 500000, // $500k deductible
  costPerIncidentAverted: 84000,
  roiPercentage: 382, // 382% SecOps automation ROI
  industryPeerAvgVaR: 8400000 // $8.4M industry peer benchmark
};

export const STRATEGIC_ROADMAP_DATA: StrategicRoadmapItem[] = [
  {
    id: 'ROAD-01',
    title: '全域零信任 (Zero Trust) 邊界架構推進階段 III',
    domain: 'Architecture & IAM',
    progress: 88,
    targetQuarter: '2026 Q4',
    status: 'on_track',
    owner: 'CISO / Enterprise Architect',
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
    owner: 'SecOps Lead / Cloud Team',
    budgetUtilized: 920000,
    budgetTotal: 950000,
    description: '串接次世代端點 EDR、NDR 與微隔離防火牆，達成惡意程式與勒索軟體全自動秒級隔離。'
  },
  {
    id: 'ROAD-03',
    title: '供應鏈第三方風險管理 (TPRM) 持續自動化評鑑',
    domain: 'Third-Party Governance',
    progress: 65,
    targetQuarter: '2027 Q1',
    status: 'at_risk',
    owner: 'Compliance & Vendor Risk',
    budgetUtilized: 450000,
    budgetTotal: 800000,
    description: '針對前 100 大關鍵協力廠商與軟體依賴實施 SBOM 與即時外洩情資自動化掃描。'
  },
  {
    id: 'ROAD-04',
    title: '後量子密碼學 (PQC) 核心資產加密過渡評估',
    domain: 'Cryptographic Agility',
    progress: 35,
    targetQuarter: '2027 Q2',
    status: 'planned',
    owner: 'Cryptographic Security Lab',
    budgetUtilized: 180000,
    budgetTotal: 600000,
    description: '針對金融主幹網路、SWIFT 與核心資料庫加密演算法進行 NIST PQC 候選標準相容性驗證。'
  }
];

export const PENDING_EXECUTIVE_APPROVALS: ExecutiveApprovalItem[] = [
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
];

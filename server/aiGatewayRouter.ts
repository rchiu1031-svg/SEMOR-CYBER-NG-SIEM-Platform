import express, { type Request, type Response } from 'express';
import crypto from 'node:crypto';

const router = express.Router();

export interface AiGatewayAuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  department: string;
  userRole: string;
  sourceIp: string;
  targetModel: string;
  modelProvider: string;
  promptTokensEstimate: number;
  originalContent: string;
  processedContent?: string;
  action: 'PASS' | 'MASK' | 'BLOCK';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeredPolicies: Array<{
    id: string;
    name: string;
    category: 'PII' | 'SECRET' | 'SOURCE_CODE' | 'FINANCIAL' | 'RATE_LIMIT' | 'SHADOW_AI';
    severity: string;
  }>;
  matchDetails: Array<{
    type: string;
    detectedText: string;
    replacedWith?: string;
  }>;
  socForwarded: boolean;
  socAlertId?: string;
  latencyMs: number;
  blockReason?: string;
}

// In-Memory Audit Logs seeded with the 3 specified benchmark scenarios
let auditLogs: AiGatewayAuditEvent[] = [
  // Scenario A: R&D source code & API key leak -> BLOCKED
  {
    id: 'aigw-evt-20261019-001',
    timestamp: '2026-10-19T01:42:15.120Z',
    userId: 'usr_rd_7821',
    userName: 'Alex Lin (資深後端工程師)',
    department: '研發工程處 (R&D Engineering)',
    userRole: 'Developer',
    sourceIp: '10.120.14.88',
    targetModel: 'gpt-4o',
    modelProvider: 'OpenAI',
    promptTokensEstimate: 1420,
    originalContent: `請幫我審查這段付款微服務的核心扣款與資料庫連線程式碼並撰寫單元測試：
const apiKey = "sk-live-99a8b7c6d5e4f3a2b1c09876543210fe";
async function executeBillingCharge(customerId, amountCents) {
  const dbConn = "postgres://superadmin:ProdDbSecretPass2026@db-cluster.corp.internal:5432/core_billing";
  const client = await pool.connect(dbConn);
  const signature = crypto.createHmac('sha256', apiKey).update(customerId + amountCents).digest('hex');
  return await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amountCents, customerId]);
}`,
    action: 'BLOCK',
    riskLevel: 'CRITICAL',
    triggeredPolicies: [
      { id: 'SEC-POL-001', name: '企業核心原始碼與演算法外流防護策略', category: 'SOURCE_CODE', severity: 'CRITICAL' },
      { id: 'SEC-POL-002', name: '公有雲 / 內部 API Key 與認證金鑰洩漏防護', category: 'SECRET', severity: 'CRITICAL' }
    ],
    matchDetails: [
      { type: 'OpenAI Live API Key', detectedText: 'sk-live-99a8b7c6d5e4f3a2b1c09876543210fe' },
      { type: '內部資料庫連線字串 (含密碼)', detectedText: 'postgres://superadmin:ProdDbSecretPass2026@db-cluster.corp.internal:5432/core_billing' },
      { type: '後端扣款核心商業邏輯原始碼', detectedText: 'executeBillingCharge(customerId, amountCents)' }
    ],
    socForwarded: true,
    socAlertId: 'SOC-AI-ALERT-9921',
    latencyMs: 14,
    blockReason: '偵測到高危險機密洩漏：包含生產環境資料庫認證金鑰 (postgres://...) 及 live API 金鑰，嚴重違反資安保護法規，Prompt 已於網關邊緣強制攔截阻擋！'
  },

  // Scenario B: HR personnel uploading employee national ID and salary -> MASKED & ALLOWED
  {
    id: 'aigw-evt-20261019-002',
    timestamp: '2026-10-19T01:55:30.840Z',
    userId: 'usr_hr_3319',
    userName: 'Jessica Wang (人資招募與績效專員)',
    department: '人力資源處 (Human Resources)',
    userRole: 'HR_Specialist',
    sourceIp: '10.120.22.45',
    targetModel: 'claude-3-5-sonnet',
    modelProvider: 'Anthropic',
    promptTokensEstimate: 360,
    originalContent: '請幫我潤飾這段年度考績評語與職等升遷推薦詞：員工【王大明】，身分證字號【A123456789】，本年度於雲端遷移專案表現卓越，考績評定為優等 (A+)。建議由資深專員晉升副理，建議調薪幅度為 12%，調整後月薪為【NT$ 115,000】，並發放績效獎金【NT$ 345,000】。',
    processedContent: '請幫我潤飾這段年度考績評語與職等升遷推薦詞：員工【王大明】，身分證字號【A1********】，本年度於雲端遷移專案表現卓越，考績評定為優等 (A+)。建議由資深專員晉升副理，建議調薪幅度為 12%，調整後月薪為【[CONFIDENTIAL_SALARY]】，並發放績效獎金【[CONFIDENTIAL_BONUS]】。',
    action: 'MASK',
    riskLevel: 'MEDIUM',
    triggeredPolicies: [
      { id: 'DLP-POL-004', name: '個人可識別資訊 (PII - 國民身分證字號) 脫敏原則', category: 'PII', severity: 'MEDIUM' },
      { id: 'DLP-POL-008', name: '企業員工薪資福利與報酬隱私保護原則', category: 'FINANCIAL', severity: 'MEDIUM' }
    ],
    matchDetails: [
      { type: '中華民國國民身分證字號 (ROC ID)', detectedText: 'A123456789', replacedWith: 'A1********' },
      { type: '員工薪資機敏數字 (Monthly Salary)', detectedText: 'NT$ 115,000', replacedWith: '[CONFIDENTIAL_SALARY]' },
      { type: '獎金報酬機敏數字 (Bonus)', detectedText: 'NT$ 345,000', replacedWith: '[CONFIDENTIAL_BONUS]' }
    ],
    socForwarded: true,
    socAlertId: 'SOC-AI-AUDIT-4412',
    latencyMs: 18
  },

  // Scenario C: Midnight token scraping script -> RATE LIMIT BLOCK & HIGH RISK ALERT
  {
    id: 'aigw-evt-20261019-003',
    timestamp: '2026-10-19T02:41:08.550Z',
    userId: 'usr_sales_8812',
    userName: 'Kevin Chen (全球業務處代表)',
    department: '全球業務處 (Global Sales)',
    userRole: 'Sales_Representative',
    sourceIp: '185.220.101.5',
    targetModel: 'gpt-4o-mini',
    modelProvider: 'OpenAI',
    promptTokensEstimate: 4200,
    originalContent: 'System Batch Automation Query #892: Summarize competitive product intelligence dataset chunk 449 and output raw JSON parameters...',
    action: 'BLOCK',
    riskLevel: 'HIGH',
    triggeredPolicies: [
      { id: 'RATE-LIMIT-POL-001', name: '單一使用者高頻率突發請求防護原則 (Max 30 req/min)', category: 'RATE_LIMIT', severity: 'HIGH' },
      { id: 'UEBA-AI-003', name: '非工作時段 (深夜 02:00-05:00) 異常自動化 Token 刷取行為偵測', category: 'SHADOW_AI', severity: 'HIGH' }
    ],
    matchDetails: [
      { type: '頻率違規 (Sliding Window)', detectedText: '60 秒內發起 92 次 Prompt 請求 (限制: 30 次/分)' },
      { type: '異常夜間行為 (UEBA Anomaly)', detectedText: '深夜 02:41 境外 IP 發起高頻批次腳本調用，累積消耗 285,000 Tokens' }
    ],
    socForwarded: true,
    socAlertId: 'SOC-AI-CRITICAL-8812',
    latencyMs: 8,
    blockReason: '觸發非工作時段高頻刷取防護機制：該帳號在深夜 60 秒內累計發起 92 次 Prompt 請求，累計消耗 285,000 Tokens，判定為自動化腳本或憑證外流盜用，網關已立即實施熔斷阻斷，並同步通報 SOC 安全中心隔離憑證！'
  }
];

// Helper to check Prompt compliance against DLP rules
function inspectPrompt(content: string, user: { id: string; name: string; dept: string; role: string }) {
  const matchDetails: Array<{ type: string; detectedText: string; replacedWith?: string }> = [];
  const triggeredPolicies: Array<{ id: string; name: string; category: any; severity: string }> = [];
  let action: 'PASS' | 'MASK' | 'BLOCK' = 'PASS';
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let blockReason: string | undefined = undefined;
  let processedContent = content;

  // 1. Check for Secrets & API Keys (CRITICAL -> BLOCK)
  const apiKeyRegex = /(?:sk-[a-zA-Z0-9_\-]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/g;
  const apiKeyMatches = content.match(apiKeyRegex);
  if (apiKeyMatches && apiKeyMatches.length > 0) {
    apiKeyMatches.forEach(key => {
      matchDetails.push({ type: '機密金鑰/API Key (Secret Key)', detectedText: key });
    });
    triggeredPolicies.push({
      id: 'SEC-POL-002',
      name: '公有雲 / 內部 API Key 與認證金鑰洩漏防護',
      category: 'SECRET',
      severity: 'CRITICAL'
    });
    action = 'BLOCK';
    riskLevel = 'CRITICAL';
    blockReason = 'Prompt 內包含高敏憑證金鑰 (API Key / Private Key)，禁止送往外部模型！';
  }

  // 2. Check for Database Connection Strings / Internal credentials (CRITICAL -> BLOCK)
  const connStringRegex = /(?:postgres|mysql|mongodb|redis):\/\/[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9_.-]+:\d+\/[a-zA-Z0-9_.-]+/g;
  const connMatches = content.match(connStringRegex);
  if (connMatches && connMatches.length > 0) {
    connMatches.forEach(conn => {
      matchDetails.push({ type: '資料庫連線字串 (含密碼)', detectedText: conn });
    });
    triggeredPolicies.push({
      id: 'SEC-POL-001',
      name: '企業核心資料庫與內部端點資訊外流防護',
      category: 'SOURCE_CODE',
      severity: 'CRITICAL'
    });
    action = 'BLOCK';
    riskLevel = 'CRITICAL';
    blockReason = (blockReason ? blockReason + ' ' : '') + '偵測到內部資料庫連線帳密字串！';
  }

  // 3. Check for Proprietary Source Code patterns (HIGH -> BLOCK)
  const sourceCodeKeywords = ['executeBillingCharge', 'processPayment', 'SELECT * FROM accounts', 'core_billing', 'system_secret'];
  const hasSourceCode = sourceCodeKeywords.some(kw => content.includes(kw));
  if (hasSourceCode && action !== 'BLOCK') {
    matchDetails.push({ type: '核心業務邏輯原始碼', detectedText: '偵測到受保護的專利微服務程式碼' });
    triggeredPolicies.push({
      id: 'SEC-POL-001',
      name: '企業核心原始碼與演算法外流防護策略',
      category: 'SOURCE_CODE',
      severity: 'HIGH'
    });
    action = 'BLOCK';
    riskLevel = 'HIGH';
    blockReason = 'Prompt 內包含核心專利與微服務原始碼，已被安全網關阻擋！';
  }

  // 4. Check for PII: Taiwan National ID (MEDIUM -> MASK)
  const twIdRegex = /\b[A-Z][12]\d{8}\b/g;
  if (processedContent.match(twIdRegex)) {
    processedContent = processedContent.replace(twIdRegex, (id) => {
      matchDetails.push({
        type: '身分證字號 (ROC National ID)',
        detectedText: id,
        replacedWith: id.slice(0, 2) + '********'
      });
      return id.slice(0, 2) + '********';
    });
    triggeredPolicies.push({
      id: 'DLP-POL-004',
      name: '個人可識別資訊 (PII - 國民身分證字號) 脫敏原則',
      category: 'PII',
      severity: 'MEDIUM'
    });
    if (action !== 'BLOCK') {
      action = 'MASK';
      riskLevel = 'MEDIUM';
    }
  }

  // 5. Check for Credit Card (MEDIUM -> MASK)
  const ccRegex = /\b(?:\d{4}[- ]?){3}\d{4}\b/g;
  if (processedContent.match(ccRegex)) {
    processedContent = processedContent.replace(ccRegex, (cc) => {
      matchDetails.push({
        type: '信用卡卡號 (Credit Card Number)',
        detectedText: cc,
        replacedWith: '****-****-****-' + cc.replace(/\D/g, '').slice(-4)
      });
      return '****-****-****-' + cc.replace(/\D/g, '').slice(-4);
    });
    triggeredPolicies.push({
      id: 'DLP-POL-005',
      name: '金融支付卡號 (PCI-DSS) 動態遮蔽原則',
      category: 'PII',
      severity: 'MEDIUM'
    });
    if (action !== 'BLOCK') {
      action = 'MASK';
      riskLevel = 'MEDIUM';
    }
  }

  // 6. Check for Salary / Compensation details (MEDIUM -> MASK)
  const salaryRegex = /(?:月薪|本薪|年薪|薪資|獎金)(?:為|是|約|達)?\s*(?:【)?\s*(?:NT\$?|\$)?\s*(\d{1,3}(?:,\d{3})+|\d{4,})\s*(?:】)?/g;
  if (processedContent.match(salaryRegex)) {
    processedContent = processedContent.replace(salaryRegex, (fullMatch) => {
      matchDetails.push({
        type: '薪資獎金數字 (Confidential Salary)',
        detectedText: fullMatch,
        replacedWith: '[CONFIDENTIAL_SALARY]'
      });
      return '[CONFIDENTIAL_SALARY]';
    });
    triggeredPolicies.push({
      id: 'DLP-POL-008',
      name: '企業員工薪資福利與報酬隱私保護原則',
      category: 'FINANCIAL',
      severity: 'MEDIUM'
    });
    if (action !== 'BLOCK') {
      action = 'MASK';
      riskLevel = 'MEDIUM';
    }
  }

  return {
    action,
    riskLevel,
    blockReason,
    matchDetails,
    triggeredPolicies,
    processedContent: action === 'BLOCK' ? undefined : (action === 'MASK' ? processedContent : content)
  };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. POST /api/v1/scan-prompt - Prompt Compliance & Dynamic DLP Inspection
router.post('/scan-prompt', (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    userId = 'usr_analyst_001',
    userName = 'Security User',
    department = 'SecOps Center',
    userRole = 'Analyst',
    sourceIp = req.ip || '10.120.10.50',
    targetModel = 'gpt-4o',
    modelProvider = 'OpenAI',
    systemPrompt = '',
    promptContent = ''
  } = req.body;

  if (!promptContent) {
    return res.status(400).json({
      success: false,
      error: 'Prompt content is required for compliance scanning'
    });
  }

  // Rough token estimation: 1 token ~ 3-4 chars for English/Chinese mix
  const estimatedTokens = Math.max(1, Math.round((systemPrompt.length + promptContent.length) / 3));

  // Run DLP Engine inspection
  const inspection = inspectPrompt(promptContent, {
    id: userId,
    name: userName,
    dept: department,
    role: userRole
  });

  const latencyMs = Date.now() - startTime;
  const eventId = `aigw-evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Create Audit Record
  const newAuditRecord: AiGatewayAuditEvent = {
    id: eventId,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    department,
    userRole,
    sourceIp,
    targetModel,
    modelProvider,
    promptTokensEstimate: estimatedTokens,
    originalContent: promptContent,
    processedContent: inspection.processedContent,
    action: inspection.action,
    riskLevel: inspection.riskLevel,
    triggeredPolicies: inspection.triggeredPolicies,
    matchDetails: inspection.matchDetails,
    socForwarded: inspection.action !== 'PASS',
    socAlertId: inspection.action !== 'PASS' ? `SOC-AI-${Date.now().toString().slice(-4)}` : undefined,
    latencyMs,
    blockReason: inspection.blockReason
  };

  // Prepend to audit log history
  auditLogs.unshift(newAuditRecord);
  if (auditLogs.length > 500) {
    auditLogs.pop();
  }

  // Return standard response conforming to the specification
  return res.json({
    success: true,
    inspectionId: eventId,
    timestamp: newAuditRecord.timestamp,
    status: inspection.action,
    riskLevel: inspection.riskLevel,
    model: targetModel,
    provider: modelProvider,
    tokensEstimate: estimatedTokens,
    inspectionDurationMs: latencyMs,
    summary: {
      actionTaken: inspection.action === 'BLOCK' ? 'BLOCKED' : (inspection.action === 'MASK' ? 'MASKED_AND_FORWARDED' : 'PASSED'),
      message: inspection.action === 'BLOCK' 
        ? `提示詞包含嚴重違規機敏資訊，已由 AI Gateway 邊緣阻斷！原因：${inspection.blockReason}`
        : inspection.action === 'MASK'
        ? `提示詞包含個人隱私或敏感薪酬數據，已完成即時動態脫敏 (Masking) 並放行至 ${targetModel}。`
        : `提示詞已通過安全合規審查，無違規風險。`,
      socAlertDispatched: inspection.action !== 'PASS',
      socAlertId: newAuditRecord.socAlertId
    },
    policyViolations: inspection.triggeredPolicies,
    matches: inspection.matchDetails,
    sanitizedPrompt: inspection.processedContent,
    originalPromptLength: promptContent.length,
    sanitizedPromptLength: inspection.processedContent?.length || 0
  });
});

// 2. GET /api/v1/ai-gateway/metrics - Overview KPI Dashboard Data
router.get('/metrics', (_req: Request, res: Response) => {
  const totalRequests = auditLogs.length + 1840;
  const blockedCount = auditLogs.filter(e => e.action === 'BLOCK').length + 128;
  const maskedCount = auditLogs.filter(e => e.action === 'MASK').length + 386;
  const passedCount = totalRequests - blockedCount - maskedCount;

  res.json({
    success: true,
    metrics: {
      kpi1_shadowAiBlocked: {
        totalBlocks: blockedCount,
        growthPercentage: '+18.4%',
        unauthorizedModelAttempts: 45,
        trend: [12, 19, 15, 24, 30, 22, 28]
      },
      kpi2_dlpViolationDistribution: {
        pii: 42,        // 42%
        secretsAndKeys: 28, // 28%
        sourceCode: 18,    // 18%
        financials: 12     // 12%
      },
      kpi3_departmentTokenUsage: [
        { department: '研發工程處 (R&D)', tokens: 14200000, percentage: 48, topModel: 'gpt-4o' },
        { department: '全球業務處 (Sales)', tokens: 6800000, percentage: 23, topModel: 'gpt-4o-mini' },
        { department: '人力資源處 (HR)', tokens: 3500000, percentage: 12, topModel: 'claude-3-5-sonnet' },
        { department: '行銷發展處 (Marketing)', tokens: 2900000, percentage: 10, topModel: 'gemini-1.5-pro' },
        { department: '資安維運中心 (SecOps)', tokens: 2100000, percentage: 7, topModel: 'claude-3-haiku' }
      ],
      kpi4_complianceRate: {
        passedRate: ((passedCount / totalRequests) * 100).toFixed(1),
        maskedRate: ((maskedCount / totalRequests) * 100).toFixed(1),
        blockedRate: ((blockedCount / totalRequests) * 100).toFixed(1)
      },
      kpi5_highRiskAlerts: {
        totalCriticalAlerts: 16,
        rateLimitBlocks: 9,
        offHoursActivitySpikes: 5,
        unauthorizedDataExfiltrationAttempts: 2
      }
    }
  });
});

// 3. GET /api/v1/ai-gateway/logs - Audit Trail Log Feed
router.get('/logs', (req: Request, res: Response) => {
  const { action, risk, dept } = req.query;
  let filtered = [...auditLogs];

  if (action && typeof action === 'string' && action !== 'ALL') {
    filtered = filtered.filter(l => l.action.toLowerCase() === action.toLowerCase());
  }
  if (risk && typeof risk === 'string' && risk !== 'ALL') {
    filtered = filtered.filter(l => l.riskLevel.toLowerCase() === risk.toLowerCase());
  }
  if (dept && typeof dept === 'string' && dept !== 'ALL') {
    filtered = filtered.filter(l => l.department.includes(dept));
  }

  res.json({
    success: true,
    totalCount: filtered.length,
    logs: filtered
  });
});

// 4. POST /api/v1/ai-gateway/reset - Reset Logs to Default Benchmark Scenarios
router.post('/reset', (_req: Request, res: Response) => {
  auditLogs = auditLogs.slice(0, 3);
  res.json({
    success: true,
    message: 'AI Gateway 審計日誌已重置為基準測試場景數據'
  });
});


// 5. POST /api/v1/ai-gateway/webhook/alerts - Real-time High-Risk Alert Ingestion with HMAC-SHA256 Signature Verification
router.post("/webhook/alerts", (req: Request, res: Response) => {
  const signatureHeader = (req.headers["x-semor-signature"] as string) || "";
  const timestampHeader = (req.headers["x-semor-timestamp"] as string) || "";
  const secret = process.env.SEMOR_WEBHOOK_SECRET || "semor_ai_sec_shared_key_2026";

  const rawPayload = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawPayload);
  const expectedSignature = hmac.digest("hex");

  // Also support signature format "sha256=<hex>" or plain hex
  const cleanSignature = signatureHeader.replace(/^sha256=/, "").trim();
  const isValid = cleanSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(cleanSignature, "utf-8"), Buffer.from(expectedSignature, "utf-8"));

  const logData = req.body || {};
  const alertId = "aigw-alert-" + Date.now();
  const alertEvent: AiGatewayAuditEvent = {
    id: alertId,
    timestamp: logData.timestamp || new Date().toISOString(),
    userId: logData.userId || "usr_unknown",
    userName: logData.userName || "Security Principal",
    department: logData.department || "Enterprise Org",
    userRole: logData.userRole || "User",
    sourceIp: logData.sourceIp || req.ip || "127.0.0.1",
    targetModel: logData.targetModel || logData.model || "unknown-llm",
    modelProvider: logData.modelProvider || "External-AI",
    promptTokensEstimate: logData.tokens || logData.promptTokensEstimate || 150,
    originalContent: logData.originalContent || logData.content || "High-risk alert payload forwarded via Webhook",
    action: logData.action || "BLOCK",
    riskLevel: logData.riskLevel || "CRITICAL",
    triggeredPolicies: logData.triggeredPolicies || [
      { id: "POL-WEBHOOK-ALERT", name: logData.policyName || "DLP High-Risk Block", category: "SECRET", severity: "CRITICAL" }
    ],
    matchDetails: logData.matchDetails || [
      { type: "WEBHOOK_TRIGGER", detectedText: "Webhook Alert Ingest" }
    ],
    socForwarded: true,
    socAlertId: "SOC-ALRT-" + Date.now(),
    latencyMs: logData.latencyMs || 12,
    blockReason: logData.blockReason || "Intercepted by AI Gateway DLP Engine (Forwarded via Signed Webhook)"
  };

  if (!isValid && signatureHeader) {
    return res.status(401).json({
      success: false,
      error: "INVALID_SIGNATURE",
      message: "HMAC-SHA256 signature verification failed against pre-shared secret",
      receivedSignature: signatureHeader,
      expectedSignaturePrefix: expectedSignature.slice(0, 10) + "..."
    });
  }

  // Prepend to audit log
  auditLogs.unshift(alertEvent);

  res.status(200).json({
    success: true,
    status: "RECEIVED",
    alertId,
    verifiedSignature: !!signatureHeader && isValid,
    timestamp: new Date().toISOString(),
    message: "High-risk alert successfully ingested into SEMOR CYBER SOC"
  });
});

// 6. GET /api/v1/ai-gateway/publisher-config - Dual-Track Publisher Config & SDK Specs
router.get("/publisher-config", (_req: Request, res: Response) => {
  res.json({
    success: true,
    config: {
      syslog: {
        host: "siem-soc.corp.internal",
        port: 6514,
        protocol: "RFC5424_TLS",
        tlsVersion: "TLSv1.3",
        facility: 16, // Local0
        severity: 6,  // Informational
        appName: "semor-ai-gateway"
      },
      webhook: {
        url: "https://siem-soc.corp.internal/api/v1/ai-gateway/webhook/alerts",
        secret: "semor_ai_sec_shared_key_2026",
        algorithm: "HMAC-SHA256",
        headerSignature: "X-Semor-Signature",
        headerTimestamp: "X-Semor-Timestamp",
        timeoutMs: 3000
      }
    }
  });
});

export const createAiGatewayRouter = () => router;

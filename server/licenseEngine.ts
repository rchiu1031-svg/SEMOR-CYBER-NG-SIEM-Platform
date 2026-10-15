import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export type LicenseTier = 'Community' | 'Professional' | 'Enterprise' | 'Ultimate';
export type LicenseStatus = 'Active' | 'Warning' | 'GracePeriod' | 'Expired' | 'OverQuota' | 'Invalid' | 'Tampered';

export interface NodeBreakdownItem {
  active: number;
  max: number;
  description: string;
}

export interface LicenseNodeBreakdown {
  masterNodes: NodeBreakdownItem;
  workerNodes: NodeBreakdownItem;
  flowSensors: NodeBreakdownItem;
  endpointAgents: NodeBreakdownItem;
  otProbes: NodeBreakdownItem;
}

export interface LicenseAddons {
  aiInferenceCore: boolean;
  purdueOtdpi: boolean;
  soarPlaybooksPro: boolean;
  haClustering: boolean;
  vansCompliance: boolean;
  microsegmentation: boolean;
}

export interface LicenseRecord {
  licenseKey: string;
  tier: LicenseTier;
  tierDisplayName: string;
  status: LicenseStatus;
  customer: {
    organization: string;
    department: string;
    contactEmail: string;
    contractId: string;
    country: string;
  };
  hardwareFingerprint: string;
  isNodeLocked: boolean;
  issuedDate: string;
  expiryDate: string;
  gracePeriodDays: number;
  daysRemaining: number;
  maxNodes: number;
  currentNodes: number;
  nodeBreakdown: LicenseNodeBreakdown;
  maxEps: number;
  currentEps: number;
  entitledModules: string[];
  addons: LicenseAddons;
  issuer: string;
  certificateSerial: string;
  digitalSignature: string;
  lastVerifiedAt: string;
  lastSyncAt: string;
}

export interface LicenseAuditEntry {
  id: string;
  timestamp: string;
  action: 'INITIALIZE' | 'ACTIVATE' | 'RENEW' | 'UPGRADE' | 'VERIFY' | 'OFFLINE_IMPORT' | 'EXPORT' | 'QUOTA_SYNC' | 'TAMPER_CHECK';
  operator: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ipAddress?: string;
}

const LICENSE_CONFIG_FILE = path.join(process.cwd(), 'license_config.json');
const LICENSE_SECRET_KEY = 'SEMOR-SEC-SECRET-KEY-ROOT-CA-2026-FIM-SIEM-SOAR';

// Helper to compute system hardware fingerprint
export function generateHardwareFingerprint(): string {
  try {
    const hostname = os.hostname() || 'semor-core-node';
    const cpus = os.cpus();
    const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Generic-CPU';
    const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    const arch = os.arch();
    const platform = os.platform();

    const nifs = os.networkInterfaces();
    let macAddress = '00:50:56:c0:00:08';
    for (const key of Object.keys(nifs)) {
      const list = nifs[key];
      if (list) {
        for (const iface of list) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            macAddress = iface.mac;
            break;
          }
        }
      }
    }

    const rawString = `${hostname}|${cpuModel}|${totalMem}GB|${arch}|${platform}|${macAddress}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase();
    return `HWID-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;
  } catch (err) {
    return 'HWID-7A9B-44E2-90FC-B138';
  }
}

// Compute cryptographic signature for tamper resistance
export function signLicenseData(data: Partial<LicenseRecord>): string {
  const payload = [
    data.licenseKey,
    data.tier,
    data.customer?.organization,
    data.customer?.contractId,
    data.expiryDate,
    data.maxNodes,
    data.maxEps,
    data.hardwareFingerprint,
    (data.entitledModules || []).sort().join(',')
  ].join('::');

  return crypto.createHmac('sha256', LICENSE_SECRET_KEY).update(payload).digest('hex').toUpperCase();
}

// Default Enterprise Modules
const ALL_MODULES = [
  'discovery',
  'flow',
  'endpoint',
  'case-management',
  'gateway',
  'fim',
  'intel',
  'malware-analysis',
  'vulnerability',
  'soar',
  'industrial',
  'apm',
  'ai-analyst',
  'honeypot-map',
  'ueba-investigation',
  'wargaming',
  'correlation-summary',
  'ndr-analytics'
];

export class LicenseEngine {
  private license: LicenseRecord;
  private auditLogs: LicenseAuditEntry[] = [];
  private hardwareFingerprint: string;

  constructor() {
    this.hardwareFingerprint = generateHardwareFingerprint();
    this.license = this.loadConfig();
    this.recalculateStatus();
  }

  private getDefaultLicense(): LicenseRecord {
    const hwid = this.hardwareFingerprint;
    const now = new Date();
    const expiry = new Date(now.getFullYear() + 2, 11, 31, 23, 59, 59); // 2+ years from now

    const defaultRec: Partial<LicenseRecord> = {
      licenseKey: 'SEMOR-ENT-2026-8841-9923-SEC8',
      tier: 'Enterprise',
      tierDisplayName: 'Enterprise SecOps Suite (企業旗艦版)',
      status: 'Active',
      customer: {
        organization: '國防級國家關鍵基礎設施數位防禦中心',
        department: '資通安全處 / 核心 SOC 運籌中心',
        contactEmail: 'soc-admin@gov.internal.tw',
        contractId: 'CTR-2026-TW-CIP-9011',
        country: 'Taiwan (ROC)'
      },
      hardwareFingerprint: hwid,
      isNodeLocked: false,
      issuedDate: '2026-01-01T00:00:00Z',
      expiryDate: expiry.toISOString(),
      gracePeriodDays: 14,
      daysRemaining: 730,
      maxNodes: 500,
      currentNodes: 142,
      nodeBreakdown: {
        masterNodes: { active: 1, max: 2, description: '主控中樞 HA 集群節點' },
        workerNodes: { active: 4, max: 8, description: '日誌解析與關聯運算 Worker' },
        flowSensors: { active: 12, max: 25, description: '全流量深包檢測 (DPI) 探針' },
        endpointAgents: { active: 110, max: 400, description: 'EDR/FIM 主機微代理' },
        otProbes: { active: 15, max: 65, description: '工控 Purdue 隔離邊界安全探針' }
      },
      maxEps: 25000,
      currentEps: 4850,
      entitledModules: [...ALL_MODULES],
      addons: {
        aiInferenceCore: true,
        purdueOtdpi: true,
        soarPlaybooksPro: true,
        haClustering: true,
        vansCompliance: true,
        microsegmentation: true
      },
      issuer: 'SEMOR GLOBAL ENTITLEMENT ROOT CA',
      certificateSerial: 'CERT-SN-89F1-44B7-A189',
      lastVerifiedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString()
    };

    defaultRec.digitalSignature = signLicenseData(defaultRec);
    return defaultRec as LicenseRecord;
  }

  private loadConfig(): LicenseRecord {
    try {
      if (fs.existsSync(LICENSE_CONFIG_FILE)) {
        const raw = fs.readFileSync(LICENSE_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.licenseKey && parsed.tier) {
          if (Array.isArray(parsed.auditLogs)) {
            this.auditLogs = parsed.auditLogs;
          }
          return parsed.license;
        }
      }
    } catch (err) {
      console.warn('[LicenseEngine] Error loading license_config.json, initializing defaults:', err);
    }

    const defaultLic = this.getDefaultLicense();
    this.auditLogs = [
      {
        id: `AUD-${Date.now()}-01`,
        timestamp: new Date().toISOString(),
        action: 'INITIALIZE',
        operator: 'System Kernel',
        details: '平台授權引擎初始化成功，載入企業旗艦版 (Enterprise) 憑證，簽章校驗通過。',
        status: 'SUCCESS'
      }
    ];
    this.saveConfig(defaultLic);
    return defaultLic;
  }

  private saveConfig(lic: LicenseRecord = this.license): void {
    try {
      const dataToSave = {
        savedAt: new Date().toISOString(),
        license: lic,
        auditLogs: this.auditLogs.slice(-100) // Keep last 100 audit entries
      };
      fs.writeFileSync(LICENSE_CONFIG_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[LicenseEngine] Failed to write license_config.json:', err);
    }
  }

  private recalculateStatus(): void {
    const now = new Date();
    const expiry = new Date(this.license.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.license.daysRemaining = diffDays;

    // Check signature integrity
    const expectedSig = signLicenseData(this.license);
    if (this.license.digitalSignature !== expectedSig) {
      this.license.status = 'Tampered';
      return;
    }

    // Check hardware lock
    if (this.license.isNodeLocked && this.license.hardwareFingerprint !== this.hardwareFingerprint) {
      this.license.status = 'Invalid';
      return;
    }

    // Check quota
    if (this.license.currentNodes > this.license.maxNodes) {
      this.license.status = 'OverQuota';
      return;
    }

    // Check expiration and grace period
    if (diffDays < -this.license.gracePeriodDays) {
      this.license.status = 'Expired';
    } else if (diffDays <= 0) {
      this.license.status = 'GracePeriod';
    } else if (diffDays <= 30) {
      this.license.status = 'Warning';
    } else {
      this.license.status = 'Active';
    }
  }

  public getLicense(): LicenseRecord {
    this.recalculateStatus();
    return { ...this.license };
  }

  public getHardwareFingerprint(): {
    fingerprint: string;
    hostname: string;
    osPlatform: string;
    osArch: string;
    totalMemGB: number;
    cpuCores: number;
    cpuModel: string;
  } {
    const cpus = os.cpus() || [];
    return {
      fingerprint: this.hardwareFingerprint,
      hostname: os.hostname() || 'semor-defense-node',
      osPlatform: os.platform(),
      osArch: os.arch(),
      totalMemGB: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
      cpuCores: cpus.length,
      cpuModel: cpus[0]?.model || 'Standard Multi-Core Processor'
    };
  }

  public verifyIntegrity(): {
    valid: boolean;
    signatureMatch: boolean;
    hardwareMatch: boolean;
    daysRemaining: number;
    status: LicenseStatus;
    details: string[];
    certificateSerial: string;
  } {
    this.recalculateStatus();
    const expectedSig = signLicenseData(this.license);
    const signatureMatch = this.license.digitalSignature === expectedSig;
    const hardwareMatch = !this.license.isNodeLocked || (this.license.hardwareFingerprint === this.hardwareFingerprint);

    const details: string[] = [];
    if (signatureMatch) {
      details.push('✅ HMAC-SHA256 數位憑證簽名完全匹配 (SEMOR Root CA 根信任認證)');
    } else {
      details.push('❌ 憑證簽章校驗失敗！授權內容疑似遭到非授權篡改');
    }

    if (hardwareMatch) {
      details.push(`✅ 主機硬體指紋驗證吻合 [${this.hardwareFingerprint}]`);
    } else {
      details.push(`❌ 硬體指紋不符！憑證綁定 [${this.license.hardwareFingerprint}]，目前實體機為 [${this.hardwareFingerprint}]`);
    }

    if (this.license.daysRemaining > 0) {
      details.push(`✅ 授權效期正常，剩餘 ${this.license.daysRemaining} 天`);
    } else if (this.license.daysRemaining >= -this.license.gracePeriodDays) {
      details.push(`⚠️ 授權已進入安全寬限期，尚有 ${this.license.gracePeriodDays + this.license.daysRemaining} 天寬限時間`);
    } else {
      details.push(`❌ 授權已正式過期 (${Math.abs(this.license.daysRemaining)} 天前)`);
    }

    if (this.license.currentNodes <= this.license.maxNodes) {
      details.push(`✅ 叢集節點容量在額度內 (${this.license.currentNodes} / ${this.license.maxNodes} 節點)`);
    } else {
      details.push(`⚠️ 節點容量超額！目前已接入 ${this.license.currentNodes} 個，上限為 ${this.license.maxNodes}`);
    }

    const valid = signatureMatch && hardwareMatch && (this.license.status === 'Active' || this.license.status === 'Warning' || this.license.status === 'GracePeriod');

    this.license.lastVerifiedAt = new Date().toISOString();
    this.saveConfig();

    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'VERIFY',
      operator: 'Security Engine',
      details: valid ? `授權完整性檢查通過 (${this.license.tierDisplayName})` : `授權完整性檢查異常：狀態為 ${this.license.status}`,
      status: valid ? 'SUCCESS' : 'FAILED'
    });

    return {
      valid,
      signatureMatch,
      hardwareMatch,
      daysRemaining: this.license.daysRemaining,
      status: this.license.status,
      details,
      certificateSerial: this.license.certificateSerial
    };
  }

  public activateKey(key: string, operator: string = 'Admin'): { success: boolean; message: string; license?: LicenseRecord } {
    const cleanKey = (key || '').trim().toUpperCase();

    if (!cleanKey || cleanKey.length < 16) {
      return { success: false, message: '授權金鑰格式錯誤，請提供標準 SEMOR 金鑰 (例如: SEMOR-ENT-2026-XXXX-XXXX-XXXX)' };
    }

    let tier: LicenseTier = 'Enterprise';
    let maxNodes = 500;
    let maxEps = 25000;
    let tierName = 'Enterprise SecOps Suite (企業旗艦版)';
    let modules = [...ALL_MODULES];

    if (cleanKey.includes('ULT') || cleanKey.includes('ULTIMATE')) {
      tier = 'Ultimate';
      maxNodes = 2000;
      maxEps = 100000;
      tierName = 'Ultimate MSSP Sovereign Defense (國家級尊榮國防版)';
      modules = [...ALL_MODULES];
    } else if (cleanKey.includes('PRO') || cleanKey.includes('PROFESSIONAL')) {
      tier = 'Professional';
      maxNodes = 150;
      maxEps = 8000;
      tierName = 'Professional Defense Suite (專業防禦版)';
      modules = [
        'discovery', 'flow', 'endpoint', 'case-management', 'gateway', 'fim',
        'intel', 'malware-analysis', 'vulnerability', 'correlation-summary', 'ndr-analytics'
      ];
    } else if (cleanKey.includes('COM') || cleanKey.includes('COMMUNITY')) {
      tier = 'Community';
      maxNodes = 30;
      maxEps = 1500;
      tierName = 'Community Open Core (開源社群基礎版)';
      modules = ['discovery', 'flow', 'endpoint', 'case-management', 'gateway', 'fim'];
    }

    const now = new Date();
    const expiry = new Date(now.getFullYear() + 2, 11, 31, 23, 59, 59);

    this.license.licenseKey = cleanKey;
    this.license.tier = tier;
    this.license.tierDisplayName = tierName;
    this.license.maxNodes = maxNodes;
    this.license.maxEps = maxEps;
    this.license.issuedDate = now.toISOString();
    this.license.expiryDate = expiry.toISOString();
    this.license.entitledModules = modules;
    this.license.addons = {
      aiInferenceCore: tier === 'Enterprise' || tier === 'Ultimate',
      purdueOtdpi: tier === 'Enterprise' || tier === 'Ultimate',
      soarPlaybooksPro: tier === 'Enterprise' || tier === 'Ultimate',
      haClustering: tier === 'Enterprise' || tier === 'Ultimate',
      vansCompliance: tier !== 'Community',
      microsegmentation: tier === 'Ultimate'
    };
    this.license.certificateSerial = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;
    this.license.digitalSignature = signLicenseData(this.license);
    this.license.lastVerifiedAt = now.toISOString();

    this.recalculateStatus();
    this.saveConfig();

    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: now.toISOString(),
      action: 'ACTIVATE',
      operator,
      details: `成功啟用新授權 [${cleanKey}]，升級為 ${tierName}，節點上限 ${maxNodes}，EPS 上限 ${maxEps}。`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `授權金鑰啟用成功！方案已切換為：${tierName}`,
      license: this.getLicense()
    };
  }

  public importOfflineCertificate(fileContent: string, operator: string = 'Admin'): { success: boolean; message: string; license?: LicenseRecord } {
    try {
      let rawJson = fileContent.trim();
      // If base64 encoded
      if (!rawJson.startsWith('{') && rawJson.length > 20) {
        rawJson = Buffer.from(rawJson, 'base64').toString('utf-8');
      }

      const certObj = JSON.parse(rawJson);
      if (!certObj.licenseKey || !certObj.tier || !certObj.digitalSignature) {
        return { success: false, message: '離線憑證結構不合法，缺少必要的簽章欄位或金鑰本體。' };
      }

      // Check signature
      const expectedSig = signLicenseData(certObj);
      if (certObj.digitalSignature !== expectedSig) {
        this.auditLogs.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'OFFLINE_IMPORT',
          operator,
          details: '匯入離線憑證失敗：HMAC 簽章與內容不一致，疑遭到惡意竄改。',
          status: 'FAILED'
        });
        return { success: false, message: '離線憑證簽章校驗失敗！數位簽章無效或憑證已被修改。' };
      }

      // Import valid cert
      this.license = {
        ...this.license,
        ...certObj,
        lastVerifiedAt: new Date().toISOString()
      };

      this.recalculateStatus();
      this.saveConfig();

      this.auditLogs.unshift({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'OFFLINE_IMPORT',
        operator,
        details: `成功匯入離線授權憑證 (.lic) [${this.license.certificateSerial}]，方案：${this.license.tierDisplayName}`,
        status: 'SUCCESS'
      });

      return {
        success: true,
        message: `離線憑證匯入並簽章校驗成功！目前生效方案：${this.license.tierDisplayName}`,
        license: this.getLicense()
      };
    } catch (err: any) {
      return { success: false, message: `解析離線憑證檔案失敗: ${err.message}` };
    }
  }

  public exportCertificate(): { filename: string; contentType: string; base64Content: string; rawJson: string } {
    this.recalculateStatus();
    this.license.digitalSignature = signLicenseData(this.license);
    this.saveConfig();

    const rawJson = JSON.stringify(this.license, null, 2);
    const base64Content = Buffer.from(rawJson, 'utf-8').toString('base64');
    const filename = `SEMOR_LICENSE_${this.license.tier.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.lic`;

    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'EXPORT',
      operator: 'Admin',
      details: `匯出具數位簽章之離線憑證檔案 [${filename}]`,
      status: 'SUCCESS'
    });

    return {
      filename,
      contentType: 'application/octet-stream',
      base64Content,
      rawJson
    };
  }

  public renewLicense(months: number = 12, operator: string = 'Admin'): { success: boolean; message: string; license: LicenseRecord } {
    const curExpiry = new Date(this.license.expiryDate);
    const baseDate = curExpiry.getTime() > Date.now() ? curExpiry : new Date();
    baseDate.setMonth(baseDate.getMonth() + months);

    this.license.expiryDate = baseDate.toISOString();
    this.license.digitalSignature = signLicenseData(this.license);
    this.recalculateStatus();
    this.saveConfig();

    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'RENEW',
      operator,
      details: `授權有效期限已成功展延 ${months} 個月至 ${this.license.expiryDate.slice(0, 10)}。`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `授權已成功展延 ${months} 個月！新到期日：${this.license.expiryDate.slice(0, 10)}`,
      license: this.getLicense()
    };
  }

  public upgradeTier(tier: LicenseTier, maxNodes?: number, operator: string = 'Admin'): { success: boolean; message: string; license: LicenseRecord } {
    let keyPrefix = 'SEMOR-ENT';
    let tierName = 'Enterprise SecOps Suite (企業旗艦版)';
    let defNodes = 500;
    let defEps = 25000;
    let modules = [...ALL_MODULES];

    if (tier === 'Ultimate') {
      keyPrefix = 'SEMOR-ULT';
      tierName = 'Ultimate MSSP Sovereign Defense (國家級尊榮國防版)';
      defNodes = 2000;
      defEps = 100000;
    } else if (tier === 'Professional') {
      keyPrefix = 'SEMOR-PRO';
      tierName = 'Professional Defense Suite (專業防禦版)';
      defNodes = 150;
      defEps = 8000;
      modules = [
        'discovery', 'flow', 'endpoint', 'case-management', 'gateway', 'fim',
        'intel', 'malware-analysis', 'vulnerability', 'correlation-summary', 'ndr-analytics'
      ];
    } else if (tier === 'Community') {
      keyPrefix = 'SEMOR-COM';
      tierName = 'Community Open Core (開源社群基礎版)';
      defNodes = 30;
      defEps = 1500;
      modules = ['discovery', 'flow', 'endpoint', 'case-management', 'gateway', 'fim'];
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.license.licenseKey = `${keyPrefix}-2026-${randomSuffix}-9912-SEC`;
    this.license.tier = tier;
    this.license.tierDisplayName = tierName;
    this.license.maxNodes = maxNodes || defNodes;
    this.license.maxEps = defEps;
    this.license.entitledModules = modules;
    this.license.addons = {
      aiInferenceCore: tier === 'Enterprise' || tier === 'Ultimate',
      purdueOtdpi: tier === 'Enterprise' || tier === 'Ultimate',
      soarPlaybooksPro: tier === 'Enterprise' || tier === 'Ultimate',
      haClustering: tier === 'Enterprise' || tier === 'Ultimate',
      vansCompliance: tier !== 'Community',
      microsegmentation: tier === 'Ultimate'
    };
    this.license.digitalSignature = signLicenseData(this.license);
    this.recalculateStatus();
    this.saveConfig();

    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPGRADE',
      operator,
      details: `手動升級方案規格為 ${tierName}，節點上限提高至 ${this.license.maxNodes}。`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `方案規格升級完成：已套用 ${tierName}`,
      license: this.getLicense()
    };
  }

  public syncNodeUsage(currentCount: number): void {
    this.license.currentNodes = currentCount;
    this.license.lastSyncAt = new Date().toISOString();

    // Recalculate breakdown dynamically
    const masters = 1;
    const workers = Math.max(2, Math.min(8, Math.round(currentCount * 0.08)));
    const flowSensors = Math.max(3, Math.min(25, Math.round(currentCount * 0.15)));
    const otProbes = Math.max(2, Math.min(65, Math.round(currentCount * 0.12)));
    const endpoints = Math.max(0, currentCount - (masters + workers + flowSensors + otProbes));

    this.license.nodeBreakdown = {
      masterNodes: { active: masters, max: 2, description: '主控中樞 HA 集群節點' },
      workerNodes: { active: workers, max: 8, description: '日誌解析與關聯運算 Worker' },
      flowSensors: { active: flowSensors, max: 25, description: '全流量深包檢測 (DPI) 探針' },
      endpointAgents: { active: endpoints, max: Math.round(this.license.maxNodes * 0.8), description: 'EDR/FIM 主機微代理' },
      otProbes: { active: otProbes, max: 65, description: '工控 Purdue 隔離邊界安全探針' }
    };

    this.recalculateStatus();
    this.saveConfig();

    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'QUOTA_SYNC',
      operator: 'Sync Agent',
      details: `與叢集底層同步節點數量：目前活躍 ${currentCount} / 配額上限 ${this.license.maxNodes}`,
      status: 'SUCCESS'
    });
  }

  public getAuditLogs(): LicenseAuditEntry[] {
    return [...this.auditLogs];
  }

  public resetToDefault(): LicenseRecord {
    this.license = this.getDefaultLicense();
    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'INITIALIZE',
      operator: 'Admin',
      details: '重置授權為初始企業旗艦版出廠設定',
      status: 'SUCCESS'
    });
    this.saveConfig();
    return this.getLicense();
  }
}

export const globalLicenseEngine = new LicenseEngine();

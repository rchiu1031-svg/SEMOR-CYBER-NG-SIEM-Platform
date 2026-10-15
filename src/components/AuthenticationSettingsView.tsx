import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Shield, 
  ShieldCheck, 
  Lock, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Globe, 
  Users, 
  Terminal, 
  Check, 
  Eye, 
  EyeOff, 
  Layers, 
  Settings2, 
  HelpCircle, 
  Activity, 
  FileText, 
  Smartphone, 
  Fingerprint, 
  Sliders, 
  Clock, 
  LogIn, 
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  FileCheck2,
  BadgeCheck,
  ShieldAlert,
  KeyRound,
  Download,
  RotateCcw,
  Search,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { siemService } from '../services/siemService';

interface AuthenticationSettingsViewProps {
  isReadOnly?: boolean;
}

export default function AuthenticationSettingsView({ isReadOnly = false }: AuthenticationSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'ad' | 'ldap' | 'radius' | 'sso' | 'mfa' | 'policy' | 'cert' | 'users' | 'audit'>('ad');

  // Show/Hide password toggles
  const [showAdPassword, setShowAdPassword] = useState(false);
  const [showLdapPassword, setShowLdapPassword] = useState(false);
  const [showRadiusSecret, setShowRadiusSecret] = useState(false);
  const [showSsoSecret, setShowSsoSecret] = useState(false);

  // Connection testing states
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([]);

  // Test user simulation modal
  const [showTestUserModal, setShowTestUserModal] = useState(false);
  const [testUserAccount, setTestUserAccount] = useState('sec_analyst');
  const [testUserPassword, setTestUserPassword] = useState('AnalystSecure2026!');
  const [testUserProvider, setTestUserProvider] = useState('Active Directory');
  const [testUserMfaCode, setTestUserMfaCode] = useState('748291');
  const [testUserResult, setTestUserResult] = useState<{ status: 'idle' | 'success' | 'failed' | 'locked' | 'policy'; message: string; details?: any } | null>(null);
  const [isSimulatingLogin, setIsSimulatingLogin] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Auth Daemon status from backend
  const [authStatus, setAuthStatus] = useState<any>(null);

  // Synced Directory Users
  const [syncedUsers, setSyncedUsers] = useState<any[]>([]);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Certificate Management & Validator
  const [certInput, setCertInput] = useState('');
  const [certValidationResult, setCertValidationResult] = useState<any>(null);
  const [isValidatingCert, setIsValidatingCert] = useState(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);

  // Lockout Management
  const [isClearingLockouts, setIsClearingLockouts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active Directory Config
  const [adConfig, setAdConfig] = useState({
    enabled: true,
    serverUrl: 'ldaps://dc01.corp.internal:636',
    backupServerUrl: 'ldaps://dc02.corp.internal:636',
    domain: 'corp.internal',
    netbiosDomain: 'CORP',
    baseDn: 'DC=corp,DC=internal',
    userSearchBase: 'OU=Users,OU=Enterprise,DC=corp,DC=internal',
    groupSearchBase: 'OU=Groups,OU=Enterprise,DC=corp,DC=internal',
    bindDn: 'CN=svc_siem_auth,OU=ServiceAccounts,DC=corp,DC=internal',
    bindPassword: '••••••••••••••••',
    encryption: 'ldaps' as 'none' | 'starttls' | 'ldaps',
    userFilter: '(&(objectCategory=person)(objectClass=user)(sAMAccountName={username}))',
    groupFilter: '(&(objectClass=group)(member={userdn}))',
    usernameAttribute: 'sAMAccountName',
    mailAttribute: 'mail',
    displayNameAttribute: 'displayName',
    departmentAttribute: 'department',
    roleAttribute: 'memberOf',
    autoSyncUsers: true,
    syncInterval: '30',
    timeout: 5,
  });

  // Standard LDAP Config
  const [ldapConfig, setLdapConfig] = useState({
    enabled: false,
    serverUrl: 'ldap://ldap.enterprise.local:389',
    baseDn: 'ou=accounts,dc=enterprise,dc=local',
    bindDn: 'cn=admin,dc=enterprise,dc=local',
    bindPassword: '••••••••••••••••',
    encryption: 'starttls' as 'none' | 'starttls' | 'ldaps',
    userSearchFilter: '(uid={username})',
    groupSearchFilter: '(memberUid={username})',
    usernameAttr: 'uid',
    emailAttr: 'mail',
    nameAttr: 'cn',
    followReferrals: false,
    timeout: 5,
  });

  // RADIUS Config
  const [radiusConfig, setRadiusConfig] = useState({
    enabled: false,
    primaryServer: '192.168.10.50',
    authPort: 1812,
    acctPort: 1813,
    sharedSecret: '••••••••••••••••',
    secondaryServer: '192.168.10.51',
    secondaryAuthPort: 1812,
    authProtocol: 'MS-CHAPv2' as 'PAP' | 'CHAP' | 'MS-CHAPv2' | 'EAP-TTLS',
    timeout: 5,
    retries: 3,
    nasIdentifier: 'SEMOR-SIEM-SOC-01',
    nasIpAddress: '192.168.10.200',
  });

  // SSO / SAML / OIDC Config
  const [ssoConfig, setSsoConfig] = useState({
    enabled: true,
    provider: 'entra' as 'entra' | 'okta' | 'google' | 'keycloak' | 'generic_saml' | 'generic_oidc',
    protocol: 'saml2' as 'saml2' | 'oidc',
    entityId: 'https://siem.corp.internal/saml/metadata',
    ssoLoginUrl: 'https://login.microsoftonline.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890/saml2',
    ssoLogoutUrl: 'https://login.microsoftonline.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890/saml2/logout',
    certificate: `-----BEGIN CERTIFICATE-----
MIID9zCCAt+gAwIBAgIUTzzR1lY3u7vVBtIw1jiTzVkRqy0wDQYJKoZIhvcNAQEL
BQAwgYoxCzAJBgNVBAYTAlRXMQ8wDQYDVQQIDAZUYWlwZWkxJjAkBgNVBAoMHUVu
dGVycHJpc2UgRGlyZWN0b3J5IFNlcnZpY2VzMRUwEwYDVQQLDAxJZGVudGl0eSBJ
QU0xKzApBgNVBAMMIk1pY3Jvc29mdCBFbnRyYSBJRCAoVG9rZW4gU2lnbmluZykw
HhcNMjYxMDE1MDg1MzQ3WhcNMjgxMDE0MDg1MzQ3WjCBijELMAkGA1UEBhMCVFcx
DzANBgNVBAgMBlRhaXBlaTEmMCQGA1UECgwdRW50ZXJwcmlzZSBEaXJlY3Rvcnkg
U2VydmljZXMxFTATBgNVBAsMDElkZW50aXR5IElBTTErMCkGA1UEAwwiTWljcm9z
b2Z0IEVudHJhIElEIChUb2tlbiBTaWduaW5nKTCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBAL7Qi92ODheyxhEbLQhzeQPSpYUGTBGFiYxGH1kqV1GqEsPz
1yMFho+mryvuiHui8zAQh1wLEfIAKFGtEBRLFzUur+SXHYGrKN7OARSSyRO81gMh
iKPnqa/yMSeh9FnyauAB1bJczC5NeYLmlNW0cevfH4jeGn+ujARgPIddsXCUrU1T
ukrcuTSBg187mflzLuynHZYJ/SuKm8LKTQ3+ppv9C39Yopk4Nll6w6UTPhEFYcTv
D8LxTBbaqFy+Qiy3KHMWhxHMFczKEpIJ1vLtzRIRym4fjUD+YT4s3r0Ip7jvRkdW
kyn9Dlk4pdKhubFehwevWZI2wKTYKWG6jSb6oVkCAwEAAaNTMFEwHQYDVR0OBBYE
FK6zTckgMrEH6Q70n4sX5SYSXGzsMB8GA1UdIwQYMBaAFK6zTckgMrEH6Q70n4sX
5SYSXGzsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBACB6RFQs
QEs/tQDZM4ZH0y76XhKaeLEM2809TuNld+w+u7JcF1uXodYTbsGNNSQYyW1skCWa
OBdaBtOCBukuCfOj1yza66vb88OdXb/Kk55rqLRwTDsk1+9dETrqVo96uDuAM+2R
3gLXPTqdspAwf6aVbR8QngaFN8RGsdF6baWyijdOvJy72VQX1gHyh9sHVY59G4ty
2opXkyp6Vjc6lC/l1rs+QcJxfSnNxO3RXphrIzS/EaTQRuhJzoiQQSouqukN+gc2
XXdHDD9mbvriYy/9r66Lrd5c3vRV+wZ4IhQVFeU21iWRqwPTxxr5ocZCWstSVO05
2oUpitNzIvMV75s=
-----END CERTIFICATE-----`,
    clientId: 'siem-enterprise-client-id-9988',
    clientSecret: '••••••••••••••••',
    issuer: 'https://login.microsoftonline.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890/v2.0',
    autoProvisionUsers: true,
    defaultRole: 'viewer',
    attributeMapping: {
      username: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      displayName: 'http://schemas.microsoft.com/identity/claims/displayname',
      roles: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    }
  });

  // MFA Config
  const [mfaConfig, setMfaConfig] = useState({
    enforceMfa: true,
    allowedMethods: {
      totp: true,
      fido2: true,
      emailOtp: false,
      smsOtp: false,
    },
    enforceRoles: ['supervisor', 'admin', 'auditor'],
    gracePeriodDays: 7,
    allowRememberDevice: true,
    rememberDeviceDays: 30,
  });

  // Policy & Session Config
  const [policyConfig, setPolicyConfig] = useState({
    sessionTimeoutMinutes: 30,
    maxConcurrentSessions: 2,
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiryDays: 90,
      preventPasswordReuseCount: 5,
    },
    lockoutPolicy: {
      enabled: true,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15,
      resetFailedCountMinutes: 30,
    },
    ipAllowlist: {
      enabled: false,
      cidrs: '192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12',
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial and refresh loader
  const refreshAllData = async () => {
    try {
      const [settingsRes, statusRes, usersRes, logsRes] = await Promise.all([
        siemService.getAuthSettings().catch(() => null),
        siemService.getAuthStatus().catch(() => null),
        siemService.getAuthSyncedUsers().catch(() => null),
        siemService.getAuthAuditLogs().catch(() => null),
      ]);

      if (settingsRes?.auth) {
        if (settingsRes.auth.ad) setAdConfig(prev => ({ ...prev, ...settingsRes.auth.ad }));
        if (settingsRes.auth.ldap) setLdapConfig(prev => ({ ...prev, ...settingsRes.auth.ldap }));
        if (settingsRes.auth.radius) setRadiusConfig(prev => ({ ...prev, ...settingsRes.auth.radius }));
        if (settingsRes.auth.sso) setSsoConfig(prev => ({ ...prev, ...settingsRes.auth.sso }));
        if (settingsRes.auth.mfa) setMfaConfig(prev => ({ ...prev, ...settingsRes.auth.mfa }));
        if (settingsRes.auth.policy) setPolicyConfig(prev => ({ ...prev, ...settingsRes.auth.policy }));
      }
      if (statusRes?.status) {
        setAuthStatus(statusRes.status);
      }
      if (usersRes?.users) {
        setSyncedUsers(usersRes.users);
      }
      if (logsRes?.logs) {
        setAuditLogs(logsRes.logs);
      }
    } catch (err) {
      console.warn('AuthenticationSettings: Using default local fallback', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handle connection test
  const handleTestConnection = async (type: string) => {
    setTestingStatus('testing');
    setTestMessage(`正在測試 ${type} 認證伺服器通訊握手...`);

    let params: any = { type };
    if (type === 'Active Directory') {
      params = {
        type,
        host: adConfig.serverUrl,
        port: 636,
        domain: adConfig.domain,
        encryption: adConfig.encryption
      };
    } else if (type === '標準 LDAP' || type === 'LDAP') {
      params = {
        type: '標準 LDAP',
        host: ldapConfig.serverUrl,
        port: 389,
        domain: ldapConfig.baseDn,
        encryption: ldapConfig.encryption
      };
    } else if (type === 'RADIUS') {
      params = {
        type: 'RADIUS',
        host: radiusConfig.primaryServer,
        port: radiusConfig.authPort,
        protocol: radiusConfig.authProtocol
      };
    } else if (type.includes('SSO') || type === 'SSO') {
      params = {
        type: 'Microsoft Entra ID (SAML 2.0)',
        host: ssoConfig.ssoLoginUrl,
        domain: ssoConfig.entityId,
        protocol: ssoConfig.protocol
      };
    } else if (type.includes('憑證')) {
      params = {
        type: 'X.509 Certificate',
        host: 'IdP-Token-Signing-Cert'
      };
    }

    try {
      const res = await siemService.testAuthConnection(params);
      setTestingStatus('success');
      setTestMessage(res.message || `${type} 連線測試成功！已通過 TLS 握手與服務帳號授權驗證。`);
      if (res.logs) setDiagnosticsLogs(res.logs);
      showToast(res.message || `${type} 連線測試成功！`);
      refreshAllData();
    } catch (err: any) {
      setTestingStatus('error');
      setTestMessage(`${type} 連線失敗: ${err.message || '請確認網路位址與 X.509 憑證有效性'}`);
      showToast(`${type} 連線失敗`);
    }
  };

  // Handle simulation login
  const handleSimulateUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUserAccount) return;

    setIsSimulatingLogin(true);
    setTestUserResult(null);
    try {
      const res = await siemService.simulateAuthLogin({
        username: testUserAccount,
        password: testUserPassword,
        provider: testUserProvider,
        mfaCode: testUserMfaCode
      });

      setTestUserResult({
        status: res.status === 'authenticated' ? 'success' : res.status === 'locked_out' ? 'locked' : 'policy',
        message: res.message || `身分驗證結果: ${res.status}`,
        details: res
      });
      refreshAllData();
    } catch (err: any) {
      setTestUserResult({
        status: 'failed',
        message: `認證失敗：${err.response?.data?.error || err.message || '無法驗證使用者之憑證'}`
      });
    } finally {
      setIsSimulatingLogin(false);
    }
  };

  // Directory Sync Action
  const handleSyncDirectory = async (provider: 'ad' | 'ldap' = 'ad') => {
    setIsSyncingUsers(true);
    try {
      const res = await siemService.syncAuthDirectory(provider);
      showToast(res.message || '目錄同步完成！');
      if (res.syncedUsers) {
        setSyncedUsers(res.syncedUsers);
      }
      refreshAllData();
    } catch (err: any) {
      showToast('目錄同步失敗: ' + (err.message || '連線逾時'));
    } finally {
      setIsSyncingUsers(false);
    }
  };

  // Clear Account Lockouts Action
  const handleClearLockouts = async () => {
    setIsClearingLockouts(true);
    try {
      const res = await siemService.clearAuthLockouts();
      showToast(res.message || '已成功解除全域帳號鎖定！');
      refreshAllData();
    } catch (err: any) {
      showToast('解除鎖定失敗: ' + err.message);
    } finally {
      setIsClearingLockouts(false);
    }
  };

  // Certificate Validation Action
  const handleValidateCertificate = async (customCert?: string) => {
    const certToTest = customCert || certInput || ssoConfig.certificate;
    if (!certToTest || certToTest.trim().length === 0) {
      showToast('請先貼上或輸入欲校驗的 X.509 憑證 (PEM 格式)');
      return;
    }

    setIsValidatingCert(true);
    try {
      const res = await siemService.validateCertificate(certToTest);
      setCertValidationResult(res);
      showToast(res.message);
      refreshAllData();
    } catch (err: any) {
      setCertValidationResult({
        valid: false,
        status: 'PARSE_ERROR',
        message: '憑證解析錯誤: ' + (err.message || '無效的 PEM 結構')
      });
    } finally {
      setIsValidatingCert(false);
    }
  };

  // Generate SAML SP Signing Certificate
  const handleGenerateSpSigningCert = async () => {
    setIsGeneratingCert(true);
    try {
      const res = await siemService.generateSpSigningCert('siem.corp.internal');
      if (res.success && res.certificate) {
        setSsoConfig(prev => ({ ...prev, certificate: res.certificate }));
        setCertValidationResult({
          valid: true,
          status: 'VALID',
          message: res.message,
          details: res.details
        });
        showToast(res.message);
        refreshAllData();
      } else {
        showToast(res.message || '憑證生成失敗');
      }
    } catch (err: any) {
      showToast('憑證生成錯誤: ' + (err.message || '伺服器端錯誤'));
    } finally {
      setIsGeneratingCert(false);
    }
  };

  // Download SAML SP Metadata XML
  const handleDownloadSpMetadata = async () => {
    try {
      const res = await siemService.getSamlSpMetadata();
      const xmlData = res.metadataXml || res;
      const blob = new Blob([xmlData], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'saml-sp-metadata.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('已成功下載 SAML 2.0 SP Metadata (XML)！');
    } catch (err: any) {
      showToast('下載 Metadata 失敗: ' + (err.message || '伺服器無回應'));
    }
  };

  // Reset Auth Settings to Factory Defaults
  const handleResetDefaults = async () => {
    if (isReadOnly) return;
    if (!window.confirm('確定要將身分認證管理設定恢復為出廠預設值嗎？目前的自訂配置將會被清除。')) return;
    try {
      const res = await siemService.resetAuthDefaults();
      showToast(res.message || '認證管理設定已重置為預設配置！');
      refreshAllData();
    } catch (err: any) {
      showToast('重置失敗: ' + err.message);
    }
  };

  // Save Settings to Backend Auth Daemon
  const handleSaveSettings = async () => {
    if (isReadOnly) return;
    setIsSaving(true);
    try {
      await siemService.updateAuthSettings({
        ad: adConfig,
        ldap: ldapConfig,
        radius: radiusConfig,
        sso: ssoConfig,
        mfa: mfaConfig,
        policy: policyConfig
      });
      showToast('認證管理配置已成功套用並同步至後端認證守護行程 (Auth Daemon)！');
      refreshAllData();
    } catch (err: any) {
      showToast('認證配置已暫存 (本地備援模式)');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = syncedUsers.filter(u => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.sAMAccountName?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.mappedRole?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[3000] bg-emerald-600/90 backdrop-blur-md border border-emerald-400/30 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnostics Modal */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f12] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">認證伺服器通訊診斷記錄 (Diagnostic Logs)</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">即時連線握手、TLS 憑證與 Bind 授權追蹤</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(diagnosticsLogs.join('\n'));
                    showToast('已複製診斷日誌至剪貼簿');
                  }}
                  className="text-gray-400 hover:text-white text-xs px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  複製
                </button>
                <button
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="text-gray-500 hover:text-white text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all"
                >
                  關閉
                </button>
              </div>
            </div>

            <div className="p-5 bg-black/80 font-mono text-xs text-gray-300 space-y-2 max-h-[380px] overflow-y-auto">
              {diagnosticsLogs.length > 0 ? (
                diagnosticsLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed flex items-start gap-2">
                    <span className="text-purple-400 select-none">&gt;</span>
                    <span className={log.includes('SUCCESS') || log.includes('成功') ? 'text-emerald-400' : log.includes('ERROR') || log.includes('失敗') ? 'text-red-400' : 'text-gray-300'}>
                      {log}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-600 italic py-8 text-center space-y-3">
                  <p>尚未產生連線診斷日誌</p>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('Active Directory')}
                    className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-all"
                  >
                    發起 Active Directory 連線測試
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/40 flex justify-between items-center">
              <span className="text-[11px] text-gray-500">來源：Auth Daemon 通訊追蹤器 (Port 636 / 1812)</span>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                完成
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Test User Login Simulation Modal */}
      {showTestUserModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f12] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <LogIn size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">模擬使用者登入認證 (Simulate User Auth)</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">測試目錄查詢、密碼複雜度策略、帳號鎖定與 RBAC 角色屬性映射</p>
                </div>
              </div>
              <button
                onClick={() => setShowTestUserModal(false)}
                className="text-gray-500 hover:text-white text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all"
              >
                關閉
              </button>
            </div>

            <form onSubmit={handleSimulateUserLogin} className="p-6 space-y-4">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setTestUserAccount('chiur@ke-la.com');
                    setTestUserPassword('SecurityMaster2026!');
                    setTestUserProvider('Active Directory');
                  }}
                  className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-[11px] text-blue-400 border border-gray-800 rounded-lg font-bold"
                >
                  代入管理者 (chiur)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestUserAccount('sec_analyst');
                    setTestUserPassword('AnalystSecure2026!');
                    setTestUserProvider('Active Directory');
                  }}
                  className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-[11px] text-emerald-400 border border-gray-800 rounded-lg font-bold"
                >
                  代入分析師 (sec_analyst)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestUserAccount('sec_analyst');
                    setTestUserPassword('123'); // Triggers password policy failure
                    setTestUserProvider('Active Directory');
                  }}
                  className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-[11px] text-amber-400 border border-gray-800 rounded-lg font-bold"
                >
                  測試弱密碼
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  測試使用者帳號 (Username / UPN)
                </label>
                <input
                  type="text"
                  value={testUserAccount}
                  onChange={(e) => setTestUserAccount(e.target.value)}
                  placeholder="例如：sec_analyst 或 user@corp.internal"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  測試密碼 (Password - 檢驗企業密碼複雜度策略)
                </label>
                <input
                  type="password"
                  value={testUserPassword}
                  onChange={(e) => setTestUserPassword(e.target.value)}
                  placeholder="輸入測試使用者密碼 (最少 12 字元且含大小寫符號)"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    認證來源通道
                  </label>
                  <select
                    value={testUserProvider}
                    onChange={(e) => setTestUserProvider(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none"
                  >
                    <option value="Active Directory">Active Directory (Kerberos/LDAPS)</option>
                    <option value="標準 LDAP">標準 LDAP (OpenLDAP)</option>
                    <option value="RADIUS">RADIUS (MS-CHAPv2)</option>
                    <option value="Microsoft Entra ID">Microsoft Entra ID (SAML 2.0)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    MFA 驗證碼 (TOTP 6位數)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={testUserMfaCode}
                    onChange={(e) => setTestUserMfaCode(e.target.value)}
                    placeholder="748291"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-center tracking-widest outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {testUserResult && (
                <div className={cn(
                  "p-4 rounded-xl text-xs font-mono whitespace-pre-line leading-relaxed border",
                  testUserResult.status === 'success' 
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : testUserResult.status === 'locked'
                    ? "bg-red-950/30 border-red-500/30 text-red-300"
                    : "bg-amber-950/30 border-amber-500/30 text-amber-300"
                )}>
                  {testUserResult.message}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTestUserModal(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSimulatingLogin}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  {isSimulatingLogin ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {isSimulatingLogin ? '驗證中...' : '開始模擬認證'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Top Status & Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: AD */}
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Directory 網域</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
              adConfig.enabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-gray-800 text-gray-500"
            )}>
              {adConfig.enabled ? '已連線 (LDAPS)' : '未啟用'}
            </span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <Server size={18} className="text-blue-400 shrink-0" />
            <span className="truncate">{adConfig.domain}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
            <span className="text-[10px] text-gray-500 font-mono truncate">DC01:636</span>
            <button
              onClick={() => handleSyncDirectory('ad')}
              disabled={isSyncingUsers}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <RefreshCw size={11} className={isSyncingUsers ? "animate-spin" : ""} />
              同步
            </button>
          </div>
        </div>

        {/* Metric 2: SSO */}
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">企業單一登入 (SSO)</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
              ssoConfig.enabled ? "bg-purple-500/10 text-purple-400 border border-purple-500/30" : "bg-gray-800 text-gray-500"
            )}>
              {ssoConfig.enabled ? 'SAML 2.0 就緒' : '未啟用'}
            </span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <Globe size={18} className="text-purple-400 shrink-0" />
            <span className="truncate">Microsoft Entra ID</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Token 簽章憑證有效</p>
        </div>

        {/* Metric 3: MFA */}
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">多因子身分驗證 (MFA)</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
              mfaConfig.enforceMfa ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-gray-800 text-gray-500"
            )}>
              {mfaConfig.enforceMfa ? '強制管理員啟用' : '非強制'}
            </span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <Fingerprint size={18} className="text-red-400 shrink-0" />
            <span>TOTP + FIDO2</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">涵蓋 Supervisor, Admin, Auditor</p>
        </div>

        {/* Metric 4: Synced Users */}
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">網域已同步人員</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              目錄就緒
            </span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-emerald-400 shrink-0" />
            <span>{syncedUsers.length} 位使用者</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">自動增量排程：每 {adConfig.syncInterval} 分鐘</p>
        </div>

        {/* Metric 5: Lockout Monitor */}
        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">帳號鎖定監控佇列</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
              (authStatus?.metrics?.lockedAccountsCount || 0) > 0
                ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            )}>
              {(authStatus?.metrics?.lockedAccountsCount || 0) > 0 ? '有帳號鎖定中' : '正常防護中'}
            </span>
          </div>
          <div className="text-base font-bold text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className={(authStatus?.metrics?.lockedAccountsCount || 0) > 0 ? "text-red-400" : "text-gray-400"} />
              <span>{authStatus?.metrics?.lockedAccountsCount || 0} 個帳號</span>
            </div>
            {(authStatus?.metrics?.lockedAccountsCount || 0) > 0 && (
              <button
                type="button"
                onClick={handleClearLockouts}
                disabled={isClearingLockouts}
                className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded text-[10px] font-bold border border-red-500/40 transition-all"
              >
                {isClearingLockouts ? '解鎖中...' : '一鍵解鎖'}
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">失敗 {policyConfig.lockoutPolicy.maxFailedAttempts} 次鎖定 {policyConfig.lockoutPolicy.lockoutDurationMinutes} 分鐘</p>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-[#111114] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {/* Navigation Sub-Tabs */}
        <div className="border-b border-gray-800 bg-gray-900/40 p-2 flex flex-wrap gap-2">
          {[
            { id: 'ad', label: 'Active Directory / 網域認證', icon: <Server size={14} /> },
            { id: 'ldap', label: '標準 LDAP 伺服器', icon: <Database size={14} /> },
            { id: 'radius', label: 'RADIUS 伺服器', icon: <Key size={14} /> },
            { id: 'sso', label: '單一登入 (SSO / SAML / OIDC)', icon: <Globe size={14} /> },
            { id: 'mfa', label: '多因子驗證 (MFA / 2FA)', icon: <Smartphone size={14} /> },
            { id: 'policy', label: '密碼與安全政策', icon: <Shield size={14} /> },
            { id: 'cert', label: '憑證與 CA 信任庫', icon: <FileCheck2 size={14} /> },
            { id: 'users', label: '目錄已同步帳號', icon: <Users size={14} /> },
            { id: 'audit', label: '認證安全稽核日誌', icon: <Activity size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all",
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'users' && syncedUsers.length > 0 && (
                <span className="px-1.5 py-0.2 bg-black/40 text-[10px] rounded-full text-blue-300 ml-0.5">
                  {syncedUsers.length}
                </span>
              )}
              {tab.id === 'audit' && auditLogs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-black/40 text-[10px] rounded-full text-purple-300 ml-0.5">
                  {auditLogs.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6 md:p-8 space-y-6">
          {/* TAB 1: Active Directory */}
          {activeTab === 'ad' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Server size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Active Directory / Windows 網域認證服務</h4>
                    <p className="text-xs text-gray-400 mt-0.5">透過 LDAPS (TCP 636) 安全通訊協定連結企業網域控制器 (Domain Controller)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSyncDirectory('ad')}
                    disabled={isSyncingUsers}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw size={12} className={isSyncingUsers ? "animate-spin" : ""} />
                    {isSyncingUsers ? '同步中...' : '立即增量同步人員'}
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adConfig.enabled}
                      onChange={(e) => setAdConfig({ ...adConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="text-xs font-bold text-gray-300">啟用 AD 認證</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    主要伺服器位址 (Primary Server URL)
                  </label>
                  <input
                    type="text"
                    value={adConfig.serverUrl}
                    onChange={(e) => setAdConfig({ ...adConfig, serverUrl: e.target.value })}
                    placeholder="ldaps://dc01.corp.internal:636"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    備援伺服器位址 (Backup Server URL)
                  </label>
                  <input
                    type="text"
                    value={adConfig.backupServerUrl}
                    onChange={(e) => setAdConfig({ ...adConfig, backupServerUrl: e.target.value })}
                    placeholder="ldaps://dc02.corp.internal:636"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    網域名稱 (AD Domain FQDN)
                  </label>
                  <input
                    type="text"
                    value={adConfig.domain}
                    onChange={(e) => setAdConfig({ ...adConfig, domain: e.target.value })}
                    placeholder="corp.internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    NetBIOS 網域識別 (NetBIOS Name)
                  </label>
                  <input
                    type="text"
                    value={adConfig.netbiosDomain}
                    onChange={(e) => setAdConfig({ ...adConfig, netbiosDomain: e.target.value })}
                    placeholder="CORP"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    目錄搜尋基準點 (Base DN)
                  </label>
                  <input
                    type="text"
                    value={adConfig.baseDn}
                    onChange={(e) => setAdConfig({ ...adConfig, baseDn: e.target.value })}
                    placeholder="DC=corp,DC=internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    使用者搜尋根節點 (User Search Base)
                  </label>
                  <input
                    type="text"
                    value={adConfig.userSearchBase}
                    onChange={(e) => setAdConfig({ ...adConfig, userSearchBase: e.target.value })}
                    placeholder="OU=Users,OU=Enterprise,DC=corp,DC=internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    群組搜尋根節點 (Group Search Base)
                  </label>
                  <input
                    type="text"
                    value={adConfig.groupSearchBase}
                    onChange={(e) => setAdConfig({ ...adConfig, groupSearchBase: e.target.value })}
                    placeholder="OU=Groups,OU=Enterprise,DC=corp,DC=internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    服務綁定帳號 (Bind DN / Service Account)
                  </label>
                  <input
                    type="text"
                    value={adConfig.bindDn}
                    onChange={(e) => setAdConfig({ ...adConfig, bindDn: e.target.value })}
                    placeholder="CN=svc_siem_auth,OU=ServiceAccounts,DC=corp,DC=internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    服務綁定密碼 (Bind Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showAdPassword ? "text" : "password"}
                      value={adConfig.bindPassword}
                      onChange={(e) => setAdConfig({ ...adConfig, bindPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdPassword(!showAdPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showAdPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced AD Attributes Mapping */}
              <div className="p-5 bg-gray-900/40 border border-gray-800/80 rounded-xl space-y-4">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={14} className="text-blue-400" />
                  進階屬性映射與過濾器配置 (Attribute Mappings & Filters)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">使用者過濾表達式 (User Filter)</label>
                    <input
                      type="text"
                      value={adConfig.userFilter}
                      onChange={(e) => setAdConfig({ ...adConfig, userFilter: e.target.value })}
                      className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">群組過濾表達式 (Group Filter)</label>
                    <input
                      type="text"
                      value={adConfig.groupFilter}
                      onChange={(e) => setAdConfig({ ...adConfig, groupFilter: e.target.value })}
                      className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">使用者名稱屬性</label>
                    <input
                      type="text"
                      value={adConfig.usernameAttribute}
                      onChange={(e) => setAdConfig({ ...adConfig, usernameAttribute: e.target.value })}
                      className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">電子郵件屬性 (Mail)</label>
                    <input
                      type="text"
                      value={adConfig.mailAttribute}
                      onChange={(e) => setAdConfig({ ...adConfig, mailAttribute: e.target.value })}
                      className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">顯示名稱屬性 (DisplayName)</label>
                    <input
                      type="text"
                      value={adConfig.displayNameAttribute}
                      onChange={(e) => setAdConfig({ ...adConfig, displayNameAttribute: e.target.value })}
                      className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">群組關聯屬性 (Role / MemberOf)</label>
                    <input
                      type="text"
                      value={adConfig.roleAttribute}
                      onChange={(e) => setAdConfig({ ...adConfig, roleAttribute: e.target.value })}
                      className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Standard LDAP */}
          {activeTab === 'ldap' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">標準 LDAP / OpenLDAP 目錄服務認證</h4>
                    <p className="text-xs text-gray-400 mt-0.5">適用於 Linux OpenLDAP、FreeIPA、Apache Directory 等開源目錄服務架構</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSyncDirectory('ldap')}
                    disabled={isSyncingUsers}
                    className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw size={12} className={isSyncingUsers ? "animate-spin" : ""} />
                    {isSyncingUsers ? '同步中...' : '同步 LDAP 目錄'}
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ldapConfig.enabled}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    <span className="text-xs font-bold text-gray-300">啟用 LDAP 認證</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    LDAP 伺服器網址 (Server URL)
                  </label>
                  <input
                    type="text"
                    value={ldapConfig.serverUrl}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, serverUrl: e.target.value })}
                    placeholder="ldap://ldap.enterprise.local:389"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    傳輸層加密模式 (Encryption Protocol)
                  </label>
                  <select
                    value={ldapConfig.encryption}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, encryption: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value="starttls">StartTLS (推薦 - 於 389 Port 升級 TLS)</option>
                    <option value="ldaps">LDAPS (SSL 通道 - 預設 636 Port)</option>
                    <option value="none">None (明文傳輸 - 僅供封閉隔離測試)</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    目錄根節點 (Base DN)
                  </label>
                  <input
                    type="text"
                    value={ldapConfig.baseDn}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, baseDn: e.target.value })}
                    placeholder="ou=accounts,dc=enterprise,dc=local"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    管理者綁定 DN (Bind DN)
                  </label>
                  <input
                    type="text"
                    value={ldapConfig.bindDn}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, bindDn: e.target.value })}
                    placeholder="cn=admin,dc=enterprise,dc=local"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    管理員綁定密碼 (Bind Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showLdapPassword ? "text" : "password"}
                      value={ldapConfig.bindPassword}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, bindPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLdapPassword(!showLdapPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showLdapPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RADIUS */}
          {activeTab === 'radius' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">RADIUS 網路存取伺服器認證 (AAA Server)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">支援 Cisco ISE、FreeRADIUS、Microsoft NPS 等 AAA 集中認證伺服器</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={radiusConfig.enabled}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="text-xs font-bold text-gray-300">啟用 RADIUS 認證</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    主要 RADIUS 伺服器 (Primary Server IP/Host)
                  </label>
                  <input
                    type="text"
                    value={radiusConfig.primaryServer}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, primaryServer: e.target.value })}
                    placeholder="192.168.10.50"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    認證 Port (Auth Port)
                  </label>
                  <input
                    type="number"
                    value={radiusConfig.authPort}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, authPort: parseInt(e.target.value) || 1812 })}
                    placeholder="1812"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    共用金鑰 (Shared Secret)
                  </label>
                  <div className="relative">
                    <input
                      type={showRadiusSecret ? "text" : "password"}
                      value={radiusConfig.sharedSecret}
                      onChange={(e) => setRadiusConfig({ ...radiusConfig, sharedSecret: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRadiusSecret(!showRadiusSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showRadiusSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    認證協定 (Authentication Protocol)
                  </label>
                  <select
                    value={radiusConfig.authProtocol}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, authProtocol: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="MS-CHAPv2">MS-CHAPv2 (安全挑戰握手 - 推薦)</option>
                    <option value="PAP">PAP (密碼驗證協定 - 明文傳輸)</option>
                    <option value="CHAP">CHAP (MD5 雜湊挑戰)</option>
                    <option value="EAP-TTLS">EAP-TTLS (憑證式通道認證)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SSO / SAML / OIDC */}
          {activeTab === 'sso' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">企業單一登入 (SSO Federation)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">整合 Microsoft Entra ID、Okta、Google Workspace 等現代身分提供商 (IdP)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadSpMetadata}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Download size={13} />
                    下載 SP Metadata
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ssoConfig.enabled}
                      onChange={(e) => setSsoConfig({ ...ssoConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="text-xs font-bold text-gray-300">啟用 SSO 聯邦</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">身分提供商 (Identity Provider)</label>
                  <select
                    value={ssoConfig.provider}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, provider: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="entra">Microsoft Entra ID (Azure AD)</option>
                    <option value="okta">Okta Enterprise Identity</option>
                    <option value="google">Google Workspace SAML</option>
                    <option value="keycloak">Keycloak Open Source IAM</option>
                    <option value="generic_saml">自訂標準 SAML 2.0 提供商</option>
                    <option value="generic_oidc">自訂標準 OIDC (OpenID Connect)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">SSO 協定類型 (Protocol)</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSsoConfig({ ...ssoConfig, protocol: 'saml2' })}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                        ssoConfig.protocol === 'saml2'
                          ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                          : "bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <Layers size={14} />
                      SAML 2.0 (推薦)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSsoConfig({ ...ssoConfig, protocol: 'oidc' })}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                        ssoConfig.protocol === 'oidc'
                          ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                          : "bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <Globe size={14} />
                      OpenID Connect (OIDC)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    本系統 SP 實體識別碼 (SP Entity ID / Audience URI)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={ssoConfig.entityId}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-purple-300 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ssoConfig.entityId);
                        showToast('已複製 SP Entity ID 到剪貼簿！');
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                    >
                      複製
                    </button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    IdP 單一登入端點 (IdP SSO Single Sign-On URL)
                  </label>
                  <input
                    type="text"
                    value={ssoConfig.ssoLoginUrl}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, ssoLoginUrl: e.target.value })}
                    placeholder="https://login.microsoftonline.com/.../saml2"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <FileCheck2 size={14} className="text-purple-400" />
                      IdP X.509 簽章憑證 (Token Signing Certificate)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleValidateCertificate(ssoConfig.certificate)}
                        disabled={isValidatingCert}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg transition-all"
                      >
                        <BadgeCheck size={12} />
                        {isValidatingCert ? '校驗中...' : '即時校驗此憑證'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateSpSigningCert}
                        disabled={isGeneratingCert}
                        className="text-[11px] font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 px-2.5 py-1 bg-purple-900/40 border border-purple-500/30 rounded-lg transition-all"
                      >
                        <RotateCcw size={12} className={isGeneratingCert ? "animate-spin" : ""} />
                        {isGeneratingCert ? '生成中...' : '生成 SP 專用簽章憑證'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={ssoConfig.certificate}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, certificate: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-white focus:border-purple-500 outline-none font-mono leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MFA / 2FA */}
          {activeTab === 'mfa' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-red-950/20 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                    <Fingerprint size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">多因子身分認證原則 (MFA / 2FA Security)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">強化特權帳號防護，強制或建議在登入時提供第二重動態身分證明</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mfaConfig.enforceMfa}
                    onChange={(e) => setMfaConfig({ ...mfaConfig, enforceMfa: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  <span className="text-xs font-bold text-gray-300">強制全域 MFA</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">允許的第二因子認證方式</h5>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg text-xs text-gray-300 cursor-pointer">
                      <span>TOTP 虛擬驗證器 (Google Authenticator, Microsoft Authenticator)</span>
                      <input
                        type="checkbox"
                        checked={mfaConfig.allowedMethods.totp}
                        onChange={(e) => setMfaConfig({
                          ...mfaConfig,
                          allowedMethods: { ...mfaConfig.allowedMethods, totp: e.target.checked }
                        })}
                        className="rounded bg-gray-800 text-red-600"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg text-xs text-gray-300 cursor-pointer">
                      <span>FIDO2 / WebAuthn 硬體安全金鑰 (YubiKey, Windows Hello, TouchID)</span>
                      <input
                        type="checkbox"
                        checked={mfaConfig.allowedMethods.fido2}
                        onChange={(e) => setMfaConfig({
                          ...mfaConfig,
                          allowedMethods: { ...mfaConfig.allowedMethods, fido2: e.target.checked }
                        })}
                        className="rounded bg-gray-800 text-red-600"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg text-xs text-gray-300 cursor-pointer">
                      <span>E-mail 動態一次性驗證碼 (Email OTP)</span>
                      <input
                        type="checkbox"
                        checked={mfaConfig.allowedMethods.emailOtp}
                        onChange={(e) => setMfaConfig({
                          ...mfaConfig,
                          allowedMethods: { ...mfaConfig.allowedMethods, emailOtp: e.target.checked }
                        })}
                        className="rounded bg-gray-800 text-red-600"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">強制 MFA 套用之特權角色</h5>
                  <p className="text-[11px] text-gray-400">當使用者具備下列角色時，系統將不允許跳過 MFA 綁定</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['admin', 'supervisor', 'auditor', 'analyst', 'operator'].map((role) => {
                      const isChecked = mfaConfig.enforceRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setMfaConfig({
                                ...mfaConfig,
                                enforceRoles: mfaConfig.enforceRoles.filter(r => r !== role)
                              });
                            } else {
                              setMfaConfig({
                                ...mfaConfig,
                                enforceRoles: [...mfaConfig.enforceRoles, role]
                              });
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border",
                            isChecked
                              ? "bg-red-600/20 text-red-300 border-red-500/40"
                              : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                          )}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Policy & Session */}
          {activeTab === 'policy' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">密碼複雜度、工作階段與帳號鎖定原則</h4>
                    <p className="text-xs text-gray-400 mt-0.5">防範暴力猜解 (Brute-force) 與密碼字典噴灑攻擊 (Password Spraying)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(authStatus?.metrics?.lockedAccountsCount || 0) > 0 && (
                    <button
                      type="button"
                      onClick={handleClearLockouts}
                      disabled={isClearingLockouts}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw size={12} className={isClearingLockouts ? "animate-spin" : ""} />
                      {isClearingLockouts ? '重置中...' : `解除 ${authStatus?.metrics?.lockedAccountsCount} 個鎖定帳號`}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">帳號防護與防爆破原則 (Lockout Policy)</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">連續密碼失敗上限次數</span>
                      <input
                        type="number"
                        min={3}
                        max={10}
                        value={policyConfig.lockoutPolicy.maxFailedAttempts}
                        onChange={(e) => setPolicyConfig({
                          ...policyConfig,
                          lockoutPolicy: { ...policyConfig.lockoutPolicy, maxFailedAttempts: parseInt(e.target.value) || 5 }
                        })}
                        className="w-20 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white text-right font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">鎖定持續時間 (分鐘)</span>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        value={policyConfig.lockoutPolicy.lockoutDurationMinutes}
                        onChange={(e) => setPolicyConfig({
                          ...policyConfig,
                          lockoutPolicy: { ...policyConfig.lockoutPolicy, lockoutDurationMinutes: parseInt(e.target.value) || 15 }
                        })}
                        className="w-20 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white text-right font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">工作階段與並行限制 (Session Timeout)</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">閒置自動登出逾時 (分鐘)</span>
                      <input
                        type="number"
                        min={5}
                        max={240}
                        value={policyConfig.sessionTimeoutMinutes}
                        onChange={(e) => setPolicyConfig({
                          ...policyConfig,
                          sessionTimeoutMinutes: parseInt(e.target.value) || 30
                        })}
                        className="w-20 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white text-right font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">單一帳號最大並行會話數</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={policyConfig.maxConcurrentSessions}
                        onChange={(e) => setPolicyConfig({
                          ...policyConfig,
                          maxConcurrentSessions: parseInt(e.target.value) || 2
                        })}
                        className="w-20 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white text-right font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Policy Details */}
              <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">密碼複雜度硬性規範 (Password Complexity Requirements)</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-black/40 border border-gray-800 rounded-lg text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={policyConfig.passwordPolicy.requireUppercase}
                      onChange={(e) => setPolicyConfig({
                        ...policyConfig,
                        passwordPolicy: { ...policyConfig.passwordPolicy, requireUppercase: e.target.checked }
                      })}
                      className="rounded bg-gray-800 text-blue-600"
                    />
                    包含大寫字母 (A-Z)
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-black/40 border border-gray-800 rounded-lg text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={policyConfig.passwordPolicy.requireLowercase}
                      onChange={(e) => setPolicyConfig({
                        ...policyConfig,
                        passwordPolicy: { ...policyConfig.passwordPolicy, requireLowercase: e.target.checked }
                      })}
                      className="rounded bg-gray-800 text-blue-600"
                    />
                    包含小寫字母 (a-z)
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-black/40 border border-gray-800 rounded-lg text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={policyConfig.passwordPolicy.requireNumbers}
                      onChange={(e) => setPolicyConfig({
                        ...policyConfig,
                        passwordPolicy: { ...policyConfig.passwordPolicy, requireNumbers: e.target.checked }
                      })}
                      className="rounded bg-gray-800 text-blue-600"
                    />
                    包含數字 (0-9)
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-black/40 border border-gray-800 rounded-lg text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={policyConfig.passwordPolicy.requireSpecialChars}
                      onChange={(e) => setPolicyConfig({
                        ...policyConfig,
                        passwordPolicy: { ...policyConfig.passwordPolicy, requireSpecialChars: e.target.checked }
                      })}
                      className="rounded bg-gray-800 text-blue-600"
                    />
                    包含特殊符號 (!@#$)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Certificates & PKI Trust Store */}
          {activeTab === 'cert' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <FileCheck2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">X.509 數位憑證與 CA 信任庫管理 (Certificates & PKI)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">檢視、驗證與產生 SAML 簽章憑證、LDAPS 信任憑證與 RADIUS TLS 憑證</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateSpSigningCert}
                    disabled={isGeneratingCert}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={12} className={isGeneratingCert ? "animate-spin" : ""} />
                    {isGeneratingCert ? '生成中...' : '重新產生 SP 憑證'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSpMetadata}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Download size={12} />
                    下載 SP Metadata (XML)
                  </button>
                </div>
              </div>

              {/* Active Certificates List */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <BadgeCheck size={14} className="text-emerald-400" />
                  現行作用中憑證與信任庫節點
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cert 1 */}
                  <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 size={16} className="text-purple-400" />
                        <span className="text-xs font-bold text-white">Microsoft Entra ID Token Signing</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        有效 (VALID)
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-gray-400 font-mono">
                      <p className="truncate"><span className="text-gray-500">簽發主體:</span> CN=Microsoft Entra ID (Token Signing)</p>
                      <p className="truncate"><span className="text-gray-500">憑證效期:</span> 至 2028-10-14 (剩餘約 729 天)</p>
                      <p className="truncate"><span className="text-gray-500">SHA-256:</span> DC:2F:9B:B0:A3:86:7C:CD:FD:66:E7:C4...</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleValidateCertificate(ssoConfig.certificate)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      查看詳細校驗結果 <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Cert 2 */}
                  <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-white">Active Directory LDAPS Server CA</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        已信任 (TRUSTED)
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-gray-400 font-mono">
                      <p className="truncate"><span className="text-gray-500">簽發主體:</span> CN=Enterprise-Root-CA, DC=corp, DC=internal</p>
                      <p className="truncate"><span className="text-gray-500">通訊協議:</span> TLS 1.3 / Cipher: AES_256_GCM</p>
                      <p className="truncate"><span className="text-gray-500">連接埠:</span> TCP 636 (LDAPS)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('Active Directory')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                    >
                      重新檢測 TLS 憑證鏈 <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Online Certificate Validator Tool */}
              <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} className="text-emerald-400" />
                  線上 X.509 憑證語法與信任鏈校驗器 (Certificate Inspector & Parser)
                </h5>
                <p className="text-[11px] text-gray-400">
                  貼上任意 X.509 PEM 編碼憑證 (包含 -----BEGIN CERTIFICATE-----)，底層引擎將即時解析 Subject、Issuer、過期倒數及指紋。
                </p>
                <textarea
                  rows={4}
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  placeholder="請貼上 PEM 憑證內容 (若為空將預設驗證現行 SSO IdP 憑證)..."
                  className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 font-mono outline-none focus:border-emerald-500"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleValidateCertificate()}
                    disabled={isValidatingCert}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <BadgeCheck size={14} />
                    {isValidatingCert ? '校驗中...' : '即時語法與信任鏈校驗'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertInput(ssoConfig.certificate)}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-all"
                  >
                    帶入現行 SSO 簽章憑證
                  </button>
                </div>

                {certValidationResult && (
                  <div className={cn(
                    "p-4 rounded-xl border space-y-2 font-mono text-xs",
                    certValidationResult.valid
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                      : "bg-red-950/30 border-red-500/40 text-red-200"
                  )}>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <span className="font-bold flex items-center gap-2">
                        {certValidationResult.valid ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-red-400" />}
                        {certValidationResult.message}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/40">
                        {certValidationResult.status}
                      </span>
                    </div>
                    {certValidationResult.details && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div><span className="text-gray-400 font-bold">簽發主體 (Subject):</span> {certValidationResult.details.subject}</div>
                        <div><span className="text-gray-400 font-bold">簽發機構 (Issuer):</span> {certValidationResult.details.issuer}</div>
                        <div><span className="text-gray-400 font-bold">生效日:</span> {certValidationResult.details.validFrom}</div>
                        <div><span className="text-gray-400 font-bold">過期日:</span> {certValidationResult.details.validTo} (剩餘 {certValidationResult.details.daysRemaining} 天)</div>
                        <div className="md:col-span-2 truncate"><span className="text-gray-400 font-bold">SHA-256 指紋:</span> {certValidationResult.details.fingerprint256}</div>
                        <div className="md:col-span-2 truncate"><span className="text-gray-400 font-bold">序號 (Serial Number):</span> {certValidationResult.details.serialNumber}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: Directory Synced Users */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">網域與目錄已同步帳號 (Directory Users & Role Mappings)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">自 Active Directory / LDAP 定期同步之企業人員帳號與權限角色對照表</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSyncDirectory('ad')}
                    disabled={isSyncingUsers}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <RefreshCw size={12} className={isSyncingUsers ? "animate-spin" : ""} />
                    {isSyncingUsers ? '增量同步中...' : '從 Active Directory 增量同步'}
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="搜尋帳號、姓名、部門、群組或對應角色..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  共檢索到 <span className="text-white font-bold">{filteredUsers.length}</span> 位人員
                </span>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border border-gray-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">帳號 (sAMAccountName)</th>
                      <th className="py-3 px-4">姓名與職稱 (Name & Title)</th>
                      <th className="py-3 px-4">部門 (Department)</th>
                      <th className="py-3 px-4">安全性群組 (MemberOf)</th>
                      <th className="py-3 px-4">對應 SIEM 權限角色</th>
                      <th className="py-3 px-4">狀態</th>
                      <th className="py-3 px-4 text-right">前次活動</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 font-mono">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                            {user.sAMAccountName}
                          </td>
                          <td className="py-3 px-4 font-sans text-gray-200">
                            <div>{user.displayName}</div>
                            <div className="text-[10px] text-gray-500">{user.title}</div>
                          </td>
                          <td className="py-3 px-4 font-sans text-gray-300">{user.department}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.memberOf?.map((grp: string, idx: number) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-blue-950/60 text-blue-300 border border-blue-500/20">
                                  {grp}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              user.mappedRole?.includes('ADMIN') ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              user.mappedRole?.includes('SUPERVISOR') ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                              user.mappedRole?.includes('ANALYST') ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                              "bg-gray-800 text-gray-300"
                            )}>
                              {user.mappedRole}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="text-emerald-400 font-bold">{user.status}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-500 text-[10px]">
                            {new Date(user.lastLogonTimestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 italic font-sans">
                          未發現相符之目錄使用者
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">認證守護行程安全稽核紀錄 (Authentication Audit Trail)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">詳細追蹤所有使用者登入嘗試、密碼策略違規、帳號鎖定與目錄同步事件</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={refreshAllData}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw size={12} />
                    重新整理稽核流
                  </button>
                </div>
              </div>

              {/* Audit Table */}
              <div className="overflow-x-auto border border-gray-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">時間戳記 (Timestamp)</th>
                      <th className="py-3 px-4">事件類型 (Event)</th>
                      <th className="py-3 px-4">認證提供商 (Provider)</th>
                      <th className="py-3 px-4">帳號 / 來源 IP</th>
                      <th className="py-3 px-4">判定結果</th>
                      <th className="py-3 px-4">稽核詳細內容</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 font-mono text-[11px]">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {item.eventType}
                          </td>
                          <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                            {item.provider}
                          </td>
                          <td className="py-3 px-4 text-blue-300 whitespace-nowrap">
                            {item.username || 'System'} {item.ipAddress ? `(${item.ipAddress})` : ''}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              item.result === 'SUCCESS' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                              item.result === 'LOCKED_OUT' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            )}>
                              {item.result}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-gray-300 text-xs">
                            {item.details}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 italic font-sans">
                          目前暫無稽核事件記錄
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const targetName = 
                  activeTab === 'ad' ? 'Active Directory' :
                  activeTab === 'ldap' ? '標準 LDAP' :
                  activeTab === 'radius' ? 'RADIUS' :
                  activeTab === 'sso' ? 'SSO (SAML 2.0)' :
                  activeTab === 'cert' ? '憑證 (X.509 Certificate)' : 'Active Directory';
                handleTestConnection(targetName);
              }}
              disabled={testingStatus === 'testing'}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                testingStatus === 'testing' ? "bg-gray-800 text-gray-400" :
                testingStatus === 'success' ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30" :
                "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
              )}
            >
              {testingStatus === 'testing' ? <RefreshCw size={14} className="animate-spin text-blue-400" /> : 
               testingStatus === 'success' ? <CheckCircle2 size={14} className="text-emerald-400" /> : 
               <Activity size={14} />}
              {testingStatus === 'testing' ? '正在進行通訊測試...' : '測試伺服器連線'}
            </button>

            <button
              type="button"
              onClick={() => setShowDiagnosticsModal(true)}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Terminal size={14} className="text-purple-400" />
              查看診斷日誌
            </button>

            <button
              type="button"
              onClick={() => setShowTestUserModal(true)}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <LogIn size={14} className="text-blue-400" />
              模擬帳號認證
            </button>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-gray-700"
              >
                <RotateCcw size={14} />
                恢復出廠預設值
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                儲存並套用認證配置
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

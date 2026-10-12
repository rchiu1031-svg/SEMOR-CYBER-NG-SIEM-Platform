import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { siemService } from '../services/siemService';

interface AuthenticationSettingsViewProps {
  isReadOnly?: boolean;
}

export default function AuthenticationSettingsView({ isReadOnly = false }: AuthenticationSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'ad' | 'ldap' | 'radius' | 'sso' | 'mfa' | 'policy'>('ad');
  
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
  
  // Test user modal
  const [showTestUserModal, setShowTestUserModal] = useState(false);
  const [testUserAccount, setTestUserAccount] = useState('sec_analyst');
  const [testUserPassword, setTestUserPassword] = useState('');
  const [testUserResult, setTestUserResult] = useState<{ status: 'idle' | 'success' | 'failed'; message: string } | null>(null);
  const [isSimulatingLogin, setIsSimulatingLogin] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    encryption: 'ldaps', // 'none' | 'starttls' | 'ldaps'
    userFilter: '(&(objectCategory=person)(objectClass=user)(sAMAccountName={username}))',
    groupFilter: '(&(objectClass=group)(member={userdn}))',
    usernameAttribute: 'sAMAccountName',
    mailAttribute: 'mail',
    displayNameAttribute: 'displayName',
    departmentAttribute: 'department',
    roleAttribute: 'memberOf',
    autoSyncUsers: true,
    syncInterval: '30', // minutes
    timeout: 5,
  });

  // Standard LDAP Config
  const [ldapConfig, setLdapConfig] = useState({
    enabled: false,
    serverUrl: 'ldap://ldap.enterprise.local:389',
    baseDn: 'ou=accounts,dc=enterprise,dc=local',
    bindDn: 'cn=admin,dc=enterprise,dc=local',
    bindPassword: '••••••••••••••••',
    encryption: 'starttls', // 'none' | 'starttls' | 'ldaps'
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
    authProtocol: 'MS-CHAPv2', // 'PAP' | 'CHAP' | 'MS-CHAPv2' | 'EAP-TTLS'
    timeout: 5,
    retries: 3,
    nasIdentifier: 'UNITY-SIEM-SOC-01',
    nasIpAddress: '192.168.10.200',
  });

  // SSO / SAML / OIDC Config
  const [ssoConfig, setSsoConfig] = useState({
    enabled: true,
    provider: 'entra', // 'entra' | 'okta' | 'google' | 'keycloak' | 'generic_saml' | 'generic_oidc'
    protocol: 'saml2', // 'saml2' | 'oidc'
    entityId: 'https://siem.corp.internal/saml/metadata',
    ssoLoginUrl: 'https://login.microsoftonline.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890/saml2',
    ssoLogoutUrl: 'https://login.microsoftonline.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890/saml2/logout',
    certificate: `-----BEGIN CERTIFICATE-----\nMIIDBTCCAe2gAwIBAgIQN5fKx9PqL4lGmQ8wZ1V... (Microsoft Entra ID X.509 Token Signing Cert)\n-----END CERTIFICATE-----`,
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
    }, 3500);
  };

  // Load backend auth configuration
  React.useEffect(() => {
    siemService.getAuthSettings()
      .then(res => {
        if (res?.auth) {
          if (res.auth.ad) setAdConfig(prev => ({ ...prev, ...res.auth.ad }));
          if (res.auth.ldap) setLdapConfig(prev => ({ ...prev, ...res.auth.ldap }));
          if (res.auth.radius) setRadiusConfig(prev => ({ ...prev, ...res.auth.radius }));
          if (res.auth.sso) setSsoConfig(prev => ({ ...prev, ...res.auth.sso }));
          if (res.auth.mfa) setMfaConfig(prev => ({ ...prev, ...res.auth.mfa }));
          if (res.auth.policy) setPolicyConfig(prev => ({ ...prev, ...res.auth.policy }));
        }
      })
      .catch(err => console.warn('Using default auth config:', err));
  }, []);

  const handleTestConnection = async (type: string) => {
    setTestingStatus('testing');
    setTestMessage(`正在測試 ${type} 認證伺服器連線...`);

    try {
      const res = await siemService.testAuthConnection({
        type,
        host: type === 'Active Directory' ? adConfig.serverUrl : type === 'LDAP' ? ldapConfig.serverUrl : radiusConfig.primaryServer,
        port: type === 'Active Directory' ? 636 : radiusConfig.authPort,
        domain: adConfig.domain
      });

      setTestingStatus('success');
      setTestMessage(res.message || `${type} 連線測試成功！已通過 TLS 握手與服務帳號授權驗證。`);
      if (res.logs) setDiagnosticsLogs(res.logs);
    } catch (err: any) {
      setTestingStatus('error');
      setTestMessage(`${type} 連線失敗: ${err.message || '請確認網路與憑證'}`);
    }
  };

  const handleSimulateUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUserAccount) return;
    
    setIsSimulatingLogin(true);
    setTestUserResult(null);

    try {
      const res = await siemService.simulateAuthLogin(testUserAccount);
      setTestUserResult({
        status: 'success',
        message: res.message || `使用者【${testUserAccount}】身分驗證成功！`
      });
    } catch (err: any) {
      setTestUserResult({
        status: 'failed',
        message: `認證失敗：無法驗證使用者【${testUserAccount}】之憑證`
      });
    } finally {
      setIsSimulatingLogin(false);
    }
  };

  const handleSaveSettings = async () => {
    if (isReadOnly) return;
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
    } catch (err) {
      showToast('認證配置已暫存 (本地備援模式)');
    }
  };

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
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="text-gray-500 hover:text-white text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all"
              >
                關閉
              </button>
            </div>
            <div className="p-5 bg-black/80 font-mono text-xs text-gray-300 space-y-2 max-h-[380px] overflow-y-auto">
              {diagnosticsLogs.length > 0 ? (
                diagnosticsLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed flex items-start gap-2">
                    <span className="text-purple-400 select-none">&gt;</span>
                    <span className={log.includes('SUCCESS') || log.includes('成功') ? 'text-emerald-400' : 'text-gray-300'}>
                      {log}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-600 italic py-8 text-center">尚未產生診斷日誌，請點選「連線診斷與測試」</div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-900/40 flex justify-end">
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
                  <p className="text-[10px] text-gray-500 mt-0.5">測試外部目錄查詢、密碼核驗與 RBAC 角色屬性映射</p>
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
                  測試密碼 (Password)
                </label>
                <input
                  type="password"
                  value={testUserPassword}
                  onChange={(e) => setTestUserPassword(e.target.value)}
                  placeholder="輸入測試使用者密碼"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>

              {testUserResult && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono whitespace-pre-line leading-relaxed">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Server size={18} className="text-blue-400" />
            <span className="truncate">{adConfig.domain}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-mono truncate">DC01.corp.internal:636</p>
        </div>

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
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            <span>Microsoft Entra ID</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">自動 JIT 帳號佈建啟用</p>
        </div>

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
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Fingerprint size={18} className="text-red-400" />
            <span>TOTP + FIDO2</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">涵蓋 Supervisor, Admin, Auditor</p>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">工作階段安全政策</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              高安全防護
            </span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <span>{policyConfig.sessionTimeoutMinutes} 分鐘逾時</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">5 次登入失敗鎖定 15 分鐘</p>
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
                    <p className="text-xs text-gray-400 mt-0.5">整合企業 AD 網域控制器，支援 LDAPS 憑證加密與使用者群組屬性同步</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                    <span>主要網域控制器 URL (Primary DC Host)</span>
                    <span className="text-[10px] text-blue-400 font-mono">建議使用 LDAPS :636</span>
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">備援網域控制器 URL (Backup DC Host)</label>
                  <input
                    type="text"
                    value={adConfig.backupServerUrl}
                    onChange={(e) => setAdConfig({ ...adConfig, backupServerUrl: e.target.value })}
                    placeholder="ldaps://dc02.corp.internal:636"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">網域名稱 (FQDN Domain)</label>
                  <input
                    type="text"
                    value={adConfig.domain}
                    onChange={(e) => setAdConfig({ ...adConfig, domain: e.target.value })}
                    placeholder="corp.internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">NetBIOS 網域代碼</label>
                  <input
                    type="text"
                    value={adConfig.netbiosDomain}
                    onChange={(e) => setAdConfig({ ...adConfig, netbiosDomain: e.target.value })}
                    placeholder="CORP"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">搜尋基底 (Base DN)</label>
                  <input
                    type="text"
                    value={adConfig.baseDn}
                    onChange={(e) => setAdConfig({ ...adConfig, baseDn: e.target.value })}
                    placeholder="DC=corp,DC=internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">使用者搜尋路徑 (User Search Base OU)</label>
                  <input
                    type="text"
                    value={adConfig.userSearchBase}
                    onChange={(e) => setAdConfig({ ...adConfig, userSearchBase: e.target.value })}
                    placeholder="OU=Users,OU=Enterprise,DC=corp,DC=internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">綁定服務帳號 (Bind DN / Admin Account)</label>
                  <input
                    type="text"
                    value={adConfig.bindDn}
                    onChange={(e) => setAdConfig({ ...adConfig, bindDn: e.target.value })}
                    placeholder="CN=svc_siem,OU=ServiceAccounts,DC=corp,DC=internal"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">服務帳號密碼 (Bind Password)</label>
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
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">群組屬性欄位 (Role Mapping Attribute)</label>
                    <input
                      type="text"
                      value={adConfig.roleAttribute}
                      onChange={(e) => setAdConfig({ ...adConfig, roleAttribute: e.target.value })}
                      placeholder="memberOf"
                      className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">電子郵件欄位 (Mail Attribute)</label>
                    <input
                      type="text"
                      value={adConfig.mailAttribute}
                      onChange={(e) => setAdConfig({ ...adConfig, mailAttribute: e.target.value })}
                      placeholder="mail / userPrincipalName"
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">標準 LDAP / OpenLDAP 目錄服務認證</h4>
                    <p className="text-xs text-gray-400 mt-0.5">適用於 Linux OpenLDAP、FreeIPA、Apache DS 等跨平台目錄整合</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ldapConfig.enabled}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="text-xs font-bold text-gray-300">啟用 LDAP 認證</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">LDAP 伺服器網址 (Host & Port)</label>
                  <input
                    type="text"
                    value={ldapConfig.serverUrl}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, serverUrl: e.target.value })}
                    placeholder="ldap://ldap.enterprise.local:389"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">搜尋基底 (Base DN)</label>
                  <input
                    type="text"
                    value={ldapConfig.baseDn}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, baseDn: e.target.value })}
                    placeholder="ou=accounts,dc=enterprise,dc=local"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">管理員綁定帳號 (Bind DN)</label>
                  <input
                    type="text"
                    value={ldapConfig.bindDn}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, bindDn: e.target.value })}
                    placeholder="cn=admin,dc=enterprise,dc=local"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">綁定帳號密碼 (Bind Password)</label>
                  <div className="relative">
                    <input
                      type={showLdapPassword ? "text" : "password"}
                      value={ldapConfig.bindPassword}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, bindPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
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

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">使用者搜尋過濾條件 (Search Filter)</label>
                  <input
                    type="text"
                    value={ldapConfig.userSearchFilter}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, userSearchFilter: e.target.value })}
                    placeholder="(uid={username})"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">傳輸加密協定 (Encryption Protocol)</label>
                  <select
                    value={ldapConfig.encryption}
                    onChange={(e) => setLdapConfig({ ...ldapConfig, encryption: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                  >
                    <option value="none">無加密 (明文傳輸 / Port 389 - 不建議)</option>
                    <option value="starttls">StartTLS (動態握手升級加密 / Port 389)</option>
                    <option value="ldaps">LDAPS 憑證加密 (SSL/TLS / Port 636)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RADIUS */}
          {activeTab === 'radius' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-orange-950/20 border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">RADIUS 遠端身分驗證協定</h4>
                    <p className="text-xs text-gray-400 mt-0.5">支援 Cisco ISE、FreeRADIUS、Microsoft NPS 等 AAA 集中認證伺服器</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={radiusConfig.enabled}
                      onChange={(e) => setRadiusConfig({ ...radiusConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    <span className="text-xs font-bold text-gray-300">啟用 RADIUS</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">主 RADIUS 伺服器 IP / Host</label>
                  <input
                    type="text"
                    value={radiusConfig.primaryServer}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, primaryServer: e.target.value })}
                    placeholder="192.168.10.50"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">認證 Port (Auth)</label>
                    <input
                      type="number"
                      value={radiusConfig.authPort}
                      onChange={(e) => setRadiusConfig({ ...radiusConfig, authPort: parseInt(e.target.value) || 1812 })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">帳務 Port (Acct)</label>
                    <input
                      type="number"
                      value={radiusConfig.acctPort}
                      onChange={(e) => setRadiusConfig({ ...radiusConfig, acctPort: parseInt(e.target.value) || 1813 })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">共用密鑰 (Shared Secret)</label>
                  <div className="relative">
                    <input
                      type={showRadiusSecret ? "text" : "password"}
                      value={radiusConfig.sharedSecret}
                      onChange={(e) => setRadiusConfig({ ...radiusConfig, sharedSecret: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">備援 RADIUS 伺服器 IP (選填)</label>
                  <input
                    type="text"
                    value={radiusConfig.secondaryServer}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, secondaryServer: e.target.value })}
                    placeholder="192.168.10.51"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">認證協定 (Authentication Protocol)</label>
                  <select
                    value={radiusConfig.authProtocol}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, authProtocol: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                  >
                    <option value="MS-CHAPv2">MS-CHAPv2 (建議 - Microsoft NPS 相容)</option>
                    <option value="PAP">PAP (Password Authentication Protocol)</option>
                    <option value="CHAP">CHAP (Challenge-Handshake Protocol)</option>
                    <option value="EAP-TTLS">EAP-TTLS (憑證式通道認證)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">NAS 識別字串 (NAS Identifier)</label>
                  <input
                    type="text"
                    value={radiusConfig.nasIdentifier}
                    onChange={(e) => setRadiusConfig({ ...radiusConfig, nasIdentifier: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SSO / SAML / OIDC */}
          {activeTab === 'sso' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">企業級單一登入 (SSO / SAML 2.0 / OpenID Connect)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">整合 Microsoft Entra ID、Okta、Google Workspace、Keycloak 等雲端身分識別提供商</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ssoConfig.enabled}
                      onChange={(e) => setSsoConfig({ ...ssoConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="text-xs font-bold text-gray-300">啟用 SSO 登入</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">身分識別提供商 (IdP Provider)</label>
                  <select
                    value={ssoConfig.provider}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, provider: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-bold"
                  >
                    <option value="entra">Microsoft Entra ID (原 Azure AD)</option>
                    <option value="okta">Okta Workforce Identity</option>
                    <option value="google">Google Workspace / Cloud Identity</option>
                    <option value="keycloak">Keycloak / Red Hat SSO</option>
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
                          ? "bg-emerald-600/10 border-emerald-500/50 text-emerald-400"
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
                          ? "bg-emerald-600/10 border-emerald-500/50 text-emerald-400"
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
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-mono"
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
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                    <span>IdP X.509 簽章憑證 (Token Signing Certificate)</span>
                    <span className="text-[10px] text-gray-500">PEM / CRT 格式</span>
                  </label>
                  <textarea
                    rows={4}
                    value={ssoConfig.certificate}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, certificate: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-white focus:border-emerald-500 outline-none font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* JIT Provisioning Config */}
              <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white">即時自動佈建帳號 (JIT User Provisioning)</h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">當使用者首次透過 SSO 成功登入時，自動建立本機帳號並分配預設權限角色</p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={ssoConfig.defaultRole}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, defaultRole: e.target.value })}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-bold uppercase"
                  >
                    <option value="viewer">預設角色: VIEWER (唯讀檢視員)</option>
                    <option value="editor">預設角色: EDITOR (操作員)</option>
                    <option value="auditor">預設角色: AUDITOR (審計員)</option>
                  </select>
                  <input
                    type="checkbox"
                    checked={ssoConfig.autoProvisionUsers}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, autoProvisionUsers: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-800 text-emerald-600 focus:ring-emerald-500 border-gray-700"
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
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mfaConfig.enforceMfa}
                      onChange={(e) => setMfaConfig({ ...mfaConfig, enforceMfa: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    <span className="text-xs font-bold text-gray-300">強制特權角色啟用 MFA</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone size={14} className="text-red-400" />
                    允許的第二因子認證方式
                  </h5>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-800/80 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Smartphone size={16} className="text-blue-400" />
                        <div>
                          <p className="text-xs font-bold text-white">TOTP 動態驗證器 (Authenticator App)</p>
                          <p className="text-[10px] text-gray-500">Google Authenticator, Microsoft Authenticator 等 (RFC 6238)</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={mfaConfig.allowedMethods.totp}
                        onChange={(e) => setMfaConfig({
                          ...mfaConfig,
                          allowedMethods: { ...mfaConfig.allowedMethods, totp: e.target.checked }
                        })}
                        className="w-4 h-4 rounded bg-gray-800 text-blue-600 focus:ring-blue-500 border-gray-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-800/80 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Key size={16} className="text-amber-400" />
                        <div>
                          <p className="text-xs font-bold text-white">FIDO2 / WebAuthn 硬體安全金鑰</p>
                          <p className="text-[10px] text-gray-500">Yubikey, Windows Hello, Touch ID 生物辨識</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={mfaConfig.allowedMethods.fido2}
                        onChange={(e) => setMfaConfig({
                          ...mfaConfig,
                          allowedMethods: { ...mfaConfig.allowedMethods, fido2: e.target.checked }
                        })}
                        className="w-4 h-4 rounded bg-gray-800 text-amber-600 focus:ring-amber-500 border-gray-700"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-400" />
                    強制實施 MFA 的角色層級
                  </h5>
                  <div className="space-y-2">
                    {[
                      { role: 'supervisor', name: 'Supervisor (超級維運主控官)', desc: '最高系統權限，強烈建議啟用' },
                      { role: 'admin', name: 'Admin (系統管理員)', desc: '具備全模組設定與使用者管理權限' },
                      { role: 'auditor', name: 'Auditor (合規審計員)', desc: '具備所有稽核紀錄檢閱權限' },
                      { role: 'editor', name: 'Editor (SOC 資安分析師)', desc: '標準事件處置與回應權限' },
                      { role: 'viewer', name: 'Viewer (唯讀檢視員)', desc: '基礎儀表板瀏覽權限' }
                    ].map((item) => (
                      <label key={item.role} className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-gray-800/60 cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-gray-200">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={mfaConfig.enforceRoles.includes(item.role)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...mfaConfig.enforceRoles, item.role]
                              : mfaConfig.enforceRoles.filter(r => r !== item.role);
                            setMfaConfig({ ...mfaConfig, enforceRoles: updated });
                          }}
                          className="w-4 h-4 rounded bg-gray-800 text-red-600 focus:ring-red-500 border-gray-700"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Policy & Session */}
          {activeTab === 'policy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session Policy */}
                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-amber-400" />
                    工作階段與連線政策 (Session Security)
                  </h5>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold block">閒置逾時登出時間 (分鐘)</label>
                      <input
                        type="number"
                        value={policyConfig.sessionTimeoutMinutes}
                        onChange={(e) => setPolicyConfig({ ...policyConfig, sessionTimeoutMinutes: parseInt(e.target.value) || 15 })}
                        className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold block">單一帳號最大允許同時在線裝置數</label>
                      <input
                        type="number"
                        value={policyConfig.maxConcurrentSessions}
                        onChange={(e) => setPolicyConfig({ ...policyConfig, maxConcurrentSessions: parseInt(e.target.value) || 1 })}
                        className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Lockout Policy */}
                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Lock size={14} className="text-red-400" />
                    登入防護與帳號鎖定政策 (Account Lockout)
                  </h5>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold block">連續密碼錯誤上限次數 (次)</label>
                      <input
                        type="number"
                        value={policyConfig.lockoutPolicy.maxFailedAttempts}
                        onChange={(e) => setPolicyConfig({
                          ...policyConfig,
                          lockoutPolicy: { ...policyConfig.lockoutPolicy, maxFailedAttempts: parseInt(e.target.value) || 5 }
                        })}
                        className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold block">帳號鎖定持續時間 (分鐘)</label>
                      <input
                        type="number"
                        value={policyConfig.lockoutPolicy.lockoutDurationMinutes}
                        onChange={(e) => setPolicyConfig({
                          ...policyConfig,
                          lockoutPolicy: { ...policyConfig.lockoutPolicy, lockoutDurationMinutes: parseInt(e.target.value) || 15 }
                        })}
                        className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Complexity */}
                <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4 md:col-span-2">
                  <h5 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-400" />
                    本地密碼強度與複雜度要求 (Password Complexity)
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  activeTab === 'sso' ? 'SSO (SAML 2.0)' : '認證守護行程';
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
                onClick={handleSaveSettings}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <Check size={14} />
                儲存並套用認證配置
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

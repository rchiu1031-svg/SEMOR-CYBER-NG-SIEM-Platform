import React, { useState } from 'react';
import { 
  Key, 
  Database, 
  Cloud, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Terminal,
  Activity,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthSourceLDAP {
  sourceName: string;
  serverHost: string;
  port: number;
  encryption: 'none' | 'starttls' | 'ssltls';
  bindDn: string;
  bindPass: string;
  baseDn: string;
}

interface AuthSourceOAuth {
  provider: 'Google' | 'AzureAD';
  clientId: string;
  clientSecret: string;
  hostedDomain: string;
}

interface AuthenticationSourcesEditorProps {
  ldapSource: AuthSourceLDAP;
  setLdapSource: React.Dispatch<React.SetStateAction<AuthSourceLDAP>>;
  oauthSource: AuthSourceOAuth;
  setOauthSource: React.Dispatch<React.SetStateAction<AuthSourceOAuth>>;
  isZh: boolean;
  setIsDirty: (dirty: boolean) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  ldapVerified: boolean;
  setLdapVerified: (v: boolean) => void;
  oauthVerified: boolean;
  setOauthVerified: (v: boolean) => void;
}

export default function AuthenticationSourcesEditor({
  ldapSource,
  setLdapSource,
  oauthSource,
  setOauthSource,
  isZh,
  setIsDirty,
  triggerToast,
  ldapVerified,
  setLdapVerified,
  oauthVerified,
  setOauthVerified
}: AuthenticationSourcesEditorProps) {

  const [activeSubTab, setActiveSubTab] = useState<'ldap' | 'oauth'>('ldap');
  const [testingConnection, setTestingConnection] = useState<'ldap' | 'oauth' | null>(null);
  
  // Show/Hide credentials trigger
  const [showBindPass, setShowBindPass] = useState(false);
  const [showOauthSecret, setShowOauthSecret] = useState(false);

  // Connection diagnostical logs
  const [diagnosticsLog, setDiagnosticsLog] = useState<string[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const markDirty = () => {
    setIsDirty(true);
  };

  // Change handlers
  const handleLdapChange = (field: keyof AuthSourceLDAP, value: any) => {
    setLdapSource(prev => ({ ...prev, [field]: value }));
    setLdapVerified(false); // reset verified on edit
    markDirty();

    // Live validation check
    const errors = { ...validationErrors };
    if (field === 'serverHost') {
      const ipv4OrFqdnRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}$/;
      if (!value) {
        errors.serverHost = isZh ? '主控網域主機地址為必填' : 'Server Host IP or Domain name is required';
      } else if (!ipv4OrFqdnRegex.test(value)) {
        errors.serverHost = isZh ? '格式錯誤，必須為合法的 IPv4 網域 (如: 192.168.1.5) 或 FQDN (如: ad.corp.com)' : 'Must be valid IPv4 or FQDN format';
      } else {
        delete errors.serverHost;
      }
    }

    if (field === 'bindDn') {
      if (value && !value.includes('=')) {
        errors.bindDn = isZh ? '不符合 LDAP Distinguished Name (DN) 格式，必須包含 "=" 符號' : 'Invalid Bind DN format, must contain "=" matching components';
      } else {
        delete errors.bindDn;
      }
    }
    setValidationErrors(errors);
  };

  const handleOauthChange = (field: keyof AuthSourceOAuth, value: any) => {
    setOauthSource(prev => ({ ...prev, [field]: value }));
    setOauthVerified(false);
    markDirty();

    const errors = { ...validationErrors };
    if (field === 'clientId') {
      if (!value) {
        errors.clientId = isZh ? 'Client ID 不能為空' : 'Client ID cannot be blank';
      } else {
        delete errors.clientId;
      }
    }
    setValidationErrors(errors);
  };

  const testLdapConnection = () => {
    // Validate first
    const errs: Record<string, string> = {};
    if (!ldapSource.sourceName) errs.sourceName = isZh ? '認證來源名稱為必填' : 'Connection Name is required';
    if (!ldapSource.serverHost) {
      errs.serverHost = isZh ? '網域控制器為必填' : 'Domain controller host is required';
    } else {
      const ipv4OrFqdnRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}$/;
      if (!ipv4OrFqdnRegex.test(ldapSource.serverHost)) {
        errs.serverHost = isZh ? '主機位址格式必須為正規 IP 或 FQDN。' : 'Host must be standard IPv4 or fully qualified Domain Name.';
      }
    }
    if (!ldapSource.bindDn || !ldapSource.bindDn.includes('=')) {
      errs.bindDn = isZh ? 'Bind DN 格式錯誤（如: cn=admin,dc=corp,dc=local）' : 'Bind DN misformatted. (e.g. cn=admin,dc=corp,dc=local)';
    }
    if (!ldapSource.baseDn || !ldapSource.baseDn.includes('=')) {
      errs.baseDn = isZh ? 'Base DN 格式錯誤（如: ou=users,dc=corp,dc=local）' : 'Base DN misformatted. (e.g. ou=users,dc=corp,dc=local)';
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      triggerToast(isZh ? '連線測試中止：欄位資料不符合規範。' : 'Test aborted: LDAP configuration format issue.', 'error');
      return;
    }

    setValidationErrors({});
    setTestingConnection('ldap');
    
    // Simulate LDAP connection handshakes
    const logs = [
      `[LDAP] Starting Active Directory handshaking pipeline to ${ldapSource.serverHost}:${ldapSource.port}...`,
      `[LDAP] Resolving socket dns lookup... resolved [10.120.100.2]`,
      `[LDAP] Establishing TCP raw connection on physical socket... Connected.`,
      `[LDAP] Negociating TLS layer using ${ldapSource.encryption.toUpperCase()}...`,
      `[LDAP] Cipher suite negotiated: ECDHE-RSA-AES256-GCM-SHA384 (TLSv1.3)`,
      `[LDAP] Binding credentials using BindDN: "${ldapSource.bindDn}"...`
    ];

    setTimeout(() => {
      // Check for hypothetical errors (if serverHost contains 'fail' or has formatting error)
      if (ldapSource.serverHost.includes('fail') || ldapSource.bindPass === 'wrong') {
        logs.push(`[LDAP] ERROR Bind authentication failed! StatusCode: 49.`);
        logs.push(`[LDAP] ActiveDirectory response code: LDAP_ERROR_80090308: LdapErr: DSID-0C090447, comment: AcceptSecurityContext error, data 52e, v389`);
        logs.push(`[LDAP] Socket aborted. LDAP session terminated.`);
        setDiagnosticsLog(logs);
        setShowLogModal(true);
        setLdapVerified(false);
        setTestingConnection(null);
        triggerToast(isZh ? '測試失敗：Active Directory 拒絕 Bind DN 密碼憑證！' : 'LDAP authentication failed! Check login passwords.', 'error');
      } else {
        logs.push(`[LDAP] Bind successful. Authentication response validated on active directory node.`);
        logs.push(`[LDAP] Querying root DSE details... Success.`);
        logs.push(`[LDAP] Testing search base folder baseDN: "${ldapSource.baseDn}"...`);
        logs.push(`[LDAP] Found 423 directory entries recursively. Indexing normal.`);
        logs.push(`[LDAP] System connectivity validated under latency 11ms.`);
        setDiagnosticsLog(logs);
        setLdapVerified(true);
        setTestingConnection(null);
        triggerToast(isZh ? 'Active Directory 對接正常！綠色安全驗證已就緒。' : 'LDAP core directory handshakes tested successfully!', 'success');
      }
    }, 1800);
  };

  const testOauthConnection = () => {
    // Validate
    const errs: Record<string, string> = {};
    if (!oauthSource.clientId) errs.clientId = isZh ? 'Client ID 為必填常數。' : 'OAuth Client ID is required.';
    if (!oauthSource.clientSecret) errs.clientSecret = isZh ? 'Client Secret 為必填常數。' : 'OAuth Client Secret is required.';

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      triggerToast(isZh ? 'OAuth 檢驗不合規！' : 'OAuth form contains invalid constants.', 'error');
      return;
    }

    setValidationErrors({});
    setTestingConnection('oauth');

    const logs = [
      `[OAuth] Initializing secure handshake to API provider: https://accounts.google.com/o/oauth2/v2/auth`,
      `[OAuth] Transport parameters: ResponseType=code, HostDomain=${oauthSource.hostedDomain || 'Any'}`,
      `[OAuth] Auditing credential pairs: Client ID is present. Secret key hashes computed.`,
      `[OAuth] Querying discovery document: https://accounts.google.com/.well-known/openid-configuration`,
      `[OAuth] OpenID Provider JWKS certificates parsed... Success.`
    ];

    setTimeout(() => {
      if (oauthSource.clientId.includes('error')) {
        logs.push(`[OAuth] ERROR: HTTP 401 client_id_not_found.`);
        logs.push(`[OAuth] Google service response: OAuth developer console configuration was retracted or client is suspended.`);
        setDiagnosticsLog(logs);
        setShowLogModal(true);
        setOauthVerified(false);
        setTestingConnection(null);
        triggerToast(isZh ? '雲端驗證失敗：Client ID 不合規，遠端拒絕通訊。' : 'OAuth provider rejected Client ID constants.', 'error');
      } else {
        logs.push(`[OAuth] Direct connection authenticated! Tenant checks succeeded.`);
        logs.push(`[OAuth] Syncing redirect URL schemas with PacketFence captive gateway callback.`);
        logs.push(`[OAuth] Succeeded. Ready to process secure web SSO transactions.`);
        setDiagnosticsLog(logs);
        setOauthVerified(true);
        setTestingConnection(null);
        triggerToast(isZh ? 'OAuth 2.0 / 雲端身分認證服務介接成功！' : 'OAuth endpoint verification parsed successfully.', 'success');
      }
    }, 1800);
  };

  const handleApplyChanges = () => {
    // Save form changes
    setIsDirty(false);
    triggerToast(
      isZh 
        ? '身分認證源系統設定已儲存！PacketFence API 服務對接成功。' 
        : 'Directory structures updated and committed to PacketFence backend daemon.', 
      'success'
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Header banner */}
      <div className="border-b border-gray-800 pb-3 flex justify-between items-center bg-gray-900/10 p-4 rounded-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase text-red-500 tracking-wider flex items-center gap-2">
            <Key className="text-red-500" size={17} />
            {isZh ? '身分認證源系統對接配置 (Auth Sources)' : 'Identity Authorization Source Directories'}
          </h3>
          <p className="text-[10px] text-gray-500">
            {isZh 
              ? '設定企業內網 LDAP、Windows Active Directory 伺服器群或第三方 OAuth 2.0 雲端 SSO 身分提供者' 
              : 'Configure LDAP domains, active directory controller hosts, or oauth identity tenants.'}
          </p>
        </div>
        
        {/* Dynamic verify statuses */}
        <div className="flex gap-2">
          <span className={cn(
            "text-[9px] font-mono border rounded px-2.5 py-0.5",
            ldapVerified ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-yellow-500/15 text-yellow-500 border-yellow-500/20 animate-pulse"
          )}>
            AD/LDAP: {ldapVerified ? '✓ VERIFIED' : '● UNTESTED'}
          </span>
          <span className={cn(
            "text-[9px] font-mono border rounded px-2.5 py-0.5",
            oauthVerified ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-yellow-500/15 text-yellow-500 border-yellow-500/20 animate-pulse"
          )}>
            Cloud OAuth: {oauthVerified ? '✓ VERIFIED' : '● UNTESTED'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Directory Selector */}
        <div className="lg:col-span-3 bg-[#0d0d0f]/40 border border-gray-800 p-3 rounded-2xl space-y-1">
          <span className="block text-[9px] font-black uppercase text-gray-500 tracking-widest px-2 py-1.5 border-b border-gray-800/60 mb-2">
            {isZh ? '選擇協定種類' : 'Choose Protocol'}
          </span>

          <button
            onClick={() => setActiveSubTab('ldap')}
            className={cn(
              "w-full flex items-center gap-2.5 p-3 rounded-xl transition-all border text-left text-xs",
              activeSubTab === 'ldap'
                ? "bg-red-950/20 border-red-500/45 text-red-400 font-bold"
                : "bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
            )}
          >
            <Database size={14} className={activeSubTab === 'ldap' ? "text-red-400" : "text-gray-50.."} />
            <div>
              <span className="block font-black uppercase">Active Directory / LDAP</span>
              <span className="text-[8.5px] text-gray-500 block leading-none pt-0.5">{isZh ? '企業地端組織 AD 安裝' : 'On-Premise Domain controller'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('oauth')}
            className={cn(
              "w-full flex items-center gap-2.5 p-3 rounded-xl transition-all border text-left text-xs",
              activeSubTab === 'oauth'
                ? "bg-red-950/20 border-red-500/45 text-red-400 font-bold"
                : "bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
            )}
          >
            <Cloud size={14} className={activeSubTab === 'oauth' ? "text-red-400" : "text-gray-50.."} />
            <div>
              <span className="block font-black uppercase">OAuth 2.0 Identity Providers</span>
              <span className="text-[8.5px] text-gray-500 block leading-none pt-0.5">{isZh ? 'Google, Microsoft Azure SSO' : 'Cloud tenant single-sign on'}</span>
            </div>
          </button>

          {/* Quick instructions panel */}
          <div className="mt-4 p-3 bg-black/40 border border-gray-850 rounded-xl text-[10px] leading-relaxed text-gray-500 font-semibold space-y-1.5">
            <span className="block font-bold text-gray-400 flex items-center gap-1">
              <Activity size={12} className="text-red-400 shrink-0" />
              {isZh ? '網管驗證提示' : 'Admin Tips'}
            </span>
            <p>
              {isZh 
                ? '變更設定後，系統將在與 Captive Portal 連動時依序嘗試認證。建議在點擊套用儲存前，先使用「測試通訊」確保憑證正確。' 
                : 'Authentication parameters are dynamically tested inside our server playground sandbox environment.'}
            </p>
          </div>
        </div>

        {/* Right Side: Active configuration Form */}
        <div className="lg:col-span-9 bg-[#0d0d0f]/50 border border-gray-800 p-6 rounded-2xl">
          
          {activeSubTab === 'ldap' ? (
            /* AD / LDAP Form */
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Database size={14} className="text-indigo-400" />
                  {isZh ? 'Active Directory / LDAP 連線協定設定' : 'Active Directory / LDAP Core Configs'}
                </span>
                <span className="text-[9px] font-mono text-purple-400">Default directory port: 389</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                {/* Source Identifier Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '認證來源識別名稱 *' : 'Directory Source Name *'}</label>
                  <input 
                    type="text"
                    required
                    value={ldapSource.sourceName}
                    onChange={(e) => handleLdapChange('sourceName', e.target.value)}
                    placeholder="e.g. Corporate Active Directory"
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                {/* Server Host */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '伺服器主機控制器 IP / FQDN控制器 *' : 'Server Host / Domain controller IP *'}</label>
                  <input 
                    type="text"
                    required
                    value={ldapSource.serverHost}
                    onChange={(e) => handleLdapChange('serverHost', e.target.value)}
                    placeholder="e.g. ad.kela.local or 10.120.100.2"
                    className={cn(
                      "w-full bg-black/40 border rounded-xl px-3 py-2 text-white font-mono",
                      validationErrors.serverHost ? "border-red-500 bg-red-950/10" : "border-gray-800"
                    )}
                  />
                  {validationErrors.serverHost && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.serverHost}</span>
                  )}
                </div>

                {/* Port */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '通訊埠號 *' : 'LDAP Query Port *'}</label>
                  <input 
                    type="number"
                    required
                    value={ldapSource.port}
                    onChange={(e) => handleLdapChange('port', parseInt(e.target.value) || 389)}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                {/* Encryption */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '傳輸安全協定 (Encryption)' : 'Transport Security Type'}</label>
                  <select
                    value={ldapSource.encryption}
                    onChange={(e) => handleLdapChange('encryption', e.target.value)}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-slate-300"
                  >
                    <option value="none">{isZh ? '無 (明文傳輸, Port 389)' : 'None (TCP Port 389)'}</option>
                    <option value="starttls">{isZh ? 'StartTLS (TLS 安全防禦, Port 389)' : 'StartTLS (Upgrade standard socket)'}</option>
                    <option value="ssltls">{isZh ? 'SSL/TLS (LDAPS 極致加密, Port 636)' : 'SSL/TLS (LDAPS on encryption Port 636)'}</option>
                  </select>
                </div>

                {/* Bind DN */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '管理者認證 Bind DN *' : 'Manager Bind DN *'}</label>
                  <input 
                    type="text"
                    required
                    value={ldapSource.bindDn}
                    onChange={(e) => handleLdapChange('bindDn', e.target.value)}
                    placeholder="e.g. cn=admin,dc=corp,dc=local"
                    className={cn(
                      "w-full bg-black/40 border rounded-xl px-3 py-2 text-white font-mono",
                      validationErrors.bindDn ? "border-red-500 bg-red-950/10" : "border-gray-800"
                    )}
                  />
                  {validationErrors.bindDn && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.bindDn}</span>
                  )}
                </div>

                {/* Bind Password */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? 'Bind 密碼 *' : 'Bind Password *'}</label>
                  <div className="relative">
                    <input 
                      type={showBindPass ? "text" : "password"}
                      required
                      value={ldapSource.bindPass}
                      onChange={(e) => handleLdapChange('bindPass', e.target.value)}
                      className="w-full bg-black/40 border border-gray-800 rounded-xl pl-3 pr-10 py-2 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBindPass(!showBindPass)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showBindPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Base DN */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '使用者搜尋範圍 (Search Base DN) *' : 'User Base DN (Search scopes) *'}</label>
                  <input 
                    type="text"
                    required
                    value={ldapSource.baseDn}
                    onChange={(e) => handleLdapChange('baseDn', e.target.value)}
                    placeholder="e.g. ou=employees,dc=corp,dc=local"
                    className={cn(
                      "w-full bg-black/40 border rounded-xl px-3 py-2 text-white font-mono",
                      validationErrors.baseDn ? "border-red-500 bg-red-950/10" : "border-gray-800"
                    )}
                  />
                  {validationErrors.baseDn && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.baseDn}</span>
                  )}
                </div>
              </div>

              {/* Action operations */}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-800/80">
                <button
                  type="button"
                  onClick={testLdapConnection}
                  disabled={testingConnection === 'ldap'}
                  className="py-2 px-4 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Settings size={13} className={cn(testingConnection === 'ldap' && "animate-spin text-purple-400")} />
                  {testingConnection === 'ldap' ? (isZh ? '連線測試中...' : 'Establishing handshakes...') : (isZh ? '測試 AD 通訊連線' : 'Test AD Connectivity')}
                </button>

                <button
                  type="button"
                  onClick={handleApplyChanges}
                  className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-900/10 font-bold"
                >
                  <Save size={13} />
                  {isZh ? '儲存此認證來源' : 'Save Directory and Apply'}
                </button>
              </div>
            </div>
          ) : (
            /* Cloud Identity OAuth Form */
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Cloud size={14} className="text-sky-400" />
                  {isZh ? 'OAuth 2.0 / 雲端 SSO 身分與網域對接設定' : 'Cloud Identity Single Sign-On Configuration'}
                </span>
                <span className="text-[9px] font-mono text-cyan-400">Google OAuth 2.0 / Microsoft Entra ID</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold border-1">
                {/* Cloud Provider selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '雲端身分提供者 (Identity Provider)' : 'Tenant Identity Provider'}</label>
                  <select
                    value={oauthSource.provider}
                    onChange={(e) => handleOauthChange('provider', e.target.value as any)}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-slate-300"
                  >
                    <option value="Google">Google Workspace / Cloud Identity (GSuite)</option>
                    <option value="AzureAD">Microsoft Azure AD / Microsoft Entra ID</option>
                  </select>
                </div>

                {/* Hosted Domain */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '限定信箱網域網尾 (Hosted Domain restriction)' : 'Restrict Hosted Domain'}</label>
                  <input 
                    type="text"
                    value={oauthSource.hostedDomain}
                    onChange={(e) => handleOauthChange('hostedDomain', e.target.value)}
                    placeholder="e.g. company.com (optional)"
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono animate-none"
                  />
                  <span className="text-[8.5px] text-gray-600 block font-normal leading-relaxed pt-0.5">{isZh ? '防範外部 Gmail 私人帳號，強制限制僅限該企業網域名稱登入' : 'Bypass domain restriction to allow general personal cloud accounts.'}</span>
                </div>

                {/* Client ID */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '金鑰帳戶 Client ID *' : 'OAuth Client ID *'}</label>
                  <input 
                    type="text"
                    required
                    value={oauthSource.clientId}
                    onChange={(e) => handleOauthChange('clientId', e.target.value)}
                    placeholder="e.g. 523164971-oauthclientkeyid.apps.googleusercontent.com"
                    className={cn(
                      "w-full bg-black/40 border rounded-xl px-3 py-2 text-white font-mono",
                      validationErrors.clientId ? "border-red-500 bg-red-950/10" : "border-gray-800"
                    )}
                  />
                  {validationErrors.clientId && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.clientId}</span>
                  )}
                </div>

                {/* Client Secret */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '客戶金鑰 Client Secret *' : 'OAuth Client Secret *'}</label>
                  <div className="relative">
                    <input 
                      type={showOauthSecret ? "text" : "password"}
                      required
                      value={oauthSource.clientSecret}
                      onChange={(e) => handleOauthChange('clientSecret', e.target.value)}
                      placeholder="Input client secret token..."
                      className="w-full bg-black/40 border border-gray-800 rounded-xl pl-3 pr-10 py-2 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOauthSecret(!showOauthSecret)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300 transition-all font-bold"
                    >
                      {showOauthSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-800/80">
                <button
                  type="button"
                  onClick={testOauthConnection}
                  disabled={testingConnection === 'oauth'}
                  className="py-2 px-4 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Settings size={13} className={cn(testingConnection === 'oauth' && "animate-spin text-purple-400")} />
                  {testingConnection === 'oauth' ? (isZh ? '雲端驗證中...' : 'Negotiating OAuth handshake...') : (isZh ? '測試雲端認證連線' : 'Test Google/Azure OIDC')}
                </button>

                <button
                  type="button"
                  onClick={handleApplyChanges}
                  className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-900/10 font-bold"
                >
                  <Save size={13} />
                  {isZh ? '儲存此 OAuth 來源' : 'Save Cloud OAuth Client'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Diagnostics Logs modal block wrapper */}
      {showLogModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-xs">
          <div className="bg-[#0b0b0d] border border-gray-850 rounded-2xl p-6 w-full max-w-2xl shadow-3xl space-y-4 font-mono">
            
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <Terminal size={18} className="animate-pulse" />
                <span className="uppercase text-white text-[11px] tracking-wider font-bold">
                  {isZh ? '身分控制器連線通訊診斷記錄' : 'Network Handshake Diagnostics Log'}
                </span>
              </div>
              <span className="text-[10px] text-gray-600 font-bold">RADIUS_ENGINE_TRACE v2.0</span>
            </div>

            {/* Simulated Linux terminal styled compiler window */}
            <div className="bg-black/90 p-4 border border-gray-900 text-slate-300 leading-relaxed rounded-xl text-[10px] select-text select-all space-y-1 max-h-[350px] overflow-y-auto font-mono custom-scrollbar">
              {diagnosticsLog.map((line, lineIdx) => {
                const isError = line.includes('ERROR') || line.includes('abort') || line.includes('failed');
                const isSuccess = line.includes('successful') || line.includes('Success') || line.includes('Querying') || line.includes('Bind successful');
                return (
                  <div key={lineIdx} className="flex gap-2">
                    <span className="text-gray-600 select-none">[{lineIdx + 1}]</span>
                    <span className={cn(
                      isError ? "text-red-500 font-bold" : isSuccess ? "text-green-400 font-bold" : "text-indigo-300 font-normal"
                    )}>
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-gray-800/60 pt-3">
              <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 select-none">
                <AlertTriangle size={12} />
                {isZh ? '測試偵測到安全性綁定通訊中斷，拒絕連線。' : 'Test communication interrupted: credentials rejected.'}
              </span>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="py-1.5 px-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-lg text-[10px] font-black uppercase transition-colors"
              >
                {isZh ? '關閉診斷主機' : 'Close Console'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

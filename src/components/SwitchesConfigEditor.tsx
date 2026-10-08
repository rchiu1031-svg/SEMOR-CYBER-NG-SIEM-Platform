import React, { useState } from 'react';
import { 
  Server, 
  PlusCircle, 
  Save, 
  Radio, 
  Lock, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Info,
  ShieldAlert,
  ServerCrash,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface SwitchDevice {
  id: string;
  ip: string;
  name: string;
  brand: string;
  snmpCommunity: string;
  radiusSecret: string;
  status: 'online' | 'offline';
}

interface SwitchesConfigEditorProps {
  switches: SwitchDevice[];
  setSwitches: React.Dispatch<React.SetStateAction<SwitchDevice[]>>;
  isZh: boolean;
  setIsDirty: (dirty: boolean) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function SwitchesConfigEditor({
  switches,
  setSwitches,
  isZh,
  setIsDirty,
  triggerToast
}: SwitchesConfigEditorProps) {

  // Local Accordion toggle states
  const [activeAccordion, setActiveAccordion] = useState<'basic' | 'snmp' | 'radius' | 'coa'>('basic');

  // Input states for editing switch
  const [deviceForm, setDeviceForm] = useState({
    ip: '10.120.1.250',
    name: '3F-Wireless-Cisco_AP302',
    vendor: 'Cisco',
    snmpVersion: 'v2c' as 'v2c' | 'v3',
    snmpCommunity: 'pf_snmp_sec',
    snmpV3User: 'pf_snmp_v3_user',
    snmpV3AuthPass: 'authSecret123',
    snmpV3PrivPass: 'privSecret456',
    snmpV3AuthProto: 'SHA' as 'MD5' | 'SHA' | 'SHA-256',
    snmpV3PrivProto: 'AES' as 'DES' | 'AES' | 'AES-256',
    radiusSecret: 'radius_shared_secret_key',
    enableCoa: true,
    coaPort: 3799
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const toggleAccordion = (section: 'basic' | 'snmp' | 'radius' | 'coa') => {
    setActiveAccordion(activeAccordion === section ? 'basic' : section);
  };

  const markDirty = () => {
    setIsDirty(true);
  };

  const handleFieldChange = (field: string, val: any) => {
    setDeviceForm(prev => ({ ...prev, [field]: val }));
    markDirty();

    // Live validation checks
    const errors = { ...validationErrors };
    
    if (field === 'ip') {
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!val) {
        errors.ip = isZh ? '設備 IP 為必填結構規格' : 'Device IP IP address is required';
      } else if (!ipv4Regex.test(val)) {
        errors.ip = isZh ? '標準 IPv4 格式不正確（例如: 10.120.1.254）' : 'Must be valid IPv4 standard address format';
      } else {
        delete errors.ip;
      }
    }

    if (field === 'name') {
      if (!val) {
        errors.name = isZh ? '設備名稱不能為空' : 'Device Display Name is required';
      } else {
        delete errors.name;
      }
    }

    setValidationErrors(errors);
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();

    // Client side form validation
    const errs: Record<string, string> = {};
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    if (!deviceForm.ip) {
      errs.ip = isZh ? '設備 IP 為必填。' : 'Device IP is required.';
    } else if (!ipv4Regex.test(deviceForm.ip)) {
      errs.ip = isZh ? '請輸入合法的 IPv4 格式地址。' : 'Must be valid IPv4 octets form (0-255).';
    }

    if (!deviceForm.name) {
      errs.name = isZh ? '設備顯示名稱為必填。' : 'Device Display Name is required.';
    }

    if (!deviceForm.radiusSecret) {
      errs.radiusSecret = isZh ? 'RADIUS 共享金鑰密鑰為唯讀必填。' : 'RADIUS Shared Secret is required.';
    }

    if (deviceForm.enableCoa) {
      const pNum = Number(deviceForm.coaPort);
      if (isNaN(pNum) || pNum < 1 || pNum > 65535) {
        errs.coaPort = isZh ? 'CoA 監聽 Port 號必須介於 1 至 65535 之間。' : 'CoA Port must range 1 to 65535.';
      }
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      triggerToast(isZh ? '註冊主機失敗：請修正紅框欄位。' : 'Register failed: check form parameters.', 'error');
      return;
    }

    // Success create and inject
    const newDevice: SwitchDevice = {
      id: 'sw_net_' + Date.now(),
      ip: deviceForm.ip,
      name: deviceForm.name,
      brand: deviceForm.vendor,
      snmpCommunity: deviceForm.snmpVersion === 'v2c' ? deviceForm.snmpCommunity : 'V3SecureSocket',
      radiusSecret: '•••••••••••••••••',
      status: 'online'
    };

    setSwitches(prev => [...prev, newDevice]);
    
    // Clear state
    setDeviceForm({
      ip: '',
      name: '',
      vendor: 'Aruba',
      snmpVersion: 'v2c',
      snmpCommunity: 'pf_snmp_sec',
      snmpV3User: 'pf_snmp_v3_user',
      snmpV3AuthPass: 'authSecret123',
      snmpV3PrivPass: 'privSecret456',
      snmpV3AuthProto: 'SHA',
      snmpV3PrivProto: 'AES',
      radiusSecret: '',
      enableCoa: true,
      coaPort: 3799
    });
    setValidationErrors({});
    setIsDirty(false); // cleared dirty
    triggerToast(
      isZh 
        ? `網路 NAS 設備 [${newDevice.name}] 成功建立！PacketFence 即時同步下發 RADIUS 用戶資料庫中。` 
        : `Network device [${newDevice.name}] registered & configured in core RADIUS client tree.`, 
      'success'
    );
  };

  const removeDeviceEntry = (id: string, name: string) => {
    setSwitches(prev => prev.filter(sw => sw.id !== id));
    triggerToast(
      isZh ? `已卸載設備節點 [${name}]` : `Dismounted network equipment node [${name}].`, 
      'info'
    );
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Banner */}
      <div className="border-b border-gray-800 pb-3 flex justify-between items-center bg-gray-900/10 p-4 rounded-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase text-red-500 tracking-wider flex items-center gap-2">
            <Server className="text-red-500" size={17} />
            {isZh ? '網路 NAS 暨交換器端點配置表 (Network Devices)' : 'Network Hardware NAS & Switches Configuration'}
          </h3>
          <p className="text-[10px] text-gray-500">
            {isZh 
              ? '註冊實體乙太網交換器 Core Switch / 外部無線 AP 節點，配置 RADIUS 憑證、高階 Dynamic Port 與 CoA 封包通訊監聽' 
              : 'Register active physical network client endpoints (NAS switches / AP hubs) connecting to local RADIUS.'}
          </p>
        </div>
        <div className="px-3 py-1 bg-[#16161a] border border-gray-800 rounded font-mono text-[9px] text-gray-400">
          RADIUS clients dynamic mapping active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: Existing switches list */}
        <div className="lg:col-span-6 bg-[#0d0d0f]/50 border border-gray-800 p-5 rounded-2xl space-y-4">
          <span className="block text-[10px] font-black uppercase text-gray-300 tracking-widest border-b border-gray-800 pb-2">
            {isZh ? '登記硬體設備清冊 (Devices count)' : 'Active RADIUS NAS List'}
          </span>

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {switches.map((sw) => (
              <div key={sw.id} className="p-4 bg-black/40 border border-gray-850 rounded-xl relative hover:border-red-500/25 transition-all group flex items-start gap-4">
                
                <div className="p-2.5 rounded-xl bg-[#0e0e11] border border-gray-800 text-slate-400">
                  <Server size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11.5px] font-black text-white hover:text-red-400 transition-colors uppercase font-mono">{sw.name}</h4>
                    <span className="px-1.5 py-0.2 bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-mono rounded">
                      {sw.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400">
                    <div>
                      <span className="text-gray-500">IP ADDRESS:</span> <span className="text-teal-400 font-bold">{sw.ip}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">VENDOR:</span> <span className="font-bold">{sw.brand}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-gray-500">SNMP COMMUNITY:</span> 
                      <span className="text-amber-500 font-bold bg-[#0d0d0f]/40 px-1 py-0.2 border border-gray-800/60 rounded text-[9px]">{sw.snmpCommunity}</span>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeDeviceEntry(sw.id, sw.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-950/40 hover:bg-red-650 hover:text-white border border-transparent rounded text-red-400 transition-all self-center"
                  title="Remove NAS client"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right pane: Form under Accordion layout */}
        <div className="lg:col-span-6 bg-[#0d0d0f]/50 border border-gray-800 p-5 rounded-2xl">
          <form onSubmit={handleSaveDevice} className="space-y-4">
            
            <span className="block text-[10px] font-black uppercase text-gray-300 tracking-widest border-b border-gray-800 pb-2">
              {isZh ? '註冊新增物理設備 (Device Form)' : 'Hardware NAS Client Register'}
            </span>

            {/* ACCORDION GROUP CONTAINER */}
            <div className="space-y-2.5">
              
              {/* SECTION 1: BASIC SETTINGS */}
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('basic')}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-left font-black transition-all select-none text-[10px] uppercase tracking-wide",
                    activeAccordion === 'basic' ? "bg-black/80 text-red-400 border-b border-gray-800" : "bg-black/30 text-gray-400 hover:text-slate-200"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Server size={13} />
                    {isZh ? '一、硬體基本通訊設定' : '1. Hardware Basic Settings'}
                  </span>
                  {activeAccordion === 'basic' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {activeAccordion === 'basic' && (
                  <div className="p-4 bg-black/40 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                      {/* Device IP */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '網路設備 IP 地址 *' : 'Device IP Address *'}</label>
                        <input 
                          type="text"
                          required
                          value={deviceForm.ip}
                          onChange={(e) => handleFieldChange('ip', e.target.value)}
                          placeholder="e.g. 10.120.1.250"
                          className={cn(
                            "w-full bg-[#0d0d0f] border rounded-lg px-2.5 py-1.5 text-xs text-white font-mono",
                            validationErrors.ip ? "border-red-500 bg-red-950/10 focus:border-red-500" : "border-gray-800"
                          )}
                        />
                        {validationErrors.ip && (
                          <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.ip}</span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider">{isZh ? '網管顯示名稱 *' : 'Display Name *'}</label>
                        <input 
                          type="text"
                          required
                          value={deviceForm.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          placeholder="e.g. Corp Core FortiSwitch"
                          className={cn(
                            "w-full bg-[#0d0d0f] border rounded-lg px-2.5 py-1.5 text-xs text-white",
                            validationErrors.name ? "border-red-500 bg-red-950/10" : "border-gray-800"
                          )}
                        />
                        {validationErrors.name && (
                          <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.name}</span>
                        )}
                      </div>

                      {/* Driver vendor */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? '硬體廠商驅動模組與型號' : 'Vendor Driver profile'}</label>
                        <select
                          value={deviceForm.vendor}
                          onChange={(e) => handleFieldChange('vendor', e.target.value)}
                          className="w-full bg-[#0d0d0f] border border-gray-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-300"
                        >
                          <option value="Cisco">Cisco Systems Catalyst Switch</option>
                          <option value="Fortinet">Fortinet FortiSwitch core driver</option>
                          <option value="Aruba">Aruba Networks dynamic AP profile</option>
                          <option value="H3C">H3C / Huawei core routers</option>
                          <option value="Generic">Generic RFC-compliant client</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: SNMP CREDENTIALS (DYNAMIC RENDER BASED ON VERSION) */}
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('snmp')}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-left font-black transition-all select-none text-[10px] uppercase tracking-wide",
                    activeAccordion === 'snmp' ? "bg-black/80 text-red-400 border-b border-gray-800" : "bg-black/30 text-gray-400 hover:text-slate-200"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Info size={13} />
                    {isZh ? '二、SNMP 組織管理憑證' : '2. SNMP Management Credentials'}
                  </span>
                  {activeAccordion === 'snmp' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {activeAccordion === 'snmp' && (
                  <div className="p-4 bg-black/40 space-y-3.5 text-xs font-bold">
                    {/* SNMP Version Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? 'SNMP 協定版本' : 'SNMP Version'}</label>
                      <select
                        value={deviceForm.snmpVersion}
                        onChange={(e) => handleFieldChange('snmpVersion', e.target.value as any)}
                        className="w-full bg-[#0d0d0f] border border-gray-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-300"
                      >
                        <option value="v2c">SNMP v2c (Community string-based)</option>
                        <option value="v3">SNMP v3 (Secure User / Encryption-based)</option>
                      </select>
                    </div>

                    {/* DYNAMIC BRANCH CONTROLS */}
                    {deviceForm.snmpVersion === 'v2c' ? (
                      /* v2c: Read Community */
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? '唯讀社群金鑰 (Read Community String) *' : 'SNMP Read Community *'}</label>
                        <input 
                          type="text"
                          required
                          value={deviceForm.snmpCommunity}
                          onChange={(e) => handleFieldChange('snmpCommunity', e.target.value)}
                          placeholder="e.g. public or pf_snmp_sec"
                          className="w-full bg-[#0d0d0f] border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    ) : (
                      /* v3: Advanced User Settings */
                      <div className="space-y-2 border-l border-gray-800 pl-3 pt-1">
                        <span className="block text-[8px] text-gray-500 uppercase font-bold select-none">{isZh ? '高階加密帳密參數' : 'SNMP v3 Encryption params'}</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Security Name */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase block">{isZh ? '安全使用者帳號' : 'Security User *'}</label>
                            <input 
                              type="text"
                              required
                              value={deviceForm.snmpV3User}
                              onChange={(e) => handleFieldChange('snmpV3User', e.target.value)}
                              className="w-full bg-[#0d0d0f] border border-gray-800 rounded px-2 py-1 text-white font-mono"
                            />
                          </div>

                          {/* Auth Password */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase block">{isZh ? '認證密碼' : 'Auth Password *'}</label>
                            <input 
                              type="password"
                              required
                              value={deviceForm.snmpV3AuthPass}
                              onChange={(e) => handleFieldChange('snmpV3AuthPass', e.target.value)}
                              className="w-full bg-[#0d0d0f] border border-gray-800 rounded px-2 py-1 text-white font-mono"
                            />
                          </div>

                          {/* Auth Proto select */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase block">{isZh ? '認證通訊協定' : 'Auth Protocol'}</label>
                            <select
                              value={deviceForm.snmpV3AuthProto}
                              onChange={(e) => handleFieldChange('snmpV3AuthProto', e.target.value as any)}
                              className="w-full bg-[#0d0d0f] border border-gray-800 rounded px-2 py-1 text-slate-300"
                            >
                              <option value="MD5">MD5 (Legacy)</option>
                              <option value="SHA">SHA (Secure)</option>
                              <option value="SHA-256">SHA-256 (High Defense)</option>
                            </select>
                          </div>

                          {/* Privacy Password */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase block">{isZh ? '加密(傳輸)密碼' : 'Privacy Password *'}</label>
                            <input 
                              type="password"
                              required
                              value={deviceForm.snmpV3PrivPass}
                              onChange={(e) => handleFieldChange('snmpV3PrivPass', e.target.value)}
                              className="w-full bg-[#0d0d0f] border border-gray-800 rounded px-2 py-1 text-white font-mono"
                            />
                          </div>

                          {/* Privacy Proto select */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[9px] text-gray-500 uppercase block">{isZh ? '加密傳輸協定' : 'Privacy Protocol'}</label>
                            <select
                              value={deviceForm.snmpV3PrivProto}
                              onChange={(e) => handleFieldChange('snmpV3PrivProto', e.target.value as any)}
                              className="w-full bg-[#0d0d0f] border border-gray-800 rounded px-2 py-1 text-slate-300"
                            >
                              <option value="DES">DES (56-bit encryption)</option>
                              <option value="AES">AES (128-bit standard)</option>
                              <option value="AES-256">AES-256 (256-bit militaries standard)</option>
                            </select>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: RADIUS SECURITY */}
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('radius')}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-left font-black transition-all select-none text-[10px] uppercase tracking-wide",
                    activeAccordion === 'radius' ? "bg-black/80 text-red-400 border-b border-gray-800" : "bg-black/30 text-gray-400 hover:text-slate-200"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} />
                    {isZh ? '三、RADIUS 共享金鑰密鑰設定' : '3. RADIUS Shared Secret'}
                  </span>
                  {activeAccordion === 'radius' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {activeAccordion === 'radius' && (
                  <div className="p-4 bg-black/40 space-y-3 text-xs font-bold">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? 'RADIUS 共享金鑰 (Shared Secret) *' : 'RADIUS Shared Secret *'}</label>
                      <input 
                        type="password"
                        required
                        value={deviceForm.radiusSecret}
                        onChange={(e) => handleFieldChange('radiusSecret', e.target.value)}
                        placeholder="RADIUS peer client secret key..."
                        className={cn(
                          "w-full bg-[#0d0d0f] border rounded-lg px-2.5 py-1.5 text-white font-mono",
                          validationErrors.radiusSecret ? "border-red-500 bg-red-950/10 focus:border-red-500" : "border-gray-800"
                        )}
                      />
                      {validationErrors.radiusSecret && (
                        <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.radiusSecret}</span>
                      )}
                      <span className="text-[8.5px] text-gray-500 font-normal block leading-normal pt-1">{isZh ? '用於此 NAS (Switch/AP) 與 PacketFence RADIUS 引擎 (freeRADIUS dæmon) 通訊時的對稱安全校驗金鑰。' : 'Acts as the pre-shared key verified during raw RADIUS packets handshakes.'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: COA CONTROLS */}
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('coa')}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-left font-black transition-all select-none text-[10px] uppercase tracking-wide",
                    activeAccordion === 'coa' ? "bg-black/80 text-red-400 border-b border-gray-800" : "bg-black/30 text-gray-400 hover:text-slate-200"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Radio size={13} />
                    {isZh ? '四、高階 CoA 與動態埠控制' : '4. Dynamic Port CoA configuration'}
                  </span>
                  {activeAccordion === 'coa' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {activeAccordion === 'coa' && (
                  <div className="p-4 bg-black/40 space-y-3.5 text-xs font-bold">
                    
                    {/* Enable RFC 3576 CoA toggle */}
                    <div className="flex items-center justify-between p-1 select-none">
                      <div className="leading-tight">
                        <span className="block text-[10px] text-white uppercase">{isZh ? '啟用 RFC 3576 動態會話踢除 (CoA)' : 'Enable RFC 3576 Dynamic CoA (Change of Authorization)'}</span>
                        <span className="text-[8.5px] text-gray-500 block">Required for live session terminations & quarantine</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={deviceForm.enableCoa}
                          onChange={(e) => handleFieldChange('enableCoa', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white border border-gray-700"></div>
                      </label>
                    </div>

                    {/* DYNAMIC PORT SUB INPUT */}
                    {deviceForm.enableCoa && (
                      <div className="space-y-1 pt-1 border-t border-gray-800/60 transition-all font-mono">
                        <label className="text-[9px] text-gray-500 uppercase tracking-wide block">{isZh ? 'CoA 監聽通訊埠號 *' : 'CoA Listener UDP Port *'}</label>
                        <input 
                          type="number"
                          required
                          value={deviceForm.coaPort}
                          onChange={(e) => handleFieldChange('coaPort', Math.max(1, parseInt(e.target.value) || 3799))}
                          className={cn(
                            "w-full bg-[#0d0d0f] border rounded-lg px-2.5 py-1 text-xs text-teal-400 font-bold",
                            validationErrors.coaPort ? "border-red-500 bg-red-950/10 focus:border-red-500" : "border-gray-800"
                          )}
                        />
                        {validationErrors.coaPort ? (
                          <span className="text-[8.5px] text-red-500 font-semibold block">{validationErrors.coaPort}</span>
                        ) : (
                          <span className="text-[8px] text-gray-600 block font-normal leading-normal">{isZh ? 'PacketFence 用來強制斷線或進行 VLAN 修改所使用的安全 UDP 連接部號，預設 3799' : 'Standard RFC UDP Listener port for Change of Authorization packets, default 3799.'}</span>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/v1/nac/switches/${deviceForm.ip || '10.120.1.254'}/test-coa`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ coaPort: deviceForm.coaPort })
                              });
                              const json = await res.json();
                              triggerToast(json.message || (isZh ? 'CoA 阻斷通訊測試成功！' : 'CoA Test passed!'), 'success');
                            } catch (e: any) {
                              triggerToast(isZh ? `CoA 測試失敗: ${e.message}` : 'CoA probe failed', 'error');
                            }
                          }}
                          className="mt-2 py-1.5 px-3 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          <Zap size={11} />
                          {isZh ? '測試 RFC 3576 CoA 阻斷下發握手' : 'Probe RFC 3576 CoA Port'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Save Equipment */}
            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-900/10"
            >
              <PlusCircle size={14} />
              {isZh ? '註冊儲存網路物理設備' : 'Register NAS Client'}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}

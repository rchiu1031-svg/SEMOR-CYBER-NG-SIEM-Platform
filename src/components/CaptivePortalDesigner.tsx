import React, { useState } from 'react';
import { 
  Palette, 
  Smartphone, 
  Monitor, 
  FileText, 
  FileUp, 
  Key, 
  Save, 
  Trash2, 
  HelpCircle,
  HelpCircle as QuestionIcon,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CaptivePortalConfig {
  logoText: string;
  welcomeMsg: string;
  termsText: string;
  requireAgreement: boolean;
  primaryColor: string;
  bgType: 'solid' | 'gradient' | 'image';
  bgSolidColor: string;
  logoFileName: string;
  authMethods: {
    passwordless: boolean;
    sms: boolean;
    credentials: boolean;
    termsAgreement: boolean;
  };
}

interface CaptivePortalDesignerProps {
  portalConfig: CaptivePortalConfig;
  setPortalConfig: React.Dispatch<React.SetStateAction<CaptivePortalConfig>>;
  isZh: boolean;
  setIsDirty: (dirty: boolean) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  logoPreviewUrl: string;
  setLogoPreviewUrl: (url: string) => void;
}

export default function CaptivePortalDesigner({
  portalConfig,
  setPortalConfig,
  isZh,
  setIsDirty,
  triggerToast,
  logoPreviewUrl,
  setLogoPreviewUrl
}: CaptivePortalDesignerProps) {

  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [dragActive, setDragActive] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'creds' | 'sms' | 'click'>('creds');

  // local warning states
  const [fileError, setFileError] = useState<string | null>(null);

  const markDirty = () => {
    setIsDirty(true);
  };

  const updateConfigField = (field: string, val: any) => {
    setPortalConfig(prev => ({ ...prev, [field]: val }));
    markDirty();
  };

  const updateAuthMethods = (method: 'passwordless' | 'sms' | 'credentials' | 'termsAgreement', checked: boolean) => {
    setPortalConfig(prev => ({
      ...prev,
      authMethods: {
        ...prev.authMethods,
        [method]: checked
      }
    }));
    markDirty();
  };

  // Drag and Drop File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSaveFile = (file: File) => {
    setFileError(null);
    // MIME check
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setFileError(isZh ? '格式不正確，僅限 PNG 或 JPEG/JPG 格式圖片。' : 'Unsupported format. PNG or JPEG/JPG files only.');
      triggerToast(isZh ? '上傳格式錯誤' : 'Invalid file format', 'error');
      return;
    }
    // Size check (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFileError(isZh ? '檔案太大（不得超過 2MB）』' : 'File is too large (max 2MB capacity exceeded).');
      triggerToast(isZh ? '上傳圖片太大，限制為 2MB。' : 'Max file size limits is 2MB', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(previewUrl);
    setPortalConfig(prev => ({ ...prev, logoFileName: file.name }));
    markDirty();
    triggerToast(isZh ? '企業 Logo 讀取成功，右側模擬器已即時加載！' : 'Custom branding logo synchronized with captive simulator.', 'success');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSaveFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSaveFile(e.target.files[0]);
    }
  };

  const triggerManualBrowse = () => {
    const el = document.getElementById('manual-upload-input');
    if (el) el.click();
  };

  const handleSavePortal = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one auth method is toggled on to avoid captive dead-loops
    const { passwordless, sms, credentials } = portalConfig.authMethods;
    if (!passwordless && !sms && !credentials) {
      triggerToast(isZh ? '保存失敗：必須至少啟用一種身分認證渠道！' : 'Save blocked: Must activate at least one authorization method.', 'error');
      return;
    }

    setIsDirty(false);
    triggerToast(
      isZh 
        ? '網頁入口設計器(Captive Portal)設定已儲存，且已編譯至 PacketFence http-daemon！' 
        : 'Captive designer layout committed & synchronized with public hot spot redirects.', 
      'success'
    );
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Tab Banner */}
      <div className="border-b border-gray-800 pb-3 flex justify-between items-center bg-gray-900/10 p-4 rounded-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase text-red-500 tracking-wider flex items-center gap-2">
            <Palette className="text-red-500" size={17} />
            {isZh ? '視覺入口設計與模擬器配置' : 'Captive Portal Designer & Simulator'}
          </h3>
          <p className="text-[10px] text-gray-500">
            {isZh 
              ? '設計訪客、員工在連線上網前所見的 Web 驗證宣告頁面(Branding、ToS)，支援多種交互管道與實體預覽對比' 
              : 'Customize the landing page seen by domain guests and employees before authentication approvals.'}
          </p>
        </div>

        {/* Preview Device selector toggle */}
        <div className="flex bg-black/60 border border-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={cn(
              "p-1.5 rounded transition-all text-gray-400 hover:text-white",
              previewDevice === 'mobile' ? "bg-red-600 text-white" : ""
            )}
            title="Mobile iPhone View"
          >
            <Smartphone size={13} />
          </button>
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={cn(
              "p-1.5 rounded transition-all text-gray-400 hover:text-white",
              previewDevice === 'desktop' ? "bg-red-600 text-white" : ""
            )}
            title="Desktop Browser View"
          >
            <Monitor size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left pane: Parameters setting */}
        <div className="xl:col-span-6 bg-[#0d0d0f]/50 border border-gray-800 p-5 rounded-2xl">
          <form onSubmit={handleSavePortal} className="space-y-5">
            
            {/* Branding and Theme panel */}
            <div className="space-y-4 border-b border-gray-800/60 pb-5">
              <span className="text-[10.5px] font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
                <Palette size={14} className="text-purple-400" />
                {isZh ? '第一步：企業識別與配色 (Branding)' : 'Phase 1: Brand Assets & Colors'}
              </span>

              {/* Logo Drag and Drop area */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block">{isZh ? '上傳企業 LOGO 檔案 (<2MB PNG/JPEG)' : 'Upload Branding Logo'}</label>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerManualBrowse}
                  className={cn(
                    "border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer relative",
                    dragActive ? "border-red-500 bg-red-950/10" : "border-gray-800 bg-black/40 hover:bg-black/60",
                    fileError ? "border-red-500 bg-red-950/5" : ""
                  )}
                >
                  <input 
                    type="file" 
                    id="manual-upload-input" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={handleManualUpload}
                  />
                  <FileUp className="w-6 h-6 text-gray-400" />
                  <span className="text-[10px] text-gray-300 font-bold">
                    {isZh ? '拖曳圖片至此處，或「點此瀏覽」上傳' : 'Drag file here or click to browse'}
                  </span>
                  <span className="text-[8px] text-gray-600 block leading-tight">PNG, JPG, JPEG capacity up to 2MB</span>
                  
                  {portalConfig.logoFileName && (
                    <div className="mt-1 px-2.5 py-0.5 bg-gray-900 border border-gray-800 rounded text-[9px] text-purple-400 font-mono font-bold">
                      Loaded file: {portalConfig.logoFileName}
                    </div>
                  )}
                </div>
                {fileError && (
                  <span className="text-[9px] text-red-500 font-semibold block">{fileError}</span>
                )}
              </div>

              {/* Color picker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? '主題品牌色 (Primary Color)' : 'Theme Primary Color'}</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={portalConfig.primaryColor}
                      onChange={(e) => updateConfigField('primaryColor', e.target.value)}
                      className="w-10 h-7 bg-transparent border-0 outline-none cursor-pointer rounded-lg"
                    />
                    <input 
                      type="text" 
                      value={portalConfig.primaryColor}
                      onChange={(e) => updateConfigField('primaryColor', e.target.value)}
                      className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white uppercase text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? '背景填充樣式' : 'Background Canvas Style'}</label>
                  <select
                    value={portalConfig.bgType}
                    onChange={(e) => updateConfigField('bgType', e.target.value)}
                    className="w-full bg-[#0d0d0f] border border-gray-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-300"
                  >
                    <option value="solid">{isZh ? '純色 (Solid Dark)' : 'Solid dark canvas'}</option>
                    <option value="gradient">{isZh ? '漸層 (Sleek Gradient)' : 'Interactive gradient'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content, agreement and terms of services */}
            <div className="space-y-4 border-b border-gray-800/60 pb-5">
              <span className="text-[10.5px] font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-yellow-400" />
                {isZh ? '第二步：自訂宣告內容與規章 (Policies & Content)' : 'Phase 2: Content Copywriting & Terms'}
              </span>

              {/* Welcome text */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? '入口標題大字 (Header slogan)' : 'Header Slogan'}</label>
                <input 
                  type="text"
                  required
                  value={portalConfig.welcomeMsg}
                  onChange={(e) => updateConfigField('welcomeMsg', e.target.value)}
                  placeholder="e.g. Welcome to Corporate SSID Secure"
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              {/* Terms Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block">{isZh ? '網上合規隱私條款宣告 (Terms description)' : 'Terms of Service'}</label>
                <textarea 
                  rows={2}
                  required
                  value={portalConfig.termsText}
                  onChange={(e) => updateConfigField('termsText', e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-slate-300 font-semibold leading-normal"
                />
              </div>

              {/* Require Agreement Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-850/80">
                <div>
                  <span className="block font-black text-gray-300">{isZh ? '強制要求核實同意規約' : 'Enforce Policy Agreement Check'}</span>
                  <span className="text-[8.5px] text-gray-500 block leading-tight">{isZh ? '開啟後，網卡必須勾選同意 Terms & Conditions 方可按鍵授權認證' : 'Strict audit control, checkable block above submit'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={portalConfig.requireAgreement}
                    onChange={(e) => updateConfigField('requireAgreement', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white border border-gray-700"></div>
                </label>
              </div>
            </div>

            {/* Authentication channels dynamic checkboxes checklists */}
            <div className="space-y-4">
              <span className="text-[10.5px] font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
                <Key size={14} className="text-emerald-400" />
                {isZh ? '第三步：啟用認證接入管道 (Auth Providers)' : 'Phase 3: Active Registration Methods'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method C: AD/LDAP Credentials */}
                <div 
                  onClick={() => updateAuthMethods('credentials', !portalConfig.authMethods.credentials)}
                  className={cn(
                    "flex gap-3 justify-between items-center p-3 border rounded-xl cursor-pointer transition-all hover:bg-black/40 select-none",
                    portalConfig.authMethods.credentials ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-400" : "border-gray-850 bg-[#0d0d0f]/20 text-gray-400"
                  )}
                >
                  <div className="leading-tight">
                    <span className="block text-[10px] font-black uppercase">{isZh ? '企業帳密 LDAP/AD' : 'Employee Corporate AD'}</span>
                    <span className="text-[8px] text-gray-500 block">802.1X back-end sync</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={portalConfig.authMethods.credentials}
                    onChange={(e) => updateAuthMethods('credentials', e.target.checked)}
                    className="hidden"
                  />
                  <div className={cn(
                    "w-3.5 h-3.5 border rounded flex items-center justify-center font-bold",
                    portalConfig.authMethods.credentials ? "bg-emerald-500 text-black border-emerald-500" : "border-gray-600"
                  )}>
                    {portalConfig.authMethods.credentials && '✓'}
                  </div>
                </div>

                {/* Method B: SMS OTP Registration */}
                <div 
                  onClick={() => updateAuthMethods('sms', !portalConfig.authMethods.sms)}
                  className={cn(
                    "flex gap-3 justify-between items-center p-3 border rounded-xl cursor-pointer transition-all hover:bg-black/40 select-none",
                    portalConfig.authMethods.sms ? "border-yellow-500/30 bg-yellow-950/10 text-yellow-500" : "border-gray-850 bg-[#0d0d0f]/20 text-gray-400"
                  )}
                >
                  <div className="leading-tight">
                    <span className="block text-[10px] font-black uppercase">{isZh ? '訪客簡訊認證 SMS OTP' : 'Guest SMS OTP'}</span>
                    <span className="text-[8px] text-gray-500 block">Twilio SMS integrations</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={portalConfig.authMethods.sms}
                    onChange={(e) => updateAuthMethods('sms', e.target.checked)}
                    className="hidden"
                  />
                  <div className={cn(
                    "w-3.5 h-3.5 border rounded flex items-center justify-center font-bold",
                    portalConfig.authMethods.sms ? "bg-yellow-500 text-black border-yellow-500" : "border-gray-600"
                  )}>
                    {portalConfig.authMethods.sms && '✓'}
                  </div>
                </div>

                {/* Method A: Click-and-Go */}
                <div 
                  onClick={() => updateAuthMethods('passwordless', !portalConfig.authMethods.passwordless)}
                  className={cn(
                    "flex gap-3 justify-between items-center p-3 border rounded-xl cursor-pointer transition-all hover:bg-black/40 select-none sm:col-span-2",
                    portalConfig.authMethods.passwordless ? "border-cyan-500/30 bg-cyan-950/10 text-cyan-400" : "border-gray-850 bg-[#0d0d0f]/20 text-gray-400"
                  )}
                >
                  <div className="leading-tight">
                    <span className="block text-[10px] font-black uppercase">{isZh ? '免登陸條款直接連線 (Click to Connect)' : 'Instant Terms Approval'}</span>
                    <span className="text-[8px] text-gray-500 block">Click through bypass registration logs</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={portalConfig.authMethods.passwordless}
                    onChange={(e) => updateAuthMethods('passwordless', e.target.checked)}
                    className="hidden"
                  />
                  <div className={cn(
                    "w-3.5 h-3.5 border rounded flex items-center justify-center font-bold",
                    portalConfig.authMethods.passwordless ? "bg-cyan-500 text-black border-cyan-500" : "border-gray-600"
                  )}>
                    {portalConfig.authMethods.passwordless && '✓'}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-900/15"
            >
              <Save size={14} />
              {isZh ? '套用並儲存網頁登陸配置' : 'Apply Portal Page Layout'}
            </button>
          </form>
        </div>

        {/* Right pane: Dual responsive device Simulator */}
        <div className="xl:col-span-6 flex flex-col justify-center items-center p-3">
          
          <div className="w-full border-b border-gray-800 pb-2 mb-4 flex justify-between items-center font-mono text-[10px]">
            <span className="text-gray-500 uppercase tracking-widest">{isZh ? '實體入口同步渲染預覽' : 'Real-time Captive Previewer'}</span>
            <span className="text-indigo-400 font-bold select-none">{previewDevice === 'mobile' ? 'Simulated iOS Node' : 'Simulated Chromium Node'}</span>
          </div>

          {previewDevice === 'mobile' ? (
            /* MOBILE SIMULATOR PHONE FRAME */
            <div className="w-[280px] h-[580px] bg-[#0c0c0e] rounded-[42px] border-[10px] border-gray-800 shadow-2xl relative overflow-hidden flex flex-col justify-between selection:bg-purple-900">
              {/* Camera Notch bar */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-800 rounded-full z-35 flex justify-center items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-900/80" />
                <div className="w-8 h-1 rounded-full bg-[#1b1b22]" />
              </div>

              {/* Status bar */}
              <div className="pt-8 px-5 flex justify-between items-center text-[8px] font-mono font-bold text-gray-500 z-20">
                <span>09:41</span>
                <div className="flex gap-1">
                  <span>LTE</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Main captive web body viewport wrapper */}
              <div 
                className="flex-1 overflow-y-auto px-5 py-4 flex flex-col items-center justify-center space-y-4 z-10 transition-all"
                style={{
                  background: portalConfig.bgType === 'solid' 
                    ? portalConfig.bgSolidColor 
                    : `linear-gradient(to bottom, ${portalConfig.bgSolidColor}, #1a153b)`
                }}
              >
                {/* Branding Core Logo container */}
                <div className="flex flex-col items-center space-y-1 text-center pt-2">
                  <div className="w-12 h-12 bg-black/50 border border-gray-800 rounded-2xl flex items-center justify-center p-1.5 shadow-md">
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" JSX-referrerPolicy="no-referrer" />
                    ) : (
                      <Lock className="w-5 h-5 text-red-500 animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-100 font-mono pt-1">
                    {logoPreviewUrl ? portalConfig.logoFileName.substring(0, 15) + '...' : portalConfig.logoText}
                  </h4>
                </div>

                {/* Slogan details box */}
                <div className="text-center space-y-1.5 bg-black/45 p-4 rounded-xl border border-gray-850/60 w-full">
                  <h3 className="text-xs font-black text-rose-100 tracking-tight" style={{ color: portalConfig.primaryColor }}>{portalConfig.welcomeMsg}</h3>
                  
                  {/* Dynamic Auth Method Tab Header options */}
                  <div className="flex border-b border-gray-800/80 pb-0 justify-around text-[8px] font-bold font-mono">
                    {portalConfig.authMethods.credentials && (
                      <button 
                        onClick={() => setActivePreviewTab('creds')}
                        className={cn("pb-1 border-b px-1 text-slate-400", activePreviewTab === 'creds' ? "border-red-500 text-white" : "border-transparent")}
                      >
                        LDAP AD
                      </button>
                    )}
                    {portalConfig.authMethods.sms && (
                      <button 
                        onClick={() => setActivePreviewTab('sms')}
                        className={cn("pb-1 border-b px-1 text-slate-400", activePreviewTab === 'sms' ? "border-red-500 text-white" : "border-transparent")}
                      >
                        SMS OTP
                      </button>
                    )}
                    {portalConfig.authMethods.passwordless && (
                      <button 
                        onClick={() => setActivePreviewTab('click')}
                        className={cn("pb-1 border-b px-1 text-slate-400", activePreviewTab === 'click' ? "border-red-500 text-white" : "border-transparent")}
                      >
                        DIRECT
                      </button>
                    )}
                  </div>

                  {/* Rendering actual fields inside simulator tabs */}
                  <div className="text-left py-1 text-[9px] text-slate-400 min-h-[50px]">
                    {activePreviewTab === 'creds' && portalConfig.authMethods.credentials ? (
                      <div className="space-y-1.5 pt-1.5 font-sans">
                        <input type="text" placeholder="AD User ID e.g. linda.w" className="w-full bg-[#111] border border-gray-850 p-1 rounded text-[8px] text-white" disabled />
                        <input type="password" placeholder="Domain Password" className="w-full bg-[#111] border border-gray-850 p-1 rounded text-[8px] text-white" disabled />
                      </div>
                    ) : activePreviewTab === 'sms' && portalConfig.authMethods.sms ? (
                      <div className="space-y-1.5 pt-1.5 font-sans">
                        <input type="tel" placeholder="+886 Mobile phone" className="w-full bg-[#111] border border-gray-850 p-1 rounded text-[8px] text-white" disabled />
                      </div>
                    ) : (
                      <div className="space-y-1 pb-1.5 pt-1 text-center font-mono">
                        <span className="text-[8px] text-teal-400 leading-none">Click connecting to bypass AD/LDAP binding and authenticate instantly.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ToS statement */}
                <div className="w-full text-center space-y-1">
                  <div className="text-[7.5px] text-gray-500 leading-normal bg-black/20 p-2 rounded max-h-[50px] overflow-y-auto">
                    {portalConfig.termsText}
                  </div>

                  {/* Require Agreement UI Checkbox */}
                  {portalConfig.requireAgreement && (
                    <div className="flex gap-1.5 items-center justify-center py-1 text-slate-200 select-none">
                      <input type="checkbox" checked id="checkbox-ios" className="w-2.5 h-2.5 rounded accent-red-600" readOnly />
                      <label htmlFor="checkbox-ios" className="text-[7.5px] font-bold">I agree to terms & policy</label>
                    </div>
                  )}

                  <button 
                    type="button"
                    className="w-full py-1.5 text-[10px] font-black rounded-lg transition-all text-white select-none shadow"
                    style={{ backgroundColor: portalConfig.primaryColor }}
                  >
                    AUTHORIZE NETWORK
                  </button>
                </div>
              </div>

              {/* iPhone horizontal home swipe indicator bar */}
              <div className="h-4 flex justify-center items-center pb-1 z-30 select-none">
                <div className="w-16 h-1 bg-gray-700/80 rounded-full" />
              </div>
            </div>
          ) : (
            /* DESKTOP SIMULATOR CHROME FRAME */
            <div className="w-full max-w-[500px] h-[340px] bg-[#0c0c0e] rounded-xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col justify-between relative selection:bg-purple-900">
              
              {/* Chrome Browser header bar */}
              <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-850 select-none">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                
                {/* Simulated URL bar */}
                <div className="bg-black/40 border border-gray-850 rounded-md px-4 py-0.5 w-[280px] text-center text-[8px] font-mono text-gray-500 flex items-center justify-center gap-1">
                  <Globe size={10} className="text-gray-600" />
                  <span>https://captive.ke-la.com/portal/gateway_redirect</span>
                </div>
                <div className="w-[10px]" />
              </div>

              {/* Viewport contents */}
              <div 
                className="flex-1 overflow-y-auto px-10 py-5 flex md:flex-row flex-col gap-6 items-center justify-center z-10 transition-all font-sans"
                style={{
                  background: portalConfig.bgType === 'solid' 
                    ? portalConfig.bgSolidColor 
                    : `linear-gradient(to bottom, ${portalConfig.bgSolidColor}, #14112e)`
                }}
              >
                {/* Logo and banner left */}
                <div className="space-y-1.5 text-center md:text-left">
                  <div className="w-9 h-9 bg-black/50 border border-gray-800 rounded-xl flex items-center justify-center p-1 shadow">
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" JSX-referrerPolicy="no-referrer" />
                    ) : (
                      <Lock className="w-4 h-4 text-red-500 animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-100 leading-tight">
                    {logoPreviewUrl ? portalConfig.logoFileName.substring(0, 15) : portalConfig.logoText}
                  </h3>
                  <p className="text-[8.5px] text-gray-500 font-medium leading-relaxed max-w-[150px]">{portalConfig.termsText.substring(0, 50)}...</p>
                </div>

                {/* Form fields right */}
                <div className="flex-1 max-w-[200px] bg-black/50 p-4 rounded-xl border border-gray-850/80 space-y-3">
                  <span className="block text-[10px] font-bold text-center" style={{ color: portalConfig.primaryColor }}>
                    {portalConfig.welcomeMsg}
                  </span>

                  <div className="space-y-1.5 text-[8.5px]">
                    <input type="text" placeholder="Domain Login ID" className="w-full bg-[#111] border border-gray-850 p-1.5 rounded text-white text-[8px]" disabled />
                    <input type="password" placeholder="Password" className="w-full bg-[#111] border border-gray-850 p-1.5 rounded text-white text-[8px]" disabled />
                    
                    {portalConfig.requireAgreement && (
                      <div className="flex gap-1.5 items-center pb-1 text-slate-300">
                        <input type="checkbox" checked id="checkbox-chrome" className="w-2.5 h-2.5 rounded accent-red-600" readOnly />
                        <label htmlFor="checkbox-chrome" className="text-[7.5px] font-bold leading-none">I agree to privacy agreements</label>
                      </div>
                    )}

                    <button 
                      type="button" 
                      className="w-full py-1.5 text-[9px] text-white font-extrabold rounded-md shadow uppercase tracking-wide"
                      style={{ backgroundColor: portalConfig.primaryColor }}
                    >
                      Authenticate Host
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Sliders, 
  ArrowUp, 
  ArrowDown, 
  PlusCircle, 
  Save, 
  AlertTriangle,
  Info,
  Check,
  Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface ConnectionProfileRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  conditions: {
    id: string;
    criteriaType: 'ssid' | 'switch_ip' | 'user_group' | 'os_type' | 'time_window' | 'mac_list';
    operator: 'equals' | 'not_equals' | 'contains' | 'matches_regex';
    value: string;
  }[];
  logic: 'AND' | 'OR';
  accessRole: 'Guest' | 'Employee' | 'Quarantine' | 'BYOD' | 'Blocked';
  sessionTimeout: number;
  sessionTimeoutUnit: 'hours' | 'days';
  defaultVlan?: number;
}

interface ConnectionProfilesEditorProps {
  rules: ConnectionProfileRule[];
  setRules: React.Dispatch<React.SetStateAction<ConnectionProfileRule[]>>;
  isZh: boolean;
  setIsDirty: (dirty: boolean) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function ConnectionProfilesEditor({
  rules,
  setRules,
  isZh,
  setIsDirty,
  triggerToast
}: ConnectionProfilesEditorProps) {
  
  // Single Rule state we are actively editing
  const [editingRule, setEditingRule] = useState({
    name: '',
    description: '',
    isActive: true,
    logic: 'AND' as 'AND' | 'OR',
    conditions: [
      { id: '1', criteriaType: 'os_type' as any, operator: 'equals' as any, value: 'iOS' }
    ],
    accessRole: 'Employee' as any,
    sessionTimeout: 8,
    sessionTimeoutUnit: 'hours' as 'hours' | 'days',
    defaultVlan: 10
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Flag dirty state on edit
  const markDirty = () => {
    setIsDirty(true);
  };

  const handleAddField = (field: string, val: any) => {
    setEditingRule(prev => ({ ...prev, [field]: val }));
    markDirty();
    
    // Immediate field validation
    if (field === 'name') {
      const errs = { ...validationErrors };
      if (!val) {
        errs.name = isZh ? '策略名稱為必填' : 'Profile Name is required';
      } else if (!/^[a-zA-Z0-9_]+$/.test(val)) {
        errs.name = isZh ? '僅限英數字與底線' : 'Alphanumeric and underscores only';
      } else if (val.length < 3 || val.length > 50) {
        errs.name = isZh ? '長度長度須介於 3-50 字。' : 'Length must be between 3 and 50 characters';
      } else {
        delete errs.name;
      }
      setValidationErrors(errs);
    }
    
    if (field === 'defaultVlan') {
      const errs = { ...validationErrors };
      const num = parseInt(val);
      if (val && (isNaN(num) || num < 1 || num > 4094)) {
        errs.defaultVlan = isZh ? 'VLAN 必須限制於 1 至 4094 之間。' : 'VLAN range must be 1 to 4094';
      } else {
        delete errs.defaultVlan;
      }
      setValidationErrors(errs);
    }
  };

  const addCondition = () => {
    setEditingRule(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions, 
        { id: Date.now().toString() + Math.random().toString(), criteriaType: 'ssid', operator: 'equals', value: '' }
      ]
    }));
    markDirty();
  };

  const removeCondition = (condId: string) => {
    if (editingRule.conditions.length <= 1) {
      triggerToast(
        isZh ? '策略必須至少包含一個條件篩選器' : 'Profiles must contain at least one criteria rule.', 
        'error'
      );
      return;
    }
    setEditingRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== condId)
    }));
    markDirty();
  };

  const updateCondition = (condId: string, updates: Partial<typeof editingRule.conditions[0]>) => {
    setEditingRule(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => {
        if (c.id === condId) {
          const updated = { ...c, ...updates };
          // If criteria type changed, reset operator and value dynamically
          if (updates.criteriaType) {
            const type = updates.criteriaType;
            if (type === 'os_type') {
              updated.operator = 'equals';
              updated.value = 'Windows';
            } else if (type === 'switch_ip') {
              updated.operator = 'matches_regex';
              updated.value = '10.120.*';
            } else if (type === 'user_group') {
              updated.operator = 'contains';
              updated.value = 'Finance';
            } else {
              updated.operator = 'equals';
              updated.value = '';
            }
          }
          return updated;
        }
        return c;
      })
    }));
    markDirty();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Client-side form validations
    const errs: Record<string, string> = {};
    if (!editingRule.name) {
      errs.name = isZh ? '策略名稱為必填項目。' : 'Profile Name is required.';
    } else if (!/^[a-zA-Z0-9_]{3,50}$/.test(editingRule.name)) {
      errs.name = isZh ? '名稱僅限英數字與底線，長度須介於 3-50 字元。' : 'Must be alphanumeric and underscores, length 3-50.';
    }

    if (editingRule.defaultVlan) {
      const vlanNum = Number(editingRule.defaultVlan);
      if (isNaN(vlanNum) || vlanNum < 1 || vlanNum > 4094) {
        errs.defaultVlan = isZh ? '備用 VLAN 必須為 1 至 4094 之間的整數。' : 'Default VLAN must be an integer between 1 and 4094.';
      }
    }

    // Conditions check
    editingRule.conditions.forEach((c, idx) => {
      if (!c.value) {
        errs[`condition_${idx}`] = isZh ? `條件 #${idx+1} 之核取值不能為空。` : `Value for condition #${idx+1} cannot be blank.`;
      }
    });

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      triggerToast(isZh ? '儲存失敗：請檢驗紅框欄位格式與必填項目。' : 'Save rejected: check form constraints.', 'error');
      return;
    }

    // Create Rule
    const createdRule: ConnectionProfileRule = {
      id: 'r_rule_' + Date.now(),
      name: editingRule.name,
      description: editingRule.description,
      isActive: editingRule.isActive,
      conditions: editingRule.conditions,
      logic: editingRule.logic,
      accessRole: editingRule.accessRole,
      sessionTimeout: editingRule.sessionTimeout,
      sessionTimeoutUnit: editingRule.sessionTimeoutUnit,
      defaultVlan: editingRule.defaultVlan ? Number(editingRule.defaultVlan) : undefined
    };

    setRules(prev => [...prev, createdRule]);
    
    // Reset Form
    setEditingRule({
      name: '',
      description: '',
      isActive: true,
      logic: 'AND',
      conditions: [
        { id: 'init-' + Date.now(), criteriaType: 'os_type', operator: 'equals', value: 'Windows' }
      ],
      accessRole: 'Employee',
      sessionTimeout: 8,
      sessionTimeoutUnit: 'hours',
      defaultVlan: 10
    });
    setValidationErrors({});
    setIsDirty(false); // cleared
    triggerToast(
      isZh 
        ? `連線策略 [${createdRule.name}] 儲存成功，規則已即時編譯為 PacketFence ACL 節點鏈！` 
        : `Connection profile [${createdRule.name}] saved & compiled to active PacketFence ACL chains.`, 
      'success'
    );
  };

  const removeRuleEntry = (id: string, name: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    triggerToast(
      isZh ? `已取消撤銷核心認證規則 [${name}]` : `Retracted authorization profile [${name}].`, 
      'info'
    );
  };

  const moveRuleUp = (idx: number) => {
    if (idx === 0) return;
    const copied = [...rules];
    const prev = copied[idx - 1];
    copied[idx - 1] = copied[idx];
    copied[idx] = prev;
    setRules(copied);
    triggerToast(isZh ? '規則優先權 (Priority) 已遞升！' : 'Rule priority raised successfully.', 'success');
  };

  const moveRuleDown = (idx: number) => {
    if (idx === rules.length - 1) return;
    const copied = [...rules];
    const next = copied[idx + 1];
    copied[idx + 1] = copied[idx];
    copied[idx] = next;
    setRules(copied);
    triggerToast(isZh ? '規則優先權 (Priority) 已遞補！' : 'Rule priority lowered successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-3 flex justify-between items-center bg-gray-900/10 p-4 rounded-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase text-red-500 tracking-wider flex items-center gap-2">
            <Sliders size={18} className="text-red-500" />
            {isZh ? '存取策略與角色映射規則配置' : 'Connection Profiles & Role Mapping Engine'}
          </h3>
          <p className="text-[10px] text-gray-500">
            {isZh 
              ? '將複雜的 PacketFence 策略簡化為 If (條件組合) → Then (執行動作) 的直覺流程並動態發配 VLAN，規則排序代表優先權' 
              : 'Simplify RADIUS contexts into native If/Then priorities mapping LDAP or OS types directly into target VLAN segments.'}
          </p>
        </div>
        <div className="px-3 py-1 bg-[#16161a] border border-gray-800 rounded font-mono text-[9px] text-gray-400">
          IF-THEN priority builder active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Existing Rule priority chain list */}
        <div className="lg:col-span-7 bg-[#0d0d0f]/50 border border-gray-800 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{isZh ? '作用策略優先權排序' : 'Active Connection Profiles'}</span>
            <span className="text-[9px] font-mono text-purple-400">Total in Database: {rules.length}</span>
          </div>

          <div className="space-y-4 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
            {rules.map((rule, idx) => (
              <div 
                key={rule.id} 
                className={cn(
                  "p-4 bg-black/40 border rounded-xl hover:border-red-500/30 transition-all relative group flex flex-col justify-between gap-3",
                  rule.isActive ? "border-gray-800" : "border-gray-900 opacity-60"
                )}
              >
                {/* Actions Toolbar on top right */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                  <span className={cn(
                    "px-1.5 py-0.2 border rounded text-[7px] font-black uppercase tracking-widest",
                    rule.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-800/20 text-gray-400 border-gray-700/20"
                  )}>
                    {rule.isActive ? (isZh ? '已啟用' : 'Active') : (isZh ? '停用' : 'Inactive')}
                  </span>
                  
                  {/* Reorder Arrows */}
                  <button 
                    onClick={() => moveRuleUp(idx)}
                    disabled={idx === 0}
                    title="Move Up (Boost Priority)"
                    className="p-1 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded disabled:opacity-20 transition-all"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button 
                    onClick={() => moveRuleDown(idx)}
                    disabled={idx === rules.length - 1}
                    title="Move Down (Lower Priority)"
                    className="p-1 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded disabled:opacity-20 transition-all"
                  >
                    <ArrowDown size={11} />
                  </button>

                  <button 
                    onClick={() => removeRuleEntry(rule.id, rule.name)}
                    title="Delete ACL Rule"
                    className="p-1 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors ml-1"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center bg-gray-900 border border-gray-800 text-purple-400 font-mono text-[10px] font-bold rounded-lg select-none">
                      #{idx + 1}
                    </span>
                    <h4 className="text-[11.5px] font-black text-white hover:text-red-400 transition-colors uppercase tracking-tight">{rule.name}</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 italic font-semibold">{rule.description || (isZh ? '(無策略描述)' : '(No description provided)')}</p>
                  
                  {/* Rule visual engine block */}
                  <div className="p-3 bg-black/70 rounded-xl border border-gray-850/80 space-y-1.5 font-mono text-[10px] relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest text-slate-600">
                      Evaluator logic: {rule.logic}
                    </div>
                    <div>
                      <span className="text-red-500 font-black uppercase">IF: </span>
                      {rule.conditions.map((c, cidx) => (
                        <span key={c.id} className="inline-block text-indigo-300">
                          {cidx > 0 && <span className="text-gray-500 font-bold mx-1.5">{rule.logic}</span>}
                          <span className="text-amber-400 font-bold font-sans">{c.criteriaType}</span>
                          <span className="text-red-400 font-bold border border-gray-800 px-1 py-0.2 mx-1 rounded bg-[#0d0d0f]">{c.operator}</span>
                          <span className="text-teal-400 font-bold">"{c.value}"</span>
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-gray-800/60 pt-1.5 mt-2">
                      <span className="text-red-500 font-black uppercase">THEN ACTIONS:</span>
                      <div className="pl-4 mt-1 grid grid-cols-2 gap-2 text-gray-300">
                        <div className="flex items-center gap-1">
                          <Check size={11} className={rule.accessRole === 'Blocked' ? "text-red-500" : rule.accessRole === 'Quarantine' ? "text-amber-500" : "text-green-400"} />
                          <span>Assign Role: <span className={cn(
                            "font-bold uppercase px-1 rounded text-[9px]",
                            rule.accessRole === 'Blocked' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            rule.accessRole === 'Quarantine' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            "text-green-400"
                          )}>{rule.accessRole}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check size={11} className="text-green-400" />
                          <span>Timeout: <span className="font-bold text-amber-500">{rule.sessionTimeout} {rule.sessionTimeoutUnit}</span></span>
                        </div>
                        {rule.defaultVlan && (
                          <div className="flex items-center gap-1 col-span-2">
                            <Check size={11} className="text-green-400" />
                            <span>Fallback Target: <span className="font-bold text-purple-400">VLAN {rule.defaultVlan}</span> (Backup role mapping)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Simple form to add a Connection Profile rule */}
        <div className="lg:col-span-5 bg-[#0d0d0f]/50 border border-gray-800 p-5 rounded-2xl space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2.5 text-red-400 font-black text-xs uppercase tracking-wider">
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{isZh ? '設置新增策略設定檔' : 'Create Connection Profile'}</span>
            </div>

            {/* Profile Name */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isZh ? '策略代稱 (Profile Name) *' : 'Profile Name *'}</label>
                <span className="text-[8px] font-bold text-gray-500">Regex constraint: Alphanumeric & underscores</span>
              </div>
              <input 
                type="text"
                required
                value={editingRule.name}
                onChange={(e) => handleAddField('name', e.target.value)}
                placeholder="e.g. Corp_Staff_Wireless"
                className={cn(
                  "w-full bg-black/40 border rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500 font-mono",
                  validationErrors.name ? "border-red-500 focus:border-red-500 bg-red-900/10" : "border-gray-800"
                )}
              />
              {validationErrors.name && (
                <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.name}</span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isZh ? '策略用途簡述' : 'Profile Description'}</label>
              <textarea 
                rows={2}
                value={editingRule.description}
                onChange={(e) => handleAddField('description', e.target.value)}
                placeholder="Briefly state policy trigger and targeting departments..."
                className="w-full bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-red-500 leading-normal"
              />
            </div>

            {/* Is Active Status Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800/60 text-xs">
              <div>
                <span className="block font-black text-gray-300">{isZh ? '立即啟用此策略' : 'Enable Profile Immediately'}</span>
                <span className="text-[9px] text-gray-500 block leading-normal">{isZh ? '開啟後，認證流量將由上至下匹配此 ACL 節點' : 'If disabled, evaluator bypasses matching calculations'}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={editingRule.isActive}
                  onChange={(e) => handleAddField('isActive', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white border border-gray-700"></div>
              </label>
            </div>

            {/* Dynamic Conditions Title & LOGIC Toggle */}
            <div className="p-4 bg-black/80 rounded-xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isZh ? '篩選條件堆疊 (If / Conditions)' : 'If / Criteria block'}</span>
                
                {/* Logic AND/OR switch */}
                <div className="flex items-center bg-[#111114] border border-gray-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleAddField('logic', 'AND')}
                    className={cn(
                      "px-2 py-0.5 text-[8.5px] font-black rounded uppercase transition-all",
                      editingRule.logic === 'AND' ? "bg-red-600 text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    AND
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('logic', 'OR')}
                    className={cn(
                      "px-2 py-0.5 text-[8.5px] font-black rounded uppercase transition-all",
                      editingRule.logic === 'OR' ? "bg-red-600 text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    OR
                  </button>
                </div>
              </div>

              {/* Dynamic array of rows */}
              <div className="space-y-3 max-h-[190px] overflow-y-auto custom-scrollbar pr-1">
                {editingRule.conditions.map((row, idx) => (
                  <div key={row.id} className="flex gap-2 items-center bg-black/40 border border-gray-850 p-2.5 rounded-lg relative group">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 text-[10px]">
                      
                      {/* Criteria select */}
                      <select
                        value={row.criteriaType}
                        onChange={(e) => updateCondition(row.id, { criteriaType: e.target.value as any })}
                        className="sm:col-span-4 bg-[#0c0c0e] border border-gray-800 rounded px-1.5 py-1 text-slate-300 font-bold"
                      >
                        <option value="os_type">{isZh ? '系統類別 (OS)' : 'OS Type'}</option>
                        <option value="ssid">{isZh ? '連線 SSID (SSID)' : 'SSID'}</option>
                        <option value="user_group">{isZh ? '使用者群組 (Group)' : 'User Group'}</option>
                        <option value="switch_ip">{isZh ? '交換器 IP (NAS)' : 'Switch IP'}</option>
                        <option value="time_window">{isZh ? '時間排程 (Time)' : 'Time Window'}</option>
                        <option value="mac_list">{isZh ? 'MAC 位址清單' : 'MAC List'}</option>
                      </select>

                      {/* Operator select */}
                      <select
                        value={row.operator}
                        onChange={(e) => updateCondition(row.id, { operator: e.target.value as any })}
                        className="sm:col-span-3 bg-[#0c0c0e] border border-gray-800 rounded px-1.5 py-1 text-teal-400 font-black font-mono"
                      >
                        {row.criteriaType === 'os_type' && (
                          <>
                            <option value="equals">==</option>
                            <option value="not_equals">!=</option>
                          </>
                        )}
                        {row.criteriaType === 'ssid' && (
                          <>
                            <option value="equals">==</option>
                            <option value="not_equals">!=</option>
                            <option value="contains">contains</option>
                          </>
                        )}
                        {row.criteriaType === 'user_group' && (
                          <>
                            <option value="equals">==</option>
                            <option value="contains">contains</option>
                          </>
                        )}
                        {row.criteriaType === 'switch_ip' && (
                          <>
                            <option value="equals">==</option>
                            <option value="matches_regex">Matches Regex</option>
                          </>
                        )}
                        {row.criteriaType === 'time_window' && (
                          <>
                            <option value="equals">==</option>
                          </>
                        )}
                        {row.criteriaType === 'mac_list' && (
                          <>
                            <option value="equals">==</option>
                            <option value="matches_regex">Matches Regex</option>
                          </>
                        )}
                      </select>

                      {/* Value Selector or Input */}
                      <div className="sm:col-span-5">
                        {row.criteriaType === 'os_type' ? (
                          <select
                            value={row.value}
                            onChange={(e) => updateCondition(row.id, { value: e.target.value })}
                            className="w-full bg-[#0c0c0e] border border-gray-800 rounded px-1.5 py-1 text-purple-400 font-bold"
                          >
                            <option value="Windows">Windows</option>
                            <option value="macOS">macOS</option>
                            <option value="Linux">Linux</option>
                            <option value="iOS">iOS</option>
                            <option value="Android">Android</option>
                            <option value="IoT">IoT</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder={
                              row.criteriaType === 'switch_ip' ? '10.120.*' :
                              row.criteriaType === 'time_window' ? '08:00-18:00' :
                              'Value matches...'
                            }
                            value={row.value}
                            onChange={(e) => updateCondition(row.id, { value: e.target.value })}
                            className="w-full bg-[#0c0c0e] border border-gray-800 rounded px-2 py-1 text-teal-400 font-mono outline-none"
                          />
                        )}
                      </div>
                    </div>

                    {/* Delete dynamic criteria button */}
                    <button
                      type="button"
                      onClick={() => removeCondition(row.id)}
                      className="p-1 text-gray-500 hover:text-red-400 Transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add condition button */}
              <button
                type="button"
                onClick={addCondition}
                className="w-full py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={12} />
                {isZh ? '新增條件 (Add Criteria)' : 'Add Condition Row'}
              </button>
            </div>

            {/* Action/Then outputs block */}
            <div className="p-4 bg-black/80 rounded-xl border border-gray-800 space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-b border-gray-800 pb-1.5">
                {isZh ? '對應動作與優先發配 (Then / Actions & Roles)' : 'Then / Actions & VLAN Map'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-none">
                
                {/* Access Role */}
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 uppercase">{isZh ? '對應存取角色' : 'Access Role'}</label>
                  <select
                    value={editingRule.accessRole}
                    onChange={(e) => handleAddField('accessRole', e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-gray-800 rounded px-2 py-2 text-white font-bold"
                  >
                    <option value="Guest">{isZh ? 'Guest (訪客隔離網)' : 'Guest (Isolation Net)'}</option>
                    <option value="Employee">{isZh ? 'Employee (員工網)' : 'Employee (Internal)'}</option>
                    <option value="Quarantine">{isZh ? 'Quarantine (病株檢疫網 - VLAN 99)' : 'Quarantine (Remediation VLAN 99)'}</option>
                    <option value="Blocked">{isZh ? 'Blocked (存取阻斷 / RADIUS Access-Reject 封鎖)' : 'Blocked (Access-Reject / Port Drop)'}</option>
                    <option value="BYOD">{isZh ? 'BYOD (自攜設備網)' : 'BYOD (Restricted)'}</option>
                  </select>
                </div>

                {/* Session Timeout */}
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 uppercase">{isZh ? '自動過期時段' : 'RADIUS Session Timeout'}</label>
                  <div className="flex gap-1">
                    <input 
                      type="number" 
                      min={1}
                      value={editingRule.sessionTimeout}
                      onChange={(e) => handleAddField('sessionTimeout', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-[#0c0c0e] border border-gray-800 rounded p-2 text-slate-300 font-bold"
                    />
                    <select
                      value={editingRule.sessionTimeoutUnit}
                      onChange={(e) => handleAddField('sessionTimeoutUnit', e.target.value)}
                      className="flex-1 bg-[#0c0c0e] border border-gray-800 rounded p-1 text-slate-400 text-[11px]"
                    >
                      <option value="hours">{isZh ? '小時' : 'Hours'}</option>
                      <option value="days">{isZh ? '天' : 'Days'}</option>
                    </select>
                  </div>
                </div>

                {/* Default Backup VLAN */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-gray-500 uppercase">{isZh ? '備用預設 VLAN (1-4094)' : 'Fallback VLAN (Backup VLAN)'}</label>
                    <span className="text-[8px] text-gray-600">Switch backup port assignment</span>
                  </div>
                  <input 
                    type="number"
                    placeholder="10"
                    value={editingRule.defaultVlan || ''}
                    onChange={(e) => handleAddField('defaultVlan', e.target.value)}
                    className={cn(
                      "w-full bg-[#0c0c0e] border rounded px-3 py-2 text-xs font-mono font-bold text-white",
                      validationErrors.defaultVlan ? "border-red-500 bg-red-950/10" : "border-gray-800"
                    )}
                  />
                  {validationErrors.defaultVlan ? (
                    <span className="text-[8.5px] text-red-500 font-semibold block">{validationErrors.defaultVlan}</span>
                  ) : (
                    <span className="text-[8px] text-gray-600 block leading-tight pt-0.5">{isZh ? '當核心交換器未回傳 Role-to-VLAN 對應時之備選 VLAN，選填' : 'Acts as backup VLAN matching if the central RADIUS Role-to-VLAN mapping is down.'}</span>
                  )}
                </div>

              </div>
            </div>

            {/* Save Profile Button */}
            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-900/10"
            >
              <Save size={14} />
              {isZh ? '儲存並編譯策略' : 'Save Connection Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

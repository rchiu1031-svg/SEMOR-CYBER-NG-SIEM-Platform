import React, { useState } from 'react';
import { 
  Settings2, 
  Layers, 
  Clock, 
  FileCode, 
  Plus, 
  Trash2, 
  Check, 
  Smartphone, 
  Monitor, 
  ChevronUp, 
  ChevronDown, 
  History, 
  RotateCcw, 
  Eye, 
  ShieldAlert, 
  Save, 
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Server,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  CaseCustomField, 
  LayoutBlockConfig, 
  SLAPolicyStage, 
  CaseConfigVersion,
  IngestionMapping 
} from './types';

interface CaseStudioAdminViewProps {
  customFields: CaseCustomField[];
  onSaveCustomFields: (fields: CaseCustomField[]) => void;
  layoutBlocks: LayoutBlockConfig[];
  onSaveLayoutBlocks: (blocks: LayoutBlockConfig[]) => void;
  slaStages: SLAPolicyStage[];
  onSaveSlaStages: (stages: SLAPolicyStage[]) => void;
  ingestionMappings: IngestionMapping[];
  onSaveIngestionMappings: (mappings: IngestionMapping[]) => void;
  versions: CaseConfigVersion[];
  onRevertVersion: (versionId: string) => void;
}

export const CaseStudioAdminView: React.FC<CaseStudioAdminViewProps> = ({
  customFields,
  onSaveCustomFields,
  layoutBlocks,
  onSaveLayoutBlocks,
  slaStages,
  onSaveSlaStages,
  ingestionMappings,
  onSaveIngestionMappings,
  versions,
  onRevertVersion
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'layout' | 'sla' | 'forms'>('fields');
  const [previewRole, setPreviewRole] = useState<'l1' | 'l2' | 'manager'>('l1');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet'>('desktop');
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Field editing state
  const [fieldsList, setFieldsList] = useState<CaseCustomField[]>(customFields);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CaseCustomField['type']>('String');

  // SLA editing state
  const [slaList, setSlaList] = useState<SLAPolicyStage[]>(slaStages);

  // Ingestion mappings state
  const [mappingList, setMappingList] = useState<IngestionMapping[]>(ingestionMappings);

  const handleAddField = () => {
    if (!newFieldName.trim() || !newFieldLabel.trim()) return;
    const newField: CaseCustomField = {
      id: `f-${Date.now()}`,
      name: newFieldName.toLowerCase().replace(/\s+/g, '_'),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: false,
      editable: true
    };
    const updated = [...fieldsList, newField];
    setFieldsList(updated);
    onSaveCustomFields(updated);
    setNewFieldName('');
    setNewFieldLabel('');
    showSaveSuccess('已新增自訂資料欄位');
  };

  const handleRemoveField = (id: string) => {
    const updated = fieldsList.filter(f => f.id !== id);
    setFieldsList(updated);
    onSaveCustomFields(updated);
    showSaveSuccess('已移除欄位');
  };

  const handleToggleBlock = (id: string) => {
    const updated = layoutBlocks.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b);
    onSaveLayoutBlocks(updated);
    showSaveSuccess('版面模組配置已更新');
  };

  const showSaveSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  return (
    <div className="space-y-6 relative pb-16">
      {/* Studio Banner & Tabs */}
      <div className="bg-[#111114] border border-gray-800 rounded-3xl p-5 lg:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-purple-400" />
              案件架構設計與 SLA 規則客製中心 (Case Studio)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            自訂案件資料綱要 (Schema)、進線遙測映射、角色視覺排版與 SLA 自動化升級策略
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-black/60 p-1 rounded-2xl border border-gray-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'fields', label: '欄位綱要與進線映射', icon: Database },
            { id: 'layout', label: '分析官排版預覽', icon: Layers },
            { id: 'sla', label: 'SLA 與升級政策', icon: Clock },
            { id: 'forms', label: '雙人核准表單', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {saveSuccessMsg}
        </div>
      )}

      {/* TAB 1: FIELDS & INGESTION */}
      {activeTab === 'fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Custom Fields List */}
          <div className="lg:col-span-2 bg-[#111114] border border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-white">案件自訂擴充欄位 (Case Custom Schema)</h3>
                <p className="text-xs text-gray-400">定義儲存於 TheHive / SIRP 資料庫之案件自訂屬性</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {fieldsList.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-purple-400 font-bold">{f.name}</span>
                    <span className="text-white font-bold">{f.label}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                      {f.type}
                    </span>
                    {f.required && (
                      <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                        必填
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveField(f.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                      title="刪除欄位"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Field Form */}
            <div className="pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="欄位代碼 (如: cve_id)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
              />
              <input
                type="text"
                placeholder="顯示名稱 (如: 關聯 CVE 編號)"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as any)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="String">String (文字)</option>
                <option value="Tag">Tag (標籤)</option>
                <option value="JSON">JSON (物件)</option>
                <option value="Number">Number (數值)</option>
                <option value="Date">Date (日期時間)</option>
              </select>
              <button
                onClick={handleAddField}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                新增欄位
              </button>
            </div>
          </div>

          {/* Ingestion Mappings */}
          <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white">進線來源屬性映射 (Ingestion Pipeline)</h3>
              <p className="text-xs text-gray-400">外部 SIEM/NDR 原始欄位自動轉譯為 SEMOR 格式</p>
            </div>

            <div className="space-y-3">
              {mappingList.map((m) => (
                <div key={m.id} className="p-3 bg-gray-900/70 border border-gray-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold">
                    <span>{m.sourceEngine}</span>
                    <span className="font-mono text-purple-400">{m.transformFunction}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono bg-black/40 p-2 rounded-lg text-white">
                    <span className="text-gray-400">{m.sourceField}</span>
                    <ArrowRight className="w-3 h-3 text-purple-500" />
                    <span className="text-purple-300 font-bold">{m.targetField}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAYOUT DESIGNER */}
      {activeTab === 'layout' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-white">分析官工作台版面卡片配置 (Layout Cards)</h3>
                <p className="text-xs text-gray-400">可自由啟用、停用或調整戰情室中各區塊之可見性</p>
              </div>

              {/* Role & Device Preview Controls */}
              <div className="flex items-center gap-3">
                {/* Role Switcher */}
                <div className="flex bg-black/60 p-1 rounded-xl border border-gray-800 text-xs">
                  <button
                    onClick={() => setPreviewRole('l1')}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold transition-all",
                      previewRole === 'l1' ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    L1 初階
                  </button>
                  <button
                    onClick={() => setPreviewRole('l2')}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold transition-all",
                      previewRole === 'l2' ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    L2 專家
                  </button>
                  <button
                    onClick={() => setPreviewRole('manager')}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold transition-all",
                      previewRole === 'manager' ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    SOC 主管
                  </button>
                </div>

                {/* Device Switcher */}
                <div className="flex bg-black/60 p-1 rounded-xl border border-gray-800 text-xs">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      previewDevice === 'desktop' ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                    title="桌面檢視"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      previewDevice === 'tablet' ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                    title="平板 / 行動檢視"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Layout Block Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {layoutBlocks.map((block) => (
                <div
                  key={block.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    block.enabled 
                      ? "bg-gray-900/70 border-purple-500/40 shadow-lg shadow-purple-600/5" 
                      : "bg-[#141418] border-gray-800 opacity-60"
                  )}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400 block">
                      {block.type}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{block.title}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">尺寸: {block.size}</span>
                  </div>

                  <button
                    onClick={() => handleToggleBlock(block.id)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold border transition-colors",
                      block.enabled
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                    )}
                  >
                    {block.enabled ? '已啟用' : '已停用'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SLA & ESCALATION */}
      {activeTab === 'sla' && (
        <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="pb-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-white">SLA 服務水準協定與自動升級規則 (Escalation Matrix)</h3>
            <p className="text-xs text-gray-400">當事件逾時未處置時，自動觸發 SOAR 劇本重派與高階主管通報</p>
          </div>

          <div className="space-y-3">
            {slaList.map((stage) => (
              <div
                key={stage.id}
                className="p-4 bg-gray-900/70 border border-gray-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{stage.stage}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      限時: {stage.limitDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    自動處置動作: <strong className="text-gray-200">{stage.action}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-gray-500">
                    升級層級: <strong className="text-purple-300">{stage.escalateToRole}</strong>
                  </span>
                  <button
                    onClick={() => showSaveSuccess(`已儲存 ${stage.stage} 之最新 SLA 參數`)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-purple-600 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    設定細節
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACTION FORMS */}
      {activeTab === 'forms' && (
        <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="pb-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-white">高危處置動作表單與雙人核准控制 (Approval Policies)</h3>
            <p className="text-xs text-gray-400">定義主機隔離、IP 阻斷、Token 撤銷時之必填欄位與複核要求</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/70 border border-gray-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                強制網路隔離 (Network Isolation)
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                預設需勾選「已獲資安應變主管授權」，且需輸入至少 10 字之處置原因以利事後合規稽核。
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono">
                ✓ 雙人核准機制 (Four-Eyes) 已啟用
              </div>
            </div>

            <div className="p-4 bg-gray-900/70 border border-gray-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                邊界防火牆全網阻斷 (Perimeter IP Drop)
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                自動比對內部白名單 (DNS、CDN、Gateway)。若發現為已知關鍵服務，強制彈出衝突警告。
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono">
                ✓ 白名單自動防呆檢核已啟用
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Version Control & Audit Bar */}
      <div className={cn(
        "fixed left-0 right-0 bottom-0 bg-[#0c0c0e] border-t border-gray-800 transition-all duration-300 z-40 shadow-2xl",
        isVersionDrawerOpen ? "h-64" : "h-11"
      )}>
        <button
          onClick={() => setIsVersionDrawerOpen(!isVersionDrawerOpen)}
          className="w-full h-11 flex items-center justify-center gap-2 hover:bg-white/5 transition-all group"
        >
          {isVersionDrawerOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
          )}
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-white">
            設計版本控制與歷史審計紀錄 (Audit History &amp; Revert)
          </span>
        </button>

        {isVersionDrawerOpen && (
          <div className="p-6 overflow-y-auto h-52 custom-scrollbar bg-black/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="p-4 bg-[#141418] border border-gray-800 rounded-2xl flex flex-col justify-between space-y-2 hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-black text-white">{v.id}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border",
                      v.status === 'Active' 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                        : "bg-gray-800 text-gray-400 border-gray-700"
                    )}>
                      {v.status === 'Active' ? '當前設定 (LIVE)' : '歷史版本'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {v.note}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-[11px] text-gray-500">
                    <span>{v.author} • {v.date}</span>
                    {v.status === 'Historical' && (
                      <button
                        onClick={() => {
                          onRevertVersion(v.id);
                          showSaveSuccess(`已還原至設定版本 ${v.id}`);
                        }}
                        className="text-purple-400 hover:text-white font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        版本還原
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

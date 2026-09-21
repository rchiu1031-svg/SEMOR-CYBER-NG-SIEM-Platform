import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  Binary, 
  ExternalLink, 
  Copy, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Tag,
  Code,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ExtractedField, FieldType, DecoderItem } from './types';
import { FIELD_TYPE_COLORS, COMMON_ECS_MAPPINGS } from './decoderData';

interface NormalizedFieldsManagerProps {
  analyzedFields: ExtractedField[];
  onUpdateField: (id: string, updates: Partial<ExtractedField>) => void;
  onRemoveField: (id: string) => void;
  onAddField: (field: ExtractedField) => void;
  onSaveDecoder: (meta: { name: string; brand: string; version: string; description: string }) => void;
  onDeployToRust?: () => void;
  isDeployingToRust?: boolean;
  isReadOnly?: boolean;
  sampleLog: string;
}

export const NormalizedFieldsManager: React.FC<NormalizedFieldsManagerProps> = ({
  analyzedFields,
  onUpdateField,
  onRemoveField,
  onAddField,
  onSaveDecoder,
  onDeployToRust,
  isDeployingToRust = false,
  isReadOnly = false,
  sampleLog
}) => {
  const [saveName, setSaveName] = useState('');
  const [saveBrand, setSaveBrand] = useState('自訂 (Custom)');
  const [saveVersion, setSaveVersion] = useState('v1.0');
  const [saveDescription, setSaveDescription] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);

  const handleManualAddField = () => {
    const newField: ExtractedField = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `field_${analyzedFields.length + 1}`,
      value: '範例字串',
      regex: '.*',
      type: 'string',
      ecsMapping: 'rule.name',
      confidence: 100,
      description: '手動新增之正規化欄位'
    };
    onAddField(newField);
  };

  const handleCopyFieldsJson = () => {
    navigator.clipboard.writeText(JSON.stringify(analyzedFields, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight">
                正規化欄位映射與規則庫
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {analyzedFields.length} 個結構化欄位
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              檢視、微調正規表達式、映射 ECS/OCSF 標準安全綱要，並保存至 SIEM 規則庫。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyFieldsJson}
            className="px-3.5 py-1.5 bg-gray-900/90 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {copiedJson ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedJson ? '已複製 JSON' : '複製欄位 JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleManualAddField}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>手動新增欄位</span>
          </button>
        </div>
      </div>

      {/* Save Decoder Meta Form */}
      <div className="p-5 bg-black/40 border border-cyan-500/20 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest">
            <Save size={14} />
            <span>儲存為全新解碼器 (Save as Custom Decoder)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              解碼器名稱 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="例如：Corp-PaloAlto-Threat-Parser"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              設備廠牌 / 分類
            </label>
            <input
              type="text"
              value={saveBrand}
              onChange={(e) => setSaveBrand(e.target.value)}
              placeholder="例如：Fortinet / Cisco / Windows"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              韌體 / 規則版本
            </label>
            <input
              type="text"
              value={saveVersion}
              onChange={(e) => setSaveVersion(e.target.value)}
              placeholder="例如：v2.1.0"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            規則用途 / 日誌規格描述
          </label>
          <input
            type="text"
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            placeholder="例如：解析核心資料庫邊界阻擋與暴力登入審計日誌"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1 flex-wrap">
          {onDeployToRust && (
            <button
              type="button"
              onClick={onDeployToRust}
              disabled={isReadOnly || isDeployingToRust || analyzedFields.length === 0}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="透過 Unix Domain Socket (/tmp/semor_rust.sock) 將當前 Regex 標註規則即時下發至 Rust 儲存核心"
            >
              <Send size={14} className={isDeployingToRust ? "animate-spin" : ""} />
              <span>{isDeployingToRust ? '下發中...' : '即時下發至 Rust 核心 (UDS Deploy)'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (analyzedFields.length === 0) return;
              onSaveDecoder({
                name: saveName.trim() || `自訂解碼器 #${Date.now().toString().substring(8)}`,
                brand: saveBrand.trim() || '自訂 (Custom)',
                version: saveVersion.trim() || 'v1.0',
                description: saveDescription.trim() || '自訂正規化解碼規則'
              });
              setSaveName('');
              setSaveDescription('');
            }}
            disabled={isReadOnly || analyzedFields.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>儲存至解碼器資料庫 (Save & Register)</span>
          </button>
        </div>
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <span>已擷取之正規化欄位清單 ({analyzedFields.length})</span>
          <span className="text-gray-500">提示：Regex 匹配結果即時驗證</span>
        </div>

        {analyzedFields.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl text-gray-500 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-gray-600 mb-2" />
            <p className="text-xs font-bold">尚未擷取任何欄位</p>
            <p className="text-[11px] text-gray-600">
              請在上方「日誌畫布」中點擊詞彙，或劃選文字片段，即可自動生成正規化欄位。
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {analyzedFields.map((field) => {
              const colorInfo = FIELD_TYPE_COLORS[field.type] || FIELD_TYPE_COLORS.string;
              
              // Validate regex against sample log
              let isMatch = false;
              let matchValue = '(未匹配)';
              try {
                const re = new RegExp(field.regex);
                const m = sampleLog.match(re);
                if (m) {
                  isMatch = true;
                  matchValue = m[1] !== undefined ? m[1] : m[0];
                }
              } catch {
                matchValue = '(Regex 語法無效)';
              }

              return (
                <div
                  key={field.id}
                  className="p-4 bg-black/40 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all space-y-3 group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border", colorInfo.badge)}>
                        {field.type}
                      </span>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => onUpdateField(field.id, { name: e.target.value })}
                        placeholder="欄位鍵名"
                        className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1 text-xs font-black text-cyan-300 outline-none focus:border-cyan-500 transition-colors w-40 font-mono"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => onUpdateField(field.id, { type: e.target.value as FieldType })}
                        className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] font-bold text-gray-300 outline-none"
                      >
                        <option value="string">文字 (String)</option>
                        <option value="ip">IP 位址 (IP)</option>
                        <option value="port">通訊埠 (Port)</option>
                        <option value="action">處置動作 (Action)</option>
                        <option value="timestamp">時間戳記 (Time)</option>
                        <option value="number">數值 (Number)</option>
                        <option value="email">電子郵件 (Email)</option>
                        <option value="url">URL 路徑 (URL)</option>
                        <option value="hash">雜湊值 (Hash)</option>
                      </select>

                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">ECS:</span>
                        <select
                          value={field.ecsMapping || ''}
                          onChange={(e) => onUpdateField(field.id, { ecsMapping: e.target.value })}
                          className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] font-mono text-cyan-400 outline-none max-w-[140px]"
                        >
                          <option value="">(未映射)</option>
                          {COMMON_ECS_MAPPINGS.map(m => (
                            <option key={m.ecs} value={m.ecs}>{m.ecs}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border",
                        isMatch
                          ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-950/30 text-amber-400 border-amber-500/30"
                      )}>
                        {isMatch ? <Check size={10} /> : <AlertCircle size={10} />}
                        <span className="truncate max-w-[120px]" title={matchValue}>
                          {isMatch ? `擷取: ${matchValue}` : '未匹配'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveField(field.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="移除此欄位"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Regex Expression Editor */}
                  <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5">
                    <Binary size={12} className="text-gray-500 shrink-0" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest shrink-0">
                      Regex Pattern:
                    </span>
                    <input
                      type="text"
                      value={field.regex}
                      onChange={(e) => onUpdateField(field.id, { regex: e.target.value })}
                      className="w-full bg-transparent text-[11px] font-mono text-gray-300 outline-none focus:text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

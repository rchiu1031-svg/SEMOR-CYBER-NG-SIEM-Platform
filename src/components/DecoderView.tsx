import React, { useState, useMemo, useEffect } from 'react';
import { 
  Binary, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';
import { 
  ExtractedField, 
  DecoderItem, 
  LogFilterCondition, 
  FieldType 
} from './decoders/types';
import { 
  PREDEFINED_DECODERS, 
  COMMON_ECS_MAPPINGS,
  detectTokenTypeAndMetadata 
} from './decoders/decoderData';
import { DecoderHeader } from './decoders/DecoderHeader';
import { InteractiveLogInspector } from './decoders/InteractiveLogInspector';
import { NormalizedFieldsManager } from './decoders/NormalizedFieldsManager';
import { DecoderLibraryList } from './decoders/DecoderLibraryList';
import { DecoderBenchmarkModal } from './decoders/DecoderBenchmarkModal';

export default function DecoderView({ isReadOnly = false }: { isReadOnly?: boolean }) {
  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'workspace' | 'library' | 'benchmark'>('workspace');

  // Active loaded decoder name
  const [activeDecoderName, setActiveDecoderName] = useState<string>('FortiGate 次世代防火牆日誌');

  // Input log string
  const [logInput, setLogInput] = useState<string>(() => {
    return PREDEFINED_DECODERS[0]?.sampleLog || '';
  });

  // Extracted fields
  const [analyzedFields, setAnalyzedFields] = useState<ExtractedField[]>(() => {
    return PREDEFINED_DECODERS[0]?.fields || [];
  });

  // Active filter conditions
  const [filterConditions, setFilterConditions] = useState<LogFilterCondition[]>([
    { id: 'f-init-1', field: 'action', operator: 'equals', value: 'deny', active: true },
    { id: 'f-init-2', field: 'dstport', operator: 'equals', value: '443', active: true }
  ]);

  // AI & Parsing State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDeployingToRust, setIsDeployingToRust] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Custom Decoders stored in LocalStorage
  const [customDecoders, setCustomDecoders] = useState<DecoderItem[]>(() => {
    try {
      const saved = localStorage.getItem('custom_decoders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Combined Decoders
  const allDecoders = useMemo(() => {
    return [...customDecoders, ...PREDEFINED_DECODERS];
  }, [customDecoders]);

  // Offline intelligent rule-based parser fallback
  const parseLogOffline = (rawLog: string): ExtractedField[] => {
    const fields: ExtractedField[] = [];
    const trimmed = rawLog.trim();

    // 1. JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        const flatten = (data: any, prefix = '') => {
          for (const key in data) {
            const val = data[key];
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
              flatten(val, fullKey);
            } else {
              const strVal = String(val);
              const meta = detectTokenTypeAndMetadata(strVal, trimmed);
              fields.push({
                id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: fullKey,
                value: strVal,
                regex: `"${fullKey.split('.').pop()}"\\s*:\\s*"?([^",}]+)"?`,
                type: meta.type,
                ecsMapping: meta.suggestedEcs,
                confidence: 99
              });
            }
          }
        };
        flatten(obj);
        if (fields.length > 0) return fields;
      } catch {}
    }

    // 2. Key-Value pairs
    const kvRegex = /([a-zA-Z0-9_.-]+)=("([^"]*)"|'([^']*)'|([^ \t\r\n,]+))/g;
    let match;
    const seenKeys = new Set<string>();
    while ((match = kvRegex.exec(rawLog)) !== null) {
      const k = match[1];
      const v = match[3] ?? match[4] ?? match[5] ?? '';
      if (!seenKeys.has(k)) {
        seenKeys.add(k);
        const meta = detectTokenTypeAndMetadata(v, rawLog);
        fields.push({
          id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: k,
          value: v,
          regex: `${k}="?([^"\\s,]+)"?`,
          type: meta.type,
          ecsMapping: meta.suggestedEcs,
          confidence: 96
        });
      }
    }

    // 3. Syslog fallback tokens
    if (fields.length === 0) {
      const ipMatches = rawLog.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
      if (ipMatches) {
        ipMatches.forEach((ip, idx) => {
          fields.push({
            id: `f-${Date.now()}-ip-${idx}`,
            name: idx === 0 ? 'src_ip' : idx === 1 ? 'dst_ip' : `ip_${idx + 1}`,
            value: ip,
            regex: `\\b${ip.replace(/\./g, '\\.')}\\b`,
            type: 'ip',
            ecsMapping: idx === 0 ? 'source.ip' : 'destination.ip',
            confidence: 95
          });
        });
      }

      const actionMatch = rawLog.match(/\b(allow|deny|drop|accept|block|reject|failed|success|pass)\b/i);
      if (actionMatch) {
        fields.push({
          id: `f-${Date.now()}-act`,
          name: 'event_action',
          value: actionMatch[1],
          regex: `\\b(${actionMatch[1]})\\b`,
          type: 'action',
          ecsMapping: 'event.action',
          confidence: 98
        });
      }
    }

    return fields;
  };

  // AI Analysis Action
  const handleRunAiAnalyze = async () => {
    if (!logInput.trim()) {
      showToast('請先貼上或載入日誌內容', 'info');
      return;
    }

    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
      
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `分析下列資安/系統日誌並識別其資料結構。
提取所有可能的欄位名稱、該樣本中的數值，並產生一組精確的正規表達式 (Regex Pattern) 用以擷取相同格式日誌的對應欄位，並對應 Elastic Common Schema (ECS)。
請嚴格僅回傳 JSON 陣列，格式如下：
[{"id": "自動產生", "name": "欄位名稱", "value": "數值", "regex": "正規表達式", "type": "string|ip|port|timestamp|number|action", "ecsMapping": "source.ip等"}]

原始日誌內容：
${logInput.trim()}`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          const resultText = response.text || '';
          const result = JSON.parse(resultText);
          if (Array.isArray(result) && result.length > 0) {
            const formatted = result.map((r, i) => ({
              id: r.id || `f-ai-${Date.now()}-${i}`,
              name: r.name || `field_${i + 1}`,
              value: r.value || '',
              regex: r.regex || '.*',
              type: (r.type as FieldType) || 'string',
              ecsMapping: r.ecsMapping || 'rule.name',
              confidence: 99
            }));
            setAnalyzedFields(formatted);
            showToast(`AI 智能深度結構分析完成，已擷取 ${formatted.length} 個標準化欄位！`, 'success');
            setIsAnalyzing(false);
            return;
          }
        } catch (aiErr) {
          console.warn('AI 服務調用降級至離線規則引擎：', aiErr);
        }
      }

      // Offline Parser Fallback
      const offlineResult = parseLogOffline(logInput);
      if (offlineResult.length > 0) {
        setAnalyzedFields(offlineResult);
        showToast(`本機引擎解析完成，自動辨識出 ${offlineResult.length} 個結構欄位！`, 'success');
      } else {
        showToast('無法自動識別此日誌結構，請於日誌畫布直接點選文字進行標註', 'error');
      }
    } catch (err: any) {
      showToast(`分析發生異常：${err.message || err}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Field Manipulation Handlers
  const handleAddField = (newField: ExtractedField) => {
    setAnalyzedFields(prev => {
      // If already exists with same name, update it
      const exists = prev.some(f => f.name === newField.name);
      if (exists) {
        return prev.map(f => f.name === newField.name ? newField : f);
      }
      return [...prev, newField];
    });
    showToast(`已新增正規化欄位「${newField.name}」`, 'success');
  };

  const handleUpdateField = (id: string, updates: Partial<ExtractedField>) => {
    setAnalyzedFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleRemoveField = (id: string) => {
    setAnalyzedFields(prev => prev.filter(f => f.id !== id));
    showToast('已移除該欄位', 'info');
  };

  // Filter Manipulation Handlers
  const handleAddFilter = (newFilter: LogFilterCondition) => {
    setFilterConditions(prev => [...prev, newFilter]);
    showToast(`已新增即時過濾條件：${newFilter.field} ${newFilter.operator} "${newFilter.value}"`, 'success');
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilterConditions(prev => prev.filter(f => f.id !== filterId));
  };

  const handleToggleFilter = (filterId: string) => {
    setFilterConditions(prev => prev.map(f => f.id === filterId ? { ...f, active: !f.active } : f));
  };

  const handleClearFilters = () => {
    setFilterConditions([]);
    showToast('已清空所有過濾條件', 'info');
  };

  // Save Decoder to LocalStorage
  const handleSaveDecoder = (meta: { name: string; brand: string; version: string; description: string }) => {
    const newDec: DecoderItem = {
      id: `custom-${Date.now()}`,
      name: meta.name,
      brand: meta.brand,
      category: 'custom',
      version: meta.version,
      description: meta.description,
      iconType: 'terminal-cyan',
      isCustom: true,
      fields: analyzedFields,
      sampleLog: logInput.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      avgParseMicros: 3.5,
      tags: ['Custom', 'User-Created']
    };

    const updated = [newDec, ...customDecoders];
    setCustomDecoders(updated);
    localStorage.setItem('custom_decoders', JSON.stringify(updated));

    // Sync field names to discovery_custom_fields for SIEM global search
    try {
      const savedFields = JSON.parse(localStorage.getItem('discovery_custom_fields') || '[]');
      const newFields = [...new Set([...savedFields, ...analyzedFields.map(f => f.name)])];
      localStorage.setItem('discovery_custom_fields', JSON.stringify(newFields));
    } catch (e) {
      console.error(e);
    }

    showToast(`自訂解碼器「${meta.name}」已儲存至規則庫！`, 'success');
    setActiveDecoderName(meta.name);
  };

  // Delete Custom Decoder
  const handleDeleteCustomDecoder = (id: string) => {
    if (isReadOnly) return;
    const updated = customDecoders.filter(d => d.id !== id);
    setCustomDecoders(updated);
    localStorage.setItem('custom_decoders', JSON.stringify(updated));
    showToast('已刪除該自訂解碼器', 'info');
  };

  // Load Decoder from Library to Workspace
  const handleSelectDecoderToLoad = (decoder: DecoderItem) => {
    setActiveDecoderName(decoder.name);
    if (decoder.sampleLog) setLogInput(decoder.sampleLog);
    setAnalyzedFields(decoder.fields);
    setCurrentTab('workspace');
    showToast(`已載入「${decoder.name}」至互動工作區`, 'info');
  };

  // Export All Decoders as JSON
  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allDecoders, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `SEMOR_Decoders_Ruleset_${new Date().toISOString().substring(0, 10)}.json`);
    dlAnchor.click();
    showToast('已匯出完整解碼器規則庫 JSON', 'success');
  };

  // Reset Workspace
  const handleResetWorkspace = () => {
    setLogInput('');
    setAnalyzedFields([]);
    setFilterConditions([]);
    showToast('已重設工作區', 'info');
  };

  // Deploy Extracted Regex Rules down to Rust Storage Core over Unix Domain Socket
  const handleDeployToRustPipeline = async () => {
    if (analyzedFields.length === 0) {
      showToast('目前沒有可下發之正則欄位規則', 'error');
      return;
    }
    try {
      setIsDeployingToRust(true);
      const res = await fetch('/api/engine/decoders/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decoderId: `dec-${activeDecoderName.replace(/\s+/g, '-').toLowerCase()}`,
          decoderName: activeDecoderName,
          rules: analyzedFields
        })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`已透過 UDS (${data.ipcBridge?.socketPath || '/tmp/semor_rust.sock'}) 成功下發 ${data.rulesCount} 組 Regex 規則至 Rust 儲存核心！`, 'success');
      } else {
        showToast('下發規則至 Rust 引擎失敗', 'error');
      }
    } catch (e: any) {
      showToast(`下發錯誤: ${e.message}`, 'error');
    } finally {
      setIsDeployingToRust(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1750px] mx-auto min-h-screen text-gray-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-8 right-8 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 border backdrop-blur-md",
              toastMessage.type === 'success' ? "bg-emerald-600/90 text-white border-emerald-400/30" :
              toastMessage.type === 'error' ? "bg-red-600/90 text-white border-red-400/30" :
              "bg-cyan-600/90 text-white border-cyan-400/30"
            )}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header & KPI Bar */}
      <DecoderHeader
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        allDecoders={allDecoders}
        customDecodersCount={customDecoders.length}
        activeFilterCount={filterConditions.filter(f => f.active).length}
        extractedFieldCount={analyzedFields.length}
        onExportAll={handleExportAll}
        onResetWorkspace={handleResetWorkspace}
      />

      {/* Tab Router Content */}
      {currentTab === 'workspace' && (
        <div className="space-y-6">
          {/* Top: Interactive Log Inspector with Click-to-extract & Filter */}
          <InteractiveLogInspector
            logInput={logInput}
            onChangeLogInput={setLogInput}
            analyzedFields={analyzedFields}
            onAddField={handleAddField}
            onRemoveField={handleRemoveField}
            filterConditions={filterConditions}
            onAddFilter={handleAddFilter}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            onToggleFilter={handleToggleFilter}
            isAnalyzing={isAnalyzing}
            onRunAiAnalyze={handleRunAiAnalyze}
          />

          {/* Bottom: Normalized Fields Editor & Save Decoder Form */}
          <NormalizedFieldsManager
            analyzedFields={analyzedFields}
            onUpdateField={handleUpdateField}
            onRemoveField={handleRemoveField}
            onAddField={handleAddField}
            onSaveDecoder={handleSaveDecoder}
            onDeployToRust={handleDeployToRustPipeline}
            isDeployingToRust={isDeployingToRust}
            isReadOnly={isReadOnly}
            sampleLog={logInput}
          />
        </div>
      )}

      {currentTab === 'library' && (
        <DecoderLibraryList
          decoders={allDecoders}
          onSelectDecoderToLoad={handleSelectDecoderToLoad}
          onDeleteCustomDecoder={handleDeleteCustomDecoder}
          isReadOnly={isReadOnly}
        />
      )}

      {currentTab === 'benchmark' && (
        <DecoderBenchmarkModal
          currentDecoderName={activeDecoderName}
          fields={analyzedFields}
          sampleLog={logInput}
        />
      )}
    </div>
  );
}

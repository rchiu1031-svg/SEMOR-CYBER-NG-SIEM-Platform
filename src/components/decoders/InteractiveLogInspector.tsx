import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Binary, 
  Sparkles, 
  Filter, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  Eye, 
  Maximize2, 
  RefreshCw, 
  ChevronRight, 
  Globe, 
  Shield, 
  Layers, 
  Tag, 
  X,
  Search,
  ExternalLink,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { 
  ExtractedField, 
  FieldType, 
  LogFilterCondition, 
  LogFilterOperator,
  LogSelectionContext 
} from './types';
import { 
  FIELD_TYPE_COLORS, 
  COMMON_ECS_MAPPINGS, 
  PREDEFINED_DECODERS, 
  detectTokenTypeAndMetadata 
} from './decoderData';

interface InteractiveLogInspectorProps {
  logInput: string;
  onChangeLogInput: (val: string) => void;
  analyzedFields: ExtractedField[];
  onAddField: (field: ExtractedField) => void;
  onRemoveField: (fieldId: string) => void;
  filterConditions: LogFilterCondition[];
  onAddFilter: (filter: LogFilterCondition) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearFilters: () => void;
  onToggleFilter: (filterId: string) => void;
  isAnalyzing: boolean;
  onRunAiAnalyze: () => void;
}

export const InteractiveLogInspector: React.FC<InteractiveLogInspectorProps> = ({
  logInput,
  onChangeLogInput,
  analyzedFields,
  onAddField,
  onRemoveField,
  filterConditions,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onToggleFilter,
  isAnalyzing,
  onRunAiAnalyze
}) => {
  // Popover State for text click/selection
  const [popoverState, setPopoverState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    selectedText: string;
    detectedType: FieldType;
    suggestedName: string;
    suggestedRegex: string;
    suggestedEcs: string;
    activeTab: 'normalize' | 'filter';
    filterOperator: LogFilterOperator;
  } | null>(null);

  const [copiedText, setCopiedText] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const logDisplayRef = useRef<HTMLDivElement>(null);

  // Split log lines
  const lines = useMemo(() => {
    if (!logInput) return [];
    return logInput.split('\n');
  }, [logInput]);

  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const currentLine = lines[activeLineIndex] || lines[0] || '';

  // Evaluate whether the current log matches active filter conditions
  const filterEvaluation = useMemo(() => {
    if (filterConditions.length === 0) return { matches: true, reason: '未啟用任何過濾條件' };

    const activeFilters = filterConditions.filter(f => f.active);
    if (activeFilters.length === 0) return { matches: true, reason: '所有過濾條件已停用' };

    for (const fc of activeFilters) {
      const targetVal = fc.value.toLowerCase();
      const lineLower = currentLine.toLowerCase();

      switch (fc.operator) {
        case 'equals':
        case 'contains':
          if (!lineLower.includes(targetVal)) {
            return { matches: false, reason: `未包含「${fc.value}」` };
          }
          break;
        case 'not_equals':
        case 'not_contains':
          if (lineLower.includes(targetVal)) {
            return { matches: false, reason: `命中了排除條件「${fc.value}」` };
          }
          break;
        case 'starts_with':
          if (!lineLower.startsWith(targetVal)) {
            return { matches: false, reason: `開頭非「${fc.value}」` };
          }
          break;
        case 'regex':
          try {
            const re = new RegExp(fc.value, 'i');
            if (!re.test(currentLine)) {
              return { matches: false, reason: `正規表達式未匹配「${fc.value}」` };
            }
          } catch {
            return { matches: false, reason: '正規表達式語法無效' };
          }
          break;
      }
    }

    return { matches: true, reason: `符合全數 ${activeFilters.length} 項過濾規則` };
  }, [currentLine, filterConditions]);

  // Handle Token Click
  const handleTokenClick = (e: React.MouseEvent, tokenText: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };

    const { type, suggestedName, suggestedRegex, suggestedEcs } = detectTokenTypeAndMetadata(tokenText, currentLine);

    setPopoverState({
      isOpen: true,
      x: rect.left - containerRect.left + (rect.width / 2),
      y: rect.top - containerRect.top - 8,
      selectedText: tokenText,
      detectedType: type,
      suggestedName,
      suggestedRegex,
      suggestedEcs,
      activeTab: 'normalize',
      filterOperator: 'equals'
    });
  };

  // Handle Mouse Selection (Drag-to-select arbitrary text snippet)
  const handleMouseUpTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedStr = selection.toString().trim();
    if (!selectedStr || selectedStr.length > 200) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };

    const { type, suggestedName, suggestedRegex, suggestedEcs } = detectTokenTypeAndMetadata(selectedStr, currentLine);

    setPopoverState({
      isOpen: true,
      x: rect.left - containerRect.left + (rect.width / 2),
      y: rect.top - containerRect.top - 8,
      selectedText: selectedStr,
      detectedType: type,
      suggestedName,
      suggestedRegex,
      suggestedEcs,
      activeTab: 'normalize',
      filterOperator: 'equals'
    });
  };

  // Confirm Field Extraction
  const handleConfirmExtraction = () => {
    if (!popoverState) return;

    const newField: ExtractedField = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: popoverState.suggestedName.trim() || `field_${analyzedFields.length + 1}`,
      value: popoverState.selectedText,
      regex: popoverState.suggestedRegex || `(${popoverState.selectedText})`,
      type: popoverState.detectedType,
      ecsMapping: popoverState.suggestedEcs,
      confidence: 98,
      description: `從日誌文字點選正規化擷取: ${popoverState.selectedText}`
    };

    onAddField(newField);
    setPopoverState(null);
  };

  // Confirm Filter Condition
  const handleConfirmFilter = () => {
    if (!popoverState) return;

    const newFilter: LogFilterCondition = {
      id: `flt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      field: popoverState.suggestedName || 'raw_token',
      operator: popoverState.filterOperator,
      value: popoverState.selectedText,
      active: true,
      highlightColor: FIELD_TYPE_COLORS[popoverState.detectedType]?.text || 'text-cyan-400'
    };

    onAddFilter(newFilter);
    setPopoverState(null);
  };

  // Copy token
  const handleCopyValue = () => {
    if (!popoverState) return;
    navigator.clipboard.writeText(popoverState.selectedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Render tokens for the current line
  const renderedTokens = useMemo(() => {
    if (!currentLine) return null;

    // Tokenize by space and common delimiters while preserving delimiters
    const rawTokens = currentLine.split(/(\s+|[,;:="\'()[\]{}])/g).filter(Boolean);

    return rawTokens.map((token, idx) => {
      const isWhitespace = /^\s+$/.test(token);
      if (isWhitespace) {
        return <span key={idx}>{token}</span>;
      }

      // Check if this token matches any extracted field
      const matchedField = analyzedFields.find(f => f.value === token || (f.value && token.includes(f.value)));

      // Check if this token matches active filters
      const matchedFilter = filterConditions.find(fc => fc.active && fc.value === token);

      const typeMeta = detectTokenTypeAndMetadata(token, currentLine);
      const colorScheme = matchedField 
        ? FIELD_TYPE_COLORS[matchedField.type] 
        : FIELD_TYPE_COLORS[typeMeta.type];

      return (
        <span
          key={idx}
          onClick={(e) => handleTokenClick(e, token)}
          title={`點選轉換為欄位或過濾器 (${matchedField ? `已正規化: ${matchedField.name}` : typeMeta.type})`}
          className={cn(
            "relative inline-block cursor-pointer px-1 py-0.5 rounded transition-all select-text font-mono text-[11px]",
            matchedField
              ? cn(colorScheme.bg, colorScheme.text, "border", colorScheme.border, "font-bold shadow-sm")
              : matchedFilter
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
              : "hover:bg-cyan-500/20 hover:text-cyan-200 text-gray-200"
          )}
        >
          {token}
          {matchedField && (
            <span className="absolute -top-3.5 left-0 px-1 py-0 text-[8px] font-black rounded bg-black/90 border border-cyan-500/40 text-cyan-300 pointer-events-none uppercase scale-90 origin-bottom-left shadow">
              {matchedField.name}
            </span>
          )}
        </span>
      );
    });
  }, [currentLine, analyzedFields, filterConditions]);

  return (
    <div ref={containerRef} className="relative space-y-5">
      {/* Top Banner & Quick Presets */}
      <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20 text-cyan-400 shadow-inner">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  互動式日誌解碼與欄位標註工作區
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Click-to-Extract & Filter
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                輸入或貼上日誌後，直接「滑鼠點選字詞」或「劃選片段」，立即轉化為結構化欄位或過濾條件。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRunAiAnalyze}
              disabled={isAnalyzing || !logInput.trim()}
              className={cn(
                "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer",
                (isAnalyzing || !logInput.trim()) && "opacity-50 cursor-not-allowed hover:bg-cyan-600 shadow-none"
              )}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                  <span>AI 智能深度結構分析中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>AI 全域結構自動偵測</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2 flex-wrap mb-4 pt-1">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <Tag size={12} /> 快速載入主流資安日誌樣本：
          </span>
          {PREDEFINED_DECODERS.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                if (d.sampleLog) {
                  onChangeLogInput(d.sampleLog);
                  setActiveLineIndex(0);
                }
              }}
              className="px-2.5 py-1 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-lg text-[11px] font-medium text-gray-400 hover:text-cyan-300 transition-all cursor-pointer"
            >
              {d.brand} - {d.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Raw Log Input Textarea */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={logInput}
              onChange={(e) => {
                onChangeLogInput(e.target.value);
                setActiveLineIndex(0);
              }}
              placeholder="在此貼上原始日誌字串 (支援多行日誌、Syslog、CEF、JSON、WAF、防火牆與 EDR 警報事件)..."
              className="w-full h-32 bg-black/50 border border-gray-800 rounded-2xl p-4 text-xs font-mono text-gray-200 focus:border-cyan-500 outline-none transition-all resize-none shadow-inner custom-scrollbar leading-relaxed"
            />
            {logInput && (
              <button
                type="button"
                onClick={() => onChangeLogInput('')}
                className="absolute top-3 right-3 p-1.5 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="清空日誌輸入"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-500">
                日誌行數：<strong className="text-white">{lines.length}</strong> 行
              </span>
              {lines.length > 1 && (
                <div className="flex items-center gap-1.5 ml-3">
                  <span className="text-gray-500 text-[11px]">選擇檢視行：</span>
                  <select
                    value={activeLineIndex}
                    onChange={(e) => setActiveLineIndex(Number(e.target.value))}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-0.5 text-xs text-cyan-300 outline-none"
                  >
                    {lines.map((_, i) => (
                      <option key={i} value={i}>Line #{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>可直接在下方「互動畫布」點擊任何詞或滑鼠劃選</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider mr-2">
            <Filter size={14} className="text-cyan-400" />
            <span>即時日誌過濾條件 ({filterConditions.filter(f => f.active).length}):</span>
          </div>

          {filterConditions.length === 0 ? (
            <span className="text-xs text-gray-500 italic">
              尚未設定過濾條件 (可在下方日誌文字點擊「加入過濾」)
            </span>
          ) : (
            filterConditions.map(fc => (
              <div
                key={fc.id}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all",
                  fc.active
                    ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200"
                    : "bg-gray-900 border-gray-800 text-gray-500 line-through opacity-60"
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleFilter(fc.id)}
                  className="hover:text-white"
                  title="切換啟用/停用"
                >
                  <span className="text-gray-400">{fc.field}</span>
                  <span className="text-amber-400 mx-1">{fc.operator}</span>
                  <span className="text-cyan-300">"{fc.value}"</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveFilter(fc.id)}
                  className="text-gray-500 hover:text-red-400 ml-1"
                  title="刪除條件"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border",
            filterEvaluation.matches
              ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30"
              : "bg-rose-950/30 text-rose-400 border-rose-500/30"
          )}>
            {filterEvaluation.matches ? <Check size={13} /> : <AlertCircle size={13} />}
            <span>{filterEvaluation.matches ? '日誌匹配成功' : '日誌已排除'}</span>
          </div>

          {filterConditions.length > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] text-gray-500 hover:text-red-400 underline cursor-pointer"
            >
              清除全數
            </button>
          )}
        </div>
      </div>

      {/* Interactive Log Display Canvas (Click-to-extract & Drag-to-select) */}
      <div className="bg-[#0b0c10] border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 relative">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="text-xs font-black text-gray-400 ml-2 tracking-wide font-mono">
              LOG INTERACTIVE INSPECTOR CANVAS #{activeLineIndex + 1}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/20 border border-cyan-500/40"></span>
              已標註欄位: <strong className="text-cyan-300 ml-0.5">{analyzedFields.length}</strong>
            </span>
          </div>
        </div>

        {/* The Interactive Log Text Box */}
        <div
          ref={logDisplayRef}
          onMouseUp={handleMouseUpTextSelection}
          className="p-5 bg-black/70 rounded-2xl border border-gray-800 font-mono text-xs leading-loose tracking-wide overflow-x-auto custom-scrollbar select-text min-h-[120px]"
        >
          {currentLine ? (
            <div className="space-x-1 whitespace-pre-wrap">
              {renderedTokens}
            </div>
          ) : (
            <div className="text-gray-600 text-center py-8">
              尚未輸入任何日誌，請貼上字串或點擊上方預設範本開始
            </div>
          )}
        </div>

        {/* Bottom Legend of Field Types */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400 border-t border-gray-800/80">
          <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
            型態顏色指南：
          </span>
          {Object.entries(FIELD_TYPE_COLORS).slice(0, 7).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", colors.bg, colors.border, "border")}></span>
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Popover (Triggered by click or selection) */}
      <AnimatePresence>
        {popoverState && (
          <div
            className="fixed inset-0 z-50 pointer-events-auto"
            onClick={() => setPopoverState(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: Math.max(100, Math.min(window.innerHeight - 380, popoverState.y + 120)),
                left: Math.max(20, Math.min(window.innerWidth - 380, popoverState.x + 20)),
              }}
              className="w-[360px] bg-[#14151b] border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/60 p-4 space-y-4 backdrop-blur-xl z-50 text-gray-200"
            >
              {/* Header with Selected Value Preview */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                    已選取日誌文字片段
                  </span>
                  <div className="font-mono text-xs font-bold text-white bg-black/60 px-2 py-1 rounded border border-gray-800 max-w-[280px] truncate" title={popoverState.selectedText}>
                    {popoverState.selectedText}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPopoverState(null)}
                  className="p-1 text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Mode Tabs: Normalize as Field vs Add as Filter */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl border border-gray-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPopoverState(prev => prev ? { ...prev, activeTab: 'normalize' } : null)}
                  className={cn(
                    "py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    popoverState.activeTab === 'normalize'
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Layers size={13} />
                  <span>正規化為欄位</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPopoverState(prev => prev ? { ...prev, activeTab: 'filter' } : null)}
                  className={cn(
                    "py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    popoverState.activeTab === 'filter'
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Filter size={13} />
                  <span>加入即時過濾</span>
                </button>
              </div>

              {/* Tab 1: Normalize as Field */}
              {popoverState.activeTab === 'normalize' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      欄位名稱 (Field Key Name)
                    </label>
                    <input
                      type="text"
                      value={popoverState.suggestedName}
                      onChange={(e) => setPopoverState(prev => prev ? { ...prev, suggestedName: e.target.value } : null)}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        資料型態 (Type)
                      </label>
                      <select
                        value={popoverState.detectedType}
                        onChange={(e) => setPopoverState(prev => prev ? { ...prev, detectedType: e.target.value as FieldType } : null)}
                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="string">文字 (String)</option>
                        <option value="ip">IP 位址 (IP)</option>
                        <option value="port">通訊埠 (Port)</option>
                        <option value="action">處置動作 (Action)</option>
                        <option value="timestamp">時間戳 (Time)</option>
                        <option value="number">數值 (Number)</option>
                        <option value="email">電子信箱 (Email)</option>
                        <option value="url">網址路徑 (URL)</option>
                        <option value="hash">雜湊值 (Hash)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        ECS 標準映射
                      </label>
                      <select
                        value={popoverState.suggestedEcs}
                        onChange={(e) => setPopoverState(prev => prev ? { ...prev, suggestedEcs: e.target.value } : null)}
                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-mono outline-none"
                      >
                        {COMMON_ECS_MAPPINGS.map(m => (
                          <option key={m.ecs} value={m.ecs}>{m.ecs}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      自動產生之 Regex Pattern
                    </label>
                    <input
                      type="text"
                      value={popoverState.suggestedRegex}
                      onChange={(e) => setPopoverState(prev => prev ? { ...prev, suggestedRegex: e.target.value } : null)}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-1.5 text-[11px] text-gray-300 font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCopyValue}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs flex items-center gap-1"
                    >
                      {copiedText ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedText ? '已複製' : '複製文字'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmExtraction}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-900/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>確認擷取為欄位</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Add as Filter */}
              {popoverState.activeTab === 'filter' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      過濾運算子 (Operator)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { op: 'equals', label: '等於 (=)' },
                        { op: 'not_equals', label: '不等於 (!=)' },
                        { op: 'contains', label: '包含 (Contains)' },
                        { op: 'not_contains', label: '排除 (Exclude)' }
                      ].map(item => (
                        <button
                          key={item.op}
                          type="button"
                          onClick={() => setPopoverState(prev => prev ? { ...prev, filterOperator: item.op as LogFilterOperator } : null)}
                          className={cn(
                            "px-2 py-1.5 rounded-lg text-xs font-bold border transition-all text-left",
                            popoverState.filterOperator === item.op
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-black/40 text-gray-400 border-gray-800 hover:border-gray-700"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      過濾鍵名標籤
                    </label>
                    <input
                      type="text"
                      value={popoverState.suggestedName}
                      onChange={(e) => setPopoverState(prev => prev ? { ...prev, suggestedName: e.target.value } : null)}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleConfirmFilter}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-900/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Filter size={14} />
                      <span>套用至即時過濾列</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

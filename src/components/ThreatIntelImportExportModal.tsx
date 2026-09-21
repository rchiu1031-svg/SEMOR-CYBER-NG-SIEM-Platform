import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  Download, 
  FileJson, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  FileText, 
  Database, 
  Shield, 
  ArrowRight, 
  Lock, 
  Unlock, 
  Sparkles,
  Info,
  Layers,
  Radio,
  RefreshCw,
  FileUp,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ThreatFeed } from './ThreatIntelSourcesSettingView';
import { ThreatIntelAlertThresholds } from './ThreatIntelAlertThresholdModal';

export interface ThreatIntelBackupData {
  exportVersion: string;
  schema: string;
  exportedAt: string;
  sourceApp: string;
  feedsCount: number;
  feeds: ThreatFeed[];
  alertThresholds?: ThreatIntelAlertThresholds;
  notes?: string;
}

interface ThreatIntelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: ThreatFeed[];
  alertThresholds: ThreatIntelAlertThresholds;
  onImportFeeds: (
    importedFeeds: ThreatFeed[],
    importedAlerts: ThreatIntelAlertThresholds | null,
    mode: 'merge' | 'overwrite'
  ) => void;
  isZh: boolean;
}

export default function ThreatIntelImportExportModal({
  isOpen,
  onClose,
  feeds,
  alertThresholds,
  onImportFeeds,
  isZh
}: ThreatIntelImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export state
  const [includeCredentials, setIncludeCredentials] = useState(false);
  const [includeAlertThresholds, setIncludeAlertThresholds] = useState(true);
  const [selectedFeedIds, setSelectedFeedIds] = useState<string[]>(() => feeds.map(f => f.id));
  const [copied, setCopied] = useState(false);

  // Import state
  const [dragActive, setDragActive] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [parsedBackup, setParsedBackup] = useState<ThreatIntelBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [restoreAlerts, setRestoreAlerts] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep selected feeds in sync when feeds change
  React.useEffect(() => {
    setSelectedFeedIds(feeds.map(f => f.id));
  }, [feeds]);

  // Construct Export JSON Data
  const exportData = useMemo<ThreatIntelBackupData>(() => {
    const selectedFeeds = feeds.filter(f => selectedFeedIds.includes(f.id));
    
    const sanitizedFeeds: ThreatFeed[] = selectedFeeds.map(feed => {
      if (includeCredentials) {
        return feed;
      }
      return {
        ...feed,
        authConfig: {
          ...feed.authConfig,
          apiKey: feed.authConfig?.apiKey ? '***REDACTED***' : undefined,
          password: feed.authConfig?.password ? '***REDACTED***' : undefined
        }
      };
    });

    return {
      exportVersion: '2.0',
      schema: 'semor.cti.threat-intel-sources.v2',
      exportedAt: new Date().toISOString(),
      sourceApp: 'Semor Unified SOC Threat Intelligence Platform',
      feedsCount: sanitizedFeeds.length,
      feeds: sanitizedFeeds,
      alertThresholds: includeAlertThresholds ? alertThresholds : undefined,
      notes: 'Backup configuration of TAXII 1.1/2.0/2.1 and STIX 2.1 threat intelligence sources.'
    };
  }, [feeds, selectedFeedIds, includeCredentials, includeAlertThresholds, alertThresholds]);

  const exportJsonString = useMemo(() => {
    return JSON.stringify(exportData, null, 2);
  }, [exportData]);

  // Handle Download File
  const handleDownloadFile = () => {
    const blob = new Blob([exportJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `threat_intel_sources_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Copy to Clipboard
  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportJsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Validate and parse incoming JSON string
  const processJsonContent = (jsonString: string, sourceName?: string) => {
    setParseError(null);
    setParsedBackup(null);

    if (!jsonString.trim()) {
      setParseError(isZh ? '檔案內容為空，請選擇有效的 JSON 設定檔。' : 'File is empty. Please provide valid JSON content.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonString);

      // Handle direct array of feeds or wrapped backup object
      let candidateFeeds: ThreatFeed[] = [];
      let candidateAlerts: ThreatIntelAlertThresholds | undefined = undefined;

      if (Array.isArray(parsed)) {
        candidateFeeds = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.feeds)) {
          candidateFeeds = parsed.feeds;
          candidateAlerts = parsed.alertThresholds;
        } else {
          throw new Error(isZh ? '未在 JSON 中找到情資來源清單 (缺少 "feeds" 欄位)' : 'Missing "feeds" array in JSON object.');
        }
      } else {
        throw new Error(isZh ? 'JSON 結構不符預期格式' : 'Unexpected JSON structure.');
      }

      // Basic validation of feed items
      if (candidateFeeds.length === 0) {
        throw new Error(isZh ? '設定檔中未包含任何情資來源資料。' : 'No threat feed records found in configuration.');
      }

      // Check essential fields
      const validFeeds: ThreatFeed[] = candidateFeeds.map((feed, idx) => {
        if (!feed.name || typeof feed.name !== 'string') {
          feed.name = `Imported Feed #${idx + 1}`;
        }
        if (!feed.id) {
          feed.id = `feed-imported-${Date.now()}-${idx}`;
        }
        if (!feed.protocol) {
          feed.protocol = 'TAXII 2.1';
        }
        if (!feed.collectionId) {
          feed.collectionId = 'default-collection';
        }
        if (typeof feed.indicatorCount !== 'number') {
          feed.indicatorCount = 0;
        }
        if (typeof feed.latencyMs !== 'number') {
          feed.latencyMs = 120;
        }
        if (!feed.status) {
          feed.status = 'active';
        }
        if (!feed.sampleIndicators || !Array.isArray(feed.sampleIndicators)) {
          feed.sampleIndicators = [];
        }
        return feed;
      });

      setParsedBackup({
        exportVersion: parsed.exportVersion || '1.0',
        schema: parsed.schema || 'semor.cti.threat-intel-sources.generic',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        sourceApp: parsed.sourceApp || (sourceName || 'External JSON Backup'),
        feedsCount: validFeeds.length,
        feeds: validFeeds,
        alertThresholds: candidateAlerts,
        notes: parsed.notes
      });
      setRestoreAlerts(!!candidateAlerts);
    } catch (err: any) {
      setParseError(err.message || (isZh ? 'JSON 解析失敗，格式不合法。' : 'Invalid JSON file or schema.'));
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setParseError(isZh ? '僅支援 .json 格式之情資設定備份檔。' : 'Only .json configuration files are supported.');
      return;
    }
    setImportedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processJsonContent(content, file.name);
    };
    reader.readAsText(file);
  };

  // Commit Import
  const handleExecuteImport = () => {
    if (!parsedBackup || parsedBackup.feeds.length === 0) return;

    onImportFeeds(
      parsedBackup.feeds,
      restoreAlerts && parsedBackup.alertThresholds ? parsedBackup.alertThresholds : null,
      importMode
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <FileJson size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isZh ? '情資來源設定備份與還原 (Import / Export)' : 'Threat Intel Backup & Restore'}</span>
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono rounded-full">
                  JSON Schema v2.0
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                {isZh 
                  ? '匯出 STIX/TAXII 情資來源與告警規則設定為 JSON 檔，或上傳備份檔快速恢復配置。' 
                  : 'Export threat feed and alert configurations to JSON or restore existing settings from backup.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-gray-900/30 border-b border-gray-800 flex items-center gap-2">
          <button
            id="export-config-tab-btn"
            onClick={() => setActiveTab('export')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all",
              activeTab === 'export'
                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <Download size={14} />
            <span>{isZh ? '匯出設定檔 (Export JSON)' : 'Export Configuration'}</span>
            <span className="px-1.5 py-0.2 bg-gray-800 text-[10px] text-gray-300 rounded font-mono">
              {feeds.length}
            </span>
          </button>

          <button
            id="import-config-tab-btn"
            onClick={() => setActiveTab('import')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all",
              activeTab === 'import'
                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <Upload size={14} />
            <span>{isZh ? '匯入與還原 (Import & Restore)' : 'Import / Restore Backup'}</span>
            {parsedBackup && (
              <span className="px-1.5 py-0.2 bg-green-500/20 text-green-400 text-[10px] rounded font-bold">
                ✓ Ready
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {activeTab === 'export' ? (
            /* EXPORT TAB */
            <div className="space-y-5">
              {/* Configuration Scope Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                      <Sliders size={14} className="text-blue-400" />
                      <span>{isZh ? '包含告警閾值設定' : 'Include Alert Policies'}</span>
                    </span>
                    <input
                      type="checkbox"
                      id="export-include-alerts"
                      checked={includeAlertThresholds}
                      onChange={(e) => setIncludeAlertThresholds(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {isZh 
                      ? `一併備份連續失敗閾值 (${alertThresholds.maxFailedAttempts} 次) 與延遲上限 (${alertThresholds.highLatencyMs}ms)。` 
                      : `Backup failure threshold (${alertThresholds.maxFailedAttempts}x) and high latency ceiling (${alertThresholds.highLatencyMs}ms).`}
                  </p>
                </div>

                <div className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                      {includeCredentials ? <Unlock size={14} className="text-amber-400" /> : <Lock size={14} className="text-green-400" />}
                      <span>{isZh ? '敏感認證金鑰' : 'Authentication Secrets'}</span>
                    </span>
                    <input
                      type="checkbox"
                      id="export-include-credentials"
                      checked={includeCredentials}
                      onChange={(e) => setIncludeCredentials(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {includeCredentials 
                      ? (isZh ? '⚠️ 包含明文 API Key 與密碼，僅限受信任之內部環境儲存。' : '⚠️ Plaintext API keys will be included in backup file.')
                      : (isZh ? '🛡️ 已自動將金鑰遮蔽為 ***REDACTED***，確保外洩安全。' : '🛡️ Credentials safely redacted with ***REDACTED*** mask.')}
                  </p>
                </div>
              </div>

              {/* Feed Selection Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300 flex items-center gap-2">
                    <Database size={13} className="text-gray-400" />
                    <span>{isZh ? '欲匯出之情資來源 (' : 'Feeds to include ('}{selectedFeedIds.length} / {feeds.length})</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedFeedIds(feeds.map(f => f.id))}
                      className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                    >
                      {isZh ? '全選' : 'Select All'}
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => setSelectedFeedIds([])}
                      className="text-[11px] text-gray-400 hover:text-gray-300 underline"
                    >
                      {isZh ? '全不選' : 'Deselect All'}
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto custom-scrollbar bg-gray-950/70 border border-gray-800 rounded-xl p-2.5 space-y-1.5">
                  {feeds.map(feed => {
                    const isChecked = selectedFeedIds.includes(feed.id);
                    return (
                      <label
                        key={feed.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors",
                          isChecked ? "bg-gray-900/90 text-gray-200" : "hover:bg-gray-900/40 text-gray-500"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFeedIds([...selectedFeedIds, feed.id]);
                              } else {
                                setSelectedFeedIds(selectedFeedIds.filter(id => id !== feed.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
                          />
                          <span className="font-bold">{feed.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                            {feed.protocol}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-xs">
                          {feed.discoveryUrl}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* JSON Live Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-400 flex items-center gap-1.5">
                    <FileText size={13} />
                    <span>{isZh ? 'JSON 輸出結構即時預覽' : 'Live Backup JSON Output'}</span>
                  </span>
                  <button
                    onClick={handleCopyClipboard}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
                  >
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    <span>{copied ? (isZh ? '已複製到剪貼簿!' : 'Copied!') : (isZh ? '複製 JSON' : 'Copy JSON')}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-black/90 border border-gray-800 rounded-xl font-mono text-[10px] text-blue-300/90 max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                  {exportJsonString}
                </pre>
              </div>
            </div>
          ) : (
            /* IMPORT TAB */
            <div className="space-y-5">
              {/* Input Mode Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <FileUp size={14} className="text-blue-400" />
                  <span>{isZh ? '選擇匯入方式' : 'Import Method'}</span>
                </span>
                <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={cn(
                      "px-3 py-1 rounded-md transition-all font-bold",
                      inputMode === 'file' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    {isZh ? '上傳 JSON 檔' : 'Upload File'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={cn(
                      "px-3 py-1 rounded-md transition-all font-bold",
                      inputMode === 'text' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    {isZh ? '貼上 JSON 文字' : 'Paste JSON'}
                  </button>
                </div>
              </div>

              {inputMode === 'file' ? (
                /* Drag & Drop or Click Area */
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3",
                      dragActive
                        ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                        : importedFile
                        ? "border-green-500/50 bg-green-500/5 hover:border-green-400"
                        : "border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/80"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl transition-transform",
                      importedFile ? "bg-green-500/20 text-green-400" : "bg-blue-600/20 text-blue-400"
                    )}>
                      {importedFile ? <CheckCircle2 size={28} /> : <Upload size={28} className="animate-pulse" />}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-200">
                        {importedFile 
                          ? importedFile.name 
                          : (isZh ? '拖放 JSON 檔案至此，或點擊此處瀏覽檔案' : 'Drag & drop JSON backup file here, or click to browse')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {importedFile 
                          ? `${(importedFile.size / 1024).toFixed(1)} KB` 
                          : (isZh ? '支援 TAXII 2.1 / STIX 2.1 備份格式檔案 (.json)' : 'Supports exported threat intel configuration backup (.json)')}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-bold rounded-xl pointer-events-none mt-1"
                    >
                      {importedFile ? (isZh ? '更換其他檔案' : 'Choose Another File') : (isZh ? '選擇本機檔案' : 'Browse Local File')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Text Area input */
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={rawJsonInput}
                    onChange={(e) => {
                      setRawJsonInput(e.target.value);
                      processJsonContent(e.target.value, 'Pasted JSON Text');
                    }}
                    placeholder={isZh ? '在此貼上備份 JSON 物件內容...' : 'Paste backup JSON content here...'}
                    className="w-full bg-black/80 border border-gray-800 rounded-xl p-3.5 font-mono text-xs text-gray-200 focus:border-blue-500 outline-none custom-scrollbar"
                  />
                </div>
              )}

              {/* Parsing Error State */}
              {parseError && (
                <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">{isZh ? '檔案格式解析錯誤' : 'JSON Parsing Error'}</span>
                    <p className="mt-0.5 text-red-300/80">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Parsed Preview Card */}
              {parsedBackup && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-400" />
                        <span className="text-xs font-bold text-white">
                          {isZh ? '已成功驗證備份檔案' : 'Valid Backup Configuration Detected'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-[10px] font-bold rounded-full">
                        {parsedBackup.feeds.length} {isZh ? '個情資來源' : 'Feeds'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
                        <span className="text-gray-500 text-[10px] block">{isZh ? '來源版本' : 'Schema Version'}</span>
                        <span className="font-mono font-bold text-blue-400">{parsedBackup.exportVersion}</span>
                      </div>
                      <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
                        <span className="text-gray-500 text-[10px] block">{isZh ? '備份建立時間' : 'Export Timestamp'}</span>
                        <span className="font-mono text-gray-300 truncate block">{new Date(parsedBackup.exportedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
                        <span className="text-gray-500 text-[10px] block">{isZh ? '包含告警規則' : 'Alert Policies'}</span>
                        <span className={cn("font-bold text-[11px]", parsedBackup.alertThresholds ? "text-green-400" : "text-gray-500")}>
                          {parsedBackup.alertThresholds ? (isZh ? '有 (Yes)' : 'Included') : (isZh ? '無 (None)' : 'Not present')}
                        </span>
                      </div>
                    </div>

                    {/* Feed item previews */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-gray-400 block">
                        {isZh ? '將載入的情資來源端點：' : 'Feeds included in backup:'}
                      </span>
                      <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1 bg-black/60 p-2 rounded-lg border border-gray-800/60">
                        {parsedBackup.feeds.map((feed, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-0.5">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span className="font-bold text-gray-200">{feed.name}</span>
                              <span className="text-[10px] font-mono text-gray-500">({feed.protocol})</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 shrink-0 ml-2">
                              {feed.collectionId}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Restore Mode Selection */}
                  <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-gray-200 block">
                      {isZh ? '還原策略 (Restore Strategy)' : 'Import & Restore Strategy'}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                        importMode === 'merge'
                          ? "bg-blue-600/15 border-blue-500/70 text-white"
                          : "bg-gray-950/60 border-gray-800 hover:border-gray-700 text-gray-400"
                      )}>
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5 text-blue-600 focus:ring-0"
                        />
                        <div>
                          <span className="text-xs font-bold block text-white">
                            {isZh ? '合併新增 (Merge & Append)' : 'Merge & Append'}
                          </span>
                          <span className="text-[11px] text-gray-400 leading-snug block mt-0.5">
                            {isZh 
                              ? '保留目前既有來源，同 ID 則更新設定，新 ID 則追加進清單。' 
                              : 'Keep existing feeds. Update matching IDs and append new feeds.'}
                          </span>
                        </div>
                      </label>

                      <label className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                        importMode === 'overwrite'
                          ? "bg-red-950/30 border-red-500/70 text-white"
                          : "bg-gray-950/60 border-gray-800 hover:border-gray-700 text-gray-400"
                      )}>
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'overwrite'}
                          onChange={() => setImportMode('overwrite')}
                          className="mt-0.5 text-red-600 focus:ring-0"
                        />
                        <div>
                          <span className="text-xs font-bold block text-white">
                            {isZh ? '完全覆蓋 (Complete Overwrite)' : 'Complete Overwrite'}
                          </span>
                          <span className="text-[11px] text-gray-400 leading-snug block mt-0.5">
                            {isZh 
                              ? '⚠️ 清除目前所有來源，完全替換為備份檔案中的情資來源。' 
                              : '⚠️ Replace current feeds entirely with the imported backup.'}
                          </span>
                        </div>
                      </label>
                    </div>

                    {parsedBackup.alertThresholds && (
                      <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={restoreAlerts}
                            onChange={(e) => setRestoreAlerts(e.target.checked)}
                            className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
                          />
                          <span>
                            {isZh 
                              ? `同時還原告警規則 (連續失敗 ≥${parsedBackup.alertThresholds.maxFailedAttempts} 次 / 延遲 ≥${parsedBackup.alertThresholds.highLatencyMs}ms)` 
                              : `Restore alert thresholds (failures ≥${parsedBackup.alertThresholds.maxFailedAttempts}x / latency ≥${parsedBackup.alertThresholds.highLatencyMs}ms)`}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-900/80 border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            {isZh ? '取消' : 'Cancel'}
          </button>

          {activeTab === 'export' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copied ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製內容' : 'Copy')}</span>
              </button>

              <button
                id="download-backup-json-btn"
                type="button"
                onClick={handleDownloadFile}
                disabled={selectedFeedIds.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
              >
                <Download size={15} />
                <span>{isZh ? `下載設定檔 (.json)` : `Download JSON (${selectedFeedIds.length})`}</span>
              </button>
            </div>
          ) : (
            <button
              id="execute-import-restore-btn"
              type="button"
              onClick={handleExecuteImport}
              disabled={!parsedBackup || parsedBackup.feeds.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-green-900/30 transition-all active:scale-95"
            >
              <Upload size={15} />
              <span>
                {parsedBackup 
                  ? (isZh ? `確認立即還原 (${parsedBackup.feeds.length} 來源)` : `Confirm Restore (${parsedBackup.feeds.length} Feeds)`)
                  : (isZh ? '請先上傳有效備份' : 'Upload Backup First')}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

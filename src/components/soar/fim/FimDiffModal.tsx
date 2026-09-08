import React, { useState } from 'react';
import { 
  X, 
  FileCode, 
  Terminal, 
  ShieldAlert, 
  Check, 
  Copy, 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle, 
  Fingerprint, 
  ArrowRight, 
  Binary, 
  User, 
  Cpu, 
  Download,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { FimEventItem } from '../../../data/soarFimData';

interface FimDiffModalProps {
  event: FimEventItem | null;
  onClose: () => void;
  onExecuteRollback: (eventId: string) => void;
  onIsolateHost: (eventId: string) => void;
}

export const FimDiffModal: React.FC<FimDiffModalProps> = ({
  event,
  onClose,
  onExecuteRollback,
  onIsolateHost
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'hashes' | 'process'>('diff');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!event) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleRollbackClick = () => {
    setActionNotice('已成功觸發 SOAR 自動化復原劇本：檔案已由唯讀黃金基線覆蓋還原！');
    onExecuteRollback(event.id);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleIsolateClick = () => {
    setActionNotice(`已向周邊防火牆與 EDR 下發指令：主機 ${event.hostName} (${event.ipAddress}) 已完成微隔離！`);
    onIsolateHost(event.id);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e131f] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800/80 bg-gray-900/40 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs bg-purple-950/60 text-purple-400 px-2.5 py-0.5 rounded border border-purple-800/40">
                {event.id}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                event.severity === 'Critical' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {event.severity}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                {event.threatClassification}
              </span>
              <span className="text-gray-500 text-xs font-mono">
                {event.timestamp}
              </span>
            </div>

            <h3 className="text-base font-bold text-white flex items-center gap-2 pt-1 font-mono">
              <FileCode className="text-purple-400" size={18} />
              {event.filePath}
            </h3>

            <div className="text-xs text-gray-400 flex items-center gap-3">
              <span>主機：<strong className="text-gray-200">{event.hostName}</strong> ({event.ipAddress})</span>
              <span>•</span>
              <span>群組：<strong className="text-gray-200">{event.assetGroup}</strong></span>
              <span>•</span>
              <span>變更類型：<strong className="text-red-400">{event.changeType}</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="p-3.5 bg-emerald-950/60 border-b border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2 px-6 animate-in slide-in-from-top-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 bg-black/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'diff'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileCode size={14} />
            異動前後內容比對 (Visual Content Diff)
          </button>

          <button
            onClick={() => setActiveTab('hashes')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'hashes'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Binary size={14} />
            密碼學雜湊校驗 (Cryptographic Integrity)
          </button>

          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'process'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Terminal size={14} />
            發起進程與身分溯源 (Process & Actor Forensics)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* TAB 1: VISUAL DIFF */}
          {activeTab === 'diff' && (
            <div className="space-y-4">
              {event.diffSummary && (
                <div className="p-3.5 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                  <Flame size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-red-200">惡意特徵分析研判：</strong>
                    <div className="mt-0.5">{event.diffSummary}</div>
                  </div>
                </div>
              )}

              {event.diffAvailable ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before / Golden Baseline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <span>✓ 原始黃金基線 (Golden Baseline)</span>
                      <span className="text-[11px] text-gray-500 font-mono">{event.sizeBeforeBytes} bytes</span>
                    </div>
                    <pre className="p-4 bg-black/70 border border-emerald-950/60 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto min-h-[220px] max-h-[360px] leading-relaxed">
                      {event.diffSnippetBefore}
                    </pre>
                  </div>

                  {/* After / Tampered Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-red-400 uppercase tracking-wider">
                      <span>⚠️ 竄改後惡意內容 (Tampered Payload)</span>
                      <span className="text-[11px] text-gray-500 font-mono">{event.sizeAfterBytes} bytes (+{event.sizeAfterBytes - (event.sizeBeforeBytes || 0)})</span>
                    </div>
                    <pre className="p-4 bg-black/70 border border-red-950/60 rounded-xl font-mono text-xs text-red-300 overflow-x-auto min-h-[220px] max-h-[360px] leading-relaxed">
                      {event.diffSnippetAfter}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-900/30 border border-gray-800 rounded-xl space-y-2">
                  <Binary size={36} className="text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">非純文字二進位檔案 (Binary / Firmware Payload)</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    偵測到目標檔案為 ELF/PE/韌體二進位檔案，不支援直接文字 Diff 比對。請切換至「密碼學雜湊校驗」檢視二進位檔頭與高熵值偏移分析。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CRYPTOGRAPHIC INTEGRITY */}
          {activeTab === 'hashes' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  雜湊簽名變更對比 (Hash Signature Verification)
                </div>

                {event.previousHashSha256 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                      <span>原始核准 SHA-256 雜湊 (Baseline)</span>
                      <button
                        onClick={() => handleCopy(event.previousHashSha256!, 'prev')}
                        className="text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedHash === 'prev' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        複製
                      </button>
                    </div>
                    <div className="p-2.5 bg-gray-900/80 rounded border border-gray-800 font-mono text-xs text-emerald-400 break-all">
                      {event.previousHashSha256}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span>現行檢測 SHA-256 雜湊 (Drifted)</span>
                    <button
                      onClick={() => handleCopy(event.currentHashSha256, 'curr')}
                      className="text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedHash === 'curr' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      複製
                    </button>
                  </div>
                  <div className="p-2.5 bg-gray-900/80 rounded border border-gray-800 font-mono text-xs text-red-400 break-all">
                    {event.currentHashSha256}
                  </div>
                </div>

                {event.ssdeepComparison && (
                  <div className="pt-2 border-t border-gray-800 text-xs flex items-center justify-between">
                    <span className="text-gray-400">SSDEEP 模糊雜湊相似度：</span>
                    <span className="font-mono font-bold text-amber-400">{event.ssdeepComparison}</span>
                  </div>
                )}
              </div>

              {/* Threat Intelligence Verdict */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
                  <div className="text-gray-500 mb-1">VirusTotal 引擎判別</div>
                  <div className="text-base font-black text-red-400">58 / 72 判定惡意</div>
                  <div className="text-[10px] text-gray-500 mt-1">PHP.Webshell.ChinaChopper</div>
                </div>

                <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
                  <div className="text-gray-500 mb-1">檔案熵值 (Entropy)</div>
                  <div className="text-base font-black text-amber-400">7.82 bits/byte</div>
                  <div className="text-[10px] text-gray-500 mt-1">高熵值 (含混淆或壓縮代碼)</div>
                </div>

                <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
                  <div className="text-gray-500 mb-1">SOAR 回應防護歷程</div>
                  <div className="text-base font-black text-purple-400">{event.soarExecutionTimeMs} ms</div>
                  <div className="text-[10px] text-gray-500 mt-1">{event.soarPlaybookName}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROCESS & ACTOR */}
          {activeTab === 'process' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-gray-800 rounded-xl p-5 space-y-4 text-xs">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={14} className="text-purple-400" />
                  進程關係拓撲與執行上下文 (Process Lineage)
                </div>

                <div className="space-y-3 font-mono">
                  {/* Parent Process */}
                  <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 text-[10px] block">父進程 (PPID: {event.ppid})</span>
                      <span className="font-bold text-gray-300">{event.parentProcessName}</span>
                    </div>
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                      Ancestry Root
                    </span>
                  </div>

                  <div className="flex justify-center text-gray-600">↓ spawned ↓</div>

                  {/* Target Process */}
                  <div className="p-3 bg-red-950/20 border border-red-800/40 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-red-400 text-[10px] block">引發異動之進程 (PID: {event.pid})</span>
                      <span className="font-bold text-white text-sm">{event.processName}</span>
                      <span className="text-gray-500 text-[11px] block mt-0.5">{event.processPath}</span>
                    </div>
                    <span className="text-[10px] bg-red-600/30 text-red-300 px-2 py-0.5 rounded border border-red-500/40">
                      Culprit Process
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-800 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px]">執行使用者</span>
                    <strong className="text-white font-mono">{event.userAccount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">UID / GID</span>
                    <strong className="text-white font-mono">{event.uid} / {event.gid}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">SOAR 處置</span>
                    <strong className="text-emerald-400 font-mono">{event.soarActionTaken}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">目前狀態</span>
                    <strong className="text-purple-400 font-mono">{event.status}</strong>
                  </div>
                </div>
              </div>

              {event.analystNotes && (
                <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-xl text-xs space-y-1">
                  <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    SOC 資安團隊取證附註 (Analyst Forensic Log)
                  </div>
                  <p className="text-gray-300 leading-relaxed">{event.analystNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            SOAR 自動化處置響應時間：<strong className="text-purple-400 font-mono">{event.soarExecutionTimeMs}ms</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRollbackClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              立即執行黃金基線快照復原 (Rollback)
            </button>

            <button
              onClick={handleIsolateClick}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5"
            >
              <ShieldAlert size={14} />
              掛起進程並微隔離主機 (Isolate Host)
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
            >
              關閉
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

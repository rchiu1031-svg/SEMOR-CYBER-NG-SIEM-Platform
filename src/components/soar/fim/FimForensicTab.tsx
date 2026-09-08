import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Download, 
  FileCode, 
  Server, 
  ShieldAlert, 
  Cpu, 
  RotateCw, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  AlertTriangle,
  Fingerprint,
  CheckCircle2,
  Lock,
  Flame
} from 'lucide-react';
import { FimEventItem } from '../../../data/soarFimData';

interface FimForensicTabProps {
  events: FimEventItem[];
  onSelectEvent: (event: FimEventItem) => void;
  onExecuteRollback: (eventId: string) => void;
  onIsolateHost: (eventId: string) => void;
}

export const FimForensicTab: React.FC<FimForensicTabProps> = ({
  events,
  onSelectEvent,
  onExecuteRollback,
  onIsolateHost
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedChangeType, setSelectedChangeType] = useState('All');
  const [selectedThreat, setSelectedThreat] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        evt.id.toLowerCase().includes(q) ||
        evt.filePath.toLowerCase().includes(q) ||
        evt.fileName.toLowerCase().includes(q) ||
        evt.hostName.toLowerCase().includes(q) ||
        evt.ipAddress.includes(q) ||
        evt.processName.toLowerCase().includes(q) ||
        evt.currentHashSha256.toLowerCase().includes(q);

      const matchGroup = selectedGroup === 'All' || evt.assetGroup === selectedGroup;
      const matchSeverity = selectedSeverity === 'All' || evt.severity === selectedSeverity;
      const matchChange = selectedChangeType === 'All' || evt.changeType === selectedChangeType;
      const matchThreat = selectedThreat === 'All' || evt.threatClassification === selectedThreat;

      return matchSearch && matchGroup && matchSeverity && matchChange && matchThreat;
    });
  }, [events, searchTerm, selectedGroup, selectedSeverity, selectedChangeType, selectedThreat]);

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `fim-forensic-events-${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋檔案路徑、檔名、主機、IP、進程 PID 或 SHA-256 雜湊..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold border border-gray-800 transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              匯出鑑識紀錄 (JSON)
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-800/80 text-xs">
          <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-[10px]">
            <Filter size={12} />
            <span>維度過濾：</span>
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="All">所有資產群組</option>
            <option value="Web Servers">Web Servers 網頁叢集</option>
            <option value="Domain Controllers">Domain Controllers 網域控制站</option>
            <option value="Database">Database 資料庫</option>
            <option value="Core Infrastructure">Core Infrastructure 核心維運</option>
            <option value="OT Gateway">OT Gateway 工控閘道</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="All">所有嚴重等級</option>
            <option value="Critical">極高風險 (Critical)</option>
            <option value="High">高風險 (High)</option>
            <option value="Medium">中度異動 (Medium)</option>
            <option value="Low">一般事件 (Low)</option>
          </select>

          <select
            value={selectedChangeType}
            onChange={(e) => setSelectedChangeType(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="All">所有異動類型</option>
            <option value="Modified">內容變更 (Modified)</option>
            <option value="Created">檔案新增 (Created)</option>
            <option value="Deleted">檔案刪除 (Deleted)</option>
            <option value="Permission_Changed">權限漂移 (Permissions)</option>
          </select>

          <select
            value={selectedThreat}
            onChange={(e) => setSelectedThreat(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="All">所有威脅分類</option>
            <option value="WebShell Injection">WebShell 植入</option>
            <option value="Privilege Escalation Backdoor">提權後門注入</option>
            <option value="Ransomware Encryption">勒索加密行為</option>
            <option value="Config Drift">組態偏離 (Config Drift)</option>
          </select>

          {(searchTerm || selectedGroup !== 'All' || selectedSeverity !== 'All' || selectedChangeType !== 'All' || selectedThreat !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGroup('All');
                setSelectedSeverity('All');
                setSelectedChangeType('All');
                setSelectedThreat('All');
              }}
              className="text-gray-400 hover:text-white flex items-center gap-1 ml-auto text-xs"
            >
              <RotateCcw size={12} />
              重設篩選
            </button>
          )}
        </div>
      </div>

      {/* Forensic Events Table */}
      <div className="bg-[#0e131f] border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/30">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            鑑識清冊：共 <span className="text-white font-bold">{filteredEvents.length}</span> 筆檔案完整性異動紀錄
          </div>
          <span className="text-xs text-gray-500">
            支援展開檢視詳細進程鏈、雜湊校驗值及觸發之 SOAR 自動化劇本
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="w-8 px-4 py-4"></th>
                <th className="px-4 py-4">事件編號 / 時間</th>
                <th className="px-4 py-4">受害主機 / 檔案絕對路徑</th>
                <th className="px-4 py-4">異動與威脅分類</th>
                <th className="px-4 py-4">進程 / 執行者 (Actor)</th>
                <th className="px-4 py-4 text-center">SOAR 處置狀態</th>
                <th className="px-4 py-4 text-right">鑑識操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70 text-xs">
              {filteredEvents.map((evt) => {
                const isExpanded = expandedId === evt.id;
                return (
                  <React.Fragment key={evt.id}>
                    <tr 
                      className={`hover:bg-gray-900/40 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-gray-900/50' : ''
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                    >
                      <td className="px-4 py-4 text-gray-500">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                          {evt.id}
                        </span>
                        <div className="text-gray-500 font-mono text-[11px] mt-1">{evt.timestamp}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <Server size={12} className="text-purple-400" />
                          {evt.hostName} ({evt.ipAddress})
                        </div>
                        <div className="text-gray-300 font-mono text-[11px] mt-0.5 truncate max-w-sm font-medium" title={evt.filePath}>
                          {evt.filePath}
                        </div>
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                          {evt.assetGroup}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.severity === 'Critical' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {evt.threatClassification}
                          </span>
                        </div>
                        <div className="text-gray-400 text-[11px] mt-1 font-mono">
                          類型: <strong className="text-red-400">{evt.changeType}</strong>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-white font-mono flex items-center gap-1">
                          <Cpu size={12} className="text-gray-500" />
                          PID {evt.pid}: {evt.processName}
                        </div>
                        <div className="text-gray-400 font-mono text-[11px] mt-0.5">
                          User: <strong className="text-gray-200">{evt.userAccount}</strong> (UID: {evt.uid})
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.soarActionTaken === 'Auto_Rolled_Back'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : evt.soarActionTaken === 'Process_Killed_Host_Isolated'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {evt.soarActionTaken === 'Auto_Rolled_Back' ? '✓ 快照已復原' : evt.soarActionTaken === 'Process_Killed_Host_Isolated' ? '🛡️ 進程終止/隔離' : evt.soarActionTaken}
                        </span>
                        <div className="text-[10px] text-purple-400 font-mono mt-0.5">
                          {evt.soarPlaybookName}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectEvent(evt)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1"
                          >
                            <FileCode size={13} />
                            Diff 鑑識
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Forensic Sub-panel */}
                    {isExpanded && (
                      <tr className="bg-gray-900/60 border-b border-gray-800">
                        <td colSpan={7} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Hashes */}
                            <div className="bg-[#0e131f] p-4 rounded-xl border border-gray-800 space-y-2">
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                密碼學雜湊校驗
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="text-gray-500">現行 SHA-256:</div>
                                <div className="p-2 bg-black/60 rounded border border-gray-800 font-mono text-[11px] text-red-400 break-all">
                                  {evt.currentHashSha256}
                                </div>
                              </div>
                              {evt.previousHashSha256 && (
                                <div className="text-xs space-y-1">
                                  <div className="text-gray-500">原始黃金 SHA-256:</div>
                                  <div className="p-2 bg-black/60 rounded border border-gray-800 font-mono text-[11px] text-emerald-400 break-all">
                                    {evt.previousHashSha256}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Diff summary */}
                            <div className="bg-[#0e131f] p-4 rounded-xl border border-gray-800 space-y-2">
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                異動語法解析摘要
                              </div>
                              <p className="text-xs text-gray-300 leading-relaxed">
                                {evt.diffSummary || '無文字行解析（二進位檔案或純權限漂移）'}
                              </p>
                              {evt.analystNotes && (
                                <div className="pt-2 border-t border-gray-800 text-[11px] text-gray-400">
                                  <strong>SOC 註記:</strong> {evt.analystNotes}
                                </div>
                              )}
                            </div>

                            {/* Actions Quick Trigger */}
                            <div className="bg-[#0e131f] p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
                              <div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                  SOAR 處置動作
                                </div>
                                <div className="text-xs text-gray-400 space-y-1">
                                  <div>觸發劇本: <strong className="text-white font-mono">{evt.soarPlaybookName}</strong></div>
                                  <div>處置耗時: <strong className="text-purple-400 font-mono">{evt.soarExecutionTimeMs}ms</strong></div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                <button
                                  onClick={() => onExecuteRollback(evt.id)}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                                >
                                  覆蓋復原
                                </button>
                                <button
                                  onClick={() => onIsolateHost(evt.id)}
                                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/20"
                                >
                                  隔離主機
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

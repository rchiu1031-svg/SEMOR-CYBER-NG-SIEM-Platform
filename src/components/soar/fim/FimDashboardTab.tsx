import React from 'react';
import { 
  ShieldAlert, 
  Fingerprint, 
  RotateCcw, 
  Zap, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ArrowUpRight, 
  Server, 
  FileCode, 
  Sliders, 
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Cpu,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { FimEventItem, FimPlaybookItem } from '../../../data/soarFimData';

interface FimDashboardTabProps {
  events: FimEventItem[];
  playbooks: FimPlaybookItem[];
  onSelectEvent: (event: FimEventItem) => void;
  onNavigateToTab: (tab: 'dashboard' | 'forensics' | 'playbooks' | 'policies' | 'baselines') => void;
}

export const FimDashboardTab: React.FC<FimDashboardTabProps> = ({
  events,
  playbooks,
  onSelectEvent,
  onNavigateToTab
}) => {
  const criticalCount = events.filter(e => e.severity === 'Critical').length;
  const highCount = events.filter(e => e.severity === 'High').length;
  const webShellCount = events.filter(e => e.threatClassification === 'WebShell Injection').length;
  const autoRolledBackCount = events.filter(e => e.soarActionTaken === 'Auto_Rolled_Back' || e.soarActionTaken === 'Snapshot_Restored').length;

  // Chart Data: 24h Tamper Activity & SOAR Mitigations
  const hourlyData = [
    { time: '00:00', tampered: 2, remediated: 2 },
    { time: '04:00', tampered: 1, remediated: 1 },
    { time: '08:00', tampered: 4, remediated: 4 },
    { time: '12:00', tampered: 7, remediated: 7 },
    { time: '16:00', tampered: 5, remediated: 5 },
    { time: '20:00', tampered: 12, remediated: 11 },
    { time: '22:00', tampered: 6, remediated: 6 }
  ];

  // Chart Data: Modification Type Breakdown
  const modTypeData = [
    { name: '內容竄改 (Modified)', value: 18, color: '#ef4444' },
    { name: '未知檔案注入 (Created)', value: 9, color: '#f97316' },
    { name: '權限漂移 (Permission)', value: 6, color: '#a855f7' },
    { name: '非預期刪除 (Deleted)', value: 3, color: '#3b82f6' }
  ];

  // Chart Data: Target Categories
  const categoryData = [
    { category: 'Web 目錄後門', count: 12, risk: 'Critical' },
    { category: '系統特權設定', count: 8, risk: 'Critical' },
    { category: '核心二進位檔', count: 6, risk: 'High' },
    { category: 'Windows 登錄檔', count: 5, risk: 'High' },
    { category: 'OT 韌體二進位', count: 3, risk: 'Critical' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Critical Alert Banner if WebShell or Critical Tampering Detected */}
      {criticalCount > 0 && (
        <div className="bg-gradient-to-r from-red-950/60 via-purple-950/30 to-[#0e131f] border border-red-800/60 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-md animate-pulse">
              <Flame size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                  EMERGENCY FIM DRIFT
                </span>
                <span className="text-xs font-bold text-red-300">
                  偵測到 {criticalCount} 起重大檔案完整性惡意竄改事件 (含 WebShell / Sudoers 注入)
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                SOAR 自動化守護引擎已介入：已秒級完成黃金快照覆蓋復原與可疑進程暫停隔離。
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('forensics')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 self-end md:self-center shrink-0"
          >
            檢視鑑識明細
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>監控關鍵檔案總量</span>
            <Fingerprint size={16} className="text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">284,910</span>
            <span className="text-xs text-purple-400 font-bold flex items-center gap-0.5">
              <TrendingUp size={12} /> +142
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>涵蓋 Linux / Windows / OT</span>
            <span className="text-purple-400 font-medium">eBPF 零延遲</span>
          </div>
        </div>

        <div className="bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>未授權竄改警示</span>
            <ShieldAlert size={16} className="text-red-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-red-500">{criticalCount + highCount}</span>
            <span className="text-xs text-red-400 font-bold">
              極高危 {criticalCount}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>WebShell: {webShellCount} 起</span>
            <span className="text-red-400 font-medium">已即時處置</span>
          </div>
        </div>

        <div className="bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>SOAR 自動復原率</span>
            <RotateCcw size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-400">99.4%</span>
            <span className="text-xs text-emerald-400 font-bold">即時回溯</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>平均還原耗時 (MTTR)</span>
            <span className="text-emerald-400 font-bold font-mono">0.62 秒</span>
          </div>
        </div>

        <div className="bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>黃金基線吻合率</span>
            <ShieldCheck size={16} className="text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-blue-400">99.8%</span>
            <span className="text-xs text-blue-400 font-bold">SHA-256</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>合規標準: PCI-DSS / CIS</span>
            <span className="text-blue-400 font-medium">健全一致</span>
          </div>
        </div>

        <div className="bg-[#0e131f] border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>探針節點在線數</span>
            <Server size={16} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">64 / 64</span>
            <span className="text-xs text-emerald-400 font-bold">100% 活躍</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>分散式端點 Agent 探針</span>
            <span className="text-indigo-400 font-medium">即時心跳</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: 24h Hourly Activity AreaChart */}
        <div className="bg-[#0e131f] border border-gray-800 p-6 rounded-2xl shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">24 小時檔案異動與 SOAR 自動阻斷處置走勢</h3>
              <p className="text-xs text-gray-500 mt-0.5">即時監測各伺服器主機與工控網關未授權寫入與自動隔離頻率</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-red-500" />
                <span className="text-gray-400">異常寫入事件</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-purple-500" />
                <span className="text-gray-400">SOAR 自動復原</span>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorTampered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRemediated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="tampered" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTampered)" name="異常寫入事件" />
                <Area type="monotone" dataKey="remediated" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRemediated)" name="SOAR 自動復原" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500">
            <span>SOAR 自律閉環防禦：99.2% 未授權異動均在 1 秒內回歸黃金狀態</span>
            <span className="text-emerald-400 font-medium">防禦閉環生效中</span>
          </div>
        </div>

        {/* Chart 2: Modification Type Breakdown PieChart */}
        <div className="bg-[#0e131f] border border-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">異動類型佔比</h3>
              <p className="text-xs text-gray-500 mt-0.5">內容、新增、權限與屬性</p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-400">36 事件</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {modTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0e131f" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-800/80 text-xs">
            {modTypeData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 truncate">{item.name}:</span>
                <span className="font-bold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent High-Priority FIM Tampering Forensic Feed */}
      <div className="bg-[#0e131f] border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-purple-400" />
              即時重大檔案異動與 SOAR 自動化響應追蹤
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              點擊任意項目即可開啟「內容行比對 (Visual Diff)」、「密碼學 SHA-256 驗證」及「進程關聯溯源」
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('forensics')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            完整鑑識清冊
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">時間 / 事件 ID</th>
                <th className="px-6 py-4">受影響主機 & 檔案路徑</th>
                <th className="px-6 py-4">威脅類型 / 觸發進程</th>
                <th className="px-6 py-4 text-center">SOAR 自動化聯防</th>
                <th className="px-6 py-4 text-right">深度鑑識與處置</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80 text-xs">
              {events.slice(0, 4).map((evt) => (
                <tr key={evt.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                      {evt.id}
                    </span>
                    <div className="text-gray-500 font-mono text-[11px] mt-1">{evt.timestamp}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Server size={12} className="text-purple-400" />
                      {evt.hostName} ({evt.ipAddress})
                    </div>
                    <div className="text-gray-300 font-mono text-[11px] mt-1 truncate max-w-md font-medium" title={evt.filePath}>
                      {evt.filePath}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.severity === 'Critical' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {evt.threatClassification}
                      </span>
                    </div>
                    <div className="text-gray-400 font-mono text-[11px] mt-1 flex items-center gap-1">
                      <Cpu size={12} className="text-gray-500" />
                      PID {evt.pid}: {evt.processName} ({evt.userAccount})
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      evt.soarActionTaken === 'Auto_Rolled_Back'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : evt.soarActionTaken === 'Process_Killed_Host_Isolated'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {evt.soarActionTaken === 'Auto_Rolled_Back' ? '✓ 快照已復原 (Rolled Back)' : evt.soarActionTaken === 'Process_Killed_Host_Isolated' ? '🛡️ 進程終止並隔離主機' : evt.soarActionTaken}
                    </span>
                    <div className="text-[10px] text-purple-400 font-mono mt-0.5">
                      耗時 {evt.soarExecutionTimeMs}ms
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectEvent(evt)}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 ml-auto"
                    >
                      <FileCode size={13} />
                      行級比對 (Diff)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

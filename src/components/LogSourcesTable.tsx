import React, { useState, useEffect } from 'react';
import {
  Server,
  Radio,
  Wifi,
  HardDrive,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export interface IngestSource {
  id: string;
  name: string;
  remoteIP: string;
  remotePort: number;
  protocol: string;
  format: string;
  vendor: string;
  currentEPS: number;
  peakEPS: number;
  bytesReceived: number;
  droppedPackets: number;
  activeState: 'active' | 'idle' | 'warning';
  lastSeen: string;
}

export function LogSourcesTable() {
  const [sources, setSources] = useState<IngestSource[]>([]);
  const [totalEPS, setTotalEPS] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/engine/collector/sources');
      if (res.ok) {
        const json = await res.json();
        setSources(json.sources || []);
        setTotalEPS(json.totalEPS || 0);
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.error('Failed to load ingest sources:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = sources.filter(s =>
    s.name.toLowerCase().includes(filterText.toLowerCase()) ||
    s.remoteIP.includes(filterText) ||
    s.protocol.toLowerCase().includes(filterText.toLowerCase()) ||
    s.vendor.toLowerCase().includes(filterText.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${bytes} B`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Radio className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                來源設備連線與通道監測 (Active Ingestion Sources)
              </h3>
              <p className="text-xs text-slate-400">
                即時掌握防火牆、交換器、K8s DaemonSet 與端點代理之實體封包吞吐
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">總進線吞吐:</span>
            <span className="text-emerald-400 font-bold">{totalEPS.toLocaleString()} EPS</span>
          </div>

          <button
            onClick={fetchSources}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="手動重新整理"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="過濾來源 IP、設備名稱、協定或廠牌..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80"
          />
        </div>

        <div className="text-slate-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>最後更新: {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 font-semibold">設備名稱 / Host</th>
              <th className="py-2.5 px-3 font-semibold">來源 IP:Port</th>
              <th className="py-2.5 px-3 font-semibold">通訊協議與規格</th>
              <th className="py-2.5 px-3 font-semibold">廠牌/格式</th>
              <th className="py-2.5 px-3 font-semibold text-right">當前 EPS</th>
              <th className="py-2.5 px-3 font-semibold text-right">累積接收資料量</th>
              <th className="py-2.5 px-3 font-semibold text-center">連線狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/40 transition">
                <td className="py-2.5 px-3 font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{s.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-300">
                  <span>{s.remoteIP}</span>
                  <span className="text-slate-500">:{s.remotePort}</span>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      s.protocol.includes('TLS')
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                        : s.protocol.includes('TCP')
                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                        : s.protocol.includes('HTTP')
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {s.protocol}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">
                  <div>{s.vendor}</div>
                  <div className="text-[10px] text-slate-500">{s.format}</div>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-emerald-400 font-bold">{s.currentEPS.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 ml-1">EPS</span>
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300">
                  {formatBytes(s.bytesReceived)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    連線正常
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  無符合條件之進線設備
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogSourcesTable;

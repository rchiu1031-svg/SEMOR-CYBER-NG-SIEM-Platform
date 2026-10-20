import React, { useState } from 'react';
import { 
  Server, RefreshCw, CheckCircle2, AlertTriangle, Plus, ExternalLink, 
  Settings2, Shield, Activity, Lock, Database, Play, Pause, Zap, Trash2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { CtiConnector } from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

interface CtiConnectorsTabProps {
  isZh: boolean;
  connectors: CtiConnector[];
  onToggleStatus: (id: string) => void;
  onSyncNow: (id: string) => void;
  onAddConnector: (conn: Partial<CtiConnector>) => void;
  onDeleteConnector?: (id: string) => void;
  onSeedBaseline?: () => void;
}

export function CtiConnectorsTab({
  isZh,
  connectors,
  onToggleStatus,
  onSyncNow,
  onAddConnector,
  onDeleteConnector,
  onSeedBaseline,
}: CtiConnectorsTabProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState<CtiConnector['type']>('Ingestion');
  const [newConnUrl, setNewConnUrl] = useState('');
  const [newConnTlp, setNewConnTlp] = useState<CtiConnector['tlpFloor']>('TLP:AMBER');

  const handleSync = (id: string) => {
    setSyncingId(id);
    onSyncNow(id);
    setTimeout(() => {
      setSyncingId(null);
    }, 1800);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName) return;
    onAddConnector({
      name: newConnName,
      type: newConnType,
      endpoint: newConnUrl || 'https://cti.taxii.local/taxii2/collections/ioc',
      status: 'Active',
      lastSync: 'Just now',
      ingestedCount: 0,
      tlpFloor: newConnTlp,
      pullInterval: 'Every 30m',
      errorRate: '0.0%'
    });
    setNewConnName('');
    setNewConnUrl('');
    setShowAddModal(false);
  };

  const totalIngested = connectors.reduce((acc, c) => acc + (c.ingestedCount ?? (parseInt(c.count?.replace(/[^0-9]/g, '') || '0'))), 0);
  const healthyCount = connectors.filter(c => c.status === 'Active' || c.status === 'Healthy').length;

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {isZh ? 'TAXII 2.1 & MISP 情資饋送管線連接器' : 'TAXII 2.1 & Threat Feed Connector Mesh'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                  {healthyCount}/{connectors.length} ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isZh 
                  ? '自動化對接跨國商業 CTI、國家級 CERT 與開源情報管道，維持實時威脅情資流入' 
                  : 'Automated threat feed ingestion from commercial CTI, national CERTs, and open-source TAXII servers'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/50 border border-gray-800 px-4 py-2 rounded-xl text-xs">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">{isZh ? '累積攝取指標數' : 'Total Ingested IOCs'}</span>
              <span className="text-xl font-mono font-black text-white">{totalIngested.toLocaleString()}</span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus size={15} />
              {isZh ? '新增情資介接管線' : 'Add Feed Connector'}
            </button>
          </div>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {connectors.map((conn) => {
          const isSyncing = syncingId === conn.id;

          return (
            <div 
              key={conn.id}
              className="bg-[#111114] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition-all space-y-4"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] font-bold">
                      {conn.type}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded font-mono text-[10px] font-bold border",
                      (conn.status === 'Active' || conn.status === 'Healthy') ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      (conn.status === 'Warning' || conn.status === 'Degraded') ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      conn.status === 'Syncing' ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" :
                      "bg-gray-800 text-gray-400 border-gray-700"
                    )}>
                      {conn.status}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-gray-500">
                    {conn.pullInterval || conn.pollInterval || 'Every 15m'}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white">{conn.name}</h4>
                <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">{conn.endpoint}</p>
              </div>

              {/* Ingestion & TLP Details */}
              <div className="bg-black/40 p-3 rounded-xl border border-gray-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">{isZh ? '已攝取指標數:' : 'Ingested Count:'}</span>
                  <span className="font-mono font-bold text-white">{(conn.ingestedCount ?? parseInt(conn.count?.replace(/[^0-9]/g, '') || '0')).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{isZh ? '上次同步時間:' : 'Last Sync:'}</span>
                  <span className="font-mono text-gray-300">{conn.lastSync}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{isZh ? 'TLP 過濾底線:' : 'TLP Floor:'}</span>
                  <span className="font-mono font-bold text-amber-400">{conn.tlpFloor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{isZh ? '傳輸錯誤率:' : 'Error Rate:'}</span>
                  <span className="font-mono text-green-400">{conn.errorRate || '0.0%'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800/80">
                <button
                  onClick={() => handleSync(conn.id)}
                  disabled={isSyncing}
                  className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={cn(isSyncing && "animate-spin text-blue-400")} />
                  {isSyncing ? (isZh ? '同步中...' : 'Syncing...') : (isZh ? '強制同步' : 'Force Sync')}
                </button>

                <button
                  onClick={() => onToggleStatus(conn.id)}
                  className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 rounded-xl transition-colors"
                  title={conn.status === 'Paused' ? 'Resume Connector' : 'Pause Connector'}
                >
                  {conn.status === 'Paused' ? <Play size={14} className="text-green-400" /> : <Pause size={14} />}
                </button>
                {onDeleteConnector && (
                  <button
                    onClick={() => onDeleteConnector(conn.id)}
                    className="p-2 bg-gray-900 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-800 rounded-xl transition-colors"
                    title="Delete Connector"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Connector Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white">
              {isZh ? '新增 TAXII 2.1 / MISP 情資連接器' : 'Add TAXII 2.1 / MISP Feed Connector'}
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 font-bold mb-1">{isZh ? '連接器名稱' : 'Connector Name'}</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. AlienVault OTX Threat Stream"
                  value={newConnName}
                  onChange={e => setNewConnName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">{isZh ? '通訊協定 (Protocol)' : 'Protocol Type'}</label>
                  <select 
                    value={newConnType}
                    onChange={e => setNewConnType(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="TAXII 2.1">TAXII 2.1 Server</option>
                    <option value="MISP Sync">MISP API (PyMISP)</option>
                    <option value="REST / STIX">REST / STIX JSON Feed</option>
                    <option value="RSS / Webhook">RSS / Advisory Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">{isZh ? 'TLP 過濾底線' : 'TLP Floor'}</label>
                  <select 
                    value={newConnTlp}
                    onChange={e => setNewConnTlp(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="TLP:CLEAR">TLP:CLEAR</option>
                    <option value="TLP:GREEN">TLP:GREEN</option>
                    <option value="TLP:AMBER">TLP:AMBER</option>
                    <option value="TLP:RED">TLP:RED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">{isZh ? '伺服器端點 (TAXII Collection URL)' : 'Endpoint URL'}</label>
                <input 
                  type="text" 
                  placeholder="https://cti.provider.com/taxii2/collections/active-threats"
                  value={newConnUrl}
                  onChange={e => setNewConnUrl(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  {isZh ? '確認建立' : 'Save Connector'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

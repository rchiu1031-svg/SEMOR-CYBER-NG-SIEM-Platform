import React, { useState } from 'react';
import {
  Database,
  Activity,
  Shield,
  Layers,
  Radio,
  Cloud,
  Cpu,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Plus,
  ExternalLink,
  Settings,
  Lock,
  Zap,
  Server
} from 'lucide-react';
import { DataSourceItem } from './types';
import { INITIAL_DATA_SOURCES } from './mockData';

interface DataSourceManagerProps {
  onSelectDataSource?: (sourceName: string) => void;
}

export function DataSourceManager({ onSelectDataSource }: DataSourceManagerProps) {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>(INITIAL_DATA_SOURCES);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [editingSource, setEditingSource] = useState<DataSourceItem | null>(null);

  const getSourceIcon = (icon: string) => {
    switch (icon) {
      case 'Database': return <Database className="w-5 h-5 text-emerald-400" />;
      case 'Activity': return <Activity className="w-5 h-5 text-blue-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-purple-400" />;
      case 'Layers': return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'Radio': return <Radio className="w-5 h-5 text-rose-400" />;
      case 'Cloud': return <Cloud className="w-5 h-5 text-amber-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-indigo-400" />;
      case 'Workflow': return <Workflow className="w-5 h-5 text-pink-400" />;
      default: return <Database className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleTestConnection = (ds: DataSourceItem) => {
    setTestingId(ds.id);
    setTestResult(null);

    setTimeout(() => {
      const isSuccess = ds.status !== 'disconnected';
      const simulatedLatency = Math.floor(Math.random() * 15) + 6;
      setTestingId(null);
      setTestResult({
        id: ds.id,
        success: isSuccess,
        msg: isSuccess
          ? `連線成功！回應時間 ${simulatedLatency} ms (TLS 1.3 密碼套件驗證合格)`
          : `連線逾時！無法連線至 ${ds.endpoint} (請檢查網路路由或防火牆政策)`
      });

      // Update source latency
      setDataSources(prev =>
        prev.map(item => (item.id === ds.id ? { ...item, latencyMs: simulatedLatency, status: isSuccess ? 'connected' : 'disconnected' } : item))
      );
    }, 900);
  };

  return (
    <div className="space-y-6 select-text">
      {/* Header */}
      <div className="bg-[#0f111a] border border-gray-800 p-5 rounded-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">SOC 多源遙測資料連接器 (Data Connectors)</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            管理 VictoriaLogs、Prometheus、Arkime、OpenSearch 與端點 EDR 即時串流連線狀態與存取憑證。
          </p>
        </div>

        <button
          onClick={() => {
            const newSource: DataSourceItem = {
              id: `ds-custom-${Date.now()}`,
              name: '自訂資安資料連接器 (New)',
              type: 'victorialogs',
              icon: 'Database',
              endpoint: 'https://custom-telemetry.corp.internal:9000/api',
              status: 'connected',
              latencyMs: 15,
              description: '自訂內部日誌伺服器或 Syslog Forwarder HTTP 接收端點',
              authType: 'API_KEY',
              tlsVerify: true,
              cacheTtlSec: 15,
              activeQueriesCount: 0
            };
            setDataSources([...dataSources, newSource]);
            setEditingSource(newSource);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          新增資料源
        </button>
      </div>

      {/* Test feedback toast */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            testResult.success
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
            <span>{testResult.msg}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dataSources.map((ds) => {
          const isTesting = testingId === ds.id;
          return (
            <div
              key={ds.id}
              className="bg-[#0f111a] border border-gray-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-gray-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                    {getSourceIcon(ds.icon)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ds.status === 'connected' ? 'bg-emerald-400 animate-pulse' :
                        ds.status === 'degraded' ? 'bg-amber-400' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-[10px] font-bold text-gray-300 uppercase">
                      {ds.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-white">{ds.name}</h3>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {ds.description}
                </p>

                <div className="mt-3 p-2 bg-gray-900/60 rounded border border-gray-800/80 font-mono text-[10px] space-y-1">
                  <div className="text-gray-400 truncate">端點: {ds.endpoint}</div>
                  <div className="flex justify-between text-gray-400">
                    <span>延遲: <strong className="text-emerald-400">{ds.latencyMs} ms</strong></span>
                    <span>鑑別: <strong className="text-blue-400">{ds.authType}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTestConnection(ds)}
                  disabled={isTesting}
                  className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded text-[11px] font-semibold border border-gray-700 transition-colors flex items-center gap-1 flex-1 justify-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-blue-400' : ''}`} />
                  <span>{isTesting ? '測試中...' : '測試連線 (Ping)'}</span>
                </button>

                <button
                  onClick={() => setEditingSource(ds)}
                  className="p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded border border-gray-700 transition-colors"
                  title="設定參數"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingSource && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">編輯資料源: {editingSource.name}</h3>
              </div>
              <button onClick={() => setEditingSource(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">連線顯示名稱</label>
                <input
                  type="text"
                  value={editingSource.name}
                  onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">API 端點 URL (Endpoint)</label>
                <input
                  type="text"
                  value={editingSource.endpoint}
                  onChange={(e) => setEditingSource({ ...editingSource, endpoint: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">身分驗證方式</label>
                  <select
                    value={editingSource.authType}
                    onChange={(e) => setEditingSource({ ...editingSource, authType: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                  >
                    <option value="BEARER_TOKEN">Bearer Token (JWT)</option>
                    <option value="API_KEY">API Key (標頭金鑰)</option>
                    <option value="BASIC_AUTH">HTTP Basic 帳密</option>
                    <option value="IAM_ROLE">Cloud IAM 授權</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">快取保留週期 (TTL)</label>
                  <select
                    value={editingSource.cacheTtlSec}
                    onChange={(e) => setEditingSource({ ...editingSource, cacheTtlSec: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                  >
                    <option value={5}>5 秒 (高頻即時)</option>
                    <option value={15}>15 秒 (標準)</option>
                    <option value={60}>60 秒 (低負載)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSource.tlsVerify}
                  onChange={(e) => setEditingSource({ ...editingSource, tlsVerify: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-blue-600 w-4 h-4"
                />
                <span className="text-gray-300">強制 TLS/SSL 憑證校驗 (Strict Verification)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setEditingSource(null)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setDataSources(prev => prev.map(s => (s.id === editingSource.id ? editingSource : s)));
                  setEditingSource(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 shadow-md shadow-blue-500/20"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

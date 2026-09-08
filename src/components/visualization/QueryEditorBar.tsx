import React, { useState } from 'react';
import {
  Code2,
  SlidersHorizontal,
  Table as TableIcon,
  Activity,
  Play,
  Check,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Terminal,
  Database,
  Search,
  Cpu
} from 'lucide-react';
import { PanelConfig, QueryFilter, TransformationRule } from './types';
import { MOCK_TIME_SERIES } from './mockData';

interface QueryEditorBarProps {
  config: PanelConfig;
  onChange: (newConfig: PanelConfig) => void;
  onExecuteQuery?: () => void;
  isExecuting?: boolean;
  lastExecutionMs?: number;
}

export function QueryEditorBar({
  config,
  onChange,
  onExecuteQuery,
  isExecuting = false,
  lastExecutionMs = 14
}: QueryEditorBarProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'raw' | 'transform' | 'preview' | 'inspector'>('builder');

  const updateQuery = (partial: Partial<PanelConfig['query']>) => {
    onChange({
      ...config,
      query: { ...config.query, ...partial }
    });
  };

  const addFilter = () => {
    const newFilter: QueryFilter = {
      id: `filter-${Date.now()}`,
      field: 'host',
      operator: '=',
      value: 'fw-edge-01'
    };
    updateQuery({
      filters: [...config.query.filters, newFilter]
    });
  };

  const removeFilter = (id: string) => {
    updateQuery({
      filters: config.query.filters.filter(f => f.id !== id)
    });
  };

  const updateFilter = (id: string, partial: Partial<QueryFilter>) => {
    updateQuery({
      filters: config.query.filters.map(f => (f.id === id ? { ...f, ...partial } : f))
    });
  };

  const addTransform = () => {
    const newTrans: TransformationRule = {
      id: `trans-${Date.now()}`,
      type: 'calculate_field',
      description: '位元組轉百萬位元 (x 8 / 1,000,000)',
      active: true,
      params: { factor: 8, divideBy: 1000000 }
    };
    onChange({
      ...config,
      transformations: [...config.transformations, newTrans]
    });
  };

  const toggleTransform = (id: string) => {
    onChange({
      ...config,
      transformations: config.transformations.map(t => (t.id === id ? { ...t, active: !t.active } : t))
    });
  };

  const removeTransform = (id: string) => {
    onChange({
      ...config,
      transformations: config.transformations.filter(t => t.id !== id)
    });
  };

  return (
    <div className="w-full bg-[#0d0f17] border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col text-xs">
      {/* Studio Header Bar */}
      <div className="px-4 py-2.5 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'builder'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            視覺化查詢器
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'raw'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            原始語法 ({config.query.queryLanguage})
          </button>

          <button
            onClick={() => setActiveTab('transform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'transform'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            資料轉換 ({config.transformations.filter(t => t.active).length})
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            資料預覽
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'inspector'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            效能剖析 ({lastExecutionMs}ms)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 font-mono hidden md:inline">
            資料源: <span className="text-white font-bold">{config.dataSource}</span>
          </span>
          <button
            onClick={onExecuteQuery}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? '執行中...' : '執行查詢 (Run)'}</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-4 select-text">
        {/* TAB 1: VISUAL QUERY BUILDER */}
        {activeTab === 'builder' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-gray-400 font-semibold block mb-1">指標度量 (Metric)</label>
                <select
                  value={config.query.metric}
                  onChange={(e) => updateQuery({ metric: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                >
                  <option value="rate(network_traffic_bytes_total[5m]) * 8 / 1000000">
                    network_traffic_bytes_total (流量頻寬)
                  </option>
                  <option value="count_over_time(auth_failed_logins_total[5m])">
                    auth_failed_logins_total (登入失敗)
                  </option>
                  <option value="sum(edr_active_threat_scores)">
                    edr_active_threat_scores (端點威脅分)
                  </option>
                  <option value="rate(http_requests_5xx_total[5m])">
                    http_requests_5xx_total (伺服器錯誤)
                  </option>
                  <option value="node_cpu_utilization_percent">
                    node_cpu_utilization_percent (CPU 利用率)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">聚合運算 (Aggregation)</label>
                <select
                  value={config.query.aggregation}
                  onChange={(e) => updateQuery({ aggregation: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                >
                  <option value="SUM">SUM (總和)</option>
                  <option value="AVG">AVG (平均)</option>
                  <option value="RATE">RATE (每秒速率)</option>
                  <option value="COUNT">COUNT (計數)</option>
                  <option value="MAX">MAX (極大值)</option>
                  <option value="MIN">MIN (極小值)</option>
                  <option value="P95">P95 (第95百分位)</option>
                  <option value="P99">P99 (第99百分位)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">群組維度 (Group By)</label>
                <input
                  type="text"
                  value={config.query.groupBy}
                  onChange={(e) => updateQuery({ groupBy: e.target.value })}
                  placeholder="如: direction, interface, host"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">時間桶切片 (Bucket)</label>
                <select
                  value={config.query.timeBucket}
                  onChange={(e) => updateQuery({ timeBucket: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                >
                  <option value="10s">10 秒 (即時粒度)</option>
                  <option value="30s">30 秒</option>
                  <option value="1m">1 分鐘 (標準)</option>
                  <option value="5m">5 分鐘</option>
                  <option value="15m">15 分鐘</option>
                  <option value="1h">1 小時 (長週期)</option>
                </select>
              </div>
            </div>

            {/* Filter conditions */}
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-semibold">過濾篩選條件 (Where Clauses)</span>
                <button
                  onClick={addFilter}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> 新增過濾條件
                </button>
              </div>

              <div className="space-y-2">
                {config.query.filters.length === 0 && (
                  <div className="text-gray-500 italic p-2 bg-gray-950/40 rounded border border-gray-800/60">
                    尚無過濾條件，將查詢資料源之全部標籤系列。
                  </div>
                )}
                {config.query.filters.map((filter) => (
                  <div key={filter.id} className="flex items-center gap-2 bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                    <input
                      type="text"
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                      placeholder="標籤名稱 (如 env)"
                      className="w-32 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-white font-mono"
                    />
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                      className="w-16 bg-gray-950 border border-gray-700 rounded px-1.5 py-1 text-white font-mono text-center font-bold"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value="=~">=~</option>
                      <option value="!~">!~</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                    </select>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      placeholder="標籤值 (如 production)"
                      className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-white font-mono"
                    />
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RAW QUERY */}
        {activeTab === 'raw' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">查詢語言模式:</span>
                <select
                  value={config.query.queryLanguage}
                  onChange={(e) => updateQuery({ queryLanguage: e.target.value as any })}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-blue-400 font-bold"
                >
                  <option value="PromQL">PromQL (Prometheus / VictoriaMetrics)</option>
                  <option value="LogQL">LogQL (VictoriaLogs / Loki)</option>
                  <option value="SQL">SQL (ClickHouse / PostgreSQL)</option>
                  <option value="Lucene">Lucene (OpenSearch / Elasticsearch)</option>
                </select>
              </div>
              <span className="text-[11px] text-gray-500">支援快速語法驗證與自動補全</span>
            </div>

            <textarea
              rows={4}
              value={config.query.rawCode}
              onChange={(e) => updateQuery({ rawCode: e.target.value })}
              className="w-full bg-[#090b10] border border-gray-700 rounded-lg p-3 text-emerald-300 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed select-text"
              placeholder="輸入語法 (如 sum by (direction) (rate(network_bytes_total[5m])))..."
            />
          </div>
        )}

        {/* TAB 3: TRANSFORM */}
        {activeTab === 'transform' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">客戶端即時資料管道轉換 (Data Transformations)</h4>
                <p className="text-gray-400 text-[11px]">在圖表繪製前，對資料源傳回之資料集進行過濾、重命名或四則運算</p>
              </div>
              <button
                onClick={addTransform}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> 新增轉換規則
              </button>
            </div>

            <div className="space-y-2">
              {config.transformations.map((trans) => (
                <div
                  key={trans.id}
                  className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={trans.active}
                      onChange={() => toggleTransform(trans.id)}
                      className="rounded bg-gray-800 border-gray-700 text-blue-600 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-gray-200">{trans.description}</span>
                      <span className="text-[10px] text-gray-500 block font-mono">類型: {trans.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTransform(trans.id)}
                    className="text-gray-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DATA PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-gray-400 text-[11px]">
              <span>查詢結果前 10 筆序列樣本預覽</span>
              <span className="font-mono text-emerald-400">200 OK • 13 筆聚合時間戳</span>
            </div>
            <div className="max-h-48 overflow-auto border border-gray-800 rounded-lg">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-gray-900 text-gray-400">
                  <tr className="border-b border-gray-800">
                    <th className="p-2">時間 (Timestamp)</th>
                    <th className="p-2">入口流量 (Mbps)</th>
                    <th className="p-2">出口流量 (Mbps)</th>
                    <th className="p-2">阻斷封包數</th>
                    <th className="p-2">可疑會話</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {MOCK_TIME_SERIES.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/40">
                      <td className="p-2 text-gray-300">{row.time}</td>
                      <td className="p-2 text-blue-400 font-bold">{row.ingress}</td>
                      <td className="p-2 text-cyan-400">{row.egress}</td>
                      <td className="p-2 text-red-400">{row.dropped}</td>
                      <td className="p-2 text-amber-400">{row.suspicious}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: QUERY INSPECTOR */}
        {activeTab === 'inspector' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">查詢總耗時 (Execution Time)</span>
              <span className="text-xl font-bold text-emerald-400">{lastExecutionMs} ms</span>
              <span className="text-[10px] text-gray-500 block mt-1">網路傳輸 4ms + 引擎運算 10ms</span>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">掃描原始日誌量 (Scanned Rows)</span>
              <span className="text-xl font-bold text-white">142,500 筆</span>
              <span className="text-[10px] text-gray-500 block mt-1">壓縮比率 14:1 (ZSTD)</span>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">返回度量時間序列 (Series)</span>
              <span className="text-xl font-bold text-blue-400">4 組序列</span>
              <span className="text-[10px] text-gray-500 block mt-1">Ingress, Egress, Drop, Suspicious</span>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">快取命中狀態 (Cache Status)</span>
              <span className="text-xl font-bold text-purple-400">HIT (快取有效)</span>
              <span className="text-[10px] text-gray-500 block mt-1">TTL 剩餘 8 秒自動刷新</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

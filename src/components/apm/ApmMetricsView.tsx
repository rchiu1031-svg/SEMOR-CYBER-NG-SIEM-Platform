import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Layers, 
  Cpu 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Line, 
  ReferenceLine, 
  AreaChart, 
  Area 
} from 'recharts';

interface ApmMetricsViewProps {
  stats: {
    totalCPM: number;
    avgLatency: number;
    avgSla: number;
    activeAlarms: number;
  };
  rtTrend: any[];
  slowSql: any[];
  slowEndpoints: any[];
  jvmServers: any[];
  env: string;
}

export const ApmMetricsView: React.FC<ApmMetricsViewProps> = ({
  stats,
  rtTrend,
  slowSql,
  slowEndpoints,
  jvmServers,
  env
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] text-left">
      {/* 4 Golden KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { 
            label: isZh ? "微服務全域吞吐量 (Total CPM)" : isJa ? "マイクロサービス全域スループット (Total CPM)" : "Total Throughput (Total CPM)", 
            value: stats.totalCPM.toLocaleString(), 
            change: "+15.4%", 
            isUp: true, 
            desc: isZh ? "當前各調用端點並行吞吐量 (Calls per Min)" : isJa ? "現在の呼び出しエンドポイント並行スループット (Calls per Min)" : "Sum of all active service calls per minute (CPM)", 
            icon: <TrendingUp className="text-blue-400" /> 
          },
          { 
            label: isZh ? "系統平均延遲 (SLA Latency)" : isJa ? "システム平均レイテンシ (SLA Latency)" : "Average SLA Latency", 
            value: `${stats.avgLatency} ms`, 
            change: "-12ms", 
            isUp: false, 
            desc: isZh ? "整格拓撲鏈路平均同步響應間隔" : isJa ? "トポロジー全体の平均応答時間" : "Average service response interval across all hops", 
            icon: <Clock className="text-indigo-400" /> 
          },
          { 
            label: isZh ? "平均可用率服務 SLA" : isJa ? "平均可用率サービス SLA" : "Average Service SLA", 
            value: `${stats.avgSla}%`, 
            change: "-0.4%", 
            isUp: false, 
            desc: isZh ? "各端點正常狀態碼 (非5xx) 響應比率" : isJa ? "各エンドポイントの正常応答比率" : "Percentage of successful non-5xx database/HTTP responses", 
            icon: <CheckCircle2 className="text-emerald-400" /> 
          },
          { 
            label: isZh ? "微服務主體活動告警" : isJa ? "アクティブなアラート" : "Active Service Alarms", 
            value: stats.activeAlarms, 
            change: isZh ? "+2 條新告警" : isJa ? "+2件の新規アラート" : "+2 new alarms", 
            isUp: true, 
            desc: isZh ? "基於 Prometheus & Webhook 攔截警報" : isJa ? "PrometheusおよびWebhookの監視アラート" : "Telemetry alerts intercepted via Prometheus webhook", 
            icon: <AlertTriangle className="text-red-400" /> 
          }
        ].map((kpi, index) => (
          <div key={index} className="bg-[#0d0f14] border border-gray-800 p-5 rounded-2xl relative overflow-hidden group hover:border-gray-700 transition-all">
            <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center border border-gray-800/60">
              {kpi.icon}
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black font-mono block mb-1">
              {kpi.label}
            </span>
            <div className="flex items-end gap-3 mt-2">
              <h3 className="text-2xl font-black font-mono text-white">{kpi.value}</h3>
              <span className={`text-[10px] font-bold pb-1 font-mono ${
                index === 2 && env === 'prod' ? "text-amber-500" :
                index === 3 && Number(kpi.value) > 0 ? "text-red-400" : "text-green-400"
              }`}>
                {kpi.change}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-medium">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Core Recharts charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Latency Curves */}
        <div className="bg-[#0d0f14] border border-gray-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-200">
                {isZh ? '響應時間分佈趨勢 (Latency P-Curves Trend)' : isJa ? '応答時間推移 (Latency P-Curves Trend)' : 'Response Latency Trend (Latency P-Curves)'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">
                {isZh ? 'P99, P95, P90, Median 曲線分佈圖 (單位: 毫秒 ms)' : isJa ? 'P99, P95, P90, Median 分布 (単位: ミリ秒 ms)' : 'P99, P95, P90, Median curves (unit: ms)'}
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full font-mono border border-indigo-500/25">
              Spring MVC Tracer
            </span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rtTrend} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1f24" />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #1f2937', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '11px', color: '#fff' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="P99" stroke="#ef4444" strokeWidth={2} dot={false} name="P99 SLA Critical" />
                <Line type="monotone" dataKey="P95" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="P95 Warn" />
                <Line type="monotone" dataKey="P90" stroke="#6366f1" strokeWidth={1.5} dot={false} name="P90 Standard" />
                <Line type="monotone" dataKey="Median" stroke="#10b981" strokeWidth={1.5} dot={false} name="Median (50%)" />
                <ReferenceLine y={250} label={{ value: isZh ? 'SLO 警戒 (250ms)' : isJa ? 'SLOしきい値 (250ms)' : 'SLO Limit (250ms)', position: 'top', fill: '#ef4444', fontSize: 9 }} stroke="#ef4444" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: SLA and error rate bar combo */}
        <div className="bg-[#0d0f14] border border-gray-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-200">
                {isZh ? 'SLA 服務可用率曲線 (Service SLA & Error Rate)' : isJa ? 'SLA サービス可用性推移 (Service SLA & Error Rate)' : 'Service SLA & Uptime Rate'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">
                {isZh ? '整體微服務群 SLA 健康趨勢指標百分比 %' : isJa ? 'マイクロサービス全体のSLA健全性トレンド %' : 'Aggregated SLA health trend metrics percentage %'}
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full font-mono border border-emerald-500/25">
              99.85% SLA Avg
            </span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rtTrend} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1f24" />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis domain={[98, 100]} stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #1f2937', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '11px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="SLA" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#slaGradient)" name={isZh ? "SLA 成功率 %" : isJa ? "SLA 成功率 %" : "SLA Success Rate %"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables layout for slow SQL and slow endpoints */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Slow Database SQL metrics */}
        <div className="bg-[#0d0f14] border border-gray-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Database size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
                {isZh ? '慢 SQL 語句排行 Top SQL List' : isJa ? '低速 SQL クエリランキング Top SQL' : 'Slow Database Queries (Top SQL)'}
              </h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              {isZh ? '數據儲存層: PostgreSQL' : isJa ? 'データストレージ層: PostgreSQL' : 'Data Storage Layer: PostgreSQL'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#12141a] text-gray-500 text-[10px] tracking-wider uppercase">
                <tr>
                  <th className="p-3">{isZh ? '慢 SQL 語句元數據' : isJa ? '低速 SQL メタデータ' : 'Slow SQL Metadata'}</th>
                  <th className="p-3 text-center">{isZh ? '呼叫次數' : isJa ? '呼出回数' : 'Call Count'}</th>
                  <th className="p-3 text-right">{isZh ? '平均耗時' : isJa ? '平均時間' : 'Avg Duration'}</th>
                  <th className="p-3 text-right text-red-400">{isZh ? '最大耗時' : isJa ? '最大時間' : 'Max Time'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850/50">
                {slowSql.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-900/20 transition-colors">
                    <td className="p-3 max-w-[280px] break-words">
                      <span className="text-gray-400 font-bold block mb-1">[{row.db}]</span>
                      <span className="text-amber-400 text-[10.5px] leading-tight block">{row.sql}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-gray-300">{row.count}</td>
                    <td className="p-3 text-right text-gray-400">{row.avgTime}</td>
                    <td className="p-3 text-right font-black text-red-400">{row.maxTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Slow Endpoints and Errors metrics */}
        <div className="bg-[#0d0f14] border border-gray-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-rose-500" />
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
                {isZh ? '慢端點/高錯誤率排行 Top Endpoints' : isJa ? '低速エンドポイント/エラー率 Top Endpoints' : 'Slow Endpoints & Failures (Top List)'}
              </h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              {isZh ? 'OAP 自動分析計算結果' : isJa ? 'OAP 自動分析計算結果' : 'OAP Telemetry Analyses'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#12141a] text-gray-500 text-[10px] tracking-wider uppercase">
                <tr>
                  <th className="p-3">{isZh ? 'API 端點路徑' : isJa ? 'API エンドポイントパス' : 'API Endpoint Path'}</th>
                  <th className="p-3 text-center">{isZh ? '並行呼叫數' : isJa ? '並列呼出数' : 'Concurrencies'}</th>
                  <th className="p-3 text-center text-red-400">{isZh ? '平均錯誤率' : isJa ? '平均エラー率' : 'Mean Error Rate'}</th>
                  <th className="p-3 text-right">{isZh ? '響應時間' : isJa ? '応答時間' : 'Latency'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850/50">
                {slowEndpoints.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-900/20 transition-colors">
                    <td className="p-3">
                      <span className="text-blue-400 font-black text-[11px] block">{row.path}</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">{row.type}</span>
                    </td>
                    <td className="p-3 text-center text-gray-300 font-semibold">{row.count}</td>
                    <td className="p-3 text-center text-red-400 font-extrabold">{row.errorRate}</td>
                    <td className="p-3 text-right text-indigo-400 font-black">{row.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Heap Memory & JVM Resource Controls */}
      <div className="bg-[#0d0f14] border border-gray-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-blue-400" />
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
              {isZh ? 'JVM 實例微服務主體監控 (Instance Heap & GC Metrics)' : isJa ? 'JVM 監視インスタンスヒープ ＆ GC' : 'Service Instance Controls (JVM Heap & GC Metrics)'}
            </h3>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">Apache SkyWalking Language Agent (Java, Node.js, Go)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jvmServers.map((srv, index) => (
            <div key={index} className="p-4 bg-gray-950/40 border border-gray-850 rounded-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-900">
                <span className="text-xs font-mono font-bold text-gray-300 break-all">{srv.name}</span>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                <div>
                  <span className="text-gray-500 block">{isZh ? 'CPU 佔用率:' : isJa ? 'CPU使用率:' : 'CPU Utilization:'}</span>
                  <span className="text-white font-bold">{srv.cpu}%</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{isZh ? 'GC 次數:' : isJa ? 'GC回数:' : 'GC Cycles:'}</span>
                  <span className="text-amber-500 font-bold">{srv.gcCounts} {isZh ? '次' : isJa ? '回' : 'times'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{isZh ? '內存上限:' : isJa ? 'メモリ制限:' : 'Max Memory Allocated:'}</span>
                  <span className="text-gray-300">{srv.memoryMax}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{isZh ? 'GC 停頓停值:' : isJa ? 'GC 停止時間:' : 'GC Pause Latency:'}</span>
                  <span className="text-indigo-400 font-bold">{srv.gcPauses}</span>
                </div>
              </div>

              {/* Memory Heap slider representation */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">
                    {isZh ? 'Heap 內存使用比' : isJa ? 'ヒープメモリ使用率' : 'Heap Allocation Ratio'}
                  </span>
                  <span className="text-gray-300 font-bold">{srv.heapUsed}MB / {srv.heapMax}MB</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(srv.heapUsed / srv.heapMax) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

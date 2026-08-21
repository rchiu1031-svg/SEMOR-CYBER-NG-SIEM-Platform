import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Clock, 
  Layers, 
  Copy, 
  Check, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';
import { Trace, Span } from './ApmTypes';

interface ApmTracingViewProps {
  traces: Trace[];
  activeTrace: Trace;
  setActiveTrace: (t: Trace) => void;
  selectedSpan: Span | null;
  setSelectedSpan: (s: Span | null) => void;
  copiedText: boolean;
  onCopyText: (text: string) => void;
}

export const ApmTracingView: React.FC<ApmTracingViewProps> = ({
  traces,
  activeTrace,
  setActiveTrace,
  selectedSpan,
  setSelectedSpan,
  copiedText,
  onCopyText
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'error' | 'success'>('all');

  // Filter traces
  const filteredTraces = useMemo(() => {
    return traces.filter(t => {
      const matchesSearch = t.traceId.includes(searchQuery) || t.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'error') return t.statusCode >= 500;
      if (filterType === 'success') return t.statusCode < 500;
      return true;
    });
  }, [traces, searchQuery, filterType]);

  // AI Root Cause diagnosis simulation block
  const aiDiagnosis = useMemo(() => {
    const errorSpan = activeTrace.spans.find(s => s.status === 'Error');
    if (!errorSpan) {
      return {
        title: isZh ? "鏈路偵測狀態: 卓越運行 (Trace Healthy Baseline)" : isJa ? "トレース診断ステータス: 良好なベースライン" : "Trace Health Status: Optimal Baseline (Healthy)",
        summary: isZh 
          ? "經 Gemini APM 分析，此鏈路運行指標極度良好。全鏈路吞吐負載在 45ms 內，未產生任何 exceptions、TCP 延遲 或 ORM 鎖等待事宜。" 
          : isJa 
          ? "Gemini APM分析：このトレースの動作は良好です。全トランザクションが45ms以内でスループットされ、例外、TCP 遅延、または ORM ロック競合を検出しませんでした。" 
          : "Analyzed by Gemini APM engine: All transaction indices are stable. The full traversal finished within 45ms with zero active thread-locks, tcp hiccups, or ORM timeouts.",
        reasons: [
          isZh ? "各次級調用 (Sub-calls) 均擊中快取及最優 SQL 索引" : isJa ? "すべての従属呼び出し (Sub-calls) がキャッシュまたは最適なSQLインデックスにヒットしました" : "Every nested call/query hit active Redis cache or optimal DB index tables.",
          isZh ? "微服務 POD 分佈平均，網路 RTT 低於 1.5ms" : isJa ? "マイクロサービスPODは均等に負荷分散されており、ネットワークRTTは1.5ミリ秒未満です" : "Balanced Kubernetes Pod replicas with network RTT within 1.5ms."
        ],
        solution: isZh ? "建議保持目前的 JVM heap 垃圾回收策略與日誌採樣頻率調治。" : isJa ? "現在のJVMヒープガベージコレクション戦略とログサンプル頻度の継続を推奨します。" : "Keep current JVM GC sizing configs and log telemetry sampler rates."
      };
    }

    // Is order service error?
    if (errorSpan.serviceName.includes("order")) {
      return {
        title: isZh ? "檢測到 SkyWalking 拋出重大 Java 空指標根源 (Critical NullPointerException)" : isJa ? "重大な Java NullPointerException を検出しました" : "Critical NullPointerException detected via SkyWalking Tracer",
        summary: isZh 
          ? "Gemini AI 診斷引擎確認：此 Trace 於 10:15 被 gateway 拋出 HTTP 500 異常。主因是由於位於 order-center-service 在查詢數據庫時，因連線池耗竭 (HikariPool Data Source) 導致 Service 回傳了 null 物件，且程式並未進行 Null-Safety 保護，造成 NullPointerException 連鎖崩潰。" 
          : isJa 
          ? "Gemini AI 診断結果：このトレースは10:15にゲートウェイで HTTP 500 例外を発生させました。原因は order-center-serviceのデータベース読み込み時に接続プール（HikariPool）枯渇が発生し、null オブジェクトが返却された際に空データ保護を怠ったためカスケードクラッシュしたことによるものです。" 
          : "Gemini AI diagnostics confirmed: Gateway threw HTTP 500. Under heavy DB load, hikari-pool exhaustion caused order-center-service to fetch a NULL response pointer, Cascading NullPointerException along active call-stacks due to missing nullable guards.",
        reasons: [
          isZh ? "HikariCP 內存池最大連線值 (maximum-pool-size) 超載 (當前佔用 100%)" : isJa ? "HikariCP接続プールサイズ上限超過（現在の負荷 100%）" : "HikariCP datasource pool full (100% active connections in use)",
          isZh ? "在 OrderService.java 45 行處未對數據查詢對象調用 Optional.ofNullable() 安全解包" : isJa ? "OrderService.java 45行目で Optional.ofNullable() や nullチェックを行っていません" : "Missed Optional.ofNullable() safety-unwrap handling at OrderService.java code line 45"
        ],
        solution: isZh 
          ? "1. 於 order-center 部署配置中，將 hikari 的 connection-timeout 改增至 15000ms，增大 max-pool-size 至 35。\n2. 對 OrderService.java:45 進行空變量保護防禦程式：\n   if(dbResult == null) { throw new OrderFallbackException(\"Database timeout\"); }" 
          : isJa 
          ? "1. order-center配置で hikari の connection-timeout を 15000ms に延長し、max-pool-size を 35に増やします。\n2. OrderService.java:45 でデータ安全保護ガードを配置します:\n   if(dbResult == null) { throw new OrderFallbackException(\"Database timeout\"); }" 
          : "1. Expand Hikari connection-timeout config to 15000ms and increment max-pool-size to 35.\n2. Wrap line 45 of OrderService.java inside safe conditional checks:\n   if (dbResult == null) { throw new OrderFallbackException(\"Database timeout\"); }"
      };
    }

    return {
      title: isZh ? "上游或外部調用超時錯誤 (Upstream / External Outage SLA Violation)" : isJa ? "外部接続タイムアウトエラー (Upstream / External Outage SLA Violation)" : "Upstream/External Outage SLA Timeout Defect",
      summary: isZh 
        ? "發現由於 payment-service 請求外部 Stripe 原生閘道所造成的阻滯。高達 1510ms 的 HTTP 同步阻塞極大地拖累了 gateway 吞吐率，引發客戶端超時報警。" 
        : isJa 
        ? "payment-serviceからStripeの外部APIゲートウェイへのリクエストでボトルネックが検出されました。1510ms の HTTP動機同期遅延が gateway の処理を著しく阻害し、タイムアウトを引き起こしました。" 
        : "payment-service thread was delayed while invoking external Stripe payments API gateways. The 1510ms synchronous blocking bottleneck throttled the edge reverse-proxy gateway capacity.",
      reasons: [
        isZh ? "外部 Stripe Endpoint 回傳 RTT 達 1.5s，超過本機設定的 HTTP client Timeout 閥值" : isJa ? "外部Stripe呼び出しRTTが1.5sに達し、規定のHTTPクライアントタイムアウト値を超過しました" : "External Stripe endpoint RTT exceeded our configure's HTTP client threshold",
        isZh ? "下游未採用 Hystrix 或 Sentinel 熔斷限流降級保護" : isJa ? "HystrixやSentinelなどのサーキットブレーカー/フォールバック保護が未設定です" : "Lack of circuit-breakers fallback protections like Sentinel/Hystrix"
      ],
      solution: isZh 
        ? "1. 配置 @SentinelResource(fallback = \"fallbackPay\") 動態回退熔斷策略。\n2. 將外部 Stripe 連線置入非同步任務 ThreadPoolExecutor，避免核心線程池因調用三方阻塞產生連鎖雪崩。" 
        : isJa 
        ? "1. @SentinelResource(fallback = \"fallbackPay\") でサーキットブレーカーのフォールバックを設定します。\n2. Stripe APIの通信をThreadPoolExecutorによる非同期スレッドに移し、基幹プールへの同期伝播を防ぎます。" 
        : "1. Specify @SentinelResource(fallback = \"fallbackPay\") fallback patterns.\n2. Offload critical card payment execution logic to a custom ThreadPoolExecutor handler to avoid gateway threads cascade locking."
    };
  }, [activeTrace, isZh, isJa]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-[fadeIn_0.5s_ease-out] text-left">
      {/* Left Columns: Trace searching & matching lists */}
      <div className="space-y-4">
        <div className="bg-[#0d0f14] border border-gray-800 rounded-2xl p-4 flex flex-col gap-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isZh ? "輸入 Trace ID / API 端點路徑..." : isJa ? "Trace ID または APIパスを入力..." : "Search Trace ID / API endpoint route..."}
              className="w-full bg-[#12141a] border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs font-mono outline-none text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Quick status switches */}
          <div className="flex gap-2 p-1 bg-[#12141a] border border-gray-850 rounded-xl">
            {[
              { id: 'all', label: isZh ? '全部鏈路' : isJa ? 'すべてのトレース' : 'All Traces' },
              { id: 'error', label: isZh ? '含 Error (錯誤)' : isJa ? 'エラーあり' : 'With Errors' },
              { id: 'success', label: isZh ? '正常鏈路' : isJa ? '正常トレース' : 'Success Only' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition-all ${
                  filterType === f.id
                    ? "bg-gray-800 text-blue-400"
                    : "text-gray-500 hover:text-gray-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Scrollable List wrapper */}
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredTraces.length > 0 ? (
            filteredTraces.map((trace) => {
              const isSelected = activeTrace.traceId === trace.traceId;
              const hasError = trace.statusCode >= 500;

              return (
                <div
                  key={trace.traceId}
                  onClick={() => {
                    setActiveTrace(trace);
                    const firstErr = trace.spans.find(s => s.status === 'Error') || trace.spans[0];
                    setSelectedSpan(firstErr);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative group ${
                    isSelected 
                      ? "bg-blue-600/5 border-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.05)]" 
                      : "bg-[#0d0f14] border-gray-800 hover:border-gray-700 hover:bg-[#0f1218]/60"
                  }`}
                >
                  {/* Color strip indicating success or error */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${
                    hasError ? "bg-red-500" : "bg-green-500"
                  }`} />

                  <div className="flex justify-between items-start gap-4 pl-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-blue-400 font-bold block">
                        Trace ID: {trace.traceId}
                      </span>
                      <span className="text-xs font-mono font-black text-white block break-all">
                        {trace.endpoint}
                      </span>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase ${
                      hasError ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-green-500/15 text-green-400 border border-green-500/20"
                    }`}>
                      {hasError ? `Error ${trace.statusCode}` : "Success"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[10.5px] text-gray-500 mt-3 pl-1 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock size={11} />
                      <span>{isZh ? '總時長:' : isJa ? '合計時間:' : 'Duration:'} <strong className="text-gray-300 font-bold">{trace.totalDuration}ms</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers size={11} />
                      <span>{isZh ? '層級:' : isJa ? '階層:' : 'Spans:'} <strong className="text-gray-300 font-bold">{trace.serviceCount} {isZh ? '階' : isJa ? '層' : 'steps'}</strong></span>
                    </div>
                  </div>

                  <div className="text-[9.5px] text-gray-600 pl-1 mt-1 font-mono">
                    {isZh ? '調用時間:' : isJa ? '呼出時刻:' : 'Timestamp:'} {trace.startTime}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-[#0d0f14] border border-gray-800 rounded-2xl text-xs text-gray-500 italic font-mono">
              {isZh ? '沒有找到相符的 Trace 鏈路數據。' : isJa ? '該当するトレースデータが見つかりません。' : 'No matching trace records found.'}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Detailed Gantt Chart View */}
      <div className="xl:col-span-2 bg-[#0d0f14] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between min-h-[580px]">
        <div>
          {/* Header */}
          <div className="pb-5 border-b border-gray-800 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-gray-500 font-bold block">
                {isZh ? '分佈式調用鏈條結構拓撲圖 (Distributed Gantt Tree Stacktrace)' : isJa ? '分散トレース・ガントチャート階層グラフ' : 'Distributed Gantt Chart Stacktrace Topology'}
              </span>
              <h3 className="text-sm font-bold text-white font-mono break-all leading-relaxed mt-1">
                {activeTrace.endpoint}
              </h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onCopyText(activeTrace.traceId)}
                className="px-2.5 py-1 bg-gray-900 border border-gray-850 hover:bg-gray-850 rounded-lg text-[10px] font-mono font-bold text-gray-400 hover:text-white transition-all flex items-center gap-1"
              >
                {copiedText ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                <span>{copiedText ? (isZh ? "已複製" : isJa ? "コピー済" : "Copied") : (isZh ? "複製 ID" : isJa ? "IDをコピー" : "Copy Trace ID")}</span>
              </button>
              <span className="px-2.5 py-1 bg-blue-600/10 text-blue-400 text-[10px] font-mono font-bold rounded-lg border border-blue-500/25">
                {activeTrace.totalDuration}ms / {activeTrace.serviceCount} Services
              </span>
            </div>
          </div>

          {/* Gantt Stack */}
          <div className="space-y-4 pt-5">
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] text-gray-500 font-mono pb-2 border-b border-gray-850/60">
                <span>{isZh ? '調用生命週期' : isJa ? 'ライフサイクル' : 'Span Lifecycle Timeline'}</span>
                <span>0ms</span>
                <span>{activeTrace.totalDuration}ms</span>
              </div>

              <div className="relative mt-3 space-y-2.5">
                {activeTrace.spans.map((span) => {
                  const isSpanSelected = selectedSpan?.spanId === span.spanId;
                  const leftPercent = (span.startTime / activeTrace.totalDuration) * 100;
                  const widthPercent = (span.duration / activeTrace.totalDuration) * 100;

                  // Determine colors
                  let colorClass = "bg-blue-500";
                  if (span.serviceName.includes("gateway")) {
                    colorClass = "bg-sky-500";
                  } else if (span.serviceName.includes("order")) {
                    colorClass = "bg-indigo-500";
                  } else if (span.serviceName.includes("auth")) {
                    colorClass = "bg-purple-500";
                  } else if (span.serviceName.includes("payment")) {
                    colorClass = "bg-pink-500";
                  } else {
                    colorClass = "bg-teal-500";
                  }

                  if (span.status === 'Error') {
                    colorClass = "bg-red-500";
                  }

                  return (
                    <div
                      key={span.spanId}
                      onClick={() => setSelectedSpan(span)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 select-none ${
                        isSpanSelected 
                          ? "bg-gray-850/90 border-blue-500/80 shadow-md" 
                          : "bg-gray-950/40 border-gray-850 hover:bg-gray-900/40"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          {span.parentSpanId !== -1 && (
                            <ChevronRight size={10} className="text-gray-600" />
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                            span.status === 'Error' ? "bg-red-500/10 text-red-400" : "bg-gray-800 text-gray-400"
                          }`}>
                            {span.type}
                          </span>
                          <strong className="text-gray-200">{span.serviceName}</strong>
                          <span className="text-gray-500 max-w-[200px] truncate">{span.endpoint}</span>
                        </div>

                        <span className="text-gray-450 font-bold">{span.duration}ms</span>
                      </div>

                      {/* Sliding Gantt Bar representation */}
                      <div className="w-full h-1.5 bg-gray-900 rounded-full relative overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${colorClass} transition-all duration-300`}
                          style={{
                            marginLeft: `${leftPercent}%`,
                            width: `${Math.max(widthPercent, 3.5)}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Attributes details card paired with Gemini AI diagnostics response info */}
        <div className="mt-8 pt-6 border-t border-gray-800 gap-6 grid grid-cols-1 lg:grid-cols-2 text-left">
          {/* Attributes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-850 pb-2">
              <span className="text-[11px] uppercase font-black text-white tracking-widest font-mono">
                {isZh ? '選定節點屬性 attributes' : isJa ? '選択されたスパンの属性' : 'Selected Span Attributes'}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Span ID: {selectedSpan?.spanId}</span>
            </div>

            {selectedSpan ? (
              <div className="space-y-2 text-[10.5px] font-mono leading-relaxed">
                <div className="flex justify-between py-1 border-b border-gray-900">
                  <span className="text-gray-500">Service:</span>
                  <span className="text-white font-bold">{selectedSpan.serviceName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-900">
                  <span className="text-gray-500">Endpoint:</span>
                  <span className="text-white font-bold break-all max-w-[180px] text-right">{selectedSpan.endpoint}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-900">
                  <span className="text-gray-500">Component:</span>
                  <span className="text-indigo-400">{selectedSpan.component || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-900">
                  <span className="text-gray-500">Peer Address:</span>
                  <span className="text-gray-400">{selectedSpan.peer || "N/A"}</span>
                </div>

                {/* DB SQL */}
                {selectedSpan.sql && (
                  <div className="p-3 bg-black/60 border border-amber-500/20 rounded-xl space-y-1.5 mt-2">
                    <span className="text-[9.5px] font-extrabold text-amber-500 block">DATABASE SQL STRUCT:</span>
                    <code className="text-[10px] text-amber-400 whitespace-pre-wrap select-all block leading-normal break-all font-mono">
                      {selectedSpan.sql}
                    </code>
                  </div>
                )}

                {/* HTTP Headers */}
                {selectedSpan.httpHeaders && (
                  <div className="p-3 bg-black/60 border border-indigo-500/25 rounded-xl space-y-1 mt-2">
                    <span className="text-[9.5px] font-extrabold text-indigo-400 block">HTTP HEADERS METADATA:</span>
                    <div className="text-[9.5px] text-gray-400 space-y-1 overflow-x-auto max-h-24 font-mono">
                      {Object.entries(selectedSpan.httpHeaders).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-gray-905 pb-0.5">
                          <span className="text-gray-500 font-bold">{k}:</span>
                          <span className="text-gray-300 break-all text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stacktrace error */}
                {selectedSpan.status === 'Error' && selectedSpan.errorLog && (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1.5 mt-2">
                    <span className="text-[10px] font-black text-red-400 block">[!] EXCEPTION STACKTRACE LOG:</span>
                    <pre className="text-[9px] text-red-300 whitespace-pre-wrap select-all overflow-y-auto max-h-36 font-mono leading-relaxed bg-black/50 p-2.5 rounded-lg border border-red-950">
                      {selectedSpan.errorLog}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic py-4 font-mono">
                {isZh ? '請點選 Gantt 樹狀圖節點查看屬性' : isJa ? 'ガントチャートのノードをクリックして属性を表示します' : 'Click a Gantt chart node to inspect properties.'}
              </p>
            )}
          </div>

          {/* Gemini AI RCA Diagnostic */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 border-b border-gray-850 pb-2">
              <Sparkles size={13} className="text-blue-400 animate-pulse" />
              <span className="text-[11px] uppercase font-black text-white tracking-widest font-mono">
                {isZh ? 'Gemini Co-Pilot 智能根因分析 (AI RCA)' : isJa ? 'Gemini Co-Pilot AI根本原因追究 (AI RCA)' : 'Gemini Co-Pilot Intelligent Root Cause Analysis (AI RCA)'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/10 via-[#0c0f16] to-[#0c0f16] border border-blue-500/20 space-y-3 leading-relaxed">
              <h4 className="text-xs font-bold font-mono text-blue-400 italic">
                {aiDiagnosis.title}
              </h4>
              
              <p className="text-[10.5px] text-gray-300 leading-normal font-mono">
                {aiDiagnosis.summary}
              </p>

              <ul className="space-y-1.5 pl-3 list-disc text-[10px] text-gray-400 font-mono">
                {aiDiagnosis.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>

              <div className="p-2.5 rounded bg-black/60 border border-blue-900 border-l-2 border-l-blue-400 text-[10px] font-mono text-gray-300 whitespace-pre-line mt-3">
                {aiDiagnosis.solution}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SearchX, 
  Shield, 
  ShieldAlert, 
  Server, 
  Terminal, 
  Globe, 
  Cpu, 
  Trash2, 
  Eye, 
  Play, 
  X, 
  Copy, 
  Download, 
  Layers, 
  Check, 
  AlertCircle,
  Clock,
  Tag,
  ArrowRight,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { DecoderItem } from './types';
import { FIELD_TYPE_COLORS } from './decoderData';

interface DecoderLibraryListProps {
  decoders: DecoderItem[];
  onSelectDecoderToLoad: (decoder: DecoderItem) => void;
  onDeleteCustomDecoder: (id: string) => void;
  isReadOnly?: boolean;
  onDeployDecoderToProduction?: (decoder: DecoderItem) => void;
  activeProductionDecoderName?: string;
}

export const DecoderLibraryList: React.FC<DecoderLibraryListProps> = ({
  decoders,
  onSelectDecoderToLoad,
  onDeleteCustomDecoder,
  isReadOnly = false,
  onDeployDecoderToProduction,
  activeProductionDecoderName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'custom' | 'firewall' | 'os' | 'web' | 'ids'>('all');
  const [activeModalDecoder, setActiveModalDecoder] = useState<DecoderItem | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<{ name: string; match: string; success: boolean }[]>([]);
  const [copiedJson, setCopiedJson] = useState(false);

  const filteredDecoders = useMemo(() => {
    return decoders.filter(d => {
      const matchQuery = 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.tags && d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchCategory = 
        categoryFilter === 'all' 
          ? true 
          : categoryFilter === 'custom' 
          ? !!d.isCustom 
          : d.category === categoryFilter;

      return matchQuery && matchCategory;
    });
  }, [decoders, searchQuery, categoryFilter]);

  const renderIcon = (type?: string) => {
    switch (type) {
      case 'shield-red':
        return <Shield className="w-5 h-5 text-red-400" />;
      case 'shield-orange':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'server-blue':
        return <Server className="w-5 h-5 text-blue-400" />;
      case 'server-purple':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'globe-emerald':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'terminal-cyan':
      default:
        return <Terminal className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleRunTest = (decoder: DecoderItem) => {
    const raw = testInput.trim() || decoder.sampleLog || '';
    if (!raw) return;

    const results = decoder.fields.map(f => {
      try {
        const re = new RegExp(f.regex);
        const m = raw.match(re);
        return {
          name: f.name,
          match: m ? (m[1] !== undefined ? m[1] : m[0]) : '(未匹配)',
          success: !!m
        };
      } catch {
        return {
          name: f.name,
          match: '(正規表達式無效)',
          success: false
        };
      }
    });

    setTestResults(results);
  };

  return (
    <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header with Search and Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white tracking-tight">
              解碼器規則庫與標準範本
            </h3>
            <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
              {filteredDecoders.length} / {decoders.length} 組
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            收錄主流次世代防火牆、作業系統稽核、網頁伺服器與入侵偵測之預設解碼邏輯。
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋名稱、廠牌或標籤..."
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: '全部解碼器' },
          { id: 'custom', label: '自訂規則' },
          { id: 'firewall', label: '次世代防火牆 (NGFW)' },
          { id: 'os', label: '作業系統稽核 (OS/Syslog)' },
          { id: 'web', label: 'Web 伺服器 / WAF' },
          { id: 'ids', label: '入侵偵測 (IDS/IPS)' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id as any)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              categoryFilter === cat.id
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-black/30 text-gray-400 border border-gray-800 hover:text-white"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Decoders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDecoders.map((dec) => (
          <div
            key={dec.id}
            className="p-5 bg-black/40 border border-gray-800/90 rounded-2xl hover:border-gray-700 hover:bg-black/60 transition-all flex flex-col justify-between group space-y-4 relative"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 group-hover:border-cyan-500/30 transition-colors shrink-0 mt-0.5">
                    {renderIcon(dec.iconType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {dec.name}
                      </h4>
                      {dec.name === activeProductionDecoderName && (
                        <span className="px-1.5 py-0.2 text-[8px] font-mono font-black uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 size={9} className="text-emerald-400" />
                          生產生效中
                        </span>
                      )}
                      {dec.isCustom && (
                        <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          自訂
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                      {dec.brand} • {dec.version}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {dec.isCustom && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomDecoder(dec.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="刪除自訂解碼器"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalDecoder(dec);
                      setTestInput(dec.sampleLog || '');
                      setTestResults([]);
                    }}
                    className="p-1.5 text-gray-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
                    title="檢視詳細規則與測試沙盒"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                {dec.description}
              </p>

              {/* Tags */}
              {dec.tags && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {dec.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-900 text-gray-400 border border-gray-800 rounded-md text-[9px] font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Metrics & Load Action */}
            <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <span>{dec.fields.length} 欄位</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-400/80">
                  <Clock size={10} /> {dec.avgParseMicros || 4.2} μs
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {onDeployDecoderToProduction && (
                  <button
                    type="button"
                    onClick={() => onDeployDecoderToProduction(dec)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                      dec.name === activeProductionDecoderName
                        ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-gray-800/90 hover:bg-emerald-600/20 text-gray-300 hover:text-emerald-300 border border-gray-750 hover:border-emerald-500/30"
                    )}
                    title="將此解碼器規則透過 UDS 即時部署至 Rust 核心"
                  >
                    <Zap size={11} className={dec.name === activeProductionDecoderName ? "text-yellow-300 fill-yellow-300" : "text-gray-400"} />
                    <span>{dec.name === activeProductionDecoderName ? "已生效" : "部署"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectDecoderToLoad(dec)}
                  className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>載入</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDecoders.length === 0 && (
        <div className="h-60 flex flex-col items-center justify-center text-gray-600">
          <SearchX size={36} className="mb-3 opacity-30 text-gray-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            查無符合搜尋條件之解碼器規則
          </p>
        </div>
      )}

      {/* Decoder Detail & Sandbox Modal */}
      <AnimatePresence>
        {activeModalDecoder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 text-cyan-400">
                    {renderIcon(activeModalDecoder.iconType)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      {activeModalDecoder.name}
                      <span className="text-xs font-mono font-bold text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                        {activeModalDecoder.version}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{activeModalDecoder.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalDecoder(null)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {/* Live Matcher Playground */}
                <div className="p-5 bg-black/50 border border-gray-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider">
                      <Play size={14} /> 即時日誌匹配測試沙盒 (Live Parser Sandbox)
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRunTest(activeModalDecoder)}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/20"
                    >
                      <Play size={12} /> 執行解析驗證
                    </button>
                  </div>

                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="在此貼上日誌字串以測試本解碼器..."
                    className="w-full h-24 bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-200 outline-none focus:border-cyan-500 custom-scrollbar resize-none"
                  />

                  {testResults.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-800/80">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        匹配測試結果：
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {testResults.map((tr, i) => (
                          <div
                            key={i}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2",
                              tr.success
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                                : "bg-red-950/20 border-red-500/30 text-red-400"
                            )}
                          >
                            <span className="font-bold text-gray-300">{tr.name}</span>
                            <span className="font-mono text-[11px] truncate max-w-[200px]" title={tr.match}>
                              {tr.match}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fields Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-wider">
                    <span>欄位正規化對照表 ({activeModalDecoder.fields.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(activeModalDecoder.fields, null, 2));
                        setCopiedJson(true);
                        setTimeout(() => setCopiedJson(false), 2000);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold lowercase"
                    >
                      {copiedJson ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedJson ? '已複製' : 'copy json'}</span>
                    </button>
                  </div>

                  <div className="border border-gray-800 rounded-2xl overflow-hidden bg-black/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-900/80 border-b border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3">欄位名稱</th>
                          <th className="px-4 py-3">資料型態</th>
                          <th className="px-4 py-3">ECS 映射</th>
                          <th className="px-4 py-3">樣本數值</th>
                          <th className="px-4 py-3">正規表達式</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80">
                        {activeModalDecoder.fields.map((f, fi) => (
                          <tr key={fi} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 font-bold text-cyan-400 font-mono">{f.name}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-900 text-gray-300 border border-gray-800 uppercase">
                                {f.type || 'string'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-purple-400">
                              {f.ecsMapping || '-'}
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-300 max-w-[150px] truncate" title={f.value}>
                              {f.value || '-'}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-gray-400 max-w-[200px] truncate" title={f.regex}>
                              {f.regex}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-black/40">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDecoderToLoad(activeModalDecoder);
                      setActiveModalDecoder(null);
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-900/30"
                  >
                    <span>載入此解碼器至工作區編輯</span>
                    <ArrowRight size={13} />
                  </button>

                  {onDeployDecoderToProduction && activeModalDecoder && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeployDecoderToProduction(activeModalDecoder);
                        setActiveModalDecoder(null);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                    >
                      <Zap size={13} className="text-yellow-300 fill-yellow-300" />
                      <span>立即部署至生產引擎</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalDecoder(null)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  關閉
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

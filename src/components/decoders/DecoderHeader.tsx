import React from 'react';
import { 
  Binary, 
  Layers, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Download, 
  Upload, 
  RefreshCw, 
  Sliders, 
  Filter, 
  PlaySquare, 
  Database,
  Cpu
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DecoderItem } from './types';

interface DecoderHeaderProps {
  currentTab: 'workspace' | 'library' | 'benchmark';
  onChangeTab: (tab: 'workspace' | 'library' | 'benchmark') => void;
  allDecoders: DecoderItem[];
  customDecodersCount: number;
  activeFilterCount: number;
  extractedFieldCount: number;
  onExportAll: () => void;
  onResetWorkspace: () => void;
}

export const DecoderHeader: React.FC<DecoderHeaderProps> = ({
  currentTab,
  onChangeTab,
  allDecoders,
  customDecodersCount,
  activeFilterCount,
  extractedFieldCount,
  onExportAll,
  onResetWorkspace
}) => {
  return (
    <div className="space-y-6">
      {/* Top Title & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              日誌解碼與正規化工作平台
              <span className="text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                NG-SIEM Log Normalizer
              </span>
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            視覺化文字點選即刻轉化過濾器與正規化欄位，支援彈性 Regex / Grok 規則編排、ECS/OCSF 映射與多廠牌解碼庫。
          </p>
        </div>

        {/* Mode Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#111114] border border-gray-800 p-1 rounded-2xl flex items-center gap-1 shadow-lg">
            <button
              type="button"
              onClick={() => onChangeTab('workspace')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                currentTab === 'workspace'
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Binary size={14} />
              <span>互動標註工作區</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('library')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                currentTab === 'library'
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Database size={14} />
              <span>解碼器規則庫 ({allDecoders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('benchmark')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                currentTab === 'benchmark'
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Cpu size={14} />
              <span>管線效能評測</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExportAll}
            className="px-3 py-1.5 bg-[#111114] hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            <span>匯出規則備份</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI / Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400 shrink-0">
            <Database size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              活躍解碼器總量
            </div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {allDecoders.length} <span className="text-xs font-normal text-cyan-400">組</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              內建 {allDecoders.length - customDecodersCount} / 自訂 {customDecodersCount}
            </div>
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              即時吞吐能力
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              245,000 <span className="text-xs font-normal text-gray-400">EPS</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 font-medium">
              高效 C-Binding 引擎
            </div>
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-400 shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              工作區欄位標籤
            </div>
            <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
              {extractedFieldCount} <span className="text-xs font-normal text-gray-400">個欄位</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              支援 ECS 綱要映射
            </div>
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-amber-400 shrink-0">
            <Filter size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              活躍過濾器規則
            </div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {activeFilterCount} <span className="text-xs font-normal text-gray-400">條過濾條件</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              點擊日誌文字即時套用
            </div>
          </div>
        </div>

        <div className="bg-[#111114] border border-gray-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 text-blue-400 shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              平均解析微秒
            </div>
            <div className="text-lg font-black text-blue-300 font-mono mt-0.5">
              3.8 <span className="text-xs font-normal text-gray-400">μs / 事件</span>
            </div>
            <div className="text-[10px] text-blue-400/80 font-medium">
              超低延遲管線
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

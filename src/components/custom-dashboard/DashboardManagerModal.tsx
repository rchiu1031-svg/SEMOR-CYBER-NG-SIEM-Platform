import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Star, 
  LayoutDashboard, 
  CheckCircle2, 
  FolderKanban,
  FileCode,
  Tag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DashboardTemplate, DashboardCategory } from './types';

interface DashboardManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboards: DashboardTemplate[];
  currentDashboardId: string;
  onSelectDashboard: (id: string) => void;
  onCreateDashboard: (name: string, description: string, category: DashboardCategory, tags: string[]) => void;
  onCloneDashboard: (sourceId: string) => void;
  onDeleteDashboard: (id: string) => void;
  onSetDefaultDashboard: (id: string) => void;
  onImportDashboard: (jsonString: string) => void;
}

export const DashboardManagerModal: React.FC<DashboardManagerModalProps> = ({
  isOpen,
  onClose,
  dashboards,
  currentDashboardId,
  onSelectDashboard,
  onCreateDashboard,
  onCloneDashboard,
  onDeleteDashboard,
  onSetDefaultDashboard,
  onImportDashboard
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<DashboardCategory>('Custom');
  const [newTags, setNewTags] = useState('SOC, Custom');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const tagArray = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    onCreateDashboard(newName.trim(), newDesc.trim(), newCat, tagArray);
    setIsCreatingNew(false);
    setNewName('');
    setNewDesc('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportDashboard(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-800 bg-[#16161c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">儀表板管理中心 (Dashboard Workspaces)</h3>
              <p className="text-xs text-gray-400">建立自訂戰情室、複製範本、匯入/匯出 JSON 配置檔</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-b border-gray-800/80 bg-[#141418] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              {isCreatingNew ? '取消建立' : '建立全新空白儀表板'}
            </button>

            <label className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              匯入 JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <span className="text-xs text-gray-400 font-mono">
            共 {dashboards.length} 組儀表板
          </span>
        </div>

        {/* Create Form Drawer */}
        {isCreatingNew && (
          <form onSubmit={handleCreateSubmit} className="p-5 border-b border-gray-800 bg-[#16161f] space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-sm font-bold text-blue-400">建立新儀表板</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-bold mb-1">儀表板名稱 *</label>
                <input
                  type="text"
                  placeholder="例如: 核心資料庫與 API 防護戰情"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-1">分類類別</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as DashboardCategory)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="SOC Triage">SOC Triage</option>
                  <option value="Incident Response">Incident Response</option>
                  <option value="Cloud & K8s">Cloud & K8s</option>
                  <option value="Zero Trust">Zero Trust</option>
                  <option value="Network & Flow">Network & Flow</option>
                  <option value="Custom">自訂分類 (Custom)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 font-bold mb-1">簡要敘述</label>
              <input
                type="text"
                placeholder="說明此戰情室之主要監控面向與指標"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg font-semibold"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold shadow-md shadow-blue-600/20"
              >
                確認新增
              </button>
            </div>
          </form>
        )}

        {/* Dashboards List */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {dashboards.map((dash) => {
            const isCurrent = dash.id === currentDashboardId;

            return (
              <div
                key={dash.id}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  isCurrent 
                    ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-600/5" 
                    : "bg-[#16161c] border-gray-800 hover:border-gray-700"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-blue-400 mt-1">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {dash.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                        {dash.category}
                      </span>
                      {dash.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          預設
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
                      {dash.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500 font-mono">
                      <span>{dash.widgets.length} 個組件</span>
                      <span>•</span>
                      <span>作者: {dash.author}</span>
                      <span>•</span>
                      <span>更新: {dash.lastModified}</span>
                    </div>
                  </div>
                </div>

                {/* Row Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isCurrent ? (
                    <button
                      onClick={() => {
                        onSelectDashboard(dash.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      載入使用
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold">
                      使用中
                    </span>
                  )}

                  <button
                    onClick={() => onCloneDashboard(dash.id)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    title="複製此儀表板"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSetDefaultDashboard(dash.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      dash.isDefault 
                        ? "bg-amber-500/20 text-amber-400" 
                        : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400"
                    )}
                    title="設為登入預設儀表板"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>

                  {dash.isCustom && (
                    <button
                      onClick={() => onDeleteDashboard(dash.id)}
                      className="p-2 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                      title="刪除自訂儀表板"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#141418] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

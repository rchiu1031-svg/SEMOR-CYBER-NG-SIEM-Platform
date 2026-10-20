import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  Mail, 
  Hash, 
  Clock, 
  Settings2, 
  Layout, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Filter, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { siemService } from '../services/siemService';

interface UserSettingsViewProps {
  currentUser: any;
  isReadOnly?: boolean;
}

const AVAILABLE_MODULES = [
  { id: 'dashboard', name: '戰情總覽中心', desc: '全域安全態勢與核心 KPI 監控看板' },
  { id: 'discovery', name: '資產探測與拓樸', desc: '內網主動掃描、MAC/OUI 與設備指紋識別' },
  { id: 'flow', name: 'NDR 流量威脅分析', desc: 'NetFlow 協定深析、DNS 隧道與異常流量研判' },
  { id: 'endpoint', name: 'XDR 終端防護與隔離', desc: 'EDR 代理監控、處理序行為取證與網路隔離' },
  { id: 'malware-analysis', name: '惡意程式鑑識分析', desc: '沙箱動態分析、YARA 特徵比對與 Shellcode 萃取' },
  { id: 'vulnerability', name: '弱點與 CVE 管理', desc: '漏洞資料庫比對、CVSS 風險評估與修補追蹤' },
  { id: 'soar', name: 'SOAR 自動化應變', desc: '自動化防禦 Playbook、工單流轉與聯防阻斷' },
  { id: 'intel', name: 'CTI 威脅情報中心', desc: 'STIX/TAXII 情資匯流、IOC 比對與 APT 追蹤' },
  { id: 'digital-forensics', name: '數位鑑識與封包還原', desc: 'Raw PCAP 封包重組與取證歷史追蹤' }
];

export default function UserSettingsView({ currentUser, isReadOnly = false }: UserSettingsViewProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'zh';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any | null>(null);
  const [selectedUserForModules, setSelectedUserForModules] = useState<any | null>(null);
  const [selectedUserForSchedule, setSelectedUserForSchedule] = useState<any | null>(null);
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'viewer',
    email: '',
    department: '資安營運部 (SOC)',
    modules: ['dashboard', 'flow', 'discovery']
  });
  const [isNewUserPasswordVisible, setIsNewUserPasswordVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await siemService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      alert('請輸入使用者帳號名稱與密碼！');
      return;
    }

    try {
      await siemService.addUser(newUser);
      setIsAddingUser(false);
      setNewUser({
        username: '',
        password: '',
        role: 'viewer',
        email: '',
        department: '資安營運部 (SOC)',
        modules: ['dashboard', 'flow', 'discovery']
      });
      loadUsers();
      showToast(`已成功建立使用者「${newUser.username}」之存取權限！`);
    } catch (err) {
      alert('新增使用者失敗，請確認帳號名稱是否重複。');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (username === 'supervisor' || username === 'admin') {
      alert('系統核心管理員帳號不可刪除！');
      return;
    }

    if (window.confirm(`確定要永久刪除使用者「${username}」的帳號與所有存取權限嗎？此動作無法還原。`)) {
      try {
        await siemService.deleteUser(id);
        loadUsers();
        showToast(`已刪除使用者「${username}」！`);
      } catch (err) {
        alert('刪除使用者失敗');
      }
    }
  };

  const handleUpdateUser = async (id: string, updates: any, successNote?: string) => {
    try {
      await siemService.updateUser(id, updates);
      loadUsers();
      if (successNote) showToast(successNote);
    } catch (err) {
      alert('更新使用者權限失敗');
    }
  };

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'Active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalCount = users.length;
  const adminCount = users.filter(u => u.role === 'supervisor' || u.role === 'admin').length;
  const analystCount = users.filter(u => u.role === 'editor').length;
  const auditorCount = users.filter(u => u.role === 'auditor' || u.role === 'viewer').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-400" size={18} />
            <span className="text-xs font-bold font-mono">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-black/30 rounded-lg text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">總使用者主體數</span>
            <span className="text-2xl font-black text-white italic mt-1 block">{totalCount} <span className="text-xs font-normal text-gray-500">個帳號</span></span>
          </div>
          <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-400">
            <Users size={22} />
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isZh ? "特權與管理員" : isJa ? "特権管理者" : "Privileged & Admin"}</span>
            <span className="text-2xl font-black text-red-400 italic mt-1 block">{adminCount} <span className="text-xs font-normal text-gray-500">個帳號</span></span>
          </div>
          <div className="p-3 bg-red-600/10 rounded-xl border border-red-500/20 text-red-400">
            <ShieldAlert size={22} />
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isZh ? "資安分析與維運專家" : isJa ? "セキュリティアナリスト" : "Security Analyst"}</span>
            <span className="text-2xl font-black text-purple-400 italic mt-1 block">{analystCount} <span className="text-xs font-normal text-gray-500">個帳號</span></span>
          </div>
          <div className="p-3 bg-purple-600/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isZh ? "法遵稽核與檢視員" : isJa ? "監査員・閲覧者" : "Auditor & Viewer"}</span>
            <span className="text-2xl font-black text-emerald-400 italic mt-1 block">{auditorCount} <span className="text-xs font-normal text-gray-500">個帳號</span></span>
          </div>
          <div className="p-3 bg-emerald-600/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* Main Users Table Container */}
      <div className="bg-[#0d0d0f] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white/[0.02] to-transparent">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-white italic tracking-wider uppercase">
                  {isZh ? "使用者存取矩陣與 RBAC 角色權限清冊 (User Access Matrix)" : isJa ? "ユーザーアクセス行列とRBAC権限一覧 (User Access Matrix)" : "User Access Matrix & RBAC Permissions"}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5">
                  {isZh ? "管理本機安全主體、所屬部門、分層角色存取層級 (RBAC) 與功能模組授權範圍。" : isJa ? "ローカルプリンシパル、所属部門、RBACロールアクセス権限、モジュール認可範囲を管理します。" : "Manage local security principals, departments, RBAC role privileges, and module access permissions."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isZh ? "搜尋帳號、信箱或部門..." : isJa ? "アカウント、メール、部署を検索..." : "Search account, email or department..."}
                className="bg-black/50 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-500 w-48 sm:w-60 transition-all font-sans"
              />
            </div>

            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-black/50 border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-300 outline-none focus:border-blue-500 uppercase"
            >
              <option value="ALL">所有角色 (All Roles)</option>
              <option value="supervisor">超級管理員 (Supervisor)</option>
              <option value="admin">系統管理員 (Admin)</option>
              <option value="editor">分析專家 (Editor)</option>
              <option value="auditor">獨立稽核員 (Auditor)</option>
              <option value="viewer">一般檢視員 (Viewer)</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/50 border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-300 outline-none focus:border-blue-500 uppercase"
            >
              <option value="ALL">所有狀態 (All Status)</option>
              <option value="Active">正常啟用中 (Active)</option>
              <option value="Disabled">已停用存取 (Disabled)</option>
            </select>

            {!isReadOnly && (
              <button 
                onClick={() => setIsAddingUser(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0"
              >
                <UserPlus size={14} />
                <span>{isZh ? "新增使用者" : isJa ? "ユーザー新規作成" : "Add User"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-black/40 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <th className="px-6 py-4 font-black">安全主體識別 (Principal Identity)</th>
                <th className="px-6 py-4 font-black">所屬部門 (Department)</th>
                <th className="px-6 py-4 font-black">RBAC 權限角色 (Role)</th>
                <th className="px-6 py-4 font-black">授權模組與範圍 (Scope)</th>
                <th className="px-6 py-4 font-black">帳號狀態 (Status)</th>
                {!isReadOnly && <th className="px-6 py-4 font-black text-right">操作與設定 (Actions)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-xs">
                    查無符合條件的使用者帳號
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSupervisor = u.role === 'supervisor';
                  const isAdmin = u.role === 'admin';
                  const isEditor = u.role === 'editor';
                  const isAuditor = u.role === 'auditor';
                  const isUserActive = (u.status || 'Active') === 'Active';

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all shrink-0",
                            isSupervisor ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]" :
                            isAdmin ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                            isEditor ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                            isAuditor ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                            "bg-gray-800 border-gray-700 text-gray-400 group-hover:text-blue-400 group-hover:border-blue-500/30"
                          )}>
                            <User size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white text-xs tracking-wide">{u.username}</p>
                              {u.username === currentUser.username && (
                                <span className="px-1.5 py-0.2 text-[9px] bg-blue-500/20 text-blue-300 rounded font-bold">目前登入</span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-gray-500 mt-0.5">{u.email || '未設定電子郵件'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-300">{u.department || '全域通用 (GLOBAL)'}</span>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5",
                          isSupervisor ? "bg-red-500/10 text-red-400 border-red-500/30" :
                          isAdmin ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                          isEditor ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                          isAuditor ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                          "bg-gray-800 text-gray-400 border-gray-700"
                        )}>
                          <Shield size={11} />
                          {isSupervisor ? '超級管理員 (Supervisor)' :
                           isAdmin ? '系統管理員 (Admin)' :
                           isEditor ? '資安分析專家 (Editor)' :
                           isAuditor ? '法遵稽核員 (Auditor)' :
                           '唯讀檢視員 (Viewer)'}
                        </span>
                      </td>

                      {/* Modules Scope */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Layers size={13} className={isSupervisor ? "text-red-400" : "text-blue-400"} />
                          <span className="text-xs text-gray-300 font-bold">
                            {isSupervisor ? '全模組極限存取 (全域)' : 
                             u.modules && u.modules.length > 0 ? `已授權 ${u.modules.length} 個模組` : 
                             '預設模組範圍'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            isUserActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-500"
                          )} />
                          <span className={cn(
                            "text-xs font-bold",
                            isUserActive ? "text-emerald-400" : "text-red-400"
                          )}>
                            {isUserActive ? '正常啟用' : '已停用'}
                          </span>
                          {u.schedule?.enabled && (
                            <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                              時段限制 {u.schedule.start}-{u.schedule.end}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      {!isReadOnly && (
                        <td className="px-6 py-4 text-right relative">
                          <button 
                            onClick={() => setOpenActionDropdown(openActionDropdown === u.id ? null : u.id)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                            title="操作選單"
                          >
                            <Settings2 size={16} />
                          </button>

                          {openActionDropdown === u.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-[100]" 
                                onClick={() => setOpenActionDropdown(null)} 
                              />
                              <div className="absolute right-6 top-12 z-[110] w-56 bg-[#121215] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                
                                <div className="p-2.5 border-b border-gray-800 bg-gray-900/40">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                                    快速變更 RBAC 權限角色
                                  </span>
                                </div>

                                <div className="p-1.5 space-y-0.5">
                                  {[
                                    { key: 'supervisor', label: '超級管理員 (Supervisor)' },
                                    { key: 'admin', label: '系統管理員 (Admin)' },
                                    { key: 'editor', label: '分析專家 (Editor)' },
                                    { key: 'auditor', label: '獨立稽核員 (Auditor)' },
                                    { key: 'viewer', label: '一般檢視員 (Viewer)' }
                                  ]
                                  .filter(r => r.key !== 'supervisor' || currentUser.role === 'supervisor')
                                  .map((roleObj) => (
                                    <button
                                      key={roleObj.key}
                                      onClick={() => {
                                        handleUpdateUser(u.id, { role: roleObj.key }, `已將「${u.username}」角色變更為 ${roleObj.label}！`);
                                        setOpenActionDropdown(null);
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between",
                                        u.role === roleObj.key ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
                                      )}
                                    >
                                      <span>{roleObj.label}</span>
                                      {u.role === roleObj.key && <Check size={12} />}
                                    </button>
                                  ))}
                                </div>

                                <div className="p-1.5 border-t border-gray-800 space-y-0.5">
                                  <button
                                    onClick={() => {
                                      setSelectedUserForProfile(u);
                                      setOpenActionDropdown(null);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-emerald-400 hover:bg-emerald-600/10 transition-all flex items-center gap-2"
                                  >
                                    <User size={13} />
                                    <span>編輯個人資料與密碼</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedUserForModules(u);
                                      setOpenActionDropdown(null);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-blue-400 hover:bg-blue-600/10 transition-all flex items-center gap-2"
                                  >
                                    <Layout size={13} />
                                    <span>調整功能模組授權範圍</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedUserForSchedule(u);
                                      setOpenActionDropdown(null);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-purple-400 hover:bg-purple-600/10 transition-all flex items-center gap-2"
                                  >
                                    <Clock size={13} />
                                    <span>登入時段與帳號狀態</span>
                                  </button>
                                </div>

                                {u.username !== 'supervisor' && u.username !== 'admin' && (
                                  <div className="p-1.5 border-t border-gray-800">
                                    <button
                                      onClick={() => {
                                        handleDeleteUser(u.id, u.username);
                                        setOpenActionDropdown(null);
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-red-400 hover:bg-red-600/10 transition-all flex items-center gap-2"
                                    >
                                      <Trash2 size={13} />
                                      <span>刪除此使用者主體</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add New User */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f12] border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase italic tracking-wider">建立新使用者身分 (Add Principal)</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">新增本機登入帳號並配置安全角色與初始密碼</p>
                  </div>
                </div>
                <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                    使用者帳號 (Username) *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="請輸入英文或數字帳號名稱 (例如 analyst_01)"
                      className="w-full bg-black border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                    電子郵件地址 (Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="user@enterprise.com"
                      className="w-full bg-black border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                    所屬部門 (Department)
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      placeholder="例如：資安營運部 (SOC)、網路架構組"
                      className="w-full bg-black border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                      RBAC 權限角色 (Role) *
                    </label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full bg-black border border-gray-800 rounded-xl py-2.5 px-3.5 text-xs text-blue-400 font-bold outline-none focus:border-blue-500"
                    >
                      {currentUser.role === 'supervisor' && <option value="supervisor">超級管理員 (Supervisor)</option>}
                      <option value="admin">系統管理員 (Admin)</option>
                      <option value="editor">資安分析專家 (Editor)</option>
                      <option value="auditor">獨立稽核員 (Auditor)</option>
                      <option value="viewer">一般檢視員 (Viewer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                      初始安全密碼 (Password) *
                    </label>
                    <div className="relative">
                      <input 
                        type={isNewUserPasswordVisible ? "text" : "password"}
                        required
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="請設定登入密碼"
                        className="w-full bg-black border border-gray-800 rounded-xl py-2.5 px-3.5 pr-10 text-xs text-white focus:border-blue-500 outline-none font-mono"
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsNewUserPasswordVisible(!isNewUserPasswordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {isNewUserPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold rounded-xl border border-gray-800 transition-all"
                  >
                    取消 (Cancel)
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                  >
                    確認新增使用者
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Edit User Profile */}
      <AnimatePresence>
        {selectedUserForProfile && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f12] border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase italic tracking-wider">編輯使用者資料</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">修改安全主體「{selectedUserForProfile.username}」的屬性</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserForProfile(null)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const updates: any = {
                  username: form.username.value,
                  email: form.email.value,
                  department: form.department.value,
                  role: form.role.value,
                };
                if (form.password.value) {
                  updates.password = form.password.value;
                }
                handleUpdateUser(selectedUserForProfile.id, updates, `已更新使用者「${updates.username}」的個人資料！`);
                setSelectedUserForProfile(null);
              }} className="p-6 space-y-4">
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">使用者帳號 (Username)</label>
                  <input 
                    name="username"
                    type="text"
                    defaultValue={selectedUserForProfile.username}
                    className="w-full bg-black border border-gray-800 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">電子郵件 (Email)</label>
                  <input 
                    name="email"
                    type="email"
                    defaultValue={selectedUserForProfile.email || ''}
                    className="w-full bg-black border border-gray-800 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">重設密碼 (若不修改請留空)</label>
                  <input 
                    name="password"
                    type="password"
                    placeholder="••••••••（留空保持原密碼）"
                    className="w-full bg-black border border-gray-800 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">所屬部門 (Department)</label>
                  <input 
                    name="department"
                    type="text"
                    defaultValue={selectedUserForProfile.department || ''}
                    className="w-full bg-black border border-gray-800 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">權限角色層級 (Role)</label>
                  <select 
                    name="role"
                    defaultValue={selectedUserForProfile.role}
                    className="w-full bg-black border border-gray-800 rounded-xl py-2.5 px-3.5 text-xs text-emerald-400 font-bold outline-none focus:border-emerald-500 uppercase"
                  >
                    {currentUser.role === 'supervisor' && <option value="supervisor">超級管理員 (Supervisor)</option>}
                    <option value="admin">系統管理員 (Admin)</option>
                    <option value="editor">資安分析專家 (Editor)</option>
                    <option value="auditor">獨立稽核員 (Auditor)</option>
                    <option value="viewer">一般檢視員 (Viewer)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedUserForProfile(null)}
                    className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold rounded-xl border border-gray-800 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    儲存更新
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Module Permissions Scope */}
      <AnimatePresence>
        {selectedUserForModules && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f12] border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <Layout size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase italic tracking-wider">功能模組授權範圍配置</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">為「{selectedUserForModules.username}」自訂允許存取的安全模組</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserForModules(null)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">模組授權清單</span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const allIds = AVAILABLE_MODULES.map(m => m.id);
                        setSelectedUserForModules({...selectedUserForModules, modules: allIds});
                      }}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300"
                    >
                      全選
                    </button>
                    <span className="text-gray-600">|</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedUserForModules({...selectedUserForModules, modules: []});
                      }}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-300"
                    >
                      全不選
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                  {AVAILABLE_MODULES.map(mod => {
                    const isChecked = (selectedUserForModules.modules || []).includes(mod.id);
                    return (
                      <label 
                        key={mod.id}
                        onClick={() => {
                          const currentModules = selectedUserForModules.modules || [];
                          const updated = isChecked 
                            ? currentModules.filter((id: string) => id !== mod.id)
                            : [...currentModules, mod.id];
                          setSelectedUserForModules({...selectedUserForModules, modules: updated});
                        }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                          isChecked 
                            ? "bg-blue-600/10 border-blue-500/40 text-white" 
                            : "bg-gray-900/30 border-gray-800 text-gray-400 hover:border-gray-700"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center transition-all shrink-0",
                          isChecked ? "bg-blue-600 border-blue-600 text-white" : "bg-black border-gray-700"
                        )}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-200">{mod.name}</p>
                          <p className="text-[10px] text-gray-500">{mod.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedUserForModules(null)}
                    className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold rounded-xl border border-gray-800 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      handleUpdateUser(selectedUserForModules.id, { modules: selectedUserForModules.modules }, `已成功更新「${selectedUserForModules.username}」的模組存取範圍！`);
                      setSelectedUserForModules(null);
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                  >
                    套用模組權限
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Schedule & Active Status */}
      <AnimatePresence>
        {selectedUserForSchedule && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f12] border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-600/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase italic tracking-wider">登入時段與帳號狀態管控</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">限制「{selectedUserForSchedule.username}」之活動時間</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserForSchedule(null)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">帳號存取狀態</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForSchedule({...selectedUserForSchedule, status: 'Active'})}
                      className={cn(
                        "py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                        (selectedUserForSchedule.status || 'Active') === 'Active'
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-inner"
                          : "bg-black border-gray-800 text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <CheckCircle2 size={14} />
                      <span>正常啟用 (Active)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedUserForSchedule({...selectedUserForSchedule, status: 'Disabled'})}
                      className={cn(
                        "py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                        selectedUserForSchedule.status === 'Disabled'
                          ? "bg-red-600/20 border-red-500 text-red-400 shadow-inner"
                          : "bg-black border-gray-800 text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <AlertCircle size={14} />
                      <span>暫時停用 (Disabled)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-200">啟用工作時段登入限制</h4>
                      <p className="text-[10px] text-gray-500">非上班時間自動禁止連線與 API 呼叫</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const sched = selectedUserForSchedule.schedule || { enabled: false, start: '09:00', end: '18:00' };
                        setSelectedUserForSchedule({
                          ...selectedUserForSchedule,
                          schedule: { ...sched, enabled: !sched.enabled }
                        });
                      }}
                      className={cn(
                        "w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer",
                        selectedUserForSchedule.schedule?.enabled ? "bg-purple-600" : "bg-gray-800"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full transition-transform",
                        selectedUserForSchedule.schedule?.enabled ? "translate-x-4" : "translate-x-0"
                      )}></div>
                    </button>
                  </div>

                  {selectedUserForSchedule.schedule?.enabled && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-4 p-4 bg-gray-900/40 border border-gray-800 rounded-2xl"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">允許開始時間</label>
                        <input 
                          type="time" 
                          value={selectedUserForSchedule.schedule?.start || '09:00'}
                          onChange={(e) => setSelectedUserForSchedule({
                            ...selectedUserForSchedule,
                            schedule: { ...selectedUserForSchedule.schedule, start: e.target.value }
                          })}
                          className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-purple-400 font-bold outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">允許結束時間</label>
                        <input 
                          type="time" 
                          value={selectedUserForSchedule.schedule?.end || '18:00'}
                          onChange={(e) => setSelectedUserForSchedule({
                            ...selectedUserForSchedule,
                            schedule: { ...selectedUserForSchedule.schedule, end: e.target.value }
                          })}
                          className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-purple-400 font-bold outline-none focus:border-purple-500"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedUserForSchedule(null)}
                    className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold rounded-xl border border-gray-800 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      handleUpdateUser(
                        selectedUserForSchedule.id, 
                        { 
                          schedule: selectedUserForSchedule.schedule, 
                          status: selectedUserForSchedule.status || 'Active' 
                        },
                        `已成功套用「${selectedUserForSchedule.username}」的時段與狀態設定！`
                      );
                      setSelectedUserForSchedule(null);
                    }}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all"
                  >
                    套用狀態設定
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

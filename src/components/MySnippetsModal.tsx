import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  FileCode,
  Clock,
  Eye,
  GitFork,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  Database,
  Download,
  Upload,
  RefreshCw,
  Edit3,
  Check,
  AlertTriangle,
  Globe,
  HardDrive,
  Layers,
  Sparkles,
  LogOut,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { Snippet, AdminStats, AdminSnippetItem } from '../types';

interface MySnippetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSnippet: (snippet: Snippet) => void;
  onForkSnippet: (slug: string) => void;
}

export const MySnippetsModal: React.FC<MySnippetsModalProps> = ({
  isOpen,
  onClose,
  onSelectSnippet,
  onForkSnippet,
}) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'admin'>('explore');

  // Admin authentication state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('htmlshare_admin_token') || null;
    } catch {
      return null;
    }
  });
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Explore tab state
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [exploreQuery, setExploreQuery] = useState('');
  const [loadingExplore, setLoadingExplore] = useState(false);

  // Admin tab state
  const [adminSnippets, setAdminSnippets] = useState<AdminSnippetItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminQuery, setAdminQuery] = useState('');
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit metadata modal state
  const [editingSnippet, setEditingSnippet] = useState<AdminSnippetItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPasscode, setEditPasscode] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch explore snippets
  const fetchExploreSnippets = async () => {
    setLoadingExplore(true);
    try {
      const res = await fetch(`/api/snippets?q=${encodeURIComponent(exploreQuery)}`);
      const json = await res.json();
      if (json.success) {
        setSnippets(json.data);
      }
    } catch (err) {
      console.error('Fetch snippets error:', err);
    } finally {
      setLoadingExplore(false);
    }
  };

  // Admin Login handler
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminUsername.trim()) {
      setLoginError('请输入管理员账号');
      return;
    }
    if (!adminPassword.trim()) {
      setLoginError('请输入管理员密码');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword.trim(),
        }),
      });

      const responseText = await res.text();
      let json: any;
      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(
          res.ok
            ? '后端返回非 JSON 格式。如果您是在 Cloudflare Pages 部署，请确认 Functions 路由正常'
            : `服务器返回异常 (HTTP ${res.status}): ${responseText.slice(0, 100)}`
        );
      }

      if (json.success && json.token) {
        sessionStorage.setItem('htmlshare_admin_token', json.token);
        setAdminToken(json.token);
        setAdminPassword(''); // Clear password from memory immediately! Never expose plaintext password.
        showToast('success', '管理员登录成功');
        fetchAdminData(json.token);
      } else {
        setLoginError(json.error || '账号或密码错误');
      }
    } catch (err: any) {
      setLoginError(err.message || '登录异常，请重试');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Admin Logout handler
  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('htmlshare_admin_token');
    } catch {}
    setAdminToken(null);
    setAdminPassword('');
    setAdminSnippets([]);
    setAdminStats(null);
    showToast('success', '已安全退出管理员登录并锁定后台');
  };

  // Fetch admin data
  const fetchAdminData = async (overrideToken?: string) => {
    const token = overrideToken || adminToken;
    if (!token) return;

    setLoadingAdmin(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/snippets', { headers }),
      ]);

      if (statsRes.status === 401 || listRes.status === 401) {
        handleAdminLogout();
        setLoginError('管理员会话已过期，请重新登录');
        return;
      }

      const statsJson = await statsRes.json();
      const listJson = await listRes.json();

      if (statsJson.success) {
        setAdminStats(statsJson.stats);
      }
      if (listJson.success) {
        setAdminSnippets(listJson.data);
      }
    } catch (err) {
      console.error('Fetch admin error:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'explore') {
        fetchExploreSnippets();
      } else if (adminToken) {
        fetchAdminData();
      }
    }
  }, [isOpen, activeTab, exploreQuery, adminToken]);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  // Delete from explore view
  const handleDeleteExplore = async (slug: string, hasPasscode?: boolean) => {
    let passcode: string | undefined = undefined;
    if (hasPasscode) {
      const input = window.prompt('此片段受密码保护，请输入密码以删除：');
      if (!input) return;
      passcode = input;
    } else {
      if (!window.confirm('确认要彻底删除该代码片段吗？')) return;
    }

    try {
      const res = await fetch(`/api/snippets/${slug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const json = await res.json();
      if (json.success) {
        setSnippets((prev) => prev.filter((s) => s.slug !== slug && s.id !== slug));
        showToast('success', '片段删除成功');
      } else {
        showToast('error', json.error || '删除失败');
      }
    } catch (err: any) {
      showToast('error', '删除错误: ' + err.message);
    }
  };

  // Force delete from admin view
  const handleAdminDelete = async (id: string, title: string) => {
    if (!adminToken) {
      showToast('error', '请先登录管理员账号');
      return;
    }
    if (!window.confirm(`【后台管理员操作】确认彻底从数据库清除「${title}」吗？此操作不可逆。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/snippets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setAdminSnippets((prev) => prev.filter((s) => s.id !== id));
        fetchAdminData();
        showToast('success', '后台数据库记录已清除');
      } else {
        showToast('error', json.error || '清除失败');
      }
    } catch (err: any) {
      showToast('error', '删除错误: ' + err.message);
    }
  };

  // Clean expired snippets
  const handleCleanExpired = async () => {
    if (!adminToken) {
      showToast('error', '请先登录管理员账号');
      return;
    }
    try {
      const res = await fetch('/api/admin/snippets/clean-expired', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const json = await res.json();
      if (json.success) {
        fetchAdminData();
        showToast('success', json.message);
      } else {
        showToast('error', json.error || '清理失败');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Export full JSON backup
  const handleExportBackup = async () => {
    if (!adminToken) {
      showToast('error', '请先登录管理员账号');
      return;
    }
    try {
      const res = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        showToast('error', '导出授权校验失败');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `htmlshare_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', '数据库备份已成功导出');
    } catch (err: any) {
      showToast('error', '导出错误: ' + err.message);
    }
  };

  // Open edit modal
  const handleOpenEdit = (item: AdminSnippetItem) => {
    setEditingSnippet(item);
    setEditTitle(item.title || '');
    setEditSlug(item.slug || '');
    setEditDescription(item.description || '');
    setEditPasscode(item.passcode || '');
    setEditIsPublic(item.isPublic ?? true);
    setEditTags((item.tags || []).join(', '));
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingSnippet) return;
    if (!adminToken) {
      showToast('error', '请先登录管理员账号');
      return;
    }
    if (!editTitle.trim()) {
      showToast('error', '标题不能为空');
      return;
    }
    if (!editSlug.trim()) {
      showToast('error', '短链 Slug 不能为空');
      return;
    }

    setIsSavingEdit(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: editTitle,
          slug: editSlug,
          description: editDescription,
          passcode: editPasscode,
          isPublic: editIsPublic,
          tags: tagsArray,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('success', '元数据更新已保存到数据库');
        setEditingSnippet(null);
        fetchAdminData();
      } else {
        showToast('error', json.error || '保存失败');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Import JSON handle
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!adminToken) {
      showToast('error', '请先登录管理员账号');
      return;
    }
    if (!importJsonText.trim()) {
      showToast('error', '请先粘贴或上传 JSON 备份数据');
      return;
    }

    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        showToast('error', 'JSON 格式错误: 顶层必须是片段数组');
        return;
      }

      setIsImporting(true);
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ data: parsed, mode: importMode }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('success', json.message);
        setShowImportModal(false);
        setImportJsonText('');
        fetchAdminData();
      } else {
        showToast('error', json.error || '导入失败');
      }
    } catch (err: any) {
      showToast('error', 'JSON 解析失败: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Filter admin snippets by query
  const filteredAdminSnippets = adminSnippets.filter((item) => {
    if (!adminQuery.trim()) return true;
    const q = adminQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.slug?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">代码片段中心 & 后台数据管理</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Cloudflare D1 / KV 架构
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                实时检索、快速载入、元数据在线维护与全量 JSON 备份导入
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast Notification */}
        {actionMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'explore'
                ? 'bg-slate-900 text-indigo-400 border-slate-800 -mb-px'
                : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>片段浏览与载入</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {snippets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-indigo-400 border-slate-800 -mb-px'
                : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>后台数据管理 (Admin)</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-[10px] text-indigo-300">
              运维模式
            </span>
          </button>
        </div>

        {/* TAB 1: EXPLORE & LOAD VIEW */}
        {activeTab === 'explore' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Input Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  value={exploreQuery}
                  onChange={(e) => setExploreQuery(e.target.value)}
                  placeholder="搜索标题、描述、标签或短链 (如 eternity, welcome-demo)..."
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
                {exploreQuery && (
                  <button
                    onClick={() => setExploreQuery('')}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    清除
                  </button>
                )}
              </div>
              <button
                onClick={fetchExploreSnippets}
                disabled={loadingExplore}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="刷新列表"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingExplore ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingExplore ? (
                <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>正在从数据库加载片段列表...</span>
                </div>
              ) : snippets.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <FileCode className="w-8 h-8 text-slate-600 mb-1" />
                  <span>暂无匹配的代码片段</span>
                  <p className="text-xs text-slate-600">在主界面点击「发布与托管」即可保存代码片段到数据库</p>
                </div>
              ) : (
                snippets.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-semibold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded text-[10px] font-mono">
                          /{item.slug}
                        </span>
                        {item.hasPasscode ? (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[10px] flex items-center gap-1 font-semibold">
                            <Lock className="w-2.5 h-2.5" /> 密码锁定
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] flex items-center gap-1 font-semibold">
                            <ShieldCheck className="w-2.5 h-2.5" /> 公开访问
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {item.views || 0} 访问
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3.5 h-3.5" />
                          {item.forksCount || 0} Fork
                        </span>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[9px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          onSelectSnippet(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>载入编辑器</span>
                      </button>

                      <button
                        onClick={() => {
                          onForkSnippet(item.slug);
                          onClose();
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Fork 衍生分支"
                      >
                        <GitFork className="w-4 h-4" />
                      </button>

                      <a
                        href={`/raw/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="在新窗口查看原生渲染"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleDeleteExplore(item.slug, item.hasPasscode)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="删除片段"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BACKEND DATA MANAGEMENT VIEW */}
        {activeTab === 'admin' && !adminToken && (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/60 overflow-y-auto">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">后台数据管理鉴权</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  管理系统全局片段、清理过期数据、导入与导出数据库，需验证管理员权限。
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">
                    管理员账号
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="输入管理员账号"
                    autoComplete="username"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">
                    管理员密码
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="输入管理员密码"
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    密码已严格开启掩码保护，不会在任何页面或日志中显示明文。
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isLoggingIn ? '正在验证身份...' : '验证身份并进入后台'}</span>
                </button>
              </form>

              <div className="pt-2 border-t border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-500">
                  初始默认管理员账号：<code className="text-indigo-400 font-mono">admin</code> · 默认密码：<code className="text-slate-400 font-mono">••••••</code>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BACKEND DATA MANAGEMENT VIEW (LOGGED IN) */}
        {activeTab === 'admin' && adminToken && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stats Metric Cards */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>总片段记录</span>
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {adminStats ? adminStats.totalCount : '-'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  公开 {adminStats?.publicCount ?? 0} · 私密 {adminStats?.privateCount ?? 0}
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>累计全网浏览</span>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-emerald-400">
                  {adminStats ? adminStats.totalViews : '-'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  累计 Fork {adminStats?.totalForks ?? 0} 次
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>安全加密片段</span>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-amber-400">
                  {adminStats ? adminStats.protectedCount : '-'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">配备自定义密码锁定</div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>预估存储占用</span>
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-bold text-cyan-400">
                  {adminStats ? `${adminStats.approxSizeKb} KB` : '-'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">D1 表结构 & KV 缓存</div>
              </div>
            </div>

            {/* Operations Toolbar */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex-1 min-w-[200px] flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  value={adminQuery}
                  onChange={(e) => setAdminQuery(e.target.value)}
                  placeholder="快速检索数据记录..."
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="下载整库 JSON 备份"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>导出备份</span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="从 JSON 文件还原或合并数据"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>导入恢复</span>
                </button>

                <button
                  onClick={handleCleanExpired}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="扫描并删除已到期的临时短链"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>清理过期</span>
                </button>

                <button
                  onClick={() => fetchAdminData()}
                  disabled={loadingAdmin}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="刷新数据"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAdmin ? 'animate-spin' : ''}`} />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">已登录:</span>
                  <span>admin</span>
                </div>

                <button
                  onClick={handleAdminLogout}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="退出管理员登录并锁定后台"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>

            {/* Admin Table Content */}
            <div className="flex-1 overflow-auto p-4">
              {loadingAdmin ? (
                <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>加载后台数据中心...</span>
                </div>
              ) : filteredAdminSnippets.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  未查找到相关数据记录
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">标题 & 短链</th>
                        <th className="py-3 px-4">访问 / Fork</th>
                        <th className="py-3 px-4">体积</th>
                        <th className="py-3 px-4">权限 & 密码</th>
                        <th className="py-3 px-4">创建时间</th>
                        <th className="py-3 px-4 text-right">后台维护操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredAdminSnippets.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white truncate max-w-[200px]">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] mt-0.5">
                              <span>/{item.slug}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-medium">{item.views} 次</span>
                              <span className="text-slate-500">· {item.forksCount} fork</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {item.totalSizeKb ? `${item.totalSizeKb} KB` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {item.isPublic ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                                  公开
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                  私密
                                </span>
                              )}
                              {item.hasPasscode ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> 已加密
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">无密码</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                                title="编辑元数据与密码"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  onSelectSnippet(item);
                                  onClose();
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors"
                                title="载入到编辑器"
                              >
                                <FileCode className="w-3.5 h-3.5" />
                              </button>

                              <a
                                href={`/raw/${item.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                                title="查看原生运行"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => handleAdminDelete(item.id, item.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                title="强制从后台数据库删除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>D1 实时同步已就绪</span>
            </span>
            <span>·</span>
            <span>当前共 {activeTab === 'explore' ? snippets.length : adminSnippets.length} 个片段</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>

      {/* EDIT METADATA MODAL */}
      {editingSnippet && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">编辑片段元数据与安全配置</h4>
              </div>
              <button
                onClick={() => setEditingSnippet(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">页面标题</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  自定义短链 Slug (URL 路径)
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 font-mono">
                  <span>/s/</span>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="bg-transparent border-none text-white focus:outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">描述说明</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">访问密码保护</label>
                  <input
                    type="password"
                    value={editPasscode}
                    onChange={(e) => setEditPasscode(e.target.value)}
                    placeholder="留空表示公开免密"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">标签 (逗号分隔)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="html, css, javascript"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="editIsPublic" className="text-slate-300 font-medium cursor-pointer">
                  在公共片段广场中展示 (公开检索)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingSnippet(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingEdit ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>保存元数据</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT JSON MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">导入恢复 JSON 数据库备份</h4>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                可直接选择本地导出的 JSON 备份文件，或直接在下方文本框中粘贴 JSON 内容：
              </p>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl bg-slate-950 text-slate-300 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>选择本地 .json 备份文件</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  或粘贴 JSON 数据数组
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='[ { "id": "...", "slug": "...", "title": "...", "html": "..." } ]'
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-[11px] focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">导入模式</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-indigo-600"
                    />
                    <span>合并增量 (保留已有，覆盖相同 ID)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-300">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600"
                    />
                    <span>全量替换 (清空当前库)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isImporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>开始导入</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

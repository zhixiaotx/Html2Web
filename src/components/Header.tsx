import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Sparkles,
  Share2,
  Plus,
  FolderCode,
  Cloud,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  Moon,
  Sun,
  Contrast,
  Check,
  FileDown,
  MoreHorizontal,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  onNew: () => void;
  onOpenImportModal: () => void;
  onSave: () => void;
  onOpenAI: () => void;
  onOpenMySnippets: () => void;
  onOpenCloudflare: () => void;
  onOpenRawPage: () => void;
  hasUnsavedChanges: boolean;
  currentTitle: string;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNew,
  onOpenImportModal,
  onSave,
  onOpenAI,
  onOpenMySnippets,
  onOpenCloudflare,
  onOpenRawPage,
  hasUnsavedChanges,
  currentTitle,
  theme,
  onThemeChange,
}) => {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: { id: ThemeMode; label: string; icon: typeof Moon }[] = [
    { id: 'dark', label: '深色模式', icon: Moon },
    { id: 'light', label: '浅色模式', icon: Sun },
    { id: 'high-contrast', label: '高对比度', icon: Contrast },
  ];

  const currentThemeIcon =
    theme === 'light' ? Sun : theme === 'high-contrast' ? Contrast : Moon;
  const CurrentIcon = currentThemeIcon;

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-subtle)',
      }}
      className="h-16 border-b px-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 transition-colors"
    >
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                style={{ color: 'var(--text-main)' }}
                className="font-extrabold text-lg tracking-tight"
              >
                HTML<span className="text-indigo-500">Share</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                100% 免费 / 无付费墙
              </span>
            </div>
            <p style={{ color: 'var(--text-dim)' }} className="text-[11px] hidden md:block">
              代码片段分享与 HTML 即时托管平台
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--border-subtle)' }} className="h-5 w-px hidden md:block" />

        {/* Current Working Title */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
          className="hidden lg:flex items-center gap-2 text-xs border px-3 py-1.5 rounded-lg max-w-xs truncate"
        >
          <FileCode2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate font-medium">{currentTitle || '未命名 HTML 片段'}</span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" title="有未保存修改" />
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Switcher */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)',
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold border rounded-lg hover:opacity-90 transition-all cursor-pointer"
            title="切换界面主题 (深色 / 浅色 / 高对比度)"
            id="theme-switcher-button"
          >
            <CurrentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span className="hidden md:inline">
              {theme === 'dark' ? '深色' : theme === 'light' ? '浅色' : '高对比'}
            </span>
          </button>

          {themeMenuOpen && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-main)',
              }}
              className="absolute right-0 mt-1.5 w-38 border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{ color: 'var(--text-dim)' }}>
                配色主题
              </div>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onThemeChange(opt.id);
                      setThemeMenuOpen(false);
                    }}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:opacity-80 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* New Snippet */}
        <button
          onClick={onNew}
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-main)',
          }}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold border rounded-lg hover:opacity-90 transition-colors cursor-pointer"
          title="新建空白片段"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70" />
          <span className="hidden sm:inline">新建</span>
        </button>

        {/* Quick Import from URL / Code / File */}
        <button
          onClick={onOpenImportModal}
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-main)',
          }}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold border rounded-lg hover:border-pink-500/50 hover:bg-pink-500/10 transition-colors cursor-pointer"
          title="从 URL (GitHub/Bitbucket)、直接粘贴代码、或上传 HTML 文件"
        >
          <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
          <span className="hidden md:inline">导入 / 从 URL</span>
        </button>

        {/* My Snippets & Backend Data Admin */}
        <button
          onClick={onOpenMySnippets}
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-main)',
          }}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold border rounded-lg hover:opacity-90 transition-colors cursor-pointer"
          title="查看代码片段库与后台数据管理中心"
        >
          <FolderCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          <span className="hidden lg:inline">片段库 / 后台</span>
        </button>

        {/* Cloudflare DB Modal */}
        <button
          onClick={onOpenCloudflare}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
          title="Cloudflare D1 & KV 数据库配置与 Worker 部署"
        >
          <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span className="hidden xl:inline">Cloudflare D1/KV</span>
        </button>

        {/* AI Assistant */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-200 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 border border-indigo-500/40 rounded-lg shadow-sm transition-all cursor-pointer"
          title="AI 助手：代码优化、重构及生成"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300 animate-spin-slow" />
          <span className="hidden sm:inline">AI 助手</span>
          <span className="sm:hidden text-[11px]">AI</span>
        </button>

        {/* Mobile More Options Dropdown (< sm) */}
        <div className="relative sm:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)',
            }}
            className="p-1.5 border rounded-lg hover:opacity-90 transition-all cursor-pointer flex items-center justify-center"
            title="更多功能菜单"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {mobileMenuOpen && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-main)',
              }}
              className="absolute right-0 mt-1.5 w-48 border rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{ color: 'var(--text-dim)' }}>
                快捷菜单
              </div>
              <button
                onClick={() => {
                  onOpenCloudflare();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors text-left cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span>Cloudflare D1/KV</span>
              </button>
              <button
                onClick={() => {
                  onOpenMySnippets();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors text-left cursor-pointer"
              >
                <FolderCode className="w-3.5 h-3.5 shrink-0" />
                <span>片段库 / 后台管理</span>
              </button>
              <button
                onClick={() => {
                  onOpenImportModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors text-left cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" />
                <span>导入 / 从 URL 提取</span>
              </button>
              <button
                onClick={() => {
                  onOpenRawPage();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-slate-800 rounded-lg transition-colors text-left cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>新窗口全屏运行</span>
              </button>
            </div>
          )}
        </div>

        {/* Direct Raw Preview in New Window */}
        <button
          onClick={onOpenRawPage}
          style={{
            color: 'var(--text-muted)',
          }}
          className="p-1.5 hover:opacity-80 rounded-lg transition-colors cursor-pointer hidden md:flex"
          title="在新标签页中以原生 HTML 页面运行"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Save & Share Primary Button */}
        <button
          onClick={onSave}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--accent-text)',
          }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg shadow-md shadow-indigo-600/30 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">保存 & 生成短链</span>
          <span className="sm:hidden">分享</span>
        </button>
      </div>
    </header>
  );
};

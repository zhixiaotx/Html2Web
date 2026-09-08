import React, { useState, useRef } from 'react';
import {
  Globe,
  FileCode,
  Upload,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Code2,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface SkyQuickRendererProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
  onOpenWorkbench: (code?: string, slug?: string) => void;
}

export const SkyQuickRenderer: React.FC<SkyQuickRendererProps> = ({
  theme,
  onThemeToggle,
  onOpenWorkbench,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'code' | 'upload'>('code');
  const [urlInput, setUrlInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    code: string;
    fullUrl: string;
    rawUrl: string;
    title?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setErrorMsg('仅支持 .html 或 .htm 文件');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setFileName(`✅ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    setGeneratedResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    setErrorMsg(null);
    setGeneratedResult(null);
    setLoading(true);

    try {
      let payload: any = null;

      if (activeTab === 'url') {
        const trimmed = urlInput.trim();
        if (!trimmed) throw new Error('请输入有效的代码链接');
        try {
          new URL(trimmed);
        } catch (_) {
          throw new Error('URL 格式无效，请包含 http:// 或 https://');
        }
        payload = { type: 'url', url: trimmed };
      } else if (activeTab === 'code') {
        const trimmed = codeInput.trim();
        if (!trimmed) throw new Error('请粘贴 HTML 代码');
        payload = { type: 'code', code: trimmed };
      } else if (activeTab === 'upload') {
        if (!selectedFile) throw new Error('请先选择或拖入 HTML 文件');
        const fileContent = await selectedFile.text();
        payload = { type: 'code', code: fileContent };
      }

      const res = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '生成失败，请重试');
      }

      const fullUrl = `${window.location.origin}/p/${data.code}`;
      const rawUrl = `${window.location.origin}/raw/${data.code}`;

      setGeneratedResult({
        code: data.code,
        fullUrl,
        rawUrl,
      });
    } catch (err: any) {
      setErrorMsg(err.message || '网络异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex justify-center items-center py-6 px-4 select-none">
      <div
        style={{
          backgroundColor: 'var(--bg-card, rgba(255, 248, 250, 0.85))',
          borderColor: 'var(--border-light, rgba(255, 107, 157, 0.2))',
          boxShadow: '0 20px 50px rgba(255, 107, 157, 0.12)',
        }}
        className="max-w-[720px] w-full rounded-[36px] sm:rounded-[44px] p-6 sm:p-10 border backdrop-blur-xl transition-all duration-300"
      >
        {/* Header: Brand & Theme Toggle */}
        <header className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3.5">
            <img
              src="https://pic.feria.eu.org/FLMNtQ3P/IMG-20260907-072953-159.jpg"
              alt="Sky 头像"
              loading="lazy"
              onError={(e) => {
                // Fallback avatar
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
              }}
              className="w-13 h-13 rounded-full object-cover shadow-md border-2 border-pink-400/30 shrink-0 hover:scale-105 hover:-rotate-2 transition-transform duration-300"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                ♡｡Sky.✨
              </span>
              <span
                style={{ color: 'var(--text-tertiary, #a88594)' }}
                className="text-xs font-semibold tracking-wide"
              >
                ✨ 永久链接 · 浪漫永存 · 100% 免费
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenWorkbench()}
              style={{
                backgroundColor: 'var(--tab-bg, rgba(255, 107, 157, 0.1))',
                borderColor: 'var(--border-light, rgba(255, 107, 157, 0.2))',
              }}
              className="px-3 py-1.5 rounded-full border text-xs font-bold text-pink-600 dark:text-pink-300 hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
              title="切换到多窗口代码编辑工作台"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">工作台模式</span>
            </button>

            <button
              onClick={onThemeToggle}
              style={{
                backgroundColor: 'var(--tab-bg, rgba(255, 107, 157, 0.1))',
                borderColor: 'var(--border-light, rgba(255, 107, 157, 0.2))',
              }}
              className="w-10 h-10 rounded-full border flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              aria-label="切换深色/浅色模式"
              title="切换深色/浅色模式"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-pink-500" />
              )}
            </button>
          </div>
        </header>

        {/* Tab Container */}
        <div
          style={{
            backgroundColor: 'var(--tab-bg, rgba(255, 107, 157, 0.1))',
          }}
          className="flex p-1 rounded-2xl mb-6 gap-1"
          role="tablist"
        >
          <button
            onClick={() => {
              setActiveTab('url');
              setErrorMsg(null);
            }}
            style={{
              backgroundColor:
                activeTab === 'url' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color:
                activeTab === 'url'
                  ? 'var(--text-main, #2d1b26)'
                  : 'var(--text-tertiary, #a88594)',
              boxShadow: activeTab === 'url' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            role="tab"
          >
            <Globe className="w-4 h-4 text-pink-500" />
            <span>🌐 从 URL</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('code');
              setErrorMsg(null);
            }}
            style={{
              backgroundColor:
                activeTab === 'code' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color:
                activeTab === 'code'
                  ? 'var(--text-main, #2d1b26)'
                  : 'var(--text-tertiary, #a88594)',
              boxShadow: activeTab === 'code' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            role="tab"
          >
            <FileCode className="w-4 h-4 text-purple-500" />
            <span>📝 粘贴代码</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              setErrorMsg(null);
            }}
            style={{
              backgroundColor:
                activeTab === 'upload' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color:
                activeTab === 'upload'
                  ? 'var(--text-main, #2d1b26)'
                  : 'var(--text-tertiary, #a88594)',
              boxShadow: activeTab === 'upload' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            role="tab"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>📤 上传文件</span>
          </button>
        </div>

        {/* Panel 1: URL */}
        {activeTab === 'url' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label
                style={{ color: 'var(--text-secondary, #5a3f4a)' }}
                className="text-xs font-semibold"
              >
                GitHub / Bitbucket / 自定义原始 HTML 链接
              </label>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://raw.githubusercontent.com/用户/仓库/分支/文件.html"
                style={{
                  backgroundColor: 'var(--input-bg, rgba(255, 107, 157, 0.06))',
                  borderColor: 'var(--border-light, rgba(255, 107, 157, 0.2))',
                  color: 'var(--text-main, #2d1b26)',
                }}
                className="w-full h-24 p-3.5 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 resize-none font-mono transition-all"
              />
            </div>
          </div>
        )}

        {/* Panel 2: Code */}
        {activeTab === 'code' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  style={{ color: 'var(--text-secondary, #5a3f4a)' }}
                  className="text-xs font-semibold"
                >
                  直接粘贴 HTML 代码（支持完整 HTML5 / 音频播放器 / Canvas）
                </label>
                <button
                  onClick={() =>
                    setCodeInput(
                      `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <title>♡｡Sky.✨ 示例</title>\n  <style>\n    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1418, #2a1f25); color: #f5e6ed; font-family: sans-serif; text-align: center; }\n    .card { padding: 40px; background: rgba(255, 107, 157, 0.1); border: 1px solid rgba(255, 107, 157, 0.3); border-radius: 24px; backdrop-filter: blur(12px); }\n    h1 { background: linear-gradient(135deg, #ff6b9d, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>✨ 浪漫永存 · Sky 播放器</h1>\n    <p>永久链接直出，自由分享</p>\n  </div>\n</body>\n</html>`
                    )
                  }
                  className="text-[11px] text-pink-500 hover:underline cursor-pointer"
                >
                  插入示例代码
                </button>
              </div>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="<!DOCTYPE html><html><head><title>我的页面</title></head><body><h1>✨ 你好，世界</h1></body></html>"
                style={{
                  backgroundColor: 'var(--input-bg, rgba(255, 107, 157, 0.06))',
                  borderColor: 'var(--border-light, rgba(255, 107, 157, 0.2))',
                  color: 'var(--text-main, #2d1b26)',
                }}
                className="w-full h-36 p-3.5 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 resize-none font-mono transition-all"
              />
            </div>
          </div>
        )}

        {/* Panel 3: Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label
                style={{ color: 'var(--text-secondary, #5a3f4a)' }}
                className="text-xs font-semibold"
              >
                上传 HTML 网页文件
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                style={{
                  backgroundColor: isDragOver
                    ? 'var(--tab-bg, rgba(255, 107, 157, 0.15))'
                    : 'var(--input-bg, rgba(255, 107, 157, 0.06))',
                  borderColor: isDragOver
                    ? '#ff6b9d'
                    : 'var(--border-light, rgba(255, 107, 157, 0.2))',
                }}
                className="w-full py-8 px-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 transition-all text-center"
              >
                <div className="text-3xl mb-2">📄</div>
                <div
                  style={{ color: 'var(--text-main, #2d1b26)' }}
                  className="font-bold text-sm"
                >
                  拖拽或点击选择 HTML 文件
                </div>
                <div
                  style={{ color: 'var(--text-tertiary, #a88594)' }}
                  className="text-xs mt-1"
                >
                  支持 .html / .htm（单文件完整网页）
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>
              {fileName && (
                <div className="text-xs font-semibold text-emerald-500 mt-1 px-1">
                  {fileName}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generate Action Button */}
        <div className="mt-5">
          <button
            onClick={handleGenerate}
            disabled={loading || (activeTab === 'upload' && !selectedFile)}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-95 active:scale-99 transition-all cursor-pointer shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>⏳ 永久链接生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>🚀 生成永久链接</span>
              </>
            )}
          </button>
        </div>

        {/* Error Feedback Box */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: 'var(--error-bg, rgba(255, 59, 48, 0.08))',
              borderColor: 'var(--error-border, rgba(255, 59, 48, 0.2))',
            }}
            className="mt-4 p-3.5 rounded-2xl border flex items-center gap-2 text-rose-500 text-xs sm:text-sm font-semibold animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>❌ {errorMsg}</span>
          </div>
        )}

        {/* Success Result Box */}
        {generatedResult && (
          <div
            style={{
              backgroundColor: 'var(--result-bg, rgba(255, 107, 157, 0.08))',
              borderColor: 'var(--result-border, rgba(255, 107, 157, 0.25))',
            }}
            className="mt-5 p-4 sm:p-5 rounded-2xl border space-y-3 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                <span>✅ 永久链接已生成</span>
                <span className="text-[10px] bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 rounded-full font-mono">
                  {generatedResult.code}
                </span>
              </span>
            </div>

            {/* Link Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-light, rgba(255, 107, 157, 0.2))',
              }}
              className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
            >
              <a
                href={generatedResult.fullUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs sm:text-sm font-mono text-pink-600 dark:text-pink-300 hover:underline truncate flex-1"
              >
                {generatedResult.fullUrl}
              </a>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制!' : '复制'}</span>
              </button>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={generatedResult.rawUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[140px] py-2 px-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>在新标签页全屏打开</span>
              </a>

              <button
                onClick={() => {
                  onOpenWorkbench(undefined, generatedResult.code);
                }}
                className="flex-1 min-w-[140px] py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>进入代码工作台调试</span>
              </button>
            </div>

            <div
              style={{ color: 'var(--text-tertiary, #a88594)' }}
              className="text-[11px] text-center pt-1"
            >
              ✨ 此链接永久有效，基于 Cloudflare 边缘计算与持久化存储，可安全分享给任何人
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Globe,
  FileCode,
  Upload,
  Link,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Code2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { parseFullHtml } from '../utils/htmlParser';

interface ImportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToEditor: (data: { html: string; css: string; js: string; title?: string }) => void;
  onGeneratedPermalink?: (code: string) => void;
}

type ImportTab = 'url' | 'code' | 'upload';

export const ImportCodeModal: React.FC<ImportCodeModalProps> = ({
  isOpen,
  onClose,
  onApplyToEditor,
  onGeneratedPermalink,
}) => {
  const [activeTab, setActiveTab] = useState<ImportTab>('url');

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [autoSplit, setAutoSplit] = useState(true);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessInfo(null);
      setGeneratedCode(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // File handling
  const handleFile = (file: File) => {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setError('仅支持 .html 或 .htm 文件');
      return;
    }
    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setFileContent(text);
      setSuccessInfo(`已读取文件: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.onerror = () => {
      setError('读取文件失败，请重试');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // 1. Fetch and Load to Editor
  const handleLoadToEditor = async () => {
    setError(null);
    setSuccessInfo(null);
    setLoading(true);

    try {
      let rawContent = '';
      let snippetTitle = '';

      if (activeTab === 'url') {
        const url = urlInput.trim();
        if (!url) {
          throw new Error('请输入有效的 GitHub / Bitbucket / 网页 URL 链接');
        }

        const resp = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await resp.json();
        if (!data.success) {
          throw new Error(data.error || '获取远程 URL 内容失败');
        }
        rawContent = data.content;
        snippetTitle = data.title || data.filename || '从 URL 导入的代码';
      } else if (activeTab === 'code') {
        const code = codeInput.trim();
        if (!code) {
          throw new Error('请粘贴 HTML 代码');
        }
        rawContent = code;
      } else if (activeTab === 'upload') {
        if (!fileContent) {
          throw new Error('请选择或拖拽上传 HTML 文件');
        }
        rawContent = fileContent;
        snippetTitle = selectedFile?.name ? selectedFile.name.replace(/\.[^/.]+$/, '') : '';
      }

      // Parse HTML
      const parsed = parseFullHtml(rawContent, autoSplit);
      onApplyToEditor({
        html: parsed.html,
        css: parsed.css,
        js: parsed.js,
        title: snippetTitle || parsed.title,
      });

      setSuccessInfo('✅ 代码已成功载入编辑器！已即时渲染预览。');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct Generate Permanent Link (/generate)
  const handleGenerateLink = async () => {
    setError(null);
    setSuccessInfo(null);
    setGeneratedCode(null);
    setLoading(true);

    try {
      let payload: any = {};

      if (activeTab === 'url') {
        const url = urlInput.trim();
        if (!url) {
          throw new Error('请输入有效的 GitHub / Bitbucket 链接');
        }
        payload = { type: 'url', url };
      } else if (activeTab === 'code') {
        const code = codeInput.trim();
        if (!code) {
          throw new Error('请直接粘贴 HTML 代码');
        }
        payload = { type: 'code', code };
      } else if (activeTab === 'upload') {
        if (!fileContent) {
          throw new Error('请上传 HTML 文件');
        }
        payload = { type: 'code', code: fileContent };
      }

      const resp = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || '生成永久链接失败');
      }

      setGeneratedCode(data.code);
      if (onGeneratedPermalink) {
        onGeneratedPermalink(data.code);
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请检查网络或格式');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      window.prompt('请手动复制链接：', link);
    }
  };

  const permanentUrl = generatedCode ? `${window.location.origin}/p/${generatedCode}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
        className="w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
      >
        {/* Modal Header */}
        <div
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
          className="flex items-center justify-between px-6 py-4 border-b"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center border border-pink-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 style={{ color: 'var(--text-main)' }} className="text-base font-bold flex items-center gap-2">
                <span>快速导入与链接生成</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-500 font-medium">
                  URL / 代码 / 文件
                </span>
              </h2>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                支持 GitHub/Bitbucket 原始链接拉取、HTML 代码直贴、或上传 .html 文件
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            className="p-1.5 hover:opacity-80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-main)',
          }}
          className="flex border-b px-6 pt-3 gap-2"
        >
          <button
            onClick={() => {
              setActiveTab('url');
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'url'
                ? 'text-pink-500 border-pink-500 bg-pink-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>🌐 从 URL</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('code');
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'code'
                ? 'text-pink-500 border-pink-500 bg-pink-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>📝 粘贴代码</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'text-pink-500 border-pink-500 bg-pink-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>📤 上传文件</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: FROM URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label style={{ color: 'var(--text-main)' }} className="block text-xs font-semibold mb-1.5">
                  GitHub / Bitbucket / GitLab / 任意远程 HTML 链接
                </label>
                <textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/用户/仓库/分支/文件.html 或 https://github.com/用户/仓库/blob/main/index.html"
                  rows={3}
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-all resize-none"
                />
              </div>

              {/* URL Preset Quick Tags */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="p-3 rounded-xl border text-[11px] text-slate-400 leading-relaxed flex items-start gap-2"
              >
                <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  支持直接粘贴 GitHub（包含 <code>/blob/</code> 或 <code>raw.githubusercontent.com</code>）、Bitbucket、GitLab 等任意代码源链接，系统将自动抓取原生 HTML 内容。
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div>
                <label style={{ color: 'var(--text-main)' }} className="block text-xs font-semibold mb-1.5">
                  直接粘贴 HTML 完整代码 (包含嵌套的 style 和 script)
                </label>
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder={`<!DOCTYPE html>
<html>
<head>
  <title>我的页面</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    h1 { color: #6366f1; }
  </style>
</head>
<body>
  <h1>✨ 你好，世界</h1>
</body>
</html>`}
                  rows={8}
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-all"
                />
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label style={{ color: 'var(--text-main)' }} className="block text-xs font-semibold mb-1.5">
                上传本地 HTML 文件
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  borderColor: isDragOver ? '#ff6b9d' : 'var(--border-subtle)',
                  backgroundColor: isDragOver ? 'rgba(255,107,157,0.1)' : 'var(--bg-main)',
                }}
                className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-pink-500/60 flex flex-col items-center justify-center gap-2 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".html,.htm"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📄
                </div>
                <div style={{ color: 'var(--text-main)' }} className="text-sm font-semibold">
                  拖拽或点击选择 HTML 文件
                </div>
                <div style={{ color: 'var(--text-muted)' }} className="text-xs">
                  支持 .html / .htm 网页文件 (最大 10MB)
                </div>

                {selectedFile && (
                  <div className="mt-3 px-3.5 py-1.5 rounded-full bg-pink-500/15 text-pink-400 text-xs font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Option: Auto Split into HTML, CSS, JS */}
          <div
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
            className="flex items-center justify-between p-3 rounded-xl border"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <div>
                <div style={{ color: 'var(--text-main)' }} className="text-xs font-semibold">
                  智能分离为 HTML / CSS / JS 栏
                </div>
                <div style={{ color: 'var(--text-muted)' }} className="text-[11px]">
                  自动抽取 &lt;style&gt; 样式至 CSS 栏，&lt;script&gt; 逻辑至 JS 栏便于实时开发
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSplit}
                onChange={(e) => setAutoSplit(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Info */}
          {successInfo && !generatedCode && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Generated Permalink Result Card (like Eternity) */}
          {generatedCode && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✅ 永久链接已生成</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">/p/{generatedCode}</span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border"
              >
                <a
                  href={permanentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-pink-400 hover:text-pink-300 truncate flex-1 underline decoration-pink-500/40"
                >
                  {permanentUrl}
                </a>

                <button
                  onClick={() => copyLink(permanentUrl)}
                  className="px-3 py-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '已复制' : '复制'}</span>
                </button>

                <a
                  href={permanentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-xs flex items-center justify-center transition-colors shrink-0"
                  title="在新窗口中全屏打开原生页面"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>✨ 此链接永久托管存储在数据库中，可分享给任何人</span>
                <button
                  type="button"
                  onClick={handleLoadToEditor}
                  className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                >
                  载入到当前工作区进一步编辑
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t"
        >
          <div style={{ color: 'var(--text-muted)' }} className="text-xs">
            选择载入到编辑器以实时修改，或一键直接生成永久短链
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Load into Editor Button */}
            <button
              onClick={handleLoadToEditor}
              disabled={loading}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-main)',
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold border rounded-xl hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>📥 载入到编辑器</span>
            </button>

            {/* Direct Generate Permalink Button */}
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md shadow-pink-500/25 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>🚀 生成永久链接</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

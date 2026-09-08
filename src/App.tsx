import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { ViewTab, Snippet, AIGenerateResponse, ThemeMode } from './types';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { PublishModal } from './components/PublishModal';
import { ShareModal } from './components/ShareModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CloudflareModal } from './components/CloudflareModal';
import { MySnippetsModal } from './components/MySnippetsModal';
import { PasscodeModal } from './components/PasscodeModal';
import { ImportCodeModal } from './components/ImportCodeModal';
import { SkyQuickRenderer } from './components/SkyQuickRenderer';
import { parseFullHtml } from './utils/htmlParser';
import { DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS } from './constants/defaultSnippet';

export default function App() {
  const [appMode, setAppMode] = useState<'workbench' | 'generator'>('workbench');
  const [activeTab, setActiveTab] = useState<ViewTab>('html');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);

  const [title, setTitle] = useState('✨ HTML 在线代码托管');
  const [description, setDescription] = useState('HTML / CSS / JS 实时预览与一键托管分享平台');
  const [slug, setSlug] = useState('');
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Theme mode (Dark, Light, High-Contrast)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('htmlshare_theme');
      if (saved === 'light' || saved === 'high-contrast' || saved === 'dark') {
        return saved;
      }
    } catch {}
    return 'dark';
  });

  // Sync theme with html data-theme attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('htmlshare_theme', theme);
    } catch {}
  }, [theme]);

  // Modals state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [showMySnippetsModal, setShowMySnippetsModal] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  // Workbench layout view mode ('split' | 'editor' | 'preview')
  const [workbenchLayout, setWorkbenchLayout] = useState<'split' | 'editor' | 'preview'>('split');

  // Share result URLs
  const [publishedShareUrl, setPublishedShareUrl] = useState('');
  const [publishedRawUrl, setPublishedRawUrl] = useState('');

  // Track code changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [html, css, js]);

  // Handle URL route loading on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/s/')) {
      const targetSlug = path.replace('/s/', '').trim();
      if (targetSlug) {
        loadSnippetFromSlug(targetSlug);
      }
    }
  }, []);

  // Global drag & drop support for HTML files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = (event.target?.result as string) || '';
            const parsed = parseFullHtml(content, true);
            setHtml(parsed.html);
            setCss(parsed.css);
            setJs(parsed.js);
            if (parsed.title) {
              setTitle(parsed.title);
            } else {
              setTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
            setCurrentSnippetId(null);
            setSlug('');
            setHasUnsavedChanges(true);
          };
          reader.readAsText(file);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const loadSnippetFromSlug = async (targetSlug: string, passcode?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (passcode) headers['x-snippet-passcode'] = passcode;

      const res = await fetch(`/api/snippets/${targetSlug}`, { headers });
      const json = await res.json();

      if (!json.success) {
        alert(json.error || '无法加载该代码片段');
        return;
      }

      const snippet: Snippet = json.data;

      if (snippet.hasPasscode && !passcode) {
        setPendingSlug(targetSlug);
        setShowPasscodeModal(true);
        return;
      }

      setHtml(snippet.html || '');
      setCss(snippet.css || '');
      setJs(snippet.js || '');
      setTitle(snippet.title || '');
      setDescription(snippet.description || '');
      setSlug(snippet.slug);
      setCurrentSnippetId(snippet.id);
      setHasUnsavedChanges(false);
      setShowPasscodeModal(false);
      setPasscodeError('');
    } catch (err: any) {
      console.error('Failed to load snippet:', err);
    }
  };

  const handlePasscodeSubmit = (passcode: string) => {
    if (pendingSlug) {
      loadSnippetFromSlug(pendingSlug, passcode);
    }
  };

  const handleNewSnippet = () => {
    if (hasUnsavedChanges && !window.confirm('当前有修改未保存，确定要新建空白片段吗？')) {
      return;
    }
    setHtml('');
    setCss('');
    setJs('');
    setTitle('未命名 HTML 片段');
    setDescription('');
    setSlug('');
    setCurrentSnippetId(null);
    setHasUnsavedChanges(false);
  };

  const handleSavePublish = async (options: {
    title: string;
    description: string;
    slug: string;
    expiresInHours: number | null;
    passcode?: string;
    isPublic: boolean;
    tags: string[];
  }) => {
    setIsPublishing(true);
    try {
      const payload = {
        id: currentSnippetId,
        title: options.title,
        description: options.description,
        slug: options.slug,
        html,
        css,
        js,
        isPublic: options.isPublic,
        passcode: options.passcode,
        expiresInHours: options.expiresInHours,
        tags: options.tags,
      };

      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let json: any;
      try {
        json = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(
          res.ok
            ? '后端返回非 JSON 响应。如果您使用的是 Cloudflare Pages，请确认已在 Pages Settings > Functions > KV namespace bindings 中将 Variable name 绑定为 KV_SNIPPETS'
            : `服务器返回异常 (HTTP ${res.status}): ${responseText.slice(0, 100)}`
        );
      }

      if (!json.success) {
        throw new Error(json.error || '保存失败');
      }

      const data: Snippet = json.data;
      setTitle(data.title);
      setDescription(data.description || '');
      setSlug(data.slug);
      setCurrentSnippetId(data.id);
      setPublishedShareUrl(json.shareUrl);
      setPublishedRawUrl(json.rawUrl);
      setHasUnsavedChanges(false);

      setShowPublishModal(false);
      setShowShareModal(true);
    } catch (err: any) {
      alert('保存错误: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleFork = async (targetSlug: string) => {
    try {
      const res = await fetch(`/api/snippets/${targetSlug}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const snippet: Snippet = json.data;
      setHtml(snippet.html || '');
      setCss(snippet.css || '');
      setJs(snippet.js || '');
      setTitle(snippet.title);
      setDescription(snippet.description || '');
      setSlug(snippet.slug);
      setCurrentSnippetId(snippet.id);
      setHasUnsavedChanges(false);

      alert(`Fork 成功！已创建副本 /s/${snippet.slug}`);
    } catch (err: any) {
      alert('Fork 失败: ' + err.message);
    }
  };

  const handleApplyAICode = (aiData: AIGenerateResponse) => {
    if (aiData.html) setHtml(aiData.html);
    if (aiData.css) setCss(aiData.css);
    if (aiData.js) setJs(aiData.js);
    if (aiData.title) setTitle(aiData.title);
    setHasUnsavedChanges(true);
  };

  const handleApplyImport = (data: { html: string; css: string; js: string; title?: string }) => {
    setHtml(data.html);
    setCss(data.css);
    setJs(data.js);
    if (data.title) {
      setTitle(data.title);
    }
    setCurrentSnippetId(null);
    setSlug('');
    setHasUnsavedChanges(true);
  };

  const handleSelectSnippetFromList = (snippet: Snippet) => {
    setHtml(snippet.html || '');
    setCss(snippet.css || '');
    setJs(snippet.js || '');
    setTitle(snippet.title || '');
    setDescription(snippet.description || '');
    setSlug(snippet.slug);
    setCurrentSnippetId(snippet.id);
    setHasUnsavedChanges(false);
  };

  const handleOpenRawPage = () => {
    if (slug) {
      window.open(`/raw/${slug}`, '_blank');
    } else {
      // Create temporary blob preview
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
      }}
      className="h-[100dvh] min-h-[100dvh] w-full max-w-[100vw] flex flex-col overflow-hidden font-sans select-none transition-colors"
    >
      {/* Top Header Navbar */}
      <Header
        appMode={appMode}
        onToggleAppMode={() => setAppMode(appMode === 'workbench' ? 'generator' : 'workbench')}
        onNew={handleNewSnippet}
        onOpenImportModal={() => setShowImportModal(true)}
        onSave={() => setShowPublishModal(true)}
        onOpenAI={() => setShowAIModal(true)}
        onOpenMySnippets={() => setShowMySnippetsModal(true)}
        onOpenCloudflare={() => setShowCloudflareModal(true)}
        onOpenRawPage={handleOpenRawPage}
        hasUnsavedChanges={hasUnsavedChanges}
        currentTitle={title}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Mode 1: Sky Quick Generator Mode (Inspired by wasmer HTML Renderer) */}
      {appMode === 'generator' ? (
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          <SkyQuickRenderer
            theme={theme}
            onThemeToggle={() =>
              setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'high-contrast' : 'dark')
            }
            onOpenWorkbench={(newCode, newSlug) => {
              if (newCode) {
                const parsed = parseFullHtml(newCode, true);
                setHtml(parsed.html);
                setCss(parsed.css);
                setJs(parsed.js);
                if (parsed.title) setTitle(parsed.title);
              }
              if (newSlug) {
                setSlug(newSlug);
                loadSnippetFromSlug(newSlug);
              }
              setAppMode('workbench');
            }}
          />
        </div>
      ) : (
        /* Mode 2: Multi-window Code Workbench */
        <>
          {/* Global & Responsive View Toggle Bar */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="flex items-center justify-between px-3 py-1.5 border-b text-xs shrink-0 z-10 gap-2"
          >
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <button
                onClick={() => setWorkbenchLayout('split')}
                style={{
                  backgroundColor: workbenchLayout === 'split' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: workbenchLayout === 'split' ? 'var(--accent-text)' : 'var(--text-main)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="px-2.5 py-1.5 min-h-[32px] rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                title="左右双栏分屏视图 (代码 + 实时预览)"
              >
                <span>⬍</span>
                <span>分屏协作</span>
              </button>
              <button
                onClick={() => setWorkbenchLayout('preview')}
                style={{
                  backgroundColor: workbenchLayout === 'preview' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: workbenchLayout === 'preview' ? 'var(--accent-text)' : 'var(--text-main)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="px-2.5 py-1.5 min-h-[32px] rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                title="全屏完整预览 (100% 宽屏，完整呈现图一桌面双栏与歌词效果)"
              >
                <span>👁️</span>
                <span>纯预览 (全宽)</span>
              </button>
              <button
                onClick={() => setWorkbenchLayout('editor')}
                style={{
                  backgroundColor: workbenchLayout === 'editor' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: workbenchLayout === 'editor' ? 'var(--accent-text)' : 'var(--text-main)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="px-2.5 py-1.5 min-h-[32px] rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                title="纯代码编辑模式"
              >
                <span>💻</span>
                <span>代码模式</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {workbenchLayout === 'preview' && (
                <span className="hidden sm:inline-flex text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ✓ 100% 全屏桌面渲染模式
                </span>
              )}
              <button
                onClick={handleOpenRawPage}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
                className="px-2.5 py-1.5 border rounded-lg hover:opacity-80 transition-opacity shrink-0 flex items-center justify-center gap-1 text-xs font-semibold min-h-[32px] cursor-pointer"
                title="在新标签页中独立全屏运行 (图一效果)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">独立新窗口打开</span>
              </button>
            </div>
          </div>

          {/* Main Responsive Workbench */}
          <main
            className={`flex-1 overflow-hidden relative ${
              workbenchLayout === 'split'
                ? 'grid grid-cols-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-2'
                : 'flex flex-col'
            }`}
          >
            {/* Left Column: Code Editor */}
            <div
              className={`h-full overflow-hidden ${
                workbenchLayout === 'editor'
                  ? 'flex-1 flex flex-col'
                  : workbenchLayout === 'split'
                  ? 'h-full'
                  : 'hidden'
              }`}
            >
              <CodeEditor
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                html={html}
                setHtml={setHtml}
                css={css}
                setCss={setCss}
                js={js}
                setJs={setJs}
              />
            </div>

            {/* Right Column: Live Responsive Preview & Terminal Panel */}
            <div
              style={{ borderColor: 'var(--border-subtle)' }}
              className={`h-full overflow-hidden transition-colors ${
                workbenchLayout === 'preview'
                  ? 'flex-1 flex flex-col'
                  : workbenchLayout === 'split'
                  ? 'h-full border-t lg:border-t-0 lg:border-l'
                  : 'hidden'
              }`}
            >
              <PreviewPanel
                html={html}
                css={css}
                js={js}
                rawUrl={slug ? `/raw/${slug}` : undefined}
                isMaximized={workbenchLayout === 'preview'}
                onToggleMaximize={() =>
                  setWorkbenchLayout((prev) => (prev === 'preview' ? 'split' : 'preview'))
                }
                onOpenRaw={handleOpenRawPage}
              />
            </div>
          </main>
        </>
      )}

      {/* Publish Options Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handleSavePublish}
        initialTitle={title}
        initialDescription={description}
        initialSlug={slug}
        isPublishing={isPublishing}
      />

      {/* Share Links Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        slug={slug}
        shareUrl={publishedShareUrl || `/s/${slug}`}
        rawUrl={publishedRawUrl || `/raw/${slug}`}
        title={title}
        html={html}
        css={css}
        js={js}
      />

      {/* Gemini AI Code Generator Drawer Modal */}
      <AIAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplyCode={handleApplyAICode}
        currentHtml={html}
        currentCss={css}
        currentJs={js}
      />

      {/* Cloudflare DB & Worker Export Modal */}
      <CloudflareModal
        isOpen={showCloudflareModal}
        onClose={() => setShowCloudflareModal(false)}
      />

      {/* My Snippets Explorer Modal */}
      <MySnippetsModal
        isOpen={showMySnippetsModal}
        onClose={() => setShowMySnippetsModal(false)}
        onSelectSnippet={handleSelectSnippetFromList}
        onForkSnippet={handleFork}
      />

      {/* Password Protection Lock Modal */}
      <PasscodeModal
        isOpen={showPasscodeModal}
        onSubmit={handlePasscodeSubmit}
        errorMsg={passcodeError}
      />

      {/* Code Import and Permalink Generator Modal */}
      <ImportCodeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onApplyToEditor={handleApplyImport}
        onGeneratedPermalink={(code) => {
          // If generated, user can also open it or save it in my snippets
          setSlug(code);
        }}
      />
    </div>
  );
}

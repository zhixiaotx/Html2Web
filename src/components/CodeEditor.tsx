import React, { useRef, useState } from 'react';
import { ViewTab } from '../types';
import {
  FileCode,
  Palette,
  Terminal,
  Wand2,
  Copy,
  Trash2,
  Layers,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { formatCode } from '../utils/prettierFormatter';

interface CodeEditorProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  html: string;
  setHtml: (val: string) => void;
  css: string;
  setCss: (val: string) => void;
  js: string;
  setJs: (val: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeTab,
  setActiveTab,
  html,
  setHtml,
  css,
  setCss,
  js,
  setJs,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatNotice, setFormatNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'html':
        return html;
      case 'css':
        return css;
      case 'js':
        return js;
      case 'combined':
        return `<!-- HTML -->\n${html}\n\n/* CSS */\n<style>\n${css}\n</style>\n\n// JavaScript\n<script>\n${js}\n</script>`;
    }
  };

  const setCurrentCode = (val: string) => {
    switch (activeTab) {
      case 'html':
        setHtml(val);
        break;
      case 'css':
        setCss(val);
        break;
      case 'js':
        setJs(val);
        break;
      case 'combined':
        // Read only in combined view
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      setCurrentCode(newVal);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Prettier Code Beautifier
  const handlePrettierBeautify = async () => {
    if (isFormatting) return;
    setIsFormatting(true);
    setFormatNotice(null);

    try {
      if (activeTab === 'html') {
        const res = await formatCode(html, 'html');
        setHtml(res.formatted);
        setFormatNotice(res.error || '✨ HTML 已完成 Prettier 自动缩进与规范化排版');
      } else if (activeTab === 'css') {
        const res = await formatCode(css, 'css');
        setCss(res.formatted);
        setFormatNotice(res.error || '✨ CSS 已完成 Prettier 属性整理与规范化排版');
      } else if (activeTab === 'js') {
        const res = await formatCode(js, 'js');
        setJs(res.formatted);
        setFormatNotice(res.error || '✨ JavaScript 已完成 Prettier 规范化排列');
      } else if (activeTab === 'combined') {
        // Format all three simultaneously!
        const [hRes, cRes, jRes] = await Promise.all([
          formatCode(html, 'html'),
          formatCode(css, 'css'),
          formatCode(js, 'js'),
        ]);
        setHtml(hRes.formatted);
        setCss(cRes.formatted);
        setJs(jRes.formatted);
        setFormatNotice('✨ 已将 HTML、CSS 与 JS 全部完成 Prettier 批量美化排版');
      }
    } catch (err: any) {
      setFormatNotice(`格式化异常: ${err?.message || '未知错误'}`);
    } finally {
      setIsFormatting(false);
      setTimeout(() => {
        setFormatNotice(null);
      }, 3500);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm(`确定要清空当前的 ${activeTab.toUpperCase()} 代码吗？`)) {
      setCurrentCode('');
    }
  };

  const currentText = getCurrentCode();
  const lineCount = currentText.split('\n').length;
  const charCount = currentText.length;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-app)',
        borderColor: 'var(--border-subtle)',
      }}
      className="h-full flex flex-col border-r transition-colors"
    >
      {/* Editor Header / Tab Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
        className="h-11 border-b px-3 flex items-center justify-between gap-2 shrink-0 select-none"
      >
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'html'
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                : 'hover:opacity-80'
            }`}
            style={{
              color: activeTab !== 'html' ? 'var(--text-muted)' : undefined,
            }}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-500" />
            <span>HTML</span>
          </button>

          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'css'
                ? 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                : 'hover:opacity-80'
            }`}
            style={{
              color: activeTab !== 'css' ? 'var(--text-muted)' : undefined,
            }}
          >
            <Palette className="w-3.5 h-3.5 text-sky-500" />
            <span>CSS</span>
          </button>

          <button
            onClick={() => setActiveTab('js')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'js'
                ? 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/30'
                : 'hover:opacity-80'
            }`}
            style={{
              color: activeTab !== 'js' ? 'var(--text-muted)' : undefined,
            }}
          >
            <Terminal className="w-3.5 h-3.5 text-yellow-500" />
            <span>JS</span>
          </button>

          <button
            onClick={() => setActiveTab('combined')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'combined'
                ? 'bg-purple-500/15 text-purple-500 border border-purple-500/30'
                : 'hover:opacity-80'
            }`}
            style={{
              color: activeTab !== 'combined' ? 'var(--text-muted)' : undefined,
            }}
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">合并预览</span>
          </button>
        </div>

        {/* Editor Controls */}
        <div className="flex items-center gap-2">
          {/* Prominent '一键美化代码' Button */}
          <button
            onClick={handlePrettierBeautify}
            disabled={isFormatting}
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
              borderColor: 'var(--border-accent)',
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-md hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
            title="使用 Prettier 自动缩进与规范化排版 (支持 HTML、CSS、JS)"
            id="beautify-code-button"
          >
            {isFormatting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            <span className="font-bold">一键美化代码</span>
          </button>

          <button
            onClick={handleCopy}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
            className="p-1.5 border rounded-md hover:opacity-80 transition-colors cursor-pointer"
            title="复制当前代码"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {activeTab !== 'combined' && (
            <button
              onClick={handleClear}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
              className="p-1.5 border rounded-md hover:text-rose-500 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="清空当前代码"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Formatting Feedback Notice Banner */}
      {formatNotice && (
        <div
          style={{
            backgroundColor: 'var(--badge-bg)',
            borderColor: 'var(--border-accent)',
            color: 'var(--text-main)',
          }}
          className="px-3 py-1.5 text-xs border-b flex items-center justify-between gap-2 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-medium">{formatNotice}</span>
          </div>
          <button
            onClick={() => setFormatNotice(null)}
            className="text-[10px] opacity-70 hover:opacity-100 cursor-pointer"
          >
            关闭
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div
        style={{
          backgroundColor: 'var(--bg-app)',
        }}
        className="flex-1 relative flex overflow-hidden font-mono text-sm"
      >
        {/* Line Numbers */}
        <div
          style={{
            backgroundColor: 'var(--bg-gutter)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-dim)',
          }}
          className="w-11 py-3 text-right pr-3 select-none border-r shrink-0 font-mono text-xs leading-6"
        >
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={getCurrentCode()}
          onChange={(e) => setCurrentCode(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={activeTab === 'combined'}
          placeholder={
            activeTab === 'html'
              ? '<!-- 输入 HTML 标记结构 -->'
              : activeTab === 'css'
              ? '/* 输入 CSS 样式 */'
              : activeTab === 'js'
              ? '// 输入 JavaScript 客户端脚本'
              : ''
          }
          spellCheck={false}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-main)',
          }}
          className="w-full h-full p-3 focus:outline-none resize-none leading-6 tab-size-2 font-mono text-xs sm:text-sm overflow-y-auto"
        />
      </div>

      {/* Editor Footer Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-dim)',
        }}
        className="h-7 border-t px-3 flex items-center justify-between text-[11px] shrink-0 select-none"
      >
        <div className="flex items-center gap-3">
          <span>行数: {lineCount}</span>
          <span>字符数: {charCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Prettier 就绪</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold">模式: {activeTab.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

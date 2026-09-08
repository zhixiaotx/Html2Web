import React, { useState, useEffect, useRef } from 'react';
import { DeviceViewport, ConsoleLog } from '../types';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Terminal,
  Trash2,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Check,
} from 'lucide-react';
import { assembleFullHtml } from '../utils/htmlAssembler';

interface PreviewPanelProps {
  html: string;
  css: string;
  js: string;
  rawUrl?: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  html,
  css,
  js,
  rawUrl,
}) => {
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Combine HTML + CSS + JS into single executable document with console proxy
  const generatePreviewDoc = () => {
    return assembleFullHtml({
      title: 'HTMLShare 实时预览',
      html,
      css,
      js,
      includeConsoleProxy: true,
    });
  };

  // Listen to postMessage from iframe console proxy
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'HTMLSHARE_CONSOLE_LOG') {
        const newLog: ConsoleLog = {
          id: Math.random().toString(36).substring(2, 9),
          type: e.data.logType,
          message: e.data.message,
          timestamp: e.data.timestamp,
        };
        setLogs((prev) => [...prev.slice(-100), newLog]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update iframe srcdoc
  useEffect(() => {
    if (!autoRefresh && refreshTrigger === 0) return;

    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = generatePreviewDoc();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [html, css, js, autoRefresh, refreshTrigger]);

  const handleManualRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setLogs([]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] border-x border-slate-800 shadow-2xl rounded-t-xl';
      case 'tablet':
        return 'w-[768px] border-x border-slate-800 shadow-2xl rounded-t-xl';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/60 overflow-hidden">
      {/* Preview Header / Device Switcher Toolbar */}
      <div className="h-11 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between gap-2 shrink-0 select-none">
        {/* Device Viewport Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="桌面视角 (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">桌面</span>
          </button>

          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="平板视角 (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">平板</span>
          </button>

          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="手机视角 (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">手机</span>
          </button>
        </div>

        {/* Center Live Indicator */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden md:inline">实时渲染预览</span>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none hover:text-slate-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="hidden sm:inline text-[11px]">自动刷新</span>
          </label>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="手动刷新预览页面"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Open Raw Host URL */}
          {rawUrl && (
            <a
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-md transition-colors"
              title="在独立窗口中打开 RAW 托管网页"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">RAW 托管页</span>
            </a>
          )}

          {/* Console Drawer Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              showConsole || logs.length > 0
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3 h-3 text-amber-400" />
            <span>控制台 ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-950/40 relative flex justify-center items-stretch p-0 overflow-hidden">
        <iframe
          ref={iframeRef}
          title="HTMLShare Preview"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          className={`h-full bg-white transition-all duration-200 ${getViewportWidth()}`}
        />
      </div>

      {/* Terminal / Console Log Drawer */}
      {showConsole && (
        <div className="h-44 bg-slate-950 border-t border-slate-800 flex flex-col font-mono text-xs text-slate-300 shrink-0">
          {/* Console Header */}
          <div className="h-8 bg-slate-900 border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">网页 JavaScript 控制台</span>
              <span className="text-[10px] text-slate-500">({logs.length} 条记录)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearLogs}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="清空控制台日志"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Console Output */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1.5 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">暂无控制台输出日志...</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 py-0.5 border-b border-slate-900/50 ${
                    log.type === 'error'
                      ? 'text-rose-400 bg-rose-500/10 px-2 rounded'
                      : log.type === 'warn'
                      ? 'text-amber-400 bg-amber-500/10 px-2 rounded'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 text-[10px] shrink-0 font-sans">{log.timestamp}</span>
                  <span className="font-semibold uppercase text-[10px] px-1 bg-slate-900 rounded shrink-0">
                    {log.type}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

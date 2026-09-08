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
  Maximize2,
  Minimize2,
  Download,
  Copy,
  Check,
  SunMedium,
  Moon,
  Grid,
  Tv,
  Maximize,
  ZoomIn,
  ZoomOut,
  Scan,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { assembleFullHtml } from '../utils/htmlAssembler';

interface PreviewPanelProps {
  html: string;
  css: string;
  js: string;
  rawUrl?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onOpenRaw?: () => void;
}

type CanvasBg = 'checker' | 'white' | 'dark' | 'transparent';
type ScaleMode = 'fit' | 'fit-w' | '100' | '75' | '50' | '33' | 'custom';

interface DevicePreset {
  id: DeviceViewport;
  name: string;
  shortName: string;
  width: number;
  height: number;
  icon: React.ElementType;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'fluid', name: '自适应 100% 充满', shortName: '自适应', width: 0, height: 0, icon: Maximize },
  { id: 'desktop', name: '标准桌面 (1280×800)', shortName: '桌面', width: 1280, height: 800, icon: Monitor },
  { id: 'large-desktop', name: '大屏桌面 (1440×900)', shortName: '大屏', width: 1440, height: 900, icon: Tv },
  { id: 'full-hd', name: '全高清 (1920×1080)', shortName: '1080P', width: 1920, height: 1080, icon: Monitor },
  { id: 'tablet', name: '平板电脑 (768×1024)', shortName: '平板', width: 768, height: 1024, icon: Tablet },
  { id: 'mobile', name: '智能手机 (390×844)', shortName: '手机', width: 390, height: 844, icon: Smartphone },
];

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  html,
  css,
  js,
  rawUrl,
  isMaximized = false,
  onToggleMaximize,
  onOpenRaw,
}) => {
  // Default to standard desktop with 'fit' mode (auto scaled to fit both width and height completely)
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [customWidth, setCustomWidth] = useState<number>(1280);
  const [customHeight, setCustomHeight] = useState<number>(800);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('fit');
  const [customZoom, setCustomZoom] = useState<number>(1);
  const [canvasBg, setCanvasBg] = useState<CanvasBg>('checker');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [showCustomSizeModal, setShowCustomSizeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Assemble HTML
  const generatePreviewDoc = () => {
    return assembleFullHtml({
      title: 'HTML 实时渲染预览',
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
    }, 120);

    return () => clearTimeout(timer);
  }, [html, css, js, autoRefresh, refreshTrigger]);

  const handleManualRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setLogs([]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleCopyRenderedHtml = () => {
    const fullHtml = assembleFullHtml({ html, css, js, title: 'HTMLShare Export' });
    navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const fullHtml = assembleFullHtml({ html, css, js, title: 'HTMLShare Export' });
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rendered_page_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get active target dimensions
  const isFluidMode = viewport === 'fluid';
  
  const getTargetDimensions = (): { w: number; h: number } => {
    if (viewport === 'custom') {
      return { w: customWidth || 1280, h: customHeight || 800 };
    }
    const preset = DEVICE_PRESETS.find((p) => p.id === viewport);
    if (preset && preset.width > 0) {
      return { w: preset.width, h: preset.height };
    }
    return { w: containerDimensions.width || 1280, h: containerDimensions.height || 800 };
  };

  const targetDim = getTargetDimensions();

  // Calculate Scale Factor so that the entire page (Width AND Height) is 100% visible inside the container
  const getScaleFactor = (): number => {
    if (isFluidMode) return 1;
    if (scaleMode === '100') return 1;
    if (scaleMode === '75') return 0.75;
    if (scaleMode === '50') return 0.5;
    if (scaleMode === '33') return 0.33;
    if (scaleMode === 'custom') return customZoom;

    // Available container space (leaving 24px safety padding on each side)
    const availW = Math.max(120, containerDimensions.width - 32);
    const availH = Math.max(120, containerDimensions.height - 32);

    if (scaleMode === 'fit-w') {
      if (targetDim.w > 0) {
        return Math.min(1.5, Math.max(0.1, availW / targetDim.w));
      }
      return 1;
    }

    if (scaleMode === 'fit') {
      if (targetDim.w > 0 && targetDim.h > 0) {
        const scaleX = availW / targetDim.w;
        const scaleY = availH / targetDim.h;
        // Min scale ensures both width and height fit 100% inside container
        return Math.max(0.1, Math.min(1, scaleX, scaleY));
      }
      return 1;
    }

    return 1;
  };

  const scaleFactor = getScaleFactor();
  const scaledWidth = isFluidMode ? '100%' : `${targetDim.w * scaleFactor}px`;
  const scaledHeight = isFluidMode ? '100%' : `${targetDim.h * scaleFactor}px`;

  const handleSelectPreset = (preset: DevicePreset) => {
    setViewport(preset.id);
    if (preset.width > 0) {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
    }
    // Default to 'fit' mode on mobile/tablet/desktop so all 4 edges fit on screen
    if (preset.id !== 'fluid') {
      setScaleMode('fit');
    }
  };

  const handleZoomIn = () => {
    setScaleMode('custom');
    setCustomZoom((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScaleMode('custom');
    setCustomZoom((prev) => Math.max(0.15, Number((prev - 0.1).toFixed(2))));
  };

  const getCanvasBgStyle = (): string => {
    switch (canvasBg) {
      case 'white':
        return 'bg-white';
      case 'dark':
        return 'bg-[#0b0f19]';
      case 'transparent':
        return 'bg-transparent';
      case 'checker':
      default:
        return 'bg-[#090d16] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden select-none">
      {/* Top Header / Viewport & Tools Toolbar */}
      <div className="h-11 bg-slate-950 border-b border-slate-800/80 px-2 sm:px-3 flex items-center justify-between gap-1.5 shrink-0 overflow-x-auto">
        {/* Left: Device Viewports */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
          {DEVICE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = viewport === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`${preset.name}${preset.width ? ` (${preset.width}×${preset.height})` : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">{preset.shortName}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              setViewport('custom');
              setShowCustomSizeModal(true);
            }}
            className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewport === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="自定义画布宽高"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden lg:inline">自定义</span>
          </button>
        </div>

        {/* Center: Scale & Canvas Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isFluidMode && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-semibold text-slate-400">
              {/* Fit All mode (上下左右 100% 完整可见) */}
              <button
                onClick={() => setScaleMode('fit')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                  scaleMode === 'fit'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="🎯 智能全显适应：同时按宽与高自动缩放，保证上下左右所有边缘 100% 完整显示在当前窗口内"
              >
                <Scan className="w-3 h-3 text-emerald-400" />
                <span>完整全显 ({Math.round(scaleFactor * 100)}%)</span>
              </button>

              <button
                onClick={() => setScaleMode('fit-w')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  scaleMode === 'fit-w'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="↔️ 适应宽度"
              >
                适应宽
              </button>

              <button
                onClick={() => setScaleMode('100')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  scaleMode === '100'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="100% 原始像素"
              >
                100%
              </button>

              <button
                onClick={() => setScaleMode('75')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  scaleMode === '75'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="75% 缩放"
              >
                75%
              </button>

              <button
                onClick={() => setScaleMode('50')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  scaleMode === '50'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="50% 缩放"
              >
                50%
              </button>

              {/* Zoom buttons */}
              <div className="flex items-center border-l border-slate-800 pl-1 ml-0.5 gap-0.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
                  title="缩小"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
                  title="放大"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Background Canvas Mode */}
          <div className="hidden xl:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => setCanvasBg('checker')}
              className={`p-1 rounded cursor-pointer ${
                canvasBg === 'checker' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="网格底色"
            >
              <Grid className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCanvasBg('white')}
              className={`p-1 rounded cursor-pointer ${
                canvasBg === 'white' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="亮色底色"
            >
              <SunMedium className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCanvasBg('dark')}
              className={`p-1 rounded cursor-pointer ${
                canvasBg === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="暗色底色"
            >
              <Moon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Copy HTML */}
          <button
            onClick={handleCopyRenderedHtml}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="复制渲染后的完整 HTML 文档"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download HTML File */}
          <button
            onClick={handleDownloadHtml}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="下载单文件 HTML 网页"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="刷新渲染页面"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Open Raw / Independent Tab */}
          <button
            onClick={onOpenRaw || (() => rawUrl && window.open(rawUrl, '_blank'))}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-pink-300 hover:text-pink-200 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-md transition-colors cursor-pointer"
            title="在独立浏览器新标签页全屏渲染 (100% 浏览器原生模式，无任何外壳约束)"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">独立新窗口</span>
          </button>

          {/* Maximize Toggle */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                isMaximized
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
              title={isMaximized ? '还原分屏视图' : '全屏展开预览'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Console Drawer Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              showConsole || logs.length > 0
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="调试控制台"
          >
            <Terminal className="w-3 h-3 text-amber-400" />
            <span className="text-[11px]">({logs.length})</span>
          </button>
        </div>
      </div>

      {/* Frame Container Viewport Canvas */}
      <div
        ref={containerRef}
        className={`flex-1 w-full h-full relative overflow-auto ${
          isFluidMode ? 'p-0' : 'p-3 sm:p-4'
        } ${getCanvasBgStyle()}`}
      >
        {isFluidMode ? (
          /* Pure 100% Fluid Full-fill Viewport */
          <iframe
            ref={iframeRef}
            title="HTML 渲染实时预览"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-downloads allow-popups allow-pointer-lock"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            className="w-full h-full min-w-full min-h-full bg-white border-0 block m-0 p-0"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          /* Scaled Device Container Frame: Mathematically sized outer wrapper + transform-scaled inner frame */
          <div
            style={{
              width: scaledWidth,
              height: scaledHeight,
              minWidth: scaledWidth,
              minHeight: scaledHeight,
            }}
            className="relative transition-all duration-200 shadow-2xl rounded-lg overflow-hidden border border-slate-700/80 bg-white m-auto"
          >
            <div
              style={{
                width: `${targetDim.w}px`,
                height: `${targetDim.h}px`,
                transform: `scale(${scaleFactor})`,
                transformOrigin: 'top left',
              }}
              className="absolute top-0 left-0"
            >
              <iframe
                ref={iframeRef}
                title="HTML 渲染实时预览"
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-downloads allow-popups allow-pointer-lock"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="w-full h-full bg-white border-0 block"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Dimension & Status Bar */}
      {!isFluidMode && (
        <div className="h-6 bg-slate-950/90 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">{targetDim.w} × {targetDim.h} px</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-semibold">{Math.round(scaleFactor * 100)}% 渲染比例</span>
            {scaleMode === 'fit' && (
              <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded text-[10px] border border-emerald-800/40">
                上下左右全显
              </span>
            )}
          </div>
          <div className="text-slate-500 text-[10px]">
            可视画布: {Math.round(containerDimensions.width)} × {Math.round(containerDimensions.height)} px
          </div>
        </div>
      )}

      {/* Custom Size Modal */}
      {showCustomSizeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                设置自定义视口尺寸
              </h3>
              <button
                onClick={() => setShowCustomSizeModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">宽度 (Width px)</label>
                <input
                  type="number"
                  min="200"
                  max="3840"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Math.max(200, parseInt(e.target.value) || 1280))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">高度 (Height px)</label>
                <input
                  type="number"
                  min="200"
                  max="2160"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Math.max(200, parseInt(e.target.value) || 800))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setViewport('desktop');
                  setShowCustomSizeModal(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setViewport('custom');
                  setScaleMode('fit');
                  setShowCustomSizeModal(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                应用并全显适应
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Terminal Console Drawer */}
      {showConsole && (
        <div className="h-44 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 font-mono text-xs animate-in slide-in-from-bottom-5 duration-200">
          <div className="h-8 bg-slate-900/90 px-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>控制台输出日志 ({logs.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={clearLogs}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="清空控制台"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="text-slate-400 hover:text-slate-200 px-1.5 py-0.5 text-xs rounded hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 p-2 overflow-y-auto space-y-1 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic text-[11px] p-2">暂无控制台日志输出</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`px-2 py-1 rounded text-[11px] flex items-start gap-2 border ${
                    log.type === 'error'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-900/50'
                      : log.type === 'warn'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-900/50'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800/80'
                  }`}
                >
                  <span className="text-slate-500 text-[10px] shrink-0 font-sans">
                    [{log.timestamp}]
                  </span>
                  <span className="font-bold uppercase text-[10px] shrink-0 opacity-75">
                    {log.type}:
                  </span>
                  <span className="break-all whitespace-pre-wrap">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

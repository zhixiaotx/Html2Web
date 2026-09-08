import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Wand2,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  Zap,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCode,
} from 'lucide-react';
import { AIGenerateResponse } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCode: (data: AIGenerateResponse) => void;
  currentHtml: string;
  currentCss: string;
  currentJs: string;
}

const PRESETS = [
  '✨ 玻璃拟态 (Glassmorphism) 个人主页与社交卡片',
  '🚀 现代 SaaS 产品 Landing Page (带动态 Hero 动画)',
  '📊 极简风数据仪表盘与交互式统计图表',
  '🎨 炫酷霓虹灯光特效与 3D Hover 倾斜卡片',
  '⏱️ 精美数字倒计时与任务 Checklist 工具',
];

const OPTIMIZE_PRESETS = [
  '⚡ 全面性能优化、重排重绘治理与代码现代化重构',
  '📐 DOM 结构语义化与可访问性 (a11y) 增强',
  '🎨 CSS 渲染性能提升、GPU 加速与精简样式',
  '🧹 JS 事件解绑与内存泄漏排查、函数精简化',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyCode,
  currentHtml,
  currentCss,
  currentJs,
}) => {
  const [prompt, setPrompt] = useState('');
  const [actionType, setActionType] = useState<'generate' | 'fix' | 'enhance' | 'optimize'>('generate');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Custom API Provider (DeepSeek / OpenAI compatible)
  const [showCustomApi, setShowCustomApi] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('deepseek-chat');

  // Optimization Result Preview State
  const [optimizeResult, setOptimizeResult] = useState<AIGenerateResponse | null>(null);

  // Load custom provider config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('htmlshare_custom_ai');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.baseUrl) setApiBaseUrl(parsed.baseUrl);
        if (parsed.apiKey) setCustomApiKey(parsed.apiKey);
        if (parsed.model) setCustomModel(parsed.model);
      }
    } catch {}
  }, []);

  if (!isOpen) return null;

  const handleSaveCustomApi = () => {
    try {
      localStorage.setItem(
        'htmlshare_custom_ai',
        JSON.stringify({
          baseUrl: apiBaseUrl,
          apiKey: customApiKey,
          model: customModel,
        })
      );
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && actionType === 'generate') return;

    setLoading(true);
    setErrorMsg('');
    setOptimizeResult(null);

    handleSaveCustomApi();

    try {
      const bodyPayload: any = {
        prompt,
        currentHtml,
        currentCss,
        currentJs,
        actionType,
      };

      if (customApiKey.trim()) {
        bodyPayload.customProvider = {
          baseUrl: apiBaseUrl.trim() || 'https://api.deepseek.com/v1',
          apiKey: customApiKey.trim(),
          model: customModel.trim() || 'deepseek-chat',
        };
      }

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'AI 处理失败');
      }

      if (actionType === 'optimize') {
        // Show optimization report card
        setOptimizeResult(json.data);
      } else {
        onApplyCode(json.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI 响应超时，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApplyOptimized = () => {
    if (optimizeResult) {
      onApplyCode(optimizeResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
        }}
        className="border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div
          style={{
            borderColor: 'var(--border-subtle)',
          }}
          className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">AI 智能助手 & 代码优化</h3>
              <p className="text-xs text-slate-300">
                支持 Gemini 3.8 / DeepSeek / OpenAI 兼容接口，提供格式化、性能分析与重构
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            className="p-1.5 hover:opacity-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Action Modes */}
          <div
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
            }}
            className="grid grid-cols-4 gap-1.5 p-1 border rounded-xl"
          >
            <button
              type="button"
              onClick={() => {
                setActionType('generate');
                setOptimizeResult(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                actionType === 'generate'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                color: actionType === 'generate' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              🚀 全新生成
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('enhance');
                setOptimizeResult(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                actionType === 'enhance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                color: actionType === 'enhance' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              🎨 美化 UI
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('fix');
                setOptimizeResult(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                actionType === 'fix'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                color: actionType === 'fix' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              🛠️ 修复 BUG
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('optimize');
                setOptimizeResult(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                actionType === 'optimize'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                color: actionType === 'optimize' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              ⚡ 代码优化
            </button>
          </div>

          {/* Mode Description Banner */}
          {actionType === 'optimize' && (
            <div
              style={{
                backgroundColor: 'var(--badge-bg)',
                borderColor: 'var(--border-accent)',
                color: 'var(--text-main)',
              }}
              className="p-3 border rounded-xl text-xs space-y-1"
            >
              <div className="font-bold flex items-center gap-1.5 text-indigo-400">
                <Gauge className="w-4 h-4" />
                <span>代码优化与性能重构模式</span>
              </div>
              <p style={{ color: 'var(--text-muted)' }} className="text-[11px] leading-5">
                利用 AI 对当前的 HTML/CSS/JS 进行规范化排版、全量性能评估（DOM 深度、重排重绘、事件解绑）并提供生产级重构建议。
              </p>
            </div>
          )}

          {/* Prompt Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                style={{ color: 'var(--text-main)' }}
                className="block text-xs font-semibold mb-1.5 flex items-center justify-between"
              >
                <span>
                  {actionType === 'generate'
                    ? '描述你想要构建的页面或组件'
                    : actionType === 'optimize'
                    ? '优化侧重或重构要求 (选填)'
                    : '补充需求细节 (选填)'}
                </span>
                <span className="text-[11px] text-indigo-400 font-normal">支持自然语言描述</span>
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  actionType === 'generate'
                    ? '例如: 创建一个带有深色玻璃拟态效果的个人简历卡片，包含社交图标与项目经验，使用响应式布局'
                    : actionType === 'optimize'
                    ? '例如: 检查重排重绘问题，优化事件监听，将 CSS 转为现代 Flexbox/Grid 布局并提供性能报告'
                    : actionType === 'enhance'
                    ? '例如: 为当前卡片增加霓虹微光阴影、按钮 Hover 动画，并将整体排版间距调大'
                    : '例如: 修复按钮点击无响应以及 CSS 弹窗不居中的问题'
                }
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
                className="w-full border rounded-xl p-3 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Quick Presets */}
            {actionType === 'generate' && (
              <div>
                <span style={{ color: 'var(--text-dim)' }} className="block text-[11px] font-semibold mb-2">
                  快速快捷预设:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(preset.replace(/^[✨🚀📊🎨⏱️]\s*/, ''))}
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                      className="text-[11px] border hover:opacity-80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionType === 'optimize' && (
              <div>
                <span style={{ color: 'var(--text-dim)' }} className="block text-[11px] font-semibold mb-2">
                  常见优化方向:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {OPTIMIZE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(preset.replace(/^[⚡📐🎨🧹]\s*/, ''))}
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                      className="text-[11px] border hover:opacity-80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom DeepSeek / OpenAI API Accordion */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
              className="border rounded-xl p-3 text-xs"
            >
              <button
                type="button"
                onClick={() => setShowCustomApi(!showCustomApi)}
                className="w-full flex items-center justify-between text-left font-medium cursor-pointer"
                style={{ color: 'var(--text-main)' }}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI 接口设置 (支持 DeepSeek API / OpenAI 兼容接口)</span>
                  {customApiKey ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      自定义已启用
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">使用官方 Gemini</span>
                  )}
                </div>
                {showCustomApi ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCustomApi && (
                <div className="mt-3 pt-3 border-t space-y-2.5 animate-in fade-in duration-150" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    默认使用平台内置的 <strong>Gemini 3.8 Flash</strong>。若您希望使用 DeepSeek、OpenAI 或自建中转 API，可在下方填写：
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                        API Base URL
                      </label>
                      <input
                        type="text"
                        value={apiBaseUrl}
                        onChange={(e) => setApiBaseUrl(e.target.value)}
                        placeholder="https://api.deepseek.com/v1"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-main)',
                        }}
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                        模型名称 (Model)
                      </label>
                      <input
                        type="text"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        placeholder="deepseek-chat"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-main)',
                        }}
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      API Key (存储于本地浏览器)
                    </label>
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="sk-..."
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-main)',
                      }}
                      className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-400">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Optimization Result Report Card */}
            {optimizeResult && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-strong)',
                }}
                className="border rounded-xl p-4 space-y-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>
                      代码优化与性能分析报告
                    </span>
                  </div>
                  {optimizeResult.performanceScore && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 px-2.5 py-1 rounded-full text-xs font-extrabold">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>性能评分: {optimizeResult.performanceScore} / 100</span>
                    </div>
                  )}
                </div>

                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {optimizeResult.explanation}
                </p>

                {/* Suggestions List */}
                {optimizeResult.suggestions && optimizeResult.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-indigo-400">重构与优化亮点:</div>
                    <ul className="text-xs space-y-1 list-disc list-inside" style={{ color: 'var(--text-muted)' }}>
                      {optimizeResult.suggestions.map((sug, i) => (
                        <li key={i}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Analysis */}
                {optimizeResult.performanceAnalysis && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    {optimizeResult.performanceAnalysis.html && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="font-bold text-amber-500 mb-1">HTML 语义</div>
                        <div style={{ color: 'var(--text-muted)' }}>{optimizeResult.performanceAnalysis.html}</div>
                      </div>
                    )}
                    {optimizeResult.performanceAnalysis.css && (
                      <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                        <div className="font-bold text-sky-500 mb-1">CSS 渲染</div>
                        <div style={{ color: 'var(--text-muted)' }}>{optimizeResult.performanceAnalysis.css}</div>
                      </div>
                    )}
                    {optimizeResult.performanceAnalysis.js && (
                      <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="font-bold text-yellow-500 mb-1">JS 执行</div>
                        <div style={{ color: 'var(--text-muted)' }}>{optimizeResult.performanceAnalysis.js}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Apply Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmApplyOptimized}
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-text)',
                    }}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-lg hover:opacity-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>采纳并应用优化代码到编辑器</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notice */}
            {!optimizeResult && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="p-3 border rounded-xl flex items-center gap-2.5 text-[11px]"
              >
                <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                <span style={{ color: 'var(--text-muted)' }}>
                  基于 {customApiKey ? customModel || 'DeepSeek' : 'Gemini 3.8 Flash'}{' '}
                  智能引擎，自动为你格式化、进行性能分析并生成对应 HTML、CSS 与 JS 代码。
                </span>
              </div>
            )}

            {/* Submit Action */}
            {!optimizeResult && (
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                  className="px-4 py-2 text-xs font-semibold border rounded-xl hover:opacity-80 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-text)',
                  }}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:opacity-95"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {actionType === 'optimize' ? '正在执行深度性能分析与重构...' : '正在编写代码...'}
                      </span>
                    </>
                  ) : (
                    <>
                      {actionType === 'optimize' ? (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>立即开始代码优化 & 性能分析</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>立即生成并写入编辑器</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

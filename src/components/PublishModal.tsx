import React, { useState } from 'react';
import { X, Lock, Key, Clock, Link2, Sparkles, Shield, Tag } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (options: {
    title: string;
    description: string;
    slug: string;
    expiresInHours: number | null;
    passcode?: string;
    isPublic: boolean;
    tags: string[];
  }) => void;
  initialTitle: string;
  initialDescription: string;
  initialSlug: string;
  isPublishing: boolean;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  initialTitle,
  initialDescription,
  initialSlug,
  isPublishing,
}) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [slug, setSlug] = useState(initialSlug || '');
  const [expiresInHours, setExpiresInHours] = useState<number | null>(null); // null = Never
  const [enablePassword, setEnablePassword] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onPublish({
      title: title || '未命名 HTML 片段',
      description: description,
      slug: slug.trim().toLowerCase(),
      expiresInHours,
      passcode: enablePassword && passcode.trim() ? passcode.trim() : undefined,
      isPublic,
      tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">发布 & 保存代码片段</h3>
              <p className="text-xs text-slate-400">生成可随时分享与调用的短链接</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              片段标题 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: 响应式深色卡片组件"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              片段描述或备注
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要说明此组件或页面功能..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Custom Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                自定义短链 URL Slug
              </span>
              <span className="text-[11px] text-emerald-400 font-normal">免费支持自定义后缀</span>
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500">
              <span className="px-3 text-xs text-slate-500 select-none border-r border-slate-800 bg-slate-900/50 py-2.5">
                /s/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="留空自动生成 6 位随机短码"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Expiration Settings */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              过期时间设置
            </label>
            <select
              value={expiresInHours === null ? 'never' : expiresInHours}
              onChange={(e) =>
                setExpiresInHours(e.target.value === 'never' ? null : Number(e.target.value))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="never">永久有效 (Never Expire)</option>
              <option value={1}>1 小时后自动销毁</option>
              <option value={24}>24 小时后自动销毁 (1 天)</option>
              <option value={168}>7 天后自动销毁</option>
              <option value={720}>30 天后自动销毁</option>
            </select>
          </div>

          {/* Password Protection */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">启用访问密码保护</span>
                  <span className="text-[11px] text-slate-400 block">仅凭密码才能查看与渲染该代码</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enablePassword}
                onChange={(e) => setEnablePassword(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {enablePassword && (
              <div className="pt-2">
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3">
                  <Key className="w-3.5 h-3.5 text-slate-500 mr-2" />
                  <input
                    type="password"
                    required={enablePassword}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="输入访问密码..."
                    className="w-full bg-transparent py-2 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              分类标签 (用逗号分隔)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="例如: html5, css, animation, dark"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Banner */}
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2.5 text-xs text-indigo-300">
            <Shield className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>完全免费开箱即用，所有片段数据均存储并与 Cloudflare D1 / KV 保持一致。</span>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isPublishing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>正在保存...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>确认保存并生成短链</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2, Download, Globe, Archive } from 'lucide-react';
import JSZip from 'jszip';
import { assembleFullHtml } from '../utils/htmlAssembler';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  shareUrl: string;
  rawUrl: string;
  title: string;
  html: string;
  css: string;
  js: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  slug,
  shareUrl,
  rawUrl,
  title,
  html,
  css,
  js,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  // 严格修复 URL 拼接，防止出现 https://domain.devhttps://domain.dev/s/xxx 重复前缀
  const formatFullUrl = (url: string, fallbackPath: string) => {
    if (!url) return window.location.origin + fallbackPath;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fullShareUrl = formatFullUrl(shareUrl, `/s/${slug}`);
  const fullRawUrl = formatFullUrl(rawUrl, `/raw/${slug}`);
  const embedCode = `<iframe src="${fullRawUrl}" width="100%" height="500" style="border:none; border-radius:12px; overflow:hidden;" title="${title}"></iframe>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSingleHtml = () => {
    const fullHtml = assembleFullHtml({
      title: title || 'HTMLShare Hosted Page',
      html,
      css,
      js,
      includeConsoleProxy: false,
    });

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'snippet'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file('index.html', `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'HTMLShare Project'}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${html}
  <script src="script.js"></script>
</body>
</html>`);

    zip.file('style.css', css || '/* CSS Styles */');
    zip.file('script.js', js || '// JavaScript Script');

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'htmlshare-project'}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">代码片段发布成功！</h3>
              <p className="text-xs text-slate-400">短链接及 RAW 托管页面已准备就绪</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Share Viewer Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                HTMLShare 短链接页面
              </span>
              <span className="text-[11px] text-slate-500">可在编辑器中二次编辑与查看</span>
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                value={fullShareUrl}
                className="w-full bg-transparent px-2.5 text-xs text-indigo-300 font-mono focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(fullShareUrl, 'share')}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                {copiedType === 'share' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'share' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>

          {/* Raw Hosted Page Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ExternalLink className="w-3.5 h-3.5" />
                RAW 网页即时托管链接 (Direct Web Page)
              </span>
              <span className="text-[11px] text-emerald-500 font-medium">无边框直接运行 HTML</span>
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                value={fullRawUrl}
                className="w-full bg-transparent px-2.5 text-xs text-emerald-300 font-mono focus:outline-none"
              />
              <a
                href={fullRawUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-white mr-1"
                title="预览打开"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => copyToClipboard(fullRawUrl, 'raw')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                {copiedType === 'raw' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'raw' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>

          {/* Embed Iframe */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              嵌入网页 (iFrame 代码)
            </label>
            <div className="relative">
              <textarea
                rows={2}
                readOnly
                value={embedCode}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 font-mono focus:outline-none resize-none"
              />
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="absolute right-2 bottom-3 flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {copiedType === 'embed' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === 'embed' ? '已复制' : '复制嵌入代码'}</span>
              </button>
            </div>
          </div>

          {/* Download Local Files */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="block text-xs font-semibold text-slate-300 mb-2">离线导出下载</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadSingleHtml}
                className="flex items-center justify-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>下载单文件 (.html)</span>
              </button>

              <button
                onClick={handleDownloadZip}
                className="flex items-center justify-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4 text-amber-400" />
                <span>导出 ZIP 包 (.zip)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};

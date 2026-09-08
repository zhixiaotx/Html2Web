import React, { useState, useEffect } from 'react';
import { X, Cloud, Copy, Check, Database, Terminal, Shield, FileCode } from 'lucide-react';
import { CloudflareConfigExport } from '../types';

interface CloudflareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareModal: React.FC<CloudflareModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<CloudflareConfigExport | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'schema' | 'wrangler' | 'worker'>('pages');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !data) {
      setLoading(true);
      fetch('/api/cloudflare/export')
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setData(json.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getActiveCode = () => {
    if (!data) return '';
    switch (activeTab) {
      case 'pages':
        return `// ==========================================
// Cloudflare Pages + KV 数据库绑定指南
// ==========================================
// 1. 登录 Cloudflare 控制台 -> Workers & Pages -> 创建 KV 命名空间:
//    名称推荐: HTMLSHARE_KV 或 KV_SNIPPETS
//
// 2. 进入你的 Pages 项目 -> Settings -> Functions -> KV namespace bindings (KV 命名空间绑定):
//    - Variable name (变量名称): 必须填 KV_SNIPPETS (或 HTMLSHARE_KV)
//    - KV namespace: 选择你在第1步中创建的命名空间
//
// 3. (可选) 如果同时绑定了 D1 数据库:
//    - Variable name (变量名称): 填 DB
//    - D1 database: 选择你的 D1 数据库实例并执行 schema.sql
//
// 4. 代码库根目录下已预置 functions/ 文件夹 (包含 api 与 raw 路由):
//    Cloudflare Pages 会自动识别并将其转换为毫秒级的 Serverless Functions！
//    点击保存/发布片段即可无缝写入绑定的 KV / D1 数据库！
//
// 下方是 functions/api/[[route]].ts 的完整实现源码:
` + (data.pagesFunctionCode || '');
      case 'schema':
        return data.schemaSql;
      case 'wrangler':
        return data.wranglerJson;
      case 'worker':
        return data.workerCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Cloudflare D1 & KV 架构与部署导出</h3>
              <p className="text-xs text-slate-400">本平台支持原生 Cloudflare Worker + D1 数据库 + KV 快速缓存</p>
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
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Intro Card */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>零开销 Serverless 云存储引擎</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              HTMLShare 的后端数据结构完全遵循 Cloudflare D1 (关系型 SQLite) 与 Cloudflare KV (键值对缓存) 规范。所有发布的短链接、代码片段均可直接迁移与部署至你自己绑定的 Cloudflare Workers 账户上。
            </p>
          </div>

          {/* Sub Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('pages')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'pages'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Pages Functions (KV/D1)</span>
              </button>

              <button
                onClick={() => setActiveTab('schema')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>schema.sql</span>
              </button>

              <button
                onClick={() => setActiveTab('wrangler')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'wrangler'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>wrangler.jsonc</span>
              </button>

              <button
                onClick={() => setActiveTab('worker')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'worker'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>worker.js</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制此代码'}</span>
            </button>
          </div>

          {/* Code Viewer */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="text-slate-500">正在加载 Cloudflare 配置文件...</div>
            ) : (
              <pre className="whitespace-pre-wrap break-all leading-relaxed">{getActiveCode()}</pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>完全免费，移除所有会员付费要求</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};

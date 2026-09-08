import React, { useState } from 'react';
import { Lock, Key, ArrowRight, ShieldAlert } from 'lucide-react';

interface PasscodeModalProps {
  isOpen: boolean;
  onSubmit: (passcode: string) => void;
  errorMsg?: string;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  onSubmit,
  errorMsg,
}) => {
  const [passcode, setPasscode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode) onSubmit(passcode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-lg text-white">此代码片段已被密码加密锁定</h3>
          <p className="text-xs text-slate-400 mt-1">请输入作者设置的访问密码解锁查看代码与预览</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-indigo-500">
            <Key className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="请输入密码..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none font-mono"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>解锁并装载代码</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

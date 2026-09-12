import React, { useState } from 'react';
import { Store, Lock, User, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, KeyRound } from 'lucide-react';

export default function LoginModal({ branches = [], onLoginSuccess }) {
  const [username, setUsername] = useState('dammam');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAccountsGuide, setShowAccountsGuide] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (accUser, accPass) => {
    setUsername(accUser);
    setPassword(accPass);
    setShowAccountsGuide(false);
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b101b] border border-cyan-900/60 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-right animate-in fade-in zoom-in-95 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
        {/* الشعار والترويسة */}
        <div className="text-center mb-6">
          <img 
            src="/sanad-express-logo.jpg?v=3" 
            alt="سند" 
            className="w-20 h-20 rounded-3xl object-cover mx-auto mb-3 shadow-[0_0_25px_rgba(0,210,211,0.35)] border-2 border-cyan-500/40" 
          />
          <h2 className="text-3xl font-black text-slate-100 tracking-tight flex items-center justify-center gap-2">
            <span>سند</span>
          </h2>
          <div className="text-[11px] font-mono text-[#00d2d3] font-bold tracking-widest uppercase mt-0.5">SANAD</div>
          <p className="text-xs text-slate-400 mt-2">تسجيل الدخول للمنظومة اللوجستية (خصوصية تامة لكل فرع)</p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800 text-red-300 rounded-xl text-center text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">اسم مستخدم الفرع / المتجر:</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: dammam أو jubail أو admin"
                className="w-full bg-[#070b13] border border-cyan-900/60 text-slate-100 rounded-xl pr-9 pl-4 py-2.5 focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] outline-none font-mono"
              />
              <User className="w-4 h-4 text-cyan-500 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">كلمة المرور:</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full bg-[#070b13] border border-cyan-900/60 text-slate-100 rounded-xl pr-9 pl-4 py-2.5 focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] outline-none font-mono"
              />
              <Lock className="w-4 h-4 text-cyan-500 absolute right-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'جاري التحقق والدخول...' : 'دخول إلى منصة سند'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* دليل حسابات الفروع للسهولة */}
        <div className="mt-5 border-t border-cyan-950/60 pt-3">
          <button
            type="button"
            onClick={() => setShowAccountsGuide(!showAccountsGuide)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 py-1 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <KeyRound className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span>دليل يوزرات الفروع المعتمدة (كلمة المرور: 123)</span>
            </span>
            {showAccountsGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAccountsGuide && (
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                onClick={() => handleQuickFill('dammam', '123')}
                className="p-2 rounded-xl bg-[#070b13] border border-cyan-900/40 hover:border-cyan-500/80 text-right transition-colors"
              >
                <div className="font-bold text-slate-200">فرع الدمام</div>
                <div className="text-[10px] text-cyan-400 font-mono">يوزر: dammam</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('jubail', '123')}
                className="p-2 rounded-xl bg-[#070b13] border border-cyan-900/40 hover:border-cyan-500/80 text-right transition-colors"
              >
                <div className="font-bold text-slate-200">فرع الجبيل</div>
                <div className="text-[10px] text-cyan-400 font-mono">يوزر: jubail</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sharq', '123')}
                className="p-2 rounded-xl bg-[#070b13] border border-cyan-900/40 hover:border-cyan-500/80 text-right transition-colors"
              >
                <div className="font-bold text-slate-200">فيب الشرق</div>
                <div className="text-[10px] text-cyan-400 font-mono">يوزر: sharq</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('iklil', '123')}
                className="p-2 rounded-xl bg-[#070b13] border border-cyan-900/40 hover:border-cyan-500/80 text-right transition-colors"
              >
                <div className="font-bold text-slate-200">إكليل فيب</div>
                <div className="text-[10px] text-cyan-400 font-mono">يوزر: iklil</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin', '123')}
                className="col-span-2 p-2 rounded-xl bg-cyan-950/40 border border-cyan-700/50 hover:border-cyan-400 text-center transition-colors"
              >
                <div className="font-bold text-cyan-200">الإدارة العامة (المدير العام)</div>
                <div className="text-[10px] text-slate-400 font-mono">يوزر: admin • صلاحية كاملة لكافة الفروع</div>
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-[10px] text-slate-500">
          منظومة سند اللوجستية • خصوصية وعزل كامل لبيانات كل فرع 🔒
        </div>
      </div>
    </div>
  );
}

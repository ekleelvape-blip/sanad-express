import React, { useState } from 'react';
import { Store, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginModal({ branches, onLoginSuccess }) {
  const [username, setUsername] = useState('dammam');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectBranch = (b) => {
    setUsername(b.username);
    setPassword('123');
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-right animate-in fade-in zoom-in-95 font-['Cairo',sans-serif]" dir="rtl">
        {/* الشعار والترويسة */}
        <div className="text-center mb-6">
          <img src="/sanad-express-logo.jpg?v=3" alt="سند إكسبريس" className="w-20 h-20 rounded-3xl object-cover mx-auto mb-3 shadow-[0_0_25px_rgba(0,210,211,0.4)] border-2 border-cyan-500/40" />
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">سَنَد إكسبريس</h2>
          <div className="text-[10px] font-mono text-[#00d2d3] font-bold tracking-widest uppercase">SANAD EXPRESS</div>
          <p className="text-xs text-slate-400 mt-1">منظومة الشحن والتوصيل السريع وإدارة المناديب والمستودع</p>
        </div>

        {/* بطاقات الفروع الأربعة للاختيار السريع */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-slate-400 mb-2">اختر المتجر أو الفرع لتسجيل الدخول:</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {branches.map(b => {
              const isSelected = username === b.username;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleQuickSelectBranch(b)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500 shadow-md shadow-purple-950/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-100 text-xs mb-1">{b.name}</div>
                  <div className="text-[10px] text-purple-400 font-mono">
                    {b.syncPool === 'sync-group-east' ? '🔄 مزامنة مناديب مشتركة' : 'مستقل'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-center text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">اسم المستخدم (المتجر):</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl pr-9 pl-4 py-2.5 focus:border-purple-500 outline-none font-mono"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
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
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl pr-9 pl-4 py-2.5 focus:border-purple-500 outline-none font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">كلمة المرور الافتراضية لجميع الحسابات: 123</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{loading ? 'جاري التحقق...' : 'دخول إلى لوحة سند'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          إكليل فيب • فيب الشرق • فرع الدمام • فرع الجبيل
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/sound';

export default function DriverAuthGate({
  onLoginSuccess
}) {
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const identifier = identifierInput.trim();
    const password = passwordInput.trim();

    if (!identifier || !password) {
      setErrorMessage('يرجى إدخال رقم الجوال (أو كود المندوب) وكلمة المرور / الـ PIN');
      sound.playOrderAlert();
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: identifier,
          username: identifier,
          driverId: identifier,
          password: password,
          pin: password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sound.playSuccess();
        setSuccessMessage(`مرحباً بك ${data.driver.name}، جاري تهيئة بوابتك المشفرة...`);

        try {
          localStorage.setItem('sanad_driver_auth', JSON.stringify({
            id: data.driver.id,
            code: data.driver.code,
            name: data.driver.name,
            phone: data.driver.phone,
            token: data.token,
            authTime: Date.now()
          }));
          localStorage.setItem('sanad_driver_id', data.driver.id);
        } catch (e) {
          console.error(e);
        }

        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(data.driver);
        }, 500);
      } else {
        sound.playOrderAlert();
        setErrorMessage(data.error || 'بيانات الدخول غير صحيحة، يرجى المحاولة مجدداً');
      }
    } catch (err) {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
      
      {/* بطاقة المصادقة والأمان العالي المشفرة */}
      <div className="w-full max-w-md bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-900/50 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* شريط الأمان العلوي */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00d2d3] to-transparent"></div>

        {/* شعار سند الرسمي */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-950/50 border border-cyan-700/40 shadow-[0_0_25px_rgba(0,210,211,0.25)] mb-3">
            <img 
              src="/sanad-express-logo.jpg?v=3" 
              alt="سند SANAD" 
              className="w-14 h-14 rounded-xl object-cover" 
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
            <span>سند SANAD</span>
          </h1>
          <div className="text-xs font-bold text-[#00d2d3] mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>بوابة المندوب الميداني المشفرة</span>
          </div>

          {/* مؤشر الحماية والعزل التام */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>اتصال مشفر 256-bit SSL • خصوصية معزولة لكل مندوب</span>
          </div>
        </div>

        {/* رسائل التنبيه والخطأ */}
        {errorMessage && (
          <div className="mb-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-2xl flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* نموذج تسجيل الدخول الخاص والآمن */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              رقم الجوال المسجل أو كود المندوب:
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder="مثال: 0500000001 أو DRV-01"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                autoComplete="username"
              />
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              رمز الأمان PIN أو كلمة المرور:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label="إظهار أو إخفاء كلمة المرور"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
              <span>💡 رمز PIN الافتراضي: آخر 6 أرقام من جوالك أو 123456</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(0,210,211,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>جاري التحقق والاتصال المشفر...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>تسجيل الدخول الآمن للمنظومة 🔒</span>
              </>
            )}
          </button>
        </form>

        {/* تنبيه الأمان والخصوصية */}
        <div className="mt-5 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-900/40 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            يتم عزل بيانات ومسارات ومحفظة كل مندوب بشكل آمن ومشفر تماماً لمنع الوصول غير المصرح به وضمان حماية الشحنات.
          </span>
        </div>

      </div>

      {/* تذييل المنظومة */}
      <footer className="mt-6 text-center text-[11px] text-slate-500">
        منظومة <span className="text-slate-300 font-bold">سند SANAD</span> اللوجستية المتطورة © {new Date().getFullYear()}
      </footer>

    </div>
  );
}

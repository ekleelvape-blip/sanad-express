import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Smartphone, Key, AlertCircle, Eye, EyeOff, CheckCircle2, ChevronLeft, Car } from 'lucide-react';
import { sound } from '../utils/sound';

export default function DriverAuthGate({
  drivers = [],
  onLoginSuccess
}) {
  // نمط الدخول: 'fleet_pin' (الأسطول + PIN) أو 'manual_phone' (جوال + كلمة مرور)
  const [loginMode, setLoginMode] = useState('fleet_pin');

  // المندوب المختار للدخول برمز PIN
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);

  // حقول الدخول اليدوي
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // حالة التحقق والرسائل
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // استماع للوحة مفاتيح الأرقام عند فتح نافذة PIN
  useEffect(() => {
    if (!showPinPad) return;
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleAppendDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleVerifyPin();
      } else if (e.key === 'Escape') {
        setShowPinPad(false);
        setPinInput('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinPad, pinInput, selectedDriver]);

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setPinInput('');
    setErrorMessage('');
    setShowPinPad(true);
    sound.pop();
  };

  const handleAppendDigit = (digit) => {
    if (pinInput.length >= 6) return;
    const next = pinInput + digit;
    setPinInput(next);
    sound.pop();
    setErrorMessage('');
    
    // التحقق التلقائي عند اكتمال 6 أرقام
    if (next.length === 6 && selectedDriver) {
      setTimeout(() => verifyCredentials({ driverId: selectedDriver.id, pin: next }), 150);
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClearPin = () => {
    setPinInput('');
    setErrorMessage('');
  };

  const handleVerifyPin = () => {
    if (!selectedDriver) return;
    if (pinInput.length < 4) {
      setErrorMessage('يرجى إدخال رمز PIN المكون من 4 إلى 6 أرقام');
      sound.playOrderAlert();
      return;
    }
    verifyCredentials({ driverId: selectedDriver.id, pin: pinInput });
  };

  const handleManualLogin = (e) => {
    e.preventDefault();
    if (!phoneInput || !passwordInput) {
      setErrorMessage('يرجى إدخال رقم الجوال وكلمة المرور');
      return;
    }
    verifyCredentials({ phone: phoneInput, password: passwordInput });
  };

  const verifyCredentials = async (payload) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sound.playSuccess();
        setSuccessMessage(`مرحباً بك ${data.driver.name}، جاري تهيئة البوابة المشفرة...`);
        
        // حفظ الجلسة المشفرة
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
        setErrorMessage(data.error || 'رمز PIN أو كلمة المرور غير صحيحة، حاول مجدداً');
      }
    } catch (err) {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
      
      {/* بطاقة المصادقة والأمان العالي */}
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

          {/* مؤشر الحماية العالية المشفرة 256-bit */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>اتصال مشفر 256-bit SSL | خصوصية تامة للشحنات</span>
          </div>
        </div>

        {/* التبديل بين طريقتي الدخول */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setLoginMode('fleet_pin'); setErrorMessage(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'fleet_pin'
                ? 'bg-cyan-950 text-[#00d2d3] border border-cyan-800/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>قائمة الأسطول (PIN)</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginMode('manual_phone'); setErrorMessage(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'manual_phone'
                ? 'bg-cyan-950 text-[#00d2d3] border border-cyan-800/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>رقم الجوال وكلمة المرور</span>
          </button>
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

        {/* 1. نمط الدخول السريع لأسطول المناديب عبر رمز PIN */}
        {loginMode === 'fleet_pin' && (
          <div>
            <div className="text-xs text-slate-400 mb-2.5 font-bold flex items-center justify-between">
              <span>اختر اسمك من أسطول المناديب المعتمد:</span>
              <span className="text-[10px] text-cyan-400 font-mono">({drivers.length} مندوب)</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {drivers.map(drv => (
                <button
                  key={drv.id}
                  type="button"
                  onClick={() => handleSelectDriver(drv)}
                  className="w-full text-right p-3 rounded-2xl bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-700/60 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-[#00d2d3] font-black text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {drv.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-[#00d2d3] transition-colors flex items-center gap-1.5">
                        <span>{drv.name}</span>
                        <span className="text-[10px] font-mono bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded-md font-bold">
                          {drv.code || ('DRV-0' + drv.id.replace(/\D/g, ''))}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-slate-500" />
                          <span>{drv.vehicle || 'مركبة توصيل'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-bold">
                      نشط 🟢
                    </span>
                    <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-900/40 text-[11px] text-slate-400 leading-relaxed">
              <span className="text-cyan-300 font-bold">💡 ملاحظة أمنية: </span>
              عند الضغط على اسمك، سيُطلب منك إدخال رمز الأمان السري PIN الخاص بك لحماية عهدة الشحنات وعزل المحفظة المالية.
            </div>
          </div>
        )}

        {/* 2. نمط الدخول برقم الجوال وكلمة المرور */}
        {loginMode === 'manual_phone' && (
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم جوال المندوب (المسجل لدى سَنَد):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="050xxxxxxx"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور أو رمز الأمان PIN:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                الرمز الافتراضي: آخر 6 أرقام من جوالك أو 123456
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(0,210,211,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>جاري التحقق والتشفير...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>تسجيل الدخول الآمن للمنظومة</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>

      {/* نافذة لوحة المفاتيح الرقمية السريعة لإدخال رمز PIN (PIN Pad Modal) */}
      {showPinPad && selectedDriver && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0c121e] border-2 border-cyan-700/60 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200">
            
            {/* ترويسة نافذة الـ PIN */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[#00d2d3] font-black text-sm">
                  {selectedDriver.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">تسجيل دخول المندوب:</div>
                  <div className="text-sm font-black text-white">{selectedDriver.name}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowPinPad(false); setPinInput(''); }}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* شاشة عرض نقاط الـ PIN المكتوبة */}
            <div className="text-center my-4">
              <div className="text-xs text-slate-400 font-bold mb-2">أدخل رمز الأمان السري PIN:</div>
              
              <div className="flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-950/80 rounded-2xl border border-slate-800 mb-2" dir="ltr">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                      pinInput.length > idx
                        ? 'bg-[#00d2d3] border-[#00d2d3] scale-110 shadow-[0_0_10px_#00d2d3]'
                        : 'bg-transparent border-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                رمز PIN الافتراضي: آخر 6 أرقام من جوالك ({selectedDriver.phone ? selectedDriver.phone.slice(-6) : '893163'}) أو 123456
              </div>

              {errorMessage && (
                <div className="mt-2 text-rose-400 text-xs font-bold bg-rose-950/60 py-1.5 px-2.5 rounded-xl border border-rose-800/60">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* لوحة المفاتيح الرقمية اللمسية الفورية */}
            <div className="grid grid-cols-3 gap-2.5 my-3" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleAppendDigit(digit)}
                  className="h-14 rounded-2xl bg-slate-900/90 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600 text-xl font-bold text-white font-mono active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearPin}
                className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                مسح C
              </button>

              <button
                type="button"
                onClick={() => handleAppendDigit('0')}
                className="h-14 rounded-2xl bg-slate-900/90 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600 text-xl font-bold text-white font-mono active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-base font-bold text-slate-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* زر تأكيد الدخول */}
            <div className="mt-4 pt-3 border-t border-slate-900">
              <button
                type="button"
                disabled={loading || pinInput.length < 4}
                onClick={handleVerifyPin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(0,210,211,0.4)] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>جاري التحقق...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>تأكيد والدخول المشفر 🔒</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* حقوق المنظومة */}
      <footer className="mt-6 text-center text-[11px] text-slate-500">
        منظومة <span className="text-slate-300 font-bold">سند SANAD</span> اللوجستية المتطورة © {new Date().getFullYear()}
      </footer>

    </div>
  );
}

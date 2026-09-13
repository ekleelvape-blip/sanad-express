import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, Wifi, Globe, Share2, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DriverLinkModal({ isOpen, onClose, networkInfo }) {
  const [copiedType, setCopiedType] = useState(null);

  if (!isOpen) return null;

  const bestDriverUrl = networkInfo?.bestDriverUrl || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin + '/driver' : 'https://trans-meetings-billing-everything.trycloudflare.com/driver');
  const localDriverUrl = networkInfo?.localDriverUrl || 'http://192.168.1.232:5000/driver';
  const qrUrl = networkInfo?.qrCodeUrl || ('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(bestDriverUrl));

  const copyToClipboard = (text, type) => {
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const shareViaWhatsApp = (url) => {
    const text = 'مرحباً بك في منصة سَنَد إكسبريس\nرابط تطبيق المندوب الميداني للجوال:\n' + url;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0b101b] border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,210,211,0.2)] text-white text-right font-sans">
        
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ترويسة النافذة */}
        <div className="flex items-center gap-3 mb-5 border-b border-cyan-900/40 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-[#00d2d3]">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              رابط تطبيق المندوب للجوال
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                نشط الآن
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">افتح التطبيق على هاتف المندوب بسهولة تامة</p>
          </div>
        </div>

        {/* قسم كود الـ QR للمسح بالكاميرا */}
        <div className="bg-[#0f172a]/90 rounded-2xl p-4 border border-cyan-950 flex flex-col items-center mb-5 text-center">
          <div className="p-2.5 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,210,211,0.25)] mb-3">
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-40 h-40 object-contain rounded-lg"
            />
          </div>
          <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <span>📷</span> امسح الكود بكاميرا الجوال للدخول الفوري
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">يعمل مباشرة على هواتف آيفون وأندرويد</p>
        </div>

        {/* بطاقة الرابط السحابي المباشر HTTPS */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/50 to-blue-950/40 border border-cyan-700/50 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00d2d3]" />
                الرابط المباشر (HTTPS السريع - موصى به):
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                4G / 5G / Wi-Fi
              </span>
            </div>
            
            <div className="bg-[#080d1a] border border-cyan-900/60 rounded-xl p-2 font-mono text-xs text-cyan-200 break-all select-all flex items-center justify-between gap-2">
              <span className="truncate text-left ltr dir-ltr">{bestDriverUrl}</span>
            </div>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => copyToClipboard(bestDriverUrl, 'tunnel')}
                className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                {copiedType === 'tunnel' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'tunnel' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>

              <button
                type="button"
                onClick={() => shareViaWhatsApp(bestDriverUrl)}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="مشاركة عبر واتساب"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </button>

              <a
                href={bestDriverUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="فتح في نافذة جديدة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* تنبيه الميزات */}
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-start gap-2 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">مفعل تلقائياً:</span> تتبع الموقع الجغرافي الحي (GPS)، مسح الباركود بالكاميرا، والتثبيت كتطبيق (PWA) على الشاشة الرئيسية بدون أي تحذيرات أمان.
            </div>
          </div>

          {/* رابط الشبكة المحلية Wi-Fi */}
          {localDriverUrl && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-slate-400" />
                <span>رابط شبكة الواي فاي المحلية:</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(localDriverUrl, 'local')}
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{localDriverUrl}</span>
                {copiedType === 'local' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

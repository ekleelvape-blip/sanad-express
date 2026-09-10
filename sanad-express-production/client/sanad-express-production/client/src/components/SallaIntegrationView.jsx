import React, { useState } from 'react';
import { ShoppingBag, CheckCircle, RefreshCw, Key, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export default function SallaIntegrationView({ branches }) {
  const [clientId, setClientId] = useState('salla_app_sanad_express_9921');
  const [apiKey, setApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [autoSync, setAutoSync] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold">
            🛒
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <span>الربط مع منصة سَلّة (Salla Integration)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">متصل ونشط</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              سحب وتوليد شحنات التوصيل السريع تلقائياً من متاجر إكليل فيب وفيب الشرق على سلة إلى سند إكسبريس
            </p>
          </div>
        </div>
        <button
          onClick={() => alert('تمت مزامنة الطلبات الجديدة من متاجر سلة بنجاح!')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>مزامنة الطلبات الآن</span>
        </button>
      </div>
      <form onSubmit={handleSave} className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5 max-w-2xl text-xs">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span>إعدادات مفاتيح API ومزامنة المتاجر:</span>
        </h3>
        <div>
          <label className="block text-slate-300 font-bold mb-1">Client ID لتطبيق سلة:</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-3 font-mono outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-slate-300 font-bold mb-1">Secret Key / API Access Token:</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-3 font-mono outline-none focus:border-emerald-500"
          />
        </div>
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
            <span className="text-slate-200 font-bold">سحب طلبات سلة الجديدة تلقائياً بمجرد تأكيد الدفع أو طلب الـ COD</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
            <span className="text-slate-200 font-bold">توليد بوليصة الشحن الحرارية 4×6 فورياً عند اكتمال الطلب في سلة</span>
          </label>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">متوافق مع متاجر إكليل فيب وفيب الشرق الرسمية</span>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            {saved ? '✓ تم حفظ إعدادات الربط' : 'حفظ إعدادات سلة'}
          </button>
        </div>
      </form>
    </div>
  );
}
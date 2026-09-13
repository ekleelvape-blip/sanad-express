import React, { useState } from 'react';
import { Settings, Sliders, ShieldCheck, CheckCircle2, Save, Cpu, DollarSign, MapPin } from 'lucide-react';
import DeliveryPricingView from './DeliveryPricingView';

export default function SettingsView({ branches }) {
  const [activeSubTab, setActiveSubTab] = useState('rules'); // 'rules' | 'pricing'
  const [selfAssign, setSelfAssign] = useState(true);
  const [readyOnly, setReadyOnly] = useState(true);
  const [reassignAfterDelay, setReassignAfterDelay] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>إعدادات النظام والتوصيل الذكي - سَنَد</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            التحكم في سياسات الإسناد الذاتي، أسعار التوصيل والمناطق، ومزامنة الفروع المشتركة
          </p>
        </div>

        {/* أزرار التبديل السريعة داخل الإعدادات */}
        <div className="flex items-center gap-2 bg-[#080d16] p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('rules')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>قواعد وسياسات التوصيل</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('pricing')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'pricing'
                ? 'bg-[#00d2d3] text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>أسعار التوصيل والمناطق (ثابتة)</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'pricing' ? (
        <DeliveryPricingView branches={branches} />
      ) : (
      <form onSubmit={handleSave} className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6 max-w-2xl text-xs">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">قواعد التوصيل والإسناد للمناديب:</h3>
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selfAssign}
                onChange={(e) => setSelfAssign(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-200 text-xs">الإسناد الذاتي للمندوب (Self-Pickup)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">يقدر السائق يسند الطلبات لنفسه من المستودع إذا مسح الباركود حقها</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={readyOnly}
                onChange={(e) => setReadyOnly(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-200 text-xs">الإسناد بعد جاهزية الطلب فقط</div>
                <div className="text-[11px] text-slate-400 mt-0.5">لا يمكن للمندوب استلام الشحنة إلا بعد اكتمال التغليف وإصدار البوليصة</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reassignAfterDelay}
                onChange={(e) => setReassignAfterDelay(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-200 text-xs">إعادة الإسناد لنفس السائق بعد التأجيل</div>
                <div className="text-[11px] text-slate-400 mt-0.5">إعادة إسناد الطلبات المؤجلة لنفس السائق تلقائياً عند استئناف التوصيل</div>
              </div>
            </label>
          </div>
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2 pt-2">سياسة مزامنة الفروع:</h3>
          <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>مزامنة فروع (إكليل الدمام + فيب الشرق + متجر إكليل فيب)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              مفعلة تلقائياً: أي مندوب يتم تسجيله في أي من هذه الفروع الثلاثة يتزامن تلقائياً ويصبح متاحاً للفرعين الآخرين بدون أي تدخل يدوي، مع استقلالية تامة لفرع الجبيل.
            </p>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            {saved ? '✓ تم حفظ الإعدادات' : 'حفظ إعدادات النظام'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
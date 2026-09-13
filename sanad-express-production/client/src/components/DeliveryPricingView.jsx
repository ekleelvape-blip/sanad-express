import React, { useState, useEffect } from 'react';
import {
  MapPin, DollarSign, Clock, ShieldCheck, CheckCircle2,
  Sliders, Search, RefreshCw, Edit3, Save, X, Info, Zap, AlertCircle
} from 'lucide-react';
import { OFFICIAL_CITIES, FIXED_DELIVERY_RATES, getDeliveryFeeByAddress } from '../utils/geo';

export default function DeliveryPricingView({ branches }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState(null);
  const [editFee, setEditFee] = useState(25);
  const [editSla, setEditSla] = useState('');
  const [editCoverage, setEditCoverage] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // حاسبة الأسعار التفاعلية
  const [calcInput, setCalcInput] = useState('');
  const [calcCity, setCalcCity] = useState('الدمام');
  const [calcResult, setCalcResult] = useState({ fee: 25, city: 'الدمام', sla: '30 - 45 دقيقة', prefix: 'D' });

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // تحديث حاسبة الأسعار الفورية
  useEffect(() => {
    if (calcInput.trim()) {
      const fee = getDeliveryFeeByAddress(calcInput);
      let detectedCity = 'الدمام';
      let prefix = 'D';
      let sla = '30 - 45 دقيقة';
      const text = calcInput.toLowerCase();

      if (text.includes('صفو') || text.includes('صفوي')) {
        detectedCity = 'صفوى (صفوي)';
        prefix = 'SF';
        sla = '45 - 60 دقيقة';
      } else if (text.includes('قطيف') || text.includes('تاروت') || text.includes('سنابس')) {
        detectedCity = 'القطيف';
        prefix = 'Q';
        sla = '40 - 55 دقيقة';
      } else if (text.includes('خبر') || text.includes('عزيزية') || text.includes('عقربية')) {
        detectedCity = 'الخبر';
        prefix = 'K';
        sla = '35 - 50 دقيقة';
      } else if (text.includes('ظهران') || text.includes('دوحة') || text.includes('دانة') || text.includes('قصور')) {
        detectedCity = 'الظهران';
        prefix = 'DH';
        sla = '30 - 45 دقيقة';
      } else if (text.includes('سيهات') || text.includes('عنك')) {
        detectedCity = 'سيهات';
        prefix = 'S';
        sla = '35 - 50 دقيقة';
      } else {
        detectedCity = 'الدمام';
        prefix = 'D';
        sla = '30 - 45 دقيقة';
      }
      setCalcResult({ fee, city: detectedCity, sla, prefix });
    } else {
      const matched = OFFICIAL_CITIES.find(c => c.name.includes(calcCity)) || OFFICIAL_CITIES[0];
      setCalcResult({
        fee: matched.fee,
        city: matched.name,
        sla: matched.sla,
        prefix: matched.prefix
      });
    }
  }, [calcInput, calcCity]);

  // فتح نافذة التعديل
  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setEditFee(zone.fee);
    setEditSla(zone.slaTime || '30 - 45 دقيقة');
    setEditCoverage(zone.coverage || '');
  };

  // حفظ التعديل على السيرفر
  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!editingZone) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fee: Number(editFee),
          slaTime: editSla,
          coverage: editCoverage
        })
      });
      if (res.ok) {
        setSuccessMsg(`✓ تم تحديث تسعيرة ${editingZone.name} بنجاح!`);
        setEditingZone(null);
        fetchZones();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert('تعذر حفظ التعديل على السيرفر');
      }
    } catch (err) {
      console.error('Error updating zone:', err);
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setSaving(false);
    }
  };

  // استعادة التعرفة الثابتة الرسمية الأصلية
  const handleResetToOfficial = async () => {
    if (!window.confirm('هل تريد استعادة التعرفة الرسمية الثابتة المعتمدة (الدمام 25 | سيهات 30 | القطيف 35 | صفوي 40 | الظهران 30 | الخبر 35)؟')) {
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/zones/reset-official', { method: 'POST' });
      if (res.ok) {
        setSuccessMsg('✓ تم استعادة وتثبيت التعرفة الرسمية لجميع المدن!');
        fetchZones();
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] select-none">
      {/* الترويسة الرئيسية وشارة الاعتماد */}
      <div className="bg-[#080d1a] border border-cyan-950/70 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-[#00d2d3]">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <span>أسعار التوصيل والمناطق المعتمدة</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>الأسعار ثابتة 🔒</span>
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  التعرفة الرسمية الموحدة لتوصيل شحنات سَنَد بالمنطقة الشرقية — يتم تطبيقها تلقائياً على بوالص الشحن والفواتير
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleResetToOfficial}
              disabled={saving}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="إعادة ضبط كافة الأسعار للتعرفة الرسمية"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin text-cyan-400' : ''}`} />
              <span>استعادة التعرفة الرسمية</span>
            </button>
            <button
              onClick={fetchZones}
              className="p-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 text-[#00d2d3] border border-cyan-800/40 transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* تنبيه النجاح */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* كروت الإحصائيات السريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-[#060a12] border border-cyan-950/50">
            <div className="text-[11px] text-slate-400 font-bold">المدن المغطاة</div>
            <div className="text-xl font-black text-white font-mono mt-1">6 مدن رئيسية</div>
            <div className="text-[10px] text-cyan-400 mt-0.5 font-bold">المنطقة الشرقية</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#060a12] border border-cyan-950/50">
            <div className="text-[11px] text-slate-400 font-bold">سياسة التسعير</div>
            <div className="text-xl font-black text-emerald-400 mt-1">أسعار ثابتة</div>
            <div className="text-[10px] text-slate-400 mt-0.5">بدون رسوم مخفية 🔒</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#060a12] border border-cyan-950/50">
            <div className="text-[11px] text-slate-400 font-bold">أقل رسم توصيل</div>
            <div className="text-xl font-black text-[#00d2d3] font-mono mt-1">25.00 ﷼</div>
            <div className="text-[10px] text-slate-400 mt-0.5">الدمام (المركز الرئيسي)</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#060a12] border border-cyan-950/50">
            <div className="text-[11px] text-slate-400 font-bold">أعلى رسم توصيل</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">40.00 ﷼</div>
            <div className="text-[10px] text-slate-400 mt-0.5">صفوى / صفوي</div>
          </div>
        </div>
      </div>

      {/* حاسبة أسعار التوصيل الفورية */}
      <div className="bg-[#0c121e] border border-cyan-900/40 p-5 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyan-950/70">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black text-white">حاسبة واختبار سعر التوصيل الفوري (Live Rate Calculator)</h2>
          </div>
          <span className="text-[11px] text-slate-400">جرب كتابة اسم الحي أو اختيار المدينة لمعاينة السعر وكود البوليصة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">اختر المدينة المعتمدة:</label>
            <select
              value={calcCity}
              onChange={(e) => { setCalcCity(e.target.value); setCalcInput(''); }}
              className="w-full bg-[#060a12] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-[#00d2d3]"
            >
              {OFFICIAL_CITIES.map(c => (
                <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                  {c.name} — {c.fee} ﷼ ثابت
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">أو اكتب اسم الحي / العنوان للتحقق التلقائي:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
              <input
                type="text"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                placeholder="مثال: حي الشاطئ، سيهات، تاروت، الدوحة، حزم صفوى..."
                className="w-full bg-[#060a12] border border-cyan-900/60 rounded-xl pr-9 pl-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3]"
              />
            </div>
          </div>

          {/* بطاقة النتيجة الفورية */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-300 font-bold">المدينة: <strong className="text-white">{calcResult.city}</strong></div>
              <div className="text-[10px] text-slate-400 mt-0.5">كود البوليصة: <strong className="font-mono text-cyan-300">{calcResult.prefix}</strong> • زمن الوصول: <strong className="text-slate-200">{calcResult.sla}</strong></div>
            </div>
            <div className="text-left font-mono">
              <div className="text-[10px] text-emerald-400 font-bold">السعر الثابت</div>
              <div className="text-2xl font-black text-[#00d2d3] leading-none mt-0.5">{calcResult.fee}.00 <span className="text-xs font-sans text-slate-300">﷼</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات المدن والمناطق الست الرسمية */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#00d2d3]" />
            <h2 className="text-base font-black text-white">لائحة أسعار المدن والنطاقات الجغرافية (6 مدن)</h2>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">SANAD-TARIFF-2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(z => {
            const isDammam = z.name.includes('دمام');
            const isSaihat = z.name.includes('سيهات');
            const isQatif = z.name.includes('قطيف');
            const isSafwa = z.name.includes('صفو');
            const isDhahran = z.name.includes('ظهران');
            const isKhobar = z.name.includes('خبر');

            return (
              <div
                key={z.id}
                className="bg-[#0a0f1d] border border-cyan-950/80 hover:border-cyan-500/40 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* رأس البطاقة */}
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-950/70">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-cyan-950/90 border border-cyan-500/30 flex items-center justify-center text-[#00d2d3] font-mono font-black text-sm">
                        {z.prefix || (isSafwa ? 'SF' : isSaihat ? 'S' : isQatif ? 'Q' : isDhahran ? 'DH' : isKhobar ? 'K' : 'D')}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-1.5">
                          <span>{z.name}</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {z.id}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-black text-xs inline-block">
                        سعر ثابت 🔒
                      </span>
                    </div>
                  </div>

                  {/* سعر التوصيل البارز */}
                  <div className="my-4 p-3.5 rounded-2xl bg-[#060a12] border border-cyan-950/60 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-bold">رسم التوصيل المعتمد:</div>
                      <div className="text-[10px] text-cyan-400 font-bold mt-0.5">ثابت لجميع أحياء المدينة</div>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-3xl font-black text-[#00d2d3] leading-none">{z.fee}.00</span>
                      <span className="text-xs font-bold text-slate-300 font-sans mr-1">ريال</span>
                    </div>
                  </div>

                  {/* تفاصيل التغطية والمستودع */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-850">
                      <div className="text-[11px] text-slate-400 font-bold mb-1">الأحياء والمناطق المغطاة:</div>
                      <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                        {z.coverage}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-[#080d1a] border border-slate-850">
                        <span className="text-slate-400 block font-bold">زمن التوصيل (SLA):</span>
                        <span className="text-slate-200 font-bold mt-0.5 block flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{z.slaTime || '30 - 45 دقيقة'}</span>
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#080d1a] border border-slate-850">
                        <span className="text-slate-400 block font-bold">المستودع الرئيسي:</span>
                        <span className="text-slate-200 font-bold mt-0.5 block truncate">
                          {z.store || 'فرع إكليل الدمام'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="pt-4 mt-4 border-t border-cyan-950/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>تغطية نشطة 100%</span>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(z)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-[#00d2d3] border border-slate-700/60 hover:border-cyan-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل التفاصيل</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* نافذة تعديل تسعيرة النطاق */}
      {editingZone && (
        <div className="fixed inset-0 z-[1500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-cyan-500/50 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#00d2d3]" />
                <h3 className="text-base font-black text-white">تعديل تسعيرة {editingZone.name}</h3>
              </div>
              <button
                onClick={() => setEditingZone(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  رسم التوصيل الثابت (ر.س) *:
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={editFee}
                  onChange={(e) => setEditFee(e.target.value)}
                  className="w-full bg-[#060a12] border border-cyan-900/60 rounded-xl p-3 text-lg font-mono font-black text-[#00d2d3] outline-none focus:border-[#00d2d3]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  الأسعار المعتمدة: الدمام 25 | سيهات 30 | الظهران 30 | القطيف 35 | الخبر 35 | صفوى 40
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  زمن التوصيل المتوقع (SLA):
                </label>
                <input
                  type="text"
                  value={editSla}
                  onChange={(e) => setEditSla(e.target.value)}
                  placeholder="مثال: 30 - 45 دقيقة"
                  className="w-full bg-[#060a12] border border-cyan-900/60 rounded-xl p-2.5 text-slate-200 outline-none focus:border-[#00d2d3]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  الأحياء والمناطق المغطاة:
                </label>
                <textarea
                  rows="3"
                  value={editCoverage}
                  onChange={(e) => setEditCoverage(e.target.value)}
                  className="w-full bg-[#060a12] border border-cyan-900/60 rounded-xl p-2.5 text-slate-200 outline-none focus:border-[#00d2d3]"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-cyan-950 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingZone(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/60 cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>حفظ التعديلات في النظام</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

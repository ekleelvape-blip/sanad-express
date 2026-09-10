import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2, Clock, MapPin, Phone, MessageSquare, AlertCircle, Navigation, ShieldCheck, ArrowRight, Share2, Copy } from 'lucide-react';

export default function TrackingPortal({ defaultTrackingNumber, onClose }) {
  const [query, setQuery] = useState(defaultTrackingNumber || 'SND-282288');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTracking = async (trackNum) => {
    if (!trackNum) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/track/' + encodeURIComponent(trackNum.trim()));
      if (res.ok) {
        setData(await res.json());
      } else {
        setError('عذراً، لم يتم العثور على شحنة بهذا الرقم. تأكد من إدخال رقم الشحنة أو الجوال بشكل صحيح.');
        setData(null);
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاستعلام، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) fetchTracking(query);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracking(query);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '?track=' + (data?.order?.trackingNumber || query));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Cairo',sans-serif]">
      <div className="text-center space-y-2 py-4">
        <div className="flex flex-col items-center mb-3">
          <img src="/sanad-express-logo.jpg?v=3" alt="سند إكسبريس" className="w-20 h-20 rounded-3xl object-cover shadow-[0_0_25px_rgba(0,210,211,0.4)] border-2 border-cyan-500/40 mb-3" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-[#00d2d3] text-xs font-bold">
            <span>منصة سَنَد إكسبريس | تتبع الشحنات المباشر</span>
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">تتبع شحنتك لحظة بلحظة</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">أدخل رقم الشحنة (مثال: SND-282288) أو رقم جوال المستلم لمعرفة حالة وموقع شحنتك بدقة</p>
        <form onSubmit={handleSearch} className="max-w-md mx-auto mt-4 relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: SND-282288 أو 05XXXXXXXX"
              className="w-full bg-slate-900 border-2 border-slate-700 text-slate-100 rounded-2xl pr-11 pl-28 py-3 text-sm focus:border-emerald-500 outline-none font-mono shadow-xl transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5" />
            <button
              type="submit"
              disabled={loading}
              className="absolute left-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-900/30"
            >
              {loading ? 'جاري البحث...' : 'تتبع الشحنة'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-2xl text-center max-w-md mx-auto">{error}</div>
      )}

      {data && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black font-mono text-emerald-400">{data.order.trackingNumber}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">{data.order.hub?.name || 'سند إكسبريس'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">المرسل: <span className="text-slate-200 font-bold">{data.branch?.name || 'متجر إكليل فيب'}</span> • تاريخ الطلب: {new Date(data.order.createdAt).toLocaleDateString('ar-SA')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم نسخ الرابط!' : 'مشاركة التتبع'}</span>
              </button>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${data.order.status === 'delivered' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : data.order.status === 'in_transit' ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse' : 'bg-purple-950 text-purple-300 border-purple-800'}`}>{data.order.status === 'delivered' ? '✅ تم التسليم بنجاح' : data.order.status === 'in_transit' ? '🚗 الشحنة في الطريق إليك' : data.order.status === 'picked_up' ? '📦 استلمها المندوب من الفرع' : '🟣 تم تجهيز الشحنة وإسنادها'}</span>
            </div>
          </div>

          <div className="py-2">
            <h4 className="text-xs font-bold text-slate-400 mb-4">مراحل الشحن والتوصيل (سند إكسبريس):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {data.timeline.map((step, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${step.done ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/20' : step.isException ? 'bg-red-950/30 border-red-500/50' : 'bg-slate-950/40 border-slate-800/80 opacity-60'}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step.done ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>{step.done ? '✓' : '•'}</div>
                    </div>
                    <div className="font-bold text-slate-100 text-xs mb-1">{step.title}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                  {step.time && (
                    <div className="text-[10px] text-emerald-400 font-mono mt-3 pt-2 border-t border-slate-800/80">{new Date(step.time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {data.driver && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-900/40">🛵</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{data.driver.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">مندوب سند إكسبريس المعتمد</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{data.driver.vehicle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={'tel:' + data.driver.phone} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-colors">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>اتصال هاتفي</span>
                </a>
                <a href={'https://wa.me/966' + data.driver.phone.replace(/^0/, '') + '?text=' + encodeURIComponent('مرحباً كابتن ' + data.driver.name + '، أنا العميل ' + data.order.customerName + ' صاحب الشحنة رقم ' + data.order.trackingNumber + '.')} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/30 transition-all">
                  <MessageSquare className="w-4 h-4" />
                  <span>محادثة واتساب</span>
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="text-slate-400 font-bold mb-1">عنوان التوصيل:</div>
              <div className="font-bold text-slate-100 text-sm">{data.order.customerName}</div>
              <div className="text-slate-300 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{data.order.customerAddress}</span>
              </div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 font-bold mb-1">الحساب والمبلغ المطلوب:</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">طريقة الدفع:</span>
                  <span className="font-bold text-slate-100">{data.order.paymentMethod === 'cash' ? '💵 كاش عند الاستلام' : '💳 شبكة مدى للمندوب'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
                <span className="text-slate-400">إجمالي المطلوب تحصيله:</span>
                <span className="text-xl font-black font-mono text-emerald-400">{data.order.totalAmount} ر.س</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
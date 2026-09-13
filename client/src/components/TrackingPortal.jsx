import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Package, CheckCircle2, Clock, MapPin, Phone, MessageSquare, 
  AlertCircle, Navigation, ShieldCheck, ArrowRight, Share2, Copy, 
  RefreshCw, ChevronRight, Truck, ExternalLink, HelpCircle 
} from 'lucide-react';
import L from 'leaflet';
import { sound } from '../utils/sound';

export default function TrackingPortal({ 
  defaultTrackingNumber, 
  initialTrackingNumber, 
  onClose, 
  onBack 
}) {
  const initialProp = defaultTrackingNumber || initialTrackingNumber || '';
  const [query, setQuery] = useState(initialProp);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // مرجع خريطة التتبع المباشر
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const fetchTracking = async (trackNum) => {
    if (!trackNum || !trackNum.trim()) return;
    setLoading(true);
    setError('');
    try {
      sound.pop();
      const res = await fetch('/api/track/' + encodeURIComponent(trackNum.trim()));
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError('');
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'عذراً، لم يتم العثور على شحنة بهذا الرقم. تأكد من إدخال رقم الشحنة أو رقم الجوال بشكل صحيح.');
        setData(null);
      }
    } catch (err) {
      setError('تعذر الاتصال بخادم التتبع، يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقاً');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // التحميل التلقائي فقط إذا تم تمرير رقم شحنة مبدئي حقيقي
  useEffect(() => {
    if (initialProp && initialProp.trim()) {
      setQuery(initialProp.trim());
      fetchTracking(initialProp.trim());
    }
  }, [initialProp]);

  // إعداد خريطة المسار الحي عند توفر بيانات الشحنة
  useEffect(() => {
    if (!data || !mapContainerRef.current) return;

    const coords = data.order?.customerCoords || [26.4380, 50.1110];
    const branchCoords = data.branch?.coords || [26.4207, 50.0888];
    const driverCoords = data.driver?.coords;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: driverCoords || coords,
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // علامة موقع العميل (الوجهة)
      const customerIcon = L.divIcon({
        className: 'custom-customer-pin',
        html: `<div style="background:#00d2d3;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 15px rgba(0,210,211,0.5);font-size:16px;">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      L.marker(coords, { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<strong>وجهة التوصيل</strong><br/>${data.order.customerName}`);

      // علامة موقع المندوب الحي إن وجد
      if (driverCoords) {
        const driverIcon = L.divIcon({
          className: 'custom-driver-pin',
          html: `<div style="background:#10b981;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 15px rgba(16,185,129,0.5);font-size:16px;" class="animate-bounce">🛵</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });
        L.marker(driverCoords, { icon: driverIcon })
          .addTo(map)
          .bindPopup(`<strong>المندوب: ${data.driver.name}</strong><br/>في الطريق إليك`);

        // خط مسار وهمي بين المندوب والعميل
        L.polyline([driverCoords, coords], {
          color: '#00d2d3',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.8
        }).addTo(map);

        const group = L.featureGroup([L.marker(coords), L.marker(driverCoords)]);
        map.fitBounds(group.getBounds(), { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    } catch (e) {
      console.warn('Map render error:', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setError('يرجى إدخال رقم الشحنة أو رقم الجوال للبحث');
      return;
    }
    fetchTracking(query.trim());
  };

  const handleCopyLink = () => {
    const trackNum = data?.order?.trackingNumber || query;
    const url = `${window.location.origin}/track?track=${encodeURIComponent(trackNum)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    sound.pop();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSampleClick = (sampleId) => {
    setQuery(sampleId);
    fetchTracking(sampleId);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Tajawal','Cairo',sans-serif] select-none pb-12" dir="rtl">
      
      {/* قسم الترويسة والبحث المركزي */}
      <div className="text-center space-y-3 py-4">
        <div className="flex flex-col items-center mb-1">
          <img 
            src="/sanad-express-logo.jpg?v=4" 
            alt="سَنَد اللوجستية" 
            className="w-20 h-20 rounded-3xl object-cover shadow-[0_0_25px_rgba(0,210,211,0.35)] border-2 border-cyan-500/50 mb-3" 
          />
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-[#00d2d3] text-xs font-black shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>منصة سَنَد اللوجستية | بوابة تتبع الشحنات المباشرة</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          تتبع شحنتك لحظة بلحظة
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          أدخل رقم الشحنة (مثل: <span className="font-mono text-cyan-400 font-bold">SND-1001</span>) أو رقم جوال المستلم لمعرفة حالة وموقع شحنتك الميداني
        </p>

        {/* نموذج البحث */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto mt-4 relative">
          <div className="relative flex items-center shadow-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: SND-1001 أو 05XXXXXXXX"
              className="w-full bg-slate-900/90 border-2 border-slate-700 text-slate-100 rounded-2xl pr-11 pl-32 py-3.5 text-sm focus:border-[#00d2d3] outline-none font-mono shadow-inner transition-all placeholder:text-slate-500 placeholder:font-sans"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 pointer-events-none" />
            
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setData(null); setError(''); }}
                className="absolute left-28 text-slate-400 hover:text-white p-1 text-xs"
                title="مسح"
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="absolute left-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري البحث...</span>
                </>
              ) : (
                <span>تتبع الشحنة</span>
              )}
            </button>
          </div>
        </form>

        {/* أزرار أمثلة للتجربة السريعة */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="text-slate-400">شحنات جاهزة للتجربة السريعة:</span>
          {['SND-1001', 'SND-1002', 'SND-1003', '0550973690'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSampleClick(sample)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-300 font-mono text-[11px] font-bold border border-slate-700/80 cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* رسالة الخطأ إن وجدت */}
      {error && (
        <div className="p-4 bg-rose-950/50 border-2 border-rose-900/80 text-rose-200 text-xs rounded-2xl text-center max-w-lg mx-auto flex items-center justify-center gap-2 shadow-lg animate-in fade-in duration-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* تفاصيل الشحنة عند نجاح الاستعلام */}
      {data && data.order && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          
          {/* الترويسة العلوية للطلب */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black font-mono text-cyan-400">
                  {data.order.trackingNumber}
                </span>
                <span className="text-xs px-3 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold border border-slate-700">
                  {data.branch?.city || 'الدمام'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                المرسل: <strong className="text-slate-200">{data.branch?.name || 'متجر إكليل فيب'}</strong> • تاريخ التجهيز: {new Date(data.order.createdAt || Date.now()).toLocaleDateString('ar-SA')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleCopyLink} 
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم نسخ الرابط!' : 'مشاركة التتبع'}</span>
              </button>

              {/* شارة حالة الشحنة الميدانية */}
              <span className={`text-xs font-black px-3.5 py-2 rounded-xl border flex items-center gap-1.5 shadow-sm ${
                data.order.status === 'delivered' 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                  : data.order.status === 'in_transit' 
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse' 
                    : data.order.status === 'picked_up'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                      : 'bg-purple-950/80 text-purple-300 border-purple-800'
              }`}>
                {data.order.status === 'delivered' && '✅ تم التسليم بنجاح'}
                {data.order.status === 'in_transit' && '🚗 الشحنة في الطريق إليك'}
                {data.order.status === 'picked_up' && '📦 استلمها المندوب من الفرع'}
                {data.order.status === 'assigned' && '🟣 تم إسناد الشحنة للمندوب'}
                {data.order.status === 'unassigned' && '⏳ قيد التجهيز بالمستودع'}
                {data.order.status === 'exception' && '⚠️ تعثر التوصيل مؤقتاً'}
              </span>
            </div>
          </div>

          {/* خريطة التتبع المباشر المصغرة */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 relative h-48 sm:h-64 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            <div className="absolute top-2.5 right-2.5 z-10 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1 rounded-xl text-[10px] text-cyan-300 font-bold flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>رادار الخريطة المباشر</span>
            </div>
          </div>

          {/* المخطط الزمني لمراحل الشحن (Timeline) */}
          <div className="py-2">
            <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>مراحل الشحن والتوصيل (سَنَد):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
              {(data.timeline || []).map((step, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    step.done 
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20' 
                      : step.isException 
                        ? 'bg-rose-950/30 border-rose-500/50' 
                        : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        step.done ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {step.done ? '✓' : '•'}
                      </div>
                    </div>
                    <div className="font-bold text-slate-100 text-xs mb-1">{step.title}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                  {step.time && (
                    <div className="text-[10px] text-emerald-400 font-mono mt-3 pt-2 border-t border-slate-800/80">
                      {new Date(step.time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* بطاقة المندوب إن كان معيناً */}
          {data.driver && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-900/40">
                  🛵
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{data.driver.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">مندوب سَنَد المعتمد</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{data.driver.vehicle || 'مركبة معتمدة'}</div>
                </div>
              </div>

              {/* أزرار الاتصال والواتساب بالمندوب */}
              <div className="flex items-center gap-2">
                <a 
                  href={'tel:' + data.driver.phone} 
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-colors shadow-xs"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>اتصال</span>
                </a>
                <a 
                  href={`https://wa.me/966${String(data.driver.phone).replace(/\D/g, '').replace(/^0/, '').replace(/^966/, '')}?text=${encodeURIComponent(`مرحباً كابتن ${data.driver.name}، أنا العميل ${data.order.customerName} صاحب الشحنة رقم ${data.order.trackingNumber}.`)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>واتساب المندوب</span>
                </a>
              </div>
            </div>
          )}

          {/* تفاصيل العنوان والدفع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 space-y-2">
              <div className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>عنوان التوصيل المسجل:</span>
              </div>
              <div className="font-bold text-slate-100 text-sm">{data.order.customerName}</div>
              <div className="text-slate-300 leading-relaxed">{data.order.customerAddress || 'المنطقة الشرقية - الدمام'}</div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 font-bold mb-1">طريقة السداد والمبلغ:</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">وسيلة الدفع:</span>
                  <span className="font-bold text-slate-100">
                    {data.order.paymentMethod === 'cash' ? '💵 كاش عند الاستلام' : '💳 شبكة مدى للمندوب'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
                <span className="text-slate-400">إجمالي المطلوب تحصيله:</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {Number(data.order.totalAmount || 0).toFixed(2)} ﷼
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* بطاقة معلومات الدعم السريع أسفل الصفحة إذا لم يبحث بعد */}
      {!data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center space-y-1.5 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-800 text-[#00d2d3] flex items-center justify-center mx-auto">
              <Navigation className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-white">تتبع مباشر لحظة بلحظة</h4>
            <p className="text-[11px] text-slate-400">متابعة موقع الشحنة على خريطة حية وتحديثات مستمرة</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center space-y-1.5 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-white">تواصل فوري مع المندوب</h4>
            <p className="text-[11px] text-slate-400">اتصال هاتفي ومحادثة واتساب مباشرة بلمسة واحدة</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center space-y-1.5 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-white">إثبات تسليم معتمد (POD)</h4>
            <p className="text-[11px] text-slate-400">توقيع رقمي ورمز OTP لضمان وصول شحنتك بأمان</p>
          </div>
        </div>
      )}

    </div>
  );
}

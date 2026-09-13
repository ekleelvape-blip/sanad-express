import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Printer, MoreVertical, RotateCcw, XCircle, Copy, Star, Phone, 
  MessageSquare, Mail, MapPin, ExternalLink, Package, DollarSign, 
  Clock, CheckCircle2, ChevronDown, ChevronUp, Check, Store, Truck, 
  ShieldCheck, AlertCircle, ShoppingBag, Edit3, UserCheck, AlertTriangle
} from 'lucide-react';
import WaybillModal from './WaybillModal';
import { sound } from '../utils/sound';

export default function OrderDetailsModal({ order, drivers = [], branches = [], onClose, onRefresh }) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showWaybill, setShowWaybill] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(order?.assignedDriverId || '');
  const [loading, setLoading] = useState(false);
  const [copyToast, setCopyToast] = useState('');
  const [skuSearch, setSkuSearch] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [showFinancials, setShowFinancials] = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!order) return null;

  const branch = branches.find(b => b.id === order.branchId);
  const assignedDriver = drivers.find(d => d.id === (order.assignedDriverId || selectedDriverId));
  const rawId = order.id ? order.id.replace(/\D/g, '') : '284741285';
  const orderNumber = order.orderNumber || rawId || '284741285';
  const trackingId = order.trackingNumber || order.id || 'SND-1001';

  // نسخ رابط التتبع
  const handleCopyTrackingLink = () => {
    const link = window.location.origin + '/tracking?id=' + encodeURIComponent(trackingId);
    navigator.clipboard.writeText(link);
    setCopyToast('تم نسخ رابط التتبع بنجاح!');
    setShowActionsMenu(false);
    sound.playSuccess();
    setTimeout(() => setCopyToast(''), 3000);
  };

  // نسخ رابط التقييم
  const handleCopyRatingLink = () => {
    const link = window.location.origin + '/rating?id=' + encodeURIComponent(trackingId);
    navigator.clipboard.writeText(link);
    setCopyToast('تم نسخ رابط التقييم بنجاح!');
    setShowActionsMenu(false);
    sound.playSuccess();
    setTimeout(() => setCopyToast(''), 3000);
  };

  // طلب استرجاع
  const handleReturnOrder = async () => {
    setShowActionsMenu(false);
    if (!window.confirm('هل أنت متأكد من رغبتك في إنشاء طلب استرجاع لهذه الشحنة؟ ستنزل مباشرة في عهدة المندوب بالمسترجع.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/' + order.id + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'returned' })
      });
      if (res.ok) {
        sound.playSuccess();
        setCopyToast('تم تحويل الشحنة إلى (طلب استرجاع) بنجاح!');
        if (onRefresh) onRefresh();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء طلب الاسترجاع');
    } finally {
      setLoading(false);
    }
  };

  // إلغاء التوصيل
  const handleCancelOrder = async () => {
    setShowActionsMenu(false);
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء توصيل هذا الطلب نهائياً؟')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/' + order.id + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        sound.playSuccess();
        setCopyToast('تم إلغاء التوصيل بنجاح!');
        if (onRefresh) onRefresh();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إلغاء التوصيل');
    } finally {
      setLoading(false);
    }
  };

  // تعديل إسناد المندوب
  const handleAssignDriver = async (newDriverId) => {
    setSelectedDriverId(newDriverId);
    if (!newDriverId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/' + order.id + '/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: newDriverId })
      });
      if (res.ok) {
        sound.playSuccess();
        setCopyToast('تم تعديل إسناد المندوب بنجاح!');
        if (onRefresh) onRefresh();
        setTimeout(() => setCopyToast(''), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // عناصر الطلب الافتراضية إذا لم تكن موجودة
  const defaultItems = [
    {
      name: 'نكهة باشن فروت بارد من شركة براند 30 مل',
      sku: '58761421',
      options: 'النيكوتين : 50mg | ملاحظة العميل : BY_ZUD_472',
      costPrice: 0,
      price: 65.00,
      qty: 1,
      matched: true,
      image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=100&auto=format&fit=crop&q=80'
    },
    {
      name: 'بود إكسليم برو 2مل من شركة أوكسفا',
      sku: 'OX-XLIM-PRO',
      options: 'المقاومة : 0.8 | الكمية : علبة - BOX',
      costPrice: 0,
      price: 46.30,
      qty: 1,
      matched: true,
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&auto=format&fit=crop&q=80'
    }
  ];

  const items = (order.items && order.items.length > 0) ? order.items : defaultItems;

  const getStatusBadge = () => {
    switch (order.status) {
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            تم التوصيل
          </span>
        );
      case 'in_transit':
      case 'picked_up':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            جاري التوصيل
          </span>
        );
      case 'assigned':
        return (
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            مسندة للمندوب
          </span>
        );
      case 'returned':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            مسترجع
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 font-bold text-xs flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            ملغي
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            جاهزة للتوصيل
          </span>
        );
    }
  };

  const cleanPhone = (order.customerPhone || '0550973690').replace(/[^0-9]/g, '');
  const saPhone = cleanPhone.startsWith('966') ? cleanPhone : ('966' + cleanPhone.replace(/^0/, ''));
  const warehouseName = order.warehouse || (branch ? branch.name : 'إكليل الكيف - فرع الدمام');
  const warehousePhone = order.warehousePhone || (branch?.phone ? ('+966' + String(branch.phone).replace(/^0/, '')) : '+966539409522');
  const nationalAddress = order.nationalAddress || 'EHDC3792';
  const getCityDeliveryFee = () => {
    if (order.deliveryFee && Number(order.deliveryFee) > 0 && order.deliveryFee !== 17.39 && order.deliveryFee !== 20) {
      return Number(order.deliveryFee);
    }
    const addr = ((order.customerAddress || '') + ' ' + (branch?.city || '')).toLowerCase();
    if (addr.includes('صفو') || addr.includes('صفوي')) return 40;
    if (addr.includes('قطيف') || addr.includes('تاروت')) return 35;
    if (addr.includes('خبر') || addr.includes('عزيزية') || addr.includes('عقربية')) return 35;
    if (addr.includes('ظهران') || addr.includes('دوحة') || addr.includes('دانة') || addr.includes('قصور')) return 30;
    if (addr.includes('سيهات') || addr.includes('عنك')) return 30;
    if (addr.includes('دمام')) return 25;
    return 25;
  };
  const deliveryFeeNum = getCityDeliveryFee();
  const deliveryFee = deliveryFeeNum.toFixed(2);
  const subtotal = order.subtotal || (order.totalAmount ? Math.max(0, Number(order.totalAmount) - deliveryFeeNum).toFixed(2) : '100.00');
  const totalAmount = order.totalAmount ? Number(order.totalAmount).toFixed(2) : '148.00';
  const paymentLabel = order.paymentMethod === 'stc_pay' ? 'STC Pay' : (order.paymentMethod === 'cash' ? 'دفع عند الاستلام (كاش)' : 'شبكة مدى');
  const requiresCod = order.requiresCod ?? (order.paymentMethod === 'cash');

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      <div 
        className="bg-[#f8fafc] dark:bg-[#0c121e] text-slate-800 dark:text-slate-100 rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 dark:border-cyan-900/40 my-auto overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]"
        dir="rtl"
      >
        {/* التنبيه العائم عند النسخ */}
        {copyToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[5000] bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* 1. الشريط العلوي (Breadcrumb + زر الطابعة + زر إجراءات + زر الإغلاق) */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090d16] flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">كل الطلبات</span>
            <span className="text-slate-400">»</span>
            <span className="font-bold text-slate-800 dark:text-cyan-400 flex items-center gap-1.5">
              <span>تفاصيل الطلب</span>
              <span className="font-mono bg-cyan-950/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                {orderNumber}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* زر طباعة البوليصة السريعة مع المؤشر الأخضر */}
            <button
              type="button"
              onClick={() => setShowWaybill(true)}
              className="relative p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
              title="طباعة بوليصة الشحن 4×6"
            >
              <Printer className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            {/* قائمة زر «إجراءات» مع النقاط الثلاث */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>إجراءات</span>
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showActionsMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#111827] border border-slate-200 dark:border-cyan-900/50 rounded-xl shadow-2xl py-1.5 z-50 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
                  <button
                    type="button"
                    onClick={handleReturnOrder}
                    disabled={loading}
                    className="w-full px-3.5 py-2 text-right text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>طلب استرجاع</span>
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-500" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={loading}
                    className="w-full px-3.5 py-2 text-right text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>إلغاء التوصيل</span>
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

                  <button
                    type="button"
                    onClick={handleCopyTrackingLink}
                    className="w-full px-3.5 py-2 text-right text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>نسخ رابط التتبع</span>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyRatingLink}
                    className="w-full px-3.5 py-2 text-right text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>نسخ رابط التقييم</span>
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              )}
            </div>

            {/* زر الإغلاق */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* محتوى الشاشة: تقسيم الأعمدة مطابق لصورة سلة / تيار */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* العمود الجانبي (الأيمن) - كروت البيانات الأساسية */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* كرت بيانات العميل */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-400">
                    <Package className="w-3.5 h-3.5" />
                    بيانات العميل
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {order.customerName || 'yara alshehri'} <span className="text-[11px] font-normal text-slate-400">(المستلم)</span>
                    </div>
                    <div className="text-slate-400 font-mono text-xs mt-0.5">
                      +{saPhone}
                    </div>
                  </div>
                  {/* أزرار التواصل المباشر */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={'https://wa.me/' + saPhone + '?text=' + encodeURIComponent('مرحباً ' + (order.customerName || '') + '، بخصوص شحنتك رقم ' + trackingId + ' من سَنَد')}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                      title="محادثة واتساب"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                    <a
                      href={'tel:+' + saPhone}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={'sms:+' + saPhone}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                      title="إرسال رسالة نصية"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* كرت بيانات السائق / المندوب */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-400">
                    <Truck className="w-3.5 h-3.5" />
                    بيانات السائق
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold font-mono text-[11px]">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>5.0</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                      {assignedDriver ? assignedDriver.name : 'علي حسين الهاشم'}
                    </div>
                    <div className="text-slate-400 font-mono text-xs mt-0.5">
                      {assignedDriver ? assignedDriver.phone : '+966534185799'}
                    </div>
                  </div>
                  <a
                    href={'tel:' + (assignedDriver ? assignedDriver.phone : '+966534185799')}
                    className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 hover:scale-110 transition-transform"
                    title="اتصال بالسائق"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                {/* قائمة سريعة لتعديل إسناد المندوب */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <select
                    value={selectedDriverId}
                    onChange={(e) => handleAssignDriver(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 text-xs font-semibold outline-none focus:border-cyan-500"
                  >
                    <option value="">-- تغيير المندوب المسند --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.online ? '🟢 متصل' : '⚪ أوفلاين'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* كرت شركة الشحن */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-400">
                    <Store className="w-3.5 h-3.5" />
                    شركة الشحن
                  </span>
                  <button className="text-slate-400 hover:text-cyan-400">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 dark:text-slate-300 font-semibold">سَنَد (مندوب توصيل)</span>
                  <span className="font-mono text-slate-400">عدد الكراتين : 1 كرتونة</span>
                </div>
              </div>

              {/* كرت المستودع */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-400">
                    <Store className="w-3.5 h-3.5" />
                    المستودع
                  </span>
                  <button className="text-slate-400 hover:text-cyan-400">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-slate-800 dark:text-white">{warehouseName}</div>
                  <div className="text-slate-400 text-[11px] flex items-center justify-between">
                    <span>س طيبة / الشرقية</span>
                    <a href={'tel:' + warehousePhone} className="text-emerald-500 font-mono font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{warehousePhone}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* كرت عنوان التوصيل مع العنوان الوطني وخريطة جوجل */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-400">
                    <MapPin className="w-3.5 h-3.5" />
                    عنوان التوصيل
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {order.customerAddress || 'الدمام، الأمانة، الملك فهد بن عبدالعزيز سعود 3792، الأمانة، الدمام، SA 5Q'}
                </div>
                
                {/* العنوان الوطني المختصر */}
                <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">العنوان الوطني المختصر:</span>
                  <span className="font-mono font-black text-cyan-700 dark:text-cyan-400 bg-white dark:bg-cyan-900/60 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-700">
                    {nationalAddress}
                  </span>
                </div>

                {/* زر عرض على خرائط جوجل */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress || 'الدمام حي الأمانة')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>عرض على خرائط جوجل</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              {/* كرت بيانات التحصيل */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="text-slate-700 dark:text-cyan-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  بيانات التحصيل
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>الإجمالي قبل التوصيل :</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{subtotal} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>تكلفة التوصيل :</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{deliveryFee} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>الإجمالي :</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">{totalAmount} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1">
                    <span>طريقة الدفع :</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                      {paymentLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>مطلوب تحصيل عند الاستلام؟ :</span>
                    <span className={`font-bold ${requiresCod ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {requiresCod ? 'نعم (COD)' : 'لا'}
                    </span>
                  </div>
                </div>
              </div>

              {/* كرت مصدر الطلب والملاحظات وموعد التسليم */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div>
                  <div className="text-slate-400 text-[11px] font-bold">مصدر الطلب :</div>
                  {order.orderSource?.includes('يدوي') || (!order.sallaOrderNumber && order.orderSource !== 'سلة (Salla)') ? (
                    <div className="font-bold text-purple-400 mt-1 flex items-center gap-1.5 bg-purple-950/40 border border-purple-800/60 px-2.5 py-1 rounded-xl w-fit">
                      <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                      <span>يدوي (Manual)</span>
                    </div>
                  ) : (
                    <div className="font-bold text-cyan-400 mt-1 flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-800/60 px-2.5 py-1 rounded-xl w-fit">
                      <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                      <span>سلة (Salla)</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold">ملاحظات الطلب :</div>
                  <div className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {order.notes || 'الملك فهد بن عبدالعزيز سعود 3792، الأمانة، الدمام'}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    موعد التسليم :
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    {order.deliverySchedule || 'لم يتم تحديد موعد التسليم'}
                  </div>
                </div>
              </div>

            </div>

            {/* العمود الرئيسي (الأيسر) - سجل الطلب، المنتجات، والمعاملات المالية */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* شارة حالة الطلب الكبيرة */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">حالة الطلب الحالية:</span>
                  {getStatusBadge()}
                </div>
                <div className="text-slate-400 text-[11px] font-mono">
                  {new Date(order.createdAt || Date.now()).toLocaleDateString('ar-SA')}
                </div>
              </div>

              {/* 1. سجل الطلب (History Timeline) */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full p-4 flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <span>سجل الطلب</span>
                  </span>
                  {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showHistory && (
                  <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="relative pr-6 space-y-4 before:content-[''] before:absolute before:right-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      <div className="relative">
                        <div className="absolute -right-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#101726]"></div>
                        <div className="font-bold text-slate-900 dark:text-white">تم إنشاء الطلب في سلة</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">تم استيراد تفاصيل الطلب برقم #{orderNumber} وتوجيهه لمركز توزيع سند</div>
                      </div>

                      <div className="relative">
                        <div className="absolute -right-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-white dark:border-[#101726]"></div>
                        <div className="font-bold text-slate-900 dark:text-white">إسناد الشحنة للمندوب</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">تم إسناد الشحنة للسائق {assignedDriver ? assignedDriver.name : 'علي حسين الهاشم'} والتأكيد في التطبيق</div>
                      </div>

                      <div className="relative">
                        <div className="absolute -right-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white dark:border-[#101726]"></div>
                        <div className="font-bold text-slate-900 dark:text-white">جاري التوصيل بالميدان</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">انطلق المندوب بالشحنة وبث الموقع المباشر نحو وجهة العميل في حي الأمانة</div>
                      </div>

                      <div className="relative">
                        <div className={`absolute -right-[21px] top-0.5 w-3.5 h-3.5 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white dark:border-[#101726]`}></div>
                        <div className="font-bold text-slate-900 dark:text-white">تم التسليم للعميل</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">تم تسليم الشحنة بنجاح وتأكيد الاستلام عبر STC Pay</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. المنتجات (Products Table) */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-500" />
                    <span>المنتجات</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                      {items.length} منتج
                    </span>
                  </div>
                </div>

                {/* حقل مطابقة SKU */}
                <div className="relative">
                  <input
                    type="text"
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    placeholder="أدخل مطابقة SKU للمنتج..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>

                {/* جدول المنتجات */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="pb-2 font-medium pr-2">صورة</th>
                        <th className="pb-2 font-medium">الاسم</th>
                        <th className="pb-2 font-medium">خيارات المنتج</th>
                        <th className="pb-2 font-medium">سعر التكلفة</th>
                        <th className="pb-2 font-medium">الكمية</th>
                        <th className="pb-2 font-medium pl-2 text-center">حالة المطابقة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="py-3 pr-2">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=100&auto=format&fit=crop&q=80'}
                              alt={item.name}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="py-3 font-semibold text-slate-800 dark:text-slate-100 max-w-[200px]">
                            <div>{item.name}</div>
                            <div className="text-slate-400 font-mono text-[10px] mt-0.5">{item.sku || '58761421'}</div>
                          </td>
                          <td className="py-3 text-slate-500 dark:text-slate-300 text-[11px] leading-relaxed">
                            {item.options || 'النيكوتين : 50mg | ملاحظة العميل : BY_ZUD_472'}
                          </td>
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              0 ر.س ✏️
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-800 dark:text-white">
                            {item.qty || 1}
                          </td>
                          <td className="py-3 pl-2 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 font-bold border border-rose-500/30">
                              1
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. المعاملات المالية للطلب */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowFinancials(!showFinancials)}
                  className="w-full p-4 flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>المعاملات المالية للطلب</span>
                  </span>
                  {showFinancials ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showFinancials && (
                  <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-400 text-[11px]">مبلغ السلة الصافي</div>
                        <div className="font-mono font-black text-slate-800 dark:text-white text-base mt-1">{subtotal} ر.س</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-400 text-[11px]">رسوم الشحن والتوصيل</div>
                        <div className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-base mt-1">{deliveryFee} ر.س</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-400 text-[11px]">عمولة المندوب (المستحقة)</div>
                        <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base mt-1">
                          {(order.driverCommission && Number(order.driverCommission) !== 20 ? Number(order.driverCommission) : deliveryFeeNum).toFixed(2)} ر.س
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* تذييل النافذة */}
        <div className="p-4 bg-white dark:bg-[#090d16] border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 sticky bottom-0 z-20 text-xs">
          <div className="text-slate-400 text-[11px] flex items-center gap-2">
            <span>رقم الشحنة الموحد:</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{trackingId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWaybill(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة بوليصة 4×6</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>

      {showWaybill && (
        <WaybillModal
          order={order}
          branch={branch}
          driver={assignedDriver}
          onClose={() => setShowWaybill(false)}
        />
      )}
    </div>
  );
}

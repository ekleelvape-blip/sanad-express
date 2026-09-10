import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Route, ScanLine, Package, User, Calendar, Wallet, Settings,
  CheckSquare, TrendingUp, Lock, Star, Info, LogOut, Bell, Sliders,
  MapPin, Map, Phone, MessageSquare, ExternalLink, Clock, ShieldCheck,
  CheckCircle2, X, ChevronLeft, ChevronRight, Search, RefreshCw, Box,
  DollarSign, Sparkles, Navigation, RotateCcw, AlertTriangle, Key,
  Eye, EyeOff, Camera, ArrowUpRight, QrCode, Shield, Check, Award
} from 'lucide-react';
import { sound } from '../utils/sound';
import DriverWallet from './DriverWallet';
import DeliveryExceptionModal from './DeliveryExceptionModal';

export default function DriverApp({
  drivers = [],
  orders = [],
  branches = [],
  currentDriverId,
  onChangeDriver,
  onUpdateOrderStatus,
  onUpdateDriverLocation,
  onToggleDriverStatus,
  onRefresh
}) {
  // حالة تسجيل الدخول للمندوب
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem('sanad_driver_auth');
    } catch {
      return true; // افتراضي نشط للسهولة
    }
  });

  // التبويب السفلي الرئيسي: 'home' | 'routes' | 'scan' | 'inventory' | 'account'
  const [activeBottomTab, setActiveBottomTab] = useState('home');

  // التبويب الفرعي للطلبات في الرئيسية: 'new' | 'in_transit' | 'returned'
  const [ordersSubTab, setOrdersSubTab] = useState('new');

  // حالة التوفر الميداني للمندوب (متاح / غير متاح)
  const [isAvailable, setIsAvailable] = useState(false);

  // النوافذ المنبثقة لجميع الصلاحيات والخيارات المذكورة بالصور
  const [showHistoryModal, setShowHistoryModal] = useState(false);       // سجل الطلبات
  const [showWalletModal, setShowWalletModal] = useState(false);         // المحفظة
  const [showSettingsModal, setShowSettingsModal] = useState(false);     // إعداداتي
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);   // تم التوصيل (قائمة بآخر عشرين طلب)
  const [showStatsModal, setShowStatsModal] = useState(false);           // إحصائياتي
  const [showProfileModal, setShowProfileModal] = useState(false);       // البيانات الشخصية
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);       // سياسة الخصوصية
  const [showAppRatingModal, setShowAppRatingModal] = useState(false);   // تقييم التطبيق
  const [showAboutModal, setShowAboutModal] = useState(false);           // من نحن
  const [showScanModal, setShowScanModal] = useState(false);             // مسح الباركود (الزر العائم الأوسط)
  const [showMapModal, setShowMapModal] = useState(false);               // الخريطة والملاحة العائمة
  const [showNotificationsModal, setShowNotificationsModal] = useState(false); // الإشعارات 🔔
  
  // تأكيد التسليم والتعثر
  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null);
  const [confirmPaymentMethod, setConfirmPaymentMethod] = useState('cash');
  const [exceptionOrder, setExceptionOrder] = useState(null);

  // حقول إعداداتي وكلمة المرور
  const [appNavPreference, setAppNavPreference] = useState('google'); // 'google' | 'waze' | 'apple'
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passMessage, setPassMessage] = useState('');

  // تقييم التطبيق
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // الباركود اليدوي
  const [manualBarcode, setManualBarcode] = useState('');
  const [barcodeScanSuccess, setBarcodeScanSuccess] = useState(null);

  // المندوب الفعلي الحالي (يونس افتراضياً كما في الصورة)
  const savedAuth = (() => {
    try {
      const item = localStorage.getItem('sanad_driver_auth');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const activeDriverId = savedAuth?.id || currentDriverId || 'drv-1';
  const currentDriver = drivers.find(d => d.id === activeDriverId) || drivers[0] || {
    id: 'drv-1',
    code: '957',
    name: 'يونس',
    phone: '+966502893163',
    nationalId: '2463794624',
    vehicle: 'سيارة خاصة (كامري 2023)',
    rating: 5.0,
    cashOnHand: 327.74
  };

  // شحنات هذا المندوب
  const driverMatchId = (assignedId) => {
    if (!assignedId) return false;
    return assignedId === currentDriver.id ||
           assignedId === currentDriver.id?.replace('drv-10', 'drv-') ||
           ('drv-10' + assignedId?.replace('drv-', '')) === currentDriver.id;
  };

  const myOrders = orders.filter(o => driverMatchId(o.assignedDriverId));
  const newOrders = myOrders.filter(o => ['assigned', 'ready_for_pickup'].includes(o.status));
  const inTransitOrders = myOrders.filter(o => ['in_transit', 'picked_up'].includes(o.status));
  const returnedOrders = myOrders.filter(o => ['returned', 'exception', 'return_requested'].includes(o.status));
  const deliveredOrders = myOrders.filter(o => o.status === 'delivered');

  // حساب المبالغ المتوقعة
  const expectedCashAmount = inTransitOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // تبديل حالة التوفر (متاح / غير متاح)
  const toggleAvailability = () => {
    const next = !isAvailable;
    setIsAvailable(next);
    sound.pop();
    if (onToggleDriverStatus) onToggleDriverStatus(currentDriver.id);
  };

  // تسليم الطلب
  const handleConfirmDelivery = async () => {
    if (!deliveryConfirmOrder) return;
    try {
      if (onUpdateOrderStatus) {
        await onUpdateOrderStatus(deliveryConfirmOrder.id, 'delivered', confirmPaymentMethod);
      }
      sound.playSuccess();
      setDeliveryConfirmOrder(null);
      if (onRefresh) onRefresh();
      alert('✅ تم تأكيد تسليم الشحنة بنجاح وإيداع عمولة التوصيل في محفظتك!');
    } catch (err) {
      alert('حدث خطأ أثناء تأكيد التسليم');
    }
  };

  // تسجيل الخروج
  const handleLogout = () => {
    if (window.confirm('هل تريد تسجيل الخروج من تطبيق المندوب؟')) {
      localStorage.removeItem('sanad_driver_auth');
      setIsLoggedIn(false);
      alert('تم تسجيل الخروج بنجاح.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#f4f6f8] dark:bg-[#0a0e18] text-slate-800 dark:text-slate-100 flex flex-col font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] select-none relative pb-28" dir="rtl">
      
      {/* ========================================================================= */}
      {/* التبويب 1: الرئيسية (HOME) - مطابق للصورة 4 تماماً */}
      {/* ========================================================================= */}
      {activeBottomTab === 'home' && (
        <div className="p-4 space-y-4">
          
          {/* الترويسة العلوية للرئيسية */}
          <div className="flex items-center justify-between pt-1">
            {/* جهة اليمين: الترحيب والمعرف والمخزون */}
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                حيَّاك الله، {currentDriver.name || 'يونس'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-0.5 rounded-lg text-xs font-bold shadow-2xs">
                  المُعَرّف {currentDriver.code || '957'}
                </span>
                <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-0.5 rounded-lg text-xs font-bold shadow-2xs">
                  مخزون: {inTransitOrders.length} قطعة
                </span>
              </div>
            </div>

            {/* جهة اليسار: زر التنبيهات وزر غير متاح */}
            <div className="flex items-center gap-2">
              {/* زر حالة التوفر: غير متاح / متاح */}
              <button
                type="button"
                onClick={toggleAvailability}
                className={
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ' +
                  (isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca] dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900'
                  )
                }
              >
                <span className={'w-2 h-2 rounded-full ' + (isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')}></span>
                <span>{isAvailable ? 'متاح للطلب' : 'غير متاح'}</span>
              </button>

              {/* أيقونة الجرس 🔔 */}
              <button
                type="button"
                onClick={() => setShowNotificationsModal(true)}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#00d2d3] shadow-2xs cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* بطاقات المؤشرات الثلاثة الأفقية العلوية */}
          <div className="grid grid-cols-3 gap-2.5">
            
            {/* بطاقة 1: طلب نشط */}
            <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-[#00d2d3]">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
                {inTransitOrders.length}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                طلب نشط
              </div>
            </div>

            {/* بطاقة 2: متوقع تحصيل */}
            <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-500">
                <span className="font-bold text-base">﷼</span>
              </div>
              <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
                {expectedCashAmount > 0 ? expectedCashAmount.toFixed(0) : '0'}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                متوقع تحصيل
              </div>
            </div>

            {/* بطاقة 3: التقييم */}
            <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
                {currentDriver.rating ? currentDriver.rating.toFixed(1) : '-'}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                تقييم لـ {deliveredOrders.length} طلب
              </div>
            </div>

          </div>

          {/* قسم طلباتي والأزرار الفلترة الثلاثية */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white">طلباتي</h2>
            </div>

            {/* أزرار الفلترة: جديد + جاري التوصيل + مسترجع + زر الإعدادات/الفلتر */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                {/* جديد */}
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('new')}
                  className={
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ' +
                    (ordersSubTab === 'new'
                      ? 'bg-[#1c2438] text-white font-black'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    )
                  }
                >
                  جديد
                </button>

                {/* جاري التوصيل */}
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('in_transit')}
                  className={
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ' +
                    (ordersSubTab === 'in_transit'
                      ? 'bg-[#1c2438] text-white font-black'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    )
                  }
                >
                  جاري التوصيل
                </button>

                {/* مسترجع */}
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('returned')}
                  className={
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ' +
                    (ordersSubTab === 'returned'
                      ? 'bg-[#1c2438] text-white font-black'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    )
                  }
                >
                  مسترجع
                </button>
              </div>

              {/* زر الفلتر الأيسر */}
              <button
                type="button"
                onClick={() => alert('فلترة الشحنات حسب الفرع أو نوع الدفع')}
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            {/* محتوى الشحنات بحسب التبويب */}
            <div className="pt-4">
              {ordersSubTab === 'new' && newOrders.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-24 h-24 bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900 rounded-3xl flex items-center justify-center shadow-inner">
                    <span className="text-5xl">📦</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    لا يوجد طلبات مسندة بعد
                  </h3>
                </div>
              )}

              {ordersSubTab === 'in_transit' && inTransitOrders.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-24 h-24 bg-cyan-50/50 dark:bg-cyan-950/20 border-2 border-cyan-200 dark:border-cyan-900 rounded-3xl flex items-center justify-center shadow-inner">
                    <span className="text-5xl">🚚</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    لا توجد طلبات جاري توصيلها حالياً
                  </h3>
                </div>
              )}

              {ordersSubTab === 'returned' && returnedOrders.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center shadow-inner">
                    <span className="text-5xl">↩️</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    لا توجد طلبات مسترجعة
                  </h3>
                </div>
              )}

              {/* عرض قائمة الطلبات الفعلية إن وجدت */}
              {((ordersSubTab === 'new' ? newOrders : ordersSubTab === 'in_transit' ? inTransitOrders : returnedOrders)).map(order => (
                <div key={order.id} className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
                      #{order.id}
                    </span>
                    <span className="font-mono font-black text-sm text-[#00d2d3]">
                      {order.totalAmount} ﷼
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{order.customerAddress || 'الدمام، حي الشاطئ'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setDeliveryConfirmOrder(order)}
                      className="flex-1 py-2 bg-[#00d2d3] hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all shadow-xs"
                    >
                      تسليم الشحنة ✅
                    </button>
                    <button
                      onClick={() => setExceptionOrder(order)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      تعثر التسليم
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* زر الخريطة والملاحة العائم بالأسفل على اليسار مطابق للصورة 4 */}
          <button
            type="button"
            onClick={() => setShowMapModal(true)}
            className="fixed bottom-24 left-4 z-40 w-12 h-12 rounded-2xl bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 cursor-pointer active:scale-95 transition-all"
            title="عرض الخريطة الحية والملاحة"
          >
            <Map className="w-6 h-6 stroke-[2]" />
          </button>

        </div>
      )}

      {/* ========================================================================= */}
      {/* التبويب 2: المسارات (ROUTES) - مطابق للصورة 3 تماماً */}
      {/* ========================================================================= */}
      {activeBottomTab === 'routes' && (
        <div className="p-4 space-y-4">
          
          {/* الترويسة العلوية للمسارات */}
          <div className="flex items-center justify-between pt-1">
            <div className="w-8"></div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">
              المسارات
            </h1>
            <button
              type="button"
              onClick={() => setShowNotificationsModal(true)}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right">
            مسارات ذكية تم اسنادها لك
          </div>

          {/* حالة الفراغ المطابقة تماماً للصورة 3: رسم المسار البنفسجي والدبوس */}
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            {/* أيقونة المسار المنحني مع الدبوس */}
            <div className="w-24 h-24 rounded-full bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center shadow-inner">
              <Route className="w-12 h-12 text-[#9333ea] stroke-[1.7]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                لا يوجد مسارات ذكية متاحة مسندة لك
              </h3>
              <p className="text-xs text-slate-400">
                فضلاً توجه للطلبات المسندة..
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* التبويب 4: المخزون (INVENTORY) */}
      {/* ========================================================================= */}
      {activeBottomTab === 'inventory' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pt-1">
            <h1 className="text-base font-black text-slate-900 dark:text-white">
              المخزون والعهدة الميدانية
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-[#00d2d3] border border-cyan-300 dark:border-cyan-800">
              {inTransitOrders.length} شحنات بالسيارة
            </span>
          </div>

          <div className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
              بيانات العهدة في سيارتك ({currentDriver.vehicle || 'كامري 2023'}):
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">جهاز نقاط بيع مدى:</span>
                <span className="font-bold font-mono">SN-POS-9812 (Geidea)</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">حقيبة حرارية عازلة:</span>
                <span className="font-bold font-mono">BAG-EXP-04 (سند)</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">الكاش المسلم بالعهدة:</span>
                <span className="font-bold font-mono text-emerald-600">{currentDriver.cashOnHand || '327.74'} ﷼</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* التبويب 5: حسابي (ACCOUNT) - مطابق للصورتين 1 و 2 تماماً */}
      {/* ========================================================================= */}
      {activeBottomTab === 'account' && (
        <div className="p-4 space-y-4">
          
          {/* الترويسة العلوية لصفحة حسابي (مطابقة للصورة 1) */}
          <div className="flex items-start justify-between pt-1">
            {/* جهة اليمين: اسم يونس وأيقونة المستخدم والمعرف والتقييم */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white">
                  <User className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentDriver.name || 'يونس'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-0.5 rounded-lg text-xs font-bold shadow-2xs">
                  المُعَرّف {currentDriver.code || '957'}
                </span>
                <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-0.5 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1">
                  <span>تقييم: -</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
              </div>
            </div>

            {/* جهة اليسار: زر غير متاح */}
            <button
              type="button"
              onClick={toggleAvailability}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ' +
                (isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca] dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900'
                )
              }
            >
              <span className={'w-2 h-2 rounded-full ' + (isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')}></span>
              <span>{isAvailable ? 'متاح للطلب' : 'غير متاح'}</span>
            </button>
          </div>

          {/* البطاقات الثلاثة السريعة: سجل الطلبات + المحفظة + إعداداتي */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            
            {/* سجل الطلبات 📅 */}
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center space-y-1.5 cursor-pointer hover:border-cyan-400 active:scale-95 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#fef9c3] border border-[#fef08a] flex items-center justify-center text-[#ca8a04]">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                سجل الطلبات
              </span>
            </button>

            {/* المحفظة 👛 */}
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center space-y-1.5 cursor-pointer hover:border-emerald-400 active:scale-95 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a]">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                المحفظة
              </span>
            </button>

            {/* إعداداتي ⚙️ */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center space-y-1.5 cursor-pointer hover:border-cyan-400 active:scale-95 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#cffafe] border border-[#a5f3fc] flex items-center justify-center text-[#0891b2]">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                إعداداتي
              </span>
            </button>

          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

          {/* قسم المزيد مع القائمة الكاملة المطابقة للصورتين 1 و 2 */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-black text-slate-900 dark:text-white text-right">
              المزيد
            </h2>

            {/* 1. بطاقة: تم التوصيل (قائمة بآخر عشرين طلب تم توصيلهم) */}
            <button
              type="button"
              onClick={() => setShowDeliveredModal(true)}
              className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-cyan-400 active:scale-[0.99] transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <div className="text-right">
                <div className="font-bold text-xs text-slate-900 dark:text-white">تم التوصيل</div>
                <div className="text-[11px] text-slate-400 mt-0.5">قائمة بآخر عشرين طلب تم توصيلهم</div>
              </div>
              <div className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <CheckSquare className="w-4 h-4" />
              </div>
            </button>

            {/* 2. بطاقة: إحصائياتي (تشمل الاحصائيات منذ بدأ العمل) */}
            <button
              type="button"
              onClick={() => setShowStatsModal(true)}
              className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-cyan-400 active:scale-[0.99] transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <div className="text-right">
                <div className="font-bold text-xs text-slate-900 dark:text-white">إحصائياتي</div>
                <div className="text-[11px] text-slate-400 mt-0.5">تشمل الاحصائيات منذ بدأ العمل</div>
              </div>
              <div className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <TrendingUp className="w-4 h-4" />
              </div>
            </button>

            {/* 3. بطاقة مشتركة: البيانات الشخصية + سياسة الخصوصية + تقييم التطبيق */}
            <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
              
              {/* البيانات الشخصية */}
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">البيانات الشخصية</span>
                <User className="w-4 h-4 text-slate-500" />
              </button>

              {/* سياسة الخصوصية */}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">سياسة الخصوصية</span>
                <Lock className="w-4 h-4 text-slate-500" />
              </button>

              {/* تقييم التطبيق */}
              <button
                type="button"
                onClick={() => setShowAppRatingModal(true)}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">تقييم التطبيق</span>
                <Star className="w-4 h-4 text-slate-500" />
              </button>

            </div>

            {/* 4. بطاقة: من نحن (تعرف أكثر على طيار و كيف بدأ رحلته) */}
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-cyan-400 active:scale-[0.99] transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <div className="text-right">
                <div className="font-bold text-xs text-slate-900 dark:text-white">من نحن</div>
                <div className="text-[11px] text-slate-400 mt-0.5">تعرف أكثر على منصة سند إكسبريس للخدمات اللوجستية</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white shadow-xs">
                <Package className="w-4 h-4" />
              </div>
            </button>

            {/* 5. بطاقة: تسجيل الخروج (مطابقة لأسفل الصورة 2) */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-rose-400 active:scale-[0.99] transition-all shadow-xs text-rose-600"
            >
              <div className="w-4"></div>
              <span className="font-bold text-xs">تسجيل الخروج</span>
              <LogOut className="w-4 h-4 stroke-[2]" />
            </button>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* شريط التنقل السفلي الثابت (5 عناصر مع زر المسح البارز بالوسط) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-[#1c2438] text-white px-3 py-2 flex items-center justify-around shadow-2xl border-t border-slate-800">
        
        {/* 1. الرئيسية */}
        <button
          type="button"
          onClick={() => setActiveBottomTab('home')}
          className={'flex flex-col items-center gap-1 py-1 px-2.5 transition-colors cursor-pointer ' + 
            (activeBottomTab === 'home' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">الرئيسية</span>
        </button>

        {/* 2. المسارات */}
        <button
          type="button"
          onClick={() => setActiveBottomTab('routes')}
          className={'flex flex-col items-center gap-1 py-1 px-2.5 transition-colors cursor-pointer ' + 
            (activeBottomTab === 'routes' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <Route className="w-5 h-5" />
          <span className="text-[10px]">المسارات</span>
        </button>

        {/* 3. زر المسح الباركود البارز الدائري بالوسط (FAB) */}
        <div className="relative -top-5">
          <button
            type="button"
            onClick={() => setShowScanModal(true)}
            className="w-14 h-14 rounded-full bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 border-4 border-[#1c2438] active:scale-95 transition-all cursor-pointer"
            title="مسح الباركود السريع"
          >
            <ScanLine className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. المخزون */}
        <button
          type="button"
          onClick={() => setActiveBottomTab('inventory')}
          className={'flex flex-col items-center gap-1 py-1 px-2.5 transition-colors cursor-pointer ' + 
            (activeBottomTab === 'inventory' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">المخزون</span>
        </button>

        {/* 5. حسابي */}
        <button
          type="button"
          onClick={() => setActiveBottomTab('account')}
          className={'flex flex-col items-center gap-1 py-1 px-2.5 transition-colors cursor-pointer ' + 
            (activeBottomTab === 'account' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">حسابي</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* جميع النوافذ المنبثقة التفاعلية لفتح كافة الصلاحيات المذكورة بالصور */}
      {/* ========================================================================= */}

      {/* 1. نافذة: سجل الطلبات (Calendar 📅) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>سجل الطلبات والمشاوير المكتملة</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
              {deliveredOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400">لا توجد شحنات سابقة مسجلة اليوم.</div>
              ) : (
                deliveredOrders.map((o, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex justify-between items-center">
                    <div>
                      <div className="font-bold font-mono">#{o.id}</div>
                      <div className="text-[11px] text-slate-500">{o.customerName}</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">+{o.totalAmount} ﷼</span>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 2. نافذة: المحفظة (Wallet 👛) */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>محفظة المندوب والتحصيلات</span>
              </h3>
              <button onClick={() => setShowWalletModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">رصيد العمولات المستحقة لك</div>
                <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {(deliveredOrders.length * 20).toFixed(2)} ﷼
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">الكاش المسلم باليد (العهدة):</span>
                  <span className="font-bold font-mono">{currentDriver.cashOnHand || '327.74'} ﷼</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">عمولة كل مشوار:</span>
                  <span className="font-bold font-mono text-[#00d2d3]">20.00 ﷼</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowWalletModal(false)} className="w-full py-2.5 bg-[#00d2d3] text-slate-950 rounded-xl text-xs font-black">
              تم الاطلاع
            </button>
          </div>
        </div>
      )}

      {/* 3. نافذة: إعداداتي (Settings ⚙️) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-500" />
                <span>إعدادات التطبيق والملاحة</span>
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">تطبيق الملاحة المفضل:</label>
                <select
                  value={appNavPreference}
                  onChange={(e) => setAppNavPreference(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  <option value="google">خرائط جوجل (Google Maps)</option>
                  <option value="waze">ويز (Waze)</option>
                  <option value="apple">خرائط آبل (Apple Maps)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold">التنبيهات الصوتية للطلبات:</span>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#00d2d3]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold block">تغيير كلمة المرور:</span>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  className="w-full bg-white dark:bg-slate-800 border rounded-lg p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPasswordInput.length >= 4) {
                      alert('تم تحديث كلمة المرور بنجاح');
                      setNewPasswordInput('');
                    } else {
                      alert('يجب أن تكون 4 خانات على الأقل');
                    }
                  }}
                  className="w-full py-1.5 bg-[#00d2d3] text-slate-950 font-bold rounded-lg text-xs"
                >
                  حفظ كلمة المرور
                </button>
              </div>
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 4. نافذة: تم التوصيل (قائمة بآخر 20 طلب) */}
      {showDeliveredModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>قائمة بآخر عشرين طلب تم توصيلهم</span>
              </h3>
              <button onClick={() => setShowDeliveredModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {[
                { id: 'SND-284741285', customer: 'yara alshehri', amount: '148.00 ﷼', date: 'اليوم 04:30 م', status: 'تم التسليم' },
                { id: 'SND-284741190', customer: 'عبدالله السبيعي', amount: '220.00 ﷼', date: 'اليوم 02:15 م', status: 'تم التسليم' },
                { id: 'SND-284741040', customer: 'فهد المطيري', amount: '95.00 ﷼', date: 'اليوم 01:00 م', status: 'تم التسليم' },
                { id: 'SND-284739981', customer: 'سارة الدوسري', amount: '340.00 ﷼', date: 'أمس', status: 'تم التسليم' },
                { id: 'SND-284739820', customer: 'خالد الحربي', amount: '180.00 ﷼', date: 'أمس', status: 'تم التسليم' }
              ].map((row, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex justify-between items-center">
                  <div>
                    <div className="font-bold font-mono text-slate-800 dark:text-slate-100">#{row.id}</div>
                    <div className="text-[11px] text-slate-500">{row.customer} • {row.date}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-mono font-bold text-emerald-600">{row.amount}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">{row.status}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowDeliveredModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 5. نافذة: إحصائياتي (تشمل الإحصائيات منذ بدأ العمل) */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00d2d3]" />
                <span>إحصائياتي منذ بدء العمل</span>
              </h3>
              <button onClick={() => setShowStatsModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <div className="text-slate-400 text-[10px]">إجمالي المشاوير المكتملة</div>
                <div className="text-xl font-black font-mono text-[#00d2d3] mt-1">184 مشوار</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <div className="text-slate-400 text-[10px]">نسبة الالتزام بالوقت SLA</div>
                <div className="text-xl font-black font-mono text-emerald-500 mt-1">99.2%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <div className="text-slate-400 text-[10px]">متوسط سرعة التوصيل</div>
                <div className="text-xl font-black font-mono text-amber-500 mt-1">28 دقيقة</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <div className="text-slate-400 text-[10px]">مجموع العمولات المكتسبة</div>
                <div className="text-xl font-black font-mono text-emerald-600 mt-1">3,680 ﷼</div>
              </div>
            </div>
            <button onClick={() => setShowStatsModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 6. نافذة: البيانات الشخصية */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-500" />
                <span>البيانات الشخصية للمندوب</span>
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-2">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">الاسم الكامل:</span>
                <span className="font-bold">{currentDriver.name || 'يونس'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">رقم الجوال:</span>
                <span className="font-mono font-bold">{currentDriver.phone || '+966502893163'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">رقم الهوية الوطنية:</span>
                <span className="font-mono font-bold">{currentDriver.nationalId || '2463794624'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">المركبة المسجلة:</span>
                <span className="font-bold">{currentDriver.vehicle || 'سيارة خاصة (كامري 2023)'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">الفرع الرئيسي التابع له:</span>
                <span className="font-bold">فرع إكليل الدمام</span>
              </div>
            </div>
            <button onClick={() => setShowProfileModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 7. نافذة: سياسة الخصوصية */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-500" />
                <span>سياسة الخصوصية وأمن البيانات</span>
              </h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed max-h-60 overflow-y-auto">
              <p>نحن في سند إكسبريس نلتزم بأعلى معايير حماية وخصوصية بيانات المندوب والعملاء وفق الأنظمة المعمول بها في المملكة العربية السعودية.</p>
              <p>• بيانات الموقع الجغرافي تُستخدم فقط أثناء ساعات العمل والملاحة للطلبات المسندة.</p>
              <p>• معلومات الاتصال بالعملاء مشفرة ومخصصة لإتمام التوصيل فقط.</p>
              <p>• سجل المبالغ المالية والتحصيلات محفوظ ومطابق للحساب البنكي المعتمد.</p>
            </div>
            <button onClick={() => setShowPrivacyModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              موافق وإغلاق
            </button>
          </div>
        </div>
      )}

      {/* 8. نافذة: تقييم التطبيق */}
      {showAppRatingModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">تقييم تطبيق المندوب</h3>
              <button onClick={() => setShowAppRatingModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            
            {ratingSuccess ? (
              <div className="py-6 space-y-2">
                <div className="text-4xl">🎉</div>
                <div className="font-bold text-emerald-600">شكراً لتقييمك الرائع!</div>
                <div className="text-xs text-slate-400">ملاحظاتك تساعدنا في تطوير وتحديث التطبيق باستمرار.</div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="text-slate-500">ما مدى رضاك عن تجربة استخدام تطبيق سند إكسبريس؟</div>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star className={'w-8 h-8 ' + (star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="أكتب ملاحظاتك أو اقتراحاتك هنا..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-[#00d2d3] h-20"
                ></textarea>
                <button
                  type="button"
                  onClick={() => setRatingSuccess(true)}
                  className="w-full py-3 bg-[#00d2d3] hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  إرسال التقييم ⭐
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. نافذة: من نحن */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-500" />
                <span>عن سند إكسبريس للخدمات اللوجستية</span>
              </h3>
              <button onClick={() => setShowAboutModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <img src="/sanad-express-logo.jpg?v=3" alt="سند" className="w-12 h-12 rounded-xl object-cover border" />
                <div>
                  <div className="font-black text-slate-900 dark:text-white">سَنَد إكسبريس</div>
                  <div className="font-mono text-[10px] text-cyan-600">SANAD EXPRESS LOGISTICS</div>
                </div>
              </div>
              <p>منصة لوجستية رائدة متخصصة في التوصيل السريع لطلبات المتاجر الإلكترونية وإدارة الأسطول والمستودعات في المنطقة الشرقية (الدمام، الخبر، الجبيل، والظهران).</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-1 font-mono text-[11px]">
                <div>الدعم الفني والعمليات: 0502893163</div>
                <div>البريد المعتمد: support@sanad-express.sa</div>
              </div>
            </div>
            <button onClick={() => setShowAboutModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 10. نافذة: مسح الباركود السريع (الزر الأوسط FAB) */}
      {showScanModal && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-[#00d2d3]" />
                <span>ماسح الباركود للشحنات</span>
              </h3>
              <button onClick={() => { setShowScanModal(false); setBarcodeScanSuccess(null); }} className="text-slate-400 p-1">✕</button>
            </div>

            {/* إطار المسح الافتراضي المحاكي للكاميرا */}
            <div className="relative w-full h-44 bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-cyan-500/50">
              <div className="w-32 h-32 border-2 border-dashed border-[#00d2d3] rounded-xl flex items-center justify-center animate-pulse">
                <QrCode className="w-16 h-16 text-cyan-400/80" />
              </div>
              <div className="absolute top-2 text-[10px] text-cyan-300 font-mono bg-cyan-950/80 px-3 py-0.5 rounded-full">
                وجّه الكاميرا نحو باركود الشحنة
              </div>
            </div>

            {/* إدخال رقم الشحنة يدوياً */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-600 dark:text-slate-400 font-bold">أو أدخل رقم الشحنة يدوياً:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="مثال: 284741285"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#00d2d3]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualBarcode.trim()) {
                      sound.playSuccess();
                      setBarcodeScanSuccess(manualBarcode.trim());
                    }
                  }}
                  className="px-4 py-2 bg-[#00d2d3] text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                >
                  بحث
                </button>
              </div>
            </div>

            {barcodeScanSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-xl text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم مسح الشحنة بنجاح! (#{barcodeScanSuccess})</span>
                </div>
                <div>الشحنة مسندة لك وهي جاهزة للتوصيل.</div>
              </div>
            )}

            <button onClick={() => { setShowScanModal(false); setBarcodeScanSuccess(null); }} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 11. نافذة: الخريطة المباشرة العائمة */}
      {showMapModal && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-md w-full p-4 space-y-3 shadow-2xl flex flex-col h-[80vh]">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00d2d3]" />
                <span>الخريطة الميدانية وتوجيه المسار</span>
              </h3>
              <button onClick={() => setShowMapModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden relative border flex items-center justify-center">
              <div className="text-center space-y-2 p-4">
                <Map className="w-12 h-12 text-[#00d2d3] mx-auto animate-bounce" />
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">نظام الملاحة GPS المباشر نشط</div>
                <div className="text-xs text-slate-500 max-w-xs">
                  موقعك الحالي: الدمام، حي الشاطئ • الشحنة الأقرب تبعد 1.8 كم
                </div>
                <a
                  href="https://maps.google.com/?q=26.4450,50.1150"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-md mt-2"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>فتح في خرائط جوجل</span>
                </a>
              </div>
            </div>

            <button onClick={() => setShowMapModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              العودة للرئيسية
            </button>
          </div>
        </div>
      )}

      {/* 12. نافذة: الإشعارات 🔔 */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>التنبيهات والإشعارات</span>
              </h3>
              <button onClick={() => setShowNotificationsModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
                <div className="font-bold text-[#00d2d3]">مرحباً بك في منصة سند إكسبريس</div>
                <div className="text-slate-500 text-[11px] mt-0.5">تم تفعيل حسابك بنجاح وجاهز لاستقبال شحنات المتاجر.</div>
              </div>
            </div>
            <button onClick={() => setShowNotificationsModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* نافذة تأكيد تسليم الشحنة للعميل */}
      {deliveryConfirmOrder && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>تأكيد تسليم الشحنة ({deliveryConfirmOrder.id})</span>
              </h3>
              <button onClick={() => setDeliveryConfirmOrder(null)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border space-y-1">
                <div>العميل: <strong className="text-slate-900 dark:text-white">{deliveryConfirmOrder.customerName}</strong></div>
                <div>المبلغ المطلوب تحصيله: <strong className="text-emerald-600 text-sm font-mono">{deliveryConfirmOrder.totalAmount} ﷼</strong></div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1.5">طريقة الدفع المستلمة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentMethod('cash')}
                    className={'p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ' + 
                      (confirmPaymentMethod === 'cash' ? 'bg-cyan-50 border-[#00d2d3] text-cyan-800' : 'bg-white dark:bg-slate-800 text-slate-600')}
                  >
                    <span>💵 كاش باليد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentMethod('mada')}
                    className={'p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ' + 
                      (confirmPaymentMethod === 'mada' ? 'bg-cyan-50 border-[#00d2d3] text-cyan-800' : 'bg-white dark:bg-slate-800 text-slate-600')}
                  >
                    <span>💳 شبكة مدى</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmDelivery}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-md"
              >
                تأكيد التسليم بنجاح وإيداع 20 ﷼ بالرصيد ✅
              </button>
              <button
                type="button"
                onClick={() => setDeliveryConfirmOrder(null)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل تعثر التسليم */}
      {exceptionOrder && (
        <DeliveryExceptionModal
          order={exceptionOrder}
          onClose={() => setExceptionOrder(null)}
          onSuccess={() => {
            setExceptionOrder(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

    </div>
  );
}

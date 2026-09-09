import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, MessageSquare, MapPin, Navigation, CheckCircle2, Package,
  Clock, ShieldCheck, Power, Play, RotateCcw, Smartphone, ExternalLink,
  AlertTriangle, DollarSign, Wallet, User, ChevronRight, Check, Compass,
  Layers, LogOut, ArrowRight, Sparkles, Radio, Download, Store,
  AlertCircle, ArrowUpRight, Box, CheckCircle, RefreshCw, X,
  Lock, Key, Eye, EyeOff, ShieldAlert, LogIn, Shield
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
  // حالة تسجيل الدخول: هل المندوب مسجل دخوله حالياً؟
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem('sanad_driver_auth');
    } catch {
      return false;
    }
  });

  // حقول شاشة تسجيل الدخول السرية
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // نافذة تغيير كلمة المرور للمندوب لضمان الخصوصية التامة
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState('');

  // التبويب الرئيسي للجوال: orders (الطلبات), map (الملاحة), wallet (المحفظة), profile (حسابي)
  const [mobileTab, setMobileTab] = useState('orders');

  // التبويب الفرعي لشاشة الطلبات: 'new' (جديد), 'in_transit' (جاري التوصيل), 'returned' (مسترجع)
  const [ordersSubTab, setOrdersSubTab] = useState('new');

  const [gpsActive, setGpsActive] = useState(false);
  const [simulatingTrip, setSimulatingTrip] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [exceptionOrder, setExceptionOrder] = useState(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null);
  const [confirmPaymentMethod, setConfirmPaymentMethod] = useState('cash');
  const [toastMessage, setToastMessage] = useState(null);

  const watchIdRef = useRef(null);

  // إشعار عائم مؤقت
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // المندوب المسجل دخوله حالياً (بسرية وخصوصية تامة)
  const savedAuth = (() => {
    try {
      const item = localStorage.getItem('sanad_driver_auth');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const activeDriverId = savedAuth?.id || currentDriverId || 'drv-1';

  const currentDriver = drivers.find(d => 
    d.id === activeDriverId || 
    d.id === activeDriverId?.replace('drv-10', 'drv-') ||
    ('drv-10' + d.id?.replace('drv-', '')) === activeDriverId
  ) || drivers[0] || {
    id: 'drv-1',
    code: 'DRV-01',
    name: 'يونس',
    phone: '+966502893163',
    username: '+966502893163',
    password: '••••••',
    online: true,
    cashOnHand: 327.74,
    vehicle: 'سيارة خاصة (كامري 2023)'
  };

  const isOnline = currentDriver.online !== false;

  // شحنات هذا المندوب تحديداً (خصوصية تامة - لا تظهر شحنات المندوب الآخر)
  const driverMatchId = (assignedId) => {
    if (!assignedId) return false;
    return assignedId === currentDriver.id ||
           assignedId === currentDriver.id?.replace('drv-10', 'drv-') ||
           ('drv-10' + assignedId?.replace('drv-', '')) === currentDriver.id;
  };

  const myOrders = orders.filter(o => driverMatchId(o.assignedDriverId));

  // 1. الطلبات الجديدة المسندة للمندوب بانتظار الاستلام
  const newOrders = myOrders.filter(o => ['assigned', 'ready_for_pickup'].includes(o.status));

  // 2. الطلبات قيد التوصيل حالياً بالميدان
  const inTransitOrders = myOrders.filter(o => ['in_transit', 'picked_up'].includes(o.status));

  // 3. الطلبات المسترجعة من العملاء
  const returnedOrders = myOrders.filter(o => 
    ['returned', 'return_requested', 'return_picked_up', 'returned_to_branch'].includes(o.status) ||
    (o.status === 'exception' && o.exceptionAction === 'return_to_hub')
  );

  // 4. الطلبات المسلمة بنجاح
  const deliveredOrders = myOrders.filter(o => o.status === 'delivered');

  // الشحنة النشطة المباشرة في الملاحة (أول شحنة قيد التوصيل)
  const activeOrder = inTransitOrders[0] || null;

  // إجراء تسجيل الدخول الفعلي للمندوب
  const handleDriverLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    if (!loginPhone.trim() || !loginPassword.trim()) {
      setLoginError('يرجى إدخال اسم المستخدم (رقم الجوال) وكلمة المرور');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.driver) {
        sound.playSuccess();
        localStorage.setItem('sanad_driver_auth', JSON.stringify(data.driver));
        localStorage.setItem('sanad_driver_id', data.driver.id);
        if (onChangeDriver) onChangeDriver(data.driver.id);
        setIsLoggedIn(true);
        showToast(`🎉 مرحباً بك يا ${data.driver.name}! تم تسجيل الدخول بنجاح.`);
      } else {
        sound.playCancel();
        setLoginError(data.error || 'اسم المستخدم (رقم الجوال) أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى');
    } finally {
      setLoginLoading(false);
    }
  };

  // تسجيل الخروج التام
  const handleLogout = () => {
    if (window.confirm('هل تريد تسجيل الخروج؟ ستحتاج لإدخال كلمة مرورك للدخول مرة أخرى لضمان الخصوصية.')) {
      localStorage.removeItem('sanad_driver_auth');
      localStorage.removeItem('sanad_driver_id');
      setIsLoggedIn(false);
      setLoginPhone('');
      setLoginPassword('');
      showToast('تم تسجيل الخروج بنجاح.');
    }
  };

  // تغيير كلمة المرور من قبل المندوب نفسه
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePassError('');
    if (!currentPasswordInput || !newPasswordInput) {
      setChangePassError('يرجى تعبئة كلمة المرور الحالية والجديدة');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePassError('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }
    if (newPasswordInput.length < 4) {
      setChangePassError('كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل');
      return;
    }

    setChangePassLoading(true);
    try {
      const res = await fetch('/api/driver/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: currentDriver.id,
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        alert('🎉 ' + data.message);
        setShowChangePasswordModal(false);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        if (onRefresh) onRefresh();
      } else {
        sound.playCancel();
        setChangePassError(data.error || 'فشل تغيير كلمة المرور');
      }
    } catch (err) {
      setChangePassError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setChangePassLoading(false);
    }
  };

  // تشغيل وإيقاف الـ GPS الحقيقي للجوال
  const toggleRealGps = () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم نظام تحديد المواقع GPS');
      return;
    }

    if (gpsActive) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setGpsActive(false);
      return;
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsActive(true);
          const coords = [pos.coords.latitude, pos.coords.longitude];
          const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 25;
          const heading = pos.coords.heading || 0;
          if (onUpdateDriverLocation) {
            onUpdateDriverLocation(currentDriver.id, coords, speed, heading);
          }
        },
        (err) => {
          console.warn('GPS error:', err);
          alert('يرجى تفعيل صلاحية الموقع الجغرافي (GPS) في جوالك لتتبع موقعك الميداني.');
          setGpsActive(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
      watchIdRef.current = id;
    } catch (e) {
      console.error(e);
    }
  };

  // 1. إجراء استلام الطلب من الجديد -> يتحول إلى جاري التوصيل
  const handlePickupOrder = async (order) => {
    sound.playOrderAssigned();
    if (onUpdateOrderStatus) {
      await onUpdateOrderStatus(order.id, 'in_transit');
    }
    showToast(`🚀 تم استلام الشحنة ${order.id} بنجاح! انتقلت إلى قائمة جاري التوصيل.`);
    setOrdersSubTab('in_transit');
  };

  // 2. إجراء تأكيد تسليم الشحنة للعميل -> يتحول إلى تم التسليم
  const handleConfirmDelivery = async () => {
    if (!deliveryConfirmOrder) return;
    sound.playSuccess();
    if (onUpdateOrderStatus) {
      await onUpdateOrderStatus(deliveryConfirmOrder.id, 'delivered', confirmPaymentMethod);
    }
    showToast(`🎉 تم تأكيد تسليم الشحنة ${deliveryConfirmOrder.id} بنجاح وإضافة ${deliveryConfirmOrder.driverCommission || 20} ﷼ لمحفظتك!`);
    setDeliveryConfirmOrder(null);
  };

  // 3. إجراء استلام المرتجع من العميل
  const handlePickupReturnFromCustomer = async (order) => {
    sound.playClick();
    if (onUpdateOrderStatus) {
      await onUpdateOrderStatus(order.id, 'returned', null, { returnStatus: 'return_picked_up' });
    }
    showToast(`📦 تم توثيق استلام المرتجع ${order.id} من العميل. يرجى التوجه لفرع المتجر لتسليمه.`);
  };

  // 4. إجراء تسليم المرتجع لمستودع/فرع المتجر
  const handleHandoverReturnToBranch = async (order) => {
    sound.playSuccess();
    if (onUpdateOrderStatus) {
      await onUpdateOrderStatus(order.id, 'returned', null, { returnStatus: 'returned_to_branch' });
    }
    showToast(`🏢 تم تسليم المرتجع ${order.id} لمستودع المتجر بنجاح وتمت التسوية!`);
  };

  const trackingId = activeOrder ? (activeOrder.id.startsWith('SND-') ? activeOrder.id : 'SND-' + (activeOrder.id.replace(/\D/g, '') || '282288')) : '';

  // =========================================================================
  // شاشة تسجيل دخول المندوب الميداني (خصوصية تامة - لا تظهر أي حسابات أخرى)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto min-h-[90vh] flex flex-col justify-center px-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-100" dir="rtl">
        <div className="bg-[#0f1523] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          {/* زخرفة ناعمة بالخلفية */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* ترويسة تسجيل الدخول */}
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <img
                src="/sanad-express-logo.jpg?v=3"
                alt="سند إكسبريس"
                className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,210,211,0.5)]"
              />
              <span className="absolute -bottom-1 -right-1 bg-cyan-400 w-4 h-4 rounded-full border-2 border-[#0f1523]"></span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">سَنَد إكسبريس | SANAD EXPRESS</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-[#00d2d3] text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>تسجيل الدخول الآمن للمندوب الميداني</span>
            </div>
            <p className="text-xs text-slate-400">حسابك محمي بخصوصية تامة ولا يمكن لأي شخص الدخول إلا بكلمة المرور الخاصة بك.</p>
          </div>

          {/* تنبيه الخطأ إن وجد */}
          {loginError && (
            <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-200 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* نموذج تسجيل الدخول السري */}
          <form onSubmit={handleDriverLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>اسم المستخدم (رقم الجوال) *:</span>
                <span className="text-[10px] text-cyan-400">رقم جوالك المسجل بالنظام</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="مثال: 0502893163"
                  className="w-full bg-[#090d16] border border-cyan-900/60 rounded-xl p-3 pr-10 pl-3 text-white font-mono font-bold outline-none focus:border-[#00d2d3] shadow-inner"
                />
                <Phone className="w-4 h-4 text-[#00d2d3] absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>كلمة المرور السرية *:</span>
                <span className="text-[10px] text-slate-400 font-normal">كلمة المرور الخاصة بك</span>
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور السرية"
                  className="w-full bg-[#090d16] border border-cyan-900/60 rounded-xl p-3 pr-10 pl-10 text-white font-mono font-bold outline-none focus:border-[#00d2d3] shadow-inner"
                />
                <Lock className="w-4 h-4 text-[#00d2d3] absolute right-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-[#00d2d3] hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,211,0.4)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول إلى حسابي 🚀'}</span>
            </button>
          </form>

          {/* تنبيه أمان وخصوصية */}
          <div className="p-3 bg-[#090d16] border border-cyan-950 rounded-2xl text-[11px] text-slate-400 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نظام حماية وخصوصية المندوب</span>
            </div>
            <div>بياناتك وطلباتك ومحفظتك سرية ومحمية بكلمة المرور الخاصة بك فقط. في حال نسيت كلمة المرور، يرجى التواصل مع إدارة المتجر لإعادة تعيينها.</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // الشاشة الرئيسية للمندوب بعد تسجيل الدخول (مع الخصوصية التامة)
  // =========================================================================
  return (
    <div className="w-full max-w-md mx-auto min-h-[92vh] flex flex-col font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-100 select-none pb-24" dir="rtl">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-[9999] max-w-md mx-auto bg-gradient-to-r from-cyan-900 to-slate-900 border-2 border-cyan-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-[#00d2d3] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. ترويسة هوية المندوب ومعرفه بالحساب (بدون أي تبديل لحسابات أخرى) */}
      <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-4 shadow-2xl mb-3 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-[#00d2d3] flex items-center justify-center text-slate-950 font-black text-lg shadow-[0_0_15px_rgba(0,210,211,0.4)]">
                {currentDriver.name ? currentDriver.name.charAt(0) : 'س'}
              </div>
              <span className={'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f1523] ' + (isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500')}></span>
            </div>

            <div>
              {/* معرف المندوب المميز */}
              <div className="flex items-center gap-2">
                <span className="bg-cyan-950 text-[#00d2d3] border border-cyan-700/60 text-[10px] font-mono font-black px-2 py-0.5 rounded-md tracking-wider shadow-sm">
                  {currentDriver.code || ('DRV-0' + (currentDriver.id?.replace(/\D/g, '') || '1'))}
                </span>
                <span className="font-black text-sm text-white">{currentDriver.name}</span>
              </div>
              
              <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                <span className="text-[#00d2d3] font-bold">{currentDriver.vehicle || 'سيارة توصيل'}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">⭐ {currentDriver.rating || 5.0}</span>
              </div>
            </div>
          </div>

          {/* أزرار الاتصال وتسجيل الخروج الآمن */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleDriverStatus && onToggleDriverStatus(currentDriver.id)}
              className={'flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-md cursor-pointer ' + (isOnline ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-emerald-950/50' : 'bg-red-950/80 text-red-300 border border-red-700/60')}
            >
              <Power className="w-3 h-3" />
              <span>{isOnline ? 'متصل' : 'أوفلاين'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 transition-colors cursor-pointer"
              title="تسجيل الخروج الآمن"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* شريط معلومات سريعة: كاش العهدة، جاري التوصيل، عمولات اليوم */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-900/30 text-center text-xs font-mono">
          <div className="bg-[#090d16] p-2 rounded-xl border border-cyan-900/30">
            <div className="text-[10px] text-slate-400 font-sans">كاش العهدة:</div>
            <div className="font-bold text-[#00d2d3] text-sm mt-0.5">
              {(currentDriver.cashOnHand || currentDriver.walletBalance || 0).toFixed(2)} ﷼
            </div>
          </div>
          <div className="bg-[#090d16] p-2 rounded-xl border border-cyan-900/30">
            <div className="text-[10px] text-slate-400 font-sans">قيد التوصيل:</div>
            <div className="font-bold text-amber-400 text-sm mt-0.5">
              {inTransitOrders.length}
            </div>
          </div>
          <div className="bg-[#090d16] p-2 rounded-xl border border-cyan-900/30">
            <div className="text-[10px] text-slate-400 font-sans">أرباح اليوم:</div>
            <div className="font-bold text-emerald-400 text-sm mt-0.5">
              {deliveredOrders.length * 20} ﷼
            </div>
          </div>
        </div>
      </div>

      {/* 2. محتوى شاشة الطلبات الرئيسية مع التبويبات الثلاثة المطلوبة */}
      {mobileTab === 'orders' && (
        <div className="flex-1 space-y-3">
          
          {/* شريط التبويبات الثلاثة الرئيسية: جديد + جاري التوصيل + مسترجع */}
          <div className="bg-[#0f1523] p-1.5 rounded-2xl border border-cyan-900/50 grid grid-cols-3 gap-1.5 shadow-xl">
            {/* تبويب 1: جديد */}
            <button
              type="button"
              onClick={() => { setOrdersSubTab('new'); sound.playClick(); }}
              className={'py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ' + 
                (ordersSubTab === 'new' 
                  ? 'bg-[#00d2d3] text-slate-950 shadow-[0_0_12px_rgba(0,210,211,0.4)] font-black' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900')}
            >
              <Package className="w-3.5 h-3.5" />
              <span>جديد</span>
              <span className={'text-[10px] px-1.5 py-0.2 rounded-full font-mono ' + 
                (ordersSubTab === 'new' ? 'bg-slate-950 text-[#00d2d3]' : 'bg-cyan-950 text-cyan-300 border border-cyan-800')}>
                {newOrders.length}
              </span>
            </button>

            {/* تبويب 2: جاري التوصيل */}
            <button
              type="button"
              onClick={() => { setOrdersSubTab('in_transit'); sound.playClick(); }}
              className={'py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ' + 
                (ordersSubTab === 'in_transit' 
                  ? 'bg-[#00d2d3] text-slate-950 shadow-[0_0_12px_rgba(0,210,211,0.4)] font-black' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900')}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>جاري التوصيل</span>
              <span className={'text-[10px] px-1.5 py-0.2 rounded-full font-mono ' + 
                (ordersSubTab === 'in_transit' ? 'bg-slate-950 text-[#00d2d3]' : 'bg-amber-950 text-amber-300 border border-amber-800')}>
                {inTransitOrders.length}
              </span>
            </button>

            {/* تبويب 3: مسترجع */}
            <button
              type="button"
              onClick={() => { setOrdersSubTab('returned'); sound.playClick(); }}
              className={'py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ' + 
                (ordersSubTab === 'returned' 
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] font-black' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مسترجع</span>
              {returnedOrders.length > 0 && (
                <span className={'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ' + 
                  (ordersSubTab === 'returned' ? 'bg-slate-950 text-red-400' : 'bg-red-950 text-red-300 border border-red-800 animate-pulse')}>
                  {returnedOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* أ) محتوى تبويب: 1. جديد */}
          {ordersSubTab === 'new' && (
            <div className="space-y-3">
              {newOrders.length === 0 ? (
                <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-8 text-center space-y-3 shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-[#00d2d3] mx-auto text-3xl shadow-inner">
                    📦
                  </div>
                  <h3 className="text-base font-bold text-white">لا توجد طلبات جديدة حالياً</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    أنت جاهز بالميدان، وبمجرد إسناد أي شحنة جديدة لك من لوحة الإدارة ستظهر هنا فوراً للإستلام وبدء التوصيل.
                  </p>
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-900/60 rounded-xl text-xs font-bold text-[#00d2d3] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تحديث الطلبات</span>
                  </button>
                </div>
              ) : (
                newOrders.map(order => (
                  <div key={order.id} className="bg-[#0f1523] border-2 border-cyan-500/40 rounded-3xl p-4 shadow-xl space-y-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-cyan-950 text-[#00d2d3] border border-cyan-800 font-mono font-bold text-xs">
                          {order.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-bold">
                          طلب جديد بانتظار الاستلام 🆕
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-lg">
                        +20 ﷼ عمولة
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-[#00d2d3]" />
                        <span>الفرع المستلم منه: <strong className="text-slate-200">{order.branchId ? (branches.find(b => b.id === order.branchId)?.name || 'فرع إكليل الدمام') : 'فرع إكليل الدمام'}</strong></span>
                      </div>
                      <h4 className="text-base font-black text-white">{order.customerName}</h4>
                      <p className="text-xs text-slate-300 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#00d2d3] shrink-0 mt-0.5" />
                        <span>{order.customerAddress || 'الدمام - الشرقية'}</span>
                      </p>
                    </div>

                    <div className="bg-[#090d16] p-3 rounded-2xl border border-cyan-900/40 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-slate-400 font-sans">طريقة التحصيل: </span>
                        <strong className="text-white font-bold">{order.paymentMethod === 'cash' ? '💵 كاش عند الاستلام' : '💳 مدى / شبكة'}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-sans">المبلغ: </span>
                        <strong className="text-base font-black text-[#00d2d3]">{order.totalAmount} ﷼</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePickupOrder(order)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-[#00d2d3] hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,211,0.4)] active:scale-95 transition-all cursor-pointer"
                    >
                      <Package className="w-5 h-5" />
                      <span>استلام الطلب وبدء التوصيل 🚀</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ب) محتوى تبويب: 2. جاري التوصيل */}
          {ordersSubTab === 'in_transit' && (
            <div className="space-y-3">
              {inTransitOrders.length === 0 ? (
                <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-8 text-center space-y-3 shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400 mx-auto text-3xl shadow-inner">
                    🚚
                  </div>
                  <h3 className="text-base font-bold text-white">لا توجد طلبات قيد التوصيل الآن</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    توجه إلى تبويب <strong>"جديد"</strong> واضغط على زر <strong>"استلام الطلب"</strong> لبدء المشوار.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOrdersSubTab('new')}
                    className="mt-2 px-4 py-2 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>عرض الطلبات الجديدة ({newOrders.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                inTransitOrders.map(order => (
                  <div key={order.id} className="bg-[#0f1523] border-2 border-cyan-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-cyan-950 text-[#00d2d3] border border-cyan-800 font-mono font-bold text-xs">
                        {order.id}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px] font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        <span>قيد التوصيل للعميل ⚡</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">{order.customerName}</h3>
                      <p className="text-xs text-slate-300 mt-1 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-[#00d2d3] shrink-0 mt-0.5" />
                        <span>{order.customerAddress || 'الدمام - الشرقية'}</span>
                      </p>
                    </div>

                    <div className="bg-[#090d16] p-3 rounded-2xl border border-cyan-900/40 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-slate-400 font-sans">التحصيل المطلوب: </span>
                        <strong className="text-white font-bold">{order.paymentMethod === 'cash' ? '💵 كاش عند الاستلام' : '💳 مدى / شبكة'}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-sans">المبلغ: </span>
                        <strong className="text-lg font-black text-[#00d2d3]">{order.totalAmount} ﷼</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={'tel:' + order.customerPhone}
                        className="py-3 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
                      >
                        <Phone className="w-5 h-5 text-emerald-400" />
                        <span>اتصال</span>
                      </a>

                      <a
                        href={'https://wa.me/966' + (order.customerPhone || '').replace(/\D/g, '').replace(/^966/, '').replace(/^0/, '') + '?text=' + encodeURIComponent('مرحباً يا غالي، أنا مندوبك من سند إكسبريس ومعي شحنتك رقم ' + order.id + '، هل الموقع مناسب للتسليم؟')}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 px-2 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
                      >
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        <span>واتساب</span>
                      </a>

                      <a
                        href={order.customerCoords ? 'https://www.google.com/maps/dir/?api=1&destination=' + order.customerCoords[0] + ',' + order.customerCoords[1] : 'https://maps.google.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 px-2 rounded-2xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-[#00d2d3] font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
                      >
                        <Navigation className="w-5 h-5 text-[#00d2d3]" />
                        <span>خرائط Google</span>
                      </a>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-cyan-900/30">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryConfirmOrder(order);
                          setConfirmPaymentMethod(order.paymentMethod || 'cash');
                        }}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-transform cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>تم تسليم الشحنة للعميل بنجاح ✅</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExceptionOrder(order)}
                        className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>تسجيل تعثر / إرجاع الشحنة ⚠️</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ج) محتوى تبويب: 3. مسترجع */}
          {ordersSubTab === 'returned' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-red-950/80 via-amber-950/60 to-slate-900 border-2 border-red-600/60 rounded-3xl p-4 shadow-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-red-300 font-black text-sm">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                  <span>تنبيه المرتجعات الميدانية للعملاء</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تنزل الطلبات المسترجعة من العملاء مباشرة في هذا القسم لكي تعرف أن لديك شحنة تحتاج استرجاعاً وتوجهاً للعميل لاستلامها وإعادتها للمتجر.
                </p>
              </div>

              {returnedOrders.length === 0 ? (
                <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-8 text-center space-y-3 shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mx-auto text-3xl shadow-inner">
                    ✨
                  </div>
                  <h3 className="text-base font-bold text-white">لا توجد طلبات مسترجعة مسندة لك</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    جميع الشحنات في مسارها الطبيعي ولا توجد أي مرتجعات معلقة تتطلب استلاماً من العملاء.
                  </p>
                </div>
              ) : (
                returnedOrders.map(order => {
                  const isPickedUpFromCustomer = order.returnStatus === 'return_picked_up';
                  const isReturnedToBranch = order.returnStatus === 'returned_to_branch' || order.status === 'returned_to_branch';

                  return (
                    <div key={order.id} className="bg-[#0f1523] border-2 border-red-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-800 font-mono font-bold text-xs">
                          {order.id}
                        </span>
                        <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-bold border ' + 
                          (isReturnedToBranch 
                            ? 'bg-slate-900 text-slate-300 border-slate-700' 
                            : isPickedUpFromCustomer 
                              ? 'bg-blue-950 text-blue-300 border-blue-800' 
                              : 'bg-red-950 text-red-300 border-red-700 animate-pulse')}>
                          {isReturnedToBranch ? 'تم تسليمه للمستودع 🏢' : isPickedUpFromCustomer ? 'المرتجع معك بالسيارة 🚗' : 'مطلوب استرجاع من عميل ⚠️'}
                        </span>
                      </div>

                      <div className="bg-red-950/40 border border-red-800/50 p-3 rounded-2xl space-y-1">
                        <div className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                          <span>سبب الاسترجاع من العميل:</span>
                        </div>
                        <p className="text-xs text-white font-medium">
                          {order.returnReason || order.exceptionReason || order.notes || 'طلب العميل استبدال أو استرجاع الشحنة'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-white">{order.customerName}</h4>
                        <p className="text-xs text-slate-300 mt-1 flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>عنوان الاستلام: {order.customerAddress || 'الدمام - الشرقية'}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={'tel:' + order.customerPhone}
                          className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-xs flex flex-col items-center justify-center gap-1"
                        >
                          <Phone className="w-4 h-4 text-emerald-400" />
                          <span>اتصال</span>
                        </a>

                        <a
                          href={'https://wa.me/966' + (order.customerPhone || '').replace(/\D/g, '').replace(/^966/, '').replace(/^0/, '') + '?text=' + encodeURIComponent('مرحباً يا غالي، بخصوص طلب الاسترجاع للشحنة رقم ' + order.id + '، أنا مندوب سند إكسبريس وفي طريقي لاستلام السلعة منك.')}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-bold text-xs flex flex-col items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>واتساب</span>
                        </a>

                        <a
                          href={order.customerCoords ? 'https://www.google.com/maps/dir/?api=1&destination=' + order.customerCoords[0] + ',' + order.customerCoords[1] : 'https://maps.google.com'}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-[#00d2d3] font-bold text-xs flex flex-col items-center justify-center gap-1"
                        >
                          <Navigation className="w-4 h-4 text-[#00d2d3]" />
                          <span>موقع العميل</span>
                        </a>
                      </div>

                      <div className="pt-2 border-t border-cyan-900/30 space-y-2">
                        {!isPickedUpFromCustomer && !isReturnedToBranch ? (
                          <button
                            type="button"
                            onClick={() => handlePickupReturnFromCustomer(order)}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-transform cursor-pointer"
                          >
                            <Box className="w-4 h-4" />
                            <span>تم استلام المرتجع من العميل باليد 📦</span>
                          </button>
                        ) : !isReturnedToBranch ? (
                          <button
                            type="button"
                            onClick={() => handleHandoverReturnToBranch(order)}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-[#00d2d3] hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,211,0.4)] active:scale-95 transition-transform cursor-pointer"
                          >
                            <Store className="w-4 h-4" />
                            <span>تسليم المرتجع لمستودع / فرع المتجر 🏢</span>
                          </button>
                        ) : (
                          <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>تم تسليم هذا المرتجع لفرع المتجر واكتمال الإجراء ✅</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* سجل الشحنات المنجزة اليوم */}
          <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-4 shadow-xl space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs font-bold border-b border-cyan-900/30 pb-2">
              <span className="text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>شحناتك المسلمة بنجاح اليوم ({deliveredOrders.length})</span>
              </span>
              <span className="text-[#00d2d3] font-mono font-bold">
                +{deliveredOrders.length * 20} ﷼ عمولات
              </span>
            </div>

            {deliveredOrders.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 font-semibold">
                لم تقم بتسليم شحنات حتى الآن اليوم
              </div>
            ) : (
              <div className="space-y-2">
                {deliveredOrders.slice(0, 5).map(o => (
                  <div key={o.id} className="p-2.5 rounded-xl bg-[#090d16] border border-cyan-900/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{o.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.id} • {o.paymentMethod === 'cash' ? 'كاش' : 'مدى'}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-emerald-400 font-bold">{o.totalAmount} ﷼</div>
                      <div className="text-[10px] text-slate-400">عمولة: 20 ﷼</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. تبويب الملاحة والخريطة */}
      {mobileTab === 'map' && (
        <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#00d2d3]" />
              <span>رادار الملاحة وتتبع موقعك الميداني</span>
            </h3>
            <button
              type="button"
              onClick={toggleRealGps}
              className={'px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ' + (gpsActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-300 border border-slate-700')}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{gpsActive ? 'GPS متصل' : 'تشغيل GPS'}</span>
            </button>
          </div>

          <div className="bg-[#090d16] rounded-2xl p-4 border border-cyan-900/30 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">المركبة المسجلة:</span>
              <span className="font-bold text-white">{currentDriver.vehicle || 'سيارة توصيل'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">نطاق التغطية:</span>
              <span className="font-bold text-[#00d2d3]">الدمام، الخبر، الجبيل</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">سرعة المركبة الحالية:</span>
              <span className="font-mono font-bold text-emerald-400">{currentDriver.speed || 0} كم/س</span>
            </div>
          </div>

          {activeOrder && activeOrder.customerCoords && (
            <a
              href={'https://www.google.com/maps/dir/?api=1&destination=' + activeOrder.customerCoords[0] + ',' + activeOrder.customerCoords[1]}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,211,0.4)]"
            >
              <Navigation className="w-4 h-4" />
              <span>فتح التوجيه المباشر في خرائط Google 🗺️</span>
            </a>
          )}
        </div>
      )}

      {/* 4. تبويب المحفظة */}
      {mobileTab === 'wallet' && (
        <div className="space-y-3">
          <DriverWallet driver={currentDriver} orders={orders} onRefresh={onRefresh} />
        </div>
      )}

      {/* 5. تبويب حسابي (مع الخصوصية التامة وإمكانية تغيير كلمة المرور) */}
      {mobileTab === 'profile' && (
        <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-cyan-900/30">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-[#00d2d3] flex items-center justify-center text-slate-950 font-black text-xl shadow-[0_0_15px_rgba(0,210,211,0.4)]">
              {currentDriver.name ? currentDriver.name.charAt(0) : 'س'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-cyan-950 text-[#00d2d3] border border-cyan-700/60 text-[10px] font-mono font-black px-2 py-0.5 rounded-md">
                  {currentDriver.code || ('DRV-0' + (currentDriver.id?.replace(/\D/g, '') || '1'))}
                </span>
                <h3 className="text-base font-black text-white">{currentDriver.name}</h3>
              </div>
              <p className="text-xs text-[#00d2d3] font-mono mt-1">{currentDriver.phone}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">الهوية / الإقامة: {currentDriver.nationalId || '2463794624'}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* بطاقة الخصوصية والأمان وحماية الحساب */}
            <div className="p-3.5 bg-gradient-to-r from-cyan-950/70 to-[#090d16] rounded-2xl border border-cyan-800/60 space-y-3">
              <div className="font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#00d2d3]">
                  <ShieldCheck className="w-4 h-4 text-[#00d2d3]" />
                  <span>أمان وخصوصية الحساب:</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">محمي بكلمة مرور 🔒</span>
              </div>
              
              <div className="flex justify-between items-center text-[11px] py-1 border-b border-cyan-900/30">
                <span className="text-slate-400">اسم المستخدم (رقم الجوال):</span>
                <span className="font-mono font-bold text-white">{currentDriver.phone}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="text-slate-400">كلمة المرور السرية:</span>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-3 py-1 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>تغيير كلمة المرور 🔑</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#090d16] rounded-xl border border-cyan-900/30 flex justify-between items-center">
              <span className="text-slate-400">معرف المندوب بالنظام:</span>
              <span className="font-mono font-bold text-[#00d2d3]">{currentDriver.code || currentDriver.id}</span>
            </div>
            <div className="p-3 bg-[#090d16] rounded-xl border border-cyan-900/30 flex justify-between items-center">
              <span className="text-slate-400">الفرع الرئيسي:</span>
              <span className="font-bold text-white">فرع إكليل الدمام</span>
            </div>
            <div className="p-3 bg-[#090d16] rounded-xl border border-cyan-900/30 flex justify-between items-center">
              <span className="text-slate-400">عمولة التوصيل لكل طلب:</span>
              <span className="font-mono font-bold text-emerald-400">20.00 ﷼</span>
            </div>
          </div>

          {/* زر تسجيل الخروج الكامل من الحساب */}
          <div className="pt-3 border-t border-cyan-900/30">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-950/70 hover:bg-red-900/80 border border-red-800 text-red-200 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج وقفل الحساب 🚪</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. شريط التنقل السفلي الثابت للموبايل */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-[#0a0e18]/95 backdrop-blur-lg border-t border-cyan-950/60 px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => { setMobileTab('orders'); sound.playClick(); }}
          className={'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ' + (mobileTab === 'orders' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">الطلبات</span>
        </button>

        <button
          type="button"
          onClick={() => { setMobileTab('map'); sound.playClick(); }}
          className={'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ' + (mobileTab === 'map' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">الملاحة</span>
        </button>

        <button
          type="button"
          onClick={() => { setMobileTab('wallet'); sound.playClick(); }}
          className={'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ' + (mobileTab === 'wallet' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">المحفظة</span>
        </button>

        <button
          type="button"
          onClick={() => { setMobileTab('profile'); sound.playClick(); }}
          className={'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ' + (mobileTab === 'profile' ? 'text-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200')}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">حسابي</span>
        </button>
      </div>

      {/* نافذة تأكيد تسليم الشحنة للعميل */}
      {deliveryConfirmOrder && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border-2 border-emerald-500/60 rounded-3xl max-w-sm w-full p-6 text-right space-y-4 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>تأكيد تسليم الشحنة ({deliveryConfirmOrder.id})</span>
              </h3>
              <button onClick={() => setDeliveryConfirmOrder(null)} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#090d16] rounded-2xl border border-cyan-900/30 space-y-1">
                <div className="text-slate-400">العميل: <strong className="text-white">{deliveryConfirmOrder.customerName}</strong></div>
                <div className="text-slate-400">المبلغ المطلوب: <strong className="text-[#00d2d3] text-sm font-mono">{deliveryConfirmOrder.totalAmount} ﷼</strong></div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">طريقة استلام المبلغ من العميل:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentMethod('cash')}
                    className={'p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ' + 
                      (confirmPaymentMethod === 'cash' ? 'bg-cyan-950 border-[#00d2d3] text-[#00d2d3]' : 'bg-slate-900 border-slate-800 text-slate-400')}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>💵 كاش باليد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentMethod('mada')}
                    className={'p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ' + 
                      (confirmPaymentMethod === 'mada' ? 'bg-cyan-950 border-[#00d2d3] text-[#00d2d3]' : 'bg-slate-900 border-slate-800 text-slate-400')}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>💳 شبكة مدى / حوالة</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelivery}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl text-xs cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                تأكيد التسليم بنجاح وإيداع 20 ﷼ بالرصيد ✅
              </button>
              <button
                type="button"
                onClick={() => setDeliveryConfirmOrder(null)}
                className="w-full py-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تغيير كلمة المرور لخصوصية المندوب التامة */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border-2 border-cyan-500/60 rounded-3xl max-w-sm w-full p-6 text-right space-y-4 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-[#00d2d3]" />
                <span>تغيير كلمة المرور السرية</span>
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
            </div>

            {changePassError && (
              <div className="p-2.5 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs font-bold">
                {changePassError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">كلمة المرور الحالية *:</label>
                <input
                  type="password"
                  required
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="w-full bg-[#090d16] border border-cyan-900/60 rounded-xl p-2.5 text-white font-mono outline-none focus:border-[#00d2d3]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">كلمة المرور الجديدة *:</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="w-full bg-[#090d16] border border-cyan-900/60 rounded-xl p-2.5 pr-3 pl-9 text-white font-mono outline-none focus:border-[#00d2d3]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute left-2.5 top-2.5 text-slate-400"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تأكيد كلمة المرور الجديدة *:</label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  className="w-full bg-[#090d16] border border-cyan-900/60 rounded-xl p-2.5 text-white font-mono outline-none focus:border-[#00d2d3]"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={changePassLoading}
                  className="w-full py-3 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md disabled:opacity-50"
                >
                  {changePassLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة 🔒'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="w-full py-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تسجيل تعثر التسليم */}
      {exceptionOrder && (
        <DeliveryExceptionModal
          order={exceptionOrder}
          onClose={() => setExceptionOrder(null)}
          onSuccess={() => {
            sound.playCancel();
            setExceptionOrder(null);
            showToast('⚠️ تم توثيق تعثر الشحنة ونقلها لقسم المرتجعات.');
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

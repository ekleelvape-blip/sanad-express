import DriverAuthGate from './DriverAuthGate';
import OrderScanModal from './OrderScanModal';
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Home, Store, Route, ScanLine, Package, User, Calendar, Wallet, Settings,
  CheckSquare, TrendingUp, Lock, Star, Info, LogOut, Bell, Sliders,
  MapPin, Map, Phone, MessageSquare, ExternalLink, Clock, ShieldCheck,
  CheckCircle2, X, ChevronLeft, ChevronRight, Search, RefreshCw, Box,
  DollarSign, Sparkles, Navigation, RotateCcw, AlertTriangle, Key,
  Eye, EyeOff, Camera, ArrowUpRight, QrCode, Shield, Check, Award, Layers, Radio, Smartphone, Volume2
} from 'lucide-react';
import { sound } from '../utils/sound';
import {
  calculateDistanceKm,
  calculateDrivingMins,
  getETAtoBranch,
  getETAtoCustomer,
  getGoogleNavUrl,
  getWazeNavUrl,
  MAP_LAYERS
} from '../utils/geo';
import DriverWallet from './DriverWallet';
import DeliveryExceptionModal from './DeliveryExceptionModal';
import DriverProofOfDeliveryModal from './DriverProofOfDeliveryModal';
import DriverSettlementSignModal from './DriverSettlementSignModal';


// دالة مساعدة لإنشاء رابط محادثة واتساب مباشر مع العميل
const getDriverWhatsAppUrl = (phone, customerName, orderId, address) => {
  if (!phone) return '#';
  let clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('05')) {
    clean = '966' + clean.substring(1);
  } else if (clean.startsWith('5')) {
    clean = '966' + clean;
  } else if (!clean.startsWith('966') && clean.length === 9) {
    clean = '966' + clean;
  }
  const msg = `مرحباً أستاذ/ة ${customerName || 'الكريم'}، معك مندوب منصة سَنَد للخدمات اللوجستية بخصوص شحنتك رقم #${orderId || ''}. أنا بالطريق إليك للعنوان: ${address || 'موقعك المسجل'}. يرجى التكرم بتأكيد تواجدك 🚗📦`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
};

export default function DriverApp({
  drivers = [],
  orders = [],
  branches = [],
  currentDriverId,
  onChangeDriver,
  onUpdateOrderStatus,
  onUpdateDriverLocation,
  onToggleDriverStatus,
  onRefresh,
  socket
}) {
  // حالة تسجيل الدخول والمصادقة الأمنية المشفرة للمندوب
  const [authDriver, setAuthDriver] = useState(() => {
    try {
      const item = localStorage.getItem('sanad_driver_auth');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  // قفل الجلسة الفوري (يعيد المندوب لشاشة التحقق بالـ PIN مع حفظ بياناته)
  const handleLockSession = () => {
    sound.pop();
    setAuthDriver(null);
  };

  // تسجيل الخروج التام ومسح الجلسة
  const handleLogout = () => {
    try {
      localStorage.removeItem('sanad_driver_auth');
      localStorage.removeItem('sanad_driver_id');
    } catch (e) {}
    sound.pop();
    setAuthDriver(null);
  };

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
  const [showNotificationsModal, setShowNotificationsModal] = useState(false); // الإشعارات 🔔
  const [showMapModal, setShowMapModal] = useState(false);                     // خريطة الملاحة GPS 🗺️
  const [scanModalConfig, setScanModalConfig] = useState(null);               // مسح الباركود الإلزامي { order, mode: 'pickup'|'delivery' }
  
  // تنبيه إسناد شحنة جديدة عائم أعلى الشاشة
  const [newAssignedAlertOrder, setNewAssignedAlertOrder] = useState(null);
  
  // قائمة سجل الإشعارات التفاعلي
  const [notificationsList, setNotificationsList] = useState(() => [
    {
      id: 'notif-welcome',
      title: 'مرحباً بك في منصة سَنَد',
      text: 'تم تفعيل حسابك بنجاح وجاهز لاستقبال شحنات المتاجر وتوجيه المسارات.',
      time: 'الآن',
      read: true
    }
  ]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // الشحنة المحددة في خريطة الملاحة الحية
  const [selectedRouteOrderId, setSelectedRouteOrderId] = useState(null);

  // نمط طبقة الخريطة الميدانية: قمر صناعي مع خطوط الشوارع افتراضياً
  const [routeMapLayer, setRouteMapLayer] = useState('satellite');

  // إحداثيات GPS الحية للمندوب
  const [driverLiveCoords, setDriverLiveCoords] = useState(null);

  // مراجع الخريطة والعلامات
  const routeMapContainerRef = useRef(null);
  const routeMapInstanceRef = useRef(null);
  const routeTileLayerRef = useRef(null);
  const routeMarkersRef = useRef({ driver: null, branch: null, customer: null, polyline: null });
  
  // طلبات تسوية وتوريد الكاش بانتظار توقيع المندوب
  const [pendingSettlementRequest, setPendingSettlementRequest] = useState(null);
  const [showSettlementSignModal, setShowSettlementSignModal] = useState(false);
  const [lastSettlementReceipt, setLastSettlementReceipt] = useState(null);

  // تأكيد التسليم والتعثر
  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
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

  const activeDriverId = authDriver?.id || currentDriverId || 'drv-1';
  const currentDriver = drivers.find(d => d.id === activeDriverId) || drivers.find(d => d.id === authDriver?.id) || authDriver || drivers[0] || {
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

  // حالة العد التنازلي لتجربة تنبيه الخلفية
  const [testCountdown, setTestCountdown] = useState(null);

  // تبديل حالة التوفر الميداني (متاح / غير متاح) مع إدارة وضع الخلفية وWake Lock
  const toggleAvailability = () => {
    const next = !isAvailable;
    setIsAvailable(next);
    sound.pop();
    if (next) {
      sound.enableBackgroundMode(currentDriver.name || 'يونس');
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } else {
      sound.disableBackgroundMode();
    }
    if (onToggleDriverStatus) onToggleDriverStatus(currentDriver.id);
  };

  // دالة تجربة التنبيه بالخلفية بعد مهلة تتيح للمندوب قفل الشاشة أو التحويل للخرائط
  const handleTestBackgroundDispatch = () => {
    sound.enableBackgroundMode(currentDriver.name || 'يونس');
    setTestCountdown(4);
    let rem = 4;
    const interval = setInterval(() => {
      rem -= 1;
      if (rem > 0) {
        setTestCountdown(rem);
      } else {
        clearInterval(interval);
        setTestCountdown(null);
        sound.triggerBackgroundAlert(
          {
            id: 'TEST-SND-99',
            customerName: 'تجربة سَنَد بالخلفية',
            customerAddress: 'الدمام - حي الشاطئ',
            totalAmount: 165.00
          },
          '🔔 سَنَد: تنبيه تجريبي بالخلفية ناجح!',
          'الصوت والاهتزاز وإشعار شاشة القفل يعملون بكفاءة حتى عند قفل الجوال أو تشغيل الخرائط 🚀'
        );
      }
    }, 1000);
  };

  // جلب طلب التسوية المعلق بانتظار توقيع المندوب
  const fetchPendingSettlement = async () => {
    if (!currentDriver?.id) return;
    try {
      const res = await fetch(`/api/settlements/requests?driverId=${currentDriver.id}&status=pending_driver_signature`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setPendingSettlementRequest(data[0]);
        } else {
          setPendingSettlementRequest(null);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchPendingSettlement();
    if (!socket) return;
    const onSettlementCreated = (data) => {
      const targetId = data?.driverId || data?.request?.driverId;
      if (targetId === currentDriver?.id) {
        setPendingSettlementRequest(data.request);
        setShowSettlementSignModal(true);
        try { sound.playNewOrderAlert(); } catch (e) {}
      }
    };
    const onSettlementApproved = (data) => {
      if (data?.request?.driverId === currentDriver?.id) {
        setPendingSettlementRequest(null);
        setShowSettlementSignModal(false);
        if (onRefresh) onRefresh();
      }
    };
    socket.on('settlement_request_created', onSettlementCreated);
    socket.on('settlement_approved', onSettlementApproved);
    socket.on('settlement_rejected', fetchPendingSettlement);
    socket.on('settlement_cancelled', fetchPendingSettlement);

    return () => {
      socket.off('settlement_request_created', onSettlementCreated);
      socket.off('settlement_approved', onSettlementApproved);
      socket.off('settlement_rejected', fetchPendingSettlement);
      socket.off('settlement_cancelled', fetchPendingSettlement);
    };
  }, [socket, currentDriver?.id]);

  // اعتماد وموافقة المندوب على التسوية وتوريد الكاش مع التوقيع الإلكتروني
  const handleApproveSettlement = async (requestId, signature) => {
    try {
      const res = await fetch(`/api/settlements/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          driverNotes: 'تم التوقيع والموافقة على استلام وتوريد العهدة'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        try { sound.playCashRegister(); } catch (e) {}
        setShowSettlementSignModal(false);
        setPendingSettlementRequest(null);
        setLastSettlementReceipt(data.transaction || {
          receiptNumber: data.receiptNumber,
          amount: data.request?.amount,
          driverSignature: signature,
          timestamp: new Date().toISOString()
        });
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'فشل اعتماد التسوية');
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالسيرفر');
    }
  };

  // تسجيل اعتراض على طلب التسوية
  const handleRejectSettlement = async (requestId, reason) => {
    try {
      const res = await fetch(`/api/settlements/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم إرسال اعتراضك للإدارة لمراجعة الحسابات.');
        setShowSettlementSignModal(false);
        setPendingSettlementRequest(null);
      } else {
        alert(data.error || 'فشل إرسال الاعتراض');
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالسيرفر');
    }
  };

  // تأكيد تسليم الشحنة وتوثيق إثبات التسليم الرقمي POD
  const handleConfirmDelivery = async (podData) => {
    if (!deliveryConfirmOrder) return;
    try {
      const pMethod = podData?.paymentMethod || confirmPaymentMethod;
      const commissionVal = Number(podData?.commissionAmount || deliveryConfirmOrder.driverCommission || deliveryConfirmOrder.deliveryFee || 25);
      if (onUpdateOrderStatus) {
        await onUpdateOrderStatus(deliveryConfirmOrder.id, 'delivered', pMethod, {
          podData,
          deliveredAt: new Date().toISOString(),
          proofType: podData?.podTab,
          receivedCash: podData?.receivedCash,
          changeDue: podData?.changeDue,
          driverCommission: commissionVal
        });
      }
      sound.playSuccess();
      const currentOrderSaved = deliveryConfirmOrder;
      setDeliveryConfirmOrder(null);
      if (onRefresh) onRefresh();
      alert(`✅ تم تأكيد تسليم الشحنة #${currentOrderSaved.id} وإيداع العمولة (+${commissionVal.toFixed(2)} ﷼) في رصيدك بنجاح!`);
    } catch (err) {
      alert('حدث خطأ أثناء تأكيد التسليم');
    }
  };

  // 1. طلب إذن التنبيهات وتتبع الموقع الجغرافي الحي للمندوب
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (e) {}

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, speed, heading } = pos.coords;
            const coords = [latitude, longitude];
            setDriverLiveCoords(coords);
            if (onUpdateDriverLocation && currentDriver?.id) {
              onUpdateDriverLocation(currentDriver.id, coords, speed ? Math.round(speed * 3.6) : 0, heading || 0);
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
      } catch (e) {}
    }
  }, [currentDriver.id]);

  // 2. الاستماع لأحداث إسناد الطلبات اللحظية للمندوب عبر WebSockets
  useEffect(() => {
    if (!socket) return;

    const onOrderAssigned = (data) => {
      const order = data?.order;
      const targetDriverId = data?.driverId || data?.driver?.id || order?.assignedDriverId;

      if (driverMatchId(targetDriverId)) {
        sound.triggerBackgroundAlert(order);
        setNewAssignedAlertOrder(order);
        setSelectedRouteOrderId(order.id);

        setNotificationsList(prev => [
          {
            id: 'notif-' + Date.now(),
            title: '🔔 وصلك طلب مسند جديد!',
            text: `طلب #${order.id} للعميل ${order.customerName} (${order.customerAddress || 'المنطقة الشرقية'}) - المبلغ: ${order.totalAmount} ر.س`,
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            order,
            read: false
          },
          ...prev
        ]);
        setUnreadNotificationsCount(prev => prev + 1);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('سَنَد: وصلك طلب مسند جديد 🔔', {
              body: `طلب #${order.id} - ${order.customerName} (${order.customerAddress || 'الشرقية'})`,
              icon: '/sanad-express-logo.jpg'
            });
          } catch (e) {}
        }

        if (onRefresh) onRefresh();
      }
    };

    socket.on('order_assigned_to_me', onOrderAssigned);
    socket.on('order_assigned_broadcast', onOrderAssigned);

    return () => {
      socket.off('order_assigned_to_me', onOrderAssigned);
      socket.off('order_assigned_broadcast', onOrderAssigned);
    };
  }, [socket, currentDriver.id]);

  // 3. مراقبة وصول طلبات مسندة جديدة في قائمة الطلبات
  const prevOrdersCountRef = useRef(myOrders.length);
  useEffect(() => {
    if (myOrders.length > prevOrdersCountRef.current) {
      const latest = myOrders[0];
      if (latest && ['assigned', 'ready_for_pickup'].includes(latest.status)) {
        if (!newAssignedAlertOrder) {
          sound.triggerBackgroundAlert(latest);
          setNewAssignedAlertOrder(latest);
          setSelectedRouteOrderId(latest.id);
        }
      }
    }
    prevOrdersCountRef.current = myOrders.length;
  }, [myOrders]);

  // 4. تهيئة خريطة الملاحة الحية لتبويب المسارات
  useEffect(() => {
    if (activeBottomTab !== 'routes') {
      if (routeMapInstanceRef.current) {
        routeMapInstanceRef.current.remove();
        routeMapInstanceRef.current = null;
      }
      return;
    }

    if (!routeMapContainerRef.current) return;
    if (routeMapInstanceRef.current) return;

    try {
      if (routeMapContainerRef.current._leaflet_id) {
        routeMapContainerRef.current._leaflet_id = null;
      }

      const defaultCenter = driverLiveCoords || currentDriver.coords || [26.4380, 50.1110];

      const map = L.map(routeMapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      const activeTileLayer = L.tileLayer(MAP_LAYERS[routeMapLayer].url, {
        maxZoom: MAP_LAYERS[routeMapLayer].maxZoom,
        subdomains: ['a', 'b', 'c', 'd']
      }).addTo(map);

      routeTileLayerRef.current = activeTileLayer;
      routeMapInstanceRef.current = map;
    } catch (e) {
      console.warn('DriverApp Leaflet map init warning:', e);
    }

    return () => {
      try {
        if (routeMapInstanceRef.current) {
          routeMapInstanceRef.current.remove();
          routeMapInstanceRef.current = null;
        }
      } catch (e) {}
    };
  }, [activeBottomTab]);

  // 5. تبديل طبقة الخريطة الميدانية (شوارع وأحياء السعودية / قمر صناعي / ليلي)
  useEffect(() => {
    const map = routeMapInstanceRef.current;
    if (!map) return;
    if (routeTileLayerRef.current) {
      map.removeLayer(routeTileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(MAP_LAYERS[routeMapLayer].url, {
      maxZoom: MAP_LAYERS[routeMapLayer].maxZoom,
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(map);
    routeTileLayerRef.current = newTileLayer;
  }, [routeMapLayer]);

  // 6. تحديث علامات الملاحة والمسارات اللحظية على الخريطة
  useEffect(() => {
    const map = routeMapInstanceRef.current;
    if (!map || activeBottomTab !== 'routes') return;

    // تنظيف العلامات السابقة
    if (routeMarkersRef.current.driver) routeMarkersRef.current.driver.remove();
    if (routeMarkersRef.current.branch) routeMarkersRef.current.branch.remove();
    if (routeMarkersRef.current.customer) routeMarkersRef.current.customer.remove();
    if (routeMarkersRef.current.polyline) routeMarkersRef.current.polyline.remove();

    const driverCoords = driverLiveCoords || currentDriver.coords || [26.4380, 50.1110];

    // علامة المندوب الحية
    const driverIcon = L.divIcon({
      className: 'driver-live-pin',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="absolute -inset-2 rounded-full bg-cyan-500/30 animate-ping"></div>
          <div class="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 border-2 border-white flex items-center justify-center text-white shadow-xl shadow-cyan-900/60 z-20">
            <span class="text-xl">🚗</span>
          </div>
          <div class="absolute -bottom-6 bg-slate-950/95 border border-cyan-500/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1 z-30">
            <span>${currentDriver.name || 'موقعك'}</span>
            <span class="text-cyan-400 font-mono">${currentDriver.speed || 0} كم/س</span>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
    routeMarkersRef.current.driver = L.marker(driverCoords, { icon: driverIcon }).addTo(map);

    const activeRouteOrders = myOrders.filter(o => ['assigned', 'ready_for_pickup', 'in_transit', 'picked_up'].includes(o.status));
    const currentOrder = activeRouteOrders.find(o => o.id === selectedRouteOrderId) || activeRouteOrders[0];

    if (!currentOrder) {
      map.setView(driverCoords, 14);
      return;
    }

    const orderBranch = branches.find(b => b.id === currentOrder.branchId) || { name: 'المستودع الرئيسي', coords: [26.4380, 50.1110] };
    const customerCoords = currentOrder.customerCoords || [26.4450, 50.1150];
    const isHeadingToBranch = ['assigned', 'ready_for_pickup'].includes(currentOrder.status);

    // علامة الفرع / المستودع
    const branchIcon = L.divIcon({
      className: 'branch-pin',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-10 h-10 rounded-2xl bg-purple-600 border-2 border-purple-200 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
            <span class="text-lg">🏪</span>
          </div>
          <div class="absolute -bottom-6 bg-purple-950/95 border border-purple-500/60 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
            ${orderBranch.name}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    routeMarkersRef.current.branch = L.marker(orderBranch.coords, { icon: branchIcon }).addTo(map);

    // علامة العميل
    const customerIcon = L.divIcon({
      className: 'customer-pin',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-10 h-10 rounded-full bg-emerald-600 border-2 border-emerald-200 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
            <span class="text-base">📍</span>
          </div>
          <div class="absolute -bottom-6 bg-slate-950/95 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
            ${currentOrder.customerName}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    routeMarkersRef.current.customer = L.marker(customerCoords, { icon: customerIcon }).addTo(map);

    // رسم مسار الملاحة النشط
    const routePoints = isHeadingToBranch
      ? [driverCoords, orderBranch.coords]
      : [driverCoords, customerCoords];

    routeMarkersRef.current.polyline = L.polyline(routePoints, {
      color: isHeadingToBranch ? '#a855f7' : '#10b981',
      weight: 5,
      opacity: 0.85,
      dashArray: '10, 10',
      lineJoin: 'round'
    }).addTo(map);

    // ضبط الرؤية
    const bounds = L.latLngBounds([driverCoords, orderBranch.coords, customerCoords]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }, [activeBottomTab, selectedRouteOrderId, myOrders, branches, driverLiveCoords, currentDriver]);

  // إذا لم تتم مصادقة المندوب أو كانت الجلسة مقفلة: عرض بوابة الأمان المشفرة فوراً
  if (!authDriver) {
    return (
      <DriverAuthGate
        onLoginSuccess={(loggedDriver) => {
          setAuthDriver(loggedDriver);
          if (onChangeDriver) onChangeDriver(loggedDriver.id);
          if (onRefresh) onRefresh();
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#f4f6f8] dark:bg-[#0a0e18] text-slate-800 dark:text-slate-100 flex flex-col font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] select-none relative pb-28" dir="rtl">

      {/* ========================================================================= */}
      {/* شريط المؤشرات الحيوية والميدانية الفورية (Driver Live Telemetry Bar) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-300 select-none sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          {/* مؤشر GPS */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
            <span className={`w-2 h-2 rounded-full ${driverLiveCoords ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="font-mono text-[10px] text-slate-200">
              {driverLiveCoords ? 'GPS نشط (دقة عالية)' : 'جاري التقاط GPS...'}
            </span>
          </div>

          {/* مؤشر الرادار المباشر */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[10px] text-slate-300">سَنَد رادار</span>
          </div>

          {/* مؤشر العمل بالخلفية وإبقاء الشاشة مضاءة */}
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold transition-all ${
            isAvailable 
              ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300' 
              : 'bg-slate-800/60 border-slate-700 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span>{isAvailable ? 'الخلفية والملاحة نشطة ⚡' : 'الخلفية معلقة'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* رصيد عهدة الكاش السريع باليد */}
          <div className="flex items-center gap-1 bg-emerald-950/50 border border-emerald-800/80 px-2.5 py-0.5 rounded-full text-emerald-300 font-mono text-[11px] font-black">
            <span>💵</span>
            <span>{(Number(currentDriver.cashOnHand) || 0).toFixed(2)} ﷼</span>
          </div>

          {/* زر القفل السريع لحماية البيانات */}
          <button
            type="button"
            onClick={handleLockSession}
            className="text-slate-400 hover:text-cyan-300 p-1 transition-colors cursor-pointer"
            title="قفل فوري للجلسة"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      
      {/* 🔔 الإشعار العائم الفوري لوصول طلب جديد مسند */}
      {newAssignedAlertOrder && (
        <div className="fixed top-3 inset-x-3 sm:max-w-md sm:mx-auto z-[7000] animate-in slide-in-from-top duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 rounded-3xl p-4 shadow-[0_10px_35px_rgba(245,158,11,0.4)] text-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 animate-bounce">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span>وصلك طلب مسند جديد الآن!</span>
                  </div>
                  <div className="font-black text-sm text-white mt-0.5 font-mono">
                    #{newAssignedAlertOrder.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewAssignedAlertOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">العميل المستلم:</span>
                <span className="font-bold text-slate-200">{newAssignedAlertOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الحي / العنوان:</span>
                <span className="font-bold text-cyan-400">{newAssignedAlertOrder.customerAddress || 'المنطقة الشرقية'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المبلغ المطلوب:</span>
                <span className="font-bold text-emerald-400">{newAssignedAlertOrder.totalAmount} ر.س ({newAssignedAlertOrder.paymentMethod === 'cash' ? 'كاش عند الاستلام' : 'شبكة مدى'})</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRouteOrderId(newAssignedAlertOrder.id);
                  setActiveBottomTab('routes');
                  setNewAssignedAlertOrder(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>بدء الملاحة فوراً 🧭</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateOrderStatus) {
                    onUpdateOrderStatus(newAssignedAlertOrder.id, 'picked_up');
                  }
                  sound.playSuccess();
                  setNewAssignedAlertOrder(null);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Package className="w-3.5 h-3.5" />
                <span>استلام الشحنة 📦</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ========================================================================= */}
      {/* التبويب 1: الرئيسية (HOME) - مطابق للصورة 4 تماماً */}
      {/* ========================================================================= */}
      {activeBottomTab === 'home' && (
        <div className="p-4 space-y-4">
          
          {/* تنبيه طلب تسوية وتوريد عهدة بانتظار توقيع المندوب */}
          {pendingSettlementRequest && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-purple-950/60 to-blue-950/70 border-2 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg shrink-0">
                  ✍️
                </div>
                <div>
                  <div className="font-black text-xs text-amber-300 flex items-center gap-1.5">
                    <span>طلب تسوية عهدة كاش جديد</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/30 text-amber-200 font-mono">
                      {pendingSettlementRequest.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200 mt-0.5">
                    مطلوب توقيعك لاعتماد توريد مبلغ <span className="font-mono font-bold text-emerald-400 text-xs">{Number(pendingSettlementRequest.amount || 0).toLocaleString()} ﷼</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettlementSignModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md cursor-pointer active:scale-95 shrink-0 transition-all"
              >
                <span>مراجعة وتوقيع</span>
                <span>✍️</span>
              </button>
            </div>
          )}

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
            <div className="flex items-center gap-1.5">
              {/* زر قفل الجلسة الفوري لحماية البيانات */}
              <button
                type="button"
                onClick={handleLockSession}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-cyan-800/60 flex items-center justify-center text-cyan-400 hover:text-cyan-300 shadow-2xs cursor-pointer transition-colors"
                title="قفل فوري للجلسة لحماية البيانات"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>

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
                onClick={() => { setShowNotificationsModal(true); setUnreadNotificationsCount(0); }}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#00d2d3] shadow-2xs cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold animate-bounce shadow">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* شريط العدادات الميداني الذكي لسند (Smart Live Counters) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* عداد 1: بانتظار المسح والاستلام */}
            <div 
              onClick={() => setOrdersSubTab('new')}
              className="bg-amber-950/30 dark:bg-amber-950/40 p-2.5 rounded-2xl border border-amber-500/40 text-center shadow-sm cursor-pointer hover:border-amber-400 transition-all active:scale-95 flex flex-col items-center justify-between"
            >
              <div className="flex items-center justify-between w-full text-[10px] text-amber-400 font-bold">
                <span>بانتظار الاستلام</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              </div>
              <div className="text-2xl font-black font-mono text-amber-300 my-0.5">
                {newOrders.length}
              </div>
              <div className="text-[9px] text-amber-200/80 bg-amber-950/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ScanLine className="w-2.5 h-2.5" />
                <span>يلزم مسح QR 📦</span>
              </div>
            </div>

            {/* عداد 2: بالسيارة قيد التوصيل */}
            <div 
              onClick={() => setOrdersSubTab('in_transit')}
              className="bg-cyan-950/30 dark:bg-cyan-950/40 p-2.5 rounded-2xl border border-cyan-500/40 text-center shadow-sm cursor-pointer hover:border-cyan-400 transition-all active:scale-95 flex flex-col items-center justify-between"
            >
              <div className="flex items-center justify-between w-full text-[10px] text-cyan-400 font-bold">
                <span>بالسيارة الآن</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              </div>
              <div className="text-2xl font-black font-mono text-[#00d2d3] my-0.5">
                {inTransitOrders.length}
              </div>
              <div className="text-[9px] text-cyan-200/80 bg-cyan-950/80 px-2 py-0.5 rounded-full font-bold">
                قيد التوصيل 🚚
              </div>
            </div>

            {/* عداد 3: تم التسليم اليوم */}
            <div 
              onClick={() => setShowDeliveredModal(true)}
              className="bg-emerald-950/30 dark:bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-500/40 text-center shadow-sm cursor-pointer hover:border-emerald-400 transition-all active:scale-95 flex flex-col items-center justify-between"
            >
              <div className="flex items-center justify-between w-full text-[10px] text-emerald-400 font-bold">
                <span>تم التسليم اليوم</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-300 my-0.5">
                {deliveredOrders.length}
              </div>
              <div className="text-[9px] text-emerald-200/80 bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold">
                مكتملة بنجاح ✅
              </div>
            </div>

            {/* عداد 4: كاش العهدة والمبالغ */}
            <div 
              onClick={() => setShowWalletModal(true)}
              className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 text-center shadow-sm cursor-pointer hover:border-slate-700 transition-all active:scale-95 flex flex-col items-center justify-between"
            >
              <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-bold">
                <span>كاش العهدة</span>
                <span className="text-[9px] font-mono text-emerald-400">COD</span>
              </div>
              <div className="text-lg font-black font-mono text-emerald-400 my-0.5">
                {(Number(currentDriver.cashOnHand) || 0).toFixed(0)} <span className="text-[10px]">ر.س</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate w-full">
                المتبقي: {expectedCashAmount.toFixed(0)} ر.س
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
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ' +
                    (ordersSubTab === 'new'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/60 font-black shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    )
                  }
                >
                  <span>جديد للاستلام</span>
                  <span className="font-mono text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                    {newOrders.length}
                  </span>
                </button>

                {/* جاري التوصيل */}
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('in_transit')}
                  className={
                    'px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ' +
                    (ordersSubTab === 'in_transit'
                      ? 'bg-cyan-950 text-[#00d2d3] border border-cyan-500/60 font-black shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    )
                  }
                >
                  <span>في السيارة</span>
                  <span className="font-mono text-[10px] bg-[#00d2d3] text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                    {inTransitOrders.length}
                  </span>
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

                  {ordersSubTab === 'new' ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setScanModalConfig({ order, mode: 'pickup' })}
                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ScanLine className="w-4 h-4" />
                        <span>مسح واستلام من المستودع 📦📷</span>
                      </button>
                      <a
                        href={`tel:${order.customerPhone || ''}`}
                        className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:text-[#00d2d3]"
                        title="اتصال بالعميل"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>اتصال</span>
                      </a>
                    </div>
                  ) : ordersSubTab === 'in_transit' ? (
                    (() => {
                      const distKm = (driverLiveCoords && order.customerCoords) 
                        ? calculateDistanceKm(driverLiveCoords, order.customerCoords) 
                        : null;
                      const etaMins = distKm ? calculateDrivingMins(distKm) : null;
                      return (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {distKm !== null && (
                            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-50/70 dark:bg-cyan-950/40 px-2.5 py-1 rounded-xl border border-cyan-200 dark:border-cyan-900/60">
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3 text-cyan-500" />
                                <span>المسافة: <strong>{distKm.toFixed(1)} كم</strong></span>
                              </span>
                              <span>زمن الوصول المتوقع: <strong>~{etaMins} دقيقة</strong></span>
                            </div>
                          )}

                          {/* شبكة الإجراءات السريعة: اتصال، واتساب، خرائط جوجل، Waze */}
                          <div className="grid grid-cols-4 gap-1.5">
                            <a
                              href={`tel:${order.customerPhone || ''}`}
                              className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
                              title="اتصال هاتفي بالعميل"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-500" />
                              <span>اتصال</span>
                            </a>
                            <a
                              href={getDriverWhatsAppUrl(order.customerPhone, order.customerName, order.id, order.customerAddress)}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
                              title="محادثة واتساب مجهزة"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                              <span>واتساب</span>
                            </a>
                            <a
                              href={order.customerCoords ? getGoogleNavUrl(order.customerCoords[0], order.customerCoords[1]) : `https://maps.google.com/?q=${encodeURIComponent(order.customerAddress || 'الدمام')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 text-slate-700 dark:text-slate-300 hover:text-cyan-600 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
                              title="خرائط Google"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-500" />
                              <span>خرائط</span>
                            </a>
                            <a
                              href={order.customerCoords ? getWazeNavUrl(order.customerCoords[0], order.customerCoords[1]) : `https://waze.com/ul?q=${encodeURIComponent(order.customerAddress || 'الدمام')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
                              title="ملاحة Waze"
                            >
                              <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Waze</span>
                            </a>
                          </div>

                          {/* أزرار التسليم وإثبات التسليم POD */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDeliveryConfirmOrder(order)}
                              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تسليم وإثبات التسليم (POD) ✍️📷</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setScanModalConfig({ order, mode: 'delivery' })}
                              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
                              title="مسح باركود الشحنة بالكاميرا"
                            >
                              <ScanLine className="w-4 h-4 text-cyan-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExceptionOrder(order)}
                              className="px-2.5 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              تعثر التسليم
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-rose-500 font-bold">
                      <span>حالة الشحنة: مرتجعة للمتجر</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (onUpdateOrderStatus) {
                            await onUpdateOrderStatus(order.id, 'returned', null, { returnStatus: 'returned_to_branch' });
                            alert('تم تسليم الشحنة المرتجعة للفرع');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-[11px]"
                      >
                        تسليم للمستودع
                      </button>
                    </div>
                  )}
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
      {/* ========================================================================= */}
      {/* التبويب 2: المسارات والملاحة الحية (ROUTES & GPS NAVIGATION) */}
      {/* ========================================================================= */}
      {activeBottomTab === 'routes' && (() => {
        const activeRouteOrders = myOrders.filter(o => ['assigned', 'ready_for_pickup', 'in_transit', 'picked_up'].includes(o.status));
        const currentOrder = activeRouteOrders.find(o => o.id === selectedRouteOrderId) || activeRouteOrders[0] || null;

        const orderBranch = currentOrder ? (branches.find(b => b.id === currentOrder.branchId) || { name: 'المستودع الرئيسي', phone: '0501122334', coords: [26.4380, 50.1110] }) : null;
        const isHeadingToBranch = currentOrder ? ['assigned', 'ready_for_pickup'].includes(currentOrder.status) : false;

        const driverCoords = driverLiveCoords || currentDriver.coords || [26.4380, 50.1110];
        const targetCoords = currentOrder ? (isHeadingToBranch ? orderBranch.coords : (currentOrder.customerCoords || [26.4450, 50.1150])) : driverCoords;
        const targetPhone = currentOrder ? (isHeadingToBranch ? orderBranch.phone : currentOrder.customerPhone) : '';
        const targetTitle = currentOrder
          ? (isHeadingToBranch ? `استلام من فرع: ${orderBranch.name}` : `تسليم العميل: ${currentOrder.customerName}`)
          : 'جاهز لتوجيه المسارات';
        const targetAddress = currentOrder
          ? (isHeadingToBranch ? (orderBranch.district || 'موقع الفرع') : (currentOrder.customerAddress || 'المنطقة الشرقية'))
          : 'أنت متصل بالرادار الميداني';

        const distanceKm = currentOrder ? calculateDistanceKm(driverCoords, targetCoords) : 0;
        const etaMins = currentOrder ? calculateDrivingMins(distanceKm) : 0;

        return (
          <div className="p-3 sm:p-4 space-y-3">
            {/* ترويسة المسارات مع مبدل الطبقات وزر التنبيهات */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  الملاحة وتوجيه المسار
                </h1>
              </div>

              <div className="flex items-center gap-1.5">
                {/* مبدل نمط خريطة السعودية */}
                <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setRouteMapLayer('streets')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${routeMapLayer === 'streets' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-300'}`}
                    title="شوارع وأحياء المملكة بالعربي"
                  >
                    شوارع 🗺️
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteMapLayer('satellite')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${routeMapLayer === 'satellite' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-300'}`}
                    title="قمر صناعي هجين مع الشوارع"
                  >
                    قمر 🛰️
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteMapLayer('dark')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${routeMapLayer === 'dark' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-300'}`}
                    title="الوضع الليلي"
                  >
                    ليلي 🌙
                  </button>
                </div>

                {/* زر الإشعارات */}
                <button
                  type="button"
                  onClick={() => { setShowNotificationsModal(true); setUnreadNotificationsCount(0); }}
                  className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs relative cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* شريط اختيار الشحنات النشطة في حال وجود أكثر من شحنة */}
            {activeRouteOrders.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {activeRouteOrders.map((ord) => {
                  const isSelected = ord.id === (currentOrder?.id);
                  const isPickup = ['assigned', 'ready_for_pickup'].includes(ord.status);
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedRouteOrderId(ord.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md scale-102'
                          : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      <span>{isPickup ? '🏪 استلام' : '📍 تسليم'} #{ord.id.slice(-6)}</span>
                      <span className="opacity-75 text-[10px]">({ord.customerName})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* بطاقة الملاحة العلوية HUD (المحطة القادمة وزمن الوصول) */}
            <div className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${isHeadingToBranch ? 'bg-purple-600 shadow-purple-900/30' : 'bg-emerald-600 shadow-emerald-900/30'} shadow-md`}>
                    {isHeadingToBranch ? <Store className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400">
                      {currentOrder ? (isHeadingToBranch ? 'المحطة الحالية (الاستلام من الفرع)' : 'المحطة الحالية (التسليم للعميل)') : 'حالة الملاحة'}
                    </div>
                    <div className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[210px]">
                      {targetTitle}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-[10px] font-bold text-slate-400">زمن الوصول المقدر</div>
                  <div className="text-sm font-black text-[#00d2d3] font-mono">
                    {currentOrder ? `${etaMins} دقيقة` : 'جاهز'}
                  </div>
                </div>
              </div>

              {/* عدادات الملاحة الثلاثية */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-bold">المسافة</div>
                  <div className="font-black font-mono text-slate-700 dark:text-slate-200 mt-0.5">
                    {currentOrder ? `${distanceKm} كم` : '0 كم'}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-bold">سرعتك الحالية</div>
                  <div className="font-black font-mono text-amber-500 mt-0.5">
                    {currentDriver.speed || 0} كم/س
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-bold">التحصيل المطلوب</div>
                  <div className="font-black font-mono text-emerald-500 mt-0.5">
                    {currentOrder ? `${currentOrder.totalAmount} ر.س` : '0 ر.س'}
                  </div>
                </div>
              </div>

              {currentOrder && (
                <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <MapPin className="w-3.5 h-3.5 text-[#00d2d3] shrink-0" />
                  <span className="truncate">{targetAddress}</span>
                </div>
              )}
            </div>

            {/* وعاء خريطة الملاحة الحية Leaflet */}
            <div className="relative w-full h-[48vh] min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
              <div ref={routeMapContainerRef} className="w-full h-full min-h-[360px]" />

              {/* شارة توجيه عائمة فوق الخريطة */}
              <div className="absolute top-3 right-3 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1 text-[10px] font-bold text-white shadow-lg flex items-center gap-1.5 pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>توجيه GPS نشط • شوارع وأحياء المملكة</span>
              </div>

              {/* زر إعادة ضبط موقع المندوب على الخريطة */}
              <button
                type="button"
                onClick={() => {
                  if (routeMapInstanceRef.current) {
                    routeMapInstanceRef.current.flyTo(driverCoords, 16, { duration: 1 });
                  }
                }}
                className="absolute bottom-3 left-3 z-[1000] w-9 h-9 rounded-xl bg-slate-900/90 text-white border border-slate-700 flex items-center justify-center shadow-lg hover:bg-slate-800 cursor-pointer pointer-events-auto"
                title="تمركز حول موقعي"
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* لوحة إجراءات الملاحة والتواصل الميدانية السريعة */}
            {currentOrder ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* فتح في خرائط جوجل */}
                  <a
                    href={getGoogleNavUrl(targetCoords[0], targetCoords[1])}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>خرائط Google</span>
                  </a>

                  {/* فتح في Waze */}
                  <a
                    href={getWazeNavUrl(targetCoords[0], targetCoords[1])}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>تطبيق Waze</span>
                  </a>

                  {/* اتصال هاتفي */}
                  <a
                    href={`tel:${targetPhone}`}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs border border-slate-700 shadow-md flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اتصال</span>
                  </a>

                  {/* مراسلة واتساب */}
                  <a
                    href={`https://wa.me/${(targetPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم، معك مندوب منصة سَنَد بخصوص طلبك #${currentOrder.id}. أنا في طريقي إليك للتسليم.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                </div>

                {/* زر الإجراء الرئيسي: تأكيد الاستلام من الفرع أو تأكيد التسليم للعميل */}
                {isHeadingToBranch ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateOrderStatus) {
                        onUpdateOrderStatus(currentOrder.id, 'picked_up');
                      }
                      sound.playSuccess();
                      alert(`✅ تم تأكيد استلام الشحنة #${currentOrder.id} من الفرع، جاري الآن توجيه المسار إلى العميل!`);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                  >
                    <Package className="w-4 h-4" />
                    <span>تأكيد استلام الشحنة من الفرع والبدء بالتوصيل للعميل 🚀</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeliveryConfirmOrder(currentOrder)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>وصلت للعميل — تأكيد تسليم الشحنة وتحصيل المبلغ 🏁</span>
                  </button>
                )}
              </div>
            ) : (
              /* حالة عدم وجود شحنات نشطة */
              <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-[#00d2d3] mx-auto">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  أنت متصل بالرادار الميداني • جاهز لاستقبال الطلبات
                </div>
                <div className="text-xs text-slate-400">
                  بمجرد إسناد شحنة جديدة لك سيصدر النظام رنيناً صوتياً وسيتم رسم مسار الملاحة تلقائياً.
                </div>
                <button
                  type="button"
                  onClick={() => { if (onRefresh) onRefresh(); sound.click(); }}
                  className="mt-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث قائمة الطلبات</span>
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* التبويب 4: المخزون والمانفست الميداني (INVENTORY & MANIFEST) */}
      {/* ========================================================================= */}
      {activeBottomTab === 'inventory' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white">
                مانفست ومخزون المركبة
              </h1>
              <p className="text-[11px] text-slate-500">جرد ومتابعة الشحنات المحمولة بالسيارة</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-[#00d2d3] border border-cyan-300 dark:border-cyan-800">
              {inTransitOrders.length} شحنة بالسيارة
            </span>
          </div>

          {/* إحصائيات سريعة للعهدة بالمركبة */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
              <div className="text-[11px] text-slate-500">مجموع مبالغ الكاش للتحصيل:</div>
              <div className="text-base font-black font-mono text-emerald-600 mt-1">
                {inTransitOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toFixed(2)} ﷼
              </div>
            </div>
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
              <div className="text-[11px] text-slate-500">شحنات شبكة مدى / مسددة:</div>
              <div className="text-base font-black font-mono text-cyan-500 mt-1">
                {inTransitOrders.filter(o => o.paymentMethod !== 'cash').length} شحنات
              </div>
            </div>
          </div>

          {/* بطاقة بيانات العهدة والعتاد */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>عتاد المركبة المسجل ({currentDriver.vehicle || 'كامري 2023'}):</span>
              <span className="text-[10px] text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">جاهز ومعتمد</span>
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

          {/* محرك البحث في مانفست الشحنات المحمولة */}
          <div className="relative">
            <input
              type="text"
              value={inventorySearchQuery}
              onChange={(e) => setInventorySearchQuery(e.target.value)}
              placeholder="ابحث في شحنات السيارة (رقم الشحنة، العميل، الحي)..."
              className="w-full bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            {inventorySearchQuery && (
              <button
                type="button"
                onClick={() => setInventorySearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* قائمة شحنات المانفست بالسيارة */}
          <div className="space-y-2.5">
            {(() => {
              const filtered = inTransitOrders.filter(o => {
                if (!inventorySearchQuery.trim()) return true;
                const q = inventorySearchQuery.toLowerCase();
                return (
                  String(o.id).toLowerCase().includes(q) ||
                  (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                  (o.customerPhone && o.customerPhone.includes(q)) ||
                  (o.customerAddress && o.customerAddress.toLowerCase().includes(q))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                    {inTransitOrders.length === 0 ? 'لا توجد شحنات محملة بالسيارة حالياً' : 'لا توجد نتائج مطابقة لبحثك'}
                  </div>
                );
              }

              return filtered.map(order => (
                <div key={order.id} className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        #{order.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${order.paymentMethod === 'cash' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                        {order.paymentMethod === 'cash' ? '💵 كاش' : '💳 مدى'}
                      </span>
                    </div>
                    <span className="font-mono font-black text-sm text-[#00d2d3]">
                      {order.totalAmount} ﷼
                    </span>
                  </div>

                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{order.customerName}</div>
                    <div className="text-slate-400 text-[11px] truncate">{order.customerAddress || 'المنطقة الشرقية'}</div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeliveryConfirmOrder(order)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>إثبات وتسليم (POD)</span>
                    </button>
                    <a
                      href={`tel:${order.customerPhone || ''}`}
                      className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:text-emerald-600 cursor-pointer"
                      title="اتصال"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={getDriverWhatsAppUrl(order.customerPhone, order.customerName, order.id, order.customerAddress)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:text-emerald-600 cursor-pointer"
                      title="واتساب"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ));
            })()}
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
                <div className="text-[11px] text-slate-400 mt-0.5">تعرف أكثر على منصة سَنَد للخدمات اللوجستية</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white shadow-xs">
                <Package className="w-4 h-4" />
              </div>
            </button>

            {/* بطاقة: قفل الجلسة مؤقتاً */}
            <button
              type="button"
              onClick={handleLockSession}
              className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all shadow-xs text-cyan-400"
            >
              <div className="w-4"></div>
              <span className="font-bold text-xs">قفل الجلسة مؤقتاً (PIN Lock) 🔒</span>
              <Lock className="w-4 h-4 stroke-[2]" />
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
                  {(deliveredOrders.reduce((sum, o) => sum + Number(o.driverCommission || o.deliveryFee || 25), 0)).toFixed(2)} ﷼
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">الكاش المسلم باليد (العهدة):</span>
                  <span className="font-bold font-mono">{currentDriver.cashOnHand || '0.00'} ﷼</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">عمولة المشوار:</span>
                  <span className="font-bold font-mono text-[#00d2d3]">حسب تسعيرة المدينة (25 - 40 ﷼)</span>
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

              {/* كرت العمل بالخلفية وشاشة القفل للمندوب */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 dark:bg-cyan-950/40 border border-cyan-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>وضع العمل بالخلفية والملاحة 🛡️</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isAvailable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isAvailable ? 'نشط الآن 🟢' : 'معلق (غير متاح)'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span>✓</span>
                    <span>شاشة الجوال لن تنطفئ تلقائياً أثناء الملاحة (Wake Lock)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <span>✓</span>
                    <span>الصوت والتنبيه يعمل فوق Google Maps و Waze</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <span>✓</span>
                    <span>إشعارات شاشة القفل مع اهتزاز مخصص لكل شحنة</span>
                  </div>
                </div>

                {/* زر تجربة التنبيه بالخلفية */}
                <button
                  type="button"
                  onClick={handleTestBackgroundDispatch}
                  disabled={testCountdown !== null}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {testCountdown !== null 
                      ? `اقفل شاشتك الآن! التنبيه بعد ${testCountdown} ثوانٍ ⏳` 
                      : 'تجربة تنبيه شاشة القفل والخلفية (4 ثوانٍ) 🧪'}
                  </span>
                </button>
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
                  onClick={async () => {
                    if (newPasswordInput.length >= 4) {
                      try {
                        const res = await fetch(`/api/drivers/${currentDriver.id}/change-password`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ newPassword: newPasswordInput })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          alert('✅ تم تحديث وتشفير كلمة المرور وحفظها في قاعدة البيانات بنجاح!');
                          setNewPasswordInput('');
                          sound.playSuccess();
                        } else {
                          alert(data.error || 'فشل تحديث كلمة المرور');
                        }
                      } catch (err) {
                        alert('حدث خطأ أثناء حفظ كلمة المرور في السيرفر');
                      }
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
                { id: 'SND-1001', customer: 'yara alshehri', amount: '148.00 ﷼', date: 'اليوم 04:30 م', status: 'تم التسليم' },
                { id: 'SND-1013', customer: 'أحمد الزهراني', amount: '220.00 ﷼', date: 'اليوم 02:15 م', status: 'تم التسليم' },
                { id: 'SND-1014', customer: 'خالد السبيعي', amount: '95.00 ﷼', date: 'اليوم 01:00 م', status: 'تم التسليم' },
                { id: 'SND-1015', customer: 'فيصل السالم', amount: '340.00 ﷼', date: 'أمس', status: 'تم التسليم' },
                { id: 'SND-1016', customer: 'ماجد الدوسري', amount: '180.00 ﷼', date: 'أمس', status: 'تم التسليم' }
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
              <p>نحن في سَنَد نلتزم بأعلى معايير حماية وخصوصية بيانات المندوب والعملاء وفق الأنظمة المعمول بها في المملكة العربية السعودية.</p>
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
                <div className="text-slate-500">ما مدى رضاك عن تجربة استخدام تطبيق سَنَد؟</div>
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
                <span>عن سَنَد للخدمات اللوجستية</span>
              </h3>
              <button onClick={() => setShowAboutModal(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <img src="/sanad-express-logo.jpg?v=3" alt="سند" className="w-12 h-12 rounded-xl object-cover border" />
                <div>
                  <div className="font-black text-slate-900 dark:text-white">سند SANAD</div>
                  <div className="font-mono text-[10px] text-cyan-600">سَنَد LOGISTICS</div>
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

      {/* نافذة التحقق الصارم ومسح الباركود الإلزامي للاستلام والتسليم */}
      {scanModalConfig && (
        <OrderScanModal
          isOpen={Boolean(scanModalConfig)}
          order={scanModalConfig.order}
          allOrders={orders}
          mode={scanModalConfig.mode}
          onSuccess={async (verifiedId) => {
            const activeOrder = scanModalConfig.order;
            const activeMode = scanModalConfig.mode;
            setScanModalConfig(null);

            if (activeMode === 'pickup') {
              if (onUpdateOrderStatus) {
                await onUpdateOrderStatus(activeOrder.id, 'in_transit');
                sound.playSuccess();
                setOrdersSubTab('in_transit');
                if (onRefresh) onRefresh();
              }
            } else if (activeMode === 'delivery') {
              // بعد نجاح مسح الباركود، يتم فتح تأكيد استلام المبلغ وإغلاق الطلب
              setDeliveryConfirmOrder(activeOrder);
            }
          }}
          onClose={() => setScanModalConfig(null)}
        />
      )}

      {/* 11. نافذة: الخريطة المباشرة العائمة */}
      {showMapModal && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-[#00d2d3] mx-auto">
              <Navigation className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              فتح خريطة الملاحة والتوجيه الميداني GPS
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              خريطة تفاعلية كاملة مع شوارع وأحياء المملكة وتوجيه خطوة بخطوة بالمسافات وأزمنة الوصول.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowMapModal(false);
                  setActiveBottomTab('routes');
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>فتح الخريطة الحية</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. نافذة: الإشعارات 🔔 */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>التنبيهات والإشعارات ({notificationsList.length})</span>
              </h3>
              <button onClick={() => setShowNotificationsModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
            </div>
            
            <div className="space-y-2.5 text-xs overflow-y-auto flex-1 pr-1">
              {notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    notif.order
                      ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/20'
                      : 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {notif.order && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      <span>{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed">
                    {notif.text}
                  </div>
                  {notif.order && (
                    <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-500">{notif.order.totalAmount} ر.س</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRouteOrderId(notif.order.id);
                          setActiveBottomTab('routes');
                          setShowNotificationsModal(false);
                        }}
                        className="px-2.5 py-1 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 rounded-lg font-black text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>ملاحة 🧭</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowNotificationsModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* نافذة إثبات التسليم الرقمية الذكية (Proof of Delivery POD) */}
      <DriverProofOfDeliveryModal
        isOpen={Boolean(deliveryConfirmOrder)}
        order={deliveryConfirmOrder}
        onClose={() => setDeliveryConfirmOrder(null)}
        onConfirmDelivery={handleConfirmDelivery}
      />

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

      {/* نافذة اعتماد وتوقيع تسوية وتوريد العهدة النقدية */}
      <DriverSettlementSignModal
        isOpen={showSettlementSignModal}
        onClose={() => setShowSettlementSignModal(false)}
        request={pendingSettlementRequest}
        driverName={currentDriver?.name}
        onApprove={handleApproveSettlement}
        onReject={handleRejectSettlement}
      />

      {/* نافذة نجاح التوريد وعرض السند الموقع */}
      {lastSettlementReceipt && (
        <div className="fixed inset-0 z-[7500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-[#0f172a] border border-emerald-500/50 rounded-3xl p-6 text-white text-center max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-3xl font-black">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-black text-white">تم اعتماد التسوية وتوريد الكاش بنجاح!</h3>
              <p className="text-xs text-slate-300 mt-1">تم تصفير العهدة وتوثيق السند المالي المعتمد برقم:</p>
              <div className="mt-2 py-1.5 px-3 rounded-xl bg-slate-900 border border-emerald-500/40 font-mono font-bold text-emerald-400 text-sm inline-block">
                {lastSettlementReceipt.receiptNumber || 'REC-SANAD'}
              </div>
            </div>

            {lastSettlementReceipt.driverSignature && (
              <div className="p-3 bg-white rounded-xl border border-slate-300 text-right">
                <div className="text-[10px] text-slate-600 font-bold mb-1 text-center">توقيعك الإلكتروني المعتمد:</div>
                <img src={lastSettlementReceipt.driverSignature} alt="Driver Signature" className="h-16 mx-auto object-contain" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setLastSettlementReceipt(null)}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              تم ومتابعة العمل 🚀
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

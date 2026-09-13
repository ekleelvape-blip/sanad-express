import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import OrderDispatch from './components/OrderDispatch';
import OrdersTableView from './components/OrdersTableView';
import FinancialHub from './components/FinancialHub';
import ReportsCenter from './components/ReportsCenter';
import DataExportCenter from './components/DataExportCenter';
import CustomersList from './components/CustomersList';
import UsersManagementHub from './components/UsersManagementHub';
import StoreDriversView from './components/StoreDriversView';
import DriverApp from './components/DriverApp';
import LoginModal from './components/LoginModal';
import TrackingPortal from './components/TrackingPortal';
import SallaIntegrationView from './components/SallaIntegrationView';
import SettingsView from './components/SettingsView';
import DeliveryPricingView from './components/DeliveryPricingView';
import SupportView from './components/SupportView';
import AdminDashboard from './components/AdminDashboard';
import DriverLinkModal from './components/DriverLinkModal';
import { getDriverAppUrl, fetchNetworkInfo } from './utils/driverLink';
import { Lock, Menu, Search, Store, Bell, RefreshCw, Smartphone, Package, CheckCircle2, UserCheck, QrCode } from 'lucide-react';
import { sound } from './utils/sound';

export const socket = io();

export default function App() {

  // كشف نمط الرابط الحالي (لوحة تحكم / تطبيق مندوب / تتبع عميل)
  const getRouteMode = () => {
    if (typeof window === 'undefined') return 'admin';
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (
      path === '/driver' || 
      path.startsWith('/driver/') || 
      path === '/mandoub' ||
      search.includes('mode=driver') || 
      search.includes('driver') ||
      hash.includes('driver')
    ) {
      return 'driver';
    }
    if (path === '/track' || path.startsWith('/track/') || search.includes('track=') || search.includes('mode=track') || hash.includes('track')) {
      return 'track';
    }
    return 'admin';
  };

  const [routeMode, setRouteMode] = useState(getRouteMode);

  useEffect(() => {
    const handlePopState = (event) => {
      setRouteMode(getRouteMode());
      try {
        if (event.state && event.state.tab) {
          setActiveTab(event.state.tab);
        } else {
          const params = new URLSearchParams(window.location.search);
          const tabParam = params.get('tab');
          if (tabParam) {
            setActiveTab(tabParam);
          } else {
            setActiveTab('dashboard');
          }
        }
      } catch (e) {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location);
        url.searchParams.set('tab', newTab);
        window.history.pushState({ tab: newTab }, '', url.toString());
      }
    } catch (e) {}
  };

  const navigateTo = (mode, pathStr) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', pathStr);
      setRouteMode(mode);
    }
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sanad_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('track') || params.get('tracking')) return 'tracking';
      if (params.get('tab')) return params.get('tab');
    }
    return 'dashboard';
  });
  const [trackingInitialNum, setTrackingInitialNum] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/track/')) {
        return decodeURIComponent(path.replace('/track/', '').trim());
      }
      const params = new URLSearchParams(window.location.search);
      return params.get('track') || params.get('tracking') || params.get('number') || '';
    }
    return '';
  });

  const [selectedBranch, setSelectedBranch] = useState(() => {
    try {
      const saved = localStorage.getItem('sanad_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'branch' && u.branchId) return u.branchId;
      }
    } catch (e) {}
    return 'all';
  });
  const DEFAULT_BRANCHES = [
    { id: 'branch-iklil-dammam', code: 'KAYF', orderPrefix: 'SND-KAYF', invoicePrefix: 'INV-KAYF', receiptPrefix: 'REC-KAYF', name: 'فرع إكليل الكيف - الدمام حي طيبة', brand: 'إكليل الكيف', city: 'الدمام', district: 'الدمام - حي طيبة', coords: [26.3583, 50.0501], phone: '0538041826' },
    { id: 'branch-iklil-jubail', code: 'JBL', orderPrefix: 'SND-JBL', invoicePrefix: 'INV-JBL', receiptPrefix: 'REC-JBL', name: 'فرع إكليل فيب - الجبيل البلد', brand: 'إكليل فيب', city: 'الجبيل', district: 'الجبيل البلد - طريق الملك فيصل الغربي', coords: [26.9836, 49.6465], phone: '0535139959' },
    { id: 'branch-vape-sharq', code: 'SHQ', orderPrefix: 'SND-SHQ', invoicePrefix: 'INV-SHQ', receiptPrefix: 'REC-SHQ', name: 'متجر فيب الشرق', brand: 'فيب الشرق', city: 'الدمام', district: 'الدمام - حي طيبة', coords: [26.3583, 50.0501], phone: '0559876543' },
    { id: 'branch-iklil-main', code: 'IKL', orderPrefix: 'SND-IKL', invoicePrefix: 'INV-IKL', receiptPrefix: 'REC-IKL', name: 'متجر إكليل فيب', brand: 'إكليل فيب', city: 'الدمام', district: 'الدمام - حي طيبة', coords: [26.3583, 50.0501], phone: '0538041826' }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentDriverId, setCurrentDriverId] = useState(() => {
    try {
      return localStorage.getItem('sanad_driver_id') || 'drv-1';
    } catch {
      return 'drv-1';
    }
  });

  const [networkInfo, setNetworkInfo] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const handleDriverChange = (id) => {
    setCurrentDriverId(id);
    try {
      localStorage.setItem('sanad_driver_id', id);
    } catch (e) {}
  };

  const fetchData = async () => {
    try {
      const branchParam = selectedBranch !== 'all' ? '?branchId=' + selectedBranch : '';
      const [brRes, drvRes, ordRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/drivers' + branchParam),
        fetch('/api/orders' + branchParam)
      ]);
      if (brRes.ok) {
        const brData = await brRes.json();
        if (Array.isArray(brData) && brData.length > 0) setBranches(brData);
      }
      if (drvRes.ok) setDrivers(await drvRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNetworkInfo().then(info => {
      if (info) setNetworkInfo(info);
    });

    if (currentDriverId) {
      socket.emit('join_driver_room', currentDriverId);
    }

    socket.on('driver_location_changed', (data) => {
      setDrivers(prev => prev.map(d => d.id === data.driverId ? { ...d, coords: data.coords, speed: data.speed, heading: data.heading, lastUpdate: data.lastUpdate } : d));
    });
    socket.on('driver_status_changed', (updatedDriver) => {
      setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d));
    });
    socket.on('order_created', (data) => {
      const newOrder = data?.order || data;
      if (newOrder && newOrder.id) {
        // تصفية فورية حسب الفرع المقفل
        if (selectedBranch !== 'all' && newOrder.branchId && newOrder.branchId !== selectedBranch) {
          return;
        }
        setOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        sound.playOrderAssigned();
      }
    });
    socket.on('orders_updated', (data) => {
      if (Array.isArray(data?.orders)) {
        setOrders(data.orders);
      }
    });
    socket.on('order_updated', ({ order, driver }) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
      if (driver) setDrivers(prev => prev.map(d => d.id === driver.id ? driver : d));
      if (order && (order.assignedDriverId === currentDriverId || order.assignedDriverId === currentDriverId.replace('drv-10', 'drv-'))) {
        sound.playOrderAssigned();
      }
    });
    socket.on('order_assigned_to_me', ({ order, driver }) => {
      sound.triggerBackgroundAlert(order);
      fetchData();
    });
    socket.on('cod_settled', () => fetchData());
    socket.on('driver_created', () => fetchData());
    return () => {
      socket.off('driver_location_changed');
      socket.off('driver_status_changed');
      socket.off('order_created');
      socket.off('orders_updated');
      socket.off('order_updated');
      socket.off('order_assigned_to_me');
      socket.off('cod_settled');
      socket.off('driver_created');
    };
  }, [selectedBranch, currentDriverId]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'branch' && user.branchId) {
      setSelectedBranch(user.branchId);
    } else {
      setSelectedBranch('all');
    }
    localStorage.setItem('sanad_user', JSON.stringify(user));
    setTimeout(() => fetchData(), 50);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sanad_token');
    localStorage.removeItem('sanad_user');
    setBranches([]);
    setDrivers([]);
    setOrders([]);
  };

  const handleAssignOrder = async (orderId, driverId) => {
    try {
      const res = await fetch('/api/orders/' + orderId + '/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId })
      });
      if (res.ok) { sound.playSuccess(); fetchData(); }
    } catch (err) { console.error('Error assigning order:', err); }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const created = await res.json();
        sound.playSuccess();
        fetchData();
        return created;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشل في حفظ الطلب');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const handleUpdateOrderStatus = async (orderId, status, paymentMethod, extra = {}) => {
    try {
      const res = await fetch('/api/orders/' + orderId + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentMethod, ...extra })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error('Error updating order status:', err); }
  };

  const handleUpdateDriverLocation = (driverId, coords, speed, heading) => {
    socket.emit('driver_update_coords', { driverId, coords, speed, heading });
  };

  const handleToggleDriverStatus = async (driverId) => {
    try {
      const res = await fetch('/api/drivers/' + driverId + '/toggle-status', { method: 'POST' });
      if (res.ok) fetchData();
    } catch (err) { console.error('Error toggling driver status:', err); }
  };

  
  // 1. إذا كان الرابط هو رابط المندوب المستقل (/driver)
  if (routeMode === 'driver') {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] selection:bg-cyan-500 selection:text-slate-950 flex flex-col" dir="rtl">
        {/* ترويسة هاتف المندوب المستقلة */}
        <header className="sticky top-0 z-50 bg-[#0a0e18]/95 backdrop-blur-md border-b border-cyan-950/60 px-4 py-2.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <img src="/sanad-express-logo.jpg?v=3" alt="سند SANAD" className="w-9 h-9 rounded-xl object-cover border border-cyan-500/40 shadow-[0_0_12px_rgba(0,210,211,0.3)] shrink-0" />
            <div>
              <div className="font-black text-sm text-white flex items-center gap-1.5">
                <span>سند SANAD</span>
                <span className="text-[10px] bg-cyan-950 text-[#00d2d3] border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">بوابة المندوب المشفرة 🛡️</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">سند SANAD</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-cyan-950/60 border border-cyan-800/40 text-[#00d2d3]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              بوابة مشفرة 256-bit
            </span>
          </div>
        </header>

        {/* واجهة المندوب المستقلة والمخصصة للجوال */}
        <main className="flex-1 w-full max-w-lg mx-auto p-3 sm:p-4">
          <DriverApp
            drivers={drivers}
            orders={orders}
            branches={branches}
            currentDriverId={currentDriverId}
            onChangeDriver={handleDriverChange}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateDriverLocation={handleUpdateDriverLocation}
            onToggleDriverStatus={handleToggleDriverStatus}
            onRefresh={fetchData}
            socket={socket}
          />
        </main>
      </div>
    );
  }

  // 2. إذا كان الرابط هو رابط تتبع العميل المستقل (/track)
  if (routeMode === 'track') {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 font-['Tajawal',sans-serif]" dir="rtl">
        <header className="p-4 border-b border-cyan-950/60 bg-[#0a0e18] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <img src="/sanad-express-logo.jpg" alt="سَنَد" className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 shadow-[0_0_12px_rgba(0,210,211,0.3)]" />
            <div>
              <div className="font-black text-white text-base">سَنَد — تتبع الشحنة المباشر</div>
              <div className="text-[10px] text-[#00d2d3] font-mono">LIVE CUSTOMER TRACKING PORTAL</div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl w-full mx-auto p-4 md:p-6">
          <TrackingPortal 
            defaultTrackingNumber={trackingInitialNum} 
            initialTrackingNumber={trackingInitialNum} 
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] selection:bg-cyan-500 selection:text-slate-950" dir="rtl">
      {!currentUser && <LoginModal branches={branches} onLoginSuccess={handleLoginSuccess} />}

      {/* القائمة الجانبية المعتمدة لسَنَد */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        selectedBranch={selectedBranch}
        branches={branches}
        onSelectBranch={setSelectedBranch}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* المحتوى الرئيسي وشريط الترويسة العلوي */}
      <div className={'flex-1 flex flex-col transition-all duration-300 ' + (sidebarOpen ? 'mr-64' : 'mr-20')}>
        {/* شريط الرأس العلوي (TopBar) المطابق لـ سَنَد.com */}
        <header className="sticky top-0 z-[1000] bg-[#0a0e18]/90 backdrop-blur-md border-b border-cyan-950/50 px-4 py-3 flex items-center justify-between gap-3 shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-[#0f1523] hover:bg-cyan-950/40 border border-cyan-900/40 text-slate-300 hover:text-slate-200 transition-colors cursor-pointer"
              title="تبديل القائمة الجانبية"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* محرك البحث السريع عن شحنة أو عميل */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث عن رقم شحنة SND أو جوال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setTrackingInitialNum(searchQuery.trim());
                    setActiveTab('tracking');
                  }
                }}
                className="w-full bg-[#0f1523] border border-cyan-900/40 rounded-xl pr-9 pl-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* محدد الفروع مع قفل الخصوصية التامة لكل فرع */}
            {currentUser?.role === 'branch' ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-500/50 px-3.5 py-1.5 rounded-xl shadow-sm text-xs">
                <Lock className="w-3.5 h-3.5 text-[#00d2d3]" />
                <span className="font-black text-slate-100">{currentUser.name}</span>
                <span className="text-[10px] bg-cyan-950 text-[#00d2d3] border border-cyan-800/80 px-2 py-0.5 rounded-full font-bold">فرع خاص 🔒</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#0f1523] border border-cyan-900/40 px-3 py-1.5 rounded-xl shadow-sm">
                <Store className="w-3.5 h-3.5 text-[#00d2d3]" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-[#0f1523] text-slate-200 font-bold outline-none cursor-pointer text-xs"
                >
                  <option value="all">👑 كل الفروع (الإدارة العامة - تحكم شامل)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>🏢 {b.name} ({b.brand || b.city})</option>
                  ))}
                </select>
              </div>
            )}

            {/* زر التحديث الفوري */}
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-[#0f1523] hover:bg-cyan-950/40 border border-cyan-900/40 text-slate-300 hover:text-slate-200 transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            
            {/* زر ورابط المندوب المستقل المباشر مع دعم الـ QR والجوال */}
            <div className="flex items-center gap-1.5 bg-cyan-950/70 border border-cyan-800/80 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#00d2d3] animate-pulse"></span>
              <span className="text-[11px] text-slate-300 font-bold">تطبيق المندوب:</span>
              <button
                type="button"
                onClick={() => setShowDriverModal(true)}
                className="text-[11px] font-mono font-bold text-[#00d2d3] hover:underline flex items-center gap-1 cursor-pointer"
                title="عرض رابط وتطبيق المندوب للجوال والـ QR"
              >
                <span>/driver</span>
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = getDriverAppUrl(networkInfo);
                  navigator.clipboard?.writeText(url);
                  alert('تم نسخ رابط المندوب للجوال بنجاح! يمكنك إرساله للمناديب على الواتساب:\n' + url);
                }}
                className="p-1 text-slate-400 hover:text-[#00d2d3] transition-colors cursor-pointer"
                title="نسخ رابط المندوب للجوال"
              >
                📋
              </button>
            </div>

            {/* زر تتبع سريع */}
            <button
              onClick={() => setActiveTab('tracking')}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 text-[#00d2d3] font-black shadow-[0_0_10px_rgba(0,210,211,0.2)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>تتبع شحنة</span>
            </button>
          </div>
        </header>

        {/* محتوى الصفحات والتبويبات */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">

          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              drivers={drivers}
              branches={branches}
              selectedBranch={selectedBranch}
              onSelectBranch={setSelectedBranch}
              onSelectTab={handleTabChange}
              onSelectDriver={(d) => { setCurrentDriverId(d.id); setActiveTab('driver_app'); }}
            />
          )}

          {['orders', 'delivery_group', 'delivery_ready', 'delivery_assigned', 'delivery_intransit', 'delivery_delivered', 'cancelled'].includes(activeTab) && (
            <OrdersTableView activeTab={activeTab} onSelectTab={handleTabChange}
              orders={orders}
              drivers={drivers}
              branches={branches}
              selectedBranch={selectedBranch}
              currentUser={currentUser}
              onAssignOrder={handleAssignOrder}
              onCreateOrder={handleCreateOrder}
              onRefresh={fetchData}
            />
          )}

          {(activeTab === 'branches_control' || activeTab === 'driver_tracking') && (
            <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl">
              <AdminDashboard
                branches={branches}
                drivers={drivers}
                orders={orders}
                selectedBranch={selectedBranch}
                onSelectBranch={setSelectedBranch}
                onSelectDriver={(d) => { setCurrentDriverId(d.id); setActiveTab('driver_app'); }}
                onSwitchTab={handleTabChange}
              />
            </div>
          )}

          {['store_drivers', 'users_group', 'managers', 'permissions', 'driver_inventory', 'ratings', 'locations'].includes(activeTab) && (
            <UsersManagementHub
              activeTab={activeTab}
              onSelectTab={handleTabChange}
              branches={branches}
              drivers={drivers}
              orders={orders}
              onRefresh={fetchData}
              onSwitchToTracking={() => setActiveTab('driver_tracking')}
              onOpenDriverApp={(d) => { setCurrentDriverId(d.id); setActiveTab('driver_app'); }}
            />
          )}

          {['settlements', 'cod_transactions', 'driver_invoices', 'wallet'].includes(activeTab) && (
            <FinancialHub
              drivers={drivers}
              branches={branches}
              orders={orders}
              onRefresh={fetchData}
              activeTab={activeTab}
            />
          )}

          {activeTab === 'delivery_pricing' && (
            <DeliveryPricingView
              branches={branches}
            />
          )}

          {['reports', 'delivery_reports', 'cod_collections', 'driver_performance', 'driver_dues', 'ratings_report', 'neighborhoods', 'friday_invoices'].includes(activeTab) && (
            <ReportsCenter
              activeTab={activeTab}
              onSelectTab={handleTabChange}
              drivers={drivers}
              branches={branches}
              orders={orders}
              selectedBranch={selectedBranch}
            />
          )}

          {['export_group', 'export_driver_orders', 'export_warehouse_orders', 'export_inventory', 'export_reports'].includes(activeTab) && (
            <DataExportCenter
              activeTab={activeTab}
              onSelectTab={handleTabChange}
              drivers={drivers}
              branches={branches}
              orders={orders}
              selectedBranch={selectedBranch}
            />
          )}

          {activeTab === 'tracking' && (
            <TrackingPortal 
              defaultTrackingNumber={trackingInitialNum} 
              initialTrackingNumber={trackingInitialNum}
              onClose={() => handleTabChange('dashboard')} 
            />
          )}

          {activeTab === 'salla_integration' && (
            <SallaIntegrationView branches={branches} />
          )}

          {['system_settings', 'delivery_settings', 'printer_settings'].includes(activeTab) && (
            <SettingsView 
              branches={branches} 
              initialSubTab={activeTab === 'printer_settings' ? 'printers' : (activeTab === 'delivery_settings' ? 'pricing' : 'rules')}
            />
          )}

          {activeTab === 'support' && <SupportView />}

          {activeTab === 'driver_app' && (
            <DriverApp
              drivers={drivers}
              orders={orders}
              branches={branches}
              currentDriverId={currentDriverId}
              onChangeDriver={setCurrentDriverId}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateDriverLocation={handleUpdateDriverLocation}
              onToggleDriverStatus={handleToggleDriverStatus}
              onRefresh={fetchData}
              socket={socket}
            />
          )}
        </main>
      </div>

      <DriverLinkModal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        networkInfo={networkInfo}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import DriverProfileView from './DriverProfileView';
import { getDriverAppUrl, fetchNetworkInfo } from '../utils/driverLink';
import {
  Users, Shield, Package, Star, MapPin, Plus, Check, Search, Phone,
  Mail, Award, Clock, DollarSign, Sparkles, CheckCircle2, ChevronRight,
  SlidersHorizontal, AlertCircle, Laptop, Truck, Printer, ShoppingBag,
  Eye, EyeOff, Send, Trash2, Edit, RefreshCw, X, Key, Lock, ExternalLink,
  ArrowRight, Home, UserCheck, ShieldCheck, Activity, BarChart3
} from 'lucide-react';

export default function UsersManagementHub({
  activeTab,
  onSelectTab,
  branches = [],
  drivers = [],
  orders = [],
  onRefresh,
  onSwitchToTracking,
  onOpenDriverApp
}) {
  // تحديد التبويب الحالي بناء على التبويب الممرر
  const getInitialTab = () => {
    if (activeTab === 'store_drivers' || activeTab === 'users_group') return 'drivers';
    if (['managers', 'permissions', 'driver_inventory', 'ratings', 'locations'].includes(activeTab)) {
      return activeTab;
    }
    return 'managers';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [managers, setManagers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);

  // حالة البحث والتصفية
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // نوافذ الحوار المنبثقة
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    fetchNetworkInfo().then(info => {
      if (info) setNetworkInfo(info);
    });
  }, []);
  const [selectedDriverForProfile, setSelectedDriverForProfile] = useState(null);

  // إظهار كلمات المرور للمناديب
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  // بيانات النماذج
  const [newManager, setNewManager] = useState({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    role: 'مشرف فرع',
    branchName: branches[0]?.name || 'فرع إكليل الدمام',
    status: 'نشط'
  });

  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    password: '',
    nationalId: '',
    email: '',
    vehicle: 'سيارة توصيل',
    branchId: branches[0]?.id || 'branch-iklil-dammam'
  });

  const [newEquipment, setNewEquipment] = useState({
    assetType: 'جهاز نقاط بيع مدى الذكي (Geidea POS)',
    serialNumber: '',
    driverName: drivers[0]?.name || 'يونس',
    branchName: branches[0]?.name || 'فرع إكليل الدمام',
    status: 'ممتاز / بالخدمة'
  });

  // مزامنة التبويب عند تغير activeTab من الخارج
  useEffect(() => {
    if (activeTab === 'store_drivers' || activeTab === 'users_group') {
      setCurrentTab('drivers');
    } else if (['managers', 'permissions', 'driver_inventory', 'ratings', 'locations'].includes(activeTab)) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  // جلب البيانات الإدارية
  const fetchHubData = async () => {
    setLoading(true);
    try {
      const [mRes, eRes, rRes, zRes] = await Promise.all([
        fetch('/api/managers'),
        fetch('/api/equipment'),
        fetch('/api/ratings'),
        fetch('/api/zones')
      ]);
      if (mRes.ok) setManagers(await mRes.json());
      if (eRes.ok) setEquipment(await eRes.json());
      if (rRes.ok) setRatings(await rRes.json());
      if (zRes.ok) setZones(await zRes.json());
    } catch (err) {
      console.error('Failed to fetch hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  // مصفوفة الصلاحيات (RBAC)
  const [rolesPermissions, setRolesPermissions] = useState([
    {
      id: 'admin',
      name: 'المدير العام (Super Admin)',
      badge: 'إدارة كاملة',
      color: 'from-amber-500 to-amber-600',
      description: 'صلاحيات مطلقة لإدارة المنظومة والأسطول والمستخدمين والتقارير المالية',
      viewOrders: true,
      assignDrivers: true,
      codSettle: true,
      priceEdit: true,
      reportsExport: true
    },
    {
      id: 'supervisor',
      name: 'مشرف الفرع (Branch Supervisor)',
      badge: 'عمليات ميدانية',
      color: 'from-cyan-500 to-blue-600',
      description: 'إدارة شحنات الفرع، متابعة مناديب الحي، وإصدار المانيفست وتوريد الكاش',
      viewOrders: true,
      assignDrivers: true,
      codSettle: true,
      priceEdit: false,
      reportsExport: true
    },
    {
      id: 'dispatcher',
      name: 'مسؤول التوزيع الميداني (Dispatcher)',
      badge: 'تحكم بالرادار',
      color: 'from-teal-500 to-emerald-600',
      description: 'توزيع وإسناد الطلبات ومراقبة رادار المناديب المباشر وضمان دقة SLA',
      viewOrders: true,
      assignDrivers: true,
      codSettle: false,
      priceEdit: false,
      reportsExport: false
    },
    {
      id: 'accountant',
      name: 'المحاسب المالي (Financial Officer)',
      badge: 'شؤون مالية',
      color: 'from-purple-500 to-indigo-600',
      description: 'تسوية الكاش، تدقيق تحصيلات COD، ومطابقة محافظ المناديب والخزينة',
      viewOrders: true,
      assignDrivers: false,
      codSettle: true,
      priceEdit: true,
      reportsExport: true
    }
  ]);

  const togglePermission = (roleIdx, field) => {
    setRolesPermissions(prev => {
      const copy = [...prev];
      copy[roleIdx] = { ...copy[roleIdx], [field]: !copy[roleIdx][field] };
      return copy;
    });
  };

  const handleTabChange = (tabKey) => {
    setCurrentTab(tabKey);
    setSearchQuery('');
    if (onSelectTab) {
      if (tabKey === 'drivers') onSelectTab('store_drivers');
      else onSelectTab(tabKey);
    }
  };

  // توليد كلمة مرور عشوائية للمندوب
  const generateRandomPassword = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewDriver(prev => ({ ...prev, password: randomPin }));
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // إضافة مشرف / موظف جديد
  const handleAddManagerSubmit = async (e) => {
    e.preventDefault();
    if (!newManager.name.trim() || !newManager.phone.trim()) {
      alert('يرجى إدخال اسم الموظف ورقم الجوال');
      return;
    }

    try {
      const res = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newManager)
      });
      if (res.ok) {
        const created = await res.json();
        setManagers(prev => [created, ...prev]);
        setShowAddManagerModal(false);
        setNewManager({
          name: '',
          phone: '',
          email: '',
          nationalId: '',
          role: 'مشرف فرع',
          branchName: branches[0]?.name || 'فرع إكليل الدمام',
          status: 'نشط'
        });
        alert('🎉 تم إضافة الموظف/المشرف بنجاح!');
      } else {
        const err = await res.json();
        alert(err.error || 'فشلت إضافة الموظف');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في الاتصال بالخادم');
    }
  };

  // حذف مشرف
  const handleDeleteManager = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف المشرف "${name}"؟`)) return;
    try {
      const res = await fetch(`/api/managers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setManagers(prev => prev.filter(m => m.id !== id));
      } else {
        alert('فشل حذف المشرف');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // تبديل حالة المشرف (نشط / معلق)
  const handleToggleManagerStatus = async (mgr) => {
    const newStatus = mgr.status === 'نشط' ? 'معلق' : 'نشط';
    try {
      const res = await fetch(`/api/managers/${mgr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setManagers(prev => prev.map(m => m.id === mgr.id ? { ...m, status: newStatus } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // إضافة مندوب جديد
  const handleAddDriverSubmit = async (e) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.phone) return alert('يرجى تعبئة اسم السائق ورقم الجوال');
    if (!newDriver.password) return alert('يرجى تحديد كلمة مرور لحساب المندوب');

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDriver.name,
          phone: newDriver.phone,
          username: newDriver.phone,
          password: newDriver.password,
          nationalId: newDriver.nationalId,
          email: newDriver.email,
          vehicle: newDriver.vehicle || 'سيارة توصيل',
          branchId: newDriver.branchId || branches[0]?.id || 'branch-iklil-dammam'
        })
      });
      if (res.ok) {
        alert('🎉 تم إنشاء حساب المندوب بنجاح!\n\nاسم المستخدم: ' + newDriver.phone + '\nكلمة المرور: ' + newDriver.password);
        setShowAddDriverModal(false);
        setNewDriver({
          name: '',
          phone: '',
          password: '',
          nationalId: '',
          email: '',
          vehicle: 'سيارة توصيل',
          branchId: branches[0]?.id || 'branch-iklil-dammam'
        });
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'فشلت إضافة السائق');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // إضافة عهدة جديدة
  const handleAddEquipmentSubmit = async (e) => {
    e.preventDefault();
    if (!newEquipment.serialNumber.trim() || !newEquipment.driverName) {
      alert('يرجى إدخال الرقم التسلسلي واختيار السائق المستلم');
      return;
    }

    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipment)
      });
      if (res.ok) {
        const created = await res.json();
        setEquipment(prev => [created, ...prev]);
        setShowAddEquipmentModal(false);
        setNewEquipment({
          assetType: 'جهاز نقاط بيع مدى الذكي (Geidea POS)',
          serialNumber: '',
          driverName: drivers[0]?.name || 'يونس',
          branchName: branches[0]?.name || 'فرع إكليل الدمام',
          status: 'ممتاز / بالخدمة'
        });
        alert('🎉 تم تسجيل وصرف العهدة بنجاح!');
      } else {
        const err = await res.json();
        alert(err.error || 'فشل تسجيل العهدة');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // استرجاع / حذف عهدة
  const handleDeleteEquipment = async (id, assetType, driverName) => {
    if (!window.confirm(`هل أنت متأكد من استرجاع وإلغاء تسجيل العهدة (${assetType}) المسندة إلى (${driverName})؟`)) return;
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEquipment(prev => prev.filter(e => e.id !== id));
      } else {
        alert('فشل استرجاع العهدة');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // إذا تم اختيار سائق لعرض ملفه الشخصي الكامل
  if (selectedDriverForProfile) {
    return (
      <DriverProfileView
        driver={selectedDriverForProfile}
        orders={orders}
        branches={branches}
        onBack={() => setSelectedDriverForProfile(null)}
        onRefresh={onRefresh}
        onOpenDriverApp={onOpenDriverApp}
      />
    );
  }

  // تصفية المشرفين
  const filteredManagers = managers.filter(m => {
    const matchesSearch = !searchQuery.trim() || (
      (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.phone && m.phone.includes(searchQuery)) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.role && m.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.branchName && m.branchName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const matchesRole = roleFilter === 'all' || m.role?.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  // تصفية المناديب
  const filteredDrivers = drivers.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.phone && d.phone.includes(q)) ||
      (d.nationalId && d.nationalId.includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.vehicle && d.vehicle.toLowerCase().includes(q))
    );
  });

  // تصفية العهد
  const filteredEquipment = equipment.filter(eq => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (eq.assetType && eq.assetType.toLowerCase().includes(q)) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(q)) ||
      (eq.driverName && eq.driverName.toLowerCase().includes(q)) ||
      (eq.branchName && eq.branchName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-100" dir="rtl">
      
      {/* 1. الترويسة التنفيذية الموحدة لمركز إدارة المستخدمين والأسطول */}
      <div className="bg-gradient-to-r from-[#070b14] via-[#0c1424] to-[#070b14] border border-cyan-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-[#00d2d3]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00d2d3]/10 border border-[#00d2d3]/30 flex items-center justify-center text-[#00d2d3] shadow-[0_0_20px_rgba(0,210,211,0.2)]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-wide">مركز إدارة المستخدمين والأسطول الميداني</h1>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/40 font-bold">
                    منظومة سَنَد الذكية
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  التحكم الموحد بالكوادر الإشرافية، أسطول المناديب، مصفوفة الصلاحيات (RBAC)، والعهد الميدانية
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchHubData}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-900/40 text-slate-300 hover:text-[#00d2d3] hover:border-[#00d2d3]/50 transition-all cursor-pointer shadow-sm"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00d2d3]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onSwitchToTracking}
              className="flex items-center gap-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-[#00d2d3] border border-cyan-800/50 shadow-[0_0_12px_rgba(0,210,211,0.15)] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>تتبع الرادار المباشر</span>
            </button>
          </div>
        </div>

        {/* 2. بطاقات مؤشرات الأداء الحيوية (KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-cyan-950/60 text-xs">
          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-[#00d2d3]/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-[#00d2d3] shrink-0 shadow-[0_0_10px_rgba(0,210,211,0.15)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">الكادر الإداري والإشرافي</div>
              <div className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{managers.length}</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">100% نشط</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">أسطول المناديب الميدانيين</div>
              <div className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{drivers.length} مندوب</span>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">بالخدمة</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">الأجهزة والعهد الميدانية</div>
              <div className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{equipment.length} عهدة</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">POS وطابعات</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-purple-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/50 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
              <Star className="w-5 h-5 fill-purple-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">مؤشر جودة الخدمة (SLA)</div>
              <div className="text-base font-black text-amber-400 mt-0.5 flex items-center gap-1.5">
                <span>⭐ 4.92</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">98.8% دقة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. شريط التبويبات الفاخر الموحد (Unified Navigation Bar) */}
      <div className="bg-[#090f1d] border border-cyan-900/50 p-1.5 rounded-2xl flex flex-wrap gap-1.5 shadow-xl text-xs">
        <button
          type="button"
          onClick={() => handleTabChange('managers')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'managers'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>المشرفين والمدراء</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${currentTab === 'managers' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
            {managers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('drivers')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'drivers'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>أسطول المناديب</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${currentTab === 'drivers' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
            {drivers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('permissions')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'permissions'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>الصلاحيات (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('driver_inventory')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'driver_inventory'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>عهدة الأجهزة</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${currentTab === 'driver_inventory' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
            {equipment.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ratings')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'ratings'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>تقييمات وجودة SLA</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('locations')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'locations'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>نطاقات التغطية</span>
        </button>
      </div>

      {/* ========================================================================================= */}
      {/* 4. تبويب المشرفين والمدراء */}
      {/* ========================================================================================= */}
      {currentTab === 'managers' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden space-y-4 text-slate-100">
          {/* شريط الإجراءات والبحث */}
          <div className="p-5 border-b border-cyan-900/40 flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d]/50">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00d2d3]" />
                <span>فريق الإشراف والإدارة الميدانية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">مدراء الفروع، مشرفو العمليات، ومسؤولو توزيع أسطول سَنَد</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* تصفية حسب الدور */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="تصفية حسب الدور الوظيفي"
                  className="bg-[#090f1d] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#00d2d3] cursor-pointer"
                >
                  <option value="all">كافة الأدوار الإدارية</option>
                  <option value="مدير">مدراء عامين وفروع</option>
                  <option value="مشرف">مشرفو عمليات</option>
                  <option value="فرز">مسؤولو الفرز والتجهيز</option>
                  <option value="توزيع">مسؤولو التوزيع</option>
                </select>
              </div>

              {/* حقل البحث السريع */}
              <div className="relative w-56 sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، الجوال، أو الفرع..."
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl pr-3 pl-9 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* زر إضافة موظف جديد */}
              <button
                type="button"
                onClick={() => setShowAddManagerModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.35)] text-xs px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة موظف / مشرف</span>
              </button>
            </div>
          </div>

          {/* جدول المشرفين */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3.5 px-4">المشرف / المدير</th>
                  <th className="py-3.5 px-4">الدور الوظيفي</th>
                  <th className="py-3.5 px-4">الفرع المسؤول عنه</th>
                  <th className="py-3.5 px-4">رقم الجوال والاتصال</th>
                  <th className="py-3.5 px-4">البريد الإلكتروني</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">آخر نشاط</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredManagers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500 font-bold">
                      لا يوجد موظفون يطابقون شروط البحث
                    </td>
                  </tr>
                ) : (
                  filteredManagers.map(m => (
                    <tr key={m.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 text-[#00d2d3] font-black flex items-center justify-center shrink-0 border border-cyan-800/60 shadow-[0_0_10px_rgba(0,210,211,0.15)]">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-white text-sm">{m.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono font-normal">ID: {m.id}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 text-[#00d2d3] border border-cyan-800/50 font-bold text-[11px]">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{m.branchName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${m.phone}`}
                            className="text-slate-200 hover:text-[#00d2d3] font-bold inline-flex items-center gap-1"
                          >
                            <span dir="ltr">{m.phone}</span>
                            <Phone className="w-3 h-3 text-emerald-400" />
                          </a>
                          <a
                            href={`https://wa.me/966${(m.phone || '').replace(/\D/g, '').replace(/^966/, '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 hover:text-emerald-300"
                            title="محادثة واتساب مباشرة"
                          >
                            <Send className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                        <span dir="ltr">{m.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleManagerStatus(m)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] transition-all cursor-pointer ${
                            m.status === 'نشط'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60'
                          }`}
                          title="انقر لتبديل الحالة"
                        >
                          {m.status === 'نشط' ? '● نشط' : '○ معلق'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{m.lastActive}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteManager(m.id, m.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/50 transition-colors cursor-pointer"
                          title="حذف المشرف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 5. تبويب أسطول المناديب الميدانيين */}
      {/* ========================================================================================= */}
      {currentTab === 'drivers' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden space-y-4 text-slate-100">
          {/* شريط الإجراءات والبحث */}
          <div className="p-5 border-b border-cyan-900/40 flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d]/50">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span>أسطول المناديب الميدانيين وسائقي المتجر</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">متابعة حسابات التطبيق الميداني، بيانات الدخول، الأرصدة، وأداء المناديب</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* حقل البحث السريع */}
              <div className="relative w-64 sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، الجوال، الهوية، أو المركبة..."
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl pr-3 pl-9 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* زر إضافة مندوب جديد */}
              <button
                type="button"
                onClick={() => setShowAddDriverModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.35)] text-xs px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مندوب جديد</span>
              </button>
            </div>
          </div>

          {/* جدول المناديب */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3.5 px-4">السائق الميداني</th>
                  <th className="py-3.5 px-4">رقم الجوال (اسم المستخدم)</th>
                  <th className="py-3.5 px-4">كلمة المرور وتطبيق المندوب</th>
                  <th className="py-3.5 px-4">المركبة</th>
                  <th className="py-3.5 px-4">رقم الهوية / الإقامة</th>
                  <th className="py-3.5 px-4">الفرع</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">رصيد الكاش / المحفظة</th>
                  <th className="py-3.5 px-4 text-center">الملف الشخصي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-500 font-bold">
                      لا يوجد مناديب يطابقون شروط البحث
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map(d => (
                    <tr key={d.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedDriverForProfile(d)}
                          className="font-black text-[#00d2d3] hover:underline cursor-pointer text-right flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-950/70 text-emerald-400 font-black flex items-center justify-center border border-emerald-800/50">
                            {d.name.charAt(0)}
                          </div>
                          <span>{d.name}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <a
                          href={`tel:${d.phone}`}
                          className="text-slate-200 hover:text-[#00d2d3] inline-flex items-center gap-1 font-mono"
                        >
                          <span dir="ltr">{d.phone}</span>
                          <Phone className="w-3 h-3 text-emerald-400" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-slate-900 border border-cyan-900/60 text-white font-bold tracking-wider">
                            {visiblePasswords[d.id] ? (d.password || '123456') : '••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(d.id)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="إظهار / إخفاء كلمة المرور"
                          >
                            {visiblePasswords[d.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`https://wa.me/966${(d.phone || '').replace(/\D/g, '').replace(/^966/, '').replace(/^0/, '')}?text=${encodeURIComponent(
                              `مرحباً بك يا ${d.name} في منصة سَنَد.\nبيانات دخولك لتطبيق المندوب الميداني:\nرابط التطبيق: ${getDriverAppUrl(networkInfo)}\nاسم المستخدم: ${d.phone}\nكلمة المرور: ${d.password || '123456'}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="إرسال بيانات الدخول للمندوب عبر الواتساب"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {d.vehicle || 'سيارة توصيل'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {d.nationalId || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {branches.find(b => b.id === d.branchId)?.name || 'فرع إكليل الدمام'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold text-[10px]">
                          نشط / بالخدمة
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {d.walletBalance !== undefined
                          ? `${d.walletBalance.toFixed(2)} ﷼`
                          : `${(d.cashOnHand || 0).toFixed(2)} ﷼`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDriverForProfile(d)}
                            className="p-1.5 rounded-lg bg-cyan-950/60 text-[#00d2d3] border border-cyan-800/40 hover:bg-cyan-900/60 transition-colors cursor-pointer"
                            title="عرض الملف الإداري والطلبات"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDriverApp && onOpenDriverApp(d)}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-white transition-colors cursor-pointer"
                            title="محاكاة واجهة التطبيق الميداني"
                          >
                            <Laptop className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 6. تبويب مصفوفة الصلاحيات (RBAC) */}
      {/* ========================================================================================= */}
      {currentTab === 'permissions' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-6 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-cyan-900/40">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00d2d3]" />
                <span>مصفوفة الأدوار والصلاحيات (Role-Based Access Control)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد وتخصيص صلاحيات الوصول والتحكم لكل رتبة وظيفية بالمنظومة وفق سياسات الأمن الرقمي
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              <span>نظام الأمان النشط المشفر سَنَد v2.6</span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-4 px-4">المسمى الوظيفي / الدور</th>
                  <th className="py-4 px-4 text-center">عرض الطلبات والشحنات</th>
                  <th className="py-4 px-4 text-center">إسناد وتعديل المناديب</th>
                  <th className="py-4 px-4 text-center">تسوية الكاش والخزينة (COD)</th>
                  <th className="py-4 px-4 text-center">تعديل الأسعار والإعدادات</th>
                  <th className="py-4 px-4 text-center">تصدير التقارير وExcel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rolesPermissions.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{r.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r ${r.color}`}>
                          {r.badge}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-1 max-w-md">{r.description}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(idx, 'viewOrders')}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          r.viewOrders
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 hover:text-slate-400'
                        }`}
                        title="تفعيل / تعطيل الصلاحية"
                      >
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(idx, 'assignDrivers')}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          r.assignDrivers
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 hover:text-slate-400'
                        }`}
                        title="تفعيل / تعطيل الصلاحية"
                      >
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(idx, 'codSettle')}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          r.codSettle
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 hover:text-slate-400'
                        }`}
                        title="تفعيل / تعطيل الصلاحية"
                      >
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(idx, 'priceEdit')}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          r.priceEdit
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 hover:text-slate-400'
                        }`}
                        title="تفعيل / تعطيل الصلاحية"
                      >
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(idx, 'reportsExport')}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          r.reportsExport
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 hover:text-slate-400'
                        }`}
                        title="تفعيل / تعطيل الصلاحية"
                      >
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#090f1d] border border-cyan-900/40 p-4 rounded-2xl flex items-center gap-3 text-xs text-slate-400">
            <Shield className="w-5 h-5 text-[#00d2d3] shrink-0" />
            <span>
              يتم تطبيق وتحديث الصلاحيات بشكل فوري على جلسات الموظفين والمدراء دون الحاجة لإعادة تسجيل الدخول.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 7. تبويب عهدة السائقين والأجهزة */}
      {/* ========================================================================================= */}
      {currentTab === 'driver_inventory' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden space-y-4 text-slate-100">
          {/* شريط الإجراءات والبحث */}
          <div className="p-5 border-b border-cyan-900/40 flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d]/50">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>إدارة عهدة وأجهزة المناديب الميدانيين</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة أجهزة نقاط البيع (POS مدى)، طابعات البوالص المحمولة، وحقائب العزل الحراري المسلمة للأسطول
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* حقل البحث السريع */}
              <div className="relative w-60 sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الجهاز، اسم السائق، أو النوع..."
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl pr-3 pl-9 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* زر صرف عهدة جديدة */}
              <button
                type="button"
                onClick={() => setShowAddEquipmentModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.35)] text-xs px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>صرف عهدة جديدة</span>
              </button>
            </div>
          </div>

          {/* جدول العهد */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3.5 px-4">نوع الجهاز / العهدة</th>
                  <th className="py-3.5 px-4">الرقم التسلسلي (S/N)</th>
                  <th className="py-3.5 px-4">السائق المستلم</th>
                  <th className="py-3.5 px-4">الفرع</th>
                  <th className="py-3.5 px-4">تاريخ التسليم</th>
                  <th className="py-3.5 px-4">الحالة التشغيلية</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 font-bold">
                      لا توجد عهد أو أجهزة تطابق شروط البحث
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map(eq => (
                    <tr key={eq.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center border border-amber-800/50 shrink-0">
                          {eq.assetType.includes('POS') ? (
                            <Laptop className="w-4 h-4" />
                          ) : eq.assetType.includes('طابعة') ? (
                            <Printer className="w-4 h-4" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                        </div>
                        <span>{eq.assetType}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {eq.serialNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#00d2d3]">
                        {eq.driverName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{eq.branchName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{eq.assignedDate}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-[10px]">
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteEquipment(eq.id, eq.assetType, eq.driverName)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/50 transition-colors cursor-pointer"
                          title="استرجاع وإلغاء تسجيل العهدة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 8. تبويب تقييمات وأداء المناديب (SLA) */}
      {/* ========================================================================================= */}
      {currentTab === 'ratings' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-6 text-slate-100">
          <div className="pb-4 border-b border-cyan-900/40">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>مؤشرات أداء وجودة المناديب (SLA & Delivery Quality)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تقييمات العملاء الميدانية، سرعة الاستجابة، ونسبة التسليم في الوقت المحدد للأسطول
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#090f1d] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-400 font-sans">متوسط تقييم الأسطول:</div>
              <div className="text-xl font-black text-amber-400 mt-1">⭐ 4.92 / 5.0</div>
            </div>
            <div className="bg-[#090f1d] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-400 font-sans">نسبة التوصيل بالوقت المحدد:</div>
              <div className="text-xl font-black text-emerald-400 mt-1">98.8%</div>
            </div>
            <div className="bg-[#090f1d] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-400 font-sans">متوسط زمن التوصيل للمشوار:</div>
              <div className="text-xl font-black text-[#00d2d3] mt-1">34 دقيقة</div>
            </div>
            <div className="bg-[#090f1d] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-400 font-sans">معدل البلاغات والشكاوى:</div>
              <div className="text-xl font-black text-white mt-1">0.6% فقط</div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3 px-4">السائق</th>
                  <th className="py-3 px-4 text-center">التقييم</th>
                  <th className="py-3 px-4 text-center">إجمالي المشاوير</th>
                  <th className="py-3 px-4 text-center">الالتزام بالموعد (SLA)</th>
                  <th className="py-3 px-4">شارة التميز</th>
                  <th className="py-3 px-4">انطباع وثناء العملاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ratings.map((r, idx) => (
                  <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-black text-white">{r.driverName}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-400 font-mono">⭐ {r.rating}</td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-300">{r.totalTrips}</td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-emerald-400">{r.onTimePercent}%</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50 font-bold text-[10px]">
                        {r.badge}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 italic">"{r.customerPraise}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 9. تبويب نطاقات وفروع التغطية */}
      {/* ========================================================================================= */}
      {currentTab === 'locations' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-6 text-slate-100">
          <div className="pb-4 border-b border-cyan-900/40">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#00d2d3]" />
              <span>نطاقات وفروع التغطية الجغرافية وأسعار الشحن</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مناطق التوصيل السريع بالمنطقة الشرقية، الرسوم الرسمية المعتمدة، وزمن التوصيل المتوقع (SLA)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {zones.map(z => (
              <div key={z.id} className="p-5 rounded-2xl bg-[#090f1d] border border-cyan-900/40 space-y-3 shadow-sm hover:border-[#00d2d3]/40 transition-all">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-950/60">
                  <span className="font-black text-white text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#00d2d3]" />
                    <span>{z.name}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-[10px]">
                    {z.status || 'نشط'}
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div><span className="text-slate-400 font-bold">الأحياء المغطاة: </span>{z.coverage}</div>
                  <div><span className="text-slate-400 font-bold">المتجر الرئيسي: </span>{z.store}</div>
                </div>
                <div className="pt-2 border-t border-cyan-950/60 flex items-center justify-between font-mono">
                  <div><span className="text-slate-400 font-sans">زمن التوصيل: </span><strong className="text-slate-200">{z.slaTime}</strong></div>
                  <div><span className="text-slate-400 font-sans">رسم التوصيل: </span><strong className="text-[#00d2d3] text-base">{z.fee} ﷼</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 10. نافذة منبثقة: إضافة موظف / مشرف جديد */}
      {/* ========================================================================================= */}
      {showAddManagerModal && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
          <div className="bg-[#0f1523] border border-cyan-800/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 text-slate-100" dir="rtl">
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00d2d3]" />
                <span>إضافة موظف / مشرف إداري جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddManagerModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManagerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الموظف بالكامل *:</label>
                <input
                  type="text"
                  required
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  placeholder="مثال: تركي الحربي"
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الجوال *:</label>
                  <input
                    type="text"
                    required
                    value={newManager.phone}
                    onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الدور الوظيفي *:</label>
                  <select
                    value={newManager.role}
                    onChange={(e) => setNewManager({ ...newManager, role: e.target.value })}
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
                  >
                    <option value="مشرف فرع">مشرف فرع (Supervisor)</option>
                    <option value="مدير عام">مدير عام (General Manager)</option>
                    <option value="مسؤول التوزيع الميداني">مسؤول التوزيع الميداني (Dispatcher)</option>
                    <option value="مسؤول الفرز والتجهيز">مسؤول الفرز والتجهيز</option>
                    <option value="محاسب مالي">محاسب مالي (Financial Officer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الفرع التابع له:</label>
                  <select
                    value={newManager.branchName}
                    onChange={(e) => setNewManager({ ...newManager, branchName: e.target.value })}
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                    <option value="المركز الرئيسي">المركز الرئيسي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={newManager.email}
                    onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                    placeholder="user@sanad.com"
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهوية الوطنية / الإقامة:</label>
                <input
                  type="text"
                  value={newManager.nationalId}
                  onChange={(e) => setNewManager({ ...newManager, nationalId: e.target.value })}
                  placeholder="1XXXXXXXXX"
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-cyan-900/50">
                <button
                  type="button"
                  onClick={() => setShowAddManagerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.35)] transition-all cursor-pointer"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 11. نافذة منبثقة: إضافة مندوب جديد */}
      {/* ========================================================================================= */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
          <div className="bg-[#0f1523] border border-cyan-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 text-slate-100" dir="rtl">
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span>إضافة مندوب ميداني جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDriverModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDriverSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم السائق بالكامل *:</label>
                <input
                  type="text"
                  required
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder="مثال: فيصل العتيبي"
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3]"
                />
              </div>

              {/* بطاقة معلومات الحساب وتطبيق المندوب */}
              <div className="bg-cyan-950/40 border border-cyan-800/60 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-[#00d2d3] font-black text-xs">
                  <Key className="w-4 h-4" />
                  <span>بيانات دخول المندوب لتطبيق سَنَد</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span>رقم الجوال (اسم المستخدم) *:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">هو اسم المستخدم للدخول</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>كلمة المرور *:</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-[#00d2d3] hover:underline font-bold"
                    >
                      توليد كلمة مرور عشوائية 🎲
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      required
                      value={newDriver.password}
                      onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                      placeholder="أدخل كلمة مرور المندوب (مثال: 123456)"
                      className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 pr-3 pl-10 text-slate-100 outline-none focus:border-[#00d2d3] font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white p-0.5"
                    >
                      {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نوع المركبة:</label>
                  <input
                    type="text"
                    value={newDriver.vehicle}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicle: e.target.value })}
                    placeholder="مثال: يارس 2023"
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الفرع المسند له:</label>
                  <select
                    value={newDriver.branchId}
                    onChange={(e) => setNewDriver({ ...newDriver, branchId: e.target.value })}
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهوية / الإقامة:</label>
                  <input
                    type="text"
                    value={newDriver.nationalId}
                    onChange={(e) => setNewDriver({ ...newDriver, nationalId: e.target.value })}
                    placeholder="2XXXXXXXXX"
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                    placeholder="driver@sanad.com"
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-cyan-900/50">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                >
                  حفظ السائق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 12. نافذة منبثقة: صرف عهدة جديدة */}
      {/* ========================================================================================= */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
          <div className="bg-[#0f1523] border border-cyan-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 text-slate-100" dir="rtl">
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>صرف عهدة وأجهزة لمندوب</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEquipmentModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEquipmentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع العهدة / الجهاز *:</label>
                <select
                  value={newEquipment.assetType}
                  onChange={(e) => setNewEquipment({ ...newEquipment, assetType: e.target.value })}
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
                >
                  <option value="جهاز نقاط بيع مدى الذكي (Geidea POS)">جهاز نقاط بيع مدى الذكي (Geidea POS)</option>
                  <option value="جهاز نقاط بيع مدى الذكي (Spire POS)">جهاز نقاط بيع مدى الذكي (Spire POS)</option>
                  <option value="طابعة بوالص شحن حرارية بلوتوث 4×6">طابعة بوالص شحن حرارية بلوتوث 4×6</option>
                  <option value="حقيبة حرارية عازلة سَنَد مقاس كبير">حقيبة حرارية عازلة سَنَد مقاس كبير</option>
                  <option value="حامل هاتف وشاحن سيارة ذكي">حامل هاتف وشاحن سيارة ذكي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الرقم التسلسلي للجهاز (S/N) *:</label>
                <input
                  type="text"
                  required
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                  placeholder="مثال: SN-POS-9988 أو BAG-EXP-08"
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">السائق المستلم للعهدة *:</label>
                <select
                  value={newEquipment.driverName}
                  onChange={(e) => setNewEquipment({ ...newEquipment, driverName: e.target.value })}
                  className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer font-bold text-white"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الفرع:</label>
                  <select
                    value={newEquipment.branchName}
                    onChange={(e) => setNewEquipment({ ...newEquipment, branchName: e.target.value })}
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الحالة التشغيلية:</label>
                  <select
                    value={newEquipment.status}
                    onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value })}
                    className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl p-2.5 text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
                  >
                    <option value="ممتاز / بالخدمة">ممتاز / بالخدمة</option>
                    <option value="جديد بالكرتون">جديد بالكرتون</option>
                    <option value="جيد / بالخدمة">جيد / بالخدمة</option>
                    <option value="يحتاج فحص وصيانة">يحتاج فحص وصيانة</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-cyan-900/50">
                <button
                  type="button"
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
                >
                  تسجيل وصرف العهدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

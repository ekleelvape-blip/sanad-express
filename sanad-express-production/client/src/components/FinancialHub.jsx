import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Wallet, ArrowDownLeft, Receipt, CheckCircle, Clock, 
  TrendingUp, Building, CreditCard, Banknote, CheckSquare, Square, 
  ChevronDown, ChevronUp, Calendar, Sparkles, RefreshCw, Search, 
  Package, AlertTriangle, ShieldCheck, Check, Filter
} from 'lucide-react';
import { sound } from '../utils/sound';
import FridayInvoicesHub from './FridayInvoicesHub';

export default function FinancialHub({ drivers = [], branches = [], orders = [], onRefresh, activeTab = 'settlements' }) {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settleDriver, setSettleDriver] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [settleNotes, setSettleNotes] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [expandedDriverId, setExpandedDriverId] = useState(null);
  const [showFridayInvoices, setShowFridayInvoices] = useState(false);

  // حالة الفلترة والبحث
  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' | 'all' | 'settled'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'driver_invoices') {
      setShowFridayInvoices(true);
    }
  }, [activeTab]);

  const fetchFinancials = async () => {
    try {
      const res = await fetch('/api/financials');
      if (res.ok) {
        setFinancialData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching financials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [drivers, orders]);

  // تصفير وتسوية عهدة المندوب بالكامل بنقرة واحدة (100% Zero-Out)
  const handleDirectZeroOutDriver = async (driver) => {
    if (!driver) return;
    try {
      const res = await fetch(`/api/drivers/${driver.id}/settle-zero`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: driver.branchId,
          notes: `تصفير وتسوية عهدة المندوب ${driver.name} واعتماد الرصيد 0.00 ﷼`
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        sound.playCashRegister();
        setLastReceipt(result.transaction);
        setSettleDriver(null);
        fetchFinancials();
        if (onRefresh) onRefresh();
      } else {
        alert(result.error || 'فشلت عملية التصفير');
      }
    } catch (err) {
      console.error('Error zeroing driver:', err);
      alert('تعذر الاتصال بالسيرفر');
    }
  };

  // فتح نافذة تسوية طلبات الدفع عند الاستلام لمندوب
  const handleOpenSettleCOD = (driver) => {
    setSettleDriver(driver);
    const unsettled = driver.unsettledCodOrders || orders.filter(o => 
      o.assignedDriverId === driver.id && 
      o.status === 'delivered' && 
      o.paymentMethod === 'cash' && 
      !o.codSettled
    );
    setSelectedOrderIds(unsettled.map(o => o.id));
    setSettleNotes(`تسوية وتوريد كاش طلبات الدفع عند الاستلام - ${driver.name}`);
  };

  // تأكيد تسوية الدفع عند الاستلام وتوريد الكاش لمحفظة المتجر
  const handleConfirmSettleCOD = async (e) => {
    e.preventDefault();
    if (!settleDriver) return;

    try {
      const res = await fetch('/api/settlements/cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: settleDriver.id,
          orderIds: selectedOrderIds,
          branchId: settleDriver.branchId,
          notes: settleNotes
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        sound.playCashRegister();
        setLastReceipt(result.transaction);
        setSettleDriver(null);
        fetchFinancials();
        if (onRefresh) onRefresh();
      } else {
        alert(result.error || 'فشلت عملية التسوية');
      }
    } catch (err) {
      console.error('Error settling COD:', err);
    }
  };

  // معالجة بيانات المناديب وحسابات الكاش بدقة
  const driversListWithCod = useMemo(() => {
    return drivers.map(driver => {
      const unsettled = driver.unsettledCodOrders || orders.filter(o => 
        o.assignedDriverId === driver.id && 
        o.status === 'delivered' && 
        o.paymentMethod === 'cash' && 
        !o.codSettled
      );
      const unsettledTotal = unsettled.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const rawCash = typeof driver.cashOnHand === 'number' ? driver.cashOnHand : unsettledTotal;
      const cashOnHand = Math.max(0, rawCash);
      const hasCash = cashOnHand > 0 || unsettledTotal > 0;

      return {
        ...driver,
        unsettled,
        unsettledTotal,
        cashOnHand,
        hasCash
      };
    });
  }, [drivers, orders]);

  // إحصائيات سريعة
  const pendingCount = driversListWithCod.filter(d => d.hasCash).length;
  const settledCount = driversListWithCod.filter(d => !d.hasCash).length;
  const totalCashWithDrivers = driversListWithCod.reduce((sum, d) => sum + (d.hasCash ? d.cashOnHand : 0), 0);
  const totalCommissions = drivers.reduce((sum, d) => sum + (d.totalCommissionToday || 0), 0);
  const receivedCashWalletTotal = financialData?.storeReceivedCashWallet?.totalBalance || 0;

  // المناديب بعد تطبيق الفلتر والبحث
  const filteredDrivers = useMemo(() => {
    return driversListWithCod.filter(d => {
      if (activeFilter === 'pending' && !d.hasCash) return false;
      if (activeFilter === 'settled' && d.hasCash) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const name = (d.name || '').toLowerCase();
        const phone = (d.phone || '').replace(/\D/g, '');
        const code = (d.code || '').toLowerCase();
        const qClean = q.replace(/\D/g, '');
        return name.includes(q) || (qClean && phone.includes(qClean)) || code.includes(q);
      }
      return true;
    });
  }, [driversListWithCod, activeFilter, searchTerm]);

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. ترويسة المركز المالي */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
              💰
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>المركز المالي وإدارة محفظة الكاش المستلم</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة مبالغ الدفع عند الاستلام (COD) مع المناديب، وتسويتها وتوريدها لخزينة المتجر
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFridayInvoices(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/40 border border-purple-400/30 transition-all cursor-pointer hover:scale-102 active:scale-95"
          >
            <span>📑</span>
            <span>فواتير الجمعة التلقائية للمناديب</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>تسوية النقدية الفورية</span>
          </div>
        </div>
      </div>

      {/* 2. كروت المحافظ والمؤشرات المالية الأساسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* محفظة الكاش المستلم للمتجر */}
        <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/50 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <span>🏦</span>
              <span>محفظة الكاش المستلم للمتجر</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
              💰
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300 mb-1">
            {receivedCashWalletTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-purple-300/70">
            النقدية الموردة والمودعة فعلياً في خزينة المتجر
          </p>
        </div>

        {/* كاش في عهدة المناديب */}
        <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-800/50 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>🛵</span>
              <span>كاش بعهدة المناديب المعلقة</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mb-1">
            {totalCashWithDrivers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-amber-300/70">
            مبالغ دفع عند الاستلام مع {pendingCount} مناديب تنتظر التوريد
          </p>
        </div>

        {/* مبيعات التوصيل المسلمة */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">مبيعات التوصيل المسلمة اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mb-1">
            {(financialData?.totalSales || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            كاش: {(financialData?.cashSales || 0).toLocaleString()} ر.س • مدى: {(financialData?.madaSales || 0).toLocaleString()} ر.س
          </p>
        </div>

        {/* عمولات المناديب اليوم */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-300">عمولات المناديب المستحقة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mb-1">
            {totalCommissions.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-emerald-400/70">
            مستحقات المشاوير المنجزة اليوم
          </p>
        </div>
      </div>

      {/* 3. جدول تسوية طلبات الدفع عند الاستلام للمناديب (جدول محاسبي منظم) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        {/* شريط التحكم، الفلاتر والبحث */}
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                <span>تسوية وتوريد كاش المناديب للمتجر</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                جدول تدقيق ومطابقة مبالغ الدفع عند الاستلام المسلمة مع المناديب وتوريدها فوراً إلى محفظة المتجر
              </p>
            </div>

            {/* إجمالي المعلق للتسوية السريعة */}
            <div className="bg-amber-950/40 border border-amber-800/60 px-4 py-2 rounded-2xl flex items-center gap-3">
              <span className="text-xs text-amber-200 font-bold">إجمالي المبالغ بانتظار التوريد:</span>
              <span className="text-lg font-black font-mono text-amber-400">
                {totalCashWithDrivers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
              </span>
            </div>
          </div>

          {/* أزرار الفلترة وشريط البحث السريع */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            
            {/* التبويبات الثلاثة المنظمة */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveFilter('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeFilter === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>بانتظار التوريد والتسوية</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-amber-950 text-amber-300 font-mono font-bold">
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeFilter === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>كافة أسطول المناديب</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-slate-800 text-slate-300 font-mono font-bold">
                  {driversListWithCod.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('settled')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeFilter === 'settled'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>تمت تسويتهم (خالص)</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-emerald-950 text-emerald-400 font-mono font-bold">
                  {settledCount}
                </span>
              </button>
            </div>

            {/* حقل البحث السريع بالاسم أو الجوال أو الكود */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم المندوب أو الجوال أو الكود..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>

        {/* الجدول المحاسبي المنظم */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                <th className="py-3.5 px-4 w-[28%]">بيانات المندوب</th>
                <th className="py-3.5 px-4 text-center w-[18%]">شحنات الكاش المسلمة</th>
                <th className="py-3.5 px-4 text-center w-[20%]">المبلغ بعهدة المندوب</th>
                <th className="py-3.5 px-4 text-center w-[16%]">حالة العهدة</th>
                <th className="py-3.5 px-4 text-left w-[18%]">الإجراء المحاسبي</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map(d => {
                  const isExpanded = expandedDriverId === d.id;

                  return (
                    <React.Fragment key={d.id}>
                      <tr className={`hover:bg-slate-800/30 transition-colors ${d.hasCash ? 'bg-amber-950/10' : ''}`}>
                        
                        {/* 1. المندوب */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                              d.hasCash
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {d.name?.charAt(0) || 'م'}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-sm truncate">{d.name}</span>
                                <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                                  {d.code || ('DRV-0' + String(d.id).replace(/\D/g, ''))}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-slate-400">
                                <span dir="ltr" className="font-mono text-[11px] text-slate-400 shrink-0">
                                  {d.phone || '-'}
                                </span>
                                {d.vehicle && (
                                  <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                                    • {d.vehicle}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. شحنات الكاش المسلمة */}
                        <td className="py-3.5 px-4 text-center">
                          {d.unsettled.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedDriverId(isExpanded ? null : d.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs cursor-pointer transition-all active:scale-95"
                              title="اضغط لمعاينة تفاصيل الشحنات"
                            >
                              <Package className="w-3.5 h-3.5 text-amber-400" />
                              <span>{d.unsettled.length} شحنات كاش</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs">
                              0 شحنات معلقة
                            </span>
                          )}
                        </td>

                        {/* 3. المبلغ بعهدة المندوب */}
                        <td className="py-3.5 px-4 text-center">
                          {d.hasCash ? (
                            <div className="inline-block bg-amber-950/50 border border-amber-700/60 px-3 py-1.5 rounded-xl shadow-xs">
                              <span className="font-mono font-black text-base text-amber-400">
                                {Number(d.cashOnHand).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-amber-300 mr-1.5 font-bold">ر.س</span>
                            </div>
                          ) : (
                            <div className="inline-block text-slate-500 font-mono text-sm font-semibold">
                              0.00 <span className="text-[10px] text-slate-600">ر.س</span>
                            </div>
                          )}
                        </td>

                        {/* 4. حالة العهدة */}
                        <td className="py-3.5 px-4 text-center">
                          {d.hasCash ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>بانتظار التوريد ⚠️</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>خالص ومصفر</span>
                            </span>
                          )}
                        </td>

                        {/* 5. الإجراء المحاسبي */}
                        <td className="py-3.5 px-4 text-left">
                          {d.hasCash ? (
                            <div className="flex items-center justify-end gap-2">
                              {/* زر تسوية الكاش الرئيسي */}
                              <button
                                type="button"
                                onClick={() => handleOpenSettleCOD(d)}
                                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all cursor-pointer hover:scale-102 active:scale-95"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>تسوية الكاش</span>
                              </button>

                              {/* زر التصفير الفوري */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من تصفير كامل عهدة المندوب (${d.name}) بقيمة ${d.cashOnHand} ر.س وتوريدها لخزينة المتجر فوراً؟`)) {
                                    handleDirectZeroOutDriver(d);
                                  }
                                }}
                                className="px-2.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/60 hover:border-rose-600 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                                title="تصفير عهدة المندوب فوراً إلى 0.00 ﷼"
                              >
                                <Sparkles className="w-3 h-3 text-rose-400" />
                                <span>تصفير فوري</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end">
                              <span className="text-[11px] text-slate-500 font-medium px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800">
                                العهدة مصفرة (0.00 ﷼)
                              </span>
                            </div>
                          )}
                        </td>

                      </tr>

                      {/* تفاصيل شحنات الكاش عند التوسيع */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80 border-b border-slate-800">
                          <td colSpan={5} className="p-4">
                            <div className="bg-[#090d16] border border-cyan-950/80 rounded-2xl p-4 shadow-inner space-y-3">
                              
                              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-cyan-400" />
                                  <span className="font-bold text-xs text-slate-200">
                                    تفاصيل شحنات الدفع عند الاستلام المسلمة بعهدة المندوب ({d.name}):
                                  </span>
                                </div>
                                <span className="text-xs font-mono font-bold text-amber-400">
                                  المجموع: {d.unsettledTotal.toLocaleString()} ر.س
                                </span>
                              </div>

                              {d.unsettled.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {d.unsettled.map(ord => (
                                    <div key={ord.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-xs text-cyan-300">{ord.id}</span>
                                          <span className="font-bold text-xs text-white">{ord.customerName}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                          <span>📍 {ord.customerAddress || ord.city || 'المنطقة الشرقية'}</span>
                                          {ord.customerPhone && (
                                            <span dir="ltr" className="font-mono text-slate-500">({ord.customerPhone})</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-left shrink-0">
                                        <div className="font-mono font-black text-sm text-amber-400">
                                          +{Number(ord.totalAmount).toLocaleString()} ر.س
                                        </div>
                                        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                                          كاش مستلم 💵
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-3 text-xs text-slate-500">
                                  لا توجد شحنات كاش مسجلة على النظام لهذا المندوب (المبلغ المسجل هو عهدة سابقة)
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 text-xs">
                    {searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'لا يوجد مناديب ضمن هذا التصنيف حالياً'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. سجل إيداعات محفظة الكاش المستلم للمتجر */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-400" />
              <span>سجل إيداعات محفظة الكاش المستلم (سندات القبض المعتمدة)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              كل النقدية التي تم تصفيرها من المناديب وإيداعها في خزينة المتجر
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-3 py-1 rounded-xl">
            الرصيد التراكمي المودع: {receivedCashWalletTotal.toLocaleString()} ر.س
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
          {financialData?.storeReceivedCashWallet?.transactions?.length > 0 ? (
            financialData.storeReceivedCashWallet.transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-800/40 flex items-center justify-center font-bold">
                    📥
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100">{tx.receiptNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        توريد لمحفظة المتجر
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      المندوب: <span className="text-slate-200 font-bold">{tx.driverName}</span> • عدد {tx.orderCount} طلبات • {tx.notes}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-mono font-black text-base text-emerald-400">
                    +{Number(tx.amount).toLocaleString()} ر.س
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(tx.timestamp).toLocaleString('ar-SA')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              لا توجد سندات قبض مسجلة حتى الآن
            </div>
          )}
        </div>
      </div>

      {/* 5. نافذة تأكيد تسوية طلبات الدفع عند الاستلام */}
      {settleDriver && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-amber-400" />
              <span>تسوية وتوريد كاش المندوب ({settleDriver.name})</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              حدد الشحنات المراد تسويتها، وسيتم <strong>تصفير المبلغ المختار من محفظة المندوب</strong> وإيداعه في <strong>محفظة الكاش المستلم للمتجر</strong> فوراً.
            </p>

            <form onSubmit={handleConfirmSettleCOD} className="space-y-4 text-xs">
              
              {/* قائمة الطلبات لاختيارها */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-2">
                  <span>حدد الطلبات لتسويتها وتوريد كاشها:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = (settleDriver.unsettledCodOrders || orders.filter(o => o.assignedDriverId === settleDriver.id && o.status === 'delivered' && o.paymentMethod === 'cash' && !o.codSettled)).map(o => o.id);
                        setSelectedOrderIds(allIds);
                      }}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderIds([])}
                      className="text-[10px] text-slate-400 hover:underline cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <span className="text-amber-400 font-mono font-bold mr-1">
                      ({selectedOrderIds.length})
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {(settleDriver.unsettledCodOrders || orders.filter(o => o.assignedDriverId === settleDriver.id && o.status === 'delivered' && o.paymentMethod === 'cash' && !o.codSettled)).map(o => {
                    const isChecked = selectedOrderIds.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedOrderIds(selectedOrderIds.filter(id => id !== o.id));
                          } else {
                            setSelectedOrderIds([...selectedOrderIds, o.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-purple-950/40 border-purple-600'
                            : 'bg-slate-900 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <div>
                            <div className="font-mono font-bold text-slate-200">{o.id} - {o.customerName}</div>
                            <div className="text-[10px] text-slate-400">{o.customerAddress}</div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-amber-400 text-sm">
                          {o.totalAmount} ر.س
                        </div>
                      </div>
                    );
                  })}

                  {(settleDriver.unsettledCodOrders || orders.filter(o => o.assignedDriverId === settleDriver.id && o.status === 'delivered' && o.paymentMethod === 'cash' && !o.codSettled)).length === 0 && (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      لا توجد شحنات مفردة، يمكنك استخدام زر "تصفير كامل العهدة فوراً" لتوريد المبلغ المسجل بالخزينة.
                    </div>
                  )}
                </div>
              </div>

              {/* المبلغ الإجمالي للتسوية والتوريد */}
              <div className="flex items-center justify-between bg-purple-950/40 border border-purple-800/60 p-4 rounded-2xl">
                <div>
                  <div className="text-xs text-purple-300 font-bold">المبلغ الإجمالي للتسوية:</div>
                  <div className="text-[11px] text-slate-400">سيتم تصفيره من المندوب وإيداعه فوراً بمحفظة المتجر</div>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {orders.filter(o => selectedOrderIds.includes(o.id)).reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات السند / المحاسب:</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDirectZeroOutDriver(settleDriver)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer active:scale-95 transition-all"
                  title="تصفير عهدة المندوب فوراً بالكامل وتوريد الرصيد للمتجر"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>تصفير كامل العهدة فوراً (0 ﷼)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleDriver(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>تأكيد التسوية المحددة</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. سند القبض بعد التسوية */}
      {lastReceipt && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              ✅
            </div>
            <h3 className="text-base font-bold text-white mb-1">تمت التسوية بنجاح!</h3>
            <p className="text-xs text-slate-400 mb-4">تم تصفير المبلغ من محفظة المندوب وإيداعه بمحفظة كاش المتجر</p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right text-xs space-y-2.5 mb-5">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">رقم السند:</span>
                <span className="font-mono font-bold text-purple-400">{lastReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المندوب:</span>
                <span className="font-bold text-slate-200">{lastReceipt.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المبلغ المودع بالخزينة:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">{Number(lastReceipt.amount).toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>التوقيت:</span>
                <span>{new Date(lastReceipt.timestamp).toLocaleString('ar-SA')}</span>
              </div>
            </div>

            <button
              onClick={() => setLastReceipt(null)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
            >
              إغلاق السند
            </button>
          </div>
        </div>
      )}

      {/* 7. نافذة فواتير الجمعة الأسبوعية التلقائية */}
      {showFridayInvoices && (
        <FridayInvoicesHub
          drivers={drivers}
          branches={branches}
          onClose={() => {
            setShowFridayInvoices(false);
            fetchFinancials();
            if (onRefresh) onRefresh();
          }}
        />
      )}

    </div>
  );
}

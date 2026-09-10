import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, Users, DollarSign, Wallet, ArrowUpRight, Plus, Printer, Barcode, Navigation, Zap, ShoppingCart, RefreshCw, Radio, Check, Sparkles } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import { sound } from '../utils/sound';

export default function DashboardView({
  orders,
  drivers,
  branches,
  selectedBranch,
  onSelectTab,
  onSelectDriver,
  onOpenWaybill
}) {
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [sallaLoading, setSallaLoading] = useState(false);
  const [operationMsg, setOperationMsg] = useState(null);

  const filteredOrders = orders.filter(o => selectedBranch === 'all' || o.branchId === selectedBranch);
  const totalOrders = filteredOrders.length;
  const unassignedOrders = filteredOrders.filter(o => o.status === 'unassigned');
  const inTransitCount = filteredOrders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status)).length;
  const deliveredCount = filteredOrders.filter(o => o.status === 'delivered').length;
  const activeDrivers = drivers.filter(d => d.online).length;

  const pendingCOD = filteredOrders
    .filter(o => o.paymentMethod === 'cash' && o.status !== 'delivered')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const collectedCash = drivers.reduce((sum, d) => sum + (Number(d.cashOnHand) || 0), 0);

  const handleAutoDispatch = async () => {
    setDispatchLoading(true);
    try {
      const res = await fetch('/api/orders/auto-dispatch', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        setOperationMsg({ type: 'success', text: data.message });
      } else {
        setOperationMsg({ type: 'error', text: data.error || 'فشلت العملية' });
      }
    } catch (err) {
      setOperationMsg({ type: 'error', text: 'حدث خطأ أثناء التوزيع الذكي' });
    } finally {
      setDispatchLoading(false);
      setTimeout(() => setOperationMsg(null), 5000);
    }
  };

  const handleSimulateSalla = async () => {
    setSallaLoading(true);
    try {
      const res = await fetch('/api/salla/simulate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playNewOrder();
        setOperationMsg({ type: 'success', text: '🎉 ' + data.message + ' رقم الشحنة: ' + data.order.id });
      } else {
        setOperationMsg({ type: 'error', text: 'فشلت محاكاة الطلب' });
      }
    } catch (err) {
      setOperationMsg({ type: 'error', text: 'حدث خطأ أثناء محاكاة سلة' });
    } finally {
      setSallaLoading(false);
      setTimeout(() => setOperationMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      {/* شريط العمليات والخدمات اللوجستية الذكية الفورية */}
      <div className="bg-gradient-to-r from-[#0d9488]/20 via-[#0f1b23] to-[#0b1319] border border-teal-500/30 p-5 rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0d9488]/20 border border-[#0d9488]/40 flex items-center justify-center text-[#2dd4bf] shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">محرك العمليات اللوجستية والمواصفات الخدمية</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Real-time Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              توزيع ذكي فوري، محاكاة طلبات سلة المباشرة، وطباعة بوالص الشحن 4×6
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <button
            type="button"
            onClick={handleAutoDispatch}
            disabled={dispatchLoading || unassignedOrders.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer ${unassignedOrders.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            title="توزيع كل الشحنات الجاهزة آلياً على المناديب المتاحين"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>توزيع ذكي تلقائي ({unassignedOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateSalla}
            disabled={sallaLoading}
            className="flex items-center gap-1.5 bg-[#0f766e]/40 hover:bg-[#0f766e]/70 text-emerald-300 border border-emerald-500/40 px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
            title="محاكاة وصول طلب فوري جديد من متجر سلة"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>محاكي طلب سلة 🛒</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>بوالص الشحن</span>
          </button>
        </div>
      </div>

      {operationMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${operationMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800' : 'bg-red-950/80 text-red-200 border-red-800'}`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{operationMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1b23] border border-slate-800/80 p-5 rounded-3xl shadow-xl flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-bold text-slate-400">إجمالي الطلبات</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{totalOrders}</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>شحنات مسجلة بالمنظومة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xl font-bold">
            📦
          </div>
        </div>

        <div className="bg-[#0f1b23] border border-slate-800/80 p-5 rounded-3xl shadow-xl flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-bold text-slate-400">جاري التوصيل بالميدان</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{inTransitCount}</div>
            <div className="text-[10px] text-amber-300 mt-1 font-semibold">مع المناديب بالسيارات</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xl font-bold">
            🚚
          </div>
        </div>

        <div className="bg-[#0f1b23] border border-slate-800/80 p-5 rounded-3xl shadow-xl flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-bold text-slate-400">تم التوصيل بنجاح</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{deliveredCount}</div>
            <div className="text-[10px] text-emerald-300 mt-1 font-semibold">مكتملة ومستلمة للعميل</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xl font-bold">
            ✅
          </div>
        </div>

        <div className="bg-[#0f1b23] border border-slate-800/80 p-5 rounded-3xl shadow-xl flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-bold text-slate-400">السائقين النشطين</div>
            <div className="text-2xl font-black text-sky-400 font-mono mt-1">{activeDrivers} <span className="text-xs font-normal text-slate-400">/ {drivers.length}</span></div>
            <div className="text-[10px] text-sky-300 mt-1 font-semibold">أسطول سند إكسبريس</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xl font-bold">
            🚗
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-gradient-to-r from-emerald-950/50 to-[#0f1b23] border border-emerald-800/40 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <div className="text-slate-300 font-bold">مبالغ الدفع عند الاستلام المعلقة (COD)</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">{pendingCOD} ر.س</div>
            <div className="text-[10px] text-slate-400 mt-1">شحنات كاش مع المناديب قيد التسليم</div>
          </div>
          <button
            onClick={() => onSelectTab('settlements')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            تسوية المناديب
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-950/50 to-[#0f1b23] border border-purple-800/40 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <div className="text-slate-300 font-bold">محفظة الكاش الميداني مع المناديب</div>
            <div className="text-xl font-black text-purple-400 font-mono mt-1">{collectedCash} ر.س</div>
            <div className="text-[10px] text-slate-400 mt-1">مبالغ محصلة جاهزة للتسوية والإيداع بالخزينة</div>
          </div>
          <button
            onClick={() => onSelectTab('wallet')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-lg shadow-purple-950/40"
          >
            عرض المحفظة
          </button>
        </div>
      </div>

      <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">رادار تتبع مناديب سند إكسبريس الحي (GPS)</h3>
          </div>
          <button
            onClick={() => onSelectTab('driver_tracking')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
          >
            تكبير الخريطة ←
          </button>
        </div>
        <AdminDashboard
          branches={branches}
          drivers={drivers}
          orders={orders}
          selectedBranch={selectedBranch}
          onSelectDriver={onSelectDriver}
          onSwitchTab={onSelectTab}
        />
      </div>
    </div>
  );
}
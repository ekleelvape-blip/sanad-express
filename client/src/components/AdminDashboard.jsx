import React from 'react';
import LiveMap from './LiveMap';
import { 
  Store, Navigation, Users, CheckCircle2, Clock, DollarSign, 
  MapPin, AlertCircle, Phone, ArrowRight, ShieldCheck, Sparkles,
  Package, ChevronLeft, Truck, RefreshCw
} from 'lucide-react';

const DEFAULT_BRANCHES_FALLBACK = [
  { id: 'branch-iklil-dammam', code: 'KAYF', orderPrefix: 'SND-KAYF', invoicePrefix: 'INV-KAYF', receiptPrefix: 'REC-KAYF', name: 'فرع إكليل الكيف - الدمام حي طيبة', brand: 'إكليل الكيف', city: 'الدمام', district: 'الدمام - حي طيبة', coords: [26.3583, 50.0501], phone: '0538041826' },
  { id: 'branch-iklil-jubail', code: 'JBL', orderPrefix: 'SND-JBL', invoicePrefix: 'INV-JBL', receiptPrefix: 'REC-JBL', name: 'فرع إكليل فيب - الجبيل البلد', brand: 'إكليل فيب', city: 'الجبيل', district: 'الجبيل البلد - طريق الملك فيصل الغربي', coords: [26.9836, 49.6465], phone: '0535139959' },
  { id: 'branch-vape-sharq', code: 'SHQ', orderPrefix: 'SND-SHQ', invoicePrefix: 'INV-SHQ', receiptPrefix: 'REC-SHQ', name: 'متجر فيب الشرق', brand: 'فيب الشرق', city: 'الدمام', district: 'الدمام - حي طيبة', coords: [26.3583, 50.0501], phone: '0559876543' },
  { id: 'branch-iklil-main', code: 'IKL', orderPrefix: 'SND-IKL', invoicePrefix: 'INV-IKL', receiptPrefix: 'REC-IKL', name: 'متجر إكليل فيب', brand: 'إكليل فيب', city: 'الدمام', district: 'الدمام - حي طيبة', coords: [26.3583, 50.0501], phone: '0538041826' }
];

export default function AdminDashboard({
  branches = [],
  drivers = [],
  orders = [],
  selectedBranch = 'all',
  onSelectBranch,
  onSelectDriver,
  onSwitchTab
}) {
  const effectiveBranches = branches && branches.length > 0 ? branches : DEFAULT_BRANCHES_FALLBACK;

  // تصفية الطلبات بحسب الفرع المختار
  const filteredOrders = orders.filter(o => selectedBranch === 'all' || o.branchId === selectedBranch);
  const activeOrders = filteredOrders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));
  const unassignedOrders = filteredOrders.filter(o => o.status === 'unassigned');
  const deliveredToday = filteredOrders.filter(o => o.status === 'delivered');

  const currentBranch = effectiveBranches.find(b => b.id === selectedBranch);

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
      
      {/* 1. الترويسة الرئيسية للإدارة العامة والتحكم الكامل */}
      <div className="bg-gradient-to-r from-[#0d1726] via-[#09111e] to-[#0d1726] border border-cyan-900/60 p-5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-bold text-cyan-300">منظومة الإدارة المركزية والرقابة العامة</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-[#00d2d3] border border-cyan-800 font-mono font-bold">
                SUPER ADMIN 👑
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Store className="w-6 h-6 text-[#00d2d3]" />
              <span>إدارة الفروع والتحكم الكامل بالأسطول الميداني</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              إشراف مركزي كامل على فروع إكليل فيب وفيب الشرق بالمنطقة الشرقية، التبديل الفوري بين الفروع، وتوجيه المناديب والشحنات
            </p>
          </div>

          {/* شريط الفروع السريع للتبديل الفوري */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => onSelectBranch && onSelectBranch('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBranch === 'all'
                  ? 'bg-gradient-to-r from-cyan-600 to-[#00d2d3] text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>👑</span>
              <span>كل الفروع (عام)</span>
            </button>

            {effectiveBranches.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBranch && onSelectBranch(b.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedBranch === b.id
                    ? 'bg-cyan-950 text-[#00d2d3] border border-cyan-800/80 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏢</span>
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* طلبات تحتاج إسناد */}
        <div
          onClick={() => onSwitchTab && onSwitchTab('orders')}
          className="bg-slate-900/90 hover:bg-slate-800/90 border border-red-900/40 p-4 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-300">طلبات تحتاج إسناد</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-red-400">
            {unassignedOrders.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">اضغط للتوزيع الفوري للمناديب</p>
        </div>

        {/* في الطريق الآن */}
        <div 
          onClick={() => onSwitchTab && onSwitchTab('delivery_intransit')}
          className="bg-slate-900/90 hover:bg-slate-800/90 border border-amber-900/40 p-4 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300">قيد التوصيل الآن</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {activeOrders.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">مناديب يتحركون نحو العملاء</p>
        </div>

        {/* طلبات مسلمة اليوم */}
        <div 
          onClick={() => onSwitchTab && onSwitchTab('delivery_delivered')}
          className="bg-slate-900/90 hover:bg-slate-800/90 border border-emerald-900/40 p-4 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-300">تم توصيلها</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {deliveredToday.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">تسليم ناجح ومطابق للعملاء</p>
        </div>

        {/* المناديب المتصلين */}
        <div 
          onClick={() => onSwitchTab && onSwitchTab('store_drivers')}
          className="bg-slate-900/90 hover:bg-slate-800/90 border border-purple-900/40 p-4 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300">المناديب المتاحين</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
            {drivers.filter(d => d.online).length} <span className="text-xs text-slate-500 font-normal">/ {drivers.length}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">بث مباشر لإحداثيات GPS</p>
        </div>
      </div>

      {/* 3. بطاقات الفروع الأربعة التفاعلية والتحكم الكامل */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Store className="w-4 h-4 text-[#00d2d3]" />
            <span>حالة الفروع الأربعة (إكليل فيب وفيب الشرق) - صلاحيات الإدارة العامة</span>
          </h3>
          <span className="text-xs text-slate-400">
            الفرع النشط حالياً: <strong className="text-cyan-300">{currentBranch ? currentBranch.name : 'جميع الفروع (شامل)'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {effectiveBranches.map(branch => {
            const branchOrders = orders.filter(o => o.branchId === branch.id);
            const branchDelivered = branchOrders.filter(o => o.status === 'delivered').length;
            const branchInTransit = branchOrders.filter(o => ['assigned', 'in_transit'].includes(o.status)).length;
            const branchDrivers = drivers.filter(d => d.branchId === branch.id);
            const isSelected = selectedBranch === branch.id;

            return (
              <div
                key={branch.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/50 scale-102'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-cyan-400 font-mono px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800">
                      {branch.brand || 'سند'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>نشط ويعمل</span>
                    </span>
                  </div>

                  <h4 className="font-black text-white text-sm mb-1">{branch.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{branch.district || branch.city}</span>
                  </div>

                  {/* إحصائيات الفرع الحية */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[10px]">إجمالي الطلبات</span>
                      <span className="font-bold font-mono text-white text-sm">{branchOrders.length} طلب</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">قيد التوصيل</span>
                      <span className="font-bold font-mono text-amber-400 text-sm">{branchInTransit} طلب</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">تم التسليم</span>
                      <span className="font-bold font-mono text-emerald-400 text-sm">{branchDelivered} طلب</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">مناديب الفرع</span>
                      <span className="font-bold font-mono text-cyan-300 text-sm">{branchDrivers.length || 3} مندوب</span>
                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات للفرع */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectBranch && onSelectBranch(branch.id)}
                    className={`w-full py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-cyan-950/70 text-slate-200 hover:text-cyan-300'
                    }`}
                  >
                    <span>{isSelected ? '✓ الفرع المحدد حالياً' : 'التبديل لهذا الفرع 🔁'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectBranch) onSelectBranch(branch.id);
                        if (onSwitchTab) onSwitchTab('orders');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[11px] font-bold transition-colors text-center"
                    >
                      شحنات الفرع 📦
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectBranch) onSelectBranch(branch.id);
                        if (onSwitchTab) onSwitchTab('store_drivers');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[11px] font-bold transition-colors text-center"
                    >
                      مناديب الفرع 🚗
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. خريطة الرادار المباشرة للمناديب والمسارات */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>خريطة التتبع المباشر (رادار مناديب الفروع ومسارات التوصيل الحية GPS)</span>
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            النطاق المعروض: <strong className="text-emerald-400">{currentBranch ? currentBranch.name : 'جميع فروع الشرقية'}</strong>
          </span>
        </div>

        <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-slate-800">
          <LiveMap
            branches={effectiveBranches}
            drivers={drivers}
            orders={orders}
            selectedBranch={selectedBranch}
            onSelectDriver={onSelectDriver}
          />
        </div>
      </div>

    </div>
  );
}

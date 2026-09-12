import React from 'react';
import LiveMap from './LiveMap';
import { Store, Navigation, Users, CheckCircle2, Clock, DollarSign, MapPin, AlertCircle } from 'lucide-react';

export default function AdminDashboard({ branches, drivers, orders, selectedBranch, onSelectDriver, onSwitchTab }) {
  // تصفية حسب الفرع
  const activeOrders = orders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));
  const unassignedOrders = orders.filter(o => o.status === 'unassigned');
  const deliveredToday = orders.filter(o => o.status === 'delivered');

  const currentBranch = branches.find(b => b.id === selectedBranch);

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* طلبات تحتاج إسناد */}
        <div
          onClick={() => onSwitchTab('dispatch')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-red-900/40 p-4 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-300">طلبات تحتاج إسناد</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-red-400">
            {unassignedOrders.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">اضغط للتوزيع الفوري للمناديب</p>
        </div>

        {/* في الطريق الآن */}
        <div className="bg-slate-900/80 border border-amber-900/40 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300">قيد التوصيل الآن</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {activeOrders.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">مناديب يتحركون نحو العملاء</p>
        </div>

        {/* طلبات مسلمة اليوم */}
        <div className="bg-slate-900/80 border border-emerald-900/40 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-300">تم توصيلها اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {deliveredToday.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">بنسبة إنجاز 98% في الوقت المحدد</p>
        </div>

        {/* المناديب المتصلين */}
        <div className="bg-slate-900/80 border border-purple-900/40 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300">المناديب المتصلين</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-purple-400">
            {drivers.filter(d => d.online).length} <span className="text-xs text-slate-500 font-normal">/ {drivers.length}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">بث مباشر لإحداثيات GPS</p>
        </div>
      </div>

      {/* خريطة الرادار المباشرة للمناديب والمسارات */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span>
            <h3 className="font-bold text-slate-100 text-sm">
              خريطة التتبع المباشر (رادار المناديب ومسارات الفروع)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            الفرع المعروض: <span className="text-purple-400 font-bold">{currentBranch ? currentBranch.name : 'جميع الفروع'}</span>
          </span>
        </div>

        <div className="h-[520px] w-full">
          <LiveMap
            branches={branches}
            drivers={drivers}
            orders={orders}
            selectedBranch={selectedBranch}
            onSelectDriver={onSelectDriver}
          />
        </div>
      </div>

      {/* بطاقات الفروع النشطة */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Store className="w-4 h-4 text-purple-400" />
          <span>حالة فروع إكليل فيب وفيب الشرق</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map(branch => {
            const branchOrders = orders.filter(o => o.branchId === branch.id);
            const branchDrivers = drivers.filter(d => d.branchId === branch.id);
            const isSelected = selectedBranch === branch.id;

            return (
              <div
                key={branch.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-purple-950/20 border-purple-600 shadow-lg shadow-purple-950/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-400 font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                    {branch.brand}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>الفرع مفتوح</span>
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm mb-1">{branch.name}</h4>
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{branch.district}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">الطلبات اليوم</span>
                    <span className="font-bold font-mono text-slate-200">{branchOrders.length} طلب</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">المناديب المعينين</span>
                    <span className="font-bold font-mono text-slate-200">{branchDrivers.length} مندوب</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

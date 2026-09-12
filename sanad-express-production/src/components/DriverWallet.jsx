import React from 'react';
import { Wallet, DollarSign, PackageCheck, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function DriverWallet({ driver, orders }) {
  if (!driver) return null;

  const myDeliveredOrders = orders.filter(o => o.assignedDriverId === driver.id && o.status === 'delivered');

  return (
    <div className="space-y-4">
      {/* بطاقة الرصيد والعهدة الشخصية */}
      <div className="bg-gradient-to-br from-purple-900/50 via-slate-900 to-indigo-950/60 border border-purple-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-purple-300 font-semibold">محفظة الكاش والعهدة</div>
              <div className="text-sm font-bold text-slate-100">{driver.name}</div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
            وردية اليوم
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          {/* كاش في الجيب مطلوب توريده */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-amber-300 font-bold mb-1">كاش العهدة (في جيبك)</div>
            <div className="text-xl font-black font-mono text-amber-400">
              {driver.cashOnHand || 0} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1">يتم توريده للفرع عند الإغلاق</div>
          </div>

          {/* عمولتي اليوم */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-emerald-300 font-bold mb-1">أرباحي وعمولتي اليوم</div>
            <div className="text-xl font-black font-mono text-emerald-400">
              {driver.totalCommissionToday || 0} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1">عن {driver.completedToday || 0} مشاوير مكتملة</div>
          </div>
        </div>
      </div>

      {/* سجل تسليمات اليوم */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <PackageCheck className="w-4 h-4 text-emerald-400" />
          <span>الطلبات التي سلمتها اليوم ({myDeliveredOrders.length})</span>
        </h4>

        <div className="space-y-2 max-h-52 overflow-y-auto text-xs">
          {myDeliveredOrders.map(o => (
            <div key={o.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">{o.customerName}</div>
                <div className="text-[10px] text-slate-400 font-mono">{o.id} • {o.customerAddress}</div>
              </div>
              <div className="text-left">
                <div className="font-mono font-bold text-emerald-400">+{o.totalAmount} ر.س</div>
                <div className="text-[10px] text-slate-500">عمولة: {o.driverCommission} ر.س</div>
              </div>
            </div>
          ))}

          {myDeliveredOrders.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              لم تكمل أي طلبات حتى الآن اليوم
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

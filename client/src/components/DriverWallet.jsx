import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, PackageCheck, AlertCircle, ArrowUpRight, 
  Receipt, FileText, CheckCircle2, Clock, Calendar, ChevronRight, 
  TrendingUp, Sparkles, Building2, Eye, ShieldCheck, Printer
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function DriverWallet({ 
  driver, 
  orders = [], 
  settlementsData, 
  onOpenSignModal,
  socket 
}) {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'settlements'
  const [fridayInvoices, setFridayInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  if (!driver) return null;

  // جلب فواتير وعوائد المندوب الأسبوعية
  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await fetch(`/api/invoices/friday?driverId=${driver.id}`);
      const data = await res.json();
      if (data.success) {
        setFridayInvoices(data.invoices || []);
      }
    } catch (e) {
      console.error('Error fetching driver invoices:', e);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [driver.id]);

  // استماع لحظي لتحديثات الفواتير والتسويات والطلبات
  useEffect(() => {
    if (!socket) return;
    const handleInvoiceUpdate = () => fetchInvoices();
    const handleOrderUpdate = () => fetchInvoices();
    socket.on('friday_invoices_updated', handleInvoiceUpdate);
    socket.on('settlement_approved', handleInvoiceUpdate);
    socket.on('order_updated', handleOrderUpdate);
    socket.on('orders_updated', handleOrderUpdate);
    return () => {
      socket.off('friday_invoices_updated', handleInvoiceUpdate);
      socket.off('settlement_approved', handleInvoiceUpdate);
      socket.off('order_updated', handleOrderUpdate);
      socket.off('orders_updated', handleOrderUpdate);
    };
  }, [socket, driver.id]);

  // الطلبات التي سلمها المندوب
  const deliveredOrders = orders.filter(o => o.assignedDriverId === driver.id && o.status === 'delivered');

  // فواتير العوائد القادمة (المستحقة قيد الفوترة/الصرف)
  const upcomingInvoices = fridayInvoices.filter(inv => inv.status !== 'settled');
  // فواتير العوائد المكتملة (التي تم صرفها وتسليمها للمندوب)
  const completedInvoices = fridayInvoices.filter(inv => inv.status === 'settled');

  // حساب إجمالي العوائد القادمة (مجموع عمولات التوصيل في الفواتير المعتمدة غير المصروفة)
  const upcomingTotal = upcomingInvoices.reduce((sum, inv) => sum + (Number(inv.totalCommissions) || 0), 0) ||
    deliveredOrders.reduce((sum, o) => sum + Number(o.driverCommission || o.deliveryFee || 25), 0);

  // حساب إجمالي العوائد المكتملة (مجموع عمولات التوصيل المصروفة)
  const completedTotal = completedInvoices.reduce((sum, inv) => sum + (Number(inv.totalCommissions) || 0), 0);

  // بيانات التسويات النقدية
  const settledCount = settlementsData?.settledCount || 0;
  const totalSettledCash = settlementsData?.totalSettledAmount || 0;
  const pendingRequests = settlementsData?.requests?.filter(r => r.status === 'pending_driver_signature') || [];
  const approvedVouchers = settlementsData?.transactions || [];

  return (
    <div className="space-y-4 text-right font-sans" dir="rtl">
      
      {/* 1. البطاقة المالية الشاملة للمندوب */}
      <div className="bg-gradient-to-br from-[#0d1527] via-[#131d35] to-[#0f172a] border border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-cyan-300 font-bold">محفظة العوائد ورسوم التوصيل</div>
              <div className="text-sm font-black text-white">{driver.name}</div>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold font-mono">
            المعرف: {driver.code || 'DRV-01'}
          </span>
        </div>

        {/* شبكة الإحصائيات المالية الثلاثية */}
        <div className="grid grid-cols-3 gap-2 text-center">
          
          {/* 1. العوائد القادمة (أرباح توصيل قادمة) */}
          <div 
            onClick={() => { sound.pop(); setActiveTab('upcoming'); }}
            className={'p-3 rounded-2xl border transition-all cursor-pointer ' + 
              (activeTab === 'upcoming' 
                ? 'bg-amber-950/60 border-amber-500/70 shadow-md ring-1 ring-amber-400/40' 
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              )
            }
          >
            <div className="text-[10px] text-amber-300 font-bold flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>العوائد القادمة</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-400 my-1">
              {Number(upcomingTotal).toFixed(0)} <span className="text-[10px] font-normal">﷼</span>
            </div>
            <div className="text-[9px] text-amber-200/80 bg-amber-950/90 px-1.5 py-0.5 rounded-full font-bold truncate">
              رسوم بانتظار الصرف
            </div>
          </div>

          {/* 2. العوائد المكتملة (أرباح توصيل مصروفة) */}
          <div 
            onClick={() => { sound.pop(); setActiveTab('completed'); }}
            className={'p-3 rounded-2xl border transition-all cursor-pointer ' + 
              (activeTab === 'completed' 
                ? 'bg-emerald-950/60 border-emerald-500/70 shadow-md ring-1 ring-emerald-400/40' 
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              )
            }
          >
            <div className="text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>العوائد المكتملة</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 my-1">
              {Number(completedTotal).toFixed(0)} <span className="text-[10px] font-normal">﷼</span>
            </div>
            <div className="text-[9px] text-emerald-200/80 bg-emerald-950/90 px-1.5 py-0.5 rounded-full font-bold truncate">
              تم صرفها واستلامها
            </div>
          </div>

          {/* 3. كاش العهدة (COD في جيبك مطلوب توريده) */}
          <div 
            onClick={() => { sound.pop(); setActiveTab('settlements'); }}
            className={'p-3 rounded-2xl border transition-all cursor-pointer ' + 
              (activeTab === 'settlements' 
                ? 'bg-cyan-950/60 border-cyan-500/70 shadow-md ring-1 ring-cyan-400/40' 
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              )
            }
          >
            <div className="text-[10px] text-cyan-300 font-bold flex items-center justify-center gap-1">
              <Receipt className="w-3 h-3 text-cyan-400" />
              <span>التسويات والكاش</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-cyan-300 my-1">
              {(Number(driver.cashOnHand) || 0).toFixed(0)} <span className="text-[10px] font-normal">﷼</span>
            </div>
            <div className="text-[9px] text-cyan-200/80 bg-cyan-950/90 px-1.5 py-0.5 rounded-full font-bold truncate">
              {settledCount} سند مورد ✍️
            </div>
          </div>

        </div>
      </div>

      {/* 2. أزرار التبويب الثلاثية: العوائد القادمة | العوائد المكتملة | التسويات */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => { sound.pop(); setActiveTab('upcoming'); }}
          className={'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ' + 
            (activeTab === 'upcoming' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:text-white'
            )
          }
        >
          <Clock className="w-3.5 h-3.5" />
          <span>العوائد القادمة</span>
        </button>

        <button
          type="button"
          onClick={() => { sound.pop(); setActiveTab('completed'); }}
          className={'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ' + 
            (activeTab === 'completed' 
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:text-white'
            )
          }
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>العوائد المكتملة</span>
        </button>

        <button
          type="button"
          onClick={() => { sound.pop(); setActiveTab('settlements'); }}
          className={'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ' + 
            (activeTab === 'settlements' 
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:text-white'
            )
          }
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>التسويات</span>
        </button>
      </div>

      {/* 3. محتوى التبويب المختار */}
      
      {/* 🌟 تبويب 1: العوائد القادمة (أرباح ورسوم التوصيل المستحقة التي لم تصرف بعد) */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          
          {/* بطاقة توضيح موعد الصرف القادم */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-amber-300">دورة صرف العوائد القادمة</div>
                <div className="text-[11px] text-slate-400">تُصرف وتُسوّى تلقائياً كل 7 أيام (يوم الجمعة)</div>
              </div>
            </div>
            <div className="text-left font-mono font-bold text-xs text-amber-400">
              +{Number(upcomingTotal).toFixed(2)} ﷼
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between pt-1">
            <span className="flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-amber-400" />
              <span>الطلبات المستحقة لك عوائدها ({deliveredOrders.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">عمولة كل مشوار: 25 - 40 ﷼</span>
          </h4>

          {/* قائمة الطلبات التي أنجزها وبانتظار نزول رسوم التوصيل */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {deliveredOrders.map(o => {
              const fee = Number(o.driverCommission || o.deliveryFee || 25);
              return (
                <div key={o.id} className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      <span>{o.customerName}</span>
                      <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.2 rounded-md">
                        #{o.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {o.customerAddress || 'الدمام'} • {o.deliveredAt ? new Date(o.deliveredAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'اليوم'}
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="font-mono font-black text-sm text-amber-400">
                      +{fee.toFixed(2)} ﷼
                    </div>
                    <div className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded">
                      رسم توصيل مستحق
                    </div>
                  </div>
                </div>
              );
            })}

            {deliveredOrders.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800/80">
                لا توجد طلبات مسلمة بانتظار الصرف حالياً.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 تبويب 2: العوائد المكتملة (أرباح ورسوم التوصيل التي تم صرفها واستلامها بالفعل) */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-emerald-300">إجمالي العوائد المصروفة لك</div>
                <div className="text-[11px] text-slate-400">تم تحويلها واعتماد تسويتها بالكامل في حسابك</div>
              </div>
            </div>
            <div className="text-left font-mono font-black text-sm text-emerald-400">
              {Number(completedTotal).toFixed(2)} ﷼
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pt-1">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>سجل فواتير العوائد المصروفة ({completedInvoices.length})</span>
          </h4>

          {/* فواتير التسوية المصروفة */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-0.5">
            {completedInvoices.map(inv => (
              <div key={inv.id} className="p-3.5 bg-slate-900/90 border border-emerald-500/20 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-800/60">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.2 rounded-full">
                      مصروفة بالكامل ✅
                    </span>
                  </div>
                  <div className="font-mono font-black text-sm text-emerald-400">
                    +{Number(inv.totalCommissions).toFixed(2)} ﷼
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>عن {inv.orderCount} طلبات توصيل مكتملة</span>
                  <span className="font-mono">{inv.periodStartDate} إلى {inv.periodEndDate}</span>
                </div>
              </div>
            ))}

            {completedInvoices.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800/80">
                لا توجد دورات فوترة سابقة مسواة حتى الآن.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 تبويب 3: التسويات وسندات توريد الكاش والخزينة */}
      {activeTab === 'settlements' && (
        <div className="space-y-3">
          
          {/* تنبيه إذا كان هناك طلب تسوية معلق ينتظر توقيع المندوب */}
          {pendingRequests.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/60 space-y-2 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>طلب تسوية معلق بانتظار توقيعك ✍️</span>
                </div>
                <span className="font-mono font-bold text-xs text-amber-400">
                  {pendingRequests[0].amount} ﷼
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                أصدر المحاسب طلب تسوية وتوريد كاش. يرجى التوقيع والاعتماد لإغلاق السند.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onOpenSignModal) onOpenSignModal(pendingRequests[0]);
                }}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
              >
                توقيع واعتماد السند الآن ✍️
              </button>
            </div>
          )}

          {/* بطاقة كاش العهدة الحالي في الجيب */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">كاش العهدة بيدك الآن (COD):</div>
              <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                {(Number(driver.cashOnHand) || 0).toFixed(2)} ﷼
              </div>
            </div>
            <div className="text-left text-[10px] text-slate-400">
              <div>إجمالي المورد للخزينة:</div>
              <div className="font-mono font-bold text-emerald-400 text-xs">
                {Number(totalSettledCash).toFixed(2)} ﷼
              </div>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>سندات القبض والتوريد المعتمدة ({approvedVouchers.length})</span>
          </h4>

          {/* قائمة سندات التوريد المعتمدة مع التوقيع ورقم السند */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-0.5">
            {approvedVouchers.map(v => (
              <div key={v.id} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-cyan-950/80 text-cyan-300 px-2.5 py-0.5 rounded-lg border border-cyan-800/60">
                      {v.receiptNumber || v.id}
                    </span>
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                      سند معتمد ومورد ✅
                    </span>
                  </div>
                  <div className="font-mono font-black text-sm text-cyan-400">
                    {Number(v.amount).toFixed(2)} ﷼
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="truncate max-w-[200px]">{v.notes || 'تسوية وتوريد كاش'}</span>
                  <span className="font-mono text-slate-400">
                    {v.timestamp ? new Date(v.timestamp).toLocaleDateString('ar-SA') : 'معتمد'}
                  </span>
                </div>

                {v.driverSignature && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/80 p-2 rounded-xl">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>توقيعك الإلكتروني موثق</span>
                    </span>
                    <img src={v.driverSignature} alt="توقيع المندوب" className="h-6 object-contain bg-white/10 px-2 py-0.5 rounded" />
                  </div>
                )}
              </div>
            ))}

            {approvedVouchers.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800/80">
                لا توجد سندات توريد مسجلة حتى الآن.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

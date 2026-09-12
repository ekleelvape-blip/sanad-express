import React, { useState, useEffect } from 'react';
import { DollarSign, Wallet, ArrowDownLeft, Receipt, CheckCircle, Clock, TrendingUp, Building, CreditCard, Banknote, CheckSquare, Square, ChevronDown, ChevronUp, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { sound } from '../utils/sound';
import FridayInvoicesHub from './FridayInvoicesHub';

export default function FinancialHub({ drivers, branches, orders, onRefresh }) {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settleDriver, setSettleDriver] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [settleNotes, setSettleNotes] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [expandedDriverId, setExpandedDriverId] = useState(null);
  const [showFridayInvoices, setShowFridayInvoices] = useState(false);

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
        alert(`✅ تم تصفير وتسوية عهدة المندوب (${driver.name}) بالكامل وأصبح الرصيد 0.00 ﷼!`);
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
    const unsettled = driver.unsettledCodOrders || orders.filter(o => o.assignedDriverId === driver.id && o.status === 'delivered' && o.paymentMethod === 'cash' && !o.codSettled);
    setSelectedOrderIds(unsettled.map(o => o.id));
    setSettleNotes('تسوية واستلام كاش طلبات الدفع عند الاستلام');
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

  const totalCashWithDrivers = drivers.reduce((sum, d) => sum + (d.cashOnHand || 0), 0);
  const totalCommissions = drivers.reduce((sum, d) => sum + (d.totalCommissionToday || 0), 0);
  const receivedCashWalletTotal = financialData?.storeReceivedCashWallet?.totalBalance || 0;

  return (
    <div className="space-y-6">
      {/* ترويسة المركز المالي */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>💰</span>
            <span>المركز المالي وإدارة محفظة الكاش المستلم</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة كاش الدفع عند الاستلام مع المناديب، وتسويته وتصفيره من محافظهم وإيداعه في محفظة الكاش المستلم للمتجر
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFridayInvoices(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/40 border border-purple-400/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>📑</span>
            <span>فواتير الجمعة التلقائية للمناديب</span>
          </button>
          <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-800/60 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span>نظام تسوية النقدية الفوري</span>
          </span>
        </div>
      </div>

      {/* كروت المحافظ والمؤشرات الأساسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* محفظة الكاش المستلم للمتجر (تم توريدها من المناديب) */}
        <div className="bg-gradient-to-br from-purple-950/50 via-slate-900 to-indigo-950/60 border-2 border-purple-500/40 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
              <span>🏦</span>
              <span>محفظة الكاش المستلم للمتجر</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              💰
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-purple-300 mb-1">
            {receivedCashWalletTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-purple-300/80">
            النقدية الموردة والمودعة فعلياً في خزينة المتجر
          </p>
        </div>

        {/* كاش في عهدة المناديب (دفع عند الاستلام غير مسوى) */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <span>🛵</span>
              <span>كاش في محافظ المناديب</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mb-1">
            {totalCashWithDrivers.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-amber-300/80">
            مبالغ دفع عند الاستلام مع المناديب تنتظر التسوية
          </p>
        </div>

        {/* إجمالي مبيعات التوصيل اليوم */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">مبيعات التوصيل المسلمة</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 mb-1">
            {financialData?.totalSales?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-slate-400">
            كاش: {financialData?.cashSales || 0} ر.س • مدى: {financialData?.madaSales || 0} ر.س
          </p>
        </div>

        {/* عمولات المناديب */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-300">عمولات المناديب اليوم</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mb-1">
            {totalCommissions.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </div>
          <p className="text-[11px] text-emerald-400/80">
            مستحقات المشاوير المنجزة اليوم
          </p>
        </div>
      </div>

      {/* قسم تسوية طلبات الدفع عند الاستلام للمناديب (COD Settlement Center) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-amber-400" />
              <span>تسوية طلبات الدفع عند الاستلام للمناديب (تصفير المحفظة والتوريد للمتجر)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              حدد المندوب لتسوية طلبات الكاش المسلمة، وسيتم تصفير المبلغ من محفظته وإيداعه في محفظة الكاش المستلم للمتجر
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {drivers.map(driver => {
            const unsettled = driver.unsettledCodOrders || orders.filter(o => o.assignedDriverId === driver.id && o.status === 'delivered' && o.paymentMethod === 'cash' && !o.codSettled);
            const unsettledTotal = unsettled.reduce((sum, o) => sum + o.totalAmount, 0);
            const hasCash = unsettledTotal > 0 || (driver.cashOnHand || 0) > 0;
            const isExpanded = expandedDriverId === driver.id;

            return (
              <div key={driver.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center font-bold text-base">
                      🛵
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{driver.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({driver.phone})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        طلبات كاش معلقة: <span className="font-bold text-amber-400">{unsettled.length} طلبات</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="text-[10px] text-slate-400">كاش في محفظة المندوب:</div>
                      <div className={`font-mono font-black text-base ${hasCash ? 'text-amber-400' : 'text-slate-500'}`}>
                        {driver.cashOnHand || unsettledTotal} ر.س
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedDriverId(isExpanded ? null : driver.id)}
                      className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer"
                      title="عرض تفاصيل الطلبات"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenSettleCOD(driver)}
                      disabled={!hasCash}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        hasCash
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/40 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>تسوية الكاش</span>
                    </button>

                    <button
                      onClick={() => handleDirectZeroOutDriver(driver)}
                      disabled={!hasCash}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        hasCash
                          ? 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 active:scale-95'
                          : 'bg-slate-800/40 text-slate-600 cursor-not-allowed border border-slate-800'
                      }`}
                      title="تصفير العهدة فورا إلى 0 ﷼ بدون تعليق"
                    >
                      <span>⚡</span>
                      <span>تصفير العهدة (0 ﷼)</span>
                    </button>
                  </div>
                </div>

                {/* تفاصيل طلبات الدفع عند الاستلام التابعة للمندوب عند التوسيع */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 bg-slate-950/60 p-3 rounded-xl">
                    <div className="text-[11px] font-bold text-slate-300 mb-2">طلبات الدفع عند الاستلام المعلقة للتسوية:</div>
                    {unsettled.map(ord => (
                      <div key={ord.id} className="flex items-center justify-between text-xs p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-purple-400 font-bold">{ord.id}</span>
                          <span className="text-slate-200">{ord.customerName}</span>
                          <span className="text-slate-500 text-[10px]">({ord.customerAddress})</span>
                        </div>
                        <div className="font-mono font-bold text-amber-400">
                          +{ord.totalAmount} ر.س
                        </div>
                      </div>
                    ))}
                    {unsettled.length === 0 && (
                      <div className="text-center py-2 text-slate-500 text-xs">
                        لا توجد طلبات دفع عند الاستلام معلقة
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* سجل معاملات محفظة الكاش المستلم للمتجر */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-400" />
              <span>سجل إيداعات محفظة الكاش المستلم (سندات القبض المعتمدة)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              كل النقدية التي تم تصفيرها من المناديب وإيداعها في خزينة المتجر
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-300">
            الرصيد التراكمي: {receivedCashWalletTotal.toLocaleString()} ر.س
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
          {financialData?.storeReceivedCashWallet?.transactions?.map(tx => (
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
                  +{tx.amount.toLocaleString()} ر.س
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(tx.timestamp).toLocaleString('ar-SA')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نافذة تأكيد تسوية طلبات الدفع عند الاستلام */}
      {settleDriver && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-amber-400" />
              <span>تسوية طلبات الدفع عند الاستلام للمندوب ({settleDriver.name})</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              سيتم <strong>تصفير المبالغ المحددة من محفظة المندوب</strong> وإضافتها فوراً إلى <strong>محفظة الكاش المستلم للمتجر</strong>
            </p>

            <form onSubmit={handleConfirmSettleCOD} className="space-y-4 text-xs">
              {/* قائمة الطلبات لاختيارها */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-2">
                  <span>حدد الطلبات المراد تسويتها:</span>
                  <span className="text-purple-400 font-mono">المحدد: {selectedOrderIds.length} طلبات</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
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
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-purple-950/40 border-purple-600'
                            : 'bg-slate-900 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                          <div>
                            <div className="font-mono font-bold text-slate-200">{o.id} - {o.customerName}</div>
                            <div className="text-[10px] text-slate-400">{o.customerAddress}</div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">
                          {o.totalAmount} ر.س
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* المبلغ الإجمالي للتسوية والتوريد */}
              <div className="flex items-center justify-between bg-purple-950/40 border border-purple-800/60 p-3.5 rounded-xl">
                <div>
                  <div className="text-xs text-purple-300 font-bold">المبلغ الإجمالي للتسوية:</div>
                  <div className="text-[11px] text-slate-400">سيتم تصفيره من المندوب وإيداعه بمحفظة المتجر</div>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {orders.filter(o => selectedOrderIds.includes(o.id)).reduce((sum, o) => sum + o.totalAmount, 0)} <span className="text-xs font-normal">ر.س</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات التسوية / السند:</label>
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
                  <span>⚡</span>
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

      {/* سند القبض بعد التسوية */}
      {lastReceipt && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              ✅
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">تمت التسوية بنجاح!</h3>
            <p className="text-xs text-slate-400 mb-4">تم تصفير المبلغ من محفظة المندوب وإيداعه بمحفظة كاش المتجر</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right text-xs space-y-2 mb-5">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">رقم السند:</span>
                <span className="font-mono font-bold text-purple-400">{lastReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المندوب:</span>
                <span className="font-bold text-slate-200">{lastReceipt.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المبلغ المودع بمحفظة المتجر:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">{lastReceipt.amount} ر.س</span>
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

      {/* نافذة فواتير الجمعة الأسبوعية التلقائية */}
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

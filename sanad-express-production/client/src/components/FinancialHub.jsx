import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Wallet, ArrowDownLeft, ArrowUpRight, Receipt, CheckCircle, Clock, 
  TrendingUp, Building, CreditCard, Banknote, CheckSquare, Square, 
  ChevronDown, ChevronUp, Calendar, Sparkles, RefreshCw, Search, 
  Package, AlertTriangle, ShieldCheck, Check, Filter, Printer, ExternalLink,
  Send, Landmark, UserCheck, ArrowRightLeft, FileText, X, AlertCircle
} from 'lucide-react';
import { sound } from '../utils/sound';
import FridayInvoicesHub from './FridayInvoicesHub';
import { 
  SANAD_OFFICIAL_ENTITY, 
  tafqeetArabic, 
  tafqeetEnglish, 
  getOfficialFormattedDates, 
  OfficialStamp, 
  OfficialZatcaQr, 
  printOfficialDocument 
} from '../utils/officialDocs';

// دالة تحويل الأرقام إلى نصوص بالريال السعودي لسند الصرف الرسمي
function tafqeetSaudiRiyal(n) {
  const num = Math.floor(Math.abs(Number(n) || 0));
  if (num === 0) return 'صفر ريال سعودي لا غير';
  
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(val) {
    let res = '';
    const h = Math.floor(val / 100);
    const t = val % 100;
    if (h > 0) res += hundreds[h];
    if (t > 0) {
      if (res) res += ' و';
      if (t < 20) {
        res += ones[t];
      } else {
        const o = t % 10;
        const ten = Math.floor(t / 10);
        if (o > 0) res += ones[o] + ' و';
        res += tens[ten];
      }
    }
    return res;
  }

  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;
  const millions = Math.floor(num / 1000000);

  let parts = [];
  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions <= 10) parts.push(convertGroup(millions) + ' ملايين');
    else parts.push(convertGroup(millions) + ' مليون');
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands <= 10) parts.push(convertGroup(thousands) + ' آلاف');
    else parts.push(convertGroup(thousands) + ' ألف');
  }

  if (remainder > 0 || parts.length === 0) {
    parts.push(convertGroup(remainder));
  }

  return 'فقط ' + parts.join(' و') + ' ريال سعودي لا غير';
}

export default function FinancialHub({ drivers = [], branches = [], orders = [], onRefresh, activeTab = 'settlements' }) {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settleDriver, setSettleDriver] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [settleNotes, setSettleNotes] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [expandedDriverId, setExpandedDriverId] = useState(null);
  const [showFridayInvoices, setShowFridayInvoices] = useState(false);

  // حالة توريد كاش الخزينة للمحاسب المالي وتصفير الرصيد
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const [recipientType, setRecipientType] = useState('accountant'); // 'accountant' | 'bank_deposit' | 'general_manager'
  const [recipientName, setRecipientName] = useState('أ. محمد القحطاني (المحاسب المالي المعتمد)');
  const [officerName, setOfficerName] = useState('مشرف الخزينة والعمليات');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [selectedVaultBranchId, setSelectedVaultBranchId] = useState('branch-iklil-dammam');
  const [lastDisbursementReceipt, setLastDisbursementReceipt] = useState(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // حالة الفلترة والبحث
  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' | 'all' | 'settled'
  const [searchTerm, setSearchTerm] = useState('');
  const [txHistoryFilter, setTxHistoryFilter] = useState('all'); // 'all' | 'receipts' | 'disbursements'

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

  // فتح نافذة تسليم الكاش للمحاسب المالي وتصفير الخزينة
  const handleOpenTransferModal = () => {
    const currentBalance = Number(financialData?.storeReceivedCashWallet?.totalBalance) || 0;
    setTransferAmount(currentBalance);
    setReferenceNumber('DEP-' + Math.floor(100000 + Math.random() * 900000));
    setTransferNotes('تسليم وتوريد نقدية الخزينة المتراكمة للمحاسب المالي وتصفير رصيد الخزينة بالكامل');
    setShowTransferModal(true);
  };

  // تأكيد تسليم الكاش للمحاسب وتصفير الخزينة
  const handleConfirmTransferToAccountant = async (e) => {
    e?.preventDefault();
    const currentBalance = Number(financialData?.storeReceivedCashWallet?.totalBalance) || 0;
    const amt = Number(transferAmount);

    if (isNaN(amt) || amt <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للتسليم');
      return;
    }

    if (amt > currentBalance) {
      alert(`المبلغ المدخل (${amt.toLocaleString()} ر.س) يتجاوز رصيد الخزينة الحالي (${currentBalance.toLocaleString()} ر.س)`);
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const res = await fetch('/api/store-vault/transfer-to-accountant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          recipientType,
          recipientName,
          officerName,
          referenceNumber,
          notes: transferNotes,
          branchId: selectedVaultBranchId
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        sound.playCashRegister();
        setLastDisbursementReceipt(result.transaction);
        setShowTransferModal(false);
        fetchFinancials();
        if (onRefresh) onRefresh();
      } else {
        alert(result.error || 'فشلت عملية تسليم النقدية للمحاسب');
      }
    } catch (err) {
      console.error('Error transferring cash to accountant:', err);
      alert('تعذر الاتصال بالسيرفر لإتمام عملية التسليم');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // تصفير فوري 100% لخزينة المتجر وتسليمها للمحاسب بنقرة واحدة
  const handleDirectZeroOutVault = async () => {
    const currentBalance = Number(financialData?.storeReceivedCashWallet?.totalBalance) || 0;
    if (currentBalance <= 0) {
      alert('رصيد الخزينة مصفّر بالفعل (0.00 ر.س)');
      return;
    }

    if (!window.confirm(`تأكيد تصفير الخزينة: هل تريد تسليم كامل رصيد الخزينة (${currentBalance.toLocaleString()} ر.س) للمحاسب المالي وتصفير الرصيد فوراً إلى 0.00 ر.س؟`)) {
      return;
    }

    try {
      const res = await fetch('/api/store-vault/transfer-to-accountant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentBalance,
          recipientType: 'accountant',
          recipientName: 'المحاسب المالي المعتمد',
          officerName: 'مشرف الخزينة والعمليات',
          referenceNumber: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
          notes: `تصفير فوري وتوريد كامل كاش المتجر للمحاسب المالي بمبلغ ${currentBalance.toLocaleString()} ر.س`
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        sound.playCashRegister();
        setLastDisbursementReceipt(result.transaction);
        fetchFinancials();
        if (onRefresh) onRefresh();
      } else {
        alert(result.error || 'فشلت عملية التصفير');
      }
    } catch (err) {
      console.error('Error direct zeroing vault:', err);
      alert('تعذر الاتصال بالسيرفر');
    }
  };

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
  const receivedCashWalletTotal = Number(financialData?.storeReceivedCashWallet?.totalBalance) || 0;

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

  // تصفية سجل حركات الخزينة
  const filteredTransactions = useMemo(() => {
    const txs = financialData?.storeReceivedCashWallet?.transactions || [];
    if (txHistoryFilter === 'receipts') {
      return txs.filter(t => t.type !== 'disbursement');
    }
    if (txHistoryFilter === 'disbursements') {
      return txs.filter(t => t.type === 'disbursement');
    }
    return txs;
  }, [financialData, txHistoryFilter]);

  // حساب المتبقي بعد التسليم في النافذة
  const remainingAfterTransfer = Math.max(0, receivedCashWalletTotal - (Number(transferAmount) || 0));

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. ترويسة المركز المالي وأزرار الإجراءات السريعة */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
              💰
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>المركز المالي وإدارة الخزينة والكاش المستلم</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                دورة مالية مغلقة ومحكمة: توريد كاش المناديب إلى خزينة المتجر ثم تسليمها للمحاسب المالي وتصفيرها بالكامل
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* زر تسليم كاش الخزينة للمحاسب المالي وتصفيرها */}
          <button
            type="button"
            onClick={handleOpenTransferModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition-all cursor-pointer hover:scale-102 active:scale-95"
            title="تسليم النقدية المتوفرة بخزينة المتجر للمحاسب المالي وتصفير رصيد الخزينة"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>💼 تسليم كاش المتجر للمحاسب وتصفير الخزينة</span>
            {receivedCashWalletTotal > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-200 font-mono text-[11px] border border-emerald-500/40">
                {receivedCashWalletTotal.toLocaleString()} ﷼
              </span>
            )}
          </button>

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
            <span>تسوية نقدية فورية</span>
          </div>
        </div>
      </div>

      {/* 2. كروت المحافظ والمؤشرات المالية الأساسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* محفظة الكاش المستلم للمتجر (مع زر التصفير والتسليم للمحاسب) */}
        <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border border-purple-700/60 p-5 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <span>🏦</span>
                <span>خزينة الكاش المستلم للمتجر</span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                💰
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-200 mb-1">
              {receivedCashWalletTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </div>
            
            {/* مؤشر حالة الخزينة */}
            <div className="mb-3">
              {receivedCashWalletTotal > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>رصيد متراكم جاهز للتسليم للمحاسب</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>الخزينة مصفّرة ومورّدة بالكامل (0.00 ﷼)</span>
                </div>
              )}
            </div>
          </div>

          {/* أزرار العمليات المباشرة على الخزينة */}
          <div className="pt-3 border-t border-purple-900/50 flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenTransferModal}
              disabled={receivedCashWalletTotal <= 0}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                receivedCashWalletTotal > 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/60 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
              title="تسليم المبلغ للمحاسب المالي أو البنك واستخراج سند صرف"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>تسليم للمحاسب</span>
            </button>

            <button
              type="button"
              onClick={handleDirectZeroOutVault}
              disabled={receivedCashWalletTotal <= 0}
              className={`py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                receivedCashWalletTotal > 0
                  ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 hover:text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
              title="تصفير فوري 100% لخزينة المتجر وتسليم كامل الرصيد"
            >
              <Sparkles className="w-3 h-3 text-rose-400" />
              <span>تصفير (0 ﷼)</span>
            </button>
          </div>
        </div>

        {/* كاش في عهدة المناديب */}
        <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-800/50 p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
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

          <div className="pt-3 border-t border-amber-900/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>مناديب تمت تسويتهم:</span>
            <span className="font-bold text-emerald-400 font-mono">{settledCount} مناديب (خالص)</span>
          </div>
        </div>

        {/* مبيعات التوصيل المسلمة */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
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

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>الطلبات المكتملة:</span>
            <span className="font-bold text-cyan-400 font-mono">{orders.filter(o => o.status === 'delivered').length} طلب</span>
          </div>
        </div>

        {/* عمولات المناديب اليوم */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
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

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>التسوية الأسبوعية:</span>
            <span className="font-bold text-purple-400">تلقائية كل جمعة 📅</span>
          </div>
        </div>

      </div>

      {/* 3. جدول تسوية طلبات الدفع عند الاستلام للمناديب */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        {/* شريط التحكم، الفلاتر والبحث */}
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                <span>المرحلة الأولى: توريد كاش المناديب إلى خزينة المتجر</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تدقيق ومطابقة مبالغ الدفع عند الاستلام (COD) المسلمة مع المناديب وتوريدها وتصفير عهدة المندوب إلى (0 ﷼)
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
                              <span>خالص ومصفر (0 ﷼)</span>
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

      {/* 4. سجل حركة خزينة المتجر (سندات القبض 📥 وسندات الصرف والتوريد 📤) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-400" />
                <span>المرحلة الثانية والنهائية: سجل حركة الخزينة وسندات الصرف والقبض</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل تدقيق كامل لكافة عمليات توريد الكاش من المناديب وعمليات صرفها وتوريدها للمحاسب المالي أو البنك
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded-xl">
                الرصيد المتبقي بالخزينة: {receivedCashWalletTotal.toLocaleString()} ر.س
              </span>

              {receivedCashWalletTotal > 0 && (
                <button
                  type="button"
                  onClick={handleOpenTransferModal}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>تسليم للمحاسب الآن</span>
                </button>
              )}
            </div>
          </div>

          {/* فلاتر سجل الحركات */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setTxHistoryFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                txHistoryFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              جميع الحركات ({financialData?.storeReceivedCashWallet?.transactions?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setTxHistoryFilter('receipts')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                txHistoryFilter === 'receipts'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>سندات القبض والتوريد 📥</span>
            </button>

            <button
              type="button"
              onClick={() => setTxHistoryFilter('disbursements')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                txHistoryFilter === 'disbursements'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>سندات الصرف للمحاسب وتصفير الخزينة 📤</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(tx => {
              const isDisbursement = tx.type === 'disbursement';

              return (
                <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isDisbursement
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-800/40 shadow-sm'
                        : 'bg-purple-500/15 text-purple-400 border border-purple-800/40 shadow-sm'
                    }`}>
                      {isDisbursement ? '📤' : '📥'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-100">{tx.receiptNumber}</span>
                        {isDisbursement ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
                            سند صرف وتسليم للمحاسب 💼
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                            توريد كاش مناديب للخزينة 💵
                          </span>
                        )}
                        {tx.referenceNumber && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            مرجع: {tx.referenceNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-slate-400 mt-1">
                        {isDisbursement ? (
                          <span>
                            المستلم: <span className="text-rose-200 font-bold">{tx.recipientName || 'المحاسب المالي'}</span> • المسلّم: <span className="text-slate-300">{tx.officerName || 'مشرف الفرع'}</span> • {tx.notes}
                          </span>
                        ) : (
                          <span>
                            المندوب: <span className="text-slate-200 font-bold">{tx.driverName}</span> • عدد {tx.orderCount || 1} طلبات • {tx.notes}
                          </span>
                        )}
                      </div>

                      {isDisbursement && typeof tx.newBalance === 'number' && (
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          رصيد الخزينة السابق: {Number(tx.prevBalance || 0).toLocaleString()} ﷼ ⬅️ الرصيد بعد العملية: <strong className="text-emerald-400">{Number(tx.newBalance).toLocaleString()} ﷼</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left shrink-0 space-y-1">
                    <div className={`font-mono font-black text-base ${isDisbursement ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isDisbursement ? '-' : '+'}{Number(tx.amount).toLocaleString()} ر.س
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(tx.timestamp).toLocaleString('ar-SA')}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isDisbursement) {
                            setLastDisbursementReceipt(tx);
                          } else {
                            setLastReceipt(tx);
                          }
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>معاينة / طباعة السند</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              لا توجد عمليات مسجلة في هذا التبويب حتى الآن
            </div>
          )}
        </div>
      </div>

      {/* 5. نافذة تأكيد تسليم كاش الخزينة للمحاسب المالي وتصفير الرصيد (Transfer Modal) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-lg">
                  💼
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>تسليم كاش المتجر للمحاسب المالي وتصفير الخزينة</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    إنشاء سند صرف رسمي وتفريغ محفظة الكاش المستلم وتحويلها للمحاسبة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmTransferToAccountant} className="space-y-4 text-xs">
              
              {/* بطاقة الحسبة المحاسبية التوضيحية */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 mb-1">رصيد الخزينة الحالي</div>
                    <div className="text-sm font-black font-mono text-purple-300">
                      {receivedCashWalletTotal.toLocaleString()} ﷼
                    </div>
                  </div>

                  <div className="p-2.5 bg-rose-950/40 rounded-xl border border-rose-800/40">
                    <div className="text-[10px] text-rose-300 mb-1">المبلغ المراد تسليمه</div>
                    <div className="text-sm font-black font-mono text-rose-400">
                      -{Number(transferAmount || 0).toLocaleString()} ﷼
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${
                    remainingAfterTransfer === 0
                      ? 'bg-emerald-950/40 border-emerald-500/60'
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="text-[10px] text-slate-400 mb-1">الرصيد بعد التسليم</div>
                    <div className={`text-sm font-black font-mono ${
                      remainingAfterTransfer === 0 ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {remainingAfterTransfer.toLocaleString()} ﷼
                    </div>
                    {remainingAfterTransfer === 0 && (
                      <span className="text-[9px] text-emerald-300 font-bold block mt-0.5">تصفير كامل 🎯</span>
                    )}
                  </div>
                </div>
              </div>

              {/* حقل تحديد المبلغ مع زر التصفير 100% */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-200 font-bold">المبلغ المسلم للمحاسب (ر.س):</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferAmount(receivedCashWalletTotal)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold cursor-pointer hover:bg-emerald-500/30 active:scale-95 transition-all"
                    >
                      💯 تصفير كامل الرصيد (100% Zero-Out)
                    </button>
                    {receivedCashWalletTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => setTransferAmount(Math.round(receivedCashWalletTotal / 2))}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] cursor-pointer hover:bg-slate-700"
                      >
                        50%
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={receivedCashWalletTotal}
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-lg font-black rounded-xl p-3 pr-4 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">ر.س</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  المبلغ كتابة: <span className="text-emerald-300 font-semibold">{tafqeetSaudiRiyal(transferAmount)}</span>
                </div>
              </div>

              {/* جهة التسليم / المستلم */}
              <div>
                <label className="block text-slate-200 font-bold mb-1.5">طريقة وجهة تسليم النقدية:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('accountant');
                      setRecipientName('أ. محمد القحطاني (المحاسب المالي المعتمد)');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      recipientType === 'accountant'
                        ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                    <span>المحاسب المالي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('bank_deposit');
                      setRecipientName('إيداع بحساب الشركة - مصرف الراجحي');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      recipientType === 'bank_deposit'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Landmark className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                    <span>إيداع بنكي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('general_manager');
                      setRecipientName('الإدارة العامة / الإدارة المالية المركزية');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      recipientType === 'general_manager'
                        ? 'bg-amber-950/60 border-amber-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span>الإدارة المالية</span>
                  </button>
                </div>
              </div>

              {/* اسم المستلم والمسؤول */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">اسم المستلم المعتمد:</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-cyan-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">المسلّم (أمين الخزينة):</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-cyan-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* رقم المرجع والملاحظات */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رقم الإيداع / السند المرجعي:</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono rounded-xl p-2.5 focus:border-cyan-500 outline-none"
                    placeholder="DEP-XXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">فرع الخزينة:</label>
                  <select
                    value={selectedVaultBranchId}
                    onChange={(e) => setSelectedVaultBranchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-cyan-500 outline-none"
                  >
                    <option value="branch-iklil-dammam">فرع الدمام الرئيسي - الخزينة المركزية</option>
                    <option value="branch-khobar">فرع الخبر</option>
                    <option value="branch-ahsa">فرع الأحساء</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">البيان / ملاحظات السند:</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-cyan-500 outline-none"
                />
              </div>

              {/* أزرار الإجراء */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-700"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingTransfer || transferAmount <= 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingTransfer ? (
                    <span>جاري تصفير الخزينة...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>تأكيد التسليم وتصفير الخزينة واستخراج السند 💼</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. نافذة سند الصرف والتسليم للمحاسب المالي (Official Saudi Corporate A4 Voucher) */}
      {lastDisbursementReceipt && (() => {
        const docDates = getOfficialFormattedDates(lastDisbursementReceipt.timestamp);
        return (
          <div className="fixed inset-0 z-[3500] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-['Cairo','Tajawal',sans-serif]">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl my-auto p-4 sm:p-6 space-y-4 max-h-[96vh] flex flex-col">
              
              {/* شريط الإجراءات العلوي للطباعة والإغلاق */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                    تم قيد السند وتصفير الخزينة محاسبياً بنجاح ✓
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printOfficialDocument('official-disbursement-doc', `سند صرف نقدية - ${lastDisbursementReceipt.receiptNumber}`)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00d2d3] to-cyan-500 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4 stroke-[2.5]" />
                    <span>طباعة السند الرسمي مقاس A4 📄</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLastDisbursementReceipt(null)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* جسم السند الرسمي القابل للطباعة والمعاينة (A4 White Sheet) */}
              <div className="overflow-y-auto pr-1">
                <div 
                  id="official-disbursement-doc"
                  className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-slate-900 space-y-4 text-right relative overflow-hidden font-['Cairo','Tajawal',sans-serif]"
                  dir="rtl"
                >
                  {/* علامة مائية باهتة لسند في الخلفية */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <span className="text-8xl sm:text-9xl font-black tracking-widest uppercase">SANAD</span>
                  </div>

                  {/* 1. الترويسة الرسمية المعتمدة */}
                  <div className="border-b-2 border-slate-900 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      {/* اليمين: شعار سند للخدمات اللوجستية وبياناتها */}
                      <div className="flex items-center gap-3">
                        <img 
                          src={SANAD_OFFICIAL_ENTITY.logoUrl} 
                          alt="شعار سَنَد" 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-300 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">🏛️</span>
                            <h2 className="text-base sm:text-lg font-black text-slate-950 leading-tight">
                              سند للخدمات اللوجستية
                            </h2>
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 font-sans tracking-wide">
                            SANAD LOGISTICS CO.
                          </div>
                          
                          
                        </div>
                      </div>

                      {/* اليسار: رقم السند والتاريخ ورمز التحقق QR */}
                      <div className="flex items-center gap-2.5">
                        <div className="text-left space-y-1">
                          <div className="inline-block border border-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <span className="text-[9.5px] text-slate-600 block">رقم السند:</span>
                            <span className="font-mono font-black text-xs text-slate-950">
                              {lastDisbursementReceipt.receiptNumber}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-slate-600">
                            <div>التاريخ: <strong className="font-mono text-slate-900">{docDates.hijri}</strong></div>
                            <div>الموافق: <strong className="font-mono text-slate-900">{docDates.gregorian}</strong></div>
                            <div>الوقت: <strong className="font-mono text-slate-900">{docDates.time}</strong></div>
                          </div>
                        </div>
                        <OfficialZatcaQr size={64} />
                      </div>
                    </div>

                    {/* العنوان البارز للسند */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="bg-slate-900 text-white px-5 py-1.5 rounded-lg shadow-sm font-black text-xs sm:text-sm tracking-wide">
                        سند صرف نقدية (DISBURSEMENT VOUCHER)
                      </div>
                      <div className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span>
                        <span>معتمد ومسجل محاسبياً باليومية العامة للسند</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. جدول أطراف المعاملة المالية والتفاصيل */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-800 bg-slate-50 border-b border-slate-800">
                      <div className="p-3">
                        <span className="text-slate-500 text-[10.5px] block font-semibold">الطرف المسلّم:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-black text-slate-950 text-sm">محاسب سند</span>
                          <span className="text-xs text-slate-600 font-bold">({lastDisbursementReceipt.officerName || 'أمين الخزينة'})</span>
                        </div>
                        <span className="text-[9.5px] text-slate-500 block mt-0.5">الصفة: المسؤول المالي وأمين الخزينة المركزية</span>
                      </div>

                      <div className="p-3 bg-cyan-50/40">
                        <span className="text-slate-500 text-[10.5px] block font-semibold">الطرف المستلم:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-black text-slate-950 text-sm">
                            {lastDisbursementReceipt.recipientType === 'bank_deposit'
                              ? `المحاسب المالي / البنك (${lastDisbursementReceipt.recipientName || 'مصرف الراجحي'})`
                              : `المحاسب المالي / البنك (${lastDisbursementReceipt.recipientName || 'أ. محمد القحطاني'})`}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-500 block mt-0.5">
                          {lastDisbursementReceipt.recipientType === 'bank_deposit' 
                            ? 'الصفة: حساب الشركة البنكي المعتمد (إيداع مباشر)' 
                            : 'الصفة: الإدارة المالية والحسابات العامة'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-800 bg-white text-[11px]">
                      <div className="p-2.5">
                        <span className="text-slate-500 text-[9.5px] block">طريقة التسليم:</span>
                        <strong className="text-slate-900 text-xs">
                          {lastDisbursementReceipt.recipientType === 'bank_deposit' ? 'إيداع بنكي مباشر' : 'تسليم نقدي (كاش يداً بيد)'}
                        </strong>
                      </div>
                      <div className="p-2.5">
                        <span className="text-slate-500 text-[9.5px] block">رقم المرجع:</span>
                        <strong className="font-mono text-slate-900 text-xs">{lastDisbursementReceipt.referenceNumber || 'DEP-ONLINE'}</strong>
                      </div>
                      <div className="p-2.5">
                        <span className="text-slate-500 text-[9.5px] block">الفرع والمركز:</span>
                        <strong className="text-slate-900 text-xs">المركز اللوجستي الرئيسي - الرياض</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3. صندوق المبلغ المحرر بنظام الشيكات المصرفية الرسمية */}
                  <div className="bg-slate-50 border-2 border-slate-900 p-3 sm:p-4 rounded-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-700 font-bold">[ المبلغ المعتمد ]:</span>
                          <span className="font-mono font-black text-lg sm:text-xl text-slate-950">
                            {Number(lastDisbursementReceipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س SAR
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-slate-950 mt-1">
                          التفقيط العربي : {tafqeetArabic(lastDisbursementReceipt.amount)}
                        </div>
                        <div className="text-[11px] font-serif italic text-slate-600 mt-0.5" dir="ltr">
                          التفقيط الإنجليزي: {tafqeetEnglish(lastDisbursementReceipt.amount)}
                        </div>
                      </div>

                      <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-center shrink-0 border border-slate-700 shadow-md">
                        <span className="text-[9.5px] text-slate-300 block">صافي المبلغ بالأرقام</span>
                        <span className="font-mono font-black text-xl tracking-wider text-[#00d2d3]">
                          {Number(lastDisbursementReceipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-bold text-slate-200 mr-1.5">﷼ SAR</span>
                      </div>
                    </div>

                    {/* حركة تصفير الخزينة */}
                    <div className="pt-2.5">
                      <div className="text-xs text-slate-700 font-bold mb-1">
                        حركة تصفير الخزينة:
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-500 text-[9.5px] block">الرصيد السابق:</span>
                          <strong className="font-mono text-slate-900 text-sm">{Number(lastDisbursementReceipt.prevBalance || 0).toLocaleString()} ﷼</strong>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-red-700 text-[9.5px] block font-bold">المصروف:</span>
                          <strong className="font-mono text-red-700 text-sm font-bold">-{Number(lastDisbursementReceipt.amount || 0).toLocaleString()} ﷼</strong>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-300">
                          <span className="text-emerald-800 text-[9.5px] block font-bold">الرصيد الحالي:</span>
                          <strong className="font-mono text-emerald-800 text-sm font-black">
                            {Number(lastDisbursementReceipt.newBalance || 0).toFixed(2)} ﷼ (مصفّر بالكامل)
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. البيان والتوضيح المحاسبي */}
                  <div className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs space-y-0.5">
                    <div className="text-slate-500 font-bold text-[10.5px]">البيان / الغرض من الصرف:</div>
                    <div className="text-slate-900 font-semibold leading-relaxed text-[11px]">
                      {lastDisbursementReceipt.notes || 'تسليم نقدية وتصفير عهدة كاش المتجر للمحاسبة / إيداع بنكي وتصفير رصيد الخزينة بالكامل.'}
                    </div>
                  </div>

                  {/* 5. التواقيع والاعتمادات الرسمية الرباعية والختم المعتمد */}
                  <div className="pt-2">
                    <div className="text-[10.5px] font-bold text-slate-700 border-b border-slate-300 pb-1 mb-3">
                      اعتمادات وتواقيع أطراف السند الرسمية:
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs relative">
                      
                      {/* توقيع 1: المسلّم */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-800 block text-[11px]">توقيع المسلّم</span>
                        <span className="text-[10px] text-slate-500 block font-semibold">(محاسب سند)</span>
                        <div className="border-b-2 border-dotted border-slate-400 w-24 mx-auto pt-2"></div>
                        <div className="text-[9.5px] text-slate-600 font-semibold">{lastDisbursementReceipt.officerName || 'محاسب سند'}</div>
                      </div>

                      {/* توقيع 2: المستلم */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-800 block text-[11px]">توقيع المستلم</span>
                        <span className="text-[10px] text-slate-500 block font-semibold">(المحاسب المالي)</span>
                        <div className="border-b-2 border-dotted border-slate-400 w-24 mx-auto pt-2"></div>
                        <div className="text-[9.5px] text-slate-600 font-semibold">{lastDisbursementReceipt.recipientName || 'المحاسب المالي'}</div>
                      </div>

                      {/* توقيع 3: المراجع الداخلي */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-800 block text-[11px]">المراجعة والتدقيق</span>
                        <span className="text-[10px] text-slate-500 block font-semibold">(المراجع الداخلي)</span>
                        <div className="border-b-2 border-dotted border-slate-400 w-24 mx-auto pt-2"></div>
                        <div className="text-[9.5px] text-slate-600 font-semibold">قسم التدقيق الداخلي</div>
                      </div>

                      {/* توقيع 4: الاعتماد المالي والختم */}
                      <div className="space-y-1 relative">
                        <span className="font-bold text-slate-900 block text-[11px]">الاعتماد المالي والختم</span>
                        <span className="text-[10px] text-slate-600 block font-semibold">(المدير)</span>
                        <div className="border-b-2 border-dotted border-slate-400 w-24 mx-auto pt-2"></div>
                        <div className="text-[9.5px] text-slate-700 font-bold">المدير العام المعتمد</div>
                        
                        {/* 🔵 الختم الرسمي الأزرق */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                          <OfficialStamp department="الخزينة المركزية" statusText="معتمد ومصفّر" size={95} />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* تذييل الوثيقة */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <div>تم الإصدار والتوثيق آلياً عبر منظومة سَنَد اللوجستية - سند صرف نقدية معتمد</div>
                    <div>وثيقة مالية رسمية</div>
                  </div>

                </div>
              </div>

              {/* أزرار الإغلاق السفلية */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 print:hidden shrink-0">
                <button
                  type="button"
                  onClick={() => printOfficialDocument('official-disbursement-doc', `سند صرف نقدية - ${lastDisbursementReceipt.receiptNumber}`)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة أو حفظ PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLastDisbursementReceipt(null)}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
                >
                  إغلاق السند والعودة للمركز المالي
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 7. سند القبض بعد تسوية المندوب (Official Saudi Corporate A4 Receipt Voucher) */}
      {lastReceipt && (() => {
        const docDates = getOfficialFormattedDates(lastReceipt.timestamp);
        return (
          <div className="fixed inset-0 z-[3500] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-['Cairo','Tajawal',sans-serif]">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl my-auto p-4 sm:p-6 space-y-4 max-h-[96vh] flex flex-col">
              
              {/* شريط الإجراءات العلوي للطباعة والإغلاق */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                    تم توريد النقدية وتصفير محفظة المندوب وإصدار السند بنجاح ✓
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printOfficialDocument('official-receipt-doc', `سند قبض وتوريد - ${lastReceipt.receiptNumber || 'SANAD'}`)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00d2d3] to-cyan-500 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4 stroke-[2.5]" />
                    <span>طباعة السند الرسمي مقاس A4 📄</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLastReceipt(null)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* جسم سند القبض الرسمي (A4 White Sheet) */}
              <div className="overflow-y-auto pr-1">
                <div 
                  id="official-receipt-doc"
                  className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-slate-900 space-y-4 text-right relative overflow-hidden font-['Cairo','Tajawal',sans-serif]"
                  dir="rtl"
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <span className="text-8xl font-black tracking-widest uppercase">SANAD</span>
                  </div>

                  {/* 1. الترويسة الرسمية */}
                  <div className="border-b-2 border-slate-900 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={SANAD_OFFICIAL_ENTITY.logoUrl} 
                          alt="شعار سَنَد" 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-300 shadow-sm"
                        />
                        <div>
                          <h2 className="text-sm sm:text-base font-black text-slate-950 leading-tight">
                            {SANAD_OFFICIAL_ENTITY.nameAr}
                          </h2>
                          <div className="text-[10.5px] font-bold text-slate-700 font-sans tracking-wide">
                            {SANAD_OFFICIAL_ENTITY.nameEn}
                          </div>
                          
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-left space-y-1">
                          <div className="inline-block border border-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <span className="text-[9.5px] text-slate-600 block">رقم السند:</span>
                            <span className="font-mono font-black text-xs text-slate-950">
                              {lastReceipt.receiptNumber || `RCT-${Date.now().toString().slice(-6)}`}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-slate-600">
                            <div>التاريخ الميلادي: <strong className="font-mono text-slate-900">{docDates.gregorian}</strong></div>
                            <div>التاريخ الهجري: <strong className="font-mono text-slate-900">{docDates.hijri}</strong></div>
                          </div>
                        </div>
                        <OfficialZatcaQr size={64} />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                      <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg shadow-sm font-black text-xs sm:text-sm tracking-wide">
                        سند قبض وتوريد نقدية - تحصيل طلبات (OFFICIAL CASH RECEIPT VOUCHER)
                      </div>
                      <div className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span>
                        <span>تم الإيداع الفوري في محفظة كاش المتجر</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. بيانات المندوب والتحصيل */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-800 bg-slate-50 border-b border-slate-800">
                      <div className="p-2.5">
                        <span className="text-slate-500 text-[10px] block font-semibold">المورّد / المسلّم:</span>
                        <span className="font-bold text-slate-950 text-xs sm:text-sm">الكابتن: {lastReceipt.driverName}</span>
                        <span className="text-[9.5px] text-slate-500 block">الصفة: مندوب توصيل ميداني معتمد</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50/40">
                        <span className="text-slate-500 text-[10px] block font-semibold">المستلم (الخزينة المركزية):</span>
                        <span className="font-bold text-slate-950 text-xs sm:text-sm">مشرف وأمين خزينة الفرع</span>
                        <span className="text-[9.5px] text-slate-500 block">محفظة الإيداع: كاش المتجر المستلم</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-800 bg-white text-[11px]">
                      <div className="p-2">
                        <span className="text-slate-500 text-[9.5px] block">نوع التحصيل:</span>
                        <strong className="text-slate-900 text-xs">دفع عند الاستلام (COD)</strong>
                      </div>
                      <div className="p-2">
                        <span className="text-slate-500 text-[9.5px] block">حالة محفظة المندوب:</span>
                        <strong className="text-emerald-700 text-xs font-bold">تم التصفير بالكامل ✓</strong>
                      </div>
                      <div className="p-2">
                        <span className="text-slate-500 text-[9.5px] block">الفرع والمركز:</span>
                        <strong className="text-slate-900 text-xs">المركز اللوجستي الرئيسي - الرياض</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3. صندوق المبلغ المقبوض */}
                  <div className="bg-slate-50 border-2 border-slate-900 p-3 sm:p-4 rounded-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-slate-600 font-bold block">المبلغ المقبوض والمودع بالخزينة كتابة ورقماً:</span>
                        <div className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
                          {tafqeetArabic(lastReceipt.amount)}
                        </div>
                        <div className="text-[10px] font-serif italic text-slate-600 mt-0.5" dir="ltr">
                          {tafqeetEnglish(lastReceipt.amount)}
                        </div>
                      </div>

                      <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-center shrink-0 border border-slate-700 shadow-md">
                        <span className="text-[9.5px] text-slate-300 block">المبلغ المقبوض</span>
                        <span className="font-mono font-black text-lg sm:text-xl tracking-wider text-emerald-400">
                          {Number(lastReceipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-bold text-slate-200 mr-1">ر.س SAR</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. البيان */}
                  <div className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs space-y-0.5">
                    <div className="text-slate-500 font-bold text-[10.5px]">البيان والتسوية:</div>
                    <div className="text-slate-900 font-semibold text-[11px]">
                      {lastReceipt.notes || `استلام وتوريد مبالغ شحنات الدفع عند الاستلام المسلمة وتصفير محفظة المندوب (${lastReceipt.driverName}) وإيداعها بخزينة المتجر.`}
                    </div>
                  </div>

                  {/* 5. التواقيع والختم المعتمد */}
                  <div className="pt-2">
                    <div className="text-[10.5px] font-bold text-slate-700 border-b border-slate-300 pb-1 mb-3">
                      اعتمادات وتواقيع أطراف العملية:
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs relative">
                      <div className="space-y-3">
                        <span className="font-bold text-slate-700 block text-[10px]">المورّد (المندوب)</span>
                        <div className="border-b-2 border-dotted border-slate-400 w-24 mx-auto"></div>
                        <div className="text-[9.5px] text-slate-600 font-semibold">{lastReceipt.driverName}</div>
                      </div>

                      <div className="space-y-3">
                        <span className="font-bold text-slate-700 block text-[10px]">المستلم (أمين الخزينة)</span>
                        <div className="border-b-2 border-dotted border-slate-400 w-24 mx-auto"></div>
                        <div className="text-[9.5px] text-slate-600 font-semibold">مشرف الخزينة والعمليات</div>
                      </div>

                      <div className="space-y-1 relative">
                        <span className="font-bold text-slate-900 block text-[10px]">الاعتماد والختم الرسمي</span>
                        <div className="border-b-2 border-dotted border-slate-400 w-24 mx-auto pt-1"></div>
                        <div className="text-[9.5px] text-slate-700 font-bold">الخزينة المركزية</div>
                        
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                          <OfficialStamp department="الخزينة المركزية" statusText="مقبوض ومقيد" size={95} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* تذييل */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <div>تم التوثيق آلياً عبر منظومة سَنَد اللوجستية المركزية - سند قبض رسمي معتمد</div>
                    <div>وثيقة قبض رسمية معتمدة</div>
                  </div>

                </div>
              </div>

              {/* الأزرار السفلية */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 print:hidden shrink-0">
                <button
                  type="button"
                  onClick={() => printOfficialDocument('official-receipt-doc', `سند قبض وتوريد - ${lastReceipt.receiptNumber || 'SANAD'}`)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة أو حفظ PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLastReceipt(null)}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
                >
                  إغلاق السند والعودة للمركز المالي
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 8. نافذة تسوية طلبات الدفع عند الاستلام للمندوب */}
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

      {/* 9. نافذة فواتير الجمعة الأسبوعية التلقائية */}
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

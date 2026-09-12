import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, DollarSign, Download, Printer, CheckCircle2, 
  Clock, RefreshCw, X, ShieldCheck, Sparkles, Award, User, ChevronLeft,
  Search, ArrowDownRight, ArrowUpRight, QrCode
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function FridayInvoicesHub({ drivers = [], branches = [], onClose }) {
  const [invoices, setInvoices] = useState([]);
  const [schedulerInfo, setSchedulerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState('current');
  const [generating, setGenerating] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices/friday');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        if (data.scheduler) setSchedulerInfo(data.scheduler);
      }
    } catch (err) {
      console.error('Error fetching Friday invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleGenerateInvoices = async () => {
    try {
      setGenerating(true);
      const res = await fetch('/api/invoices/friday/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        sound.playCashRegister();
        await fetchInvoices();
        alert('✅ تم إصدار وتحديث فواتير يوم الجمعة التلقائية لجميع المناديب بنجاح!');
      }
    } catch (err) {
      alert('حدث خطأ أثناء إصدار الفواتير');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintInvoice = () => {
    const printElement = document.getElementById('friday-invoice-print');
    if (!printElement) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const invoiceHtml = printElement.outerHTML;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة تسوية سند A4 - ${selectedInvoice?.invoiceNumber || ''}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Cairo', sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 210mm;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0;
            padding: 0;
          }
          #friday-invoice-print {
            width: 194mm !important;
            max-width: 194mm !important;
            margin: 0 auto !important;
            padding: 6mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-sizing: border-box !important;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        ${invoiceHtml}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 400);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = (
      inv.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.driverPhone?.includes(searchQuery)
    );

    if (!matchesSearch) return false;

    if (selectedCycleFilter === 'current') {
      return inv.status !== 'settled' || !inv.issuedAt || new Date(inv.issuedAt) > new Date(Date.now() - 6 * 86400000);
    } else if (selectedCycleFilter === 'previous') {
      return inv.status === 'settled' || (inv.issuedAt && new Date(inv.issuedAt) <= new Date(Date.now() - 6 * 86400000));
    }
    return true;
  });

  const totalCommissionsAll = filteredInvoices.reduce((sum, i) => sum + (i.totalCommissions || 0), 0);
  const totalCodAll = filteredInvoices.reduce((sum, i) => sum + (i.totalCodCollected || 0), 0);
  const totalOrdersAll = filteredInvoices.reduce((sum, i) => sum + (i.orderCount || 0), 0);

  return (
    <div className="space-y-5 text-right font-['Tajawal','Cairo',sans-serif]" dir="rtl">
      
      {/* الترويسة الرئيسية لنظام الفوترة التلقائي كل 7 أيام */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a1526] to-slate-900 border border-cyan-950/70 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[#00d2d3] shadow-md shadow-cyan-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  نظام إصدار فواتير المناديب التلقائي (كل 7 أيام)
                </h2>
                <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>إصدار تلقائي ذاتي 100%</span>
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                دورة محاسبية أسبوعية مستمرة تصدر تلقائياً كل 7 أيام للمناديب المعتمدين بدون أي تدخل يدوي
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleGenerateInvoices}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={'w-4 h-4 ' + (generating ? 'animate-spin' : '')} />
            <span>{generating ? 'جاري فحص وتحديث الدورة...' : 'فحص وتحديث دورة الـ 7 أيام ⚡'}</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* شريط معلومات دورة الـ 7 أيام التلقائية */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-900/50 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            ⏱️
          </div>
          <div>
            <div className="font-bold text-purple-200">
              دورة الفوترة: <span className="text-white font-mono">كل 7 أيام (أسبوع كامل)</span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              فترة الدورة الحالية: <span className="font-mono text-purple-300 font-bold">{schedulerInfo?.currentCycleStart || '2026-08-28'}</span> إلى <span className="font-mono text-purple-300 font-bold">{schedulerInfo?.currentCycleEnd || '2026-09-04'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] text-slate-400">تاريخ الدورة التلقائية القادمة:</div>
            <div className="font-mono font-bold text-emerald-400 text-sm">
              {schedulerInfo?.nextAutoCycleDate || '2026-09-11'} (تلقائي)
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">حالة الجدولة الآلية:</div>
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>نشط على مدار الساعة 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات المؤشرات الأسبوعية لدورة الـ 7 أيام */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">فواتير دورة الـ 7 أيام</div>
          <div className="text-2xl font-black font-mono text-[#00d2d3]">{filteredInvoices.length} فاتورة</div>
          <div className="text-[10px] text-emerald-400 mt-1">تغطي جميع المناديب الميدانيين</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">إجمالي الشحنات المنجزة (7 أيام)</div>
          <div className="text-2xl font-black font-mono text-white">{totalOrdersAll} شحنة</div>
          <div className="text-[10px] text-slate-400 mt-1">خلال دورة الـ 7 أيام المنتهية</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">عمولات التوصيل المستحقة (20 ﷼/طلب)</div>
          <div className="text-2xl font-black font-mono text-emerald-400">{totalCommissionsAll.toFixed(2)} ﷼</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">مستحقات أرباح السائقين المعتمدة</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">إجمالي كاش الدفع عند الاستلام</div>
          <div className="text-2xl font-black font-mono text-amber-400">{totalCodAll.toFixed(2)} ﷼</div>
          <div className="text-[10px] text-amber-500/80 mt-1">عهد نقدية تم تحصيلها باليد</div>
        </div>
      </div>

      {/* أزرار اختيار دورة الـ 7 أيام وشريط البحث */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCycleFilter('current')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCycleFilter === 'current'
                ? 'bg-[#00d2d3] text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الدورة الحالية (آخر 7 أيام)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCycleFilter('previous')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCycleFilter === 'previous'
                ? 'bg-[#00d2d3] text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الدورة السابقة (7 أيام ماضية)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCycleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCycleFilter === 'all'
                ? 'bg-[#00d2d3] text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            كافة الدورات
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المندوب أو رقم الفاتورة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* جدول فواتير دورة الـ 7 أيام التلقائية */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-3.5 px-4">رقم الفاتورة</th>
                <th className="py-3.5 px-4">المندوب</th>
                <th className="py-3.5 px-4">الفرع</th>
                <th className="py-3.5 px-4">فترة الدورة (7 أيام)</th>
                <th className="py-3.5 px-4">عدد الشحنات</th>
                <th className="py-3.5 px-4">العمولات المستحقة</th>
                <th className="py-3.5 px-4">الكاش المحصل</th>
                <th className="py-3.5 px-4">صافي التسوية</th>
                <th className="py-3.5 px-4">طريقة الإصدار</th>
                <th className="py-3.5 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{inv.driverName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.driverPhone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-bold">
                    {inv.branchName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                    {inv.periodStartDate ? `${inv.periodStartDate} إلى ${inv.periodEndDate}` : inv.fridayDate}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-white">
                    {inv.orderCount} شحنة
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    +{inv.totalCommissions.toFixed(2)} ﷼
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                    {inv.totalCodCollected.toFixed(2)} ﷼
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black">
                    <span className={inv.netSettlement >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {inv.netSettlement.toFixed(2)} ﷼
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>تلقائي (كل 7 أيام)</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-950 hover:text-[#00d2d3] border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>عرض الفاتورة 🖨️</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة الفاتورة الرسمية المعتمدة بيوم الجمعة للمندوب مع الشعار والختم الرسمي */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden font-['Cairo','Tajawal',sans-serif] my-auto">
            
            {/* شريط الإجراءات العلوي للطباعة والإغلاق */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="px-4 py-2 bg-[#00d2d3] hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة A4 / PDF</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-2 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* محتوى الفاتورة الرسمية المعتمدة */}
            <div id="friday-invoice-print" className="pt-4 space-y-5 text-right">
              
              {/* ترويسة الفاتورة */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/sanad-express-logo.jpg?v=3" alt="سَنَد" className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-sm" />
                  <div>
                    <h1 className="font-black text-xl text-slate-900">سند SANAD اللوجستية</h1>
                    <div className="text-xs text-slate-500 font-mono font-bold tracking-wider">سَنَد LOGISTICS</div>
                    <div className="text-[11px] text-cyan-800 font-bold mt-0.5">نظام المحاسبة والتسوية الدورية (كل 7 أيام تلقائياً)</div>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <div className="font-black text-sm text-slate-900">فاتورة تسوية دورية (7 أيام)</div>
                  <div className="text-xs font-bold text-purple-700 mt-0.5">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-[10px] text-slate-500">
                    تاريخ الإصدار: {selectedInvoice.periodEndDate || selectedInvoice.fridayDate}
                  </div>
                </div>
              </div>

              {/* بيانات المندوب والفرع وفترة الـ 7 أيام */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">اسم المندوب الميداني:</div>
                  <div className="font-black text-sm text-slate-900">{selectedInvoice.driverName}</div>
                  <div className="text-slate-600 font-mono mt-0.5">الهوية الوطنية: {selectedInvoice.driverNationalId}</div>
                  <div className="text-slate-600 font-mono">الجوال: {selectedInvoice.driverPhone}</div>
                </div>

                <div>
                  <div className="text-slate-500 text-[11px]">الفرع المسجل:</div>
                  <div className="font-bold text-sm text-slate-900">{selectedInvoice.branchName}</div>
                  <div className="text-slate-600 mt-0.5">
                    فترة الدورة المحاسبية: <span className="font-bold text-slate-800">7 أيام كاملة</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {selectedInvoice.periodStartDate ? `من ${selectedInvoice.periodStartDate} إلى ${selectedInvoice.periodEndDate}` : `أسبوع ${selectedInvoice.weekNumber}`}
                  </div>
                  <div className="text-emerald-700 font-bold mt-1">
                    نظام الإصدار: آلي تلقائي كل 7 أيام 🟢
                  </div>
                </div>
              </div>

              {/* جدول تفاصيل الحسابات والأرباح */}
              <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">البند المحاسبي</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-center">سعر الوحدة</th>
                    <th className="py-2.5 px-3 text-left">المجموع (ريال)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-bold">عمولات توصيل الشحنات المكتملة في دورة الـ 7 أيام</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{selectedInvoice.orderCount} شحنة</td>
                    <td className="py-2.5 px-3 text-center font-mono">20.00 ﷼</td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-600">+{selectedInvoice.totalCommissions.toFixed(2)} ﷼</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">كاش الدفع عند الاستلام المقبوض باليد (COD)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">—</td>
                    <td className="py-2.5 px-3 text-center font-mono">—</td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-amber-600">-{selectedInvoice.totalCodCollected.toFixed(2)} ﷼</td>
                  </tr>
                  <tr className="bg-slate-50 font-black text-sm">
                    <td colSpan="3" className="py-3 px-3">صافي المستحق النهائي لدورة الـ 7 أيام:</td>
                    <td className="py-3 px-3 text-left font-mono text-base text-cyan-800">
                      {selectedInvoice.netSettlement.toFixed(2)} ﷼
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* منطقة التوقيعات والختم الدائري الرسمي لسَنَد */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200 relative">
                
                {/* توقيع المندوب */}
                <div className="text-center space-y-2">
                  <div className="text-[11px] font-bold text-slate-500">توقيع واستلام المندوب</div>
                  <div className="font-serif italic font-bold text-slate-700 text-sm mt-3 underline decoration-dotted">
                    {selectedInvoice.driverName}
                  </div>
                </div>

                {/* الختم الرسمي لسَنَد في المنتصف */}
                <div className="flex flex-col items-center justify-center">
                  <img 
                    src="/sanad-official-stamp.png" 
                    alt="ختم سَنَد الرسمي" 
                    className="w-24 h-24 object-contain mix-blend-multiply drop-shadow-md rotate-[-6deg]" 
                  />
                  <div className="text-[9px] text-slate-400 font-bold mt-1">الختم المالي المعتمد لشركة سَنَد</div>
                </div>

                {/* توقيع الإدارة والباركود */}
                <div className="text-center space-y-1">
                  <div className="text-[11px] font-bold text-slate-500">اعتماد الإدارة العامة</div>
                  <div className="font-serif italic font-bold text-purple-900 text-sm mt-3">
                    إدارة العمليات والمالية
                  </div>
                  <div className="text-[9px] text-emerald-600 font-bold">معتمد إلكترونياً (تلقائي كل 7 أيام)</div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

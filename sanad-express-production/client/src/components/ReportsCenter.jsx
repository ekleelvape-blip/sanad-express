import React, { useState, useEffect } from 'react';
import CalendarRangePicker from './CalendarRangePicker';
import { FileText, Calendar, Download, Printer, Filter, DollarSign, CheckCircle2, TrendingUp, Users, ArrowDownToLine, RefreshCw } from 'lucide-react';

export default function ReportsCenter({ drivers, branches, selectedBranch }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('all');
  const [reportBranch, setReportBranch] = useState(selectedBranch || 'all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // تعيين التواريخ السريعة
  const setQuickRange = (type) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedDriverId !== 'all') params.append('driverId', selectedDriverId);
      if (reportBranch !== 'all') params.append('branchId', reportBranch);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedDriverId, reportBranch]);

  // تصدير التقرير كـ CSV (Excel متوافق مع اللغة العربية)
  const exportToCSV = () => {
    if (!data || !data.driverStats) return;

    let csvContent = "\uFEFF"; // UTF-8 BOM لضمان فتح اللغة العربية في Excel بشكل سليم
    csvContent += "تقرير أداء ومبيعات المناديب - منصة سند\n";
    csvContent += `الفترة: ${startDate || 'من البداية'} إلى ${endDate || 'الآن'}\n\n`;
    csvContent += "اسم المندوب,رقم الجوال,الطلبات الموصلة,إجمالي المبيعات,الكاش المحصل,مدفوعات مدى,عمولة التوصيل,كاش العهدة المتبقي\n";

    data.driverStats.forEach(d => {
      csvContent += `"${d.driverName}","${d.phone}",${d.deliveredCount},${d.totalSales},${d.cashCollected},${d.madaCollected},${d.totalCommission},${d.currentCashOnHand}\n`;
    });

    csvContent += `\nالإجمالي,,,${data.summary.totalDeliveredValue},${data.summary.totalCash},${data.summary.totalMada},${data.summary.totalCommissions},\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sanad_report_${startDate || 'all'}_${endDate || 'today'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ترويسة مركز التقارير */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-5 rounded-2xl print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>مركز التقارير وتصدير إحصائيات المناديب</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            فرز أداء المناديب وتحديد عدد المشاوير، مبالغ الكاش المحصلة، العمولات المستحقة، وتصدير التقارير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* شريط الفلاتر والتقويم التفاعلي المنبثق */}
      <div className="bg-[#0f1b23] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>تحديد مدة التقرير بالتقويم التفاعلي والفلاتر:</span>
          </div>
          {(startDate || endDate) && (
            <span className="text-[11px] font-mono px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold">
              الفترة المحددة: {startDate || 'من البداية'} ⬅️ {endDate || 'إلى الآن'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* محدد التقويم التفاعلي المرئي */}
          <div className="lg:col-span-1">
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
              <span>📅 التقويم الزمني (انقر للاختيار):</span>
              <span className="text-[10px] text-emerald-400">تقويم تفاعلي</span>
            </label>
            <CalendarRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={({ startDate: s, endDate: e }) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
          </div>

          {/* فرز حسب المندوب */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">👤 فرز حسب المندوب:</label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 hover:border-slate-600 text-slate-200 rounded-2xl p-2.5 focus:border-emerald-500 outline-none transition-colors"
            >
              <option value="all">كل المناديب (عرض تقرير الأسطول)</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* فرز حسب الفرع */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">🏪 الفرع / المتجر:</label>
            <select
              value={reportBranch}
              onChange={(e) => setReportBranch(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 hover:border-slate-600 text-slate-200 rounded-2xl p-2.5 focus:border-emerald-500 outline-none transition-colors"
            >
              <option value="all">كل الفروع (إكليل الدمام، الجبيل، فيب الشرق)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* أزرار الفترات السريعة */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px]">فترات جاهزة:</span>
          <button
            onClick={() => setQuickRange('today')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
          >
            اليوم
          </button>
          <button
            onClick={() => setQuickRange('7days')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setQuickRange('month')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
          >
            هذا الشهر
          </button>
          <button
            onClick={() => setQuickRange('all')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
          >
            جميع الفترات
          </button>
        </div>
      </div>

      {/* ملخص الإحصائيات في الفترة المحددة */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 mb-1">الطلبات الموصلة</div>
            <div className="text-xl font-black font-mono text-purple-400">{data.summary.deliveredOrdersCount}</div>
            <div className="text-[10px] text-slate-500">من أصل {data.summary.totalOrders} طلبات</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 mb-1">إجمالي المبيعات</div>
            <div className="text-xl font-black font-mono text-slate-100">{data.summary.totalDeliveredValue} ر.س</div>
            <div className="text-[10px] text-slate-500">قيمة الطلبات المسلمة</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-400 mb-1">الكاش المحصل</div>
            <div className="text-xl font-black font-mono text-emerald-400">{data.summary.totalCash} ر.س</div>
            <div className="text-[10px] text-emerald-500/80">دفع عند الاستلام</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-cyan-400 mb-1">مدفوعات مدى</div>
            <div className="text-xl font-black font-mono text-cyan-400">{data.summary.totalMada} ر.س</div>
            <div className="text-[10px] text-cyan-500/80">شبكة مدى</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-amber-400 mb-1">عمولات المناديب</div>
            <div className="text-xl font-black font-mono text-amber-400">{data.summary.totalCommissions} ر.س</div>
            <div className="text-[10px] text-amber-500/80">أجور التوصيل المستحقة</div>
          </div>
        </div>
      )}

      {/* جدول فرز أداء المناديب التفصيلي */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl" id="printable-report">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>جدول فرز ومقارنة أداء المناديب في الفترة المحددة</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              يوضح كم وصل كل مندوب من طلبات والمبالغ المحصلة والعمولات
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {startDate ? `من ${startDate}` : ''} {endDate ? `إلى ${endDate}` : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">المندوب</th>
                <th className="p-4">الجوال</th>
                <th className="p-4 text-center">كم وصل طلب</th>
                <th className="p-4">إجمالي مبيعاته</th>
                <th className="p-4">الكاش المحصل</th>
                <th className="p-4">شبكة مدى</th>
                <th className="p-4">عمولة التوصيل</th>
                <th className="p-4">كاش العهدة الحالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.driverStats?.map(drv => (
                <tr key={drv.driverId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-100 text-sm">
                    {drv.driverName}
                  </td>
                  <td className="p-4 text-slate-400 font-mono">
                    {drv.phone}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 font-bold font-mono border border-purple-800 text-xs">
                      {drv.deliveredCount} مشوار
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-200">
                    {drv.totalSales} ر.س
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-400">
                    {drv.cashCollected} ر.س
                  </td>
                  <td className="p-4 font-mono text-cyan-400 font-bold">
                    {drv.madaCollected} ر.س
                  </td>
                  <td className="p-4 font-mono font-bold text-amber-400">
                    {drv.totalCommission} ر.س
                  </td>
                  <td className="p-4 font-mono font-black text-amber-300 text-sm">
                    {drv.currentCashOnHand} ر.س
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

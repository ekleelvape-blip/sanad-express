import React, { useState, useEffect } from 'react';
import { 
  Download, Printer, Filter, Calendar, Users, Store, FileText, 
  CheckCircle2, Box, AlertTriangle, RefreshCw, Sparkles, Home, 
  Search, ChevronDown, Check, X, ShieldCheck, Laptop
} from 'lucide-react';
import CalendarRangePicker from './CalendarRangePicker';
import { sound } from '../utils/sound';

export default function DataExportCenter({ activeTab, onSelectTab, drivers = [], branches = [], selectedBranch }) {
  const [currentTab, setCurrentTab] = useState(activeTab || 'export_driver_orders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(selectedBranch || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedPicker, setSelectedPicker] = useState('all');
  const [carrier, setCarrier] = useState('all');
  const [incidentStatus, setIncidentStatus] = useState('all');
  const [searchSku, setSearchSku] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  useEffect(() => {
    if (activeTab && activeTab.startsWith('export_')) {
      setCurrentTab(activeTab);
      setHasSearched(false);
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedDriverId && selectedDriverId !== 'all') params.append('driverId', selectedDriverId);
      if (selectedBranchId && selectedBranchId !== 'all') params.append('branchId', selectedBranchId);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

      let endpoint = '/api/export/driver-orders';
      if (currentTab === 'export_warehouse_orders') endpoint = '/api/export/warehouse-orders';
      else if (currentTab === 'export_inventory') endpoint = '/api/export/inventory';
      else if (currentTab === 'export_reports') endpoint = '/api/export/incidents';

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching export data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearched || currentTab === 'export_inventory') {
      fetchData();
    }
  }, [currentTab, startDate, endDate, selectedDriverId, selectedBranchId, selectedStatus, hasSearched]);

  // 1. تصدير ملف Excel (.xlsx / CSV بترميز UTF-8 مع BOM العربي السليم)
  const downloadExcel = () => {
    if (!data) return alert('لا توجد بيانات متاحة للتصدير حالياً');
    sound.playSuccess();

    let csv = '\uFEFF'; // UTF-8 Byte Order Mark for Excel
    const dateStr = new Date().toISOString().split('T')[0];
    let filename = `sanad_export_${currentTab}_${dateStr}.csv`;

    if (currentTab === 'export_driver_orders') {
      csv += 'سَنَد للخدمات اللوجستية - تقرير طلبات السائقين الرسمي\n';
      csv += `تاريخ التقرير: ${dateStr} | الفرع: ${selectedBranchId === 'all' ? 'كافة الفروع' : selectedBranchId}\n\n`;
      csv += 'رقم الشحنة,تاريخ الطلب,اسم السائق,جوال السائق,الفرع,اسم العميل,جوال العميل,عنوان التوصيل,المبلغ الإجمالي (ر.س),طريقة الدفع,عمولة المندوب (ر.س),حالة الشحنة\n';
      (data.orders || []).forEach(o => {
        csv += `"${o.orderId}","${o.date}","${o.driverName}","${o.driverPhone}","${o.branchName}","${o.customerName}","${o.customerPhone}","${o.customerAddress}",${o.totalAmount},"${o.paymentMethod}",${o.commission},"${o.status}"\n`;
      });
      if (data.summary) {
        csv += `\nالإجمالي:,,,,,,,,,${data.summary.totalSales},,${data.summary.totalCommission},\n`;
      }
    } else if (currentTab === 'export_warehouse_orders') {
      csv += 'سَنَد للخدمات اللوجستية - تقرير طلبات موظفي المستودع والتجهيز\n';
      csv += `تاريخ التقرير: ${dateStr}\n\n`;
      csv += 'رقم الشحنة,التاريخ,الفرع,موظف التجهيز,عدد الأصناف,تفاصيل الأصناف,مرحلة التجهيز,طباعة البوليصة\n';
      (data.warehouseOrders || []).forEach(w => {
        csv += `"${w.orderId}","${w.date}","${w.branchName}","${w.pickerName}",${w.itemsCount},"${w.itemsDetails}","${w.stage}","${w.waybillPrinted}"\n`;
      });
    } else if (currentTab === 'export_inventory') {
      csv += 'سَنَد للخدمات اللوجستية - مسير جرد المخزون الحالي المعتمد\n';
      csv += `تاريخ الجرد: ${dateStr}\n\n`;
      csv += 'كود الصنف (SKU),اسم المنتج,التصنيف,الفرع,الكمية المتوفرة,الحد الأدنى,سعر الوحدة (ر.س),القيمة الإجمالية (ر.س),موقع الرف\n';
      (data.items || []).forEach(i => {
        csv += `"${i.sku}","${i.name}","${i.category}","${i.branchName}",${i.qty},${i.minQty},${i.unitPrice},${i.qty * i.unitPrice},"${i.shelfLocation}"\n`;
      });
      if (data.summary) {
        csv += `\nالإجمالي:,,,,,${data.summary.totalUnits},,,${data.summary.totalValue},\n`;
      }
    } else if (currentTab === 'export_reports') {
      csv += 'سَنَد للخدمات اللوجستية - تقرير البلاغات وتعثر التوصيل\n';
      csv += `تاريخ التقرير: ${dateStr}\n\n`;
      csv += 'رقم البلاغ,رقم الشحنة,التاريخ,اسم المندوب,الفرع,اسم العميل,جوال العميل,سبب التعثر,ملاحظات المندوب,الإجراء المتخذ,قيمة الشحنة (ر.س)\n';
      (data.incidents || []).forEach(inc => {
        csv += `"${inc.incidentId}","${inc.orderId}","${inc.date}","${inc.driverName}","${inc.branchName}","${inc.customerName}","${inc.customerPhone}","${inc.reason}","${inc.notes}","${inc.action}",${inc.orderAmount}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 2. فتح وثيقة PDF الرسمية بشعار سند
  const openOfficialPdf = () => {
    sound.playSuccess();
    setShowPdfModal(true);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const getBreadcrumbTitle = () => {
    if (currentTab === 'export_driver_orders') return 'تصدير طلبات السائقين';
    if (currentTab === 'export_warehouse_orders') return 'تصدير طلبات موظفي المستودع';
    if (currentTab === 'export_inventory') return 'تصدير المخزون الحالي';
    if (currentTab === 'export_reports') return 'تصدير البلاغات';
    return 'تصدير البيانات';
  };

  const getAlertNotice = () => {
    if (currentTab === 'export_driver_orders') {
      return 'قم بتحديد فترة التاريخ من و إلى .. ثم حدد اسم الطيار حتى تتمكن من الاطلاع على النتائج';
    }
    if (currentTab === 'export_warehouse_orders') {
      return 'حدد الفترة الزمنية (من وإلى)، ثم اختر الموظف والمرحلة (اختياري)';
    }
    if (currentTab === 'export_reports') {
      return 'حدد الفترة الزمنية (من وإلى)، ثم اختر حالة البلاغ (اختياري)';
    }
    return '';
  };

  const notice = getAlertNotice();

  return (
    <div className="space-y-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-800 dark:text-slate-100" dir="rtl">
      
      {/* 1. ترويسة المسار العلوية (Breadcrumb) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Home className="w-4 h-4" />
          </span>
          <span className="text-slate-400">»</span>
          <span className="text-slate-400">
            {currentTab === 'export_inventory' ? 'مخزون السائقين' : 'تصدير البيانات'}
          </span>
          <span className="text-slate-400">»</span>
          <span className="text-[#00d2d3] font-bold">{getBreadcrumbTitle()}</span>
        </div>

        {/* أزرار التصدير السريعة في الأعلى */}
        {hasSearched && data && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تصدير إكسل (Excel)</span>
            </button>

            <button
              type="button"
              onClick={openOfficialPdf}
              className="flex items-center gap-1.5 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>تصدير PDF رسمي</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. شريط التنبيه الأحمر المطابق تماماً للصور المرفقة */}
      {notice && !hasSearched && (
        <div className="flex items-center justify-end gap-2 text-rose-500 dark:text-rose-400 text-xs font-bold px-1">
          <span>{notice}</span>
          <span className="w-4 h-4 rounded-full border border-rose-500 flex items-center justify-center text-[10px]">!</span>
        </div>
      )}

      {/* 3. كرت الفلاتر الرئيسي (حدد الفلاتر للتصدير) مطابق للصورة بالملي */}
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* عنوان كرت الفلاتر أو زر تصدير المخزون */}
        <div className="flex items-center justify-between">
          {currentTab === 'export_inventory' ? (
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">تصدير المخزون الحالي</span>
              <button
                type="button"
                onClick={() => { setHasSearched(true); fetchData(); downloadExcel(); }}
                className="flex items-center gap-1.5 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تصدير المخزون</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="font-bold text-[#00d2d3] text-xs">حدد الفلاتر للتصدير</span>
              <button
                type="button"
                onClick={() => { setHasSearched(true); fetchData(); }}
                className="px-5 py-2 rounded-xl bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
              >
                تطبيق الفلترة وعرض النتائج 🔍
              </button>
            </div>
          )}
        </div>

        {/* حقول الفلاتر المتوافقة مع كل تبويب */}
        {currentTab === 'export_driver_orders' && (
          <div className="space-y-3">
            {/* الصف الأول */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="التاريخ من"
                  className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="التاريخ إلى"
                  className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="">السائق (الكل)</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="all">كل الحالات</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="in_transit">جاري التوصيل</option>
                  <option value="assigned">مسندة</option>
                  <option value="returned">مسترجعة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* الصف الثاني */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-w-xl">
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="all">اختر الفروع (كافة الفروع)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="all">شركة الشحن (سَنَد)</option>
                  <option value="sanad">سَنَد - أسطول المناديب</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'export_warehouse_orders' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="التاريخ من"
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200"
              />
            </div>

            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="التاريخ إلى"
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="relative">
              <select
                value={selectedPicker}
                onChange={(e) => setSelectedPicker(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="all">موظف المستودع (الكل)</option>
                <option value="ريان الزهراني">ريان الزهراني</option>
                <option value="سلمان الحربي">سلمان الحربي</option>
                <option value="فهد المطيري">فهد المطيري</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="all">كل المراحل</option>
                <option value="قيد التجهيز">قيد التجهيز</option>
                <option value="تم الفرز والتغليف">تم الفرز والتغليف</option>
                <option value="جاهز للتسليم">جاهز للتسليم</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {currentTab === 'export_inventory' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="">السائق (الكل)</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div>
              <input
                type="text"
                value={searchSku}
                onChange={(e) => setSearchSku(e.target.value)}
                placeholder="بحث بالمنتج أو SKU..."
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200"
              />
            </div>

            <div>
              <input
                type="number"
                value={maxQty}
                onChange={(e) => setMaxQty(e.target.value)}
                placeholder="الحد الأقصى للكمية"
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
          </div>
        )}

        {currentTab === 'export_reports' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="التاريخ من"
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200"
              />
            </div>

            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="التاريخ إلى"
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] text-xs text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="relative">
              <select
                value={incidentStatus}
                onChange={(e) => setIncidentStatus(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-[#00d2d3] appearance-none text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="all">كل الحالات</option>
                <option value="pending">بانتظار الإجراء</option>
                <option value="resolved">تمت المعالجة والإعادة</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

      </div>

      {/* 4. الحالة الفارغة (Empty State) مطابقة 100% للصور المرفقة */}
      {(!hasSearched && currentTab !== 'export_inventory') ? (
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          {/* دائرة الأيقونة الخضراء الفاتحة */}
          <div className="w-24 h-24 rounded-full border-2 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-inner">
            <Laptop className="w-10 h-10 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">قم بالتحديد لتصدير النتائج</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {currentTab === 'export_driver_orders' && 'يرجى تحديد الفترة الزمنية والسائق لتصدير الطلبات'}
              {currentTab === 'export_warehouse_orders' && 'يرجى تحديد الفترة الزمنية وموظف المستودع لتصدير الطلبات'}
              {currentTab === 'export_reports' && 'يرجى تحديد الفترة الزمنية وحالة البلاغ لتصدير البيانات'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => { setHasSearched(true); fetchData(); }}
            className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#00d2d3] hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            عرض جميع النتائج الآن
          </button>
        </div>
      ) : (
        /* 5. عرض نتائج التصدير مع الجداول والأزرار */
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-white">نتائج التقرير:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/40 text-[#00d2d3] border border-cyan-800/40 font-mono font-bold">
                {currentTab === 'export_driver_orders' && `${data?.orders?.length || 0} شحنة`}
                {currentTab === 'export_warehouse_orders' && `${data?.warehouseOrders?.length || 0} طلب تجهيز`}
                {currentTab === 'export_inventory' && `${data?.items?.length || 0} صنف`}
                {currentTab === 'export_reports' && `${data?.incidents?.length || 0} بلاغ`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadExcel}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تصدير Excel (XLSX/CSV)</span>
              </button>

              <button
                type="button"
                onClick={openOfficialPdf}
                className="flex items-center gap-1.5 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>تصدير PDF رسمي بشعار سند</span>
              </button>
            </div>
          </div>

          {/* جدول البيانات */}
          <div className="overflow-x-auto text-xs">
            {currentTab === 'export_driver_orders' && (
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[11px]">
                    <th className="py-3 px-3">رقم الشحنة</th>
                    <th className="py-3 px-3">التاريخ</th>
                    <th className="py-3 px-3">السائق</th>
                    <th className="py-3 px-3">الفرع</th>
                    <th className="py-3 px-3">العميل</th>
                    <th className="py-3 px-3">العنوان</th>
                    <th className="py-3 px-3">المبلغ</th>
                    <th className="py-3 px-3">الدفع</th>
                    <th className="py-3 px-3">العمولة</th>
                    <th className="py-3 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(data?.orders || []).map((o, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono font-bold text-[#00d2d3]">{o.orderId}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{o.date}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">{o.driverName}</td>
                      <td className="py-3 px-3 text-slate-500">{o.branchName}</td>
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-semibold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-[150px] truncate">{o.customerAddress}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{o.totalAmount} ﷼</td>
                      <td className="py-3 px-3 text-slate-500">{o.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{o.commission} ﷼</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {currentTab === 'export_warehouse_orders' && (
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[11px]">
                    <th className="py-3 px-3">رقم الشحنة</th>
                    <th className="py-3 px-3">التاريخ</th>
                    <th className="py-3 px-3">الفرع</th>
                    <th className="py-3 px-3">موظف التجهيز</th>
                    <th className="py-3 px-3">الأصناف</th>
                    <th className="py-3 px-3">المرحلة</th>
                    <th className="py-3 px-3">البوليصة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(data?.warehouseOrders || []).map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono font-bold text-[#00d2d3]">{w.orderId}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{w.date}</td>
                      <td className="py-3 px-3 text-slate-500">{w.branchName}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">{w.pickerName}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{w.itemsDetails}</td>
                      <td className="py-3 px-3 font-bold text-cyan-600 dark:text-cyan-400">{w.stage}</td>
                      <td className="py-3 px-3 text-slate-400">{w.waybillPrinted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {currentTab === 'export_inventory' && (
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[11px]">
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">اسم المنتج</th>
                    <th className="py-3 px-3">التصنيف</th>
                    <th className="py-3 px-3">الفرع</th>
                    <th className="py-3 px-3">المتوفر</th>
                    <th className="py-3 px-3">السعر</th>
                    <th className="py-3 px-3">القيمة الإجمالية</th>
                    <th className="py-3 px-3">مكان الرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(data?.items || []).map((i, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">{i.sku}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">{i.name}</td>
                      <td className="py-3 px-3 text-slate-500">{i.category}</td>
                      <td className="py-3 px-3 text-slate-500">{i.branchName}</td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-500">{i.qty}</td>
                      <td className="py-3 px-3 font-mono">{i.unitPrice} ﷼</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-500">{i.qty * i.unitPrice} ﷼</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{i.shelfLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {currentTab === 'export_reports' && (
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[11px]">
                    <th className="py-3 px-3">رقم البلاغ</th>
                    <th className="py-3 px-3">رقم الشحنة</th>
                    <th className="py-3 px-3">السائق</th>
                    <th className="py-3 px-3">العميل</th>
                    <th className="py-3 px-3">سبب التعثر</th>
                    <th className="py-3 px-3">الإجراء</th>
                    <th className="py-3 px-3">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(data?.incidents || []).map((inc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono font-bold text-rose-500">{inc.incidentId}</td>
                      <td className="py-3 px-3 font-mono text-[#00d2d3]">{inc.orderId}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">{inc.driverName}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{inc.customerName}</td>
                      <td className="py-3 px-3 text-amber-500 font-semibold">{inc.reason}</td>
                      <td className="py-3 px-3 text-slate-400">{inc.action}</td>
                      <td className="py-3 px-3 font-mono font-bold">{inc.orderAmount} ﷼</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* 6. نافذة الوثيقة الرسمية الصادرة من سند مع الشعار المعتمد (Official PDF Document) */}
      {showPdfModal && (
        <div className="fixed inset-0 z-[5000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[92vh]" dir="rtl">
            
            {/* شريط الإجراءات العلوي للطباعة والحفظ */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="flex items-center gap-1.5 bg-[#00d2d3] hover:bg-cyan-500 text-slate-950 font-black px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة أو حفظ كـ PDF 📄</span>
                </button>

                <button
                  type="button"
                  onClick={downloadExcel}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل Excel</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ورقة الوثيقة الرسمية الصادرة من سَنَد بمقاس A4 */}
            <div className="p-8 sm:p-12 overflow-y-auto space-y-6 text-slate-900" id="official-sanad-doc">
              
              {/* ترويسة الورقة الرسمية مع الشعار المعتمد */}
              <div className="border-b-2 border-slate-900 pb-5 flex items-center justify-between">
                
                {/* الشعار المعتمد لسَنَد */}
                <div className="flex items-center gap-3">
                  <img
                    src="/sanad-express-logo.jpg?v=3"
                    alt="شعار سَنَد"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-900 shadow-md"
                  />
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-950">سَنَد إكسبريس للخدمات اللوجستية</h1>
                    <div className="font-mono text-xs font-bold text-slate-600 tracking-wider">سَنَد LOGISTICS & DELIVERY</div>
                  </div>
                </div>

                {/* كود الوثيقة وتاريخ الإصدار */}
                <div className="text-left font-mono text-xs space-y-1">
                  <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-300 font-black text-slate-900">
                    وثيقة رسمية رقم: SND-DOC-{Math.floor(100000 + Math.random() * 900000)}
                  </div>
                  <div className="text-slate-500 font-semibold">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</div>
                  <div className="text-slate-500 font-semibold">الوقت: {new Date().toLocaleTimeString('ar-SA')}</div>
                </div>
              </div>

              {/* عنوان التقرير وفترة الاستخراج */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-500">نوع الوثيقة الرسمية: </span>
                  <span className="font-black text-slate-900 text-sm">{getBreadcrumbTitle()}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">الفترة: </span>
                  <span className="font-bold font-mono text-slate-900">
                    {startDate || 'البداية'} إلى {endDate || 'تاريخ اليوم'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">الفرع: </span>
                  <span className="font-bold text-slate-900">
                    {selectedBranchId === 'all' ? 'كافة الفروع المعتمدة' : selectedBranchId}
                  </span>
                </div>
              </div>

              {/* جدول البيانات للوثيقة الرسمية */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800 text-[11px]">
                      <th className="py-2.5 px-3 border-l border-slate-300">#</th>
                      <th className="py-2.5 px-3 border-l border-slate-300">رقم الشحنة</th>
                      <th className="py-2.5 px-3 border-l border-slate-300">التاريخ</th>
                      <th className="py-2.5 px-3 border-l border-slate-300">المندوب</th>
                      <th className="py-2.5 px-3 border-l border-slate-300">العميل</th>
                      <th className="py-2.5 px-3 border-l border-slate-300">المبلغ</th>
                      <th className="py-2.5 px-3 border-l border-slate-300">الدفع</th>
                      <th className="py-2.5 px-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {((data?.orders || data?.warehouseOrders || data?.items || []).slice(0, 15)).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 border-l border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 border-l border-slate-200 font-mono font-bold">{row.orderId || row.sku || `SND-${idx + 100}`}</td>
                        <td className="py-2 px-3 border-l border-slate-200 font-mono text-slate-600">{row.date || new Date().toLocaleDateString('ar-SA')}</td>
                        <td className="py-2 px-3 border-l border-slate-200 font-bold">{row.driverName || row.pickerName || 'مندوب سند'}</td>
                        <td className="py-2 px-3 border-l border-slate-200">{row.customerName || row.name || '—'}</td>
                        <td className="py-2 px-3 border-l border-slate-200 font-mono font-black">{row.totalAmount || row.unitPrice || '—'} ﷼</td>
                        <td className="py-2 px-3 border-l border-slate-200">{row.paymentMethod || 'مدفوع'}</td>
                        <td className="py-2 px-3 font-bold">{row.status || 'مكتمل'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* صندوق الاعتماد والتوقيع والختم الرسمي لسَنَد */}
              <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-xs">
                
                {/* الختم الرسمي المعتمد المرفق من إدارة سند */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src="/sanad-official-stamp.png"
                      alt="الختم الرسمي المعتمد - سَنَد"
                      className="w-28 h-28 object-contain mix-blend-multiply drop-shadow-sm select-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-black text-slate-950 text-base">سَنَد إكسبريس للخدمات اللوجستية</div>
                    <div className="text-xs text-slate-600 font-bold">إدارة العمليات والترحيل اللوجستي</div>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[10px] mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      ختم رسمي معتمد وموثق
                    </div>
                  </div>
                </div>

                {/* التوقيع والاعتماد الرسمي */}
                <div className="text-center space-y-2">
                  <div className="font-bold text-slate-800">توقيع المشرف المسؤول</div>
                  <div className="w-48 border-b-2 border-slate-400 pb-2 font-mono text-slate-500 text-xs">
                    ....................................
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">الاعتماد الإداري الصالح</div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

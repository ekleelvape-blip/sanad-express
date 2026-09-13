import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, Printer, Filter, Calendar, Users, Store, FileText, 
  CheckCircle2, Box, AlertTriangle, RefreshCw, Sparkles, Home, 
  Search, ChevronDown, Check, X, ShieldCheck, Laptop, Truck,
  ShoppingBag, Eye, ArrowRight, Clock, DollarSign, Package,
  AlertCircle, Phone, Send, Layers, Archive, FileSpreadsheet,
  TrendingUp, ArrowUpRight
} from 'lucide-react';
import { sound } from '../utils/sound';
import { 
  SANAD_OFFICIAL_ENTITY, 
  getOfficialFormattedDates, 
  OfficialStamp, 
  OfficialZatcaQr, 
  printOfficialDocument 
} from '../utils/officialDocs';

export default function DataExportCenter({ 
  activeTab, 
  onSelectTab, 
  drivers = [], 
  branches = [], 
  orders = [],
  selectedBranch 
}) {
  // تحديد التبويب الحالي
  const getInitialTab = () => {
    if (activeTab && activeTab.startsWith('export_')) return activeTab;
    return 'export_driver_orders';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  
  // الفلاتر
  const [datePreset, setDatePreset] = useState('all'); // all, today, 7days, month
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState(selectedBranch || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedPicker, setSelectedPicker] = useState('all');
  const [incidentStatus, setIncidentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // البيانات وحالة التحميل
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // إحصائيات عامة
  const [globalStats, setGlobalStats] = useState({
    totalDriverOrders: 0,
    totalSalesAmount: 0,
    totalWarehouseOrders: 0,
    totalInventoryValue: 0,
    totalIncidents: 0
  });

  // مزامنة التبويب عند تغير activeTab من الخارج
  useEffect(() => {
    if (activeTab && activeTab.startsWith('export_')) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  // تبديل الفلاتر الزمنية السريعة
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // جلب البيانات من الخادم
  const fetchExportData = async () => {
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
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching export data:', err);
    } finally {
      setLoading(false);
    }
  };

  // جلب إحصائيات عامة للمركز عند الإقلاع
  const fetchGlobalStats = async () => {
    try {
      const [dRes, wRes, iRes, incRes] = await Promise.all([
        fetch('/api/export/driver-orders'),
        fetch('/api/export/warehouse-orders'),
        fetch('/api/export/inventory'),
        fetch('/api/export/incidents')
      ]);
      const dJson = dRes.ok ? await dRes.json() : null;
      const wJson = wRes.ok ? await wRes.json() : null;
      const iJson = iRes.ok ? await iRes.json() : null;
      const incJson = incRes.ok ? await incRes.json() : null;

      setGlobalStats({
        totalDriverOrders: dJson?.summary?.count || dJson?.orders?.length || 0,
        totalSalesAmount: dJson?.summary?.totalSales || 0,
        totalWarehouseOrders: wJson?.summary?.count || wJson?.warehouseOrders?.length || 0,
        totalInventoryValue: iJson?.summary?.totalValue || 0,
        totalIncidents: incJson?.summary?.count || incJson?.incidents?.length || 0
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  // جلب البيانات فورياً عند فتح التبويب أو تغيير الفلاتر
  useEffect(() => {
    fetchExportData();
  }, [currentTab, startDate, endDate, selectedDriverId, selectedBranchId, selectedStatus]);

  const handleTabChange = (tabKey) => {
    setCurrentTab(tabKey);
    setSearchQuery('');
    if (onSelectTab) onSelectTab(tabKey);
  };

  // 1. تصدير ملف Excel (.csv مع ترميز UTF-8 و BOM العربي)
  const downloadExcel = () => {
    if (!data) return alert('لا توجد بيانات متاحة للتصدير حالياً');
    sound.playSuccess();

    let csv = '\uFEFF'; // UTF-8 BOM
    const dateStr = new Date().toISOString().split('T')[0];
    let filename = `sanad_${currentTab}_${dateStr}.csv`;

    if (currentTab === 'export_driver_orders') {
      csv += 'منظومة سَنَد للخدمات اللوجستية - مسير طلبات السائقين والأسطول الميداني المعتمد\n';
      csv += `تاريخ التصدير: ${dateStr} | الفرع: ${selectedBranchId === 'all' ? 'كافة الفروع' : selectedBranchId}\n\n`;
      csv += 'رقم الشحنة,تاريخ الطلب,اسم السائق,جوال السائق,الفرع,اسم العميل,جوال العميل,عنوان التوصيل,المبلغ الإجمالي (ر.س),طريقة الدفع,عمولة المندوب (ر.س),حالة الشحنة\n';
      (filteredDriverOrders || []).forEach(o => {
        csv += `"${o.orderId}","${o.date}","${o.driverName}","${o.driverPhone}","${o.branchName}","${o.customerName}","${o.customerPhone}","${o.customerAddress}",${o.totalAmount},"${o.paymentMethod}",${o.commission},"${o.status}"\n`;
      });
      const sumSales = (filteredDriverOrders || []).reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      const sumComm = (filteredDriverOrders || []).reduce((s, o) => s + (Number(o.commission) || 0), 0);
      csv += `\nالإجمالي العام:,,,,,,,,,${sumSales},,${sumComm},\n`;
    } else if (currentTab === 'export_warehouse_orders') {
      csv += 'منظومة سَنَد للخدمات اللوجستية - سجل طلبات موظفي المستودع والفرز\n';
      csv += `تاريخ التصدير: ${dateStr}\n\n`;
      csv += 'رقم الشحنة,تاريخ ووقت الطلب,الفرع والمستودع,فني التجهيز,عدد الأصناف,تفاصيل الأصناف,مرحلة التجهيز,طباعة البوليصة\n';
      (filteredWarehouseOrders || []).forEach(w => {
        csv += `"${w.orderId}","${w.date}","${w.branchName}","${w.pickerName}",${w.itemsCount},"${w.itemsDetails}","${w.stage}","${w.waybillPrinted}"\n`;
      });
    } else if (currentTab === 'export_inventory') {
      csv += 'منظومة سَنَد للخدمات اللوجستية - تقرير جرد المخزون والعهد الحالية المعتمد\n';
      csv += `تاريخ التصدير: ${dateStr}\n\n`;
      csv += 'كود الصنف (SKU),اسم المنتج,التصنيف,الفرع,الكمية المتوفرة,الحد الأدنى,سعر الوحدة (ر.س),القيمة الإجمالية (ر.س),موقع الرف\n';
      (filteredInventoryItems || []).forEach(i => {
        csv += `"${i.sku}","${i.name}","${i.category}","${i.branchName}",${i.qty},${i.minQty},${i.unitPrice},${i.qty * i.unitPrice},"${i.shelfLocation}"\n`;
      });
      const totalUnits = (filteredInventoryItems || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
      const totalVal = (filteredInventoryItems || []).reduce((s, i) => s + (Number(i.qty * i.unitPrice) || 0), 0);
      csv += `\nالإجمالي العام:,,,,,${totalUnits},,,${totalVal},\n`;
    } else if (currentTab === 'export_reports') {
      csv += 'منظومة سَنَد للخدمات اللوجستية - تقرير البلاغات وتعثرات التوصيل الميدانية\n';
      csv += `تاريخ التصدير: ${dateStr}\n\n`;
      csv += 'رقم البلاغ,رقم الشحنة,التاريخ,المندوب الميداني,الفرع,اسم العميل,جوال العميل,سبب التعثر,ملاحظات المندوب,الإجراء المتخذ,قيمة الشحنة (ر.س)\n';
      (filteredIncidents || []).forEach(inc => {
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

  const openOfficialPdf = () => {
    sound.playSuccess();
    setShowPdfModal(true);
  };

  const handlePrintPdf = () => {
    printOfficialDocument('official-sanad-doc', 'وثيقة رسمية معتمدة - سند إكسبريس');
  };

  // بيانات مفلترة فورية حسب البحث
  const filteredDriverOrders = useMemo(() => {
    const list = data?.orders || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(o =>
      (o.orderId && o.orderId.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.driverName && o.driverName.toLowerCase().includes(q)) ||
      (o.customerAddress && o.customerAddress.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const filteredWarehouseOrders = useMemo(() => {
    const list = data?.warehouseOrders || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(w =>
      (w.orderId && w.orderId.toLowerCase().includes(q)) ||
      (w.pickerName && w.pickerName.toLowerCase().includes(q)) ||
      (w.branchName && w.branchName.toLowerCase().includes(q)) ||
      (w.itemsDetails && w.itemsDetails.toLowerCase().includes(q)) ||
      (w.stage && w.stage.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const filteredInventoryItems = useMemo(() => {
    const list = data?.items || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(i =>
      (i.name && i.name.toLowerCase().includes(q)) ||
      (i.sku && i.sku.toLowerCase().includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q)) ||
      (i.branchName && i.branchName.toLowerCase().includes(q)) ||
      (i.shelfLocation && i.shelfLocation.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const filteredIncidents = useMemo(() => {
    const list = data?.incidents || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(inc =>
      (inc.incidentId && inc.incidentId.toLowerCase().includes(q)) ||
      (inc.orderId && inc.orderId.toLowerCase().includes(q)) ||
      (inc.driverName && inc.driverName.toLowerCase().includes(q)) ||
      (inc.customerName && inc.customerName.toLowerCase().includes(q)) ||
      (inc.customerPhone && inc.customerPhone.includes(q)) ||
      (inc.reason && inc.reason.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  // إجماليات التبويب النشط
  const currentTotalSales = filteredDriverOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const currentTotalCommissions = filteredDriverOrders.reduce((s, o) => s + (Number(o.commission) || 0), 0);
  const currentInventoryTotalUnits = filteredInventoryItems.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const currentInventoryTotalVal = filteredInventoryItems.reduce((s, i) => s + (Number(i.qty * i.unitPrice) || 0), 0);

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-100" dir="rtl">
      
      {/* 1. الترويسة التنفيذية الفاخرة لمركز تصدير البيانات */}
      <div className="bg-gradient-to-r from-[#070b14] via-[#0c1424] to-[#070b14] border border-cyan-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-[#00d2d3]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00d2d3]/10 border border-[#00d2d3]/30 flex items-center justify-center text-[#00d2d3] shadow-[0_0_20px_rgba(0,210,211,0.2)]">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-wide">مركز تصدير واستخراج البيانات المعتمد</h1>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/40 font-bold">
                    منظومة سَنَد اللوجستية
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  استخراج سجلات الشحنات، مهام المستودع، الجرد اللوجستي، وتقارير البلاغات بصيغ Excel (XLSX/CSV) و PDF رسمية
                </p>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات السريعة العلوية */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchExportData}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-900/40 text-slate-300 hover:text-[#00d2d3] hover:border-[#00d2d3]/50 transition-all cursor-pointer shadow-sm"
              title="تحديث البيانات فورياً"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00d2d3]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={downloadExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel (XLSX)</span>
            </button>

            <button
              type="button"
              onClick={openOfficialPdf}
              className="flex items-center gap-1.5 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة وطباعة PDF رسمي</span>
            </button>
          </div>
        </div>

        {/* 2. كروت مؤشرات الأداء الحيوية (Executive KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-cyan-950/60 text-xs">
          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-[#00d2d3]/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-[#00d2d3] shrink-0 shadow-[0_0_10px_rgba(0,210,211,0.15)]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">شحنات السائقين الجاهزة</div>
              <div className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{globalStats.totalDriverOrders}</span>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 font-mono">
                  {globalStats.totalSalesAmount.toLocaleString()} ﷼
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">عمليات المستودع والفرز</div>
              <div className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{globalStats.totalWarehouseOrders} مهمة</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">جاهز للتسليم</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">قيمة المخزون الحالي</div>
              <div className="text-base font-black text-amber-400 mt-0.5 flex items-center gap-1.5 font-mono">
                <span>{globalStats.totalInventoryValue.toLocaleString()} ﷼</span>
                <span className="text-[10px] text-slate-300 font-normal font-sans bg-amber-950/40 px-1 rounded">مُثبت</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090f1d]/90 border border-cyan-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-rose-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-800/50 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">سجل البلاغات والتعثر</div>
              <div className="text-base font-black text-rose-400 mt-0.5 flex items-center gap-1.5">
                <span>{globalStats.totalIncidents} بلاغ</span>
                <span className="text-[10px] text-rose-300 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">مُجدول</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. شريط التبويبات الفاخر الموحد (Unified Segmented Navigation Bar) */}
      <div className="bg-[#090f1d] border border-cyan-900/50 p-1.5 rounded-2xl flex flex-wrap gap-1.5 shadow-xl text-xs">
        <button
          type="button"
          onClick={() => handleTabChange('export_driver_orders')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'export_driver_orders'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>تصدير طلبات السائقين</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${currentTab === 'export_driver_orders' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
            {filteredDriverOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('export_warehouse_orders')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'export_warehouse_orders'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>تصدير طلبات المستودع</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${currentTab === 'export_warehouse_orders' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
            {filteredWarehouseOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('export_inventory')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'export_inventory'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>تصدير المخزون الحالي</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${currentTab === 'export_inventory' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
            {filteredInventoryItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('export_reports')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTab === 'export_reports'
              ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_18px_rgba(0,210,211,0.4)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>تصدير البلاغات والتعثر</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${currentTab === 'export_reports' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
            {filteredIncidents.length}
          </span>
        </button>
      </div>

      {/* 4. لوحة الفلاتر الذكية والبحث الفوري (بدون أي شاشة فارغة مزعجة) */}
      <div className="bg-[#0f1523] border border-cyan-900/40 rounded-3xl p-5 shadow-2xl space-y-4 text-xs">
        
        {/* الصف الأول: الفلاتر الزمنية السريعة + حقل البحث الفوري */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-950/60">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold ml-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span>الفترة:</span>
            </span>
            <button
              type="button"
              onClick={() => handleDatePreset('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${datePreset === 'all' ? 'bg-[#00d2d3] text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              كافة الفترات
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('today')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${datePreset === 'today' ? 'bg-[#00d2d3] text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('7days')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${datePreset === '7days' ? 'bg-[#00d2d3] text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              آخر 7 أيام
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('month')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${datePreset === 'month' ? 'bg-[#00d2d3] text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              هذا الشهر
            </button>
          </div>

          {/* حقل البحث الفوري */}
          <div className="relative w-64 sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الشحنة، العميل، الجوال، الصنف..."
              className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl pr-3 pl-9 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* الصف الثاني: فلاتر مخصصة وتحديد التواريخ والفروع والمناديب */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-bold">من تاريخ:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); }}
              className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#00d2d3]"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-bold">إلى تاريخ:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); }}
              className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#00d2d3]"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-bold">الفرع / المستودع:</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              aria-label="تصفية حسب الفرع"
              className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
            >
              <option value="all">كافة الفروع والمستودعات</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {currentTab === 'export_driver_orders' && (
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-bold">السائق / المندوب:</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                aria-label="تصفية حسب السائق"
                className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
              >
                <option value="all">كافة مناديب الأسطول</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                ))}
              </select>
            </div>
          )}

          {currentTab === 'export_warehouse_orders' && (
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-bold">مرحلة التجهيز:</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                aria-label="تصفية حسب مرحلة التجهيز"
                className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
              >
                <option value="all">كافة المراحل</option>
                <option value="packaged">تم التغليف والطباعة</option>
                <option value="packing">تعبئة وتشييك</option>
                <option value="picking">تحضير من الرف</option>
              </select>
            </div>
          )}

          {currentTab === 'export_reports' && (
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-bold">حالة البلاغ:</label>
              <select
                value={incidentStatus}
                onChange={(e) => setIncidentStatus(e.target.value)}
                aria-label="تصفية حسب حالة البلاغ"
                className="w-full bg-[#090f1d] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#00d2d3] cursor-pointer"
              >
                <option value="all">كافة البلاغات</option>
                <option value="reschedule">إعادة جدولة</option>
                <option value="return_to_hub">إرجاع للفرع</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 5. جداول البيانات المفصلة لكل تبويب */}
      <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden text-slate-100">
        
        {/* الترويسة العلوية للجدول مع عدد السجلات وزر التصدير السريع */}
        <div className="p-4 border-b border-cyan-900/40 flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d]/50">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white">البيانات الجاهزة للاستخراج:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-mono font-bold">
              {currentTab === 'export_driver_orders' && `${filteredDriverOrders.length} شحنة معتمدة`}
              {currentTab === 'export_warehouse_orders' && `${filteredWarehouseOrders.length} طلب مستودع`}
              {currentTab === 'export_inventory' && `${filteredInventoryItems.length} صنف مسجل`}
              {currentTab === 'export_reports' && `${filteredIncidents.length} بلاغ تعثر`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadExcel}
              className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-400 border border-emerald-800/60 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل Excel</span>
            </button>
            <button
              type="button"
              onClick={openOfficialPdf}
              className="flex items-center gap-1.5 bg-cyan-950/70 hover:bg-cyan-900/70 text-[#00d2d3] border border-cyan-800/60 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>معاينة PDF</span>
            </button>
          </div>
        </div>

        {/* 5.1 جدول طلبات السائقين */}
        {currentTab === 'export_driver_orders' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3.5 px-4">رقم الشحنة</th>
                  <th className="py-3.5 px-4">التاريخ والوقت</th>
                  <th className="py-3.5 px-4">السائق الميداني</th>
                  <th className="py-3.5 px-4">الفرع</th>
                  <th className="py-3.5 px-4">العميل ورقم الاتصال</th>
                  <th className="py-3.5 px-4">عنوان التوصيل</th>
                  <th className="py-3.5 px-4">المبلغ الإجمالي</th>
                  <th className="py-3.5 px-4">طريقة الدفع</th>
                  <th className="py-3.5 px-4">عمولة المندوب</th>
                  <th className="py-3.5 px-4">حالة الشحنة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDriverOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-500 font-bold">
                      لا توجد شحنات مطابقة لشروط الفلترة المحددة
                    </td>
                  </tr>
                ) : (
                  filteredDriverOrders.map((o, idx) => (
                    <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00d2d3]">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-cyan-900/60">
                          {o.orderId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{o.date ? new Date(o.date).toLocaleDateString('ar-SA') : '—'}</td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-emerald-950/70 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-800/50">
                          {o.driverName?.charAt(0) || 'س'}
                        </div>
                        <span>{o.driverName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{o.branchName}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{o.customerName}</div>
                        <div className="font-mono text-slate-400 text-[10px]" dir="ltr">{o.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[140px] truncate">{o.customerAddress}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{o.totalAmount} ﷼</td>
                      <td className="py-3.5 px-4 text-slate-300">{o.paymentMethod}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{o.commission} ﷼</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold text-[10px]">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* صف الإجماليات السفلي */}
            {filteredDriverOrders.length > 0 && (
              <div className="p-4 bg-[#090f1d] border-t border-cyan-900/50 flex flex-wrap items-center justify-between text-xs font-mono font-bold text-slate-300">
                <div>إجمالي الشحنات المستخرجة: <span className="text-[#00d2d3] text-sm">{filteredDriverOrders.length}</span></div>
                <div>إجمالي قيمة المبيعات: <span className="text-emerald-400 text-sm">{currentTotalSales.toLocaleString()} ﷼</span></div>
                <div>إجمالي عمولات المناديب: <span className="text-cyan-400 text-sm">{currentTotalCommissions.toLocaleString()} ﷼</span></div>
              </div>
            )}
          </div>
        )}

        {/* 5.2 جدول طلبات موظفي المستودع */}
        {currentTab === 'export_warehouse_orders' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3.5 px-4">رقم الشحنة</th>
                  <th className="py-3.5 px-4">تاريخ الطلب</th>
                  <th className="py-3.5 px-4">الفرع والمستودع</th>
                  <th className="py-3.5 px-4">فني التحضير والتجهيز</th>
                  <th className="py-3.5 px-4">تفاصيل الأصناف والكميات</th>
                  <th className="py-3.5 px-4">مرحلة التجهيز</th>
                  <th className="py-3.5 px-4">طباعة البوليصة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWarehouseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 font-bold">
                      لا توجد طلبات مستودع مطابقة للشروط
                    </td>
                  </tr>
                ) : (
                  filteredWarehouseOrders.map((w, idx) => (
                    <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00d2d3]">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-cyan-900/60">
                          {w.orderId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{w.date ? new Date(w.date).toLocaleDateString('ar-SA') : '—'}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{w.branchName}</td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-cyan-950/70 text-[#00d2d3] flex items-center justify-center font-bold text-[10px] border border-cyan-800/50">
                          {w.pickerName?.charAt(0) || 'ف'}
                        </div>
                        <span>{w.pickerName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate">{w.itemsDetails}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-[10px]">
                          {w.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={w.waybillPrinted === 'نعم' ? 'text-emerald-400' : 'text-slate-500'}>
                          {w.waybillPrinted === 'نعم' ? '✓ نعم مطبوعة' : '— غير مطبوعة'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5.3 جدول المخزون الحالي */}
        {currentTab === 'export_inventory' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3.5 px-4">كود الصنف (SKU)</th>
                  <th className="py-3.5 px-4">اسم المنتج</th>
                  <th className="py-3.5 px-4">التصنيف</th>
                  <th className="py-3.5 px-4">الفرع والمستودع</th>
                  <th className="py-3.5 px-4">الكمية المتوفرة</th>
                  <th className="py-3.5 px-4">سعر الوحدة</th>
                  <th className="py-3.5 px-4">القيمة الإجمالية</th>
                  <th className="py-3.5 px-4">موقع الرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInventoryItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500 font-bold">
                      لا توجد أصناف بالمخزون مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredInventoryItems.map((i, idx) => (
                    <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                          {i.sku}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{i.name}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{i.category}</td>
                      <td className="py-3.5 px-4 text-slate-400">{i.branchName}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 text-sm">{i.qty}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{i.unitPrice} ﷼</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{i.qty * i.unitPrice} ﷼</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{i.shelfLocation}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* صف إجماليات المخزون */}
            {filteredInventoryItems.length > 0 && (
              <div className="p-4 bg-[#090f1d] border-t border-cyan-900/50 flex flex-wrap items-center justify-between text-xs font-mono font-bold text-slate-300">
                <div>إجمالي الأصناف: <span className="text-[#00d2d3] text-sm">{filteredInventoryItems.length}</span></div>
                <div>إجمالي القطع المتوفرة: <span className="text-cyan-400 text-sm">{currentInventoryTotalUnits.toLocaleString()} قطعة</span></div>
                <div>القيمة الإجمالية للمخزون: <span className="text-emerald-400 text-sm">{currentInventoryTotalVal.toLocaleString()} ﷼</span></div>
              </div>
            )}
          </div>
        )}

        {/* 5.4 جدول البلاغات والتعثر */}
        {currentTab === 'export_reports' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090f1d] font-bold text-[11px]">
                  <th className="py-3.5 px-4">رقم البلاغ</th>
                  <th className="py-3.5 px-4">رقم الشحنة</th>
                  <th className="py-3.5 px-4">المندوب الميداني</th>
                  <th className="py-3.5 px-4">العميل ورقم الهاتف</th>
                  <th className="py-3.5 px-4">سبب التعثر</th>
                  <th className="py-3.5 px-4">ملاحظات المندوب</th>
                  <th className="py-3.5 px-4">الإجراء المتخذ</th>
                  <th className="py-3.5 px-4">المبلغ المتأثر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500 font-bold">
                      لا توجد بلاغات تعثر مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc, idx) => (
                    <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                        <span className="px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-800/60">
                          {inc.incidentId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00d2d3]">{inc.orderId}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{inc.driverName}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{inc.customerName}</div>
                        <div className="font-mono text-slate-400 text-[10px]" dir="ltr">{inc.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-amber-400 font-semibold">{inc.reason}</td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[160px] truncate">{inc.notes}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-[10px]">
                          {inc.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{inc.orderAmount} ﷼</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ========================================================================================= */}
      {/* 6. نافذة الوثيقة الرسمية الصادرة من سَنَد (Official Printable PDF Modal) */}
      {/* ========================================================================================= */}
      {showPdfModal && (
        <div className="fixed inset-0 z-[5000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[92vh]" dir="rtl">
            
            {/* شريط الإجراءات العلوي */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="flex items-center gap-1.5 bg-[#00d2d3] hover:bg-cyan-500 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية أو حفظ PDF 📄</span>
                </button>

                <button
                  type="button"
                  onClick={downloadExcel}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-xs"
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
              
              {/* الترويسة الرسمية المعتمدة */}
              <div className="border-b-2 border-slate-900 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={SANAD_OFFICIAL_ENTITY.logoUrl}
                      alt="شعار سَنَد"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-900 shadow-md"
                    />
                    <div>
                      <h2 className="text-base font-black text-slate-950 leading-tight">
                        {SANAD_OFFICIAL_ENTITY.nameAr}
                      </h2>
                      <div className="font-mono text-xs font-bold text-slate-700 tracking-wider">
                        {SANAD_OFFICIAL_ENTITY.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5">
                        <span>س.ت: <strong className="font-mono text-slate-900">{SANAD_OFFICIAL_ENTITY.crNumber}</strong></span>
                        <span>الرقم الضريبي: <strong className="font-mono text-slate-900">{SANAD_OFFICIAL_ENTITY.vatNumber}</strong></span>
                        <span>ترخيص النقل: <strong className="font-mono text-slate-900">{SANAD_OFFICIAL_ENTITY.transportLicense}</strong></span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {SANAD_OFFICIAL_ENTITY.nationalAddress}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-left font-mono text-xs space-y-1">
                      <div className="inline-block border border-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="text-[9.5px] text-slate-600 block">رقم الوثيقة:</span>
                        <strong className="text-slate-900 font-bold">DOC-{Date.now().toString().slice(-6)}</strong>
                      </div>
                      <div className="text-[9.5px] text-slate-600">
                        <div>تاريخ الإصدار: <strong className="text-slate-900 font-bold">{new Date().toLocaleDateString('ar-SA')}</strong></div>
                        <div>طبيعة التقرير: <strong className="text-slate-900 font-bold">
                          {currentTab === 'export_driver_orders' && 'مسير شحنات الأسطول'}
                          {currentTab === 'export_warehouse_orders' && 'سجل المستودع'}
                          {currentTab === 'export_inventory' && 'جرد المخزون'}
                          {currentTab === 'export_reports' && 'سجل البلاغات'}
                        </strong></div>
                      </div>
                    </div>
                    <OfficialZatcaQr size={64} />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                  <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg shadow-sm font-black text-xs tracking-wide">
                    تقرير تدقيق ورصد العمليات اللوجستية والميدانية (OPERATIONS AUDIT)
                  </div>
                  <div className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>✓</span>
                    <span>معتمد رسمياً وموثق بالنظام السحابي</span>
                  </div>
                </div>
              </div>

              {/* بطاقة ملخص الوثيقة */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="text-slate-500">إجمالي السجلات:</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {currentTab === 'export_driver_orders' && `${filteredDriverOrders.length} شحنة`}
                    {currentTab === 'export_warehouse_orders' && `${filteredWarehouseOrders.length} طلب`}
                    {currentTab === 'export_inventory' && `${filteredInventoryItems.length} صنف`}
                    {currentTab === 'export_reports' && `${filteredIncidents.length} بلاغ`}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500">الفرع المحدد:</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {selectedBranchId === 'all' ? 'كافة الفروع' : branches.find(b => b.id === selectedBranchId)?.name || 'المركز الرئيسي'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500">حالة الاعتماد:</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">معتمد رسمياً ✓</div>
                </div>
              </div>

              {/* جدول الوثيقة المطبوعة */}
              <div className="overflow-x-auto text-xs">
                {currentTab === 'export_driver_orders' && (
                  <table className="w-full text-right border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                      <tr>
                        <th className="p-2 border-l border-slate-300">رقم الشحنة</th>
                        <th className="p-2 border-l border-slate-300">السائق</th>
                        <th className="p-2 border-l border-slate-300">العميل</th>
                        <th className="p-2 border-l border-slate-300">العنوان</th>
                        <th className="p-2 border-l border-slate-300">المبلغ</th>
                        <th className="p-2 border-l border-slate-300">الدفع</th>
                        <th className="p-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDriverOrders.map((o, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-mono font-bold border-l border-slate-200">{o.orderId}</td>
                          <td className="p-2 border-l border-slate-200">{o.driverName}</td>
                          <td className="p-2 border-l border-slate-200">{o.customerName}</td>
                          <td className="p-2 border-l border-slate-200 text-slate-600">{o.customerAddress}</td>
                          <td className="p-2 font-mono font-bold border-l border-slate-200">{o.totalAmount} ﷼</td>
                          <td className="p-2 border-l border-slate-200">{o.paymentMethod}</td>
                          <td className="p-2 font-bold text-emerald-700">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {currentTab === 'export_inventory' && (
                  <table className="w-full text-right border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                      <tr>
                        <th className="p-2 border-l border-slate-300">كود الصنف (SKU)</th>
                        <th className="p-2 border-l border-slate-300">اسم المنتج</th>
                        <th className="p-2 border-l border-slate-300">التصنيف</th>
                        <th className="p-2 border-l border-slate-300">الكمية</th>
                        <th className="p-2 border-l border-slate-300">سعر الوحدة</th>
                        <th className="p-2">القيمة الإجمالية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredInventoryItems.map((i, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-mono font-bold border-l border-slate-200">{i.sku}</td>
                          <td className="p-2 border-l border-slate-200">{i.name}</td>
                          <td className="p-2 border-l border-slate-200">{i.category}</td>
                          <td className="p-2 font-mono font-bold border-l border-slate-200">{i.qty}</td>
                          <td className="p-2 font-mono border-l border-slate-200">{i.unitPrice} ﷼</td>
                          <td className="p-2 font-mono font-bold text-emerald-700">{i.qty * i.unitPrice} ﷼</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* تذييل الوثيقة الرسمية والأختام */}
              <div className="pt-4 border-t border-slate-300 space-y-4">
                <div className="text-[10.5px] font-bold text-slate-700 border-b border-slate-200 pb-1">
                  الاعتمادات والمصادقة الإدارية الرسمية:
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs relative">
                  <div className="space-y-3">
                    <span className="font-bold text-slate-700 block text-[10px]">مسؤول استخراج وتصدير البيانات</span>
                    <div className="border-b-2 border-dotted border-slate-400 w-28 mx-auto"></div>
                    <div className="text-[9.5px] text-slate-600 font-semibold">فريق إدارة العمليات سَنَد</div>
                  </div>

                  <div className="space-y-3">
                    <span className="font-bold text-slate-700 block text-[10px]">المراجعة والتدقيق الميداني</span>
                    <div className="border-b-2 border-dotted border-slate-400 w-28 mx-auto"></div>
                    <div className="text-[9.5px] text-slate-600 font-semibold">مدير المستودعات والنقل</div>
                  </div>

                  <div className="space-y-1 relative">
                    <span className="font-bold text-slate-900 block text-[10px]">الاعتماد والختم الرسمي</span>
                    <div className="border-b-2 border-dotted border-slate-400 w-28 mx-auto pt-1"></div>
                    <div className="text-[9.5px] text-slate-700 font-bold">المدير العام المعتمد</div>
                    
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                      <OfficialStamp department="إدارة العمليات والبيانات" statusText="مصدق ومطابق" size={95} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <div>تم استخراج هذا التقرير آلياً عبر منصة سَنَد الذكية للخدمات اللوجستية</div>
                  <div>وثيقة رسمية معتمدة</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

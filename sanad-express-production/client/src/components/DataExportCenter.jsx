import React, { useState, useEffect } from 'react';
import { Download, Printer, Filter, Calendar, Users, Store, FileText, CheckCircle2, Box, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import CalendarRangePicker from './CalendarRangePicker';

export default function DataExportCenter({ activeTab, onSelectTab, drivers, branches, selectedBranch }) {
  const [currentTab, setCurrentTab] = useState(activeTab || 'export_driver_orders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState(selectedBranch || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab && activeTab.startsWith('export_')) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedDriverId !== 'all') params.append('driverId', selectedDriverId);
      if (selectedBranchId !== 'all') params.append('branchId', selectedBranchId);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

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
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTab, startDate, endDate, selectedDriverId, selectedBranchId, selectedStatus]);

  // توليد وتحميل ملف CSV بترميز عربي سليم لبرنامج Excel
  const downloadCSV = () => {
    if (!data) return alert('لا توجد بيانات متاحة للتصدير');
    let csv = '\uFEFF'; // BOM UTF-8
    let filename = `sanad_export_${currentTab}_${startDate || 'all'}_${endDate || 'today'}.csv`;

    if (currentTab === 'export_driver_orders' && data.orders) {
      csv += 'تقرير طلبات السائقين - سند إكسبريس\n';
      csv += `الفترة: ${startDate || 'البداية'} إلى ${endDate || 'الآن'}\n\n`;
      csv += 'رقم الشحنة,التاريخ,اسم المندوب,جوال المندوب,الفرع,اسم العميل,جوال العميل,العنوان,المبلغ الإجمالي,طريقة الدفع,عمولة المندوب,حالة الطلب\n';
      data.orders.forEach(o => {
        csv += `"${o.orderId}","${o.date}","${o.driverName}","${o.driverPhone}","${o.branchName}","${o.customerName}","${o.customerPhone}","${o.customerAddress}",${o.totalAmount},"${o.paymentMethod}",${o.commission},"${o.status}"\n`;
      });
      if (data.summary) {
        csv += `\nالإجمالي:,,,,,,,,${data.summary.totalSales},,${data.summary.totalCommission},\n`;
      }
    } else if (currentTab === 'export_warehouse_orders' && data.warehouseOrders) {
      csv += 'تقرير طلبات موظفي المستودع والتجهيز - سند إكسبريس\n';
      csv += `الفترة: ${startDate || 'البداية'} إلى ${endDate || 'الآن'}\n\n`;
      csv += 'رقم الشحنة,التاريخ,الفرع,موظف التجهيز,عدد الأصناف,تفاصيل الأصناف,مرحلة التجهيز,بوليصة الشحن\n';
      data.warehouseOrders.forEach(w => {
        csv += `"${w.orderId}","${w.date}","${w.branchName}","${w.pickerName}",${w.itemsCount},"${w.itemsDetails}","${w.stage}","${w.waybillPrinted}"\n`;
      });
    } else if (currentTab === 'export_inventory' && data.items) {
      csv += 'مسير جرد المخزون الحالي - سند إكسبريس\n';
      csv += `تاريخ الجرد: ${new Date().toLocaleDateString('ar-SA')}\n\n`;
      csv += 'كود الصنف,اسم المنتج,التصنيف,الفرع,الكمية المتوفرة,الحد الأدنى,سعر الوحدة,القيمة الإجمالية,مكان الرف\n';
      data.items.forEach(i => {
        csv += `"${i.sku}","${i.name}","${i.category}","${i.branchName}",${i.qty},${i.minQty},${i.unitPrice},${i.qty * i.unitPrice},"${i.shelfLocation}"\n`;
      });
      if (data.summary) {
        csv += `\nالإجمالي:,,,,${data.summary.totalUnits},,,${data.summary.totalValue},\n`;
      }
    } else if (currentTab === 'export_reports' && data.incidents) {
      csv += 'تقرير البلاغات وتعثر التوصيل - سند إكسبريس\n';
      csv += `الفترة: ${startDate || 'البداية'} إلى ${endDate || 'الآن'}\n\n`;
      csv += 'رقم البلاغ,رقم الشحنة,التاريخ,اسم المندوب,الفرع,اسم العميل,رقم الجوال,سبب التعثر,ملاحظات المندوب,الإجراء المتخذ,قيمة الشحنة\n';
      data.incidents.forEach(inc => {
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

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      {/* شريط التبويبات الأربعة لاختيار نوع التصدير */}
      <div className="bg-[#0f1b23] border border-slate-800 p-2 rounded-3xl flex flex-wrap gap-2 text-xs shadow-xl print:hidden">
        <button
          type="button"
          onClick={() => { setCurrentTab('export_driver_orders'); if (onSelectTab) onSelectTab('export_driver_orders'); }}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'export_driver_orders' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}
        >
          <Users className="w-4 h-4" />
          <span>تصدير طلبات السائقين</span>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentTab('export_warehouse_orders'); if (onSelectTab) onSelectTab('export_warehouse_orders'); }}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'export_warehouse_orders' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}
        >
          <Box className="w-4 h-4" />
          <span>تصدير طلبات موظفي المستودع</span>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentTab('export_inventory'); if (onSelectTab) onSelectTab('export_inventory'); }}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'export_inventory' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}
        >
          <FileText className="w-4 h-4" />
          <span>تصدير المخزون الحالي</span>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentTab('export_reports'); if (onSelectTab) onSelectTab('export_reports'); }}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'export_reports' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>تصدير البلاغات وتعثر التوصيل</span>
        </button>
      </div>

      {/* شريط الفلاتر والتقويم التفاعلي المنبثق */}
      <div className="bg-[#0f1b23] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>فلاتر وتخصيص التصدير:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadCSV}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تحميل Excel (CSV)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* محدد التقويم التفاعلي */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">📅 التقويم الزمني للفترة:</label>
            <CalendarRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={({ startDate: s, endDate: e }) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
          </div>

          {/* محدد المندوب (يظهر في طلبات السائقين والبلاغات) */}
          {(currentTab === 'export_driver_orders' || currentTab === 'export_reports') && (
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">👤 اختيار المندوب:</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 text-slate-200 rounded-2xl p-2.5 outline-none focus:border-emerald-500"
              >
                <option value="all">كل المناديب (الأسطول كامل)</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* محدد الفرع / المتجر */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">🏪 الفرع / المتجر:</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 text-slate-200 rounded-2xl p-2.5 outline-none focus:border-emerald-500"
            >
              <option value="all">كل الفروع (إكليل الدمام، الجبيل، فيب الشرق)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* محدد الحالة */}
          {currentTab === 'export_driver_orders' && (
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">🏷️ حالة الشحنة:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 text-slate-200 rounded-2xl p-2.5 outline-none focus:border-emerald-500"
              >
                <option value="all">كل الحالات</option>
                <option value="delivered">تم التسليم</option>
                <option value="in_transit">جاري التوصيل</option>
                <option value="assigned">مسندة للمندوب</option>
                <option value="unassigned">بانتظار الإسناد</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* بطاقات الملخص السريعة */}
      {data && data.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#0f1b23] border border-slate-800 p-4 rounded-2xl">
            <div className="text-slate-400 font-sans">إجمالي السجلات المصفاة:</div>
            <div className="text-xl font-bold text-white mt-1">{data.summary.count || data.summary.totalItems || 0}</div>
          </div>
          {data.summary.totalSales !== undefined && (
            <div className="bg-[#0f1b23] border border-slate-800 p-4 rounded-2xl">
              <div className="text-slate-400 font-sans">إجمالي قيمة المبيعات:</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{data.summary.totalSales} ر.س</div>
            </div>
          )}
          {data.summary.totalValue !== undefined && (
            <div className="bg-[#0f1b23] border border-slate-800 p-4 rounded-2xl">
              <div className="text-slate-400 font-sans">إجمالي قيمة المخزون:</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{data.summary.totalValue} ر.س</div>
            </div>
          )}
          {data.summary.totalCommission !== undefined && (
            <div className="bg-[#0f1b23] border border-slate-800 p-4 rounded-2xl">
              <div className="text-slate-400 font-sans">إجمالي عمولات المناديب:</div>
              <div className="text-xl font-bold text-purple-400 mt-1">{data.summary.totalCommission} ر.س</div>
            </div>
          )}
        </div>
      )}

      {/* جدول معاينة البيانات المباشر المجهز للطباعة والتصدير */}
      <div className="bg-[#0f1b23] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>معاينة جدول البيانات المصفاة قبل التصدير:</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">جاهز للتصدير الفوري</span>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto text-xs">
          {currentTab === 'export_driver_orders' && (
            <table className="w-full text-right">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">رقم الشحنة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">المندوب</th>
                  <th className="p-3">الفرع</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">العنوان</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">عمولة المندوب</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.orders?.map((o, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-400">{o.orderId}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{new Date(o.date).toLocaleDateString('ar-SA')}</td>
                    <td className="p-3 font-bold text-slate-200">{o.driverName}</td>
                    <td className="p-3 text-slate-300">{o.branchName}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-200">{o.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.customerPhone}</div>
                    </td>
                    <td className="p-3 text-slate-300 truncate max-w-xs">{o.customerAddress}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{o.totalAmount} ر.س</td>
                    <td className="p-3 text-slate-300">{o.paymentMethod}</td>
                    <td className="p-3 font-mono text-purple-400 font-bold">{o.commission} ر.س</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-bold border border-slate-700">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {currentTab === 'export_warehouse_orders' && (
            <table className="w-full text-right">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">رقم الشحنة</th>
                  <th className="p-3">تاريخ الاستلام</th>
                  <th className="p-3">الفرع</th>
                  <th className="p-3">مسؤول التجهيز</th>
                  <th className="p-3">عدد الأصناف</th>
                  <th className="p-3">تفاصيل الأصناف</th>
                  <th className="p-3">مرحلة التجهيز</th>
                  <th className="p-3">طباعة البوليصة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.warehouseOrders?.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{w.orderId}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{new Date(w.date).toLocaleDateString('ar-SA')}</td>
                    <td className="p-3 text-slate-200 font-bold">{w.branchName}</td>
                    <td className="p-3 text-slate-300">{w.pickerName}</td>
                    <td className="p-3 font-mono font-bold text-slate-200">{w.itemsCount}</td>
                    <td className="p-3 text-slate-300 truncate max-w-sm">{w.itemsDetails}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">{w.stage}</span></td>
                    <td className="p-3 text-slate-300 font-bold">{w.waybillPrinted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {currentTab === 'export_inventory' && (
            <table className="w-full text-right">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">كود الصنف (SKU)</th>
                  <th className="p-3">اسم المنتج</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">الفرع</th>
                  <th className="p-3">الكمية المتوفرة</th>
                  <th className="p-3">حد الطلب</th>
                  <th className="p-3">سعر الحبة</th>
                  <th className="p-3">إجمالي القيمة</th>
                  <th className="p-3">مكان الرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.items?.map((i, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">{i.sku}</td>
                    <td className="p-3 font-bold text-slate-200">{i.name}</td>
                    <td className="p-3 text-slate-300">{i.category}</td>
                    <td className="p-3 text-slate-300">{i.branchName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400 text-sm">{i.qty}</td>
                    <td className="p-3 font-mono text-slate-400">{i.minQty}</td>
                    <td className="p-3 font-mono text-slate-200">{i.unitPrice} ر.س</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{(i.qty * i.unitPrice).toFixed(2)} ر.س</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{i.shelfLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {currentTab === 'export_reports' && (
            <table className="w-full text-right">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">رقم البلاغ</th>
                  <th className="p-3">رقم الشحنة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">المندوب</th>
                  <th className="p-3">الفرع</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">سبب التعثر / البلاغ</th>
                  <th className="p-3">ملاحظات المندوب</th>
                  <th className="p-3">الإجراء</th>
                  <th className="p-3">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.incidents?.map((inc, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-red-400">{inc.incidentId}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{inc.orderId}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{new Date(inc.date).toLocaleDateString('ar-SA')}</td>
                    <td className="p-3 font-bold text-slate-200">{inc.driverName}</td>
                    <td className="p-3 text-slate-300">{inc.branchName}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-200">{inc.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inc.customerPhone}</div>
                    </td>
                    <td className="p-3 text-amber-300 font-bold">{inc.reason}</td>
                    <td className="p-3 text-slate-400 truncate max-w-xs">{inc.notes}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">{inc.action}</span></td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{inc.orderAmount} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
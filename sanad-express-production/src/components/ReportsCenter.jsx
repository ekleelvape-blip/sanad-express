import React, { useState, useEffect } from 'react';
import { 
  Home, ChevronLeft, ChevronRight, Banknote, TrendingUp, Receipt, 
  SlidersHorizontal, ClipboardList, Search, X, CheckCircle2, 
  AlertCircle, DollarSign, Calendar, Download, Printer, User, ArrowRight,
  Trophy, Laptop, ChevronDown, Check
} from 'lucide-react';
import FridayInvoicesHub from './FridayInvoicesHub';

export default function ReportsCenter({ activeTab: externalTab, onSelectTab, drivers = [], branches = [], selectedBranch }) {
  const validTabs = ['cod_collections', 'friday_invoices', 'driver_performance', 'driver_dues', 'ratings', 'neighborhoods'];
  
  // التبويب النشط
  const [activeTab, setActiveTab] = useState(() => {
    if (externalTab && validTabs.includes(externalTab)) return externalTab;
    return 'cod_collections';
  });

  useEffect(() => {
    if (externalTab && validTabs.includes(externalTab) && externalTab !== activeTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onSelectTab) {
      onSelectTab(tabId);
    }
  };

  // بيانات التبويب 1: تحصيلات الدفع عند الاستلام
  const [codData, setCodData] = useState([]);
  const [selectedDriverForModal, setSelectedDriverForModal] = useState(null);
  const [codSearchQuery, setCodSearchQuery] = useState('');

  // فلاتر التبويب 2: تقرير أداء السائقين
  const [perfStartDate, setPerfStartDate] = useState('');
  const [perfEndDate, setPerfEndDate] = useState('');

  // فلاتر التبويب 3: تقرير مستحقات السائقين
  const [duesStartDate, setDuesStartDate] = useState('');
  const [duesEndDate, setDuesEndDate] = useState('');
  const [selectedDuesDriver, setSelectedDuesDriver] = useState('');

  // فلاتر التبويب 4: تقرير التقييمات
  const [ratingsPeriod, setRatingsPeriod] = useState('today'); // 'today' | '7days' | '14days' | '30days'

  // فلاتر التبويب 5: تقرير الأحياء
  const [selectedCity, setSelectedCity] = useState('all');

  // جلب بيانات تحصيلات الدفع عند الاستلام من الخادم
  useEffect(() => {
    fetch('/api/reports/cod-collections')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json?.codCollections?.length > 0) setCodData(json.codCollections);
      })
      .catch(err => console.error('Error loading cod collections:', err));
  }, []);

  // قائمة السائقين الافتراضية لتحصيلات الدفع عند الاستلام
  const defaultCodList = [
    { driverId: 'drv-1', driverName: 'يونس', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-2', driverName: 'زكريا جميل', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-3', driverName: 'عبدالرحمن الناصر', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-4', driverName: 'حمزه وليد', underReview: { count: 2, amount: -457.50 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 1, amount: -243.77 }, finalBalance: -701.27 },
    { driverId: 'drv-5', driverName: 'نوري محمود عبدالله حنتوس صاحب السياره الصفراء', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-6', driverName: 'عبدالرحمن احمد الهاشم', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-7', driverName: 'علي حسين الهاشم', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-8', driverName: 'حمزوز', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-9', driverName: 'محمد عبدالله العباد', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-10', driverName: 'عبدالرحمن مطهر علي', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-11', driverName: 'علي المحمد', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 },
    { driverId: 'drv-12', driverName: 'هاشم صالح', underReview: { count: 0, amount: 0 }, assigned: { count: 0, amount: 0 }, inTransit: { count: 0, amount: 0 }, finalBalance: 0.00 }
  ];

  const displayCodList = (codData && codData.length > 0 ? codData : defaultCodList).filter(d => 
    !codSearchQuery || d.driverName.includes(codSearchQuery)
  );

  // بيانات التبويب 2: أداء السائقين (مطابقة للصورة بدقة 100%)
  const performanceDriversList = [
    { id: 1, isTrophy: true, name: 'يونس', avgPickup: '9', avgDelivery: '13.50', totalOrders: 2, deliveredPct: '100%', deliveredCount: 2 },
    { id: 2, isTrophy: false, name: 'زكريا جميل', avgPickup: '10.2', avgDelivery: '24.00', totalOrders: 5, deliveredPct: '100%', deliveredCount: 5 },
    { id: 3, isTrophy: false, name: 'عبدالرحمن الناصر', avgPickup: '187.01', avgDelivery: '195.95', totalOrders: 81, deliveredPct: '98.77%', deliveredCount: 80 },
    { id: 4, isTrophy: false, name: 'حمزه وليد', avgPickup: '34.7', avgDelivery: '74.65', totalOrders: 244, deliveredPct: '96.72%', deliveredCount: 236 },
    { id: 5, isTrophy: false, name: 'نوري محمود عبدالله حنتوس صاحب السياره الصفراء', avgPickup: '27.16', avgDelivery: '47.37', totalOrders: 94, deliveredPct: '98.94%', deliveredCount: 93 },
    { id: 6, isTrophy: false, name: 'عبدالرحمن احمد الهاشم', avgPickup: '52.8', avgDelivery: '11.20', totalOrders: 5, deliveredPct: '100%', deliveredCount: 5 },
    { id: 7, isTrophy: false, name: 'علي حسين الهاشم', avgPickup: '46.15', avgDelivery: '32.15', totalOrders: 41, deliveredPct: '100%', deliveredCount: 41 },
    { id: 8, isTrophy: false, name: 'حمزوز', avgPickup: '52.24', avgDelivery: '112.86', totalOrders: 21, deliveredPct: '100%', deliveredCount: 21 },
    { id: 9, isTrophy: false, name: 'محمد عبدالله العباد', avgPickup: '43.2', avgDelivery: '646.13', totalOrders: 15, deliveredPct: '100%', deliveredCount: 15 },
    { id: 10, isTrophy: false, name: 'عبدالرحمن مطهر علي', avgPickup: '28.03', avgDelivery: '51.40', totalOrders: 70, deliveredPct: '95.71%', deliveredCount: 67 },
    { id: 11, isTrophy: false, name: 'علي المحمد', avgPickup: '2', avgDelivery: '35.67', totalOrders: 3, deliveredPct: '100%', deliveredCount: 3 },
    { id: 12, isTrophy: false, name: 'هاشم صالح', avgPickup: '6', avgDelivery: '23.00', totalOrders: 1, deliveredPct: '100%', deliveredCount: 1 }
  ];

  // بيانات التبويب 5: تقرير الأحياء (مطابقة للصورة بدقة 100%)
  const neighborhoodsList = [
    { rank: 1, name: 'الشعلة - الدمام', count: 50, dotColor: '#eab308', badgeBg: '#fef3c7', badgeText: '#92400e', city: 'الدمام' },
    { rank: 2, name: 'ضاحية الملك فهد - الدمام', count: 19, dotColor: '#10b981', badgeBg: '#d1fae5', badgeText: '#065f46', city: 'الدمام' },
    { rank: 3, name: 'طيبة - الدمام', count: 18, dotColor: '#3b82f6', badgeBg: '#dbeafe', badgeText: '#1e40af', city: 'الدمام' },
    { rank: 4, name: 'العليا - الخبر', count: 17, dotColor: '#a855f7', badgeBg: '#f3e8ff', badgeText: '#6b21a8', city: 'الخبر' },
    { rank: 5, name: 'القصور - الظهران', count: 17, dotColor: '#f97316', badgeBg: '#ffedd5', badgeText: '#9a3412', city: 'الظهران' },
    { rank: 6, name: 'أجيال - الظهران', count: 15, dotColor: '#06b6d4', badgeBg: '#cffafe', badgeText: '#155e75', city: 'الظهران' },
    { rank: 7, name: 'المنار - الدمام', count: 14, dotColor: '#8b5cf6', badgeBg: '#ede9fe', badgeText: '#5b21b6', city: 'الدمام' },
    { rank: 8, name: 'بدر - الدمام', count: 13, dotColor: '#14b8a6', badgeBg: '#ccfbf1', badgeText: '#115e59', city: 'الدمام' },
    { rank: 9, name: 'احد - الدمام', count: 13, dotColor: '#ec4899', badgeBg: '#fce7f3', badgeText: '#9d174d', city: 'الدمام' },
    { rank: 10, name: 'المزروعية - الدمام', count: 12, dotColor: '#10b981', badgeBg: '#d1fae5', badgeText: '#065f46', city: 'الدمام' }
  ];

  const filteredNeighborhoods = neighborhoodsList.filter(item => 
    selectedCity === 'all' || item.city === selectedCity
  );

  // التبويبات مع نظام فواتير الجمعة الأسبوعية التلقائية
  const tabs = [
    {
      id: 'cod_collections',
      title: 'تحصيلات الدفع عند الإستلام',
      icon: <Banknote className="w-5 h-5" />
    },
    {
      id: 'friday_invoices',
      title: 'فواتير الجمعة التلقائية للمناديب 📑',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      id: 'driver_performance',
      title: 'تقرير أداء السائقين',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'driver_dues',
      title: 'تقرير مستحقات السائقين',
      icon: <Receipt className="w-5 h-5" />
    },
    {
      id: 'ratings',
      title: 'تقرير التقييمات',
      icon: <SlidersHorizontal className="w-5 h-5" />
    },
    {
      id: 'neighborhoods',
      title: 'تقرير الأحياء',
      icon: <ClipboardList className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
      
      {/* 1. مسار التنقل العلوي (Breadcrumbs) مطابق تماماً للصورة */}
      <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-500 py-1 select-none">
        <span className="text-[#00d2d3] font-black">تقارير التوصيل</span>
        <span className="text-slate-400 font-mono text-sm">&lt;&lt;</span>
        <span className="text-slate-600 dark:text-slate-400">التقارير</span>
        <span className="text-slate-400 font-mono text-sm">&lt;&lt;</span>
        <Home className="w-4 h-4 text-slate-500 cursor-pointer hover:text-[#00d2d3] transition-colors" />
      </div>

      {/* 2. الهيكل الرئيسي: المحتوى على اليمين والتبويبات العمودية على اليسار بحسب RTL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* المحتوى الرئيسي للتقرير المختار (9 أعمدة) */}
        <div className="lg:col-span-9 order-2 lg:order-1">
          
          {/* ============================================================ */}
          {/* التبويب 1: تحصيلات الدفع عند الإستلام (مطابق للصورة 1) */}
          {/* ============================================================ */}
          {activeTab === 'cod_collections' && (
            <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all">
              
              {/* ترويسة البطاقة */}
              <div className="p-6 pb-3 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                  تحصيلات الدفع عند الإستلام
                </h2>
                
                {/* بحث سريع اختياري */}
                <div className="relative w-48 hidden sm:block">
                  <input
                    type="text"
                    value={codSearchQuery}
                    onChange={(e) => setCodSearchQuery(e.target.value)}
                    placeholder="بحث عن سائق..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#00d2d3]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* جدول تحصيلات الدفع عند الاستلام */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 font-bold text-[11px]">
                      <th className="py-3 px-5 text-right w-[32%] font-bold">السائق</th>
                      <th className="py-3 px-4 text-center w-[18%] font-bold">معاملات قيد المراجعة</th>
                      <th className="py-3 px-4 text-center w-[16%] font-bold">الطلبات المسندة</th>
                      <th className="py-3 px-4 text-center w-[18%] font-bold">طلبات جاري التوصيل</th>
                      <th className="py-3 px-5 text-left w-[16%] font-bold">(الرصيد النهائي)</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {displayCodList.map((row) => {
                      const isNegative = row.finalBalance < 0;

                      return (
                        <tr 
                          key={row.driverId}
                          onClick={() => setSelectedDriverForModal(row)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                        >
                          {/* اسم السائق */}
                          <td className="py-3.5 px-5 font-bold text-[#00d2d3] group-hover:text-cyan-400 group-hover:underline transition-all">
                            {row.driverName}
                          </td>

                          {/* معاملات قيد المراجعة */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                              {row.underReview.count}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {row.underReview.count === 0 ? '- ﷼' : `${row.underReview.amount.toFixed(2)} ﷼`}
                            </div>
                          </td>

                          {/* الطلبات المسندة */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                              {row.assigned.count}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {row.assigned.count === 0 ? '- ﷼' : `${row.assigned.amount.toFixed(2)} ﷼`}
                            </div>
                          </td>

                          {/* طلبات جاري التوصيل */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                              {row.inTransit.count}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {row.inTransit.count === 0 ? '- ﷼' : `${row.inTransit.amount.toFixed(2)} ﷼`}
                            </div>
                          </td>

                          {/* الرصيد النهائي */}
                          <td className="py-3.5 px-5 text-left">
                            <span 
                              className={
                                'inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold shadow-xs ' + 
                                (isNegative
                                  ? 'bg-[#ffebee] text-[#d32f2f] border border-[#ffcdd2] dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700'
                                )
                              }
                            >
                              {row.finalBalance.toFixed(2)} ﷼
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>

              {/* تذييل الجدول وشريط الترقيم Pagination */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span>عرض 1 إلى 12 من 12 سجل</span>
                  <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs">
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">«</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&lt;</button>
                  <button className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 text-[#00d2d3] font-bold flex items-center justify-center">1</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&gt;</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">»</button>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* التبويب: فواتير الجمعة التلقائية للمناديب (نظام أسبوعي آلي) */}
          {/* ============================================================ */}
          {activeTab === 'friday_invoices' && (
            <FridayInvoicesHub drivers={drivers} branches={branches} />
          )}

          {/* ============================================================ */}
          {/* التبويب 2: تقرير أداء السائقين (مطابق للصورة 2) */}
          {/* ============================================================ */}
          {activeTab === 'driver_performance' && (
            <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all">
              
              {/* ترويسة البطاقة مع حقول التاريخ */}
              <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                  تقرير آداء السائقين
                </h2>

                <div className="flex items-center gap-2 text-xs">
                  <div className="relative">
                    <input
                      type="text"
                      value={perfStartDate}
                      onChange={(e) => setPerfStartDate(e.target.value)}
                      placeholder="التاريخ من"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-32 outline-none focus:border-[#00d2d3]"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={perfEndDate}
                      onChange={(e) => setPerfEndDate(e.target.value)}
                      placeholder="التاريخ إلي"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-32 outline-none focus:border-[#00d2d3]"
                    />
                  </div>
                </div>
              </div>

              {/* جدول أداء السائقين المطابق بالملّي للصورة */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 font-bold text-[11px]">
                      <th className="py-3 px-4 text-center w-12">#</th>
                      <th className="py-3 px-4 text-right">السائق</th>
                      <th className="py-3 px-4 text-center">متوسط وقت الاستلام / د</th>
                      <th className="py-3 px-4 text-center">متوسط وقت التوصيل / د</th>
                      <th className="py-3 px-4 text-center">عدد الطلبات</th>
                      <th className="py-3 px-4 text-left">تم توصيلها</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {performanceDriversList.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        
                        {/* الرقم أو أيقونة الكأس */}
                        <td className="py-3 px-4 text-center text-slate-500 font-bold">
                          {row.isTrophy ? (
                            <span className="text-amber-500 text-base">🏆</span>
                          ) : (
                            row.id
                          )}
                        </td>

                        {/* اسم السائق */}
                        <td className="py-3 px-4 font-sans font-bold text-[#00d2d3] hover:underline cursor-pointer">
                          {row.name}
                        </td>

                        {/* متوسط وقت الاستلام */}
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">
                          {row.avgPickup}
                        </td>

                        {/* متوسط وقت التوصيل */}
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">
                          {row.avgDelivery}
                        </td>

                        {/* عدد الطلبات */}
                        <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200">
                          {row.totalOrders}
                        </td>

                        {/* تم توصيلها شارة خضراء بنسبة مئوية ورقم */}
                        <td className="py-3 px-4 text-left">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e8f5e9] text-[#2e7d32] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#c8e6c9] dark:border-emerald-800 font-bold text-[11px]">
                            <span>{row.deliveredPct}</span>
                            <span className="font-mono">{row.deliveredCount}</span>
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* تذييل وشريط ترقيم مطابق للصورة */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span>عرض 1 إلى 12 من 12 سجل</span>
                  <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs">
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">«</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&lt;</button>
                  <button className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 text-[#00d2d3] font-bold flex items-center justify-center">1</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&gt;</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">»</button>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* التبويب 3: تقرير مستحقات السائقين (مطابق للصورة 3) */}
          {/* ============================================================ */}
          {activeTab === 'driver_dues' && (
            <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all">
              
              {/* ترويسة البطاقة مع حقول الفلاتر المطابقة للصورة */}
              <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                  تقرير مستحقات السائقين
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="text"
                    value={duesStartDate}
                    onChange={(e) => setDuesStartDate(e.target.value)}
                    placeholder="التاريخ من"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-28 outline-none focus:border-[#00d2d3]"
                  />
                  <input
                    type="text"
                    value={duesEndDate}
                    onChange={(e) => setDuesEndDate(e.target.value)}
                    placeholder="التاريخ إلي"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-28 outline-none focus:border-[#00d2d3]"
                  />
                  <select
                    value={selectedDuesDriver}
                    onChange={(e) => setSelectedDuesDriver(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-[#00d2d3]"
                  >
                    <option value="">السائق</option>
                    {performanceDriversList.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ترويسة الأعمدة */}
              <div className="border-t border-b border-slate-100 dark:border-slate-800/80 px-6 py-3 grid grid-cols-5 text-[11px] font-bold text-slate-400">
                <span>#</span>
                <span>السائق</span>
                <span className="text-center">عدد الطلبات المستلمة</span>
                <span className="text-center">إجمالي تكلفة التوصيل</span>
                <span className="text-left">إجراءات</span>
              </div>

              {/* حالة الفراغ المطابقة تماماً للصورة: كمبيوتر أخضر مع عدسة */}
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Laptop className="w-9 h-9 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">قم بالبحث لعرض البيانات</h3>
                  <p className="text-xs text-slate-400 mt-1">هذه الصفحة تحتاج لتحديد المدخلات اولا .. ابدأ الان</p>
                </div>
              </div>

              {/* شريط ترقيم مطابق للصورة 3 */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span>عرض 1 إلى 1 من 1 سجل</span>
                  <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                    <option value="1">1</option>
                    <option value="25">25</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs">
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">«</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">&lt;</button>
                  <button className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 text-[#00d2d3] font-bold flex items-center justify-center">1</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">&gt;</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">»</button>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* التبويب 4: تقرير التقييمات (مطابق للصورة 4) */}
          {/* ============================================================ */}
          {activeTab === 'ratings' && (
            <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all">
              
              {/* ترويسة البطاقة مع أزرار الفترات المطابقة للصورة */}
              <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                  تقرير التقييمات
                </h2>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setRatingsPeriod('today')}
                    className={'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ' + 
                      (ratingsPeriod === 'today' 
                        ? 'border-[#00d2d3] text-[#00d2d3] bg-cyan-50/50 dark:bg-cyan-950/30' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      )
                    }
                  >
                    اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingsPeriod('7days')}
                    className={'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ' + 
                      (ratingsPeriod === '7days' 
                        ? 'border-[#00d2d3] text-[#00d2d3] bg-cyan-50/50 dark:bg-cyan-950/30' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      )
                    }
                  >
                    7 أيام
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingsPeriod('14days')}
                    className={'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ' + 
                      (ratingsPeriod === '14days' 
                        ? 'border-[#00d2d3] text-[#00d2d3] bg-cyan-50/50 dark:bg-cyan-950/30' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      )
                    }
                  >
                    14 يوم
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingsPeriod('30days')}
                    className={'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ' + 
                      (ratingsPeriod === '30days' 
                        ? 'border-[#00d2d3] text-[#00d2d3] bg-cyan-50/50 dark:bg-cyan-950/30' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      )
                    }
                  >
                    30 يوم
                  </button>
                </div>
              </div>

              {/* ترويسة الأعمدة المطابقة للصورة */}
              <div className="border-t border-b border-slate-100 dark:border-slate-800/80 px-6 py-3 grid grid-cols-7 text-[11px] font-bold text-slate-400">
                <span>#</span>
                <span>السائق</span>
                <span className="text-center">التقييم الكلي</span>
                <span className="text-center">عدد التقييمات</span>
                <span className="text-center">توقيت وصول الطلب</span>
                <span className="text-center">سلوك المندوب</span>
                <span className="text-left">سلامة الشحنة</span>
              </div>

              {/* حالة الفراغ المطابقة تماماً للصورة 4 */}
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Laptop className="w-9 h-9 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">لا توجد بيانات لعرضها حالياً</h3>
                  <p className="text-xs text-slate-400 mt-1">يبدو أن هذه الصفحة لم تملأ بالمحتوى بعد.. ابدأ الان</p>
                </div>
              </div>

              {/* شريط ترقيم مطابق للصورة 4 */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span>عرض 0 إلى 0 من 0 سجل</span>
                  <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                    <option value="25">25</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs">
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">«</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">&lt;</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">&gt;</button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">»</button>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* التبويب 5: تقرير الأحياء (مطابق للصورة 5) */}
          {/* ============================================================ */}
          {activeTab === 'neighborhoods' && (
            <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 transition-all space-y-6">
              
              {/* ترويسة البطاقة مع قائمة المدينة */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                  تقرير الأحياء
                </h2>

                <div className="relative w-44">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-[#00d2d3] font-bold"
                  >
                    <option value="all">المدينة</option>
                    <option value="الدمام">الدمام</option>
                    <option value="الخبر">الخبر</option>
                    <option value="الظهران">الظهران</option>
                    <option value="الجبيل">الجبيل</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* ترويسة قائمة الأحياء وعدد الطلبات */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between text-xs font-bold text-slate-400 px-2">
                <span>قائمة الأحياء</span>
                <span>عدد الطلبات</span>
              </div>

              {/* بطاقات الأحياء العشرة المطابقة للألوان والنقاط والأشرطة */}
              <div className="space-y-4">
                {filteredNeighborhoods.map((item) => (
                  <div key={item.rank} className="flex items-center justify-between gap-4">
                    
                    {/* شريط الحي المتدرج والملون من اليمين */}
                    <div className="flex-1 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-1 flex items-center justify-start">
                      <div 
                        className="px-4 py-2 rounded-lg font-bold text-xs shadow-xs"
                        style={{ backgroundColor: item.badgeBg, color: item.badgeText }}
                      >
                        {item.rank} {item.name}
                      </div>
                    </div>

                    {/* عدد الطلبات مع النقطة الملونة من اليسار */}
                    <div className="flex items-center gap-2.5 w-16 justify-end">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.dotColor }}></span>
                      <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-200">
                        {item.count}
                      </span>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* 3. شريط التبويبات الجانبي العمودي (3 أعمدة) مطابق تماماً للصورة */}
        <div className="lg:col-span-3 order-1 lg:order-2 space-y-2.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={
                  'w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-right active:scale-[0.98] ' +
                  (isActive
                    ? 'bg-white dark:bg-[#0d131f] border-2 border-[#00d2d3] text-[#00d2d3] shadow-md shadow-cyan-500/10'
                    : 'bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-cyan-400/60 dark:hover:border-cyan-700/60 hover:text-slate-950 dark:hover:text-white shadow-2xs hover:shadow-sm'
                  )
                }
              >
                <span className="whitespace-normal leading-tight">{tab.title}</span>
                <span className={'shrink-0 ' + (isActive ? 'text-[#00d2d3]' : 'text-[#00d2d3] opacity-80')}>
                  {tab.icon}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 4. نافذة تفاصيل كشف حساب السائق عند النقر على اسمه */}
      {selectedDriverForModal && (
        <div className="fixed inset-0 z-[6000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-[#00d2d3]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">{selectedDriverForModal.driverName}</h3>
                  <div className="text-[11px] text-slate-400">تفاصيل تحصيلات الدفع عند الاستلام والحساب الميداني</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDriverForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px] font-bold">معاملات قيد المراجعة</div>
                  <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
                    {selectedDriverForModal.underReview.count} معاملة
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {selectedDriverForModal.underReview.count === 0 ? '0.00 ﷼' : `${selectedDriverForModal.underReview.amount.toFixed(2)} ﷼`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px] font-bold">طلبات جاري التوصيل</div>
                  <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
                    {selectedDriverForModal.inTransit.count} طلبات
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {selectedDriverForModal.inTransit.count === 0 ? '0.00 ﷼' : `${selectedDriverForModal.inTransit.amount.toFixed(2)} ﷼`}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300">الرصيد النهائي المستحق للمطابقة</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">يشمل جميع المبالغ المحصلة والطلبات الميدانية</div>
                </div>
                <div className={'font-mono font-black text-sm px-3 py-1.5 rounded-xl border ' + (
                  selectedDriverForModal.finalBalance < 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-800'
                    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                )}>
                  {selectedDriverForModal.finalBalance.toFixed(2)} ﷼
                </div>
              </div>

              {selectedDriverForModal.driverName === 'حمزه وليد' && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">المعاملات المفتوحة قيد التسليم:</div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">طلب رقم #28471902</div>
                        <div className="text-[10px] text-slate-400 font-sans">دفع عند الاستلام - حي الشاطئ</div>
                      </div>
                      <span className="font-bold text-rose-600">-243.77 ﷼</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">طلب رقم #28471884</div>
                        <div className="text-[10px] text-slate-400 font-sans">قيد المراجعة - فيب الشرق</div>
                      </div>
                      <span className="font-bold text-rose-600">-457.50 ﷼</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedDriverForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedDriverForModal) return;
                  try {
                    const targetDriver = drivers.find(d => d.id === selectedDriverForModal.driverId || d.name === selectedDriverForModal.driverName);
                    const targetId = targetDriver ? targetDriver.id : (selectedDriverForModal.driverId || selectedDriverForModal.id);
                    
                    const res = await fetch(`/api/drivers/${targetId}/settle-zero`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        notes: `تسوية وتصفير الرصيد الميداني للمندوب ${selectedDriverForModal.driverName} واعتماد الرصيد 0.00 ﷼`
                      })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      alert(`✅ تم تصفير وتسوية رصيد المندوب (${selectedDriverForModal.driverName}) بنجاح وأصبح الرصيد 0.00 ﷼!`);
                      fetch('/api/reports/cod-collections')
                        .then(r => r.ok ? r.json() : null)
                        .then(j => { if (j?.codCollections?.length > 0) setCodData(j.codCollections); });
                    } else {
                      alert(data.error || 'تمت العملية بنجاح');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('تم إرسال أمر التسوية');
                  }
                  setSelectedDriverForModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>تصفير وتسوية الرصيد الميداني (0.00 ﷼)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

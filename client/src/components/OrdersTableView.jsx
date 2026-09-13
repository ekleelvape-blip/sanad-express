import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Search, Plus, Eye, UserPlus, Printer, MoreVertical, CheckCircle2, RotateCcw, 
  XCircle, Bell, ArrowLeft, Filter, X, MapPin, DollarSign, User, Phone, 
  Store, CreditCard, Banknote, ShieldCheck, Check, Sparkles, Edit3, ShoppingBag 
} from 'lucide-react';
import OrderDetailsModal from './OrderDetailsModal';
import WaybillModal from './WaybillModal';
import { OFFICIAL_CITIES, FIXED_DELIVERY_RATES, getDeliveryFeeByAddress } from '../utils/geo';

export default function OrdersTableView({ activeTab, onSelectTab, orders = [], drivers = [], branches = [], selectedBranch = "all", onAssignOrder, onCreateOrder, onRefresh, currentUser = null }) {
  // ضبط الفلتر الافتراضي بناءً على التبويب المفتوح من القائمة الجانبية
  const getInitialFilter = () => {
    if (activeTab === 'delivery_ready') return 'unassigned';
    if (activeTab === 'delivery_assigned') return 'assigned';
    if (activeTab === 'delivery_intransit') return 'in_transit';
    if (activeTab === 'delivery_delivered') return 'delivered';
    if (activeTab === 'cancelled') return 'cancelled';
    return 'all';
  };

  const [statusFilter, setStatusFilter] = useState(getInitialFilter());
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedWaybillOrder, setSelectedWaybillOrder] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // حساب رقم الطلب المتسلسل التالي بدقة للعرض المباشر
  const nextSequentialOrderNumber = useMemo(() => {
    let maxSeq = 1000;
    for (const o of orders) {
      const num = parseInt(String(o?.orderNumber || o?.id || '').replace(/\D/g, ''), 10);
      if (!isNaN(num) && num < 200000 && num > maxSeq) {
        maxSeq = num;
      }
    }
    return maxSeq + 1;
  }, [orders]);


  // عند تغير التبويب من القائمة الجانبية يتحدث الفلتر فوراً لتخصيص كل تصنيف بنفسه
  useEffect(() => {
    setStatusFilter(getInitialFilter());
  }, [activeTab]);

  const [newOrderData, setNewOrderData] = useState({
    customerName: '',
    customerPhone: '',
    city: 'الدمام',
    deliveryFee: 25,
    customerAddress: '',
    neighborhood: '',
    totalAmount: '',
    paymentMethod: 'cash',
    branchId: currentUser?.role === 'branch' ? currentUser.branchId : (selectedBranch !== 'all' ? selectedBranch : (branches?.[0]?.id || 'branch-iklil-dammam')),
    assignedDriverId: '',
    notes: '',
    orderSource: 'يدوي'
  });

  // تصفية الطلبات: كل تصنيف يخص نفسه بدقة 100%
  const filteredOrders = orders.filter(o => {
    const matchBranch = selectedBranch === 'all' || o.branchId === selectedBranch;
    const isManualOrder = o.orderSource?.includes('يدوي') || (!o.sallaOrderNumber && o.orderSource !== 'سلة (Salla)');
    const matchSource = sourceFilter === 'all' || (sourceFilter === 'manual' && isManualOrder) || (sourceFilter === 'salla' && !isManualOrder);

    let matchStatus = true;
    if (statusFilter === 'unassigned') matchStatus = o.status === 'unassigned';
    else if (statusFilter === 'assigned') matchStatus = o.status === 'assigned';
    else if (statusFilter === 'in_transit') matchStatus = o.status === 'in_transit' || o.status === 'picked_up';
    else if (statusFilter === 'delivered') matchStatus = o.status === 'delivered';
    else if (statusFilter === 'returned') matchStatus = o.status === 'returned';
    else if (statusFilter === 'cancelled') matchStatus = o.status === 'cancelled' || o.status === 'returned';

    let matchSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const safeId = String(o?.id || '');
      const tid = (safeId.startsWith('SND-') ? safeId : ('SND-' + (safeId.replace(/\D/g, '') || '1001'))).toLowerCase();
      matchSearch = tid.includes(q) || (o?.customerName && String(o.customerName).toLowerCase().includes(q)) || (o?.customerPhone && String(o.customerPhone).includes(q));
    }

    return matchBranch && matchStatus && matchSearch && matchSource;
  });

  // إحصائيات التبويبات
  const countAll = orders.filter(o => selectedBranch === 'all' || o.branchId === selectedBranch).length;
  const countUnassigned = orders.filter(o => (selectedBranch === 'all' || o.branchId === selectedBranch) && o.status === 'unassigned').length;
  const countAssigned = orders.filter(o => (selectedBranch === 'all' || o.branchId === selectedBranch) && o.status === 'assigned').length;
  const countInTransit = orders.filter(o => (selectedBranch === 'all' || o.branchId === selectedBranch) && ['in_transit', 'picked_up'].includes(o.status)).length;
  const countDelivered = orders.filter(o => (selectedBranch === 'all' || o.branchId === selectedBranch) && o.status === 'delivered').length;
  const countCancelled = orders.filter(o => (selectedBranch === 'all' || o.branchId === selectedBranch) && ['cancelled', 'returned'].includes(o.status)).length;

  // عنوان الشاشة بناءً على التصنيف النشط
  const getCategoryTitle = () => {
    if (statusFilter === 'unassigned') return { title: 'طلبات جاهزة للتوصيل', sub: 'الشحنات المجهزة بالمستودع وبانتظار إسنادها لمناديب الميدان' };
    if (statusFilter === 'assigned') return { title: 'طلبات مسندة للمناديب', sub: 'الشحنات المسندة بانتظار استلام المندوب وانطلاقه' };
    if (statusFilter === 'in_transit') return { title: 'طلبات جاري التوصيل بالميدان', sub: 'الشحنات قيد النقل مع المناديب حالياً وبث التتبع المباشر' };
    if (statusFilter === 'delivered') return { title: 'طلبات تم توصيلها بنجاح', sub: 'سجل الشحنات المسلمة مع مبالغ الكاش وشبكة مدى' };
    if (statusFilter === 'cancelled') return { title: 'طلبات ملغاة ومسترجعة', sub: 'سجل الشحنات التي تم إلغاؤها أو إعادتها لعهدة المستودع' };
    return { title: 'كل الطلبات', sub: 'سَنَد التاجر — بوابة إدارة التوصيل والتحكم بالشحنات' };
  };

  const pageMeta = getCategoryTitle();

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newOrderData.customerName.trim() || !newOrderData.customerPhone.trim() || !newOrderData.totalAmount) {
      alert('يرجى تعبئة الحقول الإجبارية (اسم العميل، رقم الجوال، المبلغ الإجمالي)');
      return;
    }

    try {
      setIsSubmitting(true);
      const cityName = newOrderData.city || 'الدمام';
      const fee = Number(newOrderData.deliveryFee || FIXED_DELIVERY_RATES[cityName] || 25);
      const fullAddress = [cityName, newOrderData.neighborhood.trim(), newOrderData.customerAddress.trim()].filter(Boolean).join(' - ') || 'عنوان العميل';
      
      const payload = {
        orderNumber: String(nextSequentialOrderNumber),
        branchId: newOrderData.branchId || (branches?.[0]?.id || 'branch-iklil-dammam'),
        customerName: newOrderData.customerName.trim(),
        customerPhone: newOrderData.customerPhone.trim(),
        customerAddress: fullAddress,
        deliveryFee: fee,
        totalAmount: Number(newOrderData.totalAmount),
        paymentMethod: newOrderData.paymentMethod || 'cash',
        assignedDriverId: newOrderData.assignedDriverId || null,
        driverCommission: 20,
        notes: (newOrderData.notes || '').trim(),
        orderSource: newOrderData.orderSource === 'سلة' ? 'سلة (Salla)' : 'يدوي (Manual)',
        items: [{ name: 'شحنة منتجات سَنَد', qty: 1, price: Number(newOrderData.totalAmount) }]
      };

      if (onCreateOrder) {
        await onCreateOrder(payload);
      }

      setCreateSuccessMsg('🎉 تم إنشاء الطلب بنجاح في نظام سَنَد!');
      setTimeout(() => {
        setCreateSuccessMsg('');
        setShowAddModal(false);
        setNewOrderData({
          customerName: '',
          customerPhone: '',
          city: 'الدمام',
          deliveryFee: 25,
          customerAddress: '',
          neighborhood: '',
          totalAmount: '',
          paymentMethod: 'cash',
          branchId: currentUser?.role === 'branch' ? currentUser.branchId : (selectedBranch !== 'all' ? selectedBranch : (branches?.[0]?.id || 'branch-iklil-dammam')),
          assignedDriverId: '',
          notes: ''
        });
        if (onRefresh) onRefresh();
      }, 800);
    } catch (err) {
      console.error('Error creating order:', err);
      alert('حدث خطأ أثناء حفظ الطلب: ' + (err.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d1fae5] text-[#065f46]"><span className="text-[10px]">●</span> تم التوصيل</span>;
      case 'in_transit':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ffedd5] text-[#c2410c]"><span className="text-[10px]">●</span> جاري التوصيل</span>;
      case 'assigned':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ede9fe] text-[#5b21b6]"><span className="text-[10px]">●</span> مسندة</span>;
      case 'returned':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e]"><span className="text-[10px]">●</span> مسترجعة</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f1f5f9] text-[#475569]"><span className="text-[10px]">●</span> ملغي</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#991b1b]"><span className="text-[10px]">●</span> غير مسندة</span>;
    }
  };

  const formatRowDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      const mon = months[d.getMonth()];
      const year = d.getFullYear();
      return `${mon} ${year} ${day}`;
    } catch {
      return 'Sept 2026 01';
    }
  };

  return (
    <div className="space-y-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
      {/* الترويسة العلوية */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">{pageMeta.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold font-mono">
              {filteredOrders.length} طلب
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{pageMeta.sub}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>متصل بقاعدة البيانات</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300">
            <span>التاجر</span>
          </div>
        </div>
      </div>

      {/* بطاقة الجدول الرئيسية */}
      <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden text-slate-100">
        <div className="p-5 border-b border-cyan-900/30 space-y-4 bg-[#0a0e18]/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">إدارة وفرز الطلبات</h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم الطلب أو العميل..."
                  className="w-full bg-[#090d16] border border-cyan-900/50 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(0,210,211,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء طلب يدوي</span>
              </button>
            </div>
          </div>

          {/* أزرار الفلترة لتحديد كل تصنيف بنفسه */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-[#065f46] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              الكل {countAll}
            </button>
            <button
              onClick={() => setStatusFilter('unassigned')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${statusFilter === 'unassigned' ? 'bg-[#065f46] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              جاهزة للتوصيل {countUnassigned}
            </button>
            <button
              onClick={() => setStatusFilter('assigned')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${statusFilter === 'assigned' ? 'bg-[#065f46] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              مسندة {countAssigned}
            </button>
            <button
              onClick={() => setStatusFilter('in_transit')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${statusFilter === 'in_transit' ? 'bg-[#065f46] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              جاري التوصيل {countInTransit}
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${statusFilter === 'delivered' ? 'bg-[#065f46] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              تم التوصيل {countDelivered}
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${statusFilter === 'cancelled' ? 'bg-[#065f46] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ملغاة ومسترجعة {countCancelled}
            </button>
          </div>
        </div>

        {/* جدول الطلبات */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 font-bold text-[11px]">
                <th className="py-3.5 px-4">الطلب</th>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4">الحي</th>
                <th className="py-3.5 px-4">ر.س</th>
                <th className="py-3.5 px-4">المندوب</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    لا توجد طلبات في هذا التصنيف حالياً
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const assignedDriver = drivers.find(d => d.id === order.assignedDriverId);
                  const safeOrderId = String(order?.id || '');
                  const trackingId = safeOrderId.startsWith('SND-') ? safeOrderId : ('SND-' + (safeOrderId.replace(/\D/g, '') || '1001'));
                  const neighborhood = order.customerAddress ? order.customerAddress.split('-')[0].trim() : '—';

                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrderForDetails(order)}
                      className="hover:bg-cyan-950/40 hover:shadow-inner transition-all group cursor-pointer"
                      title="انقر لعرض تفاصيل الطلب والإجراءات السريعة"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedOrderForDetails(order); }}
                            className="font-mono font-bold text-slate-100 hover:text-cyan-400 hover:underline cursor-pointer text-xs text-right block"
                            title="انقر لفتح تفاصيل الطلب"
                          >
                            {trackingId}
                          </button>
                          {order.orderSource?.includes('يدوي') || (!order.sallaOrderNumber && order.orderSource !== 'سلة (Salla)') ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-purple-950/90 text-purple-300 border border-purple-700/80 px-1.5 py-0.5 rounded font-bold">
                              <Edit3 className="w-2.5 h-2.5 text-purple-400" />
                              يدوي
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 px-1.5 py-0.5 rounded font-bold">
                              <ShoppingBag className="w-2.5 h-2.5 text-cyan-400" />
                              سلة
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100">{order.customerName}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">{order.customerPhone}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {neighborhood || 'المنار'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        {order.totalAmount ? Number(order.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {assignedDriver ? (
                          <span className="text-slate-800 font-bold">{assignedDriver.name}</span>
                        ) : (
                          <span className="text-slate-400">غير مسند</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusPill(order.status)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {formatRowDate(order.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetails(order)}
                            className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="عرض تفاصيل الطلب وتعديل الإسناد"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetails(order)}
                            className="p-1.5 hover:bg-slate-100 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="إسناد المندوب"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedWaybillOrder(order)}
                            className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="طباعة البوليصة الحرارية 4×6"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetails(order)}
                            className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="المزيد من الإجراءات"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          drivers={drivers}
          branches={branches}
          onClose={() => setSelectedOrderForDetails(null)}
          onRefresh={onRefresh}
        />
      )}

      {selectedWaybillOrder && (
        <WaybillModal
          order={selectedWaybillOrder}
          branch={branches.find(b => b.id === selectedWaybillOrder.branchId)}
          driver={drivers.find(d => d.id === selectedWaybillOrder.assignedDriverId)}
          onClose={() => setSelectedWaybillOrder(null)}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[3600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
          <div className="bg-[#0b101b] border-2 border-cyan-500/40 rounded-3xl w-full max-w-xl p-6 shadow-[0_0_50px_rgba(0,210,211,0.25)] space-y-4 text-right text-slate-100 max-h-[92vh] overflow-y-auto" dir="rtl">
            
            {/* ترويسة نافذة إنشاء الطلب */}
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[#00d2d3] shadow-[0_0_15px_rgba(0,210,211,0.3)] shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <span>إنشاء طلب يدوي جديد</span>
                    <span className="text-[10px] bg-cyan-950 text-[#00d2d3] border border-cyan-800/80 px-2.5 py-0.5 rounded-full font-bold">سَنَد</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">إضافة شحنة جديدة وتوجيهها للمستودع أو إسنادها فوراً للمندوب</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* رسالة النجاح عند الحفظ */}
            {createSuccessMsg && (
              <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{createSuccessMsg}</span>
              </div>
            )}

            {/* استمارة البيانات */}
            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">

            {/* بطاقة رقم الطلب والشحنة المتسلسل القادم */}
            <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border-2 border-cyan-500/60 rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,210,211,0.25)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-[#00d2d3] flex items-center justify-center font-black text-sm border border-cyan-500/30 shrink-0">
                  #
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-bold">رقم الطلب المتسلسل للشحنة:</div>
                  <div className="text-lg font-black font-mono text-[#00d2d3] tracking-wide flex items-center gap-2">
                    <span>#{nextSequentialOrderNumber}</span>
                    <span className="text-xs text-slate-400 font-normal">({ `SND-${nextSequentialOrderNumber}` })</span>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-full font-bold shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>توليد تلقائي متسلسل</span>
                </span>
              </div>
            </div>

              
              {/* 1. الفرع الصادر منه الطلب */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span>الفرع / المستودع المصدر للشحنة *:</span>
                </label>
                {currentUser?.role === 'branch' ? (
                  <div className="w-full bg-[#070b13] border border-cyan-500/50 rounded-xl p-2.5 text-xs text-cyan-200 font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#00d2d3]" />
                      <span>{currentUser.name}</span>
                    </div>
                    <span className="text-[10px] bg-cyan-950 text-[#00d2d3] border border-cyan-800 px-2 py-0.5 rounded-md font-bold">فرعك الخاص (مقفل للأمان) 🔒</span>
                  </div>
                ) : (
                  <select
                    value={newOrderData.branchId}
                    onChange={e => setNewOrderData({ ...newOrderData, branchId: e.target.value })}
                    className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3]"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                        {b.name} ({b.city} - {b.district})
                      </option>
                    ))}
                  </select>
                )}
              </div>

                            {/* اختيار مصدر الطلب: يدوي أو سلة */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span>مصدر الطلب *:</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewOrderData({ ...newOrderData, orderSource: 'يدوي' })}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      newOrderData.orderSource === 'يدوي'
                        ? 'bg-purple-950/70 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.35)] ring-1 ring-purple-500'
                        : 'bg-[#070b13] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                    <span>طلب يدوي (Manual)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewOrderData({ ...newOrderData, orderSource: 'سلة' })}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      newOrderData.orderSource === 'سلة'
                        ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(0,210,211,0.35)] ring-1 ring-cyan-500'
                        : 'bg-[#070b13] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>متجر سلة (Salla)</span>
                  </button>
                </div>
              </div>

              {/* 2. اسم العميل ورقم الجوال */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span>اسم العميل المستلم *:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderData.customerName}
                    onChange={e => setNewOrderData({ ...newOrderData, customerName: e.target.value })}
                    className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3]"
                    placeholder="مثال: عبدالرحمن القحطاني"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span>رقم جوال العميل *:</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={newOrderData.customerPhone}
                    onChange={e => setNewOrderData({ ...newOrderData, customerPhone: e.target.value })}
                    className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] font-mono text-left"
                    placeholder="05XXXXXXXX"
                  />
                </div>
              </div>

              {/* 3. اختيار المدينة المعتمدة ورسم التوصيل الثابت */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span>المدينة المعتمدة (سعر ثابت) *:</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    رسم التوصيل: {newOrderData.deliveryFee} ﷼ 🔒
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {OFFICIAL_CITIES.map(c => {
                    const isSelected = newOrderData.city === c.name || (c.id === 'safwa' && (newOrderData.city.includes('صفو') || newOrderData.city.includes('صفوي')));
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewOrderData({
                          ...newOrderData,
                          city: c.name,
                          deliveryFee: c.fee
                        })}
                        className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950 border-[#00d2d3] text-white shadow-[0_0_10px_rgba(0,210,211,0.3)]'
                            : 'bg-[#070b13] border-cyan-950/60 text-slate-400 hover:text-slate-200 hover:border-cyan-800'
                        }`}
                      >
                        <div className="text-[11px] font-black truncate">{c.name.split(' ')[0]}</div>
                        <div className="text-xs font-mono font-bold text-[#00d2d3] mt-0.5">{c.fee} ﷼</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. الحي وتفاصيل العنوان */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span>الحي / المنطقة:</span>
                  </label>
                  <input
                    type="text"
                    value={newOrderData.neighborhood}
                    onChange={e => setNewOrderData({ ...newOrderData, neighborhood: e.target.value })}
                    className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3]"
                    placeholder="حي الشاطئ / المنار / العليا"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span>تفاصيل العنوان / الشارع:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderData.customerAddress}
                    onChange={e => setNewOrderData({ ...newOrderData, customerAddress: e.target.value })}
                    className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3]"
                    placeholder="الشارع، رقم العمارة، المعلم القريب"
                  />
                </div>
              </div>

              {/* 4. المبلغ وطريقة الدفع */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>المبلغ المطلوب تحصيله (ر.س) *:</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newOrderData.totalAmount}
                    onChange={e => setNewOrderData({ ...newOrderData, totalAmount: e.target.value })}
                    className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-sm text-emerald-400 font-black placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] font-mono"
                    placeholder="150.00"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>طريقة الدفع عند الاستلام:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewOrderData({ ...newOrderData, paymentMethod: 'cash' })}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        newOrderData.paymentMethod === 'cash'
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-[#070b13] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>كاش 💵</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewOrderData({ ...newOrderData, paymentMethod: 'mada' })}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        newOrderData.paymentMethod === 'mada' || newOrderData.paymentMethod === 'network'
                          ? 'bg-cyan-950/80 border-[#00d2d3] text-[#00d2d3] shadow-[0_0_10px_rgba(0,210,211,0.2)]'
                          : 'bg-[#070b13] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>شبكة مدى 💳</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. إسناد اختياري للمندوب */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>إسناد اختياري لمندوب فوراً:</span>
                </label>
                <select
                  value={newOrderData.assignedDriverId}
                  onChange={e => setNewOrderData({ ...newOrderData, assignedDriverId: e.target.value })}
                  className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3]"
                >
                  <option value="" className="bg-slate-900 text-slate-300">بدون إسناد (جاهز للتوصيل في المستودع)</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                      {d.name} ({d.phone}) — {d.vehicle || 'مندوب ميداني'} {d.online ? '🟢 متصل' : '⚪ غير متصل'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. ملاحظات إضافية */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">ملاحظات إضافية على الطلب:</label>
                <input
                  type="text"
                  value={newOrderData.notes}
                  onChange={e => setNewOrderData({ ...newOrderData, notes: e.target.value })}
                  className="w-full bg-[#070b13] border border-cyan-900/60 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3]"
                  placeholder="مثال: يرجى الاتصال قبل التوصيل بنصف ساعة"
                />
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center justify-between pt-3 border-t border-cyan-900/40">
                <button
                  type="button"
                  onClick={() => setNewOrderData({
                    customerName: '',
                    customerPhone: '',
                    customerAddress: '',
                    neighborhood: '',
                    totalAmount: '',
                    paymentMethod: 'cash',
                    branchId: currentUser?.role === 'branch' ? currentUser.branchId : (selectedBranch !== 'all' ? selectedBranch : (branches?.[0]?.id || 'branch-iklil-dammam')),
                    assignedDriverId: '',
                    notes: ''
                  })}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  إعادة ضبط الحقول
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(0,210,211,0.35)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>جاري الحفظ...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>تأكيد وإنشاء الطلب</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
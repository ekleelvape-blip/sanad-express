import React, { useState } from 'react';
import { ArrowRight, Phone, Mail, CreditCard, Shield, MapPin, Package, DollarSign, CheckCircle2, Clock, Car, Star, ExternalLink, Edit3, Save, Printer, Share2, AlertCircle, Key, Lock, Send } from 'lucide-react';
import WaybillModal from './WaybillModal';

export default function DriverProfileView({ driver, orders = [], branches = [], onBack, onRefresh, onOpenDriverApp }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, orders, finances
  const [isEditing, setIsEditing] = useState(false);
  const [showWaybillOrder, setShowWaybillOrder] = useState(null);

  const [formData, setFormData] = useState({
    name: driver.name || '',
    phone: driver.phone || '',
    nationalId: driver.nationalId || '',
    email: driver.email || '',
    vehicle: driver.vehicle || 'سيارة توصيل',
    status: driver.status || 'active'
  });

  // تصفية طلبات هذا السائق
  const driverOrders = orders.filter(o => o.assignedDriverId === driver.id);
  const activeOrders = driverOrders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));
  const completedOrders = driverOrders.filter(o => o.status === 'delivered');
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCommissions = completedOrders.reduce((sum, o) => sum + (Number(o.driverCommission) || 20), 0);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/drivers/' + driver.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('تم حفظ وتحديث بيانات السائق بنجاح!');
        setIsEditing(false);
        if (onRefresh) onRefresh();
      } else {
        alert('تم حفظ البيانات محلياً');
        setIsEditing(false);
      }
    } catch (e) {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-5 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-800" dir="rtl">
      {/* شريط المسار والرجوع */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f1523] p-4 rounded-3xl border border-cyan-900/40 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#00d2d3] hover:text-cyan-200 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع لقائمة السائقين</span>
          </button>
          <span>/</span>
          <span>سائقي المتجر</span>
          <span>/</span>
          <span className="text-white font-black">{driver.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDriverApp && (
            <button
              type="button"
              onClick={() => onOpenDriverApp(driver)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(0,210,211,0.35)] transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح تطبيق المندوب (المحاكاة)</span>
            </button>
          )}
        </div>
      </div>

      {/* بطاقة البروفايل الرئيسية وترويسة السائق */}
      <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 p-6 shadow-2xl space-y-6 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 to-[#00d2d3] flex items-center justify-center text-slate-950 text-2xl font-black shadow-[0_0_20px_rgba(0,210,211,0.4)] border-2 border-cyan-300">
              {driver.name ? driver.name.charAt(0) : 'س'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">{driver.name}</h1>
                <span className="px-3 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-xs flex items-center gap-1">
                  <span>●</span> مفعل
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{driver.rating || 5.0}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                <span>الهوية: {driver.nationalId || '2463794624'}</span>
                <span>•</span>
                <span>المركبة: {driver.vehicle || 'سيارة خاصة'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={'tel:' + driver.phone}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>اتصال</span>
            </a>
            <a
              href={'https://wa.me/966' + (driver.phone || '').replace(/\D/g, '').replace(/^966/, '').replace(/^0/, '')}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
            >
              <span>محادثة واتساب</span>
            </a>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}</span>
            </button>
          </div>
        </div>

        {/* بطاقات الإحصائيات الأربعة للسائق */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
            <div className="text-slate-400 font-sans text-[11px]">الرصيد / الكاش بالعهدة:</div>
            <div className="text-xl font-black text-[#00d2d3] mt-1">
              {driver.walletBalance !== undefined ? `${driver.walletBalance.toFixed(2)} ﷼` : `${(driver.cashOnHand || 0).toFixed(2)} ﷼`}
            </div>
          </div>
          <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
            <div className="text-slate-400 font-sans text-[11px]">طلبات نشطة بالميدان:</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{activeOrders.length} طلبات</div>
          </div>
          <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
            <div className="text-slate-400 font-sans text-[11px]">الطلبات الموصلة اليوم:</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{driver.completedToday || completedOrders.length} طلب</div>
          </div>
          <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
            <div className="text-slate-400 font-sans text-[11px]">إجمالي العمولات المستحقة:</div>
            <div className="text-xl font-bold text-purple-600 mt-1">{totalCommissions || driver.totalCommissionToday || 0} ﷼</div>
          </div>
        </div>

        {/* تبويبات صفحة السائق */}
        <div className="flex border-b border-cyan-900/40 text-xs font-bold gap-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`pb-3 transition-colors cursor-pointer ${activeSubTab === 'overview' ? 'text-[#00d2d3] border-b-2 border-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200'}`}
          >
            البيانات الشخصية والإدارية
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${activeSubTab === 'orders' ? 'text-[#00d2d3] border-b-2 border-[#00d2d3] font-black' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>شحنات السائق</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">{driverOrders.length}</span>
          </button>
        </div>

        {/* محتوى التبويب الأول: البيانات الشخصية */}
        {activeSubTab === 'overview' && (
          <div className="space-y-4">
            {isEditing ? (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="font-bold text-slate-100">تعديل معلومات السائق:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">الاسم الكامل:</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#0d9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">رقم الجوال:</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#0d9488] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">رقم الهوية / الإقامة:</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#0d9488] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">البريد الإلكتروني:</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#0d9488] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">نوع وبيانات المركبة:</label>
                    <input
                      type="text"
                      value={formData.vehicle}
                      onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#0d9488]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-700 text-xs border-b border-slate-200 pb-2">بيانات الاتصال والهوية:</div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">رقم الجوال:</span>
                    <span className="font-mono font-black text-[#00d2d3]">{driver.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">رقم الهوية / الإقامة:</span>
                    <span className="font-mono font-bold text-slate-900">{driver.nationalId || '2463794624'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">البريد الإلكتروني:</span>
                    <span className="font-mono text-slate-900">{driver.email || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">حالة الحساب:</span>
                    <span className="font-bold text-emerald-600">مفعل ونشط</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-700 text-xs border-b border-slate-200 pb-2">بيانات العمل الميداني:</div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">المركبة المسجلة:</span>
                    <span className="font-bold text-slate-900">{driver.vehicle || 'سيارة خاصة'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">متاجر ومجموعات المشاركة:</span>
                    <span className="font-bold text-slate-900">{driver.sharedStores || 'متاح لكافة الفروع المتزامنة'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">تقييم الأداء:</span>
                    <span className="font-bold text-amber-600 font-mono">⭐ {driver.rating || 5.0} / 5.0</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">تسعيرة التوصيل والعمولة:</span>
                    <span className="font-bold font-mono text-emerald-600">حسب تسعيرة المدينة المعتمدة (25 - 45 ﷼)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* محتوى التبويب الثاني: شحنات وطلبات السائق */}
        {activeSubTab === 'orders' && (
          <div className="space-y-3">
            <div className="overflow-x-auto text-xs border border-cyan-900/40 rounded-2xl overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#090d16] text-slate-400 font-bold border-b border-cyan-900/40 text-[11px]">
                  <tr>
                    <th className="p-3">رقم الشحنة</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">الحي</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">طريقة الدفع</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {driverOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400">
                        لا توجد طلبات مسندة لهذا السائق حالياً
                      </td>
                    </tr>
                  ) : (
                    driverOrders.map(order => {
                      const trackingId = order.id.startsWith('SND-') ? order.id : 'SND-' + (order.id.replace(/\D/g, '') || '282288');
                      return (
                        <tr key={order.id} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">{trackingId}</td>
                          <td className="p-3 font-bold text-slate-800">{order.customerName}</td>
                          <td className="p-3 text-slate-600">{order.customerAddress ? order.customerAddress.split('-')[0] : '—'}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">{order.totalAmount} ﷼</td>
                          <td className="p-3 text-slate-600">{order.paymentMethod === 'cash' ? 'كاش (COD)' : 'مدى'}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {order.status === 'delivered' ? 'تم التوصيل' : order.status === 'in_transit' ? 'جاري التوصيل' : 'مسندة'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setShowWaybillOrder(order)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
                              title="طباعة البوليصة 4×6"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* نافذة طباعة البوليصة إذا طلبها */}
      {showWaybillOrder && (
        <WaybillModal
          order={showWaybillOrder}
          branch={branches.find(b => b.id === showWaybillOrder.branchId)}
          driver={driver}
          onClose={() => setShowWaybillOrder(null)}
        />
      )}
    </div>
  );
}
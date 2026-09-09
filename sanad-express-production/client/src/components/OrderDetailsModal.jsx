import React, { useState } from 'react';
import { X, UserCheck, RotateCcw, XCircle, Printer, Phone, MessageSquare, MapPin, Package, DollarSign, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import WaybillModal from './WaybillModal';
import { sound } from '../utils/sound';

export default function OrderDetailsModal({ order, drivers, branches, onClose, onRefresh }) {
  const [selectedDriverId, setSelectedDriverId] = useState(order.assignedDriverId || '');
  const [showWaybill, setShowWaybill] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!order) return null;
  const branch = branches.find(b => b.id === order.branchId);
  const assignedDriver = drivers.find(d => d.id === order.assignedDriverId);
  const trackingId = order.id.startsWith('SND-') ? order.id : 'SND-' + (order.id.replace(/\D/g, '') || '282288');

  // 1. تعديل إسناد المندوب
  const handleAssignDriver = async () => {
    if (!selectedDriverId) return alert('يرجى اختيار المندوب أولاً');
    setLoading(true);
    try {
      const res = await fetch('/api/orders/' + order.id + '/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriverId })
      });
      if (res.ok) {
        sound.playSuccess();
        alert('تم تعديل إسناد الشحنة للمندوب بنجاح!');
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 2. استرجاع الطلب
  const handleReturnOrder = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في استرجاع هذه الشحنة وإعادتها للمستودع؟')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/' + order.id + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'returned' })
      });
      if (res.ok) {
        sound.playSuccess();
        alert('تم تحويل حالة الشحنة إلى (مسترجعة) بنجاح!');
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 3. إلغاء الطلب
  const handleCancelOrder = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب نهائياً؟')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/' + order.id + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        sound.playSuccess();
        alert('تم إلغاء الطلب بنجاح!');
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'delivered':
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5"><span>●</span> تم التوصيل</span>;
      case 'in_transit':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 animate-pulse"><span>●</span> جاري التوصيل</span>;
      case 'assigned':
        return <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1.5"><span>●</span> مسندة</span>;
      case 'returned':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5"><span>●</span> مسترجعة</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5"><span>●</span> ملغي</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold flex items-center gap-1.5"><span>●</span> غير مسندة</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[3500] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-white text-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col text-right" dir="rtl">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-base px-3 py-1 rounded-xl bg-slate-900 text-emerald-400">
              {trackingId}
            </span>
            {getStatusBadge()}
            <span className="text-xs text-slate-500 font-bold">{branch ? branch.name : ''}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="font-bold text-slate-700 text-xs border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>بيانات المستلم والتوصيل:</span>
              <span className="text-slate-400 font-normal">تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-slate-500">اسم العميل:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{order.customerName}</div>
              </div>
              <div>
                <div className="text-slate-500">رقم الجوال:</div>
                <div className="font-bold font-mono text-slate-900 text-sm mt-0.5 flex items-center gap-2">
                  <span>{order.customerPhone}</span>
                  <a href={'tel:' + order.customerPhone} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="اتصال هاتف">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={'https://wa.me/966' + order.customerPhone.replace(/^0/, '') + '?text=' + encodeURIComponent('مرحباً ' + order.customerName + '، بخصوص شحنتك رقم ' + trackingId)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    title="محادثة واتساب"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
            <div>
              <div className="text-slate-500">عنوان التوصيل:</div>
              <div className="font-bold text-slate-800 flex items-start gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{order.customerAddress}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="font-bold text-slate-700 text-xs border-b border-slate-200 pb-2">تفاصيل الأصناف والمالية:</div>
            <div className="space-y-1.5">
              {(order.items || [{ name: 'شحنة متنوعة', qty: 1, price: order.totalAmount }]).map((item, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                  <span className="font-semibold text-slate-800">{item.name} × {item.qty}</span>
                  <span className="font-mono font-bold text-slate-900">{item.price ? item.price + ' ر.س' : '—'}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-slate-500">طريقة الدفع: </span>
                <span className="text-slate-900">{order.paymentMethod === 'cash' ? '💵 دفع عند الاستلام (COD)' : '💳 شبكة مدى'}</span>
              </div>
              <div>
                <span className="text-slate-500">المبلغ الإجمالي: </span>
                <span className="font-mono text-emerald-600 text-base font-black">{order.totalAmount} ر.س</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>المندوب المسؤول عن التوصيل:</span>
              </div>
              <span className="font-bold text-slate-700">
                {assignedDriver ? `مسند حالياً إلى: ${assignedDriver.name}` : 'غير مسند لمندوب'}
              </span>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="flex-1 bg-white border border-slate-300 text-slate-800 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-bold text-xs"
              >
                <option value="">-- اختر مندوباً لإسناد الشحنة له --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.online ? '🟢 متصل' : '⚪ أوفلاين'})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssignDriver}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              >
                تعديل الإسناد
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {order.status !== 'returned' && (
              <button
                type="button"
                onClick={handleReturnOrder}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استرجاع الطلب</span>
              </button>
            )}
            {order.status !== 'cancelled' && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>إلغاء الطلب</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWaybill(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>طباعة بوليصة 4×6</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {showWaybill && (
        <WaybillModal
          order={order}
          branch={branch}
          driver={assignedDriver}
          onClose={() => setShowWaybill(false)}
        />
      )}
    </div>
  );
}
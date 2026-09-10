import React, { useState } from 'react';
import { AlertTriangle, X, RefreshCw, Undo2, Check } from 'lucide-react';

export default function DeliveryExceptionModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState('العميل لا يرد على الاتصال');
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState('reschedule');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/' + order.id + '/exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes, action })
      });
      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error reporting exception:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-['Cairo',sans-serif]">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-right" dir="rtl">
        <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>تسجيل تعثر التوصيل للشحنة ({order.id})</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">يرجى تحديد سبب عدم تمكن المندوب من تسليم الشحنة للعميل {order.customerName}</p>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">سبب تعثر التوصيل:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-amber-500 outline-none"
            >
              <option value="العميل لا يرد على الاتصال">📵 العميل لا يرد على الاتصال</option>
              <option value="طلب العميل تأجيل الاستلام لوقت لاحق">⏳ طلب العميل تأجيل الاستلام لوقت لاحق</option>
              <option value="العنوان غير واضح أو خارج النطاق">📍 العنوان غير واضح أو خارج التغطية</option>
              <option value="رفض العميل استلام الطلب / إلغاء">❌ رفض العميل استلام الطلب / إلغاء</option>
              <option value="عدم توفر المبلغ مع العميل كاش">💵 عدم توفر المبلغ مع العميل حالياً</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">الإجراء المطلوب للشحنة:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAction('reschedule')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${action === 'reschedule' ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                🔄 إعادة جدولة لاحقاً
              </button>
              <button
                type="button"
                onClick={() => setAction('return_to_hub')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${action === 'return_to_hub' ? 'bg-red-950 border-red-500 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                ↩️ إرجاع الشحنة للفرع
              </button>
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">ملاحظات توضيحية:</label>
            <input
              type="text"
              placeholder="مثال: تم الاتصال مرتين الساعة 9:30 ولم يتم الرد"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">إلغاء</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-900/40">
              {loading ? 'جاري الحفظ...' : 'تأكيد تسجيل الحالة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
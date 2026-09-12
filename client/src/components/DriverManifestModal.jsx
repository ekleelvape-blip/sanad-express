import React, { useState, useEffect } from 'react';
import { Printer, X, FileText, CheckCircle2, User, Calendar, ShieldCheck, MapPin, Download } from 'lucide-react';

export default function DriverManifestModal({ driverId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;
    fetch('/api/manifest/' + driverId)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching manifest:', err);
        setLoading(false);
      });
  }, [driverId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[3200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl">جاري استخراج بيان الشحنات (المانيفست)...</div>
      </div>
    );
  }

  if (!data || !data.orders) return null;

  const printCss = '@media print { body * { visibility: hidden !important; } #manifest-print-area, #manifest-print-area * { visibility: visible !important; } #manifest-print-area { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 10mm !important; box-sizing: border-box !important; background: white !important; color: black !important; } @page { size: A4 portrait; margin: 8mm; } }';

  return (
    <div className="fixed inset-0 z-[3200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <style>{printCss}</style>
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-slate-200 print:hidden">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>بيان تسليم شحنات المندوب الميداني (Run Sheet / Manifest)</span>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/40 transition-all cursor-pointer">
            <Printer className="w-4 h-4" />
            <span>طباعة المانيفست (A4)</span>
          </button>
        </div>
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center max-h-[85vh] overflow-y-auto">
          <div id="manifest-print-area" className="w-full bg-white text-black p-8 rounded-none shadow-2xl text-right font-['Cairo',sans-serif]" dir="rtl">
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img src="/sanad-express-logo.jpg?v=3" alt="سَنَد" style={{ width: "45px", height: "45px", borderRadius: "10px", objectFit: "cover" }} />
                <div>
                  <h1 className="text-xl font-black text-black m-0">سَنَد إكسبريس (سَنَد)</h1>
                  <p className="text-xs font-bold text-emerald-800">بيان تسليم واستلام شحنات المندوب الميداني (Run Sheet)</p>
                </div>
              </div>
              <div className="text-left font-mono text-xs text-black space-y-0.5">
                <div>رقم المانيفست: <strong className="text-sm font-bold">{data.manifestId}</strong></div>
                <div>التاريخ: {new Date(data.date).toLocaleDateString('ar-SA')} - {new Date(data.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                <div>الفرع المصدّر: <strong className="font-bold">{data.branch.name}</strong></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 border border-black p-3 mb-4 text-xs bg-slate-50 font-bold">
              <div>المندوب المكلف: <span className="font-black text-sm">{data.driver.name}</span></div>
              <div>رقم الجوال: <span className="font-mono">{data.driver.phone}</span></div>
              <div>المركبة: <span>{data.driver.vehicle}</span></div>
            </div>
            <table className="w-full text-right text-xs border-collapse border border-black mb-4">
              <thead>
                <tr className="bg-black text-white font-bold text-center">
                  <th className="border border-black p-2 w-8">م</th>
                  <th className="border border-black p-2">رقم الشحنة</th>
                  <th className="border border-black p-2">اسم العميل</th>
                  <th className="border border-black p-2">الجوال</th>
                  <th className="border border-black p-2">العنوان / المحطة</th>
                  <th className="border border-black p-2">المحتويات</th>
                  <th className="border border-black p-2 text-center">مبلغ الـ COD</th>
                  <th className="border border-black p-2 w-24">توقيع العميل</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((ord, idx) => (
                  <tr key={ord.id} className="border-b border-black text-black">
                    <td className="border border-black p-2 text-center font-bold font-mono">{idx + 1}</td>
                    <td className="border border-black p-2 font-mono font-bold">{ord.id}</td>
                    <td className="border border-black p-2 font-bold">{ord.customerName}</td>
                    <td className="border border-black p-2 font-mono">{ord.customerPhone}</td>
                    <td className="border border-black p-2 text-[11px]">{ord.customerAddress} ({ord.hub?.code})</td>
                    <td className="border border-black p-2 text-[10px]">{ord.itemsSummary || 'طلب متنوع'}</td>
                    <td className="border border-black p-2 text-center font-mono font-bold">{ord.paymentMethod === 'cash' ? ord.totalAmount + ' ر.س' : 'مدفوع (مدى)'}</td>
                    <td className="border border-black p-2 text-center text-[10px] text-slate-400">................</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-2 border-black p-3 mb-6 bg-slate-50 text-xs">
              <div className="font-bold">إجمالي عدد الشحنات بالمانيفست: <span className="text-base font-black font-mono">{data.summary.totalPackages} شحنات</span></div>
              <div className="font-bold text-emerald-900">إجمالي كاش الدفع عند الاستلام المطلوب تحصيله (COD): <span className="text-lg font-black font-mono">{data.summary.totalCODAmount} ر.س</span></div>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-black text-xs font-bold">
              <div>
                <div>إقرار مسؤول مستودع الفرع:</div>
                <p className="text-[10px] text-slate-600 font-normal mt-1">أقر بأني سلمت المندوب أعلاه الشحنات المذكورة سليمة وجاهزة للتوصيل.</p>
                <div className="mt-8 border-b border-dashed border-black w-2/3">التوقيع: </div>
              </div>
              <div className="text-left">
                <div>إقرار واستلام المندوب:</div>
                <p className="text-[10px] text-slate-600 font-normal mt-1">أقر باستلام الشحنات الموضحة بالجدول وألتزم بتسليمها وتوريد مبالغ الكاش لخزينة المتجر.</p>
                <div className="mt-8 border-b border-dashed border-black w-2/3 mr-auto">توقيع المندوب: </div>
              </div>
            </div>
            <div className="mt-6 text-center text-[9px] text-slate-500 border-t border-slate-200 pt-2 font-mono">
              سَنَد إكسبريس (سَنَد) • وثيقة رسمية معتمدة • تم الإنشاء إلكترونياً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
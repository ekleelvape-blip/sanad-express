import React, { useState } from 'react';
import { generateBarcodeSVG, generateQrSVG } from '../utils/barcode';
import { X, Printer, Check, FileText, Tag } from 'lucide-react';

export default function WaybillModal({ order, branch, onClose }) {
  const [copies, setCopies] = useState(1);
  const [paperSize, setPaperSize] = useState('thermal'); // الافتراضي: ملصق حراري 4x6 بوصة // 'a4' | 'thermal'

  if (!order) return null;

  // التحقق هل الفرع هو فيب الشرق أو أحد فروع إكليل
  const isVapeSharq = (branch?.id === 'branch-vape-sharq') || 
                      (order?.branchId === 'branch-vape-sharq') ||
                      (branch?.name && branch.name.includes('فيب الشرق'));

  // توليد كود التوزيع مثل D963 أو K922 أو J924
  const getCityPrefix = () => {
    const city = (branch?.city || order?.customerAddress || '').toLowerCase();
    if (city.includes('دمام') || city.includes('dammam')) return 'D';
    if (city.includes('خبر') || city.includes('khobar')) return 'K';
    if (city.includes('جبيل') || city.includes('jubail')) return 'J';
    return 'D';
  };

  const orderNumDigits = String(order.id || '').replace(/\D/g, '').slice(-3) || '963';
  const sortCode = getCityPrefix() + orderNumDigits;

  const cityBadgeText = () => {
    const addr = order.customerAddress || '';
    if (addr.includes('الخبر')) return 'الخبر';
    if (addr.includes('الدمام')) return 'الدمام';
    if (addr.includes('الجبيل')) return 'الجبيل';
    if (addr.includes('الظهران')) return 'الظهران';
    return branch?.city || 'الشرقية';
  };

  const formattedRecipientPhone = () => {
    const p = String(order.customerPhone || '0500000000').replace(/^0/, '');
    return '+966 ' + p;
  };

  const formattedSenderPhone = () => {
    const p = String(branch?.phone || '0501234567').replace(/^0/, '');
    return '+966 ' + p;
  };

  const codAmountText = order.paymentMethod === 'cash' ? Number(order.totalAmount || 0).toFixed(2) : '0.00';

  const now = new Date(order.createdAt || Date.now());
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestampStr = `${ampm} ${hours}:${minutes} ${year}-${month}-${day}`;

  // باركود فيكتور عالي الدقة
  const renderBarcodeBars = (height = 65, scale = 1.8) => {
    const pattern = [
      2,1,1,3,1,2,3,1,1,2,2,1,1,3,2,1,1,2,3,1,1,2,1,3,2,1,1,2,1,3,
      1,2,3,1,1,2,2,1,1,3,2,1,1,2,1,3,1,2,3,1,2,1,1,3,1,2,1,3,2,1,
      1,2,3,1,1,2,2,1,1,3,2,1,1,2,3,1,1,2,1,3,2,1,1,2,1,3,1,2,3,1,
      2,1,1,3,1,2,3,1,1,2,2,1,1,3,2,1,1,2,1,3,1,2,3,1,2,1,1,3,1,2
    ];
    let x = 10;
    return pattern.map((w, i) => {
      const bar = i % 2 === 0 ? (
        <rect key={i} x={x} y="0" width={w * scale} height={height} fill="#000000" />
      ) : null;
      x += w * scale;
      return bar;
    });
  };

  const trackingId = String(order.id || '').startsWith('SND-') ? order.id : ('SND-' + (String(order.id || '').replace(/\D/g, '') || '1001'));

  // دالة الطباعة عبر نافذة أو iframe مخصص
  const handlePrint = () => {
    const printElement = document.getElementById(paperSize === 'a4' ? 'waybill-a4-print-area' : 'thermal-print-area');
    if (!printElement) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const waybillHtml = printElement.outerHTML;
    let pagesHtml = '';
    for (let i = 0; i < copies; i++) {
      pagesHtml += `<div class="waybill-page">${waybillHtml}</div>`;
    }

    const pageSizeCss = paperSize === 'a4' 
      ? `@page { size: A4 portrait; margin: 8mm; } 
         html, body { width: 210mm; background: #fff; color: #000; margin: 0; padding: 0; }
         .waybill-page { width: 100%; page-break-after: always; display: flex; justify-content: center; }
         .waybill-page:last-child { page-break-after: auto; }
         #waybill-a4-print-area { width: 194mm !important; margin: 0 auto !important; padding: 6mm !important; box-sizing: border-box !important; }`
      : `@page { size: 4in 6in; margin: 0; } 
         html, body { width: 4in; height: 6in; background: #fff; color: #000; margin: 0; padding: 0; overflow: hidden; }
         .waybill-page { width: 4in; height: 6in; max-height: 6in; page-break-after: always; page-break-inside: avoid; display: flex; justify-content: center; align-items: center; margin: 0; padding: 0; box-sizing: border-box; }
         .waybill-page:last-child { page-break-after: auto; }
         #thermal-print-area { width: 98mm !important; max-width: 98mm !important; height: 148mm !important; max-height: 148mm !important; margin: 0 auto !important; padding: 3.5mm !important; border: 2px solid #000 !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; overflow: hidden !important; background: #fff !important; color: #000 !important; }`;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>بوليصة شحن سند - ${order.id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          ${pageSizeCss}
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]">
        
        {/* شريط الإجراءات العلوي */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" title="إغلاق">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>بوليصة الشحن الرسمية</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {paperSize === 'a4' ? 'مقاس A4 المعتمد' : 'ملصق 4×6 بوصة'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{trackingId}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* اختيار مقاس الورق (A4 أو 4x6 حراري) */}
            <div className="flex items-center bg-slate-900 border border-slate-700 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaperSize('thermal')}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg transition-all cursor-pointer ${
                  paperSize === 'thermal'
                    ? 'bg-purple-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>ملصق 4×6 بوصة (حراري) 🏷️</span>
              </button>

              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  paperSize === 'a4'
                    ? 'bg-[#00d2d3] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>مقاس A4 📄</span>
              </button>
            </div>

            {/* محدد عدد النسخ */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold">
              <span className="text-slate-400 text-[11px]">نسخ:</span>
              <button
                type="button"
                onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs"
              >
                -
              </button>
              <span className="w-4 text-center font-mono text-[#00d2d3]">{copies}</span>
              <button
                type="button"
                onClick={() => setCopies(prev => Math.min(10, prev + 1))}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
            </div>

            {/* زر الطباعة المباشر */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-[#00d2d3] hover:from-cyan-400 hover:to-cyan-300 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-cyan-900/30 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{paperSize === "thermal" ? "طباعة ملصق 4×6 بوصة" : "طباعة بوليصة A4"} {copies > 1 ? `(${copies})` : ""}</span>
            </button>
          </div>
        </div>

        {/* عرض المعاينة للبوليصة */}
        <div className="p-4 sm:p-6 bg-slate-950 flex-1 overflow-y-auto flex flex-col items-center justify-start">
          
          {paperSize === 'a4' ? (
            /* ========================================================
               1. قالب البوليصة الرسمي مقاس A4 المعتمد
               ======================================================== */
            <div 
              id="waybill-a4-print-area" 
              className="w-full max-w-[760px] bg-white text-black p-6 sm:p-8 border-2 border-black rounded-xl shadow-2xl text-right box-border select-none font-['Cairo',sans-serif]"
              dir="rtl"
            >
              {/* ترويسة البوليصة الرسمية A4 */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                  <img src="/sanad-express-logo.jpg?v=3" alt="سند SANAD" className="w-14 h-14 rounded-xl object-cover border border-black shadow-sm" />
                  <div>
                    <h1 className="font-black text-3xl text-black leading-tight tracking-tight">سند SANAD</h1>
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-black font-mono text-4xl text-black tracking-tighter">{sortCode}</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5 font-mono">{timestampStr}</div>
                  <div className="inline-block bg-black text-white text-[11px] font-bold px-3 py-0.5 rounded-full mt-1">
                    وجهة التوصيل: {cityBadgeText()}
                  </div>
                </div>
              </div>

              {/* الباركود الرمزي العريض ورقم الشحنة */}
              <div className="py-4 border-b-2 border-black flex flex-col items-center justify-center bg-slate-50/70 rounded-xl my-3 p-3">
                <div className="w-full max-w-[540px] flex items-center justify-between gap-4 bg-white p-2 border border-black rounded-xl">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(trackingId, 75, 2.2) }} />
                  </div>
                  <div className="shrink-0 p-1 border border-black rounded-lg flex flex-col items-center justify-center bg-white">
                    <div dangerouslySetInnerHTML={{ __html: generateQrSVG(trackingId, 105) }} />
                    <span className="text-[9px] font-mono font-bold mt-0.5">مسح QR</span>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full max-w-[500px] text-sm font-mono font-black mt-2 px-2 text-black">
                  <span>رقم التتبع: {trackingId}</span>
                  <span>مصدر الشحنة: {order.orderSource || 'سلة (Salla)'}</span>
                </div>
              </div>

              {/* بطاقات المرسل والمستلم جنباً إلى جنب */}
              <div className="grid grid-cols-2 gap-4 my-3 text-xs">
                {/* بيانات المرسل */}
                <div className="border-2 border-black rounded-xl p-3.5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="font-black text-sm text-black border-b border-black/40 pb-1 mb-2 flex items-center justify-between">
                      <span>بيانات المرسل (المتجر / الفرع):</span>
                      <span className="text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded">FROM</span>
                    </div>
                    <div className="space-y-1">
                      <div><strong className="text-slate-600">الفرع:</strong> <span className="font-black">{branch?.name || (isVapeSharq ? 'متجر فيب الشرق' : 'متجر إكليل فيب')}</span></div>
                      <div><strong className="text-slate-600">المدينة:</strong> {branch?.city || 'الدمام'} - {branch?.district || 'المنطقة الشرقية'}</div>
                      <div><strong className="text-slate-600">الهاتف:</strong> <span className="font-mono font-bold dir-ltr">{formattedSenderPhone()}</span></div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 pt-1 border-t border-dashed border-slate-300">
                    مستودع الشحن: {order.warehouse || 'المستودع الرئيسي'}
                  </div>
                </div>

                {/* بيانات المستلم */}
                <div className="border-2 border-black rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="font-black text-sm text-black border-b border-black/40 pb-1 mb-2 flex items-center justify-between">
                      <span>بيانات المستلم (العميل):</span>
                      <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded">TO</span>
                    </div>
                    <div className="space-y-1">
                      <div><strong className="text-slate-600">العميل:</strong> <span className="font-black text-sm">{order.customerName}</span></div>
                      <div><strong className="text-slate-600">الجوال:</strong> <span className="font-mono font-black text-sm dir-ltr">{formattedRecipientPhone()}</span></div>
                      <div><strong className="text-slate-600">العنوان:</strong> <span className="font-bold">{order.customerAddress || '—'}</span></div>
                      {order.nationalAddress && (
                        <div><strong className="text-slate-600">العنوان الوطني:</strong> <span className="font-mono font-bold">{order.nationalAddress}</span></div>
                      )}
                    </div>
                  </div>
                  {order.notes && (
                    <div className="text-[10px] text-slate-700 font-bold mt-2 pt-1 border-t border-dashed border-slate-300">
                      ملاحظة العميل: {order.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* جدول محتويات الشحنة */}
              <div className="my-3 border-2 border-black rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-black text-white font-bold">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">المنتج / محتويات الطرد</th>
                      <th className="py-2 px-3 text-center">الكمية</th>
                      <th className="py-2 px-3 text-left">السعر الإفرادي</th>
                      <th className="py-2 px-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(order.items && order.items.length > 0) ? (
                      order.items.map((it, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="py-2 px-3 font-mono font-bold text-center">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-black">{it.name}</div>
                            {it.options && <div className="text-[10px] text-slate-500 font-mono">{it.options}</div>}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold">{it.qty || 1}</td>
                          <td className="py-2 px-3 text-left font-mono font-bold">{Number(it.price || 0).toFixed(2)} ر.س</td>
                          <td className="py-2 px-3 text-left font-mono font-black">{Number((it.price || 0) * (it.qty || 1)).toFixed(2)} ر.س</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="bg-white">
                        <td className="py-2 px-3 font-mono font-bold text-center">1</td>
                        <td className="py-2 px-3 font-bold">شحنة منتجات سند اللوجستية المعتمدة</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">1</td>
                        <td className="py-2 px-3 text-left font-mono font-bold">{Number(order.totalAmount || 0).toFixed(2)} ر.س</td>
                        <td className="py-2 px-3 text-left font-mono font-black">{Number(order.totalAmount || 0).toFixed(2)} ر.س</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* الملخص المالي وصندوق التحصيل (COD) العريض */}
              <div className="grid grid-cols-2 gap-4 my-3 items-stretch text-xs">
                {/* الملخص المالي */}
                <div className="border border-black rounded-xl p-3 bg-white space-y-1.5 flex flex-col justify-between">
                  <div className="font-black text-sm text-black border-b border-black pb-1">الملخص المالي للشحنة:</div>
                  <div className="flex justify-between text-slate-600">
                    <span>قيمة المنتجات:</span>
                    <span className="font-mono font-bold">{Number(order.subtotal || (order.totalAmount ? order.totalAmount * 0.88 : 0)).toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>رسوم الشحن والتوصيل:</span>
                    <span className="font-mono font-bold">{Number(order.deliveryFee || 20).toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono font-bold">{Number(order.tax || 0).toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-black font-black pt-1 border-t border-black text-sm">
                    <span>إجمالي الشحنة:</span>
                    <span className="font-mono">{Number(order.totalAmount || 0).toFixed(2)} ر.س</span>
                  </div>
                </div>

                {/* صندوق التحصيل النقدي البارز (COD) */}
                <div className="border-2 border-black rounded-xl p-3 text-center flex flex-col justify-center bg-slate-50">
                  <div className="text-xs font-bold text-slate-700 mb-1">طريقة الدفع ومبلغ التحصيل المطلوب:</div>
                  <div className="text-sm font-bold text-black mb-1">
                    {order.paymentMethod === 'cash' ? '💵 دفع عند الاستلام (COD)' : '💳 مدفوع إلكترونياً (مسبقاً)'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-black leading-none my-1">
                    {codAmountText} <span className="text-base font-bold">ريال</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold mt-1">
                    {order.paymentMethod === 'cash' ? '⚠️ يلزم استلام المبلغ كاملاً من العميل قبل تسليم الشحنة' : '✓ تم سداد المبلغ مسبقاً، تسليم بدون تحصيل'}
                  </div>
                </div>
              </div>

              {/* التواقيع والإقرار الرسمي أسفل ورقة A4 */}
              <div className="grid grid-cols-3 gap-3 border-2 border-black rounded-xl p-3 mt-4 text-xs text-center bg-white">
                <div className="border-l border-black/40 pl-2">
                  <div className="font-black text-slate-800 mb-6">توقيع واستلام المندوب:</div>
                  <div className="border-t border-dashed border-black/60 pt-1 text-[10px] text-slate-600">
                    التاريخ: ______ / ______ / 2026
                  </div>
                </div>

                <div className="border-l border-black/40 px-2">
                  <div className="font-black text-slate-800 mb-6">توقيع واستلام العميل:</div>
                  <div className="border-t border-dashed border-black/60 pt-1 text-[10px] text-slate-600">
                    أقر باستلام الشحنة بحالة سليمة
                  </div>
                </div>

                <div className="flex flex-col justify-between items-center pr-2">
                  <div className="font-black text-slate-800">ختم سند المعتمد:</div>
                  <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-black text-[9px] text-black">
                    سند SANAD
                  </div>
                </div>
              </div>

              {/* تذييل الصفحة */}
              <div className="text-center text-[10px] text-slate-600 font-bold mt-3 pt-2 border-t border-black flex items-center justify-between">
                <span>سند SANAD</span>
                <span className="font-mono">www.sanad.sa</span>
              </div>
            </div>
          ) : (
            /* ========================================================
               2. قالب الملصق الحراري 4x6 (Thermal 100x150mm)
               ======================================================== */
            <div id="thermal-print-area" className="w-[360px] min-h-[540px] bg-white text-black p-5 border-2 border-black rounded-none shadow-2xl flex flex-col justify-between text-right box-border select-none" dir="rtl" style={{ width: '380px', minHeight: '560px' }}>
              <div>
                {/* ترويسة البوليصة: الشعار والكود D963 وشعار سند SANAD */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <img src="/sanad-express-logo.jpg?v=3" alt="سند SANAD" className="w-11 h-11 rounded-lg object-cover border border-black" />
                    <div className="text-right">
                      <div className="font-black text-xl text-black tracking-tight leading-none">سند SANAD</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="font-black font-mono text-3xl text-black tracking-tighter">{sortCode}</div>
                    {isVapeSharq ? (
                      <div className="flex items-center justify-center h-10 max-w-[125px]">
                        <img src="/logo-vape-sharq-cropped.png" alt="شعار فيب الشرق" className="h-8 w-auto object-contain filter contrast-125" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-10 w-12">
                        <img src="/logo-iklil-crown.png" alt="شعار إكليل" className="h-8 w-auto object-contain filter contrast-125" />
                      </div>
                    )}
                  </div>
                </div>

                {/* الباركود الرمزي العريض */}
                <div className="pt-3 pb-2 text-center">
                  <div className="w-full flex items-center justify-between gap-2 px-1">
                    <div className="flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(trackingId, 70, 2) }} />
                    <div className="shrink-0 border border-black p-0.5 rounded flex flex-col items-center bg-white">
                      <div dangerouslySetInnerHTML={{ __html: generateQrSVG(trackingId, 90) }} />
                      <span className="text-[8px] font-mono font-bold leading-none mt-0.5">QR</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono font-black mt-1 px-1 text-black">
                    <span>{trackingId}</span>
                    <span className="text-[11px] font-bold">{timestampStr}</span>
                  </div>
                </div>

                <div className="border-b-2 border-black my-2"></div>

                {/* جوال المستلم وشارة المدينة */}
                <div className="py-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm font-black text-black">
                      جوال المستلم : <span className="font-mono dir-ltr inline-block font-black">{formattedRecipientPhone()}</span>
                    </div>
                    <div className="bg-slate-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-md">{cityBadgeText()}</div>
                  </div>
                  <div className="text-xs font-bold text-black truncate mb-1">العميل: {order.customerName} - {order.customerAddress}</div>
                </div>

                {/* المرسل ورقم هاتف المتجر */}
                <div className="flex items-center justify-between text-xs font-bold border-t border-black pt-1.5 pb-2">
                  <div>المرسل: <span className="font-black">{branch ? branch.name : (isVapeSharq ? 'فيب الشرق' : 'متجر إكليل فيب')}</span></div>
                  <div className="font-mono font-bold dir-ltr">{formattedSenderPhone()}</div>
                </div>

                {/* شبكة عدد الكراتين والمبلغ المطلوب تحصيله (COD) */}
                <div className="grid grid-cols-2 border-2 border-black mt-1 text-center">
                  <div className="p-2 border-l-2 border-black flex flex-col justify-center">
                    <div className="text-xs font-bold text-black mb-1">عدد الكراتين</div>
                    <div className="text-3xl font-black font-mono text-black">1/1</div>
                  </div>
                  <div className="p-2 flex flex-col justify-center">
                    <div className="text-xs font-bold text-black mb-1">المبلغ المطلوب تحصيله (COD)</div>
                    <div className="text-3xl font-black font-mono text-black leading-none">{codAmountText} <span className="text-sm font-bold">ريال</span></div>
                  </div>
                </div>

                {/* منطقة كود المنطقة / التوزيع 00 / 0 */}
                <div className="border-x-2 border-b-2 border-black p-4 text-left font-mono">
                  <div className="text-4xl font-black leading-none text-black">00</div>
                  <div className="text-3xl font-black leading-none text-black mt-1">0</div>
                </div>

                <div className="pt-2 text-[10px] text-black font-semibold">
                  محتويات الشحنة: {order.items?.map(it => it.name + ' (' + it.qty + ')').join(' + ') || 'شحنة منتجات سند'}
                </div>
              </div>

              {/* التذييل: سند SANAD - مندوب توصيل */}
              <div className="border-t-2 border-black pt-2 mt-2 text-center text-xs font-bold text-black flex items-center justify-center gap-1.5">
                <span>📦</span>
                <span>سند SANAD — مندوب توصيل</span>
              </div>
            </div>
          )}

        </div>

        {/* إرشادات الطباعة والشعار المستخدم */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              إعدادات الورق النشطة: <strong className="text-cyan-300 font-bold">{paperSize === 'a4' ? 'ورق عادي مقاس A4 (210×297 مم)' : 'ملصق بوليصة حراري (100×150 مم)'}</strong>
            </span>
          </div>
          <button onClick={handlePrint} className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer">
            بدء الطباعة فوراً ({copies === 1 ? 'نسخة واحدة' : `${copies} نسخ`}) 🖨️
          </button>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { Printer, X, Check } from 'lucide-react';

export default function WaybillModal({ order, branch, driver, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

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

  const orderNumDigits = order.id.replace(/\D/g, '').slice(-3) || '963';
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
    const p = (order.customerPhone || '0500000000').replace(/^0/, '');
    return '+966' + p;
  };

  const formattedSenderPhone = () => {
    const p = (branch?.phone || '0501234567').replace(/^0/, '');
    return '+966' + p;
  };

  const codAmountText = order.paymentMethod === 'cash' ? Number(order.totalAmount).toFixed(2) : '0.00';

  const now = new Date(order.createdAt || Date.now());
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestampStr = ampm + ' ' + hours + ':' + minutes + ' ' + year + '-' + month + '-' + day;

  // باركود فيكتور عالي الدقة
  const renderBarcodeBars = () => {
    const pattern = [
      2,1,1,3,1,2,3,1,1,2,2,1,1,3,2,1,1,2,3,1,1,2,1,3,2,1,1,2,1,3,
      1,2,3,1,1,2,2,1,1,3,2,1,1,2,1,3,1,2,3,1,2,1,1,3,1,2,1,3,2,1,
      1,2,3,1,1,2,2,1,1,3,2,1,1,2,3,1,1,2,1,3,2,1,1,2,1,3,1,2,3,1,
      2,1,1,3,1,2,3,1,1,2,2,1,1,3,2,1,1,2,1,3,1,2,3,1,2,1,1,3,1,2
    ];
    let x = 10;
    return pattern.map((w, i) => {
      const bar = i % 2 === 0 ? (
        <rect key={i} x={x} y="0" width={w * 1.8} height="70" fill="#000000" />
      ) : null;
      x += w * 1.8;
      return bar;
    });
  };

  const printCss = '@media print { body * { visibility: hidden !important; } #thermal-print-area, #thermal-print-area * { visibility: visible !important; } #thermal-print-area { position: fixed !important; left: 0 !important; top: 0 !important; width: 100mm !important; height: 150mm !important; margin: 0 !important; padding: 4mm !important; box-sizing: border-box !important; background: white !important; color: black !important; border: 2px solid black !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; } @page { size: 4in 6in; margin: 0; } }';

  return (
    <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <style>{printCss}</style>
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* شريط الإجراءات العلوي */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-slate-200 print:hidden">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" title="إغلاق">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <span>بوليصة الشحن الحرارية 4×6</span>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer active:scale-95" title="طباعة بوليصة 4x6">
            <Printer className="w-4 h-4" />
            <span>طباعة 4×6</span>
          </button>
        </div>

        {/* عرض المعاينة للبوليصة بمقاس 4x6 */}
        <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center overflow-x-auto">
          <div id="thermal-print-area" className="w-[360px] min-h-[540px] bg-white text-black p-5 border-2 border-black rounded-none shadow-2xl flex flex-col justify-between text-right box-border select-none" dir="rtl" style={{ width: '380px', minHeight: '560px' }}>
            <div>
              {/* ترويسة البوليصة: الشعار والكود D963 وشعار سَنَد إكسبريس */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                {/* الشعار على اليمين */}
                <div className="flex items-center gap-2">
                  <img src="/sanad-express-logo.jpg?v=3" alt="سند إكسبريس" className="w-10 h-10 rounded-lg object-cover border border-black" />
                  <div className="text-right">
                    <div className="font-black text-base text-black tracking-tight leading-none">سَنَد إكسبريس</div>
                    <div className="font-mono font-bold text-[9px] text-black tracking-wider mt-0.5">SANAD EXPRESS</div>
                  </div>
                </div>

                {/* الكود العريض D963 وبديل التاج (شعار المتجر) على اليسار */}
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
                <div className="w-full flex justify-center overflow-hidden">
                  <svg className="w-full h-16" viewBox="0 0 350 70">{renderBarcodeBars()}</svg>
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-black mt-1 px-1 text-black">
                  <span>{order.id.startsWith('SND-') ? order.id : 'SND-' + (order.id.replace(/\D/g, '') || '282288')}</span>
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
                محتويات الشحنة: {order.items?.map(it => it.name + ' (' + it.qty + ')').join(' + ')}
              </div>
            </div>

            {/* التذييل: سند إكسبريس - مندوب توصيل */}
            <div className="border-t-2 border-black pt-2 mt-2 text-center text-xs font-bold text-black flex items-center justify-center gap-1.5">
              <span>📦</span>
              <span>سَنَد إكسبريس — مندوب توصيل</span>
            </div>
          </div>
        </div>

        {/* إرشادات الطباعة والشعار المستخدم */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>شعار البوليصة: <strong className="text-purple-300">{isVapeSharq ? 'شعار فيب الشرق المعتمد' : 'شعار تاج إكليل المعتمد'}</strong> (مقاس 4×6 حراري)</span>
          </div>
          <button onClick={handlePrint} className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer">
            بدء الطباعة الآن 🖨️
          </button>
        </div>
      </div>
    </div>
  );
}
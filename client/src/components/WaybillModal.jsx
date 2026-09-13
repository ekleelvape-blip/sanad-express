import React, { useState, useEffect } from 'react';
import { generateBarcodeSVG, generateQrSVG } from '../utils/barcode';
import { 
  X, Printer, Check, FileText, Tag, Sliders, Settings, 
  RotateCcw, Sparkles, AlertCircle, Copy, Scissors, PackageCheck,
  ChevronDown, Layers, ShieldCheck
} from 'lucide-react';
import { 
  PRINTER_TYPES, A4_LAYOUTS, loadPrinterSettings, 
  savePrinterSettings, executeIframePrint 
} from '../utils/printerConfig';

export default function WaybillModal({ order, branch, driver, onClose }) {
  const [config, setConfig] = useState(loadPrinterSettings);
  const [printerType, setPrinterType] = useState(config.defaultPrinterType || PRINTER_TYPES.THERMAL);
  const [copies, setCopies] = useState(printerType === PRINTER_TYPES.A4 ? (config.a4Copies || 1) : (config.thermalCopies || 1));
  const [packagesCount, setPackagesCount] = useState(1); // عداد الكراتين / الطرود
  const [currentPackageNum, setCurrentPackageNum] = useState(1); // رقم الكرتون الحالي
  const [a4Layout, setA4Layout] = useState(config.a4Layout || A4_LAYOUTS.FULL);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // تحديث العداد تلقائياً ليتطابق مع نوع الطابعة المحددة
  const handleSelectPrinterType = (type) => {
    setPrinterType(type);
    if (type === PRINTER_TYPES.THERMAL) {
      setCopies(config.thermalCopies || 1);
    } else if (type === PRINTER_TYPES.A4) {
      setCopies(config.a4Copies || 1);
    } else {
      setCopies(1);
    }
  };

  if (!order) return null;

  // التحقق هل الفرع هو فيب الشرق أو أحد فروع إكليل
  const isVapeSharq = (branch?.id === 'branch-vape-sharq') || 
                      (order?.branchId === 'branch-vape-sharq') ||
                      (branch?.name && branch.name.includes('فيب الشرق'));

  // كود التوزيع السريع مثل D963 أو K922 أو SF924
  const getCityPrefix = () => {
    const city = ((branch?.city || '') + ' ' + (order?.customerAddress || '')).toLowerCase();
    if (city.includes('صفو') || city.includes('صفوي')) return 'SF';
    if (city.includes('قطيف') || city.includes('تاروت')) return 'Q';
    if (city.includes('سيهات') || city.includes('عنك')) return 'S';
    if (city.includes('ظهران') || city.includes('دوحة')) return 'DH';
    if (city.includes('خبر') || city.includes('khobar')) return 'K';
    if (city.includes('جبيل') || city.includes('jubail')) return 'J';
    return 'D';
  };

  const orderNumDigits = String(order.id || '').replace(/\D/g, '').slice(-3) || '963';
  const sortCode = getCityPrefix() + orderNumDigits;

  const cityBadgeText = () => {
    const addr = (order.customerAddress || '').toLowerCase();
    if (addr.includes('صفو') || addr.includes('صفوي')) return 'صفوى';
    if (addr.includes('قطيف') || addr.includes('تاروت')) return 'القطيف';
    if (addr.includes('سيهات') || addr.includes('عنك')) return 'سيهات';
    if (addr.includes('ظهران') || addr.includes('دوحة') || addr.includes('دانة')) return 'الظهران';
    if (addr.includes('خبر') || addr.includes('عزيزية') || addr.includes('عقربية')) return 'الخبر';
    if (addr.includes('دمام')) return 'الدمام';
    if (addr.includes('جبيل')) return 'الجبيل';
    return branch?.city || 'الدمام';
  };

  const getCityDeliveryFee = () => {
    if (order.deliveryFee && Number(order.deliveryFee) > 0 && order.deliveryFee !== 17.39 && order.deliveryFee !== 20) {
      return Number(order.deliveryFee);
    }
    const addr = ((order.customerAddress || '') + ' ' + (branch?.city || '')).toLowerCase();
    if (addr.includes('صفو') || addr.includes('صفوي')) return 40;
    if (addr.includes('قطيف') || addr.includes('تاروت')) return 35;
    if (addr.includes('خبر') || addr.includes('عزيزية') || addr.includes('عقربية')) return 35;
    if (addr.includes('ظهران') || addr.includes('دوحة') || addr.includes('دانة') || addr.includes('قصور')) return 30;
    if (addr.includes('سيهات') || addr.includes('عنك')) return 30;
    if (addr.includes('دمام')) return 25;
    return 25;
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

  const trackingId = String(order.id || '').startsWith('SND-') ? order.id : ('SND-' + (String(order.id || '').replace(/\D/g, '') || '1001'));

  // حفظ الإعداد كافتراضي للنظام
  const handleSaveAsDefault = (printerVal, a4Val, copiesVal) => {
    const updated = savePrinterSettings({
      defaultPrinterType: printerVal || printerType,
      a4Layout: a4Val || a4Layout,
      thermalCopies: printerVal === PRINTER_TYPES.THERMAL ? (copiesVal || copies) : config.thermalCopies,
      a4Copies: printerVal === PRINTER_TYPES.A4 ? (copiesVal || copies) : config.a4Copies
    });
    setConfig(updated);
    alert('✓ تم حفظ إعدادات الطابعة والعداد كإعداد افتراضي للنظام');
  };

  // توليد HTML للطباعة بناءً على العداد والنوع
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      let pagesHtml = '';

      if (printerType === PRINTER_TYPES.THERMAL) {
        // طابعة حرارية: ننتج ملصقاً لكل طرد بحسب عداد الطرود والنسخ
        const el = document.getElementById('thermal-print-area');
        if (!el) return;

        for (let copy = 1; copy <= copies; copy++) {
          for (let p = 1; p <= packagesCount; p++) {
            // استبدال وسم العداد بنقاوة
            let labelHtml = el.outerHTML;
            labelHtml = labelHtml.replace(/data-package-badge="true"[^>]*>([^<]*)</g, `data-package-badge="true">${p}/${packagesCount}<`);
            pagesHtml += `<div class="waybill-print-sheet">${labelHtml}</div>`;
          }
        }
      } else if (printerType === PRINTER_TYPES.A4) {
        if (a4Layout === A4_LAYOUTS.SPLIT_2IN1) {
          // بوليصتان على ورقة A4 واحدة
          const el = document.getElementById('a4-split-print-area');
          if (!el) return;
          for (let i = 0; i < copies; i++) {
            pagesHtml += `<div class="waybill-print-sheet">${el.innerHTML}</div>`;
          }
        } else {
          // بوليصة A4 كاملة
          const el = document.getElementById('waybill-a4-print-area');
          if (!el) return;
          for (let i = 0; i < copies; i++) {
            const copyBadge = copies > 1 ? (i === 0 ? ' [نسخة العميل / الأصل]' : ' [نسخة المتجر والأرشيف]') : '';
            let a4Html = el.outerHTML;
            if (copyBadge) {
              a4Html = a4Html.replace('سند SANAD</h1>', `سند SANAD <span style="font-size:12px;font-weight:normal;color:#444;">${copyBadge}</span></h1>`);
            }
            pagesHtml += `<div class="waybill-print-sheet">${a4Html}</div>`;
          }
        }
      } else {
        // POS 80mm
        const el = document.getElementById('pos80-print-area');
        if (!el) return;
        for (let i = 0; i < copies; i++) {
          pagesHtml += `<div class="waybill-print-sheet">${el.outerHTML}</div>`;
        }
      }

      await executeIframePrint({
        pagesHtml,
        printerType,
        a4Layout,
        marginOffset: config.thermalMarginOffset || 0,
        title: `بوليصة شحن سند - ${order.id}`
      });
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Cairo','Tajawal',sans-serif]">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[96vh]">
        
        {/* =========================================================================
            1. شريط التحكم العلوي: اختيار الطابعة وضبط العداد
            ========================================================================= */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-200 print:hidden">
          
          {/* عنوان ومعلومات الشحنة */}
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" 
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                <span>طباعة بوليصة الشحن</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded-full font-mono font-bold">
                  {trackingId}
                </span>
                {printerType === PRINTER_TYPES.THERMAL ? (
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-bold">
                    🏷️ حراري 4×6 (100×150 مم)
                  </span>
                ) : (
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold">
                    📄 ورق مكتب A4 (210×297 مم)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                العميل: <strong className="text-white">{order.customerName}</strong> • {cityBadgeText()} • COD: <span className="text-emerald-400 font-mono font-bold">{codAmountText} ﷼</span>
              </div>
            </div>
          </div>

          {/* محددات الطابعة والعداد */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* اختيار نوع الطابعة (حراري 4x6 مقابل A4 مكتبية) */}
            <div className="flex items-center bg-slate-900 border border-slate-700 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSelectPrinterType(PRINTER_TYPES.THERMAL)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  printerType === PRINTER_TYPES.THERMAL
                    ? 'bg-purple-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="طابعة ملصقات البوالص الحرارية المتخصصة (Xprinter / Zebra 4x6 بوصة)"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>حراري (4×6 بوصة)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPrinterType(PRINTER_TYPES.A4)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  printerType === PRINTER_TYPES.A4
                    ? 'bg-[#00d2d3] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="طابعة ورق مكتبية ليزر أو عادية مقاس A4"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>طابعة A4 مكتبية</span>
              </button>
            </div>

            {/* خيارات تخطيط A4 إذا كانت A4 مختارة */}
            {printerType === PRINTER_TYPES.A4 && (
              <div className="flex items-center bg-slate-900 border border-slate-700 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setA4Layout(A4_LAYOUTS.FULL)}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    a4Layout === A4_LAYOUTS.FULL
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="صفحة A4 كاملة مفصلة مع الفاتورة"
                >
                  صفحة كاملة
                </button>
                <button
                  type="button"
                  onClick={() => setA4Layout(A4_LAYOUTS.SPLIT_2IN1)}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                    a4Layout === A4_LAYOUTS.SPLIT_2IN1
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="بوليصتين في صفحة A4 واحدة لتوفير 50% من الورق"
                >
                  <Scissors className="w-3 h-3" />
                  <span>2 في 1 (توفير)</span>
                </button>
              </div>
            )}

            {/* عداد الكراتين / الطرود للطابعة الحرارية */}
            {printerType === PRINTER_TYPES.THERMAL && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-2xl text-xs font-bold" title="عدد الكراتين للشحنة: يطبع ملصقاً مخصصاً لكل كرتون">
                <span className="text-slate-400 text-[11px]">الكراتين:</span>
                <button
                  type="button"
                  onClick={() => setPackagesCount(prev => Math.max(1, prev - 1))}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs"
                >
                  -
                </button>
                <span className="w-4 text-center font-mono text-purple-300 font-bold">{packagesCount}</span>
                <button
                  type="button"
                  onClick={() => setPackagesCount(prev => Math.min(10, prev + 1))}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs"
                >
                  +
                </button>
              </div>
            )}

            {/* عداد النسخ المتطابق مع الطابعة */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-2xl text-xs font-bold">
              <span className="text-slate-400 text-[11px]">النسخ:</span>
              <button
                type="button"
                onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <span className="w-4 text-center font-mono text-cyan-400 font-bold">{copies}</span>
              <button
                type="button"
                onClick={() => setCopies(prev => Math.min(10, prev + 1))}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>

            {/* زر الضبط والمعايرة المتقدمة للطابعة */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition-all cursor-pointer"
              title="معايرة الطابعة وضبط العداد الافتراضي"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* زر الطباعة المباشر */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-[#00d2d3] hover:from-cyan-400 hover:to-cyan-300 text-slate-950 text-xs font-black px-4 py-2 rounded-2xl shadow-lg shadow-cyan-900/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isPrinting ? 'جاري الإرسال...' : (
                  printerType === PRINTER_TYPES.THERMAL
                    ? `طباعة حراري (${packagesCount > 1 ? `${packagesCount} كراتين` : 'ملصق 4×6'}${copies > 1 ? ` × ${copies}` : ''})`
                    : `طباعة A4 (${copies} ${copies > 1 ? 'نسخ' : 'نسخة'})`
                )}
              </span>
            </button>

          </div>
        </div>

        {/* =========================================================================
            2. شريط حالة الضبط والتطابق للطابعة المختارة
            ========================================================================= */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>الطابعة النشطة:</span>
            <strong className="text-cyan-300 font-bold">
              {printerType === PRINTER_TYPES.THERMAL ? '🏷️ طابعة ملصقات حرارية 4×6 بوصة (100×150 مم)' : '📄 طابعة مكتبية A4 قياسية (210×297 مم)'}
            </strong>
            <span className="text-slate-600">|</span>
            <span>العداد النشط:</span>
            <span className="text-amber-300 font-mono font-bold">
              {printerType === PRINTER_TYPES.THERMAL ? `1 ملصق لكل كرتون (${packagesCount} كراتين)` : `${copies} نسخ A4`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveAsDefault(printerType, a4Layout, copies)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-cyan-400" />
              <span>حفظ كإعداد افتراضي للمرات القادمة</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. منطقة المعاينة الحية للبوليصة
            ========================================================================= */}
        <div className="p-4 sm:p-6 bg-slate-950 flex-1 overflow-y-auto flex flex-col items-center justify-start min-h-[500px]">
          
          {printerType === PRINTER_TYPES.A4 ? (
            a4Layout === A4_LAYOUTS.SPLIT_2IN1 ? (
              /* ========================================================
                 A4 Split 2-in-1: بوليصتان على ورقة A4 واحدة (توفير 50%)
                 ======================================================== */
              <div id="a4-split-print-area" className="w-full max-w-[760px] space-y-4">
                <div className="border-2 border-dashed border-slate-700 p-2 rounded-2xl bg-white text-black space-y-3">
                  
                  {/* النصف الأول: نسخة العميل ومسار التوصيل */}
                  <div className="p-4 border-2 border-black rounded-xl bg-white text-right font-['Cairo',sans-serif] text-xs">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <img src="/sanad-express-logo.jpg?v=3" alt="سند" className="w-9 h-9 rounded-lg border border-black object-cover" />
                        <div>
                          <div className="font-black text-base leading-none">سند SANAD EXPRESS</div>
                          <span className="text-[10px] text-slate-600 font-bold">بوليصة تسليم العميل (A5)</span>
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <div className="font-black text-2xl leading-none">{sortCode}</div>
                        <div className="text-[10px] text-slate-600">{timestampStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-1">
                      <div className="flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(trackingId, 45, 1.8) }} />
                      <div className="text-left">
                        <div className="text-xs font-black font-mono">{trackingId}</div>
                        <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">
                          {cityBadgeText()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-2 text-[11px] border border-black p-2 rounded-lg bg-slate-50">
                      <div>
                        <strong>العميل: </strong>{order.customerName}<br />
                        <strong>الجوال: </strong><span className="font-mono dir-ltr">{formattedRecipientPhone()}</span><br />
                        <strong>العنوان: </strong>{order.customerAddress || '—'}
                      </div>
                      <div className="text-left border-r border-black pr-2">
                        <strong>المبلغ المطلوب (COD):</strong>
                        <div className="text-xl font-black font-mono text-black">{codAmountText} ريال</div>
                        <div className="text-[10px] text-slate-600">{order.paymentMethod === 'cash' ? 'تحصيل كاش عند التسليم' : 'مدفوع مسبقاً'}</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between border-t border-black pt-1">
                      <span>المرسل: {branch?.name || 'متجر إكليل / فيب الشرق'}</span>
                      <span>الكراتين: 1/1</span>
                      <span>توقيع العميل: ___________________</span>
                    </div>
                  </div>

                  {/* خط القص التوضيحي ✂️ */}
                  <div className="flex items-center justify-center gap-2 py-1 text-[10px] font-bold text-slate-500 border-y border-dashed border-slate-400">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>خط القص بالمقص — ورقة A4 مقسومة لنصفين متطابقين (توفير 50% من استهلاك الورق)</span>
                    <Scissors className="w-3.5 h-3.5" />
                  </div>

                  {/* النصف الثاني: نسخة المتجر / المستودع */}
                  <div className="p-4 border-2 border-black rounded-xl bg-slate-50/80 text-right font-['Cairo',sans-serif] text-xs">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <img src="/sanad-express-logo.jpg?v=3" alt="سند" className="w-9 h-9 rounded-lg border border-black object-cover" />
                        <div>
                          <div className="font-black text-base leading-none">سند SANAD EXPRESS</div>
                          <span className="text-[10px] text-slate-600 font-bold">قسيمة المتجر والمستودع (أرشيف)</span>
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <div className="font-black text-2xl leading-none">{sortCode}</div>
                        <div className="text-[10px] text-slate-600 font-bold">COD: {codAmountText} ﷼</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <strong>رقم الشحنة: </strong><span className="font-mono font-bold">{trackingId}</span><br />
                        <strong>العميل: </strong>{order.customerName} ({formattedRecipientPhone()})<br />
                        <strong>المحتويات: </strong>{order.items?.map(i => i.name + ' (' + i.qty + ')').join(' + ') || 'شحنة سند'}
                      </div>
                      <div className="text-left border-r border-black pr-2">
                        <strong>المندوب المعتمد: </strong>{driver?.name || 'سائق الفرع'}<br />
                        <strong>تاريخ التجهيز: </strong>{timestampStr}<br />
                        <strong>توقيع أمين المستودع: </strong>________________
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* ========================================================
                 قالب البوليصة الرسمي مقاس A4 المعتمد (صفحة كاملة)
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
                      <div className="text-xs font-bold text-slate-600">منظومة الخدمات اللوجستية والتوصيل السريع</div>
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
                      <span className="font-mono font-bold">{Number(getCityDeliveryFee()).toFixed(2)} ر.س</span>
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
                  <span>سند SANAD EXPRESS — نظام التوصيل اللوجستي</span>
                  <span className="font-mono">www.sanad.sa</span>
                </div>
              </div>
            )
          ) : (
            /* ========================================================
               قالب الملصق الحراري 4x6 بوصة (100x150 مم) المخصص لمنع الملصق الفارغ
               ======================================================== */
            <div 
              id="thermal-print-area" 
              className="w-[360px] min-h-[520px] max-h-[540px] bg-white text-black p-4 border-2 border-black rounded-none shadow-2xl flex flex-col justify-between text-right box-border select-none font-['Cairo',sans-serif]" 
              dir="rtl" 
              style={{ width: '380px', maxHeight: '540px' }}
            >
              <div>
                {/* ترويسة البوليصة: الشعار، الكود D963، واسم المتجر */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <img src="/sanad-express-logo.jpg?v=3" alt="سند SANAD" className="w-10 h-10 rounded-lg object-cover border border-black" />
                    <div className="text-right">
                      <div className="font-black text-lg text-black tracking-tight leading-none">سند SANAD</div>
                      <div className="text-[10px] text-slate-600 font-bold leading-none mt-0.5">EXPRESS</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="font-black font-mono text-3xl text-black tracking-tighter leading-none">{sortCode}</div>
                    {isVapeSharq ? (
                      <div className="flex items-center justify-center h-8 max-w-[100px]">
                        <img src="/logo-vape-sharq-cropped.png" alt="شعار فيب الشرق" className="h-7 w-auto object-contain filter contrast-125" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-8 w-10">
                        <img src="/logo-iklil-crown.png" alt="شعار إكليل" className="h-7 w-auto object-contain filter contrast-125" />
                      </div>
                    )}
                  </div>
                </div>

                {/* الباركود الرمزي العريض عالي التباين */}
                <div className="pt-2 pb-1 text-center">
                  <div className="w-full flex items-center justify-between gap-2 px-1">
                    <div className="flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(trackingId, 62, 1.9) }} />
                    <div className="shrink-0 border border-black p-0.5 rounded flex flex-col items-center bg-white">
                      <div dangerouslySetInnerHTML={{ __html: generateQrSVG(trackingId, 80) }} />
                      <span className="text-[7px] font-mono font-bold leading-none mt-0.5">QR</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono font-black mt-1 px-1 text-black">
                    <span>{trackingId}</span>
                    <span className="text-[10px] font-bold">{timestampStr}</span>
                  </div>
                </div>

                <div className="border-b-2 border-black my-1.5"></div>

                {/* جوال المستلم وشارة المدينة */}
                <div className="py-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm font-black text-black">
                      جوال المستلم : <span className="font-mono dir-ltr inline-block font-black">{formattedRecipientPhone()}</span>
                    </div>
                    <div className="bg-black text-white font-bold text-[11px] px-2 py-0.5 rounded">
                      {cityBadgeText()}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-black truncate mb-0.5">
                    العميل: {order.customerName}
                  </div>
                  <div className="text-[11px] text-slate-700 font-semibold truncate">
                    العنوان: {order.customerAddress || '—'}
                  </div>
                </div>

                {/* المرسل ورقم هاتف المتجر */}
                <div className="flex items-center justify-between text-xs font-bold border-t border-black pt-1 pb-1.5">
                  <div>المرسل: <span className="font-black">{branch ? branch.name : (isVapeSharq ? 'فيب الشرق' : 'متجر إكليل فيب')}</span></div>
                  <div className="font-mono font-bold dir-ltr">{formattedSenderPhone()}</div>
                </div>

                {/* شبكة عدد الكراتين والمبلغ المطلوب تحصيله (COD) */}
                <div className="grid grid-cols-2 border-2 border-black mt-1 text-center">
                  <div className="p-2 border-l-2 border-black flex flex-col justify-center bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-700 mb-0.5">عدد الكراتين (العداد)</div>
                    <div 
                      data-package-badge="true" 
                      className="text-2xl font-black font-mono text-black"
                    >
                      {currentPackageNum}/{packagesCount}
                    </div>
                  </div>
                  <div className="p-2 flex flex-col justify-center bg-white">
                    <div className="text-[10px] font-bold text-slate-700 mb-0.5">المبلغ المطلوب (COD)</div>
                    <div className="text-2xl font-black font-mono text-black leading-none">
                      {codAmountText} <span className="text-xs font-bold">ريال</span>
                    </div>
                  </div>
                </div>

                {/* منطقة كود المنطقة / التوزيع 00 / 0 */}
                <div className="border-x-2 border-b-2 border-black p-2.5 text-left font-mono flex items-center justify-between bg-slate-50">
                  <div className="text-3xl font-black leading-none text-black">00</div>
                  <div className="text-xs text-slate-600 font-bold font-sans">
                    {order.paymentMethod === 'cash' ? 'تحصيل كاش 💵' : 'مدفوع إلكتروني 💳'}
                  </div>
                  <div className="text-2xl font-black leading-none text-black">0</div>
                </div>

                {/* ملخص محتويات الطرد بشكل مضغوط يمنع فيضان الملصق */}
                <div className="pt-1.5 text-[10px] text-slate-800 font-semibold truncate">
                  محتويات: {order.items?.map(it => it.name + ' (' + it.qty + ')').join(' + ') || 'منتجات سند'}
                </div>
              </div>

              {/* تذييل سند SANAD */}
              <div className="border-t-2 border-black pt-1 mt-1 text-center text-[11px] font-black text-black flex items-center justify-center gap-1.5">
                <span>📦</span>
                <span>سند SANAD EXPRESS — مندوب التوصيل المعتمد</span>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            4. شريط الإرشادات السفلي
            ========================================================================= */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              تمت مطابقة قياسات الطباعة لمنع خروج ملصقات فارغة، وضبط عداد الكراتين والنسخ تلقائياً.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>تأكيد الطباعة الآن 🖨️</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          5. نافذة ضبط ومعايرة الطابعة والعداد (Calibration Modal)
          ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[3200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 space-y-4 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>ضبط ومعايرة طابعة البوليصة والعداد</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">نوع الطابعة الافتراضية المفضلة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPrinterType(PRINTER_TYPES.THERMAL)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      printerType === PRINTER_TYPES.THERMAL
                        ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-xs">طابعة حرارية 4×6</span>
                    </div>
                    <div className="text-[10px] text-slate-400">100×150 مم • Xprinter / Zebra</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPrinterType(PRINTER_TYPES.A4)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      printerType === PRINTER_TYPES.A4
                        ? 'bg-cyan-950/60 border-cyan-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-xs">طابعة مكتبية A4</span>
                    </div>
                    <div className="text-[10px] text-slate-400">210×297 مم • ليزر ومكتبية</div>
                  </button>
                </div>
              </div>

              {/* ضبط العداد الافتراضي */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">ضبط العداد التلقائي للنسخ:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block mb-1">عداد نسخ الحراري:</span>
                    <select
                      value={config.thermalCopies || 1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = savePrinterSettings({ thermalCopies: val });
                        setConfig(updated);
                        if (printerType === PRINTER_TYPES.THERMAL) setCopies(val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    >
                      <option value="1">1 نسخة (موصى به للحراري)</option>
                      <option value="2">2 نسختين لكل كرتون</option>
                      <option value="3">3 نسخ</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">عداد نسخ A4:</span>
                    <select
                      value={config.a4Copies || 1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = savePrinterSettings({ a4Copies: val });
                        setConfig(updated);
                        if (printerType === PRINTER_TYPES.A4) setCopies(val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    >
                      <option value="1">1 نسخة أصلية</option>
                      <option value="2">2 نسخ (عميل + متجر)</option>
                      <option value="3">3 نسخ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* معايرة إزاحة الهامش لمنع خروج الملصق الفارغ */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">معايرة الهامش الأفقي للحراري:</span>
                  <span className="text-cyan-400 font-mono font-bold">{config.thermalMarginOffset || 0} مم</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = savePrinterSettings({ thermalMarginOffset: 0 });
                      setConfig(updated);
                    }}
                    className={`py-1.5 rounded-lg border text-center font-bold ${
                      (config.thermalMarginOffset || 0) === 0 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    0 مم (قياسي)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = savePrinterSettings({ thermalMarginOffset: 2 });
                      setConfig(updated);
                    }}
                    className={`py-1.5 rounded-lg border text-center font-bold ${
                      config.thermalMarginOffset === 2 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    +2 مم (أمان)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = savePrinterSettings({ thermalMarginOffset: -1 });
                      setConfig(updated);
                    }}
                    className={`py-1.5 rounded-lg border text-center font-bold ${
                      config.thermalMarginOffset === -1 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    -1 مم (ضيق)
                  </button>
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleSaveAsDefault(printerType, a4Layout, copies);
                  setShowSettingsModal(false);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                تطبيق وحفظ الإعدادات
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

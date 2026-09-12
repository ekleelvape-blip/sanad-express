import React, { useState, useEffect, useRef } from 'react';
import { ScanLine, QrCode, Camera, AlertTriangle, CheckCircle2, X, Sparkles, ShieldCheck, Box, User, MapPin, DollarSign, RefreshCw, KeyRound } from 'lucide-react';
import { sound } from '../utils/sound';

export default function OrderScanModal({
  isOpen,
  order,
  allOrders = [],
  mode = 'pickup', // 'pickup' | 'delivery'
  onSuccess,
  onClose
}) {
  const [scannedInput, setScannedInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [matchedOtherOrder, setMatchedOtherOrder] = useState(null);
  const [successVerified, setSuccessVerified] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);

  // التركيز التلقائي على حقل قارئ الباركود عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      setScannedInput('');
      setErrorMessage('');
      setMatchedOtherOrder(null);
      setSuccessVerified(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 150);
    } else {
      stopCamera();
    }
  }, [isOpen, order]);

  // تشغيل / إيقاف كاميرا الجوال
  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم فتح الكاميرا المباشرة، يمكنك استخدام قارئ الليزر أو الإدخال اليدوي');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('تعذر تشغيل الكاميرا (يرجى السماح بإذن الكاميرا أو استخدام قارئ الباركود)');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  if (!isOpen || !order) return null;

  // استخراج الكود النظيف من أي رابط أو نص
  const extractCode = (raw) => {
    if (!raw) return '';
    let str = String(raw).trim();
    if (str.includes('track=')) {
      try {
        const url = new URL(str.startsWith('http') ? str : 'https://dummy.com/' + str);
        const p = url.searchParams.get('track');
        if (p) str = p;
      } catch (e) {}
    }
    return str.replace(/^[#\s]+/, '').trim().toUpperCase();
  };

  // التحقق الصارم من الباركود ومطابقته للطلب
  const handleVerifyBarcode = (rawCode) => {
    const code = extractCode(rawCode);
    setErrorMessage('');
    setMatchedOtherOrder(null);

    if (!code) {
      setErrorMessage('يرجى توجيه الماسح نحو الباركود أو كتابة رقم الشحنة');
      sound.playOrderAlert();
      return;
    }

    const targetIdClean = extractCode(order.id);
    const targetNumDigits = targetIdClean.replace(/\D/g, '');
    const codeDigits = code.replace(/\D/g, '');

    // 1. هل الكود مطابق للشحنة الحالية المطلوبة؟
    const isExactMatch = (
      code === targetIdClean ||
      (codeDigits && targetNumDigits && codeDigits === targetNumDigits) ||
      code === ('SND-' + targetNumDigits) ||
      code === ('D-' + targetNumDigits) ||
      (order.sallaOrderNumber && code === order.sallaOrderNumber)
    );

    if (isExactMatch) {
      sound.playSuccess();
      setSuccessVerified(true);
      stopCamera();

      setTimeout(() => {
        if (onSuccess) onSuccess(order.id);
      }, 700);
      return;
    }

    // 2. هل الكود يخص شحنة أخرى في المنظومة؟ (لمنع خلط وضياع الشحنات)
    const otherOrder = allOrders.find(o => {
      if (o.id === order.id) return false;
      const oIdClean = extractCode(o.id);
      const oNumDigits = oIdClean.replace(/\D/g, '');
      return (
        code === oIdClean ||
        (codeDigits && oNumDigits && codeDigits === oNumDigits) ||
        code === ('SND-' + oNumDigits) ||
        (o.sallaOrderNumber && code === o.sallaOrderNumber)
      );
    });

    if (otherOrder) {
      sound.playOrderAlert();
      setMatchedOtherOrder(otherOrder);
      setErrorMessage(`⚠️ تحذير حرج: هذا الباركود يخص الشحنة #${otherOrder.id} للعميل (${otherOrder.customerName})! احذر من تسليم أو خلط هذا الطرد!`);
      return;
    }

    // 3. الكود غير مسجل إطلاقاً
    sound.playOrderAlert();
    setErrorMessage(`❌ الباركود الممسوح [${code}] غير مطابق لهذه الشحنة. يرجى مسح بوليصة الشحنة الصحيحة المطبوعة على الكرتون.`);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleVerifyBarcode(scannedInput);
  };

  // محاكاة فورية لمسح بوليصة هذا الطلب بنجاح
  const handleSimulateScan = () => {
    setScannedInput(order.id);
    handleVerifyBarcode(order.id);
  };

  // محاكاة لمسح طرد خاطئ للتجربة والتحقق
  const handleSimulateWrongScan = () => {
    const wrong = allOrders.find(o => o.id !== order.id) || { id: 'SND-9999', customerName: 'عميل آخر' };
    setScannedInput(wrong.id);
    handleVerifyBarcode(wrong.id);
  };

  return (
    <div className="fixed inset-0 z-[8000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-md bg-[#0d1424] border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-100 relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* شريط الإشعاع العلوي */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-[#00d2d3] to-indigo-500"></div>

        {/* الترويسة وأيقونة نوع العملية */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-950 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${
              mode === 'pickup'
                ? 'bg-cyan-950/80 border border-cyan-500/50 text-[#00d2d3] shadow-cyan-900/40'
                : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 shadow-emerald-900/40'
            }`}>
              <ScanLine className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-black text-sm text-white flex items-center gap-1.5">
                <span>{mode === 'pickup' ? 'مسح باركود الاستلام من المستودع' : 'مسح باركود التسليم للعميل'}</span>
                <span className="text-[10px] bg-cyan-950 text-[#00d2d3] border border-cyan-800 px-2 py-0.5 rounded-full font-bold">إلزامي 🛡️</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {mode === 'pickup'
                  ? 'تحقق من مطابقة بوليصة الكرتون قبل نقله للسيارة'
                  : 'تحقق من تسليم الطرد الصحيح للعميل لمنع الخلط'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* بطاقة تفاصيل الشحنة المطلوب مسح بوليصتها */}
        <div className="bg-slate-900/90 border border-cyan-900/60 rounded-2xl p-3 mb-3 text-xs space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Box className="w-4 h-4 text-[#00d2d3]" />
              <span>الشحنة المستهدفة:</span>
            </div>
            <span className="font-mono font-black text-sm text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-800">
              #{order.id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1 text-slate-300 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-bold justify-end">
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span>{order.totalAmount} ر.س ({order.paymentMethod === 'cash' ? 'كاش COD' : 'مدفوع'})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{order.customerAddress || 'المنطقة الشرقية'}</span>
          </div>
        </div>

        {/* نافذة الكاميرا / إطار المسح الضوئي الفعلي */}
        <div className="relative w-full h-44 bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/40 flex flex-col items-center justify-center mb-3 shadow-inner group">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
              <QrCode className="w-14 h-14 text-cyan-500/70" />
              <span className="text-[11px] font-bold text-slate-300">جاهز للمسح عبر الكاميرا أو قارئ الليزر</span>
            </div>
          )}

          {/* خط المسح الليزري الأحمر/الأخضر المتحرك */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-pulse"></div>

          {/* زوايا إطار التصويب للمسح */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#00d2d3]"></div>
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#00d2d3]"></div>
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#00d2d3]"></div>
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#00d2d3]"></div>

          {/* زر تبديل الكاميرا */}
          <button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            className="absolute bottom-2 left-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-cyan-800 flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3 h-3" />
            <span>{cameraActive ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا 📷'}</span>
          </button>
        </div>

        {/* رسائل التنبيه والخطأ الصارمة عند مسح باركود خاطئ */}
        {errorMessage && (
          <div className="mb-3 p-3 bg-rose-950/90 border-2 border-rose-600 rounded-2xl text-xs space-y-1.5 animate-shake text-rose-200">
            <div className="font-bold flex items-center gap-1.5 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>خطأ في مطابقة الشحنة!</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMessage}</p>
            {matchedOtherOrder && (
              <div className="pt-1 border-t border-rose-900/60 text-[10px] text-rose-300 font-mono">
                صاحب الطرد المسحوب: {matchedOtherOrder.customerName} (#{matchedOtherOrder.id})
              </div>
            )}
          </div>
        )}

        {/* مؤشر النجاح عند المطابقة */}
        {successVerified && (
          <div className="mb-3 p-3 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl text-xs flex items-center gap-2.5 text-emerald-200 animate-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 animate-bounce" />
            <div>
              <div className="font-black text-emerald-300 text-sm">✅ تم التحقق والمطابقة بنجاح!</div>
              <div className="text-[10px] text-emerald-200">
                {mode === 'pickup' ? 'تم استلام الطرد من المستودع بنجاح.' : 'تم تأكيد مطابقة الطرد للعميل.'}
              </div>
            </div>
          </div>
        )}

        {/* حقل المسح الفوري وقارئ الباركود (Barcode Scanner Input) */}
        <form onSubmit={handleFormSubmit} className="space-y-2 mb-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              dir="ltr"
              value={scannedInput}
              onChange={(e) => setScannedInput(e.target.value)}
              placeholder="امسح الباركود أو اكتب: SND-1006"
              className="w-full bg-slate-900 border-2 border-cyan-900/60 focus:border-[#00d2d3] rounded-2xl px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute left-2 top-1.5 bottom-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>تحقق 🔍</span>
            </button>
          </div>
        </form>

        {/* أزرار المحاكاة السريعة لسهولة التجربة الميدانية */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleSimulateScan}
            className="py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="محاكاة مسح بوليصة هذا الطلب للاختبار"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>محاكاة مسح البوليصة ⚡</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateWrongScan}
            className="py-2.5 px-3 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
            title="تجربة محاكاة مسح طرد خاطئ للتحقق من صمام الأمان"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>تجربة طرد خاطئ ⚠️</span>
          </button>
        </div>

      </div>
    </div>
  );
}

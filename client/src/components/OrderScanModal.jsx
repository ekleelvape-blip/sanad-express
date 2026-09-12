import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  ScanLine, QrCode, Camera, AlertTriangle, CheckCircle2, X, Sparkles, 
  ShieldCheck, Box, User, MapPin, DollarSign, RefreshCw, Upload, Image as ImageIcon 
} from 'lucide-react';
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
  const [cameraStarting, setCameraStarting] = useState(false);

  const scannerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

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
      stopScanner();

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

  const startScanner = async () => {
    setCameraError('');
    setCameraStarting(true);

    try {
      // إيقاف أي ماسح قديم إن وُجد
      await stopScanner();

      const qrContainer = document.getElementById('sanad-qr-reader');
      if (!qrContainer) {
        setCameraStarting(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('sanad-qr-reader');
      scannerRef.current = html5QrCode;

      // محاولة البدء بالكاميرا الخلفية (environment)
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (isMountedRef.current) {
              handleVerifyBarcode(decodedText);
            }
          },
          () => {} // تجاهل أخطاء الإطارات الفارغة
        );
      } catch (backCamErr) {
        // إذا فشلت الكاميرا الخلفية، جرب أي كاميرا متاحة بالجهاز
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cameras.length > 0) {
          const selectedCam = cameras[cameras.length - 1].id;
          await html5QrCode.start(
            selectedCam,
            {
              fps: 15,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              if (isMountedRef.current) {
                handleVerifyBarcode(decodedText);
              }
            },
            () => {}
          );
        } else {
          throw backCamErr;
        }
      }

      if (isMountedRef.current) {
        setCameraActive(true);
        setCameraStarting(false);
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      if (isMountedRef.current) {
        setCameraActive(false);
        setCameraStarting(false);
        const errMsg = String(err?.message || err || '');
        if (errMsg.includes('Permission') || errMsg.includes('NotAllowedError')) {
          setCameraError('تم رفض إذن الكاميرا. يرجى السماح بالوصول للكاميرا من إعدادات المتصفح، أو استخدم التقاط صورة.');
        } else {
          setCameraError('الكاميرا غير متاحة حالياً، يمكنك التقاط صورة مباشرة أو استخدام قارئ الباركود.');
        }
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore clean-up warnings
      }
      scannerRef.current = null;
    }
    if (isMountedRef.current) {
      setCameraActive(false);
    }
  };

  // تهيئة النافذة وبدء الكاميرا تلقائياً عند الفتح
  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setScannedInput('');
      setErrorMessage('');
      setMatchedOtherOrder(null);
      setSuccessVerified(false);
      
      // بدء الكاميرا بعد تحميل العنصر بالـ DOM
      const timer = setTimeout(() => {
        startScanner();
        if (inputRef.current) inputRef.current.focus();
      }, 250);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, [isOpen, order]);

  // مسح صورة تم التقاطها عبر الكاميرا المدمجة بالهاتف
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    try {
      const html5Qr = new Html5Qrcode('sanad-qr-temp-reader');
      const result = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      if (result) {
        handleVerifyBarcode(result);
      }
    } catch (err) {
      setErrorMessage('لم نتمكن من قراءة باركود أو QR واضح من الصورة، تأكد من وضوح الإضاءة وحاول مجدداً');
      sound.playOrderAlert();
    }
  };

  if (!isOpen || !order) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleVerifyBarcode(scannedInput);
  };

  const handleSimulateScan = () => {
    setScannedInput(order.id);
    handleVerifyBarcode(order.id);
  };

  const handleSimulateWrongScan = () => {
    const wrong = allOrders.find(o => o.id !== order.id) || { id: 'SND-9999', customerName: 'عميل آخر' };
    setScannedInput(wrong.id);
    handleVerifyBarcode(wrong.id);
  };

  return (
    <div className="fixed inset-0 z-[8000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      {/* حاوية غير مرئية لمسح الصور الملتقطة */}
      <div id="sanad-qr-temp-reader" style={{ display: 'none' }}></div>

      <div className="w-full max-w-md bg-[#0d1424] border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-100 relative overflow-hidden flex flex-col max-h-[94vh]">
        
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

        {/* بطاقة تفاصيل الشحنة المستهدفة */}
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

        {/* نافذة المسح المباشر بالكاميرا */}
        <div className="relative w-full h-48 bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/40 flex flex-col items-center justify-center mb-3 shadow-inner">
          {/* عنصر حاوية Html5Qrcode */}
          <div id="sanad-qr-reader" className="w-full h-full object-cover"></div>

          {/* في حال كانت الكاميرا قيد التشغيل أو فشلت */}
          {!cameraActive && (
            <div className="absolute inset-0 bg-[#070c16] flex flex-col items-center justify-center p-4 text-center space-y-2 z-10">
              {cameraStarting ? (
                <>
                  <RefreshCw className="w-8 h-8 text-[#00d2d3] animate-spin" />
                  <span className="text-xs font-bold text-slate-300">جاري تشغيل الكاميرا والماسح الضوئي...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-12 h-12 text-slate-500" />
                  <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                    {cameraError || 'وجّه الكاميرا أو التقط صورة لبوليصة الشحنة المطبوعة على الكرتون.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={startScanner}
                      className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-[#00d2d3] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>تشغيل الكاميرا</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>التقاط صورة 📸</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* زوايا إطار التصويب للمسح */}
          {cameraActive && (
            <>
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-pulse pointer-events-none"></div>
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#00d2d3] pointer-events-none"></div>
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#00d2d3] pointer-events-none"></div>
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#00d2d3] pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#00d2d3] pointer-events-none"></div>

              {/* أزرار التحكم بالكاميرا العائمة */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-auto">
                <span className="text-[10px] bg-black/75 backdrop-blur-xs text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-900/60">
                  🔴 جارٍ المسح المباشر (15 FPS)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span>التقاط صورة</span>
                </button>
              </div>
            </>
          )}

          {/* مدخل ملف الكاميرا المخفي لالتقاط صورة مباشرة */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
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

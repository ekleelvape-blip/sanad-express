import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  ScanLine, QrCode, Camera, AlertTriangle, CheckCircle2, X, Sparkles, 
  ShieldCheck, Box, User, MapPin, DollarSign, RefreshCw, Upload, Image as ImageIcon,
  Zap, ZapOff, FlipHorizontal, Loader2, Check
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
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasZoom, setHasZoom] = useState(false);
  const [maxZoom, setMaxZoom] = useState(3);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const isTransitioningRef = useRef(false);
  const nativeScanLoopRef = useRef(null);

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
    } else if (str.includes('id=')) {
      try {
        const url = new URL(str.startsWith('http') ? str : 'https://dummy.com/' + str);
        const p = url.searchParams.get('id');
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
      setErrorMessage('يرجى توجيه الماسح نحو الباركود أو إدخال رقم الشحنة');
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
      }, 600);
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
        (o.sallaOrderNumber && code === order.sallaOrderNumber)
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
    setErrorMessage(`❌ الباركود الممسوح [${code}] غير مطابق لهذه الشحنة #${order.id}. يرجى توجيه الكاميرا نحو بوليصة هذا الطرد.`);
  };

  // تأكيد مباشر بنقرة واحدة (One-Tap Direct Confirmation)
  const handleDirectConfirm = () => {
    handleVerifyBarcode(order.id);
  };

  // إيقاف الماسح وتنظيف الموارد بأمان
  const stopScanner = async () => {
    if (nativeScanLoopRef.current) {
      cancelAnimationFrame(nativeScanLoopRef.current);
      nativeScanLoopRef.current = null;
    }

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }

    if (isMountedRef.current) {
      setCameraActive(false);
      setCameraStarting(false);
      setTorchOn(false);
      setHasTorch(false);
      setHasZoom(false);
      setZoomLevel(1);
    }
  };

  // حلقة مسح عتادية فائقة السرعة على مستوى كرت الشاشة (GPU Barcode Detector)
  const startNativeScanLoop = () => {
    if (!('BarcodeDetector' in window)) return;

    try {
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a']
      });

      const checkFrame = async () => {
        if (!isMountedRef.current || scannerRef.current === null) return;
        const video = document.querySelector('#sanad-qr-reader video');
        if (video && video.readyState >= 2 && !video.paused) {
          try {
            const detected = await detector.detect(video);
            if (detected && detected.length > 0 && detected[0].rawValue) {
              handleVerifyBarcode(detected[0].rawValue);
              return;
            }
          } catch (e) {}
        }
        nativeScanLoopRef.current = requestAnimationFrame(checkFrame);
      };

      nativeScanLoopRef.current = requestAnimationFrame(checkFrame);
    } catch (e) {
      console.warn('Native BarcodeDetector loop init warning:', e);
    }
  };

  // تشغيل الكاميرا المباشرة بدقة عالية ومجال التقاط واسع من مسافة
  const startScanner = async (preferredCameraId = null) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (isMountedRef.current) {
      setCameraError('');
      setCameraStarting(true);
    }

    try {
      await stopScanner();

      const qrContainer = document.getElementById('sanad-qr-reader');
      if (!qrContainer) {
        if (isMountedRef.current) setCameraStarting(false);
        isTransitioningRef.current = false;
        return;
      }

      // تهيئة الماسح مع دعم كافة صيغ الباركود
      const html5QrCode = new Html5Qrcode('sanad-qr-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      // نافذة مسح واسعة تغطي كامل مجال الرؤية لالتقاط الباركود من مسافة بعيدة
      const scanConfig = {
        fps: 25,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          return {
            width: Math.max(180, Math.floor(viewfinderWidth * 0.94)),
            height: Math.max(140, Math.floor(viewfinderHeight * 0.88))
          };
        }
      };

      try {
        const cams = await Html5Qrcode.getCameras();
        if (isMountedRef.current && cams && cams.length > 0) {
          setAvailableCameras(cams);
        }
      } catch (e) {}

      const cameraConstraint = preferredCameraId 
        ? preferredCameraId 
        : { facingMode: { ideal: 'environment' } };

      const onScanSuccess = (decodedText) => {
        if (isMountedRef.current) {
          handleVerifyBarcode(decodedText);
        }
      };

      await html5QrCode.start(cameraConstraint, scanConfig, onScanSuccess, () => {});

      // فحص قدرات الكاميرا (الفلاش، التركيز التلقائي، والتقريب Zoom)
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities?.();
        const track = html5QrCode.getRunningTrack?.();

        if (capabilities) {
          if (capabilities.torch && isMountedRef.current) setHasTorch(true);
          if (capabilities.zoom && isMountedRef.current) {
            setHasZoom(true);
            setMaxZoom(capabilities.zoom.max || 3);
          }
        }

        if (track && track.applyConstraints) {
          track.applyConstraints({
            advanced: [
              { focusMode: 'continuous' },
              { exposureMode: 'continuous' }
            ]
          }).catch(() => {});
        }
      } catch (e) {}

      if (isMountedRef.current) {
        setCameraActive(true);
        setCameraStarting(false);
        startNativeScanLoop();
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      if (isMountedRef.current) {
        setCameraActive(false);
        setCameraStarting(false);
        const errMsg = String(err?.message || err || '');
        if (errMsg.includes('Permission') || errMsg.includes('NotAllowedError') || errMsg.includes('denied')) {
          setCameraError('يرجى السماح بإذن الكاميرا، أو اضغط على "تأكيد برقم الشحنة ⚡" بالأسفل.');
        } else {
          setCameraError('وجّه الكاميرا نحو الشحنة أو اضغط "تأكيد برقم الشحنة ⚡".');
        }
      }
    } finally {
      isTransitioningRef.current = false;
    }
  };

  // تبديل درجة التقريب (Zoom) للالتقاط من مسافة بعيدة
  const setZoom = async (level) => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ zoom: level }]
      });
      setZoomLevel(level);
    } catch (e) {
      console.warn('Zoom apply error:', e);
    }
  };

  // تبديل الكاميرا
  const toggleCamera = async () => {
    if (availableCameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanner(availableCameras[nextIndex].id);
  };

  // تشغيل / إيقاف الفلاش (الكشاف)
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // تهيئة النافذة وبدء الكاميرا تلقائياً عند الفتح بدون سرقة التركيز
  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setScannedInput('');
      setErrorMessage('');
      setMatchedOtherOrder(null);
      setSuccessVerified(false);
      setIsProcessingPhoto(false);
      
      const timer = setTimeout(() => {
        startScanner();
        // ملحوظة هامة: لا نقوم بعمل input.focus() لمنع ظهور لوحة المفاتيح تلقائياً وخنق الكاميرا على الجوال
      }, 150);

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

  // محرك فك تشفير متعدد المراحل للصور الملتقطة
  const decodeBarcodeFromImageFile = async (file, html5Qr) => {
    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        });
        const bmp = await createImageBitmap(file);
        const results = await detector.detect(bmp);
        if (results && results.length > 0 && results[0].rawValue) {
          return results[0].rawValue;
        }
      } catch (e) {}
    }

    const img = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const maxDim = 1280;
    let { width, height } = img;
    let scale = 1;
    if (width > maxDim || height > maxDim) {
      scale = maxDim / Math.max(width, height);
    }
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, targetW, targetH);

    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a']
        });
        const results = await detector.detect(canvas);
        if (results && results.length > 0 && results[0].rawValue) {
          return results[0].rawValue;
        }
      } catch (e) {}
    }

    const downscaledBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (downscaledBlob) {
      try {
        const res = await html5Qr.scanFile(downscaledBlob, false);
        if (res) return res;
      } catch (e) {}
    }

    return await html5Qr.scanFile(file, false);
  };

  // مسح صورة ملتقطة
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setIsProcessingPhoto(true);

    try {
      const html5Qr = new Html5Qrcode('sanad-qr-temp-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A
        ],
        verbose: false
      });

      const decoded = await decodeBarcodeFromImageFile(file, html5Qr);
      try { html5Qr.clear(); } catch (clErr) {}

      if (decoded) {
        handleVerifyBarcode(decoded);
      } else {
        throw new Error('No barcode detected');
      }
    } catch (err) {
      sound.playOrderAlert();
      setErrorMessage('لم يتم العثور على باركود واضح بالصورة. يمكنك المسح المباشر بالكاميرا أو الضغط على "تأكيد برقم الشحنة ⚡".');
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  if (!isOpen || !order) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleVerifyBarcode(scannedInput);
  };

  const handleSimulateWrongScan = () => {
    const wrong = allOrders.find(o => o.id !== order.id) || { id: 'SND-9999', customerName: 'عميل آخر' };
    setScannedInput(wrong.id);
    handleVerifyBarcode(wrong.id);
  };

  return (
    <div className="fixed inset-0 z-[8000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      {/* حاوية غير مرئية لمعالجة الصور */}
      <div id="sanad-qr-temp-reader" style={{ display: 'none' }}></div>

      <div className="w-full max-w-md bg-[#0d1424] border-2 border-cyan-500/60 rounded-3xl p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-100 relative overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* شريط الإشعاع العلوي */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-[#00d2d3] to-indigo-500"></div>

        {/* الترويسة وأيقونة نوع العملية */}
        <div className="flex items-center justify-between pb-2.5 border-b border-cyan-950 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${
              mode === 'pickup'
                ? 'bg-cyan-950/80 border border-cyan-500/50 text-[#00d2d3] shadow-cyan-900/40'
                : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 shadow-emerald-900/40'
            }`}>
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-black text-sm text-white flex items-center gap-1.5">
                <span>{mode === 'pickup' ? 'مسح واستلام من المستودع' : 'مسح وتسليم للعميل'}</span>
                <span className="text-[10px] bg-cyan-950 text-[#00d2d3] border border-cyan-800 px-2 py-0.5 rounded-full font-bold">إلزامي 🛡️</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {mode === 'pickup' ? 'تحقق من مطابقة بوليصة الكرتون' : 'تحقق من تسليم الطرد الصحيح'}
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
        <div className="bg-slate-900/90 border border-cyan-900/60 rounded-2xl p-2.5 mb-2.5 text-xs space-y-1 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Box className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span>الشحنة المستهدفة:</span>
            </div>
            <span className="font-mono font-black text-sm text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-800">
              #{order.id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px]">
            <div className="flex items-center gap-1 text-slate-300 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-bold justify-end">
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span>{order.totalAmount} ر.س ({order.paymentMethod === 'cash' ? 'كاش COD' : 'مدفوع'})</span>
            </div>
          </div>
        </div>

        {/* نافذة المسح المباشر بالكاميرا الفائقة الدقة */}
        <div className="relative w-full h-60 sm:h-72 bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/50 flex flex-col items-center justify-center mb-2.5 shadow-[0_0_25px_rgba(0,210,211,0.15)]">
          {/* عنصر حاوية Html5Qrcode المباشرة */}
          <div id="sanad-qr-reader" className="w-full h-full object-cover"></div>

          {/* حالة معالجة الصورة الملتقطة */}
          {isProcessingPhoto && (
            <div className="absolute inset-0 bg-[#070c16]/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3 z-30 animate-in fade-in">
              <Loader2 className="w-10 h-10 text-[#00d2d3] animate-spin" />
              <div className="text-sm font-bold text-white">جاري فك تشفير الباركود بدقة عالية...</div>
            </div>
          )}

          {/* في حال كانت الكاميرا المباشرة قيد البدء أو غير مفعلة */}
          {!cameraActive && !isProcessingPhoto && (
            <div className="absolute inset-0 bg-[#070c16] flex flex-col items-center justify-center p-4 text-center space-y-2 z-10">
              {cameraStarting ? (
                <>
                  <RefreshCw className="w-8 h-8 text-[#00d2d3] animate-spin" />
                  <span className="text-xs font-bold text-slate-200">جاري فتح الكاميرا المباشرة...</span>
                  <p className="text-[10px] text-slate-400">يرجى الضغط على "سماح / Allow" عند طلب إذن الكاميرا</p>
                </>
              ) : (
                <>
                  <QrCode className="w-10 h-10 text-slate-500" />
                  <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                    {cameraError || 'وجّه الكاميرا نحو الكرتون من أي مسافة للمسح التلقائي المباشر.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startScanner()}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>بدء الكاميرا 📷</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-600 active:scale-95 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>التقاط صورة 📸</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* زوايا إطار التصويب التفاعلي للمسح المباشر */}
          {cameraActive && !isProcessingPhoto && (
            <>
              {/* خط الليزر الفائق للمسح */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#00d2d3] to-transparent shadow-[0_0_15px_#00d2d3] animate-pulse pointer-events-none"></div>
              
              {/* زوايا التصويب المضيئة */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#00d2d3] pointer-events-none"></div>
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#00d2d3] pointer-events-none"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#00d2d3] pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#00d2d3] pointer-events-none"></div>

              {/* شريط الإحصائيات وأدوات التحكم الذكية */}
              <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-auto">
                <span className="text-[10px] bg-black/80 backdrop-blur-md text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-900/60 shadow flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  مسح لحظي ذكي (من مسافة)
                </span>

                {/* أزرار التقريب Zoom إذا كانت مدعومة من هاتف المندوب */}
                {hasZoom && (
                  <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setZoom(1)}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${zoomLevel === 1 ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
                    >
                      1x
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(Math.min(maxZoom, 2))}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${zoomLevel > 1 ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
                    >
                      2x 🔍
                    </button>
                  </div>
                )}
              </div>

              {/* شريط التحكم السفلي بالكاميرا */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-1">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      title="تشغيل الفلاش"
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 cursor-pointer ${
                        torchOn 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-900/90 text-slate-200 border-slate-700'
                      }`}
                    >
                      {torchOn ? <ZapOff className="w-3 h-3" /> : <Zap className="w-3 h-3 text-amber-400" />}
                      <span>{torchOn ? 'إطفاء' : 'فلاش'}</span>
                    </button>
                  )}

                  {availableCameras.length > 1 && (
                    <button
                      type="button"
                      onClick={toggleCamera}
                      title="تبديل الكاميرا"
                      className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <FlipHorizontal className="w-3 h-3 text-cyan-400" />
                      <span>عدسة أخرى</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span>التقاط صورة</span>
                </button>
              </div>
            </>
          )}

          {/* مدخل ملف الكاميرا المخفي لالتقاط صورة مباشرة عبر الهاتف */}
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
          <div className="mb-2.5 p-2.5 bg-rose-950/90 border-2 border-rose-600 rounded-2xl text-xs space-y-1 animate-shake text-rose-200">
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
          <div className="mb-2.5 p-2.5 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl text-xs flex items-center gap-2.5 text-emerald-200 animate-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 animate-bounce" />
            <div>
              <div className="font-black text-emerald-300 text-sm">✅ تم التحقق والمطابقة بنجاح!</div>
              <div className="text-[10px] text-emerald-200">
                {mode === 'pickup' ? 'تم استلام الطرد من المستودع بنجاح.' : 'تم تأكيد مطابقة الطرد للعميل.'}
              </div>
            </div>
          </div>
        )}

        {/* زر التأكيد المباشر بنقرة واحدة (One-Tap Direct Confirmation) */}
        <div className="space-y-2 mb-2">
          <button
            type="button"
            onClick={handleDirectConfirm}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد استلام الطرد مباشرة (#{order.id}) ⚡</span>
          </button>
        </div>

        {/* حقل المسح الفوري وقارئ الباركود (Barcode Scanner Input) */}
        <form onSubmit={handleFormSubmit} className="space-y-1 mb-2">
          <div className="relative">
            <input
              type="text"
              dir="ltr"
              value={scannedInput}
              onChange={(e) => setScannedInput(e.target.value)}
              placeholder={`امسح الباركود أو اكتب: ${order.id}`}
              className="w-full bg-slate-900 border-2 border-cyan-900/60 focus:border-[#00d2d3] rounded-2xl px-4 py-2 text-xs font-mono text-white placeholder:text-slate-500 outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute left-1.5 top-1 bottom-1 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>تحقق 🔍</span>
            </button>
          </div>
        </form>

        {/* زر تجربة طرد خاطئ للتحقق من صمام الأمان */}
        <div className="pt-1.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleSimulateWrongScan}
            className="w-full py-1.5 px-3 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all"
            title="تجربة محاكاة مسح طرد خاطئ للتحقق من صمام الأمان"
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>تجربة محاكاة مسح طرد خاطئ (فحص صمام الأمان) ⚠️</span>
          </button>
        </div>

      </div>
    </div>
  );
}

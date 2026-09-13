import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  ScanLine, QrCode, Camera, AlertTriangle, CheckCircle2, X, Sparkles, 
  ShieldCheck, Box, User, MapPin, DollarSign, RefreshCw, Upload, Image as ImageIcon,
  Zap, ZapOff, FlipHorizontal, Loader2, ZoomIn
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
  const inputRef = useRef(null);
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
    setErrorMessage(`❌ الباركود الممسوح [${code}] غير مطابق لهذه الشحنة #${order.id}. يرجى مسح البوليصة الصحيحة.`);
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
      } catch (e) {
        // تجاهل تحذيرات الإيقاف
      }
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
              return; // تم الالتقاط بنجاح
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

  // تشغيل الكاميرا المباشرة بدقة 1080p عالية ومجال التقاط واسع من مسافة بعيدة
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

      // فحص قائمة الكاميرات المتاحة
      try {
        const cams = await Html5Qrcode.getCameras();
        if (isMountedRef.current && cams && cams.length > 0) {
          setAvailableCameras(cams);
        }
      } catch (e) {}

      // إعداد الكاميرا مع تفضيل دقة 1080p FHD والتركيز المستمر (Continuous Auto-Focus)
      const cameraConstraint = preferredCameraId 
        ? preferredCameraId 
        : { 
            facingMode: { ideal: 'environment' }
          };

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

        // تطبيق التركيز التلقائي المستمر للحفاظ على حدة الباركود من مسافة بعيدة
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
        // بدء محرك المسح العتادي المزدوج فائق السرعة
        startNativeScanLoop();
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      if (isMountedRef.current) {
        setCameraActive(false);
        setCameraStarting(false);
        const errMsg = String(err?.message || err || '');
        if (errMsg.includes('Permission') || errMsg.includes('NotAllowedError') || errMsg.includes('denied')) {
          setCameraError('يرجى السماح بإذن الكاميرا من إعدادات المتصفح، أو استخدم زر "التقاط صورة 📸" فوراً.');
        } else {
          setCameraError('وجّه الكاميرا أو اضغط على "تشغيل الكاميرا 📷" للمسح المباشر.');
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

  // تهيئة النافذة وبدء الكاميرا تلقائياً عند الفتح
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
        if (inputRef.current) inputRef.current.focus();
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

  // محرك فك تشفير متعدد المراحل فائق القوة للصور الملتقطة بالجوال
  const decodeBarcodeFromImageFile = async (file, html5Qr) => {
    // 1. المحاولة الأولى: المعالج العتادي المدمج بالهاتف (BarcodeDetector API)
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

    // 2. قراءة الصورة وضبط أبعادها (Downscaling إلى 1280px)
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

    // فحص بالمعالج العتادي على الصورة المعدلة الأبعاد
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

    // 3. المحاولة عبر محرك Html5Qrcode على الصورة المحسنة
    const downscaledBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (downscaledBlob) {
      try {
        const res = await html5Qr.scanFile(downscaledBlob, false);
        if (res) return res;
      } catch (e) {}
    }

    // 4. محاولة التدوير 90 درجة
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = targetH;
    rotCanvas.height = targetW;
    const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });
    rotCtx.translate(targetH / 2, targetW / 2);
    rotCtx.rotate((90 * Math.PI) / 180);
    rotCtx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);

    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a']
        });
        const results = await detector.detect(rotCanvas);
        if (results && results.length > 0 && results[0].rawValue) {
          return results[0].rawValue;
        }
      } catch (e) {}
    }

    const rotBlob = await new Promise(resolve => rotCanvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (rotBlob) {
      try {
        const res = await html5Qr.scanFile(rotBlob, false);
        if (res) return res;
      } catch (e) {}
    }

    // 5. تعزيز التباين
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      const enhanced = gray < 120 ? Math.max(0, gray * 0.6) : Math.min(255, gray * 1.35);
      d[i] = enhanced;
      d[i + 1] = enhanced;
      d[i + 2] = enhanced;
    }
    ctx.putImageData(imgData, 0, 0);

    const enhancedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (enhancedBlob) {
      try {
        const res = await html5Qr.scanFile(enhancedBlob, false);
        if (res) return res;
      } catch (e) {}
    }

    // 6. المحاولة الأخيرة على الملف الأصلي
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
      setErrorMessage('لم يتم العثور على باركود واضح بالصورة. يمكنك المسح المباشر بالكاميرا أو كتابة الرقم.');
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
      {/* حاوية غير مرئية لمعالجة الصور */}
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
                  ? 'التقاط فوري مباشر من مسافة لبوليصة الكرتون'
                  : 'تحقق فوري من تسليم الطرد الصحيح للعميل'}
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

        {/* نافذة المسح المباشر بالكاميرا الفائقة الدقة */}
        <div className="relative w-full h-64 sm:h-72 bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/50 flex flex-col items-center justify-center mb-3 shadow-[0_0_25px_rgba(0,210,211,0.15)]">
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
            <div className="absolute inset-0 bg-[#070c16] flex flex-col items-center justify-center p-4 text-center space-y-2.5 z-10">
              {cameraStarting ? (
                <>
                  <RefreshCw className="w-9 h-9 text-[#00d2d3] animate-spin" />
                  <span className="text-xs font-bold text-slate-200">جاري فتح الكاميرا المباشرة بدقة 1080p...</span>
                  <p className="text-[10px] text-slate-400">يرجى الضغط على "سماح / Allow" عند طلب إذن الكاميرا</p>
                </>
              ) : (
                <>
                  <QrCode className="w-12 h-12 text-slate-500" />
                  <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                    {cameraError || 'وجّه الكاميرا نحو الكرتون من أي مسافة للمسح التلقائي المباشر.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startScanner()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>بدء المسح المباشر 📷</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-600 active:scale-95 transition-all"
                    >
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
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
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer ${
                        torchOn 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-900/90 text-slate-200 border-slate-700'
                      }`}
                    >
                      {torchOn ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
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
                  className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
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

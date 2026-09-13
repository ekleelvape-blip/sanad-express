import React, { useRef, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw, PenTool, ShieldCheck, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function DriverSettlementSignModal({
  isOpen,
  onClose,
  request,
  driverName,
  onApprove,
  onReject
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تهيئة لوحة التوقيع بدقة عالية
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // ضبط الحجم الفعلي وحجم الشاشة لتفادي التشويش
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // إعدادات قلم التوقيع
    ctx.strokeStyle = '#0284c7'; // أزرق توقيع رسمي
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setHasDrawn(false);
  }, [isOpen]);

  if (!isOpen || !request) return null;

  // دوال الرسم بالماوس واللمس
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // تأكيد الموافقة وإرسال التوقيع
  const handleConfirmApproval = async () => {
    if (!hasDrawn || !canvasRef.current) {
      alert('يرجى التوقيع داخل المربع بالأصبع قبل اعتماد التسوية.');
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      await onApprove(request.id, signatureDataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // إرسال الاعتراض
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('يرجى توضيح سبب الاعتراض أو الخطأ بالحساب.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(request.id, rejectReason.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-[0_0_50px_rgba(0,210,211,0.25)] text-white text-right relative my-auto max-h-[95vh] flex flex-col">
        
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* الترويسة */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
            ✍️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              إقرار وتوريد عهدة نقدية
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                {request.id}
              </span>
            </h2>
            <p className="text-xs text-slate-400">مطلوب توقيعك لاعتماد تصفية وتوريد الكاش</p>
          </div>
        </div>

        {/* جسم النافذة مع التمرير */}
        <div className="overflow-y-auto space-y-3.5 pr-1">

          {/* بطاقة المبلغ الإجمالي للتوريد */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-blue-950/40 border border-amber-500/40 text-center relative overflow-hidden">
            <div className="text-xs text-amber-300 font-bold mb-1">المبلغ المطلوب توريده وتسليمه للخزينة:</div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {Number(request.amount || 0).toLocaleString()} <span className="text-sm font-normal text-slate-300">﷼</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              سيتم تصفير هذا المبلغ من عهدتك وإصدار سند قبض رسمي معتمد
            </div>
          </div>

          {/* تفاصيل الطلبات المشمولة بالتسوية */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
            <div 
              onClick={() => setShowOrdersList(!showOrdersList)}
              className="flex items-center justify-between cursor-pointer text-xs font-bold text-slate-300 select-none"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>الشحنات المشمولة بالتسوية:</span>
                <span className="text-amber-400 font-mono font-bold">({request.orderCount || (request.orderIds || []).length} شحنة)</span>
              </div>
              {showOrdersList ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showOrdersList && (
              <div className="mt-3 pt-2 border-t border-slate-800 space-y-2 max-h-36 overflow-y-auto">
                {request.ordersSummary && request.ordersSummary.length > 0 ? (
                  request.ordersSummary.map((ord) => (
                    <div key={ord.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-mono font-bold text-slate-200">{ord.id}</span>
                        <span className="text-slate-400 mr-2">{ord.customerName}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-400">{ord.totalAmount} ﷼</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 text-center py-1">
                    تصفير وتسوية كامل العهدة المسجلة بالخزينة.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ملاحظات الإدارة / المحاسب */}
          {request.notes && (
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
              <span className="text-slate-400 font-bold ml-1">ملاحظة المحاسب:</span>
              <span className="text-slate-200">{request.notes}</span>
            </div>
          )}

          {/* صندوق الاعتراض إذا فُعّل */}
          {showRejectBox ? (
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>سبب الاعتراض أو الاختلاف بالحساب:</span>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="وضح سبب الاختلاف أو الشحنات التي لم يتم استلام كاشها..."
                rows={2}
                className="w-full bg-slate-950 border border-rose-800/50 rounded-xl p-2 text-xs text-white outline-none focus:border-rose-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmReject}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'تأكيد إرسال الاعتراض للإدارة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                >
                  تراجع
                </button>
              </div>
            </div>
          ) : (
            /* لوحة التوقيع الإلكتروني */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span>لوحة التوقيع الإلكتروني الحي (وقع بالأصبع هنا):</span>
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  title="مسح وإعادة المحاولة"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>مسح</span>
                </button>
              </div>

              {/* حاوية لوحة التوقيع */}
              <div className="relative rounded-2xl border-2 border-dashed border-cyan-500/50 bg-white shadow-inner overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 touch-none cursor-crosshair block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs font-bold opacity-60">
                    <span className="text-xl mb-1">✍️</span>
                    <span>وقع هنا بإصبعك على الشاشة</span>
                  </div>
                )}
              </div>

              {/* نص التعهد والإقرار الرسمي */}
              <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-2 text-[10.5px] text-cyan-200 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>إقرار استلام وتوريد:</strong> أقر أنا المندوب <strong>({driverName || 'المعتمد'})</strong> بصحة البيانات أعلاه وأني قمت بتسليم كامل المبلغ الموضح لإدارة المتجر/الفرع، ويعد هذا التوقيع الإلكتروني إقراراً قانونياً ملزماً وسند قبض رسمي.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* شريط الأزرار السفلي */}
        {!showRejectBox && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-800 mt-2">
            <button
              type="button"
              disabled={!hasDrawn || isSubmitting}
              onClick={handleConfirmApproval}
              className={
                'flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ' +
                (hasDrawn && !isSubmitting
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700')
              }
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الاعتماد...' : '✍️ موافقة واعتماد التوريد والتوقيع'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRejectBox(true)}
              className="py-3 px-3 rounded-xl bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/50 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
              title="اعتراض على المبالغ أو الطلبات"
            >
              اعتراض
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

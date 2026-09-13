import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, X, DollarSign, Camera, Key, PenTool, RotateCcw, 
  ShieldCheck, CreditCard, Banknote, Sparkles, Smartphone, Upload, Check, AlertCircle 
} from 'lucide-react';
import { sound } from '../utils/sound';
import { getDeliveryFeeByAddress } from '../utils/geo';

export default function DriverProofOfDeliveryModal({
  isOpen,
  order,
  onClose,
  onConfirmDelivery
}) {
  if (!isOpen || !order) return null;

  // احتساب عمولة المندوب ورسم التوصيل المعتمد للطلب بدقة وفق التسعيرة الرسمية
  const calculatedCommission = (() => {
    if (order.driverCommission && Number(order.driverCommission) > 0 && Number(order.driverCommission) !== 20) {
      return Number(order.driverCommission);
    }
    if (order.deliveryFee && Number(order.deliveryFee) > 0 && Number(order.deliveryFee) !== 20 && Number(order.deliveryFee) !== 17.39) {
      return Number(order.deliveryFee);
    }
    return getDeliveryFeeByAddress(order.customerAddress || order.city || '');
  })();
  const commissionAmount = Number(calculatedCommission || 25).toFixed(2);

  // طريقة الدفع المستلمة: 'cash' | 'mada' | 'bank_transfer'
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod === 'cash' ? 'cash' : 'mada');

  // حاسبة الصرف السريع لكاش الدفع عند الاستلام
  const [receivedCash, setReceivedCash] = useState('');
  const totalDue = Number(order.totalAmount || 0);
  const parsedReceived = Number(receivedCash) || 0;
  const changeDue = parsedReceived > totalDue ? (parsedReceived - totalDue) : 0;
  const underpaid = parsedReceived > 0 && parsedReceived < totalDue ? (totalDue - parsedReceived) : 0;

  // تبويب إثبات التسليم المفضل: 'signature' (توقيع) | 'otp' (رمز) | 'photo' (صورة)
  const [podTab, setPodTab] = useState('signature');

  // توقيع العميل الرقمي
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // رمز التحقق OTP
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // صورة إثبات التسليم (Photo POD)
  const [photoProof, setPhotoProof] = useState(null);
  const fileInputRef = useRef(null);

  // ملاحظات التسليم
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // إعداد مساحة توقيع العميل التفاعلية (HTML5 Canvas)
  useEffect(() => {
    if (podTab !== 'signature') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#00d2d3';
  }, [podTab]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // معالجة التقاط صورة الشحنة
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoProof(ev.target?.result);
        sound.pop();
      };
      reader.readAsDataURL(file);
    }
  };

  // تأكيد التسليم النهائي
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let signatureData = null;
      if (canvasRef.current && hasSignature) {
        signatureData = canvasRef.current.toDataURL('image/png');
      }

      await onConfirmDelivery({
        orderId: order.id,
        paymentMethod,
        receivedCash: parsedReceived,
        changeGiven: changeDue,
        signature: signatureData,
        otpCode,
        photoProof,
        notes: deliveryNotes,
        commissionAmount: Number(commissionAmount)
      });
      sound.playSuccess();
    } catch (err) {
      console.error(err);
      sound.playOrderAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6500] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-['Tajawal','Cairo',sans-serif]">
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative animate-in zoom-in-95 max-h-[95vh] overflow-y-auto" dir="rtl">
        
        {/* رأس النافذة */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>إثبات وإنهاء تسليم الشحنة</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">#{order.id}</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  العميل: <strong className="text-slate-800 dark:text-slate-200">{order.customerName}</strong>
                </p>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[10px]">
                  عمولة المشوار: +{commissionAmount} ﷼
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. تحديد طريقة التحصيل المالي */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            طريقة التحصيل المستلمة من العميل:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-500" />
              <span>💵 كاش باليد</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('mada')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                paymentMethod === 'mada'
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 border-[#00d2d3] text-cyan-800 dark:text-cyan-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4 text-cyan-500" />
              <span>💳 شبكة مدى POS</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                paymentMethod === 'bank_transfer'
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-800 dark:text-purple-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-4 h-4 text-purple-500" />
              <span>🏦 تحويل بنكي</span>
            </button>
          </div>
        </div>

        {/* 2. حاسبة الصرف السريع لكاش التحصيل عند الاستلام */}
        {paymentMethod === 'cash' && (
          <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-bold">المبلغ المطلوب تحصيله:</span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                {totalDue.toFixed(2)} ﷼
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400">كم سلّمك العميل كاش؟</span>
                {parsedReceived > 0 && changeDue > 0 && (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                    الباقي للعميل: {changeDue.toFixed(2)} ﷼ 💸
                  </span>
                )}
                {underpaid > 0 && (
                  <span className="font-bold text-rose-500">
                    المبلغ ناقص: -{underpaid.toFixed(2)} ﷼ ⚠️
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={receivedCash}
                  onChange={(e) => setReceivedCash(e.target.value)}
                  placeholder={`اكتب المبلغ أو اضغط على الأزرار`}
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-mono text-sm outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setReceivedCash(String(totalDue))}
                  className="px-2.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-mono text-xs font-bold cursor-pointer"
                >
                  المبلغ بالضبط
                </button>
              </div>

              {/* أزرار سريعة للعملات النقدية المتداولة */}
              <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto pb-0.5">
                {[50, 100, 150, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setReceivedCash(String(amt))}
                    className="px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-cyan-500 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {amt} ﷼
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. جناح إثبات التسليم (Proof of Delivery Tabs) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>طريقة إثبات وتوثيق التسليم:</span>
            </label>
            <span className="text-[10px] text-slate-500">اختر الطريقة المتوفرة</span>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => setPodTab('signature')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                podTab === 'signature'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>توقيع العميل ✍️</span>
            </button>

            <button
              type="button"
              onClick={() => setPodTab('otp')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                podTab === 'otp'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>رمز OTP 🔢</span>
            </button>

            <button
              type="button"
              onClick={() => setPodTab('photo')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                podTab === 'photo'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>صورة الطرد 📷</span>
            </button>
          </div>

          {/* محتوى تبويب 1: توقيع العميل بالإصبع */}
          {podTab === 'signature' && (
            <div className="space-y-1.5">
              <div className="relative bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={130}
                  className="w-full h-[120px] touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-bold">
                    ✍️ اطلب من العميل التوقيع بإصبعه هنا
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={hasSignature ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                  {hasSignature ? '✓ تم تسجيل التوقيع بنجاح' : 'التوقيع إلزامي أو اختر OTP'}
                </span>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>مسح التوقيع</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* محتوى تبويب 2: رمز OTP الاستلام */}
          {podTab === 'otp' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="text-slate-600 dark:text-slate-400">
                اطلب من العميل إعطاءك رمز التسليم (المكون من 4 أرقام المرسل لجواله):
              </div>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 4892"
                  className="w-44 text-center font-mono text-xl tracking-widest bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="text-center text-[10px] text-slate-500">
                في حال تعذر استلام العميل للرمز، يمكن اختيار "توقيع العميل" أو "صورة الطرد".
              </div>
            </div>
          )}

          {/* محتوى تبويب 3: تصوير الطرد عند الباب */}
          {podTab === 'photo' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-center text-xs">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              {photoProof ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 max-h-36">
                  <img src={photoProof} alt="إثبات التسليم" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoProof(null)}
                    className="absolute top-2 left-2 bg-black/70 text-white rounded-full p-1 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-cyan-500 hover:border-cyan-500 transition-colors cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-cyan-500" />
                  <span className="font-bold">التقاط صورة للطرد عند باب العميل 📸</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. أزرار الاعتماد والإلغاء */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>جاري حفظ وتأكيد التسليم...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>تأكيد التسليم بنجاح وإيداع العمولة بالرصيد ✅ (+{commissionAmount} ﷼)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            تراجع
          </button>
        </div>

      </div>
    </div>
  );
}

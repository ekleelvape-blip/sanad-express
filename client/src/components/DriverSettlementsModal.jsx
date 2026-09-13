import React, { useState } from 'react';
import { 
  X, Receipt, CheckCircle2, Clock, DollarSign, 
  FileText, Calendar, ShieldCheck, Printer, ArrowUpRight,
  ExternalLink, ChevronRight, AlertCircle, Building2
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function DriverSettlementsModal({
  isOpen,
  onClose,
  driver,
  settlementsData,
  onOpenSignModal,
  branches = []
}) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' | 'pending'

  if (!isOpen || !driver) return null;

  const requests = settlementsData?.requests || [];
  const transactions = settlementsData?.transactions || [];

  const pendingRequests = requests.filter(r => r.status === 'pending_driver_signature');
  const approvedRequests = requests.filter(r => r.status === 'approved');

  // دمج العمليات المسواة إما من transactions أو approvedRequests
  const allSettledList = [...transactions];
  approvedRequests.forEach(req => {
    if (!allSettledList.some(t => t.receiptNumber === req.receiptNumber || t.settlementRequestId === req.id)) {
      allSettledList.push({
        id: req.id,
        receiptNumber: req.receiptNumber || req.id,
        amount: req.amount,
        driverId: req.driverId,
        driverName: req.driverName,
        branchId: req.branchId,
        orderCount: req.orderCount,
        settledOrderIds: req.orderIds || [],
        driverSignature: req.driverSignature,
        timestamp: req.signedAt || req.createdAt,
        notes: req.notes
      });
    }
  });

  // ترتيب من الأحدث إلى الأقدم
  allSettledList.sort((a, b) => new Date(b.timestamp || b.signedAt || 0) - new Date(a.timestamp || a.signedAt || 0));

  const totalSettledCash = allSettledList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const getBranchName = (bId) => {
    const b = branches.find(item => item.id === bId);
    return b ? b.name : 'فرع إكليل الدمام';
  };

  return (
    <div className="fixed inset-0 z-[6500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* ترويسة النافذة */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>سجل التسويات وسندات التوريد</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                  {driver.name}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">سندات القبض المعتمدة والمبالغ الموردة لخزينة المتجر</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* شريط الإحصائيات السريعة */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400">إجمالي المورد للخزينة</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
              {totalSettledCash.toFixed(2)} <span className="text-[10px]">﷼</span>
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400">سندات معتمدة</div>
            <div className="text-base font-black font-mono text-cyan-400 mt-0.5">
              {allSettledList.length} <span className="text-[10px]">سند</span>
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400">العهدة الحالية</div>
            <div className="text-base font-black font-mono text-amber-400 mt-0.5">
              {(Number(driver.cashOnHand) || 0).toFixed(2)} <span className="text-[10px]">﷼</span>
            </div>
          </div>
        </div>

        {/* أزرار التبويب: المعتمدة vs بانتظار التوقيع */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/30 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>السندات المعتمدة ({allSettledList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>بانتظار توقيعك ({pendingRequests.length})</span>
            {pendingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1.5 left-2"></span>
            )}
          </button>
        </div>

        {/* محتوى القوائم */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* 1. تبويب بانتظار التوقيع */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <div className="text-xs font-bold text-slate-300">لا توجد طلبات تسوية معلقة حالياً</div>
                  <p className="text-[11px] text-slate-500">حسابك وعُهدتك متطابقة تماماً مع إدارة المتجر</p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-4 shadow-lg space-y-3 animate-pulse-border"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                        {req.id}
                      </span>
                      <span className="text-xs font-black font-mono text-amber-400">
                        {req.amount} ر.س
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-white">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{getBranchName(req.branchId)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        يشمل {req.orderCount || req.orderIds?.length || 0} شحنات تم تسليمها
                      </div>
                      {req.notes && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl">
                          {req.notes}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenSignModal) onOpenSignModal(req);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <span>مراجعة وتوقيع السند الآن ✍️</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. تبويب السندات المعتمدة */}
          {activeTab === 'approved' && (
            <div className="space-y-3">
              {allSettledList.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl">
                    📄
                  </div>
                  <div className="text-xs font-bold text-slate-300">لا توجد سندات تسوية معتمدة مسجلة بعد</div>
                  <p className="text-[11px] text-slate-500">عند توريد أي عهدة للمتجر سيظهر سند القبض الرسمي هنا فوراً</p>
                </div>
              ) : (
                allSettledList.map((item, idx) => (
                  <div
                    key={item.receiptNumber || item.id || idx}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 shadow-sm space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
                          {item.receiptNumber || 'REC-SANAD'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>معتمد ومسوى</span>
                        </span>
                      </div>
                      <span className="font-mono font-black text-sm text-emerald-400">
                        {Number(item.amount || 0).toFixed(2)} ﷼
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{item.timestamp ? new Date(item.timestamp).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : 'مسجل اليوم'}</span>
                      </div>
                      <div className="font-bold text-slate-300">
                        {getBranchName(item.branchId)}
                      </div>
                    </div>

                    {/* صورة مصغرة للتوقيع الإلكتروني للمندوب */}
                    <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>التوقيع الإلكتروني المعتمد للمندوب:</span>
                      </div>
                      {item.driverSignature ? (
                        <img 
                          src={item.driverSignature} 
                          alt="توقيع المندوب" 
                          className="h-7 max-w-[90px] object-contain bg-white/90 rounded px-1"
                        />
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">موثق بالخزينة ✓</span>
                      )}
                    </div>

                    {/* زر استعراض السند الرسمي */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.pop();
                        setSelectedReceipt(item);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>عرض السند المالي الرسمي</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* ذيل النافذة */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* نافذة استعراض سند القبض المالي الرسمي A4 */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[7500] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200 text-right">
            
            {/* ترويسة السند */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center gap-2">
                <img src="/sanad-express-logo.jpg?v=3" alt="سند" className="w-10 h-10 rounded-xl object-cover border" />
                <div>
                  <div className="font-black text-sm text-slate-900">سند إكسبريس SANAD EXPRESS</div>
                  <div className="text-[10px] text-slate-500 font-mono">سند قبض وتوريد نقدية عهدة معتمد</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* تفاصيل السند */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">رقم السند المالي:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{selectedReceipt.receiptNumber || 'REC-SANAD'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">اسم المندوب:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.driverName || driver.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الفرع المورد له:</span>
                <span className="font-bold text-slate-900">{getBranchName(selectedReceipt.branchId)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono text-slate-700">
                  {selectedReceipt.timestamp ? new Date(selectedReceipt.timestamp).toLocaleString('ar-SA') : 'الآن'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-800">المبلغ المسوى والمورد:</span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  {Number(selectedReceipt.amount || 0).toFixed(2)} ر.س
                </span>
              </div>
            </div>

            {/* توقيع المندوب الحي */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-500">التوقيع الإلكتروني المعتمد للمندوب:</div>
              {selectedReceipt.driverSignature ? (
                <img 
                  src={selectedReceipt.driverSignature} 
                  alt="توقيع المندوب" 
                  className="h-16 mx-auto object-contain"
                />
              ) : (
                <div className="text-xs text-emerald-600 font-bold py-2">تم التوثيق والترصيد إلكترونياً ✓</div>
              )}
              <div className="text-[9px] text-slate-400 font-mono">
                كود التوثيق الأمني: {selectedReceipt.receiptNumber?.replace(/\D/g, '') || '987623'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

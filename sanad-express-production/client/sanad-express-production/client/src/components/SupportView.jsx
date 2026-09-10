import React from 'react';
import { Headphones, Phone, Mail, MessageSquare, HelpCircle, FileText } from 'lucide-react';

export default function SupportView() {
  const faqs = [
    { q: 'كيف يتم تسليم الشحنات وتحصيل مبالغ الدفع عند الاستلام (COD)؟', a: 'يقوم المندوب بتسليم الشحنة للعميل ثم الضغط على "تم التسليم واستلام الكاش"، فيتحول المبلغ تلقائياً لمحفظته في التطبيق لحين تسويته مع المتجر.' },
    { q: 'متى تتم تسوية مبالغ الدفع عند الاستلام وإيداعها في الخزينة؟', a: 'يتم ذلك من خلال لوحة المعاملات المالية بالضغط على "تسوية طلبات الدفع عند الاستلام"، حيث يتم تصفير المبلغ من محفظة المندوب وإيداعه في محفظة الكاش المستلم للمتجر مع إصدار سند رقمي.' },
    { q: 'ما هو مقاس الطباعة المعتمد لبوليصة الشحن الحرارية؟', a: 'المقاس المعتمد هو 4×6 بوصة (100mm × 150mm)، وهو مقاس قياسي يتوافق مع كافة طابعات الباركود الحرارية (Zebra, Xprinter, TSC).' }
  ];

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-emerald-400" />
            <span>مركز الدعم الفني والمساعدة - سند إكسبريس</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            دليل الاستخدام السريع، قنوات الدعم المباشر، والأسئلة الشائعة
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-[#0f1b23] border border-slate-800 p-5 rounded-3xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">📞</div>
          <div className="font-bold text-slate-100 text-sm">الاتصال بالدعم الفني</div>
          <p className="text-slate-400 text-[11px]">متاح على مدار الساعة لمتابعة بلاغات التوصيل والمشاوير</p>
          <div className="font-mono text-emerald-400 font-bold pt-1">920000000</div>
        </div>
        <div className="bg-[#0f1b23] border border-slate-800 p-5 rounded-3xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">💬</div>
          <div className="font-bold text-slate-100 text-sm">محادثة واتساب سريعة</div>
          <p className="text-slate-400 text-[11px]">تواصل فوري مع مشرف عمليات المناديب الميدانية</p>
          <a href="https://wa.me/966500000000" target="_blank" rel="noreferrer" className="inline-block text-emerald-400 font-bold underline pt-1">فتح محادثة واتساب</a>
        </div>
        <div className="bg-[#0f1b23] border border-slate-800 p-5 rounded-3xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">📄</div>
          <div className="font-bold text-slate-100 text-sm">دليل التشغيل والطباعة</div>
          <p className="text-slate-400 text-[11px]">شرح إعداد طابعات الملصقات الحرارية 4×6 وطباعة المانيفست</p>
          <div className="text-purple-400 font-bold pt-1">دليل سند إكسبريس الرسمي</div>
        </div>
      </div>
      <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>الأسئلة الشائعة والأكثر تكراراً:</span>
        </h3>
        <div className="space-y-3 text-xs">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <span className="text-emerald-400">س:</span>
                <span>{faq.q}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pr-4">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
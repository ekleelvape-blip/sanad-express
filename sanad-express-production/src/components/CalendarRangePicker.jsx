import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Check, X, Clock, Sparkles } from 'lucide-react';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const DAYS_OF_WEEK = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function CalendarRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectingStep, setSelectingStep] = useState('start'); // 'start' or 'end'
  const containerRef = useRef(null);

  // إغلاق التقويم عند النقر خارجه
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // الحصول على عدد أيام الشهر واليوم الأول في الأسبوع
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatISODate = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const handleDayClick = (day) => {
    const clickedDate = formatISODate(viewYear, viewMonth, day);

    if (selectingStep === 'start' || !startDate) {
      onChange({ startDate: clickedDate, endDate: '' });
      setSelectingStep('end');
    } else {
      // إذا كان التاريخ الثاني قبل الأول، نعكسهما
      if (new Date(clickedDate) < new Date(startDate)) {
        onChange({ startDate: clickedDate, endDate: startDate });
      } else {
        onChange({ startDate, endDate: clickedDate });
      }
      setSelectingStep('start');
      setIsOpen(false);
    }
  };

  // الفترات السريعة بنقرة واحدة
  const applyPreset = (preset) => {
    const now = new Date();
    const todayStr = formatISODate(now.getFullYear(), now.getMonth(), now.getDate());

    if (preset === 'today') {
      onChange({ startDate: todayStr, endDate: todayStr });
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yStr = formatISODate(y.getFullYear(), y.getMonth(), y.getDate());
      onChange({ startDate: yStr, endDate: yStr });
    } else if (preset === '7days') {
      const p = new Date(now);
      p.setDate(now.getDate() - 7);
      onChange({ startDate: formatISODate(p.getFullYear(), p.getMonth(), p.getDate()), endDate: todayStr });
    } else if (preset === 'this_month') {
      const first = formatISODate(now.getFullYear(), now.getMonth(), 1);
      onChange({ startDate: first, endDate: todayStr });
    } else if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      onChange({
        startDate: formatISODate(first.getFullYear(), first.getMonth(), first.getDate()),
        endDate: formatISODate(last.getFullYear(), last.getMonth(), last.getDate())
      });
    } else if (preset === 'all') {
      onChange({ startDate: '', endDate: '' });
    }
    setIsOpen(false);
  };

  const clearRange = (e) => {
    e.stopPropagation();
    onChange({ startDate: '', endDate: '' });
    setSelectingStep('start');
  };

  // نص الزر المعروض
  const displayText = () => {
    if (startDate && endDate) {
      return `من ${startDate} إلى ${endDate}`;
    } else if (startDate) {
      return `من ${startDate} (اختر تاريخ النهاية)`;
    }
    return 'اضغط هنا لفتح التقويم واختيار الفترة...';
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* الزر الرئيسي لفتح التقويم */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-950 border-2 border-slate-700 hover:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs text-slate-200 cursor-pointer transition-all shadow-md group"
      >
        <div className="flex items-center gap-2.5 truncate font-mono">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className={startDate ? 'text-emerald-300 font-bold text-xs' : 'text-slate-400'}>
            {displayText()}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {startDate && (
            <button
              type="button"
              onClick={clearRange}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
              title="مسح التحديد"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-sans">
            {isOpen ? 'إغلاق ▲' : 'فتح التقويم ▼'}
          </span>
        </div>
      </div>

      {/* النافذة المنبثقة للتقويم الفعلي (Calendar Popup Modal) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-[3000] w-full sm:w-[480px] bg-[#0d151c] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* الفترات السريعة بنقرة واحدة */}
          <div className="space-y-1.5 pb-3 border-b border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>اختيار فترة جاهزة بنقرة واحدة:</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px]">
              <button type="button" onClick={() => applyPreset('today')} className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-emerald-950/70 border border-slate-800 hover:border-emerald-700 text-slate-300 font-bold transition-all text-center">اليوم</button>
              <button type="button" onClick={() => applyPreset('yesterday')} className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-emerald-950/70 border border-slate-800 hover:border-emerald-700 text-slate-300 font-bold transition-all text-center">أمس</button>
              <button type="button" onClick={() => applyPreset('7days')} className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-emerald-950/70 border border-slate-800 hover:border-emerald-700 text-slate-300 font-bold transition-all text-center">آخر 7 أيام</button>
              <button type="button" onClick={() => applyPreset('this_month')} className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-emerald-950/70 border border-slate-800 hover:border-emerald-700 text-slate-300 font-bold transition-all text-center">هذا الشهر</button>
              <button type="button" onClick={() => applyPreset('last_month')} className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-emerald-950/70 border border-slate-800 hover:border-emerald-700 text-slate-300 font-bold transition-all text-center">الشهر الماضي</button>
              <button type="button" onClick={() => applyPreset('all')} className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-purple-950/70 border border-slate-800 hover:border-purple-700 text-purple-300 font-bold transition-all text-center">كل الفترات</button>
            </div>
          </div>

          {/* رأس التقويم: اختيار الشهر والسنة والتنقل */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="الشهر القادم"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-center font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>{ARABIC_MONTHS[viewMonth]}</span>
              <span className="font-mono text-emerald-400">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* تعليمات الاختيار */}
          <div className="text-[11px] text-center bg-slate-950/80 py-1.5 px-3 rounded-xl border border-slate-800 text-slate-300">
            {selectingStep === 'start' || !startDate ? (
              <span className="text-emerald-400 font-bold">👈 انقر على يوم البداية (من تاريخ)</span>
            ) : (
              <span className="text-amber-400 font-bold">👉 انقر على يوم النهاية (إلى تاريخ) لإكمال الفترة</span>
            )}
          </div>

          {/* شبكة التقويم (أيام الأسبوع + أرقام الأيام) */}
          <div className="space-y-1">
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 pb-1">
              {DAYS_OF_WEEK.map((dayName, idx) => (
                <div key={idx} className="py-1">{dayName}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
              {/* الفراغات السابقة لأول يوم بالشهر */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={'empty-' + idx} className="p-2"></div>
              ))}

              {/* أيام الشهر من 1 إلى 30/31 */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = formatISODate(viewYear, viewMonth, dayNum);
                const isStart = startDate === dateStr;
                const isEnd = endDate === dateStr;
                const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate;

                let dayClass = 'text-slate-300 hover:bg-slate-800 border-transparent';
                if (isStart || isEnd) {
                  dayClass = 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/60 scale-105 border-emerald-400';
                } else if (isInRange) {
                  dayClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';
                }

                return (
                  <button
                    key={'day-' + dayNum}
                    type="button"
                    onClick={() => handleDayClick(dayNum)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer text-xs font-bold ${dayClass}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* شريط الإغلاق والتأكيد السفلي */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <button
              type="button"
              onClick={clearRange}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold transition-colors"
            >
              إلغاء التحديد
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>تطبيق الفترة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Home, Eye, EyeOff, ChevronDown, Check, X, Shield, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';

export default function AddEmployeeForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+966',
    email: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    accountType: '',
    status: 'active'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('يرجى إدخال اسم الموظف');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الجوال');
      return;
    }
    if (!formData.password) {
      setErrorMsg('يرجى إدخال كلمة المرور');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
      return;
    }
    if (!formData.accountType) {
      setErrorMsg('يرجى اختيار نوع الحساب');
      return;
    }

    const cleanPhone = formData.phone.trim().replace(/^0/, '');
    const fullPhone = formData.countryCode + cleanPhone;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: fullPhone,
        email: formData.email.trim(),
        nationalId: formData.nationalId.trim(),
        role: formData.accountType,
        status: formData.status === 'active' ? 'نشط' : 'معطل',
        lastActive: 'الآن'
      };

      const res = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        sound.playSuccess();
        if (onSave) onSave(await res.json());
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'فشلت إضافة الموظف');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c121e] text-slate-800 dark:text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
      
      {/* 1. ترويسة المسار العلوية مطابقة للصورة 1 */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500">
          <button onClick={onCancel} className="text-[#00d2d3] hover:underline flex items-center gap-1.5 cursor-pointer">
            <Home className="w-4 h-4" />
            <span>إدارة المستخدمين</span>
          </button>
          <span className="text-slate-400">»</span>
          <button onClick={onCancel} className="text-[#00d2d3] hover:underline cursor-pointer">
            إدارة الموظفين
          </button>
          <span className="text-slate-400">»</span>
          <span className="text-slate-400 font-medium">إضافة موظف جديد</span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* عنوان النموذج */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">بيانات الموظف الجديد</h3>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. الحقول */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium">
        
        {/* الصف الأول: الاسم ورقم الجوال */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* الاسم */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">الاسم</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل الاسم"
              className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all text-xs"
            />
          </div>

          {/* رقم الجوال مع علم السعودية */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">رقم الجوال</label>
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 overflow-hidden focus-within:border-[#00d2d3] focus-within:ring-1 focus-within:ring-[#00d2d3] transition-all">
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="5X XXX XXXX"
                dir="ltr"
                className="flex-1 bg-transparent px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none text-xs font-mono text-left"
              />
              <div className="flex items-center gap-1.5 px-3 border-r border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold select-none" dir="ltr">
                <span className="text-base">🇸🇦</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* الصف الثاني: البريد ورقم الهوية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="إدخل البريد الإلكتروني"
              className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all text-xs"
            />
          </div>

          {/* رقم الهوية / الإقامة */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">رقم الهوية / الإقامة</label>
            <input
              type="text"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              placeholder="أدخل رقم الهوية / الإقامة"
              className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all text-xs font-mono"
            />
          </div>
        </div>

        {/* الصف الثالث: كلمة المرور وتأكيد كلمة المرور */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* كلمة المرور */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl pr-4 pl-11 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">تأكيد كلمة المرور</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl pr-4 pl-11 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* الصف الرابع: نوع الحساب والحالة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          {/* نوع الحساب */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">نوع الحساب</label>
            <div className="relative">
              <select
                required
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-[#00d2d3] appearance-none cursor-pointer text-xs"
              >
                <option value="">اختر نوع الحساب</option>
                <option value="المدير العام (Super Admin)">المدير العام (Super Admin)</option>
                <option value="مشرف الفرع (Supervisor)">مشرف الفرع (Supervisor)</option>
                <option value="مسؤول الفرز والتجهيز (Warehouse)">مسؤول الفرز والتجهيز (Warehouse)</option>
                <option value="المحاسب المالي (Accountant)">المحاسب المالي (Accountant)</option>
                <option value="الدعم الفني وخدمة العملاء (Support)">الدعم الفني وخدمة العملاء (Support)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* الحالة */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2.5">الحالة</label>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200 text-xs">
                <input
                  type="radio"
                  name="employee_status"
                  checked={formData.status === 'active'}
                  onChange={() => setFormData({ ...formData, status: 'active' })}
                  className="w-4 h-4 text-[#00d2d3] accent-[#00d2d3] focus:ring-0"
                />
                <span>مفعل</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200 text-xs">
                <input
                  type="radio"
                  name="employee_status"
                  checked={formData.status === 'inactive'}
                  onChange={() => setFormData({ ...formData, status: 'inactive' })}
                  className="w-4 h-4 text-[#00d2d3] accent-[#00d2d3] focus:ring-0"
                />
                <span>معطل</span>
              </label>
            </div>
          </div>
        </div>

        {/* زر الحفظ */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-start gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 text-xs"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>

      </form>

    </div>
  );
}

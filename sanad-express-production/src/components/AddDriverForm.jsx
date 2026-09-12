import React, { useState } from 'react';
import { Home, Eye, EyeOff, Paperclip, ChevronDown, Check, X, Shield, Truck, Building, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';

export default function AddDriverForm({ branches = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+966',
    email: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    idDocumentName: '',
    status: 'active', // active or inactive
    warehouseId: branches[0]?.id || 'branch-iklil-dammam',
    deliveryConfirmation: 'system', // system, otp, signature
    driverType: 'delivery_driver', // delivery_driver, motorcycle, external
    dailyLimit: '',
    monthlyTarget: '',
    onlineStatus: true,
    allowOnlineToggle: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, idDocumentName: file.name }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('يرجى إدخال اسم السائق');
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

    const cleanPhone = formData.phone.trim().replace(/^0/, '');
    const fullPhone = formData.countryCode + cleanPhone;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: fullPhone,
        username: fullPhone,
        password: formData.password,
        email: formData.email.trim(),
        nationalId: formData.nationalId.trim(),
        vehicle: formData.driverType === 'motorcycle' ? 'دباب سريع' : 'سيارة توصيل',
        branchId: formData.warehouseId,
        status: formData.status === 'active' ? 'active' : 'inactive',
        dailyLimit: Number(formData.dailyLimit) || 50,
        monthlyTarget: Number(formData.monthlyTarget) || 500,
        online: formData.onlineStatus,
        allowOnlineToggle: formData.allowOnlineToggle,
        deliveryConfirmation: formData.deliveryConfirmation
      };

      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        sound.playSuccess();
        if (onSave) onSave(await res.json());
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'فشلت إضافة السائق، يرجى التحقق من البيانات');
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
      
      {/* 1. ترويسة المسار (Breadcrumbs) مطابقة لصورة الشاشة */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500">
          <button onClick={onCancel} className="text-[#00d2d3] hover:underline flex items-center gap-1.5 cursor-pointer">
            <Home className="w-4 h-4" />
            <span>إدارة السائقين</span>
          </button>
          <span className="text-slate-400">»</span>
          <button onClick={onCancel} className="text-[#00d2d3] hover:underline cursor-pointer">
            سائقي المتجر
          </button>
          <span className="text-slate-400">»</span>
          <span className="text-slate-400 font-medium">أضف سائق</span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. نموذج بيانات السائق */}
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

          {/* رقم الجوال مع علم السعودية والكود */}
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

        {/* الصف الثاني: البريد الإلكتروني ورقم الهوية */}
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

        {/* الصف الرابع: صورة الهوية والحالة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          {/* صورة الهوية / الإقامة */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">صورة الهوية / الإقامة</label>
            <label className="flex items-center justify-between w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 cursor-pointer hover:border-[#00d2d3] transition-all">
              <span className="text-slate-400 text-xs">
                {formData.idDocumentName || 'اختر مرفق'}
              </span>
              <span className="p-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-[#00d2d3]">
                <Paperclip className="w-4 h-4" />
              </span>
              <input type="file" onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
            </label>
          </div>

          {/* الحالة: مفعل أو معطل */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2.5">الحالة</label>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200 text-xs">
                <input
                  type="radio"
                  name="driver_status"
                  checked={formData.status === 'active'}
                  onChange={() => setFormData({ ...formData, status: 'active' })}
                  className="w-4 h-4 text-[#00d2d3] accent-[#00d2d3] focus:ring-0"
                />
                <span>مفعل</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200 text-xs">
                <input
                  type="radio"
                  name="driver_status"
                  checked={formData.status === 'inactive'}
                  onChange={() => setFormData({ ...formData, status: 'inactive' })}
                  className="w-4 h-4 text-[#00d2d3] accent-[#00d2d3] focus:ring-0"
                />
                <span>معطل</span>
              </label>
            </div>
          </div>
        </div>

        {/* خط فاصل أنيق مطابق للصورة */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 my-6"></div>

        {/* الصف الخامس: المستودعات وتأكيد التسليم بواسطة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* المستودعات */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">المستودعات</label>
            <div className="relative">
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-[#00d2d3] appearance-none cursor-pointer text-xs"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* تأكيد التسليم بواسطة */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">تأكيد التسليم بواسطة</label>
            <div className="relative">
              <select
                value={formData.deliveryConfirmation}
                onChange={(e) => setFormData({ ...formData, deliveryConfirmation: e.target.value })}
                className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-[#00d2d3] appearance-none cursor-pointer text-xs"
              >
                <option value="system">النظام</option>
                <option value="otp">رمز التحقق OTP عبر الجوال</option>
                <option value="signature">توقيع العميل الإلكتروني</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* الصف السادس: نوع المندوب */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">نوع المندوب</label>
          <div className="relative">
            <select
              value={formData.driverType}
              onChange={(e) => setFormData({ ...formData, driverType: e.target.value })}
              className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-[#00d2d3] appearance-none cursor-pointer text-xs"
            >
              <option value="delivery_driver">سائق توصيل</option>
              <option value="motorcycle">سائق دراجة نارية / دباب</option>
              <option value="external">مندوب خارجي متعاقد</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* الصف السابع: الحد الأقصى والهدف الشهري */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* الحد الأقصى لعدد الشحنات اليومية */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">الحد الأقصى لعدد الشحنات اليومية</label>
            <input
              type="number"
              value={formData.dailyLimit}
              onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
              placeholder="."
              className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#00d2d3] text-xs font-mono"
            />
          </div>

          {/* الهدف الشهري للشحنات */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">الهدف الشهري للشحنات</label>
            <input
              type="number"
              value={formData.monthlyTarget}
              onChange={(e) => setFormData({ ...formData, monthlyTarget: e.target.value })}
              placeholder="."
              className="w-full bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#00d2d3] text-xs font-mono"
            />
          </div>
        </div>

        {/* الصف الثامن: السويتشات (حالة الاتصال والسماح بالتحكم) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* حالة الاتصال */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">حالة الاتصال</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, onlineStatus: !formData.onlineStatus })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${formData.onlineStatus ? 'bg-[#00d2d3]' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${formData.onlineStatus ? 'right-0.5' : 'right-6.5'}`}></div>
            </button>
          </div>

          {/* السماح للمندوب بالتحكم في حالة الاتصال */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">السماح للمندوب بالتحكم في حالة الاتصال</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, allowOnlineToggle: !formData.allowOnlineToggle })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${formData.allowOnlineToggle ? 'bg-[#00d2d3]' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${formData.allowOnlineToggle ? 'right-0.5' : 'right-6.5'}`}></div>
            </button>
          </div>
        </div>

        {/* 3. أزرار الحفظ والإلغاء */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#00d2d3] hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 text-xs"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer text-xs"
          >
            إلغاء
          </button>
        </div>

      </form>

    </div>
  );
}

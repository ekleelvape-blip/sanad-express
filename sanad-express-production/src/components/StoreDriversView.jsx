import React, { useState } from 'react';
import DriverProfileView from './DriverProfileView';
import AddDriverForm from './AddDriverForm';
import { Search, SlidersHorizontal, MoreVertical, Plus, Share2, Trash2, Phone, Check, ChevronRight, Home, Users, UserCheck, Key, Lock, Eye, EyeOff, Copy, Send } from 'lucide-react';

export default function StoreDriversView({ drivers, orders = [], branches = [], onRefresh, onSwitchToTracking, onOpenDriverApp }) {
  const [selectedDriverForProfile, setSelectedDriverForProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingDriver, setIsAddingDriver] = useState(false);

  const [showModalPassword, setShowModalPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    password: '',
    nationalId: '',
    email: '',
    vehicle: 'سيارة توصيل',
    branchId: 'branch-iklil-dammam',
    walletBalance: 0
  });

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateRandomPassword = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewDriver(prev => ({ ...prev, password: randomPin }));
  };

  // التصفية بالبحث
  const filteredDrivers = drivers.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.phone && d.phone.includes(q)) ||
      (d.nationalId && d.nationalId.includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q))
    );
  });

  // تحديد الكل أو إلغاء التحديد
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDriverIds(filteredDrivers.map(d => d.id));
    } else {
      setSelectedDriverIds([]);
    }
  };

  const handleSelectDriver = (id) => {
    if (selectedDriverIds.includes(id)) {
      setSelectedDriverIds(selectedDriverIds.filter(item => item !== id));
    } else {
      setSelectedDriverIds([...selectedDriverIds, id]);
    }
  };

  // إجراءات القائمة المنسدلة: مشاركة السائقين أو الحذف
  const handleBulkAction = async (action) => {
    if (selectedDriverIds.length === 0) return alert('يرجى تحديد سائق واحد على الأقل من الجدول');
    if (action === 'delete' && !window.confirm('هل أنت متأكد من رغبتك في حذف السائقين المحددين؟')) return;

    try {
      const res = await fetch('/api/drivers/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, driverIds: selectedDriverIds })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setSelectedDriverIds([]);
        setShowActionsDropdown(false);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // إضافة سائق جديد
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.phone) return alert('يرجى تعبئة اسم السائق ورقم الجوال');
    if (!newDriver.password) return alert('يرجى تحديد كلمة مرور لحساب المندوب');

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDriver.name,
          phone: newDriver.phone,
          username: newDriver.phone,
          password: newDriver.password,
          nationalId: newDriver.nationalId,
          email: newDriver.email,
          vehicle: newDriver.vehicle || 'سيارة توصيل',
          branchId: newDriver.branchId || 'branch-iklil-dammam'
        })
      });
      if (res.ok) {
        alert('🎉 تم إنشاء حساب المندوب بنجاح!\n\nاسم المستخدم: ' + newDriver.phone + '\nكلمة المرور: ' + newDriver.password);
        setShowAddModal(false);
        setNewDriver({ name: '', phone: '', password: '', nationalId: '', email: '', vehicle: 'سيارة توصيل', branchId: 'branch-iklil-dammam', walletBalance: 0 });
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'فشلت إضافة السائق');
      }
    } catch (err) {
      console.error(err);
    }
  };

    if (isAddingDriver) {
    return (
      <AddDriverForm
        branches={branches}
        onSave={() => {
          setIsAddingDriver(false);
          if (onRefresh) onRefresh();
        }}
        onCancel={() => setIsAddingDriver(false)}
      />
    );
  }

  if (selectedDriverForProfile) {
    return (
      <DriverProfileView
        driver={selectedDriverForProfile}
        orders={orders}
        branches={branches}
        onBack={() => setSelectedDriverForProfile(null)}
        onRefresh={onRefresh}
        onOpenDriverApp={onOpenDriverApp}
      />
    );
  }

  return (
    <div className="space-y-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-800" dir="rtl">
      {/* شريط المسار والترويسة العلوية المطابقة تماماً للصورة */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* المسار (Breadcrumbs) */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
          <Home className="w-4 h-4 text-slate-400" />
          <span>&gt;&gt;</span>
          <span>إدارة السائقين</span>
          <span>&gt;&gt;</span>
          <span className="text-[#00d2d3] font-black drop-shadow-[0_0_8px_rgba(0,210,211,0.4)]">سائقي المتجر</span>
        </div>

        {/* الأزرار العلوية */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSwitchToTracking}
            className="flex items-center gap-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-[#00d2d3] border border-cyan-800/50 shadow-[0_0_12px_rgba(0,210,211,0.15)] text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <span>%</span>
            <span>تتبع السائقين</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingDriver(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(0,210,211,0.35)] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>أضف سائق</span>
          </button>
        </div>
      </div>

      {/* بطاقة الجدول الرئيسية */}
      <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden text-slate-100">
        {/* شريط الفلاتر والإجراءات والبحث */}
        <div className="p-4 border-b border-cyan-900/30 flex flex-wrap items-center justify-between gap-3 bg-[#0a0e18]/40">
          {/* زر قائمة الإجراءات المنسدلة (السماح بالمشاركة / حذف) */}
          <div className="relative">
            <div className="flex items-center border border-cyan-700/60 rounded-xl overflow-hidden shadow-sm bg-[#090d16]">
              <button
                type="button"
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="px-3.5 py-1.5 text-xs font-bold text-[#00d2d3] hover:bg-cyan-950/40 transition-colors cursor-pointer border-l border-cyan-800/40 flex items-center gap-1"
              >
                <span>إجراءات</span>
              </button>
              <button
                type="button"
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="px-2 py-1.5 text-[#00d2d3] hover:bg-cyan-950/40 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* القائمة المنسدلة */}
            {showActionsDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#0f1523] border border-cyan-800/60 rounded-2xl shadow-2xl py-2 z-50 text-slate-200 text-xs animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => handleBulkAction('share')}
                  className="w-full px-4 py-2.5 text-right font-bold text-slate-700 hover:bg-[#f0fdfa] hover:text-[#00d2d3] flex items-center justify-between transition-colors"
                >
                  <span>السماح بمشاركة السائق</span>
                  <Share2 className="w-4 h-4 text-[#00d2d3]" />
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  type="button"
                  onClick={() => handleBulkAction('delete')}
                  className="w-full px-4 py-2.5 text-right font-bold text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors"
                >
                  <span>حذف</span>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
          </div>

          {/* زر التصفية وحقل البحث */}
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              className="flex items-center gap-1.5 border border-cyan-900/50 bg-[#090d16] px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:border-cyan-500 shadow-sm transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>التصفية</span>
            </button>

            <div className="relative w-72 sm:w-96">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الطلب أو اسم العميل/المستلم أو الهاتف"
                className="w-full bg-[#090d16] border border-cyan-900/50 rounded-xl pr-3 pl-9 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* جدول السائقين */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-cyan-900/30 bg-[#090d16]/80 font-bold text-[11px]">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedDriverIds.length === filteredDrivers.length && filteredDrivers.length > 0}
                    className="rounded text-[#00d2d3] focus:ring-0 cursor-pointer w-4 h-4 accent-[#00d2d3]"
                  />
                </th>
                <th className="py-3.5 px-4">السائق</th>
                <th className="py-3.5 px-4">اسم المستخدم (الجوال)</th>
                <th className="py-3.5 px-4">كلمة المرور والتطبيق</th>
                <th className="py-3.5 px-4">رقم الهوية / الإقامة</th>
                <th className="py-3.5 px-4">البريد الإلكتروني</th>
                <th className="py-3.5 px-4">متاجر مشاركة</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">الرصيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDrivers.map(driver => {
                const isSelected = selectedDriverIds.includes(driver.id);
                return (
                  <tr
                    key={driver.id}
                    className={`hover:bg-cyan-950/20 transition-colors ${isSelected ? 'bg-teal-50/30' : ''}`}
                  >
                    {/* مربع الاختيار */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectDriver(driver.id)}
                        className="rounded text-[#00d2d3] focus:ring-0 cursor-pointer w-4 h-4 accent-[#00d2d3]"
                      />
                    </td>

                    {/* اسم السائق بلون تيل بارز */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedDriverForProfile(driver)}
                        className="font-black text-[#00d2d3] hover:text-[#0f766e] text-xs hover:underline cursor-pointer text-right block"
                        title="انقر لفتح الصفحة الكاملة وبيانات السائق"
                      >
                        {driver.name}
                      </button>
                    </td>

                    {/* اسم المستخدم (رقم الجوال) */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={'tel:' + driver.phone}
                          className="inline-flex items-center gap-1 text-slate-200 hover:text-[#00d2d3] font-bold text-xs font-mono"
                        >
                          <span>{driver.phone}</span>
                          <Phone className="w-3 h-3 text-emerald-400" />
                        </a>
                      </div>
                      <div className="text-[10px] text-cyan-400 font-sans">اسم مستخدم التطبيق</div>
                    </td>

                    {/* كلمة المرور مع زر كشف وإرسال واتساب */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-slate-900 border border-cyan-900/60 text-white font-bold tracking-wider">
                          {visiblePasswords[driver.id] ? (driver.password || '123456') : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(driver.id)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
                          title="إظهار / إخفاء كلمة المرور"
                        >
                          {visiblePasswords[driver.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={'https://wa.me/966' + (driver.phone || '').replace(/\D/g, '').replace(/^966/, '').replace(/^0/, '') + '?text=' + encodeURIComponent('مرحباً بك يا ' + driver.name + ' في سند إكسبريس.\nبيانات دخولك لتطبيق المندوب الميداني:\nرابط التطبيق: ' + (typeof window !== 'undefined' ? window.location.origin + '/driver' : '') + '\nاسم المستخدم: ' + driver.phone + '\nكلمة المرور: ' + (driver.password || '123456'))}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300"
                          title="إرسال بيانات الدخول للمندوب عبر الواتساب"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* رقم الهوية / الإقامة */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-300 text-xs">
                      {driver.nationalId || '—'}
                    </td>

                    {/* البريد الإلكتروني */}
                    <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                      {driver.email || '—'}
                    </td>

                    {/* متاجر مشاركة */}
                    <td className="py-3 px-4 text-slate-400 font-bold">
                      {driver.sharedStores || '—'}
                    </td>

                    {/* شارة الحالة (مفعل) */}
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/50 font-bold text-[11px]">
                        مفعل
                      </span>
                    </td>

                    {/* الرصيد */}
                    <td className="py-3 px-4 font-mono font-bold text-[#00d2d3] text-xs">
                      {driver.walletBalance !== undefined
                        ? `${driver.walletBalance.toFixed(2)} ﷼`
                        : `${(driver.cashOnHand || 0).toFixed(2)} ﷼`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة سائق جديد */}
      {showAddModal && (
        <div className="fixed inset-0 z-[4000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00d2d3]" />
                <span>إضافة سائق جديد</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم السائق بالكامل *:</label>
                <input
                  type="text"
                  required
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder="مثال: فيصل العتيبي"
                  className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#00d2d3]"
                />
              </div>

              {/* بطاقة معلومات الحساب وتطبيق المندوب */}
              <div className="bg-cyan-50/70 border-2 border-cyan-200 p-3 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-[#0f766e] font-black text-xs">
                  <Key className="w-4 h-4 text-[#0d9488]" />
                  <span>بيانات دخول المندوب للتطبيق (رقم الجوال + كلمة المرور)</span>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1 flex items-center justify-between">
                    <span>رقم الجوال (اسم المستخدم) *:</span>
                    <span className="text-[10px] text-teal-700 font-normal">هو اسم المستخدم للدخول</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                    placeholder="05XXXXXXXX أو +9665XXXXXXXX"
                    className="w-full bg-white border border-cyan-300 rounded-xl p-2.5 outline-none focus:border-[#00d2d3] font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-800 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#0d9488]" />
                      <span>كلمة مرور حساب المندوب *:</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-[#0d9488] hover:text-[#0f766e] font-bold underline"
                    >
                      توليد كلمة مرور عشوائية 🎲
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      required
                      value={newDriver.password}
                      onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                      placeholder="أدخل كلمة مرور المندوب (مثال: 123456)"
                      className="w-full bg-white border border-cyan-300 rounded-xl p-2.5 pr-3 pl-10 outline-none focus:border-[#00d2d3] font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهوية / الإقامة:</label>
                  <input
                    type="text"
                    value={newDriver.nationalId}
                    onChange={(e) => setNewDriver({ ...newDriver, nationalId: e.target.value })}
                    placeholder="2XXXXXXXXX"
                    className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#00d2d3] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع المركبة:</label>
                  <input
                    type="text"
                    value={newDriver.vehicle}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicle: e.target.value })}
                    placeholder="مثال: تويوتا يارس 2023"
                    className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#00d2d3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                  placeholder="driver@sanad.com"
                  className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#00d2d3] font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold">حفظ السائق</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
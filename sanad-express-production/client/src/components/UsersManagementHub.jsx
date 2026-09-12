import React, { useState, useEffect } from 'react';
import AddEmployeeForm from './AddEmployeeForm';
import { Users, Shield, Package, Star, MapPin, Plus, Check, Search, Phone, Mail, Award, Clock, DollarSign, Sparkles, CheckCircle2, ChevronRight, SlidersHorizontal, AlertCircle, Laptop, Truck } from 'lucide-react';

export default function UsersManagementHub({ activeTab, onSelectTab, branches, drivers }) {
  const [currentTab, setCurrentTab] = useState(activeTab || 'managers');
  const [managers, setManagers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // تحديث التبويب النشط
  useEffect(() => {
    if (['managers', 'permissions', 'driver_inventory', 'ratings', 'locations'].includes(activeTab)) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mRes, eRes, rRes, zRes] = await Promise.all([
          fetch('/api/managers'),
          fetch('/api/equipment'),
          fetch('/api/ratings'),
          fetch('/api/zones')
        ]);
        if (mRes.ok) setManagers(await mRes.json());
        if (eRes.ok) setEquipment(await eRes.json());
        if (rRes.ok) setRatings(await rRes.json());
        if (zRes.ok) setZones(await zRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // صلاحيات الأدوار المعتمدة
  const [rolesPermissions, setRolesPermissions] = useState([
    { id: 'admin', name: 'المدير العام (Super Admin)', description: 'صلاحيات مطلقة لإدارة المنظومة والأسطول والحسابات', viewOrders: true, assignDrivers: true, codSettle: true, priceEdit: true, reportsExport: true },
    { id: 'supervisor', name: 'مشرف الفرع (Branch Supervisor)', description: 'إدارة شحنات الفرع، المناديب الميدانيين، وإصدار المانيفست', viewOrders: true, assignDrivers: true, codSettle: true, priceEdit: false, reportsExport: true },
    { id: 'dispatcher', name: 'مسؤول التوزيع الميداني (Dispatcher)', description: 'توزيع وإسناد الطلبات ومراقبة حركة الرادار المباشر', viewOrders: true, assignDrivers: true, codSettle: false, priceEdit: false, reportsExport: false },
    { id: 'accountant', name: 'المحاسب المالي (Financial Officer)', description: 'تسوية الكاش، تدقيق العهد، ومطابقة محافظ المناديب', viewOrders: true, assignDrivers: false, codSettle: true, priceEdit: true, reportsExport: true }
  ]);

  const togglePermission = (roleIdx, field) => {
    setRolesPermissions(prev => {
      const copy = [...prev];
      copy[roleIdx] = { ...copy[roleIdx], [field]: !copy[roleIdx][field] };
      return copy;
    });
  };

    if (isAddingEmployee) {
    return (
      <AddEmployeeForm
        onSave={(newEmp) => {
          setIsAddingEmployee(false);
          setManagers(prev => [newEmp, ...prev]);
        }}
        onCancel={() => setIsAddingEmployee(false)}
      />
    );
  }

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif] text-slate-100" dir="rtl">
      {/* شريط التبويبات العلوية للخدمات الإدارية */}
      <div className="bg-[#0f1523] border border-cyan-900/40 p-2 rounded-3xl flex flex-wrap gap-2 text-xs shadow-xl">
        <button
          type="button"
          onClick={() => { setCurrentTab('managers'); if (onSelectTab) onSelectTab('managers'); }}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'managers' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.4)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}`}
        >
          <Users className="w-4 h-4" />
          <span>المشرفين والمدراء</span>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentTab('permissions'); if (onSelectTab) onSelectTab('permissions'); }}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'permissions' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.4)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}`}
        >
          <Shield className="w-4 h-4" />
          <span>الأدوار والصلاحيات (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentTab('driver_inventory'); if (onSelectTab) onSelectTab('driver_inventory'); }}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'driver_inventory' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.4)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}`}
        >
          <Package className="w-4 h-4" />
          <span>عهدة وأجهزة السائقين</span>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentTab('ratings'); if (onSelectTab) onSelectTab('ratings'); }}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'ratings' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.4)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}`}
        >
          <Star className="w-4 h-4" />
          <span>تقييمات وأداء المناديب</span>
        </button>

        <button
          type="button"
          onClick={() => { setCurrentTab('locations'); if (onSelectTab) onSelectTab('locations'); }}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentTab === 'locations' ? 'bg-[#00d2d3] text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.4)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}`}
        >
          <MapPin className="w-4 h-4" />
          <span>نطاقات وفروع التغطية</span>
        </button>
      </div>

      {/* 1. تبويب المشرفين والمدراء */}
      {currentTab === 'managers' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00d2d3]" />
                <span>فريق الإشراف والإدارة الميدانية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">مدراء الفروع، مشرفو العمليات، ومسؤولو توزيع أسطول سند إكسبريس</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingEmployee(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.35)] text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090d16] font-bold text-[11px]">
                  <th className="py-3 px-4">المشرف / المدير</th>
                  <th className="py-3 px-4">الدور الإداري</th>
                  <th className="py-3 px-4">الفرع المسؤول عنه</th>
                  <th className="py-3 px-4">رقم الجوال</th>
                  <th className="py-3 px-4">البريد الإلكتروني</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">آخر نشاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {managers.map(m => (
                  <tr key={m.id} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00d2d3] font-bold flex items-center justify-center shrink-0 border border-teal-200">
                        {m.name.charAt(0)}
                      </div>
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#00d2d3]">{m.role}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-bold">{m.branchName}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{m.phone}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{m.email}</td>
                    <td className="py-3.5 px-4"><span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-[10px]">{m.status}</span></td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{m.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. تبويب مصفوفة الصلاحيات (RBAC) */}
      {currentTab === 'permissions' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-6 text-slate-100">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00d2d3]" />
              <span>مصفوفة الأدوار والصلاحيات (Role-Based Access Control)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">تحديد وتخصيص صلاحيات الوصول والتحكم لكل رتبة وظيفية بالمنظومة</p>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090d16] font-bold text-[11px]">
                  <th className="py-3.5 px-4">المسمى الوظيفي / الدور</th>
                  <th className="py-3.5 px-4 text-center">عرض الطلبات</th>
                  <th className="py-3.5 px-4 text-center">إسناد وتعديل المناديب</th>
                  <th className="py-3.5 px-4 text-center">تسوية الكاش والخزينة</th>
                  <th className="py-3.5 px-4 text-center">تعديل الأسعار والإعدادات</th>
                  <th className="py-3.5 px-4 text-center">تصدير التقارير وExcel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rolesPermissions.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">{r.name}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{r.description}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button type="button" onClick={() => togglePermission(idx, 'viewOrders')} className={`p-1.5 rounded-xl cursor-pointer ${r.viewOrders ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Check className="w-4 h-4 mx-auto" /></button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button type="button" onClick={() => togglePermission(idx, 'assignDrivers')} className={`p-1.5 rounded-xl cursor-pointer ${r.assignDrivers ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Check className="w-4 h-4 mx-auto" /></button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button type="button" onClick={() => togglePermission(idx, 'codSettle')} className={`p-1.5 rounded-xl cursor-pointer ${r.codSettle ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Check className="w-4 h-4 mx-auto" /></button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button type="button" onClick={() => togglePermission(idx, 'priceEdit')} className={`p-1.5 rounded-xl cursor-pointer ${r.priceEdit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Check className="w-4 h-4 mx-auto" /></button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button type="button" onClick={() => togglePermission(idx, 'reportsExport')} className={`p-1.5 rounded-xl cursor-pointer ${r.reportsExport ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Check className="w-4 h-4 mx-auto" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. تبويب عهدة السائقين والأجهزة */}
      {currentTab === 'driver_inventory' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#00d2d3]" />
                <span>إدارة عهدة وأجهزة المناديب الميدانيين</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">متابعة أجهزة نقاط البيع (POS مدى)، حقائب العزل الحراري، وطابعات البوالص المسلمة للأسطول</p>
            </div>
            <button
              type="button"
              onClick={() => alert('صرف عهدة: اختر السنوع ورقم الجهاز والسائق المسند له')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,211,0.35)] text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>صرف عهدة جديدة</span>
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090d16] font-bold text-[11px]">
                  <th className="py-3 px-4">نوع الجهاز / العهدة</th>
                  <th className="py-3 px-4">الرقم التسلسلي (S/N)</th>
                  <th className="py-3 px-4">السائق المستلم</th>
                  <th className="py-3 px-4">الفرع</th>
                  <th className="py-3 px-4">تاريخ التسليم</th>
                  <th className="py-3 px-4">الحالة التشغيلية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {equipment.map(eq => (
                  <tr key={eq.id} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-[#00d2d3]" />
                      <span>{eq.assetType}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{eq.serialNumber}</td>
                    <td className="py-3.5 px-4 font-black text-[#00d2d3]">{eq.driverName}</td>
                    <td className="py-3.5 px-4 text-slate-700">{eq.branchName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{eq.assignedDate}</td>
                    <td className="py-3.5 px-4"><span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-[10px]">{eq.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. تبويب تقييمات وأداء المناديب (SLA) */}
      {currentTab === 'ratings' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-6 text-slate-100">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>مؤشرات أداء وجودة المناديب (SLA & Delivery Quality)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">تقييمات العملاء الميدانية، سرعة الاستجابة، ونسبة التسليم في الوقت المحدد</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-500 font-sans">متوسط تقييم الأسطول:</div>
              <div className="text-xl font-black text-amber-500 mt-1">⭐ 4.92 / 5.0</div>
            </div>
            <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-500 font-sans">نسبة التوصيل بالوقت المحدد:</div>
              <div className="text-xl font-black text-emerald-600 mt-1">98.8%</div>
            </div>
            <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-500 font-sans">متوسط زمن التوصيل للمشوار:</div>
              <div className="text-xl font-black text-teal-600 mt-1">34 دقيقة</div>
            </div>
            <div className="bg-[#090d16] border border-cyan-900/40 p-4 rounded-2xl">
              <div className="text-slate-500 font-sans">معدل البلاغات والشكاوى:</div>
              <div className="text-xl font-black text-white mt-1">0.6% فقط</div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-cyan-900/40 bg-[#090d16] font-bold text-[11px]">
                  <th className="py-3 px-4">السائق</th>
                  <th className="py-3 px-4 text-center">التقييم</th>
                  <th className="py-3 px-4 text-center">إجمالي المشاوير</th>
                  <th className="py-3 px-4 text-center">الالتزام بالموعد (SLA)</th>
                  <th className="py-3 px-4">شارة التميز</th>
                  <th className="py-3 px-4">انطباع وثناء العملاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ratings.map((r, idx) => (
                  <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-black text-white">{r.driverName}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-500 font-mono">⭐ {r.rating}</td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-700">{r.totalTrips}</td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-emerald-600">{r.onTimePercent}%</td>
                    <td className="py-3.5 px-4"><span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">{r.badge}</span></td>
                    <td className="py-3.5 px-4 text-slate-600 italic">"{r.customerPraise}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. تبويب نطاقات التغطية وأسعار التوصيل */}
      {currentTab === 'locations' && (
        <div className="bg-[#0f1523] rounded-3xl border border-cyan-900/40 shadow-2xl overflow-hidden p-6 space-y-6 text-slate-100">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#00d2d3]" />
              <span>نطاقات وفروع التغطية الجغرافية وأسعار الشحن</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">مناطق التوصيل السريع بالمنطقة الشرقية، الرسوم الرسمية، وزمن التوصيل المتوقع (SLA)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {zones.map(z => (
              <div key={z.id} className="p-5 rounded-2xl bg-[#090d16] border border-cyan-900/40 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-black text-white text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#00d2d3]" />
                    <span>{z.name}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-[#00d2d3] border border-cyan-800/60 font-bold text-[10px]">{z.status}</span>
                </div>
                <div className="space-y-1.5 text-slate-600">
                  <div><span className="text-slate-400 font-bold">الأحياء المغطاة: </span>{z.coverage}</div>
                  <div><span className="text-slate-400 font-bold">المتجر الرئيسي: </span>{z.store}</div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
                  <div><span className="text-slate-400 font-sans">زمن التوصيل: </span><strong className="text-slate-800">{z.slaTime}</strong></div>
                  <div><span className="text-slate-400 font-sans">رسم التوصيل: </span><strong className="text-[#00d2d3] text-base">{z.fee} ﷼</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
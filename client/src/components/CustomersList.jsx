import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, MapPin, Package, Calendar, ArrowUpRight, Star } from 'lucide-react';

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* ترويسة قسم العملاء */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>👥</span>
            <span>أرشيف العملاء الموصل لهم</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل دائم بالعملاء الذين استلموا طلباتهم بنجاح مع تكرار طلباتهم والمبالغ الإجمالية والمندوب الأخير
          </p>
        </div>

        {/* حقل البحث السريع */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="بحث بالاسم، الجوال، أو العنوان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl pr-9 pl-4 py-2.5 focus:border-purple-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* بطاقات العملاء الموصل لهم */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-800/40 flex items-center justify-center font-bold text-base">
                    {c.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{c.customerName}</h3>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      <span>عميل معتمد ({c.ordersCount} طلبات)</span>
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${c.customerPhone}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 transition-colors border border-slate-700"
                  title="اتصال بالعميل"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-2 mb-4 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono text-slate-200">{c.customerPhone}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{c.customerAddress}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1.5 border-t border-slate-800">
                  <span>المندوب الأخير:</span>
                  <span className="text-slate-200 font-bold">{c.lastDriverName}</span>
                  <span className="mx-1">•</span>
                  <span>{c.lastBranchName}</span>
                </div>
              </div>
            </div>

            {/* إجمالي المشتريات وتاريخ آخر طلب */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">إجمالي المشتريات:</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">{c.totalSpent} ر.س</span>
              </div>
              <div className="text-left">
                <span className="text-slate-500 block text-[10px]">آخر طلب:</span>
                <span className="font-mono text-slate-300 text-[11px]">
                  {new Date(c.lastOrderDate).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {customers.length === 0 && !loading && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="font-bold text-slate-300">لا يوجد عملاء موصل لهم مطابقين للبحث</p>
        </div>
      )}
    </div>
  );
}

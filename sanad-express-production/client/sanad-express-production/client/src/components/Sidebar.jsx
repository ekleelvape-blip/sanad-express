import React, { useState } from 'react';
import {
  Home, Package, Truck, XCircle, Users, MapPin, Star, DollarSign, Wallet,
  FileText, Download, ShoppingBag, Headphones, Settings, ChevronDown,
  Smartphone, Search, LogOut, CheckCircle2, ShieldCheck, Box, Zap
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  selectedBranch,
  branches,
  onSelectBranch,
  currentUser,
  onLogout,
  isOpen,
  onToggleOpen
}) {
  const [openMenus, setOpenMenus] = useState({
    delivery: true,
    users: false,
    finance: false,
    reports: false,
    export: false,
    settings: false
  });

  const toggleSubMenu = (menuKey) => {
    setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const navItems = [
    { key: 'dashboard', label: 'الرئيسية', icon: <Home className="w-4 h-4" /> },
    { key: 'orders', label: 'كل الطلبات', icon: <Package className="w-4 h-4" /> },
    {
      key: 'delivery_group',
      label: 'طلبات التوصيل',
      icon: <Truck className="w-4 h-4" />,
      menuKey: 'delivery',
      children: [
        { key: 'delivery_ready', label: 'جاهزة للتوصيل' },
        { key: 'delivery_assigned', label: 'مسندة' },
        { key: 'delivery_intransit', label: 'جاري التوصيل' },
        { key: 'delivery_delivered', label: 'تم التوصيل' }
      ]
    },
    { key: 'cancelled', label: 'طلبات ملغاة ومسترجعة', icon: <XCircle className="w-4 h-4" /> },
    {
      key: 'users_group',
      label: 'إدارة المستخدمين',
      icon: <Users className="w-4 h-4" />,
      menuKey: 'users',
      children: [
        { key: 'store_drivers', label: 'سائقي المتجر' },
        { key: 'driver_tracking', label: 'تتبع السائقين (رادار)' },
        { key: 'managers', label: 'المدراء والمشرفين' },
        { key: 'permissions', label: 'الصلاحيات (RBAC)' }
      ]
    },
    { key: 'driver_inventory', label: 'عهدة السائقين والأجهزة', icon: <Box className="w-4 h-4" /> },
    { key: 'ratings', label: 'تقييمات وأداء المناديب', icon: <Star className="w-4 h-4" /> },
    {
      key: 'financial_group',
      label: 'المعاملات المالية',
      icon: <DollarSign className="w-4 h-4" />,
      menuKey: 'finance',
      children: [
        { key: 'settlements', label: 'تسوية الكاش (COD)' },
        { key: 'cod_transactions', label: 'سجل حركات COD' },
        { key: 'driver_invoices', label: 'فواتير وعمولات المناديب' },
        { key: 'delivery_pricing', label: 'أسعار التوصيل والمناطق' },
        { key: 'wallet', label: 'خزينة كاش المتجر' }
      ]
    },
    {
      key: 'reports_group',
      label: 'التقارير',
      icon: <FileText className="w-4 h-4" />,
      menuKey: 'reports',
      children: [
        { key: 'cod_collections', label: 'تحصيلات الدفع عند الإستلام' },
        { key: 'driver_performance', label: 'تقرير أداء السائقين' },
        { key: 'driver_dues', label: 'تقرير مستحقات السائقين' },
        { key: 'ratings', label: 'تقرير التقييمات' },
        { key: 'neighborhoods', label: 'تقرير الأحياء' }
      ]
    },
    {
      key: 'export_group',
      label: 'تصدير البيانات',
      icon: <Download className="w-4 h-4" />,
      menuKey: 'export',
      children: [
        { key: 'export_driver_orders', label: 'تصدير طلبات السائقين' },
        { key: 'export_warehouse_orders', label: 'تصدير طلبات موظفي المستودع' },
        { key: 'export_inventory', label: 'تصدير المخزون الحالي' },
        { key: 'export_reports', label: 'تصدير البلاغات' }
      ]
    },
    { key: 'locations', label: 'نطاقات وفروع التغطية', icon: <MapPin className="w-4 h-4" /> },
    { key: 'salla_integration', label: 'الربط مع سلة والـ Webhooks', icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'support', label: 'الدعم الفني والمساعدة', icon: <Headphones className="w-4 h-4" /> },
    {
      key: 'settings_group',
      label: 'الإعدادات',
      icon: <Settings className="w-4 h-4" />,
      menuKey: 'settings',
      children: [
        { key: 'system_settings', label: 'إعدادات النظام' },
        { key: 'delivery_settings', label: 'إعدادات التوصيل الذكي' }
      ]
    }
  ];

  return (
    <aside className={'fixed top-0 right-0 z-[1200] h-screen bg-[#0a0e17] border-l border-cyan-950/40 flex flex-col transition-all duration-300 select-none font-["Tajawal",sans-serif] ' + (isOpen ? 'w-64' : 'w-20')}>
      {/* ترويسة الشعار المتناسقة تماماً مع ألوان الهوية الجديدة */}
      {/* ترويسة الشعار المعتمد لسند إكسبريس */}
      <div className="p-3.5 border-b border-cyan-950/50 flex items-center justify-between bg-[#080c14]">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <div className="relative">
            <img
              src="/sanad-express-logo.jpg?v=3"
              alt="سند إكسبريس"
              className="w-11 h-11 rounded-2xl object-cover shadow-[0_0_20px_rgba(0,210,211,0.4)] border border-cyan-500/50 shrink-0"
            />
            <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full bg-[#00d2d3] border-2 border-[#0a0e17] animate-pulse"></span>
          </div>
          {isOpen && (
            <div className="text-right truncate">
              <div className="font-black text-sm text-white tracking-tight leading-none flex items-center gap-1.5">
                <span>سَنَد إكسبريس</span>
              </div>
              <div className="font-mono font-bold text-[9px] text-[#00d2d3] tracking-widest mt-1">
                SANAD EXPRESS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* قائمة التبويبات */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 text-xs">
        {navItems.map(item => {
          const hasChildren = item.children && item.children.length > 0;
          const isParentActive = hasChildren && item.children.some(c => c.key === activeTab);
          const isActive = activeTab === item.key || isParentActive;
          const isSubOpen = openMenus[item.menuKey];

          return (
            <div key={item.key}>
              <button
                type="button"
                onClick={() => {
                  if (hasChildren) {
                    toggleSubMenu(item.menuKey);
                  } else {
                    onSelectTab(item.key);
                  }
                }}
                className={'w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition-all cursor-pointer ' + (
                  isActive
                    ? 'bg-gradient-to-l from-cyan-500/20 to-cyan-500/5 text-[#00d2d3] border-r-2 border-[#00d2d3] shadow-[inset_0_0_15px_rgba(0,210,211,0.1)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/20'
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-[#00d2d3] drop-shadow-[0_0_8px_rgba(0,210,211,0.5)]' : 'text-slate-400'}>{item.icon}</span>
                  {isOpen && <span className="truncate">{item.label}</span>}
                </div>
                {hasChildren && isOpen && (
                  <ChevronDown className={'w-3.5 h-3.5 transition-transform text-slate-500 ' + (isSubOpen ? 'rotate-180 text-[#00d2d3]' : '')} />
                )}
              </button>

              {hasChildren && isSubOpen && isOpen && (
                <div className="mr-6 my-1 space-y-1 pr-2 border-r border-cyan-900/30">
                  {item.children.map(sub => (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => onSelectTab(sub.key)}
                      className={'w-full text-right py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer block truncate ' + (
                        activeTab === sub.key
                          ? 'text-[#00d2d3] bg-cyan-950/40 font-bold border-r border-[#00d2d3]'
                          : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/20'
                      )}
                    >
                      • {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* زر المندوب الميداني في الأسفل */}
      <div className="p-3 border-t border-cyan-950/50 bg-[#080c14] space-y-2">
        <a href="/driver" target="_blank" rel="noreferrer" className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,211,0.3)] transition-all cursor-pointer active:scale-95"
        >
          <Smartphone className="w-4 h-4" />
          {isOpen && <span>تطبيق سند المندوب (الميدان)</span>}
        </a>

        {isOpen && currentUser && (
          <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-[#00d2d3] animate-pulse"></span>
              <span className="truncate font-semibold text-slate-300">{currentUser.name || 'إدارة سند'}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-950/30 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

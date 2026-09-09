import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Store, UserCheck, Gauge, Phone } from 'lucide-react';

export default function LiveMap({ branches, drivers, orders, selectedBranch, onSelectDriver }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({ drivers: {}, branches: {}, orders: {}, routes: [] });

  // تهيئة الخريطة مرة واحدة
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // المركز الافتراضي: الرياض
    const map = L.map(mapContainerRef.current, {
      center: [24.7136, 46.6753],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // طبقة الخريطة CartoDB Dark Matter الفاخرة المناسبة للثيم المظلم
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // تحريك الخريطة عند اختيار فرع معين
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedBranch && selectedBranch !== 'all') {
      const b = branches.find(item => item.id === selectedBranch);
      if (b && b.coords) {
        mapInstanceRef.current.flyTo(b.coords, 13, { duration: 1.2 });
      }
    } else {
      mapInstanceRef.current.flyTo([24.7136, 46.6753], 11, { duration: 1.2 });
    }
  }, [selectedBranch, branches]);

  // تحديث علامات الفروع
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // إزالة علامات الفروع السابقة
    Object.values(markersRef.current.branches).forEach(m => m.remove());
    markersRef.current.branches = {};

    branches.forEach(b => {
      const isSelected = selectedBranch === 'all' || selectedBranch === b.id;
      if (!isSelected) return;

      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div class="relative group cursor-pointer flex flex-col items-center">
            <div class="w-10 h-10 rounded-xl bg-purple-600 border-2 border-purple-300 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 hover:scale-110 transition-transform">
              <span class="text-xl">🏪</span>
            </div>
            <div class="absolute -bottom-6 bg-purple-950/90 border border-purple-700/60 text-purple-200 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow">
              ${b.name}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker(b.coords, { icon: storeIcon }).addTo(map);
      marker.bindPopup(`
        <div class="p-2 text-right" dir="rtl">
          <div class="text-xs font-bold text-purple-400 mb-1">${b.brand}</div>
          <h4 class="font-bold text-slate-100 text-sm mb-1">${b.name}</h4>
          <p class="text-xs text-slate-300 mb-1">${b.district}</p>
          <div class="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <span>الطلبات اليوم: ${b.todayOrders}</span> | <span>المناديب النشطين: ${b.activeDrivers}</span>
          </div>
        </div>
      `);

      markersRef.current.branches[b.id] = marker;
    });
  }, [branches, selectedBranch]);

  // تحديث علامات المناديب اللحظية
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    drivers.forEach(d => {
      const isDelivering = d.status === 'delivering';
      const isOnline = d.online;
      const pulseColor = isDelivering ? 'bg-amber-500' : isOnline ? 'bg-emerald-500' : 'bg-slate-500';
      const borderColor = isDelivering ? 'border-amber-400' : isOnline ? 'border-emerald-400' : 'border-slate-500';

      const driverHtml = `
        <div class="relative cursor-pointer flex flex-col items-center">
          ${isDelivering ? '<div class="absolute -inset-1 rounded-full bg-amber-500/40 animate-ping"></div>' : ''}
          <div class="w-10 h-10 rounded-full ${pulseColor} border-2 ${borderColor} flex items-center justify-center text-white shadow-lg shadow-black/80 hover:scale-125 transition-transform z-10">
            <span class="text-lg">${isDelivering ? '🚗' : '🛵'}</span>
          </div>
          <div class="absolute -bottom-6 bg-slate-900/90 border border-slate-700 text-slate-100 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow flex items-center gap-1">
            <span>${d.name}</span>
            <span class="${d.speed > 0 ? 'text-amber-400' : 'text-slate-400'} font-mono">${d.speed} كم/س</span>
          </div>
        </div>
      `;

      const driverIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: driverHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (markersRef.current.drivers[d.id]) {
        // تحريك العلامة الموجودة بسلاسة
        markersRef.current.drivers[d.id].setLatLng(d.coords);
        markersRef.current.drivers[d.id].setIcon(driverIcon);
      } else {
        const marker = L.marker(d.coords, { icon: driverIcon }).addTo(map);
        marker.on('click', () => {
          if (onSelectDriver) onSelectDriver(d);
        });
        marker.bindPopup(`
          <div class="p-2 text-right font-['Cairo',sans-serif]" dir="rtl">
            <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-700 pb-1">
              <span class="font-bold text-slate-100 text-sm">${d.name}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded ${isDelivering ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}">
                ${isDelivering ? 'في مهمة توصيل' : 'متاح للطلب'}
              </span>
            </div>
            <div class="text-xs text-slate-300 mb-1">المركبة: ${d.vehicle}</div>
            <div class="text-xs text-slate-300 mb-1">الجوال: <a href="tel:${d.phone}" class="text-purple-400 underline">${d.phone}</a></div>
            <div class="text-xs text-emerald-400 font-bold mb-1">كاش العهدة في جيبه: ${d.cashOnHand} ر.س</div>
            <div class="text-[11px] text-slate-400">السرعة الحالية: ${d.speed} كم/س</div>
          </div>
        `);
        markersRef.current.drivers[d.id] = marker;
      }
    });

    // إزالة المناديب غير الموجودين
    const driverIds = drivers.map(d => d.id);
    Object.keys(markersRef.current.drivers).forEach(id => {
      if (!driverIds.includes(id)) {
        markersRef.current.drivers[id].remove();
        delete markersRef.current.drivers[id];
      }
    });
  }, [drivers, onSelectDriver]);

  // رسم مواقع عملاء الطلبات النشطة والمسارات
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // مسح المسارات القديمة وعلامات العملاء
    markersRef.current.routes.forEach(r => r.remove());
    markersRef.current.routes = [];
    Object.values(markersRef.current.orders).forEach(m => m.remove());
    markersRef.current.orders = {};

    const activeOrders = orders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));

    activeOrders.forEach(o => {
      if (!o.customerCoords) return;

      const customerIcon = L.divIcon({
        className: 'custom-customer-pin',
        html: `
          <div class="relative cursor-pointer flex flex-col items-center">
            <div class="w-8 h-8 rounded-full bg-cyan-600 border-2 border-cyan-300 flex items-center justify-center text-white shadow-lg shadow-cyan-900/50">
              <span class="text-xs font-bold">📍</span>
            </div>
            <div class="absolute -bottom-5 bg-slate-900/90 text-cyan-300 text-[9px] font-bold px-1 rounded whitespace-nowrap border border-cyan-800">
              ${o.customerName}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(o.customerCoords, { icon: customerIcon }).addTo(map);
      marker.bindPopup(`
        <div class="p-2 text-right" dir="rtl">
          <div class="text-[11px] text-cyan-400 font-bold mb-1">طلب عميل: ${o.id}</div>
          <div class="font-bold text-slate-100 text-sm mb-1">${o.customerName}</div>
          <div class="text-xs text-slate-300 mb-1">${o.customerAddress}</div>
          <div class="text-xs text-amber-400 font-bold">المبلغ: ${o.totalAmount} ر.س (${o.paymentMethod === 'cash' ? 'كاش عند الاستلام' : 'شبكة مدى'})</div>
        </div>
      `);
      markersRef.current.orders[o.id] = marker;

      // رسم خط المسار بين المندوب والعميل إن وُجد المندوب
      if (o.assignedDriverId) {
        const driver = drivers.find(d => d.id === o.assignedDriverId);
        if (driver && driver.coords) {
          const polyline = L.polyline([driver.coords, o.customerCoords], {
            color: '#38bdf8',
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 8',
            lineJoin: 'round'
          }).addTo(map);
          markersRef.current.routes.push(polyline);
        }
      }
    });
  }, [orders, drivers]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* خريطة Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />

      {/* لوحة التحكم الشفافة فوق الخريطة */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-700/60 pb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>رادار التتبع اللحظي للمناديب</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center text-[8px]">🏪</span>
            <span>الفروع</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300 flex items-center justify-center text-[8px]">🛵</span>
            <span>مندوب متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 flex items-center justify-center text-[8px]">🚗</span>
            <span>في طريق التسليم</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-600 border border-cyan-300 flex items-center justify-center text-[8px]">📍</span>
            <span>موقع العميل</span>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة أسفل الخريطة */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-2 text-xs shadow-xl flex items-center gap-4 text-slate-300 pointer-events-auto">
        <div>
          <span className="text-slate-400">إجمالي المناديب: </span>
          <span className="font-bold text-slate-100 font-mono text-sm">{drivers.length}</span>
        </div>
        <div className="w-px h-4 bg-slate-700"></div>
        <div>
          <span className="text-slate-400">في الميدان الآن: </span>
          <span className="font-bold text-amber-400 font-mono text-sm">
            {drivers.filter(d => d.status === 'delivering').length}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-700"></div>
        <div>
          <span className="text-slate-400">متاح للإسناد: </span>
          <span className="font-bold text-emerald-400 font-mono text-sm">
            {drivers.filter(d => d.status === 'available').length}
          </span>
        </div>
      </div>
    </div>
  );
}

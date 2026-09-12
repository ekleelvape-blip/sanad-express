import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Store, UserCheck, Gauge, Phone, Layers, Clock, MapPin, Search } from 'lucide-react';
import { calculateDistanceKm, calculateDrivingMins, getETAtoBranch, getETAtoCustomer, MAP_LAYERS } from '../utils/geo';

export default function LiveMap({ branches = [], drivers = [], orders = [], selectedBranch, onSelectDriver }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({ drivers: {}, branches: {}, orders: {}, routes: [] });

  // طبقة الخريطة الحالية: القمر الصناعي الهجين مع الشوارع افتراضياً
  const [mapLayer, setMapLayer] = useState('satellite');

  // إظهار لوحة رادار أزمنة الوصول
  const [showRadarPanel, setShowRadarPanel] = useState(true);

  // احتساب الرحلات الميدانية النشطة وأزمنة وصولها
  const activeTrips = drivers
    .map(d => {
      const activeOrder = orders.find(o =>
        (o.assignedDriverId === d.id ||
         o.assignedDriverId === d.id?.replace('drv-10', 'drv-') ||
         ('drv-10' + d.id?.replace('drv-', '')) === o.assignedDriverId) &&
        ['assigned', 'picked_up', 'in_transit'].includes(o.status)
      );

      if (!activeOrder) return null;

      const branch = branches.find(b => b.id === activeOrder.branchId) || branches[0] || {
        name: 'المستودع الرئيسي',
        coords: [26.4380, 50.1110]
      };

      const customerCoords = activeOrder.customerCoords || [26.4450, 50.1150];
      const etaBranch = getETAtoBranch(d.coords, branch.coords);
      const etaCustomer = getETAtoCustomer(d.coords, customerCoords);

      return {
        driver: d,
        order: activeOrder,
        branch,
        customerCoords,
        etaBranch,
        etaCustomer
      };
    })
    .filter(Boolean);

  // تهيئة الخريطة مرة واحدة
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // المركز الافتراضي: الدمام والمنطقة الشرقية (مركز العمليات اللوجستية الرئيسي)
    const initialCenter = [26.4380, 50.1110];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    const activeTileLayer = L.tileLayer(MAP_LAYERS[mapLayer].url, {
      maxZoom: MAP_LAYERS[mapLayer].maxZoom,
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(map);

    tileLayerRef.current = activeTileLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // تبديل طبقة الخريطة (شوارع وأحياء السعودية / قمر صناعي / ليلي)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(MAP_LAYERS[mapLayer].url, {
      maxZoom: MAP_LAYERS[mapLayer].maxZoom,
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapLayer]);

  // تحريك الخريطة عند اختيار فرع معين أو ملاءمة الحدود
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedBranch && selectedBranch !== 'all') {
      const b = branches.find(item => item.id === selectedBranch);
      if (b && b.coords) {
        mapInstanceRef.current.flyTo(b.coords, 13, { duration: 1.2 });
      }
    } else if (drivers.length > 0 && drivers[0].coords) {
      mapInstanceRef.current.flyTo([26.4380, 50.1110], 12, { duration: 1.2 });
    }
  }, [selectedBranch, branches]);

  // تحديث علامات الفروع
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

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
        <div class="p-2 text-right font-['Tajawal',sans-serif]" dir="rtl">
          <div class="text-xs font-bold text-purple-400 mb-1">${b.brand}</div>
          <h4 class="font-bold text-slate-100 text-sm mb-1">${b.name}</h4>
          <p class="text-xs text-slate-300 mb-1">${b.district || 'المنطقة الشرقية'}</p>
          <div class="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <span>الطلبات اليوم: ${b.todayOrders || 0}</span> | <span>المناديب النشطين: ${b.activeDrivers || 0}</span>
          </div>
        </div>
      `);

      markersRef.current.branches[b.id] = marker;
    });
  }, [branches, selectedBranch]);

  // تحديث علامات المناديب اللحظية وأزمنة الوصول
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    drivers.forEach(d => {
      const isDelivering = d.status === 'delivering';
      const isOnline = d.online;
      const pulseColor = isDelivering ? 'bg-amber-500' : isOnline ? 'bg-emerald-500' : 'bg-slate-500';
      const borderColor = isDelivering ? 'border-amber-400' : isOnline ? 'border-emerald-400' : 'border-slate-500';

      // فحص الطلب النشط المرتبط بهذا المندوب
      const trip = activeTrips.find(t => t.driver.id === d.id);

      // شارة عداد الدقائق للمستودع والعميل تحت المندوب
      const etaBadgeHtml = trip ? `
        <div class="mt-1 bg-slate-950/95 border border-amber-500/80 text-white rounded-lg px-2 py-0.5 shadow-xl flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold">
          <span class="text-purple-400">⏱️ ${trip.etaBranch.mins}د مستودع</span>
          <span class="text-slate-600">|</span>
          <span class="text-emerald-400">🏁 ${trip.etaCustomer.mins}د عميل</span>
        </div>
      ` : '';

      const driverHtml = `
        <div class="relative cursor-pointer flex flex-col items-center">
          ${isDelivering ? '<div class="absolute -inset-1 rounded-full bg-amber-500/40 animate-ping"></div>' : ''}
          <div class="w-10 h-10 rounded-full ${pulseColor} border-2 ${borderColor} flex items-center justify-center text-white shadow-lg shadow-black/80 hover:scale-125 transition-transform z-10">
            <span class="text-lg">${isDelivering ? '🚗' : '🛵'}</span>
          </div>
          <div class="bg-slate-900/90 border border-slate-700 text-slate-100 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow flex items-center gap-1 mt-0.5">
            <span>${d.name}</span>
            <span class="${d.speed > 0 ? 'text-amber-400' : 'text-slate-400'} font-mono">${d.speed || 0} كم/س</span>
          </div>
          ${etaBadgeHtml}
        </div>
      `;

      const driverIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: driverHtml,
        iconSize: [60, trip ? 60 : 40],
        iconAnchor: [30, 20]
      });

      // بطاقة الفحص اللحظي المنبثقة
      const popupHtml = `
        <div class="p-2 text-right font-['Tajawal',sans-serif]" dir="rtl">
          <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-700 pb-1">
            <span class="font-bold text-slate-100 text-sm">${d.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${isDelivering ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}">
              ${isDelivering ? 'في مهمة توصيل' : 'متاح للطلب'}
            </span>
          </div>
          <div class="text-xs text-slate-300 mb-1">المركبة: ${d.vehicle || 'سيارة خاصة'}</div>
          <div class="text-xs text-slate-300 mb-1">الجوال: <a href="tel:${d.phone}" class="text-purple-400 underline">${d.phone}</a></div>
          <div class="text-xs text-emerald-400 font-bold mb-1">كاش العهدة: ${d.cashOnHand || 0} ر.س</div>
          <div class="text-[11px] text-slate-400 mb-1.5">السرعة الحالية: ${d.speed || 0} كم/س</div>

          ${trip ? `
            <div class="mt-2 p-2 bg-slate-900/95 rounded-xl border border-amber-500/50 space-y-1 text-xs">
              <div class="text-[10px] font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>⏱️ أزمنة الوصول اللحظية</span>
                <span class="font-mono">#${trip.order.id}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-300">🏪 إلى المستودع (${trip.branch.name}):</span>
                <span class="font-bold text-purple-400 font-mono">${trip.etaBranch.mins} دقيقة (${trip.etaBranch.distanceKm} كم)</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-300">📍 إلى العميل (${trip.order.customerName}):</span>
                <span class="font-bold text-emerald-400 font-mono">${trip.etaCustomer.mins} دقيقة (${trip.etaCustomer.distanceKm} كم)</span>
              </div>
              <div class="text-[10px] text-slate-400 truncate pt-0.5">الحي: ${trip.order.customerAddress || 'المنطقة الشرقية'}</div>
            </div>
          ` : ''}
        </div>
      `;

      if (markersRef.current.drivers[d.id]) {
        markersRef.current.drivers[d.id].setLatLng(d.coords);
        markersRef.current.drivers[d.id].setIcon(driverIcon);
        markersRef.current.drivers[d.id].setPopupContent(popupHtml);
      } else {
        const marker = L.marker(d.coords, { icon: driverIcon }).addTo(map);
        marker.on('click', () => {
          if (onSelectDriver) onSelectDriver(d);
        });
        marker.bindPopup(popupHtml);
        markersRef.current.drivers[d.id] = marker;
      }
    });

    const driverIds = drivers.map(d => d.id);
    Object.keys(markersRef.current.drivers).forEach(id => {
      if (!driverIds.includes(id)) {
        markersRef.current.drivers[id].remove();
        delete markersRef.current.drivers[id];
      }
    });
  }, [drivers, activeTrips, onSelectDriver]);

  // رسم مواقع العملاء والمسارات اللحظية بين المندوب والمستودع والعميل
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

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
        <div class="p-2 text-right font-['Tajawal',sans-serif]" dir="rtl">
          <div class="text-[11px] text-cyan-400 font-bold mb-1">طلب عميل: #${o.id}</div>
          <div class="font-bold text-slate-100 text-sm mb-1">${o.customerName}</div>
          <div class="text-xs text-slate-300 mb-1">${o.customerAddress}</div>
          <div class="text-xs text-amber-400 font-bold">المبلغ: ${o.totalAmount} ر.س (${o.paymentMethod === 'cash' ? 'كاش COD' : 'شبكة مدى'})</div>
        </div>
      `);
      markersRef.current.orders[o.id] = marker;

      // رسم مسارات الرحلة المزدوجة (المندوب -> المستودع -> العميل)
      if (o.assignedDriverId) {
        const driver = drivers.find(d => d.id === o.assignedDriverId || d.id === o.assignedDriverId.replace('drv-10', 'drv-'));
        const branch = branches.find(b => b.id === o.branchId) || branches[0];

        if (driver && driver.coords) {
          // مسار المندوب إلى المستودع (بنفسجي متقطع)
          if (branch && branch.coords) {
            const polylineBranch = L.polyline([driver.coords, branch.coords], {
              color: '#c084fc',
              weight: 3,
              opacity: 0.65,
              dashArray: '6, 6',
              lineJoin: 'round'
            }).addTo(map);
            markersRef.current.routes.push(polylineBranch);
          }

          // مسار المندوب إلى العميل (تركواز متقطع)
          const polylineCustomer = L.polyline([driver.coords, o.customerCoords], {
            color: '#38bdf8',
            weight: 3.5,
            opacity: 0.8,
            dashArray: '8, 8',
            lineJoin: 'round'
          }).addTo(map);
          markersRef.current.routes.push(polylineCustomer);
        }
      }
    });
  }, [orders, drivers, branches]);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 font-['Tajawal',sans-serif]">
      {/* خريطة Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[520px]" />

      {/* لوحة التحكم العلوية: مبدل طبقات الخريطة والمفتاح التوضيحي */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-xl text-xs flex flex-col gap-2.5 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>رادار مسارات الفروع والمناديب</span>
          </div>

          {/* زر تبديل الخريطة */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-700 text-[10px] font-bold mr-2">
            <button
              type="button"
              onClick={() => setMapLayer('streets')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${mapLayer === 'streets' ? 'bg-[#00d2d3] text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="شوارع وأحياء السعودية بالعربي"
            >
              شوارع 🗺️
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${mapLayer === 'satellite' ? 'bg-[#00d2d3] text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="قمر صناعي هجين"
            >
              قمر 🛰️
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('dark')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${mapLayer === 'dark' ? 'bg-[#00d2d3] text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="ليلي"
            >
              ليلي 🌙
            </button>
          </div>
        </div>

        {/* دليل الرموز */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center text-[9px]">🏪</span>
            <span>المستودعات / الفروع</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-300 flex items-center justify-center text-[9px]">🛵</span>
            <span>مندوب متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-300 flex items-center justify-center text-[9px]">🚗</span>
            <span>في طريق التسليم</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-600 border border-cyan-300 flex items-center justify-center text-[9px]">📍</span>
            <span>موقع العميل</span>
          </div>
        </div>
      </div>

      {/* لوحة رادار أزمنة الوصول الميدانية الحية (كم دقيقة للمستودع وكم دقيقة للعميل) */}
      {activeTrips.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] max-w-xs w-full bg-slate-900/95 backdrop-blur-md border border-amber-500/60 rounded-2xl p-3 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>أزمنة الوصول اللحظية ({activeTrips.length} رحلات)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRadarPanel(!showRadarPanel)}
              className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
            >
              {showRadarPanel ? 'تصغير ▲' : 'عرض ▼'}
            </button>
          </div>

          {showRadarPanel && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {activeTrips.map((trip) => (
                <div
                  key={trip.order.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-2 text-xs transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100 flex items-center gap-1">
                      <span>🚗 {trip.driver.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">#{trip.order.id.slice(-6)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] my-1">
                    <div className="bg-purple-950/40 border border-purple-800/40 rounded-lg px-2 py-1 flex flex-col">
                      <span className="text-[9px] text-purple-300">إلى المستودع</span>
                      <span className="font-bold text-purple-200 font-mono">⏱️ {trip.etaBranch.mins} دقيقة</span>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-2 py-1 flex flex-col">
                      <span className="text-[9px] text-emerald-300">إلى العميل</span>
                      <span className="font-bold text-emerald-200 font-mono">🏁 {trip.etaCustomer.mins} دقيقة</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="truncate max-w-[170px]">{trip.order.customerName} - {trip.order.customerAddress || 'الشرقية'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (mapInstanceRef.current && trip.driver.coords) {
                          mapInstanceRef.current.flyTo(trip.driver.coords, 15, { duration: 1 });
                        }
                      }}
                      className="text-cyan-400 hover:underline cursor-pointer shrink-0"
                    >
                      تتبع 🔍
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

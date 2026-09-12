// مكتبة الأدوات الجغرافية والملاحة الذكية لسَنَد

/**
 * حساب المسافة بالكيلومتر بين نقطتين جغرافيتين بصيغة Haversine
 * @param {[number, number]} coords1 - [lat, lng]
 * @param {[number, number]} coords2 - [lat, lng]
 * @returns {number} المسافة بالكيلومتر
 */
export function calculateDistanceKm(coords1, coords2) {
  if (!coords1 || !coords2 || !Array.isArray(coords1) || !Array.isArray(coords2)) {
    return 0;
  }
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // تقريب لأقرب 0.1 كم
}

/**
 * حساب زمن الوصول التقديري بالدقائق بناءً على المسافة وظروف حركة السير الحضرية في السعودية
 * (متوسط سرعة الطرق الحضرية مع الإشارات والتقاطعات = 32-38 كم/ساعة + دقيقتين للمناورة والوقوف)
 * @param {number} distanceKm - المسافة بالكيلومتر
 * @returns {number} عدد الدقائق التقريبية
 */
export function calculateDrivingMins(distanceKm) {
  if (!distanceKm || distanceKm <= 0.1) return 1;
  // (المسافة / 35 كم/ساعة) * 60 دقيقة + دقيقتين وقوف ومناورة
  const mins = Math.round((distanceKm / 35) * 60) + 2;
  return Math.max(1, mins);
}

/**
 * حساب زمن الوصول من المندوب إلى المستودع / الفرع
 * @param {[number, number]} driverCoords
 * @param {[number, number]} branchCoords
 * @returns {{ distanceKm: number, mins: number }}
 */
export function getETAtoBranch(driverCoords, branchCoords) {
  const distanceKm = calculateDistanceKm(driverCoords, branchCoords);
  const mins = calculateDrivingMins(distanceKm);
  return { distanceKm, mins };
}

/**
 * حساب زمن الوصول من المندوب إلى العميل
 * @param {[number, number]} driverCoords
 * @param {[number, number]} customerCoords
 * @returns {{ distanceKm: number, mins: number }}
 */
export function getETAtoCustomer(driverCoords, customerCoords) {
  const distanceKm = calculateDistanceKm(driverCoords, customerCoords);
  const mins = calculateDrivingMins(distanceKm);
  return { distanceKm, mins };
}

/**
 * إنشاء رابط ملاحة مباشر في خرائط Google
 * @param {number} lat
 * @param {number} lng
 * @returns {string} رابط التوجيه خطوة بخطوة
 */
export function getGoogleNavUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/**
 * إنشاء رابط ملاحة في Waze
 * @param {number} lat
 * @param {number} lng
 * @returns {string} رابط Waze
 */
export function getWazeNavUrl(lat, lng) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

/**
 * طبقات الخرائط المتوفرة بدقة فائقة وبدون أي قيود أو مفاتيح API (مجانية 100%)
 */
export const MAP_LAYERS = {
  // 1. أقمار صناعية هجينة مدمجة بخطوط وأسماء الشوارع والأحياء بالعربي (Hybrid Satellite)
  satellite: {
    id: 'satellite',
    name: 'أقمار صناعية مع الشوارع 🛰️',
    url: 'https://mt1.google.com/vt/lyrs=y&hl=ar&gl=SA&x={x}&y={y}&z={z}',
    attribution: 'سَنَد • أقمار صناعية مع خطوط الشوارع',
    maxZoom: 20
  },
  // 2. خريطة شوارع وأحياء المملكة التفصيلية (Google Streets Arabic)
  streets: {
    id: 'streets',
    name: 'شوارع وأحياء المملكة 🗺️',
    url: 'https://mt1.google.com/vt/lyrs=m&hl=ar&gl=SA&x={x}&y={y}&z={z}',
    attribution: 'سَنَد • شوارع وأحياء المملكة',
    maxZoom: 20
  },
  // 3. خريطة الشوارع المفتوحة OpenStreetMap
  osm: {
    id: 'osm',
    name: 'الخريطة المفتوحة OSM 🌍',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'سَنَد • OpenStreetMap',
    maxZoom: 19
  },
  // 4. تصوير فضائي نقي عالي النقاء بدون أسماء شوارع Esri
  esri: {
    id: 'esri',
    name: 'تصوير فضائي نقي 📷',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'سَنَد • Esri World Imagery',
    maxZoom: 19
  }
};

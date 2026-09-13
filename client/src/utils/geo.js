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

/**
 * أسعار التوصيل الثابتة الرسمية المعتمدة لمدن المنطقة الشرقية - منصة سَنَد SANAD
 */
export const FIXED_DELIVERY_RATES = {
  'الدمام': 25,
  'سيهات': 30,
  'الظهران': 30,
  'القطيف': 35,
  'الخبر': 35,
  'صفوى': 40,
  'صفوي': 40,
  'الجبيل': 40,
  'الأحساء': 45
};

export const OFFICIAL_CITIES = [
  { id: 'dammam', name: 'الدمام', fee: 25, prefix: 'D', sla: '30 - 45 دقيقة', hub: 'محطة الدمام المركزية' },
  { id: 'saihat', name: 'سيهات', fee: 30, prefix: 'S', sla: '35 - 50 دقيقة', hub: 'محطة سيهات' },
  { id: 'dhahran', name: 'الظهران', fee: 30, prefix: 'DH', sla: '30 - 45 دقيقة', hub: 'محطة الظهران' },
  { id: 'qatif', name: 'القطيف', fee: 35, prefix: 'Q', sla: '40 - 55 دقيقة', hub: 'محطة القطيف' },
  { id: 'khobar', name: 'الخبر', fee: 35, prefix: 'K', sla: '35 - 50 دقيقة', hub: 'محطة الخبر' },
  { id: 'safwa', name: 'صفوى (صفوي)', fee: 40, prefix: 'SF', sla: '45 - 60 دقيقة', hub: 'محطة صفوى' },
  { id: 'jubail', name: 'الجبيل', fee: 40, prefix: 'J', sla: '45 - 60 دقيقة', hub: 'محطة الجبيل' },
  { id: 'ahsa', name: 'الأحساء', fee: 45, prefix: 'AH', sla: '50 - 70 دقيقة', hub: 'محطة الأحساء' }
];

/**
 * استخراج رسم التوصيل الثابت بناءً على العنوان أو اسم المدينة
 * @param {string} addressOrCity
 * @returns {number} رسم التوصيل بالريال السعودي
 */
export function getDeliveryFeeByAddress(addressOrCity) {
  if (!addressOrCity) return 25;
  const text = String(addressOrCity).toLowerCase();
  if (text.includes('صفو') || text.includes('صفوي')) return 40;
  if (text.includes('قطيف') || text.includes('تاروت') || text.includes('سنابس') || text.includes('قديح')) return 35;
  if (text.includes('خبر') || text.includes('عزيزية') || text.includes('عقربية') || text.includes('حزام ذهبي')) return 35;
  if (text.includes('ظهران') || text.includes('دوحة') || text.includes('دانة') || text.includes('قصور') || text.includes('جامعة')) return 30;
  if (text.includes('سيهات') || text.includes('عنك') || text.includes('كوثر')) return 30;
  if (text.includes('جبيل') || text.includes('jubail')) return 40;
  if (text.includes('أحساء') || text.includes('احساء') || text.includes('هفوف')) return 45;
  if (text.includes('دمام') || text.includes('شاطئ') || text.includes('فيصلية') || text.includes('منار')) return 25;
  return 25; // الافتراضي للمركز (الدمام) 25 ريال ثابت
}

// =========================================================================
// سَنَد اللوجستية - Service Worker للعمل في الخلفية وتنبيهات قفل الشاشة
// SANAD Express Service Worker - Background Operations & Lock-Screen Notifications
// =========================================================================

const CACHE_NAME = 'sanad-cache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/driver',
  '/manifest.json',
  '/sanad-express-logo.jpg',
  '/sanad-alert.wav',
  '/sanad-brand.wav',
  '/sanad-silent.wav'
];

// تثبيت وتفعيل فوري للـ Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching assets warning (non-fatal):', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // مسح الكاشات القديمة
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        );
      })
    ])
  );
});

// استلام رسائل من الواجهة الأمامية لإظهار إشعارات النظام (حتى مع قفل الشاشة)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options = {} } = event.data;
    
    const notificationOptions = {
      badge: '/sanad-express-logo.jpg',
      icon: '/sanad-express-logo.jpg',
      vibrate: [400, 150, 400, 150, 600],
      requireInteraction: true,
      silent: false,
      tag: options.tag || 'sanad-alert-' + Date.now(),
      renotify: true,
      data: options.data || {},
      actions: options.actions || [
        { action: 'open_order', title: 'فتح الطلب في سَنَد 🚗' }
      ],
      ...options
    };

    event.waitUntil(
      self.registration.showNotification(title || 'منصة سَنَد اللوجستية 🔔', notificationOptions)
    );
  }
});

// النقر على الإشعار من شاشة القفل أو شريط التنبيهات
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const targetUrl = '/driver' + (orderId ? `?orderId=${encodeURIComponent(orderId)}` : '');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // إذا كان تبويب المندوب مفتوحاً، ركز عليه وأرسل له معرف الطلب
      for (const client of clientList) {
        if (client.url.includes('/driver') && 'focus' in client) {
          if (orderId) {
            client.postMessage({ type: 'FOCUS_ORDER', orderId });
          }
          return client.focus();
        }
      }
      // إذا لم يكن مفتوحاً، افتح نافذة جديدة لمسار المندوب
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// دعم إشعارات الـ Web Push القادمة من السيرفر
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'منصة سَنَد اللوجستية 🔔', body: event.data ? event.data.text() : 'تحديث جديد في سَنَد' };
  }

  const title = data.title || 'سَنَد: وصلك تنبيه جديد 🔔';
  const options = {
    body: data.body || 'شحنة جديدة بانتظار استلامك الميداني',
    icon: '/sanad-express-logo.jpg',
    badge: '/sanad-express-logo.jpg',
    vibrate: [400, 150, 400, 150, 600],
    tag: data.tag || 'sanad-push-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: data.data || {},
    actions: [
      { action: 'open_order', title: 'عرض الطلب 🚗' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// إستراتيجية الكاش للشبكة لتسريع التحميل والحفاظ على استقرار التطبيق الميداني
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات الـ API والـ Socket.IO والمستندات الديناميكية
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('/socket.io/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // كاش ثم شبكة للملفات الثابتة والصوتية
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // إذا كان ملف صوتي أو صورة، خزنه بالكاش للاستخدام بدون إنترنت
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (event.request.url.endsWith('.wav') || event.request.url.endsWith('.jpg') || event.request.url.endsWith('.png'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حال انقطاع الشبكة تماماً
        return caches.match('/');
      });
    })
  );
});

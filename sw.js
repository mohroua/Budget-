const CACHE_NAME = 'budget-manager-cache-v3'; // تم تحديث رقم الإصدار 'v3' للإشارة إلى تغيير في الكاش
const urlsToCache = [
  './',              // يشمل المجلد الجذر (مثلاً، عند الوصول للتطبيق مباشرة)
  'index.html',      // ملف HTML الرئيسي
  'style.css',       // ملف CSS الخاص بالتصميم
  'app.js',          // ملف JavaScript الخاص بمنطق التطبيق
  'manifest.json',   // ملف تعريف PWA
  'icons/401751295182.png', // أيقونة 512x512
  'icons/401751295234.png', // أيقونة 192x192
  // 'icons/icon-128x128.png', // إذا أضفت أحجام أيقونات إضافية في manifest.json، تأكد من إضافتها هنا
  // 'icons/icon-144x144.png',
  // ... إلخ.
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...'); // رسالة سجل للمراقبة
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all app shell content'); // رسالة سجل
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Caching failed:', error); // معالجة الأخطاء
      })
  );
});

// تفعيل الـ Service Worker وتحديث الكاش عند إصدار جديد
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...'); // رسالة سجل
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) { // حذف الكاشات القديمة
            console.log('[Service Worker] Deleting old cache:', cache); // رسالة سجل
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// التعامل مع الطلبات وتوفيرها من الكاش إن وُجدت (Cache-First Strategy)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // إذا كان الطلب موجوداً في الكاش، قم بإرجاعه
          return response;
        }
        // إذا لم يكن الطلب موجوداً في الكاش، حاول جلبه من الشبكة
        return fetch(event.request).catch(() => {
          // إذا فشل جلب الطلب من الشبكة (عدم وجود اتصال مثلاً)
          // وتحاول جلب مستند (صفحة HTML)، أعد index.html من الكاش
          if (event.request.destination === 'document') {
            console.log('[Service Worker] Fetch failed, serving offline page.');
            return caches.match('index.html'); // يمكن تغيير هذا إلى 'offline.html' إذا كان لديك صفحة مخصصة للوضع غير المتصل
          }
          // لأي نوع آخر من الطلبات (مثل الصور التي لم يتم تخزينها مؤقتًا)، يمكنك إرجاع استجابة فارغة أو Fallback
          // return new Response(null, { status: 404, statusText: 'Not Found' });
        });
      })
  );
});

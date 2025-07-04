const CACHE_NAME = 'budget-manager-cache-v1';
const urlsToCache = [
  'index.html',
  'sw.js',
  'manifest.json',
  'icons/401751295234.png'

  // الخطوط الخارجية (Google Fonts)
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
  'https://fonts.gstatic.com/s/cairo/v29/SLXGc1nY6HgpbiHwPo7L_W5fI4hYgS_Yh9yH6L3A.woff2', // ملف الخط الفعلي (قد يتغير المسار)
  'https://fonts.gstatic.com/s/cairo/v29/SLXGc1nY6HgpbiHwPo7L_W5fI4hYgS_Yh9yH6L3A.woff',  // نسخة أخرى من ملف الخط

  // مكتبة Font Awesome (CSS و Webfonts)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  // تأكد من إضافة مسارات ملفات webfonts الخاصة بـ Font Awesome إذا كنت تستضيفها محليًا أو تحديدها في service worker
  // عادةً ما يتم جلبها تلقائيًا بواسطة ملف CSS، ولكن يمكن إضافتها لتأمينها بشكل أكبر.
  // مثال:
  // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2',

  // مكتبات JavaScript الخارجية
  'https://cdn.jsdelivr.net/npm/chart.js', // مكتبة Chart.js
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', // مكتبة jsPDF
];

// 3. حدث 'install': يتم تفعيل Service Worker هنا وتخزين الموارد مؤقتًا
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        // قم بإضافة جميع الموارد الهامة إلى ذاكرة التخزين المؤقت
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Cache.addAll failed', error);
      })
  );
});

// 4. حدث 'activate': يتم تفعيله بعد التثبيت، ويستخدم لتنظيف ذاكرات التخزين المؤقت القديمة
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  // قم بتحديد ذاكرات التخزين المؤقت القديمة وحذفها
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('salary-manager-cache')) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 5. حدث 'fetch': يتم اعتراض طلبات الشبكة هنا لتقديم الموارد من ذاكرة التخزين المؤقت أولاً
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا كان المورد موجودًا في ذاكرة التخزين المؤقت، قم بتقديمه
        if (response) {
          return response;
        }
        // إذا لم يكن موجودًا، قم بطلب المورد من الشبكة
        return fetch(event.request)
          .then(networkResponse => {
            // تحقق مما إذا كان الطلب صالحًا قبل التخزين المؤقت
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // إذا كان صالحًا، قم بتخزين المورد مؤقتًا وتقديمه
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          })
          .catch(() => {
            // هذا الجزء يعمل عندما يفشل جلب المورد من الشبكة ولا يكون موجودًا في الكاش
            // يمكنك هنا تقديم صفحة "غير متصل بالإنترنت" مخصصة
            // For example, if you have an offline.html:
            // return caches.match('/offline.html');
            console.log('Service Worker: Fetch failed and no cache match for', event.request.url);
          });
      })
  );
});


const CACHE_NAME = 'budget-manager-cache-v1';
const urlsToCache = [
  'index.html',
  'manifest.json',
  'icons/401751295234.png',
  'icons/401751295182.png',
  // أضف أي ملفات CSS أو JS تستخدمها هنا مثلاً:
  // 'style.css',
  // 'app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

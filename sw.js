
const CACHE_NAME = 'budget-cache-v1';
const urlsToCache = ['index.html', 'app.js', 'style.css', 'manifest.json', 'libs/chart.min.js', 'libs/jspdf.umd.min.js', 'fontawesome/css/all.min.css', 'fontawesome/webfonts/fa-regular-400.woff2', 'fontawesome/webfonts/fa-solid-900.woff2', 'fonts/Cairo-Black.woff2', 'icons/401751295234.png', 'icons/401751493453.png'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

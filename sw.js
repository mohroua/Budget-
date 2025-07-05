const CACHE_NAME = "budget-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/fontawesome/css/all.min.css",
  "/fontawesome/webfonts/fa-solid-900.woff2",
  "/fontawesome/webfonts/fa-regular-400.woff2",
  "/fonts/Cairo.woff2",
  "/libs/chart.min.js",
  "/libs/jspdf.umd.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

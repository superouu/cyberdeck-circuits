/* Cyberdeck Circuits service worker: makes the game work offline once installed.
   Network-first, so players always get the newest levels when online,
   and the cached copy when there's no connection. */
const CACHE = "cyberdeck-v1";
const CORE = [
  "./",
  "index.html",
  "css/style.css",
  "js/core.js",
  "js/levels/ch1-power.js",
  "js/levels/ch2-logic.js",
  "js/levels/ch3-esp32.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // keep a copy of our own files and the Google Fonts the page uses
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});

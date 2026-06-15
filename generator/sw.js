/* ============================================================================
 * HMG StoreForge v7 — Generator Service Worker (PWA: installable + offline)
 * Lets you install the generator on phone/laptop/desktop and use it offline.
 * The store templates are embedded in templates.js, so generation works offline.
 * (JSZip is from a CDN — caught and cached when first online; one-click GitHub
 *  deploy needs internet, but ZIP generation works offline.)
 * ==========================================================================*/
const CACHE = "storeforge-generator-v7";
const SHELL = [
  "./", "./index.html",
  "./assets/css/generator.css",
  "./assets/js/brand.js", "./assets/js/templates.js",
  "./assets/js/generator.js", "./assets/js/github-deploy.js",
  "./assets/images/storeforge-logo.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Don't cache GitHub API calls
  if (req.url.includes("api.github.com")) return;
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      if (res.ok && new URL(req.url).origin === location.origin) caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});

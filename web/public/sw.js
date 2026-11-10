// Naikkan VERSION bila strategi cache berubah; cache versi lama dihapus saat activate.
const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";

// Halaman akun & API tidak boleh tersimpan di cache perangkat.
const PRIVATE = /^\/(dashboard|masuk|auth|api)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function store(cacheName, request, response) {
  if (response.ok && response.type === "basic" && !response.redirected) {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || PRIVATE.test(url.pathname)) return;

  // Halaman: selalu ambil versi terbaru; versi tersimpan hanya dipakai saat offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => store(PAGE_CACHE, request, response))
        .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL))
    );
    return;
  }

  // Aset build Next ber-hash, jadi aman disimpan permanen.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches
        .match(request)
        .then((hit) => hit || fetch(request).then((response) => store(STATIC_CACHE, request, response)))
    );
  }
});

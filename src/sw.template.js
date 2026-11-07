const CACHE_VERSION = "__CACHE_VERSION__";
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = "runtime-v1";
const PRECACHE_URLS = __PRECACHE_URLS__;
const RUNTIME_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("shell-") && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put("./", response.clone());
    return response;
  } catch {
    return (
      (await cache.match("./")) ||
      (await cache.match("./index.html")) ||
      new Response("offline ♡", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate" && url.origin === self.location.origin) {
    if (/\/(index\.html)?$/.test(url.pathname)) {
      event.respondWith(networkFirstPage(request));
    }
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (RUNTIME_HOSTS.has(url.hostname)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});

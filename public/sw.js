const CACHE_NAME = "outlet-cache-v1";
const STATIC_ASSETS = ["/", "/billing", "/stock", "/reports", "/settings"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude non-GET, cross-origin, API paths, and hot-reload/HMR requests
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin) ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes("hot-update") ||
    url.pathname.includes("webpack-hmr")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful basic GET responses (same-origin, status 200)
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

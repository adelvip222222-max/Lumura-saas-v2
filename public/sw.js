const CACHE_NAME = "lumura-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests and skip internal Next.js dev server, API, and billing domains
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("/_next/") ||
    event.request.url.includes("stripe.com") ||
    event.request.url.includes("cloudinary.com")
  ) {
    return;
  }

  // Network first, falling back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful requests from origin (except admin/dashboard modules)
        if (
          response.status === 200 &&
          event.request.url.startsWith(self.location.origin) &&
          !event.request.url.includes("/admin") &&
          !event.request.url.includes("/dashboard")
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Serve from cache if offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
        });
      })
  );
});

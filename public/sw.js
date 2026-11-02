// Klovers Service Worker — v1
// Strategy:
//   Static assets (JS/CSS/images) → Cache-First (immutable bundles)
//   Navigation (HTML)             → Network-First with offline fallback
//   Supabase API / edge functions → Network-Only (never cache auth/data)

// Bump this whenever a non-hashed /public asset changes (book covers, logo,
// etc.) - it is the only thing that busts the image cache below, since the
// "7-day expiry" in the comment was never actually implemented and images
// were being cached-first forever. (Found 3 Nov 2026: restyled book covers
// kept showing the old art to any visitor who had the site open before.)
const CACHE_NAME = "klovers-v3";
const OFFLINE_URL = "/";

// Assets to pre-cache on install (shell)
const PRECACHE_URLS = [
  "/",
  "/favicon.ico",
  "/klovers-logo.jpg",
  "/klovers-mascot.svg",
  "/manifest.json",
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET, chrome-extension, or Supabase/API calls
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Cross-origin requests (Google Fonts files on fonts.gstatic.com, analytics)
  // are left to the browser. Handling them here would make the worker fetch
  // them itself, and a worker's fetch() is governed by the CSP's connect-src,
  // which does not list fonts.gstatic.com - so every web font failed with the
  // page's own font-src allowing it. That is why Poppins / Inter / Cairo /
  // Kalam still did not load after the CSP fix (PR #612).
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. Immutable static assets (hashed filenames) → Cache-First
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // 3. Images → Cache-First. NOTE: despite the old comment here, there is no
  // expiry logic below - a cached image is served forever until CACHE_NAME
  // changes. Bump CACHE_NAME above whenever a cover or other /public image
  // is restyled, or returning visitors will keep seeing the old file.
  if (
    request.destination === "image" ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".avif")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // 4. Navigation requests → Network-First with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // 5. Everything else → Network-Only
});

// ─── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Klovers", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Klovers", {
      body: data.body || "",
      icon: "/klovers-logo.jpg",
      badge: "/favicon.ico",
      tag: data.tag || "klovers-notification",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === targetUrl && "focus" in c);
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});

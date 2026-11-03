// Klovers Service Worker — v1
// Strategy:
//   Static assets (JS/CSS/images) → Cache-First (immutable bundles)
//   Navigation (HTML)             → Network-First with offline fallback
//   Supabase API / edge functions → Network-Only (never cache auth/data)

// v4 (3 Nov 2026): images below were pure Cache-First, matched by URL only.
// Every further cover edit after the v2->v3 bump (same fix, same day) went
// stale again for anyone who had already loaded the old file under v3 -
// bumping CACHE_NAME only flushes what was already cached, it does nothing
// for the NEXT edit to a file whose URL does not change (which is every
// cover: cover_b2.jpg stays cover_b2.jpg forever). Section 3 below now does
// stale-while-revalidate instead, so this bump is the last one that should
// ever be needed for an image content change - see the note there.
const CACHE_NAME = "klovers-v4";
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

  // 3. Images -> Stale-While-Revalidate. Serves the cached copy instantly
  // (so repeat views stay fast/offline-friendly) but ALWAYS fires a network
  // fetch in parallel to refresh the cache for the next load. Plain
  // Cache-First here meant every cover-photo edit needed a manual CACHE_NAME
  // bump to ever reach a visitor who had already loaded the old file - and
  // the bump only fixes files touched before it, not the next edit, which is
  // exactly what happened twice in one day (3 Nov 2026) to the same book
  // covers. With SWR, a visitor sees the stale image at most once more after
  // a cover changes, then the background refresh has it cached fresh.
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
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached || Response.error());
          return cached || network;
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

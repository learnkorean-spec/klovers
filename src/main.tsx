import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
// i18next is NOT imported here (6 Oct 2026). Only the admin dashboard uses
// it (AdminDashboard.tsx, StudentsTab.tsx and EnrollmentsTab.tsx each import
// "@/i18n/config" themselves), so loading it here put i18next and
// react-i18next in every visitor's first download for nothing.
import { initSentry } from "./lib/sentry";
import ErrorBoundary from "./components/ErrorBoundary";
import { installJsonLdDedupe } from "./lib/jsonLdDedupe";

// Sentry was initialised TWICE here: once through `initSentry()` and again
// through a second `Sentry.init` in this file, each with its own integration
// list and its own sample rates (tracesSampleRate 0.1 vs 0.2,
// replaysOnErrorSampleRate 0.1 vs 1.0). The second call won silently, so the
// configuration documented in src/lib/sentry.ts — the one with the
// `ignoreErrors` and `beforeSend` filters — was never the one in effect
// wherever a DSN is set. There is now one call, and one place that owns the
// configuration.
initSentry();

// Reload the page when a lazy-loaded chunk fails to fetch (stale deploy).
// Vite fires this event when a dynamic import 404s after a new production build.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

/**
 * Send stray domains to kloversegy.com — but not the preview deployments.
 *
 * This redirect used to fire on ANY hostname that was not the canonical one,
 * which included every Vercel preview build. Opening a branch preview bounced
 * you straight to production, so the preview showed the code already live
 * rather than the code under review. The effect was that no change could be
 * looked at before it was merged: the only way to see a branch was to ship it.
 * Two separate reviews on 9 Sep hit this within an hour of each other.
 *
 * The redirect is still worth having. Its job is SEO — a second host serving
 * the same pages splits ranking signals — and the hosts that actually threaten
 * that are the stable ones: www.kloversegy.com and the short production alias
 * klovers.vercel.app. Both still redirect.
 *
 * Preview deployments do not threaten it. Vercel serves them with
 * `X-Robots-Tag: noindex` by default, they are not linked from anywhere, and
 * their hostnames are per-deployment. They all sit under this team's suffix,
 * which is what the exemption matches — a branch alias like
 * `klovers-git-<branch>-learnkorean-specs-projects.vercel.app` and a build URL
 * like `klovers-<hash>-learnkorean-specs-projects.vercel.app` both end in it,
 * while `klovers.vercel.app` does not and keeps redirecting.
 *
 * localhost and 127.0.0.1 were already exempt; 0.0.0.0 and the *.local
 * hostnames a phone uses to reach a dev server on the same wifi were not, and
 * are now, because testing a layout on a real phone is the other time this bit.
 */
const CANONICAL = "kloversegy.com";
const PREVIEW_SUFFIX = "-learnkorean-specs-projects.vercel.app";

const isCanonicalHost = (host: string) => host === CANONICAL;
const isLocalHost = (host: string) =>
  host === "localhost" ||
  host === "0.0.0.0" ||
  host.includes("127.0.0.1") ||
  host.endsWith(".local");
const isPreviewHost = (host: string) => host.endsWith(PREVIEW_SUFFIX);

if (typeof window !== "undefined") {
  const host = window.location.hostname;
  if (!isCanonicalHost(host) && !isLocalHost(host) && !isPreviewHost(host)) {
    window.location.replace(
      `https://${CANONICAL}${window.location.pathname}${window.location.search}${window.location.hash}`
    );
  }
}

// Static HTML carries JSON-LD for crawlers; pages also add their own. Keep one
// copy of each @type (see src/lib/jsonLdDedupe.ts).
installJsonLdDedupe();

// One boundary, not two.
//
// This used to nest `<Sentry.ErrorBoundary>` around `<ErrorBoundary>`, and the
// two rendered the same markup — the same "Something went wrong" heading, the
// same message, the same "Try again" — so whichever caught a given error, the
// reader saw the same screen. The outer one existed only to reach Sentry, and
// it paid a static `@sentry/react` import for that. ErrorBoundary now reports
// through `captureException`, which loads Sentry on demand, so the outer
// boundary is gone and the SDK is no longer in the entry chunk.
const mount = () =>
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );

/**
 * Homepage: let the hero shell's photo paint before the app mounts
 * (6 Oct 2026).
 *
 * index.html paints the hero (photo, headline, paragraph) from plain HTML on
 * "/" and "/ar" (#kl-hero-shell). On a fast connection the app used to mount
 * and remove the shell BEFORE its photo had arrived, so the photo's first
 * paint happened inside React's hero instead. Lighthouse then counted all of
 * the app's start-up work as part of the Largest Contentful Paint (PageSpeed
 * mobile LCP 5.2s, render delay 0.8-2.2s).
 *
 * So on those two pages the app waits for the shell photo to load and paint
 * (two animation frames), capped at 2.5s. The visitor sees the full first
 * screen the whole time. On a slow phone the JS takes longer than the photo
 * anyway, so nothing is delayed there. Every other route mounts at once.
 */
const shellImg = document.querySelector<HTMLImageElement>("#kl-hero-shell img");
if (shellImg && !shellImg.complete) {
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    requestAnimationFrame(() => requestAnimationFrame(mount));
  };
  shellImg.addEventListener("load", start, { once: true });
  shellImg.addEventListener("error", start, { once: true });
  window.setTimeout(start, 2500);
} else {
  mount();
}

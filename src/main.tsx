import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import "./i18n/config";
import { initSentry, Sentry } from "./lib/sentry";
import ErrorBoundary from "./components/ErrorBoundary";

// Initialize Sentry as early as possible so it can capture init-time errors.
initSentry();

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  });
}

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

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div className="space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>
          <button
            className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity"
            onClick={resetError}
          >
            Try again
          </button>
        </div>
      </div>
    )}
    showDialog={false}
  >
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </Sentry.ErrorBoundary>
);

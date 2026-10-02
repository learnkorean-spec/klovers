/**
 * Sentry — loaded off the critical path.
 *
 * The SDK used to be a static import of main.tsx and of ErrorBoundary.tsx, so
 * `@sentry/react` and its dependencies were baked into the entry chunk on
 * every route: measured 2026-10-03, `dist/assets/index-*.js` is 423.5 KB raw /
 * 134.9 KB gzip and contains the SDK. At the same time neither `.env` nor
 * `deploy-functions.yml` sets `VITE_SENTRY_DSN`, so on the deployed site
 * `initSentry()` returned at its first line and none of that weight could
 * report a single error.
 *
 * It is now imported only when a DSN is actually configured. With the
 * variable unset, `SENTRY_DSN` is `undefined` at build time, this branch is
 * statically false, and the bundler drops the import and the whole SDK with
 * it. With a DSN set, the SDK arrives as its own chunk after module
 * evaluation instead of blocking the entry chunk.
 *
 * The one behavioural cost, stated plainly: when a DSN IS configured, Sentry's
 * `window.onerror` hook is installed a network round-trip later than before,
 * so an error thrown in the first few milliseconds of the very first script
 * may not be reported. `captureException` below does not have that gap — it
 * awaits the same load, so anything routed through an ErrorBoundary is
 * captured whenever the load finishes.
 */

type SentryModule = typeof import("@sentry/react");

/** Read once, at build time. Vite inlines this. */
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let loaded: SentryModule | null = null;
let pending: Promise<SentryModule | null> | null = null;

/**
 * Import and initialise Sentry exactly once, on the first caller.
 *
 * Returns `null` — synchronously resolved — when no DSN is configured, which
 * is the common case and costs nothing.
 */
const ensure = (): Promise<SentryModule | null> => {
  if (pending) return pending;

  if (!SENTRY_DSN) {
    pending = Promise.resolve(null);
    return pending;
  }

  pending = import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_RELEASE_SHA || undefined,
        // Capture 10% of normal traffic; 100% on errors.
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        // Replay only on errors to keep payload small.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: import.meta.env.PROD ? 0.1 : 0,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
        ],
        // Ignore noisy third-party / browser-extension errors.
        ignoreErrors: [
          "ResizeObserver loop limit exceeded",
          "ResizeObserver loop completed with undelivered notifications",
          "Non-Error promise rejection captured",
          /^Network request failed/i,
          /Loading chunk \d+ failed/i,
          /Loading CSS chunk \d+ failed/i,
        ],
        beforeSend(event) {
          // Drop events from localhost in production builds (rare, but possible).
          if (
            import.meta.env.PROD &&
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1")
          ) {
            return null;
          }
          return event;
        },
      });
      loaded = Sentry;
      return Sentry;
    })
    .catch(() => null);

  return pending;
};

/**
 * Start loading Sentry. Safe to call unconditionally and more than once —
 * callers that do not await it lose nothing, because `captureException`
 * awaits the same promise before sending.
 */
export function initSentry(): void {
  void ensure();
}

/**
 * Report an exception. No-ops (resolving to nothing) when no DSN is
 * configured, and otherwise waits for the SDK so an error raised before the
 * import lands is still reported rather than dropped.
 */
export function captureException(
  error: unknown,
  context?: { tag?: string; extra?: Record<string, unknown> }
): void {
  void ensure().then((Sentry) => {
    if (!Sentry) return;
    Sentry.withScope((scope) => {
      if (context?.tag) scope.setTag("errorBoundary", context.tag);
      for (const [key, value] of Object.entries(context?.extra ?? {})) {
        scope.setExtra(key, value);
      }
      Sentry.captureException(error);
    });
  });
}

/** For tests and for the rare caller that needs the live instance. */
export const sentryIsLoaded = (): boolean => loaded !== null;

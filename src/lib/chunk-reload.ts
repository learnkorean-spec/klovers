/**
 * Recover from a chunk that disappeared under an open tab.
 *
 * THE FAILURE
 * Every deploy content-hashes each chunk into a new filename and removes the
 * old ones. A tab opened before a deploy still holds the previous index, so
 * the first lazily-loaded screen it opens afterwards requests a filename that
 * is no longer on the CDN:
 *
 *   Failed to fetch dynamically imported module: .../LeadsPanel-DHyJqSz3.js
 *
 * `admin_error_log` has three of these across three weeks and three different
 * tabs. It is not flaky — it is certain for anyone with the admin open while
 * we ship, which is several times a day.
 *
 * WHY THE EXISTING RETRY BUTTON CANNOT FIX IT
 * TabErrorBoundary catches the error and offers Retry, but Retry re-runs the
 * same import against the same dead URL. Only a document reload picks up the
 * new index, and only the document can do that — no amount of React state can.
 *
 * WHY THE EVENT AND NOT A WRAPPER
 * Vite emits `vite:preloadError` for precisely this case. One listener covers
 * every dynamic import in the app, including the ~26 inside
 * AdminDashboard.tsx, without editing each call site.
 *
 * THE GUARD IS THE IMPORTANT PART
 * A chunk can also 404 for reasons a reload will never fix: a half-finished
 * deploy, a stale service worker, a blocked CDN, no network. Reloading on
 * every failure would spin the page forever and the user could not even read
 * the error. So: at most one reload per tab, and the marker is cleared after a
 * quiet minute so an unrelated failure later in the same session can still
 * recover.
 */

const KEY = "klovers:chunk-reload-at";
/** How long a reload attempt suppresses the next one. */
const COOLDOWN_MS = 60_000;

function readAttempt(): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? Number(raw) : null;
  } catch {
    // Private mode, or storage disabled. Treat as "no attempt recorded" —
    // the worst case is one extra reload, which is still better than a
    // permanently broken screen.
    return null;
  }
}

function recordAttempt(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* see readAttempt */
  }
}

/** True if we already tried a reload recently and it did not help. */
function reloadWouldLoop(): boolean {
  const last = readAttempt();
  return last !== null && Date.now() - last < COOLDOWN_MS;
}

export function installChunkReload(): () => void {
  const onPreloadError = (event: Event) => {
    if (reloadWouldLoop()) {
      // Let it through to the error boundary. A visible "failed to load" is a
      // far better outcome than a page that reloads forever.
      console.warn("[chunk-reload] already reloaded once, not retrying");
      return;
    }

    // Stops Vite rethrowing, so nothing renders an error mid-reload.
    event.preventDefault();
    recordAttempt();
    console.warn("[chunk-reload] stale chunk after a deploy — reloading");
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", onPreloadError);
  return () => window.removeEventListener("vite:preloadError", onPreloadError);
}

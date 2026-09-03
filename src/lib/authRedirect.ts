/**
 * Helpers for the `?redirect=` parameter that carries a student from wherever
 * she started (the trial email, a pricing button) through signup or login and
 * on to where she was actually going.
 *
 * The value arrives in a URL, so it is attacker-controllable and is treated as
 * untrusted everywhere below.
 */

/** Where the intended destination is parked while the student authenticates. */
const REDIRECT_KEY = "enroll_redirect";

/**
 * Accept a redirect only if it is a path on this site.
 *
 * It must start with a single "/". A value starting with "//" is rejected:
 * browsers read `//evil.example` as protocol-relative, so allowing it would
 * hand someone a link that walks a student through our own login form and then
 * drops her on another origin.
 */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/** `withRedirect("/login", "/trial-booking")` -> `/login?redirect=%2Ftrial-booking` */
export function withRedirect(path: string, redirect: string | null | undefined): string {
  const safe = safeRedirect(redirect);
  return safe ? `${path}?redirect=${encodeURIComponent(safe)}` : path;
}

/**
 * Park the destination so it survives a trip through the inbox.
 *
 * Password reset leaves the site entirely - the student opens an email, clicks
 * a link, sets a new password, and arrives at the login page in what may be a
 * different tab. A query parameter cannot follow her through that; this can.
 * LoginPage reads this key on every post-auth path.
 */
export function rememberRedirect(redirect: string | null | undefined): void {
  const safe = safeRedirect(redirect);
  if (!safe) return;
  try {
    localStorage.setItem(REDIRECT_KEY, safe);
  } catch {
    // Private mode, or storage disabled. Losing the destination costs the
    // student one extra click; it must never cost her the password reset.
  }
}

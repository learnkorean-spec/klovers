/**
 * lcp-preload.mjs — decides which image a prerendered route should preload.
 *
 * `index.html` ships one preload tag:
 *
 *     <link rel="preload" as="image" href="/hero-world.jpg" fetchpriority="high">
 *
 * and scripts/prerender-meta.mjs copies that document to every route it emits.
 * That is correct for exactly one route — the homepage — and wrong for the
 * other 200-odd, where it tells the browser to fetch, at the highest priority
 * available, a file the page never renders.
 *
 * The cost is not just a wasted request. A `fetchpriority="high"` preload
 * competes with the element that actually is the LCP for connection slots and
 * bandwidth, so the tag whose entire purpose is to make the largest paint
 * arrive sooner makes it arrive later. On an article page the real LCP
 * candidate is the article's own hero image, which the page already names in
 * its og:image on the same document.
 *
 * Pure functions, no I/O, so the decision is unit-testable without a build.
 */

/** The tag as index.html ships it — matched loosely enough to survive an
 * attribute reorder or a change of image, tightly enough not to touch any
 * other preload the document may grow later. */
export const PRELOAD_PATTERN =
  /[ \t]*<link rel="preload"[^>]*as="image"[^>]*>\n?/g;

/**
 * What a route should preload, or null for "nothing".
 *
 * - homepage: keep whatever index.html shipped. It was chosen for this page.
 * - article with a hero image: that hero, at high priority.
 * - anything else: nothing. This script cannot know what a marketing page's
 *   largest element is, and a preload pointing at the wrong file is worse
 *   than no preload at all — which is the bug this module exists to fix.
 */
export function preloadHrefFor({ isHome, heroImage } = {}) {
  if (isHome) return null; // caller leaves the shipped tag untouched
  if (!heroImage) return null;
  const trimmed = String(heroImage).trim();
  return trimmed.length ? trimmed : null;
}

/** The replacement tag, or "" to drop the preload entirely. */
export function preloadTagFor(route, { attr }) {
  const href = preloadHrefFor(route);
  if (!href) return "";
  return `    <link rel="preload" as="image" href="${attr(href)}" fetchpriority="high" />\n`;
}

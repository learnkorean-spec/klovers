/**
 * document-language.mjs — what language a prerendered document declares itself
 * to be, at the document level.
 *
 * THE DEFECT THIS EXISTS TO FIX
 *
 * index.html ships `<html lang="en">` with no `dir` attribute, and
 * scripts/prerender-meta.mjs copies that document to every route without ever
 * rewriting the root element. All 100 published Arabic articles therefore
 * declared themselves English at the document level.
 *
 * Verified on production, 2026-09-06, by fetching the raw HTML of
 * /blog/korean-idol-fandom-glossary-ar:
 *
 *   <html lang="en">                                    <- the document
 *   <meta property="og:locale" content="en_US" />       <- the social locale
 *   <div id="article-prerendered" lang="ar" dir="rtl">  <- the actual content
 *   "inLanguage": "ar"                                  <- the BlogPosting JSON-LD
 *
 * Three of those four say Arabic. The two that a crawler reads FIRST, and
 * which scope the whole document, said English — and with no `dir`, an RTL
 * page was being laid out left-to-right for anything rendering the raw HTML
 * before the bundle loads.
 *
 * WHY REPLACE THE WHOLE TAG
 *
 * `htmlTagFor` returns a complete `<html …>` element rather than patching
 * attributes onto the existing one. Patching would have to handle "lang is
 * present", "lang is absent", "dir is present", "dir is absent" and their
 * combinations, and getting one wrong produces `<html lang="en" lang="ar">` —
 * which browsers resolve to the FIRST occurrence, i.e. silently keeps the bug.
 * Replacing the element outright makes a duplicate attribute unrepresentable.
 *
 * The trade-off, stated plainly: any other attribute someone later adds to
 * `<html>` in index.html would be dropped from every prerendered page. There
 * are none today, and the test suite asserts the shape of what is emitted.
 *
 * Pure functions, no I/O — same reason as related-posts.mjs and lcp-preload.mjs:
 * prerender-meta.mjs is a top-to-bottom build script that runs on import and
 * cannot be imported from a test.
 */

/**
 * The document element as index.html ships it, matched loosely enough to
 * survive an attribute being added or reordered.
 *
 * Not global: there is exactly one <html> element, and a global regexp would
 * carry `lastIndex` state between routes in the emit loop.
 */
export const HTML_TAG_PATTERN = /<html\b[^>]*>/i;

/**
 * The language a route's document should declare.
 *
 * A blog post says so in its `lang` column. A marketing route is English
 * unless it declares `lang: "ar"` itself — since 24 Sep 2026 exactly one does,
 * the Arabic homepage at /ar. Every other marketing page still has no Arabic
 * URL (docs/RENDERING_DECISION_2026-08.md §5), so English is the correct
 * answer for them, not a default-by-omission.
 */
export function languageOf(route) {
  if (route?.lang === "ar") return "ar";
  return route?.post?.lang === "ar" ? "ar" : "en";
}

/** Writing direction for a language. */
export function directionOf(lang) {
  return lang === "ar" ? "rtl" : "ltr";
}

/**
 * The Open Graph locale for a language.
 *
 * `ar_AR` rather than `ar_EG`: Facebook's locale list is a fixed enumeration
 * and `ar_AR` is the only Arabic entry in it. index.html has been shipping
 * `og:locale:alternate = ar_EG`, which is not a value any consumer recognises
 * — plausible as a guess from the site's Egyptian audience, but it is not a
 * locale Facebook accepts.
 */
export function ogLocaleOf(lang) {
  return lang === "ar" ? "ar_AR" : "en_US";
}

/** The opposite language, for the alternate locale of a translated page. */
export const otherLanguage = (lang) => (lang === "ar" ? "en" : "ar");

/** The complete document element for a language. */
export function htmlTagFor(lang) {
  return `<html lang="${lang}" dir="${directionOf(lang)}">`;
}

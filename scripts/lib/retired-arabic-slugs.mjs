/**
 * retired-arabic-slugs.mjs — the single source of truth for which Arabic blog
 * slugs are retired behind a 301, and where each one now lives.
 *
 * Why this exists: 8 English articles ended up with TWO published Arabic
 * translations each — one written in 2025 using the `<base>-ar` suffix
 * convention, and one written in 2026 (a re-run of the article generator that
 * did not know the 2025 version existed) using the legacy `ar-<base>` prefix
 * convention. Confirmed independently against the live database:
 *
 *   - every `-ar` suffix version predates its `ar-` prefix duplicate by about
 *     a year, and carries all the view history (26 views across the 8 pairs,
 *     vs 0 across all eight 2026 duplicates);
 *   - the Korean example sentences in each pair are NOT the same lesson
 *     reordered — they overlap by as little as 0% and as much as 78% of
 *     shared Hangul terms, so both sides were independently written, not
 *     copy-pasted. See docs/SEO_GATE1_DUPLICATE_SLUGS.md for the per-pair data.
 *
 * The `-ar` suffix is the survivor for all 8, because it is the convention 90
 * of the 100 Arabic posts already use, it is what carries the view history,
 * and it is what scripts/prerender-meta.mjs and api/sitemap.xml.js already
 * pick as the hreflang target when two Arabic translations exist (see Fix 1,
 * `fix/sitemap-arabic-loc`).
 *
 * Two further `ar-` prefix posts are NOT duplicates and are not in this list:
 * `ar-korean-cafe-culture` and `ar-learn-korean-alphabet-hangul` are each the
 * ONLY Arabic translation of their English article, just published under a
 * slug that does not match their partner's base
 * (`korean-cafe-coffee-culture`, `learn-korean-alphabet-hangul-guide`).
 * Converting those two to the suffix convention needs an actual slug rename in
 * `blog_posts`, which is a live production data write with no history table to
 * recover from - this file intentionally does NOT redirect them yet. See
 * `PENDING_SLUG_RENAMES` below and docs/SEO_GATE1_DUPLICATE_SLUGS.md.
 */

/**
 * Confirmed duplicate pairs. `from` is retired behind a 301 in vercel.json;
 * `to` is the slug that survives, carries the hreflang cluster, and is the
 * only one of the pair a fresh sitemap build gives a `<loc>` to.
 */
export const RETIRED_ARABIC_SLUGS = [
  { from: "ar-korean-daily-greetings", to: "korean-daily-greetings-ar" },
  { from: "ar-korean-food-vocabulary", to: "korean-food-vocabulary-ar" },
  { from: "ar-korean-grammar-particles", to: "korean-grammar-particles-ar" },
  { from: "ar-korean-numbers-guide", to: "korean-numbers-guide-ar" },
  { from: "ar-korean-slang-words", to: "korean-slang-words-ar" },
  { from: "ar-seoul-travel-korean-phrases", to: "seoul-travel-korean-phrases-ar" },
  { from: "ar-study-korean-kdramas-method", to: "study-korean-kdramas-method-ar" },
  { from: "ar-topik-exam-guide", to: "topik-exam-guide-ar" },
];

/**
 * NOT executed by this change. These two posts are unique content, verified by
 * reading both the Arabic post and its confirmed English partner: both are
 * about the same subject (Korean cafe culture; the Hangul alphabet), not two
 * versions of the same lesson.
 *
 * Renaming a live, published slug is a production data write with no recovery
 * path in this schema — `blog_posts` has no revision history (see Gate 1
 * Part 2, docs/SEO_GATE1_REPORT.md) — so it is listed here as a decision
 * still pending Re's separate yes, not carried out by this branch. Once the
 * rename happens, move the pair here into RETIRED_ARABIC_SLUGS and add the
 * matching redirect in vercel.json.
 */
export const PENDING_SLUG_RENAMES = [
  {
    from: "ar-korean-cafe-culture",
    to: "korean-cafe-coffee-culture-ar",
    englishPartner: "korean-cafe-coffee-culture",
  },
  {
    from: "ar-learn-korean-alphabet-hangul",
    to: "learn-korean-alphabet-hangul-guide-ar",
    englishPartner: "learn-korean-alphabet-hangul-guide",
  },
];

/** Slugs a fresh build must never give their own `<loc>` or prerendered page. */
export const RETIRED_SLUGS = new Set(RETIRED_ARABIC_SLUGS.map((r) => r.from));

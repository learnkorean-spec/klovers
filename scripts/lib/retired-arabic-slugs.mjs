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
 *   - every pair targets the SAME topic and the same (or near-identical)
 *     primary keyword: both korean-numbers-guide titles open "أرقام كورية:
 *     نظاما العد...", both topik-exam-guide titles are "TOPIK ...: دليل
 *     اجتياز اختبار الكورية", both korean-daily-greetings posts lead with
 *     `تحيات كورية` as their #1 keyword. This is what makes them duplicates
 *     for SEO purposes: two URLs splitting the ranking signal for one query,
 *     not two articles that happen to resemble each other.
 *
 * The Korean example sentences in each pair DO differ substantially - as
 * little as 0% and as much as 67% shared Hangul vocabulary - because each was
 * independently written to the same brief rather than copy-pasted. That is a
 * genuine difference, but it is a content-richness fact, not evidence against
 * duplicate status: two pages can target one query with completely different
 * example sentences and still be exactly the keyword cannibalisation this
 * redirect fixes. (An earlier version of this file used vocabulary overlap as
 * the duplicate test and got the conclusion partly backwards - corrected
 * 2026-08-24.) The vocabulary difference is exactly why the RETIRED rows are
 * kept rather than deleted: see the Gate 2 backlog item in
 * docs/SEO_GATE1_DUPLICATE_SLUGS.md to merge each retired version's unique
 * examples into its survivor - not executed by this file.
 *
 * The `-ar` suffix is the survivor for all 8, because it is the convention 90
 * of the 100 Arabic posts already use, it is what carries the view history,
 * and it is what scripts/prerender-meta.mjs and api/sitemap.xml.js already
 * pick as the hreflang target when two Arabic translations exist (see Fix 1,
 * `fix/sitemap-arabic-loc`).
 *
 * Two further `ar-` prefix posts are NOT duplicates: `ar-korean-cafe-culture`
 * and `ar-learn-korean-alphabet-hangul` are each the ONLY Arabic translation
 * of their English article, just published under a slug that does not match
 * their partner's base (`korean-cafe-coffee-culture`,
 * `learn-korean-alphabet-hangul-guide`). Converting them to the suffix
 * convention needs an actual slug rename in `blog_posts`. This file ships
 * their redirect now (`PENDING_SLUG_RENAMES` below) so it can be confirmed
 * live in production BEFORE the rename runs - the rename itself is a
 * separate, still-pending production data write. See
 * docs/SEO_GATE1_DUPLICATE_SLUGS.md for the exact sequencing and the rollback
 * command.
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
 * Two posts that are UNIQUE content, not duplicates - verified by reading both
 * the Arabic post and its confirmed English partner, not by slug similarity.
 * Each is the only Arabic translation of its English article; the slug just
 * doesn't match the partner's base.
 *
 * The rename itself (an `UPDATE` to `slug` on two live rows) is NOT executed
 * by this file - it is a production data write, decided on separately, with
 * its rollback command recorded in docs/SEO_GATE1_DUPLICATE_SLUGS.md so it
 * never needs reconstructing.
 *
 * The REDIRECT for each, unlike the rename, IS live once this PR merges - see
 * vercel.json. That is deliberate ordering: the redirect has to exist and be
 * confirmed live in production before the rename runs, or the interval
 * between "rename done" and "redirect exists" would 404 both URLs. Until the
 * rename runs, each redirect's destination slug does not exist as a row yet,
 * so it points at a temporary 404 inside the SPA - a short, intentional gap,
 * not a bug. `to` here is what the row's slug becomes once the rename runs.
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

/**
 * Slugs a fresh build must never give their own `<loc>` or prerendered page.
 * Includes the 2 pending-rename slugs: their vercel.json redirect is live
 * (even though the rename itself is not), so a fresh sitemap or prerender
 * build must treat them exactly like the 8 confirmed duplicates - anything
 * carrying a live redirect never gets its own listing.
 */
export const RETIRED_SLUGS = new Set([
  ...RETIRED_ARABIC_SLUGS.map((r) => r.from),
  ...PENDING_SLUG_RENAMES.map((r) => r.from),
]);

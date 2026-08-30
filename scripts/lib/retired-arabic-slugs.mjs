/**
 * retired-arabic-slugs.mjs — the single source of truth for which Arabic blog
 * slugs are retired behind a 301, and where each one now lives.
 *
 * Why this exists: 10 English articles ended up with TWO published Arabic
 * translations each — one written in 2025 using the `<base>-ar` suffix
 * convention, and one written in 2026 (a re-run of the article generator that
 * did not know the 2025 version existed) using the legacy `ar-<base>` prefix
 * convention. Confirmed independently against the live database:
 *
 *   - every `-ar` suffix version predates its `ar-` prefix duplicate by about
 *     a year, and carries all the view history (30 views across the 10 pairs,
 *     vs 0 across all ten 2026 duplicates);
 *   - every pair targets the SAME topic and the same (or near-identical)
 *     primary keyword: both korean-numbers-guide titles open "أرقام كورية:
 *     نظاما العد...", both topik-exam-guide titles are "TOPIK ...: دليل
 *     اجتياز اختبار الكورية", both korean-cafe-coffee-culture posts lead with
 *     `مقاهي كوري(ة)` as their #1 keyword. This is what makes them duplicates
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
 * The `-ar` suffix is the survivor for all 10, because it is the convention
 * 90 of the 100 Arabic posts already use, it is what carries the view
 * history, and it is what scripts/prerender-meta.mjs and api/sitemap.xml.js
 * already pick as the hreflang target when two Arabic translations exist
 * (see Fix 1, `fix/sitemap-arabic-loc`).
 *
 * ---
 *
 * CORRECTION, 2026-08-24: two of these ten - `ar-korean-cafe-culture` and
 * `ar-learn-korean-alphabet-hangul` - were originally miscategorised as
 * unique content in `fix/duplicate-arabic-slugs` (#85, merged), on the
 * reasoning that neither one's *base slug* matched any English post
 * (`korean-cafe-culture` and `learn-korean-alphabet-hangul` are not real
 * English slugs - the real partners are `korean-cafe-coffee-culture` and
 * `learn-korean-alphabet-hangul-guide`). That check stopped one step short: it
 * never confirmed whether an Arabic post ALREADY EXISTED at the correctly
 * suffixed slug before proposing to rename these two onto it.
 *
 * One did. `korean-cafe-coffee-culture-ar` and
 * `learn-korean-alphabet-hangul-guide-ar` are themselves live, published,
 * 2025-dated rows - the real `-ar` translations of their English partners,
 * each already carrying its own view (2 views, versus 0 on the `ar-` prefix
 * post). Renaming `ar-korean-cafe-culture` onto `korean-cafe-coffee-culture-ar`
 * - the plan #85 shipped a redirect for but explicitly did NOT execute,
 * pending confirmation the redirect was live - would have collided with that
 * existing row. Caught here, before any rename ran, by confirming each
 * redirect target in production: both resolved to the ALREADY-EXISTING
 * survivor's own content, which is only possible because that survivor was
 * already there.
 *
 * These two are therefore duplicate pairs #9 and #10, not unique posts.
 * Moved into RETIRED_ARABIC_SLUGS below. No rename is executed, needed, or
 * possible for either - the vercel.json redirects #85 already shipped for
 * them turn out to already be exactly correct, now understood as "retire a
 * duplicate" rather than "point at a slug this rename will create."
 * PENDING_SLUG_RENAMES is retired along with the miscategorisation; nothing
 * in this file is pending a production data write.
 *
 * ---
 *
 * PAIR #11, 2026-08-27: found a different way, and a different shape.
 * `korean-learning-apps-comparison-2026-ar` and
 * `korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar` were not
 * found by the sitemap-blocker sweep above - they surfaced while reviewing
 * Gate 2 Step 1's Arabic title table (docs/GATE2_STEP1_TITLES.md), because
 * both titles independently needed repair and shared a suspiciously close
 * primary keyword. Same underlying problem as pairs #1-10 (a 2026 generator
 * rerun producing a second Arabic article on a topic that already had one),
 * but a different NAMING pattern: both slugs already use the `-ar` suffix,
 * not the `ar-` prefix, so the prefix-based test that found the other 10
 * never had a chance to catch this one.
 *
 * Confirmed against the live rows before writing or retiring anything:
 *
 *   |                  | -duolingo-rosetta-stone-ar (survivor) | -ar (retired)     |
 *   |------------------|----------------------------------------|-------------------|
 *   | English partner  | korean-learning-apps-comparison-2026-duolingo-rosetta-stone (16 views) | none |
 *   | published_at     | 2026-04-07 17:46:53 (matches partner) | 2026-04-11 07:14:31 (4 days later, on its own) |
 *   | content length   | 11,849 chars                          | 5,441 chars       |
 *   | register         | standard MSA, matches the other 89 Arabic articles | Egyptian colloquial - the ONLY colloquial article in the catalogue |
 *   | views            | 2                                      | 0                 |
 *
 * The survivor is also the ONLY Arabic article in the entire catalogue
 * exceeding 6,000 characters (24 English articles do; exactly 1 Arabic one
 * does, and it's this one) - so "keep the older/paired one" and "keep the
 * reference-length pillar" are the same decision here, not competing rules.
 *
 * The retired article isn't just a register mismatch, it carries an actual
 * text defect - "في 2026" (in 2026) is duplicated across its heading and the
 * first words of its body: "تطبيقات تعلم الكورية في 2026 ... في 2026 عندك
 * خيارات أكتر من أي وقت". Confirmed directly against the live `content`
 * column. Register drift plus a repeated phrase is what actually got
 * retired here, not a style preference.
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
  // Pairs #9 and #10 - see the correction above. Both redirects were already
  // live and correct before this file caught up to what they meant.
  { from: "ar-korean-cafe-culture", to: "korean-cafe-coffee-culture-ar" },
  { from: "ar-learn-korean-alphabet-hangul", to: "learn-korean-alphabet-hangul-guide-ar" },
  // Pair #11 - see "PAIR #11" above. Different naming pattern (-ar/-ar, not
  // ar-/-ar) for the same underlying defect.
  {
    from: "korean-learning-apps-comparison-2026-ar",
    to: "korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar",
  },
];

/**
 * Slugs a fresh build must never give their own `<loc>` or prerendered page -
 * every slug that carries a live 301 in vercel.json.
 */
export const RETIRED_SLUGS = new Set(RETIRED_ARABIC_SLUGS.map((r) => r.from));

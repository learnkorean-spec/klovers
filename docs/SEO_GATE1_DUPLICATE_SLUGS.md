# Duplicate Arabic slugs — findings and content comparison

**Date:** 2026-08-24, corrected 2026-08-24, corrected again 2026-08-24
**Scope:** the blocker Re raised on Fix 1 (`fix/sitemap-arabic-loc`) — before that
PR can be merged, the duplicate Arabic articles need a canonical URL and a
redirect, or the sitemap change would deliberately submit duplicate Arabic
URLs to Google. **10 pairs, not 8** — see the second correction below.

Everything below was checked directly against the live database
(`ewtdgpbybkceokfohhyg`, read-only `SELECT` only).

> **Correction 1.** The first version of this document measured "are these
> duplicates" by Hangul-vocabulary overlap between the two article bodies, and
> concluded some pairs were only loosely related because that overlap was low.
> That was the wrong test. Two articles can each choose 40 different example
> phrases for the same topic and score near-zero vocabulary overlap while still
> being exact duplicates in the sense that matters for search: same topic, same
> search intent, same target keyword, same structure. This is keyword
> cannibalisation — two URLs competing for one query — and the redirect
> decision below is unaffected. **The decision was already correct; the
> justification is now fixed.**

> **Correction 2.** The section below originally titled "the two posts that
> are NOT duplicates" was wrong. `ar-korean-cafe-culture` and
> `ar-learn-korean-alphabet-hangul` **are** duplicates — pairs #9 and #10 —
> of two Arabic posts that already existed
> (`korean-cafe-coffee-culture-ar`, `learn-korean-alphabet-hangul-guide-ar`).
> The original check confirmed each `ar-` post had a real English partner, but
> never checked whether an Arabic post already existed at that partner's
> correctly suffixed slug before proposing to rename onto it — one did, both
> times. Caught before any rename ran, by confirming the redirects live in
> production per the required sequence: both resolved to the
> already-existing survivor's own content, which is only possible because
> that survivor already existed. No rename was ever executed for these two.
> Full detail in the section below, kept rather than deleted so the mistake
> stays visible.

---

## The 10 duplicate pairs — same intent, same keyword, different vocabulary

Ten English articles each ended up with two published Arabic translations —
one written in 2025 using the `<base>-ar` suffix, one written in 2026 (a later
re-run of the article generator that did not know the 2025 version existed)
using the legacy `ar-<base>` prefix. (Pairs #9 and #10 were found late — see
Correction 2 above — which is why the two tables below list 8 then add 2.)

Verified directly against `title` and `keywords`, not slug similarity:

| English base | Title & top keyword — 2025 (survives) | Title & top keyword — 2026 (retired) |
|---|---|---|
| korean-numbers-guide | "أرقام كورية: نظاما العد في اللغة الكورية" — `أرقام كورية` | "أرقام كورية: نظاما العد وكيفية استخدامهما" — `أرقام كورية` |
| topik-exam-guide | "امتحان TOPIK: TOPIK: دليل اجتياز اختبار الكورية" — `امتحان TOPIK` | "اختبار توبيك: TOPIK: دليل شامل لاجتياز الاختبار" — `اختبار توبيك` |
| korean-daily-greetings | "تحيات كورية: **40** عبارة للاستخدام اليومي" — `تحيات كورية` | "تحيات كورية: عبارات يومية لا غنى عنها" — `تحيات كورية` |
| korean-slang-words | "عامية كورية: **35** كلمة يجب أن تعرفها" — `عامية كورية` | "عامية كورية: أهم الكلمات العصرية" — `عامية كورية` |
| korean-food-vocabulary | "مفردات طعام كوري: طعام كوري: **60** كلمة" — `مفردات طعام كوري` | "طعام كوري: مفردات الطعام الأساسية" — `طعام كوري` |
| korean-grammar-particles | "دليل جسيمات الكورية (조사)" — `قواعد الكورية` | "قواعد كورية: دليل أدوات الربط للمبتدئين" — `قواعد كورية` |
| seoul-travel-korean-phrases | "سفر إلى سيول: عبارات كورية أساسية للسياح" — `سفر إلى سيول` | "سفر كوريا: سيول: دليل العبارات الكورية للمسافرين" — `سفر كوريا` |
| study-korean-kdramas-method | "طريقة تعلم الكورية من الدراما" — `تعلم الكورية من الدراما` | "تعلم الكورية من الدراما: طريقة المسلسلات" — `تعلم الكورية من الدراما` |
| korean-cafe-coffee-culture | "مقاهي كورية: لماذا هي الأكثر إبداعاً؟" — `مقاهي كورية` | "مقاهي كوريا: ثقافة القهوة الأكثر إبداعاً" — `مقاهي كوريا` |
| learn-korean-alphabet-hangul-guide | "تعلم الأبجدية الكورية (هانغول) في يوم واحد: الدليل الكامل" — `هانغول` | "تعلم الكورية: الأبجدية هانغول في يوم واحد" — `تعلم الكورية` |

Every single pair targets the same topic and the same (or a one-word variant
of the same) primary keyword phrase — `أرقام كورية` against `أرقام كورية`,
`تحيات كورية` against `تحيات كورية`, `عامية كورية` against `عامية كورية`, and
so on down the list. Four pairs even converge on close to the same title
pattern. **This is what makes them duplicates for SEO purposes: two URLs
targeting the same search intent split whatever ranking signal the topic
earns between them, and Google may show only one — or neither reliably —
instead of consolidating authority onto one strong page.**

Structural signals — heading count especially — corroborate the same
conclusion from a different angle:

| Pair (base) | 2025 headings (H2+H3) | 2026 headings (H2+H3) |
|---|---:|---:|
| korean-daily-greetings | 12+3 | 12+3 |
| korean-food-vocabulary | 12+3 | 12+3 |
| korean-slang-words | 13+26 | 13+3 |
| seoul-travel-korean-phrases | 12+3 | 11+4 |
| korean-cafe-coffee-culture | 13+11 | 12+10 |
| learn-korean-alphabet-hangul-guide | 14+9 | 13+3 |

Same H2 count on several — the same outline, filled in with different
example sentences. That is consistent with two independent passes at
answering the *same* content brief, which is exactly what keyword
cannibalisation looks like: not a copy-paste, but two solutions to one
assignment.

**All 10 duplicates carry zero lifetime views.** All 30 views across these
topics belong to the 2025 `-ar` survivor — the strongest reason to keep the
`-ar` suffix as canonical for every pair: it is the older, more-linked
convention, and it is the version real readers have actually been finding.

### The vocabulary difference is real — and is the opportunity, not a reason to doubt the merge

The two versions of each pair genuinely do use different Korean example
phrases (confirmed by direct Hangul-vocabulary comparison, 0% to 67% overlap
across the first 8 pairs checked this way) — that part of the original
analysis was accurate, it was only being used to answer the wrong question.
Restated correctly: **each retired article is a second, independently-written
pass at the same brief, which means it contains teaching material the
surviving article does not.** That is exactly the resource Gate 2 needs. See
the backlog item below.

---

## Gate 2 backlog — merge, don't discard (NOT executed here)

**For each of the 10 pairs:** harvest the unique Korean examples, sections and
FAQ entries from the retired 2026 version into the surviving 2025 article,
de-duplicating overlapping items and keeping the surviving article's voice
consistent.

Why this beats "pick a winner": the two versions are different vocabulary sets
on the same topic, not a better and a worse draft of the same one. Merging the
greetings pair, for example, turns a ~40-phrase article and a second,
independent ~40-phrase article into one article with something like 60-70
non-overlapping phrases — reference-grade, for the cost of an edit pass rather
than new writing. This is precisely the "expand thin articles" objective from
the original session brief, achieved without writing anything new for at least
these 10 topics.

**Nothing about this is executed by this branch or any other Gate 1 PR.** It
is a content write against `blog_posts.content`, and per Gate 1 Part 2
(`docs/SEO_GATE1_REPORT.md`) that needs the approved backup/rollback mechanism
plus Re's separate yes. The 10 retired rows are untouched by the redirect —
they still exist in the database, so there is no urgency and nothing is lost
by waiting.

---

## Pairs #9 and #10 — how "not duplicates" turned out to be wrong

*(Superseded by Correction 2 above. Kept in full, not deleted, so the mistake
and how it was caught stay visible.)*

`ar-korean-cafe-culture` and `ar-learn-korean-alphabet-hangul` looked like
unique content on first check: each is the **only** `ar-` prefix post whose
base slug (`korean-cafe-culture`, `learn-korean-alphabet-hangul`) doesn't
match any English post — the real partners are `korean-cafe-coffee-culture`
and `learn-korean-alphabet-hangul-guide`, one and two words longer. That check
was real (confirmed by reading both sides' opening paragraphs, not slug
matching) but incomplete: it never asked whether an Arabic post **already
existed** at the correctly-suffixed slug before proposing to rename onto it.

It did, both times:

| Arabic slug | Exists already? | Published | Views |
|---|---|---|---:|
| `korean-cafe-coffee-culture-ar` | **Yes** — a separate, live, published row | 2025-02-15 | 2 |
| `ar-korean-cafe-culture` | (the one under discussion) | 2026-03-26 | 0 |
| `learn-korean-alphabet-hangul-guide-ar` | **Yes** — a separate, live, published row | 2025-02-01 | 2 |
| `ar-learn-korean-alphabet-hangul` | (the one under discussion) | 2026-03-20 | 0 |

Same shape as the other 8 pairs exactly: a 2025 `-ar` suffix original with
real views, a 2026 `ar-` prefix duplicate with zero. The planned rename —
`update blog_posts set slug = 'korean-cafe-coffee-culture-ar' where slug =
'ar-korean-cafe-culture'` — would have tried to write a slug value that
another live row already had.

**Caught before it ran.** The required sequence (redirect must exist and be
confirmed live in production *before* anything else happens) is what created
the check that caught this: confirming the two redirects meant fetching their
destination URLs, and both resolved to the **already-existing** survivor's
own self-referencing canonical, OG tags and JSON-LD `@id` — content that could
only appear if that survivor already existed. Cross-checked directly against
the database immediately after. No rename was ever executed for either post.

**Current state, and it needs no further action:** the `vercel.json` redirects
this repo already shipped for these two
(`/blog/ar-korean-cafe-culture` → `/blog/korean-cafe-coffee-culture-ar`,
`/blog/ar-learn-korean-alphabet-hangul` → `/blog/learn-korean-alphabet-hangul-guide-ar`)
turn out to already be exactly correct — they were built to point at a slug a
rename would create, and it turns out that slug already existed for an
unrelated reason. Nothing needs to change in `vercel.json`. Both are now
listed as pairs #9 and #10 in `RETIRED_ARABIC_SLUGS` alongside the original 8,
verified live in production (see the fetch results above), no rename pending
or ever executed.

---

## What shipped, across both PRs

**`fix/duplicate-arabic-slugs` (#85, merged):**
- `scripts/lib/retired-arabic-slugs.mjs` — the one list of which slugs are
  retired and where they now point.
- 10 permanent (301) redirects in `vercel.json` (8 confirmed duplicates + 2
  that were, at the time, believed to be pending renames — see below).
- A test that fails if the redirect list and `vercel.json` ever drift apart.
- `fix/sitemap-arabic-loc`, stacked on top: the sitemap generator excludes
  every slug carrying a live redirect from getting its own `<loc>`.

**This follow-up (`fix/two-more-arabic-duplicates`):**
- Corrects the categorisation of pairs #9 and #10 from "pending rename" to
  "confirmed duplicate" — no code behaviour changes (the redirects were
  already correct), only the module's own record of what they mean and why.
- No rename was ever executed, and none is pending any more.

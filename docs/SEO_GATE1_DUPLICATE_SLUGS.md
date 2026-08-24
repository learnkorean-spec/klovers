# Duplicate Arabic slugs — findings and content comparison

**Date:** 2026-08-24, corrected 2026-08-24
**Scope:** the blocker Re raised on Fix 1 (`fix/sitemap-arabic-loc`) — before that
PR can be merged, the 8 duplicate Arabic articles need a canonical URL and a
redirect, or the sitemap change would deliberately submit 8 duplicate Arabic
URLs to Google.

Everything below was checked directly against the live database
(`ewtdgpbybkceokfohhyg`, read-only `SELECT` only).

> **Correction.** The first version of this document measured "are these
> duplicates" by Hangul-vocabulary overlap between the two article bodies, and
> concluded some pairs were only loosely related because that overlap was low.
> That was the wrong test. Two articles can each choose 40 different example
> phrases for the same topic and score near-zero vocabulary overlap while still
> being exact duplicates in the sense that matters for search: same topic, same
> search intent, same target keyword, same structure. This is keyword
> cannibalisation — two URLs competing for one query — and the redirect
> decision below is unaffected. **The decision was already correct; the
> justification is now fixed.**

---

## The 8 duplicate pairs — same intent, same keyword, different vocabulary

Eight English articles each ended up with two published Arabic translations —
one written in 2025 using the `<base>-ar` suffix, one written in 2026 (a later
re-run of the article generator that did not know the 2025 version existed)
using the legacy `ar-<base>` prefix.

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

Same H2 count on three of four — the same outline, filled in with different
example sentences. That is consistent with two independent passes at
answering the *same* content brief, which is exactly what keyword
cannibalisation looks like: not a copy-paste, but two solutions to one
assignment.

**All 8 duplicates carry zero lifetime views.** All 26 views across these
topics belong to the 2025 `-ar` survivor — the strongest reason to keep the
`-ar` suffix as canonical for every pair: it is the older, more-linked
convention, and it is the version real readers have actually been finding.

### The vocabulary difference is real — and is the opportunity, not a reason to doubt the merge

The two versions of each pair genuinely do use different Korean example
phrases (confirmed by direct Hangul-vocabulary comparison, 0% to 67% overlap
across the 8 pairs) — that part of the original analysis was accurate, it was
only being used to answer the wrong question. Restated correctly: **each
retired article is a second, independently-written pass at the same brief,
which means it contains teaching material the surviving article does not.**
That is exactly the resource Gate 2 needs. See the backlog item below.

---

## Gate 2 backlog — merge, don't discard (NOT executed here)

**For each of the 8 pairs:** harvest the unique Korean examples, sections and
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
these 8 topics.

**Nothing about this is executed by this branch or any other Gate 1 PR.** It
is a content write against `blog_posts.content`, and per Gate 1 Part 2
(`docs/SEO_GATE1_REPORT.md`) that needs the approved backup/rollback mechanism
plus Re's separate yes. The 8 retired rows are untouched by the redirect —
they still exist in the database after Fix 1 merges, so there is no urgency
and nothing is lost by waiting.

---

## The two posts that are NOT duplicates — decision made, sequencing below

`ar-korean-cafe-culture` and `ar-learn-korean-alphabet-hangul` looked like more
duplicates at first pass (same `ar-` prefix, same publish wave as the other
eight), but they are each the **only** Arabic translation of their English
article — just published under a slug that doesn't match their partner's base.

Verified by reading both sides' title, description and opening paragraph, not
by string-matching the slug:

| Arabic slug | Arabic title (translated) | Confirmed English partner | Evidence |
|---|---|---|---|
| `ar-korean-cafe-culture` | "Korea's cafes: the most creative coffee culture" | `korean-cafe-coffee-culture` | Both open on Korea's cafe density and themed cafes (cat cafes named specifically on both sides); no other English post is about cafes. |
| `ar-learn-korean-alphabet-hangul` | "Learn Korean: the Hangul alphabet in one day" | `learn-korean-alphabet-hangul-guide` | Both open with "created in 1443 by King Sejong the Great" and the "readable within 24 hours" claim, nearly verbatim; no other English post is about Hangul. |

**Decision: Option 1.** Rename both to the suffix convention —
`korean-cafe-coffee-culture-ar` and `learn-korean-alphabet-hangul-guide-ar`.
A slug rename on two rows loses no content and is reversible by renaming back;
it does not need the Gate 1 Part 2 bulk-edit tooling, which exists for
200-row content edits, not a two-row identifier change.

### Required sequence — redirect must exist and be confirmed live before the rename

1. Re merges this PR (`fix/duplicate-arabic-slugs`, #85).
2. **Confirm the two new 301 redirects are actually live in production** —
   fetch both old URLs and check for a 301 to the new slug. Deploy logs are
   not evidence; the live HTTP response is.
3. **Only then** run the two slug renames.

Renaming before the redirects are confirmed live would break both URLs for
the interval in between: the old slug would 404 (no row), and there would be
no redirect yet to carry a visitor or a crawler to the new one.

**This PR now ships those two redirects** (`/blog/ar-korean-cafe-culture` →
`/blog/korean-cafe-coffee-culture-ar`, `/blog/ar-learn-korean-alphabet-hangul`
→ `/blog/learn-korean-alphabet-hangul-guide-ar`), alongside the 8 duplicate
redirects, so step 2 has something to confirm. **This does create a
transient gap once deployed and before the rename runs**: the destination
slugs (`korean-cafe-coffee-culture-ar`, `learn-korean-alphabet-hangul-guide-ar`)
do not exist as rows yet, so between merge and rename these two redirects
point at a URL that 404s inside the SPA, and — because the sitemap excludes
any slug carrying a live redirect — neither the old nor the new slug appears
in the sitemap during that window. The gap closes the moment the rename runs,
which is why step 3 says "only then," immediately following step 2's
confirmation, not on a delay.

### Rollback for the rename, recorded now so it never needs reconstructing

```sql
-- Forward (run once redirects are confirmed live in production):
update blog_posts set slug = 'korean-cafe-coffee-culture-ar'
  where slug = 'ar-korean-cafe-culture';
update blog_posts set slug = 'learn-korean-alphabet-hangul-guide-ar'
  where slug = 'ar-learn-korean-alphabet-hangul';

-- Rollback (exact inverse, run if anything looks wrong):
update blog_posts set slug = 'ar-korean-cafe-culture'
  where slug = 'korean-cafe-coffee-culture-ar';
update blog_posts set slug = 'ar-learn-korean-alphabet-hangul'
  where slug = 'learn-korean-alphabet-hangul-guide-ar';
```

Each statement is a single-column `UPDATE` on one row matched by its current
`slug`, so the rollback is the forward statement with the two literals
swapped — no reconstruction from memory, no ambiguity about which value was
live before.

---

## What this branch does

- Adds `scripts/lib/retired-arabic-slugs.mjs` — the one list of which slugs are
  retired and where they now point, for both the 8 confirmed duplicates and
  the 2 pending renames.
- Adds **10** permanent (301) redirects to `vercel.json`: 8 for the confirmed
  duplicates, plus 2 for the pending renames (see the sequencing above — the
  redirects are shipped ahead of the rename on purpose, so step 2 can confirm
  them live before step 3 executes).
- A test (`scripts/retired-arabic-slugs.test.mjs`) that fails if the redirect
  list and `vercel.json` ever drift apart — vercel.json is static JSON and
  cannot import the module, so nothing else would catch that.
- `fix/sitemap-arabic-loc` is rebased on top of this branch: the sitemap
  generator excludes every slug carrying a live redirect from getting its own
  `<loc>` — all 10, not just the 8 duplicates — so the sitemap never submits a
  URL that immediately 301s.

# Duplicate Arabic slugs — findings and content comparison

**Date:** 2026-08-24
**Scope:** the blocker Re raised on Fix 1 (`fix/sitemap-arabic-loc`) — before that
PR can be merged, the 8 duplicate Arabic articles need a canonical URL and a
redirect, or the sitemap change would deliberately submit 8 duplicate Arabic
URLs to Google.

Everything below was checked directly against the live database
(`ewtdgpbybkceokfohhyg`, read-only `SELECT` only).

---

## The 8 duplicate pairs

Eight English articles each ended up with two published Arabic translations —
one written in 2025 using the `<base>-ar` suffix, one written in 2026 (a later
re-run of the article generator that did not know the 2025 version existed)
using the legacy `ar-<base>` prefix.

| English base | 2025 `-ar` (survives) | views | 2026 `ar-` (retired) | views | shared Hangul terms |
|---|---|---:|---|---:|---:|
| korean-daily-greetings | `korean-daily-greetings-ar` | 2 | `ar-korean-daily-greetings` | 0 | 16 / 74 |
| korean-food-vocabulary | `korean-food-vocabulary-ar` | 1 | `ar-korean-food-vocabulary` | 0 | 20 / 80 |
| korean-grammar-particles | `korean-grammar-particles-ar` | 1 | `ar-korean-grammar-particles` | 0 | 21 / 88 |
| korean-numbers-guide | `korean-numbers-guide-ar` | 3 | `ar-korean-numbers-guide` | 0 | 42 / 63 |
| korean-slang-words | `korean-slang-words-ar` | 4 | `ar-korean-slang-words` | 0 | 7 / 64 |
| seoul-travel-korean-phrases | `seoul-travel-korean-phrases-ar` | 4 | `ar-seoul-travel-korean-phrases` | 0 | 27 / 91 |
| study-korean-kdramas-method | `study-korean-kdramas-method-ar` | 3 | `ar-study-korean-kdramas-method` | 0 | 3 / 19 |
| topik-exam-guide | `topik-exam-guide-ar` | **8** | `ar-topik-exam-guide` | 0 | 0 / 14 |

"Shared Hangul terms" is `shared / (2025 terms + 2026 terms − shared)` —
distinct Hangul words appearing in both versions, out of the union of both
vocabularies. **This confirms Re's framing: these are not the same lesson
published twice.** Every pair was independently written. Overlap ranges from
0% (`topik-exam-guide`, the two versions share not one Hangul word) to about
67% (`korean-numbers-guide`, where both sides teach the same native/Sino-Korean
number system and necessarily reuse the numerals).

**All 8 duplicates carry zero lifetime views.** All 26 views across these
topics belong to the 2025 `-ar` survivor. This matches Re's summary exactly and
is the strongest single reason to keep the `-ar` suffix as canonical for every
pair — it is not just the older, more-linked convention, it is also the version
real readers have actually been finding.

### Which version has the better body content, per pair

Per the brief: character count, heading count (H2 + H3), FAQ section, whether
the Korean examples differ. **Every one of the 16 articles has an FAQ
section** — it is not a differentiator for any pair.

| Pair (base) | 2025 chars / headings | 2026 chars / headings | Read |
|---|---|---|---|
| daily-greetings | 4,893 / 12+3 | 5,252 / 12+3 | Close. 2026 is longer but covers different ground (restaurant, emergency phrases) rather than covering the same ground better; 2025 uses Arabic-script pronunciation throughout (아니용하세요 → "أنيونغ هاسيو"), which is arguably more accessible to a reader who doesn't read Latin transliteration. **No case for moving content.** |
| food-vocabulary | 4,962 / 12+3 | 4,968 / 12+3 | Essentially identical on every structural measure. **No case either way.** |
| grammar-particles | 4,904 / 9+8 | 5,028 / 16+3 | Mixed: 2026 has almost double the H2 sections (16 vs 9), 2025 goes deeper under fewer headings (8 H3 vs 3). Neither is unambiguously more thorough. **Worth a manual read before any decision, not a clear case for moving 2026's text.** |
| numbers-guide | 4,655 / 9+3 | 4,566 / 12+5 | 2026 is shorter but more subdivided (17 headings vs 12) on the topic with the highest content overlap of the eight. Mixed, not decisive. |
| slang-words | **5,552 / 13+26** | 5,062 / 13+3 | 2025 is clearly the more thorough treatment — 26 H3 subsections breaking down individual slang terms vs 3 in the 2026 version, and it's longer. **No case for moving 2026's text; if anything this is the strongest case for keeping 2025 as-is.** |
| seoul-travel-phrases | 5,177 / 12+3 | 5,092 / 11+4 | Essentially identical. **No case either way.** |
| study-korean-kdramas | 5,445 / 11+9 | 5,283 / 13+8 | Close; 2026 has marginally more H2 sections, 2025 is marginally longer. Not decisive. |
| topik-exam-guide | 5,141 / 10+9 | 5,329 / 13+10 | 2026 is longer and more subdivided, but **2025 is the only one of the 8 pairs with real traffic (8 views)** and the two share zero Hangul vocabulary — they read as two different TOPIK-prep articles, not one better-written and one worse-written. **This is the one pair worth a dedicated manual read before deciding anything**, given it is the only pair where a live audience has already voted with clicks. |

**Overall: no pair shows the 2026 duplicate clearly and decisively surpassing
the 2025 survivor.** Two pairs (`grammar-particles`, `topik-exam-guide`)
are close enough, or important enough given real traffic, to warrant a human
read before any text is touched. Per your instruction, **no content move is
proposed or executed** — this table is the evidence for that judgment call,
not an action.

---

## The two posts that are NOT duplicates

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

Proposed new slugs, once the rename below is approved: `korean-cafe-coffee-culture-ar`
and `learn-korean-alphabet-hangul-guide-ar` — matching the suffix convention and
their confirmed partner's base exactly.

### This is not executed yet, and needs your separate yes

Converting these two slugs requires an `UPDATE` to the `slug` column of two live,
published rows. `blog_posts` has no revision history (Gate 1 Part 2,
`docs/SEO_GATE1_REPORT.md`) — there is currently no built, tested rollback for a
production data write, and this session's rules are explicit that nothing gets
deployed without your yes. This branch ships the redirect and sitemap-exclusion
*infrastructure* for the 8 confirmed duplicates only. The two renames, and their
redirects, are scaffolded in `scripts/lib/retired-arabic-slugs.mjs` as
`PENDING_SLUG_RENAMES` — ready to wire in the moment the rename itself is
approved and done.

**What I need from you:** should I execute the two-row slug rename now via a
direct, logged database update (each one individually reversible — I would
rename it right back if anything looks wrong), or would you rather this wait
for the backup/rollback tooling from Gate 1 Part 2 to be built and approved
first?

---

## What this branch does

- Adds `scripts/lib/retired-arabic-slugs.mjs` — the one list of which slugs are
  retired and where they now point.
- Adds 8 permanent (301) redirects to `vercel.json`, `/blog/ar-<slug>` →
  `/blog/<slug>-ar`, for the 8 confirmed duplicates only.
- A test (`scripts/retired-arabic-slugs.test.mjs`) that fails if the redirect
  list and `vercel.json` ever drift apart — vercel.json is static JSON and
  cannot import the module, so nothing else would catch that.
- `fix/sitemap-arabic-loc` is rebased on top of this branch: the sitemap
  generator now excludes every retired slug from getting its own `<loc>`,
  so the sitemap never submits a URL that immediately 301s.

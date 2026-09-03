# Gate 2 Step 3a — content cluster map (verification)

**Date:** 2026-08-28
**Scope:** Re's GM built a cluster map from the live database — 190 articles, 11
clusters, one English pillar per cluster. This document independently verifies
it against the live database rather than accepting it, per instruction. It
does not write any article content, change any title, or touch the database —
read-only verification and documentation only.

**Source data:** a single read-only query against `blog_posts`
(`ewtdgpbybkceokfohhyg`), all published rows, excluding the 11 slugs in
`RETIRED_ARABIC_SLUGS` (`scripts/lib/retired-arabic-slugs.mjs`) the same way
the sitemap does.

---

## 1. The total doesn't reconcile — flagged before anything else

The live, non-retired catalogue is **200 articles (100 English, 100 Arabic)**,
not 190:

```
total published rows:      211  (100 en, 111 ar)
minus 11 retired slugs:    -11
live, non-retired:         200  (100 en, 100 ar)
```

Separately: the GM's own 11 cluster sizes —
22 + 21 + 11 + 11 + 7 + 6 + 6 + 5 + 5 + 3 + 3 — **sum to exactly 100**, not
190. That total matches the English article count precisely. Whatever the
"190" figure refers to, it is not the live article count and not the sum of
the cluster sizes given. The cluster map itself reads as **an English-only
classification** (100 articles across 11 clusters), which is what this
document verifies below — the Arabic side is checked independently in
Section 4, per instruction, not assumed to mirror it.

---

## 2. English cluster assignment — independently re-derived

All 100 live English articles were read individually (slug, title, keywords)
and assigned to one of the 11 named clusters by hand, not automatically
matched against the GM's map (which was not available at the row level, only
as names, counts, and pillars).

| Cluster | GM's count | My count | Stated pillar | Pillar confirmed? |
|---|---:|---:|---|---|
| Culture & society | 22 | 23 | `korean-superstitions-beliefs-daily-life` | Views yes, length no — see §3 |
| Grammar | 21 | 24 | `korean-grammar-particles` | Views yes, length no — see §3 |
| Themed vocabulary | 11 | 11 | `50-essential-korean-words-beginners` | **Yes, both** |
| Practical (travel/work) | 11 | 10 | `seoul-travel-korean-phrases` | **No — different article wins both, see §3** |
| K-drama & K-pop | 7 | 7 | `best-kdrama-learn-korean-difficulty-ranked` | Length yes, views no |
| Folklore & myth | 6 | 6 | `korean-myths-legends-stories-kdrama-fans` | **No — weakest in its own cluster on both, see §3** |
| Hangul & pronunciation | 6 | **3** | `learn-korean-alphabet-hangul-guide` | Views yes, length no |
| Slang / texting / fandom | 5 | 4 | `korean-texting-slang-internet-2026` | **Yes, both** |
| Study method & tools | 5 | 6 | `how-to-learn-korean-faster` | Views yes, length no |
| Korean for Arabic speakers | 3 | 3 | `korean-for-arabic-speakers-difficulty-guide` | Views yes, length no |
| TOPIK | 3 | 3 | `topik-exam-preparation-complete-guide-2026` | **Yes, both** |

My total: 100. No article was left unclassified and no 12th cluster was
needed — every one of the 100 fits inside one of the 11 named clusters,
though a meaningful number of placements are genuine judgment calls, listed
below rather than silently resolved.

### The one count mismatch that isn't a boundary call: Hangul & pronunciation

**3 articles by my read, not 6.** Only three live English articles are
actually about the alphabet or pronunciation:
`learn-korean-alphabet-hangul-guide` (pillar), `korean-pronunciation-guide-beginners`,
`korean-pronunciation-guide-speaking`. I checked every other title and
keyword set in the catalogue for anything phonetics- or hangul-adjacent
(including the numeral/counter articles, in case they were the missing
three) and found nothing else that plausibly belongs here — numbers,
counters, and telling time are grammar/numeral topics, not alphabet or
pronunciation ones, and are classified under Grammar below. I can't
reconstruct where the GM's other three would come from without seeing her
row-level list. Flagging this as the most concrete count discrepancy in the
whole map, not a rounding difference.

### Boundary calls made, stated rather than hidden

- **`korean-proverbs-idioms-guide`** → placed in Culture & society (cultural
  wisdom/sayings), not Grammar, though `사자성어` idioms do have grammatical
  structure. Moving it to Grammar would bring Culture & society to 22,
  matching the GM's count exactly.
- **`korean-counting-units-classifiers`, `korean-numbers-guide`,
  `korean-telling-time-dates-guide`** → placed in Grammar (numeral/classifier
  systems are typically taught as grammar units here), not Themed vocabulary.
  This is the largest source of my Grammar overcount (24 vs. 21).
- **`korean-daily-greetings`, `korean-compliment-praise-phrases`,
  `korean-weather-small-talk-phrases`** → placed in Practical (travel/work)
  as conversational-phrase guides, not Themed vocabulary word-lists.
- **`korean-housing-terms-explained`** → placed in Themed vocabulary
  (a term list: jeonse/wolse/officetel), not Culture & society.
- **`study-korean-kdramas-method`** → placed in K-drama & K-pop rather than
  Study method & tools, since its own title leads with "Learn Korean with
  KDramas," matching its cluster-mates more than the study-method group. This
  is the one swing article that makes K-drama & K-pop match the GM's count
  (7) exactly while Study method & tools comes out one over (6 vs. 5).
- **`korean-idol-fandom-glossary`** → placed in Slang/texting/fandom (its own
  title is literally "K-Pop Fandom Glossary" and the cluster name includes
  "fandom"), not K-drama & K-pop, where it would also fit.

---

## 3. Pillar strength — length AND views, not assumed

For each cluster, the strongest article by content length and the strongest
by view count were computed independently and compared to the stated pillar.
**3 of 11 pillars are confirmed strongest on both measures at once:** Themed
vocabulary, Slang/texting/fandom, TOPIK. The other 8 have at least one
mismatch — most are a defensible split (the pillar wins views by a wide
enough margin that a shorter length doesn't undermine it), but two are worth
flagging directly:

- **Practical (travel/work): the stated pillar is not the strongest article
  by either measure.** `korean-job-interview-phrases` beats
  `seoul-travel-korean-phrases` on both length (6,438 vs. 5,924 chars) and
  views (11 vs. 8). This is the one cluster where a different article is
  simply stronger across the board.
- **Folklore & myth: the stated pillar is the weakest article in its own
  cluster by views.** `korean-myths-legends-stories-kdrama-fans` has 1 view —
  the lowest of all 6 articles in the cluster — while `dokkaebi-korean-goblin-myth-kdrama`
  has 6, six times as many. `korean-shamanism-mudang-kdrama-tradition` also
  edges it slightly on length (5,923 vs. 5,776 chars). The pillar isn't
  strongest on any measure here.

The rest (Culture & society, Grammar, K-drama & K-pop, Hangul &
pronunciation, Study method & tools, Korean for Arabic speakers): in every
case the stated pillar wins views by a comfortable margin even where a
different article is longer, which is a defensible reason to keep it as the
pillar — flagged here for the record, not as a recommendation to change
anything.

---

## 4. The Arabic side — done independently, not assumed to mirror English

Every one of the 200 live articles pairs cleanly: **all 100 English slugs
have a matching `<slug>-ar` sibling, and all 100 Arabic slugs match a live
English base slug — zero orphans either direction**, now that the 11th
duplicate pair is retired. This made an independent Arabic pillar check
possible for every cluster via its members' `-ar` siblings, not by assuming
the English pillar's translation is automatically the Arabic pillar.

**The GM's most consequential claim is confirmed: 10 of the 11 clusters have
no Arabic article exceeding 6,000 characters — the length threshold this
project has already used to identify a genuine reference-length "pillar"
article (see the pair #11 retirement in `scripts/lib/retired-arabic-slugs.mjs`,
where the sole Arabic article over 6,000 characters was exactly the deciding
factor for which side of that pair survived).**

| Cluster | Strongest Arabic candidate | Length | Over 6,000? |
|---|---|---:|---|
| Culture & society | `hanbok-korean-traditional-clothing-ar` | 5,757 | No |
| Grammar | `korean-verb-conjugation-guide-ar` | 5,499 | No |
| Themed vocabulary | `korean-family-terms-relationships-guide-ar` | 5,291 | No |
| Practical (travel/work) | `korean-job-interview-phrases-ar` | 5,488 | No |
| K-drama & K-pop | `korean-drama-vocabulary-advanced-ar` | 5,670 | No |
| Folklore & myth | `korean-shamanism-mudang-kdrama-tradition-ar` | 5,571 | No |
| Hangul & pronunciation | `korean-pronunciation-guide-beginners-ar` | 5,328 | No |
| Slang / texting / fandom | `korean-texting-slang-internet-2026-ar` | 5,613 | No |
| **Study method & tools** | **`korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar`** | **11,849** | **Yes — the only one** |
| Korean for Arabic speakers | `learn-korean-egypt-best-classes-2026-ar` | 5,420 | No |
| TOPIK | `topik-exam-guide-ar` | 5,141 | No |

Ten clusters top out in the 5,100–5,800-character range for their best
Arabic candidate — closely bunched, well short of a true reference-length
pillar. Only Study method & tools has one, and it's the article this session
already identified independently in the pair-#11 retirement (PR #112) — not
a new finding, but a confirmation that the same article is both that pair's
survivor and this map's only qualifying Arabic pillar.

**This means: for 10 of 11 English clusters, there is currently no Arabic
article that could stand as that cluster's own pillar.** That is the shape
of the Gate 3 gap, stated plainly rather than inferred.

---

## 5. Structural finding — two more likely near-duplicate pairs, flagged per instruction, not acted on

While investigating the flagged pronunciation pair, the same
publish-timestamp forensics that identified pair #11 surfaced a second pair
with the identical signature. Both are reported here; neither is retired,
renamed, or edited by this document.

### `korean-pronunciation-guide-beginners` vs. `korean-pronunciation-guide-speaking`

| | `-beginners` | `-speaking` |
|---|---|---|
| EN published_at | 2026-03-23 02:13:54 | 2026-04-07 17:46:53 |
| EN length / views | 4,983 chars / 4 | 10,046 chars / 9 |
| AR published_at | **2025-05-01** (predates its own EN partner by ~10 months) | **2026-04-11 07:14:31.168751** |
| AR length / views | 5,328 chars / 3 | 4,903 chars / 3 |

### `korean-honorifics-formality-levels-grammar` vs. `korean-speech-levels-honorifics-guide`

| | `-formality-levels-grammar` | `-speech-levels-...-guide` |
|---|---|---|
| EN published_at | 2026-04-07 17:46:53 | 2026-03-23 02:13:54 |
| EN length / views | 8,616 chars / 10 | 5,434 chars / 9 |
| AR published_at | **2026-04-11 07:14:31.168751** | **2025-05-10** (predates its own EN partner by ~10 months) |
| AR length / views | 5,048 chars / 4 | 5,489 chars / 2 |

**Why this is worth flagging:** `2026-04-11 07:14:31.168751+00` — to the
microsecond — is the exact `published_at` already identified as the
suspect-batch timestamp on the *retired* half of pair #11
(`korean-learning-apps-comparison-2026-ar`). It appears here on
`korean-pronunciation-guide-speaking-ar` and
`korean-honorifics-formality-levels-grammar-ar` as well — both **four days
after** their own English partner's publish time, not same-day like a real
translation (compare: pair #11's real translation pair shared its
`published_at` to the second). Meanwhile the older sibling in each pair
(`-beginners-ar`, `-speech-levels-...-guide-ar`) predates its own English
partner by roughly ten months — an inversion (Arabic before English) not
seen anywhere else checked so far.

**Why this is a different shape from pair #11, not a repeat of the same
call:** in the ten retired pairs, one side of each pair had zero views and
no real content depth. Here, all four English articles and all four Arabic
articles have real view counts and substantive content — this looks like
genuine topic overlap between two separately-commissioned articles (a
beginner-pronunciation guide vs. a from-day-1 speaking guide; a
grammar-focused honorifics article vs. a speech-levels-focused one), not one
throwaway duplicate. Reading the opening paragraphs of both pairs, the
content angles are close enough to raise the question but not close enough
to call it mechanically from the data alone — this needs an editorial read
of whether "beginners" vs. "speaking" and "formality-levels-grammar" vs.
"speech-levels" are genuinely different scopes or the same topic written
twice. **Not decided or executed here — flagged for a follow-up
investigation using the same method that resolved pair #11, done by
whoever picks up that thread next.**

---

## 6. Summary for Gate 3 planning

- The "190 total" figure in the cluster map doesn't reconcile with anything
  in the live data; the real live catalogue is 200 (100/100), and the
  cluster sizes given sum to 100, not 190.
- English-side cluster assignment mostly holds up; the one real discrepancy
  is Hangul & pronunciation (3 English articles found, not 6) — worth a
  second look before it's used to plan Gate 3 coverage for that topic.
- Two clusters have a pillar that isn't actually their strongest member
  (Practical, Folklore & myth) — not urgent, but worth knowing before
  building internal-linking structure around the stated pillars.
- **The Arabic pillar gap is confirmed as stated: 10 of 11 clusters have no
  Arabic article over 6,000 characters.** This is the real headline for
  Gate 3 — most English clusters have nothing anchoring their Arabic side.
- Two more likely near-duplicate content pairs surfaced
  (pronunciation, honorifics/speech-levels) — same suspect-batch timestamp
  signature as pair #11, but with real content and views on both sides this
  time, needing an editorial call rather than a mechanical one.

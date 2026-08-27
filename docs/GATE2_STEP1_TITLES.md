# Gate 2 Step 1 — title repair, review table (v3 — 51 titles)

**Date:** 2026-08-27 (v3 — 6 Arabic corrections from a native-speaker second
reading, 2 titles pulled pending a duplicate-content investigation; v2 was
2026-08-26, expanded from 42 to 53 after a second pass, see below)
**Scope:** `title` only. No `slug` is touched anywhere in this proposal — that is
a hard constraint, not a preference (slugs are live URLs).

## What changed since v2 (53 → 51 titles)

Re sent the v2 Arabic table (27 rows) to her GM for a second native-speaker
reading before dispatching `apply`. Six corrections came back, all folded in
here; a seventh finding was structural, not a wording fix, and is reported
below rather than resolved by editing a title.

**Must-fix — factual/terminology errors, mistranslation, religious
sensitivity (4):**

- `korean-telling-time-dates-guide-ar` — v2 shortened "الصينية-الكورية"
  (Sino-Korean, i.e. 한자어: Korean numbers of Chinese origin) to "الصينية"
  (Chinese) to fit the length limit. That's not a trim, it's a factual error
  in material that teaches Korean — restored the correct compound term, and
  dropped a literal calque ("كيف تخبر الوقت") to make room.
- `korean-dating-phrases-kdrama-lines-ar` — v2's "خطوط الدراما" translates
  "drama lines" literally; Arabic "خطوط" means geometric lines/stripes, never
  dialogue. Replaced with "اقتباسات" (quotes/lines of dialogue).
- `korean-proverbs-idioms-guide-ar` — 사자성어 are four Chinese *characters*,
  not four letters; v2's "أربعة أحرف" (four alphabet letters) misdescribes
  the concept. Replaced with "الرباعية".
- `jeoseung-saja-korean-grim-reaper-symbolism-ar` — v2's "ملاك الموت" (angel
  of death) is a specific Islamic theological term (Azrael); applying it to a
  Korean folk figure risks offending the Egyptian Muslim audience this site
  serves. Replaced with the secular "حاصد الأرواح" (reaper of souls).

**Should-fix — orthography, word choice (2):**

- `korean-pronunciation-guide-speaking-ar` — "اتقن" was missing its hamza;
  corrected to "أتقِن".
- `dokkaebi-korean-goblin-myth-kdrama-ar` — "الغول" is a man-eating ogre in
  Arabic; a 도깨비 is mischievous, not monstrous. Replaced with "العفريت".

All six are now marked **HIGH** confidence (up from MEDIUM/HIGH in v2) —
native-speaker-reviewed, not just mechanically de-duplicated.

**Structural finding — 2 titles pulled, not fixed:**

`korean-learning-apps-comparison-2026-ar` and
`korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar` were
flagged as a likely keyword-cannibalisation pair, not two articles: same 5
apps compared, same "12 criteria" framing, near-identical primary keyword.
Investigated against the live rows before writing either title, per Re's
instruction:

| | `-duolingo-rosetta-stone-ar` | `-ar` (plain) |
|---|---|---|
| English partner | `korean-learning-apps-comparison-2026-duolingo-rosetta-stone` (16 views) | **none** |
| `published_at` | identical to its English partner's | 4 days later, on its own |
| content length | 11,849 chars | 5,441 chars — under half |
| register | matches the site's standard Arabic voice | Egyptian colloquial ("أكتر", "بيشتغل") — doesn't match |
| views | 2 | 0 |

This is the same pattern already documented in
`scripts/lib/retired-arabic-slugs.mjs` for 10 other pairs — a 2026 rerun of
the article generator produced a second Arabic article on a topic that
already had one, splitting the ranking signal for one query — just using the
`-ar`/`-ar` naming pattern instead of that sweep's `ar-`/`-ar` pattern, which
is why the earlier sweep's slug-prefix test didn't catch it.
`-duolingo-rosetta-stone-ar` is the clear survivor by every measure above.
**Recommendation: retire `korean-learning-apps-comparison-2026-ar` behind a
301 to `korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar`, in
its own retirement PR** — not decided or executed here. Both titles are
pulled from this batch (53 → 51) until that's resolved; the survivor's own
title defect (stuffed keyword prefix, truncated) is still real and can be
re-proposed once the retirement question is settled.

## What changed since v1 (42 → 53 titles)

The first pass tested three mechanical things: over 60 characters, ends in an
ellipsis, and verbatim word repetition across a `:`/`—` split. Re asked two
pointed questions that this version answers by actually re-scanning rather than
re-asserting:

1. **Coverage** — of the 51 titles in Re's own 55–62-character range that
   weren't in v1, 44 are genuinely complete phrases (stated, not just implied
   — full list with reasons was in the v1 report). 7 were real misses.
2. **Grammar independent of length** — a full re-read of all 90 Arabic titles
   surfaced 3 titles that are English/transliteration placeholders (not
   translated at all), 1 title that is a genuinely ungrammatical string
   (not just long), and 1 title with a bare English lead-in word — none
   catchable by counting characters, which is exactly why they were invisible
   to v1.

**11 titles added, bringing the total from 42 to 53** — not 52. The extra one
(`what-is-jeong-korean-untranslatable-concept-ar`) turned up from checking
the specific case Re asked about; noting the discrepancy rather than rounding
to match the expected count.

### The single most important row in this table

`seollal-korean-lunar-new-year-guide-2026-ar` — `seollal — السولال — Klovers Korean`
— is not just broken, it is the **most-read Arabic article on the entire
site** (10 views, roughly double the next-highest). Verified independently
against live view counts. The worst title in the catalogue is on the one
Arabic page people actually reach. Marked 🔴 in the Arabic table below.

### A retired row with the same defect — reported, not included

`ar-topik-exam-guide` (301-redirected, 0 views, not in the 190 live articles)
carries the identical doubled-TOPIK defect as the live `topik-exam-guide-ar`
and `ar-topik-exam-guide` — title is `اختبار توبيك: TOPIK: دليل شامل لاجتياز الاختبار`.
**Not included in this proposal** — it redirects away, nobody reads it, and
whether retired rows get cleaned up at all is a separate question from Gate 2
Step 1. Flagged explicitly per Re's instruction, rather than silently
skipped or silently fixed.

**Nothing has been written to the database.** This table, plus the standard
proposal file it was generated alongside
(`content-edits/proposals/2026-08-27T12-43-40-928Z.proposal.json`), are the
review artifacts. Once approved, applying goes through the Apply Content
Edits workflow (`docs/APPLYING_CONTENT_EDITS.md`) — `mode: plan` with this
`proposal_path`, confirm the printed table matches this document, then
`mode: apply` with the checksum `plan` reports.

---

## English (26 titles), ordered by views descending

| views | slug | before | after | chars | what changed and why |
|---:|---|---|---|---:|---|
| 20 | `best-free-resources-learn-korean-online-2026` | free korean learning resources — Best Free Resources to Lear | Best Free Resources to Learn Korean Online in 2026 | 50 | Stuffed lowercase keyword prefix, and the title was truncated mid-word ('Lear'). Drops the prefix, completes the phrase. |
| 19 | `korean-slang-words` | 35 Korean Slang Words Every K-Drama Fan Needs to Know in... | 35 Korean Slang Words Every K-Drama Fan Should Know | 51 | Ended in an ellipsis (incomplete phrase). Completed and shortened to fit. |
| 19 | `learn-korean-alphabet-hangul-guide` | Learn the Korean Alphabet (Hangul) in One Day: Complete... | Learn the Korean Alphabet (Hangul) in One Day | 45 | Ended in an ellipsis. The trailing 'Complete...' added nothing the rest of the title didn't already say — dropped rather than completed. |
| 15 | `korean-food-vocabulary` | Korean Food Vocabulary: 60 Essential Words for Ordering... | Korean Food Vocabulary: 60 Words for Ordering Food | 50 | Ended in an ellipsis. Completed as a full phrase, trimmed 'Essential' to fit. |
| 13 | `topik-exam-guide` | TOPIK Exam Guide: How to Pass TOPIK I and II as an... | TOPIK Exam Guide: How to Pass TOPIK I and II | 44 | Ended in an ellipsis mid-sentence. Completed as a self-contained phrase. |
| 11 | `topik-1-vocabulary-list-800-words` | topik vocabulary — TOPIK 1 Vocabulary | TOPIK 1 Vocabulary: 800 Essential Words to Know | 47 | Stuffed lowercase keyword prefix repeating 'topik vocabulary'. Drops the prefix, restores the '800 words' detail the slug promises. |
| 10 | `hanbok-korean-traditional-clothing` | Hanbok: Everything You Need to Know About Korean... | Hanbok: Everything to Know About Korean Clothing | 48 | Ended in an ellipsis. Completed and trimmed to fit. |
| 9 | `korean-body-language-social-etiquette` | korean etiquette — Korean Body Language and Social Etiquette | Korean Body Language and Social Etiquette Guide | 47 | Stuffed lowercase keyword prefix repeating 'etiquette'. Drops the prefix. |
| 9 | `korean-daily-greetings` | 40 Essential Korean Greetings and Daily Phrases You Need... | 40 Essential Korean Greetings and Daily Phrases | 47 | Ended in an ellipsis. The trailing clause was cut off with nothing gained by finishing it — dropped instead. |
| 9 | `korean-idol-fandom-glossary` | K-Pop Fandom Glossary: Bias, Maknae, Comeback and More Explained | K-Pop Fandom Glossary: Bias, Maknae, and Comeback | 49 | 64 characters, 4 over. Trimmed 'and More Explained' — the examples already signal it's a glossary of terms. |
| 9 | `korean-verb-conjugation-guide` | korean verbs — Korean Verb Conjugation Made Easy | Korean Verb Conjugation Made Easy | 33 | Stuffed lowercase keyword prefix repeating 'korean verbs'. Drops the prefix. |
| 7 | `seoul-travel-korean-phrases` | Seoul Travel Guide: Essential Korean Phrases for... | Seoul Travel Guide: Essential Korean Phrases | 44 | Ended in an ellipsis. Completed as a self-contained phrase. |
| 6 | `korean-drama-vocabulary-advanced` | kdrama vocabulary — Advanced K-Drama Vocabulary | Advanced K-Drama Vocabulary for Korean Learners | 47 | Stuffed lowercase keyword prefix repeating 'vocabulary'. Drops the prefix, adds who it's for. |
| 5 | `korean-counting-units-classifiers` | korean counters — Korean Counting Units (Classifiers) | Korean Counting Units and Classifiers Explained | 47 | Stuffed lowercase keyword prefix repeating 'counters'/'counting'. Drops the prefix. |
| 5 | `learn-korean-egypt-best-classes-2026` | korean classes in egypt — Best Korean Language Classes in Eg | Best Korean Language Classes in Egypt (2026) | 44 | Stuffed lowercase keyword prefix, and the title was truncated mid-word ('Eg'). Drops the prefix, completes the phrase. |
| 4 | `korean-proverbs-idioms-guide` | Korean Proverbs and Four-Character Idioms Every Learner Should Know | Korean Proverbs and Four-Character Idioms to Know | 49 | 67 characters, 7 over. Trimmed 'Every Learner Should' to 'to'. |
| 4 | `korean-telling-time-dates-guide` | How to Tell Time and Dates in Korean (Native vs Sino-Korean Numbers) | Telling Time in Korean: Native vs Sino-Korean Numbers | 53 | 68 characters, 8 over. Restructured to keep the native-vs-Sino-Korean distinction (the article's actual subject) rather than dropping it. |
| 4 | `learn-korean-3-months-study-method` | learn korean fast — Learn Korean in 3 Months | How to Learn Korean in 3 Months | 31 | Stuffed lowercase keyword prefix repeating 'learn korean'. Drops the prefix. |
| 3 | `korean-cafe-coffee-culture` | Korean Cafe Culture: Why Korea Has the World's Most... | Korean Cafe Culture: Korea's Most Creative Cafes | 48 | Ended in an ellipsis. Completed as a full phrase using the article's own opening claim (themed/creative cafes). |
| 3 | `korean-irregular-verbs-guide` | Korean Irregular Verbs: ㅂ, ㄷ, 르, ㅅ Conjugation Rules Explained | Korean Irregular Verbs: ㅂ, ㄷ, 르, ㅅ Conjugation Rules | 52 | 62 characters, 2 over. Trimmed the redundant 'Explained'. |
| 3 | `korean-transportation-guide-seoul` | Getting Around Seoul: Korean Transportation Vocabulary and Phrases | Getting Around Seoul: Korean Transport Vocabulary | 49 | 66 characters, 6 over. Shortened 'Transportation' to 'Transport', trimmed 'and Phrases'. |
| 3 | `korean-zodiac-fortune-telling-guide` | Korean Zodiac and Fortune Telling: Saju, Tti, and Gunghap Explained | Korean Zodiac and Fortune Telling Explained | 43 | 67 characters, 7 over. Trimmed the three named terms — they're the article's own subheadings, not needed in the title to fit under 60. |
| 2 | `korean-drinking-culture-soju-etiquette` | Korean Drinking Culture: Soju Etiquette and Rules Every Beginner Should Know | Korean Drinking Culture: Soju Etiquette and Rules | 49 | 76 characters, 16 over. Trimmed 'Every Beginner Should Know'. |
| 2 | `korean-military-service-explained` | Korean Military Service Explained: Why K-Pop Idols and Actors Enlist | Korean Military Service: Why K-Pop Idols Enlist | 47 | 68 characters, 8 over. Trimmed the redundant 'Explained' and 'and Actors' (the article's own keywords name only idols). |
| 1 | `korean-convenience-store-culture` | Korean Convenience Store Culture: A Guide to Pyeoneuijeom (편의점) | Korean Convenience Store Culture: A Guide to Pyeoneuijeom | 57 | 63 characters, 3 over. Dropped the Hangul in parentheses from the title only — it stays in the article body. |
| 1 | `korean-webtoon-reading-guide` | Korean Webtoons: A Beginner's Guide to Reading and Vocabulary | Korean Webtoons: A Beginner's Guide to Reading | 46 | 61 characters, 1 over. Trimmed 'and Vocabulary'. |

---

## Arabic (25 titles), ordered by views descending

**Every row below needs your review, regardless of the confidence marker.**
HIGH means the fix is a mechanical de-duplication with no register or
phrasing judgment call. MEDIUM means it involves a word choice, register, or
scope decision — the reason column says exactly what to check. I am not a
native Arabic speaker; treat HIGH as "I found no ambiguity," not as
"approved."

| views | slug | before | after | chars | confidence | what changed and why |
|---:|---|---|---|---:|---|---|
| 10 🔴 **MOST-READ ARABIC ARTICLE** | `seollal-korean-lunar-new-year-guide-2026-ar` | seollal — السولال — Klovers Korean | سولال: عيد رأس السنة القمرية الكورية | 36 | MEDIUM | An untranslated English word, its transliteration, and the site's own name appended as if part of the title — not a title, a placeholder. THIS IS THE MOST-READ ARABIC ARTICLE ON THE SITE (10 views, highest of any Arabic page) — the worst title in the catalogue is the one Arabic article people actually reach. |
| 8 | `topik-exam-guide-ar` | امتحان TOPIK: TOPIK: دليل اجتياز اختبار الكورية | امتحان TOPIK: دليل اجتياز اختبار اللغة الكورية | 46 | HIGH | "TOPIK" literally repeated twice with a colon between. Removed the duplicate, added "اللغة" (language) for a more standard phrase. |
| 6 | `50-essential-korean-words-beginners-ar` | كلمات كورية — 50 كلمة كورية أساسية لازم كل مبتدئ يتعلمها الأ | 50 كلمة كورية أساسية لكل مبتدئ | 30 | MEDIUM | Stuffed prefix repeating 'كلمات كورية', and truncated mid-word. Also softened the colloquial 'لازم' (Egyptian colloquial 'has to') to the more standard 'لكل' — FLAG: if the site's voice is deliberately colloquial elsewhere, this register change may not be wanted; please check against the article's own tone. |
| 4 | `seoul-travel-korean-phrases-ar` | سفر إلى سيول: سيول: عبارات كورية أساسية للسياح | السفر إلى سيول: عبارات كورية أساسية للسياح | 42 | HIGH | 'سيول' (Seoul) literally repeated. Removed the duplicate, added the definite article for a more standard title form. |
| 4 | `korean-shopping-phrases-complete-guide-ar` | عبارات التسوق الكورية: 50 عبارة تسوق كورية تحتاجها في سيول | 50 عبارة تسوق كورية أساسية تحتاجها في سيول | 42 | HIGH | 'التسوق'/'تسوق' and 'الكورية'/'كورية' repeated — missed by the original detector because it compared exact strings and never stripped the Arabic definite article 'ال', so 'التسوق' and 'تسوق' looked like different words. Dropped the redundant lead entirely. |
| 3 | `how-long-to-learn-korean-arabic-speakers-ar` | كم يستغرق تعلم الكورية — كم من الوقت يستغرق تعلم اللغة الكور | كم يستغرق تعلم اللغة الكورية للناطقين بالعربية؟ | 47 | MEDIUM | 'How long does it take' said twice, and truncated. FLAG: added a question mark, which I have not confirmed is consistent with this site's other Arabic titles — please check. |
| 3 | `learn-korean-3-months-study-method-ar` | تعلم الكورية 3 أشهر: تعلم الكورية في 3 أشهر: خطة دراسية | تعلم الكورية في 3 أشهر: خطة دراسية فعالة | 40 | HIGH | 'تعلم الكورية...3 أشهر' repeated almost verbatim. Kept one mention, added 'فعالة' (effective). |
| 3 | `korean-honorifics-formality-levels-grammar-ar` | احترام كوري — مستويات الاحترام والرسمية في الكورية | مستويات الاحترام والرسمية في اللغة الكورية | 42 | HIGH | 'احترام' (respect) and 'كوري/الكورية' (Korean) both repeated across the dash — same ال-stripping gap. Dropped the redundant lead. |
| 3 | `korean-pronunciation-guide-speaking-ar` | نطق كوري: دليل النطق الكوري: اتقن الكلام من اليوم الأول | دليل النطق الكوري: أتقِن الكلام من اليوم الأول | 46 | HIGH | Two colons, and 'نطق'/'كوري' repeated in the first two segments — same ال-stripping gap. Dropped the redundant lead. v3: ORTHOGRAPHY caught by Re's GM — v2's 'اتقن' was missing its hamza, corrected to 'أتقِن'. |
| 2 | `korean-dating-phrases-kdrama-lines-ar` | عبارات التعارف الكورية — عبارات المواعدة الكورية وخطوط الدرا | عبارات المواعدة الكورية وأشهر اقتباسات الدراما | 46 | HIGH | v3: MISTRANSLATION caught by Re's GM's second reading — v2's 'خطوط الدراما' translates 'drama lines' literally; Arabic 'خطوط' means geometric lines/stripes, never dialogue. Replaced with 'اقتباسات' (quotes/lines of dialogue). 'عبارات' repeated and 'التعارف'/'المواعدة' stacked near-duplicates fixed as in v2. |
| 2 | `korean-drinking-culture-soju-etiquette-ar` | ثقافة الشرب الكورية: آداب السوجو والقواعد التي يجب أن يعرفها كل مبتدئ | ثقافة الشرب الكورية: آداب السوجو لكل مبتدئ | 42 | MEDIUM | 69 characters, 9 over. Trimmed the relative clause 'والقواعد التي يجب أن يعرفها' (and the rules every beginner should know) to 'لكل مبتدئ' (for every beginner) — loses the explicit word 'rules' though 'etiquette' still carries that meaning. |
| 2 | `korean-military-service-explained-ar` | الخدمة العسكرية الكورية: لماذا يلتحق نجوم الكيبوب والممثلون بالجيش | الخدمة العسكرية الكورية: لماذا يلتحق نجوم الكيبوب بالجيش؟ | 57 | MEDIUM | 66 characters, 6 over. Trimmed 'والممثلون' (and actors) — the article's own keywords name only K-pop idols, not actors, so this narrows to what the keywords actually target rather than cutting arbitrarily. |
| 2 | `korean-past-tense-conjugation-guide-ar` | الزمن الماضي الكوري — تصريف الفعل الماضي الكوري | تصريف الفعل الماضي في اللغة الكورية | 35 | HIGH | 'الماضي' (past) repeated. Kept one mention, standard grammar-guide phrasing. |
| 2 | `korean-proverbs-idioms-guide-ar` | الأمثال الكورية والتعابير المكونة من أربعة أحرف التي يجب أن يعرفها كل متعلم | الأمثال والتعابير الرباعية في اللغة الكورية | 43 | HIGH | v3: WRONG TERM caught by Re's GM — 사자성어 are four Chinese *characters*, not four letters; v2's 'أربعة أحرف' (four alphabet letters) misdescribes the concept. Replaced with 'الرباعية'. Also fixes v2's length overage (75 chars) by dropping the trailing relative clause. |
| 2 | `korean-sentence-structure-word-order-guide-ar` | هيكل الجملة الكورية — بنية الجملة الكورية | هيكل الجملة الكورية وترتيب الكلمات | 34 | HIGH | This is the exact repetition pattern named in the Gate 2 brief: 'بنية' (structure) and 'هيكل' (structure) are near-synonyms, and 'الجملة الكورية' is repeated verbatim. Replaced 'بنية الجملة الكورية' with 'ترتيب الكلمات' (word order), which matches the article's own keyword and slug. |
| 2 | `korean-telling-time-dates-guide-ar` | كيف تخبر الوقت والتاريخ بالكورية (الأرقام الأصلية مقابل الصينية-الكورية) | الوقت والتاريخ بالكورية: الأرقام الأصلية والصينية-الكورية | 57 | HIGH | v3: FACTUAL ERROR caught by Re's GM — v2 shortened 'الصينية-الكورية' (Sino-Korean, i.e. 한자어: Korean numbers of Chinese origin) to 'الصينية' (Chinese) to fit the length limit. That's not a trim, it's wrong: it calls the numbers Chinese instead of Korean. Restored the correct compound term, and dropped a literal calque ('كيف تخبر الوقت') to make room. |
| 2 | `korean-adjectives-100-examples-beginners-ar` | 100 الصفات الكورية الأساسية مع الجمل سبيل المثال | 100 صفة كورية أساسية مع جمل توضيحية | 35 | MEDIUM | Not a length or repetition defect — a genuinely ungrammatical string. 'سبيل المثال' ('by way of example') needs a preceding 'على' and appears bare with no connector after 'الجمل'; '100' directly before a definite plural noun is non-standard numeral-noun agreement. Reads as a machine-translation artefact, not a sentence a person wrote. |
| 2 | `dokkaebi-korean-goblin-myth-kdrama-ar` | dokkaebi — دوكايبي — Klovers Korean | دوكايبي: أسطورة العفريت الكوري في الدراما | 41 | HIGH | Same placeholder pattern as the Seollal title: English word, transliteration, site name appended. v3: WORD CHOICE caught by Re's GM — v2's 'الغول' is a man-eating ogre in Arabic; a 도깨비 is mischievous, not monstrous. Replaced with 'العفريت'. |
| 2 | `jeoseung-saja-korean-grim-reaper-symbolism-ar` | جيوسيونغ ساجا — Jeoseung Saja — Klovers Korean | جيوسيونغ ساجا: رمزية حاصد الأرواح في الأساطير الكورية | 53 | HIGH | Same placeholder pattern: transliteration, the English title repeated, site name appended. v3: RELIGIOUS SENSITIVITY caught by Re's GM — v2's 'ملاك الموت' (angel of death) is a specific Islamic theological term (Azrael); applying it to a Korean folk figure risks offending the Egyptian Muslim audience this site serves. Replaced with the secular 'حاصد الأرواح'. |
| 2 | `what-is-jeong-korean-untranslatable-concept-ar` | jeong: ما هو جيونغ (정)؟ المفهوم الكوري الذي لا يمكنك ترجمته | ما هو جيونغ (정)؟ المفهوم الكوري الذي لا يمكنك ترجمته | 52 | HIGH | Opens with a bare lowercase English word ('jeong:') before the Arabic starts — same family as the placeholder titles above, though milder: the Arabic that follows is already a complete, correct sentence once the English lead-in is dropped. |
| 2 | `korean-counting-units-classifiers-ar` | عدادات كورية: وحدات العد الكورية (المصنفات): الدليل الكامل | وحدات العد والمصنفات الكورية: الدليل الكامل | 43 | MEDIUM | 'عدادات' and 'وحدات العد' are two different Arabic words for the same 'counting units' concept, stated back to back — a synonym-level duplication no exact-string test can catch. This is the Arabic sibling of 'korean-counting-units-classifiers' (English), already in this table for the identical underlying redundancy. FLAG: merges two near-synonymous terms into one — I could not check which term the article body itself actually uses. |
| 2 | `korean-verb-conjugation-guide-ar` | الأفعال الكورية — أصبح تصريف الفعل الكوري سهلاً | تصريف الفعل الكوري أصبح سهلاً | 29 | MEDIUM | 'الأفعال' (verbs, plural) and 'الفعل' (verb, singular) — same root, different number, so exact-string matching missed it. This is the Arabic sibling of 'korean-verb-conjugation-guide' (English), already in this table for the same defect. Dropped the redundant lead, reordered slightly for natural flow. |
| 1 | `korean-drama-vocabulary-advanced-ar` | المفردات الدراما — مفردات الدراما الكورية المتقدمة | مفردات الدراما الكورية المتقدمة | 31 | HIGH | Stuffed prefix repeating 'الدراما', and the prefix itself ('المفردات الدراما') was grammatically awkward (mismatched definite article). Dropped it. |
| 1 | `korean-food-vocabulary-ar` | مفردات طعام كوري: طعام كوري: 60 كلمة مفردات أساسية | مفردات الطعام الكوري: 60 كلمة أساسية | 36 | HIGH | 'طعام كوري' repeated with a colon between, and 'مفردات' also repeated later. Kept one mention of each, standard definite-article phrasing. |
| 1 | `korean-body-language-social-etiquette-ar` | آداب كورية: لغة الجسد الكورية وآداب السلوك الاجتماعي | لغة الجسد الكورية وآداب السلوك الاجتماعي | 40 | HIGH | 'آداب' (etiquette) repeated — missed originally because the second occurrence carries the connector prefix 'و' ('وآداب'), which the detector didn't strip before comparing. This is the Arabic sibling of 'korean-body-language-social-etiquette' (English), already in this table for the same defect. Dropped the redundant lead. |

---

## What I looked at and deliberately did NOT change — stated, not implied

- **The other 137 live titles** already fit within 60 characters, don't end
  in an ellipsis, and show no repetition (verbatim, article-stripped, or
  synonym-level, checked by hand across all 90 Arabic titles). No proposed
  change.
- **Natural "Topic: elaboration that re-mentions the topic" titles** — e.g.
  `korean-pronunciation-guide-beginners-ar` ("نطق كوري: دليل المبتدئين للنطق الصحيح"
  — a different article from the one above with the actual duplication
  defect), `korean-skincare-kbeauty-routine-guide-ar`,
  `korean-job-interview-phrases-ar`. These repeat a root word once as a
  label and again naturally in the elaboration — "Korean Pronunciation:
  Beginner's Guide to Correct Pronunciation" reads the same way in English
  and isn't broken.
- **`korean-wedding-traditions-guide` (English)** repeats "Traditions" /
  "Traditional" — same root, different exact string, so my exact-match test
  correctly didn't flag it. Disclosed, not fixed: whether that level of echo
  is worth a rewrite is a judgment call, not a defect on the order of what's
  above.
- **Three Arabic titles use a word I'm not fully confident is the precise
  term**, but each matches the article's own chosen keyword exactly (not an
  accident): `korean-speech-levels-honorifics-guide-ar` ("مجاملة", closer to
  "courtesy" than "honorifics"), `korean-family-terms-relationships-guide-ar`
  ("أسماء أسرة"), `korean-phone-texting-etiquette-ar` (minor scope
  ambiguity in one word's placement). Not proposing changes — flagging for
  awareness only.
- **The 10 retired Arabic duplicate slugs** (redirected behind a 301,
  `docs/SEO_GATE1_DUPLICATE_SLUGS.md`) are excluded — see the callout above
  for the one that shares this table's defect.
- **`korean-learning-apps-comparison-2026-ar` and its
  `-duolingo-rosetta-stone-ar` sibling** — an 11th duplicate pair, found this
  round, not yet retired. See "Structural finding" above; not title-fixed
  here on purpose.

## After this lands

Per the working rules: confirm a production deploy has actually run (titles
reach the raw prerendered HTML only at build time, not instantly), then
re-run `npm run seo:check:live`, and report that all 208 pages still pass
and the coverage floor still holds.

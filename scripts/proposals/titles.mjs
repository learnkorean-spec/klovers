#!/usr/bin/env node
/**
 * titles.mjs — Gate 2 Step 1: repair the 42 published article titles that
 * violate one of: over 60 characters, end in an ellipsis (an incomplete
 * phrase), or repeat the same word/concept twice via a stuffed keyword
 * prefix ("keyword — Real Title").
 *
 * HARD CONSTRAINT: this touches `title` only. It never proposes a `slug`
 * change — slugs are live URLs.
 *
 * The 42 titles and their replacements are hand-curated, not generated —
 * this script's job is to package that curation into the standard
 * propose/apply/rollback format from scripts/lib/content-edit.mjs, not to
 * decide the titles itself. Every edit carries `reason`; Arabic edits also
 * carry `confidence` ("high" | "medium") per the working rule that no
 * Arabic title ships without Re's review regardless of how confident this
 * script is.
 *
 * Usage: node scripts/proposals/titles.mjs
 * Writes a proposal (content-edits/proposals/<batchId>.proposal.{json,md})
 * and nothing else — no database write happens here. See
 * docs/GATE2_STEP1_TITLES.md for the full review table.
 */
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";

// codepoint length, matching Postgres char_length (not UTF-16 .length) —
// same convention scripts/content-audit.mjs uses, for the same reason:
// several titles use characters .length would miscount.
const cpLen = (s) => Array.from(s).length;

export const EDITS = [
  // ── English ──────────────────────────────────────────────────────────
  {
    slug: "best-free-resources-learn-korean-online-2026",
    lang: "en",
    before: "free korean learning resources — Best Free Resources to Lear",
    after: "Best Free Resources to Learn Korean Online in 2026",
    reason: "Stuffed lowercase keyword prefix, and the title was truncated mid-word ('Lear'). Drops the prefix, completes the phrase.",
  },
  {
    slug: "korean-slang-words",
    lang: "en",
    before: "35 Korean Slang Words Every K-Drama Fan Needs to Know in...",
    after: "35 Korean Slang Words Every K-Drama Fan Should Know",
    reason: "Ended in an ellipsis (incomplete phrase). Completed and shortened to fit.",
  },
  {
    slug: "learn-korean-alphabet-hangul-guide",
    lang: "en",
    before: "Learn the Korean Alphabet (Hangul) in One Day: Complete...",
    after: "Learn the Korean Alphabet (Hangul) in One Day",
    reason: "Ended in an ellipsis. The trailing 'Complete...' added nothing the rest of the title didn't already say — dropped rather than completed.",
  },
  {
    slug: "korean-food-vocabulary",
    lang: "en",
    before: "Korean Food Vocabulary: 60 Essential Words for Ordering...",
    after: "Korean Food Vocabulary: 60 Words for Ordering Food",
    reason: "Ended in an ellipsis. Completed as a full phrase, trimmed 'Essential' to fit.",
  },
  {
    slug: "topik-exam-guide",
    lang: "en",
    before: "TOPIK Exam Guide: How to Pass TOPIK I and II as an...",
    after: "TOPIK Exam Guide: How to Pass TOPIK I and II",
    reason: "Ended in an ellipsis mid-sentence. Completed as a self-contained phrase.",
  },
  {
    slug: "topik-1-vocabulary-list-800-words",
    lang: "en",
    before: "topik vocabulary — TOPIK 1 Vocabulary",
    after: "TOPIK 1 Vocabulary: 800 Essential Words to Know",
    reason: "Stuffed lowercase keyword prefix repeating 'topik vocabulary'. Drops the prefix, restores the '800 words' detail the slug promises.",
  },
  {
    slug: "hanbok-korean-traditional-clothing",
    lang: "en",
    before: "Hanbok: Everything You Need to Know About Korean...",
    after: "Hanbok: Everything to Know About Korean Clothing",
    reason: "Ended in an ellipsis. Completed and trimmed to fit.",
  },
  {
    slug: "korean-body-language-social-etiquette",
    lang: "en",
    before: "korean etiquette — Korean Body Language and Social Etiquette",
    after: "Korean Body Language and Social Etiquette Guide",
    reason: "Stuffed lowercase keyword prefix repeating 'etiquette'. Drops the prefix.",
  },
  {
    slug: "korean-daily-greetings",
    lang: "en",
    before: "40 Essential Korean Greetings and Daily Phrases You Need...",
    after: "40 Essential Korean Greetings and Daily Phrases",
    reason: "Ended in an ellipsis. The trailing clause was cut off with nothing gained by finishing it — dropped instead.",
  },
  {
    slug: "korean-idol-fandom-glossary",
    lang: "en",
    before: "K-Pop Fandom Glossary: Bias, Maknae, Comeback and More Explained",
    after: "K-Pop Fandom Glossary: Bias, Maknae, and Comeback",
    reason: "64 characters, 4 over. Trimmed 'and More Explained' — the examples already signal it's a glossary of terms.",
  },
  {
    slug: "korean-verb-conjugation-guide",
    lang: "en",
    before: "korean verbs — Korean Verb Conjugation Made Easy",
    after: "Korean Verb Conjugation Made Easy",
    reason: "Stuffed lowercase keyword prefix repeating 'korean verbs'. Drops the prefix.",
  },
  {
    slug: "seoul-travel-korean-phrases",
    lang: "en",
    before: "Seoul Travel Guide: Essential Korean Phrases for...",
    after: "Seoul Travel Guide: Essential Korean Phrases",
    reason: "Ended in an ellipsis. Completed as a self-contained phrase.",
  },
  {
    slug: "korean-drama-vocabulary-advanced",
    lang: "en",
    before: "kdrama vocabulary — Advanced K-Drama Vocabulary",
    after: "Advanced K-Drama Vocabulary for Korean Learners",
    reason: "Stuffed lowercase keyword prefix repeating 'vocabulary'. Drops the prefix, adds who it's for.",
  },
  {
    slug: "korean-counting-units-classifiers",
    lang: "en",
    before: "korean counters — Korean Counting Units (Classifiers)",
    after: "Korean Counting Units and Classifiers Explained",
    reason: "Stuffed lowercase keyword prefix repeating 'counters'/'counting'. Drops the prefix.",
  },
  {
    slug: "learn-korean-egypt-best-classes-2026",
    lang: "en",
    before: "korean classes in egypt — Best Korean Language Classes in Eg",
    after: "Best Korean Language Classes in Egypt (2026)",
    reason: "Stuffed lowercase keyword prefix, and the title was truncated mid-word ('Eg'). Drops the prefix, completes the phrase.",
  },
  {
    slug: "korean-proverbs-idioms-guide",
    lang: "en",
    before: "Korean Proverbs and Four-Character Idioms Every Learner Should Know",
    after: "Korean Proverbs and Four-Character Idioms to Know",
    reason: "67 characters, 7 over. Trimmed 'Every Learner Should' to 'to'.",
  },
  {
    slug: "korean-telling-time-dates-guide",
    lang: "en",
    before: "How to Tell Time and Dates in Korean (Native vs Sino-Korean Numbers)",
    after: "Telling Time in Korean: Native vs Sino-Korean Numbers",
    reason: "68 characters, 8 over. Restructured to keep the native-vs-Sino-Korean distinction (the article's actual subject) rather than dropping it.",
  },
  {
    slug: "learn-korean-3-months-study-method",
    lang: "en",
    before: "learn korean fast — Learn Korean in 3 Months",
    after: "How to Learn Korean in 3 Months",
    reason: "Stuffed lowercase keyword prefix repeating 'learn korean'. Drops the prefix.",
  },
  {
    slug: "korean-cafe-coffee-culture",
    lang: "en",
    before: "Korean Cafe Culture: Why Korea Has the World's Most...",
    after: "Korean Cafe Culture: Korea's Most Creative Cafes",
    reason: "Ended in an ellipsis. Completed as a full phrase using the article's own opening claim (themed/creative cafes).",
  },
  {
    slug: "korean-irregular-verbs-guide",
    lang: "en",
    before: "Korean Irregular Verbs: ㅂ, ㄷ, 르, ㅅ Conjugation Rules Explained",
    after: "Korean Irregular Verbs: ㅂ, ㄷ, 르, ㅅ Conjugation Rules",
    reason: "62 characters, 2 over. Trimmed the redundant 'Explained'.",
  },
  {
    slug: "korean-transportation-guide-seoul",
    lang: "en",
    before: "Getting Around Seoul: Korean Transportation Vocabulary and Phrases",
    after: "Getting Around Seoul: Korean Transport Vocabulary",
    reason: "66 characters, 6 over. Shortened 'Transportation' to 'Transport', trimmed 'and Phrases'.",
  },
  {
    slug: "korean-zodiac-fortune-telling-guide",
    lang: "en",
    before: "Korean Zodiac and Fortune Telling: Saju, Tti, and Gunghap Explained",
    after: "Korean Zodiac and Fortune Telling Explained",
    reason: "67 characters, 7 over. Trimmed the three named terms — they're the article's own subheadings, not needed in the title to fit under 60.",
  },
  {
    slug: "korean-drinking-culture-soju-etiquette",
    lang: "en",
    before: "Korean Drinking Culture: Soju Etiquette and Rules Every Beginner Should Know",
    after: "Korean Drinking Culture: Soju Etiquette and Rules",
    reason: "76 characters, 16 over. Trimmed 'Every Beginner Should Know'.",
  },
  {
    slug: "korean-military-service-explained",
    lang: "en",
    before: "Korean Military Service Explained: Why K-Pop Idols and Actors Enlist",
    after: "Korean Military Service: Why K-Pop Idols Enlist",
    reason: "68 characters, 8 over. Trimmed the redundant 'Explained' and 'and Actors' (the article's own keywords name only idols).",
  },
  {
    slug: "korean-convenience-store-culture",
    lang: "en",
    before: "Korean Convenience Store Culture: A Guide to Pyeoneuijeom (편의점)",
    after: "Korean Convenience Store Culture: A Guide to Pyeoneuijeom",
    reason: "63 characters, 3 over. Dropped the Hangul in parentheses from the title only — it stays in the article body.",
  },
  {
    slug: "korean-webtoon-reading-guide",
    lang: "en",
    before: "Korean Webtoons: A Beginner's Guide to Reading and Vocabulary",
    after: "Korean Webtoons: A Beginner's Guide to Reading",
    reason: "61 characters, 1 over. Trimmed 'and Vocabulary'.",
  },

  // ── Arabic — every one below needs Re's review regardless of the
  // confidence marker. "high" means the fix is a mechanical de-duplication
  // with no register/phrasing judgment call; "medium" means it involves a
  // word choice, register, or scope decision a native speaker should weigh
  // in on specifically (called out in the reason).
  {
    slug: "topik-exam-guide-ar",
    lang: "ar",
    before: "امتحان TOPIK: TOPIK: دليل اجتياز اختبار الكورية",
    after: "امتحان TOPIK: دليل اجتياز اختبار اللغة الكورية",
    reason: "\"TOPIK\" literally repeated twice with a colon between. Removed the duplicate, added \"اللغة\" (language) for a more standard phrase.",
    confidence: "high",
  },
  {
    slug: "50-essential-korean-words-beginners-ar",
    lang: "ar",
    before: "كلمات كورية — 50 كلمة كورية أساسية لازم كل مبتدئ يتعلمها الأ",
    after: "50 كلمة كورية أساسية لكل مبتدئ",
    reason: "Stuffed prefix repeating 'كلمات كورية', and truncated mid-word. Also softened the colloquial 'لازم' (Egyptian colloquial 'has to') to the more standard 'لكل' — FLAG: if the site's voice is deliberately colloquial elsewhere, this register change may not be wanted; please check against the article's own tone.",
    confidence: "medium",
  },
  {
    slug: "seoul-travel-korean-phrases-ar",
    lang: "ar",
    before: "سفر إلى سيول: سيول: عبارات كورية أساسية للسياح",
    after: "السفر إلى سيول: عبارات كورية أساسية للسياح",
    reason: "'سيول' (Seoul) literally repeated. Removed the duplicate, added the definite article for a more standard title form.",
    confidence: "high",
  },
  {
    slug: "how-long-to-learn-korean-arabic-speakers-ar",
    lang: "ar",
    before: "كم يستغرق تعلم الكورية — كم من الوقت يستغرق تعلم اللغة الكور",
    after: "كم يستغرق تعلم اللغة الكورية للناطقين بالعربية؟",
    reason: "'How long does it take' said twice, and truncated. FLAG: added a question mark, which I have not confirmed is consistent with this site's other Arabic titles — please check.",
    confidence: "medium",
  },
  {
    slug: "learn-korean-3-months-study-method-ar",
    lang: "ar",
    before: "تعلم الكورية 3 أشهر: تعلم الكورية في 3 أشهر: خطة دراسية",
    after: "تعلم الكورية في 3 أشهر: خطة دراسية فعالة",
    reason: "'تعلم الكورية...3 أشهر' repeated almost verbatim. Kept one mention, added 'فعالة' (effective).",
    confidence: "high",
  },
  {
    slug: "korean-dating-phrases-kdrama-lines-ar",
    lang: "ar",
    before: "عبارات التعارف الكورية — عبارات المواعدة الكورية وخطوط الدرا",
    after: "عبارات المواعدة الكورية وأشهر خطوط الدراما",
    reason: "'عبارات' repeated, and 'التعارف' (getting acquainted) / 'المواعدة' (dating) are near-duplicate concepts stacked together, plus the title was truncated. FLAG: I chose 'المواعدة' over 'التعارف' based on the slug and keywords, but have not read the article body to confirm which concept it actually emphasizes — please check before approving.",
    confidence: "medium",
  },
  {
    slug: "korean-drinking-culture-soju-etiquette-ar",
    lang: "ar",
    before: "ثقافة الشرب الكورية: آداب السوجو والقواعد التي يجب أن يعرفها كل مبتدئ",
    after: "ثقافة الشرب الكورية: آداب السوجو لكل مبتدئ",
    reason: "69 characters, 9 over. Trimmed the relative clause 'والقواعد التي يجب أن يعرفها' (and the rules every beginner should know) to 'لكل مبتدئ' (for every beginner) — loses the explicit word 'rules' though 'etiquette' still carries that meaning.",
    confidence: "medium",
  },
  {
    slug: "korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar",
    lang: "ar",
    before: "تطبيقات تعلم اللغة الكورية — أفضل تطبيقات التعلم الكورية مقا",
    after: "أفضل تطبيقات تعلم الكورية 2026: دولينجو مقابل روزيتا ستون",
    reason: "'تطبيقات' and 'الكورية' both repeated, and truncated. Replaced the generic repeated lead with the actual comparison named in the slug and keywords (Duolingo vs Rosetta Stone) — FLAG: please confirm the article is in fact a head-to-head comparison of exactly these two apps, not a broader list, before approving this framing.",
    confidence: "medium",
  },
  {
    slug: "korean-military-service-explained-ar",
    lang: "ar",
    before: "الخدمة العسكرية الكورية: لماذا يلتحق نجوم الكيبوب والممثلون بالجيش",
    after: "الخدمة العسكرية الكورية: لماذا يلتحق نجوم الكيبوب بالجيش؟",
    reason: "66 characters, 6 over. Trimmed 'والممثلون' (and actors) — the article's own keywords name only K-pop idols, not actors, so this narrows to what the keywords actually target rather than cutting arbitrarily.",
    confidence: "medium",
  },
  {
    slug: "korean-past-tense-conjugation-guide-ar",
    lang: "ar",
    before: "الزمن الماضي الكوري — تصريف الفعل الماضي الكوري",
    after: "تصريف الفعل الماضي في اللغة الكورية",
    reason: "'الماضي' (past) repeated. Kept one mention, standard grammar-guide phrasing.",
    confidence: "high",
  },
  {
    slug: "korean-proverbs-idioms-guide-ar",
    lang: "ar",
    before: "الأمثال الكورية والتعابير المكونة من أربعة أحرف التي يجب أن يعرفها كل متعلم",
    after: "الأمثال الكورية والتعابير المكونة من أربعة أحرف",
    reason: "75 characters, 15 over. Dropped the trailing relative clause 'التي يجب أن يعرفها كل متعلم' (that every learner should know) entirely — it added length without adding meaning.",
    confidence: "high",
  },
  {
    slug: "korean-sentence-structure-word-order-guide-ar",
    lang: "ar",
    before: "هيكل الجملة الكورية — بنية الجملة الكورية",
    after: "هيكل الجملة الكورية وترتيب الكلمات",
    reason: "This is the exact repetition pattern named in the Gate 2 brief: 'بنية' (structure) and 'هيكل' (structure) are near-synonyms, and 'الجملة الكورية' is repeated verbatim. Replaced 'بنية الجملة الكورية' with 'ترتيب الكلمات' (word order), which matches the article's own keyword and slug.",
    confidence: "high",
  },
  {
    slug: "korean-telling-time-dates-guide-ar",
    lang: "ar",
    before: "كيف تخبر الوقت والتاريخ بالكورية (الأرقام الأصلية مقابل الصينية-الكورية)",
    after: "كيف تخبر الوقت والتاريخ بالكورية: الأرقام الأصلية والصينية",
    reason: "72 characters, 12 over. FLAG: shortened 'الصينية-الكورية' (Sino-Korean) to 'الصينية' (Chinese) to fit — on its own this could read as 'Chinese numbers' rather than 'Sino-Korean numbers' specifically, which is a real ambiguity risk in a grammar-teaching context. Please check whether this reads correctly or whether the fuller compound term needs to stay even at the cost of further trimming elsewhere.",
    confidence: "medium",
  },
  {
    slug: "korean-drama-vocabulary-advanced-ar",
    lang: "ar",
    before: "المفردات الدراما — مفردات الدراما الكورية المتقدمة",
    after: "مفردات الدراما الكورية المتقدمة",
    reason: "Stuffed prefix repeating 'الدراما', and the prefix itself ('المفردات الدراما') was grammatically awkward (mismatched definite article). Dropped it.",
    confidence: "high",
  },
  {
    slug: "korean-food-vocabulary-ar",
    lang: "ar",
    before: "مفردات طعام كوري: طعام كوري: 60 كلمة مفردات أساسية",
    after: "مفردات الطعام الكوري: 60 كلمة أساسية",
    reason: "'طعام كوري' repeated with a colon between, and 'مفردات' also repeated later. Kept one mention of each, standard definite-article phrasing.",
    confidence: "high",
  },
  {
    slug: "korean-learning-apps-comparison-2026-ar",
    lang: "ar",
    before: "تطبيقات تعلم كوري — أفضل تطبيقات تعلم الكورية 2026",
    after: "أفضل تطبيقات تعلم اللغة الكورية 2026",
    reason: "'تطبيقات' and 'تعلم' both repeated. Kept one clean mention of each.",
    confidence: "high",
  },

  // ── Added on re-scan: found by going back through all 90 Arabic titles for
  // grammatical breakage independent of length/pattern, after the original
  // detector was shown to miss anything with no colon/dash at all, and
  // anything where repetition was masked by the Arabic definite article
  // (ال), the conjunction prefix (و), or a singular/plural variant.
  {
    slug: "korean-adjectives-100-examples-beginners-ar",
    lang: "ar",
    before: "100 الصفات الكورية الأساسية مع الجمل سبيل المثال",
    after: "100 صفة كورية أساسية مع جمل توضيحية",
    reason: "Not a length or repetition defect — a genuinely ungrammatical string. 'سبيل المثال' ('by way of example') needs a preceding 'على' and appears bare with no connector after 'الجمل'; '100' directly before a definite plural noun is non-standard numeral-noun agreement. Reads as a machine-translation artefact, not a sentence a person wrote.",
    confidence: "medium",
  },
  {
    slug: "seollal-korean-lunar-new-year-guide-2026-ar",
    lang: "ar",
    before: "seollal — السولال — Klovers Korean",
    after: "سولال: عيد رأس السنة القمرية الكورية",
    reason: "An untranslated English word, its transliteration, and the site's own name appended as if part of the title — not a title, a placeholder. THIS IS THE MOST-READ ARABIC ARTICLE ON THE SITE (10 views, highest of any Arabic page) — the worst title in the catalogue is the one Arabic article people actually reach.",
    confidence: "medium",
  },
  {
    slug: "dokkaebi-korean-goblin-myth-kdrama-ar",
    lang: "ar",
    before: "dokkaebi — دوكايبي — Klovers Korean",
    after: "دوكايبي: أسطورة الغول الكوري في الدراما",
    reason: "Same placeholder pattern as the Seollal title: English word, transliteration, site name appended.",
    confidence: "medium",
  },
  {
    slug: "jeoseung-saja-korean-grim-reaper-symbolism-ar",
    lang: "ar",
    before: "جيوسيونغ ساجا — Jeoseung Saja — Klovers Korean",
    after: "جيوسيونغ ساجا: رمزية ملاك الموت الكوري",
    reason: "Same placeholder pattern: transliteration, the English title repeated, site name appended.",
    confidence: "medium",
  },
  {
    slug: "what-is-jeong-korean-untranslatable-concept-ar",
    lang: "ar",
    before: "jeong: ما هو جيونغ (정)؟ المفهوم الكوري الذي لا يمكنك ترجمته",
    after: "ما هو جيونغ (정)؟ المفهوم الكوري الذي لا يمكنك ترجمته",
    reason: "Opens with a bare lowercase English word ('jeong:') before the Arabic starts — same family as the placeholder titles above, though milder: the Arabic that follows is already a complete, correct sentence once the English lead-in is dropped.",
    confidence: "high",
  },
  {
    slug: "korean-shopping-phrases-complete-guide-ar",
    lang: "ar",
    before: "عبارات التسوق الكورية: 50 عبارة تسوق كورية تحتاجها في سيول",
    after: "50 عبارة تسوق كورية أساسية تحتاجها في سيول",
    reason: "'التسوق'/'تسوق' and 'الكورية'/'كورية' repeated — missed by the original detector because it compared exact strings and never stripped the Arabic definite article 'ال', so 'التسوق' and 'تسوق' looked like different words. Dropped the redundant lead entirely.",
    confidence: "high",
  },
  {
    slug: "korean-honorifics-formality-levels-grammar-ar",
    lang: "ar",
    before: "احترام كوري — مستويات الاحترام والرسمية في الكورية",
    after: "مستويات الاحترام والرسمية في اللغة الكورية",
    reason: "'احترام' (respect) and 'كوري/الكورية' (Korean) both repeated across the dash — same ال-stripping gap. Dropped the redundant lead.",
    confidence: "high",
  },
  {
    slug: "korean-pronunciation-guide-speaking-ar",
    lang: "ar",
    before: "نطق كوري: دليل النطق الكوري: اتقن الكلام من اليوم الأول",
    after: "دليل النطق الكوري: اتقن الكلام من اليوم الأول",
    reason: "Two colons, and 'نطق'/'كوري' repeated in the first two segments — same ال-stripping gap. Dropped the redundant lead, kept the rest unchanged.",
    confidence: "high",
  },
  {
    slug: "korean-counting-units-classifiers-ar",
    lang: "ar",
    before: "عدادات كورية: وحدات العد الكورية (المصنفات): الدليل الكامل",
    after: "وحدات العد والمصنفات الكورية: الدليل الكامل",
    reason: "'عدادات' and 'وحدات العد' are two different Arabic words for the same 'counting units' concept, stated back to back — a synonym-level duplication no exact-string test can catch. This is the Arabic sibling of 'korean-counting-units-classifiers' (English), already in this table for the identical underlying redundancy. FLAG: merges two near-synonymous terms into one — I could not check which term the article body itself actually uses.",
    confidence: "medium",
  },
  {
    slug: "korean-body-language-social-etiquette-ar",
    lang: "ar",
    before: "آداب كورية: لغة الجسد الكورية وآداب السلوك الاجتماعي",
    after: "لغة الجسد الكورية وآداب السلوك الاجتماعي",
    reason: "'آداب' (etiquette) repeated — missed originally because the second occurrence carries the connector prefix 'و' ('وآداب'), which the detector didn't strip before comparing. This is the Arabic sibling of 'korean-body-language-social-etiquette' (English), already in this table for the same defect. Dropped the redundant lead.",
    confidence: "high",
  },
  {
    slug: "korean-verb-conjugation-guide-ar",
    lang: "ar",
    before: "الأفعال الكورية — أصبح تصريف الفعل الكوري سهلاً",
    after: "تصريف الفعل الكوري أصبح سهلاً",
    reason: "'الأفعال' (verbs, plural) and 'الفعل' (verb, singular) — same root, different number, so exact-string matching missed it. This is the Arabic sibling of 'korean-verb-conjugation-guide' (English), already in this table for the same defect. Dropped the redundant lead, reordered slightly for natural flow.",
    confidence: "medium",
  },
];

/** Title-only, no-duplicate-slug, fits-and-complete checks. Exported so the
 * cached-store rehearsal run in this environment exercises the exact same
 * guard, not a reimplementation of it. */
export function validateEdits(edits) {
  const seen = new Set();
  for (const e of edits) {
    if (seen.has(e.slug)) throw new Error(`titles.mjs: duplicate edit for ${e.slug}`);
    seen.add(e.slug);
    if (cpLen(e.after) > 60) {
      throw new Error(`titles.mjs: "${e.after}" (${e.slug}) is ${cpLen(e.after)} chars, over the 60 limit`);
    }
    if (/\.\.\.$|…$/.test(e.after.trim())) {
      throw new Error(`titles.mjs: "${e.after}" (${e.slug}) still ends in an ellipsis`);
    }
  }
}

// Only runs when this file is executed directly (`node scripts/proposals/titles.mjs`),
// not when EDITS/validateEdits are imported elsewhere.
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEdits(EDITS);
  const store = createReadOnlyStore();
  const edits = EDITS.map((e) => ({ ...e, column: "title" }));

  const { batchId, jsonPath, mdPath, proposal } = await writeProposal(
    {
      source: "scripts/proposals/titles.mjs",
      description: "Gate 2 Step 1 — repair 53 published article titles (over 60 chars, ellipsis endings, stuffed keyword prefixes / repetition, and — found on re-scan — 3 English/transliteration placeholder titles and 4 more repetition cases masked by Arabic morphology). title only, slug untouched.",
      edits,
    },
    store
  );

  console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log(`\nSee docs/GATE2_STEP1_TITLES.md for the full review table (English/Arabic, sorted by views).`);
  console.log(`Nothing has been written to the database.`);
}

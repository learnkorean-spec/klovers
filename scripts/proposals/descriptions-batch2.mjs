#!/usr/bin/env node
/**
 * descriptions-batch2.mjs — Gate 2 Step 5, batch 2.
 *
 * WHY THIS BATCH EXISTS, AND WHY MY EARLIER COUNT WAS WRONG
 *
 * Batch 1 reported "62 of 200 published articles have a defective description".
 * That number was measured with a regex anchored on `^[a-z]` — it could only
 * see a stuffed keyword prefix written in the Latin alphabet. Every Arabic
 * article with the same defect was invisible to it. Re-measured on 2026-09-04
 * with a script-agnostic test, against the same 200 published rows:
 *
 *   opens with a prefix that repeats its own title, then " — "      44
 *   ends mid-sentence in an ellipsis                                 39
 *   carries the duplicated "تعلم المزيد مع أكاديمية كلوفرز" tail     14
 *   longer than 160 characters (truncated in search results)          7
 *   ------------------------------------------------------------------
 *   distinct articles affected (the sets overlap)                    75
 *
 * This batch takes the 46 that end in an ellipsis or run over 160 characters.
 * Most of them ALSO carry a stuffed prefix or the boilerplate tail, so those
 * are repaired in the same edit rather than touching a row twice. The ~29 rows
 * whose only defect is a stuffed prefix are batch 3.
 *
 * The boilerplate tail is the root cause of most of the truncation: a fixed
 * 60-character advertisement appended to every Arabic description, identical
 * across articles, pushing the real sentence past the limit. Google shows the
 * first ~155 characters, so on those pages the searcher saw the ad and never
 * saw what the article was about. It is removed, not shortened.
 *
 * The Arabic replacements are WRITTEN AS ARABIC, not repaired as translations.
 * The old values are machine translations and several are wrong in ways a
 * reader notices immediately:
 *
 *   "احتفالات القناة الهضمية"  — 굿, a shamanic rite, was read as English
 *                                 "gut" and rendered as the intestinal tract.
 *   "الأساطير والأساطير الكورية" — "myths and legends" collapsed into the same
 *                                 Arabic word twice: "myths and myths".
 *   "جسيمات"                    — 조사, grammatical particles, rendered with
 *                                 the physics term for subatomic particles.
 *   "موت المعجبين"              — "fan death" read as death OF fans rather
 *                                 than death BY an electric fan.
 *   "مطالبة شخص ما بالخروج"     — "asking someone out" translated literally
 *                                 as demanding that a person exit.
 *
 * HARD CONSTRAINT: `description` only. Never title, slug, keywords or content.
 *
 * Usage: node scripts/proposals/descriptions-batch2.mjs
 * Needs SUPABASE_URL and SUPABASE_ANON_KEY. Read-only; writes a proposal file.
 */
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";

export const BOILERPLATE = "أكاديمية كلوفرز";

/**
 * The precondition is the DEFECT ITSELF, not a transcription of the old value.
 *
 * Batch 1 used `beforePrefix` and that worked, but it only suits rows whose
 * defect is at the front. Here the defect can be at either end, and hardcoding
 * 46 old values — half of them Arabic, with an ellipsis that is sometimes U+2026
 * and sometimes three ASCII dots — would produce transcription errors that
 * surface as mysterious stale edits.
 *
 * What actually makes an edit safe is that the live row still has the problem.
 * If someone has already rewritten a description, it will no longer be
 * defective, and this script leaves their work alone and reports the skip.
 */
export function stillDefective(description, title) {
  const d = String(description || "");
  if (!d.trim()) return false;
  if (/(\.\.\.|…)\s*$/.test(d.trim())) return true;
  if (Array.from(d).length > 160) return true;
  if (d.includes(BOILERPLATE)) return true;
  const m = d.match(/^(.{1,45}?) — /);
  if (m && String(title || "").includes(m[1])) return true;
  return false;
}

/** All 46 replacements are hand-written. 100-160 characters, complete sentences. */
export const EDITS = [
  // ── English ──────────────────────────────────────────────────────────
  {
    slug: "best-kdrama-learn-korean-difficulty-ranked",
    lang: "en",
    after:
      "Fifteen popular K-dramas ranked by difficulty for Korean learners, from beginner-friendly to advanced, each with a vocabulary sheet and watching tips.",
  },
  {
    slug: "hanbok-korean-traditional-clothing",
    lang: "en",
    after:
      "Everything to know about hanbok, Korea's traditional dress: its history, the vocabulary, where to rent one in Seoul, and what it says about Korean culture.",
  },
  {
    slug: "how-to-learn-korean-faster",
    lang: "en",
    after:
      "Ten research-backed strategies to learn Korean faster, for beginners and intermediate learners alike, plus a 30-day challenge and a daily study routine.",
  },
  {
    slug: "korean-animal-vocabulary-sounds",
    lang: "en",
    after:
      "Korean animal names plus the playful onomatopoeia Koreans use for animal sounds, from 멍멍 to 야옹, with a full vocabulary table and example sentences.",
  },
  {
    slug: "korean-body-parts-vocabulary",
    lang: "en",
    after:
      "Korean body parts vocabulary from head to toe, plus how to describe pain and symptoms at a Korean pharmacy or clinic, with a full table and examples.",
  },
  {
    slug: "korean-clothing-fashion-vocabulary",
    lang: "en",
    after:
      "Essential Korean clothing and fashion vocabulary for shopping, describing outfits and talking about K-fashion trends, with a full table and useful phrases.",
  },
  {
    slug: "korean-daily-greetings",
    lang: "en",
    after:
      "The 40 Korean greetings and daily phrases native speakers actually use, from hello to goodbye and formal to casual, with pronunciation for every one.",
  },
  {
    slug: "korean-first-birthday-dol-traditions",
    lang: "en",
    after:
      "Doljanchi, Korea's elaborate first-birthday celebration, including the doljabi tradition in which the baby picks an object said to predict its future.",
  },
  {
    slug: "korean-grammar-particles",
    lang: "en",
    after:
      "Korean particles (조사) are the key to Korean grammar. This guide explains subject, object, topic and location particles with clear examples of each.",
  },
  {
    slug: "korean-honorifics-formality-levels-grammar",
    lang: "en",
    after:
      "A complete guide to Korean honorifics and formality levels. Learn 존댓말 and 반말, when each one belongs, with practice dialogues and K-drama examples.",
  },
  {
    slug: "korean-learning-apps-comparison-2026-duolingo-rosetta-stone",
    lang: "en",
    after:
      "A 2026 comparison of the main Korean learning apps: Duolingo, Rosetta Stone, Memrise, Babbel and Klovers, reviewed across 12 criteria with pricing.",
  },
  {
    slug: "korean-pronunciation-guide-speaking",
    lang: "en",
    after:
      "Master Korean pronunciation from day one: consonants, vowels, sound change rules and a four-week practice routine, with tips for Arabic speakers.",
  },
  {
    slug: "korean-skincare-kbeauty-routine-guide",
    lang: "en",
    after:
      "The ten-step Korean skincare routine that reshaped global beauty, explained: what each step does, which products matter, and the philosophy behind it.",
  },
  {
    slug: "korean-tattoo-culture-guide",
    lang: "en",
    after:
      "Korean tattoo culture explained: why tattoos were long stigmatised, the legal gray area artists still work in, and how younger attitudes are changing.",
  },
  {
    slug: "korean-transportation-guide-seoul",
    lang: "en",
    after:
      "The Korean transport vocabulary and phrases you need to navigate Seoul's subway, buses and taxis like a local, with a full table and practical tips.",
  },
  {
    slug: "korean-webtoon-reading-guide",
    lang: "en",
    after:
      "Korean webtoons explained: the vertical-scroll comics behind hits like Solo Leveling and True Beauty, plus the vocabulary you need to start reading them.",
  },
  {
    slug: "learn-korean-alphabet-hangul-guide",
    lang: "en",
    after:
      "Master the Korean alphabet in a single day. This step-by-step guide covers all 40 letters, pronunciation and stroke order, so you can start reading Hangul.",
  },
  {
    slug: "topik-exam-guide",
    lang: "en",
    after:
      "A complete TOPIK guide for Arabic speakers: exam structure, scoring, preparation strategies and study tips for passing TOPIK I or TOPIK II.",
  },
  {
    slug: "topik-exam-preparation-complete-guide-2026",
    lang: "en",
    after:
      "A complete 2026 TOPIK preparation guide: test format, scoring, registration dates, a 12-week study plan, writing tips and vocabulary lists by level.",
  },

  // ── Arabic ───────────────────────────────────────────────────────────
  {
    slug: "ar-korean-food-vocabulary",
    lang: "ar",
    after:
      "أكثر من ٦٠ كلمة ومصطلحًا من عالم الطعام الكوري، من البيبيمباب إلى التوكبوكي، مع النطق وأمثلة عملية على استخدام كل كلمة في المطعم.",
    reason:
      "Stuffed prefix 'طعام كوري — ', then the boilerplate tail truncated at 160. Transliteration of 떡볶이 corrected from 'التيبوكي' to 'التوكبوكي'.",
  },
  {
    slug: "ar-korean-slang-words",
    lang: "ar",
    after:
      "٣٥ كلمة وعبارة عامية كورية تسمعها في الدراما وأغاني الكيبوب، مع معناها ودرجة رسميتها وكيفية استخدامها في المحادثة اليومية.",
  },
  {
    slug: "ar-seoul-travel-korean-phrases",
    lang: "ar",
    after:
      "العبارات الكورية الأساسية التي تحتاجها في رحلتك إلى سيول: المواصلات والفنادق والتسوق والطوارئ، مع النطق والترجمة لكل عبارة.",
  },
  {
    slug: "gumiho-nine-tailed-fox-korean-folklore-ar",
    lang: "ar",
    after:
      "كل شيء عن الغوميهو، الثعلب ذو الذيول التسعة: أصل الأسطورة ورموزها وحضورها في الدراما الكورية، ولماذا ما زالت حيّة بعد ألف عام.",
    reason:
      "Old value mixed two transliterations of the same word ('جوميهو' in the prefix, 'غوميهو' in the sentence) and was cut off mid-word at 'تنوم'.",
  },
  {
    slug: "hanbok-korean-traditional-clothing-ar",
    lang: "ar",
    after:
      "الهانبوك، الزي الكوري التقليدي: تاريخه وأنواعه ومناسبات ارتدائه، وكيف تحوّل من لباس يومي إلى رمز ثقافي معروف حول العالم.",
  },
  {
    slug: "how-to-introduce-yourself-in-korean-ar",
    lang: "ar",
    after:
      "تعلّم كيف تقدّم نفسك بالكورية خطوة بخطوة، من تحية «أنيونغ هاسيو» إلى ذكر اسمك وعمرك وعملك، مع جمل جاهزة للحفظ والاستخدام.",
    reason:
      "The old prefix repeated the article title verbatim, then the sentence restated it again. It also left 'annyeonghaseyo' in Latin letters inside an Arabic sentence.",
  },
  {
    slug: "korean-age-system-explained-ar",
    lang: "ar",
    after:
      "شرح مبسّط لنظام الأعمار الكوري الفريد: كيف يُحسب عمرك في كوريا، ولماذا اختلف الكوريون عن بقية العالم، وما الذي تغيّر مؤخرًا.",
  },
  {
    slug: "korean-body-language-social-etiquette-ar",
    lang: "ar",
    after:
      "الآداب الاجتماعية وقواعد السلوك في كوريا: من تقديم بطاقة العمل بكلتا اليدين إلى آداب المائدة والانحناء، وكيف تتصرّف في كل موقف.",
  },
  {
    slug: "korean-dating-phrases-kdrama-lines-ar",
    lang: "ar",
    after:
      "أكثر من ٤٠ عبارة مواعدة كورية وأشهر جمل الدراما: من دعوة شخص للخروج إلى الاعتراف بالمشاعر، مع شرح متى تُقال كل عبارة ولمن.",
    reason:
      "Old value rendered 'asking someone out' literally as 'مطالبة شخص ما بالخروج' (demanding that a person exit) and left the drama titles in Latin script.",
  },
  {
    slug: "korean-drama-vocabulary-advanced-ar",
    lang: "ar",
    after:
      "ارفع مستوى لغتك الكورية بستين كلمة متقدمة شائعة في الدراما الكورية، مرتّبة حسب النوع، مع سياق كل كلمة وأمثلة على استخدامها.",
    reason:
      "Old prefix 'المفردات الدراما — ' is not grammatical Arabic; the correct construction is 'مفردات الدراما'.",
  },
  {
    slug: "korean-family-terms-relationships-guide-ar",
    lang: "ar",
    after:
      "دليل شامل لأسماء أفراد الأسرة بالكورية: لماذا فيها أكثر من ٤٠ كلمة للأقارب، وكيف تتغيّر الكلمة حسب من يتكلّم ومع من.",
  },
  {
    slug: "korean-grammar-particles-ar",
    lang: "ar",
    after:
      "أدوات الجملة الكورية (조사) وكيفية استخدامها: أداة الفاعل والمفعول والموضوع والمكان، بشرح مبسّط للمبتدئين ومثال عملي لكل أداة.",
    reason:
      "Old value called 조사 'جسيمات', the physics term for subatomic particles, and also 'حروف الجر' (prepositions), which they are not. Grammatical particles in Arabic are 'أدوات'.",
  },
  {
    slug: "korean-learning-apps-comparison-2026-ar",
    lang: "ar",
    after:
      "مقارنة شاملة لتطبيقات تعلّم الكورية: دوولينجو وروزيتا ستون وبابل وميمرايز وكلوفرز، بالأسعار والمميزات والعيوب وأنسب تطبيق لكل مستوى.",
  },
  {
    slug: "korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar",
    lang: "ar",
    after:
      "مقارنة ٢٠٢٦ لتطبيقات تعلّم الكورية: دوولينجو وروزيتا ستون وميمرايز وبابل وكلوفرز عبر اثني عشر معيارًا، بالأسعار والإيجابيات والسلبيات.",
  },
  {
    slug: "korean-myths-legends-stories-kdrama-fans-ar",
    lang: "ar",
    after:
      "عشر أساطير كورية أساسية، من الثعلب ذي الذيول التسعة إلى الدوكايبي وأسطورة دانغون، والقصص التي تقف وراء كل حبكة في الدراما الكورية.",
    reason:
      "Old value opened with 'الأساطير والأساطير الكورية' — 'myths and myths' — because 'myths and legends' collapsed into one Arabic word twice. It also left 'Dokkaebi' and 'Dangun' in Latin script.",
  },
  {
    slug: "korean-numbers-guide-ar",
    lang: "ar",
    after:
      "دليل شامل لنظامَي الأرقام في الكورية: متى تستخدم كل نظام، ولماذا يعدّ الكوريون بطريقتين، مع جدول كامل وأمثلة على العدّ اليومي.",
  },
  {
    slug: "korean-past-tense-conjugation-guide-ar",
    lang: "ar",
    after:
      "أتقن تصريف الفعل الماضي في الكورية بقواعد واضحة وجداول تناغم الحروف المتحركة والأفعال الشاذة، مع أكثر من ٣٠ مثالًا للمبتدئين.",
  },
  {
    slug: "korean-pronunciation-guide-beginners-ar",
    lang: "ar",
    after:
      "قواعد النطق الكوري التي يتجاهلها معظم المبتدئين: كيف تنطق الحروف والتغيّرات الصوتية بشكل طبيعي وتقترب من نطق الناطق الأصلي.",
  },
  {
    slug: "korean-shamanism-mudang-kdrama-tradition-ar",
    lang: "ar",
    after:
      "مقدمة واضحة للشامانية الكورية: من هي المودانغ، وما طقس الغوت، ولماذا عاد هذا التقليد الممتد خمسة آلاف عام إلى الدراما الكورية.",
    reason:
      "The most damaging value on the site: 굿, a shamanic rite, was machine-translated through English 'gut' and published as 'احتفالات القناة الهضمية' — 'ceremonies of the intestinal tract'. Corrected to 'طقس الغوت'.",
    confidence: "high",
  },
  {
    slug: "korean-shopping-phrases-complete-guide-ar",
    lang: "ar",
    after:
      "أكثر من ٥٠ عبارة تسوّق كورية تحتاجها في ميونغدونغ ودونغدايمون والمتاجر الإلكترونية: كيف تساوم وتسأل عن المقاس وتدفع كأهل البلد.",
  },
  {
    slug: "korean-superstitions-beliefs-daily-life-ar",
    lang: "ar",
    after:
      "اثنتا عشرة خرافة كورية ما زال الكوريون يتعاملون معها اليوم: مروحة الموت والحبر الأحمر والرقم أربعة ونعيق الغراب، وأصل كل معتقد.",
    reason:
      "Old value rendered 'fan death' as 'موت المعجبين' — the death of admirers — when the superstition is about an electric fan. Corrected to 'مروحة الموت'.",
  },
  {
    slug: "korean-traditional-holidays-chuseok-seollal-ar",
    lang: "ar",
    after:
      "أهم عيدين في الثقافة الكورية، تشوسوك وسولال: تاريخهما وطقوسهما وأطباقهما الخاصة، وكيف يحتفل بهما الكوريون اليوم.",
    reason:
      "Transliteration of 설날 unified with the rest of the site: 'سيولال' here, 'سولال' everywhere else, including this article's own title.",
  },
  {
    slug: "korean-weather-seasons-vocabulary-ar",
    lang: "ar",
    after:
      "أكثر من ١٠٠ كلمة عن الطقس بالكورية مع العبارات الموسمية وجمل الطقس التي تسمعها في الدراما، مناسبة للمبتدئين والمستوى المتوسط.",
  },
  {
    slug: "learn-korean-alphabet-hangul-guide-ar",
    lang: "ar",
    after:
      "دليل عملي لتعلّم الهانغول في يوم واحد: الحروف الساكنة والمتحركة وكيف تتركّب في مقاطع، حتى تقرأ الكورية من الصفر.",
  },
  {
    slug: "learn-korean-egypt-best-classes-2026-ar",
    lang: "ar",
    after:
      "مقارنة بين أفضل أماكن تعلّم الكورية في مصر لعام ٢٠٢٦، أونلاين وفي القاهرة والإسكندرية: الأسعار والمناهج والمدرّسون والنتائج.",
  },
  {
    slug: "topik-1-vocabulary-list-800-words-ar",
    lang: "ar",
    after:
      "القائمة الكاملة لأهم ٨٠٠ كلمة كورية لاجتياز اختبار توبيك الأول، مصنّفة حسب الموضوع مع الترجمة والنطق لكل كلمة.",
  },
  {
    slug: "topik-exam-guide-ar",
    lang: "ar",
    after:
      "دليل شامل لاجتياز اختبار توبيك للمتحدثين بالعربية: هيكل الامتحان ونظام الدرجات واستراتيجيات المذاكرة والمصادر التي تحتاجها.",
  },
];

/** Nothing here may reintroduce any of the four defects it exists to remove. */
export function validateEdits(edits) {
  const seen = new Set();
  for (const e of edits) {
    if (seen.has(e.slug)) throw new Error(`descriptions-batch2: duplicate edit for ${e.slug}`);
    seen.add(e.slug);

    const n = Array.from(e.after).length;
    if (n > 160) throw new Error(`descriptions-batch2: ${e.slug} is ${n} chars, over the 160 limit`);
    if (n < 70) throw new Error(`descriptions-batch2: ${e.slug} is ${n} chars, too short to be useful`);
    if (/(\.\.\.|…)\s*$/.test(e.after.trim())) {
      throw new Error(`descriptions-batch2: ${e.slug} still ends in an ellipsis`);
    }
    if (e.after.includes(BOILERPLATE)) {
      throw new Error(`descriptions-batch2: ${e.slug} still carries the boilerplate tail`);
    }
    if (/^.{1,45}? — /.test(e.after)) {
      throw new Error(`descriptions-batch2: ${e.slug} still opens with a dash-separated prefix`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateEdits(EDITS);

  const store = createReadOnlyStore();
  const edits = [];
  const skipped = [];

  for (const e of EDITS) {
    const live = await store.readRow(e.slug);
    if (!live) {
      skipped.push(`${e.slug}: no such published row`);
      continue;
    }
    const current = live.description || "";
    if (!stillDefective(current, live.title)) {
      skipped.push(`${e.slug}: live description is no longer defective — not overwriting`);
      continue;
    }
    if (current === e.after) {
      skipped.push(`${e.slug}: already has this exact value`);
      continue;
    }
    edits.push({ slug: e.slug, lang: e.lang, column: "description", before: current, after: e.after });
  }

  if (skipped.length) {
    console.log(`Skipped ${skipped.length} of ${EDITS.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
    console.log("");
  }

  if (edits.length === 0) {
    console.log("Nothing to propose — every description in this batch has already been repaired.");
    process.exit(0);
  }

  const { batchId, jsonPath, mdPath, proposal } = await writeProposal(
    {
      source: "scripts/proposals/descriptions-batch2.mjs",
      description:
        `Gate 2 Step 5 batch 2 — repair ${edits.length} meta descriptions that end mid-sentence ` +
        `in an ellipsis or run past the 160-character limit. Most also carry a stuffed keyword ` +
        `prefix or the duplicated "تعلم المزيد مع أكاديمية كلوفرز" tail, both repaired in the ` +
        `same edit. IMPORTANT CORRECTION: batch 1 reported 62 defective descriptions; that was ` +
        `measured with a Latin-only regex and missed every Arabic row. Re-measured 2026-09-04 ` +
        `across the same 200 published articles: 44 stuffed prefix, 39 ellipsis, 14 boilerplate ` +
        `tail, 7 over 160 chars — 75 distinct articles. Replacements are hand-written, ` +
        `100-160 characters, complete sentences. The Arabic ones are written as Arabic, not ` +
        `repaired as translations, and correct five machine-translation errors including a ` +
        `shamanic rite (굿) published as "the intestinal tract". description column only; ` +
        `title, slug, keywords and content untouched. The ~29 prefix-only rows are batch 3.`,
      edits,
    },
    store
  );

  console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log(`Nothing has been written to the database.`);
}

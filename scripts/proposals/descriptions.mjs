#!/usr/bin/env node
/**
 * descriptions.mjs — Gate 2 Step 5, batch 1: repair the meta descriptions that
 * open with a stuffed lowercase keyword prefix.
 *
 * Measured against production on 2026-09-03, across 200 published articles:
 *
 *   descriptions ending mid-sentence in an ellipsis   59
 *   descriptions opening with a stuffed keyword       23
 *   distinct articles affected                        62
 *
 * The two sets overlap by 20. This batch takes all 23 of the prefixed ones and
 * fixes BOTH defects in the same edit, because splitting them would mean
 * editing 20 rows twice — once to strip the prefix, once to finish the
 * sentence — for no benefit. The remaining 39 ellipsis-only descriptions are a
 * later batch.
 *
 * Why this matters more than it looks: the description is the text under the
 * blue link in a search result, and scripts/prerender-meta.mjs also writes it
 * into the article's visible <p> and into the BlogPosting JSON-LD. One bad
 * value shows up three times on the page.
 *
 * HARD CONSTRAINT: `description` only. Never title, slug, keywords or content.
 *
 * The replacements are HAND-WRITTEN, not generated. A script can detect that a
 * sentence was cut off; it cannot know how the author meant to finish it, and
 * guessing would put invented claims into a search result.
 *
 * Usage: node scripts/proposals/descriptions.mjs
 * Needs SUPABASE_URL and SUPABASE_ANON_KEY — the anon key is public and this
 * only reads. Writes a proposal; nothing reaches the database here.
 */
import { pathToFileURL } from "node:url";
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";

/**
 * `beforePrefix` is a PRECONDITION, not a description of the whole old value.
 *
 * Hardcoding the entire old string would mean transcribing 23 values whose
 * trailing ellipsis is sometimes U+2026 and sometimes three ASCII dots — a
 * transcription error there produces a stale edit that is tedious to diagnose.
 * Worse, it would say nothing useful: what makes an edit safe to apply here is
 * that the live value STILL HAS THE DEFECT. If someone has already rewritten a
 * description, it will no longer start with its stuffed prefix, and this script
 * skips it rather than overwriting their work.
 *
 * `after` is the full replacement. All 23 are 129-150 characters, end in a
 * complete sentence, and open with what the reader gets rather than a keyword.
 */
export const EDITS = [
  // ── English ──────────────────────────────────────────────────────────
  {
    slug: "50-essential-korean-words-beginners",
    lang: "en",
    beforePrefix: "korean words for beginners — ",
    after:
      "The 50 most important Korean words for absolute beginners. Master these first and you will understand the basics of everyday Korean conversation.",
  },
  {
    slug: "how-long-to-learn-korean-arabic-speakers",
    lang: "en",
    beforePrefix: "how long to learn korean — ",
    after:
      "How long does it really take to learn Korean? A realistic timeline for Arabic speakers, from complete beginner to conversational, stage by stage.",
  },
  {
    slug: "kdrama-korean-phrases-beginners",
    lang: "en",
    beforePrefix: "kdrama korean phrases — ",
    after:
      "The most common Korean phrases heard in K-dramas, from greetings to dramatic confessions: 30 phrases with pronunciation and when to use each one.",
  },
  {
    slug: "korean-body-language-social-etiquette",
    lang: "en",
    beforePrefix: "korean etiquette — ",
    after:
      "Korean social customs, body language, and the unwritten rules textbooks skip, from bowing correctly to reading age hierarchy in everyday situations.",
  },
  {
    slug: "korean-cafe-coffee-culture",
    lang: "en",
    beforePrefix: "korean cafe culture — ",
    after:
      "Explore Korea's cafe culture, from themed cafes to specialty coffee, and learn the Korean vocabulary and phrases you need to order like a local.",
  },
  {
    slug: "korean-counting-units-classifiers",
    lang: "en",
    beforePrefix: "korean counters — ",
    after:
      "Korean uses special counter words when counting objects. Learn the 20 most common classifiers with the rules, examples, and practice you need.",
  },
  {
    slug: "korean-drama-vocabulary-advanced",
    lang: "en",
    beforePrefix: "kdrama vocabulary — ",
    after:
      "Level up with 60 advanced Korean words used in popular K-dramas, organised by genre, each with the context and example sentences you need to use them.",
  },
  {
    slug: "korean-easier-than-japanese-chinese",
    lang: "en",
    beforePrefix: "korean vs japanese — ",
    after:
      "An honest comparison of Korean, Japanese and Chinese: why Korean is the most accessible for Arabic and English speakers, and where it still gets hard.",
  },
  {
    slug: "korean-family-terms-relationships-guide",
    lang: "en",
    beforePrefix: "korean family words — ",
    after:
      "Korean family vocabulary with pronunciation, usage and cultural context, including why Korean uses different words depending on who is speaking.",
  },
  {
    slug: "korean-for-arabic-speakers-difficulty-guide",
    lang: "en",
    beforePrefix: "korean for arabic speakers — ",
    after:
      "An honest analysis of learning Korean as an Arabic speaker: what is genuinely easy, what is hard, and how long each stage really takes.",
  },
  {
    slug: "korean-job-interview-phrases",
    lang: "en",
    beforePrefix: "korean job interview — ",
    after:
      "Preparing for a job interview in Korean? Essential interview vocabulary, the questions you will be asked, and professional phrases that land well.",
  },
  {
    slug: "korean-numbers-guide",
    lang: "en",
    beforePrefix: "korean numbers — ",
    after:
      "Master both Korean number systems, Sino-Korean and Native Korean: when to use each one, the counting rules, and the words that go with them.",
  },
  {
    slug: "korean-songs-to-learn-korean-2026",
    lang: "en",
    beforePrefix: "korean songs to learn korean — ",
    after:
      "Ten Korean songs chosen for language learning: clear pronunciation, everyday vocabulary, and lyrics simple enough to follow from the first listen.",
  },
  {
    // The only one of the 23 that does not also end in an ellipsis — its
    // sentence is already complete, so this edit is the prefix removal alone.
    slug: "korean-traditional-holidays-chuseok-seollal",
    lang: "en",
    beforePrefix: "chuseok — ",
    after:
      "Explore Korea's two most important traditional holidays. Learn the traditions, foods, and Korean words every learner should know.",
  },
  {
    slug: "korean-verb-conjugation-guide",
    lang: "en",
    beforePrefix: "korean verbs — ",
    after:
      "Korean verb conjugation does not have to be scary. This guide breaks down present, past and future tenses with simple rules and plenty of examples.",
  },
  {
    slug: "learn-korean-3-months-study-method",
    lang: "en",
    beforePrefix: "learn korean fast — ",
    after:
      "A practical, science-backed method to reach conversational Korean in 90 days. No apps and no gimmicks, just the structured approach that works.",
  },
  {
    slug: "learn-korean-through-kpop-bts-blackpink",
    lang: "en",
    beforePrefix: "learn korean through kpop — ",
    after:
      "Millions of K-Pop fans are learning Korean by accident. Here is how to turn that into real progress, with specific songs and a method to follow.",
  },
  {
    slug: "seoul-travel-korean-phrases",
    lang: "en",
    beforePrefix: "seoul travel guide — ",
    after:
      "Planning a trip to Seoul? The Korean phrases you need for transport, food, shopping, hotels and emergencies, with pronunciation for every one.",
  },
  {
    slug: "study-korean-kdramas-method",
    lang: "en",
    beforePrefix: "learn korean with kdramas — ",
    after:
      "Learn Korean through K-dramas with a proven study method: active watching techniques, vocabulary mining, and the best shows for each level.",
  },
  {
    slug: "topik-1-vocabulary-list-800-words",
    lang: "en",
    beforePrefix: "topik vocabulary — ",
    after:
      "A complete TOPIK I vocabulary guide: the 800 essential Korean words tested on the beginner exam, grouped by theme and with pronunciation.",
  },

  // ── Arabic ───────────────────────────────────────────────────────────
  // All three open with a bare English word before the Arabic even starts — the
  // same defect the Seollal and Dokkaebi TITLES had, in the column underneath.
  // Rewritten as Arabic sentences rather than translated fragments; each was
  // read as Arabic, not checked as a translation.
  {
    slug: "dokkaebi-korean-goblin-myth-kdrama-ar",
    lang: "ar",
    beforePrefix: "dokkaebi — ",
    after:
      "الدليل الكامل لعفريت الدوكايبي الكوري: أصوله وقدراته ورمزيته وتقاليد الحنطة السوداء، وكيف جعله مسلسل ٢٠١٦ أيقونة في الثقافة الشعبية.",
    reason:
      "Opens with the bare English word 'dokkaebi' and ends mid-phrase. The old text also called the 2016 drama 'عفريت عام 2016' ('goblin of the year 2016'), which reads as a description of the creature rather than the name of a series. 'تقاليد الحنطة السوداء' is kept: 邱邱 lore really does involve buckwheat offerings, so it is correct, not a mistranslation.",
    confidence: "high",
  },
  {
    slug: "seollal-korean-lunar-new-year-guide-2026-ar",
    lang: "ar",
    beforePrefix: "seollal — ",
    after:
      "الدليل الكامل لعيد سولال، رأس السنة القمرية الكورية: التواريخ والطقوس والهانبوك والتوكغوك وانحناءة السيباي، وكيف تشارك في احتفالات ٢٠٢٦.",
    reason:
      "Opens with the bare English word 'seollal'. The old text also said 'العام القمري الكوري الجديد' ('the new Korean lunar year'), which is not how the holiday is named in Arabic — 'رأس السنة القمرية' is. Transliteration of 떡국 tightened from 'التيتوكغوك' to 'التوكغوك'.",
    confidence: "high",
  },
  {
    slug: "what-is-jeong-korean-untranslatable-concept-ar",
    lang: "ar",
    beforePrefix: "jeong — ",
    after:
      "ما هو جيونغ؟ الشعور الكوري العميق بالارتباط الذي لا تترجمه كلمة واحدة، ولماذا يشكّل الدراما الكورية، وكيف تتعرّف عليه وتبنيه في حياتك اليومية.",
    reason:
      "Opens with the bare English word 'jeong'. The old text read 'المشاعر الكورية غير القابلة للترجمة للارتباط' — three stacked لـ prepositions that no Arabic speaker would write — and ended 'وبناءه', a case error. Rewritten as a question, which the site's other Arabic pages already use.",
    confidence: "high",
  },
];

/** Nothing here may reintroduce the defect it exists to remove. */
export function validateEdits(edits) {
  const seen = new Set();
  for (const e of edits) {
    if (seen.has(e.slug)) throw new Error(`descriptions.mjs: duplicate edit for ${e.slug}`);
    seen.add(e.slug);

    const n = Array.from(e.after).length;
    if (n > 160) {
      throw new Error(`descriptions.mjs: ${e.slug} is ${n} chars, over the 160 limit`);
    }
    if (n < 70) {
      throw new Error(`descriptions.mjs: ${e.slug} is ${n} chars, too short to be useful`);
    }
    if (/\.\.\.$|…$/.test(e.after.trim())) {
      throw new Error(`descriptions.mjs: ${e.slug} still ends in an ellipsis`);
    }
    if (/^[a-z0-9][^—]{0,40} — /.test(e.after)) {
      throw new Error(`descriptions.mjs: ${e.slug} still opens with a stuffed keyword prefix`);
    }
    if (!e.beforePrefix || !e.beforePrefix.endsWith(" — ")) {
      throw new Error(`descriptions.mjs: ${e.slug} has no usable beforePrefix`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
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
    if (!current.startsWith(e.beforePrefix)) {
      // Someone has already rewritten this one. Leave it alone and say so.
      skipped.push(
        `${e.slug}: live description no longer starts with "${e.beforePrefix}" — not overwriting`
      );
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
    console.log("Nothing to propose — every description in this batch has already been changed.");
    process.exit(0);
  }

  const { batchId, jsonPath, mdPath, proposal } = await writeProposal(
    {
      source: "scripts/proposals/descriptions.mjs",
      description:
        `Gate 2 Step 5 batch 1 — repair ${edits.length} meta descriptions that open with a ` +
        `stuffed lowercase keyword prefix. 20 of them also ended mid-sentence in an ellipsis, ` +
        `so both defects are fixed in one edit rather than touching those rows twice. Measured ` +
        `before this batch: 62 of 200 published articles had a defective description (59 ` +
        `ellipsis, 23 stuffed prefix, overlapping by 20). Replacements are hand-written, ` +
        `129-150 characters, complete sentences. The 3 Arabic ones opened with a bare English ` +
        `word and were rewritten as Arabic rather than repaired as translations. description ` +
        `column only; title, slug, keywords and content untouched. The remaining 39 ` +
        `ellipsis-only descriptions are a later batch.`,
      edits,
    },
    store
  );

  console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log(`Nothing has been written to the database.`);
}

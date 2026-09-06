#!/usr/bin/env node
/**
 * titles-batch4.mjs - repair 10 Arabic titles.
 *
 * The description work is done (75 defective -> 0). Reading those rows turned
 * up the same damage one column over, and the title matters more: it is the
 * blue link in the search result, the h1 that scripts/prerender-meta.mjs
 * writes into the prerendered body, and the strongest on-page ranking signal
 * the article has.
 *
 * Four defects, ten rows:
 *
 *   CUT OFF MID-WORD at exactly 60 characters. Something upstream truncated
 *   these to a 60-char limit without ellipsis, so they simply stop:
 *     "...لتعلم الكورية أسرع (بتش"      <- "(بتشتغل فعلاً)" lost its tail
 *     "...أفضل تطبيقات التعلم الكورية مقا"  <- "مقارنة" cut after two letters
 *     "...اللغة العامية للرسائل النصية الكوري"  <- "الكورية" lost its ة
 *     "...شاهد واتعلم كوري"              <- same
 *
 *   STUFFED PREFIX, then the title repeats itself:
 *     "تعلم كوري أسرع — 10 طرق مثبتة علمياً لتعلم الكورية أسرع"
 *     "تطبيقات تعلم كوري — أفضل تطبيقات تعلم الكورية 2026"
 *     "الرسائل النصية الكورية — اللغة العامية للرسائل النصية..."
 *
 *   DOUBLED COLON, from a prefix bolted onto a title that already had one:
 *     "اختبار توبيك: TOPIK: دليل شامل..."
 *     "سفر كوريا: سيول: دليل العبارات..."
 *
 *   TRANSLATION ARTEFACT:
 *     "وأوضح جوميهو: ..."  <- an English title ending in "Explained" became a
 *                             stranded Arabic verb at the FRONT of the title.
 *     "...(المعاهد الخاصة) بالشرح"  <- the same "Explained", stranded at the end.
 *     "دليل جسيمات الكورية (조사)"  <- 조사, grammatical particles, given the
 *                                    physics term for subatomic particles,
 *                                    in the h1 of a grammar guide.
 *
 * The two app-comparison articles are a near-duplicate pair, so their new
 * titles are deliberately kept distinct rather than both becoming the obvious
 * "أفضل تطبيقات تعلم الكورية 2026". Which of the pair should survive at all is
 * a separate decision, not this batch's.
 *
 * HARD CONSTRAINT: `title` only. Never slug - these articles keep their URLs,
 * so nothing here needs a redirect and no internal link changes.
 *
 * Precondition is an exact match on the live title. These are ten short
 * strings copied verbatim from the database, and an exact match is the
 * cleanest statement of "this row still has the defect I saw".
 */
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";

export const EDITS = [
  {
    slug: "how-to-learn-korean-faster-ar",
    lang: "ar",
    before: "تعلم كوري أسرع — 10 طرق مثبتة علمياً لتعلم الكورية أسرع (بتش",
    after: "10 طرق مثبتة علميًا لتعلّم الكورية أسرع",
  },
  {
    slug: "korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar",
    lang: "ar",
    before: "تطبيقات تعلم اللغة الكورية — أفضل تطبيقات التعلم الكورية مقا",
    after: "مقارنة تطبيقات تعلم الكورية 2026: 12 معيارًا",
  },
  {
    slug: "korean-learning-apps-comparison-2026-ar",
    lang: "ar",
    before: "تطبيقات تعلم كوري — أفضل تطبيقات تعلم الكورية 2026",
    after: "أفضل تطبيقات تعلم الكورية 2026",
  },
  {
    slug: "korean-texting-slang-internet-2026-ar",
    lang: "ar",
    before: "الرسائل النصية الكورية — اللغة العامية للرسائل النصية الكوري",
    after: "عامية الرسائل النصية الكورية واختصارات الإنترنت 2026",
  },
  {
    slug: "gumiho-nine-tailed-fox-korean-folklore-ar",
    lang: "ar",
    before: "وأوضح جوميهو: الثعلب ذو الذيول التسعة في الفولكلور الكوري",
    after: "الغوميهو: الثعلب ذو الذيول التسعة في الفولكلور الكوري",
  },
  {
    slug: "ar-topik-exam-guide",
    lang: "ar",
    before: "اختبار توبيك: TOPIK: دليل شامل لاجتياز الاختبار",
    after: "اختبار TOPIK: دليل شامل لاجتياز الاختبار",
  },
  {
    slug: "ar-seoul-travel-korean-phrases",
    lang: "ar",
    before: "سفر كوريا: سيول: دليل العبارات الكورية للمسافرين",
    after: "سيول: دليل العبارات الكورية للمسافرين",
  },
  {
    slug: "korean-grammar-particles-ar",
    lang: "ar",
    before: "دليل جسيمات الكورية (조사): أتقنها وافتح أسرار قواعد الكورية",
    after: "أدوات الجملة الكورية (조사): دليل شامل للمبتدئين",
  },
  {
    slug: "best-kdrama-learn-korean-difficulty-ranked-ar",
    lang: "ar",
    before: "أفضل 15 دراما كورية مرتبة حسب صعوبة التعلم: شاهد واتعلم كوري",
    after: "أفضل 15 دراما كورية مرتبة حسب صعوبة التعلم",
  },
  {
    slug: "korean-education-system-hagwon-culture-ar",
    lang: "ar",
    before: "نظام التعليم الكوري وثقافة الهاغوون (المعاهد الخاصة) بالشرح",
    after: "نظام التعليم الكوري وثقافة الهاغوون (المعاهد الخاصة)",
  },
];

export function validateEdits(edits) {
  const seenSlug = new Set();
  const seenTitle = new Set();
  for (const e of edits) {
    if (seenSlug.has(e.slug)) throw new Error(`titles-batch4: duplicate edit for ${e.slug}`);
    seenSlug.add(e.slug);

    // Two near-duplicate articles must not end up with the same title.
    if (seenTitle.has(e.after)) throw new Error(`titles-batch4: two rows would share the title "${e.after}"`);
    seenTitle.add(e.after);

    const n = Array.from(e.after).length;
    if (n > 60) throw new Error(`titles-batch4: ${e.slug} is ${n} chars, over the 60 limit Google shows`);
    if (n < 20) throw new Error(`titles-batch4: ${e.slug} is ${n} chars, too short`);
    if (/ — /.test(e.after)) throw new Error(`titles-batch4: ${e.slug} still has a dash-separated prefix`);
    if (/:.*:/.test(e.after)) throw new Error(`titles-batch4: ${e.slug} still has a doubled colon`);
    if (/^(و|أو)/.test(e.after)) throw new Error(`titles-batch4: ${e.slug} still opens with a stranded conjunction`);
    if (/(\.\.\.|…)\s*$/.test(e.after)) throw new Error(`titles-batch4: ${e.slug} ends in an ellipsis`);
    if (e.after.includes("جسيمات")) throw new Error(`titles-batch4: ${e.slug} still calls 조사 subatomic particles`);
    if (e.after === e.before) throw new Error(`titles-batch4: ${e.slug} is unchanged`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateEdits(EDITS);
  const store = createReadOnlyStore();
  const edits = [];
  const skipped = [];
  for (const e of EDITS) {
    const live = await store.readRow(e.slug);
    if (!live) { skipped.push(`${e.slug}: no such published row`); continue; }
    const current = live.title || "";
    if (current === e.after) { skipped.push(`${e.slug}: already has this exact title`); continue; }
    if (current !== e.before) {
      skipped.push(`${e.slug}: live title is not the one this batch recorded - not overwriting`);
      continue;
    }
    edits.push({ slug: e.slug, lang: e.lang, column: "title", before: current, after: e.after });
  }
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} of ${EDITS.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
    console.log("");
  }
  if (edits.length === 0) {
    console.log("Nothing to propose - every title in this batch has already been repaired.");
    process.exit(0);
  }
  const { batchId, jsonPath, mdPath, proposal } = await writeProposal({
    source: "scripts/proposals/titles-batch4.mjs",
    description: `Repair ${edits.length} Arabic titles. Four were cut off mid-word at exactly 60 characters, three opened with a stuffed keyword prefix and then repeated themselves, two had a doubled colon from a prefix bolted onto a title that already had one, and three carry machine-translation artefacts - including "وأوضح" (the verb "explained") stranded at the front of a title, and 조사 rendered as "جسيمات", the physics term for subatomic particles, in the h1 of a grammar guide. Replacements are hand-written, 30-52 characters, and checked against each other so the two near-duplicate app-comparison articles do not end up sharing a title. title column only; slug, description, keywords and content untouched, so no redirects are needed.`,
    edits,
  }, store);
  console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log(`Nothing has been written to the database.`);
}

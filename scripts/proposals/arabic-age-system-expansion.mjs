#!/usr/bin/env node
/**
 * arabic-age-system-expansion.mjs — bring the Arabic half of the Korean age
 * article up to the depth of its English twin.
 *
 * ONE ROW, ONE COLUMN. `korean-age-system-explained-ar`, `content`.
 *
 * THE EVIDENCE
 *
 * Search Console flagged this pair on 2026-10-04 as "a page recently got more
 * impressions than usual" and named the English URL:
 *
 *   https://kloversegy.com/blog/korean-age-system-explained
 *
 * Measured against the live rows the same day:
 *
 *                       English twin            Arabic twin
 *   words               1124                    302      (27%)
 *   H2 / H3             10 / 8                  6 / 3
 *   tables              3                       1
 *   FAQ section         yes                     NO
 *   FAQPage JSON-LD     emitted                 not emitted
 *   internal links      1                       0
 *   external sources    2                       0
 *   worked examples     yes (4 rows, 3 ages)   no
 *   reference year      2026                    2025 — stale
 *
 * The Arabic row is what an Arabic-speaking searcher lands on, and Arabic
 * speakers are this site's primary market. The gap is not stylistic: the
 * English page ships an FAQPage block that Google can act on and the Arabic
 * one ships none, so the Arabic URL forfeits every rich result its twin is
 * eligible for while ranking on the same subject.
 *
 * THE STALE YEAR IS A FACTUAL DEFECT, NOT A STYLE CHOICE
 *
 * The live Arabic body says "اليوم 2025", "مارس 2025" and "وُلدت في مارس 2000 →
 * اليوم 2025 = 25 سنة". Today is 2026. Every worked figure on the page is a
 * year out, on a page about how to count years.
 *
 * WHAT THIS BATCH DOES
 *
 * Replaces `content` with an Arabic body that mirrors the English twin's
 * structure: the quick answer, the three systems, the formula, why the system
 * exists, a worked-examples table (one person, three ages, on 1 October 2026),
 * the social meaning of age, an age-vocabulary table, the 2023 reform, how to
 * say your age, a real FAQ section, sources, and the life-stages table the
 * Arabic page already had (kept — it is genuinely Arabic-specific value the
 * English page does not carry).
 *
 * Three deliberate decisions, each stated so they can be rejected:
 *
 *   1. THE BODY NO LONGER OPENS WITH `#`. The live Arabic body starts with an
 *      H1 that duplicates the page title the template already renders (the
 *      prerendered HTML demotes it to an <h2>; react-markdown does not, so the
 *      browser ends up with two H1s). The English twin's body starts at `##`.
 *      This batch aligns the Arabic with the English. The heading's words are
 *      not lost — the page title still reads نظام العمر الكوري: كيف يحسب الكوريون.
 *
 *   2. 살 IS TRANSLITERATED سال, CONSISTENTLY. The live body writes 몇 살이에요 as
 *      «ميوت سارييو؟» in one place; 살 is /sal/. The new body uses سال
 *      everywhere, including in the age phrases, so one page does not spell one
 *      word two ways. The Korean script sits beside every transliteration.
 *
 *   3. THE FAQ HEADING IS «## الأسئلة الشائعة». That exact spelling is required
 *      by scripts/lib/faq-parser.mjs — the module shared by prerender-meta.mjs
 *      and BlogPostPage.tsx — for the section to become FAQPage JSON-LD. A
 *      different heading would leave the page exactly as schema-less as it is
 *      today. This batch calls that parser and fails if it extracts fewer than
 *      four pairs.
 *
 * WHAT IT DOES NOT TOUCH
 *
 * `slug` (so the URL does not move, no redirect, no internal link breaks),
 * `title`, `description` (already accurate and already carrying the searched
 * terms), `keywords`, `hero_*`, `published`, `lang`. Column `content` only.
 *
 * The `before` value is not a hand-typed literal — it is
 * `fixtures/korean-age-system-explained-ar.before.md`, copied byte-for-byte
 * out of the live row, and `main` refuses to write a proposal unless the live
 * row still matches it exactly. A 1.8K-character Arabic body typed into a JS
 * string is a transcription error waiting to happen; a fixture is the same
 * bytes the database holds.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";
import { extractFaqEntries } from "../lib/faq-parser.mjs";

export const SLUG = "korean-age-system-explained-ar";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Fixtures are read, not retyped; CRLF normalised so a Windows checkout cannot drift. */
function fixture(name) {
  return readFileSync(join(HERE, "fixtures", name), "utf8").replace(/\r\n/g, "\n");
}

const BEFORE = fixture("korean-age-system-explained-ar.before.md");
const AFTER = fixture("korean-age-system-explained-ar.after.md");

/**
 * Every internal target this batch may link to. Each was fetched on 2026-10-04
 * and returned 200. The legacy `ar-` prefixed Arabic slugs are deliberately
 * absent: they 308 to the `-ar` form, and an article should link to the URL a
 * reader ends up on, not to the redirect on the way there.
 */
export const ALLOWED_INTERNAL_LINKS = [
  "/ar/placement-test",
  "/ar/courses",
  "/blog/korean-numbers-guide-ar",
  "/blog/korean-speech-levels-honorifics-guide-ar",
  "/blog/korean-family-terms-relationships-guide-ar",
];

/** The same two sources the English twin cites. Both returned 200 on 2026-10-04. */
export const REQUIRED_EXTERNAL_LINKS = [
  "https://www.korea.net/NewsFocus/policies/view?articleId=234677",
  "https://www.korea.kr/news/policyNewsView.do?newsId=156577051",
];

/** The English twin's section spine, which the Arabic body now mirrors. */
const REQUIRED_HEADINGS = [
  "## لماذا يبدو عمر الكوريين أكبر مما تتوقع؟",
  "## الأنظمة الثلاثة للعمر في كوريا",
  "## كيف تحسب عمرك الكوري؟",
  "## أمثلة عملية: شخص واحد وثلاثة أعمار",
  "## العمر في العلاقات الاجتماعية الكورية",
  "## التحديث 2023: قرار تاريخي",
  "## كيف تتحدث عن عمرك بالكورية",
  "## أسئلة شائعة",
  "## المصادر وقراءات إضافية",
  "## كلمات العمر والمراحل",
];

const words = (s) => s.replace(/[#*_>`|\[\]()]/g, " ").split(/\s+/).filter(Boolean).length;
const markdownLinks = (s) => [...s.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);

export const EDITS = [
  {
    slug: SLUG,
    lang: "ar",
    column: "content",
    before: BEFORE,
    after: AFTER,
    reason:
      "The Arabic row is 27% of its English twin (302 words against 1124) and lacks the three things the twin gets its impressions from: a worked-examples table, an FAQ section, and internal links. Google flagged the English URL on 2026-10-04 for gaining impressions; the Arabic URL is what the site's primary Arabic-speaking market lands on, and it emits no FAQPage JSON-LD at all because it has no FAQ section. The live body is also a year stale — it says اليوم 2025 and computes ages against 2025 — on a page about counting years. This replaces content with an Arabic body mirroring the English structure, keeps the Arabic-specific life-stages table, fixes the year to 2026, adds four FAQ pairs in the heading form scripts/lib/faq-parser.mjs recognises, adds five verified internal links, and cites the same two official sources the English row cites. slug, title, description, keywords, hero fields and published are untouched.",
    confidence: "high",
  },
];

export function validateEdits(edits) {
  if (edits.length !== 1) throw new Error(`age-system-ar: expected exactly 1 edit, got ${edits.length}`);

  const e = edits[0];
  if (e.slug !== SLUG) throw new Error(`age-system-ar: unexpected slug ${e.slug}`);
  if (e.lang !== "ar") throw new Error("age-system-ar: not lang=ar");
  if (e.column !== "content") throw new Error(`age-system-ar: touches ${e.column}; this batch is content only`);
  if (e.after === e.before) throw new Error("age-system-ar: content is unchanged");

  const beforeWords = words(e.before);
  const afterWords = words(e.after);
  if (afterWords < 850) throw new Error(`age-system-ar: body is ${afterWords} words, under the 850 floor`);
  if (afterWords < beforeWords * 2.5) {
    throw new Error(
      `age-system-ar: body is only ${(afterWords / beforeWords).toFixed(2)}x the live body (${beforeWords} -> ${afterWords}); the point of the batch is parity with the English twin's 1124`
    );
  }

  // The FAQ is the reason this batch exists: without it the page stays schema-less.
  const faq = extractFaqEntries(e.after);
  if (faq.length < 4) {
    throw new Error(
      `age-system-ar: faq-parser extracted ${faq.length} pairs, expected 4 — the FAQ heading must be «## الأسئلة الشائعة» with «###» questions`
    );
  }
  for (const qa of faq) {
    if (!qa.question || !qa.answer) throw new Error("age-system-ar: FAQ entry with an empty question or answer");
  }

  for (const h of REQUIRED_HEADINGS) {
    if (!e.after.includes(h)) throw new Error(`age-system-ar: missing section ${JSON.stringify(h)}`);
  }

  // No H1 in the body: the page title is the H1 (see decision 1 in the header).
  if (/^#\s/m.test(e.after)) throw new Error("age-system-ar: body contains an H1 — the page title already is one");

  // Three tables: worked examples, age vocabulary, life stages.
  const tables = (e.after.match(/^\|/gm) || []).length;
  if (tables < 12) throw new Error(`age-system-ar: only ${tables} table rows, expected the three tables`);

  const links = markdownLinks(e.after);
  const internal = links.filter((h) => h.startsWith("/"));
  const external = links.filter((h) => /^https?:\/\//.test(h));

  for (const href of internal) {
    if (!ALLOWED_INTERNAL_LINKS.includes(href)) {
      throw new Error(`age-system-ar: internal link ${href} is not in the verified allowlist`);
    }
  }
  if (internal.length < 4) throw new Error(`age-system-ar: only ${internal.length} internal links, expected at least 4`);
  for (const required of REQUIRED_EXTERNAL_LINKS) {
    if (!external.includes(required)) throw new Error(`age-system-ar: missing source ${required}`);
  }

  // The defect this batch fixes: figures computed against 2025 on a 2026 page.
  // 2025 is still legitimate as a birth date in the worked table, so the check
  // is on the phrases that state "today", not on the bare year.
  for (const stale of ["اليوم 2025", "مارس 2025", "اليوم: 2025", "السنة الحالية 2025"]) {
    if (e.after.includes(stale)) throw new Error(`age-system-ar: still carries the stale figure ${JSON.stringify(stale)}`);
  }
  if (!e.after.includes("2026 − 2000 + 1")) throw new Error("age-system-ar: the formula example no longer computes 2026");
  if (!e.after.includes("1 أكتوبر 2026")) throw new Error("age-system-ar: the worked table lost its reference date");

  for (const term of ["만 나이", "연 나이", "한국 나이", "살"]) {
    if (!e.after.includes(term)) throw new Error(`age-system-ar: missing the Korean term ${term}`);
  }

  // It must be Arabic prose, not an English draft with Arabic headings. Links
  // and URLs are stripped first, since those are legitimately Latin.
  const prose = e.after.replace(/\[[^\]]*\]\([^)]*\)/g, " ").replace(/https?:\/\/\S+/g, " ");
  const arabic = (prose.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (prose.match(/[A-Za-z]/g) || []).length;
  if (arabic < latin * 4) {
    throw new Error(`age-system-ar: prose is not predominantly Arabic (${arabic} Arabic letters vs ${latin} Latin)`);
  }
  if (/[A-Za-z]{25,}/.test(prose)) {
    throw new Error("age-system-ar: a long Latin run survived — looks like untranslated text");
  }
}

/**
 * Direct-run guard, in a form that works on Windows as well as Linux.
 *
 * The other scripts in this directory compare `import.meta.url` to
 * `` `file://${process.argv[1]}` ``, which is false on Windows — argv[1] is
 * `D:\...` while import.meta.url is `file:///D:/...` — so the script silently
 * does nothing there and exits 0. Comparing resolved paths instead works on
 * both, which matters because the machine this repo is developed on is Windows.
 */
const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  try {
    return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  validateEdits(EDITS);

  const store = createReadOnlyStore();
  const live = await store.readRow(SLUG);
  if (!live) throw new Error(`age-system-ar: no published row for ${SLUG}`);

  // Exact-match precondition, as every other batch in this directory uses: if
  // the live body is not the body this batch recorded, do not write a proposal
  // at all rather than writing one that would be flagged stale later.
  if (live.content === EDITS[0].after) {
    console.log("Nothing to propose — content already has the new value.");
    process.exit(0);
  }
  if (live.content !== EDITS[0].before) {
    console.error("age-system-ar: live content is not the value this batch recorded — not overwriting.");
    console.error(`  expected bytes: ${EDITS[0].before.length}`);
    console.error(`  live bytes:     ${live.content.length}`);
    process.exit(1);
  }

  const { batchId, jsonPath, mdPath, proposal } = await writeProposal(
    {
      source: "scripts/proposals/arabic-age-system-expansion.mjs",
      description:
        "Replace the content of korean-age-system-explained-ar with an Arabic body at parity with its English twin. Search Console flagged the English URL (korean-age-system-explained) on 2026-10-04 for gaining impressions; the Arabic row is 302 words against the English row's 1124, has no FAQ section (so it emits no FAQPage JSON-LD while the English row does), no worked-examples table, no internal links and no sources, and its worked figures are a year stale (اليوم 2025 on a 2026 page). The new body mirrors the English section spine — quick answer, three systems, formula, why it exists, worked table on 1 October 2026, social meaning, age vocabulary, the 2023 reform, how to say your age, FAQ, sources — keeps the Arabic-specific life-stages table, adds five internal links all verified 200 on 2026-10-04, cites the same two official sources as the English row, and drops the duplicate H1 the body used to open with (the page title already is the H1, and the English body starts at H2). The FAQ heading is «## الأسئلة الشائعة» because that exact spelling is what scripts/lib/faq-parser.mjs — shared by prerender-meta.mjs and BlogPostPage.tsx — requires for the section to become FAQPage JSON-LD; the validation calls that parser and refuses to propose fewer than four extracted pairs. 살 is transliterated سال consistently, where the live body wrote سار in one place. slug, title, description, keywords, hero fields, lang and published are untouched, so the URL does not move and no redirect or internal link changes.",
      edits: EDITS.map(({ slug, lang, column, before, after, reason, confidence }) => ({
        slug,
        lang,
        column,
        before,
        after,
        reason,
        confidence,
      })),
    },
    store
  );

  console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log("Nothing has been written to the database.");
}

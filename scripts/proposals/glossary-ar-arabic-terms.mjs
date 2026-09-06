#!/usr/bin/env node
/**
 * glossary-ar-arabic-terms.mjs — put the searcher's own words in the title of
 * one Arabic article.
 *
 * ONE ROW. `korean-idol-fandom-glossary-ar`, `title` and `description`.
 *
 * THE EVIDENCE (Search Console, 3 months to 2026-09-06)
 *
 *   380 impressions, average position 7.94, ZERO clicks. It is the site's
 *   highest-impression Arabic page, and the only high-impression page with a
 *   0% click-through rate. Its English twin — `korean-idol-fandom-glossary` —
 *   takes 5.71% CTR from a WORSE average position, 12.03.
 *
 *   Position 7.94 with no clicks is not a ranking problem and it is not small-
 *   sample noise: at that position a 380-impression page should take somewhere
 *   around 15-25 clicks. Zero is a snippet problem.
 *
 *   The queries are written in Arabic script, and name the terms in Arabic:
 *
 *     «معنى كلمة بايس في الكيبوب»    position 6.20
 *     «معنى بايس»                     position 8.56
 *     «ما معنى البايس في الكيبوب»     position 7.12
 *     «ما معنى ماكني في الكيبوب»      position 9.38
 *
 *   The live title spells those same terms in LATIN script:
 *
 *     معجم مصطلحات معجبي الكيبوب: Bias و Maknae و Comeback وأكثر
 *
 *   So not one of the searcher's own words appears in the title for Google to
 *   embolden, and an Arabic reader scanning an Arabic result page sees a run
 *   of Latin text where the answer to their question should be.
 *
 * WHY THIS IS A ONE-ROW BATCH
 *
 * All 100 published Arabic rows were checked. Six have Latin characters in the
 * title; four of those are `TOPIK`, which is correct — Arabic speakers really
 * do search the exam by its Latin name. This row is the only genuine instance
 * of the defect, so the batch is one row rather than seventy-nine.
 *
 * THE SPELLING CHOICE, DELIBERATE
 *
 * Searchers type «ماكني». The article body uses «ماكناي». The new title uses
 * the spelling people actually search; the description carries both, as
 * «وماكني (ماكناي)», so the page still reads as correct to someone who knows
 * the term and is not silently "corrected" away from the body copy.
 *
 * HARD CONSTRAINT: `title` and `description` only. The slug is untouched, so
 * the URL does not move, no redirect is needed, and no internal link changes.
 * The body content is untouched — this batch changes what the search result
 * says, not what the article says.
 */
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";

export const SLUG = "korean-idol-fandom-glossary-ar";

export const EDITS = [
  {
    slug: SLUG,
    lang: "ar",
    column: "title",
    before: "معجم مصطلحات معجبي الكيبوب: Bias و Maknae و Comeback وأكثر",
    after: "معنى بايس وماكني وكامباك — قاموس مصطلحات الكيبوب",
    reason:
      "Ranks 7.94 for Arabic-script queries about these exact terms and takes 0 clicks from 380 impressions. The live title spells بايس/ماكني/كامباك in Latin, so none of the query words can be bolded in the result and an Arabic reader sees Latin noise. Leads with معنى, the word the queries themselves lead with.",
    confidence: "high",
  },
  {
    slug: SLUG,
    lang: "ar",
    column: "description",
    before:
      "افهم مصطلحات عالم معجبي الكيبوب بهذا المعجم الشامل — بايس وماكناي وكامباك وستان وأكثر — مشروحة ببساطة مع الكلمات الكورية الحقيقية وراءها.",
    after:
      "ما معنى بايس وماكني (ماكناي) وكامباك وستان؟ شرح مبسّط لأشهر مصطلحات معجبي الكيبوب بالعربي، مع الكلمات الكورية الأصلية وراء كل مصطلح.",
    reason:
      "Opens with the question form the queries use («ما معنى…؟») instead of an imperative, and carries both spellings of ماكني so the snippet matches the search while staying correct against the article body.",
    confidence: "high",
  },
];

/**
 * The title is what this batch exists to fix, so the checks are about the
 * defect rather than about generic length hygiene.
 *
 * The 60-character ceiling is the one titles-batch4 used: prerender-meta.mjs
 * appends " | Klovers" (10 more) before the title reaches a search result, so
 * a 60-char title renders at 70 and is already past where Google truncates.
 */
export function validateEdits(edits) {
  const seen = new Set();
  for (const e of edits) {
    const key = `${e.slug}.${e.column}`;
    if (seen.has(key)) throw new Error(`glossary-ar: duplicate edit for ${key}`);
    seen.add(key);

    if (e.slug !== SLUG) throw new Error(`glossary-ar: unexpected slug ${e.slug} — this batch is one row`);
    if (e.lang !== "ar") throw new Error(`glossary-ar: ${key} is not lang=ar`);
    if (e.after === e.before) throw new Error(`glossary-ar: ${key} is unchanged`);

    if (e.column === "title") {
      const n = Array.from(e.after).length;
      if (n > 60) throw new Error(`glossary-ar: title is ${n} chars, over the 60 limit`);
      if (n < 20) throw new Error(`glossary-ar: title is ${n} chars, too short`);
      // The entire point of the batch: no Latin script left in the title.
      if (/[A-Za-z]/.test(e.after)) {
        throw new Error(`glossary-ar: title still contains Latin characters — that is the defect`);
      }
      // The three terms the queries actually ask about, in the spelling they
      // are actually typed in.
      for (const term of ["بايس", "ماكني", "كامباك"]) {
        if (!e.after.includes(term)) throw new Error(`glossary-ar: title is missing the searched term ${term}`);
      }
    }

    if (e.column === "description") {
      const n = Array.from(e.after).length;
      if (n > 160) throw new Error(`glossary-ar: description is ${n} chars, over 160`);
      if (n < 110) throw new Error(`glossary-ar: description is ${n} chars, too short to fill the snippet`);
      // Both spellings, so the snippet matches the query without contradicting
      // the article body.
      for (const term of ["ماكني", "ماكناي"]) {
        if (!e.after.includes(term)) throw new Error(`glossary-ar: description is missing ${term}`);
      }
    }

    if (!["title", "description"].includes(e.column)) {
      throw new Error(`glossary-ar: ${key} touches ${e.column}; this batch is title and description only`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateEdits(EDITS);

  const store = createReadOnlyStore();
  const live = await store.readRow(SLUG);
  if (!live) throw new Error(`glossary-ar: no published row for ${SLUG}`);

  // Same precondition titles-batch4 uses: an exact match on the live value is
  // the cleanest statement of "this row still has the defect I saw". Anything
  // else and the batch does not get written at all, rather than being written
  // and flagged stale for someone to notice later.
  for (const e of EDITS) {
    if (live[e.column] === e.after) {
      console.log(`Nothing to propose — ${e.column} already has the new value.`);
      process.exit(0);
    }
    if (live[e.column] !== e.before) {
      console.error(`glossary-ar: live ${e.column} is not the value this batch recorded — not overwriting.`);
      console.error(`  expected: ${JSON.stringify(e.before)}`);
      console.error(`  live:     ${JSON.stringify(live[e.column])}`);
      process.exit(1);
    }
  }

  const { batchId, jsonPath, mdPath, proposal } = await writeProposal(
    {
      source: "scripts/proposals/glossary-ar-arabic-terms.mjs",
      description:
        "Rewrite the title and description of korean-idol-fandom-glossary-ar so they are written in the script its searchers actually use. The page takes 380 impressions at average position 7.94 and ZERO clicks — its English twin takes 5.71% CTR from a worse position (12.03) — while ranking for Arabic-script queries («معنى كلمة بايس في الكيبوب», «معنى بايس», «ما معنى البايس في الكيبوب», «ما معنى ماكني في الكيبوب») against a title that spells those same terms in Latin as Bias, Maknae and Comeback. No query word can be bolded in the result and an Arabic reader sees Latin text where the answer should be. The new title leads with معنى and names the three searched terms in Arabic; the new description opens in the question form the queries use and carries both spellings of ماكني/ماكناي so the snippet matches the search while staying consistent with the article body. One row, two columns. slug, keywords and content untouched, so the URL does not move and no redirect is needed. All 100 published Arabic rows were checked: six have Latin in the title and four of those are TOPIK, which is correct — this is the only genuine instance.",
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
  console.log(`Nothing has been written to the database.`);
}

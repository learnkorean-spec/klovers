#!/usr/bin/env node
/**
 * internal-links.mjs - Gate 2 Step 2: give the blog the internal link graph
 * it has never had.
 *
 * Measured against production on 2026-09-02: of 200 published articles, the
 * number containing a markdown link to another article is ZERO. Not low -
 * zero. Every article is an island, so no article passes authority to any
 * other, and the 13 articles that have never been viewed have no path by
 * which anyone could arrive.
 *
 * This script only PACKAGES the change. The selection logic lives in
 * scripts/lib/related-links.mjs and is unit-tested there without a network;
 * the write itself happens later, through the same reviewed
 * propose -> plan -> apply pipeline every other content change uses. Running
 * this file writes two files into content-edits/proposals/ and touches
 * nothing else. No database write happens here.
 *
 * Re-running is safe and produces no churn: an article whose block is already
 * exactly correct yields no edit at all, so a second run on an unchanged
 * catalogue emits an empty proposal.
 *
 * Usage: node scripts/proposals/internal-links.mjs [--per-article N]
 * Needs SUPABASE_URL and SUPABASE_ANON_KEY. The anon key is not a secret - it
 * ships in every visitor's JS bundle, and reading published posts is all this
 * script does with it.
 */
import { createClient } from "@supabase/supabase-js";
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";
import { buildRelatedMap, withRelatedBlock } from "../lib/related-links.mjs";
import { RETIRED_SLUGS } from "../lib/retired-arabic-slugs.mjs";

const argOf = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const PER_ARTICLE = argOf("--per-article", 4);

/** An article's language, by the same rule the sitemap and prerender use:
 * the `lang` column when set, otherwise the slug's own -ar / ar- convention.
 * Both conventions are live in this catalogue (see retired-arabic-slugs.mjs)
 * and getting this wrong would link Arabic readers into English articles. */
const langOf = (row) =>
  row.lang === "ar" || /-ar$/.test(row.slug) || /^ar-/.test(row.slug) ? "ar" : "en";

async function listPublished() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY are not set");

  const client = createClient(url, key);
  const rows = [];
  const PAGE = 200;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from("blog_posts")
      .select("slug,title,keywords,content,lang")
      .eq("published", true)
      .order("slug", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`listPublished: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

const rows = await listPublished();
if (rows.length === 0) {
  throw new Error("listPublished returned 0 rows - refusing to propose against an empty read");
}

const articles = rows.map((r) => ({
  slug: r.slug,
  lang: langOf(r),
  title: r.title,
  keywords: r.keywords || [],
}));
const titleOf = new Map(articles.map((a) => [a.slug, a.title]));
const contentOf = new Map(rows.map((r) => [r.slug, r.content || ""]));
const langMap = new Map(articles.map((a) => [a.slug, a.lang]));

const related = buildRelatedMap(articles, { perArticle: PER_ARTICLE, retired: RETIRED_SLUGS });

const edits = [];
let unchanged = 0;
let noNeighbours = 0;
for (const [slug, targets] of related) {
  if (targets.length === 0) {
    noNeighbours++;
    continue;
  }
  const before = contentOf.get(slug);
  const after = withRelatedBlock(
    before,
    langMap.get(slug),
    targets.map((t) => ({ slug: t, title: titleOf.get(t) }))
  );
  if (after === null) {
    unchanged++;
    continue;
  }
  edits.push({ slug, lang: langMap.get(slug), column: "content", before, after });
}

if (edits.length === 0) {
  console.log("Nothing to propose - every article already carries the correct block.");
  process.exit(0);
}

const inbound = new Map();
for (const [, targets] of related) {
  for (const t of targets) inbound.set(t, (inbound.get(t) || 0) + 1);
}
const orphans = articles.filter((a) => !RETIRED_SLUGS.has(a.slug) && !inbound.has(a.slug));

const store = createReadOnlyStore();
const { batchId, jsonPath, mdPath, proposal } = await writeProposal(
  {
    source: "scripts/proposals/internal-links.mjs",
    description:
      `Gate 2 Step 2 - add a "Related articles" block to ${edits.length} published articles. ` +
      `Measured before this batch: 0 of 200 articles linked to any other article. Links are ` +
      `same-language only, never point at a retired slug, are chosen by IDF-weighted keyword ` +
      `and slug-token overlap (so a shared ubiquitous word like "korean" cannot by itself make ` +
      `two articles related), and are wrapped in HTML-comment markers so a later run replaces ` +
      `the block rather than appending a second one. content column only; title, slug and ` +
      `keywords are untouched.`,
    edits,
  },
  store
);

console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
console.log(`  articles read:               ${rows.length}`);
console.log(`  already correct:             ${unchanged}`);
console.log(`  no qualifying links:         ${noNeighbours}`);
console.log(`  still without inbound links: ${orphans.length}`);
console.log(`  ${jsonPath}`);
console.log(`  ${mdPath}`);
console.log(`Nothing has been written to the database.`);

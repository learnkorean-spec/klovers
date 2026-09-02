#!/usr/bin/env node
/**
 * keyword-focus.mjs - Gate 2 Step 4: stop the articles competing with each
 * other for the same search query.
 *
 * Measured against production on 2026-09-02, across 200 published articles:
 *
 *   learn korean grammar     13 articles
 *   korean for beginners     10
 *   learn korean              9
 *   korean culture            8
 *
 * Thirteen pages all telling a search engine "this page is about learning
 * Korean grammar" do not add up to one strong page; they add up to thirteen
 * weak ones, and the engine picks somebody else's site to rank instead.
 *
 * This script only PACKAGES the change. The ownership rule lives in
 * scripts/lib/keyword-ownership.mjs and is unit-tested there without a
 * network. Running this file writes two files into content-edits/proposals/
 * and touches nothing else. No database write happens here.
 *
 * Column: `keywords` only. Titles, slugs and article bodies are untouched, so
 * this batch and the internal-links batch edit different columns and cannot
 * make each other stale.
 *
 * Usage: node scripts/proposals/keyword-focus.mjs [--contested-at N]
 * Needs SUPABASE_URL and SUPABASE_ANON_KEY (the anon key is public - it ships
 * in every visitor's JS bundle, and reading published posts is all it does).
 */
import { createClient } from "@supabase/supabase-js";
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";
import { planKeywordOwnership, CONTESTED_AT } from "../lib/keyword-ownership.mjs";
import { RETIRED_SLUGS } from "../lib/retired-arabic-slugs.mjs";

const argOf = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const CONTESTED = argOf("--contested-at", CONTESTED_AT);

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
      .select("slug,keywords,lang,view_count,content")
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

const articles = rows
  .filter((r) => !RETIRED_SLUGS.has(r.slug))
  .map((r) => ({
    slug: r.slug,
    lang: langOf(r),
    keywords: r.keywords || [],
    views: r.view_count || 0,
    length: (r.content || "").length,
  }));

const before = new Map(articles.map((a) => [a.slug, a.keywords]));
const langOfSlug = new Map(articles.map((a) => [a.slug, a.lang]));
const { changes, decisions, keptMinimum } = planKeywordOwnership(articles, {
  contestedAt: CONTESTED,
});

const edits = [...changes.entries()]
  .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  .map(([slug, after]) => ({
    slug,
    lang: langOfSlug.get(slug),
    column: "keywords",
    before: before.get(slug),
    after,
  }));

if (edits.length === 0) {
  console.log(`No keyword is claimed by more than ${CONTESTED} articles. Nothing to propose.`);
  process.exit(0);
}

const store = createReadOnlyStore();
const { batchId, jsonPath, mdPath, proposal } = await writeProposal(
  {
    source: "scripts/proposals/keyword-focus.mjs",
    description:
      `Gate 2 Step 4 - resolve keyword cannibalisation across ${edits.length} articles. ` +
      `${decisions.length} keyword(s) were each claimed by more than ${CONTESTED} articles; ` +
      `each is now owned by one article (most views, then longest, then first slug ` +
      `alphabetically) and removed from the rest. Arabic morphological variants of one phrase ` +
      `are treated as one claim. No article is left with an empty keyword list: ` +
      `${keptMinimum.length} article(s) whose every keyword belongs to someone else are ` +
      `deliberately left UNCHANGED and listed in the run log for a human to give a more ` +
      `specific keyword - a script cannot invent one. keywords column only.`,
    edits,
  },
  store
);

console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
console.log(`\nContested keywords and their new owners:`);
for (const d of decisions) {
  console.log(
    `  ${String(d.claimedBy).padStart(3)} articles  [${d.lang}] ${d.keyword}  ->  ${d.owner}`
  );
}
if (keptMinimum.length) {
  console.log(`\nLeft unchanged - every keyword they claim is owned elsewhere.`);
  console.log(`These need a person to choose a more specific keyword:`);
  for (const slug of keptMinimum) console.log(`  ${slug}`);
}
console.log(`\n  ${jsonPath}`);
console.log(`  ${mdPath}`);
console.log(`Nothing has been written to the database.`);

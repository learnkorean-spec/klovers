#!/usr/bin/env node
/**
 * check-supabase-errors — block new Supabase calls that ignore `error`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Four production defects in this codebase share one shape: a query fails, an
 * `error` nobody destructured, a `data` that is therefore null, and a guard
 * that skips the block. The UI shows an empty state. It reads as "no data yet"
 * and it is really "broken", and it survives for months because nothing
 * anywhere ever says so.
 *
 *   useLeaderboard.ts:119   select('...xp_amount...')     — no such column.
 *                           The "This Week" tab never rendered a single row.
 *   CommunityFeed.tsx:41    profiles!inner(full_name)     — no such column
 *                           (profiles has `name`). Failed on every call.
 *   xp_leaderboard          security_invoker + own-row RLS → 1 row, no error.
 *                           Every student saw a plausible board of herself.
 *   achievement_milestones  update() on rows nothing inserts → 0 rows, no error.
 *
 * This does not catch all four. The view and the milestones table are logic
 * bugs, not swallowed errors. It catches the swallow — the part that turns a
 * bug into a SILENT bug. A wrong column name is a typo; a wrong column name
 * that looks like "no data yet" for five months is a missing `error` check.
 *
 * HOW IT WORKS
 * ------------
 * It is a ratchet, not a cleanup. `src/` currently has a large number of these
 * (see the baseline), and fixing them all at once would be an unreviewable
 * diff touching most of the app. So the baseline records how many exist per
 * file today, and CI fails only when a file gains MORE than it had. Existing
 * ones can be paid down file by file; the count only ever goes down.
 *
 *   node scripts/check-supabase-errors.mjs            # check (CI)
 *   node scripts/check-supabase-errors.mjs --update   # re-record the baseline
 *
 * Lowering a file's count is always safe — rerun with --update and commit.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const BASELINE = join(ROOT, "scripts", "supabase-errors-baseline.json");
const UPDATE = process.argv.includes("--update");

/**
 * Escape hatch for a call that genuinely cannot fail meaningfully, or where the
 * error is handled somewhere the regex cannot see. Put it on the same line and
 * say WHY — an unexplained marker is the swallow this script exists to stop.
 *
 *   const { data } = await supabase.rpc('x'); // supabase-error-check-ignore: reason
 */
const ALLOW = "supabase-error-check-ignore";

/** Walk src/, skipping tests — a test may stub a client on purpose. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === "__tests__") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(entry) && !/\.(test|spec)\.tsx?$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

/** Index of the `}` matching the `{` at `open`, or -1. */
function matchBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/**
 * Destructuring assignments from an awaited Supabase call that bind `data`
 * but never bind `error`. Balanced-brace scan, so `{ data: { session } }`
 * is read correctly rather than truncated at the first `}`.
 */
function findViolations(text) {
  const hits = [];
  const declRe = /\b(?:const|let|var)\s*\{/g;
  let m;
  while ((m = declRe.exec(text)) !== null) {
    const open = text.indexOf("{", m.index);
    const close = matchBrace(text, open);
    if (close === -1) continue;

    const pattern = text.slice(open, close + 1);
    const after = text.slice(close + 1, close + 12);
    if (!/^\s*=\s*await\b/.test(after)) continue;

    // The statement: from `= await` to the first `;` at depth 0-ish.
    const stmtEnd = text.indexOf(";", close);
    const stmt = text.slice(close, stmtEnd === -1 ? close + 500 : stmtEnd);

    if (!/\bsupabase\b/.test(stmt)) continue;
    if (!/\bdata\b/.test(pattern)) continue;
    if (/\berror\b/.test(pattern)) continue;

    const lineNo = text.slice(0, open).split("\n").length;
    // The marker may sit on the declaration line or anywhere in the statement.
    if ((pattern + stmt).includes(ALLOW)) continue;
    if ((text.split("\n")[lineNo - 1] ?? "").includes(ALLOW)) continue;

    hits.push(lineNo);
  }
  return hits;
}

const counts = {};
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).split("\\").join("/");
  const hits = findViolations(readFileSync(file, "utf8"));
  if (hits.length) counts[rel] = hits.length;
}

if (UPDATE) {
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(BASELINE, JSON.stringify(sorted, null, 2) + "\n");
  const total = Object.values(sorted).reduce((a, b) => a + b, 0);
  console.log(`Baseline written: ${Object.keys(sorted).length} files, ${total} unchecked-error calls.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error("No baseline. Run: node scripts/check-supabase-errors.mjs --update");
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
const regressions = [];
for (const [file, count] of Object.entries(counts)) {
  const allowed = baseline[file] ?? 0;
  if (count > allowed) regressions.push({ file, count, allowed });
}

if (regressions.length) {
  console.error("\n✖ New Supabase calls that ignore `error`:\n");
  for (const { file, count, allowed } of regressions) {
    console.error(`  ${file}  ${allowed} allowed, ${count} found  (+${count - allowed})`);
  }
  console.error(`
Destructure \`error\` and act on it:

    const { data, error } = await supabase.from('t').select('...');
    if (error) throw error;          // or log it — but never ignore it

Reading only \`data\` turns a rejected request into an empty list, which renders
as "no data yet" and hides the failure. That is exactly how the weekly
leaderboard tab and the community feed stayed broken for months.

If you genuinely fixed some and the count should drop, rerun with --update.
If a call truly cannot fail meaningfully, add a trailing
// supabase-error-check-ignore: <reason> — with the reason, not bare.
`);
  process.exit(1);
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);
const budget = Object.values(baseline).reduce((a, b) => a + b, 0);
console.log(`✓ No new unchecked Supabase errors (${total} known, budget ${budget}).`);

const paid = Object.entries(baseline).filter(([f, n]) => (counts[f] ?? 0) < n);
if (paid.length) {
  console.log(`  ${paid.length} file(s) improved — rerun with --update to lock it in.`);
}

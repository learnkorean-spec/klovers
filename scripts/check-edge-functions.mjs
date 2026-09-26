#!/usr/bin/env node
/**
 * check-edge-functions — typecheck every edge function, and fail on NEW breakage.
 *
 * WHY THIS EXISTS
 * ---------------
 * `supabase/functions/` is deployed by .github/workflows/deploy-functions.yml,
 * which runs `supabase functions deploy` on every push to main. So the repo is
 * not a proposal for the live functions - it IS the next version of them, and it
 * lands whether or not anyone looks at it.
 *
 * That makes a type error in an edge function different in kind from a type
 * error in the app. Vite does not typecheck at build time (ci.yml says so, and
 * leaves `tsc --noEmit` advisory with continue-on-error), so src/ has ~10
 * files with known type errors that have been shipping for months. An edge
 * function is Deno: it fails to *run* on a type error, and `deno deploy` has
 * no typecheck step of its own. Nothing between the editor and production was
 * ever looking.
 *
 * HOW IT WORKS
 * ------------
 * It is a ratchet, not a cleanup - the same shape as
 * scripts/check-supabase-errors.mjs, for the same reason. 16 of the 69
 * functions fail `deno check` today; fixing them all in one commit would be an
 * unreviewable diff across most of the backend. So the baseline records which
 * functions are known broken, and this fails only when a function that used to
 * pass stops passing. The set only ever shrinks.
 *
 *   node scripts/check-edge-functions.mjs            # check (CI)
 *   node scripts/check-edge-functions.mjs --update   # re-record the baseline
 *   node scripts/check-edge-functions.mjs send-trial-attendance-letters
 *
 * Lowering the set is always safe - rerun with --update and commit.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");
const BASELINE = join(ROOT, "scripts", "edge-functions-baseline.json");
const UPDATE = process.argv.includes("--update");
// Positional args are function names: argv[0]/argv[1] are node and this file.
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/** Every function is its own directory with an index.ts - the shape `supabase deploy` requires. */
function functionFiles() {
  if (!existsSync(FUNCTIONS_DIR)) return [];
  const out = [];
  for (const entry of readdirSync(FUNCTIONS_DIR)) {
    // _shared is imported by the others, never deployed on its own.
    if (entry === "_shared" || entry.startsWith(".")) continue;
    const dir = join(FUNCTIONS_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    const index = join(dir, "index.ts");
    if (existsSync(index)) out.push({ name: entry, file: index });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * `deno check` typechecks the module graph, so this pulls and typechecks the
 * function's real remote imports too - not just its own syntax.
 *
 * --node-modules-dir=auto is what lets the npm: specifiers (supabase-js)
 * resolve; without it every function fails on dependency resolution and the
 * whole gate is noise.
 */
function checkOne({ name, file }) {
  // No `shell: true` - the arguments are all internally generated paths, and
  // shell mode both warns (DEP0190) and needlessly widens what a path could do.
  const res = spawnSync("deno", ["check", "--node-modules-dir=auto", relative(ROOT, file)], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (res.error) return { name, passed: false, detail: `could not run deno: ${res.error.message}` };
  if (res.status === 0) return { name, passed: true, detail: "" };

  // Deno writes the type error to stderr. Keep the first meaningful line - the
  // full graph output is several hundred lines per function and unreadable in
  // a CI summary.
  const detail = `${res.stderr || ""}${res.stdout || ""}`
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^(TS\d+|error:|Download|Initialize)/.test(l))
    .slice(0, 3)
    .join(" | ");
  return { name, passed: false, detail: detail || `deno check exited ${res.status}` };
}

const targets = only.length ? functionFiles().filter((f) => only.includes(f.name)) : functionFiles();

if (!targets.length) {
  console.error(
    only.length
      ? `No such function: ${only.join(", ")}`
      : `No edge functions found under ${relative(ROOT, FUNCTIONS_DIR)}`,
  );
  process.exit(1);
}

if (!UPDATE) {
  const probe = spawnSync("deno", ["--version"], { cwd: ROOT, encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    console.error(
      "`deno` is not on PATH. This gate needs it:\n" +
        "  winget install DenoLand.Deno                  # Windows\n" +
        "  curl -fsSL https://deno.land/install.sh | sh   # macOS/Linux",
    );
    process.exit(1);
  }
}

const results = targets.map(checkOne);
const failing = results.filter((r) => !r.passed).map((r) => r.name);

if (UPDATE) {
  // Record the full known-broken set, not just what was checked: checking a
  // single function is for a tight loop and must not silently drop the other 15
  // from the baseline.
  const known = existsSync(BASELINE)
    ? new Set(Object.keys(JSON.parse(readFileSync(BASELINE, "utf8"))))
    : new Set();
  for (const name of failing) known.add(name);

  const all = [...known].sort((a, b) => a.localeCompare(b));
  writeFileSync(BASELINE, JSON.stringify(Object.fromEntries(all.map((n) => [n, 1])), null, 2) + "\n");
  console.log(`Baseline written: ${all.length} known-failing function(s) of ${functionFiles().length}.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error("No baseline. Run: node scripts/check-edge-functions.mjs --update");
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));

// A function that used to pass and now does not. The reverse - someone fixing
// one - is reported so the baseline can be re-recorded, but never fails.
const regressions = failing.filter((name) => !(name in baseline));

if (regressions.length) {
  console.error(`\n✖ ${regressions.length} edge function(s) no longer typecheck:\n`);
  for (const r of results.filter((x) => regressions.includes(x.name))) {
    console.error(`  ${r.name}`);
    if (r.detail) console.error(`      ${r.detail}`);
  }
  console.error(`
These deploy to production. \`supabase functions deploy\` runs on every push to
main and has no typecheck of its own, so this is the last gate before the code
goes live.

    deno check --node-modules-dir=auto supabase/functions/<fn-name>/index.ts

If you fixed some failures, re-record with --update (the set only shrinks).
`);
  process.exit(1);
}

if (only.length) {
  // Scoped run: only the named functions were checked, so a "no new errors"
  // verdict covers those and nothing else. Saying so is the whole point - a
  // one-function run that reads like a full sweep is a false all-clear.
  console.log(
    `✓ ${targets.length} function(s) checked, ${failing.filter((n) => n in baseline).length} known-failing.`,
  );
} else {
  const improved = Object.keys(baseline).filter((n) => !failing.includes(n));
  console.log(
    `✓ No new edge-function type errors (${failing.length} known of ${functionFiles().length} checked).`,
  );
  if (improved.length) {
    console.log(`  ${improved.length} function(s) now pass — rerun with --update to lock it in.`);
  }
}

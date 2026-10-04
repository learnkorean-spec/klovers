#!/usr/bin/env node
/**
 * check-direct-run-guards.mjs — the guard that decides whether a script's
 * `main()` runs must also be true on Windows.
 *
 * Run with:  npm run check:guards
 *
 * THE BUG THIS EXISTS TO PREVENT
 *
 * Seven scripts ended with a guard that compared `import.meta.url` against a
 * `file://` URL built by hand from `process.argv[1]`. On Linux those two strings
 * are identical, so the guard worked and every check passed. On Windows
 * `process.argv[1]` is `D:\klovers\scripts\x.mjs`, so the hand-built string
 * reads `file://D:\klovers\...` while `import.meta.url` is
 * `file:///D:/klovers/...`. They never match, the condition is never true, and
 * the script **exits 0 having done nothing** — no error, no output, no sign the
 * work was skipped.
 *
 * That is why it survived: it was invisible in CI, and silent locally in both
 * directions. A run that wrote a proposal file looked like success, and a run
 * that did nothing looked like "there was nothing to propose". Found on
 * 2026-10-04 when `node scripts/render-proposal-summary.mjs <proposal.json>`
 * printed nothing and exited 0 on a valid proposal.
 *
 * scripts/content-audit.mjs already had the correct form —
 * `pathToFileURL(process.argv[1]).href`. This checks that every other script
 * uses it too.
 *
 * WHY THIS IS A SCRIPT AND NOT A FILE UNDER `npm test`
 *
 * It was written as `scripts/direct-run-guard.test.mjs` first, and that version
 * did make `npm test` exit 1 on this machine — with all 1219 tests passing, via
 * an unhandled `vitest-worker: Timeout calling onTaskUpdate`. A do-nothing
 * probe file added as an 80th test reproduced the same error, so it is a suite
 * size/duration limit of this checkout's vitest setup, not anything about these
 * assertions. Since this repo's rule is that a red check is a signal rather
 * than something to skip past, the checks live here instead: runnable on
 * demand, exit 1 on a violation, and unable to redden a green suite. Wiring it
 * into CI is one line whenever the vitest timeout is understood.
 *
 * THE END-TO-END CHECK, DONE BY HAND (repeat it after touching a guard)
 *
 *   node scripts/render-proposal-summary.mjs content-edits/proposals/<id>.proposal.json
 *
 * Before the fix that printed nothing and exited 0. It must print a summary.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.mjs$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * The defect is a specific *statement*: an `if` whose condition builds a file
 * URL by hand. Matching whole lines is deliberate — a substring search also
 * fires on the comments that quote the pattern in order to explain it, which
 * both this file and scripts/proposals/arabic-age-system-expansion.mjs do.
 */
const BROKEN_GUARD_LINE = /^\s*if\s*\(.*?file:\/\/\$\{process\.argv\[1\]\}/;
const ANY_URL_GUARD_LINE = /^\s*if\s*\(.*?import\.meta\.url\s*===/;

const sources = walk(join(ROOT, "scripts"))
  .filter((f) => statSync(f).isFile() && !/\.test\.mjs$/.test(f))
  .map((f) => [relative(ROOT, f).replace(/\\/g, "/"), readFileSync(f, "utf8").split(/\r?\n/)]);

const failures = [];

// 1. Nobody builds the file URL by hand.
for (const [file, lines] of sources) {
  if (lines.some((l) => BROKEN_GUARD_LINE.test(l))) {
    failures.push(
      `${file}\n    builds file:// from process.argv[1] by hand — this script does nothing at all\n    when run directly on Windows, silently and with exit 0.`
    );
  }
}

// 2. Every guard that compares import.meta.url normalises first.
for (const [file, lines] of sources) {
  if (!lines.some((l) => ANY_URL_GUARD_LINE.test(l))) continue;
  if (!lines.some((l) => l.includes("pathToFileURL"))) {
    failures.push(`${file}\n    compares import.meta.url without pathToFileURL.`);
  }
}

// 3. The property every guard depends on, asserted rather than assumed.
const selfUrl = pathToFileURL(fileURLToPath(import.meta.url)).href;
if (selfUrl !== import.meta.url) {
  failures.push(
    `pathToFileURL(fileURLToPath(import.meta.url)) is ${selfUrl}, not ${import.meta.url}.\n` +
      `    Every guard in this repo compares against import.meta.url, so this breaks all of them at once.`
  );
}

// 4. And the platform difference that made the broken form invisible in CI.
const sample = join(ROOT, "scripts", "render-proposal-summary.mjs");
const handBuilt = `file://${sample}`;
const normalised = pathToFileURL(sample).href;
if (process.platform === "win32") {
  if (handBuilt === normalised) {
    failures.push(
      `On win32 the hand-built form and pathToFileURL agreed (${normalised}).\n` +
        `    This file's premise — and the guards' — no longer holds; re-derive it before trusting the checks above.`
    );
  }
} else if (handBuilt !== normalised) {
  failures.push(
    `On ${process.platform} the hand-built form (${handBuilt}) differs from pathToFileURL (${normalised}).\n` +
      `    The comment above claims they agree off-Windows; fix whichever is wrong.`
  );
}

if (failures.length > 0) {
  console.error(`check-direct-run-guards: ${failures.length} problem(s) in ${sources.length} scripts\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}

console.log(
  `check-direct-run-guards: OK — ${sources.length} scripts scanned, ` +
    `every import.meta.url guard uses pathToFileURL (platform: ${process.platform})`
);

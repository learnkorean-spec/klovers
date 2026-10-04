/**
 * direct-run-guard.test.mjs — the guard that decides whether a script's
 * `main()` runs must also be true on Windows.
 *
 * The pattern this file exists to prevent, sitting at the end of a script:
 *
 *   compare `import.meta.url` against a hand-built `file://` URL made from
 *   `process.argv[1]`
 *
 * On Windows `process.argv[1]` is `D:\klovers\scripts\x.mjs`, so the hand-built
 * string reads `file://D:\klovers\...` while `import.meta.url` is
 * `file:///D:/klovers/...`. They never match, the condition is never true, and
 * the script **exits 0 having done nothing at all** — no error, no output, no
 * sign the work was skipped.
 *
 * Seven scripts shipped that way, including every proposal script. It survived
 * because the failure is silent in both directions: a run that writes a
 * proposal file looks like success, and a run that does nothing looks like
 * "there was nothing to propose". It was found on 2026-10-04 when
 * `node scripts/render-proposal-summary.mjs <proposal.json>` printed nothing
 * and exited 0 on a valid proposal.
 *
 * scripts/content-audit.mjs already had the correct form
 * (`pathToFileURL(process.argv[1]).href`). The checks below pin that form, and
 * finish by running a real script to prove the guard is actually reached.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, writeFileSync, rmSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
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

/** Every non-test .mjs under scripts/, read as lines. Prose is not scanned. */
const scripts = new Map(
  walk(join(ROOT, "scripts"))
    .filter((f) => statSync(f).isFile() && !/\.test\.mjs$/.test(f))
    .map((f) => {
      const rel = relative(ROOT, f).replace(/\\/g, "/");
      return [rel, readFileSync(f, "utf8").split(/\r?\n/)];
    })
);

/**
 * The defect is a specific *statement*, always an `if` whose condition builds a
 * file URL by hand. Matching whole lines this way is deliberate: a plain
 * substring search also fires on comments that quote the pattern to explain it,
 * which is exactly what this file and
 * scripts/proposals/arabic-age-system-expansion.mjs both do.
 */
const BROKEN_GUARD_LINE = /^\s*if\s*\(.*?file:\/\/\$\{process\.argv\[1\]\}/;
const ANY_URL_GUARD_LINE = /^\s*if\s*\(.*?import\.meta\.url\s*===/;

const offendersMatching = (re) =>
  [...scripts].filter(([, lines]) => lines.some((l) => re.test(l))).map(([file]) => file);

describe("direct-run guards work on the platform this repo is developed on", () => {
  it("no script builds a file:// URL by hand to compare against import.meta.url", () => {
    const broken = offendersMatching(BROKEN_GUARD_LINE);

    expect(
      broken,
      `these scripts do nothing at all when run directly on Windows, silently and with exit 0:\n  ${broken.join("\n  ")}`
    ).toEqual([]);
  });

  it("every guard comparing import.meta.url normalises through pathToFileURL", () => {
    const offenders = [...scripts]
      .filter(([, lines]) => lines.some((l) => ANY_URL_GUARD_LINE.test(l)))
      .filter(([, lines]) => !lines.some((l) => l.includes("pathToFileURL")))
      .map(([file]) => file);

    expect(offenders, `guard compares import.meta.url without pathToFileURL:\n  ${offenders.join("\n  ")}`).toEqual([]);
  });

  it("pathToFileURL reproduces import.meta.url exactly — the property every guard relies on", () => {
    // If this ever stops holding (a different specifier form, a symlinked
    // checkout, a drive-relative path), every guard in the repo breaks at once
    // and silently. Assert the assumption itself, not only its call sites.
    expect(pathToFileURL(fileURLToPath(import.meta.url)).href).toBe(import.meta.url);
  });

  it(
    "a guarded script actually runs when invoked directly (the bug itself)",
    async (ctx) => {
      // render-proposal-summary.mjs is read-only and takes a path, so a
      // throwaway proposal built here keeps this independent of what is
      // committed. Async execFile, not execFileSync: blocking the worker for
      // the length of a node startup trips vitest's own task-update timeout
      // under full-suite load.
      const probe = join(tmpdir(), `guard-probe-${process.pid}.json`);
      writeFileSync(
        probe,
        JSON.stringify({
          batchId: "guard-probe",
          createdAt: new Date(0).toISOString(),
          source: "scripts/direct-run-guard.test.mjs",
          description: "probe",
          editCount: 0,
          staleCount: 0,
          edits: [],
        }),
        "utf8"
      );

      try {
        let stdout = "";
        try {
          ({ stdout } = await execFileAsync(process.execPath, ["scripts/render-proposal-summary.mjs", probe], {
            cwd: ROOT,
            encoding: "utf8",
          }));
        } catch (err) {
          // A confined sandbox can refuse to pipe a grandchild's stdio (EPERM).
          // That is an environment restriction, not this regression.
          if (err.code === "EPERM") return ctx.skip();
          throw err;
        }

        expect(stdout.trim().length, "the script exited 0 and printed nothing — the guard never fired").toBeGreaterThan(0);
        expect(stdout).toContain("guard-probe");
      } finally {
        rmSync(probe, { force: true });
      }
    },
    30000
  );
});

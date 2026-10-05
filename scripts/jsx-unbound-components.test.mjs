import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

/**
 * Every component used in JSX must actually be bound in that file.
 *
 * Why this exists: on 1 Oct 2026 `<Volume2 />` was added to the admin tab bar
 * without adding Volume2 to the lucide-react import. Nothing caught it —
 * Vite does not typecheck at build time, `tsc --noEmit` is advisory here and
 * already red on other files, and no test rendered that tab bar. It reached
 * production and threw "Volume2 is not defined" on EVERY admin tab, because
 * the crash is in the tab list that all of them share. Re found it four days
 * later by opening the dashboard.
 *
 * A missing import is a ReferenceError at render, not a build error, so the
 * only cheap guard is a scan. This is deliberately a text scan and not a type
 * check: it has to stay green while `tsc --noEmit` is red.
 */

const ROOT = join(import.meta.dirname, "..");

/**
 * JSX opens after whitespace or an expression-starting character. A TypeScript
 * generic is glued to an identifier (`useState<Phase>`), so requiring that
 * leading character is what keeps generics out of the results.
 */
const JSX_OPEN =
  /(?:^|[\s(\{\[=,?:>&|])<([A-Z][A-Za-z0-9_$]*)(?:\.[A-Za-z0-9_$]+)*(?=[\s/>])/g;

function boundNames(code) {
  const bound = new Set();
  const add = (n) => { if (n) bound.add(n.trim()); };

  // import { a, b as c } from "x"   — including `import React, { ... }`
  for (const m of code.matchAll(/import\s[^;]*?\{([^}]*)\}\s*from/g))
    for (const part of m[1].split(",")) add(part.split(/\s+as\s+/).pop());

  // import X from "x"   ·   import X, { ... } from "x"
  for (const m of code.matchAll(/import\s+([A-Za-z0-9_$]+)\s*(?:,|from)/g)) add(m[1]);

  // import * as X from "x"
  for (const m of code.matchAll(/import\s+\*\s+as\s+([A-Za-z0-9_$]+)/g)) add(m[1]);

  // const X = ... · function X · class X · lazy(() => ...) assigned to const
  for (const m of code.matchAll(/\b(?:const|let|var|function|class)\s+([A-Z][A-Za-z0-9_$]*)/g))
    add(m[1]);

  // Destructured and renamed locals: { Icon }, { icon: Icon }, ({ Icon }) =>
  for (const m of code.matchAll(/[{,]\s*(?:[A-Za-z0-9_$]+\s*:\s*)?([A-Z][A-Za-z0-9_$]*)\s*[,}=]/g))
    add(m[1]);

  // Function parameters, including typed ones: (Icon: LucideIcon)
  for (const m of code.matchAll(/[(,]\s*([A-Z][A-Za-z0-9_$]*)\s*[,):]/g)) add(m[1]);

  return bound;
}

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("JSX components are bound", () => {
  const files = execSync("git ls-files 'src/**/*.tsx'", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

  it("finds .tsx files to scan", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("every <Component> in src/**/*.tsx resolves to an import or a local name", () => {
    const offenders = [];
    for (const rel of files) {
      const code = stripComments(readFileSync(join(ROOT, rel), "utf8"));
      const bound = boundNames(code);
      const missing = [...new Set([...code.matchAll(JSX_OPEN)].map((m) => m[1]))]
        .filter((name) => !bound.has(name));
      if (missing.length) offenders.push(`${rel}: ${missing.join(", ")}`);
    }
    expect(offenders, `Used in JSX but never imported or declared:\n${offenders.join("\n")}`)
      .toEqual([]);
  });
});

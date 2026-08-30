/**
 * Temporary diagnostic — NOT a shipped script. Runs Lighthouse against the
 * three article pages that measured CLS > 0.1 in PR #140 and prints the
 * actual shifting DOM nodes (Lighthouse's own `cumulative-layout-shift`
 * audit `details.items`), not just the aggregate score. Deleted before this
 * branch's PR is opened.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileAsync = promisify(execFile);
const SITE = process.argv[2] || process.env.SITE || "https://kloversegy.com";

const TARGETS = [
  { label: "Long EN article", path: "/blog/how-to-learn-korean-faster" },
  {
    label: "Long AR article (RTL)",
    path: "/blog/korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar",
  },
  { label: "Short-wave article", path: "/blog/korean-weather-small-talk-phrases" },
];

async function runLighthouse(url, outPath) {
  await execFileAsync(
    "npx",
    [
      "--yes",
      "lighthouse@12",
      url,
      "--output=json",
      `--output-path=${outPath}`,
      "--only-categories=performance",
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      "--quiet",
    ],
    { maxBuffer: 1024 * 1024 * 64 }
  );
}

async function main() {
  const tmpDir = mkdtempSync(join(tmpdir(), "cls-diagnose-"));
  for (const target of TARGETS) {
    const url = `${SITE}${target.path}`;
    const outPath = join(tmpDir, `${target.label.replace(/[^a-z0-9]+/gi, "-")}.json`);
    console.log(`\n===== ${target.label} (${url}) =====`);
    try {
      await runLighthouse(url, outPath);
      const lhr = JSON.parse(readFileSync(outPath, "utf-8"));
      const clsAudit = lhr.audits?.["cumulative-layout-shift"];
      console.log(`CLS score: ${clsAudit?.numericValue}`);
      const items = clsAudit?.details?.items ?? [];
      if (items.length === 0) {
        console.log("No layout-shift culprit items reported.");
      } else {
        for (const item of items) {
          console.log(JSON.stringify(item, null, 2));
        }
      }
      // Also dump the layout-shift-elements audit if present (separate
      // diagnostic audit some Lighthouse versions expose with node details).
      const lse = lhr.audits?.["layout-shift-elements"];
      if (lse?.details?.items?.length) {
        console.log("--- layout-shift-elements audit ---");
        for (const item of lse.details.items) {
          console.log(JSON.stringify(item, null, 2));
        }
      }
    } catch (err) {
      console.error(`FAILED for ${url}: ${err.message}`);
    }
  }
}

main();

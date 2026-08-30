/**
 * Temporary diagnostic — NOT a shipped script. Deleted before this branch's
 * PR is opened. v2: the first pass showed `cumulative-layout-shift`'s
 * `details.items` doesn't contain per-node culprits in Lighthouse 12 (just
 * a debug summary) - this version dumps every audit whose id/description
 * mentions layout shift or images, in full, so the real culprit data shows
 * up wherever Lighthouse actually put it.
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
    const outPath = join(tmpDir, `out.json`);
    console.log(`\n===== ${target.label} (${url}) =====`);
    await runLighthouse(url, outPath);
    const lhr = JSON.parse(readFileSync(outPath, "utf-8"));

    const relevantIds = Object.keys(lhr.audits).filter((id) =>
      /shift|layout-shift|unsized|image|cls|dimensions/i.test(id)
    );
    console.log("Relevant audit ids found:", relevantIds);

    for (const id of relevantIds) {
      const audit = lhr.audits[id];
      console.log(`\n--- audit: ${id} ---`);
      console.log(`score: ${audit.score}, scoreDisplayMode: ${audit.scoreDisplayMode}`);
      console.log(`title: ${audit.title}`);
      if (audit.details) {
        console.log("details:", JSON.stringify(audit.details, null, 2).slice(0, 6000));
      } else {
        console.log("(no details object)");
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

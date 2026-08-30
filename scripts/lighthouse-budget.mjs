/**
 * lighthouse-budget.mjs — Core Web Vitals, measured, not assumed.
 *
 * This has been open since the August diagnosis and nothing has ever
 * measured it: we did not know whether the site was fast or slow, and every
 * SEO fix so far has optimised markup and indexability, not the one signal
 * Google weights directly (Core Web Vitals). This script runs real
 * Lighthouse audits against production and reports the numbers - it does
 * not propose or apply any fix. See docs/DECISIONS.md for what happens once
 * a baseline exists.
 *
 * Five representative pages, chosen to cover the shapes that differ:
 *   - the homepage (marketing, not blog)
 *   - /blog (the index page, ~189 links in one document)
 *   - one long English article (how-to-learn-korean-faster, 10.3k chars -
 *     the second-longest EN article and, unlike the single longest, not
 *     duplicated in content/topic by the AR pick below)
 *   - one long Arabic article, RTL rendering specifically
 *     (korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar - the
 *     ONLY Arabic article over 6,000 characters, so it is the only honest
 *     choice for "long Arabic article")
 *   - one short-wave article (korean-weather-small-talk-phrases, ~1.8k
 *     chars - representative of a batch of similarly thin EN articles from
 *     the same publishing wave, not a cherry-picked worst case)
 *
 * A run is a lab measurement (Lighthouse's own simulated mobile throttling),
 * not real-user field data. That distinction matters most for the fourth
 * metric below.
 */

export const TARGETS = [
  { label: "Homepage", path: "/" },
  { label: "Blog index", path: "/blog" },
  { label: "Long EN article", path: "/blog/how-to-learn-korean-faster" },
  {
    label: "Long AR article (RTL)",
    path: "/blog/korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar",
  },
  { label: "Short-wave article", path: "/blog/korean-weather-small-talk-phrases" },
];

/**
 * Extract the metrics this report cares about from one parsed Lighthouse
 * JSON result (the object `lighthouse <url> --output=json` writes, already
 * JSON.parse'd).
 *
 * Deliberately reports Total Blocking Time, not INP, as the interactivity
 * number. A single cold-navigation Lighthouse run has no user interaction to
 * measure, so it cannot produce real INP - only TBT, a lab proxy for
 * responsiveness. Labeling TBT as INP would be exactly the kind of
 * instrument-mislabeling error docs/DECISIONS.md already records once this
 * gate (2026-08-28, verifying JSON-LD needs a raw fetch) - the fix here is
 * the same discipline: report what the instrument actually measured.
 */
export function extractMetrics(lhr) {
  const audits = lhr.audits ?? {};
  const perfScore = lhr.categories?.performance?.score;
  return {
    performanceScore: perfScore == null ? null : Math.round(perfScore * 100),
    lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
  };
}

const fmtMs = (ms) => (ms == null ? "—" : `${Math.round(ms)} ms`);
const fmtScore = (n) => (n == null ? "—" : String(n));
const fmtCls = (n) => (n == null ? "—" : n.toFixed(3));

/**
 * Build the markdown table for the workflow's Job Summary / PR report.
 * `rows` is `[{ label, path, metrics }]`, in the order to display.
 */
export function buildMarkdownTable(rows) {
  const header =
    "| Page | Performance | LCP | CLS | TBT (lab proxy for INP) |\n" +
    "|---|---|---|---|---|";
  const body = rows
    .map((r) => {
      const m = r.metrics;
      return `| ${r.label} (\`${r.path}\`) | ${fmtScore(m.performanceScore)} | ${fmtMs(
        m.lcpMs
      )} | ${fmtCls(m.cls)} | ${fmtMs(m.tbtMs)} |`;
    })
    .join("\n");
  return `${header}\n${body}`;
}

// ── CLI runner ───────────────────────────────────────────────────────────
// Only runs when this file is executed directly (`node
// scripts/lighthouse-budget.mjs`), so the parsing/formatting helpers above
// can be unit tested without spawning Chrome.

async function runLighthouseCli(url, outPath) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  // Pinned version: a CI-only tool, not a project dependency, so this stays
  // out of package.json / package-lock.json entirely. --chrome-flags matches
  // a sandboxed CI runner (no GPU, no setuid sandbox available inside the
  // GitHub Actions container).
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
  const { readFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const baseUrl = process.argv[2] || process.env.SITE || "https://kloversegy.com";
  const tmpDir = mkdtempSync(join(tmpdir(), "lighthouse-"));

  const rows = [];
  for (const target of TARGETS) {
    const url = `${baseUrl}${target.path}`;
    const outPath = join(tmpDir, `${target.label.replace(/[^a-z0-9]+/gi, "-")}.json`);
    console.error(`Running Lighthouse against ${url} ...`);
    try {
      await runLighthouseCli(url, outPath);
      const lhr = JSON.parse(readFileSync(outPath, "utf-8"));
      rows.push({ label: target.label, path: target.path, metrics: extractMetrics(lhr) });
    } catch (err) {
      console.error(`Lighthouse failed for ${url}: ${err.message}`);
      rows.push({
        label: target.label,
        path: target.path,
        metrics: { performanceScore: null, lcpMs: null, cls: null, tbtMs: null },
      });
    }
  }

  console.log(buildMarkdownTable(rows));
}

if (process.argv[1] && process.argv[1].endsWith("lighthouse-budget.mjs")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

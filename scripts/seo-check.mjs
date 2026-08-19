/**
 * seo-check.mjs
 *
 * Asserts the SEO invariants that A1 is supposed to guarantee. Exits non-zero
 * on any failure so CI can block a merge.
 *
 * Two modes:
 *
 *   node scripts/seo-check.mjs --dist dist
 *       Offline. Reads the built dist/ directory and public/robots.txt. This is
 *       what CI runs: it catches a regression before it is ever deployed.
 *
 *   node scripts/seo-check.mjs --base https://kloversegy.com
 *       Live. Fetches every URL in the sitemap over plain HTTP (no JavaScript,
 *       which is the whole point) and additionally checks status codes and the
 *       www redirect.
 *
 * Checks:
 *   1. every URL responds 200                      (live only)
 *   2. every page has a title, and only the homepage has the homepage title
 *   3. canonical is present and equals the page's own URL
 *   4. no two routes share a canonical
 *   5. robots.txt names exactly one sitemap, and it is the expected URL
 *   6. www 301s to the apex                        (live only)
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, sep } from "path";

const BASE_URL = "https://kloversegy.com";
const EXPECTED_SITEMAP = `${BASE_URL}/sitemap.xml`;

const argv = process.argv.slice(2);
const argOf = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const DIST = argOf("--dist");
const BASE = argOf("--base");
const MODE = DIST ? "dist" : "live";
const ROOT = BASE || BASE_URL;

// ── helpers ─────────────────────────────────────────────────────────────────

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : null;
};
const titleOf = (html) => pick(html, /<title>([^<]*)<\/title>/i);
const canonicalOf = (html) =>
  pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) ||
  pick(html, /<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i);

const results = [];
const record = (url, checks) => results.push({ url, ...checks });

// ── collect pages ───────────────────────────────────────────────────────────

/** Walk dist/ and return [{url, html}] for every prerendered index.html. */
function collectFromDist(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "index.html") {
        const rel = relative(dir, full).split(sep).slice(0, -1).join("/");
        out.push({ url: `${BASE_URL}/${rel}`.replace(/\/$/, "") || BASE_URL, html: readFileSync(full, "utf-8"), path: rel });
      }
    }
  };
  walk(dir);
  // root index.html -> the homepage, canonicalised with its slash
  return out.map((p) => (p.path === "" ? { ...p, url: `${BASE_URL}/` } : p));
}

async function collectFromLive(base) {
  const res = await fetch(`${base}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error("sitemap contained no <loc> entries");

  const out = [];
  for (const url of urls) {
    const r = await fetch(url, { redirect: "manual" });
    out.push({ url, status: r.status, html: r.ok ? await r.text() : "" });
  }
  return out;
}

// ── run ─────────────────────────────────────────────────────────────────────

let pages;
if (MODE === "dist") {
  if (!existsSync(DIST)) {
    console.error(`seo-check: ${DIST} does not exist. Run \`npm run build\` first.`);
    process.exit(1);
  }
  pages = collectFromDist(DIST);
} else {
  pages = await collectFromLive(ROOT);
}

if (!pages.length) {
  console.error("seo-check: no pages collected.");
  process.exit(1);
}

const homepage = pages.find((p) => p.url === `${BASE_URL}/` || p.url === BASE_URL);
const homeTitle = homepage ? titleOf(homepage.html) : null;

for (const page of pages) {
  const isHome = page.url === `${BASE_URL}/` || page.url === BASE_URL;
  const title = titleOf(page.html);
  const canonical = canonicalOf(page.html);

  record(page.url, {
    status: MODE === "live" ? page.status : 200,
    statusOk: MODE === "live" ? page.status === 200 : null,
    title,
    hasTitle: Boolean(title && title.trim()),
    titleUnique: isHome ? true : title !== homeTitle,
    canonical,
    canonicalOk: canonical === page.url,
    isHome,
  });
}

// duplicate canonicals
const canonCount = new Map();
for (const r of results) {
  if (!r.canonical) continue;
  canonCount.set(r.canonical, (canonCount.get(r.canonical) || 0) + 1);
}
for (const r of results) r.canonicalUnique = !r.canonical || canonCount.get(r.canonical) === 1;

// robots.txt
let robotsSitemaps = [];
let robotsErr = null;
try {
  const txt =
    MODE === "dist"
      ? readFileSync(join("public", "robots.txt"), "utf-8")
      : await (await fetch(`${ROOT}/robots.txt`)).text();
  robotsSitemaps = txt
    .split("\n")
    .filter((l) => /^\s*sitemap:/i.test(l))
    .map((l) => l.split(/:\s*/).slice(1).join(":").trim());
} catch (e) {
  robotsErr = e.message;
}
const robotsOk = !robotsErr && robotsSitemaps.length === 1 && robotsSitemaps[0] === EXPECTED_SITEMAP;

// www redirect (live only)
let wwwOk = null;
let wwwDetail = "skipped (needs live HTTP)";
if (MODE === "live") {
  try {
    const r = await fetch(`https://www.kloversegy.com/`, { redirect: "manual" });
    const loc = r.headers.get("location") || "";
    wwwOk = r.status === 301 && loc.startsWith(BASE_URL);
    wwwDetail = `${r.status} -> ${loc || "(no Location)"}`;
  } catch (e) {
    wwwOk = false;
    wwwDetail = `error: ${e.message}`;
  }
}

// ── report ──────────────────────────────────────────────────────────────────

const failures = results.filter(
  (r) => r.statusOk === false || !r.hasTitle || !r.titleUnique || !r.canonicalOk || !r.canonicalUnique
);

const tick = (b) => (b === null ? "–" : b ? "PASS" : "FAIL");
const summary = [
  ["pages checked", String(results.length), "–"],
  ["HTTP 200", MODE === "live" ? `${results.filter((r) => r.statusOk).length}/${results.length}` : "skipped (dist mode)", MODE === "live" ? tick(results.every((r) => r.statusOk)) : "–"],
  ["has a title", `${results.filter((r) => r.hasTitle).length}/${results.length}`, tick(results.every((r) => r.hasTitle))],
  ["title differs from homepage", `${results.filter((r) => r.titleUnique).length}/${results.length}`, tick(results.every((r) => r.titleUnique))],
  ["canonical == own URL", `${results.filter((r) => r.canonicalOk).length}/${results.length}`, tick(results.every((r) => r.canonicalOk))],
  ["canonical is unique", `${results.filter((r) => r.canonicalUnique).length}/${results.length}`, tick(results.every((r) => r.canonicalUnique))],
  ["robots.txt names 1 sitemap", robotsErr ? `error: ${robotsErr}` : robotsSitemaps.join(", ") || "(none)", tick(robotsOk)],
  ["www 301 -> apex", wwwDetail, tick(wwwOk)],
];

const w0 = Math.max(...summary.map((r) => r[0].length));
const w1 = Math.max(...summary.map((r) => r[1].length));
const line = `+-${"-".repeat(w0)}-+-${"-".repeat(w1)}-+--------+`;

console.log(`\nseo-check — mode: ${MODE}${MODE === "dist" ? ` (${DIST})` : ` (${ROOT})`}\n`);
console.log(line);
console.log(`| ${"check".padEnd(w0)} | ${"value".padEnd(w1)} | result |`);
console.log(line);
for (const [k, v, s] of summary) {
  console.log(`| ${k.padEnd(w0)} | ${String(v).padEnd(w1)} | ${s.padEnd(6)} |`);
}
console.log(line);

if (failures.length) {
  console.log(`\n${failures.length} failing page(s):\n`);
  for (const f of failures.slice(0, 25)) {
    const why = [
      f.statusOk === false && `status ${f.status}`,
      !f.hasTitle && "no title",
      !f.titleUnique && "title same as homepage",
      !f.canonicalOk && `canonical "${f.canonical}" != url`,
      !f.canonicalUnique && `canonical shared with another route`,
    ].filter(Boolean).join("; ");
    console.log(`  ${f.url}\n    ${why}`);
  }
  if (failures.length > 25) console.log(`  ... and ${failures.length - 25} more`);
}

const ok = failures.length === 0 && robotsOk && wwwOk !== false;
console.log(ok ? "\nseo-check: PASS\n" : "\nseo-check: FAIL\n");
process.exit(ok ? 0 : 1);

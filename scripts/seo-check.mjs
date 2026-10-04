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
 *   5. /blog links to articles in its raw HTML, with no JavaScript run
 *   6. robots.txt names exactly one sitemap, and it is the expected URL
 *   7. www permanently redirects (301 or 308) to the apex  (live only)
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
// Coverage floor. The live page list is whatever the production sitemap
// contains, so coverage tracks the site automatically - but that also means a
// sitemap that silently shrinks would be reported as a smaller, still-green
// run. --min-pages turns a drop in coverage into a failure instead of a number
// nobody looks at. See docs/SEO_MIGRATION.md.
const MIN_PAGES = Number(argOf("--min-pages") ?? 0) || 0;
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

// The blog index must link to articles in its RAW HTML.
//
// /blog is the only page that can make the articles reachable by a crawler that
// does not run JavaScript. It used to serve an empty <div id="root">, so there
// was no crawlable path from the index to a single one of the 200 articles —
// they were listed in the sitemap and linked from nowhere.
//
// Counted from the same bytes a crawler receives, which is what makes this
// meaningful: in dist mode that is the prerendered file, and in live mode the
// raw response, neither of which has executed any JavaScript.
const MIN_BLOG_INDEX_LINKS = 20;
const blogIndexPage = pages.find((p) => p.url === `${BASE_URL}/blog`);
const blogIndexLinks = blogIndexPage
  ? new Set([...blogIndexPage.html.matchAll(/href="\/blog\/([^"#?]+)"/g)].map((m) => m[1])).size
  : 0;
const blogIndexOk = blogIndexLinks >= MIN_BLOG_INDEX_LINKS;
const blogIndexDetail = !blogIndexPage
  ? "/blog was not collected"
  : `${blogIndexLinks} article links (min ${MIN_BLOG_INDEX_LINKS})`;

// robots.txt
let robotsSitemaps = [];
let robotsErr = null;
let robotsTxt = "";
try {
  robotsTxt =
    MODE === "dist"
      ? readFileSync(join("public", "robots.txt"), "utf-8")
      : await (await fetch(`${ROOT}/robots.txt`)).text();
  robotsSitemaps = robotsTxt
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
    // Vercel answers `"permanent": true` with 308, not 301. Both are permanent
    // redirects and Google treats them identically for consolidation; 308 also
    // preserves the request method. Accept either, reject 302/307.
    const permanent = r.status === 301 || r.status === 308;
    wwwOk = permanent && loc.startsWith(BASE_URL);
    wwwDetail = `${r.status} -> ${loc || "(no Location)"}`;
  } catch (e) {
    wwwOk = false;
    wwwDetail = `error: ${e.message}`;
  }
}

// robots.txt must match the noindex strategy, which differs by route.
//
// The four public auth pages must stay CRAWLABLE. Their noindex is carried by
// the X-Robots-Tag response header (see below), and a header can only be obeyed
// by a crawler that actually fetches the URL. A Disallow would silently defeat
// it — and would strand any URL already in the index, because Google could
// never re-crawl it to discover the noindex. That is the trap described in
// docs/SEO_DIAGNOSIS.md section 9.
//
// /admin/login must stay BLOCKED. Nothing of it was ever in the index, so there
// is nothing to deindex and no reason to invite a crawl. It still gets the
// header as defence in depth, for anything that reaches it without consulting
// robots.txt — which is why it stays in NOINDEX_ROUTES below.
//
// This check exists so the two mechanisms cannot drift apart in either
// direction. It reads robots.txt from public/ in dist mode, so it runs in CI
// too, not just against production.

/** Allow/Disallow rules for the `User-agent: *` group only. */
function starGroupRules(txt) {
  const rules = [];
  let inStar = false;
  for (const raw of txt.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      inStar = value === "*";
      continue;
    }
    if (!inStar) continue;
    if (key === "allow" || key === "disallow") rules.push({ type: key, path: value });
  }
  return rules;
}

/**
 * Google's precedence: the longest matching path wins, and Allow beats Disallow
 * on an equal-length tie. Literal prefixes only — this robots.txt uses no `*`
 * or `$` wildcards, and a rule using one would need this extended.
 */
function isCrawlable(path, rules) {
  let best = null;
  for (const r of rules) {
    if (!r.path) continue; // `Disallow:` with an empty value means "allow all"
    if (!path.startsWith(r.path)) continue;
    if (
      !best ||
      r.path.length > best.path.length ||
      (r.path.length === best.path.length && r.type === "allow")
    ) {
      best = r;
    }
  }
  return !best || best.type === "allow";
}

// X-Robots-Tag on routes that must never be indexed (live only).
//
// These routes also set <meta name="robots" content="noindex, nofollow"> from
// JavaScript via useSEO({ noindex: true }). That meta tag only exists after the
// SPA bundle runs, so a crawler that reads the raw response never sees it. The
// response header carries the same instruction with no JS execution required,
// which is the point of adding it — and the point of asserting it here.
//
// The list is split by what robots.txt does with each route, because the two
// mechanisms only work together in one of the two arrangements:
//
//   crawlable + header  → the crawler fetches, reads the header, drops the URL.
//                         This is the only arrangement that can REMOVE a URL
//                         that is already in the index (docs/SEO_DIAGNOSIS.md §9).
//   disallowed + header → the crawler never fetches, so it never reads the
//                         header; blocking is what keeps the URL out. The header
//                         is defence in depth for anything that does not consult
//                         robots.txt. Fine for URLs that were never indexed, and
//                         it saves crawl budget, but it can never deindex.
//
// So a route belongs in the blocked list only while there is nothing to deindex.
// If Search Console ever reports one of them as indexed, move it to the
// crawlable list — that is the fix, not another Disallow rule.
//
// Header-only, so it cannot be checked from dist/; skipped in dist mode exactly
// like the www redirect above.
const NOINDEX_CRAWLABLE_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/my-lessons",
  "/practice-interview",
  "/unsubscribe",
];

const NOINDEX_BLOCKED_ROUTES = [
  "/admin/login",
  "/admin",
  "/dashboard",
  "/dashboard/schedule",
  "/profile",
  "/pay/example-enrollment-id",
  "/resubmit-schedule",
  "/textbook",
  "/review",
  "/daily-quiz",
  "/complete-profile",
  "/trial-confirm",
  "/trial-booking",
  "/rsvp",
  "/progress-report",
  "/certificate",
  "/hangul-book",
  "/trial-book",
  "/enrollment-status",
];

const NOINDEX_ROUTES = [...NOINDEX_CRAWLABLE_ROUTES, ...NOINDEX_BLOCKED_ROUTES];

// Must NOT be disallowed — the header is the enforcement.
const MUST_CRAWL = NOINDEX_CRAWLABLE_ROUTES;
// Must stay disallowed — the block is the enforcement.
const MUST_BLOCK = NOINDEX_BLOCKED_ROUTES;

const robotsRules = robotsErr ? [] : starGroupRules(robotsTxt);
const wronglyBlocked = robotsErr ? [] : MUST_CRAWL.filter((r) => !isCrawlable(r, robotsRules));
const wronglyOpen = robotsErr ? [] : MUST_BLOCK.filter((r) => isCrawlable(r, robotsRules));
const crawlableOk = robotsErr ? false : wronglyBlocked.length === 0 && wronglyOpen.length === 0;
const crawlableDetail = robotsErr
  ? `error: ${robotsErr}`
  : crawlableOk
    ? `${MUST_CRAWL.length} crawlable, ${MUST_BLOCK.length} blocked`
    : [
        wronglyBlocked.length && `must be crawlable but is disallowed: ${wronglyBlocked.join(", ")}`,
        wronglyOpen.length && `must be disallowed but is crawlable: ${wronglyOpen.join(", ")}`,
      ].filter(Boolean).join("; ");
let noindexOk = null;
let noindexDetail = "skipped (needs live HTTP)";
const noindexFailures = [];
if (MODE === "live") {
  for (const path of NOINDEX_ROUTES) {
    try {
      // redirect: manual — a redirect away from the route would hide a missing
      // header behind a 3xx, and that is exactly the case worth failing on.
      const r = await fetch(`${ROOT}${path}`, { redirect: "manual" });
      const tag = (r.headers.get("x-robots-tag") || "").toLowerCase();
      if (!(tag.includes("noindex") && tag.includes("nofollow"))) {
        noindexFailures.push(`${path} [${r.status}] -> ${tag || "(no X-Robots-Tag)"}`);
      }
    } catch (e) {
      noindexFailures.push(`${path} -> error: ${e.message}`);
    }
  }
  noindexOk = noindexFailures.length === 0;
  noindexDetail = noindexOk
    ? `${NOINDEX_ROUTES.length}/${NOINDEX_ROUTES.length} routes`
    : noindexFailures.join("; ");
}

// ── report ──────────────────────────────────────────────────────────────────

const failures = results.filter(
  (r) => r.statusOk === false || !r.hasTitle || !r.titleUnique || !r.canonicalOk || !r.canonicalUnique
);

const tick = (b) => (b === null ? "–" : b ? "PASS" : "FAIL");
// Coverage floor verdict. Applies in whichever mode it is given a floor: live
// mode counts sitemap URLs, dist mode counts prerendered files. The two are
// different populations, so each caller passes its own number.
const coverageOk = MIN_PAGES === 0 ? null : results.length >= MIN_PAGES;
const coverageDetail =
  MIN_PAGES === 0
    ? "no floor set (--min-pages)"
    : `${results.length} vs floor ${MIN_PAGES}`;

const summary = [
  ["pages checked", String(results.length), "–"],
  ["coverage floor", coverageDetail, tick(coverageOk)],
  ["HTTP 200", MODE === "live" ? `${results.filter((r) => r.statusOk).length}/${results.length}` : "skipped (dist mode)", MODE === "live" ? tick(results.every((r) => r.statusOk)) : "–"],
  ["has a title", `${results.filter((r) => r.hasTitle).length}/${results.length}`, tick(results.every((r) => r.hasTitle))],
  ["title differs from homepage", `${results.filter((r) => r.titleUnique).length}/${results.length}`, tick(results.every((r) => r.titleUnique))],
  ["canonical == own URL", `${results.filter((r) => r.canonicalOk).length}/${results.length}`, tick(results.every((r) => r.canonicalOk))],
  ["canonical is unique", `${results.filter((r) => r.canonicalUnique).length}/${results.length}`, tick(results.every((r) => r.canonicalUnique))],
  ["/blog links to articles in raw HTML", blogIndexDetail, tick(blogIndexOk)],
  ["robots.txt names 1 sitemap", robotsErr ? `error: ${robotsErr}` : robotsSitemaps.join(", ") || "(none)", tick(robotsOk)],
  ["www 301/308 -> apex", wwwDetail, tick(wwwOk)],
  ["robots.txt matches noindex strategy", crawlableDetail, tick(crawlableOk)],
  ["noindex routes: X-Robots-Tag", noindexDetail, tick(noindexOk)],
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

const ok =
  coverageOk !== false &&
  failures.length === 0 &&
  blogIndexOk &&
  robotsOk &&
  crawlableOk &&
  wwwOk !== false &&
  noindexOk !== false;
if (coverageOk === false) {
  console.log(
    `\nCOVERAGE DROPPED: ${results.length} ` +
      `${MODE === "live" ? "sitemap URLs" : "prerendered pages"}, below the floor ` +
      `of ${MIN_PAGES}.\nEither coverage was lost, or the catalogue shrank ` +
      `deliberately - if deliberate, lower --min-pages in the same change that ` +
      `shrinks it.`
  );
}
console.log(ok ? "\nseo-check: PASS\n" : "\nseo-check: FAIL\n");
process.exit(ok ? 0 : 1);

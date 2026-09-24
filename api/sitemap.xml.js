// Vercel Serverless Function — the single sitemap for kloversegy.com.
//
// Lists every published post in BOTH languages. The pure builder is exported so
// it can be tested; the test lives in scripts/sitemap-xml.test.mjs rather than
// next to this file, because Vercel turns every file under api/ into a
// deployed endpoint and a test file there would become a public URL.
//
// Served at /sitemap.xml via the rewrite in vercel.json. public/sitemap.xml was
// deleted: it was static, hand-maintained, and every <lastmod> in it had read
// 2026-04-08 for four months. Because Vercel serves static files before
// rewrites, that stale file was the one being served while this function sat
// unused at /api/sitemap.xml (docs/SEO_DIAGNOSIS.md, finding #4).
import { createClient } from "@supabase/supabase-js";
import { RETIRED_SLUGS } from "../scripts/lib/retired-arabic-slugs.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const BASE = "https://kloversegy.com";

/**
 * The homepage's translation pair (24 Sep 2026). Same pair as HOME_ALTERNATES in
 * scripts/prerender-meta.mjs; keep the two in step. Both members list both,
 * themselves included, or Google ignores the cluster.
 */
const HOME_ALTERNATES = { en: "/", ar: "/ar" };

// Keep in step with MARKETING_ROUTES in scripts/prerender-meta.mjs.
const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly", alternates: HOME_ALTERNATES },
  { loc: "/ar", priority: "1.0", changefreq: "weekly", alternates: HOME_ALTERNATES },
  { loc: "/courses", priority: "0.9", changefreq: "weekly" },
  { loc: "/pricing", priority: "0.9", changefreq: "monthly" },
  { loc: "/about", priority: "0.8", changefreq: "monthly" },
  { loc: "/contact", priority: "0.8", changefreq: "monthly" },
  { loc: "/faq", priority: "0.7", changefreq: "monthly" },
  { loc: "/enroll-now", priority: "0.9", changefreq: "monthly" },
  { loc: "/placement-test", priority: "0.8", changefreq: "monthly" },
  { loc: "/games", priority: "0.7", changefreq: "weekly" },
  { loc: "/free-trial", priority: "0.9", changefreq: "monthly" },
  { loc: "/affiliate", priority: "0.7", changefreq: "monthly" },
  { loc: "/blog", priority: "0.8", changefreq: "weekly" },
  // High-intent landing pages. These were listed in the old public/sitemap.xml
  // but missing here, so promoting this function without adding them would have
  // silently de-listed them.
  { loc: "/learn-korean-arabic-speakers", priority: "0.9", changefreq: "monthly" },
  { loc: "/topik-exam-preparation", priority: "0.9", changefreq: "monthly" },
  { loc: "/learn-korean-kdramas", priority: "0.8", changefreq: "monthly" },
  { loc: "/interview-training", priority: "0.8", changefreq: "monthly" },
  { loc: "/hangul-starter", priority: "0.8", changefreq: "monthly" },
  // "Journey through Korea's time" — five era pages, added 2026-09-22.
  // Content and IDs live in src/constants/eras.ts; keep this list in step
  // with ERAS there and with MARKETING_ROUTES in scripts/prerender-meta.mjs.
  { loc: "/journey/before-korea", priority: "0.6", changefreq: "monthly" },
  { loc: "/journey/ancient-korea", priority: "0.6", changefreq: "monthly" },
  { loc: "/journey/joseon", priority: "0.6", changefreq: "monthly" },
  { loc: "/journey/traditional-life", priority: "0.6", changefreq: "monthly" },
  { loc: "/journey/modern-korea", priority: "0.6", changefreq: "monthly" },
  // Legal pages, added 2026-09-24. Keep in step with MARKETING_ROUTES in
  // scripts/prerender-meta.mjs.
  { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
];

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The language-neutral identity of a post, for both Arabic slug conventions. */
const baseOf = (slug) =>
  slug.startsWith("ar-") ? slug.slice(3) : slug.replace(/-ar$/, "");

/**
 * Group posts into EN/AR pairs by their base slug.
 *
 * Language comes from the `lang` column, never from how the slug is spelled.
 *
 * Eight English posts turn out to have *two* published Arabic translations —
 * one `<base>-ar` and one legacy `ar-<base>`. A URL can only carry one
 * `hreflang="ar"` alternate, and a cluster whose members disagree is discarded
 * wholesale by Google, so one has to be chosen: the `-ar` suffix wins, because
 * it is the convention 90 of the 100 Arabic posts already use and the one
 * scripts/prerender-meta.mjs picks when it writes the same tags into the page.
 * The runner-up still gets its own <loc> — it is a published page and hiding it
 * from the sitemap would not make it stop existing — but it gets no alternates,
 * and it is returned in `duplicateArabic` so a caller can report it.
 */
export function pairPosts(posts) {
  const pairs = new Map();
  const duplicateArabic = [];

  for (const p of posts) {
    const base = baseOf(p.slug);
    const entry = pairs.get(base) || { en: null, ar: null };

    if ((p.lang || "en") === "ar") {
      if (!entry.ar) {
        entry.ar = p.slug;
      } else {
        // Keep the suffix form, demote the other one.
        const keep = p.slug.endsWith("-ar") ? p.slug : entry.ar;
        const drop = keep === p.slug ? entry.ar : p.slug;
        entry.ar = keep;
        duplicateArabic.push(drop);
      }
    } else {
      entry.en = p.slug;
    }
    pairs.set(base, entry);
  }

  return { pairs, duplicateArabic };
}

/**
 * Build the whole sitemap.
 *
 * Every published post gets a <loc> of its own, in both languages. Until this
 * change the Arabic posts appeared only as `xhtml:link` alternates hanging off
 * their English partner, which is not a submission: an alternate tells a crawler
 * which version to show a given user, it does not put the URL in the crawl
 * queue. All 100 Arabic articles were therefore absent from the one document
 * that tells search engines the page exists.
 */
export function buildSitemap(posts, today) {
  // Confirmed duplicate Arabic translations (fix/duplicate-arabic-slugs) never
  // reach pairPosts at all: they carry their own 301 in vercel.json, so giving
  // them a <loc> here would submit a URL to Google that immediately redirects
  // away. The demotion logic below stays as a second line of defence for any
  // future duplicate that gets published before its redirect exists.
  const live = posts.filter((p) => !RETIRED_SLUGS.has(p.slug));
  const { pairs, duplicateArabic } = pairPosts(live);
  const demoted = new Set(duplicateArabic);

  const staticTags = STATIC_PAGES.map((p) => {
    const alts = p.alternates
      ? `
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${BASE}${p.alternates.en}`)}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${xmlEscape(`${BASE}${p.alternates.ar}`)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${BASE}${p.alternates.en}`)}" />`
      : "";
    return `  <url>
    <loc>${BASE}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${alts}
  </url>`;
  });

  const postTags = live.map((p) => {
    const lastmod = (p.updated_at || p.published_at || today).split("T")[0];
    const url = `${BASE}/blog/${p.slug}`;
    const pair = pairs.get(baseOf(p.slug));

    // A cluster is only emitted when both sides really exist, and then it is
    // emitted identically on both of them — every member of an hreflang cluster
    // has to list every member, itself included, or the whole set is ignored.
    const bothSides = pair && pair.en && pair.ar && !demoted.has(p.slug);
    const alts = bothSides
      ? `
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${BASE}/blog/${pair.en}`)}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${xmlEscape(`${BASE}/blog/${pair.ar}`)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${BASE}/blog/${pair.en}`)}" />`
      : "";

    return `  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${alts}
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticTags, ...postTags].join("\n")}
</urlset>`;

  return { xml, duplicateArabic };
}

export default async function handler(req, res) {
  const today = new Date().toISOString().split("T")[0];

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.status(500).send("sitemap: SUPABASE_URL / SUPABASE_ANON_KEY not configured");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at, lang")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) {
    res.status(500).send(`sitemap: ${error.message}`);
    return;
  }

  const { xml, duplicateArabic } = buildSitemap(posts || [], today);

  if (duplicateArabic.length) {
    // Shows up in the function's log. These are published Arabic pages that
    // duplicate another published Arabic page, so they are listed but left out
    // of the hreflang clusters; which one to keep is a content decision.
    console.warn(
      `sitemap: ${duplicateArabic.length} Arabic posts duplicate another translation ` +
        `and were listed without hreflang: ${duplicateArabic.join(", ")}`
    );
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}

// Vercel Serverless Function — the single sitemap for kloversegy.com.
//
// Served at /sitemap.xml via the rewrite in vercel.json. public/sitemap.xml was
// deleted: it was static, hand-maintained, and every <lastmod> in it had read
// 2026-04-08 for four months. Because Vercel serves static files before
// rewrites, that stale file was the one being served while this function sat
// unused at /api/sitemap.xml (docs/SEO_DIAGNOSIS.md, finding #4).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const BASE = "https://kloversegy.com";

// Keep in step with MARKETING_ROUTES in scripts/prerender-meta.mjs.
const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
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
  { loc: "/welcome-back", priority: "0.7", changefreq: "monthly" },
  { loc: "/hangul-starter", priority: "0.8", changefreq: "monthly" },
];

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

  const all = posts || [];
  const bySlug = new Set(all.map((p) => p.slug));

  // Language is decided by the lang column, not by spelling the slug. The old
  // filter was `!slug.endsWith("-ar")`, which missed the 10 Arabic posts using
  // the legacy `ar-` prefix and published them as English URLs.
  const englishPosts = all.filter((p) => (p.lang || "en") !== "ar");

  const baseOf = (slug) =>
    slug.startsWith("ar-") ? slug.slice(3) : slug.replace(/-ar$/, "");

  /** Arabic partner slug for an English post, or null when there is none. */
  const arabicPartner = (slug) => {
    const base = baseOf(slug);
    if (bySlug.has(`${base}-ar`)) return `${base}-ar`;
    if (bySlug.has(`ar-${base}`)) return `ar-${base}`;
    return null;
  };

  const staticTags = STATIC_PAGES.map(
    (p) => `  <url>
    <loc>${BASE}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  );

  const postTags = englishPosts.map((p) => {
    const lastmod = (p.updated_at || p.published_at || today).split("T")[0];
    const url = `${BASE}/blog/${p.slug}`;
    const ar = arabicPartner(p.slug);

    // xhtml:link alternates are only emitted for a pair that really exists, and
    // a valid cluster must include a self-reference.
    const alts = ar
      ? `
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(url)}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${xmlEscape(`${BASE}/blog/${ar}`)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(url)}" />`
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

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}

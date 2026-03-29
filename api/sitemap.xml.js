// Vercel Serverless Function — dynamic sitemap that always includes all published blog posts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ewtdgpbybkceokfohhyg.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs";

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
];

const today = new Date().toISOString().split("T")[0];

export default async function handler(req, res) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at, lang")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const urlTags = [
    // Static pages
    ...STATIC_PAGES.map(
      (p) => `  <url>
    <loc>https://kloversegy.com${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    ),
    // Blog posts — English only in main sitemap (Arabic via hreflang alternates)
    ...(posts || [])
      .filter((p) => !p.slug.endsWith("-ar"))
      .map((p) => {
        const lastmod = (p.updated_at || p.published_at || today).split("T")[0];
        return `  <url>
    <loc>https://kloversegy.com/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}

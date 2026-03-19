/**
 * Netlify Function: /sitemap.xml
 * Auto-deploys on every git push — no manual steps.
 * Dynamically includes all published blog posts from Supabase.
 */

const SITE_URL     = "https://kloversegy.com";
const SUPABASE_URL = "https://rahpkflknkofuuhnbfyc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHBrZmxrbmtvZnV1aG5iZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzEyOTksImV4cCI6MjA4NjQwNzI5OX0.ZY416BgNYNoPgasvT6tXJ09OlYe8kSCgnl-qmxAT_oE";

const STATIC_ROUTES = [
  { path: "/",               priority: "1.0", changefreq: "weekly",  lastmod: "2026-03-20" },
  { path: "/courses",        priority: "0.9", changefreq: "weekly",  lastmod: "2026-03-20" },
  { path: "/pricing",        priority: "0.9", changefreq: "monthly", lastmod: "2026-03-20" },
  { path: "/enroll",         priority: "0.9", changefreq: "monthly", lastmod: "2026-03-20" },
  { path: "/about",          priority: "0.8", changefreq: "monthly", lastmod: "2026-03-01" },
  { path: "/blog",           priority: "0.8", changefreq: "weekly",  lastmod: "2026-03-20" },
  { path: "/placement-test", priority: "0.8", changefreq: "monthly", lastmod: "2026-03-10" },
  { path: "/enroll-now",     priority: "0.8", changefreq: "monthly", lastmod: "2026-03-20" },
  { path: "/games",          priority: "0.7", changefreq: "weekly",  lastmod: "2026-03-19" },
  { path: "/faq",            priority: "0.7", changefreq: "monthly", lastmod: "2026-03-20" },
  { path: "/contact",        priority: "0.7", changefreq: "monthly", lastmod: "2026-03-01" },
];

export default async function handler(req, context) {
  const today = new Date().toISOString().split("T")[0];

  try {
    // Fetch all published blog posts
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,published_at,updated_at&published=eq.true&order=published_at.desc`,
      {
        headers: {
          apikey:        SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const posts = res.ok ? await res.json() : [];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

    // Static routes
    for (const route of STATIC_ROUTES) {
      xml += `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>\n`;
    }

    // Blog posts — each is a separate indexable page
    for (const post of posts) {
      const lastmod = (post.updated_at || post.published_at || today).split("T")[0];
      xml += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type":  "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
}

export const config = { path: "/sitemap.xml" };

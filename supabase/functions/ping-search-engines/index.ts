/**
 * ping-search-engines
 *
 * Notifies Google, Bing, and all IndexNow-compatible engines
 * (Yandex, Naver, Seznam, Yahoo) whenever content changes.
 *
 * Called by:
 *  - pg_cron daily schedule
 *  - Database trigger on blog_posts publish
 *  - Manual POST from admin
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL    = "https://kloversegy.com";
const INDEXNOW_KEY = "8f8e25f6c4d7b10abab899f355a7e529";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All static public routes
const STATIC_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/courses`,
  `${SITE_URL}/pricing`,
  `${SITE_URL}/about`,
  `${SITE_URL}/contact`,
  `${SITE_URL}/faq`,
  `${SITE_URL}/blog`,
  `${SITE_URL}/placement-test`,
  `${SITE_URL}/enroll`,
  `${SITE_URL}/enroll-now`,
  `${SITE_URL}/games`,
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const results: Record<string, string> = {};

  try {
    // ── 1. Fetch all published blog post URLs from DB ──────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase    = createClient(supabaseUrl, supabaseKey);

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("published", true)
      .order("published_at", { ascending: false });

    const blogUrls = (posts || []).map(
      (p: { slug: string }) => `${SITE_URL}/blog/${p.slug}`
    );

    const allUrls = [...STATIC_URLS, ...blogUrls];

    // ── 2. Ping Google with sitemap URL ────────────────────────────────
    try {
      const googleRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
      );
      results.google = googleRes.ok ? "✅ pinged" : `⚠️ ${googleRes.status}`;
    } catch (e) {
      results.google = `❌ ${(e as Error).message}`;
    }

    // ── 3. Ping Bing with sitemap URL ──────────────────────────────────
    try {
      const bingRes = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
      );
      results.bing_sitemap = bingRes.ok ? "✅ pinged" : `⚠️ ${bingRes.status}`;
    } catch (e) {
      results.bing_sitemap = `❌ ${(e as Error).message}`;
    }

    // ── 4. Submit all URLs via IndexNow (Bing + Yandex + Naver + more) ─
    try {
      const indexNowPayload = {
        host:    "kloversegy.com",
        key:     INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: allUrls,
      };

      const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
        method:  "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body:    JSON.stringify(indexNowPayload),
      });

      results.indexnow = indexNowRes.ok
        ? `✅ submitted ${allUrls.length} URLs`
        : `⚠️ ${indexNowRes.status}: ${await indexNowRes.text()}`;
    } catch (e) {
      results.indexnow = `❌ ${(e as Error).message}`;
    }

    // ── 5. Also submit to Bing IndexNow endpoint directly ──────────────
    try {
      const bingIndexNowRes = await fetch(
        `https://www.bing.com/indexnow?url=${encodeURIComponent(SITE_URL)}&key=${INDEXNOW_KEY}`
      );
      results.bing_indexnow = bingIndexNowRes.ok
        ? "✅ pinged"
        : `⚠️ ${bingIndexNowRes.status}`;
    } catch (e) {
      results.bing_indexnow = `❌ ${(e as Error).message}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        urls_submitted: allUrls.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("ping-search-engines error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message, results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

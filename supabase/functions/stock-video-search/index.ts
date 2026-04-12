import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 24h cache TTL for Pexels results to conserve API quota
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface PexelsVideoFile {
  link: string;
  width: number;
  height: number;
  file_type: string;
}

interface PexelsVideo {
  id: number;
  duration: number;
  width: number;
  height: number;
  image: string;
  video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  videos: PexelsVideo[];
}

interface StockVideoResult {
  id: number;
  url: string;
  preview: string;
  duration: number;
  width: number;
  height: number;
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  // Prefer mp4, portrait, closest to 1080px width
  const mp4s = files.filter((f) => f.file_type === "video/mp4");
  if (mp4s.length === 0) return null;
  const portrait = mp4s.filter((f) => f.height >= f.width);
  const pool = portrait.length > 0 ? portrait : mp4s;
  pool.sort((a, b) => Math.abs(a.width - 1080) - Math.abs(b.width - 1080));
  return pool[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!PEXELS_API_KEY) throw new Error("PEXELS_API_KEY not configured");

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Unauthorized: admin only");

    const body = await req.json();
    const query: string = (body.query || "").trim();
    const postType: string = (body.postType || "generic").trim();
    const limit: number = Math.min(Number(body.limit) || 5, 10);
    const forceRefresh: boolean = body.forceRefresh === true;

    if (!query) throw new Error("query is required");

    // 1. Try cache first
    if (!forceRefresh) {
      const { data: cached } = await adminClient
        .from("stock_video_cache")
        .select("results, fetched_at")
        .eq("post_type", postType)
        .eq("query", query)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - new Date(cached.fetched_at).getTime();
        if (age < CACHE_TTL_MS) {
          return new Response(
            JSON.stringify({
              results: cached.results,
              cached: true,
              age_ms: age,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // 2. Call Pexels Videos API
    const pexelsUrl = new URL("https://api.pexels.com/videos/search");
    pexelsUrl.searchParams.set("query", query);
    pexelsUrl.searchParams.set("orientation", "portrait");
    pexelsUrl.searchParams.set("size", "medium");
    pexelsUrl.searchParams.set("per_page", String(limit));

    const pexelsResp = await fetch(pexelsUrl.toString(), {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!pexelsResp.ok) {
      const errText = await pexelsResp.text();
      console.error("Pexels error:", pexelsResp.status, errText);
      if (pexelsResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Pexels rate limit hit. Try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`Pexels returned ${pexelsResp.status}`);
    }

    const pexelsData: PexelsSearchResponse = await pexelsResp.json();
    const results: StockVideoResult[] = (pexelsData.videos || [])
      .map((v) => {
        const file = pickBestFile(v.video_files);
        if (!file) return null;
        return {
          id: v.id,
          url: file.link,
          preview: v.image,
          duration: v.duration,
          width: file.width,
          height: file.height,
        };
      })
      .filter((x): x is StockVideoResult => x !== null)
      // Prefer clips ≤ 15s for reels, but keep all as fallback
      .sort((a, b) => {
        const aShort = a.duration <= 15 ? 0 : 1;
        const bShort = b.duration <= 15 ? 0 : 1;
        return aShort - bShort;
      });

    // 3. Cache results (upsert-style: insert new row)
    if (results.length > 0) {
      await adminClient.from("stock_video_cache").insert({
        post_type: postType,
        query,
        results: results as unknown as Record<string, unknown>,
      });
    }

    return new Response(
      JSON.stringify({ results, cached: false }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("stock-video-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

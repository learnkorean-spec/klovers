import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pollySpeak, type PollyVoice } from "../_shared/polly.ts";

/**
 * tts-ko — the site's "listen" voice for Korean text (vocabulary cards,
 * lessons, articles, placement test), voiced by Amazon Polly and paid from the
 * AWS credits (16 Nov 2026). Replaces the browser's own Korean voice, which is
 * robotic on most devices and missing on many.
 *
 * GET /functions/v1/tts-ko?t=<korean text>&v=f|m  →  302 to a public MP3.
 *
 * Each (voice, text) is voiced ONCE: the MP3 is kept in the public
 * lesson-scenes bucket under tts/v1/<voice>/<sha256>.mp3, and every later
 * request just redirects to it (and the browser caches the redirect target).
 *
 * Public on purpose (verify_jwt = false): articles and lessons are read
 * signed-out. Guard rails so it can't become a free TTS service: Korean only
 * (must contain Hangul), at most 150 characters, and at most NEW_PER_DAY fresh
 * recordings per voice per day — past that it answers 429 and the page falls
 * back to the browser voice. Cached lines are always served.
 *
 * Voices: f = Seoyeon (neural: $16 / 1M chars, 1M free per month for 12
 * months); m = Hyunduk (Polly's only male Korean voice; generative only).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "lesson-scenes";
const VERSION = "v1";
const MAX_CHARS = 150;
const NEW_PER_DAY = 300;
const VOICES: Record<string, PollyVoice> = {
  f: { voiceId: "Seoyeon", engine: "neural" },
  m: { voiceId: "Hyunduk", engine: "generative" },
};

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const fail = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const q = new URL(req.url).searchParams;
    const text = (q.get("t") || "").normalize("NFC").replace(/\s+/g, " ").trim();
    const v = q.get("v") === "m" ? "m" : "f";
    if (!text || text.length > MAX_CHARS) return fail(400, "text missing or too long");
    if (!/[가-힣ᄀ-ᇿ㄰-㆏]/.test(text)) return fail(400, "Korean text only");
    if (/https?:|www\.|[<>{}\\]/i.test(text)) return fail(400, "bad text");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const dir = `tts/${VERSION}/${v}`;
    const name = `${await sha256(text)}.mp3`;
    const path = `${dir}/${name}`;
    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const go = () =>
      new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: publicUrl, "Cache-Control": "public, max-age=86400" },
      });

    const { data: found } = await admin.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
    if (found?.some((f) => f.name === name)) return go();

    // Daily cap on fresh recordings for this voice.
    const { data: recent } = await admin.storage
      .from(BUCKET)
      .list(dir, { limit: NEW_PER_DAY, sortBy: { column: "created_at", order: "desc" } });
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const today = (recent ?? []).filter((f) => f.created_at && Date.parse(f.created_at) > dayAgo).length;
    if (today >= NEW_PER_DAY) return fail(429, "daily limit reached");

    const bytes = await pollySpeak(text, VOICES[v]);
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
    if (error) return fail(500, error.message);
    return go();
  } catch (e) {
    return fail(500, String(e));
  }
});

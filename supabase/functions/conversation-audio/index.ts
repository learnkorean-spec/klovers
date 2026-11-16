import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAiKey } from "../_shared/ai.ts";
import { hasPolly, parsePollyVoice, pollySpeak } from "../_shared/polly.ts";

/**
 * Generates the spoken Korean for one book conversation.
 *
 * Admin-only. Give it a conversation `code` (the one printed in the book's QR)
 * and the lines, and it writes one MP3 per line to the public marketing-images
 * bucket under conversations/<code>/<index>.mp3.
 *
 * One file per line, not one per conversation: a learner replays a single line,
 * and nothing has to be stitched together inside Deno.
 *
 * Re listens to lesson 1 before the rest are generated — a textbook's audio is
 * copied by the learner, so the intonation is hers to approve, not ours.
 *
 * provider "polly" (16 Nov 2026): voices a speaker with Amazon Polly when
 * `pollyVoices` names a Polly voice for them ("Seoyeon:generative"), paid from
 * the AWS credits; speakers without one still use OpenAI. Polly runs write to
 * conversations/<code>/preview/<index>.mp3 — never over the live files the
 * book's QR codes play — until Re has listened and approved them.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TTS_URL = "https://api.openai.com/v1/audio/speech";
/** tts-1-hd is the long-stable voice model. gpt-4o-mini-tts is newer and takes
 *  an `instructions` field, but is not on every key — switch only after a test. */
const TTS_MODEL = "tts-1-hd";
const BUCKET = "marketing-images";

type Line = { who: string; ko: string };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = getAiKey();

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admins only");

    const body = await req.json();
    const code: string = String(body.code || "").toLowerCase();
    const lines: Line[] = Array.isArray(body.lines) ? body.lines : [];
    const voices: Record<string, string> = body.voices || {};
    const provider: "openai" | "polly" = body.provider === "polly" ? "polly" : "openai";
    const pollyVoices: Record<string, string> =
      provider === "polly" ? (body.pollyVoices || {}) : {};
    if (provider === "polly" && !hasPolly()) throw new Error("Polly not configured (missing AWS secrets)");
    if (provider === "openai" && !apiKey) throw new Error("OPENAI_API_KEY not configured");
    const speed: number = Number(body.speed) || 0.92; // a little under natural,
                                                     // so a learner can follow
    if (!/^[a-z0-9-]{2,24}$/.test(code)) throw new Error("Bad conversation code");
    if (!lines.length) throw new Error("No lines given");

    const results: { index: number; ok: boolean; url?: string; error?: string; voice?: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const voice = voices[line.who] || "alloy";
      const pollySpec = pollyVoices[line.who];
      try {
        let bytes: Uint8Array;
        let usedVoice: string;
        if (pollySpec) {
          bytes = await pollySpeak(line.ko, parsePollyVoice(pollySpec));
          usedVoice = `polly:${pollySpec}`;
        } else {
          if (!apiKey) {
            results.push({ index: i, ok: false, error: "No Polly voice for this speaker and no OpenAI key" });
            continue;
          }
          const res = await fetch(TTS_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: TTS_MODEL,
              voice,
              input: line.ko,
              speed,
              response_format: "mp3",
            }),
          });
          if (!res.ok) {
            results.push({ index: i, ok: false, error: `${res.status} ${await res.text()}` });
            continue;
          }
          bytes = new Uint8Array(await res.arrayBuffer());
          usedVoice = `openai:${voice}`;
        }
        const path = provider === "polly"
          ? `conversations/${code}/preview/${i}.mp3`
          : `conversations/${code}/${i}.mp3`;
        const { error: upErr } = await admin.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: "audio/mpeg", upsert: true });
        if (upErr) {
          results.push({ index: i, ok: false, error: upErr.message });
          continue;
        }
        const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
        results.push({ index: i, ok: true, url: pub.publicUrl, voice: usedVoice });
      } catch (e) {
        results.push({ index: i, ok: false, error: String(e) });
      }
    }

    const made = results.filter((r) => r.ok).length;
    return new Response(
      JSON.stringify({ code, provider, model: provider === "polly" ? "polly" : TTS_MODEL, made, total: lines.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

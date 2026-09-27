import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAiKey } from "../_shared/ai.ts";
import { LINES } from "./lines.ts";

/**
 * world-voice — the recorded voice of each person in KLOVERS World.
 *
 * The browser's own Korean voice is usually a woman's (often the only one a
 * phone has), so Minsu and the other men sounded like women. This function
 * voices each line ONCE with OpenAI text-to-speech in a voice that fits the
 * speaker, keeps the MP3 in public storage, and from then on only returns
 * its address.
 *
 * Only the fixed lines below can be voiced: the caller sends an id, never
 * text, so this cannot be used as a general text-to-speech service. The
 * Korean must match src/game/config/copy.ts (a unit test checks it).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Bump when voices or wording change, so old recordings are not reused. */
const VERSION = "v1";
const BUCKET = "lesson-scenes";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    let id = new URL(req.url).searchParams.get("id") ?? "";
    if (!id && req.method === "POST") id = String((await req.json().catch(() => ({})))?.id ?? "");
    const line = Object.prototype.hasOwnProperty.call(LINES, id) ? LINES[id] : null;
    if (!line) return json({ error: "unknown line" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const path = `world-voice/${VERSION}/${id}.mp3`;
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    // Already voiced: just say where.
    const { data: existing } = await supabase.storage.from(BUCKET).list(`world-voice/${VERSION}`, { search: `${id}.mp3` });
    if (existing?.some((f) => f.name === `${id}.mp3`)) return json({ url });

    const key = getAiKey();
    if (!key) return json({ error: "voice not configured" }, 503);

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: line.voice,
        input: line.ko,
        instructions: `Speak natural standard Seoul Korean as ${line.who}. Clear, friendly, a little slower than normal, for a beginner learner.`,
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      console.error("world-voice TTS error", res.status, await res.text());
      return json({ error: "voice unavailable" }, 502);
    }
    const audio = new Uint8Array(await res.arrayBuffer());
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, audio, {
      contentType: "audio/mpeg",
      cacheControl: "31536000",
      upsert: true,
    });
    if (upErr) {
      console.error("world-voice upload error", upErr.message);
      return json({ error: "could not store voice" }, 500);
    }
    return json({ url });
  } catch (e) {
    console.error("world-voice", e);
    return json({ error: "voice unavailable" }, 500);
  }
});

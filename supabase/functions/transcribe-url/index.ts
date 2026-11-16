import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * transcribe-url — a short-lived, pre-signed Amazon Transcribe streaming URL
 * (Korean, 16 kHz PCM) for KLOVERS World's "Say it" check.
 *
 * Why: the game's "Say it" used only the browser's own speech recognition,
 * which most iPhones don't offer. With this URL the learner's browser streams
 * the microphone straight to Amazon Transcribe over a WebSocket and gets the
 * Korean back — the AWS secret key never leaves this function.
 *
 * Paid from the AWS credits (IAM user klovers-bedrock-supabase, inline policy
 * KloversTranscribeStreamingOnly = transcribe:StartStreamTranscription[WebSocket]
 * only, added 16 Nov 2026). Signed-in learners only, and the URL expires after
 * 5 minutes, so it can't be passed around as a free transcription service.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const SAMPLE_RATE = 16000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "sign in to use the speaking check" }, 401);

    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const region = Deno.env.get("AWS_TRANSCRIBE_REGION") || "us-east-1";
    if (!accessKeyId || !secretAccessKey) return json({ error: "speaking check not configured" }, 503);

    const { AwsV4Signer } = await import("npm:aws4fetch@1");
    const url = new URL(`https://transcribestreaming.${region}.amazonaws.com:8443/stream-transcription-websocket`);
    url.searchParams.set("language-code", "ko-KR");
    url.searchParams.set("media-encoding", "pcm");
    url.searchParams.set("sample-rate", String(SAMPLE_RATE));
    url.searchParams.set("X-Amz-Expires", "300");
    const signer = new AwsV4Signer({
      url: url.toString(),
      method: "GET",
      accessKeyId,
      secretAccessKey,
      region,
      service: "transcribe",
      signQuery: true,
    });
    const signed = await signer.sign();
    return json({ url: signed.url.toString().replace(/^https:/, "wss:"), sampleRate: SAMPLE_RATE });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

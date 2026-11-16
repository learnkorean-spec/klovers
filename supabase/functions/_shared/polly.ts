/**
 * Amazon Polly text-to-speech, using the same AWS secrets as the Bedrock
 * fallback in ai.ts (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION,
 * IAM user klovers-bedrock-supabase). That user has `polly:SynthesizeSpeech`
 * only (inline policy KloversPollySpeechOnly, added 16 Nov 2026), paid from
 * the account's AWS credits.
 *
 * Korean voices (ko-KR), per the Polly docs on 16 Nov 2026:
 *   Seoyeon — female — generative / neural   (generative is the most natural)
 *   Jihye   — female — neural / standard
 *   Hyunduk — male   — long-form
 */

export type PollyEngine = "generative" | "neural" | "long-form" | "standard";
export type PollyVoice = { voiceId: string; engine: PollyEngine };

export function hasPolly(): boolean {
  return !!(Deno.env.get("AWS_ACCESS_KEY_ID") && Deno.env.get("AWS_SECRET_ACCESS_KEY"));
}

/** "Seoyeon:generative" → { voiceId: "Seoyeon", engine: "generative" }. */
export function parsePollyVoice(spec: string): PollyVoice {
  const [voiceId, engine] = spec.split(":");
  return { voiceId, engine: (engine || "neural") as PollyEngine };
}

/** Returns MP3 bytes for one piece of Korean text. */
export async function pollySpeak(text: string, voice: PollyVoice): Promise<Uint8Array> {
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  // Polly's generative and long-form engines live in us-east-1, whatever
  // region the Bedrock fallback uses.
  const region = Deno.env.get("AWS_POLLY_REGION") || "us-east-1";
  if (!accessKeyId || !secretAccessKey) throw new Error("Polly not configured (missing AWS secrets)");

  // Plain signed fetch, not @aws-sdk/client-polly: the SDK's client pulls in
  // an HTTP/2 handler and fails on Supabase's edge runtime with
  // "ERR_NOT_IMPLEMENTED: Http2Session.settings" (seen 16 Nov 2026).
  const { AwsClient } = await import("npm:aws4fetch@1");
  const aws = new AwsClient({ accessKeyId, secretAccessKey, region, service: "polly" });
  const res = await aws.fetch(`https://polly.${region}.amazonaws.com/v1/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Text: text,
      VoiceId: voice.voiceId,
      Engine: voice.engine,
      LanguageCode: "ko-KR",
      OutputFormat: "mp3",
      SampleRate: "24000",
    }),
  });
  if (!res.ok) throw new Error(`Polly ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return new Uint8Array(await res.arrayBuffer());
}

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

  const { PollyClient, SynthesizeSpeechCommand } = await import("npm:@aws-sdk/client-polly@3");
  const client = new PollyClient({ region, credentials: { accessKeyId, secretAccessKey } });
  const res = await client.send(
    new SynthesizeSpeechCommand({
      Text: text,
      // Plain strings from our own config; the SDK types them as string unions.
      // deno-lint-ignore no-explicit-any
      VoiceId: voice.voiceId as any,
      // deno-lint-ignore no-explicit-any
      Engine: voice.engine as any,
      LanguageCode: "ko-KR",
      OutputFormat: "mp3",
      SampleRate: "24000",
    }),
  );
  if (!res.AudioStream) throw new Error("Polly returned no audio");
  // The SDK's stream helper gives the whole MP3 at once.
  // deno-lint-ignore no-explicit-any
  return await (res.AudioStream as any).transformToByteArray();
}

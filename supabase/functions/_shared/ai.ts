// Shared AI provider settings for Klovers edge functions.
//
// Klovers used to route every AI call through the Lovable AI Gateway
// (ai.gateway.lovable.dev + LOVABLE_API_KEY). Lovable has been removed from
// the stack, so text and image calls now go straight to OpenAI using the
// OPENAI_API_KEY secret that the CV / interview functions already use.
//
// 2026-11-04: OPENAI_API_KEY has been unreliable in production (expired /
// insufficient_quota / invalid_api_key, see claude/klovers-ops-notes.md), so
// text completions now have an AWS Bedrock (Amazon Nova Lite) fallback —
// see `chatComplete` below. Image generation stays OpenAI-only: Bedrock's
// serverless tier has no real text-to-image model on this account (only
// Stability AI's image-editing ops are serverless; true text-to-image needs
// a paid Bedrock Marketplace/SageMaker endpoint).

export const AI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
export const AI_TEXT_MODEL = "gpt-4o-mini";
export const AI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
export const AI_IMAGE_MODEL = "gpt-image-1";
export const BEDROCK_TEXT_MODEL = "amazon.nova-lite-v1:0";

export function getAiKey(): string | undefined {
  return Deno.env.get("OPENAI_API_KEY");
}

type BedrockCreds = { accessKeyId: string; secretAccessKey: string; region: string };

/**
 * True if either OpenAI or Bedrock is configured — i.e. chatComplete has a
 * provider to try. Callers that used to gate on `getAiKey()` alone should
 * gate on this instead, so a Bedrock-only setup (no OPENAI_API_KEY) still
 * works instead of failing closed.
 */
export function hasAnyChatProvider(): boolean {
  return !!getAiKey() || !!getBedrockCreds();
}

function getBedrockCreds(): BedrockCreds | undefined {
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const region = Deno.env.get("AWS_REGION");
  if (!accessKeyId || !secretAccessKey || !region) return undefined;
  return { accessKeyId, secretAccessKey, region };
}

/** Thrown by chatComplete; carries the failing provider's HTTP-ish status when known. */
export class AiChatError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiChatError";
    this.status = status;
  }
}

export type ChatOptions = { temperature?: number };

async function callOpenAiChat(
  prompt: string,
  apiKey: string,
  opts: ChatOptions,
): Promise<string> {
  const res = await fetch(AI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_TEXT_MODEL,
      temperature: opts.temperature ?? 0.4,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new AiChatError(`OpenAI error ${res.status}: ${errText.slice(0, 300)}`, res.status);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callBedrockChat(prompt: string, opts: ChatOptions): Promise<string> {
  const creds = getBedrockCreds();
  if (!creds) throw new AiChatError("Bedrock not configured (missing AWS secrets)", 500);
  const { BedrockRuntimeClient, ConverseCommand } = await import(
    "npm:@aws-sdk/client-bedrock-runtime@3"
  );
  const client = new BedrockRuntimeClient({
    region: creds.region,
    credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
  });
  try {
    const res = await client.send(
      new ConverseCommand({
        modelId: BEDROCK_TEXT_MODEL,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { temperature: opts.temperature ?? 0.4 },
      }),
    );
    const text = res.output?.message?.content?.find((b: any) => typeof b.text === "string")?.text;
    if (!text) throw new AiChatError("Bedrock returned no content", 500);
    return text;
  } catch (err) {
    if (err instanceof AiChatError) throw err;
    throw new AiChatError(`Bedrock error: ${String((err as Error)?.message ?? err)}`, 500);
  }
}

/**
 * Chat-completes a single-turn text prompt. Tries OpenAI first (when
 * OPENAI_API_KEY is set); on any OpenAI failure (missing key, 429, 402,
 * invalid key, network error, etc.) falls back to AWS Bedrock / Amazon Nova
 * Lite when AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION are set.
 * Throws AiChatError if neither provider is configured or both fail.
 */
export async function chatComplete(prompt: string, opts: ChatOptions = {}): Promise<string> {
  const openAiKey = getAiKey();
  let openAiError: AiChatError | undefined;

  if (openAiKey) {
    try {
      return await callOpenAiChat(prompt, openAiKey, opts);
    } catch (err) {
      openAiError = err instanceof AiChatError ? err : new AiChatError(String(err));
    }
  }

  if (getBedrockCreds()) {
    try {
      return await callBedrockChat(prompt, opts);
    } catch (bedrockError) {
      // Prefer surfacing the OpenAI error when both failed, since it's
      // usually the more informative one (callers already parse its shape).
      throw openAiError ?? bedrockError;
    }
  }

  throw openAiError ?? new AiChatError(
    "No AI provider configured (missing OPENAI_API_KEY and AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION)",
    500,
  );
}

export type ImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; status: number; errorText: string };

/**
 * Generates one image and returns it as a `data:image/png;base64,...` URL —
 * the same shape the old gateway returned, so callers keep their existing
 * base64 → storage upload code.
 */
export async function generateImageDataUrl(
  prompt: string,
  apiKey: string,
  size: "1024x1024" | "1536x1024" | "1024x1536" = "1536x1024",
): Promise<ImageResult> {
  const res = await fetch(AI_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: AI_IMAGE_MODEL, prompt, size, n: 1 }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, errorText: await res.text() };
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) return { ok: false, status: 500, errorText: "No image generated" };
  return { ok: true, dataUrl: `data:image/png;base64,${b64}` };
}

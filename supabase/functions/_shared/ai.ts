// Shared AI provider settings for Klovers edge functions.
//
// Klovers used to route every AI call through the Lovable AI Gateway
// (ai.gateway.lovable.dev + LOVABLE_API_KEY). Lovable has been removed from
// the stack, so text and image calls now go straight to OpenAI using the
// OPENAI_API_KEY secret that the CV / interview functions already use.

export const AI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
export const AI_TEXT_MODEL = "gpt-4o-mini";
export const AI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
export const AI_IMAGE_MODEL = "gpt-image-1";

export function getAiKey(): string | undefined {
  return Deno.env.get("OPENAI_API_KEY");
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

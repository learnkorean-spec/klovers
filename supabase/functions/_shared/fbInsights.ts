// Pure helpers for facebook-post-insights, kept apart from the edge function so
// they can be tested without Deno or the network.

/** utm_content / utm_campaign as they appear in the link inside a post's text. */
export function parseUtm(message: string | null | undefined): {
  utm_content: string | null;
  utm_campaign: string | null;
} {
  const text = message ?? "";
  const pick = (key: string) =>
    text.match(new RegExp(`[?&]${key}=([A-Za-z0-9_.\\-]+)`, "i"))?.[1]?.toLowerCase() ?? null;
  return { utm_content: pick("utm_content"), utm_campaign: pick("utm_campaign") };
}

type InsightsPayload = {
  data?: Array<{ name?: string; values?: Array<{ value?: unknown }> }>;
  error?: { message?: string; code?: number };
};

/**
 * Meta replaced post_impressions_unique with post_total_media_view_unique in
 * 2026. Both numbers come back in one request; a metric missing from the answer
 * stays null instead of being stored as a misleading 0.
 */
export function parseInsights(payload: InsightsPayload): {
  reach: number | null;
  media_views: number | null;
  error: string | null;
} {
  if (payload?.error) {
    const { code, message } = payload.error;
    return {
      reach: null,
      media_views: null,
      error: `${code ?? "error"}: ${message ?? "unknown"}`.slice(0, 300),
    };
  }
  const byName = new Map<string, number>();
  for (const metric of payload?.data ?? []) {
    const raw = metric.values?.[0]?.value;
    if (metric.name && typeof raw === "number" && Number.isFinite(raw)) {
      byName.set(metric.name, Math.round(raw));
    }
  }
  return {
    reach: byName.get("post_total_media_view_unique") ?? null,
    media_views: byName.get("post_media_view") ?? null,
    error: null,
  };
}

/** Never let an access token travel into a stored error or a response body. */
export function scrub(text: string, secret: string | undefined): string {
  let out = text;
  if (secret) out = out.split(secret).join("[token]");
  return out.replace(/access_token=[^&\s"']+/gi, "access_token=[token]").slice(0, 300);
}

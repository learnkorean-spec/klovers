// Unified lead-event logger. Persists every interest signal to lead_events
// and mirrors to Meta Pixel / GA4 via the existing `track` helper.
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, getAttribution } from "@/lib/leadSession";
import { track } from "@/lib/tracking";
import type { Json } from "@/integrations/supabase/types";

export type LeadSource =
  | "whatsapp"
  | "free_trial"
  | "placement_test"
  | "pricing"
  | "enroll"
  | "contact"
  | "email";

/**
 * Game telemetry event kinds (G0c).
 *
 * Deliberately a SEPARATE type from LeadSource, and it must stay separate.
 * `logLeadEvent` mirrors every call to the Meta Pixel as a `Lead` conversion
 * and to GA4 as `generate_lead` — both live, both feeding ad optimisation
 * that real money is spent against. Game events fire orders of magnitude
 * more often than a trial signup: routing them through `logLeadEvent` would
 * inject hundreds of fake conversions and corrupt that data silently.
 *
 * Use `logGameEvent` below, which never touches a pixel. The type split is
 * what makes the mistake impossible to write rather than merely discouraged
 * — `logLeadEvent({ source_type: "game_opened" })` does not compile.
 */
export type GameEventType =
  | "games_page_view"
  | "game_opened"
  | "game_started"
  | "game_completed";

interface EventOpts<T extends string> {
  source_type: T;
  cta_label?: string;
  metadata?: Record<string, unknown>;
}

type LogOpts = EventOpts<LeadSource>;

/**
 * Build the row and insert it. Pixel-free by construction — every mirror to
 * an external analytics product lives in the caller, so that adding one is a
 * visible edit at a call site rather than an invisible side effect here.
 */
async function insertEventRow(opts: EventOpts<string>): Promise<void> {
  const attribution = getAttribution();
  const row = {
    session_id: getSessionId(),
    source_type: opts.source_type,
    source_page: typeof window !== "undefined" ? window.location.pathname : "",
    cta_label: opts.cta_label ?? null,
    campaign: attribution.campaign ?? null,
    utm_source: attribution.utm_source ?? null,
    utm_medium: attribution.utm_medium ?? null,
    utm_content: attribution.utm_content ?? null,
    referrer: attribution.referrer ?? null,
    // The generated Json type cannot express Record<string, unknown> even
    // though every value callers pass is JSON-serialisable, so the cast is
    // narrowed to this one line rather than loosening the public opts type.
    metadata: (opts.metadata ?? {}) as Json,
  };
  // user_id is deliberately not set: the column defaults to null and
  // attachLeadToUser backfills it on signup. A logged-out visitor is the
  // population G0c exists to measure, so a null user_id is the data.
  await supabase.from("lead_events").insert(row);
}

/** Insert a row into lead_events. Never throws — tracking must not break user flow. */
export async function logLeadEvent(opts: LogOpts): Promise<void> {
  try {
    // Mirror to Meta Pixel / GA4 (existing infra).
    track.lead({ content_name: opts.source_type });
    await insertEventRow(opts);
  } catch {
    /* swallow — never block UI */
  }
}

/**
 * G0c game telemetry. Writes to lead_events and fires NO pixel of any kind —
 * not `fbq`, not `gtag`. See the GameEventType note above for why that is a
 * correctness requirement and not a preference. Guarded by
 * `leadTracking.pixel.test.ts`.
 */
export async function logGameEvent(opts: EventOpts<GameEventType>): Promise<void> {
  try {
    await insertEventRow(opts);
  } catch {
    /* swallow — never block UI */
  }
}

/**
 * Log a WhatsApp click then open the URL.
 * Races the insert against a 600ms timeout so the redirect never feels laggy.
 */
export async function trackAndOpenWhatsApp(
  url: string,
  ctx: { cta_label?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  const insert = logLeadEvent({
    source_type: "whatsapp",
    cta_label: ctx.cta_label,
    metadata: ctx.metadata,
  });
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 600));
  await Promise.race([insert, timeout]);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

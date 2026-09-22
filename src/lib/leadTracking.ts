// Unified lead-event logger. Persists every interest signal to lead_events
// and mirrors to Meta Pixel / GA4 via the existing `track` helper.
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, getAttribution } from "@/lib/leadSession";
import { track } from "@/lib/tracking";
import type { Json } from "@/integrations/supabase/types";

/**
 * Something the visitor DID, deliberately, that a salesperson would call a
 * lead. Every one of these mirrors to the Meta Pixel as a `Lead` conversion
 * and to GA4 as `generate_lead`.
 *
 * The test for adding a value here is not "is this interesting?" but "did a
 * human choose to do this?". Scrolling is not a choice. Seeing a section is
 * not a choice. Those go to `logEngagementEvent`.
 */
export type LeadSource =
  | "whatsapp"
  | "free_trial"
  | "placement_test"
  | "pricing"
  | "enroll"
  | "contact"
  | "email"
  | "community";

/**
 * Game telemetry event kinds (G0c).
 *
 * Deliberately a SEPARATE type from LeadSource, and it must stay separate.
 * `logLeadEvent` mirrors every call to the Meta Pixel as a `Lead` conversion
 * and to GA4 as `generate_lead` â€” both live, both feeding ad optimisation
 * that real money is spent against. Game events fire orders of magnitude
 * more often than a trial signup: routing them through `logLeadEvent` would
 * inject hundreds of fake conversions and corrupt that data silently.
 *
 * Use `logGameEvent` below, which never touches a pixel. The type split is
 * what makes the mistake impossible to write rather than merely discouraged
 * â€” `logLeadEvent({ source_type: "game_opened" })` does not compile.
 */
export type GameEventType =
  | "games_page_view"
  | "game_opened"
  | "game_started"
  | "game_completed";

/**
 * Automatic engagement signals â€” things that happen TO a visitor rather than
 * things they choose to do. Scroll depth, a section entering the viewport, a
 * modal appearing, or a low-intent content click (browsing a culture tile is
 * curiosity, not the same signal as booking a trial).
 *
 * These were going through `logLeadEvent`, which is the same mistake the
 * GameEventType note above exists to prevent, and it was live on the busiest
 * page on the site: Index.tsx raised 4 scroll-depth milestones and 5
 * section-visibility markers, so one visitor scrolling to the bottom of the
 * homepage generated up to NINE `Lead` conversions having clicked nothing.
 * Measured in GA4 Realtime on 18 Sep 2026: 11 `generate_lead` against 6
 * `page_view`, from one session that clicked nothing at all.
 *
 * "culture_section" added 22 Sep 2026: CultureHeritageSection.tsx's tile
 * clicks were calling `logLeadEvent({ source_type: "culture_section" })`,
 * which (a) doesn't compile against the LeadSource union above and (b) at
 * blog-tile click volume would dilute real ad-optimisation data the same
 * way the scroll milestones did. Browsing a culture blog post is genuine
 * interest, not the same intent signal as booking a trial.
 *
 * The rows are still written to lead_events â€” the signal is genuinely useful
 * for funnel analysis. What they are not is conversions.
 *
 * "blog_journey" added 23 Sep 2026 for the /blog journey (journey started,
 * path chosen, stop viewed, word saved, quiz answered, next stop clicked…).
 * The specific event rides in `cta_label`; see src/lib/journeyAnalytics.ts.
 * Reading and quizzing are learning, not buying intent — no pixel, same as
 * the culture tiles.
 */
export type EngagementEventType = "homepage" | "culture_section" | "blog_journey";

interface EventOpts<T extends string> {
  source_type: T;
  cta_label?: string;
  metadata?: Record<string, unknown>;
}

type LogOpts = EventOpts<LeadSource>;

/**
 * Build the row and insert it. Pixel-free by construction â€” every mirror to
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

/** Insert a row into lead_events. Never throws â€” tracking must not break user flow. */
export async function logLeadEvent(opts: LogOpts): Promise<void> {
  try {
    // Mirror to Meta Pixel / GA4 (existing infra).
    track.lead({ content_name: opts.source_type });
    await insertEventRow(opts);
  } catch {
    /* swallow â€” never block UI */
  }
}

/**
 * G0c game telemetry. Writes to lead_events and fires NO pixel of any kind â€”
 * not `fbq`, not `gtag`. See the GameEventType note above for why that is a
 * correctness requirement and not a preference. Guarded by
 * `leadTracking.pixel.test.ts`.
 */
export async function logGameEvent(opts: EventOpts<GameEventType>): Promise<void> {
  try {
    await insertEventRow(opts);
  } catch {
    /* swallow â€” never block UI */
  }
}

/**
 * Automatic engagement signals. Writes to lead_events and fires NO pixel â€”
 * same guarantee as logGameEvent, for the same reason. See
 * EngagementEventType above.
 */
export async function logEngagementEvent(opts: EventOpts<EngagementEventType>): Promise<void> {
  try {
    await insertEventRow(opts);
  } catch {
    /* swallow â€” never block UI */
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

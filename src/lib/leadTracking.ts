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
 * not a choice. Loading a page is not a choice. Those go to
 * `logEngagementEvent`.
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

/**
 * Automatic engagement signals — things that happen TO a visitor rather than
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
 * "culture_section" added 22 Sep 2026 for CultureHeritageSection's tile
 * clicks. "blog_journey" added 23 Sep 2026 for the /blog journey (the
 * specific event rides in `cta_label`; see src/lib/journeyAnalytics.ts).
 *
 * "pricing_page" added 23 Sep 2026: /pricing called logLeadEvent on page load
 * ("page_view") and when the exit sheet merely appeared ("exit_intent_shown"),
 * so viewing the pricing page counted as a conversion - the homepage mistake
 * again. Clicks on that page (a tier's Get Started, the exit sheet's trial
 * button) are still leads.
 *
 * The rows are still written to lead_events — the signal is genuinely useful
 * for funnel analysis. What they are not is conversions.
 */
export type EngagementEventType = "homepage" | "culture_section" | "blog_journey" | "pricing_page";

interface EventOpts<T extends string> {
  source_type: T;
  cta_label?: string;
  metadata?: Record<string, unknown>;
}

type LogOpts = EventOpts<LeadSource>;

/** The site language as the document declares it ("en" / "ar"), if known. */
const pageLanguage = (): string | undefined =>
  typeof document !== "undefined" ? document.documentElement.lang || undefined : undefined;

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

/**
 * Insert a row into lead_events and mirror it as a conversion.
 * Never throws — tracking must not break user flow.
 *
 * 23 Sep 2026: GA4's `generate_lead` now carries lead_source, cta_label,
 * language and page_path, so a hero click, a WhatsApp tap and a pricing
 * "Get started" can be told apart in GA4 reports. The Meta Pixel payload is
 * unchanged.
 */
export async function logLeadEvent(opts: LogOpts): Promise<void> {
  try {
    track.lead(
      { content_name: opts.source_type },
      {
        lead_source: opts.source_type,
        cta_label: opts.cta_label,
        language: pageLanguage(),
        page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
      },
    );
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
 * Automatic engagement signals. Writes to lead_events and fires NO pixel —
 * same guarantee as logGameEvent, for the same reason. See
 * EngagementEventType above.
 */
export async function logEngagementEvent(opts: EventOpts<EngagementEventType>): Promise<void> {
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

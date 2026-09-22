/**
 * Blog-journey telemetry. One call site shape for every journey event, routed
 * through the existing pixel-free `logEngagementEvent` (lead_events table).
 * No new analytics provider, and nothing here reaches the Meta Pixel or GA4 —
 * see EngagementEventType in leadTracking.ts for why that matters.
 */
import { logEngagementEvent } from "@/lib/leadTracking";

export type JourneyEvent =
  | "blog_journey_started"
  | "journey_path_selected"
  | "journey_stop_viewed"
  | "article_opened"
  | "article_completed"
  | "word_saved"
  | "quiz_started"
  | "quiz_completed"
  | "next_stop_clicked"
  | "course_cta_clicked";

// Once per page load is enough for the automatic ones: a reader scrolling up
// and down past stage 03 is one view, not five rows.
const once = new Set<string>();

export function trackJourney(event: JourneyEvent, metadata: Record<string, unknown> = {}, dedupeKey?: string) {
  if (dedupeKey) {
    const k = `${event}:${dedupeKey}`;
    if (once.has(k)) return;
    once.add(k);
  }
  void logEngagementEvent({ source_type: "blog_journey", cta_label: event, metadata });
}

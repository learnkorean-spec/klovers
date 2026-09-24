import { track } from "@/lib/tracking";

/**
 * Dashboard analytics — sent through the EXISTING GA4 wrapper
 * (lib/tracking.ts → gtag). No new provider.
 *
 * Events: dashboard_view, continue_learning_click, mission_completed,
 * journey_node_clicked, reward_progress_viewed, class_opened.
 * game_started / game_completed live on the games pages (not changed here);
 * cluby_unlocked has no backing data yet (see PR notes).
 */
export type DashboardEvent =
  | { name: "dashboard_view"; enrolled: boolean; level: string | null; xp_level: number }
  | { name: "continue_learning_click"; source: "hero" | "card"; book: string | null; lesson: number | null }
  | { name: "mission_completed"; mission: string }
  | { name: "journey_node_clicked"; node: string; state: string }
  | { name: "reward_progress_viewed"; milestone: string | null; badges: number }
  | { name: "class_opened"; source: string };

export function dashEvent(e: DashboardEvent): void {
  const { name, ...params } = e;
  try {
    track.custom(name, params);
  } catch {
    /* analytics is never allowed to break the page */
  }
}

/** Fire a mission_completed once per mission per day per browser. */
export function markMissionCompletedOnce(mission: string, day: string): void {
  const key = `kl_mission_${day}_${mission}`;
  try {
    if (sessionStorage.getItem(key) || localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    return;
  }
  dashEvent({ name: "mission_completed", mission });
}

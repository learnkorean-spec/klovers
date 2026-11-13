import { track } from "@/lib/tracking";

/**
 * Dashboard analytics — sent through the EXISTING GA4 wrapper
 * (lib/tracking.ts → gtag). No new provider.
 *
 * Events: dashboard_view, continue_learning_click, mission_completed,
 * journey_node_clicked, reward_progress_viewed, class_opened,
 * dashboard_tab_view, dashboard_first_click, dashboard_clear_yes/no,
 * starter_step_click.
 * cluby_unlocked (Cluby hatches — derived from real lesson progress, see
 * eggStatus in dashboardProgress.ts).
 * game_started / game_completed live on the games pages (not changed here).
 */
export type DashboardEvent =
  | { name: "dashboard_view"; enrolled: boolean; level: string | null; xp_level: number }
  | { name: "continue_learning_click"; source: "hero" | "card"; book: string | null; lesson: number | null }
  | { name: "mission_completed"; mission: string }
  | { name: "journey_node_clicked"; node: string; state: string }
  | { name: "reward_progress_viewed"; milestone: string | null; badges: number }
  | { name: "class_opened"; source: string }
  | { name: "cluby_unlocked"; recent: boolean }
  // 13 Nov 2026 — tabbed dashboard: which tab is opened, the first thing a
  // student taps on each visit, and the one-tap "is this page clear?" answer.
  | { name: "dashboard_tab_view"; tab: string; starter: boolean }
  | { name: "dashboard_first_click"; target: string; tab: string; starter: boolean }
  | { name: "dashboard_clear_yes" | "dashboard_clear_no"; tab: string; starter: boolean }
  | { name: "starter_step_click"; step: "level" | "lesson" | "trial" | "enroll" };

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

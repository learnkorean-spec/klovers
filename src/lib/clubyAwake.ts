/**
 * Is Cluby awake yet? Canon (src/config/klovers-world.ts): a student never
 * sees Cluby before his egg hatches. The student dashboard knows the egg
 * stage (lib/dashboardProgress.ts → eggStatus) and records it here, so
 * celebrations rendered outside the dashboard (components/XpAnimation.tsx)
 * can show him only after the hatch. A per-browser flag only — nothing is
 * sent to the server, and when storage is blocked Cluby simply stays hidden.
 */
const CLUBY_AWAKE_KEY = "kl_cluby_awake";

export function markClubyAwake(awake: boolean): void {
  try {
    if (awake) localStorage.setItem(CLUBY_AWAKE_KEY, "1");
    else localStorage.removeItem(CLUBY_AWAKE_KEY);
  } catch {
    // Storage unavailable (private mode, blocked site data) — nothing to do.
  }
}

export function isClubyAwake(): boolean {
  try {
    return localStorage.getItem(CLUBY_AWAKE_KEY) === "1";
  } catch {
    return false;
  }
}

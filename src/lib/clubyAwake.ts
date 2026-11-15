/**
 * Is Cluby awake yet? Canon (src/config/klovers-world.ts): a student never
 * sees Cluby before his egg hatches. The student dashboard knows the egg
 * stage (lib/dashboardProgress.ts → eggStatus) and records it here, so
 * celebrations rendered outside the dashboard (components/XpAnimation.tsx)
 * can show him only after the hatch. A per-browser flag only — nothing is
 * sent to the server, and when storage is blocked Cluby simply stays hidden.
 *
 * SCOPE: this gate is the LOGGED-IN product, and that is deliberate. Canon
 * lists the gated surfaces explicitly under
 * KLOVERS_WORLD.originStory.clubyVisibility.gatedUntilHatch — the games page,
 * the game-worlds hub, the leaderboard and this XP celebration. It also allows
 * him on marketing pages before the hatch (Re, 25 Sep 2026), so a visitor to
 * the homepage seeing Cluby is not a bug in this file. Do not add a gate here
 * to "fix" the homepage; the rule is in canon, and the list there is the
 * authority. scripts/lib/games-free-set.test.mjs guards the gate itself.
 */
const CLUBY_AWAKE_KEY = "kl_cluby_awake";
const EGG_STAGE_KEY = "kl_egg_stage";

/**
 * The egg's real stage (lib/dashboardProgress.ts → eggStatus: 0 dormant,
 * 1 cracked by a first word, 2 glowing after a first sentence, 3 hatched),
 * recorded per browser by the dashboard so KLOVERS World can show the same
 * egg the dashboard shows. Like the flag below: nothing is sent anywhere, and
 * blocked storage simply means the egg looks dormant.
 */
export function markEggStage(stage: number): void {
  try {
    localStorage.setItem(EGG_STAGE_KEY, String(Math.max(0, Math.min(3, Math.round(stage)))));
  } catch {
    // Storage unavailable — nothing to do.
  }
}

export function eggStageSeen(): 0 | 1 | 2 | 3 {
  try {
    const n = Number(localStorage.getItem(EGG_STAGE_KEY));
    return n === 1 || n === 2 || n === 3 ? n : 0;
  } catch {
    return 0;
  }
}

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

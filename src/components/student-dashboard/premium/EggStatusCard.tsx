import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EggStatus } from "@/lib/dashboardProgress";
import { dashEvent } from "@/lib/dashboardEvents";
import { useDashCopy } from "./copy";

const SEEN_KEY = "kl_cluby_hatch_seen";
/** Counts as "just hatched" (vs. the catch-up line) for two weeks. */
const RECENT_MS = 14 * 24 * 3600 * 1000;

function readSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}
function writeSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode: card just shows again */ }
}

/**
 * Cluby's clover egg (canon: KLOVERS_WORLD.originStory + productNarrative).
 * Before he hatches, the egg shows how far the student's real learning has
 * woken it: first word → crack, first sentence → glow, first conversation →
 * hatch. After hatching it appears once to introduce him, then steps aside.
 * The egg art is optional: if /assets/story/egg-<stage>.webp is missing a
 * drawn egg is used, so the card never shows a broken image.
 */
export function EggStatusCard({ egg }: { egg: EggStatus }) {
  const { c, lang } = useDashCopy();
  const [seen, setSeen] = useState(readSeen);
  const hatched = egg.stage === 3;
  const recent = hatched && !!egg.hatchedAt && Date.now() - new Date(egg.hatchedAt).getTime() < RECENT_MS;
  const visible = !hatched || !seen;

  useEffect(() => {
    if (hatched && !seen) dashEvent({ name: "cluby_unlocked", recent });
  }, [hatched, seen, recent]);

  if (!visible) return null;

  const title = hatched ? (recent ? c("eggHatchedTitle") : c("eggCatchUpTitle")) : c(`eggTitle${egg.stage}` as "eggTitle0");
  const body = hatched ? (recent ? c("eggHatchedBody") : c("eggCatchUpBody")) : c(`eggBody${egg.stage}` as "eggBody0");
  const steps = [c("eggStep1"), c("eggStep2"), c("eggStep3")];

  return (
    <section
      aria-labelledby="dash-egg-title"
      className="relative flex items-center gap-4 overflow-hidden rounded-[20px] border border-foreground/10 bg-card p-4 sm:gap-5 sm:p-5"
    >
      <div className="relative grid h-20 w-20 shrink-0 place-items-center sm:h-24 sm:w-24">
        {hatched ? (
          <img src="/assets/cluby/cluby-hatch.webp" alt={c("clubyAlt")} width={96} height={96} className="h-full w-full object-contain" />
        ) : (
          <EggArt stage={egg.stage} label={c("eggAria")} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 id="dash-egg-title" className="font-display text-base font-semibold text-foreground sm:text-lg">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
        {!hatched && (
          <ol className="mt-2.5 flex flex-wrap gap-1.5" aria-label={c("eggAria")}>
            {steps.map((s, i) => {
              const done = egg.stage > i;
              return (
                <li
                  key={s}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    done ? "bg-foreground text-background" : "border border-dashed border-foreground/25 text-muted-foreground",
                  )}
                >
                  {done && <Check className="me-1 inline h-3 w-3 align-[-2px]" strokeWidth={3} aria-hidden="true" />}
                  {s}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {hatched && (
        <button
          type="button"
          onClick={() => { writeSeen(); setSeen(true); }}
          className="min-h-11 shrink-0 self-start rounded-xl border border-foreground/20 px-3 text-sm font-semibold text-foreground hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          lang={lang}
        >
          {c("eggDismiss")}
        </button>
      )}
    </section>
  );
}

/** Egg art for a stage; falls back to the drawn egg if the file is not there yet. */
function EggArt({ stage, label }: { stage: 0 | 1 | 2; label: string }) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src={`/assets/story/egg-${stage}.webp`}
        alt={label}
        width={96}
        height={96}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    );
  }
  return <DrawnEgg stage={stage} label={label} />;
}

/** Ivory egg with the small green four-leaf clover (canon egg). */
function DrawnEgg({ stage, label }: { stage: 0 | 1 | 2; label: string }) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={label} className="h-full w-full">
      <defs>
        <radialGradient id="egg-shell" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFF9EC" />
          <stop offset="100%" stopColor="#E8DFC9" />
        </radialGradient>
        <radialGradient id="egg-glow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#FFFF00" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFF00" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stage === 2 && <circle cx="50" cy="55" r="48" fill="url(#egg-glow)" />}
      <ellipse cx="50" cy="92" rx="22" ry="4" fill="#2E2E2E" opacity="0.12" />
      <path d="M50 10 C 70 10 80 40 80 60 C 80 80 67 91 50 91 C 33 91 20 80 20 60 C 20 40 30 10 50 10 Z" fill="url(#egg-shell)" stroke="#2E2E2E" strokeOpacity="0.18" strokeWidth="1.5" />
      <g transform="translate(50 58)" fill="#39FF14" stroke="#2E2E2E" strokeWidth="0.8">
        <circle cx="-4" cy="-4" r="4.2" />
        <circle cx="4" cy="-4" r="4.2" />
        <circle cx="-4" cy="4" r="4.2" />
        <circle cx="4" cy="4" r="4.2" />
        <rect x="-0.8" y="4" width="1.6" height="8" rx="0.8" transform="rotate(-20)" />
      </g>
      {stage >= 1 && (
        <path d="M34 36 L41 42 L37 47 L45 52 L42 57" fill="none" stroke="#2E2E2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      )}
    </svg>
  );
}

import { Link } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { worldLabel, type JourneyStop } from "@/lib/dashboardProgress";
import { dashEvent } from "@/lib/dashboardEvents";
import { useDashCopy } from "./copy";
import { BrandIcon } from "./primitives";

/**
 * C. Learning journey — the seven course levels (constants/levels.ts), placed
 * from the student's own course_level_key, told as the story's worlds
 * (Hangul Village → Vocabulary Market → Conversation Café → Culture Street →
 * Seoul Journey, KLOVERS_WORLD.worlds). Each stop shows the world with its
 * course level underneath, so the story never hides the real level. The row follows the reading
 * direction (grid + logical properties), so in Arabic it runs right-to-left;
 * the icons themselves are never mirrored.
 */
/** The Seoul Journey stops show "Part 2" under the name only once per world. */
function worldShort(s: JourneyStop, lang: "en" | "ar") {
  return s.part && s.part > 1 ? (lang === "ar" ? `الجزء ${s.part}` : `Part ${s.part}`) : worldLabel({ world: s.world, part: null }, lang);
}

export function LearningJourneyMap({
  stops, currentIndex, continueHref,
}: { stops: JourneyStop[]; currentIndex: number; continueHref: string }) {
  const { c, lang } = useDashCopy();
  const doneCount = stops.filter(s => s.state === "completed").length;
  // Neon line from the first stop to the current one (0 when unknown).
  const reach = currentIndex <= 0 ? 0 : (currentIndex / (stops.length - 1)) * 100;
  const here = currentIndex >= 0 ? stops[currentIndex] : null;

  return (
    <section aria-labelledby="dash-journey-title" className="rounded-[20px] border border-foreground/10 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <BrandIcon name="progress-path" className="h-9 w-9" />
          <div>
            <h2 id="dash-journey-title" className="font-display text-lg font-semibold text-foreground">{c("journeyTitle")}</h2>
            {here && <p className="text-sm text-muted-foreground">{c("journeyYouAreIn", { world: worldLabel(here, lang) })}</p>}
          </div>
        </div>
        {currentIndex >= 0 && (
          <span className="text-sm text-muted-foreground">{c("journeyDone", { done: doneCount, total: stops.length })}</span>
        )}
      </div>

      <ol className="relative mt-5 grid grid-cols-7 gap-1 sm:gap-2" aria-label={c("journeyTitle")}>
        {/* track — sits behind the nodes' centres */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-[7%] top-5 h-1 rounded-full bg-foreground/10 sm:top-[30px]" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute start-[7%] top-5 h-1 rounded-full bg-foreground sm:top-[30px]"
          style={{ width: `${reach * 0.86}%` }}
        />
        {stops.map(s => {
          const level = lang === "ar" ? s.labelAr : s.labelEn;
          const world = worldLabel(s, lang);
          const label = `${world} — ${level}`;
          const stateText = s.state === "completed" ? c("stateCompleted") : s.state === "current" ? c("stateCurrent") : c("stateLocked");
          const node = (
            <>
              <span className="flex h-11 items-center sm:h-16">
              <span
                className={cn(
                  "relative grid place-items-center rounded-full border-2 transition-shadow",
                  s.milestone ? "h-11 w-11 sm:h-16 sm:w-16" : "h-10 w-10 sm:h-14 sm:w-14",
                  s.state === "current" && "border-foreground bg-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.45)]",
                  s.state === "completed" && "border-foreground/20 bg-background",
                  s.state === "locked" && "border-dashed border-foreground/20 bg-muted/60",
                )}
              >
                {s.state === "current" && (
                  <span aria-hidden="true" className="absolute inset-0 rounded-full bg-primary/60 motion-safe:animate-ping [animation-duration:2.6s]" />
                )}
                <BrandIcon
                  name={s.icon}
                  className={cn("relative", s.milestone ? "h-7 w-7 sm:h-11 sm:w-11" : "h-6 w-6 sm:h-9 sm:w-9", s.state === "locked" && "opacity-40 grayscale")}
                />
                {s.state === "completed" && (
                  <span className="absolute -bottom-0.5 -end-0.5 grid h-4 w-4 place-items-center rounded-full bg-live-bright ring-2 ring-foreground sm:h-5 sm:w-5">
                    <Check className="h-2.5 w-2.5 text-foreground sm:h-3 sm:w-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                {s.state === "locked" && (
                  <span className="absolute -bottom-0.5 -end-0.5 grid h-4 w-4 place-items-center rounded-full bg-card ring-1 ring-foreground/30 sm:h-5 sm:w-5">
                    <Lock className="h-2.5 w-2.5 text-foreground/60" aria-hidden="true" />
                  </span>
                )}
              </span>
              </span>
              <span className={cn("mt-1.5 block text-center text-[11px] leading-tight sm:text-xs", s.state === "current" ? "font-bold text-foreground" : "text-muted-foreground")}>
                <span className="hidden sm:block">{worldShort(s, lang)}</span>
                <span className="hidden sm:block text-[11px] font-normal text-muted-foreground">{level}</span>
                <span className="sm:hidden" aria-hidden="true">{s.order === 0 ? (lang === "ar" ? "هانغل" : "Hangul") : s.order}</span>
                <span className="sr-only">{label}</span>
              </span>
              <span className="sr-only">, {stateText}</span>
            </>
          );
          return (
            <li key={s.key} className="relative z-[1] flex flex-col items-center" aria-current={s.state === "current" ? "step" : undefined}>
              {s.state === "locked" ? (
                <div className="flex flex-col items-center">{node}</div>
              ) : (
                <Link
                  to={s.state === "current" ? continueHref : "/textbook"}
                  onClick={() => dashEvent({ name: "journey_node_clicked", node: s.key, state: s.state })}
                  className="flex min-h-11 flex-col items-center rounded-2xl p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  {node}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {currentIndex < 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-background px-4 py-3">
          <p className="text-sm text-foreground">{c("journeyUnknown")}</p>
          <Link to="/placement-test" className="inline-flex min-h-11 items-center rounded-xl border border-foreground/20 bg-card px-4 text-sm font-semibold hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            {c("journeyFindLevel")}
          </Link>
        </div>
      )}
    </section>
  );
}

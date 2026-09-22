import { useEffect, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { cn } from "@/lib/utils";
import { STAGE_BY_ID, type StageId } from "@/constants/blogJourney";
import { journey } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";
import { KlobiGuide, num, useInView } from "./shared";

/**
 * One chapter of the journey. Draws its own segment of the journey rail — a
 * dashed line at the inline-start edge with a numbered node — so the rail is
 * continuous down the page without any page-level geometry: every section
 * spans its full height, and segments simply meet.
 *
 * The segment fills with yellow the first time the stage is on screen (a CSS
 * transition driven by one IntersectionObserver, no scroll handler), and the
 * stop is recorded as seen. Under reduced motion the fill just appears.
 */
export default function JourneyStage({
  id,
  isAr,
  tone = "light",
  count,
  onSeeAll,
  children,
  aside,
}: {
  id: StageId;
  isAr: boolean;
  tone?: "light" | "dark" | "muted";
  count: number;
  onSeeAll: (id: StageId) => void;
  children: ReactNode;
  /** Replaces the default Klobi guide slot (e.g. a stage-specific illustration). */
  aside?: ReactNode;
}) {
  const stage = STAGE_BY_ID[id];
  const [ref, seen] = useInView<HTMLElement>(0.18);
  const dark = tone === "dark";
  const L = isAr ? "ar" : "en";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!seen) return;
    journey.markStopSeen(id);
    trackJourney("journey_stop_viewed", { stage: id }, id);
  }, [seen, id]);

  return (
    <section
      ref={ref}
      id={`stage-${id}`}
      aria-labelledby={`stage-${id}-title`}
      data-shown={seen}
      className={cn(
        "journal-stage relative scroll-mt-20 py-14 md:py-20",
        dark && "bg-charcoal text-ivory",
        tone === "muted" && "bg-muted/60",
      )}
    >
      <div className="container relative mx-auto max-w-6xl px-4">
        {/* Rail segment + node */}
        <div aria-hidden="true" className="absolute inset-y-[-3.5rem] start-4 w-8 md:inset-y-[-5rem]">
          <span className={cn("absolute inset-y-0 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-s-2 border-dashed", dark ? "border-ivory/25" : "border-foreground/20")} />
          <span className="journal-rail-fill absolute start-1/2 top-0 w-[3px] -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-primary" />
        </div>

        <div className="ps-12 md:ps-14 lg:ps-16">
          <header className="relative mb-8 grid gap-6 md:mb-10 md:grid-cols-[1fr_auto] md:items-end">
            <span
              aria-hidden="true"
              className={cn(
                "journal-node absolute -start-12 top-0 grid h-8 w-8 place-items-center rounded-full border-2 font-display text-xs font-extrabold md:-start-14 lg:-start-16",
                dark ? "border-ivory/50 bg-charcoal text-ivory" : "border-foreground/40 bg-background text-foreground",
              )}
            >
              {stage.num}
            </span>
            <div>
              <p className={cn("flex items-center gap-3 text-sm font-bold", dark ? "text-primary" : "text-foreground/70")}>
                <span className="font-display text-base">{isAr ? `المحطة ${num(Number(stage.num), true)}` : `Stop ${stage.num}`}</span>
                <span aria-hidden="true" className={cn("h-px w-8", dark ? "bg-ivory/30" : "bg-charcoal/25")} />
                <span>{stage.short[L]}</span>
              </p>
              <div className="mt-3 flex items-center gap-4">
                <KloverIcon name={stage.icon} className={cn("journal-icon h-14 w-14 sm:h-16 sm:w-16", dark && "rounded-2xl bg-ivory p-1")} />
                <h2 id={`stage-${id}-title`} className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  {stage.title[L]}
                </h2>
              </div>
              <p className={cn("mt-4 max-w-2xl text-base leading-relaxed sm:text-lg", dark ? "text-ivory/80" : "text-muted-foreground")}>
                {stage.blurb[L]}
              </p>
            </div>
            {aside ?? (stage.guide && <KlobiGuide pose={stage.guide.pose} line={stage.guide.line[L]} tone={dark ? "dark" : "light"} />)}
          </header>

          {children}

          {count > 0 && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => onSeeAll(id)}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dark ? "border-ivory/30 text-ivory hover:bg-ivory/10" : "border-foreground/25 bg-card text-foreground hover:bg-muted",
                )}
              >
                {isAr ? `كل مقالات هذه المحطة (${num(count, true)})` : `All articles in this stop (${count})`}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

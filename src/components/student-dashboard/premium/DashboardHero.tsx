import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LEAGUES } from "@/constants/gamification";
import { leagueName } from "@/lib/dashboardLocale";
import type { StreakState, XpStatus } from "@/lib/dashboardProgress";
import { dashEvent } from "@/lib/dashboardEvents";
import { useDashCopy, fmt, arCount } from "./copy";
import { BrandIcon, ClubyNote, ProgressBar } from "./primitives";

export interface HeroProps {
  firstName: string;
  todayLabel: string;
  xp: XpStatus;
  streak: number;
  streakState: StreakState;
  continueHref: string;
  continueBook: string | null;
  continueLesson: number | null;
  hasStarted: boolean;
  /** Existing profile-completion avatar (kept from the old hero). */
  avatarSlot?: React.ReactNode;
  /** Canon: Cluby only appears once his egg has hatched. */
  clubyAwake: boolean;
}

/**
 * A. Compact hero — where am I, how close is the next level, one action.
 * No other CTA lives here; export and account links moved to the bottom.
 */
export function DashboardHero(p: HeroProps) {
  const { c, lang } = useDashCopy();
  const next = p.xp.nextLeagueKey ? LEAGUES.find(l => l.key === p.xp.nextLeagueKey) : null;
  const current = LEAGUES.find(l => l.key === p.xp.leagueKey);

  const cluby = (() => {
    // "Missions complete" is Cluby's line in the missions card, not repeated here.
    if (next && p.xp.remaining > 0 && p.xp.remaining <= 50) return c("clubyAlmost");
    if (p.streakState === "active_today" && p.streak >= 2) return c("clubyStreak", { n: p.streak, days: arCount(p.streak, "days") });
    if (p.streakState === "at_risk") return c("clubyAtRisk");
    return c("clubyHello");
  })();

  const streakText = p.streak > 0 ? c("streakDays", { n: p.streak, days: arCount(p.streak, "days") }) : c("streakNone");

  return (
    <section aria-labelledby="dash-hero-title" className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-card px-5 py-5 sm:px-7 sm:py-6">
      {/* One quiet brand stroke: the yellow edge, not a yellow block. */}
      <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5 bg-primary" />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {p.avatarSlot}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{p.todayLabel}</p>
              <h1 id="dash-hero-title" className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl break-words">
                {c("welcomeBack", { name: "⁨" + p.firstName + "⁩" })}
              </h1>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {/* XP league (the gamification ladder). Deliberately NOT called
                "Level" — Level 1–6 is the course level shown on the journey map. */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-display font-semibold text-foreground">
              <BrandIcon name="achievement-star" className="h-5 w-5" eager />
              <span>{leagueName(current ?? null, lang)}</span>
              <span aria-hidden="true" className="font-sans text-xs font-medium text-foreground/70" dir="ltr">{c("levelOf", { n: p.xp.levelNumber, total: p.xp.levelCount })}</span>
              <span className="sr-only">{c("leagueRankAria", { n: p.xp.levelNumber, total: p.xp.levelCount })}</span>
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-3 py-1 font-medium text-foreground"
              title={p.streakState === "at_risk" ? c("streakAtRisk") : undefined}
            >
              <BrandIcon name="streak" className="h-5 w-5" eager />
              {streakText}
              {p.streakState === "at_risk" && <span className="text-muted-foreground">· {c("streakAtRisk")}</span>}
            </span>
          </div>

          <div className="mt-4 max-w-xl">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-display font-semibold text-foreground">
                <bdi dir="ltr" className="tabular-nums">
                  {fmt(p.xp.totalXp, lang)}{p.xp.nextXp !== null && <> / {fmt(p.xp.nextXp, lang)}</>}
                </bdi>{" "}
                {c("xpUnit")}
                {p.xp.nextXp === null && <span className="font-sans font-normal text-muted-foreground"> · {c("xpTop")}</span>}
              </span>
              {next && (
                <span className="text-end text-muted-foreground">
                  {c("xpToNext", { n: fmt(p.xp.remaining, lang), league: leagueName(next, lang) })}
                </span>
              )}
            </div>
            <ProgressBar
              value={p.xp.pct}
              label={c("xpBarLabel")}
              valueText={p.xp.nextXp === null ? `${p.xp.totalXp} XP` : `${p.xp.totalXp} / ${p.xp.nextXp} XP`}
            />
          </div>

          <Link
            to={p.continueHref}
            onClick={() => dashEvent({ name: "continue_learning_click", source: "hero", book: p.continueBook, lesson: p.continueLesson })}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-display text-base font-semibold text-foreground ring-1 ring-foreground/15 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground sm:w-auto"
          >
            {p.hasStarted ? c("continueLearning") : c("startLearning")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        {p.clubyAwake && (
          <ClubyNote text={cluby} lang={lang} alt={c("clubyAlt")} className="hidden shrink-0 flex-col-reverse items-center sm:flex" />
        )}
      </div>
    </section>
  );
}

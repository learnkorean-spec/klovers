import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BADGES } from "@/constants/gamification";
import { badgeText } from "@/lib/dashboardLocale";
import { badgeIcon, nextUnlock, type EarnedBadge, type MilestoneRow } from "@/lib/dashboardProgress";
import { dashEvent } from "@/lib/dashboardEvents";
import { cn } from "@/lib/utils";
import { useDashCopy, fmt, arCount } from "./copy";
import { BrandIcon, ClubyNote, ProgressBar } from "./primitives";

const SLOTS = 10;

/**
 * E. Collection + next unlock. The collection is the student's real badges
 * (student_badges); the "next unlock" is the closest unfinished achievement
 * milestone (achievement_milestones, kept current server-side). No Cluby
 * variants, vouchers, classes or gifts are shown because none exist in the
 * backend yet — see the PR notes for the Cluby-collection data gap.
 */
export function CollectionCard({
  earned, milestones, clubyAwake = true,
}: { earned: EarnedBadge[]; milestones: MilestoneRow[]; clubyAwake?: boolean }) {
  const { c, lang } = useDashCopy();
  const ref = useRef<HTMLElement>(null);
  const earnedKeys = new Set(earned.map(e => e.badge_key));
  const owned = BADGES.filter(b => earnedKeys.has(b.key));
  const locked = BADGES.filter(b => !earnedKeys.has(b.key));
  const shown = [...owned.map(b => ({ b, has: true })), ...locked.map(b => ({ b, has: false }))].slice(0, SLOTS);
  const next = nextUnlock(milestones);
  const recent = earned.some(e => e.earned_at && Date.now() - new Date(e.earned_at).getTime() < 48 * 3600 * 1000);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        dashEvent({ name: "reward_progress_viewed", milestone: next ? `${next.milestone_type}:${next.milestone_tier}` : null, badges: owned.length });
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
    // fire once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const msLabel = (m: MilestoneRow) => {
    const n = m.target_value;
    switch (m.milestone_type) {
      case "lessons_completed": return c("ms_lessons_completed", { n, lessons: arCount(n, "lessons") });
      case "streak_days": return c("ms_streak_days", { n, days: arCount(n, "days") });
      case "vocabulary_mastered": return c("ms_vocabulary_mastered", { n: fmt(n, lang) });
      case "xp_earned": return c("ms_xp_earned", { n: fmt(n, lang) });
      default: return m.milestone_name;
    }
  };

  return (
    <section ref={ref} aria-labelledby="dash-collection-title" className="flex min-w-0 flex-col rounded-[20px] border border-foreground/10 bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BrandIcon name="reward-gift" className="h-9 w-9" />
          <h2 id="dash-collection-title" className="font-display text-lg font-semibold text-foreground">{c("collectionTitle")}</h2>
        </div>
        <span className="font-display text-sm font-semibold tabular-nums text-foreground">{c("collectionCount", { n: owned.length, total: BADGES.length })}</span>
      </div>

      <ul className="mt-4 grid grid-cols-5 gap-2">
        {shown.map(({ b, has }) => {
          const name = badgeText(b, lang).name;
          return (
            <li
              key={b.key}
              title={has ? name : c("lockedBadge", { name })}
              className={cn(
                "grid aspect-square place-items-center rounded-xl border",
                has ? "border-foreground/15 bg-background" : "border-dashed border-foreground/15 bg-muted/40",
              )}
            >
              <BrandIcon name={badgeIcon(b.key)} className={cn("h-8 w-8 sm:h-9 sm:w-9", !has && "opacity-25 grayscale brightness-0")} />
              <span className="sr-only">{has ? name : c("lockedBadge", { name })}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-xl bg-background p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c("nextUnlock")}</p>
        {next ? (
          <>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{msLabel(next)}</p>
              <span className="shrink-0 text-sm tabular-nums text-foreground" dir="ltr">{fmt(next.progress_value, lang)} / {fmt(next.target_value, lang)}</span>
            </div>
            <ProgressBar className="mt-2" size="sm" value={next.pct} label={c("nextUnlock")} valueText={`${next.progress_value} / ${next.target_value}`} />
            <p className="mt-1.5 text-xs text-muted-foreground">{c("nextLeft", { n: fmt(next.left, lang) })}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{c("nextNone")}</p>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 sm:mt-auto sm:pt-3">
        <Link to="/textbook/progress" className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded">
          {c("viewAll")}
        </Link>
        {recent && clubyAwake && <ClubyNote text={c("clubyFound")} lang={lang} size="sm" pose="star" alt={c("clubyAlt")} />}
      </div>
    </section>
  );
}

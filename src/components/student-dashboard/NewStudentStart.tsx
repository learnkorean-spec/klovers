import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import { useDashCopy } from "@/components/student-dashboard/premium/copy";
import { dashEvent } from "@/lib/dashboardEvents";
import type { BrandIconName } from "@/lib/dashboardProgress";

interface Props {
  /** Short label of the level the placement test wrote, or null if not taken. */
  levelLabel: string | null;
  /** Where "start the lesson" goes: the same lesson the hero would open. */
  lessonHref: string;
}

/**
 * What a brand-new student sees on Today instead of the full dashboard:
 * three steps, in the order they matter, and nothing else.
 *
 * Shown only while the student has not enrolled, has nothing pending and has
 * not opened a single lesson or earned any XP (see `starter` in
 * StudentDashboard). The first lesson she opens ends this mode by itself, so
 * there is no flag to store and nothing to dismiss. The other three tabs
 * stay available throughout: nothing is taken away, it is just not all on
 * the first screen.
 */
export function NewStudentStart({ levelLabel, lessonHref }: Props) {
  const { c } = useDashCopy();
  const levelDone = !!levelLabel;

  const steps: {
    key: "level" | "lesson" | "trial";
    icon: BrandIconName;
    title: string;
    body: string;
    cta: string;
    to: string;
    done: boolean;
  }[] = [
    {
      key: "level", icon: "placement", to: "/placement-test", done: levelDone,
      title: c("startLevelTitle"),
      body: levelDone ? c("startLevelDone", { level: levelLabel! }) : c("startLevelBody"),
      cta: c("startLevelCta"),
    },
    {
      key: "lesson", icon: "open-book", to: lessonHref, done: false,
      title: c("startLessonTitle"), body: c("startLessonBody"), cta: c("startLessonCta"),
    },
    {
      key: "trial", icon: "teacher", to: "/free-trial", done: false,
      title: c("startClassTitle"), body: c("startClassBody"), cta: c("startClassCta"),
    },
  ];
  const nextKey = steps.find(s => !s.done)?.key;

  return (
    <section aria-labelledby="dash-start-title" className="space-y-3">
      <div>
        <h2 id="dash-start-title" className="font-display text-xl font-bold text-foreground">{c("startTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c("startBody")}</p>
      </div>
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const isNext = s.key === nextKey;
          return (
            <li
              key={s.key}
              className={`flex flex-col gap-3 rounded-[20px] border bg-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${isNext ? "border-charcoal/40 ring-1 ring-charcoal/10" : "border-foreground/10"}`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                <BrandIcon name={s.icon} className="h-12 w-12 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{c("startStepOf", { n: i + 1 })}</p>
                  <h3 className="font-display text-base font-bold leading-tight text-foreground">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </div>
              {s.done ? (
                <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full bg-muted px-4 text-sm font-semibold text-foreground sm:self-auto">
                  <Check className="h-4 w-4" aria-hidden="true" /> {c("startDone")}
                </span>
              ) : (
                <Link
                  to={s.to}
                  data-track={`starter_${s.key}`}
                  onClick={() => dashEvent({ name: "starter_step_click", step: s.key })}
                  className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border-2 px-6 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isNext ? "border-klovers-yellow bg-klovers-yellow text-charcoal hover:brightness-95" : "border-foreground/20 bg-card text-foreground hover:bg-muted"}`}
                >
                  {s.cta}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <Link
        to="/enroll-now"
        data-track="starter_enroll"
        onClick={() => dashEvent({ name: "starter_step_click", step: "enroll" })}
        className="inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      >
        {c("startEnrollLink")}
      </Link>
    </section>
  );
}

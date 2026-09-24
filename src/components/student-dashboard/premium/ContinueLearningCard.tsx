import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLevelShortLabel, LEVELS } from "@/constants/levels";
import { bookName, type ContinueLesson } from "@/lib/dashboardProgress";
import { dashEvent } from "@/lib/dashboardEvents";
import { useDashCopy } from "./copy";
import { BrandIcon, ProgressBar } from "./primitives";

/**
 * D. Continue learning — the one lesson to open next, straight from the
 * student's own progress rows. No time estimate is shown: lessons carry no
 * duration field, and a guessed "12 min" would be fake product state.
 */
export function ContinueLearningCard({
  next, loading, error, onRetry,
}: { next: ContinueLesson | null; loading: boolean; error: boolean; onRetry: () => void }) {
  const { c, lang } = useDashCopy();

  return (
    <section aria-labelledby="dash-continue-title" className="flex min-w-0 flex-col rounded-[20px] border border-foreground/10 bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <BrandIcon name="open-book" className="h-9 w-9" eager />
        <h2 id="dash-continue-title" className="font-display text-lg font-semibold text-foreground">{c("continueEyebrow")}</h2>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-12 w-40" />
        </div>
      ) : error ? (
        <div className="mt-4 space-y-3" role="alert">
          <p className="text-sm text-muted-foreground">{c("loadError")}</p>
          <button onClick={onRetry} className="min-h-11 rounded-xl border border-foreground/20 px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            {c("retry")}
          </button>
        </div>
      ) : !next ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">{c("noLesson")}</p>
          <Link to="/textbook" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-display font-semibold text-foreground ring-1 ring-foreground/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground">
            {c("openLibrary")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ContinueBody next={next} lang={lang} c={c} />
      )}
    </section>
  );
}

function ContinueBody({ next, lang, c }: { next: ContinueLesson; lang: "en" | "ar"; c: ReturnType<typeof useDashCopy>["c"] }) {
  const { lesson } = next;
  const title = (lang === "ar" ? lesson.title_ar || lesson.title_en : lesson.title_en) || "";
  const band = lesson.topik_level ?? 0;
  const levelKey = band === 0 ? "hangul" : `l${band}`;
  const levelLabel = LEVELS.some(l => l.key === levelKey) ? getLevelShortLabel(levelKey, lang) : "";
  const reason = next.reason === "in_progress" ? c("reasonInProgress") : next.reason === "next_after_completed" ? c("reasonNext") : c("reasonStart");

  return (
    <div className="mt-4 flex flex-1 flex-col">
      <p className="text-sm text-muted-foreground">
        {bookName(lesson.book, lang)}
        {levelLabel && <> · {levelLabel}</>}
      </p>
      <p className="mt-1 font-display text-sm font-semibold uppercase tracking-wide text-foreground/70">
        {c("lessonN", { n: lesson.sort_order })}
      </p>
      <h3 className="font-display text-xl font-bold leading-snug text-foreground sm:text-2xl break-words" dir="auto">{title}</h3>
      {lesson.title_ko && (
        <p className="mt-0.5 font-ko text-base text-foreground/80" lang="ko" dir="ltr">{lesson.title_ko}</p>
      )}

      <div className="mt-4">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 text-sm">
          <span className="text-muted-foreground">{reason}</span>
          <span className="whitespace-nowrap font-medium tabular-nums text-foreground">
            {next.stepsDone > 0 ? c("stepsProgress", { done: next.stepsDone, total: next.stepCount, pct: next.pct }) : c("notStarted")}
          </span>
        </div>
        <ProgressBar value={next.pct} size="sm" label={c("continueEyebrow")} valueText={`${next.pct}%`} />
      </div>

      <div className="mt-5 sm:mt-auto sm:pt-5">
        <Link
          to={next.href}
          onClick={() => dashEvent({ name: "continue_learning_click", source: "card", book: lesson.book, lesson: lesson.sort_order })}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-display text-base font-semibold text-foreground ring-1 ring-foreground/15 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground sm:w-auto"
        >
          {next.stepsDone > 0 ? c("continueBtn") : c("startBtn")}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

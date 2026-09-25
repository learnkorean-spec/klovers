import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import KloverIcon from "@/components/KloverIcon";
import { STAGES, type StageId } from "@/constants/blogJourney";
import { journeyXp, useJourneyProgress } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";
import { KlobiFigure, Ko, num } from "./shared";

/**
 * The end of the page, before the site-wide FinalCTA: where you are, what you
 * collected, and one soft next step. If stops are still unvisited it points at
 * the next one; once all six are seen it points at the real thing — a class.
 */
export default function JourneyMilestone({ isAr, onGoToStage }: { isAr: boolean; onGoToStage: (id: StageId) => void }) {
  const p = useJourneyProgress();
  const nextStage = useMemo(() => STAGES.find((s) => !p.stopsSeen.includes(s.id)), [p.stopsSeen]);
  const recent = p.words.slice(-6).reverse();

  return (
    <section aria-labelledby="milestone-title" className="py-14 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 sm:p-10">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-start">
            <div className="flex shrink-0 items-end" aria-hidden="true">
              <KloverIcon name="student-girl-heart" className="h-16 w-16 sm:h-20 sm:w-20" />
              <KlobiFigure pose="wave" className="-mx-2 h-20 w-auto sm:h-24" />
              <KloverIcon name="student-boy-thumbsup" className="h-16 w-16 sm:h-20 sm:w-20" />
            </div>
            <div className="flex-1">
              <h2 id="milestone-title" className="font-display text-2xl font-extrabold sm:text-3xl">
                {nextStage
                  ? isAr ? "الرحلة مستمرة" : "Your journey continues"
                  : p.articlesRead.length === 0
                    ? isAr ? "مرّت الرحلة بكل المحطات، والخطوة التالية اختيار قصة للبدء" : "You've passed every stop — pick a story to begin"
                    : isAr ? "اكتملت زيارة كل محطات الرحلة!" : "You've visited every stop!"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {isAr
                  ? `${num(p.articlesRead.length, true)} مقالة مكتملة · ${num(p.words.length, true)} كلمة في المجموعة · ${num(journeyXp(p), true)} نقطة`
                  : `${p.articlesRead.length} articles finished · ${p.words.length} words collected · ${journeyXp(p)} XP`}
              </p>
            </div>
          </div>

          {recent.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-foreground/70">{isAr ? "أحدث الكلمات" : "Your latest words"}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {recent.map((w) => (
                  <li key={w.ko} className="rounded-2xl border border-border bg-background px-3.5 py-2">
                    <Ko className="text-lg font-black">{w.ko}</Ko>
                    {w.meaning && <span className="ms-2 text-sm text-muted-foreground">{w.meaning}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {nextStage && (
              <Button size="lg" className="h-12 rounded-full px-7 font-bold" onClick={() => onGoToStage(nextStage.id)}>
                {isAr ? `متابعة الرحلة: ${nextStage.title.ar}` : `Continue: ${nextStage.title.en}`}
              </Button>
            )}
            <Button asChild size="lg" variant={nextStage ? "outline" : "default"} className="h-12 rounded-full border-foreground/30 px-7 font-bold">
              <Link to="/free-trial" onClick={() => trackJourney("course_cta_clicked", { cta: "milestone_free_trial" })}>
                {isAr ? "بدء تعلّم الكورية مع مدرّس" : "Start learning Korean with a teacher"}
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{isAr ? "الحصة الأولى مجانية، دون بطاقة بنكية." : "Your first class is free — no card needed."}</p>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

type LearningSummary = { completed: number; started: number; total: number };

/** Library entry point, not a guessed last-visited book or lesson. */
export default function DashboardLearningCard({ userId }: { userId: string }) {
  const { t, tInterpolate } = useLanguage();
  const [result, setResult] = useState<{ userId: string; summary: LearningSummary | null; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    if (!userId) return;
    const load = async () => {
      try {
        const [progress, lessons] = await Promise.all([
          supabase.from("student_lesson_progress")
            .select("lesson_id, chapter_completed, vocab_done, grammar_done, dialogue_done, exercises_done, reading_done, writing_done")
            .eq("user_id", userId),
          supabase.from("textbook_lessons").select("id").eq("is_published", true),
        ]);
        const progressError = progress.error ?? (Array.isArray(progress.data) ? null : { message: "missing data" });
        const lessonsError = lessons.error ?? (Array.isArray(lessons.data) ? null : { message: "missing data" });
        if (progressError || lessonsError) {
          throw new Error("Learning progress unavailable");
        }
        const published = new Set((lessons.data ?? []).map((lesson: { id: number }) => lesson.id));
        const saved = (progress.data ?? []).filter((row: { lesson_id: number }) => published.has(row.lesson_id));
        const summary = {
          total: published.size,
          completed: saved.filter((row: { chapter_completed: boolean }) => row.chapter_completed).length,
          started: saved.filter((row: { chapter_completed: boolean; vocab_done: boolean; grammar_done: boolean; dialogue_done: boolean; exercises_done: boolean; reading_done: boolean; writing_done: boolean }) =>
            !row.chapter_completed && (
              row.vocab_done || row.grammar_done || row.dialogue_done ||
              row.exercises_done || row.reading_done || row.writing_done
            )).length,
        };
        if (!cancelled) setResult({ userId, summary, error: false });
      } catch {
        if (!cancelled) setResult({ userId, summary: null, error: true });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [userId, attempt]);

  const current = result?.userId === userId ? result : null;
  const summary = current?.summary;
  const allCompleted = summary && summary.total > 0 && summary.completed === summary.total;
  let message = t("dashboardPage.loadingProgress");
  if (current?.error) message = t("dashboardPage.loadingError");
  else if (summary) {
    if (!summary.total) message = t("dashboardPage.noLessonsAvailable");
    else if (allCompleted) message = tInterpolate(t("dashboardPage.allLessonsCompleted"), { count: summary.total });
    else if (!summary.completed && !summary.started) message = t("dashboardPage.noProgressYet");
    else message = tInterpolate(t("dashboardPage.lessonsProgressMsg"), { completed: summary.completed, started: summary.started });
  }

  return (
    <section aria-labelledby="continue-learning-title" className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <KloverIcon name="books-stack" className="h-10 w-10 sm:h-12 sm:w-12" />
          <div className="min-w-0">
            <h2 id="continue-learning-title" className="text-lg font-bold">{t("dashboardPage.learningLibrary")}</h2>
            <p className="text-sm text-muted-foreground">{t("dashboardPage.libraryDesc")}</p>
            <p className="mt-2 text-xs text-muted-foreground" role="status">{message}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {current?.error && <Button variant="ghost" className="min-h-11" onClick={() => setAttempt(value => value + 1)}>{t("dashboardPage.retryProgress")}</Button>}
          <Button variant="outline" asChild className="min-h-11 w-full sm:w-auto">
            <Link to="/textbook">{t("dashboardPage.openTextbook")}<ChevronRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

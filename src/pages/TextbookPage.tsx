import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Trophy, Flame, Map, LayoutGrid, ArrowLeft, Sun, Clapperboard } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { LeagueProgressBar, LessonProgressDots, XpBadge } from "@/components/GamificationUI";
import { isBossChallenge, isCheckpointLesson } from "@/constants/gamification";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import WorldPathMap from "@/components/WorldPathMap";
import DailyRoutinePathMap from "@/components/DailyRoutinePathMap";
import { WORLDS } from "@/constants/worlds";
import { DAILY_ROUTINE_WORLDS } from "@/constants/dailyRoutineWorlds";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  description: string;
  title_ar?: string;
  description_ar?: string;
  sort_order: number;
  book?: string;
}

const BOOK_CONFIG: Record<string, { titleEn: string; titleAr: string; emoji: string; icon: typeof BookOpen }> = {
  "korean-1": { titleEn: "Korean Textbook", titleAr: "كتاب الكورية", emoji: "📘", icon: BookOpen },
  "daily-routine": { titleEn: "Daily Routine Korean", titleAr: "كورية الروتين اليومي", emoji: "☀️", icon: Sun },
};

const TextbookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const book = bookId || "korean-1";
  const config = BOOK_CONFIG[book] || BOOK_CONFIG["korean-1"];

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [viewMode, setViewMode] = useState<"path" | "grid">("path");
  const { userId, progress, league, loading: gamLoading } = useGamification();
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  useSEO({
    title: isAr ? config.titleAr : config.titleEn,
    description: `Learn Korean with the ${config.titleEn} on Klovers. Interactive lessons, gamified progress, and vocabulary review.`,
    canonical: `https://kloversegy.com/textbook/${book}`,
  });

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const query = supabase
          .from("textbook_lessons")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true });
        // Filter by book column (not in generated types yet)
        const { data, error } = await (query as any).eq("book", book);
        if (error) throw error;
        setLessons((data as unknown as Lesson[]) || []);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [book]);

  const completedCount = Object.values(progress.lessonProgress).filter(p => p.chapter_completed).length;
  const isDailyRoutine = book === "daily-routine";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16">
        {/* Back to library */}
        <section className="container mx-auto px-4 max-w-4xl mb-4">
          <Link to="/textbook" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة للمكتبة" : "Back to Library"}
          </Link>
        </section>

        {/* Hero */}
        <section className="text-center mb-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <config.icon className="h-4 w-4" />
            {config.emoji} {isAr ? config.titleAr : config.titleEn}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isAr ? config.titleAr : config.titleEn}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {isDailyRoutine
              ? `${DAILY_ROUTINE_WORLDS.length} ${isAr ? "عوالم" : "worlds"} · ${lessons.length} ${isAr ? "درس" : "lessons"}`
              : `${WORLDS.filter(w => w.topikLevel === 1).length} ${isAr ? "عوالم توبيك ١" : "TOPIK 1 worlds"} · ${WORLDS.filter(w => w.topikLevel === 2).length} ${isAr ? "عوالم توبيك ٢" : "TOPIK 2 worlds"} · ${lessons.length} ${t("textbook.heroSubtitle")}`
            }
          </p>
        </section>

        {/* Gamification Stats Bar */}
        {userId && !gamLoading && (
          <section className="container mx-auto px-4 max-w-4xl mb-8">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-4">
                  <XpBadge xp={progress.totalXp} className="text-sm px-3 py-1" />
                  <div className="flex items-center gap-1.5">
                    <Flame className={cn("h-5 w-5", progress.streak.current_streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                    <span className="text-sm font-bold text-foreground">{progress.streak.current_streak} {t("textbook.dayStreak")}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {league.emoji} {league.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{completedCount}/{lessons.length}</span>
                  <Link to="/textbook/progress" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Trophy className="h-4 w-4" /> {t("textbook.viewFullProgress")}
                  </Link>
                </div>
              </div>
              <LeagueProgressBar totalXp={progress.totalXp} />
            </div>
          </section>
        )}

        {/* View Toggle */}
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {viewMode === "path" ? <Map className="h-6 w-6 text-primary" /> : <LayoutGrid className="h-6 w-6 text-primary" />}
              {isAr ? "خريطة المهام" : "Mission Map"}
            </h2>
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              <Button
                variant={viewMode === "path" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("path")}
                className="gap-1.5"
              >
                <Map className="h-4 w-4" /> {isAr ? "مسار" : "Path"}
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="gap-1.5"
              >
                <LayoutGrid className="h-4 w-4" /> {isAr ? "شبكة" : "Grid"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-24 rounded-2xl mb-4" />
                  <div className="flex flex-col items-center gap-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-16 w-16 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div className="text-center py-16 rounded-2xl border border-destructive/20 bg-destructive/5">
              <p className="text-2xl mb-3">😕</p>
              <p className="font-semibold text-foreground mb-1">{isAr ? "تعذّر تحميل الدروس" : "Failed to load lessons"}</p>
              <p className="text-sm text-muted-foreground mb-4">{isAr ? "يرجى التحقق من اتصالك والمحاولة مرة أخرى." : "Please check your connection and try again."}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                {isAr ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          ) : viewMode === "path" ? (
            isDailyRoutine ? (
              <DailyRoutinePathMap
                lessons={lessons}
                lessonProgress={progress.lessonProgress}
                userId={userId}
                bookSlug={book}
              />
            ) : (
              <WorldPathMap
                lessons={lessons}
                lessonProgress={progress.lessonProgress}
                userId={userId}
              />
            )
          ) : (
            /* Grid view */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => {
                const lp = progress.lessonProgress[lesson.id];
                const completed = lp?.chapter_completed;
                const boss = isBossChallenge(lesson.sort_order);
                const checkpoint = isCheckpointLesson(lesson.sort_order);

                return (
                  <Link
                    key={lesson.id}
                    to={`/textbook/${book}/${lesson.sort_order}`}
                    className={cn(
                      "group block rounded-xl border p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
                      completed ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{lesson.emoji}</span>
                      {completed && <span className="text-primary text-lg">✓</span>}
                    </div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      {boss ? t("textbook.boss") : checkpoint ? t("textbook.checkpoint") : `${t("textbook.mission")} ${lesson.sort_order}`}
                    </p>
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-0.5">
                      {isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{lesson.title_ko}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {isAr && lesson.description_ar ? lesson.description_ar : lesson.description}
                    </p>
                    {lp && <LessonProgressDots progress={lp} />}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TextbookPage;

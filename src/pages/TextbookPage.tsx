import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Trophy, Flame, Zap } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { LeagueProgressBar, LessonProgressDots, XpBadge } from "@/components/GamificationUI";
import { isCheckpointLesson, isBossChallenge } from "@/constants/gamification";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  description: string;
  title_ar?: string;
  description_ar?: string;
  sort_order: number;
}

const TextbookPage = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, progress, league, loading: gamLoading } = useGamification();
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from("textbook_lessons")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      setLessons((data as unknown as Lesson[]) || []);
      setLoading(false);
    };
    fetchLessons();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="text-center mb-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            {t("textbook.heroBadge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("textbook.heroTitle1")}<br />
            <span className="text-primary italic">{t("textbook.heroTitle2")}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {lessons.length} {t("textbook.heroSubtitle")}
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
                <Link to="/textbook/progress" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Trophy className="h-4 w-4" /> {t("textbook.viewFullProgress")}
                </Link>
              </div>
              <LeagueProgressBar totalXp={progress.totalXp} />
            </div>
          </section>
        )}

        {/* Lessons Grid */}
        <section className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            {t("textbook.missions")}
          </h2>
          <p className="text-muted-foreground mb-8">{t("textbook.missionsSubtitle")}</p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => {
                const lp = progress.lessonProgress[lesson.id];
                const completed = lp?.chapter_completed;
                const boss = isBossChallenge(lesson.sort_order);
                const checkpoint = isCheckpointLesson(lesson.sort_order);

                return (
                  <Link
                    key={lesson.id}
                    to={`/textbook/${lesson.sort_order}`}
                    className={cn(
                      "group block rounded-xl border p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
                      completed ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{lesson.emoji}</span>
                      {completed && <span className="text-primary text-lg">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {boss ? t("textbook.boss") : checkpoint ? t("textbook.checkpoint") : `${t("textbook.mission")} ${lesson.sort_order}`}
                      </p>
                    </div>
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-0.5">
                      {lesson.title_en}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{lesson.title_ko}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {lesson.description}
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useGamification } from "@/hooks/useGamification";
import { fetchXpLeaderboard, toEntries, type LeaderboardEntryLike } from "@/lib/leaderboardApi";
import { LeagueProgressBar, LeagueCard, StreakDisplay, BadgeGrid, XpBadge, LessonProgressDots } from "@/components/GamificationUI";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Map, Award, Flame, Users, BookOpen, Check } from "lucide-react";
import { bookWorld } from "@/constants/bookWorlds";
import { LEAGUES, getLeague } from "@/constants/gamification";
import { WORLDS, getWorldProgress } from "@/constants/worlds";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";

// Shaped by toEntries() in @/lib/leaderboardApi. The old xp_leaderboard view is
// being dropped: it was security_invoker=true against own-row RLS, so it
// returned exactly one row to every student. The RPC returns no user_id at all
// (identity never leaves the server), so "is this me?" comes from is_me and the
// React key comes from rank.
type LeaderboardEntry = LeaderboardEntryLike;

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  sort_order: number;
  book: string;
}

const TextbookProgressPage = () => {
  const { userId, progress, league, loading } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    const fetchData = async () => {
      const [lbRes, lessonsRes] = await Promise.all([
        fetchXpLeaderboard(20),
        supabase.from("textbook_lessons").select("id, emoji, title_en, title_ko, sort_order, book").eq("is_published", true).order("sort_order"),
      ]);
      setLeaderboard(toEntries(lbRes));
      setLessons((lessonsRes.data as unknown as Lesson[]) || []);
    };
    fetchData();
  }, []);

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-3xl text-center">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isAr ? "التقدّم في التعلّم" : "Your Learning Progress"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isAr ? "تسجيل الدخول يتيح تتبّع نقاط XP وكسب الشارات والمنافسة في الترتيب." : "Sign in to track your XP, earn badges, and compete on the leaderboard!"}
          </p>
          <Link to="/login?redirect=/textbook/progress" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90">
            {isAr ? "تسجيل الدخول للبدء" : "Sign In to Start"}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <Skeleton className="h-32 w-full rounded-xl mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  const completedLessons = Object.values(progress.lessonProgress).filter(p => p.chapter_completed).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
        <Link to="/textbook" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          {isAr ? "→" : "←"} {isAr ? "العودة للكتاب" : "Back to Textbook"}
        </Link>

        {/* Hero Stats */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          {/* World mode: the main textbook's worlds begin in Hangul Village (see constants/bookWorlds.ts). */}
          {(() => {
            const world = bookWorld("korean-1");
            return (
              <div className="relative -mx-2 -mt-2 mb-4 h-24 overflow-hidden rounded-lg bg-ivory dark:bg-muted md:h-32">
                <img
                  src={world.image}
                  alt={isAr ? world.altAr : world.altEn}
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-3 text-sm text-white">
                  <span className="font-extrabold text-klovers-yellow">{isAr ? world.worldAr : world.worldEn}</span>
                  {" · "}
                  {isAr ? world.sceneAr : world.sceneEn}
                </p>
              </div>
            );
          })()}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" /> {isAr ? "تقدمي" : "My Progress"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedLessons} / {lessons.length} {isAr ? "مهمة مكتملة" : "missions completed"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <XpBadge xp={progress.totalXp} className="text-base px-3 py-1" />
              <StreakDisplay
                currentStreak={progress.streak.current_streak}
                longestStreak={progress.streak.longest_streak}
              />
            </div>
          </div>
          <LeagueProgressBar totalXp={progress.totalXp} />
        </div>

        <Tabs defaultValue="worlds" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="worlds" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Map className="h-4 w-4 hidden sm:block" /> {isAr ? "العوالم" : "Worlds"}
            </TabsTrigger>
            <TabsTrigger value="leagues" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="h-4 w-4 hidden sm:block" /> {isAr ? "الدوريات" : "Leagues"}
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="h-4 w-4 hidden sm:block" /> {isAr ? "الشارات" : "Badges"}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 hidden sm:block" /> {isAr ? "الترتيب" : "Leaderboard"}
            </TabsTrigger>
          </TabsList>

          {/* WORLDS OVERVIEW */}
          <TabsContent value="worlds">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" /> {isAr ? "خريطة العوالم" : "World Map"}
            </h2>
            <div className="space-y-4">
              {WORLDS.map((world) => {
                const wp = getWorldProgress(world, progress.lessonProgress as any, lessons);
                const isComplete = wp.percent === 100;
                const worldLessons = lessons.filter(
                  (l) => l.sort_order >= world.lessonRange[0] && l.sort_order <= world.lessonRange[1]
                );

                return (
                  <div
                    key={world.key}
                    className={cn(
                      "rounded-xl border p-5 transition-all",
                      isComplete ? "border-klovers-green bg-klovers-green/10 dark:bg-klovers-green/5" : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {/* needs Klovers icon: per-world icon (world.emoji is no longer drawn) */}
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted"><Map className="h-5 w-5 text-foreground" aria-hidden="true" /></span>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">
                          {isAr ? world.nameAr : world.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? world.descriptionAr : world.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{wp.completed}/{wp.total}</p>
                        {isComplete && <span className="ms-auto mt-1 grid h-5 w-5 place-items-center rounded-full bg-klovers-green text-charcoal"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-label={isAr ? "مكتمل" : "Completed"} /></span>}
                      </div>
                    </div>
                    <Progress value={wp.percent} className="h-2 mb-3" />
                    {/* Mini lesson dots */}
                    <div className="flex flex-wrap gap-1.5">
                      {worldLessons.map((l) => {
                        const done = progress.lessonProgress[l.id]?.chapter_completed;
                        return (
                          <Link
                            key={l.id}
                            to={`/textbook/${l.book}/${l.sort_order}`}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110",
                              done ? "bg-klovers-green text-charcoal font-bold" : "bg-muted text-muted-foreground"
                            )}
                            title={l.title_en}
                          >
                            {/* needs Klovers icon: per-lesson icon; the mission number stands in for l.emoji */}
                            {l.sort_order}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* LEAGUES */}
          <TabsContent value="leagues">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> {isAr ? "نظام الدوريات" : "League System"}
            </h2>
            <LeagueCard leagueKey={league.key} totalXp={progress.totalXp} />
          </TabsContent>

          {/* BADGES */}
          <TabsContent value="badges">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> {isAr ? "الإنجازات" : "Achievements"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {progress.badges.length} / {14} {isAr ? "شارة مكتسبة" : "badges earned"}
            </p>
            <BadgeGrid earnedBadges={progress.badges} detailed />
          </TabsContent>

          {/* LEADERBOARD */}
          <TabsContent value="leaderboard">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> {isAr ? "لوحة الترتيب" : "Leaderboard"}
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {isAr ? "لا يوجد متعلّمون في الترتيب بعد، والمركز الأول متاح." : "No learners on the leaderboard yet. Be the first!"}
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const entryLeague = getLeague(entry.value);
                  const isMe = entry.isCurrentUser;
                  return (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3",
                        isMe ? "border-klovers-yellow bg-klovers-yellow/15 dark:bg-klovers-yellow/10" : "border-border bg-card"
                      )}
                    >
                      <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                        {i < 3 ? (
                          <span
                            className={cn(
                              "mx-auto grid h-7 w-7 place-items-center rounded-full text-sm font-extrabold",
                              i === 0 ? "bg-klovers-yellow text-charcoal" : i === 1 ? "bg-charcoal text-klovers-yellow dark:ring-1 dark:ring-white/20" : "border border-charcoal/20 bg-ivory text-charcoal",
                            )}
                          >
                            {i + 1}
                          </span>
                        ) : `#${i + 1}`}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {entry.name || (isAr ? "متعلم مجهول" : "Anonymous Learner")} {isMe && <span className="text-xs text-primary">({isAr ? "أنت" : "you"})</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{entryLeague.name}</p>
                      </div>
                      <XpBadge xp={entry.value} />
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TextbookProgressPage;

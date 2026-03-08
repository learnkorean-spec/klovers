import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useGamification } from "@/hooks/useGamification";
import { LeagueProgressBar, LeagueCard, StreakDisplay, BadgeGrid, XpBadge, LessonProgressDots } from "@/components/GamificationUI";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Map, Award, Flame, Users, BookOpen } from "lucide-react";
import { LEAGUES, getLeague } from "@/constants/gamification";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_xp: number;
}

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  sort_order: number;
}

const TextbookProgressPage = () => {
  const { userId, progress, league, loading } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [lbRes, lessonsRes] = await Promise.all([
        supabase.from("xp_leaderboard").select("*").limit(20),
        supabase.from("textbook_lessons").select("id, emoji, title_en, title_ko, sort_order").eq("is_published", true).order("sort_order"),
      ]);
      setLeaderboard((lbRes.data as unknown as LeaderboardEntry[]) || []);
      setLessons((lessonsRes.data as unknown as Lesson[]) || []);
    };
    fetchData();
  }, []);

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl text-center">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Learning Progress</h1>
          <p className="text-muted-foreground mb-6">Sign in to track your XP, earn badges, and compete on the leaderboard!</p>
          <Link to="/login?redirect=/textbook/progress" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90">
            Sign In to Start
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
        <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
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
      <main className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
        <Link to="/textbook" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Back to Textbook</Link>

        {/* Hero Stats */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" /> My Progress
              </h1>
              <p className="text-sm text-muted-foreground">{completedLessons} / {lessons.length} missions completed</p>
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

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="map" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Map className="h-4 w-4 hidden sm:block" /> Progress Map
            </TabsTrigger>
            <TabsTrigger value="leagues" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="h-4 w-4 hidden sm:block" /> Leagues
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="h-4 w-4 hidden sm:block" /> Badges
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 hidden sm:block" /> Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* PROGRESS MAP */}
          <TabsContent value="map">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" /> Mission Map
            </h2>
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const lp = progress.lessonProgress[lesson.id];
                const isCompleted = lp?.chapter_completed;
                const isBoss = lesson.sort_order % 5 === 0;
                const isCheckpoint = lesson.sort_order % 3 === 0;

                return (
                  <Link
                    key={lesson.id}
                    to={`/textbook/${lesson.sort_order}`}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm ${
                      isCompleted ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20"
                    }`}
                  >
                    <span className="text-2xl w-10 text-center">{lesson.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary uppercase">
                          {isBoss ? "🐉 Boss" : isCheckpoint ? "🏁 Checkpoint" : `Mission ${lesson.sort_order}`}
                        </span>
                      </div>
                      <p className="font-medium text-foreground text-sm truncate">{lesson.title_en}</p>
                      <p className="text-xs text-muted-foreground">{lesson.title_ko}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <LessonProgressDots progress={lp} />
                      {isCompleted && <span className="text-primary text-lg">✓</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* LEAGUES */}
          <TabsContent value="leagues">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> League System
            </h2>
            <LeagueCard leagueKey={league.key} totalXp={progress.totalXp} />
          </TabsContent>

          {/* BADGES */}
          <TabsContent value="badges">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Achievements
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {progress.badges.length} / {14} badges earned
            </p>
            <BadgeGrid earnedBadges={progress.badges} />
          </TabsContent>

          {/* LEADERBOARD */}
          <TabsContent value="leaderboard">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Leaderboard
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No learners on the leaderboard yet. Be the first!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const entryLeague = getLeague(entry.total_xp);
                  const isMe = entry.user_id === userId;
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${
                        isMe ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {entry.name || "Anonymous Learner"} {isMe && <span className="text-xs text-primary">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{entryLeague.emoji} {entryLeague.name}</p>
                      </div>
                      <XpBadge xp={entry.total_xp} />
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

import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import KoreanMatchGame from "@/components/KoreanMatchGame";
import HangulQuizGame from "@/components/HangulQuizGame";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import { getLeagueProgress } from "@/constants/gamification";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, Brain, Layers, Hash, Palette, BookOpen, MessageCircle, ArrowLeftRight, PenLine, Shuffle, Calculator, Tv, Clock, Trophy, Zap, Flame, Lock, X } from "lucide-react";
import { toast } from "sonner";

const SentenceBuilderGame = lazy(() => import("@/components/games/SentenceBuilderGame"));
const NumbersGame = lazy(() => import("@/components/games/NumbersGame"));
const ColorMatchGame = lazy(() => import("@/components/games/ColorMatchGame"));
const VerbConjugationGame = lazy(() => import("@/components/games/VerbConjugationGame"));
const GreetingMasterGame = lazy(() => import("@/components/games/GreetingMasterGame"));
const OppositeWordsGame = lazy(() => import("@/components/games/OppositeWordsGame"));
const FillBlankGame = lazy(() => import("@/components/games/FillBlankGame"));
const WordScrambleGame = lazy(() => import("@/components/games/WordScrambleGame"));
const CounterWordsGame = lazy(() => import("@/components/games/CounterWordsGame"));
const KDramaQuizGame = lazy(() => import("@/components/games/KDramaQuizGame"));
const TimeTellerGame = lazy(() => import("@/components/games/TimeTellerGame"));

const FREE_GAME_IDS = ["match", "hangul"];

const GameFallback = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const GamesPage = () => {
  useSEO({ title: "Korean Learning Games", description: "Practice Korean with interactive games on Klovers. Memory match, Hangul quiz, word scramble, and more fun vocabulary games.", canonical: "https://kloversegy.com/games" });
  const [activeGame, setActiveGame] = useState<string>("match");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignupNudge, setShowSignupNudge] = useState(false);
  const { awardGameXp, progress, league } = useGamification();
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const games = [
    { id: "match", title: t("games.matchTitle"), description: t("games.matchDesc"), icon: Layers, emoji: "🃏", difficulty: t("games.beginner"), free: true },
    { id: "hangul", title: t("games.hangulTitle"), description: t("games.hangulDesc"), icon: Brain, emoji: "⚡", difficulty: t("games.beginner"), free: true },
    { id: "sentence", title: t("games.sentenceTitle"), description: t("games.sentenceDesc"), icon: PenLine, emoji: "🧩", difficulty: t("games.beginner"), free: false },
    { id: "numbers", title: t("games.numbersTitle"), description: t("games.numbersDesc"), icon: Hash, emoji: "🔢", difficulty: t("games.beginner"), free: false },
    { id: "colors", title: t("games.colorsTitle"), description: t("games.colorsDesc"), icon: Palette, emoji: "🎨", difficulty: t("games.beginner"), free: false },
    { id: "verbs", title: t("games.verbsTitle"), description: t("games.verbsDesc"), icon: BookOpen, emoji: "📝", difficulty: t("games.intermediate"), free: false },
    { id: "greetings", title: t("games.greetingsTitle"), description: t("games.greetingsDesc"), icon: MessageCircle, emoji: "👋", difficulty: t("games.beginner"), free: false },
    { id: "opposites", title: t("games.oppositesTitle"), description: t("games.oppositesDesc"), icon: ArrowLeftRight, emoji: "↔️", difficulty: t("games.intermediate"), free: false },
    { id: "fillblank", title: t("games.fillblankTitle"), description: t("games.fillblankDesc"), icon: PenLine, emoji: "✏️", difficulty: t("games.intermediate"), free: false },
    { id: "scramble", title: t("games.scrambleTitle"), description: t("games.scrambleDesc"), icon: Shuffle, emoji: "🔀", difficulty: t("games.beginner"), free: false },
    { id: "counters", title: t("games.countersTitle"), description: t("games.countersDesc"), icon: Calculator, emoji: "🔢", difficulty: t("games.intermediate"), free: false },
    { id: "kdrama", title: t("games.kdramaTitle"), description: t("games.kdramaDesc"), icon: Tv, emoji: "🎬", difficulty: t("games.beginner"), free: false },
    { id: "time", title: t("games.timeTitle"), description: t("games.timeDesc"), icon: Clock, emoji: "⏰", difficulty: t("games.beginner"), free: false },
  ];

  const handleGameComplete = useCallback(async (gameId: string, score: number, totalRounds: number) => {
    if (isLoggedIn) {
      const xp = await awardGameXp(gameId, score, totalRounds);
      if (xp && xp > 0) {
        toast.success(`🎮 +${xp} XP!`, { description: `${league.emoji} ${league.name}` });
      }
    } else {
      setShowSignupNudge(true);
    }
  }, [awardGameXp, league, isLoggedIn]);

  const selectGame = (id: string) => {
    setActiveGame(id);
    setTimeout(() => {
      document.getElementById("active-game-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const renderGame = () => {
    const isGameFree = FREE_GAME_IDS.includes(activeGame);
    const game = games.find(g => g.id === activeGame);

    if (!isLoggedIn && !isGameFree) {
      return (
        <div className="py-20 flex flex-col items-center gap-5 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">{game?.emoji} {game?.title} is for members</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Create a free account to unlock all 13 games, save your XP, and build your daily streak.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button size="lg" asChild>
              <a href="/signup">🚀 Sign Up Free</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/login">Log In</a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">No credit card needed · 2,000+ students already joined</p>
        </div>
      );
    }

    const onComplete = (score: number, total: number) => handleGameComplete(activeGame, score, total);
    switch (activeGame) {
      case "match": return <KoreanMatchGame onGameComplete={onComplete} />;
      case "hangul": return <HangulQuizGame onGameComplete={onComplete} />;
      case "sentence": return <Suspense fallback={<GameFallback />}><SentenceBuilderGame onGameComplete={onComplete} /></Suspense>;
      case "numbers": return <Suspense fallback={<GameFallback />}><NumbersGame onGameComplete={onComplete} /></Suspense>;
      case "colors": return <Suspense fallback={<GameFallback />}><ColorMatchGame onGameComplete={onComplete} /></Suspense>;
      case "verbs": return <Suspense fallback={<GameFallback />}><VerbConjugationGame onGameComplete={onComplete} /></Suspense>;
      case "greetings": return <Suspense fallback={<GameFallback />}><GreetingMasterGame onGameComplete={onComplete} /></Suspense>;
      case "opposites": return <Suspense fallback={<GameFallback />}><OppositeWordsGame onGameComplete={onComplete} /></Suspense>;
      case "fillblank": return <Suspense fallback={<GameFallback />}><FillBlankGame onGameComplete={onComplete} /></Suspense>;
      case "scramble": return <Suspense fallback={<GameFallback />}><WordScrambleGame onGameComplete={onComplete} /></Suspense>;
      case "counters": return <Suspense fallback={<GameFallback />}><CounterWordsGame onGameComplete={onComplete} /></Suspense>;
      case "kdrama": return <Suspense fallback={<GameFallback />}><KDramaQuizGame onGameComplete={onComplete} /></Suspense>;
      case "time": return <Suspense fallback={<GameFallback />}><TimeTellerGame onGameComplete={onComplete} /></Suspense>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 px-4 bg-muted/30">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/5 rounded-full -translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-primary/20 rounded-full animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-primary/15 rounded-full animate-pulse delay-500" />
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-primary/25 rounded-full animate-pulse delay-300" />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground border border-border px-4 py-2 rounded-full text-sm font-medium">
              <Gamepad2 className="h-4 w-4" />
              {t("games.learnPlay")}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {t("games.title")}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t("games.subtitle").replace("{count}", String(games.length))}
            </p>

            <div className="flex justify-center gap-4 pt-2" aria-hidden="true">
              {["가", "나", "다", "라", "마"].map((ch, i) => (
                <span key={ch} className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border shadow-sm text-xl font-bold text-foreground animate-bounce select-none"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: "2.5s" }}>{ch}</span>
              ))}
            </div>

            {/* Guest banner */}
            {!isLoggedIn && (
              <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <span>🎮 2 free games · </span>
                <a href="/signup" className="text-primary font-semibold hover:underline">Sign up to unlock all 13</a>
              </div>
            )}

            {/* Live user stats strip */}
            {isLoggedIn && progress.totalXp > 0 && (
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                  <span>{league.emoji}</span>
                  <span>{league.name}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 text-xs font-medium text-yellow-700">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{progress.totalXp.toLocaleString()} XP</span>
                </div>
                {progress.streak.current_streak > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-xs font-medium text-orange-700">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{progress.streak.current_streak} day streak</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Game selector */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              {games.map((game) => {
                const isActive = activeGame === game.id;
                const isLocked = !isLoggedIn && !game.free;
                return (
                  <button key={game.id} onClick={() => selectGame(game.id)} className="text-left">
                    <Card className={`p-4 transition-all duration-200 border-2 cursor-pointer h-full relative ${
                      isActive
                        ? "border-primary/50 bg-primary/5 shadow-md"
                        : isLocked
                        ? "border-border opacity-60 hover:opacity-80 hover:shadow-sm"
                        : "border-border hover:border-foreground/20 hover:shadow-sm"
                    }`}>
                      {isLocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {game.free && !isLoggedIn && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">FREE</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                          {game.emoji}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm">{game.title}</h3>
                            {isActive && (
                              <span className="text-[10px] bg-primary/20 text-foreground px-1.5 py-0.5 rounded-full font-medium">{t("games.playing")}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{game.description}</p>
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                            game.difficulty === t("games.intermediate") ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"
                          }`}>{game.difficulty}</span>
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Active game */}
        <div id="active-game-area" className="border-t border-border scroll-mt-20">
          {renderGame()}
        </div>
        <FinalCTA />
      </main>
      <Footer />

      {/* Signup nudge modal */}
      {showSignupNudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 relative">
            <button
              onClick={() => setShowSignupNudge(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="text-center space-y-2">
              <div className="text-4xl">🎉</div>
              <h2 className="text-xl font-bold text-foreground">Nice work!</h2>
              <p className="text-sm text-muted-foreground">Create a free account to save your progress and unlock all 13 games.</p>
            </div>

            <div className="space-y-2">
              {[
                { icon: "⭐", text: "Save your XP and streak" },
                { icon: "🔓", text: "Unlock all 13 Korean games" },
                { icon: "📊", text: "Track your learning progress" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-foreground">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <Button className="w-full" size="lg" asChild>
                <a href="/signup">🚀 Sign Up Free</a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/login">Already have an account? Log in</a>
              </Button>
            </div>

            <button
              onClick={() => setShowSignupNudge(false)}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              Continue playing as guest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;

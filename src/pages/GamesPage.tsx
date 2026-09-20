import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
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
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getLeagueProgress, BADGES } from "@/constants/gamification";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";
import { LeaguePromotionModal, BadgeUnlockToast, StreakCelebration, XpFloatAnimation, PerfectScoreOverlay } from "@/components/XpAnimation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, Trophy, Zap, Flame, Lock, X } from "lucide-react";
import { toast as sonnerToast } from "sonner";
// G0c funnel telemetry. logGameEvent, never logLeadEvent — the latter
// mirrors to the Meta Pixel / GA4 as a conversion. See leadTracking.ts.
import { logGameEvent } from "@/lib/leadTracking";
import GameIcon from "@/components/GameIcon";
// The two brand characters, inlined. See src/assets/characters.ts for why
// they are data URIs and why they are busts rather than full-body poses.
import { CHARACTER_GIRL, CHARACTER_BOY } from "@/assets/characters";

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
const TypeKoreanGame = lazy(() => import("@/components/games/TypeKoreanGame"));
const RomanizationGame = lazy(() => import("@/components/games/RomanizationGame"));
const FlashcardGame = lazy(() => import("@/components/games/FlashcardGame"));
const SpeedReadGame = lazy(() => import("@/components/games/SpeedReadGame"));
const ReadingChoiceGame = lazy(() => import("@/components/games/ReadingChoiceGame"));
const SentenceReadGame = lazy(() => import("@/components/games/SentenceReadGame"));
const PhonicsReadGame = lazy(() => import("@/components/games/PhonicsReadGame"));
const ConversationOrderGame = lazy(() => import("@/components/games/ConversationOrderGame"));
const StoryGapGame = lazy(() => import("@/components/games/StoryGapGame"));

/**
 * A guest who finishes a game is asked to sign up — once per browser session.
 *
 * It used to be once per completion, with the dismissal not remembered, so a
 * guest playing five games was asked five times. That was survivable when two
 * of twenty games were open to guests; ten are open now, so the same code
 * fires roughly five times as often at exactly the visitors this site is
 * trying not to annoy.
 *
 * sessionStorage rather than localStorage on purpose: someone who comes back
 * next week is a different visit and worth asking again. Someone playing four
 * games in one sitting is not.
 *
 * Both accessors swallow their errors. sessionStorage does not merely return
 * null in a locked-down privacy mode — accessing it throws — and a modal that
 * cannot be shown is a far better outcome than a page that cannot render. A
 * read that throws reports "not seen", so the failure mode is the old
 * behaviour rather than a nudge that never appears.
 */
const NUDGE_SEEN_KEY = "klovers.games.signupNudgeSeen";

const nudgeAlreadySeen = (): boolean => {
  try {
    return sessionStorage.getItem(NUDGE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const markNudgeSeen = (): void => {
  try {
    sessionStorage.setItem(NUDGE_SEEN_KEY, "1");
  } catch {
    /* privacy mode — the nudge simply reverts to once per completion */
  }
};

/** At or above this share of the rounds, the result is celebrated rather than consoled. */
const CHEER_THRESHOLD = 0.5;

const GameFallback = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * One full-screen celebration at a time.
 *
 * PerfectScoreOverlay, StreakCelebration and LeaguePromotionModal used to be
 * three independent `{condition && <Modal />}` blocks. A single game
 * completion can set all three (finish with a perfect score, on the day your
 * streak crosses a milestone, which also happens to push you into a new
 * league) and React would mount all three at once — same fixed inset-0 z-50,
 * so only the last one in DOM order painted on top, and dismissing it
 * revealed whatever was mounted underneath with no entrance animation,
 * because it had been sitting there at full opacity the whole time. That
 * reads as a glitch, not a celebration.
 *
 * This queues them instead: each becomes a step the moment its underlying
 * state goes truthy, de-duplicated so a step is only ever queued once, and
 * exactly one is ever rendered. Order is the order the three effects below
 * are declared — perfect score first (immediate per-game feedback), then
 * streak (a running habit), then league promotion last (the biggest, most
 * infrequent event, so it lands as the capstone rather than being buried).
 */
type CelebrationStep =
  | { type: "perfect"; score: number; total: number }
  | { type: "streak"; streak: number }
  | { type: "league"; from: string; to: string };

const GamesPage = () => {
  useSEO({ title: "Korean Learning Games", description: "Practice Korean with interactive games on Klovers. Memory match, Hangul quiz, word scramble, and more fun vocabulary games.", canonical: "https://kloversegy.com/games" });
  const [activeGame, setActiveGame] = useState<string>("match");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignupNudge, setShowSignupNudge] = useState(false);
  // The last finished round, kept only so the completion modal can pick which
  // character to lead with. Not persisted and not read anywhere else.
  const [lastResult, setLastResult] = useState<{ score: number; total: number } | null>(null);
  const { awardGameXp, progress, league, leaguePromotion, newBadges, streakCelebration, clearLeaguePromotion, clearNewBadges, clearStreakCelebration } = useGamification();
  const [xpFloat, setXpFloat] = useState<number | null>(null);
  const [showPerfectScore, setShowPerfectScore] = useState<{ score: number; total: number } | null>(null);
  const { xpLeaderboard, loading: lbLoading } = useLeaderboard();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  // "Top Players" names a board that has players on it. A signed-out visitor
  // is now shown an invitation rather than a board, so for them the heading
  // names the feature instead of claiming an occupied ranking.
  const leaderboardHeading = isLoggedIn
    ? (isAr ? "أفضل اللاعبين" : "Top Players")
    : (isAr ? "الترتيب" : "Leaderboard");

  // A round with no rounds in it, or none recorded, is not a failure worth
  // consoling — default to the cheer.
  const cheered =
    !lastResult || lastResult.total === 0 || lastResult.score / lastResult.total >= CHEER_THRESHOLD;

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeKey => {
        const badge = BADGES.find(b => b.key === badgeKey);
        if (badge) {
          toast({
            description: <BadgeUnlockToast badgeName={badge.name} badgeEmoji={badge.emoji} />,
            duration: 4000,
          });
        }
      });
      clearNewBadges();
    }
  }, [newBadges]);

  // --- Celebration queue (see the comment on CelebrationStep above) ---
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationStep[]>([]);

  // Enqueues a step, or — if one of the same type is already waiting in the
  // queue — refreshes it in place with the latest data instead of adding a
  // second one. That covers two game completions landing close together
  // (e.g. two league-ups before the first modal is dismissed): the student
  // sees one modal per type, always reflecting the most current state,
  // rather than a stale first promotion or a duplicate popup.
  const enqueueCelebration = useCallback((step: CelebrationStep) => {
    setCelebrationQueue(q => {
      const idx = q.findIndex(s => s.type === step.type);
      if (idx === -1) return [...q, step];
      const next = [...q];
      next[idx] = step;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!showPerfectScore) return;
    enqueueCelebration({ type: "perfect", score: showPerfectScore.score, total: showPerfectScore.total });
  }, [showPerfectScore, enqueueCelebration]);

  useEffect(() => {
    if (streakCelebration === null) return;
    enqueueCelebration({ type: "streak", streak: streakCelebration });
  }, [streakCelebration, enqueueCelebration]);

  useEffect(() => {
    if (!leaguePromotion) return;
    enqueueCelebration({ type: "league", from: leaguePromotion.fromLeague, to: leaguePromotion.toLeague });
  }, [leaguePromotion, enqueueCelebration]);

  const activeCelebration = celebrationQueue[0] ?? null;

  const advanceCelebration = useCallback(() => {
    if (!activeCelebration) return;
    // Clear the source state for the step that just finished — otherwise its
    // effect above would immediately re-queue it — then drop it off the front.
    if (activeCelebration.type === "perfect") setShowPerfectScore(null);
    if (activeCelebration.type === "streak") clearStreakCelebration();
    if (activeCelebration.type === "league") clearLeaguePromotion();
    setCelebrationQueue(q => q.slice(1));
  }, [activeCelebration, clearStreakCelebration, clearLeaguePromotion]);

  // G0c: arrival at /games. Ref-guarded because React StrictMode mounts
  // twice in development, and a doubled denominator is worse than none.
  const pageViewLogged = useRef(false);
  useEffect(() => {
    if (pageViewLogged.current) return;
    pageViewLogged.current = true;
    void logGameEvent({ source_type: "games_page_view" });

    // The default game renders on mount without selectGame ever running, so
    // without this it would be the one game with starts and completions
    // against zero opens — which is worse than missing data, because it is
    // shaped like data. It is also `match`: the first of the ten games
    // playable without an account, and therefore the likeliest first game
    // of the logged-out visitor this whole step exists to measure.
    void logGameEvent({ source_type: "game_opened", cta_label: activeGame });
    // activeGame is read once at mount on purpose — later changes come
    // through selectGame, which logs its own game_opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Titles/descriptions/difficulty labels are localized here because they
  // need `t()`; everything else (id, icon, emoji, free/gated status) comes
  // from GAMES_CATALOG, the one place that data is defined. See
  // src/constants/gamesList.ts.
  const games = GAMES_CATALOG.map(g => ({
    id: g.id,
    title: t(g.titleKey),
    description: t(g.descKey),
    icon: g.icon,
    emoji: g.emoji,
    difficulty: g.difficulty === "intermediate" ? t("games.intermediate") : t("games.beginner"),
  }));

  const handleGameComplete = useCallback(async (gameId: string, score: number, totalRounds: number) => {
    // Logged first and unconditionally: a score of 0, and a logged-out
    // player who earns no XP at all, are both exactly the signal G0c wants.
    // student_xp already records everyone who finished and was awarded.
    void logGameEvent({
      source_type: "game_completed",
      cta_label: gameId,
      metadata: { score, totalRounds },
    });

    setLastResult({ score, total: totalRounds });

    if (isLoggedIn) {
      const xp = await awardGameXp(gameId, score, totalRounds);
      if (xp && xp > 0) {
        setXpFloat(xp);
        sonnerToast.success(`🎮 +${xp} XP!`, { description: `${league.emoji} ${league.name}` });
      }
      // Show perfect score overlay
      if (score === totalRounds && totalRounds > 0) {
        setShowPerfectScore({ score, total: totalRounds });
      }
    } else if (!nudgeAlreadySeen()) {
      // Marked before showing, not on dismiss: the two dismiss paths and the
      // backdrop would each need to remember, and a guest who navigates away
      // with it open has still been asked.
      markNudgeSeen();
      setShowSignupNudge(true);
    }
  }, [awardGameXp, league, isLoggedIn]);

  // G0c: game_started fires on the first genuine interaction inside the game
  // area, never on mount — "opened it" and "actually played it" are the two
  // sides of the drop-off this whole step exists to measure, and a
  // mount-time event would collapse them into one.
  //
  // A capture-phase listener on the container gets this for all 20 games
  // without touching 20 components. The trade-off, stated plainly: it counts
  // the first click or keypress anywhere in the game area, so a click on an
  // inert part of a game's chrome also counts. That is still an interaction
  // with the game rather than a mount, which is the distinction being drawn.
  //
  // The locked-game placeholder renders in this same container, so the
  // playable check below keeps a click on the signup CTA out of the data.
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const startedForGame = useRef<string | null>(null);

  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;
    if (!isLoggedIn && !FREE_GAME_IDS.includes(activeGame)) return;

    const onFirstInteraction = () => {
      if (startedForGame.current === activeGame) return;
      startedForGame.current = activeGame;
      void logGameEvent({ source_type: "game_started", cta_label: activeGame });
    };

    el.addEventListener("pointerdown", onFirstInteraction, true);
    el.addEventListener("keydown", onFirstInteraction, true);
    return () => {
      el.removeEventListener("pointerdown", onFirstInteraction, true);
      el.removeEventListener("keydown", onFirstInteraction, true);
    };
  }, [activeGame, isLoggedIn]);

  const selectGame = (id: string) => {
    void logGameEvent({ source_type: "game_opened", cta_label: id });
    // Reset so a replay of the game already on screen can emit its own
    // game_started. Without this, re-selecting the active game raises
    // game_opened while activeGame never changes, the effect below never
    // re-runs, and the started/opened ratio silently understates replays.
    startedForGame.current = null;
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
            <h3 className="text-xl font-bold text-foreground">{game && <GameIcon id={game.id} className="mr-2 inline-block h-7 w-7 align-middle" />}{game?.title} {isAr ? "للأعضاء فقط" : "is for members"}</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              {isAr ? `أنشئ حساباً مجانياً لفتح جميع الألعاب الـ ${games.length}، حفظ XP الخاص بك، وبناء سلسلتك اليومية.` : `Create a free account to unlock all ${games.length} games, save your XP, and build your daily streak.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button size="lg" asChild>
              <a href="/signup">{isAr ? "🚀 سجّل مجاناً" : "🚀 Sign Up Free"}</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/login">{isAr ? "تسجيل الدخول" : "Log In"}</a>
            </Button>
          </div>
          {/* 200+, not 500+ — Re's figure, matching the hero strip and the rest
              of the site. Worth a second look regardless of the number: this
              line says "already joined", which scopes it to accounts on this
              platform, and the leaderboard comment further down this same file
              records that real platform activity is ~102 accounts. 200+ counts
              every student taught across 13 years. */}
          <p className="text-xs text-muted-foreground">{isAr ? "بدون بطاقة ائتمان · انضم أكثر من 200 طالب" : "No credit card needed · 200+ students already joined"}</p>
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
      case "typekorean": return <Suspense fallback={<GameFallback />}><TypeKoreanGame onGameComplete={onComplete} /></Suspense>;
      case "romanization": return <Suspense fallback={<GameFallback />}><RomanizationGame onGameComplete={onComplete} /></Suspense>;
      case "flashcard": return <Suspense fallback={<GameFallback />}><FlashcardGame onGameComplete={onComplete} /></Suspense>;
      case "speedread": return <Suspense fallback={<GameFallback />}><SpeedReadGame onGameComplete={onComplete} /></Suspense>;
      case "readingchoice": return <Suspense fallback={<GameFallback />}><ReadingChoiceGame onGameComplete={onComplete} /></Suspense>;
      case "sentenceread": return <Suspense fallback={<GameFallback />}><SentenceReadGame onGameComplete={onComplete} /></Suspense>;
      case "phonics": return <Suspense fallback={<GameFallback />}><PhonicsReadGame onGameComplete={onComplete} /></Suspense>;
      case "conversation": return <Suspense fallback={<GameFallback />}><ConversationOrderGame onGameComplete={onComplete} /></Suspense>;
      case "storygap": return <Suspense fallback={<GameFallback />}><StoryGapGame onGameComplete={onComplete} /></Suspense>;
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
              {t("games.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
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
                <span>{isAr ? `🎮 ${FREE_GAME_IDS.length} ألعاب مجانية · ` : `🎮 ${FREE_GAME_IDS.length} free games · `}</span>
                <a href="/signup" className="text-amber-700 font-semibold hover:underline">{isAr ? `سجّل لفتح جميع الألعاب الـ ${games.length}` : `Sign up to unlock all ${games.length} games`}</a>
              </div>
            )}

            {/* Live user stats strip */}
            {isLoggedIn && progress.totalXp > 0 && (
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                  <span>{league.emoji}</span>
                  <span>{league.name}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-full px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-200 ring-1 ring-black/10">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{progress.totalXp.toLocaleString()} XP</span>
                </div>
                {progress.streak.current_streak > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-full px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-200">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{progress.streak.current_streak} {isAr ? "يوم متتالي" : "day streak"}</span>
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
                // Derived, not stored. The padlock, the FREE badge and the play
                // gate in renderGame() now all read the same array, so a card
                // cannot advertise FREE and then refuse to open.
                const isFree = FREE_GAME_IDS.includes(game.id);
                const isLocked = !isLoggedIn && !isFree;
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
                      {isFree && !isLoggedIn && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full font-medium">{isAr ? "مجاني" : "FREE"}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <GameIcon id={game.id} className="h-10 w-10" />
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

        {/* Leaderboard — the real board for signed-in students, an invitation for
            guests.

            Guests used to be shown five invented people with invented XP
            totals behind a gradient fade, as though a busy board were being
            previewed. No such players existed: real activity is 70 game plays
            across five months and 4 students active in the last 30 days.
            Because the rows were static they never changed between visits,
            which is also how a visitor would work it out. Opening ten games to
            guests raised the number of people seeing it, so it is gone rather
            than deferred.

            Nothing replaces it with a different number. There is no honest
            "N players" to show at this volume, and the empty state does not
            need one to ask for a signup. */}
        <section className="py-8 px-4 bg-muted/20 border-t border-border">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> {leaderboardHeading}
              </h2>
              {!isLoggedIn && (
                <a href="/signup" className="text-xs text-amber-700 font-semibold hover:underline">{isAr ? "سجّل للانضمام ←" : "Sign up to join →"}</a>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              {isLoggedIn ? (
                <div className="divide-y divide-border">
                  {lbLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">{isAr ? "جارٍ تحميل الترتيب..." : "Loading leaderboard…"}</div>
                  ) : xpLeaderboard.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد بيانات بعد. العب لكسب XP!" : "No data yet. Play games to earn XP!"}</div>
                  ) : (
                    xpLeaderboard.slice(0, 10).map((p, idx) => {
                      const rankEmojis = ["🥇", "🥈", "🥉"];
                      const emoji = idx < 3 ? rankEmojis[idx] : `${idx + 1}`;
                      return (
                        <div key={p.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${p.isCurrentUser ? "bg-amber-50" : ""}`}>
                          <span className="text-base w-6 text-center font-bold">{emoji}</span>
                          <span className={`flex-1 text-sm font-medium ${p.isCurrentUser ? "text-amber-700 font-bold" : "text-foreground"}`}>
                            {p.name}{p.isCurrentUser ? (isAr ? " (أنت)" : " (you)") : ""}
                          </span>
                          <span className="text-xs text-yellow-700 dark:text-yellow-200 font-semibold bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-2 py-0.5 rounded-full ring-1 ring-black/10">
                            {p.value.toLocaleString()} XP
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="py-8 px-6 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {isAr
                      ? "سجّل عشان تبدأ تجمع نقط وتدخل الترتيب."
                      : "Sign up to start earning XP and take your place on the leaderboard."}
                  </p>
                  <a
                    href="/signup"
                    className="text-xs bg-amber-500 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-amber-600 transition-colors shadow-md border border-black/15"
                  >
                    {isAr ? "🏆 سجّل لرؤية ترتيبك" : "🏆 Sign up to see your rank"}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Active game.

            The id and the ref are on different elements on purpose. selectGame
            scrolls to the id, so the host has to be inside it or picking a game
            scrolls straight past her. gameAreaRef carries the capture-phase
            listener that raises game_started on first interaction, so the host
            has to be OUTSIDE it — tapping a speech bubble is not playing a
            game, and counting it as one would put the same "shaped like data"
            noise into the funnel that the listener's own comment warns about. */}
        <div id="active-game-area" className="border-t border-border scroll-mt-20">
          {/* The host. Rendered only where a game will actually appear: the
              locked-game wall is its own message and does not want a second
              voice above it. */}
          {(isLoggedIn || FREE_GAME_IDS.includes(activeGame)) && (
            <div className="max-w-2xl mx-auto px-4 pt-6 flex items-center gap-3">
              <img
                src={CHARACTER_GIRL}
                alt=""
                aria-hidden="true"
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className="w-14 h-14 rounded-full border-[3px] border-[#FCFD01] shadow-sm shrink-0"
              />
              <p className="bg-muted text-foreground rounded-2xl px-4 py-2.5 text-sm">
                {isAr ? "يلا نشوف إنت فاكر إيه 👀" : "Let's see what you remember 👀"}
              </p>
            </div>
          )}
          <div ref={gameAreaRef}>
            {renderGame()}
          </div>
        </div>
        <FinalCTA />
      </main>
      <Footer />

      {/* Exactly one of these renders at a time — see the CelebrationStep
          comment above for why. */}
      {activeCelebration?.type === "perfect" && (
        <PerfectScoreOverlay
          score={activeCelebration.score}
          total={activeCelebration.total}
          onContinue={advanceCelebration}
        />
      )}
      {activeCelebration?.type === "streak" && (
        <StreakCelebration currentStreak={activeCelebration.streak} onContinue={advanceCelebration} />
      )}
      {activeCelebration?.type === "league" && (
        <LeaguePromotionModal
          fromLeague={activeCelebration.from}
          toLeague={activeCelebration.to}
          onClose={advanceCelebration}
        />
      )}

      {/* Rendered after the celebration block on purpose. A perfect score sets
          xpFloat and enqueues the "perfect" step in the same handleGameComplete
          call, so both are truthy together for the celebration's full 1.5s —
          and both are `fixed inset-0 z-50`. With this mounted first (as it used
          to be), the celebration's near-opaque backdrop painted over it and the
          floating "+XP" was never seen on exactly the run where it mattered
          most. Painting it last (still pointer-events-none, so it never blocks
          the celebration's own Continue button) puts it on top instead. */}
      {xpFloat !== null && <XpFloatAnimation xp={xpFloat} onComplete={() => setXpFloat(null)} />}

      {/* Signup nudge modal — guests only, once per session (see NUDGE_SEEN_KEY). */}
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
              {/* Decorative: the heading right below carries the same meaning. */}
              <img
                src={cheered ? CHARACTER_GIRL : CHARACTER_BOY}
                alt=""
                aria-hidden="true"
                width={96}
                height={96}
                decoding="async"
                className="w-24 h-24 rounded-full border-4 border-[#FCFD01] shadow-md mx-auto"
              />
              <h2 className="text-xl font-bold text-foreground">
                {cheered
                  ? (isAr ? "أحسنت! 잘했어요" : "Nice work! 잘했어요")
                  : (isAr ? "قربت! جرّب تاني" : "So close — try again!")}
              </h2>
              <p className="text-sm text-muted-foreground">{isAr ? `أنشئ حساباً مجانياً لحفظ تقدمك وفتح جميع الألعاب الـ ${games.length}.` : `Create a free account to save your progress and unlock all ${games.length} games.`}</p>
            </div>

            <div className="space-y-2">
              {[
                { icon: "⭐", text: isAr ? "احفظ XP وسلسلتك" : "Save your XP and streak" },
                { icon: "🔓", text: isAr ? `افتح جميع الألعاب الكورية الـ ${games.length}` : `Unlock all ${games.length} Korean games` },
                { icon: "📊", text: isAr ? "تتبع تقدمك في التعلّم" : "Track your learning progress" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-foreground">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <Button className="w-full" size="lg" asChild>
                <a href="/signup">{isAr ? "🚀 سجّل مجاناً" : "🚀 Sign Up Free"}</a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/login">{isAr ? "لديك حساب بالفعل؟ سجّل الدخول" : "Already have an account? Log in"}</a>
              </Button>
            </div>

            <button
              onClick={() => setShowSignupNudge(false)}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              {isAr ? "واصل اللعب كضيف" : "Continue playing as guest"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;

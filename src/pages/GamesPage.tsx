import { useState, lazy, Suspense } from "react";
import Header from "@/components/Header";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import KoreanMatchGame from "@/components/KoreanMatchGame";
import HangulQuizGame from "@/components/HangulQuizGame";
import { Card } from "@/components/ui/card";
import { Gamepad2, Brain, Layers, Hash, Palette, BookOpen, MessageCircle, ArrowLeftRight, PenLine, Shuffle, Calculator, Tv, Clock } from "lucide-react";

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

const games = [
  { id: "match", title: "Vocabulary Match", description: "Flip cards & match Korean words with English meanings", icon: Layers, emoji: "🃏", difficulty: "Beginner" },
  { id: "hangul", title: "Hangul Speed Quiz", description: "Identify Hangul characters against the clock", icon: Brain, emoji: "⚡", difficulty: "Beginner" },
  { id: "sentence", title: "Sentence Builder", description: "Arrange words to build correct Korean sentences", icon: PenLine, emoji: "🧩", difficulty: "Beginner" },
  { id: "numbers", title: "Korean Numbers", description: "Master native & Sino-Korean number systems", icon: Hash, emoji: "🔢", difficulty: "Beginner" },
  { id: "colors", title: "Color Match", description: "Learn Korean color names with visual cues", icon: Palette, emoji: "🎨", difficulty: "Beginner" },
  { id: "verbs", title: "Verb Conjugation", description: "Practice present, past & future verb forms", icon: BookOpen, emoji: "📝", difficulty: "Intermediate" },
  { id: "greetings", title: "Greeting Master", description: "Match Korean greetings to real-life situations", icon: MessageCircle, emoji: "👋", difficulty: "Beginner" },
  { id: "opposites", title: "Opposite Words", description: "Find the Korean antonym for each word", icon: ArrowLeftRight, emoji: "↔️", difficulty: "Intermediate" },
  { id: "fillblank", title: "Particle Pro", description: "Fill in the correct Korean particles (은/는/이/가)", icon: PenLine, emoji: "✏️", difficulty: "Intermediate" },
  { id: "scramble", title: "Word Scramble", description: "Unscramble Korean syllables to form words", icon: Shuffle, emoji: "🔀", difficulty: "Beginner" },
  { id: "counters", title: "Counter Words", description: "Learn Korean counting words (명, 개, 마리...)", icon: Calculator, emoji: "🔢", difficulty: "Intermediate" },
  { id: "kdrama", title: "K-Drama Quiz", description: "Guess meanings of popular K-Drama phrases", icon: Tv, emoji: "🎬", difficulty: "Beginner" },
  { id: "time", title: "Time Teller", description: "Read Korean time expressions correctly", icon: Clock, emoji: "⏰", difficulty: "Beginner" },
];

const GameFallback = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const GamesPage = () => {
  const [activeGame, setActiveGame] = useState<string>("match");

  const selectGame = (id: string) => {
    setActiveGame(id);
    setTimeout(() => {
      document.getElementById("active-game-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const renderGame = () => {
    switch (activeGame) {
      case "match": return <KoreanMatchGame />;
      case "hangul": return <HangulQuizGame />;
      case "sentence": return <Suspense fallback={<GameFallback />}><SentenceBuilderGame /></Suspense>;
      case "numbers": return <Suspense fallback={<GameFallback />}><NumbersGame /></Suspense>;
      case "colors": return <Suspense fallback={<GameFallback />}><ColorMatchGame /></Suspense>;
      case "verbs": return <Suspense fallback={<GameFallback />}><VerbConjugationGame /></Suspense>;
      case "greetings": return <Suspense fallback={<GameFallback />}><GreetingMasterGame /></Suspense>;
      case "opposites": return <Suspense fallback={<GameFallback />}><OppositeWordsGame /></Suspense>;
      case "fillblank": return <Suspense fallback={<GameFallback />}><FillBlankGame /></Suspense>;
      case "scramble": return <Suspense fallback={<GameFallback />}><WordScrambleGame /></Suspense>;
      case "counters": return <Suspense fallback={<GameFallback />}><CounterWordsGame /></Suspense>;
      case "kdrama": return <Suspense fallback={<GameFallback />}><KDramaQuizGame /></Suspense>;
      case "time": return <Suspense fallback={<GameFallback />}><TimeTellerGame /></Suspense>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
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
              Learn & Play
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Korean Learning{" "}
              <span className="underline decoration-primary decoration-4 underline-offset-4">Games</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Practice your Korean skills with {games.length} fun interactive challenges. Earn XP and level up!
            </p>

            <div className="flex justify-center gap-4 pt-2">
              {["가", "나", "다", "라", "마"].map((ch, i) => (
                <span key={ch} className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border shadow-sm text-xl font-bold text-foreground animate-bounce select-none"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: "2.5s" }}>{ch}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Game selector */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              {games.map((game) => {
                const isActive = activeGame === game.id;
                return (
                  <button key={game.id} onClick={() => setActiveGame(game.id)} className="text-left">
                    <Card className={`p-4 transition-all duration-200 border-2 cursor-pointer h-full ${
                      isActive
                        ? "border-primary/50 bg-primary/5 shadow-md"
                        : "border-border hover:border-foreground/20 hover:shadow-sm"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                          {game.emoji}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm">{game.title}</h3>
                            {isActive && (
                              <span className="text-[10px] bg-primary/20 text-foreground px-1.5 py-0.5 rounded-full font-medium">Playing</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{game.description}</p>
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                            game.difficulty === "Intermediate" ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"
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
        <div className="border-t border-border">
          {renderGame()}
        </div>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default GamesPage;

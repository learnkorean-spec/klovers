import { useState } from "react";
import Header from "@/components/Header";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import KoreanMatchGame from "@/components/KoreanMatchGame";
import HangulQuizGame from "@/components/HangulQuizGame";
import { Card } from "@/components/ui/card";
import { Gamepad2, Brain, Layers } from "lucide-react";

const games = [
  {
    id: "match",
    title: "Vocabulary Match",
    description: "Flip cards & match Korean words with English meanings",
    icon: Layers,
    emoji: "🃏",
    difficulty: "Beginner",
  },
  {
    id: "hangul",
    title: "Hangul Speed Quiz",
    description: "Identify Hangul characters against the clock",
    icon: Brain,
    emoji: "⚡",
    difficulty: "Beginner",
  },
];

const GamesPage = () => {
  const [activeGame, setActiveGame] = useState<string>("match");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 px-4 bg-muted/30">
          {/* Decorative */}
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
              Practice your Korean skills with fun interactive challenges. Pick a game below and start playing!
            </p>

            {/* Floating characters */}
            <div className="flex justify-center gap-4 pt-2">
              {["가", "나", "다", "라", "마"].map((ch, i) => (
                <span
                  key={ch}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border shadow-sm text-xl font-bold text-foreground animate-bounce select-none"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: "2.5s" }}
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Game selector */}
        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-4 mb-2">
              {games.map((game) => {
                const Icon = game.icon;
                const isActive = activeGame === game.id;
                return (
                  <button key={game.id} onClick={() => setActiveGame(game.id)} className="text-left">
                    <Card
                      className={`p-5 transition-all duration-200 border-2 cursor-pointer ${
                        isActive
                          ? "border-primary/50 bg-primary/5 shadow-md"
                          : "border-border hover:border-foreground/20 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                          {game.emoji}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">{game.title}</h3>
                            {isActive && (
                              <span className="text-xs bg-primary/20 text-foreground px-2 py-0.5 rounded-full font-medium">
                                Playing
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{game.description}</p>
                          <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full mt-1">
                            {game.difficulty}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              🎮 More games coming soon — stay tuned!
            </p>
          </div>
        </section>

        {/* Active game */}
        <div className="border-t border-border">
          {activeGame === "match" && <KoreanMatchGame />}
          {activeGame === "hangul" && <HangulQuizGame />}
        </div>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default GamesPage;

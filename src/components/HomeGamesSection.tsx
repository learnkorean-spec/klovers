import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Layers, Brain, ArrowRight, Sparkles } from "lucide-react";

const games = [
  {
    title: "Vocabulary Match",
    description: "Flip cards & match Korean words with their English meanings",
    emoji: "🃏",
    icon: Layers,
    color: "bg-primary/10",
  },
  {
    title: "Hangul Speed Quiz",
    description: "Identify Hangul characters before time runs out",
    emoji: "⚡",
    icon: Brain,
    color: "bg-accent/50",
  },
];

const floatingChars = ["한", "글", "놀", "이", "🎯", "🇰🇷"];

const HomeGamesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 relative overflow-hidden bg-muted/20">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/3 right-1/5 w-3 h-3 bg-primary/20 rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-primary/15 rounded-full animate-pulse delay-500" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground border border-border px-4 py-2 rounded-full text-sm font-medium">
              <Gamepad2 className="h-4 w-4" />
              Learn & Play
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Practice Korean with{" "}
              <span className="underline decoration-primary decoration-4 underline-offset-4">Fun Games</span>
            </h2>

            <p className="text-muted-foreground text-lg">
              Challenge yourself with interactive mini-games designed to boost your vocabulary and Hangul skills — no textbook needed!
            </p>

            {/* Game cards */}
            <div className="space-y-3">
              {games.map((game) => (
                <Card
                  key={game.title}
                  className="p-4 flex items-center gap-4 border-2 border-border hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate("/games")}
                >
                  <div className={`w-12 h-12 rounded-xl ${game.color} flex items-center justify-center text-2xl shrink-0`}>
                    {game.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground text-sm">{game.title}</h3>
                    <p className="text-xs text-muted-foreground">{game.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Card>
              ))}
            </div>

            <Button size="lg" onClick={() => navigate("/games")} className="text-base px-8 gap-2">
              <Sparkles className="h-4 w-4" />
              Play Now — It's Free!
            </Button>
          </div>

          {/* Right: Visual graphic */}
          <div className="flex justify-center">
            <div className="relative w-72 h-72 md:w-80 md:h-80">
              {/* Central icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 rounded-2xl bg-card border-2 border-border shadow-lg flex flex-col items-center justify-center gap-2 rotate-3">
                  <Gamepad2 className="h-12 w-12 text-foreground" />
                  <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Games</span>
                </div>
              </div>

              {/* Floating characters */}
              {floatingChars.map((ch, i) => {
                const positions = [
                  "top-0 left-1/2 -translate-x-1/2",
                  "top-8 right-2",
                  "bottom-8 right-0",
                  "bottom-0 left-1/2 -translate-x-1/2",
                  "bottom-8 left-0",
                  "top-8 left-2",
                ];
                return (
                  <div
                    key={ch}
                    className={`absolute ${positions[i]} w-12 h-12 rounded-xl bg-card border border-border shadow-md flex items-center justify-center animate-bounce select-none`}
                    style={{ animationDelay: `${i * 300}ms`, animationDuration: "3s" }}
                  >
                    <span className="text-lg font-bold">{ch}</span>
                  </div>
                );
              })}

              {/* Decorative ring */}
              <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-foreground/10 rotate-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeGamesSection;

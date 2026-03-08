import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, RotateCcw, Trophy, Timer, Sparkles } from "lucide-react";

interface CardData {
  id: number;
  text: string;
  matchId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const WORD_PAIRS = [
  { korean: "사랑", english: "Love" },
  { korean: "친구", english: "Friend" },
  { korean: "학교", english: "School" },
  { korean: "음식", english: "Food" },
  { korean: "행복", english: "Happy" },
  { korean: "가족", english: "Family" },
  { korean: "여행", english: "Travel" },
  { korean: "음악", english: "Music" },
  { korean: "바다", english: "Ocean" },
  { korean: "꿈", english: "Dream" },
  { korean: "별", english: "Star" },
  { korean: "하늘", english: "Sky" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffleArray(arr).slice(0, n);
}

const KoreanMatchGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const pairCount = 6;

  const initGame = useCallback(() => {
    const chosen = pickRandom(WORD_PAIRS, pairCount);
    const cardList: CardData[] = [];
    chosen.forEach((pair, i) => {
      cardList.push({ id: i * 2, text: pair.korean, matchId: i, isFlipped: false, isMatched: false });
      cardList.push({ id: i * 2 + 1, text: pair.english, matchId: i, isFlipped: false, isMatched: false });
    });
    setCards(shuffleArray(cardList));
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setIsRunning(false);
    setGameComplete(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleCardClick = (id: number) => {
    if (selected.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    if (!isRunning) setIsRunning(true);

    const updated = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(updated);
    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newSelected;
      const first = updated.find((c) => c.id === firstId)!;
      const second = updated.find((c) => c.id === secondId)!;

      if (first.matchId === second.matchId) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.matchId === first.matchId ? { ...c, isMatched: true } : c))
          );
          const newMatches = matches + 1;
          setMatches(newMatches);
          if (newMatches === pairCount) {
            setIsRunning(false);
            setGameComplete(true);
          }
          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setSelected([]);
        }, 800);
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const getStars = () => {
    if (moves <= pairCount + 2) return 3;
    if (moves <= pairCount * 2) return 2;
    return 1;
  };

  return (
    <section className="py-12 px-4 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Korean <span className="underline decoration-primary decoration-4 underline-offset-4">Vocabulary</span> Match
          </h2>
          <p className="text-muted-foreground">
            Flip the cards and match Korean words with their English meaning. How fast can you clear the board?
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-4 md:gap-6 mb-6 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            <Timer className="h-3.5 w-3.5" /> {formatTime(timer)}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            Moves: {moves}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            Matched: {matches}/{pairCount}
          </Badge>
        </div>

        {/* Game grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-8">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
              aria-label={card.isFlipped || card.isMatched ? card.text : "Hidden card"}
            >
              <Card
                className={`h-20 sm:h-24 flex items-center justify-center cursor-pointer transition-all duration-300 select-none border-2 ${
                  card.isMatched
                    ? "bg-primary/15 border-primary/40 scale-95"
                    : card.isFlipped
                    ? "bg-card border-primary/50 shadow-md"
                    : "bg-muted hover:bg-muted/80 border-border hover:border-foreground/20 hover:shadow-sm"
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <span
                    className={`font-bold text-center px-1 ${
                      card.isMatched ? "text-foreground/60" : "text-foreground"
                    } ${card.text.length <= 3 ? "text-lg sm:text-xl" : "text-sm sm:text-base"}`}
                  >
                    {card.text}
                  </span>
                ) : (
                  <span className="text-2xl">🇰🇷</span>
                )}
              </Card>
            </button>
          ))}
        </div>

        {/* Win state */}
        {gameComplete && (
          <div className="text-center space-y-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Trophy
                  key={i}
                  className={`h-8 w-8 ${i < getStars() ? "text-primary [filter:drop-shadow(0_0_3px_hsl(var(--primary)))]" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <p className="text-foreground font-semibold text-lg">
              🎉 You matched all pairs in {moves} moves ({formatTime(timer)})!
            </p>
            <p className="text-muted-foreground text-sm">
              Ready to learn more? Start your Korean journey with us!
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={initGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {gameComplete ? "Play Again" : "Reset"}
          </Button>
          {gameComplete && (
            <Button onClick={() => document.getElementById("enroll")?.scrollIntoView({ behavior: "smooth" })} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Start Learning Korean
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default KoreanMatchGame;

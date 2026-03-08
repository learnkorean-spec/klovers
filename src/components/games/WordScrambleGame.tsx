import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

const WORDS = [
  { scrambled: "랑사", answer: "사랑", english: "Love" },
  { scrambled: "구친", answer: "친구", english: "Friend" },
  { scrambled: "교학", answer: "학교", english: "School" },
  { scrambled: "생선", answer: "선생", english: "Teacher" },
  { scrambled: "복행", answer: "행복", english: "Happiness" },
  { scrambled: "족가", answer: "가족", english: "Family" },
  { scrambled: "행여", answer: "여행", english: "Travel" },
  { scrambled: "악음", answer: "음악", english: "Music" },
  { scrambled: "화문", answer: "문화", english: "Culture" },
  { scrambled: "사역", answer: "역사", english: "History" },
  { scrambled: "계세", answer: "세계", english: "World" },
  { scrambled: "연자", answer: "자연", english: "Nature" },
  { scrambled: "간시", answer: "시간", english: "Time" },
  { scrambled: "래미", answer: "미래", english: "Future" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const WordScrambleGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const [questions] = useState(() => shuffleArray(WORDS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = () => {
    if (feedback) return;
    const isCorrect = input.trim() === questions[round].answer;
    if (isCorrect) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setInput(""); setFeedback(null); };
  const restart = () => { setRound(0); setScore(0); setInput(""); setFeedback(null); };

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.scrambleComplete")}</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} {t("games.correct")}</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {round + 1}/{totalRounds}</Badge>
          <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />{score * 5} XP</Badge>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("games.scramblePrompt")}</p>
          <p className="text-5xl font-bold text-foreground tracking-widest">{q.scrambled}</p>
          <p className="text-muted-foreground">{t("games.scrambleHint").replace("{hint}", q.english)}</p>
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder={t("games.scramblePlaceholder")}
              disabled={!!feedback}
              className="border-2 border-border rounded-lg px-4 py-2 text-center text-xl font-bold bg-card text-foreground w-48 focus:outline-none focus:border-foreground/40"
            />
            {!feedback && <Button onClick={handleSubmit}>{t("games.scrambleCheck")}</Button>}
          </div>
          {feedback && <p className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? t("games.correctFeedback") : t("games.wrongPrefix").replace("{answer}", q.answer)}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={restart} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default WordScrambleGame;

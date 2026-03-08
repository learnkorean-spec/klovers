import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

const VERBS = [
  { base: "가다 (to go)", form: "Polite present", answer: "가요", options: ["가요", "갔어요", "갈 거예요", "가세요"] },
  { base: "먹다 (to eat)", form: "Polite present", answer: "먹어요", options: ["먹어요", "먹었어요", "먹을 거예요", "드세요"] },
  { base: "하다 (to do)", form: "Polite present", answer: "해요", options: ["해요", "했어요", "할 거예요", "하세요"] },
  { base: "보다 (to see)", form: "Polite past", answer: "봤어요", options: ["봐요", "봤어요", "볼 거예요", "보세요"] },
  { base: "오다 (to come)", form: "Polite present", answer: "와요", options: ["와요", "왔어요", "올 거예요", "오세요"] },
  { base: "마시다 (to drink)", form: "Polite present", answer: "마셔요", options: ["마셔요", "마셨어요", "마실 거예요", "드세요"] },
  { base: "읽다 (to read)", form: "Polite past", answer: "읽었어요", options: ["읽어요", "읽었어요", "읽을 거예요", "읽으세요"] },
  { base: "쓰다 (to write)", form: "Polite present", answer: "써요", options: ["써요", "썼어요", "쓸 거예요", "쓰세요"] },
  { base: "자다 (to sleep)", form: "Polite future", answer: "잘 거예요", options: ["자요", "잤어요", "잘 거예요", "주무세요"] },
  { base: "사다 (to buy)", form: "Polite past", answer: "샀어요", options: ["사요", "샀어요", "살 거예요", "사세요"] },
  { base: "듣다 (to listen)", form: "Polite present", answer: "들어요", options: ["들어요", "들었어요", "들을 거예요", "들으세요"] },
  { base: "만나다 (to meet)", form: "Polite present", answer: "만나요", options: ["만나요", "만났어요", "만날 거예요", "만나세요"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const VerbConjugationGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const [questions] = useState(() => shuffleArray(VERBS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleAnswer = (ans: string) => {
    if (feedback) return; setSelected(ans);
    if (ans === questions[round].answer) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setFeedback(null); setSelected(null); };
  const restart = () => { setRound(0); setScore(0); setFeedback(null); setSelected(null); };

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.verbsComplete")}</h2>
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
          <p className="text-sm text-muted-foreground">{t("games.verbsPrompt")}</p>
          <p className="text-2xl font-bold text-foreground">{q.base}</p>
          <Badge variant="outline">{q.form}</Badge>
          <div className="grid grid-cols-2 gap-3">
            {shuffleArray(q.options).map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                className={`p-3 rounded-lg font-semibold border-2 transition-all text-lg ${
                  feedback && opt === q.answer ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
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

export default VerbConjugationGame;

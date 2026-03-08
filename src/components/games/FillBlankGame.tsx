import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

const SENTENCES = [
  { sentence: "저는 한국어___ 공부합니다.", blank: "를", hint: "(object particle)", options: ["를", "은", "이", "에"] },
  { sentence: "학교___ 갑니다.", blank: "에", hint: "(location particle)", options: ["에", "를", "은", "이"] },
  { sentence: "저___ 학생입니다.", blank: "는", hint: "(topic particle)", options: ["는", "를", "에", "이"] },
  { sentence: "친구___ 만났어요.", blank: "를", hint: "(object particle)", options: ["를", "이", "에", "는"] },
  { sentence: "서울___ 살아요.", blank: "에서", hint: "(location of action)", options: ["에서", "에", "를", "은"] },
  { sentence: "물___ 마셔요.", blank: "을", hint: "(object particle after consonant)", options: ["을", "를", "이", "은"] },
  { sentence: "오늘 날씨___ 좋아요.", blank: "가", hint: "(subject particle after vowel)", options: ["가", "이", "를", "은"] },
  { sentence: "집___ 가고 싶어요.", blank: "에", hint: "(direction particle)", options: ["에", "에서", "를", "은"] },
  { sentence: "커피___ 좋아해요.", blank: "를", hint: "(object particle after vowel)", options: ["를", "을", "이", "는"] },
  { sentence: "선생님___ 질문했어요.", blank: "에게", hint: "(indirect object particle)", options: ["에게", "를", "이", "은"] },
  { sentence: "버스___ 타요.", blank: "를", hint: "(object particle)", options: ["를", "에", "은", "이"] },
  { sentence: "음악___ 들어요.", blank: "을", hint: "(object particle after consonant)", options: ["을", "를", "이", "에"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const FillBlankGame = () => {
  const totalRounds = 10;
  const [questions] = useState(() => shuffleArray(SENTENCES).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleAnswer = (ans: string) => {
    if (feedback) return; setSelected(ans);
    if (ans === questions[round].blank) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setFeedback(null); setSelected(null); };
  const restart = () => { setRound(0); setScore(0); setFeedback(null); setSelected(null); };

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Particles Pro!</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} correct</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Round {round + 1}/{totalRounds}</Badge>
          <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />{score * 5} XP</Badge>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Fill in the blank {q.hint}:</p>
          <p className="text-2xl font-bold text-foreground">{q.sentence.replace("___", " ____ ")}</p>
          <div className="grid grid-cols-2 gap-3">
            {shuffleArray(q.options).map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                className={`p-3 rounded-lg font-semibold border-2 transition-all text-xl ${
                  feedback && opt === q.blank ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
          </div>
          {feedback && <p className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? "✅ Correct! +5 XP" : `❌ Answer: ${q.blank}`}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">Next <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={restart} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> Restart</Button>
      </div>
    </section>
  );
};

export default FillBlankGame;

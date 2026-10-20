import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XP, type QuizQuestion } from "@/constants/blogJourney";
import { journey, useJourneyProgress } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";
import { KlobiFigure, Ko, num } from "./shared";

/**
 * Five questions, one at a time. A wrong answer says "try again" and keeps the
 * question open; the first correct answer to a question earns +5 journey XP,
 * once — re-taking the quiz never re-awards it (journeyProgress stores the
 * question ids, and XP is derived from them).
 *
 * Feedback is announced through an aria-live region, and the result is never
 * colour alone: every state carries a ✓ or ✗ shape and a word.
 */
export default function MiniQuiz({ questions, isAr }: { questions: QuizQuestion[]; isAr: boolean }) {
  const L = isAr ? "ar" : "en";
  const { quizzes } = useJourneyProgress();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [earned, setEarned] = useState(0);
  const [started, setStarted] = useState(false);
  const [justEarned, setJustEarned] = useState(false);

  const done = idx >= questions.length;
  const q = questions[Math.min(idx, questions.length - 1)];
  const correct = picked !== null && picked === q.answer;

  const choose = (id: string) => {
    if (correct) return;
    if (!started) {
      setStarted(true);
      trackJourney("quiz_started", {});
    }
    setPicked(id);
    if (id === q.answer) {
      const gained = journey.completeQuiz(q.id);
      setJustEarned(gained);
      if (gained) setEarned((e) => e + XP.quizCorrect);
    } else {
      setWrong((w) => [...w, id]);
    }
  };

  const next = () => {
    const n = idx + 1;
    setIdx(n);
    setPicked(null);
    setWrong([]);
    if (n >= questions.length) trackJourney("quiz_completed", { earned });
  };

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setWrong([]);
    setEarned(0);
  };

  if (done) {
    const all = questions.every((x) => quizzes.includes(x.id));
    return (
      <div className="rounded-[2rem] border border-border bg-card p-6 text-center sm:p-10">
        <div className="mx-auto w-fit rounded-full bg-primary p-3 journal-pop">
          <KlobiFigure pose="thumbsup" className="h-20 w-20" />
        </div>
        <h3 className="mt-5 font-display text-2xl font-extrabold">
          {all ? (isAr ? "عمل رائع! اكتملت كل التحديات" : "Well done, every challenge complete") : isAr ? "انتهت الجولة" : "Round complete"}
        </h3>
        <p className="mt-2 text-muted-foreground">
          {earned > 0
            ? isAr ? `+${num(earned, true)} نقطة للرحلة في هذه الجولة.` : `+${earned} journey XP this round.`
            : isAr ? "يمكن إعادة الجولة في أي وقت لتثبيت الدرس." : "Replay any time to lock in what you learned."}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-7 font-bold">
            <Link to="/placement-test" onClick={() => trackJourney("course_cta_clicked", { cta: "placement_after_quiz" })}>
              {isAr ? "اكتشاف المستوى الحقيقي مجانًا" : "Find your real level: free"}
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 rounded-full px-6 font-bold" onClick={restart}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {isAr ? "إعادة الجولة" : "Play again"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground/70">
          {isAr ? `سؤال ${num(idx + 1, true)} من ${num(questions.length, true)}` : `Question ${idx + 1} of ${questions.length}`}
        </p>
        <ol className="flex gap-1.5" aria-hidden="true">
          {questions.map((x, i) => (
            <li
              key={x.id}
              className={cn("h-2 w-6 rounded-full", i < idx ? "bg-charcoal" : i === idx ? "bg-primary border border-charcoal/30" : "bg-muted")}
            />
          ))}
        </ol>
      </div>

      <fieldset className="mt-5">
        <legend className="font-display text-xl font-extrabold leading-snug sm:text-2xl">
          {q.prompt[L]}
        </legend>
        {q.scene && (
          <p className="mt-3 rounded-2xl bg-muted/70 px-4 py-3 text-[0.95rem] leading-relaxed text-foreground">
            <Ko className="font-bold">{q.ko}</Ko>
            <span aria-hidden="true">: </span>
            {q.scene[L]}
          </p>
        )}
        <div className="mt-5 grid gap-3">
          {q.options.map((o, i) => {
            const isPicked = picked === o.id;
            const isWrong = wrong.includes(o.id);
            const isRight = correct && o.id === q.answer;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o.id)}
                disabled={isWrong || (correct && !isRight)}
                aria-pressed={isPicked}
                className={cn(
                  "flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-start text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                  isRight && "border-correct bg-correct/10 text-foreground",
                  isWrong && "border-wrong-graphic bg-wrong-surface text-wrong",
                  !isRight && !isWrong && "border-border bg-background hover:border-foreground/50",
                  correct && !isRight && "opacity-50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full border font-display text-sm font-extrabold",
                    isRight ? "border-correct bg-correct text-correct-foreground" : isWrong ? "border-wrong bg-wrong text-wrong-foreground" : "border-foreground/30",
                  )}
                >
                  {isRight ? <Check className="h-4 w-4" /> : isWrong ? <X className="h-4 w-4" /> : isAr ? ["أ", "ب", "ج", "د"][i] : "ABCD"[i]}
                </span>
                {o.label[L]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 min-h-[3.5rem]" aria-live="polite">
        {picked && correct && (
          <div className="flex flex-col gap-4 rounded-2xl bg-correct/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-extrabold text-correct">
                <Check className="h-5 w-5" aria-hidden="true" />
                {isAr ? "صحيح" : "Correct"}
                {justEarned && (
                  <span className="journal-pop rounded-full bg-primary px-2.5 py-0.5 text-sm text-charcoal">{isAr ? `+${num(XP.quizCorrect, true)} نقاط للرحلة` : `+${XP.quizCorrect} XP`}</span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{q.explain[L]}</p>
            </div>
            <Button onClick={next} className="h-11 shrink-0 rounded-full px-6 font-bold">
              {idx + 1 < questions.length ? (isAr ? "السؤال التالي" : "Next question") : isAr ? "النتيجة" : "See result"}
            </Button>
          </div>
        )}
        {picked && !correct && (
          <p className="flex items-center gap-2 rounded-2xl bg-wrong-surface p-4 font-bold text-wrong">
            <X className="h-5 w-5" aria-hidden="true" />
            {isAr ? "محاولة أخرى" : "Try again"}
          </p>
        )}
      </div>
    </div>
  );
}

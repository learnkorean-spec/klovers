import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Flame, RotateCcw, X, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * A real, playable taste of the Hangul Speed Quiz, on the homepage.
 *
 * WHY IT EXISTS. The games are the strongest thing this site has, and until
 * now the homepage only described them - six cards with a title and a line of
 * text. A visitor who has never heard a Korean syllable can play five rounds of
 * this in fifteen seconds, with no signup, and leave having learnt "ga", "na"
 * and "ma". That is a better argument for the free trial than any sentence.
 *
 * WHAT IT IS NOT. It does not write XP anywhere. The score is local to the
 * component and dies with it; the "+XP" is the feeling of the real game, not a
 * claim about an account. It also does not log lead events - answering a quiz
 * question is not a Lead. Only the final button, which navigates to /games, is
 * a person choosing to go further.
 *
 * Every question is one syllable of the basic consonant + "a" set, with its
 * standard romanisation and two distractors from the same set. Answers are
 * shown with a tick or a cross as well as a colour, so the result never rests
 * on green-versus-magenta alone.
 */

const POOL: { ko: string; rom: string }[] = [
  { ko: "가", rom: "ga" },
  { ko: "나", rom: "na" },
  { ko: "다", rom: "da" },
  { ko: "라", rom: "ra" },
  { ko: "마", rom: "ma" },
  { ko: "바", rom: "ba" },
  { ko: "사", rom: "sa" },
  { ko: "아", rom: "a" },
  { ko: "자", rom: "ja" },
  { ko: "하", rom: "ha" },
];

const ROUND = 5;
const XP_PER_ANSWER = 10;
const ADVANCE_MS = 850;

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildRound = () =>
  shuffle(POOL)
    .slice(0, ROUND)
    .map((q) => ({
      ...q,
      options: shuffle([q.rom, ...shuffle(POOL.filter((p) => p.rom !== q.rom)).slice(0, 2).map((p) => p.rom)]),
    }));

const HangulMiniGame = ({ totalGames }: { totalGames: number }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const tr = (en: string, ar: string) => (language === "ar" ? ar : en);

  const [round, setRound] = useState(buildRound);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const q = round[i];

  const pick = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    const right = opt === q.rom;
    setXp((v) => v + (right ? XP_PER_ANSWER : 0));
    setStreak((s) => (right ? s + 1 : 0));
    timer.current = setTimeout(() => {
      if (i === ROUND - 1) setDone(true);
      else {
        setI((v) => v + 1);
        setPicked(null);
      }
    }, ADVANCE_MS);
  };

  const restart = () => {
    clearTimeout(timer.current);
    setRound(buildRound());
    setI(0);
    setPicked(null);
    setXp(0);
    setStreak(0);
    setDone(false);
  };

  return (
    <div className="card-edge relative flex h-full min-h-[22rem] flex-col rounded-2xl bg-charcoal p-5 text-ivory sm:p-7">
      {/* Top bar: what this is, and the two numbers an arcade always shows */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-klovers-yellow px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-charcoal">
          {tr("Try it · no signup", "جرّبها · من غير تسجيل")}
        </span>
        <div className="flex items-center gap-3 text-sm font-extrabold" dir="ltr">
          <span className="inline-flex items-center gap-1 text-klovers-yellow">
            <Zap className="h-4 w-4" aria-hidden="true" /> {xp} XP
          </span>
          <span className={`inline-flex items-center gap-1 transition-opacity ${streak > 0 ? "opacity-100" : "opacity-40"}`}>
            <Flame className="h-4 w-4 text-klovers-yellow" aria-hidden="true" /> {streak}
          </span>
        </div>
      </div>

      {/* Five pips: where you are in the round */}
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: ROUND }).map((_, n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${n < i || done ? "bg-klovers-yellow" : n === i ? "bg-ivory/70" : "bg-ivory/20"}`}
          />
        ))}
      </div>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <p className="text-5xl" aria-hidden="true">{xp >= 40 ? "🏆" : "👏"}</p>
          <p className="text-3xl font-extrabold text-klovers-yellow" dir="ltr">+{xp} XP</p>
          <p className="max-w-xs text-sm text-ivory/80">
            {tr(
              `That was one of ${totalGames} games. The rest are free to try too, and your XP is saved when you sign in.`,
              `دي لعبة واحدة من ${totalGames}. الباقي كمان مجاني، والنقاط بتتحفظ لما تسجّل دخول.`
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/games")}
              className="inline-flex items-center gap-2 rounded-full bg-klovers-yellow px-5 py-2.5 text-sm font-extrabold text-charcoal transition-transform hover:-translate-y-0.5"
            >
              {tr(`Play all ${totalGames} games`, `العب كل الـ ${totalGames} لعبة`)}
            </button>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ivory/40 px-4 py-2 text-sm font-bold text-ivory transition-colors hover:border-ivory"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> {tr("Again", "تاني")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
          <p className="text-sm font-semibold text-ivory/75">{tr("Which sound is this?", "إيه صوت الحرف ده؟")}</p>

          <p
            dir="ltr"
            lang="ko"
            className="select-none text-[6.5rem] font-extrabold leading-none text-klovers-yellow sm:text-[8rem]"
            style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif" }}
          >
            {q.ko}
          </p>

          <div className="grid w-full max-w-sm grid-cols-3 gap-2.5" dir="ltr">
            {q.options.map((opt) => {
              const isRight = opt === q.rom;
              const isPicked = picked === opt;
              const revealed = picked !== null;
              const state = !revealed
                ? "border-ivory/30 bg-ivory/10 hover:border-klovers-yellow hover:bg-klovers-yellow hover:text-charcoal"
                : isRight
                ? "border-transparent bg-correct text-correct-foreground"
                : isPicked
                ? "border-transparent bg-wrong text-wrong-foreground"
                : "border-ivory/10 bg-ivory/5 opacity-40";
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => pick(opt)}
                  disabled={revealed}
                  className={`relative inline-flex items-center justify-center gap-1 rounded-xl border-2 py-3 text-xl font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klovers-yellow ${state}`}
                >
                  {revealed && isRight && <Check className="h-5 w-5" aria-hidden="true" />}
                  {revealed && isPicked && !isRight && <X className="h-5 w-5" aria-hidden="true" />}
                  {opt}
                </button>
              );
            })}
          </div>

          <p className="sr-only" aria-live="polite">
            {picked === null ? "" : picked === q.rom ? tr("Correct", "صح") : tr(`Not quite, it is ${q.rom}`, `لأ، الصح ${q.rom}`)}
          </p>
        </div>
      )}
    </div>
  );
};

export default HangulMiniGame;

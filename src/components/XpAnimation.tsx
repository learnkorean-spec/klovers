import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Zap, Star, Trophy, Flame, Check } from "lucide-react";
import { getLeague, LEAGUES } from "@/constants/gamification";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import { isClubyAwake } from "@/lib/clubyAwake";
import { useLanguage } from "@/contexts/LanguageContext";
import { leagueName } from "@/lib/dashboardLocale";
import { toArabicDigits } from "@/lib/trustFigures";

/** 27 Sep 2026 (brand guard): every overlay here speaks the page language, uses no emoji and
 *  says «نقاط الخبرة» instead of the Latin "XP" on Arabic pages. */
const useIsAr = () => useLanguage().language === "ar";
const xpLabel = (xp: number, isAr: boolean) => (isAr ? `+${toArabicDigits(xp)} نقطة خبرة` : `+${xp} XP`);
// The approved 3D Cluby (the old flat mascot art is retired).
// Canon: Cluby only appears once his egg has hatched (the student dashboard
// records that in lib/clubyAwake.ts); until then a neutral star icon shows.
const mascotImg = "/assets/cluby/cluby-star.webp";

// --- Floating XP animation ---
export function XpFloatAnimation({ xp, onComplete }: { xp: number; onComplete?: () => void }) {
  const isAr = useIsAr();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-bounce-up text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-2xl text-xl font-bold">
          <Zap className="h-6 w-6" />
          {xpLabel(xp, isAr)}
        </div>
      </div>
    </div>
  );
}

// --- Streak Celebration (Duolingo-style) ---
export function StreakCelebration({
  currentStreak,
  onContinue,
}: {
  currentStreak: number;
  onContinue: () => void;
}) {
  const isAr = useIsAr();
  const today = new Date();
  const dayNames = isAr ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const todayIndex = today.getDay();

  // Build a week view: past days completed, today highlighted, future empty
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 3; // center today at index 3
    const dayIdx = (todayIndex + offset + 7) % 7;
    const isToday = offset === 0;
    const isPast = offset < 0;
    const completed = isPast || isToday;
    return { label: dayNames[dayIdx], isToday, completed };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={onContinue}
    >
      <div
        className="max-w-sm w-full mx-4 text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Speech bubble */}
        <div className="relative bg-card border border-border rounded-2xl px-6 py-4 mb-4 shadow-lg animate-fade-in-down">
          <p className="text-sm text-foreground">
            {isAr ? "استمرار رائع! عادة التعلّم تكبر يومًا بعد يوم." : "Keep it up! You're building an amazing habit!"}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-b border-r border-border rotate-45" />
        </div>

        {/* Mascot with flame shield */}
        <div className="relative flex justify-center mb-2">
          {/* Flame glow behind mascot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 animate-pulse-glow rounded-full" />
          {/* Flame icon */}
          <div className="relative animate-mascot-bounce">
            <Flame className="absolute -top-6 left-1/2 -translate-x-1/2 h-16 w-16 text-primary animate-flame-flicker drop-shadow-lg" strokeWidth={2.5} />
            {isClubyAwake() ? (
              <img
                src={mascotImg}
                alt="Cluby, your study companion"
                width={333}
                height={440}
                loading="lazy"
                decoding="async"
                className="relative z-10 w-36 h-36 object-contain drop-shadow-2xl"
              />
            ) : (
              <BrandIcon name="achievement-star" className="relative z-10 w-36 h-36 object-contain drop-shadow-2xl" />
            )}
          </div>
        </div>

        {/* Big streak number */}
        <div className="animate-count-pop">
          <p className="text-7xl font-black text-primary text-outlined-lg leading-none tracking-tight">
            {isAr ? toArabicDigits(currentStreak) : currentStreak}
          </p>
          <p className="text-2xl font-bold text-primary text-outlined-lg mt-1">{isAr ? "أيام متتالية" : "day streak"}</p>
        </div>

        {/* Weekly tracker */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-8">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-bold",
                  day.isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {day.label}
              </span>
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  day.completed
                    ? "bg-primary text-primary-foreground shadow-md animate-check-pop"
                    : "bg-muted"
                )}
                style={day.completed ? { animationDelay: `${i * 80}ms` } : undefined}
              >
                {day.completed && <Check className="h-4 w-4" strokeWidth={3} />}
              </div>
            </div>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isAr ? "متابعة" : "CONTINUE"}
        </button>
      </div>
    </div>
  );
}

// --- League Promotion Celebration ---
export function LeaguePromotionModal({
  fromLeague,
  toLeague,
  onClose,
}: {
  fromLeague: string;
  toLeague: string;
  onClose: () => void;
}) {
  const isAr = useIsAr();
  const from = LEAGUES.find((l) => l.key === fromLeague);
  const to = LEAGUES.find((l) => l.key === toLeague);

  if (!to) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md" onClick={onClose}>
      <div
        className="max-w-sm w-full mx-4 text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mascot celebration */}
        <div className="relative flex justify-center mb-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 animate-pulse-glow rounded-full" />
          <div className="relative animate-mascot-bounce">
            {isClubyAwake() ? (
              <img
                src={mascotImg}
                alt="Cluby celebrating with you"
                width={333}
                height={440}
                loading="lazy"
                decoding="async"
                className="relative z-10 w-32 h-32 object-contain drop-shadow-2xl"
              />
            ) : (
              <BrandIcon name="achievement-star" className="relative z-10 w-32 h-32 object-contain drop-shadow-2xl" />
            )}
          </div>
        </div>


        {/* Stars */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              className="text-primary animate-check-pop"
              style={{ animationDelay: `${i * 150}ms` }}
              size={i === 1 ? 28 : 22}
              fill="hsl(var(--primary))"
            />
          ))}
        </div>

        <h2 className="text-3xl font-black text-foreground mb-2">{isAr ? "ترقية إلى دوري جديد!" : "League Promoted!"}</h2>
        <p className="text-muted-foreground mb-2">
          {from && (
            <span>
              {leagueName(from, isAr ? "ar" : "en")} {isAr ? "←" : "→"}{" "}
            </span>
          )}
          <span className="font-bold text-primary">{leagueName(to, isAr ? "ar" : "en")}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {isAr ? "الاستمرار في التعلّم يفتح الدوري التالي. " : "Keep studying to reach the next league! "}<span lang="ko">화이팅!</span>
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isAr ? "متابعة" : "CONTINUE"}
        </button>
      </div>
    </div>
  );
}

// --- Badge Unlock Celebration ---
export function BadgeUnlockToast({ badgeName }: { badgeName: string; badgeEmoji?: string }) {
  const isAr = useIsAr();
  return (
    <div className="flex items-center gap-3">
      <BrandIcon name="achievement-star" className="h-10 w-10 object-contain" />
      <div>
        <p className="font-bold text-foreground">{isAr ? "شارة جديدة!" : "Badge Unlocked!"}</p>
        <p className="text-sm text-muted-foreground">{badgeName}</p>
      </div>
    </div>
  );
}

// --- Mission Complete Celebration ---
export function MissionCompleteOverlay({ lessonTitle, xpEarned, onContinue }: {
  lessonTitle: string;
  xpEarned: number;
  onContinue: () => void;
}) {
  const isAr = useIsAr();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="max-w-sm w-full mx-4 text-center animate-scale-in">
        {/* Mascot */}
        <div className="relative flex justify-center mb-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-36 animate-pulse-glow rounded-full" />
          {isClubyAwake() ? (
            <img
              src={mascotImg}
              alt="Cluby, your study companion"
              width={333}
              height={440}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-28 h-28 object-contain drop-shadow-2xl animate-mascot-bounce"
            />
          ) : (
            <BrandIcon name="achievement-star" className="relative z-10 w-28 h-28 object-contain drop-shadow-2xl animate-mascot-bounce" />
          )}
        </div>

        <h2 className="text-3xl font-black text-foreground mb-2">{isAr ? "اكتملت المهمة!" : "Mission Complete!"}</h2>
        <p className="text-muted-foreground mb-4">{lessonTitle}</p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-lg mb-6">
          <Zap className="h-5 w-5" /> {xpLabel(xpEarned, isAr)}
        </div>
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isAr ? "متابعة ←" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

// --- Perfect Score Celebration ---
export function PerfectScoreOverlay({ score, total, onContinue }: {
  score: number;
  total: number;
  onContinue: () => void;
}) {
  const isAr = useIsAr();
  const confettiPieces = Array.from({ length: 30 }, (_, i) => i);
  const colors = ["#FFFF00", "#39FF14", "#FF3131", "#2E2E2E", "#FFF9EC"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md overflow-hidden"
      onClick={onContinue}
    >
      {/* Confetti */}
      {confettiPieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti-fall pointer-events-none select-none text-lg"
          style={{
            left: `${(i / confettiPieces.length) * 100}%`,
            animationDelay: `${(i * 0.05) % 0.8}s`,
            animationDuration: `${1.2 + (i % 4) * 0.3}s`,
            color: colors[i % colors.length],
            fontSize: `${12 + (i % 3) * 6}px`,
          }}
        >
          {["★", "✦", "●", "◆", "▲"][i % 5]}
        </span>
      ))}

      <div
        className="max-w-sm w-full mx-4 text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-black text-foreground mb-2">{isAr ? "نتيجة كاملة!" : "Perfect Score!"}</h2>
        <p className="text-muted-foreground mb-2">
          {isAr ? `${toArabicDigits(score)}/${toArabicDigits(total)}: دون أي خطأ! ` : `${score}/${total}: Flawless! `}<span lang="ko">화이팅!</span>
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-klovers-yellow text-charcoal font-bold text-lg mb-6 border border-charcoal">
          {isAr ? "كل الإجابات صحيحة!" : "You got them all!"}
        </div>
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isAr ? "متابعة" : "CONTINUE"}
        </button>
        <p className="text-xs text-muted-foreground mt-3">{isAr ? "أو الضغط في أي مكان" : "or tap anywhere"}</p>
      </div>
    </div>
  );
}

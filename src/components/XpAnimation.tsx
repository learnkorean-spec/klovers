import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Zap, Star, Trophy } from "lucide-react";
import { getLeague, LEAGUES } from "@/constants/gamification";

// --- Floating XP animation ---
export function XpFloatAnimation({ xp, onComplete }: { xp: number; onComplete?: () => void }) {
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
          +{xp} XP
        </div>
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
  const from = LEAGUES.find((l) => l.key === fromLeague);
  const to = LEAGUES.find((l) => l.key === toLeague);

  if (!to) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">{to.emoji}</div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="h-5 w-5 text-primary" />
          <Star className="h-6 w-6 text-primary" />
          <Star className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">League Promoted!</h2>
        <p className="text-muted-foreground mb-4">
          {from && (
            <span>
              {from.emoji} {from.name} → {" "}
            </span>
          )}
          <span className="font-bold text-primary">{to.name}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Keep studying to reach the next league! 화이팅! 🔥
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
}

// --- Badge Unlock Celebration ---
export function BadgeUnlockToast({ badgeName, badgeEmoji }: { badgeName: string; badgeEmoji: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{badgeEmoji}</span>
      <div>
        <p className="font-bold text-foreground">Badge Unlocked!</p>
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-scale-in">
        <div className="text-6xl mb-3">⭐</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Mission Complete!</h2>
        <p className="text-muted-foreground mb-4">{lessonTitle}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-lg mb-6">
          <Zap className="h-5 w-5" /> +{xpEarned} XP
        </div>
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

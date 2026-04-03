import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VocabularyReview } from "@/components/VocabularyReview";
import { useSRS } from "@/hooks/useSRS";
import { useGamification } from "@/hooks/useGamification";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, ArrowLeft, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LeaguePromotionModal, BadgeUnlockToast } from "@/components/XpAnimation";
import { useToast } from "@/hooks/use-toast";
import { BADGES } from "@/constants/gamification";

export function VocabularyReviewPage() {
  useSEO({
    title: "Vocabulary Review",
    description: "Review your Korean vocabulary with spaced repetition on Klovers. Master words faster with smart flashcard scheduling.",
    canonical: "https://kloversegy.com/review",
  });

  const navigate = useNavigate();
  const { dueCards, loading: srsLoading, recordReview } = useSRS();
  const { awardXp, leaguePromotion, newBadges, clearLeaguePromotion, clearNewBadges } = useGamification();
  const { toast: uiToast } = useToast();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeKey => {
        const badge = BADGES.find(b => b.key === badgeKey);
        if (badge) {
          uiToast({
            description: <BadgeUnlockToast badgeName={badge.name} badgeEmoji={badge.emoji} />,
            duration: 4000,
          });
        }
      });
      clearNewBadges();
    }
  }, [newBadges]);

  const handleReviewComplete = async (vocabId: number, quality: number) => {
    try {
      await recordReview(vocabId, quality);
      setXpEarned((prev) => prev + 5);
      await awardXp(0, "review");
    } catch {
      toast.error("Could not save review. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main id="main-content" className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Page header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/textbook")} className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Textbook
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">Vocabulary Review</h1>
            </div>
            <p className="text-muted-foreground">Master your vocabulary with spaced repetition</p>
          </div>

          {/* Stats cards */}
          {!sessionStarted && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Due Today", value: dueCards.length, sub: "cards ready to review" },
                { label: "Time Needed", value: Math.max(1, Math.ceil(dueCards.length / 20)), sub: "minutes (~20 cards/min)" },
                { label: "XP Available", value: `${dueCards.length * 5}`, sub: "5 XP per card" },
              ].map(({ label, value, sub }) => (
                <Card key={label}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Main content */}
          {srsLoading ? (
            <Card className="border-2">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">Loading your vocabulary review…</p>
                </div>
              </CardContent>
            </Card>
          ) : dueCards.length === 0 && !sessionStarted ? (
            <Card className="border-2">
              <CardContent className="text-center py-12">
                <span className="text-6xl block mb-4">🎉</span>
                <h2 className="text-2xl font-bold text-foreground mb-2">No Cards Due Today!</h2>
                <p className="text-muted-foreground mb-6">You've reviewed all vocabulary items. Come back tomorrow!</p>
                <Button onClick={() => navigate("/textbook")} className="gap-2">
                  <BookOpen className="w-4 h-4" /> Continue Learning
                </Button>
              </CardContent>
            </Card>
          ) : !sessionStarted ? (
            <Card className="border-2">
              <CardContent className="py-12 text-center">
                <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Review?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You have <strong>{dueCards.length}</strong> vocabulary items ready.
                  This session will take about {Math.max(1, Math.ceil(dueCards.length / 20))} minutes.
                </p>
                <Button onClick={() => setSessionStarted(true)} size="lg" className="gap-2">
                  <BookOpen className="w-4 h-4" /> Start Review Session
                </Button>
                <div className="mt-8 text-left space-y-3 bg-muted/50 p-6 rounded-xl">
                  <h3 className="font-semibold text-sm text-foreground">💡 Tips</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li>• Rate yourself honestly — this helps the algorithm work better</li>
                    <li>• "Again" = complete blackout (card repeats tomorrow)</li>
                    <li>• "Easy" = perfect response (card won't appear for weeks)</li>
                    <li>• Take breaks every 20 cards to stay focused</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              <VocabularyReview cards={dueCards} onComplete={handleReviewComplete} isLoading={srsLoading} />
              {xpEarned > 0 && (
                <div className="mt-8 text-center">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6 pb-5">
                      <p className="text-sm text-muted-foreground mb-1">XP Earned This Session</p>
                      <p className="text-3xl font-bold text-primary">+{xpEarned} XP</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      {leaguePromotion && (
        <LeaguePromotionModal
          fromLeague={leaguePromotion.fromLeague}
          toLeague={leaguePromotion.toLeague}
          onClose={clearLeaguePromotion}
        />
      )}
    </div>
  );
}

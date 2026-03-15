import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VocabularyReview } from "@/components/VocabularyReview";
import { useSRS } from "@/hooks/useSRS";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, ArrowLeft, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function VocabularyReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dueCards, loading: srsLoading, recordReview } = useSRS();
  const { awardXp } = useGamification();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const handleReviewComplete = async (vocabId: number, quality: number) => {
    try {
      await recordReview(vocabId, quality);

      // Award 5 XP per card reviewed
      setXpEarned((prev) => prev + 5);

      // Award XP to gamification system
      // Using lesson_id 0 for review (not tied to specific lesson)
      await awardXp(0, "review");
    } catch (error) {
      console.error("Failed to complete review:", error);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Please log in to review</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/textbook")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Textbook
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold">Vocabulary Review</h1>
          </div>
          <p className="text-muted-foreground">
            Master your vocabulary with spaced repetition
          </p>
        </div>

        {/* Stats Cards */}
        {!sessionStarted && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Due Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dueCards.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  cards ready to review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Time Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {Math.ceil(dueCards.length / 20)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  minutes (~20 cards/min)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  XP Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dueCards.length * 5}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  5 XP per card
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {srsLoading ? (
          <Card className="border-2">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">
                  Loading your vocabulary review...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : dueCards.length === 0 && !sessionStarted ? (
          <Card className="border-2">
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <span className="text-6xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">No Cards Due Today!</h2>
              <p className="text-muted-foreground mb-6">
                You've reviewed all vocabulary items. Come back tomorrow!
              </p>
              <Button
                onClick={() => navigate("/textbook")}
                variant="default"
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Continue Learning
              </Button>
            </CardContent>
          </Card>
        ) : !sessionStarted ? (
          <Card className="border-2">
            <CardContent className="py-12 text-center">
              <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Review?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You have {dueCards.length} vocabulary items ready for review.
                This session will take about {Math.ceil(dueCards.length / 20)}{" "}
                minutes.
              </p>
              <Button
                onClick={() => setSessionStarted(true)}
                size="lg"
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Start Review Session
              </Button>

              {/* Tips */}
              <div className="mt-8 text-left space-y-3 bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold text-sm">💡 Tips:</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    • Rate yourself honestly - this helps the algorithm work
                    better
                  </li>
                  <li>
                    • "Again" = complete blackout (card repeats tomorrow)
                  </li>
                  <li>
                    • "Easy" = perfect response (card won't appear for weeks)
                  </li>
                  <li>
                    • Take breaks every 20 cards to stay focused
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <VocabularyReview
              cards={dueCards}
              onComplete={handleReviewComplete}
              isLoading={srsLoading}
            />

            {/* XP Indicator */}
            {xpEarned > 0 && (
              <div className="mt-8 text-center">
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      XP Earned This Session
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      +{xpEarned} XP
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

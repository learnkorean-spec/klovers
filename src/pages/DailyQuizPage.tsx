import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { XP_VALUES } from "@/constants/gamification";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LeaguePromotionModal, BadgeUnlockToast, StreakCelebration, XpFloatAnimation } from "@/components/XpAnimation";
import { BADGES } from "@/constants/gamification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft, Zap, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { NextStepCard } from "@/components/NextStepCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExerciseItem {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  lesson_id: number;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  xpEarned: number;
}

const DailyQuizPage = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: "Daily Quiz - Klovers",
    description: "Test your vocabulary knowledge with our daily quiz.",
    canonical: "https://kloversegy.com/daily-quiz",
  });

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { awardXp, leaguePromotion, newBadges, streakCelebration, clearLeaguePromotion, clearNewBadges, clearStreakCelebration } = useGamification();
  const [xpFloat, setXpFloat] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeKey => {
        const badge = BADGES.find(b => b.key === badgeKey);
        if (badge) {
          toast({
            description: <BadgeUnlockToast badgeName={badge.name} badgeEmoji={badge.emoji} />,
            duration: 4000,
          });
        }
      });
      clearNewBadges();
    }
  }, [newBadges]);

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizAlreadyDone, setQuizAlreadyDone] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve before acting
    if (!user) return;       // AuthProtectedRoute already handles redirect to login
    fetchDailyQuiz();
  }, [user, authLoading]);

  const fetchDailyQuiz = async () => {
    if (!user) return;
    setFetchError(null);
    setLoading(true);
    try {

    // Check if quiz already done today (use maybeSingle to avoid error on no rows)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingQuiz } = await supabase
      .from("student_xp")
      .select("id")
      .eq("user_id", user.id)
      .eq("activity_type", "challenge")
      .gte("created_at", today.toISOString())
      .limit(1)
      .maybeSingle();

    if (existingQuiz) {
      setQuizAlreadyDone(true);
      setLoading(false);
      return;
    }

    // Try to get exercises from completed lessons first
    const { data: completedLessons } = await supabase
      .from("student_lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("vocab_done", true);

    let exerciseQuery = supabase.from("lesson_exercises").select("*");

    // If user has completed lessons, prefer those; otherwise use all available
    if (completedLessons && completedLessons.length > 0) {
      const lessonIds = completedLessons.map((l) => l.lesson_id);
      exerciseQuery = exerciseQuery.in("lesson_id", lessonIds);
    }

    const { data: allExercises } = await exerciseQuery;

    // Fallback: if still no exercises, fetch from all lessons
    let finalExercises = allExercises;
    if (!finalExercises || finalExercises.length === 0) {
      const { data: fallbackExercises } = await supabase
        .from("lesson_exercises")
        .select("*")
        .limit(50);
      finalExercises = fallbackExercises;
    }

    if (!finalExercises || finalExercises.length === 0) {
      setLoading(false);
      return; // Show empty state in render
    }

    // Shuffle and take first 10, normalise options from Json → string[]
    const shuffled = finalExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map((ex: any) => ({
        ...ex,
        options: Array.isArray(ex.options)
          ? ex.options.map(String)
          : typeof ex.options === "object" && ex.options !== null
          ? Object.values(ex.options).map(String)
          : [],
      }));

    setExercises(shuffled as ExerciseItem[]);
    setLoading(false);
    } catch (err) {
      console.error("[daily-quiz]", err);
        setFetchError(t("dailyQuiz.loadFailed"));
      setLoading(false);
    }
  };

  const currentExercise = exercises[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const progressPercent = (totalAnswered / exercises.length) * 100;
  const correctCount = Object.entries(answers).filter(
    ([id, answerIdx]) =>
      exercises.find((e) => e.id === id)?.correct_index === answerIdx
  ).length;

  const handleAnswer = (answerIdx: number) => {
    if (!currentExercise) return;
    setAnswers((prev) => ({ ...prev, [currentExercise.id]: answerIdx }));
    setShowResults((prev) => ({ ...prev, [currentExercise.id]: true }));
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (totalAnswered < exercises.length) {
      toast({
        title: t("dailyQuiz.answerAll"),
        description: t("dailyQuiz.remainingCount").replace("{count}", String(exercises.length - totalAnswered)),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const percentage = Math.round((correctCount / exercises.length) * 100);
    const passed = percentage >= 70;
    const xpEarned = XP_VALUES.challenge;

    await awardXp(0, "challenge");
    setXpFloat(xpEarned);

    setResult({
      score: correctCount,
      total: exercises.length,
      percentage,
      passed,
      xpEarned,
    });

    setSubmitting(false);
  };

  // Show spinner while auth OR quiz data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-klovers-yellow mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("dailyQuiz.loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center space-y-3 max-w-sm">
            {/* needs Klovers icon: error state (was an emoji) */}
            <AlertCircle className="mx-auto h-10 w-10 text-wrong dark:text-[#FF3131]" aria-hidden="true" />
            <h2 className="font-semibold text-foreground">{t("dailyQuiz.loadErrorTitle")}</h2>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <button onClick={() => fetchDailyQuiz()} className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80">{t("dailyQuiz.tryAgainBtn")}</button>
          </div>
        </main>
      </div>
    );
  }

  if (quizAlreadyDone) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-klovers-green">
                <CheckCircle className="h-8 w-8 text-charcoal" />
              </div>
              <CardTitle className="text-2xl">{t("dailyQuiz.alreadyDoneTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                {t("dailyQuiz.alreadyDoneDesc")}
              </p>
              {/* Countdown to next quiz */}
              {(() => {
                const now = new Date();
                const midnight = new Date();
                midnight.setHours(24, 0, 0, 0);
                const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / 3600000);
                const minutesLeft = Math.floor(((midnight.getTime() - now.getTime()) % 3600000) / 60000);
                return (
                  <p className="text-xs text-muted-foreground text-center">
                    {t("dailyQuiz.nextQuizIn").replace("{hours}", String(hoursLeft)).replace("{mins}", String(minutesLeft))}
                  </p>
                );
              })()}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("dailyQuiz.streakHint")}
                </p>
                <Button asChild className="w-full">
                  <a href="/review">{t("dailyQuiz.startReview")}</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // No exercises available at all
  if (!loading && exercises.length === 0 && !quizAlreadyDone) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-klovers-yellow border border-charcoal/10">
                <Zap className="h-8 w-8 text-charcoal" />
              </div>
              <CardTitle className="text-2xl">{t("dailyQuiz.startLearningTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("dailyQuiz.startLearningDesc")}
              </p>
              <Button asChild className="w-full">
                <a href="/dashboard">{t("dailyQuiz.goDashboard")}</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!quizStarted && exercises.length > 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              {/* World mode: the daily quiz is a walk through the Vocabulary Market (lead: the two learners). */}
              <div className="relative -mx-2 mb-3 h-28 overflow-hidden rounded-xl border border-border bg-ivory dark:bg-card sm:h-32">
                <img
                  src="/assets/story/world-vocabulary-market.webp"
                  alt={isAr ? "سوق المفردات، بأكشاكه وفوانيسه في عالم كلوفرز" : "The Vocabulary Market, its stalls and lanterns, in the Klovers world"}
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-3 text-start text-[11px] font-extrabold uppercase tracking-wider text-klovers-yellow">
                  <Zap className="me-1 inline h-3.5 w-3.5 fill-klovers-yellow align-[-2px]" aria-hidden="true" />
                  {isAr ? "سوق المفردات" : "Vocabulary Market"}
                </p>
              </div>
              <CardTitle className="text-2xl">{t("dailyQuiz.dailyChallengeTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isAr ? "الأكشاك مفتوحة، وكلمات اليوم معروضة من الدروس المكتملة." : "The stalls are open. Today's words are laid out from the lessons already finished."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-4xl font-bold text-foreground">{exercises.length}</p>
                <p className="text-muted-foreground mt-1">{t("dailyQuiz.fromCompletedLessons")}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t("dailyQuiz.earn")}</p>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  +30 XP
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("dailyQuiz.passNote")}
              </p>
              <Button onClick={() => setQuizStarted(true)} size="lg" className="w-full">
                {t("dailyQuiz.startQuizBtn")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div
                className={cn(
                  "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
                  result.passed ? "bg-klovers-green" : "bg-klovers-yellow"
                )}
              >
                <CheckCircle
                  className={cn(
                    "h-8 w-8",
                    result.passed ? "text-charcoal" : "text-charcoal"
                  )}
                />
              </div>
              <CardTitle className="text-2xl">{t("dailyQuiz.quizComplete")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-4xl font-bold text-foreground">
                  {result.score}/{result.total}
                </p>
                <p className="text-muted-foreground mt-1">
                  {result.percentage}% - {result.passed ? t("dailyQuiz.passed") : t("dailyQuiz.reviewMore")}
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("dailyQuiz.xpEarnedLabel")}</p>
                  <p className="inline-block rounded-full bg-klovers-yellow px-3 text-2xl font-bold text-charcoal">+{result.xpEarned} XP</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {result.passed ? t("dailyQuiz.passedMsg") : t("dailyQuiz.failedMsg")}
              </p>

              <div className="pt-4 border-t">
                <NextStepCard completedType="quiz" />
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentExercise) {
    // Safety fallback — exercises exist but index is out of range
    setCurrentIndex(0);
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {xpFloat !== null && <XpFloatAnimation xp={xpFloat} onComplete={() => setXpFloat(null)} />}
      {streakCelebration !== null && <StreakCelebration currentStreak={streakCelebration} onContinue={clearStreakCelebration} />}
      {leaguePromotion && (
        <LeaguePromotionModal
          fromLeague={leaguePromotion.fromLeague}
          toLeague={leaguePromotion.toLeague}
          onClose={clearLeaguePromotion}
        />
      )}
      <main id="main-content" className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t("dailyQuiz.questionOf").replace("{current}", String(currentIndex + 1)).replace("{total}", String(exercises.length))}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">{currentExercise.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={
                  answers[currentExercise.id] !== undefined
                    ? answers[currentExercise.id].toString()
                    : ""
                }
                onValueChange={(val) => handleAnswer(parseInt(val))}
              >
                <div className="space-y-3">
                  {currentExercise.options.map((option, idx) => {
                    const selected = answers[currentExercise.id] === idx;
                    const isCorrect = idx === currentExercise.correct_index;
                    const showAnswer = showResults[currentExercise.id];

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
                          showAnswer && isCorrect && "bg-klovers-green/15 dark:bg-klovers-green/10 border-klovers-green",
                          showAnswer && selected && !isCorrect && "bg-[#FF3131]/10 border-[#FF3131]",
                          !showAnswer && "hover:border-klovers-yellow hover:bg-klovers-yellow/10"
                        )}
                      >
                        <RadioGroupItem
                          value={idx.toString()}
                          id={`option-${idx}`}
                          disabled={showAnswer}
                        />
                        <Label
                          htmlFor={`option-${idx}`}
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {option}
                        </Label>
                        {showAnswer && isCorrect && (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-klovers-green text-charcoal"><Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></span>
                        )}
                        {showAnswer && selected && !isCorrect && (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#FF3131] text-charcoal"><X className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {/* Explanation shown immediately after a wrong answer */}
              {showResults[currentExercise.id] && answers[currentExercise.id] !== currentExercise.correct_index && currentExercise.explanation && (
                <div className="mt-4 p-3 rounded-lg bg-ivory dark:bg-card border border-charcoal/15 dark:border-border">
                  <p className="text-xs font-semibold text-foreground mb-1">{t("dailyQuiz.explanation")}</p>
                  <p className="text-sm text-foreground/90">{currentExercise.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3 justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("dailyQuiz.previous")}
            </Button>

            {currentIndex === exercises.length - 1 ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? t("dailyQuiz.submitting") : t("dailyQuiz.submitQuiz")}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!showResults[currentExercise.id]}
              >
                {t("dailyQuiz.nextBtn")} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DailyQuizPage;

import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  useSEO({
    title: "Daily Quiz - K-Lovers",
    description: "Test your vocabulary knowledge with our daily quiz.",
    canonical: "https://kloversegy.com/daily-quiz",
  });

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { awardXp } = useGamification();
  const { toast } = useToast();

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizAlreadyDone, setQuizAlreadyDone] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve before acting
    if (!user) return;       // AuthProtectedRoute already handles redirect to login
    fetchDailyQuiz();
  }, [user, authLoading]);

  const fetchDailyQuiz = async () => {
    if (!user) return;

    setLoading(true);

    // Check if quiz already done today (use maybeSingle to avoid error on no rows)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingQuiz } = await supabase
      .from("student_xp")
      .select("id")
      .eq("user_id", user.id)
      .eq("activity_type", "daily_quiz")
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
        title: "Please answer all questions",
        description: `${exercises.length - totalAnswered} questions remaining.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const percentage = Math.round((correctCount / exercises.length) * 100);
    const passed = percentage >= 70;
    const xpEarned = 30; // Base XP for daily quiz

    // Save quiz result to student_xp
    const { error } = await supabase.from("student_xp").insert({
      user_id: user!.id,
      lesson_id: null,
      activity_type: "daily_quiz",
      xp_earned: xpEarned,
    });

    if (error) {
      toast({
        title: "Error saving quiz",
        description: error.message,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Award XP through gamification system
    await awardXp(0, "challenge");

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your daily quiz...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  if (quizAlreadyDone) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Quiz Already Done Today!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                You've already completed your daily quiz. Come back tomorrow for a fresh challenge!
              </p>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  💪 Keep up your learning streak by reviewing vocabulary instead!
                </p>
                <Button asChild className="w-full">
                  <a href="/review">Start Review Session</a>
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Start Learning First!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The Daily Quiz unlocks once your lessons have exercises. Complete your first lesson to get started!
              </p>
              <Button asChild className="w-full">
                <a href="/dashboard">Go to Dashboard</a>
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Daily Quiz Challenge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-4xl font-bold text-primary">{exercises.length}</p>
                <p className="text-muted-foreground mt-1">Questions from your completed lessons</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Earn</p>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  +30 XP
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Score 70%+ to pass and earn your bonus points!
              </p>
              <Button onClick={() => setQuizStarted(true)} size="lg" className="w-full">
                Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
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
                  result.passed ? "bg-green-100" : "bg-orange-100"
                )}
              >
                <CheckCircle
                  className={cn(
                    "h-8 w-8",
                    result.passed ? "text-green-600" : "text-orange-600"
                  )}
                />
              </div>
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-4xl font-bold text-primary">
                  {result.score}/{result.total}
                </p>
                <p className="text-muted-foreground mt-1">
                  {result.percentage}% - {result.passed ? "PASSED ✅" : "REVIEW MORE 📚"}
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">XP Earned</p>
                  <p className="text-2xl font-bold text-yellow-600">+{result.xpEarned} XP</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {result.passed
                  ? "Great job! You've mastered these vocabulary items. Keep it up!"
                  : "Review the lessons and come back for more. Every attempt makes you stronger!"}
              </p>

              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button className="flex-1" onClick={() => navigate("/review")}>
                  Review Vocabulary
                </Button>
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
      <main id="main-content" className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentIndex + 1} of {exercises.length}
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
                          showAnswer && isCorrect && "bg-green-50 border-green-500",
                          showAnswer && selected && !isCorrect && "bg-red-50 border-red-500",
                          !showAnswer && "hover:border-primary/40 hover:bg-accent"
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
                          <span className="text-green-600 text-sm font-bold">✓</span>
                        )}
                        {showAnswer && selected && !isCorrect && (
                          <span className="text-red-600 text-sm font-bold">✗</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {showResults[currentExercise.id] &&
                currentExercise.explanation && (
                  <div
                    className={cn(
                      "mt-4 p-3 rounded-lg",
                      answers[currentExercise.id] ===
                        currentExercise.correct_index
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    )}
                  >
                    <p className="text-sm">
                      <strong>
                        {answers[currentExercise.id] ===
                        currentExercise.correct_index
                          ? "✅ Correct: "
                          : "❌ Explanation: "}
                      </strong>
                      {currentExercise.explanation}
                    </p>
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
              Previous
            </Button>

            {currentIndex === exercises.length - 1 ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!showResults[currentExercise.id]}
              >
                Next <ArrowRight className="h-4 w-4 ml-2" />
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

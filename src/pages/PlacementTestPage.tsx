import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PLACEMENT_QUESTIONS, computePlacementResult, type PlacementResult } from "@/constants/placementQuestions";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QUESTIONS_PER_PAGE = 10;
const TOTAL_PAGES = Math.ceil(PLACEMENT_QUESTIONS.length / QUESTIONS_PER_PAGE);

const PlacementTestPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const currentQuestions = PLACEMENT_QUESTIONS.slice(
    page * QUESTIONS_PER_PAGE,
    (page + 1) * QUESTIONS_PER_PAGE
  );

  const answeredOnPage = currentQuestions.filter((q) => answers[q.id] !== undefined).length;
  const totalAnswered = Object.keys(answers).length;
  const progressPercent = (totalAnswered / PLACEMENT_QUESTIONS.length) * 100;

  const handleSubmit = async () => {
    if (totalAnswered < PLACEMENT_QUESTIONS.length) {
      toast({ title: "Please answer all questions", description: `${PLACEMENT_QUESTIONS.length - totalAnswered} questions remaining.`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const res = computePlacementResult(answers);

    const { error } = await supabase.from("placement_tests").insert({
      user_id: userId!,
      score: res.score,
      level: res.levelKey,
    });

    if (error) {
      toast({ title: "Error saving result", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Update profile level
    await supabase.from("profiles").update({ level: res.levelKey }).eq("user_id", userId!);

    setResult(res);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Your Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-4xl font-bold text-primary">{result.score} / {PLACEMENT_QUESTIONS.length}</p>
                <p className="text-muted-foreground mt-1">Total Score</p>
              </div>
              <div>
                <Badge className="text-base px-4 py-2">{result.levelLabel}</Badge>
                <p className="text-sm text-muted-foreground mt-2">Recommended Level</p>
              </div>
              <Button size="lg" className="w-full" onClick={() => navigate("/enroll")}>
                Enroll in Recommended Course <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Placement Test</h1>
          <p className="text-muted-foreground">Answer all 40 questions to find your recommended Korean level.</p>
        </div>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Page {page + 1} of {TOTAL_PAGES}</span>
            <span>{totalAnswered} / {PLACEMENT_QUESTIONS.length} answered</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentQuestions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Badge variant="outline" className="shrink-0 text-xs">{q.section}</Badge>
                  <p className="font-medium">
                    <span className="text-muted-foreground mr-2">Q{q.id}.</span>
                    {q.question}
                  </p>
                </div>
                <RadioGroup
                  value={answers[q.id]?.toString()}
                  onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: parseInt(val) }))}
                  className="space-y-2 ml-1"
                >
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center space-x-3">
                      <RadioGroupItem value={oi.toString()} id={`q${q.id}-o${oi}`} />
                      <Label htmlFor={`q${q.id}-o${oi}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pb-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          {page < TOTAL_PAGES - 1 ? (
            <Button onClick={() => setPage((p) => p + 1)}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Test"}
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlacementTestPage;

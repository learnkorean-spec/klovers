import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PLACEMENT_QUESTIONS, computePlacementResult, type PlacementResult } from "@/constants/placementQuestions";
import { CheckCircle, ArrowRight, ArrowLeft, BookOpen, Gamepad2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QUESTIONS_PER_PAGE = 10;
const TOTAL_PAGES = Math.ceil(PLACEMENT_QUESTIONS.length / QUESTIONS_PER_PAGE);

const LEVEL_META: Record<string, { emoji: string; tagline: string; description: string }> = {
  A1: { emoji: "🌱", tagline: "Absolute Beginner", description: "You're just starting out. Our A1 class will teach you Hangul, basic greetings, and everyday words." },
  A2: { emoji: "🌿", tagline: "Elementary", description: "You know some basics. Our A2 class builds simple sentences, numbers, and daily conversations." },
  B1: { emoji: "📚", tagline: "Intermediate", description: "You can hold simple conversations. Our B1 class covers grammar patterns and real-life dialogues." },
  B2: { emoji: "🎯", tagline: "Upper-Intermediate", description: "You're comfortable in Korean. Our B2 class dives into nuanced grammar and natural speech." },
  C1: { emoji: "🏆", tagline: "Advanced", description: "You speak Korean fluently. Our C1 class polishes academic and professional Korean." },
  C2: { emoji: "👑", tagline: "Mastery", description: "Near-native proficiency. Our C2 class refines complex expression and prepares you for TOPIK II." },
};

const PlacementTestPage = () => {
  useSEO({ title: "Korean Placement Test", description: "Take the free Klovers Korean placement test. Discover your level and find the perfect course for your learning journey.", canonical: "https://kloversegy.com/placement-test" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "placement-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": "Free Korean Language Placement Test",
      "description": "Take the free Klovers Korean placement test to discover your level from A1 beginner to C2 advanced and find the perfect course.",
      "url": "https://kloversegy.com/placement-test",
      "provider": { "@id": "https://kloversegy.com/#organization" },
      "educationalAlignment": {
        "@type": "AlignmentObject",
        "educationalFramework": "TOPIK",
        "targetName": "Korean Language Proficiency"
      }
    });
    document.head.appendChild(script);
    return () => { document.getElementById("placement-schema")?.remove(); };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, []);

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

    const res = computePlacementResult(answers);

    if (!userId) {
      // Not logged in — show result but prompt to sign up to save
      setResult(res);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("placement_tests").insert({
      user_id: userId,
      score: res.score,
      level: res.levelKey,
    });

    if (error) {
      toast({ title: "Error saving result", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Update profile level
    await supabase.from("profiles").update({ level: res.levelKey }).eq("user_id", userId);

    setResult(res);
    setSubmitting(false);
  };


  if (result) {
    const meta = LEVEL_META[result.levelKey] ?? { emoji: "🎓", tagline: "Your Level", description: "Ready to start your Korean journey?" };
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-4">

            {/* Result hero card */}
            <Card className="text-center overflow-hidden">
              <div className="bg-primary/10 py-8 px-6">
                <div className="text-6xl mb-3">{meta.emoji}</div>
                <div className="inline-block bg-primary text-primary-foreground text-xl font-bold px-5 py-2 rounded-full mb-2">
                  {result.levelLabel}
                </div>
                <p className="text-sm font-semibold text-foreground">{meta.tagline}</p>
              </div>
              <CardContent className="pt-5 pb-6 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <span>Score: <strong className="text-foreground">{result.score} / {PLACEMENT_QUESTIONS.length}</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* CTA card */}
            <Card>
              <CardContent className="pt-5 pb-5 space-y-3">
                <p className="text-sm font-semibold text-foreground text-center">Ready to start learning?</p>

                <Button size="lg" className="w-full" onClick={() => navigate("/enroll")}>
                  📚 Book a {result.levelLabel} Class <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {!userId && (
                  <Button variant="outline" className="w-full" onClick={() => navigate("/signup")}>
                    Save My Result — Sign Up Free
                  </Button>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { icon: <Users className="h-3.5 w-3.5" />, label: "1,000+ students" },
                    { icon: <BookOpen className="h-3.5 w-3.5" />, label: "A1–C2 levels" },
                    { icon: <Gamepad2 className="h-3.5 w-3.5" />, label: "13 free games" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 text-center">
                      <span className="text-muted-foreground">{icon}</span>
                      <span className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate("/")} className="w-full text-xs text-muted-foreground hover:underline pt-1">
                  Back to home
                </button>
              </CardContent>
            </Card>

          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
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

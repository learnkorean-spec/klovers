import { useEffect, useRef, useState } from "react";
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
import { CheckCircle, ArrowRight, ArrowLeft, BookOpen, Gamepad2, Users, SkipForward, Undo2, ClipboardList, ChevronDown, ChevronUp, TrendingUp, Share2, RefreshCw, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QUESTIONS_PER_PAGE = 5;
const TOTAL_PAGES = Math.ceil(PLACEMENT_QUESTIONS.length / QUESTIONS_PER_PAGE);
const STORAGE_KEY = "klovers_placement_draft";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// Keys match levelKey values returned by computePlacementResult
const LEVEL_META: Record<string, { emoji: string; tagline: string; description: string; nextLabel?: string; prevLabel?: string }> = {
  foundation: { emoji: "🌱", tagline: "Absolute Beginner", description: "You're just starting out. Our Foundation class will teach you Hangul, basic greetings, and everyday words.", nextLabel: "Level 1" },
  level_1:    { emoji: "🌿", tagline: "Beginner (A1)", description: "You know the basics. Our Level 1 class builds simple sentences, numbers, and daily conversations.", nextLabel: "Level 2", prevLabel: "Foundation" },
  level_2:    { emoji: "📚", tagline: "Elementary (A2)", description: "You can handle simple exchanges. Our Level 2 class covers grammar patterns and real-life dialogues.", nextLabel: "Level 3–4", prevLabel: "Level 1" },
  level_3:    { emoji: "🎯", tagline: "Intermediate (B1–B2)", description: "You're comfortable in Korean. Our Level 3–4 class dives into nuanced grammar and natural speech.", nextLabel: "Level 5–6", prevLabel: "Level 2" },
  level_5:    { emoji: "🏆", tagline: "Advanced (C1–C2)", description: "You speak Korean fluently. Our Level 5–6 class polishes academic and professional Korean for TOPIK II.", prevLabel: "Level 3–4" },
};

const SECTION_BANNERS: Record<number, { label: string; hint: string }> = {
  0: { label: "Foundation", hint: "Hangul recognition & core vocabulary" },
  1: { label: "TOPIK 1 — A1 Beginner", hint: "Basic grammar particles & simple sentences" },
  2: { label: "TOPIK 2 — A2 Elementary", hint: "Connectors, tense & polite expressions" },
  3: { label: "TOPIK 3–4 — B1/B2 Intermediate", hint: "Complex grammar patterns & reading passages" },
  4: { label: "TOPIK 5–6 — C1/C2 Advanced", hint: "Advanced grammar nuance & academic reading" },
};

const BAND_LABELS = ["Foundation", "TOPIK 1", "TOPIK 2", "TOPIK 3–4", "TOPIK 5–6"];

const PlacementTestPage = () => {
  useSEO({ title: "Korean Placement Test", description: "Take the free Klovers Korean placement test. Discover your level and find the perfect course for your learning journey.", canonical: "https://kloversegy.com/placement-test" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"test" | "review" | "result">("test");
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [focusedQId, setFocusedQId] = useState<number | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const skippedRef   = useRef(skipped);
  const startTimeRef = useRef<number | null>(null);
  const finalTimeRef = useRef(0);
  useEffect(() => { skippedRef.current = skipped; }, [skipped]);

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
      if (session) setUserId(session.user.id);
    };
    checkAuth();
  }, []);

  // Restore saved progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const { answers: a, skipped: s, page: p, elapsed: e } = JSON.parse(saved);
      if (a && Object.keys(a).length > 0) {
        setAnswers(a);
        setSkipped(new Set(s ?? []));
        setPage(p ?? 0);
        setElapsedSeconds(e ?? 0);
        if (e) startTimeRef.current = Date.now() - e * 1000;
        toast({ title: "Test resumed", description: "Your previous progress has been restored." });
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist progress to localStorage as user answers
  useEffect(() => {
    if (phase !== "test") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        skipped: [...skipped],
        page,
        elapsed: elapsedSeconds,
      }));
    } catch { /* ignore */ }
  }, [answers, skipped, page, elapsedSeconds, phase]);

  // Tick elapsed timer (starts on first answer)
  useEffect(() => {
    if (phase !== "test") return;
    const id = setInterval(() => {
      if (startTimeRef.current !== null)
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const currentQuestions = PLACEMENT_QUESTIONS.slice(
    page * QUESTIONS_PER_PAGE,
    (page + 1) * QUESTIONS_PER_PAGE
  );

  const totalAnswered  = Object.keys(answers).length;
  const totalSkipped   = skipped.size;
  const totalDone      = totalAnswered + totalSkipped;
  const totalRemaining = PLACEMENT_QUESTIONS.length - totalDone;
  const progressPercent = (totalDone / PLACEMENT_QUESTIONS.length) * 100;

  // Auto-focus first unanswered question when page changes
  useEffect(() => {
    const first = currentQuestions.find(q => !skippedRef.current.has(q.id) && answers[q.id] === undefined);
    setFocusedQId(first?.id ?? currentQuestions[0]?.id ?? null);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: 1-4 to answer focused question, then advance focus
  useEffect(() => {
    if (phase !== "test") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (focusedQId === null) return;
      const digit = parseInt(e.key);
      if (isNaN(digit) || digit < 1 || digit > 4) return;
      const q = PLACEMENT_QUESTIONS.find(q => q.id === focusedQId);
      if (!q || skippedRef.current.has(q.id) || digit > q.options.length) return;
      e.preventDefault();
      startTimer();
      setAnswers(prev => ({ ...prev, [focusedQId]: digit - 1 }));
      const idx = currentQuestions.findIndex(cq => cq.id === focusedQId);
      const next = currentQuestions.slice(idx + 1).find(cq => !skippedRef.current.has(cq.id));
      if (next) setFocusedQId(next.id);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedQId, phase, currentQuestions]);

  const startTimer = () => { if (!startTimeRef.current) startTimeRef.current = Date.now(); };

  const handleSkip = (id: number) => {
    startTimer();
    setAnswers((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setSkipped((prev) => new Set(prev).add(id));
  };

  const handleUnskip = (id: number) => {
    setSkipped((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleSubmit = async () => {
    if (totalAnswered === 0) {
      toast({ title: "Answer at least one question before submitting.", variant: "destructive" });
      return;
    }
    finalTimeRef.current = elapsedSeconds;
    localStorage.removeItem(STORAGE_KEY);
    const res = computePlacementResult(answers);
    if (!userId) { setResult(res); setPhase("result"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("placement_tests").insert({
      user_id: userId, score: res.score, level: res.levelKey,
    });
    if (error) {
      toast({ title: "Error saving result", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    await supabase.from("profiles").update({ level: res.levelKey }).eq("user_id", userId);
    setResult(res);
    setPhase("result");
    setSubmitting(false);
  };

  const handleRetake = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({}); setSkipped(new Set()); setPage(0);
    setFocusedQId(null); setResult(null); setShowExplanations(false);
    setElapsedSeconds(0); startTimeRef.current = null; finalTimeRef.current = 0;
    setPhase("test");
  };

  const handleShare = (res: PlacementResult) => {
    const text = `I scored ${res.score}/20 on the Klovers Korean Placement Test!\nMy level: ${res.levelLabel}\nFind yours → kloversegy.com/placement-test`;
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied to clipboard!", description: "Share your level with friends." }))
      .catch(() => toast({ title: "kloversegy.com/placement-test", description: "Copy the link to share your result." }));
  };

  // ── Review screen ──────────────────────────────────────────
  if (phase === "review") {
    const statusOf = (id: number) =>
      skipped.has(id) ? "skipped" : answers[id] !== undefined ? "answered" : "unanswered";

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Review Your Answers</h1>
            </div>
            <p className="text-sm text-muted-foreground">Click any question to go back and change it.</p>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mb-6 text-sm flex-wrap">
            <span className="flex items-center gap-1.5 bg-green-500/10 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-full font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> {totalAnswered} answered
            </span>
            {totalSkipped > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> {totalSkipped} skipped
              </span>
            )}
            {totalRemaining > 0 && (
              <span className="flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-medium">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block" /> {totalRemaining} not attempted
              </span>
            )}
          </div>

          {/* Question grid — grouped by TOPIK band */}
          <Card className="mb-6">
            <CardContent className="pt-5 pb-5">
              {BAND_LABELS.map((band, bi) => {
                const bandQs = PLACEMENT_QUESTIONS.slice(bi * 4, bi * 4 + 4);
                return (
                  <div key={band} className="mb-4 last:mb-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{band}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {bandQs.map(q => {
                        const st = statusOf(q.id);
                        return (
                          <button
                            key={q.id}
                            onClick={() => { setPage(Math.floor((q.id - 1) / QUESTIONS_PER_PAGE)); setPhase("test"); }}
                            className={[
                              "rounded-lg border text-sm font-semibold py-2.5 transition-colors",
                              st === "answered"   ? "bg-green-500/15 border-green-500/30 text-green-800 dark:text-green-300 hover:bg-green-500/25" : "",
                              st === "skipped"    ? "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25" : "",
                              st === "unanswered" ? "bg-muted/60 border-border text-muted-foreground hover:bg-muted" : "",
                            ].join(" ")}
                          >
                            Q{q.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setPhase("test")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Test
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || totalAnswered === 0}>
              {submitting ? "Submitting…" : "Submit Test"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Result screen ───────────────────────────────────────────
  if (phase === "result" && result) {
    const meta = LEVEL_META[result.levelKey] ?? { emoji: "🎓", tagline: "Your Level", description: "Ready to start your Korean journey?" };

    const confidenceChip = result.confidence === "solid"
      ? { label: "Confident placement", color: "bg-green-500/10 text-green-800 dark:text-green-300" }
      : result.confidence === "borderline-up"
      ? { label: `Close to ${meta.nextLabel ?? "next level"}`, color: "bg-amber-500/10 text-amber-800 dark:text-amber-300" }
      : { label: `On the edge of ${meta.prevLabel ?? "previous level"}`, color: "bg-amber-500/10 text-amber-800 dark:text-amber-300" };

    // Section breakdown (5 Vocab, 10 Grammar, 5 Reading)
    const sectionTotal = { Vocabulary: 5, Grammar: 10, Reading: 5 };

    // Band breakdown (4 per band)
    const bandBreakdown = BAND_LABELS.map((band, bi) => {
      const qs = PLACEMENT_QUESTIONS.slice(bi * 4, bi * 4 + 4);
      const correct = qs.filter(q => answers[q.id] === q.correctIndex).length;
      return { band, correct, total: 4 };
    });

    // Per-question results for explanations
    const questionResults = PLACEMENT_QUESTIONS.map(q => ({
      q,
      userAnswer: answers[q.id],
      wasSkipped: skipped.has(q.id),
      isCorrect: answers[q.id] === q.correctIndex,
    }));

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-10 max-w-xl mx-auto w-full space-y-4">

          {/* Result hero */}
          <Card className="text-center overflow-hidden">
            <div className="bg-primary/10 py-8 px-6">
              <div className="text-6xl mb-3">{meta.emoji}</div>
              <div className="inline-block bg-primary text-primary-foreground text-xl font-bold px-5 py-2 rounded-full mb-2">
                {result.levelLabel}
              </div>
              <p className="text-sm font-semibold text-foreground mt-1">{meta.tagline}</p>
              <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${confidenceChip.color}`}>
                {confidenceChip.label}
              </span>
            </div>
            <CardContent className="pt-5 pb-6 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  Score: <strong className="text-foreground">{result.score} / {PLACEMENT_QUESTIONS.length}</strong>
                </span>
                {finalTimeRef.current > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5" />
                    {formatTime(finalTimeRef.current)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance breakdown */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                Performance breakdown
              </div>

              {/* By section */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By skill</p>
                {(["Vocabulary", "Grammar", "Reading"] as const).map(sec => {
                  const correct = result.sectionScores[sec];
                  const total = sectionTotal[sec];
                  const pct = Math.round((correct / total) * 100);
                  return (
                    <div key={sec} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{sec}</span>
                        <span className="text-muted-foreground">{correct} / {total}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* By TOPIK band */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By TOPIK band</p>
                {bandBreakdown.map(({ band, correct, total }) => (
                  <div key={band} className="flex items-center gap-3 text-xs">
                    <span className="w-28 shrink-0 font-medium truncate">{band}</span>
                    <div className="flex gap-1 flex-1">
                      {Array.from({ length: total }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-4 flex-1 rounded-sm ${i < correct ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground w-8 text-right">{correct}/{total}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
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
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleShare(result)}>
                  <Share2 className="h-3.5 w-3.5" /> Share result
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={handleRetake}>
                  <RefreshCw className="h-3.5 w-3.5" /> Retake test
                </Button>
              </div>
              <button onClick={() => navigate("/")} className="w-full text-xs text-muted-foreground hover:underline">
                Back to home
              </button>
            </CardContent>
          </Card>

          {/* Answer explanations */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <button
                onClick={() => setShowExplanations(v => !v)}
                className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Review answers & explanations
                </span>
                {showExplanations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showExplanations && (
                <div className="mt-4 space-y-4">
                  {questionResults.map(({ q, userAnswer, wasSkipped, isCorrect }) => (
                    <div key={q.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                      <div className="flex items-start gap-2 mb-2">
                        <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                          wasSkipped ? "bg-muted text-muted-foreground" :
                          isCorrect  ? "bg-green-500/15 text-green-800 dark:text-green-300" :
                                       "bg-red-500/15 text-red-800 dark:text-red-300"
                        }`}>
                          {wasSkipped ? "—" : isCorrect ? "✓" : "✗"}
                        </span>
                        <p className="text-sm font-medium leading-snug">Q{q.id}. {q.question}</p>
                      </div>

                      {!wasSkipped && (
                        <div className="ml-7 text-xs space-y-1 mb-2">
                          {!isCorrect && (
                            <p className="text-red-700 dark:text-red-300">
                              Your answer: {q.options[userAnswer] ?? "—"}
                            </p>
                          )}
                          <p className="text-green-800 dark:text-green-300 font-medium">
                            Correct: {q.options[q.correctIndex]}
                          </p>
                        </div>
                      )}

                      <p className="ml-7 text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </main>
        <Footer />
      </div>
    );
  }

  const banner = SECTION_BANNERS[page];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Placement Test</h1>
          <p className="text-muted-foreground text-sm">Answer or skip each question — press 1–4 to select, then move to the next.</p>
        </div>

        {/* Progress */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              Section {page + 1} of {TOTAL_PAGES}
              {elapsedSeconds > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />{formatTime(elapsedSeconds)}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2 text-xs">
              <span className="text-green-800 dark:text-green-300 font-medium">{totalAnswered} answered</span>
              {totalSkipped > 0 && <span className="text-amber-800 dark:text-amber-300 font-medium">{totalSkipped} skipped</span>}
              {totalRemaining > 0 && <span>{totalRemaining} left</span>}
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Question map — click any dot to jump to that page */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {PLACEMENT_QUESTIONS.map(q => {
            const qPage = Math.floor((q.id - 1) / QUESTIONS_PER_PAGE);
            const st = skipped.has(q.id) ? "skipped" : answers[q.id] !== undefined ? "answered" : "unanswered";
            return (
              <button
                key={q.id}
                title={`Q${q.id} · ${q.level}`}
                onClick={() => setPage(qPage)}
                className={[
                  "h-5 w-5 rounded-full border-2 transition-all",
                  st === "answered"   ? "bg-green-500 border-green-600" : "",
                  st === "skipped"    ? "bg-amber-400 border-amber-500" : "",
                  st === "unanswered" ? "bg-muted border-border" : "",
                  qPage === page ? "ring-2 ring-primary ring-offset-1 scale-110" : "hover:scale-110",
                ].join(" ")}
              />
            );
          })}
        </div>

        {/* Section banner */}
        {banner && (
          <div className="mb-5 flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
              {page + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{banner.label}</p>
              <p className="text-xs text-muted-foreground">{banner.hint}</p>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {currentQuestions.map((q) => {
            const isSkipped = skipped.has(q.id);
            const isFocused = focusedQId === q.id;
            return (
              <Card
                key={q.id}
                onClick={() => !isSkipped && setFocusedQId(q.id)}
                className={[
                  "cursor-pointer transition-all",
                  isSkipped ? "opacity-50 border-dashed" : "",
                  isFocused && !isSkipped ? "ring-2 ring-primary/40 border-primary/30" : "",
                ].join(" ")}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs">{q.section}</Badge>
                      <Badge variant="secondary" className="text-[10px] font-normal">{q.level}</Badge>
                    </div>
                    <p className="font-medium text-sm leading-snug">
                      <span className="text-muted-foreground mr-1.5">Q{q.id}.</span>
                      {q.question}
                    </p>
                  </div>

                  {isSkipped ? (
                    <div className="flex items-center justify-between ml-1">
                      <span className="text-sm text-muted-foreground italic">Skipped — counts as 0</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnskip(q.id); }}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Answer this question
                      </button>
                    </div>
                  ) : (
                    <>
                      <RadioGroup
                        value={answers[q.id]?.toString()}
                        onValueChange={(val) => {
                          startTimer();
                          setFocusedQId(q.id);
                          setAnswers((prev) => ({ ...prev, [q.id]: parseInt(val) }));
                        }}
                        className="space-y-2 ml-1"
                      >
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center space-x-3">
                            <RadioGroupItem value={oi.toString()} id={`q${q.id}-o${oi}`} />
                            <Label htmlFor={`q${q.id}-o${oi}`} className="cursor-pointer text-sm">
                              <span className="text-muted-foreground mr-1 text-xs">{oi + 1}.</span> {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <div className="mt-3 ml-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSkip(q.id); }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <SkipForward className="h-3.5 w-3.5" /> Skip this question
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pb-8 gap-3">
          <Button variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          {page < TOTAL_PAGES - 1 ? (
            <Button onClick={() => setPage((p) => p + 1)}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setPhase("review")} disabled={totalAnswered === 0}>
              <ClipboardList className="mr-2 h-4 w-4" /> Review & Submit
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlacementTestPage;

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Languages, MessageSquare, Lightbulb, FileText, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/useGamification";
import { MissionStartBanner, XpBadge, LeagueProgressBar, LessonProgressDots } from "@/components/GamificationUI";
import { isCheckpointLesson, isBossChallenge, XP_VALUES, getRandomMotivation } from "@/constants/gamification";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  description: string;
  sort_order: number;
}

interface VocabItem { id: string; korean: string; romanization: string; meaning: string; }
interface GrammarItem { id: string; title: string; structure: string; explanation: string; examples: { korean: string; english: string }[]; }
interface DialogueLine { id: string; speaker: string; korean: string; romanization: string; english: string; }
interface ExerciseItem { id: string; question: string; options: string[]; correct_index: number; explanation: string; }
interface ReadingItem { id: string; korean_text: string; english_text: string; }

const LessonDetailPage = () => {
  const { lessonId } = useParams();
  const lessonNum = parseInt(lessonId || "1", 10);
  const { toast } = useToast();
  const { userId, progress, league, markSectionDone } = useGamification();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [grammar, setGrammar] = useState<GrammarItem[]>([]);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [reading, setReading] = useState<ReadingItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setSelectedAnswers({});
      setShowResults({});

      const [lessonRes, countRes] = await Promise.all([
        supabase.from("textbook_lessons").select("*").eq("sort_order", lessonNum).eq("is_published", true).maybeSingle(),
        supabase.from("textbook_lessons").select("id", { count: "exact", head: true }).eq("is_published", true),
      ]);

      const l = lessonRes.data as unknown as Lesson | null;
      setLesson(l);
      setTotalLessons(countRes.count || 0);

      if (l) {
        const [vRes, gRes, dRes, eRes, rRes] = await Promise.all([
          supabase.from("lesson_vocabulary").select("*").eq("lesson_id", l.id).order("sort_order"),
          supabase.from("lesson_grammar").select("*").eq("lesson_id", l.id).order("sort_order"),
          supabase.from("lesson_dialogues").select("*").eq("lesson_id", l.id).order("sort_order"),
          supabase.from("lesson_exercises").select("*").eq("lesson_id", l.id).order("sort_order"),
          supabase.from("lesson_reading").select("*").eq("lesson_id", l.id).order("sort_order"),
        ]);
        setVocab((vRes.data as unknown as VocabItem[]) || []);
        setGrammar((gRes.data as unknown as GrammarItem[]) || []);
        setDialogue((dRes.data as unknown as DialogueLine[]) || []);
        setExercises((eRes.data as unknown as ExerciseItem[]) || []);
        setReading((rRes.data as unknown as ReadingItem[]) || []);
      }
      setLoading(false);
    };
    fetchAll();
  }, [lessonNum]);

  const handleAnswer = (exerciseId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [exerciseId]: optionIndex }));
    setShowResults((prev) => ({ ...prev, [exerciseId]: true }));
  };

  const handleMarkDone = useCallback(async (section: "vocab_done" | "grammar_done" | "dialogue_done" | "exercises_done" | "reading_done") => {
    if (!lesson || !userId) {
      toast({ title: "Sign in required", description: "Please sign in to track your progress and earn XP.", variant: "destructive" });
      return;
    }

    const lp = progress.lessonProgress[lesson.id];
    if (lp?.[section]) return;

    await markSectionDone(lesson.id, section);

    const xpMap: Record<string, number> = {
      vocab_done: XP_VALUES.vocab,
      grammar_done: XP_VALUES.grammar,
      dialogue_done: XP_VALUES.dialogue,
      exercises_done: XP_VALUES.exercise,
      reading_done: XP_VALUES.reading,
    };

    toast({
      title: `+${xpMap[section]} XP earned! ⚡`,
      description: getRandomMotivation(),
    });
  }, [lesson, userId, progress, markSectionDone, toast]);

  const lp = lesson ? progress.lessonProgress[lesson.id] : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-96 mb-2" />
          <Skeleton className="h-6 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl text-center">
          <p className="text-muted-foreground text-lg">Lesson not found.</p>
          <Link to="/textbook" className="text-primary underline mt-4 inline-block">← Back to all lessons</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const boss = isBossChallenge(lesson.sort_order);
  const checkpoint = isCheckpointLesson(lesson.sort_order);

  const SectionDoneButton = ({ section, label }: { section: "vocab_done" | "grammar_done" | "dialogue_done" | "exercises_done" | "reading_done"; label: string }) => {
    if (!userId) {
      return (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link to={`/login?redirect=/textbook/${lessonNum}`} className="text-primary underline">Sign in</Link> to track your progress and earn XP.
        </p>
      );
    }
    const done = lp?.[section];
    return (
      <Button
        onClick={() => handleMarkDone(section)}
        disabled={!!done}
        variant={done ? "secondary" : "default"}
        size="sm"
        className="mt-4 gap-2"
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        {done ? `${label} Complete ✓` : `Complete ${label} & Earn XP`}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <Link to="/textbook" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> All Missions
        </Link>

        {/* Mission Start Banner */}
        <MissionStartBanner
          lessonNum={lesson.sort_order}
          title={lesson.title_en}
          description={lesson.description}
          isBoss={boss}
          isCheckpoint={checkpoint}
        />

        {/* Lesson header */}
        <div className="flex items-start gap-4 mb-4">
          <span className="text-5xl">{lesson.emoji}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary uppercase tracking-wider">Mission {lesson.sort_order}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{lesson.title_en}</h1>
            <p className="text-muted-foreground text-lg">{lesson.title_ko}</p>
          </div>
        </div>

        {/* Progress & XP */}
        {userId && (
          <div className="flex items-center justify-between gap-3 mb-6 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <XpBadge xp={progress.totalXp} />
              <span className="text-xs text-muted-foreground">{league.emoji} {league.name}</span>
            </div>
            {lp && <LessonProgressDots progress={lp} />}
          </div>
        )}

        {lp?.chapter_completed && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 text-center">
            <span className="text-2xl">⭐</span>
            <p className="font-bold text-foreground">Mission Complete!</p>
            <p className="text-sm text-muted-foreground">{getRandomMotivation()}</p>
          </div>
        )}

        <Tabs defaultValue="vocab" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-8">
            <TabsTrigger value="vocab" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4 hidden sm:block" /> Vocab
              {lp?.vocab_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="grammar" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Languages className="h-4 w-4 hidden sm:block" /> Grammar
              {lp?.grammar_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="dialogue" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4 hidden sm:block" /> Dialogue
              {lp?.dialogue_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="exercises" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Lightbulb className="h-4 w-4 hidden sm:block" /> Exercises
              {lp?.exercises_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="reading" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 hidden sm:block" /> Reading
              {lp?.reading_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
          </TabsList>

          {/* VOCAB */}
          <TabsContent value="vocab">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Vocabulary
              <span className="text-xs text-muted-foreground ml-auto">+{XP_VALUES.vocab} XP</span>
            </h2>
            {vocab.length === 0 ? (
              <p className="text-muted-foreground">No vocabulary content yet for this lesson.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vocab.map((v) => (
                    <div key={v.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                      <span className="text-2xl font-bold text-primary min-w-[3rem] text-center">{v.korean}</span>
                      <div>
                        <p className="text-sm italic text-muted-foreground">{v.romanization}</p>
                        <p className="text-sm font-medium text-foreground">{v.meaning}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <SectionDoneButton section="vocab_done" label="Vocabulary" />
              </>
            )}
          </TabsContent>

          {/* GRAMMAR */}
          <TabsContent value="grammar">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" /> Grammar
              <span className="text-xs text-muted-foreground ml-auto">+{XP_VALUES.grammar} XP</span>
            </h2>
            {grammar.length === 0 ? (
              <p className="text-muted-foreground">No grammar content yet for this lesson.</p>
            ) : (
              <>
                <div className="space-y-6">
                  {grammar.map((g) => (
                    <div key={g.id} className="rounded-xl border border-border bg-card p-5">
                      <h3 className="text-lg font-bold text-foreground mb-1">{g.title}</h3>
                      {g.structure && <p className="text-sm font-mono text-primary bg-primary/10 inline-block px-2 py-1 rounded mb-2">{g.structure}</p>}
                      <p className="text-sm text-muted-foreground mb-3">{g.explanation}</p>
                      {g.examples?.length > 0 && (
                        <div className="space-y-2">
                          {g.examples.map((ex, i) => (
                            <div key={i} className="border-l-2 border-primary/30 pl-3">
                              <p className="text-sm font-medium text-foreground">{ex.korean}</p>
                              <p className="text-xs text-muted-foreground">{ex.english}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <SectionDoneButton section="grammar_done" label="Grammar" />
              </>
            )}
          </TabsContent>

          {/* DIALOGUE */}
          <TabsContent value="dialogue">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Dialogue
              <span className="text-xs text-muted-foreground ml-auto">+{XP_VALUES.dialogue} XP</span>
            </h2>
            {dialogue.length === 0 ? (
              <p className="text-muted-foreground">No dialogue content yet for this lesson.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {dialogue.map((d) => (
                    <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs font-bold text-primary uppercase mb-1">{d.speaker}</p>
                      <p className="text-foreground font-medium">{d.korean}</p>
                      {d.romanization && <p className="text-xs italic text-muted-foreground">{d.romanization}</p>}
                      <p className="text-sm text-muted-foreground mt-1">{d.english}</p>
                    </div>
                  ))}
                </div>
                <SectionDoneButton section="dialogue_done" label="Dialogue" />
              </>
            )}
          </TabsContent>

          {/* EXERCISES */}
          <TabsContent value="exercises">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Exercises
              <span className="text-xs text-muted-foreground ml-auto">+{XP_VALUES.exercise} XP</span>
            </h2>
            {exercises.length === 0 ? (
              <p className="text-muted-foreground">No exercises yet for this lesson.</p>
            ) : (
              <>
                <div className="space-y-6">
                  {exercises.map((ex, idx) => (
                    <div key={ex.id} className="rounded-xl border border-border bg-card p-5">
                      <p className="font-medium text-foreground mb-3">{idx + 1}. {ex.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ex.options.map((opt, oi) => {
                          const selected = selectedAnswers[ex.id] === oi;
                          const revealed = showResults[ex.id];
                          const isCorrect = oi === ex.correct_index;
                          return (
                            <button
                              key={oi}
                              onClick={() => !revealed && handleAnswer(ex.id, oi)}
                              disabled={revealed}
                              className={cn(
                                "text-left px-4 py-3 rounded-lg border text-sm transition-all",
                                revealed && isCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                                revealed && selected && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                                !revealed && "border-border hover:border-primary/40 hover:bg-accent text-foreground",
                                revealed && !selected && !isCorrect && "opacity-50"
                              )}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {showResults[ex.id] && ex.explanation && (
                        <p className="text-xs text-muted-foreground mt-3 bg-muted/50 p-2 rounded">{ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
                <SectionDoneButton section="exercises_done" label="Exercises" />
              </>
            )}
          </TabsContent>

          {/* READING */}
          <TabsContent value="reading">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Reading
              <span className="text-xs text-muted-foreground ml-auto">+{XP_VALUES.reading} XP</span>
            </h2>
            {reading.length === 0 ? (
              <p className="text-muted-foreground">No reading content yet for this lesson.</p>
            ) : (
              <>
                <div className="space-y-6">
                  {reading.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                      <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap mb-3">{r.korean_text}</p>
                      <hr className="border-border mb-3" />
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.english_text}</p>
                    </div>
                  ))}
                </div>
                <SectionDoneButton section="reading_done" label="Reading" />
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Prev / Next navigation */}
        <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
          {lessonNum > 1 ? (
            <Link to={`/textbook/${lessonNum - 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Previous Mission
            </Link>
          ) : <span />}
          {lessonNum < totalLessons ? (
            <Link to={`/textbook/${lessonNum + 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Next Mission <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LessonDetailPage;

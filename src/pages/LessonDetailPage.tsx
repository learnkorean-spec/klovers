import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, BookOpen, Languages, MessageSquare, Lightbulb, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  description: string;
  sort_order: number;
}

interface VocabItem {
  id: string;
  korean: string;
  romanization: string;
  meaning: string;
}

interface GrammarItem {
  id: string;
  title: string;
  structure: string;
  explanation: string;
  examples: { korean: string; english: string }[];
}

interface DialogueLine {
  id: string;
  speaker: string;
  korean: string;
  romanization: string;
  english: string;
}

interface ExerciseItem {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface ReadingItem {
  id: string;
  korean_text: string;
  english_text: string;
}

const LessonDetailPage = () => {
  const { lessonId } = useParams();
  const lessonNum = parseInt(lessonId || "1", 10);

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
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        {/* Back link */}
        <Link to="/textbook" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> All Lessons
        </Link>

        {/* Lesson header */}
        <div className="flex items-start gap-4 mb-8">
          <span className="text-5xl">{lesson.emoji}</span>
          <div>
            <p className="text-sm font-bold text-primary uppercase tracking-wider">Lesson {lesson.sort_order}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{lesson.title_en}</h1>
            <p className="text-muted-foreground text-lg">{lesson.title_ko}</p>
          </div>
        </div>

        <Tabs defaultValue="vocab" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-8">
            <TabsTrigger value="vocab" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4 hidden sm:block" /> Vocab
            </TabsTrigger>
            <TabsTrigger value="grammar" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Languages className="h-4 w-4 hidden sm:block" /> Grammar
            </TabsTrigger>
            <TabsTrigger value="dialogue" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4 hidden sm:block" /> Dialogue
            </TabsTrigger>
            <TabsTrigger value="exercises" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Lightbulb className="h-4 w-4 hidden sm:block" /> Exercises
            </TabsTrigger>
            <TabsTrigger value="reading" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 hidden sm:block" /> Reading
            </TabsTrigger>
          </TabsList>

          {/* VOCAB */}
          <TabsContent value="vocab">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Vocabulary
            </h2>
            {vocab.length === 0 ? (
              <p className="text-muted-foreground">No vocabulary content yet for this lesson.</p>
            ) : (
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
            )}
          </TabsContent>

          {/* GRAMMAR */}
          <TabsContent value="grammar">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" /> Grammar
            </h2>
            {grammar.length === 0 ? (
              <p className="text-muted-foreground">No grammar content yet for this lesson.</p>
            ) : (
              <div className="space-y-6">
                {grammar.map((g) => (
                  <div key={g.id} className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-lg font-bold text-foreground mb-1">{g.title}</h3>
                    {g.structure && (
                      <p className="text-sm font-mono text-primary bg-primary/10 inline-block px-2 py-1 rounded mb-2">{g.structure}</p>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">{g.explanation}</p>
                    {g.examples && g.examples.length > 0 && (
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
            )}
          </TabsContent>

          {/* DIALOGUE */}
          <TabsContent value="dialogue">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Dialogue
            </h2>
            {dialogue.length === 0 ? (
              <p className="text-muted-foreground">No dialogue content yet for this lesson.</p>
            ) : (
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
            )}
          </TabsContent>

          {/* EXERCISES */}
          <TabsContent value="exercises">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Exercises
            </h2>
            {exercises.length === 0 ? (
              <p className="text-muted-foreground">No exercises yet for this lesson.</p>
            ) : (
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
            )}
          </TabsContent>

          {/* READING */}
          <TabsContent value="reading">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Reading
            </h2>
            {reading.length === 0 ? (
              <p className="text-muted-foreground">No reading content yet for this lesson.</p>
            ) : (
              <div className="space-y-6">
                {reading.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap mb-3">{r.korean_text}</p>
                    <hr className="border-border mb-3" />
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.english_text}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Prev / Next navigation */}
        <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
          {lessonNum > 1 ? (
            <Link to={`/textbook/${lessonNum - 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Previous Lesson
            </Link>
          ) : <span />}
          {lessonNum < totalLessons ? (
            <Link to={`/textbook/${lessonNum + 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Next Lesson <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LessonDetailPage;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  description: string;
  sort_order: number;
}

const TextbookPage = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from("textbook_lessons")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      setLessons((data as unknown as Lesson[]) || []);
      setLoading(false);
    };
    fetchLessons();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="text-center mb-12 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            TOPIK 1 KOREAN TEXTBOOK
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Start Speaking Korean<br />
            <span className="text-primary italic">with Confidence</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {lessons.length} interactive lessons covering Hangul, grammar, vocabulary, dialogues, and exercises. Master Korean from zero!
          </p>
        </section>

        {/* Lessons Grid */}
        <section className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            📚 Lessons
          </h2>
          <p className="text-muted-foreground mb-8">Click a lesson to start learning</p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/textbook/${lesson.sort_order}`}
                  className="group block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
                >
                  <div className="text-3xl mb-3">{lesson.emoji}</div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                    Lesson {lesson.sort_order}
                  </p>
                  <h3 className="font-bold text-foreground text-lg leading-tight mb-0.5">
                    {lesson.title_en}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{lesson.title_ko}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lesson.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TextbookPage;

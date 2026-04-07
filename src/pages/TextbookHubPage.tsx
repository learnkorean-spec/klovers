import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Sun, Sparkles, Clapperboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const BOOKS = [
  {
    key: "korean-1",
    titleEn: "Korean Textbook",
    titleAr: "كتاب الكورية",
    subtitleEn: "TOPIK 1 & 2 · 75+ Lessons",
    subtitleAr: "توبيك ١ و ٢ · ٧٥+ درس",
    descEn: "Master Korean from Hangul to advanced grammar through worlds and missions.",
    descAr: "أتقن الكورية من الهانغول إلى القواعد المتقدمة عبر العوالم والمهام.",
    emoji: "📘",
    icon: BookOpen,
    gradient: "from-primary/20 to-primary/5",
    border: "border-primary/30 hover:border-primary/60",
  },
  {
    key: "daily-routine",
    titleEn: "Daily Routine Korean",
    titleAr: "كورية الروتين اليومي",
    subtitleEn: "32 Daily Life Categories",
    subtitleAr: "٣٢ فئة حياتية يومية",
    descEn: "Learn Korean through everyday actions — sleeping, cooking, cleaning & more.",
    descAr: "تعلم الكورية من خلال الأفعال اليومية — النوم، الطبخ، التنظيف والمزيد.",
    emoji: "☀️",
    icon: Sun,
    gradient: "from-accent/20 to-accent/5",
    border: "border-accent/30 hover:border-accent/60",
  },
  {
    key: "kdrama",
    titleEn: "K-Drama Korean",
    titleAr: "كورية الدراما",
    subtitleEn: "30 Drama-Based Lessons",
    subtitleAr: "٣٠ درس من الدراما الكورية",
    descEn: "Learn Korean through iconic K-Drama dialogues, slang, and cultural context.",
    descAr: "تعلم الكورية من خلال حوارات الدراما الأيقونية والعامية والسياق الثقافي.",
    emoji: "🎬",
    icon: Clapperboard,
    gradient: "from-rose-500/20 to-rose-500/5",
    border: "border-rose-500/30 hover:border-rose-500/60",
  },
];

const TextbookHubPage = () => {
  useSEO({ title: "Korean Textbooks", description: "Learn Korean with Klovers interactive digital textbooks. Vocabulary flashcards, grammar, dialogues, exercises and reading passages.", canonical: "https://kloversegy.com/textbook" });
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16">
        <section className="text-center mb-12 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            {isAr ? "مكتبة الكتب" : "Book Library"}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isAr ? "اختر كتابك" : "Choose Your Book"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {isAr
              ? "اختر كتاباً تعليمياً وابدأ رحلتك في تعلم الكورية"
              : "Pick a learning book and start your Korean journey"}
          </p>
        </section>

        <section className="container mx-auto px-4 max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {BOOKS.map((book) => {
              const Icon = book.icon;
              return (
                <Link
                  key={book.key}
                  to={`/textbook/${book.key}`}
                  className={cn(
                    "group block rounded-2xl border-2 p-6 transition-all hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br",
                    book.gradient,
                    book.border
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-5xl">{book.emoji}</span>
                    <Icon className="h-6 w-6 text-primary opacity-50" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {isAr ? book.titleAr : book.titleEn}
                  </h2>
                  <p className="text-sm font-medium text-foreground/70 mb-2">
                    {isAr ? book.subtitleAr : book.subtitleEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? book.descAr : book.descEn}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TextbookHubPage;

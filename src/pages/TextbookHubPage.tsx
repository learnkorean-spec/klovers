import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Sun, Sparkles, Clapperboard, Brain, ArrowRight } from "lucide-react";
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
    gradient: "from-amber-100 to-yellow-50",
    border: "border-amber-200 hover:border-amber-400",
    iconColor: "text-amber-600",
    subtitleColor: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-800",
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
    gradient: "from-orange-100 to-amber-50",
    border: "border-orange-200 hover:border-orange-400",
    iconColor: "text-orange-500",
    subtitleColor: "text-orange-700",
    badgeBg: "bg-orange-100 text-orange-800",
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
    gradient: "from-rose-100 to-pink-50",
    border: "border-rose-200 hover:border-rose-400",
    iconColor: "text-rose-500",
    subtitleColor: "text-rose-700",
    badgeBg: "bg-rose-100 text-rose-800",
  },
  {
    key: "grammar-mastery",
    titleEn: "Grammar Mastery",
    titleAr: "إتقان القواعد",
    subtitleEn: "57 Pattern-Focused Lessons · All 6 Levels",
    subtitleAr: "٥٧ درسًا على الأنماط · جميع المستويات الست",
    descEn: "Deep-dive every Korean grammar pattern from basic particles to classical literary style.",
    descAr: "ادرس كل نمط قواعدي كوري بعمق — من الجسيمات الأساسية إلى الأسلوب الأدبي الكلاسيكي.",
    emoji: "🧠",
    icon: Brain,
    gradient: "from-violet-100 to-purple-50",
    border: "border-violet-200 hover:border-violet-400",
    iconColor: "text-violet-500",
    subtitleColor: "text-violet-700",
    badgeBg: "bg-violet-100 text-violet-800",
    badge: "NEW",
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
        <section className="text-center mb-14 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 text-foreground/70 text-sm font-medium mb-6 border border-foreground/10">
            <Sparkles className="h-4 w-4" />
            {isAr ? "مكتبة الكتب" : "Book Library"}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            {isAr ? "اختر كتابك" : "Choose Your Book"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {isAr
              ? "اختر كتاباً تعليمياً وابدأ رحلتك في تعلم الكورية"
              : "Pick a learning book and start your Korean journey"}
          </p>
        </section>

        <section className="container mx-auto px-4 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {BOOKS.map((book) => {
              const Icon = book.icon;
              const hasBadge = "badge" in book && book.badge;
              return (
                <Link
                  key={book.key}
                  to={`/textbook/${book.key}`}
                  className={cn(
                    "group relative block rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1.5 bg-gradient-to-br shadow-sm",
                    book.gradient,
                    book.border
                  )}
                >
                  {hasBadge && (
                    <span className="absolute top-3 right-3 text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-violet-500 text-white shadow-sm">
                      {(book as { badge?: string }).badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-5xl drop-shadow-sm">{book.emoji}</span>
                    <Icon className={cn("h-6 w-6 opacity-60", book.iconColor)} />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {isAr ? book.titleAr : book.titleEn}
                  </h2>
                  <p className={cn("text-sm font-semibold mb-2", book.subtitleColor)}>
                    {isAr ? book.subtitleAr : book.subtitleEn}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isAr ? book.descAr : book.descEn}
                  </p>
                  <div className={cn("mt-4 flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity", book.subtitleColor)}>
                    {isAr ? "ابدأ التعلم" : "Start learning"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
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

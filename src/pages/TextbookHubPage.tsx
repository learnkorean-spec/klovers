import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Each book opens onto a painted world from the Klovers story, so the library
 * reads like a map of places to visit rather than a row of emoji tiles.
 */
const BOOKS = [
  {
    key: "korean-1",
    titleEn: "Korean Textbook",
    titleAr: "كتاب الكورية",
    subtitleEn: "TOPIK 1 & 2 · 75+ Lessons",
    subtitleAr: "TOPIK ١ و٢ · أكثر من ٧٥ درسًا",
    descEn: "Master Korean from Hangul to advanced grammar through worlds and missions.",
    descAr: "إتقان الكورية من الهانغول إلى القواعد المتقدمة عبر العوالم والمهام.",
    icon: "books-stack" as KloverIconName,
    image: "/assets/story/world-hangul-village.webp",
    altEn: "Painted Hangul Village, the first world of the Klovers story",
    altAr: "قرية الهانغول المرسومة، أول عالم في قصة كلوفرز",
  },
  {
    key: "daily-routine",
    titleEn: "Daily Routine Korean",
    titleAr: "كورية الروتين اليومي",
    subtitleEn: "32 Daily Life Categories",
    subtitleAr: "٣٢ فئة حياتية يومية",
    descEn: "Learn Korean through everyday actions — sleeping, cooking, cleaning & more.",
    descAr: "تعلُّم الكورية من خلال الأفعال اليومية: النوم والطبخ والتنظيف وغيرها.",
    icon: "calendar-check" as KloverIconName,
    image: "/assets/story/world-conversation-cafe.webp",
    altEn: "A cosy painted Korean café where everyday conversations happen",
    altAr: "مقهى كوري دافئ مرسوم تدور فيه محادثات الحياة اليومية",
  },
  {
    key: "kdrama",
    titleEn: "K-Drama Korean",
    titleAr: "كورية الدراما",
    subtitleEn: "30 Drama-Based Lessons",
    subtitleAr: "٣٠ درسًا من الدراما الكورية",
    descEn: "Learn Korean through iconic K-Drama dialogues, slang, and cultural context.",
    descAr: "تعلُّم الكورية من خلال حوارات الدراما الشهيرة، والتعابير العامية، والسياق الثقافي.",
    icon: "chat-annyeong" as KloverIconName,
    image: "/assets/story/world-culture-street.webp",
    altEn: "A lively painted Korean culture street at dusk",
    altAr: "شارع ثقافي كوري نابض بالحياة عند الغروب",
  },
  {
    key: "grammar-mastery",
    titleEn: "Grammar Mastery",
    titleAr: "إتقان القواعد",
    subtitleEn: "57 Pattern-Focused Lessons · All 6 Levels",
    subtitleAr: "٥٧ درسًا على الأنماط · جميع المستويات الستة",
    descEn: "Deep-dive every Korean grammar pattern from basic particles to classical literary style.",
    descAr: "دراسة معمّقة لكل نمط قواعدي كوري، من الأدوات الأساسية إلى الأسلوب الأدبي الكلاسيكي.",
    icon: "lightbulb-sprout" as KloverIconName,
    image: "/assets/story/world-seoul-journey.webp",
    altEn: "A painted journey across Seoul, from old gates to city lights",
    altAr: "رحلة مرسومة عبر سيول من البوابات القديمة إلى أضواء المدينة",
    badge: "NEW",
  },
  {
    key: "picture-vocab",
    titleEn: "Picture Vocabulary",
    titleAr: "مفردات الصور",
    subtitleEn: "15 Visual Scene Lessons",
    subtitleAr: "١٥ درساً بالصور",
    descEn: "Learn Korean vocabulary through beautiful illustrated scenes — bedroom, café, park and more.",
    descAr: "تعلُّم المفردات الكورية من خلال مشاهد مصوّرة: غرفة النوم والمقهى والحديقة وغيرها.",
    icon: "flashcard-ga" as KloverIconName,
    image: "/assets/story/world-vocabulary-market.webp",
    altEn: "A colourful painted Korean market full of things to name",
    altAr: "سوق كوري ملوّن مرسوم مليء بالأشياء التي نتعلم أسماءها",
    badge: "NEW",
  },
];

const FALLBACK_IMAGE = "/assets/story/world-memory-garden.webp";

const TextbookHubPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "مكتبة كتب الكورية" : "Korean Textbooks",
    description: isAr
      ? "كتب رقمية تفاعلية لتعلُّم الكورية: بطاقات مفردات، وقواعد، وحوارات، وتمارين، ونصوص للقراءة."
      : "Learn Korean with Klovers interactive digital textbooks. Vocabulary flashcards, grammar, dialogues, exercises and reading passages.",
    canonical: "https://kloversegy.com/textbook",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-4xl mb-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="text-center md:text-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-klovers-yellow text-charcoal text-sm font-bold mb-6 border border-foreground/15">
                <KloverIcon name="books-stack" className="h-5 w-5" />
                {isAr ? "مكتبة الكتب" : "Book Library"}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {isAr ? "اختيار الكتاب" : "Choose Your Book"}
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto md:mx-0 text-lg">
                {isAr
                  ? "كل كتاب يفتح بابًا على عالم من قصة كلوفرز، ومن هناك تبدأ الرحلة."
                  : "Each book opens a door into one world of the Klovers story. Pick one, and the journey starts there."}
              </p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border shadow-lg bg-muted">
              <img
                src="/assets/cluby/cafe.webp"
                width={1200}
                height={800}
                alt={
                  isAr
                    ? "صديقان يدرسان الكورية مع كلوبي في مقهى"
                    : "Two friends studying Korean with Cluby at a café"
                }
                className="h-full w-full object-cover aspect-[3/2]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {BOOKS.map((book) => {
              const hasBadge = "badge" in book && book.badge;
              return (
                <Link
                  key={book.key}
                  to={`/textbook/${book.key}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-border bg-card transition-all hover:border-foreground hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="relative h-36 overflow-hidden bg-muted">
                    <img
                      src={book.image || FALLBACK_IMAGE}
                      width={1600}
                      height={900}
                      alt={isAr ? book.altAr : book.altEn}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    {hasBadge && (
                      <span className="absolute top-3 end-3 text-xs font-bold px-2.5 py-0.5 rounded-full bg-charcoal text-klovers-yellow">
                        {isAr ? "جديد" : "NEW"}
                      </span>
                    )}
                    <span className="absolute bottom-3 start-3 flex h-10 w-10 items-center justify-center rounded-full bg-klovers-yellow border-2 border-charcoal shadow-md">
                      <KloverIcon name={book.icon} className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {isAr ? book.titleAr : book.titleEn}
                    </h2>
                    <p className="inline-block text-xs font-semibold mb-3 px-2.5 py-1 rounded-full bg-muted text-foreground border border-border">
                      {isAr ? book.subtitleAr : book.subtitleEn}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isAr ? book.descAr : book.descEn}
                    </p>
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

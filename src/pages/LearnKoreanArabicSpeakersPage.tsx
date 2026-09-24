import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * /learn-korean-arabic-speakers
 *
 * 25 Sep 2026 (QA pass): rewritten. The page it replaces taught wrong
 * grammar - "adjectives follow nouns in both languages" (in Korean they come
 * first: 빨간 책), an ungrammatical example sentence (책이 빨강이다), and
 * "SOV = Arabic structure" (Arabic is not SOV). It also promised things that
 * are not true: "3x faster", "B1 in 6-8 months", Hangul "in 2 hours",
 * "native Arabic-speaking teachers" (plural), "pricing in EGP" and "classes
 * at 8 PM Cairo time".
 *
 * What it says now: where Arabic helps, where it does not, and the real
 * Klovers path (Hangul in four classes, then Levels 1-6 at 24 classes each),
 * the same facts as /courses. Palette only; copy inline in both languages.
 */

const COMPARISONS: {
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  arabic: string;
  korean: string;
  noteEn: string;
  noteAr: string;
}[] = [
  {
    titleEn: "Endings that show a word's job",
    titleAr: "نهايات بتوضح وظيفة الكلمة",
    bodyEn: "Arabic case endings tell you which word is the subject and which is the object. Korean does the same job with small particles after the word — 는 for the topic, 을/를 for the object.",
    bodyAr: "في العربي، علامات الإعراب بتوضح مين الفاعل ومين المفعول. الكوري بيعمل نفس الحاجة بأدوات صغيرة بعد الكلمة — 는 للموضوع، و을/를 للمفعول به.",
    arabic: "قرأتُ الكتابَ",
    korean: "나는 책을 읽어요",
    noteEn: "나 (I) + 는 · 책 (book) + 을 · 읽어요 (read)",
    noteAr: "나 (أنا) + 는 · 책 (كتاب) + 을 · 읽어요 (أقرأ)",
  },
  {
    titleEn: "Speaking politely changes the verb",
    titleAr: "الأدب في الكلام بيغيّر الفعل",
    bodyEn: "Arabic speakers already switch register — حضرتك or إنت, فصحى or عامية. Korean builds politeness into the verb ending, so the idea is familiar even though the form is new.",
    bodyAr: "المتكلم بالعربي متعود يغيّر طريقة كلامه — حضرتك أو إنت، فصحى أو عامية. الكوري بيحط الأدب في نهاية الفعل، فالفكرة مألوفة حتى لو الشكل جديد.",
    arabic: "إزيّك؟ / إزيّ حضرتك؟",
    korean: "안녕? / 안녕하세요?",
    noteEn: "casual / polite",
    noteAr: "عادي / مؤدب",
  },
];

const DIFFERENCES: { en: string; ar: string }[] = [
  {
    en: "The verb comes last. Korean sentences end with the verb: 나는 책을 읽어요 is literally \"I the-book read\".",
    ar: "الفعل بييجي في الآخر. الجملة الكورية بتخلص بالفعل: 나는 책을 읽어요 حرفيًا «أنا الكتاب أقرأ».",
  },
  {
    en: "Adjectives come before the noun: 빨간 책 (red book), where Arabic says كتاب أحمر.",
    ar: "الصفة بتيجي قبل الاسم: 빨간 책 (كتاب أحمر)، عكس العربي.",
  },
  {
    en: "Hangul is read left to right, in syllable blocks. It has 24 basic letters and is quick to learn — we teach it in four classes.",
    ar: "الهانغول بيتقري من الشمال لليمين، في مقاطع على شكل مربعات. فيه ٢٤ حرف أساسي وسهل تتعلمه — بنعلّمه في ٤ حصص.",
  },
  {
    en: "Some sounds need practice: Arabic has no P, so ㅂ and ㅍ are easy to mix up, and Korean has three kinds of each stop (ㄱ ㅋ ㄲ).",
    ar: "بعض الأصوات محتاجة تدريب: العربي مفيهوش حرف P، فسهل تلخبط بين ㅂ وㅍ، والكوري فيه ٣ أنواع لنفس الصوت (ㄱ ㅋ ㄲ).",
  },
];

const LearnKoreanArabicSpeakersPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: "Learn Korean as an Arabic Speaker",
    description:
      "Learning Korean from Arabic: what Arabic already gives you, what is new, and the Klovers path from Hangul to Level 6 with a teacher who explains in Arabic.",
    canonical: "https://kloversegy.com/learn-korean-arabic-speakers",
  });

  const card = "rounded-2xl border border-charcoal/10 bg-card p-5 md:p-6";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        {/* Hero */}
        <section className="bg-charcoal text-ivory py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <span className="inline-block rounded-full bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
              {tr("For Arabic speakers", "للناطقين بالعربية")}
            </span>
            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">
              {tr("Learning Korean when your first language is Arabic", "تتعلم كوري ولغتك الأم عربي")}
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-ivory/80 leading-relaxed">
              {tr(
                "Some of it will feel familiar, some of it is new. Here is which is which, and how we teach it — with explanations in Arabic.",
                "في حاجات هتحسها مألوفة، وحاجات جديدة. هنا هتعرف دي من دي، وإزاي بنعلّمها — بشرح بالعربي.",
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="rounded-full font-bold">
                <Link to="/free-trial">
                  {tr("Book a free class", "احجز حصة مجانية")}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full bg-transparent text-ivory border-ivory/40 hover:bg-ivory/10">
                <Link to="/placement-test">{tr("Find your level", "اعرف مستواك")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* What feels familiar */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              {tr("What Arabic already gives you", "العربي بيديك إيه")}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {COMPARISONS.map((c) => (
                <div key={c.titleEn} className={card}>
                  <h3 className="text-lg font-bold text-foreground">{isAr ? c.titleAr : c.titleEn}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{isAr ? c.bodyAr : c.bodyEn}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-muted px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{tr("Arabic", "عربي")}</p>
                      <p className="mt-1 font-bold text-foreground" dir="rtl" lang="ar">{c.arabic}</p>
                    </div>
                    <div className="rounded-xl bg-klovers-yellow/40 px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal/70">{tr("Korean", "كوري")}</p>
                      <p className="mt-1 font-bold text-charcoal" lang="ko">{c.korean}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground" dir="ltr">{isAr ? c.noteAr : c.noteEn}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What is new */}
        <section className="py-14 md:py-20 bg-card border-y border-border">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              {tr("What will be new", "إيه الجديد عليك")}
            </h2>
            <ul className="space-y-3">
              {DIFFERENCES.map((d) => (
                <li key={d.en} className="flex items-start gap-3 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="leading-relaxed">{isAr ? d.ar : d.en}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* The path */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              {tr("The path at Klovers", "المسار في كلوفرز")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [tr("Hangul Foundation", "تأسيس الهانغول"), tr("4 classes · read and write from zero", "٤ حصص · قراءة وكتابة من الصفر")],
                [tr("Levels 1 to 6", "المستويات من ١ لـ ٦"), tr("24 classes per level, about 6 months each", "٢٤ حصة لكل مستوى، حوالي ٦ شهور")],
                [tr("One class a week", "حصة في الأسبوع"), tr("60 minutes, live, in a small group or privately", "٦٠ دقيقة، مباشرة، في مجموعة صغيرة أو برايفت")],
              ].map(([title, body]) => (
                <div key={title} className={card}>
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-base text-foreground/80 leading-relaxed">
              {tr(
                "Your teacher is Reham Elshrkawy, an Al-Alsun Korean language and literature graduate who has taught Korean for 13 years. She explains in Arabic or English and compares Korean with Arabic wherever that makes a point clearer. In Egypt you can pay by Vodafone Cash or InstaPay.",
                "معلمتك ريهام الشرقاوي، خريجة الألسن قسم اللغة والأدب الكوري، وبتدرّس كوري من ١٣ سنة. بتشرح بالعربي أو الإنجليزي وبتقارن الكوري بالعربي لما ده يوضّح الفكرة. في مصر تقدر تدفع بفودافون كاش أو إنستاباي.",
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="rounded-full font-bold">
                <Link to="/free-trial">
                  {tr("Book a free class", "احجز حصة مجانية")}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full">
                <Link to="/courses">{tr("See all levels", "شوف كل المستويات")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LearnKoreanArabicSpeakersPage;

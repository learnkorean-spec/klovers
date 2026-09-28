import { Link } from "react-router-dom";
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
    titleAr: "نهايات تُظهر وظيفة الكلمة",
    bodyEn: "Arabic case endings tell you which word is the subject and which is the object. Korean does the same job with small particles after the word — 는 for the topic, 을/를 for the object.",
    bodyAr: "في العربية تُميّز علامات الإعراب الفاعل من المفعول به. والكورية تؤدي الوظيفة نفسها بأدوات صغيرة بعد الكلمة: 는 للموضوع، و을/를 للمفعول به.",
    arabic: "أقرأُ الكتابَ",
    korean: "나는 책을 읽어요",
    noteEn: "나 (I) + 는 · 책 (book) + 을 · 읽어요 (read)",
    noteAr: "나 (أنا) + 는 · 책 (كتاب) + 을 · 읽어요 (أقرأ)",
  },
  {
    titleEn: "Speaking politely changes the verb",
    titleAr: "التأدّب في الكلام يغيّر الفعل",
    bodyEn: "Arabic speakers already switch register — حضرتك or إنت, فصحى or عامية. Korean builds politeness into the verb ending, so the idea is familiar even though the form is new.",
    bodyAr: "اعتاد الناطق بالعربية تغيير أسلوب كلامه: «حضرتك» أو «أنت»، فصحى أو عامية. والكورية تضع التأدّب في نهاية الفعل، فالفكرة مألوفة وإن كان الشكل جديدًا.",
    arabic: "إزيّك؟ / إزيّ حضرتك؟",
    korean: "안녕? / 안녕하세요?",
    noteEn: "casual / polite",
    noteAr: "عفوي / مهذّب",
  },
];

const DIFFERENCES: { en: string; ar: string }[] = [
  {
    en: "The verb comes last. Korean sentences end with the verb: 나는 책을 읽어요 is literally \"I the-book read\".",
    ar: "الفعل يأتي في النهاية؛ فالجملة الكورية تنتهي بالفعل: 나는 책을 읽어요 حرفيًا «أنا الكتاب أقرأ».",
  },
  {
    en: "Adjectives come before the noun: 빨간 책 (red book), where Arabic says كتاب أحمر.",
    ar: "الصفة تأتي قبل الاسم: 빨간 책 (كتاب أحمر)، على عكس العربية.",
  },
  {
    en: "Hangul is read left to right, in syllable blocks. It has 24 basic letters and is quick to learn — we teach it in four classes.",
    ar: "يُقرأ الهانغول من اليسار إلى اليمين، في مقاطع على شكل مربعات. فيه ٢٤ حرفًا أساسيًا وتعلّمه سريع؛ ونُدرّسه في ٤ حصص.",
  },
  {
    en: "Some sounds need practice: Arabic has no P, so ㅂ and ㅍ are easy to mix up, and Korean has three kinds of each stop (ㄱ ㅋ ㄲ).",
    ar: "بعض الأصوات يحتاج إلى تدريب: لا يوجد في العربية حرف P، لذا يسهل الخلط بين ㅂ وㅍ، وفي الكورية ٣ أنواع لكل صوت انفجاري (ㄱ ㅋ ㄲ).",
  },
];

const LearnKoreanArabicSpeakersPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr ? "تعلُّم الكورية للناطقين بالعربية" : "Learn Korean as an Arabic Speaker",
    description: isAr
      ? "تعلُّم الكورية انطلاقًا من العربية: ما تقدّمه العربية مسبقًا، وما الجديد، ومسار كلوفرز من الهانغول إلى المستوى السادس مع معلّمة تشرح بالعربية."
      : "Learning Korean from Arabic: what Arabic already gives you, what is new, and the Klovers path from Hangul to Level 6 with a teacher who explains in Arabic.",
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
              {tr("Conversation Café · For Arabic speakers", "مقهى المحادثة · للناطقين بالعربية")}
            </span>
            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">
              {tr("Learning Korean when your first language is Arabic", "تعلُّم الكورية لمن لغته الأم العربية")}
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-ivory/80 leading-relaxed">
              {tr(
                "Some of it will feel familiar, some of it is new. Here is which is which, and how we teach it — with explanations in Arabic.",
                "بعضها سيبدو مألوفًا، وبعضها جديد. هنا يتّضح هذا من ذاك، وطريقة تدريسه، بشرح بالعربية.",
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="rounded-full font-bold">
                <Link to="/free-trial">
                  {tr("Book a free class", "حجز حصة مجانية")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full bg-transparent text-ivory border-ivory/40 hover:bg-ivory/10">
                <Link to="/placement-test">{tr("Find your level", "معرفة المستوى")}</Link>
              </Button>
            </div>
            {/* Story scene under the buttons, so it never pushes them down. */}
            <img
              src="/assets/story/world-conversation-cafe.webp"
              alt={tr("The Conversation Café from the Klovers story, where friends practise Korean together", "مقهى المحادثة من قصة كلوفرز، حيث يتدرّب الأصدقاء على الكورية معًا")}
              width={1600}
              height={900}
              decoding="async"
              className="mt-10 w-full aspect-[16/7] rounded-3xl border border-ivory/15 object-cover"
            />
          </div>
        </section>

        {/* What feels familiar */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              {tr("What Arabic already gives you", "ما تقدّمه العربية مسبقًا")}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {COMPARISONS.map((c) => (
                <div key={c.titleEn} className={card}>
                  <h3 className="text-lg font-bold text-foreground">{isAr ? c.titleAr : c.titleEn}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{isAr ? c.bodyAr : c.bodyEn}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-muted px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{tr("Arabic", "العربية")}</p>
                      <p className="mt-1 font-bold text-foreground" dir="rtl" lang="ar">{c.arabic}</p>
                    </div>
                    <div className="rounded-xl bg-klovers-yellow px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal/80">{tr("Korean", "الكورية")}</p>
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
              {tr("What will be new", "ما الجديد")}
            </h2>
            <ul className="space-y-3">
              {DIFFERENCES.map((d) => (
                <li key={d.en} className="flex items-start gap-3 text-foreground">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-klovers-green ring-1 ring-foreground/25" aria-hidden="true" />
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
                [tr("Levels 1 to 6", "المستويات من ١ إلى ٦"), tr("24 classes per level, about 6 months each", "٢٤ حصة لكل مستوى، نحو ٦ أشهر لكل مستوى")],
                [tr("One class a week", "حصة في الأسبوع"), tr("60 minutes, live, in a small group or privately", "٦٠ دقيقة، مباشرة، في مجموعة صغيرة أو بشكل فردي")],
              ].map(([title, body]) => (
                <div key={title} className={card}>
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-base text-foreground/80 leading-relaxed">
              {tr(
                "Your teacher is Reham Elshrkawy, an Al-Alsun Korean language and literature graduate who has taught Korean for 13 years. She explains in Arabic or English and compares Korean with Arabic wherever that makes a point clearer. In Egypt: bank transfer, Vodafone Cash or InstaPay, with a receipt upload; the subscription is activated after a manual check. Outside Egypt: card payment through Stripe, activated automatically.",
                "المعلمة ريهام الشرقاوي، خريجة كلية الألسن قسم اللغة الكورية وآدابها، وتدرّس الكورية منذ ١٣ عامًا. تشرح بالعربية أو الإنجليزية، وتقارن الكورية بالعربية حين يوضّح ذلك الفكرة. داخل مصر: تحويل بنكي أو فودافون كاش أو إنستا باي، مع رفع الإيصال، ويُفعَّل الاشتراك بعد مراجعة يدوية. خارج مصر: الدفع بالبطاقة عبر Stripe ويُفعَّل تلقائيًا.",
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="rounded-full font-bold">
                <Link to="/free-trial">
                  {tr("Book a free class", "حجز حصة مجانية")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full">
                <Link to="/courses">{tr("See all levels", "عرض كل المستويات")}</Link>
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

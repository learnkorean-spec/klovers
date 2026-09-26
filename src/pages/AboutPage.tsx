import { useSEO } from "@/hooks/useSEO";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import rehamKorea1 from "@/assets/reham-korea-1.jpg";
import rehamKorea2 from "@/assets/reham-korea-2.jpg";
import {
  RATING,
  STUDENTS_TAUGHT,
  TEACHING_YEARS,
  TEACHING_YEARS_COUNT,
  withoutUnsupportedClaims, toArabicDigits } from "@/lib/trustFigures";

// Figures come from @/lib/trustFigures. This strip used to say 12+ years,
// 500+ students and a 4.9 rating with no source - three numbers no other page
// agreed with (audit, 23 Sep 2026).
const TRUST_STATS = [
  { value: TEACHING_YEARS, label: "Years Teaching", valueAr: `${TEACHING_YEARS_COUNT}+`, labelAr: "عامًا من التدريس" },
  { value: STUDENTS_TAUGHT, label: "Students Taught", valueAr: STUDENTS_TAUGHT, labelAr: "طالب تعلّموا مع المعلّمة" },
  { value: `${RATING.value} ★`, label: `From ${RATING.count} ${RATING.source} reviews`, valueAr: `${RATING.value} ★`, labelAr: `من ${RATING.count} تقييمات على جوجل` },
  { value: "EN · AR", label: "Classes in English or Arabic", valueAr: "عربي · إنجليزي", labelAr: "لغة الشرح في الحصص" },
  { value: "Hangul → 6", label: "Levels", valueAr: "الهانغول ← ٦", labelAr: "المستويات" },
];

const AboutPage = () => {
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "من نحن" : "About Us",
    description: isAr
      ? `أسّست كلوفرز ريهام الشرقاوي، خريجة الألسن قسم اللغة والأدب الكوري، وتدرّس الكورية منذ ${toArabicDigits(TEACHING_YEARS_COUNT)} عامًا لأكثر من ${toArabicDigits(STUDENTS_TAUGHT.replace("+", ""))} طالب.`
      : "Klovers was founded by Reham Elshrkawy, an Al-Alsun Korean language and literature graduate who has taught Korean for 13 years and more than 200 students.",
    canonical: "https://kloversegy.com/about",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "about-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "url": "https://kloversegy.com/about",
      "name": "About Klovers",
      "description": "Klovers was founded by Reham Elshrkawy, an Al-Alsun Korean language and literature graduate who has taught Korean for 13 years.",
      "mainEntity": { "@id": "https://kloversegy.com/#organization" }
    });
    document.head.appendChild(script);
    return () => { document.getElementById("about-schema")?.remove(); };
  }, []);

  // The experience list still comes from translations.ts, which carries a
  // "high student pass rates" bullet nothing measures. It renders as plain
  // TOPIK exam preparation instead - see withoutUnsupportedClaims.
  const experienceItems = (tArray("aboutPage", "experience.items") as string[]).map(withoutUnsupportedClaims);

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground text-center mb-4">
              {t("aboutPage", "title")}
            </h1>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto text-base md:text-lg">
              {isAr ? `أسّستها ريهام الشرقاوي، خريجة الألسن قسم اللغة الكورية، وتدرّس الكورية منذ ${toArabicDigits(TEACHING_YEARS_COUNT)} عامًا.` : `Founded by Reham Elshrkawy, an Al-Alsun Korean graduate who has taught Korean for ${TEACHING_YEARS_COUNT} years.`}
            </p>

            {/* Trust stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-3xl mx-auto mb-12">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="text-center bg-card border border-border rounded-xl px-4 py-4">
                  <div className="text-2xl font-bold text-foreground">{isAr ? toArabicDigits(s.valueAr) : s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{isAr ? toArabicDigits(s.labelAr) : s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
              <div className="rounded-xl overflow-hidden shadow-md">
                <img src={rehamKorea1} alt={isAr ? "ريهام الشرقاوي في زيارة لمعمار كوري تقليدي" : "Reham Elshrkawy visiting traditional Korean architecture"} className="w-full h-72 object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-md">
                <img src={rehamKorea2} alt={isAr ? "ريهام الشرقاوي على ساحل كوري" : "Reham Elshrkawy at the Korean seaside"} className="w-full h-72 object-cover" />
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-12">
              {/* How a Klovers class feels, in the story style: the two friends
                  and Cluby at the café table. Reham's own photos above stay the
                  proof of who teaches; this is only the mood. */}
              <figure className="overflow-hidden rounded-3xl border border-border bg-ivory dark:bg-muted">
                <img
                  src="/assets/cluby/cafe.webp"
                  alt={isAr ? "صديقان يدرسان الكورية مع كلوبي في مقهى" : "Two friends and Cluby studying Korean together at a café"}
                  width={1200}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/9] w-full object-cover"
                />
                <figcaption className="px-5 py-4 text-sm font-semibold text-charcoal dark:text-foreground">
                  {isAr ? "هكذا يبدو التعلّم مع كلوفرز: أصدقاء حول طاولة واحدة، وخطوة جديدة كل أسبوع." : "How learning with Klovers feels: friends at one table, one new step every week."}
                </figcaption>
              </figure>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "story.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("aboutPage", "story.content")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "philosophy.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("aboutPage", "philosophy.content")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "experience.title")}
                  </h2>
                  <ul className="space-y-3">
                    {experienceItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Mid-page CTA */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4 text-center max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">{isAr ? "البداية الآن" : "Ready to start?"}</p>
            {/* Was "Join thousands of students learning Korean". The figure is
                200+, and it counts students Reham has taught, not a crowd on
                this site. */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {isAr ? `التعلّم مع معلّمة درّست أكثر من ${toArabicDigits(STUDENTS_TAUGHT.replace("+", ""))} طالب خلال ${toArabicDigits(TEACHING_YEARS_COUNT)} عامًا` : `Learn with a teacher who has taught ${STUDENTS_TAUGHT} students over ${TEACHING_YEARS_COUNT} years`}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              {isAr ? "نقطة البداية غير واضحة؟ اختبار تحديد المستوى المجاني يوضّحها." : "Not sure where to begin? The free placement test shows where to start."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/placement-test">{isAr ? "اختبار المستوى المجاني" : "Free Placement Test"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">{isAr ? "الأسعار" : "View Pricing"}</Link>
              </Button>
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;

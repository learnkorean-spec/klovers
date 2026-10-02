import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent } from "@/lib/leadTracking";
import PriceTeaser from "@/components/PriceTeaser";
import { toArabicDigits } from "@/lib/trustFigures";

/**
 * "How we teach" - four steps.
 *
 * 23 Sep 2026: the steps are written here, not read from
 * translations.ts `howItWorks.steps`. Step four there was "TOPIK-Tracked
 * Progress", and TOPIK is off the homepage by decision; translations.ts is too
 * large to edit safely with the tooling available, so the homepage copy lives
 * with the component (same approach as PricingSection's `tr`). The key is left
 * in translations.ts for any other page that reads it.
 *
 * 23 Sep 2026 (mobile): two cards per row on phones. Stacked one per row the
 * section measured 1,803px at 375px wide.
 *
 * 24 Sep 2026: no flat characters on the homepage - the step icons are
 * objects only, and the first-class box carries the painted café scene with
 * Cluby, its edges dissolved by a radial mask so it meets the page.
 */
const STEPS: { icon: KloverIconName; en: [string, string]; ar: [string, string] }[] = [
  {
    icon: "flashcard-ga",
    en: ["Clear Explanations", "Every point explained simply, in English or Arabic, so you understand instead of memorizing."],
    ar: ["شرح واضح", "شرح كل نقطة ببساطة، بالعربية أو الإنجليزية، للفهم لا للحفظ."],
  },
  {
    icon: "chat-annyeong",
    en: ["Small Groups", "Small enough that you speak in every class and get real personal attention."],
    ar: ["مجموعات صغيرة", "مجموعة صغيرة، فيتحدّث كل طالب في كل حصة وينال اهتمامًا حقيقيًا."],
  },
  {
    icon: "lightbulb-sprout",
    en: ["Instant Feedback", "Your pronunciation and sentences are corrected live, during the class."],
    ar: ["تصحيح فوري", "تصحيح النطق والجمل مباشرة أثناء الحصة."],
  },
  {
    icon: "growth-chart",
    en: ["A Clear Path", "Hangul first, then Levels 1 to 6. You always know what comes next."],
    ar: ["مسار واضح", "الهانغول أولًا، ثم المستويات من ١ إلى ٦، والخطوة التالية واضحة دائمًا."],
  },
];

/** Soft radial edge: inset images dissolve into the surface they sit on. */
const SOFT_EDGE = {
  WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 58%, transparent 100%)",
  maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 58%, transparent 100%)",
};

const HowItWorks = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-16 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3">
            {t("howItWorks", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {t("howItWorks", "subtitle")}
          </p>
        </div>

        {/* Step order follows the reading direction: 1→4 left-to-right in
            English, right-to-left in Arabic (grid inherits the page dir). */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-5xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
          {STEPS.map((step, index) => {
            const [title, description] = isAr ? step.ar : step.en;
            return (
              // Wrapper carries the relative context so the badge is NOT clipped by the Card
              <div key={step.icon} className="relative pt-3">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-charcoal/25">
                    {isAr ? toArabicDigits(index + 1) : index + 1}
                  </span>
                </div>
                <Card className="group hover:shadow-md transition-all duration-300 border-border hover:border-primary/40 text-center h-full">
                  <CardContent className="pt-7 pb-4 px-3 sm:pt-8 sm:pb-6 sm:px-4">
                    {/* Ivory dome: the drawings need a light surface to keep their
                        outline; on dark they stand on the card directly. */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-ivory dark:bg-transparent border border-charcoal/15 dark:border-transparent flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
                      <KloverIcon name={step.icon} className="h-9 w-9 sm:h-12 sm:w-12" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1.5 sm:mb-2 text-sm md:text-base" dir={isAr ? "rtl" : "ltr"}>{title}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed" dir={isAr ? "rtl" : "ltr"}>{description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* "What your first class looks like" — pedagogy + trust. The café
            scene sits on the start side on lg+, above the bullets on phones. */}
        <div className="max-w-4xl mx-auto mt-10 md:mt-12 bg-background border border-border rounded-2xl p-5 sm:p-6">
          <p className="text-center mb-4">
            <span className="inline-block bg-klovers-yellow text-charcoal text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              {isAr ? "ماذا يحدث في الحصة الأولى" : "What your first class looks like"}
            </span>
          </p>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-6">
            <img
              src="/assets/cluby/cafe.webp"
              alt={isAr ? "صديقان مع كلوبي يذاكران الكورية على طاولة في مقهى" : "Two friends and Cluby studying Korean together at a café table"}
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              className="mx-auto h-auto w-full max-w-md lg:max-w-none"
              style={SOFT_EDGE}
            />
            <ul className="space-y-2.5">
              {(isAr ? [
                "تقديم النفس بالكورية، حتى دون معرفة أي حرف",
                "قراءة أول ١٠ حروف هانغول ونطقها نطقًا صحيحًا",
                "محادثة قصيرة مباشرة مع باقي الطلاب",
                "تحديد المستوى وشرح الخطوة التالية من المعلمة",
              ] : [
                "Introduce yourself in Korean — even if you know zero right now",
                "Read your first 10 Hangul characters with correct pronunciation",
                "Have a short live exchange with other students",
                "Your teacher identifies your level and maps out your next steps",
              ]).map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-klovers-green ring-1 ring-foreground/25" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Price, then the CTA - so the visitor meets the cost before the ask,
            not after it. The number is read from the real price table. */}
        <div className="text-center mt-8 space-y-4">
          <PriceTeaser source="how_it_works" />
          <Button
            size="lg"
            asChild
            className="gap-2 text-base font-bold h-12 px-8 rounded-full"
            onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "how_it_works_cta", metadata: { language } }); } catch {} }}
          >
            <Link to="/free-trial">
              {isAr ? "حجز حصة مجانية" : "Book a Free Class"}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

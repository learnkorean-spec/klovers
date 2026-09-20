import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent } from "@/lib/leadTracking";

// Same order as `howItWorks.steps`: Clear Explanations, Max 8 Students,
// Instant Feedback, TOPIK-Tracked Progress.
const stepIcons: KloverIconName[] = [
  "flashcard-ga",
  "student-girl-heart",
  "student-boy-thumbsup",
  "growth-chart",
];

const HowItWorks = () => {
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  const steps = tArray("howItWorks", "steps") as { title: string; description: string }[];

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3">
            {t("howItWorks", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {t("howItWorks", "subtitle")}
          </p>
        </div>

        {/* dir="ltr" keeps step order 1→4 left-to-right even in RTL locales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto" dir="ltr">
          {steps.map((step, index) => {
            const icon = stepIcons[index];
            return (
              // Wrapper carries the relative context so the badge is NOT clipped by the Card
              <div key={index} className="relative pt-3">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-charcoal/25">
                    {index + 1}
                  </span>
                </div>
                <Card className="group hover:shadow-md transition-all duration-300 border-border hover:border-primary/40 text-center h-full">
                  <CardContent className="pt-8 pb-6 px-4">
                    {/* Ivory dome: the drawings need a light surface to keep their
                        outline; on dark they stand on the card directly. */}
                    <div className="w-16 h-16 rounded-2xl bg-ivory dark:bg-transparent border border-charcoal/15 dark:border-transparent flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                      {icon && <KloverIcon name={icon} className="h-12 w-12" />}
                    </div>
                    {/* dir="auto" lets each card's text flow in the document's language direction */}
                    <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base" dir="auto">{step.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed" dir="auto">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* "What your first class looks like" — pedagogy + trust.
            The kicker used to be text-primary: brand yellow as TEXT on a light
            card, which the concept board rules out and which measured under
            2:1. Yellow is a surface here instead — the marker chip. */}
        <div className="max-w-2xl mx-auto mt-12 bg-background border border-border rounded-2xl p-6">
          <p className="text-center mb-4">
            <span className="inline-block bg-klovers-yellow text-charcoal text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              {isAr ? "ماذا يحدث في أول حصة" : "What your first class looks like"}
            </span>
          </p>
          <ul className="space-y-2.5">
            {(isAr ? [
              "تقديم نفسك بالكورية — حتى لو مبتعرفش حرف واحد",
              "تقرأ أول ١٠ أحرف هانغل وتعرف كيف تلفظها",
              "محادثة قصيرة مع باقي الطلاب",
              "المعلمة تحدد مستواك وتشرحلك الخطوة الجاية",
            ] : [
              "Introduce yourself in Korean — even if you know zero right now",
              "Read your first 10 Hangul characters with correct pronunciation",
              "Have a short live exchange with other students",
              "Your teacher identifies your level and maps out your next steps",
            ]).map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-charcoal/45 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA — one wording for this ask across the page.
            `howItWorks.cta` said "Try It Free — First Class on Us", one of six
            different labels for the same button; they now all render
            hero.startNow. The key stays in translations.ts, unused, rather than
            deleted — an unused key costs nothing and other pages may want it. */}
        <div className="text-center mt-8">
          <Button
            size="lg"
            asChild
            className="gap-2 text-base font-bold h-12 px-8 rounded-full"
            onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "how_it_works_cta" }); } catch {} }}
          >
            <Link to="/free-trial">
              {t("hero", "startNow")}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

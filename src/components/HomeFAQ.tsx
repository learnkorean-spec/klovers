import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Four questions a first-time visitor asks before booking a free class.
 *
 * The answers are the pricingPage.faq* strings that /pricing already shows, in
 * both languages - this adds no new claim to the site. Native <details> so the
 * text is in the DOM for crawlers and opens without JavaScript.
 */
const FAQ_KEYS = [1, 5, 6, 2] as const;

const HomeFAQ = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section id="home-faq" className="py-16 md:py-20 px-4" aria-labelledby="home-faq-title">
      <div className="max-w-2xl mx-auto">
        <h2 id="home-faq-title" className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          {isAr ? "أسئلة قبل ما تبدأ" : "Questions Before You Start"}
        </h2>
        <div className="space-y-3">
          {FAQ_KEYS.map((n) => (
            <details key={n} className="group bg-card border border-border rounded-xl overflow-hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-sm text-foreground hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                <span>{t(`pricingPage.faq${n}Q`)}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="border-t border-border px-5 pb-4 pt-3 text-sm text-muted-foreground">
                {t(`pricingPage.faq${n}A`)}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link to="/faq" className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline underline-offset-4">
            {isAr ? "كل الأسئلة الشائعة" : "See all questions"}
          </Link>
        </p>
      </div>
    </section>
  );
};

export default HomeFAQ;

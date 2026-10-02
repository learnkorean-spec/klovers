import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Four questions a first-time visitor asks before booking a free class.
 *
 * The answers are the pricingPage.faq* strings that /pricing already shows, in
 * both languages - this adds no new claim to the site. Native <details> so the
 * text is in the DOM for crawlers and opens without JavaScript.
 *
 * 3 Oct 2026: the four Q&As now ship as FAQPage JSON-LD as well. They were
 * already visible text with nothing machine-readable behind them, which is the
 * one shape a question should never take - /pricing, /faq, /topik-exam-
 * preparation and every blog post already declare theirs. Built from the same
 * `t()` calls the <details> render, so the schema and the page cannot drift.
 * No static FAQPage exists on "/" or "/ar" (see the route table in
 * scripts/prerender-meta.mjs), so this is an addition, not a second copy;
 * if one is ever prerendered, lib/jsonLdDedupe.ts drops the id-less one.
 */
const FAQ_KEYS = [1, 5, 6, 2] as const;

const HomeFAQ = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // Serialised rather than the raw strings so the effect below keys off a
  // value, not an identity - otherwise a re-created `t` would re-append the
  // script on every render.
  const faqJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map((n) => ({
      "@type": "Question",
      name: t(`pricingPage.faq${n}Q`),
      acceptedAnswer: { "@type": "Answer", text: t(`pricingPage.faq${n}A`) },
    })),
  });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "home-faq-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = faqJson;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [faqJson]);

  return (
    <section id="home-faq" className="py-16 md:py-20 px-4" aria-labelledby="home-faq-title">
      <div className="max-w-2xl mx-auto">
        <h2 id="home-faq-title" className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          {isAr ? "أسئلة قبل البدء" : "Questions Before You Start"}
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
